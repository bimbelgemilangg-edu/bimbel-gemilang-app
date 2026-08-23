// api/gemilangAI.js
// ============================================================
// GEMILANG AI GATEWAY — CLOUDLFARE WORKERS AI
// Tahap 1: koneksi + test model
// ============================================================

const MODEL =
  '@cf/zai-org/glm-4.7-flash';

const TIMEOUT_MS = 60000;

const fetchWithTimeout = async (
  url,
  options = {},
  timeoutMs = TIMEOUT_MS
) => {
  const controller =
    new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    timeoutMs
  );

  try {
    return await fetch(
      url,
      {
        ...options,
        signal:
          controller.signal,
      }
    );
  } finally {
    clearTimeout(timer);
  }
};

export default async function handler(
  req,
  res
) {
  if (
    req.method !== 'POST'
  ) {
    return res
      .status(405)
      .json({
        success: false,
        error:
          'Method not allowed',
      });
  }

  const token =
    process.env
      .CLOUDFLARE_API_TOKEN;

  const accountId =
    process.env
      .CLOUDFLARE_ACCOUNT_ID;

  if (!token) {
    return res
      .status(500)
      .json({
        success: false,
        error:
          'CLOUDFLARE_API_TOKEN belum tersedia di Vercel.',
      });
  }

  if (!accountId) {
    return res
      .status(500)
      .json({
        success: false,
        error:
          'CLOUDFLARE_ACCOUNT_ID belum tersedia di Vercel.',
      });
  }

  const prompt =
    String(
      req.body?.prompt ||
        'Jelaskan konsep pecahan untuk siswa kelas 6 SD dalam 3 kalimat.'
    ).trim();

  if (!prompt) {
    return res
      .status(400)
      .json({
        success: false,
        error:
          'Prompt kosong.',
      });
  }

  const url =
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${encodeURIComponent(
      MODEL
    )}`;

  try {
    const response =
      await fetchWithTimeout(
        url,
        {
          method: 'POST',

          headers: {
            'Authorization':
              `Bearer ${token}`,

            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            prompt,
          }),
        }
      );

    const raw =
      await response.text();

    let data = null;

    try {
      data =
        JSON.parse(raw);
    } catch (_) {
      data = null;
    }

    if (!response.ok) {
      return res
        .status(
          response.status
        )
        .json({
          success: false,

          error:
            data?.errors?.[0]
              ?.message ||
            data?.message ||
            `Cloudflare HTTP ${response.status}`,

          debug:
            data || raw,
        });
    }

    return res
      .status(200)
      .json({
        success: true,

        model: MODEL,

        result:
          data?.result ||
          null,
      });
  } catch (error) {
    return res
      .status(502)
      .json({
        success: false,

        error:
          'Gagal menghubungi Cloudflare Workers AI.',

        debug:
          error?.message ||
          String(error),
      });
  }
}