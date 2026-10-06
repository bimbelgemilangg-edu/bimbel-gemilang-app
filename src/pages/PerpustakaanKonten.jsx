// src/pages/PerpustakaanKonten.jsx
// ============================================================
// PERPUSTAKAAN — satu tempat mencari SELURUH konten bimbel.
//
// KENAPA ADA (keluhan owner 2026-10-06): "posisi saat ini admin saja
// kesulitan mau mencari materi, jadi kedepannya admin akan upload bank
// soal contoh kelas 10 cari materinya dulu ... admin aja bingung apalagi
// guru mau cari materinya atau soalnya."
//
// Halaman ini menampilkan pohon jenjang -> mapel -> bab yang digabung
// dari TIGA sumber (bank soal, buku digital, paket try out) lewat
// src/utils/petaKonten.js, dengan kotak pencarian di atasnya. Satu
// komponen dipakai dua portal:
//   - admin  (/admin/perpustakaan): aksi kelola -> Lemari Soal, Manajer Buku
//   - guru   (/guru/perpustakaan) : aksi pakai  -> Cetak Latihan (bab sudah
//                                    terpilih otomatis lewat query string)
// Tidak ada pengambilan data sendiri: semua lewat sumberKonten.js yang
// ber-cache TTL, sesuai docs/POLICY-ERROR-DAN-KUOTA.md.
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import SidebarAdmin from '../components/SidebarAdmin';
import { useNavigate } from 'react-router-dom';
import { ambilKonten } from '../utils/sumberKonten';
import { bangunPohon, saringPohon, sebaranKelas } from '../utils/petaKonten';
import { useSegarSaatTerlihat } from '../utils/useSegarSaatTerlihat';

const gayaKartu = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 12 };
const gayaPill = (aktif) => ({
  padding: '7px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
  border: aktif ? '1.5px solid #3730a3' : '1px solid #d1d5db',
  background: aktif ? '#eef2ff' : 'white', color: aktif ? '#3730a3' : '#475569',
});
const gayaAksi = (warna) => ({
  padding: '6px 10px', borderRadius: 8, border: 'none', background: warna,
  color: 'white', fontSize: 11, fontWeight: 800, cursor: 'pointer',
});

export default function PerpustakaanKonten({ peran = 'admin' }) {
  const navigate = useNavigate();
  const [konten, setKonten] = useState({ soal: [], buku: [], paket: [] });
  const [pesan, setPesan] = useState('');
  const [memuat, setMemuat] = useState(true);
  const [query, setQuery] = useState('');
  const [jenjangAktif, setJenjangAktif] = useState('');
  const [mapelAktif, setMapelAktif] = useState('');
  const [babAktif, setBabAktif] = useState('');
  const versiSegar = useSegarSaatTerlihat();

  useEffect(() => {
    let batal = false;
    (async () => {
      setMemuat(true);
      const h = await ambilKonten();
      if (batal) return;
      setKonten(h);
      setPesan(h.pesan || '');
      setMemuat(false);
    })();
    return () => { batal = true; };
  }, [versiSegar]);

  const pohon = useMemo(() => bangunPohon(konten), [konten]);
  const pohonTersaring = useMemo(() => saringPohon(pohon, query), [pohon, query]);
  const jenjangList = pohonTersaring;
  const mapelList = (jenjangList.find((j) => j.jenjang === jenjangAktif) || {}).mapel || [];
  const simpul = mapelList.find((m) => m.mapel === mapelAktif) || null;

  // Mode admin merender sidebar sendiri (AdminRoute hanya menjaga akses);
  // mode guru sudah dibungkus GuruPage yang membawa SidebarGuru.
  const isi = (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <h2 style={{ margin: '4px 0 4px', fontSize: 18 }}>📚 Perpustakaan Konten</h2>
      <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px' }}>
        Satu tempat mencari materi, soal, dan paket: gabungan bank soal, buku digital,
        dan try out dalam pohon jenjang → mapel → bab.
      </p>

      {pesan && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 10, padding: '10px 12px', fontSize: 12, marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ flex: 1, minWidth: 200 }}>⚠️ {pesan}</span>
          <button onClick={() => ambilKonten({ paksa: true }).then((h) => { setKonten(h); setPesan(h.pesan || ''); })} style={gayaAksi('#b91c1c')}>🔄 Coba lagi</button>
        </div>
      )}

      <div style={gayaKartu}>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setBabAktif(''); }}
          placeholder="Cari mapel, bab, judul buku, atau judul paket… contoh: reproduksi, kelas 10, tenses"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13 }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          {jenjangList.map((j) => (
            <button key={j.jenjang} style={gayaPill(jenjangAktif === j.jenjang)} onClick={() => { setJenjangAktif(j.jenjang); setMapelAktif(''); setBabAktif(''); }}>
              {j.jenjang} <span style={{ opacity: 0.6 }}>({j.jumlahTotal})</span>
            </button>
          ))}
          {memuat && <span style={{ fontSize: 12, color: '#6b7280' }}>Memuat perpustakaan…</span>}
          {!memuat && jenjangList.length === 0 && <span style={{ fontSize: 12, color: '#94a3b8' }}>Tidak ada yang cocok.</span>}
        </div>
      </div>

      {jenjangAktif && (
        <div style={gayaKartu}>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>Mata pelajaran pada {jenjangAktif}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {mapelList.map((m) => (
              <button
                key={m.mapel}
                onClick={() => { setMapelAktif(m.mapel); setBabAktif(''); }}
                style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 10, cursor: 'pointer', border: mapelAktif === m.mapel ? '1.5px solid #3730a3' : '1px solid #e2e8f0', background: mapelAktif === m.mapel ? '#eef2ff' : 'white' }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>{m.mapel}</div>
                <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>
                  {m.jumlah.soal} soal · {m.jumlah.buku} buku · {m.jumlah.paket} paket · {m.bab.length} bab
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {simpul && (
        <div style={gayaKartu}>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>Bab pada {simpul.mapel} ({jenjangAktif})</div>
          {simpul.bab.map((b) => (
            <div key={b.bab} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 10px', marginBottom: 8, background: babAktif === b.bab ? '#f8fafc' : 'white' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => setBabAktif(babAktif === b.bab ? '' : b.bab)} style={{ flex: 1, minWidth: 180, textAlign: 'left', background: 'none', border: 'none', fontSize: 12.5, fontWeight: 700, color: '#1e293b', cursor: 'pointer' }}>
                  {babAktif === b.bab ? '▾' : '▸'} {b.bab}
                  <span style={{ fontSize: 10.5, color: '#64748b', fontWeight: 400 }}>
                    {' '}— {b.soal} soal{b.paket ? `, ${b.paket} paket` : ''}
                    {/* 🔥 BARU (2026-10-07): kompilasi TKA mencampur kelas
                        10-12 dalam satu bab; sebarannya ditampilkan supaya
                        guru tahu isi bab SEBELUM membuka atau mencetak. */}
                    {sebaranKelas(konten.soal.filter((s) => ((s.mataPelajaran || '').trim() || '(Belum dikelompokkan)') === simpul.mapel && ((s.materi || '').trim() || '(Belum dikelompokkan)') === b.bab)).slice(0, 4).map(([k, j]) => ` · kls ${k}: ${j}`).join('')}
                  </span>
                </button>
                {peran === 'guru' && b.soal > 0 && (
                  <button style={gayaAksi('#2563eb')} onClick={() => navigate(`/guru/cetak-latihan?jenjang=${encodeURIComponent(jenjangAktif)}&mapel=${encodeURIComponent(simpul.mapel)}&bab=${encodeURIComponent(b.bab)}`)}>
                    🖨 Cetak latihan bab ini
                  </button>
                )}
                {peran === 'admin' && (
                  <>
                    <button style={gayaAksi('#475569')} onClick={() => navigate('/admin/bank-soal/lemari-soal')}>🗂 Kelola soal</button>
                    <button style={gayaAksi('#475569')} onClick={() => navigate('/admin/buku')}>📖 Buku</button>
                  </>
                )}
              </div>
              {babAktif === b.bab && peran === 'guru' && (
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                  Contoh isi: {konten.soal.filter((s) => (s.materi || '').trim() === b.bab).slice(0, 5).map((s) => String(s.soal || s.teks_soal || '').slice(0, 60)).join(' · ') || '-'}
                </div>
              )}
            </div>
          ))}
          {simpul.buku.length > 0 && (
            <div style={{ fontSize: 11.5, color: '#475569', marginTop: 8 }}>
              📖 Buku: {simpul.buku.map((b) => b.judul).join(' · ')}
            </div>
          )}
          {simpul.paket.length > 0 && (
            <div style={{ fontSize: 11.5, color: '#475569', marginTop: 4 }}>
              📦 Paket: {simpul.paket.map((p) => p.judul).join(' · ')}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (peran === 'admin') {
    return (
      <div style={{ display: 'flex', background: '#f8fafc', minHeight: '100vh' }}>
        <SidebarAdmin />
        <main style={{ marginLeft: window.innerWidth <= 1024 ? '0' : '250px', padding: window.innerWidth <= 1024 ? '15px' : '30px', width: '100%', boxSizing: 'border-box' }}>
          {isi}
        </main>
      </div>
    );
  }
  return isi;
}