// src/pages/admin/PerkakasPage.jsx
// ============================================================
// 🔥 BARU (beres-beres sidebar 2026-10-01): rumah baru untuk perkakas
// yang jarang disentuh.
//
// MASALAHNYA
// Sidebar admin memuat ±45 menu, termasuk grup BANK SOAL berisi 16 item
// dan grup MATERI berisi 5 item. Owner sendiri bilang bingung mana yang
// masih dipakai. Menghapus menu secara membabi buta berbahaya -- tidak
// ada analytics, jadi tidak ada yang tahu menu mana yang masih dipakai
// alur kerja tertentu (mis. impor konten tiap awal semester).
//
// SOLUSINYA
// 1. Perkakas jarang dipindah ke halaman ini sebagai KARTU BERDESKRIPSI,
//    supaya "gatau ini untuk apa" terjawab sekali pandang.
// 2. TIDAK ADA YANG DIHAPUS: semua rute lama tetap hidup, bookmark dan
//    kebiasaan lama tetap jalan. Sidebar cuma jadi ringkas.
// 3. Sidebar sekarang mencatat setiap klik menu ke koleksi
//    `statistik_menu`. Halaman ini menampilkan jumlah klik itu, sehingga
//    bulan depan keputusan "menu ini masih dipakai tidak?" diambil dari
//    FAKTA, bukan perasaan. Angka nol berarti "sejak pencatatan dimulai
//    (1 Okt 2026) belum ada yang menyentuh" -- bukan berarti tidak penting.
// ============================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Toolbox, Sparkles, Brain, Rocket, ClipboardCheck, Trophy, Activity,
  ScrollText, ShieldCheck, Trash2, FolderTree, BookMarked, GitMerge, Inbox,
  Archive, BookOpen, UploadCloud, Library, MousePointerClick,
  FileUp,
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';

// Grup & kartu perkakas. `path` WAJIB sama dengan rute lama supaya
// bookmark tidak patah.
const GRUP = [
  {
    label: 'BANK SOAL',
    keterangan: 'Perkakas pengolahan gudang soal: dari impor mentah sampai terbit ke siswa.',
    items: [
      { path: '/admin/bank-soal/mesin', nama: 'Mesin Bank Soal', ikon: Sparkles, desc: 'TEMPAT UPLOAD JSON/TXT SOAL (hasil AI atau scan) — lalu auto-tag jenjang, kelas, mapel, bab. Juga melihat & mengedit gudang soal.' },
      { path: '/admin/bank-soal/import', nama: 'Import Buku & Soal (AI)', ikon: Brain, desc: 'Upload PDF/buku/HTML (bukan JSON) — AI mengekstraknya jadi soal terstruktur beserta gambarnya.' },
      // 🔥 BARU (2026-10-07, keluhan owner: menu baru "tidak pernah terlihat"):
      // perkakas baru WAJIB punya kartu di hub ini SELAIN entri sidebar,
      // sebab kebiasaan lama admin adalah membuka hub perkakas.
      { path: '/admin/bank-soal/impor-html-gemini', nama: 'Impor HTML Gemini', ikon: FileUp, desc: 'Tempel/unggah HTML keluaran prompt paten (tombol Salin Prompt ada di dalamnya). Multi-berkas untuk satu buku; kunci & pembahasan ditagih, bab otomatis dari section.' },
      { path: '/admin/perpustakaan', nama: 'Perpustakaan Konten', ikon: Library, desc: 'SATU pohon jenjang → mapel → bab untuk mencari soal, buku digital, dan paket try out dari tiga sumber sekaligus.' },
      { path: '/admin/bank-soal/terbitkan', nama: 'Terbitkan Kuis', ikon: Rocket, desc: 'Menerbitkan kuis dari bank soal ke guru/siswa.' },
      { path: '/admin/bank-soal/hasil', nama: 'Hasil Kuis', ikon: ClipboardCheck, desc: 'Rekap jawaban & nilai kuis yang sudah dikerjakan.' },
      { path: '/admin/bank-soal/tryout-otomatis', nama: 'Try Out Otomatis', ikon: Trophy, desc: 'Meracik paket try out otomatis dari bank soal.' },
      { path: '/admin/bank-soal/terbitkan-tryout', nama: 'Terbitkan Try Out', ikon: Rocket, desc: 'Menerbitkan try out ke siswa beserta aturannya.' },
      { path: '/admin/bank-soal/hasil-tryout', nama: 'Hasil Try Out', ikon: ClipboardCheck, desc: 'Skor, pembahasan, dan analisis jawaban try out.' },
      { path: '/admin/bank-soal/aktivitas-latihan', nama: 'Aktivitas Latihan', ikon: Activity, desc: 'Pantau latihan mandiri yang dikerjakan siswa.' },
      { path: '/admin/bank-soal/ranking-siswa', nama: 'Ranking Siswa', ikon: Trophy, desc: 'Papan peringkat siswa lintas latihan/try out.' },
      { path: '/admin/bank-soal/audit-materi', nama: 'Audit Materi', ikon: ScrollText, desc: 'Periksa keselarasan materi & soal terhadap kurikulum.' },
      // 🔥 BARU (2026-10-08): prasyarat fitur tentor akses bank soal.
      // 🔥 Fase 2 (2026-10-08): pintu keputusan atas usulan try out tentor.
      { path: '/admin/bank-soal/approval-tryout', nama: 'Persetujuan Try Out Tentor', ikon: Inbox, desc: 'Usulan try out dari tentor TIDAK terbit sendiri. Periksa butir & subtesnya, tentukan jadwal buka/deadline, lalu TERBITKAN atau TOLAK dengan alasan (wajib, minimal 10 huruf). Tiap keputusan masuk jejak audit + riwayat paket.' },
      { path: '/admin/bank-soal/audit-identitas', nama: 'Audit Identitas Soal', ikon: ShieldCheck, desc: 'CEK SEBELUM BUKA FITUR TENTOR: apakah tiap butir punya jenjang→mapel→materi (termasuk yang "tersembunyi" karena beda kosakata/alias) dan apakah ada butir rusak. Sekali baca, biaya kuota dinyatakan jujur, hasil bisa diunduh CSV.' },
      { path: '/admin/bank-soal/bersihkan-soal', nama: 'Bersihkan Soal', ikon: Trash2, desc: 'Bersihkan soal duplikat/rusak dari gudang.' },
      { path: '/admin/bank-soal/rapikan-literasi', nama: 'Rapikan Literasi', ikon: FolderTree, desc: 'Rapikan teks bacaan/literasi soal yang berantakan.' },
      { path: '/admin/bank-soal/taksonomi-materi', nama: 'Taksonomi Materi', ikon: BookMarked, desc: 'Daftar bab resmi per mapel — pagar agar materi tidak beranak.' },
      { path: '/admin/bank-soal/petakan-matematika', nama: 'Petakan Materi Matematika', ikon: GitMerge, desc: 'Petakan soal matematika ke bab taksonomi.' },
      { path: '/admin/bank-soal/petakan-mapel', nama: 'Petakan Mapel (Umum)', ikon: GitMerge, desc: 'Pemetaan soal ke bab untuk mapel selain matematika.' },
      { path: '/admin/bank-soal/lemari-soal', nama: 'Lemari Soal', ikon: Archive, desc: 'Penyimpanan soal per folder/tag untuk pakai berulang.' },
    ],
  },
  {
    label: 'KONTEN & BUKU DIGITAL',
    keterangan: 'Perkakas materi pembelajaran: dari file mentah sampai buku digital tayang.',
    items: [
      { path: '/admin/materi-v2', nama: 'Materi v2', ikon: BookMarked, desc: 'Manajer materi baru: upload PPT/PDF/video + editor bagian & soal.' },
      { path: '/admin/bank-materi', nama: 'Bank Materi', ikon: Archive, desc: 'Gudang file pusat — upload sekali, dipakai berulang.' },
      { path: '/admin/portal/materi', nama: 'Kelola Materi/Modul', ikon: BookOpen, desc: 'Portal materi/modul versi lama yang masih dipakai konten lama.' },
      { path: '/admin/buku', nama: 'Manajer Buku Digital', ikon: Library, desc: 'Susun buku digital per bab & bagian.' },
      { path: '/admin/buku/impor', nama: 'Impor Modul (PDF)', ikon: UploadCloud, desc: 'Konversi PDF modul menjadi buku digital.' },
    ],
  },
];

const PerkakasPage = () => {
  const [klik, setKlik] = useState({});
  const [memuatKlik, setMemuatKlik] = useState(true);

  useEffect(() => {
    let batal = false;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'statistik_menu'));
        if (batal) return;
        const peta = {};
        snap.forEach((d) => {
          const v = d.data();
          if (v?.path) peta[v.path] = v.klik || 0;
        });
        setKlik(peta);
      } catch {
        // Statistik bukan fitur kritis: kalau gagal baca, halaman tetap
        // berfungsi tanpa angka.
        if (!batal) setKlik({});
      } finally {
        if (!batal) setMemuatKlik(false);
      }
    })();
    return () => { batal = true; };
  }, []);

  const totalKlik = Object.values(klik).reduce((a, b) => a + b, 0);

  return (
    <div style={styles.page}>
      <div style={styles.wrap}>
        <div style={styles.header}>
          <div style={styles.headerIcon}><Toolbox size={26} color="#60a5fa" /></div>
          <div>
            <h1 style={styles.h1}>Bank Soal & Perkakas</h1>
            <p style={styles.sub}>
              Semua perkakas lama tetap ada dan berfungsi — hanya dipindahkan ke sini
              supaya sidebar ringkas. Alamat lama tidak berubah, jadi bookmark dan
              kebiasaan lama tetap jalan.
            </p>
          </div>
        </div>

        <div style={styles.infoBox}>
          <MousePointerClick size={15} color="#93c5fd" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <b style={{ color: '#93c5fd' }}>Angka klik = fakta, bukan perasaan.</b>
            <p style={styles.infoText}>
              Sejak 1 Oktober 2026 setiap klik menu sidebar tercatat. Angka di tiap kartu
              adalah jumlah klik sejak pencatatan dimulai. Bulan depan, keputusan
              "menu ini masih diperlukan atau tidak" diambil dari angka ini — bukan dari
              rasa bingung. Nol klik bukan berarti tidak penting: bisa jadi memang
              perkakas musiman (mis. impor konten tiap awal semester).
              {memuatKlik ? ' (memuat angka...)' : ` Total tercatat: ${totalKlik} klik.`}
            </p>
          </div>
        </div>

        {GRUP.map((g) => (
          <div key={g.label} style={styles.grupBlok}>
            <h2 style={styles.grupJudul}>{g.label}</h2>
            <p style={styles.grupKet}>{g.keterangan}</p>
            <div style={styles.grid}>
              {g.items.map((it) => {
                const Ikon = it.ikon;
                const n = klik[it.path];
                return (
                  <Link key={it.path} to={it.path} style={styles.kartu}>
                    <div style={styles.kartuAtas}>
                      <div style={styles.kartuIkon}><Ikon size={17} color="#93c5fd" /></div>
                      <div style={styles.kartuNama}>{it.nama}</div>
                    </div>
                    <p style={styles.kartuDesc}>{it.desc}</p>
                    <div style={styles.kartuBawah}>
                      <code style={styles.kartuPath}>{it.path}</code>
                      <span style={n ? styles.kartuKlik : styles.kartuKlikNol}>
                        {memuatKlik ? '…' : n ? `${n} klik` : '0 klik'}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #060b18 0%, #0b1730 60%, #05080f 100%)',
    padding: '26px 20px 60px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  wrap: { maxWidth: 1100, margin: '0 auto' },
  header: { display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18 },
  headerIcon: {
    width: 52, height: 52, borderRadius: 14, flexShrink: 0,
    background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  h1: { color: '#fff', fontSize: 22, fontWeight: 800, margin: 0 },
  sub: { color: 'rgba(255,255,255,0.45)', fontSize: 12.5, margin: '4px 0 0', lineHeight: 1.55, maxWidth: 700 },
  infoBox: {
    display: 'flex', gap: 11, alignItems: 'flex-start',
    background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.18)',
    borderRadius: 14, padding: '13px 15px', marginBottom: 22,
  },
  infoText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.6, margin: '5px 0 0' },
  grupBlok: { marginBottom: 26 },
  grupJudul: { color: '#fff', fontSize: 13, fontWeight: 800, letterSpacing: 0.8, margin: '0 0 3px' },
  grupKet: { color: 'rgba(255,255,255,0.4)', fontSize: 11.5, margin: '0 0 12px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 },
  kartu: {
    display: 'flex', flexDirection: 'column', gap: 8,
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 14, textDecoration: 'none',
    transition: 'border-color .15s ease, background .15s ease',
  },
  kartuAtas: { display: 'flex', gap: 9, alignItems: 'center' },
  kartuIkon: {
    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
    background: 'rgba(96,165,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  kartuNama: { color: '#fff', fontSize: 13, fontWeight: 700, lineHeight: 1.3 },
  kartuDesc: { color: 'rgba(255,255,255,0.45)', fontSize: 11, lineHeight: 1.55, margin: 0, flex: 1 },
  kartuBawah: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  kartuPath: { color: 'rgba(255,255,255,0.25)', fontSize: 9.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  kartuKlik: {
    flexShrink: 0, background: 'rgba(34,197,94,0.14)', color: '#4ade80',
    fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 20,
  },
  kartuKlikNol: {
    flexShrink: 0, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)',
    fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
  },
};

export default PerkakasPage;
