import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/format'

export default function SectionHeading({ eyebrow, title, sub, action, center = false, light = false, className = '' }) {
  return (
    <div className={cn('mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10', center && 'flex-col items-center text-center', className)}>
      <div className={cn('max-w-xl', center && 'mx-auto')}>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className={cn('font-display text-2xl leading-tight sm:text-3xl md:text-4xl text-balance', light ? 'text-ivory' : 'text-ink')}>
          {title}
        </h2>
        {sub && <p className={cn('mt-3 text-sm leading-relaxed', light ? 'text-ivory/70' : 'text-smoke')}>{sub}</p>}
      </div>
      {action && (
        <Link
          to={action.to}
          className={cn('link-underline inline-flex items-center gap-1.5 text-sm font-medium', light ? 'text-gold-200' : 'text-ink')}
        >
          {action.label} <ArrowRight size={15} />
        </Link>
      )}
    </div>
  )
}
