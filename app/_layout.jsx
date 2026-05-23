import { Stack, useSegments, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SplashScreenController } from '../components/splashscreen-controller'
import { useAuthContext } from '../hooks/auth-context'
import AuthProvider from '../providers/auth-provider'
import { useEffect } from 'react'
import LoadingScreen from '../components/loading-screen'

// add protected pages as children under <Stack.Protected guard={isLoggedIn} /> 
function RootNavigator() {
  const { isLoading, isLoggedIn } = useAuthContext()
  const segments = useSegments()

  useEffect(() => {
    if (isLoading) {
      return
    }

    const inLogin =  segments.length > 1 && segments[0] === '(auth)' && segments[1] === 'login'
    if (inLogin && isLoggedIn) {
      router.replace('/')
    } else if (!inLogin && !isLoggedIn) {
      router.replace('/login')
    }
  }, [segments, isLoading, isLoggedIn])

  if (isLoading) {
    return <LoadingScreen />
  }
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Home" }}/>
      <Stack.Screen name="(auth)/profile" options={{ title: "Profile" }}/>
      <Stack.Screen name="(auth)/change-password" options={{ title: "Change Password" }}/>
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
