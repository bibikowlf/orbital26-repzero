import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import MyTutorials from '../../app/(tabs)/(settings)/my-tutorials'
import { supabase } from '../../lib/supabase'
import { Alert } from 'react-native'

const mockUserSubId = 'mock-user-123'
const mockTutorial = {
  id: 'tutorial-999',
  content: 'Original Form Tutorial Content',
  user_id: mockUserSubId,
  workout_id: 'workout-abc',
  score: 10
}

let mockActiveChains = {}

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn((table) => {
      if (!mockActiveChains[table]) {
        const builder = {
          select: jest.fn().mockImplementation(() => builder),
          insert: jest.fn().mockImplementation(() => builder),
          upsert: jest.fn().mockImplementation(() => builder),
          delete: jest.fn().mockImplementation(() => builder),
          eq: jest.fn().mockImplementation(() => builder),
          then: jest.fn().mockImplementation((resolve) => {
            if (table === 'workout_tutorials_with_votes') {
              return Promise.resolve(resolve({ data: [mockTutorial], error: null }))
            }
            if (table === 'workout_tutorial_votes') {
              return Promise.resolve(resolve({ data: [], error: null }))
            }
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
    useFocusEffect: (callback) => {
      ReactModule.useEffect(() => {
        callback()
      }, [callback])
    },
    useLocalSearchParams: () => ({ id: 'workout-abc', name: 'Chest Press' }),
    Stack: { Screen: () => null },
    router: { navigate: jest.fn() }
  }
})

jest.mock('../../components/text-info', () => {
  const { View, Text, TouchableOpacity } = require('react-native')
  return function MockTextInfo({ score, onVotePress, onEditPress, onDeletePress }) {
    return (
      <View>
        <Text>Score Counter: {score}</Text>
        <TouchableOpacity onPress={onVotePress}><Text>Vote Mock Button</Text></TouchableOpacity>
        <TouchableOpacity onPress={onEditPress}><Text>Edit Mock Button</Text></TouchableOpacity>
        <TouchableOpacity onPress={onDeletePress}><Text>Delete Mock Button</Text></TouchableOpacity>
      </View>
    )
  }
})

describe('MyTutorial Unit Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockActiveChains = {}
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  })

  it('tutorial is updated after editing', async () => {
    const tableBuilder = {
      upsert: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((resolve) => Promise.resolve(resolve({ error: null })))
    }
    mockActiveChains['workout_tutorials'] = tableBuilder

    await act(async () => render(<MyTutorials />))
    await waitFor(() => expect(screen.getByText('Original Form Tutorial Content')).toBeTruthy())

    await act(async () => fireEvent.press(screen.getByText('Edit Mock Button')))

    const input = await screen.findByDisplayValue('Original Form Tutorial Content')
    await act(async () => fireEvent.changeText(input, 'Completely Mutated Row Content Payload'))

    const submitBtn = screen.getByText(/^Edit$/)
    await act(async () => fireEvent.press(submitBtn))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('workout_tutorials')
      expect(screen.getByText('Completely Mutated Row Content Payload')).toBeTruthy()
    })
  })

  it('vote is added after upvoting', async () => {
    supabase.from.mockImplementation((table) => {
      const builder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((resolve) => {
            if (table === 'workout_tutorials_with_votes') {
            return Promise.resolve(resolve({ data: [mockTutorial], error: null }))
            }
            if (table === 'workout_tutorial_votes') {
            return Promise.resolve(resolve({ data: [], error: null }))
            }
            return Promise.resolve(resolve({ data: [], error: null }))
      })}
      mockActiveChains[table] = builder
      return builder
    })

    await act(async () => render(<MyTutorials />))
    await waitFor(() => expect(screen.getByText('Score Counter: 10')).toBeTruthy())

    const writeBuilder = {
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((resolve) => 
        Promise.resolve(resolve({ data: [{ id: 'new-vote-id', comment_id: 'tutorial-999' }], error: null }))
    )}
    mockActiveChains['workout_tutorial_votes'] = writeBuilder

    await act(async () => fireEvent.press(screen.getByText('Vote Mock Button')))

    await waitFor(() => expect(screen.getByText('Score Counter: 11')).toBeTruthy())
  })

  it('vote is deleted after retracting upvote', async () => {
    supabase.from.mockImplementation((table) => {
      const builder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((resolve) => {
          if (table === 'workout_tutorials_with_votes') {
            return Promise.resolve(resolve({ data: [mockTutorial], error: null }))
          }
          if (table === 'workout_tutorial_votes') {
            return Promise.resolve(resolve({ data: [{ id: 'existing-vote-111', user_id: mockUserSubId, comment_id: 'tutorial-999' }], error: null }))
          }
          return Promise.resolve(resolve({ data: [], error: null }))
        })
      }
      mockActiveChains[table] = builder
      return builder
    })

    await act(async () => render(<MyTutorials />))
    await waitFor(() => expect(screen.getByText('Score Counter: 10')).toBeTruthy())

    await act(async () => fireEvent.press(screen.getByText('Vote Mock Button')))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('workout_tutorial_votes')
      expect(mockActiveChains['workout_tutorial_votes'].delete).toHaveBeenCalled()
      expect(screen.getByText('Score Counter: 9')).toBeTruthy()
    })
  })

  it('tutorial is deleted after pressing delete button', async () => {
    const tableBuilder = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((resolve) => Promise.resolve(resolve({ error: null })))
    }
    mockActiveChains['workout_tutorials'] = tableBuilder

    await act(async () => render(<MyTutorials />))
    await waitFor(() => expect(screen.getByText('Original Form Tutorial Content')).toBeTruthy())

    await act(async () => fireEvent.press(screen.getByText('Delete Mock Button')))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('workout_tutorials')
      expect(screen.queryByText('Original Form Tutorial Content')).toBeNull()
    })
  })

  it('tutorial cannot be updated to empty tutorial', async () => {
    await act(async () => render(<MyTutorials />))
    await waitFor(() => expect(screen.getByText('Original Form Tutorial Content')).toBeTruthy())

    await act(async () => fireEvent.press(screen.getByText('Edit Mock Button')))

    const input = await screen.findByDisplayValue('Original Form Tutorial Content')
    await act(async () => fireEvent.changeText(input, ''))

    const submitBtn = screen.getByText(/^Edit$/)
    await act(async () => fireEvent.press(submitBtn))

    expect(Alert.alert).toHaveBeenCalledWith('Tutorial cannot be empty')
    expect(supabase.from).not.toHaveBeenCalledWith('workout_tutorials')
  })
})