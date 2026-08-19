import { Star } from 'lucide-react'
import { cn } from '@/lib/format'

export default function RatingStars({ value = 0, size = 14, showValue = false, className = '' }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.min(Math.max(value - (i - 1), 0), 1)
        return (
          <span key={i} className="relative inline-flex" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-beige" fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="text-gold-500" fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        )
      })}
      {showValue && <span className="ml-1.5 text-xs font-medium text-smoke">{Number(value).toFixed(1)}</span>}
    </span>
  )
}
