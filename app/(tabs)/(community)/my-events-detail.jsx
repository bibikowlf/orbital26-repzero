import { useState, useEffect } from 'react'
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
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

function formatEventDate(dateStr) {
  const date = new Date(dateStr)
  const day = date.toLocaleDateString('en-SG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const time = date.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
  return { day, time }
}

export default function MyEventDetail() {
  const { id } = useLocalSearchParams()
  const { claims } = useAuthContext()
  const userId = claims?.sub

  const [event, setEvent] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId && id) fetchEventAndAttendees()
  }, [userId, id])

  async function fetchEventAndAttendees() {
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select(`
        *,
        event_rsvps(count)
      `)
      .eq('id', id)
      .single()

    if (eventError) {
      Alert.alert('Error', 'Could not load event.')
      setLoading(false)
      return
    }

    const { data: rsvpData, error: rsvpError } = await supabase
      .from('event_rsvps')
      .select(`
        status,
        created_at,
        profiles(username)
      `)
      .eq('event_id', id)
      .eq('status', 'going')
      .order('created_at', { ascending: true })

    if (rsvpError) console.error(rsvpError)

    setEvent({
      ...eventData,
      rsvp_count: eventData.event_rsvps?.[0]?.count ?? 0,
    })
    setAttendees(rsvpData || [])
    setLoading(false)
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

    </ScrollView>
  )
}
