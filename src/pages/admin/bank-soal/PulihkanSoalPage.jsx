// src/pages/admin/bank-soal/PulihkanSoalPage.jsx
// ============================================================
// PULIHKAN SOAL YANG DI-SOFT-DELETE (Admin)
// ============================================================
// KENAPA HALAMAN INI ADA SEKARANG
// 2026-10-08, tangkapan layar owner di halaman Bersihkan Soal:
// "✅ Selesai. 37 soal ditandai dihapus." — dijalankan SEBELUM diketahui bahwa
// detektor duplikat lama membangun kunci dari TEKS SAJA, sehingga dua soal
// infografis dengan perintah sama tetapi gambar berbeda dituduh identik dan
// salah satunya ikut terhapus.
//
// Sebelumnya soft-delete hanya bisa dipulihkan lewat Firestore Console
// (dicatat sebagai utang di CETAK-BIRU butir ⭐3). Begitu ada kemungkinan
// penghapusan yang keliru, "pulihkan lewat console" bukan jawaban yang
// manusiawi untuk admin operasional.
//
// ATURAN MAIN
//   - Halaman ini TIDAK menghapus apa pun. Ia hanya mengembalikan status.
//   - Alasan penghapusan TIDAK dibuang: dipindah ke `riwayatPenghapusan`
//     supaya jejak keputusan lama tetap ada (SOP: menghapus jejak sendiri
//     membuat log tidak berarti apa-apa).
//   - Tidak ada "pulihkan semua" satu klik. Admin mencentang, karena
//     keputusan memulihkan adalah keputusan konten.
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { teksSoalDari, identitasDari } from '../../../utils/fieldButirSoal';
import { sidikJariGambar } from '../../../utils/kunciDuplikatSoal';
import { kebijakanGagalMuat } from '../../../utils/keputusanMuat';
import { History, Loader2, RefreshCw, RotateCcw, Image as ImageIcon, AlertTriangle, Download, BookOpen } from 'lucide-react';
// 🔥 2026-10-09: owner bertanya "bisa gak baca full soal dan jawaban?" --
// jawaban di dalam aplikasi: kartu baca penuh (termasuk kunci & pembahasan)
// bisa dibentangkan per baris. Jawaban untuk analisis di luar aplikasi:
// tombol unduh JSON berisi butir utuh.
import KartuBacaSoalLengkap from '../../../components/admin/KartuBacaSoalLengkap';

const st = {
  kartu: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, marginBottom: 14 },
  judul: { fontSize: 12.5, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 9 },
  kecil: { fontSize: 12, color: '#6b7280', lineHeight: 1.65 },
  pill: (aktif) => ({
    border: `1px solid ${aktif ? '#5B2ECC' : '#d1d5db'}`, background: aktif ? '#5B2ECC' : '#fff',
    color: aktif ? '#fff' : '#374151', borderRadius: 999, padding: '5px 12px',
    fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
  }),
  baris: (kena) => ({
    display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 10,
    background: kena ? '#f0fdf4' : '#f8fafc', border: `1px solid ${kena ? '#bbf7d0' : '#eef2f7'}`, marginBottom: 7, cursor: 'pointer',
  }),
};

function waktuBaca(w) {
  if (!w) return '-';
  const d = w?.toDate ? w.toDate() : new Date(w);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function PulihkanSoalPage() {
  const [isMobile] = useState(window.innerWidth < 1024);
  const [memuat, setMemuat] = useState(true);
  const [error, setError] = useState('');
  const [daftar, setDaftar] = useState([]);
  const [punyaDaftar, setPunyaDaftar] = useState(false);
  const [filter, setFilter] = useState('semua'); // semua | duplikat | rusak
  const [tercentang, setTercentang] = useState(new Set());
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState('');
  const [baca, setBaca] = useState(new Set());

  const muat = useCallback(async () => {
    setMemuat(true);
    setError('');
    try {
      const snap = await getDocs(query(collection(db, 'bank_soal'), where('status', '==', 'dihapus')));
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => String(b.dihapusPada?.toDate?.() || b.dihapusPada || '').localeCompare(String(a.dihapusPada?.toDate?.() || a.dihapusPada || '')));
      setDaftar(list);
      setPunyaDaftar(true);
      setTercentang(new Set());
    } catch (e) {
      const k = kebijakanGagalMuat(punyaDaftar, e?.code || e?.message || '');
      setError(k.pesan);
      if (!k.pertahankanDataLama) setDaftar([]);
    } finally {
      setMemuat(false);
    }
  }, [punyaDaftar]);

  useEffect(() => { muat(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tampilan = useMemo(() => daftar.filter((d) => {
    if (filter === 'duplikat') return /duplikat/i.test(d.dihapusAlasan || '');
    if (filter === 'rusak') return /rusak/i.test(d.dihapusAlasan || '');
    return true;
  }), [daftar, filter]);

  const pulihkan = useCallback(async () => {
    const ids = [...tercentang];
    if (!ids.length || sibuk) return;
    if (!window.confirm(`Pulihkan ${ids.length} soal menjadi status 'aktif'?\n\nSoal akan kembali muncul di Latihan Harian, Try Out, dan Perpustakaan. Alasan penghapusan lamanya TIDAK dibuang — dipindah ke riwayatPenghapusan.`)) return;
    setSibuk(true);
    setPesan('');
    let ok = 0;
    try {
      for (const id of ids) {
        const d = daftar.find((x) => x.id === id);
        const riwayat = [
          ...(Array.isArray(d?.riwayatPenghapusan) ? d.riwayatPenghapusan : []),
          {
            alasan: d?.dihapusAlasan || '',
            pada: d?.dihapusPada || null,
            dipulihkanPada: new Date().toISOString(),
          },
        ];
        await updateDoc(doc(db, 'bank_soal', id), {
          status: 'aktif',
          dihapusAlasan: null,
          dihapusPada: null,
          riwayatPenghapusan: riwayat,
          dipulihkanPada: serverTimestamp(),
        });
        ok += 1;
      }
      setPesan(`✅ ${ok} soal dipulihkan jadi aktif. Jalankan Bersihkan Soal ulang bila ingin memeriksa lagi — dengan detektor yang sudah sadar gambar.`);
      setTercentang(new Set());
      await muat();
    } catch (e) {
      setPesan(`❌ Gagal memulihkan sebagian/semua (${ok} sudah berhasil): ${e?.message || e}`);
      await muat();
    } finally {
      setSibuk(false);
    }
  }, [tercentang, sibuk, daftar, muat]);

  const jumlahDuplikat = daftar.filter((d) => /duplikat/i.test(d.dihapusAlasan || '')).length;

  // Unduh butir UTUH (teks, opsi, kunci, pembahasan, url gambar, identitas,
  // alasan hapus) untuk saringan yang sedang tampil. Berguna untuk dibaca
  // tenang-tenang di luar aplikasi atau diserahkan untuk dianalisis.
  const unduhLengkap = () => {
    const isi = tampilan.map((d) => ({
      id: d.id,
      teksSoal: teksSoalDari(d),
      tipe: d.tipe || 'pg_sederhana',
      opsiJawaban: d.opsiJawaban || [],
      pernyataan: d.pernyataan || [],
      tabelBenarSalah: d.tabelBenarSalah || [],
      pasangan: d.pasangan || [],
      kunciJawaban: d.kunciJawaban ?? '',
      pembahasan: d.pembahasan || '',
      pembahasanAsal: d.pembahasanAsal || '',
      gambarUrls: d.gambarUrls || [],
      bacaan: d.bacaan || null,
      identitas: identitasDari(d),
      alasanDihapus: d.dihapusAlasan || '',
      waktuDihapus: d.dihapusPada || null,
    }));
    const blob = new Blob([JSON.stringify(isi, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `butir-dihapus-lengkap-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <SidebarAdmin />
      <div style={{ marginLeft: isMobile ? 0 : 216, padding: isMobile ? 14 : 26, width: isMobile ? '100%' : 'calc(100% - 216px)', boxSizing: 'border-box', maxWidth: 1100 }}>
        <div style={{ marginBottom: 14 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 9 }}>
            <History size={20} color="#5B2ECC" /> Pulihkan Soal yang Dihapus
          </h1>
          <p style={{ ...st.kecil, margin: '5px 0 0' }}>
            Soft-delete menandai <code>status: &quot;dihapus&quot;</code> — butirnya masih ada di sini dan bisa dikembalikan.
            Halaman ini <b>tidak menghapus apa pun</b>. Alasan penghapusan lama dipindah ke <code>riwayatPenghapusan</code>, tidak dibuang.
          </p>
        </div>

        {jumlahDuplikat > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 13px', marginBottom: 14, fontSize: 12.5, color: '#92400e', lineHeight: 1.65 }}>
            <AlertTriangle size={14} style={{ verticalAlign: -2 }} />{' '}
            <b>{jumlahDuplikat} butir dihapus dengan alasan &quot;duplikat&quot;.</b>{' '}
            Sebelum 2026-10-08 detektor duplikat hanya membaca TEKS perintah, sehingga soal infografis dengan
            perintah sama tetapi <b>gambar berbeda</b> bisa ikut terhapus. Periksa baris bertanda gambar di bawah
            sebelum memutuskan memulihkan.
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 13px', marginBottom: 14, fontSize: 12.5, color: '#991b1b', display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
            <AlertTriangle size={15} />
            <span style={{ flex: 1, minWidth: 200 }}>{error}</span>
            <button style={st.pill(false)} onClick={muat} disabled={memuat}><RefreshCw size={12} style={{ verticalAlign: -2 }} /> Coba lagi</button>
          </div>
        )}
        {pesan && (
          <div style={{ background: pesan.startsWith('✅') ? '#f0fdf4' : '#fef2f2', border: `1px solid ${pesan.startsWith('✅') ? '#bbf7d0' : '#fecaca'}`, color: pesan.startsWith('✅') ? '#166534' : '#991b1b', borderRadius: 10, padding: '10px 13px', marginBottom: 14, fontSize: 12.5, lineHeight: 1.6 }}>{pesan}</div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
          <button style={st.pill(filter === 'semua')} onClick={() => setFilter('semua')}>semua ({daftar.length})</button>
          <button style={st.pill(filter === 'duplikat')} onClick={() => setFilter('duplikat')}>alasan duplikat ({jumlahDuplikat})</button>
          <button style={st.pill(filter === 'rusak')} onClick={() => setFilter('rusak')}>alasan rusak ({daftar.length - jumlahDuplikat})</button>
          <div style={{ flex: 1 }} />
          <button style={st.pill(false)} onClick={muat} disabled={memuat}><RefreshCw size={12} style={{ verticalAlign: -2 }} /> Muat ulang</button>
          <button style={st.pill(false)} onClick={unduhLengkap} disabled={!tampilan.length}><Download size={12} style={{ verticalAlign: -2 }} /> Unduh butir lengkap (JSON)</button>
          <button
            style={{ ...st.pill(tercentang.size > 0), background: tercentang.size ? '#16a34a' : '#e5e7eb', color: tercentang.size ? '#fff' : '#9ca3af', cursor: tercentang.size && !sibuk ? 'pointer' : 'not-allowed' }}
            onClick={pulihkan}
            disabled={!tercentang.size || sibuk}
          >
            {sibuk ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Pulihkan yang tercentang ({tercentang.size})
          </button>
        </div>

        <div style={st.kartu}>
          <div style={st.judul}>Butir ber-status dihapus ({tampilan.length})</div>
          {memuat && !punyaDaftar && <div style={st.kecil}><Loader2 size={13} className="animate-spin" style={{ verticalAlign: -2 }} /> Memuat…</div>}
          {!memuat && tampilan.length === 0 && (
            <div style={st.kecil}>Tidak ada butir ber-status dihapus pada saringan ini. Bagus — artinya tidak ada yang perlu dipulihkan.</div>
          )}
          {tampilan.map((d) => {
            const id = identitasDari(d);
            const gambar = sidikJariGambar(d);
            const kena = tercentang.has(d.id);
            const lewatDuplikat = /duplikat/i.test(d.dihapusAlasan || '');
            return (
              <div key={d.id} style={st.baris(kena)} onClick={() => setTercentang((l) => { const n = new Set(l); if (n.has(d.id)) n.delete(d.id); else n.add(d.id); return n; })}>
                <input type="checkbox" checked={kena} readOnly style={{ marginTop: 3 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: '#0f172a', lineHeight: 1.55 }}>
                    {teksSoalDari(d).slice(0, 170) || <span style={{ color: '#b91c1c' }}>(tanpa teks soal)</span>}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 3 }}>
                    {id.mapel} · {id.jenjang} · kelas {id.kelas || 'Semua'} · <b>{id.materi}</b>
                    {gambar && <span style={{ color: '#4338ca' }}> · <ImageIcon size={10} style={{ verticalAlign: -1 }} /> {gambar.split(' ').length} gambar</span>}
                  </div>
                  <div style={{ fontSize: 11, color: lewatDuplikat ? '#b45309' : '#64748b', marginTop: 4 }}>
                    <b>Alasan:</b> {d.dihapusAlasan || '(tidak tercatat)'} · {waktuBaca(d.dihapusPada)}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setBaca((l) => { const n = new Set(l); if (n.has(d.id)) n.delete(d.id); else n.add(d.id); return n; }); }}
                    style={{ marginTop: 6, border: '1px solid #c7d2fe', background: baca.has(d.id) ? '#eef2ff' : '#fff', color: '#3730a3', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', gap: 5, alignItems: 'center' }}
                  >
                    <BookOpen size={12} /> {baca.has(d.id) ? 'tutup bacaan penuh' : 'baca soal + jawaban lengkap'}
                  </button>
                  {baca.has(d.id) && <KartuBacaSoalLengkap soal={d} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
