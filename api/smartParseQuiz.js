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
// MODE 2 -- JAWAB SOAL DARI CROP GAMBAR (BARU):
//   Admin unggah PDF ke Bank Soal (lihat BankSoalImport.jsx). Soal
//   DIPOTONG PER BUTIR di BROWSER, TANPA AI SAMA SEKALI -- deteksi
//   posisi nomor soal dari teks asli PDF (bukan tebakan visual),
//   persis logika yang sudah dipakai SmartImportPanel.jsx. Hasil
//   potongan itu adalah CROP PIKSEL PERSIS dari halaman asli.
//
//   AI HANYA dipanggil untuk satu tugas kecil per butir: melihat crop
//   itu dan menentukan JAWABAN YANG BENAR + pembahasan singkat --
//   AI TIDAK PERNAH diminta menyalin ulang teks soal. Ini menghindari
//   dua masalah sekaligus dari desain sebelumnya: (a) risiko salah
//   transkripsi soal oleh AI, dan (b) respons kepotong di tengah pada
//   halaman padat (karena sekarang setiap panggilan AI cuma menjawab
//   SATU soal dengan keluaran pendek, bukan menyalin banyak soal
//   sekaligus dalam satu respons besar).
//
// ⚠️ KENAPA DITAMBAHKAN DI FILE INI, BUKAN FILE BARU:
// Project ini pakai paket Vercel Hobby yang dibatasi 12 Serverless
// Function per deployment, dan sempat mentok di angka itu (lihat
// riwayat perbaikan lain di repo ini -- questionPrompts.js sampai
// harus dipindah dari api/ ke lib/ demi membebaskan satu slot).
// Menambah endpoint baru untuk kebutuhan yang MIRIP (sama-sama
// "ubah dokumen sumber jadi soal terstruktur") jelas boros. Jadi mode
// baru ini MENUMPANG di file yang sudah ada, dipilih lewat ada-
// tidaknya field `questionImage` di body request -- bukan lewat file
// terpisah.
// ============================================================

export const config = { maxDuration: 60 };

// 🔥 BARU: batas waktu untuk SATU KALI pemanggilan Gemini. Sebelumnya
// file ini tidak punya timeout sama sekali -- kalau Gemini macet,
// Vercel akan mematikan function ini paksa di detik ke-60 (maxDuration
// di atas), dan admin dapat error mentah dari platform (bukan JSON
// yang rapi) yang membingungkan. Disisakan headroom 10 detik dari
// maxDuration untuk proses parsing/response sesudahnya.
const GROQ_TIMEOUT_MS = 50_000;
const GROQ_MODEL = process.env.GROQ_MODEL || 'qwen/qwen3.6-27b';

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
// ============================================================
// Ekstrak objek soal yang lengkap dari respons AI, WALAU respons itu
// terpotong di tengah (kehabisan jatah token).
// ============================================================
//
// 🔥 FIX BUG NYATA: versi sebelumnya cuma menyelamatkan objek paling
// LUAR yang menutup sempurna. Karena tiap soal dibungkus di dalam
// {"questions":[...]}, begitu respons terpotong sebelum pembungkus
// luar itu sempat ditutup, SEMUA soal ikut hilang -- termasuk soal-
// soal yang sebenarnya sudah lengkap & valid di bagian AWAL respons.
// Terbukti nyata pada halaman padat (mis. 8 soal trigonometri/limit
// sekaligus): AI kehabisan token di tengah, dan halaman yang sebenarnya
// penuh soal keluar sebagai "0 soal terbaca".
//
// Sekarang: coba parse SETIAP `{...}` yang menutup sempurna DI MANA
// PUN posisinya (bukan cuma yang paling luar), lalu simpan yang
// benar-benar berhasil di-parse DAN punya field "question" berupa
// teks. Soal-soal yang sudah lengkap sebelum titik potong tetap
// terselamatkan, walau soal terakhir yang kepotong tetap hilang (itu
// memang tidak bisa diselamatkan -- datanya sendiri tidak lengkap).
function extractCompleteObjects(rawText) {
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  const objects = [];

  // 🔥 PENTING: dedup berdasar ISI teks soal, BUKAN referensi objek --
  // objek yang sama bisa "ditemukan" dua kali (sekali sebagai objek
  // individual saat `}` penutupnya sendiri terlewati, sekali lagi
  // dari dalam array "questions" milik pembungkus luar kalau
  // pembungkus itu KEBETULAN juga sempat menutup sempurna). Dua-duanya
  // adalah JSON.parse() TERPISAH, jadi walau isinya identik, objeknya
  // adalah instance yang berbeda -- perbandingan referensi (misal
  // array.includes(objek)) TIDAK PERNAH menganggapnya sama, dan tanpa
  // dedup berbasis isi ini soal akan tampil dobel di kasus normal
  // (respons yang TIDAK terpotong).
  const seenQuestionTexts = new Set();

  const pushIfNew = (parsed) => {
    if (!parsed || typeof parsed.question !== 'string') return;
    const key = parsed.question.trim();
    if (!key || seenQuestionTexts.has(key)) return;
    seenQuestionTexts.add(key);
    objects.push(parsed);
  };

  const openStack = [];
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (ch === '\\') { escapeNext = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === '{') {
      openStack.push(i);
    } else if (ch === '}') {
      const start = openStack.pop();
      if (start === undefined) continue;

      const candidate = cleaned.slice(start, i + 1);
      try {
        const parsed = JSON.parse(candidate);
        if (parsed && typeof parsed.question === 'string') {
          // Objek soal individual -- lolos walau pembungkus luarnya
          // tidak pernah menutup.
          pushIfNew(parsed);
        } else if (parsed && Array.isArray(parsed.questions)) {
          // Pembungkus yang KEBETULAN sempat menutup sempurna (kasus
          // tidak terpotong) -- ambil isinya; pushIfNew menjamin tidak
          // dobel dengan yang sudah ditemukan lewat jalur individual.
          for (const q of parsed.questions) pushIfNew(q);
        }
      } catch (e) {
        // Substring ini bukan JSON valid berdiri sendiri (mis. baru
        // separuh soal) -- lewati, bukan berarti gagal total.
      }
    }
  }

  return objects;
}

// ============================================================
// PEMANGGIL GEMINI -- TEKS (mode lama, tidak diubah)
// ============================================================

async function parseChunk(text) {
  const systemPrompt = `Kamu adalah parser soal ujian untuk Bimbel Gemilang.

TUGAS:
Ubah teks soal menjadi JSON terstruktur. Jangan mengarang isi. Pertahankan angka, konteks, dan pilihan jawaban apa adanya.

Keluaran HARUS berupa satu objek JSON dengan properti "questions" berupa array.

Setiap item minimal punya:
{
  "question": "...",
  "options": ["..."],
  "type": "multiple",
  "correct": 0,
  "correctAnswers": [],
  "questionImage": "",
  "statements": [],
  "readingText": "",
  "subQuestions": [],
  "shortAnswer": "",
  "cause": "",
  "effect": "",
  "isCauseTrue": true,
  "isEffectTrue": true,
  "matchingPairs": [],
  "needsManualAnswer": true
}

Gunakan type salah satu dari: multiple, truefalse, multiselect, reading, shortanswer, causeeffect, matching.
Kalau kunci jawaban tidak terlihat/ditandai di teks, gunakan correct:0 dan needsManualAnswer:true.
Jangan menambahkan pembahasan.
Hanya JSON, tanpa markdown.`;

  const data = await callGroqText(systemPrompt, text, GROQ_MODEL);
  const rawText = data?.choices?.[0]?.message?.content || '{}';

  try {
    const parsed = JSON.parse(rawText.trim());
    return Array.isArray(parsed?.questions) ? parsed.questions : [];
  } catch (e) {
    return extractCompleteObjects(rawText).map((q) => q?.questions || q).flat().filter(Boolean);
  }
}

async function callGroqText(systemPrompt, userText, modelName = GROQ_MODEL) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText.slice(0, 12000) },
        ],
        temperature: 0.1,
        max_completion_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GROQ_HTTP_${response.status}: ${errText}`);
    }
    return response.json();
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
// ============================================================
// 🔥 BARU: PEMANGGIL GEMINI -- GAMBAR (mode jawab soal per butir)
// ============================================================
// ⚠️ PERUBAHAN ARSITEKTUR PENTING (Agustus 2026): versi sebelumnya
// meminta AI membaca SATU HALAMAN PENUH dan mentranskripsi ulang
// SEMUA soal di halaman itu sekaligus jadi teks. Itu ternyata jadi
// sumber DUA masalah sekaligus:
//   1. Respons AI kepotong di tengah pada halaman padat (banyak soal
//      + LaTeX + pembahasan) karena keluaran yang diminta terlalu
//      besar untuk satu kali panggilan.
//   2. AI kadang salah membaca notasi matematika yang rumit --
//      padahal untuk Bank Soal, soal yang tersimpan harus SETIA
//      pada aslinya.
//
// Sekarang: PEMOTONGAN SOAL PER BUTIR dilakukan di BROWSER TANPA AI
// SAMA SEKALI -- deteksi nomor soal dari posisi teks PDF asli (lihat
// detectQuestionStarts di BankSoalImport.jsx, logikanya diporting
// PERSIS dari SmartImportPanel.jsx yang sudah lama terbukti jalan di
// project ini). Yang tersimpan sebagai qImage adalah CROP PIKSEL
// PERSIS dari halaman asli -- tidak pernah "dibaca ulang" jadi teks,
// jadi tidak mungkin salah transkripsi.
//
// AI HANYA dipanggil untuk SATU tugas kecil per butir: melihat crop
// gambar itu dan menjawab "yang mana jawaban benar, dan kenapa" --
// bukan menyalin ulang soalnya. Karena keluarannya kecil (satu objek
// JSON pendek per panggilan, bukan banyak soal dibungkus jadi satu),
// risiko kepotong di tengah jadi sangat kecil.
async function callGroqAnswerQuestion(imageDataUrls, modelName = GROQ_MODEL) {
  const imageContents = imageDataUrls.map((dataUrl) => ({
    type: 'image_url',
    image_url: { url: dataUrl },
  })).filter((part) => part.image_url?.url);

  if (imageContents.length === 0) {
    throw new Error('Tidak ada gambar soal yang valid untuk dianalisis.');
  }

  const hasImageOptions = imageDataUrls.length > 1;
  const systemPrompt = `Kamu adalah pemeriksa jawaban soal ujian untuk Bank Soal Bimbel Gemilang.

TUGAS:
Lihat gambar soal yang diberikan (crop asli dari buku cetak), lalu tentukan JAWABAN YANG BENAR dan tulis pembahasan singkat.

INI BUKAN TUGAS MENYALIN SOAL. Jangan menuliskan ulang soal atau opsi. Tugasmu hanya menentukan jawaban benar dan pembahasan.

${hasImageOptions
  ? 'Gambar pertama adalah soal utama. Gambar-gambar berikutnya adalah pilihan jawaban A, B, C, ... secara berurutan.'
  : 'Gambar berisi soal dan seluruh pilihan jawabannya. Baca label A/B/C/D/E untuk menentukan jumlah opsi.'}

Kalau ragu, pilih jawaban paling mungkin dan tandai readingConfidence sebagai low.

PEMBAHASAN: 2-4 kalimat, langsung ke inti langkah pengerjaan.

OUTPUT HARUS JSON SAJA dengan format:
{"optionCount":4,"correct":0,"explanation":"...","readingConfidence":"high"}

correct adalah indeks opsi: A=0, B=1, C=2, D=3, E=4.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              ...imageContents,
              { type: 'text', text: 'Tentukan jawaban yang benar dan pembahasan. Hanya JSON.' },
            ],
          },
        ],
        temperature: 0.1,
        max_completion_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GROQ_HTTP_${response.status}: ${errText}`);
    }
    return response.json();
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
// 🔥 BARU: JAWAB SATU SOAL (crop gambar) DENGAN FALLBACK MODEL
// ============================================================
async function answerQuestionFromImages(imageDataUrls) {
  let lastErr;
  for (const modelName of [GROQ_MODEL]) {
    try {
      const data = await callGroqAnswerQuestion(imageDataUrls, modelName);

      const rawText =
        data.choices?.[0]?.message?.content ||
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        '{}';

      const cleaned = rawText.replace(/```json|```/g, '').trim();

      try {
        const parsed = JSON.parse(cleaned);
        return {
          optionCount: Number.isInteger(parsed.optionCount) ? parsed.optionCount : 4,
          correct: Number.isInteger(parsed.correct) ? parsed.correct : 0,
          explanation: typeof parsed.explanation === 'string' ? parsed.explanation.trim() : '',
          readingConfidence: parsed.readingConfidence === 'low' ? 'low' : 'high',
        };
      } catch (e) {
        // Keluaran yang diminta di sini sengaja KECIL (lihat komentar
        // di atas maxOutputTokens), jadi kegagalan parse di sini
        // BUKAN soal kehabisan token seperti mode lama -- kemungkinan
        // besar AI menambahkan teks di luar JSON. Coba tarik JSON
        // pertama yang valid di dalam teksnya sebagai upaya terakhir.
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            const parsed = JSON.parse(match[0]);
            return {
              optionCount: Number.isInteger(parsed.optionCount) ? parsed.optionCount : 4,
              correct: Number.isInteger(parsed.correct) ? parsed.correct : 0,
              explanation: typeof parsed.explanation === 'string' ? parsed.explanation.trim() : '',
              readingConfidence: 'low',
            };
          } catch (e2) {
            // lanjut ke model berikutnya
          }
        }
      }
    } catch (e) {
      lastErr = e;
      console.error(`smartParseQuiz (answer) gagal memakai Groq model ${modelName}:`, e.message);
    }
  }

  // 🔥 PENTING: kalau AI benar-benar gagal total, JANGAN membuang
  // soalnya (beda dari mode lama) -- soal tetap dikirim ke admin
  // dengan jawaban placeholder yang WAJIB diisi manual. Kehilangan
  // gambar soal yang sudah berhasil di-crop hanya karena AI-nya
  // gagal itu pemborosan -- crop soalnya sendiri valid dan berharga.
  console.error('Semua model gagal menjawab soal ini:', lastErr?.message);
  return {
    optionCount: 4,
    correct: 0,
    explanation: '',
    readingConfidence: 'low',
    needsManualAnswer: true,
  };
}

// ============================================================
// 🔥 BARU: HANDLER MODE JAWAB SOAL
// ============================================================
async function handleAnswerQuestionMode(req, res) {
  const { questionImage, optionImages } = req.body;

  if (!questionImage || typeof questionImage !== 'string') {
    return res.status(400).json({ success: false, error: 'questionImage kosong atau tidak valid.' });
  }

  const imageList = [
    questionImage,
    ...(Array.isArray(optionImages) ? optionImages.filter((s) => typeof s === 'string') : []),
  ];

  try {
    const result = await answerQuestionFromImages(imageList);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('smartParseQuiz (answer) error:', err);
    return res.status(502).json({
      success: false,
      error: err.message || 'Gagal menganalisis soal ini.',
    });
  }
}

// ============================================================
// 🔥 BARU: PEMANGGIL GEMINI -- TRANSKRIP SATU SOAL (mode impor Bank
// Soal)
// ============================================================
// BEDA dari handleAnswerQuestionMode di atas (yang tugasnya cuma
// menjawab+membahas SATU soal buat dipakai NANTI saat guru menyusun
// kuis) -- mode ini tugasnya MENULIS ULANG soal jadi teks yang bisa
// diedit (bukan cuma gambar mentah), dipanggil SAAT ADMIN MENGIMPOR
// PDF ke Bank Soal.
//
// Kenapa dua mode terpisah dan bukan digabung jadi satu:
// - Transkripsi (di sini) perlu dipanggil SEKALI per soal saat impor.
// - Menjawab+membahas (di atas) baru perlu dipanggil BELAKANGAN,
//   hanya untuk soal yang benar-benar dipakai guru di sebuah kuis --
//   supaya tidak boros memanggil AI untuk semua soal di Bank Soal
//   yang belum tentu semuanya terpakai.
//
// SENGAJA HANYA SATU SOAL PER PANGGILAN (bukan satu halaman berisi
// banyak soal seperti desain pertama yang gagal) -- ini yang
// menghindarkan masalah respons kepotong di tengah jalan yang pernah
// terjadi sebelumnya.
async function callGroqTranscribeQuestion(imageDataUrl, modelName = GROQ_MODEL) {
  if (!/^data:[^;]+;base64,.+$/.test(imageDataUrl || '')) {
    throw new Error('Format gambar soal tidak valid (bukan data URL base64).');
  }

  const systemPrompt = `Kamu adalah pembaca soal ujian untuk Bank Soal Bimbel Gemilang.

TUGAS:
Lihat gambar SATU SOAL dan tulis ulang menjadi teks terstruktur yang bisa diedit, lalu klasifikasikan tipe soalnya.

WAJIB SETIA APA ADANYA:
Salin persis teks soal dan pilihan jawabannya. Jangan mengubah angka, konteks, atau isi. Jika ada bagian yang benar-benar tidak terbaca, jangan mengarang dan tandai readingConfidence=low.

RUMUS MATEMATIKA:
Gunakan LaTeX dibungkus \( \), misalnya \(x^2+3x-4=0\), \frac{a}{b}, \sqrt{x+1}.

VEKTOR/MATRIKS:
Pertahankan bentuk vertikal dengan LaTeX matrix/pmatrix, misalnya \(\begin{pmatrix}p\\2\\-1\end{pmatrix}\).

TIPE SOAL:
- pilihan_ganda
- pernyataan_kompleks
- hubungan_kuantitas
- isian_singkat

GAMBAR/DIAGRAM/GRAFIK/TABEL:
Kalau ada bagian visual yang menjadi bagian soal, hasFigure=true dan figureBBox berisi kotak area visual dalam koordinat 0..1 relatif terhadap gambar crop. Jika tidak ada, hasFigure=false dan figureBBox=null.

JANGAN menentukan jawaban benar dan jangan membuat pembahasan.

OUTPUT JSON SAJA:
{"question":"...","options":["..."],"tipeSoal":"pilihan_ganda","kuantitasP":"","kuantitasQ":"","hasFigure":false,"figureBBox":null,"readingConfidence":"high"}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: imageDataUrl } },
              { type: 'text', text: 'Transkripsikan dan klasifikasikan soal ini sesuai instruksi. Hanya JSON.' },
            ],
          },
        ],
        temperature: 0.1,
        max_completion_tokens: 2048,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GROQ_HTTP_${response.status}: ${errText}`);
    }
    return response.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`GROQ_TIMEOUT setelah ${GROQ_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// 🔥 Bentuk hasil parse dipakai bersama oleh jalur sukses & jalur
// pemulihan darurat di bawah -- satu tempat, tidak diduplikasi.
function normalizeTranscribeResult(parsed, fallbackConfidence) {
  const tipeSoal = [
    'pilihan_ganda',
    'pernyataan_kompleks',
    'hubungan_kuantitas',
    'isian_singkat',
  ].includes(parsed.tipeSoal)
    ? parsed.tipeSoal
    : 'pilihan_ganda';

  return {
    question: typeof parsed.question === 'string' ? parsed.question.trim() : '',
    options: Array.isArray(parsed.options)
      ? parsed.options.map((o) => String(o ?? '').trim()).filter(Boolean)
      : [],
    tipeSoal,
    kuantitasP: typeof parsed.kuantitasP === 'string' ? parsed.kuantitasP.trim() : '',
    kuantitasQ: typeof parsed.kuantitasQ === 'string' ? parsed.kuantitasQ.trim() : '',
    hasFigure: Boolean(parsed.hasFigure),
    figureBBox:
      parsed.hasFigure && parsed.figureBBox && typeof parsed.figureBBox === 'object'
        ? parsed.figureBBox
        : null,
    readingConfidence:
      fallbackConfidence || (parsed.readingConfidence === 'low' ? 'low' : 'high'),
  };
}

async function transcribeQuestionImage(imageDataUrl) {
  let lastErr;
  for (const modelName of [GROQ_MODEL]) {
    try {
      const data = await callGroqTranscribeQuestion(imageDataUrl, modelName);

      const rawText =
        data.choices?.[0]?.message?.content ||
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        '{}';

      // 🔥 Dengan responseSchema aktif, Gemini SEHARUSNYA selalu
      // membalas JSON valid sesuai bentuk yang diminta -- parsing di
      // sini jauh lebih sederhana dari sebelumnya. Fallback pencarian
      // JSON manual tetap dijaga sebagai jaring pengaman terakhir
      // untuk kasus tak terduga (mis. proxy/model yang tidak sepenuhnya
      // menghormati responseSchema).
      try {
        const parsed = JSON.parse(rawText.trim());
        return normalizeTranscribeResult(parsed);
      } catch (e) {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            const parsed = JSON.parse(match[0]);
            return normalizeTranscribeResult(parsed, 'low');
          } catch (e2) {
            // lanjut ke model berikutnya
          }
        }
      }
    } catch (e) {
      lastErr = e;
      console.error(`smartParseQuiz (transcribe) gagal memakai Groq model ${modelName}:`, e.message);
    }
  }

  console.error('Semua model gagal mentranskripsi soal ini:', lastErr?.message);
  throw lastErr || new Error('Groq gagal membaca soal ini.');
}

async function handleTranscribeQuestionMode(req, res) {
  const { questionCropImage } = req.body;

  if (!questionCropImage || typeof questionCropImage !== 'string') {
    return res.status(400).json({ success: false, error: 'questionCropImage kosong atau tidak valid.' });
  }

  try {
    const result = await transcribeQuestionImage(questionCropImage);

    if (!result.question) {
      return res.status(502).json({
        success: false,
        error: 'AI tidak berhasil membaca teks soal dari gambar ini.',
      });
    }

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('smartParseQuiz (transcribe) error:', err);
    return res.status(502).json({
      success: false,
      error: err.message || 'Gagal mentranskripsi soal ini.',
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

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({ success: false, error: 'GROQ_API_KEY belum di-setting di Vercel' });
  }

  // 🔥 cabang mode transkripsi -- dipakai BankSoalImport.jsx saat
  // mengimpor PDF (menulis ulang soal jadi teks, TANPA menjawab).
  // Dipilih lewat field `questionCropImage` (beda nama dari
  // `questionImage` di bawah supaya kedua mode tidak pernah tertukar).
  if (req.body && req.body.questionCropImage) {
    return handleTranscribeQuestionMode(req, res);
  }

  // 🔥 cabang mode jawab-soal -- dipilih HANYA lewat keberadaan field
  // `questionImage`, supaya pemanggil lama (yang selalu mengirim
  // `text`) tidak sedikit pun terpengaruh oleh penambahan ini.
  if (req.body && req.body.questionImage) {
    return handleAnswerQuestionMode(req, res);
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