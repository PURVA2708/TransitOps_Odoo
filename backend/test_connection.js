const https = require('https');

const PROJECT_REF = 'fyjqmizbiifjwedonenz';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5anFtaXpiaWlmandlZG9uZW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzg0MTI4OSwiZXhwIjoyMDk5NDE3Mjg5fQ.nQT5pTaTpwZXlyECm4MqYworZVCB_IzX7ShBL5gg1Nw';

function callManagementApi(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Testing Management API connection...');
  const result = await callManagementApi('SELECT current_database(), current_user, version();');
  console.log('Status:', result.status);
  console.log('Response:', result.body);
}

main().catch(console.error);
