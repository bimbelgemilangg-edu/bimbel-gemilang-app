// api/testCloudflare.js
// ============================================================
// GEMILANG — CLOUDFLARE CONNECTION TEST
// ============================================================

const MODEL =
  '@cf/zai-org/glm-4.7-flash';

const TIMEOUT_MS = 20000;

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = TIMEOUT_MS
) {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
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
}

export default async function handler(
  req,
  res
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'POST required',
    });
  }

  const token =
    process.env.CLOUDFLARE_API_TOKEN;

  const accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!token) {
    return res.status(500).json({
      success: false,
      stage: 'environment',
      error:
        'CLOUDFLARE_API_TOKEN tidak tersedia.',
    });
  }

  if (!accountId) {
    return res.status(500).json({
      success: false,
      stage: 'environment',
      error:
        'CLOUDFLARE_ACCOUNT_ID tidak tersedia.',
    });
  }

  const url =
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`;

  try {
    const response =
      await fetchWithTimeout(
        url,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${token}`,

            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content:
                  'Kamu adalah Asisten Soal Gemilang. Jawab dalam bahasa Indonesia.',
              },
              {
                role: 'user',
                content:
                  'Jelaskan pecahan senilai untuk siswa kelas 6 SD dalam 2 kalimat.',
              },
            ],
            max_tokens: 300,
          }),
        },
        TIMEOUT_MS
      );

    const raw =
      await response.text();

    let data = null;

    try {
      data =
        JSON.parse(raw);
    } catch (_) {}

    return res.status(
      response.ok
        ? 200
        : response.status
    ).json({
      success:
        response.ok,

      stage:
        'cloudflare-ai',

      httpStatus:
        response.status,

      model: MODEL,

      result:
        data?.result || null,

      errors:
        data?.errors || [],

      messages:
        data?.messages || [],
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      stage: 'network',

      error:
        error?.name ===
        'AbortError'
          ? 'REQUEST_TIMEOUT_OR_ABORT'
          : error?.message ||
            String(error),

      model: MODEL,
    });
  }
}