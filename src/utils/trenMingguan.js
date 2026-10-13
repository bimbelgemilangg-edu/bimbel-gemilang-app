// src/utils/trenMingguan.js
// ============================================================
// TREN DELTA MINGGUAN — "posisi saya sekarang di mana?"
//
// KENAPA ADA (arahan owner 2026-10-12): motivasi siswa tidak hidup dari
// foto keadaan sekarang (zona kesiapan), melainkan dari DELTA -- "+8 poin
// dari Sabtu lalu". Tanpa tren, siswa tidak merasakan bahwa Sabtu pagi
// yang berat itu memindahkan sesuatu.
//
// Prinsip desain (REKAM-PAKET-&-DESAIN-MOTIVASI.md bagian 3):
//   - perbandingan terhadap DIRI SENDIRI pekan lalu, BUKAN klasemen
//     antar siswa (overjustification & rasa malu merusak tanggung jawab);
//   - kalimat.delta berbahasa TINDAKAN ("fokus pekan ini pada ..."),
//     bukan vonis ("kemampuanmu rendah");
//   - satu sumber kebenaran: angka yang sama dipakai banner siswa dan
//     (kelak) laporan orang tua.
//
// Pekan dihitung dari Senin (ISO) supaya satu "Sabtu try out" jatuh di
// pekan yang sama dengan latihan pengiringnya minggu itu.
//
// MURNI & TERUJI (tests/trenMingguan.test.mjs).
// ============================================================

const MS_PER_HARI = 86400000;

function tanggalDari(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v.toDate === 'function') return v.toDate();
  if (typeof v === 'number') return new Date(v);
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Kunci pekan (tanggal Senin) sebagai YYYY-MM-DD. */
export function kunciMinggu(waktu) {
  const d = tanggalDari(waktu);
  if (!d) return null;
  const hari = (d.getDay() + 6) % 7; // Senin = 0
  const senin = new Date(d.getTime() - hari * MS_PER_HARI);
  const dua = (n) => String(n).padStart(2, '0');
  return `${senin.getFullYear()}-${dua(senin.getMonth() + 1)}-${dua(senin.getDate())}`;
}

/**
 * @param {Array<{skor:number, waktu:*, mapel?:string}>} sesi
 * @returns {{seri:Array<object>, terakhir:object|null}}
 *   seri urut waktu menaik: {kunci, jumlah, rataSkor, delta, mapelPekan}
 */
export function hitungTrenMingguan(sesi = []) {
  const peta = new Map();
  for (const s of Array.isArray(sesi) ? sesi : []) {
    const skor = Number(s?.skor);
    if (!Number.isFinite(skor)) continue;
    const kunci = kunciMinggu(s.waktu);
    if (!kunci) continue;
    if (!peta.has(kunci)) peta.set(kunci, { kunci, jumlah: 0, total: 0, mapel: new Map() });
    const g = peta.get(kunci);
    g.jumlah += 1;
    g.total += skor;
    const m = String(s.mapel || 'Lainnya');
    g.mapel.set(m, (g.mapel.get(m) || 0) + 1);
  }
  const seri = [...peta.values()]
    .sort((a, b) => a.kunci.localeCompare(b.kunci))
    .map((g) => ({
      kunci: g.kunci,
      jumlah: g.jumlah,
      rataSkor: Math.round((g.total / g.jumlah) * 10) / 10,
      mapelPekan: [...g.mapel.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '',
    }));
  seri.forEach((b, i) => {
    b.delta = i === 0 ? null : Math.round((b.rataSkor - seri[i - 1].rataSkor) * 10) / 10;
  });
  return { seri, terakhir: seri.length ? seri[seri.length - 1] : null };
}

/**
 * Kalimat delta berbahasa tindakan untuk banner siswa.
 * @param {object} tren keluaran hitungTrenMingguan
 * @param {number} [targetPoin] target siswa (dari prodi) bila ada
 * @returns {string}
 */
export function kalimatDelta(tren = {}, targetPoin = null) {
  const t = tren.terakhir;
  if (!t) return 'Sabtu ini garis startmu: kerjakan try out pertamamu dan peta perjalananmu mulai tergambar.';
  const awal = tren.seri.length === 1
    ? `Pekan pertama: rata-rata ${t.rataSkor}% dari ${t.jumlah} try out.`
    : `Pekan ini rata-rata ${t.rataSkor}% (${t.delta > 0 ? '+' : ''}${t.delta} poin dari pekan lalu).`;
  let sasaran = '';
  if (Number.isFinite(Number(targetPoin)) && targetPoin !== null) {
    const kurang = Math.round(Number(targetPoin) - t.rataSkor);
    if (kurang > 0) sasaran = ` Menuju targetmu: kurang ${kurang} poin — fokus pekan ini pada ${t.mapelPekan || 'subtes terlemahmu'}.`;
    else sasaran = ' Targetmu sudah terlewati — pertahankan irama Sabtu ini.';
  } else if (t.delta !== null && t.delta < 0) {
    sasaran = ` Minggu ini adem: ulangi pembahasan soal salahmu di ${t.mapelPekan || 'paket terakhir'}, bukan menambah soal baru.`;
  } else if (t.delta !== null && t.delta > 0) {
    sasaran = ' Naik — pertahankan cara belajarmu minggu ini.';
  }
  return `${awal}${sasaran}`;
}

/**
 * Target poin siswa dari dokumen siswa, sadar-alias (pola fieldButirSoal):
 * setiap jalur tulis lama mungkin memakai nama berbeda; yang kosong/null
 * berarti "belum punya target" dan kalimat delta berjalan tanpa sasaran.
 * @param {object} siswa
 * @returns {number|null}
 */
export function targetPoinDariSiswa(siswa = {}) {
  const kandidat = [
    siswa?.targetSkor, siswa?.target_skor, siswa?.targetPoin, siswa?.target_poin,
    siswa?.target?.skor, siswa?.target?.poin, siswa?.targetKampus?.skorMinimal,
    siswa?.targetProdi?.skorMinimal, siswa?.minimalSkor,
  ];
  for (const v of kandidat) {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

export default { kunciMinggu, hitungTrenMingguan, kalimatDelta, targetPoinDariSiswa };
