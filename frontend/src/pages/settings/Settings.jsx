// Settings — profile, display preferences (distance + currency), a role-based
// access overview, and password change. All changes persist locally and take
// effect across the app immediately.
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePrefs, CURRENCIES, DISTANCE_UNITS } from '../../context/PrefsContext'
import { NAV_ITEMS } from '../../constants/navigation'
import { can } from '../../constants/roles'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/ui/PageHeader'
import { Field, Input, Select } from '../../components/ui/Field'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import './Settings.css'

export default function Settings() {
  const { user, updateProfile, changePassword } = useAuth()
  const prefs = usePrefs()
  const toast = useToast()

  // --- Profile ---
  const [name, setName] = useState(user?.name || '')
  const nameChanged = name.trim() !== (user?.name || '')

  const saveProfile = (e) => {
    e.preventDefault()
    const res = updateProfile({ name })
    if (res.ok) toast.success('Profile updated')
    else toast.error(res.error)
  }

  // --- Password ---
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [pwErr, setPwErr] = useState('')
  const setPwField = (k) => (e) => { setPw((p) => ({ ...p, [k]: e.target.value })); setPwErr('') }

  const savePassword = (e) => {
    e.preventDefault()
    if (pw.next !== pw.confirm) { setPwErr('New passwords do not match'); return }
    const res = changePassword(pw.current, pw.next)
    if (res.ok) { toast.success('Password changed'); setPw({ current: '', next: '', confirm: '' }); setPwErr('') }
    else setPwErr(res.error)
  }

  const access = NAV_ITEMS.map((n) => ({ ...n, allowed: user ? can(user.role, n.feature) : false }))

  return (
    <div className="settings-page">
      <PageHeader title="Settings" subtitle="Manage your profile, display preferences and security." />

      <div className="settings-grid">
        {/* Profile */}
        <section className="card settings-card">
          <div className="settings-card-head">
            <span className="settings-card-icon"><Icon name="user" size={18} /></span>
            <div>
              <h2>Profile</h2>
              <p className="muted settings-card-sub">Your name and account details.</p>
            </div>
          </div>

          <div className="settings-identity">
            <div className="settings-avatar">{(user?.name || '?').charAt(0)}</div>
            <div>
              <div className="settings-identity-name">{user?.name}</div>
              <div className="muted settings-identity-role">{user?.role}</div>
            </div>
          </div>

          <form onSubmit={saveProfile}>
            <Field label="Full name" htmlFor="set-name">
              <Input id="set-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </Field>
            <Field label="Email" htmlFor="set-email" hint="Email is tied to your login and can’t be changed here.">
              <Input id="set-email" value={user?.email || ''} disabled />
            </Field>
            <Button type="submit" disabled={!nameChanged}>Save profile</Button>
          </form>
        </section>

        {/* Preferences */}
        <section className="card settings-card">
          <div className="settings-card-head">
            <span className="settings-card-icon"><Icon name="settings" size={18} /></span>
            <div>
              <h2>Display preferences</h2>
              <p className="muted settings-card-sub">How distances and money show across the app.</p>
            </div>
          </div>

          <Field label="Distance unit" htmlFor="set-dist"
            hint={`Sample: ${prefs.dist(1250, { decimals: 0 })}`}>
            <Select id="set-dist" value={prefs.distanceUnit} onChange={(e) => prefs.setDistanceUnit(e.target.value)}>
              {Object.values(DISTANCE_UNITS).map((u) => <option key={u.code} value={u.code}>{u.label}</option>)}
            </Select>
          </Field>

          <Field label="Currency" htmlFor="set-cur"
            hint={`Sample: ${prefs.money(48500)}`}>
            <Select id="set-cur" value={prefs.currency} onChange={(e) => prefs.setCurrency(e.target.value)}>
              {Object.values(CURRENCIES).map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </Select>
          </Field>

          <div className="settings-note muted">
            <Icon name="coins" size={15} /> Preferences are saved on this device and apply everywhere instantly.
          </div>
        </section>

        {/* Role-based access */}
        <section className="card settings-card">
          <div className="settings-card-head">
            <span className="settings-card-icon"><Icon name="shield" size={18} /></span>
            <div>
              <h2>Role &amp; access</h2>
              <p className="muted settings-card-sub">What your role can open. Managed by an administrator.</p>
            </div>
          </div>

          <div className="settings-role-badge">
            <Icon name="user" size={16} /> {user?.role}
          </div>

          <ul className="settings-access">
            {access.map((a) => (
              <li className={`settings-access-row ${a.allowed ? 'ok' : 'no'}`} key={a.key}>
                <span className="settings-access-label">
                  <Icon name={a.icon} size={16} /> {a.label}
                </span>
                <span className={`pill ${a.allowed ? 'pill-green' : 'pill-gray'}`}>
                  {a.allowed ? 'Allowed' : 'No access'}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Security */}
        <section className="card settings-card">
          <div className="settings-card-head">
            <span className="settings-card-icon"><Icon name="lock" size={18} /></span>
            <div>
              <h2>Security</h2>
              <p className="muted settings-card-sub">Change the password you use to sign in.</p>
            </div>
          </div>

          <form onSubmit={savePassword}>
            <Field label="Current password" htmlFor="pw-cur">
              <Input id="pw-cur" type="password" autoComplete="current-password"
                value={pw.current} onChange={setPwField('current')} placeholder="••••••••" />
            </Field>
            <Field label="New password" htmlFor="pw-new" hint="At least 6 characters.">
              <Input id="pw-new" type="password" autoComplete="new-password"
                value={pw.next} onChange={setPwField('next')} placeholder="••••••••" />
            </Field>
            <Field label="Confirm new password" htmlFor="pw-conf"
              error={pwErr}>
              <Input id="pw-conf" type="password" autoComplete="new-password"
                value={pw.confirm} onChange={setPwField('confirm')} placeholder="••••••••" />
            </Field>
            <Button type="submit" disabled={!pw.current || !pw.next || !pw.confirm}>Update password</Button>
          </form>
        </section>
      </div>
    </div>
  )
}
