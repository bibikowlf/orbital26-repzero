import React from 'react'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native'
import { Alert } from 'react-native'
import CreateEvent from '../../app/(tabs)/(event)/create-event'
import ChatThread from '../../app/(tabs)/(friends)/chat-thread'

const mockCurrentUserId = 'user-123'
const mockRecipientId = 'user-456'

let mockEventsDb = []
let mockMessagesDb = []
let mockProfilesDb = []
let mockEventRsvpsDb = []

jest.mock('expo-router', () => {
  const ReactModule = require('react')
  return {
    useRouter: () => ({
      back: jest.fn(),
      navigate: jest.fn(),
    }),
    useLocalSearchParams: () => ({ recipientId: mockRecipientId }),
    useFocusEffect: (callback) => {
      ReactModule.useEffect(() => {
        callback()
      }, [])
    },
  }
})

jest.mock('../../hooks/auth-context', () => ({
  useAuthContext: () => ({ claims: { sub: mockCurrentUserId } }),
}))

jest.mock('../../lib/notifications', () => ({
  createNotification: jest.fn(),
}))

jest.mock('../../styles/styles', () => ({
  appStyles: {},
}))

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker')

const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnThis(),
}

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: mockCurrentUserId } },
        error: null,
      }),
    },
    channel: jest.fn(() => mockChannel),
    removeChannel: jest.fn(),
    from: jest.fn((table) => {
      const builder = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        in: jest.fn().mockImplementation((col, values) => {
          return {
            then: (resolve) => {
              if (table === 'events') {
                const results = mockEventsDb.filter((e) => values.includes(e.id))
                return Promise.resolve(resolve({ data: results, error: null }))
              }
              if (table === 'event_rsvps') {
                const results = mockEventRsvpsDb.filter((r) => values.includes(r.event_id))
                return Promise.resolve(resolve({ data: results, error: null }))
              }
              return Promise.resolve(resolve({ data: [], error: null }))
            },
          }
        }),
        eq: jest.fn().mockImplementation((col, val) => {
          const self = {
            single: jest.fn().mockImplementation(() => {
              if (table === 'profiles') {
                const profile = mockProfilesDb.find((p) => p.id === val)
                return Promise.resolve({ data: profile || null, error: null })
              }
              return Promise.resolve({ data: null, error: null })
            }),
            order: jest.fn().mockImplementation(() => {
              if (table === 'events') {
                const filtered = mockEventsDb.filter((e) => e[col] === val)
                return Promise.resolve({ data: filtered, error: null })
              }
              return Promise.resolve({ data: [], error: null })
            }),
            then: (resolve) => {
              if (table === 'follows' || table === 'event_rsvps') {
                const filtered = (table === 'follows' ? [] : mockEventRsvpsDb).filter(
                  (item) => item[col] === val
                )
                return Promise.resolve(resolve({ data: filtered, error: null }))
              }
              return Promise.resolve(resolve({ data: [], error: null }))
            },
          }
          return self
        }),
        order: jest.fn().mockImplementation(() => {
          if (table === 'messages') {
            return Promise.resolve({ data: [...mockMessagesDb], error: null })
          }
          return Promise.resolve({ data: [], error: null })
        }),
        insert: jest.fn().mockImplementation((payload) => {
          const rows = Array.isArray(payload) ? payload : [payload]
          const createdItems = rows.map((row, index) => ({
            id: `id-${table}-${Date.now()}-${index}`,
            ...row,
          }))

          if (table === 'events') mockEventsDb.push(...createdItems)
          if (table === 'messages') mockMessagesDb.push(...createdItems)

          return {
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: createdItems[0], error: null }),
            then: (resolve) => Promise.resolve(resolve({ data: createdItems, error: null })),
          }
        }),
        then: jest.fn().mockImplementation((resolve) => {
          if (table === 'events') {
            return Promise.resolve(resolve({ data: mockEventsDb, error: null }))
          }
          return Promise.resolve(resolve({ data: [], error: null }))
        }),
      }
      return builder
    }),
  },
}))

describe('Event & Friends Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation((title, msg, buttons) => {
      if (buttons && buttons[0] && buttons[0].onPress) {
        buttons[0].onPress()
      }
    })

    mockEventsDb = []
    mockMessagesDb = []
    mockEventRsvpsDb = []
    mockProfilesDb = [
      { id: mockCurrentUserId, username: 'testuser' },
      { id: mockRecipientId, username: 'friend_user' },
    ]
  })

  afterEach(() => cleanup())

  it('user creates event then sends event invite to friend', async () => {
    await act(async () => render(<CreateEvent />))

    const titleInput = screen.getByPlaceholderText('e.g. Morning Run at East Coast Park')
    await act(async () => fireEvent.changeText(titleInput, 'Sunset Beach Volleyball'))

    const descInput = screen.getByPlaceholderText("What's the plan?")
    await act(async () => fireEvent.changeText(descInput, 'Casual 4v4 game'))

    const locInput = screen.getByPlaceholderText('e.g. East Coast Park')
    await act(async () => fireEvent.changeText(locInput, 'Sentosa Cove'))

    const dateInput = screen.getByPlaceholderText('e.g. 2025-06-20')
    await act(async () => fireEvent.changeText(dateInput, '2028-08-15'))

    const timeInput = screen.getByPlaceholderText('e.g. 07:00')
    await act(async () => fireEvent.changeText(timeInput, '17:30'))

    const categoryChip = screen.getByText('Social')
    await act(async () => fireEvent.press(categoryChip))

    const submitBtn = screen.getByText('Post Event')
    await act(async () => fireEvent.press(submitBtn))

    await waitFor(() => {
      expect(mockEventsDb).toHaveLength(1)
      expect(mockEventsDb[0].title).toBe('Sunset Beach Volleyball')
      expect(mockEventsDb[0].category).toBe('Social')
    })

    await act(async () => cleanup())

    await act(async () => render(<ChatThread />))

    const openEventModalBtn = screen.getByText('+ Event')
    await act(async () => fireEvent.press(openEventModalBtn))

    const createdEventItem = await screen.findByText('Sunset Beach Volleyball')
    await act(async () => fireEvent.press(createdEventItem))

    await waitFor(() => {
      expect(mockMessagesDb).toHaveLength(1)
      expect(mockMessagesDb[0]).toEqual(
        expect.objectContaining({
          sender_id: mockCurrentUserId,
          receiver_id: mockRecipientId,
          message_type: 'event_invite',
          event_id: mockEventsDb[0].id,
        })
      )
      expect(screen.getByText('📅 Event Invite')).toBeTruthy()
      expect(screen.getByText('Sunset Beach Volleyball')).toBeTruthy()
    })
  })
})