// api/generateQuizFromTopic.js
// ============================================================
// BIMBEL GEMILANG — PROFESSIONAL QUIZ ENGINE
// FREE WEB RESEARCH + GEMINI 3.6 FLASH
// ============================================================
// Arsitektur:
// WEB SEARCH GRATIS
//      ↓
// contoh/sumber soal nyata
//      ↓
// GEMINI 3.6 FLASH
//      ↓
// soal latihan baru berbasis riset
//      ↓
// QUALITY GATE
//      ↓
// MANAGE QUIZ
//
// PENTING:
// - Tidak memakai Antigravity.
// - Tidak memakai gemini-2.5.
// - Tidak memakai Google Search grounding Gemini 3.x
//   karena tidak tersedia pada Free Tier API.
// - Tidak fallback diam-diam dari riset ke AI offline.
// - Maksimal 10 soal per request.
// - Untuk 40 soal: frontend nanti memanggil 10 + 10 + 10 + 10.
// - Visual clock/graph/shape/pattern dibuat lokal.
// - Foto nyata memakai needsImage + imageHint agar frontend
//   dapat mengambil dari sumber gambar berlisensi terbuka.
// ============================================================

const GEMINI_MODEL = 'gemini-3.6-flash';

const MAX_BATCH_QUESTIONS = 10;
const MAX_OUTPUT_TOKENS = 14000;

const GEMINI_TIMEOUT_MS = 70000;
const SEARCH_TIMEOUT_MS = 30000;

// Search Jina tanpa API key memiliki rate limit rendah.
// Kita sengaja memberi jarak antarpencarian agar tidak melakukan
// request paralel yang mudah terkena rate limit.
const SEARCH_INTERVAL_MS = 22000;

let lastSearchAt = 0;

// ============================================================
// HELPERS
// ============================================================

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const sanitizeText = (value = '') =>
  String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .trim();

const sanitizeLatexEscapes = (text = '') =>
  String(text)
    .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
    .replace(/\\([bfnrtu])(?=[a-zA-Z])/g, '\\\\$1');

const escapeXml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const isFiniteNumber = (value) =>
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

  const timer = setTimeout(
    () => controller.abort(),
    timeoutMs
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

async function searchWebFree(query) {
  const now = Date.now();

  const wait = Math.max(
    0,
    SEARCH_INTERVAL_MS -
      (now - lastSearchAt)
  );

  if (wait > 0) {
    await sleep(wait);
  }

  lastSearchAt = Date.now();

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
          Accept: 'application/json',
          'User-Agent':
            'BimbelGemilangQuiz/1.0',
        },
      },
      SEARCH_TIMEOUT_MS
    );

  const raw =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `WEB_SEARCH_HTTP_${response.status}: ${raw.slice(
        0,
        500
      )}`
    );
  }

  // Jina dapat mengembalikan JSON
  // ataupun teks tergantung gateway.

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

    if (items.length > 0) {
      return items
        .slice(0, 8)
        .map((item) => ({
          title: sanitizeText(
            item.title ||
              item.name ||
              ''
          ),

          url: sanitizeText(
            item.url ||
              item.link ||
              ''
          ),

          content:
            sanitizeText(
              item.content ||
                item.description ||
                item.snippet ||
                ''
            ).slice(0, 8000),
        }))
        .filter(
          (item) =>
            item.title ||
            item.url ||
            item.content
        );
    }
  } catch (_) {
    // lanjut ke mode plain text
  }

  if (!raw.trim()) {
    return [];
  }

  return [
    {
      title:
        'Web Search Result',

      url: '',

      content:
        raw.slice(0, 12000),
    },
  ];
}

// ============================================================
// RESEARCH QUERY
// ============================================================

function buildResearchQueries({
  topic,
  mapel,
  kelas,
  targetYear,
}) {
  const year =
    targetYear ||
    String(
      new Date().getFullYear() + 1
    );

  return [
    `"${topic}" ${mapel || ''} ${
      kelas || ''
    } TKA contoh soal`,

    `"${topic}" ${mapel || ''} ${
      kelas || ''
    } latihan soal tahun sebelumnya`,

    `${mapel || ''} ${
      kelas || ''
    } TKA soal ${year}`,

    `${topic} soal HOTS ${mapel || ''}`,
  ];
}

// ============================================================
// GEMINI 3.6 FLASH
// ============================================================

async function callGemini(
  systemPrompt,
  userPrompt
) {
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
      temperature: 0.2,
      topP: 0.9,
      maxOutputTokens:
        MAX_OUTPUT_TOKENS,
    },
  };

  const response =
    await fetchWithTimeout(
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
      GEMINI_TIMEOUT_MS
    );

  const raw =
    await response.text();

  if (!response.ok) {
    let detail = raw;

    try {
      const parsed =
        JSON.parse(raw);

      detail =
        parsed?.error
          ?.message || raw;
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
}

// ============================================================
// VISUAL — CLOCK
// ============================================================

const buildClockImageSvg = (
  clock
) => {
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
        Number(clock.minute)
      )
    );

  const size = 280;

  const cx =
    size / 2;

  const cy =
    size / 2;

  const radius =
    112;

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
          i === 0
            ? 12
            : i;

        const pos =
          toXY(
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
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 ${size} ${size}"
  width="${size}"
  height="${size}"
>
  <rect
    width="${size}"
    height="${size}"
    fill="white"
  />

  <circle
    cx="${cx}"
    cy="${cy}"
    r="${radius}"
    fill="white"
    stroke="#1e293b"
    stroke-width="3"
  />

  ${ticks}

  ${numbers}

  <line
    x1="${cx}"
    y1="${cy}"
    x2="${hourTip.x.toFixed(2)}"
    y2="${hourTip.y.toFixed(2)}"
    stroke="#1e293b"
    stroke-width="6"
    stroke-linecap="round"
  />

  <line
    x1="${cx}"
    y1="${cy}"
    x2="${minuteTip.x.toFixed(2)}"
    y2="${minuteTip.y.toFixed(2)}"
    stroke="#334155"
    stroke-width="4"
    stroke-linecap="round"
  />

  <circle
    cx="${cx}"
    cy="${cy}"
    r="5"
    fill="#1e293b"
  />
</svg>
`;

  return (
    `data:image/svg+xml;base64,` +
    Buffer.from(svg).toString(
      'base64'
    )
  );
};

// ============================================================
// VISUAL — GRAPH
// ============================================================

const buildGraphImageSvg = (
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
      .slice(0, 100);

  if (
    points.length < 2
  ) {
    return '';
  }

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

  const W = 640;

  const H = 420;

  const pad = 55;

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
        (point, i) =>
          `${
            i === 0
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
      graph.xLabel || 'x'
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
      graph.yLabel || 'y'
    )}
  </text>
</svg>
`;

  return (
    `data:image/svg+xml;base64,` +
    Buffer.from(svg).toString(
      'base64'
    )
  );
};

// ============================================================
// VISUAL — SHAPE
// ============================================================

const buildShapeImageSvg = (
  shape
) => {
  if (
    !shape ||
    !Array.isArray(
      shape.vertices
    )
  ) {
    return '';
  }

  const vertices =
    shape.vertices
      .filter(
        (vertex) =>
          isFiniteNumber(
            vertex?.x
          ) &&
          isFiniteNumber(
            vertex?.y
          )
      )
      .slice(0, 30);

  if (
    vertices.length < 3
  ) {
    return '';
  }

  const labels =
    Array.isArray(
      shape.labels
    )
      ? shape.labels.filter(
          (label) =>
            isFiniteNumber(
              label?.x
            ) &&
            isFiniteNumber(
              label?.y
            )
        )
      : [];

  const allX = [
    ...vertices.map(
      (v) => v.x
    ),

    ...labels.map(
      (l) => l.x
    ),
  ];

  const allY = [
    ...vertices.map(
      (v) => v.y
    ),

    ...labels.map(
      (l) => l.y
    ),
  ];

  const minX =
    Math.min(...allX);

  const maxX =
    Math.max(...allX);

  const minY =
    Math.min(...allY);

  const maxY =
    Math.max(...allY);

  const span =
    Math.max(
      maxX - minX,
      maxY - minY,
      1
    );

  const pad =
    span * 0.2 + 10;

  const W =
    Math.max(
      maxX - minX +
        pad * 2,
      180
    );

  const H =
    Math.max(
      maxY - minY +
        pad * 2,
      180
    );

  const sx = (
    x
  ) =>
    x - minX + pad;

  const sy = (
    y
  ) =>
    maxY - y + pad;

  const polygon =
    vertices
      .map(
        (vertex) =>
          `${sx(
            vertex.x
          ).toFixed(1)},${sy(
            vertex.y
          ).toFixed(1)}`
      )
      .join(' ');

  const labelSvg =
    labels
      .map(
        (label) =>
          `<text
            x="${sx(
              label.x
            ).toFixed(1)}"
            y="${sy(
              label.y
            ).toFixed(1)}"
            text-anchor="middle"
            font-family="Arial"
            font-size="16"
            fill="#334155"
          >${escapeXml(
            label.text || ''
          )}</text>`
      )
      .join('');

  const svg = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 ${W} ${H}"
  width="500"
  height="360"
>
  <rect
    width="${W}"
    height="${H}"
    fill="white"
  />

  <polygon
    points="${polygon}"
    fill="#dbeafe"
    stroke="#1e293b"
    stroke-width="3"
  />

  ${labelSvg}
</svg>
`;

  return (
    `data:image/svg+xml;base64,` +
    Buffer.from(svg).toString(
      'base64'
    )
  );
};

// ============================================================
// VISUAL — PATTERN
// ============================================================

const PRIMITIVES = {
  circle:
    (
      cx,
      cy,
      r,
      filled
    ) =>
      `<circle
        cx="${cx}"
        cy="${cy}"
        r="${r}"
        fill="${
          filled
            ? '#1e293b'
            : 'white'
        }"
        stroke="#1e293b"
        stroke-width="2"
      />`,

  square:
    (
      cx,
      cy,
      r,
      filled
    ) =>
      `<rect
        x="${cx - r}"
        y="${cy - r}"
        width="${r * 2}"
        height="${r * 2}"
        fill="${
          filled
            ? '#1e293b'
            : 'white'
        }"
        stroke="#1e293b"
        stroke-width="2"
      />`,

  triangle:
    (
      cx,
      cy,
      r,
      filled
    ) =>
      `<polygon
        points="${cx},${
          cy - r
        } ${
          cx - r
        },${cy + r} ${
          cx + r
        },${cy + r}"
        fill="${
          filled
            ? '#1e293b'
            : 'white'
        }"
        stroke="#1e293b"
        stroke-width="2"
      />`,

  pentagon: (
    cx,
    cy,
    r,
    filled
  ) => {
    const points =
      Array.from(
        { length: 5 },
        (_, i) => {
          const angle =
            -Math.PI / 2 +
            (i *
              2 *
              Math.PI) /
              5;

          return `${(
            cx +
            r *
              Math.cos(
                angle
              )
          ).toFixed(1)},${(
            cy +
            r *
              Math.sin(
                angle
              )
          ).toFixed(1)}`;
        }
      ).join(' ');

    return `
<polygon
  points="${points}"
  fill="${
    filled
      ? '#1e293b'
      : 'white'
  }"
  stroke="#1e293b"
  stroke-width="2"
/>`;
  },

  star: (
    cx,
    cy,
    r,
    filled
  ) => {
    const points =
      Array.from(
        { length: 10 },
        (_, i) => {
          const rr =
            i % 2 === 0
              ? r
              : r * 0.45;

          const angle =
            -Math.PI / 2 +
            (i * Math.PI) /
              5;

          return `${(
            cx +
            rr *
              Math.cos(
                angle
              )
          ).toFixed(1)},${(
            cy +
            rr *
              Math.sin(
                angle
              )
          ).toFixed(1)}`;
        }
      ).join(' ');

    return `
<polygon
  points="${points}"
  fill="${
    filled
      ? '#1e293b'
      : 'white'
  }"
  stroke="#1e293b"
  stroke-width="2"
/>`;
  },
};

const buildPatternImageSvg = (
  pattern
) => {
  if (
    !pattern ||
    !Array.isArray(
      pattern.sequence
    )
  ) {
    return '';
  }

  const sequence =
    pattern.sequence
      .filter(
        (item) =>
          item &&
          PRIMITIVES[
            item.shape
          ]
      )
      .slice(0, 12);

  if (
    sequence.length ===
    0
  ) {
    return '';
  }

  const cell = 90;

  const W =
    sequence.length *
    cell;

  const H = cell;

  const cells =
    sequence
      .map(
        (item, index) => {
          const cx =
            index *
              cell +
            cell /
              2;

          const cy =
            cell / 2;

          const rotation =
            isFiniteNumber(
              item.rotation
            )
              ? item.rotation
              : 0;

          return `
<rect
  x="${
    index * cell +
    2
  }"
  y="2"
  width="${
    cell - 4
  }"
  height="${
    cell - 4
  }"
  fill="none"
  stroke="#e2e8f0"
/>

<g transform="rotate(${rotation} ${cx} ${cy})">
  ${
    PRIMITIVES[
      item.shape
    ](
      cx,
      cy,
      26,
      Boolean(
        item.filled
      )
    )
  }
</g>`;
        }
      )
      .join('');

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
  ${cells}
</svg>
`;

  return (
    `data:image/svg+xml;base64,` +
    Buffer.from(svg).toString(
      'base64'
    )
  );
};

// ============================================================
// VISUAL CUE
// ============================================================

const hasVisualCue = (
  text = ''
) => {
  const value =
    String(text)
      .toLowerCase();

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
      value.includes(cue)
  );
};

// ============================================================
// JSON PARSER
// ============================================================

const extractJsonObjects = (
  text = ''
) => {
  const objects = [];

  let depth = 0;

  let start = -1;

  let inString =
    false;

  let escaped =
    false;

  for (
    let i = 0;
    i < text.length;
    i++
  ) {
    const ch =
      text[i];

    if (escaped) {
      escaped =
        false;

      continue;
    }

    if (ch === '\\') {
      escaped =
        true;

      continue;
    }

    if (ch === '"') {
      inString =
        !inString;

      continue;
    }

    if (inString) continue;

    if (ch === '{') {
      if (
        depth ===
        0
      ) {
        start = i;
      }

      depth += 1;
    }

    if (ch === '}') {
      depth -= 1;

      if (
        depth ===
          0 &&
        start !== -1
      ) {
        try {
          const item =
            JSON.parse(
              text.slice(
                start,
                i + 1
              )
            );

          objects.push(
            item
          );
        } catch (_) {}

        start = -1;
      }
    }
  }

  return objects;
};

// ============================================================
// QUESTION VALIDATOR
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
    sanitizeText(
      raw.question ||
        ''
    );

  if (!question) {
    return null;
  }

  // Multiple

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

  // Multi select

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

    if (
      !raw.correctAnswers.every(
        (answer) =>
          isIntegerInRange(
            answer,
            0,
            raw.options
              .length - 1
          )
      )
    ) {
      return null;
    }
  }

  // True false

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
          statement &&
          typeof statement.text ===
            'string'
      )
    ) {
      return null;
    }
  }

  // Short answer

  if (
    raw.type ===
    'shortanswer'
  ) {
    if (
      !sanitizeText(
        raw.shortAnswer
      )
    ) {
      return null;
    }
  }

  // Cause effect

  if (
    raw.type ===
    'causeeffect'
  ) {
    if (
      !sanitizeText(
        raw.cause
      ) ||
      !sanitizeText(
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

  // Matching

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

  // Reading

  if (
    raw.type ===
    'reading'
  ) {
    if (
      !sanitizeText(
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

  // ==========================================================
  // VISUAL
  // ==========================================================

  let qImage =
    '';

  let visualRequired =
    false;

  let visualKind =
    'none';

  let needsImage =
    false;

  let imageHint =
    '';

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
  } else if (
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
  } else if (
    raw.shape
  ) {
    qImage =
      buildShapeImageSvg(
        raw.shape
      );

    visualRequired =
      true;

    visualKind =
      'shape';
  } else if (
    raw.pattern
  ) {
    qImage =
      buildPatternImageSvg(
        raw.pattern
      );

    visualRequired =
      true;

    visualKind =
      'pattern';
  } else if (
    raw.needs_image
  ) {
    needsImage =
      true;

    imageHint =
      sanitizeText(
        raw.image_keyword ||
          ''
      );

    visualRequired =
      true;

    visualKind =
      'photo';
  }

  // Jika soal mengharuskan
  // gambar tapi tidak ada visual,
  // TOLAK.

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
            sanitizeText
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
            (statement) => ({
              text:
                sanitizeText(
                  statement?.text ||
                    ''
                ),

              isTrue:
                Boolean(
                  statement?.isTrue
                ),
            })
          )
        : undefined,

    shortAnswer:
      sanitizeText(
        raw.shortAnswer ||
          ''
      ) ||
      undefined,

    cause:
      sanitizeText(
        raw.cause ||
          ''
      ) ||
      undefined,

    effect:
      sanitizeText(
        raw.effect ||
          ''
      ) ||
      undefined,

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
                sanitizeText(
                  pair?.left ||
                    ''
                ),

              right:
                sanitizeText(
                  pair?.right ||
                    ''
                ),
            })
          )
        : undefined,

    readingText:
      sanitizeText(
        raw.readingText ||
          ''
      ) ||
      undefined,

    subQuestions:
      Array.isArray(
        raw.subQuestions
      )
        ? raw.subQuestions.map(
            (subQuestion) => ({
              q:
                sanitizeText(
                  subQuestion?.q ||
                    ''
                ),

              options:
                Array.isArray(
                  subQuestion?.options
                )
                  ? subQuestion.options.map(
                      sanitizeText
                    )
                  : [],

              correct:
                subQuestion?.correct,
            })
          )
        : undefined,

    explanation:
      sanitizeText(
        raw.explanation ||
          ''
      ),

    qImage:
      qImage ||
      undefined,

    needsImage,

    imageHint,

    imageSource:
      null,

    visualRequired,

    visualKind,

    researchBacked:
      false,

    researchSources:
      [],
  };
}

// ============================================================
// PROMPT
// ============================================================

const buildSystemPrompt = ({
  allowedTypes,
  researchMode,
  targetYear,
  hotsLevel,
}) => `
Kamu adalah penyusun soal profesional untuk Bimbel Gemilang.

MODE:
${
  researchMode
    ? `
Sistem sudah memberikan bahan riset dari internet.

Gunakan bahan tersebut untuk:
- menemukan topik yang sering muncul,
- memahami bentuk soal,
- memahami model stimulus,
- memahami kompetensi,
- memahami tingkat kesulitan,
- memahami pola visual.

JANGAN mengklaim soal sebagai bocoran.
JANGAN mengklaim mengetahui soal ujian masa depan.
JANGAN menyalin satu soal sumber kata demi kata.

Buat SOAL LATIHAN BARU berdasarkan pola dan kompetensi
yang didukung oleh bahan riset.
`
    : `
Buat soal original berdasarkan topik.
`
}

TARGET LATIHAN:
${targetYear}

ATURAN WAJIB:

1. Mapel harus sesuai.

2. Topik harus sesuai.

3. Jenjang harus sesuai.

4. Jangan memasukkan konteks tidak relevan.

5. Semua jawaban harus diverifikasi.

6. Untuk matematika/fisika/kimia:
   hitung ulang sebelum menentukan kunci.

7. Distraktor harus masuk akal.

8. Pembahasan harus menjelaskan jawaban.

9. Jangan membuat soal duplikat.

10. Jangan menggunakan markdown.

11. Jangan membuat kalimat "lihat gambar"
    jika gambar tidak tersedia.

12. Gunakan visual hanya jika benar-benar
    diperlukan oleh soal.

VISUAL:

CLOCK:
"clock":{"hour":8,"minute":30}

GRAPH:
"graph":{"points":[...],"highlight":[...]}

SHAPE:
"shape":{"vertices":[...],"labels":[...]}

PATTERN:
"pattern":{"sequence":[...]}

FOTO NYATA:
"needs_image":true,
"image_keyword":"english keyword"

TIPE SOAL YANG DIIZINKAN:

${allowedTypes
  .map(
    (type) =>
      `- ${type}`
  )
  .join('\n')}

FORMAT OUTPUT:

Baris pertama:
{"meta":true}

Setiap soal:
SATU OBJECT JSON DALAM SATU BARIS.

Tanpa:
- markdown,
- code fence,
- komentar,
- teks di luar JSONL.

${
  hotsLevel
    ? `\nLEVEL HOTS: ${hotsLevel}`
    : ''
}
`;

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
      error:
        'Method not allowed',
    });
  }

  if (
    !process.env
      .GEMINI_API_KEY
  ) {
    return res.status(
      500
    ).json({
      error:
        'GEMINI_API_KEY belum tersedia di environment Vercel.',
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
    hotsLevel,
    targetYear,
  } =
    req.body || {};

  if (
    !String(
      topic || ''
    ).trim()
  ) {
    return res.status(
      400
    ).json({
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
    Array.isArray(
      types
    ) &&
    types.length
      ? types
      : ['multiple'];

  const researchMode =
    Boolean(
      useTrendSearch
    );

  const finalTargetYear =
    targetYear ||
    String(
      new Date().getFullYear() +
        1
    );

  // ==========================================================
  // 1. SEARCH INTERNET
  // ==========================================================

  let sources = [];

  if (
    researchMode
  ) {
    const queries =
      buildResearchQueries({
        topic,
        mapel,
        kelas,
        targetYear:
          finalTargetYear,
      });

    const allSources =
      [];

    try {
      for (
        const query of
          queries
      ) {
        const results =
          await searchWebFree(
            query
          );

        allSources.push(
          ...results
        );
      }
    } catch (
      error
    ) {
      console.error(
        '[Gemilang Web Search]',
        error
          .message
      );

      return res.status(
        502
      ).json({
        error:
          'Pencarian internet gratis gagal. Batch dihentikan agar sistem tidak berpura-pura berbasis internet.',
        debug:
          error.message,
      });
    }

    // Deduplicate berdasarkan URL
    const seenUrls =
      new Set();

    sources =
      allSources
        .filter(
          (source) => {
            if (
              !source.url
            ) {
              return true;
            }

            if (
              seenUrls.has(
                source.url
              )
            ) {
              return false;
            }

            seenUrls.add(
              source.url
            );

            return true;
          }
        )
        .slice(
          0,
          12
        );

    if (
      sources.length ===
      0
    ) {
      return res.status(
        502
      ).json({
        error:
          'Tidak ditemukan sumber web yang cukup relevan.',
      });
    }
  }

  // ==========================================================
  // 2. PROMPT
  // ==========================================================

  const systemPrompt =
    buildSystemPrompt({
      allowedTypes,
      researchMode,
      targetYear:
        finalTargetYear,
      hotsLevel:
        hotsLevel || '',
    });

  const sourcePack =
    researchMode
      ? sources
          .map(
            (
              source,
              index
            ) => `
SUMBER ${index + 1}
Judul:
${
  source.title ||
  '(tanpa judul)'
}

URL:
${
  source.url ||
  '(tanpa URL)'
}

Isi:
${
  source.content ||
  '(tidak ada isi)'
}
`
          )
          .join(
            '\n'
          )
      : '';

  const userPrompt = `
MATA PELAJARAN:
${mapel || 'Umum'}

TOPIK:
${String(topic).trim()}

JENJANG/KELAS:
${kelas || 'SMP'}

TARGET TAHUN LATIHAN:
${finalTargetYear}

JUMLAH SOAL:
${jumlah}

TIPE:
${allowedTypes.join(
  ', '
)}

${
  arahan?.trim()
    ? `
ARAHAN GURU:
${arahan.trim()}
`
    : ''
}

${
  researchMode
    ? `
BAHAN RISET INTERNET:

${sourcePack}

Gunakan bahan ini untuk menentukan:
- kompetensi,
- pola,
- tipe stimulus,
- tingkat kesulitan,
- variasi soal.

Buat soal latihan baru.
Jangan menyalin teks soal sumber.
`
    : ''
}

Buat ${jumlah} soal valid.
Prioritaskan akurasi daripada memaksakan jumlah.
`;

  // ==========================================================
  // 3. GEMINI
  // ==========================================================

  let geminiData;

  try {
    geminiData =
      await callGemini(
        systemPrompt,
        userPrompt
      );
  } catch (
    error
  ) {
    console.error(
      '[Gemilang Gemini]',
      error.message
    );

    const message =
      String(
        error.message ||
          ''
      );

    if (
      message.includes(
        '404'
      )
    ) {
      return res.status(
        502
      ).json({
        error:
          'Gemini 3.6 Flash tidak tersedia untuk API key/project ini. Pastikan API key Vercel adalah API key Gemini terbaru.',
        debug:
          message,
      });
    }

    if (
      message.includes(
        '401'
      ) ||
      message.includes(
        '403'
      )
    ) {
      return res.status(
        502
      ).json({
        error:
          'GEMINI_API_KEY ditolak. Periksa API key pada Vercel.',
        debug:
          message,
      });
    }

    if (
      message.includes(
        '429'
      )
    ) {
      return res.status(
        429
      ).json({
        error:
          'Kuota gratis Gemini sedang mencapai batas. Tidak ada fallback berbayar.',
        debug:
          message,
      });
    }

    return res.status(
      502
    ).json({
      error:
        'Gemini 3.6 Flash gagal membuat soal.',
      debug:
        message,
    });
  }

  // ==========================================================
  // 4. EXTRACT TEXT
  // ==========================================================

  const candidate =
    geminiData
      ?.candidates?.[0];

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
    return res.status(
      502
    ).json({
      error:
        'Gemini tidak mengembalikan soal.',
    });
  }

  const fixedText =
    sanitizeLatexEscapes(
      rawText
    );

  const objects =
    extractJsonObjects(
      fixedText
    );

  // ==========================================================
  // 5. QUALITY GATE
  // ==========================================================

  const questions =
    [];

  const fingerprints =
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
      `${question.type}|${question.question
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()}`;

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

    if (
      researchMode
    ) {
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
    }

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
  // NO VALID RESULT
  // ==========================================================

  if (
    questions.length ===
    0
  ) {
    return res.status(
      502
    ).json({
      error:
        researchMode
          ? 'Tidak ada soal yang lolos quality gate setelah riset internet.'
          : 'Tidak ada soal valid yang berhasil dibuat.',

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
        jumlah ||
      candidate?.finishReason ===
        'MAX_TOKENS',

    usedTrendSearch:
      researchMode,

    researchProvider:
      researchMode
        ? 'Jina Search'
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