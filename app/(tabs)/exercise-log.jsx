import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, 
  KeyboardAvoidingView, FlatList, ActivityIndicator } from 'react-native'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/auth-context'
import { appStyles } from '../../styles/styles'
import { handleNumericInput } from '../../functions/numeric-input'
import { useFocusEffect } from 'expo-router'
import Spacer from '../../components/spacer'

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export function getWeekRangeLabel(weekDays) {
  if (!weekDays || weekDays.length === 0) 
    return ''
  const first = weekDays[0]
  const last = weekDays[6]
  const startDate = new Date(first.dateString)
  const endDate = new Date(last.dateString)

  const startMonth = monthNames[startDate.getMonth()]
  const endMonth = monthNames[endDate.getMonth()]
  const year = endDate.getFullYear()

  // if week spans two months
  if (startMonth !== endMonth) {
    return `${startMonth} ${startDate.getDate()} – ${endMonth} ${endDate.getDate()}, ${year}`
  } else {
    return `${startMonth} ${startDate.getDate()} – ${endDate.getDate()}, ${year}`
  }
}

export function getCurrentWeekDays(offset = 0) {
  const current = new Date()
  const dayOfWeek = current.getDay() 
  
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  
  const monday = new Date(current)
  monday.setDate(monday.getDate() + distanceToMonday + (offset * 7))

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

  const [activeTab, setActiveTab] = useState('Log') 

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]  // defaults to today (YYYY-MM-DD)
  )
  const [exercises, setExercises] = useState([])
  const [notes, setNotes] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [saving, setSaving] = useState(false)

  const [workoutPlan, setWorkoutPlan] = useState([])
  const [showImport, setshowImport] = useState(false)

  const [isEditing, setIsEditing] = useState(true)
  const [hasExistingLog, setHasExistingLog] = useState(false)

  const [weekOffset, setWeekOffset] = useState(0)
  const [showMonthPicker, setShowMonthPicker] = useState(false)

  const weekDays = getCurrentWeekDays(weekOffset)
  const currentYear = new Date(weekDays[0]?.dateString).getFullYear()
  const currentMonth = new Date(weekDays[0]?.dateString).getMonth()

  const selectedDay = weekDays.find(d => d.dateString === selectedDate)?.fullName
  const matchingPlanDay = workoutPlan.find(
    (planDay) => planDay.day?.toLowerCase().includes(selectedDay?.toLowerCase())
  )

  useEffect(() => {
    if (userId && activeTab === 'Log') 
      fetchLog(selectedDate)
  }, [userId, selectedDate, activeTab])

  useFocusEffect(
    useCallback(() => {
      if (userId && activeTab === 'Log') 
        fetchWorkoutPlan()
    }, [userId, activeTab])
  )

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
      setDurationMinutes(String(data.duration_minutes || ''))
      setHasExistingLog(true)
      setIsEditing(false)
    } else {
      setExercises([])
      setNotes('')
      setDurationMinutes('')
      setHasExistingLog(false)
      setIsEditing(true)
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

  async function deleteLog() {
  Alert.alert(
    'Delete Log',
    'Are you sure you want to delete this log?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('workout_logs')
              .delete()
              .eq('user_id', userId)
              .eq('log_date', selectedDate)

            if (error) throw error
            setExercises([])
            setNotes('')
            setDurationMinutes('')
            setHasExistingLog(false)
            setIsEditing(true)
            Alert.alert('Deleted', 'Workout log deleted.')
          } catch (error) {
            Alert.alert('Error', error.message)
          }
        }
      }
    ])
  }

  async function saveLog() {
    
    const validExercises = exercises.filter(ex => ex.name.trim() !== '' && ex.sets !== '' && ex.reps !== '')
    if (validExercises.length === 0) {
      Alert.alert('No Exercises', 'Please add at least one exercise with a name, sets, and reps before saving.')
      return
    }

    try {
      setSaving(true)
      if (validExercises.length > 0) {
        const { error } = await supabase
          .from('workout_logs')
          .upsert({
            user_id: userId,
            log_date: selectedDate,
            exercises: validExercises,
            notes,
            duration_minutes: durationMinutes ? parseInt(durationMinutes) : null
          }, { onConflict: 'user_id,log_date' })
        if (error) 
          throw error
        setHasExistingLog(true)
      }
      setExercises(validExercises)
      setIsEditing(false)
      Alert.alert('Saved', 'Workout log saved!')
      } catch (error) {
        Alert.alert('Error', error.message)
      } finally {
        setSaving(false)
      }
    }    

  const [leaderboardLoading, setLeaderboardLoading] = useState(true)
  const [topTen, setTopTen] = useState([])
  const [topThree, setTopThree] = useState([])
  const [rank, setRank] = useState(0)
  const [minutes, setMinutes] = useState(0)

  useEffect(() => {
    if (activeTab === 'Leaderboard') {
      fetchLeaderboard()
    }
  }, [activeTab])

  const fetchLeaderboard = async () => {
    try {
      setLeaderboardLoading(true)
      const { data, error } = await supabase
        .from('total_minutes_this_week')
        .select('*')
      if (error) {
        throw error
      }
      if (data) {
        data.sort((a, b) => b.minutes - a.minutes)
        const userIndex = data.findIndex(item => item.id === userId)
        if (userIndex !== -1) {
          const userData = data[userIndex]
          setMinutes(userData.minutes)
          setRank(userIndex + 1)
        }
        data.length = Math.min(10, data.length)
        setTopThree([{...data[1], idx: 2}, {...data[0], idx: 1}, {...data[2], idx: 3}])
        setTopTen(data.slice(3))
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message)
      }
    } finally {
      setLeaderboardLoading(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      
      <View style={{ borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
        <View style={{ flexDirection: 'row', margin: 12, backgroundColor: '#f2f2f2', borderRadius: 10, padding: 3 }}>
          {['Log', 'Leaderboard'].map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: activeTab === tab ? '#fff' : 'transparent',
                elevation: activeTab === tab ? 2 : 0,
              }}
            >
              <Text style={{ fontWeight: '600', fontSize: 14, color: activeTab === tab ? '#000' : '#888' }}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeTab === 'Log' ? (
        <KeyboardAvoidingView behavior='padding' style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1, backgroundColor: '#fff' }}
            contentContainerStyle={{ padding: 16 }}
          >   
            <TouchableOpacity onPress={() => setShowMonthPicker(true)}>
              <Text style={styles.logTitle}>{getWeekRangeLabel(weekDays)} ▾</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity style={appStyles.arrowButton}
                onPress={() => setWeekOffset(weekOffset - 1)}>
                <Text style={appStyles.arrowText}>‹</Text>
              </TouchableOpacity>

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
              
              <TouchableOpacity style={appStyles.arrowButton}
                onPress={() => setWeekOffset(weekOffset + 1)}>
                <Text style={appStyles.arrowText}>›</Text>
              </TouchableOpacity>
            </View>

            {isEditing && (
              <TouchableOpacity
                style={appStyles.importButton}
                onPress={handleImportPress}
              >
                <Text style={appStyles.importButtonText}>↓ Import from Workout Plan</Text>
              </TouchableOpacity>
            )}

            {hasExistingLog && (
              <TouchableOpacity
                style={[appStyles.editButton, { flex: 1, marginTop: 10, marginBottom: 16 }]}
                onPress={() => setIsEditing(!isEditing)}
              >
                <Text style={appStyles.importButtonText}>
                  {isEditing ? 'Cancel Edit' : '✏️ Edit Log'}
                </Text>
              </TouchableOpacity>
            )}

            {exercises.length === 0 && !isEditing ? (
              <Text style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>
                No exercises logged for this day.
              </Text>
            ) : (
              exercises.map((ex, idx) => (
                <View key={idx} style={styles.exerciseCard}>
                  {isEditing ? (
                    <>
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
                          onChangeText={(val) => updateExercise(idx, 'sets', String(handleNumericInput(val)))} />

                        <TextInput style={[styles.logInput, styles.smallInput]} placeholder="Reps"
                          value={ex.reps} keyboardType='numeric'
                          placeholderTextColor="#888"
                          onChangeText={(val) => updateExercise(idx, 'reps', String(handleNumericInput(val)))} />

                        <TextInput style={[styles.logInput, styles.smallInput]} placeholder="kg"
                          value={ex.weight_kg} keyboardType="numeric"
                          placeholderTextColor="#888"
                          onChangeText={(val) => updateExercise(idx, 'weight_kg', String(handleNumericInput(val)))} />
                      </View>
                      <TouchableOpacity onPress={() => removeExercise(idx)}>
                        <Text style={styles.removeText}>Remove</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <View>
                      <Text style={appStyles.viewExerciseName}>{ex.name}</Text>
                      <Text style={appStyles.viewExerciseMeta}>
                        {ex.sets} sets × {ex.reps} reps{ex.weight_kg ? `  •  ${ex.weight_kg} kg` : ''}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}

            {isEditing && (
              <>
                <TouchableOpacity style={styles.addExerciseButton} onPress={addExercise}>
                  <Text style={styles.addExerciseText}>+ Add Exercise</Text>
                </TouchableOpacity>

                <TextInput
                  style={[styles.logInput, { marginTop: 12 }]}
                  placeholder="Total minutes spent at gym today"
                  placeholderTextColor="#888"
                  value={durationMinutes}
                  onChangeText={(val) => setDurationMinutes(String(handleNumericInput(val)))}
                  keyboardType="numeric"
                />

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

                <TouchableOpacity style={[styles.saveLogButton, { backgroundColor: '#FF3B30', marginTop: 2 }]} 
                  onPress={deleteLog}>
                  <Text style={styles.saveLogText}>Delete Log</Text>
                </TouchableOpacity>        
              </>
            )}

            {!isEditing && durationMinutes ? (
              <View style={[appStyles.notesDisplay, { marginTop: 12 }]}>
                <Text style={appStyles.notesLabel}>Minutes spent today</Text>
                <Text style={appStyles.notesText}>{durationMinutes} minutes</Text>
              </View>
            ) : null}

            {!isEditing && notes ? (
              <View style={appStyles.notesDisplay}>
                <Text style={appStyles.notesLabel}>Notes</Text>
                <Text style={appStyles.notesText}>{notes}</Text>
              </View>
            ) : null}

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

            <Modal
              visible={showMonthPicker}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setShowMonthPicker(false)}
            >
              <View style={appStyles.modalOverlay}>
                <View style={appStyles.modalContainer}>
                  <Text style={appStyles.modalTitle}>Jump to Month</Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <TouchableOpacity
                      style={appStyles.arrowButton}
                      onPress={() => setWeekOffset(weekOffset - 52)}
                    >
                      <Text style={appStyles.arrowText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={{ fontSize: 18, fontWeight: '700', marginHorizontal: 20 }}>
                      {currentYear}
                    </Text>
                    <TouchableOpacity
                      style={appStyles.arrowButton}
                      onPress={() => setWeekOffset(weekOffset + 52)}
                    >
                      <Text style={appStyles.arrowText}>›</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    {monthNames.map((month, idx) => {
                      const isCurrentMonth = idx === currentMonth
                      return (
                        <TouchableOpacity
                          key={month}
                          style={[appStyles.monthCard, isCurrentMonth && appStyles.monthCardSelected]}
                          onPress={() => {
                            const today = new Date()
                            const todayMonday = new Date(today)
                            const temp = today.getDay()
                            const distToMon = temp === 0 ? -6 : 1 - temp
                            todayMonday.setDate(today.getDate() + distToMon)

                            const targetDate = new Date(currentYear, idx, 1)
                            const diffWeeks = Math.round((targetDate - todayMonday) / (7 * 24 * 60 * 60 * 1000))
                            setWeekOffset(diffWeeks)
                            setShowMonthPicker(false)
                          }}
                        >
                          <Text style={[appStyles.monthText, isCurrentMonth && appStyles.monthTextSelected]}>
                            {month.slice(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>

                  <TouchableOpacity
                    style={[appStyles.cancelButton, { marginTop: 16 }]}
                    onPress={() => setShowMonthPicker(false)}
                  >
                    <Text style={appStyles.cancelButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>         
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (

        leaderboardLoading ? (
          <View style={[styles.container, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
          <View style={[styles.container, { flex: 1, alignItems: 'stretch', width: '100%', marginTop: 10 }]}>
            <Text style={[styles.title, { fontSize: 20, textAlign: 'center' }]}>
              You're in {rank}{rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th'} place with {minutes} minutes!
            </Text>
            <Spacer height={10} />
            <View style={[styles.row, { justifyContent: 'center', gap: 10, padding: 12, alignItems: 'flex-end' }]}>
              {topThree.map((user) => {
                const config = { 
                  color: user.idx === 1 ? 'gold' : user.idx === 2 ? 'silver' : '#CD7F32',
                  height: user.idx === 1 ? 200 : user.idx === 2 ? 160 : 140}
                return (
                  <View key={user.id} style={{ alignItems: 'center', width: 100 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 6 }} numberOfLines={1}>
                      {user.id === userId ? 'You' : (user.username ?? 'Anonymous')}
                    </Text>
                    <View style={{ backgroundColor: config.color, width: 100, height: config.height, alignItems: 'center', borderTopLeftRadius: 8, borderTopRightRadius: 8, justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 50, fontWeight: 'bold', marginTop: 20 }}>
                        {user.idx}
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                        {user.minutes}
                      </Text>
                    </View>
                  </View>
                )
              })}
            </View>
            <FlatList
              data={topTen}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item, index }) => (
                <View style={[styles.row, 
                  { backgroundColor: '#fff', padding: 12, 
                    borderBottomWidth: 1, borderColor: '#ced4da',
                    marginBottom: 0, justifyContent: 'space-between',
                    height: 50 }]}>
                  <Text style={{ fontSize: 16 }}>
                    {index + 4}       {item.id === userId ? 'You' : (item.username ?? 'Anonymous')}
                  </Text>
                  <Text style={{ fontSize: 16 }}>
                    {item.minutes} minutes
                  </Text>
                </View>
              )}
            />
          </View>
        )
      )}
    </View>
  )
}