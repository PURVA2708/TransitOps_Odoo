-- ╔══════════════════════════════════════════════════════════════╗
-- ║    TransitOps — Seed Data                                   ║
-- ║    Run AFTER setup_schema.sql in Supabase SQL Editor        ║
-- ╚══════════════════════════════════════════════════════════════╝

-- Vehicles (9 records)
INSERT INTO public.vehicles (id, reg, name, type, capacity, odometer, cost, status) VALUES
  ('c0a80201-0000-0000-0000-000000000001', 'RJ14-GA-2025', 'Tata Ace',       'Mini Truck', 750,  45200,  600000,  'Available'),
  ('c0a80201-0000-0000-0000-000000000002', 'MH12-AB-1180', 'Ashok Leyland',  'Truck',      2000, 128400, 1800000, 'On Trip'),
  ('c0a80201-0000-0000-0000-000000000003', 'DL01-CG-9090', 'Force Traveller','Van',        900,  76100,  950000,  'In Shop'),
  ('c0a80201-0000-0000-0000-000000000004', 'GJ05-KL-3321', 'Eicher Pro',     'Truck',      2500, 98700,  2100000, 'On Trip'),
  ('c0a80201-0000-0000-0000-000000000005', 'RJ14-GA-7781', 'Tata Ace Gold',  'Mini Truck', 750,  21050,  620000,  'Available'),
  ('c0a80201-0000-0000-0000-000000000006', 'UP32-DE-1020', 'Mahindra Bolero','Van',        850,  55300,  890000,  'Available'),
  ('c0a80201-0000-0000-0000-000000000007', 'MH14-XY-4567', 'BharatBenz',     'Truck',      3000, 143000, 2600000, 'On Trip'),
  ('c0a80201-0000-0000-0000-000000000008', 'HR26-AA-1122', 'Maruti Eeco',    'Van',        600,  33400,  560000,  'Available'),
  ('c0a80201-0000-0000-0000-000000000009', 'PB10-ZZ-8899', 'Tata 407 (old)','Truck',      2200, 310000, 1400000, 'Retired')
ON CONFLICT (id) DO NOTHING;

-- Drivers (7 records)
INSERT INTO public.drivers (id, name, license, category, expiry, contact, score, status) VALUES
  ('c0a80301-0000-0000-0000-000000000001', 'Alex Kumar',  'DL-0420256789', 'HMV', '2027-05-10', '9800000001', 85, 'On Trip'),
  ('c0a80301-0000-0000-0000-000000000002', 'Ravi Singh',  'DL-0419887654', 'LMV', '2026-11-22', '9800000002', 78, 'Available'),
  ('c0a80301-0000-0000-0000-000000000003', 'Sana Iqbal',  'DL-0421334455', 'HMV', '2028-02-14', '9800000003', 91, 'On Trip'),
  ('c0a80301-0000-0000-0000-000000000004', 'John Peter',  'DL-0418223344', 'LMV', '2026-08-30', '9800000004', 72, 'Off Duty'),
  ('c0a80301-0000-0000-0000-000000000005', 'Meera Nair',  'DL-0422556677', 'HMV', '2027-09-01', '9800000005', 88, 'On Trip'),
  ('c0a80301-0000-0000-0000-000000000006', 'Vikas Rao',   'DL-0417009988', 'LMV', '2025-12-31', '9800000006', 60, 'Suspended'),
  ('c0a80301-0000-0000-0000-000000000007', 'Priya Menon', 'DL-0423110022', 'LMV', '2026-06-15', '9800000007', 82, 'Available')
ON CONFLICT (id) DO NOTHING;

-- Trips (6 records)
INSERT INTO public.trips (id, source, dest, vehicle_id, driver_id, cargo, distance, revenue, status, final_odometer, fuel_consumed) VALUES
  ('TR-1042','Delhi Warehouse','Jaipur Store', 'c0a80201-0000-0000-0000-000000000002','c0a80301-0000-0000-0000-000000000001',1200,280,12000,'Dispatched',NULL,NULL),
  ('TR-1041','Mumbai Hub',     'Pune Depot',   'c0a80201-0000-0000-0000-000000000004','c0a80301-0000-0000-0000-000000000003',1800,150,9000, 'Dispatched',NULL,NULL),
  ('TR-1040','Surat Center',   'Ahmedabad DC', 'c0a80201-0000-0000-0000-000000000007','c0a80301-0000-0000-0000-000000000005',2400,265,15000,'Dispatched',NULL,NULL),
  ('TR-1039','Delhi Warehouse','Agra Outlet',  'c0a80201-0000-0000-0000-000000000001','c0a80301-0000-0000-0000-000000000002',500, 230,8000, 'Draft',     NULL,NULL),
  ('TR-1038','Noida Store',    'Gurgaon Hub',  'c0a80201-0000-0000-0000-000000000006','c0a80301-0000-0000-0000-000000000007',640, 60, 4000, 'Draft',     NULL,NULL),
  ('TR-1037','Jaipur Store',   'Delhi Warehouse','c0a80201-0000-0000-0000-000000000005','c0a80301-0000-0000-0000-000000000001',700,280,11000,'Completed', 21050,35)
ON CONFLICT (id) DO NOTHING;

-- Maintenance (2 records)
INSERT INTO public.maintenance (id, vehicle_id, date, description, cost, status) VALUES
  ('c0a80401-0000-0000-0000-000000000001','c0a80201-0000-0000-0000-000000000001','2026-07-10','Oil Change',      1500,'Completed'),
  ('c0a80401-0000-0000-0000-000000000002','c0a80201-0000-0000-0000-000000000002','2026-07-11','Tire Replacement', 8000,'In Shop')
ON CONFLICT (id) DO NOTHING;

-- Expenses (2 records)
INSERT INTO public.expenses (id, vehicle_id, date, type, amount, notes) VALUES
  ('c0a80501-0000-0000-0000-000000000001','c0a80201-0000-0000-0000-000000000001','2026-07-10','Fuel',3000,'Full tank'),
  ('c0a80501-0000-0000-0000-000000000002','c0a80201-0000-0000-0000-000000000002','2026-07-11','Toll',450, 'Highway toll')
ON CONFLICT (id) DO NOTHING;

-- Verify everything
SELECT 'vehicles'    AS tbl, COUNT(*) AS rows FROM public.vehicles    UNION ALL
SELECT 'drivers'     AS tbl, COUNT(*) AS rows FROM public.drivers     UNION ALL
SELECT 'trips'       AS tbl, COUNT(*) AS rows FROM public.trips       UNION ALL
SELECT 'maintenance' AS tbl, COUNT(*) AS rows FROM public.maintenance UNION ALL
SELECT 'expenses'    AS tbl, COUNT(*) AS rows FROM public.expenses    UNION ALL
SELECT 'profiles'    AS tbl, COUNT(*) AS rows FROM public.profiles;
