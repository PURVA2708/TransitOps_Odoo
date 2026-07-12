// Dashboard — Tirth, Phase 1.
// KPI cards + fleet-status breakdown + active trips table.
// Uses shared UI components + design tokens only. Fully responsive.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../../store/AppData'
import { computeKpis, licenseAlerts } from '../../store/rules'
import { useToast } from '../../components/ui/Toast'
import KpiCard from '../../components/ui/KpiCard'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import StatusPill from '../../components/ui/StatusPill'
import Alert from '../../components/ui/Alert'
import './Dashboard.css'

export default function Dashboard() {
  const { vehicles, drivers, trips } = useAppData()
  const toast = useToast()
  const [typeFilter, setTypeFilter] = useState('All')

  const kpis = useMemo(() => computeKpis({ vehicles, drivers, trips }), [vehicles, drivers, trips])
  const { expired, expiring } = useMemo(() => licenseAlerts(drivers), [drivers])

  const vehicleTypes = ['All', ...new Set(vehicles.map((v) => v.type))]
  const shownVehicles = typeFilter === 'All' ? vehicles : vehicles.filter((v) => v.type === typeFilter)
  const activeTrips = trips.filter((t) => t.status === 'Dispatched')

  // Fleet status breakdown for the progress bars
  const statusCounts = ['Available', 'On Trip', 'In Shop', 'Retired'].map((s) => ({
    status: s,
    count: shownVehicles.filter((v) => v.status === s).length,
  }))
  const total = shownVehicles.length

  return (
    <div className="stack gap-lg dashboard">
      {/* Page header */}
      <div className="dash-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted" style={{ margin: 0 }}>
            Fleet overview at a glance — live operational KPIs.
          </p>
        </div>
        <div className="dash-filter">
          <label className="dash-filter-label">Vehicle type</label>
          <select
            className="dash-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {vehicleTypes.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* License compliance alerts */}
      {expired.length > 0 && (
        <Alert
          variant="danger"
          title={`${expired.length} driver${expired.length > 1 ? 's have' : ' has an'} expired license`}
          dismissible
          actions={
            <>
              <Link to="/drivers"><Button size="sm" variant="secondary">Review drivers</Button></Link>
              <Button size="sm" variant="ghost" onClick={() => toast.success('Reminder queued to Safety Officer')}>
                Send reminder
              </Button>
            </>
          }
        >
          {expired.map((d) => d.name).join(', ')} — cannot be assigned to trips until renewed.
        </Alert>
      )}
      {expiring.length > 0 && (
        <Alert
          variant="warning"
          title={`${expiring.length} license${expiring.length > 1 ? 's' : ''} expiring within 30 days`}
          dismissible
          actions={<Link to="/drivers"><Button size="sm" variant="secondary">Review drivers</Button></Link>}
        >
          {expiring.map((d) => `${d.name} (${d.days}d)`).join(', ')}
        </Alert>
      )}

      {/* KPI grid */}
      <div className="kpi-grid">
        <KpiCard icon="truck"       accent="blue"  value={kpis.activeVehicles}    label="Active Vehicles" hint="On trip right now" />
        <KpiCard icon="checkCircle" accent="green" value={kpis.availableVehicles} label="Available Vehicles" hint="Ready to dispatch" />
        <KpiCard icon="wrench"      accent="amber" value={kpis.inMaintenance}     label="In Maintenance" hint="Currently in shop" />
        <KpiCard icon="route"       accent="blue"  value={kpis.activeTrips}       label="Active Trips" hint="Dispatched" />
        <KpiCard icon="clipboard"   accent="gray"  value={kpis.pendingTrips}      label="Pending Trips" hint="Draft, not dispatched" />
        <KpiCard icon="driver"      accent="green" value={kpis.driversOnDuty}     label="Drivers On Duty" hint="Currently driving" />
        <KpiCard icon="gauge"       accent="brand" value={`${kpis.fleetUtilization}%`} label="Fleet Utilization" hint={`${kpis.activeVehicles} of ${kpis.totalVehicles - kpis.inMaintenance} usable`} />
        <KpiCard icon="fleet"       accent="brand" value={kpis.totalVehicles}     label="Total Fleet" hint="All registered vehicles" />
      </div>

      {/* Two-column: fleet breakdown + active trips */}
      <div className="dash-split">
        <Card>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'var(--sp-md)' }}>
            <h2>Fleet Status</h2>
            <span className="muted" style={{ fontSize: 12 }}>{total} vehicles</span>
          </div>
          <div className="stack gap-md">
            {statusCounts.map(({ status, count }) => (
              <div key={status} className="bar-row">
                <div className="bar-top">
                  <StatusPill status={status} />
                  <span className="bar-count">{count}</span>
                </div>
                <div className="bar-track">
                  <div
                    className={`bar-fill bar-${status.replace(/\s/g, '').toLowerCase()}`}
                    style={{ width: total ? `${(count / total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 'var(--sp-md)' }}>
            <h2>Active Trips</h2>
            <Button variant="secondary" size="sm">View all</Button>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Trip</th><th>Route</th><th>Driver</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeTrips.map((t) => {
                  const driver = drivers.find((d) => d.id === t.driverId)
                  return (
                    <tr key={t.id}>
                      <td data-label="Trip"><strong>{t.id}</strong></td>
                      <td data-label="Route">{t.source} → {t.dest}</td>
                      <td data-label="Driver">{driver?.name || '—'}</td>
                      <td data-label="Status"><StatusPill status={t.status} /></td>
                    </tr>
                  )
                })}
                {activeTrips.length === 0 && (
                  <tr><td colSpan={4} className="muted" style={{ textAlign: 'center' }}>No active trips right now.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
