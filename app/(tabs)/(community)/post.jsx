import { useState, useEffect, useMemo } from 'react'
import { View, Text, TextInput, FlatList, ActivityIndicator, TouchableOpacity, 
  Alert, KeyboardAvoidingView } from 'react-native'
import { appStyles } from '../../../styles/styles'
import { supabase } from '../../../lib/supabase'
import { useLocalSearchParams, Stack } from 'expo-router'
import { useAuthContext } from '../../../hooks/auth-context'
import Entypo from '@expo/vector-icons/Entypo'
import Comment from '../../../components/comment'
import Spacer from '../../../components/spacer'

const buildCommentTree = (comments, votes) => {
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
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState(null)
  const [votes, setVotes] = useState(null)
  const [replyingTo, setReplyingTo] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [postId])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [commentsResponse, votesResponse, postResponse] = await Promise.all([
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
          .eq('id', postId)])
      if (commentsResponse.error) throw commentsResponse.error
      if (votesResponse.error) throw votesResponse.error
      if (postResponse.error) throw postResponse.error
      if (commentsResponse.data) setComments(commentsResponse.data)
      if (votesResponse.data) setVotes(votesResponse.data)
      if (postResponse.data) setPost(postResponse.data[0])
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
    if (!newComment.trim()) return

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

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView behavior='padding'>
      <View style={[styles.container, { alignItems: 'stretch', width: '100%', marginTop: 10 }]}>
        <Stack.Screen options={{ title: 'Discussion Forum', headerBackVisible: false, headerTitleAlign: 'center' }}/>
        <Text>{post.content}</Text>
        {replyingTo && (
          <Text>Replying to {replyingTo.username}</Text>
        )}
        <TextInput 
          value={newComment}
          onChangeText={(text) => setNewComment(text)}
          style={styles.input}
          placeholder='Enter comment'
        />
        <Spacer height={10} />
        <TouchableOpacity
          style={[styles.button,
          loading && styles.buttonDisabled]}
          onPress={handleAdd}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>

        <FlatList
          data={commentTree}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Comment 
              comment={item} depth={0} 
              onReplyPress={() => setReplyingTo(item)} 
              onVotePress={(comment) => handleVote({ comment: comment })}/>
          )}
        />
      </View>
    </KeyboardAvoidingView>
  )
}