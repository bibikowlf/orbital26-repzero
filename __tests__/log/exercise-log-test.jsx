import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import ExerciseLog, { getWeekRangeLabel, getCurrentWeekDays } from '../../app/(tabs)/(log)/exercise-log'
import { supabase } from '../../lib/supabase'
import { Alert } from 'react-native'

let mockActiveChains = {}
const mockUserSubId = 'user-abc-123'
const mockDateToday = new Date().toISOString().split('T')[0]

const mockLogData = {
  id: 'log-999',
  user_id: mockUserSubId,
  log_date: mockDateToday,
  exercises: [{ name: 'Squats', sets: '4', reps: '8', weight_kg: '100' }],
  notes: 'Felt heavy',
  duration_minutes: 45
}

const mockProfilePlan = {
  workout_plan: [
    {
      day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      exercises: [{ name: 'Deadlift', sets: 3, reps: '5' }]
    }
  ]
}

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn((table) => {
      if (!mockActiveChains[table]) {
        const builder = {
          select: jest.fn().mockImplementation(() => builder),
          eq: jest.fn().mockImplementation(() => builder),
          single: jest.fn().mockImplementation(() => builder),
          delete: jest.fn().mockImplementation(() => builder),
          upsert: jest.fn().mockImplementation(() => builder),
          then: jest.fn().mockImplementation((resolve) => {
            return Promise.resolve(resolve({ data: null, error: null }))
          })
        }
        mockActiveChains[table] = builder
      }
      return mockActiveChains[table]
    })
  }
}))

jest.mock('../../hooks/auth-context', () => ({
  useAuthContext: () => ({ claims: { sub: mockUserSubId } }),
}))

jest.mock('../../functions/numeric-input', () => ({
  handleNumericInput: (val) => val
}))

jest.mock('expo-router', () => ({
  useFocusEffect: (cb) => cb()
}))

describe('GetCurrentWeekDays Test', () => {
test('returns exactly 7 days', () => {
    const days = getCurrentWeekDays(0)
    expect(days.length).toBe(7)
  })

  test('first day label is Mon', () => {
    const days = getCurrentWeekDays(0)
    expect(days[0].label).toBe('Mon')
  })

  test('last day label is Sun', () => {
    const days = getCurrentWeekDays(0)
    expect(days[6].label).toBe('Sun')
  })

  test('dateString is in YYYY-MM-DD format', () => {
    const days = getCurrentWeekDays(0)
    days.forEach(day => {
      expect(day.dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  test('offset=1 shifts week forward by 7 days', () => {
    const current = getCurrentWeekDays(0)
    const next = getCurrentWeekDays(1)
    const currentMonday = new Date(current[0].dateString)
    const nextMonday = new Date(next[0].dateString)
    const diff = (nextMonday - currentMonday) / (1000 * 60 * 60 * 24)
    expect(diff).toBe(7)
  })

  test('offset=-1 shifts week back by 7 days', () => {
    const current = getCurrentWeekDays(0)
    const prev = getCurrentWeekDays(-1)
    const currentMonday = new Date(current[0].dateString)
    const prevMonday = new Date(prev[0].dateString)
    const diff = (currentMonday - prevMonday) / (1000 * 60 * 60 * 24)
    expect(diff).toBe(7)
  })

  test('all 7 days have sequential dates', () => {
    const days = getCurrentWeekDays(0)
    for (let i = 1; i < 7; i++) {
      const prev = new Date(days[i - 1].dateString)
      const curr = new Date(days[i].dateString)
      const diff = (curr - prev) / (1000 * 60 * 60 * 24)
      expect(diff).toBe(1)
    }
  })
})

describe('GetWeekRangeLabel Test', () => {
  test('returns empty string for empty array', () => {
    const result = getWeekRangeLabel([])
    expect(result).toBe('')
  })

  test('returns a non-empty string for valid week', () => {
    const days = getCurrentWeekDays(0)
    const result = getWeekRangeLabel(days)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  test('includes year in the label', () => {
    const days = getCurrentWeekDays(0)
    const result = getWeekRangeLabel(days)
    const year = new Date().getFullYear().toString()
    expect(result).toContain(year)
  })

  test('includes dash separator between dates', () => {
    const days = getCurrentWeekDays(0)
    const result = getWeekRangeLabel(days)
    expect(result).toContain('–')
  })

  test('shows both month names when week spans two months', () => {
    const days = [
      { dateString: '2025-06-30' },
      { dateString: '2025-07-01' },
      { dateString: '2025-07-02' },
      { dateString: '2025-07-03' },
      { dateString: '2025-07-04' },
      { dateString: '2025-07-05' },
      { dateString: '2025-07-06' },
    ]
    const result = getWeekRangeLabel(days)
    expect(result).toContain('June')
    expect(result).toContain('July')
  })

  test('shows single month name when week is within one month', () => {
    const days = [
      { dateString: '2025-06-02' },
      { dateString: '2025-06-03' },
      { dateString: '2025-06-04' },
      { dateString: '2025-06-05' },
      { dateString: '2025-06-06' },
      { dateString: '2025-06-07' },
      { dateString: '2025-06-08' },
    ]
    const result = getWeekRangeLabel(days)
    expect(result).toContain('June')
    expect(result.indexOf('June')).toBe(result.lastIndexOf('June'))
  })
})

describe('ExerciseLog Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockActiveChains = {}
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})

    mockActiveChains['workout_logs'] = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockImplementation(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((res) => res({ data: null, error: null }))
    }

    mockActiveChains['profiles'] = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockImplementation(() => Promise.resolve({ data: null, error: null })),
      then: jest.fn().mockImplementation((res) => res({ data: null, error: null }))
    }
  })

  it('displays correct log for one date', async () => {
    mockActiveChains['workout_logs'].single = jest.fn().mockResolvedValue({ data: mockLogData, error: null })

    await act(async () => render(<ExerciseLog />))

    await waitFor(() => {
      expect(screen.getByText('Squats')).toBeTruthy()
      expect(screen.getByText(/4 sets × 8 reps/i)).toBeTruthy()
      expect(screen.getByText('45 minutes')).toBeTruthy()
    })
  })

  it('exercise is added after adding it', async () => {
    await act(async () => render(<ExerciseLog />))

    const addExerciseBtn = screen.getByText('+ Add Exercise')
    await act(async () => fireEvent.press(addExerciseBtn))

    const inputs = screen.getAllByPlaceholderText('Exercise name')
    expect(inputs).toHaveLength(1)
  })

  it('exercise is deleted after deleting it', async () => {
    mockActiveChains['workout_logs'].single = jest.fn().mockResolvedValue({ data: mockLogData, error: null })

    await act(async () => render(<ExerciseLog />))

    const editLogBtn = screen.getByText(/Edit Log/i)
    await act(async () => fireEvent.press(editLogBtn))

    const removeBtn = screen.getByText('Remove')
    await act(async () => fireEvent.press(removeBtn))

    expect(screen.queryByPlaceholderText('Exercise name')).toBeNull()
  })

  it('log is deleted after deleting it', async () => {
    mockActiveChains['workout_logs'].single = jest.fn().mockResolvedValue({ data: mockLogData, error: null })
    mockActiveChains['workout_logs'].delete = jest.fn().mockReturnThis()

    await act(async () => render(<ExerciseLog />))
    
    await act(async () => fireEvent.press(screen.getByText(/Edit Log/i)))
    await act(async () => fireEvent.press(screen.getByText('Delete Log')))

    const deleteAction = Alert.alert.mock.calls[0][2].find(btn => btn.text === 'Delete')
    await act(async () => deleteAction.onPress())

    expect(supabase.from).toHaveBeenCalledWith('workout_logs')
    expect(Alert.alert).toHaveBeenCalledWith('Deleted', 'Workout log deleted.')
  })

  it('log is imported after pressing import from exercise plan', async () => {
    mockActiveChains['profiles'].single = jest.fn().mockResolvedValue({ data: mockProfilePlan, error: null })

    await act(async () => render(<ExerciseLog />))

    const importBtn = screen.getByText(/Import from Workout Plan/i)
    await act(async () => fireEvent.press(importBtn))

    await waitFor(() => expect(screen.getByText('Import These Exercises')).toBeTruthy())
    await act(async () => fireEvent.press(screen.getByText('Import These Exercises')))

    const confirmAction = Alert.alert.mock.calls[0][2].find(btn => btn.text === 'Import')
    await act(async () => confirmAction.onPress())

    expect(screen.getByDisplayValue('Deadlift')).toBeTruthy()
  })

  it('log is saved after pressing on save log', async () => {
    mockActiveChains['workout_logs'].single = jest.fn().mockResolvedValue({ data: null, error: null })
    mockActiveChains['profiles'].single = jest.fn().mockResolvedValue({ data: { workout_plan: [] }, error: null })

    await act(async () => render(<ExerciseLog />))

    const addExerciseBtn = screen.getByText('+ Add Exercise')
    await act(async () => fireEvent.press(addExerciseBtn))

    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('Exercise name'), 'Bench Press'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('Sets'), '4'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('Reps'), '12'))

    const saveBtn = screen.getByText('Save Log')
    await act(async () => fireEvent.press(saveBtn))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('workout_logs')
      expect(Alert.alert).toHaveBeenCalledWith('Saved', 'Workout log saved!')
    })
  })

  it('empty log with no exercise triggers alert and is not saved', async () => {
    mockActiveChains['workout_logs'].single = jest.fn().mockResolvedValue({ data: null, error: null })
    mockActiveChains['profiles'].single = jest.fn().mockResolvedValue({ data: { workout_plan: [] }, error: null })

    await act(async () => render(<ExerciseLog />))

    const saveBtn = screen.getByText('Save Log')
    await act(async () => fireEvent.press(saveBtn))

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('No Exercises', expect.any(String)))
  })

  it('empty exercise with no name triggers alert and is not saved', async () => {
    mockActiveChains['workout_logs'].single = jest.fn().mockResolvedValue({ data: null, error: null })
    mockActiveChains['profiles'].single = jest.fn().mockResolvedValue({ data: { workout_plan: [] }, error: null })

    await act(async () => render(<ExerciseLog />))

    const addExerciseBtn = screen.getByText('+ Add Exercise')
    await act(async () => fireEvent.press(addExerciseBtn))

    const saveBtn = screen.getByText('Save Log')
    await act(async () => fireEvent.press(saveBtn))

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('No Exercises', expect.any(String)))
  })

  it('empty exercise with no sets triggers alert and is not saved', async () => {
    mockActiveChains['workout_logs'].single = jest.fn().mockResolvedValue({ data: null, error: null })
    mockActiveChains['profiles'].single = jest.fn().mockResolvedValue({ data: { workout_plan: [] }, error: null })

    await act(async () => render(<ExerciseLog />))

    const addExerciseBtn = screen.getByText('+ Add Exercise')
    await act(async () => fireEvent.press(addExerciseBtn))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('Exercise name'), 'Bench Press'))
    
    const saveBtn = screen.getByText('Save Log')
    await act(async () => fireEvent.press(saveBtn))

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('No Exercises', expect.any(String)))
  })

  it('empty exercise with no reps triggers alert and is not saved', async () => {
    mockActiveChains['workout_logs'].single = jest.fn().mockResolvedValue({ data: null, error: null })
    mockActiveChains['profiles'].single = jest.fn().mockResolvedValue({ data: { workout_plan: [] }, error: null })

    await act(async () => render(<ExerciseLog />))

    const addExerciseBtn = screen.getByText('+ Add Exercise')
    await act(async () => fireEvent.press(addExerciseBtn))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('Exercise name'), 'Bench Press'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('Sets'), '4'))
    
    const saveBtn = screen.getByText('Save Log')
    await act(async () => fireEvent.press(saveBtn))

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('No Exercises', expect.any(String)))
  })
})