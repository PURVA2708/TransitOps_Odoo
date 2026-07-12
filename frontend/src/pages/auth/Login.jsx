// Login page (Auth module). Email + password with RBAC. Quick-fill demo
// accounts so judges can try each role instantly.
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext'
import { Field, Input } from '../../components/ui/Field'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import './Login.css'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    const res = await signIn(email, password)
    setBusy(false)
    if (res.ok) navigate(from, { replace: true })
    else setError(res.error)
  }

  const quickFill = (acct) => { setEmail(acct.email); setPassword(acct.password); setError('') }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <span className="login-logo"><Icon name="truck" size={26} /></span>
          <span className="login-name">TransitOps</span>
        </div>
        <h1 className="login-title">Sign in to your account</h1>
        <p className="muted login-subtitle">Smart Transport Operations Platform</p>

        <form onSubmit={submit} noValidate>
          <Field label="Email" required htmlFor="email" error={error && !email ? 'Enter your email' : ''}>
            <Input id="email" type="email" autoComplete="email" placeholder="you@transitops.in"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>

          <Field label="Password" required htmlFor="password">
            <div className="pw-wrap">
              <Input id="password" type={showPw ? 'text' : 'password'} autoComplete="current-password"
                placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>

          {error && <div className="login-error" role="alert">{error}</div>}

          <Button type="submit" size="lg" block disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

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
      </div>
    </div>
  )
}
