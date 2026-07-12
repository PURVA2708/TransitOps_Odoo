// Driver Management (CRUD). Shows license validity; Safety Officers can
// suspend / reinstate. Expired-license drivers are flagged.
import { useMemo, useState } from 'react'
import { useAppData } from '../../store/AppData'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import { ROLES } from '../../constants/roles'
import { isLicenseValid } from '../../store/rules'
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
import DriverForm from './DriverForm'
import DriverDetail from './DriverDetail'
import './Drivers.css'

const DRIVER_SORT = {
  name: (d) => d.name, category: (d) => d.category,
  expiry: (d) => d.expiry, score: (d) => d.score, status: (d) => d.status,
}

export default function Drivers() {
  const { drivers, trips, addDriver, updateDriver, deleteDriver, setDriverStatus } = useAppData()
  const { user } = useAuth()
  const toast = useToast()
  const canSafety = user?.role === ROLES.SAFETY_OFFICER || user?.role === ROLES.FLEET_MANAGER

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [viewing, setViewing] = useState(null)

  const filtered = useMemo(() => drivers.filter((d) => {
    const q = query.trim().toLowerCase()
    const matchesQ = !q || d.name.toLowerCase().includes(q) || d.license.toLowerCase().includes(q)
    const matchesS = statusFilter === 'All' || d.status === statusFilter
    return matchesQ && matchesS
  }), [drivers, query, statusFilter])

  const { sorted, sortKey, sortDir, toggle } = useSortable(filtered, DRIVER_SORT)

  const openAdd = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (d) => { setEditing(d); setFormOpen(true) }

  const handleSubmit = async (data) => {
    const res = editing ? await updateDriver(editing.id, data) : await addDriver(data)
    if (res.ok) { toast.success(editing ? 'Driver updated' : 'Driver added'); setFormOpen(false) }
    return res
  }

  const confirmDelete = async () => {
    const res = await deleteDriver(toDelete.id)
    if (res?.ok === false) toast.error(res.error || 'Delete failed')
    else toast.success(`Deleted ${toDelete.name}`)
    setToDelete(null)
  }

  const toggleSuspend = async (d) => {
    if (d.status === 'Suspended') { await setDriverStatus(d.id, 'Available'); toast.success(`${d.name} reinstated`) }
    else if (d.status === 'On Trip') { toast.error('Cannot suspend a driver who is on a trip') }
    else { await setDriverStatus(d.id, 'Suspended'); toast.info(`${d.name} suspended`) }
  }

  const fmtDate = (s) => new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div>
      <PageHeader title="Driver Management" subtitle={`${drivers.length} drivers · license & compliance`}>
        <Button onClick={openAdd}><Icon name="plus" size={16} /> Add Driver</Button>
      </PageHeader>

      <div className="toolbar">
        <div className="search-box">
          <Icon name="search" size={16} className="icon" />
          <Input placeholder="Search name or license…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
          {['All', 'Available', 'On Trip', 'Off Duty', 'Suspended'].map((s) => <option key={s}>{s}</option>)}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon="driver" title="No drivers found"
            message={drivers.length ? 'Try adjusting your search or filters.' : 'Add your first driver to get started.'}
            action={<Button onClick={openAdd}><Icon name="plus" size={16} /> Add Driver</Button>} />
        </Card>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <SortHeader label="Driver" sortKey="name" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <th>License</th>
                <SortHeader label="Category" sortKey="category" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortHeader label="Expiry" sortKey="expiry" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortHeader label="Safety" sortKey="score" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((d) => {
                const valid = isLicenseValid(d)
                return (
                  <tr key={d.id}>
                    <td data-label="Driver"><button className="link-cell" onClick={() => setViewing(d)}>{d.name}</button></td>
                    <td data-label="License" className="text-num">{d.license}</td>
                    <td data-label="Category">{d.category}</td>
                    <td data-label="Expiry">
                      <span className={valid ? '' : 'driver-expired'}>
                        {fmtDate(d.expiry)}{!valid && ' · expired'}
                      </span>
                    </td>
                    <td data-label="Safety" className="text-num">{d.score}/100</td>
                    <td data-label="Status"><StatusPill status={d.status} /></td>
                    <td data-label="Actions">
                      <div className="cell-actions">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(d)}>Edit</Button>
                        {canSafety && (
                          <Button size="sm" variant={d.status === 'Suspended' ? 'secondary' : 'ghost'} onClick={() => toggleSuspend(d)}>
                            {d.status === 'Suspended' ? 'Reinstate' : 'Suspend'}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setToDelete(d)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <DriverDetail
        driver={viewing}
        trips={trips}
        onClose={() => setViewing(null)}
        onEdit={() => { const d = viewing; setViewing(null); openEdit(d) }}
      />
      <DriverForm open={formOpen} initial={editing} onSubmit={handleSubmit} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={!!toDelete}
        title="Delete driver?"
        message={toDelete ? `This will permanently remove ${toDelete.name} from the roster.` : ''}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
