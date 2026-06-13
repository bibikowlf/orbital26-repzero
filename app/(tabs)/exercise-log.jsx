import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet, Modal} from 'react-native'
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
  const fullDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  
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
      label: dayLabels[i],
      fullName: fullDayNames[i]
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

  const [workoutPlan, setWorkoutPlan] = useState([])
  const [showImport, setshowImport] = useState(false)

  const weekDays = getCurrentWeekDays()

  const selectedDay = weekDays.find(d => d.dateString === selectedDate)?.fullName

  const matchingPlanDay = workoutPlan.find(
    (planDay) => planDay.day?.toLowerCase().includes(selectedDay?.toLowerCase())
  )

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

  async function fetchWorkoutPlan() {
    const { data, error } = await supabase
      .from('profiles')
      .select('workout_plan')
      .eq('id', userId)
      .single()

    if (data?.workout_plan) 
      setWorkoutPlan(data.workout_plan)
  }

  function handleImportPress() {
    if (!workoutPlan.length) {
      Alert.alert('No Workout Plan', 'You have not generated a workout plan yet.')
      return
    }
    setshowImport(true)
  }

  function importDay(dayItem) {
    const imported = dayItem.exercises.map((ex) => ({
      name: ex.name,
      sets: String(ex.sets),
      reps: ex.reps,
      weight_kg: ''
    }))

    Alert.alert(
      'Import Exercises',
      `Import ${dayItem.exercises.length} exercises from "${dayItem.day}"? This will replace your current entries.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: () => {
            setExercises(imported)
            setshowImport(false)
          }
        }
      ]
    )
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

      <TouchableOpacity
        style={appStyles.importButton}
        onPress={handleImportPress}
      >
        <Text style={appStyles.importButtonText}>↓ Import from Workout Plan</Text>
      </TouchableOpacity>

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

      <Modal
        visible={showImport}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setshowImport(false)}
      >
        <View style={appStyles.modalOverlay}>
          <View style={appStyles.modalContainer}>
            <Text style={appStyles.modalTitle}>Import from Workout Plan</Text>
            <Text style={appStyles.modalSubtitle}>
              Showing plan for {selectedDay}
            </Text>

            {matchingPlanDay ? (
              // found a matching plan day — show its exercises
              <View style={appStyles.planDayCard}>
                <Text style={appStyles.planDayTitle}>{matchingPlanDay.day}</Text>
                <Text style={appStyles.planDayMeta}>
                  {matchingPlanDay.exercises?.length} exercises
                </Text>
                {matchingPlanDay.exercises?.map((ex, exIdx) => (
                  <Text key={exIdx} style={appStyles.planExerciseItem}>
                    • {ex.name} — {ex.sets} sets x {ex.reps} reps
                  </Text>
                ))}
                <TouchableOpacity
                  style={appStyles.importConfirmButton}
                  onPress={() => importDay(matchingPlanDay)}
                >
                  <Text style={appStyles.importConfirmText}>Import These Exercises</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // no plan exists for this day
              <View style={appStyles.emptyState}>
                <Text style={appStyles.emptyStateText}>
                  No workout plan exists for {selectedDay}.
                </Text>
                <Text style={appStyles.emptyStateSubtext}>
                  This is a rest day or your plan does not include {selectedDay}.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={appStyles.cancelButton}
              onPress={() => setshowImport(false)}
            >
              <Text style={appStyles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}
