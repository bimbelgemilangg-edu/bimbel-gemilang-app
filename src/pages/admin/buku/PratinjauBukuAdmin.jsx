// src/pages/admin/buku/PratinjauBukuAdmin.jsx
// ============================================================
// PRATINJAU & UNDUH PDF BUKU DRAF UNTUK ADMIN/OWNER (16 Okt 2026):
// pembedahan menemukan reader buku terkunci login siswa sehingga owner
// tidak bisa membaca isi drafnya sendiri, dan ekspor PDF buku belum ada
// (yang ada hanya cetak paket soal guru). Halaman ini:
//   • render bab persis kontrak reader (block tipe p/list/math/contoh/
//     tips/gambar + widget interaktif) TANPA progres/XP siswa;
//   • UNDUH PDF per bab atau seluruh buku (jsPDF; gambar Supabase
//     diambil via fetch->dataURI, gagal dimuat = catatan teks, bukan crash).
// ============================================================
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDoc, getDocs, doc } from 'firebase/firestore';
import { ArrowLeft, BookOpen, FileDown, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { MathText, MathBlock } from '../../../components/MathText';
// Impor dipisah (default vs named): pola campur `import X, { Y } from`
// tidak terbaca ci-penjaga-komponen (false-positive <X>/<Y> tak diimpor).
import VisualBuku from '../../../components/buku/VisualBuku';
import { GambarBuku } from '../../../components/buku/VisualBuku';
import WidgetInteraktif from '../../../components/belajar/WidgetInteraktif';
import { JENIS_INTERAKTIF } from '../../../components/belajar/WidgetInteraktif';
import { susunBarisPdfBab, namaFilePdfBuku } from '../../../utils/pdfBukuDigital';

const st = {
  kartu: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, marginBottom: 14 },
  tombol: (mati) => ({
    background: mati ? '#cbd5e1' : '#5B2ECC', color: '#fff', border: 'none', borderRadius: 10,
    padding: '9px 14px', fontSize: 12.5, fontWeight: 800, cursor: mati ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 7,
  }),
  kecil: (aktif) => ({
    border: '1px solid #cbd5e1', background: aktif ? '#5B2ECC' : '#fff', color: aktif ? '#fff' : '#334155',
    borderRadius: 9, padding: '7px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
    textAlign: 'left', width: '100%', marginBottom: 6,
  }),
  paragraf: { fontSize: 14, lineHeight: 1.8, color: '#1e293b', margin: '8px 0' },
  boxContoh: { background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 10, padding: 10, margin: '8px 0', fontSize: 13.5 },
  boxTips: { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 10, margin: '8px 0', fontSize: 13.5 },
};

export default function PratinjauBukuAdmin() {
  const { bukuId } = useParams();
  const navigate = useNavigate();
  const [buku, setBuku] = useState(null);
  const [babs, setBabs] = useState([]);
  const [babAktif, setBabAktif] = useState(0);
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const b = await getDoc(doc(db, 'buku_digital', bukuId));
        setBuku(b.exists() ? { id: b.id, ...b.data() } : null);
        const snap = await getDocs(collection(db, 'buku_digital', bukuId, 'bab'));
        setBabs(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b2) => (a.urutan || 0) - (b2.urutan || 0)));
      } catch (e) {
        setPesan(`✗ Gagal memuat buku: ${e?.message || e}`);
      }
    })();
  }, [bukuId]);

  // Cermin renderBlok reader siswa (kontrak: block.tipe) — tanpa progres/XP.
  const renderBlok = (blok, i) => {
    let inti = null;
    if (blok.tipe === 'p' && blok.teks) inti = <p style={st.paragraf}><MathText text={blok.teks} /></p>;
    else if (blok.tipe === 'list' && Array.isArray(blok.items)) inti = <ul style={{ margin: '8px 0', paddingLeft: 20 }}>{blok.items.map((it, j) => <li key={j} style={{ marginBottom: 5, fontSize: 13.5 }}><MathText text={it} /></li>)}</ul>;
    else if (blok.tipe === 'math' && blok.teks) inti = <div style={{ margin: '8px 0' }}><MathBlock text={blok.teks} /></div>;
    else if (blok.tipe === 'contoh' && blok.teks) inti = <div style={st.boxContoh}><b>Contoh</b><div style={{ marginTop: 4 }}><MathText text={blok.teks} /></div></div>;
    else if (blok.tipe === 'tips' && blok.teks) inti = <div style={st.boxTips}><b>Tips</b><div style={{ marginTop: 4 }}><MathText text={blok.teks} /></div></div>;
    else if (blok.tipe === 'gambar' && blok.src) inti = <GambarBuku src={blok.src} alt={blok.alt} caption={blok.caption} />;
    else if (blok.tipe === 'interaktif' && blok.widget) inti = <WidgetInteraktif widget={blok.widget} />;
    else if (JENIS_INTERAKTIF.has(blok.tipe)) inti = <WidgetInteraktif widget={{ ...blok, jenis: blok.tipe }} />;
    const visual = blok.visual ? <VisualBuku visual={blok.visual} /> : null;
    if (!inti && !visual) return null;
    return <React.Fragment key={i}>{inti}{visual}</React.Fragment>;
  };

  const urlKeDataUri = async (url) => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`http ${r.status}`);
    const blob = await r.blob();
    return await new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
  };

  const cetakBab = async (pdf, bab) => {
    const M = 14; const W = 210 - M * 2; let y = M;
    const naik = (butuh) => { if (y + butuh > 297 - M) { pdf.addPage(); y = M; } };
    for (const baris of susunBarisPdfBab(bab)) {
      if (baris.tipe === 'gambar') {
        naik(50);
        try {
          const data = await urlKeDataUri(baris.src);
          const props = pdf.getImageProperties(data);
          const w = Math.min(W, 130);
          const h = Math.min((w * props.height) / props.width, 150);
          pdf.addImage(data, props.fileType === 'JPEG' ? 'JPEG' : 'PNG', M, y, w, h);
          y += h + 4;
        } catch (_e) {
          pdf.setFontSize(9); pdf.setTextColor(150);
          pdf.text('[gambar tidak dapat dimuat untuk PDF]', M, y + 4);
          pdf.setTextColor(0); y += 8;
        }
        continue;
      }
      const gaya = { h1: [16, 7, 0], h2: [13, 6, 0], soal: [11, 5.5, 0], opsi: [11, 5, 8], kunci: [10, 5, 0] }[baris.tipe] || [11, 5, 0];
      pdf.setFontSize(gaya[0]);
      pdf.setFont('helvetica', baris.tipe === 'h1' || baris.tipe === 'h2' || baris.tipe === 'kunci' ? 'bold' : 'normal');
      const lebar = W - gaya[2];
      const lines = pdf.splitTextToSize(baris.teks || '', lebar);
      naik(lines.length * gaya[1] + 3);
      pdf.text(lines, M + gaya[2], y + gaya[0] * 0.35);
      y += lines.length * gaya[1] + (baris.tipe === 'h1' ? 4 : 2);
    }
  };

  const unduh = async (daftarBab) => {
    if (sibuk || !daftarBab.length) return;
    setSibuk(true); setPesan('… menyusun PDF (gambar dimuat dari penyimpanan)');
    try {
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      pdf.setFontSize(18); pdf.setFont('helvetica', 'bold');
      pdf.text(String(buku?.judul || 'Buku digital'), 14, 18);
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
      pdf.text(`${buku?.mapel || ''} · ${buku?.jenjang || ''} · Kelas ${buku?.kelas || '-'} · status ${buku?.status || '-'}`, 14, 24);
      for (let i = 0; i < daftarBab.length; i += 1) {
        pdf.addPage();
        await cetakBab(pdf, daftarBab[i]);
      }
      const nama = namaFilePdfBuku(buku?.judul, daftarBab.length > 1 ? 'seluruh-buku' : daftarBab[0].judul);
      pdf.save(nama);
      setPesan(`✓ PDF terunduh: ${nama} (${daftarBab.length} bab).`);
    } catch (e) {
      setPesan(`✗ Gagal membuat PDF: ${e?.message || e}`);
    } finally {
      setSibuk(false);
    }
  };

  const bab = babs[babAktif];
  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', padding: '24px 16px' }}>
      <button onClick={() => navigate('/admin/buku')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 12, fontSize: 13 }}>
        <ArrowLeft size={16} /> Ke Manajer Buku
      </button>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 21, fontWeight: 800, color: '#1e293b', margin: '0 0 4px' }}>
        <BookOpen size={22} color="#5B2ECC" /> {buku ? buku.judul : 'Memuat buku…'}
      </h1>
      <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 14px' }}>
        Pratinjau admin: render memakai kontrak reader siswa yang sama persis.
        {buku?.status === 'draft' && <b style={{ color: '#d97706' }}> Buku masih DRAFT — siswa belum melihatnya sampai status diaktifkan.</b>}
      </p>
      {pesan && <div style={{ ...st.kartu, fontSize: 12.5, color: pesan.startsWith('✗') ? '#991b1b' : '#166534' }}>{pesan}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 14, alignItems: 'start' }}>
        <div style={st.kartu}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 8 }}>DAFTAR BAB ({babs.length})</div>
          {babs.map((b, i) => (
            <button key={b.id} style={st.kecil(i === babAktif)} onClick={() => setBabAktif(i)}>
              {i + 1}. {b.judul || '(tanpa judul)'}
              <div style={{ fontSize: 10.5, fontWeight: 500, opacity: 0.75, marginTop: 2 }}>{(b.sections || []).length} seksi · {(b.ujiPemahaman || []).length} soal</div>
            </button>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            <button style={st.tombol(sibuk || !bab)} disabled={sibuk || !bab} onClick={() => unduh(bab ? [bab] : [])}>
              {sibuk ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />} Unduh PDF bab ini
            </button>
            <button style={st.tombol(sibuk || !babs.length)} disabled={sibuk || !babs.length} onClick={() => unduh(babs)}>
              <FileDown size={14} /> Unduh PDF seluruh buku ({babs.length} bab)
            </button>
          </div>
        </div>
        <div style={st.kartu}>
          {bab ? (
            <>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#312e81', margin: '0 0 10px' }}>{bab.judul}</h2>
              {(bab.sections || []).map((sek, si) => (
                <div key={sek.id || si} style={{ marginBottom: 12 }}>
                  {sek.judul && <h3 style={{ fontSize: 14, fontWeight: 800, color: '#5b4b8a', margin: '10px 0 4px' }}>{sek.judul}</h3>}
                  {(sek.blocks || []).map(renderBlok)}
                </div>
              ))}
              {(bab.ujiPemahaman || []).length > 0 && (
                <div style={{ marginTop: 14, borderTop: '1px dashed #cbd5e1', paddingTop: 10 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: '#5b4b8a' }}>Uji Pemahaman ({bab.ujiPemahaman.length})</h3>
                  {bab.ujiPemahaman.map((q, qi) => (
                    <div key={q.id || qi} style={{ border: '1px solid #f1f5f9', borderRadius: 10, padding: 10, marginBottom: 8, fontSize: 13 }}>
                      <b>{qi + 1}.</b> <MathText text={q.soal} />
                      {q.gambar?.src && <GambarBuku src={q.gambar.src} alt={q.gambar.alt} caption={q.gambar.caption} />}
                      <ol style={{ margin: '6px 0 0', paddingLeft: 20, type: 'a' }}>
                        {(q.pilihan || []).map((p, pi) => <li key={pi} style={{ fontSize: 12.5, marginBottom: 3 }}>{p}{Number(q.benar) === pi ? ' ✓' : ''}</li>)}
                      </ol>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : <div style={{ fontSize: 13, color: '#6b7280' }}>Belum ada bab tersimpan di buku ini.</div>}
        </div>
      </div>
    </div>
  );
}
