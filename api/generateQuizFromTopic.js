// Bimbel Gemilang - Professional Question Research Engine
// Jina Search -> readable sources -> Cloudflare Workers AI -> validation -> dedup

const MODEL =
  process.env.CLOUDFLARE_MODEL ||
  '@cf/zai-org/glm-4.7-flash';

const MAX_BATCH = 20;

const JINA_TIMEOUT = 30000;
const PAGE_TIMEOUT = 18000;
const AI_TIMEOUT = 70000;

const MAX_RESULTS = 10;
const MAX_SOURCES = 20;
const MAX_SOURCE_CHARS = 9000;
const MAX_RESEARCH_PACK_CHARS = 60000;

// ============================================================
// TEXT HELPERS
// ============================================================

const clean = (v = '') =>
  String(v ?? '')
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

const norm = (v = '') =>
  clean(v)
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

const fp = (v = '') =>
  norm(v)
    .replace(
      /\b(soal|nomor)\s+\d+\b/g,
      ''
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();

// ============================================================
// FETCH WITH TIMEOUT
// ============================================================

async function fetchTimeout(
  url,
  options = {},
  timeoutMs = 30000
) {
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
}

// ============================================================
// JINA SEARCH
// ============================================================

async function jinaSearch(
  query
) {
  const key =
    process.env.JINA_API_KEY;

  if (!key) {
    throw new Error(
      'JINA_API_KEY belum tersedia di Vercel.'
    );
  }

  const response =
    await fetchTimeout(
      `https://s.jina.ai/?q=${encodeURIComponent(
        query
      )}`,
      {
        headers: {
          Accept:
            'application/json',

          Authorization:
            `Bearer ${key}`,

          'User-Agent':
            'BimbelGemilangResearch/2.0',
        },
      },
      JINA_TIMEOUT
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
          MAX_RESULTS
        )
        .map(
          (item) => ({
            title:
              clean(
                item?.title ||
                  item?.name ||
                  ''
              ),

            url:
              clean(
                item?.url ||
                  item?.link ||
                  ''
              ),

            content:
              clean(
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

  return raw.trim()
    ? [
        {
          title:
            'Jina Search Result',

          url:
            '',

          content:
            raw.slice(
              0,
              MAX_SOURCE_CHARS
            ),
        },
      ]
    : [];
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
      `${t} ${m} ${k} contoh soal`,

      `${t} ${m} ${k} soal HOTS`,

      `${t} ${m} ${k} soal tahun sebelumnya`,

      `${t} ${m} TKA ${y} latihan ${a}`,
    ]
      .map(clean)
      .filter(Boolean);
  }

  return [
    `${t} ${m} ${k} soal`,

    `${t} ${m} ${k} contoh soal`,

    `${t} ${m} ${k} latihan TKA`,

    `${t} ${m} ${k} bank soal`,
  ]
    .map(clean)
    .filter(Boolean);
}

// ============================================================
// SOURCE DEDUP
// ============================================================

function dedupeSources(
  items
) {
  const seen =
    new Set();

  return items
    .filter((item) => {
      const key =
        norm(
          item?.url ||
            item?.title ||
            item?.content?.slice(
              0,
              300
            ) ||
            ''
        );

      if (
        !key ||
        seen.has(key)
      ) {
        return false;
      }

      seen.add(
        key
      );

      return true;
    })
    .slice(
      0,
      MAX_SOURCES
    );
}

// ============================================================
// READ SOURCE PAGE
// ============================================================

async function readPage(
  source
) {
  if (
    !source?.url
  ) {
    return source;
  }

  try {
    const response =
      await fetchTimeout(
        source.url,
        {
          headers: {
            Accept:
              'text/html,application/xhtml+xml',

            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/151 Safari/537.36',
          },
        },
        PAGE_TIMEOUT
      );

    if (
      !response.ok
    ) {
      return source;
    }

    const html =
      await response.text();

    if (
      html.length <
      200
    ) {
      return source;
    }

    const titleMatch =
      html.match(
        /<title[^>]*>([\s\S]*?)<\/title>/i
      );

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
            /<script[\s\S]*?<\/script>/gi,
            ' '
          )
          .replace(
            /<style[\s\S]*?<\/style>/gi,
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

    // --------------------------------------------------------
    // IMAGE ASSETS
    // --------------------------------------------------------

    const images =
      [];

    const regex =
      /<img\b[^>]*>/gi;

    let match;

    while (
      (match =
        regex.exec(
          html
        )) &&
      images.length <
        20
    ) {
      const tag =
        match[0];

      const src =
        tag.match(
          /(?:src|data-src|data-lazy-src|data-original)=["']([^"']+)["']/i
        )?.[1];

      if (!src) {
        continue;
      }

      try {
        const url =
          new URL(
            src,
            source.url
          ).href;

        images.push({
          url,

          alt:
            clean(
              tag.match(
                /alt=["']([^"']*)["']/i
              )?.[1] || ''
            ),
        });
      } catch (_) {}
    }

    return {
      ...source,

      title:
        clean(
          titleMatch?.[1] ||
            source.title ||
            ''
        ),

      content:
        text ||
        source.content ||
        '',

      images:
        images.filter(
          (
            item,
            index,
            array
          ) =>
            index ===
            array.findIndex(
              (other) =>
                other.url ===
                item.url
            )
        ),
    };
  } catch (_) {
    return source;
  }
}

// ============================================================
// RESEARCH PACK
// ============================================================

function researchPack(
  sources
) {
  let out =
    '';

  for (
    let i = 0;
    i <
    sources.length;
    i += 1
  ) {
    const source =
      sources[i];

    const imageAssets =
      (
        source.images ||
        []
      )
        .slice(
          0,
          12
        )
        .map(
          (
            img,
            idx
          ) =>
            `[IMAGE ${idx}] ${img.url} | ALT: ${
              img.alt || ''
            }`
        )
        .join(
          '\n'
        );

    const chunk = `
SOURCE_INDEX: ${i}

TITLE:
${source.title || ''}

URL:
${source.url || ''}

CONTENT:
${String(
  source.content || ''
).slice(
  0,
  MAX_SOURCE_CHARS
)}

IMAGE_ASSETS:
${imageAssets}

--------------------
`;

    if (
      (
        out +
        chunk
      ).length >
      MAX_RESEARCH_PACK_CHARS
    ) {
      break;
    }

    out +=
      chunk;
  }

  return out;
}

// ============================================================
// CLOUDFLARE WORKERS AI
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
      'CLOUDFLARE_API_TOKEN belum tersedia di Vercel.'
    );
  }

  if (!accountId) {
    throw new Error(
      'CLOUDFLARE_ACCOUNT_ID belum tersedia di Vercel.'
    );
  }

  const response =
    await fetchTimeout(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`,
      {
        method:
          'POST',

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
          }),
      },
      AI_TIMEOUT
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
      data
        ?.errors?.[0]
        ?.message ||
      data?.message ||
      raw;

    const err =
      new Error(
        `CLOUDFLARE_HTTP_${response.status}: ${message}`
      );

    err.status =
      response.status;

    throw err;
  }

  return data;
}

// ============================================================
// EXTRACT AI TEXT
// ============================================================

function aiText(
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

  if (
    Array.isArray(
      result.choices
    )
  ) {
    return result.choices
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
                (
                  part
                ) =>
                  part?.text ||
                  ''
              )
              .join('');
          }

          return typeof choice?.text ===
            'string'
            ? choice.text
            : '';
        }
      )
      .join(
        '\n'
      );
  }

  return '';
}

// ============================================================
// EXTRACT JSON OBJECTS
// ============================================================

function extractObjects(
  text
) {
  const result =
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
    i += 1
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
        depth ===
        0
      ) {
        start =
          i;
      }

      depth +=
        1;
    } else if (
      ch === '}'
    ) {
      depth -=
        1;

      if (
        depth ===
          0 &&
        start >=
          0
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

        start =
          -1;
      }
    }
  }

  return result;
}

// ============================================================
// VISUAL CUE DETECTION
// ============================================================

function visualCue(
  text
) {
  const v =
    norm(text);

  return [
    'lihat gambar',
    'perhatikan gambar',
    'gambar berikut',
    'berdasarkan gambar',

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
  ].some(
    (cue) =>
      v.includes(
        norm(cue)
      )
  );
}

// ============================================================
// LOCAL CLOCK IMAGE
// ============================================================

function buildClock(
  clock
) {
  if (
    !clock ||
    !Number.isFinite(
      Number(
        clock.hour
      )
    ) ||
    !Number.isFinite(
      Number(
        clock.minute
      )
    )
  ) {
    return '';
  }

  const hour =
    ((Number(
      clock.hour
    ) %
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

  const cx =
    140;

  const cy =
    140;

  const r =
    112;

  const xy = (
    angle,
    length
  ) => ({
    x:
      cx +
      length *
        Math.cos(
          ((angle - 90) *
            Math.PI) /
            180
        ),

    y:
      cy +
      length *
        Math.sin(
          ((angle - 90) *
            Math.PI) /
            180
        ),
  });

  const h =
    xy(
      hour * 30 +
        minute * 0.5,
      r * 0.52
    );

  const m =
    xy(
      minute * 6,
      r * 0.78
    );

  const ticks =
    Array.from(
      {
        length: 60,
      },
      (
        _,
        i
      ) => {
        const outer =
          xy(
            i * 6,
            r
          );

        const inner =
          xy(
            i * 6,
            i % 5 === 0
              ? r - 13
              : r - 7
          );

        return `<line x1="${outer.x.toFixed(
          1
        )}" y1="${outer.y.toFixed(
          1
        )}" x2="${inner.x.toFixed(
          1
        )}" y2="${inner.y.toFixed(
          1
        )}" stroke="#334155" stroke-width="${
          i % 5 ===
          0
            ? 2
            : 1
        }"/>`;
      }
    ).join('');

  const numbers =
    Array.from(
      {
        length: 12,
      },
      (
        _,
        i
      ) => {
        const p =
          xy(
            i * 30,
            r - 25
          );

        return `<text x="${p.x.toFixed(
          1
        )}" y="${(
          p.y + 6
        ).toFixed(
          1
        )}" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#1e293b">${
          i === 0
            ? 12
            : i
        }</text>`;
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
    r="${r}"
    fill="white"
    stroke="#1e293b"
    stroke-width="3"
  />

  ${ticks}
  ${numbers}

  <line
    x1="140"
    y1="140"
    x2="${h.x.toFixed(
      1
    )}"
    y2="${h.y.toFixed(
      1
    )}"
    stroke="#1e293b"
    stroke-width="6"
    stroke-linecap="round"
  />

  <line
    x1="140"
    y1="140"
    x2="${m.x.toFixed(
      1
    )}"
    y2="${m.y.toFixed(
      1
    )}"
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
// QUESTION VALIDATION
// ============================================================

function validate(
  raw,
  allowedTypes
) {
  if (
    !raw ||
    !allowedTypes.includes(
      raw.type
    )
  ) {
    return null;
  }

  const question =
    clean(
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
        4 ||
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
        2 ||
      !Array.isArray(
        raw.correctAnswers
      ) ||
      raw.correctAnswers.length ===
        0
    ) {
      return null;
    }

    const validAnswers =
      raw.correctAnswers.every(
        (index) =>
          Number.isInteger(
            index
          ) &&
          index >=
            0 &&
          index <
            raw.options.length
      );

    if (
      !validAnswers
    ) {
      return null;
    }
  }

  // ----------------------------------------------------------
  // TRUE / FALSE
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
        (
          statement
        ) =>
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
    !clean(
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
      !clean(
        raw.cause
      ) ||
      !clean(
        raw.effect
      ) ||
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
    'matching' &&
    (
      !Array.isArray(
        raw.matchingPairs
      ) ||
      raw.matchingPairs.length <
        2
    )
  ) {
    return null;
  }

  // ----------------------------------------------------------
  // READING
  // ----------------------------------------------------------

  if (
    raw.type ===
    'reading'
  ) {
    if (
      !clean(
        raw.readingText
      ) ||
      !Array.isArray(
        raw.subQuestions
      ) ||
      raw.subQuestions.length <
        2
    ) {
      return null;
    }
  }

  // ----------------------------------------------------------
  // VISUAL
  // ----------------------------------------------------------

  let qImage =
    clean(
      raw.qImage ||
        raw.questionImageUrl ||
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

  // CLOCK

  if (
    raw.clock
  ) {
    qImage =
      buildClock(
        raw.clock
      );

    visualKind =
      'clock';

    visualRequired =
      true;
  }

  // GRAPH

  if (
    raw.graph
  ) {
    // Untuk production pass pertama,
    // grafik diarahkan menggunakan source image.
    visualKind =
      'graph';

    visualRequired =
      true;
  }

  const needsImage =
    Boolean(
      raw.needsImage
    );

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

  // Kalau soal menyebut gambar
  // tetapi stimulus tidak ada,
  // jangan lolos quality gate.

  if (
    visualCue(
      question
    ) &&
    !visualRequired
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

    optionImages:
      Array.isArray(
        raw.optionImages
      )
        ? raw.optionImages.map(
            clean
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

    sourceQuestionVerbatim:
      Boolean(
        raw.sourceQuestionVerbatim
      ),

    sourceTitle:
      clean(
        raw.sourceTitle ||
          ''
      ),

    sourceUrl:
      clean(
        raw.sourceUrl ||
          ''
      ),

    visualRequired,

    visualKind,
  };
}

// ============================================================
// AI SYSTEM PROMPT
// ============================================================

function systemPrompt({
  sourceMode,
  targetYear,
  allowedTypes,
  hotsLevel,
}) {
  return `
Kamu adalah mesin soal profesional Bimbel Gemilang.

MODE:
${sourceMode}

TARGET TAHUN:
${targetYear}

LEVEL HOTS:
${hotsLevel || 'standar'}

TIPE DIIZINKAN:
${allowedTypes.join(
  ', '
)}

============================================================
ATURAN GLOBAL
============================================================

1. Output hanya JSONL.

2. Satu objek JSON untuk satu soal.

3. Jangan output markdown.

4. Jangan output code fence.

5. Kunci jawaban wajib diverifikasi.

6. explanation wajib ada.

7. answerVerification wajib menjelaskan
   mengapa kunci jawaban benar.

8. analysisSummary wajib menjelaskan
   konsep/kompetensi yang diuji.

9. Jangan mengarang URL.

10. Jangan membuat soal yang mengklaim
    dirinya sebagai bocoran ujian.

11. Jangan menyatakan soal pasti keluar.

12. Untuk soal visual,
    stimulus visual harus benar-benar tersedia.

13. Jika soal menyebut:
    - gambar
    - grafik
    - diagram
    - tabel

    tetapi stimulus tidak tersedia,
    jangan keluarkan soal tersebut.

============================================================
MODE SOURCE
============================================================

${
  sourceMode ===
  'source'
    ? `
Pilih soal yang benar-benar tampak pada sumber.

Pertanyaan dan opsi boleh dibersihkan
dari HTML atau noise website.

Jangan mengubah substansi.

Jangan mengklaim sourceQuestionVerbatim=true
jika pertanyaan sudah diparafrasekan.

Jika jawaban sumber meragukan,
verifikasi secara logis.

Jika tidak dapat diverifikasi,
jangan gunakan soal tersebut.
`
    : `
============================================================
MODE PREDICTION
============================================================

Analisis pola sumber.

Cari:
- topik yang sering muncul
- kompetensi
- pola soal
- tipe stimulus
- HOTS
- pola visual
- kemiripan bentuk latihan

Kemudian susun soal latihan baru.

Jangan mengklaim soal sebagai bocoran.

Jangan menjamin soal akan keluar.
`
}

============================================================
SCHEMA MULTIPLE
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
  "qImage":"",
  "optionImages":[],
  "optionsAreImages":false,
  "sourceMode":"${sourceMode}"
}

correct harus berupa:
0 / 1 / 2 / 3

Bukan:
A / B / C / D

============================================================
SCHEMA TRUEFALSE
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
  "explanation":"...",
  "answerVerification":"...",
  "analysisSummary":"..."
}

============================================================
SCHEMA MULTISELECT
============================================================

{
  "type":"multiselect",
  "question":"...",
  "options":["A","B","C","D"],
  "correctAnswers":[0,2],
  "explanation":"...",
  "answerVerification":"...",
  "analysisSummary":"..."
}

============================================================
SCHEMA SHORTANSWER
============================================================

{
  "type":"shortanswer",
  "question":"...",
  "shortAnswer":"...",
  "explanation":"...",
  "answerVerification":"...",
  "analysisSummary":"..."
}

============================================================
SCHEMA CAUSEEFFECT
============================================================

{
  "type":"causeeffect",
  "question":"...",
  "cause":"...",
  "effect":"...",
  "isCauseTrue":true,
  "isEffectTrue":false,
  "explanation":"...",
  "answerVerification":"...",
  "analysisSummary":"..."
}

============================================================
SCHEMA MATCHING
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
    }
  ],
  "explanation":"...",
  "answerVerification":"...",
  "analysisSummary":"..."
}

============================================================
SCHEMA READING
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
    }
  ],
  "explanation":"...",
  "answerVerification":"...",
  "analysisSummary":"..."
}

============================================================
VISUAL CLOCK
============================================================

Untuk soal jam analog:

"clock":{
  "hour":8,
  "minute":30
}

Sistem akan membuat gambar jam
secara lokal.

Jangan membuat URL gambar palsu.
`;
}

// ============================================================
// MAIN HANDLER
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
      success:
        false,

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
    !clean(
      topic
    )
  ) {
    return res.status(
      400
    ).json({
      success:
        false,

      error:
        'Topik wajib diisi.',
    });
  }

  // ==========================================================
  // ENVIRONMENT
  // ==========================================================

  const requiredEnv = [
    'JINA_API_KEY',
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
  ];

  for (
    const envName of
      requiredEnv
  ) {
    if (
      !process.env[
        envName
      ]
    ) {
      return res.status(
        500
      ).json({
        success:
          false,

        error:
          `${envName} belum tersedia di Vercel.`,
      });
    }
  }

  // ==========================================================
  // INPUT
  // ==========================================================

  const requested =
    Number.parseInt(
      jumlahSoal,
      10
    );

  const count =
    Math.min(
      Math.max(
        Number.isFinite(
          requested
        )
          ? requested
          : 5,
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
      : [
          'multiple',
        ];

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

  // ==========================================================
  // 1. BUILD SEARCH QUERIES
  // ==========================================================

  const queries =
    buildQueries({
      topic,
      mapel,
      kelas,
      targetYear:
        year,
      sourceMode:
        mode,
      arahan,
    });

  // ==========================================================
  // 2. JINA SEARCH
  // ==========================================================

  const all =
    [];

  const queryErrors =
    [];

  for (
    const query of
      queries
  ) {
    try {
      const results =
        await jinaSearch(
          query
        );

      all.push(
        ...results
      );
    } catch (
      error
    ) {
      queryErrors.push({
        query,

        error:
          error.message,
      });
    }
  }

  const sources =
    dedupeSources(
      all
    );

  if (
    !sources.length
  ) {
    return res.status(
      502
    ).json({
      success:
        false,

      error:
        'Sistem tidak mendapatkan sumber soal dari internet.',

      debug:
        queryErrors,

      provider:
        'Jina Search',
    });
  }

  // ==========================================================
  // 3. READ SOURCE PAGES
  // ==========================================================

  const pages =
    [];

  for (
    const source of
      sources
  ) {
    const page =
      await readPage(
        source
      );

    if (
      (
        page.content &&
        page.content.length >=
          100
      ) ||
      (
        page.images &&
        page.images.length
      )
    ) {
      pages.push(
        page
      );
    }
  }

  if (
    !pages.length
  ) {
    return res.status(
      502
    ).json({
      success:
        false,

      error:
        'Sumber ditemukan, tetapi tidak ada halaman yang berhasil dibaca.',

      researchSources:
        sources.map(
          (
            source
          ) => ({
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
  // 4. BUILD RESEARCH PROMPT
  // ==========================================================

  const prompt =
    systemPrompt({
      sourceMode:
        mode,

      targetYear:
        year,

      allowedTypes,

      hotsLevel,
    });

  const userPrompt = `
BIMBEL GEMILANG
QUESTION RESEARCH ENGINE

MAPEL:
${mapel || 'Umum'}

KELAS:
${kelas || '-'}

TOPIK:
${clean(topic)}

TARGET:
${year}

MODE:
${mode}

JUMLAH:
${count}

ARAHAN GURU:
${clean(
  arahan || ''
)}

============================================================
SUMBER WEB
============================================================

${researchPack(
  pages
)}

============================================================
TUGAS
============================================================

${
  mode ===
  'source'
    ? `
Ambil soal yang benar-benar tersedia
di sumber internet di atas.

Prioritas:
1. relevansi dengan topik
2. relevansi kelas
3. kualitas soal
4. dapat diverifikasi
5. tidak duplikat

Jangan mengarang sumber.
`
    : `
Gunakan sumber sebagai research evidence.

Analisis pola dan buat soal latihan baru.

Prioritas:
1. relevansi
2. kualitas HOTS
3. variasi
4. kesesuaian target
5. kualitas stimulus
`
}

Pilih atau hasilkan maksimal
${count} soal.

Output HANYA JSONL.
`;

  // ==========================================================
  // 5. CLOUDFLARE AI
  // ==========================================================

  let aiData;

  try {
    aiData =
      await callCloudflare(
        prompt,
        userPrompt
      );
  } catch (
    error
  ) {
    const status =
      error.status ===
      429
        ? 429
        : 502;

    return res.status(
      status
    ).json({
      success:
        false,

      error:
        error.status ===
          429
          ? 'Kuota Cloudflare Workers AI sedang mencapai batas.'
          : 'Cloudflare Workers AI gagal menganalisis sumber.',

      debug:
        error.message,
    });
  }

  // ==========================================================
  // 6. EXTRACT AI RESPONSE
  // ==========================================================

  const raw =
    aiText(
      aiData
    );

  if (
    !raw.trim()
  ) {
    return res.status(
      502
    ).json({
      success:
        false,

      error:
        'Cloudflare AI tidak mengembalikan teks soal.',
    });
  }

  // ==========================================================
  // 7. PARSE JSON OBJECTS
  // ==========================================================

  const objects =
    extractObjects(
      raw
    );

  // ==========================================================
  // 8. QUALITY GATE + DEDUP
  // ==========================================================

  const questions =
    [];

  const seen =
    new Set();

  for (
    const object of
      objects
  ) {
    const question =
      validate(
        object,
        allowedTypes
      );

    if (
      !question
    ) {
      continue;
    }

    const key =
      `${question.type}|${fp(
        question.question
      )}`;

    if (
      seen.has(key)
    ) {
      continue;
    }

    seen.add(
      key
    );

    // --------------------------------------------------------
    // SOURCE METADATA
    // --------------------------------------------------------

    const sourceIndex =
      Number.isInteger(
        object.sourceIndex
      )
        ? object.sourceIndex
        : null;

    const source =
      sourceIndex !==
        null
        ? pages[
            sourceIndex
          ]
        : null;

    question.sourceTitle =
      question.sourceTitle ||
      source?.title ||
      '';

    question.sourceUrl =
      question.sourceUrl ||
      source?.url ||
      '';

    question.researchSources =
      pages.map(
        (
          page
        ) => ({
          title:
            page.title ||
            '',

          url:
            page.url ||
            '',
        })
      );

    question.sourceMode =
      mode;

    questions.push(
      question
    );

    if (
      questions.length >=
      count
    ) {
      break;
    }
  }

  // ==========================================================
  // 9. QUALITY GATE FAILED
  // ==========================================================

  if (
    !questions.length
  ) {
    return res.status(
      502
    ).json({
      success:
        false,

      error:
        'Tidak ada soal yang lolos quality gate.',

      debug: {
        model:
          MODEL,

        parsedObjectCount:
          objects.length,

        rawTextSample:
          raw.slice(
            0,
            2000
          ),
      },

      researchSources:
        pages.map(
          (
            page
          ) => ({
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
  // 10. SUCCESS RESPONSE
  // ==========================================================

  return res.status(
    200
  ).json({
    success:
      true,

    questions,

    requestedCount:
      count,

    returnedCount:
      questions.length,

    possiblyTruncated:
      questions.length <
      count,

    sourceMode:
      mode,

    usedTrendSearch:
      true,

    researchProvider:
      'Jina Search',

    aiProvider:
      'Cloudflare Workers AI',

    model:
      MODEL,

    researchSources:
      pages.map(
        (
          page
        ) => ({
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