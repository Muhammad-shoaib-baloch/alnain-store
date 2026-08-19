import { getDB, commit } from '@/lib/db'

export function getSettings() {
  return getDB().settings
}

/** Shallow-merges each top-level section; arrays are replaced wholesale. */
export function saveSettings(patch) {
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
