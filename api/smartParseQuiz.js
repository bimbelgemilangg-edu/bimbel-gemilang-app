// api/smartParseQuiz.js
// Vercel Serverless Function — otomatis hidup begitu di-push ke GitHub & Vercel selesai build.
// TIDAK butuh instalasi apapun, TIDAK butuh Firebase, TIDAK butuh Terminal.

const QUESTION_TYPES = ["multiple", "truefalse", "multiselect", "reading", "shortanswer", "causeeffect"];

export default async function handler(req, res) {
  // Izinkan dipanggil dari web app kita
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { html } = req.body;
  if (!html || html.trim().length < 5) {
    return res.status(400).json({ success: false, error: 'Teks soal kosong' });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ success: false, error: 'API key belum di-setting di Vercel Environment Variables' });
  }

  const systemPrompt = `Kamu adalah parser soal ujian untuk sistem bimbingan belajar.
Input berupa HTML hasil paste dari Word/PDF (bisa berisi tag <b>/<strong> untuk teks bold, dan penanda gambar berformat [[GAMBAR]]::URL).

TUGAS:
1. Pisahkan mana yang SOAL dan mana yang BUKAN SOAL. Buang judul dokumen (contoh: "SOAL TKA IPA JENJANG SMP/MTs"), instruksi umum (contoh: "Perhatikan tabel berikut!"), header, nomor halaman, dan teks lain yang bukan pertanyaan.
2. Untuk tiap soal, tentukan type paling cocok dari daftar ini: ${QUESTION_TYPES.join(", ")}.
   - "multiple": pilihan ganda A-D/E biasa (paling umum)
   - "truefalse": ada tabel/daftar pernyataan yang dinilai benar/salah
   - "multiselect": soal minta pilih LEBIH DARI SATU jawaban
   - "reading": ada teks bacaan/paragraf panjang diikuti beberapa sub-pertanyaan tentang bacaan itu
   - "shortanswer": soal isian tanpa pilihan ganda
   - "causeeffect": soal berpola SEBAB...AKIBAT... yang menilai benar/salah keduanya
3. Jika salah satu opsi jawaban ditulis dengan tag <b> atau <strong> (bold), itu adalah JAWABAN BENAR. Set correct/correctAnswers sesuai index opsi tersebut (index dimulai dari 0), dan set "needsManualAnswer": false.
   Jika TIDAK ada opsi yang bold, kamu TIDAK BOLEH menebak jawaban benar. Set correct: 0 (default saja) dan "needsManualAnswer": true.
4. Jika ada penanda gambar [[GAMBAR]]::URL yang letaknya menyatu dengan teks soal (sebelum opsi jawaban), pindahkan URL itu ke field "questionImage" dan HAPUS penanda tersebut dari teks soal.
5. Rapikan teks soal (hapus nomor urut "1.", spasi berlebih) tapi JANGAN mengubah makna atau kalimat asli soal.
6. Jawab HANYA dengan JSON valid, tanpa teks pembuka, tanpa markdown code fence, tanpa penjelasan apapun.

Format output:
{
  "questions": [
    {
      "type": "multiple",
      "question": "teks soal bersih",
      "questionImage": "",
      "options": ["opsi A", "opsi B", "opsi C", "opsi D"],
      "correct": 0,
      "correctAnswers": [],
      "needsManualAnswer": true,
      "statements": [],
      "readingText": "",
      "subQuestions": [],
      "shortAnswer": "",
      "cause": "",
      "effect": "",
      "isCauseTrue": true,
      "isEffectTrue": true
    }
  ]
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        system: systemPrompt,
        messages: [{ role: "user", content: html }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", data);
      return res.status(500).json({ success: false, error: 'AI gagal memproses. Coba lagi.' });
    }

    const rawText = data.content?.find((c) => c.type === "text")?.text || "{}";
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

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
      subQuestions:
        q.subQuestions && q.subQuestions.length
          ? q.subQuestions
          : [{ q: "", options: ["", "", "", ""], correct: 0 }],
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