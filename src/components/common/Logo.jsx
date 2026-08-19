import { useSettings } from '@/context/SettingsContext'
import { cn } from '@/lib/format'

const SIZES = {
  sm: { img: 'h-9', arabic: 'text-xl', latin: 'text-[6px] tracking-[0.4em]' },
  md: { img: 'h-11', arabic: 'text-[26px]', latin: 'text-[7px] tracking-[0.45em]' },
  lg: { img: 'h-16', arabic: 'text-4xl', latin: 'text-[9px] tracking-[0.5em]' },
}

/**
 * Al Nain wordmark.
 * On dark surfaces we use the official logo file (gold + white);
 * on light surfaces a CSS re-creation (gold gradient Arabic + letterspaced Latin)
 * keeps the Latin text legible.
 */
export default function Logo({ size = 'md', onDark = false, className = '' }) {
  const { settings } = useSettings()
  const name = settings?.general?.storeName || 'Al Nain'
  const s = SIZES[size] || SIZES.md

  if (onDark) {
    return <img src="/images/logo.png" alt={name} className={cn('w-auto object-contain', s.img, className)} draggable={false} />
  }

  return (
    <span className={cn('inline-flex flex-col items-center leading-none', className)}>
      <span
        className={cn('font-arabic bg-gradient-to-b from-gold-200 via-gold-500 to-gold-700 bg-clip-text pb-0.5 text-transparent', s.arabic)}
        aria-hidden="true"
      >
        النين
      </span>
      <span className={cn('font-semibold uppercase text-current', s.latin)}>{name}</span>
    </span>
  )
}
