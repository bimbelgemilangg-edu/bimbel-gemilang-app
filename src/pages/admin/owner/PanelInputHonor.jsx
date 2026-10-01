// src/pages/admin/owner/PanelInputHonor.jsx
// 🔥 BARU (permintaan owner: "kasih bayar tentor di owner, juga bisa
// input pengeluaran atau pemasukan -- kan alurnya keuangan besar owner
// yang pegang" + modul honor tentor otomatis):
//
// DUA KEMAMPUAN DALAM SATU TAB:
// A. INPUT TRANSAKSI OWNER -- catat uang masuk/keluar yang dipegang
//    owner sendiri (bayar sewa, beli aset, suntikan modal, bayar tentor
//    manual, dll). Tanggal BEBAS (tidak dikunci bulan berjalan seperti
//    form admin -- owner memang boleh mencatat transaksi tanggal lama/
//    backdate), dan kanal uang bisa dipilih termasuk KAS OWNER.
// B. REKAP & PEMBAYARAN HONOR TENTOR -- sesi mengajar (teacher_logs,
//    dibuat otomatis saat tentor menyelesaikan kelas: jumlah sesi x
//    tarif per sesi) direkap per guru per bulan. Tombol "Bayar Honor"
//    mencatat pengeluaran ke finance_logs DAN menandai sesi-sesinya
//    LUNAS dalam satu writeBatch (anti setengah-tersimpan). Ada juga
//    estimasi "Kewajiban Gaji Tentor Bulan Depan".
//
//    🔥 DIUBAH (pembagian kewenangan 2026-10-01): yang BOLEH DIBAYAR
//    sekarang hanya sesi yang SUDAH DIVALIDASI ADMIN di halaman
//    "Sesi & Validasi Guru" (status 'Valid / Sudah Terekap'). Sesi yang
//    masih 'Menunggu Validasi' ditampilkan terpisah sebagai "menunggu
//    approval admin" dan TIDAK bisa dibayar -- owner membayar sesuai
//    apa yang sudah disetujui admin, bukan menurut penilaiannya sendiri.
//    Menu sidebar menuju panel ini muncul untuk owner di 7 hari terakhir
//    bulan (isJendelaBayar), tapi panelnya sendiri tetap terbuka kapan
//    pun lewat Portal Keuangan supaya uang tidak terjebak kalender.
import React, { useState, useMemo, useCallback } from 'react';
import { db } from '../../../firebase';
import {
  collection, addDoc, doc, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import {
  Crown, Save, Users, Wallet, Download, CheckCircle2, Loader2, Receipt as ReceiptIcon,
} from 'lucide-react';
import { uploadElearningFile } from '../../../services/uploadService';
import { KANAL, LABEL_KANAL_PENDEK } from '../../../utils/kanalUang';
import {
  ambilNomorKwitansiBerikutnya, cetakKwitansi, rp,
} from '../../../utils/kwitansi';
import {
  tanggalLokalHariIni, namaBulanDariKey, keyBulanIni,
  STATUS_SESI_VALID,
  // 🔥 PENGAWAL KECURANGAN: bendera kejanggalan ikut sampai ke layar bayar,
  // supaya keputusan "Bayar Honor" diambil dengan melihat sesi mana yang
  // polanya janggal -- bukan cuma melihat total rupiah.
  deteksiKejanggalanSesi, deteksiTumpangTindih, LABEL_KEJANGGALAN,
} from './keuanganOwnerUtils';

const KATEGORI_MASUK = ['Penjualan Modul/Buku', 'Penjualan Seragam', 'Kantin/Snack', 'Hibah/Donasi', 'Suntikan Modal Owner', 'Lainnya'];
const KATEGORI_KELUAR = ['Gaji Guru/Staf', 'Listrik & Air', 'Sewa Tempat', 'ATK & Perlengkapan', 'Internet/WiFi', 'Marketing/Iklan', 'Konsumsi', 'Maintenance/Service', 'Pembelian Aset', 'Lainnya'];

// method finance_logs diturunkan dari kanal (konsisten dengan aturan
// lama: Tunai = uang fisik, Transfer = bank).
const methodDariKanal = (kanal) => (kanal === KANAL.BANK ? 'Transfer' : 'Tunai');

const PanelInputHonor = ({ teacherLogs, rp: rpProp, isMobile }) => {
  const rpFmt = rpProp || rp;
  const [subTab, setSubTab] = useState('honor'); // 'honor' | 'input'

  return (
    <div>
      <div style={styles.subTabRow}>
        <button onClick={() => setSubTab('honor')} style={styles.subTab(subTab === 'honor')}>
          <Users size={14} /> Honor Tentor
        </button>
        <button onClick={() => setSubTab('input')} style={styles.subTab(subTab === 'input')}>
          <Wallet size={14} /> Input Transaksi Owner
        </button>
      </div>
      {subTab === 'honor' && <BagianHonor teacherLogs={teacherLogs} rpFmt={rpFmt} isMobile={isMobile} />}
      {subTab === 'input' && <BagianInput rpFmt={rpFmt} />}
    </div>
  );
};

// ============================================================
// A. INPUT TRANSAKSI OWNER
// ============================================================
const BagianInput = ({ rpFmt }) => {
  const [form, setForm] = useState({
    type: 'Pengeluaran',
    date: tanggalLokalHariIni(),
    category: '',
    amount: '',
    kanal: KANAL.KAS_OWNER,
    namaSiswa: '',
    note: '',
    refTransfer: '',
    mintaKwitansi: false,
  });
  const [buktiFile, setBuktiFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pesan, setPesan] = useState(null);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const kategori = form.type === 'Pemasukan' ? KATEGORI_MASUK : KATEGORI_KELUAR;
  const method = methodDariKanal(form.kanal);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nominal = parseInt(form.amount) || 0;
    if (nominal <= 0) return setPesan('⚠️ Nominal harus diisi!');
    if (!form.category) return setPesan('⚠️ Pilih kategori!');
    if (!form.date) return setPesan('⚠️ Tanggal harus diisi!');
    // Transfer bank WAJIB punya jejak (ref atau foto struk) -- aturan
    // modul rekonsiliasi berlaku juga buat input owner (jujur dua arah).
    if (form.kanal === KANAL.BANK && form.type === 'Pemasukan' && !form.refTransfer.trim() && !buktiFile) {
      return setPesan('⛔ Pemasukan via bank wajib diisi nomor referensi ATAU upload foto struk (buat rekonsiliasi).');
    }

    setBusy(true);
    setPesan(null);
    try {
      let buktiUrl = '';
      if (buktiFile) {
        const hasil = await uploadElearningFile(buktiFile, `bukti_transfer/${form.date.replace(/-/g, '')}`);
        if (hasil?.success && hasil.downloadURL) buktiUrl = hasil.downloadURL;
        else throw new Error('Upload bukti gagal: ' + (hasil?.error || 'tidak ada URL'));
      }

      let noKwitansi = '';
      if (form.type === 'Pemasukan' && form.mintaKwitansi) {
        noKwitansi = await ambilNomorKwitansiBerikutnya(new Date(`${form.date}T00:00:00`));
      }

      const dataLog = {
        type: form.type,
        date: form.date,
        category: form.category,
        amount: nominal,
        method,
        // 🔥 kanal EKSPLISIT -- termasuk kasOwner yang tidak bisa dipilih
        // dari form admin. hitungSaldo memasukkan uang ke kantong ini.
        kanal: form.kanal,
        note: form.note.trim() || `${form.category} (input owner)`,
        namaSiswa: form.namaSiswa.trim(),
        studentId: '',
        refTransfer: form.refTransfer.trim(),
        buktiUrl,
        noKwitansi,
        statusRekonsiliasi: (form.type === 'Pemasukan' && form.kanal === KANAL.BANK) ? 'pending' : '',
        dicatatOleh: 'owner',
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'finance_logs'), dataLog);

      setPesan(`✅ ${form.type} ${rpFmt(nominal)} tercatat di ${LABEL_KANAL_PENDEK[form.kanal]}.`);
      const dataCetak = noKwitansi
        ? { nomor: noKwitansi, tanggal: form.date, diterimaDari: form.namaSiswa || 'Pembayaran Umum', jumlah: nominal, keperluan: form.note || form.category, metode: method, refTransfer: form.refTransfer, penandaTangan: 'Owner' }
        : null;
      setForm(p => ({ ...p, amount: '', note: '', category: '', namaSiswa: '', refTransfer: '', mintaKwitansi: false }));
      setBuktiFile(null);
      if (dataCetak && window.confirm('Kwitansi bernomor sudah dibuat. Cetak sekarang?')) cetakKwitansi(dataCetak);
    } catch (err) {
      setPesan('❌ Gagal menyimpan: ' + err.message);
    }
    setBusy(false);
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}><Crown size={16} color="#b45309" /> Input Transaksi Owner</h3>
      <p style={styles.ket}>
        Catat uang yang keluar/masuk lewat tangan owner sendiri (di luar kas harian admin). Tanggal bebas —
        boleh mencatat transaksi yang terjadi beberapa hari lalu. Kanal <b>🏠 Kas Owner</b> khusus di sini;
        admin kasir tidak bisa melihat/memakainya.
      </p>

      {pesan && <div style={styles.pesanBox}>{pesan}</div>}

      <form onSubmit={handleSubmit}>
        <div style={styles.grid2}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Jenis</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" onClick={() => update('type', 'Pemasukan')} style={styles.toggle(form.type === 'Pemasukan', '#10b981')}>💰 Pemasukan</button>
              <button type="button" onClick={() => update('type', 'Pengeluaran')} style={styles.toggle(form.type === 'Pengeluaran', '#ef4444')}>📤 Pengeluaran</button>
            </div>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tanggal (bebas)</label>
            <input type="date" value={form.date} max="2999-12-31" onChange={e => update('date', e.target.value)} style={styles.input} required />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Kategori</label>
            <select value={form.category} onChange={e => update('category', e.target.value)} style={styles.input}>
              <option value="">-- Pilih Kategori --</option>
              {kategori.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nominal (Rp)</label>
            <input type="number" value={form.amount} onChange={e => update('amount', e.target.value)} placeholder="Contoh: 500000" style={{ ...styles.input, fontSize: 16, fontWeight: 800 }} required min={1} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Kanal Uang (pintu masuk/keluar)</label>
            <select value={form.kanal} onChange={e => update('kanal', e.target.value)} style={styles.input}>
              <option value={KANAL.KAS_OWNER}>🏠 Kas Owner (uang di tangan owner)</option>
              <option value={KANAL.BANK}>🏦 Rekening Bank Bimbel</option>
              <option value={KANAL.KAS_ADMIN}>💵 Kas Tunai di Admin (brankas kasir)</option>
            </select>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nama (siswa/pihak terkait, opsional)</label>
            <input type="text" value={form.namaSiswa} onChange={e => update('namaSiswa', e.target.value)} placeholder="Contoh: Budi / PLN / Tentor Andi" style={styles.input} />
          </div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Keterangan</label>
          <textarea value={form.note} onChange={e => update('note', e.target.value)} placeholder="Contoh: Bayar sewa ruko Oktober" style={{ ...styles.input, height: 60, resize: 'vertical' }} />
        </div>

        {form.kanal === KANAL.BANK && (
          <div style={styles.buktiBox}>
            <div style={styles.grid2}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>No. Referensi / Struk Bank {form.type === 'Pemasukan' && <span style={{ color: '#ef4444' }}>*wajib (jika tanpa foto)</span>}</label>
                <input type="text" value={form.refTransfer} onChange={e => update('refTransfer', e.target.value)} placeholder="Contoh: TRF-889912" style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Foto Struk / Bukti Transfer</label>
                <input type="file" accept="image/*" onChange={e => setBuktiFile(e.target.files?.[0] || null)} style={{ ...styles.input, padding: 8, background: 'white' }} />
              </div>
            </div>
            {form.type === 'Pemasukan' && (
              <p style={{ margin: 0, fontSize: 10.5, color: '#b45309' }}>
                💡 Pemasukan transfer masuk ke daftar <b>Rekonsiliasi</b> (pending) sampai owner cocokkan dengan mutasi rekening.
              </p>
            )}
          </div>
        )}

        {form.type === 'Pemasukan' && (
          <label style={styles.checkboxRow}>
            <input type="checkbox" checked={form.mintaKwitansi} onChange={e => update('mintaKwitansi', e.target.checked)} />
            <ReceiptIcon size={13} color="#7c3aed" /> Buatkan nomor kwitansi resmi (KWT-...) — bisa langsung dicetak
          </label>
        )}

        <button type="submit" disabled={busy} style={styles.btnSubmit(busy)}>
          {busy ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
          {busy ? 'Menyimpan...' : `Simpan ${form.type}`}
        </button>
      </form>
    </div>
  );
};

// ============================================================
// B. REKAP & PEMBAYARAN HONOR TENTOR
// ============================================================
const BagianHonor = ({ teacherLogs, rpFmt, isMobile }) => {
  const [bulan, setBulan] = useState(keyBulanIni());
  const [kanalBayar, setKanalBayar] = useState(KANAL.KAS_OWNER);
  const [busyGuru, setBusyGuru] = useState('');

  const hariIni = tanggalLokalHariIni();
  const tumpang = useMemo(() => deteksiTumpangTindih(teacherLogs), [teacherLogs]);
  const benderaOf = useCallback((t) => {
    const b = deteksiKejanggalanSesi(t, hariIni);
    if (tumpang.has(t.id)) b.push('TUMPANG_TINDIH');
    return b;
  }, [hariIni, tumpang]);

  // Rekap per guru untuk bulan terpilih. Sesi = 1 baris teacher_logs
  // (nominal per sesi sudah dihitung otomatis oleh sistem absensi kelas:
  // jumlah sesi x tarif). statusDibayar 'Lunas' = sudah dibayarkan lewat
  // tombol di panel ini.
  const rekap = useMemo(() => {
    // benderaOf stabil lewat useCallback di atas, aman jadi dependency.
    const map = new Map();
    for (const t of teacherLogs) {
      if ((t.tanggal || '').slice(0, 7) !== bulan) continue;
      const key = t.teacherId || t.namaGuru;
      if (!map.has(key)) {
        map.set(key, {
          key, namaGuru: t.namaGuru, sesi: 0, total: 0,
          sesiBelum: 0, totalBelum: 0, logBelum: [],
          sesiTunggu: 0, totalTunggu: 0,
          bendera: [],
        });
      }
      const r = map.get(key);
      r.sesi += 1;
      r.total += t.nominal;
      if (t.statusDibayar !== 'Lunas') {
        // Hanya sesi yang SUDAH divalidasi admin yang jadi kewajiban
        // bayar. Sisanya menunggu approval -- ditampilkan, tidak dibayar.
        if (t.status === STATUS_SESI_VALID) {
          r.sesiBelum += 1;
          r.totalBelum += t.nominal;
          r.logBelum.push(t);
          const b = benderaOf(t);
          if (b.length) r.bendera.push({ id: t.id, tanggal: t.tanggal, flags: b });
        } else {
          r.sesiTunggu += 1;
          r.totalTunggu += t.nominal;
        }
      }
    }
    return [...map.values()].sort((a, b) => b.totalBelum - a.totalBelum || b.total - a.total);
  }, [teacherLogs, bulan, benderaOf]);

  const totalSesi = rekap.reduce((s, r) => s + r.sesi, 0);
  const totalHonor = rekap.reduce((s, r) => s + r.total, 0);
  const totalBelum = rekap.reduce((s, r) => s + r.totalBelum, 0);
  const totalTunggu = rekap.reduce((s, r) => s + r.sesiTunggu, 0);

  // 🔥 BARU: rangkuman & analisis sesi bulan terpilih -- owner diminta
  // "klik, melihat semua rangkuman sesi dan analisis, klik bayarkan".
  const analisis = useMemo(() => {
    const sesiBulan = teacherLogs.filter((t) => (t.tanggal || '').slice(0, 7) === bulan);
    const valid = sesiBulan.filter((t) => t.status === STATUS_SESI_VALID);
    return {
      sesi: sesiBulan.length,
      valid: valid.length,
      menunggu: sesiBulan.length - valid.length,
      jam: sesiBulan.reduce((s, t) => s + (Number(t.durasiJam) || 0), 0),
      siswa: sesiBulan.reduce((s, t) => s + (Number(t.siswaHadir) || 0), 0),
      guru: new Set(sesiBulan.map((t) => t.teacherId || t.namaGuru)).size,
      berbendera: sesiBulan.filter((t) => benderaOf(t).length > 0).length,
    };
  }, [teacherLogs, bulan, benderaOf]);

  // Kewajiban LINTAS BULAN yang belum dibayar (bukan cuma bulan terpilih),
  // dipecah: yang SIAP dibayar (sudah validasi admin) vs yang masih
  // menunggu approval admin.
  const [utangSiap, utangTunggu] = useMemo(() => {
    let siap = 0; let tunggu = 0;
    for (const t of teacherLogs) {
      if (t.statusDibayar === 'Lunas') continue;
      if (t.status === STATUS_SESI_VALID) siap += t.nominal || 0;
      else tunggu += t.nominal || 0;
    }
    return [siap, tunggu];
  }, [teacherLogs]);

  const bayarHonor = async (r) => {
    // Hanya sesi yang sudah divalidasi admin yang ikut terbawa (logBelum).
    if (r.totalBelum <= 0 || r.logBelum.length === 0) return;
    const daftarBendera = r.bendera.length
      ? `\n⚠ ${r.bendera.length} SESI SIAP-BAYAR BERBENDERA KEJANGGALAN:\n` +
        r.bendera.slice(0, 6).map((x) =>
          `   - ${x.tanggal}: ${x.flags.map((k) => LABEL_KEJANGGALAN[k] || k).join(', ')}`).join('\n') +
        (r.bendera.length > 6 ? `\n   ... dan ${r.bendera.length - 6} lagi` : '') +
        '\nMembayar tetap boleh, tapi keputusan ini tercatat atas nama Owner.\n'
      : '';
    const konfirmasi = window.confirm(
      `Bayar honor ${r.namaGuru}?\n\n` +
      `Periode: ${namaBulanDariKey(bulan)}\n` +
      `Sesi SUDAH divalidasi admin & belum dibayar: ${r.sesiBelum} sesi\n` +
      daftarBendera +
      `Total: ${rpFmt(r.totalBelum)}\n` +
      `Lewat: ${LABEL_KANAL_PENDEK[kanalBayar]}\n\n` +
      `Sistem akan mencatat 1 pengeluaran "Gaji Guru/Staf" dan menandai ${r.sesiBelum} sesi menjadi LUNAS (satu batch atomik).`
    );
    if (!konfirmasi) return;

    setBusyGuru(r.key);
    try {
      const today = tanggalLokalHariIni();
      const batch = writeBatch(db);
      const logRef = doc(collection(db, 'finance_logs'));
      batch.set(logRef, {
        type: 'Pengeluaran',
        date: today,
        category: 'Gaji Guru/Staf',
        amount: r.totalBelum,
        method: methodDariKanal(kanalBayar),
        kanal: kanalBayar,
        note: `Honor ${r.namaGuru} - ${namaBulanDariKey(bulan)} (${r.sesiBelum} sesi)`,
        teacherId: r.logBelum[0]?.teacherId || '',
        periodeHonor: bulan,
        dicatatOleh: 'owner',
        createdAt: serverTimestamp(),
      });
      // Tandai tiap sesi lunas + jejak pembayaran (id log keuangan) --
      // kalau nanti lognya dihapus, jejaknya tetap bisa dilacak.
      for (const t of r.logBelum) {
        if (!t.id) continue;
        batch.update(doc(db, 'teacher_logs', t.id), {
          statusDibayar: 'Lunas',
          tanggalDibayar: today,
          idPembayaran: logRef.id,
        });
      }
      await batch.commit();
      alert(`✅ Honor ${r.namaGuru} (${rpFmt(r.totalBelum)}) tercatat & ${r.sesiBelum} sesi ditandai LUNAS.`);
    } catch (e) {
      alert('❌ Gagal: ' + e.message);
    }
    setBusyGuru('');
  };

  const unduhCSV = () => {
    const baris = [['Nama Guru', 'Jumlah Sesi', 'Total Honor', 'Siap Dibayar (sesi)', 'Nominal Siap (Rp)', 'Menunggu Validasi Admin (sesi)', 'Nominal Menunggu (Rp)']];
    for (const r of rekap) baris.push([r.namaGuru, r.sesi, r.total, r.sesiBelum, r.totalBelum, r.sesiTunggu, r.totalTunggu]);
    baris.push([]);
    baris.push(['TOTAL', totalSesi, totalHonor, '', totalBelum]);
    const csv = baris.map(b => b.map(x => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rekap-honor-${bulan}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      {/* ===== KARTU KEWAJIBAN ===== */}
      <div style={styles.heroGrid(isMobile)}>
        <div style={styles.heroCard('#7c2d12')}>
          <Users size={18} color="rgba(255,255,255,0.7)" />
          <span style={styles.heroLabel}>Kewajiban Gaji Tentor Bulan Depan (estimasi)</span>
          <h2 style={styles.heroValue}>{rpFmt(totalHonor)}</h2>
          <p style={styles.heroNote}>
            = total honor {totalSesi} sesi mengajar {namaBulanDariKey(bulan)}. Asumsi jadwal bulan depan mirip bulan ini —
            kalau sudah ada perubahan jadwal/kenaikan tarif, angka ini menyesuaikan otomatis begitu sesi-sesi barunya tercatat.
          </p>
        </div>
        <div style={styles.heroCard(totalBelum > 0 ? '#7f1d1d' : '#065f46')}>
          <Wallet size={18} color="rgba(255,255,255,0.7)" />
          <span style={styles.heroLabel}>Honor {namaBulanDariKey(bulan)} Belum Dibayar</span>
          <h2 style={styles.heroValue}>{rpFmt(totalBelum)}</h2>
          <p style={styles.heroNote}>
            Lintas bulan: siap dibayar (sudah divalidasi admin){' '}
            <b>{rpFmt(utangSiap)}</b>; masih menunggu validasi admin{' '}
            <b>{rpFmt(utangTunggu)}</b>. Yang siap dibayar adalah dana keramat —
            milik tentor yang sudah mengajar dan sudah disetujui admin.
          </p>
        </div>
      </div>

      {/* ===== RANGKUMAN SESI & ANALISIS (bulan terpilih) =====
          🔥 BARU: owner diminta cukup "klik, lihat semua rangkuman sesi
          dan analisis, klik bayarkan". Blok ini merangkum fakta operasional
          bulan itu supaya keputusan bayar diambil dari gambar utuh. */}
      <div style={styles.analisisRow}>
        <div style={styles.analisisCard}>
          <div style={styles.analisisAngka}>{analisis.sesi}</div>
          <div style={styles.analisisLabel}>Sesi tercatat</div>
        </div>
        <div style={styles.analisisCard}>
          <div style={{ ...styles.analisisAngka, color: '#16a34a' }}>{analisis.valid}</div>
          <div style={styles.analisisLabel}>Sudah divalidasi admin</div>
        </div>
        <div style={styles.analisisCard}>
          <div style={{ ...styles.analisisAngka, color: analisis.menunggu > 0 ? '#d97706' : '#16a34a' }}>
            {analisis.menunggu}
          </div>
          <div style={styles.analisisLabel}>Menunggu validasi admin</div>
        </div>
        <div style={styles.analisisCard}>
          <div style={styles.analisisAngka}>{analisis.jam}</div>
          <div style={styles.analisisLabel}>Total jam mengajar</div>
        </div>
        <div style={styles.analisisCard}>
          <div style={styles.analisisAngka}>{analisis.siswa}</div>
          <div style={styles.analisisLabel}>Siswa hadir (akumulasi)</div>
        </div>
        <div style={styles.analisisCard}>
          <div style={styles.analisisAngka}>{analisis.guru}</div>
          <div style={styles.analisisLabel}>Tentor mengajar</div>
        </div>
        <div style={{ ...styles.analisisCard, borderColor: analisis.berbendera > 0 ? '#fca5a5' : '#e2e8f0' }}>
          <div style={{ ...styles.analisisAngka, color: analisis.berbendera > 0 ? '#dc2626' : '#16a34a' }}>
            {analisis.berbendera}
          </div>
          <div style={styles.analisisLabel}>Sesi berbendera</div>
        </div>
      </div>
      {analisis.menunggu > 0 && (
        <p style={styles.pesanTunggu}>
          ⏳ {analisis.menunggu} sesi bulan ini belum divalidasi admin — nominalnya{' '}
          <b>tidak bisa dibayar dulu</b>. Admin memvalidasinya di menu
          "Sesi & Validasi Guru"; begitu disetujui, angkanya otomatis masuk
          kolom siap bayar di sini.
        </p>
      )}

      {/* ===== KONTROL ===== */}
      <div style={styles.controlRow}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={styles.labelInline}>Rekap bulan:</label>
          <input type="month" value={bulan} onChange={e => e.target.value && setBulan(e.target.value)} style={styles.inputKecil} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={styles.labelInline}>Bayar lewat:</label>
          <select value={kanalBayar} onChange={e => setKanalBayar(e.target.value)} style={styles.inputKecil}>
            <option value={KANAL.KAS_OWNER}>🏠 Kas Owner</option>
            <option value={KANAL.BANK}>🏦 Bank Bimbel</option>
            <option value={KANAL.KAS_ADMIN}>💵 Kas Admin</option>
          </select>
        </div>
        <button onClick={unduhCSV} disabled={rekap.length === 0} style={styles.btnCsv(rekap.length === 0)}>
          <Download size={13} /> CSV
        </button>
      </div>

      {/* ===== TABEL REKAP ===== */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          <Users size={16} color="#7c3aed" /> Rekap Honor per Guru — {namaBulanDariKey(bulan)}
        </h3>
        <p style={styles.ket}>
          Sesi & tarif dihitung OTOMATIS dari absensi kelas (teacher_logs): setiap tentor menyelesaikan sesi mengajar,
          nominalnya langsung masuk rekap di sini. Bayar dari tombol per guru — pengeluaran tercatat di buku besar DAN
          sesi-sesinya ditandai lunas sekaligus.
        </p>
        {rekap.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 12, margin: 0 }}>
            Tidak ada sesi mengajar tercatat di {namaBulanDariKey(bulan)}.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Guru</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Sesi</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Total Honor</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Siap Dibayar</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Nominal Siap</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Menunggu Admin</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Bendera</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rekap.map(r => (
                  <tr key={r.key} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: 800, color: '#1e293b' }}>{r.namaGuru}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>{r.sesi} sesi</td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>{rpFmt(r.total)}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <span style={styles.badgeSesi(r.sesiBelum)}>{r.sesiBelum} sesi</span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800, color: r.totalBelum > 0 ? '#dc2626' : '#16a34a' }}>
                      {rpFmt(r.totalBelum)}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      {r.sesiTunggu > 0 ? (
                        <span style={styles.badgeTunggu} title="Sesi belum divalidasi admin -- tidak bisa dibayar dulu">
                          {r.sesiTunggu} sesi · {rpFmt(r.totalTunggu)}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      {r.bendera.length > 0 ? (
                        <span
                          style={styles.badgeBendera}
                          title={r.bendera.map((x) => `${x.tanggal}: ${x.flags.map((k) => LABEL_KEJANGGALAN[k] || k).join(', ')}`).join('\n')}
                        >
                          ⚑ {r.bendera.length} sesi
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      {r.totalBelum > 0 ? (
                        <button onClick={() => bayarHonor(r)} disabled={busyGuru === r.key} style={styles.btnBayar(busyGuru === r.key)}>
                          {busyGuru === r.key ? <Loader2 size={13} className="spin" /> : <CheckCircle2 size={13} />} Bayar Honor
                        </button>
                      ) : r.sesiTunggu > 0 ? (
                        <span style={{ fontSize: 10.5, color: '#d97706', fontWeight: 700 }}>
                          ⏳ tunggu validasi admin
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 800 }}>✅ LUNAS</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ ...styles.td, fontWeight: 900 }}>TOTAL {rekap.length} GURU</td>
                  <td style={{ ...styles.td, textAlign: 'center', fontWeight: 900 }}>{totalSesi}</td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 900 }}>{rpFmt(totalHonor)}</td>
                  <td></td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 900, color: '#dc2626' }}>{rpFmt(totalBelum)}</td>
                  <td style={{ ...styles.td, textAlign: 'center', fontWeight: 900, color: totalTunggu > 0 ? '#d97706' : '#94a3b8' }}>
                    {totalTunggu > 0 ? `${totalTunggu} sesi` : '—'}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'center', fontWeight: 900, color: '#dc2626' }}>
                    {rekap.reduce((n, r) => n + r.bendera.length, 0) || '—'}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin 1s linear infinite}`}</style>
    </div>
  );
};

const styles = {
  subTabRow: { display: 'flex', gap: 8, marginBottom: 14 },
  subTab: (aktif) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10,
    border: aktif ? '1.5px solid #7c3aed' : '1px solid #e2e8f0',
    background: aktif ? '#f5f3ff' : 'white', color: aktif ? '#6d28d9' : '#64748b',
    fontWeight: 800, fontSize: 12, cursor: 'pointer',
  }),

  card: { background: 'white', padding: 20, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', marginBottom: 14 },
  cardTitle: { margin: '0 0 6px', fontSize: 14.5, fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 },
  ket: { fontSize: 11, color: '#94a3b8', margin: '0 0 14px', lineHeight: 1.7, maxWidth: 780 },
  pesanBox: { background: '#1e293b', color: 'white', padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, marginBottom: 12 },
  analisisRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 12 },
  analisisCard: { background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 10px', textAlign: 'center' },
  analisisAngka: { fontSize: 20, fontWeight: 900, color: '#1e293b', lineHeight: 1.1 },
  analisisLabel: { fontSize: 9.5, color: '#64748b', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: 700 },
  pesanTunggu: { background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', borderRadius: 10, padding: '10px 13px', fontSize: 11.5, lineHeight: 1.6, margin: '0 0 12px' },
  badgeBendera: { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: 20, padding: '3px 8px', fontSize: 10.5, fontWeight: 800, cursor: 'help' },
  badgeTunggu: { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', borderRadius: 20, padding: '3px 8px', fontSize: 10.5, fontWeight: 800, cursor: 'help' },

  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 },
  inputGroup: { marginBottom: 10 },
  label: { display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 4 },
  labelInline: { fontSize: 11, fontWeight: 800, color: '#64748b' },
  input: { width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', background: '#f8fafc' },
  inputKecil: { padding: '8px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12.5, background: 'white', fontWeight: 700, color: '#1e293b' },

  toggle: (aktif, warna) => ({
    flex: 1, padding: '9px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5,
    border: aktif ? `2px solid ${warna}` : '1px solid #e2e8f0',
    background: aktif ? `${warna}14` : 'white', color: aktif ? warna : '#64748b', fontWeight: aktif ? 800 : 600,
  }),
  buktiBox: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 12px 2px', marginBottom: 10 },
  checkboxRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 14, cursor: 'pointer' },
  btnSubmit: (busy) => ({
    width: '100%', padding: 13, background: busy ? '#94a3b8' : '#1e293b', color: 'white', border: 'none',
    borderRadius: 10, fontWeight: 800, fontSize: 13.5, cursor: busy ? 'wait' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  }),

  heroGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 14 }),
  heroCard: (bg) => ({ background: bg, color: 'white', borderRadius: 14, padding: 18, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }),
  heroLabel: { display: 'block', fontSize: 10, opacity: 0.85, marginTop: 6, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800 },
  heroValue: { margin: '6px 0', fontSize: 24, fontWeight: 900 },
  heroNote: { fontSize: 10.5, opacity: 0.85, margin: 0, lineHeight: 1.6 },

  controlRow: { display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', background: 'white', border: '1px solid #f1f5f9', borderRadius: 12, padding: '10px 14px', marginBottom: 14 },
  btnCsv: (disabled) => ({
    marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px',
    background: disabled ? '#e2e8f0' : '#065f46', color: disabled ? '#94a3b8' : 'white',
    border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 11.5, cursor: disabled ? 'not-allowed' : 'pointer',
  }),

  table: { width: '100%', borderCollapse: 'collapse', minWidth: 640 },
  th: { padding: '9px 10px', fontSize: 9.5, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', textAlign: 'left', borderBottom: '2px solid #f1f5f9', background: '#f8fafc' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '9px 10px', fontSize: 12, color: '#334155' },
  badgeSesi: (n) => ({
    fontSize: 10.5, fontWeight: 800, padding: '3px 9px', borderRadius: 20,
    background: n > 0 ? '#fef3c7' : '#dcfce7', color: n > 0 ? '#b45309' : '#15803d',
  }),
  btnBayar: (busy) => ({
    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px',
    background: busy ? '#94a3b8' : '#16a34a', color: 'white', border: 'none', borderRadius: 8,
    fontWeight: 800, fontSize: 11, cursor: busy ? 'wait' : 'pointer', whiteSpace: 'nowrap',
  }),
};

export default PanelInputHonor;
