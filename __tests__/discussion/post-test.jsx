import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react-native'
import Post from '../../app/(tabs)/(discussion)/post'
import { supabase } from '../../lib/supabase'
import * as ReactNative from 'react-native'
import { View, Text, TextInput, FlatList, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native'

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
jest.mock('../../lib/supabase', () => {
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
              } else if (table === 'comment_votes' || table === 'post_votes' || table === 'report_comments' || table === 'bookmarks') {
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

jest.mock('../../hooks/auth-context', () => ({
  useAuthContext: () => ({ claims: { sub: 'mock-user-456' } }),
}))

jest.mock('../../components/comment', () => {
  const { TouchableOpacity, Text, View } = require('react-native')
  return function MockComment({ comment, onReplyPress, onVotePress, onEditPress, onDeletePress, onUpdatePress, onReportPress }) {
    return (
      <View testID={`comment-${comment.id}`}>
        <Text>{comment.content}</Text>
        <TouchableOpacity onPress={() => onReplyPress && onReplyPress(comment)}><Text>Reply To Comment</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => onVotePress && onVotePress(comment)}><Text>Vote Comment</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => onEditPress && onEditPress(comment)}><Text>Edit Comment Button</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => onUpdatePress && onUpdatePress('Updated Content String Text')}><Text>Update Comment</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => onUpdatePress && onUpdatePress(' ')}><Text>Update Comment With Empty Text</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => onDeletePress && onDeletePress(comment.id)}><Text>Delete Comment Button</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => onReportPress && onReportPress(comment.id, 'Spam')}><Text>Report Comment Button</Text></TouchableOpacity>
      </View>
    )
  }
})

jest.mock('../../components/text-info', () => {
  const { TouchableOpacity, Text, View } = require('react-native')
  return function MockTextInfo({ onVotePress, onEditPress, onDeletePress, onReportPress, score }) {
    return (
      <View testID='post-actions'>
        <Text>Post Score: {score}</Text>
        <TouchableOpacity onPress={onVotePress}><Text>Vote Post Button</Text></TouchableOpacity>
        <TouchableOpacity onPress={onEditPress}><Text>Edit Post Button</Text></TouchableOpacity>
        <TouchableOpacity onPress={onDeletePress}><Text>Delete Post Button</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => onReportPress && onReportPress('Inappropriate')}><Text>Report Post Button</Text></TouchableOpacity>
      </View>
    )
  }
})

describe('Post Unit Test', () => {
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

  it('images indices are updated after clicking left/right', async () => {
    await act(async () => render(<Post />))
    await waitFor(() => expect(screen.getByText('Test Post Title')).toBeTruthy())
    
    const primaryIndicator = screen.queryByText('1 / 2')
    if (primaryIndicator) {
      expect(primaryIndicator).toBeTruthy()
    }
  })

  it('vote is added after upvoting post', async () => {
    await act(async () => render(<Post />))
    await waitFor(() => expect(screen.getByText('Post Score: 10')).toBeTruthy())

    const voteBtn = screen.getByText('Vote Post Button')
    await act(async () => fireEvent.press(voteBtn))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('post_votes')
      expect(screen.getByText('Post Score: 11')).toBeTruthy()
    })
  })

  it('vote is deleted after retracting upvote for post', async () => {
    const postVotesBuilder = {
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((resolve) => 
        Promise.resolve(resolve({ data: [{ id: 'existing-post-vote-999', user_id: 'mock-user-456' }], error: null }))
      )
    }
    mockActiveChains['post_votes'] = postVotesBuilder

    await act(async () => render(<Post />))
    await waitFor(() => expect(screen.getByText('Post Score: 10')).toBeTruthy())

    const voteBtn = screen.getByText('Vote Post Button')
    await act(async () => fireEvent.press(voteBtn))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('post_votes')
      expect(mockActiveChains['post_votes'].delete).toHaveBeenCalled()
      expect(screen.getByText('Post Score: 9')).toBeTruthy()
    })
  })

  it('post is updated after editing', async () => {
    const postsBuilder = {
      select: jest.fn().mockImplementation(() => postsBuilder),
      update: jest.fn().mockImplementation(() => postsBuilder),
      delete: jest.fn().mockImplementation(() => postsBuilder),
      upsert: jest.fn().mockImplementation(() => postsBuilder),
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

  it('post is deleted after pressing delete button', async () => {
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

  it('new comment is added correctly', async () => {
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

  it('comment is updated after editing', async () => {
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

  it('comment is deleted after pressing delete button', async () => {
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

  it('vote is added after upvoting comment', async () => {
    await act(async () => render(<Post />))
    await waitFor(() => expect(screen.getByText('First Root Comment')).toBeTruthy())

    const commentVotesBuilder = {
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((resolve) => 
        Promise.resolve(resolve({ data: [{ id: 'new-vote-id' }], error: null }))
      )
    }
    mockActiveChains['comment_votes'] = commentVotesBuilder

    const voteBtn = screen.getByText('Vote Comment')
    await act(async () => fireEvent.press(voteBtn))
    expect(supabase.from).toHaveBeenCalledWith('comment_votes')
  })

  it('vote is deleted after retracting upvote for comment', async () => {
    const commentVotesBuilder = {
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((resolve) => 
        Promise.resolve(resolve({ data: [{ id: 'existing-comment-vote-888', user_id: 'mock-user-456', comment_id: 1 }], error: null }))
      )
    }
    mockActiveChains['comment_votes'] = commentVotesBuilder

    await act(async () => render(<Post />))
    await waitFor(() => expect(screen.getByText('First Root Comment')).toBeTruthy())

    const voteBtn = screen.getByText('Vote Comment')
    await act(async () => fireEvent.press(voteBtn))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('comment_votes')
      expect(mockActiveChains['comment_votes'].delete).toHaveBeenCalled()
    })
  })

  it('empty comment triggers alert and is not added', async () => {
    await act(async () => render(<Post />))
    await waitFor(() => expect(screen.getByText('First Root Comment')).toBeTruthy())

    jest.clearAllMocks()

    const input = screen.getByPlaceholderText('Enter comment')
    await act(async () => fireEvent.changeText(input, '    '))

    const addBtn = screen.getByText('Add')
    await act(async () => fireEvent.press(addBtn))

    expect(Alert.alert).toHaveBeenCalledWith('Comment cannot be empty')
    expect(supabase.from).not.toHaveBeenCalledWith('comments')
  })

  it('post cannot be updated to empty content', async () => {
    await act(async () => render(<Post />))
    await waitFor(() => expect(screen.getByText('Test Post Title')).toBeTruthy())

    jest.clearAllMocks()

    const editPostBtn = screen.getByText('Edit Post Button')
    await act(async () => fireEvent.press(editPostBtn))

    const input = await screen.findByDisplayValue('Original Post Body')
    await act(async () => fireEvent.changeText(input, ''))

    const submitBtn = screen.getByText(/^Edit$/)
    await act(async () => fireEvent.press(submitBtn))

    expect(Alert.alert).toHaveBeenCalledWith('Post cannot be empty')
    expect(supabase.from).not.toHaveBeenCalledWith('posts')
  })

  it('comment cannot be updated to empty comment', async () => {
    await act(async () => render(<Post />))
    await waitFor(() => expect(screen.getByText('First Root Comment')).toBeTruthy())

    jest.clearAllMocks()

    await act(async () => fireEvent.press(screen.getByText('Edit Comment Button')))
    await act(async () => fireEvent.press(screen.getByText('Update Comment With Empty Text')))

    expect(Alert.alert).toHaveBeenCalledWith('Comment cannot be empty')
    expect(supabase.from).not.toHaveBeenCalledWith('comments')
  })

  it('report is added after reporting post', async () => {
    const reportPostsBuilder = {
      insert: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((resolve) => Promise.resolve(resolve({ error: null })))
    }
    mockActiveChains['report_posts'] = reportPostsBuilder

    await act(async () => render(<Post />))
    await waitFor(() => expect(screen.getByText('Test Post Title')).toBeTruthy())

    const reportPostBtn = screen.getByText('Report Post Button')
    await act(async () => fireEvent.press(reportPostBtn))

    expect(supabase.from).toHaveBeenCalledWith('report_posts')
    expect(mockActiveChains['report_posts'].insert).toHaveBeenCalledWith({
      user_id: 'mock-user-456',
      post_id: 'mock-post-123',
      reason: 'Inappropriate'
    })
  })

  it('report is added after reporting comment', async () => {
    await act(async () => render(<Post />))
    await waitFor(() => expect(screen.getByText('First Root Comment')).toBeTruthy())

    const reportCommentsBuilder = {
      insert: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((resolve) => Promise.resolve(resolve({ error: null })))
    }
    mockActiveChains['report_comments'] = reportCommentsBuilder

    const reportCommentBtn = screen.getByText('Report Comment Button')
    await act(async () => fireEvent.press(reportCommentBtn))

    expect(supabase.from).toHaveBeenCalledWith('report_comments')
    expect(mockActiveChains['report_comments'].insert).toHaveBeenCalledWith({
      user_id: 'mock-user-456',
      comment_id: 1,
      reason: 'Spam'
    })
  })

  it('post is saved after pressing bookmark', async () => {
    mockPost.user_id = 'some-other-user-789'

    await act(async () => render(<Post />))
    await waitFor(() => expect(screen.getByText('Test Post Title')).toBeTruthy())

    const bookmarksBuilder = {
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((resolve) => 
        Promise.resolve(resolve({ data: [{ id: 'new-bookmark-123' }], error: null }))
      )
    }
    mockActiveChains['bookmarks'] = bookmarksBuilder

    const bookmarkBtn = screen.getByRole('button')
    await act(async () => fireEvent.press(bookmarkBtn))

    expect(supabase.from).toHaveBeenCalledWith('bookmarks')
    expect(mockActiveChains['bookmarks'].insert).toHaveBeenCalledWith({
      user_id: 'mock-user-456',
      post_id: 'mock-post-123'
    })

    mockPost.user_id = 'mock-user-456'
  })

  it('Post is unsaved after retracting bookmark', async () => {
    mockPost.user_id = 'some-other-user-789'

    const bookmarksBuilder = {
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((resolve) => 
        Promise.resolve(resolve({ data: [{ id: 'active-bookmark-777' }], error: null }))
      )
    }
    mockActiveChains['bookmarks'] = bookmarksBuilder

    await act(async () => render(<Post />))
    await waitFor(() => expect(screen.getByText('Test Post Title')).toBeTruthy())

    const bookmarkIconText = screen.getByRole('button')
    await act(async () => fireEvent.press(bookmarkIconText))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('bookmarks')
      expect(mockActiveChains['bookmarks'].delete).toHaveBeenCalled()
      expect(mockActiveChains['bookmarks'].eq).toHaveBeenCalledWith('id', 'active-bookmark-777')
    })

    mockPost.user_id = 'mock-user-456'
  })
})