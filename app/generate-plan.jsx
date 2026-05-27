import { useState, useEffect } from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert, StyleSheet, TextInput } from 'react-native'
import { supabase } from '../lib/supabase'
import { useAuthContext } from '../hooks/auth-context'
import { appStyles } from '../styles/styles'
import Spacer from '../components/spacer'

export default function GeneratePlan() {
  const {claims} = useAuthContext()
  const userId = claims?.sub

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [workoutPlan, setWorkoutPlan] = useState([])

  const styles = appStyles

  useEffect(() => {
    if (userId) fetchSavedPlan()
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
      if (data?.workout_plan) {
        setWorkoutPlan(data.workout_plan)
      }
    } catch (error) {
      console.error("Error loading saved plan:", error)
    } finally {
      setFetching(false)
    }
  }

  async function handleGenerateWorkout() {
    console.log("API KEY:", process.env.EXPO_PUBLIC_GEMINI_KEY)
    try {
      setLoading(true)

      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) 
        throw profileError

      const prompt = `
        You are an elite personal trainer. Create a customized weekly workout split based on these parameters:
        - Gender: ${profile.gender}, Height: ${profile.height_cm}cm, Weight: ${profile.weight_kg}kg
        - Sessions per Week: ${profile.gym_frequency}, Session Length: ${profile.time_per_session} mins
        - Experience: ${profile.gym_exp || 'Not specified'}, Goals/Notes: ${profile.add_info || 'None'}

        CRITICAL: Return ONLY a valid JSON array matching this exact schema:
        [
          {
            "day": "Monday: Push Day",
            "exercises": [
              { "name": "Bench Press", "sets": 4, "reps": "8-10", "notes": "Warm up sets first" }
            ]
          }
        ]
      `

      const apiKey = process.env.EXPO_PUBLIC_GEMINI_KEY
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              response_mime_type: "application/json"
            }
          })
        }
      )

      const result = await response.json()
      //console.log("Response status:", response.status)    
      //console.log("Full result:", JSON.stringify(result)) 
      if (!response.ok) 
        throw new Error(result?.error?.message || "Gemini failure")

      const rawJsonString = result?.candidates?.[0]?.content?.parts?.[0]?.text
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

    if (error) throw error
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
          style={[localStyles.actionButton, { backgroundColor: '#007AFF' }, loading && styles.buttonDisabled]}
          onPress={handleGenerateWorkout}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{workoutPlan.length > 0 ? 'AI Regenerate' : 'AI Generate'}</Text>
        </TouchableOpacity>

        {workoutPlan.length > 0 && (
          <TouchableOpacity 
            style={[localStyles.actionButton, { backgroundColor: isEditing ? '#34C759' : '#5856D6' }]}
            onPress={isEditing ? handleSaveEdits : () => setIsEditing(true)}
          >
            <Text style={styles.buttonText}>{isEditing ? 'Save Customizations' : 'Modify Items'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Spacer />

      {workoutPlan.length > 0 ? (
        workoutPlan.map((dayItem, dayIdx) => (
          <View key={dayIdx} style={localStyles.dayContainer}>
            <Text style={localStyles.dayHeader}>{dayItem.day}</Text>
            
            {dayItem.exercises?.map((exercise, exIdx) => (
              <View key={exIdx} style={localStyles.exerciseRow}>
                {isEditing ? (
                  <View style={{ width: '100%' }}>
                    <Text style={localStyles.miniLabel}>Exercise Name</Text>
                    <TextInput 
                      style={localStyles.inlineInput}
                      value={exercise.name}
                      onChangeText={(val) => handleFieldChange(dayIdx, exIdx, 'name', val)}
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <View style={{ width: '48%' }}>
                        <Text style={localStyles.miniLabel}>Sets</Text>
                        <TextInput 
                          style={localStyles.inlineInput}
                          value={String(exercise.sets)}
                          keyboardType="numeric"
                          onChangeText={(val) => handleFieldChange(dayIdx, exIdx, 'sets', parseInt(val) || 0)}
                        />
                      </View>
                      <View style={{ width: '48%' }}>
                        <Text style={localStyles.miniLabel}>Reps</Text>
                        <TextInput 
                          style={localStyles.inlineInput}
                          value={exercise.reps}
                          onChangeText={(val) => handleFieldChange(dayIdx, exIdx, 'reps', val)}
                        />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={{ flex: 1 }}>
                    <Text style={localStyles.exerciseName}>{exercise.name}</Text>
                    <Text style={localStyles.exerciseMeta}>
                      {exercise.sets} Sets x {exercise.reps} Reps
                    </Text>
                    {exercise.notes && <Text style={localStyles.exerciseNotes}>{exercise.notes}</Text>}
                  </View>
                )}
              </View>
            ))}
          </View>
        ))
      ) : (
        <Text style={localStyles.fallbackText}>No routine active. Prompt Gemini to map out your week.</Text>
      )}
      <Spacer />
    </ScrollView>
  )
}

const localStyles = StyleSheet.create({
  actionButton: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dayHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    paddingBottom: 4,
  },
  exerciseRow: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: '#ced4da',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
  },
  exerciseMeta: {
    fontSize: 13,
    color: '#495057',
    marginTop: 2,
  },
  exerciseNotes: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    marginTop: 4,
  },
  miniLabel: {
    fontSize: 11,
    color: '#6c757d',
    fontWeight: '600',
    marginBottom: 2,
  },
  inlineInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  fallbackText: {
    color: '#868e96',
    textAlign: 'center',
    marginTop: 40,
  }
})