import { Stack } from 'expo-router'
import SettingsButton from '../../../components/settings-button'
import BackButton from '../../../components/back-button'

export default function EventLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, 
        headerTitleAlign: 'center',
        headerBackVisible: false,
        headerLeftContainerStyle: { paddingLeft: 16 } }}
    >
      <Stack.Screen name='index' />
      <Stack.Screen name='events' 
        options={{ title: 'Events', headerLeft: () => <SettingsButton /> }}
      />
      <Stack.Screen name='create-event' 
        options={{ title: 'Create Event', headerLeft: () => <BackButton /> }}
      />
      <Stack.Screen name='event-detail' 
        options={{ title: 'Event Details', headerLeft: () => <BackButton /> }}
      />
      <Stack.Screen name='follow-list' 
        options={({ route }) => ({
          title: route.params?.mode === 'followers' ? 'Followers' : 'Following',
          headerLeft: () => <BackButton />
        })}
      />
    </Stack>
  )
}