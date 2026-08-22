// src/pages/teacher/modul/AIGenerateQuiz.jsx
// ============================================================
// BIMBEL GEMILANG - AI QUIZ GENERATOR
// SAFE REACT CLIENT COMPONENT
// ============================================================

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  Wand2,
  FileQuestion,
  Globe,
  Brain,
} from 'lucide-react';

// ============================================================
// TYPE OPTIONS
// ============================================================

const TYPE_OPTIONS = [
  {
    id: 'multiple',
    label: 'Pilihan Ganda',
  },
  {
    id: 'truefalse',
    label: 'Benar/Salah',
  },
  {
    id: 'multiselect',
    label: 'Pilih Lebih dari Satu',
  },
  {
    id: 'shortanswer',
    label: 'Isian Singkat',
  },
  {
    id: 'causeeffect',
    label: 'Sebab Akibat',
  },
  {
    id: 'matching',
    label: 'Menjodohkan',
  },
  {
    id: 'reading',
    label: 'Membaca Teks',
  },
];

const HOTS_OPTIONS = [
  {
    id: '',
    label: 'Standar',
  },
  {
    id: 'sedang',
    label: 'HOTS Sedang',
  },
  {
    id: 'tinggi',
    label: 'HOTS Tinggi',
  },
];

// ============================================================
// NORMALIZER
// ============================================================

const normalizeQuestion = (
  q,
  index
) => ({
  id:
    Date.now() +
    index +
    Math.floor(
      Math.random() * 1000
    ),

  type:
    q?.type ||
    'multiple',

  q:
    q?.question ||
    q?.q ||
    '',

  qImage:
    q?.qImage ||
    q?.questionImage ||
    '',

  options:
    Array.isArray(
      q?.options
    ) &&
    q.options.length
      ? q.options
      : ['', '', '', ''],

  optionImages:
    Array.isArray(
      q?.optionImages
    )
      ? q.optionImages
      : ['', '', '', ''],

  correct:
    typeof q?.correct ===
    'number'
      ? q.correct
      : typeof q?.correctAnswer ===
        'number'
      ? q.correctAnswer
      : 0,

  correctAnswers:
    Array.isArray(
      q?.correctAnswers
    )
      ? q.correctAnswers
      : [],

  explanation:
    q?.explanation ||
    '',

  statements:
    Array.isArray(
      q?.statements
    ) &&
    q.statements.length
      ? q.statements
      : [
          {
            text: '',
            isTrue: true,
          },
        ],

  readingText:
    q?.readingText ||
    '',

  subQuestions:
    Array.isArray(
      q?.subQuestions
    ) &&
    q.subQuestions.length
      ? q.subQuestions
      : [
          {
            q: '',
            options: [
              '',
              '',
              '',
              '',
            ],
            correct: 0,
          },
        ],

  shortAnswer:
    q?.shortAnswer ||
    '',

  cause:
    q?.cause ||
    '',

  effect:
    q?.effect ||
    '',

  isCauseTrue:
    typeof q?.isCauseTrue ===
    'boolean'
      ? q.isCauseTrue
      : true,

  isEffectTrue:
    typeof q?.isEffectTrue ===
    'boolean'
      ? q.isEffectTrue
      : true,

  matchingPairs:
    Array.isArray(
      q?.matchingPairs
    ) &&
    q.matchingPairs.length
      ? q.matchingPairs
      : [
          {
            left: '',
            right: '',
          },
          {
            left: '',
            right: '',
          },
        ],

  needsManualAnswer:
    false,

  optionsAreImages:
    Boolean(
      q?.optionsAreImages
    ),

  needsImage:
    Boolean(
      q?.needsImage
    ),

  imageHint:
    q?.imageHint ||
    '',

  imageSource:
    q?.imageSource ||
    null,

  researchBacked:
    Boolean(
      q?.researchBacked
    ),

  researchSources:
    Array.isArray(
      q?.researchSources
    )
      ? q.researchSources
      : [],

  visualRequired:
    Boolean(
      q?.visualRequired
    ),

  visualKind:
    q?.visualKind ||
    'none',
});

// ============================================================
// COMPONENT
// ============================================================

const AIGenerateQuiz = ({
  subject,
  onGenerated,
  onClose,
}) => {
  const [topic, setTopic] =
    useState('');

  const [kelas, setKelas] =
    useState('');

  const [jumlahSoal, setJumlahSoal] =
    useState(5);

  const [selectedTypes, setSelectedTypes] =
    useState(['multiple']);

  const [arahan, setArahan] =
    useState('');

  const [useTrendSearch, setUseTrendSearch] =
    useState(true);

  const [targetYear, setTargetYear] =
    useState(
      new Date().getFullYear() + 1
    );

  const [hotsLevel, setHotsLevel] =
    useState('');

  const [generating, setGenerating] =
    useState(false);

  const [statusLabel, setStatusLabel] =
    useState('');

  const [error, setError] =
    useState('');

  const [
    lastResearchSources,
    setLastResearchSources,
  ] = useState([]);

  // ============================================================
  // TYPE TOGGLE
  // ============================================================

  const toggleType = (
    typeId
  ) => {
    setSelectedTypes(
      (previous) =>
        previous.includes(typeId)
          ? previous.filter(
              (item) =>
                item !== typeId
            )
          : [
              ...previous,
              typeId,
            ]
    );
  };

  // ============================================================
  // SAFE GENERATE
  // ============================================================
  // Sengaja bukan `async function` dan bukan async component.
  // Request dijalankan melalui Promise chain.
  // ============================================================

  const handleGenerate = () => {
    setError('');
    setLastResearchSources([]);

    const cleanTopic =
      topic.trim();

    if (!cleanTopic) {
      setError(
        '❌ Topik/materi kuis wajib diisi!'
      );
      return;
    }

    if (
      selectedTypes.length === 0
    ) {
      setError(
        '❌ Pilih minimal 1 tipe soal!'
      );
      return;
    }

    const requestedCount =
      Number(jumlahSoal);

    if (
      !Number.isFinite(
        requestedCount
      ) ||
      requestedCount < 1 ||
      requestedCount > 10
    ) {
      setError(
        '❌ Untuk sementara jumlah per batch maksimal 10 soal.'
      );
      return;
    }

    setGenerating(true);

    setStatusLabel(
      useTrendSearch
        ? '🌐 Mencari dan menganalisis sumber soal di internet...'
        : '🤖 Gemini sedang menyusun soal...'
    );

    const payload = {
      topic:
        cleanTopic,

      mapel:
        subject || 'Umum',

      kelas:
        kelas.trim(),

      jumlahSoal:
        requestedCount,

      types:
        selectedTypes,

      arahan:
        arahan.trim(),

      useTrendSearch:
        Boolean(
          useTrendSearch
        ),

      targetYear:
        Number(targetYear) ||
        new Date().getFullYear() +
          1,

      hotsLevel:
        hotsLevel || '',
    };

    fetch(
      '/api/generateQuizFromTopic',
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify(
            payload
          ),
      }
    )
      .then(
        async (response) => {
          let data = null;

          try {
            data =
              await response.json();
          } catch (_) {
            data = null;
          }

          if (
            !response.ok ||
            !data?.success
          ) {
            let message =
              data?.error ||
              `Server gagal (${response.status})`;

            if (
              data?.debug
            ) {
              const debug =
                typeof data.debug ===
                'object'
                  ? JSON.stringify(
                      data.debug,
                      null,
                      2
                    )
                  : String(
                      data.debug
                    );

              message +=
                ` [debug: ${debug}]`;
            }

            const errorObject =
              new Error(
                message
              );

            errorObject.status =
              response.status;

            throw errorObject;
          }

          return data;
        }
      )

      .then(
        (data) => {
          const rawQuestions =
            Array.isArray(
              data.questions
            )
              ? data.questions
              : [];

          if (
            rawQuestions.length ===
            0
          ) {
            throw new Error(
              '❌ Server berhasil merespons, tetapi tidak ada soal yang dikembalikan.'
            );
          }

          const converted =
            rawQuestions.map(
              normalizeQuestion
            );

          if (
            Array.isArray(
              data.researchSources
            )
          ) {
            setLastResearchSources(
              data.researchSources
            );
          }

          if (
            typeof onGenerated ===
              'function'
          ) {
            onGenerated(
              converted
            );
          }

          if (
            data.possiblyTruncated
          ) {
            window.alert(
              `✅ ${converted.length} soal berhasil dibuat.\n\n` +
              `Catatan: server mengembalikan lebih sedikit dari jumlah yang diminta.`
            );
          }

          if (
            typeof onClose ===
            'function'
          ) {
            onClose();
          }
        }
      )

      .catch(
        (requestError) => {
          console.error(
            '[AIGenerateQuiz]',
            requestError
          );

          const message =
            requestError?.message ||
            'Gagal membuat soal.';

          setError(
            `❌ ${message}`
          );
        }
      )

      .finally(
        () => {
          setGenerating(false);
          setStatusLabel('');
        }
      );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      style={
        styles.overlay
      }
      onClick={
        !generating
          ? onClose
          : undefined
      }
    >
      <div
        style={
          styles.modal
        }
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* HEADER */}

        <div
          style={
            styles.header
          }
        >
          <div
            style={
              styles.headerTitle
            }
          >
            <Sparkles
              size={18}
              color="#f59e0b"
            />

            Generate Soal
            — Astro Gemilang
          </div>

          {!generating && (
            <button
              type="button"
              onClick={
                onClose
              }
              style={
                styles.closeBtn
              }
            >
              <X size={18} />
            </button>
          )}
        </div>

        {!generating ? (
          <>
            {/* TOPIK */}

            <div
              style={
                styles.field
              }
            >
              <label
                style={
                  styles.label
                }
              >
                📖 Topik/Materi
                Kuis{' '}
                <span
                  style={{
                    color:
                      '#ef4444',
                  }}
                >
                  *wajib
                </span>
              </label>

              <input
                value={topic}
                onChange={(event) =>
                  setTopic(
                    event.target
                      .value
                  )
                }
                placeholder="Contoh: Persamaan Linear"
                style={
                  styles.input
                }
              />
            </div>

            {/* KELAS + JUMLAH */}

            <div
              style={
                styles.row
              }
            >
              <div
                style={{
                  ...styles.field,
                  flex: 1,
                }}
              >
                <label
                  style={
                    styles.label
                  }
                >
                  🎓 Kelas/Jenjang
                </label>

                <input
                  value={kelas}
                  onChange={(
                    event
                  ) =>
                    setKelas(
                      event.target
                        .value
                    )
                  }
                  placeholder="Contoh: 9 SMP"
                  style={
                    styles.input
                  }
                />
              </div>

              <div
                style={{
                  ...styles.field,
                  width: 100,
                }}
              >
                <label
                  style={
                    styles.label
                  }
                >
                  🔢 Batch
                </label>

                <input
                  type="number"
                  min={1}
                  max={10}
                  value={
                    jumlahSoal
                  }
                  onChange={(
                    event
                  ) => {
                    const value =
                      Number(
                        event.target
                          .value
                      );

                    setJumlahSoal(
                      Math.min(
                        10,
                        Math.max(
                          1,
                          Number.isFinite(
                            value
                          )
                            ? value
                            : 1
                        )
                      )
                    );
                  }}
                  style={
                    styles.input
                  }
                />
              </div>
            </div>

            {/* TIPE */}

            <div
              style={
                styles.field
              }
            >
              <label
                style={
                  styles.label
                }
              >
                📋 Tipe Soal
              </label>

              <div
                style={
                  styles.typeGrid
                }
              >
                {TYPE_OPTIONS.map(
                  (type) => {
                    const active =
                      selectedTypes.includes(
                        type.id
                      );

                    return (
                      <button
                        key={
                          type.id
                        }
                        type="button"
                        onClick={() =>
                          toggleType(
                            type.id
                          )
                        }
                        style={{
                          ...styles.typeBtn,

                          background:
                            active
                              ? '#fef3c7'
                              : 'white',

                          border:
                            active
                              ? '2px solid #f59e0b'
                              : '1px solid #e2e8f0',

                          color:
                            active
                              ? '#b45309'
                              : '#64748b',
                        }}
                      >
                        {active
                          ? '✅ '
                          : ''}
                        {type.label}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* HOTS */}

            <div
              style={
                styles.field
              }
            >
              <label
                style={
                  styles.label
                }
              >
                <Brain
                  size={12}
                  style={{
                    display:
                      'inline',
                    marginRight: 4,
                    verticalAlign:
                      -2,
                  }}
                />
                Level Berpikir
                Kritis
              </label>

              <div
                style={{
                  display:
                    'flex',
                  gap: 6,
                  flexWrap:
                    'wrap',
                }}
              >
                {HOTS_OPTIONS.map(
                  (option) => {
                    const active =
                      hotsLevel ===
                      option.id;

                    return (
                      <button
                        key={
                          option.id
                        }
                        type="button"
                        onClick={() =>
                          setHotsLevel(
                            option.id
                          )
                        }
                        style={{
                          ...styles.hotsBtn,

                          background:
                            active
                              ? '#ede9fe'
                              : 'white',

                          border:
                            active
                              ? '2px solid #8b5cf6'
                              : '1px solid #e2e8f0',

                          color:
                            active
                              ? '#6d28d9'
                              : '#64748b',
                        }}
                      >
                        {
                          option.label
                        }
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* INTERNET RESEARCH */}

            <div
              style={
                styles.trendBox
              }
            >
              <label
                style={{
                  display:
                    'flex',
                  alignItems:
                    'flex-start',
                  gap: 8,
                  cursor:
                    'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={
                    useTrendSearch
                  }
                  onChange={(
                    event
                  ) =>
                    setUseTrendSearch(
                      event.target
                        .checked
                    )
                  }
                  style={{
                    marginTop: 2,
                  }}
                />

                <span
                  style={{
                    flex: 1,
                  }}
                >
                  <span
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap: 5,
                      fontSize:
                        12,
                      fontWeight: 800,
                      color:
                        '#1e293b',
                    }}
                  >
                    <Globe
                      size={
                        13
                      }
                      color="#2563eb"
                    />

                    Riset Internet
                  </span>

                  <span
                    style={{
                      fontSize:
                        10,
                      color:
                        '#475569',
                      lineHeight:
                        1.6,
                      display:
                        'block',
                      marginTop: 3,
                    }}
                  >
                    Sistem mencari
                    sumber soal
                    publik,
                    menganalisis
                    pola, lalu
                    membuat
                    latihan baru.
                    Bukan bocoran.
                  </span>
                </span>
              </label>

              <div
                style={{
                  marginTop: 10,
                  display:
                    'flex',
                  alignItems:
                    'center',
                  gap: 8,
                }}
              >
                <label
                  style={{
                    ...styles.label,
                    margin: 0,
                  }}
                >
                  🎯 Tahun target
                </label>

                <input
                  type="number"
                  min={
                    new Date().getFullYear()
                  }
                  max={
                    new Date().getFullYear() +
                    5
                  }
                  value={
                    targetYear
                  }
                  onChange={(
                    event
                  ) =>
                    setTargetYear(
                      Number(
                        event.target
                          .value
                      ) ||
                        new Date().getFullYear() +
                          1
                    )
                  }
                  style={{
                    ...styles.input,
                    width: 90,
                    padding: 8,
                  }}
                />
              </div>
            </div>

            {/* ARAHAN */}

            <div
              style={
                styles.field
              }
            >
              <label
                style={
                  styles.label
                }
              >
                📝 Arahan khusus
              </label>

              <textarea
                value={arahan}
                onChange={(event) =>
                  setArahan(
                    event.target
                      .value
                  )
                }
                placeholder="Contoh: fokus pada soal cerita dan analisis data"
                style={
                  styles.textarea
                }
              />
            </div>

            {/* ERROR */}

            {error && (
              <div
                style={
                  styles.errorBox
                }
              >
                <AlertCircle
                  size={14}
                />

                <span
                  style={{
                    whiteSpace:
                      'pre-wrap',
                    flex: 1,
                  }}
                >
                  {error}
                </span>
              </div>
            )}

            {/* SOURCES */}

            {lastResearchSources.length >
              0 && (
              <div
                style={
                  styles.sourcesBox
                }
              >
                <b>
                  🌐 Sumber riset:
                </b>

                <ul
                  style={{
                    margin:
                      '5px 0 0',
                    paddingLeft:
                      18,
                  }}
                >
                  {lastResearchSources.map(
                    (
                      source,
                      index
                    ) => (
                      <li
                        key={
                          index
                        }
                      >
                        {source?.url ? (
                          <a
                            href={
                              source.url
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color:
                                '#0369a1',
                            }}
                          >
                            {source.title ||
                              source.url}
                          </a>
                        ) : (
                          source?.title ||
                          'Sumber web'
                        )}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {/* GENERATE */}

            <button
              type="button"
              onClick={
                handleGenerate
              }
              disabled={
                generating
              }
              style={{
                ...styles.generateBtn,

                opacity:
                  generating
                    ? 0.6
                    : 1,
              }}
            >
              <Wand2
                size={16}
              />

              Generate Soal
            </button>

            <div
              style={
                styles.hintBox
              }
            >
              <FileQuestion
                size={13}
                color="#f59e0b"
              />

              <span>
                Generate dilakukan
                dalam batch kecil
                agar lebih stabil.
                Hasil tetap perlu
                diperiksa guru
                sebelum diterbitkan.
              </span>
            </div>
          </>
        ) : (
          <div
            style={
              styles.progressBox
            }
          >
            <Loader2
              size={34}
              color="#f59e0b"
              className="gemilang-spin"
            />

            <p
              style={
                styles.progressLabel
              }
            >
              {statusLabel}
            </p>

            <div
              style={
                styles.progressBarBg
              }
            >
              <div
                style={
                  styles.progressBar
                }
              />
            </div>

            <button
              type="button"
              disabled
              style={{
                ...styles.generateBtn,
                opacity: 0.5,
              }}
            >
              Sedang memproses...
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes gemilangSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .gemilang-spin {
          animation:
            gemilangSpin
            1s
            linear
            infinite;
        }
      `}</style>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background:
      'rgba(15,23,42,0.6)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },

  modal: {
    background: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow:
      '0 20px 50px rgba(0,0,0,0.3)',
  },

  header: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  closeBtn: {
    background:
      '#f1f5f9',
    border: 'none',
    borderRadius: 8,
    padding: 6,
    cursor: 'pointer',
  },

  field: {
    marginBottom: 14,
  },

  row: {
    display: 'flex',
    gap: 10,
  },

  label: {
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    display: 'block',
    marginBottom: 6,
  },

  input: {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    border:
      '1px solid #e2e8f0',
    fontSize: 13,
    outline: 'none',
    boxSizing:
      'border-box',
  },

  textarea: {
    width: '100%',
    minHeight: 70,
    padding: 10,
    borderRadius: 8,
    border:
      '1px solid #e2e8f0',
    fontSize: 13,
    outline: 'none',
    boxSizing:
      'border-box',
    resize: 'vertical',
    fontFamily:
      'inherit',
  },

  typeGrid: {
    display: 'grid',
    gridTemplateColumns:
      '1fr 1fr',
    gap: 6,
  },

  typeBtn: {
    padding:
      '8px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 700,
    textAlign: 'left',
  },

  hotsBtn: {
    padding:
      '8px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 700,
  },

  trendBox: {
    background:
      '#eff6ff',
    border:
      '1px solid #bfdbfe',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },

  errorBox: {
    background:
      '#fee2e2',
    color: '#b91c1c',
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
    display: 'flex',
    alignItems:
      'flex-start',
    gap: 6,
    marginBottom: 12,
    lineHeight: 1.5,
  },

  sourcesBox: {
    background:
      '#f0fdf4',
    border:
      '1px solid #bbf7d0',
    borderRadius: 8,
    padding: 10,
    fontSize: 10,
    color: '#166534',
    marginBottom: 12,
    lineHeight: 1.6,
  },

  generateBtn: {
    width: '100%',
    padding: 12,
    background:
      'linear-gradient(135deg,#f59e0b,#d97706)',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 8,
  },

  hintBox: {
    display: 'flex',
    gap: 6,
    fontSize: 10,
    color: '#64748b',
    marginTop: 12,
    lineHeight: 1.6,
    background:
      '#fffbeb',
    padding: 10,
    borderRadius: 8,
    border:
      '1px solid #fde68a',
  },

  progressBox: {
    display: 'flex',
    flexDirection:
      'column',
    alignItems: 'center',
    gap: 12,
    padding:
      '30px 0',
  },

  progressLabel: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    fontWeight: 600,
    lineHeight: 1.5,
  },

  progressBarBg: {
    width: '100%',
    height: 6,
    background:
      '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressBar: {
    width: '40%',
    height: '100%',
    background:
      'linear-gradient(90deg,#f59e0b,#d97706)',
    borderRadius: 4,
    animation:
      'gemilangSlide 1.4s ease-in-out infinite',
  },
};

export default AIGenerateQuiz;