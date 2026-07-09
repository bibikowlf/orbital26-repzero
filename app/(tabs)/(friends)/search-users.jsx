import { useState, useEffect } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { supabase } from '../../../lib/supabase'
import { useAuthContext } from '../../../hooks/auth-context'
import { appStyles } from '../../../styles/styles'
import Spacer from '../../../components/spacer'

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

  return (
    <View style={[appStyles.container, { paddingHorizontal: 15, paddingTop: 20, justifyContent: 'flex-start' }]}>
      <TextInput
        style={appStyles.inlineInput}
        placeholder="Search by username"
        value={query}
        onChangeText={handleSearch}
        autoCapitalize="none"
      />
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
            <View style={[appStyles.exerciseRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <Text style={appStyles.exerciseName}>{item.username}</Text>
              <TouchableOpacity
                style={[appStyles.actionButton, { backgroundColor: isFollowing ? '#8E8E93' : '#007AFF' }]}
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