import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/auth-context'
import { appStyles } from '../../styles/styles'

// helper function to get all days for the current week, week starts on monday
function getCurrentWeekDays() {
  const current = new Date()
  const dayOfWeek = current.getDay() 
  
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  
  const monday = new Date(current)
  monday.setDate(current.getDate() + distanceToMonday)

  const days = []
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday)
    nextDay.setDate(monday.getDate() + i)
    
    const yyyy = nextDay.getFullYear()
    const mm = String(nextDay.getMonth() + 1).padStart(2, '0')
    const dd = String(nextDay.getDate()).padStart(2, '0')
    const dateString = `${yyyy}-${mm}-${dd}`

    days.push({
      dateString,
      dayNum: nextDay.getDate(),
      label: dayLabels[i]
    })
  }
  return days
}

export default function ExerciseLog() {
  const { claims } = useAuthContext()
  const userId = claims?.sub
  const styles = appStyles

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]  // defaults to today (YYYY-MM-DD)
  )
  const [exercises, setExercises] = useState([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const weekDays = getCurrentWeekDays()

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
    <ScrollView
        style={{ flex: 1, backgroundColor: '#fff' }}
        contentContainerStyle={{ padding: 16 }}
    >   
      <Text style={styles.logTitle}>Exercise Log</Text>
      {/*<Text style={styles.logDate}>{selectedDate}</Text>*/}

      <View style={styles.calendarStrip}>
        {weekDays.map((day) => {
          const isSelected = day.dateString === selectedDate
          return (
            <TouchableOpacity
              key={day.dateString}
              style={[styles.calendarCard, isSelected && styles.selectedCard]}
              onPress={() => setSelectedDate(day.dateString)}
            >
              <Text style={[styles.calendarLabel, isSelected && styles.selectedText]}>
                {day.label}
              </Text>
              <Text style={[styles.calendarDayNum, isSelected && styles.selectedText]}>
                {day.dayNum}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <Text style={styles.date}>Active Date: {selectedDate}</Text>

      {exercises.map((ex, idx) => (
        <View key={idx} style={styles.exerciseCard}>
          <TextInput
            style={styles.logInput}
            placeholder="Exercise name"
            placeholderTextColor="#888"
            value={ex.name}
            onChangeText={(val) => updateExercise(idx, 'name', val)}
          />
          
          <View style={styles.inputRow}>

            <TextInput style={[styles.logInput, styles.smallInput]} placeholder="Sets"
              value={ex.sets} keyboardType="numeric"
              placeholderTextColor="#888"
              onChangeText={(val) => updateExercise(idx, 'sets', val)} />

            <TextInput style={[styles.logInput, styles.smallInput]} placeholder="Reps"
              value={ex.reps}
              placeholderTextColor="#888"
              onChangeText={(val) => updateExercise(idx, 'reps', val)} />

            <TextInput style={[styles.logInput, styles.smallInput]} placeholder="kg"
              value={ex.weight_kg} keyboardType="numeric"
              placeholderTextColor="#888"
              onChangeText={(val) => updateExercise(idx, 'weight_kg', val)} />
          </View>
          <TouchableOpacity onPress={() => removeExercise(idx)}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addExerciseButton} onPress={addExercise}>
        <Text style={styles.addExerciseText}>+ Add Exercise</Text>
      </TouchableOpacity>

      <TextInput
        style={[styles.logInput, { marginTop: 12 }]}
        placeholder="Notes (optional)"
        placeholderTextColor="#888"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <TouchableOpacity style={styles.saveLogButton} onPress={saveLog} disabled={saving}>
        <Text style={styles.saveLogText}>{saving ? 'Saving...' : 'Save Log'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
