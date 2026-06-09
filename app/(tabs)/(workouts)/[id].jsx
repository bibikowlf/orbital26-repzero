import { useState, useEffect } from 'react'
import { View, Text, TextInput, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { appStyles } from '../../../styles/styles'
import { supabase } from '../../../lib/supabase'
import { useLocalSearchParams, Stack } from 'expo-router'
import { useAuthContext } from '../../../hooks/auth-context'
import Spacer from '../../../components/spacer'

export default function WorkoutTutorials() {
  const { claims } = useAuthContext()
  const userId = claims?.sub
  const { id, name } = useLocalSearchParams()
  const styles = appStyles
  const [tutorials, setTutorials] = useState([])
  const [newTutorial, setNewTutorial] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTutorials()
  }, [id])

  const fetchTutorials = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('workout_tutorials_with_votes')
        .select('*')
        .eq('workout_id', id)
      if (error) {
        throw error
      }
      if (data) {
        setTutorials(data)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newTutorial.trim()) return

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('workout_tutorials')
        .insert({
          content: newTutorial,
          user_id: userId,
          workout_id: id
        })
        .select()
      if (error) {
        throw error
      }
      if (data) {
        const updated = [...tutorials, {...data[0], votes: 0}]
        setTutorials(updated)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setNewTutorial('')
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
    <View style={[styles.container, { alignItems: 'stretch', width: '100%', marginTop: 10 }]}>
      <Stack.Screen options={{ title: name, headerBackVisible: false, headerTitleAlign: 'center' }}/>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 10 }]}
          placeholder='Enter tutorial'
          value={newTutorial}
          onChangeText={setNewTutorial}
        />
        <TouchableOpacity
          style={[styles.button,
            loading && styles.buttonDisabled, 
            { width: 60 }]}
          onPress={handleAdd}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tutorials}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{ backgroundColor: '#fff', 
              flex: 0, 
              alignSelf: 'stretch', 
              borderWidth: 1, 
              borderColor: '#ced4da', 
              marginBottom: 8,
              height: 80 }}
          >
            <Text style={styles.title}>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No tutorials found</Text>}
      />
    </View>
  )
}