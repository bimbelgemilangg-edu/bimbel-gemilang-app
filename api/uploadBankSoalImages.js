// api/uploadBankSoalImages.js
// ============================================================
// Upload gambar diagram (base64) dari AdvancedQuestionExtractor
// ke Supabase Storage bucket "materi-bimbel/bank-soal/gambar/".
//
// Dipanggil dari frontend saat "Simpan ke Bank Soal".
// API key (secret) aman di server — tidak pernah ke browser.
//
// ENV VARS yang dibutuhkan di Vercel:
//   SUPABASE_SERVICE_ROLE_KEY  = sb_secret_xxxx...  ← wajib
//   NEXT_PUBLIC_SUPABASE_URL   = https://xxx.supabase.co  (opsional, ada fallback)
//
// Body  : { images: [{ key: string, dataUrl: "data:image/..." }] }
// Return: { success, uploaded: [{key, url}], errors: [{key, error}], uploadedCount }
// ============================================================

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 60,
  api: { bodyParser: { sizeLimit: '50mb' } },
};

/* ============================================================
   SUPABASE CLIENT — pakai Service Role (secret) key
   agar bisa upload tanpa tergantung RLS policy.
   URL: ambil dari env var, fallback ke URL project hardcoded.
============================================================ */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://hqoasblnrsijbflupoir.supabase.co';

const SUPABASE_SECRET =
  process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const BUCKET = 'materi-bimbel';
const FOLDER = 'bank-soal/gambar';

/* ============================================================
   HANDLER
============================================================ */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Cek service role key tersedia
  if (!SUPABASE_SECRET) {
    return res.status(500).json({
      success: false,
      error: 'SUPABASE_SERVICE_ROLE_KEY belum diset di environment variables.',
    });
  }

  // Buat client per-request agar fresh (aman di serverless)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET, {
    auth: { persistSession: false },
  });

  const { images } = req.body || {};

  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ success: false, error: 'Tidak ada gambar yang dikirim.' });
  }

  const uploaded = [];
  const errors   = [];

  for (const img of images) {
    const { key, dataUrl } = img || {};

    if (!key || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
      errors.push({ key: key || '?', error: 'dataUrl tidak valid atau bukan gambar.' });
      continue;
    }

    try {
      // Parse "data:<mime>;base64,<data>"
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
      if (!match) throw new Error('Format base64 tidak dikenali.');

      const [, mimeType, b64Data] = match;
      const buffer = Buffer.from(b64Data, 'base64');

      // Cek ukuran maks 10 MB per gambar
      if (buffer.byteLength > 10 * 1024 * 1024) {
        throw new Error(`Ukuran gambar ${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB melebihi batas 10 MB.`);
      }

      const ext      = mimeType.includes('png') ? 'png' : 'jpg';
      const safeName = String(key).replace(/[^a-z0-9\-]/gi, '_').slice(0, 80);
      const filePath = `${FOLDER}/${Date.now()}_${safeName}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert      : false,
        });

      if (upErr) throw new Error(upErr.message);

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      uploaded.push({ key, url: urlData.publicUrl, filePath });

    } catch (e) {
      console.error(`[uploadBankSoalImages] key=${key} error:`, e.message);
      errors.push({ key, error: e.message });
    }
  }

  return res.status(200).json({
    success      : true,
    uploaded,
    errors,
    total        : images.length,
    uploadedCount: uploaded.length,
  });
}