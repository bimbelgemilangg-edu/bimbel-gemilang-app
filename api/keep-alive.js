// api/keep-alive.js
export default async function handler(req, res) {
  // Biar bisa diakses dari mana aja
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // PING Supabase pake fetch langsung
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(200).json({
        success: false,
        message: 'Supabase credentials not set',
        timestamp: new Date().toISOString()
      });
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/students?select=id&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      message: 'Supabase is alive!',
      timestamp: new Date().toISOString(),
      ping: data[0]?.id || 'no data'
    });

  } catch (error) {
    console.error('Keep-alive error:', error);
    return res.status(200).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}