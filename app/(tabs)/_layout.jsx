import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import Entypo from '@expo/vector-icons/Entypo'
import ProfileButton from '../../components/profile-button'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerLeft: () => <ProfileButton />, 
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

      {/* Community Tab */}
      <Tabs.Screen
        name="(community)/events"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => (
            <Entypo name="users" size={24} color={color} />
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

      {/* Profile (No Tab) */}
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', href: null }}
      />

      {/* Change Password (No Tab) */}
      <Tabs.Screen
        name="change-password"
        options={{ title: 'Change Password', href: null }}
      />

      {/* Workout Tutorials (No Tab) */}
      <Tabs.Screen
        name="(workouts)/[id]"
        options={{ href: null }}
      />

      {/* Edit Workout Tutorial (No Tab) */}
      <Tabs.Screen
        name="(workouts)/edit-tutorial"
        options={{ href: null }}
      />

      {/* Leaderboard (Temporary Tab) */}
      <Tabs.Screen
        name="(community)/leaderboard"
        options={{ title: 'Leaderboard' }}
      />
    </Tabs>
  );
}