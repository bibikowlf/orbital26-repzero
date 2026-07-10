import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import AddPost from '../../app/(tabs)/(discussion)/add-post'
import { supabase } from '../../lib/supabase'
import { Alert } from 'react-native'

let mockActiveChains = {}
const mockUserSubId = 'mock-user-123'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn((table) => {
      if (mockActiveChains[table]) {
        return mockActiveChains[table]
      }
      const defaultBuilder = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((resolve) => {
          return Promise.resolve(resolve({ data: [], error: null }))
        })
      }
      return defaultBuilder
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

jest.mock('expo-router', () => ({
  router: { navigate: jest.fn() }
}))

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] })
}))

jest.mock('@expo/vector-icons/Entypo', () => 'Entypo')

describe('AddPost Validation & Submission Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockActiveChains = {}
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  })

  it('attempting to add post with empty title triggers an alert and does not succeed', async () => {
    await act(async () => render(<AddPost />))

    const addBtn = screen.getByText('Add')
    await act(async () => fireEvent.press(addBtn))

    expect(Alert.alert).toHaveBeenCalledWith('Invalid Title', 'Title cannot be empty.')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('attempting to add post with title > 50 characters triggers an alert and does not succeed', async () => {
    await act(async () => render(<AddPost />))

    const titleInput = screen.getByTestId('title-input') 
    await act(async () => fireEvent.changeText(titleInput, 'very loooooooooooooooooooooooooooooooooooooooooooooong title'))

    const addBtn = screen.getByText('Add')
    await act(async () => fireEvent.press(addBtn))

    expect(Alert.alert).toHaveBeenCalledWith('Invalid Title', 'Title must be under 50 characters.')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('attempting to add post with empty content triggers an alert and does not succeed', async () => {
    await act(async () => render(<AddPost />))

    const titleInput = screen.getByTestId('title-input') 
    await act(async () => fireEvent.changeText(titleInput, 'valid title'))

    const addBtn = screen.getByText('Add')
    await act(async () => fireEvent.press(addBtn))

    expect(Alert.alert).toHaveBeenCalledWith('Invalid Content', 'Content cannot be empty')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('attempting to add post without choosing category triggers an alert and does not succeed', async () => {
    await act(async () => render(<AddPost />))

    const titleInput = screen.getByTestId('title-input') 
    await act(async () => fireEvent.changeText(titleInput, 'valid title'))

    const contentInput = screen.getByTestId('content-input') 
    await act(async () => fireEvent.changeText(contentInput, 'valid content'))

    const addBtn = screen.getByText('Add')
    await act(async () => fireEvent.press(addBtn))

    expect(Alert.alert).toHaveBeenCalledWith('Invalid Category', 'Please choose a category')
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('new post is correctly added', async () => {
    mockActiveChains['posts'] = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((resolve) => 
        Promise.resolve(resolve({ data: [{ id: 'new-post-999' }], error: null }))
      )
    }

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
      expect(supabase.from).toHaveBeenCalledWith('posts')
    })
  })
})