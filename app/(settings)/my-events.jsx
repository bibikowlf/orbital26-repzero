import { useState, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { useRouter, useFocusEffect, Stack } from 'expo-router'
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
  const day = date.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = date.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
  return { day, time }
}

export default function MyEvents() {
  const router = useRouter()
  const { claims } = useAuthContext()
  const userId = claims?.sub
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      if (userId) fetchMyEvents()
    }, [userId])
  )

  async function fetchMyEvents() {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        profiles(username),
        event_rsvps(count)
      `)
      .eq('creator_id', userId)
      .order('event_date', { ascending: true })

    if (error) console.error(error)
    else {
      const normalized = (data || []).map(event => ({
        ...event,
        rsvp_count: event.event_rsvps?.[0]?.count ?? 0,
      }))
      setEvents(normalized)
    }
    setLoading(false)
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Stack.Screen options={{ title: 'My Events', headerBackVisible: false, headerTitleAlign: 'center' }}/>
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>Loading...</Text>
        ) : events.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>
            You haven't created any events yet.
          </Text>
        ) : (
          events.map((event) => {
            const spotsLeft = event.max_attendees ? event.max_attendees - event.rsvp_count : null
            const { day, time } = formatEventDate(event.event_date)
            return (
              <TouchableOpacity
                key={event.id}
                style={appStyles.card}
                onPress={() => router.push({
                  pathname: '/my-events-detail',
                  params: { id: event.id }
                })}
              >
                <View style={appStyles.cardHeader}>
                  <View style={[appStyles.categoryBadge, { backgroundColor: CATEGORY_COLORS[event.category] || CATEGORY_COLORS.default }]}>
                    <Text style={appStyles.categoryText}>{event.category}</Text>
                  </View>
                  {spotsLeft !== null && (
                    <Text style={appStyles.spotsText}>
                      {spotsLeft <= 0 ? 'Full' : `${spotsLeft} spots left`}
                    </Text>
                  )}
                </View>

                <Text style={appStyles.title}>{event.title}</Text>

                <View style={appStyles.metaRow}>
                  <Text style={appStyles.metaText}>📅 {day} · {time}</Text>
                </View>
                <View style={appStyles.metaRow}>
                  <Text style={appStyles.metaText}>📍 {event.location}</Text>
                </View>

                <View style={appStyles.cardFooter}>
                  <Text style={appStyles.hostText}>
                    {event.rsvp_count} going
                    {spotsLeft !== null && ` · ${spotsLeft <= 0 ? 'Full' : `${spotsLeft} spots left`}`}
                  </Text>
                </View>
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}