import { buildCommentTree } from '../../functions/build-comment-tree'

jest.mock('@react-native-async-storage/async-storage', () => 
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}))

describe('BuildCommentTree Test', () => {
  it('should correctly nest a reply under its parent comment', () => {
    const mockComments = [
      { id: 1, content: 'Parent comment', parent_id: null },
      { id: 2, content: 'Child reply', parent_id: 1 }
    ]
    const mockVotes = []
    const mockReports = new Set()
    const result = buildCommentTree(mockComments, mockVotes, mockReports)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
    expect(result[0].replies).toHaveLength(1)
    expect(result[0].replies[0].id).toBe(2)
  })

  it('should map user vote IDs to the correct comments', () => {
    const mockComments = [{ id: 1, content: 'Comment', parent_id: null }]
    const mockVotes = [{ id: 'vote-1', comment_id: 1 }]
    const mockReports = new Set()
    const result = buildCommentTree(mockComments, mockVotes, mockReports)

    expect(result[0].voted).toBe('vote-1')
  })

  it('should map user reports to the correct comments', () => {
    const mockComments = [{ id: 1, content: 'Comment', parent_id: null }]
    const mockVotes = []
    const mockReports = new Set([1])
    const result = buildCommentTree(mockComments, mockVotes, mockReports)

    expect(result[0].reported).toBe(true)
  })
})