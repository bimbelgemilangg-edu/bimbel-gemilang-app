// api/create-payment.js
export default async function handler(req, res) {
    // Hanya terima method POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      const { orderId, grossAmount, customerName, customerPhone, paketNama, paketId } = req.body;
  
      // Validasi input
      if (!orderId || !grossAmount) {
        return res.status(400).json({ error: 'orderId dan grossAmount wajib diisi' });
      }
  
      // Ambil Server Key dari environment variable
      const serverKey = process.env.MIDTRANS_SERVER_KEY;
      if (!serverKey) {
        console.error('MIDTRANS_SERVER_KEY tidak ditemukan!');
        return res.status(500).json({ error: 'Server key tidak dikonfigurasi' });
      }
  
      // Buat Basic Auth Header
      const authString = Buffer.from(serverKey + ':').toString('base64');
  
      // ============================================================
      // 🔥 PAYLOAD UNTUK SNAP API (BUKAN PAYMENT LINK STATIS)
      // ============================================================
      const payload = {
        transaction_details: {
          order_id: orderId, // 🔥 ID FIRESTORE DINAMIS!
          gross_amount: Number(grossAmount) // 🔥 HARGA TERKUNCI!
        },
        customer_details: {
          first_name: customerName || 'Siswa',
          phone: customerPhone || '',
          email: customerName ? `${customerName.toLowerCase().replace(/ /g, '')}@bimbelgemilang.com` : 'siswa@bimbelgemilang.com'
        },
        item_details: [
          {
            id: paketId || 'paket_bimbel',
            price: Number(grossAmount),
            quantity: 1,
            name: paketNama || 'Paket Bimbel Gemilang'
          }
        ],
        // 🔥 CALLBACK URL (OPSIONAL)
        callbacks: {
          finish: 'https://bimbel-gemilang-app.vercel.app/pendaftaran/success',
          error: 'https://bimbel-gemilang-app.vercel.app/pendaftaran/error'
        }
      };
  
      console.log('📤 Mengirim ke Midtrans Snap API:', JSON.stringify(payload, null, 2));
  
      // ============================================================
      // 🔥 ENDPOINT SNAP API (BUKAN PAYMENT LINK)
      // ============================================================
      const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authString}`
        },
        body: JSON.stringify(payload)
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        console.error('❌ Midtrans Snap API error:', data);
        return res.status(response.status).json({ 
          error: data.error_messages || 'Gagal membuat transaksi',
          midtransResponse: data
        });
      }
  
      console.log('✅ Midtrans Snap API success:', data);
  
      // ============================================================
      // 🔥 KIRIM REDIRECT_URL + TOKEN KE FRONTEND
      // ============================================================
      return res.status(200).json({
        success: true,
        redirect_url: data.redirect_url,
        token: data.token
      });
  
    } catch (error) {
      console.error('❌ Server error:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    }
  }