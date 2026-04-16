/* eslint-disable */
// ---------------------------------------------------------
// StoresGo Phase 10 Scaffolding (Remapped)
// Generated: 2025-10-26T05:27:03.730802
// ---------------------------------------------------------

import fetch from 'node-fetch';
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5000';

async function get(p){ const r=await fetch(baseURL+p); return r.json(); }
async function post(p,b){ const r=await fetch(baseURL+p,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b)}); return r.json(); }

async function run() {
  console.log('🧪 Phase 10 Smoke (single + bulk + approvals)');
  // single
  const single = await post('/api/seller/products/create', { sellerId: 1, name: 'Royal Basmati Rice 10lb', description: 'Fragrant basmati', sku: 'RB-10', priceCents: 1599 });
  console.log('single:', single);

  // bulk (CSV)
  const csv = 'name,sku,price,description\nYellow Plantain 5ct,PL-5CT,5.99,Fresh Caribbean plantains\nJasmine Rice 20lb,JR-20,19.99,Premium long grain';
  const upload = await post('/api/imports/upload', { filename: 'seed.csv', sellerId: 1, csv });
  console.log('upload:', upload);

  const preview = await get(`/api/imports/preview/${upload.jobId}`);
  console.log('preview count:', preview.items?.length);

  const commit = await post(`/api/imports/commit/${upload.jobId}`, {});
  console.log('commit:', commit);

  const pending = await get('/api/admin/products/pending');
  console.log('pending:', pending.items?.length);

  if (pending.items?.length) {
    const id = pending.items[0].id;
    const ok = await post(`/api/admin/products/${id}/approve`, {});
    console.log('approve first pending:', ok);
  }

  const logs = await get('/api/admin/imports/logs');
  console.log('ai logs count:', Array.isArray(logs.logs) ? logs.logs.length : 0);
}
run().catch(e => { console.error(e); process.exit(1); });
