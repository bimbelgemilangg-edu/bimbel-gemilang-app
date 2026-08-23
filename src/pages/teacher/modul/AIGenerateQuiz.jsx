// src/pages/teacher/modul/AIGenerateQuiz.jsx

import React, {
  useState,
} from 'react';

import {
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  Search,
  Brain,
  Globe2,
  BookOpen,
  TrendingUp,
  ShieldCheck,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react';

// ============================================================
// QUESTION TYPES
// ============================================================

const TYPE_OPTIONS = [
  {
    id: 'multiple',
    label: 'Pilihan Ganda',
    description:
      '4 pilihan jawaban',
  },

  {
    id: 'truefalse',
    label: 'Benar / Salah',
    description:
      'Beberapa pernyataan',
  },

  {
    id: 'multiselect',
    label: 'Pilih Lebih dari Satu',
    description:
      'Jawaban dapat lebih dari satu',
  },

  {
    id: 'shortanswer',
    label: 'Isian Singkat',
    description:
      'Jawaban pendek',
  },

  {
    id: 'causeeffect',
    label: 'Sebab Akibat',
    description:
      'Analisis hubungan',
  },

  {
    id: 'matching',
    label: 'Menjodohkan',
    description:
      'Pasangkan konsep',
  },

  {
    id: 'reading',
    label: 'Membaca Teks',
    description:
      'Bacaan + beberapa pertanyaan',
  },
];

// ============================================================
// RESEARCH MODES
// ============================================================

const RESEARCH_MODES = [
  {
    id: 'source',

    title:
      'Ambil Soal dari Internet',

    short:
      'Soal yang memang sudah dipublikasikan.',

    icon:
      BookOpen,

    badge:
      'SOURCE',
  },

  {
    id: 'prediction',

    title:
      'Prediksi Berbasis Tren',

    short:
      'Analisis banyak sumber lalu susun latihan baru.',

    icon:
      TrendingUp,

    badge:
      'PREDICTION',
  },
];

// ============================================================
// HOTS
// ============================================================

const HOTS_OPTIONS = [
  {
    id: '',
    label:
      'Standar',
  },

  {
    id: 'sedang',
    label:
      'HOTS Sedang',
  },

  {
    id: 'tinggi',
    label:
      'HOTS Tinggi',
  },
];

// ============================================================
// NORMALIZER
// ============================================================

const normalizeQuestion = (
  q,
  index,
  sourceMode
) => ({
  id:
    q?.id ||
    Date.now() +
      index +
      Math.floor(
        Math.random() *
          100000
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
    )
      ? q.options
      : [
          '',
          '',
          '',
          '',
        ],

  optionImages:
    Array.isArray(
      q?.optionImages
    )
      ? q.optionImages
      : [],

  optionsAreImages:
    Boolean(
      q?.optionsAreImages
    ),

  correct:
    Number.isInteger(
      q?.correct
    )
      ? q.correct
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

  answerVerification:
    q?.answerVerification ||
    '',

  analysisSummary:
    q?.analysisSummary ||
    '',

  statements:
    Array.isArray(
      q?.statements
    )
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
    )
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
    )
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
          {
            left: '',
            right: '',
          },
        ],

  needsManualAnswer:
    false,

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

  visualRequired:
    Boolean(
      q?.visualRequired
    ),

  visualKind:
    q?.visualKind ||
    'none',

  researchBacked:
    true,

  researchSources:
    Array.isArray(
      q?.researchSources
    )
      ? q.researchSources
      : [],

  sourceMode:
    q?.sourceMode ||
    sourceMode,

  sourceIndex:
    Number.isInteger(
      q?.sourceIndex
    )
      ? q.sourceIndex
      : null,

  sourceTitle:
    q?.sourceTitle ||
    '',

  sourceUrl:
    q?.sourceUrl ||
    '',

  sourceQuestionVerbatim:
    Boolean(
      q?.sourceQuestionVerbatim
    ),

  sourceEvidenceScore:
    typeof q?.sourceEvidenceScore ===
    'number'
      ? q.sourceEvidenceScore
      : null,
});

// ============================================================
// COMPONENT
// ============================================================

const AIGenerateQuiz = ({
  subject,
  onGenerated,
  onClose,
}) => {
  const [
    topic,
    setTopic,
  ] = useState('');

  const [
    kelas,
    setKelas,
  ] = useState('');

  const [
    jumlahSoal,
    setJumlahSoal,
  ] = useState(10);

  const [
    researchMode,
    setResearchMode,
  ] = useState(
    'source'
  );

  const [
    selectedTypes,
    setSelectedTypes,
  ] = useState([
    'multiple',
  ]);

  const [
    targetYear,
    setTargetYear,
  ] = useState(
    new Date().getFullYear() +
      1
  );

  const [
    hotsLevel,
    setHotsLevel,
  ] = useState('');

  const [
    arahan,
    setArahan,
  ] = useState('');

  const [
    generating,
    setGenerating,
  ] = useState(false);

  const [
    statusLabel,
    setStatusLabel,
  ] = useState('');

  const [
    progressStage,
    setProgressStage,
  ] = useState(0);

  const [
    error,
    setError,
  ] = useState('');

  const [
    sources,
    setSources,
  ] = useState([]);

  const [
    diagnostics,
    setDiagnostics,
  ] = useState(null);

  // ==========================================================
  // TOGGLE TYPE
  // ==========================================================

  const toggleType = (
    typeId
  ) => {
    setSelectedTypes(
      (previous) =>
        previous.includes(
          typeId
        )
          ? previous.filter(
              (item) =>
                item !==
                typeId
            )
          : [
              ...previous,
              typeId,
            ]
    );
  };

  // ==========================================================
  // GENERATE
  // ==========================================================

  const handleGenerate =
    async () => {
      setError('');
      setSources([]);
      setDiagnostics(null);

      if (
        !topic.trim()
      ) {
        setError(
          'Topik atau materi wajib diisi.'
        );
        return;
      }

      if (
        selectedTypes.length ===
        0
      ) {
        setError(
          'Pilih minimal satu tipe soal.'
        );
        return;
      }

      const total =
        Math.min(
          20,
          Math.max(
            1,
            Number(
              jumlahSoal
            ) || 10
          )
        );

      setGenerating(true);
      setProgressStage(1);

      setStatusLabel(
        'Membaca permintaan guru dan menyiapkan riset...'
      );

      try {
        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              350
            )
        );

        setProgressStage(2);

        setStatusLabel(
          '🔎 Mencari sumber soal publik di internet...'
        );

        const response =
          await fetch(
            '/api/generateQuizFromTopic',
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  topic:
                    topic.trim(),

                  mapel:
                    subject ||
                    'Umum',

                  kelas:
                    kelas.trim(),

                  jumlahSoal:
                    total,

                  types:
                    selectedTypes,

                  arahan:
                    arahan.trim(),

                  sourceMode:
                    researchMode,

                  useTrendSearch:
                    true,

                  targetYear:
                    Number(
                      targetYear
                    ) ||
                    new Date().getFullYear() +
                      1,

                  hotsLevel:
                    hotsLevel ||
                    '',
                }),
            }
          );

        setProgressStage(3);

        setStatusLabel(
          '🧠 Menganalisis sumber, memverifikasi soal, dan menyiapkan pembahasan...'
        );

        let data =
          null;

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
          const debugText =
            data?.debug &&
            typeof data.debug ===
              'object'
              ? JSON.stringify(
                  data.debug,
                  null,
                  2
                )
              : data?.debug;

          throw new Error(
            `${data?.error || `Server error (${response.status})`}${
              debugText
                ? `\n${debugText}`
                : ''
            }`
          );
        }

        setProgressStage(4);

        const generated =
          Array.isArray(
            data.questions
          )
            ? data.questions
            : [];

        if (
          generated.length ===
          0
        ) {
          throw new Error(
            'Tidak ada soal yang lolos quality gate.'
          );
        }

        const converted =
          generated.map(
            (
              question,
              index
            ) =>
              normalizeQuestion(
                question,
                index,
                researchMode
              )
          );

        setSources(
          Array.isArray(
            data.researchSources
          )
            ? data.researchSources
            : []
        );

        setDiagnostics(
          data.diagnostics ||
            null
        );

        setStatusLabel(
          `✅ ${converted.length} soal siap masuk ke editor.`
        );

        if (
          typeof onGenerated ===
          'function'
        ) {
          onGenerated(
            converted
          );
        }

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              600
            )
        );

        if (
          typeof onClose ===
          'function'
        ) {
          onClose();
        }
      } catch (
        requestError
      ) {
        console.error(
          '[Asisten Soal Gemilang]',
          requestError
        );

        setError(
          requestError?.message ||
            'Gagal melakukan riset dan generate soal.'
        );

        setStatusLabel(
          ''
        );
      } finally {
        setGenerating(
          false
        );
      }
    };

  // ==========================================================
  // RENDER
  // ==========================================================

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
        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          style={
            styles.header
          }
        >
          <div>
            <div
              style={
                styles.brand
              }
            >
              <div
                style={
                  styles.logo
                }
              >
                <Sparkles
                  size={18}
                  color="white"
                />
              </div>

              <div>
                <div
                  style={
                    styles.title
                  }
                >
                  Asisten Soal Gemilang
                </div>

                <div
                  style={
                    styles.subtitle
                  }
                >
                  Research & Question Assistant
                </div>
              </div>
            </div>
          </div>

          {!generating && (
            <button
              type="button"
              onClick={
                onClose
              }
              style={
                styles.close
              }
            >
              <X
                size={18}
              />
            </button>
          )}
        </div>

        {!generating ? (
          <>
            {/* ==================================================
                RESEARCH STATUS
            ================================================== */}

            <div
              style={
                styles.researchBanner
              }
            >
              <div
                style={
                  styles.bannerIcon
                }
              >
                <Globe2
                  size={17}
                />
              </div>

              <div
                style={{
                  flex: 1,
                }}
              >
                <div
                  style={
                    styles.bannerTitle
                  }
                >
                  Riset internet selalu aktif
                </div>

                <div
                  style={
                    styles.bannerText
                  }
                >
                  Soal tidak dibuat
                  secara acak. Gemilang
                  terlebih dahulu mencari
                  dan membaca sumber
                  soal publik, kemudian
                  menganalisis kunci,
                  pembahasan, dan
                  stimulusnya.
                </div>
              </div>

              <ShieldCheck
                size={19}
                color="#16a34a"
              />
            </div>

            {/* ==================================================
                TOPIC
            ================================================== */}

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
                TOPIK / MATERI
                <span
                  style={
                    styles.required
                  }
                >
                  *
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
                placeholder="Contoh: TKA Matematika — Pecahan"
                style={
                  styles.input
                }
              />
            </div>

            {/* ==================================================
                KELAS + JUMLAH
            ================================================== */}

            <div
              style={
                styles.twoColumn
              }
            >
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
                  JENJANG / KELAS
                </label>

                <input
                  value={kelas}
                  onChange={(event) =>
                    setKelas(
                      event.target
                        .value
                    )
                  }
                  placeholder="Contoh: Kelas 6 SD"
                  style={
                    styles.input
                  }
                />
              </div>

              <div
                style={{
                  ...styles.field,
                  maxWidth: 120,
                }}
              >
                <label
                  style={
                    styles.label
                  }
                >
                  JUMLAH
                </label>

                <input
                  type="number"
                  min={1}
                  max={20}
                  value={
                    jumlahSoal
                  }
                  onChange={(event) =>
                    setJumlahSoal(
                      Math.min(
                        20,
                        Math.max(
                          1,
                          Number(
                            event
                              .target
                              .value
                          ) ||
                            1
                        )
                      )
                    )
                  }
                  style={
                    styles.input
                  }
                />
              </div>
            </div>

            {/* ==================================================
                RESEARCH MODE
            ================================================== */}

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
                STRATEGI SOAL
              </label>

              <div
                style={
                  styles.modeGrid
                }
              >
                {RESEARCH_MODES.map(
                  (mode) => {
                    const Icon =
                      mode.icon;

                    const active =
                      researchMode ===
                      mode.id;

                    return (
                      <button
                        key={
                          mode.id
                        }
                        type="button"
                        onClick={() =>
                          setResearchMode(
                            mode.id
                          )
                        }
                        style={{
                          ...styles.modeCard,
                          border:
                            active
                              ? '2px solid #2563eb'
                              : '1px solid #e2e8f0',
                          background:
                            active
                              ? '#eff6ff'
                              : 'white',
                        }}
                      >
                        <div
                          style={{
                            display:
                              'flex',
                            gap: 9,
                            alignItems:
                              'flex-start',
                          }}
                        >
                          <div
                            style={{
                              ...styles.modeIcon,
                              background:
                                active
                                  ? '#2563eb'
                                  : '#f1f5f9',
                              color:
                                active
                                  ? 'white'
                                  : '#64748b',
                            }}
                          >
                            <Icon
                              size={
                                16
                              }
                            />
                          </div>

                          <div
                            style={{
                              flex: 1,
                              textAlign:
                                'left',
                            }}
                          >
                            <div
                              style={
                                styles.modeTitle
                              }
                            >
                              {
                                mode.title
                              }
                            </div>

                            <div
                              style={
                                styles.modeDescription
                              }
                            >
                              {
                                mode.short
                              }
                            </div>
                          </div>

                          {active && (
                            <CheckCircle2
                              size={
                                17
                              }
                              color="#2563eb"
                            />
                          )}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* ==================================================
                TARGET YEAR
            ================================================== */}

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
                TARGET LATIHAN
              </label>

              <div
                style={
                  styles.yearBox
                }
              >
                <TrendingUp
                  size={15}
                  color="#2563eb"
                />

                <span
                  style={{
                    fontSize:
                      11,
                    color:
                      '#475569',
                  }}
                >
                  Digunakan sebagai
                  konteks tren, bukan
                  jaminan soal ujian.
                </span>

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
                  onChange={(event) =>
                    setTargetYear(
                      Number(
                        event.target
                          .value
                      ) ||
                        new Date().getFullYear() +
                          1
                    )
                  }
                  style={
                    styles.yearInput
                  }
                />
              </div>
            </div>

            {/* ==================================================
                TYPES
            ================================================== */}

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
                TIPE SOAL
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
                        type="button"
                        key={
                          type.id
                        }
                        onClick={() =>
                          toggleType(
                            type.id
                          )
                        }
                        style={{
                          ...styles.typeButton,
                          background:
                            active
                              ? '#eff6ff'
                              : 'white',
                          border:
                            active
                              ? '2px solid #2563eb'
                              : '1px solid #e2e8f0',
                          color:
                            active
                              ? '#1d4ed8'
                              : '#64748b',
                        }}
                      >
                        <div
                          style={
                            styles.typeButtonTitle
                          }
                        >
                          {active
                            ? '✓ '
                            : ''}
                          {
                            type.label
                          }
                        </div>

                        <div
                          style={
                            styles.typeButtonDescription
                          }
                        >
                          {
                            type.description
                          }
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* ==================================================
                HOTS
            ================================================== */}

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
                LEVEL BERPIKIR
              </label>

              <div
                style={
                  styles.hotsRow
                }
              >
                {HOTS_OPTIONS.map(
                  (option) => {
                    const active =
                      hotsLevel ===
                      option.id;

                    return (
                      <button
                        type="button"
                        key={
                          option.id
                        }
                        onClick={() =>
                          setHotsLevel(
                            option.id
                          )
                        }
                        style={{
                          ...styles.hotsButton,
                          background:
                            active
                              ? '#f5f3ff'
                              : 'white',
                          border:
                            active
                              ? '2px solid #7c3aed'
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

            {/* ==================================================
                TEACHER DIRECTION
            ================================================== */}

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
                ARAHAN GURU
                <span
                  style={
                    styles.optional
                  }
                >
                  opsional
                </span>
              </label>

              <textarea
                value={arahan}
                onChange={(event) =>
                  setArahan(
                    event.target
                      .value
                  )
                }
                placeholder={
                  researchMode ===
                  'prediction'
                    ? 'Contoh: carikan pola yang sering muncul dan prioritaskan HOTS + soal bergambar untuk persiapan TKA 2027.'
                    : 'Contoh: ambil soal tentang pecahan, utamakan soal cerita dan soal dengan visual.'
                }
                style={
                  styles.textarea
                }
              />
            </div>

            {/* ==================================================
                ERROR
            ================================================== */}

            {error && (
              <div
                style={
                  styles.error
                }
              >
                <AlertCircle
                  size={16}
                  style={{
                    flexShrink: 0,
                  }}
                />

                <div
                  style={{
                    whiteSpace:
                      'pre-wrap',
                  }}
                >
                  {error}
                </div>
              </div>
            )}

            {/* ==================================================
                SOURCES
            ================================================== */}

            {sources.length >
              0 && (
              <div
                style={
                  styles.sourceBox
                }
              >
                <div
                  style={
                    styles.sourceHeader
                  }
                >
                  <Globe2
                    size={14}
                    color="#166534"
                  />

                  <b>
                    Sumber riset yang
                    digunakan
                  </b>
                </div>

                <div
                  style={{
                    display:
                      'flex',
                    flexDirection:
                      'column',
                    gap: 3,
                  }}
                >
                  {sources
                    .slice(
                      0,
                      6
                    )
                    .map(
                      (
                        source,
                        index
                      ) => (
                        <a
                          key={
                            index
                          }
                          href={
                            source?.url ||
                            '#'
                          }
                          target="_blank"
                          rel="noreferrer"
                          style={
                            styles.sourceLink
                          }
                        >
                          {source?.title ||
                            source?.url ||
                            `Sumber ${
                              index +
                              1
                            }`}
                        </a>
                      )
                    )}
                </div>
              </div>
            )}

            {/* ==================================================
                GENERATE
            ================================================== */}

            <button
              type="button"
              onClick={
                handleGenerate
              }
              style={
                styles.generateButton
              }
            >
              <Search
                size={17}
              />

              {researchMode ===
              'source'
                ? 'Cari & Masukkan Soal'
                : 'Riset & Susun Prediksi'}
            </button>

            <div
              style={
                styles.footerNote
              }
            >
              <ShieldCheck
                size={14}
                color="#16a34a"
              />

              <span>
                Setiap hasil tetap
                masuk ke editor guru
                untuk ditinjau sebelum
                diterbitkan kepada siswa.
              </span>
            </div>
          </>
        ) : (
          /* ======================================================
             PROGRESS
          ====================================================== */

          <div
            style={
              styles.progress
            }
          >
            <div
              style={
                styles.progressLogo
              }
            >
              <Sparkles
                size={25}
                color="white"
              />
            </div>

            <div
              style={
                styles.progressTitle
              }
            >
              Asisten Soal Gemilang
            </div>

            <div
              style={
                styles.progressLabel
              }
            >
              {statusLabel ||
                'Memproses...'}
            </div>

            <div
              style={
                styles.steps
              }
            >
              {[
                'Riset',
                'Seleksi',
                'Verifikasi',
                'Siap',
              ].map(
                (
                  label,
                  index
                ) => {
                  const active =
                    progressStage >=
                    index + 1;

                  return (
                    <div
                      key={
                        label
                      }
                      style={
                        styles.step
                      }
                    >
                      <div
                        style={{
                          ...styles.stepCircle,
                          background:
                            active
                              ? '#2563eb'
                              : '#e2e8f0',
                          color:
                            active
                              ? 'white'
                              : '#94a3b8',
                        }}
                      >
                        {active
                          ? '✓'
                          : index +
                            1}
                      </div>

                      <span
                        style={{
                          color:
                            active
                              ? '#1e293b'
                              : '#94a3b8',
                          fontWeight:
                            active
                              ? 700
                              : 500,
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  );
                }
              )}
            </div>

            <Loader2
              size={30}
              color="#2563eb"
              className="gemilang-ai-spin"
            />

            <div
              style={
                styles.progressHint
              }
            >
              Gemilang sedang
              membaca sumber,
              menyaring duplikat,
              memverifikasi jawaban,
              dan menyiapkan
              pembahasan.
            </div>

            <style>{`
              @keyframes gemilangAiSpin {
                from {
                  transform: rotate(0deg);
                }

                to {
                  transform: rotate(360deg);
                }
              }

              .gemilang-ai-spin {
                animation:
                  gemilangAiSpin
                  1s linear infinite;
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================

const styles = {
  overlay: {
    position:
      'fixed',

    inset: 0,

    background:
      'rgba(15,23,42,.68)',

    backdropFilter:
      'blur(4px)',

    zIndex: 9999,

    display:
      'flex',

    alignItems:
      'center',

    justifyContent:
      'center',

    padding: 16,
  },

  modal: {
    width:
      '100%',

    maxWidth:
      620,

    maxHeight:
      '93vh',

    overflowY:
      'auto',

    background:
      'white',

    borderRadius:
      20,

    boxShadow:
      '0 30px 90px rgba(0,0,0,.28)',

    padding:
      22,
  },

  header: {
    display:
      'flex',

    justifyContent:
      'space-between',

    alignItems:
      'flex-start',

    marginBottom:
      18,
  },

  brand: {
    display:
      'flex',

    gap: 10,

    alignItems:
      'center',
  },

  logo: {
    width:
      38,

    height:
      38,

    borderRadius:
      11,

    display:
      'flex',

    alignItems:
      'center',

    justifyContent:
      'center',

    background:
      'linear-gradient(135deg,#2563eb,#4f46e5)',

    boxShadow:
      '0 5px 15px rgba(37,99,235,.22)',
  },

  title: {
    fontSize:
      16,

    fontWeight:
      800,

    color:
      '#0f172a',
  },

  subtitle: {
    fontSize:
      10,

    color:
      '#64748b',

    marginTop:
      2,
  },

  close: {
    border:
      'none',

    background:
      '#f1f5f9',

    color:
      '#64748b',

    borderRadius:
      9,

    padding:
      7,

    cursor:
      'pointer',
  },

  researchBanner: {
    display:
      'flex',

    alignItems:
      'flex-start',

    gap: 10,

    padding:
      13,

    borderRadius:
      12,

    background:
      '#eff6ff',

    border:
      '1px solid #bfdbfe',

    marginBottom:
      18,
  },

  bannerIcon: {
    width:
      30,

    height:
      30,

    borderRadius:
      9,

    display:
      'flex',

    alignItems:
      'center',

    justifyContent:
      'center',

    background:
      '#2563eb',

    color:
      'white',

    flexShrink:
      0,
  },

  bannerTitle: {
    fontSize:
      11,

    fontWeight:
      800,

    color:
      '#1e3a8a',

    marginBottom:
      3,
  },

  bannerText: {
    fontSize:
      10,

    color:
      '#475569',

    lineHeight:
      1.5,
  },

  field: {
    marginBottom:
      15,
  },

  label: {
    display:
      'flex',

    alignItems:
      'center',

    gap: 5,

    fontSize:
      10,

    fontWeight:
      800,

    color:
      '#64748b',

    letterSpacing:
      '.03em',

    marginBottom:
      6,
  },

  required: {
    color:
      '#dc2626',
  },

  optional: {
    fontWeight:
      500,

    color:
      '#94a3b8',

    marginLeft:
      3,

    letterSpacing:
      0,
  },

  input: {
    width:
      '100%',

    boxSizing:
      'border-box',

    padding:
      '11px 12px',

    border:
      '1px solid #dbe3ef',

    borderRadius:
      9,

    outline:
      'none',

    fontSize:
      12,

    color:
      '#1e293b',

    background:
      'white',
  },

  textarea: {
    width:
      '100%',

    minHeight:
      82,

    boxSizing:
      'border-box',

    resize:
      'vertical',

    padding:
      11,

    border:
      '1px solid #dbe3ef',

    borderRadius:
      9,

    outline:
      'none',

    fontFamily:
      'inherit',

    fontSize:
      12,

    lineHeight:
      1.5,
  },

  twoColumn: {
    display:
      'grid',

    gridTemplateColumns:
      '1fr 120px',

    gap: 10,
  },

  modeGrid: {
    display:
      'grid',

    gridTemplateColumns:
      '1fr 1fr',

    gap: 9,
  },

  modeCard: {
    padding:
      11,

    borderRadius:
      11,

    cursor:
      'pointer',

    textAlign:
      'left',
  },

  modeIcon: {
    width:
      30,

    height:
      30,

    borderRadius:
      8,

    display:
      'flex',

    alignItems:
      'center',

    justifyContent:
      'center',

    flexShrink:
      0,
  },

  modeTitle: {
    fontSize:
      11,

    fontWeight:
      800,

    color:
      '#1e293b',

    marginBottom:
      3,
  },

  modeDescription: {
    fontSize:
      9,

    color:
      '#64748b',

    lineHeight:
      1.45,
  },

  yearBox: {
    display:
      'flex',

    alignItems:
      'center',

    gap: 8,

    padding:
      '9px 11px',

    border:
      '1px solid #dbe3ef',

    borderRadius:
      9,

    background:
      '#f8fafc',
  },

  yearInput: {
    marginLeft:
      'auto',

    width: 75,

    border:
      '1px solid #cbd5e1',

    borderRadius:
      7,

    padding:
      '6px 8px',

    fontSize:
      11,

    outline:
      'none',

    background:
      'white',
  },

  typeGrid: {
    display:
      'grid',

    gridTemplateColumns:
      '1fr 1fr',

    gap: 7,
  },

  typeButton: {
    borderRadius:
      9,

    padding:
      '9px 10px',

    textAlign:
      'left',

    cursor:
      'pointer',
  },

  typeButtonTitle: {
    fontSize:
      10,

    fontWeight:
      800,

    marginBottom:
      2,
  },

  typeButtonDescription: {
    fontSize:
      9,

    color:
      '#94a3b8',
  },

  hotsRow: {
    display:
      'flex',

    flexWrap:
      'wrap',

    gap: 6,
  },

  hotsButton: {
    borderRadius:
      8,

    padding:
      '8px 12px',

    cursor:
      'pointer',

    fontSize:
      10,

    fontWeight:
      700,
  },

  error: {
    display:
      'flex',

    gap: 8,

    padding:
      11,

    background:
      '#fef2f2',

    color:
      '#b91c1c',

    border:
      '1px solid #fecaca',

    borderRadius:
      9,

    fontSize:
      10,

    lineHeight:
      1.5,

    marginBottom:
      12,
  },

  sourceBox: {
    padding:
      11,

    background:
      '#f0fdf4',

    border:
      '1px solid #bbf7d0',

    borderRadius:
      10,

    marginBottom:
      12,
  },

  sourceHeader: {
    display:
      'flex',

    alignItems:
      'center',

    gap: 6,

    fontSize:
      10,

    color:
      '#166534',

    marginBottom:
      6,
  },

  sourceLink: {
    display:
      'block',

    fontSize:
      9,

    color:
      '#0369a1',

    whiteSpace:
      'nowrap',

    overflow:
      'hidden',

    textOverflow:
      'ellipsis',

    textDecoration:
      'none',
  },

  generateButton: {
    width:
      '100%',

    border:
      'none',

    borderRadius:
      11,

    padding:
      13,

    background:
      'linear-gradient(135deg,#2563eb,#4f46e5)',

    color:
      'white',

    fontSize:
      12,

    fontWeight:
      800,

    cursor:
      'pointer',

    display:
      'flex',

    justifyContent:
      'center',

    alignItems:
      'center',

    gap: 8,

    boxShadow:
      '0 7px 20px rgba(37,99,235,.2)',
  },

  footerNote: {
    display:
      'flex',

    gap: 6,

    alignItems:
      'flex-start',

    marginTop:
      10,

    padding:
      '9px 10px',

    background:
      '#f8fafc',

    borderRadius:
      8,

    fontSize:
      9,

    color:
      '#64748b',

    lineHeight:
      1.5,
  },

  progress: {
    minHeight:
      420,

    display:
      'flex',

    flexDirection:
      'column',

    alignItems:
      'center',

    justifyContent:
      'center',

    textAlign:
      'center',

    gap: 12,
  },

  progressLogo: {
    width:
      58,

    height:
      58,

    borderRadius:
      17,

    display:
      'flex',

    alignItems:
      'center',

    justifyContent:
      'center',

    background:
      'linear-gradient(135deg,#2563eb,#4f46e5)',

    boxShadow:
      '0 10px 25px rgba(37,99,235,.22)',
  },

  progressTitle: {
    fontSize:
      15,

    fontWeight:
      800,

    color:
      '#0f172a',
  },

  progressLabel: {
    maxWidth:
      430,

    fontSize:
      12,

    color:
      '#475569',

    fontWeight:
      600,

    lineHeight:
      1.5,
  },

  steps: {
    display:
      'grid',

    gridTemplateColumns:
      'repeat(4,1fr)',

    width:
      '100%',

    maxWidth:
      480,

    margin:
      '12px 0',
  },

  step: {
    display:
      'flex',

    flexDirection:
      'column',

    alignItems:
      'center',

    gap: 5,

    fontSize:
      9,
  },

  stepCircle: {
    width:
      26,

    height:
      26,

    borderRadius:
      '50%',

    display:
      'flex',

    alignItems:
      'center',

    justifyContent:
      'center',

    fontSize:
      10,

    fontWeight:
      800,
  },

  progressHint: {
    maxWidth:
      390,

    fontSize:
      10,

    color:
      '#94a3b8',

    lineHeight:
      1.6,
  },
};

export default AIGenerateQuiz;