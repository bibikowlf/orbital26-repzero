import { createContext, useContext } from 'react'

export const AuthContext = createContext({
  claims: undefined,
  profile: undefined,
  isLoading: true,
  isLoggedIn: false,
  refreshProfile: () => { return }
})

export const useAuthContext = () => useContext(AuthContext)