// src/pages/admin/finance/SerahUangKeOwner.jsx
// ============================================================
// 🔥 DIROMBAK (keputusan owner 2026-10-01, "pilihan 1"): dulu halaman ini
// bernama TutupKasir -- sebuah UPACARA akhir giliran: hitung fisik brankas,
// kunci total, wajib jelaskan selisih, lalu owner memverifikasi di antrean
// Rekonsiliasi.
//
// Owner menilai upacara itu tidak cocok dengan alur uang mereka yang
// sebenarnya: uang tunai pindah tangan KAPAN SAJA (kadang owner sendiri
// yang mengambil), semuanya satu dompet, dan total uangnya memang tidak
// pernah berubah oleh serah-terima ("jadinya tetap uang yang sama").
//
// YANG BERUBAH:
//   - Tidak ada lagi upacara "kunci penerimaan": halaman ini kini sekadar
//     CATATAN ADA-HOC untuk momen uang fisik benar-benar pindah tangan.
//   - Angka "tunai menurut sistem" tetap ditampilkan sebagai REFERENSI
//     (berguna mengetahui berapa uang yang seharusnya sedang dipegang
//     admin), tapi tidak lagi menjadi kewajiban hitung-fisik.
//   - Selisih tidak lagi memblokir dan tidak mewajibkan catatan; selisih
//     tetap DITULIS otomatis di bukti & note supaya tidak bisa hilang
//     diam-diam, tapi keputusan menyerahkannya tidak dijegal.
//   - TIDAK ADA antrean verifikasi owner: setoran baru lahir dengan status
//     'tidak-perlu' (bukan 'pending'), sehingga tab Rekonsiliasi owner
//     tidak lagi dipenuhi upacara kosong. Setoran lama berstatus pending
//     tetap bisa dibereskan owner di sana.
//
// YANG TETAP (sengaja dipertahankan):
//   - Nomor bukti SK-YYYYMMDD-urut + cetak bukti bertanda tangan.
//   - Arsip dokumen setoran_kas + log Transfer kasAdmin -> kasOwner
//     (tetap BUKAN pemasukan/pengeluaran; total uang tidak berubah).
//   - Riwayat setoran + cetak ulang.
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../../firebase';
import {
  collection, query, onSnapshot, doc, writeBatch, serverTimestamp, orderBy, limit,
} from 'firebase/firestore';
import { Printer, History, Wallet, AlertTriangle, Loader2, CheckCircle2, HandCoins } from 'lucide-react';
import { normalisasiLog, hitungSaldo, tanggalLokalHariIni } from '../owner/keuanganOwnerUtils';
import { cetakBuktiSetorKas, rp, tanggalPanjang } from '../../../utils/kwitansi';

const compactTanggal = (str) => String(str || '').replace(/-/g, '');

const SerahUangKeOwner = () => {
  const [logs, setLogs] = useState([]);
  const [setoranList, setSetoranList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jumlahSetor, setJumlahSetor] = useState('');
  const [catatan, setCatatan] = useState('');
  const [busy, setBusy] = useState(false);
  const [sukses, setSukses] = useState(null);

  useEffect(() => {
    const unsubLogs = onSnapshot(collection(db, 'finance_logs'), (snap) => {
      setLogs(snap.docs.map(normalisasiLog));
      setLoading(false);
    }, () => setLoading(false));

    const unsubSetoran = onSnapshot(
      query(collection(db, 'setoran_kas'), orderBy('tanggal', 'desc'), limit(50)),
      (snap) => setSetoranList(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {},
    );
    return () => { unsubLogs(); unsubSetoran(); };
  }, []);

  const saldo = useMemo(() => hitungSaldo(logs), [logs]);
  const tunaiMenurutSistem = saldo.kasAdmin;

  const setoranTerakhir = setoranList[0] || null;
  const periodeAwal = setoranTerakhir?.tanggal || null;

  const periode = useMemo(() => {
    const rentang = logs.filter(l =>
      l.type !== 'Transfer' && l.kanal === 'kasAdmin' &&
      (!periodeAwal || (l.date && l.date >= periodeAwal)));
    let masuk = 0, keluar = 0, nMasuk = 0, nKeluar = 0;
    for (const l of rentang) {
      if (l.type === 'Pemasukan') { masuk += l.amount; nMasuk += 1; }
      else { keluar += l.amount; nKeluar += 1; }
    }
    return { masuk, keluar, nMasuk, nKeluar };
  }, [logs, periodeAwal]);

  const statusSetoran = useMemo(() => {
    const map = {};
    for (const l of logs) {
      if (l.type === 'Transfer' && l.setoranId) map[l.setoranId] = l.statusRekonsiliasi || 'pending';
    }
    return map;
  }, [logs]);

  const defaultSetor = Math.max(tunaiMenurutSistem, 0);
  const nilaiSetor = jumlahSetor === '' ? defaultSetor : (parseInt(jumlahSetor) || 0);
  const selisih = defaultSetor - nilaiSetor; // >0 = fisik kurang dari catatan

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (nilaiSetor <= 0) {
      return alert('⚠️ Jumlah serah harus lebih dari 0. Kalau tidak ada uang tunai yang pindah tangan, tidak perlu mencatat apa-apa.');
    }
    if (nilaiSetor > defaultSetor) {
      const lanjut = window.confirm(
        `Jumlah serah (${rp(nilaiSetor)}) LEBIH BESAR dari tunai menurut catatan sistem (${rp(defaultSetor)}).\n\n` +
        `Berarti ada uang tunai yang masuk tanpa tercatat sebagai transaksi. Selisihnya akan tertulis otomatis di bukti dan catatan. Lanjutkan?`,
      );
      if (!lanjut) return;
    }

    setBusy(true);
    try {
      const today = tanggalLokalHariIni();
      const prefix = `SK-${compactTanggal(today)}-`;
      const sudahHariIni = setoranList.filter(s => String(s.nomor || '').startsWith(prefix)).length;
      const nomor = `${prefix}${String(sudahHariIni + 1).padStart(2, '0')}`;

      // Selisih (kalau ada) TIDAK memblokir, tapi TIDAK BISA hilang:
      // ia masuk ke note log dan ke teks bukti secara otomatis.
      const teksSelisih = selisih !== 0
        ? ` (fisik ${selisih > 0 ? 'kurang' : 'lebih'} ${rp(Math.abs(selisih))} vs catatan sistem)`
        : '';

      const batch = writeBatch(db);
      const setoranRef = doc(collection(db, 'setoran_kas'));
      const logRef = doc(collection(db, 'finance_logs'));

      batch.set(setoranRef, {
        nomor,
        tanggal: today,
        periodeAwal: periodeAwal || (logs.length ? 'awal usaha' : today),
        periodeAkhir: today,
        tunaiMasuk: periode.masuk,
        tunaiKeluar: periode.keluar,
        jumlahSetor: nilaiSetor,
        saldoSistem: defaultSetor,
        catatan: catatan.trim(),
        // 🔥 Skema baru: tidak ada antrean verifikasi. 'tercatat' berarti
        // serah-terima ini sah sebagai catatan kedua pihak saat terjadi.
        statusVerifikasi: 'tercatat',
        skema: 'serah-ad-hoc',
        createdAt: serverTimestamp(),
      });

      // Log Transfer = uang PINDAH kantong (kasAdmin -> kasOwner), bukan
      // pemasukan/pengeluaran: total uang bimbel tidak berubah.
      batch.set(logRef, {
        type: 'Transfer',
        date: today,
        category: 'Setor Kas ke Owner',
        amount: nilaiSetor,
        method: 'Tunai',
        kanalDari: 'kasAdmin',
        kanalKe: 'kasOwner',
        // 🔥 'tidak-perlu': setoran skema baru tidak masuk antrean
        // Rekonsiliasi owner. Baris pending lama tetap bisa diverifikasi.
        statusRekonsiliasi: 'tidak-perlu',
        setoranId: setoranRef.id,
        note: `Serah uang ${nomor}${teksSelisih}${catatan.trim() ? ` - ${catatan.trim()}` : ''}`,
        createdAt: serverTimestamp(),
      });

      await batch.commit();

      const bukti = {
        nomor, tanggal: today,
        periodeAwal: periodeAwal || 'awal usaha', periodeAkhir: today,
        tunaiMasuk: periode.masuk, tunaiKeluar: periode.keluar,
        jumlahSetor: nilaiSetor,
        catatan: `${catatan.trim()}${teksSelisih}`.trim(),
      };
      setSukses(bukti);
      setJumlahSetor('');
      setCatatan('');
      if (window.confirm('✅ Serah uang tercatat.\n\nTidak ada yang perlu diverifikasi lagi — bukti ini arsip kedua pihak.\n\nCetak bukti sekarang?')) {
        cetakBuktiSetorKas(bukti);
      }
    } catch (err) {
      alert(`❌ Gagal menyimpan catatan serah: ${err.message}`);
    }
    setBusy(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 50, color: '#94a3b8' }}>Memuat data kas...</div>;

  return (
    <div style={{ maxWidth: 860 }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 18, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
        <HandCoins size={20} color='#b45309' /> Serah Uang ke Owner
      </h2>
      <p style={{ margin: '0 0 16px', fontSize: 11.5, color: '#94a3b8', lineHeight: 1.6 }}>
        Dipakai <b>hanya saat uang tunai benar-benar pindah tangan</b> dari admin ke owner —
        kapan pun itu terjadi, tidak menunggu akhir minggu. Mencatat jumlahnya, mencetak bukti,
        dan memindahkan catatan uang dari kantong admin ke kantong owner.
        <b> Total uang bimbel tidak berubah oleh catatan ini</b>; yang berubah hanya siapa yang
        memegangnya menurut buku. Tidak ada antrean verifikasi: bukti tercetak adalah arsip kedua pihak.
      </p>

      {sukses && (
        <div style={styles.suksesBox}>
          <CheckCircle2 size={18} color="#16a34a" />
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 12.5, color: '#166534' }}>Serah {sukses.nomor} tercatat — {rp(sukses.jumlahSetor)}</b>
            <div style={{ fontSize: 11, color: '#15803d' }}>Sah sebagai catatan. Cetak ulang bukti kapan saja dari riwayat di bawah.</div>
          </div>
          <button onClick={() => cetakBuktiSetorKas(sukses)} style={styles.btnCetakKecil}><Printer size={12} /> Cetak Bukti</button>
          <button onClick={() => setSukses(null)} style={styles.btnTutupKecil}>✕</button>
        </div>
      )}

      {/* ===== REFERENSI POSISI TUNAI ===== */}
      <div style={styles.cardBrankas}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Wallet size={20} color="white" />
          <div>
            <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
              Uang tunai yang seharusnya sedang dipegang admin (menurut sistem)
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, margin: '2px 0' }}>{rp(tunaiMenurutSistem)}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 11.5, opacity: 0.92 }}>
          <span>Sejak serah terakhir: <b>{periodeAwal ? tanggalPanjang(periodeAwal) : 'awal usaha'}</b></span>
          <span>Tunai masuk: <b>{rp(periode.masuk)}</b> ({periode.nMasuk} trx)</span>
          <span>Tunai keluar: <b>{rp(periode.keluar)}</b> ({periode.nKeluar} trx)</span>
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 10.5, opacity: 0.8, lineHeight: 1.5 }}>
          💡 Angka ini REFERENSI, bukan tagihan untuk dihitung fisik. Berguna untuk tahu berapa uang
          tunai yang semestinya ada di tangan admin saat ini; kalau kenyataan beda, catat serah sesuai
          kenyataan dan biarkan selisihnya tertulis otomatis di bukti.
        </p>
      </div>

      {/* ===== FORM SERAH ===== */}
      <form onSubmit={handleSubmit} style={styles.cardForm}>
        <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#1e293b' }}>🤝 Catat Serah Uang</h3>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Jumlah uang tunai yang diserahkan (Rp) — kosong = sesuai catatan sistem</label>
          <input
            type="number"
            value={jumlahSetor}
            placeholder={String(defaultSetor)}
            onChange={e => setJumlahSetor(e.target.value)}
            style={{ ...styles.input, fontSize: 18, fontWeight: 800, color: '#b45309' }}
            min={0}
          />
        </div>

        {selisih !== 0 && jumlahSetor !== '' && (
          <div style={selisih > 0 ? styles.selisihMerah : styles.selisihBiru}>
            {selisih > 0 ? (
              <><AlertTriangle size={14} /> Fisik kurang {rp(selisih)} dari catatan sistem — selisih ini akan tertulis otomatis di bukti & catatan.</>
            ) : (
              <>Fisik lebih {rp(-selisih)} dari catatan sistem — selisih ini akan tertulis otomatis di bukti & catatan.</>
            )}
          </div>
        )}

        <div style={styles.inputGroup}>
          <label style={styles.label}>Catatan (opsional)</label>
          <textarea
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
            placeholder="Contoh: setor sebagian, sisa besok / diserahkan saat rapat sore"
            style={{ ...styles.input, height: 70, resize: 'vertical' }}
          />
        </div>

        <button type="submit" disabled={busy || (defaultSetor <= 0 && jumlahSetor === '')} style={styles.btnSetor(busy)}>
          {busy ? <Loader2 size={16} className="spin" /> : <HandCoins size={16} />}
          {busy ? 'Menyimpan...' : `Catat Serah ${rp(nilaiSetor)}`}
        </button>
        {defaultSetor <= 0 && (
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '8px 0 0', textAlign: 'center' }}>
            Menurut catatan sistem tidak ada uang tunai di tangan admin — tidak ada yang perlu diserahkan. 🎉
          </p>
        )}
      </form>

      {/* ===== RIWAYAT ===== */}
      <div style={styles.cardRiwayat}>
        <h3 style={{ margin: '0 0 10px', fontSize: 14, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={16} color="#64748b" /> Riwayat Serah Uang
        </h3>
        {setoranList.length === 0 ? (
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, padding: '10px 0' }}>
            Belum pernah ada catatan serah.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {setoranList.map(s => {
              const status = statusSetoran[s.id] || s.statusVerifikasi || 'pending';
              const labelStatus = status === 'verified'
                ? '✅ Diverifikasi Owner'
                : (status === 'tidak-perlu' || s.skema === 'serah-ad-hoc')
                  ? '📝 Tercatat (skema baru)'
                  : '⏳ Menunggu Owner (skema lama)';
              return (
                <div key={s.id} style={styles.riwayatItem}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: '#1e293b' }}>
                      {s.nomor} <span style={{ fontWeight: 600, color: '#64748b' }}>• {tanggalPanjang(s.tanggal)}</span>
                    </div>
                    <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                      Periode: {s.periodeAwal === 'awal usaha' ? 'awal usaha' : tanggalPanjang(s.periodeAwal)} s.d. {tanggalPanjang(s.periodeAkhir)}
                      {s.catatan ? ` • catatan: ${s.catatan}` : ''}
                    </div>
                  </div>
                  <b style={{ fontSize: 13.5, color: '#b45309', whiteSpace: 'nowrap' }}>{rp(s.jumlahSetor)}</b>
                  <span style={styles.badgeStatus(status)}>{labelStatus}</span>
                  <button
                    onClick={() => cetakBuktiSetorKas({
                      nomor: s.nomor, tanggal: s.tanggal,
                      periodeAwal: s.periodeAwal, periodeAkhir: s.periodeAkhir,
                      tunaiMasuk: s.tunaiMasuk, tunaiKeluar: s.tunaiKeluar,
                      jumlahSetor: s.jumlahSetor, catatan: s.catatan || '',
                    })}
                    style={styles.btnCetakKecil}
                    title="Cetak ulang bukti"
                  >
                    <Printer size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin 1s linear infinite}`}</style>
    </div>
  );
};

const styles = {
  suksesBox: {
    display: 'flex', alignItems: 'center', gap: 10, background: '#f0fdf4',
    border: '1px solid #86efac', borderRadius: 12, padding: '10px 12px', marginBottom: 14,
  },
  btnCetakKecil: {
    display: 'inline-flex', alignItems: 'center', gap: 5, background: '#1e293b', color: 'white',
    border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
  },
  btnTutupKecil: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13 },
  cardBrankas: {
    background: 'linear-gradient(135deg, #b45309, #92400e)', color: 'white',
    borderRadius: 14, padding: 16, marginBottom: 14,
  },
  cardForm: { background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, marginBottom: 14 },
  cardRiwayat: { background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16 },
  inputGroup: { marginBottom: 10 },
  label: { display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', marginBottom: 4 },
  input: {
    width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1',
    fontSize: 13, boxSizing: 'border-box',
  },
  selisihMerah: {
    display: 'flex', gap: 6, alignItems: 'center', background: '#fef2f2', border: '1px solid #fca5a5',
    color: '#991b1b', borderRadius: 10, padding: '8px 10px', fontSize: 11.5, marginBottom: 10,
  },
  selisihBiru: {
    background: '#eff6ff', border: '1px solid #93c5fd', color: '#1e40af',
    borderRadius: 10, padding: '8px 10px', fontSize: 11.5, marginBottom: 10,
  },
  btnSetor: (busy) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%',
    padding: 12, borderRadius: 10, border: 'none', cursor: busy ? 'wait' : 'pointer',
    background: busy ? '#94a3b8' : 'linear-gradient(135deg, #b45309, #92400e)',
    color: 'white', fontWeight: 800, fontSize: 13,
  }),
  riwayatItem: {
    display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #f1f5f9',
    borderRadius: 10, padding: '8px 10px',
  },
  badgeStatus: (status) => ({
    fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '3px 8px', whiteSpace: 'nowrap',
    background: status === 'verified' ? '#dcfce7' : (status === 'tidak-perlu' ? '#e0f2fe' : '#fef9c3'),
    color: status === 'verified' ? '#166534' : (status === 'tidak-perlu' ? '#075985' : '#854d0e'),
  }),
};

export default SerahUangKeOwner;
