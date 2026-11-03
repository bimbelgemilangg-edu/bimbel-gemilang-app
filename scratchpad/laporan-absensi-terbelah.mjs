// scratchpad/laporan-absensi-terbelah.mjs
// ============================================================
// LAPORAN (READ-ONLY) untuk item A5: mencari dokumen `attendance` yang
// kunci tanggalnya TIDAK sama dengan tanggal lokal stempel servernya —
// yaitu dokumen yang ditulis penulis ber-UTC pada rentang 00:00-06:59 WIB,
// ketika satu kehadiran bisa terbelah menjadi dua dokumen (sisi guru UTC,
// sisi siswa lokal).
//
//   node scratchpad/laporan-absensi-terbelah.mjs [jumlahHari=45]
//
// TIDAK ADA TULISAN APA PUN di skrip ini (SOP janji 6). Bila ditemukan
// dokumen terbelah, migrasi adalah KEPUTUSAN OWNER tersendiri dengan
// rencana terpisah — skrip ini hanya memberi angkanya.
// Bila kuota baca masih 429, skrip berkata jujur dan menyuruh menunggu.
// ============================================================
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { tanggalLokalStr, geserHariLokal } = await import(join(ROOT, 'src', 'utils', 'waktuLokal.js'));

const API_KEY = 'AIzaSyCpwCjxcKwVKd0qBnezgRPV2MuZe1avVvQ';
const PROYEK = 'gemilangsystem';
const BASIS = `https://firestore.googleapis.com/v1/projects/${PROYEK}/databases/(default)/documents`;
const HARI = Number(process.argv[2] || 45);

async function dokumenTanggal(tanggal) {
  const r = await fetch(`${BASIS}:runQuery?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'attendance' }],
        where: { fieldFilter: { field: { fieldPath: 'date' }, op: 'EQUAL', value: { stringValue: tanggal } } },
      },
    }),
  });
  if (r.status === 429) {
    console.error('❌ Kuota baca Firestore masih 429. Tunggu jendela kuota pulih, lalu jalankan ulang skrip ini.');
    process.exit(2);
  }
  if (!r.ok) { console.error('❌ HTTP', r.status, await r.text()); process.exit(1); }
  const j = await r.json();
  return (j || []).filter((x) => x.document).map((x) => ({
    id: x.document.name.split('/').pop(),
    field: Object.fromEntries(Object.entries(x.document.fields || {}).map(([k, v]) => [k, v.stringValue ?? v.integerValue ?? v.timestampValue ?? null])),
  }));
}

const stempelKeMs = (v) => (v ? new Date(v).getTime() : null);

console.log(`Memeriksa ${HARI} hari terakhir (tanggal lokal vs stempel server)…`);
let totalDok = 0; const terbelah = []; const pasangan = new Map();
for (let i = 0; i < HARI; i += 1) {
  const tanggal = geserHariLokal(new Date(), -i);
  const docs = await dokumenTanggal(tanggal);
  totalDok += docs.length;
  for (const d of docs) {
    const ms = stempelKeMs(d.field.timestamp);
    const lokalStempel = ms ? tanggalLokalStr(new Date(ms)) : null;
    const kunci = `${d.field.studentId || ''}__${d.field.scheduleId || ''}`;
    if (!pasangan.has(kunci)) pasangan.set(kunci, []);
    pasangan.get(kunci).push({ tanggal, id: d.id, nama: d.field.studentName || d.field.namaSiswa || '' });
    if (lokalStempel && lokalStempel !== tanggal) {
      terbelah.push({ id: d.id, tanggalTersimpan: tanggal, tanggalLokalStempel: lokalStempel, siswa: d.field.studentName || '', jadwal: d.field.scheduleId || '' });
    }
  }
}

const ganda = [...pasangan.values()].filter((list) => new Set(list.map((x) => x.tanggal)).size > 1);

console.log(`\nTotal dokumen diperiksa : ${totalDok}`);
console.log(`Dokumen terbelah zona   : ${terbelah.length}`);
for (const t of terbelah.slice(0, 40)) console.log(`   - ${t.id} | tersimpan ${t.tanggalTersimpan} | stempel lokal ${t.tanggalLokalStempel} | ${t.siswa} | jadwal ${t.jadwal}`);
console.log(`Pasangan siswa+jadwal dengan >1 tanggal: ${ganda.length}`);
for (const g of ganda.slice(0, 40)) console.log(`   - ${g.map((x) => `${x.nama || x.id}@${x.tanggal}`).join('  vs  ')}`);
console.log(terbelah.length || ganda.length
  ? '\n⚠️ Ada kandidat data terbelah. MIGRASI = keputusan owner tersendiri; skrip ini tidak menulis apa pun.'
  : '\n✅ Tidak ditemukan dokumen terbelah pada jendela ini. Pencegahan v1.6.4 cukup; tidak ada migrasi yang diperlukan.');
