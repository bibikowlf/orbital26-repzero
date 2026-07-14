import React from 'react'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native'
import { Alert } from 'react-native'
import AddPost from '../../app/(tabs)/(discussion)/add-post'
import MyPosts from '../../app/(tabs)/(discussion)/my-posts'
import DiscussionForum from '../../app/(tabs)/(discussion)/discussion-forum'

const mockUserSubId = 'user-123'

let mockPostsDatabase = []

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn((table) => {
      const builder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockImplementation((column, value) => {
          return {
            then: (resolve) => {
              const filteredData = mockPostsDatabase.filter(item => item[column] === value)
              return Promise.resolve(resolve({ data: filteredData, error: null }))
            }
          }
        }),
        insert: jest.fn().mockImplementation((payload) => {
          const rowsToInsert = Array.isArray(payload) ? payload : [payload]
          const processedRows = rowsToInsert.map(row => ({
            id: `post-${Math.floor(Math.random() * 1000)}`,
            score: 0,
            user_id: mockUserSubId,
            ...row
          }))
          
          mockPostsDatabase.push(...processedRows)
          return Promise.resolve({ data: processedRows, error: null })
        }),
        then: jest.fn().mockImplementation((resolve) => {
          return Promise.resolve(resolve({ data: mockPostsDatabase, error: null }))
        })
      }
      return builder
    }),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://mockurl.com/img.jpg' } })
      }))
    }
  }
}))

jest.mock('../../hooks/auth-context', () => ({
  useAuthContext: () => ({ claims: { sub: mockUserSubId } }),
}))

jest.mock('expo-router', () => {
  const ReactModule = require('react')
  return {
    router: { navigate: jest.fn() },
    useFocusEffect: (callback) => {
      ReactModule.useEffect(() => {
        callback()
      }, [])
    }
  }
})

jest.mock('@expo/vector-icons/Entypo', () => 'Entypo')

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] })
}))

jest.mock('../../functions/clean-string', () => ({
  cleanString: (str) => str.toLowerCase().replace(/[^a-z]/g, '')
}))

describe('DiscussionForum Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    mockPostsDatabase = []
  })

  afterEach(() => cleanup())

  it('user creates new post and views it in my posts and discussion forum', async () => {
    await act(async () => render(<AddPost />))

    const titleInput = screen.getByTestId('title-input') 
    await act(async () => fireEvent.changeText(titleInput, 'My Healthy Gains'))
    
    const contentInput = screen.getByTestId('content-input') 
    await act(async () => fireEvent.changeText(contentInput, 'body content'))
    
    const categoryChip = screen.getByText('Progress')
    await act(async () => fireEvent.press(categoryChip))
    
    const addBtn = screen.getByText('Add')
    await act(async () => fireEvent.press(addBtn))

    await waitFor(() => {
      expect(mockPostsDatabase).toHaveLength(1)
      expect(mockPostsDatabase[0].title).toBe('My Healthy Gains')
    })

    await act(async () => cleanup())

    await act(async () => render(<MyPosts />))

    expect(screen.getByText('My Healthy Gains')).toBeTruthy()

    await act(async () => cleanup())

    await act(async () => render(<DiscussionForum />))

    expect(screen.getByText('My Healthy Gains')).toBeTruthy()
  })
})