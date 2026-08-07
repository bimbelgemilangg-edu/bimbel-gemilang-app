// api/generateGuruLearningAid.js
//
// 🔥 ALAT BANTU GURU — WAJIB DIGROUNDING ke teks buku paket yang guru
// upload sendiri, AI DILARANG mengarang fakta di luar teks itu.
//
// 🔥 BARU (revisi ini):
// 1) Sekarang terima DUA sumber terpisah: `sourceTextGuru` (dari Buku Guru
//    -- biasanya sudah terstruktur Capaian Pembelajaran/Tujuan
//    Pembelajaran/RPP) dan `sourceTextSiswa` (dari Buku Siswa -- materi
//    inti, rumus, contoh soal). Kalau cuma satu yang dikirim, tetap jalan
//    (yang lain string kosong).
// 2) Kalau sumber yang dikasih TERNYATA TIDAK MENCAKUP topik yang diminta
//    (contoh: guru minta "Integral" tapi sumbernya cuma Bab Turunan
//    Fungsi), AI WAJIB balas `source_insufficient: true` + `insufficient_note`
//    yang menjelaskan apa yang kurang -- BUKAN menulis penolakan di dalam
//    field capaian_pembelajaran/rpp_ringkas/materi_inti seolah itu konten
//    beneran. Ini penting supaya frontend bisa tampilkan peringatan yang
//    jelas, bukan kartu hasil yang isinya membingungkan guru.

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
          temperature: 0.3,
          maxOutputTokens: 8192,
        },
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`GEMINI_HTTP_${response.status}: ${errText}`);
    }
    return response.json();
  }
  
  const SYSTEM_PROMPT = `Kamu adalah asisten penyusun alat bantu mengajar untuk GURU di "Bimbel Gemilang" Indonesia.
  
  ATURAN PALING PENTING — DIGROUNDING KE SUMBER:
  Kamu akan diberi TEKS ASLI dari buku paket yang guru upload sendiri, dibagi jadi maksimal DUA kelompok:
  - <SUMBER_BUKU_GURU>: teks dari Buku Guru (biasanya sudah berisi Capaian Pembelajaran/Tujuan Pembelajaran/rencana pengajaran yang ditulis resmi).
  - <SUMBER_BUKU_SISWA>: teks dari Buku Siswa (materi inti, definisi, rumus, contoh soal).
  Salah satu kelompok BISA KOSONG kalau guru cuma upload satu jenis buku -- itu wajar, tetap kerjakan sebaik mungkin dari yang tersedia.
  
  Tugasmu MENYUSUN ULANG isi kedua sumber itu jadi tiga bagian yang siap pakai guru -- BUKAN mengarang fakta baru dari pengetahuan umummu. Prioritas pengambilan:
  - "capaian_pembelajaran" dan "rpp_ringkas": UTAMAKAN dari SUMBER_BUKU_GURU kalau ada (karena itu sumber resmi yang literally sudah berformat begitu). Kalau SUMBER_BUKU_GURU kosong/tidak cukup, susun dari SUMBER_BUKU_SISWA sesuai kaidah Kurikulum Merdeka.
  - "materi_inti": UTAMAKAN dari SUMBER_BUKU_SISWA kalau ada (materi lebih dalam & lengkap contoh soalnya). Kalau kosong, pakai apa yang ada di SUMBER_BUKU_GURU.
  
  🔴 ATURAN WAJIB SOAL SUMBER TIDAK CUKUP:
  Sebelum menulis apa pun, cek dulu: apakah topik yang diminta ("Topik yang diminta" di bawah) BENAR-BENAR dibahas secara substantif di salah satu/kedua sumber di atas -- bukan cuma disebut sekilas sebagai referensi silang ke bab lain?
  
  - Kalau topiknya TIDAK cukup dibahas di sumber manapun: JANGAN menulis apa pun di capaian_pembelajaran/rpp_ringkas/materi_inti (isi ketiganya dengan string kosong ""). Sebagai gantinya, set "source_insufficient": true dan isi "insufficient_note" dengan penjelasan singkat & jujur: apa yang ADA di sumber (kalau ada bab lain yang relevan disebutkan, sebutkan judulnya), dan apa yang KURANG untuk topik yang diminta.
  - Kalau topiknya CUKUP dibahas (walau di salah satu sumber saja): isi ketiga field seperti biasa, dan set "source_insufficient": false, "insufficient_note": "".
  - JANGAN PERNAH menulis kalimat penolakan/permintaan maaf DI DALAM field capaian_pembelajaran/rpp_ringkas/materi_inti. Kalau kamu merasa perlu menulis "materi ini tidak ditemukan..." -- itu tandanya kamu harus pakai jalur source_insufficient di atas, bukan menulisnya sebagai konten.
  
  Kamu menulis untuk GURU BUKAN SISWA -- boleh lebih teknis, boleh membahas "kenapa", dan asumsikan pembacanya sudah punya latar belakang mengajar tapi mungkin belum baca bagian buku ini.
  
  Balas HANYA dalam format JSON tunggal (bukan JSONL, bukan array) persis seperti ini, tanpa teks pembuka/penutup/code fence:
  {
    "source_insufficient": false,
    "insufficient_note": "",
    "capaian_pembelajaran": "HTML: pernyataan capaian pembelajaran yang jelas dan terukur untuk topik ini, sesuai gaya Kurikulum Merdeka (fokus pada KOMPETENSI yang didapat siswa, bukan sekadar daftar materi). Boleh pakai <p><ul><li><b>. Kosongkan kalau source_insufficient true.",
    "rpp_ringkas": "HTML: RPP ringkas 1 pertemuan -- WAJIB memuat: <b>Tujuan Pembelajaran</b> (poin-poin), <b>Langkah Pembelajaran</b> (Pendahuluan/Kegiatan Inti/Penutup, tiap bagian dengan estimasi menit), dan <b>Asesmen</b> (cara mengecek pemahaman siswa di akhir). Format pakai <p><b><ul><li>. Kosongkan kalau source_insufficient true.",
    "materi_inti": "HTML: materi inti buat guru pelajari/sampaikan -- rumus (LaTeX pakai tanda dolar $...$ atau $$...$$), definisi kunci, MINIMAL 2 contoh soal dengan langkah pengerjaan bernomor, DAN kalau relevan sertakan 'Cara Gemilang' (jembatan keledai/trik cepat) buat bagian yang perlu dihafal -- tapi JANGAN dipaksakan kalau topiknya tidak butuh. Boleh pakai <p><b><i><ul><li><pre>. Kosongkan kalau source_insufficient true."
  }
  
  ATURAN TAMBAHAN:
  - Semua angka dalam contoh soal WAJIB dihitung ulang dan dipastikan benar.
  - Kalau di sumber ada metode/trik yang disebut namanya tapi caranya tidak digambarkan lengkap, kamu WAJIB melengkapi cara kerjanya secara jelas pakai <pre> supaya guru langsung paham cara mengajarkannya.
  - Tulis angka dengan format Indonesia (1.250.000, bukan 1,250,000).
  - JANGAN gunakan tag <span class="gem-pop"> di sini (itu fitur khusus untuk materi siswa, gak relevan buat guru).
  - Kalau ada arahan khusus dari guru, prioritaskan itu selama masih konsisten dengan teks sumber.`;
  
  export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    const {
      topic, mapel, kelas, arahan,
      sourceTextGuru, sourceLabelGuru,
      sourceTextSiswa, sourceLabelSiswa,
      pageRangeLabel,
    } = req.body;
  
    if (!topic) return res.status(400).json({ error: 'Topik wajib diisi' });
    if (!(sourceTextGuru || '').trim() && !(sourceTextSiswa || '').trim()) {
      return res.status(400).json({ error: 'Teks sumber kosong. Cek lagi buku/rentang halaman yang dipilih.' });
    }
  
    // 🔥 Batasi panjang tiap sumber -- kalau rentangnya kelewat luas, potong
    // biar gak melebihi kapasitas model & biar AI tetap fokus.
    const MAX_SOURCE_CHARS = 45000; // per sumber, jadi total maks ~90000 kalau dua-duanya kepakai
    const trim = (t) => {
      if (!t) return '';
      return t.length > MAX_SOURCE_CHARS ? t.slice(0, MAX_SOURCE_CHARS) + '\n\n[...teks dipotong karena terlalu panjang...]' : t;
    };
    const trimmedGuru = trim(sourceTextGuru);
    const trimmedSiswa = trim(sourceTextSiswa);
  
    const arahanText = (arahan && arahan.trim())
      ? `\n\nArahan khusus dari guru (WAJIB dipatuhi selama konsisten dengan teks sumber):\n${arahan.trim()}`
      : '';
  
    const userPrompt = `Mata pelajaran: ${mapel || 'Umum'}
  Kelas/jenjang: ${kelas || '-'}
  Topik yang diminta: ${topic}
  Rentang sumber: ${pageRangeLabel || '-'}${arahanText}
  
  <SUMBER_BUKU_GURU label="${sourceLabelGuru || '-'}">
  ${trimmedGuru || '(kosong -- guru tidak upload/pilih Buku Guru)'}
  </SUMBER_BUKU_GURU>
  
  <SUMBER_BUKU_SISWA label="${sourceLabelSiswa || '-'}">
  ${trimmedSiswa || '(kosong -- guru tidak upload/pilih Buku Siswa)'}
  </SUMBER_BUKU_SISWA>
  
  Susun Capaian Pembelajaran, RPP Ringkas, dan Materi Inti untuk topik "${topic}" berdasarkan teks sumber di atas, sesuai format JSON yang ditentukan. Ingat: cek dulu apakah topik ini BENAR-BENAR dibahas di sumber sebelum menulis apa pun -- kalau tidak, pakai jalur source_insufficient.`;
  
    let geminiData;
    let lastErr;
  
    for (const modelName of GEMINI_MODELS) {
      try {
        geminiData = await callGemini(SYSTEM_PROMPT, userPrompt, modelName);
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
        console.error(`generateGuruLearningAid gagal pakai model ${modelName}:`, e.message);
      }
    }
  
    if (lastErr) {
      const isQuota = lastErr.message.includes('429');
      return res.status(502).json({
        error: isQuota
          ? 'Kuota gratis AI hari ini sudah habis di semua model. Silakan coba lagi besok.'
          : 'Gagal menghubungi AI. Coba lagi beberapa saat lagi.',
        debug: lastErr.message,
      });
    }
  
    try {
      const candidate = geminiData?.candidates?.[0];
      let rawText = candidate?.content?.parts?.[0]?.text || '';
  
      if (!rawText) {
        return res.status(502).json({ error: 'AI tidak mengembalikan jawaban, coba generate ulang.' });
      }
  
      rawText = rawText.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {
        const match = rawText.match(/\{[\s\S]*\}/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch (e2) { /* biarkan parsed undefined */ }
        }
      }
  
      if (!parsed) {
        console.error('Gagal parse JSON dari AI. Cuplikan:', rawText.slice(0, 300));
        return res.status(502).json({ error: 'AI mengembalikan format tidak terbaca, coba generate ulang.' });
      }
  
      const sanitize = (html = '') =>
        String(html).replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+="[^"]*"/gi, '');
  
      const isInsufficient = !!parsed.source_insufficient;
  
      return res.status(200).json({
        success: true,
        source_insufficient: isInsufficient,
        insufficient_note: isInsufficient ? sanitize(parsed.insufficient_note || 'Sumber yang dipilih belum membahas topik ini secara memadai.') : '',
        capaian_pembelajaran: isInsufficient ? '' : sanitize(parsed.capaian_pembelajaran || '<p>Belum tersedia.</p>'),
        rpp_ringkas: isInsufficient ? '' : sanitize(parsed.rpp_ringkas || '<p>Belum tersedia.</p>'),
        materi_inti: isInsufficient ? '' : sanitize(parsed.materi_inti || '<p>Belum tersedia.</p>'),
        pageRangeLabel: pageRangeLabel || '-',
      });
    } catch (error) {
      console.error('generateGuruLearningAid parse error:', error);
      return res.status(500).json({ error: 'Terjadi kesalahan server: ' + error.message });
    }
  }