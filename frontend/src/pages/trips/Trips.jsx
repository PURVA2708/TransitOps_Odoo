// Trip Management (core module). Create → Dispatch → Complete / Cancel,
// with automatic vehicle + driver status transitions and the 5-check
// dispatch validation enforced by the store.
import { useMemo, useState } from 'react'
import { useAppData } from '../../store/AppData'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import Card from '../../components/ui/Card'
import StatusPill from '../../components/ui/StatusPill'
import EmptyState from '../../components/ui/EmptyState'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import SortHeader from '../../components/ui/SortHeader'
import { Input, Select } from '../../components/ui/Field'
import { useSortable } from '../../hooks/useSortable'
import TripForm from './TripForm'
import CompleteTripModal from './CompleteTripModal'

const TRIP_SORT = {
  id: (t) => t.id, route: (t) => t.source, vehicle: (t) => t.vehicle?.reg || '',
  driver: (t) => t.driver?.name || '', cargo: (t) => t.cargo, status: (t) => t.status,
}

export default function Trips() {
  const { trips, vehicles, drivers, createTrip, dispatchTrip, completeTrip, cancelTrip } = useAppData()
  const toast = useToast()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [formOpen, setFormOpen] = useState(false)
  const [completing, setCompleting] = useState(null)
  const [cancelling, setCancelling] = useState(null)

  const byId = (list, id) => list.find((x) => x.id === id)

  const rows = useMemo(() => trips.map((t) => ({
    ...t,
    vehicle: byId(vehicles, t.vehicleId),
    driver: byId(drivers, t.driverId),
  })), [trips, vehicles, drivers])

  const filtered = useMemo(() => rows.filter((t) => {
    const q = query.trim().toLowerCase()
    const matchesQ = !q || t.id.toLowerCase().includes(q) ||
      t.source.toLowerCase().includes(q) || t.dest.toLowerCase().includes(q) ||
      (t.driver?.name || '').toLowerCase().includes(q)
    const matchesS = statusFilter === 'All' || t.status === statusFilter
    return matchesQ && matchesS
  }), [rows, query, statusFilter])

  const { sorted, sortKey, sortDir, toggle } = useSortable(filtered, TRIP_SORT)

  const handleCreate = (data) => {
    const res = createTrip(data)
    if (res.ok) { toast.success('Trip saved as Draft'); setFormOpen(false) }
    else if (res.error) toast.error(res.error)
    return res
  }

  const handleDispatch = (t) => {
    const res = dispatchTrip(t.id)
    if (res.ok) toast.success(`${t.id} dispatched — vehicle & driver now On Trip`)
    else toast.error(res.error || 'Cannot dispatch')
  }

  const handleComplete = ({ finalOdometer, fuelConsumed }) => {
    const res = completeTrip(completing.id, { finalOdometer, fuelConsumed })
    if (res.ok) toast.success(`${completing.id} completed — vehicle & driver freed`)
    else toast.error(res.error)
    setCompleting(null)
  }

  const handleCancel = () => {
    cancelTrip(cancelling.id)
    toast.info(`${cancelling.id} cancelled`)
    setCancelling(null)
  }

  return (
    <div>
      <PageHeader title="Trip Management" subtitle="Dispatch, monitor and complete deliveries">
        <Button onClick={() => setFormOpen(true)}><Icon name="plus" size={16} /> Create Trip</Button>
      </PageHeader>

      <div className="toolbar">
        <div className="search-box">
          <Icon name="search" size={16} className="icon" />
          <Input placeholder="Search trip, route, driver…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
          {['All', 'Draft', 'Dispatched', 'Completed', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon="route" title="No trips found"
            message={trips.length ? 'Try adjusting your search or filters.' : 'Create your first trip to get started.'}
            action={<Button onClick={() => setFormOpen(true)}><Icon name="plus" size={16} /> Create Trip</Button>} />
        </Card>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <SortHeader label="Trip" sortKey="id" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortHeader label="Route" sortKey="route" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortHeader label="Vehicle" sortKey="vehicle" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortHeader label="Driver" sortKey="driver" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortHeader label="Cargo" sortKey="cargo" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => (
                <tr key={t.id}>
                  <td data-label="Trip"><span className="text-strong">{t.id}</span></td>
                  <td data-label="Route">{t.source} <Icon name="chevronRight" size={13} /> {t.dest}</td>
                  <td data-label="Vehicle" className="text-num">{t.vehicle?.reg || '—'}</td>
                  <td data-label="Driver">{t.driver?.name || '—'}</td>
                  <td data-label="Cargo" className="text-num">{t.cargo} kg</td>
                  <td data-label="Status"><StatusPill status={t.status} /></td>
                  <td data-label="Actions">
                    <div className="cell-actions">
                      {t.status === 'Draft' && (
                        <>
                          <Button size="sm" onClick={() => handleDispatch(t)}>Dispatch</Button>
                          <Button size="sm" variant="ghost" onClick={() => setCancelling(t)}>Cancel</Button>
                        </>
                      )}
                      {t.status === 'Dispatched' && (
                        <>
                          <Button size="sm" onClick={() => setCompleting(t)}>Complete</Button>
                          <Button size="sm" variant="ghost" onClick={() => setCancelling(t)}>Cancel</Button>
                        </>
                      )}
                      {(t.status === 'Completed' || t.status === 'Cancelled') && (
                        <span className="muted" style={{ fontSize: 12 }}>—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TripForm open={formOpen} vehicles={vehicles} drivers={drivers} onSubmit={handleCreate} onClose={() => setFormOpen(false)} />
      <CompleteTripModal
        open={!!completing}
        trip={completing}
        vehicle={completing ? byId(vehicles, completing.vehicleId) : null}
        onConfirm={handleComplete}
        onClose={() => setCompleting(null)}
      />
      <ConfirmDialog
        open={!!cancelling}
        title="Cancel this trip?"
        confirmLabel="Cancel trip"
        message={cancelling ? `${cancelling.id} will be cancelled${cancelling.status === 'Dispatched' ? ', and its vehicle & driver freed' : ''}.` : ''}
        onConfirm={handleCancel}
        onClose={() => setCancelling(null)}
      />
    </div>
  )
}
