import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import Entypo from '@expo/vector-icons/Entypo'
import SettingsButton from '../../components/settings-button'

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
      {/* Exercise Plan Tab */}
      <Tabs.Screen
        name="generate-plan"
        options={{
          title: 'Plan',
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
          title: 'Log',
          tabBarIcon: ({ color }) => (
            <Entypo name="calendar" size={24} color={color} />
          ),
        }}
      />

      {/* Workout Tutorial Tab */}
      <Tabs.Screen
        name="workout-tutorial"
        options={{
          title: 'Tutorial',
          tabBarIcon: ({ color }) => (
            <Entypo name='book' size={24} color={color} />
          ),
        }}
      />

      {/* Discussion Tab */}
      <Tabs.Screen
        name="discussion-forum"
        options={{
          title: 'Discussion',
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubbles-outline" size={24} color={color} />
          ),
        }}
      />

      {/* Events Tab */}
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}