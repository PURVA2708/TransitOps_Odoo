// Vehicle Registry (CRUD). Search + filter, add/edit modal, delete confirm.
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
import { VEHICLE_TYPES } from '../../store/seed'
import VehicleForm from './VehicleForm'
import VehicleDetail from './VehicleDetail'

const VEHICLE_SORT = {
  reg: (v) => v.reg, name: (v) => v.name, type: (v) => v.type,
  capacity: (v) => v.capacity, odometer: (v) => v.odometer, status: (v) => v.status,
}

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

export default function Vehicles() {
  const { vehicles, trips, addVehicle, updateVehicle, deleteVehicle } = useAppData()
  const toast = useToast()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [typeFilter, setTypeFilter] = useState('All')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [viewing, setViewing] = useState(null)

  const filtered = useMemo(() => vehicles.filter((v) => {
    const q = query.trim().toLowerCase()
    const matchesQ = !q || v.reg.toLowerCase().includes(q) || v.name.toLowerCase().includes(q)
    const matchesS = statusFilter === 'All' || v.status === statusFilter
    const matchesT = typeFilter === 'All' || v.type === typeFilter
    return matchesQ && matchesS && matchesT
  }), [vehicles, query, statusFilter, typeFilter])

  const { sorted, sortKey, sortDir, toggle } = useSortable(filtered, VEHICLE_SORT)

  const openAdd = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (v) => { setEditing(v); setFormOpen(true) }

  const handleSubmit = (data) => {
    const res = editing ? updateVehicle(editing.id, data) : addVehicle(data)
    if (res.ok) {
      toast.success(editing ? 'Vehicle updated' : 'Vehicle added')
      setFormOpen(false)
    }
    return res
  }

  const confirmDelete = () => {
    deleteVehicle(toDelete.id)
    toast.success(`Deleted ${toDelete.reg}`)
    setToDelete(null)
  }

  return (
    <div>
      <PageHeader title="Vehicle Registry" subtitle={`${vehicles.length} vehicles in the fleet`}>
        <Button onClick={openAdd}><Icon name="plus" size={16} /> Add Vehicle</Button>
      </PageHeader>

      <div className="toolbar">
        <div className="search-box">
          <Icon name="search" size={16} className="icon" />
          <Input placeholder="Search reg no. or name…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
          {['All', 'Available', 'On Trip', 'In Shop', 'Retired'].map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: 'auto' }}>
          {['All', ...VEHICLE_TYPES].map((t) => <option key={t}>{t}</option>)}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon="truck" title="No vehicles found"
            message={vehicles.length ? 'Try adjusting your search or filters.' : 'Add your first vehicle to get started.'}
            action={<Button onClick={openAdd}><Icon name="plus" size={16} /> Add Vehicle</Button>} />
        </Card>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <SortHeader label="Registration" sortKey="reg" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortHeader label="Name / Model" sortKey="name" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortHeader label="Type" sortKey="type" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortHeader label="Capacity" sortKey="capacity" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortHeader label="Odometer" sortKey="odometer" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((v) => (
                <tr key={v.id}>
                  <td data-label="Registration"><button className="link-cell" onClick={() => setViewing(v)}>{v.reg}</button></td>
                  <td data-label="Name">{v.name}</td>
                  <td data-label="Type">{v.type}</td>
                  <td data-label="Capacity" className="text-num">{v.capacity} kg</td>
                  <td data-label="Odometer" className="text-num">{v.odometer.toLocaleString('en-IN')} km</td>
                  <td data-label="Status"><StatusPill status={v.status} /></td>
                  <td data-label="Actions">
                    <div className="cell-actions">
                      <Button size="sm" variant="secondary" onClick={() => openEdit(v)}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => setToDelete(v)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <VehicleDetail
        vehicle={viewing}
        trips={trips}
        onClose={() => setViewing(null)}
        onEdit={() => { const v = viewing; setViewing(null); openEdit(v) }}
      />
      <VehicleForm open={formOpen} initial={editing} onSubmit={handleSubmit} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={!!toDelete}
        title="Delete vehicle?"
        message={toDelete ? `This will permanently remove ${toDelete.reg} (${toDelete.name}) from the registry.` : ''}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
