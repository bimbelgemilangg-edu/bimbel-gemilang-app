// api/generateQuizFromTopic.js
// ============================================================
// BIMBEL GEMILANG - PROFESSIONAL QUIZ ENGINE
// GEMINI 3.6 FLASH + FREE WEB RESEARCH
// ============================================================

const GEMINI_MODEL = 'gemini-3.6-flash';

const MAX_BATCH_QUESTIONS = 10;
const MAX_OUTPUT_TOKENS = 14000;
const GEMINI_TIMEOUT = 70000;
const SEARCH_TIMEOUT = 20000;
const SEARCH_DELAY = 1500;

let lastSearchAt = 0;

// ============================================================
// BASIC HELPERS
// ============================================================

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const cleanText = (value = '') =>
  String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

const escapeXml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const isNum = (value) =>
  typeof value === 'number' &&
  Number.isFinite(value);

const validIndex = (value, min, max) =>
  Number.isInteger(value) &&
  value >= min &&
  value <= max;

const fetchTimeout = async (
  url,
  options = {},
  timeout = 30000
) => {
  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    timeout
  );

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
// FREE WEB SEARCH
// ============================================================
// Kita tidak menggunakan Jina.
// Kita mencoba DuckDuckGo HTML lalu Lite.
// Karena ini endpoint web publik, hasil dapat berubah sewaktu-waktu.
// ============================================================

const decodeHtml = (value = '') =>
  String(value)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const stripHtml = (value = '') =>
  decodeHtml(
    String(value)
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );

const parseDuckResults = (html = '') => {
  const results = [];
  const seen = new Set();

  const regex =
    /<a[^>]+class=["'][^"']*result__a[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;

  while (
    (match = regex.exec(html)) !== null &&
    results.length < 8
  ) {
    let url = decodeHtml(match[1] || '');
    const title = stripHtml(match[2] || '');

    if (!url || !title) continue;

    try {
      const parsed = new URL(
        url.startsWith('//')
          ? `https:${url}`
          : url
      );

      const uddg =
        parsed.searchParams.get('uddg');

      if (uddg) url = uddg;
    } catch (_) {}

    if (seen.has(url)) continue;

    seen.add(url);

    results.push({
      title,
      url,
      content: '',
    });
  }

  const snippetRegex =
    /<(?:a|div)[^>]+class=["'][^"']*result__snippet[^"']*["'][^>]*>([\s\S]*?)<\/(?:a|div)>/gi;

  const snippets = [];

  let snippetMatch;

  while (
    (snippetMatch =
      snippetRegex.exec(html)) !== null &&
    snippets.length < 8
  ) {
    snippets.push(
      stripHtml(
        snippetMatch[1] || ''
      )
    );
  }

  results.forEach((item, index) => {
    item.content =
      snippets[index] || '';
  });

  return results;
};

const searchDuck = async (
  endpoint,
  query
) => {
  const body =
    new URLSearchParams({
      q: query,
    }).toString();

  const response =
    await fetchTimeout(
      endpoint,
      {
        method: 'POST',

        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/151 Safari/537.36',

          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',

          'Content-Type':
            'application/x-www-form-urlencoded',

          'Accept-Language':
            'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        },

        body,
      },
      SEARCH_TIMEOUT
    );

  const html =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `WEB_SEARCH_HTTP_${response.status}`
    );
  }

  const results =
    parseDuckResults(html);

  if (!results.length) {
    throw new Error(
      'WEB_SEARCH_NO_RESULTS'
    );
  }

  return results;
};

const searchWebFree = async (
  query
) => {
  const wait = Math.max(
    0,
    SEARCH_DELAY -
      (Date.now() - lastSearchAt)
  );

  if (wait > 0) {
    await sleep(wait);
  }

  lastSearchAt = Date.now();

  try {
    return await searchDuck(
      'https://html.duckduckgo.com/html/',
      query
    );
  } catch (firstError) {
    console.warn(
      'DuckDuckGo HTML gagal:',
      firstError.message
    );

    return searchDuck(
      'https://lite.duckduckgo.com/lite/',
      query
    );
  }
};

// ============================================================
// RESEARCH QUERIES
// ============================================================

const buildQueries = ({
  topic,
  mapel,
  kelas,
  targetYear,
}) => {
  const clean = (text) =>
    String(text || '')
      .replace(/\s+/g, ' ')
      .trim();

  const topik =
    clean(topic);

  return [
    clean(
      `${topik} ${mapel || ''} ${
        kelas || ''
      } TKA contoh soal`
    ),

    clean(
      `${topik} ${mapel || ''} ${
        kelas || ''
      } latihan soal`
    ),

    clean(
      `${mapel || ''} ${
        kelas || ''
      } TKA soal ${targetYear}`
    ),

    clean(
      `${topik} ${mapel || ''} soal HOTS`
    ),
  ];
};

// ============================================================
// GEMINI 3.6 FLASH
// ============================================================

const callGemini = async (
  systemPrompt,
  userPrompt
) => {
  if (
    !process.env.GEMINI_API_KEY
  ) {
    throw new Error(
      'GEMINI_API_KEY belum tersedia.'
    );
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const body = {
    system_instruction: {
      parts: [
        {
          text: systemPrompt,
        },
      ],
    },

    contents: [
      {
        role: 'user',

        parts: [
          {
            text: userPrompt,
          },
        ],
      },
    ],

    generationConfig: {
      maxOutputTokens:
        MAX_OUTPUT_TOKENS,
    },
  };

  const response =
    await fetchTimeout(
      url,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          'x-goog-api-key':
            process.env
              .GEMINI_API_KEY,
        },

        body: JSON.stringify(
          body
        ),
      },
      GEMINI_TIMEOUT
    );

  const raw =
    await response.text();

  if (!response.ok) {
    let detail = raw;

    try {
      const parsed =
        JSON.parse(raw);

      detail =
        parsed?.error?.message ||
        raw;
    } catch (_) {}

    const error =
      new Error(
        `GEMINI_HTTP_${response.status}: ${detail}`
      );

    error.status =
      response.status;

    throw error;
  }

  return JSON.parse(raw);
};

// ============================================================
// LOCAL VISUAL - CLOCK
// ============================================================

const buildClock = (
  clock
) => {
  if (
    !clock ||
    !isNum(clock.hour) ||
    !isNum(clock.minute)
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

  const size = 280;
  const cx = 140;
  const cy = 140;
  const r = 112;

  const point = (
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
    point(
      hour * 30 +
        minute * 0.5,
      r * 0.52
    );

  const minuteTip =
    point(
      minute * 6,
      r * 0.78
    );

  const ticks =
    Array.from(
      { length: 60 },
      (_, i) => {
        const major =
          i % 5 === 0;

        const outer =
          point(
            i * 6,
            r
          );

        const inner =
          point(
            i * 6,
            major
              ? r - 13
              : r - 7
          );

        return `
<line
x1="${outer.x}"
y1="${outer.y}"
x2="${inner.x}"
y2="${inner.y}"
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
          i === 0
            ? 12
            : i;

        const p =
          point(
            i * 30,
            r - 25
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
r="${r}"
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
stroke="#334155"
stroke-width="4"
stroke-linecap="round"
/>

<circle
cx="140"
cy="140"
r="5"
fill="#1e293b"
/>
</svg>`;

  return (
    'data:image/svg+xml;base64,' +
    Buffer.from(
      svg
    ).toString('base64')
  );
};

// ============================================================
// LOCAL VISUAL - GRAPH
// ============================================================

const buildGraph = (
  graph
) => {
  if (
    !graph ||
    !Array.isArray(
      graph.points
    )
  ) {
    return '';
  }

  const points =
    graph.points.filter(
      (p) =>
        isNum(p?.x) &&
        isNum(p?.y)
    );

  if (
    points.length < 2
  ) {
    return '';
  }

  const W = 640;
  const H = 420;
  const pad = 55;

  const minX =
    Math.min(
      ...points.map(
        (p) => p.x
      )
    );

  const maxX =
    Math.max(
      ...points.map(
        (p) => p.x
      )
    );

  const minY =
    Math.min(
      ...points.map(
        (p) => p.y
      )
    );

  const maxY =
    Math.max(
      ...points.map(
        (p) => p.y
      )
    );

  const mapX = (
    x
  ) =>
    pad +
    ((x - minX) /
      Math.max(
        maxX - minX,
        1
      )) *
      (W - pad * 2);

  const mapY = (
    y
  ) =>
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
            p.x
          )} ${mapY(
            p.y
          )}`
      )
      .join(' ');

  const svg = `
<svg
xmlns="http://www.w3.org/2000/svg"
viewBox="0 0 ${W} ${H}"
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
/>

<line
x1="${pad}"
y1="${pad}"
x2="${pad}"
y2="${H - pad}"
stroke="#64748b"
/>

<path
d="${path}"
fill="none"
stroke="#1e293b"
stroke-width="3"
/>

<text
x="${W - pad}"
y="${H - 15}"
text-anchor="end"
font-family="Arial"
font-size="16"
>
${escapeXml(
  graph.xLabel ||
    'x'
)}
</text>

<text
x="18"
y="${pad}"
font-family="Arial"
font-size="16"
>
${escapeXml(
  graph.yLabel ||
    'y'
)}
</text>
</svg>`;

  return (
    'data:image/svg+xml;base64,' +
    Buffer.from(
      svg
    ).toString('base64')
  );
};

// ============================================================
// JSON EXTRACTION
// ============================================================

const extractJson =
  (text = '') => {
    const result = [];

    let depth = 0;
    let start = -1;
    let stringMode = false;
    let escaped = false;

    for (
      let i = 0;
      i < text.length;
      i++
    ) {
      const ch =
        text[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (ch === '\\') {
        escaped = true;
        continue;
      }

      if (ch === '"') {
        stringMode =
          !stringMode;

        continue;
      }

      if (stringMode)
        continue;

      if (ch === '{') {
        if (
          depth === 0
        ) {
          start = i;
        }

        depth++;
      }

      if (ch === '}') {
        depth--;

        if (
          depth === 0 &&
          start !== -1
        ) {
          try {
            result.push(
              JSON.parse(
                text.slice(
                  start,
                  i + 1
                )
              )
            );
          } catch (_) {}

          start = -1;
        }
      }
    }

    return result;
  };

// ============================================================
// VISUAL CUE
// ============================================================

const hasVisualCue =
  (text = '') => {
    const value =
      String(text)
        .toLowerCase();

    return [
      'lihat gambar',
      'perhatikan gambar',
      'gambar berikut',
      'berdasarkan gambar',
      'lihat grafik',
      'perhatikan grafik',
      'grafik berikut',
      'berdasarkan grafik',
      'lihat diagram',
      'perhatikan diagram',
      'diagram berikut',
      'berdasarkan diagram',
      'lihat tabel',
      'perhatikan tabel',
      'tabel berikut',
      'berdasarkan tabel',
      'look at the picture',
      'look at the image',
      'look at the graph',
      'look at the diagram',
      'look at the table',
    ].some(
      (cue) =>
        value.includes(cue)
    );
  };

// ============================================================
// QUESTION VALIDATION
// ============================================================

const validateQuestion = (
  raw,
  allowedTypes
) => {
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
      raw.question ||
        ''
    );

  if (!question) {
    return null;
  }

  // MULTIPLE

  if (
    raw.type ===
    'multiple'
  ) {
    if (
      !Array.isArray(
        raw.options
      ) ||
      raw.options.length !==
        4
    ) {
      return null;
    }

    if (
      !validIndex(
        raw.correct,
        0,
        3
      )
    ) {
      return null;
    }
  }

  // MULTISELECT

  if (
    raw.type ===
    'multiselect'
  ) {
    if (
      !Array.isArray(
        raw.options
      ) ||
      raw.options.length <
        2
    ) {
      return null;
    }

    if (
      !Array.isArray(
        raw.correctAnswers
      ) ||
      !raw.correctAnswers
        .length
    ) {
      return null;
    }
  }

  // TRUE FALSE

  if (
    raw.type ===
    'truefalse'
  ) {
    if (
      !Array.isArray(
        raw.statements
      ) ||
      raw.statements.length <
        2
    ) {
      return null;
    }
  }

  // SHORT ANSWER

  if (
    raw.type ===
    'shortanswer'
  ) {
    if (
      !cleanText(
        raw.shortAnswer
      )
    ) {
      return null;
    }
  }

  // CAUSE EFFECT

  if (
    raw.type ===
    'causeeffect'
  ) {
    if (
      !cleanText(
        raw.cause
      ) ||
      !cleanText(
        raw.effect
      )
    ) {
      return null;
    }

    if (
      typeof raw.isCauseTrue !==
        'boolean' ||
      typeof raw.isEffectTrue !==
        'boolean'
    ) {
      return null;
    }
  }

  // MATCHING

  if (
    raw.type ===
    'matching'
  ) {
    if (
      !Array.isArray(
        raw.matchingPairs
      ) ||
      raw.matchingPairs.length <
        3
    ) {
      return null;
    }
  }

  // READING

  if (
    raw.type ===
    'reading'
  ) {
    if (
      !cleanText(
        raw.readingText
      )
    ) {
      return null;
    }

    if (
      !Array.isArray(
        raw.subQuestions
      ) ||
      raw.subQuestions.length <
        3
    ) {
      return null;
    }
  }

  // VISUAL

  let qImage = '';
  let visualRequired =
    false;
  let visualKind =
    'none';
  let needsImage =
    false;
  let imageHint = '';

  if (
    raw.clock
  ) {
    qImage =
      buildClock(
        raw.clock
      );

    visualRequired =
      true;

    visualKind =
      'clock';
  } else if (
    raw.graph
  ) {
    qImage =
      buildGraph(
        raw.graph
      );

    visualRequired =
      true;

    visualKind =
      'graph';
  } else if (
    raw.needs_image
  ) {
    needsImage =
      true;

    imageHint =
      cleanText(
        raw.image_keyword ||
          ''
      );

    visualRequired =
      true;

    visualKind =
      'photo';
  }

  if (
    hasVisualCue(
      question
    ) &&
    !qImage &&
    !needsImage
  ) {
    return null;
  }

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
        : undefined,

    correct:
      Number.isInteger(
        raw.correct
      )
        ? raw.correct
        : undefined,

    correctAnswers:
      Array.isArray(
        raw.correctAnswers
      )
        ? raw.correctAnswers
        : undefined,

    statements:
      Array.isArray(
        raw.statements
      )
        ? raw.statements.map(
            (s) => ({
              text:
                cleanText(
                  s?.text ||
                    ''
                ),

              isTrue:
                Boolean(
                  s?.isTrue
                ),
            })
          )
        : undefined,

    shortAnswer:
      cleanText(
        raw.shortAnswer ||
          ''
      ) || undefined,

    cause:
      cleanText(
        raw.cause ||
          ''
      ) || undefined,

    effect:
      cleanText(
        raw.effect ||
          ''
      ) || undefined,

    isCauseTrue:
      typeof raw.isCauseTrue ===
      'boolean'
        ? raw.isCauseTrue
        : undefined,

    isEffectTrue:
      typeof raw.isEffectTrue ===
      'boolean'
        ? raw.isEffectTrue
        : undefined,

    matchingPairs:
      Array.isArray(
        raw.matchingPairs
      )
        ? raw.matchingPairs.map(
            (pair) => ({
              left:
                cleanText(
                  pair?.left ||
                    ''
                ),

              right:
                cleanText(
                  pair?.right ||
                    ''
                ),
            })
          )
        : undefined,

    readingText:
      cleanText(
        raw.readingText ||
          ''
      ) || undefined,

    subQuestions:
      Array.isArray(
        raw.subQuestions
      )
        ? raw.subQuestions
        : undefined,

    explanation:
      cleanText(
        raw.explanation ||
          ''
      ),

    qImage:
      qImage || '',

    needsImage,

    imageHint,

    researchBacked:
      false,

    researchSources:
      [],

    visualRequired,

    visualKind,
  };
};

// ============================================================
// SYSTEM PROMPT
// ============================================================

const buildPrompt = ({
  allowedTypes,
  researchMode,
  targetYear,
  hotsLevel,
}) => `
Kamu adalah penyusun soal profesional Bimbel Gemilang.

MODE:
${
  researchMode
    ? `
Gunakan data riset web yang diberikan.
Analisis pola topik, kompetensi, model stimulus,
dan kesulitan.

Jangan mengklaim soal sebagai bocoran.
Jangan menyalin soal sumber kata demi kata.
Buat soal latihan baru yang representatif.
`
    : `
Buat soal original yang relevan.
`
}

TARGET:
${targetYear}

ATURAN:
- sesuai mapel
- sesuai kelas
- sesuai topik
- kunci jawaban harus benar
- pembahasan harus benar
- hindari duplikasi
- jangan membuat konteks yang tidak relevan
- jangan memakai markdown
- jangan mengatakan "lihat gambar" jika visual tidak ada

SCHEMA WAJIB:

multiple:
{
 "type":"multiple",
 "question":"...",
 "options":["A","B","C","D"],
 "correct":0,
 "explanation":"..."
}

multiselect:
{
 "type":"multiselect",
 "question":"...",
 "options":["A","B","C","D"],
 "correctAnswers":[0,2],
 "explanation":"..."
}

truefalse:
{
 "type":"truefalse",
 "question":"...",
 "statements":[
   {"text":"...","isTrue":true},
   {"text":"...","isTrue":false}
 ],
 "explanation":"..."
}

shortanswer:
{
 "type":"shortanswer",
 "question":"...",
 "shortAnswer":"...",
 "explanation":"..."
}

causeeffect:
{
 "type":"causeeffect",
 "question":"...",
 "cause":"...",
 "effect":"...",
 "isCauseTrue":true,
 "isEffectTrue":false,
 "explanation":"..."
}

matching:
{
 "type":"matching",
 "question":"...",
 "matchingPairs":[
   {"left":"...","right":"..."},
   {"left":"...","right":"..."},
   {"left":"...","right":"..."}
 ],
 "explanation":"..."
}

reading:
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

VISUAL:

Untuk jam:
"clock":{"hour":8,"minute":30}

Untuk grafik:
"graph":{
  "points":[
    {"x":0,"y":0},
    {"x":1,"y":2}
  ],
  "xLabel":"x",
  "yLabel":"y"
}

Untuk foto:
"needs_image":true,
"image_keyword":"english keyword"

Tipe yang boleh:
${allowedTypes.join(
  ', '
)}

Output:
baris pertama {"meta":true}

Setiap soal satu JSON object per baris.
Jangan gunakan code fence.
Jangan menambahkan komentar.
${
  hotsLevel
    ? `HOTS: ${hotsLevel}`
    : ''
}
`;

// ============================================================
// MAIN HANDLER
// ============================================================

export default async function handler(
  req,
  res
) {
  if (
    req.method !== 'POST'
  ) {
    return res
      .status(405)
      .json({
        error:
          'Method not allowed',
      });
  }

  if (
    !process.env
      .GEMINI_API_KEY
  ) {
    return res
      .status(500)
      .json({
        error:
          'GEMINI_API_KEY belum tersedia di Vercel.',
      });
  }

  const {
    topic,
    mapel,
    kelas,
    jumlahSoal,
    types,
    arahan,
    useTrendSearch,
    targetYear,
    hotsLevel,
  } =
    req.body || {};

  if (
    !String(
      topic || ''
    ).trim()
  ) {
    return res
      .status(400)
      .json({
        error:
          'Topik wajib diisi.',
      });
  }

  const requested =
    parseInt(
      jumlahSoal,
      10
    );

  const jumlah =
    Math.min(
      Math.max(
        Number.isFinite(
          requested
        )
          ? requested
          : 5,
        1
      ),
      MAX_BATCH_QUESTIONS
    );

  const allowedTypes =
    Array.isArray(types) &&
    types.length
      ? types
      : ['multiple'];

  const researchMode =
    Boolean(
      useTrendSearch
    );

  const finalYear =
    targetYear ||
    new Date().getFullYear() +
      1;

  // ==========================================================
  // RESEARCH
  // ==========================================================

  let sources = [];

  if (
    researchMode
  ) {
    const queries =
      buildQueries({
        topic,
        mapel,
        kelas,
        targetYear:
          finalYear,
      });

    const all = [];

    const errors = [];

    for (
      const query of
        queries
    ) {
      try {
        const result =
          await searchWebFree(
            query
          );

        all.push(
          ...result
        );
      } catch (
        error
      ) {
        console.warn(
          'Search gagal:',
          query,
          error.message
        );

        errors.push({
          query,
          error:
            error.message,
        });
      }
    }

    const seen =
      new Set();

    sources =
      all.filter(
        (item) => {
          if (
            !item.url
          ) {
            return true;
          }

          if (
            seen.has(
              item.url
            )
          ) {
            return false;
          }

          seen.add(
            item.url
          );

          return true;
        }
      ).slice(0, 12);

    if (
      !sources.length
    ) {
      return res
        .status(502)
        .json({
          error:
            'Tidak ada hasil pencarian web yang berhasil diperoleh. Sistem tidak berpura-pura menggunakan internet.',
          debug:
            errors,
        });
    }
  }

  // ==========================================================
  // GEMINI PROMPT
  // ==========================================================

  const systemPrompt =
    buildPrompt({
      allowedTypes,
      researchMode,
      targetYear:
        finalYear,
      hotsLevel:
        hotsLevel || '',
    });

  const researchText =
    researchMode
      ? sources
          .map(
            (
              item,
              index
            ) => `
SUMBER ${index + 1}
Judul:
${item.title}

URL:
${item.url}

Ringkasan/snippet:
${item.content}
`
          )
          .join(
            '\n'
          )
      : '';

  const userPrompt = `
MAPEL:
${mapel || 'Umum'}

KELAS:
${kelas || 'SMP'}

TOPIK:
${String(topic).trim()}

TARGET LATIHAN:
${finalYear}

JUMLAH:
${jumlah}

TIPE:
${allowedTypes.join(
  ', '
)}

${arahan?.trim()
  ? `ARAHAN GURU:
${arahan.trim()}`
  : ''}

${
  researchMode
    ? `
BAHAN RISET INTERNET:
${researchText}

Gunakan sumber ini untuk memahami pola.
Jangan menyalin soal sumber.
`
    : ''
}

Buat ${jumlah} soal berkualitas.
Jika tidak bisa memenuhi jumlah karena validitas,
utamakan soal yang benar daripada mengarang.
`;

  // ==========================================================
  // GENERATE
  // ==========================================================

  let gemini;

  try {
    gemini =
      await callGemini(
        systemPrompt,
        userPrompt
      );
  } catch (
    error
  ) {
    const message =
      String(
        error?.message ||
          ''
      );

    console.error(
      '[Gemilang Gemini]',
      message
    );

    return res
      .status(
        message.includes(
          '429'
        )
          ? 429
          : 502
      )
      .json({
        error:
          message.includes(
            '429'
          )
            ? 'Kuota gratis Gemini sedang mencapai batas. Coba lagi setelah kuota reset.'
            : 'Gemini gagal membuat soal.',
        debug:
          message,
      });
  }

  // ==========================================================
  // EXTRACT
  // ==========================================================

  const candidate =
    gemini?.candidates?.[0];

  const rawText =
    candidate
      ?.content
      ?.parts
      ?.filter(
        (part) =>
          typeof part?.text ===
          'string'
      )
      ?.map(
        (part) =>
          part.text
      )
      ?.join(
        '\n'
      ) || '';

  if (
    !rawText.trim()
  ) {
    return res
      .status(502)
      .json({
        error:
          'Gemini tidak mengembalikan teks soal.',
      });
  }

  const objects =
    extractJson(
      rawText
    );

  const questions = [];
  const fingerprints =
    new Set();

  for (
    const raw of objects
  ) {
    const question =
      validateQuestion(
        raw,
        allowedTypes
      );

    if (!question)
      continue;

    const fingerprint =
      (
        question.type +
        '|' +
        question.question
      )
        .toLowerCase()
        .replace(
          /\s+/g,
          ' '
        )
        .trim();

    if (
      fingerprints.has(
        fingerprint
      )
    ) {
      continue;
    }

    fingerprints.add(
      fingerprint
    );

    question.researchBacked =
      researchMode;

    question.researchSources =
      researchMode
        ? sources.map(
            (source) => ({
              title:
                source.title ||
                '',

              url:
                source.url ||
                '',
            })
          )
        : [];

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
  // FAILED QUALITY GATE
  // ==========================================================

  if (
    !questions.length
  ) {
    return res
      .status(502)
      .json({
        error:
          'Tidak ada soal yang lolos quality gate.',
        debug: {
          finishReason:
            candidate?.finishReason ||
            null,

          parsedObjectCount:
            objects.length,

          rawTextLength:
            rawText.length,

          rawTextSample:
            rawText.slice(
              0,
              600
            ),
        },

        researchSources:
          sources.map(
            (source) => ({
              title:
                source.title ||
                '',
              url:
                source.url ||
                '',
            })
          ),
      });
  }

  // ==========================================================
  // RESPONSE
  // ==========================================================

  return res
    .status(200)
    .json({
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
          jumlah ||
        candidate?.finishReason ===
          'MAX_TOKENS',

      usedTrendSearch:
        researchMode,

      researchProvider:
        researchMode
          ? 'DuckDuckGo HTML/Lite'
          : null,

      researchSources:
        sources.map(
          (source) => ({
            title:
              source.title ||
              '',
            url:
              source.url ||
              '',
          })
        ),

      model:
        GEMINI_MODEL,
    });
}