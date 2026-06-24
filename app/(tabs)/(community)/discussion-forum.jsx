import { useState, useCallback } from 'react'
import { View, Text, TextInput, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { appStyles } from '../../../styles/styles'
import { supabase } from '../../../lib/supabase'
import { router, useFocusEffect } from 'expo-router'
import Spacer from '../../../components/spacer'
import Entypo from '@expo/vector-icons/Entypo'

export default function DiscussionForum() {
  const [posts, setPosts] = useState([])
  const [filteredPosts, setFilteredPosts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
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
      setSearchQuery('')

      const { data, error } = await supabase
        .from('posts_with_votes')
        .select('*')
      if (error) throw error
      if (data) {
        const sortedData = data.sort((a, b) => b.score - a.score)
        setPosts(sortedData)
        setFilteredPosts(sortedData)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const cleanString = (s) => {
    return s.toLowerCase().replace(/[^a-z]/g, '')
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query.trim() === '') {
      setFilteredPosts(posts)
    } else {
      const filtered = posts.filter((post) =>
        cleanString(post.title).includes(cleanString(query))
      )
      setFilteredPosts(filtered)
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
      <TextInput
        style={[styles.input, { alignSelf: 'stretch' }]}
        placeholder='Search posts'
        value={searchQuery}
        onChangeText={handleSearch}
      />

      <TouchableOpacity
        style={[styles.actionButton, 
          { backgroundColor: '#007AFF', flex: 0, marginTop: 10 }, 
          loading && styles.buttonDisabled]}
        onPress={() => router.navigate('/add-post')}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Add post</Text>
      </TouchableOpacity>

      <Spacer height={10} />

      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id.toString()}
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