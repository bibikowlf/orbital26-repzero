import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import CreateEvent from '../../app/(tabs)/(event)/create-event'
import { isValidDateFormat, isValidTimeFormat, combineDatetime, isFutureDate } from '../../app/(tabs)/(event)/create-event'
import { supabase } from '../../lib/supabase'
import { Alert } from 'react-native'

const mockUserSubId = 'user-123'
let mockInsertTrigger = jest.fn()

const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)
const futureDateStr = tomorrow.toISOString().split('T')[0]

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'mock-user-123' } }, error: null })
    },
    from: jest.fn(() => ({
      insert: mockInsertTrigger
    }))
  }
}))

jest.mock('../../hooks/auth-context', () => ({
  useAuthContext: () => ({ claims: { sub: mockUserSubId } }),
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn() })
}))

describe('CreateEvent Function Unit Test', () => {
  test('isValidDateFormat asserts if a date is valid', () => {
    expect(isValidDateFormat('2025-06-20')).toBe(true)
    expect(isValidDateFormat('20-06-2025')).toBe(false)
    expect(isValidDateFormat('2025/06/20')).toBe(false)
    expect(isValidDateFormat('20250620')).toBe(false)
    expect(isValidDateFormat('2025-13-01')).toBe(false)
    expect(isValidDateFormat('2025-00-01')).toBe(false)
    expect(isValidDateFormat('2025-06-31')).toBe(false)
    expect(isValidDateFormat('2025-06-00')).toBe(false)
    expect(isValidDateFormat('2025-01-31')).toBe(true)
    expect(isValidDateFormat('2025-04-30')).toBe(true)
    expect(isValidDateFormat('2024-02-29')).toBe(true)
    expect(isValidDateFormat('2025-02-29')).toBe(false)
  })

  test('isValidTimeFormat asserts if a time is valid', () => {
    expect(isValidTimeFormat('07:00')).toBe(true)
    expect(isValidTimeFormat('23:59')).toBe(true)
    expect(isValidTimeFormat('00:00')).toBe(true)
    expect(isValidTimeFormat('25:00')).toBe(false)
    expect(isValidTimeFormat('24:00')).toBe(false)
    expect(isValidTimeFormat('12:60')).toBe(false)
    expect(isValidTimeFormat('12:99')).toBe(false)
    expect(isValidTimeFormat('7:00')).toBe(false)
    expect(isValidTimeFormat('0700')).toBe(false)
    expect(isValidTimeFormat('07:0')).toBe(false)
  })

  test('combineDateTime combines date and time', () => {
    const result1 = combineDatetime('2025-06-20', '07:00')
    expect(result1).toBeInstanceOf(Date)
    expect(isNaN(result1)).toBe(false)

    const result2 = combineDatetime('not-a-date', 'bad-time')
    expect(result2).toBeNull()

    const result3 = combineDatetime('2025-06-20', '07:00')
    expect(result3).not.toBeNull()
  })

  test('isFutureDate asserts if date and time is from the future', () => {
    expect(isFutureDate('2099-01-01', '07:00')).toBe(true)
    expect(isFutureDate('2000-01-01', '07:00')).toBe(false)
  })
})

describe('CreateEvent Unit Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    mockInsertTrigger.mockImplementation(() => Promise.resolve({ error: null }))
  })

  it('empty title triggers alert and is not added', async () => {
    await act(async () => render(<CreateEvent />))

    const submitBtn = screen.getByText('Post Event')
    await act(async () => fireEvent.press(submitBtn))

    expect(Alert.alert).toHaveBeenCalledWith('Missing Field', 'Please enter an event title.')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('empty description triggers alert and is not added', async () => {
    await act(async () => render(<CreateEvent />))

    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. Morning Run at East Coast Park'), 'Morning Run'))

    const submitBtn = screen.getByText('Post Event')
    await act(async () => fireEvent.press(submitBtn))

    expect(Alert.alert).toHaveBeenCalledWith('Missing Field', 'Please enter an event description.')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('empty location triggers alert and is not added', async () => {
    await act(async () => render(<CreateEvent />))

    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. Morning Run at East Coast Park'), 'Morning Run'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText("What's the plan?"), 'Fun run outdoor session'))

    const submitBtn = screen.getByText('Post Event')
    await act(async () => fireEvent.press(submitBtn))

    expect(Alert.alert).toHaveBeenCalledWith('Missing Field', 'Please specify a location.')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('empty date triggers alert and is not added', async () => {
    await act(async () => render(<CreateEvent />))

    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. Morning Run at East Coast Park'), 'Morning Run'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText("What's the plan?"), 'Fun run outdoor session'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. East Coast Park'), 'Park Stadium'))

    const submitBtn = screen.getByText('Post Event')
    await act(async () => fireEvent.press(submitBtn))

    expect(Alert.alert).toHaveBeenCalledWith('Missing Field', 'Please enter an event date (YYYY-MM-DD).')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('empty time triggers alert and is not added', async () => {
    await act(async () => render(<CreateEvent />))

    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. Morning Run at East Coast Park'), 'Morning Run'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText("What's the plan?"), 'Fun run outdoor session'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. East Coast Park'), 'Park Stadium'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. 2025-06-20'), futureDateStr))

    const submitBtn = screen.getByText('Post Event')
    await act(async () => fireEvent.press(submitBtn))

    expect(Alert.alert).toHaveBeenCalledWith('Missing Field', 'Please enter an event time (HH:MM).')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('empty category triggers alert and is not added', async () => {
    await act(async () => render(<CreateEvent />))

    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. Morning Run at East Coast Park'), 'Morning Run'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText("What's the plan?"), 'Fun run outdoor session'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. East Coast Park'), 'Park Stadium'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. 07:00'), '08:00'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. 2025-06-20'), futureDateStr))

    const submitBtn = screen.getByText('Post Event')
    await act(async () => fireEvent.press(submitBtn))

    expect(Alert.alert).toHaveBeenCalledWith('Missing Field', 'Please select a category chip.')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('empty custom category triggers alert and is not added', async () => {
    await act(async () => render(<CreateEvent />))

    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. Morning Run at East Coast Park'), 'Morning Run'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText("What's the plan?"), 'Fun run outdoor session'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. East Coast Park'), 'Park Stadium'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. 2025-06-20'), futureDateStr))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. 07:00'), '08:00'))
    await act(async () => fireEvent.press(screen.getByText('Other')))

    const submitBtn = screen.getByText('Post Event')
    await act(async () => fireEvent.press(submitBtn))

    expect(Alert.alert).toHaveBeenCalledWith('Missing Field', 'Please specify your custom category.')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('invalid date triggers alert and is not added', async () => {
    await act(async () => render(<CreateEvent />))

    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. Morning Run at East Coast Park'), 'Morning Run'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText("What's the plan?"), 'Fun run outdoor session'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. East Coast Park'), 'Park Stadium'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. 07:00'), '08:00'))
    await act(async () => fireEvent.press(screen.getByText('Cardio')))

    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. 2025-06-20'), '2026-99-99'))

    const submitBtn = screen.getByText('Post Event')
    await act(async () => fireEvent.press(submitBtn))

    expect(Alert.alert).toHaveBeenCalledWith('Invalid Date', 'Date must be in YYYY-MM-DD format.')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('invalid time triggers alert and is not added', async () => {
    await act(async () => render(<CreateEvent />))

    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. Morning Run at East Coast Park'), 'Morning Run'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText("What's the plan?"), 'Fun run outdoor session'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. East Coast Park'), 'Park Stadium'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. 2025-06-20'), futureDateStr))
    await act(async () => fireEvent.press(screen.getByText('Cardio')))

    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. 07:00'), '25:99'))

    const submitBtn = screen.getByText('Post Event')
    await act(async () => fireEvent.press(submitBtn))

    expect(Alert.alert).toHaveBeenCalledWith('Invalid Time', 'Please use HH:MM format (e.g. 07:00).')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('past date and time triggers alert and is not added', async () => {
    await act(async () => render(<CreateEvent />))

    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. Morning Run at East Coast Park'), 'Morning Run'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText("What's the plan?"), 'Fun run outdoor session'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. East Coast Park'), 'Park Stadium'))
    await act(async () => fireEvent.press(screen.getByText('Cardio')))

    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. 2025-06-20'), '2025-06-20'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. 07:00'), '07:00'))

    const submitBtn = screen.getByText('Post Event')
    await act(async () => fireEvent.press(submitBtn))

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Event date must be in the future.')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('new event is correctly added', async () => {
    await act(async () => render(<CreateEvent />))

    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. Morning Run at East Coast Park'), 'Morning Run'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText("What's the plan?"), 'Fun run outdoor session'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. East Coast Park'), 'Park Stadium'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. 2025-06-20'), futureDateStr))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. 07:00'), '08:00'))
    await act(async () => fireEvent.press(screen.getByText('Cardio')))

    const submitBtn = screen.getByText('Post Event')
    await act(async () => fireEvent.press(submitBtn))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('events')
      expect(mockInsertTrigger).toHaveBeenCalledWith(
        expect.objectContaining({
          creator_id: mockUserSubId,
          title: 'Morning Run',
          category: 'Cardio'
        })
      )
    })
  })
})