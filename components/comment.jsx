import { View, Text, TouchableOpacity } from 'react-native'
import { appStyles } from '../styles/styles'
import Entypo from '@expo/vector-icons/Entypo'

export default function Comment({ comment, depth, onReplyPress, onVotePress }) {
  const indentation = Math.min(depth, 4) * 16
  const styles = appStyles

  return (
    <View style={{ marginLeft: indentation }}>
      <Text>{comment.content}</Text>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Text>{comment.score}</Text>
        <TouchableOpacity onPress={() => onVotePress(comment)}>
          <Entypo name='arrow-bold-up' size={16} color={comment.voted === null ? '#000000': '#2e2c2c48' } />
        </TouchableOpacity>
        <TouchableOpacity onPress={onReplyPress}>
          <Entypo name='reply' size={16} />
        </TouchableOpacity>
      </View>
      {comment.replies && comment.replies.map(reply => (
        <Comment 
          key={reply.id} comment={reply} depth={depth + 1} 
          onReplyPress={onReplyPress} 
          onVotePress={onVotePress} />
      ))}
    </View>
  )
}