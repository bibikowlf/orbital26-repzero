export const buildCommentTree = (comments, votes) => {
  const map = {}
  const roots = []

  comments.forEach(comment => map[comment.id] = { ...comment, voted: null, replies: []})
  votes.forEach(vote => {
    if (map[vote.comment_id]) map[vote.comment_id].voted = vote.id
  })
  comments.forEach(comment => {
    const mappedComment = map[comment.id]
    if (comment.parent_id) {
        map[comment.parent_id].replies.push(mappedComment)
    } else {
        roots.push(mappedComment)
    }
  })
  return roots
}