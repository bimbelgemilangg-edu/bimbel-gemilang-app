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
//    dari internet (itu berisiko hak cipta & gak terjamin akurat). Ada 4
//    mekanisme:
//    a) "graph"   -- grafik fungsi matematika, di-plot dari titik (x,y)
//       hasil hitungan AI lewat QuickChart.
//    b) "shape"   -- bangun datar/ruang gabungan dengan ukuran spesifik,
//       digambar dari koordinat vertex yang dihitung AI, SVG presisi.
//    c) "pattern" -- soal pola bentuk ala SBMPTN Penalaran Umum, dirender
//       sebagai SVG dari deskripsi urutan bentuk yang dibuat AI.
//    d) "needs_image"+"image_keyword" -- HANYA untuk objek/fenomena NYATA
//       yang bisa difoto (dicari lewat Wikimedia di frontend), BUKAN
//       diagram teknis.

const GEMINI_MODELS = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
];

async function callGemini(systemPrompt, userPrompt, modelName, useTrendSearch) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 16384,
    },
  };

  if (useTrendSearch) {
    body.tools = [{ google_search: {} }];
  }

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

// ============================================================
// GENERATOR GAMBAR -- SEMUA ORISINAL, DIGAMBAR DARI DATA
// ============================================================

const escapeXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// (a) Grafik fungsi matematika -- di-plot lewat QuickChart.io dari titik
// (x,y) hasil hitungan AI. Akurat karena murni dari angka, bukan gambar.
const buildGraphImageUrl = (graph) => {
  if (!graph || !Array.isArray(graph.points) || graph.points.length < 2) return '';
  const validPoints = graph.points.filter(p => typeof p.x === 'number' && typeof p.y === 'number');
  if (validPoints.length < 2) return '';
  const highlight = Array.isArray(graph.highlight)
    ? graph.highlight.filter(p => typeof p.x === 'number' && typeof p.y === 'number')
    : [];

  const chartConfig = {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'f(x)',
          data: validPoints.map(p => ({ x: p.x, y: p.y })),
          borderColor: '#1e293b',
          borderWidth: 2.5,
          pointRadius: 0,
          fill: false,
          tension: 0.35,
        },
        ...(highlight.length > 0 ? [{
          label: 'Titik',
          data: highlight.map(p => ({ x: p.x, y: p.y })),
          borderColor: '#dc2626',
          backgroundColor: '#dc2626',
          pointRadius: 5,
          showLine: false,
        }] : []),
      ],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: graph.xLabel || 'x' }, grid: { color: '#e2e8f0' } },
        y: { title: { display: true, text: graph.yLabel || 'y' }, grid: { color: '#e2e8f0' } },
      },
    },
  };

  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&backgroundColor=white&width=500&height=380`;
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

const SYSTEM_PROMPT_TEMPLATE = (allowedTypes, useTrendSearch, hotsLevel) => `Kamu adalah penyusun soal ujian untuk "Bimbel Gemilang" di Indonesia, setara standar soal SNBT/UTBK/TKA yang sesungguhnya.

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

${useTrendSearch ? `[9] GUNAKAN PENCARIAN INTERNET -- WAJIB DIPAKAI
Kamu punya akses pencarian Google. WAJIB dipakai buat cari pola/format soal SNBT/UTBK/TKA/ujian sekolah TERBARU yang BENERAN ADA (tahun-tahun yang sudah lewat), topik yang sering muncul, dan gaya bahasa/level kesulitan ujian sungguhan.

ATURAN KETAT:
- JANGAN PERNAH klaim "soal asli tahun [tahun depan]" -- itu MUSTAHIL, soal yang belum dibuat gak ada di internet manapun.
- JANGAN menyalin soal asli kata demi kata -- itu pelanggaran hak cipta. Yang boleh: pelajari POLA-nya (jenis stimulus, gaya pertanyaan, topik tren), lalu buat soal BARU yang ORISINAL dengan angka/konteks berbeda tapi pola setara.
- Kalau pencarian gak nemu info relevan, tetap lanjut bikin soal berkualitas standar tinggi berdasarkan pengetahuanmu.
` : ''}
[10] GAMBAR/DIAGRAM -- SEMUA WAJIB ORISINAL, ADA 4 MEKANISME
JANGAN PERNAH berasumsi kamu "menyisipkan" gambar dari internet -- SETIAP gambar di sistem ini dibuat ULANG dari data presisi yang kamu tentukan. Pilih SATU mekanisme paling cocok untuk soal itu (kalau soal gak butuh gambar sama sekali, kosongkan semua):

(a) "graph" -- buat GRAFIK FUNGSI MATEMATIKA. Format:
"graph": {"points": [{"x":-2,"y":...}, ... minimal 15 titik rapat biar mulus, SEMUA nilai y wajib hasil hitungan benar], "highlight": [{"x":1,"y":1}], "xLabel":"x", "yLabel":"y"}

(b) "shape" -- buat BANGUN DATAR/RUANG dengan ukuran spesifik (mis. soal luas gabungan). Kamu WAJIB menghitung sendiri KOORDINAT setiap titik sudut (vertex) bangun itu berdasarkan ukuran-ukuran di soal (anggap titik (0,0) pojok kiri-bawah, satuan bebas asal proporsional). Format:
"shape": {"vertices":[{"x":0,"y":0},{"x":10,"y":0},{"x":10,"y":2},{"x":6,"y":2},{"x":6,"y":6},{"x":0,"y":6}], "labels":[{"text":"10 m","x":5,"y":-0.6},{"text":"4 m","x":8,"y":4}]}
(vertices HARUS membentuk bangun yang benar sesuai urutan keliling -- bayangkan dulu bentuknya sebelum menulis koordinatnya)

(c) "pattern" -- buat SOAL POLA BENTUK ala SBMPTN Penalaran Umum (deret bentuk berubah aturan tertentu). Bentuk yang tersedia HANYA: circle, square, triangle, pentagon, star. Format:
"pattern": {"sequence": [{"shape":"circle","filled":false,"rotation":0}, {"shape":"triangle","filled":true,"rotation":90}, ...]}
(rancang POLA LOGIS yang jelas -- misal jumlah sisi bertambah, rotasi konsisten tiap langkah, isi berselang-seling -- polanya adalah INTI soal penalarannya)

(d) "needs_image" + "image_keyword" -- HANYA untuk objek/tempat/fenomena NYATA yang punya foto asli (mis. "penampang daun", "candi Borobudur"). "image_keyword" diisi kata benda BAHASA INGGRIS. JANGAN pakai ini untuk diagram teknis dengan angka spesifik -- pakai (a)/(b)/(c), atau jelaskan lewat teks/tabel di "question".

TIPE SOAL YANG BOLEH DIPAKAI (hanya ini, sesuai permintaan guru)
${allowedTypes.map(t => TYPE_DESCRIPTIONS[t]).join('\n')}

FORMAT JAWABAN — WAJIB JSONL (SATU BARIS = SATU SOAL)
Baris PERTAMA metadata: {"meta": true}
Baris berikutnya, SATU baris SATU soal. Setiap soal WAJIB juga menyertakan salah satu (atau tidak sama sekali kalau gak perlu gambar) dari: "graph", "shape", "pattern", ATAU "needs_image"+"image_keyword".

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
7. needs_image cuma dipakai buat objek nyata yang bisa difoto, BUKAN diagram teknis?
8. Format JSONL benar: satu baris satu objek, tanpa koma akhir, tanpa kurung siku?`;

// ============================================================
// HANDLER
// ============================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, mapel, kelas, jumlahSoal, types, arahan, useTrendSearch, hotsLevel } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topik wajib diisi' });
  }

  const allowedTypes = Array.isArray(types) && types.length > 0 ? types : ['multiple'];
  const jumlah = Math.min(Math.max(parseInt(jumlahSoal) || 5, 1), 20);

  const systemPrompt = SYSTEM_PROMPT_TEMPLATE(allowedTypes, !!useTrendSearch, hotsLevel || '');

  const arahanText = (arahan && arahan.trim())
    ? `\n\nArahan khusus dari guru (WAJIB diikuti):\n${arahan.trim()}`
    : '';

  const userPrompt = `Mata pelajaran: ${mapel || 'Umum'}
Topik/materi: ${topic}${kelas ? `\nJenjang/kelas: ${kelas}` : ''}
Jumlah soal yang diminta: ${jumlah}
Tipe soal yang boleh dipakai: ${allowedTypes.join(', ')}${arahanText}

Buat ${jumlah} soal sekarang sesuai semua aturan di atas.`;

  let geminiData;
  let lastErr;

  for (const modelName of GEMINI_MODELS) {
    try {
      geminiData = await callGemini(systemPrompt, userPrompt, modelName, !!useTrendSearch);
      lastErr = null;
      console.log(`generateQuizFromTopic sukses pakai model: ${modelName}${useTrendSearch ? ' (dengan pencarian internet)' : ''}`);
      break;
    } catch (e) {
      lastErr = e;
      console.error(`generateQuizFromTopic gagal pakai model ${modelName}:`, e.message);
      // 🔥 FIX BUG NYATA (kelas yang sama persis dengan yang ketemu di
      // generateMateriSection.js): sebelumnya SETIAP error 429 (kuota
      // habis) langsung dianggap "model ini gak bisa dipakai sama
      // sekali", padahal 429 itu BISA JADI cuma kuota fitur PENCARIAN
      // (`useTrendSearch`) doang yang habis -- generate soal POLOS TANPA
      // pencarian di model yang sama seringkali masih longgar kuotanya.
      // Sekarang HANYA 404 (model beneran gak ada) yang langsung dianggap
      // model ini gak bisa dipakai. Untuk 429 ATAU error lain, tetap
      // dicoba ulang -- dan KALAU tadinya pakai pencarian, percobaan
      // ulang ini SENGAJA TANPA pencarian (bukan pakai setting yang sama
      // seperti sebelumnya, yang percuma kalau penyebabnya emang
      // pencarian itu sendiri).
      const isModelNotFound = e.message.includes('404');
      if (isModelNotFound) continue;

      await new Promise(r => setTimeout(r, 2000));
      try {
        geminiData = await callGemini(systemPrompt, userPrompt, modelName, false);
        lastErr = null;
        console.log(`generateQuizFromTopic sukses pakai model: ${modelName} (TANPA pencarian, fallback)`);
        break;
      } catch (e2) {
        lastErr = e2;
      }
    }
  }

  if (lastErr) {
    const isQuota = lastErr.message.includes('429');
    return res.status(502).json({
      error: isQuota
        ? 'Kuota gratis Astro Gemilang hari ini sudah habis di semua model. Coba lagi besok.'
        : 'Gagal menghubungi Astro Gemilang. Coba lagi beberapa saat lagi.',
      debug: lastErr.message,
    });
  }

  try {
    const candidate = geminiData?.candidates?.[0];
    const rawText = candidate?.content?.parts?.[0]?.text || '';

    if (!rawText) {
      return res.status(502).json({ error: 'Astro Gemilang tidak mengembalikan jawaban, coba generate ulang.' });
    }

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

    const objects = extractJsonObjects(rawText);
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
        if (!allowedTypes.includes(q.type)) {
          console.warn('Soal Astro Gemilang dibuang karena tipe gak sesuai permintaan:', q.type, 'diminta:', allowedTypes);
          return null;
        }
        const type = q.type;

        if (type === 'reading') {
          const validSub = Array.isArray(q.subQuestions)
            ? q.subQuestions.filter(sq =>
                sq && typeof sq.q === 'string' && sq.q.trim() &&
                Array.isArray(sq.options) && sq.options.length >= 2 &&
                Number.isInteger(sq.correct) && sq.correct >= 0 && sq.correct < sq.options.length
              )
            : [];
          if (!q.readingText || validSub.length === 0) {
            console.warn('Soal reading dibuang karena readingText/subQuestions gak lengkap');
            return null;
          }
        }

        // Gambar: coba tiap mekanisme, urutan prioritas graph -> shape ->
        // pattern -> needs_image (real photo). Kalau satu gagal/gak
        // lengkap, dianggap gak ada gambar (bukan error fatal).
        let qImage = '';
        try { if (q.graph) qImage = buildGraphImageUrl(q.graph); } catch (e) { /* abaikan, lanjut tanpa gambar */ }
        if (!qImage) { try { if (q.shape) qImage = buildShapeImageSvg(q.shape); } catch (e) { /* abaikan */ } }
        if (!qImage) { try { if (q.pattern) qImage = buildPatternImageSvg(q.pattern); } catch (e) { /* abaikan */ } }

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
            ? q.subQuestions
                .filter(sq => sq && typeof sq.q === 'string' && Array.isArray(sq.options) && Number.isInteger(sq.correct))
                .map(sq => ({
                  q: sanitizeText(sq.q),
                  options: sq.options.map(o => sanitizeText(String(o))),
                  correct: sq.correct,
                }))
            : undefined,
          explanation: sanitizeText(q.explanation || ''),
          // Gambar hasil generate sendiri (graph/shape/pattern) langsung
          // dipasang ke qImage -- guru gak perlu upload apa-apa lagi.
          qImage: qImage || undefined,
          // needs_image tetap diteruskan sebagai petunjuk buat frontend
          // (dicari lewat Wikimedia di sana) -- HANYA relevan kalau qImage
          // masih kosong (gak ada graph/shape/pattern buat soal ini).
          needsImage: !qImage && !!q.needs_image,
          imageHint: (!qImage && q.needs_image) ? sanitizeText(q.image_keyword || '') : '',
        };
      })
      .filter(Boolean);

    if (questions.length === 0) {
      return res.status(502).json({
        error: 'Astro Gemilang menghasilkan soal, tapi tidak ada satu pun yang formatnya valid/sesuai permintaan. Coba generate ulang.',
      });
    }

    const possiblyTruncated = candidate?.finishReason === 'MAX_TOKENS' || questions.length < jumlah;

    const groundingSources = (candidate?.groundingMetadata?.groundingChunks || [])
      .map(c => c.web?.title || c.web?.uri)
      .filter(Boolean)
      .slice(0, 5);

    return res.status(200).json({
      success: true,
      questions,
      possiblyTruncated,
      usedTrendSearch: !!useTrendSearch,
      groundingSources,
    });
  } catch (error) {
    console.error('generateQuizFromTopic parse error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan server: ' + error.message });
  }
}