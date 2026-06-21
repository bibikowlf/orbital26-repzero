import { Stack } from 'expo-router'
import { TouchableOpacity, Text } from 'react-native'
import { useRouter } from 'expo-router'

export default function CommunityLayout() {
  const router = useRouter()

  return (
    <Stack>
      <Stack.Screen
        name="events"
        options={{
          title: 'Community',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/(community)/my-events')}
              style={{ marginRight: 16 }}
            >
              <Text style={{ color: '#007AFF', fontWeight: '600', fontSize: 15 }}>My Events</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="my-events" options={{ title: 'My Events' }} />
      <Stack.Screen name="my-event-detail" options={{ title: 'Event Details' }} />
      <Stack.Screen name="event-detail" options={{ title: 'Event Details' }} />
      <Stack.Screen name="create-event" options={{ title: 'Create Event' }} />
    </Stack>
  )
}