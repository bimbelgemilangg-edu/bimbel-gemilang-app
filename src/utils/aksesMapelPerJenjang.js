// ============================================================
// AKSES MAPEL PER JENJANG (31 Okt 2026 — akar masalah owner:
// "siswa SMP kok mendapatkan mapel Sosiologi")
// ============================================================
// Pendaftaran siswa (AddStudent) dan panel Akses Mapel (EditStudent)
// dulu menampilkan SELURUH koleksi `mapel` tanpa filter jenjang, sehingga
// admin bisa mencentang Sosiologi untuk siswa SMP. Dari sana guru/target
// modul mewarisi mapel yang salah dan nilainya bocor ke raport.
//
// Aturan di sini SENGAJA konservatif:
//   - hanya mapel yang DIKENAL peta Kurikulum Merdeka yang disaring;
//   - kode lokal/asing (mapel English, kode buatan sendiri) selalu lolos —
//     menyembunyikan data yang tidak kita pahami lebih berbahaya;
//   - program English tidak difilter (kurikulumnya di luar fase A–F);
//   - jenjang tak dikenali → tidak memfilter (jujur, tidak mengarang).
// Mesin raport (raportOtomatis.mapelSahUntukSiswa) memakai aturan yang
// sama sebagai jaring pengaman kedua, dan admin melihat daftar mapel yang
// dikesampingkan di halaman Raport Otomatis.
// ============================================================

import { mapelBerlaku, petakanNamaMapel } from './kurikulumMerdeka.js';
import { jenjangBaku } from './jenjangBaku.js';

/** Konteks jenjang siswa → { jenjangBaku, nomorKelas } (kosong = tak tahu). */
export function konteksJenjangSiswa({ jenjang = '', kelas = '', programType = '', kategori = '' } = {}) {
  const program = String(programType || kategori || '');
  if (program.toLowerCase() === 'english' || String(jenjang).toLowerCase() === 'english') {
    return { jenjangBaku: '', nomorKelas: '', english: true };
  }
  return {
    jenjangBaku: jenjangBaku(jenjang).baku, // '' bila tak dikenali (tak memfilter)
    nomorKelas: (/^(\d{1,2})/.exec(String(kelas || '').trim()) || [])[1] || '',
    english: false,
  };
}

/** Apakah SATU mapel (nama dari koleksi `mapel`) sah untuk siswa ini? */
export function mapelSahUntukPendaftaran(namaMapel, konteks) {
  if (!konteks || konteks.english) return true;
  if (!konteks.jenjangBaku && !konteks.nomorKelas) return true;
  const peta = petakanNamaMapel(String(namaMapel || ''), {});
  if (!peta.kode) return true; // di luar peta Kurikulum Merdeka → jangan disembunyikan
  return mapelBerlaku(peta.kode, { jenjang: konteks.jenjangBaku, kelas: konteks.nomorKelas });
}

/** Saring daftar mapel (dokumen koleksi `mapel`) untuk pendaftaran/edit siswa.
 * @returns {{tersaring:Array, tersembunyi:Array}} tersembunyi = mapel luar jenjang
 * (dipakai UI untuk kalimat penjelas, bukan dihapus diam-diam). */
export function saringMapelUntukSiswa(mapelList = [], siswa = {}) {
  const konteks = konteksJenjangSiswa(siswa);
  const tersaring = [];
  const tersembunyi = [];
  for (const m of mapelList) {
    if (mapelSahUntukPendaftaran(m.namaMapel || m.nama || '', konteks)) tersaring.push(m);
    else tersembunyi.push(m);
  }
  return { tersaring, tersembunyi, konteks };
}

/** Buang kode mapel terpilih yang tidak sah untuk jenjang (dipakai saat
 * admin mengubah kelas/jenjang di tengah pengisian form). */
export function pangkasKodeMapelTerpilih(kodeTerpilih = [], mapelList = [], siswa = {}) {
  const byKode = new Map(mapelList.map((m) => [m.kodeMapel, m]));
  return kodeTerpilih.filter((kode) => {
    const m = byKode.get(kode);
    if (!m) return false; // kode yatim (mapel dihapus) — memang tak boleh ikut
    return mapelSahUntukPendaftaran(m.namaMapel || m.nama || '', konteksJenjangSiswa(siswa));
  });
}

export default {
  konteksJenjangSiswa, mapelSahUntukPendaftaran, saringMapelUntukSiswa, pangkasKodeMapelTerpilih,
};
