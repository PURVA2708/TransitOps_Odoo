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
  }, [])

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

