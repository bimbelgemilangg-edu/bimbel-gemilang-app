// api/uploadBankSoalImages.js
// ============================================================
// UPLOAD GAMBAR BANK SOAL KE SUPABASE STORAGE
// ============================================================
// 🔥 BARU: dipanggil dari AdvancedQuestionExtractor.jsx (halaman
// admin /admin/bank-soal versi baru) SEBELUM data disimpan ke
// Firestore. Kenapa ini HARUS lewat backend (bukan langsung dari
// browser kayak fitur upload gambar guru yang lain di project ini):
// upload ke Supabase Storage butuh SERVICE KEY yang TIDAK BOLEH
// ditaruh di kode frontend (browser) sama sekali -- siapa pun bisa
// buka DevTools dan mencurinya kalau itu terjadi.
//
// TUGAS ENDPOINT INI CUMA SATU: terima daftar gambar base64, upload
// ke Supabase Storage, kembalikan URL publiknya. TIDAK menyentuh
// Firestore sama sekali -- penyimpanan ke Firestore (koleksi
// "bank_soal") tetap dilakukan di FRONTEND lewat writeBatch(db),
// PERSIS pola yang sudah dipakai di seluruh project ini (lihat
// BankSoalImportPage.jsx versi lama sebagai contoh) -- supaya
// konsisten, bukan bikin cara baru yang beda sendiri.
//
// ENV VAR YANG DIPERLUKAN (Vercel):
//   - SUPABASE_URL          (URL project Supabase, mis. https://xxxx.supabase.co)
//   - SUPABASE_SERVICE_KEY  (service_role key -- BUKAN anon key --
//                            dari Supabase Dashboard > Settings > API.
//                            Ini WAJIB service_role karena perlu izin
//                            tulis ke bucket; anon key biasanya
//                            cuma baca)
// ============================================================

export const config = { maxDuration: 60 };

const SUPABASE_BUCKET = process.env.SUPABASE_BANKSOAL_BUCKET || 'materi-bimbel';
const SUPABASE_FOLDER = 'bank-soal';

function base64ToBuffer(dataUrl) {
  const match = String(dataUrl || '').match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: `image/${match[1]}`,
    buffer: Buffer.from(match[2], 'base64'),
  };
}

async function uploadOneImage(supabaseUrl, serviceKey, dataUrl, fileName) {
  const parsed = base64ToBuffer(dataUrl);
  if (!parsed) {
    throw new Error('Format gambar tidak valid (bukan data URL base64 gambar).');
  }

  const objectPath = `${SUPABASE_FOLDER}/${fileName}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${SUPABASE_BUCKET}/${objectPath}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': parsed.mimeType,
      'x-upsert': 'true',
    },
    body: parsed.buffer,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Supabase upload gagal (${response.status}): ${errText.slice(0, 300)}`);
  }

  // URL publik -- asumsi bucket sudah di-set PUBLIC di Supabase
  // Dashboard (sama seperti bucket yang sudah dipakai fitur upload
  // guru lainnya di project ini). Kalau bucket ini PRIVATE, URL ini
  // gak akan bisa diakses langsung -- perlu signed URL sebagai
  // gantinya (kasih tau saya kalau ternyata begitu).
  return `${supabaseUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/${objectPath}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({
      success: false,
      error: 'SUPABASE_URL / SUPABASE_SERVICE_KEY belum di-setting di Vercel. Ambil dari Supabase Dashboard > Settings > API (pakai service_role key, BUKAN anon key).',
    });
  }

  const { images } = req.body || {};

  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ success: false, error: 'Field "images" (array) wajib diisi, minimal 1 gambar.' });
  }

  const results = [];
  const errors = [];

  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    const dataUrl = item?.dataUrl;
    const key = item?.key || `gambar-${Date.now()}-${i}`;

    if (!dataUrl) {
      errors.push({ key, error: 'dataUrl kosong.' });
      continue;
    }

    try {
      // eslint-disable-next-line no-await-in-loop
      const url = await uploadOneImage(supabaseUrl, serviceKey, dataUrl, `${key}.png`);
      results.push({ key, url });
    } catch (err) {
      errors.push({ key, error: err.message || 'Gagal upload.' });
    }
  }

  return res.status(200).json({
    success: true,
    uploaded: results,
    errors,
  });
}