// api/detectBookChapters.js
//
// 🔥 DETEKSI STRUKTUR BAB OTOMATIS — dipanggil SEKALI saat guru upload buku
// paket, BUKAN tiap kali generate alat bantu. Tujuannya: guru gak perlu lagi
// menghitung sendiri "Bab 1 itu mulai halaman berapa ya, dihitung dari cover
// apa bukan?" -- pertanyaan yang sah banget karena cover/kata pengantar/
// daftar isi selalu menggeser nomor halaman fisik PDF dari nomor cetak di
// buku.
//
// Cara kerja: kirim cuplikan PENDEK (bukan isi lengkap, cuma ~160 karakter
// pertama) dari SETIAP halaman fisik ke AI, minta AI kenali di halaman fisik
// mana tiap Bab/Bagian besar BENAR-BENAR dimulai sebagai judul -- bukan
// sekadar disebut-sebut di tabel/daftar isi/referensi silang.

const GEMINI_MODELS = [
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-2.5-flash-lite',
  ];
  
  async function callGemini(systemPrompt, userPrompt, modelName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.1, // rendah -- ini tugas identifikasi pola, bukan kreatif
          maxOutputTokens: 4096,
        },
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GEMINI_HTTP_${response.status}: ${errText}`);
    }
    return response.json();
  }
  
  const SYSTEM_PROMPT = `Kamu bertugas memetakan struktur BAB/BAGIAN besar dari sebuah buku pelajaran Indonesia, berdasarkan CUPLIKAN SINGKAT (bukan isi lengkap) dari setiap halaman fisik PDF-nya.
  
  Kamu akan menerima daftar baris dengan format:
  [halaman N] cuplikan singkat awal halaman itu...
  
  TUGASMU: kenali halaman FISIK mana yang benar-benar HALAMAN AWAL sebuah bab/bagian besar (contoh: "Bab 1", "Bab 2", "Bagian Panduan Umum", "Glosarium", dst) -- BUKAN halaman yang cuma MENYEBUT nama bab itu di dalam tabel, daftar isi, atau kalimat penjelasan lain.
  
  CIRI HALAMAN AWAL BAB YANG SEBENARNYA:
  - Cuplikannya biasanya PENDEK dan mirip JUDUL (bukan kalimat panjang atau tabel berisi banyak angka/daftar).
  - Sering diawali frasa penanda seperti "Panduan Khusus", "Panduan Umum", "Bagian", atau langsung nama babnya dalam format judul.
  - Kalau ada BANYAK halaman berturutan yang sama-sama menyebut "Bab 1", "Bab 2", dst berkali-kali dalam satu cuplikan (ciri tabel/daftar isi/daftar referensi), itu BUKAN halaman awal bab -- LEWATI semuanya.
  - Urutan halamannya harus naik dan masuk akal (Bab 2 harus mulai di halaman fisik yang lebih besar dari Bab 1, dst).
  - Setiap bab HANYA MUNCUL SEKALI sebagai halaman awal.
  
  Balas HANYA dalam format JSON array tunggal, tanpa teks pembuka/penutup/code fence, seperti ini:
  [{"title": "Bab 1 Lingkaran, Elips, dan Garis Singgung Lingkaran", "startPage": 35}, {"title": "Bab 2 Turunan Fungsi", "startPage": 109}]
  
  ATURAN:
  - "title" pakai judul lengkap dan rapi seperti tertulis di buku (gabungkan kalau judulnya terpotong jadi beberapa baris pendek di cuplikan).
  - "startPage" adalah NOMOR HALAMAN FISIK PDF (angka N di "[halaman N]"), BUKAN nomor halaman cetak yang mungkin tertulis kecil di buku.
  - Kalau kamu tidak yakin sama sekali, atau buku ini memang tidak berbentuk bab-bab yang jelas, balas array kosong: []
  - Jangan sertakan sub-bagian kecil (misal "A. Pendahuluan", "1. Tujuan Pembelajaran") -- HANYA bab/bagian besar tingkat atas.
  - Lebih baik array pendek tapi akurat, daripada panjang tapi salah tebak.`;
  
  export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { pages, bookTitle, totalPages } = req.body;
  
    if (!Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({ error: 'Data halaman kosong' });
    }
  
    // 🔥 Batasi jumlah halaman yang dipindai -- buku super tebal (600+ halaman)
    // tetap harus muat dalam satu panggilan AI yang wajar.
    const MAX_PAGES_SCANNED = 600;
    const limitedPages = pages.slice(0, MAX_PAGES_SCANNED);
  
    const snippetLines = limitedPages
      .map(p => `[halaman ${p.pageNumber}] ${(p.snippet || '').replace(/\s+/g, ' ').trim().slice(0, 160)}`)
      .join('\n');
  
    const userPrompt = `Judul buku: ${bookTitle || '-'}
  Total halaman: ${totalPages || pages.length}
  
  Cuplikan tiap halaman:
  ${snippetLines}
  
  Petakan struktur bab/bagian besarnya sekarang sesuai aturan di atas.`;
  
    let geminiData;
    let lastErr;
  
    for (const modelName of GEMINI_MODELS) {
      try {
        geminiData = await callGemini(SYSTEM_PROMPT, userPrompt, modelName);
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        console.error(`detectBookChapters gagal pakai model ${modelName}:`, e.message);
      }
    }
  
    // 🔥 PENTING: deteksi bab ini BONUS, bukan syarat wajib upload berhasil.
    // Kalau gagal total (misal kuota AI lagi habis), JANGAN gagalkan upload --
    // cukup balas array kosong, guru otomatis fallback ke atur halaman manual.
    if (lastErr) {
      console.error('detectBookChapters gagal di semua model:', lastErr.message);
      return res.status(200).json({ success: true, chapters: [] });
    }
  
    try {
      const candidate = geminiData?.candidates?.[0];
      let rawText = candidate?.content?.parts?.[0]?.text || '';
      rawText = rawText.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  
      let chapters = [];
      try {
        chapters = JSON.parse(rawText);
      } catch (e) {
        const match = rawText.match(/\[[\s\S]*\]/);
        if (match) {
          try { chapters = JSON.parse(match[0]); } catch (e2) { chapters = []; }
        }
      }
  
      if (!Array.isArray(chapters)) chapters = [];
  
      chapters = chapters
        .filter(c => c && typeof c.title === 'string' && c.title.trim() && Number.isInteger(c.startPage) && c.startPage >= 1)
        .sort((a, b) => a.startPage - b.startPage);
  
      const total = totalPages || pages.length;
      const chaptersWithRange = chapters.map((c, i) => ({
        title: c.title.trim(),
        startPage: c.startPage,
        endPage: i < chapters.length - 1 ? Math.max(c.startPage, chapters[i + 1].startPage - 1) : total,
      }));
  
      return res.status(200).json({ success: true, chapters: chaptersWithRange });
    } catch (error) {
      console.error('detectBookChapters parse error:', error);
      return res.status(200).json({ success: true, chapters: [] });
    }
  }