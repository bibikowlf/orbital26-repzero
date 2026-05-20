import { AuthContext } from '../hooks/auth-context'
import { supabase } from '../lib/supabase'
import { useEffect, useState } from 'react'

export default function AuthProvider({ children }) {
  const [claims, setClaims] = useState()
  const [profile, setProfile] = useState()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', { event: _event })
      setIsLoading(true)

      if (session) {
        const { data } = await supabase.auth.getClaims()
        setClaims(data?.claims ?? undefined)

        if (claims) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userClaims.sub)
            .single()
          setProfile(data ?? undefined)
        }
      } else {
        setClaims(undefined)
        setProfile(undefined)
      }

      setIsLoading(false)
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
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}