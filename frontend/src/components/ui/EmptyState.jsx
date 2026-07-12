// Shared empty state (skill: empty-states) — message + optional action.
import Icon from './Icon'

export default function EmptyState({ icon = 'clipboard', title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon name={icon} size={28} /></div>
      <h3>{title}</h3>
      {message && <p className="muted" style={{ margin: '4px 0 0' }}>{message}</p>}
      {action && <div style={{ marginTop: 'var(--sp-lg)' }}>{action}</div>}
    </div>
  )
}
