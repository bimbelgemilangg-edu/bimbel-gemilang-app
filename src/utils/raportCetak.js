// src/utils/raportCetak.js
// ============================================================
// RAPORT OTOMATIS — LAPISAN PRESENTASI & CETAK (Fase 2, 21 Okt 2026)
// ============================================================
// Blueprint ANALISIS-RAPORT-OTOMATIS.md §9 (keputusan owner #4): admin
// mengunduh PDF raport PER SISWA atau PER JENJANG (massal) memakai engine
// cetak yang sudah distabilkan (cetakLewatIframe di utils/kwitansi.js —
// font siap, gambar ter-decode, @page A4). Berkas ini membangun HTML-nya.
//
// ATURAN KERAS (sama dengan mesin raportOtomatis.js):
//   1. MURNI — tidak boleh mengimpor Firebase/DOM. Masukan = dokumen
//      snapshot (bentuk keluaran bangunDokumenRaport ATAU dokumen datar
//      hasil baca Firestore), keluaran = string HTML/SVG. Bisa diuji di
//      Node (tests/raportCetak.test.mjs).
//   2. TIDAK PERNAH MENGARANG — nilai null dicetak '—', dimensi null
//      dicetak 'belum terukur', komponen belum terukur TIDAK dinolkan;
//      keterangan redistribusi bobot ikut tercetak.
//   3. Semua teks dinamis lewat escapeHtml (nama siswa/paket/catatan
//      berasal dari input pengguna — cetak tidak boleh jadi celah XSS).
//   4. Pelanggaran integritas = CATATAN (keputusan owner #3): dicetak
//      apa adanya dengan kalimat "nilai tidak dipotong".
//
// Pemakai:
//   - /admin/raport         → cetak per siswa & massal per jenjang/kelas
//   - LaporanOrangTuaPage   → cetak raport terbit untuk satu siswa
//   - StudentSmartReport    → helper tampil (kelompokDokOtomatis,
//                             poinSparkline, labelPeriodeManusiawi)
// ============================================================

import { WATERMARK } from './fieldButirSoal.js';
import { predikatDariNilai } from './raportOtomatis.js';

// ------------------------------------------------------------
// DASAR
// ------------------------------------------------------------

/** Escape teks apa pun agar aman disisipkan ke HTML. */
export function escapeHtml(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const BULAN_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** '2026-08' → 'Agustus 2026'; '2026-08..2026-10' → 'Agustus–Oktober 2026
 * (laporan besar)'. String tak dikenal dikembalikan apa adanya (jujur). */
export function labelPeriodeManusiawi(periode) {
  const s = String(periode || '').trim();
  const parseBulan = (x) => {
    const m = /^(\d{4})-(\d{2})$/.exec(String(x || '').trim());
    if (!m) return null;
    const mo = Number(m[2]);
    if (mo < 1 || mo > 12) return null;
    return { tahun: Number(m[1]), bulan: BULAN_ID[mo - 1] };
  };
  if (s.includes('..')) {
    const [a, b] = s.split('..');
    const pa = parseBulan(a); const pb = parseBulan(b);
    if (pa && pb) {
      const tahun = pa.tahun === pb.tahun ? String(pa.tahun) : `${pa.tahun}–${pb.tahun}`;
      return `${pa.bulan}–${pb.bulan} ${tahun} (laporan besar)`;
    }
    return s;
  }
  const p = parseBulan(s);
  return p ? `${p.bulan} ${p.tahun}` : s;
}

/** Normalisasi dokumen: {id,data} (keluaran bangunDokumenRaport) maupun
 * dokumen datar {id,...data} (hasil baca Firestore) → data-nya saja. */
export function dataDok(d) {
  if (!d) return null;
  return d.data && typeof d.data === 'object' ? d.data : d;
}

/** Label dimensi yang konsisten dengan mesin & UI siswa. */
export const DIMENSI_LABEL = {
  pemahaman: 'Pemahaman',
  analisis: 'Analisis',
  ketelitian: 'Ketelitian',
  waktu: 'Waktu',
  dayaTangkap: 'Daya Tangkap',
};
export const DIMENSI_KEYS = Object.keys(DIMENSI_LABEL);

export const warnaPredikatHuruf = (huruf) => (
  { A: '#166534', B: '#1d4ed8', C: '#b45309', D: '#991b1b' }[huruf] || '#64748b'
);

export const warnaStatusTopik = (status) => (
  { hijau: '#16a34a', kuning: '#ca8a04', merah: '#dc2626', abu: '#94a3b8' }[status] || '#94a3b8'
);

// ------------------------------------------------------------
// KELOMPOK DOKUMEN TERBIT (dipakai UI siswa & halaman ortu)
// ------------------------------------------------------------

/** Kelompokkan dokumen raport_final sumber:'otomatis' per periode.
 * @param {Array<object>} docs dokumen datar (hasil baca Firestore)
 * @returns {Array<{periode, labelManusiawi, akademik, proses, versiMesin,
 *   jejak, terkunci, studentName, studentKelas}>}
 * Urut: laporan besar (periode '..') dulu, lalu bulanan terbaru → terlama. */
export function kelompokDokOtomatis(docs = []) {
  const grup = new Map();
  for (const d of Array.isArray(docs) ? docs : []) {
    const data = dataDok(d);
    if (!data || data.sumber !== 'otomatis') continue;
    const periode = String(data.periode || '');
    if (!periode) continue;
    if (!grup.has(periode)) {
      grup.set(periode, {
        periode,
        labelManusiawi: labelPeriodeManusiawi(periode),
        akademik: [],
        proses: null,
        versiMesin: data.versiMesin || '',
        jejak: data.jejak || null,
        terkunci: data.terkunci === true,
        studentName: data.studentName || '',
        studentKelas: data.studentKelas || '',
      });
    }
    const g = grup.get(periode);
    if (data.blok === 'proses') {
      if (!g.proses) g.proses = data;
    } else {
      g.akademik.push(data);
    }
  }
  const daftar = [...grup.values()];
  for (const g of daftar) g.akademik.sort((a, b) => String(a.mapel || '').localeCompare(String(b.mapel || '')));
  daftar.sort((a, b) => {
    const aBesar = a.periode.includes('..') ? 0 : 1;
    const bBesar = b.periode.includes('..') ? 0 : 1;
    if (aBesar !== bBesar) return aBesar - bBesar;
    return b.periode.localeCompare(a.periode);
  });
  return daftar;
}

// ------------------------------------------------------------
// SPARKLINE TREN HARIAN (murni — dipakai cetakan & UI siswa)
// ------------------------------------------------------------

/** Hitung koordinat polyline dari trenHarian (skor null dilewati — titik
 * tanpa angka TIDAK digambar di 0). Kurang dari 2 titik → null. */
export function poinSparkline(trenHarian = [], { lebar = 300, tinggi = 46, pad = 8 } = {}) {
  const poin = (Array.isArray(trenHarian) ? trenHarian : [])
    .filter((t) => t && Number.isFinite(Number(t.skor)) && t.skor !== null)
    .map((t) => ({ tanggal: String(t.tanggal || ''), skor: Number(t.skor), jenis: String(t.jenis || '') }));
  if (poin.length < 2) return null;
  const skor = poin.map((p) => p.skor);
  const min = Math.min(...skor);
  const max = Math.max(...skor);
  const rentangX = lebar - pad * 2;
  const rentangY = tinggi - pad * 2;
  const titik = poin.map((p, i) => ({
    ...p,
    x: Math.round((pad + (i * rentangX) / (poin.length - 1)) * 10) / 10,
    // min === max → garis di tengah (bukan menempel dasar).
    y: Math.round((pad + (max === min ? rentangY / 2 : ((max - p.skor) / (max - min)) * rentangY)) * 10) / 10,
  }));
  return {
    titik,
    points: titik.map((t) => `${t.x},${t.y}`).join(' '),
    jumlah: titik.length,
    pertama: titik[0],
    terakhir: titik[titik.length - 1],
    min,
    max,
    lebar,
    tinggi,
  };
}

/** SVG sparkline siap sisip (string) untuk cetakan. Kosong ('') bila data
 * kurang dari 2 titik — pemanggil menampilkan kalimat jujur, bukan grafik 0. */
export function svgSparkline(trenHarian = [], opts = {}) {
  const s = poinSparkline(trenHarian, opts);
  if (!s) return '';
  const { lebar, tinggi } = s;
  const label = (t, x, anchor) => `<text x="${x}" y="${tinggi - 1}" font-size="8" fill="#64748b" text-anchor="${anchor}">${escapeHtml(t)}</text>`;
  return `<svg width="${lebar}" height="${s.tinggi + 10}" viewBox="0 0 ${lebar} ${s.tinggi + 10}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tren skor harian">`
    + `<polyline fill="none" stroke="#4f46e5" stroke-width="2" points="${s.points}" />`
    + `<circle cx="${s.terakhir.x}" cy="${s.terakhir.y}" r="3" fill="#4f46e5" />`
    + label(s.pertama.tanggal, s.pertama.x, 'start')
    + label(`${s.terakhir.tanggal} · ${s.terakhir.skor}`, Math.min(s.terakhir.x, lebar - 90), 'end')
    + '</svg>';
}

// ------------------------------------------------------------
// MODEL CETAKAN
// ------------------------------------------------------------

const fmt = (n) => (Number.isFinite(n) ? String(n) : '—');
const fmt1 = (n) => (Number.isFinite(n) ? String(Math.round(n * 10) / 10) : '—');
const fmtTglPanjang = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** Susun model tampilan dari dokumen snapshot. Semua field defensif:
 * dokumen terbit sebagian/tanpa blok proses tetap bisa dicetak jujur. */
export function siapkanModelRaport({
  dokAkademik = [], dokProses = null, catatanGuru = '', identitas = {},
} = {}) {
  const akademikDocs = (Array.isArray(dokAkademik) ? dokAkademik : [])
    .map(dataDok)
    .filter((d) => d && d.blok !== 'proses')
    .sort((a, b) => String(a.mapel || '').localeCompare(String(b.mapel || '')));
  const proses = dataDok(dokProses) || null;
  const sumberIdentitas = proses || akademikDocs[0] || {};
  const rataRata = proses && Number.isFinite(proses.rataRataAkademik)
    ? proses.rataRataAkademik
    : (() => {
      const layak = akademikDocs.filter((d) => Number.isFinite(d.nilai_akhir) && d.statusData !== 'belum-cukup');
      return layak.length
        ? Math.round((layak.reduce((s, d) => s + d.nilai_akhir, 0) / layak.length) * 10) / 10
        : null;
    })();
  return {
    identitas: {
      nama: identitas.nama || sumberIdentitas.studentName || '—',
      studentId: identitas.studentId || sumberIdentitas.studentId || '—',
      kelas: identitas.kelas || sumberIdentitas.studentKelas || '—',
      program: identitas.program || sumberIdentitas.studentProgram || '',
      jenjang: identitas.jenjang || '',
      namaBimbel: identitas.namaBimbel || 'Bimbel Gemilang',
    },
    periode: sumberIdentitas.periode || identitas.periode || '',
    versiMesin: sumberIdentitas.versiMesin || '',
    jejak: sumberIdentitas.jejak || null,
    terkunci: sumberIdentitas.terkunci === true,
    akademik: akademikDocs,
    proses,
    ringkasan: {
      rataRataAkademik: rataRata,
      predikatAkademik: predikatDariNilai(rataRata),
      nilaiProses: proses && Number.isFinite(proses.nilai_akhir) ? proses.nilai_akhir : null,
      predikatProses: predikatDariNilai(proses && Number.isFinite(proses.nilai_akhir) ? proses.nilai_akhir : null),
    },
    catatanGuru: String(catatanGuru || ''),
  };
}

// ------------------------------------------------------------
// HTML CETAKAN
// ------------------------------------------------------------

/** CSS cetakan raport — kelas berawalan .rp- agar tidak bentrok dengan
 * style engine cetak (cetakLewatIframe menyuntik CSS dasarnya sendiri). */
export function cssRaport() {
  return `
.rp { font-size: 11.5px; color: #0f172a; line-height: 1.45; }
.rp-wm { position: fixed; inset: 0; z-index: -1; opacity: ${WATERMARK.opacityCetak};
  background: url('${WATERMARK.logo}') center / ${WATERMARK.ukuranMm}mm no-repeat; }
.rp-kop { display: flex; gap: 10px; align-items: center; border-bottom: 2.5px solid #0f172a;
  padding-bottom: 8px; margin-bottom: 10px; }
.rp-kop img { width: 46px; height: 46px; object-fit: contain; }
.rp-kop h1 { font-size: 15px; margin: 0; letter-spacing: .3px; }
.rp-sub { font-size: 10.5px; color: #475569; }
.rp-cap { display: inline-block; margin-top: 4px; font-size: 9px; font-weight: 700; color: #4338ca;
  background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 999px; padding: 2px 8px; }
.rp table { width: 100%; border-collapse: collapse; margin: 6px 0 10px; }
.rp th, .rp td { border: 1px solid #cbd5e1; padding: 4px 7px; text-align: left; vertical-align: top; }
.rp th { background: #f1f5f9; font-size: 10px; }
.rp h2 { font-size: 12px; margin: 12px 0 4px; padding: 4px 9px; background: #0f172a; color: #fff;
  border-radius: 6px; page-break-after: avoid; }
.rp h3 { font-size: 11px; margin: 8px 0 3px; page-break-after: avoid; }
.rp-blok { page-break-inside: avoid; }
.rp-ringkas { display: flex; gap: 10px; flex-wrap: wrap; margin: 8px 0; }
.rp-angka { flex: 1 1 160px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 12px;
  text-align: center; background: #f8fafc; page-break-inside: avoid; }
.rp-angka .besar { font-size: 24px; font-weight: 800; line-height: 1.1; }
.rp-angka .kecil { font-size: 9.5px; color: #64748b; }
.rp-kartu-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.rp-kartu { flex: 1 1 190px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 9px;
  font-size: 10.5px; page-break-inside: avoid; }
.rp-chip { display: inline-block; font-size: 9.5px; border-radius: 999px; padding: 1px 8px;
  border: 1px solid; margin: 2px 2px; background: #fff; }
.rp-muted { color: #64748b; } .rp-warn { color: #b45309; } .rp-bad { color: #991b1b; }
.rp-catatan { border: 1px dashed #94a3b8; border-radius: 8px; padding: 8px 10px; min-height: 46px;
  white-space: pre-wrap; font-size: 11px; page-break-inside: avoid; }
.rp-ttd { margin-top: 20px; display: flex; justify-content: space-between; font-size: 10.5px;
  page-break-inside: avoid; }
.rp-footer { margin-top: 10px; border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 9px;
  color: #64748b; }
.rp-hal { page-break-before: always; }
.rp-kecil { font-size: 9.5px; }
`;
}

function barisDimensi(dimensi = {}, sumber = {}) {
  return DIMENSI_KEYS.map((k) => {
    const v = dimensi?.[k];
    const terukur = Number.isFinite(v);
    return `<span class="rp-chip" style="border-color:${terukur ? '#c7d2fe' : '#e2e8f0'};color:${terukur ? '#4338ca' : '#94a3b8'}${terukur ? '' : ';font-style:italic'}" title="${escapeHtml(sumber?.[k] || (terukur ? '' : 'belum terukur'))}">${DIMENSI_LABEL[k]}: ${terukur ? v : 'belum terukur'}</span>`;
  }).join(' ');
}

function bagianAkademik(m) {
  const komponen = m.detail_komponen || {};
  const selKomponen = (c, jumlahKey = 'jumlah') => (
    c && Number.isFinite(c.total)
      ? `${fmt(c.total)} <span class="rp-muted">(${c[jumlahKey] ?? 0}×)</span>`
      : '<span class="rp-muted">belum ada</span>'
  );
  const rincianUjian = (komponen.ujian?.rincian || []).map((u) => (
    `<div class="rp-kecil rp-muted">${escapeHtml(u.tanggal)} · ${escapeHtml(u.paketJudul)} · ${fmt(u.nilai)} (${escapeHtml(u.dasar || 'persen')}${u.skala != null ? `, skala ${u.skala}` : ''})</div>`
  )).join('');
  const predikat = m.predikat || {};
  const redistribusi = Array.isArray(m.komponen_dipakai) && m.komponen_dipakai.length < 3;
  return `
<tr>
  <td><b>${escapeHtml(m.mapel)}</b>${m.statusData === 'belum-cukup' ? ' <span class="rp-warn rp-kecil">· data belum cukup</span>' : ''}</td>
  <td>${selKomponen(komponen.kuis)}</td>
  <td>${selKomponen(komponen.tugas)}</td>
  <td>${selKomponen(komponen.ujian)}${rincianUjian}</td>
  <td style="text-align:center"><b style="font-size:13px">${fmt(m.nilai_akhir)}</b></td>
  <td style="text-align:center;color:${warnaPredikatHuruf(predikat.huruf)};font-weight:800">${escapeHtml(predikat.huruf || '—')}</td>
</tr>
<tr>
  <td colspan="6" class="rp-kecil">
    <span class="rp-muted">Bobot efektif: ${escapeHtml(m.mode_perhitungan || '—')}</span>
    ${redistribusi ? ' <span class="rp-warn">· komponen kosong TIDAK dinolkan — bobot diredistribusi</span>' : ''}
    <div style="margin-top:3px">${barisDimensi(m.detail_dimensi, m.dimensi_sumber)}</div>
    ${(m.catatan || []).map((c) => `<div class="rp-warn rp-kecil">• ${escapeHtml(c)}</div>`).join('')}
  </td>
</tr>`;
}

function bagianProses(p) {
  const dp = p.detail_proses || {};
  const kh = dp.kehadiran || {};
  const tt = dp.tugas || {};
  const lh = dp.latihan || {};
  const kw = dp.ketepatanWaktu || {};
  const ig = dp.integritas || {};
  const komponenTakTerukur = [
    kh.skor === null || kh.skor === undefined ? 'kehadiran' : null,
    tt.terukur === false ? 'tugas' : null,
    lh.terukur === false ? 'latihan' : null,
  ].filter(Boolean);
  const kartu = (judul, isi, gaya = '') => `<div class="rp-kartu" style="${gaya}"><b>${judul}</b><div>${isi}</div></div>`;
  const kehadiranIsi = kh.total
    ? `${kh.hadir}/${kh.total} hadir (${fmt(kh.persenHadir)}%) · ${kh.sakit ?? 0} sakit · ${kh.izin ?? 0} izin · ${kh.alpha ?? 0} alpha<br/>skor adil: <b>${fmt(kh.skor)}</b>${kh.skor === null || kh.skor === undefined ? ' <span class="rp-warn">(belum diskor)</span>' : ''}`
      : '<span class="rp-muted">belum ada catatan absensi</span>';
  const integritasIsi = `${escapeHtml(ig.catatan || '—')}`
    + (ig.pelanggaran || []).map((v) => `<div class="rp-kecil rp-warn">${escapeHtml(v.tanggal)} · ${escapeHtml(v.jenis)} · ${escapeHtml(v.asal || '')}${v.paketJudul ? ` — ${escapeHtml(v.paketJudul)}` : ''}</div>`).join('');
  return `
<div class="rp-ringkas">
  <div class="rp-angka">
    <div class="besar" style="color:${warnaPredikatHuruf(p.predikat?.huruf)}">${fmt(p.nilai_akhir)}</div>
    <div class="kecil">NILAI PROSES & KARAKTER${p.predikat?.huruf && p.predikat.huruf !== '—' ? ` · ${escapeHtml(p.predikat.huruf)} (${escapeHtml(p.predikat.label || '')})` : ''}</div>
    <div class="kecil rp-muted">${escapeHtml(p.mode_perhitungan || '')}</div>
  </div>
</div>
<div class="rp-kartu-grid">
  ${kartu('Kehadiran', kehadiranIsi + (kh.alasan ? `<div class="rp-warn rp-kecil">${escapeHtml(kh.alasan)}</div>` : ''))}
  ${kartu('Tugas', tt.terukur === false
    ? `${tt.terkumpul ?? 0} dikumpulkan${tt.dinilai !== undefined ? ` · ${tt.dinilai} dinilai guru` : ''}<div class="rp-warn rp-kecil">${escapeHtml(tt.alasan || 'rasio terbit belum terukur (v1)')}</div>`
    : `skor ${fmt(tt.skor)} (${tt.terkumpul}/${tt.terbit})`)}
  ${kartu('Latihan mandiri', `${lh.hariAktif ?? 0}/${lh.targetHari ?? '—'} hari aktif · ${lh.soalDikerjakan ?? 0}/${lh.targetSoal ?? '—'} soal · ${lh.totalJawaban ?? 0} jawaban<br/>skor: <b>${fmt(lh.skor)}</b>`)}
  ${kartu('Ketepatan waktu', `<span class="rp-muted">belum terukur (v1)</span><div class="rp-kecil rp-muted">${escapeHtml(kw.alasan || '')}</div>`)}
  ${kartu('Integritas ujian', integritasIsi, (ig.jumlahPelanggaran || 0) > 0 ? 'border-color:#fde68a;background:#fffbeb;' : '')}
  ${dp.xp ? kartu('XP', `${dp.xp.xp ?? 0} total · ${dp.xp.xpMingguIni ?? 0} minggu ini <span class="rp-muted">(snapshot saat dihitung)</span>`) : ''}
</div>
${komponenTakTerukur.length ? `<div class="rp-warn rp-kecil" style="margin-top:4px">Bobot diredistribusi — komponen belum terukur: ${escapeHtml(komponenTakTerukur.join(', '))}. Tidak ada komponen yang dinolkan.</div>` : ''}`;
}

function bagianPerkembangan(p) {
  const trenSkala = p.trenSkala || [];
  const trenHarian = p.trenHarian || [];
  const petaTopik = p.petaTopik || [];
  const rekomendasi = p.rekomendasi || [];
  const spark = svgSparkline(trenHarian, { lebar: 460, tinggi: 46 });
  const CAP_TABEL_HARIAN = 40;
  const harianDitampil = trenHarian.slice(-CAP_TABEL_HARIAN);
  const dimensiGlobal = p.dimensi_global || {};
  const dimensiSumber = p.dimensi_global_sumber || {};
  return `
<h3>Tren try out (skala nasional)</h3>
${trenSkala.length ? `<table>
<thead><tr><th>Tanggal</th><th>Try out</th><th>Mode</th><th>Skala</th><th>Nilai/100</th><th>Per subtes</th></tr></thead>
<tbody>${trenSkala.map((t) => `<tr>
  <td>${escapeHtml(t.tanggal)}</td>
  <td>${escapeHtml(t.paketJudul)}</td>
  <td>${escapeHtml(t.mode || '')}${t.skalaMode ? ` (${escapeHtml(t.skalaMode)})` : ''}</td>
  <td><b>${fmt(t.skalaTotal)}</b></td>
  <td>${fmt1(t.nilai100)}</td>
  <td class="rp-kecil">${(t.perSubtes || []).map((s) => `${escapeHtml(s.kode)}: ${s.skala ?? '—'}`).join(' · ')}</td>
</tr>`).join('')}</tbody></table>` : '<div class="rp-muted rp-kecil">Belum ada try out berskala nasional pada periode ini.</div>'}

<h3>Catatan tren harian</h3>
${spark || '<div class="rp-muted rp-kecil">Belum ada minimal 2 aktivitas berskor untuk digambar.</div>'}
${trenHarian.length ? `<table class="rp-kecil">
<tbody>${harianDitampil.map((t) => `<tr>
  <td style="width:80px">${escapeHtml(t.tanggal)}</td>
  <td style="width:52px">${escapeHtml(t.jenis)}</td>
  <td>${escapeHtml(t.label)}</td>
  <td style="width:52px;text-align:right">${t.skor === null || t.skor === undefined ? '—' : escapeHtml(t.skor)}</td>
</tr>`).join('')}</tbody></table>
${trenHarian.length > CAP_TABEL_HARIAN ? `<div class="rp-muted rp-kecil">Menampilkan ${CAP_TABEL_HARIAN} entri terakhir dari ${trenHarian.length} (snapshot memuat semuanya).</div>` : ''}` : '<div class="rp-muted rp-kecil">Belum ada aktivitas tercatat pada periode ini.</div>'}

<h3>Peta topik (merah = perlu perhatian)</h3>
${petaTopik.length
    ? `<div>${petaTopik.map((t) => {
      const w = warnaStatusTopik(t.status);
      return `<span class="rp-chip" style="border-color:${w};color:${w}" title="${escapeHtml(t.alasan || '')} · sumber: ${escapeHtml((t.sumber || []).join('+'))}">${escapeHtml(t.mapelNama || t.mapelKode || '')}: ${escapeHtml(t.topik)} · ${fmt(t.akurasi)}% (${fmt(t.dicoba)})</span>`;
    }).join('')}</div>`
    : '<div class="rp-muted rp-kecil">Belum cukup bukti untuk memetakan topik.</div>'}
${rekomendasi.length ? `<div class="rp-bad rp-kecil" style="margin-top:6px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:6px 10px"><b>Rekomendasi penguatan:</b><ul style="margin:4px 0 0;padding-left:18px">${rekomendasi.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul></div>` : ''}

<h3>Dimensi global (proksi otomatis dari log)</h3>
<table class="rp-kecil"><tbody>
${DIMENSI_KEYS.map((k) => {
    const v = dimensiGlobal[k];
    return `<tr><td style="width:130px"><b>${DIMENSI_LABEL[k]}</b></td><td style="width:90px;font-weight:700">${Number.isFinite(v) ? v : '<span class="rp-muted">belum terukur</span>'}</td><td class="rp-muted">${escapeHtml(dimensiSumber[k] || '')}</td></tr>`;
  }).join('')}
</tbody></table>`;
}

/** HTML satu raport siswa (tanpa <style> — pemanggil menyatukan lewat
 * htmlRaportSiswa/htmlRaportMassal agar CSS tidak dobel saat massal). */
function bagianSiswa(m, { kodeCetak = '' } = {}) {
  const idn = m.identitas;
  const jejak = m.jejak || {};
  const jumlahSumber = jejak.jumlahDokumenSumber || null;
  const capOtomatis = 'Dihitung otomatis dari log aktivitas (kuis · try out · latihan harian · absensi · tugas)'
    + (m.terkunci ? ' · snapshot TERKUNCI' : '');
  return `
<div class="rp">
  <div class="rp-kop">
    <img src="${WATERMARK.logo}" alt="" />
    <div>
      <h1>${escapeHtml(idn.namaBimbel)} — RAPOR PERKEMBANGAN BELAJAR</h1>
      <div class="rp-sub">Periode <b>${escapeHtml(labelPeriodeManusiawi(m.periode))}</b>${kodeCetak ? ` · kode cetak ${escapeHtml(kodeCetak)}` : ''}</div>
      <span class="rp-cap">🤖 ${capOtomatis}${m.versiMesin ? ` · mesin ${escapeHtml(m.versiMesin)}` : ''}</span>
    </div>
  </div>

  <table class="rp-kecil">
    <tr>
      <th style="width:110px">Nama siswa</th><td><b>${escapeHtml(idn.nama)}</b></td>
      <th style="width:110px">ID siswa</th><td>${escapeHtml(idn.studentId)}</td>
    </tr>
    <tr>
      <th>Kelas</th><td>${escapeHtml(idn.kelas)}${idn.jenjang ? ` · ${escapeHtml(idn.jenjang)}` : ''}</td>
      <th>Program</th><td>${escapeHtml(idn.program || '—')}</td>
    </tr>
    <tr>
      <th>Dihitung pada</th><td>${escapeHtml(fmtTglPanjang(jejak.dihitungPada))}</td>
      <th>Dicetak pada</th><td>${escapeHtml(fmtTglPanjang(new Date().toISOString()))}</td>
    </tr>
  </table>

  <div class="rp-ringkas">
    <div class="rp-angka">
      <div class="besar" style="color:${warnaPredikatHuruf(m.ringkasan.predikatAkademik.huruf)}">${fmt(m.ringkasan.rataRataAkademik)}</div>
      <div class="kecil">RATA-RATA AKADEMIK · ${escapeHtml(m.ringkasan.predikatAkademik.huruf)} (${escapeHtml(m.ringkasan.predikatAkademik.label || '')})</div>
    </div>
    <div class="rp-angka">
      <div class="besar" style="color:${warnaPredikatHuruf(m.ringkasan.predikatProses.huruf)}">${fmt(m.ringkasan.nilaiProses)}</div>
      <div class="kecil">NILAI PROSES & KARAKTER · ${escapeHtml(m.ringkasan.predikatProses.huruf)} (${escapeHtml(m.ringkasan.predikatProses.label || '')})</div>
    </div>
  </div>
  <div class="rp-kecil rp-muted" style="margin:-4px 0 6px">Dua nilai terpisah sesuai keputusan owner: capaian akademik dan proses/karakter TIDAK digabung menjadi satu angka.</div>

  <h2>BLOK A — CAPAIAN AKADEMIK PER MAPEL</h2>
  ${m.akademik.length ? `<table>
    <thead><tr><th>Mapel</th><th style="width:90px">Kuis</th><th style="width:90px">Tugas</th><th style="width:150px">Ujian / try out</th><th style="width:56px">Nilai</th><th style="width:44px">Pred.</th></tr></thead>
    <tbody>${m.akademik.map(bagianAkademik).join('')}</tbody>
  </table>` : '<div class="rp-muted rp-kecil">Tidak ada aktivitas akademik terdeteksi pada periode ini.</div>'}

  <h2>BLOK B — PROSES & KARAKTER</h2>
  ${m.proses ? bagianProses(m.proses) : '<div class="rp-muted rp-kecil">Dokumen blok proses tidak ditemukan untuk periode ini (belum diterbitkan).</div>'}

  <h2>BLOK C — PERKEMBANGAN & PETA TOPIK</h2>
  ${m.proses ? bagianPerkembangan(m.proses) : '<div class="rp-muted rp-kecil">Tren & peta topik tersedia setelah blok proses diterbitkan.</div>'}

  <h2>CATATAN GURU (opsional)</h2>
  <div class="rp-catatan">${m.catatanGuru ? escapeHtml(m.catatanGuru) : '<span class="rp-muted">(belum diisi — bagian ini opsional dan tidak memengaruhi angka otomatis)</span>'}</div>

  ${m.proses?.narasi ? `<div class="rp-kecil" style="margin-top:8px;background:#f8fafc;border-left:4px solid #6d28d9;padding:8px 10px;border-radius:0 6px 6px 0">${escapeHtml(m.proses.narasi)}</div>` : ''}

  <div class="rp-ttd">
    <div>Hormat kami,<br/><br/><br/>Tentor Pendamping</div>
    <div>Orang Tua/Wali,<br/><br/><br/>(...........................)</div>
  </div>

  <div class="rp-footer">
    ${escapeHtml(jejak.keterangan || '')}
    ${jumlahSumber ? `<br/>Dokumen sumber yang dipindai: kuis ${jumlahSumber.kuis ?? 0} · sesi TO ${jumlahSumber.sesi ?? 0} · absensi ${jumlahSumber.absensi ?? 0} · tugas ${jumlahSumber.tugas ?? 0} · latihan ${jumlahSumber.latihan ?? 0}.` : ''}
    ${m.versiMesin ? ` Mesin ${escapeHtml(m.versiMesin)}.` : ''} Angka pada dokumen ini tertelusur ke log aktivitas dan tidak berubah setelah diterbitkan.
  </div>
</div>`;
}

/** Judul dokumen cetak (masuk <title> dialog print → nama file PDF). */
export function judulCetakRaport({ nama = '', periode = '' } = {}) {
  return `Rapot ${String(nama || 'Siswa')} — ${labelPeriodeManusiawi(periode)}`;
}

/** HTML lengkap SATU siswa, siap disodorkan ke cetakLewatIframe. */
export function htmlRaportSiswa(opts = {}) {
  const m = siapkanModelRaport(opts);
  const kode = `GM-RPT-${Date.now().toString(36).toUpperCase()}`;
  return `<style>${cssRaport()}</style><div class="rp-wm"></div>${bagianSiswa(m, { kodeCetak: kode })}`;
}

/** HTML KUMPULAN raport (cetak massal per jenjang/kelas): halaman sampul +
 * satu raport per siswa, masing-masing mulai di halaman baru.
 * @param {{daftar:Array<{dokAkademik,dokProses,catatanGuru?}>, judul?:string, periodeLabel?:string}} opts */
export function htmlRaportMassal({ daftar = [], judul = '', periodeLabel = '' } = {}) {
  const models = (Array.isArray(daftar) ? daftar : [])
    .map((d) => siapkanModelRaport(d))
    .filter((m) => m.identitas.nama !== '—');
  const barisSampul = models.map((m, i) => `<tr>
    <td>${i + 1}</td>
    <td><b>${escapeHtml(m.identitas.nama)}</b></td>
    <td>${escapeHtml(m.identitas.kelas)}</td>
    <td style="text-align:center">${fmt(m.ringkasan.rataRataAkademik)}</td>
    <td style="text-align:center;color:${warnaPredikatHuruf(m.ringkasan.predikatAkademik.huruf)};font-weight:700">${escapeHtml(m.ringkasan.predikatAkademik.huruf)}</td>
    <td style="text-align:center">${fmt(m.ringkasan.nilaiProses)}</td>
    <td style="text-align:center;color:${warnaPredikatHuruf(m.ringkasan.predikatProses.huruf)};font-weight:700">${escapeHtml(m.ringkasan.predikatProses.huruf)}</td>
    <td style="text-align:center">${m.proses?.kelayakan ? `${m.proses.kelayakan.mapelLayak}/${m.proses.kelayakan.mapelTotal}` : '—'}</td>
  </tr>`).join('');
  const sampul = `
<div class="rp">
  <div class="rp-kop">
    <img src="${WATERMARK.logo}" alt="" />
    <div>
      <h1>${escapeHtml(judul || 'Kumpulan Rapor Perkembangan Belajar')}</h1>
      <div class="rp-sub">Periode <b>${escapeHtml(labelPeriodeManusiawi(periodeLabel))}</b> · ${models.length} siswa · dicetak ${escapeHtml(fmtTglPanjang(new Date().toISOString()))}</div>
      <span class="rp-cap">🤖 Dihitung otomatis dari log aktivitas · snapshot terkunci</span>
    </div>
  </div>
  <table class="rp-kecil">
    <thead><tr><th>No</th><th>Nama</th><th>Kelas</th><th>Akademik</th><th>Pred.</th><th>Proses</th><th>Pred.</th><th>Mapel layak</th></tr></thead>
    <tbody>${barisSampul || '<tr><td colspan="8" class="rp-muted">Tidak ada siswa untuk dicetak.</td></tr>'}</tbody>
  </table>
  <div class="rp-muted rp-kecil">Catatan guru tidak disertakan pada cetak massal (opsional per siswa lewat cetak tunggal). Nilai akademik dan proses/karakter adalah dua angka terpisah sesuai keputusan owner.</div>
</div>`;
  const halaman = models.map((m, i) => (
    `<div${i > 0 ? ' class="rp-hal"' : ' style="page-break-before:always"'}>${bagianSiswa(m)}</div>`
  )).join('');
  return `<style>${cssRaport()}</style><div class="rp-wm"></div>${sampul}${halaman}`;
}

export default {
  escapeHtml, labelPeriodeManusiawi, dataDok, kelompokDokOtomatis,
  poinSparkline, svgSparkline, warnaPredikatHuruf, warnaStatusTopik,
  DIMENSI_LABEL, DIMENSI_KEYS,
  siapkanModelRaport, cssRaport, judulCetakRaport,
  htmlRaportSiswa, htmlRaportMassal,
};
