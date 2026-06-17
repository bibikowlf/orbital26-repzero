import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { appStyles } from '../../../styles/styles'
import { supabase } from '../../../lib/supabase'
import { useAuthContext } from '../../../hooks/auth-context'

const MOCK_EVENTS = [
  {
    id: '1',
    title: 'Morning Run at East Coast Park',
    description: '5k along the beach',
    location: 'ECP, Singapore',
    event_date: '2025-06-20T07:00:00+08:00',
    category: 'Cardio',
    max_attendees: 20,
    creator_username: 'test1',
    rsvp_count: 5,
    user_rsvp: null,
  },
  {
    id: '2',
    title: 'Push Day @ Gym',
    description: 'push day',
    location: 'Yio Chu Kang Sports Centre',
    event_date: '2025-06-22T10:00:00+08:00',
    category: 'Strength',
    max_attendees: 6,
    creator_username: 'test2',
    rsvp_count: 3,
    user_rsvp: 'going',
  },
  {
    id: '3',
    title: 'Yoga in the Park',
    description: 'friendly yoga',
    location: 'Botanic Gardens',
    event_date: '2025-06-25T08:00:00+08:00',
    category: 'Flexibility',
    max_attendees: 15,
    creator_username: 'test3',
    rsvp_count: 8,
    user_rsvp: null,
  },
]

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

export default function Events() {
  const router = useRouter()
  
  const { claims } = useAuthContext()
  const userId = claims?.sub
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) fetchEvents()
  }, [userId])

  async function fetchEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*, profiles(username)')
      .order('event_date', { ascending: true })

    if (error) console.error(error)
    else setEvents(data || [])
    setLoading(false)
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>
            Loading...
          </Text>
        ) : events.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>
            No events yet. Be the first one to post!
          </Text>
        ) : (
          events.map((event) => {

            const spotsLeft = event.max_attendees ? event.max_attendees - event.rsvp_count : null;
            const { day, time } = formatEventDate(event.event_date);
            
            return (
              <TouchableOpacity
                key={event.id}
                style={appStyles.card}
                onPress={() => router.push({ 
                  pathname: '/(tabs)/(community)/event-detail', 
                  params: { id: event.id } 
                })}
              >
                <View style={appStyles.cardHeader }>
                  <View style={[appStyles.categoryBadge, { backgroundColor: CATEGORY_COLORS[event.category] || CATEGORY_COLORS.default }]}>
                    <Text style={appStyles.categoryText}>{event.category}</Text>
                  </View>
                  
                  {spotsLeft !== null && (
                    <Text style={ appStyles.spotsText }>
                      {spotsLeft <= 0 ? 'Full' : `${spotsLeft} spots left`}
                    </Text>
                  )}
                </View>

                <Text style={appStyles.title}>{event.title}</Text>
                <Text style={appStyles.description} numberOfLines={2}>{event.description}</Text>

                <View style={appStyles.metaRow}>
                  <Text style={appStyles.metaText}>📅 {day} · {time}</Text>
                  </View>
                  <View style={appStyles.metaRow}>
                    <Text style={appStyles.metaText}>📍 {event.location}</Text>
                    </View>

                <View style={appStyles.cardFooter}>
                  <Text style={appStyles.hostText}>
                    by @{event.creator_username} · {event.rsvp_count} going
                  </Text>

                  <TouchableOpacity style={[appStyles.rsvpBadge, event.user_rsvp === 'going' && appStyles.rsvpBadgeActive]}>
                    <Text style={[appStyles.rsvpBadgeText, event.user_rsvp === 'going' && appStyles.rsvpBadgeTextActive]}>
                      {event.user_rsvp === 'going' ? '✓ Going' : 'RSVP'}
                    </Text>
                  </TouchableOpacity>
                </View> 
              </TouchableOpacity> 
            )
          })
        )}
    </ScrollView>

      <TouchableOpacity
        style={appStyles.fab}
        onPress={() => router.push('/(tabs)/(community)/create-event')}
      >
        <Text>+</Text>
      </TouchableOpacity>
    </View>
  )
}