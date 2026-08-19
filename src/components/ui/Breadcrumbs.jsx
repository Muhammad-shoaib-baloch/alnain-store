import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function Breadcrumbs({ items = [], className = '' }) {
  return (
    <nav className={`flex flex-wrap items-center gap-1.5 text-xs text-smoke ${className}`} aria-label="Breadcrumb">
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5">
            {item.to && !last ? (
              <Link to={item.to} className="transition-colors hover:text-gold-600">
                {item.label}
              </Link>
            ) : (
              <span className={last ? 'text-ink font-medium' : ''}>{item.label}</span>
            )}
            {!last && <ChevronRight size={12} className="text-smoke/50" />}
          </span>
        )
      })}
    </nav>
  )
}
