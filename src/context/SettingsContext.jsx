import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { subscribe } from '@/lib/db'
import { getSettings } from '@/services/settings'
import { getSocialLinks } from '@/services/marketing'

const SettingsContext = createContext(null)

export function useSettings() {
  return useContext(SettingsContext)
}

/** Live store settings + active social links; re-renders on any db commit. */
export function SettingsProvider({ children }) {
  const [version, setVersion] = useState(0)

  useEffect(() => subscribe(() => setVersion((v) => v + 1)), [])

  const value = useMemo(
    () => ({
      settings: getSettings(),
      socials: getSocialLinks({ activeOnly: true }),
      dbVersion: version,
    }),
    [version]
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
