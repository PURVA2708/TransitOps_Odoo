// Authentication + RBAC context.
// Integrated with Supabase Auth and public.profiles roles.
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, supabaseReady } from '../lib/supabaseClient'
import { ROLES } from '../constants/roles'
const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export const DEMO_ACCOUNTS = [
  { email: 'manager@transitops.in',  password: 'demo1234', name: 'Tirth Patel',  role: ROLES.FLEET_MANAGER },
  { email: 'driver@transitops.in',   password: 'demo1234', name: 'Alex Kumar',   role: ROLES.DRIVER },
  { email: 'safety@transitops.in',   password: 'demo1234', name: 'Sana Iqbal',   role: ROLES.SAFETY_OFFICER },
  { email: 'finance@transitops.in',  password: 'demo1234', name: 'Meera Nair',   role: ROLES.FINANCIAL_ANALYST },
]


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(supabaseReady)

  const fetchProfile = useCallback(async (sessionUser) => {
    if (!sessionUser) {
      setUser(null)
      return
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', sessionUser.id)
        .single()

      if (error) throw error
      setUser({
        email: sessionUser.email,
        name: data?.name || sessionUser.email,
        role: data?.role || ROLES.FLEET_MANAGER, // fallback
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching user profile:', err)
      setUser({
        email: sessionUser.email,
        name: sessionUser.email,
        role: ROLES.FLEET_MANAGER, // fallback
      })
    }
  }, [])

  useEffect(() => {
    if (!supabaseReady) {
      setLoading(false)
      return
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user).then(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchProfile])

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
    if (!supabaseReady) {
      return { ok: false, error: 'Supabase is not configured' }
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: String(email).trim(),
      password,
    })
    if (error) return { ok: false, error: error.message }
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

  const signOut = useCallback(async () => {
    if (supabaseReady) {
      await supabase.auth.signOut()
    }
    setUser(null)
  }, [])

  return (
    <AuthCtx.Provider value={{ user, signIn, signOut, isAuthed: Boolean(user), loading }}>
      {loading ? (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: '#F8FAFC', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ border: '3px solid #334155', borderTop: '3px solid #6366F1', borderRadius: '50%', width: 30, height: 30, animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <div>Syncing with TransitOps Backend...</div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      ) : children}
    </AuthCtx.Provider>
  )
}

