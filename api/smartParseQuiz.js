// api/smartParseQuiz.js
// Pakai Hugging Face Inference API — GRATIS, tanpa kartu kredit.

const QUESTION_TYPES = ["multiple", "truefalse", "multiselect", "reading", "shortanswer", "causeeffect"];
const HF_MODEL = "Qwen/Qwen2.5-7B-Instruct";

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

  const systemPrompt = `Kamu adalah parser soal ujian. Input berupa TEKS POLOS hasil ekstraksi dari PDF, dengan aturan penanda berikut:
- Teks yang dibungkus **seperti ini** artinya teks tersebut BOLD di dokumen asli.
- Baris berformat "[[GAMBAR]]::url" adalah penanda gambar yang muncul di halaman itu.

TUGAS:
1. Pisahkan soal dari teks bukan-soal (judul dokumen, instruksi umum seperti "Perhatikan gambar berikut", header, nomor halaman). Buang semuanya yang bukan soal.
2. Untuk tiap soal tentukan type dari daftar: ${QUESTION_TYPES.join(", ")}.
   - "multiple": pilihan ganda A-E biasa (paling umum)
   - "truefalse": ada tabel/daftar pernyataan yang dinilai benar/salah
   - "multiselect": soal minta pilih LEBIH DARI SATU jawaban
   - "reading": ada teks bacaan panjang diikuti beberapa sub-pertanyaan
   - "shortanswer": soal isian tanpa pilihan ganda
   - "causeeffect": soal SEBAB...AKIBAT... menilai benar/salah keduanya
3. Jika salah satu opsi dibungkus **bold**, itu JAWABAN BENAR — set correct/correctAnswers sesuai index (mulai dari 0), set needsManualAnswer:false. Hapus tanda ** dari teks opsi final. Jika tidak ada opsi bold, correct:0, needsManualAnswer:true.
4. Jika ada baris [[GAMBAR]]::url tepat SEBELUM sebuah soal (di halaman yang sama), kaitkan url itu sebagai questionImage soal tersebut. Hapus baris [[GAMBAR]]::url dari hasil akhir.
5. Rapikan teks soal (hapus nomor urut, hapus ** dari teks final) tapi jangan ubah makna kalimat asli.
6. JAWAB HANYA JSON valid, tanpa penjelasan, tanpa markdown fence.

Format:
{"questions":[{"type":"multiple","question":"...","questionImage":"","options":["...","...","...","..."],"correct":0,"correctAnswers":[],"needsManualAnswer":true,"statements":[],"readingText":"","subQuestions":[],"shortAnswer":"","cause":"","effect":"","isCauseTrue":true,"isEffectTrue":true}]}`;

  try {
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
          { role: "user", content: text.slice(0, 12000) },
        ],
        max_tokens: 4000,
        temperature: 0.2,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("HF API error:", data);
      return res.status(500).json({ success: false, error: data?.error?.message || 'AI gagal memproses. Jika baru pertama kali, tunggu 20 detik lalu coba lagi (cold start).' });
    }

    const rawText = data.choices?.[0]?.message?.content || "{}";
    const cleaned = rawText.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      const match = cleaned.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { questions: [] };
    }

    const questions = (parsed.questions || []).map((q, idx) => ({
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
    }));

    return res.status(200).json({ success: true, questions });
  } catch (err) {
    console.error("smartParseQuiz error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}