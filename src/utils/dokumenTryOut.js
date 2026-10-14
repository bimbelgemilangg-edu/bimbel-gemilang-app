// src/utils/dokumenTryOut.js
// ============================================================
// Modul MURNI: memecah satu paket try out terbit menjadi "dokumen"
// per test (subtes) untuk tampilan tumpukan dokumen siswa
// (permintaan owner 14 Okt 2026: "dalam satu draft ada 3 test —
// kedepannya pisah per test biar bisa jadi tumpukan dokumen").
//
// Aturan main (diputuskan supaya ADA & SKOR tetap aman):
//   - Paket ber-modeTimer 'per-subtes' dikerjakan BERURUTAN (mesin try out
//     memang melarang balik ke subtes sebelumnya). Maka dokumen test ke-K
//     TERKUNCI selama test ke-K-1 belum jadi dokumen yang sedang dikerjakan.
//     Kunci ini VISUAL di tumpukan + konsisten dengan perilaku TryOutView
//     (resume memakai sesi.subtesAktifIndex), jadi tidak ada jalan masuk
//     lintas urutan yang bisa merusak skor.
//   - Paket modeTimer 'total' (satu waktu untuk semua soal): semua dokumen
//     terbuka bersamaan karena pengerjaannya memang satu duduk; kartu
//     membawa catatan supaya siswa tidak salah paham.
//   - Skor per dokumen dihitung dari jawaban sesi tersimpan dibanding soal
//     milik subtes itu saja (jujur per test, bukan skor paket utuh).
// ============================================================
import { hitungTotalSkor } from './skorSoalTryOut.js';

const ms = (v) => (typeof v?.toDate === 'function' ? v.toDate().getTime() : v ? new Date(v).getTime() : null);

/** Status paket terhadap waktu & sesi, pakai istilah halaman daftar. */
export function statusPaketTryOut(paket, sesi, kini = Date.now()) {
  if (sesi?.status === 'selesai') return 'selesai';
  if (sesi?.status === 'berjalan') return 'berjalan';
  const buka = ms(paket.waktuBuka);
  const tutup = ms(paket.waktuTutup);
  if (buka !== null && kini < buka) return 'belum-buka';
  if (tutup !== null && kini > tutup) return 'lewat';
  return 'terbuka';
}

/**
 * Pecah satu paket menjadi daftar dokumen (satu per subtes; paket tanpa
 * subtes eksplisit menjadi satu dokumen utuh).
 * @param {object} paket dokumen tryout_paket
 * @param {{sesi?:object|null,kini?:number}} [opsi] sesi tryout_sesi siswa ini
 * @returns {Array<object>} dokumen, urut test ke-1..ke-N
 */
export function bangunDokumenTryOut(paket, opsi = {}) {
  const kini = opsi.kini ?? Date.now();
  const sesi = opsi.sesi || null;
  const subtes = Array.isArray(paket.subtes) ? paket.subtes : [];
  const daftarSoal = Array.isArray(paket.daftarSoal) ? paket.daftarSoal : [];
  const status = statusPaketTryOut(paket, sesi, kini);
  const berurutan = (paket.modeTimer || 'total') === 'per-subtes' && subtes.length > 1;
  const indeksAktif = Math.min(
    Math.max(Number(sesi?.subtesAktifIndex || 0), 0),
    Math.max(subtes.length - 1, 0),
  );

  const sumber = subtes.length > 0
    ? subtes
    : [{ nama: paket.judul, soalIds: daftarSoal.map((q) => q.id), durasiMenit: paket.durasiTotalMenit }];

  return sumber.map((sb, i) => {
    const ids = sb.soalIds || sb.daftarSoal || [];
    const setIds = new Set(ids);
    const kelompok = ids.length ? daftarSoal.filter((q) => setIds.has(q.id)) : [];
    const skor = sesi?.jawaban && kelompok.length
      ? (hitungTotalSkor(kelompok, sesi.jawaban)?.totalSkorPersen ?? null)
      : null;

    const terkunci = berurutan && status !== 'selesai' && i > indeksAktif;
    const terlewatUrutan = berurutan && status === 'berjalan' && i < indeksAktif;
    const bisaDibuka = status !== 'selesai'
      && status !== 'belum-buka'
      && status !== 'lewat'
      && !terkunci
      && !terlewatUrutan;

    let stamp;
    if (status === 'selesai') stamp = skor === null ? 'SELESAI' : `SELESAI · ${Math.round(skor)}%`;
    else if (status === 'belum-buka') stamp = 'TERJADWAL'; // jadwal menang atas kunci urutan
    else if (status === 'lewat') stamp = 'LEWAT';
    else if (terkunci) stamp = 'TERKUNCI';
    else if (terlewatUrutan) stamp = 'SUDAH DIAMBIL';
    else if (status === 'berjalan' && i === indeksAktif) stamp = 'SEDANG DIKERJAKAN';
    else stamp = 'SIAP DIKERJAKAN';

    return {
      id: `${paket.id}__test${i + 1}`,
      paketId: paket.id,
      subtesIndex: i,
      judul: sb.nama || sb.judul || `Test ${i + 1}`,
      mapel: sb.mapel || sb.nama || sb.judul || paket.judul || '',
      judulPaket: paket.judul || '',
      jumlahSoal: ids.length || kelompok.length,
      durasiMenit: Number(sb.durasiMenit) || 0,
      waktuBuka: ms(paket.waktuBuka),
      waktuTutup: ms(paket.waktuTutup),
      urutan: sumber.length > 1 ? { ke: i + 1, dari: sumber.length } : null,
      berurutan,
      terkunci,
      terlewatUrutan,
      bisaDibuka,
      stamp,
      skor,
      statusPaket: status,
      catatan: terkunci
        ? 'Kerjakan test sebelumnya dulu — dokumen ini terbuka otomatis setelah giliranmu sampai.'
        : terlewatUrutan
          ? 'Subtes ini sudah lewat dari giliranmu; urutan try out tidak bisa mundur.'
          : berurutan
            ? 'Test dikerjakan berurutan; waktu mulai begitu dokumen dibuka.'
            : sumber.length > 1
              ? 'Bagian dari satu pengerjaan utuh (satu waktu untuk semua test).'
              : '',
    };
  });
}

/** FlatMap beberapa paket jadi satu tumpukan dokumen urut waktu buka. */
export function susunDokumenTryOut(paketList, opsi = {}) {
  const sesiPerPaket = opsi.sesiPerPaket || new Map();
  const kini = opsi.kini ?? Date.now();
  const ambil = (p) => (typeof sesiPerPaket.get === 'function' ? sesiPerPaket.get(p.id) : sesiPerPaket[p.id]);
  return paketList
    .flatMap((p) => bangunDokumenTryOut(p, { kini, sesi: ambil(p) || null }))
    .sort((a, b) => (a.waktuBuka || 0) - (b.waktuBuka || 0) || (a.urutan?.ke || 1) - (b.urutan?.ke || 1));
}
