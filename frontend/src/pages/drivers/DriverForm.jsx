// Add / edit driver form (modal).
import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Field'
import { LICENSE_CATEGORIES } from '../../store/seed'

const empty = { name: '', license: '', category: 'LMV', expiry: '', contact: '', score: '' }

export default function DriverForm({ open, initial, onSubmit, onClose }) {
  const editing = Boolean(initial)
  const [form, setForm] = useState(initial || empty)
  const [errors, setErrors] = useState({})

  const [seen, setSeen] = useState(null)
  if (open && seen !== (initial?.id || 'new')) {
    setForm(initial || empty); setErrors({}); setSeen(initial?.id || 'new')
  }
  if (!open && seen !== null) setSeen(null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const er = {}
    if (!form.name.trim()) er.name = 'Name is required'
    if (!form.license.trim()) er.license = 'License number is required'
    if (!form.expiry) er.expiry = 'License expiry date is required'
    if (!form.contact.trim()) er.contact = 'Contact number is required'
    if (form.score !== '' && (Number(form.score) < 0 || Number(form.score) > 100)) er.score = 'Score must be 0–100'
    return er
  }

  const submit = async (e) => {
    e.preventDefault()
    const er = validate()
    setErrors(er)
    if (Object.keys(er).length) return
    const res = await onSubmit(form)
    if (res && !res.ok) setErrors({ license: res.error })
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit Driver' : 'Add Driver'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>{editing ? 'Save changes' : 'Add driver'}</Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          <Field label="Driver Name" required error={errors.name} htmlFor="name">
            <Input id="name" value={form.name} onChange={set('name')} invalid={!!errors.name} placeholder="Alex Kumar" />
          </Field>
          <Field label="License Number" required error={errors.license} htmlFor="license">
            <Input id="license" value={form.license} onChange={set('license')} invalid={!!errors.license} placeholder="DL-0420256789" />
          </Field>
          <Field label="License Category" htmlFor="category">
            <Select id="category" value={form.category} onChange={set('category')}>
              {LICENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="License Expiry" required error={errors.expiry} htmlFor="expiry" hint="Expired license = cannot be assigned">
            <Input id="expiry" type="date" value={form.expiry} onChange={set('expiry')} invalid={!!errors.expiry} />
          </Field>
          <Field label="Contact Number" required error={errors.contact} htmlFor="contact">
            <Input id="contact" value={form.contact} onChange={set('contact')} invalid={!!errors.contact} placeholder="9800000001" />
          </Field>
          <Field label="Safety Score (0–100)" error={errors.score} htmlFor="score">
            <Input id="score" type="number" min="0" max="100" value={form.score} onChange={set('score')} invalid={!!errors.score} placeholder="85" />
          </Field>
        </div>
      </form>
    </Modal>
  )
}
