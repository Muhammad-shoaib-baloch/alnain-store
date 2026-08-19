import { Check, Clock, PackageCheck, Truck, Home, XCircle, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/format'

const STEPS = [
  { id: 'pending', label: 'Placed', icon: Clock },
  { id: 'confirmed', label: 'Confirmed', icon: Check },
  { id: 'processing', label: 'Processing', icon: PackageCheck },
  { id: 'shipped', label: 'Shipped', icon: Truck },
  { id: 'delivered', label: 'Delivered', icon: Home },
]

export default function OrderStatusTracker({ status }) {
  if (status === 'cancelled' || status === 'returned') {
    const Icon = status === 'cancelled' ? XCircle : RotateCcw
    return (
      <div className={cn('flex items-center gap-3 border p-4', status === 'cancelled' ? 'border-red-200 bg-red-50 text-red-700' : 'border-orange-200 bg-orange-50 text-orange-700')}>
        <Icon size={20} />
        <p className="text-sm font-semibold capitalize">Order {status}</p>
      </div>
    )
  }

  const currentIdx = STEPS.findIndex((s) => s.id === status)

  return (
    <div className="flex items-start">
      {STEPS.map((step, i) => {
        const done = i <= currentIdx
        const Icon = step.icon
        return (
          <div key={step.id} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div className={cn('h-0.5 flex-1', i === 0 ? 'bg-transparent' : done ? 'bg-gold-500' : 'bg-beige')} />
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                  done ? 'border-gold-500 bg-gold-500 text-white' : 'border-beige bg-ivory text-smoke'
                )}
              >
                <Icon size={15} />
              </span>
              <div className={cn('h-0.5 flex-1', i === STEPS.length - 1 ? 'bg-transparent' : i < currentIdx ? 'bg-gold-500' : 'bg-beige')} />
            </div>
            <p className={cn('mt-2 text-[10px] font-semibold uppercase tracking-wider sm:text-[11px]', done ? 'text-ink' : 'text-smoke/70')}>
              {step.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}
