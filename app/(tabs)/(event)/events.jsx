import { useState, useCallback, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { appStyles } from '../../../styles/styles'
import { supabase } from '../../../lib/supabase'
import { useAuthContext } from '../../../hooks/auth-context'
import { createNotification } from '../../../lib/notifications'

const CATEGORY_COLORS = {
  Cardio: '#FF9500',
  Strength: '#5856D6',
  Flexibility: '#cb21d4',
  Social: '#34C759',
  default: '#0048ff',
}

const CATEGORIES = ['All', 'Cardio', 'Strength', 'Flexibility', 'Social']
const SORT_OPTIONS = [
  { label: 'Date ↑', value: 'date_asc' },
  { label: 'Date ↓', value: 'date_desc' },
]

export function formatEventDate(dateStr) {
  const date = new Date(dateStr)
  const day = date.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = date.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
  return { day, time }
}

export function filterEvents(events, activeTab, selectedCategory, sortBy) {
  return events
    .filter(e => activeTab === 'Going' ? e.user_rsvp?.[0]?.status === 'going' : true)
    .filter(e => selectedCategory === 'All' || e.category === selectedCategory)
    .sort((a, b) => {
      const da = new Date(a.event_date)
      const db = new Date(b.event_date)
      return sortBy === 'date_asc' ? da - db : db - da
    })
}

export default function Events() {
  const router = useRouter()
  const { claims } = useAuthContext()
  const userId = claims?.sub

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('date_asc')
  const [activeTab, setActiveTab] = useState('All Events')
  const [myUsername, setMyUsername] = useState('')

  useFocusEffect(
    useCallback(() => {
      if (userId) fetchEvents()
    }, [userId])
  )

  useEffect(() => {
    if (userId) fetchMyUsername()
  }, [userId])

  async function fetchMyUsername() {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single()

    if (!error && data) 
      setMyUsername(data.username)
  }

  async function handleRsvp(event) {
    if (event.user_rsvp?.[0]?.status === 'going') {
      const { error } = await supabase
        .from('event_rsvps')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', userId)
      if (error) 
        return Alert.alert('Error', error.message)
    } else {
      const { error } = await supabase
        .from('event_rsvps')
        .upsert(
          { event_id: event.id, user_id: userId, status: 'going' },
          { onConflict: 'event_id,user_id' }
        )
      if (error) 
        return Alert.alert('Error', error.message)

      createNotification({
        userId: event.creator_id,
        actorId: userId,
        type: 'event_rsvp_going',
        message: `@${myUsername} is going to ${event.title}`,
        referenceId: event.id,
      })
    }
    fetchEvents()
  }

  async function fetchEvents() {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        profiles(username),
        event_rsvps(count),
        user_rsvp:event_rsvps(status)
      `)
      .eq('user_rsvp.user_id', userId)
      .neq('creator_id', userId)
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

  const filteredEvents = filterEvents(events, activeTab, selectedCategory, sortBy)

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>

      <View style={{ borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>

        <View style={{ flexDirection: 'row', margin: 12, backgroundColor: '#f2f2f2', borderRadius: 10, padding: 3 }}>
          {['All Events', 'Going'].map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 8,
                alignItems: 'center',
                backgroundColor: activeTab === tab ? '#fff' : 'transparent',
                elevation: activeTab === tab ? 2 : 0,
              }}
            >
              <Text style={{ fontWeight: '600', fontSize: 14, color: activeTab === tab ? '#000' : '#888' }}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 6, gap: 8 }}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: selectedCategory === cat
                  ? (CATEGORY_COLORS[cat] || '#0048ff')
                  : '#f2f2f2',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: selectedCategory === cat ? '#fff' : '#444' }}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 8 }}
        >
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setSortBy(opt.value)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: sortBy === opt.value ? '#333' : '#f2f2f2',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: sortBy === opt.value ? '#fff' : '#444' }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>Loading...</Text>
        ) : filteredEvents.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: '#888' }}>
            {activeTab === 'Going'
              ? "You haven't RSVP'd to any events yet."
              : selectedCategory === 'All'
              ? 'No events yet. Be the first to post!'
              : `No ${selectedCategory} events found.`}
          </Text>
        ) : (
          filteredEvents.map((event) => {
            const spotsLeft = event.max_attendees ? event.max_attendees - event.rsvp_count : null
            const { day, time } = formatEventDate(event.event_date)

            return (
              <TouchableOpacity
                key={event.id}
                style={appStyles.card}
                onPress={() => router.push({
                  pathname: '/event-detail',
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
                <Text style={appStyles.description} numberOfLines={2}>{event.description}</Text>

                <View style={appStyles.metaRow}>
                  <Text style={appStyles.metaText}>📅 {day} · {time}</Text>
                </View>
                <View style={appStyles.metaRow}>
                  <Text style={appStyles.metaText}>📍 {event.location}</Text>
                </View>

                <View style={appStyles.cardFooter}>
                  <Text style={appStyles.hostText}>
                    by @{event.profiles?.username} · {event.rsvp_count} going
                  </Text>
                  <TouchableOpacity
                    style={[appStyles.rsvpBadge, event.user_rsvp?.[0]?.status === 'going' && appStyles.rsvpBadgeActive]}
                    onPress={() => handleRsvp(event)}
                  >
                    <Text style={[appStyles.rsvpBadgeText, event.user_rsvp?.[0]?.status === 'going' && appStyles.rsvpBadgeTextActive]}>
                      {event.user_rsvp?.[0]?.status === 'going' ? '✓ Going' : 'RSVP'}
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
        onPress={() => router.push('/create-event')}
      >
        <Text>+</Text>
      </TouchableOpacity>
    </View>
  )
}