-- ╔══════════════════════════════════════════════════════════════╗
-- ║      TransitOps — Complete Database Setup                   ║
-- ║      Paste this entire file into Supabase SQL Editor        ║
-- ║      Project: fyjqmizbiifjwedonenz                          ║
-- ╚══════════════════════════════════════════════════════════════╝

-- STEP 1: Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- STEP 2: Tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    role TEXT NOT NULL CHECK (role IN ('Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'))
);

CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reg TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Mini Truck', 'Van', 'Truck')),
    capacity INT NOT NULL,
    odometer INT NOT NULL DEFAULT 0,
    cost INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'On Trip', 'In Shop', 'Retired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    license TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('LMV', 'HMV')),
    expiry DATE NOT NULL,
    contact TEXT,
    score INT NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'On Trip', 'Off Duty', 'Suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trips (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    dest TEXT NOT NULL,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE RESTRICT,
    cargo INT NOT NULL,
    distance INT NOT NULL DEFAULT 0,
    revenue INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Dispatched', 'Completed', 'Cancelled')),
    final_odometer INT,
    fuel_consumed INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    cost INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('In Shop', 'Completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Fuel', 'Toll', 'Maintenance', 'Other')),
    amount INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- STEP 3: Enable Row-Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- STEP 4: Helper function for roles
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: RLS Policies
CREATE POLICY "profiles_read_all"     ON public.profiles   FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_self_update"  ON public.profiles   FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "vehicles_read_all"     ON public.vehicles   FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehicles_write_manager" ON public.vehicles  FOR ALL    TO authenticated USING (public.get_user_role() = 'Fleet Manager');
CREATE POLICY "drivers_read_all"      ON public.drivers    FOR SELECT TO authenticated USING (true);
CREATE POLICY "drivers_write_role"    ON public.drivers    FOR ALL    TO authenticated USING (public.get_user_role() IN ('Fleet Manager', 'Safety Officer'));
CREATE POLICY "trips_read_all"        ON public.trips      FOR SELECT TO authenticated USING (true);
CREATE POLICY "trips_write_role"      ON public.trips      FOR ALL    TO authenticated USING (public.get_user_role() IN ('Fleet Manager', 'Driver'));
CREATE POLICY "maintenance_read_all"  ON public.maintenance FOR SELECT TO authenticated USING (true);
CREATE POLICY "maintenance_write_role" ON public.maintenance FOR ALL  TO authenticated USING (public.get_user_role() IN ('Fleet Manager', 'Safety Officer'));
CREATE POLICY "expenses_read_all"     ON public.expenses   FOR SELECT TO authenticated USING (true);
CREATE POLICY "expenses_write_role"   ON public.expenses   FOR ALL    TO authenticated USING (public.get_user_role() IN ('Fleet Manager', 'Financial Analyst'));

-- STEP 6: Auth trigger (auto-create profile on signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'role', 'Fleet Manager')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- STEP 7: Seed profiles for the 4 users we already created via API
-- (IDs match what was returned when we created auth users)
INSERT INTO public.profiles (id, name, role) VALUES
  ('e773529b-84df-4579-8a7b-bbb2cc34b577', 'Tirth Patel',  'Fleet Manager'),
  ('57730015-f153-4635-9b5b-d34a99a2344a', 'Alex Kumar',   'Driver'),
  ('aff4f681-fe80-4f02-bbea-dca3012610cd', 'Sana Iqbal',   'Safety Officer'),
  ('3b09a1c2-8fd2-4490-b8e3-7c66651f024d', 'Meera Nair',   'Financial Analyst')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role;

-- STEP 8: Trip ID generator
CREATE OR REPLACE FUNCTION public.get_next_trip_id()
RETURNS TEXT AS $$
DECLARE v_max_num INT;
BEGIN
    SELECT COALESCE(MAX(CAST(substring(id FROM '[0-9]+') AS INT)), 1000) INTO v_max_num FROM public.trips;
    RETURN 'TR-' || (v_max_num + 1);
END;
$$ LANGUAGE plpgsql;

-- STEP 9: create_trip RPC
CREATE OR REPLACE FUNCTION public.create_trip(
    p_source TEXT, p_dest TEXT, p_vehicle_id UUID, p_driver_id UUID,
    p_cargo INT, p_distance INT, p_revenue INT
)
RETURNS JSON AS $$
DECLARE
    v_vehicle_status TEXT; v_vehicle_capacity INT;
    v_driver_status TEXT;  v_driver_expiry DATE;
    v_errors JSONB := '{}'::JSONB; v_trip_id TEXT;
BEGIN
    SELECT status, capacity INTO v_vehicle_status, v_vehicle_capacity FROM public.vehicles WHERE id = p_vehicle_id;
    IF v_vehicle_status IS NULL THEN
        v_errors := v_errors || jsonb_build_object('vehicleId', 'Select a vehicle');
    ELSIF v_vehicle_status <> 'Available' THEN
        v_errors := v_errors || jsonb_build_object('vehicleId', 'Vehicle is not available');
    END IF;

    SELECT status, expiry INTO v_driver_status, v_driver_expiry FROM public.drivers WHERE id = p_driver_id;
    IF v_driver_status IS NULL THEN
        v_errors := v_errors || jsonb_build_object('driverId', 'Select a driver');
    ELSIF v_driver_status = 'Suspended' THEN
        v_errors := v_errors || jsonb_build_object('driverId', 'Driver is suspended');
    ELSIF v_driver_expiry < CURRENT_DATE THEN
        v_errors := v_errors || jsonb_build_object('driverId', 'Driver license has expired');
    ELSIF v_driver_status <> 'Available' THEN
        v_errors := v_errors || jsonb_build_object('driverId', 'Driver is not available');
    END IF;

    IF p_cargo IS NULL OR p_cargo <= 0 THEN
        v_errors := v_errors || jsonb_build_object('cargo', 'Enter cargo weight');
    ELSIF v_vehicle_capacity IS NOT NULL AND p_cargo > v_vehicle_capacity THEN
        v_errors := v_errors || jsonb_build_object('cargo', 'Cargo (' || p_cargo || ' kg) exceeds capacity (' || v_vehicle_capacity || ' kg)');
    END IF;

    IF v_errors <> '{}'::JSONB THEN RETURN json_build_object('ok', false, 'errors', v_errors); END IF;

    v_trip_id := public.get_next_trip_id();
    INSERT INTO public.trips (id, source, dest, vehicle_id, driver_id, cargo, distance, revenue, status)
    VALUES (v_trip_id, TRIM(p_source), TRIM(p_dest), p_vehicle_id, p_driver_id, p_cargo, p_distance, p_revenue, 'Draft');
    RETURN json_build_object('ok', true, 'id', v_trip_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 10: dispatch_trip RPC
CREATE OR REPLACE FUNCTION public.dispatch_trip(p_trip_id TEXT)
RETURNS JSON AS $$
DECLARE
    v_status TEXT; v_vehicle_id UUID; v_driver_id UUID; v_cargo INT;
    v_vehicle_status TEXT; v_vehicle_capacity INT; v_driver_status TEXT; v_driver_expiry DATE;
BEGIN
    SELECT status, vehicle_id, driver_id, cargo INTO v_status, v_vehicle_id, v_driver_id, v_cargo FROM public.trips WHERE id = p_trip_id;
    IF v_status IS NULL THEN RETURN json_build_object('ok', false, 'error', 'Trip not found'); END IF;
    IF v_status <> 'Draft' THEN RETURN json_build_object('ok', false, 'error', 'Trip is not in Draft'); END IF;
    SELECT status, capacity INTO v_vehicle_status, v_vehicle_capacity FROM public.vehicles WHERE id = v_vehicle_id;
    IF v_vehicle_status <> 'Available' THEN RETURN json_build_object('ok', false, 'error', 'Vehicle is not available'); END IF;
    SELECT status, expiry INTO v_driver_status, v_driver_expiry FROM public.drivers WHERE id = v_driver_id;
    IF v_driver_status = 'Suspended' THEN RETURN json_build_object('ok', false, 'error', 'Driver is suspended');
    ELSIF v_driver_expiry < CURRENT_DATE THEN RETURN json_build_object('ok', false, 'error', 'Driver license has expired');
    ELSIF v_driver_status <> 'Available' THEN RETURN json_build_object('ok', false, 'error', 'Driver is not available'); END IF;
    IF v_cargo > v_vehicle_capacity THEN RETURN json_build_object('ok', false, 'error', 'Cargo exceeds vehicle capacity'); END IF;
    UPDATE public.trips SET status = 'Dispatched' WHERE id = p_trip_id;
    UPDATE public.vehicles SET status = 'On Trip' WHERE id = v_vehicle_id;
    UPDATE public.drivers SET status = 'On Trip' WHERE id = v_driver_id;
    RETURN json_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 11: complete_trip RPC
CREATE OR REPLACE FUNCTION public.complete_trip(p_trip_id TEXT, p_final_odometer INT, p_fuel_consumed INT)
RETURNS JSON AS $$
DECLARE
    v_status TEXT; v_vehicle_id UUID; v_driver_id UUID; v_current_odometer INT;
BEGIN
    SELECT status, vehicle_id, driver_id INTO v_status, v_vehicle_id, v_driver_id FROM public.trips WHERE id = p_trip_id;
    IF v_status IS NULL THEN RETURN json_build_object('ok', false, 'error', 'Trip not found'); END IF;
    IF v_status <> 'Dispatched' THEN RETURN json_build_object('ok', false, 'error', 'Trip is not dispatched'); END IF;
    SELECT odometer INTO v_current_odometer FROM public.vehicles WHERE id = v_vehicle_id;
    UPDATE public.trips SET status = 'Completed', final_odometer = p_final_odometer, fuel_consumed = p_fuel_consumed WHERE id = p_trip_id;
    UPDATE public.vehicles SET status = 'Available', odometer = CASE WHEN p_final_odometer > v_current_odometer THEN p_final_odometer ELSE v_current_odometer END WHERE id = v_vehicle_id;
    UPDATE public.drivers SET status = 'Available' WHERE id = v_driver_id;
    RETURN json_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 12: cancel_trip RPC
CREATE OR REPLACE FUNCTION public.cancel_trip(p_trip_id TEXT)
RETURNS JSON AS $$
DECLARE
    v_status TEXT; v_vehicle_id UUID; v_driver_id UUID;
BEGIN
    SELECT status, vehicle_id, driver_id INTO v_status, v_vehicle_id, v_driver_id FROM public.trips WHERE id = p_trip_id;
    IF v_status IS NULL THEN RETURN json_build_object('ok', false, 'error', 'Trip not found'); END IF;
    IF v_status <> 'Draft' AND v_status <> 'Dispatched' THEN RETURN json_build_object('ok', false, 'error', 'Trip cannot be cancelled'); END IF;
    UPDATE public.trips SET status = 'Cancelled' WHERE id = p_trip_id;
    IF v_status = 'Dispatched' THEN
        UPDATE public.vehicles SET status = 'Available' WHERE id = v_vehicle_id;
        UPDATE public.drivers SET status = 'Available' WHERE id = v_driver_id;
    END IF;
    RETURN json_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 13: Dashboard KPI view
CREATE OR REPLACE VIEW public.dashboard_kpis AS
WITH vc AS (
    SELECT
        COUNT(*) FILTER (WHERE status='On Trip')    AS active_vehicles,
        COUNT(*) FILTER (WHERE status='Available')  AS available_vehicles,
        COUNT(*) FILTER (WHERE status='In Shop')    AS in_maintenance,
        COUNT(*)                                     AS total_vehicles,
        COUNT(*) FILTER (WHERE status<>'Retired')   AS usable_vehicles
    FROM public.vehicles
),
tc AS (
    SELECT
        COUNT(*) FILTER (WHERE status='Dispatched') AS active_trips,
        COUNT(*) FILTER (WHERE status='Draft')      AS pending_trips
    FROM public.trips
),
dc AS (
    SELECT COUNT(*) FILTER (WHERE status='On Trip') AS drivers_on_duty FROM public.drivers
)
SELECT
    vc.active_vehicles, vc.available_vehicles, vc.in_maintenance,
    tc.active_trips, tc.pending_trips, dc.drivers_on_duty,
    CASE WHEN vc.usable_vehicles > 0
         THEN ROUND((vc.active_vehicles::NUMERIC / vc.usable_vehicles::NUMERIC) * 100, 1)
         ELSE 0 END AS fleet_utilization,
    vc.total_vehicles, vc.usable_vehicles
FROM vc, tc, dc;

-- ✅ Schema complete! Now run seed_data.sql to insert test records.
SELECT 'Schema applied successfully! Tables, RLS, triggers and RPCs are ready.' AS status;
