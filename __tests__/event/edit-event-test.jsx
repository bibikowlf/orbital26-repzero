import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import MyEventDetail from '../../app/(tabs)/(settings)/my-events-detail'
import { supabase } from '../../lib/supabase'
import { Alert } from 'react-native'

let mockUpdateTrigger = jest.fn()

const mockEventId = 'event-789'
const mockUserId = 'user-123'

const mockInitialEvent = {
  id: mockEventId,
  title: 'Original Title',
  description: 'Original Description',
  location: 'Original Location',
  event_date: '2026-08-20T08:00:00+08:00',
  category: 'Cardio',
  max_attendees: 10,
  event_rsvps: [{ count: 2 }]
}

const mockInitialRsvps = [
  { user_id: 'attendee-1', status: 'going', created_at: '2026-01-01' },
  { user_id: 'attendee-2', status: 'going', created_at: '2026-01-02' }
]

const mockProfiles = [
  { id: 'attendee-1', username: 'runner1' },
  { id: 'attendee-2', username: 'runner2' }
]

const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  update: jest.fn((data) => {
    mockUpdateTrigger(data)
    return mockQueryBuilder
  }),
  single: jest.fn().mockReturnThis(),

  then: function (onFulfilled) {
    const lastTableQueried = supabase.from.mock.results.slice(-1)[0]?.value?._tableName

    let resolvedPayload = { data: null, error: null }
    if (lastTableQueried === 'events') {
      resolvedPayload = { data: mockInitialEvent, error: null }
    } else if (lastTableQueried === 'event_rsvps') {
      resolvedPayload = { data: mockInitialRsvps, error: null }
    } else if (lastTableQueried === 'profiles') {
      resolvedPayload = { data: mockProfiles, error: null }
    }

    return Promise.resolve(resolvedPayload).then(onFulfilled)
  }
}

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn((tableName) => {
      mockQueryBuilder._tableName = tableName
      return mockQueryBuilder
    })
  }
}))

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: mockEventId }),
  useRouter: () => ({ back: jest.fn() })
}))

jest.mock('../../hooks/auth-context', () => ({
  useAuthContext: () => ({ claims: { sub: mockUserId } }),
}))

jest.mock('../../lib/notifications', () => ({
  createNotification: jest.fn()
}))

describe('EditEvent Unit Test', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    mockUpdateTrigger.mockReturnValue({ error: null })

    await act(async () => render(<MyEventDetail />))

    const editBtn = screen.getByText('Edit')
    await act(async () => fireEvent.press(editBtn))
  })

  const submitForm = async () => {
    const saveBtn = screen.getByText('Save')
    await act(async () => fireEvent.press(saveBtn))
  }

  it('Event is updated after editing', async () => {
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('Event title'), 'Updated Gym Session'))
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText("What's the plan?"), 'Lifting heavy weights.'))

    await submitForm()

    expect(mockUpdateTrigger).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Updated Gym Session',
        description: 'Lifting heavy weights.'
      })
    )
    expect(Alert.alert).toHaveBeenCalledWith('Saved', 'Event updated!')
  })

  it('Event cannot be updated to empty title', async () => {
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('Event title'), ''))

    await submitForm()

    expect(Alert.alert).toHaveBeenCalledWith('Missing Field', 'Please enter a title.')
    expect(mockUpdateTrigger).not.toHaveBeenCalled()
  })

  it('Event cannot be updated to empty description', async () => {
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText("What's the plan?"), ''))

    await submitForm()

    expect(Alert.alert).toHaveBeenCalledWith('Missing Field', 'Please enter a description.')
    expect(mockUpdateTrigger).not.toHaveBeenCalled()
  })

  it('Event cannot be updated to empty location', async () => {
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. East Coast Park'), ''))
    await submitForm()
    expect(Alert.alert).toHaveBeenCalledWith('Missing Field', 'Please enter a location.')
    expect(mockUpdateTrigger).not.toHaveBeenCalled()
  })

  it('Event cannot be updated to empty date', async () => {
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. 2025-06-20'), ''))

    await submitForm()

    expect(Alert.alert).toHaveBeenCalledWith('Missing Field', 'Please enter a date (YYYY-MM-DD).')
    expect(mockUpdateTrigger).not.toHaveBeenCalled()
  })

  it('Event cannot be updated to empty time', async () => {
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. 07:00'), ''))

    await submitForm()

    expect(Alert.alert).toHaveBeenCalledWith('Missing Field', 'Please enter a time (HH:MM).')
    expect(mockUpdateTrigger).not.toHaveBeenCalled()
  })

  it('Event cannot be updated to empty custom category', async () => {
    const otherChip = screen.getByText('Other')
    await act(async () => fireEvent.press(otherChip))

    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. Pilates, Boxing'), ''))
    
    await submitForm()

    expect(Alert.alert).toHaveBeenCalledWith('Missing Field', 'Please specify your custom category.')
    expect(mockUpdateTrigger).not.toHaveBeenCalled()
  })

  it('Event cannot be updated to invalid date or time', async () => {
    await act(async () => fireEvent.changeText(screen.getByPlaceholderText('e.g. 2025-06-20'), 'invalid-date-format'))

    await submitForm()
    
    expect(Alert.alert).toHaveBeenCalledWith('Invalid Format', 'Invalid date or time.')
    expect(mockUpdateTrigger).not.toHaveBeenCalled()
  })
})