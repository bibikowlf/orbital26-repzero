import { Stack, useSegments, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SplashScreenController } from '../components/splashscreen-controller'
import { useAuthContext } from '../hooks/auth-context'
import AuthProvider from '../providers/auth-provider'
import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { appStyles } from '../styles/styles'
import BackButton from '../components/back-button'

function RootNavigator() {
  const styles = appStyles
  const { profile, isLoading, isLoggedIn } = useAuthContext()
  const segments = useSegments()

  useEffect(() => {
    if (isLoading) return

    const inLogin = segments.includes('login')
    const inProfile = segments.includes('profile')
    const username = profile?.username
    const hasUsername = username != undefined && username.trim() != ''

    if (!isLoggedIn) {
      if (!inLogin) setTimeout(() => router.replace('/login'), 0)
    } else {
      if (!inProfile) {
        if (!hasUsername) {
          setTimeout(() => router.replace('/profile'), 0)
        } else if (inLogin) {
          setTimeout(() => router.replace('/'), 0)
        }
      }
    }
  }, [isLoading, isLoggedIn, profile?.username, segments])

  if (isLoading) {
    return (
      <View style={[styles.container, { flex: 1, backgroundColor: '#F2F2F2', padding: 16}]}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }
  return (
    <Stack screenOptions={{ headerShown: true, 
      headerTitleAlign: 'center',
      headerBackVisible: false,
      headerLeftContainerStyle: { paddingLeft: 16 } }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen
          name="notifications"
          options={{
            title: 'Notifications',
            headerLeft: () => <BackButton />
          }}
        />
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
