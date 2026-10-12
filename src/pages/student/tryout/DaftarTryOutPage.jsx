// src/pages/student/tryout/DaftarTryOutPage.jsx
// ============================================================
// Daftar try out yang tersedia buat siswa ini (dari tryout_paket,
// difilter targetKelas/targetKategori) + status pengerjaannya (belum
// mulai / sedang berjalan / sudah selesai + skor).
//
// 🔥 ROMBAK TOTAL TAMPILAN (2026-10-12, arahan owner): daftar lama
// menampilkan semua paket sebagai kartu sederajat, sehingga siswa tidak
// tahu MANA YANG WAJIB DIKERJAKAN SEKARANG -- keluhan owner: "membingungkan
// ... siswa sudah tidak peduli, memang harus jelas mana yang harus
// dikerjakan". Rujukan desain: aplikasi belajar profesional (satu aksi
// utama yang tidak bisa salah pilih, sisanya arsip).
//
// Struktur baru:
//   1. SATU kartu aksi utama ("Sabtu ini / lanjutanmu / kesempatan telat")
//      dipilih dengan prioritas: berjalan > belum&terbuka > izin ulang;
//   2. jalur JUJUR untuk yang telat: paket lewat deadline tanpa izin tidak
//      dibuka paksa -- siswa diarahkan minta PAKET SUSULAN ke tentor
//      (kebijakan anti-bocor REKAM-PAKET-&-DESAIN-MOTIVASI.md bagian 2);
//   3. riwayat ringkas ber-skor dengan pintu "belajar kembali" (review),
//      sengaja lebih tenang secara visual daripada aksi utama.
//
// LOGIKA MUAT & KUNCI TIDAK BERUBAH (sudah benar & teruji:
// cocokkanTargetPaket, useSegarSaatTerlihat, kunci hanya untuk MULAI BARU).
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ArrowLeft, Target, CheckCircle2, Flame, History, GraduationCap } from 'lucide-react';
import { useSegarSaatTerlihat } from '../../../utils/useSegarSaatTerlihat';
// 🔥 BARU (audit 2026-10-10): pencocokan target dipindah ke util bersama.
// Sebelumnya halaman ini membandingkan `p.targetKelas === 'Semua'`, padahal
// mesinTryOutOtomatis MENULIS field itu sebagai ARRAY (['Semua']) sementara
// rakitTryOutTentor & TerbitkanTryOutPage menulisnya sebagai STRING.
// ['Semua'] === 'Semua' bernilai false -- jadi paket dari Jadwal Try Out
// Otomatis bisa tidak pernah muncul ke siswa, tanpa error dan tanpa jejak.
// Lihat kepala utils/cocokkanTargetPaket.js dan
// tests/cocokkanTargetPaket.test.mjs.
import { cocokkanTargetPaket } from '../../../utils/cocokkanTargetPaket';
import { kodePaketTampil } from '../../../utils/kodePaket';

const fmt = (t) => new Date(t).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function DaftarTryOutPage() {
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId');

  const [loading, setLoading] = useState(true);
  const [daftar, setDaftar] = useState([]);

  // 🔥 BARU (Tahap 1 peta sinkronisasi): try out yang BARU diterbitkan
  // admin harus muncul tanpa siswa perlu reload -- ini keluhan yang
  // paling sering terdengar saat pengumuman try out. Ambil ulang saat
  // aplikasi kembali terlihat. Lihat useSegarSaatTerlihat.
  const versiSegar = useSegarSaatTerlihat();

  useEffect(() => {
    (async () => {
      try {
        const snapSiswa = await getDocs(query(collection(db, 'students'), where('studentId', '==', studentId)));
        const siswa = snapSiswa.docs[0]?.data();

        const snapPaket = await getDocs(query(collection(db, 'tryout_paket'), where('status', '==', 'aktif')));
        let paketList = snapPaket.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Filter target kelas/kategori -- 'Semua' selalu lolos.
        // Lewat cocokkanTargetPaket() supaya toleran terhadap kedua bentuk
        // data (array & string) yang sudah terlanjur ada di Firestore.
        paketList = paketList.filter((p) => cocokkanTargetPaket(p, siswa).cocok);

        const snapSesi = await getDocs(query(collection(db, 'tryout_sesi'), where('studentId', '==', studentId)));
        const sesiPerPaket = {};
        snapSesi.forEach((d) => { sesiPerPaket[d.data().paketId] = d.data(); });

        // 🔥 BARU: "Izin Ulang Khusus" -- admin bisa kasih siswa TERTENTU
        // izin ngerjain lagi walau deadline PAKET-nya udah lewat, tanpa
        // buka deadline itu buat semua siswa lain.
        const snapIzin = await getDocs(query(collection(db, 'tryout_izin_ulang'), where('studentId', '==', studentId)));
        const izinPerPaket = {};
        snapIzin.forEach((d) => { izinPerPaket[d.data().paketId] = d.data(); });

        setDaftar(paketList.map((p) => ({ ...p, sesi: sesiPerPaket[p.id] || null, izinUlang: izinPerPaket[p.id] || null })));
      } catch (e) {
        console.error('Gagal memuat daftar try out:', e);
      }
      setLoading(false);
    })();
  }, [studentId, versiSegar]);

  // ---- satu sumber kebenaran status per paket (dipakai semua seksi) ----
  const sekarang = new Date();
  const berInfo = daftar.map((p) => {
    const status = p.sesi?.status === 'selesai' ? 'selesai' : p.sesi?.status === 'berjalan' ? 'berjalan' : 'belum';
    // 🔥 kunci hanya untuk MULAI BARU: siswa yang sudah mulai tetap boleh
    // lanjut/lihat hasil walau deadline lewat (perilaku lama dipertahankan).
    const belumDibuka = status === 'belum' && p.waktuBuka && sekarang < new Date(p.waktuBuka);
    const izinBerlaku = Boolean(p.izinUlang) && sekarang < new Date(p.izinUlang.waktuBerlakuSampai);
    const lewatDeadline = status === 'belum' && p.waktuTutup && sekarang > new Date(p.waktuTutup) && !izinBerlaku;
    return { p, status, terkunci: belumDibuka || lewatDeadline, belumDibuka, izinBerlaku, lewatDeadline };
  });

  const utama = berInfo.find((x) => x.status === 'berjalan')
    || berInfo.find((x) => x.status === 'belum' && !x.terkunci)
    || berInfo.find((x) => x.izinBerlaku && x.status !== 'selesai')
    || null;
  const telat = berInfo.filter((x) => x.lewatDeadline);
  const riwayat = berInfo.filter((x) => x.status === 'selesai');
  const akanDatang = berInfo.filter((x) => x.belumDibuka);

  const metaPaket = (p) => `${p.totalSoal} soal · ${p.modeTimer === 'total' ? `${p.durasiTotalMenit} menit` : `${p.subtes?.length || 0} subtes`}`;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 16 }}>
      <button onClick={() => navigate('/siswa/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>
        <ArrowLeft size={16} /> Kembali
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, fontWeight: 800, color: '#1e293b', margin: 0 }}>
          <Target size={22} color="#7c3aed" /> Try Out
        </h1>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 800 }}>
          <Flame size={13} /> Sabtu = hari try out
        </span>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', fontSize: 13 }}>Memuat...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ============ 1. SATU AKSI UTAMA ============ */}
          {utama ? (
            <div style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 100%)', borderRadius: 20, padding: 20, color: '#fff', boxShadow: '0 10px 30px rgba(79,70,229,0.35)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#ddd6fe', marginBottom: 6 }}>
                {utama.status === 'berjalan' ? '⏳ lanjutanmu menunggu' : utama.izinBerlaku ? '🎟️ kesempatan kedua untukmu' : '🎯 wajib minggu ini'}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{utama.p.judul}</div>
              <div style={{ fontSize: 12, color: '#e0e7ff', marginBottom: 4 }}>
                {metaPaket(utama.p)} · kode {kodePaketTampil(utama.p)}
              </div>
              {utama.p.waktuTutup && (
                <div style={{ fontSize: 11.5, color: '#fde68a', marginBottom: 12 }}>
                  ⏰ ditutup {fmt(utama.p.waktuTutup)} — kerjakan sebelum lewat
                </div>
              )}
              <button
                onClick={() => navigate(`/siswa/tryout/${utama.p.id}`)}
                style={{ width: '100%', padding: '13px 16px', borderRadius: 14, border: 'none', background: '#fff', color: '#4f46e5', fontSize: 15, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 0 rgba(0,0,0,0.18)' }}
              >
                {utama.status === 'berjalan' ? 'LANJUTKAN SEKARANG' : utama.izinBerlaku ? 'PAKAI KESEMPATAN KEDUA' : 'MULAI TRY OUT'}
              </button>
              <div style={{ fontSize: 10.5, color: '#c7d2fe', marginTop: 8, textAlign: 'center' }}>
                Satu-satunya tombol yang perlu kamu tekan minggu ini.
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 28, color: '#64748b', fontSize: 13, border: '1px dashed #e2e8f0', borderRadius: 16, background: '#fff' }}>
              <GraduationCap size={26} color="#a78bfa" style={{ marginBottom: 6 }} />
              <div>Tidak ada try out yang wajib dikerjakan sekarang.</div>
              <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>Paket Sabtu berikutnya akan muncul otomatis di sini.</div>
            </div>
          )}

          {/* ============ 2. AKAN DATANG ============ */}
          {akanDatang.length > 0 && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '10px 14px', fontSize: 12, color: '#92400e' }}>
              🔓 Akan dibuka: {akanDatang.map((x) => `${x.p.judul} (${fmt(x.p.waktuBuka)})`).join(' · ')}
            </div>
          )}

          {/* ============ 3. TELAT: jalur jujur, bukan paksa buka ============ */}
          {telat.length > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#991b1b', marginBottom: 6 }}>😅 Kamu terlewat Sabtu lalu?</div>
              {telat.map((x) => (
                <div key={x.p.id} style={{ fontSize: 12, color: '#7f1d1d', marginBottom: 4 }}>
                  <b>{x.p.judul}</b> ditutup {fmt(x.p.waktuTutup)}.
                </div>
              ))}
              <div style={{ fontSize: 11.5, color: '#991b1b', lineHeight: 1.6 }}>
                Paket yang masih hidup tidak bisa dibuka ulang (adik kelasmu masih akan mengerjakannya).
                Chat tentormu dan minta <b>paket susulan</b> — soal setara, kode paket baru, dan pembahasannya
                bisa kamu pelajari setelah selesai.
              </div>
            </div>
          )}

          {/* ============ 4. RIWAYAT & BELAJAR KEMBALI ============ */}
          {riwayat.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: '#475569', margin: '4px 0 8px' }}>
                <History size={14} /> Riwayat & belajar kembali
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {riwayat.map((x) => (
                  <button
                    key={x.p.id}
                    onClick={() => navigate(`/siswa/tryout/${x.p.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ fontSize: 20 }}>🏁</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{x.p.judul}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {kodePaketTampil(x.p)} · {metaPaket(x.p)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 800, color: '#16a34a', justifyContent: 'flex-end' }}>
                        <CheckCircle2 size={14} /> {x.p.sesi?.totalSkorPersen}%
                      </div>
                      <div style={{ fontSize: 10.5, color: '#7c3aed', fontWeight: 700 }}>belajar kembali →</div>
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 6 }}>
                Membuka riwayat menampilkan tinjauan: soal yang salah memuat pembahasan terbuka dan daftar nomor yang bisa kamu salin untuk dibahas tentor.
              </div>
            </div>
          )}

          {!utama && riwayat.length === 0 && telat.length === 0 && akanDatang.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13, border: '1px dashed #e2e8f0', borderRadius: 12 }}>
              Belum ada try out yang tersedia buat kamu saat ini.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
