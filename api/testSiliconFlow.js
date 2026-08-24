// api/testSiliconFlow.js
// ============================================================
// GEMILANG — SILICONFLOW AUTH DIAGNOSTIC
// Tidak pernah mengirim API key ke browser.
// ============================================================

const TIMEOUT_MS = 15000;

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
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(
  req,
  res
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error:
        'Gunakan GET.',
    });
  }

  const rawKey =
    process.env.SILICONFLOW_API_KEY;

  // trim untuk menghindari whitespace
  // tersembunyi dari Vercel Environment Variable
  const apiKey =
    String(rawKey || '').trim();

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      stage: 'environment',

      error:
        'SILICONFLOW_API_KEY tidak terbaca oleh Vercel.',

      diagnostics: {
        hasKey: false,
        keyLength: 0,
      },
    });
  }

  try {
    const response =
      await fetchWithTimeout(
        'https://api.siliconflow.cn/v1/models?sub_type=chat',
        {
          method: 'GET',

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            Accept:
              'application/json',
          },
        }
      );

    const raw =
      await response.text();

    let data = null;

    try {
      data =
        JSON.parse(raw);
    } catch (_) {}

    const models =
      Array.isArray(
        data?.data
      )
        ? data.data
        : [];

    const modelIds =
      models
        .map(
          (item) =>
            item?.id
        )
        .filter(Boolean);

    return res.status(
      response.ok
        ? 200
        : response.status
    ).json({
      success:
        response.ok,

      stage:
        'siliconflow-auth',

      httpStatus:
        response.status,

      diagnostics: {
        hasKey: true,

        // Hanya panjang key,
        // JANGAN pernah mengirim key.
        keyLength:
          apiKey.length,

        keyPrefix:
          apiKey.slice(0, 4),

        modelCount:
          modelIds.length,

        hasGLMZ1:
          modelIds.includes(
            'THUDM/GLM-Z1-9B-0414'
          ),

        hasQwen3_8B:
          modelIds.includes(
            'Qwen/Qwen3-8B'
          ),

        hasDeepSeekR1:
          modelIds.includes(
            'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B'
          ),
      },

      // Hanya metadata model.
      // Tidak ada API key.
      models:
        modelIds.slice(
          0,
          30
        ),

      providerResponse:
        data?.message ||
        data?.error ||
        null,
    });
  } catch (error) {
    return res.status(502).json({
      success: false,

      stage:
        'network',

      error:
        error?.message ||
        String(error),

      diagnostics: {
        hasKey: true,
        keyLength:
          apiKey.length,
      },
    });
  }
}