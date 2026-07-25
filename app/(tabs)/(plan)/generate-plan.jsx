import { useState, useEffect } from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, TextInput } from 'react-native'
import { supabase } from '../../../lib/supabase'
import { useAuthContext } from '../../../hooks/auth-context'
import { appStyles } from '../../../styles/styles'
import Spacer from '../../../components/spacer'

export function addExerciseToDay(plan, dayIndex) {
  const updated = plan.map((day, i) =>
    i === dayIndex
      ? { ...day, exercises: [...day.exercises, { name: '', sets: '', reps: '', notes: '' }] }
      : day
  )
  return updated
}

export function deleteExerciseFromDay(plan, dayIndex, exerciseIndex) {
  const updated = plan.map((day, i) =>
    i === dayIndex
      ? { ...day, exercises: day.exercises.filter((_, j) => j !== exerciseIndex) }
      : day
  )
  return updated
}

export function updateExerciseField(plan, dayIndex, exerciseIndex, field, value) {
  const updated = plan.map((day, i) =>
    i === dayIndex
      ? {
          ...day,
          exercises: day.exercises.map((ex, j) =>
            j === exerciseIndex ? { ...ex, [field]: value } : ex
          ),
        }
      : day
  )
  return updated
}

export default function GeneratePlan() {
  const {claims} = useAuthContext()
  const userId = claims?.sub

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [workoutPlan, setWorkoutPlan] = useState([])

  function handleAddExercise(dayIndex) {
    setWorkoutPlan(addExerciseToDay(workoutPlan, dayIndex))
    setIsEditing(true)
  }

  function handleDeleteExercise(dayIndex, exerciseIndex) {
    setWorkoutPlan(deleteExerciseFromDay(workoutPlan, dayIndex, exerciseIndex))
    setIsEditing(true)
  }

  function handleUpdateExercise(dayIndex, exerciseIndex, field, value) {
    setWorkoutPlan(updateExerciseField(workoutPlan, dayIndex, exerciseIndex, field, value))
    setIsEditing(true)
  }

  useEffect(() => {
    if (userId) 
      fetchSavedPlan()
  }, [userId])

  async function fetchSavedPlan() {
    try {
      setFetching(true)
      let {data, error} = await supabase
        .from('profiles')
        .select('workout_plan')
        .eq('id', userId)
        .single()

      if (error) 
        throw error

      if (data?.workout_plan) 
        setWorkoutPlan(data.workout_plan)
    } catch (error) {
      console.error("Error loading saved plan:", error)
    } finally {
      setFetching(false)
    }
  }

  async function handleGenerateWorkout() {
    try {
      setLoading(true)

      // 1. Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      const { data: workoutPlan, error: edgeError } = await supabase.functions.invoke('generate-workout', {
        body: { profile },
      })

      if (edgeError) {
        console.log('--- SUPABASE FUNCTION ERROR ---')
        console.error(edgeError)
        
        if (edgeError.context) {
          const errorBody = await edgeError.context.json().catch(() => null)
          console.log('Edge Function Error Body:', errorBody)
          throw new Error(errorBody?.error || edgeError.message)
        }
        throw edgeError
      }

      if (!workoutPlan || !Array.isArray(workoutPlan)) {
        throw new Error("Received invalid workout structure from server.")
      }

      await savePlanToDatabase(workoutPlan)
      setWorkoutPlan(workoutPlan)
      setIsEditing(false)
      Alert.alert("Success", "Your routine has been generated!")

    } catch (error) {
      console.error('Generation Failed Error:', error)
      Alert.alert("Generation Failed", error.message || String(error))
    } finally {
      setLoading(false)
    }
  }

  async function savePlanToDatabase(planData) {
    let { error } = await supabase
      .from('profiles')
      .update({ workout_plan: planData })
      .eq('id', userId)

    if (error) 
      throw error
  }

  const handleSaveEdits = async () => {
    try {
      setLoading(true)
      await savePlanToDatabase(workoutPlan)
      setIsEditing(false)
      Alert.alert("Saved", "Your modifications have been applied successfully!")

    } catch (error) {
      Alert.alert("Error saving edits", error.message)

    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <View style={[appStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }

  return (
    <ScrollView style={{ paddingHorizontal: 15, paddingTop: 24 }}>
      <Text style={[appStyles.label, { fontSize: 25, fontWeight: 'bold' }]}>Your AI Workout Suite</Text>
      <Text style={{ color: '#888', fontSize: 14, marginTop: 6, lineHeight: 20 }}>
        {workoutPlan.length > 0
          ? 'Generated specifically for you. You can review, modify or regenerate your customized routine split.'
          : 'Get a workout routine tailored for your profile in seconds.'}
      </Text>
      <Spacer />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        <TouchableOpacity 
          style={[appStyles.actionButton, { flex: 1, backgroundColor: '#007AFF' }, loading && appStyles.buttonDisabled]}
          onPress={() => {
            if (workoutPlan.length > 0) {
              Alert.alert("Regenerate Plan?", "This will replace your current workout plan. Continue?", [
                { text: "Cancel", style: "cancel" },
                { text: "Regenerate", style: "destructive", onPress: handleGenerateWorkout },
              ])
            } else {
              handleGenerateWorkout()
            }
          }}
          disabled={loading}
        >
          <Text style={appStyles.buttonText}>{workoutPlan.length > 0 ? 'Regenerate' : 'Generate Plan'}</Text>
        </TouchableOpacity>

        {workoutPlan.length > 0 && (
          <TouchableOpacity 
            disabled={loading}
            style={[appStyles.actionButton, { flex: 1, backgroundColor: isEditing ? '#34C759' : '#5856D6' }]}
            onPress={isEditing ? handleSaveEdits : () => setIsEditing(true)}
          >
            <Text style={appStyles.buttonText}>{isEditing ? 'Save Changes' : 'Modify'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Spacer/>
      {workoutPlan.length > 0 ? (
        workoutPlan.map((dayItem, dayIdx) => (
          <View key={dayIdx} style={appStyles.dayContainer}>
            <Text style={appStyles.dayHeader}>{dayItem.day}</Text>
            
            {dayItem.exercises?.map((exercise, exIdx) => (
              <View key={exIdx} style={appStyles.exerciseRow}>
                {isEditing ? (
                  <View style={{ width: '100%' }}>
                    <Text style={appStyles.miniLabel}>Exercise Name</Text>
                    <TextInput 
                      style={appStyles.inlineInput}
                      value={exercise.name}
                      onChangeText={(val) => handleUpdateExercise(dayIdx, exIdx, 'name', val)}
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <View style={{ width: '48%' }}>
                        <Text style={appStyles.miniLabel}>Sets</Text>
                        <TextInput 
                          style={appStyles.inlineInput}
                          value={String(exercise.sets)}
                          keyboardType="numeric"
                          onChangeText={(val) => handleUpdateExercise(dayIdx, exIdx, 'sets', parseInt(val) || 0)}
                        />
                      </View>
                      <View style={{ width: '48%' }}>
                        <Text style={appStyles.miniLabel}>Reps</Text>
                        <TextInput 
                          style={appStyles.inlineInput}
                          value={exercise.reps}
                          onChangeText={(val) => handleUpdateExercise(dayIdx, exIdx, 'reps', val)}
                        />
                      </View>
                    </View>

                    {/* Delete exercise button */}
                    <TouchableOpacity onPress={() => handleDeleteExercise(dayIdx, exIdx)}>
                      <Text style={appStyles.removeText}>Remove</Text>
                      </TouchableOpacity>
                  </View>                     
                ) : (
                  <View style={{ flex: 1 }}>
                    <Text style={appStyles.exerciseName}>{exercise.name}</Text>
                    <Text style={appStyles.exerciseMeta}>
                      {exercise.sets} Sets x {exercise.reps} Reps
                    </Text>
                    {exercise.notes && <Text style={appStyles.exerciseNotes}>{exercise.notes}</Text>}
                  </View>
                )}
              </View>             
            ))}

            {/* Add exercise button */}
            {isEditing && (
              <TouchableOpacity
                style={[appStyles.addExerciseButton, { marginTop: 8 }]}
                onPress={() => handleAddExercise(dayIdx)}
              >
                <Text style={appStyles.addExerciseText}>+ Add Exercise</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      ) : (
        <Text style={appStyles.fallbackText}>No routine active. Generate a plan to map out your week.</Text>
      )}
      <Spacer />
    </ScrollView>
  )
}