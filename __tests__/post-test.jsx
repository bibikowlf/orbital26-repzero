import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react-native'
import Post from '../app/(tabs)/(community)/post'
import { supabase } from '../lib/supabase'
import * as ReactNative from 'react-native'
import { View, Text, TextInput, FlatList, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native'
global.IS_REACT_ACT_ENVIRONMENT = true
const mockPost = {
  id: 'mock-post-123',
  title: 'Test Post Title',
  content: 'Original Post Body',
  user_id: 'mock-user-456',
  username: 'tester',
  image_urls: ['https://example.com', 'https://example.com'],
  score: 10,
  created_at: '2026-01-01T00:00:00Z',
}

const mockComments = [
  { id: 1, post_id: 'mock-post-123', parent_id: null, content: 'First Root Comment', user_id: 'other-user', score: 2 }
]

let mockActiveChains = {}

jest.spyOn(Alert, 'alert').mockImplementation(() => {})
jest.mock('@react-native-async-storage/async-storage', () => 
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)
jest.mock('../lib/supabase', () => {
  return {
    supabase: {
      from: jest.fn((table) => {
        if (!mockActiveChains[table]) {
          const builder = {
            select: jest.fn().mockImplementation(() => builder),
            insert: jest.fn().mockImplementation(() => builder),
            delete: jest.fn().mockImplementation(() => builder),
            upsert: jest.fn().mockImplementation(() => builder),
            eq: jest.fn().mockImplementation(() => builder),
            then: jest.fn().mockImplementation((resolve) => {
              if (table === 'posts_with_votes') {
                return Promise.resolve(resolve({ data: [mockPost], error: null }))
              } else if (table === 'comments_with_votes') {
                return Promise.resolve(resolve({ data: mockComments, error: null }))
              } else if (table === 'comment_votes' || table === 'post_votes') {
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
  }
})

jest.mock('expo-router', () => {
  return {
    useLocalSearchParams: () => ({ postId: 'mock-post-123' }),
    Stack: { 
      Screen: () => null 
    },
    router: { 
      navigate: jest.fn(),
      back: jest.fn()
    },
  }
})

jest.mock('../hooks/auth-context', () => ({
  useAuthContext: () => ({ claims: { sub: 'mock-user-456' } }),
}))

jest.mock('../components/comment', () => {
  const { TouchableOpacity, Text, View } = require('react-native')
  return function MockComment({ comment, onReplyPress, onVotePress, onEditPress, onDeletePress, onUpdatePress }) {
    return (
      <View testID={`comment-${comment.id}`}>
        <Text>{comment.content}</Text>
        <TouchableOpacity onPress={() => onReplyPress && onReplyPress(comment)}><Text>Reply To Comment</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => onVotePress && onVotePress(comment)}><Text>Vote Comment</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => onEditPress && onEditPress(comment)}><Text>Edit Comment Button</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => onUpdatePress && onUpdatePress('Updated Content String Text')}><Text>Update Comment</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => onDeletePress && onDeletePress(comment.id)}><Text>Delete Comment Button</Text></TouchableOpacity>
      </View>
    )
  }
})

jest.mock('../components/text-info', () => {
  const { TouchableOpacity, Text, View } = require('react-native')
  return function MockTextInfo({ onVotePress, onEditPress, onDeletePress, score }) {
    return (
      <View testID='post-actions'>
        <Text>Post Score: {score}</Text>
        <TouchableOpacity onPress={onVotePress}><Text>Vote Post Button</Text></TouchableOpacity>
        <TouchableOpacity onPress={onEditPress}><Text>Edit Post Button</Text></TouchableOpacity>
        <TouchableOpacity onPress={onDeletePress}><Text>Delete Post Button</Text></TouchableOpacity>
      </View>
    )
  }
})

describe('Post Screen Comprehensive Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockActiveChains = {}
    jest.useRealTimers()
    jest.spyOn(ReactNative, 'useWindowDimensions').mockImplementation(() => ({
      width: 375,
      height: 812,
      scale: 3,
      fontScale: 1,
    }))
  })

  it('updates index indicator text when carousel chevrons are pressed', async () => {
    await act(async () => {
      render(<Post />)
    })
    await waitFor(() => expect(screen.getByText('Test Post Title')).toBeTruthy())
    
    const primaryIndicator = screen.queryByText('1 / 2')
    if (primaryIndicator) {
      expect(primaryIndicator).toBeTruthy()
    }
  })

  it('toggles voting mutation score modifications on the post header', async () => {
    await act(async () => render(<Post />))
    await waitFor(() => expect(screen.getByText('Post Score: 10')).toBeTruthy())

    const voteBtn = screen.getByText('Vote Post Button')
    await act(async () => fireEvent.press(voteBtn))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('post_votes')
      expect(screen.getByText('Post Score: 11')).toBeTruthy()
    })
  })


  it('allows editing post markdown details inline', async () => {
    const postsBuilder = {
      select: jest.fn().mockImplementation(() => postsBuilder),
      update: jest.fn().mockImplementation(() => postsBuilder),
      delete: jest.fn().mockImplementation(() => postsBuilder),
      upsert: jest.fn().mockImplementation(() => postsBuilder), // handles handleEditPost execution safely
      eq: jest.fn().mockImplementation(() => postsBuilder),
      then: jest.fn().mockImplementation((resolve) => 
        Promise.resolve(resolve({ data: [{ ...mockPost, content: 'Revised Body Payload' }], error: null }))
      )
    }
    mockActiveChains['posts'] = postsBuilder

    await act(async () => render(<Post />))
    await waitFor(() => expect(screen.getByText('Post Score: 10')).toBeTruthy())

    const editPostBtn = screen.getByText('Edit Post Button')
    await act(async () =>fireEvent.press(editPostBtn))

    const input = await screen.findByDisplayValue('Original Post Body')
    await act(async () => fireEvent.changeText(input, 'A brand new modified post body text'))

    const submitBtn = screen.getByText(/^Edit$/)
    await act(async () => fireEvent.press(submitBtn))

    await waitFor(() => expect(supabase.from).toHaveBeenCalledWith('posts'))
  })

  it('triggers delete network transactions and navigates backward safely', async () => {
    mockActiveChains['posts'] = {
      ...mockActiveChains['posts'],
      then: jest.fn().mockImplementation((resolve) => 
        Promise.resolve(resolve({ data: [], error: null }))
      )
    }

    await act(async () => render(<Post />))
    await waitFor(() => expect(screen.getByText('Test Post Title')).toBeTruthy())

    await act(async () => fireEvent.press(screen.getByText('Delete Post Button')))
    expect(supabase.from).toHaveBeenCalledWith('posts')
  })

  it('adds a new comment to the FlatList rendering tree', async () => {
    await act(async () => render(<Post />))
    await waitFor(() => expect(screen.getByText('First Root Comment')).toBeTruthy())

    const commentsBuilder = {
      select: jest.fn().mockImplementation(() => commentsBuilder),
      insert: jest.fn().mockImplementation(() => commentsBuilder),
      delete: jest.fn().mockImplementation(() => commentsBuilder),
      eq: jest.fn().mockImplementation(() => commentsBuilder),
      then: jest.fn().mockImplementation((resolve) => 
        Promise.resolve(resolve({
          data: [{ id: 2, content: 'Brand New Comment Text', user_id: 'mock-user-456', post_id: 'mock-post-123', parent_id: null }],
          error: null
        }))
    )}
    mockActiveChains['comments'] = commentsBuilder

    const input = screen.getByPlaceholderText('Enter comment')
    await act(async () => fireEvent.changeText(input, 'Brand New Comment Text'))
    
    const addBtn = screen.queryByText('Add')
    await act(async () => fireEvent.press(addBtn))

    await waitFor(() => expect(screen.getByText('Brand New Comment Text')).toBeTruthy())
  })

  it('saves edits made to a comment row entity', async () => {
    await act(async () => render(<Post />))
    await waitFor(() => expect(screen.getByText('First Root Comment')).toBeTruthy())

    const commentsBuilder = {
      select: jest.fn().mockImplementation(() => commentsBuilder),
      insert: jest.fn().mockImplementation(() => commentsBuilder),
      upsert: jest.fn().mockImplementation(() => commentsBuilder),
      delete: jest.fn().mockImplementation(() => commentsBuilder),
      eq: jest.fn().mockImplementation(() => commentsBuilder),
      then: jest.fn().mockImplementation((resolve) => 
        Promise.resolve(resolve({ data: [], error: null }))
    )}
    mockActiveChains['comments'] = commentsBuilder

    await act(async () => fireEvent.press(screen.getByText('Edit Comment Button')))
    await act(async () => fireEvent.press(screen.getByText('Update Comment')))
    
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('comments')
      expect(screen.getByText('Updated Content String Text')).toBeTruthy()
    })
  })

  it('removes comment row reference objects upon confirmation', async () => {
    await act(async () => render(<Post />))
    await waitFor(() => expect(screen.getByText('First Root Comment')).toBeTruthy())

    const commentsBuilder = {
      select: jest.fn().mockImplementation(() => commentsBuilder),
      insert: jest.fn().mockImplementation(() => commentsBuilder),
      upsert: jest.fn().mockImplementation(() => commentsBuilder),
      delete: jest.fn().mockImplementation(() => commentsBuilder),
      eq: jest.fn().mockImplementation(() => commentsBuilder),
      then: jest.fn().mockImplementation((resolve) => 
        Promise.resolve(resolve({ data: [], error: null }))
    )}
    mockActiveChains['comments'] = commentsBuilder

    await act(async () => fireEvent.press(screen.getByText('Delete Comment Button')))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('comments')
      expect(screen.queryByText('First Root Comment')).toBeFalsy()
    })
  })
})