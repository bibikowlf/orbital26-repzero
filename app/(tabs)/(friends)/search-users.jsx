import { useState, useEffect } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
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
  const [followingIds, setFollowingIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const [myUsername, setMyUsername] = useState('')

  useEffect(() => {
    if (userId) fetchFollowingIds()
    if (userId) fetchMyUsername()
  }, [userId])

  useEffect(() => {
    if (userId)
      fetchFollowingIds()
  }, [userId])

  async function fetchFollowingIds() {
    try {
      let { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)

      if (error)
        throw error

      setFollowingIds((data || []).map((row) => row.following_id))
    } catch (error) {
      console.error('Error fetching following ids:', error)
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
        .insert({ follower_id: userId, following_id: targetId })

      if (error)
        throw error

      setFollowingIds((prev) => [...prev, targetId])

      createNotification({
        userId: targetId,
        actorId: userId,
        type: 'new_follower',
        message: `@${myUsername} started following you`,
      })

    } catch (error) {
      console.error('Error following user:', error)
    }
  }

  async function handleUnfollow(targetId) {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', targetId)

      if (error)
        throw error

      setFollowingIds((prev) => prev.filter((id) => id !== targetId))
    } catch (error) {
      console.error('Error unfollowing user:', error)
    }
  }

  async function fetchMyUsername() {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single()

    if (!error && data) 
      setMyUsername(data.username)
  }

  return (
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
        renderItem={({ item }) => {
          const isFollowing = followingIds.includes(item.id)
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
                    backgroundColor: isFollowing ? '#8E8E93' : '#007AFF',
                    width: 90,
                    alignItems: 'center'
                }]}
                onPress={() => isFollowing ? handleUnfollow(item.id) : handleFollow(item.id)}
                >
                <Text style={appStyles.buttonText}>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
                </TouchableOpacity>
            </View>
          )
        }}
      />
    </View>
  )
}