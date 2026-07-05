import { Stack } from 'expo-router'
import SettingsButton from '../../../components/settings-button'

export default function PlanLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, 
        headerTitleAlign: 'center', 
        headerBackVisible: false,
        headerLeftContainerStyle: { paddingLeft: 16 } }}
    >
      <Stack.Screen name='index' />
      <Stack.Screen name='generate-plan' 
        options={{ title: 'Plan', headerLeft: () => <SettingsButton /> }}
      />
    </Stack>
  )
}