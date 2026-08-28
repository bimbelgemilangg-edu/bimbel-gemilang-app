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
  
  // 🔥 BARU: mammoth.js -- pembaca .docx standar, dimuat dari CDN
  // dengan pola SAMA PERSIS seperti pdf.js di atas (bukan npm import,
  // supaya tidak mengulang masalah build "Rollup failed to resolve
  // import" yang pernah terjadi pada pdfjs-dist).
  //
  // KENAPA WORD SEKARANG JADI JALUR IMPOR TERPISAH: soal dengan notasi
  // matematika yang ditumpuk visual (vektor kolom, matriks) terbukti
  // sulit diurai otomatis dari tata letak PDF cetak -- bukan salah PDF
  // atau Word sebagai FORMAT, tapi soal seberapa "linear" isi soal itu
  // ditulis. Dokumen Word yang diketik ulang (atau dirapikan manual
  // dari hasil convert PDF->Word bawaan Word) memberi admin kesempatan
  // menuliskan notasi itu jadi satu baris teks biasa (mis. "a=(p,2,-1)")
  // SEBELUM diimpor -- menghilangkan ambiguitas tata letak 2D sama
  // sekali, bukan cuma memindahkan masalahnya ke format lain.
  const MAMMOTH_SCRIPT =
    'https://unpkg.com/mammoth@1.8.0/mammoth.browser.min.js';
  
  function ensureMammothLoaded() {
    return new Promise((resolve, reject) => {
      if (window.mammoth) {
        resolve(window.mammoth);
        return;
      }
  
      const script = document.createElement('script');
      script.src = MAMMOTH_SCRIPT;
  
      script.onload = () => resolve(window.mammoth);
  
      script.onerror = () =>
        reject(new Error('Gagal memuat pembaca Word.'));
  
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
  
  // ============================================================
  // 🔥 BARU (revisi ke-4): EKSTRAKSI TEKS LANGSUNG DARI PDF -- TANPA AI
  // ============================================================
  // ⚠️ KENAPA INI PERUBAHAN PALING PENTING DI SELURUH FITUR BANK SOAL:
  // Tiga revisi sebelumnya semuanya minta AI "MELIHAT GAMBAR crop soal
  // dan MENULISKAN ULANG isinya" -- itu pada dasarnya OCR/vision, dan
  // terbukti tidak cukup andal (contoh nyata: soal berisi grafik P-V
  // panjang keluar jadi "19. Suatu gas ... (Gambar grafik P terhadap
  // ...)" -- AI menyerah menyalin lengkap, cuma menebak ringkasan).
  //
  // Padahal PDF (kalau punya lapisan teks asli -- yang SUDAH kita
  // manfaatkan sejak revisi pertama untuk mendeteksi nomor soal) berisi
  // TEKS SUNGGUHAN yang bisa diambil PERSIS, TANPA PERLU DIBACA ULANG
  // SAMA SEKALI -- sama seperti keunggulan yang diminta dari Word.
  // Bedanya: ini bisa dilakukan LANGSUNG dari PDF yang sudah ada,
  // TANPA perlu mengonversi ke Word dulu (yang justru berisiko
  // merusak tata letak 2 kolom + rumus matematika -- konversi PDF ke
  // Word BUKAN proses lossless, sama seperti OCR).
  //
  // Jadi sekarang: teks soal & opsi diambil LANGSUNG dari objek teks
  // PDF (persis mekanisme yang sama dipakai mendeteksi nomor soal),
  // tipe soal diklasifikasi lewat pola teks (bukan AI), dan area
  // diagram/grafik dideteksi lewat CELAH KOSONG antar baris teks
  // (bukan AI menebak kotak pembatas). AI TIDAK DIPANGGIL SAMA SEKALI
  // di jalur utama sekarang.
  
  // Ambang jarak antar baris yang dianggap "celah wajar" (bukan area
  // diagram) -- baris teks normal biasanya berjarak sekitar 12-16pt;
  // celah di atas ini kemungkinan besar area gambar/grafik/tabel.
  const NORMAL_LINE_GAP_MAX = 22;
  const MIN_FIGURE_GAP = 40;
  
  // Kumpulkan semua item teks dalam rentang Y & X tertentu (satu soal,
  // satu kolom), lalu kelompokkan jadi baris (atas ke bawah, kiri ke
  // kanan per baris) -- fondasi yang sama dipakai deteksi nomor soal.
  function extractLinesInRange(items, top, bottom, colLeft, colRight) {
    const relevant = items.filter((it) => {
      const x = it.transform[4];
      const y = it.transform[5];
      return (
        y <= top + 14 &&
        y >= bottom + 4 &&
        x >= colLeft - 5 &&
        x <= colRight + 5
      );
    });
  
    const lineMap = new Map();
    relevant.forEach((item) => {
      const yKey = Math.round(item.transform[5] / 2) * 2;
      if (!lineMap.has(yKey)) lineMap.set(yKey, []);
      lineMap.get(yKey).push(item);
    });
  
    return [...lineMap.entries()]
      .sort((a, b) => b[0] - a[0]) // atas ke bawah
      .map(([y, lineItems]) => ({
        y,
        text: lineItems
          .sort((a, b) => a.transform[4] - b.transform[4]) // kiri ke kanan
          .map((i) => i.str)
          .join(' ')
          .trim(),
      }))
      .filter((l) => l.text.length > 0);
  }
  
  // Cari celah vertikal TERBESAR antar baris yang berurutan -- kalau
  // jauh lebih lebar dari jarak baris normal, itu kemungkinan besar
  // area diagram/grafik/tabel-bergambar yang tidak punya teks sama
  // sekali (makanya jadi "celah kosong" bagi lapisan teks PDF).
  function findFigureGap(lines) {
    let maxGap = 0;
    let gapTop = null;
    let gapBottom = null;
  
    for (let i = 0; i < lines.length - 1; i++) {
      const gap = lines[i].y - lines[i + 1].y;
      if (gap > maxGap) {
        maxGap = gap;
        gapTop = lines[i].y;
        gapBottom = lines[i + 1].y;
      }
    }
  
    if (maxGap < MIN_FIGURE_GAP) return null;
  
    return { top: gapTop, bottom: gapBottom, gap: maxGap };
  }
  
  // Pisahkan badan soal dari daftar opsi jawaban -- opsi ditandai
  // penanda huruf (A. / A) dst) di awal kata. Menangani tata letak
  // opsi 2-KOLOM (mis. "A. ... D. ..." satu baris, "B. ... E. ..." baris
  // berikutnya, "C. ..." sendirian) yang lazim dipakai buku SNBT/UTBK
  // untuk menghemat ruang -- opsi diurutkan ULANG berdasar HURUFNYA,
  // bukan urutan kemunculan mentah di teks (yang bisa A,D,B,E,C kalau
  // dibaca apa adanya per baris).
  function splitOptionsFromText(fullText) {
    const matches = [...fullText.matchAll(/(?:^|\s)([A-E])[.)]\s+/g)];
  
    if (matches.length < 2) {
      return { question: fullText.trim(), options: [] };
    }
  
    const question = fullText.slice(0, matches[0].index).trim();
  
    const rawOptions = [];
    for (let i = 0; i < matches.length; i++) {
      const letter = matches[i][1];
      const start = matches[i].index + matches[i][0].length;
      const end = i + 1 < matches.length ? matches[i + 1].index : fullText.length;
      rawOptions.push({ letter, text: fullText.slice(start, end).trim() });
    }
  
    rawOptions.sort((a, b) => a.letter.localeCompare(b.letter));
  
    return { question, options: rawOptions.map((o) => o.text) };
  }
  
  // Klasifikasi tipe soal SNBT/UTBK lewat POLA TEKS -- tanpa AI. Ini
  // pengganti langkah yang sebelumnya minta AI mengklasifikasikan;
  // polanya cukup khas untuk dideteksi regex sederhana.
  //
  // `hasImageOptions` WAJIB dikirim: soal dengan opsi berupa GAMBAR
  // tidak punya penanda huruf tekstual (A. B. C.) sama sekali di
  // lapisan teks PDF -- tanpa parameter ini, soal seperti itu salah
  // terklasifikasi sebagai "isian_singkat" padahal sebenarnya pilihan
  // ganda biasa (cuma opsinya berupa gambar).
  function classifyTipeSoal(fullText, hasImageOptions) {
    const hasNumberedStatements =
      /\(1\)[\s\S]*\(2\)[\s\S]*\(3\)/.test(fullText);
  
    if (hasNumberedStatements) return 'pernyataan_kompleks';
  
    const hasQuantityPQ =
      /kuantitas\s*p/i.test(fullText) && /kuantitas\s*q/i.test(fullText);
  
    if (hasQuantityPQ) return 'hubungan_kuantitas';
  
    if (hasImageOptions) return 'pilihan_ganda';
  
    const optionLetterCount = (
      fullText.match(/(?:^|\s)[A-E][.)]\s+/g) || []
    ).length;
  
    if (optionLetterCount < 2) return 'isian_singkat';
  
    return 'pilihan_ganda';
  }
  
  // ============================================================
  // 🔥 BARU: PROSES FILE .DOCX -- JALUR IMPOR KEDUA
  // ============================================================
  // Dipakai untuk soal yang notasi matematikanya rumit di tata letak
  // PDF (vektor kolom, matriks) -- admin mengonversi/mengetik ulang
  // soal itu ke Word dulu (bisa ditulis linear, mis. "a=(p,2,-1)",
  // menghindari ambiguitas tata letak 2D), lalu diimpor lewat sini.
  //
  // mammoth.js MENGUBAH .docx MENJADI HTML, dan (INI YANG PALING
  // BERHARGA) gambar yang ditempel di dalam Word OTOMATIS ikut
  // dikonversi jadi <img src="data:..."> base64 -- TIDAK PERLU
  // dipotong/crop sama sekali, beda dari jalur PDF yang harus menebak
  // posisi gambar. Tabel Word juga tetap jadi <table> HTML asli,
  // bukan gambar -- strukturnya (baris & kolom) tetap utuh.
  //
  // Fungsi murni ini TIDAK menyentuh AI/API sama sekali -- semua
  // deterministik dari struktur dokumen, sama seperti filosofi jalur
  // PDF.
  async function parseDocxIntoQuestions(arrayBuffer) {
    const mammoth = await ensureMammothLoaded();
  
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;
  
    const parser = new DOMParser();
    const dom = parser.parseFromString(html, 'text/html');
    const topLevelNodes = [...dom.body.children];
  
    // Kelompokkan node top-level (paragraf, tabel) jadi blok per soal --
    // blok baru dimulai tiap kali ketemu paragraf yang diawali nomor
    // ("1.", "23)", dst), sama seperti deteksi nomor soal di jalur PDF,
    // tapi jauh lebih sederhana karena dokumen Word TIDAK punya tata
    // letak 2 kolom yang perlu dipisah -- urutan paragraf SUDAH urutan
    // baca yang benar.
    const blocks = [];
    let current = null;
  
    for (const node of topLevelNodes) {
      const text = node.textContent.trim();
      const isQuestionStart =
        node.tagName === 'P' && /^\d{1,3}[.)]\s*/.test(text);
  
      if (isQuestionStart) {
        if (current) blocks.push(current);
        current = {
          printedNumber: parseInt(text.match(/^\d{1,3}/)[0], 10),
          nodes: [node],
        };
      } else if (current) {
        current.nodes.push(node);
      }
      // Node SEBELUM soal pertama (judul dokumen, instruksi umum) --
      // dibuang, bukan bagian dari soal mana pun.
    }
    if (current) blocks.push(current);
  
    const questions = blocks.map((block) => {
      // Gabungkan teks semua paragraf dalam blok ini (tabel dikecualikan
      // dari teks -- tabel ditangani terpisah sebagai tableHtml).
      const textNodes = block.nodes.filter((n) => n.tagName !== 'TABLE');
  
      const fullText = textNodes
        .map((n) => n.textContent)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
  
      const withoutNumber = fullText.replace(/^\s*\d{1,3}[.)]\s*/, '');
  
      // Gambar yang ditempel Word -- AMBIL LANGSUNG, tidak perlu
      // dipotong/crop sama sekali (beda dari jalur PDF).
      const firstImg = block.nodes
        .flatMap((n) => [...n.querySelectorAll?.('img') ?? []])
        .find(Boolean);
  
      // Tabel Word -- disimpan sebagai HTML tabel ASLI (struktur baris
      // & kolom asli, bukan gambar/tebakan).
      const tableNode = block.nodes.find((n) => n.tagName === 'TABLE');
  
      const optionImagesFromDoc = block.nodes
        .flatMap((n) => [...n.querySelectorAll?.('img') ?? []])
        .slice(firstImg ? 1 : 0) // gambar pertama dianggap figure soal, sisanya (jika ada) opsi bergambar
        .map((img) => img.getAttribute('src'))
        .filter(Boolean);
  
      const { question, options } = splitOptionsFromText(withoutNumber);
      const tipeSoal = classifyTipeSoal(
        withoutNumber,
        optionImagesFromDoc.length >= 2,
      );
  
      return {
        printedNumber: block.printedNumber,
        question,
        options:
          optionImagesFromDoc.length >= 2
            ? []
            : options.length > 0
              ? options
              : ['', '', '', ''],
        tipeSoal,
        qImage: firstImg ? firstImg.getAttribute('src') || '' : '',
        optionsAreImages: optionImagesFromDoc.length >= 2,
        optionImages: optionImagesFromDoc,
        tableHtml: tableNode ? tableNode.outerHTML : '',
        // Word tidak punya "gambar halaman" untuk pembanding visual
        // seperti PDF -- rawCropImage dikosongkan, panel kiri di layar
        // tinjau akan menampilkan teks HTML asli sebagai gantinya.
        rawCropImage: '',
      };
    });
  
    return questions;
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
    // 🔥 BARU: dua jalur impor -- 'pdf' (deteksi geometris, cocok untuk
    // soal teks/prosa biasa) dan 'word' (baca struktur .docx langsung,
    // cocok untuk soal bernotasi matematika rumit -- vektor, matriks --
    // yang diketik ulang linear supaya tidak ambigu).
    const [importMode, setImportMode] = useState('pdf');
  
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
    const docxBufferRef = useRef(null); // 🔥 BARU: menyimpan arrayBuffer .docx untuk mode Word
    const abortRef = useRef(false);
    const pauseRef = useRef(false);
  
    // ----------------------------------------------------------
    // MUAT PDF
    // ----------------------------------------------------------
  
    const handleFileChange = useCallback(async (event) => {
      const picked = event.target.files?.[0];
      if (!picked) return;
  
      if (importMode === 'pdf' && picked.type !== 'application/pdf') {
        setErrorMessage('Berkas harus PDF untuk mode ini.');
        setStatus(STATUS.ERROR);
        return;
      }
  
      if (
        importMode === 'word' &&
        !picked.name.toLowerCase().endsWith('.docx')
      ) {
        setErrorMessage('Berkas harus .docx untuk mode ini.');
        setStatus(STATUS.ERROR);
        return;
      }
  
      setFile(picked);
      setErrorMessage('');
      setPages([]);
      setSavedCount(0);
      setStatus(STATUS.LOADING_PDF);
  
      try {
        if (importMode === 'word') {
          // 🔥 BARU: mode Word -- tidak ada konsep "halaman" seperti
          // PDF, seluruh dokumen diproses jadi satu kesatuan. Rentang
          // halaman disetel 1..1 supaya kontrol UI yang sama (dibagi
          // per-halaman) tetap kompatibel tanpa perlu menulis ulang
          // seluruh alur proses/tinjau/simpan.
          const buffer = await picked.arrayBuffer();
          docxBufferRef.current = buffer;
          setTotalPages(1);
          setStartPage(1);
          setEndPage(1);
          setStatus(STATUS.IDLE);
          return;
        }
  
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
          `Berkas tidak bisa dibuka: ${error?.message || 'berkas mungkin rusak.'}`,
        );
        setStatus(STATUS.ERROR);
      }
    }, [importMode]);
  
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
  
        // 🔥 BARU: ekstraksi teks LANGSUNG dari PDF (bukan AI membaca
        // gambar) -- lihat penjelasan lengkap di atas fungsi
        // extractLinesInRange(). Ini yang menggantikan langkah
        // transkripsi AI yang terbukti tidak cukup andal.
        const textLines = extractLinesInRange(
          items,
          top,
          bottom,
          colRange.left,
          colRange.right,
        );
  
        const fullText = textLines.map((l) => l.text).join(' ');
        const withoutNumber = fullText.replace(/^\s*\d{1,3}[.)]\s*/, '');
  
        const { question, options } = splitOptionsFromText(withoutNumber);
        const tipeSoal = classifyTipeSoal(
          withoutNumber,
          optionCrops.length >= 2,
        );
  
        // 🔥 BARU: deteksi area diagram/grafik lewat CELAH KOSONG antar
        // baris teks (bukan AI menebak kotak pembatas) -- kalau ada
        // celah jauh lebih lebar dari jarak baris normal, itu
        // kemungkinan besar diagram/grafik vektor yang tidak punya teks
        // sama sekali (grafik seperti kurva P-V TIDAK terdeteksi lewat
        // findImageRegions() karena itu digambar pakai garis/kurva
        // vektor, BUKAN gambar raster tertanam).
        const figureGap = findFigureGap(textLines);
  
        let figureImage = '';
        if (optionCrops.length === 0 && figureGap) {
          const figRect = pdfRectToCanvasRect(
            viewport,
            colRange.left,
            figureGap.top,
            figureGap.bottom,
            colRange.right - colRange.left,
          );
          figureImage = cropCanvasToDataUrl(pageCanvas, figRect, 6) || '';
        }
  
        crops.push({
          printedNumber: start.number,
          rawCropImage: mainCrop,
          question,
          options: options.length > 0 ? options : ['', '', '', ''],
          tipeSoal,
          qImage: figureImage,
          optionsAreImages: optionCrops.length >= 2,
          optionImages: optionCrops,
        });
      }
  
      return { pageImage, crops };
    }, []);
  
    // ----------------------------------------------------------
    // PROSES SATU HALAMAN LENGKAP: deteksi soal, teks, opsi, & figur
    // SEPENUHNYA DETERMINISTIK -- TANPA AI SAMA SEKALI.
    // ----------------------------------------------------------
  
    const processOnePage = useCallback(
      async (pageNumber) => {
        // 🔥 BARU: mode Word -- jalur PARSING SAMA SEKALI BEDA (baca
        // struktur .docx, bukan geometri PDF), tapi hasil akhirnya
        // dipetakan ke BENTUK OBJEK SOAL YANG SAMA supaya seluruh layar
        // tinjau & fungsi simpan di bawah bisa dipakai ulang tanpa
        // perlu ditulis dua kali.
        if (importMode === 'word') {
          const docxQuestions = await parseDocxIntoQuestions(
            docxBufferRef.current,
          );
  
          const questions = docxQuestions.map((q) => ({
            id: newId(),
            pageNumber,
            printedNumber: q.printedNumber,
            rawCropImage: '', // Word tidak punya gambar halaman pembanding
            question: q.question,
            options: q.options,
            tipeSoal: q.tipeSoal,
            kuantitasP: '',
            kuantitasQ: '',
            optionsAreImages: q.optionsAreImages,
            optionImages: q.optionImages,
            qImage: q.qImage,
            tableHtml: q.tableHtml || '',
            correct: null,
            explanation: '',
            shortAnswerValue: '',
            approved: false,
          }));
  
          return { pageImage: '', questions };
        }
  
        const { pageImage, crops } = await detectQuestionsOnPage(pageNumber);
  
        // 🔥 Murni pemetaan hasil crop -> objek soal, SEPENUHNYA
        // SINKRON -- semua data (teks, opsi, tipe soal, figure) sudah
        // diekstrak deterministik di detectQuestionsOnPage() di atas.
        // TIDAK ADA panggilan AI, TIDAK ADA jeda jaringan sama sekali
        // di jalur ini -- satu halaman selesai secepat browser bisa
        // merender & membaca teks PDF-nya.
        const questions = crops.map((crop) => ({
          id: newId(),
          pageNumber,
          printedNumber: crop.printedNumber,
          // Crop UTUH blok soal -- disimpan HANYA untuk pembanding
          // visual di layar tinjau (kolom kiri kartu), TIDAK ikut
          // disimpan ke Bank Soal.
          rawCropImage: crop.rawCropImage,
          question: crop.question,
          options: crop.optionsAreImages ? [] : crop.options,
          tipeSoal: crop.tipeSoal,
          kuantitasP: '',
          kuantitasQ: '',
          optionsAreImages: crop.optionsAreImages,
          optionImages: crop.optionImages,
          qImage: crop.qImage,
          tableHtml: '',
          correct: null,
          explanation: '',
          shortAnswerValue: '',
          approved: false,
        }));
  
        return { pageImage, questions };
      },
      [detectQuestionsOnPage, importMode],
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
  
        // 🔥 FIX: pengecekan jeda sebelumnya ada di loop PER-SOAL (yang
        // sudah dihapus sekarang karena tidak ada lagi panggilan AI
        // otomatis per soal). Dipindah ke sini (loop per-HALAMAN) supaya
        // tombol "Jeda" tetap berfungsi -- tanpa ini, klik "Jeda" cuma
        // mengubah label status tanpa benar-benar menghentikan proses.
        while (pauseRef.current && !abortRef.current) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 300));
        }
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
    // 🔥 BARU: ALAT BANTU MANUAL -- baca ulang SATU soal pakai AI
    // ----------------------------------------------------------
    // Ekstraksi deterministik (di atas) menangani mayoritas kasus
    // dengan andal, tapi tata letak yang sangat tidak lazim (mis. tabel
    // rumit, kolom miring, dll) masih mungkin meleset. Untuk kasus
    // langka semacam itu, admin bisa klik tombol ini per soal -- BUKAN
    // otomatis untuk semua soal seperti desain sebelumnya yang
    // terbukti tidak andal & lambat.
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
  
    // 🔥 BARU: ALAT BANTU MANUAL -- baca ulang SATU soal pakai AI.
    // Ekstraksi deterministik (di atas) menangani mayoritas kasus
    // dengan andal, tapi tata letak yang sangat tidak lazim (mis. tabel
    // rumit, kolom miring, dll) masih mungkin meleset. Untuk kasus
    // langka semacam itu, admin bisa klik tombol ini per soal -- BUKAN
    // otomatis untuk semua soal seperti desain sebelumnya yang
    // terbukti tidak andal & lambat.
    //
    // 🔥 FIX BUG NYATA (dilaporkan langsung dari pemakaian nyata):
    // sebelumnya hasil AI ini LANGSUNG MENIMPA data yang sudah
    // diekstrak deterministik (question/options/tipeSoal/kuantitasP/Q),
    // TANPA perbandingan, TANPA konfirmasi, TANPA cara membatalkan.
    // Karena ekstraksi deterministik TERBUKTI LEBIH ANDAL daripada AI
    // (itu justru ALASAN revisi ke-4 dibangun -- lihat komentar
    // panjang di atas fungsi extractLinesInRange), menimpa otomatis
    // ini punya risiko NYATA bikin data yang SUDAH BENAR jadi RUSAK
    // kalau AI menebak lebih buruk -- persis kejadian nyata yang
    // dilaporkan: soal limit lengkap tertimpa jadi cuma "Hasil dari 1"
    // plus field kuantitasP/Q ikut kesalahan terisi nilai yang gak
    // nyambung sama sekali dengan soalnya.
    //
    // Sekarang: hasil AI DISIMPAN TERPISAH sebagai "usulan"
    // (aiSuggestion), BUKAN langsung menimpa. Admin harus lihat
    // perbandingan berdampingan dan EKSPLISIT klik "Pakai hasil AI ini"
    // baru data asli diganti -- atau "Buang usulan ini" untuk tetap
    // pakai hasil deterministik yang sudah ada.
    const retryQuestionWithAI = useCallback(
      async (pageNumber, questionId) => {
        const page = pages.find((p) => p.pageNumber === pageNumber);
        const question = page?.questions.find((q) => q.id === questionId);
        if (!question?.rawCropImage) return;

        updateQuestion(pageNumber, questionId, {
          aiRetryInProgress: true,
          transcribeError: null,
        });

        try {
          const transcript = await transcribeQuestionWithAI(
            question.rawCropImage,
          );

          const figureImage = transcript.hasFigure
            ? (await cropFigureFromQuestionImage(
                question.rawCropImage,
                transcript.figureBBox,
              )) || ''
            : '';

          // 🔥 TIDAK LAGI menimpa question/options/tipeSoal/dst secara
          // langsung -- semua disimpan di bawah field `aiSuggestion`,
          // menunggu keputusan eksplisit admin (lihat tombol "Pakai
          // hasil AI ini" / "Buang usulan ini" di layar tinjau).
          updateQuestion(pageNumber, questionId, {
            aiSuggestion: {
              question: transcript.question,
              options: transcript.options,
              tipeSoal: transcript.tipeSoal,
              kuantitasP: transcript.kuantitasP,
              kuantitasQ: transcript.kuantitasQ,
              qImage: figureImage,
              readingConfidence: transcript.readingConfidence,
            },
            aiRetryInProgress: false,
          });
        } catch (error) {
          updateQuestion(pageNumber, questionId, {
            transcribeError: error?.message || 'AI gagal membaca soal ini.',
            aiRetryInProgress: false,
          });
        }
      },
      [pages, updateQuestion],
    );

    // 🔥 BARU: admin EKSPLISIT menerima usulan AI -- baru di titik INI
    // data asli (deterministik) benar-benar diganti.
    const acceptAiSuggestion = useCallback(
      (pageNumber, questionId) => {
        const page = pages.find((p) => p.pageNumber === pageNumber);
        const question = page?.questions.find((q) => q.id === questionId);
        const suggestion = question?.aiSuggestion;
        if (!suggestion) return;

        updateQuestion(pageNumber, questionId, {
          question: suggestion.question || question.question,
          options:
            suggestion.options.length > 0 ? suggestion.options : question.options,
          tipeSoal: suggestion.tipeSoal,
          kuantitasP: suggestion.kuantitasP,
          kuantitasQ: suggestion.kuantitasQ,
          qImage: suggestion.qImage || question.qImage,
          readingConfidence: suggestion.readingConfidence,
          aiSuggestion: null,
        });
      },
      [pages, updateQuestion],
    );

    // 🔥 BARU: admin membuang usulan AI -- data asli (deterministik)
    // TETAP UTUH, gak pernah tersentuh sama sekali.
    const rejectAiSuggestion = useCallback(
      (pageNumber, questionId) => {
        updateQuestion(pageNumber, questionId, { aiSuggestion: null });
      },
      [updateQuestion],
    );

  
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
          tableHtml: q.tableHtml || '',
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
            <h1 className="bsi-title">
              Tambah soal dari {importMode === 'word' ? 'Word' : 'PDF'}
            </h1>
            <p className="bsi-sub">
              {importMode === 'word' ? (
                <>
                  Cocok untuk soal bernotasi matematika rumit (vektor,
                  matriks) yang sudah diketik ulang linear di Word --
                  teks, gambar, dan tabel diambil LANGSUNG dari struktur
                  dokumen, bukan tebakan. Jawaban & pembahasan dibuat
                  belakangan, saat soal ini dipakai di sebuah kuis.
                </>
              ) : (
                <>
                  Soal, opsi jawaban, dan diagram diambil LANGSUNG dari
                  teks & grafik asli PDF -- tanpa AI sama sekali (AI cuma
                  tersedia sebagai alat bantu opsional per soal, kalau
                  ada yang meleset). Jawaban & pembahasan dibuat
                  belakangan, saat soal ini dipakai di sebuah kuis.
                </>
              )}
            </p>
          </div>
  
          {onCancel && (
            <button type="button" className="bsi-btn ghost" onClick={onCancel}>
              Tutup
            </button>
          )}
        </header>
  
        {/* 🔥 BARU: pilih jalur impor -- hanya tampil sebelum berkas
            dipilih (mengganti mode sesudahnya akan membingungkan,
            karena rentang halaman & data yang sudah dimuat jadi tidak
            relevan). */}
        {!file && (
          <div className="bsi-mode-toggle">
            <button
              type="button"
              className={`bsi-mode-btn${importMode === 'pdf' ? ' active' : ''}`}
              onClick={() => setImportMode('pdf')}
            >
              Dari PDF
            </button>
            <button
              type="button"
              className={`bsi-mode-btn${importMode === 'word' ? ' active' : ''}`}
              onClick={() => setImportMode('word')}
            >
              Dari Word (.docx)
            </button>
          </div>
        )}
  
        {/* ---------------- UNGGAH ---------------- */}
        {!file && (
          <label className="bsi-drop">
            <input
              type="file"
              accept={importMode === 'word' ? '.docx' : 'application/pdf'}
              onChange={handleFileChange}
              hidden
            />
            <span className="bsi-drop-title">
              {importMode === 'word'
                ? 'Pilih berkas Word (.docx)'
                : 'Pilih berkas PDF'}
            </span>
            <span className="bsi-drop-hint">
              {importMode === 'word' ? (
                <>
                  Tulis notasi matematika (vektor, matriks) sebagai TEKS
                  BIASA satu baris, mis. "a = (p, 2, -1)" -- bukan lewat
                  Equation Editor Word, supaya bisa diambil sebagai teks.
                </>
              ) : (
                <>
                  Gunakan PDF yang punya lapisan teks asli (bukan hasil
                  scan murni) -- deteksi nomor soal bergantung pada
                  posisi teks sungguhan di dalam file, bukan tebakan
                  visual.
                </>
              )}
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
                {/* 🔥 Rentang halaman tidak relevan untuk mode Word
                    (dokumen diproses utuh sekaligus) -- disembunyikan,
                    hanya tombol mulai yang tampil. */}
                {importMode !== 'word' && (
                  <>
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
                  </>
                )}
  
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
              <div
                className={`bsi-compare${
                  importMode === 'word' ? ' bsi-compare-single' : ''
                }`}
              >
                {/* 🔥 Mode Word tidak punya "gambar halaman" pembanding
                    (dokumen bukan berlembar seperti PDF) -- panel kiri
                    disembunyikan total, daftar soal memakai lebar
                    penuh. */}
                {importMode !== 'word' && (
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
                )}
  
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
                              retryQuestionWithAI(selectedPage.pageNumber, q.id)
                            }
                            disabled={q.aiRetryInProgress || !!q.aiSuggestion}
                            title="Hasil otomatis di atas BIASANYA sudah lebih akurat daripada AI -- tombol ini cuma buat kasus langka (tata letak aneh) yang meleset. Hasil AI TIDAK langsung dipakai, kamu akan diminta membandingkan dulu."
                          >
                            {q.aiRetryInProgress ? 'Membaca…' : 'Coba baca ulang (AI)'}
                          </button>
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

                      {/* 🔥 BARU: PANEL PERBANDINGAN USULAN AI -- muncul
                          HANYA kalau admin baru saja klik "Coba baca ulang
                          (AI)" dan hasilnya belum diputuskan. Data asli
                          (deterministik) TIDAK PERNAH berubah sampai
                          admin eksplisit klik "Pakai hasil AI ini". */}
                      {q.aiSuggestion && (
                        <div className="bsi-ai-compare">
                          <p className="bsi-ai-compare-title">
                            🤖 AI mengusulkan hasil berbeda -- bandingkan dulu sebelum memutuskan (hasil di atas TIDAK berubah kalau kamu belum memilih):
                          </p>
                          <div className="bsi-ai-compare-row">
                            <div className="bsi-ai-compare-col">
                              <span className="bsi-ai-compare-label">Hasil deterministik (sekarang)</span>
                              <div className="bsi-ai-compare-box">{q.question || '(kosong)'}</div>
                              {q.options && q.options.length > 0 && (
                                <ul className="bsi-ai-compare-options">
                                  {q.options.map((opt, oi) => (
                                    <li key={oi}>{String.fromCharCode(65 + oi)}. {opt}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                            <div className="bsi-ai-compare-col">
                              <span className="bsi-ai-compare-label">Usulan AI</span>
                              <div className="bsi-ai-compare-box highlight">{q.aiSuggestion.question || '(kosong)'}</div>
                              {q.aiSuggestion.options && q.aiSuggestion.options.length > 0 && (
                                <ul className="bsi-ai-compare-options">
                                  {q.aiSuggestion.options.map((opt, oi) => (
                                    <li key={oi}>{String.fromCharCode(65 + oi)}. {opt}</li>
                                  ))}
                                </ul>
                              )}
                              {q.aiSuggestion.readingConfidence === 'low' && (
                                <p className="bsi-flag">AI sendiri kurang yakin membaca sebagian teks ini.</p>
                              )}
                            </div>
                          </div>
                          <div className="bsi-ai-compare-actions">
                            <button
                              type="button"
                              className="bsi-btn ghost sm"
                              onClick={() => rejectAiSuggestion(selectedPage.pageNumber, q.id)}
                            >
                              Tetap pakai hasil deterministik
                            </button>
                            <button
                              type="button"
                              className="bsi-btn primary sm"
                              onClick={() => acceptAiSuggestion(selectedPage.pageNumber, q.id)}
                            >
                              Pakai hasil AI ini
                            </button>
                          </div>
                        </div>
                      )}
                      </div>
  
                      {/* Perbandingan visual: crop asli di kiri (kecil,
                          untuk memastikan AI membaca dengan benar),
                          teks hasil transkripsi yang BISA DIEDIT di
                          kanan. */}
                      <div className="bsi-transcript-row">
                        {q.rawCropImage && (
                          <img
                            src={q.rawCropImage}
                            alt="Crop asli"
                            className="bsi-rawcrop"
                          />
                        )}
  
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
  
                          {/* 🔥 BARU: tabel Word ASLI (struktur baris &
                              kolom dari .docx, bukan gambar/tebakan) --
                              cuma muncul untuk soal hasil impor Word
                              yang memang punya tabel. */}
                          {q.tableHtml && (
                            <div className="bsi-figure-wrap">
                              <span className="bsi-figure-label">
                                Tabel terdeteksi dalam soal ini:
                              </span>
                              <div
                                className="bsi-table-preview"
                                // eslint-disable-next-line react/no-danger
                                dangerouslySetInnerHTML={{
                                  __html: q.tableHtml,
                                }}
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
                          Percobaan "Baca ulang (AI)" gagal --
                          ({q.transcribeError}). Ekstraksi otomatis
                          (tanpa AI) di atas tetap berlaku, edit manual
                          kalau perlu.
                        </p>
                      )}
  
                      {!q.transcribeError && q.readingConfidence === 'low' && (
                        <p className="bsi-flag">
                          AI (lewat "Baca ulang") kurang yakin membaca
                          sebagian teks ini -- cocokkan dengan crop asli
                          di sebelah kiri.
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
  .bsi-mode-toggle{display:flex;gap:8px;margin-bottom:14px}
  .bsi-mode-btn{flex:1;padding:11px;border:1px solid var(--line);border-radius:9px;background:#fff;
    font-size:14px;font-weight:600;color:var(--muted);cursor:pointer;font-family:inherit}
  .bsi-mode-btn.active{border-color:var(--brand);background:#eff4ff;color:var(--brand)}
  .bsi-table-preview{overflow-x:auto;border:1px solid var(--line);border-radius:8px}
  .bsi-table-preview table{border-collapse:collapse;width:100%;font-size:13px}
  .bsi-table-preview td,.bsi-table-preview th{border:1px solid var(--line);padding:6px 9px;text-align:left}
  .bsi-compare-single{grid-template-columns:1fr}
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

  /* 🔥 BARU: panel perbandingan usulan AI */
  .bsi-ai-compare{margin-top:10px;padding:14px;border-radius:10px;background:#fffbeb;
    border:1px solid #fde68a}
  .bsi-ai-compare-title{margin:0 0 10px;font-size:12.5px;font-weight:650;color:#92400e}
  .bsi-ai-compare-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .bsi-ai-compare-col{display:flex;flex-direction:column;gap:6px}
  .bsi-ai-compare-label{font-size:11px;font-weight:700;color:var(--muted);
    text-transform:uppercase;letter-spacing:.04em}
  .bsi-ai-compare-box{padding:10px 12px;border-radius:8px;background:#fff;
    border:1px solid var(--line);font-size:13.5px;line-height:1.5;min-height:44px}
  .bsi-ai-compare-box.highlight{border-color:#f59e0b;background:#fffdf5}
  .bsi-ai-compare-options{margin:0;padding-left:18px;font-size:12.5px;color:#334155;
    line-height:1.6}
  .bsi-ai-compare-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}
  @media (max-width:700px){
    .bsi-ai-compare-row{grid-template-columns:1fr}
  }

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