import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { cn, uid } from '@/lib/format'

const ToastContext = createContext(() => {})

export function useToast() {
  return useContext(ToastContext)
}

const ICONS = {
  success: <CheckCircle2 size={18} className="text-gold-200 shrink-0" />,
  error: <AlertTriangle size={18} className="text-red-400 shrink-0" />,
  info: <Info size={18} className="text-sky-300 shrink-0" />,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'success') => {
    const id = uid('t')
    setToasts((prev) => [...prev.slice(-3), { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3400)
  }, [])

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:right-6 sm:top-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 border border-white/10 bg-ink/95 px-4 py-3 text-sm text-ivory shadow-lift backdrop-blur animate-toastIn'
            )}
          >
            {ICONS[t.type] || ICONS.success}
            <p className="flex-1 leading-snug">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-ivory/40 transition-colors hover:text-ivory" aria-label="Dismiss">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
