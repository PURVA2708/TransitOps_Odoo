// Pure business-rule helpers — the "heart" of TransitOps.
// No React here; just logic that the store and pages call.

export function isLicenseValid(driver, today = new Date()) {
  if (!driver?.expiry) return false
  // valid if expiry date is today or later
  return new Date(driver.expiry) >= new Date(today.toDateString())
}

// Whole days from today until a date (negative = already past).
export function daysUntil(dateStr, today = new Date()) {
  const d = new Date(dateStr)
  const t = new Date(today.toDateString())
  return Math.ceil((d - t) / 86400000)
}

// Split drivers into expired vs expiring-soon (within `withinDays`).
export function licenseAlerts(drivers, withinDays = 30) {
  const expired = [], expiring = []
  for (const d of drivers) {
    const days = daysUntil(d.expiry)
    if (days < 0) expired.push({ ...d, days })
    else if (days <= withinDays) expiring.push({ ...d, days })
  }
  return { expired, expiring }
}

// A vehicle can be picked for a trip only when Available.
export function selectableVehicles(vehicles) {
  return vehicles.filter((v) => v.status === 'Available')
}

// A driver can be assigned only when Available AND license not expired
// AND not suspended.
export function selectableDrivers(drivers) {
  return drivers.filter((d) => d.status === 'Available' && isLicenseValid(d))
}

// The 5 dispatch-validation checks. Returns { ok, errors: {field: msg} }.
export function validateTrip({ vehicle, driver, cargo }) {
  const errors = {}
  if (!vehicle) errors.vehicleId = 'Select a vehicle'
  else if (vehicle.status !== 'Available') errors.vehicleId = 'Vehicle is not available'

  if (!driver) errors.driverId = 'Select a driver'
  else if (driver.status === 'Suspended') errors.driverId = 'Driver is suspended'
  else if (!isLicenseValid(driver)) errors.driverId = 'Driver license has expired'
  else if (driver.status !== 'Available') errors.driverId = 'Driver is not available'

  const c = Number(cargo)
  if (!c || c <= 0) errors.cargo = 'Enter cargo weight'
  else if (vehicle && c > vehicle.capacity) {
    errors.cargo = `Cargo (${c} kg) exceeds capacity (${vehicle.capacity} kg)`
  }

  return { ok: Object.keys(errors).length === 0, errors }
}

// Dashboard / KPI computations.
export function computeKpis({ vehicles, drivers, trips }) {
  const vc = (s) => vehicles.filter((v) => v.status === s).length
  const dc = (s) => drivers.filter((d) => d.status === s).length
  const tc = (s) => trips.filter((t) => t.status === s).length

  const onTrip = vc('On Trip')
  const usable = vehicles.filter((v) => v.status !== 'Retired').length
  const utilization = usable ? Math.round((onTrip / usable) * 1000) / 10 : 0

  return {
    activeVehicles: onTrip,
    availableVehicles: vc('Available'),
    inMaintenance: vc('In Shop'),
    activeTrips: tc('Dispatched'),
    pendingTrips: tc('Draft'),
    driversOnDuty: dc('On Trip'),
    fleetUtilization: utilization,
    totalVehicles: vehicles.length,
    usableVehicles: usable,
  }
}

export const nextId = (prefix, list, key = 'id') => {
  const nums = list
    .map((x) => parseInt(String(x[key]).replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 1000
  return `${prefix}${max + 1}`
}
