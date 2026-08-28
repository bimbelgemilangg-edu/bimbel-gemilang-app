// api/transcribeMathQuestion.js
// ============================================================
// TRANSKRIPSI SOAL (KHUSUS BANK SOAL) -- PAKAI GROQ
// ============================================================
// 🔥 BARU: endpoint ini SENGAJA DIPISAH TOTAL dari:
//   - /api/smartParseQuiz.js (pakai GEMINI_API_KEY) -- dipakai fitur
//     "SmartImportPanel" guru buat bikin kuis manual dari Word.
//   - /api/generateQuizFromTopic.js (pakai NVIDIA_API_KEY) -- dipakai
//     Astro Gemilang buat generate kuis otomatis dari topik.
//
// ALASAN DIPISAH: kalau endpoint ini numpuk ke salah satu provider di
// atas, otomatisasi baca-ulang di Bank Soal bakal berebut kuota gratis
// yang sama dengan fitur guru/kuis yang JAUH lebih sering dipakai --
// begitu kuota abis, fitur guru ikut kena imbas. Dengan provider
// TERPISAH (Groq), kuota Bank Soal gak pernah nyenggol kuota fitur lain.
//
// PROVIDER: Groq (GROQ_API_KEY -- kalau project ini sudah pakai Groq
// untuk fitur lain seperti generateStudentNarrative.js, key yang sama
// bisa dipakai ulang di sini, TAPI modelnya beda, jadi kuota per-model
// terhitung terpisah).
//
// MODEL: qwen/qwen3.6-27b -- model vision Groq yang aktif per Agustus
// 2026. ⚠️ CATATAN JUJUR: lineup model vision Groq SERING BERUBAH --
// sudah 2 model vision di-deprecate sepanjang 2026 (Llama 4 Maverick
// Feb 2026, Llama 4 Scout Juni 2026). Model ini berstatus "preview" di
// Groq. Kalau suatu saat endpoint ini mulai gagal terus, KEMUNGKINAN
// BESAR modelnya sudah di-deprecate lagi -- cek console.groq.com/docs
// buat model vision pengganti, lalu ganti SATU baris GROQ_VISION_MODEL
// di bawah, tidak perlu ubah apa pun yang lain.
//
// KONTRAK OUTPUT: SAMA PERSIS dengan mode "questionCropImage" di
// smartParseQuiz.js -- { question, options, tipeSoal, kuantitasP,
// kuantitasQ, hasFigure, figureBBox, readingConfidence } -- supaya
// BankSoalImport.jsx cuma perlu ganti URL endpoint yang dipanggil,
// tanpa mengubah logika pemrosesan hasilnya sama sekali.
// ============================================================

const GROQ_VISION_MODEL = 'qwen/qwen3.6-27b';
const GROQ_TIMEOUT_MS = 45000;

const SYSTEM_PROMPT = `Anda adalah asisten transkripsi soal ujian. Anda akan diberi gambar potongan (crop) SATU soal pilihan ganda dari dokumen ujian Bahasa Indonesia. Tugas Anda HANYA membaca ulang isi gambar itu SEPERSIS MUNGKIN -- BUKAN menjawab soalnya, BUKAN mengubah/menyederhanakan notasi matematika.

ATURAN MUTLAK:
1. Salin teks soal APA ADANYA, termasuk semua notasi matematika (pecahan, akar, pangkat, matriks) sebagai TEKS LINIER biasa. Contoh pecahan (x-1+y-1)/(x-1-y-1) ditulis persis begitu, BUKAN dipotong/disingkat.
2. Salin SEMUA pilihan jawaban (A-E atau sebanyak yang ada) LENGKAP, jangan ada yang kosong kalau di gambar ada isinya.
3. Kalau soal ini termasuk tipe "hubungan_kuantitas" (soal membandingkan Kuantitas P vs Kuantitas Q), isi kuantitasP dan kuantitasQ. Kalau bukan tipe itu, kosongkan keduanya ("").
4. Kalau ada diagram/gambar/grafik yang jadi BAGIAN dari soal (bukan cuma dekorasi), set hasFigure=true dan berikan figureBBox (koordinat 0-1 relatif terhadap gambar yang diberikan: x, y, width, height dari kotak yang membungkus diagram itu).
5. Kalau ada bagian yang Anda BENAR-BENAR tidak yakin terbaca dengan jelas (buram/terpotong), tetap isi dengan tebakan terbaik, TAPI set readingConfidence="low". Kalau semua terbaca jelas, set readingConfidence="high".
6. tipeSoal HARUS salah satu dari: "pilihan_ganda", "pernyataan_kompleks", "hubungan_kuantitas", "isian_singkat".

WAJIB balas HANYA dengan JSON valid, TANPA teks lain, TANPA markdown code fence, persis format ini:
{"question": "...", "options": ["...", "...", "...", "...", "..."], "tipeSoal": "...", "kuantitasP": "", "kuantitasQ": "", "hasFigure": false, "figureBBox": null, "readingConfidence": "high"}`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Gunakan POST.' });
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return res.status(500).json({
      error: 'GROQ_API_KEY belum di-setting di Vercel. Daftar gratis di console.groq.com, tempel API key-nya sebagai environment variable GROQ_API_KEY.',
    });
  }

  const { questionCropImage } = req.body || {};
  if (!questionCropImage || typeof questionCropImage !== 'string') {
    return res.status(400).json({ error: 'Field "questionCropImage" (data URL base64) wajib diisi.' });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Baca ulang soal pada gambar ini, balas HANYA JSON sesuai format yang ditentukan.' },
              { type: 'image_url', image_url: { url: questionCropImage } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 1500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      // 🔥 Pesan error dibuat SPESIFIK per kasus umum, biar kalau
      // model ini di-deprecate lagi (lihat catatan panjang di atas),
      // admin/dev langsung tau HARUS ngapain, bukan cuma "gagal".
      if (response.status === 401) {
        return res.status(500).json({
          error: 'GROQ_API_KEY tidak valid/ditolak (401). Cek ulang API key di console.groq.com.',
        });
      }
      if (response.status === 404 || (errText && /model.*not.*found|decommission|deprecat/i.test(errText))) {
        return res.status(500).json({
          error: `Model "${GROQ_VISION_MODEL}" kemungkinan sudah di-deprecate Groq. Cek console.groq.com/docs/models untuk model vision pengganti, lalu ganti GROQ_VISION_MODEL di api/transcribeMathQuestion.js.`,
        });
      }
      if (response.status === 429) {
        return res.status(500).json({
          error: 'Kuota gratis Groq untuk model ini habis untuk saat ini (rate limit). Coba lagi beberapa saat lagi.',
        });
      }
      return res.status(500).json({
        error: `Groq API error (${response.status}): ${errText.slice(0, 300) || 'tidak ada detail.'}`,
      });
    }

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content || '';

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Fallback: model kadang membungkus JSON dengan teks lain
      // walau sudah diminta jangan -- coba ekstrak blok {...} pertama.
      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) {
        return res.status(500).json({
          error: 'AI tidak mengembalikan JSON yang bisa dibaca. Coba lagi, atau kalau berulang, kemungkinan model perlu diganti.',
        });
      }
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        return res.status(500).json({
          error: 'AI mengembalikan format yang tidak bisa diproses sama sekali.',
        });
      }
    }

    // Normalisasi -- pastikan field & tipe data sesuai kontrak yang
    // diharapkan BankSoalImport.jsx, apa pun yang sebenarnya
    // dikembalikan model (jaga-jaga model sedikit meleset formatnya).
    // 🔥 PENTING: field `success: true` WAJIB ada -- BankSoalImport.jsx
    // mengecek `!response.ok || !data.success` sebelum menerima hasil.
    const validTipeSoal = ['pilihan_ganda', 'pernyataan_kompleks', 'hubungan_kuantitas', 'isian_singkat'];
    return res.status(200).json({
      success: true,
      question: String(parsed.question || ''),
      options: Array.isArray(parsed.options) ? parsed.options.map((o) => String(o || '')) : [],
      tipeSoal: validTipeSoal.includes(parsed.tipeSoal) ? parsed.tipeSoal : 'pilihan_ganda',
      kuantitasP: String(parsed.kuantitasP || ''),
      kuantitasQ: String(parsed.kuantitasQ || ''),
      hasFigure: Boolean(parsed.hasFigure),
      figureBBox: parsed.figureBBox || null,
      readingConfidence: parsed.readingConfidence === 'low' ? 'low' : 'high',
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return res.status(500).json({ error: `Groq tidak merespons dalam ${GROQ_TIMEOUT_MS / 1000} detik (timeout).` });
    }
    return res.status(500).json({ error: `Gagal menghubungi Groq: ${error.message}` });
  }
};