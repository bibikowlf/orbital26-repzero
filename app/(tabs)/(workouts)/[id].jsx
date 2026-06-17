import { useState, useCallback } from 'react'
import { View, Text, TextInput, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { appStyles } from '../../../styles/styles'
import { supabase } from '../../../lib/supabase'
import { useLocalSearchParams, Stack, router, useFocusEffect } from 'expo-router'
import { useAuthContext } from '../../../hooks/auth-context'
import Entypo from '@expo/vector-icons/Entypo'

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

  useFocusEffect(
    useCallback(() => {
      fetchData()
    }, [id, userId])
  )

  const fetchData = async () => {
    try {
      setLoading(true)

      const [tutorialsResponse, votesResponse] = await Promise.all([
        supabase
          .from('workout_tutorials_with_votes')
          .select('*')
          .eq('workout_id', id),
        supabase
          .from('workout_tutorial_votes')
          .select('*')
          .eq('user_id', userId)])
      if (tutorialsResponse.error) throw tutorialsResponse.error
      if (votesResponse.error) throw votesResponse.error
      if (tutorialsResponse.data) {
        const sortedData = [...tutorialsResponse.data].sort((a, b) => b.score - a.score)
        setTutorials(sortedData)
      }
      if (votesResponse.data) {
        setVotes(votesResponse.data)
        setVoted(new Set(votesResponse.data.map(item => item.comment_id)))
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

  const handleVote = async ({ commentId }) => {
    try {
      setLoading(true)
      
      if (voted.has(commentId)) {
        const prevVote = votes.find(item => item.comment_id === commentId)
        const { error } = await supabase
          .from('workout_tutorial_votes')
          .delete()
          .eq('id', prevVote.id)
        if (error) throw error
        setVotes(prevItems => prevItems.filter(item => item.id !== prevVote.id))
        setTutorials(prevItems => {
          const newItems = prevItems.map(item => item.id === commentId ? { ...item, score: item.score-1} : item)
          return newItems.sort((a, b) => b.score - a.score)
        })
        setVoted(prevItem => {
          const newItem = new Set(prevItem)
          newItem.delete(commentId)
          return newItem
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
          setVotes([...votes, data[0]])
          setTutorials(prevItems => {
            const newItems = prevItems.map(item => item.id === commentId ? { ...item, score: item.score+1} : item)
            return newItems.sort((a, b) => b.score - a.score)
          })
          setVoted(prevItem => {
            const newItem = new Set(prevItem)
            newItem.add(commentId)
            return newItem
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
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View
            style={{ backgroundColor: '#fff', 
              flex: 0, 
              alignSelf: 'stretch', 
              borderWidth: 1, 
              borderColor: '#ced4da', 
              marginBottom: 8}}
          >
            <Text style={[{ padding: 12, fontSize: 16 }]}>{item.content}</Text>
            <View style={styles.row}>
              <Text style={{ paddingLeft: 12, paddingRight: 4 }}>{item.score}</Text>
              <TouchableOpacity
                onPress={() => handleVote({ commentId: item.id })}
                disabled={loading}>
                <Entypo name='arrow-bold-up' size={16} color={voted.has(item.id) ? '#2e2c2c48' : '#000000'} />
              </TouchableOpacity>
              {item.user_id === userId && (
                <TouchableOpacity
                  style={{ marginLeft: 'auto', paddingRight: 12 }}
                  onPress={() => router.navigate({
                    pathname: 'edit-tutorial', 
                    params: {
                      id: item.id,
                      content: item.content,
                      workoutId: id,
                      workoutName: name}})}
                  disabled={loading}>
                  <Entypo name='edit' size={16} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
  )
}