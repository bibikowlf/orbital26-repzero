import { useEffect } from 'react'
import { useAuthContext } from '../hooks/auth-context'
import { SplashScreen } from 'expo-router'

SplashScreen.preventAutoHideAsync().catch(() => {})

export function SplashScreenController() {
  const { isLoading } = useAuthContext()

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [isLoading])

  return null
}