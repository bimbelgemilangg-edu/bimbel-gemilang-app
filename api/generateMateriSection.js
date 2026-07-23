// api/generateMateriSection.js
// 🔥 VERSI BUKU DIGITAL — sekali panggil AI, langsung jadi SATU MODUL LENGKAP
// (beberapa bagian sekaligus), bukan per-poin seperti versi lama.
//
// Kenapa diubah: kuota gratis Gemini dihitung PER PANGGILAN, bukan per panjang isi.
// Versi lama: 1 modul 5 poin = 5 panggilan  -> cuma ~4 modul/hari
// Versi ini : 1 modul = 1 panggilan         -> ~20 modul/hari, isi lebih nyambung

// Kuota gratis dihitung PER MODEL. Urutan ini sengaja "pintar dulu":
// model terbaik dipakai selama jatahnya masih ada, kalau habis otomatis turun
// ke Flash-Lite yang jatah hariannya jauh lebih besar (biar tidak mentok total).
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
        temperature: 0.7,
        maxOutputTokens: 16384,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`GEMINI_HTTP_${response.status}: ${errText}`);
  }

  return response.json();
}

const SYSTEM_PROMPT = `Kamu adalah penyusun buku ajar digital untuk "Bimbel Gemilang" di Indonesia.
Tugasmu: dari SATU judul materi, susun SATU MODUL LENGKAP yang terbagi jadi beberapa bagian, siap dibaca siswa sendiri di rumah.

=== LANGKAH 1: TENTUKAN JENIS MATERI ===
Pertama tentukan dulu materi ini termasuk jenis apa:
- "eksakta" = materi yang inti belajarnya adalah RUMUS, SATUAN, PERHITUNGAN, atau LANGKAH PENGERJAAN. Contoh: Matematika, Fisika, Kimia, dan bagian IPA yang berhitung.
- "naratif" = materi yang inti belajarnya adalah KONSEP, CERITA, atau PEMAHAMAN. Contoh: Bahasa Indonesia, IPS, Sejarah, Biologi deskriptif.

=== LANGKAH 2: TULIS SESUAI JENISNYA ===

>>> KALAU "eksakta" — INI ATURAN PALING PENTING, PATUHI KETAT:
- Pengertian/definisi HANYA BOLEH 1 paragraf pendek di bagian pertama. JANGAN bertele-tele. Siswa butuh bisa MENGERJAKAN, bukan cuma tahu artinya.
- WAJIB ada bagian khusus RUMUS: tulis rumusnya, jelaskan tiap simbol artinya apa, dan KAPAN rumus itu dipakai.
- WAJIB ada minimal 2 CONTOH SOAL dengan pembahasan LANGKAH DEMI LANGKAH bernomor (Langkah 1, Langkah 2, ...), lengkap dengan angka aslinya sampai ketemu jawaban akhir.
- WAJIB ada bagian "Langkah Gemilang": trik cepat / cara pintas / pola yang bikin siswa bisa ngerjain lebih cepat dari cara biasa.
- DILARANG menulis paragraf naratif panjang yang tidak mengajarkan cara mengerjakan.
- Tulis SEMUA rumus dan simbol matematika dalam format LaTeX di antara tanda dolar. Contoh: $U_n = a + (n-1)b$ atau $v = \\\\frac{s}{t}$. JANGAN tulis rumus sebagai teks biasa.

>>> KALAU "naratif":
- Boleh lebih bercerita, tapi setiap konsep WAJIB diikuti contoh konkret dari kehidupan sehari-hari siswa Indonesia.
- Kalau isinya berupa daftar/kategori/urutan, WAJIB pakai <ul><li><b>Nama</b>: penjelasan</li></ul>, jangan digabung jadi paragraf panjang.

=== ATURAN UMUM (dua-duanya) ===
- Bahasa Indonesia yang hangat, ramah siswa, tapi tetap benar secara akademis.
- Bagi modul jadi 4 sampai 6 bagian yang berurutan logis. Bagian pertama pembuka/dasar, bagian terakhir penerapan atau contoh soal.
- Tiap bagian punya judul yang jelas dan spesifik (bukan "Bagian 1").

=== ATURAN KALIBRASI JENJANG (SANGAT PENTING) ===
Sesuaikan bahasa DAN besaran angka dengan jenjang siswa:
- SD kelas 1-3: kalimat sangat pendek (maksimal 12 kata), kata sehari-hari yang dikenal anak, angka cukup sampai ratusan.
- SD kelas 4-6: kalimat pendek dan sederhana, angka wajar sampai puluhan ribu. JANGAN pakai angka jutaan/miliaran KECUALI materinya memang khusus tentang bilangan besar. Setiap istilah teknis WAJIB dijelaskan pakai bahasa anak.
- SMP: boleh istilah akademis, tapi tetap dijelaskan saat pertama kali muncul.
- SMA/SMK: boleh formal, abstrak, dan lebih padat.
- Kalau jenjang tidak disebutkan guru, asumsikan SMP.
Contoh kalimat yang DILARANG untuk SD: "mensejajarkan tanda titik dan nilai tempatnya".
Contoh yang BENAR untuk SD: "susun angkanya lurus ke bawah, mulai dari angka paling kanan".

=== ATURAN PERHITUNGAN BERSUSUN ===
Kalau mengajarkan penjumlahan/pengurangan/perkalian bersusun:
- WAJIB ditampilkan benar-benar tersusun ke bawah memakai tag <pre> supaya angkanya sejajar. Contoh:
<pre>   1.250.000
+    345.000
------------
   1.595.000</pre>
- DILARANG menulisnya mendatar dalam satu baris.
- DILARANG menulis angka dengan nol di depan (salah: 0.345.000).
- Setiap langkah perhitungan ditulis di baris sendiri, sebutkan nilai tempatnya (satuan, puluhan, ratusan), jangan digabung jadi satu baris panjang.

=== ATURAN INTERAKTIF (WAJIB ADA) ===
Siswa harus bisa memencet bagian penting untuk melihat penjelasannya. Caranya, bungkus 2 sampai 5 bagian penting di tiap section dengan:
<span class="gem-pop" data-info="penjelasan singkat 1-2 kalimat sesuai jenjang">teks yang ditandai</span>
- Yang ditandai boleh berupa: potongan angka (misal bagian "350" dari 2.350.400.000), istilah penting, nama simbol rumus, atau kata sulit.
- Penjelasannya harus MENAMBAH pemahaman, bukan mengulang kata yang sama.
- DILARANG menaruh tanda dolar ($), tanda kutip ganda, atau tag HTML lain di dalam data-info.
- DILARANG menaruh span ini di dalam rumus LaTeX (di antara tanda dolar).
- Maksimal 5 penanda per bagian supaya tidak ramai.

=== ATURAN "Langkah Gemilang" (mnemonic / jembatan keledai) ===
Untuk bagian yang isinya perlu DIHAFAL (urutan, daftar satuan, rumus), buat jembatan keledai:
- DILARANG bikin singkatan gabungan suku kata yang tidak bermakna (contoh JELEK: "PA-MA-WA-SU-KU-IN-JUM").
- WAJIB berupa SATU KALIMAT INDONESIA ASLI yang lucu / mudah dibayangkan. Contoh kualitas yang harus ditiru:
  * "Kucing Hitam Dalam Mobil Desi Centil Mondar-Mandir" (km-hm-dam-m-dm-cm-mm)
  * "Waktu Sekolah Intan Cantik Pantang Menyerah Jualan Molen" (waktu-suhu-intensitas cahaya-arus listrik-panjang-massa-jumlah zat)
- flashcard_front = kalimat mnemonic-nya.
- flashcard_back = pemetaan tiap kata ke istilah aslinya, format: "<b>Kata</b> → Istilah Asli (satuan)<br>" per baris.

=== FORMAT JAWABAN ===
Balas HANYA JSON valid, tanpa teks lain, persis seperti ini:
{
  "subject_type": "eksakta atau naratif",
  "sections": [
    {
      "title": "judul bagian yang spesifik",
      "content_html": "isi bagian, boleh pakai <p>, <b>, <i>, <ul>, <li>, <ol>, <pre>, dan <span class=gem-pop data-info=...> saja",
      "highlight_type": "mnemonic atau funfact atau none",
      "funfact_html": "diisi hanya kalau highlight_type=funfact, 1-3 kalimat menarik",
      "flashcard_front": "diisi hanya kalau highlight_type=mnemonic",
      "flashcard_back": "diisi hanya kalau highlight_type=mnemonic",
      "needs_image": true atau false,
      "image_keyword": "1-3 kata benda konkret BAHASA INGGRIS untuk cari foto, kosongkan kalau needs_image false"
    }
  ]
}

Panduan needs_image: true HANYA untuk objek/makhluk/alat/tempat nyata yang siswa terbantu kalau MELIHAT wujud aslinya. Untuk rumus dan konsep abstrak, selalu false.
Panduan highlight_type: pakai "mnemonic" kalau bagian itu ada yang perlu dihafal DAN kalimat mnemonic-nya bisa dibuat natural. Pakai "funfact" kalau ada fakta menarik. Pakai "none" kalau bagian itu isinya contoh soal/perhitungan.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, mapel, poin, kelas } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Judul materi wajib diisi' });
  }

  const arahanGuru = (poin && poin.trim())
    ? `\n\nArahan khusus dari guru (WAJIB dipatuhi, jadikan panduan isi modul):\n${poin.trim()}`
    : `\n\nGuru tidak memberi arahan khusus. Tentukan sendiri bagian-bagian penting yang harus dikuasai siswa untuk materi ini, sesuai kurikulum Indonesia.`;

  const userPrompt = `Mata pelajaran: ${mapel || 'Umum'}
Judul materi: ${topic}${kelas ? `\nJenjang/kelas: ${kelas}` : ''}${arahanGuru}

Susun modul lengkapnya sekarang sesuai semua aturan di atas.`;

  let geminiData;
  let lastErr;

  for (const modelName of GEMINI_MODELS) {
    try {
      geminiData = await callGemini(SYSTEM_PROMPT, userPrompt, modelName);
      lastErr = null;
      console.log(`generateMateriSection sukses pakai model: ${modelName}`);
      break;
    } catch (e) {
      lastErr = e;
      console.error(`generateMateriSection gagal pakai model ${modelName}:`, e.message);

      // Kalau bukan soal kuota habis / model tidak ada, kasih 1 kesempatan ulang
      // di model yang sama (mungkin server lagi sibuk sesaat).
      const isQuotaOrNotFound = e.message.includes('429') || e.message.includes('404');
      if (!isQuotaOrNotFound) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          geminiData = await callGemini(SYSTEM_PROMPT, userPrompt, modelName);
          lastErr = null;
          break;
        } catch (e2) {
          lastErr = e2;
          console.error(`retry model ${modelName} juga gagal:`, e2.message);
        }
      }
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
    const rawText = candidate?.content?.parts?.[0]?.text || '';

    if (!rawText) {
      console.error('Respons AI kosong. finishReason:', candidate?.finishReason);
      return res.status(502).json({ error: 'AI tidak mengembalikan jawaban, coba generate ulang.' });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('JSON tidak ditemukan. finishReason:', candidate?.finishReason);
        return res.status(502).json({
          error: candidate?.finishReason === 'MAX_TOKENS'
            ? 'Materi terlalu luas sehingga jawaban AI kepotong. Coba persempit judulnya (misal pecah jadi 2 modul terpisah).'
            : 'AI mengembalikan format tidak valid, coba generate ulang.',
        });
      }
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e2) {
        return res.status(502).json({
          error: candidate?.finishReason === 'MAX_TOKENS'
            ? 'Materi terlalu luas sehingga jawaban AI kepotong. Coba persempit judulnya (misal pecah jadi 2 modul terpisah).'
            : 'AI mengembalikan JSON rusak, coba generate ulang.',
        });
      }
    }

    const sanitize = (html = '') =>
      String(html).replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+="[^"]*"/gi, '');

    const rawSections = Array.isArray(parsed.sections) ? parsed.sections : [];
    if (rawSections.length === 0) {
      return res.status(502).json({ error: 'AI tidak menghasilkan bagian materi apapun, coba generate ulang.' });
    }

    const sections = rawSections.map((s, i) => {
      const isMnemonic = s.highlight_type === 'mnemonic' && s.flashcard_front && s.flashcard_back;
      const isFunfact = s.highlight_type === 'funfact' && s.funfact_html;
      return {
        title: sanitize(s.title || `Bagian ${i + 1}`),
        content_html: sanitize(s.content_html || ''),
        highlight_type: isMnemonic ? 'mnemonic' : (isFunfact ? 'funfact' : 'none'),
        funfact_html: isFunfact ? sanitize(s.funfact_html) : '',
        flashcard_front: isMnemonic ? sanitize(s.flashcard_front) : '',
        flashcard_back: isMnemonic ? sanitize(s.flashcard_back) : '',
        needs_image: !!s.needs_image,
        image_keyword: s.image_keyword || '',
      };
    });

    return res.status(200).json({
      success: true,
      subject_type: parsed.subject_type === 'eksakta' ? 'eksakta' : 'naratif',
      sections,
    });
  } catch (error) {
    console.error('generateMateriSection parse error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan server: ' + error.message });
  }
}