/* eslint-disable react-refresh/only-export-components */
import { useState, useCallback, useRef, useMemo } from 'react'
import { createContext, useContext } from 'react'
import { useAppTheme } from '../theme/appTheme'

const ToastContext = createContext(null)

const ICONS = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
}

function ToastContainer({ toasts, removeToast, palette }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl border bg-dark-900/95 px-4 py-3 shadow-2xl backdrop-blur-md animate-slide-in-right ${palette.borderSoft} ${palette.shadow}`}
        >
          <span className={`material-symbols-rounded text-lg ${palette.text}`}>
            {ICONS[t.type]}
          </span>
          <p className="text-white text-sm flex-1">{t.message}</p>
          <button
            onClick={() => removeToast(t.id)}
            className="cursor-pointer text-dark-400 hover:text-white transition-colors"
          >
            <span className="material-symbols-rounded text-lg">close</span>
          </button>
        </div>
      ))}
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timeoutsRef = useRef(new Map())
  const { palette } = useAppTheme()

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timeout = timeoutsRef.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutsRef.current.delete(id)
    }
  }, [])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    const timeout = setTimeout(() => removeToast(id), duration)
    timeoutsRef.current.set(id, timeout)
  }, [removeToast])

  const toast = useMemo(() => ({
    success: (message, duration) => addToast(message, 'success', duration),
    error: (message, duration) => addToast(message, 'error', duration),
    warning: (message, duration) => addToast(message, 'warning', duration),
    info: (message, duration) => addToast(message, 'info', duration),
  }), [addToast])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} palette={palette} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
