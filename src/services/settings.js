import { getDB, commit, isLive, rehydrate, resetDB } from '@/lib/db'
import { api } from '@/lib/api'

export function getSettings() {
  return getDB().settings
}

/** Shallow-merges each top-level section; arrays are replaced wholesale. */
export async function saveSettings(patch) {
  if (isLive()) {
    await api('/admin/settings', { method: 'PUT', body: patch })
    await rehydrate()
    return getDB().settings
  }
  const db = getDB()
  for (const key of Object.keys(patch)) {
    const value = patch[key]
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      db.settings[key] = { ...db.settings[key], ...value }
    } else {
      db.settings[key] = value
    }
  }
  commit()
  return db.settings
}

/** Restores the original demo catalogue (server-side when live). */
export async function resetStore() {
  if (isLive()) {
    await api('/admin/reset', { method: 'POST' })
    await rehydrate()
    return
  }
  resetDB()
}
