import { useState, useCallback } from 'react'
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { appStyles } from '../../../styles/styles'
import { supabase } from '../../../lib/supabase'
import { Stack, router, useFocusEffect } from 'expo-router'
import { useAuthContext } from '../../../hooks/auth-context'
import Entypo from '@expo/vector-icons/Entypo'

export default function DiscussionForum() {
  const { claims } = useAuthContext()
  const userId = claims?.sub
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const styles = appStyles

  useFocusEffect(
    useCallback(() => {
      fetchData()
    }, [])
  )

  const fetchData = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('posts_with_votes')
        .select('*')
        .eq('user_id', userId)
      if (error) throw error
      if (data) {
        const sortedData = data.sort((a, b) => b.score - a.score)
        setPosts(sortedData)
      }
    } catch (error) {
      if (error instanceof Error) Alert.alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }

  return (
    <View style={[styles.container, { alignItems: 'stretch', width: '100%', marginTop: 10, flex: 1 }]}>
      <Stack.Screen options={{ title: 'My Posts', headerBackVisible: false, headerTitleAlign: 'center' }}/>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.actionButton, 
              loading && styles.buttonDisabled,
              { backgroundColor: '#fff', 
                flex: 0, 
                alignSelf: 'stretch', 
                alignItems: 'baseline',
                borderWidth: 1, 
                borderColor: '#ced4da', 
                marginBottom: 8,
                height: 100,
                padding: 12 }]}
            onPress={() => router.navigate({ pathname: '/post', params: {postId: item.id} })}
            disabled={loading}
          >
            <Text style={styles.title}>{item.title}</Text>
            <View style={[styles.row, { marginTop: 0, marginBottom: 0 }]}>
              <Entypo name='arrow-bold-up' size={16} color='black' />
              <Text style={{ marginLeft: 4, color: 'black' }}>{item.score}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}