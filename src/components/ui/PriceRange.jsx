import { formatPrice } from '@/lib/format'

/** Dual-thumb price range slider (two stacked native range inputs). */
export default function PriceRange({ min, max, value, onChange, step = 500 }) {
  const [lo, hi] = value
  const pct = (n) => ((n - min) / Math.max(max - min, 1)) * 100

  return (
    <div>
      <div className="range-slider relative h-8">
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-beige" />
        <div
          className="absolute top-1/2 h-[3px] -translate-y-1/2 bg-gold-500"
          style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi - step), hi])}
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + step)])}
          aria-label="Maximum price"
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-xs font-medium text-ink">
        <span>{formatPrice(lo)}</span>
        <span>{formatPrice(hi)}</span>
      </div>
    </div>
  )
}
