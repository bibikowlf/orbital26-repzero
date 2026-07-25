import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import GeneratePlan, { addExerciseToDay, deleteExerciseFromDay, updateExerciseField } from '../../app/(tabs)/(plan)/generate-plan'
import { supabase } from '../../lib/supabase'
import { Alert } from 'react-native'

let mockActiveChains = {}
const mockUserSubId = 'mock-user-555'

const mockInitialPlan = [
  {
    day: 'Monday',
    exercises: [{ name: 'Bench Press', sets: 3, reps: '10', notes: 'Chest focus' }]
  }
]

const mockEdgeFunctionResponse = mockInitialPlan

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn((table) => {
      if (!mockActiveChains[table]) {
        const builder = {
          select: jest.fn().mockImplementation(() => builder),
          eq: jest.fn().mockImplementation(() => builder),
          single: jest.fn().mockImplementation(() => builder),
          update: jest.fn().mockImplementation(() => builder),
          then: jest.fn().mockImplementation((resolve) => {
            return Promise.resolve(resolve({ data: null, error: null }))
          })
        }
        mockActiveChains[table] = builder
      }
      return mockActiveChains[table]
    }),
    functions: {
      invoke: jest.fn()
    }
  }
}))

jest.mock('../../hooks/auth-context', () => ({
  useAuthContext: () => ({ claims: { sub: mockUserSubId } }),
}))

describe('GeneratePlan Function Unit Test', () => {
  const MOCK_PLAN = [
    {
        day: 'Monday: Push Day',
        exercises: [
        { name: 'Bench Press', sets: 4, reps: '8-10', notes: '' },
        { name: 'Shoulder Press', sets: 3, reps: '10-12', notes: '' },
        ],
    },
    {
        day: 'Tuesday: Pull Day',
        exercises: [
        { name: 'Deadlift', sets: 4, reps: '6-8', notes: '' },
        ],
    },
  ]

  it('exercise is added after adding it when customizing', () => {
    const result1 = addExerciseToDay(MOCK_PLAN, 0)
    expect(result1[0].exercises.length).toBe(3)
    expect(result1[1].exercises.length).toBe(1)

    const result2 = addExerciseToDay(MOCK_PLAN, 0)
    const newEx = result2[0].exercises[2]
    expect(newEx.name).toBe('')
    expect(newEx.sets).toBe('')
    expect(newEx.reps).toBe('')
    expect(newEx.notes).toBe('')

    const original = JSON.parse(JSON.stringify(MOCK_PLAN))
    addExerciseToDay(MOCK_PLAN, 0)
    expect(MOCK_PLAN[0].exercises.length).toBe(original[0].exercises.length)
  })

  it('exercise is deleted after deleting it when customizing', () => {
    const result1 = deleteExerciseFromDay(MOCK_PLAN, 0, 0)
    expect(result1[0].exercises.length).toBe(1)
    expect(result1[0].exercises[0].name).toBe('Shoulder Press')

    const result2 = deleteExerciseFromDay(MOCK_PLAN, 0, 0)
    expect(result2[1].exercises.length).toBe(1)

    const original = JSON.parse(JSON.stringify(MOCK_PLAN))
    deleteExerciseFromDay(MOCK_PLAN, 0, 0)
    expect(MOCK_PLAN[0].exercises.length).toBe(original[0].exercises.length)
  })

  it('exercise is updated correctly after modifying', () => {
    const result1 = updateExerciseField(MOCK_PLAN, 0, 0, 'name', 'Incline Press')
    expect(result1[0].exercises[0].name).toBe('Incline Press')

    const result2 = updateExerciseField(MOCK_PLAN, 0, 0, 'name', 'Incline Press')
    expect(result2[0].exercises[1].name).toBe('Shoulder Press')

    const result3 = updateExerciseField(MOCK_PLAN, 0, 0, 'name', 'Incline Press')
    expect(result3[1].exercises[0].name).toBe('Deadlift')

    const result4 = updateExerciseField(MOCK_PLAN, 0, 0, 'sets', 5)
    expect(result4[0].exercises[0].sets).toBe(5)

    const original = JSON.parse(JSON.stringify(MOCK_PLAN))
    updateExerciseField(MOCK_PLAN, 0, 0, 'name', 'Incline Press')
    expect(MOCK_PLAN[0].exercises[0].name).toBe(original[0].exercises[0].name)
  })
})

describe('GeneratePlan Unit Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockActiveChains = {}
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    
    mockActiveChains['profiles'] = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockImplementation(() => Promise.resolve({ data: { workout_plan: [] }, error: null })),
      update: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((res) => 
        Promise.res(res({ data: { workout_plan: [] }, error: null })))
    }
  })

  it('generate plan correctly calls function with all information', async () => {
    const mockProfileInfo = { id: mockUserSubId, name: 'John Doe', fitness_level: 'Intermediate' }
    
    mockActiveChains['profiles'].single = jest.fn().mockResolvedValue({ data: mockProfileInfo, error: null })
    
    supabase.functions.invoke.mockResolvedValue({ data: mockEdgeFunctionResponse, error: null })

    await act(async () => render(<GeneratePlan />))

    await act(async () => fireEvent.press(screen.getByText('Generate Plan')))

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('generate-workout', {
        body: { profile: mockProfileInfo }
      })
    })
  })

  it('plan is added correctly after pressing on generate plan', async () => {
    mockActiveChains['profiles'].single = jest.fn().mockResolvedValue({ data: {}, error: null })
    supabase.functions.invoke.mockResolvedValue({ data: mockEdgeFunctionResponse, error: null })

    await act(async () => render(<GeneratePlan />))

    await act(async () => fireEvent.press(screen.getByText('Generate Plan')))

    await waitFor(() => {
      expect(screen.getByText('Bench Press')).toBeTruthy()
      expect(screen.getByText('3 Sets x 10 Reps')).toBeTruthy()
    })
  })

  it('data is updated correctly after pressing on save customization', async () => {
    mockActiveChains['profiles'].single = jest.fn().mockResolvedValue({ 
      data: { workout_plan: mockInitialPlan }, 
      error: null 
    })

    mockActiveChains['profiles'].update = jest.fn().mockReturnThis()
    mockActiveChains['profiles'].eq = jest.fn().mockReturnThis()
    mockActiveChains['profiles'].then = jest.fn().mockImplementation((resolve) => 
      Promise.resolve(resolve({ error: null }))
    )

    await act(async () => render(<GeneratePlan />))
    await waitFor(() => expect(screen.getByText('Modify')).toBeTruthy())

    await act(async () => fireEvent.press(screen.getByText('Modify')))

    await act(async () => fireEvent.press(screen.getByText('Save Changes')))

    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith('Saved', expect.any(String)))
  })
})