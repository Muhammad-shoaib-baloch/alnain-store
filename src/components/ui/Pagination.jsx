import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/format'

function pageList(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  if (page <= 4) return [1, 2, 3, 4, 5, '…', pages]
  if (page >= pages - 3) return [1, '…', pages - 4, pages - 3, pages - 2, pages - 1, pages]
  return [1, '…', page - 1, page, page + 1, '…', pages]
}

export default function Pagination({ page, pages, onChange, className = '' }) {
  if (pages <= 1) return null
  return (
    <nav className={cn('flex items-center justify-center gap-1.5', className)} aria-label="Pagination">
      <button
        className="flex h-9 w-9 items-center justify-center border border-ink/15 text-smoke transition-colors hover:border-ink hover:text-ink disabled:opacity-30"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>
      {pageList(page, pages).map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-1 text-sm text-smoke">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              'h-9 w-9 border text-sm transition-colors',
              p === page ? 'border-ink bg-ink text-ivory' : 'border-ink/15 text-smoke hover:border-ink hover:text-ink'
            )}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}
      <button
        className="flex h-9 w-9 items-center justify-center border border-ink/15 text-smoke transition-colors hover:border-ink hover:text-ink disabled:opacity-30"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}
