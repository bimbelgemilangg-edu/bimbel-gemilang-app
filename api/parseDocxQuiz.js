// api/parseDocxQuiz.js
// 🔥 Import soal dari Word (.docx) — jauh lebih akurat daripada crop visual PDF,
// karena Word menyimpan STRUKTUR ASLI dokumen (teks, bold, gambar), bukan cuma
// gambar halaman yang harus ditebak-tebak batasnya kayak PDF.
//
// Alur: guru upload .docx -> kita ekstrak jadi teks polos (bold jadi **bold**,
// gambar jadi penanda [[GAMBAR]]::dataURI) -> masuk ke pipeline AI yang SAMA
// persis dengan smartParseQuiz.js (Gemini, chunking, tahan kepotong).

import mammoth from 'mammoth';

export const config = { maxDuration: 60 };

const QUESTION_TYPES = ["multiple", "truefalse", "multiselect", "reading", "shortanswer", "causeeffect", "matching"];
const QUESTIONS_PER_CHUNK = 5;

const GEMINI_MODELS = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
];

// ============================================================
// 🔥 KONVERSI HTML HASIL MAMMOTH -> TEKS POLOS BERPENANDA
// ============================================================
function docxHtmlToPlainText(html) {
  let text = html;

  // Gambar -> penanda baris sendiri (dataURI base64, langsung dipakai sebagai questionImage)
  text = text.replace(/<img[^>]*src="([^"]+)"[^>]*>/gi, '\n[[GAMBAR]]::$1\n');

  // Bold -> **...** (penanda jawaban benar, sesuai konvensi smartParseQuiz)
  text = text.replace(/<\/?(strong|b)>/gi, '**');

  // List bernomor Word (<ol><li>) -> mammoth biasanya buang angkanya, jadi
  // kita nomori ulang manual supaya chunking (deteksi "1. ", "2. ") tetap jalan.
  text = text.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, inner) => {
    let counter = 0;
    return inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m2, item) => {
      counter++;
      return `\n${counter}. ${item}\n`;
    });
  });

  // Paragraf & line break -> baris baru
  text = text.replace(/<\/p>/gi, '\n').replace(/<br\s*\/?>/gi, '\n');

  // Buang sisa tag HTML
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entity dasar
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Rapikan baris kosong berlebih
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

// ============================================================
// Pecah teks jadi kelompok kecil berdasarkan nomor soal (1. 2. 3. dst)
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
  for (let i = 0; i < blocks.length; i += QUESTIONS_PER_CHUNK) {
    const group = blocks.slice(i, i + QUESTIONS_PER_CHUNK);
    chunks.push(group.map((b) => b.join('\n')).join('\n'));
  }
  return chunks.filter((c) => c.trim().length > 10);
}

// ============================================================
// Ekstrak objek JSON yang lengkap saja, buang yang terpotong di akhir
// ============================================================
function extractCompleteObjects(rawText) {
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  const objects = [];
  let depth = 0;
  let objStart = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (ch === '\\') { escapeNext = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === '{') {
      if (depth === 0) objStart = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && objStart !== -1) {
        const candidate = cleaned.slice(objStart, i + 1);
        try {
          const parsed = JSON.parse(candidate);
          if (Array.isArray(parsed.questions)) {
            objects.push(...parsed.questions);
          } else if (parsed.question) {
            objects.push(parsed);
          }
        } catch (e) {
          // objek rusak, lewati saja
        }
        objStart = -1;
      }
    }
  }
  return objects;
}

async function callGemini(systemPrompt, userText, modelName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userText.slice(0, 4000) }] }],
      generationConfig: {
        temperature: 0.1,
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

async function parseChunk(chunkText) {
  const systemPrompt = `Kamu adalah parser soal ujian. Input berupa TEKS POLOS hasil ekstraksi dari file Word (bisa berisi 1-5 soal saja), dengan aturan:
- Teks yang dibungkus **seperti ini** artinya BOLD di dokumen asli (guru menandai jawaban benar dengan bold).
- Baris "[[GAMBAR]]::dataURI" adalah gambar yang ada tepat di posisi itu di dokumen asli.

TUGAS:
1. Pisahkan soal dari teks bukan-soal (judul, instruksi umum seperti "Langkah Pengerjaan"). Buang yang bukan soal.
2. Tentukan type dari: ${QUESTION_TYPES.join(", ")}.
3. Jika ada opsi bold, itu jawaban benar (needsManualAnswer:false, hapus tanda ** dari teks final). Jika tidak ada bold sama sekali di soal itu, correct:0, needsManualAnswer:true — JANGAN MENEBAK jawaban benar kalau tidak ada tanda bold.
4. Jika ada [[GAMBAR]]::dataURI tepat sebelum/di dalam soal, jadikan questionImage (salin dataURI-nya utuh), hapus barisnya dari teks final.
5. JAWAB HANYA JSON valid, tanpa penjelasan, tanpa markdown fence.

Format:
{"questions":[{"type":"multiple","question":"...","questionImage":"","options":["...","...","...","..."],"correct":0,"correctAnswers":[],"needsManualAnswer":true,"statements":[],"readingText":"","subQuestions":[],"shortAnswer":"","cause":"","effect":"","isCauseTrue":true,"isEffectTrue":true,"matchingPairs":[]}]}`;

  let lastErr;
  for (const modelName of GEMINI_MODELS) {
    try {
      const data = await callGemini(systemPrompt, chunkText, modelName);
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      try {
        const cleaned = rawText.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return parsed.questions || [];
      } catch (e) {
        return extractCompleteObjects(rawText);
      }
    } catch (e) {
      lastErr = e;
      console.error(`parseDocxQuiz gagal pakai model ${modelName}:`, e.message);
    }
  }
  console.error("Semua model gagal untuk 1 chunk:", lastErr?.message);
  return [];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { fileBase64 } = req.body;
  if (!fileBase64) {
    return res.status(400).json({ success: false, error: 'File tidak ditemukan' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ success: false, error: 'GEMINI_API_KEY belum di-setting di Vercel' });
  }

  try {
    // 1. Ekstrak file Word jadi HTML (mammoth otomatis embed gambar sebagai base64)
    const buffer = Buffer.from(fileBase64, 'base64');
    const { value: html } = await mammoth.convertToHtml({ buffer });

    // 2. Konversi ke teks polos berpenanda (**bold**, [[GAMBAR]]::...)
    const plainText = docxHtmlToPlainText(html);

    if (!plainText || plainText.trim().length < 10) {
      return res.status(400).json({ success: false, error: 'File Word kosong atau tidak bisa dibaca teksnya.' });
    }

    // 3. Pecah jadi chunk kecil & proses satu-satu (sama seperti smartParseQuiz.js)
    const chunks = splitIntoChunks(plainText);
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
      type: QUESTION_TYPES.includes(q.type) ? q.type : "multiple",
      q: q.question || "",
      qImage: q.questionImage || "",
      options: q.options && q.options.length ? q.options : ["", "", "", ""],
      optionImages: ["", "", "", ""],
      correct: typeof q.correct === "number" ? q.correct : 0,
      correctAnswers: q.correctAnswers || [],
      explanation: "",
      statements: q.statements && q.statements.length ? q.statements : [{ text: "", isTrue: true }],
      readingText: q.readingText || "",
      subQuestions: q.subQuestions && q.subQuestions.length ? q.subQuestions : [{ q: "", options: ["", "", "", ""], correct: 0 }],
      shortAnswer: q.shortAnswer || "",
      cause: q.cause || "",
      effect: q.effect || "",
      isCauseTrue: q.isCauseTrue !== undefined ? q.isCauseTrue : true,
      isEffectTrue: q.isEffectTrue !== undefined ? q.isEffectTrue : true,
      matchingPairs: q.matchingPairs && q.matchingPairs.length ? q.matchingPairs : [{ left: "", right: "" }, { left: "", right: "" }],
      needsManualAnswer: q.needsManualAnswer !== false,
    })).filter((q) => q.q.trim().length > 3);

    if (questions.length === 0) {
      return res.status(500).json({ success: false, error: 'Tidak ditemukan soal yang valid di file Word ini. Pastikan tiap soal diawali nomor (1. 2. 3. dst).' });
    }

    return res.status(200).json({ success: true, questions });
  } catch (err) {
    console.error("parseDocxQuiz error:", err);
    return res.status(500).json({ success: false, error: 'Gagal membaca file Word: ' + err.message });
  }
}