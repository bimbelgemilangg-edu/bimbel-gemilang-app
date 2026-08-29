// ============================================================
// BIMBEL GEMILANG
// api/generateQuizFromTopic.js
// ============================================================
//
// ARSITEKTUR:
//
// FRONTEND
//    ↓
// /api/generateQuizFromTopic
//    ↓
// LOCAL BLUEPRINT ENGINE
//    ↓
// TAVILY WEB RESEARCH (maks. 1 pencarian teks / request)
//    ↓
// GOOGLE GEMINI API (endpoint kompatibel-OpenAI)
//    ↓
// JSONL PARSER
//    ↓
// LOCAL QUALITY GATE
//    ↓
// MANAGE QUIZ
//
// TAVILY dipakai untuk 2 hal yang terkendali:
//   1) mencari contoh soal/referensi di internet untuk ditulis ulang;
//   2) mencari foto objek nyata bila soal memang membutuhkan foto.
// Riset wajib bila generator berjalan: tanpa referensi yang lolos, generator berhenti aman.
//
// ⚠️ CATATAN:
// Pencarian referensi internet dilakukan oleh server lewat Tavily SEBELUM
// prompt dikirim ke Gemini. Gemini menerima hasil pencarian tersebut
// sebagai bahan referensi dan WAJIB menulis ulang soalnya, bukan menyalin.
// Kalau Tavily tidak tersedia/gagal/rate limit, generator TIDAK ERROR:
// sistem otomatis lanjut membuat soal tanpa riset web.
//
// ENV (WAJIB):
// GEMINI_API_KEY=... (buat GRATIS di https://aistudio.google.com/apikey
//   -- login pakai akun Google biasa, TANPA kartu kredit, key langsung
//   jadi dalam hitungan detik)
//
// ============================================================
// ⚠️ PENTING -- KENAPA PINDAH DARI NVIDIA KE GEMINI (Agustus 2026)
// ============================================================
//
// Fitur ini sempat MATI TOTAL berhari-hari di NVIDIA Build. Riwayat
// singkatnya, supaya keputusan ini tidak diulang mundur nanti:
//   - qwen/qwen2.5-72b-instruct         -> 404 (hilang dari katalog)
//   - meta/llama-4-maverick-17b-128e    -> 410 (EOL 27 Juli 2026)
//   - mistralai/mistral-medium-3-*      -> 404
//   - mistralai/mistral-small-3.x-*     -> 404
//   - mistralai/mistral-nemotron        -> timeout, lalu 404
//   - qwen/qwen2-7b-instruct            -> 404
//
// Ketika SEMUA model dari vendor yang berbeda-beda balas 404 dengan
// satu API key yang sama, itu bukan soal "salah pilih model" lagi.
// Itu pola khas akun NVIDIA yang belum diaktifkan izin "Public API
// Endpoints"-nya -- keluhan yang banyak muncul di forum developer
// NVIDIA, dan penyelesaiannya harus lewat tiket support mereka
// (bisa berhari-hari, tanpa kepastian). Bimbel tidak bisa menunggu
// selama itu untuk fitur yang dipakai guru sehari-hari.
//
// KENAPA GEMINI YANG DIPILIH (bukan sekadar "yang penting gratis"):
//   1. GRATIS tanpa kartu kredit, kuota ~1.500 request/hari -- jauh
//      di atas kebutuhan bimbel (belasan generate per hari).
//   2. KUALITAS BAHASA INDONESIA jauh lebih baik daripada model
//      open-weight kecil. Ini akar keluhan awal: soal keluar dalam
//      Bahasa Inggris, atau bahasanya kaku/ngawur.
//   3. MATEMATIKA PRESISI lebih kuat -- penting untuk TKA/UTBK, di
//      mana satu salah hitung membuat seluruh butir soal tidak
//      terpakai.
//   4. STABIL. Model Gemini tidak dipensiunkan mendadak seperti
//      katalog NVIDIA yang berubah 3x dalam sebulan.
//
// KENAPA PERUBAHAN KODENYA KECIL:
// Google menyediakan endpoint yang KOMPATIBEL DENGAN FORMAT OpenAI.
// Jadi seluruh otak sistem ini -- blueprint engine, parser JSONL,
// quality gate, deteksi duplikat, enrich gambar Tavily -- TIDAK
// diubah sama sekali. Yang diganti hanya alamat & nama model.
//
// OPTIONAL:
// AI_MODEL=gemini-3.6-flash
//   (Model default sengaja "Flash": cepat, kuota besar, dan sudah
//   lebih dari cukup untuk membuat soal. Kalau suatu saat mau coba
//   model lain, cukup ubah environment variable ini -- TIDAK perlu
//   mengubah kode.)
//
//   ⚠️ CATATAN (Agustus 2026): default sempat 'gemini-2.5-flash',
//   tetapi Google menutup model 2.5 untuk PENGGUNA BARU -- akun yang
//   baru dibuat mendapat 404 dengan pesan agar memakai generasi 3.
//   Ini beda dari model yang benar-benar pensiun: bagi akun lama, 2.5
//   masih hidup. Artinya "model ada di katalog" TETAP tidak menjamin
//   akunmu boleh memakainya. Kalau 404 serupa muncul lagi nanti,
//   jalankan /api/generateQuizFromTopic?probe=1 -- pesan dari Google
//   biasanya langsung menyebut model penggantinya.
//
// AI_API_URL=...
//   (Hanya diisi kalau suatu saat mau pindah provider lagi. Selama
//   provider barunya menyediakan endpoint format OpenAI -- Groq,
//   OpenRouter, Cerebras, dll -- cukup ganti URL + AI_MODEL +
//   AI_API_KEY, kode ini tetap jalan tanpa diubah. Pelajaran mahal
//   dari kejadian NVIDIA: JANGAN mengunci sistem ke satu provider.)
//
// ============================================================

export const maxDuration = 60;

// ============================================================
// CONFIG
// ============================================================

// Endpoint Gemini yang kompatibel format OpenAI (chat completions).
const AI_API_URL =
  process.env.AI_API_URL ||
  'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

const AI_MODEL =
  process.env.AI_MODEL ||
  'gemini-3.6-flash';

// Model cadangan, dicoba berurutan HANYA kalau model sebelumnya gagal
// karena (a) tidak tersedia/pensiun (404/410), atau (b) timeout. Error
// lain (rate limit, request kegedean) TIDAK memicu pindah model --
// itu bukan salah modelnya, dan ganti model tidak akan menolong.
const AI_MODEL_FALLBACKS = [
  'gemini-3.5-flash-lite',
];

// 🔥 DIUBAH dari 'none' ke 'low' saat pindah ke Gemini 3.x.
// Alasannya bukan preferensi, tapi keterbatasan model: pada model
// Gemini generasi 3, thinking TIDAK BISA dimatikan sepenuhnya
// (berbeda dari generasi 2.5). Mengirim 'none' berisiko ditolak atau
// diabaikan diam-diam. 'low' adalah tingkat paling hemat yang
// didukung -- cukup untuk ketelitian hitungan matematika, tanpa
// memboroskan token & waktu.
//
// Pilihan nilai: 'low' | 'medium' | 'high' | 'off'
// ('off' = parameter tidak dikirim sama sekali, mis. kalau nanti
// pindah ke provider yang tidak mengenalinya.)
const AI_REASONING_EFFORT =
  process.env
    .AI_REASONING_EFFORT ||
  'low';

const DEFAULT_QUESTION_COUNT = 10;
const MAX_QUESTION_COUNT = 20;

const AI_TIMEOUT_MS = 36_000;

// Timeout cadangan yang HANYA terpakai kalau callAI() dipanggil
// langsung tanpa lewat callAIWithFallback() (yang selalu mengirim
// timeoutMs hasil pembagian budget). Nilainya sengaja TIDAK melebihi
// TOTAL_AI_BUDGET_WITH_SEARCH_MS di bawah -- kalau lebih besar, angka
// ini akan saling bertentangan dengan budget total dan menyesatkan
// siapa pun yang membacanya nanti.
const AI_TIMEOUT_WITH_SEARCH_MS = 40_000;

// 🔥 BARU: batas TOTAL waktu (gabungan semua percobaan model, utama +
// cadangan) yang boleh dipakai callAIWithFallback sebelum nyerah.
// Ini BEDA dari AI_TIMEOUT_MS (yang itu per-satu-kali-percobaan) --
// tanpa batas total ini, 3 model x 45 detik = 135 detik, jauh melebihi
// maxDuration 60 detik Vercel dan bikin function mati paksa oleh
// platform (bukan error rapi dari kode kita). Sisa waktu di luar
// budget ini (~10-15 detik) disisakan buat build prompt, quality gate,
// & enrich gambar Tavily yang jalan SEBELUM/SESUDAH pemanggilan AI.
const TOTAL_AI_BUDGET_MS = 36_000;
const TOTAL_AI_BUDGET_WITH_SEARCH_MS = 36_000;

// Batas atas untuk SATU KALI percobaan model, walau sisa budget total
// masih banyak -- supaya satu model yang hidup tapi lambat gak
// ngabisin seluruh budget dan gak nyisain kesempatan buat cadangan
// berikutnya kalau yang pertama ternyata gagal juga.
//
// 🔥 Model UTAMA dikasih jatah lebih besar dari cadangan, dengan alasan
// spesifik: pemanggilan pertama kadang kena "cold start"
// (model perlu dimuat dulu ke GPU) yang bisa makan puluhan detik --
// persis yang bikin timeout 45 detik kemarin. Pemanggilan berikutnya
// biasanya jauh lebih cepat karena model sudah "hangat".
const PRIMARY_ATTEMPT_MS = 30_000;
const MAX_SINGLE_ATTEMPT_MS = 18_000;

// Kalau sisa budget total sudah di bawah ini, gak ada gunanya coba
// model cadangan lagi (kemungkinan besar keburu timeout juga) --
// langsung nyerah dengan error yang rapi daripada bikin function
// dibunuh paksa oleh Vercel di tengah percobaan yang gak akan cukup
// waktu.
const MIN_REMAINING_BUDGET_MS = 8_000;

// 🔥 DINAIKKAN saat pindah ke Gemini -- ini CACAT NYATA yang terbawa
// dari era Groq, bukan sekadar angka kosmetik.
//
// Nilai lamanya 8.000 dipilih karena Groq membatasi 8.000 token/menit.
// Gemini tidak punya batas sesempit itu (Flash sanggup puluhan ribu
// token keluaran). Efek nyata dari plafon lama: permintaan 20 soal
// butuh sekitar 8.300 token, tetapi dipangkas ke 6.500 -- jawaban AI
// terpotong di tengah, beberapa soal terakhir hilang, dan guru melihat
// "diminta 20, dapat 13" tanpa tahu sebabnya.
//
// Nilai baru memberi ruang penuh sampai 20 soal (batas maksimum yang
// boleh diminta guru) tanpa pemotongan.
//
// Ini tetap batas milik KITA sendiri, bukan batas resmi Google --
// Google tidak mempublikasikan limit tier gratis secara rinci di
// halaman publik (hanya terlihat di dasbor AI Studio). Gunanya supaya
// satu permintaan tidak meminta token berlebihan tanpa alasan.
const SOFT_MAX_TOKENS_CEILING = 16000;

// ============================================================
// 🔥 BARU: TAVILY (pencari gambar asli -- opsional)
// ============================================================
// Dipakai KHUSUS untuk mencari gambar ASLI dari internet buat:
// (1) stimulus visual soal (mis. "gambar di bawah ini candi apa?"),
// (2) pilihan jawaban berbentuk gambar (optionsAreImages).
// Tool pencarian teks bawaan provider AI TIDAK bisa ini -- yang
// dikembalikan cuma teks/snippet, bukan berkas gambar.
// Tavily terverifikasi (Agustus 2026) punya
// free tier 1.000 credit/bulan, reset tiap tanggal 1, TANPA kartu
// kredit -- kalau kredit habis, request BERHENTI (bukan auto-tagih
// kayak Brave yang sudah kita coret dari opsi).
//
// FITUR INI SEPENUHNYA OPSIONAL: kalau `TAVILY_API_KEY` gak di-set,
// seluruh langkah pencarian gambar di bawah DILEWATI TOTAL -- sistem
// tetap jalan normal persis seperti sebelum fitur ini ada (fallback
// ke needsImage+imageHint sebagai penanda "butuh gambar" doang, tanpa
// gambar asli). Jadi nggak ada resiko baru buat siapa pun yang belum
// mau/sempat setup Tavily.
const TAVILY_SEARCH_URL =
  'https://api.tavily.com/search';

// 🔥 RISET SOAL INTERNET -- 1 call teks / request maksimum.
// Sengaja cuma satu call: hasilnya dipakai sebagai kumpulan referensi,
// sehingga 20 soal tidak berubah menjadi 20+ pencarian dan kuota tetap aman.
//
// 🔥 FIX BUG NYATA (dilaporkan langsung dari pemakaian): 5 detik
// TERLALU KETAT untuk panggilan web-search sungguhan -- Tavily kadang
// butuh 5-8 detik dalam kondisi jaringan normal, bukan cuma pas
// bermasalah. Timeout seketat ini bikin permintaan yang SEBENARNYA
// baik-baik saja (bukan soal kuota habis) ikut gagal dan memicu
// penghentian generate (lihat blok "TIDAK ADA FALLBACK" di bawah).
// Dinaikkan ke 8 detik -- masih porsi kecil dari total 60 detik
// anggaran Vercel (lihat maxDuration), tapi kasih ruang jauh lebih
// realistis buat riset selesai normal.
const TAVILY_RESEARCH_TIMEOUT_MS = 8_000;
const MAX_RESEARCH_RESULTS = 5;
const MAX_RESEARCH_CHARS_PER_RESULT = 2_400;
const MAX_RESEARCH_CONTEXT_CHARS = 10_000;
const MAX_RESEARCH_IMAGES_PER_RESULT = 4;

// Pencarian gambar tetap dibatasi terpisah dan rendah.
// Jadi total maksimum Tavily per request = 1 riset + 3 gambar = 4 call.
const MAX_TAVILY_IMAGE_CALLS_PER_REQUEST = 3;

// Batas keras jumlah panggilan Tavily PER REQUEST generate-quiz --
// jaga-jaga supaya satu permintaan guru (banyak soal, semua butuh
// gambar) gak ujug-ujug ngabisin jatah bulanan cuma dalam 1 klik.
const MAX_TAVILY_CALLS_PER_REQUEST = MAX_TAVILY_IMAGE_CALLS_PER_REQUEST;

// 🔥 DITURUNKAN dari 12 detik saat pindah ke Gemini. Alasannya
// terukur, bukan perasaan: dengan budget AI yang lama, kasus terburuk
// hanya menyisakan 4 detik untuk gambar -- lebih pendek dari satu
// panggilan Tavily itu sendiri, sehingga fitur gambar praktis TIDAK
// PERNAH jalan saat AI sedang lambat, diam-diam, tanpa error apa pun.
// Sekarang budget AI dipangkas dan timeout ini diperpendek, sehingga
// selalu tersisa ruang untuk beberapa panggilan gambar.
const TAVILY_TIMEOUT_MS = 6_000;

// 🔥 Sama persis dengan filter di ManageQuiz.jsx (searchImagesForQuestion)
// -- beberapa domain proxy internal platform (Facebook lookaside, CDN
// Instagram) SECARA DESAIN gak bisa dibuka di luar ekosistem platform
// asalnya, PASTI gagal load kalau ditaruh sebagai <img src=...> di
// aplikasi lain. Diterapkan di sini juga (bukan cuma di Openverse/
// Wikimedia) buat jaga-jaga kalau Tavily suatu saat ikut mengagregasi
// dari sumber serupa.
const UNRELIABLE_IMAGE_HOST_PATTERNS =
  [
    /lookaside\.fbsx\.com/i,
    /lookaside\.facebook\.com/i,
    /scontent[.-].*\.fbcdn\.net/i,
    /scontent\..*\.cdninstagram\.com/i,
  ];

function isReliableImageUrl(
  url,
) {
  return !UNRELIABLE_IMAGE_HOST_PATTERNS.some(
    (pattern) =>
      pattern.test(url),
  );
}

function buildResearchQuery({
  topic,
  mapel,
  kelas,
  year,
  hotsLevel,
  blueprint,
}) {
  const competencyHints = Array.isArray(blueprint)
    ? blueprint
        .map((item) => `${item.competency || ''} ${item.topic || ''}`)
        .join(' ')
        .replace(/\s+/g, ' ')
        .slice(0, 900)
    : '';

  // 🔥 FIX BUG NYATA (dilaporkan langsung dari pemakaian nyata): kata
  // "TKA" SEBAGAI KATA KUNCI BERDIRI SENDIRI dihapus dari sini.
  //
  // AKIBAT NYATA sebelum diperbaiki: karena TKA saat ini sedang jadi
  // topik KEBIJAKAN yang ramai dibahas media (bukan sekadar nama
  // format ujian), pencarian gabungan "TKA [mapel] [kelas]" nyaris
  // pasti ikut menarik ARTIKEL BERITA/OPINI TENTANG KEBIJAKAN TKA itu
  // sendiri (apa itu TKA, kenapa diadakan, dibanding sistem lama) --
  // BUKAN materi/kisi-kisi mata pelajaran yang diminta. AI kemudian
  // "digroundingkan" ke artikel kebijakan itu, sehingga menghasilkan
  // soal ANALISIS KEBIJAKAN TKA (mis. "simpulkan urgensi pelaksanaan
  // TKA...") -- bukan soal Bahasa Indonesia/Matematika/dst yang
  // diminta guru sama sekali. Ini KONYOL untuk siswa SD tapi bug-nya
  // NYATA dan bisa terjadi di jenjang/mapel mana pun.
  //
  // Diganti jadi "kisi-kisi TKA" (frasa gabungan, bukan kata mentah)
  // -- jauh lebih spesifik mengarah ke DOKUMEN KISI-KISI/KURIKULUM
  // resmi (yang memang punya nama "kisi-kisi" di judulnya), sangat
  // kecil kemungkinan match ke artikel berita/opini kebijakan umum.
  const parts = [
    'kisi-kisi TKA',
    'contoh soal',
    'soal ujian',
    'materi pelajaran',
    mapel,
    topic,
    `kelas ${kelas}`,
    competencyHints,
  ];

  if (normalizeText(hotsLevel).includes('hots')) {
    parts.push('penalaran HOTS');
  }

  if (year) {
    parts.push(String(year));
  }

  // Arahkan mesin pencari ke sumber asesmen resmi terlebih dahulu.
  // Query tetap terbuka agar bisa menemukan sumber pendidikan lain jika ada.
  parts.push('site:pusmendik.kemendikdasmen.go.id OR site:tka.kemendikdasmen.go.id');

  return parts
    .map((part) => cleanText(part))
    .filter(Boolean)
    .join(' ')
    .slice(0, 1200);
}

async function callTavilyResearchSearch(
  apiKey,
  query,
) {
  if (!apiKey || !query) {
    return {
      results: [],
      callUsed: 0,
      skipped: true,
      reason: 'missingKeyOrQuery',
    };
  }

  // 🔥 BARU: 1x percobaan ulang OTOMATIS khusus untuk kegagalan
  // jaringan/timeout (BUKAN untuk rate-limit/forbidden -- kalau itu
  // penyebabnya, mengulang cuma buang-buang waktu karena hasilnya
  // pasti sama). Gangguan jaringan sekejap itu wajar terjadi; sebelum
  // perbaikan ini, SEKALI gangguan langsung menghentikan seluruh
  // proses generate (lihat blok "TIDAK ADA FALLBACK" di pemanggilnya).
  const maxAttempts = 2;
  let lastReason = 'timeoutOrNetwork';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      TAVILY_RESEARCH_TIMEOUT_MS,
    );

    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await fetch(
        TAVILY_SEARCH_URL,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            search_depth: 'basic',
            max_results: MAX_RESEARCH_RESULTS,
            include_answer: false,
            include_images: true,
            include_image_descriptions: true,
            include_raw_content: false,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const reason =
          response.status === 429
            ? 'rateLimited'
            : response.status === 403
              ? 'forbidden'
              : `http${response.status}`;

        // Rate-limit/forbidden TIDAK diulang -- percobaan lagi pasti
        // gagal dengan alasan yang sama, cuma buang waktu dari
        // anggaran 60 detik Vercel.
        return {
          results: [],
          callUsed: 1,
          skipped: true,
          reason,
        };
      }

      const data = await response.json();
      const rawResults = Array.isArray(data?.results)
        ? data.results
        : [];

      const results = rawResults
        .map((item) => {
          const rawImages = Array.isArray(item?.images)
            ? item.images
            : [];

          const images = rawImages
            .map((image) => {
              const url =
                typeof image === 'string'
                  ? image
                  : image?.url;
              const description =
                typeof image === 'object'
                  ? cleanText(image?.description)
                  : '';

              return {
                url: cleanText(url).slice(0, 800),
                description: description.slice(0, 400),
              };
            })
            .filter(
              (image) =>
                /^https?:\/\/\S+$/i.test(image.url) &&
                isReliableImageUrl(image.url),
            )
            .slice(0, MAX_RESEARCH_IMAGES_PER_RESULT);

          return {
            title: cleanText(item?.title).slice(0, 300),
            url: cleanText(item?.url).slice(0, 500),
            content: cleanText(
              item?.content || item?.snippet,
            ).slice(0, MAX_RESEARCH_CHARS_PER_RESULT),
            images,
          };
        })
        .filter(
          (item) =>
            item.title &&
            /^https?:\/\/\S+$/i.test(item.url) &&
            item.content,
        )
        .slice(0, MAX_RESEARCH_RESULTS);

      return {
        results,
        callUsed: 1,
        skipped: false,
        reason:
          results.length > 0
            ? null
            : 'noUsableResults',
      };
    } catch (error) {
      // 🔥 FIX BUG NYATA: sebelumnya `catch (_)` -- detail error ASLI
      // (pesan, jenis error) ketelan total, cuma keluar label generik
      // "timeoutOrNetwork" tanpa ada cara melacak penyebab pastinya
      // lewat log Vercel. Sekarang detail error DICATAT (console.error)
      // walau yang dikembalikan ke pemanggil tetap label ringkas yang
      // sama -- supaya kalau ini terjadi lagi, log Vercel benar-benar
      // membantu, bukan cuma bilang "entah kenapa".
      const isTimeout = error?.name === 'AbortError';
      lastReason = 'timeoutOrNetwork';
      console.error(
        `[generateQuizFromTopic] Tavily research percobaan ${attempt}/${maxAttempts} gagal -- ${isTimeout ? 'timeout' : 'error jaringan'}: ${error?.message || error}`,
      );

      if (attempt < maxAttempts) {
        continue; // coba sekali lagi
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Semua percobaan gagal.
  return {
    results: [],
    callUsed: maxAttempts,
    skipped: true,
    reason: lastReason,
  };
}

function buildResearchContext(results) {
  if (!Array.isArray(results) || !results.length) {
    return '';
  }

  const blocks = [];
  let total = 0;

  for (let i = 0; i < results.length; i += 1) {
    const item = results[i];
    const imageLines = (item.images || [])
      .map((image, index) =>
        `Gambar ${index + 1}: ${image.url}${image.description ? ` | ${image.description}` : ''}`,
      )
      .join('\n');

    const block = [
      `REFERENSI ${i + 1}`,
      `Judul: ${item.title}`,
      `URL: ${item.url}`,
      `Isi hasil pencarian: ${item.content}`,
      imageLines ? `GAMBAR SUMBER:\n${imageLines}` : 'GAMBAR SUMBER: tidak ditemukan',
    ].join('\n');

    if (total + block.length > MAX_RESEARCH_CONTEXT_CHARS) {
      break;
    }

    blocks.push(block);
    total += block.length;
  }

  return blocks.join('\n\n');
}

async function callTavilyImageSearch(
  apiKey,
  query,
) {
  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () =>
        controller.abort(),
      TAVILY_TIMEOUT_MS,
    );

  try {
    const response =
      await fetch(
        TAVILY_SEARCH_URL,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            query,

            search_depth:
              'basic', // 1 credit (bukan 'advanced' yang makan 2 credit)

            max_results: 3,

            include_images:
              true,

            include_image_descriptions:
              false,

            include_answer:
              false,

            include_raw_content:
              false,
          }),

          signal:
            controller.signal,
        },
      );

    if (!response.ok) {
      return null; // 🔥 gagal (kredit habis, dll) -- gak fatal, cuma gak dapat gambar buat butir ini
    }

    const data =
      await response.json();

    const images =
      Array.isArray(
        data?.images,
      )
        ? data.images
        : [];

    // 🔥 `images` bisa berisi string URL langsung, ATAU object
    // {url, description} tergantung parameter -- ditangani dua-duanya
    // supaya gak gampang patah kalau Tavily ubah format.
    for (
      const item of images
    ) {
      const url =
        typeof item ===
        'string'
          ? item
          : item?.url;

      if (
        typeof url ===
          'string' &&
        /^https?:\/\//i.test(
          url,
        ) &&
        isReliableImageUrl(
          url,
        )
      ) {
        return url;
      }
    }

    return null;
  } catch (_) {
    return null; // timeout/network error -- gak fatal, lanjut tanpa gambar buat butir ini
  } finally {
    clearTimeout(
      timeoutId,
    );
  }
}

// 🔥 Perkaya soal-soal yang lolos Quality Gate dengan gambar ASLI dari
// Tavily -- dijalankan SETELAH quality gate (baris soal sudah final),
// SEBELUM dikirim ke ManageQuiz. Dibatasi MAX_TAVILY_CALLS_PER_REQUEST
// biar kredit bulanan gak jebol dalam 1 request.
async function enrichQuestionsWithRealImages(
  questions,
  tavilyApiKey,
  topic,
  deadlineAt,
) {
  if (!tavilyApiKey) {
    // Fitur belum di-setup -- lewati total, gak ada perubahan perilaku.
    return {
      imagesFetched: 0,
      tavilyCallsUsed: 0,
      cappedByBudget: false,
      cappedByTime: false,
    };
  }

  let callsUsed = 0;
  let imagesFetched = 0;
  let cappedByBudget = false;
  let cappedByTime = false;

  // 🔥 BARU (FIX BUG LATEN): sebelumnya langkah ini cuma dibatasi
  // JUMLAH panggilan (MAX_TAVILY_CALLS_PER_REQUEST = 8), TANPA batas
  // WAKTU sama sekali. Karena tiap panggilan Tavily punya timeout
  // 12 detik dan dijalankan BERURUTAN, skenario terburuknya
  // 8 x 12 = 96 detik -- itu SENDIRIAN sudah jauh melewati
  // maxDuration 60 detik Vercel, apalagi ditambah waktu pemanggilan
  // AI sebelumnya. Akibatnya function dibunuh paksa platform di
  // tengah jalan: guru lihat error 504 mentah, DAN soal-soal yang
  // sebenarnya SUDAH BERHASIL dibuat ikut hilang percuma.
  //
  // Sekarang: begitu deadline lewat, pencarian gambar berhenti dan
  // soal tetap dikirim (tanpa gambar untuk sisanya). Lebih baik soal
  // sampai ke guru tanpa sebagian gambar, daripada semuanya hilang.
  const hasDeadline =
    typeof deadlineAt ===
    'number';

  for (
    const question of questions
  ) {
    if (
      hasDeadline &&
      Date.now() >=
        deadlineAt
    ) {
      cappedByTime = true;
      break;
    }

    if (
      callsUsed >=
      MAX_TAVILY_CALLS_PER_REQUEST
    ) {
      cappedByBudget = true;
      break;
    }

    // KASUS 1: soal butuh gambar stimulus (mis. "candi apa ini?")
    // dan belum punya qImage (bukan clock/graph lokal).
    if (
      question.needsImage &&
      !question.qImage &&
      question.imageHint
    ) {
      const url =
        await callTavilyImageSearch(
          tavilyApiKey,
          question.imageHint,
        );

      callsUsed += 1;

      if (url) {
        question.qImage = url;
        question.imageSource = {
          url,
          fetchedVia: 'tavily',
        };
        imagesFetched += 1;
      }

      if (
        callsUsed >=
        MAX_TAVILY_CALLS_PER_REQUEST
      ) {
        cappedByBudget = true;
        break;
      }
    }

    // KASUS 2: pilihan jawaban berbentuk gambar -- cari 1 gambar per
    // opsi. AI sekarang bisa isi "optionImages" dengan HINT deskriptif
    // (Bahasa Inggris, bukan URL -- lihat instruksi di system prompt),
    // dipakai sebagai kata kunci pencarian yang lebih akurat daripada
    // cuma label opsi polos (mis. "Opsi A").
    if (
      question.optionsAreImages &&
      Array.isArray(
        question.options,
      ) &&
      question.options.length >
        0
    ) {
      const rawOptionImages = [
        ...(question.optionImages ||
          []),
      ];

      const isUrl = (
        value,
      ) =>
        typeof value ===
          'string' &&
        /^https?:\/\//i.test(
          value,
        );

      const fetchedImages = [
        ...rawOptionImages,
      ];

      for (
        let i = 0;
        i <
        question.options
          .length;
        i += 1
      ) {
        if (
          hasDeadline &&
          Date.now() >=
            deadlineAt
        ) {
          cappedByTime = true;
          break;
        }

        if (
          callsUsed >=
          MAX_TAVILY_CALLS_PER_REQUEST
        ) {
          cappedByBudget = true;
          break;
        }

        // Kalau opsi ini SUDAH punya URL gambar asli (bukan cuma hint
        // teks), jangan cari ulang -- hemat kredit.
        if (
          isUrl(
            fetchedImages[i],
          )
        ) {
          continue;
        }

        // 🔥 FIX: prioritaskan HINT deskriptif dari AI (mis. "right
        // triangle diagram") kalau ada dan bukan URL -- itu jauh lebih
        // akurat buat pencarian daripada label opsi polos ("Opsi A").
        // Fallback ke label opsi kalau AI gak ngisi hint.
        const hint =
          !isUrl(
            rawOptionImages[i],
          ) &&
          rawOptionImages[i]
            ? rawOptionImages[i]
            : question.options[
                i
              ];

        const query =
          topic
            ? `${hint} ${topic}`
            : hint;

        const url =
          await callTavilyImageSearch(
            tavilyApiKey,
            query,
          );

        callsUsed += 1;

        if (url) {
          fetchedImages[i] =
            url;
          imagesFetched += 1;
        }
      }

      question.optionImages =
        fetchedImages;
    }
  }

  return {
    imagesFetched,
    tavilyCallsUsed:
      callsUsed,
    cappedByBudget,
    cappedByTime,
  };
}

function computeMaxTokens(
  jumlah,
  enableBrowserSearch,
) {
  // Perkiraan: tiap soal butuh ~400 token buat output (pertanyaan +
  // opsi + pembahasan + verifikasi), plus overhead ~300 token buat
  // instruksi umum. Dibatasi maksimal supaya nyisain ruang buat token
  // PROMPT (system+user+blueprint) di bawah limit TPM -- prompt untuk
  // permintaan besar (banyak soal) juga lebih panjang, jadi makin
  // banyak soal, makin sedikit "sisa" jatah yang aman dipakai buat
  // max_tokens output.
  const estimated =
    300 +
    jumlah * 400 +
    THINKING_TOKEN_ALLOWANCE;

  // 🔥 BARU: kalau browser_search aktif, hasil pencarian (snippet
  // beberapa halaman web) ikut masuk ke context -- itu makan jatah
  // TPM juga, di LUAR kendali kita (gak tau pasti berapa token
  // sebelum request jalan). Sisakan buffer JAUH lebih besar supaya
  // gak gampang nabrak limit 8.000 TPM kalau browser_search narik
  // banyak konten.
  const buffer =
    enableBrowserSearch
      ? 2500
      : 1500;

  const ceiling =
    SOFT_MAX_TOKENS_CEILING -
    buffer;

  return Math.min(
    Math.max(
      estimated,
      1200,
    ),
    ceiling,
  );
}

// 🔥 PENTING untuk Gemini 3.x: token yang dipakai model untuk
// "berpikir" diambil dari jatah max_tokens YANG SAMA dengan jawaban.
// Karena thinking tidak bisa dimatikan penuh di generasi 3, jatah ini
// HARUS ditambahkan -- kalau tidak, model bisa kehabisan token di
// tengah berpikir dan mengembalikan jawaban kosong/terpotong, yang di
// sistem kita terbaca sebagai kegagalan total padahal API-nya sehat.
const THINKING_TOKEN_ALLOWANCE = 2_000;

const MAX_FIELD_LENGTH = 4_000;
const MAX_QUESTION_LENGTH = 5_000;
const MAX_EXPLANATION_LENGTH = 8_000;

const MAX_ACCEPTED_QUESTIONS = 20;

// ============================================================
// SUPPORTED TYPES
// ============================================================

// 🔥 FIX BUG NYATA: sebelumnya daftar ini pakai ejaan yang BEDA dari
// yang beneran dikirim AIGenerateQuiz.jsx (TYPE_OPTIONS) --
// 'multiple_select'/'short_answer' (underscore) vs yang dikirim
// frontend 'multiselect'/'shortanswer' (tanpa underscore), plus
// 'causeeffect' dan 'reading' SAMA SEKALI GAK ADA di daftar ini padahal
// keduanya opsi valid di UI ("Sebab Akibat", "Membaca Teks"). Field
// 'ordering' di daftar lama juga gak pernah dikirim frontend sama
// sekali (mati/gak kepakai). Akibatnya: 4 dari 7 tipe soal yang bisa
// dipilih guru DIAM-DIAM DIBUANG di sini sebelum sempat sampai ke AI --
// persis akar masalah "gak variatif" yang dilaporkan (guru centang
// "Pilih Lebih dari Satu"+"Sebab Akibat", tapi keduanya kebuang tanpa
// pesan error apa pun). Sekarang disamakan PERSIS dengan string yang
// dikirim frontend.
const SUPPORTED_TYPES = new Set([
  'multiple',
  'truefalse',
  'multiselect',
  'shortanswer',
  'causeeffect',
  'matching',
  'reading',
]);

// ============================================================
// BASIC TEXT HELPERS
// ============================================================

function cleanText(value = '') {
  return String(value ?? '')
    .replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// 🔥 BARU: DETEKSI KEBOCORAN JSON -- GENERAL, BUKAN SPESIFIK 1 KASUS
// ============================================================
// Kasus nyata yang memicu ini: field "graph" bocor jadi TEKS di dalam
// "question" (mis. soal grafik ketinggian benda) -- tapi kesalahan yang
// SAMA JENISNYA bisa kejadian di field APA PUN (bukan cuma graph/clock)
// dan di MAPEL/TOPIK APA PUN (bukan cuma matematika) -- terutama makin
// riskan begitu Bimbel Gemilang menambah cakupan ke UTBK yang jauh lebih
// beragam jenis soalnya. Makanya deteksinya dibuat GENERAL: cari pola
// `"namaField":` diikuti awal nilai JSON (kutip/kurung/angka/true/false)
// DI MANA PUN dalam teks -- bukan mendaftar nama field satu-satu yang
// kita tahu. Kalau besok ada field baru "table"/"chart"/"diagram" dkk
// yang ditambahkan ke skema, ini TETAP mendeteksinya tanpa perlu update
// daftar nama field manapun.
const JSON_LEAK_PATTERN =
  /"[a-zA-Z_][a-zA-Z0-9_]*"\s*:\s*(\{|\[|"|-?\d|true\b|false\b|null\b)/;

function hasLeakedJsonArtifact(
  text,
) {
  if (!text) return false;
  return JSON_LEAK_PATTERN.test(
    text,
  );
}

function normalizeText(value = '') {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeField(value, fallback = '') {
  const result = cleanText(
    value || fallback,
  );

  return result.slice(
    0,
    MAX_FIELD_LENGTH,
  );
}

// ============================================================
// ARRAY HELPERS
// ============================================================

function cleanStringArray(
  value,
  maxItems = 8,
  maxLength = 2_000,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      cleanText(item).slice(
        0,
        maxLength,
      ),
    )
    .filter(Boolean)
    .slice(0, maxItems);
}

// ============================================================
// NUMBER HELPERS
// ============================================================

function clampInt(
  value,
  min,
  max,
  fallback,
) {
  const parsed =
    Number.parseInt(
      value,
      10,
    );

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(
    Math.max(parsed, min),
    max,
  );
}

// ============================================================
// DUPLICATE DETECTION
// ============================================================

function tokenSet(value = '') {
  return new Set(
    normalizeText(value)
      .split(' ')
      .filter(
        (token) =>
          token.length >= 2,
      ),
  );
}

function jaccardSimilarity(
  a,
  b,
) {
  const A =
    typeof a === 'string'
      ? tokenSet(a)
      : a;

  const B =
    typeof b === 'string'
      ? tokenSet(b)
      : b;

  if (!A.size || !B.size) {
    return 0;
  }

  let intersection = 0;

  for (const token of A) {
    if (B.has(token)) {
      intersection += 1;
    }
  }

  const union =
    A.size +
    B.size -
    intersection;

  return union
    ? intersection / union
    : 0;
}

function fingerprintQuestion(
  value = '',
) {
  return normalizeText(value)
    .replace(
      /\bsoal\s+\d+\b/gi,
      ' ',
    )
    .replace(
      /\bnomor\s+\d+\b/gi,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();
}

function isDuplicateQuestion(
  question,
  existing,
) {
  const current =
    fingerprintQuestion(
      question,
    );

  if (!current) {
    return true;
  }

  for (const item of existing) {
    const previous =
      fingerprintQuestion(
        item.question,
      );

    if (!previous) {
      continue;
    }

    if (current === previous) {
      return true;
    }

    if (
      jaccardSimilarity(
        current,
        previous,
      ) >= 0.86
    ) {
      return true;
    }
  }

  return false;
}

// ============================================================
// XML ESCAPE
// ============================================================

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================================
// COMPETENCY ENGINE
// ============================================================

function getCompetencyTemplates(
  mapel,
  topic,
) {
  const m =
    normalizeText(mapel);

  const t =
    normalizeText(topic);

  // MATEMATIKA
  if (
    m.includes('matematika') ||
    t.includes('pecahan') ||
    t.includes('aljabar') ||
    t.includes('geometri') ||
    t.includes('bilangan') ||
    t.includes('fungsi')
  ) {
    return [
      'Memahami konsep dan representasi matematis',
      'Menerapkan prosedur atau konsep matematika',
      'Menganalisis informasi dan memecahkan masalah kontekstual',
    ];
  }

  // IPA / SAINS
  if (
    m.includes('ipa') ||
    m.includes('fisika') ||
    m.includes('kimia') ||
    m.includes('biologi')
  ) {
    return [
      'Memahami konsep dan fenomena ilmiah',
      'Menerapkan konsep pada situasi ilmiah',
      'Menganalisis data, fenomena, atau permasalahan ilmiah',
    ];
  }

  // BAHASA INDONESIA
  if (
    m.includes(
      'bahasa indonesia',
    )
  ) {
    return [
      'Memahami informasi eksplisit dan implisit',
      'Menganalisis struktur, makna, dan hubungan informasi dalam teks',
      'Mengevaluasi informasi dan menarik kesimpulan berbasis bukti',
    ];
  }

  // BAHASA INGGRIS
  if (
    m.includes(
      'bahasa inggris',
    )
  ) {
    return [
      'Memahami informasi dan tujuan komunikasi dalam teks',
      'Menerapkan kosakata, tata bahasa, atau fungsi bahasa dalam konteks',
      'Menganalisis makna, inferensi, dan konteks komunikasi',
    ];
  }

  // IPS
  if (
    m.includes('ips') ||
    m.includes('sejarah') ||
    m.includes('geografi') ||
    m.includes('ekonomi') ||
    m.includes('sosiologi')
  ) {
    return [
      'Memahami konsep dan informasi faktual penting',
      'Menerapkan konsep dalam konteks kehidupan atau fenomena sosial',
      'Menganalisis hubungan sebab-akibat, data, dan implikasi',
    ];
  }

  // DEFAULT
  return [
    'Memahami konsep atau informasi dasar',
    'Menerapkan konsep pada situasi yang relevan',
    'Menganalisis informasi dan menyelesaikan masalah',
  ];
}

// ============================================================
// DIFFICULTY DISTRIBUTION
// ============================================================

function getDifficultyDistribution(
  jumlah,
  hotsLevel,
) {
  const isHots =
    normalizeText(
      hotsLevel,
    ).includes('hots');

  const levels = isHots
    ? [
        {
          level: 'Easy',
          ratio: 0.10,
          cognitive:
            'Understanding',
        },
        {
          level: 'Medium',
          ratio: 0.40,
          cognitive:
            'Applying/Analyzing',
        },
        {
          level: 'Hard',
          ratio: 0.50,
          cognitive:
            'Analyzing/Evaluating',
        },
      ]
    : [
        {
          level: 'Easy',
          ratio: 0.30,
          cognitive:
            'Understanding',
        },
        {
          level: 'Medium',
          ratio: 0.40,
          cognitive:
            'Applying',
        },
        {
          level: 'Hard',
          ratio: 0.30,
          cognitive:
            'Analyzing/Problem Solving',
        },
      ];

  const result =
    levels.map(
      (item) => ({
        ...item,
        count:
          Math.floor(
            jumlah *
              item.ratio,
          ),
      }),
    );

  let assigned =
    result.reduce(
      (sum, item) =>
        sum + item.count,
      0,
    );

  // Distribusi sisa butir
  let index = 0;

  while (
    assigned <
    jumlah
  ) {
    result[index].count += 1;

    assigned += 1;

    index =
      (index + 1) %
      result.length;
  }

  return result;
}

// ============================================================
// LOCAL BLUEPRINT ENGINE
// ============================================================

function buildCurriculumBlueprint({
  topic,
  mapel,
  kelas,
  jumlah,
  hotsLevel,
  arahan,
  allowedTypes,
}) {
  const safeTopic =
    safeField(topic);

  const safeMapel =
    safeField(
      mapel,
      'Umum',
    );

  const safeKelas =
    safeField(
      kelas,
      'Umum',
    );

  const safeArahan =
    safeField(
      arahan,
      'Tidak ada',
    );

  const competencies =
    getCompetencyTemplates(
      safeMapel,
      safeTopic,
    );

  const difficulties =
    getDifficultyDistribution(
      jumlah,
      hotsLevel,
    );

  const blueprint = [];

  let no = 1;

  // 🔥 FIX BUG NYATA: sebelumnya blueprint SAMA SEKALI GAK menugaskan
  // tipe soal per butir -- AI cuma dikasih daftar "tipe yang
  // diperbolehkan" secara umum, TANPA dipaksa. Model gratis (yang
  // cenderung ambil jalan termudah) akibatnya SELALU pilih "multiple"
  // (pilihan ganda) buat semua butir, walau guru sudah mencentang
  // banyak tipe lain -- persis kasus nyata yang dilaporkan: puluhan
  // soal dihasilkan, semuanya "Pilihan Ganda Biasa". Sekarang tipe
  // soal DIDISTRIBUSIKAN MERATA (round-robin) ke tiap nomor butir
  // sejak awal -- AI dapat instruksi SPESIFIK per nomor ("butir #5
  // WAJIB tipe truefalse"), bukan sekadar "boleh pakai tipe ini".
  // Divalidasi juga di validateAgainstBlueprint() supaya AI beneran
  // patuh, bukan cuma disarankan.
  const typesForDistribution =
    Array.isArray(
      allowedTypes,
    ) &&
    allowedTypes.length > 0
      ? allowedTypes
      : ['multiple'];

  const difficultyTierIndex =
    (level) =>
      difficulties.findIndex(
        (d) => d.level === level,
      );

  for (
    const difficulty
    of difficulties
  ) {
    const tierIndex =
      difficultyTierIndex(
        difficulty.level,
      );

    const competency =
      competencies[
        Math.min(
          tierIndex,
          competencies.length -
            1,
        )
      ];

    for (
      let i = 0;
      i < difficulty.count;
      i += 1
    ) {
      blueprint.push({
        no,

        topic:
          safeTopic,

        mapel:
          safeMapel,

        kelas:
          safeKelas,

        difficulty:
          difficulty.level,

        cognitiveLevel:
          difficulty.cognitive,

        competency,

        // 🔥 BARU: tipe soal spesifik buat butir ini -- round-robin
        // dari daftar tipe yang guru pilih. Kalau guru cuma pilih 1
        // tipe (mis. cuma "multiple"), semua butir tetap tipe itu
        // (sesuai maksud guru) -- variasi cuma muncul kalau guru
        // memang mencentang lebih dari 1 tipe.
        type:
          typesForDistribution[
            (no - 1) %
              typesForDistribution.length
          ],

        teacherDirection:
          safeArahan,
      });

      no += 1;
    }
  }

  return blueprint;
}

// ============================================================
// CLOCK SVG
// ============================================================

function buildClockSvg(
  clock,
) {
  if (
    !clock ||
    typeof clock !==
      'object'
  ) {
    return '';
  }

  const hourValue =
    Number(clock.hour);

  const minuteValue =
    Number(clock.minute);

  if (
    !Number.isFinite(
      hourValue,
    ) ||
    !Number.isFinite(
      minuteValue,
    )
  ) {
    return '';
  }

  const hour =
    ((hourValue % 12) +
      12) %
    12;

  const minute =
    Math.min(
      Math.max(
        minuteValue,
        0,
      ),
      59,
    );

  const radius = 110;
  const cx = 130;
  const cy = 130;

  const toXY = (
    angle,
    length,
  ) => {
    const radians =
      ((angle - 90) *
        Math.PI) /
      180;

    return {
      x:
        cx +
        length *
          Math.cos(
            radians,
          ),

      y:
        cy +
        length *
          Math.sin(
            radians,
          ),
    };
  };

  const hourTip =
    toXY(
      hour * 30 +
        minute * 0.5,
      radius * 0.5,
    );

  const minuteTip =
    toXY(
      minute * 6,
      radius * 0.75,
    );

  const ticks =
    Array.from(
      { length: 12 },
      (_, i) => {
        const p1 =
          toXY(
            i * 30,
            radius,
          );

        const p2 =
          toXY(
            i * 30,
            radius - 10,
          );

        return `
          <line
            x1="${p1.x.toFixed(1)}"
            y1="${p1.y.toFixed(1)}"
            x2="${p2.x.toFixed(1)}"
            y2="${p2.y.toFixed(1)}"
            stroke="#1e293b"
            stroke-width="2"
          />
        `;
      },
    ).join('');

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 260 260"
      width="260"
      height="260"
    >
      <circle
        cx="130"
        cy="130"
        r="${radius}"
        fill="#ffffff"
        stroke="#1e293b"
        stroke-width="3"
      />

      ${ticks}

      <line
        x1="130"
        y1="130"
        x2="${hourTip.x.toFixed(1)}"
        y2="${hourTip.y.toFixed(1)}"
        stroke="#1e293b"
        stroke-width="5"
        stroke-linecap="round"
      />

      <line
        x1="130"
        y1="130"
        x2="${minuteTip.x.toFixed(1)}"
        y2="${minuteTip.y.toFixed(1)}"
        stroke="#475569"
        stroke-width="3"
        stroke-linecap="round"
      />

      <circle
        cx="130"
        cy="130"
        r="4"
        fill="#1e293b"
      />
    </svg>
  `;

  return (
    'data:image/svg+xml;base64,' +
    Buffer.from(
      svg,
    ).toString('base64')
  );
}

// ============================================================
// GRAPH SVG
// ============================================================

function buildGraphSvg(
  graph,
) {
  if (
    !graph ||
    !Array.isArray(
      graph.points,
    )
  ) {
    return '';
  }

  const points =
    graph.points
      .filter(
        (point) =>
          point &&
          Number.isFinite(
            Number(
              point.x,
            ),
          ) &&
          Number.isFinite(
            Number(
              point.y,
            ),
          ),
      )
      .slice(0, 50)
      .map(
        (point) => ({
          x: Number(
            point.x,
          ),
          y: Number(
            point.y,
          ),
        }),
      );

  if (
    points.length < 2
  ) {
    return '';
  }

  const width = 500;
  const height = 300;
  const padding = 40;

  const xs =
    points.map(
      (point) =>
        point.x,
    );

  const ys =
    points.map(
      (point) =>
        point.y,
    );

  const minX =
    Math.min(...xs);

  const maxX =
    Math.max(...xs);

  const minY =
    Math.min(...ys);

  const maxY =
    Math.max(...ys);

  const mapX = (
    value,
  ) =>
    padding +
    ((value - minX) /
      Math.max(
        maxX - minX,
        1,
      )) *
      (width -
        padding * 2);

  const mapY = (
    value,
  ) =>
    height -
    padding -
    ((value - minY) /
      Math.max(
        maxY - minY,
        1,
      )) *
      (height -
        padding * 2);

  const mappedPoints =
    points.map(
      (point) => ({
        sx: mapX(
          point.x,
        ),
        sy: mapY(
          point.y,
        ),
      }),
    );

  // 🔥 FIX BUG NYATA: sebelumnya SEMUA titik disambung garis lurus
  // (path "L" doang) -- buat fungsi LINEAR (garis lurus) itu benar,
  // tapi buat PARABOLA/kurva non-linear hasilnya jadi bentuk "V" atau
  // zig-zag yang salah total secara matematis (bukan kurva mulus).
  // Sekarang kalau `graph.curved` diset true, dipakai kurva Catmull-Rom
  // (diubah ke Bezier kubik) yang melewati SEMUA titik data dengan
  // mulus -- representasi visual parabola/kurva jadi akurat.
  const isCurved =
    Boolean(graph.curved);

  let path;

  if (
    isCurved &&
    mappedPoints.length >=
      3
  ) {
    path = `M ${mappedPoints[0].sx.toFixed(1)} ${mappedPoints[0].sy.toFixed(1)}`;

    for (
      let i = 0;
      i <
      mappedPoints.length -
        1;
      i += 1
    ) {
      const p0 =
        mappedPoints[
          Math.max(
            i - 1,
            0,
          )
        ];

      const p1 =
        mappedPoints[i];

      const p2 =
        mappedPoints[
          i + 1
        ];

      const p3 =
        mappedPoints[
          Math.min(
            i + 2,
            mappedPoints.length -
              1,
          )
        ];

      // Catmull-Rom -> kontrol Bezier kubik (faktor 1/6 standar)
      const cp1x =
        p1.sx +
        (p2.sx - p0.sx) /
          6;

      const cp1y =
        p1.sy +
        (p2.sy - p0.sy) /
          6;

      const cp2x =
        p2.sx -
        (p3.sx - p1.sx) /
          6;

      const cp2y =
        p2.sy -
        (p3.sy - p1.sy) /
          6;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.sx.toFixed(1)} ${p2.sy.toFixed(1)}`;
    }
  } else {
    path =
      mappedPoints
        .map(
          (
            point,
            index,
          ) =>
            `${
              index === 0
                ? 'M'
                : 'L'
            } ${point.sx.toFixed(
              1,
            )} ${point.sy.toFixed(
              1,
            )}`,
        )
        .join(' ');
  }

  // Titik-titik data digambar eksplisit -- guru/siswa bisa lihat pasti
  // di mana titik asli soal berada, gak cuma nebak dari kurvanya.
  const dataDots =
    mappedPoints
      .map(
        (point) =>
          `<circle cx="${point.sx.toFixed(1)}" cy="${point.sy.toFixed(1)}" r="3.5" fill="#2563eb" />`,
      )
      .join('');

  const xLabel =
    escapeXml(
      cleanText(
        graph.xLabel ||
          'X',
      ),
    );

  const yLabel =
    escapeXml(
      cleanText(
        graph.yLabel ||
          'Y',
      ),
    );

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 ${width} ${height}"
      width="${width}"
      height="${height}"
    >

      <rect
        width="${width}"
        height="${height}"
        fill="#ffffff"
      />

      <line
        x1="${padding}"
        y1="${height - padding}"
        x2="${width - padding}"
        y2="${height - padding}"
        stroke="#94a3b8"
        stroke-width="1.5"
      />

      <line
        x1="${padding}"
        y1="${padding}"
        x2="${padding}"
        y2="${height - padding}"
        stroke="#94a3b8"
        stroke-width="1.5"
      />

      <path
        d="${path}"
        fill="none"
        stroke="#0f172a"
        stroke-width="2.5"
      />

      ${dataDots}

      <text
        x="${width - 15}"
        y="${height - padding + 5}"
        font-family="Arial"
        font-size="12"
        fill="#475569"
      >
        ${xLabel}
      </text>

      <text
        x="${padding - 10}"
        y="20"
        font-family="Arial"
        font-size="12"
        fill="#475569"
      >
        ${yLabel}
      </text>

    </svg>
  `;

  return (
    'data:image/svg+xml;base64,' +
    Buffer.from(
      svg,
    ).toString('base64')
  );
}

// ============================================================
// 🔥 BARU: CIRCLE SVG (lingkaran)
// ============================================================
// Sebelumnya AI sering "maksa" gambar lingkaran ke field "graph" (yang
// cuma bisa nyambung titik pakai garis/kurva) -- hasilnya BLANK/kosong
// karena lingkaran gak bisa direpresentasikan sebagai deretan titik
// x-y yang disambung. Field khusus ini menerima pusat & jari-jari,
// digambar sebagai lingkaran SVG asli.
function buildCircleSvg(
  circle,
) {
  if (
    !circle ||
    typeof circle !==
      'object'
  ) {
    return '';
  }

  const centerX =
    Number(
      circle.centerX,
    );

  const centerY =
    Number(
      circle.centerY,
    );

  const radius =
    Number(
      circle.radius,
    );

  if (
    !Number.isFinite(
      centerX,
    ) ||
    !Number.isFinite(
      centerY,
    ) ||
    !Number.isFinite(
      radius,
    ) ||
    radius <= 0
  ) {
    return '';
  }

  const width = 320;
  const height = 320;
  const cx = width / 2;
  const cy = height / 2;

  // Skala biar lingkaran + margin selalu pas di kanvas, berapa pun
  // radius aslinya (unit soal, bukan pixel).
  const scale =
    (Math.min(
      width,
      height,
    ) /
      2 -
      40) /
    radius;

  const r =
    radius * scale;

  const xLabel =
    escapeXml(
      cleanText(
        circle.xLabel ||
          'x',
      ),
    );

  const yLabel =
    escapeXml(
      cleanText(
        circle.yLabel ||
          'y',
      ),
    );

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 ${width} ${height}"
      width="${width}"
      height="${height}"
    >
      <rect width="${width}" height="${height}" fill="#ffffff" />

      <line x1="20" y1="${cy}" x2="${width - 20}" y2="${cy}" stroke="#94a3b8" stroke-width="1.5" />
      <line x1="${cx}" y1="20" x2="${cx}" y2="${height - 20}" stroke="#94a3b8" stroke-width="1.5" />

      <circle
        cx="${cx.toFixed(1)}"
        cy="${cy.toFixed(1)}"
        r="${r.toFixed(1)}"
        fill="none"
        stroke="#0f172a"
        stroke-width="2.5"
      />

      <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3.5" fill="#2563eb" />

      <text x="${cx + 6}" y="${cy - 8}" font-family="Arial" font-size="11" fill="#2563eb">
        (${centerX}, ${centerY})
      </text>

      <text x="${width - 15}" y="${cy - 6}" font-family="Arial" font-size="12" fill="#475569">${xLabel}</text>
      <text x="${cx + 6}" y="20" font-family="Arial" font-size="12" fill="#475569">${yLabel}</text>
    </svg>
  `;

  return (
    'data:image/svg+xml;base64,' +
    Buffer.from(
      svg,
    ).toString('base64')
  );
}

// ============================================================
// 🔥 BARU: SHAPE SVG (bangun datar / polygon -- persegi panjang,
// segitiga, dll dengan koordinat titik sudut)
// ============================================================
// Sama seperti circle di atas -- sebelumnya AI maksa gambar persegi
// panjang/segitiga ke field "graph" (cuma garis terbuka, gak ketutup
// jadi bangun), hasilnya BLANK atau bentuk aneh. Field ini menerima
// titik-titik sudut, digambar sebagai bangun TERTUTUP (polygon).
function buildShapeSvg(
  shape,
) {
  if (
    !shape ||
    !Array.isArray(
      shape.vertices,
    )
  ) {
    return '';
  }

  const vertices =
    shape.vertices
      .filter(
        (v) =>
          v &&
          Number.isFinite(
            Number(v.x),
          ) &&
          Number.isFinite(
            Number(v.y),
          ),
      )
      .slice(0, 12)
      .map((v) => ({
        x: Number(v.x),
        y: Number(v.y),
        label:
          cleanText(
            v.label,
          ),
      }));

  if (
    vertices.length < 3
  ) {
    return '';
  }

  const width = 400;
  const height = 320;
  const padding = 50;

  const xs =
    vertices.map(
      (v) => v.x,
    );

  const ys =
    vertices.map(
      (v) => v.y,
    );

  const minX =
    Math.min(...xs);

  const maxX =
    Math.max(...xs);

  const minY =
    Math.min(...ys);

  const maxY =
    Math.max(...ys);

  const mapX = (
    value,
  ) =>
    padding +
    ((value - minX) /
      Math.max(
        maxX - minX,
        1,
      )) *
      (width -
        padding * 2);

  const mapY = (
    value,
  ) =>
    height -
    padding -
    ((value - minY) /
      Math.max(
        maxY - minY,
        1,
      )) *
      (height -
        padding * 2);

  const mapped =
    vertices.map(
      (v) => ({
        sx: mapX(v.x),
        sy: mapY(v.y),
        label: v.label,
        origX: v.x,
        origY: v.y,
      }),
    );

  const pointsAttr =
    mapped
      .map(
        (p) =>
          `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`,
      )
      .join(' ');

  const vertexLabels =
    mapped
      .map((p) => {
        const labelText =
          p.label ||
          `(${p.origX},${p.origY})`;

        return `<circle cx="${p.sx.toFixed(1)}" cy="${p.sy.toFixed(1)}" r="3.5" fill="#2563eb" /><text x="${(p.sx + 6).toFixed(1)}" y="${(p.sy - 6).toFixed(1)}" font-family="Arial" font-size="11" fill="#334155">${escapeXml(labelText)}</text>`;
      })
      .join('');

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 ${width} ${height}"
      width="${width}"
      height="${height}"
    >
      <rect width="${width}" height="${height}" fill="#ffffff" />

      <polygon
        points="${pointsAttr}"
        fill="${
          shape.closed !==
          false
            ? '#eff6ff'
            : 'none'
        }"
        stroke="#0f172a"
        stroke-width="2.5"
      />

      ${vertexLabels}
    </svg>
  `;

  return (
    'data:image/svg+xml;base64,' +
    Buffer.from(
      svg,
    ).toString('base64')
  );
}

// ============================================================
// JSONL CLEANUP
// ============================================================

function stripCodeFences(
  text,
) {
  return String(text || '')
    .replace(
      /^\s*```(?:json|jsonl)?\s*/i,
      '',
    )
    .replace(
      /\s*```\s*$/i,
      '',
    )
    .trim();
}

// ============================================================
// JSONL PARSER
// ============================================================

function parseJsonLines(
  text = '',
) {
  const cleaned =
    stripCodeFences(text);

  const objects = [];

  // ----------------------------------------------------------
  // PASS 1
  // ----------------------------------------------------------

  const lines =
    cleaned.split(
      /\r?\n/,
    );

  for (
    const line of lines
  ) {
    const value =
      line.trim();

    if (
      !value.startsWith('{') ||
      !value.endsWith('}')
    ) {
      continue;
    }

    try {
      objects.push(
        JSON.parse(value),
      );
    } catch (_) {
      // PASS 2
    }
  }

  if (objects.length > 0) {
    return objects;
  }

  // ----------------------------------------------------------
  // PASS 2
  // Balanced object recovery
  // ----------------------------------------------------------

  let depth = 0;
  let start = -1;

  let inString = false;
  let escaped = false;

  for (
    let i = 0;
    i < cleaned.length;
    i += 1
  ) {
    const char =
      cleaned[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (
      char === '\\' &&
      inString
    ) {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString =
        !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === '{') {
      if (depth === 0) {
        start = i;
      }

      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;

      if (
        depth === 0 &&
        start !== -1
      ) {
        const candidate =
          cleaned.slice(
            start,
            i + 1,
          );

        try {
          objects.push(
            JSON.parse(
              candidate,
            ),
          );
        } catch (_) {
          // invalid JSON object
        }

        start = -1;
      }
    }
  }

  return objects;
}

// ============================================================
// QUESTION TYPE VALIDATORS
// ============================================================

function validMultiple(
  question,
) {
  return (
    Array.isArray(
      question.options,
    ) &&
    question.options.length ===
      4 &&
    question.options.every(
      (item) =>
        cleanText(item)
          .length > 0,
    ) &&
    Number.isInteger(
      question.correct,
    ) &&
    question.correct >=
      0 &&
    question.correct <=
      3
  );
}

// 🔥 FIX BUG NYATA: sebelumnya validTrueFalse cek `question.correct`
// (0/1) -- itu skema buat "true/false tunggal" yang SAMA SEKALI BEDA
// dari skema yang beneran dipakai/dirender di StudentQuizView.jsx
// (multi-pernyataan: `statements: [{text, isTrue}]`, TANPA field
// "correct" sama sekali). Divalidasi cocok skema asli sekarang.
function validTrueFalse(
  question,
) {
  return (
    Array.isArray(
      question.statements,
    ) &&
    question.statements
      .length >= 2 &&
    question.statements.every(
      (s) =>
        s &&
        cleanText(s.text)
          .length > 0 &&
        typeof s.isTrue ===
          'boolean',
    )
  );
}

function validMultipleSelect(
  question,
) {
  if (
    !Array.isArray(
      question.options,
    ) ||
    question.options.length <
      2
  ) {
    return false;
  }

  if (
    !Array.isArray(
      question.correctAnswers,
    ) ||
    question.correctAnswers
      .length < 1
  ) {
    return false;
  }

  return question.correctAnswers.every(
    (index) =>
      Number.isInteger(
        index,
      ) &&
      index >= 0 &&
      index <
        question.options
          .length,
  );
}

function validShortAnswer(
  question,
) {
  return (
    cleanText(
      question.shortAnswer,
    ).length > 0
  );
}

// 🔥 BARU: validator buat 3 tipe yang sebelumnya "diizinkan" di daftar
// tipe tapi field pendukungnya gak pernah dinormalisasi/divalidasi sama
// sekali di file ini -- causeeffect, matching, reading. Skemanya
// disamakan PERSIS dengan yang direnderin StudentQuizView.jsx supaya
// soal yang lolos dari sini beneran bisa ditampilkan & dinilai dengan
// benar di sisi siswa, bukan cuma "lolos validasi tapi kosong".
function validCauseEffect(
  question,
) {
  return (
    cleanText(
      question.cause,
    ).length > 0 &&
    cleanText(
      question.effect,
    ).length > 0 &&
    typeof question.isCauseTrue ===
      'boolean' &&
    typeof question.isEffectTrue ===
      'boolean'
  );
}

function validMatching(
  question,
) {
  return (
    Array.isArray(
      question.matchingPairs,
    ) &&
    question.matchingPairs
      .length >= 2 &&
    question.matchingPairs.every(
      (p) =>
        p &&
        cleanText(p.left)
          .length > 0 &&
        cleanText(p.right)
          .length > 0,
    )
  );
}

function validReading(
  question,
) {
  return (
    cleanText(
      question.readingText,
    ).length > 0 &&
    Array.isArray(
      question.subQuestions,
    ) &&
    question.subQuestions
      .length >= 1 &&
    question.subQuestions.every(
      (sq) =>
        sq &&
        cleanText(sq.q)
          .length > 0 &&
        Array.isArray(
          sq.options,
        ) &&
        sq.options.length ===
          4 &&
        Number.isInteger(
          sq.correct,
        ) &&
        sq.correct >= 0 &&
        sq.correct <= 3,
    )
  );
}

// ============================================================
// 🔥 BARU: DETEKSI SOAL YANG KEMUNGKINAN BUTUH VISUAL TAPI GAK
// KEBENTUK. Lihat penjelasan lengkap di titik pemakaiannya
// (possibleMissingVisual di objek soal final).
// ============================================================
function looksLikeMissingRequiredVisual(questionText) {
  const text = String(questionText || '');

  // Sinyal 1: frasa eksplisit merujuk ke gambar/diagram/grafik yang
  // SEHARUSNYA menyertai soal ini -- kalau soal bilang "perhatikan
  // gambar berikut" tapi gak ada gambar, itu jelas rusak.
  const explicitVisualRefPattern =
    /\b(perhatikan (gambar|bangun|grafik|diagram)|berdasarkan gambar|(gambar|grafik|diagram|kurva)(\s+\w+)?\s+(berikut|di atas|di bawah|di samping)|sesuai gambar)\b/i;
  if (explicitVisualRefPattern.test(text)) return true;

  // Sinyal 2: nama bangun ruang/datar DISEBUTKAN BERSAMA notasi titik
  // sudut berurutan (mis. "balok ABCDEFGH", "bidang BCHE") -- pola
  // paling khas soal geometri yang butuh diagram utuh. Ambang 4+
  // huruf kapital berurutan (bukan 3+) sengaja dipilih supaya
  // singkatan pendidikan umum yang kebetulan 3 huruf (SMP, SMA, SD,
  // IPA, IPS) TIDAK ikut salah tertangkap.
  const solidNamePattern =
    /\b(balok|kubus|limas|prisma|tabung|kerucut|bola|trapesium|jajar\s?genjang|segitiga|persegi\s?panjang|bidang)\b/i;
  const vertexNotationPattern = /\b[A-Z]{4,8}\b/;
  if (solidNamePattern.test(text) && vertexNotationPattern.test(text)) {
    return true;
  }

  return false;
}

// ============================================================
// NORMALIZE QUESTION
// ============================================================

function normalizeQuestion(
  raw,
  allowedTypes,
  currentMode,
  researchResults = [],
  researchRequired = false,
) {
  if (
    !raw ||
    typeof raw !==
      'object'
  ) {
    return null;
  }

  if (
    raw.meta === true
  ) {
    return null;
  }

  const type =
    cleanText(
      raw.type,
    ).toLowerCase();

  if (
    !allowedTypes.includes(
      type,
    )
  ) {
    return null;
  }

  const question =
    cleanText(
      raw.question,
    );

  if (
    question.length < 8 ||
    question.length >
      MAX_QUESTION_LENGTH
  ) {
    return null;
  }

  // 🔥 Jaring pengaman GENERAL (lihat hasLeakedJsonArtifact di atas) --
  // cek field "question" dulu di titik ini karena ini yang paling awal
  // divalidasi; field teks bebas LAINNYA dicek di bawah, setelah semua
  // field itu diekstrak.
  if (
    hasLeakedJsonArtifact(
      question,
    )
  ) {
    return null;
  }

  const normalized = {
    type,

    blueprintNo:
      Number.isInteger(
        raw.blueprintNo,
      )
        ? raw.blueprintNo
        : null,

    sourceRef:
      Number.isInteger(raw.sourceRef)
        ? raw.sourceRef
        : null,

    useSourceImage:
      Boolean(raw.useSourceImage),

    sourceImageIndex:
      Number.isInteger(raw.sourceImageIndex)
        ? raw.sourceImageIndex
        : null,

    difficulty:
      cleanText(
        raw.difficulty,
      ).slice(
        0,
        50,
      ),

    competency:
      cleanText(
        raw.competency,
      ).slice(
        0,
        500,
      ),

    question,

    options:
      cleanStringArray(
        raw.options,
        8,
        2_000,
      ),

    optionImages:
      cleanStringArray(
        raw.optionImages,
        8,
        2_000,
      ),

    optionsAreImages:
      Boolean(
        raw.optionsAreImages,
      ),

    correct:
      Number.isInteger(
        raw.correct,
      )
        ? raw.correct
        : 0,

    correctAnswers:
      Array.isArray(
        raw.correctAnswers,
      )
        ? raw.correctAnswers
            .filter(
              Number.isInteger,
            )
            .slice(0, 8)
        : [],

    // 🔥 FIX: sebelumnya cuma di-slice() mentah tanpa membersihkan tiap
    // item -- sekarang tiap pernyataan dibersihkan & dipastikan
    // "isTrue" benar-benar boolean (bukan string "true"/1/dll yang bisa
    // bikin perbandingan `typeof s.isTrue === 'boolean'` di validator
    // gagal padahal maksudnya benar).
    statements:
      Array.isArray(
        raw.statements,
      )
        ? raw.statements
            .slice(0, 8)
            .map((s) => ({
              text: cleanText(
                s?.text,
              ).slice(
                0,
                500,
              ),
              isTrue:
                Boolean(
                  s?.isTrue,
                ),
            }))
        : [],

    shortAnswer:
      cleanText(
        raw.shortAnswer,
      ).slice(
        0,
        500,
      ),

    readingText:
      cleanText(
        raw.readingText,
      ).slice(
        0,
        8_000,
      ),

    // 🔥 BARU: subQuestions buat tipe "reading" -- sebelumnya gak
    // dinormalisasi sama sekali, jadi soal Membaca Teks selalu jadi
    // kosong/rusak.
    subQuestions:
      Array.isArray(
        raw.subQuestions,
      )
        ? raw.subQuestions
            .slice(0, 6)
            .map((sq) => ({
              q: cleanText(
                sq?.q,
              ).slice(
                0,
                1_000,
              ),
              options:
                cleanStringArray(
                  sq?.options,
                  4,
                  500,
                ),
              correct:
                Number.isInteger(
                  sq?.correct,
                )
                  ? sq.correct
                  : 0,
            }))
        : [],

    cause:
      cleanText(
        raw.cause,
      ).slice(
        0,
        1_000,
      ),

    effect:
      cleanText(
        raw.effect,
      ).slice(
        0,
        1_000,
      ),

    // 🔥 BARU: sebelumnya cause/effect (teksnya) ada, tapi status
    // benar/salahnya (isCauseTrue/isEffectTrue) gak pernah diambil --
    // padahal itu KUNCI JAWABAN buat tipe soal ini. Tanpa ini, soal
    // Sebab Akibat gak pernah bisa dinilai benar.
    isCauseTrue:
      Boolean(
        raw.isCauseTrue,
      ),

    isEffectTrue:
      Boolean(
        raw.isEffectTrue,
      ),

    // 🔥 BARU: matchingPairs buat tipe "matching" -- sebelumnya gak
    // dinormalisasi sama sekali, jadi soal Menjodohkan selalu kosong.
    matchingPairs:
      Array.isArray(
        raw.matchingPairs,
      )
        ? raw.matchingPairs
            .slice(0, 8)
            .map((p) => ({
              left: cleanText(
                p?.left,
              ).slice(
                0,
                300,
              ),
              right:
                cleanText(
                  p?.right,
                ).slice(
                  0,
                  300,
                ),
            }))
        : [],

    explanation:
      cleanText(
        raw.explanation ||
          'Pembahasan belum tersedia.',
      ).slice(
        0,
        MAX_EXPLANATION_LENGTH,
      ),

    answerVerification:
      cleanText(
        raw.answerVerification ||
          'Kunci diperiksa pada level struktur oleh Quality Gate.',
      ).slice(
        0,
        2_000,
      ),

    analysisSummary:
      cleanText(
        raw.analysisSummary ||
          'Sesuai dengan blueprint yang ditetapkan.',
      ).slice(
        0,
        2_000,
      ),

    readingSource:
      cleanText(
        raw.readingSource,
      ).slice(
        0,
        1_000,
      ),

    clock:
      raw.clock &&
      typeof raw.clock ===
        'object'
        ? raw.clock
        : null,

    graph:
      raw.graph &&
      typeof raw.graph ===
        'object'
        ? raw.graph
        : null,

    // 🔥 BARU: circle & shape -- lihat buildCircleSvg()/buildShapeSvg()
    // buat penjelasan lengkap kenapa dua field ini perlu, terpisah
    // dari "graph".
    circle:
      raw.circle &&
      typeof raw.circle ===
        'object'
        ? raw.circle
        : null,

    shape:
      raw.shape &&
      typeof raw.shape ===
        'object'
        ? raw.shape
        : null,

    needsImage:
      Boolean(
        raw.needsImage,
      ),

    imageHint:
      cleanText(
        raw.imageHint,
      ).slice(
        0,
        500,
      ),
  };

  // ----------------------------------------------------------
  // 🔥 JARING PENGAMAN MENYELURUH: cek SEMUA field teks bebas lainnya
  // (bukan cuma "question" yang sudah dicek di atas) -- competency,
  // explanation, answerVerification, analysisSummary, shortAnswer,
  // readingText, cause, effect. Field-field ini SEMUA ditulis bebas
  // oleh AI (bukan angka/enum terbatas), jadi SEMUA berisiko kena
  // kebocoran JSON yang sama, di mapel/topik apa pun.
  // ----------------------------------------------------------

  const freeTextFieldsToCheck =
    [
      normalized.competency,
      normalized.explanation,
      normalized.answerVerification,
      normalized.analysisSummary,
      normalized.shortAnswer,
      normalized.readingText,
      normalized.cause,
      normalized.effect,
    ];

  if (
    freeTextFieldsToCheck.some(
      (text) =>
        hasLeakedJsonArtifact(
          text,
        ),
    )
  ) {
    return null;
  }

  // ----------------------------------------------------------
  // TYPE VALIDATION
  // ----------------------------------------------------------

  if (
    type === 'multiple' &&
    !validMultiple(
      normalized,
    )
  ) {
    return null;
  }

  if (
    type === 'truefalse' &&
    !validTrueFalse(
      normalized,
    )
  ) {
    return null;
  }

  // 🔥 FIX BUG NYATA: sebelumnya dicek pakai 'multiple_select'/
  // 'short_answer' (pakai underscore) -- padahal frontend (AIGenerateQuiz.jsx
  // TYPE_OPTIONS) selalu ngirim 'multiselect'/'shortanswer' (TANPA
  // underscore). Karena string-nya gak pernah cocok, cabang validasi ini
  // SELAMA INI gak pernah kena sama sekali -- bukan cuma soal ini,
  // dampaknya lebih luas: SUPPORTED_TYPES (lihat definisinya di atas)
  // juga masih pakai ejaan lama ini, jadi tipe "Pilih Lebih dari Satu"
  // dan "Isian Singkat" yang guru centang DIAM-DIAM DIBUANG di tahap
  // filter allowedTypes, sebelum sempat sampai ke titik ini sama sekali.
  if (
    type === 'multiselect' &&
    !validMultipleSelect(
      normalized,
    )
  ) {
    return null;
  }

  if (
    type === 'shortanswer' &&
    !validShortAnswer(
      normalized,
    )
  ) {
    return null;
  }

  // 🔥 BARU: 3 tipe ini sebelumnya masuk daftar "diizinkan" tapi gak
  // pernah divalidasi strukturnya sama sekali -- soal apa pun dengan
  // tipe ini otomatis LOLOS walau field pendukungnya (matchingPairs,
  // subQuestions, isCauseTrue/isEffectTrue) kosong/gak ada. Sekarang
  // divalidasi juga, konsisten dengan tipe lain.
  if (
    type === 'causeeffect' &&
    !validCauseEffect(
      normalized,
    )
  ) {
    return null;
  }

  if (
    type === 'matching' &&
    !validMatching(
      normalized,
    )
  ) {
    return null;
  }

  if (
    type === 'reading' &&
    !validReading(
      normalized,
    )
  ) {
    return null;
  }

  // ----------------------------------------------------------
  // RESEARCH SOURCE VALIDATION
  // ----------------------------------------------------------

  let selectedSource = null;
  let selectedSourceImage = null;

  if (researchRequired) {
    if (
      !Number.isInteger(normalized.sourceRef) ||
      normalized.sourceRef < 1 ||
      normalized.sourceRef > researchResults.length
    ) {
      return null;
    }

    selectedSource = researchResults[normalized.sourceRef - 1];
    if (!selectedSource) {
      return null;
    }

    if (
      normalized.useSourceImage
    ) {
      const index = Number.isInteger(normalized.sourceImageIndex)
        ? normalized.sourceImageIndex
        : 0;
      selectedSourceImage =
        Array.isArray(selectedSource.images)
          ? selectedSource.images[index] || null
          : null;

      // Soal bergambar dalam mode riset TIDAK BOLEH memakai gambar acak.
      // Kalau sumber tidak menyediakan gambar yang bisa dipakai, butir ditolak.
      if (!selectedSourceImage?.url) {
        return null;
      }
    }
  }

  // ----------------------------------------------------------
  // LOCAL VISUAL
  // ----------------------------------------------------------

  let qImage;

  let visualKind =
    'none';

  if (
    !selectedSourceImage &&
    normalized.clock
  ) {
    qImage =
      buildClockSvg(
        normalized.clock,
      );

    visualKind =
      'clock';
  } else if (
    !selectedSourceImage &&
    normalized.graph
  ) {
    qImage =
      buildGraphSvg(
        normalized.graph,
      );

    visualKind =
      'graph';
  } else if (
    !selectedSourceImage &&
    normalized.circle
  ) {
    qImage =
      buildCircleSvg(
        normalized.circle,
      );

    visualKind =
      'circle';
  } else if (
    !selectedSourceImage &&
    normalized.shape
  ) {
    qImage =
      buildShapeSvg(
        normalized.shape,
      );

    visualKind =
      'shape';
  }

  if (
    !qImage &&
    selectedSourceImage?.url
  ) {
    qImage = selectedSourceImage.url;
    visualKind = 'source';
  }

  return {
    type:
      normalized.type,

    blueprintNo:
      normalized.blueprintNo,

    difficulty:
      normalized.difficulty,

    competency:
      normalized.competency,

    question:
      normalized.question,

    options:
      normalized.options,

    optionImages:
      normalized.optionImages,

    optionsAreImages:
      normalized.optionsAreImages,

    correct:
      normalized.correct,

    correctAnswers:
      normalized.correctAnswers,

    statements:
      normalized.statements,

    shortAnswer:
      normalized.shortAnswer,

    readingText:
      normalized.readingText,

    // 🔥 BARU: field-field yang sebelumnya gak pernah diteruskan ke
    // output final -- tanpa ini, walau normalizeQuestion sudah
    // mengekstraknya, ManageQuiz.jsx tetap gak akan pernah menerimanya.
    subQuestions:
      normalized.subQuestions,

    matchingPairs:
      normalized.matchingPairs,

    isCauseTrue:
      normalized.isCauseTrue,

    isEffectTrue:
      normalized.isEffectTrue,

    cause:
      normalized.cause,

    effect:
      normalized.effect,

    explanation:
      normalized.explanation,

    answerVerification:
      normalized.answerVerification,

    analysisSummary:
      normalized.analysisSummary,

    readingSource:
      normalized.readingSource,

    qImage,

    needsImage:
      Boolean(
        normalized.needsImage ||
          normalized.clock ||
          normalized.graph ||
          normalized.circle ||
          normalized.shape,
      ),

    imageHint:
      normalized.imageHint,

    visualRequired:
      Boolean(qImage),

    // 🔥 BARU: DETEKSI SOAL YANG KEMUNGKINAN BUTUH VISUAL TAPI GAK
    // KEBENTUK -- fix keluhan nyata dilaporkan guru: banyak soal
    // geometri/grafik (gaya soal TKA) yang teksnya jelas-jelas
    // merujuk ke bangun/diagram (mis. "balok ABCDEFGH", "perhatikan
    // gambar berikut"), TAPI AI gak mengisi field shape/graph/circle
    // sama sekali walau instruksinya sudah jelas -- akibatnya qImage
    // kosong, soal jadi gak bisa dikerjakan (siswa diminta lihat
    // gambar yang gak ada).
    //
    // Ini KETERBATASAN NYATA model AI (kepatuhan ke instruksi yang
    // rumit gak pernah 100%), bukan bug logika pembuat SVG-nya
    // (buildShapeSvg/buildGraphSvg/buildCircleSvg sudah benar --
    // masalahnya AI gak pernah memanggil/mengisi fieldnya). Makanya
    // solusinya BUKAN "perbaiki kode SVG" (itu udah benar), tapi
    // TANDAI jelas ke guru soal mana yang perlu ditinjau/dilengkapi
    // manual, daripada diam-diam lolos tanpa gambar.
    possibleMissingVisual:
      !qImage &&
      looksLikeMissingRequiredVisual(
        normalized.question,
      ),

    visualKind,

    sourceTitle:
      selectedSource?.title ||
      'Blueprint Gemilang',

    sourceUrl:
      selectedSource?.url ||
      '',

    researchBacked:
      Boolean(selectedSource),

    sourceRef:
      normalized.sourceRef,

    sourceImageIndex:
      normalized.sourceImageIndex,

    sourceImageUrl:
      selectedSourceImage?.url ||
      '',

    sourceMode:
      currentMode,
  };
}

// ============================================================
// BLUEPRINT VALIDATION
// ============================================================

function validateAgainstBlueprint(
  question,
  blueprint,
) {
  if (
    !Number.isInteger(
      question.blueprintNo,
    )
  ) {
    return {
      valid: false,
      reason:
        'missingBlueprintNo',
    };
  }

  const target =
    blueprint.find(
      (item) =>
        item.no ===
        question.blueprintNo,
    );

  if (!target) {
    return {
      valid: false,
      reason:
        'invalidBlueprintNo',
    };
  }

  const targetDifficulty =
    normalizeText(
      target.difficulty,
    );

  const actualDifficulty =
    normalizeText(
      question.difficulty,
    );

  if (
    actualDifficulty &&
    actualDifficulty !==
      targetDifficulty
  ) {
    return {
      valid: false,
      reason:
        'difficultyMismatch',
    };
  }

  // 🔥 BARU: FIX BUG NYATA (soal gak variatif) -- validasi tipe soal
  // terhadap yang ditugaskan blueprint. Sebelumnya gak ada pengecekan
  // ini sama sekali, jadi AI bebas nulis tipe apa pun (selalu "multiple"
  // dalam praktiknya) walau blueprint sudah menugaskan tipe lain buat
  // butir itu. Sekarang DITOLAK kalau gak sesuai -- ini yang memaksa
  // distribusi tipe soal beneran terwujud, bukan cuma anjuran di prompt.
  const targetType =
    normalizeText(
      target.type,
    );

  const actualType =
    normalizeText(
      question.type,
    );

  if (
    targetType &&
    actualType &&
    actualType !==
      targetType
  ) {
    return {
      valid: false,
      reason:
        'typeMismatch',
    };
  }

  return {
    valid: true,
    target,
  };
}

// ============================================================
// SYSTEM PROMPT
// ============================================================

function buildSystemPrompt({
  allowedTypes,
  enableBrowserSearch,
}) {
  return [
    'Kamu adalah Otak Akademik Bimbel Gemilang.',

    'Buat soal latihan akademik berdasarkan BLUEPRINT PER BUTIR yang diberikan.',

    '',

    'ATURAN MUTLAK:',

    '1. REFERENSI INTERNET adalah SUMBER UTAMA. Setiap soal WAJIB ditulis ulang/adaptasi dari salah satu REFERENSI yang diberikan, bukan dibuat dari pengetahuan umum model.',

    '2. Jangan mengaku browsing sendiri. Server sudah memberikan hasil riset beserta nomor REFERENSI 1..N.',

    '3. Setiap soal WAJIB mencantumkan sourceRef yang menunjuk ke REFERENSI yang benar-benar menjadi dasar soal. Jangan mengarang sourceRef, URL, judul, atau isi sumber.',

    '4. Adaptasi berarti mempertahankan kompetensi, struktur penalaran, konteks asesmen, bentuk stimulus, dan tingkat kesulitan sumber. Jangan membuat soal yang hanya kebetulan satu topik.',

    '5. JANGAN mengubah data visual pada gambar sumber bila memakai useSourceImage=true. Angka, label, posisi, bentuk, dan informasi pada gambar harus tetap cocok dengan pertanyaan.',

    '6. Setiap soal harus mempunyai blueprintNo.',

    '7. Setiap blueprintNo hanya boleh digunakan satu kali.',

    '8. Ikuti difficulty dari blueprint.',

    '9. Ikuti competency dari blueprint.',

    '10. Untuk multiple hanya satu jawaban benar.',

    '11. Periksa kembali semua perhitungan angka.',

    '12. Jangan membuat pilihan jawaban yang ambigu.',

    '13. Pembahasan harus menjelaskan alasan jawaban.',

    '14. Jangan menggunakan Markdown dalam output.',

    '15. Jangan memberikan percakapan tambahan.',

    // 🔥 BARU: penekanan Bahasa Indonesia MUTLAK -- ditambah setelah
    // laporan nyata AI keluar Bahasa Inggris di tengah kuis Bahasa
    // Indonesia (mis. "What is the sum of 7 and 5?" muncul di kuis
    // Matematika TKA kelas 9 SMP). Ditaruh sebagai ATURAN MUTLAK
    // bernomor, bukan cuma disebut sekilas, biar bobotnya jelas setara
    // sama aturan lain yang harus dipatuhi.
    '16. SELURUH teks (question, options, explanation, statements, cause, effect, readingText, subQuestions, dll) WAJIB 100% Bahasa Indonesia baku -- KECUALI notasi matematika standar (mis. "7³", "x²", angka, simbol operasi) dan istilah teknis yang memang lazim dipakai apa adanya (mis. "HOTS"). DILARANG MUTLAK bikin soal atau pilihan jawaban dalam Bahasa Inggris.',

    // 🔥 BARU: penekanan level kesulitan sesuai jenjang -- ditambah
    // setelah laporan nyata soal level SD ("berapa hasil 7+5?") muncul
    // untuk kuis kelas 9 SMP HOTS.
    '17. Soal WAJIB sesuai jenjang kelas yang diminta -- soal kelas 9 SMP harus setara materi kurikulum kelas 9 SMP, BUKAN materi kelas yang jauh lebih rendah (mis. penjumlahan dasar, perkalian 1 digit) walau ditandai "Easy". "Easy" berarti bagian TERMUDAH dari materi kelas tersebut, BUKAN materi jenjang yang berbeda.',

    '18. Untuk mapel Matematika, gunakan operasi/rumus yang PRESIS dan bisa dihitung manual -- verifikasi ulang hasil perhitungan sebelum menuliskannya di "correct"/"explanation", jangan asal tebak angka.',

    '',

    'FORMAT:',

    '{"meta":true}',

    'Wajib untuk mode riset: sourceRef adalah nomor REFERENSI 1..N. useSourceImage=true HANYA jika soal memang memakai gambar dari sumber tersebut. Jika true, sourceImageIndex adalah indeks gambar 0-based dari daftar GAMBAR SUMBER.',


    '{"type":"multiple","blueprintNo":1,"difficulty":"Easy","competency":"...","question":"...","options":["...","...","...","..."],"correct":0,"explanation":"...","answerVerification":"...","analysisSummary":"..."}',

    '',

    // 🔥 BARU: sebelumnya CUMA ada contoh format buat tipe "multiple" --
    // tipe lain (truefalse, multiselect, shortanswer, causeeffect,
    // matching, reading) gak pernah dikasih contoh formatnya sama
    // sekali, padahal field pendukungnya beda-beda total per tipe.
    // Tanpa contoh ini AI menebak-nebak (atau ujung-ujungnya balik lagi
    // ke "multiple" karena itu yang paling jelas contohnya).
    'CONTOH FORMAT TIAP TIPE SOAL LAIN (WAJIB ikuti struktur field persis ini kalau blueprint minta tipe tersebut):',

    '',

    'truefalse (beberapa pernyataan benar/salah, field "statements", BUKAN "options"/"correct"):',

    '{"type":"truefalse","blueprintNo":2,"difficulty":"Medium","competency":"...","question":"Tentukan benar atau salah tiap pernyataan berikut.","statements":[{"text":"...","isTrue":true},{"text":"...","isTrue":false},{"text":"...","isTrue":true}],"explanation":"...","answerVerification":"...","analysisSummary":"..."}',

    '',

    'multiselect (jawaban benar lebih dari satu, field "correctAnswers" berupa ARRAY indeks, BUKAN "correct" tunggal):',

    '{"type":"multiselect","blueprintNo":3,"difficulty":"Medium","competency":"...","question":"...","options":["...","...","...","..."],"correctAnswers":[0,2],"explanation":"...","answerVerification":"...","analysisSummary":"..."}',

    '',

    'shortanswer (isian singkat, field "shortAnswer" berisi kunci jawaban teks, TANPA "options"):',

    '{"type":"shortanswer","blueprintNo":4,"difficulty":"Easy","competency":"...","question":"...","shortAnswer":"...","explanation":"...","answerVerification":"...","analysisSummary":"..."}',

    '',

    'causeeffect (sebab-akibat, WAJIB isi "isCauseTrue" dan "isEffectTrue" sebagai boolean -- ini KUNCI JAWABANNYA, jangan sampai lupa):',

    '{"type":"causeeffect","blueprintNo":5,"difficulty":"Hard","competency":"...","question":"Tentukan apakah sebab dan akibat berikut benar, dan apakah ada hubungan sebab-akibat.","cause":"...","effect":"...","isCauseTrue":true,"isEffectTrue":false,"explanation":"...","answerVerification":"...","analysisSummary":"..."}',

    '',

    'matching (menjodohkan, field "matchingPairs" array {left,right}, MINIMAL 3 pasang):',

    '{"type":"matching","blueprintNo":6,"difficulty":"Medium","competency":"...","question":"Jodohkan istilah di kiri dengan definisi yang tepat di kanan.","matchingPairs":[{"left":"...","right":"..."},{"left":"...","right":"..."},{"left":"...","right":"..."}],"explanation":"...","answerVerification":"...","analysisSummary":"..."}',

    '',

    'reading (membaca teks, field "readingText" berisi bacaan, "subQuestions" array pertanyaan turunan dengan 4 opsi tiap satu, MINIMAL 1):',

    '{"type":"reading","blueprintNo":7,"difficulty":"Hard","competency":"...","question":"Bacalah teks berikut, lalu jawab pertanyaan di bawahnya.","readingText":"...(teks bacaan lengkap)...","subQuestions":[{"q":"...","options":["...","...","...","..."],"correct":0}],"explanation":"...","answerVerification":"...","analysisSummary":"..."}',

    '',

    `Tipe yang diperbolehkan: ${allowedTypes.join(', ')}`,

    '',

    // 🔥 FIX BUG NYATA: sebelumnya 3 opsi visual ini (clock/graph/
    // needsImage) dijelaskan SEJAJAR tanpa aturan kapan pakai yang
    // mana -- akibatnya AI salah pilih `needsImage` buat DIAGRAM
    // MATEMATIS (mis. "parabola dengan titik puncak (2,-3)", "pohon
    // peluang 13/52 dan 39/52"). Itu FATAL: `needsImage` memicu
    // PENCARIAN FOTO STOK ASLI (Openverse/Wikimedia) -- padahal gak
    // ada dan gak akan PERNAH ada foto asli buat diagram matematis
    // yang dikarang sendiri kayak gitu. Hasilnya foto ngasal yang gak
    // nyambung sama sekali (kotak gelap, tekstur random) karena mesin
    // pencari maksa nyari padanan kata dari deskripsi yang sebenarnya
    // gak mewakili benda nyata apa pun.
    'ATURAN VISUAL -- WAJIB DIIKUTI, JANGAN TERTUKAR:',

    '',

    '1. GRAFIK GARIS LURUS -> pakai "graph" TANPA "curved" (lihat contoh di bawah).',

    '2. GRAFIK KURVA / PARABOLA / FUNGSI NON-LINEAR -> pakai "graph" DENGAN "curved":true, dan sertakan MINIMAL 5 titik supaya kurvanya akurat (bukan cuma 2-3 titik). JANGAN PERNAH pakai "needsImage" buat ini.',

    '3. LINGKARAN -> WAJIB pakai "circle" (BUKAN "graph" -- lingkaran gak bisa digambar dari deretan titik x-y biasa). Lihat contoh di bawah.',

    '4. BANGUN DATAR bersudut (persegi, persegi panjang, segitiga, trapesium, dll) -> WAJIB pakai "shape" dengan titik-titik sudutnya (BUKAN "graph"). Lihat contoh di bawah.',

    '5. JAM ANALOG -> WAJIB pakai "clock". JANGAN pakai "needsImage".',

    '6. DIAGRAM ABSTRAK LAIN yang BUKAN grafik/lingkaran/bangun datar/jam (pohon peluang, diagram Venn, bagan alur, garis bilangan, dll) -> JELASKAN LENGKAP di teks "question" itu sendiri (semua angka/label relevan disebutkan di kalimat soal). JANGAN pakai "needsImage" buat ini.',

    '7. "needsImage"+"imageHint" HANYA untuk FOTO OBJEK/TEMPAT/MAKHLUK NYATA yang BENERAN ada fotonya di dunia (mis. "Candi Prambanan", "ayam jantan", "Menara Eiffel"). Kalau ragu -> PILIH ATURAN 1-6, JANGAN needsImage.',

    '8. PILIHAN JAWABAN BERUPA GAMBAR: kalau soal cocok punya 4 pilihan jawaban berbentuk GAMBAR (bukan teks) -- misalnya "manakah gambar yang menunjukkan segitiga siku-siku?" dengan 4 pilihan gambar bangun berbeda -- set "optionsAreImages":true dan isi "optionImages" dengan 4 deskripsi singkat (Bahasa Inggris) buat tiap opsi, SEJAJAR urutannya dengan "options". Pakai ini SESEKALI kalau memang relevan dengan topik & tipe soal "multiple" -- jangan dipaksakan di semua soal.',

    '',

    'VISUAL CLOCK -- CONTOH OBJEK UTUH:',

    '{"type":"multiple","blueprintNo":2,"difficulty":"Easy","competency":"...","question":"Perhatikan jam di bawah ini. Pukul berapakah yang ditunjukkan?","clock":{"hour":8,"minute":30},"options":["...","...","...","..."],"correct":0,"explanation":"...","answerVerification":"...","analysisSummary":"..."}',

    '',

    'VISUAL GRAPH (garis lurus) -- CONTOH OBJEK UTUH:',

    '{"type":"multiple","blueprintNo":3,"difficulty":"Medium","competency":"...","question":"Grafik berikut menunjukkan sebuah garis lurus. Berapa nilai kemiringan (slope) garis tersebut?","graph":{"points":[{"x":0,"y":0},{"x":1,"y":2}],"xLabel":"x","yLabel":"y"},"options":["...","...","...","..."],"correct":0,"explanation":"...","answerVerification":"...","analysisSummary":"..."}',

    '',

    'VISUAL GRAPH (kurva/parabola, WAJIB "curved":true + minimal 5 titik) -- CONTOH OBJEK UTUH:',

    '{"type":"multiple","blueprintNo":4,"difficulty":"Hard","competency":"...","question":"Grafik berikut menunjukkan fungsi kuadrat. Berapakah titik puncak (vertex) fungsi tersebut?","graph":{"points":[{"x":-2,"y":5},{"x":-1,"y":0},{"x":0,"y":-3},{"x":1,"y":0},{"x":2,"y":5}],"xLabel":"x","yLabel":"y","curved":true},"options":["...","...","...","..."],"correct":0,"explanation":"...","answerVerification":"...","analysisSummary":"..."}',

    '',

    'VISUAL CIRCLE (lingkaran) -- CONTOH OBJEK UTUH:',

    '{"type":"multiple","blueprintNo":5,"difficulty":"Medium","competency":"...","question":"Grafik berikut adalah lingkaran dengan pusat di (-3,2) dan melalui titik (-3,-2). Berapakah jari-jari lingkaran tersebut?","circle":{"centerX":-3,"centerY":2,"radius":4,"xLabel":"x","yLabel":"y"},"options":["...","...","...","..."],"correct":0,"explanation":"...","answerVerification":"...","analysisSummary":"..."}',

    '',

    'VISUAL SHAPE (bangun datar) -- CONTOH OBJEK UTUH:',

    '{"type":"multiple","blueprintNo":6,"difficulty":"Easy","competency":"...","question":"Perhatikan persegi panjang berikut. Hitung luasnya.","shape":{"vertices":[{"x":0,"y":0,"label":"A(0,0)"},{"x":5,"y":0,"label":"B(5,0)"},{"x":5,"y":3,"label":"C(5,3)"},{"x":0,"y":3,"label":"D(0,3)"}],"closed":true},"options":["...","...","...","..."],"correct":0,"explanation":"...","answerVerification":"...","analysisSummary":"..."}',

    '',

    'PILIHAN JAWABAN BERUPA GAMBAR -- CONTOH OBJEK UTUH:',

    '{"type":"multiple","blueprintNo":7,"difficulty":"Easy","competency":"...","question":"Manakah gambar yang menunjukkan segitiga siku-siku?","options":["Opsi A","Opsi B","Opsi C","Opsi D"],"optionsAreImages":true,"optionImages":["right triangle diagram","equilateral triangle diagram","isosceles triangle diagram","obtuse triangle diagram"],"correct":0,"explanation":"...","answerVerification":"...","analysisSummary":"..."}',

    '',

    'IMAGE (foto objek nyata) -- CONTOH OBJEK UTUH:',

    '{"type":"multiple","blueprintNo":8,"difficulty":"Easy","competency":"...","question":"Perhatikan gambar di atas. Bangunan bersejarah apakah ini?","needsImage":true,"imageHint":"Prambanan Temple Indonesia","options":["...","...","...","..."],"correct":0,"explanation":"...","answerVerification":"...","analysisSummary":"..."}',

    '',

    '⚠️ PERINGATAN KERAS: field "question" HANYA boleh berisi KALIMAT SOAL dalam bahasa manusia biasa. DILARANG MUTLAK menulis potongan JSON, tanda kurung kurawal {}, atau kata kunci seperti "graph"/"clock"/"circle"/"shape"/"points"/"xLabel" DI DALAM teks "question" -- semua data visual itu WAJIB jadi key JSON terpisah yang sejajar dengan "question", persis seperti contoh objek utuh di atas.',

    '',

    'Output harus JSONL murni.',
  ].join('\n');
}

// ============================================================
// USER PROMPT
// ============================================================

function buildUserPrompt({
  topic,
  mapel,
  kelas,
  year,
  currentMode,
  arahan,
  blueprint,
  researchContext,
}) {
  return [
    'BIMBEL GEMILANG — GENERATE QUIZ',

    `TOPIK: ${topic}`,

    `MAPEL: ${mapel}`,

    `KELAS: ${kelas}`,

    `TARGET TAHUN: ${year}`,

    `MODE: ${currentMode}`,

    `ARAHAN GURU: ${arahan}`,

    '',

    'REFERENSI INTERNET YANG SUDAH DICARI SERVER:',

    researchContext ||
      'Tidak ada referensi internet yang tersedia. Jangan mengarang adanya sumber.',

    '',

    'ATURAN PENGGUNAAN REFERENSI:',

    'REFERENSI DI ATAS BUKAN SEKADAR INSPIRASI. Setiap butir WAJIB memiliki dasar yang jelas pada salah satu referensi tersebut.',

    'JANGAN membuat soal baru dari pengetahuan umum jika tidak ada referensi yang cocok. Bila tidak ada referensi yang benar-benar relevan, jangan mengisi butir tersebut.',

    'Tulis ulang/adaptasi, jangan copy-paste. Pertahankan kompetensi, struktur penalaran, konteks asesmen, dan tingkat kesulitan sumber.',

    'Untuk soal bergambar: pilih sourceRef dan, bila gambar sumber dipakai, set useSourceImage=true serta sourceImageIndex yang sesuai. JANGAN memakai gambar hasil pencarian gambar terpisah yang tidak berasal dari referensi soal.',

    'Bila gambar sumber mengandung angka/label penting, jangan mengubah angka/label pada soal hasil adaptasi kecuali kamu membuat visual terstruktur yang benar-benar sama dengan data baru dan field visual memang mendukungnya.',

    '',

    'BLUEPRINT:',

    JSON.stringify(
      blueprint,
    ),

    '',

    `Jumlah blueprint: ${blueprint.length}`,

    '',

    'WAJIB menghasilkan satu soal untuk setiap blueprint.',

    'Jangan melewati nomor blueprint.',

    'Jangan menggabungkan dua blueprint.',

    'Jangan membuat blueprint tambahan.',

    // 🔥 BARU: penekanan eksplisit soal field "type" di tiap butir
    // blueprint -- field ini BUKAN saran, itu PENUGASAN WAJIB. Sebelum
    // ini gak ditekankan sama sekali, jadi AI abai dan selalu pakai
    // "multiple" buat semua butir.
    'Field "type" di SETIAP butir blueprint adalah tipe soal yang WAJIB kamu pakai untuk butir itu -- BUKAN sekadar saran. Kalau blueprint #5 punya "type":"truefalse", soal nomor 5 WAJIB berupa soal Benar/Salah, BUKAN pilihan ganda. Variasikan sesuai field "type" masing-masing butir, JANGAN membuat semua soal jadi tipe "multiple" begitu saja.',

    'Output hanya JSONL.',
  ].join('\n');
}

// ============================================================
// PEMANGGILAN AI PROVIDER
// ============================================================

async function callAI({
  apiKey,
  systemPrompt,
  userPrompt,
  maxTokens,
  enableBrowserSearch,
  model,
  timeoutMs,
  reasoningEffort,
}) {
  // 🔥 BARU: `model` sekarang parameter (bukan cuma baca konstanta
  // AI_MODEL langsung) supaya callAIWithFallback() bisa
  // memanggil fungsi ini berkali-kali dengan model berbeda-beda.
  // Default ke AI_MODEL kalau caller lama gak mengirim `model`
  // (jaga kompatibilitas).
  const modelToUse =
    model ||
    AI_MODEL;

  // 🔥 BARU: `timeoutMs` juga sekarang parameter opsional -- dipakai
  // callAIWithFallback() buat bagi-bagi sisa budget waktu antar
  // percobaan model. Kalau gak dikirim (mis. dipanggil langsung tanpa
  // fallback), tetap pakai logika lama (AI_TIMEOUT_MS /
  // AI_TIMEOUT_WITH_SEARCH_MS) biar kompatibel.
  const effectiveTimeoutMs =
    typeof timeoutMs ===
      'number' &&
    timeoutMs > 0
      ? timeoutMs
      : enableBrowserSearch
        ? AI_TIMEOUT_WITH_SEARCH_MS
        : AI_TIMEOUT_MS;

  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () =>
        controller.abort(),
      effectiveTimeoutMs,
    );

  try {
    const response =
      await fetch(
        AI_API_URL,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            'Content-Type':
              'application/json',

            Accept:
              'application/json',
          },

          body: JSON.stringify({
            model:
              modelToUse,

            messages: [
              {
                role: 'system',
                content:
                  systemPrompt,
              },

              {
                role: 'user',
                content:
                  userPrompt,
              },
            ],

            temperature:
              0.2,

            top_p:
              0.7,

            max_tokens:
              maxTokens,

            stream:
              false,

            // 🔥 PENTING (khusus Gemini 2.5): model ini punya mode
            // "thinking" yang AKTIF secara default. Token untuk
            // berpikir itu diambil dari jatah max_tokens yang sama --
            // artinya kalau dibiarkan, model bisa habis jatah di
            // tengah "berpikir" dan mengembalikan content KOSONG,
            // yang di sistem kita terbaca sebagai kegagalan total
            // walau sebenarnya API-nya sehat.
            //
            // Karena tugas di sini adalah menghasilkan soal terstruktur
            // (bukan memecahkan teka-teki logika berat), thinking
            // dimatikan demi keandalan & kecepatan.
            //
            // Bisa diubah lewat env AI_REASONING_EFFORT kalau suatu
            // saat mau menukar kecepatan dengan ketelitian matematika:
            // isi 'low' atau 'medium' (dan naikkan SOFT_MAX_TOKENS_
            // CEILING kalau perlu). Isi 'off' untuk tidak mengirim
            // parameter ini sama sekali (mis. kalau pindah provider
            // yang tidak mengenalinya).
            ...(reasoningEffort &&
            reasoningEffort !==
              'off'
              ? {
                  reasoning_effort:
                    reasoningEffort,
                }
              : {}),

            // Web research sudah dilakukan server SEBELUM callAI dan hasilnya
            // dimasukkan ke userPrompt. `enableBrowserSearch` di sini hanya
            // menjaga kompatibilitas timeout/pemetaan mode lama.
          }),

          signal:
            controller.signal,
        },
      );

    const responseText =
      await response.text();

    let data = null;

    try {
      data =
        responseText
          ? JSON.parse(
              responseText,
            )
          : null;
    } catch (_) {
      data = null;
    }

    // --------------------------------------------------------
    // PROVIDER ERROR
    // --------------------------------------------------------

    if (!response.ok) {
      const providerMessage =
        data?.message ||
        data?.error?.message ||
        data?.error ||
        responseText ||
        'Unknown provider error';


      const error =
        new Error(
          `AI provider HTTP ${response.status}`,
        );

      error.providerStatus =
        response.status;

      error.providerMessage =
        String(
          providerMessage,
        ).slice(
          0,
          1000,
        );

      // 🔥 CATATAN JUJUR: provider ini TIDAK mempublikasikan nama
      // header rate-limit khususnya. Makanya di sini CUMA
      // `retry-after` (header HTTP standar, aman diasumsikan ada di
      // provider mana pun yang mengimplementasikan 429 dengan benar)
      // yang dipakai -- gak ada header nama lain yang diasumsikan
      // (daripada ngarang nama yang belum tentu benar, kayak
      // pengalaman kemarin pas asumsi header GitHub Models ternyata
      // beda dari kenyataan).
      error.retryAfterSeconds =
        response.headers.get(
          'retry-after',
        ) ||
        null;

      error.traceId =
        response.headers.get(
          'x-request-id',
        ) ||
        null;

      error.attemptedModel =
        modelToUse;

      throw error;
    }

    // --------------------------------------------------------
    // RESPONSE CONTENT
    // --------------------------------------------------------

    const content =
      data
        ?.choices?.[0]
        ?.message?.content;

    if (
      typeof content !==
        'string' ||
      !content.trim()
    ) {
      const error =
        new Error(
          'Respons AI kosong.',
        );

      error.providerStatus =
        response.status;

      error.providerMessage =
        'choices[0].message.content tidak tersedia.';

      error.attemptedModel =
        modelToUse;

      throw error;
    }

    return {
      content,

      usage:
        data?.usage ||
        null,

      model:
        data?.model ||
        modelToUse,

      finishReason:
        data
          ?.choices?.[0]
          ?.finish_reason ||
        null,

      traceId:
        response.headers.get(
          'x-request-id',
        ) ||
        null,
    };

  } catch (error) {

    if (
      error?.name ===
      'AbortError'
    ) {
      const timeoutError =
        new Error(
          `Layanan AI timeout setelah ${effectiveTimeoutMs}ms.`,
        );

      timeoutError.code =
        'AI_TIMEOUT';

      timeoutError.attemptedModel =
        modelToUse;

      timeoutError.timeoutMsUsed =
        effectiveTimeoutMs;

      throw timeoutError;
    }

    if (
      error &&
      !error.attemptedModel
    ) {
      error.attemptedModel =
        modelToUse;
    }

    throw error;

  } finally {
    clearTimeout(
      timeoutId,
    );
  }
}

// 🔥 BARU: apakah error ini berarti MODEL-nya sendiri yang sudah tidak
// tersedia (dihapus dari katalog / pensiun), BUKAN jenis error lain
// (rate limit, timeout, server error, dll) yang gak akan hilang cuma
// dengan ganti model. Kalau true, callAIWithFallback lanjut coba
// model berikutnya di daftar; kalau false, error langsung dilempar ke
// pemanggil (gak ada gunanya coba model lain).
function isModelUnavailableError(
  error,
) {
  const status =
    error?.providerStatus;

  if (
    status === 404 ||
    status === 410
  ) {
    return true;
  }

  if (status === 400) {
    const msg =
      String(
        error?.providerMessage ||
          '',
      ).toLowerCase();

    if (
      msg.includes('model') &&
      (msg.includes(
        'not found',
      ) ||
        msg.includes(
          'does not exist',
        ) ||
        msg.includes(
          'unknown',
        ) ||
        msg.includes(
          'invalid',
        ))
    ) {
      return true;
    }
  }

  return false;
}

// 🔥 BARU (FIX BUG NYATA): apakah error ini rate-limit (429).
//
// KENAPA INI PERLU DIPISAH dari isModelUnavailableError(): asumsi
// SEBELUMNYA di kode ini adalah "rate limit bukan salah modelnya,
// ganti model gak akan menolong" -- itu BENAR untuk provider yang
// membatasi kuota GABUNGAN 1 akun (mis. Groq, kuotanya per organisasi
// bukan per model). TAPI Gemini TIDAK begitu -- kuota gratis Gemini
// dialokasikan TERPISAH PER MODEL (mis. gemini-3.6-flash dan
// gemini-3.5-flash-lite masing-masing punya jatah RPM/RPD SENDIRI,
// terkonfirmasi lewat dokumentasi resmi Google). Artinya kalau model
// utama kena 429, model cadangan SANGAT MUNGKIN masih longgar
// kuotanya -- pindah model JUSTRU sering menolong untuk Gemini,
// kebalikan dari asumsi lama yang terbawa dari era Groq.
function isRateLimitedError(
  error,
) {
  return error?.providerStatus === 429;
}

// 🔥 BARU: wrapper di atas callAI() yang otomatis mencoba daftar
// model cadangan (AI_MODEL_FALLBACKS) secara berurutan kalau model
// yang sedang dicoba ternyata sudah tidak tersedia lagi (404/410).
// Tujuannya: kalau provider pensiunin satu model lagi di masa depan
// (sudah kejadian 2x dalam sebulan terakhir -- Qwen 72B lalu Llama 4
// Maverick), sistem TETAP JALAN tanpa perlu edit kode/env var manual
// dulu, sampai semua model di daftar juga mati.
async function callAIWithFallback(
  args,
) {
  const modelsToTry =
    [
      AI_MODEL,
      ...AI_MODEL_FALLBACKS,
    ].filter(
      (m, i, arr) =>
        m &&
        arr.indexOf(m) === i,
    );

  // 🔥 BARU: budget waktu TOTAL buat semua percobaan gabungan (bukan
  // per-percobaan) -- supaya gak ada skenario 3 model x 45 detik yang
  // bisa melebihi maxDuration Vercel. Setiap percobaan dapat jatah dari
  // SISA budget ini, bukan jatah penuh AI_TIMEOUT_MS lagi.
  const totalBudgetMs =
    args.enableBrowserSearch
      ? TOTAL_AI_BUDGET_WITH_SEARCH_MS
      : TOTAL_AI_BUDGET_MS;

  const startedAt =
    Date.now();

  let lastError = null;

  for (
    let i = 0;
    i < modelsToTry.length;
    i++
  ) {
    const model =
      modelsToTry[i];

    const elapsedMs =
      Date.now() -
      startedAt;

    const remainingBudgetMs =
      totalBudgetMs -
      elapsedMs;

    // 🔥 Sisa waktu udah terlalu tipis buat berharap model lain
    // sempat merespons -- nyerah sekarang dengan error yang rapi,
    // daripada mulai percobaan yang nyaris pasti bakal keburu
    // dipotong duluan oleh maxDuration Vercel (yang hasilnya JUSTRU
    // error mentah dari platform, bukan JSON error kita yang jelas).
    if (
      remainingBudgetMs <
      MIN_REMAINING_BUDGET_MS
    ) {
      break;
    }

    const perAttemptTimeoutMs =
      Math.min(
        remainingBudgetMs,
        i === 0
          ? PRIMARY_ATTEMPT_MS
          : MAX_SINGLE_ATTEMPT_MS,
      );

    try {
      const result =
        await callAI({
          ...args,
          model,
          timeoutMs:
            perAttemptTimeoutMs,
          reasoningEffort:
            AI_REASONING_EFFORT,
        });

      if (i > 0) {
        // 🔥 Beri tahu caller kalau ini hasil dari model fallback,
        // BUKAN model utama -- supaya bisa dicatat di diagnostics
        // response (transparan ke guru yang pakai fitur ini).
        result.fallbackUsed = true;

        result.fallbackFromModel =
          modelsToTry[0];
      }

      return result;

    } catch (error) {
      lastError = error;

      // 🔥 PENGAMAN: kalau provider menolak parameter reasoning_effort
      // (mis. model/provider yang tidak mengenalinya membalas 400),
      // JANGAN gagal total -- ulangi sekali untuk model yang sama
      // tanpa parameter itu. Tanpa pengaman ini, satu parameter opsional
      // bisa mematikan seluruh fitur, persis pelajaran dari kejadian
      // NVIDIA: jangan biarkan detail kecil satu provider menjatuhkan
      // sistemnya.
      if (
        error?.providerStatus ===
          400 &&
        /reasoning|thinking/i.test(
          String(
            error?.providerMessage ||
              '',
          ),
        )
      ) {
        console.warn(
          `[Gemilang AI] Parameter reasoning_effort ditolak model '${model}' -- mengulang tanpa parameter itu.`,
        );

        try {
          const retryTimeoutMs =
            Math.min(
              Math.max(
                totalBudgetMs -
                  (Date.now() -
                    startedAt),
                0,
              ),
              MAX_SINGLE_ATTEMPT_MS,
            );

          if (
            retryTimeoutMs >=
            MIN_REMAINING_BUDGET_MS
          ) {
            const retryResult =
              await callAI({
                ...args,
                model,
                timeoutMs:
                  retryTimeoutMs,
                reasoningEffort:
                  'off',
              });

            if (i > 0) {
              retryResult.fallbackUsed = true;

              retryResult.fallbackFromModel =
                modelsToTry[0];
            }

            return retryResult;
          }
        } catch (retryError) {
          lastError = retryError;
        }
      }

      const isLastModel =
        i ===
        modelsToTry.length - 1;

      // 🔥 DIPERBAIKI (FIX BUG NYATA): sebelumnya rate-limit (429)
      // SENGAJA TIDAK memicu pindah model, dengan alasan "ganti model
      // gak akan menolong". Itu keliru KHUSUS untuk Gemini -- lihat
      // penjelasan lengkap di isRateLimitedError() di atas: kuota
      // Gemini terpisah PER MODEL, jadi kalau model utama kena 429,
      // model cadangan (biasanya malah punya kuota harian LEBIH
      // LONGGAR, mis. Flash-Lite vs Flash) sangat mungkin masih bisa
      // dipakai. Sekarang rate-limit JUGA memicu coba model berikutnya,
      // sama seperti model tidak tersedia (404/410) & timeout.
      const shouldTryNext =
        !isLastModel &&
        (isModelUnavailableError(
          error,
        ) ||
          isRateLimitedError(
            error,
          ) ||
          error?.code ===
            'AI_TIMEOUT');

      if (!shouldTryNext) {
        throw error;
      }

      console.warn(
        `[Gemilang AI] Model '${model}' gagal (status ${error?.providerStatus || error?.code}) -- mencoba model cadangan berikutnya: '${modelsToTry[i + 1]}'`,
      );
    }
  }

  throw lastError;
}

// ============================================================
// DIAGNOSTIK MODEL (mode GET)
// ============================================================
//
// 🔥 SENGAJA DIGABUNG DI FILE INI, BUKAN FILE api/ TERPISAH:
// project ini pakai paket Vercel Hobby yang dibatasi maksimal 12
// Serverless Function per deployment. Menambah file baru di folder
// api/ berisiko menembus batas itu dan MENGGAGALKAN SELURUH DEPLOY
// (termasuk fitur-fitur yang tadinya sehat). Karena diagnostik ini
// cuma dipakai sesekali oleh admin, jauh lebih aman menumpang di
// endpoint yang sudah ada lewat method GET -- generate soal sendiri
// pakai POST, jadi keduanya tidak saling ganggu sama sekali.
//
// CARA PAKAI (buka langsung di browser):
//   /api/generateQuizFromTopic
//     -> daftar SEMUA model yang terlihat oleh API key kamu
//   /api/generateQuizFromTopic?probe=1
//     -> UJI model mana yang beneran hidup (ini yang paling berguna)
//   /api/generateQuizFromTopic?probe=1&models=ID_1,ID_2
//     -> uji daftar model pilihan sendiri
//   /api/generateQuizFromTopic?filter=gemini
//     -> saring katalog berdasarkan kata kunci
//
// KENAPA PERLU: katalog provider TIDAK selalu bisa dipercaya penuh --
// ada model bertuliskan "Free Endpoint" yang tetap balas 404 kalau
// dipanggil. Endpoint ini bertanya LANGSUNG ke provider pakai API key
// kita, jadi hasilnya fakta hari ini, bukan tebakan dari katalog.

const AI_MODELS_URL =
  process.env.AI_MODELS_URL ||
  'https://generativelanguage.googleapis.com/v1beta/openai/models';

// Probe harus CEPAT -- tujuannya cuma memastikan model hidup, bukan
// menghasilkan jawaban bagus.
const PROBE_TIMEOUT_MS = 9_000;

// Batas jumlah model yang boleh diuji dalam 1 request -- supaya tidak
// memicu rate limit provider yang justru bikin hasil
// pengujian menyesatkan (model sehat terlihat seperti gagal).
const MAX_PROBE_MODELS = 8;

async function fetchModelCatalog(
  apiKey,
) {
  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () =>
        controller.abort(),
      15_000,
    );

  try {
    const response =
      await fetch(
        AI_MODELS_URL,
        {
          method: 'GET',

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            Accept:
              'application/json',
          },

          signal:
            controller.signal,
        },
      );

    const text =
      await response.text();

    if (!response.ok) {
      return {
        ok: false,

        status:
          response.status,

        message:
          text.slice(0, 500),

        models: [],
      };
    }

    let data = null;

    try {
      data = JSON.parse(text);
    } catch (_) {
      return {
        ok: false,

        status:
          response.status,

        message:
          'Respons katalog bukan JSON yang valid.',

        models: [],
      };
    }

    const models =
      Array.isArray(data?.data)
        ? data.data
            .map((m) => m?.id)
            .filter(
              (id) =>
                typeof id ===
                'string',
            )
            .sort()
        : [];

    return {
      ok: true,

      status:
        response.status,

      models,
    };

  } catch (error) {
    return {
      ok: false,

      status: null,

      message:
        error?.name ===
        'AbortError'
          ? 'Timeout saat mengambil katalog model.'
          : error?.message ||
            'Gagal mengambil katalog model.',

      models: [],
    };

  } finally {
    clearTimeout(timeoutId);
  }
}

async function probeModel(
  apiKey,
  model,
) {
  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () =>
        controller.abort(),
      PROBE_TIMEOUT_MS,
    );

  const startedAt = Date.now();

  try {
    const response =
      await fetch(
        AI_API_URL,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            'Content-Type':
              'application/json',

            Accept:
              'application/json',
          },

          body: JSON.stringify({
            model,

            messages: [
              {
                role: 'user',
                content:
                  'Balas satu kata: OK',
              },
            ],

            max_tokens: 5,

            temperature: 0,

            stream: false,
          }),

          signal:
            controller.signal,
        },
      );

    const elapsedMs =
      Date.now() - startedAt;

    const text =
      await response.text();

    if (response.ok) {
      let sample = null;

      try {
        const data =
          JSON.parse(text);

        sample =
          data?.choices?.[0]
            ?.message?.content ||
          null;
      } catch (_) {
        sample = null;
      }

      return {
        model,

        status: 'ok',

        httpStatus:
          response.status,

        elapsedMs,

        sample:
          sample
            ? String(sample)
                .trim()
                .slice(0, 60)
            : null,

        note:
          'Model hidup dan merespons. Aman dipakai.',
      };
    }

    let note =
      'Gagal dengan alasan lain -- lihat message.';

    if (response.status === 404) {
      note =
        'MATI: model tidak di-host lagi (walau mungkin masih terlisting di katalog). Jangan dipakai.';
    } else if (
      response.status === 410
    ) {
      note =
        'PENSIUN (end-of-life): model sudah resmi dimatikan. Jangan dipakai.';
    } else if (
      response.status === 401 ||
      response.status === 403
    ) {
      note =
        'API key ditolak / tidak punya akses ke model ini. Cek GEMINI_API_KEY.';
    } else if (
      response.status === 429
    ) {
      note =
        'Kena rate limit saat pengujian -- BUKAN berarti model mati. Tunggu sebentar lalu ulangi.';
    }

    return {
      model,

      status:
        response.status === 429
          ? 'rate_limited'
          : 'failed',

      httpStatus:
        response.status,

      elapsedMs,

      message:
        text.slice(0, 300),

      note,
    };

  } catch (error) {
    const elapsedMs =
      Date.now() - startedAt;

    if (
      error?.name ===
      'AbortError'
    ) {
      return {
        model,

        status: 'timeout',

        elapsedMs,

        note:
          `Tidak selesai dalam ${PROBE_TIMEOUT_MS}ms. PENTING: timeout BUKAN berarti model mati -- model yang balas 404 gagalnya instan. Ini biasanya "cold start" (model perlu dimuat dulu ke GPU). Coba ulangi sekali lagi; kalau kedua kalinya cepat, model ini sebenarnya sehat.`,
      };
    }

    return {
      model,

      status: 'error',

      elapsedMs,

      message:
        error?.message ||
        'Unknown error',

      note:
        'Error jaringan/runtime saat menghubungi layanan AI.',
    };

  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleModelDiagnostics(
  req,
  res,
) {
  const apiKey =
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res
      .status(500)
      .json({
        success: false,

        error:
          'GEMINI_API_KEY belum di-set di Environment Variables.',
      });
  }

  const {
    probe,
    models: modelsParam,
    filter,
  } = req.query || {};

  const catalog =
    await fetchModelCatalog(
      apiKey,
    );

  if (!catalog.ok) {
    return res
      .status(502)
      .json({
        success: false,

        error:
          'Gagal mengambil katalog model dari layanan AI.',

        diagnostics: {
          httpStatus:
            catalog.status,

          message:
            catalog.message,

          hint:
            catalog.status === 401 ||
            catalog.status === 403
              ? 'API key ditolak. Ambil key baru gratis di https://aistudio.google.com/apikey lalu simpan sebagai GEMINI_API_KEY.'
              : 'Cek koneksi atau status layanan AI.',
        },
      });
  }

  const filterText =
    typeof filter === 'string'
      ? filter
          .trim()
          .toLowerCase()
      : '';

  const filteredCatalog =
    filterText
      ? catalog.models.filter(
          (id) =>
            id
              .toLowerCase()
              .includes(filterText),
        )
      : catalog.models;

  if (!probe) {
    return res
      .status(200)
      .json({
        success: true,

        mode: 'catalog_only',

        totalInCatalog:
          catalog.models.length,

        shown:
          filteredCatalog.length,

        models: filteredCatalog,

        peringatan:
          'PENTING: daftar ini adalah katalog, BUKAN jaminan model bisa dipakai. Sebagian model di sini tetap balas 404 kalau dipanggil. Untuk memastikan, jalankan dengan ?probe=1',

        caraPakai: {
          ujiModelDefault:
            '/api/generateQuizFromTopic?probe=1',

          ujiModelPilihanSendiri:
            '/api/generateQuizFromTopic?probe=1&models=ID_MODEL_1,ID_MODEL_2',

          saringKatalog:
            '/api/generateQuizFromTopic?filter=gemini',
        },
      });
  }

  let modelsToProbe =
    typeof modelsParam === 'string'
      ? modelsParam
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean)
      : [
          AI_MODEL,
          ...AI_MODEL_FALLBACKS,
        ];

  modelsToProbe =
    modelsToProbe
      .filter(
        (m, i, arr) =>
          m &&
          arr.indexOf(m) === i,
      )
      .slice(0, MAX_PROBE_MODELS);

  const results = [];

  // Sengaja BERURUTAN (bukan paralel) supaya tidak memicu rate limit.
  for (const model of modelsToProbe) {
    results.push(
      await probeModel(
        apiKey,
        model,
      ),
    );
  }

  const working =
    results.filter(
      (r) => r.status === 'ok',
    );

  const dead =
    results.filter(
      (r) =>
        r.httpStatus === 404 ||
        r.httpStatus === 410,
    );

  const recommended =
    working.length > 0
      ? [...working].sort(
          (a, b) =>
            a.elapsedMs -
            b.elapsedMs,
        )[0].model
      : null;

  return res
    .status(200)
    .json({
      success: true,

      mode: 'probe',

      modelUtamaSaatIni:
        AI_MODEL,

      diujiSebanyak:
        results.length,

      hasil: results,

      ringkasan: {
        hidup:
          working.map(
            (r) => r.model,
          ),

        mati:
          dead.map(
            (r) => r.model,
          ),

        rekomendasi: recommended,

        langkahSelanjutnya:
          recommended
            ? `Set AI_MODEL = "${recommended}" di Vercel -> Settings -> Environment Variables, lalu Redeploy. Tidak perlu ubah kode.`
            : 'Tidak ada model yang lolos uji. Kalau semuanya "timeout", jalankan ulang sekali lagi (kemungkinan cold start). Kalau semuanya 404/410, buka /api/generateQuizFromTopic?filter=gemini untuk melihat kandidat lain, lalu uji dengan &models=',
      },

      totalDiKatalog:
        catalog.models.length,
    });
}

// ============================================================
// SAFE ERROR RESPONSE
// ============================================================

function sendAIError(
  res,
  error,
) {
  // ----------------------------------------------------------
  // TIMEOUT
  // ----------------------------------------------------------

  if (
    error?.code ===
    'AI_TIMEOUT'
  ) {
    return res
      .status(504)
      .json({
        success: false,

        error:
          'Layanan AI terlalu lama merespons.',

        diagnostics: {
          type:
            'timeout',

          timeoutMs:
            error?.timeoutMsUsed ||
            AI_TIMEOUT_MS,

          model:
            error?.attemptedModel ||
            AI_MODEL,
        },
      });
  }

  // ----------------------------------------------------------
  // RATE LIMIT (429) -- 🔥 CATATAN JUJUR: kita TIDAK bisa memastikan
  // dari respons apakah ini "kuota harian habis" atau cuma
  // "kebanyakan request dalam semenit". Maka pesan ke guru sengaja
  // digeneralisir, bukan mengarang pembedaan yang belum tentu benar.
  // ----------------------------------------------------------

  if (
    error?.providerStatus === 429
  ) {
    return res
      .status(429)
      .json({
        success: false,

        error:
          `Kuota gratis layanan AI sedang penuh (rate limit). Coba lagi dalam ${error.retryAfterSeconds || 'beberapa puluh'} detik.`,

        diagnostics: {
          type:
            'rate_limited',

          retryAfterSeconds:
            error.retryAfterSeconds ||
            null,

          model:
            error?.attemptedModel ||
            AI_MODEL,
        },
      });
  }

  // ----------------------------------------------------------
  // REQUEST TOO LARGE (413) -- seharusnya sudah dicegah oleh
  // computeMaxTokens(), tapi tetap ditangani jaga-jaga kalau blueprint
  // atau arahan guru sangat panjang.
  // ----------------------------------------------------------

  if (
    error?.providerStatus === 413
  ) {
    return res
      .status(413)
      .json({
        success: false,

        error:
          'Permintaan terlalu besar untuk diproses sekali jalan. Coba kurangi jumlah soal yang diminta, atau persingkat arahan guru.',

        diagnostics: {
          type:
            'request_too_large',

          providerMessage:
            error.providerMessage ||
            null,

          traceId:
            error.traceId ||
            null,

          model:
            error?.attemptedModel ||
            AI_MODEL,
        },
      });
  }

  // ----------------------------------------------------------
  // PROVIDER HTTP ERROR
  // ----------------------------------------------------------

  if (
    Number.isInteger(
      error?.providerStatus,
    )
  ) {
    return res
      .status(502)
      .json({
        success: false,

        error:
          'Layanan AI menolak atau gagal memproses permintaan.',

        diagnostics: {
          type:
            'provider_error',

          providerStatus:
            error.providerStatus,

          providerMessage:
            error.providerMessage ||
            null,

          traceId:
            error.traceId ||
            null,

          model:
            error?.attemptedModel ||
            AI_MODEL,

        },
      });
  }

  // ----------------------------------------------------------
  // NETWORK / RUNTIME
  // ----------------------------------------------------------

  return res
    .status(502)
    .json({
      success: false,

      error:
        'Server gagal terhubung ke layanan AI.',

      diagnostics: {
        type:
          'network_or_runtime_error',

        message:
          error?.message ||
          'Unknown error',

        model:
          error?.attemptedModel ||
          AI_MODEL,
      },
    });
}

// ============================================================
// COUNT DIAGNOSTICS
// ============================================================

function countBy(
  items,
  key,
) {
  return items.reduce(
    (
      result,
      item,
    ) => {
      const value =
        item[key] ||
        'unknown';

      result[value] =
        (result[value] || 0) +
        1;

      return result;
    },
    {},
  );
}

// ============================================================
// 🔥 BARU (FIX BUG NYATA): PEMBERSIH NAMA FORMAT UJIAN DARI
// TOPIK/MAPEL. Dilaporkan langsung dari pemakaian nyata: soal yang
// harusnya tentang Bahasa Indonesia/IPA malah berisi pertanyaan
// TENTANG TKA itu sendiri ("apakah singkatan dari TKA?", "istilah
// dalam sistem TKA", "latar belakang pelaksanaan TKA").
//
// AKAR MASALAH ADA 2 SUMBER SEKALIGUS, bukan cuma 1:
//   1. Guru mengetik "TKA [mapel]" di kolom Topik/Materi (mis. "TKA
//      IPA") -- maksudnya "buatkan soal GAYA TKA untuk IPA", tapi
//      teks ini dikirim APA ADANYA ke prompt sebagai `TOPIK: TKA IPA`
//      -- AI membaca ini sebagai "topik yang harus dibahas adalah TKA
//      dan IPA", bukan "gaya TKA, subjek IPA".
//   2. Field MAPEL pada modul induknya sendiri kadang berisi nama
//      kategori ujian (mis. "TES KOMPETENSI AKADEMIK SMP") alih-alih
//      mata pelajaran sungguhan -- ini SAMA SEKALI BUKAN mata
//      pelajaran, tapi ikut dikirim sebagai `MAPEL: ...` ke prompt.
//
// KEDUA sumber ini SAMA-SAMA dibersihkan di sini -- istilah format
// ujian yang menempel di AWAL teks dihapus, menyisakan mata pelajaran
// sungguhan di baliknya. "Gaya soal TKA" itu SUDAH ditangani terpisah
// lewat field STRATEGI SOAL di UI ("Gaya Soal Baku/Umum") -- jadi
// gak perlu (dan gak boleh) dobel disebut lagi di topik/mapel.
function stripExamFormatMention(
  rawText,
) {
  const original = String(rawText || '').trim();
  if (!original) return original;

  const prefixPatterns = [
    /^tes\s+kompetensi\s+akademik\s*/i,
    /^tes\s+kemampuan\s+akademik\s*/i,
    /^\(?\s*tka\s*\)?\s*[-:]?\s*/i,
    /^\(?\s*snbt\s*\)?\s*[-:]?\s*/i,
    /^\(?\s*utbk\s*\)?\s*[-:]?\s*/i,
    /^\(?\s*anbk\s*\)?\s*[-:]?\s*/i,
  ];

  let cleaned = original;
  let changed = true;
  // Ulangi sampai gak ada lagi prefix yang match -- jaga-jaga kalau
  // ada gabungan (mis. "TKA - Tes Kemampuan Akademik IPA").
  while (changed) {
    changed = false;
    for (const pattern of prefixPatterns) {
      const next = cleaned.replace(pattern, '').trim();
      if (next !== cleaned) {
        cleaned = next;
        changed = true;
      }
    }
  }

  // Kalau semuanya kehapus habis (teks aslinya CUMA nama ujian, tanpa
  // mata pelajaran di belakangnya sama sekali, mis. mapel modul
  // literally "TES KOMPETENSI AKADEMIK SMP" tanpa subjek), kembalikan
  // teks ASLI apa adanya -- lebih baik AI lihat teks aslinya (walau
  // membingungkan) daripada menerima STRING KOSONG yang bikin error
  // lain. Ini kasus yang PERLU DIPERBAIKI GURU di data modulnya
  // sendiri (kasih mata pelajaran sungguhan), bukan sesuatu yang bisa
  // "disembuhkan" cuma dengan membersihkan teks.
  return cleaned || original;
}


// ============================================================
// MAIN HANDLER
// ============================================================

export default async function handler(
  req,
  res,
) {
  // 🔥 BARU: catat kapan request ini mulai, dipakai buat menghitung
  // sisa waktu yang aman untuk langkah pencarian gambar Tavily di
  // akhir -- supaya total kerja (AI + gambar) gak pernah melewati
  // maxDuration 60 detik Vercel dan bikin hasil yang sudah jadi
  // hilang percuma.
  const requestStartedAt =
    Date.now();

  // ==========================================================
  // METHOD
  // ==========================================================

  // 🔥 GET = mode diagnostik model (dipakai admin lewat browser),
  // POST = generate soal (dipakai aplikasi). Digabung di satu file
  // supaya tidak menambah jumlah Serverless Function -- paket Vercel
  // Hobby dibatasi 12 function per deployment, dan menembusnya bikin
  // SELURUH deploy gagal.
  if (
    req.method === 'GET'
  ) {
    return handleModelDiagnostics(
      req,
      res,
    );
  }

  if (
    req.method !==
    'POST'
  ) {
    res.setHeader(
      'Allow',
      'GET, POST',
    );

    return res
      .status(405)
      .json({
        success: false,

        error:
          'Method not allowed.',
      });
  }

  // ==========================================================
  // BODY
  // ==========================================================

  const body =
    req.body &&
    typeof req.body ===
      'object'
      ? req.body
      : {};

  // ==========================================================
  // INPUT
  // ==========================================================

  const topic =
    stripExamFormatMention(
      safeField(
        body.topic,
      ),
    );

  const mapel =
    stripExamFormatMention(
      safeField(
        body.mapel,
        'Umum',
      ),
    );

  const kelas =
    safeField(
      body.kelas,
      'Umum',
    );

  const arahan =
    safeField(
      body.arahan,
      'Tidak ada.',
    );

  const hotsLevel =
    safeField(
      body.hotsLevel,
      'Standard',
    );

  const currentMode =
    body.sourceMode ===
    'prediction'
      ? 'prediction'
      : 'source';

  const currentYear =
    new Date()
      .getFullYear();

  const targetYear =
    String(
      body.targetYear ||
        currentYear + 1,
    ).slice(
      0,
      9,
    );

  // ==========================================================
  // TOPIC VALIDATION
  // ==========================================================

  if (!topic) {
    return res
      .status(400)
      .json({
        success: false,

        error:
          'Topik wajib diisi.',
      });
  }

  // 🔥 DIPERBAIKI (dari "tolak & suruh edit manual" jadi "otomatis
  // pulihkan sendiri"): kalau MAPEL modul induknya cuma jenjang
  // sekolah doang (SD/SMP/SMA/dst, mis. field aslinya "Tes Kompetensi
  // Akademik SMP" -> dibersihkan jadi "SMP" doang) -- SEBELUMNYA
  // sistem menolak & minta guru pergi edit data modul manual di
  // tempat lain. Itu MERIBETKAN padahal gak perlu: TOPIK yang diketik
  // guru sendiri SERING SUDAH mengandung mata pelajaran yang benar
  // (mis. topic "TKA Bahasa Indonesia" -> setelah dibersihkan jadi
  // "Bahasa Indonesia") -- jadi sekarang sistem OTOMATIS PAKAI itu
  // sebagai mapel pengganti, TANPA guru perlu buka halaman lain sama
  // sekali. Cuma benar-benar berhenti & minta bantuan kalau topic
  // JUGA gak ada info mapel yang bisa dipakai (kasus yang sudah
  // sangat jarang setelah fallback ini).
  const bareJenjangPattern =
    /^(sd|smp|sma|smk|mi|mts|ma)(\s*\/?\s*(mi|mts|ma))?$/i;

  let effectiveMapel = mapel;

  if (bareJenjangPattern.test(mapel.trim())) {
    if (
      topic &&
      !bareJenjangPattern.test(topic.trim())
    ) {
      // Topic sudah bersih (mis. "Bahasa Indonesia") dan bukan cuma
      // jenjang -- pakai ini sebagai mapel efektif. Topic asli TETAP
      // dipakai apa adanya untuk prompt (gak dihapus/diganti), supaya
      // AI tetap lihat frasa lengkapnya untuk konteks.
      effectiveMapel = topic;
    } else {
      // Topic JUGA gak membantu (kosong atau cuma jenjang juga) --
      // baru di titik ini benar-benar gak ada info mapel yang bisa
      // dipulihkan otomatis dari mana pun, jadi minta bantuan.
      return res
        .status(400)
        .json({
          success: false,

          error:
            `Mata pelajaran belum jelas (modul: "${mapel}", topik: "${topic}") -- keduanya cuma jenjang sekolah, gak ada nama mata pelajaran sama sekali. Tambahkan nama mata pelajaran (mis. "Bahasa Indonesia") di kolom Topik/Materi.`,
        });
    }
  }

  // ==========================================================
  // API KEY
  // ==========================================================

  const apiKey =
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res
      .status(500)
      .json({
        success: false,

        error:
          'GEMINI_API_KEY belum dikonfigurasi di Vercel. Ambil key GRATIS di https://aistudio.google.com/apikey (login akun Google, tanpa kartu kredit), lalu simpan sebagai environment variable GEMINI_API_KEY di Vercel -> Settings -> Environment Variables.',
      });
  }

  // ==========================================================
  // QUESTION COUNT
  // ==========================================================

  const jumlah =
    clampInt(
      body.jumlahSoal,

      1,

      MAX_QUESTION_COUNT,

      DEFAULT_QUESTION_COUNT,
    );

  // ==========================================================
  // TYPES
  // ==========================================================

  const requestedTypes =
    Array.isArray(
      body.types,
    )
      ? body.types
      : ['multiple'];

  const allowedTypes =
    [
      ...new Set(
        requestedTypes
          .map(
            (item) =>
              cleanText(
                item,
              ).toLowerCase(),
          )
          .filter(
            (item) =>
              SUPPORTED_TYPES.has(
                item,
              ),
          ),
      ),
    ];

  if (
    allowedTypes.length ===
    0
  ) {
    return res
      .status(400)
      .json({
        success: false,

        error:
          'Tipe soal tidak didukung.',

        supportedTypes:
          [...SUPPORTED_TYPES],
      });
  }

  // ==========================================================
  // 1. BUILD BLUEPRINT
  // ==========================================================

  const blueprint =
    buildCurriculumBlueprint({
      topic,
      mapel: effectiveMapel,
      kelas,
      jumlah,
      hotsLevel,
      arahan,
      allowedTypes,
    });

  // 🔥 BARU: browser_search CUMA aktif di mode "prediction" (guru
  // pilih "Prediksi Berbasis Tren" di UI) -- mode "source" (default)
  // TETAP seperti sebelumnya, gak ada browsing, cepat & hemat token.
  // Lihat penjelasan lengkap di header file soal kenapa ini dipisah.
  const enableBrowserSearch =
    currentMode === 'prediction';

  // ==========================================================
  // 1.5. RISET REFERENSI SOAL INTERNET (AMAN & TERBATAS)
  // ==========================================================

  // Tepat 1 pencarian teks per request maksimum. Kalau gagal/rate limit,
  // generator tetap lanjut tanpa riset, jadi Tavily tidak pernah membuat
  // proses generate gagal total.
  let researchResults = [];
  let researchPerformed = false;
  let researchCallUsed = 0;
  let researchSkippedReason = null;
  const tavilyApiKey =
    process.env.TAVILY_API_KEY;

  if (tavilyApiKey) {
    const research =
      await callTavilyResearchSearch(
        tavilyApiKey,
        buildResearchQuery({
          topic,
          mapel: effectiveMapel,
          kelas,
          year: targetYear,
          hotsLevel,
          blueprint,
        }),
      );

    researchResults =
      research.results;
    researchPerformed =
      research.results.length > 0;
    researchCallUsed =
      research.callUsed;
    researchSkippedReason =
      research.reason;
  } else {
    researchSkippedReason =
      'missingTavilyApiKey';
  }

  const researchContext =
    buildResearchContext(
      researchResults,
    );

  // Untuk mode riset ujian, TIDAK ADA FALLBACK ke soal karangan bebas.
  // Kalau sumber relevan tidak ditemukan, hentikan dengan error yang aman.
  if (
    !researchResults.length
  ) {
    return res
      .status(424)
      .json({
        success: false,
        error:
          'Riset soal ujian tidak menemukan referensi yang dapat digunakan. Soal tidak dibuat agar tidak menghasilkan soal yang tidak ter-grounded.',
        diagnostics: {
          researchPerformed: false,
          researchCallUsed,
          researchSkippedReason,
        },
      });
  }

  // ==========================================================
  // 2. PROMPT
  // ==========================================================

  const systemPrompt =
    buildSystemPrompt({
      allowedTypes,
      enableBrowserSearch,
    });

  const userPrompt =
    buildUserPrompt({
      topic,
      mapel: effectiveMapel,
      kelas,
      year:
        targetYear,
      currentMode,
      arahan,
      blueprint,
      researchContext,
    });

  // ==========================================================
  // 3. CALL AI PROVIDER
  // ==========================================================

  let aiResult;

  const maxTokens =
    computeMaxTokens(
      jumlah,
      enableBrowserSearch,
    );

  try {
    aiResult =
      await callAIWithFallback({
        apiKey,
        systemPrompt,
        userPrompt,
        maxTokens,
        enableBrowserSearch,
      });

  } catch (error) {
    console.error(
      '[Gemilang AI] AI provider error',
      {
        message:
          error?.message,

        providerStatus:
          error?.providerStatus,

        providerMessage:
          error?.providerMessage,

        retryAfterSeconds:
          error?.retryAfterSeconds,

        remainingRequests:
          error?.remainingRequests,

        traceId:
          error?.traceId,

        code:
          error?.code,

        model:
          error?.attemptedModel ||
          AI_MODEL,
      },
    );

    return sendAIError(
      res,
      error,
    );
  }

  // ==========================================================
  // 4. PARSE JSONL
  // ==========================================================

  const parsed =
    parseJsonLines(
      aiResult.content,
    );

  const questions = [];

  const rejectedReasons =
    {};

  const usedBlueprints =
    new Set();

  // ==========================================================
  // 5. QUALITY GATE
  // ==========================================================

  for (
    const raw of parsed
  ) {
    // META
    if (
      raw?.meta === true
    ) {
      continue;
    }

    // 🔥 BARU: DIAGNOSTIK TERPISAH -- cek TERPISAH apakah sourceRef
    // (rujukan wajib ke hasil riset internet) valid, SEBELUM
    // normalizeQuestion dipanggil. Ini MURNI buat tau APA PENYEBAB
    // dominan kalau soal ditolak -- TIDAK mengubah keputusan
    // diterima/ditolaknya sama sekali (itu tetap sepenuhnya
    // ditentukan normalizeQuestion seperti sebelumnya). Dibuat
    // terpisah dari isi normalizeQuestion() supaya ZERO risiko
    // mengubah perilaku yang sudah ada -- ini cuma "mengintip" nilai
    // yang sama yang nanti dicek ulang di dalam normalizeQuestion.
    //
    // KENAPA INI PERLU: dilaporkan langsung dari pemakaian nyata --
    // 20 dari 20 soal ditolak semua dengan label generik
    // "invalidStructure" saat guru memakai blueprint capaian manual +
    // model cadangan (gemini-3.5-flash-lite). Tanpa diagnostik ini,
    // gak ada cara tau APAKAH penyebabnya sourceRef hilang (dugaan
    // kuat: model kewalahan mengikuti blueprint manual yang rinci
    // SEKALIGUS mencantumkan rujukan riset di tiap soal) ATAU gerbang
    // validasi lain yang sama sekali berbeda -- sebelumnya cuma bisa
    // NEBAK dari 6+ kemungkinan gerbang berbeda di normalizeQuestion.
    const hasValidSourceRef =
      Number.isInteger(
        raw?.sourceRef,
      ) &&
      raw.sourceRef >= 1 &&
      raw.sourceRef <=
        researchResults.length;

    // NORMALIZE
    const normalized =
      normalizeQuestion(
        raw,
        allowedTypes,
        currentMode,
        researchResults,
        true,
      );

    if (!normalized) {
      rejectedReasons
        .invalidStructure =
        (
          rejectedReasons
            .invalidStructure ||
          0
        ) + 1;

      // 🔥 BARU: kalau soal yang ditolak ini JUGA punya sourceRef
      // tidak valid, catat SEBAGAI SUB-PENYEBAB terpisah -- kalau di
      // akhir angka ini SAMA/MENDEKATI angka invalidStructure, itu
      // KONFIRMASI KUAT sourceRef yang hilang adalah penyebab
      // dominannya, bukan sekadar salah satu dari banyak kemungkinan.
      if (!hasValidSourceRef) {
        rejectedReasons
          .likelyMissingSourceRef =
          (
            rejectedReasons
              .likelyMissingSourceRef ||
            0
          ) + 1;
      }

      continue;
    }

    // BLUEPRINT CHECK
    const blueprintCheck =
      validateAgainstBlueprint(
        normalized,
        blueprint,
      );

    if (
      !blueprintCheck.valid
    ) {
      rejectedReasons[
        blueprintCheck.reason
      ] =
        (
          rejectedReasons[
            blueprintCheck.reason
          ] ||
          0
        ) + 1;

      continue;
    }

    // BLUEPRINT DUPLICATE
    if (
      usedBlueprints.has(
        normalized.blueprintNo,
      )
    ) {
      rejectedReasons
        .duplicateBlueprint =
        (
          rejectedReasons
            .duplicateBlueprint ||
          0
        ) + 1;

      continue;
    }

    // QUESTION DUPLICATE
    if (
      isDuplicateQuestion(
        normalized.question,
        questions,
      )
    ) {
      rejectedReasons
        .duplicateQuestion =
        (
          rejectedReasons
            .duplicateQuestion ||
          0
        ) + 1;

      continue;
    }

    // ACCEPT
    questions.push(
      normalized,
    );

    usedBlueprints.add(
      normalized.blueprintNo,
    );

    if (
      questions.length >=
      jumlah
    ) {
      break;
    }

    if (
      questions.length >=
      MAX_ACCEPTED_QUESTIONS
    ) {
      break;
    }
  }

  // ==========================================================
  // 6. CHECK EMPTY
  // ==========================================================

  if (
    questions.length ===
    0
  ) {
    return res
      .status(502)
      .json({
        success: false,

        error:
          'Quality Gate tidak menemukan soal valid dari respons AI.',

        diagnostics: {
          parsedObjectCount:
            parsed.length,

          requestedCount:
            jumlah,

          acceptedCount:
            0,

          rejectedReasons,

          modelUsed:
            aiResult.model,

          finishReason:
            aiResult.finishReason,

          traceId:
            aiResult.traceId ||
            null,
        },
      });
  }

  // ==========================================================
  // 6.5. SUMBER GAMBAR
  // ==========================================================
  // Dalam mode riset, gambar harus berasal dari referensi soal yang sama.
  // TIDAK dilakukan pencarian gambar kedua karena itu dapat menghasilkan
  // gambar yang tidak sesuai dengan stimulus soal.
  const imageEnrichResult = {
    imagesFetched: questions.filter((q) => q.visualKind === 'source').length,
    tavilyCallsUsed: 0,
    cappedByBudget: false,
    cappedByTime: false,
  };

  // ==========================================================
  // 7. SORT BY BLUEPRINT
  // ==========================================================

  questions.sort(
    (a, b) =>
      (
        a.blueprintNo || 999
      ) -
      (
        b.blueprintNo || 999
      ),
  );

  // ==========================================================
  // 8. FINAL RESPONSE
  // ==========================================================

  return res
    .status(200)
    .json({
      success: true,

      questions,

      requestedCount:
        jumlah,

      returnedCount:
        questions.length,

      sourceMode:
        currentMode,

      diagnostics: {
        parsedObjectCount:
          parsed.length,

        acceptedCount:
          questions.length,

        missingCount:
          Math.max(
            jumlah -
              questions.length,
            0,
          ),

        rejectedReasons,

        modelUsed:
          aiResult.model,

        // 🔥 BARU: transparan ke guru kalau model UTAMA (AI_MODEL)
        // ternyata sudah tidak tersedia saat itu, dan sistem otomatis
        // pindah ke model cadangan tanpa gagal total.
        fallbackUsed:
          aiResult.fallbackUsed ||
          false,

        fallbackFromModel:
          aiResult.fallbackFromModel ||
          null,

        finishReason:
          aiResult.finishReason,

        usage:
          aiResult.usage,

        traceId:
          aiResult.traceId ||
          null,

        blueprintCount:
          blueprint.length,

        blueprintGenerated:
          blueprint.length,

        difficultyDistribution:
          countBy(
            questions,
            'difficulty',
          ),

        competencyDistribution:
          countBy(
            questions,
            'competency',
          ),

        // 🔥 Riset web dilakukan server via Tavily SEBELUM Gemini.
        // Kalau key tidak ada, timeout, error, atau rate limit, nilainya
        // false dan generator tetap berhasil.
        researchPerformed,

        researchCallUsed,

        researchResultCount:
          researchResults.length,

        researchSkippedReason,

        // Kolom ini dihitung dari sourceUrl yang benar-benar dikembalikan AI.
        researchBackedCount:
          questions.filter(
            (q) =>
              q.researchBacked,
          ).length,

        // 🔥 BARU: laporan hasil pencarian gambar Tavily -- kalau
        // TAVILY_API_KEY belum di-set, ketiganya bernilai 0/false
        // (fitur dilewati total, bukan error).
        imagesFetched:
          imageEnrichResult.imagesFetched,

        tavilyCallsUsed:
          imageEnrichResult.tavilyCallsUsed,

        tavilyCappedByBudget:
          imageEnrichResult.cappedByBudget,

        // 🔥 BARU: true kalau pencarian gambar dihentikan karena waktu
        // request hampir habis (bukan karena jatah panggilan habis).
        // Soal tetap terkirim lengkap -- cuma sebagian tanpa gambar.
        tavilyCappedByTime:
          imageEnrichResult.cappedByTime,
      },
    });
}