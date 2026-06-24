import { useState, useEffect } from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, TextInput } from 'react-native'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/auth-context'
import { appStyles } from '../../styles/styles'
import Spacer from '../../components/spacer'

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
  }

  function handleUpdateExercise(dayIndex, exerciseIndex, field, value) {
    setWorkoutPlan(updateExerciseField(workoutPlan, dayIndex, exerciseIndex, field, value))
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
    // console.log("API KEY:", process.env.EXPO_PUBLIC_GEMINI_KEY)
    try {
      setLoading(true)

      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) 
        throw profileError

      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('generate-workout', {
        body: { profile: profile },
    });

    if (edgeError) 
      throw edgeError;

    const rawJsonString = edgeData?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!rawJsonString) {
      throw new Error("Invalid structure data returned from production processor.")
    }

    const parsedPlan = JSON.parse(rawJsonString)

    await savePlanToDatabase(parsedPlan)
    setWorkoutPlan(parsedPlan)
    setIsEditing(false)
    Alert.alert("Success", "Your routine has been generated!")

    } catch (error) {
      Alert.alert("Generation Failed", error.message)
      console.error(error)
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
    <ScrollView style={{ paddingHorizontal: 15, paddingTop: 20 }}>
      <Text style={[appStyles.label, { fontSize: 22, fontWeight: 'bold' }]}>AI Workout Suite</Text>
      <Text style={{ color: '#666', marginTop: 4 }}>Review, refine, or rewrite your customized routine split.</Text>
      <Spacer />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity 
          style={[appStyles.actionButton, { backgroundColor: '#007AFF' }, loading && appStyles.buttonDisabled]}
          onPress={handleGenerateWorkout}
          disabled={loading}
        >
          <Text style={appStyles.buttonText}>{workoutPlan.length > 0 ? 'AI Regenerate' : 'AI Generate'}</Text>
        </TouchableOpacity>

        {workoutPlan.length > 0 && (
          <TouchableOpacity 
            style={[appStyles.actionButton, { backgroundColor: isEditing ? '#34C759' : '#5856D6' }]}
            onPress={isEditing ? handleSaveEdits : () => setIsEditing(true)}
          >
            <Text style={appStyles.buttonText}>{isEditing ? 'Save Customizations' : 'Modify Items'}</Text>
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
        <Text style={appStyles.fallbackText}>No routine active. Prompt Gemini to map out your week.</Text>
      )}
      <Spacer />
    </ScrollView>
  )
}