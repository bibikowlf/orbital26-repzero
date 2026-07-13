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

  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
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

      const { count: followers, error: followerError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)

      if (followerError)
        throw followerError

      const { count: following, error: followingError } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)

      if (followingError)
        throw followingError

      setFollowerCount(followers || 0)
      setFollowingCount(following || 0)
    } catch (error) {
      console.error('Error fetching follow counts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchChats() {
    try {
      setChatsLoading(true)
      console.log("FETCHING CHATS...")

      const { data: followRows, error: followError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)

      if (followError)
        throw followError

      const ids = (followRows || []).map((row) => row.following_id)

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


      setChats(merged)
    } catch (error) {
      console.error('Error fetching chats:', error)
    } finally {
      setChatsLoading(false)
    }
  }

  return (
    <View style={[appStyles.container, { paddingHorizontal: 15, paddingTop: 20, justifyContent: 'flex-start' }]}>

      {loading ? (
        <ActivityIndicator size="small" color="#000" />
      ) : (
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', gap: 40 }}>
        <TouchableOpacity
          style={{ alignItems: 'center' }}
          onPress={() => router.push({ pathname: '/follow-list', params: { mode: 'followers' } })}
        >
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{followerCount}</Text>
          <Text style={{ color: '#666' }}>Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ alignItems: 'center' }}
          onPress={() => router.push({ pathname: '/follow-list', params: { mode: 'following' } })}
        >
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{followingCount}</Text>
          <Text style={{ color: '#666' }}>Following</Text>
        </TouchableOpacity>
      </View>
      )}

      <Spacer />

      <TouchableOpacity
        style={appStyles.fab}
        onPress={() => router.push('/search-users')}
      >
        <Text>+</Text>
      </TouchableOpacity>

      <Spacer />

      <Text style={[appStyles.label, { fontSize: 18, fontWeight: 'bold' }]}>Chats</Text>
      <Spacer />

      {chatsLoading && <ActivityIndicator size="small" color="#000" />}

      {!chatsLoading && chats.length === 0 && (
        <Text style={appStyles.fallbackText}>Follow someone to start chatting.</Text>
      )}

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const preview = item.lastMessage
            ? (item.lastMessage.message_type === 'invite' ? '🏋️ Workout invite' : item.lastMessage.content)
            : 'Say hi!'
    
        return (
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
            <Text style={{ color: '#666', marginTop: 2 }} numberOfLines={1}>{preview}</Text>
          </TouchableOpacity>
        )
      }}
      />
    </View>
  )
}