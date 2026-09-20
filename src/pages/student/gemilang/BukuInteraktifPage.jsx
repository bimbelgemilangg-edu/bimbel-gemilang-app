// src/pages/student/gemilang/BukuInteraktifPage.jsx
// ============================================================
// RAK BUKU + DAFTAR ISI -- murni baca dari Firestore:
//   buku_digital/{bookId}              -> metadata buku (status 'aktif')
//   buku_digital/{bookId}/bab/{babId}  -> daftar bab
// v4: bab bertipe 'html' (MODUL INTERAKTIF) dihitung setara modul:
//     1 unit baca (selesaiModul) + 1 unit quiz.
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, doc, getDoc, getDocs, query, where, limit } from 'firebase/firestore';
import { ArrowLeft, BookOpen, ChevronRight, Clock3, Play, Search } from 'lucide-react';
import { cocokkanJenjang, ekstrakAngkaKelas, cocokkanKelas } from '../../../utils/aksesKontenSiswa';
import MaskotAstronot from '../../../components/MaskotAstronot';
// 🔥 BARU: pintu sesi live di dalam menu Buku Digital
import PanelSesiLiveSiswa from '../../../components/buku/PanelSesiLiveSiswa';

function normalisasiJenjang(raw) {
  const value = String(raw || '').toLowerCase();
  if (value.includes('smp') || value.includes('mts')) return 'smp';
  if (value.includes('sma') || value.includes('ma') || value.includes('smk')) return 'sma';
  if (value.includes('sd') || value.includes('mi')) return 'sd';
  return '';
}

export default function BukuInteraktifPage() {
  const navigate = useNavigate();
  const { bukuId } = useParams();
  const studentId = localStorage.getItem('studentId') || '';
  const studentDocId = localStorage.getItem('studentDocId') || '';
  const studentKelas = localStorage.getItem('studentKelas') || localStorage.getItem('studentGrade') || '';
  const [jenjang, setJenjang] = useState(null);
  const [profilSiap, setProfilSiap] = useState(false);
  const [books, setBooks] = useState([]);
  const [babList, setBabList] = useState([]);
  const [progresMap, setProgresMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [cari, setCari] = useState('');
  const [terakhir] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gemilang:last-reader') || 'null'); } catch { return null; }
  });

  useEffect(() => {
    (async () => {
      let jenjangSiswa = null;
      try {
        const snap = await getDocs(query(collection(db, 'students'), where('studentId', '==', studentId), limit(1)));
        if (!snap.empty) jenjangSiswa = snap.docs[0].data().jenjang || snap.docs[0].data().programType || null;
      } catch (e) { console.error('Gagal ambil jenjang siswa:', e); }
      if (!jenjangSiswa && studentDocId) {
        try {
          const byId = await getDoc(doc(db, 'students', studentDocId));
          if (byId.exists()) {
            const data = byId.data();
            jenjangSiswa = data.jenjang || data.programType || null;
          }
        } catch (e) { console.error('Gagal ambil profil berdasarkan docId:', e); }
      }
      const fallback = normalisasiJenjang(studentKelas);
      setJenjang(normalisasiJenjang(jenjangSiswa) || fallback || null);
      setProfilSiap(true);
      try {
        const snapP = await getDocs(query(collection(db, 'siswa_buku_progress'), where('studentId', '==', studentId)));
        const m = {};
        snapP.forEach((d) => { m[d.data().babId] = d.data(); });
        setProgresMap(m);
      } catch (e) { console.error('Gagal muat progres buku:', e); }
    })();
  }, [studentId, studentDocId, studentKelas]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'buku_digital'), where('status', '==', 'aktif')));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.urutan || 0) - (b.urutan || 0) || String(a.judul).localeCompare(String(b.judul)));
        setBooks(list);
      } catch (e) { console.error('Gagal muat daftar buku:', e); }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!bukuId) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'buku_digital', bukuId, 'bab'));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
        setBabList(list);
      } catch (e) { console.error('Gagal muat daftar bab:', e); setBabList([]); }
    })();
  }, [bukuId]);

  const bukuTerlihat = books.filter((b) => {
    if (!jenjang) return false;
    if (!cocokkanJenjang(b.jenjang, jenjang)) return false;
    if (studentKelas && !cocokkanKelas({ tingkatKelas: String(b.kelas) }, ekstrakAngkaKelas(studentKelas))) return false;
    if (cari.trim()) {
      const q = cari.trim().toLowerCase();
      if (![b.judul, b.mapel, b.deskripsi].filter(Boolean).join(' ').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // v4: pdf | html | terstruktur
  const babModul = (bab) =>
    bab?.tipe === 'pdf' ||
    bab?.tipe === 'html' ||
    (!(bab?.sections || []).length && !!bab?.pdfUrl);

  const unitBab = (bab) => {
    const p = progresMap[bab.id];
    if (!p) return 0;
    const baca = babModul(bab) ? (p.selesaiModul ? 1 : 0) : (p.selesaiSections || []).length;
    return baca + (p.quizTerbaik != null ? 1 : 0);
  };
  const persenBab = (bab) => {
    const total = (babModul(bab) ? 1 : (bab.sections || []).length) + 1;
    return total > 0 ? Math.min(100, Math.round((unitBab(bab) / total) * 100)) : 0;
  };
  const keteranganBab = (bab) => {
    const soal = (bab.ujiPemahaman || []).length;
    if (bab?.tipe === 'html') return `✨ modul interaktif • ${soal} soal pemantapan`;
    if (babModul(bab)) {
      const hal = (bab.halamanSelesai || bab.jumlahHalaman || 0) - (bab.halamanMulai || 1) + 1;
      return `📄 modul ${hal > 0 ? hal : (bab.jumlahHalaman || 0)} halaman • ${soal} soal pemantapan`;
    }
    return `${(bab.sections || []).length} seksi • ${soal} soal pemantapan`;
  };

  // ---------------- MODE DAFTAR ISI (:bukuId) ----------------
  if (bukuId) {
    const buku = books.find((b) => b.id === bukuId);
    const warna = buku?.warna || '#4C6EF5';
    return (
      <div style={st.page}>
        <div style={{ ...st.hero, background: `linear-gradient(160deg, ${warna} 0%, #1E1B4B 100%)` }}>
          <div style={st.heroStars} />
          <button onClick={() => navigate('/siswa/buku')} style={st.backBtn}><ArrowLeft size={20} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
            <div style={{ width: 52, height: 66, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
              {buku?.emoji || '📘'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>{buku?.judul || 'Memuat buku...'}</div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 }}>
                {buku?.mapel || '-'} • Kelas {buku?.kelas || '-'} • {babList.length} bab
              </div>
            </div>
          </div>
        </div>
        <div style={{ padding: '16px 16px 30px' }}>
          {/* 🔥 BARU: pintu sesi live di dalam mode daftar isi */}
          <PanelSesiLiveSiswa />
          <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 10 }}>📖 DAFTAR ISI</div>
          {babList.length === 0 ? (
            <div style={st.kosong}>Belum ada bab di buku ini. Admin bisa menambahnya lewat Manajer Buku.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {babList.map((bab, i) => {
                const persen = persenBab(bab);
                return (
                  <button key={bab.id} onClick={() => navigate(`/siswa/buku/${bukuId}/${bab.id}`)} style={st.kartuBab}>
                    <div style={{ ...st.nomorBab, background: `${warna}18`, color: warna }}>{i + 1}</div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{bab.judul}</div>
                      <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                        {keteranganBab(bab)}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: persen === 100 ? '#22c55e' : warna, minWidth: 38, textAlign: 'right' }}>
                      {persen === 0 ? '' : `${persen}%`}
                    </span>
                    <ChevronRight size={16} color="#cbd5e1" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------------- MODE RAK BUKU ----------------
  return (
    <div style={st.page}>
      <div style={st.hero}>
        <div style={st.heroStars} />
        <button onClick={() => navigate('/siswa/dashboard')} style={st.backBtn}><ArrowLeft size={20} /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <MaskotAstronot size={64} />
          <div>
            <h1 style={{ color: 'white', fontSize: 21, fontWeight: 800, margin: 0 }}>Buku Digital</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, margin: '2px 0 0' }}>Perpustakaan pribadimu, Siswa Gemilang 📚</p>
          </div>
        </div>
      </div>
      <div style={{ padding: '18px 16px' }}>
        {/* 🔥 BARU: pintu sesi live di dalam menu Buku Digital */}
        <PanelSesiLiveSiswa />
        <div style={st.searchWrap}>
          <Search size={17} color="#94a3b8" />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari judul, mapel, atau deskripsi..."
            aria-label="Cari buku digital"
            style={st.searchInput}
          />
        </div>
        {terakhir?.bukuId && books.some((b) => b.id === terakhir.bukuId) && (
          <button
            type="button"
            style={st.lanjut}
            onClick={() => navigate(`/siswa/buku/${terakhir.bukuId}/${terakhir.babId}`)}
          >
            <div style={st.lanjutIcon}><Play size={16} fill="currentColor" /></div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={st.lanjutLabel}><Clock3 size={13} /> Lanjutkan membaca</div>
              <div style={st.lanjutTitle}>{terakhir.judul || 'Bab terakhir yang dibaca'}</div>
            </div>
            <ChevronRight size={17} color="#7C3AED" />
          </button>
        )}
        {loading || !profilSiap ? (
          <div style={st.kosong}>Memuat rak buku...</div>
        ) : bukuTerlihat.length === 0 ? (
          <div style={st.kosong}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🛰️</div>
            {jenjang
              ? 'Belum ada buku untuk jenjang/kelasmu. Admin bisa menerbitkan buku baru lewat Manajer Buku — langsung muncul di sini tanpa update aplikasi.'
              : '⚠️ Data jenjang profilmu belum lengkap. Hubungi admin untuk melengkapi data supaya rak buku bisa terisi.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bukuTerlihat.map((buku) => (
              <button key={buku.id} onClick={() => navigate(`/siswa/buku/${buku.id}`)} style={{ ...st.kartu, borderLeft: `6px solid ${buku.warna || '#4C6EF5'}` }}>
                <div style={{ ...st.cover, background: `linear-gradient(135deg, ${buku.warna || '#4C6EF5'}, #1E1B4B)` }}>{buku.emoji || '📘'}</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>{buku.judul}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 4px' }}>
                    {buku.mapel || '-'} • Kelas {buku.kelas || '-'}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#94a3b8' }}>{buku.deskripsi || ''}</div>
                </div>
                <div style={{ minWidth: 40, textAlign: 'right', fontSize: 12, fontWeight: 800, color: '#7C3AED' }}>
                  <BookOpen size={18} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const st = {
  page: { minHeight: '100vh', background: '#F4F2FF', fontFamily: 'sans-serif', maxWidth: 480, margin: '0 auto' },
  hero: { position: 'relative', overflow: 'hidden', padding: '18px 16px 26px', background: 'linear-gradient(160deg, #4C1D95 0%, #1E1B4B 100%)' },
  heroStars: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at 15% 20%, rgba(255,255,255,0.08), transparent 45%), radial-gradient(circle at 85% 75%, rgba(255,255,255,0.06), transparent 40%)', pointerEvents: 'none' },
  backBtn: { position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', marginBottom: 10 },
  kosong: { textAlign: 'center', color: '#8b8398', padding: '36px 20px', fontSize: 13, background: 'white', borderRadius: 16, lineHeight: 1.7 },
  searchWrap: { display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid #e9e5fb', borderRadius: 14, padding: '10px 12px', margin: '0 0 12px', boxShadow: '0 2px 8px rgba(30,27,75,0.04)' },
  searchInput: { flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: '#1e293b', fontSize: 13 },
  lanjut: { display: 'flex', alignItems: 'center', gap: 10, width: '100%', border: '1px solid #ddd6fe', borderRadius: 16, padding: '11px 12px', margin: '0 0 14px', background: 'linear-gradient(135deg,#faf5ff,#fff)', cursor: 'pointer', boxShadow: '0 4px 14px rgba(91,75,138,.08)' },
  lanjutIcon: { width: 34, height: 34, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#7C3AED', color: 'white', flexShrink: 0 },
  lanjutLabel: { display: 'flex', alignItems: 'center', gap: 4, color: '#7C3AED', fontSize: 10.5, fontWeight: 800 },
  lanjutTitle: { marginTop: 3, color: '#334155', fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  kartu: { display: 'flex', alignItems: 'center', gap: 14, background: 'white', borderRadius: 18, padding: 14, cursor: 'pointer', boxShadow: '0 4px 16px rgba(30,27,75,0.06)', border: 'none', width: '100%' },
  cover: { width: 56, height: 70, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 },
  kartuBab: { display: 'flex', alignItems: 'center', gap: 12, background: 'white', borderRadius: 14, padding: '12px 14px', cursor: 'pointer', border: '1px solid #ece7fb', boxShadow: '0 2px 8px rgba(30,27,75,0.04)', width: '100%' },
  nomorBab: { width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0 },
};
