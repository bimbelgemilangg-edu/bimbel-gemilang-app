// src/pages/student/TargetKampuskuPage.jsx
// ============================================================
// TARGET KAMPUS & JURUSAN UTBK-SNBT 2027 (Benchmark AmbisPTN 1:1)
// Eksplorasi 173 PTN & 4.594 Program Studi Nasional dengan Data Riil
// Dilengkapi Logo Universitas Resmi, Filter 36 Provinsi, Tab Sesuai Skormu,
// serta Pemilihan Mandiri Pilihan 1 & Pilihan 2 untuk Siswa Gemilang.
// ============================================================
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Building2,
  GraduationCap,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MapPin,
  Award,
  Zap,
  ArrowRight,
  X,
  Star,
  Users,
  Compass,
} from 'lucide-react';
import {
  useTargetKampusSiswa,
  simpanPilihanTarget,
  hapusPilihanTarget,
  getDaftarPtnAmbis,
  getDaftarProdiAmbis,
  hitungGapTarget,
} from '../../services/targetKampusService';
import LogoKampus from '../../components/LogoKampus';
import { useProfilSiswa } from '../../utils/profilSiswa';
import { deteksiTingkatSiswa } from '../../utils/tingkatSiswa';

export default function TargetKampuskuPage() {
  const navigate = useNavigate();
  const profil = useProfilSiswa();
  const studentId = localStorage.getItem('studentId') || localStorage.getItem('studentNim') || '';

  const kelasCek = profil.kelas || profil.kelasSekolah || (typeof localStorage !== 'undefined' ? localStorage.getItem('studentGrade') || localStorage.getItem('studentKelas') : '');
  const jenjangCek = profil.jenjang || (typeof localStorage !== 'undefined' ? localStorage.getItem('studentGrade') : '');
  const infoTingkat = useMemo(() => {
    return deteksiTingkatSiswa({ ...profil, kelas: kelasCek, kelasSekolah: kelasCek, jenjang: jenjangCek });
  }, [profil, kelasCek, jenjangCek]);

  // 1. Hook Target Pilihan Siswa Real-time
  const { target: targetSiswa, loading: loadingTarget } = useTargetKampusSiswa(studentId);

  // 2. Data 173 PTN & 4.594 Prodi
  const allPtn = useMemo(() => getDaftarPtnAmbis(), []);
  const allProdi = useMemo(() => getDaftarProdiAmbis(), []);

  // 3. State Navigasi & Filter Explorer
  const [tabAktif, setTabAktif] = useState('kampus'); // 'kampus' | 'jurusan' | 'sesuai-skor'
  const [cariTeks, setCariTeks] = useState('');
  const [provinsiFilter, setProvinsiFilter] = useState('Semua');
  const [rumpunFilter, setRumpunFilter] = useState('Semua'); // 'Semua' | 'saintek' | 'soshum'
  const [jenjangFilter, setJenjangFilter] = useState('Semua'); // 'Semua' | 'Sarjana' | 'Diploma'
  const [modalPtnTerpilih, setModalPtnTerpilih] = useState(null);
  const [cariDiModal, setCariDiModal] = useState('');
  const [rumpunModalFilter, setRumpunModalFilter] = useState('Semua');
  const [toastNotif, setToastNotif] = useState(null);

  // 4. Skor Terkini Siswa (dari target atau default evaluasi)
  const [skorSimulasi, setSkorSimulasi] = useState(() => {
    return Number(targetSiswa?.skorTerakhirUtbk?.nilai) || 685;
  });

  // Tampilkan toast sementara
  const tunjukkanToast = (pesan) => {
    setToastNotif(pesan);
    setTimeout(() => setToastNotif(null), 3500);
  };

  // 5. Daftar Provinsi Unik
  const listProvinsi = useMemo(() => {
    const setP = new Set(allPtn.map((p) => p.province).filter(Boolean));
    return ['Semua', ...Array.from(setP).sort()];
  }, [allPtn]);

  // 6. Filter PTN
  const ptnTersaring = useMemo(() => {
    let list = allPtn;

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
  }, [allPtn, provinsiFilter, cariTeks]);

  // 7. Filter Seluruh Prodi
  const prodiTersaring = useMemo(() => {
    let list = allProdi;

    if (rumpunFilter !== 'Semua') {
      list = list.filter((pr) => pr.rumpun === rumpunFilter);
    }

    if (jenjangFilter !== 'Semua') {
      if (jenjangFilter === 'Sarjana') {
        list = list.filter((pr) => pr.degree_type === 'Sarjana');
      } else {
        list = list.filter((pr) => pr.degree_type && pr.degree_type.includes('Diploma'));
      }
    }

    if (provinsiFilter !== 'Semua') {
      const ptnDiProvinsi = new Set(allPtn.filter((p) => p.province === provinsiFilter).map((p) => p.slug));
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
  }, [allProdi, allPtn, rumpunFilter, jenjangFilter, provinsiFilter, cariTeks]);

  // 8. Filter Sesuai Skormu
  const prodiSesuaiSkor = useMemo(() => {
    const skor = Number(skorSimulasi) || 685;
    return prodiTersaring.map((pr) => {
      const targetScore = Number(pr.passing_score) || 700;
      const gap = skor - targetScore;
      let kategoriZona = 'KOMPETITIF';
      if (gap >= 15) kategoriZona = 'AMAN';
      else if (gap < -30) kategoriZona = 'AMBISIUS';

      return { ...pr, gap, kategoriZona };
    });
  }, [prodiTersaring, skorSimulasi]);

  // Handler simpan pilihan
  const handlePilihProdi = async (pilihanKe, majorData) => {
    await simpanPilihanTarget(studentId, pilihanKe, majorData);
    tunjukkanToast(`🎉 Berhasil! ${majorData.name} (${majorData.uni_short || majorData.uni_name}) ditetapkan sebagai Target Pilihan ${pilihanKe}!`);
  };

  // Handler hapus pilihan
  const handleHapusProdi = async (pilihanKe) => {
    await hapusPilihanTarget(studentId, pilihanKe);
    tunjukkanToast(`Target Pilihan ${pilihanKe} telah dihapus.`);
  };

  const p1 = targetSiswa?.pilihan1;
  const p2 = targetSiswa?.pilihan2;
  const gapP1 = p1 ? hitungGapTarget(p1.passingScore, skorSimulasi) : null;
  const gapP2 = p2 ? hitungGapTarget(p2.passingScore, skorSimulasi) : null;

  if (!infoTingkat.bisaAksesTargetKampus) {
    return (
      <div style={{ maxWidth: 640, margin: '60px auto', padding: '24px 20px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Building2 size={30} color="#0d9488" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>
          Fitur Target PTN Khusus Jenjang SMA
        </h2>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 20 }}>
          Eksplorasi 173 PTN dan 4.594 Program Studi Nasional diperuntukkan bagi jenjang SMA (Kelas 10, 11, dan 12) dalam persiapan seleksi perguruan tinggi negeri. Untuk jenjang kamu, silakan fokus pada pembelajaran dan latihan di Dashboard.
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
      {toastNotif && (
        <div style={st.toastNotif}>
          <Sparkles size={18} color="#0d9488" />
          <span>{toastNotif}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* HEADER UTAMA                                                 */}
      {/* ============================================================ */}
      <div style={st.headerWrap}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={st.iconBadgeHeader}>
            <Target size={24} color="#0d9488" />
          </div>
          <div>
            <h1 style={st.judul}>Target Kampus &amp; Jurusan Impian UTBK-SNBT 2027</h1>
            <p style={st.subJudul}>
              Pilih dan kunci Pilihan 1 &amp; Pilihan 2 kamu dari <b>173 PTN</b> &amp; <b>4.594 Program Studi</b> Nasional.
              Dilengkapi data resmi kuota daya tampung, tingkat keketatan, dan estimasi passing score acuan SNBT.
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* DUA KARTU TARGET UTAMA (PILIHAN 1 & PILIHAN 2)              */}
      {/* ============================================================ */}
      <div style={st.targetGrid}>
        {/* PILIHAN 1 */}
        <div style={{ ...st.targetCard, borderColor: p1 ? '#0d9488' : '#e2e8f0' }}>
          <div style={st.targetCardHeader}>
            <div style={st.targetBadgeP1}>
              <Star size={13} fill="#0d9488" color="#0d9488" />
              <span>TARGET PILIHAN 1 (UTAMA)</span>
            </div>
            {p1 && (
              <button
                type="button"
                onClick={() => handleHapusProdi(1)}
                style={st.btnHapusTarget}
                title="Hapus Target Pilihan 1"
              >
                <Trash2 size={15} color="#ef4444" />
              </button>
            )}
          </div>

          {p1 ? (
            <div style={st.targetCardBody}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <LogoKampus ptn={p1} size={58} radius={12} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={st.uniNameText}>
                    {p1.uniName} {p1.uniShort ? `(${p1.uniShort})` : ''}
                  </div>
                  <div style={st.majorNameText}>{p1.majorName}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    <span style={st.chipDegree}>{p1.degreeType || 'Sarjana'}</span>
                    <span style={p1.rumpun === 'soshum' ? st.chipSoshum : st.chipSaintek}>
                      {p1.rumpunLabel || 'Saintek'}
                    </span>
                    <span style={st.chipAkreditasi}>Akreditasi: {p1.accreditation || 'Unggul'}</span>
                  </div>
                </div>
              </div>

              {/* Statistik Passing Score & Kuota */}
              <div style={st.statsGrid}>
                <div style={st.statBox}>
                  <div style={st.statLabel}>Passing Score Acuan</div>
                  <div style={st.statValueHighlight}>{p1.passingScore || 700}</div>
                  <div style={st.statSub}>Target Nilai UTBK</div>
                </div>
                <div style={st.statBox}>
                  <div style={st.statLabel}>Daya Tampung</div>
                  <div style={st.statValue}>{p1.capacity || 50} Kursi</div>
                  <div style={st.statSub}>Kuota Jalur SNBT</div>
                </div>
                <div style={st.statBox}>
                  <div style={st.statLabel}>Keketatan</div>
                  <div style={st.statValue}>
                    {p1.selectivity ? `${(p1.selectivity * 100).toFixed(1)}%` : '3.0%'}
                  </div>
                  <div style={st.statSub}>Tingkat Persaingan</div>
                </div>
              </div>

              {/* Ambis Meter / Status GAP */}
              <div style={{ ...st.gapBox, background: gapP1?.bg || '#f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: gapP1?.warna || '#334155' }}>
                    📊 Ambis Meter: {gapP1?.label}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    Skor Simulasimu: <b>{skorSimulasi}</b>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={st.emptyTargetBox}>
              <div style={st.emptyCircleIcon}>
                <PlusIcon size={24} color="#0d9488" />
              </div>
              <div style={st.emptyTitle}>Pilihan 1 Belum Ditentukan</div>
              <p style={st.emptyDesc}>
                Pilih program studi dan universitas impian utamamu dari 173 PTN di katalog bawah.
              </p>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('katalog-explorer');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={st.btnPilihSekarang}
              >
                Cari &amp; Pasang Target Pilihan 1 🔍
              </button>
            </div>
          )}
        </div>

        {/* PILIHAN 2 */}
        <div style={{ ...st.targetCard, borderColor: p2 ? '#0f766e' : '#e2e8f0' }}>
          <div style={st.targetCardHeader}>
            <div style={st.targetBadgeP2}>
              <Compass size={13} fill="#0f766e" color="#0f766e" />
              <span>TARGET PILIHAN 2 (CADANGAN / RASIONAL)</span>
            </div>
            {p2 && (
              <button
                type="button"
                onClick={() => handleHapusProdi(2)}
                style={st.btnHapusTarget}
                title="Hapus Target Pilihan 2"
              >
                <Trash2 size={15} color="#ef4444" />
              </button>
            )}
          </div>

          {p2 ? (
            <div style={st.targetCardBody}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <LogoKampus ptn={p2} size={58} radius={12} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={st.uniNameText}>
                    {p2.uniName} {p2.uniShort ? `(${p2.uniShort})` : ''}
                  </div>
                  <div style={st.majorNameText}>{p2.majorName}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    <span style={st.chipDegree}>{p2.degreeType || 'Sarjana'}</span>
                    <span style={p2.rumpun === 'soshum' ? st.chipSoshum : st.chipSaintek}>
                      {p2.rumpunLabel || 'Saintek'}
                    </span>
                    <span style={st.chipAkreditasi}>Akreditasi: {p2.accreditation || 'Unggul'}</span>
                  </div>
                </div>
              </div>

              {/* Statistik Passing Score & Kuota */}
              <div style={st.statsGrid}>
                <div style={st.statBox}>
                  <div style={st.statLabel}>Passing Score Acuan</div>
                  <div style={st.statValueHighlight}>{p2.passingScore || 650}</div>
                  <div style={st.statSub}>Target Nilai UTBK</div>
                </div>
                <div style={st.statBox}>
                  <div style={st.statLabel}>Daya Tampung</div>
                  <div style={st.statValue}>{p2.capacity || 50} Kursi</div>
                  <div style={st.statSub}>Kuota Jalur SNBT</div>
                </div>
                <div style={st.statBox}>
                  <div style={st.statLabel}>Keketatan</div>
                  <div style={st.statValue}>
                    {p2.selectivity ? `${(p2.selectivity * 100).toFixed(1)}%` : '4.5%'}
                  </div>
                  <div style={st.statSub}>Tingkat Persaingan</div>
                </div>
              </div>

              {/* Ambis Meter / Status GAP */}
              <div style={{ ...st.gapBox, background: gapP2?.bg || '#f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: gapP2?.warna || '#334155' }}>
                    📊 Ambis Meter: {gapP2?.label}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    Skor Simulasimu: <b>{skorSimulasi}</b>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={st.emptyTargetBox}>
              <div style={st.emptyCircleIcon}>
                <PlusIcon size={24} color="#0f766e" />
              </div>
              <div style={st.emptyTitle}>Pilihan 2 Belum Ditentukan</div>
              <p style={st.emptyDesc}>
                Pilih prodi cadangan atau pengaman rasional untuk memaksimalkan peluang lolos SNBT.
              </p>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('katalog-explorer');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={st.btnPilihSekarang}
              >
                Cari &amp; Pasang Target Pilihan 2 🔍
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* ANALISIS STRATEGI FORMASI SNBT                               */}
      {/* ============================================================ */}
      {p1 && p2 && (
        <div style={st.analisisFormasiBox}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Zap size={18} color="#0d9488" />
            <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0f766e' }}>
              Analisis Strategi Formasi Pilihanmu
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: '#334155', margin: 0, lineHeight: 1.6 }}>
            {p1.passingScore >= p2.passingScore ? (
              <span>
                🎯 <b>Formasi Sangat Ideal!</b> Passing score Pilihan 1 ({p1.passingScore}) lebih tinggi atau seimbang
                dibandingkan Pilihan 2 ({p2.passingScore}). Urutan ini memberikan peluang maksimal tanpa risiko gugur di
                seleksi tahap pertama.
              </span>
            ) : (
              <span>
                ⚠️ <b>Tips Taktis Panitia SNBT:</b> Passing score Pilihan 1 ({p1.passingScore}) tercatat lebih rendah
                daripada Pilihan 2 ({p2.passingScore}). Direkomendasikan menempatkan prodi dengan keketatan/skor acuan
                tertinggi di Pilihan 1 agar peluang di Pilihan 2 tidak hangus!
              </span>
            )}
          </p>
        </div>
      )}

      {/* ============================================================ */}
      {/* PUSAT EKSPLORASI 173 PTN (BENCHMARK AMBISPTN 1:1)           */}
      {/* ============================================================ */}
      <div id="katalog-explorer" style={st.explorerWrap}>
        <div style={st.explorerHeaderRow}>
          <div>
            <h2 style={st.subJudulSection}>🏛️ Jelajahi 173 PTN &amp; 4.594 Program Studi Nasional</h2>
            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
              Data resmi terverifikasi lengkap dengan kuota kursi, akreditasi, dan passing score.
            </p>
          </div>

          {/* Tab Switcher 1:1 AmbisPTN */}
          <div style={st.tabBar}>
            <button
              type="button"
              onClick={() => setTabAktif('kampus')}
              style={tabAktif === 'kampus' ? st.tabAktif : st.tabBiasa}
            >
              🏛️ Kampus ({allPtn.length})
            </button>
            <button
              type="button"
              onClick={() => setTabAktif('jurusan')}
              style={tabAktif === 'jurusan' ? st.tabAktif : st.tabBiasa}
            >
              📚 Jurusan ({allProdi.length.toLocaleString('id-ID')})
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

        {/* Filter Bar Responsif */}
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
            {/* Filter Provinsi */}
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

            {/* Filter Rumpun (Tab Jurusan / Sesuai Skor) */}
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
        {/* TAB 1: KAMPUS (173 PTN GRID)                                 */}
        {/* ============================================================ */}
        {tabAktif === 'kampus' && (
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
              Menampilkan <b>{ptnTersaring.length}</b> Perguruan Tinggi Negeri:
            </div>

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
                          <span>
                            {ptn.city || ''}{ptn.province ? `, ${ptn.province}` : ''}
                          </span>
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
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: JURUSAN (4.594 PRODI NASIONAL)                        */}
        {/* ============================================================ */}
        {tabAktif === 'jurusan' && (
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
              Ditemukan <b>{prodiTersaring.length.toLocaleString('id-ID')}</b> program studi nasional:
            </div>

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
                        <span style={st.statItemLabel}>Kuota Kursi:</span>
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
                        onClick={() => handlePilihProdi(1, pr)}
                        style={isPilihan1 ? st.btnTerpilihP1 : st.btnAksiP1}
                      >
                        {isPilihan1 ? '✓ Pilihan 1 Kamu' : '⭐ Jadikan Pilihan 1'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePilihProdi(2, pr)}
                        style={isPilihan2 ? st.btnTerpilihP2 : st.btnAksiP2}
                      >
                        {isPilihan2 ? '✓ Pilihan 2 Kamu' : '🎯 Jadikan Pilihan 2'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {prodiTersaring.length > 50 && (
              <div style={st.boxLebihBanyak}>
                Gunakan kotak pencarian di atas untuk mempersempit dari total {prodiTersaring.length.toLocaleString('id-ID')} jurusan.
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: SESUAI SKORMU                                         */}
        {/* ============================================================ */}
        {tabAktif === 'sesuai-skor' && (
          <div>
            <div style={st.boxSimulatorSkor}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f766e' }}>
                    🎯 Simulasi Rekomendasi Sesuai Skor UTBK Kamu
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Geser atau masukkan skormu untuk memfilter jurusan dengan peluang lolos paling rasional:
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#334155', fontWeight: 700 }}>Skor Acuan:</span>
                  <input
                    type="number"
                    value={skorSimulasi}
                    onChange={(e) => setSkorSimulasi(Number(e.target.value) || 0)}
                    style={st.inputSkorAngka}
                  />
                </div>
              </div>
            </div>

            <div style={st.prodiList}>
              {prodiSesuaiSkor.slice(0, 40).map((pr) => {
                const isPilihan1 = p1?.majorSlug === pr.slug || p1?.majorId === pr.id;
                const isPilihan2 = p2?.majorSlug === pr.slug || p2?.majorId === pr.id;

                const warnaZona = pr.kategoriZona === 'AMAN' ? '#16a34a' : pr.kategoriZona === 'KOMPETITIF' ? '#0d9488' : '#d97706';
                const labelZona = pr.kategoriZona === 'AMAN' ? 'Peluang Terbuka (Aman)' : pr.kategoriZona === 'KOMPETITIF' ? 'Kompetitif (Rasional)' : 'Tantangan Ambisius';

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
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <span style={{ ...st.badgeZonaStatus, color: warnaZona, borderColor: `${warnaZona}55` }}>
                            {labelZona} (Selisih {pr.gap >= 0 ? '+' : ''}{pr.gap})
                          </span>
                        </div>
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
                        onClick={() => handlePilihProdi(1, pr)}
                        style={isPilihan1 ? st.btnTerpilihP1 : st.btnAksiP1}
                      >
                        {isPilihan1 ? '✓ Pilihan 1' : 'Pilihan 1'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePilihProdi(2, pr)}
                        style={isPilihan2 ? st.btnTerpilihP2 : st.btnAksiP2}
                      >
                        {isPilihan2 ? '✓ Pilihan 2' : 'Pilihan 2'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL DETAIL KAMPUS & SELURUH PRODINYA                      */}
      {/* ============================================================ */}
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
                          onClick={() => handlePilihProdi(1, mComplete)}
                          style={isPilihan1 ? st.btnTerpilihP1 : st.btnAksiP1}
                        >
                          {isPilihan1 ? '✓ Pilihan 1' : '⭐ Pilihan 1'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePilihProdi(2, mComplete)}
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

function PlusIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

// ============================================================
// STYLESHEET (Nuansa Emerald/Teal Bimbel Gemilang)
// ============================================================
const st = {
  wrap: {
    maxWidth: 1180,
    margin: '0 auto',
    padding: '20px 16px 80px',
  },
  headerWrap: {
    marginBottom: 20,
  },
  iconBadgeHeader: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: '#ccfbf1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  judul: {
    fontSize: 22,
    fontWeight: 900,
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.3px',
  },
  subJudul: {
    fontSize: 13,
    color: '#475569',
    margin: '4px 0 0',
    lineHeight: 1.5,
  },
  targetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 16,
    marginBottom: 16,
  },
  targetCard: {
    background: '#ffffff',
    borderRadius: 16,
    border: '2px solid #e2e8f0',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  targetCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#f8fafc',
    borderBottom: '1px solid #f1f5f9',
  },
  targetBadgeP1: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    fontWeight: 800,
    color: '#0d9488',
    letterSpacing: '0.4px',
  },
  targetBadgeP2: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    fontWeight: 800,
    color: '#0f766e',
    letterSpacing: '0.4px',
  },
  btnHapusTarget: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 6px',
    borderRadius: 6,
  },
  targetCardBody: {
    padding: 16,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  ptnLogoBig: {
    width: 58,
    height: 58,
    objectFit: 'contain',
    borderRadius: 12,
    padding: 4,
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    flexShrink: 0,
  },
  uniNameText: {
    fontSize: 13,
    fontWeight: 700,
    color: '#64748b',
  },
  majorNameText: {
    fontSize: 16,
    fontWeight: 900,
    color: '#0f172a',
    marginTop: 2,
  },
  chipDegree: {
    fontSize: 10.5,
    fontWeight: 800,
    background: '#f1f5f9',
    color: '#475569',
    padding: '2px 8px',
    borderRadius: 6,
  },
  chipSaintek: {
    fontSize: 10.5,
    fontWeight: 800,
    background: '#e0f2fe',
    color: '#0284c7',
    padding: '2px 8px',
    borderRadius: 6,
  },
  chipSoshum: {
    fontSize: 10.5,
    fontWeight: 800,
    background: '#fef3c7',
    color: '#d97706',
    padding: '2px 8px',
    borderRadius: 6,
  },
  chipAkreditasi: {
    fontSize: 10.5,
    fontWeight: 700,
    background: '#ccfbf1',
    color: '#0f766e',
    padding: '2px 8px',
    borderRadius: 6,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    background: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    border: '1px solid #e2e8f0',
  },
  statBox: {
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 700,
  },
  statValueHighlight: {
    fontSize: 16,
    fontWeight: 900,
    color: '#0d9488',
    margin: '2px 0',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 800,
    color: '#1e293b',
    margin: '2px 0',
  },
  statSub: {
    fontSize: 9.5,
    color: '#94a3b8',
  },
  gapBox: {
    borderRadius: 10,
    padding: '10px 12px',
  },
  emptyTargetBox: {
    padding: 30,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyCircleIcon: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: '#f0fdfa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: 800,
    color: '#1e293b',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748b',
    maxWidth: 280,
    margin: '0 auto 14px',
    lineHeight: 1.5,
  },
  btnPilihSekarang: {
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    padding: '9px 16px',
    borderRadius: 10,
    fontSize: 12.5,
    fontWeight: 800,
    cursor: 'pointer',
  },
  analisisFormasiBox: {
    background: '#f0fdfa',
    border: '1px solid #99f6e4',
    borderRadius: 12,
    padding: '12px 16px',
    marginBottom: 24,
  },
  explorerWrap: {
    background: '#ffffff',
    borderRadius: 18,
    border: '1px solid #e2e8f0',
    padding: 20,
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.03)',
  },
  explorerHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  subJudulSection: {
    fontSize: 17,
    fontWeight: 900,
    color: '#0f172a',
    margin: 0,
  },
  tabBar: {
    display: 'inline-flex',
    background: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  tabAktif: {
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
  },
  tabBiasa: {
    background: 'none',
    color: '#475569',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
  filterBar: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottom: '1px solid #f1f5f9',
  },
  searchBarWrap: {
    flex: '1 1 280px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: 10,
    padding: '8px 12px',
  },
  searchInput: {
    border: 'none',
    background: 'none',
    outline: 'none',
    fontSize: 13,
    width: '100%',
    color: '#1e293b',
  },
  btnClearSearch: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  filterDropdowns: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  selectWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: 10,
    padding: '6px 10px',
  },
  selectProvinsi: {
    border: 'none',
    background: 'none',
    outline: 'none',
    fontSize: 12.5,
    fontWeight: 600,
    color: '#334155',
    cursor: 'pointer',
  },
  btnGroupRumpun: {
    display: 'inline-flex',
    background: '#f1f5f9',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  btnRumpunAktif: {
    background: '#ffffff',
    color: '#0d9488',
    border: 'none',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    borderRadius: 6,
    padding: '5px 10px',
    fontSize: 11.5,
    fontWeight: 800,
    cursor: 'pointer',
  },
  btnRumpunBiasa: {
    background: 'none',
    color: '#64748b',
    border: 'none',
    borderRadius: 6,
    padding: '5px 10px',
    fontSize: 11.5,
    fontWeight: 600,
    cursor: 'pointer',
  },
  ptnGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 14,
  },
  ptnCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: 14,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  ptnLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: '#f8fafc',
    border: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    flexShrink: 0,
  },
  ptnLogoImg: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  ptnShortText: {
    fontSize: 13.5,
    fontWeight: 800,
    color: '#0f172a',
  },
  ptnFullNameText: {
    fontSize: 11.5,
    color: '#64748b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginTop: 1,
  },
  ptnLocationText: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 4,
  },
  ptnCardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTop: '1px solid #f8fafc',
  },
  badgeAkreditasi: {
    fontSize: 10,
    fontWeight: 800,
    color: '#0f766e',
    background: '#ccfbf1',
    padding: '2px 6px',
    borderRadius: 6,
  },
  badgeProdiCount: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: 600,
  },
  btnLihatJurusan: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    background: 'none',
    border: 'none',
    color: '#0d9488',
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer',
    padding: 0,
  },
  prodiList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  prodiRowCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 12,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  prodiUniLogo: {
    width: 40,
    height: 40,
    objectFit: 'contain',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    padding: 3,
  },
  prodiMajorTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: '#0f172a',
  },
  prodiUniSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  prodiStatsCol: {
    display: 'flex',
    gap: 16,
    alignItems: 'center',
    flexShrink: 0,
  },
  statItemRow: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: 11,
  },
  statItemLabel: {
    color: '#94a3b8',
    fontSize: 10,
  },
  prodiActionCol: {
    display: 'flex',
    gap: 6,
    flexShrink: 0,
  },
  btnAksiP1: {
    background: '#0d9488',
    color: '#ffffff',
    border: 'none',
    padding: '7px 11px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer',
  },
  btnTerpilihP1: {
    background: '#ccfbf1',
    color: '#0f766e',
    border: '1px solid #0d9488',
    padding: '7px 11px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 800,
    cursor: 'default',
  },
  btnAksiP2: {
    background: '#0f766e',
    color: '#ffffff',
    border: 'none',
    padding: '7px 11px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer',
  },
  btnTerpilihP2: {
    background: '#f0fdf4',
    color: '#166534',
    border: '1px solid #16a34a',
    padding: '7px 11px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 800,
    cursor: 'default',
  },
  boxLebihBanyak: {
    textAlign: 'center',
    padding: 16,
    color: '#64748b',
    fontSize: 12,
  },
  boxSimulatorSkor: {
    background: '#f0fdfa',
    border: '1px solid #99f6e4',
    borderRadius: 12,
    padding: '12px 16px',
    marginBottom: 16,
  },
  inputSkorAngka: {
    width: 80,
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid #0d9488',
    fontWeight: 800,
    fontSize: 15,
    color: '#0f766e',
    textAlign: 'center',
    outline: 'none',
  },
  badgeZonaStatus: {
    fontSize: 11,
    fontWeight: 800,
    border: '1px solid',
    borderRadius: 6,
    padding: '2px 8px',
  },
  toastNotif: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    background: '#0f172a',
    color: '#ffffff',
    padding: '12px 18px',
    borderRadius: 12,
    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 13,
    fontWeight: 700,
    zIndex: 9999,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 16,
  },
  modalContent: {
    background: '#ffffff',
    borderRadius: 20,
    maxWidth: 720,
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
  },
  modalUniLogo: {
    width: 50,
    height: 50,
    objectFit: 'contain',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    padding: 4,
    flexShrink: 0,
  },
  modalUniTitle: {
    fontSize: 17,
    fontWeight: 900,
    color: '#0f172a',
    margin: 0,
  },
  modalUniMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  linkWebsiteUni: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    color: '#0d9488',
    textDecoration: 'none',
    fontWeight: 700,
  },
  btnCloseModal: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
  },
  modalFilterBar: {
    display: 'flex',
    gap: 10,
    padding: '12px 20px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  modalListMajor: {
    padding: '12px 20px',
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  modalMajorRow: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  modalMajorName: {
    fontSize: 14,
    fontWeight: 800,
    color: '#0f172a',
  },
  modalStatsCol: {
    display: 'flex',
    gap: 12,
    fontSize: 12,
    flexShrink: 0,
  },
  modalActionCol: {
    display: 'flex',
    gap: 6,
    flexShrink: 0,
  },
};
