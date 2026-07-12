import { useState, useMemo } from 'react'
import { useAppData } from '../../store/AppData'
import { usePrefs } from '../../context/PrefsContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import PageHeader from '../../components/ui/PageHeader'
import Button from '../../components/ui/Button'
import Icon from '../../components/ui/Icon'
import Modal from '../../components/ui/Modal'
import { Field, Input, Select } from '../../components/ui/Field'
import './FuelExpense.css'

// Local initial state for demo
const initialExpenses = [
  { id: 'E-1', vehicleId: 'v1', date: '2026-07-10', type: 'Fuel', amount: 3000, notes: 'Full tank' },
  { id: 'E-2', vehicleId: 'v2', date: '2026-07-11', type: 'Toll', amount: 450, notes: 'Highway toll' }
]

function ExpenseForm({ open, initial, onSubmit, onClose, vehicles }) {
  const prefs = usePrefs()
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
          <Field label={`Amount (${prefs.currencySymbol})`} required error={errors.amount} htmlFor="amount">
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

// One list panel (Fuel or Expenses) with its own running total.
function CostPanel({ kind, icon, title, records, total, vehicles, prefs, onEdit }) {
  return (
    <section className={`fe-panel ${kind}`}>
      <div className="fe-panel-head">
        <div className="fe-panel-title">
          <span className="fe-ico"><Icon name={icon} size={17} /></span>{title}
        </div>
        <div className="fe-panel-total-wrap">
          <div className="fe-panel-total">{prefs.money(total)}</div>
          <div className="fe-panel-total-label">{records.length} {records.length === 1 ? 'entry' : 'entries'}</div>
        </div>
      </div>
      <div className="fe-panel-body">
        {records.length === 0 ? (
          <div className="fe-empty">No {title.toLowerCase()} logged yet.</div>
        ) : records.map((r) => {
          const v = vehicles.find((v) => v.id === r.vehicleId)
          return (
            <div className="fe-row" key={r.id}>
              <div className="fe-row-main">
                <div className="fe-row-top">
                  <span className="fe-row-veh">{v ? v.reg : r.vehicleId}</span>
                  <span className="fe-row-type">{r.type}</span>
                </div>
                {r.notes && <div className="fe-row-notes">{r.notes}</div>}
              </div>
              <div className="fe-row-side">
                <span className="fe-row-amt">{prefs.money(r.amount)}</span>
                <span className="fe-row-date">{r.date || '—'}</span>
              </div>
              <button type="button" className="fe-row-edit" onClick={() => onEdit(r)}>Edit</button>
            </div>
          )
        })}
      </div>
    </section>
  )
}

const csvCell = (val) => {
  const s = String(val ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export default function FuelExpense() {
  const { vehicles, expenses: records, addExpense, updateExpense } = useAppData()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  // Data scoping: a Driver sees only the expenses they logged; other roles
  // (Manager, Safety Officer, Financial Analyst) see everything.
  const scoped = useMemo(() => {
    if (user?.role === 'Driver') return records.filter((r) => r.createdBy === user.name)
    return records
  }, [records, user])

  const searched = useMemo(() => scoped.filter((r) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    const v = vehicles.find((v) => v.id === r.vehicleId)
    return (r.notes || '').toLowerCase().includes(q) || (v && v.reg.toLowerCase().includes(q))
  }), [scoped, query, vehicles])

  // 50 : 50 split — Fuel on one side, every other expense type on the other.
  const fuelRecords = useMemo(() => searched.filter((r) => r.type === 'Fuel'), [searched])
  const expenseRecords = useMemo(() => searched.filter((r) => r.type !== 'Fuel'), [searched])
  const sum = (list) => list.reduce((acc, r) => acc + Number(r.amount || 0), 0)
  const fuelTotal = sum(fuelRecords)
  const expenseTotal = sum(expenseRecords)
  const grandTotal = fuelTotal + expenseTotal

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
      <PageHeader title="Fuel & Expenses" subtitle="Fuel and other running costs, side by side">
        <Button variant="secondary" onClick={downloadCsv}><Icon name="download" size={16} /> Export CSV</Button>
        <Button onClick={openAdd}><Icon name="plus" size={16} /> Log Expense</Button>
      </PageHeader>

      <div className="toolbar">
        <div className="search-box">
          <Icon name="search" size={16} className="icon" />
          <Input placeholder="Search vehicle or notes…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="fe-split">
        <CostPanel kind="fuel" icon="fuel" title="Fuel"
          records={fuelRecords} total={fuelTotal} vehicles={vehicles} prefs={prefs} onEdit={openEdit} />
        <CostPanel kind="expense" icon="coins" title="Expenses"
          records={expenseRecords} total={expenseTotal} vehicles={vehicles} prefs={prefs} onEdit={openEdit} />
      </div>

      <div className="fe-grand">
        <div className="fe-grand-item">
          <span className="fe-grand-label">Fuel</span>
          <span className="fe-grand-value">{prefs.money(fuelTotal)}</span>
        </div>
        <div className="fe-grand-item">
          <span className="fe-grand-label">Expenses</span>
          <span className="fe-grand-value">{prefs.money(expenseTotal)}</span>
        </div>
        <div className="fe-grand-spacer" />
        <div className="fe-grand-item total">
          <span className="fe-grand-label">Combined total</span>
          <span className="fe-grand-value">{prefs.money(grandTotal)}</span>
        </div>
      </div>

      <ExpenseForm open={formOpen} initial={editing} onSubmit={handleSubmit} onClose={() => setFormOpen(false)} vehicles={vehicles} />
    </div>
  )
}
