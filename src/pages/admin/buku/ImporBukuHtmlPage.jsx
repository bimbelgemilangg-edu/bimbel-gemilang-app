// src/pages/admin/buku/ImporBukuHtmlPage.jsx
// ============================================================
// 📚 IMPOR BUKU HTML (fitur baru, permintaan owner 14 Okt 2026):
// buku Gemilang hasil scan yang sudah owner konversi jadi HTML
// (pdf2html: satu gambar per halaman) masuk sistem SEKALI jalan:
//   1. inventaris berkas (jumlah halaman gambar, ukuran, kelayakan),
//   2. ekstraksi MATERI per kelompok halaman lewat api/konversiModulScan
//      (AI vision rantai gratis) -> bab skema buku digital,
//   3. simpan DRAF buku interaktif (buku_digital + subkoleksi bab) supaya
//      materi bisa jadi materi online / ebook / tinggal cetak,
//   4. opsi: soal ujiPemahaman hasil ekstraksi masuk bank_soal per bab
//      (identitas mapel/jenjang/materi lengkap) -> langsung bisa dipanggil
//      mesin try out otomatis, rakit tentor, kuis, maupun cetak.
// Kunci AI TIDAK ada di klien: endpoint memakai env server (rantai provider
// gratis). Klien hanya mengirim gambar halaman + identitas.
// ============================================================
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, setDoc, doc, writeBatch, query, where, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, BookUp, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  inventarisBukuHtml, ekstrakGambarHalamanDariHtml, kelompokkanHalamanUntukAi, butirBankDariUjiPemahaman,
  kunciProgresImpor, perkiraanPanggilanAi, gabungkanBabBerjudul, keGambarAi,
  klasifikasiGagalEkstraksi, parseResponsEkstraksi,
} from '../../../utils/pecahBukuHtml';
import { saranKelasUntukMateri } from '../../../utils/saranKelasUntukMateri';

const JENJANG = ['SD', 'SMP', 'SMA/MA', 'SMK'];

const st = {
  kartu: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 16, marginBottom: 14 },
  label: { display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 4 },
  input: { width: '100%', padding: '9px 10px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 12.5, boxSizing: 'border-box' },
  tombol: (mati) => ({
    background: mati ? '#cbd5e1' : '#5B2ECC', color: '#fff', border: 'none', borderRadius: 10,
    padding: '10px 16px', fontSize: 13, fontWeight: 800, cursor: mati ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 8,
  }),
  log: (ok) => ({ fontSize: 11.5, color: ok ? '#166534' : '#991b1b', padding: '3px 0' }),
  tombolKecilBorderless: { border: '1px solid #cbd5e1', background: '#fff', borderRadius: 8, padding: '3px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#334155' },
};

export default function ImporBukuHtmlPage() {
  const navigate = useNavigate();
  const [namaFile, setNamaFile] = useState('');
  const [html, setHtml] = useState('');
  const [inv, setInv] = useState(null);
  const [gambar, setGambar] = useState([]);
  const [identitas, setIdentitas] = useState({
    mapel: 'Matematika', jenjang: 'SMA/MA', kelas: '10', materi: '', judulBuku: '',
  });
  const [targetBuku, setTargetBuku] = useState('baru');
  const [bukuId, setBukuId] = useState('');
  const [daftarBuku, setDaftarBuku] = useState([]);
  const [ikutBank, setIkutBank] = useState(true);
  const [sibuk, setSibuk] = useState(false);
  const [log, setLog] = useState([]);
  const [pratinjau, setPratinjau] = useState(null); // {babs:[{grup,bab,provider}], butir:[]}
  const [saran, setSaran] = useState(null);
  const [progres, setProgres] = useState({}); // {urutanGrup: {status, bab, provider}}
  const jedaRef = useRef(false);

  const tambahLog = (teks, ok = true) => setLog((l) => [...l, { teks, ok }]);

  const bacaBerkas = async (f) => {
    const teks = await f.text();
    const gambarHalaman = ekstrakGambarHalamanDariHtml(teks);
    setNamaFile(f.name);
    setHtml(teks);
    setGambar(gambarHalaman);
    setInv(inventarisBukuHtml(teks));
    setPratinjau(null);
    setLog([]);
    jedaRef.current = false;
    // Progres lama (bila berkas sama pernah diproses) dipulihkan.
    try {
      const key = kunciProgresImpor(f.name, teks.length);
      const tersimpan = JSON.parse(localStorage.getItem(key) || '{}');
      setProgres(tersimpan || {});
    } catch (_e) { setProgres({}); }
  };

  // "Aku gak tau materi kelas 10/11/12" (owner): sistem yang menyarankan,
  // diambil dari modus kelas butir bank_soal bermateri sama + fase kurikulum.
  const tanyaSaranKelas = async () => {
    if (!identitas.materi) { setSaran({ kelas: '', alasan: 'Isi materi/bab dulu.', kandidat: [] }); return; }
    try {
      const snap = await getDocs(query(collection(db, 'bank_soal'), where('mataPelajaran', '==', identitas.mapel)));
      const sampel = snap.docs.map((d) => d.data());
      setSaran(saranKelasUntukMateri({ mapel: identitas.mapel, materi: identitas.materi, sampelBank: sampel }));
    } catch (e) {
      setSaran({ kelas: '', alasan: `Gagal membaca bank soal: ${e?.message || e}`, kandidat: [] });
    }
  };

  const muatDaftarBuku = async () => {
    if (daftarBuku.length) return;
    const snap = await getDocs(collection(db, 'buku_digital'));
    setDaftarBuku(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const simpanProgres = (key, next) => {
    setProgres(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch (_e) { /* kuota penuh: progres tetap di memori */ }
  };

  // Panggil AI untuk satu kelompok halaman; TAHAN BANTING (15 Okt):
  //  - respons teks/non-JSON diparse defensif (parseResponsEkstraksi);
  //  - kelas 'payload' -> kelompok dipecah dua & dicoba lagi (maks 2 level);
  //  - kelas 'kuota'   -> lempar kode khusus supaya loop luar JEDA rapi.
  const panggilAi = async (g, kedalaman = 0) => {
    const res = await fetch('/api/konversiModulScan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        images: keGambarAi(g.dataUris || g.images),
        placeholders: [],
        meta: {
          judul: `${identitas.materi || identitas.mapel} — halaman ${g.halamanMulai}-${g.halamanSelesai}`,
          mapel: identitas.mapel, jenjang: identitas.jenjang,
        },
      }),
    });
    const pr = parseResponsEkstraksi(await res.text());
    if (pr.ok) return [{ grup: g, bab: pr.json.bab, provider: pr.json.provider }];
    const jenis = klasifikasiGagalEkstraksi(pr.pesan);
    const du = g.dataUris || [];
    if (jenis === 'payload' && kedalaman < 2 && du.length > 4) {
      const setengah = Math.ceil(du.length / 2);
      tambahLog(`↪ hal ${g.halamanMulai}-${g.halamanSelesai}: payload ditolak -> dipecah dua & dicoba lagi.`);
      const g1 = { ...g, dataUris: du.slice(0, setengah), halamanSelesai: g.halamanMulai + setengah - 1 };
      const g2 = { ...g, dataUris: du.slice(setengah), halamanMulai: g.halamanMulai + setengah };
      return [...(await panggilAi(g1, kedalaman + 1)), ...(await panggilAi(g2, kedalaman + 1))];
    }
    if (jenis === 'kuota') {
      const e = new Error(`KUOTA/rate-limit tercapai: ${pr.pesan.slice(0, 140)}`);
      e.kode = 'kuota';
      throw e;
    }
    throw new Error(pr.pesan.slice(0, 200));
  };

  const prosesAi = async () => {
    if (sibuk || gambar.length === 0) return;
    setSibuk(true); setLog([]); setPratinjau(null);
    jedaRef.current = false;
    const keyProgres = kunciProgresImpor(namaFile, html ? html.length : 0);
    const grup = kelompokkanHalamanUntukAi(gambar);
    const babs = [];
    let lokal = { ...progres };
    for (const g of grup) {
      const kProgres = String(g.halamanMulai);
      if (lokal[kProgres]?.status === 'ok' && lokal[kProgres].bab) {
        const t = lokal[kProgres];
        babs.push({ grup: { ...g, halamanMulai: t.halamanMulai ?? g.halamanMulai, halamanSelesai: t.halamanSelesai ?? g.halamanSelesai }, bab: t.bab, provider: t.provider || 'progres tersimpan' });
        tambahLog(`→ hal ${g.halamanMulai}-${g.halamanSelesai}: lewati (sudah selesai sebelumnya).`);
        continue;
      }
      if (jedaRef.current) {
        tambahLog(`⏸ Dijeda setelah ${babs.length} kelompok. Progres tersimpan — tekan Ekstrak lagi untuk melanjutkan.`);
        break;
      }
      try {
        tambahLog(`Memanggil AI untuk halaman ${g.halamanMulai}-${g.halamanSelesai}…`);
        const hasil = await panggilAi(g);
        hasil.forEach((h) => {
          babs.push(h);
          lokal = { ...lokal, [String(h.grup.halamanMulai)]: { status: 'ok', bab: h.bab, provider: h.provider, halamanMulai: h.grup.halamanMulai, halamanSelesai: h.grup.halamanSelesai } };
        });
        simpanProgres(keyProgres, lokal);
        hasil.forEach((h) => tambahLog(`✓ halaman ${h.grup.halamanMulai}-${h.grup.halamanSelesai}: ${h.bab.sections?.length || 0} seksi, ${h.bab.ujiPemahaman?.length || 0} soal (via ${h.provider})`));
      } catch (e) {
        if (e?.kode === 'kuota') {
          tambahLog(`⏸ ${e.message} — JEDA OTOMATIS. Lanjutkan nanti (kuota free tier biasanya pulih); kelompok sukses tetap tersimpan.`, false);
          break;
        }
        lokal = { ...lokal, [kProgres]: { status: 'gagal' } };
        simpanProgres(keyProgres, lokal);
        tambahLog(`✗ halaman ${g.halamanMulai}-${g.halamanSelesai}: ${e?.message || e}`, false);
      }
    }
    // 🔥 15 Okt 2026 (owner: "sistem yang pecah babnya"): potongan 10-halaman
    // dengan judul bab TERCETAK yang sama dilebur jadi satu bab otomatis.
    const gabungan = gabungkanBabBerjudul(babs);
    const butir = [];
    gabungan.forEach((b, bi) => {
      (b.ujiPemahaman || []).forEach((item) => {
        const butirSatu = butirBankDariUjiPemahaman(item, {
          mapel: identitas.mapel, jenjang: identitas.jenjang, kelas: identitas.kelas,
          materi: b.judul || identitas.materi, sumber: namaFile,
        }, b.halamanMulai);
        if (butirSatu) butir.push({ ...butirSatu, dipilih: true, babIndex: bi, asal: `hal ${b.halamanMulai}-${b.halamanSelesai}` });
      });
    });
    setPratinjau({ babs: gabungan.map((b) => ({ ...b, judulEdit: b.judul || '', disertakan: true })), butir });
    tambahLog(`Pratinjau siap: ${gabungan.length} bab (digabung otomatis dari ${babs.length} potongan), ${butir.length} soal pg siap masuk bank (multi/bs dilewati untuk input manual).`);
    setSibuk(false);
  };


  const simpan = async () => {
    if (sibuk || !pratinjau) return;
    setSibuk(true);
    try {
      let idBuku = bukuId;
      if (targetBuku === 'baru' || !idBuku) {
        const ref = await addDoc(collection(db, 'buku_digital'), {
          judul: identitas.judulBuku || `${identitas.mapel} — ${identitas.materi || 'Buku impor'}`,
          mapel: identitas.mapel,
          jenjang: identitas.jenjang,
          kelas: identitas.kelas,
          deskripsi: `Impor buku HTML ${namaFile} (scan -> AI). Materi draf, tinjau sebelum publish.`,
          sumber: namaFile,
          status: 'draft',
          createdAt: serverTimestamp(),
        });
        idBuku = ref.id;
        tambahLog(`✓ Buku digital draf dibuat (${idBuku}).`);
      }
      const dipakaiIdx = pratinjau.babs.map((b, i) => (b.disertakan === false ? -1 : i)).filter((i) => i >= 0);
      for (let ii = 0; ii < dipakaiIdx.length; ii += 1) {
        const b = pratinjau.babs[dipakaiIdx[ii]];
        const i = ii;
        const ref = doc(collection(db, 'buku_digital', idBuku, 'bab'));
        await setDoc(ref, {
          judul: b.judulEdit || b.judul || `${identitas.materi || identitas.mapel} bagian ${i + 1}`,
          sections: b.sections || [],
          ujiPemahaman: b.ujiPemahaman || [],
          urutan: i + 1,
          tipe: 'teks',
          status: 'draft',
          sumberImpor: 'buku-html',
          halamanSumber: [b.halamanMulai, b.halamanSelesai],
          providerAi: (b.provider || []).join('/'),
          updatedAt: serverTimestamp(),
        });
        tambahLog(`✓ Bab ${i + 1} "${b.judulEdit || b.judul}" (hal ${b.halamanMulai}-${b.halamanSelesai}) tersimpan sebagai draf.`);
      }
      if (ikutBank) {
        const dipilih = pratinjau.butir.filter((b) => b.dipilih && dipakaiIdx.includes(b.babIndex));
        for (let i = 0; i < dipilih.length; i += 400) {
          const batch = writeBatch(db);
          dipilih.slice(i, i + 400).forEach((b) => {
            const { dipilih: _d, asal: _a, babIndex, ...butir } = b;
            // Identitas materi butir MENGIKUTI nama bab yang diedit operator
            // (fallback materi identitas) — supaya soal terpanggil per bab.
            const judulBab = (pratinjau.babs[babIndex]?.judulEdit || pratinjau.babs[babIndex]?.judul || identitas.materi || '').trim();
            batch.set(doc(collection(db, 'bank_soal')), {
              ...butir,
              materi: judulBab,
              tags: ['buku', judulBab].filter(Boolean),
              createdAt: serverTimestamp(),
              createdBy: 'impor-buku-html',
            });
          });
          await batch.commit();
        }
        tambahLog(`✓ ${pratinjau.butir.filter((b) => b.dipilih).length} soal masuk bank_soal (kunci belum terverifikasi — QC sampel dulu).`);
      }
      try { localStorage.removeItem(kunciProgresImpor(namaFile, html ? html.length : 0)); } catch (_e) { /* abaikan */ }
      setProgres({});
      tambahLog('SELESAI. Tinjau draf buku di Admin → Buku; stok soal baru terlihat di Kesiapan Stok & filter materi.');
    } catch (e) {
      tambahLog(`✗ Gagal menyimpan: ${e?.message || e}`, false);
    } finally {
      setSibuk(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <button onClick={() => navigate('/admin/buku')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 14, fontSize: 13 }}>
        <ArrowLeft size={16} /> Ke Manajer Buku
      </button>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 21, fontWeight: 800, color: '#1e293b', margin: '0 0 6px' }}>
        <BookUp size={22} color="#5B2ECC" /> Impor Buku HTML (scan → materi + soal)
      </h1>
      <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 16px', lineHeight: 1.6 }}>
        Untuk buku Gemilang hasil scan yang sudah dikonversi jadi HTML (satu gambar per halaman).
        Materi tersimpan sebagai draf buku interaktif (ebook/materi online/cetak); soal pemantapan
        masuk bank soal per bab — langsung bisa dipanggil mesin try out otomatis, rakit tentor, kuis, dan cetak.
        <b>Aturan pecah berkas: SATU berkas = SATU jenjang = SATU buku</b> (identitas diisi sekali per unggah).
        Tidak perlu pecah per bab — nama bab ditulis di pratinjau hasil ekstraksi. Ukuran berkas berapa pun
        aman: HTML mentah tidak disimpan, hanya hasil ekstraksi; proses bisa dijeda & dilanjutkan.
      </p>

      <div style={st.kartu}>
        <div style={st.label}>1 · BERKAS BUKU HTML</div>
        <input type="file" accept=".html,.htm" onChange={(e) => e.target.files?.[0] && bacaBerkas(e.target.files[0])} />
        {inv && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#374151', lineHeight: 1.7 }}>
            <div><b>{namaFile}</b> · {(inv.ukuranByte / 1024 / 1024).toFixed(1)} MB · {inv.jumlahGambarHalaman} halaman gambar · teks layer: {inv.adaTeksLayer ? 'ada' : 'tidak (murni scan)'}</div>
            <div style={{ color: inv.saran === 'OK' ? '#166534' : '#92400e' }}>ℹ️ {inv.saran}{inv.jumlahGambarHalaman > 0 ? ` Ekstraksi tetap aman: otomatis dicicil ±${perkiraanPanggilanAi(inv.jumlahGambarHalaman)} panggilan AI, progres tersimpan & bisa dijeda.` : ''}</div>
          </div>
        )}
      </div>

      <div style={st.kartu}>
        <div style={st.label}>2 · IDENTITAS BUKU (wajib lengkap supaya soal tidak nyasar)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={st.label}>Mata pelajaran
            <input style={st.input} value={identitas.mapel} onChange={(e) => setIdentitas({ ...identitas, mapel: e.target.value })} />
          </label>
          <label style={st.label}>Jenjang
            <select style={st.input} value={identitas.jenjang} onChange={(e) => setIdentitas({ ...identitas, jenjang: e.target.value })}>
              {JENJANG.map((j) => <option key={j}>{j}</option>)}
            </select>
          </label>
          <label style={st.label}>Kelas
            <input style={st.input} value={identitas.kelas} onChange={(e) => setIdentitas({ ...identitas, kelas: e.target.value })} />
          </label>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <button type="button" style={{ ...st.tombol(false), padding: '8px 12px', fontSize: 11.5, background: '#0e7490' }} onClick={tanyaSaranKelas}>
              ❓ Saran kelas dari sistem
            </button>
          </div>
          <label style={st.label}>Materi / cakupan — OPSIONAL untuk buku lengkap
            <input style={st.input} placeholder="kosongkan bila buku berisi semua bab (nama bab dibaca otomatis)" value={identitas.materi} onChange={(e) => setIdentitas({ ...identitas, materi: e.target.value })} />
          </label>
          <label style={st.label}>Judul buku (sumber)
            <input style={st.input} placeholder="mis. Buku Gemilang Vol.1" value={identitas.judulBuku} onChange={(e) => setIdentitas({ ...identitas, judulBuku: e.target.value })} />
          </label>
          <label style={st.label}>Simpan materi ke
            <select style={st.input} value={targetBuku} onChange={(e) => { setTargetBuku(e.target.value); if (e.target.value === 'ada') muatDaftarBuku(); }}>
              <option value="baru">Buku digital baru (draf)</option>
              <option value="ada">Bab buku yang sudah ada</option>
            </select>
          </label>
          {targetBuku === 'ada' && (
            <label style={{ ...st.label, gridColumn: 'span 2' }}>Pilih buku
              <select style={st.input} value={bukuId} onChange={(e) => setBukuId(e.target.value)}>
                <option value="">— pilih —</option>
                {daftarBuku.map((b) => <option key={b.id} value={b.id}>{b.judul}</option>)}
              </select>
            </label>
          )}
        </div>
        {saran && (
          <div style={{ marginTop: 10, fontSize: 11.5, color: saran.kelas ? '#166534' : '#92400e', background: saran.kelas ? '#f0fdf4' : '#fffbeb', border: `1px solid ${saran.kelas ? '#bbf7d0' : '#fde68a'}`, borderRadius: 8, padding: '7px 10px' }}>
            {saran.kelas ? `Saran sistem: kelas ${saran.kelas} — ${saran.alasan}` : saran.alasan}
            {saran.kelas ? (
              <button type="button" style={{ ...st.tombolKecilBorderless, marginLeft: 8 }} onClick={() => setIdentitas({ ...identitas, kelas: saran.kelas })}>pakai</button>
            ) : null}
          </div>
        )}
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, color: '#374151', marginTop: 12 }}>
          <input type="checkbox" checked={ikutBank} onChange={(e) => setIkutBank(e.target.checked)} />
          soal pemantapan hasil ekstraksi ikut masuk bank_soal (dapat dipanggil per bab untuk try out / kuis / cetak)
        </label>
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button style={st.tombol(sibuk || gambar.length === 0)} disabled={sibuk || gambar.length === 0} onClick={prosesAi}>
            {sibuk ? <Loader2 size={15} className="animate-spin" /> : <BookUp size={15} />} {sibuk ? 'Melanjutkan ekstraksi…' : 'Ekstrak materi & soal (AI per 10 halaman)'}
          </button>
          {sibuk && (
            <button style={{ ...st.tombol(false), background: '#b45309' }} onClick={() => { jedaRef.current = true; }}>
              ⏸ Jeda (progres tersimpan)
            </button>
          )}
          {pratinjau && (
            <button style={st.tombol(sibuk)} disabled={sibuk} onClick={simpan}>
              <CheckCircle2 size={15} /> Simpan draf buku{ikutBank ? ' + bank soal' : ''}
            </button>
          )}
        </div>
        {gambar.length > 0 && (
          <div style={{ fontSize: 11.5, color: identitas.materi ? '#92400e' : '#166534', background: identitas.materi ? '#fffbeb' : '#f0fdf4', border: `1px solid ${identitas.materi ? '#fde68a' : '#bbf7d0'}`, borderRadius: 8, padding: '7px 10px', marginTop: 10 }}>
            {identitas.materi
              ? `Materi diisi manual: "${identitas.materi}" — nama bab otomatis tetap dipakai bila terbaca, isi ini jadi cadangan.`
              : 'Buku berisi semua bab? Biarkan kosong — nama bab dibaca otomatis dari tulisan tercetak di scan dan menjadi identitas soal per bab (jenjang & kelas tetap wajib karena itu sasaran siswa).'}
          </div>
        )}
      </div>

      {pratinjau && (
        <div style={st.kartu}>
          <div style={st.label}>3 · PRATINJAU HASIL EKSTRAKSI</div>
          {pratinjau.babs.map((b, i) => (
            <div key={i} style={{ border: '1px solid #f1f5f9', borderRadius: 10, padding: '8px 10px', marginBottom: 8, fontSize: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ display: 'inline-flex', gap: 5, alignItems: 'center', fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={b.disertakan !== false} onChange={(e) => setPratinjau((prev) => ({ ...prev, babs: prev.babs.map((x, xi) => (xi === i ? { ...x, disertakan: e.target.checked } : x)) }))} />
                  ikut
                </label>
                <b style={{ whiteSpace: 'nowrap' }}>Bab {i + 1} · hal {b.halamanMulai}-{b.halamanSelesai}:</b>
                <input
                  value={b.judulEdit}
                  onChange={(e) => setPratinjau((prev) => ({ ...prev, babs: prev.babs.map((x, xi) => (xi === i ? { ...x, judulEdit: e.target.value } : x)) }))}
                  placeholder={`nama bab (otomatis terbaca; koreksi bila perlu)`}
                  style={{ flex: 1, minWidth: 220, padding: '5px 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                />
                <span style={{ color: '#6b7280', fontSize: 11 }}>{b.sections?.length || 0} seksi · {b.ujiPemahaman?.length || 0} soal · via {(b.provider || []).join('/') || '-'}</span>
              </div>
            </div>
          ))}
          <div style={{ fontSize: 11, color: '#6b7280' }}>Nama bab terbaca OTOMATIS dari tulisan tercetak di halaman scan; kolom ini hanya untuk KOREKSI bila bacaan AI meleset.</div>
          {pratinjau.butir.length > 0 && (
            <details style={{ fontSize: 12, color: '#374151' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700 }}>Tinjau {pratinjau.butir.length} soal yang akan masuk bank (klik untuk membuka)</summary>
              {pratinjau.butir.map((b, i) => (
                <label key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 0', borderTop: '1px solid #f8fafc' }}>
                  <input type="checkbox" checked={b.dipilih} onChange={(e) => {
                    const next = { ...pratinjau, butir: pratinjau.butir.map((x, xi) => (xi === i ? { ...x, dipilih: e.target.checked } : x)) };
                    setPratinjau(next);
                  }} />
                  <span><b>[{b.asal}]</b> {b.soal.slice(0, 140)} <i style={{ color: '#6b7280' }}>· kunci {b.kunciJawaban}</i></span>
                </label>
              ))}
            </details>
          )}
        </div>
      )}

      {log.length > 0 && (
        <div style={st.kartu}>
          <div style={st.label}>LOG PROSES</div>
          {log.map((l, i) => <div key={i} style={st.log(l.ok)}>{l.teks}</div>)}
        </div>
      )}
    </div>
  );
}
