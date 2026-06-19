import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { appStyles } from '../styles/styles'
import Entypo from '@expo/vector-icons/Entypo'

export default function TextInfo({ marginBottom, isAuthor, canReply, score, loading, editing, hasVoted, onVotePress, onEditPress, onDeletePress, onReplyPress }) {
  const styles = appStyles

  return (
    <View style={[styles.row, { marginBottom: marginBottom }]}>
      <TouchableOpacity onPress={onVotePress} disabled={loading}>
        <Entypo name='arrow-bold-up' size={16} color={hasVoted ? '#2e2c2c48' : '#000000'} />
      </TouchableOpacity>
      <Text style={{ marginLeft: 4 }}>{score}</Text>
      {canReply && (
        <TouchableOpacity
          style={{ marginLeft: 12 }}
          onPress={onReplyPress} 
          disabled={loading}>
          <Entypo name='reply' size={16} />
        </TouchableOpacity>
      )}
      {isAuthor && (
        <TouchableOpacity
          style={{ marginLeft: 12 }}
          onPress={onEditPress}
          disabled={loading || editing}>
          <Entypo name='edit' size={16} />
        </TouchableOpacity>
      )}
      {isAuthor && (
        <TouchableOpacity
          style={{ marginLeft: 12 }}
          onPress={() => {
            Alert.alert(
              'COnfirm Deletion', 'Are you sure you want to delete this item? This action cannot be undone.', 
              [
                {text: 'Cancel'}, 
                {text: 'Delete', onPress: onDeletePress}
              ]
          )}}
          disabled={loading}>
          <Entypo name='trash' size={16} />
        </TouchableOpacity>
      )}
    </View>
  )
}