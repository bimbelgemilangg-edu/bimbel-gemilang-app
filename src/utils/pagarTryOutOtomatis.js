// src/utils/pagarTryOutOtomatis.js
// ============================================================
// PAGAR KESELAMATAN MESIN TRY OUT OTOMATIS — murni & teruji.
//
// KENAPA BERKAS INI ADA (insiden 2026-10-13): dua pagar ini lahir di
// commit S2 (77102e5, 2026-10-12) DI DALAM mesinTryOutOtomatis.js, lalu
// HILANG tanpa disadari saat merge 45dc70b menyerap main (PR #199) ke
// preview — resolusi konflik mengambil sisi main untuk berkas mesin.
// Akibat nyata: draf "UJI TKA SMP - Sabtu, 17 Okt" tercipta lagi dengan
// sasaran "Semua". Supaya tidak bisa hilang lagi secara diam-diam, pagar
// dipindah ke modul murni terpisah yang:
//   (1) bisa diuji node polos (mesin mengimpor Firebase di tingkat modul
//       sehingga tidak bisa diimpor test), dan
//   (2) punya test sendiri (tests/pagarTryOutOtomatis.test.mjs) yang akan
//       berteriak bila logikanya diubah/dibuang.
//
// Kebijakan (KEPUTUSAN FINAL owner 2026-10-12,
// RANCANGAN-TRYOUT-OTOMATIS-TKA.md):
//   S2 — paket tanpa sasaran jelas tidak boleh lahir; draf yang stoknya
//        kurang DIBLOKIR (bukan "diterbit apa adanya").
//   S5 — AI memilih butir ber-kisi-kisi; kisi-kisi WAJIB menyebut mapel
//        per subtes, bukan teks generik yang sama untuk semua mapel.
// ============================================================
import { bentukKanonikTarget } from './cocokkanTargetPaket.js';
import { kisiKisiUntuk } from './kisiKisiTkaUtbk.js';
// 🔥 ROMBAK 2026-10-13 (keputusan owner): jenis ujian menurunkan sasaran &
// cakupan materi secara OTOMATIS (TKA = kelas akhir jenjang + bank penuh).
// Pagar ikut membaca penurunan itu supaya template warisan ber-sasaran
// "Semua" yang sebenarnya TKA tidak lagi ditolak maupun lolos salah sasaran.
import { terapkanJenisUjian } from './aturanJenisUjian.js';

/**
 * PAGAR IDENTITAS: template jenjang sekolah (SD/SMP/SMA/SMK) wajib punya
 * targetKelas spesifik. "Semua" = paket yang salah sasaran (terlihat lintas
 * jenjang) atau tidak terlihat sama sekali — dua-duanya sudah pernah terjadi.
 * Pelintas sadar: izinkanSemua=true (hanya untuk template non-sekolah campur).
 * @returns {{ok:true}|{ok:false,error:string}}
 */
export function pagarIdentitasTemplate(template = {}, izinkanSemua = false) {
  // 🔥 ROMBAK 2026-10-13: jenis ujian TKA/UTBK menurunkan sasaran otomatis
  // (kelas akhir jenjang), jadi template warisan nama-TKA ber-"Semua"
  // dinilai SETELAH penurunan — bukan ditolak, bukan juga lolos buta.
  const t = terapkanJenisUjian(template || {});
  const jenjangSekolah = /\b(SD|SMP|SMA|SMK)\b/i.test(String(t.jenjang || ''));
  const targetKanonik = bentukKanonikTarget(t.targetKelas);
  if (jenjangSekolah && targetKanonik === 'Semua' && izinkanSemua !== true) {
    return {
      ok: false,
      singkat: 'sasaran kelas masih "Semua"',
      solusi: 'Edit rules → pilih Jenis ujian (TKA/UTBK mengisi sasaran otomatis), atau 💤 tidurkan template ini',
      error:
        'PAGAR IDENTITAS: template jenjang sekolah wajib punya targetKelas spesifik (bukan "Semua"). '
        + 'Paket tanpa sasaran = paket yang salah sasaran atau tak terlihat. '
        + 'Pilih "Jenis ujian" di form Edit rules (TKA/UTBK mengisi sasaran otomatis), '
        + 'atau rules.izinkanSemua=true bila sungguh sadar.',
    };
  }
  return { ok: true };
}

/**
 * GERBANG STOK: draf DIBLOKIR bila ada mapel kekurangan butir terhadap
 * komposisi. Mesin tidak lagi "menerbit apa adanya" paket timpang
 * (mis. UTBK 3/155 soal). Pelintas sadar: izinkanKurang=true.
 * @param {Array<{mapel:string,butuh:number,dapat:number}>} kekurangan
 * @returns {{ok:true}|{ok:false,kekurangan:Array,error:string}}
 */
export function gerbangStokDraf(kekurangan = [], izinkanKurang = false) {
  const kurang = Array.isArray(kekurangan) ? kekurangan.filter((k) => Number(k?.dapat) < Number(k?.butuh)) : [];
  if (kurang.length && izinkanKurang !== true) {
    return {
      ok: false,
      kekurangan: kurang,
      singkat: `stok soal kurang: ${kurang.map((k) => `${k.mapel} (${k.dapat}/${k.butuh})`).join(', ')}`,
      solusi: 'impor stok soal dulu (Dasbor Kesiapan Stok menunjukkan urutannya)',
      error:
        `GERBANG STOK: mapel kekurangan butir untuk komposisi paket ini: `
        + `${kurang.map((k) => `${k.mapel} (${k.dapat}/${k.butuh})`).join(', ')}. `
        + 'Impor stok dulu (Dasbor Kesiapan Stok menunjukkan urutannya), atau rules.izinkanKurang=true bila sungguh sadar.',
    };
  }
  return { ok: true };
}

/**
 * Kisi-kisi PER BARIS KOMPOSISI. Bug S5 (2026-10-13): mesin memanggil
 * kisiKisiUntuk(jenjang, jenisUjian) TANPA mapel, sehingga AI menerima
 * "mapel (umum)" untuk SEMUA subtes — janji "AI memilih ber-kisi-kisi CP"
 * tidak pernah benar-benar terjadi. AI tetap tidak boleh mengarang; ini
 * hanya membuat usulannya terarah per mapel.
 */
export function kisiKisiUntukBaris(template = {}, jenisUjian = '', baris = {}) {
  return kisiKisiUntuk(
    template.jenjang || '',
    jenisUjian || template.jenisUjian || '',
    baris.mapel || ''
  );
}

export default { pagarIdentitasTemplate, gerbangStokDraf, kisiKisiUntukBaris };
