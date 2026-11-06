import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type ToastKind = 'info' | 'success' | 'warning' | 'error'
type Toast = { id: number; message: string; kind: ToastKind; leaving: boolean }
type Ctx = { toast: (msg: string, kind?: Toast['kind']) => void }

const ToastCtx = createContext<Ctx>({ toast: () => {} })

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef(new Set<number>())
  useEffect(() => () => {
    timers.current.forEach(window.clearTimeout)
    timers.current.clear()
  }, [])

  const toast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = nextId++
    setToasts((t) => [...t, { id, message, kind, leaving: false }])
    const timer = window.setTimeout(() => {
      timers.current.delete(timer)
      setToasts((t) => t.map((item) => item.id === id ? { ...item, leaving: true } : item))
      const exitTimer = window.setTimeout(() => {
        timers.current.delete(exitTimer)
        setToasts((t) => t.filter((item) => item.id !== id))
      }, 180)
      timers.current.add(exitTimer)
    }, 2400)
    timers.current.add(timer)
  }, [])
  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              role={t.kind === 'error' || t.kind === 'warning' ? 'alert' : 'status'}
              aria-atomic="true"
              data-kind={t.kind}
              data-leaving={t.leaving || undefined}
              className="toast-item pointer-events-auto px-5 py-2.5 font-sans text-[12px] font-medium uppercase tracking-[0.14em]"
            >
              {t.message}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
