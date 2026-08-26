// ============================================================
// BIMBEL GEMILANG
// api/checkNvidiaModels.js
// ============================================================
//
// TUJUAN:
// Menjawab SATU pertanyaan yang selama ini cuma bisa ditebak-tebak:
// "Model NVIDIA mana yang BENERAN hidup & bisa dipakai API key kita
// SEKARANG?"
//
// KENAPA FILE INI ADA:
// Katalog build.nvidia.com TIDAK bisa dijadikan patokan tunggal. Ada
// model yang di katalog tertulis "Free Endpoint" tapi tetap balas 404
// kalau dipanggil beneran (katalog masih memuat model yang sudah tidak
// di-host). Dalam sebulan terakhir fitur generate soal Bimbel Gemilang
// sudah 3x mati gara-gara model default tiba-tiba dipensiunkan:
//   - qwen/qwen2.5-72b-instruct   -> 404 (hilang dari katalog)
//   - meta/llama-4-maverick-...   -> 410 (EOL 27 Juli 2026)
//   - mistralai/mistral-medium-3-instruct -> 404 (walau terlisting)
//
// Daripada nebak dari blog/hasil pencarian (yang gampang basi),
// endpoint ini NANYA LANGSUNG ke NVIDIA pakai API key kita sendiri.
// Hasilnya fakta per hari ini, bukan asumsi.
//
// CARA PAKAI:
// 1. Buka di browser (harus login sebagai admin):
//      /api/checkNvidiaModels
//    -> menampilkan SEMUA model di katalog yang kelihatan oleh API
//       key kamu (cepat, 1 panggilan, tidak menghabiskan kuota chat).
//
// 2. Untuk BENAR-BENAR menguji model mana yang merespons chat:
//      /api/checkNvidiaModels?probe=1
//    -> mengirim 1 pesan super pendek ke tiap model kandidat dan
//       melaporkan: OK / 404 (mati) / 410 (pensiun) / timeout / dll.
//
//    Secara default hanya menguji model yang dipakai generateQuiz
//    (utama + cadangan). Untuk menguji daftar sendiri:
//      /api/checkNvidiaModels?probe=1&models=meta/llama-3.3-70b-instruct,qwen/qwen2-7b-instruct
//
// 3. Filter katalog berdasarkan kata kunci (tanpa probe):
//      /api/checkNvidiaModels?filter=instruct
//
// SETELAH DAPAT HASILNYA:
// Ambil ID model yang statusnya "ok" dan paling besar/berkualitas,
// lalu set di Vercel -> Environment Variables -> NVIDIA_MODEL.
// TIDAK PERLU deploy ulang kode generateQuizFromTopic.js.
//
// ENV:
// NVIDIA_API_KEY=... (sama persis dengan yang dipakai generateQuiz)
//
// ============================================================

export const maxDuration = 60;

const NVIDIA_BASE_URL =
  'https://integrate.api.nvidia.com/v1';

const NVIDIA_MODELS_URL =
  `${NVIDIA_BASE_URL}/models`;

const NVIDIA_CHAT_URL =
  `${NVIDIA_BASE_URL}/chat/completions`;

// Daftar default yang diuji kalau ?probe=1 dipanggil tanpa &models=.
// SENGAJA disamakan dengan yang dipakai di generateQuizFromTopic.js
// (utama + cadangan) supaya endpoint ini menjawab pertanyaan yang
// paling sering muncul: "kenapa generate soal gagal?"
const DEFAULT_PROBE_MODELS = [
  'mistralai/mistral-nemotron',
  'mistralai/mistral-small-3.2-24b-instruct-2506',
  'mistralai/mistral-small-3.1-24b-instruct-2503',
  'qwen/qwen2-7b-instruct',
];

// Probe harus CEPAT -- tujuannya cuma memastikan model hidup, bukan
// menghasilkan jawaban bagus. Timeout pendek supaya banyak model bisa
// diuji dalam satu request tanpa kena maxDuration Vercel.
const PROBE_TIMEOUT_MS = 9_000;

// Batas jumlah model yang boleh di-probe dalam 1 request -- jaga-jaga
// supaya gak ada yang iseng probe 150 model sekaligus lalu kena rate
// limit NVIDIA (~40 request/menit) atau function-nya dibunuh Vercel.
const MAX_PROBE_MODELS = 8;

// ============================================================
// AMBIL KATALOG MODEL
// ============================================================

async function fetchModelCatalog(
  apiKey,
) {
  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () =>
        controller.abort(),
      15_000,
    );

  try {
    const response =
      await fetch(
        NVIDIA_MODELS_URL,
        {
          method: 'GET',

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            Accept:
              'application/json',
          },

          signal:
            controller.signal,
        },
      );

    const text =
      await response.text();

    if (!response.ok) {
      return {
        ok: false,

        status:
          response.status,

        message:
          text.slice(
            0,
            500,
          ),

        models: [],
      };
    }

    let data = null;

    try {
      data =
        JSON.parse(text);
    } catch (_) {
      return {
        ok: false,

        status:
          response.status,

        message:
          'Respons katalog bukan JSON yang valid.',

        models: [],
      };
    }

    const models =
      Array.isArray(
        data?.data,
      )
        ? data.data
            .map(
              (m) =>
                m?.id,
            )
            .filter(
              (id) =>
                typeof id ===
                'string',
            )
            .sort()
        : [];

    return {
      ok: true,

      status:
        response.status,

      models,
    };

  } catch (error) {
    return {
      ok: false,

      status: null,

      message:
        error?.name ===
        'AbortError'
          ? 'Timeout saat mengambil katalog model.'
          : error?.message ||
            'Gagal mengambil katalog model.',

      models: [],
    };

  } finally {
    clearTimeout(
      timeoutId,
    );
  }
}

// ============================================================
// UJI SATU MODEL
// ============================================================

async function probeModel(
  apiKey,
  model,
) {
  const controller =
    new AbortController();

  const timeoutId =
    setTimeout(
      () =>
        controller.abort(),
      PROBE_TIMEOUT_MS,
    );

  const startedAt =
    Date.now();

  try {
    const response =
      await fetch(
        NVIDIA_CHAT_URL,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            'Content-Type':
              'application/json',

            Accept:
              'application/json',
          },

          body: JSON.stringify({
            model,

            messages: [
              {
                role: 'user',

                // Sengaja sesingkat mungkin: hemat kuota, hemat waktu.
                content:
                  'Balas satu kata: OK',
              },
            ],

            max_tokens: 5,

            temperature: 0,

            stream: false,
          }),

          signal:
            controller.signal,
        },
      );

    const elapsedMs =
      Date.now() -
      startedAt;

    const text =
      await response.text();

    if (response.ok) {
      let sample = null;

      try {
        const data =
          JSON.parse(text);

        sample =
          data
            ?.choices?.[0]
            ?.message
            ?.content ||
          null;
      } catch (_) {
        sample = null;
      }

      return {
        model,

        status: 'ok',

        httpStatus:
          response.status,

        elapsedMs,

        sample:
          sample
            ? String(sample)
                .trim()
                .slice(0, 60)
            : null,

        note:
          'Model hidup dan merespons. Aman dipakai.',
      };
    }

    // Terjemahkan kode HTTP ke penjelasan yang bisa langsung
    // ditindaklanjuti (ini inti gunanya endpoint ini).
    let note =
      'Gagal dengan alasan lain -- lihat message.';

    if (
      response.status === 404
    ) {
      note =
        'MATI: model tidak di-host lagi (walau mungkin masih terlisting di katalog). Jangan dipakai.';
    } else if (
      response.status === 410
    ) {
      note =
        'PENSIUN (end-of-life): model sudah resmi dimatikan. Jangan dipakai.';
    } else if (
      response.status === 401 ||
      response.status === 403
    ) {
      note =
        'API key ditolak / tidak punya akses ke model ini. Cek NVIDIA_API_KEY.';
    } else if (
      response.status === 429
    ) {
      note =
        'Kena rate limit saat pengujian -- BUKAN berarti model mati. Tunggu sebentar lalu ulangi.';
    }

    return {
      model,

      status:
        response.status === 429
          ? 'rate_limited'
          : 'failed',

      httpStatus:
        response.status,

      elapsedMs,

      message:
        text.slice(
          0,
          300,
        ),

      note,
    };

  } catch (error) {
    const elapsedMs =
      Date.now() -
      startedAt;

    if (
      error?.name ===
      'AbortError'
    ) {
      return {
        model,

        status: 'timeout',

        elapsedMs,

        note:
          `Tidak selesai dalam ${PROBE_TIMEOUT_MS}ms. PENTING: timeout BUKAN berarti model mati -- model yang balas 404 gagalnya instan. Ini biasanya "cold start" (model perlu dimuat dulu ke GPU). Coba ulangi sekali lagi; kalau kedua kalinya cepat, model ini sebenarnya sehat.`,
      };
    }

    return {
      model,

      status: 'error',

      elapsedMs,

      message:
        error?.message ||
        'Unknown error',

      note:
        'Error jaringan/runtime saat menghubungi NVIDIA.',
    };

  } finally {
    clearTimeout(
      timeoutId,
    );
  }
}

// ============================================================
// HANDLER
// ============================================================

export default async function handler(
  req,
  res,
) {
  if (
    req.method !== 'GET'
  ) {
    return res
      .status(405)
      .json({
        success: false,

        error:
          'Gunakan metode GET.',
      });
  }

  const apiKey =
    process.env
      .NVIDIA_API_KEY;

  if (!apiKey) {
    return res
      .status(500)
      .json({
        success: false,

        error:
          'NVIDIA_API_KEY belum di-set di Environment Variables.',
      });
  }

  const {
    probe,
    models: modelsParam,
    filter,
  } = req.query || {};

  // ----------------------------------------------------------
  // 1. AMBIL KATALOG
  // ----------------------------------------------------------

  const catalog =
    await fetchModelCatalog(
      apiKey,
    );

  if (!catalog.ok) {
    return res
      .status(502)
      .json({
        success: false,

        error:
          'Gagal mengambil katalog model dari NVIDIA.',

        diagnostics: {
          httpStatus:
            catalog.status,

          message:
            catalog.message,

          hint:
            catalog.status === 401 ||
            catalog.status === 403
              ? 'API key ditolak. Pastikan NVIDIA_API_KEY benar dan diawali "nvapi-".'
              : 'Cek koneksi atau status layanan NVIDIA.',
        },
      });
  }

  const filterText =
    typeof filter === 'string'
      ? filter
          .trim()
          .toLowerCase()
      : '';

  const filteredCatalog =
    filterText
      ? catalog.models.filter(
          (id) =>
            id
              .toLowerCase()
              .includes(
                filterText,
              ),
        )
      : catalog.models;

  // ----------------------------------------------------------
  // 2. MODE KATALOG SAJA (tanpa probe)
  // ----------------------------------------------------------

  if (!probe) {
    return res
      .status(200)
      .json({
        success: true,

        mode:
          'catalog_only',

        totalInCatalog:
          catalog.models.length,

        shown:
          filteredCatalog.length,

        models:
          filteredCatalog,

        peringatan:
          'PENTING: daftar ini adalah katalog, BUKAN jaminan model bisa dipakai. Sebagian model di sini tetap balas 404 kalau dipanggil. Untuk memastikan, jalankan dengan ?probe=1',

        caraPakai: {
          ujiModelDefault:
            '/api/checkNvidiaModels?probe=1',

          ujiModelPilihanSendiri:
            '/api/checkNvidiaModels?probe=1&models=ID_MODEL_1,ID_MODEL_2',

          saringKatalog:
            '/api/checkNvidiaModels?filter=instruct',
        },
      });
  }

  // ----------------------------------------------------------
  // 3. MODE PROBE
  // ----------------------------------------------------------

  let modelsToProbe =
    typeof modelsParam ===
    'string'
      ? modelsParam
          .split(',')
          .map((m) =>
            m.trim(),
          )
          .filter(Boolean)
      : DEFAULT_PROBE_MODELS;

  modelsToProbe =
    modelsToProbe.slice(
      0,
      MAX_PROBE_MODELS,
    );

  const results = [];

  // Sengaja BERURUTAN (bukan paralel): NVIDIA membatasi ~40 request
  // per menit, dan menembak semua sekaligus justru gampang memicu 429
  // yang bikin hasil pengujian ini menyesatkan (model sehat terlihat
  // seperti gagal).
  for (
    const model of modelsToProbe
  ) {
    const result =
      await probeModel(
        apiKey,
        model,
      );

    results.push(result);
  }

  const working =
    results.filter(
      (r) =>
        r.status === 'ok',
    );

  const dead =
    results.filter(
      (r) =>
        r.httpStatus === 404 ||
        r.httpStatus === 410,
    );

  // Rekomendasi = model sehat yang PALING CEPAT merespons.
  const recommended =
    working.length > 0
      ? [...working].sort(
          (a, b) =>
            a.elapsedMs -
            b.elapsedMs,
        )[0].model
      : null;

  return res
    .status(200)
    .json({
      success: true,

      mode: 'probe',

      diujiSebanyak:
        results.length,

      hasil: results,

      ringkasan: {
        hidup:
          working.map(
            (r) => r.model,
          ),

        mati:
          dead.map(
            (r) => r.model,
          ),

        rekomendasi:
          recommended,

        langkahSelanjutnya:
          recommended
            ? `Set NVIDIA_MODEL = "${recommended}" di Vercel -> Settings -> Environment Variables, lalu Redeploy. Tidak perlu ubah kode.`
            : 'Tidak ada model yang lolos uji. Kalau semuanya "timeout", coba jalankan ulang sekali lagi (kemungkinan cold start). Kalau semuanya 404/410, jalankan /api/checkNvidiaModels?filter=instruct untuk melihat kandidat lain di katalog, lalu uji dengan &models=',
      },

      totalDiKatalog:
        catalog.models.length,
    });
}