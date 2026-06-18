import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import { appStyles } from '../styles/styles'
import { useAuthContext } from '../hooks/auth-context'
import Entypo from '@expo/vector-icons/Entypo'
import { useEffect, useState } from 'react'

export default function Comment({ comment, depth, editing, loading, onReplyPress, onVotePress, onEditPress, onUpdatePress, onDeletePress }) {
  const { claims } = useAuthContext()
  const userId = claims?.sub
  const indentation = Math.min(depth, 4) * 16
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
    <View style={{ marginLeft: indentation }}>
      {editing !== comment.id ? (<Text>{comment.content}</Text>): (
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
      <View style={[styles.row, { justifyContent: 'space-between', paddingHorizontal: 12 }]}>
        <Text>{comment.score}</Text>
        <TouchableOpacity onPress={() => onVotePress(comment)} disabled={loading}>
          <Entypo name='arrow-bold-up' size={16} color={comment.voted === null ? '#000000': '#2e2c2c48' } />
        </TouchableOpacity>
        {comment.user_id === userId && (
          <TouchableOpacity
            style={{ marginLeft: 'auto', paddingRight: 12 }}
            onPress={() => onEditPress(comment)}
            disabled={loading || editing === comment.id}>
            <Entypo name='edit' size={16} />
          </TouchableOpacity>
        )}
        {comment.user_id === userId && (
          <TouchableOpacity
            style={{ marginLeft: 'auto', paddingRight: 12 }}
            onPress={() => onDeletePress(comment.id)}
            disabled={loading}>
            <Entypo name='trash' size={16} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => onReplyPress(comment)} disabled={loading}>
          <Entypo name='reply' size={16} />
        </TouchableOpacity>
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