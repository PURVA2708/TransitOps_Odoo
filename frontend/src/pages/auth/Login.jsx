// Auth page. Split layout: project story on the left, an action card on the
// right with three modes — Sign in, Create account, Forgot password — plus
// role selection on sign-up. On successful sign in / sign up a truck loader
// plays before the dashboard is revealed.
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext'
import { ALL_ROLES } from '../../constants/roles'
import { Field, Input, Select } from '../../components/ui/Field'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import TruckLoader from '../../components/loader/TruckLoader'
import './Login.css'

const POINTS = [
  'Track every vehicle, driver and trip in real time',
  'Compliant dispatch — draft, dispatch, ship, deliver',
  'Live fuel, cost and utilisation reporting',
  'Role-based access for your whole operation',
]

export default function Login() {
  const { signIn, signUp, resetPassword } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [mode, setMode] = useState('signin') // signin | signup | forgot
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState(ALL_ROLES[0])
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [launching, setLaunching] = useState(false) // truck loader playing

  const switchMode = (m) => { setMode(m); setError(''); setNotice(''); setShowPw(false) }

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setNotice(''); setBusy(true)

    if (mode === 'forgot') {
      const res = await resetPassword(email)
      setBusy(false)
      if (res.ok) setNotice(`If an account exists for ${email}, a reset link is on its way.`)
      else setError(res.error)
      return
    }

    const res = mode === 'signup'
      ? await signUp({ name, email, password, role })
      : await signIn(email, password)
    setBusy(false)

    if (res.ok) setLaunching(true) // play the truck loader, then route
    else setError(res.error)
  }

  const quickFill = (acct) => {
    switchMode('signin')
    setEmail(acct.email); setPassword(acct.password)
  }

  if (launching) {
    return <TruckLoader onDone={() => navigate(from, { replace: true })} />
  }

  const titles = {
    signin: 'Welcome back',
    signup: 'Create your account',
    forgot: 'Reset your password',
  }
  const subtitles = {
    signin: 'Sign in to your TransitOps workspace',
    signup: 'Join the Smart Transport Operations platform',
    forgot: 'We’ll send a reset link to your email',
  }

  return (
    <div className="auth-page">
      {/* LEFT — project story */}
      <aside className="auth-side">
        <div className="auth-side-inner">
          <div className="auth-brand">
            <span className="auth-logo"><Icon name="truck" size={24} /></span>
            <span className="auth-brand-name">TransitOps</span>
          </div>

          <h1 className="auth-headline">Smart Transport<br />Operations</h1>

          <p className="auth-lede">
            TransitOps is a role-based fleet command centre — manage vehicles,
            drivers and trips, keep dispatch compliant, and turn fuel and cost
            data into clear decisions.
          </p>

          <ul className="auth-points">
            {POINTS.map((p) => (
              <li className="auth-point" key={p}>
                <span className="auth-point-mark"><Icon name="check" size={13} /></span>
                <span>{p}</span>
              </li>
            ))}
          </ul>

          <div className="auth-side-foot">Built for fleet managers, drivers, safety officers &amp; analysts.</div>
        </div>
      </aside>

      {/* RIGHT — action card */}
      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-brand auth-brand-mobile">
            <span className="auth-logo"><Icon name="truck" size={22} /></span>
            <span className="auth-brand-name">TransitOps</span>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="Authentication">
            <button type="button" role="tab" aria-selected={mode === 'signin'}
              className={`auth-tab ${mode === 'signin' ? 'is-active' : ''}`} onClick={() => switchMode('signin')}>
              Sign in
            </button>
            <button type="button" role="tab" aria-selected={mode === 'signup'}
              className={`auth-tab ${mode === 'signup' ? 'is-active' : ''}`} onClick={() => switchMode('signup')}>
              Create account
            </button>
          </div>

          <h2 className="auth-title">{titles[mode]}</h2>
          <p className="muted auth-subtitle">{subtitles[mode]}</p>

          <form onSubmit={submit} noValidate>
            {mode === 'signup' && (
              <Field label="Full name" required htmlFor="name">
                <Input id="name" autoComplete="name" placeholder="e.g. Priya Sharma"
                  value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
            )}

            <Field label="Email" required htmlFor="email">
              <Input id="email" type="email" autoComplete="email" placeholder="you@transitops.in"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>

            {mode !== 'forgot' && (
              <Field label="Password" required htmlFor="password"
                hint={mode === 'signup' ? 'At least 6 characters.' : ''}>
                <div className="pw-wrap">
                  <Input id="password" type={showPw ? 'text' : 'password'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}>
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              </Field>
            )}

            {mode === 'signup' && (
              <Field label="Your role" required htmlFor="role" hint="Controls which modules you can access.">
                <Select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                  {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
              </Field>
            )}

            {mode === 'signin' && (
              <div className="auth-row-end">
                <button type="button" className="auth-link" onClick={() => switchMode('forgot')}>
                  Forgot password?
                </button>
              </div>
            )}

            {error && <div className="login-error" role="alert">{error}</div>}
            {notice && <div className="login-notice" role="status">{notice}</div>}

            <Button type="submit" size="lg" block disabled={busy}>
              {busy
                ? 'Please wait…'
                : mode === 'signin' ? 'Sign in'
                : mode === 'signup' ? 'Create account'
                : 'Send reset link'}
            </Button>
          </form>

          {mode === 'forgot' && (
            <button type="button" className="auth-link auth-back" onClick={() => switchMode('signin')}>
              ← Back to sign in
            </button>
          )}

          {mode === 'signin' && (
            <div className="login-demo">
              <div className="login-demo-label">Demo accounts — click to fill</div>
              <div className="login-demo-grid">
                {DEMO_ACCOUNTS.map((a) => (
                  <button key={a.email} type="button" className="demo-chip" onClick={() => quickFill(a)}>
                    <span className="demo-role">{a.role}</span>
                    <span className="demo-email">{a.email}</span>
                  </button>
                ))}
              </div>
              <div className="muted login-demo-hint">Password for all: <code>demo1234</code></div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
