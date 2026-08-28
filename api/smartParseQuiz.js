// api/smartParseQuiz.js
// ============================================================
// SMART PARSE QUIZ -- ROMBAK TOTAL (lihat riwayat di bawah)
// ============================================================
// 🔥 RIWAYAT PENTING (kenapa file ini ditulis ulang dari nol):
//
// Versi SEBELUM ini (yang diupload user) punya 2 MASALAH KRITIS yang
// kemungkinan besar bikin fitur ini SUDAH GAGAL TERUS diam-diam:
//
//   1. Model Groq yang dipanggil ("mixtral-8x7b-32768") SUDAH
//      DI-DEPRECATE oleh Groq sejak Maret 2025 -- lebih dari setahun
//      sebelum tulisan ini. Setiap panggilan ke model ini pasti
//      gagal dengan error 404/model-not-found.
//   2. Ada fallback diam-diam ke kunci demo publik OCR.space
//      ('helloworld') kalau OCR_SPACE_API_KEY belum di-set -- kunci
//      itu dipakai bergantian oleh SELURUH PENGGUNA OCR.space DI
//      DUNIA, jadi nyaris pasti gagal/limit kalau beneran dipakai,
//      TANPA pesan error yang jelas kenapa.
//
// KEPUTUSAN ARSITEKTUR (kenapa Gemini, bukan Groq):
// Groq membatasi kuota GRATIS per ORGANISASI/AKUN (bukan per model)
// -- artinya kalau file ini JUGA dipindah ke Groq, dia akan REBUTAN
// kuota yang sama dengan otomatisasi baca-ulang di Bank Soal
// (api/transcribeMathQuestion.js, yang sengaja dipindah ke Groq
// SUPAYA TERPISAH dari fitur guru ini). Menaruh file ini di Groq
// JUGA akan MEMBATALKAN pemisahan yang baru dibangun. Karena itu,
// file ini pakai GEMINI -- kuota benar-benar terpisah dari kedua
// fitur Bank Soal (Groq) maupun generate kuis topik (NVIDIA).
//
// SEKALIAN: OCR.space (langkah OCR terpisah sebelum diproses AI)
// DIHAPUS TOTAL -- Gemini bisa membaca gambar LANGSUNG (native
// vision), jadi satu titik kegagalan (dan satu dependency eksternal
// lagi) hilang sama sekali. Alur sekarang: gambar -> Gemini -> JSON.
// Sebelumnya: gambar -> OCR.space -> teks -> Groq -> JSON (2 API
// eksternal berantai, 2 kemungkinan gagal, bukan 1).
//
// SEMUA MODE YANG ADA DI VERSI LAMA DIPERTAHANKAN (nama field request
// & response SAMA PERSIS) -- karena frontend (SmartImportPanel.jsx)
// belum sempat dilihat isinya, jadi kontrak lama TIDAK diubah sama
// sekali supaya frontend tidak perlu disentuh:
//   - mode: "transcribePage"   -> baca 1 halaman penuh, deteksi semua
//                                  butir soal + koordinatnya
//   - mode: "transcribeRegion" -> baca 1 kolom/region halaman (sama
//                                  logikanya dengan transcribePage)
//   - questionCropImage hadir  -> transkripsi 1 soal yang sudah di-crop
//   - questionImage hadir      -> baca 1 soal LENGKAP pilihan jawaban,
//                                  tentukan jawaban benar + pembahasan
//   - default (field "text")   -> potong teks panjang jadi banyak
//                                  soal terstruktur (dari paste Word)
// ============================================================

export const config = { maxDuration: 60 };

// 🔥 Coba model utama dulu, kalau gagal (mis. di-deprecate lagi di
// masa depan) baru coba yang kedua -- SATU tempat ganti kalau suatu
// saat perlu, tidak perlu ubah logika di bawah sama sekali.
const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'];
const GEMINI_TIMEOUT_MS = 50_000;

// ============================================================
// PEMANGGIL GEMINI -- DIPAKAI SEMUA MODE (teks maupun gambar)
// ============================================================
// `imageDataUrl` opsional -- kalau diisi, dikirim sebagai bagian
// vision (inline_data base64) bareng promptnya. Kalau tidak, Gemini
// dipanggil mode teks murni (dipakai untuk mode default/potong teks).
async function callGemini(systemPrompt, userText, imageDataUrl) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum di-setting di Vercel.');
  }

  const parts = [];
  if (imageDataUrl) {
    const match = imageDataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Format gambar tidak valid (bukan data URL base64 gambar).');
    }
    parts.push({ inline_data: { mime_type: match[1], data: match[2] } });
  }
  if (userText) {
    parts.push({ text: userText.slice(0, 12000) });
  }
  if (parts.length === 0) {
    throw new Error('Tidak ada konten (teks maupun gambar) untuk dikirim ke Gemini.');
  }

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 4096,
              responseMimeType: 'application/json',
            },
          }),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        // 🔥 Model di-deprecate/tidak ditemukan -> coba model
        // berikutnya di daftar, JANGAN langsung menyerah.
        if (response.status === 404 || /not.?found|deprecat/i.test(errText)) {
          lastError = new Error(`Model "${model}" tidak tersedia (kemungkinan di-deprecate). ${errText.slice(0, 200)}`);
          continue;
        }
        if (response.status === 401 || response.status === 403) {
          throw new Error(`GEMINI_API_KEY ditolak (${response.status}). Cek ulang key di Vercel.`);
        }
        if (response.status === 429) {
          lastError = new Error(`Kuota model "${model}" habis untuk saat ini (429).`);
          continue;
        }
        lastError = new Error(`Gemini API error (${response.status}): ${errText.slice(0, 300)}`);
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleaned = rawText.replace(/```json|```/g, '').trim();

      try {
        return JSON.parse(cleaned);
      } catch {
        const match = cleaned.match(/[\{\[][\s\S]*[\}\]]/);
        if (match) {
          try {
            return JSON.parse(match[0]);
          } catch {
            lastError = new Error('Respons Gemini bukan JSON valid setelah dibersihkan.');
            continue;
          }
        }
        lastError = new Error('Respons Gemini bukan JSON valid.');
        continue;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        lastError = new Error(`Timeout ${GEMINI_TIMEOUT_MS / 1000}s memanggil model "${model}".`);
        continue;
      }
      lastError = error;
      continue;
    }
  }

  // Semua model di daftar sudah dicoba dan gagal semua.
  throw lastError || new Error('Gemini gagal diproses tanpa detail error.');
}

// ============================================================
// MODE: transcribeQuestion -- transkripsi SATU soal yang di-crop
// ============================================================
async function transcribeQuestionImage(imageDataUrl) {
  const systemPrompt = `Kamu adalah pembaca soal ujian untuk Bank Soal Bimbel Gemilang.

TUGAS:
Lihat gambar potongan SATU soal, lalu ubah jadi JSON terstruktur.

WAJIB SETIA APA ADANYA:
- Salin teks persis seperti di gambar, jangan mengubah angka/konteks.
- Kalau ada bagian yang tidak jelas terbaca, tulis tebakan terbaik dan tandai readingConfidence:"low".

RUMUS MATEMATIKA:
Tulis sebagai teks linear biasa (BUKAN LaTeX), contoh pecahan ditulis "(x-1+y-1)/(x-1-y-1)", akar ditulis "sqrt(x+1)".

KLASIFIKASI TIPE SOAL (tipeSoal):
- "pilihan_ganda": soal standar dengan pilihan A-E.
- "pernyataan_kompleks": pernyataan bernomor (1)(2)(3)(4), pilih kombinasi mana yang benar.
- "hubungan_kuantitas": membandingkan Kuantitas P dan Kuantitas Q.
- "isian_singkat": tanpa pilihan ganda, jawaban diketik bebas.

DIAGRAM/GAMBAR:
Kalau ada diagram yang jadi BAGIAN soal (bukan dekorasi), set hasFigure:true dan figureBBox (koordinat 0-1 relatif terhadap gambar: x, y, width, height).

WAJIB balas HANYA JSON, tanpa teks lain, format persis:
{"question":"...", "options":["...","...","...","...","..."], "tipeSoal":"pilihan_ganda", "kuantitasP":"", "kuantitasQ":"", "hasFigure":false, "figureBBox":null, "readingConfidence":"high"}`;

  const result = await callGemini(systemPrompt, 'Baca soal pada gambar ini.', imageDataUrl);

  return {
    question: typeof result.question === 'string' ? result.question : '',
    options: Array.isArray(result.options) ? result.options.map((o) => String(o || '')) : [],
    tipeSoal: ['pilihan_ganda', 'pernyataan_kompleks', 'hubungan_kuantitas', 'isian_singkat'].includes(result.tipeSoal)
      ? result.tipeSoal
      : 'pilihan_ganda',
    kuantitasP: typeof result.kuantitasP === 'string' ? result.kuantitasP : '',
    kuantitasQ: typeof result.kuantitasQ === 'string' ? result.kuantitasQ : '',
    hasFigure: Boolean(result.hasFigure),
    figureBBox: result.figureBBox || null,
    readingConfidence: result.readingConfidence === 'low' ? 'low' : 'high',
  };
}

async function handleTranscribeQuestionMode(req, res) {
  const { questionCropImage } = req.body || {};

  if (!questionCropImage || typeof questionCropImage !== 'string') {
    return res.status(400).json({ success: false, error: 'questionCropImage kosong atau tidak valid.' });
  }

  try {
    const result = await transcribeQuestionImage(questionCropImage);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('smartParseQuiz (transcribeQuestion) error:', err);
    return res.status(502).json({
      success: false,
      error: err.message || 'Gagal mentranskripsi soal ini.',
    });
  }
}

// ============================================================
// MODE: transcribePage / transcribeRegion -- deteksi semua butir
// soal dalam 1 halaman atau 1 kolom/region halaman
// ============================================================
async function transcribePageOrRegion(pageImage) {
  const systemPrompt = `Kamu adalah pendeteksi soal ujian untuk Bank Soal Bimbel Gemilang.

TUGAS:
Lihat gambar SATU HALAMAN (atau satu kolom halaman) penuh, lalu DETEKSI semua butir soal yang ada.

WAJIB:
- Kembalikan info untuk SETIAP butir soal yang terdeteksi.
- printedNumber = nomor yang tercetak di dokumen untuk soal itu.
- bbox = kotak koordinat RELATIF (0..1 terhadap lebar/tinggi gambar) yang membungkus SATU soal itu penuh (dari nomornya sampai akhir pilihan jawabannya, SEBELUM nomor soal berikutnya mulai).
- Kalau halaman ini adalah bagian PEMBAHASAN/kunci jawaban (bukan soal baru), set pageType:"pembahasan" dan questions boleh kosong.
- Kalau halaman ini soal biasa, set pageType:"questions".

WAJIB balas HANYA JSON, format persis:
{"pageType":"questions", "questions":[{"printedNumber":1,"bbox":{"x":0.05,"y":0.05,"width":0.9,"height":0.15}}]}`;

  const result = await callGemini(systemPrompt, 'Deteksi semua soal pada gambar halaman ini.', pageImage);

  return {
    pageType: result.pageType === 'pembahasan' ? 'pembahasan' : 'questions',
    questions: Array.isArray(result.questions)
      ? result.questions
          .filter((q) => q && typeof q === 'object')
          .map((q) => ({
            printedNumber: Number.isFinite(q.printedNumber) ? q.printedNumber : null,
            bbox: q.bbox && typeof q.bbox === 'object' ? q.bbox : null,
          }))
      : [],
  };
}

async function handleTranscribePageMode(req, res) {
  const { pageImage } = req.body || {};

  if (!pageImage || typeof pageImage !== 'string') {
    return res.status(400).json({ success: false, error: 'pageImage kosong atau tidak valid.' });
  }

  try {
    const result = await transcribePageOrRegion(pageImage);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('smartParseQuiz (transcribePage) error:', err);
    return res.status(502).json({
      success: false,
      error: err.message || 'Gagal membaca halaman ini.',
    });
  }
}

async function handleTranscribeRegionMode(req, res) {
  const { pageImage } = req.body || {};

  if (!pageImage || typeof pageImage !== 'string') {
    return res.status(400).json({ success: false, error: 'pageImage kosong atau tidak valid.' });
  }

  try {
    const result = await transcribePageOrRegion(pageImage);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('smartParseQuiz (transcribeRegion) error:', err);
    return res.status(502).json({
      success: false,
      error: err.message || 'Gagal membaca kolom ini.',
    });
  }
}

// ============================================================
// MODE: answerQuestion -- baca 1 soal LENGKAP, tentukan jawaban
// ============================================================
async function answerQuestionFromImage(imageDataUrl) {
  const systemPrompt = `Kamu adalah pemeriksa jawaban soal ujian untuk Bank Soal Bimbel Gemilang.

TUGAS:
Lihat gambar SATU SOAL (termasuk semua pilihan jawaban), lalu KERJAKAN soal itu, tentukan JAWABAN YANG BENAR, dan tulis pembahasan singkat langkah penyelesaiannya.

ATURAN:
- optionCount = jumlah pilihan jawaban yang ada di soal ini.
- correct = INDEKS (mulai dari 0) pilihan jawaban yang benar.
- explanation = pembahasan singkat kenapa jawaban itu benar (2-4 kalimat).
- Kalau ragu-ragu membaca sebagian soal, tetap jawab semampunya, tandai readingConfidence:"low".

WAJIB balas HANYA JSON, format persis:
{"optionCount":4, "correct":0, "explanation":"...", "readingConfidence":"high"}`;

  const result = await callGemini(systemPrompt, 'Kerjakan soal pada gambar ini.', imageDataUrl);

  return {
    optionCount: Number.isInteger(result.optionCount) ? result.optionCount : 4,
    correct: Number.isInteger(result.correct) ? result.correct : 0,
    explanation: typeof result.explanation === 'string' ? result.explanation : '',
    readingConfidence: result.readingConfidence === 'low' ? 'low' : 'high',
  };
}

async function handleAnswerQuestionMode(req, res) {
  const { questionImage } = req.body || {};

  if (!questionImage || typeof questionImage !== 'string') {
    return res.status(400).json({ success: false, error: 'questionImage kosong atau tidak valid.' });
  }

  try {
    const result = await answerQuestionFromImage(questionImage);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('smartParseQuiz (answerQuestion) error:', err);
    return res.status(502).json({
      success: false,
      error: err.message || 'Gagal menjawab soal ini.',
    });
  }
}

// ============================================================
// MODE DEFAULT: potong TEKS panjang (paste dari Word) jadi banyak
// soal terstruktur sekaligus
// ============================================================
function splitIntoChunks(text) {
  const lines = text.split('\n');
  const blocks = [];
  let current = [];

  for (const line of lines) {
    const isNewQuestion = /^\d{1,3}[.)]\s+/.test(line.trim());
    if (isNewQuestion && current.length > 0) {
      blocks.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) blocks.push(current);

  const chunks = [];
  for (let i = 0; i < blocks.length; i += 5) {
    const group = blocks.slice(i, i + 5);
    chunks.push(group.map((b) => b.join('\n')).join('\n'));
  }
  return chunks.filter((c) => c.trim().length > 10);
}

async function parseChunk(chunk) {
  const systemPrompt = `Kamu adalah pengubah teks soal menjadi JSON terstruktur untuk Bimbel Gemilang.

TUGAS:
Ubah teks soal berikut (mungkin berisi beberapa soal sekaligus) menjadi array JSON.

ATURAN:
- Satu soal = satu elemen array.
- type: "multiple" (pilihan ganda), "truefalse" (benar/salah), atau "shortanswer" (isian singkat) -- sesuai bentuk aslinya di teks.
- Salin teks soal & pilihan APA ADANYA, jangan mengarang isi baru.

WAJIB balas HANYA JSON array, format persis:
[{"question":"...", "options":["A. ...","B. ..."], "type":"multiple"}]`;

  const result = await callGemini(systemPrompt, chunk);
  return Array.isArray(result) ? result : [];
}

async function handleDefaultTextMode(req, res) {
  const { text } = req.body || {};
  if (!text || text.trim().length < 5) {
    return res.status(400).json({ success: false, error: 'Teks soal kosong.' });
  }

  try {
    const chunks = splitIntoChunks(text);
    if (chunks.length === 0) {
      return res.status(200).json({ success: true, questions: [] });
    }

    let allRawQuestions = [];
    for (const chunk of chunks) {
      // eslint-disable-next-line no-await-in-loop
      const qs = await parseChunk(chunk);
      allRawQuestions.push(...qs);
    }

    const questions = allRawQuestions
      .map((q, idx) => ({
        id: Date.now() + idx,
        type: ['multiple', 'truefalse', 'shortanswer'].includes(q.type) ? q.type : 'multiple',
        q: q.question || '',
        qImage: q.questionImage || '',
        options: q.options && q.options.length ? q.options : ['', '', '', ''],
        optionImages: ['', '', '', ''],
        correct: typeof q.correct === 'number' ? q.correct : 0,
        correctAnswers: q.correctAnswers || [],
        explanation: q.explanation || '',
        statements: q.statements || [{ text: '', isTrue: true }],
        readingText: q.readingText || '',
        subQuestions: q.subQuestions || [],
        shortAnswer: q.shortAnswer || '',
        cause: q.cause || '',
        effect: q.effect || '',
        isCauseTrue: q.isCauseTrue !== undefined ? q.isCauseTrue : true,
        isEffectTrue: q.isEffectTrue !== undefined ? q.isEffectTrue : true,
        matchingPairs: q.matchingPairs || [{ left: '', right: '' }, { left: '', right: '' }],
        needsManualAnswer: q.needsManualAnswer !== false,
      }))
      .filter((q) => q.q.trim().length > 3);

    if (questions.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'AI tidak berhasil menghasilkan soal yang valid. Coba upload ulang.',
      });
    }

    return res.status(200).json({ success: true, questions });
  } catch (err) {
    console.error('smartParseQuiz (default text) error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ============================================================
// ROUTER UTAMA
// ============================================================
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      success: false,
      error: 'GEMINI_API_KEY belum di-setting di Vercel. Daftar gratis di aistudio.google.com, tempel API key-nya sebagai environment variable GEMINI_API_KEY.',
    });
  }

  const body = req.body || {};

  if (body.mode === 'transcribePage') {
    return handleTranscribePageMode(req, res);
  }

  if (body.mode === 'transcribeRegion') {
    return handleTranscribeRegionMode(req, res);
  }

  if (body.questionCropImage) {
    return handleTranscribeQuestionMode(req, res);
  }

  if (body.questionImage) {
    return handleAnswerQuestionMode(req, res);
  }

  return handleDefaultTextMode(req, res);
}