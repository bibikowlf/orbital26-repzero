import { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Pressable, FlatList } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { useAuthContext } from '../../../hooks/auth-context'
import { appStyles } from '../../../styles/styles'
import Spacer from '../../../components/spacer'

export default function FriendsHome() {
  const router = useRouter()
  const { claims } = useAuthContext()
  const userId = claims?.sub

  const [friendCount, setFriendCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [chatsLoading, setChatsLoading] = useState(false)
  const [chats, setChats] = useState([])

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchCounts()
        fetchChats()
      }
    }, [userId])
  )

  async function fetchCounts() {
    try {
      setLoading(true)

      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`follower_id.eq.${userId},following_id.eq.${userId}`)

      if (error)
        throw error

      setFriendCount(count || 0)
    } catch (error) {
      console.error('Error fetching friend count:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchChats() {
    try {
      setChatsLoading(true)

      const { data: followRows, error: followError } = await supabase
        .from('follows')
        .select('follower_id, following_id')
        .eq('status', 'accepted')
        .or(`follower_id.eq.${userId},following_id.eq.${userId}`)

      if (followError)
        throw followError

      const ids = (followRows || []).map((row) =>
        row.follower_id === userId ? row.following_id : row.follower_id
      )

      if (ids.length === 0) {
        setChats([])
        return
      }

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', ids)

      if (profileError)
        throw profileError

      const { data: allMessages, error: messagesError } = await supabase
      .from('messages')
      .select('sender_id, receiver_id, content, message_type, created_at')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })

      if (messagesError)
        throw messagesError

      const lastMessageMap = {};
      
      (allMessages || []).forEach((msg) => {
        const counterpartId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id
        if (!lastMessageMap[counterpartId]) {
          lastMessageMap[counterpartId] = msg
        }
      })

      const merged = (profiles || []).map((profile) => ({
        ...profile,
        lastMessage: lastMessageMap[profile.id] || null
      }))

      merged.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) 
          return 0
        if (!a.lastMessage) 
          return 1
        if (!b.lastMessage) 
          return -1
        return new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
      })

      setChats(merged)
    } catch (error) {
      console.error('Error fetching chats:', error)
    } finally {
      setChatsLoading(false)
    }
  }

  return (
    <View style={[appStyles.container, { paddingHorizontal: 20, paddingTop: 0, justifyContent: 'flex-start' }]}>

      <View style={appStyles.metricsCard}>
        {loading ? (
          <ActivityIndicator size="small" color="#4F46E5" style={{ paddingVertical: 10 }} />
        ) : (
          <TouchableOpacity
            style={[appStyles.metricItem, { width: '100%', alignItems: 'center' }]}
            onPress={() => router.push('/follow-list')}
          >
            <Text style={appStyles.metricNumber}>{friendCount}</Text>
            <Text style={appStyles.metricLabel}>Friends</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={appStyles.sectionHeaderRow}>
        <Text style={appStyles.sectionTitle}>Messages</Text>
        <TouchableOpacity
          style={appStyles.addButton}
          onPress={() => router.push('/search-users')}
        >
          <Text style={appStyles.addButtonText}>+ Find Friends</Text>
        </TouchableOpacity>
      </View>

      {chatsLoading && <ActivityIndicator size="small" color="#000" style={{ marginVertical: 10 }} />}

      {!chatsLoading && chats.length === 0 && (
        <Text style={appStyles.fallbackText}>Add a friend to start chatting.</Text>
      )}

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const preview = item.lastMessage
            ? (item.lastMessage.message_type === 'invite' ? '🏋️ Workout invite' : item.lastMessage.content)
            : 'Say hi!'
    
          return (
            <TouchableOpacity
              style={appStyles.chatRow}
              onPress={() => router.push({ pathname: '/chat-thread', params: { recipientId: item.id, recipientUsername: item.username } })}
            >
              <View style={appStyles.avatarPlaceholder}>
                <Text style={appStyles.avatarText}>
                  {item.username?.substring(0, 2).toUpperCase() || '??'}
                </Text>
              </View>
              
              <View style={appStyles.chatInfo}>
                <View style={appStyles.chatHeaderLine}>
                  <Text style={appStyles.usernameText}>{item.username}</Text>
                  {item.lastMessage && (
                    <Text style={appStyles.timeText}>
                      {new Date(item.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>
                <Text style={appStyles.previewText} numberOfLines={1}>
                  {preview}
                </Text>
              </View>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}