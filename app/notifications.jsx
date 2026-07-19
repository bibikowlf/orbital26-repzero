import { useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../hooks/auth-context'
import { appStyles } from '../styles/styles'
import BackButton from '../components/back-button'

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
        </View>
      )}
    />
  )
}