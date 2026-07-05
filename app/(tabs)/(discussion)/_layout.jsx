import { Stack } from 'expo-router'
import SettingsButton from '../../../components/settings-button'
import BackButton from '../../../components/back-button'

export default function DiscussionLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, 
        headerTitleAlign: 'center',
        headerBackVisible: false,
        headerLeftContainerStyle: { paddingLeft: 16 } }}
    >
      <Stack.Screen name='index' />
      <Stack.Screen name='discussion-forum' 
        options={{ title: 'Discussion', headerLeft: () => <SettingsButton /> }}
      />
      <Stack.Screen name='add-post' 
        options={{ title: 'Add Post', headerLeft: () => <BackButton /> }}
      />
      <Stack.Screen name='post' 
        options={{ title: 'Discussion', headerLeft: () => <BackButton /> }}
      />
    </Stack>
  )
}