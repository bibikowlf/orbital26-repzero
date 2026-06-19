import { useState } from 'react'
import { View, Text, TextInput, Image, ActivityIndicator, TouchableOpacity, Alert, 
  KeyboardAvoidingView, ScrollView } from 'react-native'
import { appStyles } from '../../../styles/styles'
import { supabase } from '../../../lib/supabase'
import { Stack, router } from 'expo-router'
import { useAuthContext } from '../../../hooks/auth-context'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import Entypo from '@expo/vector-icons/Entypo'

export default function AddPost() {
  const { claims } = useAuthContext()
  const userId = claims?.sub
  const styles = appStyles
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)

  const addImages = async () => {
    if (images.length >= 10) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 10 images per post.')
      return
    }
    const permissionResponse = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissionResponse.granted) {
      Alert.alert('Permission Denied', 'Permission to access the camera roll is required.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 10 - images.length,
      quality: 0.8,
      base64: true
    })

    if (!result.canceled) {
      const selectedImages = result.assets.map(asset => {
        const size = asset.fileSize ? asset.fileSize / (1024 * 1024) : 0
        const filename = asset.fileName || asset.uri.split('/').pop() || `img_${Date.now()}.jpg`
        const extension = filename.split('.').pop()
        return {
          base64: asset.base64,
          size: size,
          type: asset.mimeType || `image/${extension}`,
          extension: extension,
          uri: asset.uri
        }
      })
      const oversized = selectedImages.filter(img => img.size > 6)
      if (oversized.length > 0) {
        Alert.alert('Invalid Files', 'All images must be under 6MB.')
        return
      }

      setImages(prev => [...prev, ...selectedImages].slice(0, 10))
    }
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, idx) => idx !== index))
  }

  const uploadImages = async (postId) => {
    const uploadPromises = images.map(async (image) => {
      try {
        const arrayBuffer = decode(image.base64)
        const fileExtension = image.type || 'jpg'
        const filePath = `${userId}_${postId}_${Date.now()}_${Math.random().toString(36).substring(8)}.${fileExtension}`

        const { error } = await supabase.storage
          .from('image')
          .upload(filePath, arrayBuffer, {
            upsert: false
          })
        if (error) throw error

        const { data } = supabase.storage
          .from('image')
          .getPublicUrl(filePath)
        return data.publicUrl
      } catch (error) {
        if (error instanceof Error) Alert.alert(error.message)
      }
    })

    const urls = await Promise.all(uploadPromises)
    return urls.filter(item => item !== null)
  }

  const handleAdd = async () => {
    if (!title.trim()) {
        Alert.alert('Invalid Title', 'Title cannot be empty.')
        return
    } else if (title.length > 50) {
        Alert.alert('Invalid Title', 'Title must be under 50 characters.')
        return
    } else if (!content.trim()) {
        Alert.alert('Invalid Content', 'Content cannot be empty')
        return
    }
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('posts')
        .insert({
          title: title,
          content: content,
          user_id: userId
        })
        .select()
      if (error) throw error

      if (images.length > 0 && data && data[0]) {
        const imageUrls = await uploadImages(data[0].id)
        const { updateError } = await supabase
          .from('posts')
          .update({ image_urls: imageUrls })
          .eq('id', data[0].id)
        if (updateError) throw updateError
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
      setTitle('')
      setContent('')
      setImages([])
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
    <KeyboardAvoidingView behavior='padding' style={{ flex: 1 }}>
      <ScrollView style={{ width: '100%', padding: 12, paddingTop: 20 }}
        contentContainerStyle={{ alignItems: 'stretch' }}
      >
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
        <Text style={[styles.label, { marginTop: 6 }]}>Content</Text>
        <TextInput
          value={content}
          onChangeText={(text) => setContent(text)}
          autoCapitalize='none'
          multiline={true}
          textAlignVertical='top'
          numberOfLines={10}
          style={styles.input}
        />
        <View style={[styles.row, { marginVertical: 6, justifyContent: 'space-between' }]}>
          <Text style={styles.label}>Images ({images.length}/10)</Text>
          <TouchableOpacity 
            style={[styles.actionButton, 
             { backgroundColor: '#E2E8F0', flex: 0, width: 120, marginVertical: 6 }]}
            onPress={addImages}
          >
            <Entypo name='image' size={16} color="#007AFF" style={{ marginRight: 4 }} />
            <Text style={{ color: '#007AFF' }}>Select Images</Text>
          </TouchableOpacity>
        </View>
        {images.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} 
            style={{ marginBottom: 15, flexDirection: 'row' }}
          >
            {images.map((img, index) => (
              <View key={index} style={{ marginRight: 12, position: 'relative', marginTop: 8 }}>
                <Image source={{ uri: img.uri }} 
                  style={{ width: 80, height: 80, borderRadius: 8 }} 
                />
                <TouchableOpacity 
                  style={{ 
                    position: 'absolute', 
                    top: -4, 
                    right: -4, 
                    borderRadius: 10, 
                    width: 20, 
                    height: 20, 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    backgroundColor: 'red' }}
                  onPress={() => removeImage(index)}
                >
                  <Entypo name="cross" size={14} color='white' />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
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
            setImages([])
            router.navigate('/discussion-forum')
          }}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}