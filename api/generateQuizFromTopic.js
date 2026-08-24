// api/generateQuizFromTopic.js
// ============================================================
// GEMILANG — STABLE FAST QUESTION ENGINE
// ============================================================

const CLOUDFLARE_MODEL =
  process.env.CLOUDFLARE_MODEL ||
  '@cf/zai-org/glm-4.7-flash';

const MAX_BATCH_QUESTIONS = 3;

const JINA_TIMEOUT_MS = 7000;
const CLOUDFLARE_TIMEOUT_MS = 30000;

const MAX_RESULTS_PER_QUERY = 5;
const MAX_SELECTED_SOURCES = 6;

const MAX_SOURCE_CHARS = 4500;
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
    .replace(/\s+/g, ' ')
    .trim();

const normalizeText = (value = '') =>
  cleanText(value)
    .toLowerCase()
    .replace(
      /[^\p{L}\p{N}\s]/gu,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();

const fingerprint = (value = '') =>
  normalizeText(value)
    .replace(
      /\bsoal\s+\d+\b/g,
      ' '
    )
    .replace(
      /\bnomor\s+\d+\b/g,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();

const fetchWithTimeout = async (
  url,
  options = {},
  timeoutMs = 10000
) => {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
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
// SEARCH
// ============================================================

async function jinaSearch(query) {
  const key =
    process.env.JINA_API_KEY;

  if (!key) {
    throw new Error(
      'JINA_API_KEY belum tersedia.'
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
            `Bearer ${key}`,
          Accept:
            'application/json',
          'User-Agent':
            'BimbelGemilang/Stable',
        },
      },
      JINA_TIMEOUT_MS
    );

  const raw =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `JINA_HTTP_${response.status}: ${raw.slice(
        0,
        300
      )}`
    );
  }

  let parsed;

  try {
    parsed =
      JSON.parse(raw);
  } catch (_) {
    return [];
  }

  const items =
    Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.data)
      ? parsed.data
      : Array.isArray(parsed?.results)
      ? parsed.results
      : [];

  return items
    .slice(
      0,
      MAX_RESULTS_PER_QUERY
    )
    .map((item) => ({
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
    }))
    .filter(
      (item) =>
        item.title ||
        item.url ||
        item.content
    );
}

// ============================================================
// RESEARCH QUERIES
// ============================================================

function buildQueries({
  topic,
  mapel,
  kelas,
  sourceMode,
  targetYear,
}) {
  const base =
    `${cleanText(topic)} ${cleanText(
      mapel
    )} ${cleanText(kelas)}`.trim();

  if (
    sourceMode ===
    'prediction'
  ) {
    return [
      `${base} TKA contoh soal HOTS`,
      `${base} soal tahun sebelumnya ${targetYear}`,
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

  const result = [];

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

    result.push(
      source
    );

    if (
      result.length >=
      MAX_SELECTED_SOURCES
    ) {
      break;
    }
  }

  return result;
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
SOURCE ${i}

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
      MAX_RESEARCH_PACK_CHARS
    ) {
      break;
    }

    output +=
      block +
      '\n----------------\n';
  }

  return output;
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

        body: JSON.stringify({
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
        }),
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

  if (!response.ok) {
    throw new Error(
      `CLOUDFLARE_HTTP_${response.status}: ${
        data?.errors?.[0]
          ?.message ||
        raw.slice(
          0,
          500
        )
      }`
    );
  }

  return data;
}

// ============================================================
// EXTRACT AI TEXT
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
        typeof choice?.message
          ?.content ===
        'string'
          ? choice.message
              .content
          : ''
    )
    .join('\n');
}

// ============================================================
// JSON OBJECT EXTRACTOR
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
    const ch = text[i];

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

    sourceEvidenceScore:
      typeof raw
        .sourceEvidenceScore ===
      'number'
        ? raw.sourceEvidenceScore
        : null,
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
    targetYear,
    hotsLevel,
  } =
    req.body || {};

  if (
    !cleanText(topic)
  ) {
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

  // ==========================================================
  // SEARCH ONLY 2 QUERIES
  // ==========================================================

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

  const allResults = [];

  const queryErrors = [];

  // Jalankan 2 query paralel.
  const results =
    await Promise.allSettled(
      queries.map(
        (query) =>
          jinaSearch(
            query
          )
      )
    );

  results.forEach(
    (
      result,
      index
    ) => {
      if (
        result.status ===
        'fulfilled'
      ) {
        allResults.push(
          ...result.value
        );
      } else {
        queryErrors.push({
          query:
            queries[index],
          error:
            result.reason
              ?.message ||
            'SEARCH_FAILED',
        });
      }
    }
  );

  const sources =
    dedupeSources(
      allResults
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
          'Pencarian internet tidak mengembalikan sumber.',

        debug:
          queryErrors,

        researchProvider:
          'Jina Search',
      });
  }

  const researchPack =
    buildResearchPack(
      sources
    );

  if (
    !researchPack.trim()
  ) {
    return res
      .status(502)
      .json({
        success: false,

        error:
          'Sumber internet kosong setelah diproses.',
      });
  }

  // ==========================================================
  // PROMPT
  // ==========================================================

  const systemPrompt = `
Kamu adalah Asisten Soal Gemilang.

MODE:
${
  mode ===
  'source'
    ? `
AMBIL SOAL DARI INTERNET.

Gunakan soal yang benar-benar ditemukan
pada sumber yang diberikan.

Jangan mengarang URL.
Jangan mengarang sumber.

Jika kunci sumber tidak jelas,
verifikasi secara akademik.
`
    : `
PREDIKSI BERBASIS TREN.

Analisis sumber lalu buat latihan baru
berdasarkan pola kompetensi.

Jangan menyebut sebagai bocoran.
`
}

TARGET:
${year}

HOTS:
${hotsLevel || 'standar'}

WAJIB:
- benar
- relevan
- pembahasan
- verifikasi jawaban
- JSON valid
- maksimal ${jumlah} soal

OUTPUT JSONL:
{"meta":true}

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

correct = indeks 0-3.
`;

  const userPrompt = `
MAPEL:
${mapel || 'Umum'}

KELAS:
${kelas || 'SMP'}

TOPIK:
${cleanText(
    topic
  )}

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

TUGAS:
Buat maksimal ${jumlah} soal valid.

Jangan mengarang jika source mode.
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

    return res
      .status(
        error?.status ===
          429
          ? 429
          : 502
      )
      .json({
        success: false,

        error:
          error?.status ===
          429
            ? 'Kuota harian Cloudflare Workers AI sedang mencapai batas.'
            : 'Cloudflare Workers AI gagal memproses batch.',

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

  const seen =
    new Set();

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

    // cek kemiripan ringan
    let duplicate =
      false;

    for (
      const current of
        questions
    ) {
      if (
        fingerprint(
          current.question
        ) ===
        fp
      ) {
        duplicate =
          true;
        break;
      }
    }

    if (
      duplicate
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
    return res
      .status(502)
      .json({
        success: false,

        error:
          'Tidak ada soal valid yang dikembalikan AI.',

        debug: {
          rawText:
            rawText.slice(
              0,
              1500
            ),

          parsed:
            objects.length,
        },
      });
  }

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
        searchQueries:
          queries.length,

        searchResults:
          allResults.length,

        selectedSources:
          sources.length,

        parsedObjects:
          objects.length,

        queryErrors,
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