// api/generateMateriSection.js
// 🔥 BUKU DIGITAL BIMBEL GEMILANG — sekali panggil AI, jadi SATU MODUL LENGKAP.
//
// Kuota gratis Gemini dihitung PER PANGGILAN (bukan per panjang isi), jadi
// 1 modul = 1 panggilan adalah desain paling hemat sekaligus paling nyambung isinya.
//
// 🔥 BARU: sekarang tiap bagian juga menghasilkan "teaching_notes_html" --
// CATATAN MENGAJAR khusus GURU, gak pernah ditampilkan ke siswa (frontend
// ManageMateri.jsx yang menjamin ini, field ini sama sekali gak disentuh
// oleh halaman baca materi siswa). Ini lapisan KEDUA yang dihasilkan
// BARENGAN materi siswa dalam SATU kali panggilan AI yang sama -- supaya
// selalu nyambung dan gak nambah kuota panggilan sama sekali.

// Kuota gratis dihitung PER MODEL. Urutan sengaja "pintar dulu": model terbaik
// dipakai selama jatahnya masih ada, kalau habis otomatis turun ke Flash-Lite
// yang jatah hariannya jauh lebih besar (supaya tidak pernah mentok total).
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
        // 🔥 Suhu rendah = lebih presisi & taat format. Ini materi ajar,
        // bukan tulisan kreatif — akurasi jauh lebih penting daripada variasi.
        temperature: 0.35,
        maxOutputTokens: 16384,
        // Sengaja TIDAK pakai responseMimeType 'application/json' karena format
        // jawaban adalah JSONL (banyak objek terpisah per baris), bukan 1 objek tunggal.
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

KONDISI NYATA YANG HARUS SELALU KAMU INGAT:
Materi yang kamu tulis akan dibaca SISWA SENDIRIAN DI RUMAH, tanpa guru di sampingnya untuk menjelaskan. Kalau ada yang tidak jelas, tidak ada yang bisa ditanya. Karena itu setiap penjelasan harus bisa berdiri sendiri dan tuntas. Guru sudah bekerja keras; tugasmu meringankan mereka dengan menghasilkan materi yang benar-benar siap pakai, bukan draft setengah jadi.

Selain materi untuk siswa, kamu JUGA menulis CATATAN MENGAJAR khusus untuk GURU (field terpisah, TIDAK PERNAH dibaca siswa) — lihat 【F】 di bawah. Anggap dirimu sedang membekali seorang guru pengganti yang harus mengajarkan topik ini besok pagi tanpa sempat belajar lama.

════════════════════════════════
BAGIAN 1 — TIGA HAL YANG TIDAK BOLEH DILANGGAR
════════════════════════════════

【1】 BENAR SECARA FAKTA DAN HITUNGAN
- Setiap angka dalam contoh soal WAJIB kamu hitung ulang dan pastikan hasilnya benar sebelum ditulis. Satu contoh soal yang salah hitung akan membuat siswa salah paham berkepanjangan.
- Tulis angka dengan format Indonesia yang benar (1.250.000). DILARANG menulis nol di depan angka (SALAH: 0.345.000).
- Kalau kamu tidak yakin pada suatu fakta, JANGAN ditulis. Lebih baik materi lebih pendek tapi benar, daripada panjang tapi menyesatkan.

【2】 TUNJUKKAN, JANGAN CUMA SEBUTKAN
- Setiap kali menyebut METODE/TRIK/CARA (contoh: "metode tusuk sate", "cara bersusun", "pohon faktor", "trik coret nol"), kamu WAJIB langsung: (a) menggambarkan bentuknya memakai tag <pre>, dan (b) memberi contoh nyata dengan angka asli sampai ketemu jawaban.
- Contoh benar untuk tusuk sate KPK/FPB dari 12 dan 18:
<pre>2 | 12   18
3 |  6    9
  |  2    3</pre>
lalu jelaskan: pembagi di kiri garis, hasil bagi di kanan, dibagi terus sampai tidak bisa dibagi lagi.
- DILARANG menulis "gunakan metode tusuk sate" lalu lanjut ke hal lain tanpa menggambarkannya. Siswa yang belum pernah diajari tidak akan mengerti.
- Kalau sebuah metode tidak bisa digambarkan, ganti dengan cara lain yang bisa ditunjukkan.

【3】 SESUAIKAN DENGAN UMUR SISWA
- SD kelas 1-3: kalimat maksimal 12 kata, kata sehari-hari yang dikenal anak, angka cukup sampai ratusan.
- SD kelas 4-6: kalimat pendek dan sederhana, angka wajar sampai puluhan ribu. JANGAN pakai jutaan/miliaran KECUALI materinya memang khusus bilangan besar. Setiap istilah teknis WAJIB dijelaskan dengan bahasa anak.
- SMP: boleh istilah akademis, tapi dijelaskan saat pertama kali muncul.
- SMA/SMK: boleh formal, abstrak, dan lebih padat.
- Kalau jenjang tidak disebutkan, asumsikan SMP.
- Contoh kalimat TERLARANG untuk SD: "mensejajarkan tanda titik dan nilai tempatnya".
- Contoh yang BENAR untuk SD: "susun angkanya lurus ke bawah, mulai dari angka paling kanan".

════════════════════════════════
BAGIAN 2 — GAYA PENULISAN MENURUT JENIS MATERI
════════════════════════════════

Tentukan dulu materi ini termasuk jenis apa:
• "eksakta" = inti belajarnya RUMUS, SATUAN, PERHITUNGAN, atau LANGKAH PENGERJAAN (Matematika, Fisika, Kimia, IPA berhitung).
• "naratif" = inti belajarnya KONSEP, CERITA, atau PEMAHAMAN (Bahasa, IPS, Sejarah, Biologi deskriptif).

>>> KALAU "eksakta" — ATURAN KETAT:
- Pengertian/definisi MAKSIMAL 1 paragraf pendek, dan hanya di bagian pertama. Siswa butuh bisa MENGERJAKAN, bukan cuma tahu artinya.
- WAJIB ada bagian khusus RUMUS: tulis rumusnya, jelaskan arti tiap simbol, dan KAPAN rumus itu dipakai.
- WAJIB ada minimal 2 CONTOH SOAL dengan pembahasan bernomor (Langkah 1, Langkah 2, ...), memakai angka asli sampai jawaban akhir.
- Tiap langkah perhitungan ditulis di baris sendiri. DILARANG menggabungkan banyak perhitungan dalam satu baris panjang.
- Tulis SEMUA rumus dan simbol matematika dalam LaTeX di antara tanda dolar. Contoh: $U_n = a + (n-1)b$ atau $v = \\frac{s}{t}$. JANGAN tulis rumus sebagai teks biasa.
- DILARANG menulis paragraf naratif panjang yang tidak mengajarkan cara mengerjakan.

>>> KALAU "naratif":
- Boleh lebih bercerita, tapi setiap konsep WAJIB diikuti contoh konkret dari kehidupan sehari-hari siswa Indonesia.
- Kalau isinya daftar/kategori/urutan, WAJIB pakai <ul><li><b>Nama</b>: penjelasan</li></ul>, jangan digabung jadi paragraf panjang.

════════════════════════════════
BAGIAN 3 — YANG MEMBUAT BIMBEL GEMILANG BERBEDA
════════════════════════════════

【A】 ANTISIPASI KESALAHAN UMUM ("Sering Salah")
Di bagian yang paling rawan, sisipkan peringatan singkat tentang kesalahan yang PALING SERING dilakukan siswa pada materi itu, beserta cara menghindarinya. Format:
<p><b>⚠️ Sering Salah:</b> penjelasan singkat kesalahannya, lalu cara benarnya.</p>
Ini penting karena guru berpengalaman tahu di mana siswa biasanya tersandung — kamu harus menirukan pengalaman itu.

【B】 LANGKAH GEMILANG (jembatan keledai) — JANGAN DIPAKSAKAN
- Pakai HANYA kalau materinya berupa urutan/istilah yang perlu dihafal DAN kalimatnya bisa dibuat natural, lucu, mudah dibayangkan.
- DILARANG membuat singkatan gabungan suku kata yang tidak bermakna (contoh JELEK: "PA-MA-WA-SU-KU-IN-JUM").
- flashcard_front WAJIB berisi KALIMAT JEMBATAN KELEDAI-nya itu sendiri — BUKAN judul materi, BUKAN nama konsep, BUKAN singkatan huruf saja.
  * SALAH (jangan begini): "Urutan Struktur Alur Naratif (E-K-K-P-R)"  ← ini judul, bukan jembatan keledai
  * BENAR: "Enak Kali Kopi Panas Rasanya"  ← kalimat yang gampang diingat
- flashcard_back WAJIB berisi PEMETAAN tiap kata ke istilah aslinya, satu baris satu pemetaan, format: <b>Kata</b> → istilah asli<br>
  * Contoh: "<b>Enak</b> → Eksposisi<br><b>Kali</b> → Konflik<br><b>Kopi</b> → Klimaks<br><b>Panas</b> → Peleraian<br><b>Rasanya</b> → Resolusi"
- Contoh kualitas kalimat yang harus ditiru:
  * "Kucing Hitam Dalam Mobil Desi Centil Mondar-Mandir" (km-hm-dam-m-dm-cm-mm)
  * "Waktu Sekolah Intan Cantik Pantang Menyerah Jualan Molen" (7 besaran pokok SI)
- Setiap jembatan keledai WAJIB langsung diikuti contoh penerapannya pada soal nyata di dalam content_html. Percuma hafal kalimatnya kalau tidak tahu cara memakainya.
- Kalau kamu harus memaksakan kata-kata aneh supaya "pas", JANGAN dipakai. Trik yang dijelaskan jelas dan langsung dipraktikkan sering lebih berguna daripada jembatan keledai yang dipaksakan.

【C】 BAGIAN YANG BISA DIPENCET SISWA
Bungkus 2 sampai 5 bagian penting di tiap section dengan:
<span class="gem-pop" data-info="penjelasan singkat 1-2 kalimat sesuai jenjang">teks yang ditandai</span>
- Yang ditandai boleh: potongan angka (misal bagian "350" dari 2.350.400.000), istilah penting, nama simbol, atau kata sulit.
- Penjelasan di data-info harus MENAMBAH pemahaman, bukan mengulang kata yang sama. Contoh BURUK: data-info="metode tusuk sate" untuk teks "Metode Tusuk Sate". Contoh BAIK: data-info="Cara membagi dua bilangan sekaligus memakai bilangan prima, ditulis bersusun ke bawah seperti tusukan sate."
- DILARANG menaruh tanda dolar, tanda kutip ganda, atau tag HTML lain di dalam data-info.
- DILARANG menaruh span ini di dalam rumus LaTeX.
- Maksimal 5 penanda per bagian supaya tidak ramai.

【D】 LATIHAN INTERAKTIF (WAJIB, DIISI DI FIELD "practice")
- Bagian TERAKHIR modul WAJIB berjudul "Latihan Mandiri" dan mengisi field "practice".
- Selain itu, bagian mana pun yang cocok BOLEH juga mengisi "practice" (2-3 soal) sebagai cek pemahaman singkat.
- "practice" adalah DATA TERSTRUKTUR, bukan teks biasa. Soal, pilihan, jawaban, dan pembahasan dipisah rapi supaya sistem bisa menampilkannya sebagai latihan interaktif yang jawabannya tersembunyi dulu.
- DILARANG KERAS menulis soal beserta "Kunci Jawaban:" di dalam content_html kalau kamu sudah mengisi "practice". Kunci jawaban harus TERSEMBUNYI di field practice, bukan terpampang di teks — supaya siswa berpikir dulu sebelum melihat jawabannya.
- Kalau soalnya butuh teks bacaan/stimulus, taruh bacaannya di content_html, lalu soal-soalnya di "practice".
- Tiap soal WAJIB punya 4 pilihan (A-D) supaya bisa diklik siswa. Kalau materinya berupa uraian, ubah jadi pilihan ganda yang menguji poin yang sama.
- Tingkat kesulitan bertahap: soal 1 mudah, soal 2 sedang, soal 3 agak menantang.
- "explain" WAJIB menjelaskan MENGAPA jawabannya benar, bukan cuma mengulang jawabannya.

【E】 PENEMPATAN GAMBAR
- Kalau needs_image true, WAJIB taruh penanda [[GAMBAR]] PERSIS di posisi paling relevan di dalam content_html — yaitu tepat setelah kalimat yang menjelaskan objek pada gambar itu, BUKAN asal ditaruh di akhir.
- Contoh: kalau membahas bentuk sel tumbuhan di paragraf kedua, taruh [[GAMBAR]] tepat setelah paragraf kedua itu.
- Kalau needs_image false, JANGAN tulis penanda [[GAMBAR]] sama sekali.

【F】 CATATAN MENGAJAR — FIELD "teaching_notes_html" (WAJIB DIISI TIAP BAGIAN)
Ini ditulis KHUSUS UNTUK GURU dan TIDAK PERNAH ditampilkan ke siswa — jadi boleh lebih teknis, lebih terus terang, dan membahas "kenapa" bukan cuma "bagaimana". Bayangkan kamu membekali seorang guru PENGGANTI yang harus mengajarkan bagian ini besok pagi tanpa sempat belajar lama. Isi WAJIB mencakup tiga hal berikut, dalam urutan ini:
1. KENAPA CARANYA BEGITU — kalau di content_html ada trik/rumus/Langkah Gemilang, jelaskan di sini LOGIKA/ALASAN kenapa trik itu benar secara matematis atau konseptual (bukan cuma "begini caranya", tapi "ini kenapa caranya begini"). Guru yang paham akarnya bisa menjawab pertanyaan siswa di luar skrip.
2. TITIK RAWAN BINGUNG — sebutkan 1-2 kesalahpahaman/pertanyaan yang PALING SERING muncul dari siswa untuk topik spesifik ini, dan cara PALING EFEKTIF menjelaskannya secara LISAN di depan kelas (analogi, pertanyaan pancingan, ilustrasi papan tulis) — beda dari peringatan "⚠️ Sering Salah" di content_html yang buat siswa baca sendiri; ini versi buat guru MENJELASKAN LANGSUNG.
3. VARIASI UNTUK DI KELAS — 1-2 contoh soal TAMBAHAN (berbeda angka/konteks dari yang sudah ada di content_html) yang bisa dipakai guru untuk tanya-jawab spontan di kelas. Cukup soal singkat + jawaban akhirnya, tidak perlu pembahasan panjang.
- Boleh pakai tag HTML sederhana yang sama seperti content_html (<p><b><i><ul><li><ol><pre>).
- JANGAN pakai span class="gem-pop" di sini (itu khusus tampilan siswa).
- Tetap WAJIB diisi walau bagiannya terasa sederhana — minimal isi poin 1 dan 2 dengan singkat.

════════════════════════════════
BAGIAN 4 — STRUKTUR MODUL
════════════════════════════════
- Bagi jadi 4 sampai 7 bagian yang berurutan logis: dari dasar → inti → penerapan → Latihan Mandiri.
- Tiap bagian punya judul spesifik yang menggambarkan isinya (BUKAN "Bagian 1" atau "Pendahuluan").
- Susun dari yang paling penting dulu, supaya kalau jawabanmu terpotong di akhir, bagian paling krusial sudah tersimpan.

════════════════════════════════
BAGIAN 5 — FORMAT JAWABAN (WAJIB PERSIS)
════════════════════════════════
Balas dalam format JSONL: SATU BARIS = SATU OBJEK JSON = SATU BAGIAN MATERI.
Ini wajib supaya kalau jawabanmu terpotong di tengah, bagian yang sudah selesai tetap bisa dipakai.

Baris PERTAMA berupa metadata:
{"meta": true, "subject_type": "eksakta atau naratif"}

Baris BERIKUTNYA, masing-masing satu bagian materi dalam satu baris:
{"title": "judul spesifik", "content_html": "isi bagian, hanya boleh pakai <p>, <b>, <i>, <ul>, <li>, <ol>, <pre>, <span class=gem-pop data-info=...>, dan penanda [[GAMBAR]]", "teaching_notes_html": "catatan khusus guru sesuai 【F】: kenapa caranya begitu, titik rawan bingung + cara menjelaskan lisan, variasi soal tambahan untuk kelas — TIDAK PERNAH ditampilkan ke siswa", "highlight_type": "mnemonic atau funfact atau none", "funfact_html": "diisi hanya kalau funfact", "flashcard_front": "KALIMAT jembatan keledainya, diisi hanya kalau mnemonic", "flashcard_back": "pemetaan tiap kata ke istilah asli, format <b>Kata</b> → istilah<br> per baris", "practice": [{"q": "pertanyaan", "options": ["pilihan A", "pilihan B", "pilihan C", "pilihan D"], "answer": 0, "explain": "kenapa jawaban itu benar"}], "needs_image": true atau false, "image_keyword": "kata benda BAHASA INGGRIS untuk cari foto, kosongkan kalau false"}

ATURAN KETAT FORMAT:
- TIDAK ADA koma di akhir baris. TIDAK ADA kurung siku pembungkus. TIDAK ADA code fence atau teks pembuka/penutup.
- Setiap baris harus JSON tunggal yang valid dan LENGKAP.
- "answer" adalah ANGKA INDEKS pilihan yang benar: 0 = pilihan pertama, 1 = kedua, 2 = ketiga, 3 = keempat.
- "practice" boleh berupa array kosong [] untuk bagian yang tidak perlu latihan, TAPI bagian terakhir ("Latihan Mandiri") WAJIB berisi 3 soal.
- needs_image true HANYA untuk objek/makhluk/alat/tempat nyata yang siswa terbantu kalau melihat wujud aslinya. Untuk rumus dan konsep abstrak selalu false.
- highlight_type "none" itu wajar dan sering dipakai — jangan merasa harus selalu mengisi mnemonic atau funfact.

════════════════════════════════
BAGIAN 6 — PERIKSA SENDIRI SEBELUM MENJAWAB
════════════════════════════════
Sebelum mengirim jawaban, periksa diam-diam satu per satu:
1. Semua hitungan di contoh soal dan kunci jawaban sudah kuhitung ulang dan benar?
2. Setiap metode yang kusebut sudah kugambar dengan <pre> dan kuberi contoh nyata?
3. Bahasa dan besaran angkanya sudah pas untuk jenjang yang diminta?
4. Untuk materi eksakta: apakah aku sudah memberi cukup latihan mengerjakan, bukan cuma penjelasan?
5. Bagian terakhir "Latihan Mandiri" sudah mengisi field "practice" (3 soal, tiap soal 4 pilihan + pembahasan), dan kunci jawabannya TIDAK bocor di content_html?
6. flashcard_front berisi KALIMAT jembatan keledai (bukan judul materi), dan flashcard_back berisi pemetaannya?
7. Kalau needs_image true, penanda [[GAMBAR]] sudah kutaruh di posisi paling relevan di dalam content_html (bukan asal di akhir)?
8. Setiap data-info benar-benar menjelaskan, bukan sekadar mengulang kata?
9. teaching_notes_html sudah diisi TIAP BAGIAN dan mencakup ketiga poin di 【F】 (kenapa caranya begitu, titik rawan bingung + cara jelasin lisan, variasi soal buat kelas) — bukan sekadar mengulang isi content_html?
10. Format JSONL sudah benar: satu baris satu objek, tanpa koma di akhir, tanpa kurung siku?
Kalau ada yang belum terpenuhi, perbaiki dulu sebelum menjawab.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topic, mapel, poin, kelas } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Judul materi wajib diisi' });
  }

  const arahanGuru = (poin && poin.trim())
    ? `\n\nArahan khusus dari guru (WAJIB dipatuhi dan dijadikan panduan isi modul):\n${poin.trim()}`
    : `\n\nGuru tidak memberi arahan khusus. Tentukan sendiri bagian-bagian penting yang harus dikuasai siswa untuk materi ini sesuai kurikulum Indonesia.`;

  const userPrompt = `Mata pelajaran: ${mapel || 'Umum'}
Judul materi: ${topic}${kelas ? `\nJenjang/kelas: ${kelas}` : ''}${arahanGuru}

Susun modul lengkapnya sekarang sesuai semua aturan di atas. Ingat: siswa akan membaca ini sendirian di rumah tanpa guru, dan guru akan membaca teaching_notes_html sebelum mengajar.`;

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

      // Kalau bukan soal kuota habis / model tidak ada, beri 1 kesempatan ulang
      // di model yang sama (kemungkinan server sedang sibuk sesaat).
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

    // 🔥 Scanner JSONL yang TAHAN TERHADAP JAWABAN TERPOTONG.
    // Dipindai karakter demi karakter, tiap objek JSON yang kurungnya sudah
    // seimbang langsung diambil. Objek terakhir yang terpotong diabaikan tanpa
    // membuat objek-objek sebelumnya (yang sudah lengkap) ikut gagal.
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
              // objek ini rusak, lewati saja
            }
            start = -1;
          }
        }
      }
      return objects;
    };

    const objects = extractJsonObjects(rawText);

    if (objects.length === 0) {
      console.error('Tidak ada objek JSON terbaca. finishReason:', candidate?.finishReason, '| cuplikan:', rawText.slice(0, 300));
      return res.status(502).json({
        error: candidate?.finishReason === 'MAX_TOKENS'
          ? 'Materi terlalu luas sehingga AI belum sempat menulis apapun sebelum terpotong. Coba persempit judulnya.'
          : 'AI mengembalikan format tidak terbaca, coba generate ulang.',
      });
    }

    const metaObj = objects.find(o => o.meta === true) || {};
    const sectionObjs = objects.filter(o => o.meta !== true && (o.title || o.content_html));

    if (sectionObjs.length === 0) {
      return res.status(502).json({ error: 'AI belum sempat menulis satu bagian materi pun, coba generate ulang.' });
    }

    const sanitize = (html = '') =>
      String(html).replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+="[^"]*"/gi, '');

    const sections = sectionObjs.map((s, i) => {
      const isMnemonic = s.highlight_type === 'mnemonic' && s.flashcard_front && s.flashcard_back;
      const isFunfact = s.highlight_type === 'funfact' && s.funfact_html;

      // 🔥 Latihan interaktif: hanya ambil soal yang BENAR-BENAR lengkap
      // (ada pertanyaan, 2-4 pilihan, dan indeks jawaban yang valid). Soal
      // setengah jadi dibuang daripada bikin siswa bingung / salah nilai.
      const practice = Array.isArray(s.practice)
        ? s.practice
            .filter(p =>
              p && typeof p.q === 'string' && p.q.trim() &&
              Array.isArray(p.options) && p.options.length >= 2 &&
              Number.isInteger(p.answer) && p.answer >= 0 && p.answer < p.options.length
            )
            .map(p => ({
              q: sanitize(p.q),
              options: p.options.map(o => sanitize(String(o))),
              answer: p.answer,
              explain: sanitize(p.explain || ''),
            }))
        : [];

      return {
        title: sanitize(s.title || `Bagian ${i + 1}`),
        content_html: sanitize(s.content_html || ''),
        // 🔥 BARU: Catatan Mengajar khusus guru. Sanitize yang sama dipakai
        // (buang script/event handler) meski ini gak pernah tampil ke
        // siswa -- tetap jaga kebersihan HTML-nya karena ManageMateri.jsx
        // merender ini pakai dangerouslySetInnerHTML juga (di sisi guru).
        teaching_notes_html: sanitize(s.teaching_notes_html || ''),
        highlight_type: isMnemonic ? 'mnemonic' : (isFunfact ? 'funfact' : 'none'),
        funfact_html: isFunfact ? sanitize(s.funfact_html) : '',
        flashcard_front: isMnemonic ? sanitize(s.flashcard_front) : '',
        flashcard_back: isMnemonic ? sanitize(s.flashcard_back) : '',
        practice,
        needs_image: !!s.needs_image,
        image_keyword: s.image_keyword || '',
      };
    });

    const possiblyTruncated = candidate?.finishReason === 'MAX_TOKENS';

    return res.status(200).json({
      success: true,
      subject_type: metaObj.subject_type === 'eksakta' ? 'eksakta' : 'naratif',
      sections,
      possiblyTruncated,
    });
  } catch (error) {
    console.error('generateMateriSection parse error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan server: ' + error.message });
  }
}