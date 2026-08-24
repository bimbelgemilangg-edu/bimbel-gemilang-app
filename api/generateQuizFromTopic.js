// ============================================================
// BIMBEL GEMILANG
// GENERATE QUIZ FROM TOPIC
// ============================================================
//
// ARSITEKTUR FINAL
//
// FRONTEND
//    ↓
// /api/generateQuizFromTopic
//    ↓
// LOCAL BLUEPRINT ENGINE
//    ↓
// 1x SILICONFLOW
//    ↓
// LOCAL QUALITY GATE
//    ↓
// MANAGE QUIZ
//
// TIDAK MENGGUNAKAN:
// - Jina
// - DuckDuckGo
// - Google Search API
// - Groq
// - Cloudflare AI
// - Scraping website
//
// ENV:
// SILICONFLOW_API_KEY
//
// OPTIONAL:
// SILICONFLOW_MODEL
//
// ============================================================

export const maxDuration = 60;

const SILICONFLOW_API_URL =
  'https://api.siliconflow.cn/v1/chat/completions';

const SILICONFLOW_MODEL =
  process.env.SILICONFLOW_MODEL ||
  'deepseek-ai/DeepSeek-V3';

const MAX_BATCH_QUESTIONS = 20;

const AI_TIMEOUT_MS = 45000;


// ============================================================
// BASIC HELPERS
// ============================================================

function cleanText(value = '') {
  return String(value ?? '')
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


function isIntegerInRange(value, min, max) {
  return (
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  );
}


function tokenSet(value = '') {
  return new Set(
    normalizeText(value)
      .split(' ')
      .filter((x) => x.length >= 2)
  );
}


function jaccardSimilarity(a, b) {
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
      intersection++;
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


// ============================================================
// DUPLICATE CHECK
// ============================================================

function fingerprintQuestion(value = '') {
  return normalizeText(value)
    .replace(/\bsoal\s+\d+\b/gi, ' ')
    .replace(/\bnomor\s+\d+\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function isDuplicateQuestion(question, existing) {
  const current =
    fingerprintQuestion(question);

  if (!current) {
    return true;
  }

  for (const item of existing) {
    const old =
      fingerprintQuestion(
        item.question
      );

    if (!old) {
      continue;
    }

    if (current === old) {
      return true;
    }

    if (
      jaccardSimilarity(
        current,
        old
      ) >= 0.86
    ) {
      return true;
    }
  }

  return false;
}


// ============================================================
// BLUEPRINT ENGINE
// ============================================================
//
// 100% LOCAL.
// 0 TOKEN.
// 0 API CALL.
//
// Tujuan:
// AI tidak menerima permintaan kosong.
// AI menerima cetak biru yang jelas mengenai distribusi soal.
//
// ============================================================

function buildCurriculumBlueprint({
  topic,
  mapel,
  kelas,
  jumlah,
  hotsLevel,
  arahan,
}) {
  const normalizedTopic =
    normalizeText(topic);

  const normalizedMapel =
    normalizeText(mapel);

  const normalizedKelas =
    normalizeText(kelas);

  const normalizedDirection =
    normalizeText(arahan);

  const blueprint = [];

  // ----------------------------------------------------------
  // KATEGORI KESULITAN
  // ----------------------------------------------------------

  let levels = [
    {
      level: 'Easy',
      ratio: 0.3,
      competency:
        'Pemahaman konsep dasar',
    },
    {
      level: 'Medium',
      ratio: 0.4,
      competency:
        'Penerapan konsep dan penalaran',
    },
    {
      level: 'Hard',
      ratio: 0.3,
      competency:
        'Analisis dan pemecahan masalah',
    },
  ];

  if (
    normalizeText(hotsLevel)
      .includes('hots')
  ) {
    levels = [
      {
        level: 'Easy',
        ratio: 0.1,
        competency:
          'Pemahaman konsep sebagai dasar penalaran',
      },
      {
        level: 'Medium',
        ratio: 0.4,
        competency:
          'Penerapan konsep pada konteks',
      },
      {
        level: 'Hard',
        ratio: 0.5,
        competency:
          'Analisis, evaluasi, dan pemecahan masalah',
      },
    ];
  }

  // ----------------------------------------------------------
  // KOMPETENSI BERDASARKAN MAPEL
  // ----------------------------------------------------------

  let competencyTemplates = [
    'Pemahaman konsep',
    'Penerapan konsep',
    'Analisis dan pemecahan masalah',
  ];

  if (
    normalizedMapel.includes('matematika') ||
    normalizedTopic.includes('pecahan') ||
    normalizedTopic.includes('aljabar') ||
    normalizedTopic.includes('geometri') ||
    normalizedTopic.includes('bilangan')
  ) {
    competencyTemplates = [
      'Memahami konsep dan representasi matematis',
      'Menerapkan prosedur atau konsep matematika',
      'Memecahkan masalah kontekstual dan bernalar kuantitatif',
    ];
  }

  else if (
    normalizedMapel.includes('ipa') ||
    normalizedMapel.includes('fisika') ||
    normalizedMapel.includes('kimia') ||
    normalizedMapel.includes('biologi')
  ) {
    competencyTemplates = [
      'Memahami konsep dan fenomena ilmiah',
      'Menerapkan konsep pada situasi ilmiah',
      'Menganalisis data, fenomena, atau permasalahan',
    ];
  }

  else if (
    normalizedMapel.includes('bahasa indonesia')
  ) {
    competencyTemplates = [
      'Memahami informasi eksplisit dan implisit',
      'Menganalisis struktur dan makna teks',
      'Mengevaluasi informasi dan menarik kesimpulan',
    ];
  }

  else if (
    normalizedMapel.includes('bahasa inggris')
  ) {
    competencyTemplates = [
      'Memahami informasi dalam teks',
      'Menerapkan kosakata atau struktur bahasa',
      'Menganalisis makna dan konteks komunikasi',
    ];
  }

  else if (
    normalizedMapel.includes('ips') ||
    normalizedMapel.includes('sejarah') ||
    normalizedMapel.includes('geografi') ||
    normalizedMapel.includes('ekonomi')
  ) {
    competencyTemplates = [
      'Memahami konsep dan fakta penting',
      'Menerapkan konsep dalam konteks',
      'Menganalisis hubungan sebab-akibat dan data',
    ];
  }

  // ----------------------------------------------------------
  // HITUNG DISTRIBUSI
  // ----------------------------------------------------------

  const counts = levels.map(
    (level) =>
      Math.round(
        jumlah * level.ratio
      )
  );

  let difference =
    jumlah -
    counts.reduce(
      (sum, value) =>
        sum + value,
      0
    );

  let cursor = 0;

  while (difference !== 0) {
    const index =
      cursor %
      counts.length;

    if (difference > 0) {
      counts[index]++;
      difference--;
    } else if (
      counts[index] > 0
    ) {
      counts[index]--;
      difference++;
    }

    cursor++;
  }

  // ----------------------------------------------------------
  // BENTUKKAN BUTIR
  // ----------------------------------------------------------

  let number = 1;

  levels.forEach(
    (level, levelIndex) => {
      for (
        let i = 0;
        i < counts[levelIndex];
        i++
      ) {
        blueprint.push({
          soalNomor: number,

          topik:
            cleanText(topic),

          mapel:
            cleanText(mapel) ||
            'Umum',

          kelas:
            cleanText(kelas) ||
            'Umum',

          tingkatKesulitan:
            level.level,

          kompetensi:
            competencyTemplates[
              levelIndex %
                competencyTemplates.length
            ],

          target:
            level.competency,

          fokus:
            cleanText(
              arahan
            ) ||
            'Sesuai topik dan kompetensi',

          keyword:
            [
              cleanText(mapel),
              cleanText(kelas),
              cleanText(topic),
              competencyTemplates[
                levelIndex %
                  competencyTemplates.length
              ],
            ]
              .filter(Boolean)
              .join(' '),

          hots:
            level.level ===
              'Hard' ||
            normalizeText(
              hotsLevel
            ).includes('hots'),
        });

        number++;
      }
    }
  );

  return blueprint;
}


// ============================================================
// CLOCK SVG
// ============================================================

function buildClockImageSvg(clock) {
  if (
    !clock ||
    !Number.isFinite(
      Number(clock.hour)
    ) ||
    !Number.isFinite(
      Number(clock.minute)
    )
  ) {
    return '';
  }

  const hour =
    ((Number(clock.hour) %
      12) +
      12) %
    12;

  const minute =
    Math.max(
      0,
      Math.min(
        59,
        Number(clock.minute)
      )
    );

  const cx = 140;
  const cy = 140;
  const radius = 110;

  const toXY = (
    angle,
    length
  ) => {
    const rad =
      ((angle - 90) *
        Math.PI) /
      180;

    return {
      x:
        cx +
        length *
          Math.cos(rad),

      y:
        cy +
        length *
          Math.sin(rad),
    };
  };

  const hourTip =
    toXY(
      hour * 30 +
        minute * 0.5,
      55
    );

  const minuteTip =
    toXY(
      minute * 6,
      82
    );

  const ticks =
    Array.from(
      { length: 60 },
      (_, i) => {
        const major =
          i % 5 === 0;

        const outer =
          toXY(
            i * 6,
            radius
          );

        const inner =
          toXY(
            i * 6,
            major
              ? radius - 13
              : radius - 7
          );

        return `
<line
x1="${outer.x.toFixed(2)}"
y1="${outer.y.toFixed(2)}"
x2="${inner.x.toFixed(2)}"
y2="${inner.y.toFixed(2)}"
stroke="#334155"
stroke-width="${
          major ? 2 : 1
        }"
/>`;
      }
    ).join('');

  const numbers =
    Array.from(
      { length: 12 },
      (_, i) => {
        const number =
          i === 0 ? 12 : i;

        const p =
          toXY(
            i * 30,
            84
          );

        return `
<text
x="${p.x}"
y="${p.y + 6}"
text-anchor="middle"
font-family="Arial"
font-size="18"
font-weight="700"
fill="#1e293b"
>${number}</text>`;
      }
    ).join('');

  const svg = `
<svg
xmlns="http://www.w3.org/2000/svg"
viewBox="0 0 280 280"
width="280"
height="280"
>
<rect
width="280"
height="280"
fill="white"
/>

<circle
cx="140"
cy="140"
r="${radius}"
fill="white"
stroke="#1e293b"
stroke-width="3"
/>

${ticks}
${numbers}

<line
x1="140"
y1="140"
x2="${hourTip.x}"
y2="${hourTip.y}"
stroke="#1e293b"
stroke-width="6"
stroke-linecap="round"
/>

<line
x1="140"
y1="140"
x2="${minuteTip.x}"
y2="${minuteTip.y}"
stroke="#475569"
stroke-width="4"
stroke-linecap="round"
/>

<circle
cx="140"
cy="140"
r="5"
fill="#1e293b"
/>
</svg>
`;

  return (
    'data:image/svg+xml;base64,' +
    Buffer.from(svg).toString(
      'base64'
    )
  );
}


// ============================================================
// GRAPH SVG
// ============================================================

function buildGraphImageSvg(graph) {
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
          Number.isFinite(
            Number(p?.x)
          ) &&
          Number.isFinite(
            Number(p?.y)
          )
      )
      .slice(0, 80);

  if (points.length < 2) {
    return '';
  }

  const W = 640;
  const H = 400;
  const pad = 55;

  const xs =
    points.map(
      (p) => Number(p.x)
    );

  const ys =
    points.map(
      (p) => Number(p.y)
    );

  const minX =
    Math.min(...xs);

  const maxX =
    Math.max(...xs);

  const minY =
    Math.min(...ys);

  const maxY =
    Math.max(...ys);

  const mapX = (x) =>
    pad +
    ((x - minX) /
      Math.max(
        maxX - minX,
        1
      )) *
      (W - pad * 2);

  const mapY = (y) =>
    H -
    pad -
    ((y - minY) /
      Math.max(
        maxY - minY,
        1
      )) *
      (H - pad * 2);

  const path =
    points
      .map(
        (p, i) =>
          `${
            i === 0
              ? 'M'
              : 'L'
          } ${mapX(
            Number(p.x)
          ).toFixed(
            1
          )} ${mapY(
            Number(p.y)
          ).toFixed(
            1
          )}`
      )
      .join(' ');

  const highlights =
    Array.isArray(
      graph.highlight
    )
      ? graph.highlight
          .filter(
            (p) =>
              Number.isFinite(
                Number(p?.x)
              ) &&
              Number.isFinite(
                Number(p?.y)
              )
          )
          .map(
            (p) =>
              `<circle
cx="${mapX(
                Number(p.x)
              )}"
cy="${mapY(
                Number(p.y)
              )}"
r="7"
fill="#dc2626"
/>`
          )
          .join('')
      : '';

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
fill="white"
/>

<line
x1="${pad}"
y1="${H - pad}"
x2="${W - pad}"
y2="${H - pad}"
stroke="#64748b"
stroke-width="2"
/>

<line
x1="${pad}"
y1="${pad}"
x2="${pad}"
y2="${H - pad}"
stroke="#64748b"
stroke-width="2"
/>

<path
d="${path}"
fill="none"
stroke="#1e293b"
stroke-width="3"
/>

${highlights}

<text
x="${W - pad}"
y="${H - 15}"
font-family="Arial"
font-size="16"
>
${cleanText(
  graph.xLabel || 'x'
)}
</text>

<text
x="15"
y="${pad}"
font-family="Arial"
font-size="16"
>
${cleanText(
  graph.yLabel || 'y'
)}
</text>

</svg>
`;

  return (
    'data:image/svg+xml;base64,' +
    Buffer.from(svg).toString(
      'base64'
    )
  );
}


// ============================================================
// SILICONFLOW
// ============================================================

async function callSiliconFlow({
  systemPrompt,
  userPrompt,
}) {
  const apiKey =
    process.env.SILICONFLOW_API_KEY;

  if (!apiKey) {
    throw new Error(
      'SILICONFLOW_API_KEY belum tersedia di Vercel.'
    );
  }

  const controller =
    new AbortController();

  const timer =
    setTimeout(() => {
      controller.abort();
    }, AI_TIMEOUT_MS);

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

            Accept:
              'application/json',
          },

          body: JSON.stringify({
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

            temperature: 0.2,

            max_tokens:
              10000,

            stream: false,

            response_format: {
              type: 'json_object',
            },
          }),

          signal:
            controller.signal,
        }
      );

    const raw =
      await response.text();

    let data = null;

    try {
      data =
        JSON.parse(raw);
    } catch (_) {}

    if (!response.ok) {
      const error =
        new Error(
          data?.message ||
            data?.error?.message ||
            data?.errors?.[0]
              ?.message ||
            raw ||
            `SiliconFlow HTTP ${response.status}`
        );

      error.status =
        response.status;

      throw error;
    }

    return data;
  } finally {
    clearTimeout(timer);
  }
}


// ============================================================
// EXTRACT SILICONFLOW CONTENT
// ============================================================

function extractSiliconFlowText(data) {
  const content =
    data?.choices?.[0]
      ?.message?.content;

  if (
    typeof content ===
    'string'
  ) {
    return content;
  }

  if (
    Array.isArray(content)
  ) {
    return content
      .map(
        (item) =>
          item?.text || ''
      )
      .join('');
  }

  return '';
}


// ============================================================
// PARSE JSON
// ============================================================

function parseAIJson(text = '') {
  let value =
    String(text)
      .trim();

  value =
    value
      .replace(
        /^```json\s*/i,
        ''
      )
      .replace(
        /^```\s*/i,
        ''
      )
      .replace(
        /\s*```$/i,
        ''
      )
      .trim();

  // ----------------------------------------------------------
  // DIRECT
  // ----------------------------------------------------------

  try {
    return JSON.parse(value);
  } catch (_) {}

  // ----------------------------------------------------------
  // OBJECT
  // ----------------------------------------------------------

  const objectStart =
    value.indexOf('{');

  const objectEnd =
    value.lastIndexOf('}');

  if (
    objectStart >= 0 &&
    objectEnd > objectStart
  ) {
    try {
      return JSON.parse(
        value.slice(
          objectStart,
          objectEnd + 1
        )
      );
    } catch (_) {}
  }

  return null;
}


// ============================================================
// NORMALIZE AI RESPONSE
// ============================================================

function normalizeAIQuestions(parsed) {
  if (
    Array.isArray(parsed)
  ) {
    return parsed;
  }

  if (
    Array.isArray(
      parsed?.questions
    )
  ) {
    return parsed.questions;
  }

  if (
    Array.isArray(
      parsed?.soal
    )
  ) {
    return parsed.soal;
  }

  if (
    parsed &&
    typeof parsed ===
      'object' &&
    parsed.type &&
    parsed.question
  ) {
    return [parsed];
  }

  return [];
}


// ============================================================
// VALIDATE MULTIPLE
// ============================================================

function validateMultiple(raw) {
  if (
    !Array.isArray(
      raw.options
    ) ||
    raw.options.length !== 4
  ) {
    return false;
  }

  if (
    !isIntegerInRange(
      raw.correct,
      0,
      3
    )
  ) {
    return false;
  }

  return true;
}


// ============================================================
// VALIDATE MULTISELECT
// ============================================================

function validateMultiselect(raw) {
  if (
    !Array.isArray(
      raw.options
    ) ||
    raw.options.length < 2
  ) {
    return false;
  }

  if (
    !Array.isArray(
      raw.correctAnswers
    ) ||
    raw.correctAnswers.length ===
      0
  ) {
    return false;
  }

  return raw.correctAnswers.every(
    (index) =>
      isIntegerInRange(
        index,
        0,
        raw.options.length - 1
      )
  );
}


// ============================================================
// VALIDATE TRUE FALSE
// ============================================================

function validateTrueFalse(raw) {
  if (
    !Array.isArray(
      raw.statements
    ) ||
    raw.statements.length < 2
  ) {
    return false;
  }

  return raw.statements.every(
    (item) =>
      typeof item?.text ===
        'string' &&
      typeof item?.isTrue ===
        'boolean'
  );
}


// ============================================================
// VALIDATE READING
// ============================================================

function validateReading(raw) {
  if (
    !cleanText(
      raw.readingText
    )
  ) {
    return false;
  }

  if (
    !Array.isArray(
      raw.subQuestions
    ) ||
    raw.subQuestions.length < 3
  ) {
    return false;
  }

  return raw.subQuestions.every(
    (item) =>
      Array.isArray(
        item?.options
      ) &&
      item.options.length === 4 &&
      isIntegerInRange(
        item.correct,
        0,
        3
      )
  );
}


// ============================================================
// NORMALIZE QUESTION
// ============================================================

function normalizeQuestion(
  raw,
  allowedTypes
) {
  if (
    !raw ||
    raw.meta === true
  ) {
    return null;
  }

  if (
    !allowedTypes.includes(
      raw.type
    )
  ) {
    return null;
  }

  const question =
    cleanText(
      raw.question
    );

  if (
    question.length < 5
  ) {
    return null;
  }

  // ----------------------------------------------------------
  // TYPE VALIDATION
  // ----------------------------------------------------------

  if (
    raw.type === 'multiple' &&
    !validateMultiple(raw)
  ) {
    return null;
  }

  if (
    raw.type === 'multiselect' &&
    !validateMultiselect(raw)
  ) {
    return null;
  }

  if (
    raw.type === 'truefalse' &&
    !validateTrueFalse(raw)
  ) {
    return null;
  }

  if (
    raw.type === 'reading' &&
    !validateReading(raw)
  ) {
    return null;
  }

  if (
    raw.type === 'shortanswer' &&
    !cleanText(
      raw.shortAnswer
    )
  ) {
    return null;
  }

  if (
    raw.type === 'causeeffect'
  ) {
    if (
      !cleanText(raw.cause) ||
      !cleanText(raw.effect) ||
      typeof raw.isCauseTrue !==
        'boolean' ||
      typeof raw.isEffectTrue !==
        'boolean'
    ) {
      return null;
    }
  }

  if (
    raw.type === 'matching'
  ) {
    if (
      !Array.isArray(
        raw.matchingPairs
      ) ||
      raw.matchingPairs.length < 3
    ) {
      return null;
    }
  }

  // ----------------------------------------------------------
  // VISUAL
  // ----------------------------------------------------------

  let qImage =
    cleanText(
      raw.questionImageUrl ||
        raw.qImage ||
        ''
    );

  let visualKind =
    qImage
      ? 'source-image'
      : 'none';

  let visualRequired =
    Boolean(qImage);

  if (raw.clock) {
    qImage =
      buildClockImageSvg(
        raw.clock
      );

    if (qImage) {
      visualRequired =
        true;

      visualKind =
        'clock';
    }
  }

  if (raw.graph) {
    qImage =
      buildGraphImageSvg(
        raw.graph
      );

    if (qImage) {
      visualRequired =
        true;

      visualKind =
        'graph';
    }
  }

  const optionImages =
    Array.isArray(
      raw.optionImages
    )
      ? raw.optionImages
          .map(cleanText)
          .filter(Boolean)
      : [];

  const optionsAreImages =
    Boolean(
      raw.optionsAreImages
    ) ||
    optionImages.length >= 2;

  if (optionsAreImages) {
    visualRequired =
      true;

    visualKind =
      'image-options';
  }

  const needsImage =
    Boolean(
      raw.needsImage
    );

  if (needsImage) {
    visualRequired =
      true;

    if (
      visualKind === 'none'
    ) {
      visualKind =
        'photo';
    }
  }

  // ----------------------------------------------------------
  // RETURN
  // ----------------------------------------------------------

  return {
    type:
      raw.type,

    question,

    options:
      Array.isArray(
        raw.options
      )
        ? raw.options.map(
            cleanText
          )
        : [],

    optionImages,

    optionsAreImages,

    correct:
      Number.isInteger(
        raw.correct
      )
        ? raw.correct
        : 0,

    correctAnswers:
      Array.isArray(
        raw.correctAnswers
      )
        ? raw.correctAnswers
        : [],

    statements:
      Array.isArray(
        raw.statements
      )
        ? raw.statements
        : [],

    readingText:
      cleanText(
        raw.readingText
      ),

    subQuestions:
      Array.isArray(
        raw.subQuestions
      )
        ? raw.subQuestions
        : [],

    shortAnswer:
      cleanText(
        raw.shortAnswer
      ),

    cause:
      cleanText(
        raw.cause
      ),

    effect:
      cleanText(
        raw.effect
      ),

    isCauseTrue:
      typeof raw.isCauseTrue ===
      'boolean'
        ? raw.isCauseTrue
        : true,

    isEffectTrue:
      typeof raw.isEffectTrue ===
      'boolean'
        ? raw.isEffectTrue
        : true,

    matchingPairs:
      Array.isArray(
        raw.matchingPairs
      )
        ? raw.matchingPairs
        : [],

    explanation:
      cleanText(
        raw.explanation
      ),

    answerVerification:
      cleanText(
        raw.answerVerification
      ),

    analysisSummary:
      cleanText(
        raw.analysisSummary
      ),

    qImage:
      qImage ||
      undefined,

    needsImage,

    imageHint:
      cleanText(
        raw.imageHint ||
          raw.image_keyword ||
          ''
      ),

    imageSource:
      raw.imageSource ||
      null,

    researchBacked:
      false,

    researchSources:
      [],

    sourceMode:
      'blueprint',

    sourceIndex:
      null,

    sourceTitle:
      'Blueprint Akademik Gemilang',

    sourceUrl:
      '',

    sourceQuestionVerbatim:
      false,

    sourceEvidenceScore:
      0,

    visualRequired,

    visualKind,

    blueprint:
      raw.blueprint ||
      null,
  };
}


// ============================================================
// SYSTEM PROMPT
// ============================================================

function buildSystemPrompt({
  allowedTypes,
  targetYear,
  sourceMode,
}) {
  return `
Kamu adalah OTak Akademik Bimbel Gemilang.

Tugasmu adalah membuat soal pendidikan berdasarkan
BLUEPRINT KISI-KISI yang diberikan oleh backend.

TAHUN TARGET:
${targetYear}

MODE:
${sourceMode}

============================================================
ATURAN UTAMA
============================================================

1. Ikuti blueprint secara ketat.

2. Jumlah soal HARUS sesuai permintaan.

3. Setiap nomor harus mengikuti:
   - kompetensi
   - tingkat kesulitan
   - target
   - fokus

4. Jangan mengklaim soal sebagai bocoran ujian.

5. Jangan mengatakan soal pasti keluar.

6. Buat soal baru dan orisinal.

7. Jangan menyalin teks dari sumber tertentu.

8. Untuk matematika:
   - hitung ulang jawaban.
   - pastikan hanya satu jawaban benar.
   - jangan membuat angka yang menghasilkan ambiguitas.

9. Untuk IPA:
   - pastikan konsep ilmiah benar.

10. Untuk Bahasa Indonesia:
   - stimulus harus mendukung pertanyaan.

11. Untuk Bahasa Inggris:
   - grammar dan makna harus konsisten.

12. Untuk HOTS:
   - jangan sekadar membuat angka lebih besar.
   - gunakan analisis, penerapan, interpretasi, atau pemecahan masalah.

============================================================
VISUAL
============================================================

Jika soal memang membutuhkan jam:

gunakan:

"clock":{
  "hour":8,
  "minute":30
}

Jika membutuhkan grafik:

gunakan:

"graph":{
  "points":[
    {"x":0,"y":0},
    {"x":1,"y":2},
    {"x":2,"y":4}
  ],
  "highlight":[],
  "xLabel":"x",
  "yLabel":"y"
}

Jika membutuhkan gambar umum:

"needsImage":true

dan:

"imageHint":"clear English description"

Jangan membuat URL gambar palsu.

============================================================
TIPE YANG DIIZINKAN
============================================================

${allowedTypes
  .map(
    (type) =>
      `- ${type}`
  )
  .join('\n')}

============================================================
OUTPUT
============================================================

Output HARUS berupa satu JSON object.

Format:

{
  "questions":[
    {...},
    {...}
  ]
}

JANGAN menggunakan markdown.

JANGAN menggunakan \`\`\`.

JANGAN memberikan penjelasan di luar JSON.

============================================================
MULTIPLE
============================================================

{
  "type":"multiple",
  "question":"...",
  "options":[
    "A",
    "B",
    "C",
    "D"
  ],
  "correct":0,
  "explanation":"...",
  "answerVerification":"...",
  "analysisSummary":"..."
}

correct:
0 = A
1 = B
2 = C
3 = D

============================================================
MULTISELECT
============================================================

{
  "type":"multiselect",
  "question":"...",
  "options":[
    "A",
    "B",
    "C",
    "D"
  ],
  "correctAnswers":[0,2],
  "explanation":"..."
}

============================================================
TRUE FALSE
============================================================

{
  "type":"truefalse",
  "question":"...",
  "statements":[
    {
      "text":"...",
      "isTrue":true
    },
    {
      "text":"...",
      "isTrue":false
    }
  ],
  "explanation":"..."
}

============================================================
SHORT ANSWER
============================================================

{
  "type":"shortanswer",
  "question":"...",
  "shortAnswer":"...",
  "explanation":"..."
}

============================================================
CAUSE EFFECT
============================================================

{
  "type":"causeeffect",
  "question":"...",
  "cause":"...",
  "effect":"...",
  "isCauseTrue":true,
  "isEffectTrue":false,
  "explanation":"..."
}

============================================================
MATCHING
============================================================

{
  "type":"matching",
  "question":"...",
  "matchingPairs":[
    {
      "left":"...",
      "right":"..."
    },
    {
      "left":"...",
      "right":"..."
    },
    {
      "left":"...",
      "right":"..."
    }
  ],
  "explanation":"..."
}

============================================================
READING
============================================================

{
  "type":"reading",
  "question":"...",
  "readingText":"...",
  "subQuestions":[
    {
      "q":"...",
      "options":["A","B","C","D"],
      "correct":0
    },
    {
      "q":"...",
      "options":["A","B","C","D"],
      "correct":1
    },
    {
      "q":"...",
      "options":["A","B","C","D"],
      "correct":2
    }
  ],
  "explanation":"..."
}
`;
}


// ============================================================
// HANDLER
// ============================================================

export default async function handler(
  req,
  res
) {
  const startedAt =
    Date.now();

  // ----------------------------------------------------------
  // METHOD
  // ----------------------------------------------------------

  if (
    req.method !==
    'POST'
  ) {
    return res.status(
      405
    ).json({
      success: false,
      error:
        'Method not allowed.',
    });
  }

  // ----------------------------------------------------------
  // BODY
  // ----------------------------------------------------------

  const body =
    req.body || {};

  const {
    topic,
    mapel,
    kelas,
    jumlahSoal,
    types,
    arahan,
    sourceMode,
    targetYear,
    hotsLevel,
  } = body;

  const cleanTopic =
    cleanText(topic);

  if (!cleanTopic) {
    return res.status(
      400
    ).json({
      success: false,
      error:
        'Topik wajib diisi.',
    });
  }

  // ----------------------------------------------------------
  // ENV
  // ----------------------------------------------------------

  if (
    !process.env
      .SILICONFLOW_API_KEY
  ) {
    return res.status(
      500
    ).json({
      success: false,
      error:
        'SILICONFLOW_API_KEY belum tersedia di Vercel.',
    });
  }

  // ----------------------------------------------------------
  // COUNT
  // ----------------------------------------------------------

  const parsedCount =
    Number(
      jumlahSoal
    );

  const jumlah =
    Math.min(
      Math.max(
        Number.isFinite(
          parsedCount
        )
          ? Math.floor(
              parsedCount
            )
          : 5,
        1
      ),
      MAX_BATCH_QUESTIONS
    );

  // ----------------------------------------------------------
  // TYPES
  // ----------------------------------------------------------

  const allowedTypes =
    Array.isArray(types) &&
    types.length
      ? types
          .map(cleanText)
          .filter(Boolean)
      : ['multiple'];

  // ----------------------------------------------------------
  // YEAR
  // ----------------------------------------------------------

  const year =
    cleanText(
      targetYear
    ) ||
    String(
      new Date()
        .getFullYear() + 1
    );

  // ----------------------------------------------------------
  // MODE
  // ----------------------------------------------------------

  const mode =
    sourceMode ===
    'prediction'
      ? 'prediction'
      : 'blueprint';

  // ==========================================================
  // 1. BLUEPRINT
  // ==========================================================

  const blueprint =
    buildCurriculumBlueprint({
      topic:
        cleanTopic,

      mapel:
        cleanText(
          mapel
        ),

      kelas:
        cleanText(
          kelas
        ),

      jumlah,

      hotsLevel:
        cleanText(
          hotsLevel
        ),

      arahan:
        cleanText(
          arahan
        ),
    });

  // ==========================================================
  // 2. PROMPT
  // ==========================================================

  const systemPrompt =
    buildSystemPrompt({
      allowedTypes,

      targetYear:
        year,

      sourceMode:
        mode,
    });

  const userPrompt = `
BIMBEL GEMILANG
QUESTION GENERATION ENGINE

============================================================
IDENTITAS
============================================================

MAPEL:
${cleanText(
  mapel || 'Umum'
)}

KELAS:
${cleanText(
  kelas || 'Umum'
)}

TOPIK:
${cleanTopic}

TAHUN:
${year}

JUMLAH:
${jumlah}

TIPE:
${allowedTypes.join(
  ', '
)}

LEVEL HOTS:
${cleanText(
  hotsLevel || 'Standar'
)}

ARAHAN GURU:
${cleanText(
  arahan || 'Tidak ada'
)}

============================================================
BLUEPRINT WAJIB
============================================================

${JSON.stringify(
  blueprint,
  null,
  2
)}

============================================================
INSTRUKSI EKSEKUSI
============================================================

Buat tepat ${jumlah} soal.

Nomor soal 1 sampai ${jumlah}
harus mengikuti blueprint sesuai urutannya.

Jangan menghilangkan butir blueprint.

Jangan membuat semua soal memiliki pola yang sama.

Variasikan:
- konteks,
- angka,
- stimulus,
- cara berpikir,
- bentuk pertanyaan.

Tetapi tetap berada pada topik.

Untuk setiap soal:

1. Pastikan kunci benar.
2. Pastikan pilihan jawaban tidak ambigu.
3. Berikan pembahasan.
4. Berikan verifikasi kunci.
5. Jelaskan kompetensi yang dilatih.
6. Jika visual diperlukan, gunakan clock atau graph.
7. Jangan membuat URL gambar palsu.

Jika jumlah soal yang diminta adalah ${jumlah},
hasil akhir HARUS memiliki ${jumlah} objek soal.

Kembalikan JSON object:
{
  "questions":[...]
}
`;

  // ==========================================================
  // 3. CALL SILICONFLOW — HANYA 1X
  // ==========================================================

  let aiData;

  const aiStarted =
    Date.now();

  try {
    aiData =
      await callSiliconFlow({
        systemPrompt,
        userPrompt,
      });
  } catch (error) {
    console.error(
      '[Gemilang][SiliconFlow]',
      error?.message
    );

    if (
      error?.name ===
      'AbortError'
    ) {
      return res.status(
        504
      ).json({
        success: false,

        error:
          'SiliconFlow timeout. Silakan coba lagi.',

        model:
          SILICONFLOW_MODEL,

        durationMs:
          Date.now() -
          startedAt,
      });
    }

    if (
      error?.status ===
        401 ||
      error?.status ===
        403
    ) {
      return res.status(
        502
      ).json({
        success: false,

        error:
          'SILICONFLOW_API_KEY ditolak oleh SiliconFlow.',

        model:
          SILICONFLOW_MODEL,
      });
    }

    if (
      error?.status ===
      429
    ) {
      return res.status(
        429
      ).json({
        success: false,

        error:
          'SiliconFlow sedang terkena rate limit. Silakan coba beberapa saat lagi.',

        model:
          SILICONFLOW_MODEL,
      });
    }

    if (
      error?.status ===
      503 ||
      error?.status ===
      504
    ) {
      return res.status(
        502
      ).json({
        success: false,

        error:
          'Model SiliconFlow sedang sibuk atau tidak tersedia sementara.',

        model:
          SILICONFLOW_MODEL,
      });
    }

    return res.status(
      502
    ).json({
      success: false,

      error:
        'SiliconFlow gagal menghasilkan soal.',

      debug:
        error?.message ||
        'Unknown SiliconFlow error.',

      model:
        SILICONFLOW_MODEL,
    });
  }

  const aiDuration =
    Date.now() -
    aiStarted;

  // ==========================================================
  // 4. EXTRACT
  // ==========================================================

  const rawText =
    extractSiliconFlowText(
      aiData
    );

  if (
    !rawText.trim()
  ) {
    return res.status(
      502
    ).json({
      success: false,

      error:
        'SiliconFlow tidak mengembalikan isi soal.',

      model:
        SILICONFLOW_MODEL,

      aiDurationMs:
        aiDuration,
    });
  }

  // ==========================================================
  // 5. PARSE
  // ==========================================================

  const parsed =
    parseAIJson(
      rawText
    );

  if (!parsed) {
    return res.status(
      502
    ).json({
      success: false,

      error:
        'Output SiliconFlow bukan JSON yang valid.',

      debug: {
        rawText:
          rawText.slice(
            0,
            2000
          ),
      },

      model:
        SILICONFLOW_MODEL,
    });
  }

  const rawQuestions =
    normalizeAIQuestions(
      parsed
    );

  // ==========================================================
  // 6. QUALITY GATE
  // ==========================================================

  const questions =
    [];

  let rejected =
    0;

  let duplicates =
    0;

  for (
    const rawQuestion of
      rawQuestions
  ) {
    const question =
      normalizeQuestion(
        rawQuestion,
        allowedTypes
      );

    if (!question) {
      rejected++;
      continue;
    }

    if (
      isDuplicateQuestion(
        question.question,
        questions
      )
    ) {
      duplicates++;
      continue;
    }

    // --------------------------------------------------------
    // BLUEPRINT METADATA
    // --------------------------------------------------------

    const blueprintItem =
      blueprint[
        questions.length
      ];

    if (
      blueprintItem
    ) {
      question.blueprint =
        blueprintItem;

      question.analysisSummary =
        question.analysisSummary ||
        `Kompetensi: ${blueprintItem.kompetensi}. Tingkat: ${blueprintItem.tingkatKesulitan}.`;

      question.sourceTitle =
        'Blueprint Akademik Gemilang';

      question.sourceUrl =
        '';
    }

    question.researchSources =
      [];

    question.researchBacked =
      false;

    questions.push(
      question
    );

    if (
      questions.length >=
      jumlah
    ) {
      break;
    }
  }

  // ==========================================================
  // 7. HASIL KURANG
  // ==========================================================

  if (
    questions.length ===
    0
  ) {
    return res.status(
      502
    ).json({
      success: false,

      error:
        'Tidak ada soal yang lolos Quality Gate.',

      diagnostics: {
        requested:
          jumlah,

        aiObjects:
          rawQuestions.length,

        rejected,

        duplicates,

        aiDurationMs:
          aiDuration,

        totalDurationMs:
          Date.now() -
          startedAt,
      },

      model:
        SILICONFLOW_MODEL,
    });
  }

  // ==========================================================
  // 8. SUCCESS
  // ==========================================================

  return res.status(
    200
  ).json({
    success:
      true,

    questions,

    requestedCount:
      jumlah,

    returnedCount:
      questions.length,

    maxBatchSize:
      MAX_BATCH_QUESTIONS,

    possiblyTruncated:
      questions.length <
      jumlah,

    sourceMode:
      mode,

    researchProvider:
      'Local Blueprint Engine',

    aiProvider:
      'SiliconFlow',

    model:
      SILICONFLOW_MODEL,

    diagnostics: {
      blueprintCount:
        blueprint.length,

      aiObjectCount:
        rawQuestions.length,

      rejectedCount:
        rejected,

      duplicateCount:
        duplicates,

      aiDurationMs:
        aiDuration,

      totalDurationMs:
        Date.now() -
        startedAt,
    },

    researchSources:
      [],
  });
}