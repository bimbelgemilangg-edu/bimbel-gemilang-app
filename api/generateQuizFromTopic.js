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
// TAVILY WEB RESEARCH (3 pencarian terarah / request, berjalan paralel)
//    ↓
// GOOGLE GEMINI API (endpoint kompatibel-OpenAI)
//    ↓
// JSONL PARSER
//    ↓
// LOCAL QUALITY GATE
//    ↓
// MANAGE QUIZ
//
// TAVILY dipakai khusus untuk mencari referensi akademik sebelum prompt dikirim
// ke Gemini. Query dipisah menjadi kerangka asesmen, contoh butir resmi, dan
// sumber pendidikan tambahan. Hasil diberi skor relevansi dan sumber yang
// terlalu umum/kebijakan dibuang sebelum masuk ke prompt AI.
//
// ⚠️ CATATAN:
// Untuk mode generator ujian, riset adalah syarat: jika tidak ada sumber yang
// cukup relevan dengan mapel + kelas + topik, generator berhenti aman dan TIDAK
// membuat soal karangan bebas. Ini sengaja supaya kualitas tidak turun diam-diam.
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
// Blueprint engine, parser JSONL, quality gate, deteksi duplikat, dan SVG
// visual tetap dipertahankan. Perubahan utama ada di mesin riset, profil TKA,
// dan quality gate substansi agar hasil benar-benar tetap berada di mapel ujian.
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
// TAVILY: RISET REFERENSI SOAL (TEXT ONLY)
// ============================================================
// Untuk menjaga kualitas akademik, riset sekarang dibagi menjadi
// beberapa query yang berjalan paralel: kerangka asesmen, contoh butir,
// dan sumber pendidikan. Jadi generator tidak lagi menggantungkan 10-20
// soal pada satu hasil pencarian campur-aduk.
const TAVILY_SEARCH_URL =
  'https://api.tavily.com/search';

const TAVILY_RESEARCH_TIMEOUT_MS = 8_000;
const MAX_RESEARCH_RESULTS = 15;
const MAX_RESEARCH_CHARS_PER_RESULT = 2_400;
const MAX_RESEARCH_CONTEXT_CHARS = 10_000;
const MAX_RESEARCH_IMAGES_PER_RESULT = 4;
const MAX_RESEARCH_QUERIES_PER_REQUEST = 3;

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

function isTkaRequest({ topic = '', mapel = '', arahan = '', examType = '', body = {} }) {
  const haystack = [
    topic,
    mapel,
    arahan,
    examType,
    body?.jenisUjian,
    body?.ujian,
    body?.exam,
    body?.examType,
    body?.assessmentType,
  ]
    .filter(Boolean)
    .join(' ');

  return /\btka\b/i.test(haystack);
}

function isLikelySubjectRequest({ mapel = '', topic = '' }) {
  const m = normalizeText(mapel);
  const t = normalizeText(topic);

  if (!m || m === 'umum' || m === 'tka') return false;

  const policyOnlyTopic = /\b(apa itu|pengertian|tujuan|kebijakan|pelaksanaan|mekanisme|jadwal|pendaftaran|manfaat|latar belakang)\b/.test(t);
  if (policyOnlyTopic && (t.includes('tka') || t.includes('tes kemampuan akademik'))) {
    return false;
  }

  return true;
}

function getTkaAllowedTypes(requestedTypes = []) {
  const officialTkaTypes = new Set([
    'multiple',     // PG satu jawaban benar
    'multiselect',  // PG kompleks, lebih dari satu jawaban benar
    'truefalse',    // PG kompleks kategori, mis. Benar/Salah
  ]);

  const filtered = [
    ...new Set(
      requestedTypes.filter((type) => officialTkaTypes.has(type)),
    ),
  ];

  return filtered.length ? filtered : ['multiple'];
}

function buildResearchQueries({
  topic,
  mapel,
  kelas,
  year,
  hotsLevel,
  blueprint,
  tkaRequest,
  subjectRequest,
}) {
  const competencyHints = Array.isArray(blueprint)
    ? blueprint
        .map((item) => `${item.competency || ''} ${item.topic || ''}`)
        .join(' ')
        .replace(/\s+/g, ' ')
        .slice(0, 850)
    : '';

  const normalizedSubject = cleanText(mapel || 'Umum');
  const normalizedTopic = cleanText(topic || '');
  const normalizedClass = cleanText(kelas || '');
  const normalizedYear = cleanText(year || '');

  // JANGAN mencari "TKA" sebagai topik kebijakan. Yang dicari adalah
  // kerangka asesmen + mapel + materi + indikator/kompetensi + contoh butir.
  // Tiga query ini sengaja dipisah berdasarkan fungsi sumber:
  // 1) kerangka resmi, 2) contoh butir resmi, 3) sumber pendidikan/ujian.
  const queries = [];

  if (tkaRequest) {
    queries.push({
      role: 'official_framework',
      query: [
        'kerangka asesmen TKA',
        normalizedSubject,
        `kelas ${normalizedClass}`,
        normalizedTopic,
        competencyHints,
        normalizedYear,
        'site:pusmendik.kemendikdasmen.go.id',
      ].filter(Boolean).join(' '),
    });

    queries.push({
      role: 'official_examples',
      query: [
        'contoh soal TKA',
        normalizedSubject,
        `kelas ${normalizedClass}`,
        normalizedTopic,
        'kompetensi subkompetensi bentuk soal kunci',
        normalizedYear,
        'site:pusmendik.kemendikdasmen.go.id/tka/tka/view',
      ].filter(Boolean).join(' '),
    });

    queries.push({
      role: 'educational_examples',
      query: [
        'contoh soal',
        normalizedSubject,
        `kelas ${normalizedClass}`,
        normalizedTopic,
        'stimulus penalaran pemecahan masalah',
        hotsLevel,
        'bukan artikel berita kebijakan',
      ].filter(Boolean).join(' '),
    });
  } else {
    queries.push({
      role: 'curriculum_reference',
      query: [
        'kisi-kisi',
        'kerangka asesmen',
        normalizedSubject,
        `kelas ${normalizedClass}`,
        normalizedTopic,
        competencyHints,
        normalizedYear,
      ].filter(Boolean).join(' '),
    });

    queries.push({
      role: 'official_or_quality_examples',
      query: [
        'contoh soal ujian',
        normalizedSubject,
        `kelas ${normalizedClass}`,
        normalizedTopic,
        hotsLevel,
        'penalaran',
      ].filter(Boolean).join(' '),
    });

    queries.push({
      role: 'assessment_examples',
      query: [
        'bank soal',
        'contoh soal',
        normalizedSubject,
        `kelas ${normalizedClass}`,
        normalizedTopic,
      ].filter(Boolean).join(' '),
    });
  }

  // Untuk permintaan mapel, pastikan semua query benar-benar mengandung
  // mapel/topik. Ini mencegah query "tentang ujian" berubah jadi artikel umum.
  if (subjectRequest) {
    return queries.filter((item) =>
      normalizeText(item.query).includes(normalizeText(normalizedSubject)),
    );
  }

  return queries;
}

function isClearlyTkaPolicyReference(item) {
  const title = normalizeText(item?.title || '');
  const content = normalizeText(item?.content || '');
  const url = normalizeText(item?.url || '');
  const haystack = `${title} ${content} ${url}`;

  const policySignals = [
    'apa itu tka',
    'tujuan tka',
    'manfaat tka',
    'latar belakang tka',
    'kebijakan tka',
    'pelaksanaan tka',
    'mekanisme tka',
    'jadwal tka',
    'pendaftaran tka',
    'peserta tka',
    'apa kepanjangan tka',
    'kepanjangan tka',
  ];

  const academicSignals = [
    'kerangka asesmen',
    'matriks asesmen',
    'subkompetensi',
    'kompetensi',
    'contoh soal',
    'contoh butir',
    'butir soal',
    'bentuk soal',
    'kunci',
  ];

  const policyHit = policySignals.some((x) => haystack.includes(x));
  const academicHit = academicSignals.some((x) => haystack.includes(x));

  // Halaman pengantar TKA yang tidak mengandung jejak matriks/contoh butir
  // bukan sumber yang layak untuk membuat soal mata pelajaran.
  if (policyHit && !academicHit) return true;

  return false;
}

function isAcademicTkaReference(item, {
  mapel = '',
  topic = '',
} = {}) {
  if (!item?.url || !item?.content) return false;
  if (isClearlyTkaPolicyReference(item)) return false;

  const title = normalizeText(item?.title || '');
  const content = normalizeText(item?.content || '');
  const url = normalizeText(item?.url || '');
  const haystack = `${title} ${content} ${url}`;

  const subject = normalizeText(mapel);
  const topicTokens = normalizeText(topic)
    .split(' ')
    .filter((token) => token.length >= 4)
    .filter((token) => ![
      'tka',
      'tes',
      'kemampuan',
      'akademik',
      'kelas',
      'ujian',
      'soal',
    ].includes(token))
    .slice(0, 10);

  const subjectHit =
    !subject ||
    subject === 'umum' ||
    haystack.includes(subject);

  const topicHit = topicTokens.length === 0 ||
    topicTokens.some((token) => haystack.includes(token));

  const academicHit =
    /kerangka asesmen|matriks asesmen|subkompetensi|contoh soal|contoh butir|butir soal|bentuk soal|kompetensi/.test(haystack);

  const officialHit =
    /pusmendik\.kemendikdasmen\.go\.id|tka\.kemendikdasmen\.go\.id/.test(url);

  // Untuk TKA mapel tertentu, sumber harus minimal punya jejak mapel +
  // materi/kompetensi akademik. Halaman umum TKA tidak cukup.
  return Boolean(
    subjectHit &&
    (topicHit || officialHit) &&
    academicHit,
  );
}

function scoreResearchResult(item, {
  topic = '',
  mapel = '',
  kelas = '',
  tkaRequest = false,
  subjectRequest = false,
  role = '',
} = {}) {
  const title = normalizeText(item?.title || '');
  const content = normalizeText(item?.content || '');
  const url = normalizeText(item?.url || '');
  const haystack = `${title} ${content} ${url}`;
  let score = 0;

  const subject = normalizeText(mapel);
  const topicTokens = normalizeText(topic)
    .split(' ')
    .filter((token) => token.length >= 4)
    .filter((token) => ![
      'tka',
      'tes',
      'kemampuan',
      'akademik',
      'kelas',
      'ujian',
      'soal',
    ].includes(token))
    .slice(0, 12);

  if (subject && subject !== 'umum' && haystack.includes(subject)) score += 18;

  for (const token of topicTokens) {
    if (haystack.includes(token)) score += 3;
  }

  if (kelas && haystack.includes(normalizeText(`kelas ${kelas}`))) score += 8;

  if (/contoh soal|contoh butir|butir soal|soal ujian|bank soal/.test(haystack)) score += 15;
  if (/kerangka asesmen|matriks asesmen|subkompetensi|kompetensi|indikator|bentuk soal|kunci/.test(haystack)) score += 12;
  if (/\.pdf\b|download|dokumen/.test(haystack)) score += 4;

  if (tkaRequest) {
    if (/pusmendik\.kemendikdasmen\.go\.id/.test(url)) score += 25;
    if (/tka\.kemendikdasmen\.go\.id/.test(url)) score += 25;

    if (role === 'official_framework') score += 18;
    if (role === 'official_examples') score += 35;
    if (role === 'educational_examples') score += 12;

    if (isClearlyTkaPolicyReference(item)) {
      score -= 80;
    }
  }

  if (subjectRequest && !subject) score -= 10;

  return score;
}

async function callTavilyResearchSearch(
  apiKey,
  queries,
  searchTimeoutMs = 8_000,
) {
  if (!apiKey || !Array.isArray(queries) || !queries.length) {
    return {
      results: [],
      callUsed: 0,
      skipped: true,
      reason: 'missingKeyOrQuery',
      queryLog: [],
    };
  }

  const runOne = async ({ role, query }) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), searchTimeoutMs);

    try {
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
            max_results: 5,
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

        return { role, query, results: [], reason, callUsed: 1 };
      }

      const data = await response.json();
      const rawResults = Array.isArray(data?.results) ? data.results : [];

      const results = rawResults
        .map((item) => {
          const rawImages = Array.isArray(item?.images) ? item.images : [];
          const images = rawImages
            .map((image) => {
              const url = typeof image === 'string' ? image : image?.url;
              const description = typeof image === 'object' ? cleanText(image?.description) : '';
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
            content: cleanText(item?.content || item?.snippet).slice(
              0,
              MAX_RESEARCH_CHARS_PER_RESULT,
            ),
            images,
            sourceRole: role,
          };
        })
        .filter(
          (item) =>
            item.title &&
            /^https?:\/\//i.test(item.url) &&
            item.content,
        );

      return {
        role,
        query,
        results,
        reason: results.length ? null : 'noUsableResults',
        callUsed: 1,
      };
    } catch (error) {
      console.error(
        `[generateQuizFromTopic] Tavily ${role} gagal: ${error?.message || error}`,
      );
      return {
        role,
        query,
        results: [],
        reason: error?.name === 'AbortError' ? 'timeout' : 'timeoutOrNetwork',
        callUsed: 1,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const batches = await Promise.all(queries.map(runOne));
  const queryLog = batches.map(({ role, query, reason, results }) => ({
    role,
    query,
    reason,
    resultCount: results.length,
  }));

  const merged = [];
  const seenUrls = new Set();

  for (const batch of batches) {
    for (const item of batch.results) {
      const key = item.url.toLowerCase();
      if (seenUrls.has(key)) continue;
      seenUrls.add(key);
      merged.push(item);
    }
  }

  return {
    results: merged,
    callUsed: batches.reduce((sum, item) => sum + item.callUsed, 0),
    skipped: merged.length === 0,
    reason: merged.length ? null : (batches.find((item) => item.reason)?.reason || 'noUsableResults'),
    queryLog,
  };
}

function buildResearchContext(results) {
  if (!Array.isArray(results) || !results.length) return '';

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
      `PERAN SUMBER: ${item.sourceRole || 'unknown'}`,
      `SKOR RELEVANSI: ${Number.isFinite(item.relevanceScore) ? item.relevanceScore : 0}`,
      `Judul: ${item.title}`,
      `URL: ${item.url}`,
      `Isi hasil pencarian: ${item.content}`,
      imageLines ? `GAMBAR SUMBER:\n${imageLines}` : 'GAMBAR SUMBER: tidak ditemukan',
    ].join('\n');

    if (total + block.length > MAX_RESEARCH_CONTEXT_CHARS) break;

    blocks.push(block);
    total += block.length;
  }

  return blocks.join('\n\n');
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
// EXAM-SPECIFIC QUALITY GATE
// ============================================================

function isLikelyTkaPolicyQuestion(text = '') {
  const normalized = normalizeText(text);
  return [
    'apa itu tka',
    'apa kepanjangan tka',
    'singkatan tka',
    'tujuan tka',
    'manfaat tka',
    'latar belakang tka',
    'pelaksanaan tka',
    'mekanisme tka',
    'kebijakan tka',
    'jadwal tka',
    'pendaftaran tka',
    'sistem tka',
  ].some((phrase) => normalized.includes(phrase));
}


function tkaTopicLooksPolicyOnly(topic = '') {
  const normalized = normalizeText(topic);
  if (!normalized) return false;
  return (
    (normalized.includes('tka') || normalized.includes('tes kemampuan akademik')) &&
    /apa itu|pengertian|tujuan|manfaat|kebijakan|pelaksanaan|mekanisme|jadwal|pendaftaran|latar belakang|sistem/.test(normalized)
  );
}
function validateExamContent(question, examProfile) {
  if (!examProfile?.isTka || !examProfile.subjectRequest) {
    return { valid: true };
  }

  const questionText = cleanText(question?.question || '');
  const explanation = cleanText(question?.explanation || '');
  const competency = cleanText(question?.competency || '');
  const options = Array.isArray(question?.options)
    ? question.options.map(cleanText).join(' ')
    : '';
  const statements = Array.isArray(question?.statements)
    ? question.statements.map((item) => cleanText(item?.text || '')).join(' ')
    : '';
  const readingText = cleanText(question?.readingText || '');
  const shortAnswer = cleanText(question?.shortAnswer || '');
  const cause = cleanText(question?.cause || '');
  const effect = cleanText(question?.effect || '');

  const allText = normalizeText([
    questionText,
    explanation,
    competency,
    options,
    statements,
    readingText,
    shortAnswer,
    cause,
    effect,
  ].join(' '));

  // TKA hanya menjadi kerangka asesmen. Jika guru memilih mapel tertentu,
  // pertanyaan tentang TKA sebagai kebijakan/program adalah salah domain.
  if (isLikelyTkaPolicyQuestion(questionText)) {
    return {
      valid: false,
      reason: 'tkaPolicyQuestion',
    };
  }

  const policyPatterns = [
    'apa itu tka',
    'kepanjangan tka',
    'singkatan tka',
    'tujuan tka',
    'manfaat tka',
    'latar belakang tka',
    'pelaksanaan tka',
    'mekanisme tka',
    'kebijakan tka',
    'jadwal tka',
    'pendaftaran tka',
    'sistem tka',
    'peserta tka',
    'instrumen tka',
  ];

  if (
    policyPatterns.some((phrase) => allText.includes(phrase)) &&
    !allText.includes(normalizeText(examProfile.topic || ''))
  ) {
    return {
      valid: false,
      reason: 'tkaPolicyContent',
    };
  }

  const topic = normalizeText(examProfile.topic || '');
  const topicTokens = topic
    .split(' ')
    .filter(
      (token) =>
        token.length >= 4 &&
        ![
          'tka',
          'tes',
          'kemampuan',
          'akademik',
          'kelas',
          'ujian',
          'soal',
        ].includes(token),
    )
    .slice(0, 10);

  const topicMatch = topicTokens.some((token) =>
    allText.includes(token),
  );

  // Bila topik guru konkret dan model menghasilkan soal yang sama sekali tidak
  // menunjukkan sinyal topik, tolak. Untuk topik matematika/IPA yang sering
  // memakai simbol/angka, topikMatch tetap hanya pagar ringan, bukan syarat mutlak.
  const classNorm = normalizeText(`kelas ${examProfile.kelas || ''}`);
  const classMentioned = classNorm && allText.includes(classNorm);

  if (
    tkaTopicLooksPolicyOnly(topic) ||
    (!topicMatch &&
      !classMentioned &&
      /\btka\b/.test(normalizeText(questionText)))
  ) {
    return {
      valid: false,
      reason: 'tkaOffSubjectContent',
    };
  }

  return { valid: true };
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
  examProfile,
}) {
  const tkaRules = examProfile?.isTka
    ? [
        '',
        'ATURAN KHUSUS TKA:',
        'TKA adalah asesmen capaian akademik pada mata pelajaran tertentu, bukan mata pelajaran bernama TKA.',
        'Jika MAPEL sudah dipilih, isi soal HARUS menguji pengetahuan/kompetensi mapel tersebut. JANGAN membuat soal tentang pengertian, singkatan, tujuan, manfaat, kebijakan, jadwal, pendaftaran, atau pelaksanaan TKA.',
        'Untuk TKA, gunakan hanya bentuk yang sesuai dengan pola resmi: multiple = pilihan ganda satu jawaban benar; multiselect = PG kompleks MCMA, lebih dari satu jawaban benar; truefalse = PG kompleks kategori untuk beberapa pernyataan, misalnya Benar/Salah.',
        'JANGAN gunakan shortanswer, matching, causeeffect, atau reading untuk TKA walaupun tipe tersebut tersedia pada UI umum.',
        'Utamakan kerangka asesmen resmi dan contoh butir TKA resmi untuk menentukan materi, kompetensi, subkompetensi, stimulus, dan karakteristik tuntutan kognitif.',
        'Soal harus terasa seperti butir asesmen akademik resmi: berbasis stimulus yang relevan, menuntut penerapan/penalaran bila blueprint menugaskannya, dan menguji kompetensi mapel, bukan hafalan tentang penyelenggaraan TKA.',
        'Untuk TKA Matematika, utamakan permasalahan kontekstual, data, representasi, estimasi, pola, geometri, aljabar, peluang, atau topik lain yang benar-benar ada pada kerangka asesmen jenjang tersebut sesuai blueprint.',
        'Untuk TKA Bahasa Indonesia, utamakan stimulus teks dan pengujian informasi tersurat/tersirat, reorganisasi, inferensi, evaluasi, atau kompetensi membaca yang ditugaskan blueprint.',
        'Jangan meniru satu sumber berkali-kali hanya dengan mengganti angka. Variasikan konteks dan struktur masalah sambil mempertahankan kompetensi dan tuntutan kognitif.',
      ]
    : [];

  return [
    'Kamu adalah Otak Akademik Bimbel Gemilang, generator soal akademik untuk siswa Indonesia.',
    'Tugas utama: membuat butir soal yang benar secara substansi, sesuai jenjang, mapel, topik, kompetensi, bentuk soal, dan blueprint.',
    '',
    'PRINSIP HIRARKI SUMBER:',
    '1. Kerangka asesmen/dokumen resmi adalah acuan untuk materi, kompetensi, subkompetensi, indikator, dan karakteristik asesmen.',
    '2. Contoh butir resmi adalah acuan utama untuk bentuk stimulus, pola penalaran, level tuntutan, dan gaya asesmen.',
    '3. Sumber pendidikan berkualitas dapat dipakai sebagai referensi tambahan, tetapi tidak boleh mengalahkan acuan resmi jika bertentangan.',
    '4. Jangan memakai artikel berita/opini tentang kebijakan ujian sebagai dasar isi soal mata pelajaran.',
    '',
    'ATURAN MUTLAK:',
    '1. Setiap soal WAJIB mempunyai sourceRef yang menunjuk pada referensi yang benar-benar mendasari soal.',
    '2. sourceRef harus merujuk pada referensi yang relevan dengan MAPEL + KELAS + TOPIK + kompetensi, bukan sekadar relevan dengan kata "TKA" atau nama ujian.',
    '3. Adaptasi berarti mempertahankan kompetensi, struktur penalaran, konteks/stimulus, dan tingkat kesulitan sumber. Jangan hanya mengganti angka lalu menyebutnya adaptasi.',
    '4. Jangan membuat soal dari pengetahuan umum apabila referensi yang tersedia tidak relevan. Lebih baik butir ditolak daripada menghasilkan soal yang melenceng.',
    '5. Ikuti blueprintNo, difficulty, competency, dan type secara persis.',
    '6. Jangan membuat blueprint tambahan dan jangan melewati blueprint.',
    '7. Untuk matematika dan sains, hitung ulang semua angka, rumus, satuan, dan kunci sebelum output.',
    '8. Satu soal harus mempunyai satu fokus yang jelas. Jangan menguji hal yang tidak ditugaskan blueprint.',
    '9. Pilihan jawaban harus homogen, masuk akal, tidak ambigu, dan hanya memiliki kunci sesuai tipe soal.',
    '10. Seluruh teks wajib Bahasa Indonesia baku, kecuali notasi matematika/simbol/istilah teknis yang memang lazim.',
    '11. "Easy" berarti tingkat termudah dalam materi/jenjang yang diminta, bukan turun ke materi kelas yang jauh lebih rendah.',
    '12. Pembahasan wajib menjelaskan alasan kunci dan tidak boleh bertentangan dengan soal.',
    '13. Jangan memasukkan kata-kata seperti "berdasarkan informasi mengenai TKA" ke dalam soal mapel. TKA hanya nama asesmen, bukan materi pelajaran.',
    '14. Untuk setiap butir, pilih referensi berdasarkan kecocokan SUBSTANSI terlebih dahulu, bukan karena judulnya mengandung TKA.',
    '15. Jangan memaksakan referensi yang hanya berisi berita, kebijakan, jadwal, pendaftaran, atau penjelasan umum TKA menjadi dasar soal akademik.',
    ...tkaRules,
    '',
    'FORMAT OUTPUT:',
    '{"meta":true}',
    '{"type":"multiple","blueprintNo":1,"sourceRef":1,"difficulty":"Easy","competency":"...","question":"...","options":["...","...","...","..."],"correct":0,"explanation":"...","answerVerification":"...","analysisSummary":"..."}',
    '{"type":"multiselect","blueprintNo":2,"sourceRef":2,"difficulty":"Medium","competency":"...","question":"...","options":["...","...","...","..."],"correctAnswers":[0,2],"explanation":"...","answerVerification":"...","analysisSummary":"..."}',
    '{"type":"truefalse","blueprintNo":3,"sourceRef":1,"difficulty":"Hard","competency":"...","question":"Tentukan benar atau salah setiap pernyataan berikut.","statements":[{"text":"...","isTrue":true},{"text":"...","isTrue":false},{"text":"...","isTrue":true}],"explanation":"...","answerVerification":"...","analysisSummary":"..."}',
    '',
    `Tipe yang diperbolehkan untuk request ini: ${allowedTypes.join(', ')}`,
    '',
    'ATURAN VISUAL:',
    '1. Grafik garis lurus -> gunakan field graph tanpa curved.',
    '2. Grafik kurva/parabola/fungsi non-linear -> gunakan graph dengan curved:true dan minimal 5 titik.',
    '3. Lingkaran -> gunakan circle.',
    '4. Bangun datar bersudut -> gunakan shape.',
    '5. Jam analog -> gunakan clock.',
    '6. Foto objek nyata hanya boleh digunakan jika sumber memang menyediakan gambar yang relevan. Jangan mencari foto untuk diagram matematika yang sebenarnya harus digambar sebagai graph/shape/circle.',
    '7. Jika visual terstruktur diperlukan untuk mengerjakan soal, field visual WAJIB diisi dan data visual harus konsisten dengan teks, opsi, dan kunci.',
    '',
    'PENTING UNTUK REFERENSI:',
    'REFERENSI bukan sekadar inspirasi. Sebelum membuat setiap soal, tentukan referensi mana yang benar-benar mendukung kompetensi dan karakteristik butir tersebut.',
    'Jika sebuah referensi hanya menjelaskan apa itu ujian/kebijakan ujian, jangan gunakan referensi itu untuk membuat soal mapel.',
    'Jika sumber contoh soal memiliki stimulus/gambar, jangan mengubah angka, label, posisi, atau data visual bila memakai gambar sumber.',
    '',
    'Output harus JSONL murni tanpa Markdown dan tanpa percakapan tambahan.',
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
  examProfile,
}) {
  const examInstruction = examProfile?.isTka
    ? [
        '',
        'KONTEKS TKA AKTIF:',
        `MAPEL TKA: ${mapel}`,
        `JENJANG: ${kelas}`,
        'Kerjakan sebagai latihan soal mata pelajaran TKA. Jangan menjadikan TKA itu sendiri sebagai topik soal.',
        'Utamakan isi dari kerangka asesmen dan contoh butir, bukan artikel pengantar kebijakan TKA.',
      ]
    : [];

  return [
    'BIMBEL GEMILANG — GENERATE QUIZ',
    `TOPIK: ${topic}`,
    `MAPEL: ${mapel}`,
    `KELAS: ${kelas}`,
    `TARGET TAHUN: ${year}`,
    `MODE: ${currentMode}`,
    `ARAHAN GURU: ${arahan}`,
    ...examInstruction,
    '',
    'REFERENSI INTERNET YANG SUDAH DICARI SERVER:',
    researchContext || 'Tidak ada referensi internet yang tersedia.',
    '',
    'ATURAN PENGGUNAAN REFERENSI:',
    'Setiap butir wajib mempunyai dasar yang jelas pada salah satu referensi.',
    'Pilih referensi yang paling relevan terhadap mapel, kelas, topik, kompetensi, dan karakteristik asesmen.',
    'Jangan memakai artikel kebijakan/berita tentang ujian sebagai pengganti contoh soal atau kerangka asesmen mapel.',
    'Tulis ulang/adaptasi, jangan copy-paste. Pertahankan logika asesmen dan tuntutan kognitif sumber.',
    'Untuk soal bergambar, hanya gunakan gambar sumber bila benar-benar merupakan bagian dari stimulus yang mendasari soal.',
    '',
    'BLUEPRINT PER BUTIR:',
    JSON.stringify(blueprint),
    '',
    `Jumlah blueprint: ${blueprint.length}`,
    'WAJIB menghasilkan tepat satu soal untuk setiap blueprint.',
    'Field "type" pada blueprint adalah tugas WAJIB, bukan saran.',
    'Setiap blueprintNo hanya boleh muncul sekali.',
    'Pastikan sourceRef dan isi soal konsisten: sumber harus benar-benar menjelaskan atau mencontohkan kompetensi/struktur yang dipakai.',
    'Jika tidak ada referensi yang mendukung topik mapel, JANGAN mengubah topik menjadi materi tentang TKA. Butir harus ditolak secara mental dan diganti dengan adaptasi dari referensi akademik yang benar-benar relevan.',
    '',
    'CHECKLIST SEBELUM OUTPUT:',
    '1. Apakah soal benar-benar menguji MAPEL yang diminta?',
    '2. Apakah levelnya sesuai KELAS yang diminta?',
    '3. Apakah topik dan kompetensi sesuai blueprint?',
    '4. Apakah format soal sesuai type?',
    '5. Apakah kunci benar secara logika/perhitungan?',
    '6. Apakah sourceRef benar-benar relevan?',
    examProfile?.isTka ? '7. Untuk TKA, apakah soal TIDAK membahas pengertian/tujuan/kebijakan/pelaksanaan TKA?' : '7. Apakah stimulus dan data soal cukup untuk dikerjakan siswa?',
    '',
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
    safeField(
      body.topic,
    );

  const mapel =
    safeField(
      body.mapel,
      'Umum',
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
  // TYPES + EXAM PROFILE
  // ==========================================================

  const requestedTypes =
    Array.isArray(body.types) ? body.types : ['multiple'];

  const requestedTypesNormalized = [
    ...new Set(
      requestedTypes
        .map((item) => cleanText(item).toLowerCase())
        .filter((item) => SUPPORTED_TYPES.has(item)),
    ),
  ];

  const explicitExamType = cleanText(
    body.examType ||
    body.jenisUjian ||
    body.ujian ||
    body.assessmentType ||
    body.exam ||
    '',
  );

  const tkaRequest = isTkaRequest({
    topic,
    mapel,
    arahan,
    examType: explicitExamType,
    body,
  });

  const subjectRequest = isLikelySubjectRequest({ mapel, topic });

  const examProfile = {
    isTka: tkaRequest,
    subjectRequest,
    mapel,
    kelas,
    topic,
    examType: explicitExamType || (tkaRequest ? 'TKA' : 'Umum'),
  };

  let allowedTypes = requestedTypesNormalized.length
    ? requestedTypesNormalized
    : ['multiple'];

  let tkaTypesAdjusted = false;
  if (tkaRequest) {
    const filteredTkaTypes = getTkaAllowedTypes(allowedTypes);
    tkaTypesAdjusted =
      filteredTkaTypes.length !== allowedTypes.length ||
      filteredTkaTypes.some((item) => !allowedTypes.includes(item));
    allowedTypes = filteredTkaTypes;
  }

  if (!allowedTypes.length) {
    return res.status(400).json({
      success: false,
      error: 'Tipe soal tidak didukung.',
      supportedTypes: [...SUPPORTED_TYPES],
    });
  }

  // ==========================================================
  // 1. BUILD BLUEPRINT
  // ==========================================================

  const blueprint = buildCurriculumBlueprint({
    topic,
    mapel,
    kelas,
    jumlah,
    hotsLevel,
    arahan,
    allowedTypes,
  });

  const enableBrowserSearch = currentMode === 'prediction';

  // ==========================================================
  // 1.5. RISET REFERENSI TERARAH
  // ==========================================================

  let researchResults = [];
  let researchPerformed = false;
  let researchCallUsed = 0;
  let researchSkippedReason = null;
  let researchQueryLog = [];
  let researchFilteredOutCount = 0;
  const tavilyApiKey = process.env.TAVILY_API_KEY;

  if (tavilyApiKey) {
    const queries = buildResearchQueries({
      topic,
      mapel,
      kelas,
      year: targetYear,
      hotsLevel,
      blueprint,
      tkaRequest,
      subjectRequest,
    }).slice(0, MAX_RESEARCH_QUERIES_PER_REQUEST);

    const research = await callTavilyResearchSearch(
      tavilyApiKey,
      queries,
      TAVILY_RESEARCH_TIMEOUT_MS,
    );

    researchCallUsed = research.callUsed;
    researchQueryLog = research.queryLog || [];
    researchSkippedReason = research.reason;

    const scored = research.results
      .map((item) => ({
        ...item,
        relevanceScore: scoreResearchResult(item, {
          topic,
          mapel,
          kelas,
          tkaRequest,
          subjectRequest,
          role: item.sourceRole,
        }),
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    const minimumScore = tkaRequest && subjectRequest ? 28 : subjectRequest ? 12 : 4;

    let filtered = scored;

    if (tkaRequest && subjectRequest) {
      filtered = scored.filter((item) =>
        item.relevanceScore >= minimumScore &&
        isAcademicTkaReference(item, {
          mapel,
          topic,
        }),
      );
    } else if (subjectRequest) {
      filtered = scored.filter((item) => item.relevanceScore >= minimumScore);
    }

    researchFilteredOutCount = scored.length - filtered.length;
    researchResults = filtered.slice(0, MAX_RESEARCH_RESULTS);
    researchPerformed = researchResults.length > 0;

    // Kalau ada sumber hasil pencarian tetapi tidak ada yang cukup relevan,
    // jangan kirim sumber sampah ke model. Ini lebih aman daripada fallback
    // diam-diam ke artikel kebijakan.
    if (!researchResults.length) {
      researchSkippedReason = 'noRelevantSubjectReferences';
    }
  } else {
    researchSkippedReason = 'missingTavilyApiKey';
  }

  const researchContext = buildResearchContext(researchResults);

  if (!researchResults.length) {
    return res.status(424).json({
      success: false,
      error:
        'Riset soal ujian tidak menemukan referensi yang cukup relevan dengan mapel, kelas, dan topik. Soal tidak dibuat agar tidak menghasilkan butir yang melenceng.',
      diagnostics: {
        researchPerformed: false,
        researchCallUsed,
        researchResultCount: 0,
        researchFilteredOutCount,
        researchSkippedReason,
        researchQueryLog,
        tkaRequest,
        subjectRequest,
        tkaTypesAdjusted,
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
      examProfile,
    });

  const userPrompt =
    buildUserPrompt({
      topic,
      mapel,
      kelas,
      year: targetYear,
      currentMode,
      arahan,
      blueprint,
      researchContext,
      examProfile,
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

    // EXAM-SPECIFIC CONTENT CHECK
    const examContentCheck =
      validateExamContent(
        normalized,
        examProfile,
      );

    if (!examContentCheck.valid) {
      rejectedReasons[examContentCheck.reason] =
        (rejectedReasons[examContentCheck.reason] || 0) + 1;
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

        researchFilteredOutCount,

        researchQueryLog,

        tkaRequest,

        subjectRequest,

        tkaTypesAdjusted,

        // Kolom ini dihitung dari sourceUrl yang benar-benar dikembalikan AI.
        researchBackedCount:
          questions.filter(
            (q) =>
              q.researchBacked,
          ).length,

        // 🔥 BARU: laporan hasil pencarian gambar Tavily -- kalau
        // Versi baru memakai Tavily untuk riset teks; pencarian gambar
        // tidak lagi dilakukan terpisah sehingga stimulus matematika tidak
        // pernah mendapatkan foto stok yang salah konteks.
        imagesFetched: 0,
        tavilyCallsUsed: researchCallUsed,
        tavilyCappedByBudget: false,
        tavilyCappedByTime: false,
      },
    });
}