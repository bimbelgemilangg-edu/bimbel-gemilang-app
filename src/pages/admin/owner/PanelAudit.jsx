// src/pages/admin/owner/PanelAudit.jsx
// ============================================================
// MENU AUDIT OWNER (18 Okt 2026): "mudah dipahami & rinci, semua data
// laporan keuangan lengkap dapat diunduh dan dianalisis, dari rekening
// maupun tunai". Filter bulan/kantong/kategori/pencatat, kartu ringkasan,
// tren 12 bulan, tabel rinci (memo owner hanya di sini), unduh CSV &
// PDF, serta INPUT BEBAS untuk owner (prive, gaji, talangan, serah
// akhir bulan) dengan dicatatOleh='owner' supaya admin tidak bingung.
// ============================================================
import React, { useMemo, useState } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { Download, FileSpreadsheet, Plus, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { KANAL, LABEL_KANAL } from '../../../utils/kanalUang';
import {
  KATEGORI_PRIVE, KATEGORI_GAJI, KATEGORI_SERAH, KATEGORI_OWNER_BARU,
  barisAudit, ringkasanAudit, trenBulanan, keCsvAudit, statusPlafon, PLAFON_DEFAULT,
} from '../../../utils/keuanganAudit';

const st = {
  kartu: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 14, marginBottom: 12 },
  label: { display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 4 },
  input: { width: '100%', padding: '8px 10px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 12.5, boxSizing: 'border-box' },
  angka: (warna) => ({ fontSize: 17, fontWeight: 800, color: warna || '#0f172a' }),
  badge: (warna, bg) => ({ fontSize: 10, fontWeight: 800, color: warna, background: bg, borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }),
  tombol: (mati) => ({
    background: mati ? '#cbd5e1' : '#0f767e', color: '#fff', border: 'none', borderRadius: 10,
    padding: '9px 14px', fontSize: 12.5, fontWeight: 800, cursor: mati ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 7,
  }),
};

export default function PanelAudit({ logs = [], rp = (n) => String(n), isMobile = false }) {
  const kini = new Date();
  const [fBulan, setFBulan] = useState(`${kini.getFullYear()}-${String(kini.getMonth() + 1).padStart(2, '0')}`);
  const [fKantong, setFKantong] = useState('');
  const [fKategori, setFKategori] = useState('');
  const [fPencatat, setFPencatat] = useState('');
  const [cari, setCari] = useState('');
  const [formBuka, setFormBuka] = useState(false);
  const [pesan, setPesan] = useState('');
  const [sett, setSett] = useState(null);
  const [formSett, setFormSett] = useState({ plafonKasAdmin: '', saldoAwalKas: '' });
  React.useEffect(() => {
    import('firebase/firestore').then(({ getDoc }) => {
      getDoc(doc(db, 'finance_settings', 'umum')).then((sn) => {
        const d = sn.exists() ? sn.data() : null;
        setSett(d);
        if (d) setFormSett({ plafonKasAdmin: String(d.plafonKasAdmin ?? ''), saldoAwalKas: String(d.saldoAwalKas ?? '') });
      });
    });
  }, []);
  const [form, setForm] = useState({
    type: 'Pengeluaran', date: `${fBulan}-${String(kini.getDate()).padStart(2, '0')}`,
    category: KATEGORI_PRIVE, amount: '', note: '', memoOwner: '',
    method: 'Tunai', kanalDari: KANAL.KAS_ADMIN, kanalKe: KANAL.KAS_OWNER,
  });

  const terpilah = useMemo(() => logs.filter((t) => {
    const b = barisAudit(t);
    if (fBulan && !String(t.date || '').startsWith(fBulan)) return false;
    if (fKantong && b.kantong !== fKantong && b.kantongDari !== fKantong && b.kantongKe !== fKantong) return false;
    if (fKategori && b.kategori !== fKategori) return false;
    if (fPencatat && b.dicatatOleh !== fPencatat) return false;
    if (cari && !`${b.keterangan} ${b.kategori} ${b.memo}`.toLowerCase().includes(cari.toLowerCase())) return false;
    return true;
  }).sort((a, b) => String(b.date).localeCompare(String(a.date))), [logs, fBulan, fKantong, fKategori, fPencatat, cari]);

  const ring = useMemo(() => ringkasanAudit(terpilah), [terpilah]);
  const tren = useMemo(() => trenBulanan(logs).slice(-12), [logs]);
  const daftarKategori = useMemo(() => [...new Set(logs.map((l) => l.category).filter(Boolean))].sort(), [logs]);

  const unduhCsv = () => {
    const blob = new Blob([keCsvAudit(terpilah)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `audit-keuangan-${fBulan || 'semua'}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    setPesan(`✓ CSV terunduh (${terpilah.length} baris).`);
  };

  const unduhPdf = () => {
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    pdf.setFontSize(15); pdf.setFont('helvetica', 'bold');
    pdf.text('Laporan Audit Keuangan — Bimbel Gemilang', 14, 15);
    pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
    pdf.text(`Periode: ${fBulan || 'SEMUA bulan'} · dicetak owner ${new Date().toLocaleString('id-ID')}`, 14, 21);
    pdf.text(`Masuk ${rp(ring.masuk)} · Keluar ${rp(ring.keluar)} · Transfer ${rp(ring.transfer)} · Prive+Gaji ${rp(ring.prive + ring.gaji)}`, 14, 26);
    autoTable(pdf, {
      startY: 31,
      head: [['Tanggal', 'Keterangan', 'Kategori', 'Kantong', 'Tipe', 'Nominal', 'Oleh']],
      body: terpilah.map((t) => {
        const b = barisAudit(t);
        return [b.tanggal, `${b.keterangan}${b.memo ? ` (${b.memo})` : ''}`.slice(0, 90), b.kategori, LABEL_KANAL[b.kantong] || b.kantong, b.tipe, rp(b.nominal), b.dicatatOleh];
      }),
      styles: { fontSize: 8 },
    });
    pdf.save(`audit-keuangan-${fBulan || 'semua'}.pdf`);
    setPesan(`✓ PDF terunduh (${terpilah.length} baris).`);
  };

  const simpan = async () => {
    const nominal = parseInt(form.amount, 10);
    if (!nominal || nominal <= 0) { setPesan('⚠ Nominal wajib diisi angka positif.'); return; }
    try {
      const dasar = {
        type: form.type, date: form.date, category: form.category, amount: nominal,
        note: form.note || form.category, memoOwner: form.memoOwner || '',
        dicatatOleh: 'owner', createdAt: serverTimestamp(), statusRekonsiliasi: '',
      };
      if (form.type === 'Transfer') {
        await addDoc(collection(db, 'finance_logs'), { ...dasar, method: 'Transfer', kanal: form.kanalDari, kanalDari: form.kanalDari, kanalKe: form.kanalKe });
      } else {
        const kanal = form.method === 'Transfer' ? KANAL.BANK : form.method === 'Talangan pribadi (Mandiri owner)' ? KANAL.KAS_OWNER : KANAL.KAS_ADMIN;
        await addDoc(collection(db, 'finance_logs'), { ...dasar, method: form.method, kanal });
      }
      setPesan('✓ Transaksi owner tercatat (badge "owner" muncul di admin tanpa memo pribadi).');
      setForm((f) => ({ ...f, amount: '', note: '', memoOwner: '' }));
    } catch (e) {
      setPesan(`✗ Gagal mencatat: ${e?.message || e}`);
    }
  };

  return (
    <div>
      <div style={st.kartu}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Search size={15} color="#0f767e" />
          <b style={{ fontSize: 13 }}>Audit & Laporan Lengkap</b>
          <span style={{ fontSize: 11, color: '#64748b' }}>— hanya area owner; memo pribadi tidak pernah tampil di admin.</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)', gap: 8, marginTop: 10 }}>
          <label style={st.label}>Bulan
            <input style={st.input} type="month" value={fBulan} onChange={(e) => setFBulan(e.target.value)} />
          </label>
          <label style={st.label}>Kantong
            <select style={st.input} value={fKantong} onChange={(e) => setFKantong(e.target.value)}>
              <option value="">semua kantong</option>
              {Object.values(KANAL).map((k) => <option key={k} value={k}>{LABEL_KANAL[k] || k}</option>)}
            </select>
          </label>
          <label style={st.label}>Kategori
            <select style={st.input} value={fKategori} onChange={(e) => setFKategori(e.target.value)}>
              <option value="">semua kategori</option>
              {daftarKategori.map((k) => <option key={k}>{k}</option>)}
            </select>
          </label>
          <label style={st.label}>Dicatat oleh
            <select style={st.input} value={fPencatat} onChange={(e) => setFPencatat(e.target.value)}>
              <option value="">siapa saja</option>
              <option value="admin">admin</option>
              <option value="owner">owner</option>
            </select>
          </label>
          <label style={st.label}>Cari
            <input style={st.input} value={cari} onChange={(e) => setCari(e.target.value)} placeholder="keterangan / memo…" />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button style={st.tombol(false)} onClick={unduhCsv}><FileSpreadsheet size={14} /> Unduh CSV</button>
          <button style={st.tombol(false)} onClick={unduhPdf}><Download size={14} /> Unduh PDF lengkap</button>
          <button style={{ ...st.tombol(false), background: formBuka ? '#b45309' : '#5B2ECC' }} onClick={() => setFormBuka((v) => !v)}><Plus size={14} /> Catat transaksi owner</button>
          <button style={{ ...st.tombol(false), background: '#f1f5f9', color: '#334155' }} onClick={() => { setFBulan(''); setFKantong(''); setFKategori(''); setFPencatat(''); setCari(''); }}>bersihkan filter</button>
        </div>
        {pesan && <div style={{ fontSize: 12, marginTop: 8, color: pesan.startsWith('✗') || pesan.startsWith('⚠') ? '#991b1b' : '#166534' }}>{pesan}</div>}
      </div>

      {formBuka && (
        <div style={st.kartu}>
          <div style={st.label}>INPUT OWNER (dicatatOleh = owner; admin melihat badge, bukan memo pribadimu)</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: 8 }}>
            <label style={st.label}>Tipe
              <select style={st.input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option>Pengeluaran</option><option>Pemasukan</option><option>Transfer</option>
              </select>
            </label>
            <label style={st.label}>Tanggal<input style={st.input} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
            <label style={st.label}>Nominal (Rp)<input style={st.input} inputMode="numeric" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="2000000" /></label>
            <label style={st.label}>Kategori
              <select style={st.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {[...KATEGORI_OWNER_BARU, ...daftarKategori.filter((k) => !KATEGORI_OWNER_BARU.includes(k))].map((k) => <option key={k}>{k}</option>)}
              </select>
            </label>
            {form.type !== 'Transfer' && (
              <label style={st.label}>Kantong uang
                <select style={st.input} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                  <option>Tunai</option><option>Transfer</option><option>Talangan pribadi (Mandiri owner)</option>
                </select>
              </label>
            )}
            {form.type === 'Transfer' && (
              <>
                <label style={st.label}>Dari kantong
                  <select style={st.input} value={form.kanalDari} onChange={(e) => setForm({ ...form, kanalDari: e.target.value })}>
                    {Object.values(KANAL).map((k) => <option key={k} value={k}>{LABEL_KANAL[k] || k}</option>)}
                  </select>
                </label>
                <label style={st.label}>Ke kantong
                  <select style={st.input} value={form.kanalKe} onChange={(e) => setForm({ ...form, kanalKe: e.target.value })}>
                    {Object.values(KANAL).map((k) => <option key={k} value={k}>{LABEL_KANAL[k] || k}</option>)}
                  </select>
                </label>
              </>
            )}
            <label style={st.label}>Keterangan (terlihat admin)<input style={st.input} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="mis. serah kas Oktober / prive bulanan" /></label>
            <label style={{ ...st.label, gridColumn: isMobile ? 'auto' : 'span 2' }}>Memo pribadi owner (TIDAK tampil di admin)<input style={st.input} value={form.memoOwner} onChange={(e) => setForm({ ...form, memoOwner: e.target.value })} placeholder="mis. 2jt utk orang tua, 1jt gajiku" /></label>
          </div>
          {form.category === KATEGORI_SERAH && form.type !== 'Transfer' && (
            <div style={{ fontSize: 11.5, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '6px 10px', marginTop: 8 }}>
              💡 Serah tunai akhir bulan lebih tepat dicatat sebagai <b>Transfer</b> kas admin → kas owner (uang pindah kantong, bukan pengeluaran) supaya analisis tidak bohong.
            </div>
          )}
          <button style={{ ...st.tombol(false), marginTop: 10 }} onClick={simpan}>Simpan catatan owner</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(6, 1fr)', gap: 8 }}>
        {[
          ['Pemasukan', ring.masuk, '#166534'], ['Pengeluaran', ring.keluar, '#991b1b'],
          ['Prive + Gaji owner', ring.prive + ring.gaji, '#92400e'], ['Transfer antar kantong', ring.transfer, '#1d4ed8'],
          [`Kas admin (saldo ${fBulan || 'semua'})`, ring.perKantong[KANAL.KAS_ADMIN].saldo, '#0f767e'],
          [`Bank bimbel (saldo ${fBulan || 'semua'})`, ring.perKantong[KANAL.BANK].saldo, '#5B2ECC'],
        ].map(([l, v, w]) => (
          <div key={l} style={st.kartu}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>{l}</div>
            <div style={st.angka(w)}>{rp(v)}</div>
          </div>
        ))}
      </div>

      {(() => {
        const serahBulan = logs.filter((t) => t.type === 'Transfer' && (t.kanalDari || 'kasAdmin') === 'kasAdmin' && (!fBulan || String(t.date || '').startsWith(fBulan)));
        const totalSerah = serahBulan.reduce((a, t) => a + Number(t.amount || 0), 0);
        const bca = logs.filter((t) => t.type !== 'Transfer' && (t.kanal === 'bankBimbel') && (!fBulan || String(t.date || '').startsWith(fBulan)));
        const bcaMasuk = bca.filter((t) => t.type === 'Pemasukan').reduce((a, t) => a + Number(t.amount || 0), 0);
        const bcaKeluar = bca.filter((t) => t.type === 'Pengeluaran').reduce((a, t) => a + Number(t.amount || 0), 0);
        const stPlafonKini = statusPlafon(ring.perKantong.kasAdmin?.saldo || 0, sett?.plafonKasAdmin || PLAFON_DEFAULT);
        return (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 8 }}>
            <div style={st.kartu}>
              <div style={st.label}>🤝 SERAH TUNAI ADMIN → OWNER ({fBulan || 'semua'})</div>
              <div style={st.angka('#1d4ed8')}>{rp(totalSerah)}</div>
              <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 4 }}>{serahBulan.length} kali serah · mingguan/akhir bulan · uang pindah kantong, BUKAN pengeluaran.</div>
              <button style={{ ...st.tombol(false), marginTop: 8, background: '#5B2ECC' }} onClick={() => { setFormBuka(true); setForm({ type: 'Transfer', date: `${fBulan || `${kini.getFullYear()}-${String(kini.getMonth() + 1).padStart(2, '0')}`}-${String(kini.getDate()).padStart(2, '0')}`, category: KATEGORI_SERAH, amount: '', note: 'Serah tunai kas admin', memoOwner: '', method: 'Transfer', kanalDari: KANAL.KAS_ADMIN, kanalKe: KANAL.BANK }); }}>
                <Plus size={14} /> Catat serah tunai sekarang
              </button>
            </div>
            <div style={st.kartu}>
              <div style={st.label}>🏦 REKENING BCA BIMBEL ({fBulan || 'semua'} — view-only admin)</div>
              <div style={st.angka('#5B2ECC')}>{rp(bcaMasuk - bcaKeluar)}</div>
              <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 4 }}>masuk {rp(bcaMasuk)} · keluar {rp(bcaKeluar)}. Setiap keluar BCA wajib tercatat saat transaksi (oleh owner); admin melihat barisnya di laporan bulan berjalan.</div>
            </div>
            <div style={{ ...st.kartu, border: `1px solid ${stPlafonKini.melebihi ? '#fecaca' : '#bbf7d0'}` }}>
              <div style={st.label}>🛡 PLAFON KAS ADMIN & SETELAN</div>
              <div style={st.angka(stPlafonKini.melebihi ? '#991b1b' : '#166534')}>{rp(stPlafonKini.saldo)} / {rp(stPlafonKini.plafon)}</div>
              <div style={{ fontSize: 10.5, color: stPlafonKini.melebihi ? '#991b1b' : '#64748b', marginTop: 4 }}>
                {stPlafonKini.melebihi ? `⚠ kas admin melebihi plafon — wajib serah ${rp(stPlafonKini.wajibSerah)}.` : 'kas admin dalam plafon (saldo seluruh periode).'}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <input style={st.input} inputMode="numeric" placeholder="plafon (Rp)" value={formSett.plafonKasAdmin} onChange={(e) => setFormSett({ ...formSett, plafonKasAdmin: e.target.value })} />
                <input style={st.input} inputMode="numeric" placeholder="saldo awal kas (Rp)" value={formSett.saldoAwalKas} onChange={(e) => setFormSett({ ...formSett, saldoAwalKas: e.target.value })} />
                <button style={st.tombol(false)} onClick={() => { setDoc(doc(db, 'finance_settings', 'umum'), { plafonKasAdmin: parseInt(formSett.plafonKasAdmin, 10) || PLAFON_DEFAULT, saldoAwalKas: parseInt(formSett.saldoAwalKas, 10) || 0, diperbaruiPada: serverTimestamp() }, { merge: true }).then(() => { setSett({ plafonKasAdmin: parseInt(formSett.plafonKasAdmin, 10) || PLAFON_DEFAULT, saldoAwalKas: parseInt(formSett.saldoAwalKas, 10) || 0 }); setPesan('✓ Setelan plafon & saldo awal tersimpan.'); }); }}>Simpan</button>
              </div>
            </div>
          </div>
        );
      })()}

      <div style={st.kartu}>
        <div style={st.label}>TREN 12 BULAN (masuk vs keluar)</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={tren}>
            <XAxis dataKey="bulan" fontSize={10} /><YAxis fontSize={10} tickFormatter={(v) => `${Math.round(v / 1000)}rb`} />
            <Tooltip formatter={(v) => rp(v)} /><Legend />
            <Bar dataKey="masuk" fill="#16a34a" name="masuk" /><Bar dataKey="keluar" fill="#dc2626" name="keluar" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={st.kartu}>
        <div style={st.label}>RINCIAN ({terpilah.length} baris)</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#64748b' }}>
                {['Tanggal', 'Keterangan & memo owner', 'Kategori', 'Kantong', 'Oleh', 'Nominal'].map((h) => <th key={h} style={{ padding: '6px 8px', borderBottom: '1px solid #e2e8f0' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {terpilah.slice(0, 300).map((t, i) => {
                const b = barisAudit(t);
                return (
                  <tr key={i}>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{b.tanggal}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>
                      {b.keterangan}
                      {b.memo && <div style={{ fontSize: 10.5, color: '#92400e', fontStyle: 'italic' }}>memo: {b.memo}</div>}
                    </td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>
                      {b.kategori}
                    </td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>{LABEL_KANAL[b.kantong] || b.kantong}{b.tipe === 'Transfer' && b.kantongKe ? ` → ${LABEL_KANAL[b.kantongKe] || b.kantongKe}` : ''}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={st.badge(b.dicatatOleh === 'owner' ? '#92400e' : '#334155', b.dicatatOleh === 'owner' ? '#fffbeb' : '#f1f5f9')}>{b.dicatatOleh}</span>
                    </td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 800, color: b.tipe === 'Pemasukan' ? '#166534' : b.tipe === 'Transfer' ? '#1d4ed8' : '#991b1b' }}>
                      {b.tipe === 'Pemasukan' ? '+' : b.tipe === 'Transfer' ? '⇄' : '−'} {rp(b.nominal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {terpilah.length > 300 && <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>Menampilkan 300 dari {terpilah.length} — pakai unduh CSV/PDF untuk lengkapnya.</div>}
        </div>
      </div>
    </div>
  );
}
