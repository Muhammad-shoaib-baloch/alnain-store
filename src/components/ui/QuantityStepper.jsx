import { Minus, Plus } from 'lucide-react'
import { clamp, cn } from '@/lib/format'

export default function QuantityStepper({ value, onChange, min = 1, max = 99, small = false, className = '' }) {
  const set = (n) => onChange(clamp(n, min, max))
  const btn = cn(
    'flex items-center justify-center text-smoke transition-colors hover:text-ink disabled:opacity-30',
    small ? 'h-8 w-8' : 'h-11 w-10'
  )
  return (
    <div className={cn('inline-flex items-center border border-ink/20 bg-white', className)}>
      <button type="button" className={btn} onClick={() => set(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <Minus size={14} />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => set(Number(e.target.value) || min)}
        className={cn('w-10 border-x border-ink/10 bg-transparent text-center text-sm font-medium outline-none', small ? 'h-8' : 'h-11')}
        aria-label="Quantity"
      />
      <button type="button" className={btn} onClick={() => set(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Plus size={14} />
      </button>
    </div>
  )
}
