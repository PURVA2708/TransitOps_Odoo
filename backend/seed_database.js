/**
 * TransitOps - Supabase Database Setup Script
 * Uses the Supabase REST API with service role key to execute DDL via
 * the special pg endpoint that Supabase exposes for admin operations.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://fyjqmizbiifjwedonenz.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5anFtaXpiaWlmandlZG9uZW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzg0MTI4OSwiZXhwIjoyMDk5NDE3Mjg5fQ.nQT5pTaTpwZXlyECm4MqYworZVCB_IzX7ShBL5gg1Nw';

function httpsPost(url, body, headers) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const bodyStr = JSON.stringify(body);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'Prefer': 'return=representation',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(bodyStr);
    req.end();
  });
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function testConnection() {
  console.log('\n📡 Testing Supabase REST API connection...');
  const result = await httpsGet(`${SUPABASE_URL}/rest/v1/`);
  console.log(`   Status: ${result.status}`);
  if (result.status === 200) {
    console.log('   ✅ REST API connected successfully');
    return true;
  } else {
    console.log(`   ❌ Failed: ${result.body}`);
    return false;
  }
}

async function createUsers() {
  console.log('\n👥 Creating auth users...');
  
  const users = [
    { email: 'manager@transitops.in', password: 'demo1234', name: 'Tirth Patel', role: 'Fleet Manager' },
    { email: 'driver@transitops.in', password: 'demo1234', name: 'Alex Kumar', role: 'Driver' },
    { email: 'safety@transitops.in', password: 'demo1234', name: 'Sana Iqbal', role: 'Safety Officer' },
    { email: 'finance@transitops.in', password: 'demo1234', name: 'Meera Nair', role: 'Financial Analyst' },
  ];

  for (const u of users) {
    const result = await httpsPost(
      `${SUPABASE_URL}/auth/v1/admin/users`,
      {
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name, role: u.role }
      },
      {}
    );

    if (result.status === 201 || result.status === 200) {
      const data = JSON.parse(result.body);
      console.log(`   ✅ Created user: ${u.email} (${u.role}) ID: ${data.id}`);
    } else if (result.status === 422) {
      console.log(`   ⚠️  User already exists: ${u.email}`);
    } else {
      console.log(`   ❌ Failed to create ${u.email}: ${result.body}`);
    }
  }
}

async function insertVehicles() {
  console.log('\n🚛 Inserting vehicles...');
  
  const vehicles = [
    { id: 'c0a80201-0000-0000-0000-000000000001', reg: 'RJ14-GA-2025', name: 'Tata Ace', type: 'Mini Truck', capacity: 750, odometer: 45200, cost: 600000, status: 'Available' },
    { id: 'c0a80201-0000-0000-0000-000000000002', reg: 'MH12-AB-1180', name: 'Ashok Leyland', type: 'Truck', capacity: 2000, odometer: 128400, cost: 1800000, status: 'On Trip' },
    { id: 'c0a80201-0000-0000-0000-000000000003', reg: 'DL01-CG-9090', name: 'Force Traveller', type: 'Van', capacity: 900, odometer: 76100, cost: 950000, status: 'In Shop' },
    { id: 'c0a80201-0000-0000-0000-000000000004', reg: 'GJ05-KL-3321', name: 'Eicher Pro', type: 'Truck', capacity: 2500, odometer: 98700, cost: 2100000, status: 'On Trip' },
    { id: 'c0a80201-0000-0000-0000-000000000005', reg: 'RJ14-GA-7781', name: 'Tata Ace Gold', type: 'Mini Truck', capacity: 750, odometer: 21050, cost: 620000, status: 'Available' },
    { id: 'c0a80201-0000-0000-0000-000000000006', reg: 'UP32-DE-1020', name: 'Mahindra Bolero', type: 'Van', capacity: 850, odometer: 55300, cost: 890000, status: 'Available' },
    { id: 'c0a80201-0000-0000-0000-000000000007', reg: 'MH14-XY-4567', name: 'BharatBenz', type: 'Truck', capacity: 3000, odometer: 143000, cost: 2600000, status: 'On Trip' },
    { id: 'c0a80201-0000-0000-0000-000000000008', reg: 'HR26-AA-1122', name: 'Maruti Eeco', type: 'Van', capacity: 600, odometer: 33400, cost: 560000, status: 'Available' },
    { id: 'c0a80201-0000-0000-0000-000000000009', reg: 'PB10-ZZ-8899', name: 'Tata 407 (old)', type: 'Truck', capacity: 2200, odometer: 310000, cost: 1400000, status: 'Retired' },
  ];

  const result = await httpsPost(
    `${SUPABASE_URL}/rest/v1/vehicles`,
    vehicles,
    { 'Prefer': 'resolution=ignore-duplicates,return=minimal' }
  );

  if (result.status === 201 || result.status === 200) {
    console.log(`   ✅ Inserted ${vehicles.length} vehicles`);
  } else {
    console.log(`   ❌ Failed: ${result.body}`);
  }
}

async function insertDrivers() {
  console.log('\n🧑‍✈️ Inserting drivers...');
  
  const drivers = [
    { id: 'c0a80301-0000-0000-0000-000000000001', name: 'Alex Kumar', license: 'DL-0420256789', category: 'HMV', expiry: '2027-05-10', contact: '9800000001', score: 85, status: 'On Trip' },
    { id: 'c0a80301-0000-0000-0000-000000000002', name: 'Ravi Singh', license: 'DL-0419887654', category: 'LMV', expiry: '2026-11-22', contact: '9800000002', score: 78, status: 'Available' },
    { id: 'c0a80301-0000-0000-0000-000000000003', name: 'Sana Iqbal', license: 'DL-0421334455', category: 'HMV', expiry: '2028-02-14', contact: '9800000003', score: 91, status: 'On Trip' },
    { id: 'c0a80301-0000-0000-0000-000000000004', name: 'John Peter', license: 'DL-0418223344', category: 'LMV', expiry: '2026-08-30', contact: '9800000004', score: 72, status: 'Off Duty' },
    { id: 'c0a80301-0000-0000-0000-000000000005', name: 'Meera Nair', license: 'DL-0422556677', category: 'HMV', expiry: '2027-09-01', contact: '9800000005', score: 88, status: 'On Trip' },
    { id: 'c0a80301-0000-0000-0000-000000000006', name: 'Vikas Rao', license: 'DL-0417009988', category: 'LMV', expiry: '2025-12-31', contact: '9800000006', score: 60, status: 'Suspended' },
    { id: 'c0a80301-0000-0000-0000-000000000007', name: 'Priya Menon', license: 'DL-0423110022', category: 'LMV', expiry: '2026-06-15', contact: '9800000007', score: 82, status: 'Available' },
  ];

  const result = await httpsPost(
    `${SUPABASE_URL}/rest/v1/drivers`,
    drivers,
    { 'Prefer': 'resolution=ignore-duplicates,return=minimal' }
  );

  if (result.status === 201 || result.status === 200) {
    console.log(`   ✅ Inserted ${drivers.length} drivers`);
  } else {
    console.log(`   ❌ Failed: ${result.body}`);
  }
}

async function insertTrips() {
  console.log('\n🗺️  Inserting trips...');
  
  const trips = [
    { id: 'TR-1042', source: 'Delhi Warehouse', dest: 'Jaipur Store', vehicle_id: 'c0a80201-0000-0000-0000-000000000002', driver_id: 'c0a80301-0000-0000-0000-000000000001', cargo: 1200, distance: 280, revenue: 12000, status: 'Dispatched' },
    { id: 'TR-1041', source: 'Mumbai Hub', dest: 'Pune Depot', vehicle_id: 'c0a80201-0000-0000-0000-000000000004', driver_id: 'c0a80301-0000-0000-0000-000000000003', cargo: 1800, distance: 150, revenue: 9000, status: 'Dispatched' },
    { id: 'TR-1040', source: 'Surat Center', dest: 'Ahmedabad DC', vehicle_id: 'c0a80201-0000-0000-0000-000000000007', driver_id: 'c0a80301-0000-0000-0000-000000000005', cargo: 2400, distance: 265, revenue: 15000, status: 'Dispatched' },
    { id: 'TR-1039', source: 'Delhi Warehouse', dest: 'Agra Outlet', vehicle_id: 'c0a80201-0000-0000-0000-000000000001', driver_id: 'c0a80301-0000-0000-0000-000000000002', cargo: 500, distance: 230, revenue: 8000, status: 'Draft' },
    { id: 'TR-1038', source: 'Noida Store', dest: 'Gurgaon Hub', vehicle_id: 'c0a80201-0000-0000-0000-000000000006', driver_id: 'c0a80301-0000-0000-0000-000000000007', cargo: 640, distance: 60, revenue: 4000, status: 'Draft' },
    { id: 'TR-1037', source: 'Jaipur Store', dest: 'Delhi Warehouse', vehicle_id: 'c0a80201-0000-0000-0000-000000000005', driver_id: 'c0a80301-0000-0000-0000-000000000001', cargo: 700, distance: 280, revenue: 11000, status: 'Completed', final_odometer: 21050, fuel_consumed: 35 },
  ];

  const result = await httpsPost(
    `${SUPABASE_URL}/rest/v1/trips`,
    trips,
    { 'Prefer': 'resolution=ignore-duplicates,return=minimal' }
  );

  if (result.status === 201 || result.status === 200) {
    console.log(`   ✅ Inserted ${trips.length} trips`);
  } else {
    console.log(`   ❌ Failed: ${result.body}`);
  }
}

async function insertMaintenance() {
  console.log('\n🔧 Inserting maintenance records...');
  
  const records = [
    { id: 'c0a80401-0000-0000-0000-000000000001', vehicle_id: 'c0a80201-0000-0000-0000-000000000001', date: '2026-07-10', description: 'Oil Change', cost: 1500, status: 'Completed' },
    { id: 'c0a80401-0000-0000-0000-000000000002', vehicle_id: 'c0a80201-0000-0000-0000-000000000002', date: '2026-07-11', description: 'Tire Replacement', cost: 8000, status: 'In Shop' },
  ];

  const result = await httpsPost(
    `${SUPABASE_URL}/rest/v1/maintenance`,
    records,
    { 'Prefer': 'resolution=ignore-duplicates,return=minimal' }
  );

  if (result.status === 201 || result.status === 200) {
    console.log(`   ✅ Inserted ${records.length} maintenance records`);
  } else {
    console.log(`   ❌ Failed: ${result.body}`);
  }
}

async function insertExpenses() {
  console.log('\n💰 Inserting expense records...');
  
  const records = [
    { id: 'c0a80501-0000-0000-0000-000000000001', vehicle_id: 'c0a80201-0000-0000-0000-000000000001', date: '2026-07-10', type: 'Fuel', amount: 3000, notes: 'Full tank' },
    { id: 'c0a80501-0000-0000-0000-000000000002', vehicle_id: 'c0a80201-0000-0000-0000-000000000002', date: '2026-07-11', type: 'Toll', amount: 450, notes: 'Highway toll' },
  ];

  const result = await httpsPost(
    `${SUPABASE_URL}/rest/v1/expenses`,
    records,
    { 'Prefer': 'resolution=ignore-duplicates,return=minimal' }
  );

  if (result.status === 201 || result.status === 200) {
    console.log(`   ✅ Inserted ${records.length} expense records`);
  } else {
    console.log(`   ❌ Failed: ${result.body}`);
  }
}

async function verifyData() {
  console.log('\n🔍 Verifying seeded data...');
  
  const tables = ['vehicles', 'drivers', 'trips', 'maintenance', 'expenses'];
  for (const table of tables) {
    const result = await httpsGet(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=100`);
    if (result.status === 200) {
      const data = JSON.parse(result.body);
      console.log(`   ✅ ${table}: ${data.length} records`);
    } else {
      console.log(`   ❌ ${table}: Error ${result.status} - ${result.body}`);
    }
  }
}

async function main() {
  console.log('='.repeat(55));
  console.log('  TransitOps — Supabase Data Seeding');
  console.log('='.repeat(55));
  console.log(`  Project: fyjqmizbiifjwedonenz`);
  console.log(`  URL: ${SUPABASE_URL}`);
  console.log('');
  console.log('  NOTE: Run schema.sql in Supabase SQL Editor FIRST');
  console.log('  before running this seeder.');
  console.log('='.repeat(55));

  const connected = await testConnection();
  if (!connected) {
    console.log('\n❌ Cannot connect to Supabase. Check your URL and keys.');
    process.exit(1);
  }

  await createUsers();
  await insertVehicles();
  await insertDrivers();
  await insertTrips();
  await insertMaintenance();
  await insertExpenses();
  await verifyData();

  console.log('\n' + '='.repeat(55));
  console.log('  ✅ TransitOps seeding completed!');
  console.log('='.repeat(55));
  console.log('\n  Next steps:');
  console.log('  1. Go to Supabase SQL Editor and run schema.sql');
  console.log('  2. Verify tables + RLS policies in the Dashboard');
  console.log('  3. Restart the frontend dev server');
  console.log('  4. Sign in with: manager@transitops.in / demo1234\n');
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
