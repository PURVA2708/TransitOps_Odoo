// Status values + their pill colour class. Single source of truth so
// every entity renders the SAME colour for the SAME meaning.

export const VEHICLE_STATUS = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  IN_SHOP: 'In Shop',
  RETIRED: 'Retired',
}
export const DRIVER_STATUS = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  OFF_DUTY: 'Off Duty',
  SUSPENDED: 'Suspended',
}
export const TRIP_STATUS = {
  DRAFT: 'Draft',
  DISPATCHED: 'Dispatched',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}
// Ordered lifecycle stages for the live route board (Delivered == Completed).
// Matches the backend trip state machine (Draft → Dispatched → Completed).
export const TRIP_STAGES = ['Draft', 'Dispatched', 'Delivered']
export function tripStageIndex(status) {
  if (status === 'Draft') return 0
  if (status === 'Dispatched') return 1
  if (status === 'Completed') return 2
  return -1 // Cancelled / unknown
}
export const MAINTENANCE_STATUS = {
  ACTIVE: 'Active',
  CLOSED: 'Closed',
}

// Map any status label -> pill colour variant (green|blue|amber|red|gray)
export const STATUS_VARIANT = {
  Available: 'green', Completed: 'green', Closed: 'green', Delivered: 'green',
  'On Trip': 'blue', Dispatched: 'blue', Active: 'blue', Shipped: 'blue',
  'In Shop': 'amber',
  Retired: 'red', Suspended: 'red', Cancelled: 'red', Expired: 'red',
  Draft: 'gray', 'Off Duty': 'gray',
}

export function variantFor(status) {
  return STATUS_VARIANT[status] || 'gray'
}
