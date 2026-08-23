// api/generateQuizFromTopic.js
// ============================================================
// BIMBEL GEMILANG — PROFESSIONAL QUESTION RESEARCH ENGINE v2
// ============================================================
// FLOW:
// 1. Cari sumber soal di internet menggunakan Jina Search.
// 2. Baca sumber yang ditemukan.
// 3. Cloudflare Workers AI menjadi AI utama.
// 4. SOURCE MODE:
//      ambil soal yang benar-benar ditemukan di internet.
// 5. PREDICTION MODE:
//      analisis tren sumber -> susun latihan baru.
// 6. Jawaban + verifikasi + pembahasan wajib.
// 7. Visual clock / graph dapat dibuat lokal.
// 8. Source URL + source metadata ikut disimpan.
// 9. Dedup dilakukan sebelum hasil masuk ManageQuiz.
// 10. Endpoint kompatibel dengan AIGenerateQuiz lama.
// ============================================================

const CLOUDFLARE_MODEL =
  process.env.CLOUDFLARE_MODEL ||
  '@cf/zai-org/glm-4.7-flash';

const MAX_BATCH_QUESTIONS = 20;

const JINA_TIMEOUT_MS = 30000;
const PAGE_TIMEOUT_MS = 18000;
const CLOUDFLARE_TIMEOUT_MS = 70000;

const MAX_SEARCH_RESULTS_PER_QUERY = 10;
const MAX_UNIQUE_SOURCES = 20;
const MAX_SOURCE_CHARS = 9000;
const MAX_RESEARCH_PACK_CHARS = 65000;

// ============================================================
// HELPERS
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
// LOCAL CLOCK IMAGE
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
    const radians =
      ((angle - 90) *
        Math.PI) /
      180;

    return {
      x:
        cx +
        length *
          Math.cos(
            radians
          ),

      y:
        cy +
        length *
          Math.sin(
            radians
          ),
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
// LOCAL GRAPH IMAGE
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

  const mapX = (
    value
  ) =>
    pad +
    ((value - minX) /
      Math.max(
        maxX - minX,
        1
      )) *
      (W - pad * 2);

  const mapY = (
    value
  ) =>
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
            'BimbelGemilangResearch/2.0',
        },
      },
      JINA_TIMEOUT_MS
    );

  const raw =
    await response.text();

  if (!response.ok) {
    let message =
      raw;

    try {
      const parsed =
        JSON.parse(raw);

      message =
        parsed?.message ||
        parsed?.readableMessage ||
        parsed?.error?.message ||
        raw;
    } catch (_) {}

    throw new Error(
      `JINA_HTTP_${response.status}: ${message}`
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

    if (
      items.length
    ) {
      return items
        .slice(
          0,
          MAX_SEARCH_RESULTS_PER_QUERY
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
    }
  } catch (_) {}

  if (
    !raw.trim()
  ) {
    return [];
  }

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

// ============================================================
// SEARCH QUERY BUILDER
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

  const s =
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
        `${t} ${s} ${k} TKA contoh soal`
      ),

      clean(
        `${t} ${s} ${k} soal HOTS`
      ),

      clean(
        `${t} ${s} ${k} soal tahun sebelumnya`
      ),

      clean(
        `${t} ${s} TKA ${y} latihan ${a}`
      ),
    ];
  }

  return [
    clean(
      `${t} ${s} ${k} soal`
    ),

    clean(
      `${t} ${s} ${k} contoh soal`
    ),

    clean(
      `${t} ${s} ${k} latihan TKA`
    ),

    clean(
      `${t} ${s} ${k} bank soal`
    ),
  ];
}

// ============================================================
// SOURCE DEDUP
// ============================================================

function dedupeSources(
  results = []
) {
  const seen =
    new Set();

  return results
    .filter(
      (item) => {
        const key =
          cleanText(
            item?.url ||
              item?.title ||
              ''
          );

        if (!key) {
          return false;
        }

        if (
          seen.has(
            key
          )
        ) {
          return false;
        }

        seen.add(
          key
        );

        return true;
      }
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
            /<svg[\s\S]*?<\/svg>/gi,
            ' '
          )
          .replace(
            /<style[\s\S]*?<\/style>/gi,
            ' '
          )
          .replace(
            /<script[\s\S]*?<\/script>/gi,
            ' '
          )
          .replace(
            /<[^>]+>/g,
            ' '
          )
      ).slice(
        0,
        18000
      );

    const images =
      [];

    const imageRegex =
      /<img\b[^>]*>/gi;

    let imageMatch;

    while (
      (imageMatch =
        imageRegex.exec(
          html
        )) &&
      images.length <
        25
    ) {
      const tag =
        imageMatch[0];

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

      if (!imageUrl) {
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
  sources
) {
  let pack =
    '';

  for (
    let index = 0;
    index <
      sources.length;
    index += 1
  ) {
    const source =
      sources[index];

    const imageList =
      Array.isArray(
        source.images
      )
        ? source.images
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
            )
        : '';

    const chunk = `
SOURCE_INDEX: ${index}

TITLE:
${
  source.title ||
  ''
}

URL:
${
  source.url ||
  ''
}

CONTENT:
${
  (
    source.content ||
    ''
  ).slice(
    0,
    MAX_SOURCE_CHARS
  )
}

IMAGE_ASSETS:
${imageList}

--------------------
`;

    if (
      (
        pack +
        chunk
      ).length >
      MAX_RESEARCH_PACK_CHARS
    ) {
      break;
    }

    pack +=
      chunk;
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
    data ||
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
      (
        choice
      ) => {
        if (
          typeof choice
            ?.message
            ?.content ===
          'string'
        ) {
          return choice
            .message
            .content;
        }

        if (
          Array.isArray(
            choice
              ?.message
              ?.content
          )
        ) {
          return choice.message
            .content
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
}

// ============================================================
// JSON EXTRACTION
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
    index += 1
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
// QUESTION VALIDATION
// ============================================================

function validateQuestion(
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
      raw.question ||
        ''
    );

  if (!question) {
    return null;
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
  // TRUE/FALSE
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

  let imageHint =
    cleanText(
      raw.imageHint ||
        raw.image_keyword ||
        ''
    );

  // CLOCK

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

  // GRAPH

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

  // OPTION IMAGES

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

  // Visual cue without image = reject.

  if (
    hasVisualCue(
      question
    ) &&
    !visualRequired &&
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
      raw.sourceMode ||
      'source',

    sourceIndex:
      Number.isInteger(
        raw.sourceIndex
      )
        ? raw.sourceIndex
        : null,

    sourceTitle:
      cleanText(
        raw.sourceTitle ||
          ''
      ),

    sourceUrl:
      cleanText(
        raw.sourceUrl ||
          ''
      ),

    sourceQuestionVerbatim:
      Boolean(
        raw.sourceQuestionVerbatim
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
  const sourceInstruction =
    sourceMode ===
    'source'
      ? `
MODE SOURCE — AMBIL SOAL INTERNET

Gunakan sumber web yang diberikan.

ATURAN:
- Pertanyaan harus benar-benar ada pada sumber.
- Jangan mengarang pertanyaan sumber.
- Jangan mengarang opsi sumber.
- Jangan mengarang URL.
- Jangan mengarang gambar.
- Jika jawaban pada sumber tidak jelas,
  verifikasi sendiri secara logis.
- Jika tidak dapat diverifikasi,
  jangan keluarkan soal tersebut.
- Soal yang sama dari banyak sumber boleh
  dipakai sebagai data frekuensi, tetapi
  jangan keluarkan soal identik berkali-kali.
`
      : `
MODE PREDICTION — PREDIKSI BERBASIS TREN INTERNET

Gunakan semua sumber sebagai evidence.

Analisis:
- topik yang berulang,
- kompetensi,
- tipe stimulus,
- HOTS,
- pola visual,
- bentuk pertanyaan,
- relevansi target tahun.

Kemudian buat soal latihan BARU.

Jangan menyebutnya bocoran.
Jangan menjamin soal akan keluar.
`;

  return `
Kamu adalah AI akademik profesional Bimbel Gemilang.

${sourceInstruction}

TARGET TAHUN:
${targetYear}

LEVEL HOTS:
${hotsLevel || 'standar'}

ATURAN WAJIB:

1. Soal harus sesuai mapel, kelas, dan topik.

2. Kunci jawaban harus benar.

3. Pembahasan harus detail.

4. answerVerification harus menjelaskan
   bagaimana jawaban diperoleh.

5. analysisSummary harus menjelaskan konsep
   atau kompetensi yang diuji.

6. Untuk matematika/fisika/kimia,
   periksa kembali perhitungan.

7. Jika soal visual, visual harus relevan.

8. Jika opsi berbentuk gambar,
   optionImages harus berasal dari source asset
   yang tersedia.

9. Jangan membuat URL palsu.

10. Jangan output markdown.

11. Jangan output code fence.

12. Output hanya JSONL.

SCHEMA MULTIPLE:

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
  "optionsAreImages":false,
  "sourceMode":"${sourceMode}"
}

PENTING:
correct adalah angka indeks 0-3.
BUKAN huruf A/B/C/D.
BUKAN teks jawaban.

SCHEMA MULTISELECT:

{
  "type":"multiselect",
  "question":"...",
  "options":["A","B","C","D"],
  "correctAnswers":[0,2],
  "explanation":"..."
}

SCHEMA TRUEFALSE:

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

SCHEMA SHORTANSWER:

{
  "type":"shortanswer",
  "question":"...",
  "shortAnswer":"...",
  "explanation":"..."
}

SCHEMA CAUSEEFFECT:

{
  "type":"causeeffect",
  "question":"...",
  "cause":"...",
  "effect":"...",
  "isCauseTrue":true,
  "isEffectTrue":false,
  "explanation":"..."
}

SCHEMA MATCHING:

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

SCHEMA READING:

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

VISUAL CLOCK:

"clock":{
  "hour":8,
  "minute":30
}

VISUAL GRAPH:

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

ALLOWED TYPES:

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
    targetYear,
    hotsLevel,

    // Compatibility:
    // frontend lama masih mungkin mengirim useTrendSearch.
    useTrendSearch,
  } =
    req.body || {};

  if (
    !cleanText(
      topic
    )
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
      .JINA_API_KEY
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
  // SOURCE MODE
  // ----------------------------------------------------------

  const mode =
    sourceMode ===
    'prediction'
      ? 'prediction'
      : 'source';

  const finalYear =
    targetYear ||
    String(
      new Date().getFullYear() +
        1
    );

  // ==========================================================
  // 1. WEB SEARCH
  // ==========================================================

  const queries =
    buildResearchQueries({
      topic,
      mapel,
      kelas,
      targetYear:
        finalYear,
      sourceMode:
        mode,
      arahan,
    });

  const allResults =
    [];

  const queryErrors =
    [];

  for (
    const query of
      queries
  ) {
    try {
      const result =
        await jinaSearch(
          query
        );

      allResults.push(
        ...result
      );
    } catch (
      error
    ) {
      console.error(
        '[Gemilang][Jina]',
        query,
        error.message
      );

      queryErrors.push({
        query,
        error:
          error.message,
      });
    }

    await sleep(
      250
    );
  }

  const sources =
    dedupeSources(
      allResults
    );

  if (
    sources.length ===
    0
  ) {
    return res.status(
      502
    ).json({
      success: false,

      error:
        'Sistem tidak mendapatkan sumber soal dari internet.',

      debug:
        queryErrors,

      provider:
        'Jina Search',
    });
  }

  // ==========================================================
  // 2. READ PAGES
  // ==========================================================

  const pages =
    [];

  for (
    const source of
      sources.slice(
        0,
        MAX_UNIQUE_SOURCES
      )
  ) {
    const page =
      await readSourcePage(
        source
      );

    if (
      (
        page.content &&
        page.content.length >=
          120
      ) ||
      (
        Array.isArray(
          page.images
        ) &&
        page.images.length >
          0
      )
    ) {
      pages.push(
        page
      );
    }
  }

  if (
    pages.length ===
    0
  ) {
    return res.status(
      502
    ).json({
      success: false,

      error:
        'Sumber internet ditemukan, tetapi halaman sumber tidak dapat dibaca.',

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
  // 3. BUILD RESEARCH PACK
  // ==========================================================

  const researchPack =
    buildResearchPack(
      pages
    );

  // ==========================================================
  // 4. AI
  // ==========================================================

  const systemPrompt =
    buildSystemPrompt({
      sourceMode:
        mode,

      targetYear:
        finalYear,

      allowedTypes,

      hotsLevel:
        hotsLevel ||
        '',
    });

  const userPrompt = `
BIMBEL GEMILANG — RESEARCHED QUESTION TASK

MAPEL:
${mapel || 'Umum'}

KELAS:
${kelas || 'SMP'}

TOPIK:
${cleanText(topic)}

TARGET:
${finalYear}

MODE:
${mode}

JUMLAH SOAL:
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
SUMBER INTERNET
============================================================

${researchPack}

============================================================
TUGAS
============================================================

${
  mode ===
  'source'
    ? `
AMBIL SOAL YANG ADA DI INTERNET.

- Pilih soal yang benar-benar ditemukan di sumber.
- Jangan membuat soal baru.
- Pertanyaan dan opsi harus sesuai sumber.
- Jika ada sumber yang sama dari beberapa tempat,
  jangan keluarkan pertanyaan identik dua kali.
- Gunakan pengulangan sebagai data frekuensi,
  bukan sebagai duplikasi output.
- Sertakan sourceIndex/sourceTitle/sourceUrl.
- Tentukan kunci.
- Verifikasi kunci.
- Buat pembahasan.
`
    : `
PREDIKSI BERBASIS TREN.

Analisis sumber untuk:
- frekuensi topik,
- kompetensi,
- pola pertanyaan,
- HOTS,
- stimulus,
- pola visual,
- recency.

Kemudian buat soal latihan BARU.

Jangan sebut sebagai bocoran.
Jangan menjamin akan keluar.
`
}

Jumlah maksimal:
${jumlah}

Prioritaskan validitas daripada memenuhi jumlah secara asal.
Output HANYA JSONL.
`;

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
    const message =
      String(
        error?.message ||
          ''
      );

    console.error(
      '[Gemilang][Cloudflare AI]',
      message
    );

    if (
      error.status ===
        401 ||
      error.status ===
        403
    ) {
      return res.status(
        502
      ).json({
        success: false,

        error:
          'Cloudflare API Token tidak memiliki akses yang benar.',

        debug:
          message,
      });
    }

    if (
      error.status ===
        429
    ) {
      return res.status(
        429
      ).json({
        success: false,

        error:
          'Kuota harian Cloudflare Workers AI sedang mencapai batas.',

        debug:
          message,
      });
    }

    return res.status(
      502
    ).json({
      success: false,

      error:
        'Cloudflare Workers AI gagal menganalisis sumber.',

      debug:
        message,
    });
  }

  // ==========================================================
  // 5. EXTRACT
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

        resultKeys:
          Object.keys(
            aiData?.result ||
              {}
          ),
      },
    });
  }

  const objects =
    extractJsonObjects(
      rawText
    );

  // ==========================================================
  // 6. QUALITY + DEDUP
  // ==========================================================

  const questions =
    [];

  const seen =
    new Set();

  for (
    const rawQuestion of
      objects
  ) {
    const question =
      validateQuestion(
        rawQuestion,
        allowedTypes
      );

    if (
      !question
    ) {
      continue;
    }

    const fingerprint =
      `${question.type}|${fingerprintText(
        question.question
      )}`;

    if (
      seen.has(
        fingerprint
      )
    ) {
      continue;
    }

    seen.add(
      fingerprint
    );

    question.researchBacked =
      true;

    question.researchSources =
      pages.map(
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
  // 7. FAILED QUALITY GATE
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
        'Sumber internet berhasil ditemukan, tetapi tidak ada soal yang lolos quality gate.',

      debug: {
        model:
          CLOUDFLARE_MODEL,

        parsedObjectCount:
          objects.length,

        rawTextLength:
          rawText.length,

        rawTextSample:
          rawText.slice(
            0,
            1500
          ),
      },

      researchSources:
        pages.map(
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
  // 8. RESPONSE
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

    usedTrendSearch:
      true,

    researchProvider:
      'Jina Search',

    aiProvider:
      'Cloudflare Workers AI',

    model:
      CLOUDFLARE_MODEL,

    researchSources:
      pages.map(
        (page) => ({
          title:
            page.title ||
            '',

          url:
            page.url ||
            '',
        })
      ),

    diagnostics: {
      queryCount:
        queries.length,

      queryErrors,

      searchSourceCount:
        sources.length,

      readablePageCount:
        pages.length,

      parsedObjectCount:
        objects.length,
    },
  });
}