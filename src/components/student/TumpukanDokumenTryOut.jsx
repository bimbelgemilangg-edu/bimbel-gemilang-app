// src/components/student/TumpukanDokumenTryOut.jsx
// ============================================================
// 📄 TUMPUKAN DOKUMEN (permintaan owner 14 Okt 2026): daftar try out
// sebagai tumpukan berkas dokumen — satu dokumen = SATU test (subtes),
// bukan satu paket utuh. UX scroll = "memilah dokumen": kartu bersifat
// sticky sehingga saat discroll kartu berikutnya menimpa kartu di
// bawahnya sementara kartu tertimpa sedikit terangkat & miring, seperti
// lembar kertas yang disisihkan ke atas tumpukan.
//
// Komponen ini PRESENTASIONAL: isi dokumen dihitung util murni
// src/utils/dokumenTryOut.js (teruji di tests/dokumenTryOut.test.mjs),
// termasuk aturan kunci urutan untuk paket mode per-subtes.
// ============================================================
import React, { useEffect, useRef } from 'react';
import { Lock, Clock3, CalendarDays, FileText, Play, CheckCircle2, Layers } from 'lucide-react';
import { posisiMascotUntukMapel, berkasMascotUntukMapel } from '../../utils/papanJelajah.js';

const SPRITE = '/mascot/mascot-mapel.png';
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const tgl = (m) => (m ? `${new Date(m).getDate()} ${BULAN[new Date(m).getMonth()]}` : null);

const WARNA_PAPAN = {
  'matematika tingkat lanjut': '#F59E0B',
  'bahasa indonesia tingkat lanjut': '#2563EB',
  'bahasa inggris tingkat lanjut': '#0EA5E9',
  matematika: '#F59E0B',
  'bahasa indonesia': '#2563EB',
  'bahasa inggris': '#0EA5E9',
  kimia: '#EC4899',
  fisika: '#4F46E5',
  biologi: '#22C55E',
  sosiologi: '#8B5CF6',
  geografi: '#0284C7',
  sejarah: '#D97706',
  ekonomi: '#06B6D4',
};
const KUNCI_WARNA = Object.keys(WARNA_PAPAN).sort((a, b) => b.length - a.length);
const warnaMapel = (nama) => {
  const h = String(nama || '').toLowerCase();
  const k = KUNCI_WARNA.find((x) => h.includes(x));
  return k ? WARNA_PAPAN[k] : '#7C3AED';
};

const ROTASI = [-1.1, 0.9, -0.7, 1.1, -0.9, 0.6];

const warnaStamp = (stamp) => {
  if (stamp.startsWith('SELESAI')) return '#16a34a';
  if (stamp === 'TERKUNCI' || stamp === 'LEWAT' || stamp === 'SUDAH DIAMBIL') return '#dc2626';
  if (stamp === 'TERJADWAL') return '#2563eb';
  if (stamp === 'SEDANG DIKERJAKAN') return '#f97316';
  return '#65a30d';
};

function Maskot({ mapel, ukuran = 92 }) {
  const berkas = berkasMascotUntukMapel(mapel);
  const pos = posisiMascotUntukMapel(mapel);
  if (berkas) {
    return (
      <img
        src={berkas}
        alt={`Maskot ${mapel}`}
        style={{ width: ukuran, height: ukuran, objectFit: 'contain', flex: '0 0 auto', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.15))' }}
      />
    );
  }
  if (pos) {
    return (
      <div
        aria-label={`Maskot ${mapel}`}
        style={{
          width: ukuran, height: ukuran, flex: '0 0 auto', borderRadius: 12,
          backgroundImage: `url(${SPRITE})`, backgroundSize: '600% 500%',
          backgroundPosition: `${pos.xPct}% ${pos.yPct}%`, backgroundRepeat: 'no-repeat',
          backgroundColor: '#fff', border: '1px solid #e2e8f0',
        }}
      />
    );
  }
  return (
    <div style={{ width: ukuran, height: ukuran, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: ukuran / 2.2, background: '#f1f5f9', borderRadius: 12 }}>
      🚀
    </div>
  );
}

function chip(warna) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 9px', borderRadius: 999,
    fontSize: 11, fontWeight: 700, background: `${warna}14`, color: '#334155', border: `1px solid ${warna}55`,
  };
}

export default function TumpukanDokumenTryOut({ dokumen = [], onBuka, petunjuk = true }) {
  const refs = useRef([]);

  // UX "memilah dokumen": kartu tertimpa kartu lain saat scroll terangkat
  // sedikit + miring + mengecil, seperti lembar yang disisihkan ke atas.
  useEffect(() => {
    let raf = 0;
    const hitung = () => {
      raf = 0;
      refs.current.forEach((el, i) => {
        if (!el) return;
        const next = refs.current[i + 1];
        const base = ROTASI[i % ROTASI.length];
        if (!next) { el.style.transform = `rotate(${base}deg)`; return; }
        const r = el.getBoundingClientRect();
        const n = next.getBoundingClientRect();
        const prog = Math.min(1, Math.max(0, 1 - (n.top - r.top) / (r.height + 20)));
        el.style.transform = `rotate(${base - prog * 2.4}deg) translateY(${-prog * 18}px) scale(${1 - prog * 0.045})`;
        el.style.filter = `brightness(${1 - prog * 0.1})`;
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(hitung); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    hitung();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [dokumen.length]);

  if (!dokumen.length) return null;

  return (
    <div>
      {petunjuk ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: '#94a3b8', margin: '2px 2px 10px' }}>
          <Layers size={13} /> Tumpukan dokumen misimu — scroll untuk memilah, ketuk dokumen untuk membuka.
        </div>
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 8 }}>
        {dokumen.map((d, i) => {
          const warna = warnaMapel(d.mapel);
          const stamp = warnaStamp(d.stamp);
          return (
            <div key={d.id} style={{ position: 'sticky', top: 8 + Math.min(i, 6) * 12, zIndex: i + 1 }}>
              <div
                ref={(el) => { refs.current[i] = el; }}
                style={{
                  background: '#fffdf8', color: '#1f2937', borderRadius: 10,
                  border: '1px solid #e4ddcc', borderLeft: `7px solid ${warna}`,
                  boxShadow: '0 12px 26px rgba(15,23,42,.16)', padding: '14px 16px 16px',
                  transform: `rotate(${ROTASI[i % ROTASI.length]}deg)`,
                  filter: d.terkunci ? 'grayscale(.7)' : undefined,
                  willChange: 'transform',
                }}
              >
                {/* tepi perforasi seperti lembar dokumen */}
                <div style={{ borderTop: '2px dashed #d9d2bf', margin: '-8px -10px 12px' }} />
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {d.urutan ? (
                        <span style={{ background: warna, color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 10.5, fontWeight: 900, letterSpacing: .6 }}>
                          TEST {d.urutan.ke}/{d.urutan.dari}
                        </span>
                      ) : (
                        <span style={{ background: '#334155', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: 10.5, fontWeight: 900, letterSpacing: .6 }}>
                          DOKUMEN
                        </span>
                      )}
                      <span style={{
                        border: `2px solid ${stamp}`, color: stamp, borderRadius: 4, padding: '1px 8px',
                        fontSize: 10.5, fontWeight: 900, letterSpacing: 1.2, transform: 'rotate(-3deg)', opacity: .9,
                      }}
                      >
                        {d.stamp}
                      </span>
                    </div>
                    <div style={{ marginTop: 7, fontSize: 16.5, fontWeight: 900, letterSpacing: .2 }}>{d.judul}</div>
                    {d.judulPaket && d.judulPaket !== d.judul ? (
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{d.judulPaket}</div>
                    ) : null}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      <span style={chip(warna)}><FileText size={12} /> {d.jumlahSoal} soal</span>
                      {d.durasiMenit ? <span style={chip(warna)}><Clock3 size={12} /> {d.durasiMenit} mnt</span> : null}
                      {d.waktuBuka ? <span style={chip(warna)}><CalendarDays size={12} /> dibuka {tgl(d.waktuBuka)}</span> : null}
                      {d.skor !== null && d.skor !== undefined ? <span style={chip('#16a34a')}><CheckCircle2 size={12} /> skor {Math.round(d.skor)}%</span> : null}
                    </div>
                    {d.catatan ? (
                      <div style={{ marginTop: 8, fontSize: 11.5, color: '#57534e', background: '#faf7ef', border: '1px solid #eee6d2', borderRadius: 8, padding: '6px 9px', lineHeight: 1.5 }}>
                        {d.terkunci ? <Lock size={11} style={{ verticalAlign: -2, marginRight: 4 }} /> : null}
                        {d.catatan}
                      </div>
                    ) : null}
                    <div style={{ marginTop: 10 }}>
                      {d.bisaDibuka ? (
                        <button
                          type="button"
                          onClick={() => onBuka(d)}
                          style={{
                            padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: `linear-gradient(90deg, ${warna}, #7c3aed)`, color: '#fff', fontWeight: 900, fontSize: 13,
                            boxShadow: '0 3px 0 rgba(0,0,0,.18)',
                          }}
                        >
                          <Play size={13} style={{ verticalAlign: -2, marginRight: 6 }} />
                          {d.stamp === 'SEDANG DIKERJAKAN' ? 'LANJUTKAN TEST INI' : 'BUKA DOKUMEN'}
                        </button>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#9ca3af' }}>
                          <Lock size={13} />
                          {d.stamp === 'TERJADWAL' ? `Dibuka ${tgl(d.waktuBuka)}` : d.stamp === 'SELESAI' || d.stamp.startsWith('SELESAI') ? 'Sudah selesai — lihat hasil lewat riwayat' : 'Belum bisa dibuka'}
                        </span>
                      )}
                    </div>
                  </div>
                  <Maskot mapel={d.mapel} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
