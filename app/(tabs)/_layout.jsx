import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import Entypo from '@expo/vector-icons/Entypo';
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
      {/* Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Entypo name='home' size={24} color={color} />
          ),
        }}
      />

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

      {/* Exercise Log Tab */}
      <Tabs.Screen
        name="exercise-log"
        options={{
          title: 'Exercise Log',
          tabBarIcon: ({ color }) => (
            <Ionicons name='journal' size={24} color={color} />
          ),
        }}
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
    </Tabs>
  );
}