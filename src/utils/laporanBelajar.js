// ============================================================
// src/utils/laporanBelajar.js
// ============================================================
// LAPORAN BELAJAR — pengisian capaian oleh GURU (keputusan owner 31 Okt 2026).
//
// KONTEKS & NIAT OWNER
// --------------------
// Rapor otomatis (utils/raportOtomatis.js) jujur tapi sering menyisakan banyak
// nilai kosong karena tidak semua guru menerbitkan kuis/try out. Owner memutuskan:
// untuk laporan akhir bulan, ISI UTAMA laporan orang tua adalah CAPAIAN yang
// diisi guru (objektif, berbasis pengamatan kelas), sementara keaktifan otomatis
// dari sistem Gemilang (skor kuis harian, try out, absensi, latihan) tetap
// dihitung dan ditampilkan sebagai BAHAN PENDUKUNG.
//
// Aturan keras yang dijaga modul ini (semua keputusan owner):
//   1. TIDAK PERNAH mencetak keterangan "tidak valid / belum cukup / belum
//      lengkap". Ketiadaan asesmen disampaikan netral-ke-depan. Satu-satunya
//      pengecualian: siswa MEMANG tidak mengerjakan/melewati (fakta dari log),
//      yang disebut apa adanya ("tidak mengikuti …") tanpa nada menghukum.
//   2. Siswa yang tampil ke guru HANYA yang terdaftar pada mapel yang dipegang
//      guru itu (enrolledSubjects ∩ kodeMapel guru) DAN masih aktif.
//   3. Capaian guru = sumber primer PDF; bahan otomatis = penguat.
//   4. Ada DRAFT bila belum selesai / sinyal putus; tugas dianggap selesai
//      bila SEMUA siswa mapel guru sudah diisi.
//
// Modul ini MURNI (tanpa Firestore) supaya bisa diuji — pola sama dengan
// raportOtomatis.js & sakelarFitur.js.
// ============================================================

// ------------------------------------------------------------
// SKALA PREDIKAT CAPAIAN (Kurikulum Merdeka: A/B/C/D, kalimat positif)
// Riset 31 Okt 2026: rentang & predikat mengikuti Panduan Penilaian
// Kemendikbud (90-100 Sangat Baik, 80-89 Baik, 70-79 Cukup, <70 Perlu
// Bimbingan) — "Perlu Bimbingan" dilunakkan jadi "Perlu Pendampingan"
// agar ramah orang tua (bukan vonis).
// ------------------------------------------------------------

export const PREDIKAT_CAPAIAN = [
  { huruf: 'A', label: 'Sangat Baik', warna: '#16a34a', min: 90 },
  { huruf: 'B', label: 'Baik', warna: '#2563eb', min: 80 },
  { huruf: 'C', label: 'Cukup', warna: '#b45309', min: 70 },
  { huruf: 'D', label: 'Perlu Pendampingan', warna: '#9333ea', min: 0 },
];

/** Urutan predikat dari tertinggi — dipakai membandingkan/mengurut. */
export const URUTAN_PREDIKAT = ['A', 'B', 'C', 'D'];

/** Huruf predikat → label manusiawi ('A' → 'Sangat Baik'). */
export function predikatLabel(huruf) {
  const p = PREDIKAT_CAPAIAN.find((x) => x.huruf === String(huruf || '').trim().toUpperCase());
  return p ? p.label : '';
}

/** Huruf predikat → warna (untuk chip/badge di UI & PDF). */
export function predikatWarna(huruf) {
  const p = PREDIKAT_CAPAIAN.find((x) => x.huruf === String(huruf || '').trim().toUpperCase());
  return p ? p.warna : '#94a3b8';
}

/** Angka 0-100 → huruf predikat (dipakai bila guru mengisi angka). */
export function predikatDariAngka(n) {
  if (!Number.isFinite(n)) return '';
  const p = PREDIKAT_CAPAIAN.find((x) => n >= x.min);
  return p ? p.huruf : 'D';
}

// ------------------------------------------------------------
// DIMENSI CAPAIAN + DESKRIPTOR
// Riset 31 Okt 2026 (keaktifan siswa: keberanian bertanya, menjawab,
// menyanggah/berargumentasi, terlibat diskusi — ejournal.unesa/avatara,
// Kriteria Penilaian Keaktifan). Owner memberi contoh eksplisit:
// "aktif bertanya", "aktif menyanggah".
// Nada deskriptor: 'positif' (kekuatan) | 'dorongan' (area bertumbuh,
// tetap kalimat membangun — TIDAK PERNAH 'tidak valid').
// ------------------------------------------------------------

export const DIMENSI_LAPORAN = [
  {
    key: 'pemahaman',
    label: 'Pemahaman Materi',
    ikon: 'Brain',
    pertanyaan: 'Sejauh apa siswa menguasai konsep materi periode ini?',
    deskriptor: [
      { id: 'menguasai', teks: 'menguasai konsep inti dengan baik', nada: 'positif' },
      { id: 'menjelaskan-ulang', teks: 'mampu menjelaskan ulang materi dengan bahasanya sendiri', nada: 'positif' },
      { id: 'menerapkan', teks: 'mampu menerapkan konsep pada soal beragam', nada: 'positif' },
      { id: 'berkembang', teks: 'pemahaman terus berkembang dari pertemuan ke pertemuan', nada: 'positif' },
      { id: 'perlu-pengulangan', teks: 'memerlukan pengulangan pada beberapa topik', nada: 'dorongan' },
    ],
  },
  {
    key: 'keaktifan',
    label: 'Keaktifan & Partisipasi',
    ikon: 'Hand',
    pertanyaan: 'Seberapa aktif siswa bertanya, menjawab, dan terlibat di kelas?',
    deskriptor: [
      { id: 'aktif-bertanya', teks: 'aktif bertanya saat materi belum jelas', nada: 'positif' },
      { id: 'aktif-menjawab', teks: 'aktif menjawab dan menanggapi pertanyaan', nada: 'positif' },
      { id: 'menyanggah', teks: 'berani menyanggah dan berargumentasi dengan santun', nada: 'positif' },
      { id: 'diskusi', teks: 'terlibat aktif dalam diskusi dan kerja kelompok', nada: 'positif' },
      { id: 'perlu-dorongan-aktif', teks: 'perlu dorongan untuk lebih aktif berpartisipasi', nada: 'dorongan' },
    ],
  },
  {
    key: 'sikap',
    label: 'Sikap & Kedisiplinan',
    ikon: 'ShieldCheck',
    pertanyaan: 'Bagaimana sikap, kedisiplinan, dan tanggung jawab siswa?',
    deskriptor: [
      { id: 'disiplin', teks: 'disiplin hadir dan mengumpulkan tugas tepat waktu', nada: 'positif' },
      { id: 'santun', teks: 'santun dan menghormati tentor maupun teman', nada: 'positif' },
      { id: 'fokus', teks: 'fokus dan serius selama pembelajaran', nada: 'positif' },
      { id: 'tanggung-jawab', teks: 'bertanggung jawab atas tugas dan kewajibannya', nada: 'positif' },
      { id: 'perlu-binaan', teks: 'perlu binaan dalam kedisiplinan kehadiran dan tugas', nada: 'dorongan' },
    ],
  },
  {
    key: 'perkembangan',
    label: 'Perkembangan Belajar',
    ikon: 'TrendingUp',
    pertanyaan: 'Bagaimana arah perkembangan siswa dibanding periode sebelumnya?',
    deskriptor: [
      { id: 'menanjak', teks: 'menunjukkan kemajuan nyata dibanding periode sebelumnya', nada: 'positif' },
      { id: 'konsisten', teks: 'konsisten menjaga ritme dan kualitas belajar', nada: 'positif' },
      { id: 'stabil', teks: 'stabil dan pertahankan capaian baiknya', nada: 'positif' },
      { id: 'perlu-ritme', teks: 'perlu pendampingan untuk menjaga ritme belajar', nada: 'dorongan' },
    ],
  },
];

export const DIMENSI_KEYS_LAPORAN = DIMENSI_LAPORAN.map((d) => d.key);

/** Definisi satu dimensi (untuk UI). null bila key tak dikenal. */
export function dimensiLaporan(key) {
  return DIMENSI_LAPORAN.find((d) => d.key === key) || null;
}

/** Daftar deskriptor sebuah dimensi. [] bila key tak dikenal. */
export function deskriptorUntuk(key) {
  return (dimensiLaporan(key) || {}).deskriptor || [];
}

/** Teks deskriptor dari id (untuk satu dimensi). '' bila tak dikenal. */
export function teksDeskriptor(key, id) {
  const d = deskriptorUntuk(key).find((x) => x.id === id);
  return d ? d.teks : '';
}

// ------------------------------------------------------------
// BENTUK CAPAIAN KOSONG & VALIDASI
// ------------------------------------------------------------

/** Capaian kosong (semua dimensi belum dinilai) — dipakai sebagai nilai awal. */
export function capaianKosong() {
  return Object.fromEntries(DIMENSI_KEYS_LAPORAN.map((k) => [k, { predikat: '', deskriptor: [] }]));
}

/** Apakah satu dimensi sudah dinilai guru (punya predikat sah)? */
export function dimensiTerisi(capaian, key) {
  const p = String((capaian || {})[key]?.predikat || '').trim().toUpperCase();
  return URUTAN_PREDIKAT.includes(p);
}

/** Jumlah dimensi yang sudah dinilai. */
export function jumlahDimensiTerisi(capaian) {
  return DIMENSI_KEYS_LAPORAN.filter((k) => dimensiTerisi(capaian, k)).length;
}

// ------------------------------------------------------------
// STATUS PENGISIAN (kosong | draft | selesai)
// 'selesai' bila SEMUA dimensi punya predikat. Draft bila sebagian terisi
// atau ada catatan/pengayaan tapi dimensi belum lengkap. Ini yang menentukan
// tugas guru hilang dari dashboard (semua siswa 'selesai').
// ------------------------------------------------------------

/** Status pengisian SATU siswa dari dokumen laporannya. */
export function statusPengisianSiswa(dokLaporan) {
  if (!dokLaporan) return 'kosong';
  const capaian = dokLaporan.capaian || {};
  const terisi = jumlahDimensiTerisi(capaian);
  const adaTeks = Boolean(String(dokLaporan.catatanGuru || '').trim()
    || String(dokLaporan.pengayaan || '').trim()
    || DIMENSI_KEYS_LAPORAN.some((k) => (capaian[k]?.deskriptor || []).length));
  if (terisi === DIMENSI_KEYS_LAPORAN.length) return 'selesai';
  if (terisi > 0 || adaTeks) return 'draft';
  return 'kosong';
}

/** Ringkas progres pengisian satu guru. semuaSelesai → tugas hilang. */
export function progresPengisian(daftarSiswa = [], petaLaporan = {}) {
  const total = daftarSiswa.length;
  let selesai = 0;
  let draft = 0;
  let belum = 0;
  for (const s of daftarSiswa) {
    const st = statusPengisianSiswa(petaLaporan[s.id || s.studentId]);
    if (st === 'selesai') selesai += 1;
    else if (st === 'draft') draft += 1;
    else belum += 1;
  }
  return {
    total,
    selesai,
    draft,
    belum,
    persenSelesai: total ? Math.round((selesai / total) * 100) : 0,
    // Tugas hilang hanya bila ADA siswa dan semuanya selesai.
    semuaSelesai: total > 0 && selesai === total,
  };
}

// ------------------------------------------------------------
// MAPEL GURU & FILTER SISWA
// Guru bisa pegang >1 mapel: field lama `mapel`/`kodeMapel` = string
// digabung koma; field baru `mapelDetails` = array {id,namaMapel,kodeMapel}.
// Siswa cocok bila enrolledSubjects memuat salah satu kodeMapel guru, atau
// memuat 'semua' (pola sama dengan ManageQuiz/ManageMateri).
// ------------------------------------------------------------

const norm = (s) => String(s ?? '').toLowerCase().trim();

/** Daftar mapel yang dipegang guru: [{kodeMapel, namaMapel}] (unik, ternormalkan). */
export function mapelDiampuGuru(guru = {}) {
  const out = [];
  const push = (kode, nama) => {
    const k = String(kode || '').trim();
    if (!k) return;
    if (out.some((x) => norm(x.kodeMapel) === norm(k))) return;
    out.push({ kodeMapel: k, namaMapel: String(nama || '').trim() });
  };
  // mapelDetails (array) — sumber paling kaya
  if (Array.isArray(guru.mapelDetails)) {
    for (const m of guru.mapelDetails) push(m?.kodeMapel, m?.namaMapel);
  }
  // field lama: kodeMapel & mapel = string digabung koma, posisi berpasangan
  const kodeList = String(guru.kodeMapel || '').split(',').map((x) => x.trim()).filter(Boolean);
  const namaList = String(guru.mapel || '').split(',').map((x) => x.trim()).filter(Boolean);
  kodeList.forEach((kode, i) => push(kode, namaList[i] || ''));
  return out;
}

/** Himpunan kodeMapel guru (ternormalkan) untuk pencocokan cepat. */
export function setKodeMapelGuru(guru = {}) {
  return new Set(mapelDiampuGuru(guru).map((m) => norm(m.kodeMapel)));
}

/** Nama mapel dari kode (untuk label), fallback ke kode itu sendiri. */
export function namaMapelGuru(guru, kodeMapel) {
  const m = mapelDiampuGuru(guru).find((x) => norm(x.kodeMapel) === norm(kodeMapel));
  return m?.namaMapel || String(kodeMapel || '');
}

/** Apakah siswa terdaftar pada salah satu mapel guru? ('semua' = lolos). */
export function siswaTerdaftarMapelGuru(siswa = {}, guru = {}) {
  const enrolled = Array.isArray(siswa.enrolledSubjects) ? siswa.enrolledSubjects.map(norm) : [];
  if (enrolled.includes('semua')) return true;
  const kodeGuru = setKodeMapelGuru(guru);
  if (!kodeGuru.size) return false; // guru tanpa mapel jelas → jangan bocorkan semua siswa
  return enrolled.some((c) => kodeGuru.has(c));
}

/** Siswa AKTIF untuk laporan (bukan diblokir / masa aktif habis / nonaktif).
 * Memakai kriteria yang sama dengan mesin rapor (alasanSiswaNonaktif) supaya
 * konsisten: siswa nonaktif TIDAK pernah muncul. */
export function siswaAktif(siswa = {}, sekarangMs = Date.now()) {
  if (siswa.isBlocked === true || siswa.isBlocked === 'true') return false;
  const st = String(siswa.status ?? '').trim().toLowerCase();
  if (st && st !== 'aktif' && st !== 'active') return false;
  const selesai = tanggalKeMs(siswa.tanggalSelesai);
  if (selesai !== null && selesai + 86400000 <= sekarangMs) return false;
  return true;
}

/** util tanggal → ms (dukung 'YYYY-MM-DD', Date, {toDate}, number). */
function tanggalKeMs(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (v instanceof Date) return Number.isFinite(v.getTime()) ? v.getTime() : null;
  if (typeof v?.toDate === 'function') {
    const d = v.toDate();
    return Number.isFinite(d?.getTime?.()) ? d.getTime() : null;
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v));
  if (m) return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const t = Date.parse(String(v));
  return Number.isFinite(t) ? t : null;
}

/** Daftar siswa untuk diisi guru ini: terdaftar di mapelnya DAN aktif.
 * Inilah jawaban owner: "siswa yang muncul = yang didaftarkan sesuai mapel
 * yang dipegang guru itu" — tidak ada siswa kosong/nyasar. */
export function filterSiswaUntukGuru(daftarSiswa = [], guru = {}, { sekarangMs = Date.now(), hanyaAktif = true } = {}) {
  return daftarSiswa
    .filter((s) => s && (s.id || s.studentId))
    .filter((s) => siswaTerdaftarMapelGuru(s, guru))
    .filter((s) => (hanyaAktif ? siswaAktif(s, sekarangMs) : true))
    .sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || ''), 'id'));
}

// ------------------------------------------------------------
// BAHAN OTOMATIS (sistem Gemilang) — pendukung, bukan penentu
// Diambil dari hasil mesin rapor (utils/raportOtomatis) per siswa, diringkas
// jadi kalimat faktual. TIDAK PERNAH memakai kata 'tidak valid/belum cukup'.
// Ketidakhadiran asesmen disebut netral; siswa yang benar-benar melewatkan
// disebut apa adanya ('tidak mengikuti …').
// ------------------------------------------------------------

/** Ringkas bahan otomatis satu siswa dari hasil mesin rapor.
 * @param {object} hasil satu entri hasil hitungRaportSiswa (akademik/proses)
 * @returns {{ringkasan:string[], kuisAda:boolean, tryoutAda:boolean}} */
export function ringkasBahanOtomatis(hasil = {}) {
  const out = [];
  const proses = hasil.proses || {};
  const det = proses.detail_proses || proses || {};
  const kh = det.kehadiran || {};
  if (kh && Number.isFinite(kh.persenHadir)) {
    out.push(`kehadiran ${kh.persenHadir}% (${kh.hadir ?? 0}/${kh.total ?? 0} sesi)`);
  }
  const lat = det.latihan || {};
  if (lat && lat.hariAktif > 0) {
    out.push(`latihan mandiri ${lat.hariAktif} hari · ${lat.soalDikerjakan ?? 0} soal`);
  }
  // Akademik per mapel: kuis/try out yang benar-benar dikerjakan
  const perMapel = (hasil.akademik && hasil.akademik.perMapel) || [];
  let kuisAda = false;
  let tryoutAda = false;
  for (const m of perMapel) {
    const kom = m.detail_komponen || m.komponen || {};
    const kuis = kom.kuis || {};
    const ujian = kom.ujian || {};
    if (Number.isFinite(kuis.total) && kuis.jumlah > 0) {
      kuisAda = true;
      out.push(`kuis ${m.mapel || m.nama}: rata-rata ${kuis.total} (${kuis.jumlah}×)`);
    }
    if (Number.isFinite(ujian.total) && ujian.jumlah > 0) {
      tryoutAda = true;
      out.push(`try out/ujian ${m.mapel || m.nama}: ${ujian.total} (${ujian.jumlah}×)`);
    }
  }
  const ig = det.integritas || {};
  if (ig && ig.jumlahPelanggaran > 0) {
    out.push(`${ig.jumlahPelanggaran} catatan pengawasan (pembinaan, bukan pengurang nilai)`);
  }
  return { ringkasan: out, kuisAda, tryoutAda };
}

/** Kalimat netral untuk asesmen yang benar-benar dilewati siswa.
 * Hanya dipakai bila log MENUNJUKKAN siswa tidak mengerjakan — bukan untuk
 * menyembunyikan nilai kosong. Menghindari kata 'tidak valid'. */
export function keteranganTidakIkut(jenis = 'asesmen') {
  const peta = {
    kuis: 'tidak mengikuti kuis pada periode ini',
    tryout: 'tidak mengikuti try out pada periode ini',
    ujian: 'tidak mengikuti ujian pada periode ini',
    tugas: 'tidak mengumpulkan tugas pada periode ini',
    asesmen: 'tidak mengikuti asesmen pada periode ini',
  };
  return peta[String(jenis).toLowerCase()] || peta.asesmen;
}

// ------------------------------------------------------------
// NARASI CAPAIAN (untuk PDF & layar) — kalimat positif, selalu lengkap
// ------------------------------------------------------------

/** Susun deskripsi satu dimensi dari predikat + deskriptor terpilih.
 * Selalu kalimat positif/membangun — tidak pernah 'tidak valid'. */
export function kalimatDimensi(key, nilaiDimensi = {}) {
  const def = dimensiLaporan(key);
  if (!def) return '';
  const huruf = String(nilaiDimensi.predikat || '').trim().toUpperCase();
  const label = predikatLabel(huruf);
  const ids = Array.isArray(nilaiDimensi.deskriptor) ? nilaiDimensi.deskriptor : [];
  const frasa = ids.map((id) => teksDeskriptor(key, id)).filter(Boolean);
  if (!label && !frasa.length) return '';
  if (!label) return `${def.label}: ${frasa.join(', ')}.`;
  if (!frasa.length) return `${def.label}: ${label}.`;
  return `${def.label}: ${label} — ${frasa.join(', ')}.`;
}

/** Narasi capaian utuh untuk SATU siswa (semua dimensi + catatan + pengayaan).
 * Inilah ISI UTAMA laporan orang tua (keputusan owner). bahanOtomatis opsional
 * dirangkai jadi satu kalimat pendukung.
 * @returns {string} paragraf siap cetak; '' bila belum ada isian sama sekali. */
export function narasiCapaianSiswa(dokLaporan = {}, { bahanOtomatis = null } = {}) {
  if (!dokLaporan || typeof dokLaporan !== 'object') return '';
  const capaian = dokLaporan.capaian || {};
  const kalimat = DIMENSI_KEYS_LAPORAN
    .map((k) => kalimatDimensi(k, capaian[k] || {}))
    .filter(Boolean);
  const bagian = [];
  if (kalimat.length) bagian.push(kalimat.join(' '));

  const catatan = String(dokLaporan.catatanGuru || '').trim();
  if (catatan) bagian.push(`Catatan tentor: ${catatan}`);

  // Bahan otomatis sistem Gemilang (pendukung)
  if (bahanOtomatis && Array.isArray(bahanOtomatis.ringkasan) && bahanOtomatis.ringkasan.length) {
    bagian.push(`Bahan otomatis sistem Gemilang: ${bahanOtomatis.ringkasan.join('; ')}.`);
  }

  const pengayaan = String(dokLaporan.pengayaan || '').trim();
  if (pengayaan) bagian.push(`Rencana pengayaan periode depan: ${pengayaan}.`);

  return bagian.join(' ');
}

/** Apakah sebuah dokumen laporan punya isi apa pun (untuk deteksi draft)? */
export function adaIsi(dokLaporan) {
  if (!dokLaporan) return false;
  return statusPengisianSiswa(dokLaporan) !== 'kosong';
}

// ------------------------------------------------------------
// BENTUK DOKUMEN (satu sumber kebenaran bentuk, pola sakelarFitur.bentukKonfigurasiFitur)
// ------------------------------------------------------------

/** Kunci dokumen deterministik → idempoten (aman disimpan ulang). */
export function kunciDokLaporan(periode, studentId, kodeMapel) {
  const san = (s) => String(s || '').replace(/[\\/]/g, '_').slice(0, 80);
  return `${san(periode)}__${san(studentId)}__${san(kodeMapel)}`;
}

/** Bangun dokumen laporan belajar siap simpan ke Firestore. */
export function bentukDokumenLaporan({
  periode, periodeLabel = '', studentId, studentName = '', studentKelas = '', jenjang = '',
  kodeMapel, namaMapel = '', teacherId = '', teacherName = '',
  capaian = null, catatanGuru = '', pengayaan = '', bahanOtomatis = null,
}) {
  const cap = { ...capaianKosong(), ...(capaian || {}) };
  // Normalisasi tiap dimensi: predikat huruf besar sah, deskriptor array string.
  for (const k of DIMENSI_KEYS_LAPORAN) {
    const d = cap[k] || {};
    const huruf = String(d.predikat || '').trim().toUpperCase();
    cap[k] = {
      predikat: URUTAN_PREDIKAT.includes(huruf) ? huruf : '',
      deskriptor: Array.isArray(d.deskriptor) ? d.deskriptor.map((x) => String(x)).filter(Boolean) : [],
    };
  }
  const dok = {
    periode: String(periode || ''),
    periodeLabel: String(periodeLabel || ''),
    studentId: String(studentId || ''),
    studentName: String(studentName || ''),
    studentKelas: String(studentKelas || ''),
    jenjang: String(jenjang || ''),
    kodeMapel: String(kodeMapel || ''),
    namaMapel: String(namaMapel || ''),
    teacherId: String(teacherId || ''),
    teacherName: String(teacherName || ''),
    capaian: cap,
    catatanGuru: String(catatanGuru || ''),
    pengayaan: String(pengayaan || ''),
    bahanOtomatis: bahanOtomatis || null,
  };
  dok.status = statusPengisianSiswa(dok);
  return dok;
}

// ------------------------------------------------------------
// SAKELAR PERIODE PENGISIAN (dibuka admin lewat settings/global_config)
// Bentuk field `laporanBelajar` di dokumen settings:
//   { dibuka:true, periode:'2026-08..2026-10', periodeLabel:'Agustus–Oktober 2026',
//     dibukaOleh:'owner', dibukaAt:<ts>, catatan:'...' }
// Default MENOLAK: tidak ada config / dibuka bukan true → tugas tidak muncul.
// ------------------------------------------------------------

export const FIELD_LAPORAN_BELAJAR = 'laporanBelajar';

/** Keputusan murni: apakah pengisian laporan sedang dibuka admin? */
export function pengisianDibuka(cfg) {
  if (!cfg || typeof cfg !== 'object') return { dibuka: false, alasan: 'periode pengisian belum dibuka admin' };
  if (cfg.dibuka !== true) return { dibuka: false, alasan: 'periode pengisian sedang ditutup admin' };
  if (!String(cfg.periode || '').trim()) return { dibuka: false, alasan: 'periode pengisian belum diatur' };
  return { dibuka: true, alasan: `periode ${cfg.periodeLabel || cfg.periode} sedang dibuka`, periode: cfg.periode, periodeLabel: cfg.periodeLabel || '' };
}

/** Tombol sakelar mana yang tampil di kartu admin: 'buka' atau 'tutup'.
 *  Murni & null-safe: dokumen settings mungkin belum ada (cfg null) saat
 *  halaman pertama kali render — jangan pernah dereferensi cfg di sini. */
export function tombolSakelarLaporan(cfg, periodeKey) {
  const putus = pengisianDibuka(cfg);
  if (!putus.dibuka) return 'buka';
  return String(cfg.periode || '') === String(periodeKey || '') ? 'tutup' : 'buka';
}

/** Bentuk patch sakelar untuk disimpan admin (bentuk di satu tempat). */
export function bentukSakelarLaporan({ dibuka = false, periode = '', periodeLabel = '', dibukaOleh = '', catatan = '' }) {
  return {
    dibuka: dibuka === true,
    periode: String(periode || ''),
    periodeLabel: String(periodeLabel || ''),
    dibukaOleh: String(dibukaOleh || ''),
    catatan: String(catatan || ''),
  };
}

export default {
  PREDIKAT_CAPAIAN, URUTAN_PREDIKAT, DIMENSI_LAPORAN, DIMENSI_KEYS_LAPORAN,
  predikatLabel, predikatWarna, predikatDariAngka,
  dimensiLaporan, deskriptorUntuk, teksDeskriptor,
  capaianKosong, dimensiTerisi, jumlahDimensiTerisi,
  statusPengisianSiswa, progresPengisian,
  mapelDiampuGuru, setKodeMapelGuru, namaMapelGuru,
  siswaTerdaftarMapelGuru, siswaAktif, filterSiswaUntukGuru,
  ringkasBahanOtomatis, keteranganTidakIkut,
  kalimatDimensi, narasiCapaianSiswa, adaIsi,
  kunciDokLaporan, bentukDokumenLaporan,
  FIELD_LAPORAN_BELAJAR, pengisianDibuka, tombolSakelarLaporan, bentukSakelarLaporan,
};
