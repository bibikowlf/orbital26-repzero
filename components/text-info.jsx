import { View, Text, TouchableOpacity, Alert, Modal } from 'react-native'
import { appStyles } from '../styles/styles'
import Entypo from '@expo/vector-icons/Entypo'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { Dropdown } from 'react-native-element-dropdown'

const reasonData = [
  { label: 'Spam', value: 'Spam' },
  { label: 'Hate Speech', value: 'Hate Speech' },
  { label: 'Harassment', value: 'Harassment' },
  { label: 'Inappropriate Content', value: 'Inappropriate Content' },
  { label: 'Other', value: 'Other' }
]

export default function TextInfo({ marginBottom, isAuthor, canReply, score, loading, editing, hasVoted, onVotePress, onEditPress, onDeletePress, onReplyPress, onReportPress }) {
  const [modalVisible, setModalVisible] = useState(false)
  const styles = appStyles

  return (
    <View style={[styles.row, { marginBottom: marginBottom }]}>
      <TouchableOpacity onPress={onVotePress} disabled={loading}>
        <Entypo name='arrow-bold-up' size={16} color={hasVoted ? '#2e2c2c48' : 'black'} />
      </TouchableOpacity>
      <Text style={{ marginLeft: 4, color: 'black' }}>{score}</Text>
      {canReply && (
        <TouchableOpacity
          style={{ marginLeft: 12 }}
          onPress={onReplyPress} 
          disabled={loading}>
          <Entypo name='reply' size={16} color='black' />
        </TouchableOpacity>
      )}
      {canReply && !isAuthor && (
        <View>
          <TouchableOpacity
            style={{ marginLeft: 12 }}
            onPress={() => setModalVisible(true)} 
            disabled={loading}>
            <Ionicons name='flag' size={16} color='black' />
          </TouchableOpacity>
          <Modal 
            visible={modalVisible}
            transparent={true}
            animationType='fade'
            onRequestClose={() => setModalVisible(false)}
          >
            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}
              activeOpacity={1}
              onPress={() => setModalVisible(false)}
            >
              <TouchableOpacity style={{ backgroundColor: 'white', padding: 20, borderRadius: 12 }}>
                <Text style={styles.fieldLabel}>Select reason for reporting</Text>
                <Dropdown
                  style={styles.dropdown}
                  mode='modal'
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  data={reasonData}
                  maxHeight={200}
                  labelField='label'
                  valueField='value'
                  placeholder='Select reason'
                  onChange={item => {
                    setModalVisible(false)
                    Alert.alert(
                      'Confirm Report', 'Are you sure you want to report and hide this item? This action cannot be undone.', 
                      [
                        {text: 'Cancel'}, 
                        {text: 'Report', onPress: () => onReportPress(item.value)}
                      ]
                  )}}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        </View>
      )}
      {isAuthor && (
        <TouchableOpacity
          style={{ marginLeft: 12 }}
          onPress={onEditPress}
          disabled={loading || editing}>
          <Entypo name='edit' size={16} color='black' />
        </TouchableOpacity>
      )}
      {isAuthor && (
        <TouchableOpacity
          style={{ marginLeft: 12 }}
          onPress={() => {
            Alert.alert(
              'Confirm Deletion', 'Are you sure you want to delete this item? This action cannot be undone.', 
              [
                {text: 'Cancel'}, 
                {text: 'Delete', onPress: onDeletePress}
              ]
          )}}
          disabled={loading}>
          <Entypo name='trash' size={16} color='black' />
        </TouchableOpacity>
      )}
    </View>
  )
}