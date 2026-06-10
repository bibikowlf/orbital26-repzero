import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/auth-context'

export default function ExerciseLog() {
  const { claims } = useAuthContext()
  const userId = claims?.sub

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]  // defaults to today (YYYY-MM-DD)
  )
  const [exercises, setExercises] = useState([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (userId) fetchLog(selectedDate)
  }, [userId, selectedDate])

  async function fetchLog(date) {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', date)
      .single()

    if (data) {
      setExercises(data.exercises || [])
      setNotes(data.notes || '')
    } else {
      setExercises([])
      setNotes('')
    }
  }

  function addExercise() {
    setExercises([...exercises, { name: '', sets: '', reps: '', weight_kg: '' }])
  }

  function updateExercise(index, field, value) {
    const updated = [...exercises]
    updated[index][field] = value
    setExercises(updated)
  }

  function removeExercise(index) {
    const updated = exercises.filter((_, i) => i !== index)
    setExercises(updated)
  }

  async function saveLog() {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('workout_logs')
        .upsert({
          user_id: userId,
          log_date: selectedDate,
          exercises,
          notes
        }, { onConflict: 'user_id,log_date' })

      if (error) throw error
      Alert.alert('Saved', 'Workout log saved!')
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Exercise Log</Text>
      <Text style={styles.date}>{selectedDate}</Text>

      {exercises.map((ex, idx) => (
        <View key={idx} style={styles.exerciseCard}>
          <TextInput
            style={styles.input}
            placeholder="Exercise name"
            value={ex.name}
            onChangeText={(val) => updateExercise(idx, 'name', val)}
          />
          
          <View style={styles.row}>

            <TextInput style={[styles.input, styles.small]} placeholder="Sets"
              value={ex.sets} keyboardType="numeric"
              onChangeText={(val) => updateExercise(idx, 'sets', val)} />

            <TextInput style={[styles.input, styles.small]} placeholder="Reps"
              value={ex.reps}
              onChangeText={(val) => updateExercise(idx, 'reps', val)} />

            <TextInput style={[styles.input, styles.small]} placeholder="kg"
              value={ex.weight_kg} keyboardType="numeric"
              onChangeText={(val) => updateExercise(idx, 'weight_kg', val)} />
          </View>
          <TouchableOpacity onPress={() => removeExercise(idx)}>
            <Text style={styles.remove}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addExercise}>
        <Text style={styles.addButtonText}>+ Add Exercise</Text>
      </TouchableOpacity>

      <TextInput
        style={[styles.input, { marginTop: 12 }]}
        placeholder="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <TouchableOpacity style={styles.saveButton} onPress={saveLog} disabled={saving}>
        <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Log'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  date: { fontSize: 14, color: '#666', marginBottom: 16 },
  exerciseCard: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ced4da', borderRadius: 6, padding: 8, marginBottom: 6, fontSize: 14 },
  small: { flex: 1, marginHorizontal: 3 },
  row: { flexDirection: 'row' },
  remove: { color: 'red', fontSize: 13, marginTop: 4 },
  addButton: { borderWidth: 1, borderColor: '#007AFF', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 12 },
  addButtonText: { color: '#007AFF', fontWeight: '600' },
  saveButton: { backgroundColor: '#007AFF', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 32 },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
})