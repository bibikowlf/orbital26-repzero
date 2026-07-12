import { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native'
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

  useFocusEffect(
    useCallback(() => {
      if (userId)
        fetchCounts()
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

      <TouchableOpacity
        style={appStyles.fab}
        onPress={() => router.push('/search-users')}
      >
        <Text>+</Text>
      </TouchableOpacity>

      <Spacer />
      
      <Pressable
        style={appStyles.chatButton}
        onPress={() => router.push('/chat-list')}
      >
        <Text style={appStyles.buttonText}>Chats</Text>
      </Pressable>

      <Spacer />

      <Pressable
        style={[appStyles.invitesButton]}
        onPress={() => router.push('/invite-inbox')}
      >
        <Text style={appStyles.buttonText}>Workout Invites</Text>
      </Pressable>
    </View>
  )
}