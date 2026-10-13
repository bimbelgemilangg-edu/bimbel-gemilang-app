// src/components/admin/PanduImpor.jsx
// ============================================================
// WIZARD DEPAN HALAMAN IMPOR — sistem yang bertanya dulu.
//
// KENAPA ADA (permintaan owner 2026-10-11): admin selain owner bingung
// menghadapi form impor yang panjang; mereka tidak tahu mulai dari mana
// dan apa bedanya TKA/UTBK/reguler bagi sistem. Wizard ini membalik
// urutannya: tiga pertanyaan pendek di depan, lalu form di bawah TERISI
// SENDIRI (jenisUjian, mapel, jenjang, kelas, format) sehingga prompt AI,
// taksonomi, dan penamaan folder ikut benar tanpa admin menghafal sistem.
//
// Komponen ini SENGAJA tipis: seluruh pemetaan pilihan -> metadata hidup
// di src/utils/panduImpor.js (murni & teruji). Di sini hanya urusan klik,
// sesuai kebiasaan repo ini ("halaman hanya urusan klik").
// ============================================================

import React, { useState } from 'react';
import { PILIHAN_KONTEN, PILIHAN_UJIAN, PILIHAN_FORMAT, metaDariPilihan } from '../../utils/panduImpor';

const gayaKartu = {
  background: '#0f172a', color: '#e2e8f0', borderRadius: 14, padding: '18px 20px', marginBottom: 14,
};
const gayaPilih = (aktif) => ({
  display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
  background: aktif ? '#1d4ed8' : '#1e293b', color: '#e2e8f0',
  border: `1px solid ${aktif ? '#60a5fa' : '#334155'}`, borderRadius: 10,
  padding: '10px 12px', marginBottom: 8, fontSize: 12.5, lineHeight: 1.5,
});
const gayaJudul = { fontSize: 14, fontWeight: 800, color: '#f8fafc', margin: '0 0 4px' };
const gayaSub = { fontSize: 11.5, color: '#94a3b8', margin: '0 0 12px' };
const gayaInput = {
  padding: '8px 10px', borderRadius: 8, border: '1px solid #334155',
  background: '#1e293b', color: '#e2e8f0', fontSize: 12.5,
};

export default function PanduImpor({ onSelesai, onLewati }) {
  const [langkah, setLangkah] = useState(1);
  const [konten, setKonten] = useState('');
  const [ujian, setUjian] = useState('');
  const [format, setFormat] = useState('');
  const [mapel, setMapel] = useState('');
  const [jenjang, setJenjang] = useState('SMA');
  const [kelas, setKelas] = useState('');

  const pilihanKonten = PILIHAN_KONTEN.find((k) => k.id === konten) || null;

  const selesai = () => {
    onSelesai(metaDariPilihan({ konten, ujian, format, mapel, jenjang, kelas }));
  };

  return (
    <div style={gayaKartu}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={gayaJudul}>🧭 Mau impor apa hari ini?</div>
          <div style={gayaSub}>
            Tiga pertanyaan supaya sistem menyetel jalurnya sendiri — admin baru tidak perlu menghafal apa pun.
          </div>
        </div>
        {onLewati && (
          <button type="button" onClick={onLewati} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
            lewati panduan (sudah paham)
          </button>
        )}
      </div>

      {langkah === 1 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 8 }}>1 · Jenis kontennya apa?</div>
          {PILIHAN_KONTEN.map((k) => (
            <button type="button" key={k.id} style={gayaPilih(konten === k.id)} onClick={() => { setKonten(k.id); setLangkah(k.pintuLain ? 2 : 2); }}>
              <b>{k.label}</b>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{k.deskripsi}</div>
            </button>
          ))}
        </div>
      )}

      {langkah === 2 && pilihanKonten?.pintuLain && (
        <div style={{ fontSize: 12.5, lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 10px' }}>
            Pilihan itu dikerjakan di pintu lain, bukan di halaman ini — supaya bank soal
            pusat tidak tercampur_aduk dengan materi dan kuis kelas:
          </p>
          <a href={pilihanKonten.pintuLain} style={{ color: '#93c5fd', fontWeight: 800, fontSize: 13 }}>
            → {pilihanKonten.namaPintuLain}
          </a>
          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={() => setLangkah(1)} style={{ ...gayaInput, cursor: 'pointer' }}>← pilih ulang</button>
          </div>
        </div>
      )}

      {langkah === 2 && !pilihanKonten?.pintuLain && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 8 }}>2 · Ujian & identitasnya?</div>
          {PILIHAN_UJIAN.map((u) => (
            <button type="button" key={u.id} style={gayaPilih(ujian === u.id)} onClick={() => setUjian(u.id)}>
              <b>{u.label}</b>
            </button>
          ))}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
            <label style={{ fontSize: 11.5, color: '#94a3b8' }}>
              Mapel
              <input value={mapel} onChange={(e) => setMapel(e.target.value)} placeholder="Matematika / Fisika / Penalaran Umum…" style={{ ...gayaInput, display: 'block', marginTop: 3, width: 220 }} />
            </label>
            <label style={{ fontSize: 11.5, color: '#94a3b8' }}>
              Jenjang
              <select value={jenjang} onChange={(e) => setJenjang(e.target.value)} style={{ ...gayaInput, display: 'block', marginTop: 3 }}>
                {['SD', 'SMP', 'SMA', 'SMK'].map((j) => <option key={j}>{j}</option>)}
              </select>
            </label>
            <label style={{ fontSize: 11.5, color: '#94a3b8' }}>
              Kelas
              <input value={kelas} onChange={(e) => setKelas(e.target.value)} placeholder="10/11/12" style={{ ...gayaInput, display: 'block', marginTop: 3, width: 80 }} />
            </label>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setLangkah(1)} style={{ ...gayaInput, cursor: 'pointer' }}>← kembali</button>
            <button type="button" disabled={!ujian} onClick={() => setLangkah(3)} style={{ ...gayaInput, cursor: ujian ? 'pointer' : 'not-allowed', opacity: ujian ? 1 : 0.5, background: '#1d4ed8', border: '1px solid #60a5fa', fontWeight: 800 }}>
              lanjut →
            </button>
          </div>
        </div>
      )}

      {langkah === 3 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 8 }}>3 · Bentuk berkas sumbernya?</div>
          {PILIHAN_FORMAT.map((f) => (
            <button type="button" key={f.id} style={gayaPilih(format === f.id)} onClick={() => setFormat(f.id)}>
              <b>{f.label}</b>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{f.deskripsi}</div>
            </button>
          ))}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setLangkah(2)} style={{ ...gayaInput, cursor: 'pointer' }}>← kembali</button>
            <button type="button" disabled={!format} onClick={selesai} style={{ ...gayaInput, cursor: format ? 'pointer' : 'not-allowed', opacity: format ? 1 : 0.5, background: '#15803d', border: '1px solid #4ade80', fontWeight: 800 }}>
              ✅ mulai impor dengan setelan ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
