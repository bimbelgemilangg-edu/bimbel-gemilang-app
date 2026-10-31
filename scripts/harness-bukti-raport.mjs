// harness-raport.mjs — BUKTI end-to-end mesin raport v1.1 (diagnosa 31 Okt 2026)
// Jalankan: node deliverables/harness-raport.mjs
// Memakai MESIN ASLI repo (src/utils/raportOtomatis.js + raportCetak.js) dengan
// data sintetis berbentuk sama dengan produksi: 9 siswa 7 SMP + 2 siswa 9 SMP
// + record yatim (siswa terhapus) + log tipis di bulan berjalan (Oktober).
import { writeFileSync, mkdirSync } from 'node:fs';
import {
  hitungRaportSemuaSiswa, bangunDokumenRaport, rentangPeriode,
  cocokSasaran, buatRingkasan, tanggalWib, VERSI_MESIN,
} from '../src/utils/raportOtomatis.js';
import { htmlRaportSiswa, htmlRaportMassal } from '../src/utils/raportCetak.js';

const WIB = 7 * 3600 * 1000;
const ms = (y, mo, d, h = 2) => Date.UTC(y, mo - 1, d, h, 0, 0); // jam kerja WIB = h-? UTC+7 => h UTC = (h+7) WIB; pakai pagi WIB: 09.00 WIB = 02.00 UTC ✓

// ---------------- siswa ----------------
const siswa = [];
for (let i = 1; i <= 9; i += 1) siswa.push({ id: `s7-${i}`, studentId: `S7-${i}`, nama: `Siswa Tujuh ${i}`, jenjang: 'SMP', kelas: '7 SMP' });
siswa.push({ id: 's9-1', studentId: 'S9-1', nama: 'Siswa Sembilan 1', jenjang: 'SMP', kelas: '9 SMP' });
siswa.push({ id: 's9-2', studentId: 'S9-2', nama: 'Siswa Sembilan 2', jenjang: 'SMP', kelas: '9 SMP' });
const BUDI = siswa[0]; // siswa sorotan: data lengkap Agu–Okt

// ---------------- log aktivitas ----------------
const kuis = [];
const tugas = [];
const absensi = [];
const progresSoal = [];
const nilaiGuru = [];
const sesi = [];

// Budi: 3 kuis MTK + 3 kuis IPA + 3 tugas B.Indo (Agu–Sep) + 1 kuis Okt (tipis)
const tambahKuis = (nim, nama, mapel, skor, y, mo, d) => kuis.push({ studentNim: nim, studentName: nama, subject: mapel, score: skor, submittedAt: ms(y, mo, d), modulTitle: `Latihan ${mapel}` });
[['Matematika', 88], ['Matematika', 92], ['Matematika', 79], ['IPA', 85], ['IPA', 90], ['IPA', 81]].forEach(([m, s], i) => tambahKuis(BUDI.studentId, BUDI.nama, m, s, 2026, 8 + (i % 2), 10 + i));
[['Bahasa Indonesia', 87], ['Bahasa Indonesia', 91], ['Bahasa Indonesia', 84]].forEach(([m, s], i) => tugas.push({ studentNim: BUDI.studentId, studentName: BUDI.nama, subject: m, score: s, submittedAt: ms(2026, 8 + (i % 2), 20 + i) }));
// Sumber KEDUA per mapel (syarat layak: >=2 komponen): tugas MTK & IPA
[['Matematika', 85], ['Matematika', 90], ['Matematika', 82]].forEach(([m, s], i) => tugas.push({ studentNim: BUDI.studentId, studentName: BUDI.nama, subject: m, score: s, submittedAt: ms(2026, 8 + (i % 2), 25 + i) }));
[['IPA', 88], ['IPA', 86], ['IPA', 92]].forEach(([m, s], i) => tugas.push({ studentNim: BUDI.studentId, studentName: BUDI.nama, subject: m, score: s, submittedAt: ms(2026, 8 + (i % 2), 26 + i) }));
tambahKuis(BUDI.studentId, BUDI.nama, 'Matematika', 95, 2026, 10, 12); // Oktober: 1 komponen saja → jujur 'belum cukup'
// Siswa 7 SMP lain: proses ada (absensi+latihan), akademik tipis di Oktober
for (const s of siswa.slice(1, 9)) {
  tambahKuis(s.studentId, s.nama, 'Matematika', 70 + (s.id.charCodeAt(3) % 20), 2026, 10, 15);
}
// Siswa 9 SMP: punya kuis Oktober (ini yang DULU dilaporkan 'orphan' saat filter 7 SMP)
for (const s of siswa.slice(9)) {
  tambahKuis(s.studentId, s.nama, 'Matematika', 80, 2026, 10, 14);
  tambahKuis(s.studentId, s.nama, 'IPA', 85, 2026, 10, 16);
}
// Record yatim: siswa sudah dihapus dari koleksi students
tambahKuis('S7-X', 'Siswa Terhapus', 'Matematika', 60, 2026, 10, 9);
tambahKuis('S7-X', 'Siswa Terhapus', 'IPA', 65, 2026, 10, 9);

// Absensi: Budi + semua siswa 7 SMP, 10 sesi Agu–Okt (status hadir sesekali izin)
for (const s of siswa.slice(0, 9)) {
  for (let i = 0; i < 10; i += 1) {
    absensi.push({ studentId: s.studentId, namaSiswa: s.nama, tanggal: `2026-${String(8 + (i % 3)).padStart(2, '0')}-${String(3 + i).padStart(2, '0')}`, status: i === 4 ? 'izin' : 'hadir', scheduleId: `kls-${i}` });
  }
}
// Absensi yatim
absensi.push({ studentId: 'S7-X', namaSiswa: 'Siswa Terhapus', tanggal: '2026-10-05', status: 'alpha', scheduleId: 'kls-1' });

// Latihan harian Budi (Leitner) + metadata soal
const soalMeta = {};
for (let i = 1; i <= 6; i += 1) {
  const kode = `soal-${i}`;
  soalMeta[kode] = { mataPelajaran: i % 2 ? 'Matematika' : 'IPA', materi: i % 2 ? 'Aljabar' : 'Sel', kesulitan: i % 3 === 0 ? 'sulit' : 'sedang' };
  progresSoal.push({ studentId: BUDI.studentId, soalId: kode, kotak: 2, benarCount: 4, salahCount: 1, benarBerturut: 2, terakhirDicoba: `2026-${i % 2 ? '09' : '08'}-${String(5 + i).padStart(2, '0')}`, updatedAt: ms(2026, i % 2 ? 9 : 8, 5 + i) });
}

const mentah = { siswa, kuis, sesi, paket: [], absensi, tugas, nilaiGuru, progresSoal, soalMeta, progresSiswa: [] };

// ---------------- SKENARIO 1: bulan berjalan (Oktober) — jujur tipis ----------------
const sasaran7 = { jenjang: 'SMP', kelas: '7 SMP' };
const hOkt = hitungRaportSemuaSiswa(mentah, { bulan: '2026-10' }, { sasaran: sasaran7 });
const subsetOkt = hOkt.siswa.filter((r) => cocokSasaran(r, sasaran7));
const ringOkt = buatRingkasan(subsetOkt, { logTakDikenal: hOkt.ringkasan.logTakDikenal, logLuarSaringan: hOkt.ringkasan.logLuarSaringan, dataBermasalah: hOkt.ringkasan.dataBermasalah });
console.log('=== SKENARIO 1 — pratinjau BULAN BERJALAN Oktober 2026, sasaran 7 SMP ===');
console.log(`ringkasan: ${ringOkt.totalSiswa} siswa · ${ringOkt.layakTerbit} layak terbit penuh · ${ringOkt.belumCukup} data belum cukup`);
console.log('orphan SUNGGUHAN (identitas terhapus):', JSON.stringify(ringOkt.logTakDikenal));
console.log('log di luar sasaran (9 SMP) — kini TIDAK lagi dituduh orphan:', JSON.stringify(ringOkt.logLuarSaringan));
console.log('baris Budi Oktober:', JSON.stringify({
  akademik: subsetOkt[0].akademik.rataRata, status: subsetOkt[0].akademik.statusData,
  proses: subsetOkt[0].proses.nilaiProses, mapelLayak: subsetOkt[0].kelayakan.mapelLayak,
}));

// ---------------- SKENARIO 2: laporan besar Agu–Okt — NILAI KELUAR ----------------
const hAgu = hitungRaportSemuaSiswa(mentah, { mulai: '2026-08', selesai: '2026-10' }, { sasaran: sasaran7 });
const subsetAgu = hAgu.siswa.filter((r) => cocokSasaran(r, sasaran7));
const ringAgu = buatRingkasan(subsetAgu, { logTakDikenal: hAgu.ringkasan.logTakDikenal, logLuarSaringan: hAgu.ringkasan.logLuarSaringan, dataBermasalah: hAgu.ringkasan.dataBermasalah });
console.log('\n=== SKENARIO 2 — laporan besar Agu–Okt 2026, sasaran 7 SMP ===');
console.log(`ringkasan: ${ringAgu.totalSiswa} siswa · ${ringAgu.layakTerbit} layak terbit penuh · ${ringAgu.belumCukup} data belum cukup`);
const budi = subsetAgu[0];
console.log('Budi Agu–Okt:', JSON.stringify({
  rataRataAkademik: budi.akademik.rataRata, predikat: budi.akademik.predikat.huruf,
  mapelLayak: `${budi.kelayakan.mapelLayak}/${budi.kelayakan.mapelTotal}`,
  proses: budi.proses.nilaiProses, statusData: budi.akademik.statusData,
}));
for (const m of budi.akademik.perMapel) {
  console.log(`  - ${m.nama}: kuis=${m.komponen.kuis.nilai ?? '—'} tugas=${m.komponen.tugas.nilai ?? '—'} ujian=${m.komponen.ujian.nilai ?? '—'} → ${m.nilaiAkhir ?? '—'} (${m.predikat.huruf}) layak=${m.layak}`);
}

// ---------------- SKENARIO 3: CETAK lengkap (radar + ttd) ----------------
const { docsAkademik, dokProses } = bangunDokumenRaport(budi);
const htmlTunggal = htmlRaportSiswa({
  dokAkademik: docsAkademik.map((d) => d.data),
  dokProses: dokProses.data,
  catatanGuru: 'Matematika: pertahankan ritme latihan Leitner-nya. — Bu Rina',
  identitas: { jenjang: budi.jenjang },
});
const bukti = {
  radarAda: htmlTunggal.includes('rp-radar') && htmlTunggal.includes('<svg'),
  ttdAda: htmlTunggal.includes('Hormat kami'),
  catatanGuruAda: htmlTunggal.includes('Bu Rina'),
  nilaiAkademikTercetak: htmlTunggal.includes(String(budi.akademik.rataRata)),
};
console.log('\n=== SKENARIO 3 — bukti cetakan HTML/PDF ===');
console.log(JSON.stringify(bukti));
mkdirSync('bukti-cetak', { recursive: true });
const bungkus = (body, judul) => `<!doctype html><html lang="id"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${judul}</title></head><body style="margin:0;background:#f8fafc">${body}</body></html>`;
writeFileSync('bukti-cetak/raport-BUDI-Agu-Okt-TERBIT.html', bungkus(htmlTunggal, `Rapor ${budi.studentName}`));
const payloadMassal = subsetAgu.map((r) => {
  const d = bangunDokumenRaport(r);
  return { dokAkademik: d.docsAkademik.map((x) => x.data), dokProses: d.dokProses.data, identitas: { jenjang: r.jenjang } };
});
writeFileSync('bukti-cetak/raport-MASSAL-7SMP-Agu-Okt.html', bungkus(htmlRaportMassal({ daftar: payloadMassal, judul: 'Rapor 7 SMP — Laporan Besar', periodeLabel: hAgu.periode.label }), 'Rapor massal'));

// ---------------- SKENARIO 4: batas WIB (bug yang diperbaiki) ----------------
const p = rentangPeriode({ bulan: '2026-10' });
const diniHari = Date.UTC(2026, 9, 1, 6, 0) - WIB; // 1 Okt 06.00 WIB
console.log('\n=== SKENARIO 4 — jendela WIB ===');
console.log('jendela Okt:', new Date(p.mulaiMs).toISOString(), '→', new Date(p.selesaiMs).toISOString());
console.log('kuis 1 Okt 06.00 WIB masuk Oktober?', diniHari >= p.mulaiMs && diniHari < p.selesaiMs, '· label tanggal:', tanggalWib(diniHari));
console.log(`\nMesin ${VERSI_MESIN} — semua angka di atas dihitung mesin ASLI repo, bukan direka.`);
