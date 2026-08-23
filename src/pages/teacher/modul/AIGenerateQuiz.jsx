// src/pages/teacher/modul/AIGenerateQuiz.jsx

import React, {
  useState,
} from 'react';

import {
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  Wand2,
  Globe,
  Brain,
  CheckCircle,
} from 'lucide-react';

// ============================================================
// TYPES
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

const SOURCE_MODES = [
  {
    id: 'source',
    title:
      '📚 Ambil Soal dari Internet',
    description:
      'Cari soal yang benar-benar sudah dipublikasikan. Soal boleh berulang.',
  },
  {
    id: 'prediction',
    title:
      '🔮 Prediksi Berbasis Tren Internet',
    description:
      'Cari banyak sumber → analisis pola → susun latihan baru.',
  },
];

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

  const [targetCount, setTargetCount] =
    useState(40);

  const [selectedTypes, setSelectedTypes] =
    useState(['multiple']);

  const [sourceMode, setSourceMode] =
    useState('source');

  const [targetYear, setTargetYear] =
    useState(
      new Date().getFullYear() +
        1
    );

  const [hotsLevel, setHotsLevel] =
    useState('');

  const [arahan, setArahan] =
    useState('');

  const [generating, setGenerating] =
    useState(false);

  const [progress, setProgress] =
    useState({
      done: 0,
      total: 40,
    });

  const [status, setStatus] =
    useState('');

  const [error, setError] =
    useState('');

  // ==========================================================
  // TYPE
  // ==========================================================

  const toggleType = (
    id
  ) => {
    setSelectedTypes(
      (previous) =>
        previous.includes(id)
          ? previous.filter(
              (x) =>
                x !== id
            )
          : [
              ...previous,
              id,
            ]
    );
  };

  // ==========================================================
  // CONVERSION
  // ==========================================================

  const convertQuestion = (
    q,
    index
  ) => ({
    id:
      Date.now() +
      index +
      Math.floor(
        Math.random() *
          100000
      ),

    type:
      q.type ||
      'multiple',

    q:
      q.question ||
      '',

    qImage:
      q.qImage ||
      '',

    options:
      Array.isArray(
        q.options
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
        q.optionImages
      )
        ? q.optionImages
        : [],

    optionsAreImages:
      Boolean(
        q.optionsAreImages
      ),

    correct:
      typeof q.correct ===
      'number'
        ? q.correct
        : 0,

    correctAnswers:
      Array.isArray(
        q.correctAnswers
      )
        ? q.correctAnswers
        : [],

    explanation:
      q.explanation ||
      '',

    answerVerification:
      q.answerVerification ||
      '',

    analysisSummary:
      q.analysisSummary ||
      '',

    statements:
      Array.isArray(
        q.statements
      )
        ? q.statements
        : [],

    readingText:
      q.readingText ||
      '',

    subQuestions:
      Array.isArray(
        q.subQuestions
      )
        ? q.subQuestions
        : [],

    shortAnswer:
      q.shortAnswer ||
      '',

    cause:
      q.cause ||
      '',

    effect:
      q.effect ||
      '',

    isCauseTrue:
      typeof q.isCauseTrue ===
      'boolean'
        ? q.isCauseTrue
        : true,

    isEffectTrue:
      typeof q.isEffectTrue ===
      'boolean'
        ? q.isEffectTrue
        : true,

    matchingPairs:
      Array.isArray(
        q.matchingPairs
      )
        ? q.matchingPairs
        : [],

    needsManualAnswer:
      false,

    needsImage:
      Boolean(
        q.needsImage
      ),

    imageHint:
      q.imageHint ||
      '',

    imageSource:
      q.imageSource ||
      null,

    researchBacked:
      true,

    researchSources:
      Array.isArray(
        q.researchSources
      )
        ? q.researchSources
        : [],

    sourceMode:
      q.sourceMode ||
      sourceMode,

    sourceQuestionVerbatim:
      Boolean(
        q.sourceQuestionVerbatim
      ),

    sourceTitle:
      q.sourceTitle ||
      '',

    sourceUrl:
      q.sourceUrl ||
      '',

    visualRequired:
      Boolean(
        q.visualRequired
      ),

    visualKind:
      q.visualKind ||
      'none',
  });

  // ==========================================================
  // GENERATE BATCH
  // ==========================================================

  const generateBatch =
    (
      batchSize,
      doneBefore
    ) => {
      setStatus(
        sourceMode ===
          'source'
          ? `🔎 Mencari soal publik ${doneBefore + 1}–${doneBefore + batchSize}...`
          : `🧠 Menganalisis tren dan menyusun prediksi ${doneBefore + 1}–${doneBefore + batchSize}...`
      );

      return fetch(
        '/api/generateQuizFromTopic',
        {
          method: 'POST',

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
                batchSize,

              types:
                selectedTypes,

              arahan:
                arahan.trim(),

              targetYear:
                Number(
                  targetYear
                ),

              hotsLevel,

              sourceMode,
            }),
        }
      ).then(
        async (response) => {
          let data =
            null;

          try {
            data =
              await response.json();
          } catch (_) {}

          if (
            !response.ok ||
            !data?.success
          ) {
            const debug =
              typeof data?.debug ===
              'object'
                ? JSON.stringify(
                    data.debug,
                    null,
                    2
                  )
                : data?.debug;

            throw new Error(
              `${data?.error || `Server ${response.status}`}${
                debug
                  ? `\n${debug}`
                  : ''
              }`
            );
          }

          return data;
        }
      );
    };

  // ==========================================================
  // MAIN
  // ==========================================================

  const handleGenerate = () => {
    setError('');

    if (
      !topic.trim()
    ) {
      setError(
        '❌ Topik wajib diisi.'
      );
      return;
    }

    if (
      selectedTypes.length ===
      0
    ) {
      setError(
        '❌ Pilih minimal satu tipe soal.'
      );
      return;
    }

    const total =
      Math.min(
        100,
        Math.max(
          1,
          Number(
            targetCount
          ) || 40
        )
      );

    setGenerating(
      true
    );

    setProgress({
      done: 0,
      total,
    });

    let done = 0;
    const seenFingerprints = new Set();

    const runNext =
      () => {
        if (
          done >=
          total
        ) {
          setStatus(
            '✅ Semua batch selesai.'
          );

          setTimeout(
            () => {
              setGenerating(
                false
              );

              if (
                typeof onClose ===
                'function'
              ) {
                onClose();
              }
            },
            500
          );

          return;
        }

        const size =
          Math.min(
            10,
            total -
              done
          );

        generateBatch(
          size,
          done
        )
          .then(
            (data) => {
              const questions =
                Array.isArray(
                  data.questions
                )
                  ? data.questions
                  : [];

              if (
                questions.length ===
                0
              ) {
                throw new Error(
                  'Batch berhasil diproses tetapi tidak menghasilkan soal.'
                );
              }

              const converted = questions
                .map((question, index) =>
                  convertQuestion(question, done + index)
                )
                .filter((question) => {
                  const key = `${question.type}|${String(question.q || '')
                    .toLowerCase()
                    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()}`;
                  if (!key || seenFingerprints.has(key)) return false;
                  seenFingerprints.add(key);
                  return true;
                });

              // LANGSUNG masukkan ke ManageQuiz.
              if (typeof onGenerated === 'function' && converted.length > 0) {
                onGenerated(converted);
              }

              done += converted.length;
              setProgress({ done, total });

              // Jangan mengulang batch tanpa batas jika source mode
              // tidak menemukan soal baru.
              if (converted.length === 0) {
                setStatus(`⚠️ Tidak ada soal baru yang lolos dedup pada batch ini (${done}/${total}).`);
                setGenerating(false);
                return;
              }

              runNext();
            }
          )
          .catch(
            (error) => {
              console.error(
                '[Gemilang Generate]',
                error
              );

              setError(
                `❌ Batch berhenti pada ${done}/${total}.\n\n${error.message}`
              );

              setGenerating(
                false
              );
            }
          );
      };

    runNext();
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
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div
          style={
            styles.header
          }
        >
          <div
            style={
              styles.title
            }
          >
            <Sparkles
              size={18}
              color="#f59e0b"
            />
            Gemilang Question Research
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
              <X size={18} />
            </button>
          )}
        </div>

        {!generating ? (
          <>
            <label
              style={
                styles.label
              }
            >
              📖 Topik
            </label>

            <input
              value={topic}
              onChange={(e) =>
                setTopic(
                  e.target.value
                )
              }
              placeholder="Contoh: TKA Bahasa Indonesia — teks eksplanasi"
              style={
                styles.input
              }
            />

            <div
              style={
                styles.row
              }
            >
              <div
                style={{
                  flex: 1,
                }}
              >
                <label
                  style={
                    styles.label
                  }
                >
                  🎓 Kelas
                </label>

                <input
                  value={kelas}
                  onChange={(e) =>
                    setKelas(
                      e.target
                        .value
                    )
                  }
                  placeholder="Kelas 9 SMP"
                  style={
                    styles.input
                  }
                />
              </div>

              <div
                style={{
                  width: 110,
                }}
              >
                <label
                  style={
                    styles.label
                  }
                >
                  🔢 Total
                </label>

                <input
                  type="number"
                  min="1"
                  max="100"
                  value={
                    targetCount
                  }
                  onChange={(e) =>
                    setTargetCount(
                      Number(
                        e.target
                          .value
                      ) || 1
                    )
                  }
                  style={
                    styles.input
                  }
                />
              </div>
            </div>

            <label
              style={
                styles.label
              }
            >
              🌐 Sumber soal
            </label>

            <div
              style={
                styles.modeGrid
              }
            >
              {SOURCE_MODES.map(
                (mode) => {
                  const active =
                    sourceMode ===
                    mode.id;

                  return (
                    <button
                      key={
                        mode.id
                      }
                      type="button"
                      onClick={() =>
                        setSourceMode(
                          mode.id
                        )
                      }
                      style={{
                        ...styles.modeButton,
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
                      <b>
                        {mode.title}
                      </b>

                      <span>
                        {
                          mode.description
                        }
                      </span>
                    </button>
                  );
                }
              )}
            </div>

            <label
              style={
                styles.label
              }
            >
              🎯 Target latihan
            </label>

            <input
              type="number"
              value={
                targetYear
              }
              onChange={(e) =>
                setTargetYear(
                  Number(
                    e.target
                      .value
                  ) || 2027
                )
              }
              style={
                styles.input
              }
            />

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
                        ...styles.typeButton,
                        background:
                          active
                            ? '#fef3c7'
                            : 'white',
                        border:
                          active
                            ? '2px solid #f59e0b'
                            : '1px solid #e2e8f0',
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

            <label
              style={
                styles.label
              }
            >
              <Brain
                size={13}
                style={{
                  verticalAlign:
                    -2,
                }}
              />{' '}
              Level HOTS
            </label>

            <div
              style={
                styles.hots
              }
            >
              {HOTS_OPTIONS.map(
                (item) => (
                  <button
                    key={
                      item.id
                    }
                    type="button"
                    onClick={() =>
                      setHotsLevel(
                        item.id
                      )
                    }
                    style={{
                      ...styles.hotButton,
                      background:
                        hotsLevel ===
                        item.id
                          ? '#ede9fe'
                          : 'white',
                      border:
                        hotsLevel ===
                        item.id
                          ? '2px solid #8b5cf6'
                          : '1px solid #e2e8f0',
                    }}
                  >
                    {item.label}
                  </button>
                )
              )}
            </div>

            <label
              style={
                styles.label
              }
            >
              📝 Deskripsi / permintaan guru
            </label>

            <textarea
              value={arahan}
              onChange={(e) =>
                setArahan(
                  e.target
                    .value
                )
              }
              placeholder={
                sourceMode ===
                'prediction'
                  ? 'Contoh: carikan soal prediksi TKA 2027 yang HOTS, banyak stimulus gambar dan mirip pola yang sering muncul.'
                  : 'Contoh: cari soal yang paling sering muncul pada topik ini, termasuk soal bergambar.'
              }
              style={
                styles.textarea
              }
            />

            {error && (
              <div
                style={
                  styles.error
                }
              >
                <AlertCircle
                  size={16}
                />

                <span
                  style={{
                    whiteSpace:
                      'pre-wrap',
                  }}
                >
                  {error}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={
                handleGenerate
              }
              style={
                styles.generate
              }
            >
              <Wand2 size={17} />

              {sourceMode ===
              'source'
                ? 'Cari & Masukkan Soal'
                : 'Riset & Susun Prediksi'}
            </button>

            <div
              style={
                styles.note
              }
            >
              <Globe size={13} />
              <span>
                Internet selalu aktif.
                Soal masuk ke Gemilang
                bersama sumber, kunci,
                verifikasi jawaban,
                pembahasan, dan data
                visual bila tersedia.
              </span>
            </div>
          </>
        ) : (
          <div
            style={
              styles.progress
            }
          >
            <Loader2
              size={38}
              color="#2563eb"
              className="gemilang-spin"
            />

            <h3>
              {status}
            </h3>

            <div
              style={
                styles.progressText
              }
            >
              {progress.done} /{' '}
              {progress.total}{' '}
              soal
            </div>

            <div
              style={
                styles.progressBg
              }
            >
              <div
                style={{
                  ...styles.progressFill,
                  width: `${
                    Math.min(
                      100,
                      (progress.done /
                        progress.total) *
                        100
                    )
                  }%`,
                }}
              />
            </div>

            <p
              style={
                styles.small
              }
            >
              Batch maksimal 10 soal.
              Soal yang sudah berhasil
              langsung masuk ke editor.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes gemilangSpin {
          to { transform: rotate(360deg); }
        }

        .gemilang-spin {
          animation:
            gemilangSpin
            1s linear infinite;
        }
      `}</style>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background:
      'rgba(15,23,42,.65)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      'center',
    padding: 16,
  },

  modal: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '92vh',
    overflowY:
      'auto',
    background:
      'white',
    borderRadius: 18,
    padding: 20,
    boxShadow:
      '0 25px 70px rgba(0,0,0,.3)',
  },

  header: {
    display: 'flex',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  title: {
    fontSize: 15,
    fontWeight: 800,
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  close: {
    border: 'none',
    background:
      '#f1f5f9',
    borderRadius: 8,
    padding: 7,
    cursor: 'pointer',
  },

  row: {
    display: 'flex',
    gap: 10,
    marginBottom: 12,
  },

  label: {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    margin:
      '12px 0 6px',
  },

  input: {
    width: '100%',
    boxSizing:
      'border-box',
    padding: 10,
    border:
      '1px solid #e2e8f0',
    borderRadius: 9,
    outline: 'none',
    fontSize: 12,
  },

  modeGrid: {
    display: 'grid',
    gridTemplateColumns:
      '1fr 1fr',
    gap: 8,
  },

  modeButton: {
    textAlign: 'left',
    padding: 11,
    borderRadius: 10,
    cursor: 'pointer',
  },

  typeGrid: {
    display: 'grid',
    gridTemplateColumns:
      '1fr 1fr',
    gap: 6,
  },

  typeButton: {
    padding:
      '8px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 700,
    textAlign: 'left',
  },

  hots: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },

  hotButton: {
    padding:
      '8px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 10,
    fontWeight: 700,
  },

  textarea: {
    width: '100%',
    minHeight: 80,
    boxSizing:
      'border-box',
    padding: 10,
    border:
      '1px solid #e2e8f0',
    borderRadius: 9,
    resize: 'vertical',
    fontFamily:
      'inherit',
    fontSize: 12,
  },

  error: {
    display: 'flex',
    gap: 7,
    marginTop: 12,
    padding: 10,
    background:
      '#fee2e2',
    color: '#b91c1c',
    borderRadius: 9,
    fontSize: 11,
    lineHeight: 1.5,
  },

  generate: {
    width: '100%',
    marginTop: 14,
    border: 'none',
    borderRadius: 10,
    padding: 13,
    background:
      'linear-gradient(135deg,#2563eb,#4f46e5)',
    color: 'white',
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    justifyContent:
      'center',
    alignItems: 'center',
    gap: 8,
  },

  note: {
    display: 'flex',
    gap: 6,
    marginTop: 10,
    padding: 9,
    background:
      '#eff6ff',
    color: '#475569',
    borderRadius: 8,
    fontSize: 10,
    lineHeight: 1.5,
  },

  progress: {
    minHeight: 300,
    display: 'flex',
    flexDirection:
      'column',
    alignItems:
      'center',
    justifyContent:
      'center',
    gap: 12,
    textAlign: 'center',
  },

  progressText: {
    fontSize: 22,
    fontWeight: 900,
    color: '#2563eb',
  },

  progressBg: {
    width: '100%',
    height: 8,
    background:
      '#e2e8f0',
    borderRadius: 9,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    background:
      'linear-gradient(90deg,#2563eb,#8b5cf6)',
    transition:
      'width .3s ease',
  },

  small: {
    fontSize: 10,
    color: '#94a3b8',
  },
};

export default AIGenerateQuiz;