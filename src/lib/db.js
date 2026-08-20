/**
 * Tiny client-side "database" persisted to localStorage.
 * The service layer (src/services) is the only consumer — replace those
 * services with real HTTP calls to move to a production backend.
 */
import { buildSeed } from '@/data/seed'

const KEY = 'alnain_db'
const SEED_VERSION = 4
let cache = null
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

export function getDB() {
  if (!cache) {
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
  }
  return cache
}

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache))
  } catch (e) {
    console.warn('Could not persist store data (quota?)', e)
  }
}

/** Persist + notify subscribers (contexts that mirror db state). */
export function commit() {
  persist()
  notify()
}

export function resetDB() {
  cache = buildSeed()
  persist()
  notify()
}
