// api/generateQuizFromTopic.js
// ============================================================
// BIMBEL GEMILANG — QUESTION RESEARCH ENGINE
// ============================================================
//
// SEARCH : Tavily
// AI     : Google Gemini (Free Tier, tanpa kartu)
//
// TIDAK:
// - SiliconFlow
// - Jina
// - Cloudflare direct call
//
// ============================================================

const FREE_AI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

const MAX_BATCH = 5;

const SEARCH_TIMEOUT = 15000;
const AI_TIMEOUT = 30000;

const MAX_RESULTS = 6;
const MAX_SOURCE_CHARS = 5000;
const MAX_PACK_CHARS = 18000;

// ============================================================
// HELPERS
// ============================================================

const cleanText = (
  value = ''
) =>
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

const normalizeText = (
  value = ''
) =>
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

const fingerprint = (
  value = ''
) =>
  normalizeText(value)
    .replace(
      /\bsoal\s+\d+\b/g,
      ''
    )
    .replace(
      /\bnomor\s+\d+\b/g,
      ''
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();

const fetchWithTimeout =
  async (
    url,
    options = {},
    timeoutMs
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
// SEARCH TAVILY
// ============================================================

async function searchWeb(
  query
) {
  const apiKey =
    process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error(
      'TAVILY_API_KEY belum tersedia di Vercel.'
    );
  }

  const response =
    await fetchWithTimeout(
      'https://api.tavily.com/search',
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            api_key:
              apiKey,

            query,

            search_depth:
              'basic',

            topic:
              'general',

            max_results:
              MAX_RESULTS,

            include_answer:
              false,

            include_images:
              true,
          }),
      },
      SEARCH_TIMEOUT
    );

  const raw =
    await response.text();

  let data = null;

  try {
    data =
      JSON.parse(raw);
  } catch (_) {}

  if (!response.ok) {
    throw new Error(
      `TAVILY_HTTP_${response.status}: ${
        data?.detail ||
        data?.message ||
        raw
      }`
    );
  }

  return (
    Array.isArray(
      data?.results
    )
      ? data.results
      : []
  )
    .map(
      (item) => ({
        title:
          cleanText(
            item?.title ||
              ''
          ),

        url:
          cleanText(
            item?.url ||
              ''
          ),

        content:
          cleanText(
            item?.content ||
              ''
          ).slice(
            0,
            MAX_SOURCE_CHARS
          ),

        score:
          Number(
            item?.score ||
              0
          ),

        images:
          Array.isArray(
            item?.images
          )
            ? item.images
            : [],
      })
    )
    .filter(
      (item) =>
        item.url &&
        (
          item.title ||
          item.content
        )
    );
}

// ============================================================
// AI
// ============================================================

async function callAI({
  systemPrompt,
  userPrompt,
}) {
  const apiKey =
    process.env
      .GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY belum tersedia di Vercel.'
    );
  }

  const errors = [];

  for (
    const model of
      FREE_AI_MODELS
  ) {
    try {
      const response =
        await fetchWithTimeout(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                systemInstruction: {
                  parts: [
                    { text: systemPrompt },
                  ],
                },

                contents: [
                  {
                    role: 'user',
                    parts: [
                      { text: userPrompt },
                    ],
                  },
                ],

                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens: 5000,
                  thinkingConfig: {
                    thinkingBudget: 0,
                  },
                },
              }),
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

      if (
        !response.ok
      ) {
        throw new Error(
          data?.error?.message ||
            `Gemini HTTP ${response.status}`
        );
      }

      const text =
        data?.candidates?.[0]
          ?.content
          ?.parts?.[0]
          ?.text || '';

      if (!text.trim()) {
        throw new Error(
          'AI tidak mengembalikan teks.'
        );
      }

      return {
        model,
        text,
      };
    } catch (
      error
    ) {
      errors.push({
        model,
        message:
          error?.message ||
          String(error),
      });
    }
  }

  const error =
    new Error(
      'Semua model AI gratis Gemini gagal.'
    );

  error.details =
    errors;

  throw error;
}

// ============================================================
// QUERIES
// ============================================================

function buildQueries({
  topic,
  mapel,
  kelas,
  targetYear,
  mode,
}) {
  const base =
    [
      cleanText(topic),
      cleanText(mapel),
      cleanText(kelas),
    ]
      .filter(Boolean)
      .join(' ');

  if (
    mode ===
    'prediction'
  ) {
    return [
      `${base} kisi kisi TKA kerangka asesmen`,
      `${base} contoh soal HOTS tahun sebelumnya ${targetYear}`,
    ];
  }

  return [
    `${base} contoh soal`,
    `${base} latihan soal`,
  ];
}

// ============================================================
// SOURCE DEDUP
// ============================================================

function dedupeSources(
  sources
) {
  const seen =
    new Set();

  return sources
    .filter(
      (source) => {
        const key =
          source.url ||
          normalizeText(
            source.title
          );

        if (!key) {
          return false;
        }

        if (
          seen.has(key)
        ) {
          return false;
        }

        seen.add(key);
        return true;
      }
    )
    .sort(
      (a, b) =>
        b.score -
        a.score
    )
    .slice(
      0,
      MAX_RESULTS
    );
}

// ============================================================
// RESEARCH PACK
// ============================================================

function buildPack(
  sources
) {
  let output =
    '';

  sources.forEach(
    (
      source,
      index
    ) => {
      const block = `
SOURCE ${index}

TITLE:
${source.title}

URL:
${source.url}

CONTENT:
${source.content}

`;

      if (
        (
          output +
          block
        ).length >
        MAX_PACK_CHARS
      ) {
        return;
      }

      output +=
        block +
        '\n--------------------\n';
    }
  );

  return output;
}

// ============================================================
// JSONL
// ============================================================

function parseObjects(
  text
) {
  const result = [];

  let depth = 0;
  let start = -1;
  let inString = false;
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
}

// ============================================================
// VALIDATOR
// ============================================================

function validate(
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

  if (!question) {
    return null;
  }

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
      !Number.isInteger(
        raw.correct
      ) ||
      raw.correct <
        0 ||
      raw.correct >
        3
    ) {
      return null;
    }
  }

  return {
    ...raw,

    question,

    options:
      Array.isArray(
        raw.options
      )
        ? raw.options.map(
            cleanText
          )
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

    researchBacked:
      true,

    researchSources:
      [],

    sourceMode:
      raw.sourceMode ||
      'source',

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
  };
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
    return res.status(405).json({
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
  } =
    req.body || {};

  const cleanTopic =
    cleanText(topic);

  if (!cleanTopic) {
    return res.status(400).json({
      success: false,
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
          : 3,
        1
      ),
      MAX_BATCH
    );

  const allowedTypes =
    Array.isArray(types) &&
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

  // ----------------------------------------------------------
  // SEARCH
  // ----------------------------------------------------------

  const queries =
    buildQueries({
      topic:
        cleanTopic,

      mapel,
      kelas,
      targetYear:
        year,
      mode,
    });

  const rawSources =
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

      rawSources.push(
        ...result
      );
    } catch (
      error
    ) {
      searchErrors.push({
        query,
        error:
          error?.message ||
          String(error),
      });
    }
  }

  const sources =
    dedupeSources(
      rawSources
    );

  if (
    sources.length ===
    0
  ) {
    return res.status(502).json({
      success: false,

      error:
        'Riset internet gagal. Sistem TIDAK membuat soal seolah-olah berasal dari internet.',

      debug:
        searchErrors,
    });
  }

  const researchPack =
    buildPack(
      sources
    );

  // ----------------------------------------------------------
  // SYSTEM
  // ----------------------------------------------------------

  const systemPrompt = `
Kamu adalah Asisten Soal Gemilang.

MAPEL:
${mapel || 'Umum'}

KELAS:
${kelas || 'SMP'}

TARGET:
${year}

MODE:
${
  mode ===
  'source'
    ? `
SOURCE MODE.

Gunakan soal yang benar-benar ditemukan
pada sumber.

Jangan mengarang URL.
Jangan mengarang soal.
Jangan mengklaim sumber yang tidak diberikan.

Verifikasi kunci dan buat pembahasan.
`
    : `
PREDICTION MODE.

Analisis evidence internet:
- kompetensi
- pola
- frekuensi
- HOTS
- bentuk stimulus

Kemudian susun latihan baru.

Jangan mengklaim bocoran.
`
}

OUTPUT JSONL.

SCHEMA MULTIPLE:

{
  "type":"multiple",
  "question":"...",
  "options":["A","B","C","D"],
  "correct":0,
  "explanation":"...",
  "answerVerification":"...",
  "analysisSummary":"...",
  "sourceTitle":"...",
  "sourceUrl":"...",
  "sourceMode":"${mode}"
}

correct harus angka indeks 0-3.

Maksimal ${jumlah} soal.

TIPE:
${allowedTypes.join(
  ', '
)}
`;

  const userPrompt = `
TOPIK:
${cleanTopic}

ARAHAN:
${cleanText(
    arahan ||
      ''
  )}

HOTS:
${hotsLevel || 'standar'}

RESEARCH SOURCES:
${researchPack}

Buat maksimal ${jumlah} soal valid.
`;

  // ----------------------------------------------------------
  // AI
  // ----------------------------------------------------------

  let ai;

  try {
    ai =
      await callAI({
        systemPrompt,
        userPrompt,
      });
  } catch (
    error
  ) {
    console.error(
      '[Gemilang][Gemini]',
      error
    );

    return res.status(
      503
    ).json({
      success: false,

      error:
        'Semua model AI gratis Gemini tidak tersedia saat ini. Sistem tidak menggunakan model berbayar.',

      debug:
        error?.details ||
        error?.message ||
        String(error),
    });
  }

  // ----------------------------------------------------------
  // PARSE
  // ----------------------------------------------------------

  const objects =
    parseObjects(
      ai.text
    );

  const questions =
    [];

  const seen =
    new Set();

  for (
    const raw of
      objects
  ) {
    const question =
      validate(
        raw,
        allowedTypes
      );

    if (!question) {
      continue;
    }

    const fp =
      fingerprint(
        question.question
      );

    if (
      seen.has(fp)
    ) {
      continue;
    }

    let similarDuplicate =
      false;

    for (
      const existing of
        questions
    ) {
      const A =
        new Set(
          normalizeText(
            existing.question
          ).split(' ')
        );

      const B =
        new Set(
          normalizeText(
            question.question
          ).split(' ')
        );

      let same = 0;

      for (
        const token of A
      ) {
        if (
          B.has(token)
        ) {
          same++;
        }
      }

      const union =
        new Set([
          ...A,
          ...B,
        ]).size;

      const score =
        union
          ? same / union
          : 0;

      if (
        score >=
        0.88
      ) {
        similarDuplicate =
          true;

        break;
      }
    }

    if (
      similarDuplicate
    ) {
      continue;
    }

    seen.add(fp);

    question
      .researchSources =
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
    return res.status(502).json({
      success: false,

      error:
        'AI tidak menghasilkan soal valid.',

      debug: {
        parsed:
          objects.length,

        sample:
          ai.text.slice(
            0,
            1500
          ),
      },
    });
  }

  return res.status(200).json({
    success: true,

    questions,

    requestedCount:
      jumlah,

    returnedCount:
      questions.length,

    maxBatchSize:
      MAX_BATCH,

    sourceMode:
      mode,

    researchProvider:
      'Tavily',

    aiProvider:
      'Gemini',

    model:
      ai.model,

    zeroBillingMode:
      true,

    researchSources:
      sources.map(
        (source) => ({
          title:
            source.title ||
            '',

          url:
            source.url ||
            '',

          score:
            source.score ||
            0,

          images:
            source.images ||
            [],
        })
      ),
  });
}