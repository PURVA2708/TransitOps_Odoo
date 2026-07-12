/**
 * TransitOps - Schema Executor
 * Uses Supabase's internal pg endpoint to run DDL SQL with service role key.
 */

const https = require('https');

const SUPABASE_URL = 'https://fyjqmizbiifjwedonenz.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5anFtaXpiaWlmandlZG9uZW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzg0MTI4OSwiZXhwIjoyMDk5NDE3Mjg5fQ.nQT5pTaTpwZXlyECm4MqYworZVCB_IzX7ShBL5gg1Nw';
const PROJECT_REF = 'fyjqmizbiifjwedonenz';

// Supabase exposes a pg endpoint via the Kong gateway
async function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const urlObj = new URL(`${SUPABASE_URL}/pg/query`);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Try the Supabase DB REST v2 endpoint
async function runSQLv2(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const urlObj = new URL(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`);
    // Try with service role as bearer
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// POST to profiles endpoint for profiles seeding
async function httpsPost(path, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const urlObj = new URL(`${SUPABASE_URL}${path}`);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Testing /pg/query endpoint...');
  const r1 = await runSQL('SELECT 1 AS test');
  console.log('pg/query status:', r1.status, r1.body.substring(0, 200));

  console.log('\nTesting Management API endpoint...');
  const r2 = await runSQLv2('SELECT 1 AS test');
  console.log('Management API status:', r2.status, r2.body.substring(0, 200));
}

main().catch(console.error);
