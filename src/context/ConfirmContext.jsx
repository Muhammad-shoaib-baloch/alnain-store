import { createContext, useCallback, useContext, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from '@/components/ui/Modal'

const ConfirmContext = createContext(() => Promise.resolve(false))

export function useConfirm() {
  return useContext(ConfirmContext)
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        setState({ title: 'Are you sure?', confirmText: 'Delete', cancelText: 'Cancel', danger: true, ...opts, resolve })
      }),
    []
  )

  const close = (result) => {
    state?.resolve(result)
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal open={!!state} onClose={() => close(false)} size="sm">
        {state && (
          <div className="p-6 text-center">
            <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${state.danger ? 'bg-red-50 text-red-500' : 'bg-gold-50 text-gold-600'}`}>
              <AlertTriangle size={22} />
            </div>
            <h3 className="font-display text-xl">{state.title}</h3>
            {state.message && <p className="mt-2 text-sm text-smoke">{state.message}</p>}
            <div className="mt-6 flex justify-center gap-3">
              <button className="btn-outline btn-sm" onClick={() => close(false)}>
                {state.cancelText}
              </button>
              <button
                className={`btn btn-sm px-4 py-2 text-ivory ${state.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-ink hover:bg-gold-600'}`}
                onClick={() => close(true)}
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  )
}
