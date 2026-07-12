// Shared status pill — renders the correct warm colour for any status.
import { variantFor } from '../../constants/statuses'

export default function StatusPill({ status }) {
  const variant = variantFor(status)
  return <span className={`pill pill-${variant}`}>{status}</span>
}
