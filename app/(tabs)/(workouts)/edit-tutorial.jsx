import { useState } from 'react'
import { View, Text, TextInput, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { appStyles } from '../../../styles/styles'
import { supabase } from '../../../lib/supabase'
import { useLocalSearchParams, Stack, router } from 'expo-router'
import { useAuthContext } from '../../../hooks/auth-context'

export default function EditTutorial() {
  const { claims } = useAuthContext()
  const userId = claims?.sub
  const { id, content, workoutId, workoutName } = useLocalSearchParams()
  const styles = appStyles
  const [tutorial, setTutorial] = useState(content)
  const [loading, setLoading] = useState(false)

  const handleEdit = async () => {
    if (!tutorial.trim()) return

    try {
      setLoading(true)

      const { error } = await supabase
        .from('workout_tutorials')
        .upsert({
          id: id,
          content: tutorial,
          user_id: userId,
          workout_id: workoutId
        })
      if (error) throw error
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
      router.navigate({ pathname: `/${workoutId}`, params: {name: workoutName} })
    }
  }

  const handleDelete = async () => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from('workout_tutorials')
        .delete()
        .eq('id', id)
      if (error) throw error
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
      router.navigate({ pathname: `/${workoutId}`, params: {name: workoutName} })
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
      <Stack.Screen options={{ title: 'Edit Tutorial', headerBackVisible: false, headerTitleAlign: 'center' }}/>
      <Text style={styles.label}>Edit comment for {workoutName}</Text>
      <TextInput
        value={tutorial}
        onChangeText={(text) => setTutorial(text)}
        autoCapitalize='none'
        multiline={true}
        textAlignVertical='top'
        numberOfLines={10}
        style={styles.input}
      />
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#007AFF', flex: 0, marginTop: 10 }, loading && styles.buttonDisabled]}
        onPress={() => handleEdit()}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#007AFF', flex: 0, marginTop: 10 }, loading && styles.buttonDisabled]}
        onPress={() => handleDelete()}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Delete</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#007AFF', flex: 0, marginTop: 10 }, loading && styles.buttonDisabled]}
        onPress={() => router.navigate({ pathname: `/${workoutId}`, params: {name: workoutName}})}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  )
}