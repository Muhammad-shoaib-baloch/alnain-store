import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { setWishlist } from '@/services/auth'

const GUEST_KEY = 'poshaak_wishlist_guest'
const WishlistContext = createContext(null)

export function useWishlist() {
  return useContext(WishlistContext)
}

const readGuest = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) || '[]')
  } catch {
    return []
  }
}

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const [ids, setIds] = useState(readGuest)
  const hydratedFor = useRef(undefined)

  // hydrate on login/logout; merge guest list into the account on login
  useEffect(() => {
    if (hydratedFor.current === (user?.id || null)) return
    hydratedFor.current = user?.id || null
    if (user) {
      const merged = [...new Set([...(user.wishlist || []), ...readGuest()])]
      setIds(merged)
      setWishlist(user.id, merged)
      localStorage.removeItem(GUEST_KEY)
    } else {
      setIds(readGuest())
    }
  }, [user])

  const persist = useCallback(
    (next) => {
      if (user) setWishlist(user.id, next)
      else localStorage.setItem(GUEST_KEY, JSON.stringify(next))
    },
    [user]
  )

  const toggle = useCallback(
    (productId) => {
      let added = false
      setIds((prev) => {
        const has = prev.includes(productId)
        added = !has
        const next = has ? prev.filter((id) => id !== productId) : [...prev, productId]
        persist(next)
        return next
      })
      return added
    },
    [persist]
  )

  const remove = useCallback(
    (productId) => {
      setIds((prev) => {
        const next = prev.filter((id) => id !== productId)
        persist(next)
        return next
      })
    },
    [persist]
  )

  const value = useMemo(
    () => ({ ids, count: ids.length, has: (id) => ids.includes(id), toggle, remove }),
    [ids, toggle, remove]
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}
