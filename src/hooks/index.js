import { useCallback, useEffect, useRef, useState } from 'react'
import { getSettings } from '@/services/settings'

/**
 * Runs a (currently synchronous) data-layer fetcher with a short simulated
 * latency so loading skeletons render — mirrors how a real API would behave.
 * `refresh()` re-runs the fetcher instantly (used after mutations).
 */
export function useMockFetch(fetcher, deps = [], delay = 250) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const run = useCallback((withDelay) => {
    setLoading(true)
    const timer = setTimeout(() => {
      try {
        setData(fetcherRef.current())
      } catch (e) {
        console.error(e)
        setData(null)
      }
      setLoading(false)
    }, withDelay)
    return () => clearTimeout(timer)
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => run(delay), deps)

  const refresh = useCallback(() => run(0), [run])
  return { data, loading, refresh }
}

export function usePageTitle(title) {
  useEffect(() => {
    const site = getSettings()?.seo?.siteTitle || 'Al Nain'
    document.title = title ? `${title} · ${site}` : site
  }, [title])
}

export function useDebounce(value, ms = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

/** Locks body scroll while `active` (drawers, modals, overlays). */
export function useLockBodyScroll(active) {
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [active])
}

/** Recently-viewed product ids (localStorage). */
export function useRecentlyViewed(productId) {
  const KEY = 'poshaak_recent'
  useEffect(() => {
    if (!productId) return
    try {
      const list = JSON.parse(localStorage.getItem(KEY) || '[]').filter((id) => id !== productId)
      list.unshift(productId)
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, 10)))
    } catch {
      /* ignore */
    }
  }, [productId])
}

export function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem('poshaak_recent') || '[]')
  } catch {
    return []
  }
}
