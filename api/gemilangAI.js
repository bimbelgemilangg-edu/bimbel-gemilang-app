// api/gemilangAI.js
// ============================================================
// BIMBEL GEMILANG — FREE AI ROUTER
// ============================================================
//
// PRIORITAS:
// 1. SiliconFlow free model
// 2. SiliconFlow free model kedua
// 3. SiliconFlow free model ketiga
//
// ZERO-BILLING:
// Tidak pernah memilih model berbayar.
// ============================================================

const FREE_MODELS = [
  'Qwen/Qwen3-8B',
  'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
  'THUDM/GLM-Z1-9B-0414',
];

const TIMEOUT_MS = 30000;

const fetchWithTimeout = async (
  url,
  options = {},
  timeoutMs = TIMEOUT_MS
) => {
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
};

async function callModel({
  apiKey,
  model,
  messages,
  maxTokens,
}) {
  const response =
    await fetchWithTimeout(
      'https://api.siliconflow.cn/v1/chat/completions',
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${apiKey}`,

          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            model,
            messages,
            max_tokens:
              maxTokens,
            temperature:
              0.2,
            stream:
              false,
          }),
      }
    );

  const raw =
    await response.text();

  let data = null;

  try {
    data =
      JSON.parse(raw);
  } catch (_) {}

  if (!response.ok) {
    const error =
      new Error(
        data?.message ||
          data?.error?.message ||
          `SiliconFlow HTTP ${response.status}`
      );

    error.status =
      response.status;

    throw error;
  }

  return data;
}

export default async function handler(
  req,
  res
) {
  if (
    req.method !== 'POST'
  ) {
    return res.status(405).json({
      success: false,
      error:
        'Method not allowed',
    });
  }

  const apiKey =
    process.env
      .SILICONFLOW_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error:
        'SILICONFLOW_API_KEY belum tersedia di Vercel.',
    });
  }

  const {
    prompt,
    systemPrompt,
    maxTokens,
  } =
    req.body || {};

  const userPrompt =
    String(
      prompt || ''
    ).trim();

  if (!userPrompt) {
    return res.status(400).json({
      success: false,
      error:
        'Prompt wajib diisi.',
    });
  }

  const messages = [
    {
      role:
        'system',

      content:
        String(
          systemPrompt ||
            'Kamu adalah Asisten Soal Gemilang. Gunakan bahasa Indonesia. Utamakan akurasi akademik.'
        ),
    },

    {
      role:
        'user',

      content:
        userPrompt,
    },
  ];

  const errors = [];

  for (
    const model of
      FREE_MODELS
  ) {
    try {
      const data =
        await callModel({
          apiKey,
          model,
          messages,
          maxTokens:
            Number.isInteger(
              maxTokens
            )
              ? maxTokens
              : 5000,
        });

      const text =
        data?.choices?.[0]
          ?.message
          ?.content || '';

      if (!text.trim()) {
        throw new Error(
          'Model tidak mengembalikan teks.'
        );
      }

      return res.status(200).json({
        success: true,

        provider:
          'SiliconFlow',

        model,

        text,

        result:
          data,

        zeroBillingMode:
          true,

        attemptedModels:
          errors.map(
            (item) =>
              item.model
          ),
      });
    } catch (
      error
    ) {
      console.error(
        '[Gemilang AI Router]',
        model,
        error?.message
      );

      errors.push({
        model,

        status:
          error?.status ||
          null,

        message:
          error?.message ||
          String(error),
      });
    }
  }

  return res.status(503).json({
    success: false,

    error:
      'Semua model AI GRATIS sedang tidak tersedia atau terkena rate limit. Sistem tidak menggunakan model berbayar.',

    zeroBillingMode:
      true,

    attemptedModels:
      FREE_MODELS,

    errors,
  });
}