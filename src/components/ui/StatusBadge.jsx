import { cn } from '@/lib/format'

const STYLES = {
  // order statuses
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-sky-50 text-sky-700 border-sky-200',
  processing: 'bg-violet-50 text-violet-700 border-violet-200',
  shipped: 'bg-blue-50 text-blue-700 border-blue-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  returned: 'bg-orange-50 text-orange-700 border-orange-200',
  // payment
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  refunded: 'bg-slate-100 text-slate-600 border-slate-200',
  failed: 'bg-red-50 text-red-600 border-red-200',
  // stock
  'in-stock': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'low-stock': 'bg-amber-50 text-amber-700 border-amber-200',
  'out-of-stock': 'bg-red-50 text-red-600 border-red-200',
  // product / generic
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  archived: 'bg-stone-100 text-stone-500 border-stone-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  disabled: 'bg-red-50 text-red-600 border-red-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
  expired: 'bg-slate-100 text-slate-500 border-slate-200',
  // contact messages
  new: 'bg-gold-50 text-gold-700 border-gold-300',
  read: 'bg-slate-100 text-slate-600 border-slate-200',
}

export default function StatusBadge({ value, className = '' }) {
  if (!value) return null
  const label = String(value).replace(/-/g, ' ')
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap border px-2 py-0.5 text-[11px] font-semibold capitalize',
        STYLES[value] || 'bg-cream text-smoke border-ink/10',
        className
      )}
    >
      {label}
    </span>
  )
}
