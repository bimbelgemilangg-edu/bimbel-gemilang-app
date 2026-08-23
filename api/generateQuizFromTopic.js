// api/generateQuizFromTopic.js
// ============================================================
// BIMBEL GEMILANG — PROFESSIONAL QUESTION RESEARCH ENGINE
// ============================================================
// ALUR:
// 1. Jina Search mencari sumber soal publik di internet.
// 2. Hasil pencarian dibaca / diringkas.
// 3. Gemini 3.5 Flash menganalisis sumber.
// 4. Mode SOURCE  -> mengambil soal yang benar-benar ditemukan.
// 5. Mode PREDICT -> menganalisis banyak sumber lalu menyusun
//                    latihan baru berdasarkan pola yang ditemukan.
// 6. Jawaban + verifikasi + pembahasan wajib dihasilkan.
// 7. Visual clock/graph/shape/pattern dapat dibuat lokal.
// 8. Gambar dari sumber web disimpan sebagai metadata URL untuk
//    diproses lebih lanjut oleh editor.
// 9. Maksimal 10 soal per request.
//    Frontend dapat membuat 40 soal = 10 + 10 + 10 + 10.
// ============================================================

const GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  'gemini-3.5-flash';

const MAX_BATCH_QUESTIONS = 10;
const MAX_OUTPUT_TOKENS = 14000;

const GEMINI_TIMEOUT_MS = 70000;
const JINA_TIMEOUT_MS = 30000;

const SEARCH_QUERIES_PER_REQUEST = 4;
const MAX_SEARCH_RESULTS = 10;
const MAX_SOURCE_PACK_CHARS = 60000;

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

const escapeXml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
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
// JINA SEARCH
// ============================================================

async function searchJina(
  query
) {
  const apiKey =
    process.env.JINA_API_KEY;

  if (!apiKey) {
    throw new Error(
      'JINA_API_KEY belum tersedia. Tambahkan JINA_API_KEY di Vercel Environment Variables.'
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
            'BimbelGemilangQuiz/1.0',
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

  // ----------------------------------------------------------
  // Jina Search bisa memberikan JSON.
  // ----------------------------------------------------------

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

    if (items.length) {
      return items
        .slice(
          0,
          MAX_SEARCH_RESULTS
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
                12000
              ),
          })
        )
        .filter(
          (item) =>
            item.url ||
            item.content
        );
    }
  } catch (_) {
    // Lanjut plain text.
  }

  // ----------------------------------------------------------
  // Plain-text fallback
  // ----------------------------------------------------------

  if (!raw.trim()) {
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
          14000
        ),
    },
  ];
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

  const topik =
    clean(topic);

  const subject =
    clean(
      mapel
    );

  const grade =
    clean(
      kelas
    );

  const year =
    clean(
      targetYear
    );

  const instruction =
    clean(
      arahan
    );

  if (
    sourceMode ===
    'prediction'
  ) {
    return [
      clean(
        `${topik} ${subject} ${grade} TKA contoh soal`
      ),

      clean(
        `${topik} ${subject} ${grade} soal HOTS`
      ),

      clean(
        `${topik} ${subject} ${grade} soal tahun sebelumnya`
      ),

      clean(
        `${topik} ${subject} TKA ${year} latihan ${instruction}`
      ),
    ];
  }

  return [
    clean(
      `${topik} ${subject} ${grade} soal`
    ),

    clean(
      `${topik} ${subject} ${grade} contoh soal`
    ),

    clean(
      `${topik} ${subject} ${grade} latihan TKA`
    ),

    clean(
      `${topik} ${subject} ${grade} bank soal`
    ),
  ];
}

// ============================================================
// DEDUPLICATE SOURCES
// ============================================================

function deduplicateSources(
  sources
) {
  const seen =
    new Set();

  return sources
    .filter(
      (source) => {
        const url =
          cleanText(
            source?.url ||
              ''
          );

        const title =
          normalizeText(
            source?.title ||
              ''
          );

        const key =
          url ||
          title;

        if (!key)
          return false;

        if (
          seen.has(key)
        ) {
          return false;
        }

        seen.add(key);

        return true;
      }
    )
    .slice(
      0,
      MAX_SEARCH_RESULTS
    );
}

// ============================================================
// OPTIONAL PAGE READING
// ============================================================
// Hanya dilakukan untuk URL yang terlihat layak.
// Kalau halaman tidak bisa dibaca, hasil pencarian tetap dipakai.
// ============================================================

async function readSourcePage(
  source
) {
  const url =
    cleanText(
      source?.url ||
        ''
    );

  if (!url) {
    return source;
  }

  try {
    const response =
      await fetchWithTimeout(
        url,
        {
          method: 'GET',

          headers: {
            Accept:
              'text/html,application/xhtml+xml',

            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/151 Safari/537.36',
          },
        },
        18000
      );

    if (!response.ok) {
      return source;
    }

    const html =
      await response.text();

    if (
      !html ||
      html.length <
        100
    ) {
      return source;
    }

    // --------------------------------------------------------
    // title
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // text
    // --------------------------------------------------------

    const pageText =
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
            /<[^>]+>/g,
            ' '
          )
      );

    // --------------------------------------------------------
    // images
    // --------------------------------------------------------

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
        20
    ) {
      const tag =
        imageMatch[0];

      const srcMatch =
        tag.match(
          /(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i
        );

      if (!srcMatch)
        continue;

      const rawSrc =
        srcMatch[1];

      let imageUrl =
        '';

      try {
        imageUrl =
          new URL(
            rawSrc,
            url
          ).href;
      } catch (_) {}

      if (!imageUrl)
        continue;

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

      content:
        pageText.slice(
          0,
          18000
        ),

      images:
        images.filter(
          (
            image,
            index,
            array
          ) =>
            index ===
            array.findIndex(
              (x) =>
                x.url ===
                image.url
            )
        ),
    };
  } catch (_) {
    return source;
  }
}

// ============================================================
// GEMINI
// ============================================================

async function callGemini({
  systemPrompt,
  userPrompt,
}) {
  const apiKey =
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
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
          text:
            systemPrompt,
        },
      ],
    },

    contents: [
      {
        role: 'user',

        parts: [
          {
            text:
              userPrompt,
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
    await fetchWithTimeout(
      url,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          'x-goog-api-key':
            apiKey,
        },

        body:
          JSON.stringify(
            body
          ),
      },
      GEMINI_TIMEOUT_MS
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
        parsed?.error
          ?.message ||
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

  try {
    return JSON.parse(
      raw
    );
  } catch (_) {
    throw new Error(
      'Respons Gemini tidak dapat diparse sebagai JSON.'
    );
  }
}

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

  const size =
    280;

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
        minute *
          0.5,

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
        length:
          60,
      },
      (
        _,
        index
      ) => {
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
        length:
          12,
      },
      (
        _,
        index
      ) => {
        const number =
          index === 0
            ? 12
            : index;

        const pos =
          toXY(
            index *
              30,

            radius - 25
          );

        return `
<text
x="${pos.x.toFixed(1)}"
y="${(
          pos.y +
          6
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
    Buffer.from(
      svg
    ).toString(
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
    points.length <
    2
  ) {
    return '';
  }

  const W =
    640;

  const H =
    420;

  const pad =
    55;

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
          point,
          index
        ) =>
          `${
            index ===
            0
              ? 'M'
              : 'L'
          } ${mapX(
            point.x
          ).toFixed(1)} ${mapY(
            point.y
          ).toFixed(1)}`
      )
      .join(' ');

  const highlight =
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
stroke-linecap="round"
stroke-linejoin="round"
/>

${highlight}

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
// VISUAL CUE DETECTION
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
        normalizeText(
          cue
        )
      )
  );
}

// ============================================================
// JSON EXTRACTION
// ============================================================

function extractJsonObjects(
  text = ''
) {
  const objects = [];

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
    index++
  ) {
    const ch =
      text[index];

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

    if (
      inString
    ) {
      continue;
    }

    if (ch === '{') {
      if (
        depth ===
        0
      ) {
        start =
          index;
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
            raw.options
              .length - 1
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
          statement &&
          typeof statement.text ===
            'string' &&
          typeof statement.isTrue ===
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
    '';

  let visualKind =
    'none';

  let visualRequired =
    false;

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

  // Jangan izinkan soal mengatakan
  // "lihat gambar" tanpa gambar.

  if (
    hasVisualCue(
      question
    ) &&
    !qImage &&
    !needsImage
  ) {
    return null;
  }

  // ----------------------------------------------------------
  // RESULT
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

    optionImages:
      Array.isArray(
        raw.optionImages
      )
        ? raw.optionImages.map(
            cleanText
          )
        : [],

    optionsAreImages:
      Boolean(
        raw.optionsAreImages
      ),

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
      cleanText(
        raw.questionImageUrl ||
          ''
      ),

    needsImage,

    imageHint,

    imageSource:
      raw.imageSource ||
      null,

    researchBacked:
      true,

    visualRequired,

    visualKind,

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
  const modeInstruction =
    sourceMode ===
    'source'
      ? `
MODE: AMBIL SOAL INTERNET.

Tugas:
- gunakan soal yang benar-benar terdapat pada sumber web.
- jangan membuat soal baru.
- pertahankan pertanyaan dan opsi berdasarkan sumber.
- jika kunci sumber tidak jelas, analisis sendiri.
- jika jawaban tidak dapat diverifikasi, jangan keluarkan soal.
- sertakan sumber.
- buat pembahasan detail.
`
      : `
MODE: PREDIKSI BERBASIS TREN.

Tugas:
- analisis banyak sumber web.
- cari pola soal yang berulang.
- cari kompetensi yang sering muncul.
- cari pola HOTS.
- cari pola stimulus visual.
- susun soal latihan baru berdasarkan pola tersebut.
- jangan mengklaim sebagai bocoran.
- jangan menyebut soal tersebut pasti muncul.
`;

  return `
Kamu adalah Question Research Engine profesional Bimbel Gemilang.

${modeInstruction}

TARGET:
${targetYear}

LEVEL HOTS:
${hotsLevel || 'standar'}

ATURAN WAJIB:

1. Soal harus sesuai mapel, kelas, dan topik.

2. Kunci jawaban harus benar.

3. Pembahasan harus detail dan mudah dipahami siswa.

4. answerVerification harus menjelaskan bagaimana kunci diverifikasi.

5. analysisSummary harus menjelaskan konsep/kompetensi yang diuji.

6. Untuk matematika, fisika, kimia:
   hitung ulang sebelum menentukan kunci.

7. Jangan menambahkan informasi yang tidak didukung.

8. Jika menggunakan visual, visual harus benar-benar relevan.

9. Jika soal mengatakan "lihat gambar", qImage atau needs_image wajib ada.

10. Jika pilihan jawaban berupa gambar:
    optionImages wajib berisi URL gambar yang relevan.

11. Jangan mengarang URL gambar.

12. Jangan membuat URL sumber palsu.

13. Jangan output markdown.

14. Jangan output code fence.

15. Satu soal = satu JSON object.

SKEMA MULTIPLE:

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

correct HARUS angka 0-3.
Jangan memakai huruf A/B/C/D.
Jangan memakai teks jawaban.

SKEMA MULTISELECT:

{
  "type":"multiselect",
  "question":"...",
  "options":["A","B","C","D"],
  "correctAnswers":[0,2],
  "explanation":"..."
}

SKEMA TRUEFALSE:

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

SKEMA SHORTANSWER:

{
  "type":"shortanswer",
  "question":"...",
  "shortAnswer":"...",
  "explanation":"..."
}

SKEMA CAUSEEFFECT:

{
  "type":"causeeffect",
  "question":"...",
  "cause":"...",
  "effect":"...",
  "isCauseTrue":true,
  "isEffectTrue":false,
  "explanation":"..."
}

SKEMA MATCHING:

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

SKEMA READING:

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

VISUAL JAM:

"clock":{
  "hour":8,
  "minute":30
}

VISUAL GRAFIK:

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

FOTO:

"needs_image":true,
"image_keyword":"kata kunci gambar"

TIPE YANG DIIZINKAN:

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
    return res
      .status(405)
      .json({
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
  } =
    req.body || {};

  if (
    !cleanText(
      topic
    )
  ) {
    return res
      .status(400)
      .json({
        error:
          'Topik wajib diisi.',
      });
  }

  if (
    !process.env
      .JINA_API_KEY
  ) {
    return res
      .status(500)
      .json({
        error:
          'JINA_API_KEY belum tersedia. Tambahkan JINA_API_KEY di Vercel Environment Variables.',
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
          'GEMINI_API_KEY belum tersedia. Tambahkan GEMINI_API_KEY di Vercel Environment Variables.',
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
  // 1. SEARCH WEB
  // ==========================================================

  const queries =
    buildResearchQueries({
      topic,
      mapel,
      kelas,
      targetYear:
        year,
      sourceMode:
        mode,
      arahan,
    });

  const allSearchResults =
    [];

  const queryErrors =
    [];

  for (
    const query of queries.slice(
      0,
      SEARCH_QUERIES_PER_REQUEST
    )
  ) {
    try {
      const result =
        await searchJina(
          query
        );

      allSearchResults.push(
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

    // Jangan request bersamaan.
    await sleep(
      300
    );
  }

  const uniqueSources =
    deduplicateSources(
      allSearchResults
    );

  if (
    uniqueSources.length ===
    0
  ) {
    return res
      .status(502)
      .json({
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

  const sourcePages =
    [];

  for (
    const source of uniqueSources.slice(
      0,
      8
    )
  ) {
    const page =
      await readSourcePage(
        source
      );

    sourcePages.push(
      page
    );
  }

  // ==========================================================
  // 3. BUILD SOURCE PACK
  // ==========================================================

  let sourcePack =
    '';

  for (
    let index = 0;
    index <
    sourcePages.length;
    index++
  ) {
    const source =
      sourcePages[
        index
      ];

    const images =
      Array.isArray(
        source.images
      )
        ? source.images
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
            `[IMAGE ${imageIndex}] ${image.url} | ALT: ${image.alt || ''}`
        )
        .join('\n');

    const chunk = `
SOURCE_INDEX: ${index}

TITLE:
${source.title || ''}

URL:
${source.url || ''}

CONTENT:
${(
  source.content ||
  source.snippet ||
  ''
).slice(
  0,
  12000
)}

IMAGES:
${imageList}
`;

    if (
      (
        sourcePack +
        chunk
      ).length >
      MAX_SOURCE_PACK_CHARS
    ) {
      break;
    }

    sourcePack +=
      `${chunk}\n--------------------\n`;
  }

  // ==========================================================
  // 4. GEMINI
  // ==========================================================

  const systemPrompt =
    buildSystemPrompt({
      sourceMode:
        mode,
      targetYear:
        year,
      allowedTypes,
      hotsLevel:
        hotsLevel || '',
    });

  const userPrompt = `
BIMBEL GEMILANG QUESTION RESEARCH

MAPEL:
${mapel || 'Umum'}

KELAS:
${kelas || 'SMP'}

TOPIK:
${cleanText(topic)}

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
SUMBER INTERNET
============================================================

${sourcePack}

============================================================
TUGAS
============================================================

${
  mode ===
  'source'
    ? `
AMBIL SOAL INTERNET.

Pilih soal yang benar-benar terdapat pada sumber.
Pertahankan pertanyaan dan pilihan jika tersedia.
Jika ada soal yang sama dari beberapa sumber,
jangan dipaksa dihapus karena pengulangan dapat
menjadi sinyal frekuensi/pola.

Tetapi:
- jangan mengarang soal yang tidak ada di sumber,
- jangan mengarang URL,
- jangan mengarang gambar.

Setiap soal wajib:
- sourceIndex,
- sourceTitle,
- sourceUrl,
- jawaban benar,
- answerVerification,
- explanation.
`
    : `
PREDIKSI BERBASIS TREN.

Analisis semua sumber.

Cari:
- topik berulang,
- kompetensi berulang,
- model soal berulang,
- HOTS,
- stimulus,
- visual,
- jenis distraktor.

Kemudian buat latihan baru yang representatif.

Jangan menyebutnya bocoran.
Jangan menyatakan pasti keluar tahun ${year}.
`
}

Keluarkan maksimal ${jumlah} soal berkualitas.
Prioritaskan kualitas dan validitas.
`;

  let geminiData;

  try {
    geminiData =
      await callGemini({
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
      '[Gemilang][Gemini]',
      message
    );

    if (
      message.includes(
        '401'
      ) ||
      message.includes(
        '403'
      )
    ) {
      return res
        .status(502)
        .json({
          error:
            'GEMINI_API_KEY ditolak.',
          debug:
            message,
        });
    }

    if (
      message.includes(
        '404'
      )
    ) {
      return res
        .status(502)
        .json({
          error:
            `Model ${GEMINI_MODEL} tidak tersedia untuk project/API key ini.`,
          debug:
            message,
        });
    }

    if (
      message.includes(
        '429'
      )
    ) {
      return res
        .status(429)
        .json({
          error:
            'Kuota gratis Gemini sedang mencapai batas.',
          debug:
            message,
        });
    }

    return res
      .status(502)
      .json({
        error:
          'Gemini gagal menganalisis sumber soal.',
        debug:
          message,
      });
  }

  // ==========================================================
  // 5. EXTRACT GEMINI OUTPUT
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
    return res
      .status(502)
      .json({
        error:
          'Gemini tidak mengembalikan data soal.',
        debug: {
          finishReason:
            candidate?.finishReason ||
            null,

          rawTextLength:
            rawText.length,
        },
      });
  }

  const objects =
    extractJsonObjects(
      rawText
    );

  // ==========================================================
  // 6. QUALITY GATE
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
      `${question.type}|${normalizeText(
        question.question
      )}`;

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
      true;

    question.researchSources =
      sourcePages.map(
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

  // ==========================================================
  // 7. FAILED QUALITY GATE
  // ==========================================================

  if (
    questions.length ===
    0
  ) {
    return res
      .status(502)
      .json({
        error:
          'Sumber internet ditemukan, tetapi tidak ada soal yang lolos quality gate.',

        debug: {
          model:
            GEMINI_MODEL,

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
              1000
            ),
        },

        researchSources:
          sourcePages.map(
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
  // 8. RESPONSE
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

      researchSources:
        sourcePages.map(
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