import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../../constants/navigation'
import { useAuth } from '../../context/AuthContext'
import { can } from '../../constants/roles'
import Icon from '../ui/Icon'

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  // RBAC: only show nav items the current role can access.
  const items = NAV_ITEMS.filter((item) => !user || can(user.role, item.feature))

  return (
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand">
        <span className="sidebar-logo"><Icon name="truck" size={22} /></span>
        <span className="sidebar-name">TransitOps</span>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
            onClick={onClose}
          >
            <span className="nav-icon"><Icon name={item.icon} size={19} /></span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot muted">Smart Transport Ops</div>
    </aside>
  )
}
