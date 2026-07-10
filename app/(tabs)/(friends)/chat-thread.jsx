import { useState, useEffect } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, 
  KeyboardAvoidingView, Platform, StyleSheet, Modal, Alert } from 'react-native'
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

      const { error } = await supabase
        .from('workout_invites')
        .insert({
          sender_id: userId,
          receiver_id: recipientId,
          proposed_date: inviteDate.toISOString(),
          message: inviteNote.trim() || null
        })

      if (error)
        throw error

      setShowInviteModal(false)
      setInviteNote('')
      Alert.alert('Invite Sent', 'Your workout invite has been sent!')
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setSendingInvite(false)
    }
  }

  if (loading) {
    return (
      <View style={appStyles.loadingContainer}>
        <ActivityIndicator size="small" color="#000" />
      </View>
    )
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

      <TouchableOpacity
        style={appStyles.inviteButton}
        onPress={() => setShowInviteModal(true)}
      >
        <Text style={appStyles.inviteButtonText}>+ Invite to Workout</Text>
      </TouchableOpacity>

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

    <Modal visible={showInviteModal} transparent animationType="fade">
      <View style={appStyles.modalOverlay}>
        <View style={appStyles.modalContent}>
          <Text style={appStyles.modalTitle}>Invite to Workout</Text>

          <DateTimePicker
            value={inviteDate}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              if (selectedDate) {
                setInviteDate(selectedDate)
              }
            }}
          />

          <TextInput
            style={appStyles.modalNoteInput}
            placeholder="Add a note (optional)"
            value={inviteNote}
            onChangeText={setInviteNote}
            multiline
          />

          <View style={appStyles.modalButtonRow}>
            <TouchableOpacity onPress={() => setShowInviteModal(false)}>
              <Text style={appStyles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSendInvite} disabled={sendingInvite}>
              <Text style={appStyles.modalSendText}>{sendingInvite ? 'Sending...' : 'Send Invite'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  </>
)
}