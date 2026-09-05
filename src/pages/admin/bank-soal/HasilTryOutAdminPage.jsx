// src/pages/admin/bank-soal/HasilTryOutAdminPage.jsx
// ============================================================
// HASIL TRY OUT (Admin) -- lihat siapa sudah/belum mengerjakan try
// out yang diterbitkan lewat TerbitkanTryOutPage.jsx, skor, dan
// RANGKING otomatis (diurut dari skor tertinggi). Sumber data:
// koleksi "tryout_sesi" (baru, punya sistem try out sendiri -- BUKAN
// "jawaban_kuis" yang dipakai sistem Kuis guru/StudentQuizView.jsx).
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, query, where, doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import {
  ArrowLeft, Trophy, Loader2, CheckCircle2, Clock, XCircle, ShieldAlert, RotateCcw, Ticket,
} from 'lucide-react';
import { hitungTotalSkor, skorSatuSoal, soalBelumDijawab } from '../../../utils/skorSoalTryOut';
import { terapkanPotonganXP, LABEL_PELANGGARAN } from '../../../utils/potonganXPTryOut';
import { tambahXpMingguan, kunciMingguIni } from '../../../utils/mingguIni';
import RendererPgSederhana from '../../student/tryout/RendererPgSederhana';
import RendererPgKompleks from '../../student/tryout/RendererPgKompleks';
import RendererBenarSalah from '../../student/tryout/RendererBenarSalah';
import RendererIsianSingkat from '../../student/tryout/RendererIsianSingkat';
import RenderMath from '../../../components/RenderMath';

function RendererSoalAdmin(props) {
  const tipe = props.soal.tipe || 'pg_sederhana';
  if (tipe === 'pg_kompleks') return <RendererPgKompleks {...props} />;
  if (tipe === 'benar_salah' || tipe === 'pg_kategori') return <RendererBenarSalah {...props} />;
  if (tipe === 'isian_singkat' || tipe === 'numerik') return <RendererIsianSingkat {...props} />;
  return <RendererPgSederhana {...props} />;
}

export default function HasilTryOutAdminPage() {
  const navigate = useNavigate();

  const [loadingPaket, setLoadingPaket] = useState(true);
  const [daftarPaket, setDaftarPaket] = useState([]);
  const [paketTerpilih, setPaketTerpilih] = useState(null);

  const [loadingHasil, setLoadingHasil] = useState(false);
  const [baris, setBaris] = useState([]); // { student, sesi|null }

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'tryout_paket'));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setDaftarPaket(list);
      } catch (e) {
        console.error('Gagal ambil daftar try out:', e);
      }
      setLoadingPaket(false);
    })();
  }, []);

  const bukaHasil = useCallback(async (paket) => {
    setPaketTerpilih(paket);
    setLoadingHasil(true);
    setBaris([]);
    try {
      // Ambil target siswa (yang MEMANG jadi sasaran paket ini), biar
      // yang "belum mengerjakan" juga ikut kelihatan -- bukan cuma yang
      // udah punya sesi doang.
      const snapSiswa = await getDocs(collection(db, 'students'));
      const semuaSiswa = snapSiswa.docs.map((d) => ({ id: d.id, ...d.data() }));
      const targetSiswa = semuaSiswa.filter((s) => {
        const cocokKelas = paket.targetKelas === 'Semua' || s.kelasSekolah === paket.targetKelas;
        const cocokKategori = paket.targetKategori === 'Semua' || s.kategori === paket.targetKategori;
        return cocokKelas && cocokKategori && !s.isBlocked;
      });

      const snapSesi = await getDocs(query(collection(db, 'tryout_sesi'), where('paketId', '==', paket.id)));
      const sesiPerStudent = {};
      snapSesi.forEach((d) => { sesiPerStudent[d.data().studentId] = { id: d.id, ...d.data() }; });

      const hasil = targetSiswa.map((s) => ({
        student: s,
        sesi: sesiPerStudent[s.studentId || s.id] || null,
      }));

      // 🔒 RANGKING: yang SELESAI diurutkan dari skor tertinggi. Yang
      // masih "berjalan" atau "belum mulai" ditaruh di bawah (gak ikut
      // rangking sampai beneran selesai -- adil, jangan sampai yang
      // belum kelar malah keitung).
      hasil.sort((a, b) => {
        const skorA = a.sesi?.status === 'selesai' ? (a.sesi.totalSkorPersen ?? -1) : -2;
        const skorB = b.sesi?.status === 'selesai' ? (b.sesi.totalSkorPersen ?? -1) : -2;
        return skorB - skorA;
      });

      setBaris(hasil);
    } catch (e) {
      console.error('Gagal ambil hasil try out:', e);
      alert('Gagal mengambil hasil: ' + e.message);
    }
    setLoadingHasil(false);
  }, []);

  // 🔥 BARU: modal galeri foto pengawasan -- fotonya SUDAH kesimpen
  // sejak awal (lewat useDeteksiKecuranganTryOut.js -> Supabase), tapi
  // sebelumnya belum ada tempat buat admin BENERAN lihat isinya, cuma
  // angka jumlahnya doang. Ini nyambungin ke data yang udah ada.
  const [siswaFotoDibuka, setSiswaFotoDibuka] = useState(null); // { nama, foto: [] }
  // 🔥 BARU: detail jawaban siswa -- biar admin bisa lihat PERSIS apa
  // yang dijawab siswa (termasuk mana yang beneran skip vs salah
  // pilih), TANPA perlu pinjam akun/login sebagai siswa itu.
  const [siswaDetailDibuka, setSiswaDetailDibuka] = useState(null); // item baris (student + sesi)

  const jumlahSelesai = baris.filter((b) => b.sesi?.status === 'selesai').length;
  const jumlahBerjalan = baris.filter((b) => b.sesi?.status === 'berjalan').length;

  // 🔥 BARU: "Hitung Ulang" -- buat siswa yang KETERLANJUR dirugikan
  // bug skoring lama (mis. jawaban benar tapi disalahkan sistem gara-
  // gara format kunci jawaban yang belum toleran), admin bisa hitung
  // ulang skornya PAKAI LOGIKA YANG SUDAH DIBENERIN, tanpa siswa itu
  // harus ngerjain ulang dari nol. Jawaban yang udah tersimpan (di
  // tryout_sesi.jawaban) TETAP DIPAKAI -- cuma cara MENILAINYA yang
  // diulang pakai kode yang sudah benar.
  const [sedangHitungUlang, setSedangHitungUlang] = useState(null); // studentId yang lagi diproses

  // 🔥 BARU: "Izinkan Ulang" -- buat siswa yang KOMPLAIN hasilnya gak
  // masuk akal (mis. semua 0% padahal dia yakin udah jawab -- bisa
  // jadi progresnya gagal tersimpan gara-gara koneksi putus-putus pas
  // ngerjain). Ini: (1) HAPUS sesi lamanya yang bermasalah, (2) kasih
  // "izin ulang khusus" yang nembus deadline paket (walau deadline-nya
  // udah lewat), TAPI cuma buat siswa ini doang -- siswa lain yang
  // udah selesai sesuai jadwal TETAP gak kesenggol, tetap adil.
  // 🔥 BARU: "Izinkan Ulang" -- buat siswa yang KOMPLAIN hasilnya gak
  // masuk akal (mis. semua "Tidak dijawab" padahal dia yakin udah
  // jawab -- kemungkinan besar progresnya gagal kesimpen gara-gara
  // koneksi putus-putus pas ngerjain, apalagi kalau try out dikerjain
  // serentak rame-rame). Fungsi ini melakukan SEMUA yang perlu
  // sekaligus, biar gak ada langkah yang kelewat:
  //   1. Tarik balik XP dari hasil lama (biar gak dobel pas dia
  //      ngerjain ulang nanti dan dapat XP baru lagi)
  //   2. Hapus dokumen sesi lamanya PERMANEN
  //   3. Kasih "izin ulang khusus" yang NEMBUS deadline paket -- PENTING
  //      terutama kalau deadline try out ini UDAH LEWAT, karena tanpa
  //      ini, begitu sesi lamanya dihapus, TryOutView.jsx tetap akan
  //      nolak dia mulai lagi (dianggap "lewat deadline"). Izin ini
  //      CUMA berlaku buat siswa ini -- siswa lain yang udah selesai
  //      sesuai jadwal asli TIDAK ikut kesenggol / TIDAK dibukakan
  //      deadline-nya, tetap adil.
  const [sedangIzinkanUlang, setSedangIzinkanUlang] = useState(null);

  const izinkanUlangSatuSiswa = useCallback(async (item) => {
    if (!item.sesi) return;
    const studentId = item.student.studentId || item.student.id;
    const konfirmasi = window.prompt(
      `Ketik ulang nama PERSIS "${item.student.nama}" buat izinkan dia ngerjain ULANG dari NOL:\n\n` +
      `- Hasil lama (skor ${item.sesi.totalSkorPersen}%, ${item.sesi.xpFinal || 0} XP) akan DIHAPUS PERMANEN.\n` +
      `- XP yang sempat masuk dari sesi lama akan ditarik balik (biar gak dobel).\n` +
      `- Dia akan bisa mulai lagi dari nol selama 3 jam ke depan, WALAU deadline try out ini udah lewat -- ` +
      `siswa lain TIDAK ikut kesenggol/TIDAK dibukakan deadline-nya.`
    );
    if (konfirmasi !== item.student.nama) {
      if (konfirmasi !== null) alert('Nama yang diketik tidak cocok persis -- dibatalkan.');
      return;
    }

    setSedangIzinkanUlang(studentId);
    try {
      // 1. Tarik balik XP dari hasil lama (kalau ada) -- SELISIHNYA
      //    doang, bukan reset ke 0, biar aktivitas lain siswa gak
      //    ikut kesenggol.
      const xpLama = item.sesi.xpFinal || 0;
      if (xpLama !== 0) {
        const progRef = doc(db, 'siswa_progress', studentId);
        const snapProg = await getDoc(progRef);
        const existing = snapProg.exists() ? snapProg.data() : {};
        const { xpMingguIni, xpMingguIniKunci } = tambahXpMingguan(existing.xpMingguIni, existing.xpMingguIniKunci, -xpLama);
        await updateDoc(progRef, {
          xp: Math.max(0, (existing.xp || 0) - xpLama),
          xpMingguIni: Math.max(0, xpMingguIni),
          xpMingguIniKunci,
          updatedAt: serverTimestamp(),
        });
      }

      // 2. Hapus sesi lama yang bermasalah -- PERMANEN.
      await deleteDoc(doc(db, 'tryout_sesi', item.sesi.id));

      // 3. Kasih izin ulang khusus, 3 jam dari sekarang -- ini yang
      //    bikin TryOutView.jsx ngizinin dia mulai lagi walau deadline
      //    paket udah lewat (lihat pengecekan di TryOutView.jsx).
      const waktuBerlakuSampai = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
      await setDoc(doc(db, 'tryout_izin_ulang', `${paketTerpilih.id}_${studentId}`), {
        paketId: paketTerpilih.id,
        studentId,
        waktuBerlakuSampai,
        diberikanOleh: 'admin',
        createdAt: serverTimestamp(),
      });

      setBaris((prev) => prev.map((b) => (
        b.student.id === item.student.id ? { ...b, sesi: null, izinUlang: { waktuBerlakuSampai } } : b
      )));
      alert(`${item.student.nama} sekarang bisa mulai ulang try out ini dari nol, sampai ${new Date(waktuBerlakuSampai).toLocaleString('id-ID')}.`);
    } catch (e) {
      console.error('Gagal izinkan ulang:', e);
      alert('Gagal memproses: ' + e.message);
    }
    setSedangIzinkanUlang(null);
  }, [paketTerpilih]);

  const hitungUlangSatuSiswa = useCallback(async (item) => {
    if (!paketTerpilih || !item.sesi || item.sesi.status !== 'selesai') return;
    setSedangHitungUlang(item.student.studentId || item.student.id);
    try {
      const { totalSkor, totalSkorPersen } = hitungTotalSkor(paketTerpilih.daftarSoal, item.sesi.jawaban || {});
      const xpMentahBaru = Math.round(totalSkor * 10); // XP_PER_SOAL, konsisten sama TryOutView.jsx
      const { xpFinal: xpFinalBaru } = terapkanPotonganXP(xpMentahBaru, item.sesi.pelanggaran || []);

      const xpFinalLama = item.sesi.xpFinal || 0;
      const selisihXp = xpFinalBaru - xpFinalLama;

      if (totalSkorPersen === item.sesi.totalSkorPersen && selisihXp === 0) {
        alert(`Hasil hitung ulang SAMA PERSIS kayak sebelumnya (${totalSkorPersen}%, ${xpFinalBaru} XP) -- gak ada yang perlu dikoreksi.`);
        setSedangHitungUlang(null);
        return;
      }

      const konfirmasi = window.confirm(
        `Hasil hitung ulang buat ${item.student.nama}:\n\n` +
        `Skor: ${item.sesi.totalSkorPersen}% -> ${totalSkorPersen}%\n` +
        `XP: ${xpFinalLama} -> ${xpFinalBaru} (selisih ${selisihXp >= 0 ? '+' : ''}${selisihXp})\n\n` +
        `Terapkan koreksi ini? XP totalnya bakal disesuaikan otomatis.`
      );
      if (!konfirmasi) { setSedangHitungUlang(null); return; }

      // Update dokumen sesi -- catat skor/XP yang BENAR.
      await updateDoc(doc(db, 'tryout_sesi', item.sesi.id), {
        totalSkorPersen, xpMentah: xpMentahBaru, xpFinal: xpFinalBaru, dikoreksiPada: serverTimestamp(),
      });

      // Sesuaikan XP siswa DENGAN SELISIHNYA SAJA (bukan diganti angka
      // penuh) -- biar XP dari aktivitas LAIN (Latihan Harian, try out
      // lain) yang udah numpuk di antara waktu itu TIDAK ikut ketimpa.
      if (selisihXp !== 0) {
        const studentId = item.student.studentId || item.student.id;
        const progRef = doc(db, 'siswa_progress', studentId);
        const snapProg = await getDoc(progRef);
        const existing = snapProg.exists() ? snapProg.data() : {};
        const { xpMingguIni, xpMingguIniKunci } = tambahXpMingguan(existing.xpMingguIni, existing.xpMingguIniKunci, selisihXp);
        await updateDoc(progRef, {
          xp: Math.max(0, (existing.xp || 0) + selisihXp),
          xpMingguIni: Math.max(0, xpMingguIni),
          xpMingguIniKunci,
          updatedAt: serverTimestamp(),
        });
      }

      // Perbarui tampilan tanpa perlu muat ulang semua data.
      setBaris((prev) => prev.map((b) => (
        b.student.id === item.student.id
          ? { ...b, sesi: { ...b.sesi, totalSkorPersen, xpMentah: xpMentahBaru, xpFinal: xpFinalBaru } }
          : b
      )).sort((a, b) => {
        const skorA = a.sesi?.status === 'selesai' ? (a.sesi.totalSkorPersen ?? -1) : -2;
        const skorB = b.sesi?.status === 'selesai' ? (b.sesi.totalSkorPersen ?? -1) : -2;
        return skorB - skorA;
      }));

      alert(`Berhasil dikoreksi! ${item.student.nama} sekarang ${totalSkorPersen}% (${xpFinalBaru} XP).`);
    } catch (e) {
      console.error('Gagal hitung ulang:', e);
      alert('Gagal menghitung ulang: ' + e.message);
    }
    setSedangHitungUlang(null);
  }, [paketTerpilih]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', fontFamily: 'sans-serif' }}>
      <button onClick={() => navigate('/admin/bank-soal')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>
        <ArrowLeft size={16} /> Kembali ke Bank Soal
      </button>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 800, color: '#1e293b', margin: '0 0 16px' }}>
        <Trophy size={24} color="#d97706" /> Hasil & Rangking Try Out
      </h1>

      {loadingPaket ? (
        <Loader2 size={18} className="spin" />
      ) : daftarPaket.length === 0 ? (
        <div style={{ color: '#9ca3af', fontSize: 13 }}>Belum ada try out yang diterbitkan.</div>
      ) : (
        <div style={{ display: 'flex', gap: 20 }}>
          {/* DAFTAR PAKET */}
          <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {daftarPaket.map((p) => (
              <button
                key={p.id}
                onClick={() => bukaHasil(p)}
                style={{
                  textAlign: 'left', padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  border: paketTerpilih?.id === p.id ? '2px solid #7c3aed' : '1px solid #e5e7eb',
                  background: paketTerpilih?.id === p.id ? '#f5f3ff' : 'white',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{p.judul}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{p.totalSoal} soal · {p.targetKelas}</div>
              </button>
            ))}
          </div>

          {/* HASIL + RANGKING */}
          <div style={{ flex: 1 }}>
            {!paketTerpilih ? (
              <div style={{ color: '#9ca3af', fontSize: 13, padding: 20, textAlign: 'center', border: '1px dashed #e5e7eb', borderRadius: 10 }}>
                Pilih try out di sebelah kiri buat lihat hasilnya.
              </div>
            ) : loadingHasil ? (
              <Loader2 size={18} className="spin" />
            ) : (
              <>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 12, color: '#6b7280' }}>
                  <span>✅ {jumlahSelesai} selesai</span>
                  <span>⏳ {jumlahBerjalan} sedang mengerjakan</span>
                  <span>⬜ {baris.length - jumlahSelesai - jumlahBerjalan} belum mulai</span>
                </div>

                <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left', width: 40 }}>#</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Nama</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Skor</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>XP</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Pelanggaran</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {baris.map((b, i) => {
                        const selesai = b.sesi?.status === 'selesai';
                        const berjalan = b.sesi?.status === 'berjalan';
                        const idSiswa = b.student.studentId || b.student.id;
                        return (
                          <tr key={b.student.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: selesai && i < 3 ? '#d97706' : '#9ca3af' }}>
                              {selesai ? i + 1 : '-'}
                            </td>
                            <td style={{ padding: '8px 10px', color: '#1e293b' }}>{b.student.nama}</td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              {selesai ? <CheckCircle2 size={14} color="#16a34a" style={{ display: 'inline' }} />
                                : berjalan ? <Clock size={14} color="#d97706" style={{ display: 'inline' }} />
                                : <XCircle size={14} color="#cbd5e1" style={{ display: 'inline' }} />}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>
                              {selesai ? `${b.sesi.totalSkorPersen}%` : '-'}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              {selesai ? b.sesi.xpFinal : '-'}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              {((b.sesi?.pelanggaran?.length || 0) > 0 || (b.sesi?.fotoPengawasan?.length || 0) > 0) ? (
                                <button
                                  onClick={() => setSiswaFotoDibuka({ nama: b.student.nama, foto: b.sesi.fotoPengawasan || [], pelanggaran: b.sesi.pelanggaran || [] })}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: (b.sesi?.pelanggaran?.length || 0) > 0 ? '#dc2626' : '#9ca3af', fontWeight: 700, fontSize: 12.5, textDecoration: 'underline' }}
                                >
                                  {b.sesi?.pelanggaran?.length > 0 && <ShieldAlert size={12} />}
                                  {b.sesi?.pelanggaran?.length || 0}
                                </button>
                              ) : (
                                <span style={{ color: '#9ca3af' }}>0</span>
                              )}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              {selesai && (
                                <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                  <button
                                    onClick={() => setSiswaDetailDibuka(b)}
                                    title="Lihat semua jawaban siswa ini, persis kayak yang dia lihat"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, padding: '4px 8px', borderRadius: 6, border: '1px solid #c4b5fd', background: '#f5f3ff', cursor: 'pointer', color: '#6d28d9' }}
                                  >
                                    👁️ Jawaban
                                  </button>
                                  <button
                                    onClick={() => hitungUlangSatuSiswa(b)}
                                    disabled={sedangHitungUlang === idSiswa}
                                    title="Hitung ulang skor & XP pakai logika penilaian terbaru, tanpa siswa perlu ngerjain ulang"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', color: '#6b7280' }}
                                  >
                                    {sedangHitungUlang === idSiswa ? <Loader2 size={11} className="spin" /> : <RotateCcw size={11} />}
                                    Ulang
                                  </button>
                                  <button
                                    onClick={() => izinkanUlangSatuSiswa(b)}
                                    disabled={sedangIzinkanUlang === idSiswa}
                                    title="Hapus sesi lama, izinkan siswa ini mulai dari NOL lagi (dipakai kalau curiga jawabannya gak beneran kesimpen)"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, padding: '4px 8px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', cursor: 'pointer', color: '#b91c1c' }}
                                  >
                                    {sedangIzinkanUlang === idSiswa ? <Loader2 size={11} className="spin" /> : '🔁'}
                                    Ulang dari 0
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 🔥 BARU: modal galeri foto pengawasan -- foto acak yang diambil
          selama try out (lihat useDeteksiKecuranganTryOut.js), buat
          admin/wali kelas tinjau MANUAL kalau ada yang dicurigai --
          BUKAN diverifikasi AI otomatis (lihat catatan lengkap soal
          batasan ini di file hook-nya). */}
      {siswaFotoDibuka && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ background: 'white', borderRadius: 16, maxWidth: 640, width: '100%', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>🛡️ Detail Pelanggaran -- {siswaFotoDibuka.nama}</div>
              <button onClick={() => setSiswaFotoDibuka(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Tutup</button>
            </div>

            {/* Rincian JENIS pelanggaran, dikelompokkan -- ini yang bisa
                selalu ditampilkan walau fotonya kosong (mis. paket try
                out ini gak mewajibkan kamera, pelanggarannya cuma dari
                pindah tab/keluar fullscreen). */}
            {siswaFotoDibuka.pelanggaran.length === 0 ? (
              <div style={{ fontSize: 13, color: '#16a34a', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: 12, marginTop: 10 }}>
                ✅ Gak ada pelanggaran tercatat buat siswa ini.
              </div>
            ) : (
              <div style={{ marginTop: 10, marginBottom: 14 }}>
                {(() => {
                  const kelompok = {};
                  siswaFotoDibuka.pelanggaran.forEach((p) => { kelompok[p.type] = (kelompok[p.type] || 0) + 1; });
                  return Object.entries(kelompok).map(([type, jumlah]) => (
                    <div key={type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '6px 10px', background: '#fef2f2', borderRadius: 8, marginBottom: 4, color: '#7f1d1d' }}>
                      <span>{LABEL_PELANGGARAN[type] || type}</span>
                      <span style={{ fontWeight: 700 }}>{jumlah}x</span>
                    </div>
                  ));
                })()}
              </div>
            )}

            {/* Galeri foto -- CUMA muncul kalau ada fotonya. Kalau
                pelanggarannya dari pindah tab/fullscreen doang (bukan
                kamera), sengaja gak ada foto sama sekali -- itu wajar,
                bukan kesalahan. */}
            {siswaFotoDibuka.foto.length > 0 ? (
              <>
                <p style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 10 }}>
                  📷 Foto diambil ACAK selama pengerjaan (bukan tiap detik) -- ini bukti visual buat ditinjau MANUAL, bukan hasil verifikasi otomatis.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                  {siswaFotoDibuka.foto.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt={`Foto pengawasan ${i + 1}`} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>
                Gak ada foto pengawasan buat try out ini -- kemungkinan paketnya emang gak mewajibkan kamera saat diterbitkan.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔥 BARU: modal "Lihat Jawaban" -- persis tampilan yang dilihat
          siswa sendiri di layar hasilnya (RendererPgSederhana/PgKompleks/
          BenarSalah, mode tinjau), tapi bisa diakses admin TANPA perlu
          pinjam akun siswa. Termasuk tanda "Tidak dijawab" yang sama
          persis, biar gak salah kira soal yang di-skip sebagai bug. */}
      {siswaDetailDibuka && paketTerpilih && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '24px 16px', overflowY: 'auto' }}>
          <div style={{ background: 'white', borderRadius: 16, maxWidth: 720, width: '100%', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>👁️ Jawaban {siswaDetailDibuka.student.nama}</div>
              <button onClick={() => setSiswaDetailDibuka(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Tutup</button>
            </div>
            <p style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 16 }}>
              Skor {siswaDetailDibuka.sesi.totalSkorPersen}% · {siswaDetailDibuka.sesi.xpFinal} XP -- ini persis tampilan yang dilihat siswa di layar hasilnya sendiri.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {paketTerpilih.daftarSoal.map((s, i) => {
                const jwb = siswaDetailDibuka.sesi.jawaban?.[s.id];
                const skor = skorSatuSoal(s, jwb);
                const belumDijawab = soalBelumDijawab(s, jwb);
                return (
                  <div key={s.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14 }}>
                    <div style={{ fontSize: 11.5, color: skor >= 0.99 ? '#16a34a' : skor > 0 ? '#d97706' : '#dc2626', fontWeight: 700, marginBottom: 6 }}>
                      Soal {i + 1} -- skor {Math.round(skor * 100)}%{belumDijawab ? ' (Tidak dijawab)' : ''}
                    </div>
                    {s.bacaan?.teks && (
                      <div style={{ background: '#f8fafc', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 12.5, color: '#334155' }}><RenderMath text={s.bacaan.teks} /></div>
                    )}
                    <div style={{ fontSize: 13, color: '#1e293b', marginBottom: 10 }}><RenderMath text={s.soal || s.teks_soal} /></div>
                    <RendererSoalAdmin soal={s} jawabanTerpilih={jwb} modeTinjau />
                    {s.pembahasan && (
                      <div style={{ marginTop: 10, background: '#f5f3ff', borderRadius: 8, padding: 10, fontSize: 12, color: '#4c1d95' }}>
                        <b>💡 Pembahasan:</b> <RenderMath text={s.pembahasan} />
                      </div>
                    )}
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