import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useAppData } from '../../store/AppData'
import { useToast } from '../ui/Toast'
import Icon from '../ui/Icon'

// Topbar with hamburger (mobile), page context, and the signed-in user
// menu (sign out). Reads the real user from AuthContext.
export default function Topbar({ onMenu }) {
  const { user, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const { resetDemo } = useAppData()
  const toast = useToast()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const doSignOut = () => { signOut(); navigate('/login', { replace: true }) }
  const doReset = () => { resetDemo(); setMenuOpen(false); toast.success('Demo data reset') }

  return (
    <header className="topbar">
      <button className="topbar-menu" onClick={onMenu} aria-label="Open menu">
        <Icon name="menu" size={22} />
      </button>
      <div className="topbar-title">
        <span className="topbar-hi">Smart Transport Operations</span>
      </div>
      <div className="grow" />

      <button
        className="theme-toggle"
        onClick={toggle}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={19} />
      </button>

      <div className="topbar-user" ref={ref}>
        <button className="user-btn" onClick={() => setMenuOpen((v) => !v)} aria-haspopup="menu" aria-expanded={menuOpen}>
          <div className="avatar">{(user?.name || '?').charAt(0)}</div>
          <div className="topbar-user-meta">
            <div className="topbar-user-name">{user?.name}</div>
            <div className="topbar-user-role">{user?.role}</div>
          </div>
        </button>
        {menuOpen && (
          <div className="user-menu" role="menu">
            <div className="user-menu-head">
              <div className="text-strong">{user?.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>{user?.email}</div>
            </div>
            <button className="user-menu-item user-menu-item-neutral" role="menuitem" onClick={doReset}>
              <Icon name="wrench" size={16} /> Reset demo data
            </button>
            <button className="user-menu-item" role="menuitem" onClick={doSignOut}>
              <Icon name="logout" size={16} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
