import { Truck } from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'

export default function AnnouncementBar() {
  const { settings } = useSettings()
  const text = settings?.general?.announcement
  if (!text) return null
  return (
    <div className="bg-gold-500 px-4 py-2 text-center">
      <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink">
        <Truck size={13} className="hidden sm:block" />
        {text}
      </p>
    </div>
  )
}
