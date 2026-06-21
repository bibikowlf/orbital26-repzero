import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '../../../lib/supabase'
import { useAuthContext } from '../../../hooks/auth-context'
import { appStyles } from '../../../styles/styles'

const CATEGORY_COLORS = {
  Cardio: '#FF9500',
  Strength: '#5856D6',
  Flexibility: '#cb21d4',
  Social: '#34C759',
  default: '#0048ff',
}

const CATEGORIES = ['Cardio', 'Strength', 'Flexibility', 'Social', 'Other']

function formatEventDate(dateStr) {
  const date = new Date(dateStr)
  const day = date.toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const time = date.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
  return { day, time }
}

export default function MyEventDetail() {
  const { id } = useLocalSearchParams()
  const { claims } = useAuthContext()
  const router = useRouter()
  const userId = claims?.sub

  const [event, setEvent] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [maxAttendees, setMaxAttendees] = useState('')
  const [category, setCategory] = useState(null)
  const [customCategory, setCustomCategory] = useState('')

  useEffect(() => {
    if (userId && id) fetchEventAndAttendees()
  }, [userId, id])

  async function fetchEventAndAttendees() {
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select(`*, event_rsvps(count)`)
      .eq('id', id)
      .single()

    if (eventError) {
      Alert.alert('Error', 'Could not load event.')
      setLoading(false)
      return
    }

    const { data: rsvpData, error: rsvpError } = await supabase
      .from('event_rsvps')
      .select(`status, created_at, profiles(username)`)
      .eq('event_id', id)
      .eq('status', 'going')
      .order('created_at', { ascending: true })

    if (rsvpError) console.error(rsvpError)

    const loaded = {
      ...eventData,
      rsvp_count: eventData.event_rsvps?.[0]?.count ?? 0,
    }
    setEvent(loaded)
    setAttendees(rsvpData || [])
    setLoading(false)

    const dt = new Date(eventData.event_date)
    const yyyy = dt.getFullYear()
    const mm = String(dt.getMonth() + 1).padStart(2, '0')
    const dd = String(dt.getDate()).padStart(2, '0')
    const hh = String(dt.getHours()).padStart(2, '0')
    const min = String(dt.getMinutes()).padStart(2, '0')

    setTitle(eventData.title)
    setDescription(eventData.description)
    setLocation(eventData.location)
    setEventDate(`${yyyy}-${mm}-${dd}`)
    setEventTime(`${hh}:${min}`)
    setMaxAttendees(eventData.max_attendees ? String(eventData.max_attendees) : '')
    
    const knownCategory = CATEGORIES.includes(eventData.category) ? eventData.category : 'Other'
    
    setCategory(knownCategory)
    if (knownCategory === 'Other') setCustomCategory(eventData.category)
  }

  async function handleSave() {
    if (!title.trim()) return Alert.alert('Missing Field', 'Please enter a title.')
    if (!description.trim()) return Alert.alert('Missing Field', 'Please enter a description.')
    if (!location.trim()) return Alert.alert('Missing Field', 'Please enter a location.')
    if (!eventDate.trim()) return Alert.alert('Missing Field', 'Please enter a date (YYYY-MM-DD).')
    if (!eventTime.trim()) return Alert.alert('Missing Field', 'Please enter a time (HH:MM).')
    if (!category) return Alert.alert('Missing Field', 'Please select a category.')
    if (category === 'Other' && !customCategory.trim()) return Alert.alert('Missing Field', 'Please specify your custom category.')

    const finalCategory = category === 'Other' ? customCategory.trim() : category
    const combinedDateTime = new Date(`${eventDate}T${eventTime}:00+08:00`)
    if (isNaN(combinedDateTime)) return Alert.alert('Invalid Format', 'Invalid date or time.')

    try {
      setSaving(true)
      const { error } = await supabase
        .from('events')
        .update({
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          event_date: combinedDateTime.toISOString(),
          category: finalCategory,
          max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
        })
        .eq('id', id)

      if (error) throw error
      await fetchEventAndAttendees()
      setIsEditing(false)
      Alert.alert('Saved', 'Event updated!')
    } catch (error) {
      Alert.alert('Error', error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('events').delete().eq('id', id)
            if (error) return Alert.alert('Error', error.message)
            router.back()
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#888' }}>Loading...</Text>
      </View>
    )
  }

  if (!event) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#888' }}>Event not found.</Text>
      </View>
    )
  }

  const { day, time } = formatEventDate(event.event_date)
  const spotsLeft = event.max_attendees ? event.max_attendees - event.rsvp_count : null

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 20 }}>

      {isEditing ? (
        <>
          <Text style={appStyles.label}>Title *</Text>
          <TextInput style={appStyles.input} value={title} onChangeText={setTitle}
            placeholder="Event title" placeholderTextColor="#888" />

          <Text style={appStyles.label}>Description *</Text>
          <TextInput style={[appStyles.input, { height: 80 }]} value={description}
            onChangeText={setDescription} placeholder="What's the plan?"
            placeholderTextColor="#888" multiline />

          <Text style={appStyles.label}>Location *</Text>
          <TextInput style={appStyles.input} value={location} onChangeText={setLocation}
            placeholder="e.g. East Coast Park" placeholderTextColor="#888" />

          <Text style={appStyles.label}>Date * (YYYY-MM-DD)</Text>
          <TextInput style={appStyles.input} value={eventDate} onChangeText={setEventDate}
            placeholder="e.g. 2025-06-20" placeholderTextColor="#888"
            keyboardType="numbers-and-punctuation" />

          <Text style={appStyles.label}>Time * (HH:MM)</Text>
          <TextInput style={appStyles.input} value={eventTime} onChangeText={setEventTime}
            placeholder="e.g. 07:00" placeholderTextColor="#888"
            keyboardType="numbers-and-punctuation" />

          <Text style={appStyles.label}>Category *</Text>
          <View style={appStyles.categoryRow}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[appStyles.categoryChip, category === cat && appStyles.categoryChipActive]}
                onPress={() => { setCategory(cat); if (cat !== 'Other') setCustomCategory('') }}
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
              <TextInput style={appStyles.input} value={customCategory}
                onChangeText={setCustomCategory} placeholder="e.g. Pilates, Boxing"
                placeholderTextColor="#888" />
            </View>
          )}

          <Text style={appStyles.label}>Max Attendees (optional)</Text>
          <TextInput style={appStyles.input} value={maxAttendees}
            onChangeText={setMaxAttendees} placeholder="e.g. 10"
            placeholderTextColor="#888" keyboardType="numeric" />

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#888', alignItems: 'center' }}
              onPress={() => setIsEditing(false)}
            >
              <Text style={{ color: '#888', fontWeight: '700', fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#0048ff', alignItems: 'center', opacity: saving ? 0.5 : 1 }}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={[appStyles.categoryBadge, { backgroundColor: CATEGORY_COLORS[event.category] || CATEGORY_COLORS.default }]}>
            <Text style={appStyles.categoryText}>{event.category}</Text>
          </View>

          <Text style={appStyles.title}>{event.title}</Text>

          <View style={appStyles.infoBox}>
            <View style={appStyles.infoRow}>
              <Text style={appStyles.infoIcon}>📅</Text>
              <Text style={appStyles.infoText}>{day}</Text>
            </View>
            <View style={appStyles.infoRow}>
              <Text style={appStyles.infoIcon}>🕐</Text>
              <Text style={appStyles.infoText}>{time}</Text>
            </View>
            <View style={appStyles.infoRow}>
              <Text style={appStyles.infoIcon}>📍</Text>
              <Text style={appStyles.infoText}>{event.location}</Text>
            </View>
            <View style={appStyles.infoRow}>
              <Text style={appStyles.infoIcon}>👥</Text>
              <Text style={appStyles.infoText}>
                {event.rsvp_count} going
                {spotsLeft !== null && (
                  <Text style={{ color: spotsLeft <= 3 ? '#FF3B30' : '#888' }}>
                    {' '}· {spotsLeft <= 0 ? 'Full' : `${spotsLeft} spots left`}
                  </Text>
                )}
              </Text>
            </View>
          </View>

          <Text style={appStyles.sectionLabel}>About</Text>
          <Text style={appStyles.description}>{event.description}</Text>

          <Text style={appStyles.sectionLabel}>Attendees ({event.rsvp_count})</Text>
          {attendees.length === 0 ? (
            <Text style={appStyles.emptyText}>No one has RSVP'd yet.</Text>
          ) : (
            attendees.map((rsvp, idx) => (
              <View key={idx} style={appStyles.attendeeRow}>
                <View style={appStyles.avatarCircle}>
                  <Text style={appStyles.avatarText}>
                    {rsvp.profiles?.username?.[0]?.toUpperCase() ?? '?'}
                  </Text>
                </View>
                <Text style={appStyles.attendeeUsername}>@{rsvp.profiles?.username}</Text>
              </View>
            ))
          )}

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 32, marginBottom: 16 }}>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#0048ff', alignItems: 'center' }}
              onPress={() => setIsEditing(true)}
            >
              <Text style={{ color: '#0048ff', fontWeight: '700', fontSize: 15 }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#FF3B30', alignItems: 'center' }}
              onPress={handleDelete}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  )
}