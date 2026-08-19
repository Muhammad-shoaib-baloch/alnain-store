import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/format'
import { useLockBodyScroll } from '@/hooks'

export default function Drawer({ open, onClose, title, side = 'right', width = 'max-w-md', children, footer }) {
  useLockBodyScroll(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const sideClass = {
    right: 'right-0 inset-y-0 w-full animate-slideInRight',
    left: 'left-0 inset-y-0 w-full animate-slideInLeft',
    bottom: 'bottom-0 inset-x-0 max-h-[88vh] animate-slideUp',
  }[side]

  return createPortal(
    <div className="fixed inset-0 z-[110]">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-[2px] animate-fadeIn" onClick={onClose} />
      <div className={cn('absolute flex flex-col bg-ivory shadow-lift', sideClass, side !== 'bottom' && width)} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h3 className="font-display text-lg">{title}</h3>
          <button onClick={onClose} className="text-smoke transition-colors hover:text-ink" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-ink/10 bg-white px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
