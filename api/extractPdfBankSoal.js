// api/extractPdfBankSoal.js
// ============================================================
// BANK SOAL AI EXTRACTOR
// ============================================================
// Mendukung konfigurasi AI langsung dari halaman Admin.
//
// Frontend dapat mengirim:
// {
//   image,
//   pageNum,
//   provider,
//   apiKey,
//   baseUrl,
//   model
// }
//
// Kalau konfigurasi dari frontend tidak dikirim, endpoint tetap
// bisa fallback ke Environment Variables Vercel.
//
// Provider yang bisa dipakai:
// - openai
// - anthropic
// - openai-compatible
// - gemini
//
// Untuk provider seperti OpenRouter, Groq, NVIDIA, Cerebras,
// Mistral dan provider lain yang menyediakan endpoint
// OpenAI-compatible, gunakan:
// provider = "openai-compatible"
// baseUrl = endpoint chat completions mereka
// ============================================================

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: '15mb'
    }
  }
};

// ============================================================
// SYSTEM PROMPT
// ============================================================

const SYSTEM_PROMPT = `
Kamu adalah mesin AI ekstraktor soal ujian tingkat lanjut yang sangat akurat.

Tugasmu:
Menganalisis gambar halaman ujian dan mengekstrak setiap soal secara presisi.

BIDANG:
- Matematika
- Fisika
- Kimia
- Biologi
- Bahasa Indonesia
- Bahasa Inggris
- dan bidang akademik lain yang tampak pada halaman.

ATURAN UMUM:

1. Pertahankan seluruh isi soal secara akurat.
2. Jangan mengarang isi soal.
3. Jangan mengubah angka.
4. Jangan mengubah simbol.
5. Jangan menghilangkan pilihan jawaban.
6. Jangan menghilangkan tabel.
7. Jangan menghilangkan informasi pada gambar.
8. Gunakan LaTeX untuk persamaan matematika.
9. Rumus sebaris gunakan:
   $...$

10. Rumus berdiri sendiri gunakan:
   $$...$$

DETEKSI GAMBAR / DIAGRAM / GRAFIK:

Jika soal mempunyai:
- grafik
- diagram
- tabel visual
- ilustrasi
- gambar
- bangun geometri
- rangkaian listrik
- struktur kimia
- peta
- atau visual lain

maka:

1. Sisipkan token:
{{GAMBAR}}

pada posisi yang tepat di teks_soal.

2. Masukkan informasi gambar ke array gambar.

Jika tidak ada gambar:
"gambar": []

JENIS SOAL:

1. pg_sederhana
Pilihan ganda biasa dengan satu jawaban benar.

2. pg_kompleks
Pilihan ganda kompleks dengan beberapa pernyataan.

3. benar_salah
Soal dengan tabel kategori Benar/Salah.

BALAS HANYA JSON MURNI.

Jangan gunakan markdown.
Jangan gunakan code fence.
Jangan menambahkan penjelasan.

Mulai dengan:
[

Akhiri dengan:
]

STRUKTUR:

[
  {
    "nomor": 1,
    "tipe": "pg_sederhana",
    "teks_soal": "",
    "pernyataan": [],
    "opsi_jawaban": [],
    "tabel_benar_salah": [],
    "kunci_jawaban": "",
    "gambar": []
  }
]

Untuk gambar:

"gambar": [
  {
    "id": "GAMBAR_1",
    "deskripsi": "deskripsi singkat"
  }
]
`;

// ============================================================
// JSON SALVAGE
// ============================================================

function salvagePartialJsonArray(text) {
  const start = text.indexOf('[');

  if (start === -1) {
    return [];
  }

  let depth = 0;
  let inStr = false;
  let esc = false;
  let lastGoodEnd = -1;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inStr) {
      if (esc) {
        esc = false;
      } else if (ch === '\\') {
        esc = true;
      } else if (ch === '"') {
        inStr = false;
      }
      continue;
    }

    if (ch === '"') {
      inStr = true;
    } else if (ch === '[' || ch === '{') {
      depth++;
    } else if (ch === ']' || ch === '}') {
      depth--;

      if (depth === 1 && ch === '}') {
        lastGoodEnd = i;
      }
    }
  }

  if (lastGoodEnd === -1) {
    return [];
  }

  try {
    const parsed = JSON.parse(
      text.slice(start, lastGoodEnd + 1) + ']'
    );

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

// ============================================================
// HELPERS
// ============================================================

function normalizeBase64(image) {
  return String(image || '')
    .replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
}

function normalizeBaseUrl(url) {
  if (!url) {
    return '';
  }

  return String(url).trim().replace(/\/+$/, '');
}

function normalizeProvider(value) {
  return String(value || 'openai-compatible')
    .trim()
    .toLowerCase();
}

function getProviderConfig(body) {
  const provider = normalizeProvider(
    body.provider || process.env.BANKSOAL_AI_PROVIDER || 'openai-compatible'
  );

  const apiKey =
    String(body.apiKey || '').trim() ||
    String(
      provider === 'groq'
        ? process.env.GROQ_API_KEY || ''
        : provider === 'openai'
          ? process.env.OPENAI_API_KEY || ''
          : provider === 'anthropic'
            ? process.env.ANTHROPIC_API_KEY || ''
            : process.env.BANKSOAL_AI_API_KEY || ''
    ).trim();

  let baseUrl =
    normalizeBaseUrl(body.baseUrl) ||
    normalizeBaseUrl(process.env.BANKSOAL_AI_BASE_URL);

  let model =
    String(body.model || '').trim() ||
    String(process.env.BANKSOAL_AI_MODEL || '').trim();

  if (provider === 'openai') {
    baseUrl =
      baseUrl ||
      'https://api.openai.com/v1/chat/completions';

    model =
      model ||
      'gpt-4o';
  }

  if (provider === 'groq') {
    baseUrl =
      baseUrl ||
      'https://api.groq.com/openai/v1/chat/completions';

    model =
      model ||
      'llama-3.2-90b-vision-preview';
  }

  if (provider === 'gemini') {
    baseUrl =
      baseUrl ||
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

    model =
      model ||
      'gemini-2.0-flash';
  }

  if (provider === 'anthropic') {
    model =
      model ||
      'claude-3-5-sonnet-20241022';
  }

  if (provider === 'openai-compatible') {
    if (!baseUrl) {
      throw Object.assign(
        new Error(
          'Base URL wajib diisi untuk provider OpenAI-compatible.'
        ),
        { status: 400 }
      );
    }

    if (!model) {
      throw Object.assign(
        new Error(
          'Model wajib diisi untuk provider OpenAI-compatible.'
        ),
        { status: 400 }
      );
    }
  }

  if (!apiKey) {
    throw Object.assign(
      new Error(
        'API Key belum dimasukkan.'
      ),
      { status: 400 }
    );
  }

  return {
    provider,
    apiKey,
    baseUrl,
    model
  };
}

// ============================================================
// OPENAI-COMPATIBLE
// ============================================================

async function callOpenAICompatible(
  baseUrl,
  apiKey,
  model,
  base64Image,
  pageNum,
  signal
) {
  const resp = await fetch(baseUrl, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },

    body: JSON.stringify({
      model,

      temperature: 0.1,

      max_tokens: 8192,

      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },

        {
          role: 'user',

          content: [
            {
              type: 'text',
              text:
                `Ekstrak seluruh butir soal dari halaman ${pageNum}. ` +
                `Gunakan format JSON sesuai system prompt. ` +
                `Balas HANYA array JSON.`
            },

            {
              type: 'image_url',

              image_url: {
                url:
                  `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ]
    }),

    signal
  });

  const rawText = await resp.text();

  let data = {};

  try {
    data = JSON.parse(rawText);
  } catch {
    data = {};
  }

  if (!resp.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      rawText.slice(0, 500) ||
      `HTTP ${resp.status}`;

    throw Object.assign(
      new Error(message),
      {
        status: resp.status
      }
    );
  }

  const text =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.text ||
    '';

  return {
    text,
    stopReason:
      data?.choices?.[0]?.finish_reason || null
  };
}

// ============================================================
// ANTHROPIC
// ============================================================

async function callAnthropic(
  apiKey,
  model,
  base64Image,
  pageNum,
  signal
) {
  const resp = await fetch(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },

      body: JSON.stringify({
        model,

        max_tokens: 8192,

        temperature: 0.1,

        system: SYSTEM_PROMPT,

        messages: [
          {
            role: 'user',

            content: [
              {
                type: 'text',
                text:
                  `Ekstrak seluruh butir soal dari halaman ${pageNum}. ` +
                  `Balas HANYA array JSON.`
              },

              {
                type: 'image',

                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }
        ]
      }),

      signal
    }
  );

  const rawText = await resp.text();

  let data = {};

  try {
    data = JSON.parse(rawText);
  } catch {
    data = {};
  }

  if (!resp.ok) {
    const message =
      data?.error?.message ||
      rawText.slice(0, 500) ||
      `HTTP ${resp.status}`;

    throw Object.assign(
      new Error(message),
      {
        status: resp.status
      }
    );
  }

  const text =
    Array.isArray(data.content)
      ? data.content
          .filter(block => block?.type === 'text')
          .map(block => block.text)
          .join('\n')
      : '';

  return {
    text,
    stopReason:
      data?.stop_reason || null
  };
}

// ============================================================
// TEST CONNECTION
// ============================================================

async function testProvider(
  config,
  signal
) {
  const {
    provider,
    apiKey,
    baseUrl,
    model
  } = config;

  if (provider === 'anthropic') {
    return callAnthropic(
      apiKey,
      model,
      '',
      0,
      signal
    );
  }

  const testUrl =
    baseUrl;

  const resp = await fetch(
    testUrl,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },

      body: JSON.stringify({
        model,

        max_tokens: 20,

        messages: [
          {
            role: 'user',
            content: 'Balas dengan kata OK.'
          }
        ]
      }),

      signal
    }
  );

  const raw = await resp.text();

  if (!resp.ok) {
    let message = raw;

    try {
      const json = JSON.parse(raw);
      message =
        json?.error?.message ||
        json?.message ||
        raw;
    } catch {}

    throw Object.assign(
      new Error(
        message.slice(0, 500)
      ),
      {
        status: resp.status
      }
    );
  }

  return {
    text: raw
  };
}

// ============================================================
// HANDLER
// ============================================================

export default async function handler(req, res) {
  res.setHeader(
    'Access-Control-Allow-Origin',
    '*'
  );

  res.setHeader(
    'Access-Control-Allow-Methods',
    'POST, OPTIONS'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const body = req.body || {};

  const {
    image,
    pageNum,
    testOnly
  } = body;

  try {
    const providerConfig =
      getProviderConfig(body);

    if (testOnly) {
      const controller =
        new AbortController();

      const timeout =
        setTimeout(
          () => controller.abort(),
          15000
        );

      try {
        await testProvider(
          providerConfig,
          controller.signal
        );

        return res.status(200).json({
          success: true,
          message: 'API berhasil terhubung.',
          provider:
            providerConfig.provider,
          model:
            providerConfig.model
        });
      } finally {
        clearTimeout(timeout);
      }
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        error:
          'Gambar halaman (base64) tidak dikirim.'
      });
    }

    const cleanBase64 =
      normalizeBase64(image);

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => controller.abort(),
        55000
      );

    let result;

    try {
      if (
        providerConfig.provider === 'anthropic'
      ) {
        result =
          await callAnthropic(
            providerConfig.apiKey,
            providerConfig.model,
            cleanBase64,
            pageNum,
            controller.signal
          );
      } else {
        result =
          await callOpenAICompatible(
            providerConfig.baseUrl,
            providerConfig.apiKey,
            providerConfig.model,
            cleanBase64,
            pageNum,
            controller.signal
          );
      }
    } finally {
      clearTimeout(timeout);
    }

    if (!result?.text) {
      return res.status(502).json({
        success: false,
        error:
          'AI tidak mengembalikan teks.'
      });
    }

    const cleaned =
      String(result.text)
        .replace(
          /^```(?:json)?\s*/i,
          ''
        )
        .replace(
          /```\s*$/i,
          ''
        )
        .trim();

    try {
      const parsed =
        JSON.parse(cleaned);

      return res.status(200).json({
        success: true,
        questions:
          Array.isArray(parsed)
            ? parsed
            : [],
        provider:
          providerConfig.provider,
        model:
          providerConfig.model,
        truncated: false
      });
    } catch {
      const salvaged =
        salvagePartialJsonArray(
          cleaned
        );

      if (salvaged.length > 0) {
        return res.status(200).json({
          success: true,
          questions: salvaged,
          provider:
            providerConfig.provider,
          model:
            providerConfig.model,
          truncated: true
        });
      }

      return res.status(502).json({
        success: false,
        error:
          'Respons AI tidak bisa dibaca sebagai JSON.',
        raw:
          cleaned.slice(0, 1000)
      });
    }
  } catch (error) {
    if (
      error?.name === 'AbortError'
    ) {
      return res.status(504).json({
        success: false,
        error:
          'Request AI timeout.'
      });
    }

    return res.status(
      error?.status || 500
    ).json({
      success: false,
      error:
        error?.message ||
        'Gagal memanggil AI.'
    });
  }
}