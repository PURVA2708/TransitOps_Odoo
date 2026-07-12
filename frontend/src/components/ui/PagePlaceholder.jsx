// Temporary stub for modules not built yet. Each owner replaces this
// with their real page. Keeps routing + nav working from day one.
import Card from './Card'

export default function PagePlaceholder({ title, owner, phase }) {
  return (
    <div className="stack gap-lg">
      <div>
        <h1>{title}</h1>
        <p className="muted">This module is coming soon.</p>
      </div>
      <Card>
        <div className="stack gap-sm">
          <div><strong>Owner:</strong> {owner}</div>
          <div><strong>Phase:</strong> {phase}</div>
          <p className="muted" style={{ margin: 0 }}>
            Placeholder screen — build lives in this page's folder.
          </p>
        </div>
      </Card>
    </div>
  )
}
