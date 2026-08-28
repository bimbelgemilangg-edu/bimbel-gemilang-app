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
const GEMINI_TIMEOUT_MS = 50_000;

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
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
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
async function callGemini(systemPrompt, userText, modelName) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
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
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GEMINI_HTTP_${response.status}: ${errText}`);
    }
    return response.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`GEMINI_TIMEOUT setelah ${GEMINI_TIMEOUT_MS}ms`);
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
async function callGeminiAnswerQuestion(imageDataUrls, modelName) {
  // imageDataUrls: array data URL -- elemen pertama SELALU crop soal
  // utama (berisi teks soal + label opsi A/B/C/D/E kalau opsinya
  // teks). Elemen berikutnya (kalau ada) adalah crop opsi BERGAMBAR,
  // diurutkan A, B, C, ... -- dipakai kalau soal jenis "pilih gambar
  // yang benar" (opsi berupa gambar, bukan teks).
  const imageParts = imageDataUrls
    .map((dataUrl) => {
      const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
      if (!match) return null;
      const [, mimeType, base64Data] = match;
      return { inline_data: { mime_type: mimeType, data: base64Data } };
    })
    .filter(Boolean);

  if (imageParts.length === 0) {
    throw new Error('Tidak ada gambar soal yang valid untuk dianalisis.');
  }

  const hasImageOptions = imageDataUrls.length > 1;

  const systemPrompt = `Kamu adalah pemeriksa jawaban soal ujian untuk Bank Soal Bimbel Gemilang.

TUGAS:
Lihat gambar soal yang diberikan (crop asli dari buku cetak), lalu tentukan JAWABAN YANG BENAR dan tulis pembahasan singkat.

⚠️ PENTING -- INI BUKAN TUGAS MENYALIN SOAL:
Kamu TIDAK PERLU dan TIDAK BOLEH menuliskan ulang teks soal atau pilihan jawabannya. Soal itu SUDAH tersimpan persis sebagai gambar. Tugasmu HANYA: hitung/nalar jawaban yang benar, lalu jelaskan singkat.

${
  hasImageOptions
    ? 'Gambar PERTAMA adalah soal utama. Gambar-gambar SETELAHNYA adalah pilihan jawaban A, B, C, ... secara berurutan (masing-masing satu gambar terpisah) -- tentukan pilihan gambar MANA yang benar.'
    : 'Gambar yang diberikan berisi soal DAN seluruh pilihan jawabannya (A, B, C, D, mungkin E) dalam satu gambar yang sama -- baca label hurufnya dari gambar itu untuk tahu ada berapa opsi.'
}

MENENTUKAN JAWABAN:
Buku cetak biasanya tidak menandai kunci di halaman soal. Hitung/nalar sendiri berdasarkan pengetahuan akademik, seperti mengerjakan soal itu sendiri. Kalau ragu atau tidak yakin, tetap isi jawaban paling mungkin dan tandai readingConfidence:"low" -- JANGAN dikosongkan.

PEMBAHASAN:
2-4 kalimat saja, langsung ke inti langkah pengerjaan. Jangan menjelaskan konsep dasar dari nol.

FORMAT OUTPUT -- HANYA JSON, TANPA MARKDOWN, TANPA PENJELASAN LAIN:
{"optionCount": 4, "correct": 0, "explanation": "...", "readingConfidence": "high"}

"correct" wajib angka indeks (0 untuk opsi A), BUKAN huruf.
"optionCount" wajib angka -- berapa banyak pilihan jawaban yang terlihat (biasanya 4 atau 5).
"readingConfidence" wajib "high" atau "low".`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
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
              ...imageParts,
              {
                text: 'Tentukan jawaban yang benar dan tulis pembahasan singkat sesuai instruksi. Hanya JSON.',
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          // 🔥 Kecil dengan sengaja: keluaran yang diminta cuma satu
          // objek pendek (optionCount, correct, explanation singkat,
          // readingConfidence) -- BUKAN transkripsi soal penuh. Jatah
          // sebesar ini sudah lebih dari cukup, dan justru membantu
          // membatasi AI supaya tidak melebar menjelaskan panjang-
          // panjang.
          maxOutputTokens: 1024,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GEMINI_HTTP_${response.status}: ${errText}`);
    }
    return response.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`GEMINI_TIMEOUT setelah ${GEMINI_TIMEOUT_MS}ms`);
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
  for (const modelName of GEMINI_MODELS) {
    try {
      const data = await callGeminiAnswerQuestion(imageDataUrls, modelName);

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
      console.error(`smartParseQuiz (answer) gagal pakai model ${modelName}:`, e.message);
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
async function callGeminiTranscribeQuestion(imageDataUrl, modelName) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(imageDataUrl || '');

  if (!match) {
    throw new Error('Format gambar soal tidak valid (bukan data URL base64).');
  }

  const [, mimeType, base64Data] = match;

  // 🔥 BARU: dukungan 4 TIPE SOAL, diadopsi dari prototipe HTML mandiri
  // yang sudah diuji pemilik bimbel dan berhasil (dibangun di Google AI
  // Studio, memakai skema klasifikasi soal SNBT/UTBK yang lebih kaya
  // daripada yang kita punya sebelumnya, yang cuma tahu "pilihan
  // ganda"). Empat tipe:
  //   - pilihan_ganda: soal standar dengan opsi A-E.
  //   - pernyataan_kompleks: berisi pernyataan bernomor (1)(2)(3)(4)
  //     di badan soal, opsi jawabannya berupa KOMBINASI pernyataan
  //     mana yang benar (mis. "(1), (2), dan (3) SAJA").
  //   - hubungan_kuantitas: soal membandingkan Kuantitas P vs Kuantitas
  //     Q (format baku SNBT), opsi jawabannya standar (P>Q, P<Q, dst).
  //   - isian_singkat: tanpa pilihan ganda, jawabannya berupa nilai
  //     yang diminta langsung.
  const systemPrompt = `Kamu adalah pembaca soal ujian untuk Bank Soal Bimbel Gemilang.

TUGAS:
Lihat gambar SATU SOAL (potongan/crop dari halaman buku cetak), lalu tulis ulang jadi teks terstruktur yang bisa diedit, DAN klasifikasikan tipe soalnya.

⚠️ WAJIB SETIA APA ADANYA:
Salin persis teks soal dan pilihan jawabannya seperti tertulis di gambar. JANGAN mengubah angka, JANGAN mengganti konteks, JANGAN "memperbaiki" kalimat. Ini untuk arsip Bank Soal -- yang dibutuhkan SALINAN SETIA, bukan versi kreatif.

Kalau ada bagian yang benar-benar tidak terbaca (buram/terpotong), tulis bagian yang terbaca apa adanya dan tandai readingConfidence:"low" -- JANGAN MENGARANG isi yang tidak terbaca.

RUMUS MATEMATIKA:
Tulis dengan LaTeX dibungkus \\( \\), contoh: \\(x^2 + 3x - 4 = 0\\), \\(\\frac{a}{b}\\), \\(\\sqrt{x+1}\\).

VEKTOR & MATRIKS (PENTING -- sering muncul di soal cetak sebagai angka yang DITUMPUK VERTIKAL dalam tanda kurung):
Tulis TETAP sebagai LaTeX matriks kolom, JANGAN diringkas jadi baris horizontal biasa (itu mengubah makna matematisnya). Gunakan \\(\\begin{pmatrix} ... \\end{pmatrix}\\) dengan \\\\ untuk pemisah antar baris.
Contoh: vektor yang tercetak sebagai tiga angka p, 2, -1 bertumpuk ke bawah dalam satu kurung ditulis: \\(\\begin{pmatrix} p \\\\ 2 \\\\ -1 \\end{pmatrix}\\).
Ini KHUSUS berlaku untuk vektor/matriks -- JANGAN dipakai untuk hal lain.

KLASIFIKASI TIPE SOAL (field "tipeSoal") -- pilih SATU yang paling sesuai:
- "pilihan_ganda": soal standar dengan pilihan (A) (B) (C) (D) (E) yang masing-masing berdiri sendiri.
- "pernyataan_kompleks": badan soal berisi PERNYATAAN BERNOMOR (1) (2) (3) (4), dan pilihan jawabannya adalah KOMBINASI pernyataan mana yang benar (mis. opsi berbunyi "(1), (2), dan (3) SAJA yang benar"). Tulis SELURUH pernyataan bernomor itu apa adanya di dalam "question".
- "hubungan_kuantitas": soal membandingkan Kuantitas P dengan Kuantitas Q (format baku SNBT). Isi field "kuantitasP" dan "kuantitasQ" dengan nilai/rumus masing-masing SEPERSIS yang tertulis. Opsi jawabannya tetap diisi di "options" seperti biasa (mis. "P lebih besar dari Q", dst -- SALIN PERSIS teks opsinya, jangan diringkas jadi simbol >/<).
- "isian_singkat": soal TANPA pilihan ganda sama sekali, menanyakan sebuah nilai langsung. "options" dikosongkan (array kosong).

GAMBAR/DIAGRAM/GRAFIK/TABEL DI DALAM SOAL:
Kalau gambar crop ini MEMUAT diagram, grafik, foto, atau tabel yang jadi BAGIAN dari soal (bukan cuma nomor/hiasan), tandai hasFigure:true dan berikan figureBBox: kotak area gambar itu SAJA dalam koordinat ternormalisasi 0 sampai 1 RELATIF TERHADAP GAMBAR CROP INI (bukan halaman penuh), (x,y) pojok kiri-atas. Kalau soal ini MURNI TEKS tanpa gambar/diagram, set hasFigure:false.

⚠️ JANGAN TENTUKAN JAWABAN BENAR, JANGAN TULIS PEMBAHASAN -- itu BUKAN tugasmu di sini. Cukup transkripsi & klasifikasi saja.

"options" isi SEBANYAK pilihan jawaban yang benar-benar terlihat di gambar (biasanya 4 atau 5) -- JANGAN dipaksakan selalu 4 kalau yang tertulis 5. Kosongkan array ini untuk tipe "isian_singkat".`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
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
                text: 'Transkripsikan & klasifikasikan soal ini sesuai instruksi.',
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          // 🔥 BARU: diadopsi dari prototipe HTML mandiri yang terbukti
          // berhasil -- responseMimeType + responseSchema memaksa
          // Gemini mengembalikan JSON yang SUDAH DIJAMIN sesuai bentuk
          // skema ini secara native, bukan berharap model menulis JSON
          // bersih lalu kita ekstrak pakai regex/pencocokan kurung
          // kurawal sebagai jaring pengaman. Jauh lebih andal, terutama
          // untuk field bertipe (figureBBox, enum tipeSoal) yang
          // sebelumnya rawan salah bentuk.
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              question: { type: 'STRING' },
              options: {
                type: 'ARRAY',
                items: { type: 'STRING' },
              },
              tipeSoal: {
                type: 'STRING',
                enum: [
                  'pilihan_ganda',
                  'pernyataan_kompleks',
                  'hubungan_kuantitas',
                  'isian_singkat',
                ],
              },
              kuantitasP: { type: 'STRING' },
              kuantitasQ: { type: 'STRING' },
              hasFigure: { type: 'BOOLEAN' },
              figureBBox: {
                type: 'OBJECT',
                properties: {
                  x: { type: 'NUMBER' },
                  y: { type: 'NUMBER' },
                  width: { type: 'NUMBER' },
                  height: { type: 'NUMBER' },
                },
              },
              readingConfidence: {
                type: 'STRING',
                enum: ['high', 'low'],
              },
            },
            required: ['question', 'tipeSoal', 'hasFigure', 'readingConfidence'],
          },
          // 🔥 SATU soal saja per panggilan (bukan satu halaman berisi
          // banyak soal) -- keluaran yang diminta kecil, jadi jatah ini
          // sudah lebih dari cukup dan risiko kepotong di tengah sangat
          // kecil (beda dari desain awal yang gagal di halaman padat).
          maxOutputTokens: 2048,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GEMINI_HTTP_${response.status}: ${errText}`);
    }
    return response.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`GEMINI_TIMEOUT setelah ${GEMINI_TIMEOUT_MS}ms`);
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
  for (const modelName of GEMINI_MODELS) {
    try {
      const data = await callGeminiTranscribeQuestion(imageDataUrl, modelName);

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
      console.error(`smartParseQuiz (transcribe) gagal pakai model ${modelName}:`, e.message);
    }
  }

  console.error('Semua model gagal mentranskripsi soal ini:', lastErr?.message);
  throw lastErr || new Error('Semua model Gemini gagal membaca soal ini.');
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



// ============================================================
// AI-FIRST: DETEKSI SOAL DARI SATU GAMBAR HALAMAN
// ============================================================
// Menerima:
//   { mode: "detectPage", pageImage: "data:image/...;base64,..." }
//
// Mengembalikan bbox ternormalisasi 0..1 untuk setiap butir soal.
// Mode ini sengaja tetap berada di smartParseQuiz.js agar tidak menambah
// jumlah Serverless Function di Vercel.
// ============================================================

function normalizePageDetection(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const rawItems = Array.isArray(source.questions)
    ? source.questions
    : Array.isArray(source.items)
      ? source.items
      : [];

  const questions = rawItems
    .map((item, index) => {
      const bbox = item?.bbox || item?.boundingBox || item?.crop || null;
      if (!bbox || typeof bbox !== 'object') return null;

      const x = Math.max(0, Math.min(1, Number(bbox.x) || 0));
      const y = Math.max(0, Math.min(1, Number(bbox.y) || 0));
      const width = Math.max(
        0,
        Math.min(1 - x, Number(bbox.width) || 0),
      );
      const height = Math.max(
        0,
        Math.min(1 - y, Number(bbox.height) || 0),
      );

      if (width < 0.02 || height < 0.02) return null;

      const numberValue = Number(
        item?.printedNumber ?? item?.number ?? index + 1,
      );

      return {
        printedNumber: Number.isFinite(numberValue)
          ? Math.trunc(numberValue)
          : index + 1,
        bbox: { x, y, width, height },
      };
    })
    .filter(Boolean);

  // Deduplicate by printed number + approximate bbox.
  const seen = new Set();
  const deduped = [];

  for (const q of questions) {
    const key = [
      q.printedNumber,
      q.bbox.x.toFixed(3),
      q.bbox.y.toFixed(3),
      q.bbox.width.toFixed(3),
      q.bbox.height.toFixed(3),
    ].join(':');

    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(q);
  }

  // Urutan baca: atas ke bawah, lalu kiri ke kanan.
  deduped.sort((a, b) => {
    const yDiff = a.bbox.y - b.bbox.y;
    if (Math.abs(yDiff) > 0.025) return yDiff;
    return a.bbox.x - b.bbox.x;
  });

  return {
    isPembahasanPage: Boolean(source.isPembahasanPage),
    questions: deduped,
  };
}

async function callGeminiDetectPage(pageImageDataUrl, modelName) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(pageImageDataUrl || '');

  if (!match) {
    throw new Error('Format gambar halaman tidak valid (bukan data URL base64).');
  }

  const [, mimeType, base64Data] = match;

  const systemPrompt = `Kamu adalah AI vision untuk memisahkan halaman buku ujian menjadi butir soal.

TUGAS:
1. Lihat SATU halaman penuh yang diberikan.
2. Tentukan apakah halaman ini adalah halaman SOAL, halaman PEMBAHASAN/KUNCI, atau halaman lain seperti sampul/kisi-kisi.
3. Kalau halaman berisi soal, temukan SETIAP BUTIR SOAL yang lengkap dan berurutan.
4. Untuk setiap butir, berikan nomor yang TERLIHAT pada halaman dan bounding box yang mencakup SELURUH butir: nomor soal, teks soal, tabel/rumus, gambar/diagram/grafik, serta semua pilihan jawaban yang menjadi bagian butir tersebut.
5. Jangan membuat butir baru dari judul, nomor halaman, header, footer, atau keterangan umum.
6. Jangan memotong satu butir menjadi beberapa bagian.
7. Kalau satu soal berlanjut ke halaman berikutnya, JANGAN menganggap potongan yang hanya berisi lanjutan sebagai soal baru.
8. Halaman PEMBAHASAN/KUNCI harus diberi isPembahasanPage=true dan questions=[].
9. Halaman sampul, kisi-kisi, petunjuk, atau halaman lain tanpa butir soal juga questions=[].
10. Koordinat bbox NORMALIZED 0 sampai 1 terhadap gambar halaman, dengan (x,y) sebagai pojok kiri atas.

ATURAN KHUSUS:
- Pertahankan dua kolom. Jangan menggabungkan soal dari kolom kiri dan kanan menjadi satu.
- Soal yang mempunyai grafik, tabel, diagram, foto, matriks, pecahan, atau simbol matematika tetap dianggap SATU butir.
- Jangan mencoba menyalin isi soal. HANYA deteksi nomor + bbox.
- Lebih baik mengembalikan lebih sedikit bbox yang benar-benar lengkap daripada bbox yang memotong soal atau mencampur dua soal.
`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

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
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
              {
                text:
                  'Deteksi semua butir soal pada halaman ini. Hanya kembalikan JSON sesuai schema.',
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.05,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              isPembahasanPage: { type: 'BOOLEAN' },
              questions: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    printedNumber: { type: 'INTEGER' },
                    bbox: {
                      type: 'OBJECT',
                      properties: {
                        x: { type: 'NUMBER' },
                        y: { type: 'NUMBER' },
                        width: { type: 'NUMBER' },
                        height: { type: 'NUMBER' },
                      },
                      required: ['x', 'y', 'width', 'height'],
                    },
                  },
                  required: ['printedNumber', 'bbox'],
                },
              },
            },
            required: ['isPembahasanPage', 'questions'],
          },
          maxOutputTokens: 2048,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GEMINI_HTTP_${response.status}: ${errText}`);
    }

    return response.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`GEMINI_TIMEOUT setelah ${GEMINI_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}


// ============================================================
// AI-FIRST v3: TRANSKRIP SATU HALAMAN SEKALIGUS
// ============================================================
// Ini menggantikan pola "deteksi halaman -> transkripsi per soal" yang
// menghabiskan request terlalu banyak. Satu panggilan AI untuk satu halaman
// langsung menghasilkan SEMUA soal lengkap pada halaman tersebut.
// Frontend hanya mengirim halaman yang secara lokal terindikasi sebagai
// halaman soal, sehingga halaman sampul/kisi-kisi/pembahasan tidak memakan
// quota AI.
// ============================================================

function normalizeBBox(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const x = Math.max(0, Math.min(1, Number(raw.x) || 0));
  const y = Math.max(0, Math.min(1, Number(raw.y) || 0));
  const width = Math.max(0, Math.min(1 - x, Number(raw.width) || 0));
  const height = Math.max(0, Math.min(1 - y, Number(raw.height) || 0));
  if (width < 0.01 || height < 0.01) return null;
  return { x, y, width, height };
}

function normalizePageTranscription(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const rawQuestions = Array.isArray(source.questions) ? source.questions : [];

  const questions = rawQuestions.map((q, index) => {
    const bbox = normalizeBBox(q?.bbox || q?.boundingBox || q?.crop);
    if (!bbox) return null;

    const figureBBox = q?.hasFigure ? normalizeBBox(q.figureBBox) : null;
    const optionImageBBoxes = Array.isArray(q?.optionImageBBoxes)
      ? q.optionImageBBoxes.map(normalizeBBox).filter(Boolean)
      : [];

    const numberValue = Number(q?.printedNumber ?? q?.number ?? index + 1);
    const tipeSoal = [
      'pilihan_ganda',
      'pernyataan_kompleks',
      'hubungan_kuantitas',
      'isian_singkat',
    ].includes(q?.tipeSoal)
      ? q.tipeSoal
      : 'pilihan_ganda';

    return {
      printedNumber: Number.isFinite(numberValue) ? Math.trunc(numberValue) : index + 1,
      bbox,
      question: typeof q?.question === 'string' ? q.question.trim() : '',
      options: Array.isArray(q?.options)
        ? q.options.map((x) => String(x ?? '').trim()).filter(Boolean)
        : [],
      tipeSoal,
      kuantitasP: typeof q?.kuantitasP === 'string' ? q.kuantitasP.trim() : '',
      kuantitasQ: typeof q?.kuantitasQ === 'string' ? q.kuantitasQ.trim() : '',
      hasFigure: Boolean(q?.hasFigure && figureBBox),
      figureBBox,
      optionsAreImages: Boolean(q?.optionsAreImages || optionImageBBoxes.length >= 2),
      optionImageBBoxes,
      readingConfidence: q?.readingConfidence === 'low' ? 'low' : 'high',
    };
  }).filter(Boolean);

  // Urutan baca natural: atas-ke-bawah; jika hampir sejajar, kiri-ke-kanan.
  questions.sort((a, b) => {
    const dy = a.bbox.y - b.bbox.y;
    if (Math.abs(dy) > 0.03) return dy;
    return a.bbox.x - b.bbox.x;
  });

  // Hindari nomor yang sama terdeteksi dua kali.
  const seen = new Set();
  const deduped = questions.filter((q) => {
    const key = `${q.printedNumber}:${q.bbox.x.toFixed(3)}:${q.bbox.y.toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    pageType: source.pageType === 'pembahasan'
      ? 'pembahasan'
      : source.pageType === 'other'
        ? 'other'
        : 'questions',
    questions: deduped,
  };
}

async function callGeminiTranscribePage(pageImageDataUrl, modelName) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(pageImageDataUrl || '');
  if (!match) throw new Error('Format gambar halaman tidak valid.');

  const [, mimeType, base64Data] = match;

  const systemPrompt = `Kamu adalah AI vision untuk mengimpor soal ujian ke Bank Soal Bimbel Gemilang.

TUGAS UTAMA:
Lihat SATU HALAMAN buku/lembar ujian. Bila halaman berisi soal, ekstrak SEMUA BUTIR SOAL yang lengkap pada halaman ini menjadi data terstruktur yang bisa diedit admin.

ATURAN KERAS:
1. Jangan membuat soal dari judul, nomor halaman, header, footer, kisi-kisi, atau pembahasan.
2. Jangan menghilangkan soal hanya karena ada gambar, grafik, tabel, pecahan, matriks, atau tata letak dua kolom.
3. Pertahankan urutan baca dua kolom: kolom kiri dari atas ke bawah, lalu kolom kanan dari atas ke bawah.
4. Setiap bbox WAJIB mencakup SELURUH butir: nomor, pertanyaan, gambar/diagram/tabel, dan semua opsi.
5. Koordinat bbox memakai nilai 0..1 relatif terhadap SELURUH gambar halaman, (x,y) dari kiri-atas.
6. Salin teks SETIA pada sumber. Jangan memperbaiki isi, angka, satuan, atau konteks.
7. Rumus/pecahan/akar/matriks ditulis sebagai LaTeX di dalam \\( ... \\). Untuk vektor/matriks vertikal, pertahankan sebagai pmatrix.
8. Jika ada bagian yang benar-benar tidak terbaca, jangan mengarang. Tandai readingConfidence=low.
9. Jika halaman merupakan PEMBAHASAN/KUNCI, pageType harus pembahasan dan questions harus kosong.
10. Jika halaman bukan halaman soal, pageType other dan questions kosong.

TIPE SOAL:
- pilihan_ganda
- pernyataan_kompleks
- hubungan_kuantitas
- isian_singkat

GAMBAR:
- hasFigure=true bila butir memiliki diagram/grafik/tabel/foto/gambar yang menjadi bagian soal.
- figureBBox adalah kotak area gambar TERSEBUT relatif terhadap SELURUH halaman.
- Bila opsi jawaban berupa gambar, set optionsAreImages=true dan berikan optionImageBBoxes untuk gambar opsi A, B, C, D, E berurutan.

PENTING:
JANGAN menentukan jawaban benar dan JANGAN menulis pembahasan. Ini hanya impor/transkripsi.
`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{
          role: 'user',
          parts: [
            { inline_data: { mime_type: mimeType, data: base64Data } },
            { text: 'Ekstrak semua soal lengkap dari halaman ini. Hanya JSON sesuai schema.' },
          ],
        }],
        generationConfig: {
          temperature: 0.05,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              pageType: { type: 'STRING', enum: ['questions', 'pembahasan', 'other'] },
              questions: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    printedNumber: { type: 'INTEGER' },
                    bbox: {
                      type: 'OBJECT',
                      properties: {
                        x: { type: 'NUMBER' }, y: { type: 'NUMBER' },
                        width: { type: 'NUMBER' }, height: { type: 'NUMBER' },
                      },
                      required: ['x', 'y', 'width', 'height'],
                    },
                    question: { type: 'STRING' },
                    options: { type: 'ARRAY', items: { type: 'STRING' } },
                    tipeSoal: { type: 'STRING', enum: ['pilihan_ganda', 'pernyataan_kompleks', 'hubungan_kuantitas', 'isian_singkat'] },
                    kuantitasP: { type: 'STRING' },
                    kuantitasQ: { type: 'STRING' },
                    hasFigure: { type: 'BOOLEAN' },
                    figureBBox: {
                      type: 'OBJECT',
                      properties: {
                        x: { type: 'NUMBER' }, y: { type: 'NUMBER' },
                        width: { type: 'NUMBER' }, height: { type: 'NUMBER' },
                      },
                    },
                    optionsAreImages: { type: 'BOOLEAN' },
                    optionImageBBoxes: {
                      type: 'ARRAY',
                      items: {
                        type: 'OBJECT',
                        properties: {
                          x: { type: 'NUMBER' }, y: { type: 'NUMBER' },
                          width: { type: 'NUMBER' }, height: { type: 'NUMBER' },
                        },
                        required: ['x', 'y', 'width', 'height'],
                      },
                    },
                    readingConfidence: { type: 'STRING', enum: ['high', 'low'] },
                  },
                  required: ['printedNumber', 'bbox', 'question', 'options', 'tipeSoal', 'hasFigure', 'readingConfidence'],
                },
              },
            },
            required: ['pageType', 'questions'],
          },
          maxOutputTokens: 8192,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GEMINI_HTTP_${response.status}: ${errText}`);
    }
    return response.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`GEMINI_TIMEOUT setelah ${GEMINI_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function transcribePageWithAI(pageImageDataUrl) {
  let lastErr;
  for (const modelName of GEMINI_MODELS) {
    try {
      const data = await callGeminiTranscribePage(pageImageDataUrl, modelName);
      const rawText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.choices?.[0]?.message?.content || '';
      const cleaned = String(rawText).replace(/```json|```/g, '').trim();
      try {
        return normalizePageTranscription(JSON.parse(cleaned));
      } catch {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) return normalizePageTranscription(JSON.parse(match[0]));
      }
      throw new Error('Respons AI transkripsi halaman bukan JSON yang valid.');
    } catch (e) {
      lastErr = e;
      console.error(`smartParseQuiz (transcribePage) gagal pakai ${modelName}:`, e.message);
    }
  }
  throw lastErr || new Error('Semua model Gemini gagal mentranskripsi halaman.');
}

async function handleTranscribePageMode(req, res) {
  const { pageImage } = req.body || {};
  if (!pageImage || typeof pageImage !== 'string') {
    return res.status(400).json({ success: false, error: 'pageImage kosong atau tidak valid.' });
  }
  if (pageImage.length > 8_500_000) {
    return res.status(413).json({ success: false, error: 'Gambar halaman terlalu besar.' });
  }
  try {
    const result = await transcribePageWithAI(pageImage);
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('smartParseQuiz (transcribePage) error:', err);
    return res.status(502).json({ success: false, error: err.message || 'Gagal membaca halaman.' });
  }
}

async function detectPageWithAI(pageImageDataUrl) {
  let lastErr;

  for (const modelName of GEMINI_MODELS) {
    try {
      const data = await callGeminiDetectPage(pageImageDataUrl, modelName);
      const rawText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.choices?.[0]?.message?.content ||
        '';

      const cleaned = String(rawText).replace(/```json|```/g, '').trim();

      try {
        return normalizePageDetection(JSON.parse(cleaned));
      } catch {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          return normalizePageDetection(JSON.parse(match[0]));
        }
      }

      throw new Error('Respons AI deteksi halaman bukan JSON yang valid.');
    } catch (e) {
      lastErr = e;
      console.error(
        `smartParseQuiz (detectPage) gagal pakai model ${modelName}:`,
        e.message,
      );
    }
  }

  throw lastErr || new Error('Semua model Gemini gagal mendeteksi halaman.');
}

async function handleDetectPageMode(req, res) {
  const { pageImage } = req.body || {};

  if (!pageImage || typeof pageImage !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'pageImage kosong atau tidak valid.',
    });
  }

  // Batas praktis supaya request gambar halaman tidak membebani endpoint.
  if (pageImage.length > 7_000_000) {
    return res.status(413).json({
      success: false,
      error:
        'Gambar halaman terlalu besar. Perkecil resolusi gambar sebelum dikirim ke AI.',
    });
  }

  try {
    const result = await detectPageWithAI(pageImage);

    return res.status(200).json({
      success: true,
      isPembahasanPage: result.isPembahasanPage,
      questions: result.questions,
    });
  } catch (err) {
    console.error('smartParseQuiz (detectPage) error:', err);
    return res.status(502).json({
      success: false,
      error: err.message || 'Gagal mendeteksi butir soal pada halaman.',
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

  if (req.body && req.body.mode === 'transcribePage') {
    return handleTranscribePageMode(req, res);
  }

  // Mode lama detectPage tetap dipertahankan untuk kompatibilitas.
  if (req.body && req.body.mode === 'detectPage') {
    return handleDetectPageMode(req, res);
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