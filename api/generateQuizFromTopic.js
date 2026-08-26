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
// NVIDIA BUILD API (CHAT COMPLETIONS)
//    ↓
// JSONL PARSER
//    ↓
// LOCAL QUALITY GATE
//    ↓
// MANAGE QUIZ
//
// TANPA:
// - Jina, Tavily (search), Google Search API, Gemini, Cloudflare AI
// - SiliconFlow (dihapus -- berbayar)
// - GitHub Models (dihapus -- LAYANAN INI SUDAH RESMI TUTUP TOTAL
//   per 30 Juli 2026, dikonfirmasi langsung dari GitHub Changelog.)
// - Groq (dipindah -- terverifikasi masih AKTIF & gratis, TAPI model
//   gratisnya (openai/gpt-oss-120b) terbukti kurang akurat buat konten
//   Bahasa Indonesia + matematika presisi + gaya soal ujian formal --
//   lihat laporan nyata: soal keluar Bahasa Inggris, level SD buat
//   kelas 9 SMP, dll. NVIDIA Build nge-host model JAUH lebih besar
//   (DeepSeek, Qwen 72B, Llama 405B, dll) gratis juga, jadi dipindah
//   ke sini demi kualitas, BUKAN karena Groq rusak/tutup.)
// - Scraping
//
// KENAPA NVIDIA BUILD: terverifikasi AKTIF & gratis per Agustus 2026
// dari banyak sumber independen (build.nvidia.com) -- TANPA kartu
// kredit, endpoint kompatibel OpenAI, katalog 100+ model termasuk yang
// JAUH lebih besar dari model gratis provider lain (Llama 3.1 405B,
// Qwen 72B, DeepSeek, dst). Limitnya beda dari Groq: BUKAN batas
// harian, tapi rate per MENIT (~40 RPM, bisa naik ke 200 RPM kalau
// diajukan) -- lebih cocok buat pemakaian sehari-hari bimbel yang
// gak nge-generate ratusan kali per hari, tapi bisa beruntun pas lagi
// dipakai.
//
// ⚠️ CATATAN JUJUR: limit pastinya "tidak dipublikasikan resmi" oleh
// NVIDIA sendiri (staff bilang tergantung model & traffic keseluruhan
// saat itu) -- ~40 RPM adalah patokan yang diakui komunitas developer,
// BUKAN SLA resmi terjamin. Ini tetap dipasang sesuai keputusan bisnis
// (gratis, sudah kamu siapkan sendiri API key-nya), tapi kalau
// limitnya berubah suatu saat, itu bukan bug kode ini.
//
// ⚠️ KETERBATASAN: model-model di NVIDIA Build TIDAK punya tool
// browser_search bawaan kayak Groq punya (openai/gpt-oss-120b khusus
// di Groq). Jadi mode "Prediksi Berbasis Tren" di UI sekarang KEMBALI
// jadi label instruksi ke AI doang (AI pakai pengetahuan umum yang dia
// tahu, BUKAN riset internet real-time) -- persis seperti sebelum
// browser_search dipasang. Ini trade-off sadar demi kualitas bahasa &
// matematika yang jauh lebih baik untuk PEMAKAIAN UTAMA (mode default).
//
// ENV:
// NVIDIA_API_KEY=... (buat gratis di build.nvidia.com, daftar pakai
//   email, TANPA kartu kredit -- sudah kamu siapkan)
//
// OPTIONAL:
// NVIDIA_MODEL=meta/llama-4-maverick-17b-128e-instruct
//   (⚠️ FIX Agustus 2026: model lama `qwen/qwen2.5-72b-instruct` SUDAH
//   DIHAPUS TOTAL dari katalog NVIDIA Build (dikonfirmasi langsung di
//   build.nvidia.com -- bukan cuma di-deprecate, sudah tidak listed
//   sama sekali), makanya semua request gagal dengan providerStatus
//   404 "404 page not found". Diganti ke Llama 4 Maverick 17B-128E-
//   Instruct: terverifikasi masih berstatus "Free Endpoint" aktif per
//   Agustus 2026, model MoE general purpose & multilingual, model
//   INSTRUCT biasa (BUKAN reasoning -- jadi tetap aman dari jebakan
//   `chat_template_kwargs` yang dibutuhkan DeepSeek-R1/V4 dkk).
//   Alternatif Free Endpoint lain yang masih aktif tapi jauh lebih
//   kecil: qwen/qwen2-7b-instruct (Qwen2 lama, 7B). Kalau suatu saat
//   model ini juga hilang dari katalog, cek ulang status "Free
//   Endpoint" vs "Downloadable" di build.nvidia.com sebelum ganti --
//   "Downloadable" berarti TIDAK bisa dipanggil gratis lewat endpoint
//   hosted ini lagi.)
//
// ============================================================

export const maxDuration = 60;

// ============================================================
// CONFIG
// ============================================================

const NVIDIA_API_URL =
  'https://integrate.api.nvidia.com/v1/chat/completions';

const NVIDIA_MODEL =
  process.env.NVIDIA_MODEL ||
  'meta/llama-4-maverick-17b-128e-instruct';

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

// 🔥 CATATAN: NVIDIA Build TIDAK punya batas TPM (token/menit) yang
// ketat & terpublikasi kayak Groq (yang 8.000 TPM). Batasnya lebih ke
// arah RPM (~40/menit) dan variabel tergantung model+traffic. Angka di
// bawah ini BUKAN batas resmi NVIDIA -- ini cuma batas wajar milik kita
// sendiri, biar 1 permintaan gak minta token gila-gilaan tanpa alasan
// (hemat waktu respons & tetap proporsional ke jumlah soal yang
// diminta guru, konsisten dengan logika computeMaxTokens() di bawah).
const SOFT_MAX_TOKENS_CEILING = 8000;

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
  } else if (
    normalized.circle
  ) {
    qImage =
      buildCircleSvg(
        normalized.circle,
      );

    visualKind =
      'circle';
  } else if (
    normalized.shape
  ) {
    qImage =
      buildShapeSvg(
        normalized.shape,
      );

    visualKind =
      'shape';
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

    // 🔥 FIX PENTING: sebelumnya (waktu masih pakai Groq openai/gpt-oss-120b)
    // ada instruksi kondisional yang bilang "kamu PUNYA akses
    // browser_search" begitu mode "prediction" aktif -- itu BENAR waktu
    // itu karena Groq beneran nyediain tool browser_search bawaan. Tapi
    // NVIDIA Build TIDAK punya tool itu sama sekali, di model apa pun di
    // katalognya. Kalau instruksi lama ini dibiarkan, AI bisa
    // "berpura-pura" browsing (halusinasi seolah-olah nemu sumber),
    // padahal gak pernah beneran akses internet -- BAHAYA lebih besar
    // dari sekadar gak variatif. Makanya SEKARANG SELALU jujur "jangan
    // browsing", gak peduli mode apa pun.
    '1. Jangan browsing internet -- kamu gak punya akses itu.',

    '2. Jangan mengaku melakukan browsing.',

    '3. Jangan mengaku memakai sumber eksternal atau URL yang gak pernah kamu buka.',

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

    // 🔥 BARU: penekanan Bahasa Indonesia MUTLAK -- ditambah setelah
    // laporan nyata AI keluar Bahasa Inggris di tengah kuis Bahasa
    // Indonesia (mis. "What is the sum of 7 and 5?" muncul di kuis
    // Matematika TKA kelas 9 SMP). Ditaruh sebagai ATURAN MUTLAK
    // bernomor, bukan cuma disebut sekilas, biar bobotnya jelas setara
    // sama aturan lain yang harus dipatuhi.
    '15. SELURUH teks (question, options, explanation, statements, cause, effect, readingText, subQuestions, dll) WAJIB 100% Bahasa Indonesia baku -- KECUALI notasi matematika standar (mis. "7³", "x²", angka, simbol operasi) dan istilah teknis yang memang lazim dipakai apa adanya (mis. "HOTS"). DILARANG MUTLAK bikin soal atau pilihan jawaban dalam Bahasa Inggris.',

    // 🔥 BARU: penekanan level kesulitan sesuai jenjang -- ditambah
    // setelah laporan nyata soal level SD ("berapa hasil 7+5?") muncul
    // untuk kuis kelas 9 SMP HOTS.
    '16. Soal WAJIB sesuai jenjang kelas yang diminta -- soal kelas 9 SMP harus setara materi kurikulum kelas 9 SMP, BUKAN materi kelas yang jauh lebih rendah (mis. penjumlahan dasar, perkalian 1 digit) walau ditandai "Easy". "Easy" berarti bagian TERMUDAH dari materi kelas tersebut, BUKAN materi jenjang yang berbeda.',

    '17. Untuk mapel Matematika, gunakan operasi/rumus yang PRESIS dan bisa dihitung manual -- verifikasi ulang hasil perhitungan sebelum menuliskannya di "correct"/"explanation", jangan asal tebak angka.',

    '',

    'FORMAT:',

    '{"meta":true}',

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

    // 🔥 BARU: penekanan eksplisit soal field "type" di tiap butir
    // blueprint -- field ini BUKAN saran, itu PENUGASAN WAJIB. Sebelum
    // ini gak ditekankan sama sekali, jadi AI abai dan selalu pakai
    // "multiple" buat semua butir.
    'Field "type" di SETIAP butir blueprint adalah tipe soal yang WAJIB kamu pakai untuk butir itu -- BUKAN sekadar saran. Kalau blueprint #5 punya "type":"truefalse", soal nomor 5 WAJIB berupa soal Benar/Salah, BUKAN pilihan ganda. Variasikan sesuai field "type" masing-masing butir, JANGAN membuat semua soal jadi tipe "multiple" begitu saja.',

    'Output hanya JSONL.',
  ].join('\n');
}

// ============================================================
// GROQ API
// ============================================================

async function callNvidia({
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
        NVIDIA_API_URL,
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
              NVIDIA_MODEL,

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

            // 🔥 CATATAN: NVIDIA Build TIDAK punya tool browser_search
            // bawaan (itu fitur khusus Groq openai/gpt-oss-120b). Jadi
            // di sini `enableBrowserSearch` cuma dipakai buat pilih
            // timeout yang lebih longgar & label "MODE: prediction" di
            // prompt -- BUKAN riset internet beneran. Lihat catatan
            // jujur soal ini di header file.
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
          `NVIDIA HTTP ${response.status}`,
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

      // 🔥 CATATAN JUJUR: beda dari Groq (yang header rate-limit-nya
      // terdokumentasi jelas & sudah kita verifikasi), NVIDIA Build
      // TIDAK mempublikasikan resmi nama header rate-limit-nya --
      // staff NVIDIA sendiri bilang batasnya "tergantung model &
      // traffic keseluruhan saat itu", gak ada angka pasti yang bisa
      // dijadikan acuan header spesifik. Makanya di sini CUMA
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
          'NVIDIA response content kosong.',
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
        NVIDIA_MODEL,

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
          `NVIDIA timeout setelah ${usedTimeout}ms.`,
        );

      timeoutError.code =
        'NVIDIA_TIMEOUT';

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

function sendNvidiaError(
  res,
  error,
) {
  // ----------------------------------------------------------
  // TIMEOUT
  // ----------------------------------------------------------

  if (
    error?.code ===
    'NVIDIA_TIMEOUT'
  ) {
    return res
      .status(504)
      .json({
        success: false,

        error:
          'NVIDIA terlalu lama merespons.',

        diagnostics: {
          type:
            'timeout',

          timeoutMs:
            AI_TIMEOUT_MS,

          model:
            NVIDIA_MODEL,
        },
      });
  }

  // ----------------------------------------------------------
  // RATE LIMIT (429) -- 🔥 CATATAN JUJUR: beda dari Groq (yang
  // pembedaan RPD vs RPM/TPM bisa dipastikan dari header resmi),
  // NVIDIA gak punya header rate-limit yang terpublikasi/terverifikasi
  // buat bedain "batas harian habis" vs "kebanyakan request sesaat".
  // Jadi pesannya digeneralisir jujur -- gak ngarang pembedaan yang
  // gak bisa dipastikan benar dari NVIDIA.
  // ----------------------------------------------------------

  if (
    error?.providerStatus === 429
  ) {
    return res
      .status(429)
      .json({
        success: false,

        error:
          `NVIDIA lagi membatasi request (rate limit ~40/menit pada tier gratis). Coba lagi dalam ${error.retryAfterSeconds || 'beberapa puluh'} detik.`,

        diagnostics: {
          type:
            'rate_limited',

          retryAfterSeconds:
            error.retryAfterSeconds ||
            null,

          model:
            NVIDIA_MODEL,
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
          'Permintaan terlalu besar untuk diproses NVIDIA sekali jalan. Coba kurangi jumlah soal yang diminta, atau persingkat arahan guru.',

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
            NVIDIA_MODEL,
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
          'NVIDIA menolak atau gagal memproses permintaan.',

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
            NVIDIA_MODEL,

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
        'Server gagal terhubung ke NVIDIA.',

      diagnostics: {
        type:
          'network_or_runtime_error',

        message:
          error?.message ||
          'Unknown error',

        model:
          NVIDIA_MODEL,
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
    process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    return res
      .status(500)
      .json({
        success: false,

        error:
          'NVIDIA_API_KEY belum dikonfigurasi di Vercel. Daftar gratis di build.nvidia.com (tanpa kartu kredit), lalu simpan sebagai environment variable NVIDIA_API_KEY.',
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
      allowedTypes,
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
      await callNvidia({
        apiKey,
        systemPrompt,
        userPrompt,
        maxTokens,
        enableBrowserSearch,
      });

  } catch (error) {
    console.error(
      '[Gemilang AI] NVIDIA error',
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
          NVIDIA_MODEL,
      },
    );

    return sendNvidiaError(
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
          'Quality Gate tidak menemukan soal valid dari respons NVIDIA.',

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

        // 🔥 FIX: sebelumnya `researchPerformed: enableBrowserSearch`
        // -- itu benar waktu Groq browser_search beneran jalan. Sekarang
        // (NVIDIA, gak ada tool browsing sama sekali) SELALU false,
        // apa pun mode-nya -- jangan mengklaim riset internet terjadi
        // padahal enggak.
        researchPerformed: false,

        // 🔥 CATATAN: kolom ini akan SELALU 0 sekarang (NVIDIA gak ada
        // browser_search), dipertahankan di diagnostik biar konsisten
        // strukturnya kalau provider lain dengan tool serupa dipasang
        // lagi nanti.
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