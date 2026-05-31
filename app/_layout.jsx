import { Stack, useSegments, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SplashScreenController } from '../components/splashscreen-controller'
import { useAuthContext } from '../hooks/auth-context'
import AuthProvider from '../providers/auth-provider'
import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { appStyles } from '../styles/styles'

function RootNavigator() {
  const styles = appStyles
  const { isLoading, isLoggedIn } = useAuthContext()
  const segments = useSegments()

  useEffect(() => {
    if (isLoading) {
      return
    }

    const inLogin = segments.length > 0 && segments[0] === 'login'
    if (inLogin && isLoggedIn) {
      router.replace('/')
    } else if (!inLogin && !isLoggedIn) {
      router.replace('/login')
    }
  }, [segments, isLoading, isLoggedIn])

  if (isLoading) {
    return (
      <View style={[styles.container, { flex: 1, backgroundColor: '#F2F2F2'}]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
      <Stack.Screen name="login" options={{ title: "Login", headerBackVisible: false, headerTitleAlign: 'center' }}/>
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
