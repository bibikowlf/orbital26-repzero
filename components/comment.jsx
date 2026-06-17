import { View, Text, TouchableOpacity } from 'react-native'
import { appStyles } from '../styles/styles'
import Entypo from '@expo/vector-icons/Entypo'

export default function Comment({ comment, depth, onReplyPress }) {
  const indentation = Math.min(depth, 4) * 16

  return (
    <View style={{ marginLeft: indentation }}>
      <Text>{comment.content}</Text>
      {comment.replies && comment.replies.map(reply => {
        <Comment key={reply.id} comment={reply} depth={depth + 1} onReplyPress={onReplyPress} />
      })}
    </View>
  )
}