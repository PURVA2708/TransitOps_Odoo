import { useState, useMemo } from 'react'
import { useAppData } from '../../store/AppData'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import Modal from '../../components/ui/Modal'
import { Field, Input, Select } from '../../components/ui/Field'

// Local initial state for demo
const initialExpenses = [
  { id: 'E-1', vehicleId: 'v1', date: '2026-07-10', type: 'Fuel', amount: 3000, notes: 'Full tank' },
  { id: 'E-2', vehicleId: 'v2', date: '2026-07-11', type: 'Toll', amount: 450, notes: 'Highway toll' }
]

function ExpenseForm({ open, initial, onSubmit, onClose, vehicles }) {
  const editing = Boolean(initial)
  const [form, setForm] = useState(initial || { vehicleId: '', date: '', type: 'Fuel', amount: '', notes: '' })
  const [errors, setErrors] = useState({})

  const [seen, setSeen] = useState(null)
  if (open && seen !== (initial?.id || 'new')) {
    setForm(initial || { vehicleId: vehicles[0]?.id || '', date: '', type: 'Fuel', amount: '', notes: '' })
    setErrors({})
    setSeen(initial?.id || 'new')
  }
  if (!open && seen !== null) setSeen(null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const er = {}
    if (!form.vehicleId) er.vehicleId = 'Vehicle is required'
    if (!form.amount || Number(form.amount) <= 0) er.amount = 'Enter a valid amount'
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
      title={editing ? 'Edit Expense' : 'Log Expense'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{editing ? 'Save changes' : 'Add expense'}</Button>
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
          <Field label="Expense Type" htmlFor="type">
            <Select id="type" value={form.type} onChange={set('type')}>
              <option>Fuel</option>
              <option>Toll</option>
              <option>Maintenance</option>
              <option>Other</option>
            </Select>
          </Field>
          <Field label="Amount (₹)" required error={errors.amount} htmlFor="amount">
            <Input id="amount" type="number" min="0" value={form.amount} onChange={set('amount')} invalid={!!errors.amount} placeholder="1000" />
          </Field>
          <Field label="Notes" htmlFor="notes">
            <Input id="notes" value={form.notes} onChange={set('notes')} placeholder="e.g., Highway toll" />
          </Field>
        </div>
      </form>
    </Modal>
  )
}

export default function FuelExpense() {
  const { vehicles, expenses: records, addExpense, updateExpense } = useAppData()
  const toast = useToast()
  
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const filtered = useMemo(() => records.filter((r) => {
    const q = query.trim().toLowerCase()
    const matchesType = typeFilter === 'All' || r.type === typeFilter
    if (!matchesType) return false
    if (!q) return true
    const v = vehicles.find(v => v.id === r.vehicleId)
    return r.notes.toLowerCase().includes(q) || (v && v.reg.toLowerCase().includes(q))
  }), [records, query, typeFilter, vehicles])

  const openAdd = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (r) => { setEditing(r); setFormOpen(true) }

  const handleSubmit = async (data) => {
    if (editing) {
      const res = await updateExpense(editing.id, data)
      if (res.ok) {
        toast.success('Expense updated')
        setFormOpen(false)
      } else {
        toast.error(res.error || 'Failed to update expense')
      }
    } else {
      const res = await addExpense(data)
      if (res.ok) {
        toast.success('Expense logged')
        setFormOpen(false)
      } else {
        toast.error(res.error || 'Failed to log expense')
      }
    }
  }


  return (
    <div>
      <PageHeader title="Fuel & Expenses" subtitle="Track fleet running costs">
        <Button onClick={openAdd}><Icon name="plus" size={16} /> Log Expense</Button>
      </PageHeader>

      <div className="toolbar">
        <div className="search-box">
          <Icon name="search" size={16} className="icon" />
          <Input placeholder="Search vehicle or notes…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: 'auto' }}>
          {['All', 'Fuel', 'Toll', 'Maintenance', 'Other'].map((t) => <option key={t}>{t}</option>)}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon="clipboard" title="No expenses found"
            message={records.length ? 'Try adjusting your search or filters.' : 'Log your first expense to get started.'}
            action={<Button onClick={openAdd}><Icon name="plus" size={16} /> Log Expense</Button>} />
        </Card>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Notes</th>
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
                    <td data-label="Type">{r.type}</td>
                    <td data-label="Amount" className="text-num">₹{Number(r.amount || 0).toLocaleString('en-IN')}</td>
                    <td data-label="Notes">{r.notes}</td>
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

      <ExpenseForm open={formOpen} initial={editing} onSubmit={handleSubmit} onClose={() => setFormOpen(false)} vehicles={vehicles} />
    </div>
  )
}
