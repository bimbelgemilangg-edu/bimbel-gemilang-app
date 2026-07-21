// api/smartParseQuiz.js
// Pakai Hugging Face Inference API — GRATIS, tanpa kartu kredit.
// Diproses per-kelompok soal (chunking) supaya jawaban AI tidak terpotong.

export const config = { maxDuration: 60 };

const QUESTION_TYPES = ["multiple", "truefalse", "multiselect", "reading", "shortanswer", "causeeffect"];
const HF_MODEL = "Qwen/Qwen2.5-7B-Instruct";
const QUESTIONS_PER_CHUNK = 5; // jaga jawaban AI tetap pendek biar tidak terpotong

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

  // Buang blok di awal yang bukan soal (judul dokumen dll) tapi tetap simpan sebagai konteks
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
  const startIdx = cleaned.indexOf('[');
  if (startIdx === -1) return [];

  const objects = [];
  let depth = 0;
  let objStart = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = startIdx; i < cleaned.length; i++) {
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
          objects.push(JSON.parse(candidate));
        } catch (e) {
          // objek ini rusak, lewati saja, jangan gagalkan semua
        }
        objStart = -1;
      }
    }
  }
  return objects;
}

async function callHF(chunkText, HF_TOKEN) {
  const systemPrompt = `Kamu adalah parser soal ujian. Input berupa TEKS POLOS potongan dari PDF (bisa berisi 1-5 soal saja), dengan aturan:
- Teks yang dibungkus **seperti ini** artinya BOLD di dokumen asli.
- Baris "[[GAMBAR]]::url" adalah penanda gambar di halaman itu.

TUGAS:
1. Pisahkan soal dari teks bukan-soal (judul, instruksi umum). Buang yang bukan soal.
2. Tentukan type dari: ${QUESTION_TYPES.join(", ")}.
3. Jika ada opsi bold, itu jawaban benar (needsManualAnswer:false, hapus tanda ** dari teks final). Jika tidak ada bold, correct:0, needsManualAnswer:true.
4. Jika ada [[GAMBAR]]::url tepat sebelum soal, jadikan questionImage, hapus barisnya dari hasil.
5. JAWAB HANYA JSON valid, tanpa penjelasan, tanpa markdown fence.

Format:
{"questions":[{"type":"multiple","question":"...","questionImage":"","options":["...","...","...","..."],"correct":0,"correctAnswers":[],"needsManualAnswer":true,"statements":[],"readingText":"","subQuestions":[],"shortAnswer":"","cause":"","effect":"","isCauseTrue":true,"isEffectTrue":true}]}`;

  const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${HF_TOKEN}`,
    },
    body: JSON.stringify({
      model: HF_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: chunkText.slice(0, 3000) },
      ],
      max_tokens: 3000,
      temperature: 0.1,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("HF API error:", data);
    throw new Error(data?.error?.message || 'AI gagal memproses satu kelompok soal.');
  }

  const rawText = data.choices?.[0]?.message?.content || "{}";

  // Coba parse langsung dulu (kasus normal, tidak terpotong)
  try {
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return parsed.questions || [];
  } catch (e) {
    // Kalau gagal (kemungkinan terpotong), selamatkan objek yang lengkap saja
    return extractCompleteObjects(rawText);
  }
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

  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) {
    return res.status(500).json({ success: false, error: 'HF_TOKEN belum di-setting di Vercel' });
  }

  try {
    const chunks = splitIntoChunks(text);
    if (chunks.length === 0) {
      return res.status(200).json({ success: true, questions: [] });
    }

    let allRawQuestions = [];
    for (const chunk of chunks) {
      try {
        const qs = await callHF(chunk, HF_TOKEN);
        allRawQuestions.push(...qs);
      } catch (chunkErr) {
        console.error("Chunk error (dilewati):", chunkErr.message);
        // Lanjut ke kelompok berikutnya, jangan gagalkan semuanya
      }
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