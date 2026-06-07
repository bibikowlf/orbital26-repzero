import { useState, useEffect } from 'react'
import { View, Text, TextInput, FlatList, ActivityIndicator, Button, 
  TouchableOpacity } from 'react-native'
import { appStyles } from '../../styles/styles'
import { supabase } from '../../lib/supabase'

export default function WorkoutTutorial() {
  const [workouts, setWorkouts] = useState([])
  const [filteredWorkouts, setFilteredWorkouts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [newWorkout, setNewWorkout] = useState('')
  const styles = appStyles

  useEffect(() => {
    fetchWorkouts()
  }, [])

  const fetchWorkouts = async () => {
    try {
      setLoading(true)

      let { data, error } = await supabase
        .from('workouts')
        .select('*')
      if (error) {
        throw error
      }

      if (data) {
        setWorkouts(data)
        setFilteredWorkouts(data)
      }
    } catch (error) {
      if (error instanceof Error) {
        Alertalert(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query.trim() === '') {
      setFilteredWorkouts(workouts)
    } else {
      const filtered = workouts.filter((workout) =>
        workout.name.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredWorkouts(filtered)
    }
  }

  const handleAdd = async () => {
    if (!newWorkout.trim()) return

    try {
      setLoading(true)

      let { data, error } = await supabase
        .from('workouts')
        .insert({ name: newWorkout })
        .select()
      const updated = [...workouts, data[0]]
      setWorkouts(updated)
      setFilteredWorkouts(updated)
      console.log(updated)
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setNewWorkout('')
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
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder='Search workouts'
        value={searchQuery}
        onChangeText={handleSearch}
      />

      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder='Enter new workout'
          value={newWorkout}
          onChangeText={setNewWorkout}
        />
        <Button
          title='Add'
          onPress={handleAdd}
        />
      </View>

      <FlatList
        data={filteredWorkouts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text style={styles.title}>{item.name}</Text>
        )}
        ListEmptyComponent={<Text>No workouts found</Text>}
      />
    </View>
  )
}