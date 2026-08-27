// ============================================================
// BIMBEL GEMILANG
// src/pages/admin/BankSoalImport.jsx
// ============================================================
//
// Halaman admin: unggah PDF berisi soal -> sistem membaca tiap
// halaman -> admin meninjau & mengoreksi -> simpan ke Bank Soal.
//
// ------------------------------------------------------------
// KENAPA HALAMAN DIRENDER DI BROWSER, BUKAN DI SERVER
// ------------------------------------------------------------
// Mengubah halaman PDF menjadi gambar butuh mesin render. Di Vercel
// serverless, binary seperti poppler/pdftoppm tidak tersedia, dan
// memasangnya merepotkan sekaligus memakan waktu eksekusi yang kita
// justru sedang irit-irit (batas 60 detik).
//
// Untungnya aplikasi ini SUDAH memuat pdfjs-dist di bundle (terlihat
// pada hasil build: dist/assets/pdf.worker.min-*.js). Jadi render
// dilakukan di browser admin -- gratis, tidak menyentuh kuota server,
// dan tidak menambah Serverless Function (paket Hobby dibatasi 12,
// dan kita sudah mentok di angka itu).
//
// ------------------------------------------------------------
// KENAPA GAMBAR DIPOTONG DARI HALAMAN, BUKAN DIEKSTRAK
// ------------------------------------------------------------
// PDF menyimpan foto sebagai gambar tertanam, TAPI garis tabel,
// diagram, grafik, dan bangun geometri disimpan sebagai VEKTOR --
// bukan gambar. Kalau kita ekstrak gambar tertanamnya saja, yang
// didapat hanya potongan foto lepas tanpa tabel/diagram yang
// membungkusnya.
//
// Contoh nyata dari berkas tryout TKA: satu halaman berisi 19 gambar
// tertanam, tetapi semuanya foto kecil di DALAM sebuah tabel. Ekstrak
// mentah menghasilkan 19 foto tanpa konteks; yang benar adalah
// memotong area tabelnya utuh dari halaman yang sudah dirender.
//
// ------------------------------------------------------------
// KENAPA TINJAUAN ADMIN WAJIB
// ------------------------------------------------------------
// AI membaca halaman lewat penglihatan, dan pembacaan itu bisa
// keliru -- terutama pangkat, akar, indeks, dan pecahan bertingkat.
// Satu salah baca berarti KUNCI JAWABAN yang salah, dan itu baru
// ketahuan setelah siswa mengerjakan. Maka hasil baca TIDAK PERNAH
// langsung masuk Bank Soal: selalu lewat layar tinjau ini dulu.
//
// ------------------------------------------------------------
// INTEGRASI YANG DIBUTUHKAN
// ------------------------------------------------------------
// props:
//   folderId, folderName : folder tujuan penyimpanan
//   onSaveQuestions(soal[]) : dipanggil saat admin menekan "Simpan".
//     Fungsi ini yang menulis ke Firestore (koleksi bank_soal).
//     Dibuat sebagai prop supaya komponen ini tidak perlu tahu
//     struktur database -- lebih mudah diuji dan dipindah.
//   onCancel() : opsional, menutup halaman.
//
// Endpoint yang dipakai: POST /api/smartParseQuiz
// dengan body { pageImage, pageNumber, sourceName }
// (MENUMPANG di endpoint smartParseQuiz.js yang sudah ada -- file itu
// sebelumnya cuma menerima teks tempel, sekarang punya cabang kedua
// khusus gambar halaman, dipilih otomatis lewat keberadaan field
// `pageImage`. Lihat catatan batas 12 Serverless Function di atas --
// TIDAK ada file endpoint baru yang ditambahkan untuk fitur ini.)
// ============================================================

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
  } from 'react';
  
  import * as pdfjsLib from 'pdfjs-dist';
  
  // Pola standar Vite untuk memuat worker pdf.js. Aplikasi ini sudah
  // memakai pola yang sama di tempat lain, jadi bundle-nya tidak
  // bertambah.
  import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
  
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    pdfWorkerSrc;
  
  // ============================================================
  // KONSTANTA
  // ============================================================
  
  // Lebar render halaman dalam piksel. 1400 px cukup agar pangkat,
  // indeks, dan pecahan kecil tetap terbaca AI, tanpa membuat berkas
  // gambar membengkak dan lambat dikirim.
  const RENDER_WIDTH_PX = 1400;
  
  // Mutu JPEG saat mengirim halaman ke AI. 0.85 adalah titik seimbang:
  // teks matematika masih tajam, ukuran kiriman tetap wajar.
  const PAGE_JPEG_QUALITY = 0.85;
  
  // Potongan gambar soal dipakai langsung di kuis siswa, jadi mutunya
  // dinaikkan sedikit.
  const CROP_JPEG_QUALITY = 0.92;
  
  // Jeda antar halaman. Tier gratis Gemini membatasi jumlah permintaan
  // per menit; jeda ini mencegah pemrosesan panjang terhenti di tengah
  // karena kena batas.
  const DELAY_BETWEEN_PAGES_MS = 1200;
  
  const STATUS = {
    IDLE: 'idle',
    LOADING_PDF: 'loading_pdf',
    PROCESSING: 'processing',
    PAUSED: 'paused',
    DONE: 'done',
    ERROR: 'error',
  };
  
  // ============================================================
  // UTIL
  // ============================================================
  
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
  
  // Memotong area gambar dari kanvas halaman.
  // bbox datang dari AI dalam koordinat ternormalisasi 0..1 supaya
  // tidak bergantung pada resolusi render.
  function cropFromCanvas(canvas, bbox) {
    if (!canvas || !bbox) return '';
  
    const x = Math.max(0, Math.min(1, Number(bbox.x)));
    const y = Math.max(0, Math.min(1, Number(bbox.y)));
    const w = Math.max(0, Math.min(1 - x, Number(bbox.width)));
    const h = Math.max(0, Math.min(1 - y, Number(bbox.height)));
  
    if (!(w > 0.01) || !(h > 0.01)) return '';
  
    const sx = Math.round(x * canvas.width);
    const sy = Math.round(y * canvas.height);
    const sw = Math.round(w * canvas.width);
    const sh = Math.round(h * canvas.height);
  
    const out = document.createElement('canvas');
    out.width = sw;
    out.height = sh;
  
    const ctx = out.getContext('2d');
    // Latar putih: sebagian PDF punya latar transparan yang akan
    // menjadi hitam kalau diekspor ke JPEG.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sw, sh);
    ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
  
    return out.toDataURL('image/jpeg', CROP_JPEG_QUALITY);
  }
  
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
  
    // Hasil baca per halaman: { pageNumber, pageImage, questions[] }
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
        const buffer = await picked.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  
        pdfDocRef.current = doc;
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
    // RENDER SATU HALAMAN KE KANVAS
    // ----------------------------------------------------------
  
    const renderPageToCanvas = useCallback(async (pageNumber) => {
      const doc = pdfDocRef.current;
      if (!doc) return null;
  
      const page = await doc.getPage(pageNumber);
  
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = RENDER_WIDTH_PX / baseViewport.width;
      const viewport = page.getViewport({ scale });
  
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
  
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      await page.render({ canvasContext: ctx, viewport }).promise;
  
      return canvas;
    }, []);
  
    // ----------------------------------------------------------
    // KIRIM SATU HALAMAN KE AI
    // ----------------------------------------------------------
  
    const readPageWithAI = useCallback(
      async (pageImageBase64, pageNumber) => {
        const response = await fetch('/api/smartParseQuiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageImage: pageImageBase64,
            pageNumber,
            sourceName: file?.name || '',
          }),
        });
  
        const data = await response.json();
  
        if (!response.ok || !data.success) {
          const detail = data?.error || `HTTP ${response.status}`;
          throw new Error(detail);
        }
  
        return Array.isArray(data.questions) ? data.questions : [];
      },
      [file],
    );
  
    // ----------------------------------------------------------
    // PROSES BERURUTAN
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
  
        while (pauseRef.current && !abortRef.current) {
          // Menunggu admin menekan "Lanjutkan".
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 300));
        }
        if (abortRef.current) break;
  
        setCurrentPage(pageNumber);
  
        try {
          // eslint-disable-next-line no-await-in-loop
          const canvas = await renderPageToCanvas(pageNumber);
          if (!canvas) continue;
  
          const pageImage = canvas.toDataURL('image/jpeg', PAGE_JPEG_QUALITY);
  
          // eslint-disable-next-line no-await-in-loop
          const rawQuestions = await readPageWithAI(pageImage, pageNumber);
  
          const questions = rawQuestions.map((q) => ({
            ...q,
            id: newId(),
            pageNumber,
            // Potong gambar dari kanvas halaman ini, selagi kanvasnya
            // masih ada di memori.
            qImage: q.figureBBox ? cropFromCanvas(canvas, q.figureBBox) : '',
            approved: false,
          }));
  
          setPages((prev) => [
            ...prev,
            { pageNumber, pageImage, questions, error: null },
          ]);
        } catch (error) {
          // Satu halaman gagal tidak boleh menghentikan seluruh
          // pekerjaan -- halaman itu ditandai dan bisa diulang sendiri.
          setPages((prev) => [
            ...prev,
            {
              pageNumber,
              pageImage: '',
              questions: [],
              error: error?.message || 'Gagal membaca halaman ini.',
            },
          ]);
        }
  
        if (pageNumber < to) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, DELAY_BETWEEN_PAGES_MS));
        }
      }
  
      setStatus(abortRef.current ? STATUS.IDLE : STATUS.DONE);
    }, [startPage, endPage, totalPages, renderPageToCanvas, readPageWithAI]);
  
    // ----------------------------------------------------------
    // ULANG SATU HALAMAN
    // ----------------------------------------------------------
  
    const retryPage = useCallback(
      async (pageNumber) => {
        setErrorMessage('');
        try {
          const canvas = await renderPageToCanvas(pageNumber);
          if (!canvas) return;
  
          const pageImage = canvas.toDataURL('image/jpeg', PAGE_JPEG_QUALITY);
          const rawQuestions = await readPageWithAI(pageImage, pageNumber);
  
          const questions = rawQuestions.map((q) => ({
            ...q,
            id: newId(),
            pageNumber,
            qImage: q.figureBBox ? cropFromCanvas(canvas, q.figureBBox) : '',
            approved: false,
          }));
  
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
      [renderPageToCanvas, readPageWithAI],
    );
  
    // ----------------------------------------------------------
    // SUNTING SOAL
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
  
    const updateOption = useCallback(
      (pageNumber, questionId, index, value) => {
        setPages((prev) =>
          prev.map((p) =>
            p.pageNumber !== pageNumber
              ? p
              : {
                  ...p,
                  questions: p.questions.map((q) => {
                    if (q.id !== questionId) return q;
                    const options = [...(q.options || [])];
                    options[index] = value;
                    return { ...q, options };
                  }),
                },
          ),
        );
      },
      [],
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
  
    const failedPages = useMemo(
      () => pages.filter((p) => p.error),
      [pages],
    );
  
    const selectedPage = pages[selectedPageIndex] || null;
  
    // Ikuti halaman terbaru selama pemrosesan berjalan, supaya admin
    // bisa langsung melihat hasilnya masuk satu per satu.
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
          type: q.type || 'multiple',
          question: q.question,
          options: q.options || [],
          correct: Number.isInteger(q.correct) ? q.correct : 0,
          explanation: q.explanation || '',
          qImage: q.qImage || '',
          needsImage: Boolean(q.qImage),
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
  
        // Soal yang sudah tersimpan dikeluarkan dari daftar agar tidak
        // tersimpan dua kali kalau admin menekan Simpan lagi.
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
  
    const isBusy =
      status === STATUS.PROCESSING || status === STATUS.LOADING_PDF;
  
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
              Sistem membaca tiap halaman, lalu memecahnya menjadi soal
              per butir. Periksa hasilnya sebelum disimpan.
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
              Gunakan PDF, bukan Word. Tata letak PDF terkunci sehingga
              rumus, tabel, dan gambar terbaca persis seperti aslinya.
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
                Berkas ini panjang. Membaca sekaligus bisa memakan waktu
                lama dan menghabiskan kuota harian. Sebaiknya kerjakan
                per 20–30 halaman.
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
                    Membaca halaman {currentPage} dari {endPage}
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
                Dijeda di halaman {currentPage}. Hasil yang sudah terbaca
                tetap tersimpan di layar ini.
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
            {failedPages.length} halaman gagal dibaca:{' '}
            {failedPages.map((p) => p.pageNumber).join(', ')}. Buka
            halamannya lalu tekan Ulangi.
          </div>
        )}
  
        {/* ---------------- TINJAU ---------------- */}
        {pages.length > 0 && (
          <section className="bsi-review">
            {/* Daftar halaman */}
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
                {/* Kiri: halaman asli */}
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
  
                {/* Kanan: hasil baca */}
                <div className="bsi-parsed">
                  <div className="bsi-panel-label">
                    Hasil baca — periksa sebelum disetujui
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
  
                  {!selectedPage.error &&
                    selectedPage.questions.length === 0 && (
                      <div className="bsi-empty">
                        Tidak ada soal terbaca di halaman ini. Biasanya
                        terjadi pada halaman sampul, daftar isi, atau
                        kunci jawaban.
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
  
                      <textarea
                        className="bsi-input"
                        rows={3}
                        value={q.question || ''}
                        onChange={(e) =>
                          updateQuestion(selectedPage.pageNumber, q.id, {
                            question: e.target.value,
                          })
                        }
                      />
  
                      {q.qImage && (
                        <div className="bsi-cropwrap">
                          <img
                            src={q.qImage}
                            alt="Gambar soal"
                            className="bsi-crop"
                          />
                          <button
                            type="button"
                            className="bsi-btn ghost sm"
                            onClick={() =>
                              updateQuestion(selectedPage.pageNumber, q.id, {
                                qImage: '',
                              })
                            }
                          >
                            Hapus gambar
                          </button>
                        </div>
                      )}
  
                      <ul className="bsi-options">
                        {(q.options || []).map((opt, oi) => (
                          <li key={oi}>
                            <label className="bsi-radio">
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={q.correct === oi}
                                onChange={() =>
                                  updateQuestion(
                                    selectedPage.pageNumber,
                                    q.id,
                                    { correct: oi },
                                  )
                                }
                              />
                              <span className="bsi-optletter">
                                {String.fromCharCode(65 + oi)}
                              </span>
                            </label>
                            <input
                              className="bsi-input"
                              value={opt}
                              onChange={(e) =>
                                updateOption(
                                  selectedPage.pageNumber,
                                  q.id,
                                  oi,
                                  e.target.value,
                                )
                              }
                            />
                          </li>
                        ))}
                      </ul>
  
                      <details className="bsi-details">
                        <summary>Pembahasan</summary>
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
  
                      {q.readingConfidence === 'low' && (
                        <p className="bsi-flag">
                          Sistem kurang yakin membaca butir ini. Cocokkan
                          dengan halaman aslinya di sebelah kiri.
                        </p>
                      )}
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
  // Ditulis sebagai CSS ber-prefix `bsi-` dan disisipkan lewat <style>
  // agar komponen ini bisa dipasang di aplikasi tanpa bergantung pada
  // framework CSS tertentu, dan tanpa mengubah gaya halaman lain.
  
  const styles = `
  .bsi { --ink:#16202b; --muted:#64748b; --line:#e2e8f0; --bg:#f8fafc;
    --brand:#1d4ed8; --ok:#047857; --warn:#b45309; --danger:#b91c1c;
    color:var(--ink); max-width:1400px; margin:0 auto; padding:24px 20px 96px;
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
  .bsi *{box-sizing:border-box}
  .bsi-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:24px}
  .bsi-eyebrow{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 6px}
  .bsi-title{font-size:24px;font-weight:650;margin:0 0 6px;letter-spacing:-.01em}
  .bsi-sub{margin:0;color:var(--muted);font-size:14px;max-width:60ch;line-height:1.5}
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
  .bsi-card-no{font-size:12.5px;font-weight:650;color:var(--muted);letter-spacing:.03em}
  .bsi-card-actions{display:flex;align-items:center;gap:10px}
  .bsi-check{display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;font-weight:550}
  .bsi-select{padding:6px 8px;border:1px solid var(--line);border-radius:7px;font-size:13px;
    font-family:inherit;color:var(--ink);background:#fff}
  .bsi-input{width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:7px;
    font-size:14px;font-family:inherit;color:var(--ink);line-height:1.5;resize:vertical;background:#fff}
  .bsi-input:focus{outline:2px solid var(--brand);outline-offset:-1px;border-color:var(--brand)}
  .bsi-cropwrap{display:flex;flex-direction:column;gap:6px;align-items:flex-start}
  .bsi-crop{max-width:100%;max-height:220px;border:1px solid var(--line);border-radius:8px;background:#fff}
  .bsi-options{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px}
  .bsi-options li{display:flex;align-items:center;gap:9px}
  .bsi-radio{display:flex;align-items:center;gap:6px;cursor:pointer}
  .bsi-optletter{font-size:13px;font-weight:650;color:var(--muted);width:14px}
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