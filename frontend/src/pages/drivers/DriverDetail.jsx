// Driver detail view (modal): profile + license status + trip history.
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import StatusPill from '../../components/ui/StatusPill'
import { DetailList, DetailRow } from '../../components/ui/DetailList'
import Icon from '../../components/ui/Icon'
import { isLicenseValid } from '../../store/rules'

const fmtDate = (s) => new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export default function DriverDetail({ driver, trips, onClose, onEdit }) {
  if (!driver) return null
  const dTrips = trips.filter((t) => t.driverId === driver.id)
  const valid = isLicenseValid(driver)

  return (
    <Modal
      open={!!driver}
      title={driver.name}
      onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Close</Button><Button onClick={onEdit}>Edit driver</Button></>}
    >
      <DetailList>
        <DetailRow label="Name">{driver.name}</DetailRow>
        <DetailRow label="Status"><StatusPill status={driver.status} /></DetailRow>
        <DetailRow label="License No.">{driver.license}</DetailRow>
        <DetailRow label="Category">{driver.category}</DetailRow>
        <DetailRow label="License Expiry">
          <span className={valid ? '' : 'driver-expired'}>{fmtDate(driver.expiry)}{!valid && ' · expired'}</span>
        </DetailRow>
        <DetailRow label="Safety Score">{driver.score}/100</DetailRow>
        <DetailRow label="Contact">{driver.contact}</DetailRow>
      </DetailList>

      <div className="detail-section-title">Trip history ({dTrips.length})</div>
      {dTrips.length === 0
        ? <p className="muted" style={{ margin: 0 }}>No trips recorded for this driver.</p>
        : dTrips.map((t) => (
            <div key={t.id} className="detail-trip">
              <span className="detail-trip-route">
                <strong>{t.id}</strong> · {t.source} <Icon name="chevronRight" size={12} /> {t.dest}
              </span>
              <StatusPill status={t.status} />
            </div>
          ))}
    </Modal>
  )
}
