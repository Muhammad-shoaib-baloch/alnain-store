import { cn } from '@/lib/format'

const TONES = {
  gold: 'bg-gold-500 text-white',
  dark: 'bg-ink text-ivory',
  sale: 'bg-red-600 text-white',
  green: 'bg-emerald-600 text-white',
  cream: 'bg-cream text-ink border border-ink/10',
  outline: 'border border-ivory/60 text-ivory',
}

export default function Badge({ tone = 'dark', className = '', children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]',
        TONES[tone] || TONES.dark,
        className
      )}
    >
      {children}
    </span>
  )
}
