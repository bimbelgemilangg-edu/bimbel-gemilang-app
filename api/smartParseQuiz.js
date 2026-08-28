// api/smartParseQuiz.js
// GROQ-FIRST version for Bimbel Gemilang Bank Soal.
// Modes:
// - text: parse pasted text
// - transcribePage: read one full PDF page into structured questions
// - transcribeRegion: fallback for one PDF column
// - questionCropImage: re-read one question
// - questionImage: answer one question + explanation

export const config = { maxDuration: 60 };

const GROQ_TIMEOUT_MS = 50_000;
const GROQ_MODELS = ['qwen/qwen3.6-27b', 'qwen/qwen3.8-27b'];
const QUESTION_TYPES = ['multiple', 'truefalse', 'multiselect', 'reading', 'shortanswer', 'causeeffect', 'matching'];
const BANK_TYPES = ['pilihan_ganda', 'pernyataan_kompleks', 'hubungan_kuantitas', 'isian_singkat'];

function cleanJson(text) {
  const raw = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  try { return JSON.parse(raw); } catch (_) {}
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(raw.slice(start, end + 1)); } catch (_) {}
  }
  throw new Error('Respons Groq bukan JSON yang valid.');
}

function responseText(data) {
  return data?.choices?.[0]?.message?.content || '';
}

async function groqChat({ model, system, content, maxCompletionTokens = 8192, temperature = 0.05 }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content },
        ],
        temperature,
        max_completion_tokens: maxCompletionTokens,
        response_format: { type: 'json_object' },
        stream: false,
      }),
      signal: controller.signal,
    });
    if (!r.ok) {
      const text = await r.text();
      const e = new Error(`GROQ_HTTP_${r.status}: ${text}`);
      e.status = r.status;
      throw e;
    }
    return r.json();
  } catch (e) {
    if (e?.name === 'AbortError') {
      const timeout = new Error(`GROQ_TIMEOUT setelah ${GROQ_TIMEOUT_MS}ms`);
      timeout.status = 504;
      throw timeout;
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function imagePart(dataUrl) {
  if (!/^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/i.test(dataUrl || '')) return null;
  return { type: 'image_url', image_url: { url: dataUrl } };
}

function bbox(b) {
  if (!b || typeof b !== 'object') return null;
  const x = Math.max(0, Math.min(1, Number(b.x) || 0));
  const y = Math.max(0, Math.min(1, Number(b.y) || 0));
  const width = Math.max(0, Math.min(1 - x, Number(b.width) || 0));
  const height = Math.max(0, Math.min(1 - y, Number(b.height) || 0));
  return width > 0.01 && height > 0.01 ? { x, y, width, height } : null;
}

function normalizeQuestion(q, index = 0) {
  return {
    printedNumber: Number.isFinite(Number(q?.printedNumber)) ? Number(q.printedNumber) : index + 1,
    bbox: bbox(q?.bbox),
    question: typeof q?.question === 'string' ? q.question.trim() : '',
    options: Array.isArray(q?.options) ? q.options.map((v) => String(v ?? '').trim()).filter(Boolean) : [],
    tipeSoal: BANK_TYPES.includes(q?.tipeSoal) ? q.tipeSoal : 'pilihan_ganda',
    kuantitasP: typeof q?.kuantitasP === 'string' ? q.kuantitasP.trim() : '',
    kuantitasQ: typeof q?.kuantitasQ === 'string' ? q.kuantitasQ.trim() : '',
    hasFigure: Boolean(q?.hasFigure),
    figureBBox: bbox(q?.figureBBox),
    optionImageBBoxes: Array.isArray(q?.optionImageBBoxes) ? q.optionImageBBoxes.map(bbox).filter(Boolean) : [],
    optionsAreImages: Boolean(q?.optionsAreImages),
    readingConfidence: q?.readingConfidence === 'low' ? 'low' : 'high',
  };
}

const PAGE_PROMPT = `Kamu adalah mesin OCR dan strukturisasi soal ujian untuk Bank Soal Bimbel Gemilang.

Baca SATU gambar halaman PDF. Halaman dapat satu kolom, dua kolom, atau scan. Temukan SEMUA butir soal yang benar-benar terlihat dan transkripsikan SETIA. Jangan meringkas. Jangan membuat soal baru.

Halaman pembahasan/kunci jawaban -> pageType "pembahasan" dan questions [].
Halaman cover/kisi-kisi/daftar isi/instruksi tanpa soal -> pageType "non_question" dan questions [].

Untuk setiap soal:
- printedNumber = nomor soal yang tercetak
- bbox = seluruh blok soal dari nomor sampai opsi terakhir, 0..1 relatif ke gambar
- question = salinan setia
- options = semua pilihan yang terlihat, urut A,B,C,D,E
- tipeSoal salah satu: pilihan_ganda, pernyataan_kompleks, hubungan_kuantitas, isian_singkat
- kuantitasP/Q diisi bila hubungan kuantitas
- hasFigure true bila ada diagram/grafik/foto/tabel yang menjadi bagian soal
- figureBBox menunjuk area visual tersebut
- optionsAreImages true bila pilihan jawaban berupa gambar; optionImageBBoxes berisi bbox opsi A-E
- readingConfidence low jika sebagian gambar tidak terbaca

Rumus matematika harus ditulis LaTeX inline: \\(x^2+1\\), \\frac{a}{b}, \\sqrt{x}.
Vektor/matriks vertikal gunakan \\begin{pmatrix} ... \\\\ ... \\end{pmatrix}.
Pertahankan angka, simbol, satuan, tanda baca, dan isi asli.

OUTPUT HANYA JSON:
{"pageType":"questions","questions":[{"printedNumber":1,"bbox":{"x":0,"y":0,"width":1,"height":1},"question":"...","options":["..."],"tipeSoal":"pilihan_ganda","kuantitasP":"","kuantitasQ":"","hasFigure":false,"figureBBox":null,"optionImageBBoxes":[],"optionsAreImages":false,"readingConfidence":"high"}]}`;

const REGION_PROMPT = PAGE_PROMPT
  .replace('SATU gambar halaman PDF', 'SATU gambar potongan kolom dari halaman PDF')
  .replace('Halaman pembahasan/kunci jawaban', 'Potongan kolom pembahasan/kunci jawaban')
  .replace('Halaman cover/kisi-kisi/daftar isi/instruksi tanpa soal', 'Potongan cover/kisi-kisi/daftar isi/instruksi tanpa soal');

async function transcribeRegion(imageDataUrl, region = false) {
  const image = imagePart(imageDataUrl);
  if (!image) throw new Error('Gambar halaman tidak valid.');
  let lastError;
  for (const model of GROQ_MODELS) {
    try {
      const data = await groqChat({
        model,
        system: region ? REGION_PROMPT : PAGE_PROMPT,
        content: [
          { type: 'text', text: region ? 'Baca potongan kolom ini. Temukan SEMUA soal yang terlihat. Hanya JSON.' : 'Baca halaman ini. Temukan SEMUA soal yang terlihat. Hanya JSON.' },
          image,
        ],
        maxCompletionTokens: 12000,
      });
      const parsed = cleanJson(responseText(data));
      return {
        pageType: parsed?.pageType || 'questions',
        questions: Array.isArray(parsed?.questions)
          ? parsed.questions.map(normalizeQuestion).filter((q) => q.bbox && (q.question || q.options.length))
          : [],
        model,
      };
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('Semua model Groq gagal membaca halaman.');
}

const SINGLE_PROMPT = `Baca satu crop soal ujian dan transkripsikan SETIA tanpa menjawab.
Jangan meringkas atau mengarang. Pertahankan angka, simbol, opsi, dan rumus.
Rumus gunakan LaTeX inline \\( ... \\).
Jika ada diagram/grafik/foto/tabel, tandai hasFigure dan figureBBox relatif terhadap crop.
Klasifikasikan: pilihan_ganda, pernyataan_kompleks, hubungan_kuantitas, isian_singkat.
OUTPUT JSON SAJA: {"question":"...","options":["..."],"tipeSoal":"pilihan_ganda","kuantitasP":"","kuantitasQ":"","hasFigure":false,"figureBBox":null,"readingConfidence":"high"}`;

async function transcribeSingle(imageDataUrl) {
  const image = imagePart(imageDataUrl);
  if (!image) throw new Error('questionCropImage tidak valid.');
  let lastError;
  for (const model of GROQ_MODELS) {
    try {
      const data = await groqChat({ model, system: SINGLE_PROMPT, content: [{ type: 'text', text: 'Transkripsikan crop ini. Hanya JSON.' }, image], maxCompletionTokens: 4096 });
      return normalizeQuestion(cleanJson(responseText(data)));
    } catch (e) { lastError = e; }
  }
  throw lastError || new Error('Semua model Groq gagal mentranskripsi soal.');
}

const ANSWER_PROMPT = `Kamu adalah pemeriksa jawaban soal ujian.
Lihat gambar soal, hitung/nalar jawaban yang benar, dan tulis pembahasan singkat 2-4 kalimat.
Jangan menyalin ulang soal.
OUTPUT JSON SAJA: {"optionCount":5,"correct":0,"explanation":"...","readingConfidence":"high"}
correct adalah indeks 0 untuk A, 1 untuk B, dst.`;

async function answerQuestion(images) {
  const parts = images.map(imagePart).filter(Boolean);
  if (!parts.length) throw new Error('Tidak ada gambar yang valid.');
  let lastError;
  for (const model of GROQ_MODELS) {
    try {
      const data = await groqChat({ model, system: ANSWER_PROMPT, content: [{ type: 'text', text: 'Kerjakan soal ini. Hanya JSON.' }, ...parts], maxCompletionTokens: 2048 });
      const parsed = cleanJson(responseText(data));
      return {
        optionCount: Number.isInteger(parsed?.optionCount) ? parsed.optionCount : 4,
        correct: Number.isInteger(parsed?.correct) ? parsed.correct : 0,
        explanation: typeof parsed?.explanation === 'string' ? parsed.explanation.trim() : '',
        readingConfidence: parsed?.readingConfidence === 'low' ? 'low' : 'high',
      };
    } catch (e) { lastError = e; }
  }
  throw lastError || new Error('Semua model Groq gagal menjawab soal.');
}

const TEXT_PROMPT = `Pecah teks soal ujian menjadi soal terstruktur. Jangan membuat soal baru.
Pertahankan isi dan opsi. Output JSON: {"questions":[{"type":"multiple","question":"...","options":["..."],"correct":0,"correctAnswers":[],"needsManualAnswer":true}]}`;

async function parseText(text) {
  const blocks = [];
  let current = [];
  for (const line of String(text || '').split('\n')) {
    if (/^\s*\d{1,3}[.)]\s+/.test(line) && current.length) {
      blocks.push(current.join('\n'));
      current = [line];
    } else current.push(line);
  }
  if (current.length) blocks.push(current.join('\n'));

  const all = [];
  for (const block of blocks.filter((b) => b.trim().length > 10)) {
    let parsed = null;
    for (const model of GROQ_MODELS) {
      try {
        const data = await groqChat({ model, system: TEXT_PROMPT, content: block.slice(0, 12000), maxCompletionTokens: 4096 });
        parsed = cleanJson(responseText(data));
        break;
      } catch (_) {}
    }
    if (Array.isArray(parsed?.questions)) all.push(...parsed.questions);
  }
  return all.map((q, i) => ({
    id: Date.now() + i,
    type: QUESTION_TYPES.includes(q?.type) ? q.type : 'multiple',
    q: q?.question || '',
    qImage: q?.questionImage || '',
    options: Array.isArray(q?.options) && q.options.length ? q.options : ['', '', '', ''],
    optionImages: ['', '', '', ''],
    correct: typeof q?.correct === 'number' ? q.correct : 0,
    correctAnswers: Array.isArray(q?.correctAnswers) ? q.correctAnswers : [],
    explanation: '', statements: [{ text: '', isTrue: true }], readingText: q?.readingText || '',
    subQuestions: [{ q: '', options: ['', '', '', ''], correct: 0 }],
    shortAnswer: q?.shortAnswer || '', cause: q?.cause || '', effect: q?.effect || '',
    isCauseTrue: q?.isCauseTrue !== false, isEffectTrue: q?.isEffectTrue !== false,
    matchingPairs: [{ left: '', right: '' }, { left: '', right: '' }],
    needsManualAnswer: q?.needsManualAnswer !== false,
  })).filter((q) => q.q.trim().length > 3);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
  if (!process.env.GROQ_API_KEY) return res.status(500).json({ success: false, error: 'GROQ_API_KEY belum di-setting di Vercel.' });

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  try {
    if (body.mode === 'transcribePage') {
      if (!body.pageImage) return res.status(400).json({ success: false, error: 'pageImage kosong.' });
      return res.status(200).json({ success: true, ...(await transcribeRegion(body.pageImage, false)) });
    }
    if (body.mode === 'transcribeRegion') {
      if (!body.pageImage) return res.status(400).json({ success: false, error: 'region image kosong.' });
      return res.status(200).json({ success: true, ...(await transcribeRegion(body.pageImage, true)) });
    }
    if (body.questionCropImage) {
      const q = await transcribeSingle(body.questionCropImage);
      if (!q.question) return res.status(502).json({ success: false, error: 'AI tidak berhasil membaca soal.' });
      return res.status(200).json({ success: true, ...q });
    }
    if (body.questionImage) {
      const result = await answerQuestion([body.questionImage, ...(Array.isArray(body.optionImages) ? body.optionImages : [])]);
      return res.status(200).json({ success: true, ...result });
    }
    if (body.text) return res.status(200).json({ success: true, questions: await parseText(body.text) });

    return res.status(400).json({ success: false, error: 'Payload tidak dikenali.' });
  } catch (e) {
    const providerStatus = Number(e?.status) || 502;
    const is429 = providerStatus === 429 || /429|quota|rate|limit/i.test(e?.message || '');
    if (is429) {
      return res.status(429).json({ success: false, error: 'Quota/rate limit Groq tercapai. Tunggu reset rate limit lalu coba lagi.', diagnostics: { provider: 'groq', type: 'rate_limit' } });
    }
    return res.status(Math.max(400, Math.min(599, providerStatus))).json({ success: false, error: e?.message || 'Gagal memproses Groq.', diagnostics: { provider: 'groq' } });
  }
}
