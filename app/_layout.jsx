import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SplashScreenController } from '../components/splashscreen-controller'
import { useAuthContext } from '../hooks/auth-context'
import AuthProvider from '../providers/auth-provider'

// Separate RootNavigator so we can access the AuthContext
function RootNavigator() {
  const { isLoggedIn } = useAuthContext()
  return (
    <Stack>
      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="index" options={{ title: "Home" }}/>
      </Stack.Protected>
      <Stack.Screen name="(auth)/login" options={{ title: "Login" }} />
    </Stack>
  )
}
export default function RootLayout() {
  return (
    <AuthProvider>
      <SplashScreenController />
      <RootNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  )
}