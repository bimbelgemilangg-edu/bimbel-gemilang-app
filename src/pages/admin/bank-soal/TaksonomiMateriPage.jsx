// src/pages/admin/bank-soal/TaksonomiMateriPage.jsx
// ============================================================
// TAKSONOMI MATERI (Admin) -- rujukan bab BAKU per Mapel + Kelas.
// ============================================================
// Ini BEDA dari alat-alat sebelumnya (Bersihkan Soal, Rapikan
// Literasi) yang membereskan data yang SUDAH ada. Halaman ini
// membangun RUJUKAN TETAP -- daftar bab resmi per mapel per kelas,
// dipatok ke elemen Capaian Pembelajaran (CP) Kurikulum Merdeka +
// urutan ATP (Alur Tujuan Pembelajaran) yang lazim dipakai buku
// pelajaran Indonesia.
//
// Kegunaannya ke depan (bertahap, BUKAN sekaligus di halaman ini):
//   1. Jadi target pemetaan buat materi lama yang masih berantakan
//      (mis. Matematika yang variasi penulisannya banyak).
//   2. Jadi SUMBER PILIHAN di form Import Bank Soal -- begitu ini
//      dipasang di sana, AI/admin tinggal PILIH dari daftar ini,
//      bukan ngetik bebas lagi. Itu yang menghentikan "beranak"
//      dari akarnya, bukan cuma beres-beres belakangan.
//
// Struktur data: koleksi `taksonomi_materi`, 1 dokumen per
// kombinasi mapel+kelas (docId mis. "Matematika_3"), berisi:
//   { mapel, kelas, jenjang, fase, elemen: [...], babBaku: [...] }
// `elemen` = kategori resmi dari CP (mis. "Bilangan", "Aljabar") --
// dipakai sebagai payung, bukan buat pengelompokan soal langsung.
// `babBaku` = daftar bab yang BENERAN dipakai buat tag materi soal.
//
// 🔒 NON-DESTRUKTIF: halaman ini cuma menulis ke koleksi BARU
// (`taksonomi_materi`), TIDAK menyentuh koleksi `bank_soal` sama
// sekali. Aman dijalankan kapan saja.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, getDocs, doc, writeBatch, setDoc } from 'firebase/firestore';
import { BookMarked, Loader2, Sparkles, Plus, X, Save } from 'lucide-react';

// ============================================================
// SEED MATEMATIKA -- 12 kelas, dipatok ke Fase & Elemen CP resmi
// (Kemendikbud, kurikulum.kemdikbud.go.id/file/cp/dasmen/10. CP
// Matematika.pdf) + urutan ATP standar buku pelajaran Indonesia.
// Ini TITIK AWAL yang bisa diedit manual lewat halaman ini kapan
// saja -- bukan daftar yang dikunci mati.
// ============================================================
const SEED_MATEMATIKA = [
  { kelas: '1', jenjang: 'SD/MI', fase: 'A', elemen: ['Bilangan', 'Geometri', 'Pengukuran'], babBaku: ['Bilangan cacah sampai 20', 'Bilangan cacah sampai 100', 'Penjumlahan dan pengurangan', 'Bangun datar dan ruang (pengenalan)', 'Pengukuran panjang dan berat (tidak baku)', 'Pola gambar dan bilangan sederhana'] },
  { kelas: '2', jenjang: 'SD/MI', fase: 'A', elemen: ['Bilangan', 'Geometri', 'Pengukuran', 'Analisis Data dan Peluang'], babBaku: ['Bilangan cacah sampai 999', 'Penjumlahan dan pengurangan bersusun', 'Perkalian dan pembagian (pengenalan)', 'Pecahan sederhana (setengah dan seperempat)', 'Pengukuran panjang, berat, dan waktu', 'Bangun datar dan ruang', 'Pengumpulan data sederhana'] },
  { kelas: '3', jenjang: 'SD/MI', fase: 'B', elemen: ['Bilangan', 'Geometri', 'Pengukuran', 'Analisis Data dan Peluang'], babBaku: ['Bilangan cacah sampai 10.000', 'Nilai tempat bilangan', 'Membaca dan menulis bilangan', 'Membandingkan dan mengurutkan bilangan', 'Penjumlahan dan pengurangan', 'Perkalian dan pembagian', 'Pecahan sederhana', 'Pengukuran (panjang, berat, waktu)', 'Keliling bangun datar', 'Sudut dan bangun datar', 'Penyajian data sederhana'] },
  { kelas: '4', jenjang: 'SD/MI', fase: 'B', elemen: ['Bilangan', 'Aljabar', 'Geometri', 'Pengukuran', 'Analisis Data dan Peluang'], babBaku: ['Bilangan cacah sampai 100.000', 'Faktor dan kelipatan', 'Pola bilangan', 'Perkalian dan pembagian', 'Penjumlahan dan pengurangan', 'Pecahan dan desimal', 'Uang', 'Pengukuran', 'Keliling dan luas', 'Bangun datar dan ruang', 'Data dan tabel', 'Pengumpulan dan penyajian data'] },
  { kelas: '5', jenjang: 'SD/MI', fase: 'C', elemen: ['Bilangan', 'Geometri', 'Pengukuran', 'Analisis Data dan Peluang'], babBaku: ['Bilangan bulat', 'Bilangan cacah sampai 100.000', 'Pangkat dan akar', 'Perkalian dan pembagian', 'Penjumlahan dan pengurangan', 'KPK dan FPB', 'Operasi hitung pecahan', 'Desimal dan persen', 'Perbandingan dan skala', 'Luas dan volume', 'Bangun ruang', 'Kecepatan dan debit', 'Data dan rata-rata', 'Pengumpulan dan penyajian data'] },
  { kelas: '6', jenjang: 'SD/MI', fase: 'C', elemen: ['Bilangan', 'Aljabar', 'Geometri', 'Analisis Data dan Peluang'], babBaku: ['Operasi hitung campuran bilangan bulat', 'Bilangan cacah sampai 1.000.000', 'Pangkat dan akar', 'Perkalian dan pembagian', 'KPK dan FPB', 'Operasi desimal', 'Pecahan dan perbandingan', 'Volume bangun ruang', 'Lingkaran', 'Kecepatan dan debit', 'Statistika dasar', 'Pengolahan data', 'Koordinat kartesius', 'Skala dan perbandingan'] },
  { kelas: '7', jenjang: 'SMP/MTs', fase: 'D', elemen: ['Bilangan', 'Aljabar', 'Geometri', 'Analisis Data dan Peluang'], babBaku: ['Bilangan bulat dan pecahan', 'Bilangan rasional', 'Himpunan', 'Aljabar', 'Bentuk aljabar', 'Persamaan dan pertidaksamaan linear satu variabel', 'Perbandingan', 'Numerasi dan operasi', 'Garis dan sudut', 'Segiempat dan segitiga', 'Data', 'Penyajian data'] },
  { kelas: '8', jenjang: 'SMP/MTs', fase: 'D', elemen: ['Bilangan', 'Aljabar', 'Geometri', 'Analisis Data dan Peluang'], babBaku: ['Pola bilangan', 'Aljabar', 'Bentuk aljabar', 'Pangkat dan akar', 'Koordinat kartesius', 'Relasi dan fungsi', 'Persamaan garis lurus', 'Sistem persamaan linear dua variabel', 'SPLDV', 'Teorema Pythagoras', 'Lingkaran', 'Bangun ruang sisi datar', 'Numerasi dan konteks', 'Statistika', 'Peluang'] },
  { kelas: '9', jenjang: 'SMP/MTs', fase: 'D', elemen: ['Bilangan', 'Aljabar', 'Geometri', 'Analisis Data dan Peluang'], babBaku: ['Perpangkatan dan bentuk akar', 'Pangkat dan akar', 'Aljabar', 'Persamaan kuadrat', 'Fungsi kuadrat', 'Transformasi geometri', 'Transformasi', 'Kesebangunan dan kekongruenan', 'Bangun ruang sisi lengkung', 'Numerasi dan konteks', 'Statistika', 'Peluang'] },
  { kelas: '10', jenjang: 'SMA/MA', fase: 'E', elemen: ['Aljabar dan Fungsi', 'Geometri', 'Analisis Data dan Peluang'], babBaku: ['Eksponen dan logaritma', 'Barisan dan deret', 'Persamaan dan fungsi kuadrat', 'Sistem persamaan linear', 'Pertidaksamaan', 'Trigonometri dasar', 'Vektor (pengenalan)', 'Statistika'] },
  { kelas: '11', jenjang: 'SMA/MA', fase: 'F', elemen: ['Aljabar dan Fungsi', 'Geometri', 'Analisis Data dan Peluang'], babBaku: ['Trigonometri lanjutan', 'Program linear', 'Matriks', 'Fungsi komposisi dan invers', 'Lingkaran (persamaan)', 'Polinomial (suku banyak)', 'Vektor', 'Statistika', 'Peluang'] },
  { kelas: '12', jenjang: 'SMA/MA', fase: 'F', elemen: ['Aljabar dan Fungsi', 'Geometri', 'Analisis Data dan Peluang', 'Kalkulus'], babBaku: ['Limit dan turunan', 'Integral', 'Barisan dan deret', 'Kaidah pencacahan dan peluang', 'Statistika', 'Geometri ruang', 'Matriks', 'Numerasi dan konteks'] },
];

// ============================================================
// SEED BAHASA INDONESIA SMA -- dipatok ke ATP resmi kolaborasi
// SMAN 10 & SMAN 15 Surabaya (Fase E kelas 10) untuk jenis teks per
// semester, dilanjut pola umum ATP Fase F (kelas 11-12) yang lazim
// dipakai sekolah lain. "Pemahaman Bacaan" ditambahkan di tiap kelas
// karena data TKA/SNBT yang ada justru banyak berupa soal keterampilan
// membaca (ide pokok, makna kata, simpulan) lintas jenis teks, bukan
// cuma soal per-genre.
// ============================================================
const SEED_BAHASA_INDONESIA = [
  { kelas: '10', jenjang: 'SMA/MA', fase: 'E', elemen: ['Menyimak', 'Membaca dan Memirsa', 'Berbicara dan Mempresentasikan', 'Menulis'], babBaku: ['Teks Laporan Hasil Observasi', 'Teks Anekdot', 'Teks Eksposisi', 'Teks Hikayat', 'Teks Cerpen', 'Teks Negosiasi', 'Teks Biografi', 'Teks Rekon', 'Teks Puisi', 'Teks Diskusi', 'Pemahaman Bacaan (Ide Pokok, Makna Kata, Simpulan)'] },
  { kelas: '11', jenjang: 'SMA/MA', fase: 'F', elemen: ['Menyimak', 'Membaca dan Memirsa', 'Berbicara dan Mempresentasikan', 'Menulis'], babBaku: ['Teks Proposal', 'Teks Karya Ilmiah', 'Teks Resensi', 'Drama (Naskah Drama)', 'Kritik dan Esai', 'Pemahaman Bacaan (Ide Pokok, Makna Kata, Simpulan)'] },
  { kelas: '12', jenjang: 'SMA/MA', fase: 'F', elemen: ['Menyimak', 'Membaca dan Memirsa', 'Berbicara dan Mempresentasikan', 'Menulis'], babBaku: ['Teks Editorial (Opini)', 'Surat Lamaran Kerja', 'Novel dan Kritik Sastra', 'Artikel', 'Pemahaman Bacaan (Ide Pokok, Makna Kata, Simpulan)'] },
];

// ============================================================
// SEED SOSIOLOGI SMA (mapel peminatan IPS) -- urutan materi pokok
// lazim: kelas 10 dasar-dasar interaksi & norma, kelas 11 struktur &
// dinamika sosial, kelas 12 perubahan sosial & penelitian.
// ============================================================
const SEED_SOSIOLOGI = [
  { kelas: '10', jenjang: 'SMA/MA', fase: 'E', elemen: ['Pemahaman Konsep', 'Keterampilan Proses'], babBaku: ['Konsep Dasar Sosiologi', 'Individu, Kelompok, dan Hubungan Sosial', 'Interaksi Sosial', 'Nilai dan Norma Sosial', 'Sosialisasi dan Pembentukan Kepribadian', 'Penyimpangan Sosial', 'Pengendalian Sosial'] },
  { kelas: '11', jenjang: 'SMA/MA', fase: 'F', elemen: ['Pemahaman Konsep', 'Keterampilan Proses'], babBaku: ['Struktur Sosial', 'Diferensiasi dan Stratifikasi Sosial', 'Kelompok Sosial', 'Multikulturalisme', 'Konflik Sosial dan Integrasi', 'Mobilitas Sosial'] },
  { kelas: '12', jenjang: 'SMA/MA', fase: 'F', elemen: ['Pemahaman Konsep', 'Keterampilan Proses'], babBaku: ['Perubahan Sosial', 'Globalisasi', 'Ketimpangan Sosial', 'Pemberdayaan Komunitas', 'Penelitian Sosial'] },
];

// ============================================================
// SEED GEOGRAFI SMA (mapel peminatan IPS) -- kelas 10 geografi fisik
// & alat analisis, kelas 11 sumber daya & kependudukan, kelas 12
// pola keruangan desa-kota & kerjasama antarnegara.
// ============================================================
const SEED_GEOGRAFI = [
  { kelas: '10', jenjang: 'SMA/MA', fase: 'E', elemen: ['Pemahaman Konsep', 'Keterampilan Proses'], babBaku: ['Konsep dan Prinsip Geografi', 'Peta, Penginderaan Jauh, dan SIG', 'Litosfer dan Vulkanisme', 'Atmosfer dan Iklim', 'Hidrosfer', 'Biosfer (Flora dan Fauna)', 'Kependudukan'] },
  { kelas: '11', jenjang: 'SMA/MA', fase: 'F', elemen: ['Pemahaman Konsep', 'Keterampilan Proses'], babBaku: ['Flora dan Fauna Dunia', 'Sumber Daya Alam', 'Ketahanan Pangan, Industri, dan Energi', 'Dinamika Kependudukan', 'Keragaman Budaya Indonesia', 'Mitigasi Bencana Alam'] },
  { kelas: '12', jenjang: 'SMA/MA', fase: 'F', elemen: ['Pemahaman Konsep', 'Keterampilan Proses'], babBaku: ['Pola Keruangan Desa dan Kota', 'Interaksi Desa-Kota', 'Negara Maju dan Berkembang', 'Kerjasama Antarnegara'] },
];

// Daftar semua mapel yang punya seed siap-pakai -- dipakai buat
// nampilin tombol "Isi Otomatis" per mapel yang belum ada datanya.
const SEMUA_SEED = {
  Matematika: SEED_MATEMATIKA,
  'Bahasa Indonesia': SEED_BAHASA_INDONESIA,
  Sosiologi: SEED_SOSIOLOGI,
  Geografi: SEED_GEOGRAFI,
};

export default function TaksonomiMateriPage() {
  const [isMobile] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(true);
  const [menyemai, setMenyemai] = useState(false);
  const [daftar, setDaftar] = useState([]); // semua dokumen taksonomi_materi
  const [mapelDipilih, setMapelDipilih] = useState('');
  const [kelasDipilih, setKelasDipilih] = useState('');
  const [babBaruInput, setBabBaruInput] = useState('');
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesan, setPesan] = useState('');

  const muatData = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'taksonomi_materi'));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDaftar(list);
      if (list.length > 0 && !mapelDipilih) {
        setMapelDipilih(list[0].mapel);
        setKelasDipilih(list[0].kelas);
      }
    } catch (e) {
      console.error('Gagal memuat taksonomi:', e);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { muatData(); }, [muatData]);

  const semaiMapel = useCallback(async (namaMapel) => {
    const seed = SEMUA_SEED[namaMapel];
    if (!seed) return;
    if (!window.confirm(`Isi taksonomi ${namaMapel} untuk ${seed.length} kelas? Ini TIDAK menyentuh koleksi bank_soal sama sekali, cuma bikin rujukan baru.`)) return;
    setMenyemai(true);
    try {
      const batch = writeBatch(db);
      seed.forEach((item) => {
        const docId = `${namaMapel.replace(/\s+/g, '_')}_${item.kelas}`;
        batch.set(doc(db, 'taksonomi_materi', docId), { mapel: namaMapel, ...item });
      });
      await batch.commit();
      setPesan(`✅ Taksonomi ${namaMapel} (${seed.length} kelas) berhasil diisi.`);
      await muatData();
      setMapelDipilih(namaMapel);
    } catch (e) {
      console.error('Gagal menyemai:', e);
      setPesan('❌ Gagal: ' + e.message);
    }
    setMenyemai(false);
    setTimeout(() => setPesan(''), 4000);
  }, [muatData]);

  const mapelBelumDiisi = Object.keys(SEMUA_SEED).filter((m) => !daftar.some((d) => d.mapel === m));

  const daftarMapel = [...new Set(daftar.map((d) => d.mapel))].sort();
  const daftarKelasUntukMapel = daftar
    .filter((d) => d.mapel === mapelDipilih)
    .map((d) => d.kelas)
    .sort((a, b) => (Number(a) || 0) - (Number(b) || 0));
  const dokAktif = daftar.find((d) => d.mapel === mapelDipilih && d.kelas === kelasDipilih);

  const tambahBab = async () => {
    const babBaru = babBaruInput.trim();
    if (!babBaru || !dokAktif) return;
    if (dokAktif.babBaku.includes(babBaru)) { setBabBaruInput(''); return; }
    setMenyimpan(true);
    try {
      const babBaruList = [...dokAktif.babBaku, babBaru];
      await setDoc(doc(db, 'taksonomi_materi', dokAktif.id), { ...dokAktif, babBaku: babBaruList });
      setDaftar((prev) => prev.map((d) => (d.id === dokAktif.id ? { ...d, babBaku: babBaruList } : d)));
      setBabBaruInput('');
    } catch (e) {
      alert('Gagal menyimpan: ' + e.message);
    }
    setMenyimpan(false);
  };

  const hapusBab = async (bab) => {
    if (!dokAktif) return;
    setMenyimpan(true);
    try {
      const babBaruList = dokAktif.babBaku.filter((b) => b !== bab);
      await setDoc(doc(db, 'taksonomi_materi', dokAktif.id), { ...dokAktif, babBaku: babBaruList });
      setDaftar((prev) => prev.map((d) => (d.id === dokAktif.id ? { ...d, babBaku: babBaruList } : d)));
    } catch (e) {
      alert('Gagal menghapus: ' + e.message);
    }
    setMenyimpan(false);
  };

  const wrapper = { display: 'flex', background: '#f8fafc', minHeight: '100vh' };
  const mainContent = { marginLeft: isMobile ? '0' : '260px', padding: isMobile ? '15px' : '30px', width: isMobile ? '100%' : 'calc(100% - 260px)', boxSizing: 'border-box' };
  const cardStyle = { background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, marginBottom: 20 };
  const selectStyle = { padding: '9px 12px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12.5, fontWeight: 600, color: '#1e293b', background: 'white', cursor: 'pointer' };

  return (
    <div style={wrapper}>
      <SidebarAdmin />
      <div style={mainContent}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>📖 Taksonomi Materi</h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
            Rujukan bab baku per Mapel + Kelas, dipatok ke Capaian Pembelajaran Kurikulum Merdeka. Ini "rak buku" resmi -- dipakai buat memetakan materi lama dan (nanti) mengunci form Import.
          </p>
        </div>

        {mapelBelumDiisi.length > 0 && (
          <div style={{ ...cardStyle, background: '#f5f3ff' }}>
            <div style={{ fontSize: 13, color: '#374151', marginBottom: 10 }}>
              {daftar.length === 0 ? 'Belum ada taksonomi tersimpan.' : 'Ada mapel lain yang sudah punya rujukan siap-pakai:'}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {mapelBelumDiisi.map((m) => (
                <button
                  key={m}
                  onClick={() => semaiMapel(m)}
                  disabled={menyemai}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#5B2ECC', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: 12.5, cursor: menyemai ? 'default' : 'pointer' }}
                >
                  {menyemai ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
                  Isi Otomatis {m} ({SEMUA_SEED[m].length} kelas)
                </button>
              ))}
            </div>
          </div>
        )}
        {pesan && <div style={{ ...cardStyle, color: pesan.startsWith('✅') ? '#166534' : '#dc2626' }}>{pesan}</div>}

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Memuat...</div>
        ) : daftar.length > 0 && (
          <>
            <div style={{ ...cardStyle, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={mapelDipilih} onChange={(e) => { setMapelDipilih(e.target.value); setKelasDipilih(''); }} style={selectStyle}>
                {daftarMapel.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <select value={kelasDipilih} onChange={(e) => setKelasDipilih(e.target.value)} style={selectStyle}>
                <option value="">Pilih kelas</option>
                {daftarKelasUntukMapel.map((k) => <option key={k} value={k}>Kelas {k}</option>)}
              </select>
              {SEMUA_SEED[mapelDipilih] && (
                <button onClick={() => semaiMapel(mapelDipilih)} disabled={menyemai} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', color: '#5B2ECC', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                  <Sparkles size={13} /> Isi ulang seed {mapelDipilih}
                </button>
              )}
            </div>

            {dokAktif && (
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <BookMarked size={16} color="#5B2ECC" />
                  <span style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>{dokAktif.mapel} — Kelas {dokAktif.kelas}</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 4 }}>Jenjang: {dokAktif.jenjang} · Fase {dokAktif.fase} (Kurikulum Merdeka)</div>
                <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 14 }}>Elemen CP: {dokAktif.elemen.join(', ')}</div>

                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Bab baku ({dokAktif.babBaku.length}):</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                  {dokAktif.babBaku.map((bab) => (
                    <span key={bab} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f5f3ff', color: '#5B2ECC', borderRadius: 999, padding: '6px 10px 6px 14px', fontSize: 12.5, fontWeight: 600 }}>
                      {bab}
                      <button onClick={() => hapusBab(bab)} disabled={menyimpan} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5B2ECC', display: 'flex', padding: 0 }}>
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={babBaruInput}
                    onChange={(e) => setBabBaruInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && tambahBab()}
                    placeholder="Tambah bab baru..."
                    style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12.5 }}
                  />
                  <button onClick={tambahBab} disabled={menyimpan || !babBaruInput.trim()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#5B2ECC', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
                    {menyimpan ? <Loader2 size={14} className="spin" /> : <Plus size={14} />} Tambah
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}