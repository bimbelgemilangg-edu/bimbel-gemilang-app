// src/pages/admin/bank-soal/AuditMateriPage.jsx
// ============================================================
// AUDIT MATERI (Admin) -- LAPORAN SAJA, TIDAK MENGUBAH APA PUN
// ============================================================
// Tujuan SATU-SATUNYA halaman ini: kasih gambaran SEBERAPA BERANTAKAN
// field `materi` di Bank Soal sekarang -- berapa banyak nilai materi
// UNIK per Mapel > Jenjang > Kelas, dan berapa soal di tiap nilai itu.
// Ini murni BACA data (getDocs doang, gak ada write/update/delete sama
// sekali) -- jadi 100% aman dijalankan kapan saja, gak menyentuh
// akses siswa atau data try out yang sudah terbit.
//
// Alurnya: admin buka halaman ini -> klik "Muat & Analisis" -> hasil
// tampil di layar + tombol "Download Excel" -> file itu diupload ke
// Claude buat dianalisis lebih lanjut & disusun jadi taksonomi materi
// baku per kelas (rak buku rapi sesuai kurikulum).
//
// 🔥 CATATAN: ini SENGAJA halaman terpisah & sementara (bukan bagian
// permanen dari alur kerja admin sehari-hari) -- begitu taksonomi
// materi baku sudah jadi dan alat pemetaannya sudah dibangun, halaman
// audit ini boleh dibuang atau disimpan sebagai alat cek berkala.
// ============================================================

import React, { useState, useCallback } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { ClipboardList, Loader2, Download, AlertTriangle } from 'lucide-react';

export default function AuditMateriPage() {
  const [isMobile] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(false);
  const [sudahMuat, setSudahMuat] = useState(false);
  const [totalSoal, setTotalSoal] = useState(0);
  // daftarDetail: [{ mapel, jenjang, kelas, materi, jumlah }]
  const [daftarDetail, setDaftarDetail] = useState([]);
  // ringkasanKelompok: [{ mapel, jenjang, kelas, jumlahSoal, jumlahMateriUnik }]
  const [ringkasanKelompok, setRingkasanKelompok] = useState([]);

  const muatDanAnalisis = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'bank_soal'));
      const semuaSoal = snap.docs.map((d) => d.data()).filter((s) => s.status !== 'nonaktif' && s.status !== 'dihapus');

      // Map kunci "mapel|jenjang|kelas|materi" -> jumlah soal
      const petaDetail = new Map();
      semuaSoal.forEach((s) => {
        const mapel = s.mataPelajaran || '(kosong)';
        const jenjang = s.jenjang || '(kosong)';
        const kelas = s.tingkatKelas || 'Semua';
        const materi = (s.materi || '').trim() || '(kosong)';
        const kunci = `${mapel}|||${jenjang}|||${kelas}|||${materi}`;
        petaDetail.set(kunci, (petaDetail.get(kunci) || 0) + 1);
      });

      const detail = [...petaDetail.entries()].map(([kunci, jumlah]) => {
        const [mapel, jenjang, kelas, materi] = kunci.split('|||');
        return { mapel, jenjang, kelas, materi, jumlah };
      });
      // Urut: Mapel -> Jenjang -> Kelas -> Materi (alfabet), biar nilai
      // materi yang mirip-mirip kelihatan BERDEKATAN pas discroll --
      // itu yang paling gampang buat mata manusia nangkep duplikat.
      detail.sort((a, b) =>
        a.mapel.localeCompare(b.mapel) ||
        a.jenjang.localeCompare(b.jenjang) ||
        (Number(a.kelas) || 0) - (Number(b.kelas) || 0) ||
        a.materi.localeCompare(b.materi)
      );

      // Ringkasan per Mapel+Jenjang+Kelas: berapa BANYAK nilai materi
      // unik buat nampung sekian soal -- ini angka yang LANGSUNG
      // nunjukkin skala "beranak"-nya. Mis. "120 soal tersebar di 47
      // nilai materi unik" = jelas kefragmentasi parah.
      const petaRingkasan = new Map();
      detail.forEach((d) => {
        const kunci = `${d.mapel}|||${d.jenjang}|||${d.kelas}`;
        if (!petaRingkasan.has(kunci)) petaRingkasan.set(kunci, { jumlahSoal: 0, materiUnik: new Set() });
        const acc = petaRingkasan.get(kunci);
        acc.jumlahSoal += d.jumlah;
        acc.materiUnik.add(d.materi);
      });
      const ringkasan = [...petaRingkasan.entries()].map(([kunci, acc]) => {
        const [mapel, jenjang, kelas] = kunci.split('|||');
        return { mapel, jenjang, kelas, jumlahSoal: acc.jumlahSoal, jumlahMateriUnik: acc.materiUnik.size };
      }).sort((a, b) => b.jumlahMateriUnik - a.jumlahMateriUnik); // paling berantakan duluan

      setDaftarDetail(detail);
      setRingkasanKelompok(ringkasan);
      setTotalSoal(semuaSoal.length);
      setSudahMuat(true);
    } catch (e) {
      console.error('Gagal audit materi:', e);
      alert('Gagal mengambil data: ' + e.message);
    }
    setLoading(false);
  }, []);

  const handleDownload = () => {
    const wb = XLSX.utils.book_new();

    const wsRingkasan = XLSX.utils.json_to_sheet(ringkasanKelompok.map((r) => ({
      'Mapel': r.mapel,
      'Jenjang': r.jenjang,
      'Kelas': r.kelas,
      'Jumlah Soal': r.jumlahSoal,
      'Jumlah Nilai Materi Unik': r.jumlahMateriUnik,
      'Rata2 Soal per Materi': r.jumlahMateriUnik ? (r.jumlahSoal / r.jumlahMateriUnik).toFixed(1) : 0,
    })));
    wsRingkasan['!cols'] = [{ wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 22 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsRingkasan, 'Ringkasan');

    const wsDetail = XLSX.utils.json_to_sheet(daftarDetail.map((d) => ({
      'Mapel': d.mapel,
      'Jenjang': d.jenjang,
      'Kelas': d.kelas,
      'Nilai Materi': d.materi,
      'Jumlah Soal': d.jumlah,
    })));
    wsDetail['!cols'] = [{ wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 50 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail Semua Materi');

    XLSX.writeFile(wb, `Audit_Materi_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const wrapper = { display: 'flex', background: '#f8fafc', minHeight: '100vh' };
  const mainContent = { marginLeft: isMobile ? '0' : '260px', padding: isMobile ? '15px' : '30px', width: isMobile ? '100%' : 'calc(100% - 260px)', boxSizing: 'border-box' };

  return (
    <div style={wrapper}>
      <SidebarAdmin />
      <div style={mainContent}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>🔍 Audit Materi</h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
            Laporan saja -- BUKAN mengubah data apa pun. Lihat seberapa berantakan nilai "materi" di Bank Soal sekarang, per Mapel/Jenjang/Kelas.
          </p>
        </div>

        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 12.5, color: '#92400e' }}>
            Halaman sementara buat kebutuhan analisis -- klik "Muat &amp; Analisis" (baca seluruh koleksi Bank Soal, bisa beberapa detik kalau soalnya banyak), lalu klik "Download Excel" dan kirim file itu ke Claude buat dirapikan jadi taksonomi materi baku per kelas.
          </div>
        </div>

        <button
          onClick={muatDanAnalisis}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#5B2ECC', color: 'white', border: 'none', borderRadius: 10, padding: '11px 20px', fontWeight: 700, fontSize: 13, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, marginBottom: 20 }}
        >
          {loading ? <Loader2 size={16} className="spin" /> : <ClipboardList size={16} />}
          {loading ? 'Memuat & menganalisis...' : 'Muat & Analisis'}
        </button>

        {sudahMuat && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: 13, color: '#374151' }}>
                Total <strong>{totalSoal}</strong> soal aktif, tersebar di <strong>{daftarDetail.length}</strong> kombinasi Mapel/Jenjang/Kelas/Materi.
              </div>
              <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0d9488', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
                <Download size={14} /> Download Excel
              </button>
            </div>

            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>Ringkasan per Mapel/Jenjang/Kelas</div>
              <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 14 }}>Diurut dari yang PALING BANYAK nilai materi unik-nya -- itu yang paling fragmentasi/berantakan.</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '6px 8px' }}>Mapel</th>
                      <th style={{ padding: '6px 8px' }}>Jenjang</th>
                      <th style={{ padding: '6px 8px' }}>Kelas</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Jumlah Soal</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Nilai Materi Unik</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ringkasanKelompok.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: r.jumlahMateriUnik > r.jumlahSoal * 0.5 ? '#fef2f2' : 'transparent' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{r.mapel}</td>
                        <td style={{ padding: '6px 8px' }}>{r.jenjang}</td>
                        <td style={{ padding: '6px 8px' }}>{r.kelas}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>{r.jumlahSoal}</td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: r.jumlahMateriUnik > r.jumlahSoal * 0.5 ? '#dc2626' : '#1e293b' }}>{r.jumlahMateriUnik}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 10 }}>Baris merah = nilai materi unik lebih dari separuh jumlah soalnya (rata-rata di bawah 2 soal per materi) -- indikasi paling parah butuh dirapikan.</div>
            </div>

            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>Detail Semua Nilai Materi</div>
              <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 14 }}>Lengkapnya ada di file Excel (sheet "Detail Semua Materi") -- di layar cuma ditampilkan 200 baris pertama biar ringan.</div>
              <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: '#6b7280', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, background: 'white' }}>
                      <th style={{ padding: '6px 8px' }}>Mapel</th>
                      <th style={{ padding: '6px 8px' }}>Jenjang</th>
                      <th style={{ padding: '6px 8px' }}>Kelas</th>
                      <th style={{ padding: '6px 8px' }}>Nilai Materi</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>Jumlah Soal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {daftarDetail.slice(0, 200).map((d, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '5px 8px' }}>{d.mapel}</td>
                        <td style={{ padding: '5px 8px' }}>{d.jenjang}</td>
                        <td style={{ padding: '5px 8px' }}>{d.kelas}</td>
                        <td style={{ padding: '5px 8px' }}>{d.materi}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right' }}>{d.jumlah}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}