import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import Events from '../../app/(tabs)/(event)/events'
import { formatEventDate, filterEvents } from '../../app/(tabs)/(event)/events'
import { supabase } from '../../lib/supabase'
import { createNotification } from '../../lib/notifications'
import { Alert } from 'react-native'

const mockUserSubId = 'user-123'

const mockEventsData = [
  {
    id: 'event-1',
    title: 'Morning Running Session',
    description: 'Come join us!',
    category: 'Cardio',
    event_date: '2026-08-20T08:00:00.000Z',
    location: 'East Coast Park',
    creator_id: 'user-456',
    max_attendees: 10,
    profiles: { username: 'runner_pro' },
    event_rsvps: [{ count: 3 }],
    user_rsvp: []
  },
  {
    id: 'event-2',
    title: 'Powerlifting Meet',
    description: 'Heavy triples today.',
    category: 'Strength',
    event_date: '2026-08-19T10:00:00.000Z',
    location: 'Iron Gym',
    creator_id: 'user-789',
    max_attendees: null,
    profiles: { username: 'lift_heavy' },
    event_rsvps: [{ count: 5 }],
    user_rsvp: [{ status: 'going' }]
  }
]

let mockUpsertImplementation = jest.fn()
let mockDeleteImplementation = jest.fn()

const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(), // Added missing chained method
  order: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: { username: 'my_test_user' }, error: null }),
  
  then: function (onFulfilled) {
    return Promise.resolve({ data: mockEventsData, error: null }).then(onFulfilled)
  },

  upsert: mockUpsertImplementation,
  delete: mockDeleteImplementation,
}

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => mockQueryBuilder)
  }
}))

jest.mock('../../hooks/auth-context', () => ({
  useAuthContext: () => ({ claims: { sub: mockUserSubId } }),
}))

jest.mock('expo-router', () => {
  const ReactModule = require('react')
  return {
    useRouter: () => ({ push: jest.fn() }),
    useFocusEffect: (callback) => {
      ReactModule.useEffect(() => {
        callback()
      }, [callback])
    },
  }
})

jest.mock('../../lib/notifications', () => ({
  createNotification: jest.fn()
}))

describe('Events Function Unit Test', () => {
  test('formatEventDate formats day and time string', () => {
    const { day, time } = formatEventDate('2026-08-20T07:00:00+08:00')
    expect(typeof day).toBe('string')
    expect(typeof time).toBe('string')
    expect(day.length).toBeGreaterThan(0)
    expect(time.length).toBeGreaterThan(0)
    expect(time).toContain(':')
  })

  test('filterEvents structures status, category, and date sorting', () => {
    const mockEvents = [
      {
        id: '1',
        title: 'Morning Run',
        category: 'Cardio',
        event_date: '2026-08-20T07:00:00+08:00',
        user_rsvp: [{ status: 'going' }],
      },
      {
        id: '2',
        title: 'Push Day',
        category: 'Strength',
        event_date: '2026-08-22T10:00:00+08:00',
        user_rsvp: [],
      },
      {
        id: '3',
        title: 'Yoga Session',
        category: 'Flexibility',
        event_date: '2026-08-18T08:00:00+08:00',
        user_rsvp: [],
      },
    ]

    const result1 = filterEvents(mockEvents, 'All Events', 'All', 'date_asc')
    expect(result1.length).toBe(3)

    const result2 = filterEvents(mockEvents, 'Going', 'All', 'date_asc')
    expect(result2.length).toBe(1)
    expect(result2[0].id).toBe('1')

    const result3 = filterEvents(mockEvents, 'All Events', 'Strength', 'date_asc')
    expect(result3.length).toBe(1)
    expect(result3[0].title).toBe('Push Day')

    const result4 = filterEvents(mockEvents, 'Going', 'Cardio', 'date_asc')
    expect(result4.length).toBe(1)
    expect(result4[0].id).toBe('1')

    const result5 = filterEvents(mockEvents, 'Going', 'Strength', 'date_asc')
    expect(result5.length).toBe(0)

    const result6 = filterEvents(mockEvents, 'All Events', 'All', 'date_asc')
    expect(result6[0].id).toBe('3')
    expect(result6[2].id).toBe('2')

    const result7 = filterEvents(mockEvents, 'All Events', 'All', 'date_desc')
    expect(result7[0].id).toBe('2')
    expect(result7[2].id).toBe('3')
  })
})

describe('Events Unit Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  })

  it('events are filtered based on category', async () => {
    await act(async () => render(<Events />))

    expect(screen.getByText('Morning Running Session')).toBeTruthy()
    expect(screen.getByText('Powerlifting Meet')).toBeTruthy()

    const categoryChip = screen.getAllByText('Strength')
    const filterChipButton = categoryChip[0]
    await act(async () => fireEvent.press(filterChipButton))

    expect(screen.queryByText('Morning Running Session')).toBeNull()
    expect(screen.getByText('Powerlifting Meet')).toBeTruthy()
  })

  it('events are sorted based on date choice', async () => {
    await act(async () => render(<Events />))

    let renderedTitles = screen.getAllByText(/(Morning Running Session|Powerlifting Meet)/).map(node => node.children[0])
    expect(renderedTitles[0]).toBe('Powerlifting Meet')

    const sortDescChip = screen.getByText('Date ↓')
    await act(async () => fireEvent.press(sortDescChip))

    renderedTitles = screen.getAllByText(/(Morning Running Session|Powerlifting Meet)/).map(node => node.children[0])
    expect(renderedTitles[0]).toBe('Morning Running Session')
  })

  it('events are filtered based on attendance status', async () => {
    await act(async () => render(<Events />))

    const goingTabButton = screen.getByText('Going')
    await act(async () => fireEvent.press(goingTabButton))

    expect(screen.queryByText('Morning Running Session')).toBeNull()
    expect(screen.getByText('Powerlifting Meet')).toBeTruthy()
  })

  it('rsvps after pressing rsvp', async () => {
    mockUpsertImplementation.mockResolvedValue({ error: null })

    await act(async () => render(<Events />))

    const rsvpButtons = screen.getAllByText('RSVP')
    await act(async () => fireEvent.press(rsvpButtons[0]))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('event_rsvps')
      expect(mockUpsertImplementation).toHaveBeenCalledWith(
        { event_id: 'event-1', user_id: mockUserSubId, status: 'going' },
        { onConflict: 'event_id,user_id' }
      )
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-456',
          type: 'event_rsvp_going'
        })
      )
    })
  })

  it('cancels rsvp after retracting rsvp', async () => {
    mockDeleteImplementation.mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    })

    await act(async () => render(<Events />))

    const leaveRsvpButton = screen.getByText('✓ Going')
    await act(async () => fireEvent.press(leaveRsvpButton))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('event_rsvps')
      expect(mockDeleteImplementation).toHaveBeenCalled()
    })
  })
})