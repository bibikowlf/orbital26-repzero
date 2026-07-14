import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { useAuthContext } from '../../../hooks/auth-context'
import { appStyles } from '../../../styles/styles'

export default function InviteInbox() {
  const { claims } = useAuthContext()
  const userId = claims?.sub

  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(false)

  useFocusEffect(
    useCallback(() => {
      if (userId)
        fetchInvites()
    }, [userId])
  )

  async function fetchInvites() {
    try {
      setLoading(true)

      const { data: inviteRows, error: inviteError } = await supabase
        .from('workout_invites')
        .select('*')
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (inviteError)
        throw inviteError

      const senderIds = (inviteRows || []).map((inv) => inv.sender_id)

      if (senderIds.length === 0) {
        setInvites([])
        return
      }

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', senderIds)

      if (profileError)
        throw profileError

      const profileMap = {}
      profiles.forEach((p) => { profileMap[p.id] = p.username })

      const merged = inviteRows.map((inv) => ({
        ...inv,
        senderUsername: profileMap[inv.sender_id] || 'Unknown'
      }))

      setInvites(merged)
    } catch (error) {
      console.error('Error fetching invites:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRespond(inviteId, status) {
    try {
      const { error } = await supabase
        .from('workout_invites')
        .update({ status })
        .eq('id', inviteId)

      if (error)
        throw error

      setInvites((prev) => prev.filter((inv) => inv.id !== inviteId))
    } catch (error) {
      Alert.alert('Error', error.message)
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#000" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, paddingHorizontal: 15, paddingTop: 12 }}>
      {invites.length === 0 && (
        <Text style={appStyles.fallbackText}>No pending workout invites.</Text>
      )}

      <FlatList
        data={invites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{
            paddingVertical: 14,
            paddingHorizontal: 4,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E5E5'
          }}>
            <Text style={appStyles.exerciseName}>{item.senderUsername}</Text>
            <Text style={{ color: '#666', marginTop: 2 }}>
              {new Date(item.proposed_date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </Text>
            {item.message && (
              <Text style={{ color: '#333', marginTop: 4, fontStyle: 'italic' }}>"{item.message}"</Text>
            )}

            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <TouchableOpacity
                style={[appStyles.actionButton, { backgroundColor: '#34C759', marginRight: 10, paddingHorizontal: 16 }]}
                onPress={() => handleRespond(item.id, 'accepted')}
              >
                <Text style={appStyles.buttonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[appStyles.actionButton, { backgroundColor: '#FF3B30', paddingHorizontal: 16 }]}
                onPress={() => handleRespond(item.id, 'declined')}
              >
                <Text style={appStyles.buttonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  )
}