// api/smartParseQuiz.js
// ============================================================
// 🔥 UPGRADE: OCR.space + Groq — FIXED
// ============================================================

export const config = { maxDuration: 60 };

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'mixtral-8x7b-32768';
const OCR_API_URL = 'https://api.ocr.space/parse/image';

const GROQ_TIMEOUT_MS = 50_000;

// ============================================================
// 🔥 PANGGIL OCR.SPACE — FIXED
// ============================================================
async function callOCR(imageDataUrl) {
  // 🔥 FIX: Pastikan imageDataUrl valid
  if (!imageDataUrl || typeof imageDataUrl !== 'string') {
    throw new Error('Gambar tidak valid: data kosong.');
  }

  // 🔥 FIX: Hapus prefix "data:image/jpeg;base64," atau sejenisnya
  let base64Image = imageDataUrl;
  if (imageDataUrl.includes('base64,')) {
    base64Image = imageDataUrl.split('base64,')[1];
  }

  // 🔥 FIX: Cek apakah base64 valid
  if (!base64Image || base64Image.length < 100) {
    throw new Error('Gambar tidak valid: ukuran terlalu kecil atau format salah.');
  }

  // 🔥 FIX: Gunakan FormData (bukan URLSearchParams)
  const formData = new FormData();
  formData.append('apikey', process.env.OCR_SPACE_API_KEY || 'helloworld');
  formData.append('base64Image', base64Image);
  formData.append('language', 'ind');
  formData.append('isOverlayRequired', 'false');
  formData.append('OCREngine', '2');
  formData.append('scale', 'true');

  const response = await fetch(OCR_API_URL, {
    method: 'POST',
    headers: {
      // 🔥 PENTING: jangan set Content-Type, biarkan FormData yang set
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OCR_HTTP_${response.status}: ${errText}`);
  }

  const data = await response.json();

  if (!data.IsErroredOnProcessing) {
    const text = data.ParsedResults?.[0]?.ParsedText || '';
    if (!text || text.trim().length < 3) {
      throw new Error('OCR tidak menemukan teks yang cukup di gambar ini.');
    }
    return { text, confidence: data.OCRExitCode === 1 ? 'high' : 'low' };
  }

  throw new Error(data.ErrorMessage || 'OCR gagal memproses gambar.');
}

// ============================================================
// 🔥 PANGGIL GROQ
// ============================================================
async function callGroqParse(systemPrompt, userText) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText.slice(0, 8000) },
        ],
        temperature: 0.1,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GROQ_HTTP_${response.status}: ${errText}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '{}';
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    try {
      return JSON.parse(cleaned);
    } catch (e) {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error('Respons Groq bukan JSON valid.');
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`GROQ_TIMEOUT setelah ${GROQ_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================
// 🔥 MODE: TRANSKRIPSI SATU SOAL
// ============================================================
async function transcribeQuestionImage(imageDataUrl) {
  const ocrResult = await callOCR(imageDataUrl);

  const systemPrompt = `Kamu adalah pembaca soal ujian untuk Bank Soal Bimbel Gemilang.

TUGAS:
Terima teks hasil OCR dari satu soal, lalu ubah jadi JSON terstruktur yang bisa diedit.

WAJIB SETIA APA ADANYA:
- Jangan mengubah angka, jangan mengganti konteks.
- Kalau ada bagian yang tidak jelas, tulis apa adanya dan tandai readingConfidence:"low".

RUMUS MATEMATIKA:
Tulis dengan LaTeX dibungkus \\( \\), contoh: \\(x^2 + 3x - 4 = 0\\), \\frac{a}{b}, \\sqrt{x+1}.

KLASIFIKASI TIPE SOAL:
- "pilihan_ganda": soal standar dengan pilihan A-E.
- "pernyataan_kompleks": pernyataan bernomor (1)(2)(3)(4).
- "hubungan_kuantitas": membandingkan P dan Q.
- "isian_singkat": tanpa pilihan.

HANYA JSON:
{"question":"...", "options":["A. ...","B. ..."], "tipeSoal":"pilihan_ganda", "kuantitasP":"", "kuantitasQ":"", "hasFigure":false, "figureBBox":null, "readingConfidence":"high"}`;

  const result = await callGroqParse(systemPrompt, ocrResult.text);

  return {
    question: result.question || '',
    options: Array.isArray(result.options) ? result.options : [],
    tipeSoal: ['pilihan_ganda', 'pernyataan_kompleks', 'hubungan_kuantitas', 'isian_singkat'].includes(result.tipeSoal)
      ? result.tipeSoal
      : 'pilihan_ganda',
    kuantitasP: result.kuantitasP || '',
    kuantitasQ: result.kuantitasQ || '',
    hasFigure: Boolean(result.hasFigure),
    figureBBox: result.figureBBox || null,
    readingConfidence: result.readingConfidence === 'low' ? 'low' : 'high',
  };
}

async function handleTranscribeQuestionMode(req, res) {
  const { questionCropImage } = req.body;

  if (!questionCropImage || typeof questionCropImage !== 'string') {
    return res.status(400).json({ success: false, error: 'questionCropImage kosong atau tidak valid.' });
  }

  try {
    const result = await transcribeQuestionImage(questionCropImage);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('smartParseQuiz (transcribe) error:', err);
    return res.status(502).json({
      success: false,
      error: err.message || 'Gagal mentranskripsi soal ini.',
    });
  }
}

// ============================================================
// 🔥 MODE: TRANSKRIPSI SATU HALAMAN
// ============================================================
async function transcribePage(pageImage) {
  const ocrResult = await callOCR(pageImage);

  const systemPrompt = `Kamu adalah pembaca soal ujian untuk Bank Soal Bimbel Gemilang.

TUGAS:
Lihat teks hasil OCR dari SATU HALAMAN penuh, lalu DETEKSI semua butir soal yang ada di halaman itu.

WAJIB:
- Kembalikan informasi untuk SETIAP butir soal yang terdeteksi.
- Berikan printedNumber sesuai nomor yang tercetak.
- Kalau halaman ini adalah bagian PEMBAHASAN, tandai pageType:"pembahasan".
- Perkirakan bounding box (koordinat relatif 0..1) untuk setiap soal.

HANYA JSON:
{"pageType":"questions","questions":[{"printedNumber":1,"bbox":{"x":0.05,"y":0.05,"width":0.9,"height":0.15}}]}`;

  const result = await callGroqParse(systemPrompt, ocrResult.text);
  return result;
}

async function handleTranscribePageMode(req, res) {
  const { pageImage } = req.body;

  if (!pageImage || typeof pageImage !== 'string') {
    return res.status(400).json({ success: false, error: 'pageImage kosong atau tidak valid.' });
  }

  try {
    const result = await transcribePage(pageImage);
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
  const { pageImage } = req.body;

  if (!pageImage || typeof pageImage !== 'string') {
    return res.status(400).json({ success: false, error: 'pageImage kosong atau tidak valid.' });
  }

  try {
    const result = await transcribePage(pageImage);
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
// 🔥 MODE: JAWAB SOAL
// ============================================================
async function answerQuestionFromImage(imageDataUrl) {
  const ocrResult = await callOCR(imageDataUrl);

  const systemPrompt = `Kamu adalah pemeriksa jawaban soal ujian untuk Bank Soal Bimbel Gemilang.

TUGAS:
Lihat teks hasil OCR dari SATU SOAL (termasuk pilihan jawaban), lalu tentukan JAWABAN YANG BENAR dan tulis pembahasan singkat.

HANYA JSON:
{"optionCount":4, "correct":0, "explanation":"...", "readingConfidence":"high"}`;

  const result = await callGroqParse(systemPrompt, ocrResult.text);

  return {
    optionCount: Number.isInteger(result.optionCount) ? result.optionCount : 4,
    correct: Number.isInteger(result.correct) ? result.correct : 0,
    explanation: result.explanation || '',
    readingConfidence: result.readingConfidence === 'low' ? 'low' : 'high',
  };
}

async function handleAnswerQuestionMode(req, res) {
  const { questionImage } = req.body;

  if (!questionImage || typeof questionImage !== 'string') {
    return res.status(400).json({ success: false, error: 'questionImage kosong atau tidak valid.' });
  }

  try {
    const result = await answerQuestionFromImage(questionImage);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('smartParseQuiz (answer) error:', err);
    return res.status(502).json({
      success: false,
      error: err.message || 'Gagal menjawab soal ini.',
    });
  }
}

// ============================================================
// 🔥 MODE LAMA: PARSE TEKS MENTAH
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
  const systemPrompt = `Kamu adalah pengubah teks soal menjadi JSON terstruktur.

TUGAS:
Ubah teks soal berikut menjadi array JSON.

HANYA JSON:
[{"question":"...", "options":["A. ...","B. ..."], "type":"multiple"}]`;

  const result = await callGroqParse(systemPrompt, chunk);
  return Array.isArray(result) ? result : [];
}

// ============================================================
// 🔥 HANDLER UTAMA
// ============================================================
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ success: false, error: 'GROQ_API_KEY belum di-setting di Vercel' });
  }

  const { mode } = req.body;

  // 🔥 MODE: transcribePage
  if (mode === 'transcribePage') {
    return handleTranscribePageMode(req, res);
  }

  // 🔥 MODE: transcribeRegion
  if (mode === 'transcribeRegion') {
    return handleTranscribeRegionMode(req, res);
  }

  // 🔥 MODE: transcribeQuestion (satu soal)
  if (req.body && req.body.questionCropImage) {
    return handleTranscribeQuestionMode(req, res);
  }

  // 🔥 MODE: answerQuestion
  if (req.body && req.body.questionImage) {
    return handleAnswerQuestionMode(req, res);
  }

  // 🔥 MODE LAMA: teks mentah
  const { text } = req.body;
  if (!text || text.trim().length < 5) {
    return res.status(400).json({ success: false, error: 'Teks soal kosong' });
  }

  try {
    const chunks = splitIntoChunks(text);
    if (chunks.length === 0) {
      return res.status(200).json({ success: true, questions: [] });
    }

    let allRawQuestions = [];
    for (const chunk of chunks) {
      const qs = await parseChunk(chunk);
      allRawQuestions.push(...qs);
    }

    const questions = allRawQuestions.map((q, idx) => ({
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
    })).filter((q) => q.q.trim().length > 3);

    if (questions.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'AI tidak berhasil menghasilkan soal yang valid. Coba upload ulang.'
      });
    }

    return res.status(200).json({ success: true, questions });
  } catch (err) {
    console.error('smartParseQuiz error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}