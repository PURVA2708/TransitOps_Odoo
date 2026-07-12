// Complete-trip dialog: capture final odometer + fuel consumed, which
// updates the vehicle and feeds fuel-efficiency reports later.
import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'

export default function CompleteTripModal({ open, trip, vehicle, onConfirm, onClose }) {
  const [finalOdometer, setOdo] = useState('')
  const [fuelConsumed, setFuel] = useState('')
  const [error, setError] = useState('')

  const [seen, setSeen] = useState(false)
  if (open && !seen) { setOdo(vehicle ? String(vehicle.odometer) : ''); setFuel(''); setError(''); setSeen(true) }
  if (!open && seen) setSeen(false)

  const submit = (e) => {
    e.preventDefault()
    if (vehicle && Number(finalOdometer) < vehicle.odometer) {
      setError(`Final odometer can't be less than current (${vehicle.odometer} km)`) ; return
    }
    onConfirm({ finalOdometer, fuelConsumed })
  }

  return (
    <Modal
      open={open}
      title={`Complete ${trip?.id || 'Trip'}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Complete trip</Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        <p className="muted" style={{ marginTop: 0 }}>
          Completing will free the vehicle &amp; driver (back to <strong>Available</strong>).
        </p>
        <div className="form-grid">
          <Field label="Final Odometer (km)" htmlFor="odo" error={error}>
            <Input id="odo" type="number" min="0" value={finalOdometer} onChange={(e) => setOdo(e.target.value)} invalid={!!error} />
          </Field>
          <Field label="Fuel Consumed (litres)" htmlFor="fuel">
            <Input id="fuel" type="number" min="0" value={fuelConsumed} onChange={(e) => setFuel(e.target.value)} placeholder="35" />
          </Field>
        </div>
      </form>
    </Modal>
  )
}
