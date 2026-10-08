// src/utils/rakitTryOutTentor.js
// ============================================================
// MESIN RAKIT TRY OUT TENTOR — murni, teruji. (Fase 2)
// ============================================================
// Keputusan owner: tentor boleh membuat try out **tetapi perlu approval**.
// Berkas ini berisi seluruh keputusan logikanya supaya halaman hanya
// urusan klik, dan supaya keputusan itu bisa diuji tanpa browser.
//
// TIGA JANJI YANG DIJAGA
//
// 1. Draf TIDAK PERNAH bocor ke siswa. Statusnya `menunggu_approval` dan
//    daftar siswa memang sudah menyaring `where('status','==','aktif')`.
//    `waktuBuka`/`waktuTutup` sengaja dikosongkan sampai admin memutuskan
//    — jadwal adalah keputusan admin, bukan efek samping usulan tentor.
//
// 2. Bentuk dokumen MENGIKUTI skema `tryout_paket` yang sudah ada
//    (dibaca TryOutView.jsx: daftarSoal, totalSoal, modeTimer,
//    durasiTotalMenit, subtes, antiCheatAktif, wajibKamera, soalAcak,
//    waktuBuka, waktuTutup, judul, targetKelas, targetKategori).
//    Tidak mengarang skema baru — paket yang disetujui admin harus langsung
//    bisa dikerjakan siswa tanpa perubahan apa pun.
//
// 3. Pagar tipe DIPAKAI SUNGGUH di sini. Di keranjang cetak, tipe yang
//    tidak didukung renderer try out (mis. menjodohkan) hanya dibendera
//    karena tetap sah DICETAK. Untuk try out ia harus DITOLAK: siswa
//    mengerjakannya di layar, dan butir yang tak bisa dirender akan tampil
//    rusak di tengah ujian.
// ============================================================

import { tipeDidukung } from './keranjangTryOut.js';
import { identitasDari, teksSoalDari } from './fieldButirSoal.js';
import { benderaButir } from './keranjangSoalGuru.js';
import { STATUS_PAKET, transisiStatus } from './statusTryOutPaket.js';

/** Butir minimum supaya sebuah paket layak disebut try out. */
export const MIN_BUTIR = 5;
/** Batas atas butir — di atas ini hampir pasti kekeliruan pilih semua. */
export const MAKS_BUTIR = 200;
/** Durasi total yang masuk akal (menit). */
export const MIN_MENIT = 5;
export const MAKS_MENIT = 300;
/** Alasan penolakan admin harus berarti, bukan "ok" atau titik. */
export const MIN_PANJANG_ALASAN_TOLAK = 10;

export const GRANULARITAS = {
  MAPEL: 'mapel',
  MATERI: 'materi',
  SATU: 'satu',
};

const LABEL_GRANULARITAS = {
  mapel: 'per mata pelajaran',
  materi: 'per materi/bab',
  satu: 'satu subtes utuh',
};

function namaKelompok(soal, granularitas) {
  if (granularitas === GRANULARITAS.SATU) return 'Paket try out';
  const id = identitasDari(soal);
  if (granularitas === GRANULARITAS.MATERI) {
    return id.materi === '(tanpa materi)' ? id.mapel : `${id.mapel} — ${id.materi}`;
  }
  return id.mapel;
}

/**
 * Kelompokkan butir jadi subtes, mempertahankan urutan pilihan tentor.
 * @returns {Array<{nama:string, soalIds:string[], jumlah:number, indeksMulai:number}>}
 */
export function kelompokkanJadiSubtes(daftarSoal, granularitas = GRANULARITAS.MAPEL) {
  const daftar = Array.isArray(daftarSoal) ? daftarSoal : [];
  const peta = new Map();
  daftar.forEach((soal, i) => {
    const nama = namaKelompok(soal, granularitas);
    if (!peta.has(nama)) peta.set(nama, { nama, soalIds: [], jumlah: 0, indeksMulai: i });
    const grup = peta.get(nama);
    const id = soal?.id ?? soal?.__id ?? null;
    if (id !== null) grup.soalIds.push(String(id));
    grup.jumlah += 1;
  });
  return [...peta.values()];
}

/**
 * Periksa apakah draf layak dikirim ke admin.
 * @returns {{boleh:boolean, alasan:string[], peringatan:string[], ringkasan:object}}
 *   `alasan`      = pembatal (tombol kirim harus mati)
 *   `peringatan`  = tetap boleh dikirim, tapi tentor harus tahu
 */
export function putusanKirimDraf({
  judul = '',
  daftarSoal = [],
  modeTimer = 'total',
  durasiTotalMenit = 60,
  granularitas = GRANULARITAS.MAPEL,
  targetKelas = '',
  targetKategori = '',
  subtes: subtesMasukan = [],
} = {}) {
  const alasan = [];
  const peringatan = [];
  const soal = Array.isArray(daftarSoal) ? daftarSoal : [];

  // --- judul ---
  const j = String(judul || '').trim();
  if (!j) alasan.push('Judul paket wajib diisi — admin dan siswa melihat judul ini.');
  else if (j.length < 5) alasan.push('Judul terlalu pendek untuk dikenali (minimal 5 huruf).');

  // --- jumlah butir ---
  if (soal.length < MIN_BUTIR) {
    alasan.push(`Try out minimal ${MIN_BUTIR} butir (baru ${soal.length}). Untuk latihan pendek, pakai Cetak Latihan.`);
  } else if (soal.length > MAKS_BUTIR) {
    alasan.push(`${soal.length} butir melebihi batas ${MAKS_BUTIR}. Pecah jadi beberapa paket — siswa tidak sanggup dan kuota membengkak.`);
  }

  // --- PAGAR TIPE (keras di sini, bukan bendera) ---
  const tipeDitolak = new Map();
  soal.forEach((s) => {
    if (!tipeDidukung(s)) {
      const t = String(s?.tipe || 'pg_sederhana');
      tipeDitolak.set(t, (tipeDitolak.get(t) || 0) + 1);
    }
  });
  if (tipeDitolak.size) {
    const rincian = [...tipeDitolak.entries()].map(([t, n]) => `${t} (${n} butir)`).join(', ');
    alasan.push(`Tipe ini tidak bisa dirender renderer try out sehingga siswa akan melihat butir rusak di tengah ujian: ${rincian}. Keluarkan dari paket — butir ini tetap bisa DICETAK lewat Cetak Latihan.`);
  }

  // --- durasi ---
  const durasi = Number(durasiTotalMenit) || 0;
  if (modeTimer === 'total') {
    if (durasi < MIN_MENIT) alasan.push(`Durasi total minimal ${MIN_MENIT} menit (diisi ${durasi}).`);
    else if (durasi > MAKS_MENIT) alasan.push(`Durasi total maksimal ${MAKS_MENIT} menit (diisi ${durasi}).`);
  } else if (modeTimer === 'per-subtes') {
    // 🔥 Tidak memakai `arguments` di dalam fungsi ber-parameter
    // destructuring: rapuh dan sulit dibaca. Subtes diterima eksplisit.
    const subtesPerSubtes = Array.isArray(subtesMasukan) ? subtesMasukan : [];
    if (!subtesPerSubtes.length) {
      alasan.push('Mode per-subtes dipilih tetapi subtesnya belum ada.');
    } else {
      subtesPerSubtes.forEach((st, i) => {
        const d = Number(st?.durasiMenit) || 0;
        if (d < 1) alasan.push(`Subtes ${i + 1} (${st?.nama || 'tanpa nama'}) belum punya durasi.`);
      });
    }
  } else {
    alasan.push(`Mode timer tidak dikenal: "${modeTimer}".`);
  }

  // --- butir tanpa identitas: boleh dikirim, tapi admin perlu tahu ---
  const tanpaIdentitas = soal.filter((s) => {
    const id = identitasDari(s);
    return id.mapel === '(tanpa mapel)' || id.materi === '(tanpa materi)';
  }).length;
  if (tanpaIdentitas) {
    peringatan.push(`${tanpaIdentitas} butir belum punya identitas lengkap — pengelompokan subtesnya bisa meleset.`);
  }

  // --- bendera mutu ---
  const berbendera = soal.filter((s) => benderaButir(s).length > 0).length;
  if (berbendera) {
    peringatan.push(`${berbendera} butir membawa bendera mutu (kunci hasil AI / pembahasan penalaran model / figur menunggu potongan). Admin akan melihatnya juga.`);
  }

  // --- teks soal kosong ---
  const tanpaTeks = soal.filter((s) => !teksSoalDari(s)).length;
  if (tanpaTeks) alasan.push(`${tanpaTeks} butir tidak punya teks soal — tidak boleh masuk ujian.`);

  // --- sasaran paket: lintas jenjang/mapel tanpa target yang dinyatakan ---
  // Bukan pembatal (try out campuran TKA memang lintas mapel), tetapi admin
  // perlu melihatnya jelas sebelum menyetujui, dan tentor perlu sadar bahwa
  // ia sedang mencampur jenjang.
  const semuaIdentitas = soal.map(identitasDari);
  const jenjangUnik = [...new Set(semuaIdentitas.map((i) => i.jenjang))];
  const mapelUnik = [...new Set(semuaIdentitas.map((i) => i.mapel))];
  if (!String(targetKelas || '').trim() && jenjangUnik.length > 1) {
    peringatan.push(`Butir berasal dari ${jenjangUnik.length} jenjang berbeda (${jenjangUnik.join(', ')}) tetapi sasaran kelas belum diisi. Admin akan menanyakannya.`);
  }
  if (!String(targetKategori || '').trim() && mapelUnik.length > 3) {
    peringatan.push(`Paket mencampur ${mapelUnik.length} mata pelajaran tanpa kategori yang dinyatakan.`);
  }

  const subtes = kelompokkanJadiSubtes(soal, granularitas);
  return {
    boleh: alasan.length === 0,
    alasan,
    peringatan,
    ringkasan: {
      jumlahButir: soal.length,
      jumlahSubtes: subtes.length,
      jenjangUnik,
      mapelUnik,
      granularitas: LABEL_GRANULARITAS[granularitas] || granularitas,
      tanpaIdentitas,
      berbendera,
      tanpaTeks,
      modeTimer,
      durasiTotalMenit: durasi,
    },
  };
}

/**
 * Susun dokumen `tryout_paket` untuk draf usulan tentor.
 * Bentuknya mengikuti skema yang sudah dibaca TryOutView.jsx.
 */
export function bangunPayloadDraf({
  judul,
  daftarSoal = [],
  modeTimer = 'total',
  durasiTotalMenit = 60,
  granularitas = GRANULARITAS.MAPEL,
  targetKelas = '',
  targetKategori = '',
  antiCheatAktif = false,
  wajibKamera = false,
  soalAcak = false,
  guru = {},
  catatanUntukAdmin = '',
} = {}) {
  const soal = Array.isArray(daftarSoal) ? daftarSoal : [];
  const subtes = kelompokkanJadiSubtes(soal, granularitas).map((g) => ({
    nama: g.nama,
    soalIds: g.soalIds,
    jumlahSoal: g.jumlah,
    durasiMenit: null, // diisi admin bila mode per-subtes dipakai
  }));

  const identitasSemua = soal.map(identitasDari);
  const mapelUnik = [...new Set(identitasSemua.map((i) => i.mapel))];
  const jenjangUnik = [...new Set(identitasSemua.map((i) => i.jenjang))];

  return {
    judul: String(judul || '').trim(),
    status: STATUS_PAKET.MENUNGGU,
    targetKelas: String(targetKelas || '').trim() || (jenjangUnik.length === 1 && jenjangUnik[0] !== '(tanpa jenjang)' ? jenjangUnik[0] : ''),
    targetKategori: String(targetKategori || '').trim() || (mapelUnik.length === 1 && mapelUnik[0] !== '(tanpa mapel)' ? mapelUnik[0] : ''),
    // Soal disimpan APA ADANYA (skema bank soal asli) — sama seperti
    // keputusan TerbitkanTryOutPage, supaya renderer siswa tidak perlu
    // mengenal dua bentuk.
    daftarSoal: soal,
    totalSoal: soal.length,
    modeTimer: modeTimer === 'per-subtes' ? 'per-subtes' : 'total',
    durasiTotalMenit: modeTimer === 'total' ? (Number(durasiTotalMenit) || 60) : null,
    subtes,
    granularitas,
    antiCheatAktif: !!antiCheatAktif,
    wajibKamera: antiCheatAktif ? !!wajibKamera : false,
    soalAcak: !!soalAcak,
    // 🔒 SENGAJA dikosongkan. Jadwal terbit adalah keputusan admin saat
    // menyetujui — bukan efek samping usulan tentor.
    waktuBuka: null,
    waktuTutup: null,
    dibuatOleh: 'tentor',
    diusulkanOleh: guru?.id || guru?.uid || null,
    diusulkanOlehNama: guru?.nama || '',
    tentorId: guru?.id || guru?.uid || null,
    tentorNama: guru?.nama || '',
    catatanUntukAdmin: String(catatanUntukAdmin || '').trim(),
    riwayatStatus: [{
      status: STATUS_PAKET.MENUNGGU,
      oleh: guru?.nama || 'tentor',
      peran: 'tentor',
      pada: new Date().toISOString(),
      catatan: 'Draf diusulkan untuk persetujuan admin',
    }],
  };
}

/**
 * Keputusan admin menyetujui draf.
 * Mengembalikan payload update (bukan dokumen baru) supaya id dokumen tetap.
 */
export function putusanApprove(draf = {}, { jadwalBuka = null, jadwalTutup = null, oleh = '' } = {}) {
  const alasan = [];
  const status = String(draf?.status ?? '').trim();

  const transisi = transisiStatus(status, STATUS_PAKET.AKTIF, 'admin');
  if (!transisi.boleh) alasan.push(transisi.alasan);
  if (!Array.isArray(draf?.daftarSoal) || draf.daftarSoal.length === 0) {
    alasan.push('Paket ini tidak punya butir soal — tidak ada yang bisa dikerjakan siswa.');
  }
  const tanpaTipe = (draf?.daftarSoal || []).filter((s) => !tipeDidukung(s));
  if (tanpaTipe.length) {
    alasan.push(`${tanpaTipe.length} butir bertipe yang tidak bisa dirender renderer try out. Kembalikan ke tentor untuk diperbaiki.`);
  }

  // Jadwal: boleh kosong (= langsung bisa dikerjakan), tapi bila diisi
  // harus masuk akal dan tidak terbalik.
  const payload = {
    status: STATUS_PAKET.AKTIF,
    disetujuiOleh: oleh || 'admin',
    disetujuiPada: new Date().toISOString(),
    waktuBuka: jadwalBuka ? new Date(jadwalBuka).toISOString() : (draf?.waktuBuka || null),
    waktuTutup: jadwalTutup ? new Date(jadwalTutup).toISOString() : (draf?.waktuTutup || null),
  };
  if (payload.waktuBuka && payload.waktuTutup && new Date(payload.waktuTutup) <= new Date(payload.waktuBuka)) {
    alasan.push('Deadline lebih awal dari waktu buka — siswa tidak akan sempat mengerjakan.');
  }
  if (payload.waktuTutup && new Date(payload.waktuTutup) < new Date()) {
    alasan.push('Deadline sudah lewat. Pilih waktu di masa depan atau kosongkan.');
  }

  payload.riwayatStatus = [
    ...(Array.isArray(draf?.riwayatStatus) ? draf.riwayatStatus : []),
    { status: STATUS_PAKET.AKTIF, oleh: oleh || 'admin', peran: 'admin', pada: payload.disetujuiPada, catatan: 'Disetujui admin' },
  ];

  return { boleh: alasan.length === 0, alasan, payload };
}

/** Keputusan admin menolak draf. Alasan wajib berarti. */
export function putusanTolak(draf = {}, alasanTeks = '', oleh = '') {
  const alasan = [];
  const transisi = transisiStatus(String(draf?.status ?? '').trim(), STATUS_PAKET.DITOLAK, 'admin');
  if (!transisi.boleh) alasan.push(transisi.alasan);

  const teks = String(alasanTeks || '').trim();
  if (teks.length < MIN_PANJANG_ALASAN_TOLAK) {
    alasan.push(`Alasan penolakan minimal ${MIN_PANJANG_ALASAN_TOLAK} huruf. Tentor perlu tahu apa yang harus diperbaiki — penolakan tanpa alasan membuat orang mengulang kesalahan yang sama.`);
  }

  const pada = new Date().toISOString();
  const payload = {
    status: STATUS_PAKET.DITOLAK,
    ditolakAlasan: teks,
    ditolakOleh: oleh || 'admin',
    ditolakPada: pada,
    riwayatStatus: [
      ...(Array.isArray(draf?.riwayatStatus) ? draf.riwayatStatus : []),
      { status: STATUS_PAKET.DITOLAK, oleh: oleh || 'admin', peran: 'admin', pada, catatan: teks },
    ],
  };
  return { boleh: alasan.length === 0, alasan, payload };
}

/** Ringkasan draf untuk daftar antrean admin. */
export function ringkasDraf(paket = {}) {
  const soal = Array.isArray(paket?.daftarSoal) ? paket.daftarSoal : [];
  const identitas = soal.map(identitasDari);
  return {
    judul: String(paket?.judul || '(tanpa judul)'),
    jumlahButir: soal.length,
    jumlahSubtes: Array.isArray(paket?.subtes) ? paket.subtes.length : 0,
    mapel: [...new Set(identitas.map((i) => i.mapel))],
    jenjang: [...new Set(identitas.map((i) => i.jenjang))],
    berbendera: soal.filter((s) => benderaButir(s).length > 0).length,
    tanpaIdentitas: identitas.filter((i) => i.mapel === '(tanpa mapel)' || i.materi === '(tanpa materi)').length,
    catatan: String(paket?.catatanUntukAdmin || ''),
    diusulkanOleh: String(paket?.diusulkanOlehNama || paket?.tentorNama || '(tidak diketahui)'),
    status: paket?.status || '',
  };
}

export default {
  MIN_BUTIR, MAKS_BUTIR, MIN_MENIT, MAKS_MENIT, MIN_PANJANG_ALASAN_TOLAK,
  GRANULARITAS, kelompokkanJadiSubtes, putusanKirimDraf, bangunPayloadDraf,
  putusanApprove, putusanTolak, ringkasDraf,
};
