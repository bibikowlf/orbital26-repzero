import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useAuthContext } from '../../hooks/auth-context'
import { appStyles } from '../../styles/styles'

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

export default function EventDetail() {
  const { id } = useLocalSearchParams()
  const { claims } = useAuthContext()
  const userId = claims?.sub

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rsvping, setRsvping] = useState(false)

  useEffect(() => {
    if (userId && id) fetchEvent()
  }, [userId, id])

  async function fetchEvent() {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        profiles(username),
        event_rsvps(count),
        user_rsvp:event_rsvps(status)
      `)
      .eq('user_rsvp.user_id', userId)
      .eq('id', id)
      .single()

    if (error) {
      console.error(error)
      Alert.alert('Error', 'Could not load event.')
    } else {
      setEvent(data)
    }
    setLoading(false)
  }

  async function handleRsvp() {
    if (!event) return
    setRsvping(true)
    const isGoing = event.user_rsvp?.[0]?.status === 'going'

    if (isGoing) {
      const { error } = await supabase
        .from('event_rsvps')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', userId)
      if (error) Alert.alert('Error', error.message)
    } else {
      const { error } = await supabase
        .from('event_rsvps')
        .upsert(
          { event_id: event.id, user_id: userId, status: 'going' },
          { onConflict: 'event_id,user_id' }
        )
      if (error) Alert.alert('Error', error.message)
    }

    await fetchEvent()
    setRsvping(false)
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
  const rsvpCount = event.event_rsvps?.[0]?.count ?? 0
  const spotsLeft = event.max_attendees ? event.max_attendees - rsvpCount : null
  const isGoing = event.user_rsvp?.[0]?.status === 'going'
  const isFull = spotsLeft !== null && spotsLeft <= 0 && !isGoing
  const isCreator = event.creator_id === userId

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ padding: 20 }}>

      <View style={[appStyles.categoryBadge, { backgroundColor: CATEGORY_COLORS[event.category] || CATEGORY_COLORS.default }]}>
        <Text style={appStyles.categoryText}>{event.category}</Text>
      </View>
      <Text style={appStyles.title}>{event.title}</Text>

      <Text style={appStyles.host}>Hosted by @{event.profiles?.username}</Text>

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
            {rsvpCount} going
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

      {!isCreator && (
        <TouchableOpacity
          style={[appStyles.rsvpButton, isGoing && appStyles.rsvpButtonActive, isFull && appStyles.rsvpButtonDisabled]}
          onPress={handleRsvp}
          disabled={rsvping || isFull}
        >
          <Text style={[appStyles.rsvpButtonText, isGoing && appStyles.rsvpButtonTextActive]}>
            {rsvping ? 'Updating...' : isGoing ? '✓ You\'re Going — Cancel RSVP' : isFull ? 'Event Full' : 'RSVP to this Event'}
          </Text>
        </TouchableOpacity>
      )}

      {isCreator && (
        <View style={appStyles.creatorBadge}>
          <Text style={appStyles.creatorBadgeText}>You created this event</Text>
        </View>
      )}

    </ScrollView>
  )
}