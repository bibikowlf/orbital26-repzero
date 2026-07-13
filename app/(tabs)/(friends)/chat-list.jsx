import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { useAuthContext } from '../../../hooks/auth-context'
import { appStyles } from '../../../styles/styles'

export default function ChatList() {
  const router = useRouter()
  const { claims } = useAuthContext()
  const userId = claims?.sub

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (userId)
      fetchFollowing()
  }, [userId])

  async function fetchFollowing() {
    try {
      setLoading(true)

      const { data: followRows, error: followError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)

      if (followError)
        throw followError

      const ids = (followRows || []).map((row) => row.following_id)

      if (ids.length === 0) {
        setUsers([])
        return
      }

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', ids)

      if (profileError)
        throw profileError

      setUsers(profiles || [])
    } catch (error) {
      console.error('Error fetching chat list:', error)
    } finally {
      setLoading(false)
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
      {users.length === 0 && (
        <Text style={appStyles.fallbackText}>Follow someone to start chatting.</Text>
      )}

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              paddingVertical: 14,
              paddingHorizontal: 4,
              borderBottomWidth: 1,
              borderBottomColor: '#E5E5E5'
            }}
            onPress={() => router.push({ pathname: '/chat-thread', params: { recipientId: item.id, recipientUsername: item.username } })}
          >
            <Text style={appStyles.exerciseName}>{item.username}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}