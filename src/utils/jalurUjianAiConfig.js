// src/utils/jalurUjianAiConfig.js
// ============================================================
// KONFIGURASI JALUR UJIAN AI (STAGE MAP EKSPEDISI KOSMIK GEMILANG)
//
// 1. Menu ini HANYA TAMPIL untuk siswa jenjang akhir:
//    - Kelas 6 SD (TKA SD / Asesmen Daerah)
//    - Kelas 9 SMP (TKA SMP / Standarisasi Kelulusan)
//    - Kelas 12 SMA / SMK / Alumni (UTBK-SNBT & TKA SMA)
//    Kelas selain itu (1-5 SD, 7-8 SMP, 10-11 SMA) TIDAK MELIHAT MENU INI.
//
// 2. MEKANISME PROGRESI TANPA DEADLINE:
//    - Tidak ada deadline yang membuat kuis hangus!
//    - Unit 1 (Start) selalu terbuka.
//    - Unit N+1 otomatis terbuka jika Unit N telah diselesaikan (status: 'selesai').
//    - Analisis kemampuan AI langsung terbuka per unit.
//
// 3. UJIAN RESMI & PENGAWASAN ONLINE:
//    - Timer resmi per unit.
//    - Anti-cheat online terintegrasi.
//    - Bank soal selalu terjaga, tidak boleh ada unit terbuka dengan soal kosong.
// ============================================================

import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { layakUntukTryOut } from './layakTryOut.js';

/**
 * Deteksi apakah siswa berada di jenjang akhir yang wajib ujian seleksi.
 * @param {object|string} siswaAtauKelas objek profil siswa atau string kelas
 * @returns {null|{jenjang:string, kelas:string, kodeTarget:string, namaUjian:string, labelBadge:string, subJudul:string, deskripsi:string}}
 */
export function deteksiJenjangUjianAkhir(siswaAtauKelas) {
  let kelasStr = '';
  let jenjangStr = '';
  if (typeof siswaAtauKelas === 'object' && siswaAtauKelas !== null) {
    kelasStr = String(siswaAtauKelas.kelasSekolah || siswaAtauKelas.kelas || siswaAtauKelas.studentKelas || siswaAtauKelas.grade || '');
    jenjangStr = String(siswaAtauKelas.jenjang || '');
  } else {
    kelasStr = String(siswaAtauKelas || '');
  }
  const k = kelasStr.trim().toLowerCase();
  const j = jenjangStr.trim().toLowerCase();

  // 1. Cek Alumni / UTBK / Gap Year / Kedinasan
  if (k.includes('alumni') || k.includes('gap year') || k.includes('gapyear') || k.includes('utbk') || k.includes('snbt')) {
    return {
      jenjang: 'SMA',
      kelas: '12',
      kodeTarget: '12-SMA',
      namaUjian: 'UTBK-SNBT & TKA SMA',
      labelBadge: 'UTBK / TKA',
      subJudul: 'Ekspedisi Kosmik SNBT & TKA SMA',
      deskripsi: 'Simulasi bertingkat tanpa deadline persiapan lolos PTN & kedinasan impian.',
    };
  }

  // Ekstrak angka kelas bila ada
  const matchAngka = /(\d{1,2})/.exec(k);
  const angka = matchAngka ? parseInt(matchAngka[1], 10) : null;

  // 2. Cek Kelas 6 SD
  const isSd = k.includes('sd') || k.includes('mi') || j.includes('sd') || j.includes('mi');
  if (angka === 6 || (isSd && (angka === 6 || k.includes('vi'))) || k.includes('6 sd') || k.includes('sd 6') || k.includes('kelas 6')) {
    return {
      jenjang: 'SD',
      kelas: '6',
      kodeTarget: '6-SD',
      namaUjian: 'TKA SD (Asesmen Standarisasi)',
      labelBadge: 'TKA SD',
      subJudul: 'Misi Penjelajah TKA SD',
      deskripsi: 'Simulasi bertingkat tanpa deadline untuk pemantapan standarisasi & kelulusan SD.',
    };
  }

  // 3. Cek Kelas 9 SMP
  const isSmp = k.includes('smp') || k.includes('mts') || j.includes('smp') || j.includes('mts');
  if (angka === 9 || (isSmp && (angka === 9 || k.includes('ix'))) || k.includes('9 smp') || k.includes('smp 9') || k.includes('kelas 9')) {
    return {
      jenjang: 'SMP',
      kelas: '9',
      kodeTarget: '9-SMP',
      namaUjian: 'TKA SMP (Pemantapan Kelulusan)',
      labelBadge: 'TKA SMP',
      subJudul: 'Ekspedisi Orbit TKA SMP',
      deskripsi: 'Simulasi bertahap penguasaan TKA Matematika & Bahasa Indonesia menuju SMA favorit.',
    };
  }

  // 4. Cek Kelas 12 SMA / SMK
  const isSma = k.includes('sma') || k.includes('smk') || k.includes('ma') || j.includes('sma') || j.includes('smk') || j.includes('ma');
  if (angka === 12 || (isSma && (angka === 12 || k.includes('xii'))) || k.includes('12 sma') || k.includes('sma 12') || k.includes('12 smk') || k.includes('kelas 12')) {
    return {
      jenjang: 'SMA',
      kelas: '12',
      kodeTarget: '12-SMA',
      namaUjian: 'UTBK-SNBT & TKA SMA',
      labelBadge: 'UTBK / TKA',
      subJudul: 'Ekspedisi Kosmik SNBT & TKA SMA',
      deskripsi: 'Simulasi bertingkat tanpa deadline persiapan lolos PTN & kedinasan impian.',
    };
  }

  // Fallback toleran jika siswa hanya mengisi angka murni
  if (angka === 6) {
    return {
      jenjang: 'SD',
      kelas: '6',
      kodeTarget: '6-SD',
      namaUjian: 'TKA SD (Asesmen Standarisasi)',
      labelBadge: 'TKA SD',
      subJudul: 'Misi Penjelajah TKA SD',
      deskripsi: 'Simulasi bertingkat tanpa deadline untuk pemantapan standarisasi & kelulusan SD.',
    };
  }
  if (angka === 9) {
    return {
      jenjang: 'SMP',
      kelas: '9',
      kodeTarget: '9-SMP',
      namaUjian: 'TKA SMP (Pemantapan Kelulusan)',
      labelBadge: 'TKA SMP',
      subJudul: 'Ekspedisi Orbit TKA SMP',
      deskripsi: 'Simulasi bertahap penguasaan TKA Matematika & Bahasa Indonesia menuju SMA favorit.',
    };
  }
  if (angka === 12) {
    return {
      jenjang: 'SMA',
      kelas: '12',
      kodeTarget: '12-SMA',
      namaUjian: 'UTBK-SNBT & TKA SMA',
      labelBadge: 'UTBK / TKA',
      subJudul: 'Ekspedisi Kosmik SNBT & TKA SMA',
      deskripsi: 'Simulasi bertingkat tanpa deadline persiapan lolos PTN & kedinasan impian.',
    };
  }

  return null;
}

/**
 * Memeriksa apakah sebuah paket merupakan paket try out otomatis yang diterbitkan AI/sistem.
 * Paket otomatis AI dialihkan ke menu "Jalur Ujian AI" (peta langkah kemampuan tanpa deadline).
 * Paket manual (ujian besar dari admin/guru) tetap di menu "Try Out Terjadwal" (dengan tanggal).
 */
export function isPaketOtomatisAi(paket) {
  if (!paket) return false;
  if (paket.jalurUjianAi === true) return true;
  if (paket.otomatis === true) return true;
  if (paket.sumber === 'mesin-otomatis') return true;
  if (Boolean(paket.templateId)) return true;
  const judul = String(paket.judul || '').toUpperCase();
  if (judul.includes('PEMAHAMAN TKA') || judul.includes('TRY OUT OTOMATIS')) return true;
  return false;
}

/**
 * Memeriksa apakah sebuah paket merupakan paket manual terjadwal.
 */
export function isPaketManual(paket) {
  return !isPaketOtomatisAi(paket);
}

/**
 * Daftar Unit Misi bertingkat berdasarkan jenjang siswa.
 * Format jalur: dari bawah (Start / Unit 1) ke atas (Unit 4 / Review).
 */
export function getDaftarUnitJalurUjian(jenjang = 'SMP') {
  const j = String(jenjang).toUpperCase();

  if (j === 'SD') {
    return [
      {
        id: 'jalur-ai-sd-u1',
        unitNomor: 1,
        judul: 'Unit 1: Fondasi Skolastik & Literasi Dasar',
        subjudul: 'Pemetaan Diagnostik Kemampuan Dasar SD',
        tipe: 'start',
        mapel: 'Bahasa Indonesia & Matematika Dasar',
        durasiMenit: 60,
        jumlahSoal: 30,
        passingGrade: 60,
        xpReward: 150,
        icon: 'Rocket',
        posisiAlign: 'center', // center, left, right
        deskripsi: 'Misi awal untuk mendeteksi fondasi numerasi dan literasi dasarmu. Lengkap dengan pengawasan online anti-cheat.',
      },
      {
        id: 'jalur-ai-sd-u2',
        unitNomor: 2,
        judul: 'Unit 2: Pemantapan Cerita & Konsep Kontekstual',
        subjudul: 'Literasi Bacaan Panjang & Soal Cerita Menantang',
        tipe: 'unit',
        mapel: 'Literasi Kontekstual & Matematika Terapan',
        durasiMenit: 60,
        jumlahSoal: 30,
        passingGrade: 65,
        xpReward: 200,
        icon: 'BookOpen',
        posisiAlign: 'left',
        deskripsi: 'Misi kedua untuk memperkuat pemahaman teks dan pemecahan masalah dalam konteks kehidupan sehari-hari.',
      },
      {
        id: 'jalur-ai-sd-u3',
        unitNomor: 3,
        judul: 'Unit 3: Penguasaan Logika HOTS & Pola Bilangan',
        subjudul: 'Tantangan Penalaran Tingkat Tinggi & IPA Terapan',
        tipe: 'unit',
        mapel: 'Matematika HOTS & IPA Lingkungan',
        durasiMenit: 60,
        jumlahSoal: 30,
        passingGrade: 70,
        xpReward: 250,
        icon: 'Sparkles',
        posisiAlign: 'right',
        deskripsi: 'Misi ketiga dengan variasi butir pilihan ganda kompleks dan penalaran sains yang tajam.',
      },
      {
        id: 'jalur-ai-sd-u4',
        unitNomor: 4,
        judul: 'Unit 4: Simulasi Asesmen Standarisasi Final',
        subjudul: 'Simulasi Puncak Menyerupai Ujian Standarisasi Resmi',
        tipe: 'unit',
        mapel: 'Try Out Akbar Standarisasi SD Lengkap',
        durasiMenit: 75,
        jumlahSoal: 35,
        passingGrade: 75,
        xpReward: 400,
        icon: 'Trophy',
        posisiAlign: 'left',
        deskripsi: 'Simulasi akbar puncak dengan naskah soal berstandar resmi dan pengawasan penuh anti-cheat.',
      },
      {
        id: 'jalur-ai-sd-review',
        unitNomor: 5,
        judul: 'Review & Analisis Kelulusan SD',
        subjudul: 'Radar Penguasaan Materi & Rekomendasi Belajar',
        tipe: 'review',
        posisiAlign: 'center',
        deskripsi: 'Analisis komprehensif performamu dari seluruh unit. Temukan kekuatanmu dan materi yang perlu ditingkatkan!',
      },
    ];
  }

  if (j === 'SMA' || j === 'SMK') {
    return [
      {
        id: 'jalur-ai-sma-u1',
        unitNomor: 1,
        judul: 'Unit 1: Pemetaan Diagnostik TPS Skolastik',
        subjudul: 'Penalaran Umum & Pengetahuan Kuantitatif',
        tipe: 'start',
        mapel: 'TPS Skolastik (PU & PK)',
        durasiMenit: 50,
        jumlahSoal: 30,
        passingGrade: 60,
        xpReward: 200,
        icon: 'Rocket',
        posisiAlign: 'center',
        deskripsi: 'Langkah pertama mengukur kesiapan skolastik nasionalmu dengan standar waktu UTBK resmi.',
      },
      {
        id: 'jalur-ai-sma-u2',
        unitNomor: 2,
        judul: 'Unit 2: Literasi Bahasa Indonesia & Bahasa Inggris',
        subjudul: 'Pemahaman Wacana Kritis, Argumentasi & Teks Ilmiah',
        tipe: 'unit',
        mapel: 'Literasi Bahasa Indonesia & Bahasa Inggris',
        durasiMenit: 50,
        jumlahSoal: 30,
        passingGrade: 65,
        xpReward: 250,
        icon: 'BookOpen',
        posisiAlign: 'left',
        deskripsi: 'Misi kedua untuk memperkuat ketelitian membaca teks analitis dan menyimpulkan argumen.',
      },
      {
        id: 'jalur-ai-sma-u3',
        unitNomor: 3,
        judul: 'Unit 3: Penalaran Matematika & Subtes PPU/PBM',
        subjudul: 'Aljabar Lanjutan, Kalkulus Dasar & Kaidah Bahasa',
        tipe: 'unit',
        mapel: 'Penalaran Matematika & Subtes PPU/PBM',
        durasiMenit: 60,
        jumlahSoal: 30,
        passingGrade: 70,
        xpReward: 300,
        icon: 'Sparkles',
        posisiAlign: 'right',
        deskripsi: 'Tantangan matematis HOTS dan analisis struktur kalimat baku standar SNPMB.',
      },
      {
        id: 'jalur-ai-sma-u4',
        unitNomor: 4,
        judul: 'Unit 4: Simulasi Penuh Standar Nasional SNBT',
        subjudul: 'Simulasi Komprehensif Skala Skor 200-800',
        tipe: 'unit',
        mapel: 'Try Out Akbar UTBK 7 Subtes',
        durasiMenit: 90,
        jumlahSoal: 50,
        passingGrade: 75,
        xpReward: 500,
        icon: 'Trophy',
        posisiAlign: 'left',
        deskripsi: 'Simulasi realistis lengkap dengan pembobotan IRT dan kalkulasi peluang PTN impian.',
      },
      {
        id: 'jalur-ai-sma-review',
        unitNomor: 5,
        judul: 'Review & Analisis SNBT Kampus',
        subjudul: 'Peluang Lolos Jurusan Impian & Rekomendasi Materi',
        tipe: 'review',
        posisiAlign: 'center',
        deskripsi: 'Analisis komprehensif seluruh subtes untuk memaksimalkan peluang lolos SNBT.',
      },
    ];
  }

  // Default: SMP (Kelas 9)
  return [
    {
      id: 'jalur-ai-smp-u1',
      unitNomor: 1,
      judul: 'Unit 1: Diagnostik TKA Matematika Paket A',
      subjudul: 'Pemetaan Awal Geometri, Aljabar & Aritmetika',
      tipe: 'start',
      mapel: 'Matematika TKA Paket A',
      durasiMenit: 60,
      jumlahSoal: 30,
      passingGrade: 60,
      xpReward: 180,
      icon: 'Rocket',
      posisiAlign: 'center',
      deskripsi: 'Misi pembuka dengan naskah presisi Matematika TKA 2 Paket A (30 Soal terstandar, rumus LaTeX & gambar tajam).',
    },
    {
      id: 'jalur-ai-smp-u2',
      unitNomor: 2,
      judul: 'Unit 2: Pemantapan Bahasa Indonesia TPM Paket B',
      subjudul: 'Analisis Wacana Teks Laporan, Ide Pokok & Tabel',
      tipe: 'unit',
      mapel: 'Bahasa Indonesia TPM Paket B',
      durasiMenit: 60,
      jumlahSoal: 30,
      passingGrade: 65,
      xpReward: 220,
      icon: 'BookOpen',
      posisiAlign: 'left',
      deskripsi: 'Misi kedua dengan naskah Bahasa Indonesia TPM 2 Paket B (30 Soal lengkap wacana & tabel presisi).',
    },
    {
      id: 'jalur-ai-smp-u3',
      unitNomor: 3,
      judul: 'Unit 3: Penguasaan HOTS & Statistika Terintegrasi',
      subjudul: 'Peluang, Ukuran Pemusatan Data & Soal Kompleks',
      tipe: 'unit',
      mapel: 'Matematika HOTS & Literasi Analitis',
      durasiMenit: 60,
      jumlahSoal: 30,
      passingGrade: 70,
      xpReward: 280,
      icon: 'Sparkles',
      posisiAlign: 'right',
      deskripsi: 'Misi penguasaan butir HOTS bertaraf Asesmen Standarisasi Daerah (ASPD/TKA).',
    },
    {
      id: 'jalur-ai-smp-u4',
      unitNomor: 4,
      judul: 'Unit 4: Try Out Akbar TKA SMP 60 Butir',
      subjudul: 'Simulasi Resmi Gabungan Matematika & Bahasa Indonesia',
      tipe: 'unit',
      mapel: 'Try Out Akbar TKA SMP 60 Soal',
      durasiMenit: 120,
      jumlahSoal: 60,
      passingGrade: 75,
      xpReward: 500,
      icon: 'Trophy',
      posisiAlign: 'left',
      deskripsi: 'Simulasi akbar puncak 60 butir soal gabungan standar kelulusan resmi dengan pengawasan online ketat.',
    },
    {
      id: 'jalur-ai-smp-review',
      unitNomor: 5,
      judul: 'Review & Analisis Kelulusan SMP',
      subjudul: 'Pemetaan Daya Saing Masuk SMA/SMK Favorit',
      tipe: 'review',
      posisiAlign: 'center',
      deskripsi: 'Analisis komprehensif kemampuan belajar dan panduan fokus materi menuju kelulusan cemerlang.',
    },
  ];
}

/**
 * Menghitung status progresi siswa di Jalur Ujian AI:
 * - Unit 1 selalu terbuka ('current' jika belum selesai, 'completed' jika sudah).
 * - Unit N terbuka jika Unit N-1 sudah berstatus 'selesai'.
 * - Siswa tidak akan pernah terhalang deadline tanggal; progres tersimpan permanen.
 */
export function hitungProgresiJalur(daftarUnit = [], sesiList = []) {
  // Map dari id paket atau unitId ke sesi yang selesai
  const sesiSelesaiMap = new Map();
  sesiList.forEach((s) => {
    if (s.status === 'selesai') {
      if (s.paketId) sesiSelesaiMap.set(s.paketId, s);
      if (s.tryoutId) sesiSelesaiMap.set(s.tryoutId, s);
      if (s.unitId) sesiSelesaiMap.set(s.unitId, s);
    }
  });

  let ditemukanAktif = false;
  let unitSelesaiCount = 0;

  const unitWithStatus = daftarUnit.map((unit, idx) => {
    // Cek apakah unit ini sudah selesai
    const sesi = sesiSelesaiMap.get(unit.id) || (unit.paketIdAsli ? sesiSelesaiMap.get(unit.paketIdAsli) : null);
    const sudahSelesai = Boolean(sesi);

    if (sudahSelesai) {
      unitSelesaiCount += 1;
      return {
        ...unit,
        status: 'completed',
        skor: sesi.totalSkorPersen ?? 0,
        xpDapat: sesi.xpFinal ?? 0,
        waktuSelesai: sesi.waktuSelesai || null,
        sesiId: sesi.id || null,
      };
    }

    // Jika belum ada yang aktif dan ini unit pertama yang belum selesai
    if (!ditemukanAktif) {
      ditemukanAktif = true;
      return {
        ...unit,
        status: 'current',
        skor: null,
      };
    }

    // Sisanya terkunci
    return {
      ...unit,
      status: 'locked',
      skor: null,
    };
  });

  return {
    unitList: unitWithStatus,
    totalUnit: daftarUnit.filter((u) => u.tipe !== 'review').length,
    selesaiCount: unitSelesaiCount,
    persentaseSelesai: Math.round((unitSelesaiCount / Math.max(1, daftarUnit.filter((u) => u.tipe !== 'review').length)) * 100),
  };
}

/**
 * Memastikan dokumen paket di tryout_paket ada dan valid sebelum siswa mulai mengerjakan.
 * Mencegah problem "bank soal kosong saat kuis dibuka".
 */
export async function pastikanPaketUnitTersedia(db, unit, jenjang = 'SMP') {
  if (!db || !unit || unit.tipe === 'review') return null;

  try {
    const paketRef = doc(db, 'tryout_paket', unit.id);
    const { getDoc } = await import('firebase/firestore');
    const snap = await getDoc(paketRef);

    if (snap.exists() && snap.data().daftarSoal?.length > 0) {
      return { id: snap.id, ...snap.data() };
    }

    // Jika paket belum ada, kita ambil dari bank_soal sesuai jenjang
    const snapBank = await getDocs(
      query(collection(db, 'bank_soal'), where('status', '==', 'aktif'))
    );

    const bankSoal = snapBank.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((s) => layakUntukTryOut(s));

    // Saring soal sesuai jenjang
    const jenjangCocok = bankSoal.filter((s) => {
      const sj = String(s.jenjang || '').toUpperCase();
      return sj.includes(jenjang.toUpperCase());
    });

    // Ambil sejumlah soal unit (misal 30 soal)
    const soalTerpilih = (jenjangCocok.length >= unit.jumlahSoal ? jenjangCocok : bankSoal)
      .slice(0, unit.jumlahSoal);

    const dataPaket = {
      nama: unit.judul,
      deskripsi: unit.deskripsi,
      jenjang: jenjang.toUpperCase(),
      targetKelas: jenjang.toUpperCase() === 'SD' ? '6 SD' : jenjang.toUpperCase() === 'SMP' ? '9 SMP' : '12 SMA',
      targetKategori: 'Semua',
      durasiMenit: unit.durasiMenit || 60,
      status: 'aktif',
      otomatis: false,
      jalurUjianAi: true,
      unitId: unit.id,
      unitNomor: unit.unitNomor,
      soalAcak: true,
      tampilkanPembahasan: true,
      antiCheatAktif: true,
      wajibKamera: false,
      daftarSoal: soalTerpilih,
      totalSoal: soalTerpilih.length,
      subtes: [
        {
          nama: unit.mapel || 'Subtes Utama',
          durasiMenit: unit.durasiMenit || 60,
          jumlahSoal: soalTerpilih.length,
        },
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(paketRef, dataPaket, { merge: true });
    return { id: unit.id, ...dataPaket };
  } catch (e) {
    console.error('Gagal memastikan paket unit tersedia:', e);
    return null;
  }
}
