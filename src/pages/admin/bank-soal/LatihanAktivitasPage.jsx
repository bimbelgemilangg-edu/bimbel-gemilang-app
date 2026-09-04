// src/pages/admin/bank-soal/LatihanAktivitasPage.jsx
// ============================================================
// AKTIVITAS LATIHAN HARIAN (Admin)
// ============================================================
// Jawaban langsung buat kebutuhan: "gimana cara lihat soal yang udah
// dikerjakan siswa di Latihan Harian?" -- versi sederhana dulu, cukup
// buat VERIFIKASI sistem jalan (siapa aktif, XP/streak berapa, materi
// mana yang sudah/belum dikuasai). Detail lebih lengkap (analisis AI,
// download laporan) menyusul sesuai blueprint "Evaluasi & Aktivitas"
// yang sudah didiskusikan.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  ArrowLeft, Flame, Sparkles, ChevronDown, ChevronRight, Loader2, RefreshCw, ShieldAlert, AlertTriangle, TrendingDown,
} from 'lucide-react';
import { auditKecocokanSoal } from '../../../utils/aksesKontenSiswa';

export default function LatihanAktivitasPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [daftarSiswa, setDaftarSiswa] = useState([]); // gabungan students + siswa_progress
  const [expandedId, setExpandedId] = useState(null);
  const [detailPerMateri, setDetailPerMateri] = useState({}); // {studentId: [{materi, dicoba, benar, kuasai}]}
  const [loadingDetail, setLoadingDetail] = useState(null);
  const [filterKelas, setFilterKelas] = useState('');

  const muatData = useCallback(async () => {
    setLoading(true);
    try {
      const [snapStudents, snapProgress] = await Promise.all([
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'siswa_progress')),
      ]);

      const progressMap = {};
      snapProgress.forEach((d) => { progressMap[d.id] = d.data(); });

      const gabungan = snapStudents.docs.map((d) => {
        const s = d.data();
        const prog = progressMap[s.studentId] || {};
        return {
          docId: d.id,
          studentId: s.studentId,
          nama: s.nama || '-',
          kelas: s.kelasSekolah || '-',
          jenjang: s.jenjang || '-',
          xp: prog.xp || 0,
          streak: prog.streak || 0,
          lastActiveDate: prog.lastActiveDate || null,
          // 🔥 BARU: dipakai buat deteksi "sesi kepotong" -- soalHariIniCount
          // cuma di-update di AKHIR sesi (selesaikanSesi di LatihanHarianPage),
          // jadi kalau ada soal yang kejawab (siswa_soal_progress) tapi
          // jumlahnya lebih banyak dari yang tercatat di sini buat tanggal
          // yang sama, artinya sesi terakhir siswa ini KEPOTONG di tengah
          // jalan (mis. app ketutup pas lagi animasi mengirim/dikoreksi).
          soalHariIniCount: prog.soalHariIniCount || 0,
          soalHariIniTanggal: prog.soalHariIniTanggal || null,
          sudahPernahLatihan: !!progressMap[s.studentId],
        };
      });

      // Yang sudah pernah latihan ditampilkan duluan (paling relevan buat
      // dipantau), diurutkan dari XP tertinggi.
      gabungan.sort((a, b) => {
        if (a.sudahPernahLatihan !== b.sudahPernahLatihan) return a.sudahPernahLatihan ? -1 : 1;
        return b.xp - a.xp;
      });

      setDaftarSiswa(gabungan);
    } catch (e) {
      console.error('Gagal memuat aktivitas latihan:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { muatData(); }, [muatData]);

  // 🔥 BARU: 1 fungsi audit dipakai BARENG buat 2 kebutuhan --
  // (1) buka detail 1 siswa (klik baris), (2) tombol "Audit Cepat Semua
  // Siswa" (scan semua sekaligus). Supaya logikanya cuma ada 1 tempat.
  const auditSatuSiswa = useCallback(async (siswa) => {
    const snapProg = await getDocs(query(collection(db, 'siswa_soal_progress'), where('studentId', '==', siswa.studentId)));
    const daftarProg = snapProg.docs.map((d) => d.data());

    if (daftarProg.length === 0) {
      return { perMateri: [], soalNyasar: [], sesiKepotong: null };
    }

    // Ambil data soal terkait (jenjang, kelas, materi) -- Firestore 'in'
    // dibatasi 30 ID per query, jadi dipecah kalau lebih dari itu.
    const soalIds = daftarProg.map((p) => p.soalId);
    const soalMap = {};
    for (let i = 0; i < soalIds.length; i += 30) {
      const potongan = soalIds.slice(i, i + 30);
      const snapSoal = await getDocs(query(collection(db, 'bank_soal'), where('__name__', 'in', potongan)));
      snapSoal.forEach((d) => { soalMap[d.id] = d.data(); });
    }

    const perMateri = {};
    // 🔒 SOAL NYASAR: buat SETIAP soal yang PERNAH dikerjakan siswa ini,
    // cek ulang pakai aturan yang PERSIS SAMA dengan yang menyaring soal
    // di LatihanHarianPage (auditKecocokanSoal, dari file bersama). Kalau
    // ada yang tidak lolos, berarti soal itu SEHARUSNYA tidak pernah
    // sampai ke siswa ini -- baik karena bug lama sebelum perbaikan
    // jenjang/kelas, data soal diedit belakangan (mis. jenjang diubah
    // admin setelah siswa terlanjur mengerjakan), atau ada celah baru
    // yang belum ketahuan.
    const soalNyasar = [];

    daftarProg.forEach((p) => {
      const soal = soalMap[p.soalId];
      const materi = soal?.materi || 'Tidak diketahui';
      if (!perMateri[materi]) perMateri[materi] = { dicoba: 0, benar: 0, kuasai: 0 };
      perMateri[materi].dicoba += 1;
      perMateri[materi].benar += (p.benarCount || 0) > 0 ? 1 : 0;
      if ((p.kotak || 0) >= 3) perMateri[materi].kuasai += 1;

      if (soal) {
        const hasilAudit = auditKecocokanSoal(soal, siswa.jenjang, siswa.kelas);
        if (!hasilAudit.cocok) {
          soalNyasar.push({ soalId: p.soalId, materi, alasan: hasilAudit.alasan });
        }
      }
    });

    const hasilMateri = Object.entries(perMateri).map(([materi, d]) => ({
      materi,
      jumlahSoalDicoba: d.dicoba,
      persentaseKuasai: Math.round((d.kuasai / d.dicoba) * 100),
    })).sort((a, b) => a.persentaseKuasai - b.persentaseKuasai);

    // 🔒 SESI KEPOTONG: hitung berapa soal yang KEJAWAB hari ini
    // (siswa_soal_progress, disimpan LANGSUNG per-soal, jadi datanya
    // pasti akurat) vs berapa yang TERCATAT di siswa_progress
    // (soalHariIniCount, yang HANYA di-update di akhir sesi). Kalau
    // yang kejawab lebih banyak dari yang tercatat, berarti sesi
    // terakhir hari ini terputus SEBELUM sempat "final" -- XP/streak
    // dari sesi itu kemungkinan belum ketambah, walau soal per-soalnya
    // sendiri sudah aman tersimpan.
    const hariIniStr = new Date().toISOString().slice(0, 10);
    const soalDijawabHariIni = daftarProg.filter((p) => p.terakhirDicoba === hariIniStr).length;
    const tercatatHariIni = siswa.soalHariIniTanggal === hariIniStr ? siswa.soalHariIniCount : 0;
    const sesiKepotong = soalDijawabHariIni > tercatatHariIni
      ? { soalDijawabHariIni, tercatatHariIni, selisih: soalDijawabHariIni - tercatatHariIni }
      : null;

    return { perMateri: hasilMateri, soalNyasar, sesiKepotong };
  }, []);

  const bukaDetail = useCallback(async (siswa) => {
    if (expandedId === siswa.studentId) { setExpandedId(null); return; }
    setExpandedId(siswa.studentId);

    if (detailPerMateri[siswa.studentId]) return; // sudah pernah dimuat, pakai cache

    setLoadingDetail(siswa.studentId);
    try {
      const hasil = await auditSatuSiswa(siswa);
      setDetailPerMateri((prev) => ({ ...prev, [siswa.studentId]: hasil }));
    } catch (e) {
      console.error('Gagal ambil detail/audit siswa:', e);
      setDetailPerMateri((prev) => ({ ...prev, [siswa.studentId]: { perMateri: [], soalNyasar: [], sesiKepotong: null } }));
    }
    setLoadingDetail(null);
  }, [expandedId, detailPerMateri, auditSatuSiswa]);

  // 🔥 BARU: audit SEMUA siswa yang pernah latihan sekaligus (manual,
  // ditekan sendiri oleh admin -- BUKAN otomatis tiap buka halaman,
  // supaya tidak boros baca Firestore tiap kali admin cuma mau lihat
  // daftar biasa). Hasilnya dikumpulkan jadi 1 ringkasan di atas.
  const [audit, setAudit] = useState(null); // null = belum dijalankan
  const [sedangAudit, setSedangAudit] = useState(false);
  const [progresAudit, setProgresAudit] = useState({ sudah: 0, total: 0 });

  // 🔥 BARU: cek Bank Soal yang mulai TIPIS per kombinasi mapel +
  // jenjang + kelas. Kenapa penting: siswa bisa cepet "kehabisan"
  // soal baru buat 1 kombinasi spesifik (mis. Matematika kelas 9 SMP)
  // walau total Bank Soal keliatan banyak -- karena soal itu tersebar
  // ke banyak kombinasi beda-beda. Ini kasih peringatan DINI sebelum
  // siswa beneran ngerasa "kok gini-gini aja soalnya".
  const [sedangCekBankSoal, setSedangCekBankSoal] = useState(false);
  const [hasilCekBankSoal, setHasilCekBankSoal] = useState(null);
  const BATAS_TIPIS = 15; // di bawah ini dianggap "tipis", perlu ditambah

  const cekBankSoalMenipis = useCallback(async () => {
    setSedangCekBankSoal(true);
    try {
      const snap = await getDocs(query(collection(db, 'bank_soal'), where('status', '==', 'aktif')));
      const hitung = {};
      snap.forEach((d) => {
        const s = d.data();
        const kunci = `${s.mataPelajaran || '(kosong)'} · ${s.jenjang || '(kosong)'} · Kelas ${s.tingkatKelas || 'Semua'}`;
        hitung[kunci] = (hitung[kunci] || 0) + 1;
      });
      const daftar = Object.entries(hitung)
        .map(([kombinasi, jumlah]) => ({ kombinasi, jumlah }))
        .filter((x) => x.jumlah < BATAS_TIPIS)
        .sort((a, b) => a.jumlah - b.jumlah);
      setHasilCekBankSoal(daftar);
    } catch (e) {
      console.error('Gagal cek bank soal:', e);
      alert('Gagal mengecek Bank Soal.');
    }
    setSedangCekBankSoal(false);
  }, []);

  const jalankanAuditSemua = useCallback(async () => {
    const target = daftarSiswa.filter((s) => s.sudahPernahLatihan);
    setSedangAudit(true);
    setProgresAudit({ sudah: 0, total: target.length });

    const semuaSoalNyasar = []; // [{studentId, nama, soalId, materi, alasan}]
    const semuaSesiKepotong = []; // [{studentId, nama, ...}]

    for (const siswa of target) {
      try {
        const hasil = await auditSatuSiswa(siswa);
        hasil.soalNyasar.forEach((sn) => semuaSoalNyasar.push({ studentId: siswa.studentId, nama: siswa.nama, ...sn }));
        if (hasil.sesiKepotong) semuaSesiKepotong.push({ studentId: siswa.studentId, nama: siswa.nama, ...hasil.sesiKepotong });
        // Simpan juga ke cache detail per-siswa, biar kalau admin expand
        // manual setelah ini tidak perlu fetch ulang.
        setDetailPerMateri((prev) => ({ ...prev, [siswa.studentId]: hasil }));
      } catch (e) {
        console.error(`Gagal audit siswa ${siswa.studentId}:`, e);
      }
      setProgresAudit((prev) => ({ ...prev, sudah: prev.sudah + 1 }));
    }

    setAudit({ soalNyasar: semuaSoalNyasar, sesiKepotong: semuaSesiKepotong, waktuAudit: new Date() });
    setSedangAudit(false);
  }, [daftarSiswa, auditSatuSiswa]);

  const daftarTerfilter = filterKelas.trim()
    ? daftarSiswa.filter((s) => s.kelas.toLowerCase().includes(filterKelas.trim().toLowerCase()))
    : daftarSiswa;

  const formatTanggal = (str) => {
    if (!str) return 'Belum pernah';
    const hariIni = new Date().toISOString().slice(0, 10);
    if (str === hariIni) return 'Hari ini';
    return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px', fontFamily: 'sans-serif' }}>
      <button onClick={() => navigate('/admin/bank-soal')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>
        <ArrowLeft size={16} /> Kembali ke Bank Soal
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>
          <Sparkles size={24} color="#673ab7" /> Aktivitas Latihan Harian
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/admin/bank-soal/batalkan-uji-coba')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #fde68a', background: '#fffbeb', color: '#92400e', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
          >
            🧪 Batalkan Uji Coba Admin
          </button>
          <button
            onClick={jalankanAuditSemua}
            disabled={sedangAudit || loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fef2f2', color: '#b91c1c', cursor: sedangAudit ? 'default' : 'pointer', fontSize: 12, fontWeight: 700, opacity: sedangAudit ? 0.6 : 1 }}
          >
            {sedangAudit ? <Loader2 size={14} className="spin" /> : <ShieldAlert size={14} />}
            {sedangAudit ? `Mengaudit... (${progresAudit.sudah}/${progresAudit.total})` : 'Audit Cepat Semua Siswa'}
          </button>
          <button
            onClick={cekBankSoalMenipis}
            disabled={sedangCekBankSoal}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #fdba74', background: '#fff7ed', color: '#c2410c', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
          >
            {sedangCekBankSoal ? <Loader2 size={14} className="spin" /> : <TrendingDown size={14} />}
            {sedangCekBankSoal ? 'Mengecek...' : 'Cek Bank Soal Menipis'}
          </button>
          <button onClick={muatData} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 12 }}>
            <RefreshCw size={14} /> Muat Ulang
          </button>
        </div>
      </div>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
        Pantau siapa yang aktif latihan, XP/streak, dan materi mana yang masih perlu diperkuat.
        Klik <strong>Audit Cepat Semua Siswa</strong> buat mengecek soal yang mungkin nyasar jenjang/kelas dan sesi yang kepotong di tengah jalan.
      </p>

      {/* 🔥 BARU: hasil cek Bank Soal menipis -- per kombinasi mapel +
          jenjang + kelas yang jumlah soalnya di bawah ambang batas. */}
      {hasilCekBankSoal && (
        <div style={{ marginBottom: 16, borderRadius: 12, padding: 14, border: `1px solid ${hasilCekBankSoal.length > 0 ? '#fdba74' : '#86efac'}`, background: hasilCekBankSoal.length > 0 ? '#fff7ed' : '#f0fdf4' }}>
          {hasilCekBankSoal.length === 0 ? (
            <div style={{ fontSize: 13, color: '#15803d', fontWeight: 700 }}>
              ✅ Aman -- semua kombinasi mapel/jenjang/kelas punya minimal {BATAS_TIPIS} soal.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#c2410c', marginBottom: 8 }}>
                <TrendingDown size={16} /> {hasilCekBankSoal.length} kombinasi mulai tipis (di bawah {BATAS_TIPIS} soal) -- siswa bisa cepat kehabisan soal baru
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                {hasilCekBankSoal.map((h, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, background: 'white', borderRadius: 6, padding: '5px 10px' }}>
                    <span style={{ color: '#7c2d12' }}>{h.kombinasi}</span>
                    <span style={{ fontWeight: 700, color: h.jumlah < 5 ? '#dc2626' : '#d97706' }}>{h.jumlah} soal</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 🔥 BARU: ringkasan hasil audit -- cuma muncul SETELAH tombol
          "Audit Cepat" ditekan (bukan otomatis, biar tidak boros baca
          Firestore tiap buka halaman ini). */}
      {audit && (
        <div style={{
          marginBottom: 16, borderRadius: 12, padding: 14,
          border: `1px solid ${audit.soalNyasar.length > 0 || audit.sesiKepotong.length > 0 ? '#fca5a5' : '#86efac'}`,
          background: audit.soalNyasar.length > 0 || audit.sesiKepotong.length > 0 ? '#fef2f2' : '#f0fdf4',
        }}>
          {audit.soalNyasar.length === 0 && audit.sesiKepotong.length === 0 ? (
            <div style={{ fontSize: 13, color: '#15803d', fontWeight: 700 }}>
              ✅ Aman -- tidak ada soal nyasar jenjang/kelas, dan tidak ada sesi yang kepotong hari ini.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {audit.soalNyasar.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#b91c1c', marginBottom: 6 }}>
                    <ShieldAlert size={16} /> {audit.soalNyasar.length} soal ketahuan NYASAR (dikerjakan siswa di luar jenjang/kelasnya)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
                    {audit.soalNyasar.map((sn, i) => (
                      <div key={i} style={{ fontSize: 11.5, color: '#7f1d1d', background: 'white', borderRadius: 6, padding: '6px 8px' }}>
                        <strong>{sn.nama}</strong> ({sn.studentId}) — soal materi <em>{sn.materi}</em>: {sn.alasan}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {audit.sesiKepotong.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#b45309', marginBottom: 6 }}>
                    <AlertTriangle size={16} /> {audit.sesiKepotong.length} siswa keliatan sesinya kepotong hari ini
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
                    {audit.sesiKepotong.map((sk, i) => (
                      <div key={i} style={{ fontSize: 11.5, color: '#78350f', background: 'white', borderRadius: 6, padding: '6px 8px' }}>
                        <strong>{sk.nama}</strong> ({sk.studentId}) — {sk.soalDijawabHariIni} soal kejawab, tapi cuma {sk.tercatatHariIni} yang tercatat final (XP sesi terakhirnya kemungkinan belum ketambah)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 8 }}>
            Audit terakhir: {audit.waktuAudit.toLocaleString('id-ID')}
          </div>
        </div>
      )}

      <input
        placeholder="Filter kelas (mis. 9, 7 SMP)"
        value={filterKelas}
        onChange={(e) => setFilterKelas(e.target.value)}
        style={{ width: '100%', maxWidth: 300, padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, marginBottom: 16 }}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={24} className="spin" /></div>
      ) : daftarTerfilter.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>Tidak ada siswa yang cocok filter.</div>
      ) : (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
          {daftarTerfilter.map((s) => (
            <div key={s.docId} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <div
                onClick={() => s.sudahPernahLatihan && bukaDetail(s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  cursor: s.sudahPernahLatihan ? 'pointer' : 'default',
                  backgroundColor: expandedId === s.studentId ? '#f5f3ff' : 'white',
                  opacity: s.sudahPernahLatihan ? 1 : 0.55,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>{s.nama}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{s.kelas} · {s.jenjang}</div>
                </div>
                {s.sudahPernahLatihan ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#f97316', fontWeight: 700 }}>
                      <Flame size={14} /> {s.streak}
                    </div>
                    <div style={{ fontSize: 12, color: '#673ab7', fontWeight: 700, minWidth: 60 }}>{s.xp} XP</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', minWidth: 70, textAlign: 'right' }}>{formatTanggal(s.lastActiveDate)}</div>
                    {expandedId === s.studentId ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </>
                ) : (
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>Belum pernah latihan</span>
                )}
              </div>

              {expandedId === s.studentId && (
                <div style={{ padding: '10px 16px 16px 40px', backgroundColor: '#fafafa' }}>
                  {loadingDetail === s.studentId ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* 🔒 Hasil audit per-siswa ini -- soal nyasar & sesi kepotong */}
                      {(detailPerMateri[s.studentId]?.soalNyasar?.length || 0) > 0 && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, color: '#b91c1c', marginBottom: 6 }}>
                            <ShieldAlert size={14} /> {detailPerMateri[s.studentId].soalNyasar.length} soal nyasar ke siswa ini
                          </div>
                          {detailPerMateri[s.studentId].soalNyasar.map((sn, i) => (
                            <div key={i} style={{ fontSize: 11, color: '#7f1d1d' }}>• Materi {sn.materi}: {sn.alasan}</div>
                          ))}
                        </div>
                      )}
                      {detailPerMateri[s.studentId]?.sesiKepotong && (
                        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 10, fontSize: 11.5, color: '#78350f' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, marginBottom: 4 }}>
                            <AlertTriangle size={14} /> Sesi hari ini keliatan kepotong
                          </div>
                          {detailPerMateri[s.studentId].sesiKepotong.soalDijawabHariIni} soal kejawab, tapi cuma {detailPerMateri[s.studentId].sesiKepotong.tercatatHariIni} yang tercatat final.
                        </div>
                      )}

                      {(detailPerMateri[s.studentId]?.perMateri?.length || 0) === 0 ? (
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>Belum ada data materi.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {detailPerMateri[s.studentId].perMateri.map((m) => (
                            <div key={m.materi} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                              <span style={{ color: '#374151' }}>{m.materi} <span style={{ color: '#9ca3af' }}>({m.jumlahSoalDicoba} soal dicoba)</span></span>
                              <span style={{ fontWeight: 700, color: m.persentaseKuasai < 60 ? '#dc2626' : '#16a34a' }}>{m.persentaseKuasai}% kuasai</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}