// src/pages/teacher/laporan/LaporanBelajarPage.jsx
// ============================================================
// PENGISIAN LAPORAN BELAJAR (keputusan owner 31 Okt 2026).
// Guru mengisi CAPAIAN per siswa (sumber utama laporan orang tua), memberi
// catatan & rencana pengayaan. Siswa yang tampil HANYA yang terdaftar pada
// mapel yang dipegang guru ini DAN masih aktif. Ada DRAFT otomatis (aman bila
// sinyal putus); tugas hilang dari dashboard bila semua siswa sudah 'selesai'.
//
// Menyimpan ke koleksi Firestore `laporan_belajar` (dok idempoten per
// periode+siswa+mapel). Periode dibuka/ditutup admin lewat settings/global_config.
// ============================================================
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, Hand, ShieldCheck, TrendingUp, Save, CheckCircle2, Clock3, User,
  ChevronLeft, Loader2, AlertCircle, Info, ClipboardList, Sparkles,
} from 'lucide-react';
import SidebarGuru from '../../../components/SidebarGuru';
import { db } from '../../../firebase';
import { collection, getDocs, query, where, doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import {
  DIMENSI_LAPORAN, PREDIKAT_CAPAIAN,
  capaianKosong, statusPengisianSiswa, progresPengisian,
  mapelDiampuGuru, filterSiswaUntukGuru, namaMapelGuru,
  kunciDokLaporan, bentukDokumenLaporan, FIELD_LAPORAN_BELAJAR, pengisianDibuka,
} from '../../../utils/laporanBelajar';

const KOLEKSI_LAPORAN = 'laporan_belajar';
const IKON_DIMENSI = { Brain, Hand, ShieldCheck, TrendingUp };

const STATUS_META = {
  selesai: { label: 'Selesai', warna: '#16a34a', bg: '#dcfce7', ikon: CheckCircle2 },
  draft: { label: 'Draft', warna: '#b45309', bg: '#fef3c7', ikon: Clock3 },
  kosong: { label: 'Belum diisi', warna: '#64748b', bg: '#f1f5f9', ikon: AlertCircle },
};

export default function LaporanBelajarPage() {
  const navigate = useNavigate();
  const [guru] = useState(() => {
    try { return JSON.parse(localStorage.getItem('teacherData') || 'null'); } catch { return null; }
  });

  const [cfg, setCfg] = useState(null);       // sakelar periode dari admin
  const [daftarMapel, setDaftarMapel] = useState([]);
  const [kodeMapelAktif, setKodeMapelAktif] = useState('');
  const [siswa, setSiswa] = useState([]);      // siswa mapel aktif (terdaftar + aktif)
  const [petaLaporan, setPetaLaporan] = useState({}); // studentId -> dok laporan
  const [terpilih, setTerpilih] = useState(null);      // siswa yang dibuka formnya
  const [form, setForm] = useState(null);              // capaian draft lokal
  const [memuat, setMemuat] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesanSimpan, setPesanSimpan] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const simpanTimer = useRef(null);

  // ---- baca sesi guru ----
  useEffect(() => {
    if (!guru) { navigate('/login-guru'); }
  }, [guru, navigate]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ---- baca sakelar periode (live) ----
  useEffect(() => {
    if (!guru) return undefined;
    const ref = doc(db, 'settings', 'global_config');
    const unsub = onSnapshot(ref, (snap) => {
      setCfg((snap.data() || {})[FIELD_LAPORAN_BELAJAR] || null);
    }, () => setCfg(null));
    return () => unsub();
  }, [guru]);

  const periode = cfg?.periode || '';
  const dibuka = pengisianDibuka(cfg).dibuka;

  // ---- mapel yang dipegang guru ----
  useEffect(() => {
    if (!guru) return;
    const dm = mapelDiampuGuru(guru);
    setDaftarMapel(dm);
    setKodeMapelAktif((prev) => prev || (dm[0]?.kodeMapel || ''));
  }, [guru]);

  // ---- muat siswa + laporan tiap periode/mapel aktif berubah ----
  const muatData = useCallback(async () => {
    if (!guru || !dibuka || !periode || !kodeMapelAktif) { setMemuat(false); return; }
    setMemuat(true);
    try {
      const [snapSiswa, snapLaporan] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(query(collection(db, KOLEKSI_LAPORAN), where('periode', '==', periode))),
      ]);
      const semuaSiswa = snapSiswa.docs.map((d) => ({ id: d.id, ...d.data() }));
      const guruMapel = { ...guru, kodeMapel: kodeMapelAktif, mapelDetails: [{ kodeMapel: kodeMapelAktif, namaMapel: namaMapelGuru(guru, kodeMapelAktif) }] };
      const daftar = filterSiswaUntukGuru(semuaSiswa, guruMapel);
      setSiswa(daftar);

      const peta = {};
      for (const d of snapLaporan.docs) {
        const x = d.data();
        if (String(x.kodeMapel || '').toLowerCase() === String(kodeMapelAktif).toLowerCase()) {
          peta[String(x.studentId || '')] = { id: d.id, ...x };
        }
      }
      setPetaLaporan(peta);
    } catch (e) {
      console.error('Gagal memuat data laporan belajar:', e);
    } finally {
      setMemuat(false);
    }
  }, [guru, dibuka, periode, kodeMapelAktif]);

  useEffect(() => {
    if (!dibuka) { setMemuat(false); return; }
    queueMicrotask(() => { muatData(); });
  }, [muatData, dibuka]);

  // ---- buka form satu siswa ----
  const bukaSiswa = (s) => {
    setTerpilih(s);
    const dok = petaLaporan[s.id];
    setForm(dok
      ? { capaian: { ...capaianKosong(), ...(dok.capaian || {}) }, catatanGuru: dok.catatanGuru || '', pengayaan: dok.pengayaan || '' }
      : { capaian: capaianKosong(), catatanGuru: '', pengayaan: '' });
    setPesanSimpan('');
  };

  const tutupForm = () => { setTerpilih(null); setForm(null); };

  // ---- simpan (draft otomatis, debounce) ----
  const simpan = useCallback(async (data, { senyap = false } = {}) => {
    if (!guru || !terpilih || !periode || !kodeMapelAktif) return;
    setMenyimpan(true);
    try {
      const dok = bentukDokumenLaporan({
        periode, periodeLabel: cfg?.periodeLabel || '',
        studentId: terpilih.id, studentName: terpilih.nama || '',
        studentKelas: terpilih.kelasSekolah || terpilih.kelas || '', jenjang: terpilih.jenjang || '',
        kodeMapel: kodeMapelAktif, namaMapel: namaMapelGuru(guru, kodeMapelAktif),
        teacherId: guru.id || '', teacherName: guru.nama || '',
        capaian: data.capaian, catatanGuru: data.catatanGuru, pengayaan: data.pengayaan,
      });
      await setDoc(doc(db, KOLEKSI_LAPORAN, kunciDokLaporan(periode, terpilih.id, kodeMapelAktif)), {
        ...dok, diperbaruiAt: serverTimestamp(),
      }, { merge: true });
      setPetaLaporan((prev) => ({ ...prev, [terpilih.id]: { ...prev[terpilih.id], ...dok } }));
      if (!senyap) setPesanSimpan(`Tersimpan ${new Date().toLocaleTimeString('id-ID')} · status: ${dok.status}`);
    } catch (e) {
      setPesanSimpan(`Gagal menyimpan: ${e.message}`);
    } finally {
      setMenyimpan(false);
    }
  }, [guru, terpilih, periode, kodeMapelAktif, cfg]);

  // debounce simpan tiap form berubah (draft aman bila sinyal putus)
  useEffect(() => {
    if (!form || !terpilih) return undefined;
    if (simpanTimer.current) clearTimeout(simpanTimer.current);
    simpanTimer.current = setTimeout(() => { simpan(form, { senyap: true }); }, 1200);
    return () => { if (simpanTimer.current) clearTimeout(simpanTimer.current); };
  }, [form, terpilih, simpan]);

  const ubahPredikat = (key, huruf) => {
    setForm((f) => ({ ...f, capaian: { ...f.capaian, [key]: { ...f.capaian[key], predikat: f.capaian[key].predikat === huruf ? '' : huruf } } }));
  };
  const toggleDeskriptor = (key, id) => {
    setForm((f) => {
      const cur = f.capaian[key].deskriptor || [];
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return { ...f, capaian: { ...f.capaian, [key]: { ...f.capaian[key], deskriptor: next } } };
    });
  };

  const progres = progresPengisian(siswa, petaLaporan);
  const statusSiswa = (id) => statusPengisianSiswa(petaLaporan[id]);

  // ============ RENDER ============
  if (!guru) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <SidebarGuru />
      <div style={{ flex: 1, marginLeft: isMobile ? 0 : 216, padding: isMobile ? 12 : 22, minWidth: 0 }}>
        <button type="button" onClick={() => navigate('/guru/dashboard')} style={{ background: 'none', border: 'none', color: '#4338ca', cursor: 'pointer', fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8, padding: 0 }}>
          <ChevronLeft size={14} /> Kembali ke Dashboard
        </button>
        <h1 style={{ margin: '0 0 4px', fontSize: 20 }}>📝 Pengisian Laporan Belajar</h1>
        <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 14 }}>
          Capaian yang Anda isi di sini menjadi <b>isi utama laporan belajar orang tua</b>. Keaktifan otomatis (kuis harian, try out, absensi) dari sistem Gemilang tetap dilampirkan sebagai bahan pendukung.
        </div>

        {!dibuka ? (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: 16, color: '#78350f', fontSize: 13 }}>
            <Info size={16} style={{ verticalAlign: -3, marginRight: 6 }} />
            Periode pengisian laporan belajar <b>belum/sedang tidak dibuka</b> oleh admin. Tugas akan muncul di sini begitu admin membuka periode pengisian.
          </div>
        ) : (
          <>
            {/* v1.5: penegas peran tentor — capaian guru = isi utama PDF orang tua */}
            <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 11.5, color: '#3730a3', lineHeight: 1.55 }}>
              ✍️ Capaian yang Anda isi adalah <b>isi utama PDF orang tua</b>; bukti otomatis (kuis, try out, kehadiran) tampil sebagai bahan pendukung. Siswa yang bukti otomatisnya masih tipis periode ini sangat mengandalkan penilaian Anda.
            </div>
            {/* bar periode + mapel + progres */}
            <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 14 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>PERIODE</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{cfg?.periodeLabel || periode}</div>
                </div>
                {daftarMapel.length > 1 && (
                  <label style={{ fontSize: 12 }}>
                    <div style={{ marginBottom: 4, fontWeight: 700, color: '#475569' }}>Mapel yang diisi</div>
                    <select value={kodeMapelAktif} onChange={(e) => { setKodeMapelAktif(e.target.value); tutupForm(); }} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
                      {daftarMapel.map((m) => <option key={m.kodeMapel} value={m.kodeMapel}>{m.namaMapel || m.kodeMapel}</option>)}
                    </select>
                  </label>
                )}
                <div style={{ minWidth: 180 }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>PROGRES PENGISIAN</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: progres.semuaSelesai ? '#16a34a' : '#1e293b' }}>
                    {progres.selesai}/{progres.total} siswa selesai
                  </div>
                  <div style={{ height: 8, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', marginTop: 4 }}>
                    <div style={{ height: '100%', width: `${progres.persenSelesai}%`, background: progres.semuaSelesai ? '#16a34a' : '#6366f1', transition: 'width .3s' }} />
                  </div>
                </div>
              </div>
              {progres.semuaSelesai && (
                <div style={{ marginTop: 10, fontSize: 12.5, color: '#166534', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 10px' }}>
                  ✅ Semua siswa sudah diisi. Tugas ini hilang dari dashboard Anda. Terima kasih — laporan siap diterbitkan admin.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* daftar siswa */}
              <div style={{ flex: '1 1 300px', minWidth: 280, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ClipboardList size={15} /> Siswa {namaMapelGuru(guru, kodeMapelAktif) || ''} ({siswa.length})
                </div>
                {memuat ? (
                  <div style={{ fontSize: 12, color: '#94a3b8', padding: 12 }}><Loader2 size={14} className="spin" /> Memuat…</div>
                ) : siswa.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: '#64748b', padding: 12, background: '#f8fafc', borderRadius: 8 }}>
                    Tidak ada siswa terdaftar pada mapel ini. Siswa muncul di sini bila admin mendaftarkannya ke mapel Anda (lewat <b>Edit Siswa → Akses Mapel</b>) dan statusnya aktif.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '62vh', overflowY: 'auto' }}>
                    {siswa.map((s) => {
                      const st = statusSiswa(s.id);
                      const meta = STATUS_META[st];
                      const Ikon = meta.ikon;
                      const aktif = terpilih?.id === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => bukaSiswa(s)}
                          style={{
                            textAlign: 'left', padding: '9px 11px', borderRadius: 10, cursor: 'pointer',
                            border: `1px solid ${aktif ? '#6366f1' : '#e2e8f0'}`,
                            background: aktif ? '#eef2ff' : 'white', display: 'flex', alignItems: 'center', gap: 8,
                          }}
                        >
                          <Ikon size={15} color={meta.warna} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nama}</div>
                            <div style={{ fontSize: 10.5, color: '#94a3b8' }}>{s.kelasSekolah || s.kelas || '—'} · {meta.label}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* form capaian */}
              <div style={{ flex: '2 1 420px', minWidth: 320 }}>
                {!terpilih ? (
                  <div style={{ background: 'white', border: '1px dashed #cbd5e1', borderRadius: 12, padding: 28, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    <Sparkles size={22} style={{ marginBottom: 6 }} />
                    Pilih seorang siswa untuk mengisi capaian.
                  </div>
                ) : (
                  <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                    {/* identitas / profil siswa */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid #f1f5f9', marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 99, background: '#eef2ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={20} /></div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{terpilih.nama}</div>
                        <div style={{ fontSize: 11.5, color: '#64748b' }}>
                          {terpilih.kelasSekolah || terpilih.kelas || '—'}{terpilih.jenjang ? ` · ${terpilih.jenjang}` : ''} · {namaMapelGuru(guru, kodeMapelAktif) || kodeMapelAktif}
                        </div>
                      </div>
                    </div>

                    {/* dimensi capaian */}
                    {DIMENSI_LAPORAN.map((dim) => {
                      const Ikon = IKON_DIMENSI[dim.ikon] || Brain;
                      const nilai = form.capaian[dim.key] || { predikat: '', deskriptor: [] };
                      return (
                        <div key={dim.key} style={{ marginBottom: 14, padding: 12, border: '1px solid #eef2f7', borderRadius: 10, background: '#fcfdff' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                            <Ikon size={15} color="#4338ca" />
                            <b style={{ fontSize: 13, color: '#1e293b' }}>{dim.label}</b>
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{dim.pertanyaan}</div>
                          {/* predikat */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                            {PREDIKAT_CAPAIAN.map((p) => {
                              const on = nilai.predikat === p.huruf;
                              return (
                                <button key={p.huruf} type="button" onClick={() => ubahPredikat(dim.key, p.huruf)}
                                  style={{
                                    padding: '5px 11px', borderRadius: 99, cursor: 'pointer', fontSize: 11.5, fontWeight: 700,
                                    border: `1.5px solid ${on ? p.warna : '#e2e8f0'}`, background: on ? p.warna : 'white', color: on ? 'white' : '#64748b',
                                  }}>
                                  {p.huruf} · {p.label}
                                </button>
                              );
                            })}
                          </div>
                          {/* deskriptor */}
                          <div style={{ fontSize: 10.5, color: '#94a3b8', marginBottom: 4 }}>Keterangan (pilih yang sesuai, boleh lebih dari satu):</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {dim.deskriptor.map((d) => {
                              const on = (nilai.deskriptor || []).includes(d.id);
                              return (
                                <button key={d.id} type="button" onClick={() => toggleDeskriptor(dim.key, d.id)}
                                  style={{
                                    padding: '4px 9px', borderRadius: 8, cursor: 'pointer', fontSize: 11,
                                    border: `1px solid ${on ? '#a5b4fc' : '#e2e8f0'}`, background: on ? '#eef2ff' : 'white', color: on ? '#3730a3' : '#64748b',
                                  }}>
                                  {on ? '✓ ' : ''}{d.teks}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* catatan guru */}
                    <label style={{ display: 'block', marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Catatan untuk orang tua (opsional)</div>
                      <textarea value={form.catatanGuru} onChange={(e) => setForm((f) => ({ ...f, catatanGuru: e.target.value }))}
                        rows={2} placeholder="Contoh: Ananda senang membantu teman dan cepat menangkap materi baru."
                        style={{ width: '100%', padding: 9, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12.5, resize: 'vertical', boxSizing: 'border-box' }} />
                    </label>
                    {/* pengayaan */}
                    <label style={{ display: 'block', marginBottom: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>Rencana pengayaan periode depan (opsional)</div>
                      <textarea value={form.pengayaan} onChange={(e) => setForm((f) => ({ ...f, pengayaan: e.target.value }))}
                        rows={2} placeholder="Contoh: lanjut ke soal HOTS dan latihan presentasi."
                        style={{ width: '100%', padding: 9, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12.5, resize: 'vertical', boxSizing: 'border-box' }} />
                    </label>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => simpan(form)} disabled={menyimpan}
                        style={{ padding: '9px 16px', borderRadius: 9, border: 'none', background: '#4338ca', color: 'white', fontWeight: 700, fontSize: 13, cursor: menyimpan ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {menyimpan ? <Loader2 size={15} className="spin" /> : <Save size={15} />} Simpan
                      </button>
                      <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
                        {statusPengisianSiswa({ capaian: form.capaian, catatanGuru: form.catatanGuru, pengayaan: form.pengayaan }) === 'selesai'
                          ? '✅ Semua dimensi terisi — siswa ini dihitung selesai.'
                          : 'Isi predikat keempat dimensi agar siswa dihitung selesai. Draft tersimpan otomatis.'}
                      </span>
                      {pesanSimpan && <span style={{ fontSize: 11, color: '#475569' }}>{pesanSimpan}</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
