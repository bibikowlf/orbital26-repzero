import { Tabs, useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import Entypo from '@expo/vector-icons/Entypo'
import SettingsButton from '../../components/settings-button'
import { TouchableOpacity, Text } from 'react-native'

/*function MyEventsButton() {
  const router = useRouter()
  return (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/(community)/my-events')}
      style={{ marginRight: 16 }}
    >
      <Text style={{ color: '#007AFF', fontWeight: '600', fontSize: 15 }}>My Events</Text>
    </TouchableOpacity>
  )
}*/

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerLeft: () => <SettingsButton />, 
        headerTitleAlign: 'center',
        headerLeftContainerStyle: {
          paddingLeft: 16,
        },
      }}
    >
      {/* Workout Plan Tab */}
      <Tabs.Screen
        name="generate-plan"
        options={{
          title: 'Workout Plan',
          tabBarIcon: ({ color }) => (
            <Ionicons name='barbell' size={24} color={color} />
          ),
        }}
      />

      {/* Index (No Tab) */}
      <Tabs.Screen
        name="index"
        options={{ href: null }}
      />

      {/* Exercise Log Tab */}
      <Tabs.Screen
        name="exercise-log"
        options={{
          title: 'Exercise Log',
          tabBarIcon: ({ color }) => (
            <Entypo name="calendar" size={24} color={color} />
          ),
        }}
      />

      {/* Workout Tutorial Tab */}
      <Tabs.Screen
        name="workout-tutorial"
        options={{
          title: 'Workout Tutorial',
          tabBarIcon: ({ color }) => (
            <Entypo name='book' size={24} color={color} />
          ),
        }}
      />

      {/* Community Tab 
      <Tabs.Screen
        name="(community)/events"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => (
            <Entypo name="users" size={24} color={color} />
          ),
          headerRight: () => <MyEventsButton />,            
        }}
      />*/}

      {/* Discussion Tab */}
      <Tabs.Screen
        name="(community)/discussion-forum"
        options={{
          title: 'Discussion',
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubbles-outline" size={24} color={color} />
          ),
        }}
      />

      {/* Events Tab */}
      <Tabs.Screen
        name="(community)/events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={24} color={color} />
          ),
        }}
      />

      {/* Leaderboard Tab */}
      <Tabs.Screen
        name="(community)/leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color }) => (
            <Ionicons name="trophy-outline" size={24} color={color} />
          ),
        }}
      />

      {/* Create Event (No Tab) */}
      <Tabs.Screen
        name="(community)/create-event"
        options={{ title: 'Create Event', href: null }}
      />

      {/* Event Details (No Tab) */}
      <Tabs.Screen
        name="(community)/event-detail"
        options={{ title: 'Event Details', href: null }}
      />

      {/* My Events (No Tab) */}
      <Tabs.Screen
        name="(community)/my-events"
        options={{ title: 'My Events', href: null }}
      />

      {/* My Event Detail (No Tab) */}
      <Tabs.Screen
        name="(community)/my-events-detail"
        options={{ title: 'Event Details', href: null }}
      />

      {/* Profile (No Tab) */}
      <Tabs.Screen
        name="(settings)/profile"
        options={{ title: 'Profile', href: null }}
      />

      {/* My Posts (No Tab) */}
      <Tabs.Screen
        name="(settings)/my-posts"
        options={{ title: 'My Posts', href: null }}
      />

      {/* My Tutorials (No Tab) */}
      <Tabs.Screen
        name="(settings)/my-tutorials"
        options={{ title: 'My Tutorials', href: null }}
      />

      {/* Change Password (No Tab) */}
      <Tabs.Screen
        name="change-password"
        options={{ title: 'Change Password', href: null }}
      />

      {/* Workout Tutorials (No Tab) */}
      <Tabs.Screen
        name="tutorial"
        options={{ href: null }}
      />

      {/* Leaderboard (Temporary Tab) 
      <Tabs.Screen
        name="(community)/leaderboard"
        options={{ title: 'Leaderboard' }}
      />*/}

      {/* Discussion Forum (Temporary Tab) 
      <Tabs.Screen
        name="(community)/discussion-forum"
        options={{ title: 'Discussion Forum' }}
      />*/}

      {/* Add Post (No Tab) */}
      <Tabs.Screen
        name="(community)/add-post"
        options={{ href: null }}
      />

      {/* Post (No Tab) */}
      <Tabs.Screen
        name="(community)/post"
        options={{ href: null }}
      />
    </Tabs>
  );
}