import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, query, onSnapshot, getDocs, where } from "firebase/firestore";
import { 
  Eye, EyeOff, TrendingUp, TrendingDown,
  CreditCard, AlertCircle, Users, ArrowRight, DollarSign,
  Calendar, RefreshCw, MessageCircle
} from 'lucide-react';

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const [privacyMode, setPrivacyMode] = useState(true);
  const [loading, setLoading] = useState(true);
  
  // Statistik bulan ini
  // 🔥 FIX BUG NYATA (uang kehitung dua kali): field `pemasukan` di sini
  // sekarang artinya "uang yang BENERAN DITERIMA bulan ini" (Tunai +
  // Transfer + data lama tanpa metode) -- TIDAK lagi mencakup komitmen
  // perpanjangan jalur cicilan yang dicatat full amount saat akad padahal
  // uangnya belum masuk (dan nanti kehitung sekali lagi waktu tiap
  // cicilannya beneran dibayar). Komitmen itu sekarang dipisah ke field
  // `cicilan` dan cuma tampil sebagai keterangan "belum diterima".
  const [monthStats, setMonthStats] = useState({ pemasukan: 0, pengeluaran: 0, cicilan: 0, setorKas: 0 });

  // 🔥 BARU (RINCIAN TUNAI vs TRANSFER): sebelumnya halaman ini cuma
  // nampilin TOTAL "Pemasukan Bulan Ini" & "Pengeluaran Bulan Ini" --
  // uang tunai dan transfer DICAMPUR jadi satu angka, jadi admin gak
  // pernah bisa lihat jelas "berapa yang masuk lewat tunai, berapa yang
  // lewat transfer bulan ini" tanpa ngitung manual satu-satu dari tab
  // Riwayat. Sekarang setiap transaksi bulan berjalan otomatis
  // dipecah per metode (Tunai / Transfer / Cicilan) dari sumber data
  // yang SAMA (finance_logs, real-time) -- bukan query tambahan.
  // null = masih loading (beda dengan "sudah loaded tapi kosong").
  const [methodStats, setMethodStats] = useState(null);
  
  // Piutang
  const [totalPiutang, setTotalPiutang] = useState(0);
  const [debtors, setDebtors] = useState([]);
  
  // Siswa baru belum bayar
  const [newStudents, setNewStudents] = useState([]);

  // 🔥 BARU: siswa yang masa aktif paketnya sudah habis / akan habis dalam 7 hari
  const [expiringStudents, setExpiringStudents] = useState([]);

  useEffect(() => {
    // 🔥 BARU (KUNCI AKSES ADMIN): sama seperti TransactionHistory.jsx --
    // query ini sekarang DIBATASI cuma bulan berjalan di sumbernya,
    // bukan cuma disembunyikan di tampilan. "Total Aset" (saldo tunai+bank
    // keseluruhan sejak awal) DIHAPUS dari dashboard ini -- itu cuma
    // boleh dilihat Owner lewat portalnya sendiri.
    const now = new Date();
    const bulanIniAwal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const bulanDepan = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const bulanDepanAwal = `${bulanDepan.getFullYear()}-${String(bulanDepan.getMonth() + 1).padStart(2, '0')}-01`;
    const qLogs = query(
      collection(db, "finance_logs"),
      where('date', '>=', bulanIniAwal),
      where('date', '<', bulanDepanAwal),
    );
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      let pemasukanDiterima = 0, pengeluaranBulanIni = 0, cicilanTercatat = 0;
      // 🔥 BARU (modul setor kas): total uang tunai yang SUDAH DISETOR
      // admin ke owner bulan ini (log type 'Transfer' kanalDari kasAdmin).
      // Ini BUKAN pengeluaran -- uangnya cuma pindah dari brankas admin
      // ke kas owner. Tapi brankas admin jelas berkurang karenanya, jadi
      // kartu "Uang Tunai di Brankas" di bawah harus mengurangkannya.
      let setorKasAdmin = 0;

      // 🔥 BARU (RINCIAN TUNAI vs TRANSFER): pecah total bulan ini per
      // metode pembayaran. "Lainnya" = penjaga buat data lama yang
      // field method-nya kosong/aneh -- biar nominalnya gak "hilang"
      // diam-diam dari rincian (total kartu di atas tetap mencakup
      // semua, jadi rincian di bawah harus bisa dicocokkan ke total).
      const perMetode = {
        Tunai:    { masuk: 0, keluar: 0, nMasuk: 0, nKeluar: 0 },
        Transfer: { masuk: 0, keluar: 0, nMasuk: 0, nKeluar: 0 },
        Cicilan:  { masuk: 0, keluar: 0, nMasuk: 0, nKeluar: 0 },
        Lainnya:  { masuk: 0, keluar: 0, nMasuk: 0, nKeluar: 0 },
      };

      snap.forEach(doc => {
        const data = doc.data();
        const amt = parseInt(data.amount || 0);
        // 🔥 FIX (modul setor kas): log type 'Transfer' (Tutup Kasir) itu
        // uang PINDAH kantong, bukan pemasukan/pengeluaran. Sebelumnya
        // (sebelum fitur setor kas ada) type ini tidak pernah muncul; kalau
        // dibiarkan masuk cabang else, tiap setoran bakal kehitung sebagai
        // "Pengeluaran Bulan Ini" -- angka belanja admin menggelembung
        // palsu dan tidak cocok dengan Portal Owner.
        if (data.type === 'Transfer') {
          if ((data.kanalDari || 'kasAdmin') === 'kasAdmin') setorKasAdmin += amt;
          return;
        }
        const bucket = perMetode[data.method] ? data.method : 'Lainnya';
        if (data.type === 'Pemasukan') {
          // 🔥 FIX BUG NYATA (pemasukan kembar): Pemasukan ber-method
          // 'Cicilan' itu KOMITMEN perpanjangan yang uangnya belum diterima
          // -- tiap cicilannya nanti dicatat LAGI sebagai Pemasukan
          // Tunai/Transfer saat beneran dibayar. Kalau keduanya dijumlahkan
          // ke satu angka "Pemasukan Bulan Ini", totalnya gak akan pernah
          // cocok dengan uang riil maupun dengan rincian tunai/transfer di
          // bawah (persis kebingungan yang dilaporkan). Sekarang dipisah.
          if (data.method === 'Cicilan') cicilanTercatat += amt;
          else pemasukanDiterima += amt;
          perMetode[bucket].masuk += amt;
          perMetode[bucket].nMasuk += 1;
        } else {
          pengeluaranBulanIni += amt;
          perMetode[bucket].keluar += amt;
          perMetode[bucket].nKeluar += 1;
        }
      });

      setMonthStats({ pemasukan: pemasukanDiterima, pengeluaran: pengeluaranBulanIni, cicilan: cicilanTercatat, setorKas: setorKasAdmin });
      setMethodStats(perMetode);
    });

    // Fetch piutang & siswa baru
    const fetchDebtsAndNew = async () => {
      try {
        const snap = await getDocs(collection(db, "students"));
        let totalHutang = 0;
        let listNunggak = [];
        let listBaru = [];
        // 🔥 BARU: daftar siswa yang masa aktif paketnya SUDAH HABIS atau
        // AKAN habis dalam 7 hari -- sebelumnya status ini CUMA dihitung
        // di StudentList.jsx (kekubur di kolom tabel panjang, gampang
        // kelewat), gak pernah muncul sebagai peringatan yang menonjol di
        // "Pusat Kontrol Keuangan" ini -- padahal siswa yang masa
        // aktifnya habis itu jelas urusan keuangan (perlu diperpanjang/
        // ditagih). Logika ambang batasnya SAMA PERSIS dengan
        // getMasaAktifStatus() di StudentList.jsx, biar konsisten.
        let listHabisMasa = [];
        const todayForExpiry = new Date();
        todayForExpiry.setHours(0, 0, 0, 0);
        
        snap.forEach(doc => {
          const d = doc.data();
          const total = parseInt(d.totalTagihan || 0);
          const bayar = parseInt(d.totalBayar || 0);
          const sisa = total - bayar;
          
          if (sisa > 0) {
            totalHutang += sisa;
            listNunggak.push({ 
              id: doc.id, 
              nama: d.nama, 
              sisa: sisa, 
              studentId: d.studentId,
              kelas: d.kelasSekolah || '-' 
            });
          }

          // Siswa baru (7 hari terakhir) yang belum bayar
          const createdAt = d.createdAt?.toDate?.();
          if (createdAt) {
            const diffDays = (new Date() - createdAt) / (1000 * 60 * 60 * 24);
            if (diffDays <= 7 && bayar === 0) {
              listBaru.push({
                id: doc.id,
                nama: d.nama,
                studentId: d.studentId,
                totalTagihan: total
              });
            }
          }

          // 🔥 BARU: cek masa aktif paket -- sama seperti perpanjangan,
          // siswa yang di-nonaktifkan (isBlocked) sengaja dilewati (sudah
          // ditangani manual oleh admin, gak perlu diingatkan lagi).
          if (d.tanggalSelesai && !d.isBlocked) {
            const selesai = new Date(d.tanggalSelesai);
            selesai.setHours(0, 0, 0, 0);
            const diffDaysExpiry = Math.ceil((selesai - todayForExpiry) / (1000 * 60 * 60 * 24));
            if (diffDaysExpiry <= 7) {
              listHabisMasa.push({
                id: doc.id,
                nama: d.nama,
                studentId: d.studentId,
                tanggalSelesai: d.tanggalSelesai,
                diffDays: diffDaysExpiry,
                sudahHabis: diffDaysExpiry < 0,
                // 🔥 BARU: dibawa juga buat tombol "Kirim WA" -- field ini
                // sama yang dipakai di AddStudent.jsx (`noHp`, sudah
                // dinormalisasi ke format 628xxx saat pendaftaran).
                // 🔥 FIX BUG NYATA: sebelumnya cuma baca `d.noHp` (field
                // level-atas). Nomor HP orang tua ternyata bisa tersimpan
                // di DUA jalur beda tergantung KAPAN siswa itu didaftar/
                // diedit -- `noHp` (level atas, dipakai tombol WA ini) ATAU
                // `ortu.hp` (bersarang, dipakai halaman Edit Siswa). Kalau
                // data siswa itu KEBETULAN cuma punya `ortu.hp` terisi
                // (mis. didaftarkan/diedit sebelum field noHp level-atas
                // ikut disinkronkan), tombol WA gak akan pernah muncul
                // padahal nomornya BENERAN ADA di data siswa itu -- cuma
                // dibaca dari jalur yang salah. Sekarang dicek DUA-DUANYA,
                // mana yang keisi dulu itu yang dipakai.
                noHp: d.noHp || d.ortu?.hp || '',
              });
            }
          }
        });
        
        setTotalPiutang(totalHutang);
        setDebtors(listNunggak.sort((a, b) => b.sisa - a.sisa).slice(0, 5));
        setNewStudents(listBaru);
        // Urutkan yang paling mendesak dulu (sudah lewat paling lama, baru yang mau habis)
        setExpiringStudents(listHabisMasa.sort((a, b) => a.diffDays - b.diffDays));
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    
    fetchDebtsAndNew();
    return () => unsubLogs();
  }, []);

  const rp = (num) => privacyMode ? "Rp ••••••••" : "Rp " + (num || 0).toLocaleString('id-ID');

  // 🔥 BARU: nama bulan berjalan buat judul panel rincian (mis. "September 2026"),
  // biar admin selalu tau rincian tunai/transfer yang dilihat itu bulan apa.
  const namaBulanIni = () => new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // 🔥 BARU: bikin link WhatsApp (wa.me) buat ngirim pengingat masa aktif
  // habis -- ini BUKAN integrasi WhatsApp API berbayar, cuma "nitip buka"
  // ke WhatsApp yang udah admin pakai sendiri (Web/App, tergantung
  // device), dengan nomor orang tua & draft pesan udah keisi otomatis.
  // Admin TETAP yang review & tekan kirim di WhatsApp-nya sendiri -- bukan
  // sistem yang otomatis ngirim tanpa sepengetahuan admin.
  const buildWaLink = (s) => {
    if (!s.noHp) return null;
    const pesan = s.sudahHabis
      ? `Halo, kami dari Bimbel Gemilang ingin menginformasikan bahwa masa aktif paket belajar ananda ${s.nama} sudah berakhir sejak ${new Date(s.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}. Mohon segera melakukan perpanjangan agar ananda dapat tetap mengikuti kegiatan belajar. Terima kasih 🙏`
      : `Halo, kami dari Bimbel Gemilang ingin mengingatkan bahwa masa aktif paket belajar ananda ${s.nama} akan berakhir pada ${new Date(s.tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} (${s.diffDays} hari lagi). Mohon kesediaannya untuk melakukan perpanjangan sebelum tanggal tersebut. Terima kasih 🙏`;
    // 🔥 FIX BUG NYATA: sebelumnya pakai format link "wa.me/{nomor}?text=..."
    // -- format ini didesain awalnya buat deep-link ke APLIKASI WhatsApp
    // (mobile/desktop app), dan pas dibuka dari BROWSER DESKTOP (kasus
    // admin yang makai WA Web), redirect-nya ke web.whatsapp.com KADANG
    // GAK STABIL -- parameter nomor & pesannya bisa "ilang" di tengah
    // proses redirect, jadi WA Web kebuka KOSONG tanpa nomor/pesan
    // ke-isi (persis laporan "tombol ijo blank"). Sekarang pakai format
    // "api.whatsapp.com/send" -- ini format resmi dari Meta yang memang
    // ditujukan buat alur WEB (bukan app deep-link), jauh lebih stabil
    // buat kasus admin yang bukanya lewat WA Web di browser.
    return `https://api.whatsapp.com/send?phone=${s.noHp}&text=${encodeURIComponent(pesan)}`;
  };

  return (
    <div>
      {/* HEADER */}
      <div style={styles.headerRow}>
        <h2 style={styles.pageTitle}>📊 Pusat Kontrol Keuangan</h2>
        <button onClick={() => setPrivacyMode(!privacyMode)} style={styles.privacyBtn(privacyMode)}>
          {privacyMode ? <><Eye size={16} /> Tampilkan</> : <><EyeOff size={16} /> Sembunyikan</>}
        </button>
      </div>

      {/* === SMART CARDS === */}
      {/* 🔥 BARU (KUNCI AKSES ADMIN): kartu "Total Aset" (saldo tunai+bank
          keseluruhan sejak awal) DIHAPUS dari dashboard admin -- cuma
          boleh dilihat lewat Portal Owner. */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 12, fontWeight: 600 }}>
        🔒 Menampilkan statistik bulan berjalan saja. Saldo/aset keseluruhan hanya tersedia di Portal Owner.
      </div>
      <div style={styles.cardGrid}>
        {/* 🔥 BARU (ANTI-BINGUNG): kartu pertama sekarang "UANG TUNAI DI
            BRANKAS" = selisih tunai bulan berjalan (masuk tunai dikurang
            keluar tunai). Sebelumnya kartu pertama adalah "Pemasukan Bulan
            Ini (uang diterima)" yang menampilkan angka GABUNGAN tunai +
            transfer (misal 16 juta) -- admin kaget karena uang fisik yang
            bisa dihitung di brankas cuma porsi tunainya (misal 8,2 juta);
            angka gabungan itu terbaca seolah-olah uang kas fisik. Sekarang
            angka gabungan tetap ada tapi pindah ke catatan berlabel jelas
            di bawah kartu, dan posisi uang riil (brankas & rekening) jadi
            bintang utamanya. */}
        <div style={styles.mediumCard('#f0fdf4', '#10b981')}>
          <TrendingUp size={20} color="#10b981" />
          <span style={styles.mediumLabel}>💵 Uang Tunai di Brankas (selisih bulan ini)</span>
          <h2 style={{...styles.mediumValue, color: '#10b981'}}>
            {methodStats ? rp(methodStats.Tunai.masuk - methodStats.Tunai.keluar - monthStats.setorKas) : rp(0)}
          </h2>
          {methodStats && (
            <div style={styles.cardSplit}>
              <span>Masuk tunai: <b>{rp(methodStats.Tunai.masuk)}</b></span>
              <span>Keluar tunai: <b>{rp(methodStats.Tunai.keluar)}</b></span>
              {/* 🔥 BARU (modul setor kas): uang yang sudah disetor ke owner
                  juga MENGURANGI brankas -- kalau tidak ditampilkan, admin
                  bingung kenapa hitungan brankas tidak sama dengan
                  masuk-keluar tunai. Setoran bukan pengeluaran (uangnya
                  pindah ke kas owner), tapi fisik uangnya memang keluar
                  dari brankas admin. */}
              {monthStats.setorKas > 0 && <span>🔁 Sudah disetor ke owner: <b>{rp(monthStats.setorKas)}</b></span>}
            </div>
          )}
          <span style={{display: 'block', fontSize: 10, color: '#047857', fontWeight: 700, marginTop: 6, lineHeight: 1.4}}>
            Uang fisik yang bisa dihitung di brankas bulan ini -- uang transfer tidak termasuk (masuknya ke rekening).
          </span>
        </div>

        {/* 🔥 BARU (ANTI-BINGUNG): kartu uang transfer dipisah dari brankas
            biar admin tidak menjumlahkannya sebagai uang kas fisik. */}
        <div style={styles.mediumCard('#eef2ff', '#6366f1')}>
          <CreditCard size={20} color="#6366f1" />
          <span style={styles.mediumLabel}>💳 Uang Transfer di Rekening (selisih bulan ini)</span>
          <h2 style={{...styles.mediumValue, color: '#6366f1'}}>
            {methodStats ? rp(methodStats.Transfer.masuk - methodStats.Transfer.keluar) : rp(0)}
          </h2>
          {methodStats && (
            <div style={styles.cardSplit}>
              <span>Masuk transfer: <b>{rp(methodStats.Transfer.masuk)}</b></span>
              <span>Keluar transfer: <b>{rp(methodStats.Transfer.keluar)}</b></span>
            </div>
          )}
          <span style={{display: 'block', fontSize: 10, color: '#4338ca', fontWeight: 700, marginTop: 6, lineHeight: 1.4}}>
            Masuknya ke rekening bank, bukan ke brankas -- jadi sengaja dipisah dari kartu hijau.
          </span>
        </div>

        {/* Pengeluaran Bulan Ini */}
        <div style={styles.mediumCard('#fef2f2', '#ef4444')}>
          <TrendingDown size={20} color="#ef4444" />
          <span style={styles.mediumLabel}>Pengeluaran Bulan Ini</span>
          <h2 style={{...styles.mediumValue, color: '#ef4444'}}>{rp(monthStats.pengeluaran)}</h2>
          {/* 🔥 BARU: pecahan tunai vs transfer juga buat pengeluaran. */}
          {methodStats && (
            <div style={styles.cardSplit}>
              <span>💵 Tunai: <b>{rp(methodStats.Tunai.keluar)}</b></span>
              <span>💳 Transfer: <b>{rp(methodStats.Transfer.keluar)}</b></span>
              {methodStats.Lainnya.keluar > 0 && <span>❔ Lainnya: <b>{rp(methodStats.Lainnya.keluar)}</b></span>}
            </div>
          )}
        </div>

        {/* Total Piutang */}
        <div style={styles.mediumCard('#fff7ed', '#f97316')}>
          <AlertCircle size={20} color="#f97316" />
          <span style={styles.mediumLabel}>Total Piutang</span>
          <h2 style={{...styles.mediumValue, color: '#f97316'}}>{rp(totalPiutang)}</h2>
        </div>
      </div>

      {/* 🔥 BARU (ANTI-BINGUNG): total gabungan tetap ditampilkan tapi dgn
          label eksplisit "gabungan tunai + transfer" plus peringatan bahwa
          angka itu BUKAN uang fisik di brankas -- biar admin gak kaget
          lagi saat menghitung uang kas manualmente. */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 12, fontWeight: 600, lineHeight: 1.6 }}>
        📥 Total uang masuk bulan ini (GABUNGAN tunai + transfer): <b>{rp(monthStats.pemasukan)}</b> -- angka gabungan ini BUKAN uang fisik di brankas; uang kas fisik cuma porsi tunai (kartu hijau di atas).
        {methodStats && (methodStats.Lainnya.masuk > 0 || methodStats.Lainnya.keluar > 0) && (
          <> ❔ Transaksi lama tanpa metode: masuk {rp(methodStats.Lainnya.masuk)} / keluar {rp(methodStats.Lainnya.keluar)} -- ikut total gabungan, belum masuk brankas/rekening.</>
        )}
        {monthStats.cicilan > 0 && (
          <> 📋 Cicilan tercatat tapi belum diterima: {rp(monthStats.cicilan)} -- TIDAK termasuk total mana pun di atas.</>
        )}
      </div>

      {/* === 🔥 BARU: PANEL RINCIAN UANG TUNAI vs TRANSFER BULAN INI ===
          Ini inti perbaikannya: admin harus bisa lihat JELAS berapa uang
          yang masuk/keluar LEWAT TUNAI dan LEWAT TRANSFER di bulan
          berjalan -- sebelumnya dua-duanya cuma dicampur jadi satu angka
          "Pemasukan Bulan Ini". Panel ini juga memisahkan "Cicilan"
          (perpanjangan paket yang dibayar nyicil) karena uang itu BELUM
          tentu sudah diterima -- kalau dicampur ke tunai/transfer,
          admin bisa salah mengira kas-nya lebih besar dari kenyataan.
          Data: finance_logs bulan berjalan saja (query sudah dikunci
          per-bulan di atas), jadi konsisten dengan aturan "admin cuma
          boleh lihat bulan berjalan". */}
      {methodStats && (
        <div style={styles.methodBox}>
          <div style={styles.methodHeader}>
            <DollarSign size={18} />
            <strong>Rincian Uang Bulan Ini per Metode</strong>
            <span style={styles.methodSub}>{namaBulanIni()}</span>
          </div>
          <div style={styles.methodGrid}>
            {/* --- UANG TUNAI --- */}
            <div style={styles.methodCard('#fffbeb', '#f59e0b')}>
              <div style={styles.methodTitle}>
                <span style={styles.methodIcon('#fef3c7')}>💵</span>
                Uang Tunai
              </div>
              <div style={styles.methodRow}>
                <span style={{color: '#64748b'}}>Masuk <small>({methodStats.Tunai.nMasuk}x)</small></span>
                <b style={{color: '#10b981'}}>+ {rp(methodStats.Tunai.masuk)}</b>
              </div>
              <div style={styles.methodRow}>
                <span style={{color: '#64748b'}}>Keluar <small>({methodStats.Tunai.nKeluar}x)</small></span>
                <b style={{color: '#ef4444'}}>- {rp(methodStats.Tunai.keluar)}</b>
              </div>
              <div style={styles.methodNet('#f59e0b')}>
                Selisih (kas di brankas): <b>{rp(methodStats.Tunai.masuk - methodStats.Tunai.keluar)}</b>
              </div>
            </div>

            {/* --- TRANSFER --- */}
            <div style={styles.methodCard('#eef2ff', '#6366f1')}>
              <div style={styles.methodTitle}>
                <span style={styles.methodIcon('#e0e7ff')}>💳</span>
                Transfer
              </div>
              <div style={styles.methodRow}>
                <span style={{color: '#64748b'}}>Masuk <small>({methodStats.Transfer.nMasuk}x)</small></span>
                <b style={{color: '#10b981'}}>+ {rp(methodStats.Transfer.masuk)}</b>
              </div>
              <div style={styles.methodRow}>
                <span style={{color: '#64748b'}}>Keluar <small>({methodStats.Transfer.nKeluar}x)</small></span>
                <b style={{color: '#ef4444'}}>- {rp(methodStats.Transfer.keluar)}</b>
              </div>
              <div style={styles.methodNet('#6366f1')}>
                Selisih (di rekening): <b>{rp(methodStats.Transfer.masuk - methodStats.Transfer.keluar)}</b>
              </div>
            </div>

            {/* --- CICILAN (kalau ada) ---
                Cuma dirender kalau bulan ini memang ada transaksi
                cicilan, biar panel gak penuh kartu kosong. */}
            {(methodStats.Cicilan.masuk > 0 || methodStats.Cicilan.nMasuk > 0) && (
              <div style={styles.methodCard('#f0fdfa', '#14b8a6')}>
                <div style={styles.methodTitle}>
                  <span style={styles.methodIcon('#ccfbf1')}>📋</span>
                  Cicilan
                  <span style={styles.methodBadgePending}>belum tentu diterima</span>
                </div>
                <div style={styles.methodRow}>
                  <span style={{color: '#64748b'}}>Tercatat <small>({methodStats.Cicilan.nMasuk}x)</small></span>
                  <b style={{color: '#0f766e'}}>{rp(methodStats.Cicilan.masuk)}</b>
                </div>
                <div style={{fontSize: 10, color: '#94a3b8', marginTop: 4, lineHeight: 1.4}}>
                  Perpanjangan paket jalur cicilan -- uang baru dihitung
                  masuk saat tiap cicilannya dibayar (metode Tunai/Transfer).
                </div>
              </div>
            )}

            {/* --- LAINNYA (data lama tanpa metode) ---
                Penjaga: transaksi lawas yang field method-nya kosong
                tetap kelihatan di sini, gak hilang dari rincian. */}
            {(methodStats.Lainnya.masuk > 0 || methodStats.Lainnya.keluar > 0) && (
              <div style={styles.methodCard('#f8fafc', '#94a3b8')}>
                <div style={styles.methodTitle}>
                  <span style={styles.methodIcon('#f1f5f9')}>❔</span>
                  Tanpa Metode (data lama)
                </div>
                <div style={styles.methodRow}>
                  <span style={{color: '#64748b'}}>Masuk</span>
                  <b style={{color: '#10b981'}}>+ {rp(methodStats.Lainnya.masuk)}</b>
                </div>
                <div style={styles.methodRow}>
                  <span style={{color: '#64748b'}}>Keluar</span>
                  <b style={{color: '#ef4444'}}>- {rp(methodStats.Lainnya.keluar)}</b>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* === BARU: ALERT SISWA MASA AKTIF HABIS/AKAN HABIS === */}
      {expiringStudents.length > 0 && (
        <div style={styles.expiryBox}>
          <div style={styles.expiryHeader}>
            <Calendar size={18} />
            <strong>Masa Aktif Paket Habis / Akan Habis</strong>
            <span style={styles.expiryBadge}>{expiringStudents.length}</span>
          </div>
          <div style={styles.alertList}>
            {expiringStudents.map(s => (
              <div key={s.id} style={styles.alertItem}>
                <div>
                  <strong>{s.nama}</strong>
                  <span style={{fontSize: 10, color: '#94a3b8', marginLeft: 8}}>{s.studentId}</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                  <span style={{fontWeight: 'bold', color: s.sudahHabis ? '#ef4444' : '#f59e0b', fontSize: 12}}>
                    {s.sudahHabis ? `⛔ Habis ${Math.abs(s.diffDays)} hari lalu` : `⏰ ${s.diffDays} hari lagi`}
                  </span>
                  {/* 🔥 BARU: tombol kirim pengingat WA -- kalau nomor HP
                      ortu gak ada di data siswa, tombol disembunyikan
                      (daripada nampilin tombol yang gak bisa dipakai). */}
                  {buildWaLink(s) && (
                    <a
                      href={buildWaLink(s)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.waBtn}
                    >
                      <MessageCircle size={12} /> WA
                    </a>
                  )}
                  <button
                    onClick={() => navigate(`/admin/students/finance/${s.id}`)}
                    style={{...styles.alertBtn, background: s.sudahHabis ? '#ef4444' : '#f59e0b'}}
                  >
                    Perpanjang <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === ALERT SISWA BARU BELUM BAYAR === */}
      {newStudents.length > 0 && (
        <div style={styles.alertBox}>
          <div style={styles.alertHeader}>
            <Users size={18} />
            <strong>Siswa Baru Belum Dicatat Keuangannya</strong>
            <span style={styles.alertBadge}>{newStudents.length}</span>
          </div>
          <div style={styles.alertList}>
            {newStudents.map(s => (
              <div key={s.id} style={styles.alertItem}>
                <div>
                  <strong>{s.nama}</strong>
                  <span style={{fontSize: 10, color: '#94a3b8', marginLeft: 8}}>{s.studentId}</span>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                  <span style={{fontWeight: 'bold', color: '#ef4444'}}>Rp {s.totalTagihan?.toLocaleString()}</span>
                  <button 
                    onClick={() => navigate(`/admin/students/finance/${s.id}`)}
                    style={styles.alertBtn}
                  >
                    Catat Pembayaran <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === TOP 5 TUNGGAKAN === */}
      {debtors.length > 0 && (
        <div style={styles.debtBox}>
          <h3 style={styles.debtTitle}>⚠️ Top 5 Tunggakan Terbesar</h3>
          <div style={styles.debtList}>
            {debtors.map((d, i) => (
              <div key={i} style={styles.debtItem}>
                <div style={styles.debtRank(i)}>#{i + 1}</div>
                <div style={{flex: 1}}>
                  <strong>{d.nama}</strong>
                  <span style={{fontSize: 10, color: '#94a3b8', marginLeft: 6}}>{d.kelas}</span>
                </div>
                <span style={{fontWeight: 'bold', color: '#ef4444'}}>Rp {d.sisa.toLocaleString()}</span>
                <button 
                  onClick={() => navigate(`/admin/students/finance/${d.id}`)}
                  style={styles.debtBtn}
                >
                  <CreditCard size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pageTitle: { margin: 0, color: '#1e293b', fontSize: 20 },
  privacyBtn: (on) => ({ 
    padding: '8px 16px', borderRadius: 20, border: '2px solid #1e293b',
    background: on ? '#1e293b' : 'white', color: on ? 'white' : '#1e293b',
    cursor: 'pointer', fontWeight: 'bold', fontSize: 12,
    display: 'flex', alignItems: 'center', gap: 6
  }),

  // Cards
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 15, marginBottom: 24 },
  bigCard: (bg) => ({ background: bg, padding: 20, borderRadius: 16, color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }),
  bigLabel: { display: 'block', fontSize: 11, opacity: 0.8, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 },
  bigValue: { margin: '8px 0', fontSize: 28, fontWeight: 'bold' },
  bigDetail: { display: 'flex', gap: 16, fontSize: 11, opacity: 0.8 },
  mediumCard: (bg, color) => ({ background: bg, padding: 16, borderRadius: 14, border: `1px solid ${color}30` }),
  mediumLabel: { display: 'block', fontSize: 11, color: '#64748b', marginTop: 6 },
  mediumValue: { margin: '6px 0', fontSize: 22, fontWeight: 'bold' },

  // 🔥 BARU: pecahan tunai/transfer kecil di dalam kartu Pemasukan/Pengeluaran
  cardSplit: { display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11, color: '#64748b', borderTop: '1px dashed rgba(0,0,0,0.08)', paddingTop: 8, marginTop: 4 },

  // 🔥 BARU: panel rincian uang tunai vs transfer bulan berjalan
  methodBox: { background: 'white', padding: 16, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', marginBottom: 20 },
  methodHeader: { display: 'flex', alignItems: 'center', gap: 8, color: '#1e293b', fontSize: 14, marginBottom: 12, flexWrap: 'wrap' },
  methodSub: { fontSize: 11, color: '#94a3b8', fontWeight: 600, background: '#f8fafc', padding: '3px 10px', borderRadius: 20, border: '1px solid #f1f5f9' },
  methodGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 },
  methodCard: (bg, color) => ({ background: bg, border: `1px solid ${color}35`, borderRadius: 12, padding: 14 }),
  methodTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 10, flexWrap: 'wrap' },
  methodIcon: (bg) => ({ background: bg, width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }),
  methodRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, padding: '4px 0', gap: 8 },
  methodNet: (color) => ({ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${color}55`, fontSize: 12, color: '#475569', display: 'flex', justifyContent: 'space-between' }),
  methodBadgePending: { fontSize: 9, fontWeight: 'bold', color: '#0f766e', background: '#ccfbf1', padding: '2px 8px', borderRadius: 20 },

  // Alert Siswa Baru
  alertBox: { background: '#fff7ed', border: '2px solid #f97316', padding: 16, borderRadius: 14, marginBottom: 20 },
  alertHeader: { display: 'flex', alignItems: 'center', gap: 8, color: '#c2410c', marginBottom: 12, fontSize: 14 },
  alertBadge: { background: '#f97316', color: 'white', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 'bold' },
  alertList: { display: 'flex', flexDirection: 'column', gap: 8 },
  alertItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'white', borderRadius: 10, flexWrap: 'wrap', gap: 8 },
  alertBtn: { padding: '6px 12px', background: '#f97316', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 },

  // 🔥 BARU: alert masa aktif habis/akan habis -- pakai warna merah (beda
  // dari alertBox oranye "siswa baru") supaya keliatan beda urgensinya
  // sekilas mata, dan ditaruh PALING ATAS (sebelum alert lain) karena ini
  // paling mendesak (siswa yang paketnya udah expired berarti berpotensi
  // masih dianggap aktif belajar padahal harusnya udah diperpanjang/stop).
  expiryBox: { background: '#fef2f2', border: '2px solid #ef4444', padding: 16, borderRadius: 14, marginBottom: 20 },
  expiryHeader: { display: 'flex', alignItems: 'center', gap: 8, color: '#b91c1c', marginBottom: 12, fontSize: 14 },
  expiryBadge: { background: '#ef4444', color: 'white', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 'bold' },
  // 🔥 BARU: tombol kirim WA -- hijau khas WhatsApp, dibuat sebagai <a>
  // (bukan <button>) karena tujuannya buka link eksternal, bukan aksi
  // dalam aplikasi.
  waBtn: { padding: '6px 12px', background: '#25D366', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' },

  // Debtors
  debtBox: { background: 'white', padding: 16, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
  debtTitle: { margin: '0 0 12px 0', fontSize: 14, color: '#1e293b' },
  debtList: { display: 'flex', flexDirection: 'column', gap: 6 },
  debtItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fee2e2' },
  debtRank: (i) => ({ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#ef4444' : '#f87171', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 'bold', flexShrink: 0 }),
  debtBtn: { padding: '6px 10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }
};

export default FinanceDashboard;