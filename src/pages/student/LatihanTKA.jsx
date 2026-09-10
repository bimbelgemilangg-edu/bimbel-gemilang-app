// src/pages/student/LatihanTKA.jsx
// ============================================================
// Halaman Latihan TKA -- khusus siswa kelas akhir jenjang (6/9/12).
// Nampilin soal yang ditandai jenisUjian: 'tka' (dari buku digital
// yang diimport admin), dikelompokkan per bab, bisa dicoba bebas
// kapan aja -- pakai pola yang SAMA kayak LatihanSoalBab.jsx.
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ArrowLeft, GraduationCap, ChevronRight } from 'lucide-react';
import RenderMath from '../../components/RenderMath';
import RenderTable from '../../components/RenderTable';

export default function LatihanTKA() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [daftarBab, setDaftarBab] = useState([]); // [{mataPelajaran, materi, soal:[...]}]
  const [babAktif, setBabAktif] = useState(null);
  const [dibuka, setDibuka] = useState({});
  const [terjawab, setTerjawab] = useState({});

  // 🔥 BARU (celah serius ditemukan): sebelumnya begitu klik 1 bab,
  // LANGSUNG lompat ke soal -- padahal ini "buku digital", harusnya
  // siswa baca rangkuman materinya DULU (persis alur baca buku beneran:
  // teori dulu, baru latihan soal di akhir bab). Sekarang dicek dulu
  // apa ada Modul Materi yang judulnya cocok sama nama bab ini
  // (dicocokkan LONGGAR, sama persis kayak LatihanSoalBab.jsx) --
  // kalau ADA, tampilin rangkumannya dulu sebelum ke soal. Kalau
  // BELUM ADA modulnya (mis. admin baru upload soal doang, belum
  // sempet materinya), langsung ke soal aja -- gak diblokir/nunggu.
  const [tahapBab, setTahapBab] = useState('materi'); // 'materi' | 'soal'
  const [rangkumanBab, setRangkumanBab] = useState(null); // null = belum dicek, '' = dicek tapi gak ada, string = ada isinya
  const [memuatRangkuman, setMemuatRangkuman] = useState(false);

  useEffect(() => {
    if (!babAktif) { setRangkumanBab(null); return; }
    setTahapBab('materi');
    setMemuatRangkuman(true);
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'bimbel_modul'), where('status', '==', 'aktif')));
        const daftarModul = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // 🔥 BARU: cocokkan EKSAK pakai babBuku dulu (paling akurat,
        // gak nebak) -- baru fallback ke pencocokan teks longgar kalau
        // soal ini gak punya tag babBuku (soal lama sebelum fitur ini).
        let cocok = babAktif.babBuku
          ? daftarModul.find((m) => m.babBuku === babAktif.babBuku)
          : null;
        if (!cocok) {
          const kunciBab = babAktif.materi.toLowerCase();
          cocok = daftarModul.find((m) => (m.title || '').toLowerCase().includes(kunciBab) || kunciBab.includes((m.title || '').toLowerCase()));
        }
        const blokTeks = cocok?.blocks?.find((b) => b.type === 'text');
        setRangkumanBab(blokTeks?.content || '');
        // Kalau emang gak ada rangkumannya sama sekali, gak usah nahan
        // siswa di layar "materi" yang kosong -- langsung lanjut soal.
        if (!blokTeks?.content) setTahapBab('soal');
      } catch (e) {
        console.error('Gagal ambil rangkuman materi bab ini:', e);
        setTahapBab('soal'); // gagal ambil rangkuman JANGAN sampai siswa gak bisa latihan soal sama sekali
      }
      setMemuatRangkuman(false);
    })();
  }, [babAktif]);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'bank_soal'), where('jenisUjian', '==', 'tka'), where('status', '==', 'aktif')));
        const perBab = {};
        snap.forEach((d) => {
          const s = { id: d.id, ...d.data() };
          if (!['pg_sederhana', 'pg_kompleks'].includes(s.tipe || 'pg_sederhana')) return;
          // 🔥 BARU (bug ditemukan): dulu dikelompokin per `materi`
          // doang -- soal per-bab biasanya ditandai materi yang
          // SPESIFIK per sub-topik (mis. "Operasi Bilangan Bulat (soal
          // cerita suhu)"), jadi 1 bab buku bisa kepecah jadi PULUHAN
          // kartu "bab" kecil-kecil yang gak nyambung ke rangkumannya.
          // Sekarang kelompokin per `babBuku` (label bab besar, eksak)
          // KALAU ADA -- baru fallback ke `materi` buat soal lama yang
          // belum punya tag ini (biar tetap kebaca, gak hilang).
          const label = s.babBuku || s.materi || 'Umum';
          const kunci = `${s.mataPelajaran}||${label}`;
          if (!perBab[kunci]) perBab[kunci] = { mataPelajaran: s.mataPelajaran, materi: label, babBuku: s.babBuku || null, soal: [] };
          perBab[kunci].soal.push(s);
        });
        setDaftarBab(Object.values(perBab).sort((a, b) => a.materi.localeCompare(b.materi)));
      } catch (e) {
        console.error('Gagal ambil soal TKA:', e);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Memuat latihan TKA...</div>;

  // ---------------- Daftar bab ----------------
  if (!babAktif) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
        <button onClick={() => navigate('/siswa/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 16 }}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 28 }}>🎓</span>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: 0 }}>Latihan TKA</h1>
        </div>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 20 }}>Latihan soal persiapan TKA, dikelompokkan per bab.</p>

        {daftarBab.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: 30, border: '1px dashed #d1d5db', borderRadius: 12 }}>
            Belum ada soal TKA yang tersedia buat kelasmu. Coba lagi nanti ya.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {daftarBab.map((bab) => (
              <button
                key={`${bab.mataPelajaran}-${bab.materi}`}
                onClick={() => setBabAktif(bab)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', border: '1px solid #e5e7eb', borderRadius: 14, padding: '14px 16px', background: 'white', cursor: 'pointer' }}
              >
                <div style={{ width: 42, height: 42, borderRadius: 12, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <GraduationCap size={20} color="#5B2ECC" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: '#1e293b' }}>{bab.materi}</div>
                  <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{bab.mataPelajaran} · {bab.soal.length} soal</div>
                </div>
                <ChevronRight size={18} color="#9ca3af" />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---------------- Baca rangkuman materi dulu (kalau ada) ----------------
  if (babAktif && tahapBab === 'materi') {
    if (memuatRangkuman) {
      return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>Menyiapkan materi...</div>;
    }
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
        <button onClick={() => setBabAktif(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 16 }}>
          <ArrowLeft size={16} /> Kembali ke daftar bab
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 20 }}>📖</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#5B2ECC', textTransform: 'uppercase', letterSpacing: 0.3 }}>Baca Dulu</span>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 16 }}>{babAktif.materi}</h2>

        <div
          style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 18, fontSize: 13.5, lineHeight: 1.8, color: '#1e293b', marginBottom: 18 }}
          dangerouslySetInnerHTML={{ __html: rangkumanBab }}
        />

        <button
          onClick={() => setTahapBab('soal')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#5B2ECC', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
        >
          Lanjut ke Latihan Soal <ChevronRight size={18} />
        </button>
      </div>
    );
  }

  // ---------------- Latihan soal 1 bab ----------------
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <button onClick={() => setBabAktif(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 16 }}>
        <ArrowLeft size={16} /> Kembali ke daftar bab
      </button>
      {/* 🔥 BARU: kalau bab ini PUNYA rangkuman, kasih tombol buat balik
          baca lagi -- siswa gak harus keluar-masuk daftar bab cuma buat
          liat teori lagi pas ngerjain. */}
      {rangkumanBab && (
        <button onClick={() => setTahapBab('materi')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f5f3ff', border: 'none', borderRadius: 10, padding: '7px 14px', color: '#5B2ECC', fontWeight: 700, fontSize: 11.5, cursor: 'pointer', marginBottom: 12 }}>
          📖 Baca ulang rangkuman materi
        </button>
      )}
      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 16 }}>{babAktif.materi}</h2>

      {babAktif.soal.map((s) => {
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