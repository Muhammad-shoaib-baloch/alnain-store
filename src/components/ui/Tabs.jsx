import { cn } from '@/lib/format'

export default function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div className={cn('scrollbar-none flex gap-6 overflow-x-auto border-b border-ink/10', className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'relative whitespace-nowrap pb-3 text-sm font-medium transition-colors',
            active === tab.id ? 'text-ink' : 'text-smoke hover:text-ink'
          )}
        >
          {tab.label}
          {tab.badge != null && <span className="ml-1.5 text-xs text-gold-600">({tab.badge})</span>}
          <span
            className={cn(
              'absolute inset-x-0 -bottom-px h-0.5 bg-gold-500 transition-transform duration-300',
              active === tab.id ? 'scale-x-100' : 'scale-x-0'
            )}
          />
        </button>
      ))}
    </div>
  )
}
