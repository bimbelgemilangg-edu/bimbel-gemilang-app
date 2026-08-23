// api/generateQuizFromTopic.js
// ============================================================
// BIMBEL GEMILANG — STABLE RESEARCH QUESTION ENGINE
// Cloudflare Workers AI + Jina Search
// ============================================================
//
// Prinsip:
// 1. Internet tetap menjadi sumber riset.
// 2. Jina hanya mencari kandidat.
// 3. Jangan fetch ulang halaman jika Jina sudah memberi content.
// 4. Maksimal 6 sumber terbaik per batch.
// 5. Research pack dibatasi agar inference cepat.
// 6. Maksimal 5 soal per request untuk stabilitas.
// 7. Frontend dapat memanggil beberapa batch.
// 8. Dedup dilakukan sebelum hasil dikembalikan.
// 9. Jawaban + verifikasi + pembahasan wajib.
// 10. Visual clock/graph tetap didukung.
// ============================================================

const CLOUDFLARE_MODEL =
  process.env.CLOUDFLARE_MODEL ||
  '@cf/zai-org/glm-4.7-flash';

const MAX_BATCH_QUESTIONS = 5;

const JINA_TIMEOUT_MS = 25000;
const CLOUDFLARE_TIMEOUT_MS = 45000;

const MAX_RESULTS_PER_QUERY = 8;
const MAX_SELECTED_SOURCES = 6;

const MAX_SOURCE_CHARS = 6500;
const MAX_RESEARCH_PACK_CHARS = 24000;

const MIN_SOURCE_TEXT = 100;

// ============================================================
// HELPERS
// ============================================================

const cleanText = (value = '') =>
  String(value ?? '')
    .replace(
      /<script[\s\S]*?<\/script>/gi,
      ' '
    )
    .replace(
      /<style[\s\S]*?<\/style>/gi,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();

const normalizeText = (value = '') =>
  cleanText(value)
    .toLowerCase()
    .replace(
      /[^\p{L}\p{N}\s]/gu,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();

const tokenize = (value = '') =>
  normalizeText(value)
    .split(' ')
    .filter(
      (x) =>
        x.length >= 2
    );

const jaccard = (
  a,
  b
) => {
  const setA = new Set(
    tokenize(a)
  );

  const setB = new Set(
    tokenize(b)
  );

  if (
    !setA.size ||
    !setB.size
  ) {
    return 0;
  }

  let intersection = 0;

  for (
    const token of setA
  ) {
    if (
      setB.has(token)
    ) {
      intersection += 1;
    }
  }

  const union =
    setA.size +
    setB.size -
    intersection;

  return union
    ? intersection / union
    : 0;
};

const questionFingerprint = (
  value = ''
) =>
  normalizeText(value)
    .replace(
      /\bsoal\s+\d+\b/g,
      ' '
    )
    .replace(
      /\bnomor\s+\d+\b/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();

const isFiniteNumber = (
  value
) =>
  typeof value === 'number' &&
  Number.isFinite(value);

const isIntegerInRange = (
  value,
  min,
  max
) =>
  Number.isInteger(value) &&
  value >= min &&
  value <= max;

const fetchWithTimeout = async (
  url,
  options = {},
  timeoutMs = 30000
) => {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () =>
        controller.abort(),
      timeoutMs
    );

  try {
    return await fetch(
      url,
      {
        ...options,
        signal:
          controller.signal,
      }
    );
  } finally {
    clearTimeout(timer);
  }
};

// ============================================================
// VISUAL CUE
// ============================================================

const hasVisualCue = (
  text = ''
) => {
  const value =
    normalizeText(text);

  const cues = [
    'lihat gambar',
    'perhatikan gambar',
    'gambar berikut',
    'berdasarkan gambar',
    'pada gambar',
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
  ];

  return cues.some(
    (cue) =>
      value.includes(
        normalizeText(cue)
      )
  );
};

// ============================================================
// LOCAL CLOCK
// ============================================================

function buildClockImageSvg(
  clock
) {
  if (
    !clock ||
    !isFiniteNumber(
      clock.hour
    ) ||
    !isFiniteNumber(
      clock.minute
    )
  ) {
    return '';
  }

  const hour =
    ((Number(clock.hour) %
      12) +
      12) %
    12;

  const minute = Math.max(
    0,
    Math.min(
      59,
      Number(clock.minute)
    )
  );

  const cx = 140;
  const cy = 140;
  const radius = 112;

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
      radius * 0.52
    );

  const minuteTip =
    point(
      minute * 6,
      radius * 0.78
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
            radius
          );

        const inner =
          point(
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
}"/>`;
      }
    ).join('');

  const numbers =
    Array.from(
      { length: 12 },
      (_, i) => {
        const number =
          i === 0 ? 12 : i;

        const pos =
          point(
            i * 30,
            radius - 25
          );

        return `
<text
x="${pos.x.toFixed(1)}"
y="${(
          pos.y + 6
        ).toFixed(1)}"
text-anchor="middle"
font-family="Arial"
font-size="18"
font-weight="700"
fill="#1e293b"
>${number}</text>`;
      }
    ).join('');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg"
viewBox="0 0 280 280">
<rect width="280" height="280" fill="white"/>
<circle
cx="140"
cy="140"
r="${radius}"
fill="white"
stroke="#1e293b"
stroke-width="3"/>
${ticks}
${numbers}
<line
x1="140"
y1="140"
x2="${hourTip.x.toFixed(2)}"
y2="${hourTip.y.toFixed(2)}"
stroke="#1e293b"
stroke-width="6"
stroke-linecap="round"/>
<line
x1="140"
y1="140"
x2="${minuteTip.x.toFixed(2)}"
y2="${minuteTip.y.toFixed(2)}"
stroke="#334155"
stroke-width="4"
stroke-linecap="round"/>
<circle
cx="140"
cy="140"
r="5"
fill="#1e293b"/>
</svg>`;

  return (
    'data:image/svg+xml;base64,' +
    Buffer.from(svg).toString(
      'base64'
    )
  );
}

// ============================================================
// LOCAL GRAPH
// ============================================================

function buildGraphImageSvg(
  graph
) {
  if (
    !graph ||
    !Array.isArray(
      graph.points
    )
  ) {
    return '';
  }

  const points =
    graph.points
      .filter(
        (p) =>
          isFiniteNumber(
            p?.x
          ) &&
          isFiniteNumber(
            p?.y
          )
      )
      .slice(0, 80);

  if (
    points.length < 2
  ) {
    return '';
  }

  const W = 640;
  const H = 420;
  const pad = 55;

  const xs =
    points.map(
      (p) => p.x
    );

  const ys =
    points.map(
      (p) => p.y
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
          ).toFixed(1)} ${mapY(
            p.y
          ).toFixed(1)}`
      )
      .join(' ');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg"
viewBox="0 0 ${W} ${H}">
<rect
width="${W}"
height="${H}"
fill="white"/>
<line
x1="${pad}"
y1="${H - pad}"
x2="${W - pad}"
y2="${H - pad}"
stroke="#64748b"/>
<line
x1="${pad}"
y1="${pad}"
x2="${pad}"
y2="${H - pad}"
stroke="#64748b"/>
<path
d="${path}"
fill="none"
stroke="#1e293b"
stroke-width="3"
stroke-linecap="round"/>
<text
x="${W - pad}"
y="${H - 15}"
text-anchor="end"
font-family="Arial"
font-size="16">
${cleanText(
  graph.xLabel || 'x'
)}
</text>
<text
x="18"
y="${pad}"
font-family="Arial"
font-size="16">
${cleanText(
  graph.yLabel || 'y'
)}
</text>
</svg>`;

  return (
    'data:image/svg+xml;base64,' +
    Buffer.from(svg).toString(
      'base64'
    )
  );
}

// ============================================================
// JINA SEARCH
// ============================================================

async function jinaSearch(
  query
) {
  const apiKey =
    process.env.JINA_API_KEY;

  if (!apiKey) {
    throw new Error(
      'JINA_API_KEY belum tersedia di Vercel.'
    );
  }

  const url =
    `https://s.jina.ai/?q=${encodeURIComponent(
      query
    )}`;

  const response =
    await fetchWithTimeout(
      url,
      {
        method: 'GET',

        headers: {
          Accept:
            'application/json',

          Authorization:
            `Bearer ${apiKey}`,

          'User-Agent':
            'BimbelGemilangResearch/Stable',
        },
      },
      JINA_TIMEOUT_MS
    );

  const raw =
    await response.text();

  if (!response.ok) {
    let detail =
      raw;

    try {
      const parsed =
        JSON.parse(raw);

      detail =
        parsed?.message ||
        parsed?.readableMessage ||
        parsed?.error?.message ||
        raw;
    } catch (_) {}

    throw new Error(
      `JINA_HTTP_${response.status}: ${detail}`
    );
  }

  try {
    const parsed =
      JSON.parse(raw);

    const items =
      Array.isArray(parsed)
        ? parsed
        : Array.isArray(
            parsed?.data
          )
        ? parsed.data
        : Array.isArray(
            parsed?.results
          )
        ? parsed.results
        : [];

    return items
      .slice(
        0,
        MAX_RESULTS_PER_QUERY
      )
      .map(
        (item) => ({
          title:
            cleanText(
              item?.title ||
                item?.name ||
                ''
            ),

          url:
            cleanText(
              item?.url ||
                item?.link ||
                ''
            ),

          content:
            cleanText(
              item?.content ||
                item?.description ||
                item?.snippet ||
                ''
            ).slice(
              0,
              MAX_SOURCE_CHARS
            ),
        })
      )
      .filter(
        (item) =>
          item.url ||
          item.content
      );
  } catch (_) {
    return raw.trim()
      ? [
          {
            title:
              'Jina Search Result',
            url: '',
            content:
              raw.slice(
                0,
                MAX_SOURCE_CHARS
              ),
          },
        ]
      : [];
  }
}

// ============================================================
// QUERIES
// ============================================================

function buildQueries({
  topic,
  mapel,
  kelas,
  targetYear,
  sourceMode,
  arahan,
}) {
  const t =
    cleanText(
      topic
    );

  const m =
    cleanText(
      mapel
    );

  const k =
    cleanText(
      kelas
    );

  const y =
    cleanText(
      targetYear
    );

  const a =
    cleanText(
      arahan
    );

  if (
    sourceMode ===
    'prediction'
  ) {
    return [
      `${t} ${m} ${k} TKA contoh soal`,
      `${t} ${m} ${k} soal HOTS`,
      `${t} ${m} ${k} latihan soal`,
      `${t} ${m} ${k} ${y} prediksi ${a}`,
    ];
  }

  return [
    `${t} ${m} ${k} soal`,
    `${t} ${m} ${k} contoh soal`,
    `${t} ${m} ${k} TKA`,
    `${t} ${m} ${k} latihan`,
  ];
}

// ============================================================
// SOURCE RANKING
// ============================================================

function rankSources(
  sources,
  searchContext
) {
  const seen =
    new Set();

  const ranked =
    [];

  for (
    const source of
      sources
  ) {
    const key =
      source?.url ||
      normalizeText(
        source?.title ||
          ''
      );

    if (!key) {
      continue;
    }

    if (
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);

    const titleScore =
      jaccard(
        searchContext,
        source.title ||
          ''
      );

    const contentScore =
      jaccard(
        searchContext,
        source.content ||
          ''
      );

    const score =
      titleScore * 0.6 +
      contentScore * 0.4;

    ranked.push({
      ...source,
      relevanceScore:
        Number(
          score.toFixed(4)
        ),
    });
  }

  return ranked
    .sort(
      (a, b) =>
        b.relevanceScore -
        a.relevanceScore
    )
    .slice(
      0,
      MAX_SELECTED_SOURCES
    );
}

// ============================================================
// IMPORTANT:
// JINA SUDAH MEMBERIKAN CONTENT.
// TIDAK FETCH HALAMAN LAGI DI STAGE INI.
// ============================================================

function prepareSources(
  rankedSources
) {
  return rankedSources
    .map(
      (source) => ({
        ...source,

        title:
          source.title ||
          '',

        url:
          source.url ||
          '',

        content:
          cleanText(
            source.content ||
              ''
          ).slice(
            0,
            MAX_SOURCE_CHARS
          ),

        images:
          Array.isArray(
            source.images
          )
            ? source.images
            : [],
      })
    )
    .filter(
      (source) =>
        source.content.length >=
        MIN_SOURCE_TEXT
    );
}

// ============================================================
// RESEARCH PACK
// ============================================================

function buildResearchPack(
  sources
) {
  let output =
    '';

  for (
    let i = 0;
    i < sources.length;
    i += 1
  ) {
    const source =
      sources[i];

    const block = `
SOURCE_INDEX: ${i}

TITLE:
${source.title}

URL:
${source.url}

RELEVANCE:
${source.relevanceScore || 0}

CONTENT:
${source.content}

`;

    if (
      (
        output +
        block
      ).length >
      MAX_RESEARCH_PACK_CHARS
    ) {
      break;
    }

    output +=
      `${block}\n----------------\n`;
  }

  return output;
}

// ============================================================
// CLOUDFLARE AI
// ============================================================

async function callCloudflare(
  systemPrompt,
  userPrompt
) {
  const token =
    process.env
      .CLOUDFLARE_API_TOKEN;

  const accountId =
    process.env
      .CLOUDFLARE_ACCOUNT_ID;

  if (!token) {
    throw new Error(
      'CLOUDFLARE_API_TOKEN belum tersedia.'
    );
  }

  if (!accountId) {
    throw new Error(
      'CLOUDFLARE_ACCOUNT_ID belum tersedia.'
    );
  }

  const url =
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CLOUDFLARE_MODEL}`;

  const body = {
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

    // Batasi output supaya
    // tidak terlalu panjang.
    max_tokens: 8000,
  };

  const response =
    await fetchWithTimeout(
      url,
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${token}`,

          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify(
            body
          ),
      },
      CLOUDFLARE_TIMEOUT_MS
    );

  const raw =
    await response.text();

  let data = null;

  try {
    data =
      JSON.parse(raw);
  } catch (_) {}

  if (
    !response.ok
  ) {
    const message =
      data?.errors?.[0]
        ?.message ||
      data?.message ||
      raw ||
      `Cloudflare HTTP ${response.status}`;

    const error =
      new Error(
        `CLOUDFLARE_HTTP_${response.status}: ${message}`
      );

    error.status =
      response.status;

    throw error;
  }

  return data;
}

// ============================================================
// EXTRACT TEXT
// ============================================================

function extractCloudflareText(
  data
) {
  const result =
    data?.result ||
    {};

  if (
    typeof result.response ===
    'string'
  ) {
    return result.response;
  }

  if (
    typeof result.text ===
    'string'
  ) {
    return result.text;
  }

  if (
    typeof result.output_text ===
    'string'
  ) {
    return result.output_text;
  }

  const choices =
    Array.isArray(
      result.choices
    )
      ? result.choices
      : [];

  return choices
    .map(
      (choice) => {
        const content =
          choice
            ?.message
            ?.content;

        if (
          typeof content ===
          'string'
        ) {
          return content;
        }

        if (
          Array.isArray(
            content
          )
        ) {
          return content
            .map(
              (part) =>
                part?.text ||
                ''
            )
            .join('');
        }

        if (
          typeof choice?.text ===
          'string'
        ) {
          return choice.text;
        }

        return '';
      }
    )
    .join('\n');
}

// ============================================================
// JSON PARSER
// ============================================================

function extractJsonObjects(
  text = ''
) {
  const result = [];

  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (
    let i = 0;
    i < text.length;
    i += 1
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
      inString =
        !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (ch === '{') {
      if (
        depth === 0
      ) {
        start = i;
      }

      depth += 1;
    }

    if (ch === '}') {
      depth -= 1;

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
}

// ============================================================
// VALIDATE QUESTION
// ============================================================

function validateQuestion(
  raw,
  allowedTypes,
  sourceMode,
  sources
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
      raw.question ||
        ''
    );

  if (!question) {
    return null;
  }

  let source = null;

  if (
    sourceMode ===
    'source'
  ) {
    if (
      !Number.isInteger(
        raw.sourceIndex
      )
    ) {
      return null;
    }

    source =
      sources[
        raw.sourceIndex
      ];

    if (!source) {
      return null;
    }
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
      !isIntegerInRange(
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
      raw.correctAnswers.length ===
        0
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

    if (
      !raw.statements.every(
        (s) =>
          typeof s?.text ===
            'string' &&
          typeof s?.isTrue ===
            'boolean'
      )
    ) {
      return null;
    }
  }

  // SHORT ANSWER
  if (
    raw.type ===
      'shortanswer' &&
    !cleanText(
      raw.shortAnswer
    )
  ) {
    return null;
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
  let qImage =
    cleanText(
      raw.questionImageUrl ||
        raw.qImage ||
        ''
    );

  let visualRequired =
    Boolean(
      qImage
    );

  let visualKind =
    qImage
      ? 'source-image'
      : 'none';

  let needsImage =
    Boolean(
      raw.needsImage
    );

  const imageHint =
    cleanText(
      raw.imageHint ||
        raw.image_keyword ||
        ''
    );

  if (
    raw.clock
  ) {
    qImage =
      buildClockImageSvg(
        raw.clock
      );

    visualRequired =
      true;

    visualKind =
      'clock';
  }

  if (
    raw.graph
  ) {
    qImage =
      buildGraphImageSvg(
        raw.graph
      );

    visualRequired =
      true;

    visualKind =
      'graph';
  }

  const optionImages =
    Array.isArray(
      raw.optionImages
    )
      ? raw.optionImages
          .map(
            cleanText
          )
          .filter(
            Boolean
          )
      : [];

  const optionsAreImages =
    Boolean(
      raw.optionsAreImages
    ) ||
    optionImages.length >=
      2;

  if (
    optionsAreImages
  ) {
    visualRequired =
      true;

    visualKind =
      'image-options';
  }

  if (
    needsImage
  ) {
    visualRequired =
      true;

    if (
      visualKind ===
      'none'
    ) {
      visualKind =
        'photo';
    }
  }

  if (
    hasVisualCue(
      question
    ) &&
    !visualRequired &&
    !needsImage
  ) {
    return null;
  }

  // SOURCE EVIDENCE
  let evidenceScore = 1;

  if (
    sourceMode ===
    'source'
  ) {
    const sourceText =
      [
        source?.title,
        source?.content,
      ]
        .filter(Boolean)
        .join(' ');

    evidenceScore =
      jaccard(
        question,
        sourceText
      );

    // Sedikit longgar karena
    // hasil search bisa berbeda format.
    if (
      evidenceScore <
      0.15
    ) {
      return null;
    }
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
        raw.readingText ||
          ''
      ),

    subQuestions:
      Array.isArray(
        raw.subQuestions
      )
        ? raw.subQuestions
        : [],

    shortAnswer:
      cleanText(
        raw.shortAnswer ||
          ''
      ),

    cause:
      cleanText(
        raw.cause ||
          ''
      ),

    effect:
      cleanText(
        raw.effect ||
          ''
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
        raw.explanation ||
          ''
      ),

    answerVerification:
      cleanText(
        raw.answerVerification ||
          ''
      ),

    analysisSummary:
      cleanText(
        raw.analysisSummary ||
          ''
      ),

    qImage:
      qImage ||
      undefined,

    needsImage,

    imageHint,

    researchBacked:
      true,

    researchSources:
      [],

    sourceMode,

    sourceIndex:
      Number.isInteger(
        raw.sourceIndex
      )
        ? raw.sourceIndex
        : null,

    sourceTitle:
      cleanText(
        raw.sourceTitle ||
          source?.title ||
          ''
      ),

    sourceUrl:
      cleanText(
        raw.sourceUrl ||
          source?.url ||
          ''
      ),

    sourceQuestionVerbatim:
      sourceMode ===
      'source'
        ? true
        : Boolean(
            raw.sourceQuestionVerbatim
          ),

    sourceEvidenceScore:
      Number(
        evidenceScore.toFixed(
          3
        )
      ),

    visualRequired,

    visualKind,
  };
}

// ============================================================
// PROMPT
// ============================================================

function buildSystemPrompt({
  sourceMode,
  targetYear,
  allowedTypes,
  hotsLevel,
}) {
  return `
Kamu adalah Asisten Soal Gemilang.

MODE:
${
  sourceMode ===
  'source'
    ? `
AMBIL SOAL DARI INTERNET.

Gunakan hanya soal yang benar-benar dapat ditelusuri
pada sumber yang diberikan.

Jangan menciptakan soal baru.
Jangan mengarang URL.
Jangan mengarang gambar.

Kamu boleh:
- membersihkan format,
- menentukan jawaban,
- memverifikasi jawaban,
- membuat pembahasan.
`
    : `
PREDIKSI BERBASIS TREN INTERNET.

Gunakan sumber sebagai evidence untuk:
- topik berulang,
- kompetensi,
- HOTS,
- stimulus,
- tren terbaru.

Buat latihan baru berdasarkan evidence.

Jangan menyebutnya bocoran.
Jangan menyatakan pasti keluar.
`
}

TARGET:
${targetYear}

LEVEL:
${hotsLevel || 'standar'}

WAJIB:
- akurat
- relevan
- jawaban benar
- pembahasan detail
- answerVerification jelas
- analysisSummary jelas
- visual tidak boleh palsu
- JSONL saja

MULTIPLE:
{
"type":"multiple",
"question":"...",
"options":["A","B","C","D"],
"correct":0,
"explanation":"...",
"answerVerification":"...",
"analysisSummary":"...",
"sourceIndex":0,
"sourceTitle":"...",
"sourceUrl":"...",
"sourceQuestionVerbatim":true,
"questionImageUrl":"",
"optionImages":[],
"optionsAreImages":false
}

correct harus INDEX 0-3.

MULTISELECT:
{
"type":"multiselect",
"question":"...",
"options":["A","B","C","D"],
"correctAnswers":[0,2],
"explanation":"..."
}

TRUEFALSE:
{
"type":"truefalse",
"question":"...",
"statements":[
{"text":"...","isTrue":true},
{"text":"...","isTrue":false}
],
"explanation":"..."
}

SHORTANSWER:
{
"type":"shortanswer",
"question":"...",
"shortAnswer":"...",
"explanation":"..."
}

CAUSEEFFECT:
{
"type":"causeeffect",
"question":"...",
"cause":"...",
"effect":"...",
"isCauseTrue":true,
"isEffectTrue":false,
"explanation":"..."
}

MATCHING:
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

READING:
{
"type":"reading",
"question":"...",
"readingText":"...",
"subQuestions":[
{"q":"...","options":["A","B","C","D"],"correct":0},
{"q":"...","options":["A","B","C","D"],"correct":1},
{"q":"...","options":["A","B","C","D"],"correct":2}
],
"explanation":"..."
}

CLOCK:
"clock":{"hour":8,"minute":30}

GRAPH:
"graph":{
  "points":[
    {"x":0,"y":0},
    {"x":1,"y":2}
  ],
  "xLabel":"x",
  "yLabel":"y"
}

OUTPUT:
baris pertama {"meta":true}
lalu satu JSON object per baris.

ALLOWED TYPES:
${allowedTypes.join(', ')}
`;
}

// ============================================================
// HANDLER
// ============================================================

export default async function handler(
  req,
  res
) {
  if (
    req.method !==
    'POST'
  ) {
    return res
      .status(405)
      .json({
        success: false,
        error:
          'Method not allowed',
      });
  }

  const {
    topic,
    mapel,
    kelas,
    jumlahSoal,
    types,
    arahan,
    sourceMode,
    useTrendSearch,
    targetYear,
    hotsLevel,
  } =
    req.body || {};

  const cleanTopic =
    cleanText(
      topic
    );

  if (!cleanTopic) {
    return res
      .status(400)
      .json({
        success: false,
        error:
          'Topik wajib diisi.',
      });
  }

  if (
    !process.env.JINA_API_KEY
  ) {
    return res
      .status(500)
      .json({
        success: false,
        error:
          'JINA_API_KEY belum tersedia.',
      });
  }

  if (
    !process.env
      .CLOUDFLARE_API_TOKEN
  ) {
    return res
      .status(500)
      .json({
        success: false,
        error:
          'CLOUDFLARE_API_TOKEN belum tersedia.',
      });
  }

  if (
    !process.env
      .CLOUDFLARE_ACCOUNT_ID
  ) {
    return res
      .status(500)
      .json({
        success: false,
        error:
          'CLOUDFLARE_ACCOUNT_ID belum tersedia.',
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
          : 3,
        1
      ),
      MAX_BATCH_QUESTIONS
    );

  const allowedTypes =
    Array.isArray(
      types
    ) &&
    types.length
      ? types
      : ['multiple'];

  const mode =
    sourceMode ===
    'prediction'
      ? 'prediction'
      : 'source';

  const year =
    targetYear ||
    new Date().getFullYear() +
      1;

  // ==========================================================
  // 1. SEARCH
  // ==========================================================

  const queries =
    buildQueries({
      topic:
        cleanTopic,
      mapel,
      kelas,
      targetYear:
        year,
      sourceMode:
        mode,
      arahan,
    });

  const allSources =
    [];

  const queryErrors =
    [];

  // Empat query tetap dilakukan,
  // tetapi tiap query independen.
  for (
    const query of
      queries
  ) {
    try {
      const results =
        await jinaSearch(
          query
        );

      allSources.push(
        ...results
      );
    } catch (
      error
    ) {
      console.warn(
        '[Gemilang Search]',
        query,
        error.message
      );

      queryErrors.push({
        query,
        error:
          error.message,
      });
    }
  }

  // ==========================================================
  // 2. RANK
  // ==========================================================

  const searchContext =
    [
      cleanTopic,
      mapel,
      kelas,
      arahan,
    ]
      .filter(Boolean)
      .join(' ');

  const ranked =
    rankSources(
      allSources,
      searchContext
    );

  if (
    ranked.length ===
    0
  ) {
    return res
      .status(502)
      .json({
        success: false,

        error:
          'Sistem tidak menemukan sumber internet yang relevan.',

        debug:
          queryErrors,
      });
  }

  // ==========================================================
  // 3. NO SECOND HTTP PAGE FETCH
  // ==========================================================

  const sources =
    prepareSources(
      ranked
    );

  if (
    sources.length ===
    0
  ) {
    return res
      .status(502)
      .json({
        success: false,

        error:
          'Sumber pencarian ditemukan tetapi tidak memiliki content yang cukup untuk dianalisis.',

        debug:
          queryErrors,

        researchSources:
          ranked.map(
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
  // 4. SMALL RESEARCH PACK
  // ==========================================================

  const researchPack =
    buildResearchPack(
      sources
    );

  // ==========================================================
  // 5. PROMPT
  // ==========================================================

  const systemPrompt =
    buildSystemPrompt({
      sourceMode:
        mode,
      targetYear:
        year,
      allowedTypes,
      hotsLevel:
        hotsLevel ||
        '',
    });

  const userPrompt = `
BIMBEL GEMILANG

MAPEL:
${mapel || 'Umum'}

KELAS:
${kelas || 'SMP'}

TOPIK:
${cleanTopic}

TARGET:
${year}

MODE:
${mode}

JUMLAH:
${jumlah}

TIPE:
${allowedTypes.join(', ')}

ARAHAN:
${cleanText(
  arahan || ''
)}

================================================
RESEARCH SOURCES
================================================

${researchPack}

================================================
TASK
================================================

${
  mode ===
  'source'
    ? `
Ambil hingga ${jumlah} soal yang benar-benar ada
di sumber.

Pertahankan isi soal dan opsi.
Tentukan kunci.
Verifikasi.
Berikan pembahasan.

Jangan membuat soal baru.
`
    : `
Analisis sumber dan buat hingga ${jumlah} latihan baru
berdasarkan pola yang ditemukan.

Jangan sebut sebagai bocoran.
`
}

Jangan memaksakan jumlah.
Lebih baik ${jumlah - 1} soal valid daripada
soal palsu/tidak relevan.
`;

  // ==========================================================
  // 6. CLOUDFLARE
  // ==========================================================

  let aiData;

  try {
    aiData =
      await callCloudflare(
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
      '[Gemilang Cloudflare]',
      message
    );

    if (
      error.status ===
      408
    ) {
      return res
        .status(504)
        .json({
          success: false,

          error:
            'Cloudflare AI timeout. Batch diperkecil dan research pack sudah diminimalkan.',

          debug:
            message,
        });
    }

    if (
      error.status ===
      429
    ) {
      return res
        .status(429)
        .json({
          success: false,

          error:
            'Kuota harian Cloudflare Workers AI sudah mencapai batas.',

          debug:
            message,
        });
    }

    return res
      .status(502)
      .json({
        success: false,

        error:
          'Cloudflare Workers AI gagal memproses riset.',

        debug:
          message,
      });
  }

  // ==========================================================
  // 7. EXTRACT
  // ==========================================================

  const rawText =
    extractCloudflareText(
      aiData
    );

  if (
    !rawText.trim()
  ) {
    return res
      .status(502)
      .json({
        success: false,

        error:
          'Cloudflare AI tidak mengembalikan data soal.',

        debug: {
          model:
            CLOUDFLARE_MODEL,
        },
      });
  }

  const objects =
    extractJsonObjects(
      rawText
    );

  // ==========================================================
  // 8. QUALITY + DUPLICATE
  // ==========================================================

  const questions =
    [];

  const seen =
    new Set();

  let rejected =
    0;

  let duplicated =
    0;

  for (
    const raw of
      objects
  ) {
    const question =
      validateQuestion(
        raw,
        allowedTypes,
        mode,
        sources
      );

    if (
      !question
    ) {
      rejected +=
        1;

      continue;
    }

    const fingerprint =
      questionFingerprint(
        question.question
      );

    let duplicate =
      false;

    if (
      seen.has(
        fingerprint
      )
    ) {
      duplicate = true;
    }

    if (!duplicate) {
      for (
        const existing of
          questions
      ) {
        const similarity =
          jaccard(
            fingerprint,
            questionFingerprint(
              existing.question
            )
          );

        if (
          similarity >=
          0.88
        ) {
          duplicate =
            true;
          break;
        }
      }
    }

    if (
      duplicate
    ) {
      duplicated +=
        1;

      continue;
    }

    seen.add(
      fingerprint
    );

    question.researchBacked =
      true;

    question.researchSources =
      sources.map(
        (source) => ({
          title:
            source.title ||
            '',
          url:
            source.url ||
            '',
        })
      );

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

  if (
    questions.length ===
    0
  ) {
    return res
      .status(502)
      .json({
        success: false,

        error:
          'Tidak ada soal yang lolos quality gate.',

        debug: {
          model:
            CLOUDFLARE_MODEL,

          parsedObjects:
            objects.length,

          rejected,

          duplicated,

          rawTextSample:
            rawText.slice(
              0,
              1200
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
  // 9. RESPONSE
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

      sourceMode:
        mode,

      usedTrendSearch:
        true,

      researchProvider:
        'Jina Search',

      aiProvider:
        'Cloudflare Workers AI',

      model:
        CLOUDFLARE_MODEL,

      diagnostics: {
        searchedQueries:
          queries.length,

        queryErrors,

        searchResults:
          allSources.length,

        selectedSources:
          sources.length,

        parsedObjects:
          objects.length,

        rejected,

        duplicated,
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

            relevanceScore:
              source.relevanceScore ||
              0,
          })
        ),
    });
}