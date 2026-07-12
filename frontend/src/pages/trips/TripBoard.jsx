// Live route board. Each active trip is a card showing its route
// (origin → destination) with a truck that glides along the road as the trip
// advances through the lifecycle: Draft → Dispatched → Shipped → Delivered.
import Icon from '../../components/ui/Icon'
import StatusPill from '../../components/ui/StatusPill'
import { usePrefs } from '../../context/PrefsContext'
import { TRIP_STAGES, tripStageIndex } from '../../constants/statuses'

function RouteCard({ trip }) {
  const prefs = usePrefs()
  const idx = tripStageIndex(trip.status)          // -1..3
  const progress = idx < 0 ? 0 : (idx / (TRIP_STAGES.length - 1)) * 100

  return (
    <div className={`route-card stage-${idx}`}>
      <div className="route-card-head">
        <span className="route-id">{trip.id}</span>
        <StatusPill status={trip.status === 'Completed' ? 'Delivered' : trip.status} />
      </div>

      {/* Origin → truck on the road → destination */}
      <div className="route-line">
        <div className="route-ep">
          <span className="route-dot origin" />
          <span className="route-city">{trip.source}</span>
        </div>

        <div className="route-road">
          <span className="route-road-fill" style={{ width: `${progress}%` }} />
          <span className="route-truck" style={{ left: `${progress}%` }}>
            <Icon name="truck" size={18} />
          </span>
        </div>

        <div className="route-ep end">
          <span className="route-dot dest" />
          <span className="route-city">{trip.dest}</span>
        </div>
      </div>

      {/* Lifecycle stepper */}
      <ol className="route-steps" aria-label="Trip progress">
        {TRIP_STAGES.map((stage, i) => {
          const state = idx < 0 ? 'cancelled' : i < idx ? 'done' : i === idx ? 'current' : 'todo'
          return (
            <li key={stage} className={`route-step ${state}`}>
              <span className="route-step-dot">{state === 'done' ? <Icon name="check" size={12} /> : i + 1}</span>
              <span className="route-step-label">{stage}</span>
            </li>
          )
        })}
      </ol>

      {/* Meta */}
      <div className="route-meta">
        <span><Icon name="truck" size={14} /> {trip.vehicle?.reg || '—'}</span>
        <span><Icon name="driver" size={14} /> {trip.driver?.name || '—'}</span>
        <span><Icon name="fleet" size={14} /> {trip.cargo} kg</span>
        <span><Icon name="route" size={14} /> {prefs.dist(trip.distance)}</span>
      </div>
    </div>
  )
}

export default function TripBoard({ trips }) {
  // Show live shipments — everything except cancelled — with active trips first.
  const live = trips
    .filter((t) => t.status !== 'Cancelled')
    .sort((a, b) => tripStageIndex(a.status) - tripStageIndex(b.status))

  if (live.length === 0) return null

  return (
    <section className="trip-board">
      <div className="trip-board-head">
        <h2><Icon name="route" size={18} /> Live Route Board</h2>
        <span className="muted trip-board-count">{live.length} active {live.length === 1 ? 'shipment' : 'shipments'}</span>
      </div>
      <div className="route-grid">
        {live.map((t) => <RouteCard key={t.id} trip={t} />)}
      </div>
    </section>
  )
}
