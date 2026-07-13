import { useState, useEffect } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, 
  KeyboardAvoidingView, Platform, StyleSheet, Modal, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { useAuthContext } from '../../../hooks/auth-context'
import { appStyles } from '../../../styles/styles'
import DateTimePicker from '@react-native-community/datetimepicker'

export default function ChatThread() {
  const { recipientId } = useLocalSearchParams()
  const { claims } = useAuthContext()
  const userId = claims?.sub

  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteDate, setInviteDate] = useState(new Date())
  const [inviteNote, setInviteNote] = useState('')
  const [sendingInvite, setSendingInvite] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [inviteStatuses, setInviteStatuses] = useState({})

  const [showEventModal, setShowEventModal] = useState(false)
  const [myEvents, setMyEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [sendingEventInvite, setSendingEventInvite] = useState(false)

  useEffect(() => {
    if (userId && recipientId)
      fetchMessages()
  }, [userId, recipientId])

  useEffect(() => {
    if (!userId || !recipientId)
      return

    const channel = supabase
      .channel(`chat-${userId}-${recipientId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new
          const isRelevant =
            (newMsg.sender_id === userId && newMsg.receiver_id === recipientId) ||
            (newMsg.sender_id === recipientId && newMsg.receiver_id === userId)

          if (isRelevant) {
            setMessages((prev) => [...prev, newMsg])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, recipientId])

  async function fetchMessages() {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true })

      if (error)
        throw error

      setMessages(data || [])

      const inviteIds = (data || []).filter((m) => m.invite_id).map((m) => m.invite_id)

      if (inviteIds.length > 0) {
        const { data: invites, error: inviteError } = await supabase
          .from('workout_invites')
          .select('id, status, proposed_date, message, receiver_id')
          .in('id', inviteIds)

        if (inviteError)
          throw inviteError

        const statusMap = {}
        invites.forEach((inv) => { statusMap[inv.id] = inv })
        setInviteStatuses(statusMap)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!text.trim())
      return

    const messageText = text.trim()
    setText('')

    try {
      setSending(true)

      const { data, error } = await supabase
        .from('messages')
        .insert({ sender_id: userId, receiver_id: recipientId, content: messageText })
        .select()
        .single()

      if (error)
        throw error

      setMessages((prev) => prev.some((m) => m.id === data.id) ? prev : [...prev, data])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  async function handleSendInvite() {
    try {
      setSendingInvite(true)

      const { data: invite, error } = await supabase
        .from('workout_invites')
        .insert({
          sender_id: userId,
          receiver_id: recipientId,
          proposed_date: inviteDate.toISOString(),
          message: inviteNote.trim() || null
        })
        .select()
        .single()

      if (error)
        throw error

      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          receiver_id: recipientId,
          content: 'Workout invite sent',
          message_type: 'invite',
          invite_id: invite.id
        })

        console.log("MESSAGE ERROR:", messageError)

      if (messageError)
        throw messageError

      setShowInviteModal(false)
      setInviteNote('')
      Alert.alert('Invite Sent', 'Your workout invite has been sent!')
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setSendingInvite(false)
    }
  }

  async function handleRespondToInvite(inviteId, status) {
    try {
      const { error } = await supabase
        .from('workout_invites')
        .update({ status })
        .eq('id', inviteId)

      if (error)
        throw error

      setInviteStatuses((prev) => ({ ...prev, [inviteId]: { ...prev[inviteId], status } }))
    } catch (error) {
      Alert.alert('Error', error.message)
    }
  }

  if (loading) {
    return (
      <View style={appStyles.loadingContainer}>
        <ActivityIndicator size="small" color="#000" />
      </View>
    )
  }

    async function handleOpenEventModal() {
    setShowEventModal(true)

    try {
      setLoadingEvents(true)

      const { data, error } = await supabase
        .from('events')
        .select('id, title, event_date')
        .eq('creator_id', userId)
        .order('event_date', { ascending: true })

      if (error)
        throw error

      setMyEvents(data || [])
    } catch (error) {
      console.error('Error fetching your events:', error)
    } finally {
      setLoadingEvents(false)
    }
  }

  async function handleSendEventInvite(event) {
    try {
      setSendingEventInvite(true)

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: userId,
          receiver_id: recipientId,
          content: `Invited you to ${event.title}`,
          message_type: 'event_invite',
          event_id: event.id
        })

      if (error)
        throw error

      setShowEventModal(false)
      Alert.alert('Invite Sent', `Invited to "${event.title}"`)
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setSendingEventInvite(false)
    }
  }

  return (
  <>
    <KeyboardAvoidingView
      style={appStyles.flexOne}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={appStyles.messageListContent}
        renderItem={({ item }) => {
          const isMine = item.sender_id === userId

          if (item.message_type === 'invite') {
            const invite = inviteStatuses[item.invite_id]
            const isReceiver = invite?.receiver_id === userId
            const status = invite?.status || 'pending'

            return (
              <View style={[appStyles.inviteCard, isMine ? appStyles.messageBubbleMine : appStyles.messageBubbleTheirs]}>
                <Text style={[appStyles.inviteCardTitle, { color: isMine ? '#fff' : '#000' }]}>
                  🏋️ Workout Invite
                </Text>
                {invite?.proposed_date && (
                  <Text style={{ color: isMine ? '#fff' : '#000', marginTop: 4 }}>
                    {new Date(invite.proposed_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </Text>
                )}
                {invite?.message && (
                  <Text style={{ color: isMine ? '#fff' : '#000', marginTop: 4, fontStyle: 'italic' }}>
                    "{invite.message}"
                  </Text>
                )}

                {isReceiver && status === 'pending' && (
                  <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <TouchableOpacity
                      style={[appStyles.actionButton, { backgroundColor: '#34C759', marginRight: 8, paddingHorizontal: 14 }]}
                      onPress={() => handleRespondToInvite(item.invite_id, 'accepted')}
                    >
                      <Text style={appStyles.buttonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[appStyles.actionButton, { backgroundColor: '#FF3B30', paddingHorizontal: 14 }]}
                      onPress={() => handleRespondToInvite(item.invite_id, 'declined')}
                    >
                      <Text style={appStyles.buttonText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {status !== 'pending' && (
                  <Text style={{ color: isMine ? '#fff' : '#000', marginTop: 8, fontWeight: 'bold' }}>
                    {status === 'accepted' ? '✅ Accepted' : '❌ Declined'}
                  </Text>
                )}
              </View>
            )
          }

          return (
            <View style={[appStyles.messageBubble, isMine ? appStyles.messageBubbleMine : appStyles.messageBubbleTheirs]}>
              <Text style={isMine ? appStyles.messageTextMine : appStyles.messageTextTheirs}>{item.content}</Text>
            </View>
          )
        }}
        ListEmptyComponent={
          <Text style={appStyles.fallbackText}>No messages yet. Say hi!</Text>
        }
      />

      <View style={appStyles.inviteButtonRow}>
        <TouchableOpacity
          style={[appStyles.inviteButton, { flex: 1, marginRight: 8 }]}
          onPress={() => setShowInviteModal(true)}
        >
          <Text style={appStyles.inviteButtonText}>+ Workout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[appStyles.inviteButton, { flex: 1, backgroundColor: '#FF9500' }]}
          onPress={handleOpenEventModal}
        >
          <Text style={appStyles.inviteButtonText}>+ Event</Text>
        </TouchableOpacity>
      </View>

      <View style={appStyles.inputRow}>
        <TextInput
          style={appStyles.textInput}
          placeholder="Message"
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          style={[appStyles.actionButton, appStyles.sendButton, sending && appStyles.buttonDisabled]}
          onPress={handleSend}
          disabled={sending}
        >
          <Text style={appStyles.buttonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>

    <Modal
      visible={showInviteModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowInviteModal(false)}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={appStyles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={appStyles.modalContent}>
                <Text style={appStyles.modalTitle}>
                  Invite to Workout
                </Text>

                <View style={{ 
                  backgroundColor: '#F2F2F7', 
                  borderRadius: 8, 
                  padding: 8, 
                  marginVertical: 12,
                  width: '100%',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}></View>

                <TouchableOpacity
                  style={appStyles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={appStyles.dateButtonText}>
                    {inviteDate.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={inviteDate}
                    mode="datetime"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios')
                      if (selectedDate)
                        setInviteDate(selectedDate)
                    }}
                    style = {appStyles.datePicker}
                  />
                )}

                <TextInput
                  style={appStyles.modalNoteInput}
                  placeholder="Add a note (optional)"
                  value={inviteNote}
                  onChangeText={setInviteNote}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  blurOnSubmit
                />

                <View style={appStyles.modalButtonRow}>
                  <TouchableOpacity
                    onPress={() => setShowInviteModal(false)}
                  >
                    <Text style={appStyles.modalCancelText}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSendInvite}
                    disabled={sendingInvite}
                  >
                    <Text style={appStyles.modalSendText}>
                      {sendingInvite ? 'Sending...' : 'Send Invite'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
    <Modal visible={showEventModal} transparent animationType="fade">
    <View style={appStyles.modalOverlay}>
      <View style={appStyles.modalContent}>
        <Text style={appStyles.modalTitle}>Invite to Event</Text>

        {loadingEvents ? (
          <ActivityIndicator size="small" color="#000" style={{ marginTop: 20 }} />
        ) : myEvents.length === 0 ? (
          <Text style={appStyles.fallbackText}>You haven't created any events yet.</Text>
        ) : (
          <FlatList
            data={myEvents}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 250, marginTop: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.eventOptionRow}
                onPress={() => handleSendEventInvite(item)}
                disabled={sendingEventInvite}
              >
                <Text style={appStyles.exerciseName}>{item.title}</Text>
                <Text style={{ color: '#666', marginTop: 2 }}>
                  {new Date(item.event_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}

        <View style={appStyles.modalButtonRow}>
          <TouchableOpacity onPress={() => setShowEventModal(false)}>
            <Text style={appStyles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
  </>
  )
}