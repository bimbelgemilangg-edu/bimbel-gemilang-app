// ============================================================
// BIMBEL GEMILANG
// api/generateQuizFromTopic.js
// ============================================================
//
// ARSITEKTUR:
//
//   FRONTEND
//      ↓
//   /api/generateQuizFromTopic
//      ↓
//   LOCAL BLUEPRINT ENGINE
//      ↓
//   1x SILICONFLOW CHAT COMPLETION
//      ↓
//   LOCAL JSONL PARSER
//      ↓
//   LOCAL QUALITY GATE
//      ↓
//   MANAGE QUIZ
//
// TIDAK MENGGUNAKAN:
// - Jina
// - Tavily
// - Google Search API
// - Gemini
// - Cloudflare AI
// - Scraping internet
//
// ENV:
//   SILICONFLOW_API_KEY=...
//
// OPTIONAL:
//   SILICONFLOW_MODEL=deepseek-ai/DeepSeek-V3
//   SILICONFLOW_API_URL=https://api.siliconflow.cn/v1/chat/completions
//
// ============================================================

export const maxDuration = 60;

// ============================================================
// CONFIG
// ============================================================

const SILICONFLOW_API_URL =
  process.env.SILICONFLOW_API_URL ||
  'https://api.siliconflow.cn/v1/chat/completions';

const SILICONFLOW_MODEL =
  process.env.SILICONFLOW_MODEL ||
  'deepseek-ai/DeepSeek-V3';

const DEFAULT_MAX_BATCH_QUESTIONS = 10;
const ABSOLUTE_MAX_BATCH_QUESTIONS = 20;

const AI_TIMEOUT_MS = 45_000;

const MAX_PROMPT_FIELD = 4_000;
const MAX_ACCEPTED_QUESTIONS = 20;

// ============================================================
// SUPPORTED QUESTION TYPES
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
// BASIC HELPERS
// ============================================================

function cleanText(value = '') {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
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
    if (B.has(token)) {
      intersection += 1;
    }
  }

  const union = A.size + B.size - intersection;

  return union > 0
    ? intersection / union
    : 0;
}

// ============================================================
// DUPLICATE DETECTION
// ============================================================

function fingerprintQuestion(value = '') {
  return normalizeText(value)
    .replace(/\bsoal\s+\d+\b/gi, ' ')
    .replace(/\bnomor\s+\d+\b/gi, ' ')
    .replace(/\b(?:a|b|c|d)[.)]\s+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isDuplicateQuestion(question, existing) {
  const current = fingerprintQuestion(question);

  if (!current) {
    return true;
  }

  for (const item of existing) {
    const old = fingerprintQuestion(item.question);

    if (!old) {
      continue;
    }

    if (current === old) {
      return true;
    }

    if (jaccardSimilarity(current, old) >= 0.86) {
      return true;
    }
  }

  return false;
}

// ============================================================
// NUMBER HELPERS
// ============================================================

function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(
    Math.max(parsed, min),
    max,
  );
}

// ============================================================
// SAFE PROMPT FIELD
// ============================================================

function asSafePromptField(value, fallback = '') {
  const text = cleanText(value || fallback);

  return text.slice(
    0,
    MAX_PROMPT_FIELD,
  );
}

// ============================================================
// XML / SVG ESCAPE
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
// CURRICULUM COMPETENCY TEMPLATES
// ============================================================

function getCompetencyTemplates(mapel, topic) {
  const m = normalizeText(mapel);
  const t = normalizeText(topic);

  // ----------------------------------------------------------
  // MATEMATIKA
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // IPA
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // BAHASA INDONESIA
  // ----------------------------------------------------------

  if (m.includes('bahasa indonesia')) {
    return [
      'Memahami informasi eksplisit dan implisit',
      'Menganalisis struktur, makna, dan hubungan informasi dalam teks',
      'Mengevaluasi informasi dan menarik kesimpulan berbasis bukti',
    ];
  }

  // ----------------------------------------------------------
  // BAHASA INGGRIS
  // ----------------------------------------------------------

  if (m.includes('bahasa inggris')) {
    return [
      'Memahami informasi dan tujuan komunikasi dalam teks',
      'Menerapkan kosakata, tata bahasa, atau fungsi bahasa dalam konteks',
      'Menganalisis makna, inferensi, dan konteks komunikasi',
    ];
  }

  // ----------------------------------------------------------
  // IPS
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // DEFAULT
  // ----------------------------------------------------------

  return [
    'Memahami konsep atau informasi dasar',
    'Menerapkan konsep pada situasi yang relevan',
    'Menganalisis informasi dan menyelesaikan masalah',
  ];
}

// ============================================================
// DIFFICULTY DISTRIBUTION
// ============================================================

function getDifficultyDistribution(jumlah, hotsLevel) {
  const isHots =
    normalizeText(hotsLevel).includes('hots');

  const ratios = isHots
    ? [
        {
          level: 'Easy',
          ratio: 0.10,
          cognitive: 'Understanding',
        },
        {
          level: 'Medium',
          ratio: 0.40,
          cognitive: 'Applying/Analyzing',
        },
        {
          level: 'Hard',
          ratio: 0.50,
          cognitive: 'Analyzing/Evaluating',
        },
      ]
    : [
        {
          level: 'Easy',
          ratio: 0.30,
          cognitive: 'Understanding',
        },
        {
          level: 'Medium',
          ratio: 0.40,
          cognitive: 'Applying',
        },
        {
          level: 'Hard',
          ratio: 0.30,
          cognitive: 'Analyzing/Problem Solving',
        },
      ];

  const counts = ratios.map((item) => ({
    ...item,
    count: Math.round(
      jumlah * item.ratio,
    ),
  }));

  let total = counts.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  // Tambahkan jika kurang
  while (total < jumlah) {
    const index =
      total % counts.length;

    counts[index].count += 1;
    total += 1;
  }

  // Kurangi jika lebih
  while (total > jumlah) {
    const index = counts.findIndex(
      (item) => item.count > 0,
    );

    if (index === -1) {
      break;
    }

    counts[index].count -= 1;
    total -= 1;
  }

  return counts;
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
    asSafePromptField(topic);

  const safeMapel =
    asSafePromptField(
      mapel,
      'Umum',
    );

  const safeKelas =
    asSafePromptField(
      kelas,
      'Umum',
    );

  const safeArahan =
    asSafePromptField(
      arahan,
      'Tidak ada',
    );

  const competencies =
    getCompetencyTemplates(
      safeMapel,
      safeTopic,
    );

  const distribution =
    getDifficultyDistribution(
      jumlah,
      hotsLevel,
    );

  const blueprint = [];

  let number = 1;

  for (const bucket of distribution) {
    for (let i = 0; i < bucket.count; i += 1) {

      const competency =
        competencies[
          (number - 1) %
          competencies.length
        ];

      blueprint.push({
        no: number,
        topic: safeTopic,
        mapel: safeMapel,
        kelas: safeKelas,

        difficulty:
          bucket.level,

        cognitiveLevel:
          bucket.cognitive,

        competency,

        teacherDirection:
          safeArahan,
      });

      number += 1;
    }
  }

  return blueprint;
}

// ============================================================
// CLOCK SVG
// ============================================================

function buildClockSvg(clock) {
  if (
    !clock ||
    typeof clock !== 'object'
  ) {
    return '';
  }

  if (
    !Number.isFinite(clock.hour) ||
    !Number.isFinite(clock.minute)
  ) {
    return '';
  }

  const hour =
    ((Number(clock.hour) % 12) + 12) % 12;

  const minute =
    Math.min(
      Math.max(
        Number(clock.minute),
        0,
      ),
      59,
    );

  const r = 110;
  const cx = 130;
  const cy = 130;

  function toXY(angle, length) {
    const radians =
      ((angle - 90) * Math.PI) /
      180;

    return {
      x:
        cx +
        length *
          Math.cos(radians),

      y:
        cy +
        length *
          Math.sin(radians),
    };
  }

  const hourTip =
    toXY(
      hour * 30 +
        minute * 0.5,
      r * 0.5,
    );

  const minuteTip =
    toXY(
      minute * 6,
      r * 0.75,
    );

  const ticks =
    Array.from(
      { length: 12 },
      (_, i) => {
        const p1 =
          toXY(i * 30, r);

        const p2 =
          toXY(
            i * 30,
            r - 10,
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
        r="${r}"
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
    Buffer.from(svg).toString('base64')
  );
}

// ============================================================
// GRAPH SVG
// ============================================================

function buildGraphSvg(graph) {
  if (
    !graph ||
    !Array.isArray(graph.points)
  ) {
    return '';
  }

  const points =
    graph.points
      .filter(
        (p) =>
          p &&
          Number.isFinite(p.x) &&
          Number.isFinite(p.y),
      )
      .slice(0, 50);

  if (points.length < 2) {
    return '';
  }

  const W = 500;
  const H = 300;
  const pad = 40;

  const xs =
    points.map((p) => p.x);

  const ys =
    points.map((p) => p.y);

  const minX =
    Math.min(...xs);

  const maxX =
    Math.max(...xs);

  const minY =
    Math.min(...ys);

  const maxY =
    Math.max(...ys);

  const mapX = (value) =>
    pad +
    ((value - minX) /
      Math.max(
        maxX - minX,
        1,
      )) *
      (W - pad * 2);

  const mapY = (value) =>
    H -
    pad -
    ((value - minY) /
      Math.max(
        maxY - minY,
        1,
      )) *
      (H - pad * 2);

  const path =
    points
      .map(
        (point, index) =>
          `${
            index === 0
              ? 'M'
              : 'L'
          } ${mapX(point.x).toFixed(
            1,
          )} ${mapY(point.y).toFixed(
            1,
          )}`,
      )
      .join(' ');

  const xLabel =
    escapeXml(
      graph.xLabel || 'X',
    );

  const yLabel =
    escapeXml(
      graph.yLabel || 'Y',
    );

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 ${W} ${H}"
      width="${W}"
      height="${H}"
    >

      <rect
        width="${W}"
        height="${H}"
        fill="#ffffff"
      />

      <line
        x1="${pad}"
        y1="${H - pad}"
        x2="${W - pad}"
        y2="${H - pad}"
        stroke="#94a3b8"
        stroke-width="1.5"
      />

      <line
        x1="${pad}"
        y1="${pad}"
        x2="${pad}"
        y2="${H - pad}"
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
        x="${W - 15}"
        y="${H - pad + 5}"
        font-family="Arial"
        font-size="12"
        fill="#475569"
      >
        ${xLabel}
      </text>

      <text
        x="${pad - 10}"
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
    Buffer.from(svg).toString('base64')
  );
}

// ============================================================
// JSONL CLEANUP
// ============================================================

function stripCodeFences(text) {
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

function parseJsonLines(text = '') {
  const clean =
    stripCodeFences(text);

  const result = [];

  // ----------------------------------------------------------
  // PASS 1
  // Standard JSONL
  // ----------------------------------------------------------

  for (
    const line of clean.split(
      /\r?\n/,
    )
  ) {
    const trimmed =
      line.trim();

    if (
      !trimmed.startsWith('{') ||
      !trimmed.endsWith('}')
    ) {
      continue;
    }

    try {
      result.push(
        JSON.parse(trimmed),
      );
    } catch (_) {
      // fallback parser
    }
  }

  if (result.length > 0) {
    return result;
  }

  // ----------------------------------------------------------
  // PASS 2
  // Balanced JSON object recovery
  // ----------------------------------------------------------

  let depth = 0;
  let start = -1;

  let inString = false;
  let escaped = false;

  for (
    let i = 0;
    i < clean.length;
    i += 1
  ) {
    const char =
      clean[i];

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
      inString = !inString;
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
          clean.slice(
            start,
            i + 1,
          );

        try {
          result.push(
            JSON.parse(candidate),
          );
        } catch (_) {
          // ignore malformed object
        }

        start = -1;
      }
    }
  }

  return result;
}

// ============================================================
// QUALITY GATE
// ============================================================

function isMultipleChoiceValid(question) {
  return (
    Array.isArray(
      question.options,
    ) &&
    question.options.length === 4 &&
    question.options.every(
      (option) =>
        cleanText(option)
          .length > 0,
    ) &&
    Number.isInteger(
      question.correct,
    ) &&
    question.correct >= 0 &&
    question.correct < 4
  );
}

function normalizeQuestion(
  rawQuestion,
  allowedTypes,
  currentMode,
) {
  if (
    !rawQuestion ||
    typeof rawQuestion !==
      'object'
  ) {
    return null;
  }

  if (
    rawQuestion.meta === true
  ) {
    return null;
  }

  const type =
    cleanText(
      rawQuestion.type,
    ).toLowerCase();

  if (
    !allowedTypes.includes(type)
  ) {
    return null;
  }

  const question =
    cleanText(
      rawQuestion.question,
    );

  if (
    question.length < 8 ||
    question.length > 5_000
  ) {
    return null;
  }

  const options =
    Array.isArray(
      rawQuestion.options,
    )
      ? rawQuestion.options
          .map(cleanText)
          .filter(Boolean)
          .slice(0, 8)
      : [];

  const normalized = {
    type,

    question,

    options,

    optionImages:
      Array.isArray(
        rawQuestion.optionImages,
      )
        ? rawQuestion.optionImages
            .map(cleanText)
            .filter(Boolean)
            .slice(0, 8)
        : [],

    optionsAreImages:
      Boolean(
        rawQuestion.optionsAreImages,
      ),

    correct:
      Number.isInteger(
        rawQuestion.correct,
      )
        ? rawQuestion.correct
        : 0,

    correctAnswers:
      Array.isArray(
        rawQuestion.correctAnswers,
      )
        ? rawQuestion.correctAnswers.slice(
            0,
            8,
          )
        : [],

    statements:
      Array.isArray(
        rawQuestion.statements,
      )
        ? rawQuestion.statements.slice(
            0,
            8,
          )
        : [],

    shortAnswer:
      cleanText(
        rawQuestion.shortAnswer,
      ).slice(0, 500),

    readingText:
      cleanText(
        rawQuestion.readingText,
      ).slice(0, 8_000),

    cause:
      cleanText(
        rawQuestion.cause,
      ).slice(0, 1_000),

    effect:
      cleanText(
        rawQuestion.effect,
      ).slice(0, 1_000),

    explanation:
      cleanText(
        rawQuestion.explanation ||
          'Pembahasan belum tersedia.',
      ).slice(0, 8_000),

    answerVerification:
      cleanText(
        rawQuestion.answerVerification ||
          'Kunci divalidasi pada level struktur oleh Quality Gate.',
      ).slice(0, 2_000),

    analysisSummary:
      cleanText(
        rawQuestion.analysisSummary ||
          'Capaian kompetensi sesuai blueprint.',
      ).slice(0, 2_000),

    difficulty:
      cleanText(
        rawQuestion.difficulty,
      ).slice(0, 50),

    competency:
      cleanText(
        rawQuestion.competency,
      ).slice(0, 500),

    blueprintNo:
      Number.isInteger(
        rawQuestion.blueprintNo,
      )
        ? rawQuestion.blueprintNo
        : null,

    clock:
      rawQuestion.clock &&
      typeof rawQuestion.clock ===
        'object'
        ? rawQuestion.clock
        : null,

    graph:
      rawQuestion.graph &&
      typeof rawQuestion.graph ===
        'object'
        ? rawQuestion.graph
        : null,

    needsImage:
      Boolean(
        rawQuestion.needsImage,
      ),

    imageHint:
      cleanText(
        rawQuestion.imageHint,
      ).slice(0, 500),
  };

  // ----------------------------------------------------------
  // MULTIPLE CHOICE
  // ----------------------------------------------------------

  if (
    type === 'multiple' &&
    !isMultipleChoiceValid(
      normalized,
    )
  ) {
    return null;
  }

  // ----------------------------------------------------------
  // TRUE / FALSE
  // ----------------------------------------------------------

  if (
    type === 'truefalse'
  ) {
    if (
      !(
        normalized.correct === 0 ||
        normalized.correct === 1
      )
    ) {
      return null;
    }
  }

  // ----------------------------------------------------------
  // LOCAL VISUAL
  // ----------------------------------------------------------

  const qImage =
    normalized.clock
      ? buildClockSvg(
          normalized.clock,
        )
      : normalized.graph
        ? buildGraphSvg(
            normalized.graph,
          )
        : undefined;

  return {
    type:
      normalized.type,

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

    difficulty:
      normalized.difficulty,

    competency:
      normalized.competency,

    blueprintNo:
      normalized.blueprintNo,

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

    visualKind:
      normalized.clock
        ? 'clock'
        : normalized.graph
          ? 'graph'
          : 'none',

    sourceTitle:
      'Blueprint Gemilang',

    sourceUrl:
      '',

    // PENTING:
    // Tidak ada riset internet.
    researchBacked:
      false,

    sourceMode:
      currentMode,
  };
}

// ============================================================
// COUNT DIAGNOSTICS
// ============================================================

function countBy(
  items,
  key,
) {
  return items.reduce(
    (result, item) => {
      const value =
        item[key] || 'unknown';

      result[value] =
        (result[value] || 0) + 1;

      return result;
    },
    {},
  );
}

// ============================================================
// SYSTEM PROMPT
// ============================================================

function buildSystemPrompt({
  allowedTypes,
}) {
  return [
    'Kamu adalah Otak Akademik Bimbel Gemilang.',

    'Tugasmu membuat soal latihan akademik berdasarkan BLUEPRINT yang diberikan.',

    '',

    'ATURAN MUTLAK:',

    '1. Jangan mengaku melakukan browsing atau penelitian internet.',

    '2. Jangan mengaku menggunakan sumber eksternal.',

    '3. Setiap soal WAJIB mengikuti nomor blueprint.',

    '4. Setiap soal WAJIB mengikuti difficulty blueprint.',

    '5. Setiap soal WAJIB mengikuti competency blueprint.',

    '6. Untuk tipe multiple, hanya boleh ada SATU jawaban benar.',

    '7. Hitung ulang seluruh operasi matematika dan angka sebelum menentukan kunci.',

    '8. Jangan membuat pilihan yang ambigu.',

    '9. Pembahasan harus menjelaskan proses dan alasan jawaban benar.',

    '10. Jangan menyalin teks sumber tertentu.',

    '11. Jangan menambahkan markdown.',

    '12. Jangan memberikan kalimat pengantar atau penutup.',

    '',

    'FORMAT OUTPUT:',

    'Baris pertama:',
    '{"meta":true}',

    'Setelah itu setiap baris harus satu objek JSON valid.',

    '',

    'SCHEMA MINIMUM:',

    '{"type":"multiple","blueprintNo":1,"difficulty":"Medium","competency":"...","question":"...","options":["A","B","C","D"],"correct":0,"explanation":"...","answerVerification":"...","analysisSummary":"..."}',

    '',

    `Tipe yang diperbolehkan: ${allowedTypes.join(', ')}.`,

    '',

    'VISUAL:',

    'Jika soal menggunakan jam:',
    'clock:{"hour":8,"minute":30}',

    'Jika soal menggunakan grafik:',
    'graph:{"points":[{"x":0,"y":0},{"x":1,"y":2}],"xLabel":"x","yLabel":"y"}',

    'Jika membutuhkan ilustrasi eksternal:',
    'needsImage:true,imageHint:"English search phrase"',

    '',

    'Jangan membuat soal di luar jumlah blueprint.',

    'Jangan mengubah urutan nomor blueprint.',
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

    `MATA PELAJARAN: ${mapel}`,

    `KELAS: ${kelas}`,

    `TARGET TAHUN: ${year}`,

    `MODE: ${currentMode}`,

    `ARAHAN GURU: ${
      arahan || 'Tidak ada.'
    }`,

    '',

    'BLUEPRINT PER BUTIR:',

    JSON.stringify(
      blueprint,
    ),

    '',

    'Buat semua soal sesuai blueprint.',

    'Output HANYA JSONL.',
  ].join('\n');
}

// ============================================================
// SILICONFLOW API
// ============================================================

async function callSiliconFlow({
  apiKey,
  systemPrompt,
  userPrompt,
}) {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () =>
        controller.abort(),
      AI_TIMEOUT_MS,
    );

  try {
    const response =
      await fetch(
        SILICONFLOW_API_URL,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({
              model:
                SILICONFLOW_MODEL,

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
                0.25,

              top_p:
                0.7,

              max_tokens:
                9_000,

              stream:
                false,
            }),

          signal:
            controller.signal,
        },
      );

    const text =
      await response.text();

    let data = null;

    try {
      data =
        text
          ? JSON.parse(text)
          : null;
    } catch (_) {
      data = null;
    }

    if (!response.ok) {
      const providerMessage =
        data?.message ||
        data?.error?.message ||
        (
          text
            ? text.slice(
                0,
                500,
              )
            : 'Unknown provider error'
        );

      throw new Error(
        `SiliconFlow HTTP ${response.status}: ${providerMessage}`,
      );
    }

    const content =
      data
        ?.choices?.[0]
        ?.message
        ?.content;

    if (
      typeof content !==
        'string' ||
      !content.trim()
    ) {
      throw new Error(
        'SiliconFlow mengembalikan content kosong.',
      );
    }

    return {
      content,

      usage:
        data?.usage ||
        null,

      model:
        data?.model ||
        SILICONFLOW_MODEL,
    };

  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// MAIN HANDLER
// ============================================================

export default async function handler(
  req,
  res,
) {

  // ----------------------------------------------------------
  // METHOD
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // BODY
  // ----------------------------------------------------------

  const body =
    req.body &&
    typeof req.body ===
      'object'
      ? req.body
      : {};

  // ----------------------------------------------------------
  // INPUT
  // ----------------------------------------------------------

  const topic =
    asSafePromptField(
      body.topic,
    );

  const mapel =
    asSafePromptField(
      body.mapel,
      'Umum',
    );

  const kelas =
    asSafePromptField(
      body.kelas,
      'Umum',
    );

  const arahan =
    asSafePromptField(
      body.arahan,
      'Tidak ada.',
    );

  const hotsLevel =
    asSafePromptField(
      body.hotsLevel,
      'Standard',
    );

  const targetYear =
    String(
      body.targetYear ||
        new Date().getFullYear() + 1,
    ).slice(
      0,
      9,
    );

  const currentMode =
    body.sourceMode ===
    'prediction'
      ? 'prediction'
      : 'source';

  // ----------------------------------------------------------
  // REQUIRED TOPIC
  // ----------------------------------------------------------

  if (!topic) {
    return res
      .status(400)
      .json({
        success: false,
        error:
          'Topik wajib diisi.',
      });
  }

  // ----------------------------------------------------------
  // API KEY
  // ----------------------------------------------------------

  const apiKey =
    process.env.SILICONFLOW_API_KEY;

  if (!apiKey) {
    return res
      .status(500)
      .json({
        success: false,
        error:
          'SILICONFLOW_API_KEY belum dikonfigurasi di environment server.',
      });
  }

  // ----------------------------------------------------------
  // QUESTION COUNT
  // ----------------------------------------------------------

  const requested =
    clampInt(
      body.jumlahSoal,
      1,
      ABSOLUTE_MAX_BATCH_QUESTIONS,
      DEFAULT_MAX_BATCH_QUESTIONS,
    );

  const jumlah =
    Math.min(
      requested,
      ABSOLUTE_MAX_BATCH_QUESTIONS,
    );

  // ----------------------------------------------------------
  // QUESTION TYPES
  // ----------------------------------------------------------

  const requestedTypes =
    Array.isArray(body.types)
      ? body.types
      : ['multiple'];

  const allowedTypes =
    [
      ...new Set(
        requestedTypes
          .map(
            (value) =>
              cleanText(
                value,
              ).toLowerCase(),
          )
          .filter(
            (value) =>
              SUPPORTED_TYPES.has(
                value,
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
          'Tidak ada tipe soal yang didukung.',

        supportedTypes:
          [...SUPPORTED_TYPES],
      });
  }

  // ==========================================================
  // 1. LOCAL BLUEPRINT
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

  // ==========================================================
  // 2. PROMPTS
  // ==========================================================

  const systemPrompt =
    buildSystemPrompt({
      allowedTypes,
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
    });

  // ==========================================================
  // 3. ONE SILICONFLOW CALL
  // ==========================================================

  let aiResult;

  try {

    aiResult =
      await callSiliconFlow({
        apiKey,
        systemPrompt,
        userPrompt,
      });

  } catch (error) {

    console.error(
      '[generateQuizFromTopic] SiliconFlow error:',
      error,
    );

    return res
      .status(502)
      .json({
        success: false,

        error:
          'Mesin AI SiliconFlow gagal melayani pembuatan kuis.',
      });
  }

  // ==========================================================
  // 4. PARSE JSONL
  // ==========================================================

  const objects =
    parseJsonLines(
      aiResult.content,
    );

  const questions = [];

  const rejectedReasons = {};

  // ==========================================================
  // 5. QUALITY GATE
  // ==========================================================

  for (
    const rawQuestion of objects
  ) {

    // META
    if (
      rawQuestion?.meta === true
    ) {
      continue;
    }

    // STRUCTURE
    const normalized =
      normalizeQuestion(
        rawQuestion,
        allowedTypes,
        currentMode,
      );

    if (!normalized) {

      rejectedReasons.invalidStructure =
        (
          rejectedReasons.invalidStructure ||
          0
        ) + 1;

      continue;
    }

    // DUPLICATE
    if (
      isDuplicateQuestion(
        normalized.question,
        questions,
      )
    ) {

      rejectedReasons.duplicate =
        (
          rejectedReasons.duplicate ||
          0
        ) + 1;

      continue;
    }

    questions.push(
      normalized,
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
  // 6. EMPTY RESULT
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
          'Quality Gate tidak menemukan butir soal valid dari respons AI.',

        diagnostics: {
          parsedObjectCount:
            objects.length,

          requestedCount:
            jumlah,

          rejectedReasons,

          modelUsed:
            aiResult.model,
        },
      });
  }

  // ==========================================================
  // 7. RESPONSE
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
          objects.length,

        acceptedCount:
          questions.length,

        rejectedReasons,

        modelUsed:
          aiResult.model,

        usage:
          aiResult.usage,

        blueprintCount:
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
          false,
      },
    });
}