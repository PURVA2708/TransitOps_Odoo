// Reusable inline alert / banner. Variant maps to the status colours.
// Optional dismiss. Colour is never the only signal — there's an icon + text.
import { useState } from 'react'
import Icon from './Icon'

const ICON = { danger: 'plus', warning: 'wrench', info: 'route', success: 'checkCircle' }

export default function Alert({ variant = 'info', title, children, dismissible, actions }) {
  const [open, setOpen] = useState(true)
  if (!open) return null
  return (
    <div className={`alert alert-${variant}`} role="status">
      <span className="alert-icon">
        <Icon name={ICON[variant] || 'route'} size={18}
          style={variant === 'danger' ? { transform: 'rotate(45deg)' } : undefined} />
      </span>
      <div className="alert-body">
        {title && <div className="alert-title">{title}</div>}
        {children && <div className="alert-text">{children}</div>}
        {actions && <div className="alert-actions">{actions}</div>}
      </div>
      {dismissible && (
        <button className="alert-close" aria-label="Dismiss" onClick={() => setOpen(false)}>
          <Icon name="plus" size={16} style={{ transform: 'rotate(45deg)' }} />
        </button>
      )}
    </div>
  )
}
