// src/pages/admin/bank-soal/TerbitkanTryOutPage.jsx
// ============================================================
// TERBITKAN TRY OUT (Admin) -- versi BARU, TERPISAH TOTAL dari
// TerbitkanKuisPage.jsx (yang nerbitin ke bimbel_modul/kuis_mandiri,
// dibaca StudentQuizView.jsx). Kenapa dipisah: try out ini butuh 3 hal
// yang belum ada di sistem lama --
//   1. Skor PROPORSIONAL buat PG Kompleks & Benar/Salah (lihat
//      src/utils/skoringSoalKompleks.js), bukan semua-atau-tidak.
//   2. 2 MODE TIMER: total (1 jam buat semua soal) ATAU per-subtes
//      (kayak UTBK/TKA asli -- tiap mapel py durasi sendiri, gak bisa
//      balik ke subtes sebelumnya).
//   3. Anti-cheat dengan KAMERA (foto acak, bukan cuma deteksi
//      pindah-tab) + potongan XP proporsional (lihat
//      src/utils/potonganXPTryOut.js).
//
// Soal DISIMPAN APA ADANYA (skema asli Bank Soal: tipe, opsiJawaban,
// kunciJawaban, pernyataan, tabel_benar_salah, dst) -- TIDAK dikonversi
// ke skema quizData lama, karena RendererPgKompleks.jsx &
// RendererBenarSalah.jsx dibuat buat baca skema asli ini langsung.
//
// v1 SENGAJA CUMA "Cari Bebas" (filter datar) -- belum ada jelajah per
// folder / bucket otomatis kayak TerbitkanKuisPage.jsx. Bisa ditambah
// belakangan kalau memang kepake buat try out juga.
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { notifyStudents } from '../../../utils/notifications';
import {
  ArrowLeft, Loader2, Send, ShoppingCart, Trash2, CheckCircle2, AlertTriangle,
  Timer, ShieldAlert, Camera, ListChecks, Layers,
} from 'lucide-react';

const inputStyle = { padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, outline: 'none' };
const btnPrimary = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8,
  border: 'none', backgroundColor: '#7c3aed', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer',
};

export default function TerbitkanTryOutPage() {
  const navigate = useNavigate();

  // ---------------- KERANJANG ----------------
  const [keranjang, setKeranjang] = useState(new Map()); // soalId -> soal

  const toggleKeranjang = useCallback((soal) => {
    setKeranjang((prev) => {
      const next = new Map(prev);
      if (next.has(soal.id)) next.delete(soal.id); else next.set(soal.id, soal);
      return next;
    });
  }, []);

  const kosongkanKeranjang = () => setKeranjang(new Map());

  // ---------------- CARI BEBAS ----------------
  const [filterMapel, setFilterMapel] = useState('');
  const [filterJenisUjian, setFilterJenisUjian] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterMateri, setFilterMateri] = useState('');
  const [loadingSoal, setLoadingSoal] = useState(false);
  const [daftarSoal, setDaftarSoal] = useState([]);
  const [sudahCari, setSudahCari] = useState(false);

  const cariSoal = useCallback(async () => {
    setLoadingSoal(true);
    setSudahCari(true);
    try {
      const constraints = [where('status', '==', 'aktif')];
      if (filterMapel.trim()) constraints.push(where('mataPelajaran', '==', filterMapel.trim()));
      if (filterJenisUjian.trim()) constraints.push(where('jenisUjian', '==', filterJenisUjian.trim()));
      const snap = await getDocs(query(collection(db, 'bank_soal'), ...constraints));
      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (filterKelas.trim()) list = list.filter((s) => String(s.tingkatKelas || '') === filterKelas.trim());
      if (filterMateri.trim()) {
        const kw = filterMateri.trim().toLowerCase();
        list = list.filter((s) => String(s.materi || '').toLowerCase().includes(kw));
      }
      setDaftarSoal(list);
    } catch (e) {
      console.error('Gagal cari soal:', e);
      alert('Gagal mengambil soal: ' + e.message);
    }
    setLoadingSoal(false);
  }, [filterMapel, filterJenisUjian, filterKelas, filterMateri]);

  // ---------------- FORM TERBITKAN ----------------
  const [judulTryOut, setJudulTryOut] = useState('');
  const [targetKelas, setTargetKelas] = useState('Semua');
  const [targetKategori, setTargetKategori] = useState('Semua');
  const [availableClasses, setAvailableClasses] = useState(['Semua']);

  // 🔥 2 MODE TIMER -- ini beda utama dari sistem kuis lama.
  const [modeTimer, setModeTimer] = useState('total'); // 'total' | 'per-subtes'
  const [durasiTotalMenit, setDurasiTotalMenit] = useState(90);
  // subtes: dibuat OTOMATIS dari mataPelajaran yang ada di keranjang,
  // admin tinggal atur durasi & nama tiap subtes (bisa diedit).
  const [durasiSubtes, setDurasiSubtes] = useState({}); // { [mataPelajaran]: menit }

  const daftarMapelDiKeranjang = useMemo(() => {
    const set = new Set();
    keranjang.forEach((s) => set.add(s.mataPelajaran || 'Umum'));
    return Array.from(set);
  }, [keranjang]);

  // Isi default durasi subtes (30 menit) tiap kali ada mapel baru masuk keranjang.
  useEffect(() => {
    setDurasiSubtes((prev) => {
      const next = { ...prev };
      daftarMapelDiKeranjang.forEach((m) => { if (!(m in next)) next[m] = 30; });
      return next;
    });
  }, [daftarMapelDiKeranjang]);

  // 🔥 Anti-cheat -- nyambung ke useDeteksiKecuranganTryOut.js
  const [antiCheatAktif, setAntiCheatAktif] = useState(true);
  const [wajibKamera, setWajibKamera] = useState(true);

  const [menerbitkan, setMenerbitkan] = useState(false);
  const [hasil, setHasil] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'students'));
        const kelasList = [...new Set(snap.docs.map((d) => d.data().kelasSekolah).filter(Boolean))];
        kelasList.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        setAvailableClasses(['Semua', ...kelasList]);
      } catch (e) {
        console.error('Gagal ambil daftar kelas:', e);
      }
    })();
  }, []);

  const handleTerbitkan = async () => {
    if (!judulTryOut.trim()) return alert('Judul try out wajib diisi.');
    if (keranjang.size === 0) return alert('Keranjang masih kosong -- pilih minimal 1 soal dulu.');

    const soalDipilih = Array.from(keranjang.values());

    setMenerbitkan(true);
    setHasil(null);
    try {
      // Susun struktur subtes kalau mode 'per-subtes' -- kelompokkan
      // soal-soal di keranjang berdasarkan mataPelajaran-nya.
      const subtes = modeTimer === 'per-subtes'
        ? daftarMapelDiKeranjang.map((mapel) => ({
            nama: mapel,
            durasiMenit: Number(durasiSubtes[mapel]) || 30,
            soalIds: soalDipilih.filter((s) => (s.mataPelajaran || 'Umum') === mapel).map((s) => s.id),
          }))
        : [];

      const payload = {
        judul: judulTryOut.trim(),
        status: 'aktif',
        targetKelas,
        targetKategori,
        // Soal disimpan APA ADANYA (skema Bank Soal asli) -- lihat
        // catatan di kepala file kenapa TIDAK dikonversi ke quizData.
        daftarSoal: soalDipilih,
        totalSoal: soalDipilih.length,
        modeTimer, // 'total' | 'per-subtes'
        durasiTotalMenit: modeTimer === 'total' ? Number(durasiTotalMenit) || 60 : null,
        subtes, // dipakai kalau modeTimer === 'per-subtes'
        antiCheatAktif,
        wajibKamera: antiCheatAktif ? wajibKamera : false,
        dibuatOleh: 'admin',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'tryout_paket'), payload);

      const snapSiswa = await getDocs(collection(db, 'students'));
      const penerimaIds = snapSiswa.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => {
          const cocokKelas = targetKelas === 'Semua' || s.kelasSekolah === targetKelas;
          const cocokKategori = targetKategori === 'Semua' || s.kategori === targetKategori;
          return cocokKelas && cocokKategori && !s.isBlocked;
        })
        .map((s) => s.studentId || s.id);

      if (penerimaIds.length > 0) {
        await notifyStudents({
          specificStudentIds: penerimaIds,
          type: 'tryout',
          title: '🎯 Try Out Baru!',
          message: `"${judulTryOut}" (${soalDipilih.length} soal) sudah bisa dikerjakan.`,
          link: '/siswa/tryout',
        });
      }

      setHasil({
        success: true,
        message: `Try Out "${judulTryOut}" berhasil diterbitkan (${soalDipilih.length} soal, ${modeTimer === 'total' ? `${durasiTotalMenit} menit total` : `${subtes.length} subtes`}) ke ${penerimaIds.length} siswa.`,
      });
      setJudulTryOut('');
      kosongkanKeranjang();
      console.log('[TryOut] Paket diterbitkan:', docRef.id);
    } catch (e) {
      console.error('Gagal menerbitkan try out:', e);
      setHasil({ success: false, message: 'Gagal menerbitkan: ' + e.message });
    }
    setMenerbitkan(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 200px', fontFamily: 'sans-serif' }}>
      <button onClick={() => navigate('/admin/bank-soal')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>
        <ArrowLeft size={16} /> Kembali ke Bank Soal
      </button>

      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: '0 0 4px' }}>🎯 Terbitkan Try Out</h1>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>
        Try out formal -- timer ketat, anti-cheat kamera, skor proporsional buat PG Kompleks & Benar/Salah. Terpisah dari sistem Kuis guru.
      </p>

      {/* ---------------- CARI BEBAS ---------------- */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 10 }}>
          <input placeholder="Mata pelajaran" value={filterMapel} onChange={(e) => setFilterMapel(e.target.value)} style={inputStyle} />
          <input placeholder="Jenis ujian (mis. TKA)" value={filterJenisUjian} onChange={(e) => setFilterJenisUjian(e.target.value)} style={inputStyle} />
          <input placeholder="Kelas" value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)} style={inputStyle} />
          <input placeholder="Materi (cari kata kunci)" value={filterMateri} onChange={(e) => setFilterMateri(e.target.value)} style={inputStyle} />
        </div>
        <button onClick={cariSoal} disabled={loadingSoal} style={btnPrimary}>
          {loadingSoal ? <Loader2 size={15} className="spin" /> : <ListChecks size={15} />}
          {loadingSoal ? 'Mencari...' : 'Cari Soal'}
        </button>

        {sudahCari && !loadingSoal && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 340, overflowY: 'auto' }}>
            {daftarSoal.length === 0 ? (
              <div style={{ fontSize: 12, color: '#9ca3af' }}>Tidak ada soal yang cocok dengan filter ini.</div>
            ) : (
              daftarSoal.map((s) => {
                const dipilih = keranjang.has(s.id);
                return (
                  <label key={s.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 8, background: dipilih ? '#f5f3ff' : '#f9fafb', cursor: 'pointer' }}>
                    <input type="checkbox" checked={dipilih} onChange={() => toggleKeranjang(s)} style={{ marginTop: 3 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>
                        {s.mataPelajaran} · {s.tipe || 'pg_sederhana'} · {s.materi || '-'}
                      </div>
                      <div style={{ fontSize: 12.5, color: '#1e293b' }}>{(s.soal || s.teks_soal || '').slice(0, 140)}{(s.soal || s.teks_soal || '').length > 140 ? '...' : ''}</div>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ---------------- KERANJANG + KONFIG ---------------- */}
      {keranjang.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white',
          borderTop: '2px solid #7c3aed', boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
          padding: '16px 24px', zIndex: 50, maxHeight: '70vh', overflowY: 'auto',
        }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <ShoppingCart size={18} color="#7c3aed" />
              <span style={{ fontWeight: 800, fontSize: 14, color: '#6d28d9' }}>Keranjang: {keranjang.size} soal</span>
              <button onClick={kosongkanKeranjang} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>
                <Trash2 size={14} /> Kosongkan
              </button>
            </div>

            <input
              placeholder="Judul try out (mis. Try Out TKA Matematika Paket 1)"
              value={judulTryOut}
              onChange={(e) => setJudulTryOut(e.target.value)}
              style={{ ...inputStyle, width: '100%', marginBottom: 8, boxSizing: 'border-box' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginBottom: 10 }}>
              <select value={targetKelas} onChange={(e) => setTargetKelas(e.target.value)} style={inputStyle}>
                {availableClasses.map((k) => <option key={k} value={k}>{k === 'Semua' ? 'Semua Kelas' : k}</option>)}
              </select>
              <select value={targetKategori} onChange={(e) => setTargetKategori(e.target.value)} style={inputStyle}>
                <option value="Semua">Semua Program</option>
                <option value="Reguler">Reguler</option>
                <option value="English">English</option>
              </select>
            </div>

            {/* 🔥 MODE TIMER -- 2 pilihan sesuai keputusan yang sudah dikonfirmasi */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                <Timer size={14} /> Mode Timer
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: modeTimer === 'per-subtes' ? 10 : 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                  <input type="radio" checked={modeTimer === 'total'} onChange={() => setModeTimer('total')} /> Total keseluruhan
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                  <input type="radio" checked={modeTimer === 'per-subtes'} onChange={() => setModeTimer('per-subtes')} /> Per-subtes (kayak UTBK/TKA asli)
                </label>
              </div>

              {modeTimer === 'total' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" min={1} value={durasiTotalMenit} onChange={(e) => setDurasiTotalMenit(e.target.value)} style={{ ...inputStyle, width: 90 }} />
                  <span style={{ fontSize: 12, color: '#6b7280' }}>menit, buat semua {keranjang.size} soal</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#9ca3af', marginBottom: 2 }}>
                    <Layers size={13} /> Subtes otomatis dikelompokkan per mata pelajaran -- atur durasinya:
                  </div>
                  {daftarMapelDiKeranjang.map((mapel) => (
                    <div key={mapel} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12.5, color: '#374151', width: 140, flexShrink: 0 }}>{mapel}</span>
                      <input
                        type="number" min={1}
                        value={durasiSubtes[mapel] ?? 30}
                        onChange={(e) => setDurasiSubtes((prev) => ({ ...prev, [mapel]: e.target.value }))}
                        style={{ ...inputStyle, width: 80 }}
                      />
                      <span style={{ fontSize: 11.5, color: '#9ca3af' }}>menit</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 🔥 ANTI-CHEAT */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', padding: '8px 10px', backgroundColor: '#f9fafb', borderRadius: 8, marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151' }}>
                <input type="checkbox" checked={antiCheatAktif} onChange={(e) => setAntiCheatAktif(e.target.checked)} />
                <ShieldAlert size={13} /> Deteksi kecurangan (tab/fullscreen)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: antiCheatAktif ? '#374151' : '#cbd5e1' }}>
                <input type="checkbox" checked={wajibKamera} disabled={!antiCheatAktif} onChange={(e) => setWajibKamera(e.target.checked)} />
                <Camera size={13} /> Wajib kamera (foto acak selama try out)
              </label>
            </div>

            <button onClick={handleTerbitkan} disabled={menerbitkan} style={btnPrimary}>
              {menerbitkan ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
              {menerbitkan ? 'Menerbitkan...' : `Terbitkan ${keranjang.size} Soal ke Siswa`}
            </button>
          </div>
        </div>
      )}

      {hasil && (
        <div style={{
          marginTop: 16, padding: 14, borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start',
          backgroundColor: hasil.success ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${hasil.success ? '#bbf7d0' : '#fecaca'}`,
          color: hasil.success ? '#166534' : '#b91c1c', fontSize: 13,
        }}>
          {hasil.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          {hasil.message}
        </div>
      )}
    </div>
  );
}