// IndexNow - Instant URL indexing for Bing, Yandex, and others
// Usage: await notifyIndexNow(['/products/my-product', '/categories/caribbean-foods'])

const INDEXNOW_KEY = 'storesgo_indexing_key_2026';
const SITE_HOST = 'storesgo.com';

export async function notifyIndexNow(paths: string[]): Promise<boolean> {
  try {
    const urlList = paths.map(p => p.startsWith('http') ? p : `https://${SITE_HOST}${p}`);
    
    // IndexNow accepts up to 10,000 URLs per batch
    const batches = [];
    for (let i = 0; i < urlList.length; i += 10000) {
      batches.push(urlList.slice(i, i + 10000));
    }

    for (const batch of batches) {
      const res = await fetch('https://api.indexnow.org/IndexNow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: SITE_HOST,
          key: INDEXNOW_KEY,
          keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
          urlList: batch,
        }),
      });
      
      if (!res.ok) {
        console.error(`[IndexNow] Batch failed: ${res.status} ${res.statusText}`);
        return false;
      }
      console.log(`[IndexNow] Submitted ${batch.length} URLs successfully`);
    }
    return true;
  } catch (err) {
    console.error('[IndexNow] Error:', err);
    return false;
  }
}
