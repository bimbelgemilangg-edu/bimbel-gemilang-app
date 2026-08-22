// api/generateQuizFromTopic.js
// 🔥 Generate soal kuis dari topik. Pakai Gemini, arsitektur sama seperti
// generateMateriSection.js: model fallback (pintar dulu baru Flash-Lite),
// format JSONL biar tahan kepotong, self-check biar akurat.
//
// 🔥 KEMAMPUAN DI FILE INI:
// 1) GROUNDING KE INTERNET (opsional, `useTrendSearch`) -- AI baca pola/
//    format soal SNBT/TKA/ujian sekolah tahun-tahun TERAKHIR YANG BENERAN
//    ADA, lalu bikin soal LATIHAN BARU (orisinal) dengan pola & level
//    kesulitan setara. INI BUKAN "prediksi soal tahun depan" -- gak ada
//    yang bisa tau soal yang belum dibuat, siapapun itu.
// 2) INSTRUKSI HOTS -- soal diarahkan ke analisis/evaluasi/penerapan,
//    bukan cuma hafalan atau dibikin ribet doang.
// 3) TIPE "reading" (Membaca Teks/bacaan panjang berparagraf).
// 4) GAMBAR/DIAGRAM -- SEMUA gambar di sistem ini ORISINAL, digambar ulang
//    dari data presisi yang dihitung/ditentukan AI, BUKAN dicari/disalin
//    dari internet (itu berisiko hak cipta & gak terjamin akurat). Ada 5
//    mekanisme:
//    a) "graph"   -- grafik fungsi matematika, di-plot dari titik (x,y)
//       hasil hitungan AI lewat SVG lokal (tanpa layanan chart eksternal).
//    b) "shape"   -- bangun datar/ruang gabungan dengan ukuran spesifik,
//       digambar dari koordinat vertex yang dihitung AI, SVG presisi.
//    c) "pattern" -- soal pola bentuk ala SBMPTN Penalaran Umum, dirender
//       sebagai SVG dari deskripsi urutan bentuk yang dibuat AI.
//    d) "clock"   -- jam analog presisi (soal baca jam), jarumnya
//       dihitung otomatis dari jam:menit yang ditentukan AI.
//    e) "needs_image"+"image_keyword" -- HANYA untuk objek/fenomena NYATA
//       yang bisa difoto (dicari lewat Wikimedia di frontend), BUKAN
//       diagram teknis.

// Model yang dipakai untuk GENERATE OFFLINE. 3.6 Flash saat ini tercatat
// sebagai model stable dan tersedia di Free Tier. Untuk menghindari error
// karena alias/model lama, jangan lagi pakai 2.5-flash-lite sebagai default.
const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
];

// Riset internet tidak lagi memakai `google_search` di generateContent.
// Pada model Gemini 3.x, Search grounding API bukan fitur Free Tier.
// Sebagai gantinya, mode riset memakai Antigravity managed agent yang memang
// menyediakan Google Search + URL fetching dan tersedia pada project Free Tier
// dengan kuota gratis. Tidak ada fallback diam-diam ke offline.
async function callGemini(systemPrompt, userPrompt, modelName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      maxOutputTokens: 16384,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`GEMINI_HTTP_${response.status}: ${errText}`);
  }

  return response.json();
}

async function callAntigravityResearch(systemPrompt, userPrompt) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/interactions';
  const body = {
    agent: 'antigravity-preview-05-2026',
    input: `${systemPrompt}\n\n${userPrompt}\n\nPENTING: gunakan web search dan URL context terlebih dahulu. Cari beberapa contoh soal publik nyata dari minimal 3 sumber/domain berbeda. Setelah membaca sumber, hasilkan JSONL FINAL saja sesuai format di atas. Jangan keluarkan Markdown, narasi, atau code fence.`,
    environment: 'remote',
    tools: [
      { type: 'google_search' },
      { type: 'url_context' },
    ],
    agent_config: {
      type: 'antigravity',
      model: 'gemini-3.5-flash-lite',
      max_total_tokens: 30000,
    },
    store: false,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ANTIGRAVITY_HTTP_${response.status}: ${errText}`);
    }

    const data = await response.json();
    if (data.status && data.status !== 'completed') {
      throw new Error(`ANTIGRAVITY_STATUS_${data.status}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeAntigravityResponse(data) {
  const steps = Array.isArray(data?.steps) ? data.steps : [];
  const outputStep = [...steps].reverse().find(s => s?.type === 'model_output');
  const textParts = Array.isArray(outputStep?.content)
    ? outputStep.content.filter(p => p?.type === 'text').map(p => p.text || '')
    : [];
  const rawText = textParts.join('\n').trim() || String(data?.output_text || '').trim();

  const sources = [];
  const queries = [];
  for (const step of steps) {
    if (step?.type === 'google_search_call') {
      const qs = Array.isArray(step.arguments?.queries) ? step.arguments.queries : [];
      qs.forEach(q => { if (q && !queries.includes(q)) queries.push(q); });
    }
    if (step?.type === 'model_output' && Array.isArray(step.content)) {
      step.content.forEach(part => {
        const anns = Array.isArray(part?.annotations) ? part.annotations : [];
        anns.forEach(a => {
          if (a?.type === 'url_citation' && a.url) {
            if (!sources.some(x => x.url === a.url)) sources.push({ title: a.title || a.url, url: a.url });
          }
        });
      });
    }
  }

  return {
    rawText,
    groundingSources: sources.slice(0, 12),
    groundingQueries: queries.slice(0, 12),
    usedModel: data?.model || 'antigravity-preview-05-2026',
  };
}

// ============================================================
// GENERATOR GAMBAR -- SEMUA ORISINAL, DIGAMBAR DARI DATA
// ============================================================

const escapeXml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ============================================================
// 🔥 BARU: FIX BUG NYATA (laporan langsung: soal isian singkat & jumbled
// words tampil rusak jadi "ext{...}", "extfootball" dst -- LaTeX-nya
// hilang separuh). Akar masalahnya: AI menulis LaTeX kayak \text{...}
// dengan backslash TUNGGAL di dalam string JSON. Itu sebenarnya JSON TIDAK
// VALID (backslash di JSON string WAJIB di-double: \\text{...}), tapi
// JSON.parse gak langsung error -- dia diam-diam membaca \t sebagai
// escape resmi JSON buat karakter TAB, "melahap" huruf t-nya dan
// menyisakan "ext{...}" sebagai teks. Ini juga kejadian ke \b \f \n \r
// (semua kebetulan sama dengan huruf pertama perintah LaTeX yang sering
// dipakai: \beta/\bar/\binom, \frac, \neq/\nabla, \rightarrow/\rho).
// Perbaikannya: SEBELUM JSON.parse, dobelkan backslash-backslash yang
// jelas-jelas bukan escape JSON resmi yang disengaja (huruf-huruf LaTeX
// lain kayak \t(imes), \a(lpha), dst), supaya JSON.parse balikin
// backslash TUNGGAL + nama perintah LENGKAP seperti seharusnya.
// ============================================================
const sanitizeLatexEscapes = (text) => {
  return text
    // Backslash + huruf yang BUKAN salah satu escape resmi JSON
    // (" \ / b f n r t u) -- ini SELALU perintah LaTeX (\alpha, \times,
    // \circ, dst), gak pernah dimaksudkan sebagai escape JSON. Dobelkan.
    .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
    // Backslash + salah satu dari b/f/n/r/t/u YANG DIIKUTI huruf lain
    // lagi (\text, \frac, \neq, \rho, \times, dst) -- ini AMBIGU secara
    // JSON (bisa dibaca sebagai escape resmi), tapi kalau langsung
    // disambung huruf lain berarti itu jelas nama perintah LaTeX, BUKAN
    // escape tunggal yang disengaja. Dobelkan juga backslash-nya.
    .replace(/\\([bfnrtu])(?=[a-zA-Z])/g, '\\\\$1');
};

// (a) Grafik fungsi matematika -- dirender sebagai SVG lokal dari titik
// (x,y) hasil hitungan AI. Akurat karena murni dari angka, bukan gambar.
const buildGraphImageUrl = (graph) => {
  if (!graph || !Array.isArray(graph.points) || graph.points.length < 2) return '';
  const validPoints = graph.points.filter(p => Number.isFinite(p?.x) && Number.isFinite(p?.y));
  if (validPoints.length < 2) return '';
  const highlight = Array.isArray(graph.highlight)
    ? graph.highlight.filter(p => Number.isFinite(p?.x) && Number.isFinite(p?.y))
    : [];

  // Pure SVG: no QuickChart, no third-party chart request, no paid dependency.
  const xs = validPoints.map(p => p.x);
  const ys = validPoints.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const pad = 56;
  const width = 560;
  const height = 380;
  const plotW = width - pad * 2;
  const plotH = height - pad * 2;
  const toSvg = (x, y) => ({
    x: pad + ((x - minX) / spanX) * plotW,
    y: height - pad - ((y - minY) / spanY) * plotH,
  });

  const path = validPoints.map((p, i) => {
    const pt = toSvg(p.x, p.y);
    return `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
  }).join(' ');

  const zeroX = minX <= 0 && maxX >= 0 ? toSvg(0, minY).x : null;
  const zeroY = minY <= 0 && maxY >= 0 ? toSvg(minX, 0).y : null;
  const grid = [];
  const ticks = 8;
  for (let i = 0; i <= ticks; i++) {
    const x = pad + (plotW * i / ticks);
    const y = pad + (plotH * i / ticks);
    const xv = minX + spanX * i / ticks;
    const yv = maxY - spanY * i / ticks;
    grid.push(`<line x1="${x.toFixed(2)}" y1="${pad}" x2="${x.toFixed(2)}" y2="${height - pad}" stroke="#e2e8f0" stroke-width="1"/>`);
    grid.push(`<line x1="${pad}" y1="${y.toFixed(2)}" x2="${width - pad}" y2="${y.toFixed(2)}" stroke="#e2e8f0" stroke-width="1"/>`);
    grid.push(`<text x="${x.toFixed(2)}" y="${height - 24}" font-size="10" fill="#64748b" text-anchor="middle">${xv.toFixed(2)}</text>`);
    grid.push(`<text x="${pad - 8}" y="${(y + 3).toFixed(2)}" font-size="10" fill="#64748b" text-anchor="end">${yv.toFixed(2)}</text>`);
  }

  const pointsSvg = highlight.map(p => {
    const pt = toSvg(p.x, p.y);
    return `<circle cx="${pt.x.toFixed(2)}" cy="${pt.y.toFixed(2)}" r="5" fill="#dc2626"/>`;
  }).join('');

  const axisSvg = [
    zeroX !== null ? `<line x1="${zeroX.toFixed(2)}" y1="${pad}" x2="${zeroX.toFixed(2)}" y2="${height - pad}" stroke="#475569" stroke-width="1.5"/>` : '',
    zeroY !== null ? `<line x1="${pad}" y1="${zeroY.toFixed(2)}" x2="${width - pad}" y2="${zeroY.toFixed(2)}" stroke="#475569" stroke-width="1.5"/>` : '',
  ].join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <rect x="0" y="0" width="${width}" height="${height}" fill="white"/>
    ${grid.join('')}
    ${axisSvg}
    <path d="${path}" fill="none" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${pointsSvg}
    <text x="${width / 2}" y="${height - 6}" font-size="12" fill="#1e293b" text-anchor="middle">${escapeXml(graph.xLabel || 'x')}</text>
    <text x="14" y="${height / 2}" font-size="12" fill="#1e293b" text-anchor="middle" transform="rotate(-90 14 ${height / 2})">${escapeXml(graph.yLabel || 'y')}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

// (b) Bangun datar/ruang gabungan dengan ukuran spesifik -- digambar dari
// koordinat VERTEX yang dihitung AI berdasarkan ukuran-ukuran di soal.
// Dirender sebagai SVG polygon presisi + label ukuran.
const buildShapeImageSvg = (shape) => {
  if (!shape || !Array.isArray(shape.vertices) || shape.vertices.length < 3) return '';
  const verts = shape.vertices.filter(v => typeof v.x === 'number' && typeof v.y === 'number');
  if (verts.length < 3) return '';
  const labels = Array.isArray(shape.labels) ? shape.labels : [];

  const allX = [...verts.map(v => v.x), ...labels.map(l => l.x)];
  const allY = [...verts.map(v => v.y), ...labels.map(l => l.y)];
  const minX = Math.min(...allX), maxX = Math.max(...allX);
  const minY = Math.min(...allY), maxY = Math.max(...allY);
  const w = Math.max(maxX - minX, 1), h = Math.max(maxY - minY, 1);

  const pad = Math.max(w, h) * 0.25 + 1;
  const viewW = w + pad * 2, viewH = h + pad * 2;

  // SVG y tumbuh ke BAWAH, gambar geometri biasa y tumbuh ke ATAS --
  // makanya y di-"balik" (flip) di sini.
  const flipY = (y) => (maxY - y) + pad;
  const shiftX = (x) => (x - minX) + pad;

  const pointsAttr = verts.map(v => `${shiftX(v.x).toFixed(2)},${flipY(v.y).toFixed(2)}`).join(' ');
  const fontSize = Math.max(viewW, viewH) * 0.045;

  const labelSvg = labels.map(l =>
    `<text x="${shiftX(l.x).toFixed(2)}" y="${flipY(l.y).toFixed(2)}" font-size="${fontSize.toFixed(2)}" fill="#1e293b" text-anchor="middle" font-family="sans-serif">${escapeXml(String(l.text || ''))}</text>`
  ).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewW.toFixed(2)} ${viewH.toFixed(2)}" width="500" height="${(500 * viewH / viewW).toFixed(0)}">
    <rect x="0" y="0" width="${viewW.toFixed(2)}" height="${viewH.toFixed(2)}" fill="white"/>
    <polygon points="${pointsAttr}" fill="#c7d2fe" stroke="#1e293b" stroke-width="${(fontSize * 0.08).toFixed(2)}"/>
    ${labelSvg}
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

// (c) Soal pola bentuk ala SBMPTN Penalaran Umum -- deret bentuk sederhana
// dengan atribut isi/rotasi, dirender dari deskripsi LOGIS AI.
const SHAPE_PRIMITIVES = {
  circle: (cx, cy, r, filled) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${filled ? '#1e293b' : 'white'}" stroke="#1e293b" stroke-width="2"/>`,
  square: (cx, cy, r, filled) => `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" fill="${filled ? '#1e293b' : 'white'}" stroke="#1e293b" stroke-width="2"/>`,
  triangle: (cx, cy, r, filled) => `<polygon points="${cx},${cy - r} ${cx - r},${cy + r} ${cx + r},${cy + r}" fill="${filled ? '#1e293b' : 'white'}" stroke="#1e293b" stroke-width="2"/>`,
  pentagon: (cx, cy, r, filled) => {
    const pts = Array.from({ length: 5 }, (_, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="${filled ? '#1e293b' : 'white'}" stroke="#1e293b" stroke-width="2"/>`;
  },
  star: (cx, cy, r, filled) => {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const rad = i % 2 === 0 ? r : r * 0.45;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      return `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="${filled ? '#1e293b' : 'white'}" stroke="#1e293b" stroke-width="2"/>`;
  },
};

const buildPatternImageSvg = (pattern) => {
  if (!pattern || !Array.isArray(pattern.sequence) || pattern.sequence.length === 0) return '';
  const seq = pattern.sequence.filter(s => s && SHAPE_PRIMITIVES[s.shape]);
  if (seq.length === 0) return '';

  const cellSize = 90, r = 28;
  const viewW = cellSize * seq.length;
  const viewH = cellSize;

  const cells = seq.map((item, i) => {
    const cx = cellSize * i + cellSize / 2;
    const cy = cellSize / 2;
    const shapeSvg = SHAPE_PRIMITIVES[item.shape](cx, cy, r, !!item.filled);
    const rotation = typeof item.rotation === 'number' ? item.rotation : 0;
    const boxStroke = `<rect x="${cellSize * i + 2}" y="2" width="${cellSize - 4}" height="${cellSize - 4}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`;
    return `<g transform="rotate(${rotation} ${cx} ${cy})">${shapeSvg}</g>${boxStroke}`;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewW} ${viewH}" width="${viewW}" height="${viewH}">
    <rect x="0" y="0" width="${viewW}" height="${viewH}" fill="white"/>
    ${cells}
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

// (d) Jam analog presisi -- KHUSUS buat soal "jam menunjukkan pukul
// sekian, ini pukul berapa/tulis dalam bahasa Inggris/dst". Ini BUKAN
// objek nyata yang bisa difoto (gak ada foto asli "jam analog jarumnya
// PERSIS di posisi X:Y" yang cocok buat tiap soal) -- makanya sebelumnya
// AI kepaksa pakai needs_image dan hasilnya ngasal (foto tekstur/kain
// random dari Wikimedia yang gak ada hubungannya sama sekali). Sekarang
// jamnya digambar SENDIRI sebagai SVG, jarumnya dihitung presisi dari jam
// & menit yang ditentukan AI -- selalu akurat, gak pernah nyasar.
const buildClockImageSvg = (clock) => {
  if (!clock || typeof clock.hour !== 'number' || typeof clock.minute !== 'number') return '';
  const hour = ((clock.hour % 12) + 12) % 12;
  const minute = ((clock.minute % 60) + 60) % 60;

  const size = 260;
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - 14;

  // Sudut dihitung dari arah jam 12 (atas), searah jarum jam.
  const minuteAngle = (minute / 60) * 360;
  const hourAngle = (hour / 12) * 360 + (minute / 60) * 30;
  const toXY = (angleDeg, length) => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + length * Math.cos(rad), y: cy + length * Math.sin(rad) };
  };
  const hourTip = toXY(hourAngle, r * 0.5);
  const minuteTip = toXY(minuteAngle, r * 0.75);

  // Angka 1-12 + garis penanda tiap 5 menit.
  const numeralsSvg = Array.from({ length: 12 }, (_, i) => {
    const n = i === 0 ? 12 : i;
    const pos = toXY(i * 30, r * 0.82);
    return `<text x="${pos.x.toFixed(2)}" y="${(pos.y + 6).toFixed(2)}" font-size="16" fill="#1e293b" text-anchor="middle" font-family="sans-serif" font-weight="600">${n}</text>`;
  }).join('');
  const ticksSvg = Array.from({ length: 60 }, (_, i) => {
    const isHour = i % 5 === 0;
    const outer = toXY(i * 6, r);
    const inner = toXY(i * 6, isHour ? r * 0.88 : r * 0.94);
    return `<line x1="${outer.x.toFixed(2)}" y1="${outer.y.toFixed(2)}" x2="${inner.x.toFixed(2)}" y2="${inner.y.toFixed(2)}" stroke="#1e293b" stroke-width="${isHour ? 2 : 1}"/>`;
  }).join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect x="0" y="0" width="${size}" height="${size}" fill="white"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="#1e293b" stroke-width="3"/>
    ${ticksSvg}
    ${numeralsSvg}
    <line x1="${cx}" y1="${cy}" x2="${hourTip.x.toFixed(2)}" y2="${hourTip.y.toFixed(2)}" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy}" x2="${minuteTip.x.toFixed(2)}" y2="${minuteTip.y.toFixed(2)}" stroke="#1e293b" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="5" fill="#1e293b"/>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

// ============================================================
// PROMPT
// ============================================================

const TYPE_DESCRIPTIONS = {
  multiple: `"multiple" — Pilihan Ganda: {"type":"multiple","question":"...","options":["opsi A","opsi B","opsi C","opsi D"],"correct":0,"explanation":"..."} (correct = index 0-3 dari options yang benar)`,
  truefalse: `"truefalse" — Tabel Benar/Salah, berisi beberapa pernyataan: {"type":"truefalse","question":"judul/instruksi tabel","statements":[{"text":"pernyataan 1","isTrue":true},{"text":"pernyataan 2","isTrue":false}],"explanation":"..."}`,
  multiselect: `"multiselect" — Pilih lebih dari satu jawaban benar: {"type":"multiselect","question":"...","options":["A","B","C","D"],"correctAnswers":[0,2],"explanation":"..."} (correctAnswers = array index yang semuanya benar)`,
  shortanswer: `"shortanswer" — Isian singkat: {"type":"shortanswer","question":"...","shortAnswer":"jawaban singkat yang benar","explanation":"..."}`,
  causeeffect: `"causeeffect" — Sebab Akibat ala soal SBMPTN: {"type":"causeeffect","question":"instruksi singkat","cause":"pernyataan sebab","effect":"pernyataan akibat","isCauseTrue":true,"isEffectTrue":true,"explanation":"..."}`,
  matching: `"matching" — Menjodohkan: {"type":"matching","question":"instruksi singkat","matchingPairs":[{"left":"istilah 1","right":"definisi 1"},{"left":"istilah 2","right":"definisi 2"}],"explanation":"..."} (minimal 3 pasang)`,
  reading: `"reading" — Membaca Teks (bacaan panjang + beberapa sub-soal): {"type":"reading","question":"judul singkat bacaan","readingText":"teks bacaan LENGKAP, 2-5 paragraf, gaya artikel/esai natural","subQuestions":[{"q":"pertanyaan 1","options":["A","B","C","D"],"correct":0},{"q":"pertanyaan 2","options":["A","B","C","D"],"correct":1}],"explanation":"penjelasan per nomor"} (minimal 3 sub-soal per bacaan, satu bacaan = SATU baris JSONL)`,
};

const SYSTEM_PROMPT_TEMPLATE = (allowedTypes, useTrendSearch, hotsLevel, targetYear) => `Kamu adalah penyusun soal ujian untuk "Bimbel Gemilang" di Indonesia, setara standar soal SNBT/UTBK/TKA yang sesungguhnya.

KONDISI NYATA: soal yang kamu buat akan langsung dipakai menguji siswa. Kesalahan hitungan atau kunci jawaban yang salah akan membuat siswa yang menjawab BENAR malah disalahkan sistem — ini fatal dan harus dihindari mati-matian.

ATURAN YANG TIDAK BOLEH DILANGGAR
[1] SETIAP soal hitungan WAJIB kamu kerjakan sendiri dulu langkah demi langkah di kepalamu untuk memastikan kunci jawabannya benar, SEBELUM menuliskannya.
[2] Untuk pilihan ganda: 3 opsi pengecoh harus MASUK AKAL (berasal dari kesalahan hitung yang umum dilakukan siswa), bukan asal-asalan.
[3] Setiap soal WAJIB punya "explanation" yang menjelaskan CARA mendapatkan jawaban, bukan cuma mengulang jawabannya.
[4] Bahasa dan tingkat kesulitan disesuaikan jenjang siswa. Kalau tidak disebutkan, asumsikan SMP.
[5] Tulis rumus/simbol matematika dalam LaTeX di antara tanda dolar, contoh: $\\frac{s}{t}$. KHUSUS RUMUS KIMIA: sistem ini TIDAK mendukung paket \\ce{...} (mhchem) -- JANGAN PERNAH pakai itu. Tulis rumus kimia pakai subscript/superscript LaTeX standar, contoh: $H_2O$, $2H_2 + O_2 \\rightarrow 2H_2O$. KHUSUS MATRIKS: WAJIB pakai lingkungan LaTeX matriks beneran ($\\begin{pmatrix}1 & 2 \\\\ 3 & 4\\end{pmatrix}$ atau \\begin{bmatrix}...\\end{bmatrix} kalau butuh kurung siku), SELALU dibungkus tanda dolar -- JANGAN PERNAH menyingkat matriks jadi notasi teks kayak "(1 2 / 3 4)", itu bukan cara matriks ditulis di soal ujian sungguhan dan bikin siswa bingung bedain baris/kolom.
[6] Kalau ada arahan khusus dari guru, WAJIB diikuti sebagai prioritas utama.
[7] Variasikan soal — jangan mengulang konsep yang sama persis, kecuali diminta.

[8] SOAL HOTS (Higher Order Thinking Skills)${hotsLevel ? ' -- WAJIB, level: ' + hotsLevel : ' (kalau diminta)'}
Ciri soal HOTS asli: butuh ANALISIS (memecah info, mengenali pola/hubungan), EVALUASI (menilai argumen/opsi mana paling tepat), atau PENERAPAN ke situasi BARU. Biasanya berbasis STIMULUS (bacaan/data/tabel/grafik/skenario) sebelum pertanyaan. DILARANG bikin "HOTS" cuma dengan angka lebih besar/kalimat lebih panjang -- itu bukan HOTS, itu cuma ribet. Kalau topiknya sederhana, bikin soal cerita yang MENERAPKAN konsep ke situasi nyata.

${useTrendSearch ? `[9] RISET INTERNET -- WAJIB DAN HARUS MENJADI SUMBER UTAMA
Gunakan kemampuan penelusuran web pada mode riset untuk melakukan RISET INTERNET TERLEBIH DAHULU sebelum menulis soal. Target latihan adalah ${targetYear || 'tahun berikutnya'}. Kamu TIDAK boleh menganggap soal tahun ${targetYear || 'mendatang'} sudah diketahui. Tugasmu adalah mempelajari sebanyak mungkin CONTOH SOAL PUBLIK yang benar-benar sudah ada dari tahun-tahun sebelumnya, terutama TKA/SNBT/UTBK/ujian sekolah dan sumber pendidikan tepercaya yang relevan dengan topik.

CARA RISET:
- Lakukan beberapa pencarian berbeda (minimal 4 kueri berbeda bila pencarian tersedia) dengan sudut pandang berbeda: topik, istilah ujian, contoh soal, dan stimulus. Jangan bergantung pada satu hasil pencarian.
- Prioritaskan sumber resmi/pemerintah/lembaga pendidikan serta situs pendidikan tepercaya. Cari contoh soal publik dari beberapa tahun terakhir dan, bila relevan, dokumen/PDF yang benar-benar dapat diakses publik.
- Bandingkan pola topik, bentuk stimulus, tipe penalaran, tingkat kesulitan, dan jenis jebakan yang berulang.
- Ambil INSIGHT dari contoh-contoh tersebut, bukan mengarang pola yang tidak didukung sumber.
- Setelah riset selesai, susun soal latihan BARU dan ORISINAL yang paling representatif terhadap pola yang ditemukan. Jangan menyalin soal asli kata demi kata.
- Jangan mengklaim soal yang dibuat adalah "soal resmi tahun ${targetYear || 'mendatang'}", "bocoran", atau "prediksi pasti". Gunakan istilah "latihan berbasis tren/pola soal terpublikasi".
- Bila hasil pencarian sedikit atau tidak relevan, JANGAN berpura-pura memiliki bukti. Dalam MODE RISET, hasil dengan bukti web yang tidak memadai harus DITOLAK, bukan diam-diam berubah menjadi mode offline.

SETIAP SOAL HASIL MODE RISET INTERNET WAJIB MENYERTAKAN:
\"researchBacked\": true
\"visualRequired\": true/false
\"visualKind\": \"none\" | \"clock\" | \"graph\" | \"shape\" | \"pattern\" | \"real_photo\" | \"table\" | \"diagram\"
Jangan menulis URL sumber sendiri dalam objek soal. Sumber resmi ditampilkan dari metadata grounding API. Setiap soal riset harus benar-benar didasarkan pada pola/contoh yang ditemukan, bukan sekadar diberi label researchBacked.
` : ''}
[10] VALIDASI VISUAL -- JANGAN PERNAH MEMBUAT SOAL YANG MENYEBUT STIMULUS TETAPI STIMULUSNYA TIDAK ADA
- Jika pertanyaan menggunakan frasa seperti "lihat gambar", "perhatikan gambar", "berdasarkan grafik", "berdasarkan diagram", atau membutuhkan visual untuk menjawab, set "visualRequired": true.
- Jika visualKind = "clock", WAJIB gunakan mekanisme "clock" dan JANGAN pernah meminta foto jam generik.
- Jika visualKind = "graph", "shape", atau "pattern", gunakan mekanisme terprogram yang tersedia.
- Jika visualKind = "real_photo", gunakan "needs_image" + "image_keyword" hanya untuk foto objek/fenomena nyata yang memang diperlukan. Jangan menciptakan soal yang bergantung pada gambar acak.
- Jika visualRequired=true tetapi sistem tidak dapat menyediakan visual yang tepat, soal WAJIB dianggap tidak valid dan jangan dipaksakan masuk ke hasil.
[11] GAMBAR/DIAGRAM -- SEMUA WAJIB ORISINAL, ADA 5 MEKANISME
JANGAN PERNAH berasumsi kamu "menyisipkan" gambar dari internet -- SETIAP gambar di sistem ini dibuat ULANG dari data presisi yang kamu tentukan. Pilih SATU mekanisme paling cocok untuk soal itu (kalau soal gak butuh gambar sama sekali, kosongkan semua):

(a) "graph" -- buat GRAFIK FUNGSI MATEMATIKA. Format:
"graph": {"points": [{"x":-2,"y":...}, ... minimal 15 titik rapat biar mulus, SEMUA nilai y wajib hasil hitungan benar], "highlight": [{"x":1,"y":1}], "xLabel":"x", "yLabel":"y"}

(b) "shape" -- buat BANGUN DATAR/RUANG dengan ukuran spesifik (mis. soal luas gabungan). Kamu WAJIB menghitung sendiri KOORDINAT setiap titik sudut (vertex) bangun itu berdasarkan ukuran-ukuran di soal (anggap titik (0,0) pojok kiri-bawah, satuan bebas asal proporsional). Format:
"shape": {"vertices":[{"x":0,"y":0},{"x":10,"y":0},{"x":10,"y":2},{"x":6,"y":2},{"x":6,"y":6},{"x":0,"y":6}], "labels":[{"text":"10 m","x":5,"y":-0.6},{"text":"4 m","x":8,"y":4}]}
(vertices HARUS membentuk bangun yang benar sesuai urutan keliling -- bayangkan dulu bentuknya sebelum menulis koordinatnya)

(c) "pattern" -- buat SOAL POLA BENTUK ala SBMPTN Penalaran Umum (deret bentuk berubah aturan tertentu). Bentuk yang tersedia HANYA: circle, square, triangle, pentagon, star. Format:
"pattern": {"sequence": [{"shape":"circle","filled":false,"rotation":0}, {"shape":"triangle","filled":true,"rotation":90}, ...]}
(rancang POLA LOGIS yang jelas -- misal jumlah sisi bertambah, rotasi konsisten tiap langkah, isi berselang-seling -- polanya adalah INTI soal penalarannya)

(d) "clock" -- buat SOAL BACA JAM ANALOG (mis. "jam menunjukkan pukul berapa", "tulis waktu ini dalam Bahasa Inggris", dst). Format:
"clock": {"hour": 8, "minute": 30}
(hour 0-11 atau 12/13-23 sama-sama boleh, minute 0-59 -- jarum dihitung otomatis presisi dari angka ini, kamu TIDAK perlu menggambar apa pun sendiri)

(e) "needs_image" + "image_keyword" -- HANYA untuk objek/tempat/fenomena NYATA yang punya foto asli (mis. "penampang daun", "candi Borobudur"). "image_keyword" diisi kata benda BAHASA INGGRIS. JANGAN pakai ini untuk diagram teknis dengan angka spesifik -- pakai (a)/(b)/(c)/(d), atau jelaskan lewat teks/tabel di "question". KHUSUS SOAL JAM: JANGAN PERNAH pakai needs_image buat ini walau kelihatannya "jam itu benda nyata" -- gak ada foto asli jam analog yang jarumnya PERSIS di posisi waktu yang kamu maksud di soal, pencarian foto pasti nyasar ke gambar gak relevan (ini KEGAGALAN NYATA yang PERNAH KEJADIAN: soal "jam pukul 08:30" malah dapat foto kain/kulit/buku yang gak ada hubungannya sama sekali). WAJIB pakai mekanisme (d) "clock" buat SEMUA soal yang butuh gambar jam analog.

TIPE SOAL YANG BOLEH DIPAKAI (hanya ini, sesuai permintaan guru)
${allowedTypes.map(t => TYPE_DESCRIPTIONS[t]).join('\n')}

FORMAT JAWABAN — WAJIB JSONL (SATU BARIS = SATU SOAL)
Baris PERTAMA metadata: {"meta": true}
Baris berikutnya, SATU baris SATU soal. Setiap soal WAJIB juga menyertakan salah satu (atau tidak sama sekali kalau gak perlu gambar) dari: "graph", "shape", "pattern", "clock", ATAU "needs_image"+"image_keyword".

ATURAN KETAT FORMAT:
- TIDAK ADA koma di akhir baris. TIDAK ADA kurung siku pembungkus semua soal. TIDAK ADA code fence/teks lain.
- Setiap baris harus JSON tunggal yang valid dan LENGKAP.
- Buat soal dari yang paling penting/mendasar dulu, supaya kalau terpotong, soal paling krusial sudah tersimpan.

PERIKSA SENDIRI SEBELUM MENJAWAB
1. Semua kunci jawaban sudah kuhitung ulang dan benar?
2. Pengecoh pilihan ganda masuk akal, bukan asal?
3. Semua soal punya pembahasan yang menjelaskan caranya?
4. Kalau pakai "shape": koordinat vertex-nya beneran membentuk bangun yang dimaksud soal?
5. Kalau pakai "pattern": polanya beneran logis dan konsisten, bukan asal random?
6. Kalau diminta HOTS: soal ini beneran butuh analisis/evaluasi/penerapan?
7. needs_image cuma dipakai buat objek nyata yang bisa difoto (BUKAN soal jam -- itu wajib pakai mekanisme "clock"), BUKAN diagram teknis?
8. Format JSONL benar: satu baris satu objek, tanpa koma akhir, tanpa kurung siku?
9. Semua LaTeX (kalau ada) ditulis dengan benar di antara tanda dolar, bukan disingkat/dipotong?`;

// ============================================================
// QUALITY GATE
// ============================================================
const VALID_VISUAL_KINDS = new Set(['none', 'clock', 'graph', 'shape', 'pattern', 'real_photo', 'table', 'diagram']);

const hasExplicitVisualReference = (questionText) => /\b(lihat|look at|perhatikan|amati|berdasarkan)\s+(gambar|picture|image|photo|grafik|graph|diagram|tabel|table|peta|map)|\b(gambar|picture|image|photo|grafik|graph|diagram|tabel|table|peta|map)\s+(berikut|below|above|di bawah|di atas)/i.test(String(questionText || ''));

const isValidQuestionObject = (q, allowedTypes) => {
  if (!q || typeof q !== 'object' || !allowedTypes.includes(q.type)) return false;
  if (typeof q.question !== 'string' || !q.question.trim()) return false;

  switch (q.type) {
    case 'multiple':
      return Array.isArray(q.options) && q.options.length === 4 &&
        q.options.every(o => typeof o === 'string' && o.trim()) &&
        Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 4;
    case 'multiselect':
      return Array.isArray(q.options) && q.options.length >= 4 &&
        q.options.every(o => typeof o === 'string' && o.trim()) &&
        Array.isArray(q.correctAnswers) && q.correctAnswers.length >= 1 &&
        q.correctAnswers.every(i => Number.isInteger(i) && i >= 0 && i < q.options.length);
    case 'truefalse':
      return Array.isArray(q.statements) && q.statements.length >= 2 &&
        q.statements.every(s => s && typeof s.text === 'string' && s.text.trim() && typeof s.isTrue === 'boolean');
    case 'shortanswer':
      return typeof q.shortAnswer === 'string' && q.shortAnswer.trim();
    case 'causeeffect':
      return typeof q.cause === 'string' && q.cause.trim() && typeof q.effect === 'string' && q.effect.trim() &&
        typeof q.isCauseTrue === 'boolean' && typeof q.isEffectTrue === 'boolean';
    case 'matching':
      return Array.isArray(q.matchingPairs) && q.matchingPairs.length >= 3 &&
        q.matchingPairs.every(p => p && typeof p.left === 'string' && p.left.trim() && typeof p.right === 'string' && p.right.trim());
    case 'reading':
      return typeof q.readingText === 'string' && q.readingText.trim() &&
        Array.isArray(q.subQuestions) && q.subQuestions.length >= 3 &&
        q.subQuestions.every(sq => sq && typeof sq.q === 'string' && sq.q.trim() &&
          Array.isArray(sq.options) && sq.options.length === 4 &&
          sq.options.every(o => typeof o === 'string' && o.trim()) &&
          Number.isInteger(sq.correct) && sq.correct >= 0 && sq.correct < 4);
    default:
      return false;
  }
};

// ============================================================
// HANDLER
// ============================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, mapel, kelas, jumlahSoal, types, arahan, useTrendSearch, hotsLevel, targetYear } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topik wajib diisi' });
  }

  const allowedTypes = Array.isArray(types) && types.length > 0 ? types : ['multiple'];
  const jumlah = Math.min(Math.max(parseInt(jumlahSoal) || 5, 1), 20);

  const resolvedTargetYear = parseInt(targetYear) || (new Date().getFullYear() + 1);
  const systemPrompt = SYSTEM_PROMPT_TEMPLATE(allowedTypes, !!useTrendSearch, hotsLevel || '', resolvedTargetYear);

  const arahanText = (arahan && arahan.trim())
    ? `\n\nArahan khusus dari guru (WAJIB diikuti):\n${arahan.trim()}`
    : '';

  const userPrompt = `Mata pelajaran: ${mapel || 'Umum'}
Topik/materi: ${topic}${kelas ? `\nJenjang/kelas: ${kelas}` : ''}
Jumlah soal yang diminta: ${jumlah}
Target latihan: ${resolvedTargetYear}
Tipe soal yang boleh dipakai: ${allowedTypes.join(', ')}${arahanText}

${useTrendSearch ? 'Mulai dengan RISET INTERNET dan gunakan hasil pencarian sebagai dasar utama sebelum menyusun soal. Jangan gunakan mode offline sebagai sumber utama.' : 'Buat soal berdasarkan pengetahuan model.'}

Buat ${jumlah} soal sekarang sesuai semua aturan di atas.`;

  let geminiData = null;
  let lastErr = null;
  let usedModel = '';
  let groundingSourcesFromResearch = [];
  let groundingQueriesFromResearch = [];
  let normalizedResearchText = '';

  if (useTrendSearch) {
    try {
      const researchData = await callAntigravityResearch(systemPrompt, userPrompt);
      const normalized = normalizeAntigravityResponse(researchData);
      normalizedResearchText = normalized.rawText;
      groundingSourcesFromResearch = normalized.groundingSources;
      groundingQueriesFromResearch = normalized.groundingQueries;
      usedModel = normalized.usedModel;
      if (!normalizedResearchText) throw new Error('ANTIGRAVITY_NO_OUTPUT');
      console.log(`generateQuizFromTopic sukses riset via Antigravity: ${usedModel}`);
    } catch (e) {
      lastErr = e;
      console.error('generateQuizFromTopic riset Antigravity gagal:', e.message);
    }
  } else {
    for (const modelName of GEMINI_MODELS) {
      try {
        geminiData = await callGemini(systemPrompt, userPrompt, modelName);
        lastErr = null;
        usedModel = modelName;
        console.log(`generateQuizFromTopic sukses pakai model: ${modelName}`);
        break;
      } catch (e) {
        lastErr = e;
        console.error(`generateQuizFromTopic gagal pakai model ${modelName}:`, e.message);
        const msg = String(e.message || '');
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) break;
        await new Promise(r => setTimeout(r, 800));
      }
    }
  }

  if (lastErr) {
    const msg = String(lastErr.message || '');
    const isQuota = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('QUOTA');
    return res.status(502).json({
      error: isQuota
        ? 'Kuota gratis Gemini/Antigravity sudah mencapai batas. Sistem tidak beralih ke layanan berbayar. Coba lagi setelah kuota reset.'
        : (useTrendSearch
          ? 'Riset internet gratis Gemini sedang tidak tersedia untuk project ini. Tidak ada fallback diam-diam ke AI offline.'
          : 'Layanan AI gratis Gemini sedang tidak tersedia. Coba lagi beberapa saat lagi.'),
      debug: lastErr.message,
      usedModel,
      freeTierOnly: true,
    });
  }

  // Normalisasi hasil riset agent ke bentuk yang sama dengan generateContent.
  if (useTrendSearch) {
    geminiData = {
      candidates: [{
        content: { parts: [{ text: normalizedResearchText }] },
        groundingMetadata: null,
        finishReason: 'STOP',
      }],
    };
  }

  try {
    const candidate = geminiData?.candidates?.[0];
    const rawText = candidate?.content?.parts?.[0]?.text || '';

    if (!rawText) {
      return res.status(502).json({ error: 'Astro Gemilang tidak mengembalikan jawaban, coba generate ulang.' });
    }

    // 🔥 WAJIB dijalankan SEBELUM parsing JSON -- lihat penjelasan lengkap
    // di definisi sanitizeLatexEscapes di atas. Kalau ini dilewat, semua
    // LaTeX yang mengandung \t../\n../\f../\b../\r.. akan rusak diam-diam
    // sebelum sempat diperiksa sanitizeText sama sekali.
    const fixedRawText = sanitizeLatexEscapes(rawText);

    const extractJsonObjects = (text) => {
      const objects = [];
      let depth = 0;
      let start = -1;
      let inString = false;
      let escapeNext = false;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (escapeNext) { escapeNext = false; continue; }
        if (ch === '\\') { escapeNext = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{') {
          if (depth === 0) start = i;
          depth++;
        } else if (ch === '}') {
          depth--;
          if (depth === 0 && start !== -1) {
            try {
              objects.push(JSON.parse(text.slice(start, i + 1)));
            } catch (e) {
              // objek rusak, lewati
            }
            start = -1;
          }
        }
      }
      return objects;
    };

    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
    const generatedGroundingSources = groundingChunks
      .map(c => c.web ? { title: c.web.title || c.web.uri || 'Sumber web', url: c.web.uri || '' } : null)
      .filter(Boolean)
      .filter((item, idx, arr) => item.url && arr.findIndex(x => x.url === item.url) === idx)
      .slice(0, 12);
    const groundingSources = generatedGroundingSources.length > 0 ? generatedGroundingSources : groundingSourcesFromResearch;
    const generatedGroundingQueries = candidate?.groundingMetadata?.webSearchQueries || [];
    const groundingQueries = generatedGroundingQueries.length > 0 ? generatedGroundingQueries : groundingQueriesFromResearch;

    const objects = extractJsonObjects(fixedRawText);
    const questionObjs = objects.filter(o => o.meta !== true && (o.question || o.readingText));

    if (questionObjs.length === 0) {
      return res.status(502).json({
        error: candidate?.finishReason === 'MAX_TOKENS'
          ? 'Astro Gemilang belum sempat menulis soal sebelum terpotong. Coba kurangi jumlah soal atau tipe yang diminta.'
          : 'Astro Gemilang tidak menghasilkan soal yang valid, coba generate ulang.',
      });
    }

    const sanitizeText = (s = '') => String(s).replace(/<script[\s\S]*?<\/script>/gi, '');

    const questions = questionObjs
      .map((q) => {
        if (!isValidQuestionObject(q, allowedTypes)) {
          console.warn('Quality gate: format/kunci soal tidak valid, dibuang:', q?.type, q?.question);
          return null;
        }

        if (useTrendSearch && !q.researchBacked) {
          console.warn('Quality gate: soal riset tidak memiliki researchBacked=true, dibuang.');
          return null;
        }

        const type = q.type;
        const visualRequired = !!q.visualRequired || hasExplicitVisualReference(q.question);
        let qImage = '';
        let builtVisualKind = 'none';

        try { if (q.graph) { qImage = buildGraphImageUrl(q.graph); builtVisualKind = 'graph'; } } catch (e) { console.warn('graph visual gagal:', e.message); }
        if (!qImage) { try { if (q.shape) { qImage = buildShapeImageSvg(q.shape); builtVisualKind = 'shape'; } } catch (e) { console.warn('shape visual gagal:', e.message); } }
        if (!qImage) { try { if (q.pattern) { qImage = buildPatternImageSvg(q.pattern); builtVisualKind = 'pattern'; } } catch (e) { console.warn('pattern visual gagal:', e.message); } }
        if (!qImage) { try { if (q.clock) { qImage = buildClockImageSvg(q.clock); builtVisualKind = 'clock'; } } catch (e) { console.warn('clock visual gagal:', e.message); } }

        const visualKind = VALID_VISUAL_KINDS.has(q.visualKind) ? q.visualKind : builtVisualKind;
        const wantsRealImage = q.needs_image === true || visualKind === 'real_photo';

        // Quality gate: explicit visual references must have an immediately
        // available visual, except real-photo requests which deliberately
        // hand the teacher a source-search task rather than using a random photo.
        if (visualRequired && !qImage && !wantsRealImage) {
          console.warn('Quality gate: visual wajib tetapi tidak tersedia, dibuang:', q.question);
          return null;
        }

        return {
          type,
          question: sanitizeText(q.question || ''),
          options: Array.isArray(q.options) ? q.options.map(sanitizeText) : undefined,
          correct: typeof q.correct === 'number' ? q.correct : undefined,
          correctAnswers: Array.isArray(q.correctAnswers) ? q.correctAnswers : undefined,
          statements: Array.isArray(q.statements)
            ? q.statements.map(s => ({ text: sanitizeText(s.text || ''), isTrue: !!s.isTrue }))
            : undefined,
          shortAnswer: q.shortAnswer ? sanitizeText(q.shortAnswer) : undefined,
          cause: q.cause ? sanitizeText(q.cause) : undefined,
          effect: q.effect ? sanitizeText(q.effect) : undefined,
          isCauseTrue: q.isCauseTrue !== undefined ? !!q.isCauseTrue : undefined,
          isEffectTrue: q.isEffectTrue !== undefined ? !!q.isEffectTrue : undefined,
          matchingPairs: Array.isArray(q.matchingPairs)
            ? q.matchingPairs.map(p => ({ left: sanitizeText(p.left || ''), right: sanitizeText(p.right || '') }))
            : undefined,
          readingText: q.readingText ? sanitizeText(q.readingText) : undefined,
          subQuestions: Array.isArray(q.subQuestions)
            ? q.subQuestions.map(sq => ({
                q: sanitizeText(sq.q || ''),
                options: Array.isArray(sq.options) ? sq.options.map(o => sanitizeText(String(o))) : [],
                correct: Number.isInteger(sq.correct) ? sq.correct : 0,
              }))
            : undefined,
          explanation: sanitizeText(q.explanation || ''),
          researchBacked: !!q.researchBacked && !!useTrendSearch,
          visualRequired,
          visualKind: visualKind || (qImage ? builtVisualKind : 'none'),
          qImage: qImage || undefined,
          needsImage: !qImage && wantsRealImage,
          imageHint: (!qImage && wantsRealImage) ? sanitizeText(q.image_keyword || '') : '',
        };
      })
      .filter(Boolean);

    if (useTrendSearch) {
      const sourceUrls = groundingSources;
      const domains = [...new Set(sourceUrls.map(s => { try { return new URL(s.url).hostname.replace(/^www\./, ''); } catch (_) { return ''; } }).filter(Boolean))];
      if (sourceUrls.length < 3 || domains.length < 2) {
        return res.status(502).json({
          error: 'Riset internet belum menemukan cukup sumber yang relevan. Sistem menolak membuat soal agar tidak mengarang dasar tren.',
          researchQuality: { sources: sourceUrls.length, domains: domains.length },
          groundingSources: sourceUrls,
          groundingQueries: groundingQueries || [],
          freeTierOnly: true,
        });
      }
    }

    if (questions.length === 0) {
      return res.status(502).json({
        error: 'Astro Gemilang menghasilkan soal, tapi tidak ada satu pun yang formatnya valid/sesuai permintaan. Coba generate ulang.',
      });
    }

    const possiblyTruncated = candidate?.finishReason === 'MAX_TOKENS' || questions.length < jumlah;

    const sourceDomains = [...new Set(groundingSources.map(s => {
      try { return new URL(s.url).hostname.replace(/^www\./, ''); } catch (_) { return ''; }
    }).filter(Boolean))];

    return res.status(200).json({
      success: true,
      questions,
      possiblyTruncated,
      usedTrendSearch: !!useTrendSearch,
      usedModel,
      freeTierOnly: true,
      targetYear: resolvedTargetYear,
      groundingSources,
      groundingQueries,
      researchQuality: {
        sourceCount: groundingSources.length,
        domainCount: sourceDomains.length,
        queryCount: groundingQueries.length,
      },
    });
  } catch (error) {
    console.error('generateQuizFromTopic parse error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan server: ' + error.message });
  }
}