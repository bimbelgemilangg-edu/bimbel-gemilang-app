// PapanJelajahPage.jsx
// ============================================================
// 🚀 Tampilan BARU daftar try out siswa (permintaan owner 13 Okt 2026):
// tema luar angkasa, kartu pos maskot astronot pegang papan mapel (sprite
// 6x5 dari asset postcard owner), hanya misi mendatang/hari itu yang tampil
// besar, arsip rapi terlipat, dan tab "Papan Analitik" pengganti leaderboard
// (tren pekan, tempo, evaluasi subtes, tips) khusus TKA/UTBK.
// Hidup hanya lewat sakelar fitur 'papanJelajah' (default MATI) sehingga
// try out Sabtu 17 Okt di produksi tidak terganggu sama sekali.
// ============================================================
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, documentId, getDocs, query, where } from 'firebase/firestore';
import { Rocket, CalendarDays, ChevronDown, Sparkles, Timer, Target } from 'lucide-react';
import { posisiMascotUntukMapel, hitungAnalitik, potongUntukQuery } from '../../../utils/papanJelajah.js';
import { bangunDokumenTryOut } from '../../../utils/dokumenTryOut.js';
import TumpukanDokumenTryOut from '../../../components/student/TumpukanDokumenTryOut.jsx';
import { hitungTotalSkor } from '../../../utils/skorSoalTryOut.js';

const SPRITE = '/mascot/mascot-mapel.png';
const ms = (v) => (typeof v?.toDate === 'function' ? v.toDate().getTime() : v ? new Date(v).getTime() : null);
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const tgl = (m) => (m ? `${new Date(m).getDate()} ${BULAN[new Date(m).getMonth()]}` : '-');
// Jam dibaca SATU KALI saat modul dimuat: aturan eslint react-hooks/purity
// melarang Date.now() dipanggil di dalam render (hasilnya bisa berubah-ubah
// antar render). Untuk pengelompokan misi, jam saat halaman dibuka cukup.

const WAKTU_MUAT = Date.now();

const st = {
  bungkus: {
    minHeight: '100%', padding: '20px 16px 60px', color: '#eef1ff',
    background: 'radial-gradient(1200px 500px at 80% -10%, rgba(124,58,237,.35), transparent 60%), radial-gradient(900px 420px at 10% 0%, rgba(249,115,22,.22), transparent 55%), linear-gradient(180deg,#0b1030 0%,#141a45 55%,#0b1030 100%)',
    backgroundImage: 'radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,.7), transparent), radial-gradient(1.5px 1.5px at 70% 12%, rgba(255,255,255,.55), transparent), radial-gradient(1.5px 1.5px at 45% 70%, rgba(255,255,255,.4), transparent), radial-gradient(1200px 500px at 80% -10%, rgba(124,58,237,.35), transparent 60%), linear-gradient(180deg,#0b1030 0%,#141a45 55%,#0b1030 100%)',
    borderRadius: 18,
  },
  judul: { margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: .4 },
  sub: { margin: '4px 0 16px', color: '#9aa3d6', fontSize: 13 },
  tab: (aktif) => ({
    padding: '8px 18px', borderRadius: 999, border: '1px solid rgba(255,255,255,.18)', cursor: 'pointer',
    background: aktif ? 'linear-gradient(90deg,#7c3aed,#f97316)' : 'transparent', color: '#fff', fontWeight: 700, fontSize: 13,
  }),
  kartu: {
    background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 16,
    padding: 14, display: 'flex', gap: 14, alignItems: 'center', backdropFilter: 'blur(6px)',
  },
  mascot: (pos, ukuran = 74) => (pos ? {
    width: ukuran, height: ukuran, borderRadius: 14, flex: '0 0 auto',
    backgroundImage: `url(${SPRITE})`, backgroundSize: '600% 500%', backgroundPosition: `${pos.xPct}% ${pos.yPct}%`,
    backgroundRepeat: 'no-repeat', border: '1px solid rgba(255,255,255,.25)', boxShadow: '0 6px 18px rgba(0,0,0,.35)',
  } : {
    width: ukuran, height: ukuran, borderRadius: 14, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg,#312e81,#7c3aed)', fontSize: ukuran / 2.4, border: '1px solid rgba(255,255,255,.25)',
  }),
  chip: (warna = '#7c3aed') => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700,
    background: `${warna}22`, color: '#fff', border: `1px solid ${warna}88`, marginRight: 6,
  }),
  deskripsi: { color: '#c3c9ef', fontSize: 12.5, lineHeight: 1.55, margin: '6px 0 0' },
};

export default function PapanJelajahPage({ studentId = '' }) {
  const navigate = useNavigate();
  const [paket, setPaket] = useState([]);
  const [paketRiwayat, setPaketRiwayat] = useState([]);
  const [sesi, setSesi] = useState([]);
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('');
  const [tab, setTab] = useState('misi');
  const [arsipBuka, setArsipBuka] = useState(false);
  const [muat, setMuat] = useState(true);

  useEffect(() => {
    let hidup = true;
    (async () => {
      try {
        const snapSiswa = await getDocs(query(collection(db, 'students'), where('studentId', '==', studentId)));
        const dS = snapSiswa.docs[0]?.data() || {};
        const snapPaket = await getDocs(query(collection(db, 'tryout_paket'), where('status', '==', 'aktif')));
        const snapSesi = await getDocs(query(collection(db, 'tryout_sesi'), where('studentId', '==', studentId)));
        if (!hidup) return;
        setNama(dS.nama || dS.name || studentId);
        setKelas(dS.kelas || dS.kelasSekolah || '');
        const paketAktif = snapPaket.docs.map((d) => ({ id: d.id, ...d.data() }));
        const sesiList = snapSesi.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPaket(paketAktif);
        setSesi(sesiList);
        // 🛡️ AUDIT 2026-10-13 (bug arsip): sesi lama menunjuk paket yang
        // sudah 'arsip'/'nonaktif' -- di luar hasil query status=='aktif'.
        // Tanpa dokumen paketnya, jenisUjian/totalSoal hilang dan sesi itu
        // DIAM-DIAM terbuang dari Papan Analitik. Ambil paket yang kurang
        // per chunk (batas operator 'in' Firestore) ke state TERPISAH:
        // hanya untuk memperkaya analitik, TIDAK ikut daftar misi/arsip.
        const idAktif = new Set(paketAktif.map((p) => p.id));
        const idKurang = [...new Set(
          sesiList
            .filter((s) => s.status === 'selesai')
            .map((s) => s.paketId || s.tryoutId)
            .filter((id) => id && !idAktif.has(id)),
        )];
        if (idKurang.length) {
          const riwayat = [];
          for (const chunk of potongUntukQuery(idKurang)) {
            const snapR = await getDocs(query(collection(db, 'tryout_paket'), where(documentId(), 'in', chunk)));
            snapR.docs.forEach((d) => riwayat.push({ id: d.id, ...d.data() }));
            if (!hidup) return;
          }
          if (hidup) setPaketRiwayat(riwayat);
        }
      } catch (e) {
        console.error('Gagal memuat papan jelajah:', e);
      } finally {
        if (hidup) setMuat(false);
      }
    })();
    return () => { hidup = false; };
  }, [studentId]);

  const kini = WAKTU_MUAT;
  const sesiPerPaket = useMemo(() => {
    const m = new Map();
    sesi.filter((s) => s.status === 'selesai').forEach((s) => {
      const pid = s.paketId || s.tryoutId || '';
      if (!m.has(pid) || (ms(s.waktuSelesai) || 0) > (ms(m.get(pid).waktuSelesai) || 0)) m.set(pid, s);
    });
    return m;
  }, [sesi]);

  const tergolong = useMemo(() => {
    const mendatang = [];
    const arsip = [];
    paket.forEach((p) => {
      const tutup = ms(p.waktuTutup);
      const selesai = sesiPerPaket.has(p.id);
      const lewat = tutup !== null && kini > tutup;
      if (selesai || lewat) arsip.push(p);
      else mendatang.push(p);
    });
    mendatang.sort((a, b) => (ms(a.waktuBuka) || 0) - (ms(b.waktuBuka) || 0));
    arsip.sort((a, b) => (ms(b.waktuBuka) || 0) - (ms(a.waktuBuka) || 0));
    return { mendatang, arsip };
  }, [paket, sesiPerPaket, kini]);

  // 📄 14 Okt 2026 (permintaan owner): daftar misi = TUMPUKAN DOKUMEN,
  // satu dokumen = SATU test (subtes). Paket 3 subtes tampil sebagai 3
  // lembar berurutan; kunci urutan & skor per test dihitung util murni
  // dokumenTryOut.js (teruji), bukan di komponen ini.
  const dokumenMisi = useMemo(
    () => tergolong.mendatang.flatMap((p) => bangunDokumenTryOut(p, { kini, sesi: sesiPerPaket.get(p.id) || null })),
    [tergolong, sesiPerPaket, kini],
  );

  // 🛡️ AUDIT 2026-10-13: analitik boleh melihat paket riwayat (arsip/
  // nonaktif) supaya sesi lama tidak hilang dari tren; daftar misi & arsip
  // di tab sebelah TETAP hanya dari paket aktif.
  const paketUntukAnalitik = useMemo(() => [...paket, ...paketRiwayat], [paket, paketRiwayat]);

  const analitik = useMemo(() => hitungAnalitik(
    [...sesiPerPaket.values()].map((s) => {
      const p = paketUntukAnalitik.find((x) => x.id === (s.paketId || s.tryoutId));
      const daftar = p?.daftarSoal || [];
      const subtes = (p?.subtes || []).map((sb) => {
        const ids = new Set(sb.soalIds || sb.daftarSoal || []);
        const kelompok = ids.size ? daftar.filter((q) => ids.has(q.id)) : [];
        const r = kelompok.length ? hitungTotalSkor(kelompok, s.jawaban || {}) : null;
        return { nama: sb.nama || sb.judul || 'Subtes', skorPersen: r?.totalSkorPersen ?? null };
      }).filter((x) => x.skorPersen !== null);
      return {
        nama: p?.judul || 'Try out',
        jenisUjian: p?.jenisUjian || '',
        totalSkorPersen: s.totalSkorPersen,
        waktuSelesaiMs: ms(s.waktuSelesai),
        createdAtMs: ms(s.createdAt),
        totalSoal: p?.totalSoal || daftar.length,
        subtes,
      };
    }),
  ), [sesiPerPaket, paketUntukAnalitik]);

  if (muat) return <div style={{ padding: 30, color: '#9aa3d6' }}>🛰️ Menyiapkan papan jelajah…</div>;

  return (
    <div style={st.bungkus}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h2 style={st.judul}>🪐 Papan Jelajah</h2>
          <p style={st.sub}>{nama}{kelas ? ` · ${kelas}` : ''} — misi try out & analitik TKA/UTBK-mu</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" style={st.tab(tab === 'misi')} onClick={() => setTab('misi')}><CalendarDays size={14} style={{ verticalAlign: -2 }} /> Misi</button>
          <button type="button" style={st.tab(tab === 'analitik')} onClick={() => setTab('analitik')}><Sparkles size={14} style={{ verticalAlign: -2 }} /> Papan Analitik</button>
        </div>
      </div>

      {tab === 'misi' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dokumenMisi.length ? (
            <TumpukanDokumenTryOut dokumen={dokumenMisi} onBuka={(d) => navigate(`/siswa/tryout/${d.paketId}`)} />
          ) : (
            <div style={st.kartu}>🌙 Belum ada misi mendatang. Try out biasanya dibuka setiap Sabtu pagi.</div>
          )}
          {tergolong.arsip.length ? (
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setArsipBuka((v) => !v)}
                style={{ ...st.tab(false), display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                🗄️ Arsip misi ({tergolong.arsip.length}) <ChevronDown size={14} style={{ transform: arsipBuka ? 'rotate(180deg)' : undefined }} />
              </button>
              {arsipBuka ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                  {tergolong.arsip.map((p) => {
                    const s = sesiPerPaket.get(p.id);
                    const skor = s ? Math.round(s.totalSkorPersen || 0) : null;
                    return (
                      <div key={p.id} style={{ ...st.kartu, padding: 10 }}>
                        <div style={st.mascot(posisiMascotUntukMapel((p.komposisi || [])[0]?.mapel || p.judul || ''), 46)} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.judul}</div>
                          <div style={{ color: '#9aa3d6', fontSize: 11.5 }}>{tgl(ms(p.waktuBuka))}</div>
                        </div>
                        <span style={st.chip(skor === null ? '#64748b' : skor >= 70 ? '#16a34a' : '#f97316')}>
                          {skor === null ? 'terlewat' : `${skor}%`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {analitik.jumlahSesi === 0 ? (
            <div style={st.kartu}>🛰️ Papan Analitik khusus try out TKA & UTBK. Selesaikan misi TKA/UTBK pertamamu, tren nilai pekananmu akan muncul di sini.</div>
          ) : (
            <>
              <div style={st.kartu}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}><Target size={15} style={{ verticalAlign: -3 }} /> Tren skor TKA/UTBK per pekan</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    {analitik.tren.map((t) => (
                      <div key={t.label} style={{ background: 'rgba(255,255,255,.08)', borderRadius: 12, padding: '8px 12px', textAlign: 'center', border: '1px solid rgba(255,255,255,.14)' }}>
                        <div style={{ fontSize: 20, fontWeight: 900 }}>{t.skor}</div>
                        <div style={{ fontSize: 10.5, color: '#9aa3d6' }}>{t.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: t.delta === null ? '#9aa3d6' : t.delta >= 0 ? '#4ade80' : '#f87171' }}>
                          {t.delta === null ? '—' : `${t.delta >= 0 ? '▲ +' : '▼ '}${t.delta}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {analitik.kecepatan ? (
                <div style={st.kartu}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}><Timer size={15} style={{ verticalAlign: -3 }} /> Tempo kerja (misi terakhir)</div>
                    <div style={{ fontSize: 13, marginTop: 6, color: '#c3c9ef' }}>
                      ~<b style={{ fontSize: 20, color: analitik.kecepatan.wajar ? '#4ade80' : '#f87171' }}>{analitik.kecepatan.detikPerSoal}</b> detik/soal
                      {' '}(target ≤ 90). Perekam tempo per subtes dipasang setelah try out Sabtu.
                    </div>
                  </div>
                </div>
              ) : null}
              {analitik.subtesRata.length ? (
                <div style={st.kartu}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>📊 Rata-rata skor per subtes</div>
                    {analitik.subtesRata.map((s) => (
                      <div key={s.nama} style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#c3c9ef' }}>
                          <span>{s.nama}</span><b>{s.skor}%</b>
                        </div>
                        <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,.12)', marginTop: 3 }}>
                          <div style={{ height: '100%', width: `${Math.min(100, s.skor)}%`, borderRadius: 999, background: 'linear-gradient(90deg,#f97316,#7c3aed)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div style={st.kartu}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}><Rocket size={15} style={{ verticalAlign: -3 }} /> Evaluasi & tips pintar</div>
                  {analitik.evaluasi ? <p style={st.deskripsi}>{analitik.evaluasi}</p> : null}
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12.5, color: '#c3c9ef', lineHeight: 1.7 }}>
                    {analitik.tips.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
