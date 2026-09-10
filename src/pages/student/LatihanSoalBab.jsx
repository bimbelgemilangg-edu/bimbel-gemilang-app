// Komponen: LatihanSoalBab
// ============================================================
// Ditempel di StudentModuleView.jsx (tab "Kuis") -- nampilin soal dari
// BANK SOAL yang materi-nya cocok sama judul modul ini. Ini yang bikin
// modul "Bab 1 - Bilangan Bulat dan Pecahan" bisa dibuka LAGI kapan
// aja sama siswa buat liat ulang contoh soal/pembahasannya -- bukan
// cuma sekali muncul pas Sesi Kelas Live doang.
//
// Cara nyambungnya: cari kata kunci dari JUDUL MODUL (mis. "Bilangan
// Bulat dan Pecahan" dari judul "Bab 1 - Bilangan Bulat dan
// Pecahan"), dicocokkan ke field `materi` di Bank Soal -- field yang
// SAMA yang udah dipakai import Bank Soal & Sesi Kelas Live. Gak
// butuh field penghubung baru sama sekali, tinggal manfaatin data
// yang udah konsisten dari awal.
// ============================================================

import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import RenderMath from '../../components/RenderMath';
import RenderTable from '../../components/RenderTable';

// Ambil "inti" judul modul buat dicocokkan -- buang kata pembuka kayak
// "Bab 1 -", "Modul", angka romawi, dst, biar pencocokan lebih akurat.
function ambilKataKunciJudul(judul) {
  return (judul || '')
    .replace(/^bab\s*\d+\s*[-:.]?\s*/i, '')
    .replace(/^modul\s*\d*\s*[-:.]?\s*/i, '')
    .trim();
}

export default function LatihanSoalBab({ judulModul, mataPelajaran, babBuku }) {
  const [loading, setLoading] = useState(true);
  const [daftarSoal, setDaftarSoal] = useState([]);
  const [dibuka, setDibuka] = useState({}); // soalId -> jawaban terpilih
  const [terjawab, setTerjawab] = useState({}); // soalId -> true kalau udah cek jawaban

  useEffect(() => {
    // 🔥 BARU: kalau modul ini punya field `babBuku` (dibuat dari alur
    // import buku otomatis), itu dipakai buat pencocokan EKSAK ke soal
    // -- gak perlu nebak dari teks judul lagi (yang gampang meleset
    // kalau soal ditandai materi spesifik per sub-topik). Modul yang
    // dibuat manual (belum punya babBuku) tetap jalan lewat cara lama.
    const kataKunci = ambilKataKunciJudul(judulModul);
    if (!kataKunci && !babBuku) { setLoading(false); return; }

    (async () => {
      try {
        let q = collection(db, 'bank_soal');
        if (mataPelajaran) {
          q = query(q, where('mataPelajaran', '==', mataPelajaran), where('status', '==', 'aktif'));
        } else {
          q = query(q, where('status', '==', 'aktif'));
        }
        const snap = await getDocs(q);
        const kunciLower = kataKunci.toLowerCase();
        const hasil = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => {
            if (babBuku) return s.babBuku === babBuku; // pencocokan eksak, prioritas utama
            return (s.materi || '').toLowerCase().includes(kunciLower) || kunciLower.includes((s.materi || '').toLowerCase());
          })
          .filter((s) => ['pg_sederhana', 'pg_kompleks'].includes(s.tipe || 'pg_sederhana')) // tipe paling aman buat widget ringkas ini
          .slice(0, 20);
        setDaftarSoal(hasil);
      } catch (e) {
        console.error('Gagal ambil latihan soal bab ini:', e);
      }
      setLoading(false);
    })();
  }, [judulModul, mataPelajaran, babBuku]);

  if (loading) return <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Memuat latihan soal...</div>;
  if (daftarSoal.length === 0) return null; // diam-diam gak nampilin apa-apa kalau emang belum ada soal terhubung -- bukan error

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#5B2ECC', letterSpacing: 0.3, marginBottom: 10 }}>
        📚 LATIHAN SOAL BAB INI -- bisa dicoba/diulang kapan aja
      </div>
      {daftarSoal.map((s) => {
        const opsi = s.opsiJawaban || [];
        const dipilih = dibuka[s.id];
        const sudahDicek = terjawab[s.id];
        return (
          <div key={s.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 13, color: '#1e293b', marginBottom: 10, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              <RenderMath text={s.soal || s.teks_soal} />
            </div>
            {(s.gambarUrls || []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
                {s.gambarUrls.map((url, i) => <img key={i} src={url} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />)}
              </div>
            )}
            {s.tabelSoal && <RenderTable table={s.tabelSoal} />}

            {opsi.map((opt, i) => {
              const teks = typeof opt === 'string' ? opt : (opt?.teks || '');
              const iniDipilih = dipilih === i;
              const iniKunci = i === s.kunciJawaban;
              let border = '#e2e8f0', bg = 'white';
              if (sudahDicek) {
                if (iniKunci) { border = '#22c55e'; bg = '#f0fdf4'; }
                else if (iniDipilih) { border = '#ef4444'; bg = '#fef2f2'; }
              } else if (iniDipilih) { border = '#5B2ECC'; bg = '#f5f3ff'; }
              return (
                <button
                  key={i}
                  disabled={sudahDicek}
                  onClick={() => setDibuka((p) => ({ ...p, [s.id]: i }))}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 10, border: `2px solid ${border}`, background: bg, marginBottom: 6, fontSize: 12.5, cursor: sudahDicek ? 'default' : 'pointer' }}
                >
                  <b>{String.fromCharCode(65 + i)}.</b> <RenderMath text={teks} />
                </button>
              );
            })}

            {!sudahDicek ? (
              <button
                disabled={dipilih === undefined}
                onClick={() => setTerjawab((p) => ({ ...p, [s.id]: true }))}
                style={{ marginTop: 4, padding: '7px 16px', borderRadius: 8, border: 'none', background: dipilih === undefined ? '#e5e7eb' : '#5B2ECC', color: 'white', fontWeight: 700, fontSize: 12, cursor: dipilih === undefined ? 'default' : 'pointer' }}
              >
                Cek Jawaban
              </button>
            ) : (
              <>
                {s.pembahasan && (
                  <div style={{ marginTop: 8, background: '#f5f3ff', borderRadius: 8, padding: 10, fontSize: 12, color: '#4c1d95' }}>
                    💡 <RenderMath text={s.pembahasan} />
                  </div>
                )}
                <button
                  onClick={() => { setDibuka((p) => { const n = { ...p }; delete n[s.id]; return n; }); setTerjawab((p) => { const n = { ...p }; delete n[s.id]; return n; }); }}
                  style={{ marginTop: 8, padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: 'white', color: '#6b7280', fontWeight: 600, fontSize: 11.5, cursor: 'pointer' }}
                >
                  🔄 Coba Lagi
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}