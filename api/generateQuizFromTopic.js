// api/generateQuizFromTopic.js
// ============================================================
// GEMILANG PROFESSIONAL QUIZ ENGINE
// ============================================================
// Prinsip:
// 1. Gemini 2.5 Flash-Lite / Flash = Free Tier
// 2. Riset internet menggunakan Google Search grounding resmi
// 3. TIDAK menggunakan Antigravity
// 4. TIDAK fallback diam-diam dari riset -> offline
// 5. Maksimum 10 soal / request agar stabil
//    => AIGenerateQuiz dapat menjalankan 10 + 10 + 10 + 10 = 40 soal
// 6. Soal hasil riset = soal latihan BARU berbasis sumber web,
//    bukan salinan massal soal berhak cipta
// 7. Sumber grounding disimpan agar guru bisa audit
// 8. Visual matematis dibuat lokal: graph / shape / pattern / clock
// 9. Foto objek nyata hanya dicari dari Openverse / Wikimedia
// 10. Soal yang menyebut visual tetapi visualnya tidak tersedia DITOLAK
// ============================================================

const GEMINI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
];

const MAX_BATCH_QUESTIONS = 10;
const MAX_OUTPUT_TOKENS = 14000;
const REQUEST_TIMEOUT_MS = 70000;

// ============================================================
// BASIC HELPERS
// ============================================================

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sanitizeText = (value = '') =>
  String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .trim();

const sanitizeLatexEscapes = (text = '') => {
  return String(text)
    .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
    .replace(/\\([bfnrtu])(?=[a-zA-Z])/g, '\\\\$1');
};

const escapeXml = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const isFiniteNumber = (v) =>
  typeof v === 'number' && Number.isFinite(v);

const isIntegerInRange = (v, min, max) =>
  Number.isInteger(v) && v >= min && v <= max;

const fetchWithTimeout = async (
  url,
  options = {},
  timeoutMs = REQUEST_TIMEOUT_MS
) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

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
// DETEKSI KEBUTUHAN VISUAL
// ============================================================

const containsVisualCue = (text = '') => {
  const t = String(text).toLowerCase();

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
    'lihat peta',
    'perhatikan peta',

    'look at the picture',
    'look at the image',
    'look at the graph',
    'look at the diagram',
    'look at the table',
    'look at the map',
    'based on the picture',
    'based on the image',
    'based on the graph',
    'based on the diagram',
    'based on the table',
    'based on the map',
  ];

  return cues.some((cue) => t.includes(cue));
};

// ============================================================
// GEMINI CALL
// ============================================================

async function callGemini({
  systemPrompt,
  userPrompt,
  modelName,
  useTrendSearch,
}) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },

    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],

    generationConfig: {
      temperature: 0.2,
      topP: 0.9,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  };

  // ==========================================================
  // PENTING:
  // Gunakan Google Search grounding resmi.
  // TIDAK memakai Antigravity.
  // ==========================================================
  if (useTrendSearch) {
    body.tools = [
      {
        google_search: {},
      },
    ];
  }

  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
    },
    REQUEST_TIMEOUT_MS
  );

  const raw = await response.text();

  if (!response.ok) {
    let detail = raw;

    try {
      const parsed = JSON.parse(raw);
      detail = parsed?.error?.message || raw;
    } catch (_) {}

    const err = new Error(
      `GEMINI_HTTP_${response.status}: ${detail}`
    );

    err.status = response.status;
    err.raw = raw;

    throw err;
  }

  try {
    return JSON.parse(raw);
  } catch (_) {
    throw new Error(
      'Respons Gemini tidak dapat diparse sebagai JSON.'
    );
  }
}

// ============================================================
// VISUAL GENERATOR
// ============================================================

// ---------- GRAPH ----------

const buildGraphImageSvg = (graph) => {
  if (!graph || !Array.isArray(graph.points)) return '';

  const points = graph.points
    .filter(
      (p) =>
        isFiniteNumber(p?.x) &&
        isFiniteNumber(p?.y)
    )
    .slice(0, 100);

  if (points.length < 2) return '';

  const highlights = Array.isArray(graph.highlight)
    ? graph.highlight.filter(
        (p) =>
          isFiniteNumber(p?.x) &&
          isFiniteNumber(p?.y)
      )
    : [];

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const W = 640;
  const H = 420;
  const pad = 55;

  const mapX = (x) =>
    pad +
    ((x - minX) / Math.max(maxX - minX, 1)) *
      (W - pad * 2);

  const mapY = (y) =>
    H -
    pad -
    ((y - minY) / Math.max(maxY - minY, 1)) *
      (H - pad * 2);

  const path = points
    .map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'} ${mapX(p.x).toFixed(1)} ${mapY(
          p.y
        ).toFixed(1)}`
    )
    .join(' ');

  const highlightSvg = highlights
    .map(
      (p) =>
        `<circle cx="${mapX(p.x).toFixed(1)}"
                 cy="${mapY(p.y).toFixed(1)}"
                 r="6"
                 fill="#dc2626"/>`
    )
    .join('');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${W} ${H}"
     width="${W}"
     height="${H}">
  <rect width="${W}" height="${H}" fill="white"/>

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

  ${highlightSvg}

  <text
    x="${W - pad}"
    y="${H - 15}"
    text-anchor="end"
    font-family="Arial"
    font-size="16"
    fill="#334155">
    ${escapeXml(graph.xLabel || 'x')}
  </text>

  <text
    x="18"
    y="${pad}"
    font-family="Arial"
    font-size="16"
    fill="#334155">
    ${escapeXml(graph.yLabel || 'y')}
  </text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString(
    'base64'
  )}`;
};

// ---------- SHAPE ----------

const buildShapeImageSvg = (shape) => {
  if (
    !shape ||
    !Array.isArray(shape.vertices)
  ) {
    return '';
  }

  const vertices = shape.vertices
    .filter(
      (v) =>
        isFiniteNumber(v?.x) &&
        isFiniteNumber(v?.y)
    )
    .slice(0, 30);

  if (vertices.length < 3) return '';

  const labels = Array.isArray(shape.labels)
    ? shape.labels.filter(
        (l) =>
          isFiniteNumber(l?.x) &&
          isFiniteNumber(l?.y)
      )
    : [];

  const allX = [
    ...vertices.map((v) => v.x),
    ...labels.map((l) => l.x),
  ];

  const allY = [
    ...vertices.map((v) => v.y),
    ...labels.map((l) => l.y),
  ];

  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);

  const span = Math.max(
    maxX - minX,
    maxY - minY,
    1
  );

  const pad = span * 0.2 + 10;
  const W = Math.max(
    maxX - minX + pad * 2,
    180
  );
  const H = Math.max(
    maxY - minY + pad * 2,
    180
  );

  const sx = (x) =>
    x - minX + pad;

  const sy = (y) =>
    maxY - y + pad;

  const polygonPoints = vertices
    .map(
      (v) =>
        `${sx(v.x).toFixed(1)},${sy(v.y).toFixed(1)}`
    )
    .join(' ');

  const labelSvg = labels
    .map(
      (l) =>
        `<text
          x="${sx(l.x).toFixed(1)}"
          y="${sy(l.y).toFixed(1)}"
          text-anchor="middle"
          font-family="Arial"
          font-size="16"
          fill="#334155">
          ${escapeXml(l.text || '')}
        </text>`
    )
    .join('');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${W} ${H}"
     width="500"
     height="360">
  <rect width="${W}" height="${H}" fill="white"/>

  <polygon
    points="${polygonPoints}"
    fill="#dbeafe"
    stroke="#1e293b"
    stroke-width="3"
  />

  ${labelSvg}
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString(
    'base64'
  )}`;
};

// ---------- PATTERN ----------

const SHAPE_PRIMITIVES = {
  circle: (cx, cy, r, filled) =>
    `<circle
      cx="${cx}"
      cy="${cy}"
      r="${r}"
      fill="${filled ? '#1e293b' : 'white'}"
      stroke="#1e293b"
      stroke-width="2"/>`,

  square: (cx, cy, r, filled) =>
    `<rect
      x="${cx - r}"
      y="${cy - r}"
      width="${r * 2}"
      height="${r * 2}"
      fill="${filled ? '#1e293b' : 'white'}"
      stroke="#1e293b"
      stroke-width="2"/>`,

  triangle: (cx, cy, r, filled) =>
    `<polygon
      points="${cx},${cy - r}
              ${cx - r},${cy + r}
              ${cx + r},${cy + r}"
      fill="${filled ? '#1e293b' : 'white'}"
      stroke="#1e293b"
      stroke-width="2"/>`,

  pentagon: (cx, cy, r, filled) => {
    const pts = Array.from(
      { length: 5 },
      (_, i) => {
        const a =
          -Math.PI / 2 +
          (i * 2 * Math.PI) / 5;

        return `${(
          cx +
          r * Math.cos(a)
        ).toFixed(1)},${(
          cy +
          r * Math.sin(a)
        ).toFixed(1)}`;
      }
    ).join(' ');

    return `<polygon
      points="${pts}"
      fill="${filled ? '#1e293b' : 'white'}"
      stroke="#1e293b"
      stroke-width="2"/>`;
  },

  star: (cx, cy, r, filled) => {
    const pts = Array.from(
      { length: 10 },
      (_, i) => {
        const rr =
          i % 2 === 0
            ? r
            : r * 0.45;

        const a =
          -Math.PI / 2 +
          (i * Math.PI) / 5;

        return `${(
          cx +
          rr * Math.cos(a)
        ).toFixed(1)},${(
          cy +
          rr * Math.sin(a)
        ).toFixed(1)}`;
      }
    ).join(' ');

    return `<polygon
      points="${pts}"
      fill="${filled ? '#1e293b' : 'white'}"
      stroke="#1e293b"
      stroke-width="2"/>`;
  },
};

const buildPatternImageSvg = (pattern) => {
  if (
    !pattern ||
    !Array.isArray(pattern.sequence)
  ) {
    return '';
  }

  const sequence = pattern.sequence.filter(
    (item) =>
      item &&
      SHAPE_PRIMITIVES[item.shape]
  );

  if (!sequence.length) return '';

  const cell = 90;
  const W = sequence.length * cell;
  const H = cell;

  const cells = sequence
    .map((item, i) => {
      const cx =
        i * cell +
        cell / 2;

      const cy =
        cell / 2;

      const rotation = Number.isFinite(
        item.rotation
      )
        ? item.rotation
        : 0;

      return `
        <rect
          x="${i * cell + 2}"
          y="2"
          width="${cell - 4}"
          height="${cell - 4}"
          fill="none"
          stroke="#e2e8f0"/>

        <g transform="rotate(${rotation} ${cx} ${cy})">
          ${
            SHAPE_PRIMITIVES[item.shape](
              cx,
              cy,
              26,
              Boolean(item.filled)
            )
          }
        </g>
      `;
    })
    .join('');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${W} ${H}"
     width="${W}"
     height="${H}">
  <rect width="${W}" height="${H}" fill="white"/>
  ${cells}
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString(
    'base64'
  )}`;
};

// ---------- CLOCK ----------

const buildClockImageSvg = (clock) => {
  if (
    !clock ||
    !Number.isFinite(clock.hour) ||
    !Number.isFinite(clock.minute)
  ) {
    return '';
  }

  const hour =
    ((Number(clock.hour) % 12) + 12) %
    12;

  const minute = Math.max(
    0,
    Math.min(59, Number(clock.minute))
  );

  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = 112;

  const toXY = (
    angleDeg,
    length
  ) => {
    const rad =
      ((angleDeg - 90) *
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

  const minuteAngle =
    minute * 6;

  const hourAngle =
    hour * 30 +
    minute * 0.5;

  const minuteTip =
    toXY(
      minuteAngle,
      r * 0.78
    );

  const hourTip =
    toXY(
      hourAngle,
      r * 0.52
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
            r
          );

        const inner =
          toXY(
            i * 6,
            major
              ? r - 13
              : r - 7
          );

        return `
        <line
          x1="${outer.x.toFixed(2)}"
          y1="${outer.y.toFixed(2)}"
          x2="${inner.x.toFixed(2)}"
          y2="${inner.y.toFixed(2)}"
          stroke="#334155"
          stroke-width="${major ? 2 : 1}"
        />`;
      }
    ).join('');

  const numerals =
    Array.from(
      { length: 12 },
      (_, i) => {
        const n =
          i === 0 ? 12 : i;

        const p =
          toXY(
            i * 30,
            r - 25
          );

        return `
        <text
          x="${p.x.toFixed(1)}"
          y="${(p.y + 6).toFixed(1)}"
          text-anchor="middle"
          font-family="Arial"
          font-size="18"
          font-weight="700"
          fill="#1e293b">
          ${n}
        </text>`;
      }
    ).join('');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${size} ${size}"
     width="${size}"
     height="${size}">
  <rect
    width="${size}"
    height="${size}"
    fill="white"/>

  <circle
    cx="${cx}"
    cy="${cy}"
    r="${r}"
    fill="white"
    stroke="#1e293b"
    stroke-width="3"/>

  ${ticks}

  ${numerals}

  <line
    x1="${cx}"
    y1="${cy}"
    x2="${hourTip.x.toFixed(2)}"
    y2="${hourTip.y.toFixed(2)}"
    stroke="#1e293b"
    stroke-width="6"
    stroke-linecap="round"/>

  <line
    x1="${cx}"
    y1="${cy}"
    x2="${minuteTip.x.toFixed(2)}"
    y2="${minuteTip.y.toFixed(2)}"
    stroke="#334155"
    stroke-width="4"
    stroke-linecap="round"/>

  <circle
    cx="${cx}"
    cy="${cy}"
    r="5"
    fill="#1e293b"/>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString(
    'base64'
  )}`;
};

// ============================================================
// TYPE DESCRIPTIONS
// ============================================================

const TYPE_DESCRIPTIONS = {
  multiple:
    '"multiple" — pilihan ganda 4 opsi',

  truefalse:
    '"truefalse" — beberapa pernyataan benar/salah',

  multiselect:
    '"multiselect" — pilih lebih dari satu jawaban benar',

  shortanswer:
    '"shortanswer" — isian singkat',

  causeeffect:
    '"causeeffect" — sebab akibat',

  matching:
    '"matching" — menjodohkan minimal 3 pasang',

  reading:
    '"reading" — bacaan 2–5 paragraf + minimal 3 sub-soal pilihan ganda',
};

// ============================================================
// PROFESSIONAL SYSTEM PROMPT
// ============================================================

const buildSystemPrompt = ({
  allowedTypes,
  useTrendSearch,
  hotsLevel,
  targetYear,
}) => {
  const researchSection = useTrendSearch
    ? `
MODE RISET INTERNET AKTIF.

WAJIB:
- Gunakan Google Search grounding pada request ini.
- Cari beberapa sumber yang relevan.
- Prioritaskan sumber resmi pemerintah, lembaga pendidikan,
  sekolah/universitas, dan sumber pendidikan terpercaya.
- Gunakan hasil web untuk:
  1. topik yang sering muncul,
  2. model stimulus,
  3. pola pertanyaan,
  4. level kesulitan,
  5. distribusi kompetensi,
  6. bentuk visual yang lazim.
- Target tahun latihan: ${targetYear || '2027'}.
- JANGAN mengklaim mengetahui soal yang belum dipublikasikan.
- JANGAN mengaku soal keluaran adalah bocoran.
- Hasil akhir harus berupa SOAL LATIHAN BARU yang
  berbasis bukti dari sumber web.
- Jangan menyalin satu soal dari sumber kata demi kata.
- Sumber web WAJIB tercermin melalui grounding metadata.
`
    : `
MODE AI ORIGINAL.
Buat soal baru berdasarkan topik tanpa mengklaim hasil sebagai
soal resmi atau bocoran ujian.
`;

  const visualSection = `
ATURAN VISUAL:
1. Jangan membuat kalimat "lihat gambar" jika gambar tidak ada.
2. Jika menggunakan clock, wajib keluarkan:
   "clock":{"hour":...,"minute":...}
3. Jika menggunakan graph, wajib keluarkan:
   "graph":{"points":[...]}
4. Jika menggunakan shape, wajib keluarkan:
   "shape":{"vertices":[...]}
5. Jika menggunakan pattern, wajib keluarkan:
   "pattern":{"sequence":[...]}
6. Jangan menggunakan needs_image untuk clock/graph/shape/pattern.
7. Untuk foto objek nyata, gunakan:
   "needs_image":true,
   "image_keyword":"english keyword"
8. Jangan membuat visual hanya agar soal terlihat menarik.
9. Visual harus menjadi bagian yang benar-benar diperlukan untuk
   menjawab soal.
`;

  return `
Kamu adalah penyusun soal profesional Bimbel Gemilang Indonesia.

${researchSection}

${visualSection}

ATURAN KUALITAS:
- Soal harus cocok dengan mapel.
- Soal harus cocok dengan jenjang.
- Soal harus sesuai topik.
- Tidak boleh ada konteks yang tidak relevan.
- Hitungan harus dihitung ulang.
- Kunci harus benar.
- Semua opsi harus masuk akal.
- Pembahasan harus menjelaskan cara memperoleh jawaban.
- Hindari pengulangan ide yang sama.
- Jika soal berbasis data, data harus konsisten.
- Jika soal menggunakan stimulus, stimulus harus cukup untuk menjawab.
- Jangan gunakan markdown.
- Gunakan LaTeX yang valid jika diperlukan.
${hotsLevel ? `- LEVEL HOTS: ${hotsLevel}` : ''}

TIPE YANG BOLEH:
${allowedTypes
  .map(
    (t) =>
      TYPE_DESCRIPTIONS[t] ||
      `"${t}"`
  )
  .join('\n')}

FORMAT:
Baris pertama:
{"meta":true}

Baris berikutnya:
satu objek JSON per baris.

Contoh pilihan ganda:
{"type":"multiple","question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}

Jangan bungkus jawaban dalam array.
Jangan memakai code fence.
Jangan menambahkan komentar.
`;
};

// ============================================================
// JSONL EXTRACTION
// ============================================================

const extractJsonObjects = (text = '') => {
  const objects = [];

  let depth = 0;
  let start = -1;
  let inString = false;
  let escapeNext = false;

  for (
    let i = 0;
    i < text.length;
    i++
  ) {
    const ch = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (ch === '\\') {
      escapeNext = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '{') {
      if (depth === 0) start = i;
      depth++;
    }

    if (ch === '}') {
      depth--;

      if (
        depth === 0 &&
        start !== -1
      ) {
        const candidate =
          text.slice(
            start,
            i + 1
          );

        try {
          objects.push(
            JSON.parse(candidate)
          );
        } catch (_) {}

        start = -1;
      }
    }
  }

  return objects;
};

// ============================================================
// GROUNDING SOURCE EXTRACTION
// ============================================================

const getGroundingSources = (candidate) => {
  const chunks =
    candidate?.groundingMetadata
      ?.groundingChunks || [];

  return chunks
    .map((chunk) => {
      if (chunk?.web) {
        return {
          title:
            sanitizeText(
              chunk.web.title || ''
            ),

          url:
            sanitizeText(
              chunk.web.uri || ''
            ),
        };
      }

      return null;
    })

    .filter(
      (x) =>
        x &&
        (x.title || x.url)
    )

    .filter(
      (item, index, arr) =>
        index ===
        arr.findIndex(
          (other) =>
            other.url ===
            item.url
        )
    )

    .slice(0, 12);
};

// ============================================================
// OPEN-LICENSE IMAGE SEARCH
// ============================================================

async function searchOpenLicenseImage(
  keyword
) {
  const results = [];

  if (!keyword) return results;

  // Openverse
  try {
    const url =
      `https://api.openverse.org/v1/images/?q=` +
      `${encodeURIComponent(keyword)}` +
      `&license_type=all-cc&page_size=6`;

    const response =
      await fetchWithTimeout(
        url,
        {},
        12000
      );

    if (response.ok) {
      const data =
        await response.json();

      for (
        const item of
          data.results || []
      ) {
        if (!item.url) continue;

        results.push({
          url: item.url,
          thumb:
            item.thumbnail ||
            item.url,
          title:
            item.title ||
            keyword,
          source:
            `Openverse${
              item.license
                ? ` (${item.license})`
                : ''
            }`,
        });
      }
    }
  } catch (_) {}

  // Wikimedia fallback
  if (results.length < 4) {
    try {
      const url =
        `https://commons.wikimedia.org/w/api.php` +
        `?action=query` +
        `&generator=search` +
        `&gsrsearch=${encodeURIComponent(
          keyword
        )}` +
        `&gsrnamespace=6` +
        `&gsrlimit=6` +
        `&prop=imageinfo` +
        `&iiprop=url|extmetadata` +
        `&iiurlwidth=500` +
        `&format=json` +
        `&origin=*`;

      const response =
        await fetchWithTimeout(
          url,
          {},
          12000
        );

      if (response.ok) {
        const data =
          await response.json();

        const pages =
          data?.query?.pages ||
          {};

        Object.values(
          pages
        ).forEach((page) => {
          const info =
            page?.imageinfo?.[0];

          if (!info?.url) return;

          results.push({
            url: info.url,
            thumb:
              info.thumburl ||
              info.url,
            title:
              page.title
                ? page.title.replace(
                    /^File:/,
                    ''
                  )
                : keyword,
            source:
              'Wikimedia Commons',
          });
        });
      }
    } catch (_) {}
  }

  return results.slice(0, 8);
}

// ============================================================
// QUESTION VALIDATION
// ============================================================

function validateQuestion(
  raw,
  allowedTypes
) {
  if (!raw || raw.meta === true)
    return null;

  if (!allowedTypes.includes(raw.type))
    return null;

  const question =
    sanitizeText(
      raw.question || ''
    );

  if (!question) return null;

  // ---------- MULTIPLE ----------

  if (raw.type === 'multiple') {
    if (
      !Array.isArray(
        raw.options
      ) ||
      raw.options.length !== 4
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

  // ---------- MULTISELECT ----------

  if (raw.type === 'multiselect') {
    if (
      !Array.isArray(
        raw.options
      ) ||
      raw.options.length < 2
    ) {
      return null;
    }

    if (
      !Array.isArray(
        raw.correctAnswers
      ) ||
      !raw.correctAnswers.length
    ) {
      return null;
    }

    if (
      !raw.correctAnswers.every(
        (v) =>
          isIntegerInRange(
            v,
            0,
            raw.options.length - 1
          )
      )
    ) {
      return null;
    }
  }

  // ---------- TRUE FALSE ----------

  if (raw.type === 'truefalse') {
    if (
      !Array.isArray(
        raw.statements
      ) ||
      raw.statements.length < 2
    ) {
      return null;
    }

    if (
      !raw.statements.every(
        (s) =>
          s &&
          typeof s.text ===
            'string'
      )
    ) {
      return null;
    }
  }

  // ---------- SHORT ----------

  if (raw.type === 'shortanswer') {
    if (
      !sanitizeText(
        raw.shortAnswer
      )
    ) {
      return null;
    }
  }

  // ---------- CAUSE EFFECT ----------

  if (
    raw.type === 'causeeffect'
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

  // ---------- MATCHING ----------

  if (raw.type === 'matching') {
    if (
      !Array.isArray(
        raw.matchingPairs
      ) ||
      raw.matchingPairs.length < 3
    ) {
      return null;
    }

    if (
      !raw.matchingPairs.every(
        (pair) =>
          sanitizeText(
            pair?.left
          ) &&
          sanitizeText(
            pair?.right
          )
      )
    ) {
      return null;
    }
  }

  // ---------- READING ----------

  if (raw.type === 'reading') {
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
      raw.subQuestions.length < 3
    ) {
      return null;
    }

    if (
      !raw.subQuestions.every(
        (sq) =>
          sanitizeText(
            sq?.q
          ) &&
          Array.isArray(
            sq?.options
          ) &&
          sq.options.length >= 2 &&
          isIntegerInRange(
            sq.correct,
            0,
            sq.options.length - 1
          )
      )
    ) {
      return null;
    }
  }

  // ==========================================================
  // VISUAL
  // ==========================================================

  let qImage = '';
  let visualRequired = false;
  let visualKind = 'none';
  let needsImage = false;
  let imageHint = '';

  if (raw.graph) {
    qImage =
      buildGraphImageSvg(
        raw.graph
      );

    visualRequired = true;
    visualKind = 'graph';
  } else if (raw.shape) {
    qImage =
      buildShapeImageSvg(
        raw.shape
      );

    visualRequired = true;
    visualKind = 'shape';
  } else if (raw.pattern) {
    qImage =
      buildPatternImageSvg(
        raw.pattern
      );

    visualRequired = true;
    visualKind = 'pattern';
  } else if (raw.clock) {
    qImage =
      buildClockImageSvg(
        raw.clock
      );

    visualRequired = true;
    visualKind = 'clock';
  } else if (raw.needs_image) {
    needsImage = true;

    imageHint =
      sanitizeText(
        raw.image_keyword || ''
      );

    visualRequired = true;
    visualKind = 'photo';
  }

  // Visual cue tetapi tidak ada mekanisme visual
  if (
    containsVisualCue(
      question
    ) &&
    !qImage &&
    !needsImage
  ) {
    return null;
  }

  const cleanQuestion = {
    type: raw.type,
    question,

    options:
      Array.isArray(raw.options)
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
            (stmt) => ({
              text:
                sanitizeText(
                  stmt?.text ||
                    ''
                ),
              isTrue:
                Boolean(
                  stmt?.isTrue
                ),
            })
          )
        : undefined,

    shortAnswer:
      sanitizeText(
        raw.shortAnswer ||
          ''
      ) || undefined,

    cause:
      sanitizeText(
        raw.cause || ''
      ) || undefined,

    effect:
      sanitizeText(
        raw.effect || ''
      ) || undefined,

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
      ) || undefined,

    subQuestions:
      Array.isArray(
        raw.subQuestions
      )
        ? raw.subQuestions.map(
            (sq) => ({
              q:
                sanitizeText(
                  sq?.q || ''
                ),
              options:
                Array.isArray(
                  sq?.options
                )
                  ? sq.options.map(
                      sanitizeText
                    )
                  : [],
              correct:
                sq?.correct,
            })
          )
        : undefined,

    explanation:
      sanitizeText(
        raw.explanation ||
          ''
      ),

    qImage:
      qImage || undefined,

    needsImage,

    imageHint,

    imageSource:
      null,

    visualRequired,

    visualKind,

    researchBacked:
      false,

    researchSources: [],
  };

  // Jika foto nyata dibutuhkan,
  // cari hanya dari sumber lisensi terbuka.
  if (
    needsImage &&
    imageHint
  ) {
    // Tidak langsung memilih otomatis.
    // Frontend dapat menggunakan imageHint
    // untuk pencarian Openverse/Wikimedia.
  }

  return cleanQuestion;
}

// ============================================================
// HANDLER
// ============================================================

export default async function handler(
  req,
  res
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error:
        'Method not allowed',
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error:
        'GEMINI_API_KEY belum tersedia. Masukkan API key pada Environment Variables Vercel.',
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
    useTrendSearch,
    hotsLevel,
    targetYear,
  } = body;

  if (
    !String(topic || '')
      .trim()
  ) {
    return res.status(400).json({
      error:
        'Topik wajib diisi.',
    });
  }

  // ==========================================================
  // MAX 10 / REQUEST
  // AIGenerateQuiz akan memanggil endpoint beberapa kali
  // untuk total 20/30/40 soal.
  // ==========================================================

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
    Array.isArray(types) &&
    types.length > 0
      ? types
      : ['multiple'];

  const researchMode =
    Boolean(
      useTrendSearch
    );

  const systemPrompt =
    buildSystemPrompt({
      allowedTypes,
      useTrendSearch:
        researchMode,
      hotsLevel:
        hotsLevel || '',
      targetYear:
        targetYear ||
        String(
          new Date().getFullYear() +
            1
        ),
    });

  const userPrompt = `
Mata pelajaran:
${mapel || 'Umum'}

Topik:
${String(topic).trim()}

Jenjang/Kelas:
${kelas || 'SMP'}

Target tahun latihan:
${targetYear || new Date().getFullYear() + 1}

Jumlah soal batch ini:
${jumlah}

Tipe soal:
${allowedTypes.join(', ')}

${arahan?.trim()
  ? `Arahan guru:
${arahan.trim()}`
  : ''}

${researchMode
  ? `
TUGAS RISET:
Cari beberapa contoh soal dan sumber pendidikan
yang relevan dengan topik ini.
Bandingkan pola dan kompetensinya.
Buat latihan baru yang representatif.
`
  : `
TUGAS ORIGINAL:
Buat soal baru yang valid dan relevan.
`}

Buat tepat ${jumlah} soal jika memungkinkan.
Prioritaskan kualitas daripada membuat soal yang tidak valid.
`;

  // ==========================================================
  // CALL GEMINI
  // ==========================================================

  let geminiData =
    null;

  let lastError =
    null;

  for (
    let i = 0;
    i < GEMINI_MODELS.length;
    i++
  ) {
    const modelName =
      GEMINI_MODELS[i];

    try {
      geminiData =
        await callGemini({
          systemPrompt,
          userPrompt,
          modelName,
          useTrendSearch:
            researchMode,
        });

      lastError =
        null;

      break;
    } catch (error) {
      lastError =
        error;

      console.error(
        `[Gemilang Quiz] ${modelName} gagal:`,
        error.message
      );

      // 401/403 = API key / permission
      // Tidak masuk akal mencoba model lain.
      if (
        error.status ===
          401 ||
        error.status ===
          403
      ) {
        break;
      }

      await sleep(600);
    }
  }

  if (!geminiData) {
    const debug =
      lastError?.message ||
      'Tidak ada respons Gemini.';

    if (
      debug.includes(
        '429'
      )
    ) {
      return res.status(429).json({
        error:
          'Kuota gratis Gemini sedang mencapai batas. Batch ini dihentikan agar tidak membebankan biaya.',
        debug,
      });
    }

    if (
      debug.includes(
        '401'
      ) ||
      debug.includes(
        '403'
      )
    ) {
      return res.status(502).json({
        error:
          'GEMINI_API_KEY ditolak. Cek API key dan project Gemini yang digunakan Vercel.',
        debug,
      });
    }

    return res.status(502).json({
      error:
        researchMode
          ? 'Riset Internet gagal. Sistem TIDAK membuat fallback seolah-olah hasilnya dari internet.'
          : 'Gemini gagal membuat soal.',
      debug,
    });
  }

  // ==========================================================
  // PARSE RESPONSE
  // ==========================================================

  const candidate =
    geminiData?.candidates?.[0];

  const rawText =
    candidate?.content?.parts
      ?.filter(
        (part) =>
          typeof part?.text ===
          'string'
      )
      ?.map(
        (part) =>
          part.text
      )
      ?.join('\n') ||
    '';

  if (!rawText.trim()) {
    return res.status(502).json({
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

  const groundingSources =
    getGroundingSources(
      candidate
    );

  const questions =
    [];

  for (
    const rawQuestion of objects
  ) {
    const question =
      validateQuestion(
        rawQuestion,
        allowedTypes
      );

    if (!question)
      continue;

    // ========================================================
    // RISET INTERNET:
    // wajib punya grounding evidence.
    // ========================================================

    if (
      researchMode
    ) {
      if (
        groundingSources.length ===
        0
      ) {
        continue;
      }

      question.researchBacked =
        true;

      question.researchSources =
        groundingSources;
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

  if (
    questions.length ===
    0
  ) {
    return res.status(502).json({
      error:
        researchMode
          ? 'Tidak ada soal yang lolos validasi dari riset internet. Tidak ada soal offline yang dimasukkan.'
          : 'Tidak ada soal valid yang berhasil dibuat.',
      groundingSources,
    });
  }

  const possiblyTruncated =
    candidate?.finishReason ===
      'MAX_TOKENS' ||
    questions.length <
      jumlah;

  return res.status(200).json({
    success: true,

    questions,

    requestedCount:
      jumlah,

    returnedCount:
      questions.length,

    maxBatchSize:
      MAX_BATCH_QUESTIONS,

    possiblyTruncated,

    usedTrendSearch:
      researchMode,

    groundingSources,

    provider:
      'Gemini generateContent + Google Search grounding',

    model:
      candidate?.modelVersion ||
      'gemini-2.5',
  });
}