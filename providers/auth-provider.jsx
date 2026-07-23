import { Alert } from 'react-native'
import { AuthContext } from '../hooks/auth-context'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

export default function AuthProvider({ children }) {
  const [claims, setClaims] = useState()
  const [profile, setProfile] = useState(undefined)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = async () => {
    if (!claims) {
      setProfile(null)
      return
    }

    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', claims.sub)
        .single()

      if (error) throw error
      if (data) setProfile(data)
    } catch (error) {
      if (error instanceof Error) Alert.alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(async () => {
        console.log('Auth state changed:', { event: _event })
        setIsLoading(true)

        if (session) {
          const { data } = await supabase.auth.getClaims()
          const newClaims = data?.claims ?? undefined
          setClaims(newClaims)

          if (newClaims) {
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newClaims.sub)
              .single()
            setProfile(data ?? undefined)
          }
        } else {
          setClaims(undefined)
          setProfile(undefined)
        }

        setIsLoading(false)        
      }, 0)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        claims,
        isLoading,
        profile,
        isLoggedIn: claims != undefined,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}