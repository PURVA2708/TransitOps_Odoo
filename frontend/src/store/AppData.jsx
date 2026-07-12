// Central client-side data store for TransitOps (vehicles, drivers, trips).
// Holds state + all business-rule actions (unique reg, dispatch validation,
// automatic status transitions). Persists to localStorage for the demo.
// To go live: replace the action bodies with Supabase calls — the shapes
// and rules stay identical.
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { SEED } from './seed'
import { validateTrip, nextId } from './rules'

const KEY = 'transitops_data_v1'
const AppDataCtx = createContext(null)
export const useAppData = () => useContext(AppDataCtx)

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return SEED
}

export function AppDataProvider({ children }) {
  const [state, setState] = useState(load)

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
  }, [state])

  const resetDemo = useCallback(() => setState(SEED), [])

  // ---------- Vehicles ----------
  const addVehicle = useCallback((data) => {
    let result = { ok: true }
    setState((s) => {
      const dup = s.vehicles.some((v) => v.reg.toLowerCase() === data.reg.trim().toLowerCase())
      if (dup) { result = { ok: false, error: `Registration ${data.reg} already exists` }; return s }
      const vehicle = {
        id: nextId('v', s.vehicles),
        reg: data.reg.trim(),
        name: data.name.trim(),
        type: data.type,
        capacity: Number(data.capacity),
        odometer: Number(data.odometer) || 0,
        cost: Number(data.cost) || 0,
        status: 'Available',
      }
      return { ...s, vehicles: [vehicle, ...s.vehicles] }
    })
    return result
  }, [])

  const updateVehicle = useCallback((id, data) => {
    let result = { ok: true }
    setState((s) => {
      const dup = s.vehicles.some((v) => v.id !== id && v.reg.toLowerCase() === data.reg.trim().toLowerCase())
      if (dup) { result = { ok: false, error: `Registration ${data.reg} already exists` }; return s }
      return {
        ...s,
        vehicles: s.vehicles.map((v) => v.id === id ? {
          ...v,
          reg: data.reg.trim(), name: data.name.trim(), type: data.type,
          capacity: Number(data.capacity), odometer: Number(data.odometer) || 0,
          cost: Number(data.cost) || 0,
          status: data.status || v.status,
        } : v),
      }
    })
    return result
  }, [])

  const deleteVehicle = useCallback((id) => {
    setState((s) => ({ ...s, vehicles: s.vehicles.filter((v) => v.id !== id) }))
  }, [])

  // ---------- Drivers ----------
  const addDriver = useCallback((data) => {
    setState((s) => {
      const driver = {
        id: nextId('d', s.drivers),
        name: data.name.trim(), license: data.license.trim(), category: data.category,
        expiry: data.expiry, contact: data.contact.trim(),
        score: Number(data.score) || 0, status: 'Available',
      }
      return { ...s, drivers: [driver, ...s.drivers] }
    })
    return { ok: true }
  }, [])

  const updateDriver = useCallback((id, data) => {
    setState((s) => ({
      ...s,
      drivers: s.drivers.map((d) => d.id === id ? {
        ...d, name: data.name.trim(), license: data.license.trim(), category: data.category,
        expiry: data.expiry, contact: data.contact.trim(), score: Number(data.score) || 0,
        status: data.status || d.status,
      } : d),
    }))
    return { ok: true }
  }, [])

  const deleteDriver = useCallback((id) => {
    setState((s) => ({ ...s, drivers: s.drivers.filter((d) => d.id !== id) }))
  }, [])

  // Safety Officer actions
  const setDriverStatus = useCallback((id, status) => {
    setState((s) => ({ ...s, drivers: s.drivers.map((d) => d.id === id ? { ...d, status } : d) }))
  }, [])

  // ---------- Trips (core state machine) ----------
  // Create as Draft after passing the 5 checks.
  const createTrip = useCallback((data) => {
    let result = { ok: true }
    setState((s) => {
      const vehicle = s.vehicles.find((v) => v.id === data.vehicleId)
      const driver = s.drivers.find((d) => d.id === data.driverId)
      const { ok, errors } = validateTrip({ vehicle, driver, cargo: data.cargo })
      if (!ok) { result = { ok: false, errors }; return s }
      const trip = {
        id: nextId('TR-', s.trips),
        source: data.source.trim(), dest: data.dest.trim(),
        vehicleId: data.vehicleId, driverId: data.driverId,
        cargo: Number(data.cargo), distance: Number(data.distance) || 0,
        revenue: Number(data.revenue) || 0, status: 'Draft',
      }
      return { ...s, trips: [trip, ...s.trips] }
    })
    return result
  }, [])

  // Draft -> Dispatched : vehicle + driver both become On Trip.
  const dispatchTrip = useCallback((tripId) => {
    let result = { ok: true }
    setState((s) => {
      const trip = s.trips.find((t) => t.id === tripId)
      if (!trip || trip.status !== 'Draft') { result = { ok: false, error: 'Trip is not in Draft' }; return s }
      const vehicle = s.vehicles.find((v) => v.id === trip.vehicleId)
      const driver = s.drivers.find((d) => d.id === trip.driverId)
      const { ok, errors } = validateTrip({ vehicle, driver, cargo: trip.cargo })
      if (!ok) { result = { ok: false, error: Object.values(errors)[0] }; return s }
      return {
        ...s,
        trips: s.trips.map((t) => t.id === tripId ? { ...t, status: 'Dispatched' } : t),
        vehicles: s.vehicles.map((v) => v.id === trip.vehicleId ? { ...v, status: 'On Trip' } : v),
        drivers: s.drivers.map((d) => d.id === trip.driverId ? { ...d, status: 'On Trip' } : d),
      }
    })
    return result
  }, [])

  // Dispatched -> Shipped : goods are in transit (vehicle + driver stay On Trip).
  const shipTrip = useCallback((tripId) => {
    let result = { ok: true }
    setState((s) => {
      const trip = s.trips.find((t) => t.id === tripId)
      if (!trip || trip.status !== 'Dispatched') { result = { ok: false, error: 'Trip is not dispatched' }; return s }
      return { ...s, trips: s.trips.map((t) => t.id === tripId ? { ...t, status: 'Shipped' } : t) }
    })
    return result
  }, [])

  // Dispatched/Shipped -> Completed (Delivered) : restore Available, update odometer + fuel.
  const completeTrip = useCallback((tripId, { finalOdometer, fuelConsumed } = {}) => {
    let result = { ok: true }
    setState((s) => {
      const trip = s.trips.find((t) => t.id === tripId)
      if (!trip || (trip.status !== 'Dispatched' && trip.status !== 'Shipped')) { result = { ok: false, error: 'Trip is not in transit' }; return s }
      return {
        ...s,
        trips: s.trips.map((t) => t.id === tripId ? {
          ...t, status: 'Completed',
          finalOdometer: Number(finalOdometer) || undefined,
          fuelConsumed: Number(fuelConsumed) || undefined,
        } : t),
        vehicles: s.vehicles.map((v) => v.id === trip.vehicleId ? {
          ...v, status: 'Available',
          odometer: Number(finalOdometer) > v.odometer ? Number(finalOdometer) : v.odometer,
        } : v),
        drivers: s.drivers.map((d) => d.id === trip.driverId ? { ...d, status: 'Available' } : d),
      }
    })
    return result
  }, [])

  // Any time -> Cancelled : restore vehicle + driver to Available.
  const cancelTrip = useCallback((tripId) => {
    setState((s) => {
      const trip = s.trips.find((t) => t.id === tripId)
      if (!trip || !['Draft', 'Dispatched', 'Shipped'].includes(trip.status)) return s
      const wasActive = trip.status === 'Dispatched' || trip.status === 'Shipped'
      return {
        ...s,
        trips: s.trips.map((t) => t.id === tripId ? { ...t, status: 'Cancelled' } : t),
        vehicles: s.vehicles.map((v) => v.id === trip.vehicleId && wasActive ? { ...v, status: 'Available' } : v),
        drivers: s.drivers.map((d) => d.id === trip.driverId && wasActive ? { ...d, status: 'Available' } : d),
      }
    })
    return { ok: true }
  }, [])

  const value = useMemo(() => ({
    ...state,
    addVehicle, updateVehicle, deleteVehicle,
    addDriver, updateDriver, deleteDriver, setDriverStatus,
    createTrip, dispatchTrip, shipTrip, completeTrip, cancelTrip,
    resetDemo,
  }), [state, addVehicle, updateVehicle, deleteVehicle, addDriver, updateDriver,
       deleteDriver, setDriverStatus, createTrip, dispatchTrip, shipTrip, completeTrip, cancelTrip, resetDemo])

  return <AppDataCtx.Provider value={value}>{children}</AppDataCtx.Provider>
}
