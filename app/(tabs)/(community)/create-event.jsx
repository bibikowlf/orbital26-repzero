import { useState, useEffect } from 'react'
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { appStyles } from '../../../styles/styles'

export default function CreateEvent() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [maxAttendees, setMaxAttendees] = useState('')

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

  const combinedDateTime = new Date(`${eventDate}T${eventTime}:00+08:00`)
  if (isNaN(combinedDateTime)) {
    return Alert.alert('Invalid Format', 'Please use YYYY-MM-DD for date and HH:MM for time.')
  }

  try {
    setSaving(true)
    const { error } = await supabase.from('events').insert({
      creator_id: userId,
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      event_date: combinedDateTime.toISOString(),
      category, 
      max_attendees: parseInt(maxAttendees),
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

      <Text style={appStyles.label}>Description</Text>
      <TextInput
        style={[appStyles.input, { height: 80 }]}
        placeholder="What's the plan?"
        placeholderTextColor="#888"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={appStyles.label}>Location</Text>
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
        placeholder="e.g. 2025-06-20"
        placeholderTextColor="#888"
        value={eventDate}
        onChangeText={setEventDate}
      />

      <Text style={appStyles.label}>Time * (HH:MM)</Text>
      <TextInput
        style={appStyles.input}
        placeholder="e.g. 07:00"
        placeholderTextColor="#888"
        value={eventTime}
        onChangeText={setEventTime}
      />

      <Text style={appStyles.label}>Max Attendees (optional)</Text>
      <TextInput
        style={appStyles.input}
        placeholder="e.g. 10"
        placeholderTextColor="#888"
        value={maxAttendees}
        onChangeText={setMaxAttendees}
        keyboardType="numeric"
      />

      <TouchableOpacity style={appStyles.submitButton} onPress={handleSubmit}>
        <Text style={appStyles.submitText}>Post Event</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
