import { useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../hooks/auth-context'
import { appStyles } from '../styles/styles'
import BackButton from '../components/back-button'
import { createNotification } from '../lib/notifications'

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function Notifications() {
  const { claims } = useAuthContext()
  const userId = claims?.sub

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      if (userId) fetchAndMarkRead()
    }, [userId])
  )

  async function fetchAndMarkRead() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.log('Error fetching notifications:', error)
      setLoading(false)
      return
    }

    setNotifications(data || [])
    setLoading(false)

    const unreadIds = (data || []).filter(n => !n.read).map(n => n.id)
    if (unreadIds.length > 0) {
      await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
    }
  }

  async function handleAcceptRequest(notification) {
    try {
      const { error } = await supabase
        .from('follows')
        .update({ status: 'accepted' })
        .eq('follower_id', notification.actor_id)
        .eq('following_id', userId)
        .select()

      if (error) throw error

      if (!updated || updated.length === 0) {
        await supabase.from('notifications').delete().eq('id', notification.id)
        setNotifications(prev => prev.filter(n => n.id !== notification.id))
        Alert.alert('Request no longer available', 'This friend request was cancelled.')
        return
      }

      const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', notification.actor_id)
        .single()

      const { error: updateError } = await supabase
        .from('notifications')
        .update({
          type: 'friend_request_accepted',
          message: `You and @${requesterProfile?.username} are now friends!`,
        })
        .eq('id', notification.id)

      if (updateError) throw updateError

      createNotification({
        userId: notification.actor_id,
        actorId: userId,
        type: 'friend_request_accepted',
        message: `@${myProfile.username} request was accepted. You are now friends!`,
      })

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id
            ? { ...n, type: 'friend_request_accepted', message: `You and @${requesterProfile?.username} are now friends!` }
            : n
        )
      )
    } catch (error) {
      console.log('Error accepting friend request:', error)
    }
  }

  async function handleDeclineRequest(notification) {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', notification.actor_id)
        .eq('following_id', userId)

      if (error) throw error

      await supabase.from('notifications').delete().eq('id', notification.id)

      setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
    } catch (error) {
      console.log('Error declining friend request:', error)
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#888' }}>Loading...</Text>
      </View>
    )
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ padding: 20, flexGrow: 1 }}
      data={notifications}
      keyExtractor={item => item.id}
      ListEmptyComponent={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 }}>
          <Text style={appStyles.emptyText}>No notifications yet.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View
          style={{
            paddingVertical: 14,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: item.read ? '#fff' : '#eef3ff',
            marginBottom: 8,
            borderWidth: 1,
            borderColor: '#eee',
          }}
        >
          <Text style={{ fontSize: 14, color: '#000' }}>{item.message}</Text>
          <Text style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{timeAgo(item.created_at)}</Text>

          {item.type === 'friend_request' && (
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <TouchableOpacity
                style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#34C759', marginRight: 8 }}
                onPress={() => handleAcceptRequest(item)}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#FF3B30' }}
                onPress={() => handleDeclineRequest(item)}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Decline</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    />
  )
}