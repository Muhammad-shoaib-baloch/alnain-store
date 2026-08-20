/**
 * Data layer with two modes:
 *  - LIVE: hydrated from the Al Nain API (/api/snapshot). Reads stay synchronous
 *    against the in-memory cache; writes go through src/services → API → rehydrate.
 *  - DEMO: the API is unreachable (e.g. local dev without the PHP server) —
 *    falls back to the seeded localStorage database with full local behavior.
 */
import { buildSeed } from '@/data/seed'
import { api } from './api'

const KEY = 'alnain_db'
const SEED_VERSION = 4

let cache = null
let live = false
const listeners = new Set()

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function notify() {
  listeners.forEach((fn) => {
    try {
      fn()
    } catch (e) {
      console.error(e)
    }
  })
}

export function isLive() {
  return live
}

function fromSnapshot(snap) {
  return {
    version: SEED_VERSION,
    live: true,
    settings: snap.settings || {},
    products: snap.products || [],
    categories: snap.categories || [],
    collections: snap.collections || [],
    banners: snap.banners || [],
    socialLinks: snap.socialLinks || [],
    testimonials: snap.testimonials || [],
    reviews: snap.reviews || [],
    coupons: snap.coupons || [],
    users: snap.users || [],
    orders: (snap.orders?.length ? snap.orders : snap.myOrders) || [],
    messages: snap.messages || [],
    newsletter: snap.newsletter || [],
    me: snap.me || null,
    meta: {},
  }
}

/** Boot: try the API; fall back to the local demo database. */
export async function initDB() {
  try {
    const snap = await api('/snapshot', { timeout: 8000 })
    if (!snap || snap.live !== true) throw new Error('bad snapshot')
    cache = fromSnapshot(snap)
    live = true
    return
  } catch (e) {
    console.warn('[alnain] API unreachable — running in local demo mode.', e?.message || e)
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.version === SEED_VERSION) cache = parsed
    }
  } catch {
    cache = null
  }
  if (!cache) {
    cache = buildSeed()
    persist()
  }
  live = false
}

/** Re-fetches the snapshot after a successful write (live mode). */
export async function rehydrate() {
  if (!live) {
    notify()
    return
  }
  try {
    const snap = await api('/snapshot')
    const me = cache?.me
    cache = fromSnapshot(snap)
    if (!cache.me && me && !localStorage.getItem('alnain_token')) cache.me = null
  } catch (e) {
    console.warn('[alnain] snapshot refresh failed', e?.message || e)
  }
  notify()
}

export function getDB() {
  if (!cache) {
    cache = buildSeed()
    live = false
  }
  return cache
}

export function persist() {
  if (live) return
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch (e) {
    console.warn('Could not persist store data (quota?)', e)
  }
}

/** Persist (demo only) + notify subscribers. */
export function commit() {
  persist()
  notify()
}

/** Demo-mode reset (live reset goes through the admin API). */
export function resetDB() {
  cache = buildSeed()
  live = false
  persist()
  notify()
}
