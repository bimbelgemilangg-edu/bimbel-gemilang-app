// src/pages/admin/bank-soal/BatalkanUjiCobaPage.jsx
// ============================================================
// BATALKAN UJI COBA ADMIN -- jawaban buat kasus nyata: admin/owner
// login ke akun SISWA ASLI (bukan akun kosong khusus testing) buat
// nyoba fitur baru, terus mau balikin datanya biar gak nyampur sama
// riwayat belajar asli siswa itu.
//
// 🔒 KENAPA TIDAK "HAPUS SEMUA RIWAYAT SISWA INI" SAJA (lebih simpel):
// karena akunnya ASLI, siswa itu mungkin PUNYA riwayat belajar sungguhan
// dari hari-hari sebelumnya -- hapus semua bakal ikut menghapus riwayat
// asli itu juga, bukan cuma bagian yang dites admin. Makanya alat ini
// kerja berdasarkan WAKTU (cutoff): "sejak jam berapa kamu mulai tes",
// bukan "hapus semua".
//
// KETERBATASAN YANG JUJUR DIAKUI (baca sebelum pakai):
// - Soal yang DISENTUH SETELAH waktu cutoff bisa langsung dihapus PERSIS
//   (dikembalikan ke "belum pernah dikerjakan") -- ini akurat, karena
//   tiap soal punya catatan waktu terakhir diubah (updatedAt).
// - XP/streak/jatah harian TIDAK BISA otomatis dikembalikan presisi,
//   karena disimpan sebagai 1 angka gabungan (bukan riwayat perubahan).
//   Kalau kelihatan ikut berubah pas tes, alat ini kasih FORM MANUAL
//   buat admin ketik angka yang benar sendiri (lihat bagian bawah).
// - PALING AMAN: pakai alat ini SESEGERA MUNGKIN setelah selesai tes,
//   sebelum siswa aslinya sempat pakai akun itu lagi hari yang sama.
// ============================================================

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import {
  collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc, writeBatch, Timestamp,
} from 'firebase/firestore';
import { ArrowLeft, Search, AlertTriangle, Trash2, Loader2, ShieldAlert } from 'lucide-react';

function formatWaktu(ts) {
  if (!ts) return '-';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
}

// Default cutoff: 1 jam yang lalu, format buat <input type="datetime-local">
function defaultCutoffLocal() {
  const d = new Date(Date.now() - 60 * 60 * 1000);
  d.setSeconds(0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BatalkanUjiCobaPage() {
  const navigate = useNavigate();

  const [kataKunci, setKataKunci] = useState('');
  const [mencari, setMencari] = useState(false);
  const [hasilCari, setHasilCari] = useState([]);
  const [siswaDipilih, setSiswaDipilih] = useState(null);

  const [cutoffLocal, setCutoffLocal] = useState(defaultCutoffLocal());
  const [memuatPratinjau, setMemuatPratinjau] = useState(false);
  const [progresSiswa, setProgresSiswa] = useState(null); // dokumen siswa_progress apa adanya
  const [soalTerdampak, setSoalTerdampak] = useState(null); // null = belum dicek, [] = dicek & kosong

  const [formKoreksi, setFormKoreksi] = useState(null); // {xp, streak, soalHariIniCount, soalHariIniTanggal, lastActiveDate}
  const [sedangProses, setSedangProses] = useState(false);
  const [konfirmasiNama, setKonfirmasiNama] = useState('');

  const cariSiswa = useCallback(async () => {
    if (!kataKunci.trim()) return;
    setMencari(true);
    setSiswaDipilih(null);
    setSoalTerdampak(null);
    setProgresSiswa(null);
    try {
      // Cari 2 arah: cocok studentId persis, ATAU nama mengandung kata kunci
      // (Firestore tidak dukung "contains" native, jadi ambil semua lalu
      // filter di client -- oke buat jumlah siswa 1 bimbel, tidak untuk
      // skala ribuan).
      const snap = await getDocs(collection(db, 'students'));
      const kk = kataKunci.trim().toLowerCase();
      const hasil = snap.docs
        .map((d) => ({ docId: d.id, ...d.data() }))
        .filter((s) => (s.studentId || '').toLowerCase().includes(kk) || (s.nama || '').toLowerCase().includes(kk));
      setHasilCari(hasil.slice(0, 15));
    } catch (e) {
      console.error('Gagal cari siswa:', e);
      alert('Gagal mencari siswa.');
    }
    setMencari(false);
  }, [kataKunci]);

  const pilihSiswa = useCallback(async (siswa) => {
    setSiswaDipilih(siswa);
    setHasilCari([]);
    setSoalTerdampak(null);
    setFormKoreksi(null);
    setKonfirmasiNama('');
    try {
      const snap = await getDoc(doc(db, 'siswa_progress', siswa.studentId));
      setProgresSiswa(snap.exists() ? snap.data() : null);
    } catch (e) {
      console.error('Gagal ambil progres siswa:', e);
    }
  }, []);

  const cekDampak = useCallback(async () => {
    if (!siswaDipilih) return;
    setMemuatPratinjau(true);
    setSoalTerdampak(null);
    try {
      const cutoffMs = new Date(cutoffLocal).getTime();
      const snapProg = await getDocs(query(collection(db, 'siswa_soal_progress'), where('studentId', '==', siswaDipilih.studentId)));
      const semua = snapProg.docs.map((d) => ({ docId: d.id, ...d.data() }));

      // updatedAt itu Firestore Timestamp -- konversi ke ms buat dibandingkan.
      const terdampak = semua.filter((p) => {
        const t = p.updatedAt?.toMillis ? p.updatedAt.toMillis() : 0;
        return t >= cutoffMs;
      });
      setSoalTerdampak(terdampak);

      // Siapkan form koreksi manual, prefill dari nilai SEKARANG --
      // admin yang isi angka yang benar (sistem tidak tahu histori-nya).
      setFormKoreksi({
        xp: progresSiswa?.xp ?? 0,
        streak: progresSiswa?.streak ?? 0,
        soalHariIniCount: progresSiswa?.soalHariIniCount ?? 0,
        soalHariIniTanggal: progresSiswa?.soalHariIniTanggal ?? '',
        lastActiveDate: progresSiswa?.lastActiveDate ?? '',
      });
    } catch (e) {
      console.error('Gagal cek dampak:', e);
      alert('Gagal mengecek dampak. Coba lagi.');
    }
    setMemuatPratinjau(false);
  }, [siswaDipilih, cutoffLocal, progresSiswa]);

  const progresIkutTerdampak = (() => {
    if (!progresSiswa?.updatedAt) return false;
    const t = progresSiswa.updatedAt?.toMillis ? progresSiswa.updatedAt.toMillis() : 0;
    return t >= new Date(cutoffLocal).getTime();
  })();

  const hapusSoalTerdampak = useCallback(async () => {
    if (!siswaDipilih || !soalTerdampak || soalTerdampak.length === 0) return;
    if (konfirmasiNama.trim().toLowerCase() !== (siswaDipilih.nama || '').trim().toLowerCase()) {
      alert('Ketik ulang nama siswa persis buat konfirmasi -- ini aksi hapus permanen.');
      return;
    }
    setSedangProses(true);
    try {
      // writeBatch -- Firestore batas 500 operasi per batch, dipecah
      // kalau kebetulan lebih (jarang terjadi buat 1 sesi tes, tapi
      // dijaga biar aman).
      for (let i = 0; i < soalTerdampak.length; i += 400) {
        const batch = writeBatch(db);
        soalTerdampak.slice(i, i + 400).forEach((p) => {
          batch.delete(doc(db, 'siswa_soal_progress', p.docId));
        });
        await batch.commit();
      }
      alert(`${soalTerdampak.length} soal berhasil dikembalikan ke status "belum pernah dikerjakan".`);
      setSoalTerdampak([]);
    } catch (e) {
      console.error('Gagal menghapus soal terdampak:', e);
      alert('Gagal menghapus. Coba lagi.');
    }
    setSedangProses(false);
  }, [siswaDipilih, soalTerdampak, konfirmasiNama]);

  const simpanKoreksiManual = useCallback(async () => {
    if (!siswaDipilih || !formKoreksi) return;
    setSedangProses(true);
    try {
      await setDoc(doc(db, 'siswa_progress', siswaDipilih.studentId), {
        xp: Number(formKoreksi.xp) || 0,
        streak: Number(formKoreksi.streak) || 0,
        soalHariIniCount: Number(formKoreksi.soalHariIniCount) || 0,
        soalHariIniTanggal: formKoreksi.soalHariIniTanggal || null,
        lastActiveDate: formKoreksi.lastActiveDate || null,
      }, { merge: true });
      alert('Angka XP/streak/jatah harian berhasil dikoreksi.');
      const snap = await getDoc(doc(db, 'siswa_progress', siswaDipilih.studentId));
      setProgresSiswa(snap.exists() ? snap.data() : null);
    } catch (e) {
      console.error('Gagal simpan koreksi:', e);
      alert('Gagal menyimpan koreksi.');
    }
    setSedangProses(false);
  }, [siswaDipilih, formKoreksi]);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px', fontFamily: 'sans-serif' }}>
      <button onClick={() => navigate('/admin/bank-soal/aktivitas-latihan')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 16, fontSize: 13 }}>
        <ArrowLeft size={16} /> Kembali ke Aktivitas Latihan
      </button>

      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>
        <ShieldAlert size={24} color="#dc2626" /> Batalkan Uji Coba Admin
      </h1>
      <p style={{ color: '#6b7280', fontSize: 13, margin: '6px 0 20px' }}>
        Buat kasus: kamu login ke akun SISWA ASLI buat nyoba fitur Latihan Harian, terus mau balikin
        datanya biar gak nyampur sama riwayat belajar asli dia. Alat ini kerja berdasarkan <strong>waktu</strong>
        (bukan hapus semua), jadi riwayat belajar asli sebelum kamu mulai tes tetap aman.
      </p>

      {/* CARI SISWA */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          placeholder="Cari nama atau ID siswa..."
          value={kataKunci}
          onChange={(e) => setKataKunci(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && cariSiswa()}
          style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13 }}
        />
        <button onClick={cariSiswa} disabled={mencari} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 8, border: 'none', background: '#7c3aed', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          {mencari ? <Loader2 size={14} className="spin" /> : <Search size={14} />} Cari
        </button>
      </div>

      {hasilCari.length > 0 && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 20, overflow: 'hidden' }}>
          {hasilCari.map((s) => (
            <div
              key={s.docId}
              onClick={() => pilihSiswa(s)}
              style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: 13 }}
            >
              <strong>{s.nama}</strong> <span style={{ color: '#9ca3af' }}>({s.studentId}) · {s.kelasSekolah} · {s.jenjang}</span>
            </div>
          ))}
        </div>
      )}

      {siswaDipilih && (
        <div style={{ border: '2px solid #7c3aed', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#1e293b', marginBottom: 2 }}>{siswaDipilih.nama}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>{siswaDipilih.studentId} · {siswaDipilih.kelasSekolah} · {siswaDipilih.jenjang}</div>

          <div style={{ display: 'flex', gap: 16, fontSize: 12.5, color: '#475569', marginBottom: 16, flexWrap: 'wrap' }}>
            <span>XP sekarang: <strong>{progresSiswa?.xp ?? 0}</strong></span>
            <span>Streak sekarang: <strong>{progresSiswa?.streak ?? 0}</strong></span>
            <span>Terakhir aktif: <strong>{progresSiswa?.lastActiveDate ?? '-'}</strong></span>
            <span>Terakhir diubah: <strong>{formatWaktu(progresSiswa?.updatedAt)}</strong></span>
          </div>

          {/* PILIH WAKTU CUTOFF */}
          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>
            Sejak jam berapa kamu mulai tes? (semua perubahan SETELAH ini akan dianggap bagian dari uji coba)
          </label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="datetime-local"
              value={cutoffLocal}
              onChange={(e) => setCutoffLocal(e.target.value)}
              style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13 }}
            />
            <button onClick={cekDampak} disabled={memuatPratinjau} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #7c3aed', background: '#f5f3ff', color: '#6d28d9', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
              {memuatPratinjau ? 'Mengecek...' : 'Cek Dampak'}
            </button>
          </div>

          {/* HASIL PRATINJAU: SOAL TERDAMPAK */}
          {soalTerdampak !== null && (
            <div style={{ marginBottom: 16 }}>
              {soalTerdampak.length === 0 ? (
                <div style={{ fontSize: 12.5, color: '#16a34a', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 10 }}>
                  Tidak ada soal yang tersentuh setelah waktu itu.
                </div>
              ) : (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: '#b91c1c', marginBottom: 8 }}>
                    <AlertTriangle size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
                    {soalTerdampak.length} soal tersentuh setelah waktu itu -- akan dikembalikan ke "belum pernah dikerjakan"
                  </div>
                  <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                    {soalTerdampak.map((p) => (
                      <div key={p.docId} style={{ fontSize: 11, color: '#7f1d1d', background: 'white', borderRadius: 6, padding: '5px 8px' }}>
                        Soal ID {p.soalId} · kotak {p.kotak} · diubah {formatWaktu(p.updatedAt)}
                      </div>
                    ))}
                  </div>
                  <input
                    placeholder={`Ketik "${siswaDipilih.nama}" buat konfirmasi hapus`}
                    value={konfirmasiNama}
                    onChange={(e) => setKonfirmasiNama(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #fca5a5', fontSize: 12.5, marginBottom: 8, boxSizing: 'border-box' }}
                  />
                  <button
                    onClick={hapusSoalTerdampak}
                    disabled={sedangProses || konfirmasiNama.trim().toLowerCase() !== (siswaDipilih.nama || '').trim().toLowerCase()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: 'none',
                      background: '#dc2626', color: 'white', fontWeight: 700, fontSize: 12.5,
                      cursor: 'pointer', opacity: konfirmasiNama.trim().toLowerCase() === (siswaDipilih.nama || '').trim().toLowerCase() ? 1 : 0.4,
                    }}
                  >
                    <Trash2 size={14} /> {sedangProses ? 'Menghapus...' : `Hapus ${soalTerdampak.length} Soal Ini`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* KOREKSI MANUAL XP/STREAK/JATAH -- muncul kalau progres ikut kesentuh */}
          {soalTerdampak !== null && progresIkutTerdampak && formKoreksi && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#92400e', marginBottom: 6 }}>
                ⚠️ XP/streak/jatah harian siswa ini ikut berubah setelah waktu itu.
              </div>
              <p style={{ fontSize: 11.5, color: '#78350f', marginBottom: 10, lineHeight: 1.6 }}>
                Sistem tidak menyimpan riwayat angka sebelumnya, jadi tidak bisa otomatis dikembalikan.
                Kalau kamu tahu/ingat angka yang benar SEBELUM kamu mulai tes, ketik di sini lalu simpan.
                Kalau tidak yakin, aman dibiarkan seperti apa adanya (biarnya jadi &quot;maaf, XP kamu sempat naik dikit&quot; -- bukan salah data, cuma keliru sedikit).
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: '#78350f' }}>
                  XP
                  <input type="number" value={formKoreksi.xp} onChange={(e) => setFormKoreksi((f) => ({ ...f, xp: e.target.value }))} style={{ width: '100%', padding: '7px 9px', borderRadius: 6, border: '1px solid #fde68a', fontSize: 12.5, marginTop: 2, boxSizing: 'border-box' }} />
                </label>
                <label style={{ fontSize: 11, color: '#78350f' }}>
                  Streak
                  <input type="number" value={formKoreksi.streak} onChange={(e) => setFormKoreksi((f) => ({ ...f, streak: e.target.value }))} style={{ width: '100%', padding: '7px 9px', borderRadius: 6, border: '1px solid #fde68a', fontSize: 12.5, marginTop: 2, boxSizing: 'border-box' }} />
                </label>
                <label style={{ fontSize: 11, color: '#78350f' }}>
                  Jumlah soal jatah hari ini
                  <input type="number" value={formKoreksi.soalHariIniCount} onChange={(e) => setFormKoreksi((f) => ({ ...f, soalHariIniCount: e.target.value }))} style={{ width: '100%', padding: '7px 9px', borderRadius: 6, border: '1px solid #fde68a', fontSize: 12.5, marginTop: 2, boxSizing: 'border-box' }} />
                </label>
                <label style={{ fontSize: 11, color: '#78350f' }}>
                  Tanggal terakhir aktif (YYYY-MM-DD)
                  <input type="text" value={formKoreksi.lastActiveDate || ''} onChange={(e) => setFormKoreksi((f) => ({ ...f, lastActiveDate: e.target.value }))} style={{ width: '100%', padding: '7px 9px', borderRadius: 6, border: '1px solid #fde68a', fontSize: 12.5, marginTop: 2, boxSizing: 'border-box' }} />
                </label>
              </div>
              <button
                onClick={simpanKoreksiManual}
                disabled={sedangProses}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#f59e0b', color: 'white', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
              >
                {sedangProses ? 'Menyimpan...' : 'Simpan Koreksi'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}