// api/generateGuruLearningAid.js
//
// 🔥 ALAT BANTU GURU — BEDA TOTAL dari generateMateriSection.js.
// generateMateriSection.js -> materi buat SISWA, ditulis bebas oleh AI.
// File ini -> alat bantu buat GURU, WAJIB DIGROUNDING ke teks buku paket
// yang guru upload sendiri (`sourceText`) -- AI DILARANG mengarang fakta
// di luar teks itu. Ini yang bikin standar Bimbel Gemilang konsisten
// (semua guru narik dari sumber buku yang sama), bukan tergantung
// pengetahuan umum AI yang bisa beda-beda tiap kali dipanggil.
//
// Hasilnya 3 bagian: Capaian Pembelajaran, RPP Ringkas, dan Materi Inti
// (gaya Cara Gemilang, tapi ditulis level GURU -- boleh lebih teknis
// dibanding materi siswa).

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
          temperature: 0.3,
          maxOutputTokens: 8192,
        },
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GEMINI_HTTP_${response.status}: ${errText}`);
    }
    return response.json();
  }
  
  const SYSTEM_PROMPT = `Kamu adalah asisten penyusun alat bantu mengajar untuk GURU di "Bimbel Gemilang" Indonesia.
  
  ATURAN PALING PENTING — DIGROUNDING KE SUMBER:
  Kamu akan diberi TEKS ASLI dari buku paket yang guru upload sendiri (di antara tag <SUMBER_BUKU>). Tugasmu MENYUSUN ULANG isi teks itu jadi tiga bagian yang siap pakai guru -- BUKAN mengarang fakta baru dari pengetahuan umummu. Kalau ada rumus, definisi, atau contoh soal, WAJIB diambil/diadaptasi dari teks sumber itu, bukan dari ingatanmu sendiri. Kalau teks sumber tidak cukup untuk suatu bagian, katakan itu terus terang di bagian itu (jangan mengarang supaya kelihatan lengkap).
  
  Kamu menulis untuk GURU BUKAN SISWA -- boleh lebih teknis, boleh membahas "kenapa", dan asumsikan pembacanya sudah punya latar belakang mengajar tapi mungkin belum baca bagian buku ini.
  
  Balas HANYA dalam format JSON tunggal (bukan JSONL, bukan array) persis seperti ini, tanpa teks pembuka/penutup/code fence:
  {
    "capaian_pembelajaran": "HTML: pernyataan capaian pembelajaran yang jelas dan terukur untuk topik ini, sesuai gaya Kurikulum Merdeka (fokus pada KOMPETENSI yang didapat siswa, bukan sekadar daftar materi). Boleh pakai <p><ul><li><b>.",
    "rpp_ringkas": "HTML: RPP ringkas 1 pertemuan -- WAJIB memuat: <b>Tujuan Pembelajaran</b> (poin-poin), <b>Langkah Pembelajaran</b> (Pendahuluan/Kegiatan Inti/Penutup, tiap bagian dengan estimasi menit), dan <b>Asesmen</b> (cara mengecek pemahaman siswa di akhir). Format pakai <p><b><ul><li>.",
    "materi_inti": "HTML: materi inti buat guru pelajari/sampaikan -- rumus (LaTeX pakai tanda dolar $...$ atau $$...$$), definisi kunci, MINIMAL 2 contoh soal dengan langkah pengerjaan bernomor, DAN kalau relevan sertakan 'Cara Gemilang' (jembatan keledai/trik cepat) buat bagian yang perlu dihafal -- tapi JANGAN dipaksakan kalau topiknya tidak butuh. Boleh pakai <p><b><i><ul><li><pre>."
  }
  
  ATURAN TAMBAHAN:
  - Semua angka dalam contoh soal WAJIB dihitung ulang dan dipastikan benar.
  - Kalau di sumber buku ada metode/trik yang disebut namanya tapi caranya tidak digambarkan lengkap, kamu WAJIB melengkapi cara kerjanya secara jelas pakai <pre> supaya guru langsung paham cara mengajarkannya.
  - Tulis angka dengan format Indonesia (1.250.000, bukan 1,250,000).
  - JANGAN gunakan tag <span class="gem-pop"> di sini (itu fitur khusus untuk materi siswa, gak relevan buat guru).
  - Kalau ada arahan khusus dari guru, prioritaskan itu selama masih konsisten dengan teks sumber.`;
  
  export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { topic, mapel, kelas, arahan, sourceText, sourceTitle, pageRange } = req.body;
  
    if (!topic) return res.status(400).json({ error: 'Topik wajib diisi' });
    if (!sourceText || !sourceText.trim()) {
      return res.status(400).json({ error: 'Teks sumber dari buku referensi kosong. Cek lagi rentang halamannya.' });
    }
  
    // 🔥 Batasi panjang teks sumber yang dikirim ke AI -- kalau guru pilih
    // rentang halaman yang KELEWAT luas, potong biar gak melebihi kapasitas
    // model & biar AI tetap fokus (bukan nolak permintaan sepenuhnya).
    const MAX_SOURCE_CHARS = 60000;
    const trimmedSource = sourceText.length > MAX_SOURCE_CHARS
      ? sourceText.slice(0, MAX_SOURCE_CHARS) + '\n\n[...teks dipotong karena terlalu panjang...]'
      : sourceText;
  
    const arahanText = (arahan && arahan.trim())
      ? `\n\nArahan khusus dari guru (WAJIB dipatuhi selama konsisten dengan teks sumber):\n${arahan.trim()}`
      : '';
  
    const userPrompt = `Mata pelajaran: ${mapel || 'Umum'}
  Kelas/jenjang: ${kelas || '-'}
  Topik yang diminta: ${topic}
  Buku sumber: ${sourceTitle || '-'} (halaman ${pageRange || '-'})${arahanText}
  
  <SUMBER_BUKU>
  ${trimmedSource}
  </SUMBER_BUKU>
  
  Susun Capaian Pembelajaran, RPP Ringkas, dan Materi Inti untuk topik "${topic}" berdasarkan teks sumber di atas, sesuai format JSON yang ditentukan.`;
  
    let geminiData;
    let lastErr;
  
    for (const modelName of GEMINI_MODELS) {
      try {
        geminiData = await callGemini(SYSTEM_PROMPT, userPrompt, modelName);
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        console.error(`generateGuruLearningAid gagal pakai model ${modelName}:`, e.message);
      }
    }
  
    if (lastErr) {
      const isQuota = lastErr.message.includes('429');
      return res.status(502).json({
        error: isQuota
          ? 'Kuota gratis AI hari ini sudah habis di semua model. Silakan coba lagi besok.'
          : 'Gagal menghubungi AI. Coba lagi beberapa saat lagi.',
        debug: lastErr.message,
      });
    }
  
    try {
      const candidate = geminiData?.candidates?.[0];
      let rawText = candidate?.content?.parts?.[0]?.text || '';
  
      if (!rawText) {
        return res.status(502).json({ error: 'AI tidak mengembalikan jawaban, coba generate ulang.' });
      }
  
      // 🔥 Bersihkan kemungkinan code fence yang kadang tetap disisipkan
      // model walau sudah dilarang di prompt.
      rawText = rawText.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {
        // 🔥 Coba ambil objek JSON pertama yang valid dari teks (jaga-jaga
        // kalau ada teks pembuka/penutup yang lolos dari pembersihan di atas).
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch (e2) { /* biarkan parsed undefined */ }
        }
      }
  
      if (!parsed || !parsed.materi_inti) {
        console.error('Gagal parse JSON dari AI. Cuplikan:', rawText.slice(0, 300));
        return res.status(502).json({ error: 'AI mengembalikan format tidak terbaca, coba generate ulang.' });
      }
  
      const sanitize = (html = '') =>
        String(html).replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+="[^"]*"/gi, '');
  
      return res.status(200).json({
        success: true,
        capaian_pembelajaran: sanitize(parsed.capaian_pembelajaran || '<p>Belum tersedia.</p>'),
        rpp_ringkas: sanitize(parsed.rpp_ringkas || '<p>Belum tersedia.</p>'),
        materi_inti: sanitize(parsed.materi_inti || '<p>Belum tersedia.</p>'),
        sourceTitle: sourceTitle || '-',
        pageRange: pageRange || '-',
      });
    } catch (error) {
      console.error('generateGuruLearningAid parse error:', error);
      return res.status(500).json({ error: 'Terjadi kesalahan server: ' + error.message });
    }
  }