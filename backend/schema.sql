-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- 2. Create Tables
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    role TEXT NOT NULL CHECK (role IN ('Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'))
);

CREATE TABLE public.vehicles (
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

CREATE TABLE public.drivers (
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

CREATE TABLE public.trips (
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

CREATE TABLE public.maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    cost INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('In Shop', 'Completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Fuel', 'Toll', 'Maintenance', 'Other')),
    amount INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Row-Level Security (RLS) Configuration
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Helper function to fetch current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Vehicles Policies
CREATE POLICY "vehicles_read_all" ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehicles_write_manager" ON public.vehicles FOR ALL TO authenticated USING (public.get_user_role() = 'Fleet Manager');

-- Drivers Policies
CREATE POLICY "drivers_read_all" ON public.drivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "drivers_write_role" ON public.drivers FOR ALL TO authenticated USING (public.get_user_role() IN ('Fleet Manager', 'Safety Officer'));

-- Trips Policies
CREATE POLICY "trips_read_all" ON public.trips FOR SELECT TO authenticated USING (true);
CREATE POLICY "trips_write_role" ON public.trips FOR ALL TO authenticated USING (public.get_user_role() IN ('Fleet Manager', 'Driver'));

-- Maintenance Policies
CREATE POLICY "maintenance_read_all" ON public.maintenance FOR SELECT TO authenticated USING (true);
CREATE POLICY "maintenance_write_role" ON public.maintenance FOR ALL TO authenticated USING (public.get_user_role() IN ('Fleet Manager', 'Safety Officer'));

-- Expenses Policies
CREATE POLICY "expenses_read_all" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "expenses_write_role" ON public.expenses FOR ALL TO authenticated USING (public.get_user_role() IN ('Fleet Manager', 'Financial Analyst'));

-- 4. User Creation Auth Trigger
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

-- 5. Helper function to generate trip display ID (e.g. TR-1043)
CREATE OR REPLACE FUNCTION public.get_next_trip_id()
RETURNS TEXT AS $$
DECLARE
    v_max_num INT;
BEGIN
    SELECT COALESCE(MAX(CAST(substring(id FROM '[0-9]+') AS INT)), 1000) INTO v_max_num
    FROM public.trips;
    RETURN 'TR-' || (v_max_num + 1);
END;
$$ LANGUAGE plpgsql;

-- 6. Trip State Machine Functions (RPC)

-- create_trip
CREATE OR REPLACE FUNCTION public.create_trip(
    p_source TEXT,
    p_dest TEXT,
    p_vehicle_id UUID,
    p_driver_id UUID,
    p_cargo INT,
    p_distance INT,
    p_revenue INT
)
RETURNS JSON AS $$
DECLARE
    v_vehicle_status TEXT;
    v_vehicle_capacity INT;
    v_driver_status TEXT;
    v_driver_expiry DATE;
    v_errors JSONB := '{}'::JSONB;
    v_trip_id TEXT;
BEGIN
    -- Get vehicle info
    SELECT status, capacity INTO v_vehicle_status, v_vehicle_capacity
    FROM public.vehicles WHERE id = p_vehicle_id;
    
    IF v_vehicle_status IS NULL THEN
        v_errors := v_errors || jsonb_build_object('vehicleId', 'Select a vehicle');
    ELSIF v_vehicle_status <> 'Available' THEN
        v_errors := v_errors || jsonb_build_object('vehicleId', 'Vehicle is not available');
    END IF;

    -- Get driver info
    SELECT status, expiry INTO v_driver_status, v_driver_expiry
    FROM public.drivers WHERE id = p_driver_id;

    IF v_driver_status IS NULL THEN
        v_errors := v_errors || jsonb_build_object('driverId', 'Select a driver');
    ELSIF v_driver_status = 'Suspended' THEN
        v_errors := v_errors || jsonb_build_object('driverId', 'Driver is suspended');
    ELSIF v_driver_expiry < CURRENT_DATE THEN
        v_errors := v_errors || jsonb_build_object('driverId', 'Driver license has expired');
    ELSIF v_driver_status <> 'Available' THEN
        v_errors := v_errors || jsonb_build_object('driverId', 'Driver is not available');
    END IF;

    -- Cargo weight check
    IF p_cargo IS NULL OR p_cargo <= 0 THEN
        v_errors := v_errors || jsonb_build_object('cargo', 'Enter cargo weight');
    ELSIF v_vehicle_capacity IS NOT NULL AND p_cargo > v_vehicle_capacity THEN
        v_errors := v_errors || jsonb_build_object('cargo', 'Cargo (' || p_cargo || ' kg) exceeds capacity (' || v_vehicle_capacity || ' kg)');
    END IF;

    -- Return validation errors if any fail
    IF v_errors <> '{}'::JSONB THEN
        RETURN json_build_object('ok', false, 'errors', v_errors);
    END IF;

    -- Generate Display ID
    v_trip_id := public.get_next_trip_id();

    -- Insert trip
    INSERT INTO public.trips (id, source, dest, vehicle_id, driver_id, cargo, distance, revenue, status)
    VALUES (v_trip_id, TRIM(p_source), TRIM(p_dest), p_vehicle_id, p_driver_id, p_cargo, p_distance, p_revenue, 'Draft');

    RETURN json_build_object('ok', true, 'id', v_trip_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- dispatch_trip
CREATE OR REPLACE FUNCTION public.dispatch_trip(p_trip_id TEXT)
RETURNS JSON AS $$
DECLARE
    v_status TEXT;
    v_vehicle_id UUID;
    v_driver_id UUID;
    v_cargo INT;
    v_vehicle_status TEXT;
    v_vehicle_capacity INT;
    v_driver_status TEXT;
    v_driver_expiry DATE;
BEGIN
    -- Get trip details
    SELECT status, vehicle_id, driver_id, cargo
    INTO v_status, v_vehicle_id, v_driver_id, v_cargo
    FROM public.trips WHERE id = p_trip_id;

    IF v_status IS NULL THEN
        RETURN json_build_object('ok', false, 'error', 'Trip not found');
    END IF;

    IF v_status <> 'Draft' THEN
        RETURN json_build_object('ok', false, 'error', 'Trip is not in Draft');
    END IF;

    -- Re-run 5 checks
    SELECT status, capacity INTO v_vehicle_status, v_vehicle_capacity
    FROM public.vehicles WHERE id = v_vehicle_id;

    IF v_vehicle_status <> 'Available' THEN
        RETURN json_build_object('ok', false, 'error', 'Vehicle is not available');
    END IF;

    SELECT status, expiry INTO v_driver_status, v_driver_expiry
    FROM public.drivers WHERE id = v_driver_id;

    IF v_driver_status = 'Suspended' THEN
        RETURN json_build_object('ok', false, 'error', 'Driver is suspended');
    ELSIF v_driver_expiry < CURRENT_DATE THEN
        RETURN json_build_object('ok', false, 'error', 'Driver license has expired');
    ELSIF v_driver_status <> 'Available' THEN
        RETURN json_build_object('ok', false, 'error', 'Driver is not available');
    END IF;

    IF v_cargo > v_vehicle_capacity THEN
        RETURN json_build_object('ok', false, 'error', 'Cargo exceeds vehicle capacity');
    END IF;

    -- Perform status updates atomically
    UPDATE public.trips SET status = 'Dispatched' WHERE id = p_trip_id;
    UPDATE public.vehicles SET status = 'On Trip' WHERE id = v_vehicle_id;
    UPDATE public.drivers SET status = 'On Trip' WHERE id = v_driver_id;

    RETURN json_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- complete_trip
CREATE OR REPLACE FUNCTION public.complete_trip(
    p_trip_id TEXT,
    p_final_odometer INT,
    p_fuel_consumed INT
)
RETURNS JSON AS $$
DECLARE
    v_status TEXT;
    v_vehicle_id UUID;
    v_driver_id UUID;
    v_current_odometer INT;
BEGIN
    SELECT status, vehicle_id, driver_id
    INTO v_status, v_vehicle_id, v_driver_id
    FROM public.trips WHERE id = p_trip_id;

    IF v_status IS NULL THEN
        RETURN json_build_object('ok', false, 'error', 'Trip not found');
    END IF;

    IF v_status <> 'Dispatched' THEN
        RETURN json_build_object('ok', false, 'error', 'Trip is not dispatched');
    END IF;

    SELECT odometer INTO v_current_odometer
    FROM public.vehicles WHERE id = v_vehicle_id;

    -- Update trip stats
    UPDATE public.trips
    SET status = 'Completed',
        final_odometer = p_final_odometer,
        fuel_consumed = p_fuel_consumed
    WHERE id = p_trip_id;

    -- Complete status changes and update odometer if final is higher
    UPDATE public.vehicles
    SET status = 'Available',
        odometer = CASE WHEN p_final_odometer > v_current_odometer THEN p_final_odometer ELSE v_current_odometer END
    WHERE id = v_vehicle_id;

    UPDATE public.drivers
    SET status = 'Available'
    WHERE id = v_driver_id;

    RETURN json_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- cancel_trip
CREATE OR REPLACE FUNCTION public.cancel_trip(p_trip_id TEXT)
RETURNS JSON AS $$
DECLARE
    v_status TEXT;
    v_vehicle_id UUID;
    v_driver_id UUID;
BEGIN
    SELECT status, vehicle_id, driver_id
    INTO v_status, v_vehicle_id, v_driver_id
    FROM public.trips WHERE id = p_trip_id;

    IF v_status IS NULL THEN
        RETURN json_build_object('ok', false, 'error', 'Trip not found');
    END IF;

    IF v_status <> 'Draft' AND v_status <> 'Dispatched' THEN
        RETURN json_build_object('ok', false, 'error', 'Trip cannot be cancelled');
    END IF;

    -- Update trip status to Cancelled
    UPDATE public.trips SET status = 'Cancelled' WHERE id = p_trip_id;

    -- Restore driver and vehicle to Available if the trip was dispatched
    IF v_status = 'Dispatched' THEN
        UPDATE public.vehicles SET status = 'Available' WHERE id = v_vehicle_id;
        UPDATE public.drivers SET status = 'Available' WHERE id = v_driver_id;
    END IF;

    RETURN json_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. SQL View for Dashboard KPI Aggregations
CREATE OR REPLACE VIEW public.dashboard_kpis AS
WITH vehicle_counts AS (
    SELECT
        COUNT(*) FILTER (WHERE status = 'On Trip') AS active_vehicles,
        COUNT(*) FILTER (WHERE status = 'Available') AS available_vehicles,
        COUNT(*) FILTER (WHERE status = 'In Shop') AS in_maintenance,
        COUNT(*) AS total_vehicles,
        COUNT(*) FILTER (WHERE status <> 'Retired') AS usable_vehicles
    FROM public.vehicles
),
trip_counts AS (
    SELECT
        COUNT(*) FILTER (WHERE status = 'Dispatched') AS active_trips,
        COUNT(*) FILTER (WHERE status = 'Draft') AS pending_trips
    FROM public.trips
),
driver_counts AS (
    SELECT
        COUNT(*) FILTER (WHERE status = 'On Trip') AS drivers_on_duty
    FROM public.drivers
)
SELECT
    v.active_vehicles,
    v.available_vehicles,
    v.in_maintenance,
    t.active_trips,
    t.pending_trips,
    d.drivers_on_duty,
    CASE 
        WHEN v.usable_vehicles > 0 THEN ROUND((v.active_vehicles::NUMERIC / v.usable_vehicles::NUMERIC) * 100, 1)
        ELSE 0 
    END AS fleet_utilization,
    v.total_vehicles,
    v.usable_vehicles
FROM vehicle_counts v, trip_counts t, driver_counts d;
