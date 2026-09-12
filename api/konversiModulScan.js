// api/konversiModulScan.js
// ============================================================
// 🔥 MESIN TULIS ULANG MODUL SCAN -> BAB INTERAKTIF (0 RUPIAH)
// Gambar halaman scan dikirim ke AI VISION gratis, lalu DITULIS
// ULANG jadi bab terstruktur skema buku digital kita:
// sections + blocks (p/list/math/contoh/tips/gambar) + visual
// interaktif (tabel/bangun/garis/termometer) + ujiPemahaman
// (pg/multi/bs) lengkap dengan kunci & pembahasan.
//
// PROVIDER GRATIS (rantai cadangan otomatis; yang mati dilewati):
//   1) Groq       -> GROQ_API_KEY
//   2) OpenRouter -> OPENROUTER_API_KEY (model :free verifikasi
//      hidup per 12 Sep 2026 lewat openrouter.ai/api/v1/models)
//   3) Mistral    -> MISTRAL_API_KEY
// Cukup isi kunci yang ada. Menu AI lain TIDAK terpengaruh.
//
// Desain hemat kuota: 1 bab = 1 panggilan (maks 10 halaman).
// Gambar figur TIDAK dibuat AI: client mengirim placeholder
// {{GAMBAR_n}} hasil potongan halaman yang sudah diupload ke
// Supabase; AI hanya boleh MEMAKAI placeholder itu.
// ============================================================

export const config = {
    maxDuration: 60,
  };
  
  const PROVIDERS = [
    {
      nama: 'groq',
      key: () => process.env.GROQ_API_KEY,
      base: 'https://api.groq.com/openai/v1',
      models: () => String(process.env.GROQ_MODELS || '')
        .split(',').map((x) => x.trim()).filter(Boolean)
        .concat([
          'meta-llama/llama-4-scout-17b-16e-instruct',
          'llama-4-scout-17b-16e-instruct',
          'meta-llama/llama-4-maverick-17b-128e-instruct',
          'llama-3.2-90b-vision-preview',
        ]),
    },
    {
      nama: 'openrouter',
      key: () => process.env.OPENROUTER_API_KEY,
      base: 'https://openrouter.ai/api/v1',
      models: () => String(process.env.OPENROUTER_MODELS || '')
        .split(',').map((x) => x.trim()).filter(Boolean)
        .concat([
          'google/gemma-4-31b-it:free',
          'thinkingmachines/inkling:free',
          'inclusionai/ling-3.0-flash-vl:free',
          'nex-agi/nex-n2.5-pro:free',
          'google/gemma-4-26b-a4b-it:free',
        ]),
    },
    {
      nama: 'mistral',
      key: () => process.env.MISTRAL_API_KEY,
      base: 'https://api.mistral.ai/v1',
      models: () => ['pixtral-12b-2409', 'pixtral-large-latest'],
    },
  ];
  
  const SYSTEM_PROMPT = `Kamu adalah mesin penulis ulang modul pelajaran Indonesia (matematika TKA/TKD, IPA, dll) yang sangat teliti.
  Kamu menerima GAMBAR halaman-halaman modul hasil SCAN (berurutan) dan harus MENULIS ULANG isinya menjadi SATU bab buku digital interaktif dalam format JSON.
  
  ATURAN ISI:
  1. Tulis ulang dengan bahasa Indonesia yang rapi dan bersih. BUANG artefak scan: nomor halaman, header/footer berulang, watermark/akun sosial media, iklan, ornamen.
  2. JANGAN meringkas materi: semua definisi, sifat, rumus, contoh, dan langkah harus ikut. Angka dan simbol TIDAK BOLEH berubah.
  3. Rumus ditulis dengan LaTeX bersih:
     - Inline: $...$  contoh $x^2$, $\\frac{a}{b}$, $\\sqrt{2}$
     - Display (blok math): teks LaTeX tanpa dolar.
     - Pecahan \\frac{p}{q}; akar \\sqrt{n} atau \\sqrt[n]{x}; pangkat x^{n}; indeks x_{i}; derajat 45^\\circ; kali \\times; bagi \\div; kurang-lebih \\pm; sudut \\angle.
  4. Struktur keluaran:
     {
       "judul": "judul bab rapi seperti tercetak",
       "sections": [ { "judul": "A. Nama Subbab", "blocks": [ ... ] } ],
       "ujiPemahaman": [ ... ]
     }
  5. Tipe block yang DIIZINKAN di dalam blocks:
     - {"tipe":"p","teks":"paragraf materi..."}
     - {"tipe":"list","items":["poin 1","poin 2"]}
     - {"tipe":"math","teks":"rumus LaTeX display tanpa dolar"}
     - {"tipe":"contoh","teks":"contoh soal + langkah penyelesaian LaTeX"}
     - {"tipe":"tips","teks":"tips/catat cepat"}
     - {"tipe":"gambar","src":"{{GAMBAR_n}}","alt":"deskripsi singkat","caption":"Gambar n. keterangan"}  <-- HANYA boleh memakai placeholder dari daftar GAMBAR TERSEDIA; jika tidak ada yang cocok, JANGAN pakai blok gambar.
  6. Block apa pun BOLEH punya field "visual" interaktif (pilih yang paling cocok, jangan memaksakan):
     - Tabel:  {"tipe":"tabel","caption":"...","kepala":["Kol1","Kol2"],"baris":[["a","b"],["c","d"]]}
     - Bangun datar/ruang: {"tipe":"bangun","keterangan":"...","titik":[{"id":"A","x":0,"y":0,"label":"A"}],"sisi":[{"dari":"A","ke":"B","label":"5 cm"}],"isi":[["A","B","C","D"]]}  (koordinat 0..100, y naik ke atas)
     - Garis/grafik: {"tipe":"garis","keterangan":"...","titik":[{"x":0,"y":0,"label":"O"}]}
     - Termometer/skala: {"tipe":"termometer","satuan":"°C","data":[{"nama":"Kota A","nilai":32}]}
  7. ujiPemahaman: ekstrak SEMUA soal pemantapan yang benar-benar ada di halaman (biasanya bagian "SOAL PEMANTAPAN"), tulis ulang rapi. Tipe yang diizinkan:
     - pg:    {"tipe":"pg","level":"mudah|sedang|sulit","soal":"...","pilihan":["..."],"benar":INDEX_ANGKA,"pembahasan":"..."}
     - multi: {"tipe":"multi","level":"...","soal":"...","pilihan":["..."],"benar":[INDEX,...],"pembahasan":"..."}
     - bs:    {"tipe":"bs","level":"...","soal":"...","pernyataan":["..."],"benar":[true,false,...],"pembahasan":"..."}
     Soal bergambar wajib memakai {"gambar":{"src":"{{GAMBAR_n}}","alt":"...","caption":"..."}} dari daftar yang diberikan.
  8. KUNCI JAWABAN: ambil dari kunci/pembahasan TERCETAK. Jika kunci cetak bertentangan dengan matematika yang benar, pakai yang BENAR secara matematika dan tulis di awal pembahasan: "CATATAN: kunci cetak menulis X, namun secara matematika ...". JANGAN pernah mengarang kunci.
  9. "pembahasan" WAJIB ada untuk setiap soal, berisi langkah penyelesaian dengan LaTeX.
  10. Tabel/diagram penting tanpa placeholder gambar -> bangun sebagai "visual" sedapat mungkin; kalau tidak bisa, jelaskan dengan kata-kata di blok "p".
  11. Balas HANYA satu object JSON valid, tanpa code fence, tanpa teks pembuka/penutup.`;
  
  // ------------------------------------------------------------
  // Panggil satu model (format chat OpenAI-compatible + gambar data URI)
  // ------------------------------------------------------------
  async function panggilModel(provider, model, systemPrompt, teksUser, dataUrls) {
    const url = `${provider.base}/chat/completions`;
    const content = [
      ...dataUrls.map((du) => ({ type: 'image_url', image_url: { url: du } })),
      { type: 'text', text: teksUser },
    ];
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.key()}`,
        ...(provider.nama === 'openrouter'
          ? { 'HTTP-Referer': 'https://bimbel-gemilang-app.vercel.app', 'X-Title': 'Gemilang Buku Digital' }
          : {}),
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 8192,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content },
        ],
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`${provider.nama}/${model} HTTP_${response.status}: ${errText.slice(0, 250)}`);
    }
    const data = await response.json();
    return data?.choices?.[0]?.message?.content || '';
  }
  
  // Ekstrak object JSON pertama yang seimbang (tahan fence/sisa teks)
  function extractJson(text) {
    if (!text) return null;
    let t = String(text).trim();
    t = t.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const start = t.indexOf('{');
    if (start === -1) return null;
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let i = start; i < t.length; i++) {
      const c = t[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
        continue;
      }
      if (c === '"') inStr = true;
      else if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(t.slice(start, i + 1));
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  }
  
  export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method hanya POST' });
    }
  
    const tersedia = PROVIDERS.filter((p) => !!p.key());
    if (!tersedia.length) {
      return res.status(500).json({
        error: 'Belum ada kunci AI. Isi env Vercel: GROQ_API_KEY atau OPENROUTER_API_KEY (dua-duanya gratis).',
      });
    }
  
    const { images, placeholders, meta } = req.body || {};
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'images wajib berisi minimal 1 halaman (base64).' });
    }
    if (images.length > 14) {
      return res.status(400).json({ error: 'Maksimal 14 halaman per panggilan. Pecah bab menjadi dua bagian di sisi klien.' });
    }
  
    const daftarPlaceholder = Array.isArray(placeholders) && placeholders.length
      ? placeholders.map((p) => `- {{GAMBAR_${p.n}}} = potongan gambar halaman ${p.halaman}${p.ket ? ` (${p.ket})` : ''}`).join('\n')
      : '- (tidak ada potongan gambar tersedia; jangan memakai blok gambar)';
  
    const infoMeta = meta && meta.judul
      ? `Judul bab target: "${meta.judul}"${meta.nomor ? ` (bab nomor ${meta.nomor})` : ''}.`
      : 'Tentukan judul bab dari isi halaman.';
  
    const teksUser = `${infoMeta}
  Halaman dikirim berurutan sebagai gambar.
  GAMBAR TERSEDIA (placeholder yang BOLEH dipakai):
  ${daftarPlaceholder}
  
  Tulis ulang SELURUH isi halaman-halaman ini menjadi satu bab JSON sesuai aturan.`;
  
    const dataUrls = images.map((im) => `data:${im.mime || 'image/jpeg'};base64,${im.data}`);
  
    const kesalahan = [];
    for (const provider of tersedia) {
      for (const model of provider.models()) {
        try {
          const teks = await panggilModel(provider, model, SYSTEM_PROMPT, teksUser, dataUrls);
          const bab = extractJson(teks);
          if (!bab || !Array.isArray(bab.sections) || bab.sections.length === 0) {
            throw new Error('Hasil bukan JSON bab valid (sections kosong).');
          }
          if (!Array.isArray(bab.ujiPemahaman)) bab.ujiPemahaman = [];
          return res.status(200).json({ success: true, bab, provider: provider.nama, model });
        } catch (e) {
          kesalahan.push(`${provider.nama}/${model}: ${e.message}`);
          // model/provider mati atau kena limit -> coba berikutnya
        }
      }
    }
  
    return res.status(500).json({
      error: `Semua provider gagal: ${kesalahan.slice(0, 6).join(' | ')}`,
    });
  }