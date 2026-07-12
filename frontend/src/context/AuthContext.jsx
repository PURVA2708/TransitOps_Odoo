// Authentication + RBAC context.
// Mock auth (preset demo accounts + locally-created accounts), persisted to
// localStorage. Swap signIn/signUp/resetPassword for supabase.auth.* later —
// the rest of the app (useAuth, ProtectedRoute, RBAC) stays unchanged.
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { ROLES, ALL_ROLES } from '../constants/roles'

const KEY = 'transitops_user_v1'
const ACCTS_KEY = 'transitops_accounts_v1'
const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

// Demo accounts — one per role. Password is the same for all (demo only).
export const DEMO_ACCOUNTS = [
  { email: 'manager@transitops.in',  password: 'demo1234', name: 'Tirth Patel',  role: ROLES.FLEET_MANAGER },
  { email: 'driver@transitops.in',   password: 'demo1234', name: 'Alex Kumar',   role: ROLES.DRIVER },
  { email: 'safety@transitops.in',   password: 'demo1234', name: 'Sana Iqbal',   role: ROLES.SAFETY_OFFICER },
  { email: 'finance@transitops.in',  password: 'demo1234', name: 'Meera Nair',   role: ROLES.FINANCIAL_ANALYST },
]

const norm = (e) => String(e).trim().toLowerCase()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null } catch { return null }
  })
  // Accounts created via the sign-up form (kept separate from the demo set).
  const [created, setCreated] = useState(() => {
    try { const raw = localStorage.getItem(ACCTS_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
  })

  useEffect(() => {
    try {
      if (user) localStorage.setItem(KEY, JSON.stringify(user))
      else localStorage.removeItem(KEY)
    } catch { /* ignore */ }
  }, [user])

  useEffect(() => {
    try { localStorage.setItem(ACCTS_KEY, JSON.stringify(created)) } catch { /* ignore */ }
  }, [created])

  // Demo + created accounts, created taking precedence on email collision.
  const accounts = useMemo(() => {
    const map = new Map()
    for (const a of DEMO_ACCOUNTS) map.set(norm(a.email), a)
    for (const a of created) map.set(norm(a.email), a)
    return [...map.values()]
  }, [created])

  const findAccount = useCallback((email) => accounts.find((a) => norm(a.email) === norm(email)), [accounts])

  const signIn = useCallback(async (email, password) => {
    const acct = findAccount(email)
    if (!acct || acct.password !== password) return { ok: false, error: 'Invalid email or password' }
    setUser({ email: acct.email, name: acct.name, role: acct.role })
    return { ok: true }
  }, [findAccount])

  // Sign up → adds a real, usable local account and signs the user in.
  const signUp = useCallback(async ({ name, email, password, role }) => {
    const cleanName = String(name).trim()
    const cleanEmail = String(email).trim()
    if (!cleanName) return { ok: false, error: 'Enter your full name' }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { ok: false, error: 'Enter a valid email address' }
    if (String(password).length < 6) return { ok: false, error: 'Password must be at least 6 characters' }
    if (!ALL_ROLES.includes(role)) return { ok: false, error: 'Choose a role' }
    if (findAccount(cleanEmail)) return { ok: false, error: 'An account with this email already exists' }

    const acct = { name: cleanName, email: cleanEmail, password, role }
    setCreated((list) => [...list, acct])
    setUser({ email: acct.email, name: acct.name, role: acct.role })
    return { ok: true }
  }, [findAccount])

  // Forgot password → mock "reset link sent" (only succeeds for known emails).
  const resetPassword = useCallback(async (email) => {
    const cleanEmail = String(email).trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { ok: false, error: 'Enter a valid email address' }
    if (!findAccount(cleanEmail)) return { ok: false, error: 'No account found for that email' }
    return { ok: true }
  }, [findAccount])

  // Settings → edit display name (updates the session + underlying account).
  const updateProfile = useCallback(({ name }) => {
    const cleanName = String(name).trim()
    if (!cleanName) return { ok: false, error: 'Name cannot be empty' }
    setUser((u) => (u ? { ...u, name: cleanName } : u))
    setCreated((list) => list.map((a) => (user && norm(a.email) === norm(user.email) ? { ...a, name: cleanName } : a)))
    return { ok: true }
  }, [user])

  // Settings → change password (works for demo + created accounts).
  const changePassword = useCallback((current, next) => {
    if (!user) return { ok: false, error: 'Not signed in' }
    const acct = findAccount(user.email)
    if (!acct || acct.password !== current) return { ok: false, error: 'Current password is incorrect' }
    if (String(next).length < 6) return { ok: false, error: 'New password must be at least 6 characters' }
    setCreated((list) => {
      const exists = list.some((a) => norm(a.email) === norm(user.email))
      const updated = { ...acct, password: next }
      return exists
        ? list.map((a) => (norm(a.email) === norm(user.email) ? updated : a))
        : [...list, updated] // shadow a demo account with the new password
    })
    return { ok: true }
  }, [user, findAccount])

  const signOut = useCallback(() => setUser(null), [])

  const value = useMemo(() => ({
    user, isAuthed: Boolean(user),
    signIn, signUp, resetPassword, updateProfile, changePassword, signOut,
  }), [user, signIn, signUp, resetPassword, updateProfile, changePassword, signOut])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
