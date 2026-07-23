// api/generateQuizFromTopic.js
// 🔥 Generate soal kuis dari topik (bukan cuma parsing teks yang sudah ada).
// Pakai Gemini, dengan arsitektur sama seperti generateMateriSection.js:
// model fallback (pintar dulu baru Flash-Lite), format JSONL biar tahan kepotong,
// dan self-check biar hitungan/kunci jawaban akurat.

const GEMINI_MODELS = [
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-2.5-flash-lite',
  ];
  
  async function callGemini(systemPrompt, userPrompt, modelName) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
  
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.3, // rendah — ini soal ujian, akurasi jauh lebih penting dari variasi
          maxOutputTokens: 16384,
        },
      }),
    });
  
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GEMINI_HTTP_${response.status}: ${errText}`);
    }
  
    return response.json();
  }
  
  const TYPE_DESCRIPTIONS = {
    multiple: `"multiple" — Pilihan Ganda: {"type":"multiple","question":"...","options":["opsi A","opsi B","opsi C","opsi D"],"correct":0,"explanation":"..."} (correct = index 0-3 dari options yang benar)`,
    truefalse: `"truefalse" — Tabel Benar/Salah, berisi beberapa pernyataan: {"type":"truefalse","question":"judul/instruksi tabel","statements":[{"text":"pernyataan 1","isTrue":true},{"text":"pernyataan 2","isTrue":false}],"explanation":"..."}`,
    multiselect: `"multiselect" — Pilih lebih dari satu jawaban benar: {"type":"multiselect","question":"...","options":["A","B","C","D"],"correctAnswers":[0,2],"explanation":"..."} (correctAnswers = array index yang semuanya benar)`,
    shortanswer: `"shortanswer" — Isian singkat: {"type":"shortanswer","question":"...","shortAnswer":"jawaban singkat yang benar","explanation":"..."}`,
    causeeffect: `"causeeffect" — Sebab Akibat ala soal SBMPTN: {"type":"causeeffect","question":"instruksi singkat (misal: Nilai kebenaran pernyataan sebab dan akibat berikut)","cause":"pernyataan sebab","effect":"pernyataan akibat","isCauseTrue":true,"isEffectTrue":true,"explanation":"..."}`,
    matching: `"matching" — Menjodohkan: {"type":"matching","question":"instruksi singkat (misal: Jodohkan istilah dengan definisinya)","matchingPairs":[{"left":"istilah 1","right":"definisi 1 yang benar"},{"left":"istilah 2","right":"definisi 2 yang benar"}],"explanation":"..."} (minimal 3 pasang, left dan right HARUS berpasangan benar berdasarkan urutan index yang sama)`,
  };
  
  const SYSTEM_PROMPT_TEMPLATE = (allowedTypes) => `Kamu adalah penyusun soal ujian untuk "Bimbel Gemilang" di Indonesia.
  
  KONDISI NYATA: soal yang kamu buat akan langsung dipakai menguji siswa. Kesalahan hitungan atau kunci jawaban yang salah akan membuat siswa yang menjawab BENAR malah disalahkan sistem — ini fatal dan harus dihindari mati-matian.
  
  ════════════════════════════════
  ATURAN YANG TIDAK BOLEH DILANGGAR
  ════════════════════════════════
  【1】 SETIAP soal hitungan WAJIB kamu kerjakan sendiri dulu langkah demi langkah di kepalamu untuk memastikan kunci jawabannya benar, SEBELUM menuliskannya. Kesalahan kunci jawaban adalah pelanggaran paling serius.
  【2】 Untuk pilihan ganda: 3 opsi pengecoh (yang salah) harus MASUK AKAL — bukan asal-asalan atau jelas keliru. Pengecoh yang bagus biasanya berasal dari kesalahan hitung yang umum dilakukan siswa (misal lupa satu langkah, tertukar rumus).
  【3】 Setiap soal WAJIB punya "explanation" (pembahasan) yang menjelaskan CARA mendapatkan jawaban itu, bukan cuma mengulang jawabannya.
  【4】 Bahasa dan tingkat kesulitan soal disesuaikan jenjang siswa yang diberikan. Kalau tidak disebutkan, asumsikan SMP.
  【5】 Tulis rumus/simbol matematika dalam LaTeX di antara tanda dolar, contoh: $\\frac{s}{t}$. Jangan tulis sebagai teks biasa.
  【6】 Kalau ada arahan khusus dari guru, WAJIB diikuti sebagai prioritas utama.
  【7】 Variasikan soal — jangan membuat beberapa soal yang isinya mirip/mengulang konsep yang sama persis, kecuali diminta.
  
  ════════════════════════════════
  TIPE SOAL YANG BOLEH DIPAKAI (hanya ini, sesuai permintaan guru)
  ════════════════════════════════
  ${allowedTypes.map(t => TYPE_DESCRIPTIONS[t]).join('\n')}
  
  ════════════════════════════════
  FORMAT JAWABAN — WAJIB JSONL (SATU BARIS = SATU SOAL)
  ════════════════════════════════
  Ini WAJIB supaya kalau jawabanmu terpotong di tengah (topik luas/banyak soal), soal yang sudah selesai tetap bisa dipakai.
  
  Baris PERTAMA metadata:
  {"meta": true}
  
  Baris berikutnya, SATU baris SATU soal, sesuai struktur tipe yang dipilih di atas.
  
  ATURAN KETAT FORMAT:
  - TIDAK ADA koma di akhir baris. TIDAK ADA kurung siku pembungkus semua soal. TIDAK ADA code fence/teks lain.
  - Setiap baris harus JSON tunggal yang valid dan LENGKAP.
  - Buat soal dari yang paling penting/mendasar dulu, supaya kalau terpotong, soal paling krusial sudah tersimpan.
  
  ════════════════════════════════
  PERIKSA SENDIRI SEBELUM MENJAWAB
  ════════════════════════════════
  1. Semua kunci jawaban sudah kuhitung ulang dan benar?
  2. Pengecoh pilihan ganda masuk akal, bukan asal?
  3. Semua soal punya pembahasan yang menjelaskan caranya?
  4. Tingkat kesulitan sudah pas jenjangnya?
  5. Format JSONL benar: satu baris satu objek, tanpa koma akhir, tanpa kurung siku?`;
  
  export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const { topic, mapel, kelas, jumlahSoal, types, arahan } = req.body;
  
    if (!topic) {
      return res.status(400).json({ error: 'Topik wajib diisi' });
    }
  
    const allowedTypes = Array.isArray(types) && types.length > 0 ? types : ['multiple'];
    const jumlah = Math.min(Math.max(parseInt(jumlahSoal) || 5, 1), 20);
  
    const systemPrompt = SYSTEM_PROMPT_TEMPLATE(allowedTypes);
  
    const arahanText = (arahan && arahan.trim())
      ? `\n\nArahan khusus dari guru (WAJIB diikuti):\n${arahan.trim()}`
      : '';
  
    const userPrompt = `Mata pelajaran: ${mapel || 'Umum'}
  Topik/materi: ${topic}${kelas ? `\nJenjang/kelas: ${kelas}` : ''}
  Jumlah soal yang diminta: ${jumlah}
  Tipe soal yang boleh dipakai: ${allowedTypes.join(', ')}${arahanText}
  
  Buat ${jumlah} soal sekarang sesuai semua aturan di atas.`;
  
    let geminiData;
    let lastErr;
  
    for (const modelName of GEMINI_MODELS) {
      try {
        geminiData = await callGemini(systemPrompt, userPrompt, modelName);
        lastErr = null;
        console.log(`generateQuizFromTopic sukses pakai model: ${modelName}`);
        break;
      } catch (e) {
        lastErr = e;
        console.error(`generateQuizFromTopic gagal pakai model ${modelName}:`, e.message);
        const isQuotaOrNotFound = e.message.includes('429') || e.message.includes('404');
        if (!isQuotaOrNotFound) {
          await new Promise(r => setTimeout(r, 2000));
          try {
            geminiData = await callGemini(systemPrompt, userPrompt, modelName);
            lastErr = null;
            break;
          } catch (e2) {
            lastErr = e2;
          }
        }
      }
    }
  
    if (lastErr) {
      const isQuota = lastErr.message.includes('429');
      return res.status(502).json({
        error: isQuota
          ? 'Kuota gratis AI hari ini sudah habis di semua model. Coba lagi besok.'
          : 'Gagal menghubungi AI. Coba lagi beberapa saat lagi.',
        debug: lastErr.message,
      });
    }
  
    try {
      const candidate = geminiData?.candidates?.[0];
      const rawText = candidate?.content?.parts?.[0]?.text || '';
  
      if (!rawText) {
        return res.status(502).json({ error: 'AI tidak mengembalikan jawaban, coba generate ulang.' });
      }
  
      // Scanner JSONL yang tahan terhadap jawaban terpotong (sama seperti generateMateriSection.js)
      const extractJsonObjects = (text) => {
        const objects = [];
        let depth = 0;
        let start = -1;
        let inString = false;
        let escapeNext = false;
        for (let i = 0; i < text.length; i++) {
          const ch = text[i];
          if (escapeNext) { escapeNext = false; continue; }
          if (ch === '\\') { escapeNext = true; continue; }
          if (ch === '"') { inString = !inString; continue; }
          if (inString) continue;
          if (ch === '{') {
            if (depth === 0) start = i;
            depth++;
          } else if (ch === '}') {
            depth--;
            if (depth === 0 && start !== -1) {
              try {
                objects.push(JSON.parse(text.slice(start, i + 1)));
              } catch (e) {
                // objek rusak, lewati
              }
              start = -1;
            }
          }
        }
        return objects;
      };
  
      const objects = extractJsonObjects(rawText);
      const questionObjs = objects.filter(o => o.meta !== true && o.question);
  
      if (questionObjs.length === 0) {
        return res.status(502).json({
          error: candidate?.finishReason === 'MAX_TOKENS'
            ? 'AI belum sempat menulis soal sebelum terpotong. Coba kurangi jumlah soal atau tipe yang diminta.'
            : 'AI tidak menghasilkan soal yang valid, coba generate ulang.',
        });
      }
  
      const sanitizeText = (s = '') => String(s).replace(/<script[\s\S]*?<\/script>/gi, '');
  
      const questions = questionObjs.map((q) => {
        const type = allowedTypes.includes(q.type) ? q.type : allowedTypes[0];
        return {
          type,
          question: sanitizeText(q.question || ''),
          options: Array.isArray(q.options) ? q.options.map(sanitizeText) : undefined,
          correct: typeof q.correct === 'number' ? q.correct : undefined,
          correctAnswers: Array.isArray(q.correctAnswers) ? q.correctAnswers : undefined,
          statements: Array.isArray(q.statements)
            ? q.statements.map(s => ({ text: sanitizeText(s.text || ''), isTrue: !!s.isTrue }))
            : undefined,
          shortAnswer: q.shortAnswer ? sanitizeText(q.shortAnswer) : undefined,
          cause: q.cause ? sanitizeText(q.cause) : undefined,
          effect: q.effect ? sanitizeText(q.effect) : undefined,
          isCauseTrue: q.isCauseTrue !== undefined ? !!q.isCauseTrue : undefined,
          isEffectTrue: q.isEffectTrue !== undefined ? !!q.isEffectTrue : undefined,
          matchingPairs: Array.isArray(q.matchingPairs)
            ? q.matchingPairs.map(p => ({ left: sanitizeText(p.left || ''), right: sanitizeText(p.right || '') }))
            : undefined,
          explanation: sanitizeText(q.explanation || ''),
        };
      });
  
      const possiblyTruncated = candidate?.finishReason === 'MAX_TOKENS' || questions.length < jumlah;
  
      return res.status(200).json({
        success: true,
        questions,
        possiblyTruncated,
      });
    } catch (error) {
      console.error('generateQuizFromTopic parse error:', error);
      return res.status(500).json({ error: 'Terjadi kesalahan server: ' + error.message });
    }
  }