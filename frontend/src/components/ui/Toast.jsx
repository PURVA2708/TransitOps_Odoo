// Lightweight toast system (skill: success-feedback, toast-dismiss,
// toast-accessibility). Provider + useToast() hook. Auto-dismiss 3.5s.
import { createContext, useContext, useCallback, useState } from 'react'
import Icon from './Icon'

const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)

let nextId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const push = useCallback((message, type = 'success') => {
    const id = nextId++
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => remove(id), 3500)
  }, [remove])

  const api = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  }

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toast-wrap" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <Icon name={t.type === 'error' ? 'plus' : 'check'} size={16}
                  style={t.type === 'error' ? { transform: 'rotate(45deg)' } : undefined} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
