// api/generateQuizFromTopic.js
// ============================================================
// BIMBEL GEMILANG
// FAST QUESTION RESEARCH ENGINE
// ============================================================
//
// FLOW:
//
// TOPIC
//   ↓
// DUCKDUCKGO SEARCH
//   ↓
// MAX 2 SOURCES
//   ↓
// READ SOURCES
//   ↓
// SMALL RESEARCH PACK
//   ↓
// CLOUDFLARE GLM-4.7-FLASH
//   ↓
// QUALITY GATE
//   ↓
// MANAGE QUIZ
//
// ============================================================

export const maxDuration = 60;

const MODEL =
  process.env.CLOUDFLARE_MODEL ||
  '@cf/zai-org/glm-4.7-flash';

const MAX_BATCH = 10;

// ============================================================
// TIME BUDGET
// ============================================================
//
// Sengaja dibuat jauh di bawah 60 detik.
// Tujuannya memberi ruang untuk cold start + Vercel.
//

const SEARCH_TIMEOUT = 4000;
const PAGE_TIMEOUT = 3000;
const AI_TIMEOUT = 26000;

// ============================================================
// RESEARCH LIMIT
// ============================================================

const MAX_QUERIES = 2;
const MAX_SEARCH_RESULTS = 4;
const MAX_SOURCES = 2;

const MAX_SOURCE_CHARS = 4000;
const MAX_PACK_CHARS = 8500;

const MIN_SOURCE_TEXT = 80;

// ============================================================
// BASIC HELPERS
// ============================================================

function cleanText(value = '') {
  return String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
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
      .filter((x) => x.length >= 2)
  );
}

function similarity(a = '', b = '') {
  const A = tokenSet(a);
  const B = tokenSet(b);

  if (!A.size || !B.size) return 0;

  let intersection = 0;

  for (const token of A) {
    if (B.has(token)) intersection++;
  }

  const union =
    A.size + B.size - intersection;

  return union
    ? intersection / union
    : 0;
}

function isInteger(value, min, max) {
  return (
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  );
}

function finiteNumber(value) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  );
}

// ============================================================
// FETCH WITH TIMEOUT
// ============================================================

async function fetchTimeout(
  url,
  options = {},
  timeout = 5000
) {
  const controller =
    new AbortController();

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
}

// ============================================================
// QUESTION DUPLICATE
// ============================================================

function questionFingerprint(value = '') {
  return normalizeText(value)
    .replace(/\bsoal\s+\d+\b/gi, ' ')
    .replace(/\bnomor\s+\d+\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isDuplicate(question, existing) {
  const current =
    questionFingerprint(question);

  for (const item of existing) {
    const old =
      questionFingerprint(
        item.question
      );

    if (
      current &&
      current === old
    ) {
      return true;
    }

    if (
      similarity(current, old) >= 0.84
    ) {
      return true;
    }
  }

  return false;
}

// ============================================================
// VISUAL
// ============================================================

function hasVisualCue(text = '') {
  const value =
    normalizeText(text);

  const cues = [
    'lihat gambar',
    'perhatikan gambar',
    'gambar berikut',
    'berdasarkan gambar',

    'lihat grafik',
    'perhatikan grafik',
    'grafik berikut',

    'lihat diagram',
    'perhatikan diagram',
    'diagram berikut',

    'lihat tabel',
    'perhatikan tabel',
    'tabel berikut',

    'look at the picture',
    'look at the image',
    'look at the graph',
    'look at the diagram',
    'look at the table',
  ];

  return cues.some((cue) =>
    value.includes(
      normalizeText(cue)
    )
  );
}

// ============================================================
// CLOCK
// ============================================================

function buildClockSvg(clock) {
  if (
    !clock ||
    !finiteNumber(clock.hour) ||
    !finiteNumber(clock.minute)
  ) {
    return '';
  }

  const hour =
    ((Number(clock.hour) % 12) + 12) % 12;

  const minute = Math.max(
    0,
    Math.min(
      59,
      Number(clock.minute)
    )
  );

  const cx = 140;
  const cy = 140;
  const radius = 108;

  function xy(angle, length) {
    const rad =
      ((angle - 90) * Math.PI) / 180;

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
  }

  const hourTip = xy(
    hour * 30 + minute * 0.5,
    55
  );

  const minuteTip = xy(
    minute * 6,
    82
  );

  const ticks = Array.from(
    { length: 60 },
    (_, i) => {
      const major = i % 5 === 0;

      const outer = xy(
        i * 6,
        radius
      );

      const inner = xy(
        i * 6,
        major
          ? radius - 12
          : radius - 6
      );

      return `
<line
x1="${outer.x.toFixed(1)}"
y1="${outer.y.toFixed(1)}"
x2="${inner.x.toFixed(1)}"
y2="${inner.y.toFixed(1)}"
stroke="#334155"
stroke-width="${major ? 2 : 1}"
/>`;
    }
  ).join('');

  const numbers = Array.from(
    { length: 12 },
    (_, i) => {
      const number = i === 0 ? 12 : i;

      const p = xy(
        i * 30,
        83
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
height="280">

<rect
width="280"
height="280"
fill="white"/>

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
x2="${hourTip.x}"
y2="${hourTip.y}"
stroke="#1e293b"
stroke-width="6"
stroke-linecap="round"/>

<line
x1="140"
y1="140"
x2="${minuteTip.x}"
y2="${minuteTip.y}"
stroke="#475569"
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
// GRAPH
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
          finiteNumber(p?.x) &&
          finiteNumber(p?.y)
      )
      .slice(0, 60);

  if (points.length < 2) {
    return '';
  }

  const W = 640;
  const H = 400;
  const pad = 55;

  const xs = points.map(
    (p) => p.x
  );

  const ys = points.map(
    (p) => p.y
  );

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  function mapX(x) {
    return (
      pad +
      ((x - minX) /
        Math.max(maxX - minX, 1)) *
        (W - pad * 2)
    );
  }

  function mapY(y) {
    return (
      H -
      pad -
      ((y - minY) /
        Math.max(maxY - minY, 1)) *
        (H - pad * 2)
    );
  }

  const path = points
    .map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'} ${mapX(
          p.x
        ).toFixed(1)} ${mapY(
          p.y
        ).toFixed(1)}`
    )
    .join(' ');

  const highlights =
    Array.isArray(graph.highlight)
      ? graph.highlight
          .filter(
            (p) =>
              finiteNumber(p?.x) &&
              finiteNumber(p?.y)
          )
          .map(
            (p) =>
              `<circle
cx="${mapX(p.x)}"
cy="${mapY(p.y)}"
r="7"
fill="#dc2626"/>`
          )
          .join('')
      : '';

  const svg = `
<svg
xmlns="http://www.w3.org/2000/svg"
viewBox="0 0 ${W} ${H}"
width="${W}"
height="${H}">

<rect
width="${W}"
height="${H}"
fill="white"/>

<line
x1="${pad}"
y1="${H - pad}"
x2="${W - pad}"
y2="${H - pad}"
stroke="#64748b"
stroke-width="2"/>

<line
x1="${pad}"
y1="${pad}"
x2="${pad}"
y2="${H - pad}"
stroke="#64748b"
stroke-width="2"/>

<path
d="${path}"
fill="none"
stroke="#1e293b"
stroke-width="3"/>

${highlights}

<text
x="${W - pad}"
y="${H - 15}"
font-family="Arial"
font-size="16">
${cleanText(graph.xLabel || 'x')}
</text>

<text
x="15"
y="${pad}"
font-family="Arial"
font-size="16">
${cleanText(graph.yLabel || 'y')}
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
// SEARCH QUERY
// ============================================================

function buildQueries({
  topic,
  mapel,
  kelas,
  year,
  mode,
  arahan,
}) {
  const base = [
    topic,
    mapel,
    kelas,
  ]
    .filter(Boolean)
    .join(' ');

  const extra =
    cleanText(arahan || '');

  if (mode === 'prediction') {
    return [
      `${base} contoh soal TKA HOTS ${extra}`,
      `${base} latihan soal kisi kisi ${year}`,
    ].slice(0, MAX_QUERIES);
  }

  return [
    `${base} contoh soal`,
    `${base} latihan soal ujian`,
  ].slice(0, MAX_QUERIES);
}

// ============================================================
// DUCKDUCKGO
// ============================================================

async function searchDuckDuckGo(query) {
  const url =
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(
      query
    )}`;

  const response =
    await fetchTimeout(
      url,
      {
        method: 'GET',

        headers: {
          Accept: 'text/html',

          'User-Agent':
            'Mozilla/5.0 BimbelGemilangResearch',
        },
      },
      SEARCH_TIMEOUT
    );

  if (!response.ok) {
    throw new Error(
      `DuckDuckGo HTTP ${response.status}`
    );
  }

  const html =
    await response.text();

  const results = [];

  const resultBlocks =
    html.match(
      /<div[^>]+class="result[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi
    ) || [];

  for (
    const block of resultBlocks
  ) {
    if (
      results.length >=
      MAX_SEARCH_RESULTS
    ) {
      break;
    }

    const link =
      block.match(
        /<a[^>]+class="result__a"[^>]+href="([^"]+)"/i
      );

    const title =
      block.match(
        /<a[^>]+class="result__a"[^>]*>([\s\S]*?)<\/a>/i
      );

    const snippet =
      block.match(
        /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i
      );

    if (!link) continue;

    let target = link[1];

    try {
      target =
        decodeURIComponent(
          target
        );
    } catch (_) {}

    const redirect =
      target.match(
        /uddg=([^&]+)/i
      );

    if (redirect) {
      try {
        target =
          decodeURIComponent(
            redirect[1]
          );
      } catch (_) {}
    }

    if (
      !target.startsWith('http')
    ) {
      continue;
    }

    results.push({
      title:
        cleanText(
          title?.[1] || ''
        ),

      url: target,

      content:
        cleanText(
          snippet?.[1] || ''
        ),
    });
  }

  return results;
}

// ============================================================
// RANK
// ============================================================

function rankSources(
  sources,
  context
) {
  const seen = new Set();

  return sources
    .filter(
      (x) =>
        x?.url &&
        x.url.startsWith('http')
    )
    .filter((source) => {
      const key =
        source.url.split('#')[0];

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .map((source) => ({
      ...source,

      relevanceScore:
        similarity(
          context,
          source.title +
            ' ' +
            source.content
        ),
    }))
    .sort(
      (a, b) =>
        b.relevanceScore -
        a.relevanceScore
    )
    .slice(0, MAX_SOURCES);
}

// ============================================================
// READ PAGE
// ============================================================

async function readPage(source) {
  try {
    const response =
      await fetchTimeout(
        source.url,
        {
          method: 'GET',

          headers: {
            Accept:
              'text/html,application/xhtml+xml',

            'User-Agent':
              'Mozilla/5.0 BimbelGemilangResearch',
          },
        },
        PAGE_TIMEOUT
      );

    if (!response.ok) {
      return {
        ...source,
        content:
          source.content || '',
      };
    }

    const html =
      await response.text();

    if (!html) {
      return source;
    }

    const titleMatch =
      html.match(
        /<title[^>]*>([\s\S]*?)<\/title>/i
      );

    const title =
      cleanText(
        titleMatch?.[1] ||
          source.title ||
          ''
      );

    const content =
      cleanText(
        html
          .replace(
            /<script[\s\S]*?<\/script>/gi,
            ' '
          )
          .replace(
            /<style[\s\S]*?<\/style>/gi,
            ' '
          )
          .replace(
            /<noscript[\s\S]*?<\/noscript>/gi,
            ' '
          )
          .replace(
            /<svg[\s\S]*?<\/svg>/gi,
            ' '
          )
          .replace(
            /<[^>]+>/g,
            ' '
          )
      ).slice(
        0,
        MAX_SOURCE_CHARS
      );

    // --------------------------------------------------------
    // IMAGE
    // --------------------------------------------------------

    const images = [];

    const regex =
      /<img\b[^>]*>/gi;

    let match;

    while (
      (
        match =
          regex.exec(html)
      ) &&
      images.length < 5
    ) {
      const tag = match[0];

      const src =
        tag.match(
          /(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i
        );

      if (!src) continue;

      let imageUrl = '';

      try {
        imageUrl =
          new URL(
            src[1],
            source.url
          ).href;
      } catch (_) {}

      if (!imageUrl) continue;

      const alt =
        tag.match(
          /alt=["']([^"']*)["']/i
        );

      images.push({
        url: imageUrl,

        alt:
          cleanText(
            alt?.[1] || ''
          ),
      });
    }

    return {
      ...source,

      title,

      content:
        content.length >=
        MIN_SOURCE_TEXT
          ? content
          : source.content || '',

      images,
    };
  } catch (error) {
    return {
      ...source,

      readError:
        error?.message || 'read failed',

      content:
        source.content || '',
    };
  }
}

// ============================================================
// RESEARCH PACK
// ============================================================

function buildResearchPack(pages) {
  let pack = '';

  for (
    let i = 0;
    i < pages.length;
    i++
  ) {
    const page = pages[i];

    const images =
      Array.isArray(page.images)
        ? page.images
            .slice(0, 5)
            .map(
              (image, index) =>
                `[IMAGE ${index}] ${image.url} | ${image.alt || ''}`
            )
            .join('\n')
        : '';

    const block = `
[SOURCE ${i}]
TITLE: ${page.title || ''}
URL: ${page.url || ''}
TEXT:
${(
  page.content || ''
).slice(0, MAX_SOURCE_CHARS)}

IMAGES:
${images}
`;

    if (
      pack.length +
        block.length <=
      MAX_PACK_CHARS
    ) {
      pack += block;
    }
  }

  return pack.trim();
}

// ============================================================
// CLOUDFLARE
// ============================================================

async function callCloudflare({
  systemPrompt,
  userPrompt,
}) {
  const token =
    process.env
      .CLOUDFLARE_API_TOKEN;

  const accountId =
    process.env
      .CLOUDFLARE_ACCOUNT_ID;

  if (!token) {
    const error =
      new Error(
        'CLOUDFLARE_API_TOKEN belum tersedia.'
      );

    error.status = 500;

    throw error;
  }

  if (!accountId) {
    const error =
      new Error(
        'CLOUDFLARE_ACCOUNT_ID belum tersedia.'
      );

    error.status = 500;

    throw error;
  }

  const url =
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`;

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

    temperature: 0.15,

    max_completion_tokens: 4000,

    stream: false,
  };

  const response =
    await fetchTimeout(
      url,
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${token}`,

          'Content-Type':
            'application/json',

          Accept:
            'application/json',
        },

        body:
          JSON.stringify(body),
      },
      AI_TIMEOUT
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
        data?.errors?.[0]?.message ||
          data?.message ||
          raw ||
          `Cloudflare HTTP ${response.status}`
      );

    error.status =
      response.status;

    throw error;
  }

  return data;
}

// ============================================================
// EXTRACT AI TEXT
// ============================================================

function extractAIText(data) {
  const result =
    data?.result;

  if (
    typeof result === 'string'
  ) {
    return result;
  }

  if (
    typeof result?.response ===
    'string'
  ) {
    return result.response;
  }

  if (
    typeof result?.text ===
    'string'
  ) {
    return result.text;
  }

  if (
    Array.isArray(
      result?.choices
    )
  ) {
    return result.choices
      .map((choice) => {
        const content =
          choice?.message?.content;

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
              (x) =>
                x?.text || ''
            )
            .join('');
        }

        return (
          choice?.text || ''
        );
      })
      .join('\n');
  }

  return '';
}

// ============================================================
// JSON OBJECT PARSER
// ============================================================

function extractJsonObjects(
  text = ''
) {
  const objects = [];

  let depth = 0;
  let start = -1;
  let string = false;
  let escaped = false;

  for (
    let i = 0;
    i < text.length;
    i++
  ) {
    const char = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      string = !string;
      continue;
    }

    if (string) continue;

    if (char === '{') {
      if (depth === 0) {
        start = i;
      }

      depth++;
    }

    if (char === '}') {
      depth--;

      if (
        depth === 0 &&
        start >= 0
      ) {
        const piece =
          text.slice(
            start,
            i + 1
          );

        try {
          objects.push(
            JSON.parse(piece)
          );
        } catch (_) {}

        start = -1;
      }
    }
  }

  return objects;
}

// ============================================================
// SOURCE EVIDENCE
// ============================================================

function evidenceScore(
  question,
  options,
  source
) {
  if (!source) return 0;

  const sourceText =
    source.title +
    ' ' +
    source.content;

  const q =
    tokenSet(question);

  const o =
    tokenSet(
      Array.isArray(options)
        ? options.join(' ')
        : ''
    );

  const s =
    tokenSet(sourceText);

  let qHits = 0;
  let oHits = 0;

  for (const token of q) {
    if (s.has(token)) {
      qHits++;
    }
  }

  for (const token of o) {
    if (s.has(token)) {
      oHits++;
    }
  }

  const qScore =
    q.size
      ? qHits / q.size
      : 0;

  const oScore =
    o.size
      ? oHits / o.size
      : 0;

  return (
    qScore * 0.75 +
    oScore * 0.25
  );
}

// ============================================================
// VALIDATE
// ============================================================

function validateQuestion(
  raw,
  allowedTypes,
  pages,
  mode
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
      raw.question || ''
    );

  if (
    question.length < 5
  ) {
    return null;
  }

  let source = null;

  if (mode === 'source') {
    if (
      !Number.isInteger(
        raw.sourceIndex
      )
    ) {
      return null;
    }

    source =
      pages[
        raw.sourceIndex
      ];

    if (!source) {
      return null;
    }
  }

  // ----------------------------------------------------------
  // MULTIPLE
  // ----------------------------------------------------------

  if (
    raw.type === 'multiple'
  ) {
    if (
      !Array.isArray(
        raw.options
      ) ||
      raw.options.length !== 4
    ) {
      return null;
    }

    if (
      !isInteger(
        raw.correct,
        0,
        3
      )
    ) {
      return null;
    }
  }

  // ----------------------------------------------------------
  // MULTISELECT
  // ----------------------------------------------------------

  if (
    raw.type ===
    'multiselect'
  ) {
    if (
      !Array.isArray(
        raw.options
      ) ||
      raw.options.length < 2
    ) {
      return null;
    }

    if (
      !Array.isArray(
        raw.correctAnswers
      ) ||
      !raw.correctAnswers.length
    ) {
      return null;
    }

    if (
      !raw.correctAnswers.every(
        (x) =>
          isInteger(
            x,
            0,
            raw.options.length - 1
          )
      )
    ) {
      return null;
    }
  }

  // ----------------------------------------------------------
  // TRUE FALSE
  // ----------------------------------------------------------

  if (
    raw.type ===
    'truefalse'
  ) {
    if (
      !Array.isArray(
        raw.statements
      ) ||
      raw.statements.length < 2
    ) {
      return null;
    }

    if (
      !raw.statements.every(
        (x) =>
          typeof x?.text ===
            'string' &&
          typeof x?.isTrue ===
            'boolean'
      )
    ) {
      return null;
    }
  }

  // ----------------------------------------------------------
  // SHORT ANSWER
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // CAUSE EFFECT
  // ----------------------------------------------------------

  if (
    raw.type ===
    'causeeffect'
  ) {
    if (
      !cleanText(raw.cause) ||
      !cleanText(raw.effect)
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

  // ----------------------------------------------------------
  // MATCHING
  // ----------------------------------------------------------

  if (
    raw.type ===
    'matching'
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
  // READING
  // ----------------------------------------------------------

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
      raw.subQuestions.length < 3
    ) {
      return null;
    }

    if (
      !raw.subQuestions.every(
        (x) =>
          Array.isArray(
            x?.options
          ) &&
          x.options.length === 4 &&
          isInteger(
            x.correct,
            0,
            3
          )
      )
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

  const needsImage =
    Boolean(raw.needsImage);

  const imageHint =
    cleanText(
      raw.imageHint ||
        raw.image_keyword ||
        ''
    );

  if (raw.clock) {
    qImage =
      buildClockSvg(
        raw.clock
      );

    visualRequired = true;
    visualKind = 'clock';
  }

  if (raw.graph) {
    qImage =
      buildGraphSvg(
        raw.graph
      );

    visualRequired = true;
    visualKind = 'graph';
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
    visualRequired = true;
    visualKind = 'image-options';
  }

  if (needsImage) {
    visualRequired = true;

    if (
      visualKind === 'none'
    ) {
      visualKind = 'photo';
    }
  }

  if (
    hasVisualCue(question) &&
    !visualRequired
  ) {
    return null;
  }

  // ----------------------------------------------------------
  // SOURCE EVIDENCE
  // ----------------------------------------------------------

  let score = 1;

  if (mode === 'source') {
    score =
      evidenceScore(
        question,
        raw.options,
        source
      );

    if (score < 0.18) {
      return null;
    }
  }

  // ----------------------------------------------------------
  // NORMALIZE
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
        raw.readingText || ''
      ),

    subQuestions:
      Array.isArray(
        raw.subQuestions
      )
        ? raw.subQuestions
        : [],

    shortAnswer:
      cleanText(
        raw.shortAnswer || ''
      ),

    cause:
      cleanText(
        raw.cause || ''
      ),

    effect:
      cleanText(
        raw.effect || ''
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
        raw.explanation || ''
      ),

    answerVerification:
      cleanText(
        raw.answerVerification || ''
      ),

    analysisSummary:
      cleanText(
        raw.analysisSummary || ''
      ),

    qImage:
      qImage || undefined,

    needsImage,

    imageHint,

    imageSource:
      raw.imageSource || null,

    researchBacked: true,

    researchSources: [],

    sourceMode: mode,

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
      mode === 'source'
        ? true
        : Boolean(
            raw.sourceQuestionVerbatim
          ),

    sourceEvidenceScore:
      Number(
        score.toFixed(3)
      ),

    visualRequired,

    visualKind,
  };
}

// ============================================================
// SYSTEM PROMPT
// ============================================================

function buildSystemPrompt({
  mode,
  year,
  types,
  hotsLevel,
}) {
  return `
Kamu adalah Question Engine Bimbel Gemilang.

TARGET:
${year}

MODE:
${mode}

LEVEL:
${hotsLevel || 'standar sampai HOTS'}

Buat soal akademik yang akurat.

ATURAN:

1. Jangan mengarang fakta.
2. Untuk matematika/fisika/kimia hitung ulang.
3. Multiple harus memiliki tepat 1 jawaban benar.
4. Pembahasan harus singkat tetapi jelas.
5. answerVerification harus menjelaskan mengapa kunci benar.
6. analysisSummary berisi konsep yang diuji.
7. Jangan menyebut soal sebagai bocoran.
8. Jangan mengatakan pasti keluar ujian.

MODE SOURCE:
- Hanya ambil soal yang benar-benar ada pada sumber.
- Jangan membuat soal baru.
- sourceQuestionVerbatim = true.
- Jika sumber tidak menyediakan soal yang jelas, jangan gunakan.

MODE PREDICTION:
- Gunakan sumber sebagai evidence.
- Buat soal BARU.
- sourceQuestionVerbatim = false.
- Analisis kompetensi, pola, HOTS dan stimulus.

VISUAL:
- Jangan menulis "perhatikan gambar" tanpa gambar.
- Untuk visual prediction gunakan clock atau graph bila sesuai.
- Jangan mengarang URL gambar.

OUTPUT:
JSONL saja.
Tidak boleh markdown.
Baris pertama:
{"meta":true}

TIPE YANG BOLEH:
${types.join(', ')}

PENTING:
Maksimal ${MAX_BATCH} soal.
Utamakan validitas daripada jumlah.
`;
}

// ============================================================
// HANDLER
// ============================================================

export default async function handler(
  req,
  res
) {
  const started =
    Date.now();

  // ==========================================================
  // METHOD
  // ==========================================================

  if (
    req.method !==
    'POST'
  ) {
    return res.status(405).json({
      success: false,
      error:
        'Method not allowed.',
    });
  }

  // ==========================================================
  // BODY
  // ==========================================================

  const body =
    req.body || {};

  const topic =
    cleanText(body.topic);

  const mapel =
    cleanText(body.mapel);

  const kelas =
    cleanText(body.kelas);

  const arahan =
    cleanText(body.arahan);

  const hotsLevel =
    cleanText(
      body.hotsLevel
    );

  if (!topic) {
    return res.status(400).json({
      success: false,
      error:
        'Topik wajib diisi.',
    });
  }

  // ==========================================================
  // ENV
  // ==========================================================

  if (
    !process.env
      .CLOUDFLARE_API_TOKEN
  ) {
    return res.status(500).json({
      success: false,
      error:
        'CLOUDFLARE_API_TOKEN belum tersedia di Vercel.',
    });
  }

  if (
    !process.env
      .CLOUDFLARE_ACCOUNT_ID
  ) {
    return res.status(500).json({
      success: false,
      error:
        'CLOUDFLARE_ACCOUNT_ID belum tersedia di Vercel.',
    });
  }

  // ==========================================================
  // COUNT
  // ==========================================================

  const parsed =
    Number(
      body.jumlahSoal
    );

  const jumlah = Math.min(
    Math.max(
      Number.isFinite(parsed)
        ? Math.floor(parsed)
        : 5,
      1
    ),
    MAX_BATCH
  );

  // ==========================================================
  // TYPES
  // ==========================================================

  const allowedTypes =
    Array.isArray(body.types) &&
    body.types.length
      ? body.types
      : ['multiple'];

  // ==========================================================
  // MODE
  // ==========================================================

  const mode =
    body.sourceMode ===
    'prediction'
      ? 'prediction'
      : 'source';

  const year =
    cleanText(
      body.targetYear
    ) ||
    String(
      new Date().getFullYear() +
        1
    );

  // ==========================================================
  // 1. SEARCH
  // ==========================================================

  const queries =
    buildQueries({
      topic,
      mapel,
      kelas,
      year,
      mode,
      arahan,
    });

  const searchSettled =
    await Promise.allSettled(
      queries.map(
        searchDuckDuckGo
      )
    );

  const rawSources = [];
  const queryErrors = [];

  searchSettled.forEach(
    (result, index) => {
      if (
        result.status ===
        'fulfilled'
      ) {
        rawSources.push(
          ...result.value
        );
      } else {
        queryErrors.push({
          query:
            queries[index],

          error:
            result.reason?.message ||
            'Search failed',
        });
      }
    }
  );

  // ==========================================================
  // 2. RANK
  // ==========================================================

  const context = [
    topic,
    mapel,
    kelas,
    arahan,
  ]
    .filter(Boolean)
    .join(' ');

  const ranked =
    rankSources(
      rawSources,
      context
    );

  // ==========================================================
  // 3. READ MAX 2 SOURCES
  // ==========================================================

  const readablePages =
    ranked.length
      ? (
          await Promise.all(
            ranked
              .slice(
                0,
                MAX_SOURCES
              )
              .map(readPage)
          )
        ).filter(
          (page) =>
            Boolean(
              page?.content
            )
        )
      : [];

  // ==========================================================
  // 4. RESEARCH PACK
  // ==========================================================

  const researchPack =
    buildResearchPack(
      readablePages
    );

  // ==========================================================
  // 5. PROMPTS
  // ==========================================================

  const systemPrompt =
    buildSystemPrompt({
      mode,
      year,
      types:
        allowedTypes,
      hotsLevel,
    });

  const userPrompt = `
BIMBEL GEMILANG

MAPEL:
${mapel || 'Umum'}

KELAS:
${kelas || 'Sesuai input'}

TOPIK:
${topic}

TAHUN:
${year}

JUMLAH:
${jumlah}

MODE:
${mode}

TIPE:
${allowedTypes.join(', ')}

ARAHAN:
${arahan || '-'}

==================================================
RESEARCH
==================================================

${
  researchPack ||
  'Tidak ada sumber yang berhasil dibaca.'
}

==================================================
TASK
==================================================

${
  mode === 'source'
    ? `
Ambil soal yang benar-benar terdapat dalam sumber.
Jangan membuat soal baru.
Jika tidak cukup, keluarkan hanya yang benar-benar valid.
`
    : `
Gunakan research sebagai evidence.
Buat soal latihan BARU.
Sesuaikan dengan topik, kompetensi dan tingkat kesulitan.
`
}

Untuk setiap soal berikan:
- jawaban
- pembahasan singkat
- answerVerification
- analysisSummary

Output maksimal ${jumlah} soal.
Output JSONL saja.
`;

  // ==========================================================
  // 6. CLOUDFLARE
  // ==========================================================

  let aiData;

  const aiStarted =
    Date.now();

  try {
    aiData =
      await callCloudflare({
        systemPrompt,
        userPrompt,
      });
  } catch (error) {
    console.error(
      '[Gemilang][AI]',
      error?.message
    );

    if (
      error?.name ===
      'AbortError'
    ) {
      return res.status(504).json({
        success: false,

        error:
          'Cloudflare AI timeout sebelum 60 detik. Research berhasil, tetapi model belum selesai.',

        model: MODEL,

        diagnostics: {
          totalDurationMs:
            Date.now() -
            started,

          aiDurationMs:
            Date.now() -
            aiStarted,

          researchSourceCount:
            readablePages.length,
        },
      });
    }

    if (
      error?.status === 401 ||
      error?.status === 403
    ) {
      return res.status(502).json({
        success: false,

        error:
          'Cloudflare API Token ditolak.',

        debug:
          error.message,

        model: MODEL,
      });
    }

    if (
      error?.status === 429
    ) {
      return res.status(429).json({
        success: false,

        error:
          'Cloudflare AI terkena rate limit atau kuota.',

        debug:
          error.message,
      });
    }

    if (
      error?.status === 500
    ) {
      return res.status(500).json({
        success: false,
        error:
          error.message,
      });
    }

    return res.status(502).json({
      success: false,

      error:
        'Cloudflare Workers AI gagal memproses soal.',

      debug:
        error?.message ||
        'Unknown Cloudflare error.',
    });
  }

  const aiDuration =
    Date.now() -
    aiStarted;

  // ==========================================================
  // 7. TEXT
  // ==========================================================

  const rawText =
    extractAIText(
      aiData
    );

  if (!rawText.trim()) {
    return res.status(502).json({
      success: false,

      error:
        'Cloudflare tidak mengembalikan teks soal.',

      model: MODEL,

      debug:
        aiData?.result ||
        null,

      diagnostics: {
        totalDurationMs:
          Date.now() -
          started,

        aiDurationMs:
          aiDuration,
      },
    });
  }

  // ==========================================================
  // 8. PARSE
  // ==========================================================

  const objects =
    extractJsonObjects(
      rawText
    );

  if (!objects.length) {
    return res.status(502).json({
      success: false,

      error:
        'Output AI bukan JSON soal yang valid.',

      debug: {
        rawText:
          rawText.slice(
            0,
            3000
          ),

        length:
          rawText.length,
      },

      diagnostics: {
        totalDurationMs:
          Date.now() -
          started,

        aiDurationMs:
          aiDuration,
      },
    });
  }

  // ==========================================================
  // 9. QUALITY GATE
  // ==========================================================

  const questions = [];

  let rejected = 0;
  let duplicates = 0;

  for (
    const rawQuestion of objects
  ) {
    const question =
      validateQuestion(
        rawQuestion,
        allowedTypes,
        readablePages,
        mode
      );

    if (!question) {
      rejected++;
      continue;
    }

    if (
      isDuplicate(
        question.question,
        questions
      )
    ) {
      duplicates++;
      continue;
    }

    question.researchSources =
      readablePages.map(
        (page) => ({
          title:
            page.title || '',

          url:
            page.url || '',
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

  // ==========================================================
  // 10. NO QUESTIONS
  // ==========================================================

  if (!questions.length) {
    return res.status(502).json({
      success: false,

      error:
        mode === 'source'
          ? 'Sumber ditemukan, tetapi tidak ada soal yang lolos verifikasi.'
          : 'AI selesai, tetapi tidak ada soal yang lolos quality gate.',

      diagnostics: {
        queries,
        queryErrors,

        rawSearchResultCount:
          rawSources.length,

        rankedSourceCount:
          ranked.length,

        readablePageCount:
          readablePages.length,

        parsedObjectCount:
          objects.length,

        rejectedCount:
          rejected,

        duplicateCount:
          duplicates,

        aiDurationMs:
          aiDuration,

        totalDurationMs:
          Date.now() -
          started,
      },

      researchSources:
        readablePages.map(
          (page) => ({
            title:
              page.title || '',

            url:
              page.url || '',

            relevanceScore:
              page.relevanceScore ||
              0,
          })
        ),
    });
  }

  // ==========================================================
  // 11. SUCCESS
  // ==========================================================

  return res.status(200).json({
    success: true,

    questions,

    requestedCount:
      jumlah,

    returnedCount:
      questions.length,

    maxBatchSize:
      MAX_BATCH,

    possiblyTruncated:
      questions.length <
      jumlah,

    sourceMode:
      mode,

    researchProvider:
      'DuckDuckGo HTML Search',

    aiProvider:
      'Cloudflare Workers AI',

    model: MODEL,

    diagnostics: {
      queries,

      queryErrors,

      rawSearchResultCount:
        rawSources.length,

      rankedSourceCount:
        ranked.length,

      readablePageCount:
        readablePages.length,

      parsedObjectCount:
        objects.length,

      rejectedCount:
        rejected,

      duplicateCount:
        duplicates,

      aiDurationMs:
        aiDuration,

      totalDurationMs:
        Date.now() -
        started,
    },

    researchSources:
      readablePages.map(
        (page) => ({
          title:
            page.title || '',

          url:
            page.url || '',

          relevanceScore:
            Number(
              (
                page.relevanceScore ||
                0
              ).toFixed(3)
            ),
        })
      ),
  });
}