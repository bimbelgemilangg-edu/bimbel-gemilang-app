// src/pages/student/tryout/KodeSoalSiswaPage.jsx
// ============================================================
// ARSIP KODE SOAL SISWA (20 Okt 2026, permintaan owner): siswa
// mengerjakan di sistem tetapi mencoret proses di buku tulis; halaman
// ini tempat mereka MENCARI KEMBALI soal lewat kode pendeknya
// (MTK-1017-07) — semua paket yang pernah dikerjakan terdaftar,
// tiap soal bisa dibuka lagi lengkap dengan jawabanmu vs kunci.
// ============================================================
import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, query, where, getDoc, doc } from 'firebase/firestore';
import { Search, X, CheckCircle2, XCircle, Bookmark } from 'lucide-react';
import { kodeSoalSiswa, cocokCariKode } from '../../../utils/kodeSoalSiswa';
import { kodePaketTampil } from '../../../utils/kodePaket';
import { skorSatuSoal } from '../../../utils/skorSoalTryOut';
import { teksSoalDari } from '../../../utils/fieldButirSoal';
import { MathText } from '../../../components/MathText';
import RendererPgSederhana from './RendererPgSederhana';

const st = {
  kartu: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 14, marginBottom: 12 },
  chip: { fontSize: 10.5, color: '#9a3412', background: '#ffedd5', border: '1px solid #fdba74', borderRadius: 999, padding: '2px 9px', fontWeight: 800, letterSpacing: 0.3, whiteSpace: 'nowrap' },
};

export default function KodeSoalSiswaPage() {
  const [sesiList, setSesiList] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [cari, setCari] = useState('');
  const [tinjau, setTinjau] = useState(null); // {soal, jawaban, kunciOk, kode}

  useEffect(() => {
    const kode = localStorage.getItem('studentId') || '';
    if (!kode) { setMemuat(false); return; }
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'tryout_sesi'), where('studentId', '==', kode), where('status', '==', 'selesai')));
        const sesi = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const paketIds = [...new Set(sesi.map((x) => x.paketId).filter(Boolean))];
        const paket = new Map();
        await Promise.all(paketIds.map(async (pid) => {
          const sn = await getDoc(doc(db, 'tryout_paket', pid));
          if (sn.exists()) paket.set(pid, { id: pid, ...sn.data() });
        }));
        setSesiList(sesi
          .map((x) => ({ sesi: x, paket: paket.get(x.paketId) || null }))
          .filter((x) => x.paket)
          .sort((a, b) => String(b.sesi.tanggal || b.sesi.updatedAt?.seconds || 0).localeCompare(String(a.sesi.tanggal || a.sesi.updatedAt?.seconds || 0))));
      } catch (e) {
        console.error('Gagal memuat arsip kode soal:', e);
      } finally {
        setMemuat(false);
      }
    })();
  }, []);

  const baris = useMemo(() => {
    const keluar = [];
    for (const { sesi, paket } of sesiList) {
      (paket.daftarSoal || []).forEach((soal, i) => {
        const kode = kodeSoalSiswa({ mapel: paket.mapel || paket.targetKategori || '', paket, nomor: i + 1 });
        if (cari && !cocokCariKode(kode, cari) && !String(i + 1).includes(cari)) return;
        const skor = skorSatuSoal(soal, (sesi.jawaban || {})[soal.id]);
        keluar.push({ kode, nomor: i + 1, soal, sesi, paket, skor });
      });
    }
    return keluar;
  }, [sesiList, cari]);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '18px 14px' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 19, fontWeight: 800, color: '#1e293b', margin: '0 0 4px' }}>
        <Bookmark size={20} color="#f97316" /> Kode Soalku
      </h1>
      <p style={{ fontSize: 11.5, color: '#64748b', margin: '0 0 12px', lineHeight: 1.6 }}>
        Kode pendek (mis. <b>MTK-1017-07</b>) adalah alamat soal di buku tulismu:
        tulis kode itu saat mencoret proses, lalu cari di sini untuk membuka kembali
        soal, jawabanmu, dan kuncinya — sinkron antara buku dan sistem.
      </p>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={15} style={{ position: 'absolute', left: 10, top: 10, color: '#94a3b8' }} />
        <input
          value={cari}
          onChange={(e) => setCari(e.target.value)}
          placeholder="cari kode soal… mis. MTK 1017 07 atau nomor 12"
          style={{ width: '100%', padding: '10px 12px 10px 32px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
        />
      </div>

      {memuat && <div style={{ fontSize: 12.5, color: '#94a3b8' }}>memuat arsip…</div>}
      {!memuat && sesiList.length === 0 && (
        <div style={st.kartu}>Belum ada try out selesai. Kerjakan misi try out pertamamu — arsip kode akan tumbuh di sini.</div>
      )}

      {!memuat && sesiList.map(({ sesi, paket }) => {
        const milikSesi = baris.filter((b) => b.sesi.id === sesi.id);
        if (cari && !milikSesi.length) return null;
        return (
          <div key={sesi.id} style={st.kartu}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <div>
                <b style={{ fontSize: 13.5, color: '#0f172a' }}>{paket.judul || paket.nama || 'Paket'}</b>
                <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>
                  {kodePaketTampil(paket)} · {sesi.tanggal || ''} · skor {sesi.totalSkorPersen ?? '-'}%
                </div>
              </div>
            </div>
            {(cari ? milikSesi : (paket.daftarSoal || []).slice(0, 0).concat(milikSesi.slice(0, 12))).map((b) => (
              <div key={b.kode} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 0', borderTop: '1px solid #f8fafc', flexWrap: 'wrap' }}>
                <span style={st.chip}>🔖 {b.kode}</span>
                <span style={{ fontSize: 11.5, color: '#334155', flex: 1, minWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {teksSoalDari(b.soal).slice(0, 70)}
                </span>
                {b.skor != null && (b.skor > 0
                  ? <CheckCircle2 size={15} color="#16a34a" />
                  : <XCircle size={15} color="#dc2626" />)}
                <button type="button" onClick={() => setTinjau(b)} style={{ border: '1px solid #c7d2fe', background: '#eef2ff', color: '#3730a3', borderRadius: 8, padding: '4px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  lihat
                </button>
              </div>
            ))}
            {!cari && milikSesi.length > 12 && (
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>+ {milikSesi.length - 12} soal lain — cari kodenya untuk langsung melompat.</div>
            )}
          </div>
        );
      })}

      {tinjau && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
          <div style={{ background: '#fff', borderRadius: 14, width: 'min(720px, 96vw)', maxHeight: '90vh', overflow: 'auto', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={st.chip}>🔖 {tinjau.kode}</span>
              <button type="button" onClick={() => setTinjau(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}><X size={15} /></button>
            </div>
            <div style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.6, marginBottom: 10 }}>
              <MathText text={teksSoalDari(tinjau.soal)} />
            </div>
            {(tinjau.soal.gambarUrls || []).map((u, ui) => <img key={ui} src={u} alt="" style={{ maxWidth: '100%', maxHeight: 200, border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 8 }} />)}
            <RendererPgSederhana soal={tinjau.soal} jawabanTerpilih={(tinjau.sesi.jawaban || {})[tinjau.soal.id]} modeTinjau disabled />
            <div style={{ fontSize: 12, marginTop: 10, color: tinjau.skor > 0 ? '#166534' : '#991b1b', fontWeight: 700 }}>
              {tinjau.skor > 0 ? '✓ jawabanmu benar' : ('✗ jawabanmu keliru — kunci: ' + String(tinjau.soal.kunciJawaban || '-'))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
