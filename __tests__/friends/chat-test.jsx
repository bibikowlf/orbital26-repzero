import React from 'react'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native'
import ChatThread from '../../app/(tabs)/(friends)/chat-thread'
import { createNotification } from '../../lib/notifications'

const mockCurrentUserId = 'current-user-123'
const mockRecipientId = 'recipient-user-456'

let mockProfilesDb = []
let mockMessagesDb = []
let mockEventsDb = []
let mockEventRsvpsDb = []
let mockWorkoutInvitesDb = []

jest.mock('expo-router', () => {
  const ReactModule = require('react')
  return {
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
                const filtered = (table === 'follows' ? mockFollowsDatabase : mockEventRsvpsDb).filter(
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
            id: `${table}-id-${Date.now()}-${index}`,
            ...row,
          }))

          if (table === 'messages') mockMessagesDb.push(...createdItems)
          if (table === 'workout_invites') mockWorkoutInvitesDb.push(...createdItems)

          return {
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: createdItems[0], error: null }),
            then: (resolve) => Promise.resolve(resolve({ data: createdItems, error: null })),
          }
        }),
        upsert: jest.fn().mockImplementation((payload) => {
          const existingIdx = mockEventRsvpsDb.findIndex(
            (r) => r.event_id === payload.event_id && r.user_id === payload.user_id
          )
          if (existingIdx >= 0) {
            mockEventRsvpsDb[existingIdx] = { ...mockEventRsvpsDb[existingIdx], ...payload }
          } else {
            mockEventRsvpsDb.push({ id: `rsvp-${Date.now()}`, ...payload })
          }
          return Promise.resolve({ data: payload, error: null })
        }),
      }
      return builder
    }),
  },
}))

describe('ChatThread Unit Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockProfilesDb = [
      { id: mockCurrentUserId, username: 'testuser' },
      { id: mockRecipientId, username: 'recipient_user' },
    ]
    mockMessagesDb = []
    mockEventsDb = []
    mockEventRsvpsDb = []
    mockWorkoutInvitesDb = []
  })

  afterEach(() => cleanup())

  it('message is sent after pressing send', async () => {
    await act(async () => render(<ChatThread />))

    const messageInput = screen.getByPlaceholderText('Message')
    await act(async () => fireEvent.changeText(messageInput, 'Hello World'))

    const sendButton = screen.getByText('Send')
    await act(async () => fireEvent.press(sendButton))

    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeTruthy()
      expect(mockMessagesDb).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            sender_id: mockCurrentUserId,
            receiver_id: mockRecipientId,
            content: 'Hello World',
          }),
        ])
      )
    })
  })

  it('empty message is not sent', async () => {
    await act(async () => render(<ChatThread />))

    const messageInput = screen.getByPlaceholderText('Message')
    await act(async () => fireEvent.changeText(messageInput, '   '))

    const sendButton = screen.getByText('Send')
    await act(async () => fireEvent.press(sendButton))

    await waitFor(() => expect(mockMessagesDb).toHaveLength(0))
  })

  it('workout invite is sent correctly', async () => {
    await act(async () => render(<ChatThread />))

    const openWorkoutBtn = screen.getByText('+ Workout')
    await act(async () => fireEvent.press(openWorkoutBtn))

    const noteInput = screen.getByPlaceholderText('Add a note (optional)')
    await act(async () => fireEvent.changeText(noteInput, 'Leg day!'))

    const sendInviteBtn = screen.getByText('Send Invite')
    await act(async () => fireEvent.press(sendInviteBtn))

    await waitFor(() => {
      expect(screen.getByText('🏋️ Workout Invite')).toBeTruthy()
      expect(screen.getByText('"Leg day!"')).toBeTruthy()
      expect(mockWorkoutInvitesDb).toHaveLength(1)
      expect(mockWorkoutInvitesDb[0].message).toBe('Leg day!')
    })
  })

  it('event invite is sent correctly', async () => {
    mockEventsDb = [
      {
        id: 'event-100',
        creator_id: mockCurrentUserId,
        title: 'Community Run',
        event_date: new Date().toISOString(),
      },
    ]

    await act(async () => render(<ChatThread />))

    const openEventBtn = screen.getByText('+ Event')
    await act(async () => fireEvent.press(openEventBtn))

    const eventItem = await screen.findByText('Community Run')
    await act(async () => fireEvent.press(eventItem))

    await waitFor(() => {
      expect(screen.getByText('📅 Event Invite')).toBeTruthy()
      expect(screen.getByText('Community Run')).toBeTruthy()
      expect(mockMessagesDb).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message_type: 'event_invite',
            event_id: 'event-100',
          }),
        ])
      )
    })
  })

  it('event rsvp is added and system message is sent after accepting event invite', async () => {
    mockEventsDb = [
      {
        id: 'event-100',
        title: 'Community Run',
        event_date: new Date().toISOString(),
      },
    ]

    mockMessagesDb = [
      {
        id: 'msg-invite-1',
        sender_id: mockRecipientId,
        receiver_id: mockCurrentUserId,
        content: 'Invited you to Community Run',
        message_type: 'event_invite',
        event_id: 'event-100',
      },
    ]

    await act(async () => render(<ChatThread />))

    const rsvpBtn = await screen.findByText('RSVP')
    await act(async () => fireEvent.press(rsvpBtn))

    await waitFor(() => {
      expect(mockEventRsvpsDb).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            event_id: 'event-100',
            user_id: mockCurrentUserId,
            status: 'going',
          }),
        ])
      )
      expect(screen.getByText('✅ Going')).toBeTruthy()
      expect(screen.getByText('testuser RSVP’d to Community Run')).toBeTruthy()
      expect(createNotification).toHaveBeenCalledWith({
        userId: mockRecipientId,
        actorId: mockCurrentUserId,
        type: 'event_rsvp_going',
        message: '@testuser is going to Community Run',
        referenceId: 'event-100',
      })
    })
  })
})