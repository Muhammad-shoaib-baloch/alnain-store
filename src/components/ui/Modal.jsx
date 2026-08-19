import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/format'
import { useLockBodyScroll } from '@/hooks'

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
}

export default function Modal({ open, onClose, title, size = 'md', children, hideClose = false }) {
  useLockBodyScroll(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink/60 backdrop-blur-[2px] animate-fadeIn" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 max-h-[92vh] w-full overflow-y-auto bg-ivory shadow-lift animate-fadeUp sm:mx-4',
          SIZES[size] || SIZES.md
        )}
        role="dialog"
        aria-modal="true"
      >
        {(title || !hideClose) && (
          <div className={cn('sticky top-0 z-10 flex items-center justify-between bg-ivory/95 px-6 backdrop-blur', title ? 'border-b border-ink/10 py-4' : 'pt-4')}>
            {title ? <h3 className="font-display text-lg">{title}</h3> : <span />}
            {!hideClose && (
              <button onClick={onClose} className="text-smoke transition-colors hover:text-ink" aria-label="Close">
                <X size={20} />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body
  )
}
