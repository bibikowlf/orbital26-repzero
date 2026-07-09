import { Stack } from 'expo-router'
import SettingsButton from '../../../components/settings-button'
import BackButton from '../../../components/back-button'

export default function FriendsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, 
        headerTitleAlign: 'center',
        headerBackVisible: false,
        headerLeftContainerStyle: { paddingLeft: 16 } }}
    >
      <Stack.Screen name='index' 
       options={{ title: 'Friends', headerLeft: () => <SettingsButton /> }}
       />
      <Stack.Screen name="search-users" 
        options={{ title: 'Find Friends', headerLeft: () => <BackButton /> }}
      />
      <Stack.Screen name='follow-list' 
        options={({ route }) => ({
          title: route.params?.mode === 'followers' ? 'Followers' : 'Following',
          headerLeft: () => <BackButton />
        })}
      />
      <Stack.Screen name='chat-list' 
        options={{ title: 'Messages', headerLeft: () => <BackButton /> }}
       />
      <Stack.Screen name='chat-thread' 
        options={({ route }) => ({
          title: route.params?.recipientUsername || 'Chat',
          headerLeft: () => <BackButton />
        })}
      />
    </Stack>
  )
}