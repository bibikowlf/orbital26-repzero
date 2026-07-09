import { useState, useEffect } from 'react'
import { View, Text, FlatList, ActivityIndicator } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { useAuthContext } from '../../../hooks/auth-context'
import { appStyles } from '../../../styles/styles'

export default function FollowList() {
  const { mode } = useLocalSearchParams()
  const { claims } = useAuthContext()
  const userId = claims?.sub

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (userId)
      fetchList()
  }, [userId, mode])

  async function fetchList() {
    try {
      setLoading(true)

      const column = mode === 'followers' ? 'following_id' : 'follower_id'
      const targetColumn = mode === 'followers' ? 'follower_id' : 'following_id'

      const { data: followRows, error: followError } = await supabase
        .from('follows')
        .select(targetColumn)
        .eq(column, userId)

      if (followError)
        throw followError

      const ids = (followRows || []).map((row) => row[targetColumn])

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
      console.error('Error fetching follow list:', error)
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
        <Text style={appStyles.fallbackText}>
          {mode === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
        </Text>
      )}

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{
            paddingVertical: 14,
            paddingHorizontal: 4,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E5E5'
          }}>
            <Text style={appStyles.exerciseName}>{item.username}</Text>
          </View>
        )}
      />
    </View>
  )
}