import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { subscribe } from '@/lib/db'
import * as authSvc from '@/services/auth'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authSvc.currentUser())

  // stay in sync with snapshot refreshes (live mode)
  useEffect(() => subscribe(() => setUser(authSvc.currentUser())), [])

  const login = useCallback(async (email, password) => {
    const u = await authSvc.login(email, password)
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (payload) => {
    const u = await authSvc.register(payload)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(async () => {
    await authSvc.logout()
    setUser(null)
  }, [])

  const refresh = useCallback(() => setUser(authSvc.currentUser()), [])

  const value = useMemo(
    () => ({ user, isAdmin: user?.role === 'admin', login, register, logout, refresh }),
    [user, login, register, logout, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
