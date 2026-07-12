// Authentication + RBAC context.
// Mock auth for now (preset demo accounts per role), persisted to
// localStorage. Swap signIn() for supabase.auth.signInWithPassword later —
// the rest of the app (useAuth, ProtectedRoute, RBAC) stays unchanged.
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { ROLES } from '../constants/roles'

const KEY = 'transitops_user_v1'
const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

// Demo accounts — one per role. Password is the same for all (demo only).
export const DEMO_ACCOUNTS = [
  { email: 'manager@transitops.in',  password: 'demo1234', name: 'Tirth Patel',  role: ROLES.FLEET_MANAGER },
  { email: 'driver@transitops.in',   password: 'demo1234', name: 'Alex Kumar',   role: ROLES.DRIVER },
  { email: 'safety@transitops.in',   password: 'demo1234', name: 'Sana Iqbal',   role: ROLES.SAFETY_OFFICER },
  { email: 'finance@transitops.in',  password: 'demo1234', name: 'Meera Nair',   role: ROLES.FINANCIAL_ANALYST },
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null } catch { return null }
  })

  useEffect(() => {
    try {
      if (user) localStorage.setItem(KEY, JSON.stringify(user))
      else localStorage.removeItem(KEY)
    } catch { /* ignore */ }
  }, [user])

  const signIn = useCallback(async (email, password) => {
    const acct = DEMO_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === String(email).trim().toLowerCase() && a.password === password
    )
    if (!acct) return { ok: false, error: 'Invalid email or password' }
    setUser({ email: acct.email, name: acct.name, role: acct.role })
    return { ok: true }
  }, [])

  const signOut = useCallback(() => setUser(null), [])

  return (
    <AuthCtx.Provider value={{ user, signIn, signOut, isAuthed: Boolean(user) }}>
      {children}
    </AuthCtx.Provider>
  )
}
