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
// GITHUB MODELS API (CHAT COMPLETIONS)
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
// - SiliconFlow (dihapus -- berbayar, melanggar prinsip gratis murni)
// - Scraping
//
// ENV:
// GITHUB_TOKEN=... (Personal Access Token dengan izin "models: read" --
//   dibuat manual di https://github.com/settings/tokens, BUKAN token
//   otomatis dari GitHub Actions. Function ini jalan di Vercel, bukan
//   di dalam GitHub Actions, jadi token Actions bawaan gak berlaku di
//   sini -- harus PAT yang dibuat & disimpan manual sebagai env var.)
//
// OPTIONAL:
// GITHUB_MODEL=meta/Llama-3.1-70B-Instruct
//   (⚠️ CEK DULU ID PERSIS-nya di https://github.com/marketplace/models
//   sebelum deploy -- katalog GitHub Models bisa berubah/rename model.
//   Salah ID = request langsung ditolak provider, gejalanya SAMA PERSIS
//   kayak error 502 SiliconFlow kemarin, cuma provider-nya beda.)
//
// ⚠️ CATATAN JUJUR SOAL "GRATIS": GitHub Models API secara resmi
// ditujukan untuk PROTOTYPING/eksperimen, BUKAN trafik produksi skala
// bisnis (lihat dokumentasi resmi GitHub). Limit hariannya per-model
// per-user bisa serendah puluhan request/hari. Ini TETAP dipasang
// sesuai keputusan bisnis (gratis > berbayar), tapi kalau limit
// harian habis, fitur ini akan berhenti total sampai reset besok --
// bukan bug, itu batas layanan gratisnya. Pesan error di bawah
// dibuat eksplisit menjelaskan ini ke guru, bukan pesan generik.
//
// ============================================================

export const maxDuration = 60;

// ============================================================
// CONFIG
// ============================================================

const GITHUB_MODELS_API_URL =
  'https://models.github.ai/inference/chat/completions';

const GITHUB_MODEL =
  process.env.GITHUB_MODEL ||
  'meta/Llama-3.1-70B-Instruct';

const DEFAULT_QUESTION_COUNT = 10;
const MAX_QUESTION_COUNT = 20;

const AI_TIMEOUT_MS = 45_000;

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
      'Blueprint Gemilang',

    sourceUrl:
      '',

    researchBacked:
      false,

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
}) {
  return [
    'Kamu adalah Otak Akademik Bimbel Gemilang.',

    'Buat soal latihan akademik berdasarkan BLUEPRINT PER BUTIR yang diberikan.',

    '',

    'ATURAN MUTLAK:',

    '1. Jangan browsing.',

    '2. Jangan mengaku melakukan browsing.',

    '3. Jangan mengaku memakai sumber eksternal.',

    '4. Jangan menyalin soal dari sumber tertentu.',

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

    '{"type":"multiple","blueprintNo":1,"difficulty":"Easy","competency":"...","question":"...","options":["...","...","...","..."],"correct":0,"explanation":"...","answerVerification":"...","analysisSummary":"..."}',

    '',

    `Tipe yang diperbolehkan: ${allowedTypes.join(', ')}`,

    '',

    'VISUAL CLOCK:',

    '"clock":{"hour":8,"minute":30}',

    '',

    'VISUAL GRAPH:',

    '"graph":{"points":[{"x":0,"y":0},{"x":1,"y":2}],"xLabel":"x","yLabel":"y"}',

    '',

    'IMAGE:',

    '"needsImage":true,"imageHint":"English image description"',

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
// GITHUB MODELS API
// ============================================================

async function callGitHubModels({
  apiKey,
  systemPrompt,
  userPrompt,
}) {
  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () =>
        controller.abort(),
      AI_TIMEOUT_MS,
    );

  try {
    const response =
      await fetch(
        GITHUB_MODELS_API_URL,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            'Content-Type':
              'application/json',

            // 🔥 GitHub Models API adalah REST API resmi GitHub (bukan
            // endpoint generik seperti SiliconFlow) -- dua header ini
            // WAJIB sesuai dokumentasi resmi, beda dari provider lama.
            Accept:
              'application/vnd.github+json',

            'X-GitHub-Api-Version':
              '2022-11-28',
          },

          body: JSON.stringify({
            model:
              GITHUB_MODEL,

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
              9000,

            stream:
              false,
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
          `GitHub Models HTTP ${response.status}`,
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

      // 🔥 BARU: GitHub Models API kasih header `x-ratelimit-type`
      // (mis. "UserByModelByDay") begitu limit HARIAN habis -- beda
      // dari rate-limit biasa yang cuma nunggu beberapa detik. Ini
      // ditandai khusus supaya sendGitHubModelsError() bisa kasih
      // pesan jujur "limit harian habis, coba lagi besok" ke guru,
      // BUKAN pesan generik yang bikin guru kira sistemnya rusak.
      error.rateLimitType =
        response.headers.get(
          'x-ratelimit-type',
        ) ||
        null;

      error.retryAfter =
        response.headers.get(
          'retry-after',
        ) ||
        null;

      error.traceId =
        response.headers.get(
          'x-github-request-id',
        ) ||
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
          'GitHub Models response content kosong.',
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
        GITHUB_MODEL,

      finishReason:
        data
          ?.choices?.[0]
          ?.finish_reason ||
        null,

      traceId:
        response.headers.get(
          'x-github-request-id',
        ) ||
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
          `GitHub Models timeout setelah ${AI_TIMEOUT_MS}ms.`,
        );

      timeoutError.code =
        'GITHUB_MODELS_TIMEOUT';

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

function sendGitHubModelsError(
  res,
  error,
) {
  // ----------------------------------------------------------
  // TIMEOUT
  // ----------------------------------------------------------

  if (
    error?.code ===
    'GITHUB_MODELS_TIMEOUT'
  ) {
    return res
      .status(504)
      .json({
        success: false,

        error:
          'GitHub Models terlalu lama merespons.',

        diagnostics: {
          type:
            'timeout',

          timeoutMs:
            AI_TIMEOUT_MS,

          model:
            GITHUB_MODEL,
        },
      });
  }

  // ----------------------------------------------------------
  // RATE LIMIT HARIAN HABIS (bukan sekadar terlalu cepat -- ini
  // jatah gratis hari ini sudah habis total, baru reset besok)
  // ----------------------------------------------------------

  if (
    error?.providerStatus === 429 &&
    error?.rateLimitType
  ) {
    return res
      .status(429)
      .json({
        success: false,

        error:
          `Jatah gratis GitHub Models untuk model ini sudah habis hari ini (${error.rateLimitType}). Coba lagi besok, atau gunakan model lain lewat env var GITHUB_MODEL sementara waktu.`,

        diagnostics: {
          type:
            'daily_quota_exhausted',

          rateLimitType:
            error.rateLimitType,

          retryAfterSeconds:
            error.retryAfter ||
            null,

          model:
            GITHUB_MODEL,
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
          'GitHub Models menolak atau gagal memproses permintaan.',

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
            GITHUB_MODEL,
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
        'Server gagal terhubung ke GitHub Models.',

      diagnostics: {
        type:
          'network_or_runtime_error',

        message:
          error?.message ||
          'Unknown error',

        model:
          GITHUB_MODEL,
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
    process.env.GITHUB_TOKEN;

  if (!apiKey) {
    return res
      .status(500)
      .json({
        success: false,

        error:
          'GITHUB_TOKEN belum dikonfigurasi di Vercel. Buat Personal Access Token dengan izin "models: read" di github.com/settings/tokens, lalu simpan sebagai environment variable GITHUB_TOKEN.',
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

  // ==========================================================
  // 2. PROMPT
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
      year:
        targetYear,
      currentMode,
      arahan,
      blueprint,
    });

  // ==========================================================
  // 3. CALL GITHUB MODELS
  // ==========================================================

  let aiResult;

  try {
    aiResult =
      await callGitHubModels({
        apiKey,
        systemPrompt,
        userPrompt,
      });

  } catch (error) {
    console.error(
      '[Gemilang AI] GitHub Models error',
      {
        message:
          error?.message,

        providerStatus:
          error?.providerStatus,

        providerMessage:
          error?.providerMessage,

        rateLimitType:
          error?.rateLimitType,

        traceId:
          error?.traceId,

        code:
          error?.code,

        model:
          GITHUB_MODEL,
      },
    );

    return sendGitHubModelsError(
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
          'Quality Gate tidak menemukan soal valid dari respons GitHub Models.',

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
          false,

        researchBacked:
          false,
      },
    });
}