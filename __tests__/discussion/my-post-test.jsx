import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import MyPosts from '../../app/(tabs)/(discussion)/my-posts'
import { supabase } from '../../lib/supabase'

let mockActiveChains = {}
const mockUserSubId = 'mock-user-123'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn((table) => {
      if (!mockActiveChains[table]) {
        const builder = {
          select: jest.fn().mockImplementation(() => builder),
          eq: jest.fn().mockImplementation(() => builder),
          then: jest.fn().mockImplementation((resolve) => {
            return Promise.resolve(resolve({ data: [], error: null }))
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

jest.mock('expo-router', () => {
  const ReactModule = require('react')
  return {
    router: { navigate: jest.fn() },
    useFocusEffect: (callback) => {
      ReactModule.useEffect(() => {
        callback()
      }, [callback])
    }
  }
})

jest.mock('@expo/vector-icons/Entypo', () => 'Entypo')

jest.mock('../../functions/clean-string', () => ({
  cleanString: (str) => str.toLowerCase().replace(/[^a-z]/g, '')
}))

describe('MyPost Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockActiveChains = {}
  })

  it('posts are filtered according to search posts', async () => {
    const mockFeedPosts = [
      { id: 'post-1', title: 'React Native Tutorial', category: 'Progress', score: 10, user_id: mockUserSubId },
      { id: 'post-2', title: 'Weightlifting Advice', category: 'Discussion', score: 5, user_id: mockUserSubId }
    ]

    mockActiveChains['posts_with_votes'] = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((resolve) => 
        Promise.resolve(resolve({ data: mockFeedPosts, error: null }))
      )
    }

    await act(async () => render(<MyPosts />))
    await waitFor(() => expect(screen.getByText('React Native Tutorial')).toBeTruthy())
    expect(screen.getByText('Weightlifting Advice')).toBeTruthy()

    const searchInput = screen.getByPlaceholderText('Search posts')
    await act(async () => fireEvent.changeText(searchInput, 'reactnative'))

    expect(screen.getByText('React Native Tutorial')).toBeTruthy()
    expect(screen.queryByText('Weightlifting Advice')).toBeNull()
  })

  it('posts are filtered according to category', async () => {
    const mockFeedPosts = [
      { id: 'post-1', title: 'Check out my gains', category: 'Progress', score: 10, user_id: mockUserSubId },
      { id: 'post-2', title: 'Bench press form help', category: 'Help', score: 5, user_id: mockUserSubId }
    ]

    mockActiveChains['posts_with_votes'] = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((resolve) => 
        Promise.resolve(resolve({ data: mockFeedPosts, error: null }))
      )
    }

    await act(async () => render(<MyPosts />))
    await waitFor(() => expect(screen.getByText('Check out my gains')).toBeTruthy())
    expect(screen.getByText('Bench press form help')).toBeTruthy()

    const categoryChips = screen.getAllByText('Help')
    const filterChipButton = categoryChips[0] 
    
    await act(async () => fireEvent.press(filterChipButton))

    expect(screen.getByText('Bench press form help')).toBeTruthy()
    expect(screen.queryByText('Check out my gains')).toBeNull()
  })
})