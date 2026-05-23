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
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}