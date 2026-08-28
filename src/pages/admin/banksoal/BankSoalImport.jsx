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
    const [selectedPageNumbers, setSelectedPageNumbers] = useState([]);
    const [pagePreviewImages, setPagePreviewImages] = useState([]);
    const [showPagePicker, setShowPagePicker] = useState(false);
  
    const [pages, setPages] = useState([]);
    const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  
    const [saving, setSaving] = useState(false);
    const [savedCount, setSavedCount] = useState(0);
  
    const pdfDocRef = useRef(null);
    const abortRef = useRef(false);
    const pauseRef = useRef(false);
  
    // ============================================================
    // MUAT PDF
    // ============================================================
  
    const handleFileChange = useCallback(async (event) => {
      const picked = event.target.files?.[0];
      if (!picked) return;
  
      if (picked.type !== 'application/pdf') {
        setErrorMessage('Berkas harus PDF.');
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
        setSelectedPageNumbers(Array.from({ length: doc.numPages }, (_, i) => i + 1));
        setPagePreviewImages([]);
        setShowPagePicker(true);
        setStatus(STATUS.IDLE);
  
        // Generate preview
        const previews = [];
        for (let pageNumber = 1; pageNumber <= Math.min(doc.numPages, 10); pageNumber += 1) {
          try {
            const pg = await doc.getPage(pageNumber);
            const vp = pg.getViewport({ scale: 0.2 });
            const cv = document.createElement('canvas');
            cv.width = Math.max(1, Math.round(vp.width));
            cv.height = Math.max(1, Math.round(vp.height));
            const cx = cv.getContext('2d', { alpha: false });
            cx.fillStyle = '#ffffff';
            cx.fillRect(0, 0, cv.width, cv.height);
            await pg.render({ canvasContext: cx, viewport: vp }).promise;
            previews.push({ pageNumber, image: cv.toDataURL('image/jpeg', 0.5) });
          } catch (_) {
            previews.push({ pageNumber, image: '' });
          }
          setPagePreviewImages([...previews]);
        }
      } catch (error) {
        setErrorMessage(
          `Berkas tidak bisa dibuka: ${error?.message || 'berkas mungkin rusak.'}`,
        );
        setStatus(STATUS.ERROR);
      }
    }, []);
  
    const togglePageSelection = useCallback((pageNumber) => {
      setSelectedPageNumbers((prev) =>
        prev.includes(pageNumber)
          ? prev.filter((n) => n !== pageNumber)
          : [...prev, pageNumber].sort((a, b) => a - b)
      );
    }, []);
  
    const selectAllPages = useCallback(() => {
      setSelectedPageNumbers(Array.from({ length: totalPages }, (_, i) => i + 1));
    }, [totalPages]);
  
    const clearAllPages = useCallback(() => setSelectedPageNumbers([]), []);
  
    const invertPages = useCallback(() => {
      setSelectedPageNumbers((prev) => {
        const set = new Set(prev);
        return Array.from({ length: totalPages }, (_, i) => i + 1).filter((n) => !set.has(n));
      });
    }, [totalPages]);
  
    // ============================================================
    // PROSES SATU HALAMAN
    // ============================================================
  
    const processOnePage = useCallback(async (pageNumber) => {
      const ref = pdfDocRef.current;
      if (!ref) throw new Error('Dokumen PDF belum siap.');
      const { doc } = ref;
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;
  
      const pageImage = canvas.toDataURL('image/jpeg', 0.84);
  
      try {
        const analysis = await transcribePageWithAI(canvasToDataUrlScaled(canvas, 3200, 0.84));
        let detected = Array.isArray(analysis.questions) ? analysis.questions : [];
  
        // Fallback: coba split 2 kolom
        if (!detected.length && analysis.pageType !== 'pembahasan') {
          const mid = Math.floor(canvas.width / 2);
          const gap = Math.max(8, Math.round(canvas.width * 0.015));
          const leftW = Math.max(1, mid - gap);
          const rightX = Math.min(canvas.width - 1, mid + gap);
          const rightW = Math.max(1, canvas.width - rightX);
  
          const leftCanvas = cropCanvasRegion(canvas, 0, 0, leftW, canvas.height);
          const rightCanvas = cropCanvasRegion(canvas, rightX, 0, rightW, canvas.height);
  
          const [la, ra] = await Promise.all([
            leftCanvas ? transcribePageRegionWithAI(leftCanvas.toDataURL('image/jpeg', 0.84)) : { questions: [] },
            rightCanvas ? transcribePageRegionWithAI(rightCanvas.toDataURL('image/jpeg', 0.84)) : { questions: [] },
          ]);
  
          const mapRegion = (list, ox, rw) => (Array.isArray(list) ? list : []).map((q) => ({
            ...q,
            bbox: q.bbox ? {
              x: (ox + (Number(q.bbox.x) || 0) * rw) / canvas.width,
              y: Number(q.bbox.y) || 0,
              width: ((Number(q.bbox.width) || 0) * rw) / canvas.width,
              height: Number(q.bbox.height) || 0,
            } : null,
            figureBBox: q.figureBBox ? {
              x: (ox + (Number(q.figureBBox.x) || 0) * rw) / canvas.width,
              y: Number(q.figureBBox.y) || 0,
              width: ((Number(q.figureBBox.width) || 0) * rw) / canvas.width,
              height: Number(q.figureBBox.height) || 0,
            } : null,
          }));
  
          detected = [
            ...mapRegion(la.questions || [], 0, leftW),
            ...mapRegion(ra.questions || [], rightX, rightW),
          ];
          detected.sort((a, b) => {
            const ax = Number(a?.bbox?.x) || 0;
            const bx = Number(b?.bbox?.x) || 0;
            return Math.abs(ax - bx) > 0.2 ? ax - bx : (Number(a?.bbox?.y) || 0) - (Number(b?.bbox?.y) || 0);
          });
        }
  
        if (analysis.pageType === 'pembahasan') {
          return { pageImage, questions: [], isPembahasanPage: true };
        }
  
        const questions = [];
        const seen = new Set();
  
        for (const q of detected) {
          if (!q?.bbox) continue;
          const num = Number(q.printedNumber);
          if (!Number.isFinite(num)) continue;
          const key = `${num}-${Math.round((Number(q.bbox.x) || 0) * 1000)}`;
          if (seen.has(key)) continue;
          seen.add(key);
  
          const rawCropImage = cropNormalizedFromCanvas(canvas, q.bbox, 12);
          if (!rawCropImage) continue;
  
          const relFig = relativeFigureBBox(q.bbox, q.figureBBox);
          const qImage = relFig ? (await cropFigureFromQuestionImage(rawCropImage, relFig)) || '' : '';
  
          // Transkripsi teks soal dari crop
          let transcribed = { question: '', options: [], tipeSoal: 'pilihan_ganda', kuantitasP: '', kuantitasQ: '' };
          try {
            transcribed = await transcribeQuestionWithAI(rawCropImage);
          } catch (e) {
            console.warn('Transkripsi gagal untuk soal', num, e.message);
          }
  
          questions.push({
            id: newId(),
            pageNumber,
            printedNumber: num,
            rawCropImage,
            question: transcribed.question || '',
            options: Array.isArray(transcribed.options) && transcribed.options.length
              ? transcribed.options
              : ['', '', '', ''],
            tipeSoal: transcribed.tipeSoal || 'pilihan_ganda',
            kuantitasP: transcribed.kuantitasP || '',
            kuantitasQ: transcribed.kuantitasQ || '',
            optionsAreImages: false,
            optionImages: [],
            qImage,
            tableHtml: '',
            correct: null,
            explanation: '',
            shortAnswerValue: '',
            approved: false,
            readingConfidence: transcribed.readingConfidence || 'high',
            possibleMathNotationIssue: false,
            aiRetryInProgress: false,
            transcribeError: null,
            aiSuggestion: null,
          });
        }
  
        return { pageImage, questions, isPembahasanPage: false };
      } catch (error) {
        console.error('Error processing page:', error);
        return { pageImage, questions: [], error: error.message };
      }
    }, []);
  
    // ============================================================
    // PROSES SEMUA HALAMAN
    // ============================================================
  
    const processPages = useCallback(async () => {
      abortRef.current = false;
      pauseRef.current = false;
      setStatus(STATUS.PROCESSING);
      setErrorMessage('');
  
      const selected = selectedPageNumbers.slice().sort((a, b) => a - b);
      if (!selected.length) {
        setStatus(STATUS.IDLE);
        setErrorMessage('Pilih minimal satu halaman.');
        return;
      }
  
      for (const pageNumber of selected) {
        if (abortRef.current) break;
  
        while (pauseRef.current && !abortRef.current) {
          await new Promise((r) => setTimeout(r, 300));
        }
        if (abortRef.current) break;
  
        setCurrentPage(pageNumber);
  
        try {
          const result = await processOnePage(pageNumber);
          setPages((prev) => [
            ...prev,
            {
              pageNumber,
              pageImage: result.pageImage || '',
              questions: result.questions || [],
              error: result.error || null,
              isPembahasanPage: result.isPembahasanPage || false,
            },
          ]);
        } catch (error) {
          setPages((prev) => [
            ...prev,
            {
              pageNumber,
              pageImage: '',
              questions: [],
              error: error?.message || 'Gagal memproses halaman ini.',
              isPembahasanPage: false,
            },
          ]);
        }
      }
  
      setStatus(abortRef.current ? STATUS.IDLE : STATUS.DONE);
    }, [selectedPageNumbers, processOnePage]);
  
    // ============================================================
    // UPDATE & REMOVE SOAL
    // ============================================================
  
    const updateQuestion = useCallback((pageNumber, questionId, patch) => {
      setPages((prev) =>
        prev.map((p) =>
          p.pageNumber !== pageNumber
            ? p
            : {
                ...p,
                questions: p.questions.map((q) =>
                  q.id === questionId ? { ...q, ...patch } : q
                ),
              }
        )
      );
    }, []);
  
    const removeQuestion = useCallback((pageNumber, questionId) => {
      setPages((prev) =>
        prev.map((p) =>
          p.pageNumber !== pageNumber
            ? p
            : { ...p, questions: p.questions.filter((q) => q.id !== questionId) }
        )
      );
    }, []);
  
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
          const transcript = await transcribeQuestionWithAI(question.rawCropImage);
  
          const figureImage = transcript.hasFigure
            ? (await cropFigureFromQuestionImage(
                question.rawCropImage,
                transcript.figureBBox
              )) || ''
            : '';
  
          updateQuestion(pageNumber, questionId, {
            question: transcript.question,
            options: Array.isArray(transcript.options) && transcript.options.length
              ? transcript.options
              : ['', '', '', ''],
            tipeSoal: transcript.tipeSoal,
            kuantitasP: transcript.kuantitasP || '',
            kuantitasQ: transcript.kuantitasQ || '',
            qImage: figureImage,
            readingConfidence: transcript.readingConfidence,
            aiRetryInProgress: false,
            transcribeError: null,
          });
        } catch (error) {
          updateQuestion(pageNumber, questionId, {
            transcribeError: error?.message || 'AI gagal membaca soal ini.',
            aiRetryInProgress: false,
          });
        }
      },
      [pages, updateQuestion]
    );
  
    const retryPage = useCallback(
      async (pageNumber) => {
        setErrorMessage('');
        try {
          const result = await processOnePage(pageNumber);
          setPages((prev) =>
            prev.map((p) =>
              p.pageNumber === pageNumber
                ? {
                    pageNumber,
                    pageImage: result.pageImage || '',
                    questions: result.questions || [],
                    error: result.error || null,
                    isPembahasanPage: result.isPembahasanPage || false,
                  }
                : p
            )
          );
        } catch (error) {
          setPages((prev) =>
            prev.map((p) =>
              p.pageNumber === pageNumber
                ? { ...p, error: error?.message || 'Masih gagal.' }
                : p
            )
          );
        }
      },
      [processOnePage]
    );
  
    // ============================================================
    // SIMPAN
    // ============================================================
  
    const allQuestions = useMemo(() => pages.flatMap((p) => p.questions), [pages]);
    const approvedQuestions = useMemo(() => allQuestions.filter((q) => q.approved), [allQuestions]);
    const selectedPage = pages[selectedPageIndex] || null;
  
    useEffect(() => {
      if (status === STATUS.PROCESSING && pages.length > 0) {
        setSelectedPageIndex(pages.length - 1);
      }
    }, [pages.length, status]);
  
    const handleSave = useCallback(async () => {
      if (approvedQuestions.length === 0) return;
  
      setSaving(true);
      setErrorMessage('');
  
      try {
        const payload = approvedQuestions.map((q) => ({
          type: q.tipeSoal === 'isian_singkat' ? 'shortanswer' : 'multiple',
          tipeSoal: q.tipeSoal,
          question: q.question?.trim() || (q.printedNumber ? `Soal ${q.printedNumber}` : 'Soal (lihat gambar)'),
          qImage: q.qImage || '',
          options: q.optionsAreImages ? [] : q.options.filter((o) => o.trim().length > 0),
          optionImages: q.optionsAreImages ? q.optionImages : [],
          optionsAreImages: Boolean(q.optionsAreImages),
          kuantitasP: q.tipeSoal === 'hubungan_kuantitas' ? q.kuantitasP || '' : '',
          kuantitasQ: q.tipeSoal === 'hubungan_kuantitas' ? q.kuantitasQ || '' : '',
          shortAnswer: q.tipeSoal === 'isian_singkat' ? q.shortAnswerValue || '' : '',
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
          }))
        );
      } catch (error) {
        setErrorMessage(`Gagal menyimpan: ${error?.message || 'coba lagi sebentar.'}`);
      } finally {
        setSaving(false);
      }
    }, [approvedQuestions, folderId, folderName, file, onSaveQuestions]);
  
    const isBusy = status === STATUS.PROCESSING || status === STATUS.LOADING_PDF;
  
    // ============================================================
    // RENDER
    // ============================================================
  
    return (
      <div className="bsi">
        <style>{styles}</style>
  
        <header className="bsi-head">
          <div>
            <p className="bsi-eyebrow">{folderName}</p>
            <h1 className="bsi-title">Tambah soal dari PDF</h1>
            <p className="bsi-sub">
              AI membaca setiap halaman soal sekaligus dan mengekstrak semua
              butir pada halaman tersebut. Teks, matematika, tabel, grafik,
              dan gambar tetap dipertahankan, lalu hasilnya bisa diedit
              admin sebelum disetujui.
            </p>
          </div>
          {onCancel && (
            <button type="button" className="bsi-btn ghost" onClick={onCancel}>
              Tutup
            </button>
          )}
        </header>
  
        {/* UNGGAH */}
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
              PDF teks maupun scan dapat digunakan. Setelah upload, pilih manual halaman yang akan diproses agar cover/pembahasan tidak ikut memakan quota AI.
            </span>
          </label>
        )}
  
        {/* KENDALI */}
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
                <span className="bsi-selection-summary">
                  <strong>{selectedPageNumbers.length}</strong> dipilih ·{' '}
                  <strong>{Math.max(0, totalPages - selectedPageNumbers.length)}</strong> dikecualikan
                </span>
                <button
                  type="button"
                  className="bsi-btn"
                  onClick={() => setShowPagePicker((v) => !v)}
                >
                  {showPagePicker ? 'Tutup pilihan halaman' : 'Pilih / kecualikan halaman'}
                </button>
                <button
                  type="button"
                  className="bsi-btn primary"
                  onClick={processPages}
                  disabled={isBusy || selectedPageNumbers.length === 0}
                >
                  {pages.length > 0 ? 'Baca lagi halaman terpilih' : 'Mulai baca halaman terpilih'}
                </button>
              </div>
            )}
  
            {status === STATUS.PROCESSING && (
              <div className="bsi-progress">
                <div className="bsi-bar">
                  <div
                    className="bsi-bar-fill"
                    style={{
                      width: `${
                        (Math.max(1, selectedPageNumbers.indexOf(currentPage) + 1) /
                          Math.max(1, selectedPageNumbers.length)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="bsi-progress-row">
                  <span>
                    Memproses halaman {currentPage} · {selectedPageNumbers.length} halaman dipilih
                  </span>
                  <div className="bsi-progress-actions">
                    <button
                      type="button"
                      className="bsi-btn ghost sm"
                      onClick={() => {
                        pauseRef.current = !pauseRef.current;
                        setStatus(pauseRef.current ? STATUS.PAUSED : STATUS.PROCESSING);
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
  
        {showPagePicker && totalPages > 0 && (
          <section className="bsi-page-picker-panel">
            <div className="bsi-page-picker-head">
              <div>
                <h3 className="bsi-page-picker-title">Pilih halaman yang diproses AI</h3>
                <p className="bsi-page-picker-sub">
                  Centang halaman soal. Hilangkan centang untuk cover, kisi-kisi, pembahasan, iklan, atau halaman lain yang tidak dipakai.
                </p>
              </div>
              <div className="bsi-page-picker-actions">
                <button type="button" className="bsi-btn ghost sm" onClick={selectAllPages}>
                  Pilih semua
                </button>
                <button type="button" className="bsi-btn ghost sm" onClick={clearAllPages}>
                  Hapus semua
                </button>
                <button type="button" className="bsi-btn ghost sm" onClick={invertPages}>
                  Balik pilihan
                </button>
              </div>
            </div>
            <div className="bsi-page-picker-grid">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                const selected = selectedPageNumbers.includes(pageNumber);
                const preview = pagePreviewImages.find((p) => p.pageNumber === pageNumber)?.image || '';
                return (
                  <button
                    type="button"
                    key={pageNumber}
                    className={`bsi-page-select-card${selected ? ' selected' : ' excluded'}`}
                    onClick={() => togglePageSelection(pageNumber)}
                    aria-pressed={selected}
                  >
                    <span className="bsi-page-select-thumb">
                      {preview ? (
                        <img src={preview} alt={`Halaman ${pageNumber}`} />
                      ) : (
                        <span className="bsi-page-thumb-loading">Memuat…</span>
                      )}
                      <span className="bsi-page-select-check">{selected ? '✓' : '×'}</span>
                    </span>
                    <span className="bsi-page-select-label">Halaman {pageNumber}</span>
                    <span className="bsi-page-select-status">
                      {selected ? 'Diproses AI' : 'Dikecualikan'}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
  
        {errorMessage && <div className="bsi-alert">{errorMessage}</div>}
  
        {savedCount > 0 && (
          <div className="bsi-alert ok">{savedCount} soal tersimpan ke {folderName}.</div>
        )}
  
        {/* TINJAU */}
        {pages.length > 0 && (
          <section className="bsi-review">
            <nav className="bsi-pagelist" aria-label="Daftar halaman">
              {pages.map((p, i) => (
                <button
                  type="button"
                  key={p.pageNumber}
                  className={`bsi-pagechip${i === selectedPageIndex ? ' active' : ''}${p.error ? ' failed' : ''}`}
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
                  <div className="bsi-panel-label">Halaman asli {selectedPage.pageNumber}</div>
                  {selectedPage.pageImage ? (
                    <img src={selectedPage.pageImage} alt={`Halaman ${selectedPage.pageNumber}`} />
                  ) : (
                    <div className="bsi-empty">
                      Halaman ini gagal dirender.
                      <button type="button" className="bsi-btn ghost sm" onClick={() => retryPage(selectedPage.pageNumber)}>
                        Ulangi
                      </button>
                    </div>
                  )}
                </div>
  
                <div className="bsi-parsed">
                  <div className="bsi-panel-label">Soal hasil AI — periksa transkripsi sebelum disetujui</div>
  
                  {selectedPage.error && (
                    <div className="bsi-empty">
                      {selectedPage.error}
                      <button type="button" className="bsi-btn ghost sm" onClick={() => retryPage(selectedPage.pageNumber)}>
                        Ulangi halaman ini
                      </button>
                    </div>
                  )}
  
                  {!selectedPage.error && selectedPage.isPembahasanPage && (
                    <div className="bsi-empty pembahasan">
                      ✅ Halaman ini terdeteksi sebagai bagian <strong>PEMBAHASAN</strong> (kunci
                      jawaban) -- SENGAJA dilewati, bukan soal baru.
                    </div>
                  )}
  
                  {!selectedPage.error && !selectedPage.isPembahasanPage && selectedPage.questions.length === 0 && (
                    <div className="bsi-empty">
                      AI tidak menemukan butir soal pada halaman ini.
                      Bisa jadi halaman ini memang sampul/kisi-kisi/pembahasan,
                      atau AI belum berhasil menentukan batas soalnya.
                      Tekan "Ulangi" untuk meminta AI membaca halaman ini lagi.
                    </div>
                  )}
  
                  {selectedPage.questions.map((q, qi) => (
                    <article key={q.id} className={`bsi-card${q.approved ? ' approved' : ''}`}>
                      <div className="bsi-card-head">
                        <span className="bsi-card-no">
                          Soal {qi + 1}
                          {q.printedNumber ? ` (tercetak no. ${q.printedNumber})` : ''}
                        </span>
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
                            onClick={() => retryQuestionWithAI(selectedPage.pageNumber, q.id)}
                            disabled={q.aiRetryInProgress}
                          >
                            {q.aiRetryInProgress ? 'Membaca…' : 'AI baca ulang'}
                          </button>
                          <button
                            type="button"
                            className="bsi-btn ghost sm"
                            onClick={() => removeQuestion(selectedPage.pageNumber, q.id)}
                          >
                            Buang
                          </button>
                        </div>
                      </div>
  
                      <div className="bsi-transcript-row">
                        {q.rawCropImage && (
                          <img src={q.rawCropImage} alt="Crop asli" className="bsi-rawcrop" />
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
                              <img src={q.qImage} alt="Diagram soal" className="bsi-figure-img" />
                            </div>
                          )}
  
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
  
                          {q.transcribeError && (
                            <p className="bsi-flag">Percobaan "Baca ulang (AI)" gagal -- ({q.transcribeError}).</p>
                          )}
  
                          {!q.transcribeError && q.readingConfidence === 'low' && (
                            <p className="bsi-flag">
                              AI kurang yakin membaca sebagian teks ini -- cocokkan dengan crop asli di sebelah kiri.
                            </p>
                          )}
  
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
                          ) : (
                            <ul className="bsi-option-list">
                              {q.options.map((opt, oi) => (
                                <li key={oi}>
                                  <button
                                    type="button"
                                    className={`bsi-letter-btn${q.correct === oi ? ' selected' : ''}`}
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
                            Jawaban benar & pembahasan opsional diisi sekarang -- kalau dikosongkan, akan dibuatkan otomatis nanti.
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
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
  
        {/* SIMPAN */}
        {allQuestions.length > 0 && (
          <footer className="bsi-foot">
            <span className="bsi-footinfo">
              {approvedQuestions.length} dari {allQuestions.length} soal disetujui
            </span>
            <button
              type="button"
              className="bsi-btn primary"
              onClick={handleSave}
              disabled={approvedQuestions.length === 0 || saving}
            >
              {saving ? 'Menyimpan…' : `Simpan ${approvedQuestions.length} soal ke ${folderName}`}
            </button>
          </footer>
        )}
      </div>
    );
  }
  
  // ============================================================
  // STYLES
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
    .bsi-range{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px}
    .bsi-selection-summary{font-size:13px;color:var(--muted)}
    .bsi-note{margin:12px 0 0;font-size:13px;color:var(--warn);line-height:1.5}
    .bsi-progress{margin-top:14px}
    .bsi-bar{height:6px;background:var(--line);border-radius:99px;overflow:hidden}
    .bsi-bar-fill{height:100%;background:var(--brand);transition:width .3s ease}
    .bsi-progress-row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:8px;font-size:13px;color:var(--muted);flex-wrap:wrap}
    .bsi-progress-actions{display:flex;gap:8px}
    .bsi-btn{border:1px solid var(--line);background:#fff;color:var(--ink);padding:9px 15px;
      border-radius:8px;font-size:14px;font-weight:550;cursor:pointer;font-family:inherit}
    .bsi-btn:hover:not(:disabled){border-color:var(--ink)}
    .bsi-btn:disabled{opacity:.45;cursor:not-allowed}
    .bsi-btn.primary{background:var(--brand);border-color:var(--brand);color:#fff}
    .bsi-btn.primary:hover:not(:disabled){background:#1a43b8}
    .bsi-btn.sm{padding:5px 10px;font-size:12.5px}
    .bsi-btn.ghost{border-color:transparent;background:transparent}
    .bsi-btn.ghost:hover{border-color:var(--line);background:var(--bg)}
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
    .bsi-empty.pembahasan{border-color:#a7f3d0;background:#f0fdf4;color:#166534;border-style:solid}
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
    .bsi-flag{margin:0;font-size:12.5px;color:var(--warn);line-height:1.5}
    .bsi-input{width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:7px;
      font-size:14px;font-family:inherit;color:var(--ink);line-height:1.5;resize:vertical;background:#fff}
    .bsi-input:focus{outline:2px solid var(--brand);outline-offset:-1px;border-color:var(--brand)}
    .bsi-letter-btn{width:34px;height:34px;border-radius:7px;border:1px solid var(--line);background:#fff;
      font-weight:700;font-size:13px;color:var(--muted);cursor:pointer;font-family:inherit}
    .bsi-letter-btn.selected{border-color:var(--ok);background:#ecfdf5;color:var(--ok)}
    .bsi-details summary{font-size:13px;color:var(--muted);cursor:pointer;padding:2px 0}
    .bsi-details[open] summary{margin-bottom:7px}
    .bsi-page-picker-panel{border:1px solid var(--line);border-radius:12px;padding:16px;margin:0 0 16px;background:#fff}
    .bsi-page-picker-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap}
    .bsi-page-picker-title{margin:0 0 4px;font-size:16px;font-weight:650}
    .bsi-page-picker-sub{margin:0;color:var(--muted);font-size:12.5px;line-height:1.5;max-width:80ch}
    .bsi-page-picker-actions{display:flex;gap:7px;flex-wrap:wrap}
    .bsi-page-picker-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:10px;max-height:58vh;overflow:auto;margin-top:12px;padding:2px}
    .bsi-page-select-card{border:1px solid var(--line);border-radius:10px;padding:7px;background:#fff;text-align:left;cursor:pointer;font-family:inherit}
    .bsi-page-select-card.selected{border-color:var(--brand);background:#eff6ff}
    .bsi-page-select-card.excluded{opacity:.58;background:#f8fafc}
    .bsi-page-select-card:hover{border-color:var(--brand);opacity:1}
    .bsi-page-select-thumb{position:relative;display:block;aspect-ratio:.71;border:1px solid var(--line);border-radius:7px;overflow:hidden;background:#fff}
    .bsi-page-select-thumb img{width:100%;height:100%;display:block;object-fit:contain}
    .bsi-page-thumb-loading{display:flex;height:100%;align-items:center;justify-content:center;font-size:10px;color:var(--muted)}
    .bsi-page-select-check{position:absolute;right:5px;top:5px;width:21px;height:21px;border-radius:99px;border:1px solid var(--line);background:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800}
    .bsi-page-select-card.selected .bsi-page-select-check{background:var(--brand);border-color:var(--brand);color:#fff}
    .bsi-page-select-label{display:block;margin-top:6px;font-size:11.5px;font-weight:650}
    .bsi-page-select-status{display:block;margin-top:2px;font-size:10px;color:var(--muted)}
    .bsi-foot{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid var(--line);
      padding:12px 20px;display:flex;justify-content:flex-end;align-items:center;gap:16px;z-index:20}
    .bsi-footinfo{font-size:13.5px;color:var(--muted)}
    @media (max-width:900px){
      .bsi-compare{grid-template-columns:1fr}
      .bsi-original{position:static}
      .bsi-original img{max-height:60vh;object-fit:contain}
    }
  `;