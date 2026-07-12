import { useState, useMemo } from 'react'
import { useAppData } from '../../store/AppData'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import Card from '../../components/ui/Card'
import StatusPill from '../../components/ui/StatusPill'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { Field, Input, Select } from '../../components/ui/Field'

// Local initial state for demo
const initialMaintenance = [
  { id: 'M-1', vehicleId: 'v1', date: '2026-07-10', description: 'Oil Change', cost: 1500, status: 'Completed' },
  { id: 'M-2', vehicleId: 'v2', date: '2026-07-11', description: 'Tire Replacement', cost: 8000, status: 'In Shop' }
]

function MaintenanceForm({ open, initial, onSubmit, onClose, vehicles }) {
  const editing = Boolean(initial)
  const [form, setForm] = useState(initial || { vehicleId: '', date: '', description: '', cost: '', status: 'In Shop' })
  const [errors, setErrors] = useState({})

  const [seen, setSeen] = useState(null)
  if (open && seen !== (initial?.id || 'new')) {
    setForm(initial || { vehicleId: vehicles[0]?.id || '', date: '', description: '', cost: '', status: 'In Shop' })
    setErrors({})
    setSeen(initial?.id || 'new')
  }
  if (!open && seen !== null) setSeen(null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const er = {}
    if (!form.vehicleId) er.vehicleId = 'Vehicle is required'
    if (!form.description.trim()) er.description = 'Description is required'
    return er
  }

  const submit = (e) => {
    e.preventDefault()
    const er = validate()
    setErrors(er)
    if (Object.keys(er).length) return
    onSubmit(form)
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit Maintenance Record' : 'Add Maintenance'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{editing ? 'Save changes' : 'Add record'}</Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          <Field label="Vehicle" required error={errors.vehicleId} htmlFor="vehicleId">
            <Select id="vehicleId" value={form.vehicleId} onChange={set('vehicleId')} invalid={!!errors.vehicleId}>
              <option value="">Select a vehicle...</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.reg} - {v.name}</option>)}
            </Select>
          </Field>
          <Field label="Date" htmlFor="date">
            <Input id="date" type="date" value={form.date} onChange={set('date')} />
          </Field>
          <Field label="Description" required error={errors.description} htmlFor="description">
            <Input id="description" value={form.description} onChange={set('description')} placeholder="e.g., Oil Change" />
          </Field>
          <Field label="Cost (₹)" htmlFor="cost">
            <Input id="cost" type="number" min="0" value={form.cost} onChange={set('cost')} placeholder="1500" />
          </Field>
          <Field label="Status" htmlFor="status">
            <Select id="status" value={form.status} onChange={set('status')}>
              <option>In Shop</option>
              <option>Completed</option>
            </Select>
          </Field>
        </div>
      </form>
    </Modal>
  )
}

export default function Maintenance() {
  const { vehicles, maintenance: records, addMaintenance, updateMaintenance } = useAppData()
  const toast = useToast()
  
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const filtered = useMemo(() => records.filter((r) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    const v = vehicles.find(v => v.id === r.vehicleId)
    return r.description.toLowerCase().includes(q) || (v && v.reg.toLowerCase().includes(q))
  }), [records, query, vehicles])

  const openAdd = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (r) => { setEditing(r); setFormOpen(true) }

  const handleSubmit = async (data) => {
    if (editing) {
      const res = await updateMaintenance(editing.id, data)
      if (res.ok) {
        toast.success('Record updated')
        setFormOpen(false)
      } else {
        toast.error(res.error || 'Failed to update record')
      }
    } else {
      const res = await addMaintenance(data)
      if (res.ok) {
        toast.success('Record added')
        setFormOpen(false)
      } else {
        toast.error(res.error || 'Failed to add record')
      }
    }
  }


  return (
    <div>
      <PageHeader title="Maintenance" subtitle="Track vehicle repairs and servicing">
        <Button onClick={openAdd}><Icon name="plus" size={16} /> Add Record</Button>
      </PageHeader>

      <div className="toolbar">
        <div className="search-box">
          <Icon name="search" size={16} className="icon" />
          <Input placeholder="Search vehicle or description…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon="wrench" title="No records found"
            message={records.length ? 'Try adjusting your search.' : 'Log your first maintenance record to get started.'}
            action={<Button onClick={openAdd}><Icon name="plus" size={16} /> Add Record</Button>} />
        </Card>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Date</th>
                <th>Description</th>
                <th>Cost</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const v = vehicles.find(v => v.id === r.vehicleId)
                return (
                  <tr key={r.id}>
                    <td data-label="Vehicle"><strong>{v ? v.reg : r.vehicleId}</strong></td>
                    <td data-label="Date">{r.date}</td>
                    <td data-label="Description">{r.description}</td>
                    <td data-label="Cost" className="text-num">₹{Number(r.cost || 0).toLocaleString('en-IN')}</td>
                    <td data-label="Status"><StatusPill status={r.status} /></td>
                    <td data-label="Actions">
                      <div className="cell-actions">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>Edit</Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <MaintenanceForm open={formOpen} initial={editing} onSubmit={handleSubmit} onClose={() => setFormOpen(false)} vehicles={vehicles} />
    </div>
  )
}
