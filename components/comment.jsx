import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import { appStyles } from '../styles/styles'
import { useAuthContext } from '../hooks/auth-context'
import Entypo from '@expo/vector-icons/Entypo'
import { useEffect, useState } from 'react'
import TextInfo from './text-info'

export default function Comment({ comment, depth, editing, loading, onReplyPress, onVotePress, onEditPress, onUpdatePress, onDeletePress }) {
  const { claims } = useAuthContext()
  const userId = claims?.sub
  const indentation = Math.min(depth, 4) === 0 ? 0 : 1
  const [editComment, setEditComment] = useState(null)
  const styles = appStyles

  useEffect(() => {
    if (editing === comment.id) {
      setEditComment(comment.content)
    } else {
      setEditComment(null)
    }
  }, [editing])

  return (
    <View style={{ 
      borderLeftWidth: indentation * 2,
      borderLeftColor: '#E2E8F0',
      marginLeft: indentation * 8,
      paddingLeft: indentation * 12,
      marginTop: 6 }}
    >
      <View style={{flex:1}}>
        <Text style={{color: 'gray', fontSize: 12}}>
          {comment.user_id === userId ? 'You': '@' + comment.username}
        </Text>
        {editing !== comment.id ? (
          <Text style={{ fontSize: 16, color: 'black' }}>{comment.content}</Text>): (
          <View>
            <TextInput 
              value={editComment}
              onChangeText={(text) => setEditComment(text)}
              autoCapitalize='none'
              multiline={true}
              textAlignVertical='top'
              numberOfLines={10}
              style={styles.input}
            />
            <TouchableOpacity
              style={[styles.actionButton, 
                { backgroundColor: '#007AFF', flex: 0, marginTop: 10 }]}
              onPress={() => onUpdatePress(editComment)}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
        <TextInfo 
          marginBottom={10}
          isAuthor={comment.user_id === userId} 
          canReply={true} 
          score={comment.score} 
          loading={loading}
          editing={editing === comment.id}
          hasVoted={comment.voted !== null} 
          onVotePress={() => onVotePress(comment)} 
          onEditPress={() => onEditPress(comment)} 
          onDeletePress={() => onDeletePress(comment.id)} 
          onReplyPress={() => onReplyPress(comment)}
        />
      </View>
      {comment.replies && comment.replies.map(reply => (
        <Comment 
          key={reply.id} comment={reply} depth={depth + 1} 
          editing={editing} loading={loading}
          onReplyPress={onReplyPress} 
          onVotePress={onVotePress}
          onEditPress={onEditPress}
          onUpdatePress={onUpdatePress}
          onDeletePress={onDeletePress}
        />
      ))}
    </View>
  )
}