// src/components/latihan/AmbisPracticePlayer.jsx
// ==============================================================================
// PLAYER LATIHAN INTERAKTIF AMBIS PTN 1:1
// Fitur:
// - Mode Active Recall (soal salah diulang di akhir sesi) & Basic
// - Periksa jawaban instan + Pembahasan lengkap per nomor
// - Dukungan KaTeX (rumus matematika & sains)
// - Perolehan XP & pembaruan streak harian otomatis
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Award, ChevronLeft, Sparkles, Brain, Flame } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { simpanHasilSesiLatihan } from '../../data/ambisLatihanBankSoal.js';

// Renderer rumus KaTeX matematika & fisika
function renderMath(text) {
  if (!text) return null;
  const parts = String(text).split(/(\$\$.*?\$\$|\$.*?\$|\\\[.*?\\\]|\\\(.*?\\\))/g);
  return parts.map((part, i) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      try { return <BlockMath key={i} math={part.slice(2, -2)} />; } catch (_e) { return <span key={i}>{part}</span>; }
    }
    if (part.startsWith('$') && part.endsWith('$')) {
      try { return <InlineMath key={i} math={part.slice(1, -1)} />; } catch (_e) { return <span key={i}>{part}</span>; }
    }
    if (part.startsWith('\\[') && part.endsWith('\\]')) {
      try { return <BlockMath key={i} math={part.slice(2, -2)} />; } catch (_e) { return <span key={i}>{part}</span>; }
    }
    if (part.startsWith('\\(') && part.endsWith('\\)')) {
      try { return <InlineMath key={i} math={part.slice(2, -2)} />; } catch (_e) { return <span key={i}>{part}</span>; }
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export default function AmbisPracticePlayer({
  subtes,
  paket,
  daftarSoal = [],
  mode = 'Active Recall',
  studentId = '',
  onSelesai,
  onKembali,
}) {
  // Antrean soal: pada Active Recall, soal salah akan di-push ke akhir
  const [antreanSoal, setAntreanSoal] = useState(() => [...daftarSoal]);
  const [indeksAktif, setIndeksAktif] = useState(0);

  // Status pengerjaan butir aktif (Mendukung PG Sederhana, PG Kompleks, dan Tabel Benar/Salah)
  const [jawabanTerpilih, setJawabanTerpilih] = useState(null); // PG Sederhana (string e.g. 'A')
  const [jawabanKompleks, setJawabanKompleks] = useState([]); // PG Kompleks (array e.g. ['A', 'C'])
  const [jawabanBenarSalah, setJawabanBenarSalah] = useState({}); // Tabel Benar/Salah ({ [rowIdx]: 'benar' | 'salah' })
  const [jawabanIsian, setJawabanIsian] = useState(''); // Isian Singkat
  const [sudahDiperiksa, setSudahDiperiksa] = useState(false);

  // Rekap hasil pertama kali dijawab (untuk penilaian skor objektif)
  const [riwayatJawabanPertama, setRiwayatJawabanPertama] = useState({});
  const [waktuMulai] = useState(() => Date.now());

  // Status sesi tuntas
  const [sesiTuntas, setSesiTuntas] = useState(false);
  const [hasilFinal, setHasilFinal] = useState(null);

  const soalSekarang = antreanSoal[indeksAktif] || null;
  const totalSoalAwal = daftarSoal.length;
  const nomorUrutTampil = Math.min(indeksAktif + 1, antreanSoal.length);

  // Reset state per butir soal baru
  useEffect(() => {
    setJawabanTerpilih(null);
    setJawabanKompleks([]);
    setJawabanBenarSalah({});
    setJawabanIsian('');
    setSudahDiperiksa(false);
  }, [indeksAktif]);

  // Evaluasi kelayakan tombol 'Periksa Jawaban'
  const canPeriksa = useMemo(() => {
    if (sudahDiperiksa || !soalSekarang) return false;
    const tipe = soalSekarang.tipeSoal || 'pg_sederhana';
    if (tipe === 'benar_salah') {
      const baris = soalSekarang.pernyataan || [];
      if (!baris.length) return false;
      return baris.every((_, idx) => Boolean(jawabanBenarSalah[idx]));
    }
    if (tipe === 'pg_kompleks') {
      return Array.isArray(jawabanKompleks) && jawabanKompleks.length > 0;
    }
    if (tipe === 'isian_singkat') {
      return Boolean(jawabanIsian && jawabanIsian.trim().length > 0);
    }
    return Boolean(jawabanTerpilih);
  }, [soalSekarang, sudahDiperiksa, jawabanBenarSalah, jawabanKompleks, jawabanIsian, jawabanTerpilih]);

  // Evaluasi kebenaran jawaban siswa
  const evaluasiJawaban = () => {
    if (!soalSekarang) return false;
    const tipe = soalSekarang.tipeSoal || 'pg_sederhana';

    if (tipe === 'benar_salah') {
      const baris = soalSekarang.pernyataan || [];
      if (!baris.length) return false;
      return baris.every((b, idx) => {
        const k = String(b.kunci || soalSekarang.kunci?.[idx] || 'benar').toLowerCase().trim();
        const j = String(jawabanBenarSalah[idx] || '').toLowerCase().trim();
        return k === j;
      });
    }

    if (tipe === 'pg_kompleks') {
      const kunciSet = new Set(
        (Array.isArray(soalSekarang.kunci) ? soalSekarang.kunci : [soalSekarang.kunci])
          .map((k) => String(k).toUpperCase().trim())
      );
      const siswaSet = new Set((jawabanKompleks || []).map((j) => String(j).toUpperCase().trim()));
      if (kunciSet.size === 0 || kunciSet.size !== siswaSet.size) return false;
      return [...kunciSet].every((k) => siswaSet.has(k));
    }

    if (tipe === 'isian_singkat') {
      const k = String(soalSekarang.kunci || '').trim().toLowerCase();
      const j = String(jawabanIsian || '').trim().toLowerCase();
      return k === j;
    }

    // Default pg_sederhana
    return jawabanTerpilih === soalSekarang.kunci;
  };

  // Periksa jawaban
  const handlePeriksaJawaban = () => {
    if (!canPeriksa || !soalSekarang || sudahDiperiksa) return;

    const benar = evaluasiJawaban();
    setSudahDiperiksa(true);

    // Catat jika ini percobaan pertama untuk soal ini
    if (riwayatJawabanPertama[soalSekarang.id] === undefined) {
      setRiwayatJawabanPertama((prev) => ({
        ...prev,
        [soalSekarang.id]: benar,
      }));
    }

    // Jika mode Active Recall dan salah, tambahkan soal ini ke akhir antrean agar siswa mengulang
    if (mode === 'Active Recall' && !benar) {
      setAntreanSoal((prev) => [...prev, soalSekarang]);
    }
  };

  // Lanjut ke nomor berikutnya atau selesaikan sesi
  const handleLanjut = () => {
    if (indeksAktif + 1 < antreanSoal.length) {
      setIndeksAktif((prev) => prev + 1);
    } else {
      // Sesi selesai, hitung hasil akhir
      const durasiDetik = Math.round((Date.now() - waktuMulai) / 1000);
      let benarCount = 0;
      Object.values(riwayatJawabanPertama).forEach((b) => {
        if (b === true) benarCount++;
      });

      const hasil = simpanHasilSesiLatihan({
        studentId,
        subtesKode: subtes?.kode || 'PU',
        paketId: paket?.id || `paket_${Date.now()}`,
        mode,
        soalList: daftarSoal,
        jawabanMap: riwayatJawabanPertama,
        benarCount,
        durasiDetik,
      });

      // 🔥 Catat otomatis ke Firestore tryout_sesi agar langsung terhubung ke Statistik Belajar & Kalender Heatmap
      if (studentId) {
        try {
          addDoc(collection(db, 'tryout_sesi'), {
            studentId,
            paketId: paket?.id || `jalur_${(subtes?.kode || 'latihan').toLowerCase()}`,
            paketJudul: `${subtes?.singkatan || subtes?.kode || 'Subtes'} • ${paket?.judul || 'Latihan Subtes'}`,
            subtesKode: subtes?.kode || 'MTK',
            status: 'selesai',
            sumber: 'menu_jalur',
            modeLatihan: mode,
            totalSoal: totalSoalAwal,
            benarCount,
            totalSkorPersen: Math.round((benarCount / Math.max(1, totalSoalAwal)) * 100),
            durasiMenit: Math.max(1, Math.round(durasiDetik / 60)),
            durasiDetik,
            xpFinal: benarCount * 10,
            waktuSelesaiMs: Date.now(),
            waktuSelesai: serverTimestamp(),
            createdAt: serverTimestamp(),
          }).catch((err) => console.warn('[AmbisPracticePlayer] Gagal simpan sesi ke Firestore:', err));
        } catch (e) {
          console.warn('[AmbisPracticePlayer] Error inisiasi simpan sesi Firestore:', e);
        }
      }

      setHasilFinal({
        totalSoal: totalSoalAwal,
        benarCount,
        salahCount: totalSoalAwal - benarCount,
        skorPersen: Math.round((benarCount / Math.max(1, totalSoalAwal)) * 100),
        xpDapat: hasil.xpDapat || benarCount * 10,
        durasiDetik,
      });
      setSesiTuntas(true);
    }
  };

  // --------------------------------------------------------------------------
  // LAYAR HASIL AKHIR SESI LATIHAN
  // --------------------------------------------------------------------------
  if (sesiTuntas && hasilFinal) {
    const isLolos = hasilFinal.skorPersen >= 70;
    return (
      <div style={st.wrap}>
        <div style={st.cardRingkasan}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              background: isLolos ? '#ecfdf5' : '#fff7ed',
              border: `3px solid ${isLolos ? '#10b981' : '#f59e0b'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              {isLolos ? <Award size={36} color="#10b981" /> : <Flame size={36} color="#f59e0b" />}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              {isLolos ? 'Latihan Tuntas dengan Gemilang!' : 'Latihan Selesai, Terus Asah!'}
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
              Subtes <strong>{subtes?.nama || 'UTBK'}</strong> • Mode {mode}
            </p>
          </div>

          <div style={st.gridStatistik}>
            <div style={st.kotakStat}>
              <div style={st.statNilai}>{hasilFinal.skorPersen}%</div>
              <div style={st.statLabel}>Akurasi Percobaan Pertama</div>
            </div>
            <div style={st.kotakStat}>
              <div style={{ ...st.statNilai, color: '#10b981' }}>{hasilFinal.benarCount} / {hasilFinal.totalSoal}</div>
              <div style={st.statLabel}>Soal Benar</div>
            </div>
            <div style={st.kotakStat}>
              <div style={{ ...st.statNilai, color: '#0d9488' }}>+{hasilFinal.xpDapat} XP</div>
              <div style={st.statLabel}>Hadiah Pengalaman</div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 20, border: '1px solid #e2e8f0', fontSize: 13, color: '#475569' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
              <Brain size={16} color="#0d9488" />
              <span>Evaluasi Asisten Belajar Gemilang</span>
            </div>
            {isLolos
              ? `Pemahamanmu pada subtes ${subtes?.nama} sudah sangat solid! Pertahankan konsistensi latihan untuk memperkuat daya ingat aktif menuju target PTN.`
              : `Masih ada ${hasilFinal.salahCount} butir soal yang keliru pada percobaan pertama. Manfaatkan fitur Active Recall untuk melatih kembali poin yang belum tuntas.`}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => {
                setAntreanSoal([...daftarSoal]);
                setIndeksAktif(0);
                setRiwayatJawabanPertama({});
                setSesiTuntas(false);
              }}
              style={st.btnUlangi}
            >
              <RotateCcw size={16} />
              <span>Ulangi Sesi</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof onSelesai === 'function') onSelesai();
              }}
              style={st.btnTuntas}
            >
              <span>Kembali ke Katalog Subtes</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // LAYAR PENGERJAAN SOAL AKTIF
  // --------------------------------------------------------------------------
  if (!soalSekarang) {
    return (
      <div style={st.wrap}>
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          Soal latihan belum tersedia untuk sesi ini.
        </div>
      </div>
    );
  }

  const isBenar = jawabanTerpilih === soalSekarang.kunci;
  const isRemedial = indeksAktif >= totalSoalAwal;

  return (
    <div style={st.wrap} onCopy={(e) => e.preventDefault()}>
      {/* HEADER SESI */}
      <div style={st.headerBar}>
        <button type="button" onClick={onKembali} style={st.btnKembaliHeader}>
          <ChevronLeft size={18} />
          <span>Keluar</span>
        </button>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
            {subtes?.singkatan || 'UTBK'} • {paket?.judul || 'Latihan Subtes'}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
            {mode} {isRemedial && <span style={{ color: '#ea580c', fontWeight: 700 }}>• Remedi Active Recall</span>}
          </div>
        </div>

        <div style={st.badgeNomor}>
          Soal {nomorUrutTampil} / {antreanSoal.length}
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div style={st.progressTrack}>
        <div
          style={{
            ...st.progressBar,
            width: `${Math.round((nomorUrutTampil / Math.max(1, antreanSoal.length)) * 100)}%`,
            background: isRemedial ? '#ea580c' : (subtes?.badgeWarna || '#0d9488'),
          }}
        />
      </div>

      {/* KARTU SOAL */}
      <div style={st.cardSoal}>
        {/* Topik & Subkategori */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={st.tagTopik}>
            {soalSekarang.topik || 'Latihan Subtes'}
          </span>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
            Tingkat: {soalSekarang.tingkatKesulitan || 'Standar UTBK'}
          </span>
        </div>

        {/* Wacana / Stimulus Panjang (bila ada) */}
        {soalSekarang.wacana && (
          <div style={st.boxWacana}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>
              Wacana / Teks Bacaan:
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: '#334155' }}>
              {renderMath(soalSekarang.wacana)}
            </div>
          </div>
        )}

        {/* Teks Pertanyaan */}
        <div style={st.teksPertanyaan}>
          {renderMath(soalSekarang.soal)}
        </div>

        {/* Gambar / Visual Stimulus Soal (jika ada) */}
        {Array.isArray(soalSekarang.gambar) && soalSekarang.gambar.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '12px 0 16px', alignItems: 'center' }}>
            {soalSekarang.gambar.map((imgUrl, gIdx) => (
              <img
                key={gIdx}
                src={imgUrl}
                alt={`Visual Soal ${gIdx + 1}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: 360,
                  objectFit: 'contain',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              />
            ))}
          </div>
        )}

        {/* TAMPILAN INTERAKTIF SESUAI TIPE SOAL */}
        {soalSekarang.tipeSoal === 'benar_salah' ? (
          /* ================================================================ */
          /* 1. TIPE SOAL: TABEL PERNYATAAN BENAR / SALAH                      */
          /* ================================================================ */
          <div style={{ marginTop: 16, marginBottom: 16, borderRadius: 14, border: '1px solid #cbd5e1', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ background: '#f8fafc', padding: '10px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                📊 Evaluasi Pernyataan (Tentukan Benar / Salah)
              </span>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                {soalSekarang.pernyataan?.length || 0} Pernyataan
              </span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, color: '#1e293b' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#f8fafc' }}>
                  <th style={{ width: 38, padding: '10px 6px', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>No</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700 }}>Pernyataan</th>
                  <th style={{ width: 95, padding: '10px 6px', textAlign: 'center', fontSize: 12, fontWeight: 700, borderLeft: '1px solid #334155' }}>Benar</th>
                  <th style={{ width: 95, padding: '10px 6px', textAlign: 'center', fontSize: 12, fontWeight: 700, borderLeft: '1px solid #334155' }}>Salah</th>
                </tr>
              </thead>
              <tbody>
                {(soalSekarang.pernyataan || []).map((p, pIdx) => {
                  const rowKunci = String(p.kunci || soalSekarang.kunci?.[pIdx] || 'benar').toLowerCase().trim();
                  const pilihanSiswa = jawabanBenarSalah[pIdx];
                  const isGenap = pIdx % 2 === 1;

                  const isBenarDipilih = pilihanSiswa === 'benar';
                  const isSalahDipilih = pilihanSiswa === 'salah';

                  // Tombol Benar / Salah memiliki kontras border tajam yang sama persis (tidak buram/faint)
                  // agar siswa tidak bisa menduga jawaban dari perbedaan visual tombol.
                  let styleBtnBenar = {
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 700,
                    border: '1.5px solid #94a3b8',
                    background: '#ffffff',
                    color: '#0f172a',
                    cursor: sudahDiperiksa ? 'default' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 78,
                    gap: 5,
                    outline: 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease',
                  };

                  let styleBtnSalah = {
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 700,
                    border: '1.5px solid #94a3b8',
                    background: '#ffffff',
                    color: '#0f172a',
                    cursor: sudahDiperiksa ? 'default' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 78,
                    gap: 5,
                    outline: 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease',
                  };

                  if (!sudahDiperiksa) {
                    // SEBELUM DIPERIKSA: Gunakan warna seleksi netral seragam (Teal Gemilang #0d9488)
                    // TIDAK BOLEH memberi warna hijau/oranye sebelum periksa agar tidak membocorkan kunci/menyesatkan siswa!
                    if (isBenarDipilih) {
                      styleBtnBenar = {
                        ...styleBtnBenar,
                        borderColor: '#0d9488',
                        background: '#f0fdfa',
                        color: '#0f766e',
                        fontWeight: 800,
                        boxShadow: '0 0 0 1.5px #0d9488, 0 1px 4px rgba(13, 148, 136, 0.15)',
                      };
                    }
                    if (isSalahDipilih) {
                      styleBtnSalah = {
                        ...styleBtnSalah,
                        borderColor: '#0d9488',
                        background: '#f0fdfa',
                        color: '#0f766e',
                        fontWeight: 800,
                        boxShadow: '0 0 0 1.5px #0d9488, 0 1px 4px rgba(13, 148, 136, 0.15)',
                      };
                    }
                  } else {
                    // SETELAH DIPERIKSA: Evaluasi jawaban secara adil & objektif
                    if (rowKunci === 'benar') {
                      styleBtnBenar = {
                        ...styleBtnBenar,
                        borderColor: '#10b981',
                        background: '#d1fae5',
                        color: '#065f46',
                        fontWeight: 800,
                        boxShadow: '0 0 0 1.5px #10b981',
                      };
                      if (isSalahDipilih) {
                        styleBtnSalah = {
                          ...styleBtnSalah,
                          borderColor: '#ef4444',
                          background: '#fee2e2',
                          color: '#991b1b',
                          textDecoration: 'line-through',
                        };
                      }
                    } else {
                      styleBtnSalah = {
                        ...styleBtnSalah,
                        borderColor: '#10b981',
                        background: '#d1fae5',
                        color: '#065f46',
                        fontWeight: 800,
                        boxShadow: '0 0 0 1.5px #10b981',
                      };
                      if (isBenarDipilih) {
                        styleBtnBenar = {
                          ...styleBtnBenar,
                          borderColor: '#ef4444',
                          background: '#fee2e2',
                          color: '#991b1b',
                          textDecoration: 'line-through',
                        };
                      }
                    }
                  }

                  return (
                    <tr key={p.id || pIdx} style={{ background: isGenap ? '#f8fafc' : '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b', padding: '12px 6px' }}>{pIdx + 1}</td>
                      <td style={{ padding: '12px 14px', lineHeight: 1.5, verticalAlign: 'middle' }}>
                        <div>{renderMath(p.teks)}</div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px', verticalAlign: 'middle', borderLeft: '1px solid #f1f5f9' }}>
                        <button
                          type="button"
                          disabled={sudahDiperiksa}
                          onClick={() => setJawabanBenarSalah((prev) => ({ ...prev, [pIdx]: 'benar' }))}
                          style={styleBtnBenar}
                        >
                          <span>Benar</span>
                          {sudahDiperiksa && rowKunci === 'benar' && ' ✔️'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'center', padding: '8px', verticalAlign: 'middle', borderLeft: '1px solid #f1f5f9' }}>
                        <button
                          type="button"
                          disabled={sudahDiperiksa}
                          onClick={() => setJawabanBenarSalah((prev) => ({ ...prev, [pIdx]: 'salah' }))}
                          style={styleBtnSalah}
                        >
                          <span>Salah</span>
                          {sudahDiperiksa && rowKunci === 'salah' && ' ✔️'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : soalSekarang.tipeSoal === 'pg_kompleks' ? (
          /* ================================================================ */
          /* 2. TIPE SOAL: PILIHAN GANDA KOMPLEKS (MULTI-SELECT CHECKBOX)      */
          /* ================================================================ */
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 999, fontSize: 12, fontWeight: 700, color: '#0f766e', marginBottom: 12 }}>
              <span>☑️ Pilihan Ganda Kompleks (Pilih semua jawaban yang benar, bisa lebih dari satu)</span>
            </div>
            <div style={st.listOpsi}>
              {(soalSekarang.opsi || []).map((opsi) => {
                const label = opsi.label;
                const isDipilih = (jawabanKompleks || []).includes(label);
                const isKunci = (Array.isArray(soalSekarang.kunci) ? soalSekarang.kunci : [soalSekarang.kunci]).includes(label);

                let gayaTombol = { ...st.btnOpsi };
                let gayaKotak = {
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  border: '2px solid #94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 800,
                  flexShrink: 0,
                  background: '#f8fafc',
                  color: '#1e293b',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                };

                if (!sudahDiperiksa) {
                  // Warna seleksi Teal Gemilang konsisten di semua jenis soal
                  if (isDipilih) {
                    gayaTombol = {
                      ...gayaTombol,
                      borderColor: '#0d9488',
                      background: '#f0fdfa',
                      boxShadow: '0 0 0 1.5px #0d9488, 0 1px 4px rgba(13, 148, 136, 0.15)',
                    };
                    gayaKotak = {
                      ...gayaKotak,
                      borderColor: '#0d9488',
                      background: '#0d9488',
                      color: '#ffffff',
                    };
                  }
                } else {
                  if (isKunci && isDipilih) {
                    gayaTombol = { ...gayaTombol, borderColor: '#10b981', background: '#ecfdf5', boxShadow: '0 0 0 1.5px #10b981' };
                    gayaKotak = { ...gayaKotak, borderColor: '#10b981', background: '#10b981', color: '#ffffff' };
                  } else if (!isKunci && isDipilih) {
                    gayaTombol = { ...gayaTombol, borderColor: '#ef4444', background: '#fef2f2' };
                    gayaKotak = { ...gayaKotak, borderColor: '#ef4444', background: '#ef4444', color: '#ffffff' };
                  } else if (isKunci && !isDipilih) {
                    gayaTombol = { ...gayaTombol, borderColor: '#10b981', background: '#ffffff', borderStyle: 'dashed' };
                    gayaKotak = { ...gayaKotak, borderColor: '#10b981', color: '#10b981', background: '#ecfdf5' };
                  }
                }

                return (
                  <button
                    key={label}
                    type="button"
                    disabled={sudahDiperiksa}
                    onClick={() => {
                      setJawabanKompleks((prev) => {
                        const s = new Set(prev);
                        if (s.has(label)) s.delete(label);
                        else s.add(label);
                        return Array.from(s);
                      });
                    }}
                    style={gayaTombol}
                  >
                    <div style={gayaKotak}>{isDipilih ? '✓' : label}</div>
                    <div style={st.teksOpsi}>{renderMath(opsi.text)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ================================================================ */
          /* 3. TIPE SOAL: PILIHAN GANDA SEDERHANA (SINGLE RADIO)              */
          /* ================================================================ */
          <div style={st.listOpsi}>
            {(soalSekarang.opsi || []).map((opsi) => {
              const label = opsi.label;
              const isDipilih = jawabanTerpilih === label;
              const isKunci = label === soalSekarang.kunci;

              let gayaTombol = { ...st.btnOpsi };
              let gayaHuruf = { ...st.hurufOpsi };

              if (!sudahDiperiksa) {
                // Warna seleksi Teal Gemilang konsisten di semua jenis soal
                if (isDipilih) {
                  gayaTombol = {
                    ...gayaTombol,
                    borderColor: '#0d9488',
                    background: '#f0fdfa',
                    boxShadow: '0 0 0 1.5px #0d9488, 0 1px 4px rgba(13, 148, 136, 0.15)',
                  };
                  gayaHuruf = {
                    ...gayaHuruf,
                    borderColor: '#0d9488',
                    background: '#0d9488',
                    color: '#ffffff',
                  };
                }
              } else {
                if (isKunci) {
                  gayaTombol = { ...gayaTombol, borderColor: '#10b981', background: '#ecfdf5', boxShadow: '0 0 0 1.5px #10b981' };
                  gayaHuruf = { ...gayaHuruf, borderColor: '#10b981', background: '#10b981', color: '#ffffff' };
                } else if (isDipilih && !isKunci) {
                  gayaTombol = { ...gayaTombol, borderColor: '#ef4444', background: '#fef2f2' };
                  gayaHuruf = { ...gayaHuruf, borderColor: '#ef4444', background: '#ef4444', color: '#ffffff' };
                }
              }

              return (
                <button
                  key={label}
                  type="button"
                  disabled={sudahDiperiksa}
                  onClick={() => setJawabanTerpilih(label)}
                  style={gayaTombol}
                >
                  <div style={gayaHuruf}>{label}</div>
                  <div style={st.teksOpsi}>{renderMath(opsi.text)}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* FEEDBACK & PEMBAHASAN INSTAN */}
        {sudahDiperiksa && (() => {
          const isBenar = evaluasiJawaban();
          return (
            <div style={{
              ...st.boxPembahasan,
              borderColor: isBenar ? '#a7f3d0' : '#fecaca',
              background: isBenar ? '#f0fdf4' : '#fff1f2',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {isBenar ? (
                  <>
                    <CheckCircle2 size={20} color="#10b981" />
                    <span style={{ fontWeight: 800, color: '#166534', fontSize: 14 }}>
                      Jawaban Anda Benar! 🎉 (+10 XP)
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle size={20} color="#ef4444" />
                    <span style={{ fontWeight: 800, color: '#991b1b', fontSize: 14 }}>
                      Jawaban Anda Kurang Tepat (Kunci: {soalSekarang.kunciTeks || (Array.isArray(soalSekarang.kunci) ? soalSekarang.kunci.join(', ') : soalSekarang.kunci)})
                    </span>
                  </>
                )}
              </div>

              {mode === 'Active Recall' && !isBenar && (
                <div style={{ fontSize: 12, color: '#b91c1c', marginBottom: 8, fontStyle: 'italic' }}>
                  💡 Mode Active Recall aktif: Soal ini akan dimunculkan kembali di akhir sesi hingga Anda berhasil menjawabnya dengan benar.
                </div>
              )}

              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                Langkah Pembahasan:
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: '#334155' }}>
                {renderMath(soalSekarang.pembahasan)}
              </div>
            </div>
          );
        })()}

        {/* TOMBOL AKSI */}
        <div style={{ marginTop: 20 }}>
          {!sudahDiperiksa ? (
            <button
              type="button"
              disabled={!canPeriksa}
              onClick={handlePeriksaJawaban}
              style={{
                ...st.btnAksiUtama,
                opacity: canPeriksa ? 1 : 0.6,
                cursor: canPeriksa ? 'pointer' : 'not-allowed',
              }}
            >
              <span>Periksa Jawaban</span>
              <CheckCircle2 size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLanjut}
              style={{
                ...st.btnAksiUtama,
                background: '#0f172a',
              }}
            >
              <span>{indeksAktif + 1 < antreanSoal.length ? 'Lanjut ke Soal Berikutnya' : 'Selesaikan Sesi Latihan'}</span>
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const st = {
  wrap: {
    maxWidth: 760,
    margin: '0 auto',
    padding: '16px 12px 60px',
  },
  headerBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    background: '#ffffff',
    borderRadius: 14,
    border: '1px solid #e2e8f0',
    marginBottom: 8,
  },
  btnKembaliHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 8,
  },
  badgeNomor: {
    fontSize: 12,
    fontWeight: 700,
    background: '#f1f5f9',
    color: '#334155',
    padding: '4px 10px',
    borderRadius: 20,
  },
  progressTrack: {
    height: 6,
    background: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  cardSoal: {
    background: '#ffffff',
    borderRadius: 18,
    border: '1px solid #e2e8f0',
    padding: '24px 20px',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  tagTopik: {
    fontSize: 11,
    fontWeight: 700,
    color: '#0d9488',
    background: '#f0fdfa',
    border: '1px solid #99f6e4',
    padding: '3px 10px',
    borderRadius: 12,
  },
  boxWacana: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  teksPertanyaan: {
    fontSize: 15,
    lineHeight: 1.6,
    fontWeight: 600,
    color: '#0f172a',
    marginBottom: 20,
  },
  listOpsi: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 16,
  },
  btnOpsi: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
    padding: '12px 14px',
    background: '#ffffff',
    border: '1.5px solid #cbd5e1',
    borderRadius: 12,
    textAlign: 'left',
    cursor: 'pointer',
    outline: 'none',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
    transition: 'all 0.15s ease',
  },
  hurufOpsi: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: '#f8fafc',
    border: '1.5px solid #94a3b8',
    color: '#0f172a',
    fontSize: 13,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    outline: 'none',
    transition: 'all 0.15s ease',
  },
  teksOpsi: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 1.5,
    paddingTop: 3,
  },
  boxPembahasan: {
    borderRadius: 12,
    border: '1.5px solid',
    padding: 14,
    marginTop: 14,
  },
  btnAksiUtama: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    padding: '14px',
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 800,
    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
  },
  cardRingkasan: {
    background: '#ffffff',
    borderRadius: 20,
    border: '1px solid #e2e8f0',
    padding: '32px 24px',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
  },
  gridStatistik: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    marginBottom: 20,
  },
  kotakStat: {
    background: '#f8fafc',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    padding: '14px 10px',
    textAlign: 'center',
  },
  statNilai: {
    fontSize: 22,
    fontWeight: 900,
    color: '#0f172a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 600,
  },
  btnUlangi: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#334155',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  btnTuntas: {
    flex: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 10,
    border: 'none',
    background: '#0d9488',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
};
