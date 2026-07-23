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
  const { claims, isLoading, isLoggedIn } = useAuthContext()
  const segments = useSegments()
  const username = claims?.user_metadata?.username

  useEffect(() => {
    if (isLoading) return

    const inLogin = segments.includes('login')
    const inProfile = segments.includes('profile')

    if (!inLogin && !isLoggedIn) {
      router.replace('/login')
    } else if ((!username || username.trim() === '') && !inProfile) {
      router.replace('/profile')
    } else if (inLogin && isLoggedIn) {
      router.replace('/')
    }
  }, [username, isLoading, isLoggedIn])

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
