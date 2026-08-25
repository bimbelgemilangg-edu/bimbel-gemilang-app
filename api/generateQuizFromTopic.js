// ============================================================
// BIMBEL GEMILANG
// api/generateQuizFromTopic.js
// ============================================================
//
// FINAL RESEARCH + QUESTION ENGINE
//
// FRONTEND
//   ↓
// /api/generateQuizFromTopic
//   ↓
// LOCAL BLUEPRINT
//   ↓
// TAVILY WEB SEARCH + PAGE EXTRACTION
//   ↓
// SOURCE / VISUAL RESEARCH PACK
//   ↓
// GROQ GPT-OSS
//   ↓
// TYPE + BLUEPRINT + VISUAL QUALITY GATE
//   ↓
// MANAGE QUIZ
//
// ENV:
//   GROQ_API_KEY=...
//   TAVILY_API_KEY=...
//
// OPTIONAL:
//   GROQ_MODEL=openai/gpt-oss-120b
//
// CATATAN HAK CIPTA:
// Mesin ini boleh menemukan, menilai, dan menyimpan metadata sumber.
// Soal yang dilindungi hak cipta tidak disalin verbatim ke output.
// Model diminta membuat soal baru berbasis sumber.
// Materi/image hanya dipasang otomatis bila sumbernya jelas dapat
// digunakan kembali atau guru akan meninjaunya terlebih dahulu.
// ============================================================

export const maxDuration = 60;

const GROQ_API_URL =
  'https://api.groq.com/openai/v1/chat/completions';

const GROQ_MODEL =
  process.env.GROQ_MODEL ||
  'openai/gpt-oss-120b';

const TAVILY_SEARCH_URL =
  'https://api.tavily.com/search';

const TAVILY_EXTRACT_URL =
  'https://api.tavily.com/extract';

const DEFAULT_QUESTION_COUNT = 10;
const MAX_QUESTION_COUNT = 20;

const GROQ_TIMEOUT_MS = 50_000;
const TAVILY_TIMEOUT_MS = 15_000;

const MAX_RESEARCH_QUERIES = 4;
const MAX_SEARCH_RESULTS_PER_QUERY = 5;
const MAX_EXTRACT_URLS = 5;
const MAX_SOURCE_RESULTS = 12;
const MAX_IMAGE_RESULTS = 20;

const MAX_FIELD_LENGTH = 4_000;
const MAX_QUESTION_LENGTH = 5_000;
const MAX_EXPLANATION_LENGTH = 8_000;

const SUPPORTED_TYPES = new Set([
  'multiple',
  'truefalse',
  'multiple_select',
  'short_answer',
  'causeeffect',
  'matching',
  'reading',
]);

const TYPE_ALIASES = {
  multiselect: 'multiple_select',
  multiple_select: 'multiple_select',
  shortanswer: 'short_answer',
  short_answer: 'short_answer',
  true_false: 'truefalse',
  truefalse: 'truefalse',
  cause_effect: 'causeeffect',
  causeeffect: 'causeeffect',
  match: 'matching',
  matching: 'matching',
  reading: 'reading',
  multiple: 'multiple',
};

// ------------------------------------------------------------
// BASIC HELPERS
// ------------------------------------------------------------

function cleanText(value = '') {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeField(value, fallback = '') {
  return cleanText(value || fallback).slice(0, MAX_FIELD_LENGTH);
}

function normalizeType(value) {
  const key = cleanText(value).toLowerCase();
  return TYPE_ALIASES[key] || key;
}

function normalizeText(value = '') {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function uniqueBy(items, keyFn) {
  const seen = new Set();
  const out = [];

  for (const item of items || []) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

function isHttpUrl(value) {
  return /^https?:\/\/\S+$/i.test(String(value || ''));
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

// ------------------------------------------------------------
// DUPLICATE DETECTION
// ------------------------------------------------------------

function tokenSet(value = '') {
  return new Set(
    normalizeText(value)
      .split(' ')
      .filter((token) => token.length >= 2),
  );
}

function jaccardSimilarity(a, b) {
  const A = typeof a === 'string' ? tokenSet(a) : a;
  const B = typeof b === 'string' ? tokenSet(b) : b;

  if (!A.size || !B.size) return 0;

  let intersection = 0;

  for (const token of A) {
    if (B.has(token)) intersection += 1;
  }

  const union = A.size + B.size - intersection;

  return union ? intersection / union : 0;
}

function fingerprintQuestion(value = '') {
  return normalizeText(value)
    .replace(/\bsoal\s+\d+\b/gi, ' ')
    .replace(/\bnomor\s+\d+\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isDuplicateQuestion(question, existing) {
  const current = fingerprintQuestion(question);
  if (!current) return true;

  for (const item of existing) {
    const previous = fingerprintQuestion(item.question);

    if (!previous) continue;
    if (current === previous) return true;

    if (jaccardSimilarity(current, previous) >= 0.86) {
      return true;
    }
  }

  return false;
}

// ------------------------------------------------------------
// XML / SVG
// ------------------------------------------------------------

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildClockSvg(clock) {
  if (!clock || typeof clock !== 'object') return '';

  const hour = Number(clock.hour);
  const minute = Number(clock.minute);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return '';

  const h = ((hour % 12) + 12) % 12;
  const m = Math.min(Math.max(minute, 0), 59);

  const r = 110;
  const cx = 130;
  const cy = 130;

  const toXY = (angle, length) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + length * Math.cos(rad),
      y: cy + length * Math.sin(rad),
    };
  };

  const hourTip = toXY(h * 30 + m * 0.5, r * 0.5);
  const minuteTip = toXY(m * 6, r * 0.75);

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const p1 = toXY(i * 30, r);
    const p2 = toXY(i * 30, r - 10);

    return `<line x1="${p1.x.toFixed(1)}" y1="${p1.y.toFixed(1)}"
      x2="${p2.x.toFixed(1)}" y2="${p2.y.toFixed(1)}"
      stroke="#1e293b" stroke-width="2"/>`;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 260 260" width="260" height="260">
    <circle cx="130" cy="130" r="${r}" fill="#fff" stroke="#1e293b" stroke-width="3"/>
    ${ticks}
    <line x1="130" y1="130" x2="${hourTip.x.toFixed(1)}" y2="${hourTip.y.toFixed(1)}"
      stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
    <line x1="130" y1="130" x2="${minuteTip.x.toFixed(1)}" y2="${minuteTip.y.toFixed(1)}"
      stroke="#475569" stroke-width="3" stroke-linecap="round"/>
    <circle cx="130" cy="130" r="4" fill="#1e293b"/>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function buildGraphSvg(graph) {
  if (!graph || !Array.isArray(graph.points)) return '';

  const points = graph.points
    .filter((p) => p && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y)))
    .slice(0, 50)
    .map((p) => ({ x: Number(p.x), y: Number(p.y) }));

  if (points.length < 2) return '';

  const W = 520;
  const H = 320;
  const P = 50;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const mapX = (v) => P + ((v - minX) / Math.max(maxX - minX, 1)) * (W - P * 2);
  const mapY = (v) => H - P - ((v - minY) / Math.max(maxY - minY, 1)) * (H - P * 2);

  const path = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${mapX(p.x).toFixed(1)} ${mapY(p.y).toFixed(1)}`
  ).join(' ');

  const xLabel = escapeXml(cleanText(graph.xLabel || 'X'));
  const yLabel = escapeXml(cleanText(graph.yLabel || 'Y'));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="#fff"/>
    <line x1="${P}" y1="${H-P}" x2="${W-P}" y2="${H-P}" stroke="#94a3b8" stroke-width="1.5"/>
    <line x1="${P}" y1="${P}" x2="${P}" y2="${H-P}" stroke="#94a3b8" stroke-width="1.5"/>
    <path d="${path}" fill="none" stroke="#0f172a" stroke-width="2.5"/>
    <text x="${W-20}" y="${H-P+18}" font-family="Arial" font-size="12">${xLabel}</text>
    <text x="${P-25}" y="20" font-family="Arial" font-size="12">${yLabel}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// ------------------------------------------------------------
// BLUEPRINT
// ------------------------------------------------------------

function competencyTemplates(mapel, topic) {
  const m = normalizeText(mapel);
  const t = normalizeText(topic);

  if (
    m.includes('matematika') ||
    /(pecahan|aljabar|geometri|bilangan|fungsi|statistika)/.test(t)
  ) {
    return [
      'Memahami konsep dan representasi matematis',
      'Menerapkan prosedur atau konsep matematika',
      'Menganalisis informasi dan memecahkan masalah kontekstual',
    ];
  }

  if (
    /(ipa|fisika|kimia|biologi)/.test(m)
  ) {
    return [
      'Memahami konsep dan fenomena ilmiah',
      'Menerapkan konsep pada situasi ilmiah',
      'Menganalisis data, fenomena, atau permasalahan ilmiah',
    ];
  }

  if (m.includes('bahasa indonesia')) {
    return [
      'Memahami informasi eksplisit dan implisit',
      'Menganalisis struktur, makna, dan hubungan informasi dalam teks',
      'Mengevaluasi informasi dan menarik kesimpulan berbasis bukti',
    ];
  }

  if (m.includes('bahasa inggris')) {
    return [
      'Memahami informasi dan tujuan komunikasi dalam teks',
      'Menerapkan kosakata, tata bahasa, atau fungsi bahasa dalam konteks',
      'Menganalisis makna, inferensi, dan konteks komunikasi',
    ];
  }

  if (/(ips|sejarah|geografi|ekonomi|sosiologi)/.test(m)) {
    return [
      'Memahami konsep dan informasi faktual penting',
      'Menerapkan konsep dalam konteks',
      'Menganalisis hubungan sebab-akibat, data, dan implikasi',
    ];
  }

  return [
    'Memahami konsep atau informasi dasar',
    'Menerapkan konsep pada situasi relevan',
    'Menganalisis informasi dan menyelesaikan masalah',
  ];
}

function difficultyDistribution(jumlah, hotsLevel) {
  const hots = normalizeText(hotsLevel).includes('hots');

  const levels = hots
    ? [
        { level: 'Easy', ratio: 0.10, cognitive: 'Understanding' },
        { level: 'Medium', ratio: 0.40, cognitive: 'Applying/Analyzing' },
        { level: 'Hard', ratio: 0.50, cognitive: 'Analyzing/Evaluating' },
      ]
    : [
        { level: 'Easy', ratio: 0.30, cognitive: 'Understanding' },
        { level: 'Medium', ratio: 0.40, cognitive: 'Applying' },
        { level: 'Hard', ratio: 0.30, cognitive: 'Analyzing/Problem Solving' },
      ];

  const out = levels.map((item) => ({
    ...item,
    count: Math.floor(jumlah * item.ratio),
  }));

  let total = out.reduce((sum, x) => sum + x.count, 0);
  let i = 0;

  while (total < jumlah) {
    out[i % out.length].count += 1;
    total += 1;
    i += 1;
  }

  return out;
}

function requestedTypeMix(types, jumlah) {
  const canonical = [...new Set(
    (types || [])
      .map(normalizeType)
      .filter((type) => SUPPORTED_TYPES.has(type)),
  )];

  const allowed = canonical.length ? canonical : ['multiple'];
  const blueprint = [];

  for (let i = 0; i < jumlah; i += 1) {
    blueprint.push(allowed[i % allowed.length]);
  }

  return blueprint;
}

function buildBlueprint({
  topic,
  mapel,
  kelas,
  jumlah,
  hotsLevel,
  arahan,
  types,
}) {
  const safeTopic = safeField(topic);
  const safeMapel = safeField(mapel, 'Umum');
  const safeKelas = safeField(kelas, 'Umum');
  const safeArahan = safeField(arahan, 'Tidak ada');

  const competencies = competencyTemplates(safeMapel, safeTopic);
  const difficulties = difficultyDistribution(jumlah, hotsLevel);
  const typeMix = requestedTypeMix(types, jumlah);

  const rows = [];
  let no = 1;

  for (const bucket of difficulties) {
    for (let i = 0; i < bucket.count; i += 1) {
      rows.push({
        no,
        topic: safeTopic,
        mapel: safeMapel,
        kelas: safeKelas,
        type: typeMix[no - 1],
        difficulty: bucket.level,
        cognitiveLevel: bucket.cognitive,
        competency: competencies[(no - 1) % competencies.length],
        teacherDirection: safeArahan,
        visualExpectation: no % 4 === 0 ? 'consider_visual' : 'either',
      });
      no += 1;
    }
  }

  return rows;
}

// ------------------------------------------------------------
// RESEARCH QUERY PLANNER
// ------------------------------------------------------------

function buildResearchQueries({
  topic,
  mapel,
  kelas,
  targetYear,
  hotsLevel,
  types,
  sourceMode,
}) {
  const base = [
    cleanText(topic),
    cleanText(mapel || 'umum'),
    cleanText(kelas || 'umum'),
  ].filter(Boolean).join(' ');

  const years = [
    Number(targetYear) - 1,
    Number(targetYear) - 2,
    Number(targetYear),
  ].filter((y, i, arr) => Number.isFinite(y) && arr.indexOf(y) === i);

  const yearText = years.slice(0, 2).join(' ');
  const typeWords = [...new Set((types || []).map(normalizeType))].join(' ');

  const queries = [
    `${base} soal latihan pembahasan ${yearText}`,
    `${base} soal ujian tryout ${yearText} pembahasan`,
    `${base} ${typeWords} contoh soal stimulus gambar diagram`,
  ];

  if (sourceMode === 'prediction' || hotsLevel) {
    queries.push(
      `${base} HOTS pola soal tren ${yearText} ${hotsLevel || ''}`,
    );
  } else {
    queries.push(
      `${base} kisi kisi kompetensi soal pembahasan`,
    );
  }

  return uniqueBy(
    queries.map((q) => cleanText(q)).filter(Boolean).slice(0, MAX_RESEARCH_QUERIES),
    (q) => normalizeText(q),
  );
}

// ------------------------------------------------------------
// TAVILY SEARCH
// ------------------------------------------------------------

async function callTavilySearch(apiKey, query, includeImages) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TAVILY_TIMEOUT_MS);

  try {
    const response = await fetch(TAVILY_SEARCH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query,
        search_depth: 'basic',
        max_results: MAX_SEARCH_RESULTS_PER_QUERY,
        include_answer: false,
        include_raw_content: true,
        include_images: Boolean(includeImages),
        include_image_descriptions: Boolean(includeImages),
        topic: 'general',
        country: 'indonesia',
      }),
      signal: controller.signal,
    });

    const text = await response.text();

    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      const err = new Error(`Tavily HTTP ${response.status}`);
      err.status = response.status;
      err.providerMessage = String(
        data?.message || data?.error || text || 'Unknown Tavily error',
      ).slice(0, 1000);
      throw err;
    }

    return data || {};
  } finally {
    clearTimeout(timer);
  }
}

// ------------------------------------------------------------
// OPTIONAL PAGE EXTRACTION
// ------------------------------------------------------------

async function extractPages(apiKey, urls, query) {
  const cleanUrls = uniqueBy(
    (urls || []).filter(isHttpUrl).slice(0, MAX_EXTRACT_URLS),
    (url) => url,
  );

  if (!cleanUrls.length) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TAVILY_TIMEOUT_MS);

  try {
    const response = await fetch(TAVILY_EXTRACT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        urls: cleanUrls,
        query: cleanText(query).slice(0, 1000),
        chunks_per_source: 3,
        extract_depth: 'basic',
        include_images: true,
        format: 'markdown',
      }),
      signal: controller.signal,
    });

    if (!response.ok) return [];

    const data = await response.json();

    return Array.isArray(data?.results)
      ? data.results
      : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// ------------------------------------------------------------
// SOURCE PACK
// ------------------------------------------------------------

function buildResearchPack(searchPackets, extractedPages) {
  const sources = [];
  const images = [];

  for (const packet of searchPackets || []) {
    for (const result of packet?.results || []) {
      if (!result?.url || !isHttpUrl(result.url)) continue;

      sources.push({
        title: cleanText(result.title).slice(0, 300),
        url: result.url,
        domain: hostOf(result.url),
        score: Number.isFinite(result.score) ? result.score : 0,
        content: cleanText(result.content).slice(0, 6000),
        rawContent: cleanText(result.raw_content).slice(0, 12000),
        query: packet.query,
      });
    }

    for (const image of packet?.images || []) {
      const url = typeof image === 'string'
        ? image
        : image?.url;

      if (!isHttpUrl(url)) continue;

      images.push({
        url,
        description: cleanText(
          typeof image === 'string'
            ? ''
            : image?.description || '',
        ).slice(0, 500),
        query: packet.query,
      });
    }
  }

  for (const page of extractedPages || []) {
    if (!page?.url || !isHttpUrl(page.url)) continue;

    const existing = sources.find(
      (s) => s.url === page.url,
    );

    if (existing) {
      existing.extracted = cleanText(
        page.raw_content || page.content || '',
      ).slice(0, 15000);

      for (const image of page.images || []) {
        const url = typeof image === 'string'
          ? image
          : image?.url;

        if (isHttpUrl(url)) {
          images.push({
            url,
            description: cleanText(
              typeof image === 'string'
                ? ''
                : image?.description || '',
            ).slice(0, 500),
            query: 'extracted-page',
          });
        }
      }
    }
  }

  return {
    sources: uniqueBy(
      sources
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_SOURCE_RESULTS),
      (x) => x.url,
    ),
    images: uniqueBy(
      images.slice(0, MAX_IMAGE_RESULTS),
      (x) => x.url,
    ),
  };
}

// ------------------------------------------------------------
// PROMPT
// ------------------------------------------------------------

function buildSystemPrompt({ allowedTypes }) {
  return `
Kamu adalah mesin akademik Bimbel Gemilang.

TUJUAN:
Riset sumber publik yang diberikan oleh sistem, lalu buat soal latihan BARU
yang sangat dekat dengan kompetensi, bentuk, konteks, dan pola sumber yang
ditemukan.

ATURAN RISET:
1. Gunakan research pack yang diberikan.
2. Jangan mengarang bahwa sebuah sumber membahas sesuatu jika teks sumber
   tidak mendukungnya.
3. Prioritaskan sumber yang paling relevan dan memiliki konteks tahun/jenjang.
4. Sebutkan sourceRef dari sumber yang benar-benar mendukung soal.
5. Jangan menyalin pertanyaan/pilihan/pembahasan sumber secara verbatim.
6. Jangan mengklaim soal sebagai bocoran atau soal masa depan.
7. Buat soal baru berdasarkan pola dan kompetensi sumber.

ATURAN BLUEPRINT:
1. Satu output untuk setiap blueprintNo.
2. Jangan mengganti tipe yang sudah ditetapkan blueprint.
3. Jangan mengganti difficulty.
4. Jangan menghilangkan competency.
5. Jika blueprint meminta visual, buat visual yang benar-benar berguna.
6. Jika visual tidak dapat dipenuhi, jangan membuat soal yang bergantung pada visual.

TIPE YANG DIIZINKAN:
${allowedTypes.join(', ')}

SKEMA:
multiple:
{
  "type":"multiple",
  "blueprintNo":1,
  "difficulty":"Medium",
  "competency":"...",
  "question":"...",
  "options":["A","B","C","D"],
  "correct":0,
  "explanation":"...",
  "answerVerification":"...",
  "analysisSummary":"...",
  "sourceRef":"https://..."
}

truefalse:
{
  "type":"truefalse",
  "blueprintNo":1,
  "question":"...",
  "statements":[
    {"text":"...","isTrue":true},
    {"text":"...","isTrue":false}
  ],
  "explanation":"...",
  "sourceRef":"https://..."
}

multiple_select:
{
  "type":"multiple_select",
  "blueprintNo":1,
  "question":"...",
  "options":["A","B","C","D"],
  "correctAnswers":[0,2],
  "explanation":"...",
  "sourceRef":"https://..."
}

short_answer:
{
  "type":"short_answer",
  "blueprintNo":1,
  "question":"...",
  "shortAnswer":"...",
  "explanation":"...",
  "sourceRef":"https://..."
}

causeeffect:
{
  "type":"causeeffect",
  "blueprintNo":1,
  "question":"...",
  "cause":"...",
  "effect":"...",
  "isCauseTrue":true,
  "isEffectTrue":true,
  "explanation":"...",
  "sourceRef":"https://..."
}

matching:
{
  "type":"matching",
  "blueprintNo":1,
  "question":"...",
  "matchingPairs":[
    {"left":"...","right":"..."},
    {"left":"...","right":"..."},
    {"left":"...","right":"..."}
  ],
  "explanation":"...",
  "sourceRef":"https://..."
}

reading:
{
  "type":"reading",
  "blueprintNo":1,
  "question":"...",
  "readingText":"...",
  "subQuestions":[
    {
      "q":"...",
      "options":["A","B","C","D"],
      "correct":0
    }
  ],
  "explanation":"...",
  "sourceRef":"https://..."
}

VISUAL:
- visualRequired: true/false
- visualKind: none|clock|graph|shape|pattern|real_photo|table|diagram|option_images
- For clock use clock:{hour,minute}
- For graph use graph:{points,xLabel,yLabel}
- For shape use shape:{vertices,labels}
- For pattern use pattern:{sequence}
- For real_photo use needsImage:true and imageHint
- For table/diagram use needsImage:true and imageHint
- For option_images set optionsAreImages:true and optionImageHints:[...]
- NEVER write "lihat gambar" unless a usable visual is actually requested.

OUTPUT:
First line {"meta":true}
Then exactly one JSON object per line.
No Markdown.
No commentary.
`;
}

function buildUserPrompt({
  blueprint,
  researchPack,
  topic,
  mapel,
  kelas,
  targetYear,
  sourceMode,
  arahan,
}) {
  const compactSources = researchPack.sources.map((source) => ({
    title: source.title,
    url: source.url,
    domain: source.domain,
    score: source.score,
    content: source.content,
    extracted: source.extracted || source.rawContent || '',
    query: source.query,
  }));

  return `
GEMILANG RESEARCH TASK

TOPIK: ${topic}
MAPEL: ${mapel}
KELAS: ${kelas || 'Umum'}
TARGET TAHUN: ${targetYear}
MODE: ${sourceMode}
ARAHAN GURU: ${arahan || 'Tidak ada'}

BLUEPRINT:
${JSON.stringify(blueprint)}

SUMBER HASIL RISET:
${JSON.stringify(compactSources)}

KANDIDAT GAMBAR HASIL RISET:
${JSON.stringify(researchPack.images)}

TUGAS:
1. Cocokkan setiap blueprint dengan sumber yang paling relevan.
2. Gunakan sourceRef hanya jika URL benar-benar ada di sumber.
3. Buat satu soal untuk setiap blueprint.
4. Untuk soal visual, pilih visualKind yang tepat dan jangan membuat gambar acak.
5. Untuk pilihan jawaban berbentuk gambar, isi optionsAreImages=true dan optionImageHints
   dengan SATU kata/frasa spesifik untuk setiap opsi.
6. Untuk soal biasa, jangan memaksakan gambar.
7. Pertahankan tipe pengerjaan sesuai blueprint.
8. Pastikan kunci jawaban dapat diverifikasi dari konsep/data sumber.
`;
}

// ------------------------------------------------------------
// GROQ
// ------------------------------------------------------------

function computeMaxTokens(jumlah) {
  const estimated = 700 + jumlah * 500;
  return Math.min(Math.max(2200, estimated), 6200);
}

async function callGroq({
  apiKey,
  systemPrompt,
  userPrompt,
  maxTokens,
}) {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    GROQ_TIMEOUT_MS,
  );

  try {
    const response = await fetch(
      GROQ_API_URL,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.15,
          top_p: 0.7,
          max_tokens: maxTokens,
          stream: false,
        }),
        signal: controller.signal,
      },
    );

    const text = await response.text();

    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!response.ok) {
      const error = new Error(
        `Groq HTTP ${response.status}`,
      );
      error.providerStatus = response.status;
      error.providerMessage = String(
        data?.error?.message ||
        data?.message ||
        text ||
        'Unknown Groq error',
      ).slice(0, 1500);
      error.retryAfter = response.headers.get('retry-after');
      throw error;
    }

    const content =
      data?.choices?.[0]?.message?.content;

    if (
      typeof content !== 'string' ||
      !content.trim()
    ) {
      throw new Error(
        'Groq mengembalikan content kosong.',
      );
    }

    return {
      content,
      usage: data?.usage || null,
      model: data?.model || GROQ_MODEL,
      finishReason:
        data?.choices?.[0]?.finish_reason || null,
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error(
        `Groq timeout setelah ${GROQ_TIMEOUT_MS}ms.`,
      );
      timeoutError.code = 'GROQ_TIMEOUT';
      throw timeoutError;
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// ------------------------------------------------------------
// JSONL
// ------------------------------------------------------------

function parseJsonLines(text = '') {
  const cleaned = String(text || '')
    .replace(/```(?:json|jsonl)?/gi, '')
    .replace(/```/g, '')
    .trim();

  const result = [];

  for (const line of cleaned.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) continue;

    try {
      result.push(JSON.parse(trimmed));
    } catch {}
  }

  if (result.length) return result;

  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < cleaned.length; i += 1) {
    const char = cleaned[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\' && inString) {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') {
      if (depth === 0) start = i;
      depth += 1;
    } else if (char === '}') {
      depth -= 1;

      if (depth === 0 && start !== -1) {
        try {
          result.push(
            JSON.parse(cleaned.slice(start, i + 1)),
          );
        } catch {}
        start = -1;
      }
    }
  }

  return result;
}

// ------------------------------------------------------------
// VISUAL CUES
// ------------------------------------------------------------

function hasVisualCue(text = '') {
  return /\b(lihat\s+gambar|perhatikan\s+gambar|berdasarkan\s+gambar|lihat\s+grafik|perhatikan\s+grafik|berdasarkan\s+grafik|lihat\s+diagram|perhatikan\s+diagram|berdasarkan\s+diagram|perhatikan\s+tabel|berdasarkan\s+tabel)\b/i.test(String(text));
}

// ------------------------------------------------------------
// TYPE VALIDATION
// ------------------------------------------------------------

function validMultiple(q) {
  return (
    Array.isArray(q.options) &&
    q.options.length === 4 &&
    q.options.every((x) => cleanText(x)) &&
    Number.isInteger(q.correct) &&
    q.correct >= 0 &&
    q.correct < 4
  );
}

function validTrueFalse(q) {
  return (
    Array.isArray(q.statements) &&
    q.statements.length >= 2 &&
    q.statements.length <= 8 &&
    q.statements.every(
      (s) => s && cleanText(s.text) && typeof s.isTrue === 'boolean',
    )
  );
}

function validMultipleSelect(q) {
  return (
    Array.isArray(q.options) &&
    q.options.length >= 2 &&
    q.options.length <= 8 &&
    Array.isArray(q.correctAnswers) &&
    q.correctAnswers.length >= 1 &&
    q.correctAnswers.every(
      (i) =>
        Number.isInteger(i) &&
        i >= 0 &&
        i < q.options.length,
    )
  );
}

function validShortAnswer(q) {
  return Boolean(cleanText(q.shortAnswer));
}

function validCauseEffect(q) {
  return (
    Boolean(cleanText(q.cause)) &&
    Boolean(cleanText(q.effect)) &&
    typeof q.isCauseTrue === 'boolean' &&
    typeof q.isEffectTrue === 'boolean'
  );
}

function validMatching(q) {
  return (
    Array.isArray(q.matchingPairs) &&
    q.matchingPairs.length >= 3 &&
    q.matchingPairs.length <= 8 &&
    q.matchingPairs.every(
      (p) => cleanText(p?.left) && cleanText(p?.right),
    )
  );
}

function validReading(q) {
  return (
    Boolean(cleanText(q.readingText)) &&
    Array.isArray(q.subQuestions) &&
    q.subQuestions.length >= 2 &&
    q.subQuestions.every(
      (sq) =>
        cleanText(sq?.q) &&
        Array.isArray(sq?.options) &&
        sq.options.length === 4 &&
        Number.isInteger(sq.correct) &&
        sq.correct >= 0 &&
        sq.correct < 4,
    )
  );
}

// ------------------------------------------------------------
// NORMALIZE RAW QUESTION
// ------------------------------------------------------------

function normalizeQuestion(raw, blueprint, researchPack) {
  if (!raw || typeof raw !== 'object') return null;

  const type = normalizeType(raw.type);

  if (!SUPPORTED_TYPES.has(type)) return null;

  const target = blueprint.find(
    (item) => item.no === Number(raw.blueprintNo),
  );

  if (!target) return null;

  if (
    normalizeType(target.type) !== type
  ) {
    return null;
  }

  if (
    raw.difficulty &&
    normalizeText(raw.difficulty) !==
      normalizeText(target.difficulty)
  ) {
    return null;
  }

  const question = cleanText(raw.question);

  if (
    question.length < 8 ||
    question.length > MAX_QUESTION_LENGTH
  ) {
    return null;
  }

  const result = {
    type,
    blueprintNo: target.no,
    difficulty: target.difficulty,
    competency:
      cleanText(raw.competency) ||
      target.competency,

    question,

    options: Array.isArray(raw.options)
      ? raw.options.map((x) => cleanText(x)).slice(0, 8)
      : [],

    optionImages: Array.isArray(raw.optionImages)
      ? raw.optionImages.map((x) => cleanText(x)).slice(0, 8)
      : [],

    optionImageHints: Array.isArray(raw.optionImageHints)
      ? raw.optionImageHints.map((x) => cleanText(x)).slice(0, 8)
      : [],

    optionsAreImages:
      Boolean(raw.optionsAreImages),

    correct: Number.isInteger(raw.correct)
      ? raw.correct
      : 0,

    correctAnswers: Array.isArray(raw.correctAnswers)
      ? raw.correctAnswers.filter(Number.isInteger).slice(0, 8)
      : [],

    statements: Array.isArray(raw.statements)
      ? raw.statements
          .slice(0, 8)
          .map((s) => ({
            text: cleanText(s?.text),
            isTrue: Boolean(s?.isTrue),
          }))
      : [],

    shortAnswer:
      cleanText(raw.shortAnswer).slice(0, 500),

    cause:
      cleanText(raw.cause).slice(0, 1500),

    effect:
      cleanText(raw.effect).slice(0, 1500),

    isCauseTrue:
      typeof raw.isCauseTrue === 'boolean'
        ? raw.isCauseTrue
        : true,

    isEffectTrue:
      typeof raw.isEffectTrue === 'boolean'
        ? raw.isEffectTrue
        : true,

    matchingPairs: Array.isArray(raw.matchingPairs)
      ? raw.matchingPairs
          .slice(0, 8)
          .map((p) => ({
            left: cleanText(p?.left),
            right: cleanText(p?.right),
          }))
      : [],

    readingText:
      cleanText(raw.readingText).slice(0, 10_000),

    subQuestions: Array.isArray(raw.subQuestions)
      ? raw.subQuestions.slice(0, 6).map((sq) => ({
          q: cleanText(sq?.q),
          options: Array.isArray(sq?.options)
            ? sq.options.map((x) => cleanText(x)).slice(0, 4)
            : [],
          correct: Number.isInteger(sq?.correct)
            ? sq.correct
            : 0,
        }))
      : [],

    explanation:
      cleanText(raw.explanation).slice(
        0,
        MAX_EXPLANATION_LENGTH,
      ),

    answerVerification:
      cleanText(raw.answerVerification).slice(0, 2500),

    analysisSummary:
      cleanText(raw.analysisSummary).slice(0, 2500),

    visualRequired:
      Boolean(raw.visualRequired),

    visualKind:
      cleanText(raw.visualKind || 'none'),

    needsImage:
      Boolean(raw.needsImage),

    imageHint:
      cleanText(raw.imageHint).slice(0, 500),

    clock:
      raw.clock || null,

    graph:
      raw.graph || null,

    shape:
      raw.shape || null,

    pattern:
      raw.pattern || null,

    sourceRef:
      isHttpUrl(raw.sourceRef)
        ? raw.sourceRef
        : '',

    researchBacked: false,
    researchSources: [],
    imageSource: null,
    qImage: '',
    sourceMode: 'research',
  };

  if (type === 'multiple' && !validMultiple(result)) return null;
  if (type === 'truefalse' && !validTrueFalse(result)) return null;
  if (type === 'multiple_select' && !validMultipleSelect(result)) return null;
  if (type === 'short_answer' && !validShortAnswer(result)) return null;
  if (type === 'causeeffect' && !validCauseEffect(result)) return null;
  if (type === 'matching' && !validMatching(result)) return null;
  if (type === 'reading' && !validReading(result)) return null;

  if (hasVisualCue(result.question) && !result.visualRequired) {
    return null;
  }

  if (result.visualRequired && result.visualKind === 'clock' && !result.clock) {
    return null;
  }

  if (result.visualRequired && result.visualKind === 'graph' && !result.graph) {
    return null;
  }

  if (
    result.visualRequired &&
    ['real_photo', 'table', 'diagram', 'option_images'].includes(
      result.visualKind,
    ) &&
    !result.needsImage &&
    !result.optionsAreImages
  ) {
    return null;
  }

  if (
    result.optionsAreImages &&
    (!Array.isArray(result.optionImageHints) ||
      result.optionImageHints.length !== result.options.length)
  ) {
    return null;
  }

  return result;
}

// ------------------------------------------------------------
// IMAGE MATCHING
// ------------------------------------------------------------

function imageMatchesHint(image, hint, topic) {
  const text = normalizeText(
    `${image.description || ''} ${image.query || ''}`,
  );

  const hintTokens = [...tokenSet(`${hint} ${topic}`)];
  if (!hintTokens.length) return false;

  let hits = 0;

  for (const token of hintTokens) {
    if (text.includes(token)) hits += 1;
  }

  return hits >= Math.max(1, Math.floor(hintTokens.length * 0.15));
}

function pickImage(images, hint, topic, usedUrls = new Set()) {
  const candidates = images.filter(
    (image) =>
      image &&
      isHttpUrl(image.url) &&
      !usedUrls.has(image.url),
  );

  if (!candidates.length) return null;

  const matched = candidates.find(
    (image) => imageMatchesHint(image, hint, topic),
  );

  return matched || candidates[0];
}

function enrichVisuals(questions, researchPack, topic) {
  const used = new Set();
  let attached = 0;
  let optionAttached = 0;

  for (const question of questions) {
    if (
      question.needsImage &&
      question.visualKind !== 'clock' &&
      question.visualKind !== 'graph'
    ) {
      const picked = pickImage(
        researchPack.images,
        question.imageHint,
        topic,
        used,
      );

      if (picked) {
        question.qImage = picked.url;
        question.imageSource = {
          url: picked.url,
          source: 'tavily-search',
          description: picked.description || '',
        };
        question.visualRequired = true;
        used.add(picked.url);
        attached += 1;
      } else {
        return {
          ok: false,
          attached,
          optionAttached,
          reason: 'visual-not-found',
          question: question.question,
        };
      }
    }

    if (question.optionsAreImages) {
      const images = [];

      for (const hint of question.optionImageHints) {
        const picked = pickImage(
          researchPack.images,
          hint,
          topic,
          used,
        );

        if (!picked) {
          return {
            ok: false,
            attached,
            optionAttached,
            reason: 'option-image-not-found',
            question: question.question,
          };
        }

        images.push(picked.url);
        used.add(picked.url);
        optionAttached += 1;
      }

      question.optionImages = images;
    }

    if (question.visualKind === 'clock') {
      question.qImage = buildClockSvg(question.clock);
    } else if (question.visualKind === 'graph') {
      question.qImage = buildGraphSvg(question.graph);
    }
  }

  return {
    ok: true,
    attached,
    optionAttached,
    reason: null,
  };
}

// ------------------------------------------------------------
// MAIN
// ------------------------------------------------------------

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      success: false,
      error: 'Method not allowed.',
    });
  }

  const body =
    req.body && typeof req.body === 'object'
      ? req.body
      : {};

  const topic = safeField(body.topic);
  const mapel = safeField(body.mapel, 'Umum');
  const kelas = safeField(body.kelas, 'Umum');
  const arahan = safeField(body.arahan, 'Tidak ada');
  const sourceMode =
    body.sourceMode === 'prediction'
      ? 'prediction'
      : 'source';

  const targetYear = String(
    body.targetYear ||
      new Date().getFullYear() + 1,
  ).slice(0, 9);

  const jumlah = clampInt(
    body.jumlahSoal,
    1,
    MAX_QUESTION_COUNT,
    DEFAULT_QUESTION_COUNT,
  );

  const apiKey = process.env.GROQ_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;

  if (!topic) {
    return res.status(400).json({
      success: false,
      error: 'Topik wajib diisi.',
    });
  }

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error:
        'GROQ_API_KEY belum dikonfigurasi.',
    });
  }

  if (!tavilyKey) {
    return res.status(500).json({
      success: false,
      error:
        'TAVILY_API_KEY belum dikonfigurasi. Mode riset internet membutuhkan Tavily.',
    });
  }

  const requestedTypes = Array.isArray(body.types)
    ? body.types
    : ['multiple'];

  const allowedTypes = [
    ...new Set(
      requestedTypes
        .map(normalizeType)
        .filter((type) => SUPPORTED_TYPES.has(type)),
    ),
  ];

  if (!allowedTypes.length) {
    return res.status(400).json({
      success: false,
      error: 'Tidak ada tipe soal yang valid.',
      supportedTypes: [...SUPPORTED_TYPES],
    });
  }

  const hotsLevel = safeField(
    body.hotsLevel,
    '',
  );

  const blueprint = buildBlueprint({
    topic,
    mapel,
    kelas,
    jumlah,
    hotsLevel,
    arahan,
    types: allowedTypes,
  });

  const researchQueries = buildResearchQueries({
    topic,
    mapel,
    kelas,
    targetYear,
    hotsLevel,
    types: allowedTypes,
    sourceMode,
  });

  // ----------------------------------------------------------
  // WEB RESEARCH
  // ----------------------------------------------------------

  const searchPackets = [];

  try {
    for (const query of researchQueries) {
      const wantsImages =
        allowedTypes.some(
          (type) =>
            type === 'reading' ||
            type === 'matching' ||
            type === 'multiple' ||
            type === 'multiple_select',
        ) ||
        /gambar|diagram|grafik|visual|peta|tabel/i.test(
          `${query} ${arahan}`,
        );

      const packet =
        await callTavilySearch(
          tavilyKey,
          query,
          wantsImages,
        );

      searchPackets.push({
        query,
        ...packet,
      });

      await sleep(120);
    }
  } catch (error) {
    console.error('[Gemilang Research] Tavily error', error);

    return res.status(502).json({
      success: false,
      error:
        'Riset internet gagal. Soal tidak dibuat dari tebakan offline.',
      diagnostics: {
        provider: 'tavily',
        status: error?.status || null,
        message:
          error?.providerMessage ||
          error?.message ||
          'Unknown error',
      },
    });
  }

  const rawUrls = searchPackets
    .flatMap((packet) =>
      (packet.results || []).map(
        (result) => result?.url,
      ),
    )
    .filter(isHttpUrl);

  const topUrls = uniqueBy(
    rawUrls,
    (url) => url,
  ).slice(0, MAX_EXTRACT_URLS);

  const extractedPages =
    await extractPages(
      tavilyKey,
      topUrls,
      `${topic} ${mapel} ${kelas}`,
    );

  const researchPack =
    buildResearchPack(
      searchPackets,
      extractedPages,
    );

  if (!researchPack.sources.length) {
    return res.status(502).json({
      success: false,
      error:
        'Tidak ditemukan sumber internet yang cukup relevan. Soal tidak dibuat dari asumsi offline.',
      diagnostics: {
        researchQueries,
        sourceCount: 0,
      },
    });
  }

  // ----------------------------------------------------------
  // AI CURATION
  // ----------------------------------------------------------

  const systemPrompt =
    buildSystemPrompt({
      allowedTypes,
    });

  const userPrompt =
    buildUserPrompt({
      blueprint,
      researchPack,
      topic,
      mapel,
      kelas,
      targetYear,
      sourceMode,
      arahan,
    });

  let aiResult;

  try {
    aiResult = await callGroq({
      apiKey,
      systemPrompt,
      userPrompt,
      maxTokens: computeMaxTokens(jumlah),
    });
  } catch (error) {
    console.error('[Gemilang AI] Groq error', error);

    if (error?.code === 'GROQ_TIMEOUT') {
      return res.status(504).json({
        success: false,
        error: 'Groq terlalu lama merespons.',
      });
    }

    if (error?.providerStatus === 429) {
      return res.status(429).json({
        success: false,
        error:
          'Batas Groq sedang tercapai. Coba lagi beberapa saat.',
        diagnostics: {
          retryAfter:
            error?.retryAfter || null,
        },
      });
    }

    return res.status(502).json({
      success: false,
      error:
        'Groq gagal mengkurasi hasil riset internet.',
      diagnostics: {
        providerStatus:
          error?.providerStatus || null,
        providerMessage:
          error?.providerMessage || null,
      },
    });
  }

  const parsed =
    parseJsonLines(
      aiResult.content,
    );

  const questions = [];
  const rejectedReasons = {};
  const usedBlueprints = new Set();

  for (const raw of parsed) {
    if (raw?.meta === true) continue;

    const question =
      normalizeQuestion(
        raw,
        blueprint,
        researchPack,
      );

    if (!question) {
      rejectedReasons.invalidStructure =
        (rejectedReasons.invalidStructure || 0) + 1;
      continue;
    }

    if (
      usedBlueprints.has(
        question.blueprintNo,
      )
    ) {
      rejectedReasons.duplicateBlueprint =
        (rejectedReasons.duplicateBlueprint || 0) + 1;
      continue;
    }

    if (
      isDuplicateQuestion(
        question.question,
        questions,
      )
    ) {
      rejectedReasons.duplicateQuestion =
        (rejectedReasons.duplicateQuestion || 0) + 1;
      continue;
    }

    const source =
      researchPack.sources.find(
        (item) =>
          item.url === question.sourceRef,
      );

    if (!source) {
      rejectedReasons.invalidSourceRef =
        (rejectedReasons.invalidSourceRef || 0) + 1;
      continue;
    }

    question.researchBacked = true;
    question.researchSources = [
      {
        title: source.title,
        url: source.url,
        domain: source.domain,
        score: source.score,
      },
    ];

    questions.push(question);
    usedBlueprints.add(question.blueprintNo);

    if (questions.length >= jumlah) break;
  }

  if (!questions.length) {
    return res.status(502).json({
      success: false,
      error:
        'Tidak ada soal yang lolos validasi sumber, blueprint, dan tipe.',
      diagnostics: {
        parsedObjectCount: parsed.length,
        requestedCount: jumlah,
        rejectedReasons,
      },
    });
  }

  // ----------------------------------------------------------
  // VISUAL ENRICHMENT
  // ----------------------------------------------------------

  const visualResult =
    enrichVisuals(
      questions,
      researchPack,
      topic,
    );

  if (!visualResult.ok) {
    return res.status(502).json({
      success: false,
      error:
        'Ada soal yang membutuhkan visual tetapi visual yang relevan tidak ditemukan. Soal visual tidak dipaksakan masuk.',
      diagnostics: {
        visualFailure:
          visualResult.reason,
        question:
          visualResult.question,
        imagesFound:
          researchPack.images.length,
      },
    });
  }

  questions.sort(
    (a, b) =>
      a.blueprintNo -
      b.blueprintNo,
  );

  return res.status(200).json({
    success: true,

    questions,

    researchPerformed: true,

    researchSources:
      researchPack.sources.map(
        (source) => ({
          title: source.title,
          url: source.url,
          domain: source.domain,
          score: source.score,
        }),
      ),

    researchSourceCount:
      researchPack.sources.length,

    researchImageCount:
      researchPack.images.length,

    requestedCount:
      jumlah,

    returnedCount:
      questions.length,

    diagnostics: {
      modelUsed:
        aiResult.model,

      finishReason:
        aiResult.finishReason,

      usage:
        aiResult.usage,

      researchQueries,

      extractedPages:
        extractedPages.length,

      parsedObjectCount:
        parsed.length,

      rejectedReasons,

      imageAttached:
        visualResult.attached,

      optionImagesAttached:
        visualResult.optionAttached,

      blueprintCount:
        blueprint.length,

      researchBackedCount:
        questions.filter(
          (q) => q.researchBacked,
        ).length,
    },
  });
}