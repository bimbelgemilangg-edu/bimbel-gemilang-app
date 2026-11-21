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
import {
  CheckCircle2, XCircle, ArrowRight, RotateCcw, Award, ChevronLeft,
  Sparkles, Brain, Flame, Scissors, HelpCircle, Printer, BookOpen,
  ChevronDown, ChevronUp
} from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { simpanHasilSesiLatihan, rapikanDanStrukturkanPembahasan } from '../../data/ambisLatihanBankSoal.js';
import { htmlPaketSiswa } from '../../utils/cetakLatihan.js';
import { cetakLewatIframe } from '../../utils/kwitansi.js';

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

// Renderer teks berformat kaya (tebal **...**, badge [BENAR]/[SALAH], dan KaTeX)
function renderRichTextSegment(segment, keyPrefix = '') {
  if (!segment) return null;
  const subParts = segment.split(/(\*\*.*?\*\*|\[(?:BENAR|SALAH|TEPAT|KELIRU)\]|\((?:BENAR|SALAH|Benar|Salah)\))/g);

  return subParts.map((sub, j) => {
    if (!sub) return null;
    const k = `${keyPrefix}_${j}`;

    if (sub.startsWith('**') && sub.endsWith('**') && sub.length >= 4) {
      return (
        <strong key={k} style={{ fontWeight: 800, color: '#0f172a' }}>
          {sub.slice(2, -2)}
        </strong>
      );
    }

    if (/^\[?(?:BENAR|TEPAT)\]?$/i.test(sub) || /^\((?:BENAR|Benar)\)$/.test(sub)) {
      return (
        <span
          key={k}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            background: '#dcfce7',
            color: '#15803d',
            border: '1px solid #86efac',
            borderRadius: 6,
            padding: '1px 8px',
            fontSize: 11,
            fontWeight: 800,
            margin: '0 4px',
            verticalAlign: 'baseline',
          }}
        >
          BENAR ✓
        </span>
      );
    }

    if (/^\[?(?:SALAH|KELIRU)\]?$/i.test(sub) || /^\((?:SALAH|Salah)\)$/.test(sub)) {
      return (
        <span
          key={k}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            background: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fca5a5',
            borderRadius: 6,
            padding: '1px 8px',
            fontSize: 11,
            fontWeight: 800,
            margin: '0 4px',
            verticalAlign: 'baseline',
          }}
        >
          SALAH ✗
        </span>
      );
    }

    return <React.Fragment key={k}>{sub}</React.Fragment>;
  });
}

function renderMathWithFormatting(text, keyPrefix = '') {
  if (!text) return null;
  const parts = String(text).split(/(\$\$.*?\$\$|\$.*?\$|\\\[.*?\\\]|\\\(.*?\\\))/g);
  return parts.map((part, i) => {
    const k = `${keyPrefix}_m_${i}`;
    if (part.startsWith('$$') && part.endsWith('$$')) {
      try { return <BlockMath key={k} math={part.slice(2, -2)} />; } catch (_e) { return <span key={k}>{part}</span>; }
    }
    if (part.startsWith('$') && part.endsWith('$')) {
      try { return <InlineMath key={k} math={part.slice(1, -1)} />; } catch (_e) { return <span key={k}>{part}</span>; }
    }
    if (part.startsWith('\\[') && part.endsWith('\\]')) {
      try { return <BlockMath key={k} math={part.slice(2, -2)} />; } catch (_e) { return <span key={k}>{part}</span>; }
    }
    if (part.startsWith('\\(') && part.endsWith('\\)')) {
      try { return <InlineMath key={k} math={part.slice(2, -2)} />; } catch (_e) { return <span key={k}>{part}</span>; }
    }
    return <span key={k}>{renderRichTextSegment(part, k)}</span>;
  });
}

// Renderer Pembahasan Berstruktur Rapi & Cantik
function renderPembahasanRapi(teksPembahasan) {
  if (!teksPembahasan) return null;
  const rawLines = String(teksPembahasan).split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, lineHeight: 1.65, color: '#334155', marginTop: 4 }}>
      {rawLines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} style={{ height: 4 }} />;

        // Header Kategori / Bagian
        const isHeader = (
          trimmed.startsWith('📚') ||
          trimmed.startsWith('📊') ||
          trimmed.startsWith('📌') ||
          trimmed.startsWith('📐') ||
          trimmed.startsWith('🎯') ||
          trimmed.startsWith('❓') ||
          trimmed.startsWith('Analisis Evaluasi') ||
          trimmed.startsWith('Langkah Penyelesaian')
        );

        // Kesimpulan / Jawaban Akhir
        const isKesimpulan = trimmed.startsWith('✅') || trimmed.startsWith('Kesimpulan') || trimmed.toLowerCase().startsWith('kunci evaluasi');

        // Bullet / Butir Kartu
        const isBullet = trimmed.startsWith('•') || /^\(?\d+\)?[.]\s+/.test(trimmed) || /^\(?\d+\)?\)\s+/.test(trimmed);

        if (isHeader) {
          return (
            <div
              key={idx}
              style={{
                fontWeight: 800,
                color: '#0f172a',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '8px 12px',
                marginTop: idx > 0 ? 8 : 0,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {renderMathWithFormatting(trimmed, `h_${idx}`)}
            </div>
          );
        }

        if (isKesimpulan) {
          return (
            <div
              key={idx}
              style={{
                fontWeight: 700,
                color: '#065f46',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: 8,
                padding: '10px 14px',
                marginTop: 6,
              }}
            >
              {renderMathWithFormatting(trimmed, `k_${idx}`)}
            </div>
          );
        }

        if (isBullet) {
          return (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '10px 14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              }}
            >
              {renderMathWithFormatting(trimmed, `b_${idx}`)}
            </div>
          );
        }

        // Teks biasa / indentasi
        return (
          <div key={idx} style={{ paddingLeft: line.startsWith('  ') ? 14 : 2 }}>
            {renderMathWithFormatting(trimmed, `p_${idx}`)}
          </div>
        );
      })}
    </div>
  );
}

// Fungsi pembuat kode unik butir soal untuk referensi Buku Besar fisik siswa
function getKodeSoal(soal, indeks = 0) {
  if (!soal) return `#SOAL-${indeks + 1}`;
  if (soal.kodeUnik) return `#${soal.kodeUnik}`;
  const subtes = String(soal.subtesKode || 'TKA').toUpperCase();
  const rawId = String(soal.id || '').replace(/[^a-zA-Z0-9]/g, '');
  const idTail = rawId.length >= 4 ? rawId.slice(-4).toUpperCase() : String(indeks + 1).padStart(2, '0');
  return `#${subtes}-${idTail}`;
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
  // Antrean soal: diacak saat inisialisasi agar siswa bersebelahan di kelas tidak sama nomornya (Anti-Nyontek)
  const [antreanSoal, setAntreanSoal] = useState(() => {
    const salinan = [...daftarSoal];
    for (let i = salinan.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [salinan[i], salinan[j]] = [salinan[j], salinan[i]];
    }
    return salinan;
  });
  const [indeksAktif, setIndeksAktif] = useState(0);

  // Status pengerjaan butir aktif (Mendukung PG Sederhana, PG Kompleks, dan Tabel Benar/Salah)
  const [jawabanTerpilih, setJawabanTerpilih] = useState(null); // PG Sederhana (string e.g. 'A')
  const [jawabanKompleks, setJawabanKompleks] = useState([]); // PG Kompleks (array e.g. ['A', 'C'])
  const [jawabanBenarSalah, setJawabanBenarSalah] = useState({}); // Tabel Benar/Salah ({ [rowIdx]: 'benar' | 'salah' })
  const [jawabanIsian, setJawabanIsian] = useState(''); // Isian Singkat
  const [sudahDiperiksa, setSudahDiperiksa] = useState(false);

  // Status dan Kantung Soal Belum Paham (Kantung Bedah Akbar Tentor)
  const [daftarBelumPaham, setDaftarBelumPaham] = useState([]);
  const [statusBelumPahamAktif, setStatusBelumPahamAktif] = useState(false);
  const [soalTerbukaPembahasanId, setSoalTerbukaPembahasanId] = useState(null);

  // Rekap hasil pertama kali dijawab (untuk penilaian skor objektif)
  const [riwayatJawabanPertama, setRiwayatJawabanPertama] = useState({});
  const [waktuMulai] = useState(() => Date.now());

  // Status sesi tuntas
  const [sesiTuntas, setSesiTuntas] = useState(false);
  const [hasilFinal, setHasilFinal] = useState(null);

  const soalSekarang = antreanSoal[indeksAktif] || null;
  const totalSoalAwal = daftarSoal.length;
  const nomorUrutTampil = Math.min(indeksAktif + 1, antreanSoal.length);
  const kodeSoalAktif = soalSekarang ? getKodeSoal(soalSekarang, indeksAktif) : '';

  // Reset state per butir soal baru
  useEffect(() => {
    setJawabanTerpilih(null);
    setJawabanKompleks([]);
    setJawabanBenarSalah({});
    setJawabanIsian('');
    setSudahDiperiksa(false);
    setStatusBelumPahamAktif(false);
  }, [indeksAktif]);

  // Handler tandai belum paham / lewati soal untuk dibedah bersama Tentor
  const handleBelumPaham = () => {
    if (!soalSekarang || sudahDiperiksa) return;
    setDaftarBelumPaham((prev) => {
      if (prev.some((s) => s.id === soalSekarang.id)) return prev;
      return [...prev, { ...soalSekarang, kodeSoal: kodeSoalAktif, alasan: 'Ditandai Belum Paham / Dilewati Siswa' }];
    });
    setRiwayatJawabanPertama((prev) => {
      if (prev[soalSekarang.id] !== undefined) return prev;
      return {
        ...prev,
        [soalSekarang.id]: { benar: false, dilewati: true, kodeSoal: kodeSoalAktif },
      };
    });
    setStatusBelumPahamAktif(true);
    setSudahDiperiksa(true);

    if (mode === 'Active Recall') {
      setAntreanSoal((prev) => [...prev, soalSekarang]);
    }
  };

  // Handler cetak lembar gunting tempel (PDF tanpa kunci)
  const handleCetakLembarGuntingTempel = () => {
    const paketData = {
      judul: paket?.judul || `${subtes?.nama || 'Latihan'} - Paket Pendampingan`,
      mapel: subtes?.nama || 'Pendampingan',
      subjudul: 'Lembar Kotak Siap Gunting Ramah Buku Besar',
    };
    try {
      const html = htmlPaketSiswa(paketData, antreanSoal, { kertas: 'A4' });
      cetakLewatIframe(html, `Lembar-Gunting-${paketData.judul}`);
    } catch (err) {
      console.error('Gagal mencetak lembar gunting tempel:', err);
      alert('Terjadi kesalahan saat menyiapkan dokumen cetak.');
    }
  };

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
        if (b === true || b?.benar === true) benarCount++;
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

      // Kumpulkan kantung soal belum tuntas untuk Bedah Akbar bersama Tentor di kelas
      const kantungBedah = [];
      antreanSoal.forEach((s, idx) => {
        const hist = riwayatJawabanPertama[s.id];
        const isBenar = hist === true || hist?.benar === true;
        const isDilewati = hist?.dilewati || daftarBelumPaham.some((bp) => bp.id === s.id);
        if (!isBenar || isDilewati) {
          if (!kantungBedah.some((kb) => kb.id === s.id)) {
            kantungBedah.push({
              ...s,
              nomorAwal: idx + 1,
              kodeSoal: getKodeSoal(s, idx),
              status: isDilewati ? 'belum_paham' : 'salah',
              alasan: isDilewati ? 'Ditandai Belum Paham oleh Siswa' : 'Jawaban Percobaan Pertama Kurang Tepat',
            });
          }
        }
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
        kantungBedah,
      });
      setSesiTuntas(true);
    }
  };

  // --------------------------------------------------------------------------
  // LAYAR HASIL AKHIR SESI LATIHAN (Lunas vs Belum Lunas & Kantung Bedah Akbar)
  // --------------------------------------------------------------------------
  if (sesiTuntas && hasilFinal) {
    const isLolos = hasilFinal.skorPersen >= 70;
    return (
      <div style={st.wrap}>
        <div style={st.cardRingkasan}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              background: isLolos ? '#ecfdf5' : '#fff7ed',
              border: `3px solid ${isLolos ? '#10b981' : '#f59e0b'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              {isLolos ? <Award size={36} color="#10b981" /> : <Flame size={36} color="#f59e0b" />}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              {isLolos ? 'Latihan Tuntas & Lunas!' : 'Sesi Selesai — Belum Lunas (Perlu Bedah Tentor)'}
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 10px' }}>
              Subtes <strong>{subtes?.nama || 'TKA / UTBK'}</strong> • Mode {mode}
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 99,
              fontSize: 13,
              fontWeight: 800,
              background: isLolos ? '#dcfce7' : '#ffedd5',
              color: isLolos ? '#15803d' : '#9a3412',
              border: `1.5px solid ${isLolos ? '#86efac' : '#fdba74'}`,
            }}>
              <span>{isLolos ? '🟢 STATUS: LUNAS & TUNTAS' : '🟠 STATUS: BELUM LUNAS (Perlu Bedah Bersama Tentor)'}</span>
            </div>
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

          {/* DOKUMEN CETAK LEMBAR GUNTING TEMPEL UNTUK BUKU BESAR */}
          <div style={{
            background: '#f0fdfa',
            border: '1.5px solid #99f6e4',
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
            textAlign: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
              <Scissors size={20} color="#0d9488" />
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f766e' }}>
                Dokumen Lembar Gunting-Tempel (Buku Besar)
              </h3>
            </div>
            <p style={{ fontSize: 12.5, color: '#134e4a', margin: '0 0 14px', lineHeight: 1.5 }}>
              Cetak naskah soal bergaris potong (✂️) tanpa kunci jawaban untuk digunting dan ditempel di Buku Besar fisikmu di samping coretan alur rumus untuk diparaf oleh Tentor.
            </p>
            <button
              type="button"
              onClick={handleCetakLembarGuntingTempel}
              style={{
                background: '#0d9488',
                color: '#ffffff',
                border: 'none',
                borderRadius: 10,
                padding: '10px 20px',
                fontSize: 13.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)',
              }}
            >
              <Scissors size={16} />
              <span>Unduh / Cetak Lembar Gunting-Tempel (PDF)</span>
            </button>
          </div>

          {/* KANTUNG BEDAH AKBAR TENTOR */}
          {hasilFinal.kantungBedah && hasilFinal.kantungBedah.length > 0 && (
            <div style={{
              background: '#ffffff',
              border: '1.5px solid #fed7aa',
              borderRadius: 14,
              padding: 16,
              marginBottom: 20,
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid #ffedd5', paddingBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🎒</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#9a3412' }}>
                      Kantung Soal Belum Tuntas ({hasilFinal.kantungBedah.length} Butir)
                    </h4>
                    <span style={{ fontSize: 11, color: '#c2410c' }}>
                      Siap dibedah bersama Tentor di papan tulis sesi kelas tatap muka
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#c2410c', background: '#ffedd5', padding: '3px 8px', borderRadius: 99 }}>
                  Fokus Sesi Offline
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {hasilFinal.kantungBedah.map((item, bIdx) => {
                  const isBuka = soalTerbukaPembahasanId === item.id;
                  return (
                    <div
                      key={item.id || bIdx}
                      style={{
                        background: '#fffaf5',
                        border: '1px solid #fed7aa',
                        borderRadius: 10,
                        padding: '10px 14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: '#9a3412',
                            background: '#ffedd5',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontFamily: 'monospace',
                          }}>
                            {item.kodeSoal}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                            {item.topik || 'Soal Latihan'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 99,
                            background: item.status === 'belum_paham' ? '#fee2e2' : '#fef3c7',
                            color: item.status === 'belum_paham' ? '#b91c1c' : '#b45309',
                          }}>
                            {item.status === 'belum_paham' ? '🤷‍♂️ Ditandai Belum Paham' : '❌ Perlu Penguatan'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSoalTerbukaPembahasanId(isBuka ? null : item.id)}
                            style={{
                              background: 'transparent',
                              border: '1px solid #fed7aa',
                              borderRadius: 6,
                              padding: '2px 8px',
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#c2410c',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span>{isBuka ? 'Tutup' : 'Lihat Solusi KaTeX'}</span>
                            {isBuka ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>
                        </div>
                      </div>

                      <div style={{ fontSize: 13, color: '#475569', marginTop: 6, lineHeight: 1.5 }}>
                        {String(item.soal || '').slice(0, 140)}...
                      </div>

                      {isBuka && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #fed7aa' }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#9a3412', marginBottom: 4 }}>
                            📖 Langkah Penyelesaian Terstruktur:
                          </div>
                          {renderPembahasanRapi(rapikanDanStrukturkanPembahasan(item.pembahasan, item))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ background: '#f8fafc', borderRadius: 12, padding: 14, marginBottom: 20, border: '1px solid #e2e8f0', fontSize: 13, color: '#475569' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
              <Brain size={16} color="#0d9488" />
              <span>Evaluasi Asisten Belajar Gemilang</span>
            </div>
            {isLolos
              ? `Pemahamanmu pada subtes ${subtes?.nama} sudah sangat solid (Lunas)! Tunjukkan caramu di Buku Besar ke Tentor untuk diparaf.`
              : `Masih ada ${hasilFinal.salahCount} butir soal yang belum tuntas. Bedah soal-soal di atas bersama Tentor di kelas, lalu selesaikan Misi Pelunasan Mandiri di rumah untuk melunasi status bab ini!`}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => {
                setAntreanSoal([...daftarSoal]);
                setIndeksAktif(0);
                setRiwayatJawabanPertama({});
                setDaftarBelumPaham([]);
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
                if (typeof onSelesai === 'function') {
                  onSelesai({ skor, totalBenar, totalSoal: totalSoalAwal, soalSalahList: daftarBelumPaham });
                }
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
      <style>{`
        button, button:focus, button:active, button:focus-visible {
          outline: none !important;
          -webkit-tap-highlight-color: transparent !important;
        }
      `}</style>
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
        {/* Topik, Kode Soal Buku Besar, & Subkategori */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={st.tagTopik}>
              {soalSekarang.topik || 'Latihan Subtes'}
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              color: '#1d4ed8',
              background: '#dbeafe',
              border: '1px solid #bfdbfe',
              borderRadius: 6,
              padding: '2px 8px',
              fontFamily: 'monospace',
              letterSpacing: '0.04em',
            }}>
              {kodeSoalAktif}
            </span>
          </div>
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
            Tingkat: {soalSekarang.tingkatKesulitan || 'Standar UTBK'}
          </span>
        </div>

        {/* BANNER BUKU BESAR FISIK */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: 10,
          padding: '8px 12px',
          marginBottom: 14,
          fontSize: 12.5,
          color: '#1e40af',
          lineHeight: 1.45,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>📖</span>
            <span>
              <strong>Buku Besar Fisik:</strong> Catat kode <strong>{kodeSoalAktif}</strong> & coret langkah rumus pengerjaanmu di buku tulis sebelum memilih jawaban!
            </span>
          </div>
          <span style={{
            fontSize: 10.5,
            fontWeight: 800,
            color: '#2563eb',
            background: '#ffffff',
            border: '1px solid #bfdbfe',
            borderRadius: 99,
            padding: '2px 8px',
            whiteSpace: 'nowrap',
          }}>
            Soal Diacak • Anti-Nyontek
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
                    border: '2px solid #94a3b8',
                    background: '#ffffff',
                    color: '#0f172a',
                    cursor: sudahDiperiksa ? 'default' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 78,
                    gap: 5,
                    outline: 'none',
                    boxShadow: 'none',
                    transition: 'all 0.15s ease',
                  };

                  let styleBtnSalah = {
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 700,
                    border: '2px solid #94a3b8',
                    background: '#ffffff',
                    color: '#0f172a',
                    cursor: sudahDiperiksa ? 'default' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 78,
                    gap: 5,
                    outline: 'none',
                    boxShadow: 'none',
                    transition: 'all 0.15s ease',
                  };

                  if (!sudahDiperiksa) {
                    // SEBELUM DIPERIKSA: Gunakan warna seleksi netral seragam (Teal Gemilang #0d9488)
                    // TIDAK BOLEH memberi warna hijau/oranye sebelum periksa agar tidak membocorkan kunci/menyesatkan siswa!
                    if (isBenarDipilih) {
                      styleBtnBenar = {
                        ...styleBtnBenar,
                        border: '2px solid #0d9488',
                        background: '#f0fdfa',
                        color: '#0f766e',
                        fontWeight: 800,
                        boxShadow: 'none',
                      };
                    }
                    if (isSalahDipilih) {
                      styleBtnSalah = {
                        ...styleBtnSalah,
                        border: '2px solid #0d9488',
                        background: '#f0fdfa',
                        color: '#0f766e',
                        fontWeight: 800,
                        boxShadow: 'none',
                      };
                    }
                  } else {
                    // SETELAH DIPERIKSA: Evaluasi jawaban secara adil & objektif
                    if (rowKunci === 'benar') {
                      styleBtnBenar = {
                        ...styleBtnBenar,
                        border: '2px solid #10b981',
                        background: '#d1fae5',
                        color: '#065f46',
                        fontWeight: 800,
                        boxShadow: 'none',
                      };
                      if (isSalahDipilih) {
                        styleBtnSalah = {
                          ...styleBtnSalah,
                          border: '2px solid #ef4444',
                          background: '#fee2e2',
                          color: '#991b1b',
                          textDecoration: 'line-through',
                          boxShadow: 'none',
                        };
                      }
                    } else {
                      styleBtnSalah = {
                        ...styleBtnSalah,
                        border: '2px solid #10b981',
                        background: '#d1fae5',
                        color: '#065f46',
                        fontWeight: 800,
                        boxShadow: 'none',
                      };
                      if (isBenarDipilih) {
                        styleBtnBenar = {
                          ...styleBtnBenar,
                          border: '2px solid #ef4444',
                          background: '#fee2e2',
                          color: '#991b1b',
                          textDecoration: 'line-through',
                          boxShadow: 'none',
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
                  boxShadow: 'none',
                  transition: 'all 0.15s ease',
                };

                if (!sudahDiperiksa) {
                  // Warna seleksi Teal Gemilang konsisten di semua jenis soal
                  if (isDipilih) {
                    gayaTombol = {
                      ...gayaTombol,
                      border: '2px solid #0d9488',
                      background: '#f0fdfa',
                      boxShadow: 'none',
                    };
                    gayaKotak = {
                      ...gayaKotak,
                      border: '2px solid #0d9488',
                      background: '#0d9488',
                      color: '#ffffff',
                    };
                  }
                } else {
                  if (isKunci && isDipilih) {
                    gayaTombol = { ...gayaTombol, border: '2px solid #10b981', background: '#ecfdf5', boxShadow: 'none' };
                    gayaKotak = { ...gayaKotak, border: '2px solid #10b981', background: '#10b981', color: '#ffffff' };
                  } else if (!isKunci && isDipilih) {
                    gayaTombol = { ...gayaTombol, border: '2px solid #ef4444', background: '#fef2f2', boxShadow: 'none' };
                    gayaKotak = { ...gayaKotak, border: '2px solid #ef4444', background: '#ef4444', color: '#ffffff' };
                  } else if (isKunci && !isDipilih) {
                    gayaTombol = { ...gayaTombol, border: '2px dashed #10b981', background: '#ffffff', boxShadow: 'none' };
                    gayaKotak = { ...gayaKotak, border: '2px solid #10b981', color: '#10b981', background: '#ecfdf5' };
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
                    border: '2px solid #0d9488',
                    background: '#f0fdfa',
                    boxShadow: 'none',
                  };
                  gayaHuruf = {
                    ...gayaHuruf,
                    border: '2px solid #0d9488',
                    background: '#0d9488',
                    color: '#ffffff',
                  };
                }
              } else {
                if (isKunci) {
                  gayaTombol = { ...gayaTombol, border: '2px solid #10b981', background: '#ecfdf5', boxShadow: 'none' };
                  gayaHuruf = { ...gayaHuruf, border: '2px solid #10b981', background: '#10b981', color: '#ffffff' };
                } else if (isDipilih && !isKunci) {
                  gayaTombol = { ...gayaTombol, border: '2px solid #ef4444', background: '#fef2f2', boxShadow: 'none' };
                  gayaHuruf = { ...gayaHuruf, border: '2px solid #ef4444', background: '#ef4444', color: '#ffffff' };
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
                {statusBelumPahamAktif ? (
                  <>
                    <HelpCircle size={20} color="#ea580c" />
                    <span style={{ fontWeight: 800, color: '#c2410c', fontSize: 14 }}>
                      Ditandai Belum Paham (Disimpan ke Kantung Bedah Akbar untuk Dibahas Bersama Tentor)
                    </span>
                  </>
                ) : isBenar ? (
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

              {mode === 'Active Recall' && !isBenar && !statusBelumPahamAktif && (
                <div style={{ fontSize: 12, color: '#b91c1c', marginBottom: 8, fontStyle: 'italic' }}>
                  💡 Mode Active Recall aktif: Soal ini akan dimunculkan kembali di akhir sesi hingga Anda berhasil menjawabnya dengan benar.
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                <span>📖</span>
                <span>Langkah Pembahasan & Analisis:</span>
              </div>
              <div>
                {renderPembahasanRapi(rapikanDanStrukturkanPembahasan(soalSekarang.pembahasan, soalSekarang))}
              </div>
            </div>
          );
        })()}

        {/* TOMBOL AKSI */}
        <div style={{ marginTop: 20 }}>
          {!sudahDiperiksa ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={!canPeriksa}
                onClick={handlePeriksaJawaban}
                style={{
                  ...st.btnAksiUtama,
                  flex: '2 1 200px',
                  opacity: canPeriksa ? 1 : 0.6,
                  cursor: canPeriksa ? 'pointer' : 'not-allowed',
                }}
              >
                <span>Periksa Jawaban</span>
                <CheckCircle2 size={18} />
              </button>
              <button
                type="button"
                onClick={handleBelumPaham}
                style={{
                  flex: '1 1 140px',
                  background: '#fff7ed',
                  border: '1.5px solid #fed7aa',
                  color: '#c2410c',
                  borderRadius: 12,
                  padding: '12px 14px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                }}
                title="Tandai butir ini ke Kantung Bedah Akbar untuk dibahas bersama Tentor di kelas"
              >
                <span>🤷‍♂️ Belum Paham / Lewati</span>
              </button>
            </div>
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
    border: '2px solid #94a3b8',
    borderRadius: 12,
    textAlign: 'left',
    cursor: 'pointer',
    outline: 'none',
    boxShadow: 'none',
    transition: 'all 0.15s ease',
  },
  hurufOpsi: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: '#f8fafc',
    border: '2px solid #94a3b8',
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
    border: '2px solid',
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
