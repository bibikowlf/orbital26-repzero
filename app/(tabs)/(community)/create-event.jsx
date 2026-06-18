import { useState } from 'react'
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { appStyles } from '../../../styles/styles'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'expo-router'
import { useAuthContext } from '../../../hooks/auth-context'

const CATEGORIES = ['Cardio', 'Strength', 'Flexibility', 'Social', 'Other']

export default function CreateEvent() {
  const router = useRouter()
  const { claims } = useAuthContext()
  const userId = claims?.sub

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [maxAttendees, setMaxAttendees] = useState('')
  const [category, setCategory] = useState(null)
  const [customCategory, setCustomCategory] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
  
  if (!title.trim()) {
    return Alert.alert('Missing Field', 'Please enter an event title.')
  }

  if (!description.trim()) {
    return Alert.alert('Missing Field', 'Please enter an event description.')
  }

  if (!location.trim()) {
    return Alert.alert('Missing Field', 'Please specify a location.')
  }

  if (!eventDate.trim()) {
    return Alert.alert('Missing Field', 'Please enter an event date (YYYY-MM-DD).')
  }
  if (!eventTime.trim()) {
    return Alert.alert('Missing Field', 'Please enter an event time (HH:MM).')
  }

  if (!category) {
    return Alert.alert('Missing Field', 'Please select a category chip.')
  }

  if (category === 'Other' && !customCategory.trim()) {
    return Alert.alert('Missing Field', 'Please specify your custom category.')
  }

  const finalCategory = category === 'Other' ? customCategory.trim() : category

  const combinedDateTime = new Date(`${eventDate}T${eventTime}:00+08:00`)
  if (isNaN(combinedDateTime)) {
    return Alert.alert('Invalid Format', 'Please use YYYY-MM-DD for date and HH:MM for time.')
  }

  if (!userId) {
    return Alert.alert('Error', 'You must be logged in to create an event')
  }

  try {
    setSaving(true)
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return Alert.alert('Error', 'You must be logged in to create an event')
    }

    const { error } = await supabase.from('events').insert({
      creator_id: userId,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      event_date: combinedDateTime.toISOString(),
      category: finalCategory, 
      max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
    })
    
    if (error) throw error
    Alert.alert('Done', 'Event created!', [{ text: 'OK', onPress: () => router.back() }])
  } catch (error) {
    Alert.alert('Error', error.message)
  } finally {
    setSaving(false)
  }
}

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 16 }}>
      <Text style={appStyles.label}>Title *</Text>
      <TextInput
        style={appStyles.input}
        placeholder="e.g. Morning Run at East Coast Park"
        placeholderTextColor="#888"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={appStyles.label}>Description *</Text>
      <TextInput
        style={[appStyles.input, { height: 80 }]}
        placeholder="What's the plan?"
        placeholderTextColor="#888"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={appStyles.label}>Location *</Text>
      <TextInput
        style={appStyles.input}
        placeholder="e.g. East Coast Park"
        placeholderTextColor="#888"
        value={location}
        onChangeText={setLocation}
      />

      <Text style={appStyles.label}>Date * (YYYY-MM-DD)</Text>
      <TextInput
        style={appStyles.input}
        keyboardType='numbers-and-punctuation'
        placeholder="e.g. 2025-06-20"
        placeholderTextColor="#888"
        value={eventDate}
        onChangeText={setEventDate}
      />

      <Text style={appStyles.label}>Time * (HH:MM)</Text>
      <TextInput
        style={appStyles.input}
        keyboardType='numbers-and-punctuation'
        placeholder="e.g. 07:00"
        placeholderTextColor="#888"
        value={eventTime}
        onChangeText={setEventTime}
      />

      <Text style={appStyles.label}>Category *</Text>
      <View style={appStyles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[appStyles.categoryChip, category === cat && appStyles.categoryChipActive]}
            onPress={() => {
              setCategory(cat)
              if (cat != 'Other') 
                setCustomCategory('')
            }}
          >
            <Text style={[appStyles.categoryChipText, category === cat && appStyles.categoryChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {category === 'Other' && (
      <View style={{ marginTop: 10 }}>
        <Text style={[appStyles.label, { marginTop: 0 }]}>Please specify *</Text>
        <TextInput
          style={appStyles.input}
          placeholder="e.g. Pilates, Boxing, Dance"
          placeholderTextColor="#888"
          value={customCategory}
          onChangeText={setCustomCategory}
        />
      </View>
    )}

      <Text style={appStyles.label}>Max Attendees (optional)</Text>
      <TextInput
        style={appStyles.input}
        placeholder="e.g. 10"
        placeholderTextColor="#888"
        value={maxAttendees}
        onChangeText={setMaxAttendees}
        keyboardType="numeric"
      />

      <TouchableOpacity style={[
          appStyles.submitButton,
          saving && { opacity: 0.5 }
        ]} onPress={handleSubmit} disabled={saving}
      >
        <Text style={appStyles.submitText}>Post Event</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
