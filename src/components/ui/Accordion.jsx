import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/format'

export default function Accordion({ title, children, defaultOpen = false, small = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-ink/10">
      <button
        type="button"
        className="flex w-full items-center justify-between py-4 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={cn('font-medium', small ? 'text-xs font-semibold uppercase tracking-wider text-ink' : 'text-sm')}>
          {title}
        </span>
        <ChevronDown size={16} className={cn('text-smoke transition-transform duration-300', open && 'rotate-180')} />
      </button>
      <div className={cn('grid transition-all duration-300', open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
        <div className="overflow-hidden">
          <div className="pb-4">{children}</div>
        </div>
      </div>
    </div>
  )
}
