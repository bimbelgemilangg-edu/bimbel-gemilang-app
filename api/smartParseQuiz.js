// api/smartParseQuiz.js
// 🔥 UPGRADE: sekarang pakai Google Gemini (bukan Hugging Face lagi).
// Fungsinya TETAP SAMA: guru tempel teks soal yang SUDAH ADA (dari PDF/Word),
// AI memisahkan jadi soal-soal terstruktur, mendeteksi jawaban benar dari
// teks **bold**, dan menandai needsManualAnswer kalau tidak ketemu.
//
// Kenapa pindah dari HF: HF Inference Providers kuota gratisnya sangat kecil
// ($0.10/bulan) dan sering gagal. Gemini jauh lebih stabil untuk pemakaian rutin.

export const config = { maxDuration: 60 };

const QUESTION_TYPES = ["multiple", "truefalse", "multiselect", "reading", "shortanswer", "causeeffect", "matching"];
const QUESTIONS_PER_CHUNK = 5; // jaga jawaban AI tetap pendek biar tidak terpotong

const GEMINI_MODELS = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
];

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
          // Objek "questions wrapper" {"questions":[...]} ATAU objek soal langsung
          if (Array.isArray(parsed.questions)) {
            objects.push(...parsed.questions);
          } else if (parsed.question) {
            objects.push(parsed);
          }
        } catch (e) {
          // objek ini rusak, lewati saja, jangan gagalkan semua
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
        temperature: 0.1, // ini tugas parsing/ekstraksi, bukan kreatif — presisi maksimal
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
  const systemPrompt = `Kamu adalah parser soal ujian. Input berupa TEKS POLOS potongan dari PDF/Word (bisa berisi 1-5 soal saja), dengan aturan:
- Teks yang dibungkus **seperti ini** artinya BOLD di dokumen asli.
- Baris "[[GAMBAR]]::url" adalah penanda gambar di halaman itu.

TUGAS:
1. Pisahkan soal dari teks bukan-soal (judul, instruksi umum). Buang yang bukan soal.
2. Tentukan type dari: ${QUESTION_TYPES.join(", ")}.
3. Jika ada opsi bold, itu jawaban benar (needsManualAnswer:false, hapus tanda ** dari teks final). Jika tidak ada bold sama sekali di soal itu, correct:0, needsManualAnswer:true — JANGAN MENEBAK jawaban benar kalau tidak ada tanda bold, karena bisa salah dan menyesatkan siswa.
4. Jika ada [[GAMBAR]]::url tepat sebelum soal, jadikan questionImage, hapus barisnya dari hasil.
5. JAWAB HANYA JSON valid, tanpa penjelasan, tanpa markdown fence.

Format:
{"questions":[{"type":"multiple","question":"...","questionImage":"","options":["...","...","...","..."],"correct":0,"correctAnswers":[],"needsManualAnswer":true,"statements":[],"readingText":"","subQuestions":[],"shortAnswer":"","cause":"","effect":"","isCauseTrue":true,"isEffectTrue":true,"matchingPairs":[]}]}`;

  let lastErr;
  for (const modelName of GEMINI_MODELS) {
    try {
      const data = await callGemini(systemPrompt, chunkText, modelName);
      const rawText = data.choices?.[0]?.message?.content
        || data.candidates?.[0]?.content?.parts?.[0]?.text
        || "{}";

      try {
        const cleaned = rawText.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return parsed.questions || [];
      } catch (e) {
        // Kemungkinan terpotong — selamatkan objek yang lengkap saja
        return extractCompleteObjects(rawText);
      }
    } catch (e) {
      lastErr = e;
      console.error(`smartParseQuiz gagal pakai model ${modelName}:`, e.message);
      // Kalau kuota habis/model tidak ada, lanjut ke model berikutnya di daftar.
      // Kalau error lain, tetap lanjut coba model berikutnya juga (chunk kecil, gak worth retry di model sama).
    }
  }
  console.error("Semua model gagal untuk 1 chunk:", lastErr?.message);
  return []; // chunk ini gagal total, dilewati saja, chunk lain tetap lanjut
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { text } = req.body;
  if (!text || text.trim().length < 5) {
    return res.status(400).json({ success: false, error: 'Teks soal kosong' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ success: false, error: 'GEMINI_API_KEY belum di-setting di Vercel' });
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
      return res.status(500).json({ success: false, error: 'AI tidak berhasil menghasilkan soal yang valid. Coba upload ulang atau kurangi jumlah halaman sekaligus.' });
    }

    return res.status(200).json({ success: true, questions });
  } catch (err) {
    console.error("smartParseQuiz error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}