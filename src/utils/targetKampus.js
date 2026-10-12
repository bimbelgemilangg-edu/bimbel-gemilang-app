// src/utils/targetKampus.js
// ============================================================
// Target kampus siswa kelas 12: formasi Pilihan 1 & 2, versi, dan riwayat.
// Logika murni — tidak menyentuh Firestore.
//
// 🔥 KENAPA ADA VERSI & RIWAYAT
// Blueprint §1: "Data target harus dapat diperbarui jika rencana siswa
// berubah. Sistem harus menyimpan riwayat perubahan agar target lama tidak
// tercampur dengan target baru."
//
// Ini bukan formalitas. Kalau target disimpan sebagai satu dokumen yang
// ditimpa terus, maka grafik perkembangan siswa jadi tidak bisa dibaca:
// "selisih skor terhadap target" berubah karena dua sebab yang berbeda —
// skornya yang naik, atau targetnya yang diganti. Tanpa riwayat, keduanya
// tidak bisa dibedakan, dan tentor akan menyimpulkan hal yang salah.
//
// Bentuk penyimpanannya (dokumen aktif + koleksi riwayat) dijelaskan di
// docs/RANCANGAN-DATABASE-PTN.md §4.4.
//
// ⚠️ ISTILAH
// Field di kode memakai `skorAcuan`, bukan `passingGrade`. Alasannya di
// kepala utils/zonaKesiapan.js: panitia SNPMB tidak mengumumkan nilai
// minimum kelulusan per prodi, dan blueprint §3C melarang label itu.
// Yang boleh dipakai UI: "skor acuan (estimasi)" + status datanya.
// ============================================================

import { bandingkanSkor, nilaiFormasi, angkaSah, ZONA } from './zonaKesiapan.js';

export const PILIHAN = { UTAMA: 1, CADANGAN: 2 };
export const MAKS_PILIHAN = 2;

/**
 * Validasi satu entri pilihan. Ditolak bila tidak cukup informasi untuk
 * dibandingkan — lebih baik menolak di awal daripada menampilkan kartu
 * perbandingan yang isinya "undefined".
 */
export function validasiPilihan(p, urutan) {
  const masalah = [];
  if (!p || typeof p !== 'object') {
    return [`Pilihan ${urutan}: entri kosong`];
  }
  if (!p.idPtn) masalah.push(`Pilihan ${urutan}: idPtn kosong`);
  if (!p.idProdi) masalah.push(`Pilihan ${urutan}: idProdi kosong`);
  if (p.urutan !== undefined && Number(p.urutan) !== urutan) {
    masalah.push(`Pilihan ${urutan}: field urutan berisi ${p.urutan}`);
  }
  return masalah;
}

/**
 * Bentuk dokumen target yang siap disimpan.
 *
 * @param {object} o
 * @param {string} o.studentId
 * @param {number} o.tahunSeleksi
 * @param {Array} o.pilihan maksimal 2 entri { urutan, idPtn, idProdi, labelPribadi }
 * @param {number|null} o.targetSkorPribadi boleh kosong — sebagian siswa belum
 *   berani memasang angka, dan memaksa mereka mengarang angka justru merusak data
 * @param {number} [o.versi] dinaikkan otomatis oleh buatVersiBaru()
 * @param {string} [o.alasanPerubahan]
 * @param {string} [o.diubahOleh]
 */
export function bentukTarget({
  studentId, tahunSeleksi, pilihan = [], targetSkorPribadi = null,
  versi = 1, alasanPerubahan = '', diubahOleh = '',
}) {
  const daftar = Array.isArray(pilihan) ? pilihan : [];

  // 🔥 TIDAK ada pembulatan yang membuang data di sini. Versi pertama fungsi
  // ini memakai `.slice(0, MAKS_PILIHAN)` dan menormalkan targetSkorPribadi
  // yang bukan angka jadi null. Keduanya MENELAN masukan secara diam-diam:
  // admin mengisi 3 pilihan atau salah ketik "7OO", yang tersimpan 2 pilihan
  // dan target kosong, tanpa satu pun pesan. Menyerahkan penolakan ke
  // validasiTarget() lebih jujur -- bentukTarget hanya menata bentuk.
  const skor = (targetSkorPribadi === null || targetSkorPribadi === undefined || targetSkorPribadi === '')
    ? null
    : (Number.isFinite(Number(targetSkorPribadi)) ? Number(targetSkorPribadi) : targetSkorPribadi);

  return {
    studentId: String(studentId || ''),
    tahunSeleksi: Number(tahunSeleksi) || null,
    pilihan: daftar.map((p, i) => ({
      urutan: i + 1,
      idPtn: String(p?.idPtn || ''),
      idProdi: String(p?.idProdi || ''),
      // labelPribadi adalah sebutan dari SISWA ("impian", "cadangan dekat
      // rumah"), bukan penilaian sistem. Sengaja teks bebas.
      labelPribadi: String(p?.labelPribadi || ''),
    })),
    targetSkorPribadi: skor,
    versi: Number(versi) || 1,
    alasanPerubahan: String(alasanPerubahan || ''),
    diubahOleh: String(diubahOleh || ''),
  };
}

/**
 * Validasi target sebelum disimpan.
 * @returns {{sah: boolean, masalah: string[]}}
 */
export function validasiTarget(target) {
  const masalah = [];
  if (!target || typeof target !== 'object') return { sah: false, masalah: ['target kosong'] };
  if (!target.studentId) masalah.push('studentId kosong');
  if (!target.tahunSeleksi) masalah.push('tahunSeleksi kosong — tanpa ini data tahun lama dan baru tercampur');
  if (!Array.isArray(target.pilihan) || target.pilihan.length === 0) {
    masalah.push('belum ada pilihan prodi');
  }
  if (target.pilihan?.length > MAKS_PILIHAN) {
    masalah.push(`maksimal ${MAKS_PILIHAN} pilihan (SNBT hanya mengizinkan 2), dapat ${target.pilihan.length}`);
  }
  (target.pilihan || []).forEach((p, i) => masalah.push(...validasiPilihan(p, i + 1)));

  // Dua pilihan yang menunjuk prodi yang sama membuat perbandingan tidak
  // berarti, dan hampir pasti salah pilih di UI.
  const kunci = (target.pilihan || []).map((p) => `${p?.idPtn}|${p?.idProdi}`);
  if (kunci.length === 2 && kunci[0] === kunci[1]) {
    masalah.push('Pilihan 1 dan Pilihan 2 menunjuk program studi yang sama');
  }
  if (target.targetSkorPribadi !== null && target.targetSkorPribadi !== undefined) {
    const t = Number(target.targetSkorPribadi);
    if (!Number.isFinite(t)) {
      masalah.push(`targetSkorPribadi "${target.targetSkorPribadi}" bukan angka`);
    } else if (t < 0 || t > 1000) {
      masalah.push(`targetSkorPribadi ${t} di luar rentang wajar skor UTBK (0-1000)`);
    }
  }
  return { sah: masalah.length === 0, masalah };
}

/**
 * Buat versi baru dari target yang sudah ada, plus entri riwayat.
 *
 * @param {object|null} targetLama
 * @param {object} perubahan field yang mau diganti
 * @param {object} meta { diubahOleh, alasanPerubahan }
 * @returns {{target: object, riwayat: object, ditolak: {alasan: string}|null}}
 *
 * 🔥 `alasanPerubahan` WAJIB. Blueprint menuntut riwayat yang bisa diaudit;
 * riwayat tanpa alasan hanya menyimpan angka lama tanpa menjelaskan kenapa
 * berpindah, dan itu tidak banyak gunanya saat konsultasi.
 */
export function buatVersiBaru(targetLama, perubahan = {}, meta = {}) {
  const alasan = String(meta.alasanPerubahan || '').trim();
  if (!alasan) {
    return {
      target: targetLama || null,
      riwayat: null,
      ditolak: { alasan: 'alasanPerubahan wajib diisi agar riwayat target bisa diaudit' },
    };
  }
  const basis = targetLama || {};
  const target = bentukTarget({ ...basis, ...perubahan, versi: (Number(basis.versi) || 0) + 1, alasanPerubahan: alasan, diubahOleh: meta.diubahOleh || '' });
  const cek = validasiTarget(target);
  if (!cek.sah) {
    return { target: targetLama || null, riwayat: null, ditolak: { alasan: cek.masalah.join('; ') } };
  }
  return {
    target,
    // Snapshot versi LAMA disimpan, bukan yang baru — kalau yang baru disimpan,
    // riwayat dan dokumen aktif berisi hal yang sama dan versi sebelumnya hilang.
    riwayat: targetLama ? {
      studentId: targetLama.studentId,
      versi: Number(targetLama.versi) || 1,
      snapshot: JSON.parse(JSON.stringify(targetLama)),
      alasanPerubahan: alasan,
      diubahOleh: meta.diubahOleh || '',
    } : null,
    ditolak: null,
  };
}

/**
 * Susun hasil perbandingan untuk ditampilkan.
 *
 * @param {object} target hasil bentukTarget()
 * @param {Map|object} dataProdi peta kunci `${idPtn}|${idProdi}` -> dokumen prodi
 *   (bentuk dokumen: lihat IMPOR-PTN-2026.json / docs/RANCANGAN-DATABASE-PTN.md §4.2)
 * @param {number|null} skorSiswa skor try out internal terbaru
 * @returns {object} siap dikonsumsi UI; tidak ada field yang perlu dihitung ulang di komponen
 */
export function susunPerbandingan(target, dataProdi = {}, skorSiswa = null) {
  const peta = dataProdi instanceof Map ? dataProdi : new Map(Object.entries(dataProdi || {}));
  const ambil = (p) => peta.get(`${p?.idPtn}|${p?.idProdi}`) || null;

  const baris = (target?.pilihan || []).map((p) => {
    const prodi = ambil(p);
    if (!prodi) {
      // Prodi tidak ada di database. Ini kejadian NYATA, bukan tepi kasus:
      // hanya 266 prodi dari 32 PTN yang terdata (§2.4 dokumen audit).
      // UI harus mengatakan "belum terdata", bukan menampilkan kartu kosong.
      return {
        urutan: p.urutan, idPtn: p.idPtn, idProdi: p.idProdi,
        labelPribadi: p.labelPribadi,
        tersedia: false,
        alasan: 'Program studi ini belum ada di database Gemilang. Database saat ini memuat 266 prodi dari 32 PTN, terdalam untuk Jawa Timur & UNEJ.',
      };
    }
    const banding = bandingkanSkor(skorSiswa, prodi.skorReferensi);
    return {
      urutan: p.urutan,
      idPtn: p.idPtn,
      idProdi: p.idProdi,
      labelPribadi: p.labelPribadi,
      tersedia: true,
      namaPtn: prodi.namaPtn || null,
      namaProdi: prodi.namaProdi || null,
      jenjang: prodi.jenjang || null,
      bidang: prodi.bidang || null,
      kampus: prodi.kampus || null,
      dayaTampung: prodi.dayaTampung || null,
      peminat: prodi.peminat || null,
      keketatan: prodi.keketatan ?? null,
      skorReferensi: prodi.skorReferensi || null,
      syaratKhusus: prodi.syaratKhusus || null,
      subtesKunci: prodi.subtesKunci || null,
      statusData: prodi.statusData || null,
      jalurSeleksi: prodi.jalurSeleksi || 'snbt',
      ...banding,
    };
  });

  const [p1, p2] = baris;
  const formasi = p1 && p2 && p1.tersedia && p2.tersedia
    ? nilaiFormasi(p1, p2)
    : { aman: false, label: 'Belum bisa dinilai', catatan: ['Perbandingan formasi butuh dua pilihan yang keduanya terdata.'] };

  return {
    studentId: target?.studentId || null,
    tahunSeleksi: target?.tahunSeleksi || null,
    versi: target?.versi || null,
    targetSkorPribadi: target?.targetSkorPribadi ?? null,
    // angkaSah(), bukan Number.isFinite(Number(x)): Number('') === 0 akan
    // membuat siswa tanpa skor tercatat sebagai berskor nol.
    skorSiswa: angkaSah(skorSiswa) ? Number(skorSiswa) : null,
    pilihan: baris,
    formasi,
    // Dijaga eksplisit di satu tempat supaya tidak ada halaman yang lupa.
    adaZonaTanpaData: baris.some((b) => b.tersedia && b.zona?.id === ZONA.TANPA_DATA),
  };
}

export default {
  PILIHAN, MAKS_PILIHAN, validasiPilihan, bentukTarget, validasiTarget,
  buatVersiBaru, susunPerbandingan,
};
