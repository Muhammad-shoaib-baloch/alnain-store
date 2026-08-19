import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/format'

export default function StatCard({ icon: Icon, label, value, sub, trend, tone = 'default' }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center',
            tone === 'gold' ? 'bg-gold-500 text-white' : tone === 'dark' ? 'bg-ink text-gold-200' : 'bg-gold-50 text-gold-600'
          )}
        >
          <Icon size={18} />
        </span>
        {trend != null && (
          <span className={cn('flex items-center gap-1 text-xs font-semibold', trend >= 0 ? 'text-emerald-600' : 'text-red-600')}>
            {trend >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-4 font-display text-2xl leading-none sm:text-[26px]">{value}</p>
      <p className="mt-1.5 text-xs font-medium uppercase tracking-wider text-smoke">{label}</p>
      {sub && <p className="mt-1 text-xs text-smoke/80">{sub}</p>}
    </div>
  )
}
