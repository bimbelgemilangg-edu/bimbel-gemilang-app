// api/smartParseQuiz.js
// ============================================================
// 🔥 UPGRADE (Agustus 2026): sekarang punya DUA MODE.
//
// MODE 1 -- TEKS (sudah ada sejak awal, TIDAK DIUBAH):
//   Guru tempel teks soal yang SUDAH ADA (hasil salin dari PDF/Word).
//   AI memisahkan jadi soal-soal terstruktur, mendeteksi jawaban benar
//   dari teks **bold**, dan menandai needsManualAnswer kalau tidak
//   ketemu. Dipakai oleh WordImportQuiz.jsx.
//
// MODE 2 -- GAMBAR HALAMAN (BARU):
//   Admin unggah PDF ke Bank Soal (lihat BankSoalImport.jsx). Tiap
//   halaman DIRENDER JADI GAMBAR di browser admin, lalu gambar itu
//   dikirim ke sini. AI "melihat" halaman lewat kemampuan visual
//   Gemini, membaca soal APA ADANYA (verbatim -- BUKAN dimodifikasi),
//   menghitung ulang jawaban yang benar, dan menandai area gambar
//   (figureBBox) supaya bisa dipotong persis dari halaman asli.
//
//   ⚠️ BEDA TUJUAN dengan generateQuizFromTopic.js yang metode ATM-nya
//   SENGAJA memodifikasi angka/konteks. Di sini TUJUANNYA SEBALIKNYA:
//   admin memilih menyimpan soal ASLI ke Bank Soal (keputusan eksplisit
//   pemilik bimbel), jadi transkripsinya harus SETIA ke halaman aslinya.
//   ATM baru dipakai NANTI kalau soal dari Bank Soal ini dipakai sebagai
//   inspirasi membuat kuis baru -- itu fitur terpisah, belum dibangun.
//
// ⚠️ KENAPA DITAMBAHKAN DI FILE INI, BUKAN FILE BARU:
// Project ini pakai paket Vercel Hobby yang dibatasi 12 Serverless
// Function per deployment, dan sempat mentok di angka itu (lihat
// riwayat perbaikan lain di repo ini -- questionPrompts.js sampai
// harus dipindah dari api/ ke lib/ demi membebaskan satu slot).
// Menambah endpoint baru untuk kebutuhan yang MIRIP (sama-sama
// "ubah dokumen sumber jadi soal terstruktur") jelas boros. Jadi mode
// baru ini MENUMPANG di file yang sudah ada, dipilih lewat ada-
// tidaknya field `pageImage` di body request -- bukan lewat file
// terpisah.
// ============================================================

export const config = { maxDuration: 60 };

const QUESTION_TYPES = ["multiple", "truefalse", "multiselect", "reading", "shortanswer", "causeeffect", "matching"];
const QUESTIONS_PER_CHUNK = 5; // jaga jawaban AI tetap pendek biar tidak terpotong

// 🔥 FIX (Agustus 2026): daftar model lama ('gemini-2.5-flash',
// 'gemini-2.5-flash-lite') SUDAH DITUTUP untuk akun baru -- Google
// membalas 404 dengan pesan eksplisit "no longer available to new
// users, gunakan generasi 3". Ini persis kejadian yang sudah
// diverifikasi & diperbaiki di generateQuizFromTopic.js lewat endpoint
// diagnostik (?probe=1). Alias '-latest' TIDAK dijamin selalu
// menunjuk ke versi yang boleh dipakai akun baru, jadi diganti ke ID
// eksplisit yang sudah terbukti hidup di akun ini.
const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
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

// ============================================================
// PEMANGGIL GEMINI -- TEKS (mode lama, tidak diubah)
// ============================================================
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

// ============================================================
// 🔥 BARU: PEMANGGIL GEMINI -- GAMBAR (mode baca halaman PDF)
// ============================================================
// Berbeda dari callGemini() di atas: mengirim GAMBAR (inline_data)
// sebagai bagian dari `contents`, bukan cuma teks. Gemini Flash sejak
// generasi 2.x sudah multimodal secara native, jadi tidak perlu model
// terpisah untuk ini -- daftar GEMINI_MODELS yang sama tetap dipakai.
async function callGeminiVision(systemPrompt, imageDataUrl, modelName) {
  // imageDataUrl formatnya "data:image/jpeg;base64,AAAA..." -- pisahkan
  // mime type dari payload base64-nya.
  const match = /^data:([^;]+);base64,(.+)$/.exec(imageDataUrl || '');

  if (!match) {
    throw new Error('Format gambar halaman tidak valid (bukan data URL base64).');
  }

  const [, mimeType, base64Data] = match;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [
        {
          role: 'user',
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Data } },
            {
              text:
                'Baca halaman ini dan hasilkan JSON sesuai instruksi di system prompt. Hanya JSON, tanpa penjelasan lain.',
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        // 🔥 Lebih besar dari mode teks (4096) karena: (a) satu halaman
        // bisa berisi beberapa soal panjang dengan pembahasan, dan
        // (b) model Gemini generasi 3 TIDAK BISA mematikan mode
        // "berpikir" sepenuhnya -- token berpikir itu diambil dari
        // jatah yang sama, jadi harus disediakan ruang ekstra supaya
        // tidak terpotong di tengah jalan (pelajaran yang sama persis
        // dengan yang sudah diperbaiki di generateQuizFromTopic.js).
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

// ============================================================
// 🔥 BARU: SYSTEM PROMPT UNTUK BACA HALAMAN (mode gambar)
// ============================================================
// SENGAJA BERBEDA dari prompt di parseChunk() di bawah: prompt itu
// untuk teks yang SUDAH rapi (hasil ketik ulang guru di Word), di
// sini AI membaca LANGSUNG dari gambar halaman cetakan/scan asli --
// perlu instruksi tata letak kolom, transkripsi presisi, dan
// perhitungan ulang jawaban (karena buku soal cetak jarang menandai
// kunci jawaban langsung di halaman soalnya).
function buildVisionPagePrompt() {
  return `Kamu adalah pembaca dokumen soal ujian untuk Bank Soal Bimbel Gemilang.

TUGAS:
Baca SATU halaman dokumen soal (diberikan sebagai gambar), lalu ubah setiap butir soal pada halaman itu menjadi objek JSON terstruktur.

PALING PENTING -- TRANSKRIPSI APA ADANYA:
Tulis ulang teks soal dan pilihan jawaban PERSIS seperti yang tertulis di halaman. JANGAN mengubah angka, JANGAN mengganti konteks, JANGAN memperbaiki kalimat supaya "lebih bagus". Ini untuk arsip Bank Soal, bukan soal latihan baru -- yang dibutuhkan adalah SALINAN SETIA dari sumbernya, bukan versi kreatif.

Pengecualian SATU-SATUNYA: kalau ada bagian yang benar-benar tidak terbaca (buram, terpotong, tinta pudar), JANGAN MENGARANG -- tandai readingConfidence:"low" pada butir itu dan tetap tulis bagian yang terbaca apa adanya.

TATA LETAK:
Halaman bisa berisi DUA KOLOM. Baca kolom KIRI dari atas ke bawah dulu, baru kolom KANAN -- JANGAN membaca menyilang antar kolom seperti membaca baris biasa.

NOMOR SOAL:
Gunakan nomor soal PERSIS seperti yang tercetak di halaman (field "printedNumber"). Ini beda dari indeks array -- kalau halaman dimulai dari soal nomor 37, printedNumber butir pertama adalah 37, bukan 1.

MENENTUKAN JAWABAN BENAR:
Buku soal cetak biasanya TIDAK menandai kunci jawaban di halaman soalnya. Kamu HARUS menghitung/menalar sendiri jawaban yang benar berdasarkan pengetahuan akademik, seperti mengerjakan soal itu sendiri. Kalau ragu antara dua opsi atau perhitungannya tidak bisa dipastikan dari informasi di halaman, tandai readingConfidence:"low" dan tetap isi correct dengan jawaban paling mungkin -- JANGAN dikosongkan.

RUMUS MATEMATIKA:
Tulis dengan LaTeX dibungkus \\\\( \\\\), contoh: \\\\(x^2 + 3x - 4 = 0\\\\), \\\\(\\\\frac{a}{b}\\\\), \\\\(\\\\sqrt{x+1}\\\\).

GAMBAR/DIAGRAM/TABEL DI DALAM SOAL:
Kalau sebuah soal memuat gambar, diagram, grafik, atau tabel yang PENTING untuk menjawabnya, isi "figureBBox" dengan kotak area gambar itu dalam KOORDINAT TERNORMALISASI 0 sampai 1 relatif terhadap SELURUH halaman (bukan piksel): {"x":..,"y":..,"width":..,"height":..} di mana (x,y) adalah pojok kiri-atas kotak. Kalau soal tidak memuat gambar/tabel, jangan sertakan field ini sama sekali.

CAKUPAN TIPE SOAL (versi ini):
Fokus pada soal PILIHAN GANDA (4-5 opsi, satu jawaban benar) -- itu bentuk paling umum di buku tryout. Kalau ada bentuk lain (esai, isian, dll) di halaman itu, tetap coba baca sebaik mungkin dengan field yang paling mendekati, tapi PRIORITASKAN akurasi soal pilihan ganda.

HALAMAN BUKAN SOAL:
Kalau halaman ini sampul, daftar isi, kunci jawaban, atau kosong -- kembalikan array questions KOSONG. Jangan memaksakan membuat soal dari halaman semacam itu.

FORMAT OUTPUT -- HANYA JSON, TANPA MARKDOWN, TANPA PENJELASAN:
{"questions":[
  {
    "printedNumber": 37,
    "question": "...",
    "options": ["...","...","...","...","..."],
    "correct": 0,
    "explanation": "penjelasan langkah demi langkah sampai ke jawaban",
    "figureBBox": {"x":0.05,"y":0.4,"width":0.4,"height":0.25},
    "readingConfidence": "high"
  }
]}

"correct" wajib angka indeks (0 untuk opsi pertama), BUKAN huruf "A"/"B"/dst.
"readingConfidence" wajib "high" atau "low".
Kalau soal tidak punya gambar, JANGAN sertakan field "figureBBox".`;
}

// ============================================================
// 🔥 BARU: BACA SATU HALAMAN (mode gambar) DENGAN FALLBACK MODEL
// ============================================================
async function parsePageImage(imageDataUrl) {
  const systemPrompt = buildVisionPagePrompt();

  let lastErr;
  for (const modelName of GEMINI_MODELS) {
    try {
      const data = await callGeminiVision(systemPrompt, imageDataUrl, modelName);

      const rawText =
        data.choices?.[0]?.message?.content ||
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        '{}';

      try {
        const cleaned = rawText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return Array.isArray(parsed.questions) ? parsed.questions : [];
      } catch (e) {
        // Kemungkinan terpotong -- selamatkan objek yang lengkap saja,
        // sama seperti mode teks.
        return extractCompleteObjects(rawText);
      }
    } catch (e) {
      lastErr = e;
      console.error(`smartParseQuiz (vision) gagal pakai model ${modelName}:`, e.message);
      // Lanjut ke model berikutnya di daftar (mis. kalau satu model
      // ternyata 404/dipensiunkan) -- sama seperti mode teks.
    }
  }

  console.error('Semua model gagal membaca halaman ini:', lastErr?.message);
  throw lastErr || new Error('Semua model Gemini gagal membaca halaman ini.');
}

async function parseChunk(chunkText) {
  const systemPrompt = `Kamu adalah parser soal ujian. Input berupa TEKS POLOS potongan dari PDF/Word (bisa berisi 1-5 soal saja), dengan aturan:
- Teks yang dibungkus **seperti ini** artinya BOLD di dokumen asli.
- Penanda "[[IMG:n]]" (n = angka) artinya ADA GAMBAR persis di posisi itu. Kamu TIDAK PERLU dan TIDAK BISA melihat isi gambarnya — cukup salin penanda itu APA ADANYA (utuh, termasuk tanda kurung sikunya) ke field questionImage kalau gambar itu bagian dari soal tersebut. JANGAN mengarang deskripsi gambar, JANGAN mengubah angka n di dalamnya.

TUGAS:
1. Pisahkan soal dari teks bukan-soal (judul, instruksi umum). Buang yang bukan soal.
2. Tentukan type dari: ${QUESTION_TYPES.join(", ")}.
3. Jika ada opsi bold, itu jawaban benar (needsManualAnswer:false, hapus tanda ** dari teks final). Jika tidak ada bold sama sekali di soal itu, correct:0, needsManualAnswer:true — JANGAN MENEBAK jawaban benar kalau tidak ada tanda bold, karena bisa salah dan menyesatkan siswa.
4. Jika ada "[[IMG:n]]" tepat sebelum/di dalam soal, salin PERSIS penanda itu ke questionImage (contoh: "[[IMG:3]]"), lalu hapus penandanya dari teks soal akhir.
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

// ============================================================
// 🔥 BARU: HANDLER MODE GAMBAR
// ============================================================
async function handlePageImageMode(req, res) {
  const { pageImage, pageNumber } = req.body;

  if (!pageImage || typeof pageImage !== 'string') {
    return res.status(400).json({ success: false, error: 'pageImage kosong atau tidak valid.' });
  }

  try {
    const rawQuestions = await parsePageImage(pageImage);

    // Bentuk output SENGAJA berbeda dari mode teks (yang pakai field
    // singkat `q`, `qImage` demi kompatibilitas dengan alur lama
    // WordImportQuiz/SmartImportPanel -> ManageQuiz). Mode gambar ini
    // konsumennya BankSoalImport.jsx, jadi bentuknya disesuaikan ke
    // situ: `question` (bukan `q`), tanpa `qImage` (itu dipotong di
    // BROWSER dari kanvas halaman, pakai `figureBBox` yang dikirim
    // di sini -- lihat cropFromCanvas() di BankSoalImport.jsx).
    const questions = rawQuestions
      .filter((q) => q && typeof q.question === 'string' && q.question.trim().length > 3)
      .map((q) => ({
        type: 'multiple',
        question: q.question.trim(),
        options: Array.isArray(q.options) && q.options.length >= 2
          ? q.options.map((o) => String(o ?? '').trim())
          : ['', '', '', ''],
        correct: Number.isInteger(q.correct) ? q.correct : 0,
        explanation: typeof q.explanation === 'string' ? q.explanation.trim() : '',
        figureBBox: q.figureBBox && typeof q.figureBBox === 'object' ? q.figureBBox : null,
        readingConfidence: q.readingConfidence === 'low' ? 'low' : 'high',
        printedNumber: Number.isInteger(q.printedNumber) ? q.printedNumber : null,
        pageNumber: Number.isInteger(pageNumber) ? pageNumber : null,
      }));

    return res.status(200).json({ success: true, questions });
  } catch (err) {
    console.error('smartParseQuiz (vision) error:', err);
    return res.status(502).json({
      success: false,
      error: err.message || 'Gagal membaca halaman ini.',
    });
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

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ success: false, error: 'GEMINI_API_KEY belum di-setting di Vercel' });
  }

  // 🔥 BARU: cabang mode gambar -- dipilih HANYA lewat keberadaan
  // field `pageImage`, supaya pemanggil lama (yang selalu mengirim
  // `text`) tidak sedikit pun terpengaruh oleh penambahan ini.
  if (req.body && req.body.pageImage) {
    return handlePageImageMode(req, res);
  }

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