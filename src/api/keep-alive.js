// api/keep-alive.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // pake service role biar aman
);

export default async function handler(req, res) {
  // CORS biar bisa dipanggil dari mana aja
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. PING SIMPLE - query tabel kecil
    const { data: ping, error: pingError } = await supabase
      .from('students')
      .select('id')
      .limit(1);

    if (pingError) throw pingError;

    // 2. UPDATE LAST_PING (optional - bikin tabel sendiri)
    const { error: updateError } = await supabase
      .from('system_health')
      .upsert({
        id: 1,
        last_ping: new Date().toISOString(),
        status: 'active'
      }, { onConflict: 'id' });

    if (updateError) console.warn('Update health gagal:', updateError);

    return res.status(200).json({
      success: true,
      message: 'Supabase is alive!',
      timestamp: new Date().toISOString(),
      ping: ping[0]?.id || 'no data'
    });

  } catch (error) {
    console.error('Keep-alive error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}