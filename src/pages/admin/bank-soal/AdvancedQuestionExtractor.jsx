import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
} from 'react';

import {
  UploadCloud,
  FileText,
  Play,
  Download,
  CheckCircle,
  Loader2,
  FileJson,
  FileSpreadsheet,
  Trash2,
  Edit3,
  Save,
  Image as ImageIcon,
  Layers,
  CheckSquare,
  Square,
  RefreshCw,
  Sparkles,
  Crop,
  X,
  Check,
  Plus,
  Settings,
  Code,
  AlertTriangle,
  Filter,
  ArrowRight,
  Link2,
  HelpCircle,
  KeyRound,
  Eye,
  ChevronLeft,
  ChevronRight,
  ScanSearch,
  Database,
  Search,
} from 'lucide-react';

/* ============================================================
   UTILITIES
============================================================ */

const toStr = (v) => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') {
    return String(v);
  }

  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

const toStrArray = (v) => {
  if (Array.isArray(v)) {
    return v
      .map(toStr)
      .filter((s) => s.length > 0);
  }

  if (v == null || v === '') {
    return [];
  }

  return [toStr(v)];
};

const VALID_TYPES = [
  'pg_sederhana',
  'pg_kompleks',
  'benar_salah',
  'isian_singkat',
  'menjodohkan',
];

/* ============================================================
   NORMALIZER
============================================================ */

const normalizeQuestion = (raw, fallbackNomor) => {
  const q =
    raw &&
    typeof raw === 'object' &&
    !Array.isArray(raw)
      ? raw
      : {};

  const nomorParsed =
    typeof q.nomor === 'number' &&
    Number.isFinite(q.nomor)
      ? q.nomor
      : parseInt(q.nomor, 10);

  const pasanganRaw =
    Array.isArray(q.pasangan)
      ? q.pasangan
      : [];

  const pasanganClean =
    pasanganRaw
      .filter((p) => p && typeof p === 'object')
      .map((p) => ({
        kiri: toStr(p.kiri),
        kanan: toStr(p.kanan),
      }))
      .filter(
        (p) =>
          p.kiri.length > 0 ||
          p.kanan.length > 0
      );

  const gambarClean =
    Array.isArray(q.gambar)
      ? q.gambar
          .filter(
            (g) =>
              g &&
              typeof g === 'object'
          )
          .map((g, idx) => ({
            id:
              toStr(g.id) ||
              `GAMBAR_${idx + 1}`,

            deskripsi:
              toStr(g.deskripsi),

            dataUrl:
              typeof g.dataUrl === 'string'
                ? g.dataUrl
                : null,

            sourcePage:
              g.sourcePage ?? null,

            metode:
              toStr(g.metode),

            // koordinat jika tersedia
            x0:
              Number.isFinite(g.x0)
                ? g.x0
                : null,

            y0:
              Number.isFinite(g.y0)
                ? g.y0
                : null,

            x1:
              Number.isFinite(g.x1)
                ? g.x1
                : null,

            y1:
              Number.isFinite(g.y1)
                ? g.y1
                : null,
          }))
      : [];

  return {
    nomor:
      Number.isFinite(nomorParsed)
        ? nomorParsed
        : fallbackNomor,

    tipe:
      VALID_TYPES.includes(q.tipe)
        ? q.tipe
        : 'pg_sederhana',

    teks_soal:
      toStr(q.teks_soal),

    pernyataan:
      toStrArray(q.pernyataan),

    opsi_jawaban:
      toStrArray(q.opsi_jawaban),

    tabel_benar_salah:
      toStrArray(q.tabel_benar_salah),

    pasangan:
      pasanganClean,

    kunci_jawaban:
      toStr(q.kunci_jawaban),

    gambar:
      gambarClean,

    sumber_kunci:
      toStr(q.sumber_kunci),

    kunci_terverifikasi:
      Boolean(q.kunci_terverifikasi),

    halaman_kunci:
      Array.isArray(q.halaman_kunci)
        ? q.halaman_kunci
        : [],
  };
};

/* ============================================================
   ERROR BOUNDARY
============================================================ */

class QuestionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error) {
    console.error(
      'Gagal merender kartu soal:',
      error
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-300 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />

          <div>
            <p className="font-semibold mb-1">
              Satu butir soal gagal ditampilkan.
            </p>

            <p className="text-red-300/80 text-xs">
              Kemungkinan hasil AI tidak lengkap.
              Soal lain tetap aman.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/* ============================================================
   GEMINI CONFIG
============================================================ */

const GEMINI_MODELS = [
  {
    id: 'gemini-3.6-flash',
    label: 'Gemini 3.6 Flash',
    role: 'utama',
  },

  {
    id: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash-Lite',
    role: 'fallback',
  },
];

/* ============================================================
   QUESTION SCHEMA
============================================================ */

const GEMINI_RESPONSE_SCHEMA = {
  type: 'ARRAY',

  items: {
    type: 'OBJECT',

    properties: {
      nomor: {
        type: 'INTEGER',
      },

      tipe: {
        type: 'STRING',

        enum: [
          'pg_sederhana',
          'pg_kompleks',
          'benar_salah',
          'isian_singkat',
          'menjodohkan',
        ],
      },

      teks_soal: {
        type: 'STRING',
      },

      pernyataan: {
        type: 'ARRAY',
        items: {
          type: 'STRING',
        },
      },

      opsi_jawaban: {
        type: 'ARRAY',
        items: {
          type: 'STRING',
        },
      },

      tabel_benar_salah: {
        type: 'ARRAY',
        items: {
          type: 'STRING',
        },
      },

      pasangan: {
        type: 'ARRAY',

        items: {
          type: 'OBJECT',

          properties: {
            kiri: {
              type: 'STRING',
            },

            kanan: {
              type: 'STRING',
            },
          },

          required: [
            'kiri',
            'kanan',
          ],
        },
      },

      kunci_jawaban: {
        type: 'STRING',
      },

      gambar: {
        type: 'ARRAY',

        items: {
          type: 'OBJECT',

          properties: {
            id: {
              type: 'STRING',
            },

            deskripsi: {
              type: 'STRING',
            },
          },

          required: [
            'id',
            'deskripsi',
          ],
        },
      },
    },

    required: [
      'nomor',
      'tipe',
      'teks_soal',
      'pernyataan',
      'opsi_jawaban',
      'tabel_benar_salah',
      'pasangan',
      'kunci_jawaban',
      'gambar',
    ],
  },
};

/* ============================================================
   ANSWER KEY SCHEMA
============================================================ */

const ANSWER_KEY_SCHEMA = {
  type: 'ARRAY',

  items: {
    type: 'OBJECT',

    properties: {
      nomor: {
        type: 'INTEGER',
      },

      kunci_jawaban: {
        type: 'STRING',
      },
    },

    required: [
      'nomor',
      'kunci_jawaban',
    ],
  },
};

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function AdvancedQuestionExtractor() {
  const [isPdfReady, setIsPdfReady] =
    useState(false);

  const [isMathReady, setIsMathReady] =
    useState(false);

  const [file, setFile] =
    useState(null);

  const [appState, setAppState] =
    useState('idle');

  const [logs, setLogs] =
    useState([]);

  const [progress, setProgress] =
    useState({
      current: 0,
      total: 0,
    });

  const [extractedData, setExtractedData] =
    useState([]);

  const [editingId, setEditingId] =
    useState(null);

  const [editForm, setEditForm] =
    useState({});

  const [typeFilter, setTypeFilter] =
    useState('semua');

  const [settings] =
    useState({
      resolution: 2.8,
      delayBetweenPages: 1800,
      answerKeyDelay: 1000,
    });

  const [pdfDocument, setPdfDocument] =
    useState(null);

  const [totalPages, setTotalPages] =
    useState(0);

  const [selectedPages, setSelectedPages] =
    useState([]);

  const [coverThumbnail, setCoverThumbnail] =
    useState(null);

  const [pagePreviews, setPagePreviews] =
    useState({});

  const [previewPage, setPreviewPage] =
    useState(null);

  const [activeTab, setActiveTab] =
    useState('questions');

  const [manualCrop, setManualCrop] =
    useState(null);

  const [geminiApiKey, setGeminiApiKey] =
    useState(() => {
      try {
        return (
          localStorage.getItem(
            'aqe_gemini_api_key'
          ) || ''
        );
      } catch {
        return '';
      }
    });

  const [
    showApiSettings,
    setShowApiSettings,
  ] = useState(false);

  const [
    answerKeyPages,
    setAnswerKeyPages,
  ] = useState([]);

  const [
    answerKeyMap,
    setAnswerKeyMap,
  ] = useState({});

  const [
    scanningAnswerKey,
    setScanningAnswerKey,
  ] = useState(false);

  const logsEndRef =
    useRef(null);

  /* ============================================================
     PDF.JS
  ============================================================ */

  useEffect(() => {
    const script =
      document.createElement('script');

    script.src =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';

    script.async = true;

    script.onload = () => {
      if (
        window.pdfjsLib &&
        window.pdfjsLib.GlobalWorkerOptions
      ) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }

      setIsPdfReady(true);

      addLog(
        'Mesin PDF.js siap.',
        'success'
      );
    };

    script.onerror = () => {
      addLog(
        'Gagal memuat PDF.js.',
        'error'
      );
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(
          script
        );
      }
    };
  }, []);

  /* ============================================================
     KATEX
  ============================================================ */

  useEffect(() => {
    const css =
      document.createElement('link');

    css.rel = 'stylesheet';

    css.href =
      'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';

    document.head.appendChild(css);

    const coreScript =
      document.createElement('script');

    coreScript.src =
      'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';

    coreScript.async = true;

    coreScript.onload = () => {
      const autoRender =
        document.createElement('script');

      autoRender.src =
        'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js';

      autoRender.async = true;

      autoRender.onload = () => {
        setIsMathReady(true);

        addLog(
          'KaTeX siap.',
          'success'
        );
      };

      autoRender.onerror = () => {
        addLog(
          'Gagal memuat auto-render KaTeX.',
          'error'
        );
      };

      document.body.appendChild(
        autoRender
      );
    };

    coreScript.onerror = () => {
      addLog(
        'Gagal memuat KaTeX.',
        'error'
      );
    };

    document.body.appendChild(
      coreScript
    );

    return () => {
      if (css.parentNode) {
        css.parentNode.removeChild(css);
      }

      if (
        coreScript.parentNode
      ) {
        coreScript.parentNode.removeChild(
          coreScript
        );
      }
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [logs]);

  /* ============================================================
     LOG
  ============================================================ */

  const addLog = (
    message,
    type = 'info'
  ) => {
    const timestamp =
      new Date().toLocaleTimeString(
        'id-ID',
        {
          hour12: false,
        }
      );

    setLogs((prev) => [
      ...prev,
      {
        id:
          Date.now() +
          Math.random(),

        time: timestamp,

        message,

        type,
      },
    ]);
  };

  const sleep = (ms) =>
    new Promise((resolve) =>
      setTimeout(resolve, ms)
    );

  /* ============================================================
     API KEY
  ============================================================ */

  const saveGeminiApiKey = (
    value
  ) => {
    const clean =
      String(value || '').trim();

    setGeminiApiKey(clean);

    try {
      if (clean) {
        localStorage.setItem(
          'aqe_gemini_api_key',
          clean
        );
      } else {
        localStorage.removeItem(
          'aqe_gemini_api_key'
        );
      }
    } catch {
      // ignore
    }
  };

  /* ============================================================
     LOAD PDF
  ============================================================ */

  const processUploadedFile = async (
    selectedFile
  ) => {
    if (!isPdfReady) {
      addLog(
        'PDF.js belum siap.',
        'warning'
      );

      return;
    }

    if (
      !selectedFile ||
      selectedFile.type !==
        'application/pdf'
    ) {
      addLog(
        'File harus PDF.',
        'error'
      );

      return;
    }

    setFile(selectedFile);

    setExtractedData([]);

    setAnswerKeyMap({});

    setAnswerKeyPages([]);

    setPagePreviews({});

    setLogs([]);

    addLog(
      `File: ${selectedFile.name}`,
      'success'
    );

    setAppState('preview');

    try {
      const arrayBuffer =
        await selectedFile.arrayBuffer();

      const pdf =
        await window.pdfjsLib.getDocument({
          data: arrayBuffer,
        }).promise;

      setPdfDocument(pdf);

      const total =
        pdf.numPages;

      setTotalPages(total);

      const pages =
        Array.from(
          {
            length: total,
          },
          (_, i) => i + 1
        );

      setSelectedPages(pages);

      // cover
      const page1 =
        await pdf.getPage(1);

      const coverCanvas =
        await renderPageToCanvas(
          page1,
          0.55
        );

      setCoverThumbnail(
        coverCanvas.toDataURL(
          'image/jpeg',
          0.88
        )
      );

      addLog(
        `PDF dimuat. ${total} halaman.`,
        'success'
      );

      // Generate preview thumbnails
      addLog(
        'Menyiapkan preview halaman...',
        'info'
      );

      const previewMap = {};

      // batasi preview awal supaya browser tidak berat
      const maxPreview =
        Math.min(total, 60);

      for (
        let pageNum = 1;
        pageNum <= maxPreview;
        pageNum++
      ) {
        try {
          const p =
            await pdf.getPage(pageNum);

          const canvas =
            await renderPageToCanvas(
              p,
              0.32
            );

          previewMap[pageNum] =
            canvas.toDataURL(
              'image/jpeg',
              0.8
            );
        } catch {
          // skip preview yang gagal
        }
      }

      setPagePreviews(
        previewMap
      );

      addLog(
        `Preview ${Object.keys(previewMap).length} halaman siap.`,
        'success'
      );
    } catch (error) {
      addLog(
        `Gagal memuat PDF: ${error.message}`,
        'error'
      );

      setAppState('error');
    }
  };

  const handleFileUpload = (
    e
  ) => {
    const selectedFile =
      e.target.files?.[0];

    processUploadedFile(
      selectedFile
    );
  };

  const handleDragOver = (
    e
  ) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (
    e
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile =
      e.dataTransfer.files?.[0];

    processUploadedFile(
      droppedFile
    );
  };

  /* ============================================================
     RENDER PAGE
  ============================================================ */

  const renderPageToCanvas = async (
    page,
    scale = 2
  ) => {
    const viewport =
      page.getViewport({
        scale,
      });

    const canvas =
      document.createElement(
        'canvas'
      );

    const context =
      canvas.getContext('2d');

    canvas.width =
      Math.ceil(
        viewport.width
      );

    canvas.height =
      Math.ceil(
        viewport.height
      );

    context.fillStyle =
      '#ffffff';

    context.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    return canvas;
  };

  /* ============================================================
     PAGE PREVIEW
  ============================================================ */

  const togglePage = (
    pageNum
  ) => {
    setSelectedPages(
      (prev) =>
        prev.includes(pageNum)
          ? prev.filter(
              (p) =>
                p !== pageNum
            )
          : [
              ...prev,
              pageNum,
            ].sort(
              (a, b) =>
                a - b
            )
    );
  };

  /* ============================================================
     DIAGRAM / VISUAL DETECTION
  ============================================================ */

  const detectDiagramRegions =
    async (page) => {
      try {
        const opList =
          await page.getOperatorList();

        const OPS =
          window.pdfjsLib
            .OPS;

        const base =
          page.getViewport({
            scale: 1,
          });

        const W =
          base.width;

        const H =
          base.height;

        const boxes = [];

        let ctm =
          base.transform.slice();

        const stack = [];

        let cur = null;

        const mul = (
          m,
          n
        ) => [
          m[0] * n[0] +
            m[2] * n[1],

          m[1] * n[0] +
            m[3] * n[1],

          m[0] * n[2] +
            m[2] * n[3],

          m[1] * n[2] +
            m[3] * n[3],

          m[0] * n[4] +
            m[2] * n[5] +
            m[4],

          m[1] * n[4] +
            m[3] * n[5] +
            m[5],
        ];

        const apply = (
          m,
          x,
          y
        ) => [
          m[0] * x +
            m[2] * y +
            m[4],

          m[1] * x +
            m[3] * y +
            m[5],
        ];

        const startBox =
          () => {
            cur = {
              x0: Infinity,
              y0: Infinity,
              x1: -Infinity,
              y1: -Infinity,
              pts: 0,
            };
          };

        const addPt = (
          x,
          y
        ) => {
          if (!cur) {
            return;
          }

          const [
            dx,
            dy,
          ] = apply(
            ctm,
            x,
            y
          );

          cur.x0 =
            Math.min(
              cur.x0,
              dx
            );

          cur.y0 =
            Math.min(
              cur.y0,
              dy
            );

          cur.x1 =
            Math.max(
              cur.x1,
              dx
            );

          cur.y1 =
            Math.max(
              cur.y1,
              dy
            );

          cur.pts++;
        };

        const endBox =
          () => {
            if (
              cur &&
              cur.pts > 0 &&
              cur.x1 >
                cur.x0 &&
              cur.y1 >
                cur.y0
            ) {
              boxes.push(cur);
            }

            cur = null;
          };

        const args =
          opList.argsArray;

        for (
          let i = 0;
          i <
          opList.fnArray
            .length;
          i++
        ) {
          const fn =
            opList.fnArray[i];

          const a =
            args[i];

          if (
            fn === OPS.save
          ) {
            stack.push(
              ctm.slice()
            );
          } else if (
            fn === OPS.restore
          ) {
            ctm =
              stack.pop() ||
              ctm;
          } else if (
            fn === OPS.transform
          ) {
            ctm =
              mul(
                ctm,
                a
              );
          } else if (
            fn ===
              OPS.constructPath
          ) {
            startBox();

            const ops =
              a[0];

            const coords =
              a[1];

            let p = 0;

            for (
              let k = 0;
              k <
              ops.length;
              k++
            ) {
              const op =
                ops[k];

              if (
                op ===
                  OPS.moveTo ||
                op ===
                  OPS.lineTo
              ) {
                addPt(
                  coords[p],
                  coords[p + 1]
                );

                p += 2;
              } else if (
                op ===
                OPS.curveTo
              ) {
                addPt(
                  coords[p],
                  coords[p + 1]
                );

                addPt(
                  coords[p + 2],
                  coords[p + 3]
                );

                addPt(
                  coords[p + 4],
                  coords[p + 5]
                );

                p += 6;
              } else if (
                op ===
                  OPS.curveTo2 ||
                op ===
                  OPS.curveTo3
              ) {
                addPt(
                  coords[p],
                  coords[p + 1]
                );

                addPt(
                  coords[p + 2],
                  coords[p + 3]
                );

                p += 4;
              } else if (
                op ===
                  OPS.rectangle
              ) {
                addPt(
                  coords[p],
                  coords[p + 1]
                );

                addPt(
                  coords[p] +
                    coords[p + 2],

                  coords[p + 1] +
                    coords[p + 3]
                );

                p += 4;
              }
            }

            endBox();
          }
        }

        const EXPAND = 5;

        let rects =
          boxes
            .filter(
              (b) => {
                const w =
                  b.x1 -
                  b.x0;

                const h =
                  b.y1 -
                  b.y0;

                if (
                  w >
                    0.92 *
                      W &&
                  h < 4
                ) {
                  return false;
                }

                if (
                  b.y1 <
                  0.02 * H
                ) {
                  return false;
                }

                if (
                  b.y0 >
                  0.98 * H
                ) {
                  return false;
                }

                if (
                  w * h <
                  8
                ) {
                  return false;
                }

                return true;
              }
            )
            .map(
              (b) => [
                Math.max(
                  0,
                  b.x0 -
                    EXPAND
                ),

                Math.max(
                  0,
                  b.y0 -
                    EXPAND
                ),

                Math.min(
                  W,
                  b.x1 +
                    EXPAND
                ),

                Math.min(
                  H,
                  b.y1 +
                    EXPAND
                ),
              ]
            );

        let changed =
          true;

        while (
          changed
        ) {
          changed =
            false;

          const out =
            [];

          while (
            rects.length
          ) {
            let a =
              rects.pop();

            let merged =
              true;

            while (
              merged
            ) {
              merged =
                false;

              const keep =
                [];

              for (
                const b of rects
              ) {
                const overlap =
                  a[0] <=
                    b[2] &&
                  a[2] >=
                    b[0] &&
                  a[1] <=
                    b[3] &&
                  a[3] >=
                    b[1];

                if (
                  overlap
                ) {
                  a = [
                    Math.min(
                      a[0],
                      b[0]
                    ),

                    Math.min(
                      a[1],
                      b[1]
                    ),

                    Math.max(
                      a[2],
                      b[2]
                    ),

                    Math.max(
                      a[3],
                      b[3]
                    ),
                  ];

                  merged =
                    true;

                  changed =
                    true;
                } else {
                  keep.push(
                    b
                  );
                }
              }

              rects =
                keep;
            }

            out.push(
              a
            );
          }

          rects =
            out;
        }

        const regions =
          rects
            .filter(
              (r) =>
                r[2] -
                  r[0] >
                  25 &&
                r[3] -
                  r[1] >
                  25
            )
            .filter(
              (r) =>
                !(
                  r[0] >
                    0.85 *
                      W &&
                  r[1] >
                    0.9 * H
                )
            )
            .map(
              (r) => ({
                x0: Math.max(
                  0,
                  r[0]
                ),

                y0: Math.max(
                  0,
                  r[1]
                ),

                x1: Math.min(
                  W,
                  r[2]
                ),

                y1: Math.min(
                  H,
                  r[3]
                ),

                cx:
                  (r[0] +
                    r[2]) /
                  2,

                cy:
                  (r[1] +
                    r[3]) /
                  2,
              })
            )
            .sort(
              (a, b) =>
                a.y0 -
                b.y0
            );

        return {
          regions,
          W,
          H,
        };
      } catch (
        error
      ) {
        return {
          regions: [],
          W: 0,
          H: 0,
        };
      }
    };

  /* ============================================================
     IMAGE CROP
  ============================================================ */

  const sliceRegionSharp = (
    fullCanvas,
    scale,
    region
  ) => {
    const sx =
      Math.round(
        region.x0 *
          scale
      );

    const sy =
      Math.round(
        region.y0 *
          scale
      );

    const sw =
      Math.round(
        (
          region.x1 -
          region.x0
        ) *
          scale
      );

    const sh =
      Math.round(
        (
          region.y1 -
          region.y0
        ) *
          scale
      );

    if (
      sw < 10 ||
      sh < 10
    ) {
      return null;
    }

    const out =
      document.createElement(
        'canvas'
      );

    out.width = sw;

    out.height = sh;

    const ctx =
      out.getContext(
        '2d'
      );

    ctx.fillStyle =
      '#ffffff';

    ctx.fillRect(
      0,
      0,
      sw,
      sh
    );

    ctx.drawImage(
      fullCanvas,

      sx,
      sy,
      sw,
      sh,

      0,
      0,
      sw,
      sh
    );

    return out.toDataURL(
      'image/png'
    );
  };

  const renderFullPageSharp =
    async (
      page,
      dpiScale = 4
    ) => {
      return renderPageToCanvas(
        page,
        dpiScale
      );
    };

  /* ============================================================
     JSON SALVAGE
  ============================================================ */

  const salvagePartialJsonArray =
    (text) => {
      const start =
        text.indexOf(
          '['
        );

      if (
        start === -1
      ) {
        return [];
      }

      let depth = 0;

      let inStr =
        false;

      let esc =
        false;

      let lastGoodEnd =
        -1;

      for (
        let i = start;
        i < text.length;
        i++
      ) {
        const ch =
          text[i];

        if (inStr) {
          if (esc) {
            esc =
              false;
          } else if (
            ch ===
            '\\'
          ) {
            esc =
              true;
          } else if (
            ch ===
            '"'
          ) {
            inStr =
              false;
          }

          continue;
        }

        if (
          ch ===
          '"'
        ) {
          inStr =
            true;
        } else if (
          ch ===
            '{' ||
          ch ===
            '['
        ) {
          depth++;
        } else if (
          ch ===
            '}' ||
          ch ===
            ']'
        ) {
          depth--;

          if (
            depth ===
              1 &&
            ch ===
              '}'
          ) {
            lastGoodEnd =
              i;
          }
        }
      }

      if (
        lastGoodEnd ===
        -1
      ) {
        return [];
      }

      const candidate =
        text.slice(
          start,
          lastGoodEnd +
            1
        ) + ']';

      try {
        const parsed =
          JSON.parse(
            candidate
          );

        return Array.isArray(
          parsed
        )
          ? parsed
          : [];
      } catch {
        return [];
      }
    };

  /* ============================================================
     EXTRACT GEMINI TEXT
  ============================================================ */

  const getGeminiText =
    (result) => {
      return (
        result?.candidates?.[0]
          ?.content?.parts || []
      )
        .filter(
          (part) =>
            typeof part.text ===
            'string'
        )
        .map(
          (part) =>
            part.text
        )
        .join('\n')
        .trim();
    };

  const parseGeminiJson = (
    result
  ) => {
    const text =
      getGeminiText(
        result
      );

    if (!text) {
      const block =
        result?.promptFeedback
          ?.blockReason;

      if (block) {
        throw new Error(
          `Gemini memblokir permintaan: ${block}`
        );
      }

      throw new Error(
        'Gemini tidak mengembalikan teks.'
      );
    }

    const cleaned =
      text
        .replace(
          /^```(?:json)?\s*/i,
          ''
        )
        .replace(
          /```\s*$/i,
          ''
        )
        .trim();

    try {
      return JSON.parse(
        cleaned
      );
    } catch {
      const salvaged =
        salvagePartialJsonArray(
          cleaned
        );

      if (
        salvaged.length >
        0
      ) {
        return {
          items: salvaged,
          truncated:
            true,
        };
      }

      throw new Error(
        'Respons Gemini bukan JSON yang valid.'
      );
    }
  };

  /* ============================================================
     GEMINI CALL
  ============================================================ */

  const callGemini =
    async ({
      modelId,
      imageBase64,
      pageNum,
      systemPrompt,
      userText,
      responseSchema,
      maxOutputTokens = 8192,
    }) => {
      const apiKey =
        geminiApiKey.trim();

      if (!apiKey) {
        throw new Error(
          'API key Gemini belum diisi.'
        );
      }

      const cleanBase64 =
        imageBase64.replace(
          /^data:image\/[^;]+;base64,/,
          ''
        );

      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;

      const body = {
        system_instruction: {
          parts: [
            {
              text:
                systemPrompt,
            },
          ],
        },

        contents: [
          {
            role: 'user',

            parts: [
              {
                text:
                  userText,
              },

              {
                inlineData: {
                  mimeType:
                    'image/jpeg',

                  data:
                    cleanBase64,
                },
              },
            ],
          },
        ],

        generationConfig: {
          responseMimeType:
            'application/json',

          responseSchema,

          temperature: 0.05,

          maxOutputTokens,
        },
      };

      let lastError =
        null;

      for (
        let attempt = 0;
        attempt < 3;
        attempt++
      ) {
        try {
          const response =
            await fetch(
              url,
              {
                method:
                  'POST',

                headers: {
                  'Content-Type':
                    'application/json',

                  'x-goog-api-key':
                    apiKey,
                },

                body:
                  JSON.stringify(
                    body
                  ),
              }
            );

          if (
            response.ok
          ) {
            return await response.json();
          }

          const errData =
            await response
              .json()
              .catch(
                () => ({})
              );

          const message =
            errData?.error
              ?.message ||
            `HTTP ${response.status}`;

          const retryable =
            [
              408,
              429,
              500,
              502,
              503,
              504,
            ].includes(
              response.status
            );

          if (
            retryable &&
            attempt <
              2
          ) {
            const waitMs =
              Math.min(
                2000 *
                  Math.pow(
                    2,
                    attempt
                  ),
                15000
              );

            if (
              response.status ===
              429
            ) {
              addLog(
                `Gemini rate limit. Menunggu ${Math.ceil(waitMs / 1000)} detik...`,
                'warning'
              );
            }

            await sleep(
              waitMs
            );

            continue;
          }

          const error =
            new Error(
              `Gemini ${modelId}: ${message}`
            );

          error.status =
            response.status;

          throw error;
        } catch (
          error
        ) {
          lastError =
            error;

          if (
            error.status &&
            ![
              408,
              429,
              500,
              502,
              503,
              504,
            ].includes(
              error.status
            )
          ) {
            break;
          }
        }
      }

      throw (
        lastError ||
        new Error(
          'Gagal memanggil Gemini.'
        )
      );
    };

  /* ============================================================
     EXTRACT QUESTIONS
  ============================================================ */

  const extractFromImageWithAI =
    async (
      base64Image,
      pageNum
    ) => {
      const systemPrompt =
        `
Kamu adalah mesin ekstraksi soal ujian profesional untuk Bank Soal Bimbel Gemilang.

Kamu HARUS membaca seluruh isi visual dari SATU halaman PDF yang diberikan.

TUJUAN:
Ekstrak setiap soal yang benar-benar terlihat pada halaman.

DUKUNG:
1. pg_sederhana
2. pg_kompleks
3. benar_salah
4. isian_singkat
5. menjodohkan

ATURAN SANGAT PENTING:

1. Jangan meringkas soal.
2. Jangan mengarang isi.
3. Jangan memperbaiki isi soal.
4. Jangan mengubah angka.
5. Jangan membuang satu pun opsi jawaban.
6. Pertahankan rumus dengan LaTeX.
7. Baca tabel.
8. Baca grafik.
9. Baca diagram.
10. Baca ilustrasi.
11. Baca simbol matematika.
12. Baca indeks, akar, pecahan, integral, limit, matriks, satuan, dan notasi ilmiah.

GAMBAR:
Jika sebuah soal mempunyai gambar, diagram, grafik, ilustrasi atau tabel visual yang merupakan bagian dari soal:
- harus dibuatkan placeholder {{GAMBAR_1}}, {{GAMBAR_2}}, dst.
- id gambar harus sama dengan placeholder.
- deskripsi harus menjelaskan gambar berdasarkan apa yang benar-benar terlihat.
- jangan menciptakan gambar baru.
- jangan menebak isi gambar.

KUNCI:
Jika kunci jawaban terlihat DI HALAMAN INI, masukkan.
Jika tidak terlihat, isi kunci_jawaban dengan string kosong.

PENTING:
Jangan menganggap opsi jawaban sebagai kunci jawaban.

Contoh:
A. 10
B. 20
C. 30
D. 40
E. 50

ini adalah OPSI, bukan kunci.

Balas hanya JSON sesuai schema.
`;

      const userText =
        `
Halaman PDF nomor ${pageNum}.

Baca seluruh halaman dari atas sampai bawah.

Ambil SEMUA soal yang terlihat.

Pastikan:
- nomor soal
- teks soal
- opsi
- pernyataan
- tabel
- pasangan
- gambar
- grafik
- rumus
- kunci jika memang terlihat

Semua informasi visual penting wajib diekstrak.
`;

      let lastError =
        null;

      for (
        const model
          of GEMINI_MODELS
      ) {
        try {
          addLog(
            `[Halaman ${pageNum}] ${model.label} memproses halaman...`,
            'info'
          );

          const result =
            await callGemini({
              modelId:
                model.id,

              imageBase64,

              pageNum,

              systemPrompt,

              userText,

              responseSchema:
                GEMINI_RESPONSE_SCHEMA,

              maxOutputTokens:
                8192,
            });

          const parsed =
            parseGeminiJson(
              result
            );

          return parsed;
        } catch (
          error
        ) {
          lastError =
            error;

          const status =
            error?.status;

          const fallbackAllowed =
            status ===
              408 ||
            status ===
              429 ||
            status >=
              500;

          addLog(
            `[Halaman ${pageNum}] ${model.label} gagal: ${error.message}`,
            'warning'
          );

          if (
            !fallbackAllowed
          ) {
            break;
          }
        }
      }

      throw (
        lastError ||
        new Error(
          'Semua model Gemini gagal.'
        )
      );
    };

  /* ============================================================
     ANSWER KEY SCANNER
  ============================================================ */

  const scanAnswerKeyPage =
    async (
      pageNum
    ) => {
      if (
        !pdfDocument
      ) {
        return [];
      }

      const page =
        await pdfDocument.getPage(
          pageNum
        );

      const canvas =
        await renderPageToCanvas(
          page,
          settings.resolution
        );

      const image =
        canvas.toDataURL(
          'image/jpeg',
          0.94
        );

      const systemPrompt =
        `
Kamu adalah pembaca KUNCI JAWABAN ujian.

Tugas kamu hanya membaca halaman yang kemungkinan berisi KUNCI JAWABAN.

Cari pasangan:
NOMOR SOAL -> KUNCI JAWABAN

Bisa berupa:

1. C
2. A
3. D

atau:

01 C
02 A
03 D

atau tabel:

No | Jawaban
1  | C
2  | A

atau:

1. B
2. S
3. B

atau bentuk lain.

Untuk soal pilihan ganda:
gunakan A/B/C/D/E.

Untuk Benar/Salah:
pertahankan B/S atau Benar/Salah.

Untuk isian:
pertahankan angka/kata.

Untuk menjodohkan:
pertahankan format pasangan.

ATURAN:
- Jangan mengarang.
- Jangan menghitung jawaban sendiri.
- Jangan menyimpulkan jawaban dari soal.
- Ambil hanya kunci yang BENAR-BENAR terlihat di halaman.
- Jika halaman bukan halaman kunci, hasilkan [].
- Nomor harus sesuai nomor soal.

Balas hanya JSON array.
`;

      const userText =
        `
Periksa halaman ${pageNum}.

Apakah ini halaman kunci jawaban?

Jika YA:
ekstrak semua pasangan nomor soal dan kunci.

Jika TIDAK:
kembalikan [].
`;

      try {
        const result =
          await callGemini({
            modelId:
              GEMINI_MODELS[0].id,

            imageBase64:
              image,

            pageNum,

            systemPrompt,

            userText,

            responseSchema:
              ANSWER_KEY_SCHEMA,

            maxOutputTokens:
              4096,
          });

        const parsed =
          parseGeminiJson(
            result
          );

        return Array.isArray(
          parsed
        )
          ? parsed
          : parsed?.items || [];
      } catch (
        error
      ) {
        addLog(
          `[KUNCI Halaman ${pageNum}] ${error.message}`,
          'warning'
        );

        return [];
      }
    };

  /* ============================================================
     AUTO DETECT ANSWER KEY
  ============================================================ */

  const runAnswerKeyScanner =
    async () => {
      if (
        !pdfDocument ||
        totalPages <
          1
      ) {
        return;
      }

      if (
        !geminiApiKey
      ) {
        setShowApiSettings(
          true
        );

        addLog(
          'Isi API key Gemini terlebih dahulu.',
          'warning'
        );

        return;
      }

      setScanningAnswerKey(
        true
      );

      addLog(
        'Mulai pencarian halaman KUNCI JAWABAN...',
        'info'
      );

      const foundMap =
        {};

      const foundPages =
        [];

      // scan dari belakang karena
      // halaman kunci biasanya ada di bagian akhir
      const candidates =
        Array.from(
          {
            length:
              totalPages,
          },
          (_, i) =>
            totalPages -
            i
        );

      // batasi scan otomatis
      // supaya tidak memanggil AI untuk
      // seluruh PDF jika dokumen sangat besar
      const maxPages =
        Math.min(
          candidates.length,
          12
        );

      for (
        let i = 0;
        i < maxPages;
        i++
      ) {
        const pageNum =
          candidates[i];

        addLog(
          `[KUNCI] Mengecek halaman ${pageNum}...`,
          'info'
        );

        const keys =
          await scanAnswerKeyPage(
            pageNum
          );

        if (
          Array.isArray(
            keys
          ) &&
          keys.length >
            0
        ) {
          foundPages.push(
            pageNum
          );

          keys.forEach(
            (item) => {
              const nomor =
                parseInt(
                  item.nomor,
                  10
                );

              const key =
                toStr(
                  item.kunci_jawaban
                ).trim();

              if (
                Number.isFinite(
                  nomor
                ) &&
                key
              ) {
                foundMap[
                  String(
                    nomor
                  )
                ] =
                  key;
              }
            }
          );

          addLog(
            `[KUNCI] Halaman ${pageNum}: ${keys.length} kunci terbaca.`,
            'success'
          );
        }
      }

      setAnswerKeyMap(
        foundMap
      );

      setAnswerKeyPages(
        foundPages
      );

      if (
        Object.keys(
          foundMap
        ).length >
        0
      ) {
        addLog(
          `KUNCI SELESAI: ${Object.keys(foundMap).length} jawaban ditemukan.`,
          'success'
        );
      } else {
        addLog(
          'Tidak ditemukan halaman kunci otomatis pada 12 halaman terakhir.',
          'warning'
        );
      }

      setScanningAnswerKey(
        false
      );

      return foundMap;
    };

  /* ============================================================
     APPLY ANSWER KEY
  ============================================================ */

  const applyAnswerKeys =
    (
      data,
      keyMap
    ) => {
      return data.map(
        (q) => {
          const key =
            keyMap[
              String(
                q.nomor
              )
            ];

          if (
            key
          ) {
            return {
              ...q,

              kunci_jawaban:
                key,

              kunci_terverifikasi:
                true,

              sumber_kunci:
                'hasil scan halaman kunci',

              halaman_kunci:
                answerKeyPages,
            };
          }

          return q;
        }
      );
    };

  /* ============================================================
     START PROCESSING
  ============================================================ */

  const startProcessing =
    async () => {
      if (
        !file ||
        !pdfDocument ||
        selectedPages.length ===
          0
      ) {
        return;
      }

      if (
        !geminiApiKey
      ) {
        setShowApiSettings(
          true
        );

        addLog(
          'API key Gemini belum diisi.',
          'warning'
        );

        return;
      }

      setAppState(
        'processing'
      );

      setExtractedData(
        []
      );

      setProgress({
        current: 0,
        total:
          selectedPages.length,
      });

      setActiveTab(
        'terminal'
      );

      addLog(
        `Memulai ekstraksi ${selectedPages.length} halaman...`,
        'success'
      );

      let allQuestions =
        [];

      const failedPages =
        [];

      try {
        for (
          let i = 0;
          i <
          selectedPages.length;
          i++
        ) {
          const pageNum =
            selectedPages[i];

          try {
            addLog(
              `[Halaman ${pageNum}] Render resolusi tinggi...`,
              'info'
            );

            const page =
              await pdfDocument.getPage(
                pageNum
              );

            const pageCanvas =
              await renderPageToCanvas(
                page,
                settings.resolution
              );

            const base64Image =
              pageCanvas.toDataURL(
                'image/jpeg',
                0.94
              );

            addLog(
              `[Halaman ${pageNum}] AI membaca teks + gambar + tabel + grafik...`,
              'info'
            );

            const rawResult =
              await extractFromImageWithAI(
                base64Image,
                pageNum
              );

            const rawQuestions =
              Array.isArray(
                rawResult
              )
                ? rawResult
                : rawResult?.items ||
                  [];

            const questions =
              rawQuestions
                .map(
                  (
                    raw,
                    idx
                  ) =>
                    normalizeQuestion(
                      raw,
                      idx + 1
                    )
                )
                .filter(
                  (q) =>
                    q.teks_soal.trim()
                      .length >
                    0
                );

            /* --------------------------------------------
               VISUAL / IMAGE DETECTION
            -------------------------------------------- */

            const regionInfo =
              await detectDiagramRegions(
                page
              );

            let renderedImages =
              [];

            if (
              regionInfo.regions
                .length >
              0
            ) {
              const sharpPage =
                await renderFullPageSharp(
                  page,
                  4
                );

              renderedImages =
                regionInfo.regions
                  .map(
                    (
                      region
                    ) => {
                      const url =
                        sliceRegionSharp(
                          sharpPage,
                          4,
                          region
                        );

                      if (!url) {
                        return null;
                      }

                      return {
                        url,
                        region,
                      };
                    }
                  )
                  .filter(
                    Boolean
                  );
            }

            addLog(
              `[Halaman ${pageNum}] ${renderedImages.length} kandidat visual PDF ditemukan.`,
              'info'
            );

            /* --------------------------------------------
               MATCH VISUAL
            -------------------------------------------- */

            let imgPtr =
              0;

            const questionsWithImages =
              questions.map(
                (
                  q
                ) => {
                  const gambarList =
                    Array.isArray(
                      q.gambar
                    )
                      ? q.gambar
                      : [];

                  if (
                    gambarList.length ===
                    0
                  ) {
                    return {
                      ...q,
                      gambar: [],
                    };
                  }

                  const gambar =
                    gambarList.map(
                      (
                        g
                      ) => {
                        let matched =
                          null;

                        /*
                         * Prioritas pertama:
                         * ambil kandidat visual
                         * berikutnya.
                         */
                        if (
                          imgPtr <
                          renderedImages.length
                        ) {
                          matched =
                            renderedImages[
                              imgPtr
                            ];

                          imgPtr++;
                        }

                        if (
                          matched
                        ) {
                          return {
                            ...g,

                            dataUrl:
                              matched.url,

                            sourcePage:
                              pageNum,

                            metode:
                              'render-pdf',
                          };
                        }

                        return {
                          ...g,

                          dataUrl:
                            null,

                          sourcePage:
                            pageNum,

                          metode:
                            'ai-detect-tanpa-crop',
                        };
                      }
                    );

                  return {
                    ...q,
                    gambar,
                  };
                }
              );

            allQuestions = [
              ...allQuestions,
              ...questionsWithImages,
            ];

            setExtractedData(
              [
                ...allQuestions,
              ]
            );

            addLog(
              `[Halaman ${pageNum}] ${questionsWithImages.length} soal berhasil.`,
              'success'
            );

            if (
              renderedImages.length >
              0
            ) {
              addLog(
                `[Halaman ${pageNum}] ${renderedImages.length} visual berhasil diproses.`,
                'success'
              );
            }
          } catch (
            error
          ) {
            failedPages.push(
              pageNum
            );

            addLog(
              `[Halaman ${pageNum}] GAGAL: ${error.message}`,
              'error'
            );
          }

          setProgress({
            current:
              i + 1,

            total:
              selectedPages.length,
          });

          if (
            i <
            selectedPages.length -
              1
          ) {
            await sleep(
              settings.delayBetweenPages
            );
          }
        }

        /* --------------------------------------------
           ANSWER KEY
        -------------------------------------------- */

        let finalKeyMap =
          answerKeyMap;

        if (
          Object.keys(
            finalKeyMap
          ).length ===
          0
        ) {
          addLog(
            'Mulai tahap 2: mencari halaman kunci jawaban...',
            'success'
          );

          finalKeyMap =
            await runAnswerKeyScanner();
        }

        const finalQuestions =
          applyAnswerKeys(
            allQuestions,
            finalKeyMap
          );

        setExtractedData(
          finalQuestions
        );

        addLog(
          `SELESAI. ${finalQuestions.length} soal tersedia.`,
          'success'
        );

        const keyCount =
          finalQuestions.filter(
            (q) =>
              q.kunci_jawaban
          ).length;

        addLog(
          `${keyCount} soal memiliki kunci jawaban.`,
          keyCount >
            0
            ? 'success'
            : 'warning'
        );

        if (
          failedPages.length >
          0
        ) {
          addLog(
            `Halaman gagal: ${failedPages.join(', ')}`,
            'warning'
          );
        }

        setAppState(
          'editing'
        );

        setActiveTab(
          'questions'
        );
      } catch (
        error
      ) {
        addLog(
          `GAGAL TOTAL: ${error.message}`,
          'error'
        );

        setAppState(
          'error'
        );
      }
    };

  /* ============================================================
     EDIT
  ============================================================ */

  const handleEditClick =
    (
      q,
      index
    ) => {
      setEditingId(
        index
      );

      setEditForm({
        ...q,

        opsi_jawaban:
          [
            ...(q.opsi_jawaban ||
              []),
          ],

        pernyataan:
          [
            ...(q.pernyataan ||
              []),
          ],

        tabel_benar_salah:
          [
            ...(q.tabel_benar_salah ||
              []),
          ],

        pasangan:
          [
            ...(q.pasangan ||
              []),
          ].map(
            (p) => ({
              ...p,
            })
          ),

        gambar:
          [
            ...(q.gambar ||
              []),
          ],
      });
    };

  const handleSaveEdit =
    (
      index
    ) => {
      const updated =
        [
          ...extractedData,
        ];

      updated[index] =
        normalizeQuestion(
          editForm,
          editForm.nomor ??
            index + 1
        );

      setExtractedData(
        updated
      );

      setEditingId(
        null
      );

      addLog(
        `Soal nomor ${updated[index].nomor} diperbarui.`,
        'success'
      );
    };

  const handleDeleteQuestion =
    (
      index
    ) => {
      const updated =
        extractedData.filter(
          (
            _,
            i
          ) =>
            i !==
            index
        );

      setExtractedData(
        updated
      );

      addLog(
        'Soal dihapus.',
        'warning'
      );
    };

  /* ============================================================
     MANUAL CROP
  ============================================================ */

  const openManualCrop =
    (
      qIndex,
      gIndex
    ) => {
      const q =
        extractedData[
          qIndex
        ];

      const pageNum =
        q?.gambar?.[
          gIndex
        ]?.sourcePage ||
        q?.gambar?.[0]
          ?.sourcePage ||
        selectedPages[0] ||
        1;

      setManualCrop({
        qIndex,
        gIndex,
        pageNum,
      });
    };

  const applyManualCrop =
    (
      qIndex,
      gIndex,
      dataUrl,
      pageNum
    ) => {
      setExtractedData(
        (prev) => {
          const next =
            [...prev];

          const q =
            {
              ...next[
                qIndex
              ],
            };

          const gambar =
            [
              ...(q.gambar ||
                []),
            ];

          if (
            gIndex !=
              null &&
            gambar[
              gIndex
            ]
          ) {
            gambar[
              gIndex
            ] = {
              ...gambar[
                gIndex
              ],

              dataUrl,

              sourcePage:
                pageNum,

              metode:
                'manual',
            };
          } else {
            gambar.push({
              id:
                `GAMBAR_${gambar.length + 1}`,

              deskripsi:
                '',

              dataUrl,

              sourcePage:
                pageNum,

              metode:
                'manual',
            });

            if (
              !/\{\{\s*GAMBAR/i.test(
                q.teks_soal ||
                  ''
              )
            ) {
              q.teks_soal =
                `${
                  q.teks_soal ||
                  ''
                } {{GAMBAR}}`;
            }
          }

          q.gambar =
            gambar;

          next[
            qIndex
          ] = q;

          return next;
        }
      );

      addLog(
        'Gambar manual berhasil ditambahkan.',
        'success'
      );
    };

  /* ============================================================
     FILTER
  ============================================================ */

  const filteredQuestions =
    useMemo(() => {
      if (
        typeFilter ===
        'semua'
      ) {
        return extractedData;
      }

      return extractedData.filter(
        (q) =>
          q.tipe ===
          typeFilter
      );
    }, [
      extractedData,
      typeFilter,
    ]);

  /* ============================================================
     DOWNLOAD JSON
  ============================================================ */

  const downloadJSON =
    () => {
      const payload =
        {
          metadata: {
            file:
              file?.name ||
              '',
            extractedAt:
              new Date().toISOString(),

            totalQuestions:
              extractedData.length,

            totalAnswered:
              extractedData.filter(
                (q) =>
                  q.kunci_jawaban
              ).length,

            answerKeyPages:
              answerKeyPages,
          },

          questions:
            extractedData,
        };

      const dataStr =
        'data:application/json;charset=utf-8,' +
        encodeURIComponent(
          JSON.stringify(
            payload,
            null,
            2
          )
        );

      const a =
        document.createElement(
          'a'
        );

      a.href =
        dataStr;

      a.download =
        `bank-soal-${file?.name || 'hasil'}.json`;

      document.body.appendChild(
        a
      );

      a.click();

      a.remove();

      addLog(
        'JSON berhasil diunduh.',
        'success'
      );
    };

  /* ============================================================
     DOWNLOAD CSV
  ============================================================ */

  const downloadCSV =
    () => {
      const esc =
        (v) =>
          `"${String(
            v ?? ''
          ).replace(
            /"/g,
            '""'
          )}"`;

      let csv =
        [
          'Nomor',
          'Tipe',
          'Soal',
          'Pernyataan',
          'Tabel Benar-Salah',
          'Pasangan',
          'Opsi A',
          'Opsi B',
          'Opsi C',
          'Opsi D',
          'Opsi E',
          'Kunci',
          'Jumlah Gambar',
          'Halaman Sumber',
        ].join(',') +
        '\n';

      extractedData.forEach(
        (
          q
        ) => {
          const opsi =
            q.opsi_jawaban ||
            [];

          const pasangan =
            (
              q.pasangan ||
              []
            )
              .map(
                (
                  p
                ) =>
                  `${p.kiri} -> ${p.kanan}`
              )
              .join(
                ' | '
              );

          csv += [
            q.nomor,
            esc(q.tipe),
            esc(
              q.teks_soal
            ),
            esc(
              (
                q.pernyataan ||
                []
              ).join(
                ' | '
              )
            ),
            esc(
              (
                q.tabel_benar_salah ||
                []
              ).join(
                ' | '
              )
            ),
            esc(
              pasangan
            ),
            esc(
              opsi[0] ||
                ''
            ),
            esc(
              opsi[1] ||
                ''
            ),
            esc(
              opsi[2] ||
                ''
            ),
            esc(
              opsi[3] ||
                ''
            ),
            esc(
              opsi[4] ||
                ''
            ),
            esc(
              q.kunci_jawaban ||
                ''
            ),
            (
              q.gambar ||
              []
            ).filter(
              (g) =>
                g.dataUrl
            ).length,
            esc(
              q.halaman_kunci?.join(
                ', '
              ) ||
                q.gambar?.find(
                  (g) =>
                    g.sourcePage
                )?.sourcePage ||
                ''
            ),
          ].join(
            ','
          ) +
          '\n';
        }
      );

      const blob =
        new Blob(
          [csv],
          {
            type:
              'text/csv;charset=utf-8',
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const a =
        document.createElement(
          'a'
        );

      a.href =
        url;

      a.download =
        `bank-soal-${file?.name || 'hasil'}.csv`;

      document.body.appendChild(
        a
      );

      a.click();

      a.remove();

      URL.revokeObjectURL(
        url
      );

      addLog(
        'CSV berhasil diunduh.',
        'success'
      );
    };

  /* ============================================================
     DOWNLOAD MARKDOWN
  ============================================================ */

  const downloadMarkdown =
    () => {
      let md =
        `# Bank Soal - ${
          file?.name ||
          'Dokumen'
        }\n\n`;

      extractedData.forEach(
        (
          q
        ) => {
          md +=
            `## Soal ${q.nomor}\n\n`;

          md +=
            `${q.teks_soal}\n\n`;

          if (
            q.opsi_jawaban
              ?.length
          ) {
            q.opsi_jawaban.forEach(
              (
                opt,
                idx
              ) => {
                md += `${String.fromCharCode(
                  65 + idx
                )}. ${opt}\n`;
              }
            );

            md +=
              '\n';
          }

          if (
            q.pernyataan
              ?.length
          ) {
            md +=
              '**Pernyataan:**\n';

            q.pernyataan.forEach(
              (
                p
              ) => {
                md +=
                  `- ${p}\n`;
              }
            );

            md +=
              '\n';
          }

          if (
            q.tabel_benar_salah
              ?.length
          ) {
            md +=
              '**Benar/Salah:**\n';

            q.tabel_benar_salah.forEach(
              (
                row
              ) => {
                md +=
                  `- ${row}\n`;
              }
            );

            md +=
              '\n';
          }

          if (
            q.pasangan
              ?.length
          ) {
            md +=
              '**Menjodohkan:**\n';

            q.pasangan.forEach(
              (
                p
              ) => {
                md +=
                  `- ${p.kiri} -> ${p.kanan}\n`;
              }
            );

            md +=
              '\n';
          }

          if (
            q.kunci_jawaban
          ) {
            md +=
              `**Kunci Jawaban:** ${q.kunci_jawaban}\n\n`;
          }

          md +=
            '---\n\n';
        }
      );

      const blob =
        new Blob(
          [md],
          {
            type:
              'text/markdown;charset=utf-8',
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const a =
        document.createElement(
          'a'
        );

      a.href =
        url;

      a.download =
        `bank-soal-${file?.name || 'hasil'}.md`;

      document.body.appendChild(
        a
      );

      a.click();

      a.remove();

      URL.revokeObjectURL(
        url
      );

      addLog(
        'Markdown berhasil diunduh.',
        'success'
      );
    };

  /* ============================================================
     RESET
  ============================================================ */

  const resetDocument =
    () => {
      setFile(null);

      setPdfDocument(
        null
      );

      setExtractedData(
        []
      );

      setSelectedPages(
        []
      );

      setTotalPages(
        0
      );

      setCoverThumbnail(
        null
      );

      setPagePreviews(
        {}
      );

      setAnswerKeyMap(
        {}
      );

      setAnswerKeyPages(
        []
      );

      setLogs([]);

      setAppState(
        'idle'
      );
    };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-50 px-4 md:px-6 py-4">

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
              <Sparkles className="w-6 h-6" />
            </div>

            <div>
              <h1 className="text-lg md:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                Advanced AI Question Extractor

                <span className="text-[10px] md:text-xs bg-indigo-600 px-2.5 py-0.5 rounded-full font-mono font-normal">
                  v14.0 Bank Soal
                </span>
              </h1>

              <p className="text-[11px] md:text-xs text-gray-400">
                Soal + Gambar + Grafik + Tabel + LaTeX + Kunci Jawaban
              </p>
            </div>

          </div>

          <div className="flex flex-wrap items-center gap-2 relative">

            {/* API KEY */}

            <button
              onClick={() =>
                setShowApiSettings(
                  (v) => !v
                )
              }
              className={`text-xs px-3 py-2 rounded-lg border flex items-center gap-1.5 ${
                geminiApiKey
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />

              {geminiApiKey
                ? 'AI Key tersimpan'
                : 'Set AI Key'}
            </button>

            {showApiSettings && (
              <div className="absolute right-0 top-11 w-[360px] bg-gray-900 border border-gray-700 rounded-2xl p-4 shadow-2xl z-[200]">

                <div className="flex justify-between items-start gap-3 mb-3">

                  <div>

                    <h3 className="font-bold text-sm text-white">
                      Gemini API Key
                    </h3>

                    <p className="text-[11px] text-gray-400 mt-1">
                      Key disimpan di browser ini.
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      setShowApiSettings(
                        false
                      )
                    }
                    className="text-gray-500 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>

                </div>

                <input
                  type="password"
                  value={
                    geminiApiKey
                  }
                  onChange={(e) =>
                    saveGeminiApiKey(
                      e.target.value
                    )
                  }
                  placeholder="AIza..."
                  className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-blue-500"
                />

                <div className="mt-3 flex justify-between items-center">

                  <span className="text-[10px] text-amber-300">
                    Jangan bagikan API key.
                  </span>

                  <button
                    onClick={() =>
                      saveGeminiApiKey(
                        ''
                      )
                    }
                    className="text-[11px] bg-gray-800 px-2.5 py-1.5 rounded-lg text-gray-300"
                  >
                    Hapus
                  </button>

                </div>

              </div>
            )}

            {file && (
              <button
                onClick={
                  resetDocument
                }
                className="text-xs px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}

          </div>

        </div>

      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="flex-1 max-w-[1500px] w-full mx-auto p-4 md:p-6">

        {/* ====================================================
            IDLE
        ==================================================== */}

        {appState ===
          'idle' && (
            <div className="min-h-[75vh] flex items-center justify-center">

              <div className="w-full max-w-3xl">

                <div
                  className="border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-3xl p-10 md:p-16 bg-gray-900/50 text-center transition-all cursor-pointer"
                  onDragOver={
                    handleDragOver
                  }
                  onDrop={
                    handleDrop
                  }
                >

                  <input
                    type="file"
                    id="pdf-upload"
                    className="hidden"
                    accept="application/pdf"
                    onChange={
                      handleFileUpload
                    }
                  />

                  <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >

                    <div className="bg-blue-600/10 p-6 rounded-full mb-6 border border-blue-500/20">
                      <UploadCloud className="w-14 h-14 text-blue-400" />
                    </div>

                    <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
                      Scan PDF ke Bank Soal
                    </h2>

                    <p className="text-sm text-gray-400 max-w-xl mb-7">
                      Baca soal, pilihan jawaban, gambar,
                      grafik, tabel, rumus, berbagai tipe soal,
                      serta kunci jawaban dari bagian lain PDF.
                    </p>

                    <span className="px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm">
                      Pilih File PDF
                    </span>

                  </label>

                </div>

                <div className="grid md:grid-cols-3 gap-3 mt-5">

                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <ScanSearch className="w-5 h-5 text-blue-400 mb-2" />
                    <p className="font-semibold text-sm">
                      Scan Visual
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Gambar, grafik, diagram, dan tabel.
                    </p>
                  </div>

                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <KeyRound className="w-5 h-5 text-emerald-400 mb-2" />
                    <p className="font-semibold text-sm">
                      Scan Kunci
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Mencari halaman kunci jawaban.
                    </p>
                  </div>

                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <Crop className="w-5 h-5 text-amber-400 mb-2" />
                    <p className="font-semibold text-sm">
                      Manual Crop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Koreksi gambar bila deteksi kurang presisi.
                    </p>
                  </div>

                </div>

              </div>

            </div>
          )}

        {/* ====================================================
            PREVIEW
        ==================================================== */}

        {appState ===
          'preview' && (
            <div className="space-y-5">

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">

                <div className="flex flex-col xl:flex-row gap-5">

                  <div className="w-full xl:w-[230px]">

                    {coverThumbnail ? (
                      <img
                        src={
                          coverThumbnail
                        }
                        alt="cover"
                        className="w-full rounded-xl border border-gray-700"
                      />
                    ) : (
                      <div className="aspect-[3/4] bg-gray-950 rounded-xl flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                      </div>
                    )}

                    <div className="mt-3">

                      <p className="font-semibold text-sm truncate">
                        {file?.name}
                      </p>

                      <p className="text-xs text-gray-500 mt-1">
                        {totalPages} halaman
                      </p>

                    </div>

                  </div>

                  <div className="flex-1">

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">

                      <div>

                        <h2 className="font-bold text-lg flex items-center gap-2">
                          <Eye className="w-5 h-5 text-blue-400" />
                          Pilih Halaman
                        </h2>

                        <p className="text-xs text-gray-500">
                          Sekarang setiap halaman ditampilkan dalam preview asli.
                        </p>

                      </div>

                      <div className="flex flex-wrap gap-2">

                        <button
                          onClick={() =>
                            setSelectedPages(
                              Array.from(
                                {
                                  length:
                                    totalPages,
                                },
                                (
                                  _,
                                  i
                                ) =>
                                  i + 1
                              )
                            )
                          }
                          className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300"
                        >
                          Pilih Semua
                        </button>

                        <button
                          onClick={() =>
                            setSelectedPages(
                              []
                            )
                          }
                          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-300"
                        >
                          Batalkan
                        </button>

                      </div>

                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[650px] overflow-y-auto pr-1">

                      {Array.from(
                        {
                          length:
                            totalPages,
                        },
                        (
                          _,
                          i
                        ) =>
                          i + 1
                      ).map(
                        (
                          pageNum
                        ) => {
                          const selected =
                            selectedPages.includes(
                              pageNum
                            );

                          return (
                            <button
                              key={
                                pageNum
                              }
                              onClick={() =>
                                togglePage(
                                  pageNum
                                )
                              }
                              onDoubleClick={() =>
                                setPreviewPage(
                                  pageNum
                                )
                              }
                              className={`text-left rounded-xl overflow-hidden border transition-all ${
                                selected
                                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5'
                                  : 'border-gray-800 bg-gray-950'
                              }`}
                            >

                              <div className="aspect-[3/4] bg-white relative">

                                {pagePreviews[
                                  pageNum
                                ] ? (
                                  <img
                                    src={
                                      pagePreviews[
                                        pageNum
                                      ]
                                    }
                                    alt={`Halaman ${pageNum}`}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-gray-500 text-xs">
                                      Preview belum tersedia
                                    </span>
                                  </div>
                                )}

                                <div className="absolute top-2 right-2">

                                  {selected ? (
                                    <div className="bg-blue-600 rounded-full p-1">
                                      <Check className="w-3 h-3" />
                                    </div>
                                  ) : (
                                    <div className="bg-gray-900/80 rounded-full p-1">
                                      <Square className="w-3 h-3" />
                                    </div>
                                  )}

                                </div>

                              </div>

                              <div className="p-2">

                                <div className="flex items-center justify-between">

                                  <span className="text-xs font-bold">
                                    Halaman{' '}
                                    {
                                      pageNum
                                    }
                                  </span>

                                  <span className="text-[10px] text-gray-500">
                                    Klik 2x = lihat
                                  </span>

                                </div>

                              </div>

                            </button>
                          );
                        }
                      )}

                    </div>

                    {!geminiApiKey && (
                      <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-200 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>
                          Isi Gemini API Key sebelum mulai scan.
                        </span>
                      </div>
                    )}

                    <div className="mt-4 flex flex-col md:flex-row gap-3 md:items-center justify-between border-t border-gray-800 pt-4">

                      <div className="flex flex-wrap gap-2">

                        <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-lg px-3 py-2">
                          {selectedPages.length} / {totalPages} dipilih
                        </span>

                        <button
                          onClick={
                            runAnswerKeyScanner
                          }
                          disabled={
                            scanningAnswerKey ||
                            !geminiApiKey
                          }
                          className="text-xs bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-lg px-3 py-2 flex items-center gap-1.5 disabled:opacity-40"
                        >
                          {scanningAnswerKey ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Search className="w-3.5 h-3.5" />
                          )}

                          Cari Kunci Jawaban
                        </button>

                      </div>

                      <button
                        onClick={
                          startProcessing
                        }
                        disabled={
                          selectedPages.length ===
                            0 ||
                          !geminiApiKey
                        }
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Mulai Scan AI
                      </button>

                    </div>

                  </div>

                </div>

              </div>

            </div>
          )}

        {/* ====================================================
            PROCESSING / EDITING
        ==================================================== */}

        {(
          appState ===
            'processing' ||
          appState ===
            'editing'
        ) && (
          <div className="space-y-5">

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">

              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">

                <div className="flex items-center gap-3">

                  {appState ===
                  'processing' ? (
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  )}

                  <div>

                    <h2 className="font-bold">
                      {appState ===
                      'processing'
                        ? 'Sedang Scan...'
                        : 'Ekstraksi Selesai'}
                    </h2>

                    <p className="text-xs text-gray-500">
                      {appState ===
                      'processing'
                        ? `Halaman ${progress.current} / ${progress.total}`
                        : `${extractedData.length} soal ditemukan`}
                    </p>

                  </div>

                </div>

                <div className="flex flex-wrap gap-2">

                  <div className="bg-gray-950 border border-gray-800 rounded-xl p-1 flex">

                    <button
                      onClick={() =>
                        setActiveTab(
                          'questions'
                        )
                      }
                      className={`px-4 py-2 rounded-lg text-xs font-semibold ${
                        activeTab ===
                        'questions'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400'
                      }`}
                    >
                      Soal ({extractedData.length})
                    </button>

                    <button
                      onClick={() =>
                        setActiveTab(
                          'terminal'
                        )
                      }
                      className={`px-4 py-2 rounded-lg text-xs font-semibold ${
                        activeTab ===
                        'terminal'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400'
                      }`}
                    >
                      Log ({logs.length})
                    </button>

                  </div>

                  {appState ===
                    'editing' && (
                    <>
                      <button
                        onClick={
                          downloadJSON
                        }
                        className="px-3 py-2 bg-emerald-600 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <FileJson className="w-4 h-4" />
                        JSON
                      </button>

                      <button
                        onClick={
                          downloadCSV
                        }
                        className="px-3 py-2 bg-indigo-600 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        CSV
                      </button>

                      <button
                        onClick={
                          downloadMarkdown
                        }
                        className="px-3 py-2 bg-purple-600 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <Code className="w-4 h-4" />
                        Markdown
                      </button>
                    </>
                  )}

                </div>

              </div>

            </div>

            {activeTab ===
              'terminal' && (
              <div className="bg-gray-950 border border-gray-800 rounded-2xl p-5 h-[550px] overflow-y-auto font-mono text-xs">

                <div className="sticky top-0 bg-gray-950 pb-3 mb-3 border-b border-gray-900 flex justify-between text-gray-500">

                  <span>
                    BANK SOAL AI CORE
                  </span>

                  <span>
                    {appState.toUpperCase()}
                  </span>

                </div>

                <div className="space-y-1.5">

                  {logs.map(
                    (
                      log
                    ) => (
                      <div
                        key={
                          log.id
                        }
                        className={
                          log.type ===
                          'error'
                            ? 'text-red-400'
                            : log.type ===
                              'warning'
                            ? 'text-yellow-400'
                            : log.type ===
                              'success'
                            ? 'text-blue-300'
                            : 'text-gray-300'
                        }
                      >
                        <span className="text-gray-600">
                          [
                          {
                            log.time
                          }
                          ]
                        </span>{' '}
                        {
                          log.message
                        }
                      </div>
                    )
                  )}

                  <div
                    ref={
                      logsEndRef
                    }
                  />

                </div>

              </div>
            )}

            {activeTab ===
              'questions' && (
              <div className="space-y-4">

                {extractedData.length >
                  0 && (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex flex-wrap gap-2 items-center">

                    <span className="text-xs text-gray-400 flex items-center gap-1.5 mr-2">
                      <Filter className="w-3.5 h-3.5" />
                      Filter
                    </span>

                    {[
                      [
                        'semua',
                        'Semua',
                      ],
                      [
                        'pg_sederhana',
                        'PG Sederhana',
                      ],
                      [
                        'pg_kompleks',
                        'PG Kompleks',
                      ],
                      [
                        'benar_salah',
                        'Benar / Salah',
                      ],
                      [
                        'isian_singkat',
                        'Isian Singkat',
                      ],
                      [
                        'menjodohkan',
                        'Menjodohkan',
                      ],
                    ].map(
                      (
                        [id, label]
                      ) => (
                        <button
                          key={
                            id
                          }
                          onClick={() =>
                            setTypeFilter(
                              id
                            )
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs ${
                            typeFilter ===
                            id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {
                            label
                          }
                        </button>
                      )
                    )}

                    <div className="ml-auto flex gap-2 text-xs">

                      <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                        Kunci:{' '}
                        {
                          extractedData.filter(
                            (q) =>
                              q.kunci_jawaban
                          ).length
                        }
                      </span>

                      <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300">
                        Gambar:{' '}
                        {
                          extractedData.reduce(
                            (
                              total,
                              q
                            ) =>
                              total +
                              (
                                q.gambar ||
                                []
                              ).filter(
                                (g) =>
                                  g.dataUrl
                              ).length,
                            0
                          )
                        }
                      </span>

                    </div>

                  </div>
                )}

                {filteredQuestions.length ===
                0 ? (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-14 text-center text-gray-500">
                    Belum ada soal.
                  </div>
                ) : (
                  filteredQuestions.map(
                    (
                      q,
                      index
                    ) => (
                      <QuestionErrorBoundary
                        key={
                          `${q.nomor}-${index}`
                        }
                      >

                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 md:p-6">

                          {editingId ===
                          index ? (
                            <div className="space-y-4">

                              <div className="grid sm:grid-cols-2 gap-3">

                                <div>

                                  <label className="text-xs text-gray-400">
                                    Nomor
                                  </label>

                                  <input
                                    type="number"
                                    value={
                                      editForm.nomor
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      setEditForm(
                                        {
                                          ...editForm,
                                          nomor:
                                            parseInt(
                                              e
                                                .target
                                                .value,
                                              10
                                            ) ||
                                            0,
                                        }
                                      )
                                    }
                                    className="mt-1 w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                                  />

                                </div>

                                <div>

                                  <label className="text-xs text-gray-400">
                                    Tipe
                                  </label>

                                  <select
                                    value={
                                      editForm.tipe
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      setEditForm(
                                        {
                                          ...editForm,
                                          tipe:
                                            e
                                              .target
                                              .value,
                                        }
                                      )
                                    }
                                    className="mt-1 w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm"
                                  >
                                    <option value="pg_sederhana">
                                      PG Sederhana
                                    </option>

                                    <option value="pg_kompleks">
                                      PG Kompleks
                                    </option>

                                    <option value="benar_salah">
                                      Benar/Salah
                                    </option>

                                    <option value="isian_singkat">
                                      Isian Singkat
                                    </option>

                                    <option value="menjodohkan">
                                      Menjodohkan
                                    </option>
                                  </select>

                                </div>

                              </div>

                              <div>

                                <label className="text-xs text-gray-400">
                                  Soal
                                </label>

                                <textarea
                                  rows={6}
                                  value={
                                    editForm.teks_soal
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    setEditForm(
                                      {
                                        ...editForm,
                                        teks_soal:
                                          e
                                            .target
                                            .value,
                                      }
                                    )
                                  }
                                  className="mt-1 w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-3 text-sm font-mono"
                                />

                              </div>

                              <div>

                                <label className="text-xs text-gray-400">
                                  Kunci Jawaban
                                </label>

                                <input
                                  value={
                                    editForm.kunci_jawaban ||
                                    ''
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    setEditForm(
                                      {
                                        ...editForm,
                                        kunci_jawaban:
                                          e
                                            .target
                                            .value,
                                        kunci_terverifikasi:
                                          false,
                                      }
                                    )
                                  }
                                  className="mt-1 w-full bg-gray-950 border border-emerald-500/30 rounded-lg px-3 py-2 text-sm text-emerald-300"
                                  placeholder="Contoh C / 42 / B,S,B"
                                />

                              </div>

                              <div className="flex justify-end gap-2">

                                <button
                                  onClick={() =>
                                    setEditingId(
                                      null
                                    )
                                  }
                                  className="px-4 py-2 rounded-lg bg-gray-800 text-xs"
                                >
                                  Batal
                                </button>

                                <button
                                  onClick={() =>
                                    handleSaveEdit(
                                      index
                                    )
                                  }
                                  className="px-4 py-2 rounded-lg bg-blue-600 text-xs font-bold flex items-center gap-2"
                                >
                                  <Save className="w-4 h-4" />
                                  Simpan
                                </button>

                              </div>

                            </div>
                          ) : (
                            <div>

                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">

                                <div className="flex flex-wrap items-center gap-2">

                                  <span className="px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-300 text-xs font-mono font-bold">
                                    Soal{' '}
                                    {
                                      q.nomor
                                    }
                                  </span>

                                  <TypeBadge
                                    tipe={
                                      q.tipe
                                    }
                                  />

                                  {q.kunci_jawaban && (
                                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono flex items-center gap-1.5">
                                      <KeyRound className="w-3 h-3" />
                                      Kunci:{' '}
                                      {
                                        q.kunci_jawaban
                                      }
                                    </span>
                                  )}

                                  {q.kunci_terverifikasi && (
                                    <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px]">
                                      Terhubung halaman kunci
                                    </span>
                                  )}

                                </div>

                                <div className="flex gap-2">

                                  <button
                                    onClick={() =>
                                      handleEditClick(
                                        q,
                                        index
                                      )
                                    }
                                    className="p-2 rounded-lg bg-gray-800 text-gray-300"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleDeleteQuestion(
                                        index
                                      )
                                    }
                                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400"
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>

                                </div>

                              </div>

                              {/* SOAL */}

                              <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">

                                <RichQuestionText
                                  text={
                                    q.teks_soal
                                  }
                                  gambar={
                                    q.gambar
                                  }
                                  isMathReady={
                                    isMathReady
                                  }
                                />

                              </div>

                              {/* IMAGE CONTROL */}

                              <div className="mt-4 flex flex-wrap gap-2">

                                {(
                                  q.gambar ||
                                  []
                                ).map(
                                  (
                                    g,
                                    gi
                                  ) => (
                                    <button
                                      key={
                                        gi
                                      }
                                      onClick={() =>
                                        openManualCrop(
                                          index,
                                          gi
                                        )
                                      }
                                      className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-1.5"
                                    >
                                      <Crop className="w-3.5 h-3.5" />

                                      {g.dataUrl
                                        ? `Atur gambar ${gi + 1}`
                                        : `Cari/crop gambar ${gi + 1}`}
                                    </button>
                                  )
                                )}

                                <button
                                  onClick={() =>
                                    openManualCrop(
                                      index,
                                      null
                                    )
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-xs flex items-center gap-1.5"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Tambah gambar
                                </button>

                              </div>

                              {/* IMAGE COUNT */}

                              <div className="mt-3 flex flex-wrap gap-2">

                                {(
                                  q.gambar ||
                                  []
                                ).map(
                                  (
                                    g,
                                    gi
                                  ) => (
                                    <span
                                      key={
                                        `img-${gi}`
                                      }
                                      className={`text-[10px] px-2.5 py-1 rounded-lg border ${
                                        g.dataUrl
                                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                          : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                      }`}
                                    >
                                      {g.dataUrl
                                        ? `Gambar ${gi + 1} siap`
                                        : `Gambar ${gi + 1} belum dipotong`}
                                    </span>
                                  )
                                )}

                              </div>

                              {/* OPTIONS */}

                              {q.opsi_jawaban
                                ?.length >
                                0 && (
                                <div className="mt-4 grid sm:grid-cols-2 gap-2">

                                  {q.opsi_jawaban.map(
                                    (
                                      opt,
                                      oi
                                    ) => (
                                      <div
                                        key={
                                          oi
                                        }
                                        className="bg-gray-950/60 border border-gray-800 rounded-xl px-4 py-3 text-sm"
                                      >
                                        <span className="text-blue-400 font-bold mr-2">
                                          {String.fromCharCode(
                                            65 +
                                              oi
                                          )}
                                          .
                                        </span>

                                        <RichQuestionText
                                          text={
                                            opt
                                          }
                                          gambar={
                                            []
                                          }
                                          isMathReady={
                                            isMathReady
                                          }
                                        />
                                      </div>
                                    )
                                  )}

                                </div>
                              )}

                              {/* PERNYATAAN */}

                              {q.pernyataan
                                ?.length >
                                0 && (
                                <div className="mt-4 space-y-2">

                                  <div className="text-xs font-bold text-violet-300">
                                    Pernyataan
                                  </div>

                                  {q.pernyataan.map(
                                    (
                                      p,
                                      pi
                                    ) => (
                                      <div
                                        key={
                                          pi
                                        }
                                        className="bg-gray-950/60 border border-gray-800 rounded-xl px-4 py-3 text-sm"
                                      >
                                        <RichQuestionText
                                          text={
                                            p
                                          }
                                          gambar={
                                            []
                                          }
                                          isMathReady={
                                            isMathReady
                                          }
                                        />
                                      </div>
                                    )
                                  )}

                                </div>
                              )}

                              {/* BENAR SALAH */}

                              {q.tabel_benar_salah
                                ?.length >
                                0 && (
                                <div className="mt-4 rounded-xl overflow-hidden border border-gray-800">

                                  <table className="w-full text-xs">

                                    <thead>

                                      <tr className="bg-gray-950">

                                        <th className="text-left px-4 py-3">
                                          Pernyataan
                                        </th>

                                        <th className="text-center px-3 py-3 text-emerald-400">
                                          Benar
                                        </th>

                                        <th className="text-center px-3 py-3 text-red-400">
                                          Salah
                                        </th>

                                      </tr>

                                    </thead>

                                    <tbody>

                                      {q.tabel_benar_salah.map(
                                        (
                                          row,
                                          ri
                                        ) => (
                                          <tr
                                            key={
                                              ri
                                            }
                                            className="border-t border-gray-800"
                                          >

                                            <td className="px-4 py-3">
                                              <RichQuestionText
                                                text={
                                                  row
                                                }
                                                gambar={
                                                  []
                                                }
                                                isMathReady={
                                                  isMathReady
                                                }
                                              />
                                            </td>

                                            <td className="text-center">
                                              □
                                            </td>

                                            <td className="text-center">
                                              □
                                            </td>

                                          </tr>
                                        )
                                      )}

                                    </tbody>

                                  </table>

                                </div>
                              )}

                              {/* MATCHING */}

                              {q.pasangan
                                ?.length >
                                0 && (
                                <div className="mt-4 bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">

                                  <div className="text-xs font-bold text-rose-300 mb-3">
                                    Menjodohkan
                                  </div>

                                  <div className="space-y-2">

                                    {q.pasangan.map(
                                      (
                                        p,
                                        pi
                                      ) => (
                                        <div
                                          key={
                                            pi
                                          }
                                          className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center"
                                        >

                                          <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs">
                                            <RichQuestionText
                                              text={
                                                p.kiri
                                              }
                                              gambar={
                                                []
                                              }
                                              isMathReady={
                                                isMathReady
                                              }
                                            />
                                          </div>

                                          <ArrowRight className="w-4 h-4 text-rose-400" />

                                          <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 text-xs">
                                            <RichQuestionText
                                              text={
                                                p.kanan
                                              }
                                              gambar={
                                                []
                                              }
                                              isMathReady={
                                                isMathReady
                                              }
                                            />
                                          </div>

                                        </div>
                                      )
                                    )}

                                  </div>

                                </div>
                              )}

                            </div>
                          )}

                        </div>

                      </QuestionErrorBoundary>
                    )
                  )
                )}

              </div>
            )}

          </div>
        )}

      </main>

      {/* ======================================================
          PREVIEW SINGLE PAGE MODAL
      ====================================================== */}

      {previewPage &&
        pdfDocument && (
          <PagePreviewModal
            pdfDocument={
              pdfDocument
            }
            pageNum={
              previewPage
            }
            totalPages={
              totalPages
            }
            selectedPages={
              selectedPages
            }
            onTogglePage={togglePage}
            onClose={() =>
              setPreviewPage(
                null
              )
            }
          />
        )}

      {/* ======================================================
          MANUAL CROP
      ====================================================== */}

      {manualCrop &&
        pdfDocument && (
          <ManualCropModal
            pdfDocument={
              pdfDocument
            }
            pageNum={
              manualCrop.pageNum
            }
            totalPages={
              totalPages
            }
            onClose={() =>
              setManualCrop(
                null
              )
            }
            onApply={(
              dataUrl,
              pageNum
            ) => {
              applyManualCrop(
                manualCrop.qIndex,
                manualCrop.gIndex,
                dataUrl,
                pageNum
              );

              setManualCrop(
                null
              );
            }}
          />
        )}

    </div>
  );
}

/* ============================================================
   TYPE BADGE
============================================================ */

function TypeBadge({
  tipe,
}) {
  const map = {
    pg_sederhana: {
      label:
        'PG Sederhana',

      cls:
        'bg-sky-500/10 border-sky-500/20 text-sky-300',
    },

    pg_kompleks: {
      label:
        'PG Kompleks',

      cls:
        'bg-violet-500/10 border-violet-500/20 text-violet-300',
    },

    benar_salah: {
      label:
        'Benar / Salah',

      cls:
        'bg-amber-500/10 border-amber-500/20 text-amber-300',
    },

    isian_singkat: {
      label:
        'Isian Singkat',

      cls:
        'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    },

    menjodohkan: {
      label:
        'Menjodohkan',

      cls:
        'bg-rose-500/10 border-rose-500/20 text-rose-300',
    },
  };

  const item =
    map[tipe] || {
      label:
        tipe ||
        'Soal',

      cls:
        'bg-gray-800 border-gray-700 text-gray-300',
    };

  return (
    <span
      className={`px-2.5 py-1 rounded-full border text-[10px] font-bold font-mono ${item.cls}`}
    >
      {item.label}
    </span>
  );
}

/* ============================================================
   RICH TEXT
============================================================ */

function RichQuestionText({
  text,
  gambar,
  isMathReady,
}) {
  const containerRef =
    useRef(null);

  const html =
    useMemo(() => {
      const safeText =
        toStr(text);

      if (!safeText) {
        return '';
      }

      let escaped =
        safeText
          .replace(
            /&/g,
            '&amp;'
          )
          .replace(
            /</g,
            '&lt;'
          )
          .replace(
            />/g,
            '&gt;'
          );

      const imgs =
        Array.isArray(
          gambar
        )
          ? gambar.filter(
              Boolean
            )
          : [];

      let idx = 0;

      escaped =
        escaped.replace(
          /\{\{\s*GAMBAR(?:_\d+)?\s*\}\}/gi,
          () => {
            const g =
              imgs[idx++];

            if (
              g &&
              g.dataUrl
            ) {
              const alt =
                (
                  g.deskripsi ||
                  'Gambar soal'
                ).replace(
                  /"/g,
                  '&quot;'
                );

              return `
                <figure style="margin:12px 0;">
                  <img
                    src="${g.dataUrl}"
                    alt="${alt}"
                    style="max-width:100%;max-height:420px;border-radius:10px;border:1px solid #374151;background:#fff;padding:5px;"
                  />
                  <figcaption style="font-size:11px;color:#9ca3af;margin-top:5px;">
                    ${alt}
                  </figcaption>
                </figure>
              `;
            }

            return `
              <span style="display:inline-block;color:#fbbf24;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);padding:4px 8px;border-radius:6px;font-size:11px;">
                [Gambar belum dicrop]
              </span>
            `;
          }
        );

      if (
        idx ===
          0 &&
        imgs.some(
          (g) =>
            g.dataUrl
        )
      ) {
        imgs.forEach(
          (
            g
          ) => {
            if (
              g.dataUrl
            ) {
              const alt =
                (
                  g.deskripsi ||
                  'Gambar soal'
                ).replace(
                  /"/g,
                  '&quot;'
                );

              escaped += `
                <figure style="margin:12px 0;">
                  <img
                    src="${g.dataUrl}"
                    alt="${alt}"
                    style="max-width:100%;max-height:420px;border-radius:10px;border:1px solid #374151;background:#fff;padding:5px;"
                  />
                  <figcaption style="font-size:11px;color:#9ca3af;margin-top:5px;">
                    ${alt}
                  </figcaption>
                </figure>
              `;
            }
          }
        );
      }

      return escaped;
    }, [
      text,
      gambar,
    ]);

  useEffect(() => {
    if (
      containerRef.current &&
      isMathReady &&
      window.renderMathInElement
    ) {
      try {
        window.renderMathInElement(
          containerRef.current,
          {
            delimiters: [
              {
                left: '$$',
                right: '$$',
                display: true,
              },
              {
                left: '$',
                right: '$',
                display: false,
              },
              {
                left: '\\(',
                right: '\\)',
                display: false,
              },
              {
                left: '\\[',
                right: '\\]',
                display: true,
              },
            ],

            throwOnError:
              false,
          }
        );
      } catch {
        // ignore render errors
      }
    }
  }, [
    html,
    isMathReady,
  ]);

  return (
    <div
      ref={
        containerRef
      }
      className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words"
      dangerouslySetInnerHTML={{
        __html: html,
      }}
    />
  );
}

/* ============================================================
   PAGE PREVIEW MODAL
============================================================ */

function PagePreviewModal({
  pdfDocument,
  pageNum,
  totalPages,
  selectedPages,
  onTogglePage,
  onClose,
}) {
  const canvasRef =
    useRef(null);

  const [
    rendering,
    setRendering,
  ] = useState(true);

  const [
    currentPage,
    setCurrentPage,
  ] = useState(pageNum);

  useEffect(() => {
    let cancelled =
      false;

    (async () => {
      try {
        setRendering(
          true
        );

        const page =
          await pdfDocument.getPage(
            currentPage
          );

        const viewport =
          page.getViewport({
            scale: 1.6,
          });

        const canvas =
          canvasRef.current;

        canvas.width =
          Math.ceil(
            viewport.width
          );

        canvas.height =
          Math.ceil(
            viewport.height
          );

        const ctx =
          canvas.getContext(
            '2d'
          );

        ctx.fillStyle =
          '#ffffff';

        ctx.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        await page.render({
          canvasContext:
            ctx,

          viewport,
        }).promise;

        if (!cancelled) {
          setRendering(
            false
          );
        }
      } catch {
        if (!cancelled) {
          setRendering(
            false
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    pdfDocument,
    currentPage,
  ]);

  const selected =
    selectedPages.includes(
      currentPage
    );

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={
        onClose
      }
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-5xl max-h-[94vh] overflow-hidden flex flex-col"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">

          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-400" />

            <span className="font-bold text-sm">
              Preview Halaman{' '}
              {
                currentPage
              }
              /{' '}
              {
                totalPages
              }
            </span>
          </div>

          <button
            onClick={
              onClose
            }
            className="p-2 rounded-lg bg-gray-800 text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>

        </div>

        <div className="flex-1 overflow-auto bg-gray-950 p-4 flex justify-center relative">

          {rendering && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          )}

          <canvas
            ref={
              canvasRef
            }
            className="max-w-full h-auto rounded-xl shadow-2xl bg-white"
          />

        </div>

        <div className="px-5 py-3 border-t border-gray-800 flex flex-wrap items-center justify-between gap-3">

          <div className="flex items-center gap-2">

            <button
              disabled={
                currentPage <=
                1
              }
              onClick={() =>
                setCurrentPage(
                  (p) =>
                    Math.max(
                      1,
                      p - 1
                    )
                )
              }
              className="p-2 rounded-lg bg-gray-800 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              disabled={
                currentPage >=
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (p) =>
                    Math.min(
                      totalPages,
                      p + 1
                    )
                )
              }
              className="p-2 rounded-lg bg-gray-800 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

          </div>

          <button
            onClick={() =>
              onTogglePage(
                currentPage
              )
            }
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
              selected
                ? 'bg-blue-600'
                : 'bg-gray-800'
            }`}
          >
            {selected ? (
              <>
                <CheckSquare className="w-4 h-4" />
                Halaman Dipilih
              </>
            ) : (
              <>
                <Square className="w-4 h-4" />
                Pilih Halaman
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
}

/* ============================================================
   MANUAL CROP MODAL
============================================================ */

function ManualCropModal({
  pdfDocument,
  pageNum,
  totalPages,
  onClose,
  onApply,
}) {
  const canvasRef =
    useRef(null);

  const wrapRef =
    useRef(null);

  const [
    curPage,
    setCurPage,
  ] = useState(pageNum);

  const [
    rendering,
    setRendering,
  ] = useState(true);

  const [
    pageObj,
    setPageObj,
  ] = useState(null);

  const [
    viewScale,
    setViewScale,
  ] = useState(1);

  const [
    box,
    setBox,
  ] = useState({
    x: 80,
    y: 80,
    w: 300,
    h: 220,
  });

  const drag =
    useRef(null);

  useEffect(() => {
    let cancelled =
      false;

    (async () => {
      try {
        setRendering(
          true
        );

        const page =
          await pdfDocument.getPage(
            curPage
          );

        if (
          cancelled
        ) {
          return;
        }

        setPageObj(
          page
        );

        const base =
          page.getViewport({
            scale: 1,
          });

        const maxW =
          Math.min(
            900,
            wrapRef.current
              ?.clientWidth ||
              900
          );

        const scale =
          maxW /
          base.width;

        setViewScale(
          scale
        );

        const vp =
          page.getViewport({
            scale,
          });

        const canvas =
          canvasRef.current;

        canvas.width =
          Math.ceil(
            vp.width
          );

        canvas.height =
          Math.ceil(
            vp.height
          );

        const ctx =
          canvas.getContext(
            '2d'
          );

        ctx.fillStyle =
          '#ffffff';

        ctx.fillRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        await page.render({
          canvasContext:
            ctx,

          viewport:
            vp,
        }).promise;

        if (
          cancelled
        ) {
          return;
        }

        setBox({
          x:
            canvas.width *
            0.25,

          y:
            canvas.height *
            0.25,

          w:
            canvas.width *
            0.5,

          h:
            canvas.height *
            0.25,
        });

        setRendering(
          false
        );
      } catch {
        if (
          !cancelled
        ) {
          setRendering(
            false
          );
        }
      }
    })();

    return () => {
      cancelled =
        true;
    };
  }, [
    pdfDocument,
    curPage,
  ]);

  const onPointerDown =
    (
      e,
      mode
    ) => {
      e.stopPropagation();

      const rect =
        canvasRef.current.getBoundingClientRect();

      drag.current =
        {
          mode,

          startX:
            e.clientX,

          startY:
            e.clientY,

          startBox:
            {
              ...box,
            },

          scaleX:
            canvasRef.current
              .width /
            rect.width,

          scaleY:
            canvasRef.current
              .height /
            rect.height,
        };

      window.addEventListener(
        'pointermove',
        onPointerMove
      );

      window.addEventListener(
        'pointerup',
        onPointerUp
      );
    };

  const onPointerMove =
    (
      e
    ) => {
      if (
        !drag.current
      ) {
        return;
      }

      const d =
        drag.current;

      const dx =
        (
          e.clientX -
          d.startX
        ) *
        d.scaleX;

      const dy =
        (
          e.clientY -
          d.startY
        ) *
        d.scaleY;

      const cw =
        canvasRef.current
          .width;

      const ch =
        canvasRef.current
          .height;

      let {
        x,
        y,
        w,
        h,
      } =
        d.startBox;

      if (
        d.mode ===
        'move'
      ) {
        x += dx;
        y += dy;
      } else {
        if (
          d.mode.includes(
            'e'
          )
        ) {
          w += dx;
        }

        if (
          d.mode.includes(
            's'
          )
        ) {
          h += dy;
        }

        if (
          d.mode.includes(
            'w'
          )
        ) {
          x += dx;
          w -= dx;
        }

        if (
          d.mode.includes(
            'n'
          )
        ) {
          y += dy;
          h -= dy;
        }
      }

      w =
        Math.max(
          30,
          w
        );

      h =
        Math.max(
          30,
          h
        );

      x =
        Math.max(
          0,
          Math.min(
            x,
            cw - w
          )
        );

      y =
        Math.max(
          0,
          Math.min(
            y,
            ch - h
          )
        );

      if (
        x + w >
        cw
      ) {
        w =
          cw - x;
      }

      if (
        y + h >
        ch
      ) {
        h =
          ch - y;
      }

      setBox({
        x,
        y,
        w,
        h,
      });
    };

  const onPointerUp =
    () => {
      drag.current =
        null;

      window.removeEventListener(
        'pointermove',
        onPointerMove
      );

      window.removeEventListener(
        'pointerup',
        onPointerUp
      );
    };

  const handleTake =
    async () => {
      if (
        !pageObj
      ) {
        return;
      }

      const region =
        {
          x0:
            box.x /
            viewScale,

          y0:
            box.y /
            viewScale,

          x1:
            (
              box.x +
              box.w
            ) /
            viewScale,

          y1:
            (
              box.y +
              box.h
            ) /
            viewScale,
        };

      const dpi = 4;

      const vp =
        pageObj.getViewport({
          scale: dpi,
        });

      const full =
        document.createElement(
          'canvas'
        );

      full.width =
        Math.ceil(
          vp.width
        );

      full.height =
        Math.ceil(
          vp.height
        );

      const ctx =
        full.getContext(
          '2d'
        );

      ctx.fillStyle =
        '#ffffff';

      ctx.fillRect(
        0,
        0,
        full.width,
        full.height
      );

      await pageObj.render({
        canvasContext:
          ctx,

        viewport:
          vp,
      }).promise;

      const sx =
        Math.round(
          region.x0 *
            dpi
        );

      const sy =
        Math.round(
          region.y0 *
            dpi
        );

      const sw =
        Math.round(
          (
            region.x1 -
            region.x0
          ) *
            dpi
        );

      const sh =
        Math.round(
          (
            region.y1 -
            region.y0
          ) *
            dpi
        );

      const out =
        document.createElement(
          'canvas'
        );

      out.width =
        sw;

      out.height =
        sh;

      const octx =
        out.getContext(
          '2d'
        );

      octx.fillStyle =
        '#ffffff';

      octx.fillRect(
        0,
        0,
        sw,
        sh
      );

      octx.drawImage(
        full,
        sx,
        sy,
        sw,
        sh,
        0,
        0,
        sw,
        sh
      );

      onApply(
        out.toDataURL(
          'image/png'
        ),
        curPage
      );
    };

  const handles =
    [
      [
        'nw',
        '-top-1.5 -left-1.5 cursor-nwse-resize',
      ],
      [
        'n',
        '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize',
      ],
      [
        'ne',
        '-top-1.5 -right-1.5 cursor-nesw-resize',
      ],
      [
        'w',
        'top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize',
      ],
      [
        'e',
        'top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize',
      ],
      [
        'sw',
        '-bottom-1.5 -left-1.5 cursor-nesw-resize',
      ],
      [
        's',
        '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize',
      ],
      [
        'se',
        '-bottom-1.5 -right-1.5 cursor-nwse-resize',
      ],
    ];

  return (
    <div
      className="fixed inset-0 z-[400] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={
        onClose
      }
    >

      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[94vh] overflow-hidden flex flex-col"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">

          <div className="flex items-center gap-2">

            <Crop className="w-4 h-4 text-blue-400" />

            <span className="font-bold text-sm">
              Crop Gambar Manual
            </span>

          </div>

          <div className="flex items-center gap-2">

            <button
              disabled={
                curPage <=
                1
              }
              onClick={() =>
                setCurPage(
                  (p) =>
                    Math.max(
                      1,
                      p - 1
                    )
                )
              }
              className="p-1.5 rounded bg-gray-800 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs text-gray-400 font-mono">
              Hal{' '}
              {
                curPage
              }
              /
              {
                totalPages
              }
            </span>

            <button
              disabled={
                curPage >=
                totalPages
              }
              onClick={() =>
                setCurPage(
                  (p) =>
                    Math.min(
                      totalPages,
                      p + 1
                    )
                )
              }
              className="p-1.5 rounded bg-gray-800 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={
                onClose
              }
              className="p-1.5 rounded bg-gray-800"
            >
              <X className="w-4 h-4" />
            </button>

          </div>

        </div>

        <div className="px-5 py-2 text-xs text-gray-500 border-b border-gray-800">
          Geser dan ubah ukuran kotak biru tepat di atas gambar/grafik yang ingin disimpan.
        </div>

        <div
          ref={
            wrapRef
          }
          className="flex-1 overflow-auto bg-gray-950 p-4 flex justify-center"
        >

          <div
            className="relative"
            style={{
              lineHeight: 0,
            }}
          >

            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-gray-950/80">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            )}

            <canvas
              ref={
                canvasRef
              }
              className="rounded-xl shadow-2xl select-none"
              style={{
                maxWidth:
                  '100%',
                height:
                  'auto',
              }}
            />

            {!rendering &&
              canvasRef.current && (
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500/10 cursor-move"
                  style={{
                    left:
                      `${
                        (box.x /
                          canvasRef.current
                            .width) *
                        100
                      }%`,

                    top:
                      `${
                        (box.y /
                          canvasRef.current
                            .height) *
                        100
                      }%`,

                    width:
                      `${
                        (box.w /
                          canvasRef.current
                            .width) *
                        100
                      }%`,

                    height:
                      `${
                        (box.h /
                          canvasRef.current
                            .height) *
                        100
                      }%`,
                  }}
                  onPointerDown={(
                    e
                  ) =>
                    onPointerDown(
                      e,
                      'move'
                    )
                  }
                >

                  {handles.map(
                    (
                      [
                        mode,
                        cls,
                      ]
                    ) => (
                      <span
                        key={
                          mode
                        }
                        onPointerDown={(
                          e
                        ) =>
                          onPointerDown(
                            e,
                            mode
                          )
                        }
                        className={`absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm ${cls}`}
                      />
                    )
                  )}

                </div>
              )}

          </div>

        </div>

        <div className="px-5 py-3 border-t border-gray-800 flex justify-end gap-2">

          <button
            onClick={
              onClose
            }
            className="px-4 py-2 rounded-lg bg-gray-800 text-sm"
          >
            Batal
          </button>

          <button
            onClick={
              handleTake
            }
            disabled={
              rendering
            }
            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
            Ambil Gambar
          </button>

        </div>

      </div>

    </div>
  );
}