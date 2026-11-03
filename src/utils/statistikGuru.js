// src/utils/statistikGuru.js
// ============================================================
// Angka-angka kartu statistik dasbor guru, sebagai fungsi MURNI (tanpa
// Firestore, tanpa React) supaya bisa diuji dan supaya definisinya satu tempat.
//
// KENAPA DITULIS ULANG (register bug B-07, B-08, B-09, B-10; keputusan owner
// D3 = "atur se-efisien/efektif mungkin, kamu putuskan"):
//   Kartu lama berbohong tanpa niat jahat:
//     • "Total Siswa"  = semua siswa yang PERNAH terjadwal sejak awal, diberi
//                        badge "Aktif" → siswa yang sudah berhenti tetap ikut.
//     • "Total Kelas"  = jumlah seluruh dokumen jadwal sepanjang masa → hanya
//                        bisa naik, tidak menggambarkan beban sekarang.
//     • "+N" di kartu "Sesi Hari Ini" = jumlah sesi 7 hari KE BELAKANG, dibaca
//                        guru sebagai "hari ini bertambah N".
//     • Kehadiran = hadir historis ÷ roster jadwal VERSI SEKARANG → begitu
//                        roster ditambah siswa, persen turun walau tak ada yang
//                        bolos.
//   Karena kartu lama mendapat angkanya dari sapuan SELURUH riwayat (B-14),
//   memperbaikinya tidak bisa setengah-setengah: jendela tarik dipersempit
//   (identitasJadwal.rentangTanggalJadwal) maka definisi kartu WAJIB ikut
//   berubah menjadi sesuatu yang bisa dihitung dari jendela itu.
//
// DEFINISI BARU (semuanya bisa dihitung dari ±15 hari data, biaya datar):
//   1. Sesi Hari Ini        → jadwal cocok dengan dateStr == hari ini.
//   2. Sesi 7 Hari Terakhir → jadwal cocok pada [hariIni-7 .. hariIni];
//                             sub-angka "N selesai" = status 'completed'.
//   3. Siswa Terjadwal      → siswa unik pada SELURUH jendela (−7..+7 hari),
//                             diberi label periode supaya tidak dibaca sebagai
//                             "total siswa bimbel".
//   4. Kehadiran            → Σ hadir ÷ Σ total dari LOG. Penyebut diambil dari
//                             log itu sendiri (`siswaTotal`, ditulis mulai
//                             v1.6.5); bila log lama belum punya, dipakai roster
//                             jadwal HANYA bila jadwalnya masih ada di jendela
//                             (ditandai `perkiraan`); bila dua-duanya tidak ada,
//                             sesi TIDAK DIHITUNG (bukan dihitung 0) dan
//                             dilaporkan lewat `tanpaBukti`.
//                             Tidak ada bukti → persen `null` → UI menampilkan
//                             "—" + penjelasan, bukan 0% yang menuduh.
// ============================================================

const angka = (x) => (Number.isFinite(Number(x)) ? Number(x) : null);

/**
 * Hitung tingkat kehadiran dari log mengajar.
 * @param {object} o
 * @param {Array}  o.logs        log mengajar milik guru ini (sudah disaring identitasnya)
 * @param {Map|object} [o.rosterJadwal] peta jadwalId → jumlah siswa pada roster saat ini
 */
export function hitungKehadiran({ logs = [], rosterJadwal = null } = {}) {
  const daftar = Array.isArray(logs) ? logs.filter(Boolean) : [];
  const roster = rosterJadwal instanceof Map ? rosterJadwal : new Map(Object.entries(rosterJadwal || {}));
  let hadir = 0;
  let total = 0;
  let sesiTerhitung = 0;
  let tanpaBukti = 0;
  let perkiraan = 0;

  daftar.forEach((l) => {
    const h = angka(l.siswaHadir);
    if (h === null || h < 0) { tanpaBukti += 1; return; }

    let t = angka(l.siswaTotal);
    let pakaiPerkiraan = false;
    if (t === null || t <= 0) {
      const dariJadwal = angka(roster.get(l.jadwalId));
      if (dariJadwal === null || dariJadwal <= 0) { tanpaBukti += 1; return; }
      t = dariJadwal;
      pakaiPerkiraan = true;
    }

    hadir += Math.min(h, t); // hadir tak mungkin melebihi total; jaga dari data rusak
    total += t;
    sesiTerhitung += 1;
    if (pakaiPerkiraan) perkiraan += 1;
  });

  return {
    persen: total > 0 ? Math.round((hadir / total) * 100) : null,
    hadir,
    total,
    sesiTerhitung,
    tanpaBukti,
    perkiraan,
  };
}

/**
 * Seluruh angka kartu statistik dasbor guru.
 * @param {object} o
 * @param {Array}  o.jadwal     jadwal MILIK GURU INI di dalam jendela (−7..+7 hari)
 * @param {Array}  o.logs       log mengajar guru ini (maks 30 terbaru)
 * @param {string} o.hariIniStr tanggal lokal `YYYY-MM-DD`
 */
export function hitungStatistikGuru({ jadwal = [], logs = [], hariIniStr = '' } = {}) {
  const arr = Array.isArray(jadwal) ? jadwal.filter(Boolean) : [];
  const byJam = (a, b) => String(a.start || '').localeCompare(String(b.start || ''));

  const hariIni = arr.filter((s) => s.dateStr === hariIniStr).sort(byJam);
  const riwayat = arr.filter((s) => s.dateStr && s.dateStr < hariIniStr);
  const mendatang = arr
    .filter((s) => s.dateStr > hariIniStr)
    .sort((a, b) => String(a.dateStr || '').localeCompare(String(b.dateStr || '')) || byJam(a, b));

  // Roster saat ini hanya dipakai sebagai PENYEBUT CADANGAN untuk log lama yang
  // belum menyimpan `siswaTotal` — dan hanya bila jadwalnya masih di jendela.
  const rosterJadwal = new Map();
  arr.forEach((s) => {
    if (s?.id) rosterJadwal.set(s.id, Array.isArray(s.students) ? s.students.length : 0);
  });

  const siswa = new Set();
  arr.forEach((s) => {
    (Array.isArray(s.students) ? s.students : []).forEach((st) => {
      const id = String(typeof st === 'string' ? st : st?.studentId || st?.id || '').trim();
      if (id) siswa.add(id);
    });
  });

  const tujuhHari = [...riwayat, ...hariIni];
  const kehadiran = hitungKehadiran({ logs, rosterJadwal });

  return {
    sesiHariIni: hariIni.length,
    sesi7Hari: tujuhHari.length,
    sesiSelesai7Hari: tujuhHari.filter((s) => s.status === 'completed').length,
    sesiMendatang: mendatang.length,
    siswaTerjadwal: siswa.size,
    kehadiran,
    daftarHariIni: hariIni,
    daftarMendatang: mendatang,
  };
}

export default { hitungKehadiran, hitungStatistikGuru };
