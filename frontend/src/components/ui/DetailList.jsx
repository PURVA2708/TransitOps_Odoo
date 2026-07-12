// Shared label/value definition list used inside detail modals.
export function DetailList({ children }) {
  return <dl className="detail-list">{children}</dl>
}

export function DetailRow({ label, children }) {
  return (
    <div className="detail-row">
      <dt className="detail-label">{label}</dt>
      <dd className="detail-value">{children}</dd>
    </div>
  )
}
