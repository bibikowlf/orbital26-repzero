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
  const [votes, setVotes] = useState([])
  const [newTutorial, setNewTutorial] = useState('')
  const [loading, setLoading] = useState(false)
  const [voted, setVoted] = useState(new Set())

  useEffect(() => {
    fetchTutorials()
    fetchVotes()
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

  const fetchVotes = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('workout_tutorial_votes')
        .select('*')
        .eq('user_id', userId)
      if (error) throw error
      if (data) {
        setVotes(data)
        setVoted(new Set(votes.map(item => item.comment_id)))
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
      if (error) throw error
      if (data) {
        const updated = [...tutorials, {...data[0], score: 0}]
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

  const handleVote = async ({ commentId }) => { // handle already voted comments too (delete vote)
    try {
      setLoading(true)
      
      if (voted.has(commentId)) {
        const prevVote = votes.find(item => item.comment_id === commentId)
        const { error } = await supabase
          .from('workout_tutorial_votes')
          .delete()
          .eq('id', prevVote.id)
        if (error) throw error
        setVotes(prevItems => prevItems.filter(item => item.id === prevVote.id))
        setTutorials(prevItems => prevItems.map(
          item => item.id === commentId ? { ...item, score: item.score-1} : item))
        setVoted(prevItem => {
          prevItem.delete(commentId)
          return prevItem
        })
      } else {
        const { data, error } = await supabase
          .from('workout_tutorial_votes')
          .insert({
            comment_id: commentId,
            user_id: userId,
            vote: 1
          })
          .select()
        if (error) throw error
        if (data) {
          setVotes([...votes, data])
          setTutorials(prevItems => prevItems.map(
            item => item.id === commentId ? { ...item, score: item.score+1} : item))
          setVoted(prevItem => {
            prevItem.add(commentId)
            return prevItem
          })
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
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
              marginBottom: 8}}
          >
            <Text>{item.content}</Text>
            <Text>{item.score}</Text>
            <TouchableOpacity
              style={[styles.actionButton, 
                loading && styles.buttonDisabled,
                voted.has(item.id) && styles.buttonDisabled,
                { backgroundColor: '#f89292',
                  alignSelf: 'stretch'}]}
              onPress={() => handleVote({ commentId: item.id })}
              disabled={loading}>
              <Text>Upvote</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text>No tutorials found</Text>}
      />
    </View>
  )
}