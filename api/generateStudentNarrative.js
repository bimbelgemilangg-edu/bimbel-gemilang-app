// ============================================================
// BIMBEL GEMILANG
// api/generateStudentNarrative.js
// ============================================================
//
// TUJUAN: menulis ULANG narasi evaluasi siswa (yang sudah dihitung
// 100% dari data asli oleh CekTugasSiswa.jsx) supaya kalimatnya lebih
// hangat & enak dibaca orang tua -- BUKAN membuat kesimpulan baru.
//
// 🔥 KENAPA INI AMAN (beda dari generateQuizFromTopic.js yang boleh
// "mengarang" soal baru): endpoint ini HANYA menerima ANGKA/FAKTA
// yang SUDAH diverifikasi dan dihitung secara deterministik di
// frontend (skor, akurasi per tipe/bobot/kompetensi, status kirim,
// dll) -- TIDAK PERNAH raw jawaban siswa atau data mentah lain. AI
// diinstruksikan KERAS untuk cuma memoles kalimat dari angka yang
// diberikan, DILARANG menyebut angka/istilah/kesimpulan yang gak ada
// di input. ManageQuiz/CekTugasSiswa TETAP menyimpan narasi rule-based
// sebagai fallback kalau panggilan ini gagal/timeout/limit habis --
// PDF laporan HARUS tetap bisa dibuat walau fitur ini down.
//
// ENV: pakai GROQ_API_KEY yang SAMA dengan generateQuizFromTopic.js
// (gak perlu setup env var baru).
//
// ============================================================

export const maxDuration = 20;

const GROQ_API_URL =
  'https://api.groq.com/openai/v1/chat/completions';

const GROQ_MODEL =
  process.env.GROQ_MODEL ||
  'openai/gpt-oss-120b';

const AI_TIMEOUT_MS = 12_000; // pendek sengaja -- ini fitur pemolesan, bukan inti; gak boleh bikin guru nunggu lama cuma buat kalimat lebih halus

function cleanText(value = '') {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// SYSTEM PROMPT -- pagar ketat anti-halusinasi
// ============================================================
function buildSystemPrompt() {
  return [
    'Kamu adalah penulis narasi evaluasi akademik untuk Bimbel Gemilang.',
    '',
    'ATURAN MUTLAK (PELANGGARAN = LAPORAN GAGAL DIPAKAI):',
    '1. Kamu HANYA boleh memakai angka dan fakta yang ADA di data JSON yang diberikan.',
    '2. DILARANG KERAS menyebutkan angka, persentase, nama soal, atau kesimpulan apa pun yang TIDAK ADA di data.',
    '3. DILARANG menebak/mengarang penyebab di balik suatu nilai (mis. "kemungkinan kurang belajar") -- cukup deskripsikan hasilnya secara netral dan suportif.',
    '4. Tulis dalam Bahasa Indonesia yang hangat, sopan, dan mudah dipahami orang tua awam (hindari istilah teknis seperti "akurasi", "partial fraction").',
    '5. Sebut siswa sebagai "Ananda", bukan nama langsung berulang-ulang.',
    '6. Panjang: 3-5 kalimat saja dalam SATU paragraf. Jangan pakai bullet point atau Markdown.',
    '7. Nada: membangun & suportif, bahkan untuk nilai rendah -- fokus ke area yang perlu didampingi, bukan menghakimi.',
    '8. Jangan ada salam pembuka/penutup ("Kepada Yth", "Hormat kami", dst) -- langsung isi narasinya saja.',
    '9. Output HANYA teks narasi polos. Tidak ada JSON, tidak ada markdown, tidak ada tanda kutip pembungkus.',
  ].join('\n');
}

function buildUserPrompt(stats) {
  return [
    'Tulis narasi evaluasi berdasarkan data berikut (HANYA pakai angka di sini):',
    '',
    JSON.stringify(stats),
  ].join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed.' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};

  // ==========================================================
  // VALIDASI INPUT -- HANYA terima field statistik yang sudah
  // dihitung, TOLAK kalau ada raw text bebas yang bisa dipakai buat
  // "menyuntik" instruksi lain ke prompt (prompt injection dari data
  // siswa, mis. nama siswa yang sengaja diisi teks aneh-aneh).
  // ==========================================================
  const stats = {
    studentFirstName: cleanText(body.studentFirstName).slice(0, 40) || 'siswa',
    modulTitle: cleanText(body.modulTitle).slice(0, 120) || 'kuis ini',
    score: Number.isFinite(Number(body.score)) ? Number(body.score) : null,
    correctAnswers: Number.isFinite(Number(body.correctAnswers)) ? Number(body.correctAnswers) : null,
    totalQuestions: Number.isFinite(Number(body.totalQuestions)) ? Number(body.totalQuestions) : null,
    isAutoSubmit: Boolean(body.isAutoSubmit),
    unansweredCount: Number.isFinite(Number(body.unansweredCount)) ? Number(body.unansweredCount) : 0,
    byDifficulty: Array.isArray(body.byDifficulty)
      ? body.byDifficulty.slice(0, 5).map(d => ({
          label: cleanText(d?.label).slice(0, 30),
          accuracyPercent: Number.isFinite(Number(d?.accuracyPercent)) ? Number(d.accuracyPercent) : null,
        }))
      : [],
    byCompetency: Array.isArray(body.byCompetency)
      ? body.byCompetency.slice(0, 8).map(c => ({
          label: cleanText(c?.label).slice(0, 80),
          accuracyPercent: Number.isFinite(Number(c?.accuracyPercent)) ? Number(c.accuracyPercent) : null,
        }))
      : [],
  };

  if (stats.score === null) {
    return res.status(400).json({ success: false, error: 'Data skor wajib diisi.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'GROQ_API_KEY belum dikonfigurasi.' });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt(stats) },
        ],
        temperature: 0.4,
        max_tokens: 400,
        stream: false,
      }),
      signal: controller.signal,
    });

    const responseText = await response.text();
    let data = null;
    try { data = responseText ? JSON.parse(responseText) : null; } catch (_) { data = null; }

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        error: 'Astro Gemilang gagal menyusun narasi.',
        diagnostics: { providerStatus: response.status, providerMessage: data?.error?.message || responseText?.slice(0, 300) || null },
      });
    }

    const narrative = cleanText(data?.choices?.[0]?.message?.content);

    if (!narrative) {
      return res.status(502).json({ success: false, error: 'Narasi kosong dari Astro Gemilang.' });
    }

    return res.status(200).json({ success: true, narrative });

  } catch (error) {
    const isTimeout = error?.name === 'AbortError';
    return res.status(isTimeout ? 504 : 502).json({
      success: false,
      error: isTimeout ? 'Astro Gemilang terlalu lama merespons.' : 'Gagal terhubung ke Astro Gemilang.',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}