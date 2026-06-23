export default async function handler(req, res) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ status: 'error', message: 'Missing credentials' });
  }
  try {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY }
    });
    console.log(`[${now}] Keep-alive: ${response.ok ? 'OK' : 'Sent'}`);
    return res.status(200).json({ status: 'ok', timestamp: now });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
