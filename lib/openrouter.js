const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free';
const TIMEOUT_MS = 20_000;

function cleanText(value = '') {
  return String(value ?? '').trim();
}

function extractJson(text) {
  const cleaned = String(text || '').replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first >= 0 && last > first) {
      try { return JSON.parse(cleaned.slice(first, last + 1)); } catch {}
    }
    return null;
  }
}

function normalizeUrl(value) {
  try {
    const u = new URL(String(value || ''));
    return ['http:', 'https:'].includes(u.protocol) ? u.toString() : '';
  } catch {
    return '';
  }
}

export async function extractQuestions({ apiKey, source, topic, mapel, kelas, jumlah, arahan }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const imageParts = source.images.slice(0, 1).map((url) => ({
    type: 'image_url',
    image_url: { url },
  }));

  const prompt = [
    'Kamu adalah Question Harvester Bimbel Gemilang.',
    'TUGAS UTAMA: EKSTRAK soal yang SUDAH ADA dari halaman sumber. JANGAN membuat soal baru, JANGAN memparafrasekan inti soal, dan JANGAN mengarang jawaban.',
    'Ambil sebanyak mungkin soal yang lengkap dari halaman, maksimum 5 soal dalam satu respons.',
    'Prioritaskan soal pilihan ganda yang memiliki pertanyaan + 4 opsi. Jika kunci jawaban/pembahasan tidak tersedia, correct harus null.',
    'Jika gambar pada kandidat merupakan stimulus soal, gunakan URL kandidat tersebut. Jangan pernah mengarang URL gambar.',
    'Kembalikan JSON OBJECT SAJA dengan bentuk {"questions":[...]}.',
    'Setiap soal: type, question, options, correct, correctAnswers, shortAnswer, explanation, imageUrl, imageHint.',
    'correct adalah index 0-3 untuk pilihan ganda bila kunci benar-benar tersedia. Jangan menebak.',
    'Sumber: soal berasal dari halaman yang diberikan, bukan hasil ciptaan model.',
    `Konteks: mapel=${mapel}; kelas=${kelas}; topik=${topic}; jumlah yang diminta=${jumlah}; arahan=${arahan || 'tidak ada'}`,
    `SOURCE_TITLE: ${source.title}`,
    `SOURCE_URL: ${source.url}`,
    `PAGE_TEXT:\n${source.text}`,
    source.images.length ? `CANDIDATE_IMAGE_URLS:\n${source.images.slice(0, 3).join('\n')}` : 'CANDIDATE_IMAGE_URLS: none',
  ].join('\n\n');

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Title': 'Bimbel Gemilang Question Harvester',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'Ekstrak konten sumber secara setia. Jangan pernah mengarang soal, jawaban, atau URL.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...imageParts,
            ],
          },
        ],
        temperature: 0.1,
        top_p: 0.8,
        max_tokens: 2200,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    const rawText = await response.text();
    let data = null;
    try { data = rawText ? JSON.parse(rawText) : null; } catch { data = null; }

    if (!response.ok) {
      const error = new Error(`OpenRouter HTTP ${response.status}`);
      error.providerStatus = response.status;
      error.providerMessage = String(
        data?.error?.message || data?.message || rawText || 'Unknown OpenRouter error',
      ).slice(0, 1500);
      throw error;
    }

    const content = data?.choices?.[0]?.message?.content;
    const parsed = extractJson(content);
    return {
      questions: Array.isArray(parsed?.questions) ? parsed.questions : [],
      model: data?.model || MODEL,
      usage: data?.usage || null,
      traceId: response.headers.get('x-request-id') || null,
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      const timeoutError = new Error(`OpenRouter timeout setelah ${TIMEOUT_MS}ms.`);
      timeoutError.code = 'OPENROUTER_TIMEOUT';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export { MODEL as OPENROUTER_MODEL, normalizeUrl, cleanText };