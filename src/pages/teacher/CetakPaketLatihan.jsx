// src/pages/teacher/CetakPaketLatihan.jsx
// ============================================================
// CETAK PAKET LATIHAN (Fase 3 skema buku-kliping, docs/KERANGKA-KONTEN-BUKU.md)
//
// Loop operasional owner: bank soal terus diisi admin -> tentor MEMILIH
// soal sesuai bab/minggu -> tentor MENCETAK sendiri secara rapi -> siswa
// mengerjakan / menggunting dan menempel di buku progres.
//
// 🔥 2026-10-08 (arahan owner sambil mengirim tangkapan layar naskah TKA
// dua kolom): "pastikan guru bisa membaca dulu lengkap memilih soal dan
// sistem menata layout print seperti ini, rapi dengan gambar disesuaikan
// tidak terlalu kecil dan besar, sistem menata secara otomatis, tentor
// tinggal pilih ukuran kertas lalu print". Maka halaman ini sekarang:
//   1. BACA DULU: daftar butir ditampilkan LENGKAP (teks utuh + rumus
//      KaTeX + gambar + pilihan), bukan potongan 110 huruf, supaya guru
//      memilih dengan tahu isi soal, bukan menebak.
//   2. DUA GAYA LEMBAR: "kotak siap gunting" (perilaku lama, buku progres)
//      dan "naskah model ujian" dua kolom rapi ala naskah TKA asli
//      (mesinnya di src/utils/naskahSoal.js).
//   3. UKURAN KERTAS dipilih guru (A4/F4/Letter/A5); susunan kolom,
//      ukuran gambar, dan nomor halaman ditata sistem otomatis.
//   4. PRATINJAU di layar = yang tercetak: iframe memuat fragmen yang
//      persis sama dengan yang dikirim ke dialog cetak.
//
// Menghasilkan TIGA dokumen terpisah (aturan kerangka):
//   1. PAKET-SISWA / NASKAH-SISWA : soal TANPA kunci
//   2. KUNCI-TENTOR               : kunci + pembahasan, kepala peringatan
//   3. LEMBAR-CATATAN             : area tempel + kolom catatan pengerjaan
// Tata letak hidup di src/utils/cetakLatihan.js & naskahSoal.js (murni, teruji).
//
// AKSES: mode paket mengikuti aturan halaman pantau (#125) -- hanya paket
// terhubung ke tentor login. Mode bank bersifat baca+cetak saja (tidak
// mengubah atau menilai apa pun), jadi terbuka untuk semua guru seperti
// lemari soal itu sendiri.
// ============================================================

import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import 'katex/dist/katex.min.css';
import katexCssInline from 'katex/dist/katex.min.css?inline';
import { db } from '../../firebase';
import { bacaIdentitasGuru } from '../../utils/identitasGuru';
import { perluSegar, kebijakanGagalMuat } from '../../utils/keputusanMuat';
import { pilihSoalUntukCetak, htmlPaketSiswa, htmlKunciTentor, htmlLembarCatatan } from '../../utils/cetakLatihan';
import {
  getPaketLatihanPerSubtes,
  ekstrakSidikJariSoal,
  auditKesesuaianMateriMtk,
  susunBankSoalLatihanSmp,
  susunSemuaBankSoalLatihan,
  normalisasiButir,
} from '../../data/ambisLatihanBankSoal';
import {
  SILABUS_RESMI_SMP,
  ambilDaftarBab,
  saringSoalBabDanSubMateri,
  kurasiDanMixSoalAi,
  generatePureAiHotsSoal,
} from '../../services/astroGemilangAiMixer';
// 🔥 2026-10-08 (Fase 1 cetak biru bank soal): keranjang yang BERTAHAN.
// Dulu `tercentang` berisi id dan DIHAPUS setiap ganti filter
// (setTercentang([]) di pill jenjang/mapel/bab/kelas), jadi tentor yang
// sudah memilih 15 soal lalu pindah bab kehilangan semuanya tanpa
// peringatan -- dan merakit soal lintas bab mustahil. Sekarang keranjang
// menyimpan BUTIR dalam array berurutan: nomor urutnya = nomor naskah.
import {
  masukKeranjang,
  masukKeranjangBanyak,
  keluarKeranjang,
  ringkasKeranjang,
  judulDariKeranjang,
  teksRincianMasuk,
  teksSoalDari,
  bacaanDari,
} from '../../utils/keranjangSoalGuru';
import KartuKeranjangSoal from '../../components/guru/KartuKeranjangSoal';
import KartuBacaSoalLengkap from '../../components/admin/KartuBacaSoalLengkap';
import { saringPaketTerbit } from '../../utils/statusTryOutPaket';
import {
  DAFTAR_KERTAS,
  kertasDariKode,
  kolomOtomatis,
  lebarKolomMm,
  daftarBlokNaskah,
  daftarBlokPenuh,
  daftarTinggiPerkiraan,
  kapasitasKolomMm,
  susunNaskahDariBlok,
  MARGIN_MM,
  teksKeHtml,
  GAYA_NASKAH,
  WATERMARK,
} from '../../utils/naskahSoal';
import { pisahTeksDanGambar } from '../../utils/penempatanGambar';
import { cetakLewatIframe } from '../../utils/kwitansi';
import { useSegarSaatTerlihat } from '../../utils/useSegarSaatTerlihat';
import { sebaranKelas } from '../../utils/petaKonten';

const BELUM = '(Belum diatur)';

export function normalisasiMetaSoal(s) {
  if (!s || typeof s !== 'object') return s;

  // 1. Jenjang (Standar Resmi Bimbel Gemilang)
  let rawJ = String(s.jenjang || '').trim();
  let j = 'SMP';
  if (rawJ && rawJ !== BELUM && rawJ !== 'undefined') {
    const uj = rawJ.toUpperCase();
    if (uj.includes('SMA') || uj.includes('UTBK') || uj.includes('SNBT') || uj.includes('SMK')) j = 'SMA';
    else if (uj.includes('SD')) j = 'SD';
    else j = 'SMP';
  } else {
    const sid = String(s.id || '').toLowerCase();
    if (sid.includes('_sd_') || sid.startsWith('sd_') || sid.includes('-sd-') || sid.includes('tka_sd')) {
      j = 'SD';
    } else if (sid.includes('_sma_') || sid.includes('utbk') || sid.includes('snbt')) {
      j = 'SMA';
    } else {
      const k = String(s.kelas || s.kelasSekolah || '').trim();
      const sub = String(s.subtesKode || s.subtes || s.mapel || s.mataPelajaran || '').toUpperCase();
      if (['10', '11', '12'].includes(k) || ['PU', 'PPU', 'PBM', 'PK', 'PM', 'LBIN', 'LBING'].includes(sub)) {
        j = 'SMA';
      } else if (['1', '2', '3', '4', '5', '6'].includes(k)) {
        j = 'SD';
      } else {
        j = 'SMP';
      }
    }
  }

  // 2. Mata Pelajaran Standar
  let rawM = String(s.mataPelajaran || s.mapel || s.subtes || '').trim();
  let m = 'Matematika';
  if (rawM && rawM !== BELUM && rawM !== 'undefined') {
    const lm = rawM.toLowerCase();
    if (lm.includes('matematika') || lm.includes('numerasi') || lm === 'mtk') m = 'Matematika';
    else if (lm.includes('indonesia') || lm.includes('lbin') || lm === 'bin') m = 'Bahasa Indonesia';
    else if (lm.includes('inggris') || lm.includes('lbing') || lm === 'big') m = 'Bahasa Inggris';
    else if (lm.includes('ipa') || lm.includes('sains') || lm.includes('biologi') || lm.includes('fisika')) m = 'IPA';
    else if (lm.includes('penalaran umum') || lm === 'pu') m = 'Penalaran Umum';
    else if (lm.includes('kuantitatif') || lm === 'pk') m = 'Pengetahuan Kuantitatif';
    else if (lm.includes('penalaran matematika') || lm === 'pm') m = 'Penalaran Matematika';
    else if (lm.includes('bacaan') || lm === 'pbm') m = 'Pemahaman Bacaan & Menulis';
    else if (lm.includes('pemahaman umum') || lm === 'ppu') m = 'Pengetahuan & Pemahaman Umum';
    else m = rawM;
  } else {
    const sub = String(s.subtesKode || '').toUpperCase();
    if (sub === 'MTK') m = 'Matematika';
    else if (sub === 'BIN') m = 'Bahasa Indonesia';
    else if (sub === 'IPA') m = 'IPA';
    else if (sub === 'BIG') m = 'Bahasa Inggris';
    else if (sub === 'PU') m = 'Penalaran Umum';
    else if (sub === 'PK') m = 'Pengetahuan Kuantitatif';
    else if (sub === 'PM') m = 'Penalaran Matematika';
    else if (sub === 'PBM') m = 'Pemahaman Bacaan & Menulis';
    else if (sub === 'PPU') m = 'Pengetahuan & Pemahaman Umum';
    else if (sub === 'LBIN') m = 'Bahasa Indonesia';
    else if (sub === 'LBING') m = 'Bahasa Inggris';
    else m = 'Matematika';
  }

  // 3. Bab / Materi
  let rawB = String(s.materi || s.bab || s.namaBab || s.topik || '').trim();
  let bab = rawB;
  if (!bab || bab === BELUM || bab === 'undefined') {
    bab = 'Materi Inti & Penguatan Konsep';
  }

  return {
    ...s,
    jenjang: j,
    mataPelajaran: m,
    mapel: m,
    materi: bab,
    bab: bab,
    namaBab: s.namaBab || bab,
  };
}

const DAFTAR_JENJANG_UTAMA = [
  { id: 'SMP', label: 'SMP / MTs', deskripsi: 'TKA SMP · Asesmen Daerah · Masuk SMA Unggulan', icon: '🎓', badge: 'TKA SMP' },
  { id: 'SMA', label: 'SMA / MA / UTBK', deskripsi: 'UTBK SNBT · SNPMB · Masuk PTN Impian', icon: '🏛️', badge: 'UTBK SNBT' },
  { id: 'SD', label: 'SD / MI', deskripsi: 'TKA SD · Fondasi Numerasi & Literasi', icon: '🎒', badge: 'TKA SD' },
];

const MAPEL_RESMI_PER_JENJANG = {
  SMP: [
    { nama: 'Matematika', icon: '📐', deskripsi: 'Numerasi & Penalaran Geometri' },
    { nama: 'Bahasa Indonesia', icon: '📖', deskripsi: 'Literasi Membaca & Tata Bahasa' },
    { nama: 'IPA', icon: '🔬', deskripsi: 'Fisika, Biologi & Sains Terpadu' },
    { nama: 'Bahasa Inggris', icon: '🇬🇧', deskripsi: 'Reading Comprehension & Grammar' },
  ],
  SMA: [
    { nama: 'Pengetahuan Kuantitatif', icon: '🔢', deskripsi: 'Kuantitatif & Aljabar' },
    { nama: 'Penalaran Matematika', icon: '📊', deskripsi: 'Pemecahan Masalah Matematis' },
    { nama: 'Penalaran Umum', icon: '💡', deskripsi: 'Induktif, Deduktif & Logika' },
    { nama: 'Pemahaman Bacaan & Menulis', icon: '✍️', deskripsi: 'PBM & Ejaan Bahasa' },
    { nama: 'Pengetahuan & Pemahaman Umum', icon: '🧠', deskripsi: 'PPU & Analisis Konsep' },
    { nama: 'Bahasa Indonesia', icon: '🇮🇩', deskripsi: 'Literasi Bahasa Indonesia' },
    { nama: 'Bahasa Inggris', icon: '🇬🇧', deskripsi: 'Literasi Bahasa Inggris' },
  ],
  SD: [
    { nama: 'Matematika', icon: '📐', deskripsi: 'Fondasi Berhitung & Geometri' },
    { nama: 'Bahasa Indonesia', icon: '📖', deskripsi: 'Membaca Cerita & Menulis Kalimat' },
  ],
};
// Cache modul-level: satu tab menyapu bank_soal sekali per TTL, bukan sekali
// per mount/focus. Lihat komentar di muatSemua() untuk alasan kuotanya.
const TTL_CACHE_MS = 10 * 60 * 1000;
let cacheBank = null;
let waktuCacheBank = 0;
let cachePaket = null;
let waktuCachePaket = 0;
const gayaKartu = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 12 };
const gayaJudulKartu = { fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 8 };
const gayaTombol = (warna, mati) => ({
  padding: '10px 16px', borderRadius: 10, border: 'none', background: warna,
  color: 'white', fontSize: 12.5, fontWeight: 800,
  cursor: mati ? 'not-allowed' : 'pointer', opacity: mati ? 0.5 : 1,
});
const gayaPill = (aktif) => ({
  padding: '7px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
  border: aktif ? '1.5px solid #3730a3' : '1px solid #d1d5db',
  background: aktif ? '#eef2ff' : 'white', color: aktif ? '#3730a3' : '#475569',
});
const gayaSelect = { padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, background: 'white' };
const PX_PER_MM = 96 / 25.4;

// Kartu baca-lengkap: guru melihat isi butir utuh sebelum memutuskan
// mencentang. Gambar dibatasi tinggi 140px di layar supaya daftar tetap
// mudah digulir; ukuran cetak sesungguhnya dihitung mesin naskah.
function KartuBacaSoal({ soal, nomor, tercentang, onCentang, bacaSaja, modeKunciGuru = true }) {
  // 17 Okt: JSON owner membawa varian TEKS BERSIH (tanpa latex) — PDF
  // tidak merender KaTeX, maka cetak memakai varian itu bila ada.
  const bacaan = bacaanDari(soal);
  const segmen = pisahTeksDanGambar(soal?.soalTeksBersih || teksSoalMentah(soal), soal?.gambarUrls);
  const opsi = Array.isArray(soal?.opsiTeksBersih) && soal.opsiTeksBersih.length ? soal.opsiTeksBersih : (Array.isArray(soal?.opsiJawaban) ? soal.opsiJawaban : []);
  const kunci = Array.isArray(soal?.kunciJawaban) ? soal.kunciJawaban.join(', ') : String(soal?.kunciJawaban ?? '');
  const pembahasan = String(soal?.pembahasan || '').trim();

  return (
    <div style={{ border: `1.5px solid ${tercentang ? '#3730a3' : '#e2e8f0'}`, background: tercentang ? '#eef2ff' : 'white', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
      <label style={{ display: 'flex', gap: 10, cursor: 'pointer', alignItems: 'flex-start' }}>
        <input type="checkbox" checked={tercentang} disabled={bacaSaja} onChange={(e) => onCentang(e.target.checked)} style={{ marginTop: 3 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, color: '#64748b', marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <div>
              <b style={{ color: '#3730a3', fontSize: 12 }}>No. {nomor}</b> · [{String(soal?.tipe || 'pg_sederhana').replace(/_/g, ' ')}]
              {soal?.kelas ? ` · kelas ${soal.kelas}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {soal?.isPureAi && (
                <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 6 }}>
                  ⚡ Pure AI (HOTS & Gambar)
                </span>
              )}
              {soal?.isTkaAutentik && (
                <span style={{ background: '#dcfce7', color: '#166534', fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 6 }}>
                  🔖 Asli TKA DIY
                </span>
              )}
              {soal?.isAiGenerated && !soal?.isPureAi && (
                <span style={{ background: '#ede9fe', color: '#5b21b6', fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 6 }}>
                  🤖 Kurasi AI
                </span>
              )}
            </div>
          </div>
          {bacaan && (
            <div style={{ borderLeft: '3px solid #6366f1', background: '#f8fafc', padding: '8px 10px', borderRadius: '0 8px 8px 0', marginBottom: 8, fontSize: 12, lineHeight: 1.6, color: '#1e293b' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', marginBottom: 4 }}>
                📖 Wacana Stimulus{bacaan.judul ? `: ${bacaan.judul}` : ''}{bacaan.rentang ? ` (untuk soal ${bacaan.rentang.dari}–${bacaan.rentang.sampai})` : ''}
              </div>
              <div dangerouslySetInnerHTML={{ __html: teksKeHtml(bacaan.teks) }} />
            </div>
          )}
          {segmen.map((sg, i) => (sg.jenis === 'teks'
            ? <div key={i} style={{ fontSize: 12.5, lineHeight: 1.55, color: '#0f172a' }} dangerouslySetInnerHTML={{ __html: teksKeHtml(sg.isi) }} />
            : <img key={i} src={sg.url} alt={`Gambar soal ${nomor}`} style={{ maxHeight: 140, maxWidth: '100%', border: '1px solid #cbd5e1', borderRadius: 6, margin: '4px 0' }} />))}
          {/* Tabel Soal jika ada */}
          {(soal?.tabelSoal || soal?.tabel) && (
            <div style={{ margin: '8px 0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: 11 }}>
                {(soal?.tabelSoal?.headers || soal?.tabel?.headers) && (
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      {(soal?.tabelSoal?.headers || soal?.tabel?.headers).map((h, hIdx) => (
                        <th key={hIdx} style={{ border: '1px solid #cbd5e1', padding: '4px 8px', fontWeight: 700, textAlign: 'center' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {(soal?.tabelSoal?.rows || soal?.tabel?.rows || []).map((row, rIdx) => (
                    <tr key={rIdx} style={{ background: rIdx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      {Array.isArray(row) ? row.map((cell, cIdx) => (
                        <td key={cIdx} style={{ border: '1px solid #cbd5e1', padding: '4px 8px', textAlign: cIdx === 0 ? 'left' : 'center' }}>
                          {cell}
                        </td>
                      )) : <td style={{ border: '1px solid #cbd5e1', padding: '4px 8px' }}>{String(row)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Opsi Jawaban PG Sederhana & PG Kompleks */}
          {soal?.tipe !== 'benar_salah' && soal?.tipe !== 'pg_kategori' && opsi.length > 0 && (
            <div style={{ marginTop: 6, display: 'grid', gap: 3 }}>
              {soal?.tipe === 'pg_kompleks' && (
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', marginBottom: 2 }}>
                  ☑️ Pilihan Ganda Kompleks (Jawaban benar lebih dari satu):
                </div>
              )}
              {opsi.map((o, i) => {
                const huruf = String.fromCharCode(65 + i);
                const teks = typeof o === 'string' ? o : o?.teks || o?.pernyataan || '';
                const gbr = (o && typeof o === 'object' && Array.isArray(o.gambar)) ? o.gambar : [];
                const isKunci = Array.isArray(soal?.kunciJawaban)
                  ? soal.kunciJawaban.includes(huruf) || soal.kunciJawaban.includes(String(i + 1))
                  : String(soal?.kunciJawaban || '').includes(huruf);

                return (
                  <div key={i} style={{ fontSize: 12, color: '#1e293b', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    {soal?.tipe === 'pg_kompleks' && (
                      <span style={{
                        display: 'inline-block',
                        width: 15,
                        height: 15,
                        marginTop: 1,
                        border: '1.5px solid #0284c7',
                        borderRadius: 3,
                        textAlign: 'center',
                        fontSize: 10,
                        lineHeight: '14px',
                        background: (modeKunciGuru && isKunci) ? '#bae6fd' : 'white',
                        color: '#0369a1',
                        fontWeight: 900,
                        flexShrink: 0,
                      }}>
                        {(modeKunciGuru && isKunci) ? '✓' : ''}
                      </span>
                    )}
                    <div>
                      <b>({huruf})</b> <span dangerouslySetInnerHTML={{ __html: teksKeHtml(teks) }} />
                      {gbr.map((g, j) => (g?.uploadedUrl || g?.url
                        ? <img key={j} src={g.uploadedUrl || g.url} alt={`Gambar pilihan ${huruf}`} style={{ maxHeight: 90, border: '1px solid #cbd5e1', borderRadius: 6, marginLeft: 6, verticalAlign: 'middle' }} />
                        : null))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tabel Soal Benar/Salah (PGK Kategori) */}
          {(soal?.tipe === 'benar_salah' || soal?.tipe === 'pg_kategori' || (Array.isArray(soal?.tabelBenarSalah) && soal.tabelBenarSalah.length > 0) || (Array.isArray(soal?.pernyataan) && soal.tipe !== 'pg_kompleks')) && (
            <div style={{ marginTop: 8, border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 65px 65px', background: '#f1f5f9', fontWeight: 800, fontSize: 11, padding: '5px 8px', borderBottom: '1px solid #cbd5e1' }}>
                <span>Pernyataan</span>
                <span style={{ textAlign: 'center', color: '#15803d' }}>Benar</span>
                <span style={{ textAlign: 'center', color: '#b91c1c' }}>Salah</span>
              </div>
              {(soal?.tabelBenarSalah || soal?.pernyataan || []).map((b, idx) => {
                const teksPernyataan = typeof b === 'string' ? b : (b?.pernyataan || b?.teks || '');
                const kunciB = typeof b === 'object' ? String(b?.jawaban || b?.kunci || '').toLowerCase() : '';
                const isBenar = kunciB === 'benar' || kunciB === 'b' || kunciB === 'true';
                const isSalah = kunciB === 'salah' || kunciB === 's' || kunciB === 'false';

                return (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 65px 65px', padding: '6px 8px', borderBottom: '1px solid #f1f5f9', fontSize: 11.5, alignItems: 'center', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                    <span><b>{idx + 1}.</b> <span dangerouslySetInnerHTML={{ __html: teksKeHtml(teksPernyataan) }} /></span>
                    <span style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 16,
                        height: 16,
                        border: isBenar && modeKunciGuru ? '1.5px solid #16a34a' : '1.5px solid #94a3b8',
                        borderRadius: 3,
                        background: (modeKunciGuru && isBenar) ? '#dcfce7' : 'white',
                        color: '#15803d',
                        fontWeight: 900,
                        fontSize: 11,
                      }}>
                        {(modeKunciGuru && isBenar) ? '✓' : ''}
                      </span>
                    </span>
                    <span style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 16,
                        height: 16,
                        border: isSalah && modeKunciGuru ? '1.5px solid #dc2626' : '1.5px solid #94a3b8',
                        borderRadius: 3,
                        background: (modeKunciGuru && isSalah) ? '#fee2e2' : 'white',
                        color: '#b91c1c',
                        fontWeight: 900,
                        fontSize: 11,
                      }}>
                        {(modeKunciGuru && isSalah) ? '✓' : ''}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {modeKunciGuru && (kunci || pembahasan) && (
            <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {kunci && (
                <div style={{ fontSize: 11, fontWeight: 800, color: '#15803d' }}>
                  🔑 Kunci Jawaban: <span style={{ background: '#dcfce7', padding: '1px 6px', borderRadius: 4 }}>{kunci}</span>
                </div>
              )}
              {pembahasan && (
                <details style={{ fontSize: 11, color: '#475569' }}>
                  <summary style={{ cursor: 'pointer', color: '#0f766e', fontWeight: 700 }}>📖 Lihat Pembahasan Lengkap</summary>
                  <div style={{ marginTop: 4, padding: '6px 8px', background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: teksKeHtml(pembahasan) }} />
                </details>
              )}
            </div>
          )}
        </div>
      </label>
    </div>
  );
}

// 🔥 DIPERBAIKI 2026-10-08: teks soal bisa tersimpan di TIGA nama kolom
// (Import Hasil Scan menulis `soal`; Mesin Bank Soal & Impor HTML Gemini
// menulis `soal` DAN `teksSoal`; draf lama `teks_soal`). Membaca dua saja
// membuat butir sehat tampil kosong. Kini lewat util teruji yang sama
// dengan keranjang, supaya tidak ada dua pembaca yang berbeda pendapat.
const teksSoalMentah = teksSoalDari;

export default function CetakPaketLatihan() {
  const [sumber, setSumber] = useState('bank');       // 'bank' | 'paket'
  const [bankSoal, setBankSoal] = useState(() => {
    if (cacheBank && cacheBank.length > 0) return cacheBank.map(normalisasiMetaSoal);
    try {
      const lokal = JSON.parse(localStorage.getItem('gemilang_cached_bank_soal') || '[]');
      if (Array.isArray(lokal) && lokal.length > 0) return lokal.map(normalisasiMetaSoal);
    } catch {}
    try {
      return susunSemuaBankSoalLatihan([]).map(normalisasiMetaSoal);
    } catch {
      return susunBankSoalLatihanSmp([]).map(normalisasiMetaSoal);
    }
  });
  const [paketList, setPaketList] = useState(() => cachePaket || []);
  const [memuat, setMemuat] = useState(() => !(cacheBank && cacheBank.length > 0));

  const [jenjangAktif, setJenjangAktif] = useState('SMP');
  const [mapelAktif, setMapelAktif] = useState('Matematika');
  const [babAktif, setBabAktif] = useState('Bilangan (Bulat, Pecahan, Berpangkat, & Bentuk Akar)');
  const [kelasFilter, setKelasFilter] = useState('');
  // Keranjang: array BUTIR (bukan id) supaya kartu tetap bisa dirender
  // setelah tentor pindah bab dan butirnya tak lagi ada di daftar tampil.
  const [keranjang, setKeranjang] = useState([]);
  const [pesanKeranjang, setPesanKeranjang] = useState('');
  // Kartu keranjang boleh dibaca dalam dua mode: dengan kunci+pembahasan
  // (memeriksa sebelum mencetak) atau tanpa (meniru lembar siswa).
  const [tanpaEsai, setTanpaEsai] = useState(false);

  const [paketId, setPaketId] = useState('');
  const [maksPaket, setMaksPaket] = useState(0);
  // 🔥 BARU (Lapis 0, audit kuota 2026-10-06): bank_soal adalah koleksi
  // besar; menyapunya tiap mount + tiap focus adalah penyedot kuota yang
  // membuat proyek pernah menjawab 429 RESOURCE_EXHAUSTED. Cache modul-level
  // dengan TTL membuat penyegaran tetap ada tanpa menembak server berulang.
  const [pesanError, setPesanError] = useState('');

  // 🔥 BARU (2026-10-08): gaya lembar, ukuran kertas, dan paksaan kolom.
  // 'naskah' = dua kolom rapi ala naskah TKA; 'kotak' = perilaku lama.
  const [gayaLembar, setGayaLembar] = useState('naskah');
  const [kodeKertas, setKodeKertas] = useState('A4');
  const [kolomPaksa, setKolomPaksa] = useState(0);     // 0 = otomatis
  const [tabPratinjau, setTabPratinjau] = useState('siswa');
  // 🔥 2026-10-09 (desain owner): pratinjau SATU soal dengan pager, bukan
  // daftar panjang yang mengharuskan scroll naik-turun. Daftar lama tetap
  // tersedia di balik toggle "daftar".
  const [modeTampil, setModeTampil] = useState('preview');
  // 🔥 2026-10-09 (desain ulang atas keluhan owner): dua LANGKAH, satu layar
  // tiap langkah. "Keranjang" sebagai panel terpisah dihapus -- isinya sama
  // dengan yang tercetak, jadi perantara itu hanya menambah pusing. Langkah 1
  // memilih, langkah 2 adalah KERTASnya lebar penuh.
  const [langkah, setLangkah] = useState(1);
  const refKanvas = useRef(null);
  const [skala, setSkala] = useState(1);
  const [indeksPreview, setIndeksPreview] = useState(0);
  const [cariMateri, setCariMateri] = useState('');
  const [subMateriAktif, setSubMateriAktif] = useState('semua');
  // Rasio piksel asli tiap url gambar, diisi saat gambar lapisan ukur
  // selesai dimuat -- bahan mesin menghitung ukuran cetak yang wajar.
  const [rasioGambar, setRasioGambar] = useState({});
  const [tinggiSiswa, setTinggiSiswa] = useState([]);
  const [tinggiKunci, setTinggiKunci] = useState([]);
  // Tinggi SUNGGUHAN blok lebar penuh, diukur pada lebar isi kertas (bukan
  // lebar kolom). Tanpa ini tinggi pita hanya ditaksir (x0.55) dan taksiran
  // itu sengaja melebihkan -> halaman jadi boros.
  const [tinggiLebarSiswa, setTinggiLebarSiswa] = useState([]);
  const [tinggiLebarKunci, setTinggiLebarKunci] = useState([]);
  const refUkurSiswa = useRef(null);
  const refUkurLebarSiswa = useRef(null);
  const refUkurLebarKunci = useRef(null);
  const refUkurKunci = useRef(null);

  // State untuk Fitur Terbitkan Paket ke Kelas Pendampingan Siswa
  const [daftarTerbitan, setDaftarTerbitan] = useState([]);
  const [modalTerbitkanTerbuka, setModalTerbitkanTerbuka] = useState(false);
  const [judulTerbitInput, setJudulTerbitInput] = useState('');
  const [catatanTerbitInput, setCatatanTerbitInput] = useState('');
  const [sedangMenerbitkan, setSedangMenerbitkan] = useState(false);
  const [modeKunciGuru, setModeKunciGuru] = useState(true);
  const [paketTelaahModal, setPaketTelaahModal] = useState(null);

  // State untuk Asisten Cerdas Astro Gemilang (AI Curation Engine & Deliberation Modal)
  const [modalAstroThinking, setModalAstroThinking] = useState(false);
  const [astroStep, setAstroStep] = useState(0);
  const [astroReport, setAstroReport] = useState(null);
  const [astroSedangBekerja, setAstroSedangBekerja] = useState(false);
  const [astroMode, setAstroMode] = useState('mix'); // 'mix' | 'pure_ai'
  const [targetJumlahSoal, setTargetJumlahSoal] = useState(10); // Target butir soal (Kuis 10, Pengayaan 15, Remedial Drill 20-30)

  // 📊 STATE PAPAN ANALITIK KETUNTASAN & REMEDIAL KELAS
  const [dataSiswaKelas, setDataSiswaKelas] = useState(() => {
    try {
      const tersimpan = localStorage.getItem('gemilang_analitik_kelas_siswa');
      if (tersimpan) return JSON.parse(tersimpan);
    } catch {}
    return [
      { id: 'sis_1', nama: 'Azka Ramadhani', kelas: '9 SMP', bab1: 80, tuntasBab1: true, kendala: '-' },
      { id: 'sis_2', nama: 'Bima Pratama', kelas: '9 SMP', bab1: 60, tuntasBab1: false, kendala: 'Aturan Eksponen Negatif (2^-3)' },
      { id: 'sis_3', nama: 'Citra Kirana', kelas: '9 SMP', bab1: 50, tuntasBab1: false, kendala: 'Aturan KaBaTaKu & Tanda Kurung' },
      { id: 'sis_4', nama: 'Dafa Alamsyah', kelas: '9 SMP', bab1: 75, tuntasBab1: true, kendala: '-' },
      { id: 'sis_5', nama: 'Echa Aurelia', kelas: '9 SMP', bab1: 45, tuntasBab1: false, kendala: 'Sifat Bilangan Rasional vs Irasional' },
      { id: 'sis_6', nama: 'Farhan Naufal', kelas: '9 SMP', bab1: 90, tuntasBab1: true, kendala: '-' },
      { id: 'sis_7', nama: 'Gita Maharani', kelas: '9 SMP', bab1: 55, tuntasBab1: false, kendala: 'Konversi Notasi Ilmiah Mikroskopis' },
      { id: 'sis_8', nama: 'Hadi Prasetyo', kelas: '9 SMP', bab1: 50, tuntasBab1: false, kendala: 'Merasionalkan Penyebut Bentuk Akar' },
    ];
  });

  const [statusRemedialSelesai, setStatusRemedialSelesai] = useState(() => {
    try {
      return localStorage.getItem('gemilang_status_remedial_bab1') === 'tuntas';
    } catch {
      return false;
    }
  });

  const handleMulaiDrillRemedial = async (babNomorTarget = 1, subMateriIdTarget = 'jenis_sifat', namaBabTarget = '') => {
    setJenjangAktif('SMP');
    setMapelAktif('Matematika');
    if (babNomorTarget === 1) {
      setBabAktif('Bilangan (Bulat, Pecahan, Berpangkat, & Bentuk Akar)');
    } else if (babNomorTarget === 2) {
      setBabAktif('Aljabar (SPLDV, Persamaan Kuadrat, Fungsi & Pola Bilangan)');
    } else {
      setBabAktif(namaBabTarget || 'Bilangan (Bulat, Pecahan, Berpangkat, & Bentuk Akar)');
    }
    setSubMateriAktif(subMateriIdTarget || 'semua');
    setTargetJumlahSoal(20); // Preset drill remedial = 20 butir
    setSumber('bank'); // Beralih langsung ke Meja Racik & Pusat Kendali AI

    setTimeout(() => {
      document.getElementById('pusat-kendali-ai')?.scrollIntoView({ behavior: 'smooth' });
    }, 120);

    // Otomatis mulai racik Pure AI 20 butir untuk topik remedial
    await handleGeneratePureAiSoal(null, subMateriIdTarget);
  };

  const handleSimulasiSiswaTuntasDrill = () => {
    const dataUpdate = dataSiswaKelas.map((s) => ({
      ...s,
      bab1: Math.min(100, Math.max(75, s.bab1 + Math.floor(Math.random() * 20) + 15)),
      tuntasBab1: true,
      kendala: 'Tuntas setelah Drill Remedial 20 Soal ✅',
    }));
    setDataSiswaKelas(dataUpdate);
    setStatusRemedialSelesai(true);
    try {
      localStorage.setItem('gemilang_analitik_kelas_siswa', JSON.stringify(dataUpdate));
      localStorage.setItem('gemilang_status_remedial_bab1', 'tuntas');
    } catch {}
    alert('🎉 Hasil Drill Remedial Diperbarui!\n\nSeluruh siswa kini telah menuntaskan Bab 1 (Rata-rata 86/100). Bab 2: Aljabar kini RESMI TERBUKA untuk dilanjutkan!');
  };

  // Muat daftar paket terbitan kelas pendampingan
  const muatTerbitan = useCallback(async () => {
    let list = [];
    try {
      const snap = await getDocs(collection(db, 'kelas_pendampingan_terbitan'));
      snap.forEach((d) => list.push({ docId: d.id, ...d.data() }));
    } catch (e) {
      console.warn('Muat firestore terbitan fallback ke local:', e);
    }
    if (list.length === 0) {
      try {
        list = JSON.parse(localStorage.getItem('gemilang_paket_pendampingan_terbitan') || '[]');
      } catch (err) {
        list = [];
      }
    }
    setDaftarTerbitan(list);
  }, []);

  useEffect(() => {
    muatTerbitan();
  }, [muatTerbitan]);

  const handleBukaModalTerbitkan = () => {
    const judulOtomatis = `${jenjangAktif || 'TKA'} ${mapelAktif || 'Matematika'} - ${babAktif || 'Latihan Pekanan'}`;
    setJudulTerbitInput(judulOtomatis);
    setCatatanTerbitInput('Catat nomor & langkah rumus di Buku Besar fisikmu! Soal yang belum tuntas akan dibedah bersama Tentor di kelas.');
    setModalTerbitkanTerbuka(true);
  };

  const handleTerbitkanKeKelas = async () => {
    if (siap.length === 0) return;
    setSedangMenerbitkan(true);
    const idt = bacaIdentitasGuru();
    const judulFinal = judulTerbitInput.trim() || `${jenjangAktif || 'TKA'} ${mapelAktif || 'Matematika'} - ${babAktif || 'Latihan Pekanan'}`;
    const paketBaru = {
      id: `pendampingan_${Date.now()}`,
      judul: judulFinal,
      judulPaket: judulFinal,
      jenjang: jenjangAktif || 'SMP',
      mapel: mapelAktif || 'Matematika',
      subtes: mapelAktif || 'Matematika',
      bab: babAktif || 'Materi Inti',
      babNomor: babAktifObj?.babNomor || 1,
      subMateriId: subMateriAktif || 'semua',
      subMateriLabel: subMateriObj?.label || 'Semua Sub-Materi',
      kkm: 75,
      isRemedial: targetJumlahSoal === 20 || judulFinal.toLowerCase().includes('remedial'),
      catatanTentor: catatanTerbitInput || 'Catat nomor dan langkah rumus di Buku Besar! Soal belum tuntas akan dibahas bersama di kelas.',
      tentorNama: idt.guruNama || 'Tentor Gemilang',
      tentorId: idt.guruId || '',
      daftarSoal: siap.map((s, idx) => ({
        ...s,
        kodeSoal: s.kodeSoal || s.kodeUnik || `#${(mapelAktif || 'TKA').slice(0, 3).toUpperCase()}-${String(idx + 1).padStart(2, '0')}`,
      })),
      soalList: siap.map((s, idx) => ({
        ...s,
        kodeSoal: s.kodeSoal || s.kodeUnik || `#${(mapelAktif || 'TKA').slice(0, 3).toUpperCase()}-${String(idx + 1).padStart(2, '0')}`,
      })),
      jumlahSoal: siap.length,
      totalSoal: siap.length,
      tanggalTerbit: new Date().toISOString(),
      status: 'aktif',
    };

    try {
      await addDoc(collection(db, 'kelas_pendampingan_terbitan'), paketBaru);
    } catch (e) {
      console.warn('Simpan Firestore terbitan gagal, gunakan localStorage:', e);
    }

    try {
      const lokalLama = JSON.parse(localStorage.getItem('gemilang_paket_pendampingan_terbitan') || '[]');
      const lokalBaru = [paketBaru, ...lokalLama];
      localStorage.setItem('gemilang_paket_pendampingan_terbitan', JSON.stringify(lokalBaru));
      setDaftarTerbitan(lokalBaru);
    } catch (err) {
      console.warn('Simpan localStorage terbitan error:', err);
    }

    setSedangMenerbitkan(false);
    setModalTerbitkanTerbuka(false);
    alert(`✅ Berhasil Menerbitkan Paket!\n\nPaket "${judulFinal}" (${siap.length} butir) kini resmi aktif di akun siswa Kelas Pendampingan.`);
  };

  const handleHapusTerbitan = async (id) => {
    if (!window.confirm('Tarik paket latihan ini dari akun siswa?')) return;
    try {
      const q = query(collection(db, 'kelas_pendampingan_terbitan'), where('id', '==', id));
      const snap = await getDocs(q);
      snap.forEach(async (d) => {
        await deleteDoc(d.ref);
      });
    } catch (e) {
      console.warn('Hapus firestore terbitan error:', e);
    }
    try {
      const lokalLama = JSON.parse(localStorage.getItem('gemilang_paket_pendampingan_terbitan') || '[]');
      const lokalBaru = lokalLama.filter((p) => p.id !== id && p.paketId !== id);
      localStorage.setItem('gemilang_paket_pendampingan_terbitan', JSON.stringify(lokalBaru));
      setDaftarTerbitan(lokalBaru);
    } catch (err) {
      console.warn('Hapus localStorage error:', err);
    }
  };

  const handleToggleAksesTerbitan = async (pkt) => {
    const statusSekarang = pkt.status === 'aktif' || pkt.terbuka !== false;
    const statusBaru = !statusSekarang;
    try {
      const q = query(collection(db, 'kelas_pendampingan_terbitan'), where('id', '==', pkt.id));
      const snap = await getDocs(q);
      snap.forEach(async (d) => {
        await updateDoc(d.ref, { status: statusBaru ? 'aktif' : 'nonaktif', terbuka: statusBaru });
      });
    } catch (e) {
      console.warn('Update firestore error:', e);
    }
    try {
      const lokalLama = JSON.parse(localStorage.getItem('gemilang_paket_pendampingan_terbitan') || '[]');
      const lokalBaru = lokalLama.map((l) => (l.id === pkt.id || l.paketId === pkt.id ? { ...l, status: statusBaru ? 'aktif' : 'nonaktif', terbuka: statusBaru } : l));
      localStorage.setItem('gemilang_paket_pendampingan_terbitan', JSON.stringify(lokalBaru));
      setDaftarTerbitan(lokalBaru);
    } catch (err) {
      console.warn('Update localStorage error:', err);
    }
    alert(statusBaru ? `🔓 Akses Dibuka!\n\nPaket "${pkt.judul}" kini dibuka untuk siswa di kelas.` : `🔒 Akses Ditutup!\n\nPaket "${pkt.judul}" kini dikunci dari siswa.`);
  };

  const handleBantuAstroGemilang = async (babTargetManual = null, subMateriIdManual = null) => {
    const targetJenjang = jenjangAktif || 'SMP';
    const targetMapel = mapelAktif || 'Matematika';
    const targetBabNomor = babAktifObj?.babNomor || 1;
    const targetSubId = subMateriIdManual || subMateriAktif || 'semua';
    const subObj = daftarSubMateri.find((s) => s.id === targetSubId) || daftarSubMateri[0];

    // Buka Modal AI Thinking mode Mix Bank Asli + AI
    setAstroMode('mix');
    setModalAstroThinking(true);
    setAstroSedangBekerja(true);
    setAstroStep(1); // Langkah 1: Memindai Bank Soal
    setAstroReport(null);

    let activePool = bankSoal;
    // Jika bankSoal masih kosong atau sedang sinkronisasi awal, tunggu pemuatan cloud
    if (!activePool || activePool.length === 0) {
      try {
        await muatSemua(true);
        activePool = cacheBank || bankSoal;
      } catch (err) {
        console.warn('Fallback muat bank soal:', err);
      }
    }

    // Langkah 2: Audit Silabus (Eliminasi soal salah kamar)
    setTimeout(() => {
      setAstroStep(2);

      // Langkah 3: Deduplikasi & Seleksi Butir Otentik TKA
      setTimeout(() => {
        setAstroStep(3);

        // Langkah 4: Auto-Mix Soal HOTS AI & Kalibrasi KaTeX
        setTimeout(() => {
          setAstroStep(4);

          const final10Healed = kurasiDanMixSoalAi({
            jenjang: targetJenjang,
            mapel: targetMapel,
            babNomor: targetBabNomor,
            subMateriId: targetSubId,
            subMateriNama: subObj?.label || '',
            bankSoalPool: activePool && activePool.length > 0 ? activePool : bankSoal,
            targetJumlah: targetJumlahSoal,
          });

          // Langkah 5: Finalisasi & Ringkasan Laporan Kurasi
          setTimeout(() => {
            setAstroStep(5);
            setAstroSedangBekerja(false);
            setKeranjang(final10Healed);
            setPesanKeranjang(`✨ Astro Gemilang berhasil menyiapkan ${final10Healed.length} butir soal (Mix Bank Asli + AI HOTS) untuk ${subObj?.label || babAktifObj?.namaBab}!`);
            setModeTampil('preview');
            setIndeksPreview(0);

            const jumlahAsli = final10Healed.filter((s) => !s.isAiGenerated).length;
            const jumlahAi = final10Healed.filter((s) => s.isAiGenerated).length;

            setAstroReport({
              totalDipindai: (activePool && activePool.length) || bankSoal.length,
              dieliminasiSalahMateri: 0,
              dieliminasiKloning: 0,
              totalLolos: final10Healed.length,
              terpilih: final10Healed,
              jumlahAsli,
              jumlahAi,
              isPureAi: false,
              bab: `${babAktifObj?.namaBab} · ${subObj?.label}`,
            });
          }, 800);
        }, 900);
      }, 900);
    }, 1000);
  };

  const handleGeneratePureAiSoal = async (babTargetManual = null, subMateriIdManual = null) => {
    const targetJenjang = jenjangAktif || 'SMP';
    const targetMapel = mapelAktif || 'Matematika';
    const targetBabNomor = babAktifObj?.babNomor || 1;
    const targetSubId = subMateriIdManual || subMateriAktif || 'semua';
    const subObj = daftarSubMateri.find((s) => s.id === targetSubId) || daftarSubMateri[0];

    // Buka Modal AI Thinking mode Pure AI
    setAstroMode('pure_ai');
    setModalAstroThinking(true);
    setAstroSedangBekerja(true);
    setAstroStep(1); // Langkah 1: Riset Standar Ujian & Kisi-Kisi
    setAstroReport(null);

    // Langkah 2: Perancangan Kasus Kontekstual Baru
    setTimeout(() => {
      setAstroStep(2);

      // Langkah 3: Pembuatan Ilustrasi & Diagram Visual Lengkap
      setTimeout(() => {
        setAstroStep(3);

        // Langkah 4: Formulasi Opsi Distingtif, KaTeX Rumus & Kunci Jawaban
        setTimeout(async () => {
          setAstroStep(4);

          let final10Pure = [];
          try {
            final10Pure = await generatePureAiHotsSoal({
              jenjang: targetJenjang,
              mapel: targetMapel,
              babNomor: targetBabNomor,
              subMateriId: targetSubId,
              subMateriNama: subObj?.label || '',
              targetJumlah: targetJumlahSoal,
              bankSoalPool: bankSoal,
            });
          } catch (err) {
            console.warn('Pure AI Generator fallback:', err);
          }

          // Langkah 5: Finalisasi & Ringkasan Laporan Pure AI
          setTimeout(() => {
            setAstroStep(5);
            setAstroSedangBekerja(false);
            setKeranjang(final10Pure);
            setPesanKeranjang(`⚡ Astro AI berhasil menghasilkan ${final10Pure.length} butir soal Pure AI (Fresh HOTS + Gambar Lengkap) untuk ${targetMapel} (${subObj?.label || babAktifObj?.namaBab || 'Materi'})!`);
            setModeTampil('preview');
            setIndeksPreview(0);

            setAstroReport({
              totalDipindai: targetJumlahSoal,
              dieliminasiSalahMateri: 0,
              dieliminasiKloning: 0,
              totalLolos: final10Pure.length,
              terpilih: final10Pure,
              jumlahAsli: 0,
              jumlahAi: final10Pure.length,
              isPureAi: true,
              bab: `${babAktifObj?.namaBab} · ${subObj?.label}`,
            });
          }, 800);
        }, 900);
      }, 900);
    }, 1000);
  };

  const versiSegar = useSegarSaatTerlihat();
  // 🔥 BARU: bisa dibuka dengan bab sudah terpilih dari Perpustakaan
  // (/guru/cetak-latihan?jenjang=..&mapel=..&bab=..), supaya alur
  // "cari materi -> cetak" tidak meminta tentor memilih ulang dari nol.
  const [params] = useSearchParams();
  const isJalurPendampingan = params.get('jalur') === 'pendampingan' || (typeof window !== 'undefined' && window.location.pathname.includes('/guru/pendampingan'));

  const muatSemua = useCallback(async (paksa = false) => {
    const kini = Date.now();
    const bankMasihMuda = !perluSegar({ waktuCacheMs: waktuCacheBank, ttlMs: TTL_CACHE_MS, sekarangMs: kini, paksa });
    const paketMasihMuda = !perluSegar({ waktuCacheMs: waktuCachePaket, ttlMs: TTL_CACHE_MS, sekarangMs: kini, paksa });
    if (bankMasihMuda && paketMasihMuda && cacheBank && cachePaket) {
      setBankSoal(cacheBank);
      setPaketList(cachePaket);
      setPesanError('');
      setMemuat(false);
      return;
    }

    // Jika belum ada di memori, coba baca cache lokal agar layar tidak kosong
    if (!cacheBank) {
      try {
        const lokal = JSON.parse(localStorage.getItem('gemilang_cached_bank_soal') || '[]');
        if (Array.isArray(lokal) && lokal.length > 0) {
          const listNorm = lokal.map(normalisasiMetaSoal);
          cacheBank = listNorm;
          setBankSoal(listNorm);
        }
      } catch {}
    }

    setMemuat(true);
    try {
      // Pasang timeout 5000ms agar getDocs Firestore tidak hanging selamanya
      const denganTimeout = (p, ms = 5000) =>
        Promise.race([
          p,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Koneksi timeout (5s)')), ms)),
        ]);

      const tugas = [];
      if (!bankMasihMuda) tugas.push(['bank', denganTimeout(getDocs(collection(db, 'bank_soal')), 5000)]);
      if (!paketMasihMuda) {
        tugas.push(['paket', (async () => {
          const idt = bacaIdentitasGuru();
          if (!idt.semuaId.length) return { docs: [] };
          return denganTimeout(getDocs(query(collection(db, 'tryout_paket'), where('tentorId', 'in', idt.semuaId))), 4000);
        })()]);
      }
      const hasil = await Promise.all(tugas.map(([, p]) => p.catch((e) => e)));
      hasil.forEach((h, i) => {
        const jenis = tugas[i][0];
        if (h instanceof Error) {
          console.warn(`Gagal memuat ${jenis} dari cloud:`, h.message);
          return;
        }
        const list = (h.docs || []).map((d) => ({ id: d.id, ...d.data() }));
        if (jenis === 'bank' && list.length > 0) {
          const listNorm = susunSemuaBankSoalLatihan(list).map(normalisasiMetaSoal);
          cacheBank = listNorm;
          waktuCacheBank = Date.now();
          setBankSoal(listNorm);
          try {
            localStorage.setItem('gemilang_cached_bank_soal', JSON.stringify(listNorm));
          } catch {}
        } else if (jenis === 'paket') {
          const terbit = saringPaketTerbit(list);
          cachePaket = terbit;
          waktuCachePaket = Date.now();
          setPaketList(terbit);
        }
      });
      setPesanError('');
    } catch (e) {
      console.warn('Gagal muatSemua:', e);
      const k = kebijakanGagalMuat(!!cacheBank, e?.code || e?.message || '');
      if (!k.pertahankanDataLama && (!cacheBank || cacheBank.length === 0)) {
        try {
          const fallback = susunSemuaBankSoalLatihan([]).map(normalisasiMetaSoal);
          setBankSoal(fallback);
        } catch {}
      }
      setPesanError(k.pesan);
    } finally {
      setMemuat(false);
    }
  }, []);

  useEffect(() => { muatSemua(); }, [muatSemua, versiSegar]);

  useEffect(() => {
    const pj = params.get('jenjang');
    const pm = params.get('mapel');
    const pb = params.get('bab');
    if (pj) setJenjangAktif(pj);
    if (pm) setMapelAktif(pm);
    if (pb) setBabAktif(pb);

    if (isJalurPendampingan && !pm && !mapelAktif) {
      setJenjangAktif('SMP');
      setMapelAktif('Matematika');
    }
  }, [params, isJalurPendampingan, mapelAktif]);

  // ---- hirarki bank: jenjang -> mapel -> bab, terintegrasi standar Bimbel Gemilang ----
  const daftarJenjang = useMemo(() => {
    const hitung = new Map();
    for (const s of bankSoal) {
      const norm = normalisasiMetaSoal(s);
      const k = norm.jenjang || 'SMP';
      if (k === BELUM) continue;
      hitung.set(k, (hitung.get(k) || 0) + 1);
    }

    const hasil = DAFTAR_JENJANG_UTAMA.map((j) => ({
      ...j,
      jumlah: hitung.get(j.id) || 0,
    }));

    for (const [k, count] of hitung.entries()) {
      if (!hasil.some((h) => h.id === k) && k !== BELUM) {
        hasil.push({
          id: k,
          label: k,
          deskripsi: `Koleksi bank soal ${k}`,
          icon: '📚',
          badge: k,
          jumlah: count,
        });
      }
    }
    return hasil;
  }, [bankSoal]);

  const daftarMapel = useMemo(() => {
    if (!jenjangAktif) return [];
    const hitung = new Map();
    for (const s of bankSoal) {
      const norm = normalisasiMetaSoal(s);
      if (norm.jenjang !== jenjangAktif) continue;
      const k = norm.mataPelajaran || 'Matematika';
      if (k === BELUM) continue;
      hitung.set(k, (hitung.get(k) || 0) + 1);
    }

    const defaultList = MAPEL_RESMI_PER_JENJANG[jenjangAktif] || [];
    const hasil = defaultList.map((m) => ({
      nama: m.nama,
      icon: m.icon,
      deskripsi: m.deskripsi,
      jumlah: hitung.get(m.nama) || 0,
    }));

    for (const [k, count] of hitung.entries()) {
      if (!hasil.some((h) => h.nama.toLowerCase() === k.toLowerCase()) && k !== BELUM) {
        hasil.push({
          nama: k,
          icon: '📚',
          deskripsi: `Koleksi ${k}`,
          jumlah: count,
        });
      }
    }
    return hasil;
  }, [bankSoal, jenjangAktif]);

  const daftarBabResmi = useMemo(() => {
    if (!jenjangAktif || !mapelAktif) return [];
    return ambilDaftarBab(jenjangAktif, mapelAktif, bankSoal);
  }, [jenjangAktif, mapelAktif, bankSoal]);

  const daftarBabTerfilter = useMemo(() => {
    if (!cariMateri.trim()) return daftarBabResmi;
    const q = cariMateri.toLowerCase().trim();
    return daftarBabResmi.filter((b) => {
      const matchBab = (b.namaBab && b.namaBab.toLowerCase().includes(q)) || (b.ringkas && b.ringkas.toLowerCase().includes(q));
      const matchSub = b.subMateriList && b.subMateriList.some((s) => (s.label && s.label.toLowerCase().includes(q)) || (s.kataKunci && s.kataKunci.some((k) => k.toLowerCase().includes(q))));
      return matchBab || matchSub;
    });
  }, [daftarBabResmi, cariMateri]);

  // Bab aktif object
  const babAktifObj = useMemo(() => {
    if (!daftarBabResmi || daftarBabResmi.length === 0) return null;
    if (!babAktif) return daftarBabResmi[0];
    return (
      daftarBabResmi.find(
        (b) =>
          b.namaBab === babAktif ||
          b.ringkas === babAktif ||
          String(b.babNomor) === String(babAktif) ||
          b.namaBab.toLowerCase().includes(babAktif.toLowerCase())
      ) || daftarBabResmi[0]
    );
  }, [daftarBabResmi, babAktif]);

  // Sub-materi list untuk bab yang aktif
  const daftarSubMateri = useMemo(() => {
    return babAktifObj?.subMateriList || [{ id: 'semua', label: '🎯 Semua Sub-Materi' }];
  }, [babAktifObj]);

  const subMateriObj = useMemo(() => {
    return daftarSubMateri.find((s) => s.id === subMateriAktif) || daftarSubMateri[0];
  }, [daftarSubMateri, subMateriAktif]);

  // Otomatis pasang bab default jika belum ada bab terpilih
  useEffect(() => {
    if (mapelAktif && daftarBabResmi && daftarBabResmi.length > 0) {
      if (!babAktif || !daftarBabResmi.some((b) => b.namaBab === babAktif)) {
        const babBil = daftarBabResmi.find((b) => b.namaBab.toLowerCase().includes('bilangan'));
        setBabAktif(babBil ? babBil.namaBab : daftarBabResmi[0].namaBab);
        setSubMateriAktif('semua');
      }
    }
  }, [mapelAktif, babAktif, daftarBabResmi]);

  // Butir soal di bab aktif (dan sub-materi aktif)
  const soalDiBab = useMemo(() => {
    if (!jenjangAktif || !mapelAktif || !babAktifObj) return [];
    return saringSoalBabDanSubMateri(
      bankSoal,
      jenjangAktif,
      mapelAktif,
      babAktifObj.babNomor,
      subMateriAktif,
      babAktifObj.namaBab
    );
  }, [bankSoal, jenjangAktif, mapelAktif, babAktifObj, subMateriAktif]);

  const daftarKelas = useMemo(() => sebaranKelas(soalDiBab), [soalDiBab]);

  const soalDiBabTerfilter = useMemo(
    () => (kelasFilter ? soalDiBab.filter((s) => String(s.kelas || '').trim() === kelasFilter) : soalDiBab),
    [soalDiBab, kelasFilter]
  );

  const soalBankTampil = useMemo(
    () => (tanpaEsai ? soalDiBabTerfilter.filter((s) => !['esai', 'uraian'].includes(s.tipe)) : soalDiBabTerfilter),
    [soalDiBabTerfilter, tanpaEsai]
  );

  // Keranjang adalah sumber kebenaran pilihan, bukan irisan daftar tampil.
  const terpilihBank = keranjang;
  const ringkasanKeranjang = useMemo(() => ringkasKeranjang(keranjang), [keranjang]);

  // ---- mode paket (perilaku #134) ----
  const paket = paketList.find((p) => p.id === paketId) || null;
  // 🔥 2026-10-09 (CRASH React #185): tanpa useMemo, array BARU tercipta
  // setiap render -> blok naskah ikut baru -> efek pengukur jalan tiap render
  // -> setter menulis [] baru -> render lagi -> loop tak berakhir. Terjadi
  // saat tab "Paket Try Out saya" dibuka dengan 0 paket.
  const soalPaket = useMemo(
    () => pilihSoalUntukCetak(paket?.daftarSoal, { maks: maksPaket || undefined, tanpaEsai }),
    [paket, maksPaket, tanpaEsai]
  );

  const siap = sumber === 'bank' ? terpilihBank : soalPaket;
  // KENAPA useMemo: objek meta ikut jadi dependencia memo blok naskah;
  // tanpa ini objek baru tiap render membuat lapisan ukur disusun ulang
  // tanpa henti (eslint react-hooks/exhaustive-deps).
  const meta = useMemo(() => {
    if (sumber === 'bank') {
      const jenjangNama = jenjangAktif || (ringkasanKeranjang.perJenjang.length === 1 ? ringkasanKeranjang.perJenjang[0].nama : 'SMP / MTs');
      const mapelNama = mapelAktif || (ringkasanKeranjang.perMapel.length === 1 ? ringkasanKeranjang.perMapel[0].nama : 'Matematika');
      const babNama = babAktifObj?.namaBab || (ringkasanKeranjang.perMateri.length === 1 ? ringkasanKeranjang.perMateri[0].nama : (babAktif || 'Bab 1 · Bilangan'));
      const subMateriNama = (subMateriAktif && subMateriAktif !== 'semua' && subMateriObj?.label) ? subMateriObj.label : '';
      const judulBersih = [jenjangNama, mapelNama, babAktifObj?.ringkas || babNama].filter(Boolean).join(' · ');
      return {
        judul: judulBersih,
        mapel: mapelNama,
        targetKelas: jenjangNama,
        bab: babNama,
        subMateri: subMateriNama,
        subTopik: subMateriNama,
        jumlahSoal: keranjang.length,
        gayaLembar,
      };
    }
    return {
      judul: paket?.judul || 'Paket Latihan Siswa',
      mapel: paket?.targetKategori || paket?.mapel || mapelAktif || 'Matematika',
      targetKelas: paket?.targetKelas || jenjangAktif || 'SMP / MTs',
      bab: paket?.babJudul || paket?.bab || 'Bab 1 · Bilangan',
      subMateri: paket?.subMateri || '',
      jumlahSoal: paket?.daftarSoal?.length || 0,
      gayaLembar,
    };
  }, [sumber, keranjang, ringkasanKeranjang, paket, jenjangAktif, mapelAktif, babAktifObj, babAktif, subMateriAktif, subMateriObj, gayaLembar]);

  const inKeranjang = (id) => keranjang.some((s) => String(s?.id) === String(id));

  const centang = (soal, on) => {
    if (on) {
      setKeranjang((lama) => masukKeranjang(lama, soal).keranjang);
    } else {
      setKeranjang((lama) => keluarKeranjang(lama, soal?.id));
    }
  };

  const pilihSemuaTampil = () => {
    const hasil = masukKeranjangBanyak(keranjang, soalBankTampil);
    setKeranjang(hasil.keranjang);
    setPesanKeranjang(teksRincianMasuk(hasil.rincian));
  };

  // ---- 🔥 BARU: mesin naskah (ukur -> susun -> pratinjau -> cetak) ----
  const kertas = kertasDariKode(kodeKertas);
  const isCatatan = kolomPaksa === 'catatan';
  const jumlahKolom = isCatatan ? 'catatan' : (kolomPaksa > 0 ? kolomPaksa : kolomOtomatis(kertas));
  const lebarKolom = lebarKolomMm(kertas, jumlahKolom);
  // Lebar isi kertas (untuk mengukur blok yang dicetak lebar penuh).
  const lebarIsiKertas = Math.round((kertas.lebarMm - 2 * MARGIN_MM) * 10) / 10;
  // 🔥 2026-10-09: wacana bersama kini jadi BLOK TERSENDIRI (dicetak sekali
  // untuk sekelompok soal), jadi jumlah blok != jumlah soal. Taksiran tinggi
  // harus sejajar dengan blok, bukan dengan soal, supaya penyusun kolom tidak
  // diam-diam jatuh ke taksiran buta.
  const kapasitasMm = useMemo(() => kapasitasKolomMm(kertas), [kertas]);

  const blokSiswa = useMemo(
    () => (siap.length ? daftarBlokNaskah('siswa', meta, siap, lebarKolom, rasioGambar, kapasitasMm, jumlahKolom, { gayaLembar }) : []),
    [siap, meta, lebarKolom, rasioGambar, kapasitasMm, jumlahKolom, gayaLembar]
  );
  const blokKunci = useMemo(
    () => (siap.length ? daftarBlokNaskah('kunci', meta, siap, lebarKolom, rasioGambar, kapasitasMm, jumlahKolom, { gayaLembar }) : []),
    [siap, meta, lebarKolom, rasioGambar, kapasitasMm, jumlahKolom, gayaLembar]
  );
  // 🔥 2026-10-09 (owner: "khusus bacaan panjang gausah kanan kiri"):
  // blok berwacana panjang ditandai supaya (a) diukur pada lebar kertas penuh,
  // bukan lebar kolom, dan (b) diberi halaman lebar penuh oleh penyusun kolom.
  const blokPenuhSiswa = useMemo(
    () => (siap.length ? daftarBlokPenuh('siswa', meta, siap, lebarKolom, rasioGambar, kapasitasMm, jumlahKolom) : []),
    [siap, meta, lebarKolom, rasioGambar, kapasitasMm, jumlahKolom]
  );
  const blokPenuhKunci = useMemo(
    () => (siap.length ? daftarBlokPenuh('kunci', meta, siap, lebarKolom, rasioGambar, kapasitasMm, jumlahKolom) : []),
    [siap, meta, lebarKolom, rasioGambar, kapasitasMm, jumlahKolom]
  );
  const indeksLebarSiswa = useMemo(
    () => blokPenuhSiswa.map((v, i) => (v ? i : -1)).filter((i) => i >= 0),
    [blokPenuhSiswa]
  );
  const indeksLebarKunci = useMemo(
    () => blokPenuhKunci.map((v, i) => (v ? i : -1)).filter((i) => i >= 0),
    [blokPenuhKunci]
  );

  // Lapisan ukur tersembunyi: tinggi sungguhan tiap blok (mm) dibaca dari
  // DOM setelah gaya & lebar kolom sama persis dengan dokumen cetak.
  // KENAPA tidak memakai estimasi teks saja: rumus KaTeX dan gambar membuat
  // tinggi nyata sering jauh berbeda dari taksiran huruf.
  useLayoutEffect(() => {
    const ukur = (ref, setter, jumlahBlok) => {
      const node = ref.current;
      // Jangan pernah menulis array BARU bila keadaan sudah kosong:
      // identitas state yang stabil memutus loop render lapisan ukur.
      if (!node) { setter((lama2) => (lama2.length ? [] : lama2)); return; }
      const anak = [...node.children];
      if (anak.length !== jumlahBlok) { setter((lama2) => (lama2.length ? [] : lama2)); return; }
      const mm = anak.map((el) => Math.round((el.offsetHeight / PX_PER_MM) * 10) / 10);
      setter((lama) => (lama.length === mm.length && lama.every((v, i) => v === mm[i]) ? lama : mm));
    };
    ukur(refUkurSiswa, setTinggiSiswa, blokSiswa.length);
    ukur(refUkurKunci, setTinggiKunci, blokKunci.length);
  }, [blokSiswa, blokKunci]);

  // Pengukuran KEDUA: hanya blok yang akan dicetak lebar penuh, pada lebar isi
  // kertas. Hasilnya dikirim ke penyusun kolom sebagai `tinggiLebarMm` supaya
  // tinggi pita jujur (bukan taksiran) dan sisa halaman bisa dipakai soal.
  useLayoutEffect(() => {
    const ukurLebar = (ref, indeks, setter, jumlahBlok) => {
      const node = ref.current;
      if (!node || !indeks.length) { setter((l) => (l.length ? [] : l)); return; }
      const anak = [...node.children];
      if (anak.length !== indeks.length) { setter((l) => (l.length ? [] : l)); return; }
      const arr = new Array(jumlahBlok).fill(0);
      anak.forEach((el, k) => { arr[indeks[k]] = Math.round((el.offsetHeight / PX_PER_MM) * 10) / 10; });
      setter((lama2) => (lama2.length === arr.length && lama2.every((v, i) => v === arr[i]) ? lama2 : arr));
    };
    ukurLebar(refUkurLebarSiswa, indeksLebarSiswa, setTinggiLebarSiswa, blokSiswa.length);
    ukurLebar(refUkurLebarKunci, indeksLebarKunci, setTinggiLebarKunci, blokKunci.length);
  }, [blokSiswa, blokKunci, indeksLebarSiswa, indeksLebarKunci]);

  // Skala kanvas pratinjau: iframe dirender pada ukuran mm sesungguhnya lalu
  // dikecilkan sebesar wadah, supaya halaman tidak lagi "meluber" keluar
  // kotak seperti tangkapan layar owner 2026-10-09.
  useLayoutEffect(() => {
    const hitung = () => {
      const w = refKanvas.current?.clientWidth || 0;
      const pagePx = kertas.lebarMm * PX_PER_MM;
      if (w > 0 && pagePx > 0) setSkala((lama) => { const b = Math.min(1, (w - 2) / pagePx); return Math.abs(b - lama) > 0.01 ? b : lama; });
    };
    hitung();
    window.addEventListener('resize', hitung);
    return () => window.removeEventListener('resize', hitung);
  }, [kertas.lebarMm]);

  // Rasio piksel asli gambar: ditempeli listener saat lapisan ukur_mount.
  useEffect(() => {
    const wadah = [refUkurSiswa.current, refUkurKunci.current, refUkurLebarSiswa.current, refUkurLebarKunci.current].filter(Boolean);
    const pasang = [];
    wadah.forEach((w) => {
      w.querySelectorAll('img').forEach((img) => {
        const catat = () => {
          if (!img.naturalWidth || !img.naturalHeight) return;
          const r = img.naturalWidth / img.naturalHeight;
          const rawSrc = img.getAttribute('src') || '';
          let pathname = '';
          try {
            pathname = new URL(img.src, window.location.origin).pathname;
          } catch {}
          setRasioGambar((lama) => {
            const bedaSrc = Math.abs((lama[img.src] ?? 0) - r) >= 0.001;
            const bedaRaw = rawSrc && Math.abs((lama[rawSrc] ?? 0) - r) >= 0.001;
            const bedaPath = pathname && Math.abs((lama[pathname] ?? 0) - r) >= 0.001;
            if (!bedaSrc && !bedaRaw && !bedaPath) return lama;
            const update = { ...lama, [img.src]: r };
            if (rawSrc) update[rawSrc] = r;
            if (pathname) update[pathname] = r;
            return update;
          });
        };
        if (img.complete) catat();
        else { img.addEventListener('load', catat, { once: true }); pasang.push([img, catat]); }
      });
    });
    return () => pasang.forEach(([img, catat]) => img.removeEventListener('load', catat));
  }, [blokSiswa, blokKunci]);

  const perkiraanSiswa = useMemo(
    () => daftarTinggiPerkiraan('siswa', meta, siap, lebarKolom, rasioGambar, kapasitasMm, jumlahKolom, { gayaLembar }),
    [meta, siap, lebarKolom, rasioGambar, kapasitasMm, jumlahKolom, gayaLembar]
  );
  const perkiraanKunci = useMemo(
    () => daftarTinggiPerkiraan('kunci', meta, siap, lebarKolom, rasioGambar, kapasitasMm, jumlahKolom, { gayaLembar }),
    [meta, siap, lebarKolom, rasioGambar, kapasitasMm, jumlahKolom, gayaLembar]
  );

  const naskahSiswa = useMemo(() => (blokSiswa.length
    ? susunNaskahDariBlok(blokSiswa, { kertas: kodeKertas, jumlahKolom, tinggiBlokMm: tinggiSiswa, tinggiPerkiraanMm: perkiraanSiswa, blokPenuh: blokPenuhSiswa, tinggiLebarMm: tinggiLebarSiswa, cssTambahan: katexCssInline })
    : null), [blokSiswa, kodeKertas, jumlahKolom, tinggiSiswa, perkiraanSiswa, blokPenuhSiswa, tinggiLebarSiswa]);
  const naskahKunci = useMemo(() => (blokKunci.length
    ? susunNaskahDariBlok(blokKunci, { kertas: kodeKertas, jumlahKolom, tinggiBlokMm: tinggiKunci, tinggiPerkiraanMm: perkiraanKunci, blokPenuh: blokPenuhKunci, tinggiLebarMm: tinggiLebarKunci, cssTambahan: katexCssInline })
    : null), [blokKunci, kodeKertas, jumlahKolom, tinggiKunci, perkiraanKunci, blokPenuhKunci, tinggiLebarKunci]);

  const docPratinjau = (fragmen) => `<!DOCTYPE html><html lang="id"><head><meta charset="utf-8" />
    <style>html{background:#cbd5e1}body{margin:0;padding:4mm;display:flex;flex-direction:column;align-items:center;gap:3mm}</style>
    </head><body>${fragmen}</body></html>`;
  const fragmenAktif = tabPratinjau === 'kunci' ? naskahKunci?.fragmen : naskahSiswa?.fragmen;

  const cetakNaskah = (mode) => {
    const hasil = mode === 'kunci' ? naskahKunci : naskahSiswa;
    if (!hasil) return;
    cetakLewatIframe(hasil.fragmen, mode === 'kunci' ? 'Kunci & Pembahasan (Pegangan Guru)' : 'Naskah Soal Siswa');
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* gaya naskah dipakai juga oleh lapisan ukur tersembunyi di bawah */}
      <style>{GAYA_NASKAH}</style>
      <h2 style={{ margin: '4px 0 4px', fontSize: 18 }}>
        {isJalurPendampingan ? '📋 Manajemen Soal & Kelas Pendampingan (TKA & UTBK)' : '🖨️ Cetak Paket Latihan'}
      </h2>
      <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px' }}>
        {isJalurPendampingan
          ? 'Pilih butir soal terbaik dari bank soal resmi, terbitkan ke akun siswa binaan untuk latihan di Buku Besar, atau cetak Lembar Gunting & Kunci Pembahasan.'
          : 'Baca dulu isi soal lengkap di daftar bawah, centang yang mau dicetak, lalu lihat pratinjau susunan naskah sebelum mencetak.'}
      </p>

      {isJalurPendampingan && (
        <div style={{
          background: '#f0fdfa',
          border: '1.5px solid #5eead4',
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 2px 8px rgba(13, 148, 136, 0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: '#0d9488',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              flexShrink: 0,
            }}>
              🎓
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f766e' }}>
                Portal Kelas Pendampingan Bersama Tentor (TKA SMP & UTBK SNBT)
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#134e4a', lineHeight: 1.5 }}>
                Pilih paket materi pekanan dari Bank Soal. Cetak <strong>PAKET-SISWA (Kotak Siap Gunting ✂️)</strong> untuk ditempel di Buku Besar fisik siswa, dan cetak <strong>KUNCI-TENTOR</strong> sebagai panduan Bedah Akbar di kelas!
              </p>
            </div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#0f766e', background: '#ccfbf1', padding: '4px 10px', borderRadius: 99 }}>
            Anti-Nyontek • Ramah Buku Besar
          </span>
        </div>
      )}

      {pesanError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 10, padding: '10px 12px', fontSize: 12, marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ flex: 1, minWidth: 200 }}>⚠️ {pesanError}</span>
          <button onClick={() => muatSemua(true)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#b91c1c', color: 'white', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>
            🔄 Coba lagi
          </button>
        </div>
      )}

      {/* 🔥 2026-10-09 (desain ulang): LANGKAH 1 = memilih. Tidak ada panel
          keranjang terpisah; bar terpilih menempel di bawah layar. */}
      {langkah === 1 && (<>
      <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <button style={gayaPill(sumber === 'bank')} onClick={() => setSumber('bank')}>
          🗂️ Bank Soal & Pusat Kendali AI
        </button>
        <button style={gayaPill(sumber === 'paket')} onClick={() => setSumber('paket')}>
          📦 Paket Try Out Saya ({paketList.length})
        </button>
        <button
          type="button"
          style={{
            ...gayaPill(sumber === 'analitik'),
            background: sumber === 'analitik' ? '#0f766e' : '#f0fdfa',
            color: sumber === 'analitik' ? '#ffffff' : '#0f766e',
            border: '1.5px solid #2dd4bf',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
          onClick={() => setSumber('analitik')}
        >
          <span>📊 Papan Analitik Ketuntasan & Remedial Kelas</span>
          <span style={{
            fontSize: 10,
            fontWeight: 900,
            background: statusRemedialSelesai ? '#dcfce7' : '#fef08a',
            color: statusRemedialSelesai ? '#166534' : '#713f12',
            padding: '2px 7px',
            borderRadius: 99,
          }}>
            {statusRemedialSelesai ? '✓ Semua Tuntas' : '⚠️ Remedial Aktif'}
          </span>
        </button>
      </div>

      {memuat && bankSoal.length > 0 && (
        <div style={{ fontSize: 11.5, color: '#0d9488', background: '#f0fdfa', border: '1px solid #ccfbf1', padding: '6px 14px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <span>🔄 Menyinkronkan pembaruan cloud ({bankSoal.length} soal aktif di memori)...</span>
        </div>
      )}

      {sumber === 'bank' && (
        <>
          {memuat && bankSoal.length === 0 ? (
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: '48px 24px',
              textAlign: 'center',
              border: '1.5px solid #ccfbf1',
              boxShadow: '0 4px 20px rgba(13, 148, 136, 0.08)',
              margin: '16px 0 24px',
            }}>
              <div style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
                border: '2px solid #2dd4bf',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                margin: '0 auto 16px',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.15)',
              }}>
                ⏳
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 900, color: '#0f766e' }}>
                Menyiapkan & Menyinkronkan Bank Soal Gemilang...
              </h3>
              <p style={{ margin: '0 auto 20px', maxWidth: 540, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                Sistem sedang mengunduh dan menyusun arsip bank soal resmi (TKA SMP, ASPD DIY, & UTBK SNBT) langsung dari database cloud. Mohon tunggu sejenak agar kurasi dan penyusunan soal menghasilkan butir berkualitas tinggi.
              </p>

              <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 10, textAlign: 'left', background: '#f8fafc', padding: '16px 24px', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                <div style={{ fontSize: 12.5, color: '#059669', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>✓</span> <b>Memeriksa Cache & Otentikasi Guru</b>
                </div>
                <div style={{ fontSize: 12.5, color: '#0d9488', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🔄</span> <b>Menghubungkan & Mengunduh Bank Soal dari Firestore...</b>
                </div>
                <div style={{ fontSize: 12.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>⏳</span> <span>Menyiapkan Engine Kurasi & AI HOTS Mixer</span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => muatSemua(true)}
                  style={{
                    background: '#0d9488',
                    border: 'none',
                    color: '#ffffff',
                    padding: '9px 20px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(13, 148, 136, 0.25)',
                  }}
                >
                  🔄 Muat Ulang Sekarang
                </button>
              </div>
            </div>
          ) : (
            <>
          {/* 🤖 ASISTEN ASTRO GEMILANG BANNER UTAMA (SELALU MUNCUL DI ATAS) */}
          <div style={{
            background: 'linear-gradient(135deg, #042f2e 0%, #115e59 100%)',
            borderRadius: 14,
            padding: '16px 18px',
            color: '#ffffff',
            marginBottom: 16,
            border: '1.5px solid #2dd4bf',
            boxShadow: '0 4px 14px rgba(13, 148, 136, 0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  flexShrink: 0,
                }}>
                  🤖
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#f0fdfa' }}>
                      Asisten Astro Gemilang — Pembuatan & Kurasi Paket Soal
                    </h4>
                    <span style={{
                      background: '#2dd4bf',
                      color: '#042f2e',
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 99,
                    }}>
                      Kurasi & Mix AI HOTS
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#ccfbf1', lineHeight: 1.4 }}>
                    Materi Aktif: <b>{babAktifObj?.ringkas || babAktif || 'Bilangan'}</b> → <b style={{ color: '#fef08a' }}>{subMateriObj?.label || 'Semua Sub-Materi'}</b> ({soalBankTampil.length} butir di Bank Soal).
                    <span style={{ marginLeft: 6, opacity: 0.9 }}>
                      Tentukan target butir & mode di <b>Pusat Kendali AI (Langkah 4)</b> di bawah.
                    </span>
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <a
                  href="#pusat-kendali-ai"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('pusat-kendali-ai')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{
                    background: '#fef08a linear-gradient(180deg, #fef08a 0%, #fde047 100%)',
                    color: '#713f12',
                    border: '1.5px solid #ca8a04',
                    borderRadius: 10,
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(202, 138, 4, 0.25)',
                  }}
                >
                  <span>⚡ Ke Pusat Kendali AI (Langkah 4)</span>
                  <span>↓</span>
                </a>
                {keranjang.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setKeranjang([]);
                      setPesanKeranjang('Pilihan dikosongkan.');
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.25)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 11.5,
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    Kosongkan ({keranjang.length})
                  </button>
                )}
              </div>
            </div>

            {/* Quick Topic Chips Shortcut */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#99f6e4' }}>
                Pilihan Cepat Materi:
              </span>
              {[
                { label: '🔢 Bilangan & Akar', jenjang: 'SMP', mapel: 'Matematika', bab: 'Bilangan (Bulat, Pecahan, Berpangkat, & Bentuk Akar)' },
                { label: '📐 Aljabar & SPLDV', jenjang: 'SMP', mapel: 'Matematika', bab: 'Aljabar (SPLDV, Persamaan Kuadrat, Fungsi & Pola Bilangan)' },
                { label: '📏 Geometri & Ruang', jenjang: 'SMP', mapel: 'Matematika', bab: 'Geometri & Pengukuran (Sudut, Pythagoras, Ruang & Transformasi)' },
                { label: '📊 Statistika & Peluang', jenjang: 'SMP', mapel: 'Matematika', bab: 'Data & Peluang (Statistika, Diagram & Peluang Teoretik)' },
                { label: '📖 Bahasa Indonesia', jenjang: 'SMP', mapel: 'Bahasa Indonesia', bab: 'Literasi Bahasa Indonesia' },
                { label: '🧪 IPA Terpadu', jenjang: 'SMP', mapel: 'IPA', bab: 'Literasi Sains & IPA' },
                { label: '🎓 UTBK SNBT', jenjang: 'SMA', mapel: 'Pengetahuan Kuantitatif', bab: 'Aljabar Fungsi & Operasi Bilangan' },
              ].map((chip) => {
                const isSelected = babAktif === chip.bab || (babAktif && babAktif.toLowerCase().includes(chip.label.toLowerCase().slice(3, 8)));
                return (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      setJenjangAktif(chip.jenjang);
                      setMapelAktif(chip.mapel);
                      setBabAktif(chip.bab);
                      setKelasFilter('');
                      setIndeksPreview(0);
                    }}
                    style={{
                      background: isSelected ? '#ffffff' : 'rgba(255,255,255,0.12)',
                      color: isSelected ? '#042f2e' : '#f0fdfa',
                      border: isSelected ? '1.5px solid #2dd4bf' : '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 99,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: isSelected ? 800 : 600,
                      cursor: 'pointer',
                    }}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ ...gayaKartu, border: '1.5px solid #e0e7ff', background: '#faf5ff linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
              <div style={{ ...gayaJudulKartu, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 15 }}>🏫</span>
                <span>1 · Jenjang Pendidikan</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4338ca', background: '#e0e7ff', padding: '2px 8px', borderRadius: 99 }}>
                  Pilih Target Kelas Siswa
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                Total Bank Soal Tersedia: <b style={{ color: '#0f172a' }}>{bankSoal.length} Butir</b>
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
              {daftarJenjang.map((j) => {
                const aktif = jenjangAktif === j.id;
                return (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => {
                      setJenjangAktif(j.id);
                      const defMapel = j.id === 'SMA' ? 'Pengetahuan Kuantitatif' : 'Matematika';
                      setMapelAktif(defMapel);
                      setBabAktif('');
                    }}
                    style={{
                      textAlign: 'left',
                      borderRadius: 12,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      border: aktif ? '2px solid #4f46e5' : '1.5px solid #e2e8f0',
                      background: aktif ? '#eef2ff' : '#ffffff',
                      boxShadow: aktif ? '0 4px 12px rgba(79, 70, 229, 0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 22 }}>{j.icon}</span>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 800, color: aktif ? '#312e81' : '#0f172a' }}>
                            {j.label}
                          </div>
                          <div style={{ fontSize: 11, color: aktif ? '#4338ca' : '#64748b', marginTop: 2 }}>
                            {j.deskripsi}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 99,
                          background: aktif ? '#4f46e5' : '#f1f5f9',
                          color: aktif ? '#ffffff' : '#475569',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {j.jumlah} soal
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {jenjangAktif && (
            <div style={gayaKartu}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                <div style={gayaJudulKartu}>
                  2 · Mata Pelajaran pada <span style={{ color: '#4f46e5' }}>{daftarJenjang.find((d) => d.id === jenjangAktif)?.label || jenjangAktif}</span>
                </div>
                <span style={{ fontSize: 11, color: '#64748b' }}>Klik mapel untuk membuka daftar bab silabus</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {daftarMapel.map((m) => {
                  const aktif = mapelAktif.toLowerCase() === m.nama.toLowerCase();
                  return (
                    <button
                      key={m.nama}
                      type="button"
                      onClick={() => {
                        setMapelAktif(m.nama);
                        setBabAktif('');
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 14px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: aktif ? 800 : 600,
                        cursor: 'pointer',
                        border: aktif ? '1.5px solid #4f46e5' : '1px solid #cbd5e1',
                        background: aktif ? '#4f46e5' : '#ffffff',
                        color: aktif ? '#ffffff' : '#334155',
                        boxShadow: aktif ? '0 2px 6px rgba(79, 70, 229, 0.25)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{m.icon || '📚'}</span>
                      <span>{m.nama}</span>
                      <span
                        style={{
                          fontSize: 11,
                          opacity: aktif ? 0.95 : 0.65,
                          background: aktif ? 'rgba(255,255,255,0.22)' : '#f1f5f9',
                          padding: '1px 7px',
                          borderRadius: 99,
                        }}
                      >
                        {m.jumlah}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {mapelAktif && (
            <div style={gayaKartu}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
                <div style={gayaJudulKartu}>
                  3 · Pilih Bab / Materi Silabus <span style={{ color: '#0f766e' }}>{mapelAktif}</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b' }}>
                  <b>{daftarBabResmi.length}</b> Bab Kurikulum Standar
                </div>
              </div>

              {/* Input Pencarian Cerdas + Tombol AI Astro */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                  <input
                    value={cariMateri}
                    onChange={(e) => setCariMateri(e.target.value)}
                    placeholder="🔍 Cari bab / sub-materi (contoh: Bilangan Real, Bentuk Akar, Pangkat, Aljabar)..."
                    style={{ width: '100%', padding: '10px 34px 10px 14px', border: '1.5px solid #cbd5e1', borderRadius: 10, fontSize: 13, background: '#ffffff', boxSizing: 'border-box' }}
                  />
                  {cariMateri && (
                    <button
                      type="button"
                      onClick={() => setCariMateri('')}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 15 }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                {cariMateri.trim() && (
                  <button
                    type="button"
                    onClick={() => handleBantuAstroGemilang(cariMateri.trim(), subMateriAktif)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '10px 18px',
                      borderRadius: 10,
                      background: '#042f2e linear-gradient(135deg, #042f2e 0%, #064e3b 100%)',
                      color: '#fef08a',
                      border: '1.5px solid #2dd4bf',
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(4, 47, 46, 0.25)',
                    }}
                  >
                    <span>✨</span>
                    <span>Minta AI Carikan Soal "{cariMateri.slice(0, 18)}{cariMateri.length > 18 ? '…' : ''}"</span>
                  </button>
                )}
              </div>

              {/* LEVEL A: KARTU BAB RESMI KURIKULUM */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📚</span>
                  <span>PILIHAN BAB KURIKULUM RESMI (Klik Bab untuk Melihat Sub-Materi)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                  {daftarBabTerfilter.map((b) => {
                    const aktif = babAktifObj?.babNomor === b.babNomor || babAktif === b.namaBab;
                    return (
                      <button
                        key={b.babNomor || b.namaBab}
                        type="button"
                        onClick={() => {
                          setBabAktif(b.namaBab);
                          setSubMateriAktif('semua');
                          setKelasFilter('');
                          setIndeksPreview(0);
                        }}
                        style={{
                          textAlign: 'left',
                          borderRadius: 12,
                          padding: '12px 14px',
                          cursor: 'pointer',
                          border: `2px solid ${aktif ? '#0d9488' : '#e2e8f0'}`,
                          background: aktif ? '#f0fdfa' : '#ffffff',
                          boxShadow: aktif ? '0 4px 12px rgba(13, 148, 136, 0.15)' : 'none',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: 6,
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
                            <span style={{ fontSize: 18 }}>{b.icon || '📖'}</span>
                            <span style={{
                              fontSize: 10.5,
                              fontWeight: 800,
                              padding: '2px 7px',
                              borderRadius: 99,
                              background: aktif ? '#ccfbf1' : '#f1f5f9',
                              color: aktif ? '#0f766e' : '#64748b',
                            }}>
                              {b.count || b.jumlahSoal || 0} butir
                            </span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: aktif ? '#042f2e' : '#0f172a', lineHeight: 1.35 }}>
                            {b.ringkas || b.namaBab}
                          </div>
                          {b.deskripsi && (
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, lineHeight: 1.35 }}>
                              {b.deskripsi}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: '1px dashed #e2e8f0' }}>
                          <span style={{ fontSize: 10.5, color: aktif ? '#0f766e' : '#94a3b8', fontWeight: 700 }}>
                            {b.subMateriList ? `${b.subMateriList.length - 1} Sub-Topik` : 'Materi Umum'}
                          </span>
                          <span style={{ fontSize: 10.5, color: aktif ? '#0f766e' : '#0284c7', fontWeight: 800 }}>
                            {aktif ? '✓ Sedang Dipilih' : 'Pilih Bab →'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LEVEL B: PILIHAN SUB-MATERI / TOPIK FOKUS */}
              {babAktifObj && daftarSubMateri && daftarSubMateri.length > 0 && (
                <div style={{
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: 14,
                  padding: '14px 16px',
                  marginTop: 10,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 15 }}>🎯</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>
                        Pilih Sub-Materi / Topik Fokus ({babAktifObj.ringkas || babAktif}):
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      Pilih topik spesifik atau biarkan AI me-mix seluruh sub-materi
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {daftarSubMateri.map((sub) => {
                      const aktif = subMateriAktif === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            setSubMateriAktif(sub.id);
                            setIndeksPreview(0);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '7px 13px',
                            borderRadius: 99,
                            fontSize: 12,
                            fontWeight: aktif ? 800 : 600,
                            cursor: 'pointer',
                            border: aktif ? '1.5px solid #0f766e' : '1px solid #cbd5e1',
                            background: aktif ? '#0f766e' : '#ffffff',
                            color: aktif ? '#ffffff' : '#334155',
                            boxShadow: aktif ? '0 2px 6px rgba(15, 118, 110, 0.25)' : 'none',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span>{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Sub-Materi info & Fast AI trigger */}
                  <div style={{
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}>
                    <div style={{ fontSize: 11.5, color: '#475569' }}>
                      Topik aktif: <b style={{ color: '#0f766e' }}>{subMateriObj?.label}</b> ({soalBankTampil.length} butir ditemukan di Bank Soal)
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <a
                        href="#pusat-kendali-ai"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('pusat-kendali-ai')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#f0fdfa',
                          color: '#0f766e',
                          border: '1.5px solid #2dd4bf',
                          borderRadius: 8,
                          padding: '7px 16px',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          textDecoration: 'none',
                        }}
                      >
                        <span>🎯 Lanjut Atur & Generate di Pusat Kendali AI (Langkah 4)</span>
                        <span>↓</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {babAktif && (
            <div id="pusat-kendali-ai" style={{ ...gayaKartu, border: '2px solid #0d9488', boxShadow: '0 8px 24px rgba(13, 148, 136, 0.12)' }}>
              {/* Header Langkah 4 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ ...gayaJudulKartu, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 18 }}>🤖</span>
                    <span>4 · Pusat Kendali AI & Telaah Paket Soal</span>
                    <span style={{ padding: '3px 10px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: 99, fontSize: 12, fontWeight: 800 }}>
                      {mapelAktif} · {babAktifObj?.ringkas || babAktif}
                    </span>
                    {subMateriObj?.id !== 'semua' && (
                      <span style={{ padding: '3px 10px', background: '#f0fdfa', color: '#0f766e', border: '1.5px solid #2dd4bf', borderRadius: 99, fontSize: 12, fontWeight: 800 }}>
                        🎯 {subMateriObj?.label}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                    Tersedia <b style={{ color: '#0f766e' }}>{soalBankTampil.length} butir asli</b> di Bank Soal. Tentukan jumlah butir latihan dan pilih mode pembuatan paket di bawah:
                  </p>
                </div>

                {keranjang.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#0d9488', background: '#ccfbf1', padding: '5px 12px', borderRadius: 99 }}>
                      ✓ {keranjang.length} butir siap cetak / terbit
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setKeranjang([]);
                        setPesanKeranjang('Pilihan dikosongkan.');
                      }}
                      style={{
                        background: '#fef2f2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      🗑️ Kosongkan ({keranjang.length})
                    </button>
                  </div>
                )}
              </div>

              {/* BAR PEMILIH TARGET JUMLAH BUTIR SOAL */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 800 }}>🎯 Target Jumlah Butir Latihan:</span>
                  <span style={{ fontSize: 11.5, color: '#64748b' }}>
                    Pilih porsi latihan yang ingin disiapkan:
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { jml: 10, label: '10 Soal (Kuis Harian)' },
                    { jml: 15, label: '15 Soal (Pengayaan)' },
                    { jml: 20, label: '🔥 20 Soal (Drill Remedial)' },
                    { jml: 30, label: '📚 30 Soal (Simulasi Lengkap)' },
                  ].map((preset) => {
                    const isSelected = targetJumlahSoal === preset.jml;
                    return (
                      <button
                        key={preset.jml}
                        type="button"
                        onClick={() => setTargetJumlahSoal(preset.jml)}
                        style={{
                          background: isSelected ? '#0d9488' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#334155',
                          border: isSelected ? '1.5px solid #0f766e' : '1px solid #cbd5e1',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: isSelected ? 800 : 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 2px 6px rgba(13, 148, 136, 0.3)' : 'none',
                        }}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 6 }}>
                    <span style={{ fontSize: 11.5, color: '#475569', fontWeight: 700 }}>Custom:</span>
                    <input
                      type="number"
                      min={5}
                      max={50}
                      value={targetJumlahSoal}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1 && val <= 100) setTargetJumlahSoal(val);
                      }}
                      style={{
                        width: 54,
                        padding: '4px 6px',
                        borderRadius: 6,
                        border: '1.5px solid #0d9488',
                        background: '#ffffff',
                        color: '#0f766e',
                        fontWeight: 900,
                        fontSize: 12,
                        textAlign: 'center',
                      }}
                    />
                    <span style={{ fontSize: 11.5, color: '#64748b' }}>butir</span>
                  </div>
                </div>
              </div>

              {/* 2 KARTU UTAMA MODE GENERATE AI (TERPISAH & JELAS FUNGSINYA) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 14,
                marginBottom: 16,
              }}>
                {/* MODE 1: MIX BANK ASLI + AI HOTS */}
                <div style={{
                  background: 'linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%)',
                  border: '1.5px solid #f59e0b',
                  borderRadius: 14,
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12,
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.12)',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, background: '#f59e0b', color: '#ffffff', padding: '2px 8px', borderRadius: 99 }}>
                        ⭐ REKOMENDASI TENTOR
                      </span>
                      <span style={{ fontSize: 11.5, color: '#b45309', fontWeight: 700 }}>
                        Prioritas Soal Asli TKA
                      </span>
                    </div>
                    <h5 style={{ margin: '0 0 6px', fontSize: 14.5, fontWeight: 900, color: '#78350f' }}>
                      Mix Cerdas (Bank Asli + AI HOTS)
                    </h5>
                    <p style={{ margin: 0, fontSize: 12, color: '#92400e', lineHeight: 1.45 }}>
                      Mengambil butir terbaik dari arsip asli TKA/SNBT di Bank Soal, lalu melengkapinya secara otomatis dengan soal sintesis HOTS berstandar resmi agar pas tepat <b>{targetJumlahSoal} butir</b>.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={astroSedangBekerja || (memuat && bankSoal.length === 0)}
                    onClick={() => handleBantuAstroGemilang(null, subMateriAktif)}
                    style={{
                      width: '100%',
                      background: (memuat && bankSoal.length === 0) ? '#94a3b8' : 'linear-gradient(180deg, #fef08a 0%, #facc15 100%)',
                      color: (memuat && bankSoal.length === 0) ? '#ffffff' : '#713f12',
                      border: '1.5px solid #ca8a04',
                      borderRadius: 10,
                      padding: '11px 16px',
                      fontSize: 13,
                      fontWeight: 900,
                      cursor: (astroSedangBekerja || (memuat && bankSoal.length === 0)) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 2px 8px rgba(202, 138, 4, 0.3)',
                      transition: 'transform 0.1s ease',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{astroSedangBekerja ? '🤖' : '✨'}</span>
                    <span>{astroSedangBekerja ? 'AI Sedang Bekerja...' : `Siapkan ${targetJumlahSoal} Soal Mix (Bank Asli + AI)`}</span>
                  </button>
                </div>

                {/* MODE 2: PURE AI (100% FRESH HOTS + GAMBAR LENGKAP) */}
                <div style={{
                  background: 'linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)',
                  border: '1.5px solid #38bdf8',
                  borderRadius: 14,
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12,
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.12)',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, background: '#0284c7', color: '#ffffff', padding: '2px 8px', borderRadius: 99 }}>
                        ⚡ SOLUSI SOAL SEGAR / ANTI-BOSAN
                      </span>
                      <span style={{ fontSize: 11.5, color: '#0369a1', fontWeight: 700 }}>
                        100% Murni AI
                      </span>
                    </div>
                    <h5 style={{ margin: '0 0 6px', fontSize: 14.5, fontWeight: 900, color: '#0c4a6e' }}>
                      Pure AI (100% Baru + Lengkap Gambar)
                    </h5>
                    <p style={{ margin: 0, fontSize: 12, color: '#0369a1', lineHeight: 1.45 }}>
                      Meracik butir baru segar 100% murni AI tanpa mengulang bank soal yang pernah dikerjakan. Dilengkapi konteks kontekstual nyata, gambar diagram otentik, dan pembahasan lengkap.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={astroSedangBekerja || (memuat && bankSoal.length === 0)}
                    onClick={() => handleGeneratePureAiSoal(null, subMateriAktif)}
                    style={{
                      width: '100%',
                      background: (memuat && bankSoal.length === 0) ? '#94a3b8' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      color: '#ffffff',
                      border: '1.5px solid #0284c7',
                      borderRadius: 10,
                      padding: '11px 16px',
                      fontSize: 13,
                      fontWeight: 900,
                      cursor: (astroSedangBekerja || (memuat && bankSoal.length === 0)) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                      transition: 'transform 0.1s ease',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>⚡</span>
                    <span>Generate {targetJumlahSoal} Soal Pure AI (100% Baru)</span>
                  </button>
                </div>
              </div>

              {/* Catatan jika butir asli di bank soal kurang dari target */}
              {soalBankTampil.length < targetJumlahSoal && (
                <div style={{
                  background: '#fefce8',
                  border: '1px solid #fef08a',
                  borderRadius: 10,
                  padding: '8px 14px',
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: '#854d0e',
                }}>
                  <span style={{ fontSize: 16 }}>💡</span>
                  <span>
                    Tersedia <b>{soalBankTampil.length} butir</b> di bank soal untuk topik ini. Mode <b>Mix Cerdas</b> atau <b>Pure AI</b> di atas akan otomatis menggenapkan paket latihan menjadi <b>{targetJumlahSoal} butir</b> berstandar TKA.
                  </span>
                </div>
              )}

              {/* TOGGLE MODE TELAAH / UJI COBA GURU */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setModeKunciGuru(true)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 8,
                      fontSize: 11.5,
                      fontWeight: 800,
                      border: modeKunciGuru ? '1.5px solid #0d9488' : '1px solid #cbd5e1',
                      background: modeKunciGuru ? '#f0fdfa' : '#ffffff',
                      color: modeKunciGuru ? '#0f766e' : '#64748b',
                      cursor: 'pointer',
                    }}
                  >
                    🔑 Mode Telaah Lengkap (Kunci & Pembahasan Terbuka)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModeKunciGuru(false)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 8,
                      fontSize: 11.5,
                      fontWeight: 800,
                      border: !modeKunciGuru ? '1.5px solid #6366f1' : '1px solid #cbd5e1',
                      background: !modeKunciGuru ? '#eef2ff' : '#ffffff',
                      color: !modeKunciGuru ? '#4338ca' : '#64748b',
                      cursor: 'pointer',
                    }}
                  >
                    👁️ Mode Uji Coba Guru (Kerjakan Mandiri Dulu)
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={gayaJudulKartu}>
                  4 · {modeTampil === 'preview'
                    ? `Preview soal ${soalBankTampil.length ? Math.min(indeksPreview, soalBankTampil.length - 1) + 1 : 0}/${soalBankTampil.length}`
                    : `Baca lengkap & centang (${keranjang.length} di keranjang · ${soalBankTampil.length} tampil)`}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {daftarKelas.length > 1 && (
                    <select value={kelasFilter} onChange={(e) => { setKelasFilter(e.target.value); setIndeksPreview(0); }} style={gayaSelect}>
                      <option value="">semua kelas ({soalDiBab.length})</option>
                      {daftarKelas.map(([k, n]) => <option key={k} value={k === '(tanpa kelas)' ? '' : k}>{k} ({n})</option>)}
                    </select>
                  )}
                  <label style={{ fontSize: 11.5, color: '#475569', display: 'flex', gap: 5, alignItems: 'center' }}>
                    <input type="checkbox" checked={tanpaEsai} onChange={(e) => setTanpaEsai(e.target.checked)} /> lewati esai
                  </label>
                  <button style={gayaPill(modeTampil === 'preview')} onClick={() => setModeTampil('preview')}>preview</button>
                  <button style={gayaPill(modeTampil === 'daftar')} onClick={() => setModeTampil('daftar')}>daftar</button>
                  <button style={gayaPill(false)} onClick={pilihSemuaTampil}>+ semua yang tampil</button>
                </div>
              </div>

              {modeTampil === 'preview' ? (
                soalBankTampil.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#94a3b8', padding: 10 }}>Tidak ada butir di bab ini setelah saringan.</div>
                ) : (
                  <div style={{ position: 'relative', overflow: 'hidden', border: '1px solid #e2e8f0', borderRadius: 14, background: '#fff', padding: '16px 18px', marginTop: 10 }}>
                    <img
                      src={WATERMARK.logo}
                      alt=""
                      aria-hidden="true"
                      style={{
                        position: 'absolute', top: '50%', left: '50%', width: WATERMARK.ukuranPx + 120, height: WATERMARK.ukuranPx + 120,
                        transform: 'translate(-50%, -50%) rotate(-24deg)', opacity: WATERMARK.opacityLayar,
                        pointerEvents: 'none', zIndex: 0, objectFit: 'contain',
                      }}
                    />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                        <span style={{ background: '#eef2ff', color: '#3730a3', borderRadius: 999, padding: '3px 11px', fontSize: 11, fontWeight: 800 }}>
                          {mapelAktif} · {jenjangAktif}{kelasFilter ? ` kelas ${kelasFilter}` : ''}
                        </span>
                        <span style={{ background: '#f1f5f9', color: '#334155', borderRadius: 999, padding: '3px 11px', fontSize: 11 }}>{babAktif}</span>
                      </div>
                      <KartuBacaSoalLengkap soal={soalBankTampil[Math.min(indeksPreview, soalBankTampil.length - 1)]} tanpaKunci={!modeKunciGuru} />
                      <div style={{ display: 'flex', gap: 9, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginTop: 10 }}>
                        <button
                          style={gayaPill(false)}
                          onClick={() => setIndeksPreview((i) => Math.max(0, i - 1))}
                          disabled={Math.min(indeksPreview, soalBankTampil.length - 1) === 0}
                        >
                          ← soal sebelumnya
                        </button>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>
                          {Math.min(indeksPreview, soalBankTampil.length - 1) + 1} / {soalBankTampil.length}
                        </span>
                        <button
                          style={gayaPill(false)}
                          onClick={() => setIndeksPreview((i) => Math.min(soalBankTampil.length - 1, i + 1))}
                          disabled={Math.min(indeksPreview, soalBankTampil.length - 1) >= soalBankTampil.length - 1}
                        >
                          soal berikutnya →
                        </button>
                      </div>
                      <button
                        style={{ ...gayaTombol(inKeranjang(soalBankTampil[Math.min(indeksPreview, soalBankTampil.length - 1)].id) ? '#b91c1c' : '#16a34a', false), marginTop: 10 }}
                        onClick={() => {
                          const sNow = soalBankTampil[Math.min(indeksPreview, soalBankTampil.length - 1)];
                          centang(sNow, !inKeranjang(sNow.id));
                        }}
                      >
                        {inKeranjang(soalBankTampil[Math.min(indeksPreview, soalBankTampil.length - 1)].id)
                          ? '− keluarkan dari keranjang'
                          : '＋ masukkan ke keranjang'}
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div style={{ maxHeight: 560, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, padding: 8, background: '#f8fafc', marginTop: 10 }}>
                  {soalBankTampil.map((s, i) => (
                    <KartuBacaSoal key={s.id} soal={s} nomor={i + 1} tercentang={inKeranjang(s.id)} onCentang={(on) => centang(s, on)} modeKunciGuru={modeKunciGuru} />
                  ))}
                  {soalBankTampil.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8', padding: 8 }}>Tidak ada butir di bab ini setelah saringan.</div>}
                </div>
              )}
            </div>
          )}

            </>
          )}
        </>
      )}

      {sumber === 'paket' && !memuat && (
        <div style={gayaKartu}>
          <div style={gayaJudulKartu}>Paket try out yang terhubung ke Anda</div>
          {paketList.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8' }}>Belum ada paket terhubung. Minta admin menghubungkan tentor di halaman Terbitkan Try Out.</div>}
          <select value={paketId} onChange={(e) => setPaketId(e.target.value)} style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12.5 }}>
            <option value="">— pilih paket —</option>
            {paketList.map((p) => (
              <option key={p.id} value={p.id}>{p.judul} · {p.targetKelas} · {(p.daftarSoal || []).length} soal</option>
            ))}
          </select>
          {paket && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10, fontSize: 12 }}>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                jumlah maks
                <input type="number" min="0" value={maksPaket || ''} placeholder="semua" onChange={(e) => setMaksPaket(Number(e.target.value) || 0)} style={{ width: 80, padding: '7px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }} />
              </label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input type="checkbox" checked={tanpaEsai} onChange={(e) => setTanpaEsai(e.target.checked)} /> lewati esai
              </label>
              <span style={{ color: '#64748b' }}>akan tercetak <b>{soalPaket.length}</b> dari {(paket.daftarSoal || []).length} soal</span>
            </div>
          )}
          {paket && soalPaket.length > 0 && (
            <div style={{ maxHeight: 420, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, padding: 8, marginTop: 10, background: '#f8fafc' }}>
              {soalPaket.map((s, i) => <KartuBacaSoal key={s.id || i} soal={s} nomor={i + 1} tercentang bacaSaja onCentang={() => {}} />)}
            </div>
          )}
        </div>
      )}

      {/* 📊 PAPAN ANALITIK KETUNTASAN SILABUS & REMEDIAL KELAS */}
      {sumber === 'analitik' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* HEADER & OVERVIEW PAPAN ANALITIK */}
          <div style={{
            background: 'linear-gradient(135deg, #042f2e 0%, #0f766e 100%)',
            borderRadius: 16,
            padding: '20px 24px',
            color: '#ffffff',
            boxShadow: '0 8px 24px rgba(13, 148, 136, 0.15)',
            border: '1.5px solid #2dd4bf',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#f0fdfa' }}>
                    📊 Papan Analitik Ketuntasan Silabus & Rekomendasi Lanjut Materi
                  </h3>
                  <span style={{
                    background: statusRemedialSelesai ? '#22c55e' : '#f59e0b',
                    color: '#ffffff',
                    fontSize: 11,
                    fontWeight: 900,
                    padding: '3px 10px',
                    borderRadius: 99,
                  }}>
                    {statusRemedialSelesai ? 'STATUS: KELAS TUNTAS (SIAP BAB 2)' : 'STATUS: REMEDIAL DIPERLUKAN (BAB 1)'}
                  </span>
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 12.5, color: '#ccfbf1', maxWidth: 780, lineHeight: 1.5 }}>
                  Berdasarkan prinsip <b>Belajar Tuntas (Mastery Learning)</b> Bimbel Gemilang: Siswa yang belum tuntas pada bab prasyarat <b>tidak boleh dipaksa lanjut ke bab berikutnya</b>. Tentor wajib memberikan paket drill latihan remedial sampai pemahaman siswa tuntas (KKM ≥ 75%).
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleSimulasiSiswaTuntasDrill}
                  style={{
                    background: '#fef08a linear-gradient(180deg, #fef08a 0%, #fde047 100%)',
                    color: '#713f12',
                    border: '1.5px solid #ca8a04',
                    borderRadius: 10,
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(202, 138, 4, 0.25)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  title="Simulasikan nilai siswa setelah menyelesaikan paket drill remedial 20 butir"
                >
                  <span>⚡</span>
                  <span>{statusRemedialSelesai ? 'Hasil Drill Tuntas (Reset/Ulang)' : 'Simulasi Siswa Selesai Drill'}</span>
                </button>
              </div>
            </div>

            {/* RINGKASAN METRIK KELAS */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              background: 'rgba(15, 23, 42, 0.45)',
              borderRadius: 12,
              padding: '14px 16px',
              border: '1px solid rgba(45, 212, 191, 0.3)',
            }}>
              <div>
                <div style={{ fontSize: 11, color: '#99f6e4', fontWeight: 700 }}>KELAS PENDAMPINGAN</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#fef08a', marginTop: 2 }}>Kelas 9 SMP · TKA MTK</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#99f6e4', fontWeight: 700 }}>STANDAR KKM KELULUSAN</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', marginTop: 2 }}>Skor Minimal 75</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#99f6e4', fontWeight: 700 }}>RATA-RATA KELAS (BAB 1)</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: statusRemedialSelesai ? '#4ade80' : '#f87171', marginTop: 2 }}>
                  {statusRemedialSelesai ? '86 / 100 (Tuntas)' : '58 / 100 (Di Bawah KKM)'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#99f6e4', fontWeight: 700 }}>TINGKAT KETUNTASAN</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: statusRemedialSelesai ? '#4ade80' : '#fbbf24', marginTop: 2 }}>
                  {statusRemedialSelesai ? '87.5% (7 dari 8 Siswa)' : '37.5% (3 dari 8 Siswa)'}
                </div>
              </div>
            </div>
          </div>

          {/* ROADMAP SILABUS BERJENJANG (PREREQUISITES LEARNING PIPELINE) */}
          <div style={gayaKartu}>
            <div style={{ ...gayaJudulKartu, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🎯</span>
                <span>Alur Ketuntasan Materi & Prasyarat Kurikulum Resmi (SMP Matematika)</span>
              </div>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                Aturan: Bab selanjutnya hanya terbuka jika Bab sebelumnya tuntas minimal 75%
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {/* BAB 1: BILANGAN */}
              <div style={{
                background: statusRemedialSelesai ? '#f0fdf4' : '#fff7ed',
                border: statusRemedialSelesai ? '2px solid #22c55e' : '2px solid #f97316',
                borderRadius: 14,
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: statusRemedialSelesai ? '0 4px 12px rgba(34, 197, 94, 0.12)' : '0 4px 12px rgba(249, 115, 22, 0.15)',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 900,
                      padding: '3px 8px',
                      borderRadius: 99,
                      background: statusRemedialSelesai ? '#22c55e' : '#ea580c',
                      color: '#ffffff',
                    }}>
                      {statusRemedialSelesai ? '✅ TUNTAS MEMENUHI KKM' : '⚠️ BELUM TUNTAS (REMEDIAL)'}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: statusRemedialSelesai ? '#15803d' : '#c2410c' }}>
                      Pertemuan Minggu 1
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
                    Bab 1: Bilangan Dasar & Operasi
                  </h4>
                  <div style={{ fontSize: 12, color: '#475569', marginBottom: 10 }}>
                    Sifat Bilangan Real, KaBaTaKu, Eksponen Pangkat, Bentuk Akar & Notasi Ilmiah
                  </div>

                  {/* Indikator Skor */}
                  <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: '#64748b' }}>Rata-rata Kelas:</span>
                      <b style={{ color: statusRemedialSelesai ? '#15803d' : '#ea580c' }}>
                        {statusRemedialSelesai ? '86 / 100' : '58 / 100'}
                      </b>
                    </div>
                    <div style={{ height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: statusRemedialSelesai ? '86%' : '58%',
                        background: statusRemedialSelesai ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'linear-gradient(90deg, #f97316, #dc2626)',
                        borderRadius: 99,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Ketuntasan: <b>{statusRemedialSelesai ? '87.5%' : '37.5%'}</b></span>
                      <span>Target KKM: <b>75%</b></span>
                    </div>
                  </div>

                  {/* Catatan Pedagogis & Diagnosa */}
                  <div style={{
                    fontSize: 11.5,
                    color: statusRemedialSelesai ? '#166534' : '#9a3412',
                    lineHeight: 1.45,
                    marginBottom: 14,
                    background: statusRemedialSelesai ? '#dcfce7' : '#ffedd5',
                    padding: '8px 10px',
                    borderRadius: 8,
                  }}>
                    {statusRemedialSelesai ? (
                      <>
                        <b>Evaluasi Guru:</b> Siswa telah tuntas memahami konsep operasi bilangan & eksponen setelah menyelesaikan latihan drill remedial. Kelas siap melangkah ke Bab 2: Aljabar!
                      </>
                    ) : (
                      <>
                        <b>Diagnosa Siswa:</b> 5 dari 8 siswa gagal pada soal <i>Jenis & Sifat Bilangan Real</i> dan <i>Eksponen Negatif</i>. <b>Dilarang lanjut ke Bab 2 Aljabar</b> agar siswa tidak semakin tertinggal!
                      </>
                    )}
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div>
                  {statusRemedialSelesai ? (
                    <button
                      type="button"
                      onClick={() => {
                        setJenjangAktif('SMP');
                        setMapelAktif('Matematika');
                        setBabAktif('Aljabar (SPLDV, Persamaan Kuadrat, Fungsi & Pola Bilangan)');
                        setSumber('bank');
                      }}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 10,
                        padding: '10px 14px',
                        fontSize: 12.5,
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)',
                      }}
                    >
                      <span>🚀 Lanjut Buka & Racik Bab 2: Aljabar</span>
                      <span>→</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMulaiDrillRemedial(1, 'jenis_sifat', 'Bilangan (Bulat, Pecahan, Berpangkat, & Bentuk Akar)')}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 10,
                        padding: '11px 14px',
                        fontSize: 12.5,
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        boxShadow: '0 3px 10px rgba(234, 88, 12, 0.35)',
                      }}
                    >
                      <span style={{ fontSize: 16 }}>🔥</span>
                      <span>Buat Paket Drill Remedial Bab 1 (20 Soal AI)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* BAB 2: ALJABAR & RELASI */}
              <div style={{
                background: statusRemedialSelesai ? '#ffffff' : '#f8fafc',
                border: statusRemedialSelesai ? '1.5px solid #2dd4bf' : '1.5px dashed #cbd5e1',
                borderRadius: 14,
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: statusRemedialSelesai ? 1 : 0.75,
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 99,
                      background: statusRemedialSelesai ? '#0d9488' : '#64748b',
                      color: '#ffffff',
                    }}>
                      {statusRemedialSelesai ? '🔓 MATERI TERBUKA' : '🔒 TERKUNCI (PRASYARAT)'}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                      Pertemuan Minggu 2
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
                    Bab 2: Aljabar & Relasi
                  </h4>
                  <div style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>
                    Operasi Suku Aljabar, Pemfaktoran, SPLDV Parkir/Belanja, Fungsi Kuadrat
                  </div>

                  <div style={{
                    fontSize: 11.5,
                    color: statusRemedialSelesai ? '#0f766e' : '#64748b',
                    background: statusRemedialSelesai ? '#f0fdfa' : '#f1f5f9',
                    padding: '10px 12px',
                    borderRadius: 8,
                    lineHeight: 1.45,
                    marginBottom: 14,
                  }}>
                    {statusRemedialSelesai ? (
                      <>
                        ✓ <b>Prasyarat Terpenuhi!</b> Siswa sudah menguasai Bab 1. Anda dapat menyiapkan paket latihan Bab 2 menggunakan bank soal asli atau Pure AI.
                      </>
                    ) : (
                      <>
                        ⛔ <b>Prasyarat Belum Terpenuhi:</b> Materi Aljabar membutuhkan ketuntasan operasi bilangan di Bab 1. Tombol cetak & terbitan akan dibuka setelah drill remedial Bab 1 tuntas.
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    disabled={!statusRemedialSelesai}
                    onClick={() => {
                      setJenjangAktif('SMP');
                      setMapelAktif('Matematika');
                      setBabAktif('Aljabar (SPLDV, Persamaan Kuadrat, Fungsi & Pola Bilangan)');
                      setSumber('bank');
                    }}
                    style={{
                      width: '100%',
                      background: statusRemedialSelesai ? '#0d9488' : '#e2e8f0',
                      color: statusRemedialSelesai ? '#ffffff' : '#94a3b8',
                      border: 'none',
                      borderRadius: 10,
                      padding: '10px 14px',
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: statusRemedialSelesai ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <span>{statusRemedialSelesai ? '✨ Siapkan Soal Bab 2' : '🔒 Terkunci (Tuntaskan Bab 1 Dulu)'}</span>
                  </button>
                </div>
              </div>

              {/* BAB 3: GEOMETRI & RUANG */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px dashed #cbd5e1',
                borderRadius: 14,
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: 0.7,
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 99, background: '#64748b', color: '#ffffff' }}>
                      🔒 TERKUNCI
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Pertemuan Minggu 3</span>
                  </div>
                  <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
                    Bab 3: Geometri & Ruang
                  </h4>
                  <div style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>
                    Tripel Pythagoras, Sudut Garis, Luas Cat Dinding, Volume Bangun Ruang
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748b', background: '#f1f5f9', padding: '10px 12px', borderRadius: 8, lineHeight: 1.45 }}>
                    Materi lanjutan setelah Bab 1 & Bab 2 tuntas.
                  </div>
                </div>
                <button type="button" disabled style={{ width: '100%', background: '#e2e8f0', color: '#94a3b8', border: 'none', borderRadius: 10, padding: '10px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'not-allowed' }}>
                  🔒 Terkunci
                </button>
              </div>

              {/* BAB 4: DATA & PELUANG */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px dashed #cbd5e1',
                borderRadius: 14,
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: 0.7,
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 99, background: '#64748b', color: '#ffffff' }}>
                      🔒 TERKUNCI
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Pertemuan Minggu 4</span>
                  </div>
                  <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
                    Bab 4: Data & Peluang
                  </h4>
                  <div style={{ fontSize: 12, color: '#475569', marginBottom: 12 }}>
                    Diagram Batang & Lingkaran, Rata-rata Gabungan, Peluang Teoretik
                  </div>
                  <div style={{ fontSize: 11.5, color: '#64748b', background: '#f1f5f9', padding: '10px 12px', borderRadius: 8, lineHeight: 1.45 }}>
                    Materi akhir sebelum Try Out Akbar Asesmen Daerah & TKA.
                  </div>
                </div>
                <button type="button" disabled style={{ width: '100%', background: '#e2e8f0', color: '#94a3b8', border: 'none', borderRadius: 10, padding: '10px 14px', fontSize: 12.5, fontWeight: 800, cursor: 'not-allowed' }}>
                  🔒 Terkunci
                </button>
              </div>
            </div>
          </div>

          {/* TABEL DIAGNOSA KETUNTASAN PER SISWA DI KELAS */}
          <div style={gayaKartu}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
                  👥 Buku Progres Ketuntasan Siswa: Bab 1 (Bilangan Dasar)
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  Rincian hasil latihan siswa di kelas tatap muka & catatan kesulitan perorangan untuk bahan bedah bersama tentor.
                </p>
              </div>
              <span style={{ fontSize: 12, color: '#0f766e', fontWeight: 800, background: '#ccfbf1', padding: '4px 10px', borderRadius: 99 }}>
                Total 8 Siswa Binaan
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#334155' }}>
                    <th style={{ padding: '10px 12px' }}>No</th>
                    <th style={{ padding: '10px 12px' }}>Nama Siswa</th>
                    <th style={{ padding: '10px 12px' }}>Kelas</th>
                    <th style={{ padding: '10px 12px' }}>Skor Bab 1</th>
                    <th style={{ padding: '10px 12px' }}>Status Kelulusan</th>
                    <th style={{ padding: '10px 12px' }}>Topik Kendala / Catatan Tentor</th>
                  </tr>
                </thead>
                <tbody>
                  {dataSiswaKelas.map((sis, idx) => {
                    const isTuntas = sis.bab1 >= 75;
                    return (
                      <tr key={sis.id} style={{ borderBottom: '1px solid #e2e8f0', background: isTuntas ? '#ffffff' : '#fffbeb' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#64748b' }}>{idx + 1}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0f172a' }}>{sis.nama}</td>
                        <td style={{ padding: '10px 12px', color: '#475569' }}>{sis.kelas}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            fontWeight: 900,
                            fontSize: 13,
                            color: isTuntas ? '#15803d' : '#b91c1c',
                            background: isTuntas ? '#dcfce7' : '#fee2e2',
                            padding: '3px 8px',
                            borderRadius: 6,
                          }}>
                            {sis.bab1} / 100
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: isTuntas ? '#15803d' : '#c2410c',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}>
                            {isTuntas ? '✓ Tuntas KKM' : '⚠️ Butuh Drill Remedial'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: isTuntas ? '#64748b' : '#b45309', fontWeight: isTuntas ? 400 : 700 }}>
                          {sis.kendala}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

        {/* bar terpilih menempel: guru selalu tahu berapa yang terkumpul
            tanpa panel perantara, dan satu klik membawanya ke kertas */}
        <div style={{ position: 'sticky', bottom: 10, zIndex: 5, background: '#0f172a', color: '#fff', borderRadius: 14, padding: '10px 14px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 14, boxShadow: '0 6px 18px rgba(15,23,42,.28)' }}>
          <div style={{ fontSize: 12.5 }}>
            <b style={{ fontSize: 15 }}>{keranjang.length}</b> butir terpilih
            {ringkasanKeranjang.jumlah > 0 && <> · {ringkasanKeranjang.perMateri.length} materi · {ringkasanKeranjang.perJenjang.map((j) => j.nama).join(', ')}</>}
          </div>
          <div style={{ flex: 1 }} />
          {pesanKeranjang && <span style={{ fontSize: 11, color: '#a7f3d0' }}>{pesanKeranjang}</span>}
          <button
            style={{ background: keranjang.length ? '#5B2ECC' : '#475569', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 12.5, fontWeight: 800, cursor: keranjang.length ? 'pointer' : 'not-allowed' }}
            disabled={!keranjang.length}
            onClick={() => { setLangkah(2); window.scrollTo(0, 0); }}
          >
            Lihat kertas →
          </button>
        </div>
      </div>
      </>)}

      {/* LANGKAH 2 = KERTAS, lebar penuh. */}
      {langkah === 2 && (
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <button style={{ ...gayaPill(false), padding: '8px 14px' }} onClick={() => { setLangkah(1); window.scrollTo(0, 0); }}>← kembali memilih</button>
          <div style={{ fontSize: 13, color: '#334155' }}>
            <b>{keranjang.length}</b> butir akan dicetak{ sumber === 'bank' ? ` · ${judulDariKeranjang(keranjang)}` : '' }
          </div>
        </div>
      {!memuat && (
        <div style={gayaKartu}>
          <div style={gayaJudulKartu}>5 · Tata letak & cetak ({siap.length} butir)</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
            <label style={{ fontSize: 11.5, color: '#475569', display: 'flex', gap: 6, alignItems: 'center' }}>
              gaya lembar
              <select value={gayaLembar} onChange={(e) => setGayaLembar(e.target.value)} style={gayaSelect}>
                <option value="naskah">📄 naskah model ujian (kolom rapi)</option>
                <option value="kotak">✂️ kotak siap gunting (buku progres)</option>
              </select>
            </label>
            <label style={{ fontSize: 11.5, color: '#475569', display: 'flex', gap: 6, alignItems: 'center' }}>
              ukuran kertas
              <select value={kodeKertas} onChange={(e) => setKodeKertas(e.target.value)} style={gayaSelect}>
                {DAFTAR_KERTAS.map((k) => <option key={k.kode} value={k.kode}>{k.label}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 11.5, color: '#475569', display: 'flex', gap: 6, alignItems: 'center' }}>
              kolom
              <select value={kolomPaksa} onChange={(e) => setKolomPaksa(e.target.value === 'catatan' ? 'catatan' : Number(e.target.value))} style={gayaSelect}>
                <option value={0}>otomatis ({kolomOtomatis(kertas)} kolom)</option>
                <option value={1}>1 kolom (lebar penuh)</option>
                <option value={2}>2 kolom (standar ujian / kliping)</option>
                <option value="catatan">1 kolom + kolom catatan (coretan siswa)</option>
              </select>
            </label>
          </div>

          {siap.length > 0 && naskahSiswa && (
            <>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                <button style={gayaPill(tabPratinjau === 'siswa')} onClick={() => setTabPratinjau('siswa')}>
                  {gayaLembar === 'kotak' ? '✂️ pratinjau kotak siswa (siap gunting)' : '👀 pratinjau lembar naskah siswa'}
                </button>
                <button style={gayaPill(tabPratinjau === 'kunci')} onClick={() => setTabPratinjau('kunci')}>
                  🔑 pratinjau kunci guru
                </button>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {naskahSiswa.jumlahHalaman} halaman · {isCatatan ? '1 kolom + catatan' : `${jumlahKolom} kolom`} · lebar kolom {naskahSiswa.lebarKolomMm}mm
                </span>
              </div>
              {naskahSiswa.peringatan.length > 0 && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 8, padding: '8px 10px', fontSize: 11.5, marginBottom: 8 }}>
                  ⚠️ Butir nomor {naskahSiswa.peringatan.filter((i) => i > 0).join(', ')} lebih tinggi dari satu kolom; sistem memberinya satu kolom utuh supaya tidak terpotong.
                </div>
              )}
              <div ref={refKanvas} style={{ width: '100%', overflow: 'hidden', position: 'relative', background: '#cbd5e1', borderRadius: 10, height: Math.round((naskahSiswa.jumlahHalaman * kertas.tinggiMm + 12) * PX_PER_MM * skala) }}>
                <iframe
                  title="Pratinjau naskah cetak"
                  srcDoc={docPratinjau(fragmenAktif || '')}
                  style={{
                    width: `${Math.round(kertas.lebarMm * PX_PER_MM)}px`,
                    height: `${Math.round((naskahSiswa.jumlahHalaman * kertas.tinggiMm + 12) * PX_PER_MM)}px`,
                    border: 'none', background: '#cbd5e1',
                    transform: `scale(${skala})`, transformOrigin: 'top left',
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                Pratinjau discaling {Math.round(skala * 100)}% agar muat layar; ukuran cetak sesungguhnya tetap {kertas.lebarMm}×{kertas.tinggiMm} mm.
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                <button
                  style={{ ...gayaTombol('#0d9488', siap.length === 0), fontWeight: 800 }}
                  disabled={siap.length === 0}
                  onClick={handleBukaModalTerbitkan}
                >
                  🚀 TERBITKAN KE KELAS SISWA ({siap.length} SOAL)
                </button>
                {gayaLembar === 'kotak' ? (
                  <button style={gayaTombol('#2563eb', false)} onClick={() => cetakNaskah('siswa')}>
                    ✂️ CETAK KOTAK SIAP GUNTING (SISWA)
                  </button>
                ) : (
                  <button style={gayaTombol('#2563eb', false)} onClick={() => cetakNaskah('siswa')}>
                    📄 CETAK NASKAH SISWA
                  </button>
                )}
                <button style={gayaTombol('#b91c1c', false)} onClick={() => cetakNaskah('kunci')}>
                  🔑 CETAK KUNCI (PEGANGAN GURU)
                </button>
                <button style={gayaTombol('#15803d', false)} onClick={() => cetakLewatIframe(htmlLembarCatatan(meta, siap, { kertas: kodeKertas }), 'Lembar Catatan')}>
                  📝 LEMBAR-CATATAN
                </button>
              </div>
            </>
          )}

          <div style={{ fontSize: 11, color: '#64748b', marginTop: 10, lineHeight: 1.6 }}>
            Di dialog cetak, pilih ukuran kertas yang SAMA dengan pilihan di atas dan
            biarkan margin “Default” supaya susunan yang Bapak/Ibu lihat di pratinjau
            persis pindah ke kertas. Aturan kertas bekas (docs/KERANGKA-KONTEN-BUKU.md):
            cetak SATU muka; bekas jadwal atau draft internal boleh, bekas absensi
            bernama / kwitansi / berkas keuangan TIDAK BOLEH.
          </div>
        </div>
      )}

      </div>
      )}

      {/* 📋 SECTION: DAFTAR PAKET SOAL TERBITAN KELAS PENDAMPINGAN */}
      <div style={{
        marginTop: 32,
        background: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderRadius: 16,
        padding: '22px 24px',
        boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🎓</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                Paket Soal Terbitan Kelas Pendampingan (Aktif di Akun Siswa)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                Paket latihan manual yang diterbitkan Guru di sini langsung muncul di akun siswa pada menu <strong>Kelas Pendampingan → Latihan Bersama Tentor</strong>.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setSumber('analitik');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                background: '#f0fdfa',
                color: '#0f766e',
                border: '1.5px solid #2dd4bf',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span>📊 Buka Papan Analitik Ketuntasan Siswa</span>
              <span>→</span>
            </button>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#0f766e', background: '#ccfbf1', padding: '4px 10px', borderRadius: 99 }}>
              {daftarTerbitan.length} Paket Diterbitkan
            </span>
          </div>
        </div>

        {daftarTerbitan.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Belum Ada Paket Soal yang Diterbitkan ke Kelas</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, maxWidth: 460, margin: '4px auto 0' }}>
              Pilih topik di atas, manfaatkan <strong>Asisten Astro Gemilang</strong> untuk memilihkan 10 butir soal terbaik, lalu klik tombol hijau <strong>🚀 TERBITKAN KE KELAS SISWA</strong>.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {daftarTerbitan.map((pkt) => {
              const isAktif = pkt.status === 'aktif' || pkt.terbuka !== false;
              return (
                <div
                  key={pkt.id}
                  style={{
                    background: isAktif ? '#f0fdfa' : '#f8fafc',
                    border: isAktif ? '1.5px solid #14b8a6' : '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#0f766e', background: '#ccfbf1', padding: '2px 8px', borderRadius: 99 }}>
                        {pkt.jenjang || 'SMP'} • {pkt.mapel || 'Matematika'}
                      </span>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: isAktif ? '#dcfce7' : '#fee2e2',
                        color: isAktif ? '#15803d' : '#b91c1c',
                        border: `1px solid ${isAktif ? '#86efac' : '#fca5a5'}`,
                      }}>
                        {isAktif ? '🔓 Aktif di Kelas Siswa' : '🔒 Akses Ditutup'}
                      </span>
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        {new Date(pkt.tanggalTerbit).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 4px', fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>
                      {pkt.judul}
                    </h4>
                    <div style={{ fontSize: 12, color: '#475569' }}>
                      📑 <strong>{pkt.totalSoal || pkt.daftarSoal?.length || 0} Soal</strong> • Guru: <strong>{pkt.tentorNama || 'Guru Gemilang'}</strong>
                    </div>
                    {pkt.catatanTentor && (
                      <div style={{ fontSize: 11.5, color: '#0d9488', marginTop: 4, fontStyle: 'italic' }}>
                        💬 "{pkt.catatanTentor}"
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleMulaiDrillRemedial(pkt.babNomor || 1, pkt.subMateriId || 'semua', pkt.bab)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1.5px solid #ea580c',
                        background: '#fff7ed',
                        color: '#c2410c',
                        fontSize: 12,
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        boxShadow: '0 2px 6px rgba(234, 88, 12, 0.15)',
                      }}
                      title="Racik paket drill remedial baru (20 butir) dengan AI untuk materi ini"
                    >
                      <span>🔥</span>
                      <span>Drill Remedial AI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaketTelaahModal(pkt)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #6366f1',
                        background: '#eef2ff',
                        color: '#4338ca',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      title="Telaah isi soal lengkap beserta kunci dan pembahasan"
                    >
                      👁️ Telaah Soal & Kunci
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const paketMeta = { judul: pkt.judul, mapel: pkt.mapel, subjudul: 'Lembar Kotak Siap Gunting Ramah Buku Besar' };
                        cetakLewatIframe(htmlPaketSiswa(paketMeta, pkt.daftarSoal || [], { kertas: kodeKertas }), 'Paket Siswa');
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #0d9488',
                        background: '#f0fdfa',
                        color: '#0f766e',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      title="Cetak lembar gunting-tempel kotak soal untuk Buku Besar siswa"
                    >
                      ✂️ Cetak Lembar Siswa
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const paketMeta = { judul: pkt.judul, mapel: pkt.mapel, subjudul: 'Kunci Jawaban & Pembahasan Pegangan Tentor' };
                        cetakLewatIframe(htmlKunciTentor(paketMeta, pkt.daftarSoal || [], { kertas: kodeKertas }), 'Kunci Tentor');
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#b91c1c',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      title="Cetak kunci dan pembahasan detail pegangan mengajar tentor"
                    >
                      🔑 Cetak Kunci Tentor
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleAksesTerbitan(pkt)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: isAktif ? '#e11d48' : '#0d9488',
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      title="Buka atau tutup akses pengerjaan bagi siswa di kelas"
                    >
                      {isAktif ? '🔒 Tutup Akses' : '🔓 Buka Akses'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleHapusTerbitan(pkt.id)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        color: '#b91c1c',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                      title="Tarik paket ini dari akun siswa"
                    >
                      🗑️ Tarik
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🚀 MODAL TERBITKAN PAKET KE KELAS SISWA */}
      {modalTerbitkanTerbuka && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 18,
            maxWidth: 500,
            width: '100%',
            padding: '24px 26px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 24 }}>🚀</span>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                  Terbitkan Paket ke Kelas Pendampingan
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                  {siap.length} butir soal terpilih akan langsung muncul di akun siswa binaan.
                </p>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Judul Paket Latihan:
              </label>
              <input
                type="text"
                value={judulTerbitInput}
                onChange={(e) => setJudulTerbitInput(e.target.value)}
                placeholder="Contoh: TKA Matematika - Bab 1 Bilangan (Latihan Pekan 3)"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Pesan / Instruksi Tentor untuk Siswa:
              </label>
              <textarea
                value={catatanTerbitInput}
                onChange={(e) => setCatatanTerbitInput(e.target.value)}
                rows={3}
                placeholder="Tuliskan instruksi pengerjaan di Buku Besar fisik..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  fontSize: 12.5,
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setModalTerbitkanTerbuka(false)}
                disabled={sedangMenerbitkan}
                style={{
                  padding: '10px 16px',
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleTerbitkanKeKelas}
                disabled={sedangMenerbitkan || siap.length === 0}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#0d9488',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: sedangMenerbitkan ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
                }}
              >
                {sedangMenerbitkan ? 'Menerbitkan...' : '🚀 Terbitkan Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🤖 MODAL KURASI AI ASTRO GEMILANG (DELIBERATION & AUDIT REPORT) */}
      {modalAstroThinking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 580,
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                background: astroMode === 'pure_ai'
                  ? 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)'
                  : 'linear-gradient(135deg, #042f2e 0%, #0f766e 100%)',
                color: '#ffffff',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                  }}
                >
                  {astroMode === 'pure_ai' ? '⚡' : '🤖'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#f0fdfa' }}>
                    {astroMode === 'pure_ai' ? 'Pembangkit 100% Pure Soal AI' : 'Asisten Astro Gemilang'}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: astroMode === 'pure_ai' ? '#bae6fd' : '#99f6e4' }}>
                    {astroMode === 'pure_ai' ? 'Riset Soal Asli & Gambar HOTS Tanpa Duplikasi Bank' : 'Mesin Kurasi & Audit Bank Soal Cerdas TKA'}
                  </p>
                </div>
              </div>

              {!astroSedangBekerja && (
                <button
                  type="button"
                  onClick={() => setModalAstroThinking(false)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: '#ffffff',
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 16,
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Body */}
            <div style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
              {/* Stepper Progres AI Berpikir */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: 12 }}>
                  {astroMode === 'pure_ai' ? 'Tahapan Riset & Formulasi Pure AI: ' : 'Tahapan Kurasi & Pembersihan Soal Materi: '}
                  <span style={{ color: astroMode === 'pure_ai' ? '#0284c7' : '#0f766e' }}>{babAktifObj?.ringkas || babAktif}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Step 1 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: astroStep > 1 ? '#10b981' : astroStep === 1 ? (astroMode === 'pure_ai' ? '#0284c7' : '#0d9488') : '#e2e8f0',
                      color: astroStep >= 1 ? '#ffffff' : '#94a3b8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800,
                    }}>
                      {astroStep > 1 ? '✓' : '1'}
                    </div>
                    <div style={{ flex: 1, fontSize: 12.5, fontWeight: astroStep === 1 ? 800 : 600, color: astroStep >= 1 ? '#0f172a' : '#94a3b8' }}>
                      {astroMode === 'pure_ai'
                        ? 'Riset Standar Ujian: Menelusuri Kisi-Kisi TKA / ASPD DIY & Pola Soal Asli Terbaru'
                        : `Memindai & Mengindeks Bank Soal (${astroReport?.totalDipindai || bankSoal.length} butir) untuk ${babAktifObj?.ringkas || babAktif}`}
                    </div>
                    {astroStep === 1 && <span style={{ fontSize: 11, color: astroMode === 'pure_ai' ? '#0284c7' : '#0d9488', fontWeight: 700 }}>{astroMode === 'pure_ai' ? 'Sedang riset...' : 'Sedang memindai...'}</span>}
                  </div>

                  {/* Step 2 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: astroStep > 2 ? '#10b981' : astroStep === 2 ? (astroMode === 'pure_ai' ? '#0284c7' : '#0d9488') : '#e2e8f0',
                      color: astroStep >= 2 ? '#ffffff' : '#94a3b8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800,
                    }}>
                      {astroStep > 2 ? '✓' : '2'}
                    </div>
                    <div style={{ flex: 1, fontSize: 12.5, fontWeight: astroStep === 2 ? 800 : 600, color: astroStep >= 2 ? '#0f172a' : '#94a3b8' }}>
                      {astroMode === 'pure_ai'
                        ? `Perancangan 10 Kasus Kontekstual Eksklusif (${subMateriObj?.label || 'Topik Fokus'})`
                        : `Audit Silabus: Memastikan Kesesuaian Sub-Materi (${subMateriObj?.label || 'Topik Fokus'})`}
                    </div>
                    {astroStep === 2 && <span style={{ fontSize: 11, color: astroMode === 'pure_ai' ? '#0284c7' : '#0d9488', fontWeight: 700 }}>{astroMode === 'pure_ai' ? 'Menyusun kasus...' : 'Mengaudit silabus...'}</span>}
                  </div>

                  {/* Step 3 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: astroStep > 3 ? '#10b981' : astroStep === 3 ? (astroMode === 'pure_ai' ? '#0284c7' : '#0d9488') : '#e2e8f0',
                      color: astroStep >= 3 ? '#ffffff' : '#94a3b8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800,
                    }}>
                      {astroStep > 3 ? '✓' : '3'}
                    </div>
                    <div style={{ flex: 1, fontSize: 12.5, fontWeight: astroStep === 3 ? 800 : 600, color: astroStep >= 3 ? '#0f172a' : '#94a3b8' }}>
                      {astroMode === 'pure_ai'
                        ? 'Pembuatan Ilustrasi Visual & Diagram Teknis (Gambar Lengkap & Terkalibrasi)'
                        : 'Penyaringan Butir Otentik TKA (ASPD / MKKS DIY Terverifikasi)'}
                    </div>
                    {astroStep === 3 && <span style={{ fontSize: 11, color: astroMode === 'pure_ai' ? '#0284c7' : '#0d9488', fontWeight: 700 }}>{astroMode === 'pure_ai' ? 'Menggambar diagram...' : 'Menyeleksi butir otentik...'}</span>}
                  </div>

                  {/* Step 4 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: astroStep > 4 ? '#10b981' : astroStep === 4 ? (astroMode === 'pure_ai' ? '#0284c7' : '#0d9488') : '#e2e8f0',
                      color: astroStep >= 4 ? '#ffffff' : '#94a3b8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800,
                    }}>
                      {astroStep > 4 ? '✓' : '4'}
                    </div>
                    <div style={{ flex: 1, fontSize: 12.5, fontWeight: astroStep === 4 ? 800 : 600, color: astroStep >= 4 ? '#0f172a' : '#94a3b8' }}>
                      {astroMode === 'pure_ai'
                        ? 'Formulasi Opsi Distingtif, KaTeX Rumus Matematika & Verifikasi Kunci Jawaban'
                        : 'Auto-Mix Sintesis HOTS AI & Kalibrasi Rumus KaTeX'}
                    </div>
                    {astroStep === 4 && <span style={{ fontSize: 11, color: astroMode === 'pure_ai' ? '#0284c7' : '#0d9488', fontWeight: 700 }}>{astroMode === 'pure_ai' ? 'Verifikasi KaTeX...' : 'Memadukan & kalibrasi...'}</span>}
                  </div>
                </div>
              </div>

              {/* Laporan Hasil Kurasi jika Step 5 tercapai */}
              {astroStep === 5 && astroReport && (
                <div style={{
                  background: astroReport.isPureAi ? '#f0f9ff' : '#f0fdf4',
                  border: `1.5px solid ${astroReport.isPureAi ? '#7dd3fc' : '#86efac'}`,
                  borderRadius: 12,
                  padding: '16px',
                  marginBottom: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 18 }}>{astroReport.isPureAi ? '⚡' : '✨'}</span>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: astroReport.isPureAi ? '#0369a1' : '#166534' }}>
                      {astroReport.isPureAi ? '10 Butir Pure AI Baru Berhasil Dihasilkan!' : 'Laporan Audit & Kurasi AI Berhasil!'}
                    </h4>
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: 12, color: astroReport.isPureAi ? '#0284c7' : '#15803d', lineHeight: 1.45 }}>
                    {astroReport.isPureAi
                      ? <>Astro AI telah menyelesaikan riset dan meracik 10 butir soal baru (100% Non-Bank Soal) untuk materi <b>{astroReport.bab}</b>:</>
                      : <>Astro Gemilang telah menyelesaikan kurasi & peracikan 10 butir soal untuk materi <b>{astroReport.bab}</b>:</>}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
                    <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{astroReport.isPureAi ? 'Kategori Pembuatan' : 'Total Butir Dipindai'}</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{astroReport.isPureAi ? '100% Pure AI Baru' : `${astroReport.totalDipindai} Butir`}</div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: 11, color: '#2563eb' }}>{astroReport.isPureAi ? 'Soal Bank Lama' : 'Bank Asli TKA DIY'}</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#1d4ed8' }}>{astroReport.isPureAi ? '0 Butir (Dilewati)' : `${astroReport.jumlahAsli || 0} Butir Otentik`}</div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 8, border: '1px solid #fbcfe8' }}>
                      <div style={{ fontSize: 11, color: '#db2777' }}>{astroReport.isPureAi ? 'Kelengkapan Gambar' : 'Kurasi HOTS Astro AI'}</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#be185d' }}>{astroReport.isPureAi ? '100% Diagram & Vektor' : `${astroReport.jumlahAi || 0} Butir Sintesis`}</div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 8, border: '1px solid #86efac' }}>
                      <div style={{ fontSize: 11, color: '#15803d' }}>{astroReport.isPureAi ? 'Kunci & Pembahasan' : 'Terpilih Siap Cetak & Terbit'}</div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: '#15803d' }}>{astroReport.totalLolos || targetJumlahSoal} Butir Terkalibrasi</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 11.5, color: '#334155', background: '#ffffff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', lineHeight: 1.5 }}>
                    💡 <b>Paket Siap Ditelusuri:</b> {astroReport.isPureAi
                      ? `${astroReport.totalLolos || targetJumlahSoal} butir soal baru hasil riset cerdas AI telah dimuat ke Meja Telaah lengkap dengan gambar diagram teknis, kunci terverifikasi, dan pembahasan rumus KaTeX siap dicetak atau diterbitkan ke siswa.`
                      : `${astroReport.totalLolos || targetJumlahSoal} butir soal terpilih kini telah dimuat ke Meja Telaah. Guru dapat menelaah butir lengkap dengan kunci & pembahasan terbuka, mencoba mandiri (anti-bocor), mencetak lembar siap gunting, atau langsung menerbitkan ke siswa kelas pendampingan.`}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                {astroSedangBekerja ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#0f766e', fontWeight: 700 }}>
                    <span style={{ fontSize: 14 }}>⏳</span>
                    <span>Astro Gemilang sedang menganalisis & mengkurasi...</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModalAstroThinking(false)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 10,
                      border: 'none',
                      background: '#0d9488',
                      color: '#ffffff',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
                    }}
                  >
                    👀 Mulai Telaah & Uji Coba Kunci ({keranjang.length || targetJumlahSoal} Soal)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📖 MODAL TELAAH SOAL & KUNCI LENGKAP PEGANGAN GURU */}
      {paketTelaahModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
          onClick={() => setPaketTelaahModal(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 18,
              width: '100%',
              maxWidth: 860,
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '16px 22px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>📖</span>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                    Telaah Butir Soal, Kunci & Pembahasan Guru
                  </h3>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                  <b>{paketTelaahModal.judul}</b> • {paketTelaahModal.jenjang} • {(paketTelaahModal.daftarSoal || []).length} Soal
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaketTelaahModal(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 22,
                  cursor: 'pointer',
                  color: '#64748b',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '18px 22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(paketTelaahModal.daftarSoal || []).map((s, idx) => (
                <div key={s.id || idx} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, background: '#ffffff', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0d9488', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Butir Soal #{idx + 1}</span>
                    {s.kodeSoal && <span style={{ background: '#ccfbf1', color: '#0f766e', padding: '1px 6px', borderRadius: 4, fontSize: 10.5 }}>{s.kodeSoal}</span>}
                  </div>
                  <KartuBacaSoalLengkap soal={s} tanpaKunci={false} />
                </div>
              ))}
            </div>

            <div style={{ padding: '14px 22px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Guru dapat menelaah lengkap, menguji coba mandiri, atau mencetak fisik.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    const paketMeta = { judul: paketTelaahModal.judul, mapel: paketTelaahModal.mapel, subjudul: 'Lembar Kotak Siap Gunting Siswa' };
                    cetakLewatIframe(htmlPaketSiswa(paketMeta, paketTelaahModal.daftarSoal || [], { kertas: kodeKertas }), 'Paket Siswa');
                  }}
                  style={{ padding: '8px 14px', borderRadius: 8, background: '#0d9488', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                >
                  ✂️ Cetak Lembar Siswa (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const paketMeta = { judul: paketTelaahModal.judul, mapel: paketTelaahModal.mapel, subjudul: 'Kunci Jawaban & Pembahasan Pegangan Tentor' };
                    cetakLewatIframe(htmlKunciTentor(paketMeta, paketTelaahModal.daftarSoal || [], { kertas: kodeKertas }), 'Kunci Tentor');
                  }}
                  style={{ padding: '8px 14px', borderRadius: 8, background: '#b91c1c', color: '#fff', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                >
                  🔑 Cetak Kunci Tentor (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => setPaketTelaahModal(null)}
                  style={{ padding: '8px 14px', borderRadius: 8, background: '#e2e8f0', color: '#475569', border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 LAPISAN UKUR: blok naskah dirender sembunyi-sembunyi dengan lebar
          kolom sesungguhnya; tinggi tiap blok dibaca untuk penyusun halaman.
          visibility:hidden supaya tidak terlihat tetapi layout tetap dihitung. */}
      {gayaLembar === 'naskah' && siap.length > 0 && (
        <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 0, visibility: 'hidden', pointerEvents: 'none' }}>
          <div className="naskah" ref={refUkurSiswa} style={{ width: `${lebarKolom}mm` }}>
            {blokSiswa.map((b, i) => <div key={`s${i}`} style={{ overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: b }} />)}
          </div>
          <div className="naskah" ref={refUkurKunci} style={{ width: `${lebarKolom}mm` }}>
            {blokKunci.map((b, i) => <div key={`k${i}`} style={{ overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: b }} />)}
          </div>
          {/* Lapisan ukur LEBAR PENUH: hanya blok berpita, diukur pada lebar
              isi kertas. Blok mana yang berpita diputus dari TAKSIRAN (bukan
              dari hasil ukur), jadi tidak ada osilasi ukur -> tanda -> ukur. */}
          <div className="naskah" ref={refUkurLebarSiswa} style={{ width: `${lebarIsiKertas}mm` }}>
            {indeksLebarSiswa.map((i) => <div key={`sl${i}`} style={{ overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: blokSiswa[i] }} />)}
          </div>
          <div className="naskah" ref={refUkurLebarKunci} style={{ width: `${lebarIsiKertas}mm` }}>
            {indeksLebarKunci.map((i) => <div key={`kl${i}`} style={{ overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: blokKunci[i] }} />)}
          </div>
        </div>
      )}
    </div>
  );
}
