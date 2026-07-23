import React from 'react'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native'
import SearchUsers from '../../app/(tabs)/(friends)/search-users'
import { createNotification } from '../../lib/notifications'

const mockUserSubId = 'current-user-123'

let mockProfilesDatabase = []
let mockFollowsDatabase = []

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn((table) => {
      const builder = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockImplementation((column, pattern) => {
          const query = pattern.replace(/%/g, '').toLowerCase()
          return {
            limit: jest.fn().mockImplementation(() => ({
              then: (resolve) => {
                const results = mockProfilesDatabase.filter(p =>
                  p[column] && p[column].toLowerCase().includes(query)
                )
                return Promise.resolve(resolve({ data: results, error: null }))
              },
            })),
            then: (resolve) => {
              const results = mockProfilesDatabase.filter(p =>
                p[column] && p[column].toLowerCase().includes(query)
              )
              return Promise.resolve(resolve({ data: results, error: null }))
            },
          }
        }),
        eq: jest.fn().mockImplementation((column, value) => ({
          single: jest.fn().mockImplementation(() => {
            const item = mockProfilesDatabase.find(p => p[column] === value)
            return Promise.resolve({ data: item || null, error: null })
          }),
          then: (resolve) => {
            if (table === 'follows') {
              const filtered = mockFollowsDatabase.filter(f => f[column] === value)
              return Promise.resolve(resolve({ data: filtered, error: null }))
            }
            const filtered = mockProfilesDatabase.filter(p => p[column] === value)
            return Promise.resolve(resolve({ data: filtered, error: null }))
          },
        })),
        insert: jest.fn().mockImplementation((payload) => {
          const rows = Array.isArray(payload) ? payload : [payload]
          mockFollowsDatabase.push(...rows)
          return Promise.resolve({ data: rows, error: null })
        }),
        delete: jest.fn().mockImplementation(() => ({
          or: jest.fn().mockImplementation(() => {
            mockFollowsDatabase = []
            return Promise.resolve({ data: null, error: null })
          }),
          eq: jest.fn().mockImplementation(() => {
            mockFollowsDatabase = []
            return Promise.resolve({ data: null, error: null })
          }),
          then: (resolve) => Promise.resolve(resolve({ data: null, error: null })),
        })),
        or: jest.fn().mockImplementation(() => ({
          then: (resolve) => Promise.resolve(resolve({ data: mockFollowsDatabase, error: null })),
        })),
        then: jest.fn().mockImplementation((resolve) => {
          const data = table === 'profiles' ? mockProfilesDatabase : mockFollowsDatabase
          return Promise.resolve(resolve({ data, error: null }))
        }),
      }
      return builder
    }),
  },
}))

jest.mock('../../hooks/auth-context', () => ({
  useAuthContext: () => ({ claims: { sub: mockUserSubId } }),
}))

jest.mock('expo-router', () => {
  const ReactModule = require('react')
  return {
    useFocusEffect: (callback) => {
      ReactModule.useEffect(() => {
        callback()
      }, [])
    },
  }
})

jest.mock('../../lib/notifications', () => ({
  createNotification: jest.fn(),
}))

jest.mock('../../components/spacer', () => {
  const { View } = require('react-native')
  return function MockSpacer() {
    return <View testID="spacer" />
  }
})

describe('SearchUsers Unit Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockProfilesDatabase = [
      { id: mockUserSubId, username: 'my_username' },
      { id: 'user-2', username: 'john_doe' },
      { id: 'user-3', username: 'johnny_appleseed' },
      { id: 'target-user-456', username: 'target_user' },
    ]
    mockFollowsDatabase = []
  })

  afterEach(() => cleanup())

  it('friend search list is filtered according to search query', async () => {
    await act(async () => render(<SearchUsers />))

    const searchInput = screen.getByPlaceholderText('Search by username')
    await act(async () => fireEvent.changeText(searchInput, 'john'))

    await waitFor(() => {
      expect(screen.getByText('john_doe')).toBeTruthy()
      expect(screen.getByText('johnny_appleseed')).toBeTruthy()
      expect(screen.queryByText('target_user')).toBeNull()
    })
  })

  it('friend request is added correctly', async () => {
    await act(async () => render(<SearchUsers />))

    const searchInput = screen.getByPlaceholderText('Search by username')
    await act(async () => fireEvent.changeText(searchInput, 'target'))

    const addFriendBtn = await screen.findByText('Add Friend')
    await act(async () => fireEvent.press(addFriendBtn))

    await waitFor(() => {
      expect(mockFollowsDatabase).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            follower_id: mockUserSubId,
            following_id: 'target-user-456',
            status: 'pending',
          }),
        ])
      )

      expect(createNotification).toHaveBeenCalledWith({
        userId: 'target-user-456',
        actorId: mockUserSubId,
        type: 'friend_request',
        message: '@my_username has requested to follow you',
      })

      expect(screen.getByText('Requested')).toBeTruthy()
    })
  })

  it('friend request is retracted correctly', async () => {
    mockFollowsDatabase = [{ follower_id: mockUserSubId, following_id: 'target-user-456', status: 'pending' }]

    await act(async () => render(<SearchUsers />))

    const searchInput = screen.getByPlaceholderText('Search by username')
    await act(async () => fireEvent.changeText(searchInput, 'target'))

    const requestedBtn = await screen.findByText('Requested')
    await act(async () => fireEvent.press(requestedBtn))

    await waitFor(() => {
      expect(mockFollowsDatabase).toHaveLength(0)
      expect(screen.getByText('Add Friend')).toBeTruthy()
    })
  })
})