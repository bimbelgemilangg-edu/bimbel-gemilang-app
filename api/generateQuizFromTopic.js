// api/generateQuizFromTopic.js
// ============================================================
// BIMBEL GEMILANG
// QUESTION RESEARCH ENGINE
// ============================================================
//
// VERSI STABIL
//
// FLOW:
//
// TOPIC / KISI-KISI
//       ↓
// INTERNET RESEARCH
//       ↓
// DUCKDUCKGO SEARCH
//       ↓
// PILIH SUMBER
//       ↓
// BACA SUMBER
//       ↓
// RESEARCH PACK
//       ↓
// CLOUDFLARE GLM-4.7-FLASH
//       ↓
// QUALITY GATE
//       ↓
// MANAGE QUIZ
//
// JINA SUDAH DIHAPUS.
//
// ENV YANG DIBUTUHKAN:
//
// CLOUDFLARE_API_TOKEN
// CLOUDFLARE_ACCOUNT_ID
//
// OPTIONAL:
//
// CLOUDFLARE_MODEL
//
// ============================================================

export const maxDuration = 60;

const CLOUDFLARE_MODEL =
  process.env.CLOUDFLARE_MODEL ||
  '@cf/zai-org/glm-4.7-flash';

const MAX_BATCH_QUESTIONS = 10;

// ------------------------------------------------------------
// TIME BUDGET
// ------------------------------------------------------------

const SEARCH_TIMEOUT_MS = 6500;
const PAGE_TIMEOUT_MS = 5000;
const AI_TIMEOUT_MS = 32000;

// ------------------------------------------------------------
// RESEARCH LIMIT
// ------------------------------------------------------------

const MAX_SEARCH_QUERIES = 2;
const MAX_RESULTS_PER_QUERY = 6;
const MAX_SOURCES = 4;

const MAX_SOURCE_CHARS = 5500;
const MAX_RESEARCH_PACK_CHARS = 18000;

const MIN_SOURCE_TEXT = 120;

// ============================================================
// BASIC
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
      /<noscript[\s\S]*?<\/noscript>/gi,
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

const tokenSet = (value = '') =>
  new Set(
    normalizeText(value)
      .split(' ')
      .filter(
        (x) =>
          x.length >= 2
      )
  );

const jaccardSimilarity = (
  a,
  b
) => {
  const A =
    typeof a === 'string'
      ? tokenSet(a)
      : a;

  const B =
    typeof b === 'string'
      ? tokenSet(b)
      : b;

  if (
    !A.size ||
    !B.size
  ) {
    return 0;
  }

  let intersection = 0;

  for (
    const token of A
  ) {
    if (
      B.has(token)
    ) {
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
};

const fingerprintText = (
  value = ''
) =>
  normalizeText(value)
    .replace(
      /\bsoal\s+\d+\b/gi,
      ' '
    )
    .replace(
      /\bnomor\s+\d+\b/gi,
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
  typeof value ===
    'number' &&
  Number.isFinite(value);

const isIntegerInRange = (
  value,
  min,
  max
) =>
  Number.isInteger(
    value
  ) &&
  value >= min &&
  value <= max;

// ============================================================
// FETCH TIMEOUT
// ============================================================

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = 5000
) {
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
}

// ============================================================
// QUESTION DUPLICATE
// ============================================================

function isQuestionDuplicate(
  question,
  existing
) {
  const current =
    fingerprintText(
      question
    );

  for (
    const item of existing
  ) {
    const old =
      fingerprintText(
        item.question
      );

    if (
      current &&
      current === old
    ) {
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
// VISUAL CUE
// ============================================================

function hasVisualCue(
  text = ''
) {
  const value =
    normalizeText(
      text
    );

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

    'lihat tabel',
    'perhatikan tabel',
    'tabel berikut',

    'look at the picture',
    'look at the image',
    'look at the graph',
    'look at the diagram',
    'look at the table',
  ];

  return cues.some(
    (cue) =>
      value.includes(
        normalizeText(cue)
      )
  );
}

// ============================================================
// CLOCK SVG
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

  const minute =
    Math.max(
      0,
      Math.min(
        59,
        Number(
          clock.minute
        )
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
      {
        length: 60,
      },
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
      {
        length: 12,
      },
      (_, i) => {
        const number =
          i === 0
            ? 12
            : i;

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
    Buffer.from(
      svg
    ).toString(
      'base64'
    )
  );
}

// ============================================================
// GRAPH SVG
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
      .slice(
        0,
        80
      );

  if (
    points.length < 2
  ) {
    return '';
  }

  const W = 640;
  const H = 400;
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

  const mapX =
    (x) =>
      pad +
      ((x - minX) /
        Math.max(
          maxX - minX,
          1
        )) *
        (W - pad * 2);

  const mapY =
    (y) =>
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
        (
          p,
          i
        ) =>
          `${i === 0 ? 'M' : 'L'} ${mapX(
            p.x
          ).toFixed(1)} ${mapY(
            p.y
          ).toFixed(1)}`
      )
      .join(' ');

  const highlights =
    Array.isArray(
      graph.highlight
    )
      ? graph.highlight
          .filter(
            (p) =>
              isFiniteNumber(
                p?.x
              ) &&
              isFiniteNumber(
                p?.y
              )
          )
          .map(
            (p) =>
              `<circle
cx="${mapX(p.x)}"
cy="${mapY(p.y)}"
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
  graph.xLabel ||
    'x'
)}
</text>

<text
x="15"
y="${pad}"
font-family="Arial"
font-size="16"
>
${cleanText(
  graph.yLabel ||
    'y'
)}
</text>

</svg>
`;

  return (
    'data:image/svg+xml;base64,' +
    Buffer.from(
      svg
    ).toString(
      'base64'
    )
  );
}

// ============================================================
// BUILD SEARCH QUERIES
// ============================================================

function buildResearchQueries({
  topic,
  mapel,
  kelas,
  targetYear,
  sourceMode,
  arahan,
}) {
  const base = [
    topic,
    mapel,
    kelas,
  ]
    .filter(Boolean)
    .join(' ');

  const instruction =
    cleanText(
      arahan || ''
    );

  if (
    sourceMode ===
    'prediction'
  ) {
    return [
      `${base} contoh soal TKA HOTS ${instruction}`,

      `${base} latihan soal ujian kisi kisi ${targetYear}`,
    ].slice(
      0,
      MAX_SEARCH_QUERIES
    );
  }

  return [
    `${base} contoh soal`,

    `${base} latihan soal ujian`,
  ].slice(
    0,
    MAX_SEARCH_QUERIES
  );
}

// ============================================================
// DUCKDUCKGO SEARCH
// ============================================================
//
// Jina DIHAPUS.
// Tidak membutuhkan API key.
// ============================================================

async function duckDuckGoSearch(
  query
) {
  const url =
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(
      query
    )}`;

  const response =
    await fetchWithTimeout(
      url,
      {
        method: 'GET',

        headers: {
          Accept:
            'text/html',

          'User-Agent':
            'Mozilla/5.0 BimbelGemilangResearch',
        },
      },
      SEARCH_TIMEOUT_MS
    );

  if (
    !response.ok
  ) {
    throw new Error(
      `Search HTTP ${response.status}`
    );
  }

  const html =
    await response.text();

  const results =
    [];

  const blocks =
    html.match(
      /<div[^>]+class="result[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi
    ) || [];

  for (
    const block of blocks
  ) {
    if (
      results.length >=
      MAX_RESULTS_PER_QUERY
    ) {
      break;
    }

    const linkMatch =
      block.match(
        /<a[^>]+class="result__a"[^>]+href="([^"]+)"/i
      );

    const titleMatch =
      block.match(
        /<a[^>]+class="result__a"[^>]*>([\s\S]*?)<\/a>/i
      );

    const snippetMatch =
      block.match(
        /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i
      );

    if (
      !linkMatch
    ) {
      continue;
    }

    let urlValue =
      linkMatch[1];

    try {
      urlValue =
        decodeURIComponent(
          urlValue
        );
    } catch (_) {}

    const redirectMatch =
      urlValue.match(
        /uddg=([^&]+)/i
      );

    if (
      redirectMatch
    ) {
      try {
        urlValue =
          decodeURIComponent(
            redirectMatch[1]
          );
      } catch (_) {}
    }

    results.push({
      title:
        cleanText(
          titleMatch?.[1] ||
            ''
        ),

      url:
        urlValue,

      content:
        cleanText(
          snippetMatch?.[1] ||
            ''
        ),
    });
  }

  // ----------------------------------------------------------
  // FALLBACK PARSER
  // ----------------------------------------------------------

  if (
    results.length === 0
  ) {
    const anchors =
      [
        ...html.matchAll(
          /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
        ),
      ];

    for (
      const match of anchors
    ) {
      if (
        results.length >=
        MAX_RESULTS_PER_QUERY
      ) {
        break;
      }

      let urlValue =
        match[1];

      if (
        !urlValue.includes(
          'http'
        )
      ) {
        continue;
      }

      if (
        urlValue.includes(
          'duckduckgo.com'
        )
      ) {
        continue;
      }

      results.push({
        title:
          cleanText(
            match[2]
          ),

        url:
          urlValue,

        content: '',
      });
    }
  }

  return results;
}

// ============================================================
// RANK SOURCES
// ============================================================

function rankSources(
  sources,
  context
) {
  const seen =
    new Set();

  return sources
    .filter(
      (source) =>
        source?.url
    )
    .filter(
      (source) => {
        const key =
          source.url
            .split('#')[0]
            .trim();

        if (
          seen.has(key)
        ) {
          return false;
        }

        seen.add(key);

        return true;
      }
    )
    .map(
      (source) => {
        const titleScore =
          jaccardSimilarity(
            context,
            source.title
          );

        const contentScore =
          jaccardSimilarity(
            context,
            source.content
          );

        return {
          ...source,

          relevanceScore:
            Number(
              (
                titleScore *
                  0.7 +
                contentScore *
                  0.3
              ).toFixed(3)
            ),
        };
      }
    )
    .sort(
      (a, b) =>
        b.relevanceScore -
        a.relevanceScore
    )
    .slice(
      0,
      MAX_SOURCES
    );
}

// ============================================================
// READ PAGE
// ============================================================

async function readPage(
  source
) {
  try {
    const response =
      await fetchWithTimeout(
        source.url,
        {
          method: 'GET',

          headers: {
            Accept:
              'text/html,application/xhtml+xml',

            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/151 Safari/537.36',
          },
        },
        PAGE_TIMEOUT_MS
      );

    if (
      !response.ok
    ) {
      return source;
    }

    const html =
      await response.text();

    if (
      !html ||
      html.length <
        200
    ) {
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

    // --------------------------------------------------------
    // TEXT
    // --------------------------------------------------------

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
    // IMAGE ASSETS
    // --------------------------------------------------------

    const images =
      [];

    const imageRegex =
      /<img\b[^>]*>/gi;

    let match;

    while (
      (
        match =
          imageRegex.exec(
            html
          )
      ) &&
      images.length < 10
    ) {
      const tag =
        match[0];

      const srcMatch =
        tag.match(
          /(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["']/i
        );

      if (
        !srcMatch
      ) {
        continue;
      }

      let imageUrl =
        '';

      try {
        imageUrl =
          new URL(
            srcMatch[1],
            source.url
          ).href;
      } catch (_) {}

      if (
        !imageUrl
      ) {
        continue;
      }

      const altMatch =
        tag.match(
          /alt=["']([^"']*)["']/i
        );

      images.push({
        url:
          imageUrl,

        alt:
          cleanText(
            altMatch?.[1] ||
              ''
          ),
      });
    }

    return {
      ...source,

      title,

      content,

      images,
    };
  } catch (
    error
  ) {
    return {
      ...source,

      readError:
        error?.message ||
        'read failed',
    };
  }
}

// ============================================================
// RESEARCH PACK
// ============================================================

function buildResearchPack(
  pages
) {
  let pack =
    '';

  pages.forEach(
    (
      page,
      index
    ) => {
      const imageList =
        Array.isArray(
          page.images
        )
          ? page.images
              .slice(
                0,
                8
              )
              .map(
                (
                  image,
                  imageIndex
                ) =>
                  `[IMAGE ${imageIndex}] ${image.url} | ALT: ${image.alt || ''}`
              )
              .join(
                '\n'
              )
          : '';

      const block = `
SOURCE_INDEX: ${index}

TITLE:
${page.title || ''}

URL:
${page.url || ''}

RELEVANCE:
${page.relevanceScore || 0}

CONTENT:
${(
  page.content ||
  ''
).slice(
  0,
  MAX_SOURCE_CHARS
)}

IMAGE_ASSETS:
${imageList}

==================================================
`;

      if (
        (
          pack +
          block
        ).length <=
        MAX_RESEARCH_PACK_CHARS
      ) {
        pack +=
          block;
      }
    }
  );

  return pack;
}

// ============================================================
// CLOUDFLARE AI
// ============================================================

async function callCloudflareAI({
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

    temperature: 0.2,

    max_completion_tokens:
      7000,

    stream: false,
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

          Accept:
            'application/json',
        },

        body:
          JSON.stringify(
            body
          ),
      },
      AI_TIMEOUT_MS
    );

  const raw =
    await response.text();

  let data =
    null;

  try {
    data =
      JSON.parse(
        raw
      );
  } catch (_) {}

  if (
    !response.ok
  ) {
    const error =
      new Error(
        data?.errors?.[0]
          ?.message ||
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

function extractCloudflareText(
  data
) {
  const result =
    data?.result;

  if (
    typeof result ===
    'string'
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

  return '';
}

// ============================================================
// JSON OBJECT EXTRACTOR
// ============================================================

function extractJsonObjects(
  text = ''
) {
  const objects =
    [];

  let depth =
    0;

  let start =
    -1;

  let inString =
    false;

  let escaped =
    false;

  for (
    let i = 0;
    i <
    text.length;
    i++
  ) {
    const ch =
      text[i];

    if (
      escaped
    ) {
      escaped =
        false;
      continue;
    }

    if (
      ch === '\\'
    ) {
      escaped =
        true;
      continue;
    }

    if (
      ch === '"'
    ) {
      inString =
        !inString;

      continue;
    }

    if (
      inString
    ) {
      continue;
    }

    if (
      ch === '{'
    ) {
      if (
        depth === 0
      ) {
        start =
          i;
      }

      depth++;
    }

    if (
      ch === '}'
    ) {
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
            JSON.parse(
              piece
            )
          );
        } catch (_) {}

        start =
          -1;
      }
    }
  }

  return objects;
}

// ============================================================
// SOURCE EVIDENCE
// ============================================================

function sourceEvidenceScore(
  question,
  options,
  source
) {
  const sourceText =
    normalizeText(
      [
        source?.title,
        source?.content,
      ].join(' ')
    );

  if (
    !sourceText
  ) {
    return 0;
  }

  const q =
    tokenSet(
      question
    );

  const o =
    tokenSet(
      Array.isArray(
        options
      )
        ? options.join(
            ' '
          )
        : ''
    );

  const s =
    tokenSet(
      sourceText
    );

  let qHits =
    0;

  let oHits =
    0;

  for (
    const token of q
  ) {
    if (
      s.has(token)
    ) {
      qHits++;
    }
  }

  for (
    const token of o
  ) {
    if (
      s.has(token)
    ) {
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
// VALIDATE QUESTION
// ============================================================

function validateQuestion(
  raw,
  allowedTypes,
  pages,
  sourceMode
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

  if (
    question.length < 5
  ) {
    return null;
  }

  let source =
    null;

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
      pages[
        raw.sourceIndex
      ];

    if (
      !source
    ) {
      return null;
    }
  }

  // ----------------------------------------------------------
  // MULTIPLE
  // ----------------------------------------------------------

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

    if (
      !raw.correctAnswers.every(
        (x) =>
          isIntegerInRange(
            x,
            0,
            raw.options.length -
              1
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
      raw.statements.length <
        2
    ) {
      return null;
    }

    if (
      !raw.statements.every(
        (item) =>
          typeof item?.text ===
            'string' &&
          typeof item?.isTrue ===
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
      raw.matchingPairs.length <
        3
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
      raw.subQuestions.length <
        3
    ) {
      return null;
    }

    if (
      !raw.subQuestions.every(
        (item) =>
          Array.isArray(
            item?.options
          ) &&
          item.options.length ===
            4 &&
          isIntegerInRange(
            item?.correct,
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
    Boolean(
      qImage
    );

  const needsImage =
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
          .filter(Boolean)
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
    !visualRequired
  ) {
    return null;
  }

  // ----------------------------------------------------------
  // SOURCE MODE
  // ----------------------------------------------------------

  let evidenceScore =
    1;

  if (
    sourceMode ===
    'source'
  ) {
    evidenceScore =
      sourceEvidenceScore(
        question,
        raw.options,
        source
      );

    if (
      evidenceScore <
      0.20
    ) {
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

    imageSource:
      raw.imageSource ||
      null,

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
// SYSTEM PROMPT
// ============================================================

function buildSystemPrompt({
  sourceMode,
  targetYear,
  allowedTypes,
  hotsLevel,
}) {
  return `
Kamu adalah AI pembuat soal profesional untuk Bimbel Gemilang.

TARGET TAHUN:
${targetYear}

LEVEL:
${hotsLevel || 'standar sampai HOTS'}

MODE:
${sourceMode}

============================================================
PRINSIP AKADEMIK
============================================================

- Akurat secara akademik.
- Sesuai mapel.
- Sesuai kelas.
- Sesuai topik.
- Sesuai kisi-kisi/arahan guru.
- Jangan membuat fakta akademik palsu.
- Jangan mengklaim soal pasti keluar.
- Jangan menyebut soal prediksi sebagai bocoran.
- Hitung ulang soal matematika/fisika/kimia.
- Pastikan hanya ada satu jawaban benar untuk multiple choice.

============================================================
MODE SOURCE
============================================================

Jika MODE = source:

Hanya ambil soal yang benar-benar terlihat dalam sumber.

Jangan membuat soal baru.

Boleh:
- membersihkan HTML,
- memperbaiki OCR yang jelas rusak,
- menentukan jawaban,
- memberikan pembahasan,
- memverifikasi jawaban.

sourceQuestionVerbatim harus true.

Jika sumber hanya membahas materi tetapi tidak memberikan
soal yang jelas, jangan keluarkan sebagai soal source.

============================================================
MODE PREDICTION
============================================================

Jika MODE = prediction:

Gunakan sumber internet sebagai evidence.

Analisis:
- pola materi,
- kompetensi,
- bentuk soal,
- HOTS,
- stimulus,
- grafik,
- tabel,
- diagram,
- gambar,
- kecenderungan soal.

Kemudian buat latihan BARU.

sourceQuestionVerbatim harus false.

============================================================
VISUAL
============================================================

Jika soal membutuhkan gambar, jangan menulis:

"perhatikan gambar"

tanpa memberikan stimulus.

Untuk visual gunakan salah satu:

1. clock
2. graph
3. needsImage
4. questionImageUrl dari asset sumber
5. optionImages dari asset sumber

Jangan mengarang URL gambar.

Jika tidak ada gambar sumber,
untuk soal prediction boleh menggunakan:

clock
atau
graph

yang dapat dibuat secara programatis.

============================================================
OUTPUT
============================================================

Output JSONL saja.

Tidak boleh markdown.

Baris pertama:

{"meta":true}

Kemudian setiap soal satu object JSON.

============================================================
MULTIPLE
============================================================

{
  "type":"multiple",
  "question":"...",
  "options":["...","...","...","..."],
  "correct":0,
  "explanation":"...",
  "answerVerification":"...",
  "analysisSummary":"...",
  "sourceIndex":0,
  "sourceTitle":"...",
  "sourceUrl":"...",
  "sourceQuestionVerbatim":false,
  "questionImageUrl":"",
  "optionImages":[],
  "optionsAreImages":false
}

correct:
0 = opsi pertama
1 = opsi kedua
2 = opsi ketiga
3 = opsi keempat

============================================================
MULTISELECT
============================================================

{
  "type":"multiselect",
  "question":"...",
  "options":["...","...","...","..."],
  "correctAnswers":[0,2],
  "explanation":"...",
  "answerVerification":"...",
  "analysisSummary":"..."
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
      "options":["...","...","...","..."],
      "correct":0
    },
    {
      "q":"...",
      "options":["...","...","...","..."],
      "correct":1
    },
    {
      "q":"...",
      "options":["...","...","...","..."],
      "correct":2
    }
  ],
  "explanation":"..."
}

============================================================
CLOCK
============================================================

{
  "clock":{
    "hour":8,
    "minute":30
  }
}

============================================================
GRAPH
============================================================

{
  "graph":{
    "points":[
      {"x":0,"y":0},
      {"x":1,"y":2},
      {"x":2,"y":4}
    ],
    "highlight":[
      {"x":1,"y":2}
    ],
    "xLabel":"x",
    "yLabel":"y"
  }
}

============================================================
ALLOWED TYPES
============================================================

${allowedTypes
  .map(
    (x) =>
      `- ${x}`
  )
  .join('\n')}
`;
}

// ============================================================
// HANDLER
// ============================================================

export default async function handler(
  req,
  res
) {
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
  // INPUT
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
    cleanText(
      topic
    );

  if (
    !cleanTopic
  ) {
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
      .CLOUDFLARE_API_TOKEN
  ) {
    return res.status(
      500
    ).json({
      success: false,
      error:
        'CLOUDFLARE_API_TOKEN belum tersedia di Vercel.',
    });
  }

  if (
    !process.env
      .CLOUDFLARE_ACCOUNT_ID
  ) {
    return res.status(
      500
    ).json({
      success: false,
      error:
        'CLOUDFLARE_ACCOUNT_ID belum tersedia di Vercel.',
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
    Array.isArray(
      types
    ) &&
    types.length
      ? types
      : [
          'multiple',
        ];

  // ----------------------------------------------------------
  // MODE
  // ----------------------------------------------------------

  const mode =
    sourceMode ===
    'prediction'
      ? 'prediction'
      : 'source';

  const year =
    cleanText(
      targetYear
    ) ||
    String(
      new Date()
        .getFullYear() +
        1
    );

  // ==========================================================
  // 1. BUILD QUERIES
  // ==========================================================

  const queries =
    buildResearchQueries({
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

      targetYear:
        year,

      sourceMode:
        mode,

      arahan:
        cleanText(
          arahan
        ),
    });

  // ==========================================================
  // 2. SEARCH PARALLEL
  // ==========================================================

  const searchResults =
    await Promise.allSettled(
      queries.map(
        (query) =>
          duckDuckGoSearch(
            query
          )
      )
    );

  const rawSources =
    [];

  const queryErrors =
    [];

  searchResults.forEach(
    (
      result,
      index
    ) => {
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
            result.reason
              ?.message ||
            'Search failed',
        });
      }
    }
  );

  // ==========================================================
  // 3. RANK
  // ==========================================================

  const context = [
    cleanTopic,
    mapel,
    kelas,
    arahan,
  ]
    .filter(Boolean)
    .join(' ');

  const rankedSources =
    rankSources(
      rawSources,
      context
    );

  // ==========================================================
  // 4. READ SOURCES PARALLEL
  // ==========================================================

  let readablePages =
    [];

  if (
    rankedSources.length
  ) {
    const pages =
      await Promise.all(
        rankedSources
          .slice(
            0,
            MAX_SOURCES
          )
          .map(
            readPage
          )
      );

    readablePages =
      pages.filter(
        (page) =>
          Boolean(
            page?.content &&
              page.content
                .length >=
                MIN_SOURCE_TEXT
          ) ||
          Boolean(
            page?.images?.length
          )
      );
  }

  // ==========================================================
  // 5. RESEARCH PACK
  // ==========================================================

  const researchPack =
    buildResearchPack(
      readablePages
    );

  // ==========================================================
  // 6. PROMPTS
  // ==========================================================

  const systemPrompt =
    buildSystemPrompt({
      sourceMode:
        mode,

      targetYear:
        year,

      allowedTypes,

      hotsLevel:
        cleanText(
          hotsLevel
        ),
    });

  const userPrompt = `
BIMBEL GEMILANG QUESTION ENGINE

MAPEL:
${cleanText(
  mapel || 'Umum'
)}

KELAS:
${cleanText(
  kelas || 'Sesuai input'
)}

TOPIK:
${cleanTopic}

TARGET TAHUN:
${year}

MODE:
${mode}

JUMLAH:
${jumlah}

TIPE:
${allowedTypes.join(
  ', '
)}

ARAHAN GURU:
${cleanText(
  arahan || ''
)}

============================================================
RESEARCH INTERNET
============================================================

${researchPack || 'Tidak ada sumber yang berhasil dibaca.'}

============================================================
TUGAS
============================================================

${
  mode ===
  'source'
    ? `
Ambil soal yang benar-benar ditemukan pada sumber.

JANGAN membuat soal baru.

Jika tidak cukup soal yang valid,
keluarkan hanya soal yang benar-benar dapat diverifikasi.
`
    : `
Gunakan sumber sebagai evidence.

Buat latihan baru yang lebih baik dan relevan
dengan kisi-kisi/topik.

Perhatikan:
- pola soal,
- kompetensi,
- HOTS,
- stimulus,
- grafik,
- tabel,
- diagram,
- visual,
- tingkat kesulitan.

Jangan mengklaim soal pasti keluar.
`
}

============================================================
QUALITY
============================================================

Kebenaran akademik lebih penting daripada jumlah.

Setiap soal harus mempunyai:
- jawaban benar,
- pembahasan,
- verifikasi,
- analisis konsep.

Untuk matematika/fisika/kimia:
hitung ulang sebelum memberikan kunci.

Jika soal visual digunakan:
stimulus harus benar-benar tersedia.

Output maksimal:
${jumlah} soal.

Output hanya JSONL.
`;

  // ==========================================================
  // 7. CALL CLOUDFLARE
  // ==========================================================

  let aiData;

  const aiStarted =
    Date.now();

  try {
    aiData =
      await callCloudflareAI({
        systemPrompt,
        userPrompt,
      });
  } catch (
    error
  ) {
    console.error(
      '[Gemilang][Cloudflare]',
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
          'Cloudflare AI timeout. Research berhasil tetapi AI tidak selesai dalam batas waktu.',

        model:
          CLOUDFLARE_MODEL,
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
          'Cloudflare API Token ditolak.',

        debug:
          error.message,

        model:
          CLOUDFLARE_MODEL,
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
          'Cloudflare AI sedang terkena rate limit atau kuota.',

        debug:
          error.message,
      });
    }

    return res.status(
      502
    ).json({
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
  // 8. EXTRACT
  // ==========================================================

  const rawText =
    extractCloudflareText(
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
        'Cloudflare tidak mengembalikan teks soal.',

      model:
        CLOUDFLARE_MODEL,

      debug:
        aiData?.result ||
        null,
    });
  }

  // ==========================================================
  // 9. PARSE
  // ==========================================================

  const objects =
    extractJsonObjects(
      rawText
    );

  if (
    objects.length ===
    0
  ) {
    return res.status(
      502
    ).json({
      success: false,

      error:
        'Output AI bukan JSON soal yang valid.',

      debug: {
        rawText:
          rawText.slice(
            0,
            2500
          ),

        length:
          rawText.length,
      },
    });
  }

  // ==========================================================
  // 10. QUALITY GATE
  // ==========================================================

  const questions =
    [];

  let rejected =
    0;

  let duplicateCount =
    0;

  for (
    const rawQuestion of
      objects
  ) {
    const question =
      validateQuestion(
        rawQuestion,

        allowedTypes,

        readablePages,

        mode
      );

    if (
      !question
    ) {
      rejected++;
      continue;
    }

    if (
      isQuestionDuplicate(
        question.question,
        questions
      )
    ) {
      duplicateCount++;
      continue;
    }

    question.researchSources =
      readablePages.map(
        (page) => ({
          title:
            page.title ||
            '',

          url:
            page.url ||
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

  // ==========================================================
  // 11. NO VALID QUESTION
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
        mode ===
        'source'
          ? 'Internet berhasil ditelusuri, tetapi tidak ada soal sumber yang lolos verifikasi.'
          : 'AI berhasil dipanggil, tetapi tidak ada soal yang lolos quality gate.',

      diagnostics: {
        queryCount:
          queries.length,

        queryErrors,

        searchResultCount:
          rawSources.length,

        rankedSourceCount:
          rankedSources.length,

        readablePageCount:
          readablePages.length,

        parsedObjectCount:
          objects.length,

        rejectedCount:
          rejected,

        duplicateCount,

        aiDurationMs:
          aiDuration,
      },

      researchSources:
        readablePages.map(
          (page) => ({
            title:
              page.title ||
              '',

            url:
              page.url ||
              '',

            relevanceScore:
              page.relevanceScore ||
              0,
          })
        ),
    });
  }

  // ==========================================================
  // 12. SUCCESS
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
      'DuckDuckGo HTML Search',

    aiProvider:
      'Cloudflare Workers AI',

    model:
      CLOUDFLARE_MODEL,

    diagnostics: {
      queryCount:
        queries.length,

      queryErrors,

      rawSearchResultCount:
        rawSources.length,

      rankedSourceCount:
        rankedSources.length,

      readablePageCount:
        readablePages.length,

      parsedObjectCount:
        objects.length,

      rejectedCount:
        rejected,

      duplicateCount,

      aiDurationMs:
        aiDuration,
    },

    researchSources:
      readablePages.map(
        (page) => ({
          title:
            page.title ||
            '',

          url:
            page.url ||
            '',

          relevanceScore:
            page.relevanceScore ||
            0,
        })
      ),
  });
}