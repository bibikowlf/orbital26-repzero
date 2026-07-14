import { Stack } from 'expo-router'
import SettingsButton from '../../../components/settings-button'
import BackButton from '../../../components/back-button'
import NotificationBell from '../../../components/notification-bell'

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, 
        headerTitleAlign: 'center', 
        headerBackVisible: false,
        headerLeftContainerStyle: { paddingLeft: 16 } }}
    >
      <Stack.Screen name='profile' 
        options={{ title: 'Profile', headerLeft: () => <SettingsButton />, headerRight: () => <NotificationBell/>}}
      />
      <Stack.Screen name='my-events' 
        options={{ title: 'My Events', headerLeft: () => <SettingsButton />, headerRight: () => <NotificationBell/>}}
      />
      <Stack.Screen name='my-events-detail' 
        options={{ title: 'Event Details', headerLeft: () => <BackButton />, headerRight: () => <NotificationBell/> }}
      />
      <Stack.Screen name='my-posts' 
        options={{ title: 'My Posts', headerLeft: () => <SettingsButton />, headerRight: () => <NotificationBell/> }}
      />
      <Stack.Screen name='my-posts-detail' 
        options={{ title: 'Discussion', headerLeft: () => <BackButton />, headerRight: () => <NotificationBell/> }}
      />
      <Stack.Screen name='my-tutorials' 
        options={{ title: 'My Tutorials', headerLeft: () => <SettingsButton />, headerRight: () => <NotificationBell/>}}
      />
      <Stack.Screen name='change-password' 
        options={{ title: 'Change Password', headerLeft: () => <BackButton /> }}
      />
    </Stack>
  )
}