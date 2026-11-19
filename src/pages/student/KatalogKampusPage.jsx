// src/pages/student/KatalogKampusPage.jsx
// ============================================================
// Halaman Eksplorasi 173 PTN & 4.594 Jurusan (Benchmark AmbisPTN 1:1)
// Dilengkapi Logo Universitas Resmi, Filter 36 Provinsi, Tab Sesuai Skormu,
// dan Tombol 1-Klik 'Jadikan Pilihan 1 & 2' untuk Siswa Gemilang.
// ============================================================
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Building2,
  GraduationCap,
  MapPin,
  ChevronRight,
  Filter,
  Check,
  Star,
  ExternalLink,
  Target,
  Sparkles,
  X,
  Compass,
} from 'lucide-react';
import {
  useTargetKampusSiswa,
  simpanPilihanTarget,
} from '../../services/targetKampusService';
import {
  getDaftarPtnAmbis,
  getDaftarProdiAmbis,
} from '../../utils/ambisPtnDataHelper';
import LogoKampus from '../../components/LogoKampus';
import { useProfilSiswa } from '../../utils/profilSiswa';
import { deteksiTingkatSiswa } from '../../utils/tingkatSiswa';

export default function KatalogKampusPage() {
  const navigate = useNavigate();
  const profil = useProfilSiswa();
  const studentId = localStorage.getItem('studentId') || localStorage.getItem('studentNim') || '';

  const kelasCek = profil.kelas || profil.kelasSekolah || (typeof localStorage !== 'undefined' ? localStorage.getItem('studentGrade') || localStorage.getItem('studentKelas') : '');
  const jenjangCek = profil.jenjang || (typeof localStorage !== 'undefined' ? localStorage.getItem('studentGrade') : '');
  const infoTingkat = useMemo(() => {
    return deteksiTingkatSiswa({ ...profil, kelas: kelasCek, kelasSekolah: kelasCek, jenjang: jenjangCek });
  }, [profil, kelasCek, jenjangCek]);

  const { target: targetSiswa } = useTargetKampusSiswa(studentId);

  const [tabAktif, setTabAktif] = useState('kampus'); // 'kampus' | 'sesuai-skor' | 'jurusan'
  const [cariTeks, setCariTeks] = useState('');
  const [provinsiFilter, setProvinsiFilter] = useState('Semua');
  const [rumpunFilter, setRumpunFilter] = useState('Semua'); // 'Semua' | 'saintek' | 'soshum'
  const [modalPtnTerpilih, setModalPtnTerpilih] = useState(null);
  const [cariDiModal, setCariDiModal] = useState('');
  const [rumpunModalFilter, setRumpunModalFilter] = useState('Semua');
  const [notifSukses, setNotifSukses] = useState('');

  // 1. Ambil 173 PTN dan 4.594 Prodi
  const daftarPtn = useMemo(() => getDaftarPtnAmbis(), []);
  const daftarProdi = useMemo(() => getDaftarProdiAmbis(), []);

  // 2. Daftar Provinsi Unik
  const listProvinsi = useMemo(() => {
    const setP = new Set(daftarPtn.map((p) => p.province).filter(Boolean));
    return ['Semua', ...Array.from(setP).sort()];
  }, [daftarPtn]);

  // 3. Filter PTN
  const ptnTersaring = useMemo(() => {
    let list = daftarPtn;

    if (provinsiFilter !== 'Semua') {
      list = list.filter((p) => p.province === provinsiFilter);
    }

    if (cariTeks.trim()) {
      const q = cariTeks.toLowerCase();
      list = list.filter((p) => {
        const matchNama = (p.name || '').toLowerCase().includes(q);
        const matchSingkat = (p.short_name || '').toLowerCase().includes(q);
        const matchKota = (p.city || '').toLowerCase().includes(q);
        const matchProv = (p.province || '').toLowerCase().includes(q);
        return matchNama || matchSingkat || matchKota || matchProv;
      });
    }

    return list;
  }, [daftarPtn, provinsiFilter, cariTeks]);

  // 4. Filter Prodi untuk tab "Sesuai Skormu" atau "Jurusan"
  const prodiTersaring = useMemo(() => {
    let list = daftarProdi;

    if (rumpunFilter !== 'Semua') {
      list = list.filter((pr) => pr.rumpun === rumpunFilter);
    }

    if (provinsiFilter !== 'Semua') {
      const ptnDiProvinsi = new Set(daftarPtn.filter((p) => p.province === provinsiFilter).map((p) => p.slug));
      list = list.filter((pr) => ptnDiProvinsi.has(pr.uni_slug));
    }

    if (cariTeks.trim()) {
      const q = cariTeks.toLowerCase();
      list = list.filter((pr) => {
        const matchProdi = (pr.name || '').toLowerCase().includes(q);
        const matchUni = (pr.uni_name || '').toLowerCase().includes(q);
        const matchShort = (pr.uni_short || '').toLowerCase().includes(q);
        return matchProdi || matchUni || matchShort;
      });
    }

    return list;
  }, [daftarProdi, daftarPtn, rumpunFilter, provinsiFilter, cariTeks]);

  // Simpan Target
  const handleSimpanPilihan = async (pilihanKe, majorData) => {
    await simpanPilihanTarget(studentId, pilihanKe, majorData);
    setNotifSukses(`🎉 ${majorData.name} (${majorData.uni_short || majorData.uni_name}) berhasil disimpan sebagai Target Pilihan ${pilihanKe}!`);
    setTimeout(() => setNotifSukses(''), 3500);
  };

  const p1 = targetSiswa?.pilihan1;
  const p2 = targetSiswa?.pilihan2;

  if (!infoTingkat.bisaAksesTargetKampus) {
    return (
      <div style={{ maxWidth: 640, margin: '60px auto', padding: '24px 20px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Building2 size={30} color="#0d9488" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>
          Fitur Katalog PTN Khusus Jenjang SMA
        </h2>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>
          Katalog 173 Perguruan Tinggi Negeri dan 4.594 Program Studi Nasional diperuntukkan bagi jenjang SMA (Kelas 10, 11, dan 12) dalam persiapan seleksi perguruan tinggi negeri. Untuk jenjang kamu, silakan fokus pada pembelajaran dan latihan di Dashboard.
        </p>
        <button
          type="button"
          onClick={() => navigate('/siswa/dashboard')}
          style={{
            background: '#0d9488', color: '#fff', border: 'none', borderRadius: 10,
            padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={st.wrap}>
      {/* Toast Notification */}
      {notifSukses && (
        <div style={st.toastNotif}>
          <Sparkles size={18} color="#0d9488" />
          <span>{notifSukses}</span>
        </div>
      )}

      {/* Header */}
      <div style={st.headerWrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 24 }}>🏛️</span>
              <h1 style={st.judul}>Eksplorasi Kampus &amp; Jurusan UTBK 2027</h1>
            </div>
            <p style={st.subJudul}>
              Katalog resmi <b>173 PTN</b> &amp; <b>4.594 Program Studi</b> Nasional. Dapatkan data daya tampung SNBT, keketatan, dan estimasi skor UTBK akurat.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/siswa/target-kampus')}
            style={st.btnLihatTargetKu}
          >
            <Target size={16} /> Lihat Target Kampusku
          </button>
        </div>

        {/* Tab Navigasi 1:1 AmbisPTN */}
        <div style={st.tabBar}>
          <button
            type="button"
            onClick={() => setTabAktif('kampus')}
            style={tabAktif === 'kampus' ? st.tabAktif : st.tabBiasa}
          >
            🏛️ Kampus ({daftarPtn.length})
          </button>
          <button
            type="button"
            onClick={() => setTabAktif('jurusan')}
            style={tabAktif === 'jurusan' ? st.tabAktif : st.tabBiasa}
          >
            📚 Jurusan ({daftarProdi.length.toLocaleString('id-ID')})
          </button>
          <button
            type="button"
            onClick={() => setTabAktif('sesuai-skor')}
            style={tabAktif === 'sesuai-skor' ? st.tabAktif : st.tabBiasa}
          >
            🎯 Sesuai Skormu
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={st.filterBar}>
        <div style={st.searchBarWrap}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            value={cariTeks}
            onChange={(e) => setCariTeks(e.target.value)}
            placeholder="Cari kampus (UI, ITB, UGM...), kota, atau jurusan impian..."
            style={st.searchInput}
          />
          {cariTeks && (
            <button type="button" onClick={() => setCariTeks('')} style={st.btnClearSearch}>
              <X size={15} color="#94a3b8" />
            </button>
          )}
        </div>

        <div style={st.filterDropdowns}>
          <div style={st.selectWrap}>
            <MapPin size={15} color="#0d9488" />
            <select
              value={provinsiFilter}
              onChange={(e) => setProvinsiFilter(e.target.value)}
              style={st.selectProvinsi}
            >
              {listProvinsi.map((prov) => (
                <option key={prov} value={prov}>
                  {prov === 'Semua' ? '🗺️ Semua Provinsi (36)' : prov}
                </option>
              ))}
            </select>
          </div>

          {tabAktif !== 'kampus' && (
            <div style={st.btnGroupRumpun}>
              <button
                type="button"
                onClick={() => setRumpunFilter('Semua')}
                style={rumpunFilter === 'Semua' ? st.btnRumpunAktif : st.btnRumpunBiasa}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setRumpunFilter('saintek')}
                style={rumpunFilter === 'saintek' ? st.btnRumpunAktif : st.btnRumpunBiasa}
              >
                Saintek
              </button>
              <button
                type="button"
                onClick={() => setRumpunFilter('soshum')}
                style={rumpunFilter === 'soshum' ? st.btnRumpunAktif : st.btnRumpunBiasa}
              >
                Soshum
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: KAMPUS (173 PTN)                                      */}
      {/* ============================================================ */}
      {tabAktif === 'kampus' && (
        <div style={st.ptnGrid}>
          {ptnTersaring.map((ptn) => {
            return (
              <div
                key={ptn.id || ptn.slug}
                onClick={() => {
                  setModalPtnTerpilih(ptn);
                  setCariDiModal('');
                  setRumpunModalFilter('Semua');
                }}
                style={st.ptnCard}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <LogoKampus ptn={ptn} size={46} radius={10} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={st.ptnShortText}>{ptn.short_name || ptn.name}</div>
                    <div style={st.ptnFullNameText} title={ptn.name}>
                      {ptn.name}
                    </div>
                    <div style={st.ptnLocationText}>
                      <MapPin size={12} color="#94a3b8" />
                      <span>{ptn.city || ''}{ptn.province ? `, ${ptn.province}` : ''}</span>
                    </div>
                  </div>
                </div>

                <div style={st.ptnCardFooter}>
                  <span style={st.badgeAkreditasi}>{ptn.accreditation || 'Unggul'}</span>
                  <span style={st.badgeProdiCount}>
                    {ptn.major_count || ptn.majors?.length || 0} Jurusan
                  </span>
                  <button type="button" style={st.btnLihatJurusan}>
                    Lihat Jurusan <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: JURUSAN (4.594 PRODI NASIONAL)                        */}
      {/* ============================================================ */}
      {tabAktif === 'jurusan' && (
        <div style={st.prodiList}>
          {prodiTersaring.slice(0, 50).map((pr) => {
            const isPilihan1 = p1?.majorSlug === pr.slug || p1?.majorId === pr.id;
            const isPilihan2 = p2?.majorSlug === pr.slug || p2?.majorId === pr.id;

            return (
              <div key={pr.id || pr.slug} style={st.prodiRowCard}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: '1 1 320px' }}>
                  <LogoKampus
                    ptn={{ uni_logo: pr.uni_logo, slug: pr.uni_slug, singkatan: pr.uni_short, name: pr.uni_name }}
                    size={40}
                    radius={8}
                  />
                  <div>
                    <div style={st.prodiMajorTitle}>{pr.name}</div>
                    <div style={st.prodiUniSubtitle}>
                      {pr.uni_name} {pr.uni_short ? `(${pr.uni_short})` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <span style={st.chipDegree}>{pr.degree_type || 'Sarjana'}</span>
                      <span style={pr.rumpun === 'soshum' ? st.chipSoshum : st.chipSaintek}>
                        {pr.rumpun_label || 'Saintek'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={st.prodiStatsCol}>
                  <div style={st.statItemRow}>
                    <span style={st.statItemLabel}>Passing Score:</span>
                    <b style={{ color: '#0d9488', fontSize: 14 }}>{pr.passing_score || 700}</b>
                  </div>
                  <div style={st.statItemRow}>
                    <span style={st.statItemLabel}>Kuota:</span>
                    <b>{pr.capacity || 50}</b>
                  </div>
                  <div style={st.statItemRow}>
                    <span style={st.statItemLabel}>Keketatan:</span>
                    <b>{pr.selectivity ? `${(pr.selectivity * 100).toFixed(1)}%` : '3.0%'}</b>
                  </div>
                </div>

                <div style={st.prodiActionCol}>
                  <button
                    type="button"
                    onClick={() => handleSimpanPilihan(1, pr)}
                    style={isPilihan1 ? st.btnTerpilihP1 : st.btnAksiP1}
                  >
                    {isPilihan1 ? '✓ Pilihan 1' : '⭐ Pilihan 1'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimpanPilihan(2, pr)}
                    style={isPilihan2 ? st.btnTerpilihP2 : st.btnAksiP2}
                  >
                    {isPilihan2 ? '✓ Pilihan 2' : '🎯 Pilihan 2'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: SESUAI SKORMU                                         */}
      {/* ============================================================ */}
      {tabAktif === 'sesuai-skor' && (
        <div style={st.prodiList}>
          {prodiTersaring.slice(0, 40).map((pr) => {
            const isPilihan1 = p1?.majorSlug === pr.slug || p1?.majorId === pr.id;
            const isPilihan2 = p2?.majorSlug === pr.slug || p2?.majorId === pr.id;

            return (
              <div key={pr.id || pr.slug} style={st.prodiRowCard}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: '1 1 320px' }}>
                  <LogoKampus
                    ptn={{ uni_logo: pr.uni_logo, slug: pr.uni_slug, singkatan: pr.uni_short, name: pr.uni_name }}
                    size={40}
                    radius={8}
                  />
                  <div>
                    <div style={st.prodiMajorTitle}>{pr.name}</div>
                    <div style={st.prodiUniSubtitle}>{pr.uni_name}</div>
                  </div>
                </div>

                <div style={st.prodiStatsCol}>
                  <div style={st.statItemRow}>
                    <span style={st.statItemLabel}>Passing Score:</span>
                    <b style={{ color: '#0d9488', fontSize: 14 }}>{pr.passing_score}</b>
                  </div>
                  <div style={st.statItemRow}>
                    <span style={st.statItemLabel}>Kuota:</span>
                    <b>{pr.capacity} Kursi</b>
                  </div>
                </div>

                <div style={st.prodiActionCol}>
                  <button
                    type="button"
                    onClick={() => handleSimpanPilihan(1, pr)}
                    style={isPilihan1 ? st.btnTerpilihP1 : st.btnAksiP1}
                  >
                    {isPilihan1 ? '✓ Pilihan 1' : '⭐ Pilihan 1'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimpanPilihan(2, pr)}
                    style={isPilihan2 ? st.btnTerpilihP2 : st.btnAksiP2}
                  >
                    {isPilihan2 ? '✓ Pilihan 2' : '🎯 Pilihan 2'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detail PTN */}
      {modalPtnTerpilih && (
        <div style={st.modalOverlay} onClick={() => setModalPtnTerpilih(null)}>
          <div style={st.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={st.modalHeader}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <LogoKampus ptn={modalPtnTerpilih} size={50} radius={12} />
                <div>
                  <h3 style={st.modalUniTitle}>{modalPtnTerpilih.name}</h3>
                  <div style={st.modalUniMeta}>
                    <MapPin size={13} color="#0d9488" />
                    <span>{modalPtnTerpilih.city}, {modalPtnTerpilih.province}</span>
                    <span>•</span>
                    <span style={st.badgeAkreditasi}>{modalPtnTerpilih.accreditation || 'Unggul'}</span>
                    {modalPtnTerpilih.website && (
                      <a
                        href={modalPtnTerpilih.website}
                        target="_blank"
                        rel="noreferrer"
                        style={st.linkWebsiteUni}
                      >
                        Situs Resmi <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalPtnTerpilih(null)}
                style={st.btnCloseModal}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            {/* Filter di dalam Modal */}
            <div style={st.modalFilterBar}>
              <div style={st.searchBarWrap}>
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  value={cariDiModal}
                  onChange={(e) => setCariDiModal(e.target.value)}
                  placeholder={`Cari jurusan di ${modalPtnTerpilih.short_name || 'kampus ini'}...`}
                  style={st.searchInput}
                />
              </div>
              <div style={st.btnGroupRumpun}>
                <button
                  type="button"
                  onClick={() => setRumpunModalFilter('Semua')}
                  style={rumpunModalFilter === 'Semua' ? st.btnRumpunAktif : st.btnRumpunBiasa}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setRumpunModalFilter('saintek')}
                  style={rumpunModalFilter === 'saintek' ? st.btnRumpunAktif : st.btnRumpunBiasa}
                >
                  Saintek
                </button>
                <button
                  type="button"
                  onClick={() => setRumpunModalFilter('soshum')}
                  style={rumpunModalFilter === 'soshum' ? st.btnRumpunAktif : st.btnRumpunBiasa}
                >
                  Soshum
                </button>
              </div>
            </div>

            {/* Daftar Jurusan Kampus Ini */}
            <div style={st.modalListMajor}>
              {(modalPtnTerpilih.majors || [])
                .filter((m) => {
                  if (rumpunModalFilter !== 'Semua' && m.rumpun !== rumpunModalFilter) return false;
                  if (cariDiModal.trim()) {
                    return (m.name || '').toLowerCase().includes(cariDiModal.toLowerCase());
                  }
                  return true;
                })
                .map((m) => {
                  const mComplete = {
                    ...m,
                    uni_name: modalPtnTerpilih.name,
                    uni_short: modalPtnTerpilih.short_name,
                    uni_slug: modalPtnTerpilih.slug,
                    uni_logo: modalPtnTerpilih.logo_url,
                  };
                  const isPilihan1 = p1?.majorSlug === m.slug || p1?.majorId === m.id;
                  const isPilihan2 = p2?.majorSlug === m.slug || p2?.majorId === m.id;

                  return (
                    <div key={m.id || m.slug} style={st.modalMajorRow}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={st.modalMajorName}>{m.name}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <span style={st.chipDegree}>{m.degree_type || 'Sarjana'}</span>
                          <span style={m.rumpun === 'soshum' ? st.chipSoshum : st.chipSaintek}>
                            {m.rumpun_label || 'Saintek'}
                          </span>
                          <span style={st.chipAkreditasi}>{m.accreditation || 'Unggul'}</span>
                        </div>
                      </div>

                      <div style={st.modalStatsCol}>
                        <div>
                          <span style={{ fontSize: 11, color: '#64748b' }}>Passing Score: </span>
                          <b style={{ color: '#0d9488', fontSize: 13.5 }}>{m.passing_score || 700}</b>
                        </div>
                        <div>
                          <span style={{ fontSize: 11, color: '#64748b' }}>Kuota SNBT: </span>
                          <b style={{ color: '#1e293b' }}>{m.capacity || 50} Kursi</b>
                        </div>
                        <div>
                          <span style={{ fontSize: 11, color: '#64748b' }}>Keketatan: </span>
                          <b style={{ color: '#64748b' }}>
                            {m.selectivity ? `${(m.selectivity * 100).toFixed(1)}%` : '3.0%'}
                          </b>
                        </div>
                      </div>

                      <div style={st.modalActionCol}>
                        <button
                          type="button"
                          onClick={() => handleSimpanPilihan(1, mComplete)}
                          style={isPilihan1 ? st.btnTerpilihP1 : st.btnAksiP1}
                        >
                          {isPilihan1 ? '✓ Pilihan 1' : '⭐ Pilihan 1'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSimpanPilihan(2, mComplete)}
                          style={isPilihan2 ? st.btnTerpilihP2 : st.btnAksiP2}
                        >
                          {isPilihan2 ? '✓ Pilihan 2' : '🎯 Pilihan 2'}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const st = {
  wrap: { maxWidth: 1180, margin: '0 auto', padding: '20px 16px 80px' },
  headerWrap: { marginBottom: 20 },
  judul: { fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' },
  subJudul: { fontSize: 13, color: '#475569', margin: '4px 0 16px', lineHeight: 1.5 },
  btnLihatTargetKu: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    borderRadius: 10,
    padding: '9px 16px',
    fontSize: 12.5,
    fontWeight: 800,
    cursor: 'pointer',
  },
  tabBar: { display: 'inline-flex', background: '#f1f5f9', borderRadius: 10, padding: 3, gap: 4 },
  tabAktif: { background: '#0d9488', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' },
  tabBiasa: { background: 'none', color: '#475569', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  filterBar: { display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' },
  searchBarWrap: { flex: '1 1 280px', display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: '8px 12px' },
  searchInput: { border: 'none', background: 'none', outline: 'none', fontSize: 13, width: '100%', color: '#1e293b' },
  btnClearSearch: { background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  filterDropdowns: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  selectWrap: { display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, padding: '6px 10px' },
  selectProvinsi: { border: 'none', background: 'none', outline: 'none', fontSize: 12.5, fontWeight: 600, color: '#334155', cursor: 'pointer' },
  btnGroupRumpun: { display: 'inline-flex', background: '#f1f5f9', borderRadius: 8, padding: 2, gap: 2 },
  btnRumpunAktif: { background: '#ffffff', color: '#0d9488', border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' },
  btnRumpunBiasa: { background: 'none', color: '#64748b', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' },
  ptnGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 },
  ptnCard: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' },
  ptnLogoWrap: { width: 44, height: 44, borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, flexShrink: 0 },
  ptnLogoImg: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
  ptnShortText: { fontSize: 13.5, fontWeight: 800, color: '#0f172a' },
  ptnFullNameText: { fontSize: 11.5, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 },
  ptnLocationText: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: '#94a3b8', marginTop: 4 },
  ptnCardFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid #f8fafc' },
  badgeAkreditasi: { fontSize: 10, fontWeight: 800, color: '#0f766e', background: '#ccfbf1', padding: '2px 6px', borderRadius: 6 },
  badgeProdiCount: { fontSize: 10.5, color: '#64748b', fontWeight: 600 },
  btnLihatJurusan: { display: 'flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', color: '#0d9488', fontSize: 11, fontWeight: 800, cursor: 'pointer', padding: 0 },
  prodiList: { display: 'flex', flexDirection: 'column', gap: 10 },
  prodiRowCard: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  prodiUniLogo: { width: 40, height: 40, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0', padding: 3 },
  prodiMajorTitle: { fontSize: 14, fontWeight: 800, color: '#0f172a' },
  prodiUniSubtitle: { fontSize: 12, color: '#64748b' },
  chipDegree: { fontSize: 10.5, fontWeight: 800, background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 6 },
  chipSaintek: { fontSize: 10.5, fontWeight: 800, background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: 6 },
  chipSoshum: { fontSize: 10.5, fontWeight: 800, background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 6 },
  prodiStatsCol: { display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 },
  statItemRow: { display: 'flex', flexDirection: 'column', fontSize: 11 },
  statItemLabel: { color: '#94a3b8', fontSize: 10 },
  prodiActionCol: { display: 'flex', gap: 6, flexShrink: 0 },
  btnAksiP1: { background: '#0d9488', color: '#ffffff', border: 'none', padding: '7px 11px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer' },
  btnTerpilihP1: { background: '#ccfbf1', color: '#0f766e', border: '1px solid #0d9488', padding: '7px 11px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'default' },
  btnAksiP2: { background: '#0f766e', color: '#ffffff', border: 'none', padding: '7px 11px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'pointer' },
  btnTerpilihP2: { background: '#f0fdf4', color: '#166534', border: '1px solid #16a34a', padding: '7px 11px', borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: 'default' },
  toastNotif: { position: 'fixed', bottom: 24, right: 24, background: '#0f172a', color: '#ffffff', padding: '12px 18px', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, zIndex: 9999 },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 },
  modalContent: { background: '#ffffff', borderRadius: 20, maxWidth: 720, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' },
  modalUniLogo: { width: 50, height: 50, objectFit: 'contain', borderRadius: 10, border: '1px solid #e2e8f0', padding: 4, flexShrink: 0 },
  modalUniTitle: { fontSize: 17, fontWeight: 900, color: '#0f172a', margin: 0 },
  modalUniMeta: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b', marginTop: 4, flexWrap: 'wrap' },
  linkWebsiteUni: { display: 'inline-flex', alignItems: 'center', gap: 3, color: '#0d9488', textDecoration: 'none', fontWeight: 700 },
  btnCloseModal: { background: 'none', border: 'none', cursor: 'pointer', padding: 4 },
  modalFilterBar: { display: 'flex', gap: 10, padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', alignItems: 'center', flexWrap: 'wrap' },
  modalListMajor: { padding: '12px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 },
  modalMajorRow: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  modalMajorName: { fontSize: 14, fontWeight: 800, color: '#0f172a' },
  modalStatsCol: { display: 'flex', gap: 12, fontSize: 12, flexShrink: 0 },
  modalActionCol: { display: 'flex', gap: 6, flexShrink: 0 },
};
