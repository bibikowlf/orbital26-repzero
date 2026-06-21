import { useState, useEffect } from 'react'
import { View, Text, TextInput, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { appStyles } from '../../styles/styles'
import { supabase } from '../../lib/supabase'
import { useLocalSearchParams, Stack, router } from 'expo-router'
import { useAuthContext } from '../../hooks/auth-context'
import TextInfo from '../../components/text-info'

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
  const [editing, setEditing] = useState(null)
  const [editTutorial, setEditTutorial] = useState('')

  useEffect(() => {
      fetchData()
  }, [id, userId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setEditing(null)
      setNewTutorial('')

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

  const handleEdit = async () => {
    if (!editing || !editTutorial.trim()) {
      Alert.alert('Tutorial cannot be empty')
      return
    } else if (editTutorial === editing.content) {
      setEditing(null)
      return
    }
    try {
      setLoading(true)

      const { error } = await supabase
        .from('workout_tutorials')
        .upsert({
          id: editing.id,
          content: editTutorial,
          user_id: userId,
          workout_id: editing.workout_id
        })
      if (error) throw error
      setTutorials(tutorials.map(item => item.id === editing.id ? { ...item, content: editTutorial } : item))
    } catch (error) {
      if (error instanceof Error) Alert.alert(error.message)
    } finally {
      setLoading(false)
      setEditing(null)
    }
  }

  const handleDelete = async (tutorialId) => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from('workout_tutorials')
        .delete()
        .eq('id', tutorialId)
      if (error) throw error
      setTutorials(tutorials.filter(item => item.id !== tutorialId))
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
      <Stack.Screen options={{ title: name, headerBackVisible: false, headerTitleAlign: 'center' }}/>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 10 }]}
          placeholder='Enter tutorial'
          value={newTutorial}
          onChangeText={setNewTutorial}
          multiline={true}
          textAlignVertical='top'
          numberOfLines={5}
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
            style={[styles.actionButton, 
              loading && styles.buttonDisabled,
              { backgroundColor: '#fff', 
                flex: 0, 
                alignSelf: 'stretch', 
                alignItems: 'baseline',
                borderWidth: 1, 
                borderColor: '#ced4da', 
                marginBottom: 8,
                padding: 12 }]}
          >
            {(editing === null || editing.id !== item.id) ? (
              <Text style={{ fontSize: 16, marginBottom: 6 }}>{item.content}</Text>): (
              <View style={{ marginBottom: 6 }}>
                <TextInput 
                  value={editTutorial}
                  onChangeText={(text) => setEditTutorial(text)}
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
                  onPress={handleEdit}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
            <TextInfo 
              marginBottom={0}
              isAuthor={item.user_id === userId} 
              canReply={false} 
              score={item.score} 
              loading={loading} 
              editing={editing !== null && editing.id === item.id}
              hasVoted={voted.has(item.id)} 
              onVotePress={() => handleVote({ commentId: item.id })} 
              onEditPress={() => {
                setEditTutorial(item.content)
                setEditing(item)
              }}
              onDeletePress={() => handleDelete(item.id)} 
            />
          </View>
        )}
      />
    </View>
  )
}