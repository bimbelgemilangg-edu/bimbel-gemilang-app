// api/generateQuizFromTopic.js
// ============================================================
// BIMBEL GEMILANG — PROFESSIONAL QUESTION RESEARCH ENGINE v3
// ============================================================
//
// TUJUAN:
// - Internet selalu menjadi sumber riset.
// - Jina Search mencari sumber publik.
// - Sumber diranking TANPA AI terlebih dahulu.
// - Duplikat sumber dibuang TANPA AI.
// - Halaman sumber dibaca untuk memperoleh isi + gambar.
// - Cloudflare Workers AI menjadi AI utama.
// - Maksimal SATU panggilan AI untuk SATU batch.
// - SOURCE MODE:
//      mengambil soal yang benar-benar ditemukan di internet.
// - PREDICTION MODE:
//      menganalisis pola sumber lalu membuat latihan baru.
// - Jawaban, verifikasi, analisis, dan pembahasan wajib.
// - Visual soal dan opsi gambar didukung.
// - Soal yang kembar dalam hasil AI tidak dimasukkan.
// - Struktur respons dibuat kompatibel dengan ManageQuiz.
//
// CATATAN ARSITEKTUR:
// Tahap ini BELUM menjadi Research Planner / Blueprint Engine penuh.
// Tahap ini adalah "research-backed question collector".
//
// ENV YANG DIBUTUHKAN:
// JINA_API_KEY
// CLOUDFLARE_API_TOKEN
// CLOUDFLARE_ACCOUNT_ID
//
// MODEL:
// @cf/zai-org/glm-4.7-flash
//
// ============================================================

const CLOUDFLARE_MODEL =
  process.env.CLOUDFLARE_MODEL ||
  '@cf/zai-org/glm-4.7-flash';

const MAX_BATCH_QUESTIONS = 10;

const JINA_TIMEOUT_MS = 10000;
const PAGE_TIMEOUT_MS = 18000;
const CLOUDFLARE_TIMEOUT_MS = 35000;

const MAX_RESULTS_PER_QUERY = 10;
const MAX_UNIQUE_SOURCES = 8;

const MAX_SOURCE_CHARS = 7000;
const MAX_RESEARCH_PACK_CHARS = 28000;

const MIN_SOURCE_TEXT = 120;

// ============================================================
// BASIC HELPERS
// ============================================================

const sleep = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );

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

const tokenSet = (value = '') => {
  const tokens =
    normalizeText(value)
      .split(' ')
      .filter(
        (token) =>
          token.length >= 2
      );

  return new Set(tokens);
};

const jaccardSimilarity = (
  a,
  b
) => {
  const setA =
    typeof a === 'string'
      ? tokenSet(a)
      : a;

  const setB =
    typeof b === 'string'
      ? tokenSet(b)
      : b;

  if (
    !setA.size ||
    !setB.size
  ) {
    return 0;
  }

  let intersection = 0;

  for (
    const item of setA
  ) {
    if (
      setB.has(item)
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

const fetchWithTimeout = async (
  url,
  options = {},
  timeoutMs = 30000
) => {
  const controller =
    new AbortController();

  const timer = setTimeout(
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

const escapeXml = (
  value = ''
) =>
  String(value)
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&apos;'
    );

// ============================================================
// QUESTION DUPLICATE CHECK
// ============================================================

function isQuestionDuplicate(
  questionText,
  existingQuestions
) {
  const fingerprint =
    fingerprintText(
      questionText
    );

  for (
    const existing of
      existingQuestions
  ) {
    const existingFingerprint =
      fingerprintText(
        existing.question
      );

    // Exact / normalized duplicate.
    if (
      fingerprint &&
      existingFingerprint ===
        fingerprint
    ) {
      return true;
    }

    // Semantic-ish local similarity.
    // Tidak memakai AI sehingga tidak memakan kuota.
    const similarity =
      jaccardSimilarity(
        fingerprint,
        existingFingerprint
      );

    if (
      similarity >= 0.88
    ) {
      return true;
    }
  }

  return false;
}

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

    'look at the picture',
    'look at the image',
    'look at the graph',
    'look at the diagram',
    'look at the table',

    'based on the picture',
    'based on the image',
    'based on the graph',
    'based on the diagram',
    'based on the table',
  ];

  return cues.some(
    (cue) =>
      value.includes(
        normalizeText(cue)
      )
  );
};

// ============================================================
// LOCAL CLOCK SVG
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

  const size = 280;
  const cx = 140;
  const cy = 140;
  const radius = 112;

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
      radius * 0.52
    );

  const minuteTip =
    toXY(
      minute * 6,
      radius * 0.78
    );

  const ticks =
    Array.from(
      {
        length: 60,
      },
      (_, index) => {
        const major =
          index % 5 === 0;

        const outer =
          toXY(
            index * 6,
            radius
          );

        const inner =
          toXY(
            index * 6,
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
      (_, index) => {
        const number =
          index === 0
            ? 12
            : index;

        const pos =
          toXY(
            index * 30,
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
x2="${hourTip.x.toFixed(2)}"
y2="${hourTip.y.toFixed(2)}"
stroke="#1e293b"
stroke-width="6"
stroke-linecap="round"
/>

<line
x1="140"
y1="140"
x2="${minuteTip.x.toFixed(2)}"
y2="${minuteTip.y.toFixed(2)}"
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
// LOCAL GRAPH SVG
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
        (point) =>
          isFiniteNumber(
            point?.x
          ) &&
          isFiniteNumber(
            point?.y
          )
      )
      .slice(
        0,
        100
      );

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
      (point) =>
        point.x
    );

  const ys =
    points.map(
      (point) =>
        point.y
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
    (value) =>
      pad +
      ((value - minX) /
        Math.max(
          maxX - minX,
          1
        )) *
        (W - pad * 2);

  const mapY =
    (value) =>
      H -
      pad -
      ((value - minY) /
        Math.max(
          maxY - minY,
          1
        )) *
        (H - pad * 2);

  const path =
    points
      .map(
        (
          point,
          index
        ) =>
          `${
            index === 0
              ? 'M'
              : 'L'
          } ${mapX(
            point.x
          ).toFixed(1)} ${mapY(
            point.y
          ).toFixed(1)}`
      )
      .join(' ');

  const highlights =
    Array.isArray(
      graph.highlight
    )
      ? graph.highlight
          .filter(
            (point) =>
              isFiniteNumber(
                point?.x
              ) &&
              isFiniteNumber(
                point?.y
              )
          )
          .map(
            (point) =>
              `<circle
cx="${mapX(
                point.x
              ).toFixed(1)}"
cy="${mapY(
                point.y
              ).toFixed(1)}"
r="6"
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
stroke-width="1.5"
/>

<line
x1="${pad}"
y1="${pad}"
x2="${pad}"
y2="${H - pad}"
stroke="#64748b"
stroke-width="1.5"
/>

<path
d="${path}"
fill="none"
stroke="#1e293b"
stroke-width="3"
stroke-linecap="round"
stroke-linejoin="round"
/>

${highlights}

<text
x="${W - pad}"
y="${H - 15}"
text-anchor="end"
font-family="Arial"
font-size="16"
fill="#334155"
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
fill="#334155"
>
${escapeXml(
  graph.yLabel ||
    'y'
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
            'BimbelGemilangResearch/3.0',
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
            ),
        })
      )
      .filter(
        (item) =>
          item.title ||
          item.url ||
          item.content
      );
  } catch (_) {
    // Kalau gateway memberi teks biasa.
    if (
      raw.trim()
    ) {
      return [
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
      ];
    }

    return [];
  }
}

// ============================================================
// QUERY BUILDER
// ============================================================

function buildResearchQueries({
  topic,
  mapel,
  kelas,
  targetYear,
  sourceMode,
  arahan,
}) {
  const clean =
    (value) =>
      String(
        value || ''
      )
        .replace(
          /\s+/g,
          ' '
        )
        .trim();

  const t =
    clean(topic);

  const m =
    clean(mapel);

  const k =
    clean(kelas);

  const y =
    clean(targetYear);

  const a =
    clean(arahan);

  if (
    sourceMode ===
    'prediction'
  ) {
    return [
      clean(
        `${t} ${m} ${k} TKA contoh soal`
      ),

      clean(
        `${t} ${m} ${k} soal HOTS`
      ),

      clean(
        `${t} ${m} ${k} latihan soal tahun sebelumnya`
      ),

      clean(
        `${t} ${m} ${k} ${y} soal prediksi ${a}`
      ),
    ];
  }

  return [
    clean(
      `${t} ${m} ${k} soal`
    ),

    clean(
      `${t} ${m} ${k} contoh soal`
    ),

    clean(
      `${t} ${m} ${k} latihan TKA`
    ),

    clean(
      `${t} ${m} ${k} bank soal`
    ),
  ];
}

// ============================================================
// SOURCE DEDUP + RANKING
// ============================================================

function dedupeAndRankSources(
  sources,
  searchContext
) {
  const seenUrls =
    new Set();

  const unique =
    [];

  for (
    const source of
      sources
  ) {
    const url =
      cleanText(
        source?.url ||
          ''
      );

    const title =
      cleanText(
        source?.title ||
          ''
      );

    if (
      !url &&
      !title
    ) {
      continue;
    }

    const key =
      url ||
      normalizeText(
        title
      );

    if (
      seenUrls.has(
        key
      )
    ) {
      continue;
    }

    seenUrls.add(
      key
    );

    const titleScore =
      jaccardSimilarity(
        searchContext,
        title
      );

    const contentScore =
      jaccardSimilarity(
        searchContext,
        source.content ||
          ''
      );

    const sourceScore =
      titleScore * 0.55 +
      contentScore * 0.45;

    unique.push({
      ...source,

      relevanceScore:
        Number(
          sourceScore.toFixed(
            4
          )
        ),
    });
  }

  return unique
    .sort(
      (a, b) =>
        b.relevanceScore -
        a.relevanceScore
    )
    .slice(
      0,
      MAX_UNIQUE_SOURCES
    );
}

// ============================================================
// READ SOURCE PAGE
// ============================================================

async function readSourcePage(
  source
) {
  if (
    !source?.url
  ) {
    return source;
  }

  // ==========================================================
  // PRIORITASKAN CONTENT DARI JINA
  // ==========================================================
  // Jina Search sudah memberikan content/snippet.
  // Jangan membuka URL lagi kalau content cukup.
  // Ini menghemat waktu dan request HTTP.
  // ==========================================================

  if (
    typeof source.content === 'string' &&
    source.content.trim().length >= 500
  ) {
    return {
      ...source,

      content: cleanText(
        source.content
      ).slice(
        0,
        MAX_SOURCE_CHARS
      ),

      images: Array.isArray(
        source.images
      )
        ? source.images
        : [],
    };
  }

  // ==========================================================
  // FALLBACK: BACA HALAMAN SUMBER
  // HANYA KALAU CONTENT JINA TERLALU PENDEK
  // ==========================================================

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
        8000
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

    const pageTitle =
      titleMatch
        ? cleanText(
            titleMatch[1]
          )
        : source.title;

    const content =
      cleanText(
        html
          .replace(
            /<noscript[\s\S]*?<\/noscript>/gi,
            ' '
          )
          .replace(
            /<script[\s\S]*?<\/script>/gi,
            ' '
          )
          .replace(
            /<style[\s\S]*?<\/style>/gi,
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

    const images =
      [];

    const imageRegex =
      /<img\b[^>]*>/gi;

    let match;

    while (
      (match =
        imageRegex.exec(
          html
        )) &&
      images.length <
        25
    ) {
      const tag =
        match[0];

      const srcMatch =
        tag.match(
          /(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["']/i
        );

      if (!srcMatch) {
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

      title:
        pageTitle ||
        source.title,

      content,

      images:
        images.filter(
          (
            item,
            index,
            array
          ) =>
            index ===
            array.findIndex(
              (x) =>
                x.url ===
                item.url
            )
        ),
    };
  } catch (_) {
    return source;
  }
}

// ============================================================
// BUILD RESEARCH PACK
// ============================================================

function buildResearchPack(
  pages
) {
  let pack =
    '';

  for (
    let index = 0;
    index <
    pages.length;
    index +=
      1
  ) {
    const page =
      pages[index];

    const images =
      Array.isArray(
        page.images
      )
        ? page.images
        : [];

    const imageList =
      images
        .slice(
          0,
          12
        )
        .map(
          (
            image,
            imageIndex
          ) =>
            `[IMAGE ${imageIndex}] ${image.url} | ALT: ${
              image.alt ||
              ''
            }`
        )
        .join(
          '\n'
        );

    const block = `
SOURCE_INDEX: ${index}

TITLE:
${page.title || ''}

URL:
${page.url || ''}

RELEVANCE_SCORE:
${page.relevanceScore || 0}

CONTENT:
${
  (
    page.content ||
    ''
  ).slice(
    0,
    MAX_SOURCE_CHARS
  )
}

IMAGE_ASSETS:
${imageList}

--------------------------------------------------
`;

    if (
      (
        pack +
        block
      ).length >
      MAX_RESEARCH_PACK_CHARS
    ) {
      break;
    }

    pack +=
      block;
  }

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
      'CLOUDFLARE_API_TOKEN belum tersedia di Vercel.'
    );
  }

  if (!accountId) {
    throw new Error(
      'CLOUDFLARE_ACCOUNT_ID belum tersedia di Vercel.'
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

  let data =
    null;

  try {
    data =
      JSON.parse(
        raw
      );
  } catch (_) {
    data =
      null;
  }

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

    error.raw =
      data || raw;

    throw error;
  }

  return data;
}

// ============================================================
// EXTRACT CLOUDFLARE TEXT
// ============================================================

function extractCloudflareText(
  data
) {
  const result =
    data?.result ||
    {};

  if (
    typeof result ===
    'string'
  ) {
    return result;
  }

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

  const choices =
    Array.isArray(
      result.choices
    )
      ? result.choices
      : [];

  const text =
    choices
      .map(
        (choice) => {
          const content =
            choice?.message
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
      .join(
        '\n'
      );

  if (
    text.trim()
  ) {
    return text;
  }

  // Fallback beberapa bentuk hasil model.
  if (
    typeof result.output_text ===
    'string'
  ) {
    return result.output_text;
  }

  return '';
}

// ============================================================
// JSON EXTRACTOR
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
    let index = 0;
    index <
    text.length;
    index +=
      1
  ) {
    const ch =
      text[index];

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
        depth ===
        0
      ) {
        start =
          index;
      }

      depth += 1;
    }

    if (
      ch === '}'
    ) {
      depth -= 1;

      if (
        depth === 0 &&
        start !== -1
      ) {
        try {
          objects.push(
            JSON.parse(
              text.slice(
                start,
                index + 1
              )
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
// SOURCE TEXT EVIDENCE CHECK
// ============================================================

function sourceEvidenceScore(
  question,
  options,
  source
) {
  if (
    !source
  ) {
    return 0;
  }

  const sourceText =
    normalizeText(
      [
        source.title,
        source.content,
      ].join(' ')
    );

  if (
    !sourceText
  ) {
    return 0;
  }

  const questionTokens =
    tokenSet(
      question
    );

  const optionTokens =
    tokenSet(
      Array.isArray(
        options
      )
        ? options.join(
            ' '
          )
        : ''
    );

  const sourceTokens =
    tokenSet(
      sourceText
    );

  let qOverlap =
    0;

  for (
    const token of
      questionTokens
  ) {
    if (
      sourceTokens.has(
        token
      )
    ) {
      qOverlap +=
        1;
    }
  }

  let optionOverlap =
    0;

  for (
    const token of
      optionTokens
  ) {
    if (
      sourceTokens.has(
        token
      )
    ) {
      optionOverlap +=
        1;
    }
  }

  const questionCoverage =
    questionTokens.size
      ? qOverlap /
        questionTokens.size
      : 0;

  const optionCoverage =
    optionTokens.size
      ? optionOverlap /
        optionTokens.size
      : 0;

  return (
    questionCoverage *
      0.75 +
    optionCoverage *
      0.25
  );
}

// ============================================================
// QUESTION VALIDATOR
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

  if (!question) {
    return null;
  }

  // ----------------------------------------------------------
  // SOURCE
  // ----------------------------------------------------------

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
        (answer) =>
          isIntegerInRange(
            answer,
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
        (statement) =>
          typeof statement?.text ===
            'string' &&
          typeof statement?.isTrue ===
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
    'shortanswer' &&
    !cleanText(
      raw.shortAnswer
    )
  ) {
    return null;
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
        (subQuestion) =>
          Array.isArray(
            subQuestion?.options
          ) &&
          subQuestion.options.length ===
            4 &&
          isIntegerInRange(
            subQuestion?.correct,
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

  // Clock.
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

  // Graph.
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

  // Jangan izinkan kalimat visual tanpa
  // stimulus visual.
  if (
    hasVisualCue(
      question
    ) &&
    !visualRequired &&
    !needsImage
  ) {
    return null;
  }

  // ----------------------------------------------------------
  // SOURCE MODE EVIDENCE
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

    // Kita TOLAK jika bukti terlalu lemah.
    // Ambang ini sengaja tidak terlalu tinggi karena
    // source content dapat mengandung OCR/formatting berbeda.
    if (
      evidenceScore <
      0.28
    ) {
      return null;
    }
  }

  // ----------------------------------------------------------
  // RETURN NORMALIZED QUESTION
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

    sourceMode:
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
  const sourceModeText =
    sourceMode ===
    'source'
      ? `
MODE = SOURCE

Kamu harus mengambil soal yang benar-benar tersedia
pada sumber yang diberikan.

JANGAN:
- membuat soal baru,
- mengganti konteks utama,
- mengarang pilihan,
- mengarang URL,
- mengarang gambar.

BOLEH:
- memperbaiki format,
- membersihkan HTML,
- memperjelas OCR yang rusak jika maksudnya tetap sama,
- menentukan jawaban benar,
- melakukan verifikasi,
- membuat pembahasan.

Jika soal pada sumber tidak cukup jelas untuk diverifikasi,
JANGAN keluarkan soal tersebut.
`
      : `
MODE = PREDICTION

Sumber web adalah evidence untuk menemukan:
- pola topik,
- kompetensi,
- frekuensi,
- HOTS,
- stimulus,
- visual,
- bentuk soal,
- tren waktu.

Kemudian buat soal LATIHAN BARU berdasarkan evidence tersebut.

JANGAN menyebut hasil sebagai bocoran.
JANGAN mengklaim soal pasti keluar.
`;

  return `
Kamu adalah AI akademik profesional untuk Bimbel Gemilang.

${sourceModeText}

TARGET TAHUN:
${targetYear}

LEVEL HOTS:
${hotsLevel || 'standar'}

ATURAN UTAMA:

1. Mapel harus sesuai.
2. Kelas harus sesuai.
3. Topik harus sesuai.
4. Kunci jawaban harus benar.
5. Pembahasan harus detail tetapi mudah dipahami.
6. answerVerification wajib menjelaskan alasan kunci.
7. analysisSummary wajib menjelaskan konsep/kompetensi.
8. Untuk matematika, fisika, dan kimia, hitung ulang.
9. Jika sumber dan kunci bertentangan dengan logika,
   prioritaskan kebenaran akademik dan tandai pada verification.
10. Jangan membuat URL sumber palsu.
11. Jangan membuat gambar palsu yang diklaim sebagai gambar sumber.
12. Jika soal menyebut gambar/grafik/tabel, stimulus wajib tersedia.
13. Jika opsi berupa gambar, gunakan asset yang tersedia.
14. Jangan output markdown.
15. Jangan output code fence.
16. Output JSONL saja.

OUTPUT BARIS PERTAMA:
{"meta":true}

============================================================
MULTIPLE
============================================================

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

correct:
0 = opsi pertama
1 = opsi kedua
2 = opsi ketiga
3 = opsi keempat

JANGAN menggunakan:
"A"
"B"
"C"
"D"

sebagai nilai correct.

============================================================
MULTISELECT
============================================================

{
  "type":"multiselect",
  "question":"...",
  "options":["A","B","C","D"],
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

============================================================
VISUAL
============================================================

CLOCK:

"clock":{
  "hour":8,
  "minute":30
}

GRAPH:

"graph":{
  "points":[
    {"x":0,"y":0},
    {"x":1,"y":2}
  ],
  "highlight":[
    {"x":1,"y":2}
  ],
  "xLabel":"x",
  "yLabel":"y"
}

PHOTO:

"needsImage":true,
"imageHint":"english search phrase"

OPTION IMAGES:

"optionImages":[
  "https://...",
  "https://...",
  "https://...",
  "https://..."
],
"optionsAreImages":true

ALLOWED QUESTION TYPES:

${allowedTypes
  .map(
    (type) =>
      `- ${type}`
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
  if (
    req.method !==
    'POST'
  ) {
    return res.status(
      405
    ).json({
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

    // Compatibility with old frontend.
    useTrendSearch,

    targetYear,

    hotsLevel,
  } =
    req.body || {};

  // ----------------------------------------------------------
  // BASIC INPUT
  // ----------------------------------------------------------

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
    !process.env.JINA_API_KEY
  ) {
    return res.status(
      500
    ).json({
      success: false,
      error:
        'JINA_API_KEY belum tersedia di Vercel.',
    });
  }

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
    targetYear ||
    String(
      new Date().getFullYear() +
        1
    );

  // useTrendSearch hanya untuk kompatibilitas
  // frontend lama. Sistem ini tetap melakukan research.
  const researchEnabled =
    mode === 'source' ||
    mode === 'prediction' ||
    Boolean(
      useTrendSearch
    );

  if (
    !researchEnabled
  ) {
    return res.status(
      400
    ).json({
      success: false,
      error:
        'Research internet wajib aktif pada Question Research Engine Gemilang.',
    });
  }

  // ==========================================================
  // 1. SEARCH INTERNET
  // ==========================================================

  const queries =
    buildResearchQueries({
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

  const rawSources =
    [];

  const queryErrors =
    [];

  const searchOutcomes =
    await Promise.allSettled(
      queries.map(
        (query) =>
          jinaSearch(
            query
          )
      )
    );

  searchOutcomes.forEach(
    (outcome, index) => {
      const query =
        queries[index];

      if (
        outcome.status ===
        'fulfilled'
      ) {
        rawSources.push(
          ...outcome.value
        );
      } else {
        console.error(
          '[Gemilang][Search]',
          query,
          outcome.reason?.message
        );

        queryErrors.push({
          query,

          error:
            outcome.reason
              ?.message ||
            String(
              outcome.reason
            ),
        });
      }
    }
  );

  // ----------------------------------------------------------
  // RANK SOURCE TANPA AI
  // ----------------------------------------------------------

  const searchContext =
    [
      cleanTopic,
      mapel,
      kelas,
      arahan,
    ]
      .filter(Boolean)
      .join(' ');

  const rankedSources =
    dedupeAndRankSources(
      rawSources,
      searchContext
    );

  if (
    rankedSources.length ===
    0
  ) {
    return res.status(
      502
    ).json({
      success: false,

      error:
        'Sistem tidak mendapatkan sumber internet yang relevan.',

      debug: {
        queryCount:
          queries.length,

        queryErrors,
      },

      provider:
        'Jina Search',
    });
  }

  // ==========================================================
  // 2. READ SOURCES (PARALLEL)
  // ==========================================================

  const selectedSources =
    rankedSources.slice(
      0,
      MAX_UNIQUE_SOURCES
    );

  const fetchedPages =
    await Promise.all(
      selectedSources.map(
        (source) =>
          readSourcePage(
            source
          )
      )
    );

  const readablePages =
    fetchedPages.filter(
      (page) => {
        const readable =
          Boolean(
            page?.content &&
              page.content
                .length >=
                MIN_SOURCE_TEXT
          );

        const visualOnly =
          Boolean(
            Array.isArray(
              page?.images
            ) &&
              page.images
                .length > 0
          );

        return (
          readable ||
          visualOnly
        );
      }
    );

  if (
    readablePages.length ===
    0
  ) {
    return res.status(
      502
    ).json({
      success: false,

      error:
        'Sumber internet ditemukan, tetapi tidak ada halaman yang dapat dibaca.',

      researchSources:
        rankedSources.map(
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
  // 3. RESEARCH PACK
  // ==========================================================

  const researchPack =
    buildResearchPack(
      readablePages
    );

  if (
    !researchPack.trim()
  ) {
    return res.status(
      502
    ).json({
      success: false,

      error:
        'Research pack kosong setelah membaca sumber.',
    });
  }

  // ==========================================================
  // 4. SYSTEM PROMPT
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

  // ==========================================================
  // 5. USER PROMPT
  // ==========================================================

  const userPrompt = `
BIMBEL GEMILANG
PROFESSIONAL QUESTION RESEARCH TASK

============================================================
INPUT
============================================================

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

JUMLAH YANG DIMINTA:
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
RESEARCH PACK
============================================================

${researchPack}

============================================================
INSTRUKSI MODE SOURCE
============================================================

${
  mode ===
  'source'
    ? `
Pilih hingga ${jumlah} soal yang benar-benar dapat
ditelusuri pada sumber.

Jangan mengarang soal.

Untuk setiap soal:
- sourceIndex harus menunjuk SOURCE_INDEX yang benar.
- sourceTitle harus sesuai sumber.
- sourceUrl harus sesuai sumber.
- sourceQuestionVerbatim = true.
- jawaban harus diverifikasi.
- pembahasan harus diberikan.
- gambar hanya digunakan kalau sumber memang memiliki
  stimulus gambar.
- pilihan gambar hanya digunakan jika asset gambar sumber
  tersedia.

Jika sumber hanya menyebut topik tetapi tidak memuat soal,
JANGAN perlakukan sebagai source question.
`
    : `
============================================================
INSTRUKSI MODE PREDICTION
============================================================

Analisis seluruh sumber.

Cari:
- topik yang berulang,
- kompetensi,
- bentuk soal,
- level HOTS,
- jenis stimulus,
- visual,
- pola pilihan jawaban,
- tren waktu.

Setelah itu buat latihan baru.

Soal prediksi harus:
- punya hubungan jelas dengan evidence,
- relevan dengan target tahun,
- tidak diklaim sebagai bocoran,
- tidak diklaim pasti keluar.

sourceQuestionVerbatim harus false.
sourceIndex/sourceUrl dipakai untuk menunjukkan evidence utama.
`
}

============================================================
QUALITY PRIORITY
============================================================

Prioritas:
1. kebenaran akademik
2. relevansi topik
3. relevansi jenjang
4. evidence sumber
5. kualitas visual
6. pembahasan
7. baru jumlah soal

Jika tidak cukup soal yang valid,
jangan mengarang demi memenuhi jumlah.
`;

  // ==========================================================
  // 6. CLOUDFLARE AI
  // ==========================================================

  let aiData;

  try {
    aiData =
      await callCloudflareAI({
        systemPrompt,

        userPrompt,
      });
  } catch (
    error
  ) {
    const status =
      error?.status;

    const message =
      String(
        error?.message ||
          ''
      );

    console.error(
      '[Gemilang][Cloudflare]',
      message
    );

    if (
      status === 401 ||
      status === 403
    ) {
      return res
        .status(502)
        .json({
          success: false,

          error:
            'Cloudflare API Token ditolak atau model tidak dapat diakses akun ini.',

          debug:
            message,
        });
    }

    if (
      status === 429
    ) {
      return res
        .status(429)
        .json({
          success: false,

          error:
            'Kuota harian Cloudflare Workers AI sedang mencapai batas.',

          debug:
            message,
        });
    }

    if (
      status === 408
    ) {
      return res
        .status(504)
        .json({
          success: false,

          error:
            'Cloudflare AI timeout.',

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
  // 7. EXTRACT AI TEXT
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
        'Cloudflare AI tidak mengembalikan teks soal.',

      debug: {
        model:
          CLOUDFLARE_MODEL,

        result:
          aiData?.result ||
          null,
      },
    });
  }

  // ==========================================================
  // 8. PARSE JSONL
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
        'Output Cloudflare AI tidak mengandung JSON soal yang valid.',

      debug: {
        rawTextSample:
          rawText.slice(
            0,
            2000
          ),

        rawTextLength:
          rawText.length,
      },
    });
  }

  // ==========================================================
  // 9. QUALITY GATE + DUPLICATE GATE
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
      rejected +=
        1;

      continue;
    }

    if (
      isQuestionDuplicate(
        question.question,

        questions
      )
    ) {
      duplicateCount +=
        1;

      continue;
    }

    // --------------------------------------------------------
    // SOURCE METADATA
    // --------------------------------------------------------

    question.researchBacked =
      true;

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

    // --------------------------------------------------------
    // ADD
    // --------------------------------------------------------

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
  // 10. FAILED QUALITY GATE
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
          'Sumber internet berhasil ditemukan, tetapi tidak ada soal yang lolos quality gate.',

        debug: {
          model:
            CLOUDFLARE_MODEL,

          sourceCount:
            readablePages.length,

          parsedObjectCount:
            objects.length,

          rejectedCount:
            rejected,

          duplicateCount,

          rawTextSample:
            rawText.slice(
              0,
              2000
            ),
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
            })
          ),
      });
  }

  // ==========================================================
  // 11. RESPONSE
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
        jumlah,

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