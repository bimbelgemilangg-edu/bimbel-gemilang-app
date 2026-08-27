// src/pages/admin/banksoal/BankSoalImport.jsx
// ============================================================
// Halaman admin: unggah PDF berisi soal -> soal dipotong PER BUTIR
// (tanpa AI) -> teks soal & opsinya ditranskripsi AI (satu soal per
// panggilan) -> admin meninjau & mengoreksi -> simpan ke Bank Soal.
//
// ------------------------------------------------------------
// ⚠️ RIWAYAT ARSITEKTUR (Agustus 2026, revisi ke-3)
// ------------------------------------------------------------
// Revisi 1: AI membaca SATU HALAMAN PENUH sekaligus (transkripsi +
//   jawaban + pembahasan semua soal di halaman itu dalam satu
//   respons). GAGAL: respons kepotong di tengah pada halaman padat,
//   dan satu soal yang kepotong bisa bikin SEMUA soal di halaman itu
//   hilang (lihat riwayat commit lain di repo ini).
//
// Revisi 2: pemotongan soal jadi TANPA AI (deteksi posisi teks asli
//   di PDF), tapi AI-nya SAMA SEKALI TIDAK dipanggil -- yang tersimpan
//   cuma crop gambar mentah seluruh blok soal, tanpa teks yang bisa
//   diedit sama sekali. Ternyata ini kurang -- soal jadi tidak bisa
//   dicari/difilter isinya, dan "gambar doang" tidak jelas dibaca.
//
// Revisi 3 (SEKARANG): kombinasi keduanya --
//   1. DETEKSI BATAS SOAL: tetap tanpa AI (posisi teks asli di PDF,
//      bukan tebakan visual) -- logika ini DIPORTING PERSIS dari
//      SmartImportPanel.jsx yang sudah lama terbukti jalan di project
//      ini, bukan ditulis ulang dari nol.
//   2. TRANSKRIPSI TEKS: DENGAN AI, tapi SATU SOAL per panggilan
//      (bukan satu halaman berisi banyak soal) -- soal & opsi jadi
//      TEKS YANG BISA DIEDIT admin. Karena keluaran per panggilan
//      kecil, risiko kepotong di tengah jalan (masalah Revisi 1)
//      jauh lebih kecil.
//   3. GAMBAR/DIAGRAM: AI menandai KALAU soal itu memuat diagram/
//      grafik/foto yang jadi bagian soal (hasFigure), lalu HANYA
//      area itu yang dipotong jadi qImage -- bukan seluruh blok
//      soal. Soal murni teks tidak punya qImage sama sekali.
//   4. JAWABAN & PEMBAHASAN: TETAP DITUNDA ke tahap lain (bukan
//      dibuat sekarang) -- keputusan eksplisit pemilik bimbel supaya
//      tidak boros memanggil AI untuk menjawab SEMUA soal di Bank
//      Soal padahal belum tentu semuanya dipakai guru. Baru dibuat
//      NANTI saat soal ini benar-benar dipilih guru untuk sebuah
//      kuis (langkah terpisah, belum dibangun, menumpang di endpoint
//      /api/smartParseQuiz mode "questionImage" yang sudah disiapkan).
//
// ------------------------------------------------------------
// SYARAT PENTING: PDF HARUS PUNYA LAPISAN TEKS ASLI
// ------------------------------------------------------------
// Deteksi BATAS soal (bukan transkripsi isinya) bergantung pada
// posisi teks SUNGGUHAN di dalam file PDF, bukan menebak dari
// gambar. Kalau PDF-nya hasil SCAN MURNI tanpa lapisan teks (foto
// halaman yang ditempel jadi PDF), deteksi batas ini tidak akan
// menemukan apa pun. Untuk PDF hasil scan murni, perlu jalur lain
// (OCR penuh per halaman) yang belum dibangun di sini.
//
// ------------------------------------------------------------
// KENAPA PDF.JS DIMUAT DARI CDN, BUKAN NPM
// ------------------------------------------------------------
// Sempat dicoba lewat `import * as pdfjsLib from 'pdfjs-dist'` +
// Vite `?url` untuk workernya -- GAGAL BUILD di Vercel ("Rollup
// failed to resolve import"). SmartImportPanel.jsx (sudah lama jalan
// di project ini) memuat pdf.js lewat tag <script> dari CDN, bukan
// npm import -- pola yang SAMA PERSIS dipakai di sini, termasuk
// versi CDN-nya, supaya dua fitur berbagi cache browser yang sama.
//
// ------------------------------------------------------------
// KENAPA TINJAUAN ADMIN TETAP WAJIB
// ------------------------------------------------------------
// AI tetap bisa salah membaca notasi matematika yang rumit. Layar
// tinjau menampilkan crop asli berdampingan dengan teks hasil
// transkripsi supaya admin bisa mencocokkan & mengoreksi langsung
// sebelum soal disetujui -- bukan sekadar tempat menyetujui gambar
// mentah tanpa isi yang jelas.
//
// ------------------------------------------------------------
// INTEGRASI YANG DIBUTUHKAN
// ------------------------------------------------------------
// props:
//   folderId, folderName : folder tujuan penyimpanan
//   onSaveQuestions(soal[]) : dipanggil saat admin menekan "Simpan".
//   onCancel() : opsional, menutup halaman.
//
// Endpoint yang dipakai: POST /api/smartParseQuiz
// dengan body { questionCropImage } -- MENUMPANG di endpoint yang
// sudah ada (lihat catatan batas 12 Serverless Function di file
// smartParseQuiz.js). Endpoint mode "questionImage" (untuk generate
// jawaban+pembahasan nanti di ManageQuiz) TIDAK dipanggil dari file
// ini.
// ============================================================

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
  } from 'react';
  
  // Sama persis dengan yang sudah dipakai ManageQuiz.jsx untuk
  // merender rumus LaTeX -- bukan library baru, jadi tidak menambah
  // beban bundle sama sekali.
  import 'katex/dist/katex.min.css';
  import { InlineMath } from 'react-katex';
  
  // Sama persis dengan pola SmartImportPanel.jsx -- lihat penjelasan
  // panjang di header file ini.
  const PDFJS_SCRIPT =
    'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js';
  
  const PDFJS_WORKER =
    'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  
  function ensurePdfJsLoaded() {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        resolve(window.pdfjsLib);
        return;
      }
  
      const script = document.createElement('script');
      script.src = PDFJS_SCRIPT;
  
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        resolve(window.pdfjsLib);
      };
  
      script.onerror = () =>
        reject(new Error('Gagal memuat pembaca PDF.'));
  
      document.body.appendChild(script);
    });
  }
  
  // ============================================================
  // DETEKSI & POTONG SOAL -- DIPORTING PERSIS DARI SmartImportPanel.jsx
  // ============================================================
  // Tidak ditulis ulang dari nol -- logika di bawah ini (deteksi
  // margin kiri, deteksi awal soal, deteksi klaster gambar opsi) SUDAH
  // TERBUKTI JALAN di fitur lain project ini. Diporting apa adanya
  // supaya perilakunya konsisten dan tidak menghadirkan bug baru yang
  // sebenarnya sudah pernah dipecahkan di file lain.
  
  const RENDER_SCALE = 2.2;
  const LEFT_MARGIN_TOLERANCE = 40; // px toleransi posisi X nomor soal asli vs sub-list menjorok
  
  // 🔥 FIX BUG NYATA: versi sebelumnya cuma mendeteksi SATU margin kiri
  // (X paling sering muncul di seluruh halaman). Untuk dokumen SATU
  // KOLOM itu cukup -- tapi buku tryout SNBT/UTBK hampir selalu DUA
  // KOLOM, dan margin kiri kolom kanan itu X YANG BEDA SAMA SEKALI dari
  // margin kolom kiri. Akibatnya nomor soal di kolom yang "kalah suara"
  // gagal lolos cek `isNearMargin`, dan lebih parah lagi: batas bawah
  // crop soal (`bottom = starts[i+1].y`) bisa salah ambil nomor dari
  // KOLOM LAIN yang kebetulan sejajar tingginya -- inilah penyebab
  // gambar/tabel "kepotong tidak akurat" & crop soal yang bocor
  // menyerempet awal soal tetangga.
  //
  // Sekarang: deteksi SEMUA klaster margin kiri yang signifikan (bukan
  // cuma yang paling sering), bukan satu angka tunggal.
  function detectLeftMargins(items) {
    const xCounts = new Map();
    items.forEach((it) => {
      const xKey = Math.round(it.transform[4] / 5) * 5;
      xCounts.set(xKey, (xCounts.get(xKey) || 0) + 1);
    });
  
    // Urutkan X dari yang paling sering muncul, lalu gabungkan X yang
    // berdekatan (dalam toleransi margin) jadi satu klaster -- supaya
    // variasi kecil posisi glyph tidak dianggap kolom terpisah.
    const sortedX = [...xCounts.entries()].sort((a, b) => b[1] - a[1]);
  
    const clusters = [];
    for (const [x, count] of sortedX) {
      const existing = clusters.find(
        (c) => Math.abs(c.x - x) <= LEFT_MARGIN_TOLERANCE,
      );
      if (existing) {
        existing.count += count;
      } else {
        clusters.push({ x, count });
      }
    }
  
    // Ambang batas: klaster harus punya cukup baris teks supaya bukan
    // sekadar kebetulan (mis. satu dua baris judul yang X-nya beda).
    // Maksimal 2 klaster diambil (kolom kiri & kanan) -- dokumen dengan
    // lebih dari 2 kolom di luar cakupan saat ini.
    const MIN_LINES_FOR_COLUMN = 5;
  
    return clusters
      .filter((c) => c.count >= MIN_LINES_FOR_COLUMN)
      .sort((a, b) => a.x - b.x) // urut kiri ke kanan
      .slice(0, 2)
      .map((c) => c.x);
  }
  
  // Kembalikan SEMUA soal yang terdeteksi, DIKELOMPOKKAN per kolom, dan
  // DIURUTKAN sesuai urutan baca yang benar: kolom kiri dulu (atas ke
  // bawah), baru kolom kanan (atas ke bawah) -- bukan diurutkan mentah
  // berdasar posisi Y lintas kolom (itu yang bikin batas antar-soal
  // salah ambil nomor dari kolom sebelah).
  // Jarak X minimum untuk menganggap dua potongan teks pada Y yang sama
  // sebagai BLOK TERPISAH (kolom berbeda), bukan cuma spasi antar kata
  // biasa. Spasi antar kata normal cuma beberapa poin; jarak antar
  // kolom biasanya jauh lebih lebar dari itu.
  const COLUMN_SEGMENT_GAP = 60;
  
  function detectQuestionStarts(items, leftMargins) {
    const lineMap = new Map();
    items.forEach((item) => {
      const yKey = Math.round(item.transform[5] / 2) * 2;
      if (!lineMap.has(yKey)) lineMap.set(yKey, []);
      lineMap.get(yKey).push(item);
    });
  
    // starts per kolom -- index array sejajar dengan leftMargins.
    const startsByColumn = leftMargins.map(() => []);
  
    lineMap.forEach((lineItems, y) => {
      const sorted = lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
  
      // 🔥 FIX BUG NYATA: dua kolom yang KEBETULAN sejajar tepat di Y
      // yang sama (lazim terjadi karena kedua kolom biasanya mengikuti
      // grid baris yang sama) sebelumnya tergabung jadi SATU "baris",
      // sehingga nomor soal kolom kanan ikut ketutup teks kolom kiri di
      // depannya dan gagal terdeteksi sebagai awal soal baru. Sekarang
      // baris yang sama dipecah jadi beberapa SEGMEN kalau ada jarak X
      // yang lebar (indikasi kolom berbeda, bukan spasi antar kata).
      const segments = [];
      let current = [sorted[0]];
      for (let i = 1; i < sorted.length; i++) {
        const prevItem = sorted[i - 1];
        const prevRight =
          prevItem.transform[4] + (prevItem.width || 0);
        const gap = sorted[i].transform[4] - prevRight;
  
        if (gap > COLUMN_SEGMENT_GAP) {
          segments.push(current);
          current = [sorted[i]];
        } else {
          current.push(sorted[i]);
        }
      }
      segments.push(current);
  
      for (const segment of segments) {
        const first = segment[0];
        const text = segment.map((i) => i.str).join(' ').trim();
        const matchesNumber = /^\d{1,3}[.)]\s*/.test(text);
        if (!matchesNumber) continue;
  
        // Cocokkan ke kolom margin TERDEKAT (bukan cuma satu margin
        // tunggal seperti versi lama) -- ini yang membuat nomor soal di
        // KEDUA kolom sama-sama terdeteksi.
        let bestColumn = -1;
        let bestDistance = Infinity;
        leftMargins.forEach((marginX, ci) => {
          const distance = Math.abs(first.transform[4] - marginX);
          if (distance <= LEFT_MARGIN_TOLERANCE && distance < bestDistance) {
            bestDistance = distance;
            bestColumn = ci;
          }
        });
  
        if (bestColumn === -1) continue;
  
        startsByColumn[bestColumn].push({
          y,
          number: parseInt(text.match(/^\d{1,3}/)[0], 10),
        });
      }
    });
  
    // Urutkan tiap kolom atas ke bawah (PDF: y besar = atas), lalu
    // tandai kolom & indeks-berikutnya-dalam-kolom-yang-sama supaya
    // pemanggil bisa menghitung batas bawah crop dengan benar (next
    // start HARUS dari kolom yang sama, bukan kolom lain yang sejajar
    // tingginya).
    const result = [];
    startsByColumn.forEach((columnStarts, columnIndex) => {
      const sorted = columnStarts.sort((a, b) => b.y - a.y);
      sorted.forEach((s, i) => {
        result.push({
          y: s.y,
          number: s.number,
          columnIndex,
          // y dari nomor BERIKUTNYA di kolom YANG SAMA (bukan lintas
          // kolom) -- null kalau ini soal terakhir di kolom itu,
          // artinya batas bawahnya adalah dasar halaman.
          nextYInSameColumn: i + 1 < sorted.length ? sorted[i + 1].y : null,
        });
      });
    });
  
    // Urutan BACA akhir: kolom kiri penuh dulu (atas->bawah), baru
    // kolom kanan (atas->bawah) -- bukan urut Y mentah lintas kolom.
    return result.sort((a, b) => {
      if (a.columnIndex !== b.columnIndex) return a.columnIndex - b.columnIndex;
      return b.y - a.y;
    });
  }
  
  async function findImageRegions(page, pdfjsLib) {
    const opList = await page.getOperatorList();
    const regions = [];
    let currentTransform = null;
  
    for (let i = 0; i < opList.fnArray.length; i++) {
      const fn = opList.fnArray[i];
      if (fn === pdfjsLib.OPS.transform) {
        currentTransform = opList.argsArray[i];
      }
      if (
        fn === pdfjsLib.OPS.paintImageXObject ||
        fn === pdfjsLib.OPS.paintJpegXObject
      ) {
        if (currentTransform) {
          const [a, b, c, d, e, f] = currentTransform;
          const width = Math.hypot(a, b);
          const height = Math.hypot(c, d);
          regions.push({ x: e, y: f, width, height });
        }
      }
    }
    return regions;
  }
  
  function clusterOptionImages(regions) {
    if (regions.length < 2) return null;
    const sorted = [...regions].sort((a, b) => b.y - a.y);
    const groups = [];
    let current = [sorted[0]];
  
    for (let i = 1; i < sorted.length; i++) {
      const prev = current[current.length - 1];
      if (Math.abs(sorted[i].y - prev.y) < 30) {
        current.push(sorted[i]);
      } else {
        groups.push(current);
        current = [sorted[i]];
      }
    }
    groups.push(current);
  
    const candidate = groups.find((g) => {
      if (g.length < 2 || g.length > 5) return false;
      const avgW = g.reduce((s, r) => s + r.width, 0) / g.length;
      return g.every((r) => Math.abs(r.width - avgW) / avgW < 0.4);
    });
  
    if (!candidate) return null;
    return candidate.sort((a, b) => a.x - b.x); // kiri ke kanan (A, B, C, D)
  }
  
  function pdfRectToCanvasRect(viewport, xPdf, yTopPdf, yBottomPdf, widthPdf) {
    const [x1, y1] = viewport.convertToViewportPoint(xPdf, yTopPdf);
    const [x2, y2] = viewport.convertToViewportPoint(xPdf + widthPdf, yBottomPdf);
    return {
      x: Math.min(x1, x2),
      y: Math.min(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1),
    };
  }
  
  function cropCanvasToDataUrl(sourceCanvas, rect, paddingPx = 8, quality = 0.9) {
    const x = Math.max(0, rect.x - paddingPx);
    const y = Math.max(0, rect.y - paddingPx);
    const w = Math.min(sourceCanvas.width - x, rect.width + paddingPx * 2);
    const h = Math.min(sourceCanvas.height - y, rect.height + paddingPx * 2);
    if (w <= 0 || h <= 0) return null;
  
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(sourceCanvas, x, y, w, h, 0, 0, w, h);
    return out.toDataURL('image/jpeg', quality);
  }
  
  // 🔥 BARU: potong SUB-AREA dari sebuah crop soal (bukan dari halaman
  // penuh) berdasarkan figureBBox yang dikembalikan AI transkripsi --
  // koordinatnya ternormalisasi 0..1 RELATIF TERHADAP crop soal itu
  // sendiri (lihat prompt di smartParseQuiz.js). Dipakai supaya yang
  // tersimpan sebagai qImage HANYA area diagram/grafik/fotonya saja,
  // bukan seluruh blok soal (yang teksnya sudah dipisah jadi field
  // "question"/"options" sendiri).
  function cropFigureFromQuestionImage(questionImageDataUrl, bbox) {
    return new Promise((resolve) => {
      if (!bbox) {
        resolve(null);
        return;
      }
  
      const img = new Image();
      img.onload = () => {
        const x = Math.max(0, Math.min(1, Number(bbox.x) || 0));
        const y = Math.max(0, Math.min(1, Number(bbox.y) || 0));
        const w = Math.max(0, Math.min(1 - x, Number(bbox.width) || 0));
        const h = Math.max(0, Math.min(1 - y, Number(bbox.height) || 0));
  
        if (!(w > 0.02) || !(h > 0.02)) {
          resolve(null);
          return;
        }
  
        const sx = Math.round(x * img.width);
        const sy = Math.round(y * img.height);
        const sw = Math.round(w * img.width);
        const sh = Math.round(h * img.height);
  
        const out = document.createElement('canvas');
        out.width = sw;
        out.height = sh;
        const ctx = out.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sw, sh);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        resolve(out.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = () => resolve(null);
      img.src = questionImageDataUrl;
    });
  }
  
  // ============================================================
  // KONSTANTA LAIN
  // ============================================================
  
  // Jeda antar panggilan AI transkripsi -- jaga rate limit tier gratis
  // Gemini (sekarang ADA panggilan jaringan per soal lagi, beda dari
  // revisi sebelumnya yang murni tanpa AI sama sekali).
  const DELAY_BETWEEN_QUESTIONS_MS = 500;
  
  const STATUS = {
    IDLE: 'idle',
    LOADING_PDF: 'loading_pdf',
    PROCESSING: 'processing',
    PAUSED: 'paused',
    DONE: 'done',
    ERROR: 'error',
  };
  
  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB'];
    let value = bytes;
    let i = 0;
    while (value >= 1024 && i < units.length - 1) {
      value /= 1024;
      i += 1;
    }
    return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
  }
  
  function newId() {
    return `q_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }
  
  // ============================================================
  // 🔥 BARU: RENDER PRATINJAU RUMUS -- INI YANG MEMPERBAIKI KELUHAN
  // "hasil transkripsi kelihatan ngaco/ngarang"
  // ============================================================
  // AI menulis rumus matematika dibungkus \( ... \) (LaTeX) di dalam
  // teks soal & opsi -- itu format yang SAH dan SUDAH BENAR, tapi kalau
  // ditampilkan mentah sebagai teks biasa (mis. di kotak <textarea>),
  // buat mata orang yang tidak familiar sintaks LaTeX itu kelihatan
  // seperti kode rusak penuh garis miring & kurung kurawal, bukan
  // rumus yang bisa dipahami.
  //
  // Fungsi ini memecah teks jadi potongan teks-biasa dan potongan-
  // rumus, lalu potongan rumusnya dirender BENERAN jadi tampilan
  // matematika (pangkat, subscript, pecahan, dll) pakai react-katex --
  // library yang SAMA yang sudah dipakai ManageQuiz.jsx untuk
  // menampilkan soal ke guru/siswa, supaya pratinjau di sini benar-
  // benar mencerminkan tampilan akhirnya nanti, bukan cuma dekorasi.
  function renderWithLatexPreview(text) {
    if (!text) return null;
  
    const parts = String(text).split(/(\\\(.*?\\\))/g);
  
    return parts.map((part, i) => {
      const match = /^\\\((.*)\\\)$/.exec(part);
  
      if (!match) {
        return part ? <span key={i}>{part}</span> : null;
      }
  
      try {
        return <InlineMath key={i} math={match[1]} />;
      } catch (e) {
        // Kalau LaTeX-nya sendiri tidak valid (jarang, tapi bisa
        // terjadi kalau AI menulis sintaks yang salah) -- tampilkan
        // teks mentahnya saja daripada bikin seluruh kartu error.
        return <span key={i}>{part}</span>;
      }
    });
  }
  
  // ============================================================
  // PANGGIL AI -- HANYA UNTUK TRANSKRIPSI (bukan jawaban)
  // ============================================================
  
  async function transcribeQuestionWithAI(questionImageDataUrl) {
    const response = await fetch('/api/smartParseQuiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionCropImage: questionImageDataUrl,
      }),
    });
  
    const data = await response.json();
  
    if (!response.ok || !data.success) {
      throw new Error(data?.error || `HTTP ${response.status}`);
    }
  
    return {
      question: typeof data.question === 'string' ? data.question : '',
      options: Array.isArray(data.options) ? data.options : [],
      // 🔥 BARU: 4 tipe soal SNBT/UTBK (diadopsi dari prototipe HTML
      // mandiri yang terbukti berhasil), bukan cuma "pilihan ganda".
      tipeSoal:
        [
          'pilihan_ganda',
          'pernyataan_kompleks',
          'hubungan_kuantitas',
          'isian_singkat',
        ].includes(data.tipeSoal)
          ? data.tipeSoal
          : 'pilihan_ganda',
      kuantitasP: typeof data.kuantitasP === 'string' ? data.kuantitasP : '',
      kuantitasQ: typeof data.kuantitasQ === 'string' ? data.kuantitasQ : '',
      hasFigure: Boolean(data.hasFigure),
      figureBBox: data.figureBBox || null,
      readingConfidence: data.readingConfidence === 'low' ? 'low' : 'high',
    };
  }
  
  // 🔥 BARU: label & warna badge tipe soal -- warnanya SENGAJA disamakan
  // dengan prototipe HTML mandiri (biru/ungu/hijau/kuning) supaya kalau
  // guru pernah lihat prototipenya, tampilannya konsisten & langsung
  // familiar.
  const TIPE_SOAL_META = {
    pilihan_ganda: { label: 'Pilihan Ganda', color: '#1d4ed8', bg: '#eff6ff' },
    pernyataan_kompleks: {
      label: 'Pernyataan Kompleks (1,2,3,4)',
      color: '#7e22ce',
      bg: '#faf5ff',
    },
    hubungan_kuantitas: {
      label: 'Hubungan Kuantitas (P & Q)',
      color: '#047857',
      bg: '#ecfdf5',
    },
    isian_singkat: {
      label: 'Isian Singkat / Nilai',
      color: '#b45309',
      bg: '#fffbeb',
    },
  };
  
  // 🔥 ARSITEKTUR SAAT INI (revisi ke-2):
  // - DETEKSI BATAS SOAL: tanpa AI (lihat bagian di atas -- posisi teks
  //   asli di PDF, bukan tebakan visual).
  // - TRANSKRIPSI TEKS SOAL & OPSI: DENGAN AI, tapi SATU SOAL per
  //   panggilan (bukan satu halaman berisi banyak soal sekaligus) --
  //   supaya soal & opsi jawaban jadi TEKS YANG BISA DIEDIT admin,
  //   bukan cuma gambar mentah yang tidak jelas. Karena keluaran per
  //   panggilan kecil (satu soal saja), risiko respons kepotong di
  //   tengah jalan (masalah yang pernah terjadi di desain PERTAMA, saat
  //   satu halaman penuh dibaca sekaligus) jadi jauh lebih kecil.
  // - GAMBAR/DIAGRAM DI DALAM SOAL: AI menandai KALAU ADA (hasFigure),
  //   lalu HANYA area diagram/grafik/foto itu yang dipotong jadi qImage
  //   -- bukan seluruh blok soal. Soal yang murni teks tidak punya
  //   qImage sama sekali.
  // - JAWABAN & PEMBAHASAN: SENGAJA BELUM DIISI di tahap impor ini --
  //   itu dibuat NANTI, saat guru benar-benar memilih soal ini untuk
  //   dipakai di sebuah kuis (langkah terpisah, belum dibangun, akan
  //   menumpang di endpoint /api/smartParseQuiz mode "questionImage").
  //   Alasannya: sayang memanggil AI untuk menjawab SEMUA soal di Bank
  //   Soal padahal belum tentu semuanya akan dipakai guru.
  
  // ============================================================
  // KOMPONEN UTAMA
  // ============================================================
  
  export default function BankSoalImport({
    folderId = null,
    folderName = 'Bank Soal',
    onSaveQuestions,
    onCancel,
  }) {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState(STATUS.IDLE);
    const [errorMessage, setErrorMessage] = useState('');
  
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [startPage, setStartPage] = useState(1);
    const [endPage, setEndPage] = useState(0);
  
    // Hasil deteksi per halaman: { pageNumber, pageImage, questions[], error }
    const [pages, setPages] = useState([]);
    const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  
    const [saving, setSaving] = useState(false);
    const [savedCount, setSavedCount] = useState(0);
  
    const pdfDocRef = useRef(null);
    const abortRef = useRef(false);
    const pauseRef = useRef(false);
  
    // ----------------------------------------------------------
    // MUAT PDF
    // ----------------------------------------------------------
  
    const handleFileChange = useCallback(async (event) => {
      const picked = event.target.files?.[0];
      if (!picked) return;
  
      if (picked.type !== 'application/pdf') {
        setErrorMessage(
          'Berkas harus PDF. Word tidak didukung karena tata letak dan rumusnya bisa bergeser antar versi Office.',
        );
        setStatus(STATUS.ERROR);
        return;
      }
  
      setFile(picked);
      setErrorMessage('');
      setPages([]);
      setSavedCount(0);
      setStatus(STATUS.LOADING_PDF);
  
      try {
        const pdfjsLib = await ensurePdfJsLoaded();
        const buffer = await picked.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  
        pdfDocRef.current = { doc, pdfjsLib };
        setTotalPages(doc.numPages);
        setStartPage(1);
        setEndPage(doc.numPages);
        setStatus(STATUS.IDLE);
      } catch (error) {
        setErrorMessage(
          `PDF tidak bisa dibuka: ${error?.message || 'berkas mungkin rusak atau terkunci sandi'}.`,
        );
        setStatus(STATUS.ERROR);
      }
    }, []);
  
    // ----------------------------------------------------------
    // DETEKSI & POTONG SOAL DI SATU HALAMAN (TANPA AI)
    // ----------------------------------------------------------
  
    const detectQuestionsOnPage = useCallback(async (pageNumber) => {
      const ref = pdfDocRef.current;
      if (!ref) return { pageImage: '', crops: [] };
  
      const { doc, pdfjsLib } = ref;
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
  
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = viewport.width;
      pageCanvas.height = viewport.height;
      const ctx = pageCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
  
      const pageImage = pageCanvas.toDataURL('image/jpeg', 0.82);
  
      const textContent = await page.getTextContent();
      const items = textContent.items;
  
      if (items.length === 0) {
        // Tidak ada lapisan teks sama sekali -- kemungkinan besar hasil
        // scan murni. Kembalikan halaman kosong dengan gambar halaman
        // tetap ada, supaya admin bisa lihat kenapa (bukan error, tapi
        // memang tidak bisa dideteksi otomatis).
        return { pageImage, crops: [] };
      }
  
      const leftMargins = detectLeftMargins(items);
      const starts = detectQuestionStarts(items, leftMargins);
      const imageRegions = await findImageRegions(page, pdfjsLib);
  
      // 🔥 FIX BUG NYATA: sebelumnya SETIAP crop memakai LEBAR HALAMAN
      // PENUH (page.view[0] s/d page.view[2]) apa pun jumlah kolomnya --
      // artinya pada dokumen DUA KOLOM, crop soal di kolom kiri ikut
      // menyeret isi kolom kanan yang sejajar tingginya (atau
      // sebaliknya). Sekarang lebar crop dibatasi PER KOLOM.
      const pageLeft = page.view[0];
      const pageRight = page.view[2];
  
      const columnXRanges =
        leftMargins.length >= 2
          ? [
              { left: pageLeft, right: (leftMargins[0] + leftMargins[1]) / 2 },
              { left: (leftMargins[0] + leftMargins[1]) / 2, right: pageRight },
            ]
          : [{ left: pageLeft, right: pageRight }];
  
      const crops = [];
  
      for (const start of starts) {
        const top = start.y;
        const bottom =
          start.nextYInSameColumn !== null
            ? start.nextYInSameColumn
            : page.view[1]; // dasar halaman kalau ini soal terakhir di kolomnya
  
        const colRange =
          columnXRanges[start.columnIndex] || columnXRanges[0];
  
        const rect = pdfRectToCanvasRect(
          viewport,
          colRange.left,
          top + 14,
          bottom + 4,
          colRange.right - colRange.left,
        );
  
        const mainCrop = cropCanvasToDataUrl(pageCanvas, rect);
        if (!mainCrop) continue;
  
        // 🔥 Filter region gambar JUGA berdasar X (kolom), bukan cuma Y
        // -- sebelumnya sebuah diagram/tabel di kolom LAIN yang
        // kebetulan sejajar tingginya bisa salah terasosiasi ke soal
        // ini.
        const regionsInThisQuestion = imageRegions.filter(
          (r) =>
            r.y <= top + 20 &&
            r.y >= bottom - 20 &&
            r.x >= colRange.left - 20 &&
            r.x <= colRange.right + 20,
        );
        const optionImageCluster = clusterOptionImages(regionsInThisQuestion);
  
        let optionCrops = [];
        if (optionImageCluster) {
          optionCrops = optionImageCluster
            .map((region) => {
              const oRect = pdfRectToCanvasRect(
                viewport,
                region.x,
                region.y + region.height,
                region.y,
                region.width,
              );
              return cropCanvasToDataUrl(pageCanvas, oRect, 4);
            })
            .filter(Boolean);
        }
  
        crops.push({
          printedNumber: start.number,
          qImage: mainCrop,
          optionsAreImages: optionCrops.length >= 2,
          optionImages: optionCrops,
        });
      }
  
      return { pageImage, crops };
    }, []);
  
    // ----------------------------------------------------------
    // PROSES SATU HALAMAN LENGKAP: deteksi (tanpa AI) + jawab tiap
    // soal (dengan AI, satu per satu)
    // ----------------------------------------------------------
  
    const processOnePage = useCallback(
      async (pageNumber) => {
        const { pageImage, crops } = await detectQuestionsOnPage(pageNumber);
  
        const questions = [];
  
        for (const crop of crops) {
          if (abortRef.current) break;
  
          while (pauseRef.current && !abortRef.current) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise((r) => setTimeout(r, 300));
          }
          if (abortRef.current) break;
  
          let transcript = {
            question: '',
            options: [],
            tipeSoal: 'pilihan_ganda',
            kuantitasP: '',
            kuantitasQ: '',
            hasFigure: false,
            figureBBox: null,
            readingConfidence: 'low',
          };
          let transcribeError = null;
  
          try {
            // eslint-disable-next-line no-await-in-loop
            transcript = await transcribeQuestionWithAI(crop.qImage);
          } catch (error) {
            // AI gagal membaca BUKAN alasan membuang soalnya -- crop
            // asli tetap ada untuk ditinjau & diketik manual oleh admin.
            transcribeError = error?.message || 'Gagal membaca soal ini.';
          }
  
          // Kalau tipe soalnya "isian_singkat", opsi jawaban memang
          // tidak ada -- jangan sediakan kolom opsi sama sekali. Kalau
          // opsi jawabannya terdeteksi berupa GAMBAR (dari langkah
          // deteksi tanpa-AI), field "options" teks tidak relevan --
          // yang dipakai adalah optionImages. Selain itu, kalau AI juga
          // tidak berhasil membaca opsi apa pun, sediakan 4 kolom
          // kosong supaya admin bisa mengetik manual.
          const options =
            transcript.tipeSoal === 'isian_singkat'
              ? []
              : crop.optionsAreImages
                ? []
                : transcript.options.length > 0
                  ? transcript.options
                  : ['', '', '', ''];
  
          // Potong HANYA area diagram/grafik/foto dari crop soal (bukan
          // seluruh bloknya) -- kosong kalau soal ini murni teks.
          // eslint-disable-next-line no-await-in-loop
          const figureImage = transcript.hasFigure
            ? (await cropFigureFromQuestionImage(crop.qImage, transcript.figureBBox)) || ''
            : '';
  
          questions.push({
            id: newId(),
            pageNumber,
            printedNumber: crop.printedNumber,
            // Crop UTUH blok soal -- disimpan HANYA untuk pembanding
            // visual di layar tinjau (kolom kiri kartu), TIDAK ikut
            // disimpan ke Bank Soal. Yang disimpan adalah teks di
            // "question"/"options", plus qImage kalau ada figure.
            rawCropImage: crop.qImage,
            question: transcript.question,
            options,
            tipeSoal: transcript.tipeSoal,
            kuantitasP: transcript.kuantitasP,
            kuantitasQ: transcript.kuantitasQ,
            optionsAreImages: crop.optionsAreImages,
            optionImages: crop.optionImages,
            qImage: figureImage,
            readingConfidence: transcript.readingConfidence,
            transcribeError,
            correct: null,
            explanation: '',
            shortAnswerValue: '',
            approved: false,
          });
  
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, DELAY_BETWEEN_QUESTIONS_MS));
        }
  
        return { pageImage, questions };
      },
      [detectQuestionsOnPage],
    );
  
    // ----------------------------------------------------------
    // PROSES BERURUTAN SEMUA HALAMAN DALAM RENTANG
    // ----------------------------------------------------------
  
    const processPages = useCallback(async () => {
      abortRef.current = false;
      pauseRef.current = false;
      setStatus(STATUS.PROCESSING);
      setErrorMessage('');
  
      const from = Math.max(1, Math.min(startPage, totalPages));
      const to = Math.max(from, Math.min(endPage || totalPages, totalPages));
  
      for (let pageNumber = from; pageNumber <= to; pageNumber += 1) {
        if (abortRef.current) break;
  
        setCurrentPage(pageNumber);
  
        try {
          // eslint-disable-next-line no-await-in-loop
          const { pageImage, questions } = await processOnePage(pageNumber);
  
          setPages((prev) => [
            ...prev,
            { pageNumber, pageImage, questions, error: null },
          ]);
        } catch (error) {
          setPages((prev) => [
            ...prev,
            {
              pageNumber,
              pageImage: '',
              questions: [],
              error: error?.message || 'Gagal memproses halaman ini.',
            },
          ]);
        }
      }
  
      setStatus(abortRef.current ? STATUS.IDLE : STATUS.DONE);
    }, [startPage, endPage, totalPages, processOnePage]);
  
    // ----------------------------------------------------------
    // ULANG SATU HALAMAN
    // ----------------------------------------------------------
  
    const retryPage = useCallback(
      async (pageNumber) => {
        setErrorMessage('');
        try {
          const { pageImage, questions } = await processOnePage(pageNumber);
  
          setPages((prev) =>
            prev.map((p) =>
              p.pageNumber === pageNumber
                ? { pageNumber, pageImage, questions, error: null }
                : p,
            ),
          );
        } catch (error) {
          setPages((prev) =>
            prev.map((p) =>
              p.pageNumber === pageNumber
                ? { ...p, error: error?.message || 'Masih gagal.' }
                : p,
            ),
          );
        }
      },
      [processOnePage],
    );
  
    // ----------------------------------------------------------
    // SUNTING SOAL (jawaban, pembahasan, tingkat kesulitan, dsb.)
    // ----------------------------------------------------------
  
    const updateQuestion = useCallback((pageNumber, questionId, patch) => {
      setPages((prev) =>
        prev.map((p) =>
          p.pageNumber !== pageNumber
            ? p
            : {
                ...p,
                questions: p.questions.map((q) =>
                  q.id === questionId ? { ...q, ...patch } : q,
                ),
              },
        ),
      );
    }, []);
  
    const removeQuestion = useCallback((pageNumber, questionId) => {
      setPages((prev) =>
        prev.map((p) =>
          p.pageNumber !== pageNumber
            ? p
            : { ...p, questions: p.questions.filter((q) => q.id !== questionId) },
        ),
      );
    }, []);
  
    // ----------------------------------------------------------
    // RINGKASAN
    // ----------------------------------------------------------
  
    const allQuestions = useMemo(
      () => pages.flatMap((p) => p.questions),
      [pages],
    );
  
    const approvedQuestions = useMemo(
      () => allQuestions.filter((q) => q.approved),
      [allQuestions],
    );
  
    const failedPages = useMemo(() => pages.filter((p) => p.error), [pages]);
  
    const selectedPage = pages[selectedPageIndex] || null;
  
    useEffect(() => {
      if (status === STATUS.PROCESSING && pages.length > 0) {
        setSelectedPageIndex(pages.length - 1);
      }
    }, [pages.length, status]);
  
    // ----------------------------------------------------------
    // SIMPAN
    // ----------------------------------------------------------
  
    const handleSave = useCallback(async () => {
      if (approvedQuestions.length === 0) return;
  
      setSaving(true);
      setErrorMessage('');
  
      try {
        const payload = approvedQuestions.map((q) => ({
          // 🔥 BARU: petakan tipeSoal SNBT ke `type` yang sudah dikenal
          // sistem (ManageQuiz/StudentQuizView) -- pilihan_ganda,
          // pernyataan_kompleks, & hubungan_kuantitas semuanya tetap
          // dijawab lewat pilihan A-E standar, jadi ketiganya dipetakan
          // ke 'multiple'. isian_singkat dipetakan ke 'shortanswer'
          // yang sudah ada skemanya sendiri.
          type: q.tipeSoal === 'isian_singkat' ? 'shortanswer' : 'multiple',
          // tipeSoal ASLI tetap disimpan sebagai metadata terpisah --
          // dipakai nanti buat menampilkan badge yang sama di
          // ManageQuiz, dan buat kuantitasP/kuantitasQ tahu kapan harus
          // dirender.
          tipeSoal: q.tipeSoal,
          // 🔥 Sekarang teks SUNGGUHAN (hasil transkripsi AI, sudah
          // ditinjau/diedit admin) -- bukan lagi placeholder "Soal 20".
          question:
            q.question?.trim() ||
            (q.printedNumber ? `Soal ${q.printedNumber}` : 'Soal (lihat gambar)'),
          // qImage sekarang HANYA diagram/grafik/foto di dalam soal
          // (kalau ada) -- kosong untuk soal murni teks.
          qImage: q.qImage || '',
          options: q.optionsAreImages ? [] : q.options.filter((o) => o.trim().length > 0),
          optionImages: q.optionsAreImages ? q.optionImages : [],
          optionsAreImages: Boolean(q.optionsAreImages),
          // Kuantitas P & Q -- cuma terisi untuk tipe hubungan_kuantitas,
          // string kosong untuk tipe lain (tidak relevan).
          kuantitasP: q.tipeSoal === 'hubungan_kuantitas' ? q.kuantitasP || '' : '',
          kuantitasQ: q.tipeSoal === 'hubungan_kuantitas' ? q.kuantitasQ || '' : '',
          // shortAnswer -- cuma terisi untuk tipe isian_singkat.
          shortAnswer:
            q.tipeSoal === 'isian_singkat' ? q.shortAnswerValue || '' : '',
          // 🔥 null (bukan 0) kalau belum ditandai -- 0 berarti "opsi A
          // benar", jadi TIDAK BOLEH dipakai sebagai nilai default
          // "belum dijawab". needsAnswerGeneration menandai soal yang
          // jawaban+pembahasannya masih harus dibuat nanti (baik oleh
          // AI saat dipakai di kuis, maupun oleh guru secara manual).
          correct: Number.isInteger(q.correct) ? q.correct : null,
          explanation: q.explanation || '',
          needsAnswerGeneration:
            q.tipeSoal === 'isian_singkat'
              ? !(q.shortAnswerValue || '').trim()
              : !Number.isInteger(q.correct),
          difficulty: q.difficulty || '',
          topik: q.topik || '',
          folderId,
          folderName,
          sourceName: file?.name || '',
          sourcePage: q.pageNumber,
          sourcePrintedNumber: q.printedNumber || null,
          createdAt: new Date().toISOString(),
        }));
  
        await onSaveQuestions?.(payload);
  
        setSavedCount(payload.length);
  
        setPages((prev) =>
          prev.map((p) => ({
            ...p,
            questions: p.questions.filter((q) => !q.approved),
          })),
        );
      } catch (error) {
        setErrorMessage(
          `Gagal menyimpan: ${error?.message || 'coba lagi sebentar.'}`,
        );
      } finally {
        setSaving(false);
      }
    }, [approvedQuestions, folderId, folderName, file, onSaveQuestions]);
  
    const isBusy = status === STATUS.PROCESSING || status === STATUS.LOADING_PDF;
  
    // ----------------------------------------------------------
    // TAMPILAN
    // ----------------------------------------------------------
  
    return (
      <div className="bsi">
        <style>{styles}</style>
  
        <header className="bsi-head">
          <div>
            <p className="bsi-eyebrow">{folderName}</p>
            <h1 className="bsi-title">Tambah soal dari PDF</h1>
            <p className="bsi-sub">
              Batas soal dideteksi dari halaman asli (tanpa AI), lalu
              teks soal & opsinya ditranskripsi AI supaya bisa diedit.
              Jawaban & pembahasan dibuat belakangan, saat soal ini
              dipakai di sebuah kuis -- periksa dulu hasil transkripsinya
              di sini sebelum disetujui.
            </p>
          </div>
  
          {onCancel && (
            <button type="button" className="bsi-btn ghost" onClick={onCancel}>
              Tutup
            </button>
          )}
        </header>
  
        {/* ---------------- UNGGAH ---------------- */}
        {!file && (
          <label className="bsi-drop">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              hidden
            />
            <span className="bsi-drop-title">Pilih berkas PDF</span>
            <span className="bsi-drop-hint">
              Gunakan PDF yang punya lapisan teks asli (bukan hasil scan
              murni) -- deteksi nomor soal bergantung pada posisi teks
              sungguhan di dalam file, bukan tebakan visual.
            </span>
          </label>
        )}
  
        {/* ---------------- KENDALI ---------------- */}
        {file && (
          <section className="bsi-panel">
            <div className="bsi-fileinfo">
              <span className="bsi-filename">{file.name}</span>
              <span className="bsi-meta">
                {formatBytes(file.size)}
                {totalPages > 0 && ` · ${totalPages} halaman`}
              </span>
            </div>
  
            {totalPages > 0 && status !== STATUS.PROCESSING && (
              <div className="bsi-range">
                <label>
                  Dari halaman
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={startPage}
                    onChange={(e) => setStartPage(Number(e.target.value))}
                  />
                </label>
                <label>
                  sampai
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={endPage}
                    onChange={(e) => setEndPage(Number(e.target.value))}
                  />
                </label>
  
                <button
                  type="button"
                  className="bsi-btn primary"
                  onClick={processPages}
                  disabled={isBusy}
                >
                  {pages.length > 0 ? 'Baca lagi' : 'Mulai baca'}
                </button>
              </div>
            )}
  
            {totalPages > 60 && status !== STATUS.PROCESSING && (
              <p className="bsi-note">
                Berkas ini panjang. Sebaiknya kerjakan per 20–30 halaman
                dulu.
              </p>
            )}
  
            {status === STATUS.PROCESSING && (
              <div className="bsi-progress">
                <div className="bsi-bar">
                  <div
                    className="bsi-bar-fill"
                    style={{
                      width: `${
                        ((currentPage - startPage + 1) /
                          Math.max(1, endPage - startPage + 1)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="bsi-progress-row">
                  <span>
                    Memproses halaman {currentPage} dari {endPage}
                  </span>
                  <div className="bsi-progress-actions">
                    <button
                      type="button"
                      className="bsi-btn ghost sm"
                      onClick={() => {
                        pauseRef.current = !pauseRef.current;
                        setStatus(
                          pauseRef.current ? STATUS.PAUSED : STATUS.PROCESSING,
                        );
                      }}
                    >
                      {pauseRef.current ? 'Lanjutkan' : 'Jeda'}
                    </button>
                    <button
                      type="button"
                      className="bsi-btn ghost sm"
                      onClick={() => {
                        abortRef.current = true;
                      }}
                    >
                      Hentikan
                    </button>
                  </div>
                </div>
              </div>
            )}
  
            {status === STATUS.PAUSED && (
              <p className="bsi-note">
                Dijeda di halaman {currentPage}. Hasil yang sudah
                diproses tetap tersimpan di layar ini.
              </p>
            )}
          </section>
        )}
  
        {errorMessage && <div className="bsi-alert">{errorMessage}</div>}
  
        {savedCount > 0 && (
          <div className="bsi-alert ok">
            {savedCount} soal tersimpan ke {folderName}.
          </div>
        )}
  
        {failedPages.length > 0 && (
          <div className="bsi-alert warn">
            {failedPages.length} halaman gagal diproses:{' '}
            {failedPages.map((p) => p.pageNumber).join(', ')}. Buka
            halamannya lalu tekan Ulangi.
          </div>
        )}
  
        {/* ---------------- TINJAU ---------------- */}
        {pages.length > 0 && (
          <section className="bsi-review">
            <nav className="bsi-pagelist" aria-label="Daftar halaman">
              {pages.map((p, i) => (
                <button
                  type="button"
                  key={p.pageNumber}
                  className={`bsi-pagechip${
                    i === selectedPageIndex ? ' active' : ''
                  }${p.error ? ' failed' : ''}`}
                  onClick={() => setSelectedPageIndex(i)}
                >
                  <span className="bsi-pagenum">Hal {p.pageNumber}</span>
                  <span className="bsi-pagecount">
                    {p.error ? 'gagal' : `${p.questions.length} soal`}
                  </span>
                </button>
              ))}
            </nav>
  
            {selectedPage && (
              <div className="bsi-compare">
                <div className="bsi-original">
                  <div className="bsi-panel-label">
                    Halaman asli {selectedPage.pageNumber}
                  </div>
                  {selectedPage.pageImage ? (
                    <img
                      src={selectedPage.pageImage}
                      alt={`Halaman ${selectedPage.pageNumber}`}
                    />
                  ) : (
                    <div className="bsi-empty">
                      Halaman ini gagal dirender.
                      <button
                        type="button"
                        className="bsi-btn ghost sm"
                        onClick={() => retryPage(selectedPage.pageNumber)}
                      >
                        Ulangi
                      </button>
                    </div>
                  )}
                </div>
  
                <div className="bsi-parsed">
                  <div className="bsi-panel-label">
                    Soal terdeteksi — periksa hasil transkripsi sebelum disetujui
                  </div>
  
                  {selectedPage.error && (
                    <div className="bsi-empty">
                      {selectedPage.error}
                      <button
                        type="button"
                        className="bsi-btn ghost sm"
                        onClick={() => retryPage(selectedPage.pageNumber)}
                      >
                        Ulangi halaman ini
                      </button>
                    </div>
                  )}
  
                  {!selectedPage.error && selectedPage.questions.length === 0 && (
                    <div className="bsi-empty">
                      Tidak ada soal terdeteksi di halaman ini. Biasanya
                      karena: (a) halaman ini memang sampul/daftar
                      isi/kunci jawaban, atau (b) PDF ini hasil scan
                      murni tanpa lapisan teks asli, sehingga nomor soal
                      tidak bisa dideteksi otomatis.
                    </div>
                  )}
  
                  {selectedPage.questions.map((q, qi) => (
                    <article
                      key={q.id}
                      className={`bsi-card${q.approved ? ' approved' : ''}`}
                    >
                      <div className="bsi-card-head">
                        <span className="bsi-card-no">
                          Soal {qi + 1}
                          {q.printedNumber ? ` (tercetak no. ${q.printedNumber})` : ''}
                        </span>
                        {/* 🔥 BARU: badge tipe soal SNBT/UTBK */}
                        <span
                          className="bsi-tipe-badge"
                          style={{
                            color: TIPE_SOAL_META[q.tipeSoal]?.color,
                            background: TIPE_SOAL_META[q.tipeSoal]?.bg,
                          }}
                        >
                          {TIPE_SOAL_META[q.tipeSoal]?.label || 'Pilihan Ganda'}
                        </span>
                        <div className="bsi-card-actions">
                          <select
                            className="bsi-select"
                            value={q.difficulty || ''}
                            onChange={(e) =>
                              updateQuestion(selectedPage.pageNumber, q.id, {
                                difficulty: e.target.value,
                              })
                            }
                          >
                            <option value="">Tingkat kesulitan…</option>
                            <option value="Mudah">Mudah</option>
                            <option value="Sedang">Sedang</option>
                            <option value="Sulit">Sulit</option>
                          </select>
                          <label className="bsi-check">
                            <input
                              type="checkbox"
                              checked={q.approved}
                              onChange={(e) =>
                                updateQuestion(selectedPage.pageNumber, q.id, {
                                  approved: e.target.checked,
                                })
                              }
                            />
                            Setujui
                          </label>
                          <button
                            type="button"
                            className="bsi-btn ghost sm"
                            onClick={() =>
                              removeQuestion(selectedPage.pageNumber, q.id)
                            }
                          >
                            Buang
                          </button>
                        </div>
                      </div>
  
                      {/* Perbandingan visual: crop asli di kiri (kecil,
                          untuk memastikan AI membaca dengan benar),
                          teks hasil transkripsi yang BISA DIEDIT di
                          kanan. */}
                      <div className="bsi-transcript-row">
                        <img
                          src={q.rawCropImage}
                          alt="Crop asli"
                          className="bsi-rawcrop"
                        />
  
                        <div className="bsi-transcript-fields">
                          <textarea
                            className="bsi-input bsi-question-input"
                            rows={3}
                            placeholder="Teks soal..."
                            value={q.question || ''}
                            onChange={(e) =>
                              updateQuestion(selectedPage.pageNumber, q.id, {
                                question: e.target.value,
                              })
                            }
                          />
  
                          {/* 🔥 BARU: pratinjau rumus BENERAN dirender
                              (bukan kode LaTeX mentah) -- ini yang
                              membuktikan ke admin bahwa AI sudah
                              menuliskan ulang soalnya dengan benar,
                              bukan cuma menyalin gambar mentah. */}
                          {q.question && (
                            <div className="bsi-latex-preview">
                              <span className="bsi-latex-preview-label">
                                Pratinjau (begini nanti tampilnya ke siswa):
                              </span>
                              <div className="bsi-latex-preview-body">
                                {renderWithLatexPreview(q.question)}
                              </div>
                            </div>
                          )}
  
                          {q.qImage && (
                            <div className="bsi-figure-wrap">
                              <span className="bsi-figure-label">
                                Diagram/gambar terdeteksi dalam soal ini:
                              </span>
                              <img
                                src={q.qImage}
                                alt="Diagram soal"
                                className="bsi-figure-img"
                              />
                            </div>
                          )}
  
                          {/* 🔥 BARU: tampilan khusus tipe "hubungan
                              kuantitas" -- Kuantitas P & Q ditampilkan
                              terpisah, bisa diedit, supaya guru gampang
                              memverifikasi keduanya sebelum menyetujui. */}
                          {q.tipeSoal === 'hubungan_kuantitas' && (
                            <div className="bsi-pq-row">
                              <div className="bsi-pq-box">
                                <span className="bsi-pq-label">Kuantitas P</span>
                                <input
                                  className="bsi-input"
                                  value={q.kuantitasP || ''}
                                  onChange={(e) =>
                                    updateQuestion(selectedPage.pageNumber, q.id, {
                                      kuantitasP: e.target.value,
                                    })
                                  }
                                />
                                {q.kuantitasP && (
                                  <div className="bsi-pq-preview">
                                    {renderWithLatexPreview(q.kuantitasP)}
                                  </div>
                                )}
                              </div>
                              <div className="bsi-pq-box">
                                <span className="bsi-pq-label">Kuantitas Q</span>
                                <input
                                  className="bsi-input"
                                  value={q.kuantitasQ || ''}
                                  onChange={(e) =>
                                    updateQuestion(selectedPage.pageNumber, q.id, {
                                      kuantitasQ: e.target.value,
                                    })
                                  }
                                />
                                {q.kuantitasQ && (
                                  <div className="bsi-pq-preview">
                                    {renderWithLatexPreview(q.kuantitasQ)}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
  
                      {q.transcribeError && (
                        <p className="bsi-flag">
                          AI gagal membaca soal ini secara otomatis --
                          ketik teksnya secara manual dari crop di
                          sebelah kiri. ({q.transcribeError})
                        </p>
                      )}
  
                      {!q.transcribeError && q.readingConfidence === 'low' && (
                        <p className="bsi-flag">
                          AI kurang yakin membaca sebagian teks ini --
                          cocokkan dengan crop asli di sebelah kiri.
                        </p>
                      )}
  
                      {/* Opsi jawaban -- TEKS yang bisa diedit (kalau
                          bukan opsi bergambar), atau crop gambar tiap
                          opsi (kalau terdeteksi opsi bergambar dari
                          langkah deteksi tanpa-AI). Jawaban benar
                          OPSIONAL ditandai sekarang -- lihat catatan
                          di bawah.
  
                          🔥 BARU: tipe "isian_singkat" TIDAK PUNYA opsi
                          sama sekali -- daftar opsi & pemilih huruf
                          disembunyikan total, diganti kolom jawaban
                          singkat (opsional, bisa dikosongkan). */}
                      {q.tipeSoal === 'isian_singkat' ? (
                        <div className="bsi-shortanswer-wrap">
                          <span className="bsi-figure-label">
                            Jawaban singkat (opsional, boleh dikosongkan):
                          </span>
                          <input
                            className="bsi-input"
                            placeholder="Nilai/jawaban yang diminta..."
                            value={q.shortAnswerValue || ''}
                            onChange={(e) =>
                              updateQuestion(selectedPage.pageNumber, q.id, {
                                shortAnswerValue: e.target.value,
                              })
                            }
                          />
                        </div>
                      ) : q.optionsAreImages ? (
                        <div className="bsi-optimg-row">
                          {q.optionImages.map((url, oi) => (
                            <button
                              key={oi}
                              type="button"
                              className={`bsi-optimg-btn${
                                q.correct === oi ? ' selected' : ''
                              }`}
                              onClick={() =>
                                updateQuestion(selectedPage.pageNumber, q.id, {
                                  correct: oi,
                                })
                              }
                            >
                              <img src={url} alt={`Opsi ${String.fromCharCode(65 + oi)}`} />
                              <span>{String.fromCharCode(65 + oi)}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <ul className="bsi-option-list">
                          {q.options.map((opt, oi) => (
                            <li key={oi}>
                              <button
                                type="button"
                                className={`bsi-letter-btn${
                                  q.correct === oi ? ' selected' : ''
                                }`}
                                onClick={() =>
                                  updateQuestion(selectedPage.pageNumber, q.id, {
                                    correct: oi,
                                  })
                                }
                                title="Tandai sebagai jawaban benar (opsional)"
                              >
                                {String.fromCharCode(65 + oi)}
                              </button>
                              <input
                                className="bsi-input"
                                value={opt}
                                onChange={(e) => {
                                  const options = [...q.options];
                                  options[oi] = e.target.value;
                                  updateQuestion(selectedPage.pageNumber, q.id, {
                                    options,
                                  });
                                }}
                              />
                              {/* Pratinjau rumus untuk opsi ini, kalau
                                  opsinya mengandung LaTeX (mis. hasil
                                  integral/pecahan) -- opsi angka biasa
                                  seperti "0,861 MeV" tidak akan
                                  menampilkan apa-apa tambahan di sini
                                  karena tidak ada \(...\) di dalamnya. */}
                              {/\\\(.*\\\)/.test(opt) && (
                                <span className="bsi-option-preview">
                                  {renderWithLatexPreview(opt)}
                                </span>
                              )}
                            </li>
                          ))}
                          <li>
                            <button
                              type="button"
                              className="bsi-btn ghost sm"
                              onClick={() =>
                                updateQuestion(selectedPage.pageNumber, q.id, {
                                  options: [...q.options, ''],
                                })
                              }
                            >
                              + opsi
                            </button>
                          </li>
                        </ul>
                      )}
  
                      <p className="bsi-flag muted">
                        Jawaban benar & pembahasan opsional diisi
                        sekarang -- kalau dikosongkan, akan dibuatkan
                        otomatis nanti saat soal ini dipakai di sebuah
                        kuis.
                      </p>
  
                      <details className="bsi-details">
                        <summary>Pembahasan (opsional)</summary>
                        <textarea
                          className="bsi-input"
                          rows={3}
                          placeholder="Belum ada pembahasan. Boleh ditulis sendiri."
                          value={q.explanation || ''}
                          onChange={(e) =>
                            updateQuestion(selectedPage.pageNumber, q.id, {
                              explanation: e.target.value,
                            })
                          }
                        />
                      </details>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
  
        {/* ---------------- SIMPAN ---------------- */}
        {allQuestions.length > 0 && (
          <footer className="bsi-foot">
            <span className="bsi-footinfo">
              {approvedQuestions.length} dari {allQuestions.length} soal
              disetujui
            </span>
            <button
              type="button"
              className="bsi-btn primary"
              onClick={handleSave}
              disabled={approvedQuestions.length === 0 || saving}
            >
              {saving
                ? 'Menyimpan…'
                : `Simpan ${approvedQuestions.length} soal ke ${folderName}`}
            </button>
          </footer>
        )}
      </div>
    );
  }
  
  // ============================================================
  // GAYA
  // ============================================================
  
  const styles = `
  .bsi { --ink:#16202b; --muted:#64748b; --line:#e2e8f0; --bg:#f8fafc;
    --brand:#1d4ed8; --ok:#047857; --warn:#b45309; --danger:#b91c1c;
    color:var(--ink); max-width:1400px; margin:0 auto; padding:24px 20px 96px;
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
  .bsi *{box-sizing:border-box}
  .bsi-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:24px}
  .bsi-eyebrow{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 6px}
  .bsi-title{font-size:24px;font-weight:650;margin:0 0 6px;letter-spacing:-.01em}
  .bsi-sub{margin:0;color:var(--muted);font-size:14px;max-width:64ch;line-height:1.5}
  .bsi-drop{display:flex;flex-direction:column;align-items:center;gap:8px;padding:48px 24px;
    border:2px dashed var(--line);border-radius:12px;background:var(--bg);cursor:pointer;text-align:center}
  .bsi-drop:hover{border-color:var(--brand);background:#f1f5ff}
  .bsi-drop-title{font-weight:600;font-size:16px}
  .bsi-drop-hint{color:var(--muted);font-size:13px;max-width:52ch;line-height:1.5}
  .bsi-panel{border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:16px;background:#fff}
  .bsi-fileinfo{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}
  .bsi-filename{font-weight:600;font-size:15px;word-break:break-all}
  .bsi-meta{color:var(--muted);font-size:13px;white-space:nowrap}
  .bsi-range{display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-top:14px}
  .bsi-range label{display:flex;flex-direction:column;gap:4px;font-size:13px;color:var(--muted)}
  .bsi-range input{width:90px;padding:7px 9px;border:1px solid var(--line);border-radius:7px;font-size:14px;color:var(--ink)}
  .bsi-note{margin:12px 0 0;font-size:13px;color:var(--warn);line-height:1.5}
  .bsi-progress{margin-top:14px}
  .bsi-bar{height:6px;background:var(--line);border-radius:99px;overflow:hidden}
  .bsi-bar-fill{height:100%;background:var(--brand);transition:width .3s ease}
  .bsi-progress-row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:8px;font-size:13px;color:var(--muted);flex-wrap:wrap}
  .bsi-progress-actions{display:flex;gap:8px}
  .bsi-btn{border:1px solid var(--line);background:#fff;color:var(--ink);padding:9px 15px;
    border-radius:8px;font-size:14px;font-weight:550;cursor:pointer;font-family:inherit}
  .bsi-btn:hover:not(:disabled){border-color:var(--ink)}
  .bsi-btn:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
  .bsi-btn:disabled{opacity:.45;cursor:not-allowed}
  .bsi-btn.primary{background:var(--brand);border-color:var(--brand);color:#fff}
  .bsi-btn.primary:hover:not(:disabled){background:#1a43b8}
  .bsi-btn.sm{padding:5px 10px;font-size:12.5px}
  .bsi-alert{padding:11px 14px;border-radius:9px;font-size:13.5px;margin-bottom:14px;line-height:1.5;
    background:#fef2f2;color:var(--danger);border:1px solid #fecaca}
  .bsi-alert.ok{background:#ecfdf5;color:var(--ok);border-color:#a7f3d0}
  .bsi-alert.warn{background:#fffbeb;color:var(--warn);border-color:#fde68a}
  .bsi-pagelist{display:flex;gap:8px;overflow-x:auto;padding:4px 0 12px}
  .bsi-pagechip{flex:0 0 auto;display:flex;flex-direction:column;gap:2px;padding:8px 13px;
    border:1px solid var(--line);border-radius:9px;background:#fff;cursor:pointer;font-family:inherit;text-align:left}
  .bsi-pagechip.active{border-color:var(--brand);background:#eff4ff}
  .bsi-pagechip.failed{border-color:#fecaca;background:#fef2f2}
  .bsi-pagenum{font-size:13px;font-weight:600}
  .bsi-pagecount{font-size:11.5px;color:var(--muted)}
  .bsi-compare{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px;align-items:start}
  .bsi-panel-label{font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);
    margin-bottom:8px;font-weight:600}
  .bsi-original{position:sticky;top:16px}
  .bsi-original img{width:100%;border:1px solid var(--line);border-radius:10px;background:#fff}
  .bsi-parsed{display:flex;flex-direction:column;gap:14px}
  .bsi-empty{padding:24px;border:1px dashed var(--line);border-radius:10px;color:var(--muted);
    font-size:13.5px;text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center;line-height:1.5}
  .bsi-card{border:1px solid var(--line);border-radius:11px;padding:14px;background:#fff;
    display:flex;flex-direction:column;gap:10px}
  .bsi-card.approved{border-color:#a7f3d0;background:#f7fffc}
  .bsi-card-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
  .bsi-tipe-badge{font-size:11.5px;font-weight:650;padding:4px 10px;border-radius:99px;white-space:nowrap}
  .bsi-pq-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .bsi-pq-box{display:flex;flex-direction:column;gap:5px;padding:9px;border:1px solid #a7f3d0;
    background:#ecfdf5;border-radius:8px}
  .bsi-pq-label{font-size:11px;font-weight:700;color:#047857}
  .bsi-pq-preview{font-size:14px;color:var(--ink)}
  .bsi-shortanswer-wrap{display:flex;flex-direction:column;gap:5px;padding:9px;border:1px solid #fde68a;
    background:#fffbeb;border-radius:8px}
  .bsi-card-no{font-size:12.5px;font-weight:650;color:var(--muted);letter-spacing:.03em}
  .bsi-card-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .bsi-check{display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;font-weight:550}
  .bsi-select{padding:6px 8px;border:1px solid var(--line);border-radius:7px;font-size:13px;
    font-family:inherit;color:var(--ink);background:#fff}
  .bsi-transcript-row{display:flex;gap:12px;align-items:flex-start}
  .bsi-rawcrop{width:150px;flex:0 0 150px;border:1px solid var(--line);border-radius:8px;background:#fff}
  .bsi-transcript-fields{flex:1;display:flex;flex-direction:column;gap:8px;min-width:0}
  .bsi-question-input{font-size:14.5px}
  .bsi-figure-wrap{display:flex;flex-direction:column;gap:4px}
  .bsi-figure-label{font-size:11.5px;color:var(--muted);font-weight:600}
  .bsi-figure-img{max-width:220px;border:1px solid var(--line);border-radius:7px;background:#fff}
  .bsi-option-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px}
  .bsi-option-list li{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
  .bsi-latex-preview{border:1px solid #dbeafe;background:#f0f7ff;border-radius:8px;padding:9px 11px;
    display:flex;flex-direction:column;gap:5px}
  .bsi-latex-preview-label{font-size:11px;font-weight:650;color:#1d4ed8;letter-spacing:.02em}
  .bsi-latex-preview-body{font-size:14.5px;line-height:1.6;color:var(--ink)}
  .bsi-option-preview{font-size:13.5px;color:var(--ink);padding:3px 8px;background:#f0f7ff;
    border-radius:6px;border:1px solid #dbeafe}
  .bsi-flag.muted{color:var(--muted)}
  .bsi-input{width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:7px;
    font-size:14px;font-family:inherit;color:var(--ink);line-height:1.5;resize:vertical;background:#fff}
  .bsi-input:focus{outline:2px solid var(--brand);outline-offset:-1px;border-color:var(--brand)}
  .bsi-letter-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .bsi-letter-btn{width:34px;height:34px;border-radius:7px;border:1px solid var(--line);background:#fff;
    font-weight:700;font-size:13px;color:var(--muted);cursor:pointer;font-family:inherit}
  .bsi-letter-btn.selected{border-color:var(--ok);background:#ecfdf5;color:var(--ok)}
  .bsi-optimg-row{display:flex;gap:8px;flex-wrap:wrap}
  .bsi-optimg-btn{display:flex;flex-direction:column;align-items:center;gap:4px;padding:6px;
    border:2px solid var(--line);border-radius:9px;background:#fff;cursor:pointer;font-family:inherit}
  .bsi-optimg-btn.selected{border-color:var(--ok);background:#ecfdf5}
  .bsi-optimg-btn img{height:64px;width:auto;border-radius:5px}
  .bsi-optimg-btn span{font-size:12px;font-weight:700;color:var(--muted)}
  .bsi-details summary{font-size:13px;color:var(--muted);cursor:pointer;padding:2px 0}
  .bsi-details[open] summary{margin-bottom:7px}
  .bsi-flag{margin:0;font-size:12.5px;color:var(--warn);line-height:1.5}
  .bsi-foot{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid var(--line);
    padding:12px 20px;display:flex;justify-content:flex-end;align-items:center;gap:16px;z-index:20}
  .bsi-footinfo{font-size:13.5px;color:var(--muted)}
  @media (max-width:900px){
    .bsi-compare{grid-template-columns:1fr}
    .bsi-original{position:static}
    .bsi-original img{max-height:60vh;object-fit:contain}
  }
  @media (prefers-reduced-motion:reduce){
    .bsi-bar-fill{transition:none}
  }
  `;