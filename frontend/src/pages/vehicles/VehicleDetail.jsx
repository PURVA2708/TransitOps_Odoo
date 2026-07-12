// Vehicle detail view (modal): full record + trip history for this vehicle.
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import StatusPill from '../../components/ui/StatusPill'
import { DetailList, DetailRow } from '../../components/ui/DetailList'
import Icon from '../../components/ui/Icon'

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')

export default function VehicleDetail({ vehicle, trips, onClose, onEdit }) {
  if (!vehicle) return null
  const vTrips = trips.filter((t) => t.vehicleId === vehicle.id)

  return (
    <Modal
      open={!!vehicle}
      title={`${vehicle.reg} — ${vehicle.name}`}
      onClose={onClose}
      footer={<><Button variant="ghost" onClick={onClose}>Close</Button><Button onClick={onEdit}>Edit vehicle</Button></>}
    >
      <DetailList>
        <DetailRow label="Registration">{vehicle.reg}</DetailRow>
        <DetailRow label="Model">{vehicle.name}</DetailRow>
        <DetailRow label="Type">{vehicle.type}</DetailRow>
        <DetailRow label="Status"><StatusPill status={vehicle.status} /></DetailRow>
        <DetailRow label="Max Capacity">{vehicle.capacity.toLocaleString('en-IN')} kg</DetailRow>
        <DetailRow label="Odometer">{vehicle.odometer.toLocaleString('en-IN')} km</DetailRow>
        <DetailRow label="Acquisition Cost">{inr(vehicle.cost)}</DetailRow>
      </DetailList>

      <div className="detail-section-title">Trip history ({vTrips.length})</div>
      {vTrips.length === 0
        ? <p className="muted" style={{ margin: 0 }}>No trips recorded for this vehicle.</p>
        : vTrips.map((t) => (
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
