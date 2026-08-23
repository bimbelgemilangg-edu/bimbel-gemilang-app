// api/generateQuizFromTopic.js
// ============================================================
// BIMBEL GEMILANG — QUESTION RESEARCH ENGINE
// ============================================================
// SEMUA MODE WAJIB INTERNET.
//
// sourceMode:
//   "source"     = ambil soal yang benar-benar dipublikasikan
//                  dari sumber web yang ditemukan.
//   "prediction" = riset banyak sumber -> analisis pola ->
//                  susun soal latihan baru.
//
// Tidak ada mode offline ketika endpoint ini dipakai.
// ============================================================

const GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  'gemini-3.5-flash';

const MAX_BATCH = 10;
const GEMINI_TIMEOUT = 70000;
const SEARCH_TIMEOUT = 20000;
const PAGE_TIMEOUT = 15000;

const sleep = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );

// ============================================================
// BASIC
// ============================================================

const clean = (value = '') =>
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

const normalize = (value = '') =>
  clean(value)
    .toLowerCase()
    .replace(
      /[^\p{L}\p{N}\s]/gu,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();

const isNum = (v) =>
  typeof v === 'number' &&
  Number.isFinite(v);

const validIndex = (
  value,
  min,
  max
) =>
  Number.isInteger(value) &&
  value >= min &&
  value <= max;

const fetchTimeout = async (
  url,
  options = {},
  timeout = 20000
) => {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () => controller.abort(),
      timeout
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
// FREE SEARCH
// ============================================================

const decodeHtml = (value = '') =>
  String(value)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const parseSearchResults = (
  html = ''
) => {
  const results = [];
  const seen = new Set();

  // DuckDuckGo HTML
  const regex =
    /<a[^>]+class=["'][^"']*result__a[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match;

  while (
    (match =
      regex.exec(html)) &&
    results.length < 10
  ) {
    let url =
      decodeHtml(
        match[1] || ''
      );

    const title =
      clean(match[2] || '');

    if (!url || !title)
      continue;

    try {
      const parsed =
        new URL(
          url.startsWith('//')
            ? `https:${url}`
            : url
        );

      const original =
        parsed.searchParams.get(
          'uddg'
        );

      if (original)
        url = original;
    } catch (_) {}

    if (seen.has(url))
      continue;

    seen.add(url);

    results.push({
      title,
      url,
      snippet: '',
    });
  }

  const snippets = [];

  const snippetRegex =
    /<(?:a|div)[^>]+class=["'][^"']*result__snippet[^"']*["'][^>]*>([\s\S]*?)<\/(?:a|div)>/gi;

  let snippet;

  while (
    (snippet =
      snippetRegex.exec(html)) &&
    snippets.length < 10
  ) {
    snippets.push(
      clean(
        snippet[1] || ''
      )
    );
  }

  results.forEach(
    (item, index) => {
      item.snippet =
        snippets[index] ||
        '';
    }
  );

  return results;
};

const searchWeb =
  async (query) => {
    const body =
      new URLSearchParams({
        q: query,
      }).toString();

    const endpoints = [
      'https://html.duckduckgo.com/html/',
      'https://lite.duckduckgo.com/lite/',
    ];

    let lastError =
      null;

    for (
      const endpoint of endpoints
    ) {
      try {
        const response =
          await fetchTimeout(
            endpoint,
            {
              method: 'POST',

              headers: {
                'User-Agent':
                  'Mozilla/5.0',
                Accept:
                  'text/html',
                'Content-Type':
                  'application/x-www-form-urlencoded',
              },

              body,
            },
            SEARCH_TIMEOUT
          );

        const html =
          await response.text();

        if (!response.ok)
          throw new Error(
            `SEARCH_HTTP_${response.status}`
          );

        const results =
          parseSearchResults(
            html
          );

        if (
          results.length
        ) {
          return results;
        }

        throw new Error(
          'SEARCH_NO_RESULTS'
        );
      } catch (error) {
        lastError =
          error;
      }
    }

    throw (
      lastError ||
      new Error(
        'SEARCH_FAILED'
      )
    );
  };

// ============================================================
// PAGE READER
// ============================================================

const absoluteUrl = (
  src,
  base
) => {
  if (!src)
    return '';

  try {
    return new URL(
      src,
      base
    ).href;
  } catch (_) {
    return '';
  }
};

const readPage = async (
  result
) => {
  try {
    const response =
      await fetchTimeout(
        result.url,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0',
            Accept:
              'text/html,application/xhtml+xml',
          },
        },
        PAGE_TIMEOUT
      );

    if (!response.ok)
      return {
        ...result,
        content: '',
        images: [],
      };

    const html =
      await response.text();

    const titleMatch =
      html.match(
        /<title[^>]*>([\s\S]*?)<\/title>/i
      );

    const title =
      titleMatch
        ? clean(titleMatch[1])
        : result.title;

    // OG image
    const images = [];

    const ogRegex =
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi;

    let og;

    while (
      (og =
        ogRegex.exec(html)) &&
      images.length < 20
    ) {
      const url =
        absoluteUrl(
          decodeHtml(og[1]),
          result.url
        );

      if (url)
        images.push({
          url,
          alt:
            'OpenGraph image',
        });
    }

    // HTML images
    const imgRegex =
      /<img\b[^>]*>/gi;

    let img;

    while (
      (img =
        imgRegex.exec(html)) &&
      images.length < 30
    ) {
      const tag =
        img[0];

      const srcMatch =
        tag.match(
          /(?:src|data-src)=["']([^"']+)["']/i
        );

      if (!srcMatch)
        continue;

      const url =
        absoluteUrl(
          decodeHtml(
            srcMatch[1]
          ),
          result.url
        );

      if (!url)
        continue;

      const altMatch =
        tag.match(
          /alt=["']([^"']*)["']/i
        );

      images.push({
        url,
        alt:
          clean(
            altMatch
              ? altMatch[1]
              : ''
          ),
      });
    }

    const text =
      clean(
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

    return {
      title,
      url: result.url,
      content:
        text.slice(
          0,
          18000
        ),
      images:
        images.filter(
          (item, index, arr) =>
            index ===
            arr.findIndex(
              (x) =>
                x.url ===
                item.url
            )
        ),
    };
  } catch (_) {
    return {
      ...result,
      content: '',
      images: [],
    };
  }
};

// ============================================================
// VISUAL HELPERS
// ============================================================

const hasVisualCue =
  (text = '') => {
    const t =
      normalize(text);

    return [
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
    ].some(
      (x) =>
        t.includes(
          normalize(x)
        )
    );
  };

const makeClock =
  (clock) => {
    if (
      !clock ||
      !isNum(clock.hour) ||
      !isNum(clock.minute)
    )
      return '';

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
    const radius = 112;

    const point =
      (
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
x1="${outer.x}"
y1="${outer.y}"
x2="${inner.x}"
y2="${inner.y}"
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
          const n =
            i === 0
              ? 12
              : i;

          const p =
            point(
              i * 30,
              radius - 25
            );

          return `
<text
x="${p.x}"
y="${p.y + 6}"
text-anchor="middle"
font-family="Arial"
font-size="18"
font-weight="700"
fill="#1e293b">${n}</text>`;
        }
      ).join('');

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg"
viewBox="0 0 280 280"
width="280"
height="280">
<rect width="280" height="280" fill="white"/>
<circle cx="140" cy="140" r="${radius}"
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
      Buffer.from(
        svg
      ).toString(
        'base64'
      )
    );
  };

// ============================================================
// JSON EXTRACTION
// ============================================================

const extractJson =
  (text = '') => {
    const out = [];
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

      if (inString)
        continue;

      if (ch === '{') {
        if (depth === 0)
          start = i;

        depth++;
      }

      if (ch === '}') {
        depth--;

        if (
          depth === 0 &&
          start !== -1
        ) {
          try {
            out.push(
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

    return out;
  };

// ============================================================
// GEMINI
// ============================================================

const callGemini =
  async (
    systemPrompt,
    userPrompt
  ) => {
    if (
      !process.env
        .GEMINI_API_KEY
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
        temperature: 0.15,
        topP: 0.9,
        maxOutputTokens:
          14000,
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

          body:
            JSON.stringify(
              body
            ),
        },
        GEMINI_TIMEOUT
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

      throw new Error(
        `GEMINI_HTTP_${response.status}: ${detail}`
      );
    }

    return JSON.parse(
      raw
    );
  };

// ============================================================
// RESEARCH QUERY
// ============================================================

const buildQueries = ({
  topic,
  mapel,
  kelas,
  targetYear,
  sourceMode,
}) => {
  const base =
    `${topic} ${mapel || ''} ${kelas || ''}`;

  if (
    sourceMode ===
    'prediction'
  ) {
    return [
      `${base} TKA soal`,
      `${base} contoh soal HOTS`,
      `${base} soal tahun sebelumnya`,
      `${base} latihan ujian`,
    ];
  }

  return [
    `${base} soal asli`,
    `${base} contoh soal`,
    `${base} bank soal`,
    `${base} TKA latihan`,
  ];
};

// ============================================================
// SYSTEM PROMPT
// ============================================================

const buildPrompt = ({
  sourceMode,
  targetYear,
  types,
}) => `
Kamu adalah Question Research Engine Bimbel Gemilang.

SEMUA SOAL HARUS BERBASIS SUMBER INTERNET YANG DIKIRIM
DALAM DATA RISET.

MODE:
${
  sourceMode === 'source'
    ? `
AMBIL SOAL DARI INTERNET.

ATURAN:
- Pilih soal yang BENAR-BENAR terdapat pada isi sumber.
- Jangan mengarang soal sumber.
- Pertahankan pertanyaan dan pilihan sebagaimana sumber.
- Pertahankan struktur visual jika tersedia.
- Tandai sourceIndex.
- Jawaban dan pembahasan harus dianalisis/ditambahkan.
- Bila jawaban tidak dapat diverifikasi, JANGAN masukkan soal.
- Soal yang sama dari banyak sumber boleh muncul.
`
    : `
PREDIKSI BERBASIS TREN INTERNET.

ATURAN:
- Analisis banyak sumber.
- Identifikasi topik/kompetensi yang sering muncul.
- Identifikasi pola HOTS dan stimulus.
- Identifikasi jenis visual yang sering digunakan.
- Susun soal latihan BARU berdasarkan pola tersebut.
- Jangan mengklaim sebagai bocoran.
- Jangan mengklaim mengetahui soal ujian sebenarnya.
`
}

TARGET:
${targetYear}

TIPE:
${types.join(', ')}

ATURAN VERIFIKASI:

1. Tentukan jawaban benar sebelum soal dikembalikan.
2. Periksa ulang hitungan.
3. Buat pembahasan detail.
4. Jelaskan mengapa jawaban benar.
5. Jelaskan mengapa distraktor penting/keliru bila relevan.
6. Bila soal bergambar, pastikan gambar benar-benar dibutuhkan.
7. Jangan menggunakan gambar acak.
8. Bila pilihan jawaban berupa gambar, keluarkan optionImageUrls.
9. Gunakan sourceImageUrls hanya dari sumber yang tersedia.
10. Jangan mengarang URL gambar.

SKEMA JSON:

{
  "type":"multiple",
  "question":"...",
  "options":["A","B","C","D"],
  "correct":0,
  "explanation":"...",
  "answerVerification":"...",
  "analysisSummary":"...",
  "sourceIndex":0,
  "sourceQuestionVerbatim":true,
  "questionImageUrl":"https://...",
  "optionImageUrls":[
    "https://...",
    "https://...",
    "https://..."
  ],
  "optionsAreImages":false
}

Untuk soal sumber internet:
- question harus berasal dari sumber.
- sourceQuestionVerbatim = true.
- sourceIndex wajib.

Untuk prediksi:
- sourceQuestionVerbatim = false.
- sourceIndex dapat menunjuk sumber/pola utama.

Untuk jam:
"clock":{"hour":8,"minute":30}

Jika soal membutuhkan foto/diagram yang tidak tersedia:
"needsImage":true,
"imageHint":"kata kunci gambar"

Jangan output markdown.
Jangan output code fence.
Satu soal = satu JSON object.
`;

// ============================================================
// VALIDATION
// ============================================================

const validateQuestion = (
  raw,
  allowedTypes,
  sources,
  sourceMode
) => {
  if (
    !raw ||
    !allowedTypes.includes(
      raw.type
    )
  )
    return null;

  const question =
    clean(
      raw.question ||
        ''
    );

  if (!question)
    return null;

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
    )
      return null;

    if (
      !validIndex(
        raw.correct,
        0,
        3
      )
    )
      return null;
  }

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
    )
      return null;

    if (
      !Array.isArray(
        raw.correctAnswers
      ) ||
      !raw.correctAnswers.length
    )
      return null;
  }

  if (
    raw.type ===
    'truefalse' &&
    (
      !Array.isArray(
        raw.statements
      ) ||
      raw.statements.length <
        2
    )
  )
    return null;

  if (
    raw.type ===
    'shortanswer' &&
    !clean(
      raw.shortAnswer
    )
  )
    return null;

  if (
    raw.type ===
      'causeeffect' &&
    (
      !clean(raw.cause) ||
      !clean(raw.effect) ||
      typeof raw.isCauseTrue !==
        'boolean' ||
      typeof raw.isEffectTrue !==
        'boolean'
    )
  )
    return null;

  if (
    raw.type ===
      'matching' &&
    (
      !Array.isArray(
        raw.matchingPairs
      ) ||
      raw.matchingPairs.length <
        3
    )
  )
    return null;

  if (
    raw.type ===
      'reading' &&
    (
      !clean(
        raw.readingText
      ) ||
      !Array.isArray(
        raw.subQuestions
      ) ||
      raw.subQuestions.length <
        3
    )
  )
    return null;

  // DIRECT SOURCE MODE:
  // wajib benar-benar berasal dari isi halaman.
  let source = null;

  if (
    sourceMode ===
    'source'
  ) {
    if (
      !Number.isInteger(
        raw.sourceIndex
      )
    )
      return null;

    source =
      sources[
        raw.sourceIndex
      ];

    if (!source)
      return null;

    const pageText =
      normalize(
        source.content
      );

    const questionText =
      normalize(
        question
      );

    // Guard terhadap hallucination:
    // pertanyaan harus dapat ditemukan
    // di teks halaman sumber.
    if (
      questionText.length >=
        25 &&
      !pageText.includes(
        questionText
      )
    ) {
      return null;
    }
  }

  let qImage =
    clean(
      raw.questionImageUrl ||
        ''
    );

  let visualKind =
    qImage
      ? 'source-photo'
      : 'none';

  if (
    raw.clock
  ) {
    qImage =
      makeClock(
        raw.clock
      );

    visualKind =
      'clock';
  }

  const optionImages =
    Array.isArray(
      raw.optionImageUrls
    )
      ? raw.optionImageUrls.map(
          (url) =>
            clean(url)
        )
      : [];

  const optionsAreImages =
    optionImages.length >= 2 &&
    optionImages.some(
      Boolean
    );

  const needsImage =
    Boolean(
      raw.needsImage
    );

  const visualRequired =
    Boolean(
      qImage ||
        optionsAreImages ||
        needsImage ||
        hasVisualCue(
          question
        )
    );

  if (
    visualRequired &&
    !qImage &&
    !optionsAreImages &&
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
            clean
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
      clean(
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
      clean(
        raw.shortAnswer ||
          ''
      ),

    cause:
      clean(
        raw.cause ||
          ''
      ),

    effect:
      clean(
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
      clean(
        raw.explanation ||
          ''
      ),

    answerVerification:
      clean(
        raw.answerVerification ||
          ''
      ),

    analysisSummary:
      clean(
        raw.analysisSummary ||
          ''
      ),

    qImage,

    needsImage,

    imageHint:
      clean(
        raw.imageHint ||
          ''
      ),

    researchBacked:
      true,

    researchSources:
      sourceMode ===
      'source'
        ? [
            {
              title:
                source.title,
              url:
                source.url,
            },
          ]
        : sources.map(
            (item) => ({
              title:
                item.title,
              url:
                item.url,
            })
          ),

    sourceMode,

    sourceIndex:
      Number.isInteger(
        raw.sourceIndex
      )
        ? raw.sourceIndex
        : null,

    sourceQuestionVerbatim:
      Boolean(
        raw.sourceQuestionVerbatim
      ),

    sourceTitle:
      source?.title ||
      '',

    sourceUrl:
      source?.url ||
      '',

    visualRequired,

    visualKind,
  };
};

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

  if (
    !process.env
      .GEMINI_API_KEY
  ) {
    return res
      .status(500)
      .json({
        error:
          'GEMINI_API_KEY belum tersedia.',
      });
  }

  const {
    topic,
    mapel,
    kelas,
    jumlahSoal,
    types,
    arahan,
    targetYear,
    hotsLevel,
    sourceMode,
  } =
    req.body || {};

  if (
    !clean(topic)
  ) {
    return res
      .status(400)
      .json({
        error:
          'Topik wajib diisi.',
      });
  }

  const mode =
    sourceMode ===
    'prediction'
      ? 'prediction'
      : 'source';

  const count =
    Math.min(
      Math.max(
        parseInt(
          jumlahSoal,
          10
        ) || 5,
        1
      ),
      MAX_BATCH
    );

  const allowedTypes =
    Array.isArray(
      types
    ) &&
    types.length
      ? types
      : ['multiple'];

  const year =
    targetYear ||
    new Date().getFullYear() +
      1;

  // ----------------------------------------------------------
  // SEARCH
  // ----------------------------------------------------------

  const queries =
    buildQueries({
      topic,
      mapel,
      kelas,
      targetYear:
        year,
      sourceMode:
        mode,
    });

  const searchResults =
    [];

  const searchErrors =
    [];

  for (
    const query of
      queries
  ) {
    try {
      const result =
        await searchWeb(
          query
        );

      searchResults.push(
        ...result
      );
    } catch (
      error
    ) {
      searchErrors.push({
        query,
        error:
          error.message,
      });
    }

    await sleep(
      500
    );
  }

  // Deduplicate
  const seen =
    new Set();

  const uniqueSearch =
    searchResults.filter(
      (item) => {
        if (
          !item.url
        )
          return false;

        if (
          seen.has(
            item.url
          )
        )
          return false;

        seen.add(
          item.url
        );

        return true;
      }
    );

  if (
    uniqueSearch.length ===
    0
  ) {
    return res
      .status(502)
      .json({
        error:
          'Sistem tidak menemukan sumber internet yang dapat dibaca.',
        debug:
          searchErrors,
      });
  }

  // ----------------------------------------------------------
  // READ ACTUAL PAGES
  // ----------------------------------------------------------

  const pageResults =
    [];

  for (
    const result of
      uniqueSearch.slice(
        0,
        8
      )
  ) {
    const page =
      await readPage(
        result
      );

    if (
      page.content &&
      page.content.length >
        100
    ) {
      pageResults.push(
        page
      );
    }
  }

  if (
    pageResults.length ===
    0
  ) {
    return res
      .status(502)
      .json({
        error:
          'Sumber ditemukan, tetapi halaman sumber tidak dapat dibaca.',
      });
  }

  // ----------------------------------------------------------
  // RESEARCH PACK
  // ----------------------------------------------------------

  const sourcePack =
    pageResults
      .map(
        (
          page,
          index
        ) => `
SOURCE_INDEX: ${index}

TITLE:
${page.title}

URL:
${page.url}

PAGE_TEXT:
${page.content.slice(
  0,
  15000
)}

IMAGE_ASSETS:
${page.images
  .slice(0, 20)
  .map(
    (img, imgIndex) =>
      `[${imgIndex}] ${img.url} | ALT: ${img.alt}`
  )
  .join('\n')}
`
      )
      .join(
        '\n-----------------\n'
      );

  const systemPrompt =
    buildPrompt({
      sourceMode:
        mode,
      targetYear:
        year,
      types:
        allowedTypes,
    });

  const userPrompt = `
BIMBEL GEMILANG

MAPEL:
${mapel || 'Umum'}

KELAS:
${kelas || 'SMP'}

TOPIK:
${clean(topic)}

TARGET:
${year}

JUMLAH:
${count}

TIPE:
${allowedTypes.join(
  ', '
)}

HOTS:
${hotsLevel || 'standar'}

ARAHAN GURU:
${clean(
  arahan || ''
)}

DATA SUMBER INTERNET:
${sourcePack}

${
  mode ===
  'source'
    ? `
TUGAS:
Ambil ${count} soal yang benar-benar terdapat pada sumber.
JANGAN membuat soal baru.

Untuk setiap soal:
- sourceIndex wajib
- pertanyaan berasal dari sumber
- pilihan berasal dari sumber
- jika ada gambar soal, pilih URL yang memang terdapat pada halaman
- jika pilihan merupakan gambar, gunakan optionImageUrls
- tentukan kunci
- berikan verifikasi
- berikan pembahasan detail
`
    : `
TUGAS PREDIKSI:
Kumpulkan pola dari semua sumber.
Identifikasi kompetensi yang sering muncul.
Identifikasi HOTS.
Identifikasi stimulus visual.
Kemudian susun ${count} soal latihan baru.

Soal tidak boleh diklaim sebagai bocoran.
`
}

OUTPUT:
Baris pertama:
{"meta":true}

Setiap baris berikutnya:
satu object JSON.

Jangan output penjelasan di luar JSON.
`;

  // ----------------------------------------------------------
  // GEMINI
  // ----------------------------------------------------------

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
    return res
      .status(
        String(
          error.message
        ).includes(
          '429'
        )
          ? 429
          : 502
      )
      .json({
        error:
          'Gemini gagal menganalisis hasil riset.',
        debug:
          error.message,
      });
  }

  const candidate =
    gemini
      ?.candidates?.[0];

  const rawText =
    candidate
      ?.content
      ?.parts
      ?.map(
        (part) =>
          part?.text || ''
      )
      .join('\n') ||
    '';

  const objects =
    extractJson(
      rawText
    );

  const questions =
    [];

  const fingerprints =
    new Set();

  for (
    const raw of
      objects
  ) {
    const question =
      validateQuestion(
        raw,
        allowedTypes,
        pageResults,
        mode
      );

    if (
      !question
    )
      continue;

    const fingerprint =
      normalize(
        question.question
      );

    if (
      fingerprints.has(
        fingerprint
      )
    )
      continue;

    fingerprints.add(
      fingerprint
    );

    questions.push(
      question
    );

    if (
      questions.length >=
      count
    )
      break;
  }

  if (
    questions.length ===
    0
  ) {
    return res
      .status(502)
      .json({
        error:
          mode ===
          'source'
            ? 'Tidak ada soal internet yang lolos verifikasi sumber.'
            : 'Tidak ada soal prediksi yang lolos quality gate.',
        debug: {
          parsed:
            objects.length,
          rawText:
            rawText.slice(
              0,
              1000
            ),
        },

        researchSources:
          pageResults.map(
            (page) => ({
              title:
                page.title,
              url:
                page.url,
            })
          ),
      });
  }

  return res
    .status(200)
    .json({
      success:
        true,

      sourceMode:
        mode,

      questions,

      requestedCount:
        count,

      returnedCount:
        questions.length,

      maxBatchSize:
        MAX_BATCH,

      researchSources:
        pageResults.map(
          (page) => ({
            title:
              page.title,
            url:
              page.url,
          })
        ),

      model:
        GEMINI_MODEL,
    });
}