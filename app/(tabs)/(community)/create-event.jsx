import { useState, useEffect } from 'react'
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { appStyles } from '../../../styles/styles'

export default function CreateEvent() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')

  function handleSubmit() {
    console.log('Form data captured:', { title, description, location, eventDate, eventTime, category, maxAttendees })
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

      <TouchableOpacity style={appStyles.submitButton} onPress={handleSubmit}>
        <Text style={appStyles.submitText}>Post Event</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
