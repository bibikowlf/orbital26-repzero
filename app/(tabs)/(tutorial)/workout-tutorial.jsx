import { useState, useEffect } from 'react'
import { View, Text, TextInput, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { appStyles } from '../../../styles/styles'
import { supabase } from '../../../lib/supabase'
import { router } from 'expo-router'
import Spacer from '../../../components/spacer'
import { cleanString } from '../../../functions/clean-string'

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
        Alert.alert(error.message)
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
        cleanString(workout.name).includes(cleanString(query))
      )
      setFilteredWorkouts(filtered)
    }
  }

  const handleAdd = async () => {
    if (!newWorkout.trim()) {
      Alert.alert('Cannot add empty workout')
      return
    }
    const cleaned = cleanString(newWorkout)
    if (workouts.some(item => cleanString(item.name) === cleaned)) {
      Alert.alert('Workout already exists')
      return
    }

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('workouts')
        .insert({ name: newWorkout })
        .select()
      if (error) {
        throw error
      }
      if (data) {
        const updated = [...workouts, data[0]]
        setWorkouts(updated)
        setFilteredWorkouts(updated)
      }
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
    <View style={[styles.container, { alignItems: 'stretch', width: '100%', marginTop: 10, flex: 1 }]}>
      <TextInput
        style={[styles.input, { alignSelf: 'stretch' }]}
        value={searchQuery}
        placeholder='Search workouts'
        onChangeText={handleSearch}
      />

      <Spacer height={10} />

      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 10 }]}
          placeholder='Enter new workout'
          value={newWorkout}
          onChangeText={setNewWorkout}
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
        data={filteredWorkouts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.actionButton, 
              loading && styles.buttonDisabled,
              { backgroundColor: '#fff', 
                flex: 0, 
                alignSelf: 'stretch', 
                borderWidth: 1, 
                borderColor: '#ced4da', 
                marginBottom: 8,
                height: 80 }]}
            onPress={() => router.navigate({ pathname: '/tutorial', params: {id: item.id, name: item.name}})}
            disabled={loading}
          >
            <Text style={styles.title}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}