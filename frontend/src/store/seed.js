// Seed data for demo (until Supabase is wired). Same shape the backend
// queries will return, so swapping to real data is a one-layer change.

export const SEED = {
  vehicles: [
    { id: 'v1', reg: 'RJ14-GA-2025', name: 'Tata Ace',      type: 'Mini Truck', capacity: 750,  odometer: 45200, cost: 600000, status: 'Available' },
    { id: 'v2', reg: 'MH12-AB-1180', name: 'Ashok Leyland', type: 'Truck',      capacity: 2000, odometer: 128400, cost: 1800000, status: 'On Trip' },
    { id: 'v3', reg: 'DL01-CG-9090', name: 'Force Traveller',type: 'Van',        capacity: 900,  odometer: 76100, cost: 950000,  status: 'In Shop' },
    { id: 'v4', reg: 'GJ05-KL-3321', name: 'Eicher Pro',     type: 'Truck',      capacity: 2500, odometer: 98700, cost: 2100000, status: 'On Trip' },
    { id: 'v5', reg: 'RJ14-GA-7781', name: 'Tata Ace Gold',  type: 'Mini Truck', capacity: 750,  odometer: 21050, cost: 620000,  status: 'Available' },
    { id: 'v6', reg: 'UP32-DE-1020', name: 'Mahindra Bolero',type: 'Van',        capacity: 850,  odometer: 55300, cost: 890000,  status: 'Available' },
    { id: 'v7', reg: 'MH14-XY-4567', name: 'BharatBenz',     type: 'Truck',      capacity: 3000, odometer: 143000, cost: 2600000, status: 'On Trip' },
    { id: 'v8', reg: 'HR26-AA-1122', name: 'Maruti Eeco',    type: 'Van',        capacity: 600,  odometer: 33400, cost: 560000,  status: 'Available' },
    { id: 'v9', reg: 'PB10-ZZ-8899', name: 'Tata 407 (old)', type: 'Truck',      capacity: 2200, odometer: 310000, cost: 1400000, status: 'Retired' },
  ],
  drivers: [
    { id: 'd1', name: 'Alex Kumar',  license: 'DL-0420256789', category: 'HMV', expiry: '2027-05-10', contact: '9800000001', score: 85, status: 'On Trip' },
    { id: 'd2', name: 'Ravi Singh',  license: 'DL-0419887654', category: 'LMV', expiry: '2026-11-22', contact: '9800000002', score: 78, status: 'Available' },
    { id: 'd3', name: 'Sana Iqbal',  license: 'DL-0421334455', category: 'HMV', expiry: '2028-02-14', contact: '9800000003', score: 91, status: 'On Trip' },
    { id: 'd4', name: 'John Peter',  license: 'DL-0418223344', category: 'LMV', expiry: '2026-08-30', contact: '9800000004', score: 72, status: 'Off Duty' },
    { id: 'd5', name: 'Meera Nair',  license: 'DL-0422556677', category: 'HMV', expiry: '2027-09-01', contact: '9800000005', score: 88, status: 'On Trip' },
    { id: 'd6', name: 'Vikas Rao',   license: 'DL-0417009988', category: 'LMV', expiry: '2025-12-31', contact: '9800000006', score: 60, status: 'Suspended' },
    { id: 'd7', name: 'Priya Menon', license: 'DL-0423110022', category: 'LMV', expiry: '2026-06-15', contact: '9800000007', score: 82, status: 'Available' },
  ],
  trips: [
    { id: 'TR-1042', source: 'Delhi Warehouse', dest: 'Jaipur Store',   vehicleId: 'v2', driverId: 'd1', cargo: 1200, distance: 280, revenue: 12000, status: 'Dispatched' },
    { id: 'TR-1041', source: 'Mumbai Hub',      dest: 'Pune Depot',     vehicleId: 'v4', driverId: 'd3', cargo: 1800, distance: 150, revenue: 9000,  status: 'Dispatched' },
    { id: 'TR-1040', source: 'Surat Center',    dest: 'Ahmedabad DC',   vehicleId: 'v7', driverId: 'd5', cargo: 2400, distance: 265, revenue: 15000, status: 'Dispatched' },
    { id: 'TR-1039', source: 'Delhi Warehouse', dest: 'Agra Outlet',    vehicleId: 'v1', driverId: 'd2', cargo: 500,  distance: 230, revenue: 8000,  status: 'Draft' },
    { id: 'TR-1038', source: 'Noida Store',     dest: 'Gurgaon Hub',    vehicleId: 'v6', driverId: 'd7', cargo: 640,  distance: 60,  revenue: 4000,  status: 'Draft' },
    { id: 'TR-1037', source: 'Jaipur Store',    dest: 'Delhi Warehouse',vehicleId: 'v5', driverId: 'd1', cargo: 700,  distance: 280, revenue: 11000, status: 'Completed', finalOdometer: 21050, fuelConsumed: 35 },
  ],
}

export const VEHICLE_TYPES = ['Mini Truck', 'Van', 'Truck']
export const LICENSE_CATEGORIES = ['LMV', 'HMV']
