// Shared KPI card used across the Dashboard.
// Big serif number (brand colour) + label + optional trend/hint.
import Card from './Card'
import Icon from './Icon'
import './KpiCard.css'

export default function KpiCard({ icon, value, label, hint, accent = 'brand' }) {
  return (
    <Card hover className="kpi">
      <div className={`kpi-icon kpi-icon-${accent}`}><Icon name={icon} size={22} /></div>
      <div className="kpi-body">
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
        {hint && <div className="kpi-hint">{hint}</div>}
      </div>
    </Card>
  )
}
