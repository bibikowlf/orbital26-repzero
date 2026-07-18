import { Stack } from 'expo-router'
import SettingsButton from '../../../components/settings-button'
import BackButton from '../../../components/back-button'
import NotificationBell from '../../../components/notification-bell'

export default function TutorialLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, 
        headerTitleAlign: 'center',
        headerBackVisible: false,
        headerLeftContainerStyle: { paddingLeft: 16 } }}
    >
      <Stack.Screen name='index' />
      <Stack.Screen name='workout-tutorial' 
        options={{ title: 'Tutorial', headerLeft: () => <SettingsButton /> }}
      />
      <Stack.Screen name='tutorial' 
        options={{ headerLeft: () => <BackButton /> }}
      />
    </Stack>
  )
}