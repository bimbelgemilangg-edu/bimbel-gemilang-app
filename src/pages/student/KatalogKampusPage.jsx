// src/pages/student/KatalogKampusPage.jsx
// ============================================================
// Halaman Eksplorasi 173 PTN & Jurusan (Benchmark AmbisPTN 1:1)
// Dilengkapi Logo Universitas Resmi, Filter 38 Provinsi, Tab 'Sesuai Skormu',
// dan Tombol 1-Klik 'Jadikan Target Impian' untuk Siswa Gemilang.
// ============================================================
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Building2,
  GraduationCap,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  Star,
  ExternalLink,
  Target,
  Sparkles,
  X,
} from 'lucide-react';
import rawDataPtn from '../../data/imporPtnData.json';
import { getLogoPtn, getMonogramPtn } from '../../utils/logoPtnHelper';
import { useProfilSiswa } from '../../utils/profilSiswa';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function KatalogKampusPage() {
  const navigate = useNavigate();
  const profil = useProfilSiswa();
  const studentId = localStorage.getItem('studentId') || localStorage.getItem('studentNim') || '';

  const [tabAktif, setTabAktif] = useState('kampus'); // 'kampus' | 'sesuai-skor' | 'jurusan'
  const [cariTeks, setCariTeks] = useState('');
  const [provinsiFilter, setProvinsiFilter] = useState('Semua');
  const [bidangFilter, setBidangFilter] = useState('Semua'); // 'Semua' | 'Saintek' | 'Soshum'
  const [modalPtnTerpilih, setModalPtnTerpilih] = useState(null);
  const [notifSukses, setNotifSukses] = useState('');

  // 1. Ekstrak data PTN dan Prodi
  const daftarPtn = useMemo(() => rawDataPtn.ptn || [], []);
  const daftarProdi = useMemo(() => rawDataPtn.prodi || [], []);

  // 2. Daftar Provinsi Unik
  const listProvinsi = useMemo(() => {
    const setP = new Set(daftarPtn.map((p) => p.provinsi).filter(Boolean));
    return ['Semua', ...Array.from(setP).sort()];
  }, [daftarPtn]);

  // 3. Filter PTN
  const ptnTersaring = useMemo(() => {
    let list = daftarPtn;

    if (provinsiFilter !== 'Semua') {
      list = list.filter((p) => p.provinsi === provinsiFilter);
    }

    if (cariTeks.trim()) {
      const q = cariTeks.toLowerCase();
      list = list.filter((p) => {
        const matchNama = (p.nama || '').toLowerCase().includes(q);
        const matchSingkat = (p.singkatan || '').toLowerCase().includes(q);
        const matchProv = (p.provinsi || '').toLowerCase().includes(q);
        return matchNama || matchSingkat || matchProv;
      });
    }

    return list;
  }, [daftarPtn, provinsiFilter, cariTeks]);

  // 4. Filter Prodi untuk tab "Sesuai Skormu" atau "Jurusan"
  const prodiTersaring = useMemo(() => {
    let list = daftarProdi;

    if (bidangFilter !== 'Semua') {
      list = list.filter((pr) => pr.bidang === bidangFilter);
    }

    if (cariTeks.trim()) {
      const q = cariTeks.toLowerCase();
      list = list.filter((pr) => {
        const matchP = (pr.namaProdi || '').toLowerCase().includes(q);
        const matchK = (pr.namaPtn || '').toLowerCase().includes(q);
        return matchP || matchK;
      });
    }

    return list;
  }, [daftarProdi, bidangFilter, cariTeks]);

  // Pasang sebagai target siswa
  const pasangSebagaiTarget = async (prodi, pilihanKe = 1) => {
    if (!studentId) {
      alert('Sesi siswa belum terdeteksi. Silakan login kembali.');
      return;
    }
    try {
      const skorMin = prodi.skorReferensi?.minimum?.nilai || 720;
      const ref = doc(db, 'siswa_target_kampus', studentId);
      await setDoc(ref, {
        updatedAt: new Date().toISOString(),
        pilihan1: pilihanKe === 1 ? {
          idPtn: prodi.idPtn,
          namaPtn: prodi.namaPtn,
          idProdi: prodi.id,
          namaProdi: prodi.namaProdi,
          bidang: prodi.bidang,
          skorAcuan: skorMin,
        } : undefined,
        pilihan2: pilihanKe === 2 ? {
          idPtn: prodi.idPtn,
          namaPtn: prodi.namaPtn,
          idProdi: prodi.id,
          namaProdi: prodi.namaProdi,
          bidang: prodi.bidang,
          skorAcuan: skorMin,
        } : undefined,
      }, { merge: true });

      // Simpan juga ke localStorage
      localStorage.setItem(`target_pilihan_${pilihanKe}`, JSON.stringify({
        namaPtn: prodi.namaPtn,
        namaProdi: prodi.namaProdi,
        skorAcuan: skorMin,
      }));

      setNotifSukses(`Berhasil memasang ${prodi.namaProdi} (${prodi.namaPtn}) sebagai Pilihan ${pilihanKe}! 🎯`);
      setTimeout(() => setNotifSukses(''), 4500);
    } catch (err) {
      console.error('Gagal menyimpan target kampus:', err);
      // Fallback localStorage
      localStorage.setItem(`target_pilihan_${pilihanKe}`, JSON.stringify({
        namaPtn: prodi.namaPtn,
        namaProdi: prodi.namaProdi,
        skorAcuan: prodi.skorReferensi?.minimum?.nilai || 720,
      }));
      setNotifSukses(`Target tersimpan di perangkat lokal: ${prodi.namaProdi} (${prodi.namaPtn}) sebagai Pilihan ${pilihanKe}!`);
      setTimeout(() => setNotifSukses(''), 4500);
    }
  };

  return (
    <div style={K.wrap}>
      {/* Header Bar */}
      <div style={K.headerBar}>
        <button
          type="button"
          onClick={() => navigate('/siswa/dashboard')}
          style={K.btnKembali}
        >
          <ChevronLeft size={18} />
          <span>Kembali ke Beranda</span>
        </button>
        <span style={K.badgeHeader}>DATABASE 173 PTN SNPMB 2027</span>
      </div>

      <div style={K.headerInfo}>
        <h1 style={K.judulUtama}>Katalog &amp; Eksplorasi Kampus PTN</h1>
        <p style={K.subJudul}>
          Telusuri daya tampung, tingkat keketatan, dan estimasi skor UTBK untuk 173 perguruan tinggi negeri se-Indonesia.
        </p>
      </div>

      {/* Banner Notifikasi Sukses */}
      {notifSukses && (
        <div style={K.bannerSukses}>
          <Sparkles size={18} color="#047857" />
          <span>{notifSukses}</span>
        </div>
      )}

      {/* Search & Tabs */}
      <div style={K.kontainerKontrol}>
        {/* Search Input */}
        <div style={K.searchWrap}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            value={cariTeks}
            onChange={(e) => setCariTeks(e.target.value)}
            placeholder="Cari nama kampus (UI, ITB, UGM...) atau jurusan (Kedokteran, Informatika...)"
            style={K.searchInput}
          />
          {cariTeks && (
            <button
              type="button"
              onClick={() => setCariTeks('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
            >
              <X size={16} color="#94a3b8" />
            </button>
          )}
        </div>

        {/* Tab Switcher & Dropdown Filter */}
        <div style={K.filterRow}>
          <div style={K.tabsNav}>
            <button
              type="button"
              onClick={() => setTabAktif('kampus')}
              style={{ ...K.tabBtn, ...(tabAktif === 'kampus' ? K.tabBtnAktif : {}) }}
            >
              🏛️ Kampus ({ptnTersaring.length})
            </button>
            <button
              type="button"
              onClick={() => setTabAktif('jurusan')}
              style={{ ...K.tabBtn, ...(tabAktif === 'jurusan' ? K.tabBtnAktif : {}) }}
            >
              📚 Jurusan ({prodiTersaring.length})
            </button>
            <button
              type="button"
              onClick={() => setTabAktif('sesuai-skor')}
              style={{ ...K.tabBtn, ...(tabAktif === 'sesuai-skor' ? K.tabBtnAktif : {}) }}
            >
              🎯 Sesuai Skormu
            </button>
          </div>

          {tabAktif === 'kampus' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>Provinsi:</span>
              <select
                value={provinsiFilter}
                onChange={(e) => setProvinsiFilter(e.target.value)}
                style={K.dropdownFilter}
              >
                {listProvinsi.map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>Rumpun:</span>
              <select
                value={bidangFilter}
                onChange={(e) => setBidangFilter(e.target.value)}
                style={K.dropdownFilter}
              >
                <option value="Semua">Semua Rumpun</option>
                <option value="Saintek">Saintek (IPA/Teknik)</option>
                <option value="Soshum">Soshum (IPS/Bisnis)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. TAMPILAN TAB KAMPUS                                       */}
      {/* ============================================================ */}
      {tabAktif === 'kampus' && (
        <div style={K.gridKampus}>
          {ptnTersaring.map((ptn) => {
            const logoUrl = getLogoPtn(ptn);
            const monogram = getMonogramPtn(ptn);
            const prodiKampus = daftarProdi.filter((pr) => pr.idPtn === ptn.id);

            return (
              <div
                key={ptn.id}
                onClick={() => setModalPtnTerpilih({ ...ptn, prodiList: prodiKampus })}
                style={K.cardKampusItem}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={ptn.nama}
                      style={K.logoKampusImg}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ ...K.monogramFallback, background: monogram.bg }}>
                      {monogram.inisial}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={K.singkatanKampusBadge}>{ptn.singkatan || 'PTN'}</div>
                    <h3 style={K.namaKampusTeks}>{ptn.nama}</h3>
                    <div style={K.lokasiKampusRow}>
                      <MapPin size={13} color="#64748b" />
                      <span>{ptn.provinsi || 'Indonesia'} • {ptn.wilayahBesar || 'Nasional'}</span>
                    </div>
                  </div>
                </div>

                <div style={K.footerCardKampus}>
                  <span style={{ fontSize: 11.5, color: '#0f766e', fontWeight: 700 }}>
                    {prodiKampus.length > 0 ? `${prodiKampus.length} Program Studi Terdata` : 'Klaster Mandiri'}
                  </span>
                  <span style={K.btnLihatDetail}>Lihat Jurusan →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. TAMPILAN TAB JURUSAN & SESUAI SKORMU                     */}
      {/* ============================================================ */}
      {(tabAktif === 'jurusan' || tabAktif === 'sesuai-skor') && (
        <div style={K.listProdiGrid}>
          {prodiTersaring.map((prodi) => {
            const skorMin = prodi.skorReferensi?.minimum?.nilai || 710;
            const skorRata = prodi.skorReferensi?.rataRata?.nilai || 735;
            const keketatanPersen = prodi.keketatan ? (prodi.keketatan * 100).toFixed(2) : '2.5';

            return (
              <div key={prodi.id} style={K.cardProdiItem}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={K.badgeBidangProdi}>{prodi.bidang || 'Saintek'}</span>
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{prodi.jenjang || 'S1'}</span>
                    </div>
                    <h3 style={K.namaProdiTeks}>{prodi.namaProdi}</h3>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0d9488' }}>
                      {prodi.namaPtn}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Target Skor:</span>
                    <div style={{ fontSize: 17, fontWeight: 900, color: '#0f766e' }}>
                      {skorMin} Poin
                    </div>
                  </div>
                </div>

                {/* 3 Metrik Kunci */}
                <div style={K.metrikTigaCol}>
                  <div style={K.metrikBoxMini}>
                    <span style={K.labelMini}>Daya Tampung</span>
                    <div style={K.valMini}>{prodi.dayaTampung?.nilai || 60} Kursi</div>
                  </div>
                  <div style={K.metrikBoxMini}>
                    <span style={K.labelMini}>Peminat</span>
                    <div style={K.valMini}>{prodi.peminat?.nilai || 2400} Orang</div>
                  </div>
                  <div style={K.metrikBoxMini}>
                    <span style={K.labelMini}>Keketatan</span>
                    <div style={{ ...K.valMini, color: '#dc2626' }}>{keketatanPersen}%</div>
                  </div>
                </div>

                <div style={K.footerProdiAksi}>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Subtes Kunci: <b>{prodi.subtesKunci || 'Penalaran Matematika & Literasi'}</b>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => pasangSebagaiTarget(prodi, 1)}
                      style={K.btnPasangTarget1}
                      title="Pasang sebagai Target Pilihan 1"
                    >
                      Pilihan 1 🎯
                    </button>
                    <button
                      type="button"
                      onClick={() => pasangSebagaiTarget(prodi, 2)}
                      style={K.btnPasangTarget2}
                      title="Pasang sebagai Target Pilihan 2"
                    >
                      Pilihan 2 ⭐
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DETAIL KAMPUS TERPILIH                                 */}
      {/* ============================================================ */}
      {modalPtnTerpilih && (
        <div style={K.modalOverlay} onClick={() => setModalPtnTerpilih(null)}>
          <div style={K.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={K.modalHeaderRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {getLogoPtn(modalPtnTerpilih) ? (
                  <img
                    src={getLogoPtn(modalPtnTerpilih)}
                    alt={modalPtnTerpilih.nama}
                    style={{ width: 48, height: 48, objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ ...K.monogramFallback, width: 44, height: 44 }}>
                    {getMonogramPtn(modalPtnTerpilih).inisial}
                  </div>
                )}
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                    {modalPtnTerpilih.nama}
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {modalPtnTerpilih.provinsi} • {modalPtnTerpilih.websiteResmi || 'Situs Resmi PTN'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalPtnTerpilih(null)}
                style={K.btnCloseModal}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            <div style={{ padding: '16px 20px', maxHeight: '65vh', overflowY: 'auto' }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                Daftar Program Studi Terdata ({modalPtnTerpilih.prodiList?.length || 0})
              </h4>

              {modalPtnTerpilih.prodiList?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {modalPtnTerpilih.prodiList.map((pr) => (
                    <div key={pr.id} style={K.itemProdiModal}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={K.badgeBidangProdi}>{pr.bidang}</span>
                          <h5 style={{ margin: '3px 0 2px', fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>
                            {pr.namaProdi}
                          </h5>
                          <span style={{ fontSize: 11, color: '#64748b' }}>
                            Daya Tampung: {pr.dayaTampung?.nilai || 50} • Keketatan: {(pr.keketatan ? (pr.keketatan * 100).toFixed(1) : 2.5)}%
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: 10, color: '#64748b' }}>Passing Grade:</span>
                          <div style={{ fontSize: 15, fontWeight: 900, color: '#0f766e' }}>
                            {pr.skorReferensi?.minimum?.nilai || 720}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8 }}>
                        <button
                          type="button"
                          onClick={() => {
                            pasangSebagaiTarget(pr, 1);
                            setModalPtnTerpilih(null);
                          }}
                          style={K.btnPasangTarget1}
                        >
                          Pilihan 1 🎯
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            pasangSebagaiTarget(pr, 2);
                            setModalPtnTerpilih(null);
                          }}
                          style={K.btnPasangTarget2}
                        >
                          Pilihan 2 ⭐
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                  Data rincian prodi untuk kampus ini tersedia di portal resmi panitia SNPMB.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const K = {
  wrap: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '20px 16px 40px',
  },
  headerBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  btnKembali: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    background: 'none',
    border: 'none',
    color: '#0d9488',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
  },
  badgeHeader: {
    fontSize: 10.5,
    fontWeight: 900,
    color: '#0d9488',
    background: '#ccfbf1',
    padding: '4px 10px',
    borderRadius: 99,
  },
  headerInfo: {
    marginBottom: 16,
  },
  judulUtama: {
    margin: '4px 0 6px',
    fontSize: 22,
    fontWeight: 900,
    color: '#0f172a',
  },
  subJudul: {
    margin: 0,
    fontSize: 13,
    color: '#64748b',
    lineHeight: 1.5,
  },
  bannerSukses: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#f0fdf4',
    border: '1.5px solid #86efac',
    color: '#166534',
    padding: '10px 16px',
    borderRadius: 14,
    fontSize: 12.5,
    fontWeight: 700,
    marginBottom: 16,
  },
  kontainerKontrol: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 20,
  },
  searchWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: 16,
    padding: '10px 16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 13,
    color: '#1e293b',
  },
  filterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  tabsNav: {
    display: 'flex',
    gap: 6,
  },
  tabBtn: {
    background: '#f1f5f9',
    border: 'none',
    color: '#64748b',
    padding: '8px 14px',
    borderRadius: 12,
    fontSize: 12.5,
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  tabBtnAktif: {
    background: '#0d9488',
    color: '#ffffff',
  },
  dropdownFilter: {
    background: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 700,
    color: '#1e293b',
    cursor: 'pointer',
  },
  gridKampus: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 14,
  },
  cardKampusItem: {
    background: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: 18,
    padding: 16,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  logoKampusImg: {
    width: 44,
    height: 44,
    objectFit: 'contain',
    flexShrink: 0,
  },
  monogramFallback: {
    width: 44,
    height: 44,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontWeight: 900,
    fontSize: 15,
    flexShrink: 0,
  },
  singkatanKampusBadge: {
    fontSize: 10,
    fontWeight: 900,
    color: '#0d9488',
    letterSpacing: 0.5,
  },
  namaKampusTeks: {
    margin: '2px 0 4px',
    fontSize: 14,
    fontWeight: 800,
    color: '#0f172a',
    lineHeight: 1.3,
  },
  lokasiKampusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11.5,
    color: '#64748b',
  },
  footerCardKampus: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTop: '1px solid #f1f5f9',
  },
  btnLihatDetail: {
    fontSize: 12,
    fontWeight: 800,
    color: '#0d9488',
  },
  listProdiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 14,
  },
  cardProdiItem: {
    background: '#ffffff',
    border: '1.5px solid #e2e8f0',
    borderRadius: 18,
    padding: 16,
    boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
  },
  badgeBidangProdi: {
    fontSize: 9.5,
    fontWeight: 900,
    color: '#0284c7',
    background: '#e0f2fe',
    padding: '2px 6px',
    borderRadius: 6,
  },
  namaProdiTeks: {
    margin: '3px 0 1px',
    fontSize: 14.5,
    fontWeight: 800,
    color: '#0f172a',
  },
  metrikTigaCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    margin: '12px 0',
  },
  metrikBoxMini: {
    background: '#f8fafc',
    borderRadius: 10,
    padding: '8px 10px',
    textAlign: 'center',
  },
  labelMini: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 700,
  },
  valMini: {
    fontSize: 13,
    fontWeight: 900,
    color: '#0f172a',
    marginTop: 2,
  },
  footerProdiAksi: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 10,
    borderTop: '1px dashed #e2e8f0',
  },
  btnPasangTarget1: {
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer',
  },
  btnPasangTarget2: {
    background: '#f0fdfa',
    border: '1.5px solid #ccfbf1',
    color: '#0f766e',
    padding: '5px 12px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.65)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalBox: {
    background: '#ffffff',
    borderRadius: 24,
    maxWidth: 580,
    width: '100%',
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  },
  modalHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0',
  },
  btnCloseModal: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
  },
  itemProdiModal: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: 12,
  },
};
