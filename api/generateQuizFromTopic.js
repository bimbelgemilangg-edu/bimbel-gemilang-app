// api/generateQuizFromTopic.js
// ============================================================
// BIMBEL GEMILANG — STABLE QUESTION RESEARCH ENGINE
// Jina Search + Cloudflare Workers AI
// ============================================================
//
// DESAIN:
// 1. Search internet secara berurutan.
// 2. Tidak membatalkan Jina terlalu cepat.
// 3. Maksimal 2 query untuk satu batch.
// 4. Gunakan content yang dikembalikan Jina langsung.
// 5. Tidak membuka ulang URL pada tahap ini.
// 6. Maksimal 3 soal per inference untuk stabilitas.
// 7. Dedup lokal sebelum response.
// 8. Cloudflare hanya dipakai untuk pekerjaan bernilai tinggi.
// ============================================================

const CLOUDFLARE_MODEL =
  process.env.CLOUDFLARE_MODEL ||
  '@cf/zai-org/glm-4.7-flash';

const MAX_BATCH_QUESTIONS = 3;

const JINA_TIMEOUT_MS = 20000;
const CLOUDFLARE_TIMEOUT_MS = 30000;

const MAX_RESULTS_PER_QUERY = 5;
const MAX_SOURCES = 6;

const MAX_SOURCE_CHARS = 5000;
const MAX_RESEARCH_PACK_CHARS = 16000;

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

const fingerprint = (
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

const fetchWithTimeout = async (
  url,
  options = {},
  timeoutMs = 20000
) => {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
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
          Authorization:
            `Bearer ${apiKey}`,

          Accept:
            'application/json',

          'User-Agent':
            'BimbelGemilang/3.1',
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
      `JINA_HTTP_${response.status}: ${detail.slice(
        0,
        400
      )}`
    );
  }

  let parsed;

  try {
    parsed =
      JSON.parse(raw);
  } catch (_) {
    throw new Error(
      'JINA_INVALID_JSON'
    );
  }

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
        item.title ||
        item.url ||
        item.content
    );
}

// ============================================================
// QUERY BUILDER
// ============================================================

function buildQueries({
  topic,
  mapel,
  kelas,
  sourceMode,
  targetYear,
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
    sourceMode ===
    'prediction'
  ) {
    return [
      `${base} TKA contoh soal HOTS`,
      `${base} latihan soal ${targetYear}`,
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

  const unique =
    [];

  for (
    const source of
      sources
  ) {
    const key =
      source.url ||
      normalizeText(
        source.title
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

    unique.push(
      source
    );

    if (
      unique.length >=
      MAX_SOURCES
    ) {
      break;
    }
  }

  return unique;
}

// ============================================================
// RESEARCH PACK
// ============================================================

function buildResearchPack(
  sources
) {
  let pack =
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
TITLE: ${source.title}
URL: ${source.url}

CONTENT:
${source.content}

------------------------------
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
// CLOUDFLARE
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

    max_completion_tokens:
      4500,
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
          JSON.stringify(body),
      },
      CLOUDFLARE_TIMEOUT_MS
    );

  const raw =
    await response.text();

  let data =
    null;

  try {
    data =
      JSON.parse(raw);
  } catch (_) {}

  if (!response.ok) {
    const message =
      data?.errors?.[0]
        ?.message ||
      data?.message ||
      raw;

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
// AI OUTPUT
// ============================================================

function extractAIText(
  data
) {
  const choices =
    data?.result?.choices;

  if (
    !Array.isArray(choices)
  ) {
    return '';
  }

  return choices
    .map(
      (choice) =>
        typeof choice
          ?.message
          ?.content ===
        'string'
          ? choice.message
              .content
          : ''
    )
    .join('\n');
}

// ============================================================
// JSON OBJECT EXTRACTION
// ============================================================

function extractJsonObjects(
  text = ''
) {
  const objects =
    [];

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
          objects.push(
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

  return objects;
}

// ============================================================
// VALIDATION
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
      raw.question
    );

  if (!question) {
    return null;
  }

  // Multiple choice
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
      raw.correct < 0 ||
      raw.correct > 3
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

    optionImages:
      Array.isArray(
        raw.optionImages
      )
        ? raw.optionImages
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
      cleanText(
        raw.questionImageUrl ||
          raw.qImage ||
          ''
      ),

    needsImage:
      Boolean(
        raw.needsImage
      ),

    imageHint:
      cleanText(
        raw.imageHint ||
          raw.image_keyword ||
          ''
      ),

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
  } =
    req.body || {};

  // ----------------------------------------------------------
  // ENV
  // ----------------------------------------------------------

  if (
    !cleanText(topic)
  ) {
    return res.status(
      400
    ).json({
      success: false,
      error:
        'Topik wajib diisi.',
    });
  }

  if (
    !process.env.JINA_API_KEY
  ) {
    return res.status(
      500
    ).json({
      success: false,
      error:
        'JINA_API_KEY belum tersedia.',
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
        'CLOUDFLARE_API_TOKEN belum tersedia.',
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
    new Date()
      .getFullYear() +
      1;

  // ----------------------------------------------------------
  // SEARCH QUERIES
  // ----------------------------------------------------------

  const queries =
    buildQueries({
      topic,
      mapel,
      kelas,
      sourceMode:
        mode,
      targetYear:
        year,
    });

  const sources = [];

  const queryErrors = [];

  // ==========================================================
  // SEARCH BERURUTAN
  // ==========================================================
  // Sengaja tidak parallel.
  // Kalau query pertama berhasil, kita sudah punya kandidat.
  // Kalau query kedua gagal, batch tidak langsung batal.
  // ==========================================================

  for (
    const query of
      queries
  ) {
    try {
      const results =
        await searchJina(
          query
        );

      if (
        results.length
      ) {
        sources.push(
          ...results
        );
      }

      // Sudah cukup untuk batch kecil.
      if (
        sources.length >=
        MAX_SOURCES
      ) {
        break;
      }
    } catch (
      error
    ) {
      console.warn(
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
  }

  const uniqueSources =
    dedupeSources(
      sources
    );

  if (
    uniqueSources.length ===
    0
  ) {
    return res
      .status(502)
      .json({
        success: false,

        error:
          'Pencarian internet gagal mendapatkan sumber yang dapat dibaca.',

        debug:
          queryErrors,

        researchProvider:
          'Jina Search',
      });
  }

  // ==========================================================
  // RESEARCH PACK
  // ==========================================================

  const researchPack =
    buildResearchPack(
      uniqueSources
    );

  // ==========================================================
  // SYSTEM PROMPT
  // ==========================================================

  const systemPrompt = `
Kamu adalah Asisten Soal Gemilang.

MODE:
${
  mode ===
  'source'
    ? `
AMBIL SOAL DARI INTERNET.

Hanya gunakan soal yang benar-benar terdapat
dalam sumber yang diberikan.

Jangan mengarang sumber.
Jangan mengarang URL.
Jangan mengarang soal.

Kamu boleh:
- membersihkan format,
- menentukan jawaban,
- memverifikasi,
- memberikan pembahasan.
`
    : `
PREDIKSI BERBASIS TREN.

Gunakan sumber sebagai evidence.
Analisis pola, kompetensi, HOTS,
dan bentuk stimulus.

Buat latihan baru berdasarkan evidence.

Jangan menyebutnya bocoran.
`
}

TARGET:
${year}

HOTS:
${hotsLevel || 'standar'}

OUTPUT:
JSONL saja.

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
"sourceQuestionVerbatim":true
}

correct harus berupa angka 0-3.
`;

  // ==========================================================
  // USER PROMPT
  // ==========================================================

  const userPrompt = `
MAPEL:
${mapel || 'Umum'}

KELAS:
${kelas || 'SMP'}

TOPIK:
${cleanText(topic)}

JUMLAH:
${jumlah}

TIPE:
${allowedTypes.join(
    ', '
  )}

ARAHAN:
${cleanText(
    arahan || ''
  )}

SUMBER INTERNET:
${researchPack}

TASK:
Buat maksimal ${jumlah} soal valid.

Jika mode SOURCE:
ambil soal yang benar-benar ada pada sumber.

Jika mode PREDICTION:
analisis sumber lalu susun latihan baru.

Jangan memaksakan jumlah.
`;

  // ==========================================================
  // CLOUDFLARE
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
      '[Gemilang][Cloudflare]',
      message
    );

    if (
      error?.status ===
      429
    ) {
      return res
        .status(429)
        .json({
          success: false,
          error:
            'Kuota harian Cloudflare Workers AI mencapai batas.',
          debug:
            message,
        });
    }

    return res
      .status(502)
      .json({
        success: false,
        error:
          'Cloudflare Workers AI gagal memproses soal.',
        debug:
          message,
      });
  }

  // ==========================================================
  // PARSE
  // ==========================================================

  const rawText =
    extractAIText(
      aiData
    );

  const objects =
    extractJsonObjects(
      rawText
    );

  const questions = [];
  const seen = new Set();

  for (
    const raw of
      objects
  ) {
    const question =
      validateQuestion(
        raw,
        allowedTypes
      );

    if (
      !question
    ) {
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

    seen.add(fp);

    question
      .researchSources =
      uniqueSources.map(
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
          'AI tidak menghasilkan soal valid.',

        debug: {
          parsed:
            objects.length,

          rawText:
            rawText.slice(
              0,
              1500
            ),
        },

        researchSources:
          uniqueSources.map(
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
  // SUCCESS
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

      researchProvider:
        'Jina Search',

      aiProvider:
        'Cloudflare Workers AI',

      model:
        CLOUDFLARE_MODEL,

      diagnostics: {
        queriesTried:
          queries.length,

        searchResults:
          sources.length,

        selectedSources:
          uniqueSources.length,

        queryErrors,
      },

      researchSources:
        uniqueSources.map(
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