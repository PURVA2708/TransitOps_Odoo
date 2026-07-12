// Add / edit vehicle form (inside a modal). Owns its own validation UI.
import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Field'
import { usePrefs } from '../../context/PrefsContext'
import { VEHICLE_TYPES } from '../../store/seed'

const empty = { reg: '', name: '', type: 'Mini Truck', capacity: '', odometer: '', cost: '' }

export default function VehicleForm({ open, initial, onSubmit, onClose }) {
  const prefs = usePrefs()
  const editing = Boolean(initial)
  const [form, setForm] = useState(initial || empty)
  const [errors, setErrors] = useState({})

  // reset when opening for a different record
  const [seen, setSeen] = useState(null)
  if (open && seen !== (initial?.id || 'new')) {
    setForm(initial || empty); setErrors({}); setSeen(initial?.id || 'new')
  }
  if (!open && seen !== null) setSeen(null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const er = {}
    if (!form.reg.trim()) er.reg = 'Registration number is required'
    if (!form.name.trim()) er.name = 'Vehicle name is required'
    if (!form.capacity || Number(form.capacity) <= 0) er.capacity = 'Enter a valid capacity'
    return er
  }

  const submit = async (e) => {
    e.preventDefault()
    const er = validate()
    setErrors(er)
    if (Object.keys(er).length) return
    const res = await onSubmit(form)
    if (res && !res.ok) setErrors({ reg: res.error }) // e.g. duplicate reg
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit Vehicle' : 'Add Vehicle'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{editing ? 'Save changes' : 'Add vehicle'}</Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          <Field label="Registration No." required error={errors.reg} htmlFor="reg" hint={editing ? '' : 'Must be unique'}>
            <Input id="reg" value={form.reg} onChange={set('reg')} invalid={!!errors.reg} placeholder="RJ14-GA-2025" />
          </Field>
          <Field label="Vehicle Name / Model" required error={errors.name} htmlFor="name">
            <Input id="name" value={form.name} onChange={set('name')} invalid={!!errors.name} placeholder="Tata Ace" />
          </Field>
          <Field label="Type" htmlFor="type">
            <Select id="type" value={form.type} onChange={set('type')}>
              {VEHICLE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          <Field label="Max Load Capacity (kg)" required error={errors.capacity} htmlFor="capacity">
            <Input id="capacity" type="number" min="0" value={form.capacity} onChange={set('capacity')} invalid={!!errors.capacity} placeholder="750" />
          </Field>
          <Field label="Odometer (km)" htmlFor="odometer">
            <Input id="odometer" type="number" min="0" value={form.odometer} onChange={set('odometer')} placeholder="45200" />
          </Field>
          <Field label={`Acquisition Cost (${prefs.currencySymbol})`} htmlFor="cost">
            <Input id="cost" type="number" min="0" value={form.cost} onChange={set('cost')} placeholder="600000" />
          </Field>
        </div>
      </form>
    </Modal>
  )
}
