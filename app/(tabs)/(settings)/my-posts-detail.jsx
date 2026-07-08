import { useState, useEffect, useMemo, useRef } from 'react'
import { View, Text, TextInput, FlatList, ActivityIndicator, TouchableOpacity, 
  Alert, KeyboardAvoidingView, Image, useWindowDimensions} from 'react-native'
import { appStyles } from '../../../styles/styles'
import { supabase } from '../../../lib/supabase'
import { useLocalSearchParams, router } from 'expo-router'
import { useAuthContext } from '../../../hooks/auth-context'
import Entypo from '@expo/vector-icons/Entypo'
import Comment from '../../../components/comment'
import Spacer from '../../../components/spacer'
import TextInfo from '../../../components/text-info'

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

export default function Post() {
  const { claims } = useAuthContext()
  const userId = claims?.sub
  const { postId } = useLocalSearchParams()
  const styles = appStyles
  const { width: windowWidth } = useWindowDimensions()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState(null)
  const [votes, setVotes] = useState(null)
  const [replyingTo, setReplyingTo] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [votedPost, setVotedPost] = useState(null)
  const [editingComment, setEditingComment] = useState(null)
  const [editPost, setEditPost] = useState(null)
  const [imgIndex, setImgIndex] = useState(0)
  const imageListRef = useRef(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [postId])

  const fetchData = async () => {
    setNewComment('')
    setReplyingTo(null)
    setEditPost(null)
    setEditingComment(null)
    setImgIndex(0)
    try {
      setLoading(true)

      const [commentsResponse, votesResponse, postResponse, postVoteResponse] = await Promise.all([
        supabase
          .from('comments_with_votes')
          .select('*')
          .eq('post_id', postId),
        supabase
          .from('comment_votes')
          .select('*')
          .eq('user_id', userId),
        supabase
          .from('posts_with_votes')
          .select('*')
          .eq('id', postId),
        supabase
          .from('post_votes')
          .select('*')
          .eq('post_id', postId)
          .eq('user_id', userId)])
      if (commentsResponse.error) throw commentsResponse.error
      if (votesResponse.error) throw votesResponse.error
      if (postResponse.error) throw postResponse.error
      if (postVoteResponse.error) throw postVoteResponse.error
      if (commentsResponse.data) setComments(commentsResponse.data)
      if (votesResponse.data) setVotes(votesResponse.data)
      if (postResponse.data) setPost(postResponse.data[0])
      if (postVoteResponse.data && postVoteResponse.data[0]) setVotedPost(postVoteResponse.data[0].id)
    } catch (error) {
      if (error instanceof Error) Alert.alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const commentTree = useMemo(() => {
    if (votes === null || comments === null) return []
    return buildCommentTree(comments, votes)
  }, [votes, comments])

  const handleAdd = async () => {
    if (!newComment.trim()) {
      Alert.alert('Comment cannot be empty')
      return
    }

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('comments')
        .insert({
          content: newComment,
          user_id: userId,
          post_id: post.id,
          parent_id: replyingTo?.id
        })
        .select()
      if (error) throw error
      if (data) {
        const updated = [...comments, {...data[0], score: 0, username: 'You'}]
        setComments(updated)
      }
    } catch (error) {
      if (error instanceof Error) Alert.alert(error.message)
    } finally {
      setNewComment('')
      setReplyingTo(null)
      setLoading(false)
    }
  }

  const handleScrollImage = (index) => {
    if (!post?.image_urls || index < 0 || index >= post.image_urls.length) return
    imageListRef.current?.scrollToIndex({ index: index, animated: true })
    setImgIndex(index)
  }

  const handleVotePost = async () => {
    try {
      setLoading(true)
      
      if (votedPost !== null) {
        const { error } = await supabase
          .from('post_votes')
          .delete()
          .eq('id', votedPost)
        if (error) throw error
        setVotedPost(null)
        setPost({ ...post, score: post.score-1 })
      } else {
        const { data, error } = await supabase
          .from('post_votes')
          .insert({
            post_id: postId,
            user_id: userId
          })
          .select()
        if (error) throw error
        if (data && data[0]) setVotedPost(data[0].id)
        setPost({ ...post, score: post.score+1 })
      }
    } catch (error) {
      if (error instanceof Error) Alert.alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async ({ comment }) => {
    try {
      setLoading(true)
      
      if (comment.voted) {
        const { error } = await supabase
          .from('comment_votes')
          .delete()
          .eq('id', comment.voted)
        if (error) throw error
        setVotes(prevItems => prevItems.filter(item => item.id !== comment.voted))
        setComments(prevItems => prevItems.map(item => item.id === comment.id ? { ...item, score: item.score-1} : item))
      } else {
        const { data, error } = await supabase
          .from('comment_votes')
          .insert({
            comment_id: comment.id,
            user_id: userId
          })
          .select()
        if (error) throw error
        if (data) {
          setVotes(prevItems => [...prevItems, data[0]])
          setComments(prevItems => prevItems.map(item => item.id === comment.id ? { ...item, score: item.score+1} : item))
        }
      }
    } catch (error) {
      if (error instanceof Error) Alert.alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditPost = async () => {
    if (!editPost || !editPost.trim()) {
      Alert.alert('Post cannot be empty')
      return
    } else if (editPost === post.content) {
      setEditPost(null)
      return
    }
    try {
      setLoading(true)

      const { error } = await supabase
        .from('posts')
        .upsert({
          id: postId,
          content: editPost,
          user_id: userId,
          created_at: post.created_at,
          title: post.title, 
          image_urls: post.image_urls
        })
      if (error) throw error
      setPost({ ...post, content: editPost })
    } catch (error) {
      if (error instanceof Error) Alert.alert(error.message)
    } finally {
      setLoading(false)
      setEditPost(null)
    }
  }

  const handleEditComment = async (editComment) => {
    if (!editingComment || !editComment.trim()) {
      Alert.alert('Comment cannot be empty')
      return
    } else if (editComment === editingComment.content) {
      setEditingComment(null)
      return
    }
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('comments')
        .upsert({
          id: editingComment.id,
          post_id: editingComment.post_id,
          parent_id: editingComment.parent_id,
          content: editComment,
          user_id: userId,
          created_at: editingComment.created_at,
        })
      if (error) throw error
      setComments(comments.map(item => item.id === editingComment.id ? { ...item, content: editComment }: item))
    } catch (error) {
      if (error instanceof Error) Alert.alert(error.message)
    } finally {
      setLoading(false)
      setEditingComment(null)
    }
  }

  const handleDeletePost = async () => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
      if (error) throw error
    } catch (error) {
      if (error instanceof Error) Alert.alert(error.message)
    } finally {
      setLoading(false)
      router.navigate('/discussion-forum')
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
      if (error) throw error
      setComments(comments.filter(item => item.id !== commentId))
    } catch (error) {
      if (error instanceof Error) Alert.alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !post) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView behavior='padding' style={{ flex: 1 }}>
      <View style={[styles.container, 
        { alignItems: 'stretch', width: '100%', marginTop: 0, flex: 1 }]}>
        <FlatList
          data={commentTree}
          extraData={[comments, votes, editingComment]}
          keyExtractor={(item) => item.id.toString()}
          style={{ flex: 1 }}
          ListHeaderComponent={
            <View>
              <Text style={{color: 'gray', fontSize: 12}}>
                {post.user_id === userId ? 'You' : '@'+post.username}
              </Text>
              <Spacer height={2} />
              <Text style={styles.title}>{post.title}</Text>
              {post.image_urls && post.image_urls.length > 0 && (
                <View style={{ 
                  marginVertical: 10, 
                  width: '100%', 
                  height: 250, 
                  position: 'relative', 
                  backgroundColor: '#F1F5F9', 
                  borderRadius: 12, 
                  overflow: 'hidden' }}
                >
                  <FlatList
                    ref={imageListRef}
                    data={post.image_urls}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, idx) => idx.toString()}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <Image 
                        source={{ uri: item }} 
                        style={{ width: windowWidth - 32, height: '100%', resizeMode: 'contain' }} 
                      />
                    )}
                  />
                  {imgIndex > 0 && (
                    <TouchableOpacity 
                      style={{ 
                        position: 'absolute', 
                        left: 10, 
                        top: '40%', 
                        backgroundColor: 'black', 
                        borderRadius: 20, 
                        width: 36, 
                        height: 36, 
                        justifyContent: 'center', 
                        alignItems: 'center' }}
                      onPress={() => handleScrollImage(imgIndex - 1)}
                    >
                      <Entypo name='chevron-left' size={24} color='white' />
                    </TouchableOpacity>
                  )}
                  {imgIndex < post.image_urls.length - 1 && (
                    <TouchableOpacity 
                      style={{ 
                        position: 'absolute', 
                        right: 10, 
                        top: '40%', 
                        backgroundColor: 'black', 
                        borderRadius: 20, 
                        width: 36, 
                        height: 36, 
                        justifyContent: 'center', 
                        alignItems: 'center' }}
                      onPress={() => handleScrollImage(imgIndex + 1)}
                    >
                      <Entypo name='chevron-right' size={24} color='white' />
                    </TouchableOpacity>
                  )}
                  <View style={{ 
                    position: 'absolute', 
                    bottom: 10, 
                    right: 10, 
                    backgroundColor: 'black', 
                    paddingHorizontal: 8, 
                    paddingVertical: 4, 
                    borderRadius: 12 }}
                  >
                    <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>
                      {imgIndex + 1} / {post.image_urls.length}
                    </Text>
                  </View>
                </View>
              )}
              {editPost === null ? (
                <Text style={{ fontSize: 16, color: 'black' }}>{post.content}</Text>): (
                <View>
                  <TextInput 
                    value={editPost}
                    onChangeText={(text) => setEditPost(text)}
                    autoCapitalize='none'
                    multiline={true}
                    textAlignVertical='top'
                    numberOfLines={10}
                    style={styles.input}
                  />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      style={[styles.actionButton, 
                        { backgroundColor: '#007AFF', marginTop: 10 }, 
                        loading && styles.buttonDisabled]}
                      onPress={handleEditPost}
                      disabled={loading}
                    >
                      <Text style={styles.buttonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, 
                        { backgroundColor: '#007AFF', marginTop: 10 }, 
                        loading && styles.buttonDisabled]}
                      onPress={() => setEditPost(null)}
                      disabled={loading}
                    >
                      <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                  <Spacer height={6} />
                </View>
              )}
              <TextInfo
                marginBottom={10}
                isAuthor={post.user_id === userId} 
                canReply={true} 
                score={post.score} 
                loading={loading}
                editing={editPost !== null}
                hasVoted={votedPost !== null} 
                onVotePress={handleVotePost} 
                onEditPress={() => {
                  setEditingComment(null)
                  setEditPost(post.content)
                }} 
                onDeletePress={handleDeletePost} 
                onReplyPress={() => setReplyingTo(null)}
              />
              <Text style={{color: 'gray', fontSize: 12}}>
                Replying to {replyingTo === null ? 'post' : replyingTo.user_id === userId ? 'yourself' : '@'+replyingTo.username}
              </Text>
              <Spacer height={4} />
              <TextInput 
                value={newComment}
                onChangeText={(text) => setNewComment(text)}
                style={styles.input}
                placeholder='Enter comment'
                multiline={true}
                textAlignVertical='top'
              />
              <TouchableOpacity
                style={[styles.button,
                  { backgroundColor: '#007AFF', flex: 0, marginTop: 10 }, 
                  loading && styles.buttonDisabled]}
                onPress={handleAdd}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
              <Spacer height={10} />
            </View>
          }
          renderItem={({ item }) => (
            <Comment 
              comment={item} depth={0} 
              editing={editingComment?.id} loading={loading}
              onReplyPress={(comment) => setReplyingTo(comment)} 
              onVotePress={(comment) => handleVote({ comment: comment })}
              onEditPress={(comment) => {
                setEditingComment(comment)
                setEditPost(null)
              }}
              onUpdatePress={(editComment) => handleEditComment(editComment)}
              onDeletePress={(commentId) => handleDeleteComment(commentId)}
              onCancelPress={() => setEditingComment(null)}
            />
          )}
        />
      </View>
    </KeyboardAvoidingView>
  )
}