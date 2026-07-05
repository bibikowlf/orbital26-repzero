import { Stack } from 'expo-router'
import SettingsButton from '../../../components/settings-button'

export default function LogLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, 
        headerTitleAlign: 'center', 
        headerBackVisible: false,
        headerLeftContainerStyle: { paddingLeft: 16 } }}
    >
      <Stack.Screen name='index' />
      <Stack.Screen name='exercise-log' 
        options={{ title: 'Log', headerLeft: () => <SettingsButton /> }}
      />
    </Stack>
  )
}