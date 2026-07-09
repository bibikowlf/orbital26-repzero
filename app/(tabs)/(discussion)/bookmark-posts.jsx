import { useState, useCallback, useEffect } from 'react'
import { View, Text, TextInput, FlatList, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native'
import { appStyles } from '../../../styles/styles'
import { supabase } from '../../../lib/supabase'
import { router, useFocusEffect } from 'expo-router'
import Spacer from '../../../components/spacer'
import Entypo from '@expo/vector-icons/Entypo'
import { useAuthContext } from '../../../hooks/auth-context'
import { cleanString } from '../../../functions/clean-string'

const CATEGORY_COLORS = {
  All: '#0048ff',
  Progress: '#FF9500',
  Discussion: '#56b2d6',
  Help: '#d4219b',
  Motivation: '#34C759',
  Equipment: '#9900ff', 
  Other: '#f5120e'
}
const CATEGORIES = ['All', 'Progress', 'Discussion', 'Help', 'Motivation', 'Equipment', 'Other']

export default function BookmarkPosts() {
  const { claims } = useAuthContext()
  const userId = claims?.sub
  const [posts, setPosts] = useState([])
  const [filteredPosts, setFilteredPosts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const styles = appStyles

  useFocusEffect(
    useCallback(() => {
      fetchData()
    }, [])
  )

  useEffect(() => {
    handleFilter()
  }, [category, searchQuery])

  const fetchData = async () => {
    try {
      setLoading(true)
      setSearchQuery('')
      setCategory('All')

      const [postsResponse, bookmarkResponse] = await Promise.all([
        supabase
          .from('posts_with_votes')
          .select('*'), 
        supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', userId)])
      if (postsResponse.error) throw postsResponse.error
      if (bookmarkResponse.error) throw bookmarkResponse.error
      if (postsResponse.data && bookmarkResponse.data) {
        const bookmarks = new Set(bookmarkResponse.data.map(item => item.post_id))
        const sortedData = postsResponse.data
          .sort((a, b) => b.score - a.score)
          .filter(post => bookmarks.has(post.id))
        setPosts(sortedData)
        setFilteredPosts(sortedData)
      }
    } catch (error) {
      if (error instanceof Error) Alert.alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = () => {
    if (searchQuery.trim() === '') {
      setFilteredPosts(posts.filter((post) => category === 'All' || post.category === category))
    } else {
      const cleanQuery = cleanString(searchQuery)
      setFilteredPosts(posts.filter((post) => {
        return cleanString(post.title).includes(cleanQuery) && (category === 'All' || post.category === category)
      }))
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
        value={searchQuery}
        placeholder='Search posts'
        onChangeText={setSearchQuery}
      />
      <Spacer height={10} />
      <ScrollView
        style={{height: 35, flexGrow: 0, flexShrink: 0}}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 6, gap: 8 }}
      >
        {CATEGORIES.map(item => (
          <TouchableOpacity
            key={item}
            onPress={() => setCategory(item)}
            style={{ paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: category === item
                ? (CATEGORY_COLORS[item])
                : '#f2f2f2' }}
          >
            <Text style={{ fontSize: 13, 
              fontWeight: '600', 
              color: category === item ? '#fff' : '#444' }}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
                height: 140,
                padding: 12 }]}
            onPress={() => router.navigate({ pathname: '/post', params: {postId: item.id} })}
            disabled={loading}
          >
            <View
              style={{ paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: CATEGORY_COLORS[item.category]}}
            >
              <Text style={{ fontSize: 11, 
                fontWeight: '600', 
                color: '#fff'}}
              >
                {item.category}
              </Text>
            </View>
            <Spacer height={10} />
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