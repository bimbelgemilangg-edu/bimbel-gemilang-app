// src/pages/student/LeaderboardPage.jsx
// ============================================================
// LEADERBOARD -- DIROMBAK TOTAL (bukan cuma tempel-tempel) biar
// tampilannya kayak dashboard belajar modern: header gradient, podium
// 3 besar dengan avatar bulat, badge medali berwarna, sisanya list
// rapi. Logika datanya TIDAK BERUBAH SAMA SEKALI dari versi sebelumnya
// (masih rangking berdasarkan XP MINGGUAN per KELAS) -- yang dirombak
// murni tampilannya.
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { ArrowLeft, Trophy, Flame } from 'lucide-react';
import { kunciMingguIni } from '../../utils/mingguIni';

// Avatar bulat berisi inisial nama, warnanya konsisten per nama (hash
// sederhana) -- biar tiap siswa punya "identitas visual" walau kita
// gak punya foto beneran.
const PALET_AVATAR = [
  { bg: '#fce7f3', text: '#9d174d' }, { bg: '#dbeafe', text: '#1e40af' },
  { bg: '#dcfce7', text: '#166534' }, { bg: '#fef3c7', text: '#92400e' },
  { bg: '#ede9fe', text: '#5b21b6' }, { bg: '#ffedd5', text: '#9a3412' },
  { bg: '#cffafe', text: '#155e75' }, { bg: '#fee2e2', text: '#991b1b' },
];
function warnaAvatar(nama) {
  let hash = 0;
  for (let i = 0; i < (nama || '').length; i++) hash = (hash * 31 + nama.charCodeAt(i)) | 0;
  return PALET_AVATAR[Math.abs(hash) % PALET_AVATAR.length];
}
function inisial(nama) {
  const kata = (nama || '?').trim().split(/\s+/);
  return ((kata[0]?.[0] || '') + (kata[1]?.[0] || '')).toUpperCase() || '?';
}

function Avatar({ nama, size = 44, cincin, fotoUrl }) {
  const w = warnaAvatar(nama);
  const gayaBungkus = {
    width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
    boxShadow: cincin ? `0 0 0 3px white, 0 0 0 5px ${cincin}` : 'none',
  };
  // 🔥 BARU (koreksi): pakai fotoUrl ASLI siswa (dari fitur Kartu
  // Identitas Siswa di admin) kalau ada -- fallback ke inisial
  // berwarna cuma buat siswa yang belum punya foto tersimpan.
  if (fotoUrl) {
    return (
      <div style={gayaBungkus}>
        <img src={fotoUrl} alt={nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }
  return (
    <div style={{
      ...gayaBungkus, background: w.bg, color: w.text,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
      fontSize: size * 0.36,
    }}>
      {inisial(nama)}
    </div>
  );
}

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const studentId = localStorage.getItem('studentId');

  const [loading, setLoading] = useState(true);
  const [daftar, setDaftar] = useState([]);
  const [kelasSiswa, setKelasSiswa] = useState(null);
  const [ligaSekarang, setLigaSekarang] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const snapSaya = await getDocs(query(collection(db, 'students'), where('studentId', '==', studentId)));
        const dataSaya = snapSaya.docs[0]?.data();
        const kelas = dataSaya?.kelasSekolah;
        setKelasSiswa(kelas);
        if (!kelas) { setLoading(false); return; }

        const snapSekelas = await getDocs(query(collection(db, 'students'), where('kelasSekolah', '==', kelas)));
        const siswaSekelas = snapSekelas.docs.map((d) => ({ id: d.id, ...d.data() }));

        const snapProgres = await getDocs(collection(db, 'siswa_progress'));
        const progresMap = {};
        snapProgres.forEach((d) => { progresMap[d.id] = d.data(); });

        const kunciMinggu = kunciMingguIni();

        // ============================================================
        // 🔥 BARU: SISTEM LIGA -- bagi siswa 1 kelas jadi kelompok kecil
        // (~10 orang), biar semua orang punya lawan yang levelnya
        // deket, bukan cuma dibandingin sama 1-2 anak paling jago di
        // kelas. Naik/turun liga OTOMATIS tiap minggu -- TANPA server
        // terjadwal, pakai pola yang SAMA PERSIS kayak reset XP
        // mingguan yang sudah lama jalan aman (tambahXpMingguan di atas):
        // tiap siswa CUMA ngecek & update DOKUMENNYA SENDIRI pas dia
        // buka halaman ini, gak pernah baca/tulis dokumen siswa lain --
        // jadi nol resiko tabrakan walau banyak siswa buka bebarengan.
        //
        // Cara kerja naik/turun: posisi TERAKHIR siswa itu sendiri di
        // liga LAMA-nya (yang sudah kesimpen dari kunjungan terakhirnya
        // minggu lalu) dibandingkan ke ukuran liga itu -- masuk 3 besar
        // -> naik 1 liga, masuk 3 terbawah -> turun 1 liga, di tengah
        // -> tetap. Ini baru diproses SEKALI per siswa per minggu (pas
        // dia pertama kali buka Leaderboard di minggu itu).
        // ============================================================
        const progresSaya = progresMap[studentId] || {};
        let ligaSaya = progresSaya.liga || 1; // semua siswa mulai dari liga 1

        const sudahMingguBaruBuatLiga = progresSaya.ligaMingguKunci !== kunciMinggu;
        if (sudahMingguBaruBuatLiga && progresSaya.posisiLeaderboardSebelumnya != null && progresSaya.ukuranLigaSebelumnya) {
          const posisi = progresSaya.posisiLeaderboardSebelumnya; // 0-based
          const ukuran = progresSaya.ukuranLigaSebelumnya;
          if (posisi <= 2) ligaSaya = Math.max(1, ligaSaya - 1); // 3 besar -> naik liga (liga 1 = liga tertinggi, gak bisa naik lagi)
          else if (posisi >= ukuran - 3) ligaSaya = ligaSaya + 1; // 3 terbawah -> turun liga
          // di tengah -> ligaSaya tetap
        }

        const siswaSeliga = siswaSekelas.filter((s) => {
          if (s.studentId === studentId) return true; // diri sendiri selalu ikut, apapun liga tersimpannya
          const ligaOrang = progresMap[s.studentId]?.liga || 1;
          return ligaOrang === ligaSaya;
        });

        const hasil = siswaSeliga.map((s) => {
          const prog = progresMap[s.studentId] || {};
          const xpMingguIni = prog.xpMingguIniKunci === kunciMinggu ? (prog.xpMingguIni || 0) : 0;
          return {
            nama: s.nama, studentId: s.studentId, xpMingguIni, streak: prog.streak || 0,
            // 🔥 BARU (koreksi): fotoUrl TERNYATA udah ada dari fitur
            // "Kartu Identitas Siswa" di EditStudent.jsx admin -- salah
            // aku bilang sebelumnya "belum ada infrastruktur foto".
            // Tinggal dipakai di sini, gak perlu bangun sistem upload baru.
            fotoUrl: s.fotoUrl || null,
            posisiSebelumnya: prog.posisiLeaderboardSebelumnya ?? null,
          };
        });

        hasil.sort((a, b) => b.xpMingguIni - a.xpMingguIni);
        setDaftar(hasil);
        setLigaSekarang(ligaSaya);

        // Simpan posisi SEKARANG + liga + ukuran liga ke dokumen SENDIRI
        // (gak pernah nulis ke dokumen siswa lain) -- ini yang dipakai
        // buat 2 hal: (1) bandingin naik/turun posisi di kunjungan
        // berikutnya, (2) nentuin naik/turun LIGA pas minggu baru mulai.
        const posisiSayaSekarang = hasil.findIndex((d) => d.studentId === studentId);
        if (posisiSayaSekarang >= 0) {
          setDoc(doc(db, 'siswa_progress', studentId), {
            posisiLeaderboardSebelumnya: posisiSayaSekarang,
            ukuranLigaSebelumnya: hasil.length,
            liga: ligaSaya,
            ligaMingguKunci: kunciMinggu,
          }, { merge: true }).catch(() => {});
        }
      } catch (e) {
        console.error('Gagal muat leaderboard:', e);
      }
      setLoading(false);
    })();
  }, [studentId]);

  const posisiSaya = daftar.findIndex((d) => d.studentId === studentId);
  const top3 = daftar.slice(0, 3);
  const sisanya = daftar.slice(3);
  const WARNA_PODIUM = ['#fbbf24', '#cbd5e1', '#d97706']; // emas, perak, perunggu

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f8fafc', paddingBottom: 32 }}>
      {/* ---------------- HEADER GRADIENT ---------------- */}
      <div style={{
        background: 'linear-gradient(160deg, #0d9488 0%, #134e4a 100%)',
        borderRadius: '0 0 28px 28px', padding: '18px 20px 28px', color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        {/* Bintik dekoratif -- biar gak polos kayak sebelumnya */}
        <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <button onClick={() => navigate('/siswa/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 999, padding: '6px 12px', color: 'white', cursor: 'pointer', fontSize: 12.5, marginBottom: 14 }}>
          <ArrowLeft size={14} /> Kembali
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>🏆 Leaderboard</h1>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', margin: '4px 0 0' }}>
              Kelas {kelasSiswa || '-'} {ligaSekarang && <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 999, marginLeft: 6, fontSize: 11 }}>🏅 Liga {ligaSekarang}</span>}
            </p>
          </div>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: 4, fontSize: 11.5, fontWeight: 700 }}>
            <div style={{ background: 'white', color: '#0d9488', borderRadius: 999, padding: '6px 14px' }}>Mingguan</div>
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 10 }}>Reset tiap hari Senin -- semua mulai dari 0 lagi, adil buat yang baru gabung.</p>
      </div>

      <div style={{ padding: '0 16px', marginTop: -14 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 40 }}>Memuat...</div>
        ) : !kelasSiswa ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 30, background: 'white', border: '1px dashed #e2e8f0', borderRadius: 16, marginTop: 20 }}>
            Data kelasmu belum lengkap -- hubungi admin ya.
          </div>
        ) : daftar.every((d) => d.xpMingguIni === 0) ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: 30, background: 'white', border: '1px dashed #e2e8f0', borderRadius: 16, marginTop: 20 }}>
            Belum ada yang latihan minggu ini. Jadilah yang pertama! 🚀
          </div>
        ) : (
          <>
            {/* ---------------- PODIUM 3 BESAR ---------------- */}
            {top3.length > 0 && (
              <div style={{ background: 'white', borderRadius: 20, padding: '20px 14px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8 }}>
                  {/* Urutan tampil: 2 - 1 - 3, biar juara 1 di tengah & lebih tinggi (gaya podium) */}
                  {[top3[1], top3[0], top3[2]].map((d, urutanTampil) => {
                    if (!d) return <div key={urutanTampil} style={{ flex: 1 }} />;
                    const posisiAsli = top3.indexOf(d); // 0,1,2
                    const tinggi = posisiAsli === 0 ? 92 : posisiAsli === 1 ? 66 : 50;
                    const sayaSendiri = d.studentId === studentId;
                    return (
                      <div key={d.studentId} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Avatar nama={d.nama} fotoUrl={d.fotoUrl} size={posisiAsli === 0 ? 56 : 44} cincin={sayaSendiri ? '#7c3aed' : WARNA_PODIUM[posisiAsli]} />
                        <div style={{ fontSize: posisiAsli === 0 ? 12.5 : 11, fontWeight: 700, color: '#1e293b', marginTop: 6, textAlign: 'center', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.nama.split(' ')[0]}
                        </div>
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#0d9488' }}>{d.xpMingguIni} XP</div>
                        <div style={{
                          width: '100%', height: tinggi, marginTop: 8, borderRadius: '12px 12px 0 0',
                          background: `linear-gradient(180deg, ${WARNA_PODIUM[posisiAsli]}33, ${WARNA_PODIUM[posisiAsli]}11)`,
                          border: `1px solid ${WARNA_PODIUM[posisiAsli]}55`, borderBottom: 'none',
                          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 6,
                        }}>
                          <span style={{ fontSize: 18, fontWeight: 900, color: WARNA_PODIUM[posisiAsli] }}>{posisiAsli + 1}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------------- SISANYA (peringkat 4+) ---------------- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sisanya.map((d, i) => {
                const peringkat = i + 4;
                const sayaSendiri = d.studentId === studentId;
                // 🔥 BARU: bandingin posisi SEKARANG (peringkat-1, index
                // 0-based) vs posisi tersimpan dari kunjungan
                // sebelumnya. Angka index lebih KECIL = peringkat lebih
                // BAGUS, jadi "naik" kalau posisi sekarang < posisi lama.
                const posisiSekarang = peringkat - 1;
                const delta = d.posisiSebelumnya !== null ? d.posisiSebelumnya - posisiSekarang : null;
                return (
                  <div
                    key={d.studentId}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 16,
                      background: sayaSendiri ? '#f0fdfa' : 'white',
                      border: sayaSendiri ? '2px solid #0d9488' : '1px solid #f1f5f9',
                    }}
                  >
                    <div style={{ width: 22, textAlign: 'center', fontSize: 13, fontWeight: 800, color: '#94a3b8' }}>{peringkat}</div>
                    <Avatar nama={d.nama} fotoUrl={d.fotoUrl} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.nama} {sayaSendiri && <span style={{ color: '#0d9488' }}>(Kamu)</span>}
                      </div>
                      {d.streak > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, color: '#d97706' }}>
                          <Flame size={10} /> {d.streak} hari beruntun
                        </div>
                      )}
                    </div>
                    {/* 🔥 BARU: panah naik/turun -- dibanding kunjungan
                        TERAKHIR (bukan "Senin lalu" persis, jujur soal
                        batasan ini). Kosong (–) kalau belum pernah ada
                        data kunjungan sebelumnya buat siswa ini. */}
                    {delta !== null && delta !== 0 && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: delta > 0 ? '#16a34a' : '#dc2626' }}>
                        {delta > 0 ? `▲${delta}` : `▼${Math.abs(delta)}`}
                      </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 800, color: '#0d9488', fontSize: 13, background: '#f0fdfa', padding: '4px 10px', borderRadius: 999 }}>
                      <Trophy size={12} /> {d.xpMingguIni}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ---------------- BAR POSISI SAYA (kalau di luar top 3) ---------------- */}
      {!loading && posisiSaya >= 3 && (
        <div style={{
          position: 'sticky', bottom: 12, marginTop: 16, marginLeft: 16, marginRight: 16,
          background: '#134e4a', borderRadius: 16, padding: '10px 16px', color: 'white',
          display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
        }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>Posisimu:</span>
          <span style={{ fontSize: 15, fontWeight: 800 }}>#{posisiSaya + 1}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12.5, opacity: 0.85 }}>{daftar[posisiSaya]?.xpMingguIni} XP</span>
        </div>
      )}
    </div>
  );
}