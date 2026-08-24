// api/generateQuizFromTopic.js
// ============================================================
// BIMBEL GEMILANG — ASISTEN SOAL GEMILANG
// PROFESSIONAL RESEARCH QUESTION ENGINE
//
// SEARCH : Tavily Free
// AI     : Cloudflare Workers AI
//
// JINA TIDAK DIPAKAI LAGI
//
// FLOW:
// 1. Search web
// 2. Kumpulkan sumber
// 3. Ranking sederhana
// 4. Dedup sumber
// 5. Research pack kecil
// 6. Cloudflare AI
// 7. Quality Gate
// 8. Dedup pertanyaan
// 9. Return ke ManageQuiz
//
// CATATAN:
// Sistem sengaja membatasi batch agar stabil.
// Orchestrator 40 soal akan dibuat di layer berikutnya.
// ============================================================

const CLOUDFLARE_MODEL =
  process.env.CLOUDFLARE_MODEL ||
  '@cf/zai-org/glm-4.7-flash';

const MAX_BATCH_QUESTIONS = 5;

const TAVILY_TIMEOUT_MS = 18000;
const CLOUDFLARE_TIMEOUT_MS = 40000;

const MAX_SEARCH_RESULTS = 8;
const MAX_SOURCES = 8;

const MAX_SOURCE_CHARS = 7000;
const MAX_RESEARCH_PACK_CHARS = 24000;

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
        (token) =>
          token.length >= 2
      )
  );

const similarity = (
  a,
  b
) => {
  const A =
    tokenSet(a);

  const B =
    tokenSet(b);

  if (
    !A.size ||
    !B.size
  ) {
    return 0;
  }

  let intersection = 0;

  for (
    const item of A
  ) {
    if (
      B.has(item)
    ) {
      intersection += 1;
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

const fetchWithTimeout =
  async (
    url,
    options = {},
    timeoutMs = 20000
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
// TAVILY SEARCH
// ============================================================

async function searchTavily(
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

        body: JSON.stringify({
          api_key:
            apiKey,

          query,

          search_depth:
            'basic',

          topic:
            'general',

          max_results:
            MAX_SEARCH_RESULTS,

          include_answer:
            false,

          include_raw_content:
            false,

          include_images:
            true,
        }),
      },
      TAVILY_TIMEOUT_MS
    );

  const raw =
    await response.text();

  let data =
    null;

  try {
    data =
      JSON.parse(raw);
  } catch (_) {}

  if (
    !response.ok
  ) {
    const message =
      data?.detail ||
      data?.message ||
      raw;

    const error =
      new Error(
        `TAVILY_HTTP_${response.status}: ${message}`
      );

    error.status =
      response.status;

    throw error;
  }

  const results =
    Array.isArray(
      data?.results
    )
      ? data.results
      : [];

  return results
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
          typeof item?.score ===
          'number'
            ? item.score
            : 0,

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
// SEARCH QUERY BUILDER
// ============================================================

function buildQueries({
  topic,
  mapel,
  kelas,
  targetYear,
  sourceMode,
  arahan,
}) {
  const base =
    [
      cleanText(topic),
      cleanText(mapel),
      cleanText(kelas),
    ]
      .filter(Boolean)
      .join(' ');

  const instruction =
    cleanText(arahan);

  if (
    sourceMode ===
    'prediction'
  ) {
    return [
      `${base} TKA kisi kisi kerangka asesmen contoh soal HOTS`,
      `${base} soal tahun sebelumnya latihan prediksi ${targetYear} ${instruction}`,
    ];
  }

  return [
    `${base} contoh soal latihan`,
    `${base} soal TKA HOTS bank soal`,
  ];
}

// ============================================================
// SOURCE DEDUP
// ============================================================

function dedupeSources(
  sources
) {
  const seenUrls =
    new Set();

  const result =
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
      seenUrls.has(key)
    ) {
      continue;
    }

    seenUrls.add(key);

    result.push(
      source
    );
  }

  return result
    .sort(
      (a, b) =>
        Number(
          b.score || 0
        ) -
        Number(
          a.score || 0
        )
    )
    .slice(
      0,
      MAX_SOURCES
    );
}

// ============================================================
// SOURCE PACK
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

    const imageText =
      Array.isArray(
        source.images
      )
        ? source.images
            .slice(
              0,
              6
            )
            .map(
              (
                image
              ) =>
                `IMAGE: ${image}`
            )
            .join('\n')
        : '';

    const block = `
SOURCE_INDEX: ${index}

TITLE:
${source.title}

URL:
${source.url}

SEARCH_SCORE:
${source.score}

CONTENT:
${source.content}

${imageText}

----------------------------------------
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
    throw new Error(
      'CLOUDFLARE_API_TOKEN belum tersedia.'
    );
  }

  if (!accountId) {
    throw new Error(
      'CLOUDFLARE_ACCOUNT_ID belum tersedia.'
    );
  }

  const endpoint =
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CLOUDFLARE_MODEL}`;

  const response =
    await fetchWithTimeout(
      endpoint,
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${token}`,

          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            messages: [
              {
                role:
                  'system',

                content:
                  systemPrompt,
              },

              {
                role:
                  'user',

                content:
                  userPrompt,
              },
            ],

            max_completion_tokens:
              5000,
          }),
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

  if (
    !response.ok
  ) {
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
// AI TEXT
// ============================================================

function extractAIText(
  data
) {
  const choices =
    data?.result?.choices;

  if (
    !Array.isArray(
      choices
    )
  ) {
    return '';
  }

  return choices
    .map(
      (
        choice
      ) =>
        typeof choice
          ?.message
          ?.content ===
        'string'
          ? choice
              .message
              .content
          : ''
    )
    .join(
      '\n'
    );
}

// ============================================================
// JSON EXTRACTOR
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
    const char =
      text[i];

    if (
      escaped
    ) {
      escaped = false;
      continue;
    }

    if (
      char === '\\'
    ) {
      escaped = true;
      continue;
    }

    if (
      char === '"'
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
      char === '{'
    ) {
      if (
        depth === 0
      ) {
        start = i;
      }

      depth += 1;
    }

    if (
      char === '}'
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
      raw.question ||
        ''
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
  }

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
      typeof raw.sourceEvidenceScore ===
      'number'
        ? raw.sourceEvidenceScore
        : null,

    visualRequired:
      Boolean(
        raw.visualRequired
      ),

    visualKind:
      raw.visualKind ||
      'none',
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
Kamu adalah Asisten Soal Gemilang.

TARGET:
${targetYear}

LEVEL:
${hotsLevel || 'standar'}

MODE:
${
  sourceMode ===
  'source'
    ? `
SOURCE MODE.

Gunakan hanya soal yang benar-benar ditemukan
dalam bahan internet.

Jangan mengarang soal seolah berasal
dari sumber.

Jangan mengarang URL.

Jika sumber memuat soal:
- pertahankan struktur,
- tentukan kunci,
- verifikasi,
- berikan pembahasan.

Jika sumber hanya berisi materi atau contoh pola,
jangan mengklaim itu soal sumber.
`
    : `
PREDICTION MODE.

Gunakan sumber sebagai evidence untuk:
- kompetensi,
- topik,
- pola soal,
- HOTS,
- stimulus,
- tren.

Kemudian buat soal latihan baru.

Jangan menyebutnya bocoran.
Jangan menjamin akan muncul.
`
}

ATURAN:
- relevan dengan mapel
- relevan dengan kelas
- relevan dengan topik
- jawaban harus benar
- pembahasan harus jelas
- answerVerification wajib
- analysisSummary wajib
- jangan markdown
- JSONL saja

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
  "optionImages":[],
  "optionsAreImages":false
}

correct harus angka indeks 0-3.

OUTPUT:
{"meta":true}
lalu satu object JSON per soal.

TIPE YANG DIIZINKAN:
${allowedTypes.join(
  ', '
)}
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

  // ----------------------------------------------------------
  // ENV
  // ----------------------------------------------------------

  if (
    !process.env
      .TAVILY_API_KEY
  ) {
    return res.status(
      500
    ).json({
      success: false,
      error:
        'TAVILY_API_KEY belum tersedia di Vercel.',
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
  // INPUT
  // ----------------------------------------------------------

  const cleanTopic =
    cleanText(topic);

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

      sourceMode:
        mode,

      arahan,
    });

  const allResults =
    [];

  const queryErrors =
    [];

  // Search sequential agar mudah dikontrol
  // dan mudah berhenti saat kandidat cukup.

  for (
    const query of
      queries
  ) {
    try {
      const results =
        await searchTavily(
          query
        );

      allResults.push(
        ...results
      );

      if (
        allResults.length >=
        10
      ) {
        break;
      }
    } catch (
      error
    ) {
      console.warn(
        '[Gemilang][Tavily]',
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
        'Riset internet gagal. Sistem tidak membuat fallback seolah-olah berasal dari internet.',

      debug:
        queryErrors,

      researchProvider:
        'Tavily',
    });
  }

  // ----------------------------------------------------------
  // RESEARCH PACK
  // ----------------------------------------------------------

  const researchPack =
    buildResearchPack(
      sources
    );

  // ----------------------------------------------------------
  // PROMPTS
  // ----------------------------------------------------------

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

  const userPrompt = `
ASISTEN SOAL GEMILANG

MAPEL:
${mapel || 'Umum'}

KELAS:
${kelas || 'SMP'}

TOPIK:
${cleanTopic}

JUMLAH:
${jumlah}

ARAHAN:
${cleanText(
    arahan || ''
  )}

RESEARCH:
${researchPack}

TUGAS:
${
  mode ===
  'source'
    ? `
Pilih soal yang benar-benar terdapat
dalam sumber.
`
    : `
Analisis evidence kemudian buat
soal latihan baru.
`
}

Buat maksimal ${jumlah} soal.
Jangan memaksakan jumlah.
`;

  // ----------------------------------------------------------
  // AI
  // ----------------------------------------------------------

  let aiData;

  try {
    aiData =
      await callCloudflare({
        systemPrompt,
        userPrompt,
      });
  } catch (
    error
  ) {
    const message =
      error?.message ||
      String(error);

    console.error(
      '[Gemilang][Cloudflare]',
      message
    );

    return res.status(
      error?.status ===
        429
        ? 429
        : 502
    ).json({
      success: false,

      error:
        error?.status ===
        429
          ? 'Kuota harian Cloudflare Workers AI sedang mencapai batas.'
          : 'Cloudflare Workers AI gagal memproses soal.',

      debug:
        message,
    });
  }

  // ----------------------------------------------------------
  // PARSE
  // ----------------------------------------------------------

  const rawText =
    extractAIText(
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
        'Cloudflare AI tidak mengembalikan data soal.',
    });
  }

  const objects =
    extractJsonObjects(
      rawText
    );

  const questions =
    [];

  const fingerprints =
    new Set();

  let duplicateCount =
    0;

  let rejectedCount =
    0;

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
      rejectedCount +=
        1;

      continue;
    }

    const fp =
      fingerprint(
        question.question
      );

    if (
      fingerprints.has(
        fp
      )
    ) {
      duplicateCount +=
        1;

      continue;
    }

    let nearDuplicate =
      false;

    for (
      const existing of
        questions
    ) {
      if (
        similarity(
          question.question,
          existing.question
        ) >=
        0.88
      ) {
        nearDuplicate =
          true;

        break;
      }
    }

    if (
      nearDuplicate
    ) {
      duplicateCount +=
        1;

      continue;
    }

    fingerprints.add(
      fp
    );

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
    return res.status(
      502
    ).json({
      success: false,

      error:
        'Tidak ada soal yang lolos quality gate.',

      debug: {
        parsedObjects:
          objects.length,

        rejectedCount,

        duplicateCount,

        rawTextSample:
          rawText.slice(
            0,
            1200
          ),
      },
    });
  }

  // ----------------------------------------------------------
  // SUCCESS
  // ----------------------------------------------------------

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

    sourceMode:
      mode,

    researchProvider:
      'Tavily',

    aiProvider:
      'Cloudflare Workers AI',

    model:
      CLOUDFLARE_MODEL,

    diagnostics: {
      queriesTried:
        queries.length,

      searchResults:
        allResults.length,

      selectedSources:
        sources.length,

      parsedObjects:
        objects.length,

      rejectedCount,

      duplicateCount,

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

          score:
            source.score ||
            0,

          images:
            Array.isArray(
              source.images
            )
              ? source.images
              : [],
        })
      ),
  });
}