// Central data store for TransitOps (vehicles, drivers, trips, maintenance, expenses).
// Syncs dynamically with the Supabase Postgres backend.
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { supabase, supabaseReady } from '../lib/supabaseClient'

const AppDataCtx = createContext(null)
export const useAppData = () => useContext(AppDataCtx)

// ---------- Database Model Mappings ----------
const mapTripFromDb = (t) => ({
  id: t.id,
  source: t.source,
  dest: t.dest,
  vehicleId: t.vehicle_id,
  driverId: t.driver_id,
  cargo: Number(t.cargo),
  distance: Number(t.distance) || 0,
  revenue: Number(t.revenue) || 0,
  status: t.status,
  finalOdometer: t.final_odometer !== null && t.final_odometer !== undefined ? Number(t.final_odometer) : null,
  fuelConsumed: t.fuel_consumed !== null && t.fuel_consumed !== undefined ? Number(t.fuel_consumed) : null,
})

const mapMaintenanceFromDb = (m) => ({
  id: m.id,
  vehicleId: m.vehicle_id,
  date: m.date,
  description: m.description,
  cost: Number(m.cost) || 0,
  status: m.status,
})

const mapExpenseFromDb = (e) => ({
  id: e.id,
  vehicleId: e.vehicle_id,
  date: e.date,
  type: e.type,
  amount: Number(e.amount) || 0,
  notes: e.notes || '',
})

export function AppDataProvider({ children }) {
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [trips, setTrips] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [expenses, setExpenses] = useState([])

  const fetchAllData = useCallback(async () => {
    if (!supabaseReady) return
    try {
      const [vRes, dRes, tRes, mRes, eRes] = await Promise.all([
        supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
        supabase.from('drivers').select('*').order('created_at', { ascending: false }),
        supabase.from('trips').select('*').order('created_at', { ascending: false }),
        supabase.from('maintenance').select('*').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('created_at', { ascending: false }),
      ])

      if (vRes.data) setVehicles(vRes.data)
      if (dRes.data) setDrivers(dRes.data)
      if (tRes.data) setTrips(tRes.data.map(mapTripFromDb))
      if (mRes.data) setMaintenance(mRes.data.map(mapMaintenanceFromDb))
      if (eRes.data) setExpenses(eRes.data.map(mapExpenseFromDb))
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching data from Supabase:', err)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Realtime subscription setup
  useEffect(() => {
    if (!supabaseReady) return

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => { fetchAllData() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => { fetchAllData() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => { fetchAllData() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance' }, () => { fetchAllData() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => { fetchAllData() })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAllData])

  const resetDemo = useCallback(() => {
    // Reset database isn't done from client in production; refresh data instead
    fetchAllData()
  }, [fetchAllData])

  // ---------- Vehicles Actions ----------
  const addVehicle = useCallback(async (data) => {
    if (!supabaseReady) return { ok: false, error: 'Supabase is not configured' }
    const { data: inserted, error } = await supabase
      .from('vehicles')
      .insert({
        reg: data.reg.trim(),
        name: data.name.trim(),
        type: data.type,
        capacity: Number(data.capacity),
        odometer: Number(data.odometer) || 0,
        cost: Number(data.cost) || 0,
        status: 'Available',
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { ok: false, error: `Registration ${data.reg} already exists` }
      }
      return { ok: false, error: error.message }
    }
    setVehicles((prev) => [inserted, ...prev])
    return { ok: true }
  }, [])

  const updateVehicle = useCallback(async (id, data) => {
    if (!supabaseReady) return { ok: false, error: 'Supabase is not configured' }
    const { data: updated, error } = await supabase
      .from('vehicles')
      .update({
        reg: data.reg.trim(),
        name: data.name.trim(),
        type: data.type,
        capacity: Number(data.capacity),
        odometer: Number(data.odometer) || 0,
        cost: Number(data.cost) || 0,
        status: data.status,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { ok: false, error: `Registration ${data.reg} already exists` }
      }
      return { ok: false, error: error.message }
    }
    setVehicles((prev) => prev.map((v) => v.id === id ? updated : v))
    return { ok: true }
  }, [])

  const deleteVehicle = useCallback(async (id) => {
    if (!supabaseReady) return { ok: false, error: 'Supabase is not configured' }
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    setVehicles((prev) => prev.filter((v) => v.id !== id))
    return { ok: true }
  }, [])

  // ---------- Drivers Actions ----------
  const addDriver = useCallback(async (data) => {
    if (!supabaseReady) return { ok: false, error: 'Supabase is not configured' }
    const { data: inserted, error } = await supabase
      .from('drivers')
      .insert({
        name: data.name.trim(),
        license: data.license.trim(),
        category: data.category,
        expiry: data.expiry,
        contact: data.contact.trim(),
        score: Number(data.score) || 0,
        status: 'Available',
      })
      .select()
      .single()

    if (error) return { ok: false, error: error.message }
    setDrivers((prev) => [inserted, ...prev])
    return { ok: true }
  }, [])

  const updateDriver = useCallback(async (id, data) => {
    if (!supabaseReady) return { ok: false, error: 'Supabase is not configured' }
    const { data: updated, error } = await supabase
      .from('drivers')
      .update({
        name: data.name.trim(),
        license: data.license.trim(),
        category: data.category,
        expiry: data.expiry,
        contact: data.contact.trim(),
        score: Number(data.score) || 0,
        status: data.status,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return { ok: false, error: error.message }
    setDrivers((prev) => prev.map((d) => d.id === id ? updated : d))
    return { ok: true }
  }, [])

  const deleteDriver = useCallback(async (id) => {
    if (!supabaseReady) return { ok: false, error: 'Supabase is not configured' }
    const { error } = await supabase.from('drivers').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    setDrivers((prev) => prev.filter((d) => d.id !== id))
    return { ok: true }
  }, [])

  const setDriverStatus = useCallback(async (id, status) => {
    if (!supabaseReady) return { ok: false, error: 'Supabase is not configured' }
    const { data: updated, error } = await supabase
      .from('drivers')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) return { ok: false, error: error.message }
    setDrivers((prev) => prev.map((d) => d.id === id ? updated : d))
    return { ok: true }
  }, [])

  // ---------- Trips (State Machine via RPC) ----------
  const createTrip = useCallback(async (data) => {
    if (!supabaseReady) return { ok: false, error: 'Supabase is not configured' }
    const { data: res, error } = await supabase.rpc('create_trip', {
      p_source: data.source.trim(),
      p_dest: data.dest.trim(),
      p_vehicle_id: data.vehicleId,
      p_driver_id: data.driverId,
      p_cargo: Number(data.cargo),
      p_distance: Number(data.distance) || 0,
      p_revenue: Number(data.revenue) || 0,
    })

    if (error) return { ok: false, error: error.message }
    if (res && !res.ok) return { ok: false, errors: res.errors }
    await fetchAllData()
    return { ok: true }
  }, [fetchAllData])

  const dispatchTrip = useCallback(async (tripId) => {
    if (!supabaseReady) return { ok: false, error: 'Supabase is not configured' }
    const { data: res, error } = await supabase.rpc('dispatch_trip', { p_trip_id: tripId })
    if (error) return { ok: false, error: error.message }
    if (res && !res.ok) return { ok: false, error: res.error }
    await fetchAllData()
    return { ok: true }
  }, [fetchAllData])

  const completeTrip = useCallback(async (tripId, { finalOdometer, fuelConsumed } = {}) => {
    if (!supabaseReady) return { ok: false, error: 'Supabase is not configured' }
    const { data: res, error } = await supabase.rpc('complete_trip', {
      p_trip_id: tripId,
      p_final_odometer: Number(finalOdometer) || null,
      p_fuel_consumed: Number(fuelConsumed) || null,
    })
    if (error) return { ok: false, error: error.message }
    if (res && !res.ok) return { ok: false, error: res.error }
    await fetchAllData()
    return { ok: true }
  }, [fetchAllData])

  const cancelTrip = useCallback(async (tripId) => {
    if (!supabaseReady) return { ok: false, error: 'Supabase is not configured' }
    const { data: res, error } = await supabase.rpc('cancel_trip', { p_trip_id: tripId })
    if (error) return { ok: false, error: error.message }
    if (res && !res.ok) return { ok: false, error: res.error }
    await fetchAllData()
    return { ok: true }
  }, [fetchAllData])

  // ---------- Maintenance Actions ----------
  const addMaintenance = useCallback(async (data) => {
    if (!supabaseReady) return { ok: false, error: 'Supabase is not configured' }
    const { data: inserted, error } = await supabase
      .from('maintenance')
      .insert({
        vehicle_id: data.vehicleId,
        date: data.date,
        description: data.description.trim(),
        cost: Number(data.cost) || 0,
        status: data.status,
      })
      .select()
      .single()

    if (error) return { ok: false, error: error.message }
    setMaintenance((prev) => [mapMaintenanceFromDb(inserted), ...prev])
    return { ok: true }
  }, [])

  const updateMaintenance = useCallback(async (id, data) => {
    if (!supabaseReady) return { ok: false, error: 'Supabase is not configured' }
    const { data: updated, error } = await supabase
      .from('maintenance')
      .update({
        vehicle_id: data.vehicleId,
        date: data.date,
        description: data.description.trim(),
        cost: Number(data.cost) || 0,
        status: data.status,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return { ok: false, error: error.message }
    setMaintenance((prev) => prev.map((m) => m.id === id ? mapMaintenanceFromDb(updated) : m))
    return { ok: true }
  }, [])

  // ---------- Expenses Actions ----------
  const addExpense = useCallback(async (data) => {
    if (!supabaseReady) return { ok: false, error: 'Supabase is not configured' }
    const { data: inserted, error } = await supabase
      .from('expenses')
      .insert({
        vehicle_id: data.vehicleId,
        date: data.date,
        type: data.type,
        amount: Number(data.amount) || 0,
        notes: data.notes ? data.notes.trim() : '',
      })
      .select()
      .single()

    if (error) return { ok: false, error: error.message }
    setExpenses((prev) => [mapExpenseFromDb(inserted), ...prev])
    return { ok: true }
  }, [])

  const updateExpense = useCallback(async (id, data) => {
    if (!supabaseReady) return { ok: false, error: 'Supabase is not configured' }
    const { data: updated, error } = await supabase
      .from('expenses')
      .update({
        vehicle_id: data.vehicleId,
        date: data.date,
        type: data.type,
        amount: Number(data.amount) || 0,
        notes: data.notes ? data.notes.trim() : '',
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return { ok: false, error: error.message }
    setExpenses((prev) => prev.map((e) => e.id === id ? mapExpenseFromDb(updated) : e))
    return { ok: true }
  }, [])

  const value = useMemo(() => ({
    vehicles, drivers, trips, maintenance, expenses,
    addVehicle, updateVehicle, deleteVehicle,
    addDriver, updateDriver, deleteDriver, setDriverStatus,
    createTrip, dispatchTrip, completeTrip, cancelTrip,
    addMaintenance, updateMaintenance, addExpense, updateExpense,
    resetDemo,
  }), [
    vehicles, drivers, trips, maintenance, expenses,
    addVehicle, updateVehicle, deleteVehicle,
    addDriver, updateDriver, deleteDriver, setDriverStatus,
    createTrip, dispatchTrip, completeTrip, cancelTrip,
    addMaintenance, updateMaintenance, addExpense, updateExpense,
    resetDemo,
  ])

  return <AppDataCtx.Provider value={value}>{children}</AppDataCtx.Provider>
}

