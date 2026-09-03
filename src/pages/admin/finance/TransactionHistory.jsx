// src/pages/admin/finance/TransactionHistory.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { 
  collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, getDoc, where, getDocs, writeBatch
} from "firebase/firestore";
import { 
  Filter, Search, Edit3, Trash2, X, Save, RefreshCw, Calendar, Lock, Clock
} from 'lucide-react';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  // === FILTER ===
  const [filterType, setFilterType] = useState('Semua');
  const [filterMethod, setFilterMethod] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');

  // === EDIT ===
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState(null);

  // === PIN ===
  const [ownerPin, setOwnerPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  // 🔥 FIX KEAMANAN (race condition): defaultnya sekarang TRUE (dianggap
  // "PIN belum siap/belum terbukti ada") sampai getDoc() di bawah selesai
  // dan benar-benar mengonfirmasi ada PIN tersimpan. Sebelumnya default-nya
  // `false`, artinya selama getDoc() masih loading (async, walau cuma
  // sepersekian detik), sistem sempat "menganggap" PIN sudah diatur padahal
  // ownerPin masih '' -- kalau di jendela waktu itu ada yang buka modal
  // hapus/edit dan submit PIN kosong, pinInput ('') === ownerPin ('') jadi
  // COCOK dan aksi hapus/edit LOLOS tanpa PIN asli. Sekarang aman karena
  // defaultnya "belum diatur" dulu (tombol hapus/edit akan menolak & minta
  // atur PIN dulu) sampai konfirmasi dari Firestore datang.
  const [pinBelumDiatur, setPinBelumDiatur] = useState(true);

  useEffect(() => {
    getDoc(doc(db, "settings", "global_config")).then(snap => {
      // 🔥 FIX KEAMANAN: sebelumnya kalau admin belum pernah mengatur PIN,
      // sistem diam-diam pakai PIN default "2003" yang tertulis langsung
      // di kode JavaScript sisi client -- gampang ditemukan siapa saja
      // yang buka DevTools browser, sehingga proteksi hapus/edit transaksi
      // keuangan bisa dilewati begitu saja. Sekarang: kalau PIN belum
      // pernah diatur, TIDAK ADA PIN default yang dipakai -- hapus/edit
      // akan diblokir sepenuhnya sampai admin mengatur PIN asli di
      // halaman Pengaturan.
      if (snap.exists() && snap.data().ownerPin) {
        setOwnerPin(snap.data().ownerPin);
        setPinBelumDiatur(false);
      } else {
        setOwnerPin('');
        setPinBelumDiatur(true);
      }
    }).catch(() => {
      // 🔥 Kalau getDoc gagal (misal offline), JANGAN diam-diam anggap PIN
      // sudah siap -- tetap kunci hapus/edit demi keamanan.
      setOwnerPin('');
      setPinBelumDiatur(true);
    });

    // 🔥 FIX BUG NYATA (kelas yang sama dengan StudentFinance.jsx admin):
    // `orderBy("date")` + `orderBy("createdAt")` SEKALIGUS itu WAJIB
    // composite index tersendiri di Firestore -- kalau index itu belum
    // pernah dibuat di project ini, query ini SELALU GAGAL dilempar
    // sebagai error begitu halaman Riwayat dibuka (persis pola error
    // index yang dilaporkan di halaman lain). Sekarang `orderBy` dihapus
    // dari query Firestore (gak butuh index apa pun lagi, ambil semua
    // dokumen apa adanya) -- pengurutan "tanggal terbaru dulu, lalu jam
    // dibuat terbaru dulu" dipindah ke sisi JavaScript setelah data
    // berhasil diambil.
    // 🔥 BARU (KUNCI AKSES ADMIN): sebelumnya query ini narik SELURUH
    // finance_logs sejak awal berdirinya bisnis -- cuma disembunyikan di
    // UI lewat filter "bulan ini". Itu berarti data lengkapnya TETAP
    // terkirim ke browser admin (kelihatan kalau buka Network tab), dan
    // kalau ada yang paham cara buka DevTools, filter UI bisa gampang
    // diubah manual buat lihat bulan lain / semua data.
    // SEKARANG: query itu sendiri DIBATASI cuma bulan berjalan -- data
    // bulan lain TIDAK PERNAH dikirim ke halaman ini sama sekali, apa pun
    // yang diutak-atik di sisi client. Riwayat penuh cuma ada di Portal
    // Owner (OwnerFinance.jsx), yang punya jalur login terpisah.
    // (Catatan: ini baru "kunci praktis" di level kode. Penguncian
    // sungguhan di level Firestore Security Rules -- yang tidak bisa
    // ditembus sama sekali walau lewat DevTools -- baru bisa dipasang
    // setelah Admin & Owner login pakai Firebase Auth beneran, bukan PIN/
    // password yang dicocokkan manual seperti sekarang. Itu langkah
    // berikutnya yang sudah disepakati.)
    const now = new Date();
    const bulanIniAwal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const bulanDepan = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const bulanDepanAwal = `${bulanDepan.getFullYear()}-${String(bulanDepan.getMonth() + 1).padStart(2, '0')}-01`;
    const q = query(
      collection(db, "finance_logs"),
      where('date', '>=', bulanIniAwal),
      where('date', '<', bulanDepanAwal),
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const dateCompare = (b.date || '').localeCompare(a.date || '');
          if (dateCompare !== 0) return dateCompare;
          const aCreated = a.createdAt?.toMillis?.() || 0;
          const bCreated = b.createdAt?.toMillis?.() || 0;
          return bCreated - aCreated;
        });
      setTransactions(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // === FILTER LOGIC ===
  useEffect(() => {
    let result = [...transactions];

    if (filterType !== 'Semua') result = result.filter(t => t.type === filterType);
    if (filterMethod !== 'Semua') result = result.filter(t => t.method === filterMethod);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        (t.note || '').toLowerCase().includes(term) ||
        (t.category || '').toLowerCase().includes(term) ||
        (t.namaSiswa || '').toLowerCase().includes(term) ||
        String(t.amount || '').includes(term)
      );
    }

    setFiltered(result);
  }, [transactions, filterType, filterMethod, searchTerm]);

  // === TOTALS (mengikuti filter -- ini memang seharusnya per-periode) ===
  const totalMasuk = filtered.filter(t => t.type === 'Pemasukan').reduce((s, t) => s + (parseInt(t.amount) || 0), 0);
  const totalKeluar = filtered.filter(t => t.type === 'Pengeluaran').reduce((s, t) => s + (parseInt(t.amount) || 0), 0);

  // 🔥 BARU (KUNCI AKSES ADMIN): "Saldo Tunai/Bank (keseluruhan)" DIHAPUS
  // dari halaman admin ini -- itu sama persis dengan "Total Aset" yang
  // sengaja disembunyikan dari Admin (cuma Owner yang boleh lihat saldo
  // kas/bank kumulatif sejak awal). Karena query di atas sekarang cuma
  // ambil bulan berjalan, `transactions` juga otomatis cuma berisi bulan
  // ini -- jadi TIDAK ADA cara lagi buat halaman ini menghitung/menampilkan
  // saldo keseluruhan, bahkan secara tidak sengaja.
  const sedangDifilter = filterType !== 'Semua' || filterMethod !== 'Semua' || !!searchTerm;

  // 🔥 BARU: fungsi ini yang bikin finance_logs & data siswa TETAP NYAMBUNG
  // walau transaksinya diedit/dihapus belakangan. Sebelumnya, edit/hapus di
  // sini CUMA nyentuh dokumen finance_logs itu sendiri -- field totalBayar
  // di collection "students" gak pernah ikut disesuaikan, jadi begitu admin
  // ngoreksi kesalahan hitung, data siswa jadi gak sinkron lagi sama buku
  // besar keuangan (persis yang dialami).
  const adjustStudentTotalBayar = async (studentIdKodeUnik, delta) => {
    if (!studentIdKodeUnik || !delta) return;
    try {
      const q = query(collection(db, "students"), where("studentId", "==", studentIdKodeUnik));
      const snap = await getDocs(q);
      if (snap.empty) return; // siswanya gak ketemu (mungkin sudah dihapus), gak bisa disesuaikan
      const studentDoc = snap.docs[0];
      const current = parseInt(studentDoc.data().totalBayar || 0);
      const totalTagihan = parseInt(studentDoc.data().totalTagihan || 0);
      let newValue = current + delta;
      if (newValue < 0) newValue = 0; // jangan sampai minus
      if (totalTagihan > 0 && newValue > totalTagihan) newValue = totalTagihan; // jangan lebih dari total tagihan
      await updateDoc(doc(db, "students", studentDoc.id), { totalBayar: newValue });
    } catch (e) {
      console.error("Gagal menyesuaikan totalBayar siswa:", e);
    }
  };

  // 🔥 BARU: fungsi KHUSUS buat MEMBATALKAN transaksi "Perpanjangan Paket".
  // Ini beda dari adjustStudentTotalBayar() di atas -- satu transaksi
  // perpanjangan itu ngubah EMPAT hal sekaligus di data siswa (totalTagihan,
  // totalBayar, tanggalSelesai, durasiBulan), bukan cuma totalBayar doang.
  // Sebelumnya kalau transaksi kayak gini dihapus, CUMA totalBayar yang
  // kebalikin -- tiga field lainnya TETAP nyangkut ke versi yang salah
  // (laporan nyata: admin salah pilih 3 bulan, sudah dihapus/diedit
  // nominalnya, tapi tanggal selesai & durasi paket TETAP kebawa 3 bulan).
  // Sekarang SEMUA field yang kena dampak perpanjangan itu dibalikin
  // bareng, dalam SATU writeBatch (atomik, gak ada yang "setengah balik").
  const reversePerpanjangan = async (item) => {
    if (!item.studentId || !item.durasiTambah) {
      // Transaksi "Perpanjangan Paket" versi LAMA (dibuat sebelum field
      // durasiTambah ditambahkan) -- gak ada info pasti berapa bulan yang
      // harus dibalikin (tanggal selesai & durasi), jadi bagian ITU gak
      // bisa dibalikin otomatis. Admin tetap perlu cek manual buat itu.
      //
      // 🔥 FIX BUG NYATA (laporan langsung: "sudah dihapus tapi transaksi
      // gak hilang dari Riwayat, saldo juga gak berubah"): sebelumnya
      // jalur ini CUMA menyesuaikan totalBayar siswa lewat
      // adjustStudentTotalBayar() -- dokumen transaksinya sendiri di
      // finance_logs TIDAK PERNAH ikut dihapus. Akibatnya baris transaksi
      // ini nyangkut selamanya di Riwayat, dan Saldo Tunai/Bank (yang
      // dihitung dari SELURUH finance_logs) tetap menghitungnya sebagai
      // uang yang masih ada -- padahal dari sisi siswa sudah dianggap
      // "belum bayar" lagi. Dua sumber data jadi gak sinkron.
      // Sekarang penghapusan dokumen & penyesuaian totalBayar digabung
      // dalam SATU writeBatch (atomik, sama seperti jalur transaksi
      // modern) -- baris ini akan BENAR-BENAR hilang dari Riwayat, dan
      // Saldo langsung ikut menyesuaikan begitu diproses.
      const amountLama = parseInt(item.amount || 0);
      const isTunaiTransferLama = item.method === 'Tunai' || item.method === 'Transfer';
      const batchLama = writeBatch(db);

      if (isTunaiTransferLama && amountLama) {
        const qStudentLama = query(collection(db, "students"), where("studentId", "==", item.studentId));
        const snapLama = await getDocs(qStudentLama);
        if (!snapLama.empty) {
          const studentDocLama = snapLama.docs[0];
          const currentLama = parseInt(studentDocLama.data().totalBayar || 0);
          const totalTagihanLama = parseInt(studentDocLama.data().totalTagihan || 0);
          let newValueLama = currentLama - amountLama;
          if (newValueLama < 0) newValueLama = 0;
          if (totalTagihanLama > 0 && newValueLama > totalTagihanLama) newValueLama = totalTagihanLama;
          batchLama.update(doc(db, "students", studentDocLama.id), { totalBayar: newValueLama });
        }
      }
      batchLama.delete(doc(db, "finance_logs", item.id));
      await batchLama.commit();

      alert('⚠️ Transaksi lama ini sudah dihapus & total dibayar sudah disesuaikan. TAPI tetap CEK MANUAL tanggal selesai & durasi paket siswa ini di halaman Koreksi Data -- dua field itu TIDAK ikut dibalikkan otomatis untuk transaksi model lama seperti ini.');
      return;
    }

    const q = query(collection(db, "students"), where("studentId", "==", item.studentId));
    const snap = await getDocs(q);
    if (snap.empty) return;
    const studentDoc = snap.docs[0];
    const s = studentDoc.data();

    const amount = parseInt(item.amount || 0);
    const durasi = parseInt(item.durasiTambah || 0);

    // Balikin tanggalSelesai mundur sejumlah bulan yang sama seperti pas ditambahkan
    let newSelesai = null;
    if (s.tanggalSelesai) {
      const d = new Date(s.tanggalSelesai);
      d.setMonth(d.getMonth() - durasi);
      newSelesai = d.toISOString().split('T')[0];
    }

    const newTotalTagihan = Math.max(0, parseInt(s.totalTagihan || 0) - amount);
    // 🔥 totalBayar cuma ikut dikurangi kalau metode pembayaran perpanjangan
    // itu Tunai/Transfer -- SAMA PERSIS aturan pas awal ditambahkan di
    // handlePerpanjang() (StudentFinance.jsx): kalau metodenya Cicilan,
    // totalBayar TIDAK pernah ikut nambah waktu itu, jadi juga TIDAK boleh
    // ikut dikurangi sekarang (kalau dikurangi, malah jadi minus/salah).
    const isTunaiTransfer = item.method === 'Tunai' || item.method === 'Transfer';
    const newTotalBayar = isTunaiTransfer
      ? Math.max(0, parseInt(s.totalBayar || 0) - amount)
      : parseInt(s.totalBayar || 0);
    const newDurasiBulan = Math.max(0, parseInt(s.durasiBulan || 0) - durasi);

    const batch = writeBatch(db);
    batch.update(doc(db, "students", studentDoc.id), {
      totalTagihan: newTotalTagihan,
      totalBayar: newTotalBayar,
      durasiBulan: newDurasiBulan,
      ...(newSelesai ? { tanggalSelesai: newSelesai } : {}),
    });
    batch.delete(doc(db, "finance_logs", item.id));
    await batch.commit();

    if (item.method === 'Cicilan') {
      alert(`✅ Perpanjangan ${durasi} bulan dibatalkan & data siswa dikembalikan.\n\n⚠️ PENTING: perpanjangan ini metodenya Cicilan -- cek manual jadwal cicilan siswa ini (finance_tagihan), karena jadwal cicilan yang sempat dibuat dari perpanjangan ini TIDAK ikut terhapus otomatis (berisiko kalau sudah ada cicilan yang kadung dibayar).`);
    } else {
      alert(`✅ Perpanjangan ${durasi} bulan berhasil dibatalkan, data siswa (tagihan, tanggal selesai, durasi) sudah dikembalikan ke posisi semula.`);
    }
  };

  // === DELETE ===
  const confirmDelete = (item) => {
    if (pinBelumDiatur) {
      alert('⚠️ PIN Owner belum diatur. Atur PIN dulu di halaman Pengaturan sebelum bisa menghapus transaksi.');
      return;
    }
    setDeleteTarget(item);
    setPinInput('');
    setShowPinModal(true);
  };

  const handleDelete = async () => {
    // 🔥 FIX BUG KEAMANAN: PIN kosong TIDAK BOLEH dianggap valid, apapun
    // kondisinya. Tanpa guard ini, kalau ownerPin kebetulan belum termuat
    // (masih '') dan admin submit form tanpa isi PIN, pinInput ('') ===
    // ownerPin ('') akan LOLOS sebagai "PIN benar" padahal tidak ada PIN
    // yang benar-benar dicocokkan. Sekarang PIN kosong SELALU ditolak
    // duluan, sebelum sempat dibandingkan ke ownerPin.
    if (!pinInput) {
      alert('⛔ PIN harus diisi!');
      return;
    }
    if (pinBelumDiatur || !ownerPin) {
      alert('⚠️ PIN Owner belum diatur. Atur PIN dulu di halaman Pengaturan.');
      return;
    }
    if (pinInput !== ownerPin) {
      alert('⛔ PIN SALAH! Transaksi tidak bisa dihapus.');
      return;
    }
    if (!deleteTarget) return;
    
    try {
      // 🔥 FIX BUG NYATA UTAMA (laporan langsung dari pengguna): transaksi
      // "Perpanjangan Paket" ditangani BEDA dari transaksi biasa -- pakai
      // reversePerpanjangan() yang membalikkan SEMUA field terkait
      // (tagihan, dibayar, tanggal selesai, durasi), bukan cuma totalBayar
      // doang. Transaksi jenis lain (SPP/Cicilan reguler, dll) tetap pakai
      // jalur lama (cuma totalBayar) -- itu sudah benar buat kasus itu
      // karena pembayaran biasa emang gak ngubah tanggal/durasi paket.
      if (deleteTarget.category === 'Perpanjangan Paket' && deleteTarget.studentId) {
        await reversePerpanjangan(deleteTarget);
      } else {
        await deleteDoc(doc(db, "finance_logs", deleteTarget.id));
        // 🔥 Kalau transaksi yang dihapus ternyata pembayaran siswa (ada
        // studentId & tipenya Pemasukan), kurangi lagi totalBayar siswa itu --
        // biar gak keliatan siswa "udah bayar" padahal catatannya sudah
        // dihapus dari buku besar.
        if (deleteTarget.studentId && deleteTarget.type === 'Pemasukan') {
          await adjustStudentTotalBayar(deleteTarget.studentId, -parseInt(deleteTarget.amount || 0));
        }
        if (deleteTarget.studentId) {
          alert('✅ Transaksi berhasil dihapus! Data pembayaran siswa ikut disesuaikan.');
        } else {
          alert('✅ Transaksi berhasil dihapus!');
        }
      }

      setShowPinModal(false);
      setDeleteTarget(null);
    } catch (e) {
      alert('❌ Gagal menghapus: ' + e.message);
    }
  };

  // === EDIT ===
  const openEdit = (item) => {
    if (pinBelumDiatur) {
      alert('⚠️ PIN Owner belum diatur. Atur PIN dulu di halaman Pengaturan sebelum bisa mengedit transaksi.');
      return;
    }
    // 🔥 FIX BUG TERKAIT: transaksi "Perpanjangan Paket" SENGAJA gak boleh
    // diedit nominalnya langsung dari sini -- satu transaksi ini ngubah 4
    // field sekaligus di data siswa (tagihan/dibayar/tanggal selesai/
    // durasi) yang SALING BERGANTUNG dari nominal aslinya, jadi ngedit
    // nominal doang gak bisa nge-cascade ke 3 field lainnya secara akurat
    // (persis akar masalah yang dilaporkan). Kalau ada kesalahan input,
    // cara yang BENAR & AMAN adalah HAPUS transaksi ini (otomatis
    // membalikkan SEMUA field terkait, lihat reversePerpanjangan()) lalu
    // ulangi "Perpanjang Paket" dengan input yang benar dari awal.
    if (item.category === 'Perpanjangan Paket') {
      alert('⚠️ Transaksi "Perpanjangan Paket" tidak bisa diedit langsung di sini (nominalnya terkait ke tanggal selesai & durasi paket siswa).\n\nKalau ada kesalahan input, HAPUS transaksi ini (klik ikon tempat sampah) -- sistem akan otomatis membalikkan tagihan, tanggal selesai, dan durasi paket siswa ke posisi semula. Setelah itu, ulangi "Perpanjang Paket" dari halaman Keuangan Siswa dengan input yang benar.');
      return;
    }
    setPinInput('');
    // 🔥 Simpan nominal & tipe ASLI (sebelum diubah admin) di field terpisah,
    // biar nanti pas disimpan bisa dihitung SELISIHNYA buat disesuaikan ke
    // totalBayar siswa (bukan cuma menimpa dengan nilai baru begitu saja).
    setEditData({...item, _originalAmount: parseInt(item.amount || 0), _originalType: item.type});
    setShowEdit(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    // 🔥 FIX BUG KEAMANAN (sama seperti handleDelete): PIN kosong tidak
    // boleh lolos hanya karena ownerPin belum termuat.
    if (!pinInput) {
      alert('⛔ PIN harus diisi!');
      return;
    }
    if (pinBelumDiatur || !ownerPin) {
      alert('⚠️ PIN Owner belum diatur. Atur PIN dulu di halaman Pengaturan.');
      return;
    }
    if (pinInput !== ownerPin) {
      alert('⛔ PIN SALAH! Tidak bisa mengedit transaksi.');
      return;
    }
    try {
      const newAmount = parseInt(editData.amount) || 0;
      await updateDoc(doc(db, "finance_logs", editData.id), {
        date: editData.date,
        type: editData.type,
        category: editData.category,
        amount: newAmount,
        method: editData.method,
        note: editData.note
      });

      // 🔥 FIX BUG NYATA (celah yang kelewat dari perbaikan sebelumnya):
      // logika lama CUMA nyesuain totalBayar siswa kalau tipe transaksi
      // TETAP "Pemasukan" dari awal sampai akhir (`_originalType ===
      // 'Pemasukan' && type === 'Pemasukan'`). Kalau admin mengoreksi
      // TIPE-nya juga (misal transaksi yang tadinya salah dicatat sebagai
      // "Pengeluaran" padahal harusnya "Pemasukan" dari siswa, atau
      // sebaliknya), penyesuaian ke totalBayar siswa SAMA SEKALI GAK
      // KE-TRIGGER -- data siswa tetap nyangkut ke nilai lama padahal
      // transaksinya udah dikoreksi. Sekarang keempat kombinasi transisi
      // tipe ditangani eksplisit:
      // - Pemasukan -> Pemasukan: sesuaikan SELISIH nominal (seperti sebelumnya)
      // - Pemasukan -> Pengeluaran: batalkan SELURUH nominal lama (bukan lagi dianggap bayaran siswa)
      // - Pengeluaran -> Pemasukan: tambahkan SELURUH nominal baru (baru sekarang dianggap bayaran siswa)
      // - Pengeluaran -> Pengeluaran: gak ada dampak ke totalBayar siswa (tetap seperti sebelumnya)
      let pesanTambahan = '';
      if (editData.studentId) {
        const wasIncome = editData._originalType === 'Pemasukan';
        const isIncome = editData.type === 'Pemasukan';
        let delta = 0;
        if (wasIncome && isIncome) {
          delta = newAmount - editData._originalAmount;
        } else if (wasIncome && !isIncome) {
          delta = -editData._originalAmount;
        } else if (!wasIncome && isIncome) {
          delta = newAmount;
        }
        // else: Pengeluaran -> Pengeluaran, delta tetap 0, gak ada aksi
        if (delta !== 0) {
          await adjustStudentTotalBayar(editData.studentId, delta);
          pesanTambahan = ' Data pembayaran siswa ikut disesuaikan.';
        }
      }

      setShowEdit(false);
      alert('✅ Transaksi berhasil diupdate!' + pesanTambahan);
    } catch (err) {
      alert('❌ Gagal: ' + err.message);
    }
  };

  // === FORMAT TIMESTAMP ===
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    try {
      if (timestamp.toDate) {
        const date = timestamp.toDate();
        return date.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
      if (typeof timestamp === 'string') {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
      return '-';
    } catch (e) {
      return '-';
    }
  };

  // === FORMAT TANGGAL LENGKAP ===
  const formatFullDate = (dateStr) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
  };

  // 🔥 BARU (KUNCI AKSES ADMIN): fungsi exportPDF & exportExcel DIHAPUS
  // dari halaman admin ini sesuai permintaan -- admin tidak boleh
  // mengunduh laporan keuangan dalam bentuk apa pun (PDF/Excel), baik
  // riwayat bulan berjalan maupun lainnya. Kalau nanti Owner butuh fitur
  // export, itu ditambahkan terpisah di OwnerFinance.jsx (portal Owner),
  // bukan di sini.

  if (loading) return <div style={{textAlign: 'center', padding: 50, color: '#94a3b8'}}>Memuat data transaksi...</div>;

  return (
    <div>
      {/* === FILTER BAR === */}
      {/* 🔥 BARU (KUNCI AKSES ADMIN): dropdown pilih bulan/rentang tanggal
          bebas DIHAPUS -- data yang bisa dilihat di sini memang sudah
          dikunci cuma bulan berjalan sejak dari query-nya (lihat useEffect
          di atas), jadi tidak ada lagi yang perlu "dipilih". Tombol Export
          PDF/Excel juga dihapus total. */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '10px 14px', borderRadius: 10, marginBottom: 12, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Lock size={14} /> Menampilkan riwayat bulan berjalan saja. Untuk riwayat lengkap & unduh laporan, hubungi Owner.
      </div>
      <div style={styles.filterBar}>
        <div style={styles.filterGroup}>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={styles.filterSelect}>
            <option value="Semua">Semua Tipe</option>
            <option value="Pemasukan">💰 Pemasukan</option>
            <option value="Pengeluaran">📤 Pengeluaran</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} style={styles.filterSelect}>
            <option value="Semua">Semua Metode</option>
            <option value="Tunai">💵 Tunai</option>
            <option value="Transfer">💳 Transfer</option>
          </select>
        </div>

        <div style={{...styles.filterGroup, flex: 2}}>
          <div style={styles.searchBox}>
            <Search size={14} color="#94a3b8" />
            <input type="text" placeholder="Cari keterangan, kategori, nominal..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={styles.searchInput} />
            {searchTerm && <button onClick={() => setSearchTerm('')} style={styles.clearBtn}>✕</button>}
          </div>
        </div>
      </div>

      {/* === SUMMARY === */}
      {pinBelumDiatur && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: 10, marginBottom: 12, fontSize: 12, fontWeight: 600 }}>
          ⚠️ PIN Owner belum diatur — hapus & edit transaksi diblokir sampai PIN diatur di halaman Pengaturan.
        </div>
      )}
      <div style={styles.summaryRow}>
        <div style={styles.summaryCard('#f0fdf4', '#10b981')}>
          <span>Total Masuk {sedangDifilter && '(periode ini)'}</span>
          <strong>Rp {totalMasuk.toLocaleString()}</strong>
        </div>
        <div style={styles.summaryCard('#fef2f2', '#ef4444')}>
          <span>Total Keluar {sedangDifilter && '(periode ini)'}</span>
          <strong>Rp {totalKeluar.toLocaleString()}</strong>
        </div>
      </div>

      {/* === TABLE === */}
      <div style={styles.tableCard}>
        <div style={{overflowX: 'auto'}}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thr}>
                <th style={styles.th}>Tanggal</th>
                <th style={styles.th}>Jam</th>
                <th style={styles.th}>Tipe</th>
                <th style={styles.th}>Metode</th>
                <th style={styles.th}>Kategori</th>
                <th style={styles.th}>Keterangan</th>
                <th style={{...styles.th, textAlign: 'right'}}>Nominal</th>
                <th style={{...styles.th, textAlign: 'center'}}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{textAlign: 'center', padding: 40, color: '#94a3b8'}}>
                    Tidak ada data untuk filter ini
                  </td>
                </tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={styles.dateText}>{formatFullDate(t.date)}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.timeText}>
                        <Clock size={10} /> {formatTimestamp(t.createdAt)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.typeBadge(t.type)}>
                        {t.type === 'Pemasukan' ? '💰 Masuk' : '📤 Keluar'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.methodBadge(t.method)}>
                        {t.method === 'Tunai' ? '💵' : '💳'} {t.method}
                      </span>
                    </td>
                    <td style={styles.td}>{t.category}</td>
                    <td style={{...styles.td, fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                      {t.note || '-'}
                    </td>
                    <td style={{
                      ...styles.td, textAlign: 'right', fontWeight: 'bold',
                      color: t.type === 'Pemasukan' ? '#10b981' : '#ef4444'
                    }}>
                      {t.type === 'Pengeluaran' ? '- ' : '+ '}Rp {(parseInt(t.amount) || 0).toLocaleString()}
                    </td>
                    <td style={{...styles.td, textAlign: 'center'}}>
                      <div style={{display: 'flex', gap: 4, justifyContent: 'center'}}>
                        <button onClick={() => openEdit(t)} style={styles.btnIcon('#f59e0b')} title="Edit">
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => confirmDelete(t)} style={styles.btnIcon('#ef4444')} title="Hapus">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* === MODAL EDIT === */}
      {showEdit && editData && (
        <div style={styles.modalOverlay} onClick={() => setShowEdit(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{margin: 0}}>✏️ Edit Transaksi</h3>
              <button onClick={() => setShowEdit(false)} style={styles.closeBtn}><X size={18} /></button>
            </div>
            <form onSubmit={handleEdit} style={{display: 'flex', flexDirection: 'column', gap: 10}}>
              {editData.studentId && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600 }}>
                  🔗 Transaksi ini terhubung ke siswa: <b>{editData.namaSiswa || editData.studentId}</b>. Kalau nominal diubah, data pembayaran siswa ikut disesuaikan otomatis.
                </div>
              )}
              <input type="date" value={editData.date} onChange={e => setEditData(p => ({...p, date: e.target.value}))} style={styles.modalInput} />
              <select value={editData.type} onChange={e => setEditData(p => ({...p, type: e.target.value}))} style={styles.modalInput}>
                <option value="Pemasukan">💰 Pemasukan</option>
                <option value="Pengeluaran">📤 Pengeluaran</option>
              </select>
              <select value={editData.method} onChange={e => setEditData(p => ({...p, method: e.target.value}))} style={styles.modalInput}>
                <option value="Tunai">💵 Tunai</option>
                <option value="Transfer">💳 Transfer</option>
              </select>
              <input type="text" value={editData.category} onChange={e => setEditData(p => ({...p, category: e.target.value}))} style={styles.modalInput} placeholder="Kategori" />
              <input type="number" value={editData.amount} onChange={e => setEditData(p => ({...p, amount: e.target.value}))} style={styles.modalInput} placeholder="Nominal" />
              <input type="text" value={editData.note} onChange={e => setEditData(p => ({...p, note: e.target.value}))} style={styles.modalInput} placeholder="Keterangan" />
              
              <div style={{background: '#fef3c7', padding: 10, borderRadius: 8, border: '1px solid #fde68a'}}>
                <label style={{fontSize: 11, fontWeight: 'bold', color: '#b45309', display: 'flex', alignItems: 'center', gap: 6}}>
                  <Lock size={12} /> PIN Owner
                </label>
                <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} style={styles.modalInput} placeholder="Masukkan PIN" required maxLength={6} />
              </div>

              <div style={{display: 'flex', gap: 8}}>
                <button type="button" onClick={() => setShowEdit(false)} style={{flex:1, padding:12, borderRadius:10, border:'1px solid #e2e8f0', background:'white', fontWeight:'bold'}}>Batal</button>
                <button type="submit" style={{flex:2, padding:12, borderRadius:10, border:'none', background:'#f59e0b', color:'white', fontWeight:'bold'}}><Save size={14} /> Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === MODAL PIN UNTUK HAPUS === */}
      {showPinModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPinModal(false)}>
          <div style={{...styles.modalContent, maxWidth: 350}} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: 8}}>
                <Lock size={18} color="#ef4444" /> Konfirmasi Hapus
              </h3>
              <button onClick={() => setShowPinModal(false)} style={styles.closeBtn}><X size={18} /></button>
            </div>
            <p style={{fontSize: 13, color: '#64748b', marginBottom: 15}}>
              Masukkan PIN Owner untuk menghapus transaksi ini. <br/>
              <strong style={{color: '#ef4444'}}>⚠️ Tindakan ini tidak bisa dibatalkan!</strong>
            </p>
            <input 
              type="password" 
              value={pinInput} 
              onChange={e => setPinInput(e.target.value)} 
              style={styles.modalInput} 
              placeholder="******" 
              maxLength={6} 
              autoFocus 
            />
            <div style={{display: 'flex', gap: 8, marginTop: 10}}>
              <button onClick={() => setShowPinModal(false)} style={{flex:1, padding:12, borderRadius:10, border:'1px solid #e2e8f0', background:'white', fontWeight:'bold'}}>Batal</button>
              <button onClick={handleDelete} style={{flex:1, padding:12, borderRadius:10, border:'none', background:'#ef4444', color:'white', fontWeight:'bold'}}>
                <Trash2 size={14} /> Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

// === STYLES ===
const styles = {
  filterBar: { display: 'flex', gap: 8, marginBottom: 15, flexWrap: 'wrap', alignItems: 'flex-end' },
  filterGroup: { flex: 1, minWidth: 130, display: 'flex', flexDirection: 'column', gap: 3 },
  filterLabel: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8' },
  filterSelect: { padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, background: 'white', width: '100%', boxSizing: 'border-box' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white' },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: 12, background: 'transparent' },
  clearBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 },
  btnExport: (color) => ({ padding: '10px 14px', borderRadius: 8, background: color, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 11, whiteSpace: 'nowrap', alignSelf: 'flex-end' }),
  
  summaryRow: { display: 'flex', gap: 10, marginBottom: 15, flexWrap: 'wrap' },
  summaryCard: (bg, color) => ({ flex: 1, minWidth: 150, background: bg, padding: 14, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${color}30`, fontSize: 13 }),
  
  tableCard: { background: 'white', borderRadius: 14, padding: 15, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 850 },
  thr: { background: '#f8fafc', textAlign: 'left' },
  th: { padding: '10px 12px', fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: '0.2s' },
  td: { padding: '10px 12px', fontSize: 12, verticalAlign: 'middle' },
  
  dateText: { fontSize: 12, fontWeight: 600, color: '#1e293b' },
  timeText: { fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 },
  
  typeBadge: (type) => ({ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 'bold', background: type === 'Pemasukan' ? '#dcfce7' : '#fee2e2', color: type === 'Pemasukan' ? '#166534' : '#991b1b' }),
  methodBadge: (method) => ({ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 'bold', background: method === 'Tunai' ? '#fef3c7' : '#e0e7ff', color: method === 'Tunai' ? '#b45309' : '#3730a3' }),
  btnIcon: (color) => ({ background: `${color}15`, color, border: 'none', padding: '7px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }),
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20, backdropFilter: 'blur(2px)' },
  modalContent: { background: 'white', borderRadius: 14, padding: 24, width: '100%', maxWidth: 420, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' },
  modalInput: { width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', background: '#f8fafc' },
  closeBtn: { background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }
};

export default TransactionHistory;