import { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../../lib/supabase'
import { useAuthContext } from '../../../hooks/auth-context'
import { appStyles } from '../../../styles/styles'
import Spacer from '../../../components/spacer'
import { createNotification } from '../../../lib/notifications'

export function filterOutSelf(results, userId) {
  return results.filter((r) => r.id !== userId)
}

export default function SearchUsers() {
  const { claims } = useAuthContext()
  const userId = claims?.sub

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [followStatuses, setFollowStatuses] = useState({})
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [myUsername, setMyUsername] = useState('')

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchFollowStatuses()
        fetchMyUsername()
      }
    }, [userId])
  )

  async function fetchMyUsername() {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single()

    if (!error && data) 
      setMyUsername(data.username)
  }

  async function fetchFollowStatuses() {
    try {
      let { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)

      if (error)
        throw error

      const statusMap = {};
      for (const row of (data || [])) {
        const otherId = row.follower_id === userId ? row.following_id : row.follower_id
        statusMap[row.following_id] = row.status
      }
      setFollowStatuses(statusMap)
    } catch (error) {
      console.error('Error fetching follow statuses:', error)
    }
  }

  async function handleSearch(text) {
    setQuery(text)

    if (!text.trim()) {
      setResults([])
      setSearched(false)
      return
    }

    try {
      setLoading(true)
      let { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${text.trim()}%`)
        .limit(20)

      if (error)
        throw error

      setResults(filterOutSelf(data || [], userId))
      setSearched(true)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleFollow(targetId) {
    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: userId, following_id: targetId, status: 'pending' })

      if (error)
        throw error

      setFollowStatuses((prev) => ({ ...prev, [targetId]: 'pending' }))
      createNotification({
        userId: targetId,
        actorId: userId,
        type: 'friend_request',
        message: `@${myUsername} has requested to follow you`,
      })
    } catch (error) {
      if (error.code === '23505') {
        fetchFollowStatuses()
        return
      }
      console.error('Error sending friend request', error)
    }
  }

  async function handleUnfollow(targetId) {
    const previousStatus = followStatuses[targetId]
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .or(`and(follower_id.eq.${userId},following_id.eq.${targetId}),and(follower_id.eq.${targetId},following_id.eq.${userId})`)

      if (error)
        throw error

      if (previousStatus === 'pending') {
        await supabase
          .from('notifications')
          .delete()
          .eq('user_id', targetId)
          .eq('actor_id', userId)
          .eq('type', 'friend_request')
      }
      
      setFollowStatuses((prev) => {
        const next = { ...prev }
        delete next[targetId]
        return next
      })

      if (previousStatus === 'accepted') {
        createNotification({
          userId: targetId,
          actorId: userId,
          type: 'unfriended',
          message: `@${myUsername} unfriended you`,
        })
      }
    } catch (error) {
      console.error('Error unfollowing user:', error)
    }
  }

  return (
    <KeyboardAvoidingView
      style={appStyles.flexOne}
      behavior={'padding'}
    >
    <View style={{ flex: 1, paddingHorizontal: 15, paddingTop: 12 }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 46
      }}>
        <Ionicons name="search" size={20} color="#8E8E93" />
        <TextInput
          style={{ flex: 1, marginLeft: 8, fontSize: 16 }}
          placeholder="Search by username"
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
      </View>
      <Spacer />

      {loading && <ActivityIndicator size="small" color="#000" />}

      {!loading && searched && results.length === 0 && (
        <Text style={appStyles.fallbackText}>No users found.</Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 300 }}
        renderItem={({ item }) => {
          const status = followStatuses[item.id]
          const label = status === 'accepted' ? 'Friends' : status === 'pending' ? 'Requested' : 'Add Friend'
          const bgColor = status === 'accepted' ? '#8E8E93' : status === 'pending' ? '#C7C7CC' : '#007AFF'
          return (
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              paddingVertical: 14,
              paddingHorizontal: 4,
              borderBottomWidth: 1,
              borderBottomColor: '#E5E5E5'
            }}>
              <Text style={appStyles.exerciseName}>{item.username}</Text>
              <TouchableOpacity
                style={[appStyles.actionButton, {
                    flex: undefined,
                    backgroundColor: bgColor,
                    width: 150,
                    alignItems: 'center'
                }]}
                onPress={() => status ? handleUnfollow(item.id) : handleFollow(item.id)}
                >
                <Text style={appStyles.buttonText}>{label}</Text>
                </TouchableOpacity>
            </View>
          )
        }}
      />
    </View>
    </KeyboardAvoidingView>
  )
}