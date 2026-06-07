import { useState, useEffect } from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, TextInput } from 'react-native'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/auth-context'
import { appStyles } from '../../styles/styles'
import Spacer from '../../components/spacer'

export default function GeneratePlan() {
  const {claims} = useAuthContext()
  const userId = claims?.sub

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [workoutPlan, setWorkoutPlan] = useState([])

  const styles = appStyles

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

  const handleFieldChange = (dayIndex, exerciseIndex, field, value) => {
    const updatedPlan = [...workoutPlan]
    updatedPlan[dayIndex].exercises[exerciseIndex][field] = value
    setWorkoutPlan(updatedPlan)
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
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }

  return (
    <ScrollView style={{ paddingHorizontal: 15, paddingTop: 20 }}>
      <Text style={[styles.label, { fontSize: 22, fontWeight: 'bold' }]}>AI Workout Suite</Text>
      <Text style={{ color: '#666', marginTop: 4 }}>Review, refine, or rewrite your customized routine split.</Text>
      <Spacer />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: '#007AFF' }, loading && styles.buttonDisabled]}
          onPress={handleGenerateWorkout}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{workoutPlan.length > 0 ? 'AI Regenerate' : 'AI Generate'}</Text>
        </TouchableOpacity>

        {workoutPlan.length > 0 && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: isEditing ? '#34C759' : '#5856D6' }]}
            onPress={isEditing ? handleSaveEdits : () => setIsEditing(true)}
          >
            <Text style={styles.buttonText}>{isEditing ? 'Save Customizations' : 'Modify Items'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Spacer/>

      {workoutPlan.length > 0 ? (
        workoutPlan.map((dayItem, dayIdx) => (
          <View key={dayIdx} style={styles.dayContainer}>
            <Text style={styles.dayHeader}>{dayItem.day}</Text>
            
            {dayItem.exercises?.map((exercise, exIdx) => (
              <View key={exIdx} style={styles.exerciseRow}>
                {isEditing ? (
                  <View style={{ width: '100%' }}>
                    <Text style={styles.miniLabel}>Exercise Name</Text>
                    <TextInput 
                      style={styles.inlineInput}
                      value={exercise.name}
                      onChangeText={(val) => handleFieldChange(dayIdx, exIdx, 'name', val)}
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <View style={{ width: '48%' }}>
                        <Text style={styles.miniLabel}>Sets</Text>
                        <TextInput 
                          style={styles.inlineInput}
                          value={String(exercise.sets)}
                          keyboardType="numeric"
                          onChangeText={(val) => handleFieldChange(dayIdx, exIdx, 'sets', parseInt(val) || 0)}
                        />
                      </View>
                      <View style={{ width: '48%' }}>
                        <Text style={styles.miniLabel}>Reps</Text>
                        <TextInput 
                          style={styles.inlineInput}
                          value={exercise.reps}
                          onChangeText={(val) => handleFieldChange(dayIdx, exIdx, 'reps', val)}
                        />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseMeta}>
                      {exercise.sets} Sets x {exercise.reps} Reps
                    </Text>
                    {exercise.notes && <Text style={styles.exerciseNotes}>{exercise.notes}</Text>}
                  </View>
                )}
              </View>
            ))}
          </View>
        ))
      ) : (
        <Text style={styles.fallbackText}>No routine active. Prompt Gemini to map out your week.</Text>
      )}
      <Spacer />
    </ScrollView>
  )
}