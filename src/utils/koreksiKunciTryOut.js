// src/utils/koreksiKunciTryOut.js
// ============================================================
// LOGIKA KOREKSI KUNCI JAWABAN OLEH TENTOR & ENGINE HITUNG ULANG SKOR
//
// Alur:
// 1. Soal dari impor buku/bank/AI pihak ketiga bisa memiliki kunci keliru.
// 2. Tentor yang terhubung ke paket try out dapat memvalidasi & mengoreksi
//    kunci jawaban per butir soal (atau menandai anulir/bonus jika soal cacat).
// 3. Sistem secara OTOMATIS:
//    - Memperbarui `daftarSoal` pada dokumen `tryout_paket/:paketId`.
//    - Menghitung ulang seluruh sesi siswa yang sudah selesai (`status === 'selesai'`).
//    - Menghitung ulang akurasi (totalSkorPersen), skor total, dan XP siswa (termasuk potongan kecurangan).
//    - Menyesuaikan saldo XP siswa di `siswa_progress/:studentId` (hanya selisihnya, agar aman).
//    - Mencatat audit log untuk transparansi & keadilan.
// ============================================================

import { hitungTotalSkor, pilihSoalDinilai, pilihBarisBenarSalah } from './skorSoalTryOut.js';
import { terapkanPotonganXP } from './potonganXPTryOut.js';
import { tambahXpMingguan } from './mingguIni.js';
import { cariIndexBenar, kunciBarisBenarSalah } from './skoringSoalKompleks.js';
import { teksKunciSoal } from './teksKunciSoal.js';

/**
 * Normalisasi input kunci baru berdasarkan tipe soal.
 */
export function normalisasiKunciBaru(soal, inputKunci) {
  const tipe = soal?.tipe || 'pg_sederhana';

  if (tipe === 'pg_sederhana') {
    if (typeof inputKunci === 'number') {
      return String.fromCharCode(65 + Math.max(0, inputKunci));
    }
    const str = String(inputKunci ?? '').trim().toUpperCase();
    if (/^[A-Z]$/.test(str)) return str;
    return str || 'A';
  }

  if (tipe === 'pg_kompleks') {
    if (Array.isArray(inputKunci)) {
      return [...new Set(inputKunci.map((h) => String(h).trim().toUpperCase()).filter(Boolean))].sort();
    }
    if (typeof inputKunci === 'string') {
      const arr = inputKunci.replace(/[\s,]+/g, '').split('').map((h) => h.toUpperCase());
      return [...new Set(arr.filter(Boolean))].sort();
    }
    return [];
  }

  if (tipe === 'benar_salah' || tipe === 'pg_kategori') {
    if (Array.isArray(inputKunci)) {
      return inputKunci.map((val) => String(val ?? '').trim().toLowerCase());
    }
    return [];
  }

  // isian_singkat / numerik
  return String(inputKunci ?? '').trim();
}

/**
 * Terapkan koreksi pada satu butir soal di dalam array daftarSoal secara immutable.
 */
export function terapkanKoreksiPadaDaftarSoal(daftarSoal = [], soalIndex, {
  kunciBaru,
  anulirBonus = false,
  catatan = '',
  infoTentor = {},
}) {
  if (!Array.isArray(daftarSoal) || soalIndex < 0 || soalIndex >= daftarSoal.length) {
    return daftarSoal;
  }

  const soalLama = daftarSoal[soalIndex];
  const kunciSebelumnya = teksKunciSoal(soalLama);
  const tipe = soalLama?.tipe || 'pg_sederhana';

  const soalBaru = { ...soalLama };

  if (anulirBonus) {
    soalBaru.anulirBonus = true;
  } else {
    soalBaru.anulirBonus = false;
    const normKunci = normalisasiKunciBaru(soalLama, kunciBaru);

    if (tipe === 'pg_sederhana') {
      soalBaru.kunciJawaban = normKunci;
      // Sinkronkan juga jika opsi berbentuk objek yang memiliki flag benar
      if (Array.isArray(soalBaru.opsiJawaban)) {
        const idx = normKunci.charCodeAt(0) - 65;
        soalBaru.opsiJawaban = soalBaru.opsiJawaban.map((opsi, i) => {
          if (typeof opsi === 'object' && opsi !== null) {
            return { ...opsi, benar: i === idx };
          }
          return opsi;
        });
      }
    } else if (tipe === 'pg_kompleks') {
      soalBaru.kunciJawaban = normKunci;
    } else if (tipe === 'benar_salah' || tipe === 'pg_kategori') {
      const barisLama = pilihBarisBenarSalah(soalLama);
      const barisBaru = barisLama.map((b, i) => {
        const status = Array.isArray(normKunci) && normKunci[i] ? normKunci[i] : kunciBarisBenarSalah(b);
        return {
          ...(typeof b === 'object' ? b : { teks: b }),
          kunci: status,
          jawaban: status,
        };
      });
      if (Array.isArray(soalBaru.tabel_benar_salah)) soalBaru.tabel_benar_salah = barisBaru;
      else if (Array.isArray(soalBaru.tabelBenarSalah)) soalBaru.tabelBenarSalah = barisBaru;
      else if (Array.isArray(soalBaru.pernyataan)) soalBaru.pernyataan = barisBaru;
      else soalBaru.tabelBenarSalah = barisBaru;
    } else {
      soalBaru.kunciJawaban = normKunci;
    }
  }

  const kunciSesudahnya = teksKunciSoal(soalBaru);

  // Sematkan jejak audit per butir soal
  soalBaru.dikoreksiTentor = true;
  soalBaru.koreksiTentor = {
    waktu: new Date().toISOString(),
    oleh: infoTentor?.guruNama || 'Tentor Gemilang',
    guruId: infoTentor?.guruId || '',
    kunciSebelumnya,
    kunciBaru: kunciSesudahnya,
    anulirBonus: !!anulirBonus,
    catatan: catatan ? String(catatan).trim() : '',
  };

  const copy = [...daftarSoal];
  copy[soalIndex] = soalBaru;
  return copy;
}

/**
 * Hitung ulang satu sesi pengerjaan siswa terhadap daftar soal terbaru.
 */
export function hitungUlangSatuSesi(sesi, daftarSoalBaru) {
  if (!sesi || sesi.status !== 'selesai') {
    return null;
  }

  const daftarDinilai = pilihSoalDinilai(daftarSoalBaru, sesi);
  const { totalSkor, totalSkorPersen } = hitungTotalSkor(
    daftarDinilai,
    sesi.jawaban || {},
    sesi.nilaiEsai || null
  );

  const xpMentahBaru = Math.round(totalSkor * 10);
  const { xpFinal: xpFinalBaru } = terapkanPotonganXP(xpMentahBaru, sesi.pelanggaran || []);

  const totalSkorPersenLama = Number(sesi.totalSkorPersen) || 0;
  const xpFinalLama = Number(sesi.xpFinal) || 0;

  const selisihSkor = totalSkorPersen - totalSkorPersenLama;
  const selisihXp = xpFinalBaru - xpFinalLama;

  return {
    sesiId: sesi.id,
    studentId: sesi.studentId || '',
    nama: sesi.nama || sesi.studentId || 'Siswa',
    totalSkor,
    totalSkorPersen,
    totalSkorPersenLama,
    xpMentah: xpMentahBaru,
    xpFinal: xpFinalBaru,
    xpFinalLama,
    selisihSkor,
    selisihXp,
    berubah: selisihSkor !== 0 || selisihXp !== 0,
  };
}

/**
 * Eksekutor simpan koreksi kunci ke Firestore dan hitung ulang semua sesi selesai.
 * Didesain modular agar bisa diuji secara unit test dengan mock / dependency injection.
 */
export async function eksekusiKoreksiDanHitungUlang({
  db,
  paketId,
  paket,
  daftarSoalBaru,
  sesiList = [],
  soalIndex = 0,
  infoTentor = {},
  catatan = '',
  anulirBonus = false,
  firestoreOps = {}, // { updateDoc, doc, getDoc, serverTimestamp }
  auditFn = null,
}) {
  if (!paketId || !Array.isArray(daftarSoalBaru)) {
    throw new Error('Parameter paketId dan daftarSoalBaru wajib valid.');
  }

  const {
    updateDoc = async () => {},
    doc = (d, col, id) => ({ path: `${col}/${id}` }),
    getDoc = async () => ({ exists: () => false, data: () => ({}) }),
    serverTimestamp = () => new Date().toISOString(),
  } = firestoreOps;

  const soalTerkoreksi = daftarSoalBaru[soalIndex];
  const stampWaktu = serverTimestamp();

  // 1. Simpan daftar soal baru ke dokumen paket
  await updateDoc(doc(db, 'tryout_paket', paketId), {
    daftarSoal: daftarSoalBaru,
    terakhirDikoreksiPada: stampWaktu,
    terakhirDikoreksiOleh: infoTentor?.guruNama || 'Tentor Gemilang',
    terakhirDikoreksiId: infoTentor?.guruId || '',
  });

  // 2. Hitung ulang setiap sesi yang sudah selesai
  const sesiSelesai = sesiList.filter((s) => s && s.status === 'selesai');
  const rincianPerubahan = [];
  let jumlahBerubah = 0;

  for (const sesi of sesiSelesai) {
    const hasil = hitungUlangSatuSesi(sesi, daftarSoalBaru);
    if (!hasil) continue;

    rincianPerubahan.push(hasil);
    if (hasil.berubah) jumlahBerubah++;

    // Update dokumen sesi
    await updateDoc(doc(db, 'tryout_sesi', sesi.id), {
      totalSkor: hasil.totalSkor,
      totalSkorPersen: hasil.totalSkorPersen,
      xpMentah: hasil.xpMentah,
      xpFinal: hasil.xpFinal,
      dikoreksiPada: stampWaktu,
      dikoreksiOlehTentor: infoTentor?.guruNama || 'Tentor Gemilang',
    });

    // Sesuaikan saldo XP siswa jika ada selisih XP
    if (hasil.selisihXp !== 0 && hasil.studentId) {
      try {
        const progRef = doc(db, 'siswa_progress', hasil.studentId);
        const snapProg = await getDoc(progRef);
        const existing = snapProg.exists() ? snapProg.data() : {};
        const { xpMingguIni, xpMingguIniKunci } = tambahXpMingguan(
          existing.xpMingguIni,
          existing.xpMingguIniKunci,
          hasil.selisihXp
        );
        await updateDoc(progRef, {
          xp: Math.max(0, (existing.xp || 0) + hasil.selisihXp),
          xpMingguIni: Math.max(0, xpMingguIni),
          xpMingguIniKunci,
          updatedAt: stampWaktu,
        });
      } catch (errXp) {
        console.warn(`[KoreksiKunci] Gagal update progress XP siswa ${hasil.studentId}:`, errXp);
      }
    }
  }

  // 3. Catat ke audit log
  if (typeof auditFn === 'function') {
    try {
      auditFn('tryout.kunci.koreksi', {
        kategori: 'tryout',
        target: `Soal #${soalIndex + 1} • ${paket?.judul || paketId}`,
        detail: {
          paketId,
          soalNomor: soalIndex + 1,
          kunciSebelum: soalTerkoreksi?.koreksiTentor?.kunciSebelumnya,
          kunciSesudah: soalTerkoreksi?.koreksiTentor?.kunciBaru,
          anulirBonus: !!anulirBonus,
          catatan,
          guruNama: infoTentor?.guruNama,
          guruId: infoTentor?.guruId,
          totalSesiDiproses: sesiSelesai.length,
          sesiBerubahNilai: jumlahBerubah,
        },
      });
    } catch (auditErr) {
      console.warn('[KoreksiKunci] Gagal catat audit:', auditErr);
    }
  }

  return {
    sukses: true,
    soalNomor: soalIndex + 1,
    soal: soalTerkoreksi,
    totalSesiDiproses: sesiSelesai.length,
    jumlahBerubah,
    rincianPerubahan,
  };
}

export default {
  normalisasiKunciBaru,
  terapkanKoreksiPadaDaftarSoal,
  hitungUlangSatuSesi,
  eksekusiKoreksiDanHitungUlang,
};
