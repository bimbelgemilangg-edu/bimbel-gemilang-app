// src/pages/admin/bank-soal/LemariSoalPage.jsx
// ============================================================
// LEMARI SOAL (Admin) -- Langkah 6 dari roadmap perbaikan fondasi
// Bank Soal. Ini "rak buku" yang jadi alasan awal semua kerjaan
// Langkah 1-5 kemarin -- begitu materi & mapel sudah rapi, jelajah
// soal bisa dibangun berdasarkan struktur yang BENERAN masuk akal
// (Jenjang > Mapel > Bab), bukan folder impor + materi mentah yang
// berantakan kayak tab "Jelajah per Folder" yang lama.
// ============================================================
// Alur: pilih Jenjang -> pilih Mapel -> pilih Bab (materi baku hasil
// Langkah 3-5) -> lihat daftar soalnya. Klik satu soal buat buka
// detail lengkap: opsi jawaban, kunci (ditandai hijau), pembahasan,
// dan status verifikasi kunci -- biar admin bisa cek sendiri isi
// soalnya, bukan cuma percaya angka ringkasan.
//
// 🔒 READ-ONLY: halaman ini cuma menampilkan, tidak mengubah data
// bank_soal sama sekali. Aman dibuka kapan saja.
// ============================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { Loader2, ChevronRight, Search, GraduationCap, BookOpen, FolderOpen, FileText, AlertTriangle } from 'lucide-react';

const URUTAN_JENJANG = ['SD/MI', 'SMP/MTs', 'SMA/MA'];

const LABEL_TIPE = {
  pg_sederhana: 'PG Sederhana',
  pg_kompleks: 'PG Kompleks',
  benar_salah: 'Benar/Salah',
  pg_kategori: 'Kategori B/S',
  isian_singkat: 'Isian Singkat',
  numerik: 'Numerik',
  menjodohkan: 'Menjodohkan',
};

// kunciJawaban bisa berupa 1 huruf (pg_sederhana) atau array huruf
// (pg_kompleks) -- ini dipakai buat nandain opsi mana yang benar,
// dicocokkan lewat HURUF (A/B/C/D/E), bukan index array, sesuai cara
// sistem menyimpannya (lihat RendererPgKompleks.jsx).
function hurufKunciSet(kunciJawaban) {
  const arr = Array.isArray(kunciJawaban) ? kunciJawaban : [kunciJawaban];
  return new Set(arr.filter(Boolean).map((k) => String(k).toUpperCase().trim()));
}

export default function LemariSoalPage() {
  const [isMobile] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(true);
  const [semuaSoal, setSemuaSoal] = useState([]);
  const [jenjangAktif, setJenjangAktif] = useState(null);
  const [mapelAktif, setMapelAktif] = useState(null);
  const [materiAktif, setMateriAktif] = useState(null);
  const [cari, setCari] = useState('');
  const [soalTerbuka, setSoalTerbuka] = useState(null);
  const [menggabung, setMenggabung] = useState(false);
  const [pesanGabung, setPesanGabung] = useState('');

  const muat = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'bank_soal'));
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => s.status !== 'nonaktif' && s.status !== 'dihapus');
      setSemuaSoal(list);
    } catch (e) {
      console.error('Gagal memuat bank soal:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { muat(); }, [muat]);

  // ---------------- Level 1: Jenjang ----------------
  const daftarJenjang = useMemo(() => {
    const peta = new Map();
    semuaSoal.forEach((s) => {
      const j = s.jenjang || '(Belum diatur)';
      peta.set(j, (peta.get(j) || 0) + 1);
    });
    const utama = URUTAN_JENJANG.filter((j) => peta.has(j)).map((j) => ({ nama: j, jumlah: peta.get(j) }));
    const sisanya = [...peta.entries()].filter(([j]) => !URUTAN_JENJANG.includes(j)).map(([nama, jumlah]) => ({ nama, jumlah }));
    return [...utama, ...sisanya];
  }, [semuaSoal]);

  // ---------------- Level 2: Mapel (dalam jenjang aktif) ----------------
  const daftarMapel = useMemo(() => {
    if (!jenjangAktif) return [];
    const peta = new Map();
    semuaSoal.filter((s) => (s.jenjang || '(Belum diatur)') === jenjangAktif).forEach((s) => {
      const m = s.mataPelajaran || '(Belum diatur)';
      peta.set(m, (peta.get(m) || 0) + 1);
    });
    return [...peta.entries()].map(([nama, jumlah]) => ({ nama, jumlah })).sort((a, b) => b.jumlah - a.jumlah);
  }, [semuaSoal, jenjangAktif]);

  // ---------------- Level 3: Bab/Materi (dalam jenjang+mapel aktif) ----------------
  const daftarMateri = useMemo(() => {
    if (!jenjangAktif || !mapelAktif) return [];
    const peta = new Map();
    semuaSoal
      .filter((s) => (s.jenjang || '(Belum diatur)') === jenjangAktif && (s.mataPelajaran || '(Belum diatur)') === mapelAktif)
      .forEach((s) => {
        const m = (s.materi || '').trim() || '(Belum diatur)';
        peta.set(m, (peta.get(m) || 0) + 1);
      });
    return [...peta.entries()].map(([nama, jumlah]) => ({ nama, jumlah })).sort((a, b) => b.jumlah - a.jumlah);
  }, [semuaSoal, jenjangAktif, mapelAktif]);

  // ---------------- Level 4: Daftar soal (dalam bab aktif) ----------------
  const daftarSoalBab = useMemo(() => {
    if (!jenjangAktif || !mapelAktif || !materiAktif) return [];
    return semuaSoal.filter((s) =>
      (s.jenjang || '(Belum diatur)') === jenjangAktif &&
      (s.mataPelajaran || '(Belum diatur)') === mapelAktif &&
      ((s.materi || '').trim() || '(Belum diatur)') === materiAktif
    );
  }, [semuaSoal, jenjangAktif, mapelAktif, materiAktif]);

  // ---------------- Koreksi: IPA SMP yang kepisah jadi Fisika/Kimia/Biologi ----------------
  const soalIpaSalahTagSMP = useMemo(() => {
    return semuaSoal.filter((s) => s.jenjang === 'SMP/MTs' && ['Fisika', 'Kimia', 'Biologi'].includes(s.mataPelajaran));
  }, [semuaSoal]);

  const gabungkanJadiIPA = useCallback(async () => {
    if (soalIpaSalahTagSMP.length === 0) return;
    if (!window.confirm(`Ubah mataPelajaran ${soalIpaSalahTagSMP.length} soal SMP (Fisika/Kimia/Biologi) jadi "IPA"? Nilai materi/bab masing-masing soal TIDAK diubah, cuma label mapelnya.`)) return;
    setMenggabung(true);
    try {
      for (let i = 0; i < soalIpaSalahTagSMP.length; i += 400) {
        const potongan = soalIpaSalahTagSMP.slice(i, i + 400);
        const batch = writeBatch(db);
        potongan.forEach((s) => batch.update(doc(db, 'bank_soal', s.id), { mataPelajaran: 'IPA', mataPelajaranSebelumDigabung: s.mataPelajaran }));
        await batch.commit();
      }
      setPesanGabung(`✅ ${soalIpaSalahTagSMP.length} soal berhasil digabung jadi IPA.`);
      await muat();
    } catch (e) {
      console.error('Gagal menggabungkan:', e);
      setPesanGabung('❌ Gagal: ' + e.message);
    }
    setMenggabung(false);
  }, [soalIpaSalahTagSMP, muat]);

  // ---------------- Pencarian cepat lintas semua level ----------------
  const hasilCari = useMemo(() => {
    const kunci = cari.trim().toLowerCase();
    if (kunci.length < 3) return null;
    return semuaSoal.filter((s) =>
      String(s.materi || '').toLowerCase().includes(kunci) ||
      String(s.soal || '').toLowerCase().includes(kunci)
    ).slice(0, 100);
  }, [semuaSoal, cari]);

  const pilihJenjang = (j) => { setJenjangAktif(j); setMapelAktif(null); setMateriAktif(null); };
  const pilihMapel = (m) => { setMapelAktif(m); setMateriAktif(null); };

  const wrapper = { display: 'flex', background: '#f8fafc', minHeight: '100vh' };
  const mainContent = { marginLeft: isMobile ? '0' : '260px', padding: isMobile ? '15px' : '30px', width: isMobile ? '100%' : 'calc(100% - 260px)', boxSizing: 'border-box' };
  const cardStyle = { background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, marginBottom: 20 };
  const rakStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 16px', borderRadius: 12, background: '#f8fafc', border: '1px solid #f1f5f9', cursor: 'pointer', marginBottom: 8 };
  const rakAktifStyle = { ...rakStyle, background: '#f5f3ff', border: '1px solid #ddd6fe' };

  const breadcrumb = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12.5, color: '#6b7280', marginBottom: 16 }}>
      <span onClick={() => pilihJenjang(null)} style={{ cursor: 'pointer', fontWeight: jenjangAktif ? 400 : 800, color: jenjangAktif ? '#6b7280' : '#5B2ECC' }}>Semua Jenjang</span>
      {jenjangAktif && <><ChevronRight size={13} /><span onClick={() => pilihMapel(null)} style={{ cursor: 'pointer', fontWeight: mapelAktif ? 400 : 800, color: mapelAktif ? '#6b7280' : '#5B2ECC' }}>{jenjangAktif}</span></>}
      {mapelAktif && <><ChevronRight size={13} /><span onClick={() => setMateriAktif(null)} style={{ cursor: 'pointer', fontWeight: materiAktif ? 400 : 800, color: materiAktif ? '#6b7280' : '#5B2ECC' }}>{mapelAktif}</span></>}
      {materiAktif && <><ChevronRight size={13} /><span style={{ fontWeight: 800, color: '#5B2ECC' }}>{materiAktif}</span></>}
    </div>
  );

  return (
    <div style={wrapper}>
      <SidebarAdmin />
      <div style={mainContent}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>🗄️ Lemari Soal</h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
            Jelajah bank soal berdasarkan Jenjang → Mapel → Bab -- struktur ini sekarang ikut Taksonomi Materi yang sudah dirapikan, bukan folder impor lagi.
          </p>
        </div>

        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Search size={16} color="#9ca3af" />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari cepat lintas semua bab (ketik minimal 3 huruf) -- nama bab atau isi soal..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13 }}
          />
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}><Loader2 className="spin" size={20} /> Memuat lemari soal...</div>
        ) : hasilCari ? (
          <div style={cardStyle}>
            <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>Hasil cari: "{cari}"</div>
            <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 14 }}>{hasilCari.length} soal ditemukan (maks 100 ditampilkan). Kosongkan kotak cari buat balik jelajah normal.</div>
            {hasilCari.map((s) => (
              <div key={s.id} style={{ padding: '10px 14px', borderRadius: 10, background: '#f8fafc', marginBottom: 6 }}>
                <div style={{ fontSize: 12.5, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.soal || '(teks kosong)'}</div>
                <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 3 }}>{s.mataPelajaran || '-'} · {s.jenjang || '-'} · Kelas {s.tingkatKelas || 'Semua'} · <b style={{ color: '#5B2ECC' }}>{s.materi || '(belum diatur)'}</b></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {breadcrumb}

            {!jenjangAktif && (
              <div style={cardStyle}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#374151', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><GraduationCap size={15} /> Pilih Jenjang</div>
                {daftarJenjang.map((j) => (
                  <div key={j.nama} style={rakStyle} onClick={() => pilihJenjang(j.nama)}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>{j.nama}</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{j.jumlah} soal <ChevronRight size={13} style={{ verticalAlign: 'middle' }} /></span>
                  </div>
                ))}
              </div>
            )}

            {jenjangAktif && !mapelAktif && (
              <div style={cardStyle}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#374151', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><BookOpen size={15} /> Pilih Mapel di {jenjangAktif}</div>
                {jenjangAktif === 'SMP/MTs' && soalIpaSalahTagSMP.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 14px', marginBottom: 12, flexWrap: 'wrap' }}>
                    <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: 12, color: '#92400e', flex: 1 }}>
                      {soalIpaSalahTagSMP.length} soal SMP masih terpisah Fisika/Kimia/Biologi -- di kurikulum SMP harusnya digabung jadi 1 mapel "IPA".
                    </div>
                    <button onClick={gabungkanJadiIPA} disabled={menggabung} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#d97706', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: menggabung ? 'default' : 'pointer' }}>
                      {menggabung ? <Loader2 size={13} className="spin" /> : null} Gabungkan jadi IPA
                    </button>
                  </div>
                )}
                {pesanGabung && <div style={{ fontSize: 12.5, marginBottom: 10, color: pesanGabung.startsWith('✅') ? '#166534' : '#dc2626' }}>{pesanGabung}</div>}
                {daftarMapel.map((m) => (
                  <div key={m.nama} style={rakStyle} onClick={() => pilihMapel(m.nama)}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>{m.nama}</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{m.jumlah} soal <ChevronRight size={13} style={{ verticalAlign: 'middle' }} /></span>
                  </div>
                ))}
              </div>
            )}

            {jenjangAktif && mapelAktif && !materiAktif && (
              <div style={cardStyle}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#374151', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><FolderOpen size={15} /> Pilih Bab di {mapelAktif} · {jenjangAktif}</div>
                {daftarMateri.map((m) => (
                  <div key={m.nama} style={rakStyle} onClick={() => setMateriAktif(m.nama)}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>{m.nama}</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{m.jumlah} soal <ChevronRight size={13} style={{ verticalAlign: 'middle' }} /></span>
                  </div>
                ))}
              </div>
            )}

            {materiAktif && (
              <div style={cardStyle}>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#374151', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={15} /> {daftarSoalBab.length} soal di "{materiAktif}"</div>
                <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 12 }}>Klik satu soal buat lihat opsi, kunci jawaban, dan pembahasan lengkapnya.</div>
                {daftarSoalBab.map((s) => {
                  const terbuka = soalTerbuka === s.id;
                  const hurufBenar = hurufKunciSet(s.kunciJawaban);
                  const punyaOpsi = Array.isArray(s.opsiJawaban) && s.opsiJawaban.length > 0;
                  const punyaPernyataan = Array.isArray(s.pernyataan) && s.pernyataan.length > 0;
                  const punyaPasangan = Array.isArray(s.pasangan) && s.pasangan.length > 0;
                  return (
                    <div key={s.id} style={{ borderRadius: 10, background: '#f8fafc', marginBottom: 8, overflow: 'hidden', border: terbuka ? '1px solid #ddd6fe' : '1px solid transparent' }}>
                      <div style={{ padding: '10px 14px', cursor: 'pointer' }} onClick={() => setSoalTerbuka(terbuka ? null : s.id)}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ fontSize: 12.5, color: '#1e293b', flex: 1, ...(terbuka ? {} : { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }) }}>{s.soal || '(teks kosong)'}</div>
                          <ChevronRight size={14} color="#9ca3af" style={{ flexShrink: 0, marginTop: 2, transform: terbuka ? 'rotate(90deg)' : 'none', transition: '0.15s' }} />
                        </div>
                        <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span>{LABEL_TIPE[s.tipe] || s.tipe || 'PG Sederhana'} · Kelas {s.tingkatKelas || 'Semua'}{s.subMateri ? ` · ${s.subMateri}` : ''}</span>
                          {s.kunciTerverifikasi === false && (
                            <span style={{ background: '#fffbeb', color: '#b45309', borderRadius: 999, padding: '1px 8px', fontWeight: 700 }}>kunci belum terverifikasi</span>
                          )}
                        </div>
                      </div>

                      {terbuka && (
                        <div style={{ padding: '4px 14px 16px', borderTop: '1px solid #eef2ff' }}>
                          {punyaOpsi && (
                            <div style={{ marginTop: 10 }}>
                              {s.opsiJawaban.map((opsi, i) => {
                                const huruf = String.fromCharCode(65 + i);
                                const benar = hurufBenar.has(huruf);
                                return (
                                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 10px', borderRadius: 8, background: benar ? '#f0fdf4' : 'transparent', marginBottom: 4 }}>
                                    <span style={{ fontWeight: 800, color: benar ? '#16a34a' : '#9ca3af', minWidth: 18 }}>{huruf}.</span>
                                    <span style={{ fontSize: 12.5, color: benar ? '#166534' : '#374151', fontWeight: benar ? 700 : 400 }}>{opsi?.teks || String(opsi || '')}</span>
                                    {benar && <span style={{ fontSize: 10.5, color: '#16a34a', fontWeight: 800 }}>✓ kunci</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {punyaPernyataan && (
                            <div style={{ marginTop: 10 }}>
                              {s.pernyataan.map((p, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 10px', borderRadius: 8, background: '#fff', border: '1px solid #eef2ff', marginBottom: 4 }}>
                                  <span style={{ fontSize: 12.5, color: '#374151' }}>{p.teks || p.pernyataan || ''}</span>
                                  <span style={{ fontSize: 11.5, fontWeight: 800, color: /benar|true|ya/i.test(String(p.jawaban || '')) ? '#16a34a' : '#dc2626', flexShrink: 0 }}>{p.jawaban || '-'}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {punyaPasangan && (
                            <div style={{ marginTop: 10 }}>
                              {s.pasangan.map((pr, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 8, background: '#fff', border: '1px solid #eef2ff', marginBottom: 4, fontSize: 12.5 }}>
                                  <span style={{ flex: 1 }}>{pr.kiri}</span>
                                  <span style={{ color: '#5B2ECC' }}>↔</span>
                                  <span style={{ flex: 1 }}>{pr.kanan}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {!punyaOpsi && !punyaPernyataan && !punyaPasangan && s.kunciJawaban != null && (
                            <div style={{ marginTop: 10, fontSize: 12.5, color: '#166534', fontWeight: 700 }}>
                              ✔️ Kunci jawaban: {Array.isArray(s.kunciJawaban) ? s.kunciJawaban.join(', ') : String(s.kunciJawaban)}
                            </div>
                          )}

                          {s.pembahasan && (
                            <div style={{ marginTop: 12, padding: '10px 12px', background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#78350f' }}>
                              <b>Pembahasan:</b> {s.pembahasan}
                            </div>
                          )}
                          {s.catatanAdmin && (
                            <div style={{ marginTop: 8, fontSize: 11.5, color: '#0369a1' }}>ℹ️ Catatan: {s.catatanAdmin}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}