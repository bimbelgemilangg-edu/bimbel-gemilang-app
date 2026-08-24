// api/gemilangAI.js
// ============================================================
// BIMBEL GEMILANG — CLOUDFLARE AI ENGINE
// STABLE VERSION
// ============================================================

const MODEL =
  '@cf/zai-org/glm-4.7-flash';

const TIMEOUT_MS = 25000;

function sleep(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(resolve, ms)
  );
}

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = TIMEOUT_MS
) {
  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () =>
        controller.abort(),
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

async function callCloudflare({
  token,
  accountId,
  messages,
}) {
  const url =
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`;

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

        body:
          JSON.stringify({
            messages,

            max_tokens:
              3000,

            temperature:
              0.2,

            stream:
              false,
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

  if (!response.ok) {
    const message =
      data?.errors?.[0]
        ?.message ||
      data?.message ||
      raw ||
      `HTTP ${response.status}`;

    const error =
      new Error(
        `CLOUDFLARE_HTTP_${response.status}: ${message}`
      );

    error.status =
      response.status;

    throw error;
  }

  return data;
}

function extractText(data) {
  const choices =
    data?.result?.choices;

  if (
    Array.isArray(choices)
  ) {
    return choices
      .map(
        (choice) => {
          const content =
            choice
              ?.message
              ?.content;

          if (
            typeof content ===
            'string'
          ) {
            return content;
          }

          if (
            Array.isArray(
              content
            )
          ) {
            return content
              .map(
                (part) =>
                  part?.text ||
                  ''
              )
              .join('');
          }

          return '';
        }
      )
      .join('\n');
  }

  if (
    typeof data?.result
      ?.response ===
    'string'
  ) {
    return data.result.response;
  }

  if (
    typeof data?.result
      ?.text ===
    'string'
  ) {
    return data.result.text;
  }

  return '';
}

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

  const {
    prompt,
    systemPrompt,
    messages,
    maxTokens,
  } =
    req.body || {};

  const userPrompt =
    String(
      prompt || ''
    ).trim();

  let finalMessages;

  if (
    Array.isArray(
      messages
    ) &&
    messages.length
  ) {
    finalMessages =
      messages;
  } else {
    finalMessages = [
      {
        role:
          'system',

        content:
          String(
            systemPrompt ||
              'Kamu adalah Asisten Soal Gemilang. Gunakan bahasa Indonesia dan utamakan akurasi akademik.'
          ),
      },

      {
        role:
          'user',

        content:
          userPrompt,
      },
    ];
  }

  if (
    !finalMessages.length
  ) {
    return res
      .status(400)
      .json({
        success: false,
        error:
          'Prompt wajib diisi.',
      });
  }

  try {
    const data =
      await callCloudflare({
        token,
        accountId,
        messages:
          finalMessages,
      });

    const text =
      extractText(
        data
      );

    return res
      .status(200)
      .json({
        success: true,

        cloudflare:
          true,

        provider:
          'Cloudflare Workers AI',

        model:
          MODEL,

        text,

        result:
          data?.result ||
          null,

        errors:
          data?.errors ||
          [],

        messages:
          data?.messages ||
          [],

        zeroBillingMode:
          true,

        maxTokens:
          Number.isInteger(
            maxTokens
          )
            ? maxTokens
            : 3000,
      });
  } catch (
    error
  ) {
    console.error(
      '[Gemilang Cloudflare]',
      error
    );

    return res
      .status(
        error?.status ===
          429
          ? 429
          : 502
      )
      .json({
        success: false,

        cloudflare:
          true,

        provider:
          'Cloudflare Workers AI',

        model:
          MODEL,

        error:
          error?.status ===
          429
            ? 'Kuota harian Cloudflare Workers AI sedang mencapai batas.'
            : 'Cloudflare Workers AI gagal memproses permintaan.',

        debug:
          error?.message ||
          String(error),
      });
  }
}