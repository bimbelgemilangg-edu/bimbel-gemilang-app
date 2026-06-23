/**
 * Vercel Cron Job - Supabase Keep-Alive
 * Dipanggil otomatis setiap 6 jam untuk mencegah Supabase paused
 * 
 * Cron schedule: 0 */6 * * * (setiap 6 jam)
 */

export default async function handler(req, res) {
  // Ambil Supabase credentials dari environment variables
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  // Log timestamp
  const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  console.log(`[${now}] 🔄 Supabase Keep-Alive triggered`);

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('⚠️ Supabase credentials not found in env');
    return res.status(500).json({
      status: 'error',
      message: 'Missing Supabase credentials',
      timestamp: now
    });
  }

  const results = {
    bucket: false,
    rest: false,
    auth: false
  };

  try {
    // === Cara 1: Cek bucket list (request paling ringan) ===
    const bucketResponse = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (bucketResponse.ok) {
      const buckets = await bucketResponse.json();
      results.bucket = true;
      console.log(`✅ Bucket check OK - ${buckets?.length || 0} buckets found`);
    } else {
      console.warn(`⚠️ Bucket check failed: ${bucketResponse.status}`);
    }

    // === Cara 2: Fallback - ping REST API ===
    if (!results.bucket) {
      const restResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY
        }
      });
      results.rest = true;
      console.log('✅ REST API ping sent');
    }

    // === Cara 3: Fallback - coba auth endpoint ===
    if (!results.bucket && !results.rest) {
      const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY
        }
      });
      results.auth = true;
      console.log('✅ Auth endpoint ping sent');
    }

    // Success response
    return res.status(200).json({
      status: 'ok',
      message: 'Supabase keep-alive ping completed',
      timestamp: now,
      results,
      nextRun: 'in ~6 hours'
    });

  } catch (error) {
    console.error('❌ Keep-alive error:', error.message);
    
    return res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: now
    });
  }
}