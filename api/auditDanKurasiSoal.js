// api/auditDanKurasiSoal.js
// ============================================================
// OTAK AI KURATOR & AUDIT BANK SOAL GEMILANG (TKA & UTBK)
// ============================================================
// Fungsi:
// 1. Membaca & membedah teks soal mentah / hasil scan
// 2. Mendeteksi Bab & Topik kurikulum resmi secara presisi
// 3. Membersihkan artefak OCR & tag HTML (PPAD, footer, dll)
// 4. Memverifikasi kelayakan butir (menolak visual/tabel hilang)
// 5. Menentukan tipe interaksi (PG biasa, PG Kompleks, Benar/Salah)
// ============================================================

import { kunciGeminiUntuk } from '../lib/kunciGemini.js';

export const config = {
  maxDuration: 60,
};

const SYSTEM_PROMPT = `Kamu adalah Otak AI Kurator & Auditor Bank Soal Bimbel Gemilang.
Tugasmu adalah menganalisis, membersihkan, dan mengklasifikasikan butir-butir soal ujian (TKA SMP, TKA SD, atau UTBK SNBT SMA).

ATURAN KURASI WAJIB:
1. Pembersihan OCR & Teks:
   - Buang semua tag HTML (seperti <em>, <p>, <span>) dan artefak footer OCR seperti "PPAD-1/Literasi Numerasi", nomor halaman, dan garis pemisah.
   - Perbaiki rumus LaTeX yang rusak (misalnya pecahan terpotong, kurung hilang, atau simbol matematika).
2. Klasifikasi Tipe Soal:
   - "pg_sederhana" : Pilihan ganda 1 jawaban benar (opsi A-E).
   - "pg_kompleks"  : Pilihan ganda lebih dari 1 jawaban benar (checkbox).
   - "benar_salah"  : Tabel pernyataan di mana tiap baris dinilai Benar/Salah.
3. Penilaian Kelayakan Butir:
   - TANDAI "layak": false jika soal menyebut "perhatikan tabel berikut" atau "gambar berikut" TETAPI tabel atau gambarnya tidak ada.
   - TANDAI "layak": false jika rumus matematika tidak terbaca atau rusak fatal (misal penyebut bernilai nol akibat salah baca).
   - TANDAI "layak": true jika soal lengkap, mandiri, dan dapat dijawab oleh siswa.
4. Pemetaan Bab & Topik:
   - TKA SMP Matematika:
     * Bab 1: Bilangan (Operasi, Pecahan, Pangkat & Bentuk Akar)
     * Bab 2: Aljabar (SPLDV, Persamaan Kuadrat, Pola Barisan & Aritmetika Sosial)
     * Bab 3: Geometri & Pengukuran (Segitiga, Segiempat, Sudut, Pythagoras, Bangun Ruang, Lingkaran)
     * Bab 4: Data & Peluang (Statistika, Diagram, Rata-rata & Peluang Teoretik)

FORMAT KELUARAN:
Kembalikan HANYA array JSON (tanpa markdown fence) berisi objek per soal dengan skema:
[
  {
    "id": "...",
    "layak": true,
    "alasanTidakLayak": null,
    "tipeSoal": "pg_sederhana" | "pg_kompleks" | "benar_salah",
    "babNomor": 1 | 2 | 3 | 4,
    "namaBab": "...",
    "teksSoal": "...",
    "opsi": [{ "label": "A", "text": "..." }, ...],
    "pernyataan": [{ "id": 1, "teks": "...", "kunci": "benar" | "salah" }],
    "kunciJawaban": "...",
    "pembahasan": "..."
  }
]`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Gunakan POST.' });
  }

  const apiKey = kunciGeminiUntuk(process.env, 'soal');
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_SOAL atau GEMINI_API_KEY belum dikonfigurasi di environment variables.',
    });
  }

  try {
    const { soalList = [], jenjang = 'SMP', subtesKode = 'MTK' } = req.body || {};

    if (!Array.isArray(soalList) || soalList.length === 0) {
      return res.status(400).json({ error: 'soalList harus berupa array dan tidak boleh kosong.' });
    }

    // Ambil sampel maksimal 15 soal per batch demi kuota & performa
    const batch = soalList.slice(0, 15);

    const userPrompt = `Analisis dan kurasi ${batch.length} butir soal untuk jenjang ${jenjang}, subtes ${subtesKode}:
${JSON.stringify(batch, null, 2)}`;

    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gemini-flash-latest',
        temperature: 0.1,
        max_tokens: 8192,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    const rawText = await resp.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(500).json({ error: 'Gagal parse respon JSON AI.', raw: rawText.slice(0, 400) });
    }

    if (!resp.ok) {
      return res.status(resp.status).json({
        error: data?.error?.message || `AI error HTTP ${resp.status}`,
      });
    }

    const content = data?.choices?.[0]?.message?.content || '';
    let parsedHasil = [];
    try {
      // Bersihkan kemungkinan code block
      const cleanJson = content.replace(/^```json/im, '').replace(/^```/im, '').replace(/```$/m, '').trim();
      parsedHasil = JSON.parse(cleanJson);
    } catch (_err) {
      return res.status(500).json({ error: 'AI mengembalikan format bukan JSON valid.', content });
    }

    return res.status(200).json({
      sukses: true,
      totalDiproses: parsedHasil.length,
      data: parsedHasil,
    });
  } catch (error) {
    console.error('[auditDanKurasiSoal] Error:', error);
    return res.status(500).json({ error: error.message || 'Terjadi kesalahan pada server kurasi AI.' });
  }
}
