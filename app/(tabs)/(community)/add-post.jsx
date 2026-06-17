import { useState } from 'react'
import { View, Text, TextInput, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { appStyles } from '../../../styles/styles'
import { supabase } from '../../../lib/supabase'
import { Stack, router } from 'expo-router'
import { useAuthContext } from '../../../hooks/auth-context'

export default function AddPost() {
  const { claims } = useAuthContext()
  const userId = claims?.sub
  const styles = appStyles
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    if (!title.trim()) {
        Alert.alert('Title cannot be empty')
        return
    } else if (title.length > 50) {
        Alert.alert('Title must be under 50 characters')
        return
    } else if (!content.trim()) {
        Alert.alert('Content cannot be empty')
        return
    }
    try {
      setLoading(true)

      const { error } = await supabase
        .from('posts')
        .insert({
          title: title,
          content: content,
          user_id: userId
        })
      if (error) throw error
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
      setTitle('')
      setContent('')
      router.navigate('/discussion-forum')
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
    <View style={[styles.container, { alignItems: 'stretch', width: '100%', marginTop: 10 }]}>
      <Stack.Screen options={{ title: 'Add Post', headerBackVisible: false, headerTitleAlign: 'center' }}/>
      <Text style={styles.label}>Title</Text>
      <TextInput
        value={title}
        onChangeText={(text) => setTitle(text)}
        autoCapitalize='none'
        textAlignVertical='top'
        numberOfLines={1}
        style={styles.input}
      />
      <Text style={styles.label}>Content</Text>
      <TextInput
        value={content}
        onChangeText={(text) => setContent(text)}
        autoCapitalize='none'
        multiline={true}
        textAlignVertical='top'
        numberOfLines={10}
        style={styles.input}
      />
      <TouchableOpacity
        style={[styles.actionButton, 
          { backgroundColor: '#007AFF', flex: 0, marginTop: 10 }, 
          loading && styles.buttonDisabled]}
        onPress={() => handleAdd()}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Add</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton,
          { backgroundColor: '#007AFF', flex: 0, marginTop: 10 }, 
          loading && styles.buttonDisabled]}
        onPress={() => {
          setTitle('')
          setContent('')
          router.navigate('/discussion-forum')
        }}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  )
}