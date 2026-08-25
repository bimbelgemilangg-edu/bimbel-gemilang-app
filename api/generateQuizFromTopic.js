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
// GROQ API (CHAT COMPLETIONS)
//    ↓
// JSONL PARSER
//    ↓
// LOCAL QUALITY GATE
//    ↓
// MANAGE QUIZ
//
// TANPA:
// - Jina
// - Tavily
// - Google Search API
// - Gemini
// - Cloudflare AI
// - SiliconFlow (dihapus -- berbayar)
// - GitHub Models (dihapus -- LAYANAN INI SUDAH RESMI TUTUP TOTAL
//   per 30 Juli 2026, dikonfirmasi langsung dari GitHub Changelog.
//   Kalau kamu lihat saran di mana pun yang masih nyebut GitHub
//   Models/models.github.ai/models.inference.ai.azure.com sebagai
//   opsi gratis, itu sudah basi -- jangan dipasang lagi.)
// - Scraping
//
// KENAPA GROQ: terverifikasi AKTIF per Agustus 2026, free tier
// PERMANEN (bukan trial/kredit habis), TANPA kartu kredit, endpoint
// kompatibel format OpenAI (gampang dipelihara).
//
// 🔥 KOREKSI (sebelumnya salah ketik di sini): limit gratis untuk
// `openai/gpt-oss-120b` adalah 30 request/menit, 1.000 request/HARI
// (bukan 14.400 -- itu angka model LAIN, llama-3.1-8b-instant, yang
// sempat salah kecantol ke sini), 8.000 token/menit, 200.000 token/
// hari -- per ORGANISASI (bukan per API key). Terverifikasi silang
// dari beberapa sumber independen Agustus 2026. 1.000 request/hari
// tetap lebih dari cukup untuk skala bimbel biasa, tapi kalau nanti
// dipakai bareng fitur browser_search di bawah (yang lebih boros
// token), TPD (200.000/hari) bisa jadi batas yang lebih dulu kena.
//
// ENV:
// GROQ_API_KEY=... (buat gratis di console.groq.com/keys, tinggal
//   daftar pakai email/Google, langsung dapat key, TANPA kartu kredit)
//
// OPTIONAL:
// GROQ_MODEL=openai/gpt-oss-120b
//   (⚠️ Groq MENDEPRECATE model secara rutin -- cek daftar model aktif
//   di console.groq.com/docs/models sebelum deploy kalau ragu. Model
//   default di bawah ini ("openai/gpt-oss-120b") adalah PENGGANTI
//   RESMI yang direkomendasikan Groq sendiri untuk kelas Llama-70B
//   setelah mereka deprecate llama-3.3-70b-versatile per 16 Agustus
//   2026 -- JANGAN pakai nama model itu lagi, sudah gak aktif.)
//
// 🔥 BARU: BROWSER SEARCH (mode "prediction" SAJA)
// ============================================================
// `openai/gpt-oss-120b` & `openai/gpt-oss-20b` punya tool bawaan
// `browser_search` -- dijalankan DI SERVER GROQ SENDIRI (bukan kita
// yang scraping/hosting apa pun), pakai mesin pencari Exa. Ini BEDA
// dari SearXNG (yang kita putuskan TIDAK dipakai -- lihat diskusi:
// self-hosted SearXNG rawan diblokir Google & butuh VPS berbayar).
// browser_search TIDAK butuh infrastruktur tambahan sama sekali --
// tinggal tambah field `tools` di request yang SAMA yang sudah kita
// pakai.
//
// KETERBATASAN JUJUR (jangan lupa ini pas baca kode di bawah):
// 1. "Currently Free: Available at no additional charge during BETA"
//    -- ini status BETA Groq sendiri, bisa berubah kapan saja jadi
//    berbayar. Bukan janji gratis selamanya.
// 2. Cuma teks/snippet halaman -- TIDAK bisa mengambil FILE GAMBAR
//    asli dari halaman sumber. Visual (jam, grafik) tetap dibikin
//    lokal lewat buildClockSvg()/buildGraphSvg() seperti sebelumnya.
// 3. Makan token & waktu lebih banyak (hasil pencarian masuk ke
//    context) -- makanya SENGAJA cuma diaktifkan di mode "prediction"
//    (guru pilih "Prediksi Berbasis Tren" di UI), BUKAN di mode
//    default "source" yang harus tetap cepat & hemat token buat
//    pemakaian sehari-hari.
//
// ============================================================

export const maxDuration = 60;

// ============================================================
// CONFIG
// ============================================================

const GROQ_API_URL =
  'https://api.groq.com/openai/v1/chat/completions';

const GROQ_MODEL =
  process.env.GROQ_MODEL ||
  'openai/gpt-oss-120b';

const DEFAULT_QUESTION_COUNT = 10;
const MAX_QUESTION_COUNT = 20;

const AI_TIMEOUT_MS = 45_000;

// 🔥 BARU: timeout lebih longgar khusus untuk request yang mengaktifkan
// browser_search -- AI beneran browsing beberapa halaman web dulu
// sebelum jawab, jadi butuh waktu lebih dari request biasa. Tetap
// dijaga di bawah maxDuration (60s) Vercel supaya function-nya sendiri
// gak keburu dimatikan platform sebelum sempat kirim respons error
// yang rapi.
const AI_TIMEOUT_WITH_SEARCH_MS = 55_000;

// 🔥 BARU: Groq TPM (Tokens Per Minute) untuk model `openai/gpt-oss-120b`
// di tier gratis ternyata cuma 8000 -- ini ANGKA ASLI dari pesan error
// yang benar-benar dialami ("Limit 8000, Requested 9689"), bukan
// perkiraan. Request SEBELUMNYA selalu minta `max_tokens: 9000` tetap,
// gak peduli berapa jumlah soal yang diminta guru -- untuk permintaan
// 3 soal pun tetap minta jatah 9000 token buat OUTPUT SENDIRI, ditambah
// token prompt (blueprint + instruksi), jadi gampang banget nabrak
// limit 8000 bahkan buat permintaan kecil. Sekarang max_tokens dihitung
// PROPORSIONAL ke jumlah soal yang diminta -- permintaan kecil (3 soal)
// minta token jauh lebih sedikit, gak lagi selalu minta jatah maksimal.
const GROQ_TPM_LIMIT = 8000;

// ============================================================
// 🔥 BARU: TAVILY (pencari gambar asli -- opsional)
// ============================================================
// Dipakai KHUSUS untuk mencari gambar ASLI dari internet buat:
// (1) stimulus visual soal (mis. "gambar di bawah ini candi apa?"),
// (2) pilihan jawaban berbentuk gambar (optionsAreImages).
// Groq browser_search TIDAK bisa ini -- dia cuma kasih teks/snippet,
// bukan file gambar (lihat penjelasan lengkap di header file & di
// dokumentasi resmi Groq). Tavily terverifikasi (Agustus 2026) py
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

// Batas keras jumlah panggilan Tavily PER REQUEST generate-quiz --
// jaga-jaga supaya satu permintaan guru (banyak soal, semua butuh
// gambar) gak ujug-ujug ngabisin jatah bulanan cuma dalam 1 klik.
const MAX_TAVILY_CALLS_PER_REQUEST = 8;

const TAVILY_TIMEOUT_MS = 12_000;

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
) {
  if (!tavilyApiKey) {
    // Fitur belum di-setup -- lewati total, gak ada perubahan perilaku.
    return {
      imagesFetched: 0,
      tavilyCallsUsed: 0,
      cappedByBudget: false,
    };
  }

  let callsUsed = 0;
  let imagesFetched = 0;
  let cappedByBudget = false;

  for (
    const question of questions
  ) {
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
    // opsi (mis. "Candi Prambanan", "Candi Borobudur", dst).
    if (
      question.optionsAreImages &&
      Array.isArray(
        question.options,
      ) &&
      question.options.length >
        0
    ) {
      const fetchedImages = [
        ...(question.optionImages ||
          []),
      ];

      for (
        let i = 0;
        i <
        question.options
          .length;
        i += 1
      ) {
        if (
          callsUsed >=
          MAX_TAVILY_CALLS_PER_REQUEST
        ) {
          cappedByBudget = true;
          break;
        }

        // Kalau opsi ini SUDAH punya gambar (mis. dari fallback lama),
        // jangan cari ulang -- hemat kredit.
        if (
          fetchedImages[i]
        ) {
          continue;
        }

        // Query digabung dengan topik supaya lebih spesifik (mis.
        // "Candi Prambanan" + topik "Sejarah Kerajaan Mataram Kuno"),
        // bukan cuma nama opsi polos yang bisa ambigu.
        const query =
          topic
            ? `${question.options[i]} ${topic}`
            : question.options[i];

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
    jumlah * 400;

  // 🔥 BARU: kalau browser_search aktif, hasil pencarian (snippet
  // beberapa halaman web) ikut masuk ke context -- itu makan jatah
  // TPM juga, di LUAR kendali kita (gak tau pasti berapa token
  // sebelum request jalan). Sisakan buffer JAUH lebih besar supaya
  // gak gampang nabrak limit 8.000 TPM kalau browser_search narik
  // banyak konten.
  const buffer =
    enableBrowserSearch
      ? 3500
      : 1500;

  const ceiling =
    GROQ_TPM_LIMIT -
    buffer;

  return Math.min(
    Math.max(
      estimated,
      1200,
    ),
    ceiling,
  );
}

const MAX_FIELD_LENGTH = 4_000;
const MAX_QUESTION_LENGTH = 5_000;
const MAX_EXPLANATION_LENGTH = 8_000;

const MAX_ACCEPTED_QUESTIONS = 20;

// ============================================================
// SUPPORTED TYPES
// ============================================================

const SUPPORTED_TYPES = new Set([
  'multiple',
  'truefalse',
  'multiple_select',
  'short_answer',
  'matching',
  'ordering',
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

  for (
    const difficulty
    of difficulties
  ) {
    for (
      let i = 0;
      i < difficulty.count;
      i += 1
    ) {
      const competency =
        competencies[
          (no - 1) %
            competencies.length
        ];

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

  const path =
    points
      .map(
        (
          point,
          index,
        ) =>
          `${
            index === 0
              ? 'M'
              : 'L'
          } ${mapX(
            point.x,
          ).toFixed(
            1,
          )} ${mapY(
            point.y,
          ).toFixed(
            1,
          )}`,
      )
      .join(' ');

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

function validTrueFalse(
  question,
) {
  return (
    Number.isInteger(
      question.correct,
    ) &&
    (
      question.correct === 0 ||
      question.correct === 1
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

// ============================================================
// NORMALIZE QUESTION
// ============================================================

function normalizeQuestion(
  raw,
  allowedTypes,
  currentMode,
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

  const normalized = {
    type,

    blueprintNo:
      Number.isInteger(
        raw.blueprintNo,
      )
        ? raw.blueprintNo
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

    statements:
      Array.isArray(
        raw.statements,
      )
        ? raw.statements
            .slice(0, 8)
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

  if (
    type === 'multiple_select' &&
    !validMultipleSelect(
      normalized,
    )
  ) {
    return null;
  }

  if (
    type === 'short_answer' &&
    !validShortAnswer(
      normalized,
    )
  ) {
    return null;
  }

  // ----------------------------------------------------------
  // LOCAL VISUAL
  // ----------------------------------------------------------

  let qImage;

  let visualKind =
    'none';

  if (
    normalized.clock
  ) {
    qImage =
      buildClockSvg(
        normalized.clock,
      );

    visualKind =
      'clock';
  } else if (
    normalized.graph
  ) {
    qImage =
      buildGraphSvg(
        normalized.graph,
      );

    visualKind =
      'graph';
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
          normalized.graph,
      ),

    imageHint:
      normalized.imageHint,

    visualRequired:
      Boolean(qImage),

    visualKind,

    sourceTitle:
      // 🔥 BARU: sebelumnya SELALU hardcode "Blueprint Gemilang" apa
      // pun isinya -- padahal kalau browser_search aktif, AI mungkin
      // beneran nemu sumber asli & ngisi field ini. Sekarang dipakai
      // kalau valid (bukan string kosong), fallback ke default lama
      // kalau AI gak ngisi apa-apa (mis. mode tanpa browser_search).
      cleanText(
        raw.sourceTitle,
      ).slice(0, 300) ||
      'Blueprint Gemilang',

    sourceUrl:
      // Validasi sederhana: cuma terima yang beneran kelihatan kayak
      // URL http/https -- kalau AI ngarang teks bukan URL (atau
      // kosong), dibuang jadi string kosong daripada nyimpen sampah.
      /^https?:\/\/\S+$/i.test(
        cleanText(raw.sourceUrl),
      )
        ? cleanText(
            raw.sourceUrl,
          ).slice(0, 500)
        : '',

    researchBacked:
      /^https?:\/\/\S+$/i.test(
        cleanText(raw.sourceUrl),
      ),

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

    // 🔥 BARU: aturan #1-3 sekarang KONDISIONAL. Sebelumnya SELALU
    // melarang browsing & klaim sumber eksternal -- itu benar untuk
    // mode default (jujur, karena memang gak ada browsing terjadi).
    // Tapi begitu `browser_search` diaktifkan (mode "prediction"),
    // larangan itu JUSTRU KONTRADIKTIF dengan tool yang baru dipasang
    // -- AI perlu diberi tau dia BOLEH dan SEHARUSNYA browsing, dan
    // WAJIB jujur soal sumber yang dia temukan (bukan lagi dilarang
    // ngaku pakai sumber eksternal).
    ...(enableBrowserSearch
      ? [
          '1. Kamu PUNYA akses browser_search -- WAJIB dipakai untuk cari referensi tren/pola soal ujian terkini (mis. kisi-kisi UTBK/TKA terbaru) sebelum menyusun soal, terutama untuk butir blueprint dengan tingkat kesulitan Hard/HOTS.',
          '2. Kalau soal terinspirasi dari sumber yang kamu temukan lewat browser_search, isi field "sourceTitle" dan "sourceUrl" dengan judul & URL ASLI dari sumber itu. Jangan mengarang URL yang gak pernah kamu buka.',
          '3. Kalau kamu TIDAK menemukan sumber relevan untuk suatu butir, kosongkan "sourceTitle"/"sourceUrl" -- jangan mengarang supaya kelihatan "berbasis riset".',
        ]
      : [
          '1. Jangan browsing.',
          '2. Jangan mengaku melakukan browsing.',
          '3. Jangan mengaku memakai sumber eksternal.',
        ]),

    '4. Jangan menyalin soal dari sumber tertentu secara verbatim/kata-per-kata -- soal harus tetap hasil susunan sendiri berdasarkan pola/kompetensi yang dipelajari.',

    '5. Setiap soal harus mempunyai blueprintNo.',

    '6. Setiap blueprintNo hanya boleh digunakan satu kali.',

    '7. Ikuti difficulty dari blueprint.',

    '8. Ikuti competency dari blueprint.',

    '9. Untuk multiple hanya satu jawaban benar.',

    '10. Periksa kembali semua perhitungan angka.',

    '11. Jangan membuat pilihan jawaban yang ambigu.',

    '12. Pembahasan harus menjelaskan alasan jawaban.',

    '13. Jangan menggunakan Markdown dalam output.',

    '14. Jangan memberikan percakapan tambahan.',

    '',

    'FORMAT:',

    '{"meta":true}',

    enableBrowserSearch
      ? '{"type":"multiple","blueprintNo":1,"difficulty":"Easy","competency":"...","question":"...","options":["...","...","...","..."],"correct":0,"explanation":"...","answerVerification":"...","analysisSummary":"...","sourceTitle":"...","sourceUrl":"..."}'
      : '{"type":"multiple","blueprintNo":1,"difficulty":"Easy","competency":"...","question":"...","options":["...","...","...","..."],"correct":0,"explanation":"...","answerVerification":"...","analysisSummary":"..."}',

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

    '1. GRAFIK FUNGSI / KURVA / PARABOLA / GARIS LURUS -> WAJIB pakai "graph" (lihat contoh di bawah). JANGAN PERNAH pakai "needsImage" buat ini -- gak ada foto asli buat grafik yang kamu karang sendiri.',

    '2. JAM ANALOG -> WAJIB pakai "clock". JANGAN pakai "needsImage".',

    '3. DIAGRAM ABSTRAK LAIN (pohon peluang, diagram Venn, bagan alur, tabel data, garis bilangan, dll) -> JELASKAN LENGKAP di teks "question" itu sendiri (semua angka/label yang relevan disebutkan di kalimat soal). JANGAN pakai "needsImage" buat ini juga -- diagram abstrak yang kamu karang sendiri TIDAK PERNAH punya padanan foto asli di internet.',

    '4. "needsImage"+"imageHint" HANYA untuk FOTO OBJEK/TEMPAT/MAKHLUK NYATA yang BENERAN ada fotonya di dunia (mis. "Candi Prambanan", "ayam jantan", "Menara Eiffel", "gunung berapi"). Kalau ragu apakah sesuatu itu "benda nyata yang bisa difoto" atau "diagram/konsep yang kamu karang" -> PILIH ATURAN 1-3, JANGAN needsImage.',

    '',

    'VISUAL CLOCK:',

    '"clock":{"hour":8,"minute":30}',

    '',

    'VISUAL GRAPH:',

    '"graph":{"points":[{"x":0,"y":0},{"x":1,"y":2}],"xLabel":"x","yLabel":"y"}',

    '',

    'IMAGE (HANYA untuk foto objek/tempat/makhluk NYATA, baca ATURAN VISUAL #4 di atas):',

    '"needsImage":true,"imageHint":"English image description of a REAL photographable subject"',

    // 🔥 Diingatkan eksplisit ke AI juga -- biar dia gak nyoba nulis
    // URL gambar asli dari hasil browser_search ke field ini (dia
    // cuma bisa akses teks/snippet halaman, bukan file gambarnya).
    ...(enableBrowserSearch
      ? [
          '(Catatan: browser_search cuma kasih kamu TEKS halaman, BUKAN file gambar. Kalau butuh visual, tetap pakai clock/graph di atas atau needsImage+imageHint -- jangan mengarang URL gambar dari hasil pencarian.)',
        ]
      : []),

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

    'Output hanya JSONL.',
  ].join('\n');
}

// ============================================================
// GROQ API
// ============================================================

async function callGroq({
  apiKey,
  systemPrompt,
  userPrompt,
  maxTokens,
  enableBrowserSearch,
}) {
  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () =>
        controller.abort(),
      enableBrowserSearch
        ? AI_TIMEOUT_WITH_SEARCH_MS
        : AI_TIMEOUT_MS,
    );

  try {
    const response =
      await fetch(
        GROQ_API_URL,
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
              GROQ_MODEL,

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

            // 🔥 BARU: browser_search -- tool bawaan Groq (server-side,
            // pakai Exa), CUMA disisipkan kalau diminta (mode
            // "prediction"). Dibiarkan gak ada sama sekali di request
            // mode "source" biasa supaya perilaku default TETAP SAMA
            // PERSIS seperti sebelumnya -- gak ada risiko baru buat
            // pemakaian sehari-hari yang udah jalan baik.
            ...(enableBrowserSearch
              ? {
                  tools: [
                    {
                      type: 'browser_search',
                    },
                  ],
                }
              : {}),
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
          `Groq HTTP ${response.status}`,
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

      // 🔥 BARU: header rate-limit ASLI Groq (bukan tebakan -- ini
      // nama header yang benar-benar dipakai Groq, terverifikasi).
      // `retry-after` cuma muncul kalau status-nya 429. Dua pasang
      // header lain SELALU ada di tiap respons (sukses maupun gagal)
      // dan kasih tau sisa jatah -- disimpan di sini juga supaya bisa
      // dipakai sendGroqError() buat kasih pesan yang jujur & spesifik
      // (RPM habis vs RPD habis vs TPM habis, tiga hal beda).
      error.retryAfterSeconds =
        response.headers.get(
          'retry-after',
        ) ||
        null;

      error.remainingRequests =
        response.headers.get(
          'x-ratelimit-remaining-requests',
        ) ||
        null;

      error.resetRequests =
        response.headers.get(
          'x-ratelimit-reset-requests',
        ) ||
        null;

      error.remainingTokens =
        response.headers.get(
          'x-ratelimit-remaining-tokens',
        ) ||
        null;

      error.resetTokens =
        response.headers.get(
          'x-ratelimit-reset-tokens',
        ) ||
        null;

      error.traceId =
        response.headers.get(
          'x-request-id',
        ) ||
        null;

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
          'Groq response content kosong.',
        );

      error.providerStatus =
        response.status;

      error.providerMessage =
        'choices[0].message.content tidak tersedia.';

      throw error;
    }

    return {
      content,

      usage:
        data?.usage ||
        null,

      model:
        data?.model ||
        GROQ_MODEL,

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
      const usedTimeout =
        enableBrowserSearch
          ? AI_TIMEOUT_WITH_SEARCH_MS
          : AI_TIMEOUT_MS;

      const timeoutError =
        new Error(
          `Groq timeout setelah ${usedTimeout}ms.`,
        );

      timeoutError.code =
        'GROQ_TIMEOUT';

      throw timeoutError;
    }

    throw error;

  } finally {
    clearTimeout(
      timeoutId,
    );
  }
}

// ============================================================
// SAFE ERROR RESPONSE
// ============================================================

function sendGroqError(
  res,
  error,
) {
  // ----------------------------------------------------------
  // TIMEOUT
  // ----------------------------------------------------------

  if (
    error?.code ===
    'GROQ_TIMEOUT'
  ) {
    return res
      .status(504)
      .json({
        success: false,

        error:
          'Groq terlalu lama merespons.',

        diagnostics: {
          type:
            'timeout',

          timeoutMs:
            AI_TIMEOUT_MS,

          model:
            GROQ_MODEL,
        },
      });
  }

  // ----------------------------------------------------------
  // RATE LIMIT (429) -- dibedain: kalau `resetRequests`/`resetTokens`
  // nunjukin durasi PENDEK (detik/menit), itu cuma limit RPM/TPM
  // sesaat, tunggu bentar aja. Kalau providerMessage/reset menunjukkan
  // ini limit HARIAN (RPD), guru perlu tau harus nunggu sampai besok,
  // bukan nyoba generate ulang berkali-kali dalam beberapa menit.
  // ----------------------------------------------------------

  if (
    error?.providerStatus === 429
  ) {
    const isDailyLimit =
      error.remainingRequests === '0' &&
      /[hd]/i.test(
        String(error.resetRequests || ''),
      );

    return res
      .status(429)
      .json({
        success: false,

        error:
          isDailyLimit
            ? 'Jatah gratis harian Groq untuk model ini sudah habis. Coba lagi besok, atau ganti model sementara lewat env var GROQ_MODEL.'
            : `Groq lagi dibatasi sesaat (terlalu banyak request dalam waktu singkat). Coba lagi dalam ${error.retryAfterSeconds || 'beberapa'} detik.`,

        diagnostics: {
          type:
            isDailyLimit
              ? 'daily_quota_exhausted'
              : 'rate_limited_temporary',

          retryAfterSeconds:
            error.retryAfterSeconds ||
            null,

          remainingRequests:
            error.remainingRequests ||
            null,

          resetRequests:
            error.resetRequests ||
            null,

          remainingTokens:
            error.remainingTokens ||
            null,

          resetTokens:
            error.resetTokens ||
            null,

          model:
            GROQ_MODEL,
        },
      });
  }

  // ----------------------------------------------------------
  // REQUEST TOO LARGE (413) -- seharusnya sudah dicegah oleh
  // computeMaxTokens(), tapi tetap ditangani jaga-jaga kalau blueprint
  // atau arahan guru sangat panjang sampai token prompt sendiri (bukan
  // cuma max_tokens) yang bikin total nabrak limit TPM.
  // ----------------------------------------------------------

  if (
    error?.providerStatus === 413
  ) {
    return res
      .status(413)
      .json({
        success: false,

        error:
          'Permintaan terlalu besar untuk diproses Groq sekali jalan. Coba kurangi jumlah soal yang diminta, atau persingkat arahan guru.',

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
            GROQ_MODEL,
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
          'Groq menolak atau gagal memproses permintaan.',

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
            GROQ_MODEL,

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
        'Server gagal terhubung ke Groq.',

      diagnostics: {
        type:
          'network_or_runtime_error',

        message:
          error?.message ||
          'Unknown error',

        model:
          GROQ_MODEL,
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
  // ==========================================================
  // METHOD
  // ==========================================================

  if (
    req.method !==
    'POST'
  ) {
    res.setHeader(
      'Allow',
      'POST',
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
    process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res
      .status(500)
      .json({
        success: false,

        error:
          'GROQ_API_KEY belum dikonfigurasi di Vercel. Daftar gratis di console.groq.com/keys (tanpa kartu kredit), lalu simpan sebagai environment variable GROQ_API_KEY.',
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
      mapel,
      kelas,
      jumlah,
      hotsLevel,
      arahan,
    });

  // 🔥 BARU: browser_search CUMA aktif di mode "prediction" (guru
  // pilih "Prediksi Berbasis Tren" di UI) -- mode "source" (default)
  // TETAP seperti sebelumnya, gak ada browsing, cepat & hemat token.
  // Lihat penjelasan lengkap di header file soal kenapa ini dipisah.
  const enableBrowserSearch =
    currentMode === 'prediction';

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
      mapel,
      kelas,
      year:
        targetYear,
      currentMode,
      arahan,
      blueprint,
    });

  // ==========================================================
  // 3. CALL GROQ
  // ==========================================================

  let aiResult;

  const maxTokens =
    computeMaxTokens(
      jumlah,
      enableBrowserSearch,
    );

  try {
    aiResult =
      await callGroq({
        apiKey,
        systemPrompt,
        userPrompt,
        maxTokens,
        enableBrowserSearch,
      });

  } catch (error) {
    console.error(
      '[Gemilang AI] Groq error',
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
          GROQ_MODEL,
      },
    );

    return sendGroqError(
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
          'Quality Gate tidak menemukan soal valid dari respons Groq.',

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
  // 6.5. ENRICH DENGAN GAMBAR ASLI (Tavily -- opsional)
  // ==========================================================

  const imageEnrichResult =
    await enrichQuestionsWithRealImages(
      questions,
      process.env
        .TAVILY_API_KEY,
      topic,
    );

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

        researchPerformed:
          enableBrowserSearch,

        // 🔥 BARU: sebelumnya hardcode false apa pun kondisinya --
        // sekarang hitung beneran berapa dari soal yang lolos punya
        // sumber valid (URL asli, bukan mengarang) hasil browser_search.
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
      },
    });
}