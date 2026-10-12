// src/utils/sumberPaket.js
// ============================================================
// PROVENANS PAKET TRY OUT — setiap baris daftar wajib menjawab
// "siapa yang membuat ini, dan siapa yang menerbitkannya?"
//
// KENAPA ADA (permintaan owner 2026-10-12 setelah menghapus paket
// "Try Out Wajib Jumat" berisi 125 soal campur): paket mesin otomatis
// pernah berstatus aktif dengan target "Semua" dan 3 soal, dan TIDAK ADA
// satu pun tampilan yang memberitahu admin bahwa paket itu buatan mesin.
// Daftar paket harus memperlihatkan sumbernya supaya anomali terlihat
// sebagai anomali, bukan sebagai baris biasa.
//
// Sumber dibaca dari field yang SUDAH ditulis masing-masing jalur:
//   tentor  : dibuatOleh='tentor' + disetujuiOleh/disetujuiPada (approval)
//   admin   : dibuatOleh='admin'
//   mesin   : sumber='mesin-otomatis' / otomatis=true
//   lama    : tidak ada keduanya -> "Sumber tidak tercatat" (jujur,
//             bukan ditebak)
// Plus jejak aktivasi: riwayatStatus entri status 'aktif' (mulai dicatat
// oleh tombol Aktifkan/Nonaktifkan sejak commit ini; paket lama yang
// aktif tanpa jejak diakui terus terang "diaktifkan tanpa jejak").
//
// MURNI & TERUJI (tests/sumberPaket.test.mjs).
// ============================================================

function waktu(v) {
  if (!v) return '';
  const d = v?.toDate ? v.toDate() : new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/**
 * @param {object} paket dokumen tryout_paket
 * @returns {{ikon:string, label:string, detail:string}}
 */
export function sumberPaket(paket = {}) {
  const riwayat = Array.isArray(paket.riwayatStatus) ? paket.riwayatStatus : [];
  const akt = [...riwayat].reverse().find((r) => r.status === 'aktif');

  if (paket.sumber === 'mesin-otomatis' || paket.otomatis === true) {
    const detail = akt
      ? `diaktifkan oleh ${akt.peran || akt.oleh || 'admin'} · ${waktu(akt.pada)}`
      : (paket.status === 'aktif' ? 'AKTIF TANPA JEJAK aktivasi (paket lama sebelum pencatatan) — periksa sasaran & isinya' : 'draf mesin, belum diaktifkan');
    return { ikon: '🤖', label: 'Mesin otomatis (AI)', detail };
  }
  if (paket.dibuatOleh === 'tentor') {
    if (paket.disetujuiOleh || riwayat.some((r) => /disetujui/i.test(r.catatan || ''))) {
      return { ikon: '🧑🏫', label: 'Tentor → approval admin', detail: `disetujui ${paket.disetujuiOleh || 'admin'} · ${waktu(paket.disetujuiPada)}` };
    }
    return { ikon: '🧑‍', label: 'Tentor (menunggu approval)', detail: 'belum disetujui admin' };
  }
  if (paket.dibuatOleh === 'admin') {
    return { ikon: '🛠️', label: 'Dibuat admin', detail: akt ? `diaktifkan · ${waktu(akt.pada)}` : '' };
  }
  return { ikon: '❔', label: 'Sumber tidak tercatat', detail: 'paket lama sebelum pencatatan sumber — verifikasi manual bila akan diaktifkan' };
}

export default { sumberPaket };
