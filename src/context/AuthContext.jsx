import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import * as authSvc from '@/services/auth'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authSvc.currentUser())

  const login = useCallback((email, password) => {
    const u = authSvc.login(email, password)
    setUser(u)
    return u
  }, [])

  const register = useCallback((payload) => {
    const u = authSvc.register(payload)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    authSvc.logout()
    setUser(null)
  }, [])

  const refresh = useCallback(() => setUser(authSvc.currentUser()), [])

  const value = useMemo(
    () => ({ user, isAdmin: user?.role === 'admin', login, register, logout, refresh }),
    [user, login, register, logout, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
