// api/researchBlueprint.js
// ============================================================
// BIMBEL GEMILANG — EXAM RESEARCH ENGINE
// MODUL 1 : RESEARCH → BLUEPRINT
// ============================================================
//
// FILOSOFI MODUL INI:
// Modul ini SAMA SEKALI TIDAK MEMBUAT SOAL.
// Tugasnya cuma menjawab pertanyaan: "Ujian ini sebenarnya
// mengukur apa saja, dan kalau guru minta N soal, sebaiknya
// dibagi ke materi apa saja?"
//
// ALUR:
// ① identifikasi ujian (examProfile)
//      ↓
// ② ambil halaman kerangka RESMI  (Cloudflare /markdown)
//      ↓
// ③ telusuri halaman turunan resmi (Cloudflare /links)
//      ↓
// ④ ekstrak domain + kompetensi   (Gemini, JSON ketat)
//      ↓
// ⑤ susun BLUEPRINT N soal        (algoritma lokal, TANPA AI)
//      ↓
// ⑥ kembalikan ke guru untuk DISETUJUI dulu
//
// KENAPA PAKAI CLOUDFLARE, BUKAN JINA, DI MODUL INI:
// Cloudflare Browser Rendering TIDAK punya fitur "cari di
// internet pakai kata kunci" -- dia cuma bisa membaca URL yang
// SUDAH kita ketahui. Di modul ini itu justru cukup, karena
// sumber kerangka resmi ujian URL-nya memang tetap dan sudah
// diketahui (lihat EXAM_PROFILES). Jadi modul ini sama sekali
// TIDAK memerlukan mesin pencari, dan tidak menghabiskan kuota
// pencarian sama sekali.
//
// KEJUJURAN DATA (ATURAN KERAS):
// Sistem WAJIB membedakan dua hal yang sering dicampur:
//   - evidence: "official"    -> benar-benar tertulis di sumber resmi
//   - evidence: "recommended" -> hitungan/rancangan Bimbel Gemilang
// Jumlah soal per submateri (misal "Pecahan 5 soal") HAMPIR SELALU
// "recommended", karena pemerintah umumnya menerbitkan domain &
// kompetensi, BUKAN distribusi jumlah soal. Sistem tidak boleh
// mengarang seolah distribusi itu ketetapan resmi.
// ============================================================

const GEMINI_MODEL = 'gemini-3.5-flash';

const GEMINI_TIMEOUT_MS = 70000;
const CF_TIMEOUT_MS = 45000;

// Batas aman biar 1 request gak kelamaan / kena limit platform.
const MAX_OFFICIAL_PAGES = 4;
const MAX_MARKDOWN_CHARS = 18000;
const MAX_TOTAL_QUESTIONS = 200;

// ============================================================
// EXAM PROFILES
// ============================================================
// Ini "otak" yang bikin engine ini gak cuma buat TKA.
// Nanti mau nambah SNBT / OSN / PAS tinggal tambah entri di sini,
// TANPA menyentuh logika di bawahnya sama sekali.

const EXAM_PROFILES = {
  TKA: {
    label: 'Tes Kemampuan Akademik (TKA)',
    authority: 'Pusmendik Kemendikdasmen',
    // Halaman awal resmi per jenjang.
    seeds: {
      SD: [
        'https://pusmendik.kemdikbud.go.id/tka/tka/view/mata-pelajaran-wajib/sd',
      ],
      SMP: [
        'https://pusmendik.kemdikbud.go.id/tka/tka/view/mata-pelajaran-wajib/smp',
      ],
      SMA: [
        'https://pusmendik.kemdikbud.go.id/tka/tka/view/mata-pelajaran-wajib/sma',
      ],
    },
    // Dipakai buat menyaring link turunan yang relevan saja.
    linkFilter: (href = '') =>
      /pusmendik|kemdikbud|kemendikdasmen/i.test(href) &&
      /tka/i.test(href),
  },
};

const normalizeLevel = (kelas = '') => {
  const value = String(kelas).toUpperCase();

  if (/SMA|SMK|MA\b|10|11|12/.test(value)) return 'SMA';
  if (/SMP|MTS|7|8|9/.test(value)) return 'SMP';
  return 'SD';
};

// ============================================================
// HELPERS
// ============================================================

const sanitizeText = (value = '') =>
  String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .trim();

const fetchWithTimeout = async (
  url,
  options = {},
  timeoutMs = 30000
) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
};

// ============================================================
// CLOUDFLARE BROWSER RENDERING
// ============================================================

const cfEndpoint = (action) =>
  `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/${action}`;

async function cloudflareCall(action, body) {
  if (
    !process.env.CLOUDFLARE_ACCOUNT_ID ||
    !process.env.CLOUDFLARE_API_TOKEN
  ) {
    throw new Error(
      'CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN belum tersedia di environment.'
    );
  }

  const response = await fetchWithTimeout(
    cfEndpoint(action),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      },
      body: JSON.stringify(body),
    },
    CF_TIMEOUT_MS
  );

  const raw = await response.text();

  if (!response.ok) {
    let detail = raw;
    try {
      const parsed = JSON.parse(raw);
      detail =
        parsed?.errors?.[0]?.message ||
        parsed?.error ||
        raw;
    } catch (_) {}

    const error = new Error(
      `CLOUDFLARE_${action.toUpperCase()}_HTTP_${response.status}: ${String(
        detail
      ).slice(0, 400)}`
    );
    error.status = response.status;
    throw error;
  }

  try {
    return JSON.parse(raw);
  } catch (_) {
    return { success: true, result: raw };
  }
}

// Ambil isi halaman sebagai Markdown (jauh lebih hemat token
// dibanding HTML mentah, dan struktur judul/tabelnya kejaga).
async function fetchMarkdown(url) {
  const data = await cloudflareCall('markdown', { url });

  const markdown =
    typeof data?.result === 'string'
      ? data.result
      : data?.result?.markdown ||
        data?.result?.content ||
        '';

  return String(markdown || '').slice(0, MAX_MARKDOWN_CHARS);
}

// Ambil daftar link di halaman, buat nemu halaman turunan resmi
// (misal halaman per mata pelajaran).
async function fetchLinks(url) {
  try {
    const data = await cloudflareCall('links', { url });

    const links = Array.isArray(data?.result)
      ? data.result
      : Array.isArray(data?.result?.links)
      ? data.result.links
      : [];

    return links
      .map((item) =>
        typeof item === 'string' ? item : item?.url || item?.href || ''
      )
      .filter(Boolean);
  } catch (error) {
    // Link discovery itu BONUS, bukan syarat wajib. Kalau gagal,
    // kita tetap lanjut pakai halaman seed saja -- jangan sampai
    // seluruh proses batal cuma karena pelengkap ini gagal.
    console.error('[Gemilang Blueprint] fetchLinks gagal:', error.message);
    return [];
  }
}

// ============================================================
// GEMINI
// ============================================================

async function callGemini(systemPrompt, userPrompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY belum tersedia.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.1,
          topP: 0.9,
          maxOutputTokens: 8000,
          // Sama alasannya seperti di generateQuizFromTopic.js:
          // token "mikir" internal diambil dari jatah output yang
          // sama, jadi dimatikan supaya habis buat hasil akhirnya.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    },
    GEMINI_TIMEOUT_MS
  );

  const raw = await response.text();

  if (!response.ok) {
    let detail = raw;
    try {
      detail = JSON.parse(raw)?.error?.message || raw;
    } catch (_) {}
    throw new Error(
      `GEMINI_HTTP_${response.status}: ${String(detail).slice(0, 400)}`
    );
  }

  const data = JSON.parse(raw);

  return (
    data?.candidates?.[0]?.content?.parts
      ?.filter((part) => typeof part?.text === 'string')
      ?.map((part) => part.text)
      ?.join('\n') || ''
  );
}

// Ambil object JSON pertama dari teks (jaga-jaga kalau model
// masih menyelipkan code fence atau kalimat pembuka).
const extractFirstJson = (text = '') => {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === '{') {
      if (depth === 0) start = i;
      depth += 1;
    }

    if (ch === '}') {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch (_) {
          start = -1;
        }
      }
    }
  }

  return null;
};

// ============================================================
// DISTRIBUSI SOAL (LOKAL, TANPA AI)
// ============================================================
// Pekerjaan administratif seperti "bagi 40 soal ke 3 domain"
// TIDAK perlu AI sama sekali. Dikerjakan lokal supaya hemat
// token dan hasilnya bisa dipertanggungjawabkan (deterministik,
// bisa dihitung ulang siapa pun).

function distributeByWeight(total, weights) {
  const sumWeight = weights.reduce((acc, w) => acc + w, 0);

  if (sumWeight <= 0 || total <= 0) {
    return weights.map(() => 0);
  }

  // Metode sisa terbesar (largest remainder) -- menjamin
  // jumlahnya PERSIS sama dengan total yang diminta guru,
  // gak kurang gak lebih akibat pembulatan.
  const exact = weights.map((w) => (w / sumWeight) * total);
  const floors = exact.map((v) => Math.floor(v));

  let remaining = total - floors.reduce((acc, v) => acc + v, 0);

  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  const result = [...floors];
  let cursor = 0;

  while (remaining > 0 && order.length > 0) {
    result[order[cursor % order.length].i] += 1;
    cursor += 1;
    remaining -= 1;
  }

  return result;
}

function buildBlueprint({ domains, totalQuestions }) {
  const safeDomains = (Array.isArray(domains) ? domains : []).filter(
    (d) => d && sanitizeText(d.name)
  );

  if (safeDomains.length === 0) return null;

  // Bobot domain: pakai bobot dari sumber kalau ada; kalau tidak,
  // pakai jumlah subtopik sebagai proksi cakupan materi; kalau itu
  // pun tidak ada, bagi rata.
  const domainWeights = safeDomains.map((d) => {
    if (typeof d.weight === 'number' && d.weight > 0) return d.weight;
    const subCount = Array.isArray(d.subtopics) ? d.subtopics.length : 0;
    return subCount > 0 ? subCount : 1;
  });

  const domainCounts = distributeByWeight(totalQuestions, domainWeights);

  const builtDomains = safeDomains.map((domain, index) => {
    const count = domainCounts[index];

    const subtopics = Array.isArray(domain.subtopics)
      ? domain.subtopics.filter((s) => sanitizeText(s?.name || s))
      : [];

    const subNames = subtopics.map((s) =>
      sanitizeText(typeof s === 'string' ? s : s.name)
    );

    const subWeights = subtopics.map((s) =>
      typeof s?.weight === 'number' && s.weight > 0 ? s.weight : 1
    );

    const subCounts =
      subNames.length > 0 ? distributeByWeight(count, subWeights) : [];

    return {
      name: sanitizeText(domain.name),
      // Nama domain memang dari sumber resmi -> official.
      evidence: domain.evidence === 'official' ? 'official' : 'recommended',
      recommendedCount: count,
      // Jumlah soalnya SELALU rekomendasi Gemilang, bukan ketetapan
      // pemerintah -- ditegaskan eksplisit di sini biar gak bisa
      // disalahpahami di UI nanti.
      countEvidence: 'recommended',
      competencies: Array.isArray(domain.competencies)
        ? domain.competencies.map(sanitizeText).filter(Boolean).slice(0, 12)
        : [],
      subtopics: subNames.map((name, i) => ({
        name,
        recommendedCount: subCounts[i] || 0,
        countEvidence: 'recommended',
      })),
    };
  });

  return builtDomains;
}

// ============================================================
// PROMPT
// ============================================================

const SYSTEM_PROMPT = `
Kamu adalah analis asesmen pendidikan untuk Bimbel Gemilang.

TUGASMU:
Membaca kutipan halaman RESMI tentang suatu ujian, lalu
MENGEKSTRAK struktur materi/kompetensi yang diukur.

ATURAN KERAS:

1. HANYA tulis domain/materi/kompetensi yang BENAR-BENAR
   tertulis atau tersirat jelas di bahan yang diberikan.

2. JANGAN mengarang jumlah soal. Kamu TIDAK BOLEH menentukan
   berapa soal per materi. Itu dihitung sistem, bukan kamu.

3. Kalau bahan tidak menyebutkan sesuatu, JANGAN dikira-kira.

4. Tandai "evidence":"official" HANYA kalau domain itu memang
   disebut di bahan. Kalau kamu menambahkan dari pengetahuan
   umum, tandai "recommended".

5. Jangan pakai markdown, code fence, atau teks di luar JSON.

FORMAT OUTPUT (SATU OBJECT JSON SAJA):

{
  "examIdentified": "nama ujian sesuai bahan",
  "subjectIdentified": "nama mapel",
  "levelIdentified": "SD/SMP/SMA",
  "domains": [
    {
      "name": "nama domain besar",
      "evidence": "official",
      "weight": 3,
      "competencies": ["kompetensi 1", "kompetensi 2"],
      "subtopics": [
        { "name": "nama submateri", "weight": 2 }
      ]
    }
  ],
  "cognitiveLevels": ["memahami", "menerapkan", "bernalar"],
  "visualRelevance": {
    "isVisualHeavy": true,
    "reason": "alasan singkat berbasis bahan",
    "types": ["diagram", "tabel", "grafik", "bangun"]
  },
  "notes": "catatan singkat kalau ada yang tidak ditemukan di bahan"
}

"weight" = perkiraan bobot cakupan RELATIF antar item
(angka 1-10), BUKAN jumlah soal.
`;

// ============================================================
// HANDLER
// ============================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    examType,
    subject,
    kelas,
    totalQuestions,
    targetYear,
  } = req.body || {};

  const exam = String(examType || 'TKA').toUpperCase();
  const profile = EXAM_PROFILES[exam];

  if (!profile) {
    return res.status(400).json({
      error: `Jenis ujian "${exam}" belum didukung. Saat ini tersedia: ${Object.keys(
        EXAM_PROFILES
      ).join(', ')}.`,
    });
  }

  if (!String(subject || '').trim()) {
    return res.status(400).json({ error: 'Mata pelajaran wajib diisi.' });
  }

  const level = normalizeLevel(kelas);

  const requestedTotal = parseInt(totalQuestions, 10);
  const total = Math.min(
    Math.max(Number.isFinite(requestedTotal) ? requestedTotal : 40, 1),
    MAX_TOTAL_QUESTIONS
  );

  const finalTargetYear =
    targetYear || String(new Date().getFullYear() + 1);

  // ==========================================================
  // ② + ③ AMBIL HALAMAN RESMI
  // ==========================================================

  const seeds = profile.seeds[level] || [];

  if (seeds.length === 0) {
    return res.status(400).json({
      error: `Belum ada sumber kerangka resmi terdaftar untuk ${exam} jenjang ${level}.`,
    });
  }

  const pages = [];
  const pageErrors = [];

  // Halaman seed dulu (wajib).
  for (const seedUrl of seeds) {
    try {
      const markdown = await fetchMarkdown(seedUrl);
      if (markdown.trim()) {
        pages.push({ url: seedUrl, markdown });
      }
    } catch (error) {
      console.error('[Gemilang Blueprint] seed gagal:', seedUrl, error.message);
      pageErrors.push({ url: seedUrl, message: error.message });
    }
  }

  if (pages.length === 0) {
    return res.status(502).json({
      error:
        'Gagal membaca halaman kerangka resmi. Blueprint dihentikan agar sistem tidak mengarang kompetensi.',
      debug: pageErrors,
    });
  }

  // Halaman turunan yang relevan dengan mapelnya (bonus, best-effort).
  const subjectSlug = String(subject).toLowerCase().replace(/\s+/g, '-');

  const discovered = await fetchLinks(seeds[0]);

  const candidateLinks = discovered
    .filter((href) => profile.linkFilter(href))
    .filter((href) => {
      const lower = href.toLowerCase();
      return (
        lower.includes(subjectSlug) ||
        lower.includes(String(subject).toLowerCase().split(/\s+/)[0])
      );
    })
    .filter((href) => !seeds.includes(href))
    .slice(0, MAX_OFFICIAL_PAGES - pages.length);

  for (const link of candidateLinks) {
    try {
      const markdown = await fetchMarkdown(link);
      if (markdown.trim()) {
        pages.push({ url: link, markdown });
      }
    } catch (error) {
      console.error('[Gemilang Blueprint] link gagal:', link, error.message);
      pageErrors.push({ url: link, message: error.message });
    }
  }

  // ==========================================================
  // ④ EKSTRAK KOMPETENSI (GEMINI)
  // ==========================================================

  const sourcePack = pages
    .map(
      (page, index) => `
SUMBER RESMI ${index + 1}
URL: ${page.url}

ISI:
${page.markdown}
`
    )
    .join('\n');

  const userPrompt = `
UJIAN: ${profile.label}
OTORITAS: ${profile.authority}
MATA PELAJARAN: ${String(subject).trim()}
JENJANG: ${level}
KELAS DIMINTA GURU: ${kelas || '-'}
TAHUN TARGET LATIHAN: ${finalTargetYear}

BAHAN RESMI:

${sourcePack}

Ekstrak struktur materi & kompetensi untuk MATA PELAJARAN
"${String(subject).trim()}" jenjang ${level} saja.

Ingat: JANGAN menentukan jumlah soal.
`;

  let analysis;

  try {
    const rawText = await callGemini(SYSTEM_PROMPT, userPrompt);
    analysis = extractFirstJson(rawText);

    if (!analysis) {
      return res.status(502).json({
        error:
          'Analisis kerangka resmi gagal dibaca (format balasan AI tidak sesuai).',
        debug: { rawSample: rawText.slice(0, 400) },
      });
    }
  } catch (error) {
    console.error('[Gemilang Blueprint] Gemini:', error.message);
    return res.status(502).json({
      error: 'Gagal menganalisis kerangka resmi.',
      debug: error.message,
    });
  }

  // ==========================================================
  // ⑤ SUSUN BLUEPRINT (LOKAL)
  // ==========================================================

  const domains = buildBlueprint({
    domains: analysis.domains,
    totalQuestions: total,
  });

  if (!domains) {
    return res.status(502).json({
      error:
        'Tidak ada domain/kompetensi yang berhasil diidentifikasi dari sumber resmi.',
      debug: { analysis },
    });
  }

  const officialEvidence = pages.map((page) => ({
    title: profile.authority,
    url: page.url,
  }));

  const competencyCount = domains.reduce(
    (acc, d) => acc + (d.competencies?.length || 0),
    0
  );

  // ==========================================================
  // ⑥ RESPONSE
  // ==========================================================

  return res.status(200).json({
    success: true,

    blueprint: {
      exam,
      examLabel: profile.label,
      authority: profile.authority,
      level,
      kelas: kelas || '',
      subject: String(subject).trim(),
      yearTarget: finalTargetYear,
      totalQuestions: total,

      // Pembeda paling penting di seluruh modul ini:
      // domain/kompetensi bisa "official", tapi ANGKA soal
      // per materi selalu rekomendasi Gemilang.
      distributionEvidence: 'recommended',
      distributionNote:
        'Jumlah soal per materi adalah rancangan Bimbel Gemilang berdasarkan cakupan kerangka resmi, BUKAN distribusi resmi yang ditetapkan pemerintah.',

      domains,
      cognitiveLevels: Array.isArray(analysis.cognitiveLevels)
        ? analysis.cognitiveLevels.map(sanitizeText).filter(Boolean)
        : [],
      visualRelevance: analysis.visualRelevance || null,
      officialEvidence,
      notes: sanitizeText(analysis.notes || ''),
    },

    // Ringkasan buat kartu "GEMILANG RESEARCH REPORT" di UI.
    report: {
      frameworkSources: pages.length,
      competenciesFound: competencyCount,
      domainsFound: domains.length,
      plannedQuestions: total,
      status: {
        frameworkIdentified: pages.length > 0,
        competenciesMapped: competencyCount > 0,
        readyForQuestionSearch: domains.length > 0,
      },
    },

    provider: 'Cloudflare Browser Rendering',
    model: GEMINI_MODEL,
    pageErrors,
  });
}