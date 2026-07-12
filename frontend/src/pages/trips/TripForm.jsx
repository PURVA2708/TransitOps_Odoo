// Create Trip form. Only Available vehicles and Available+valid-license
// drivers appear in the dropdowns (business rules 2 & 3). Live capacity
// check as you type cargo weight.
import { useState, useMemo } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Field'
import { usePrefs } from '../../context/PrefsContext'
import { selectableVehicles, selectableDrivers } from '../../store/rules'

const empty = { source: '', dest: '', vehicleId: '', driverId: '', cargo: '', distance: '', revenue: '' }

export default function TripForm({ open, vehicles, drivers, onSubmit, onClose }) {
  const prefs = usePrefs()
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})

  const [seen, setSeen] = useState(false)
  if (open && !seen) { setForm(empty); setErrors({}); setSeen(true) }
  if (!open && seen) setSeen(false)

  const availableVehicles = useMemo(() => selectableVehicles(vehicles), [vehicles])
  const availableDrivers = useMemo(() => selectableDrivers(drivers), [drivers])
  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const er = {}
    if (!form.source.trim()) er.source = 'Source is required'
    if (!form.dest.trim()) er.dest = 'Destination is required'
    if (!form.vehicleId) er.vehicleId = 'Select a vehicle'
    if (!form.driverId) er.driverId = 'Select a driver'
    setErrors(er)
    if (Object.keys(er).length) return
    const res = onSubmit(form)
    if (res && !res.ok && res.errors) setErrors(res.errors)
  }

  const capacityHint = selectedVehicle
    ? `Capacity: ${selectedVehicle.capacity} kg` : 'Pick a vehicle to see its capacity'

  return (
    <Modal
      open={open}
      title="Create Trip"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Save as Draft</Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          <Field label="Source" required error={errors.source} htmlFor="source">
            <Input id="source" value={form.source} onChange={set('source')} invalid={!!errors.source} placeholder="Delhi Warehouse" />
          </Field>
          <Field label="Destination" required error={errors.dest} htmlFor="dest">
            <Input id="dest" value={form.dest} onChange={set('dest')} invalid={!!errors.dest} placeholder="Jaipur Store" />
          </Field>

          <Field label="Vehicle (Available only)" required error={errors.vehicleId} htmlFor="vehicleId">
            <Select id="vehicleId" value={form.vehicleId} onChange={set('vehicleId')} invalid={!!errors.vehicleId}>
              <option value="">Select a vehicle…</option>
              {availableVehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.reg} — {v.name} ({v.capacity} kg)</option>
              ))}
            </Select>
          </Field>
          <Field label="Driver (Available + valid license)" required error={errors.driverId} htmlFor="driverId">
            <Select id="driverId" value={form.driverId} onChange={set('driverId')} invalid={!!errors.driverId}>
              <option value="">Select a driver…</option>
              {availableDrivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.category}</option>
              ))}
            </Select>
          </Field>

          <Field label="Cargo Weight (kg)" required error={errors.cargo} htmlFor="cargo" hint={errors.cargo ? '' : capacityHint}>
            <Input id="cargo" type="number" min="0" value={form.cargo} onChange={set('cargo')} invalid={!!errors.cargo} placeholder="450" />
          </Field>
          <Field label="Planned Distance (km)" htmlFor="distance">
            <Input id="distance" type="number" min="0" value={form.distance} onChange={set('distance')} placeholder="280" />
          </Field>
          <Field label={`Expected Revenue (${prefs.currencySymbol})`} htmlFor="revenue" hint="Used later for ROI">
            <Input id="revenue" type="number" min="0" value={form.revenue} onChange={set('revenue')} placeholder="12000" />
          </Field>
        </div>

        {availableVehicles.length === 0 && (
          <div className="field-hint" style={{ color: 'var(--amber)' }}>No vehicles are Available right now.</div>
        )}
        {availableDrivers.length === 0 && (
          <div className="field-hint" style={{ color: 'var(--amber)' }}>No drivers are Available with a valid license.</div>
        )}
      </form>
    </Modal>
  )
}
