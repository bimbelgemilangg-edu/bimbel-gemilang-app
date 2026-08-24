// api/testCloudflare.js
// ============================================================
// BIMBEL GEMILANG — CLOUDFLARE AI CONNECTION TEST
// ============================================================

const MODEL =
  process.env.CLOUDFLARE_MODEL ||
  '@cf/zai-org/glm-4.7-flash';

const TIMEOUT_MS = 45000;

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = TIMEOUT_MS
) {
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
        signal: controller.signal,
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
  // ----------------------------------------------------------
  // METHOD
  // ----------------------------------------------------------

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Gunakan GET.',
    });
  }

  // ----------------------------------------------------------
  // ENV
  // ----------------------------------------------------------

  const token =
    process.env.CLOUDFLARE_API_TOKEN;

  const accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!token) {
    return res.status(500).json({
      success: false,
      step: 'environment',
      error:
        'CLOUDFLARE_API_TOKEN belum tersedia.',
    });
  }

  if (!accountId) {
    return res.status(500).json({
      success: false,
      step: 'environment',
      error:
        'CLOUDFLARE_ACCOUNT_ID belum tersedia.',
    });
  }

  // ----------------------------------------------------------
  // CLOUDFLARE URL
  // ----------------------------------------------------------

  const url =
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`;

  // ----------------------------------------------------------
  // TEST PROMPT
  // ----------------------------------------------------------

  const body = {
    messages: [
      {
        role: 'system',
        content:
          'Kamu adalah asisten AI Bimbel Gemilang.',
      },
      {
        role: 'user',
        content:
          'Jawab singkat dalam bahasa Indonesia: apakah koneksi Cloudflare AI berhasil? Jawab: CLOUDFLARE BERHASIL.',
      },
    ],
  };

  // ----------------------------------------------------------
  // REQUEST
  // ----------------------------------------------------------

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

            Accept:
              'application/json',
          },

          body:
            JSON.stringify(body),
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

    // --------------------------------------------------------
    // CLOUDFLARE ERROR
    // --------------------------------------------------------

    if (!response.ok) {
      return res.status(502).json({
        success: false,

        step:
          'cloudflare_request',

        httpStatus:
          response.status,

        model: MODEL,

        error:
          data?.errors?.[0]?.message ||
          data?.message ||
          raw ||
          'Cloudflare mengembalikan error.',

        cloudflareErrors:
          data?.errors || [],

        cloudflareMessages:
          data?.messages || [],
      });
    }

    // --------------------------------------------------------
    // EXTRACT RESPONSE
    // --------------------------------------------------------

    const result =
      data?.result || {};

    let answer = '';

    if (
      typeof result === 'string'
    ) {
      answer = result;
    } else if (
      typeof result.response ===
      'string'
    ) {
      answer =
        result.response;
    } else if (
      typeof result.text ===
      'string'
    ) {
      answer =
        result.text;
    } else if (
      Array.isArray(
        result.choices
      )
    ) {
      answer =
        result.choices
          .map((choice) => {
            if (
              typeof choice
                ?.message
                ?.content ===
              'string'
            ) {
              return choice
                .message
                .content;
            }

            if (
              Array.isArray(
                choice
                  ?.message
                  ?.content
              )
            ) {
              return choice.message.content
                .map(
                  (part) =>
                    part?.text || ''
                )
                .join('');
            }

            if (
              typeof choice?.text ===
              'string'
            ) {
              return choice.text;
            }

            return '';
          })
          .join('\n');
    }

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        'Cloudflare AI berhasil terhubung.',

      model: MODEL,

      answer:
        answer.trim(),

      cloudflareSuccess:
        data?.success === true,

      diagnostics: {
        httpStatus:
          response.status,

        hasResult:
          Boolean(
            data?.result
          ),

        hasAnswer:
          Boolean(
            answer.trim()
          ),
      },
    });
  } catch (error) {
    // --------------------------------------------------------
    // NETWORK / TIMEOUT
    // --------------------------------------------------------

    const isTimeout =
      error?.name ===
      'AbortError';

    return res.status(504).json({
      success: false,

      step:
        'network',

      error:
        isTimeout
          ? 'Request ke Cloudflare timeout.'
          : error?.message ||
            'Gagal menghubungi Cloudflare.',

      model: MODEL,
    });
  }
}