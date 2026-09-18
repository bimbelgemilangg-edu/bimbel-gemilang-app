// src/pages/admin/bank-soal/BersihkanSoalPage.jsx
// ============================================================
// BERSIHKAN BANK SOAL (Admin) -- Langkah 2 dari roadmap perbaikan
// fondasi Bank Soal (setelah Langkah 1: tutup celah Penguatan Dasar).
// ============================================================
// Tujuan: DETEKSI OTOMATIS soal yang rusak/tidak lengkap dan soal
// duplikat, tapi TETAP ADA JEDA REVIEW sebelum benar-benar dihapus --
// bukan "klik sekali semua auto-bersih tanpa lihat dulu". Untuk operasi
// yang menghapus data, ini praktik yang lebih aman: deteksi boleh
// otomatis (dan kandidat yang jelas-jelas rusak/duplikat SUDAH
// otomatis tercentang), tapi admin tetap punya kesempatan uncheck
// sebelum tombol Hapus ditekan.
//
// 🔒 SOFT-DELETE, BUKAN HAPUS PERMANEN: soal yang "dihapus" di sini
// cuma ditandai status:'dihapus' (+ dihapusAlasan, dihapusPada) --
// TIDAK dipanggil deleteDoc(). Alasannya: ini fitur PERTAMA di sistem
// yang menghapus soal berdasarkan heuristik otomatis (bukan pilihan
// manual admin per-folder seperti fitur hapus folder yang sudah ada),
// jadi wajar kalau sesekali heuristiknya salah tandai -- soft-delete
// bikin itu bisa dipulihkan (tinggal balikin status jadi 'aktif' lewat
// Firestore console kalau ternyata keliru), beda dari hapus permanen
// yang gak bisa ditarik lagi.
//
// Semua query lain di sistem (Latihan Harian, Try Out, Audit Materi)
// SUDAH memfilter status:'aktif' atau mengecualikan status:'dihapus' --
// jadi begitu ditandai di sini, soal itu otomatis hilang dari semua
// jalur konsumsi tanpa perlu ubah file lain.
// ============================================================

import React, { useState, useCallback, useMemo } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, getDocs, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Trash2, Loader2, ScanSearch, AlertTriangle, Copy, ShieldQuestion, CheckSquare, Square } from 'lucide-react';

const TIPE_BUTUH_OPSI = ['pg_sederhana', 'pg_kompleks'];
const TIPE_BUTUH_KUNCI = ['pg_sederhana', 'pg_kompleks', 'benar_salah', 'pg_kategori', 'isian_singkat', 'numerik'];

function normalisasiTeks(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function kunciKosong(kunci) {
  if (kunci == null) return true;
  if (Array.isArray(kunci)) return kunci.length === 0;
  return String(kunci).trim() === '';
}

// Deteksi soal rusak/tidak lengkap -- return array alasan (kosong = aman)
function deteksiRusak(s) {
  const alasan = [];
  const tipe = s.tipe || 'pg_sederhana';

  if (!String(s.soal || '').trim()) alasan.push('Teks soal kosong');

  if (TIPE_BUTUH_OPSI.includes(tipe)) {
    const jumlahOpsi = Array.isArray(s.opsiJawaban) ? s.opsiJawaban.filter((o) => String(o?.teks ?? o ?? '').trim()).length : 0;
    if (jumlahOpsi < 2) alasan.push('Opsi jawaban kurang dari 2');
  }

  if (TIPE_BUTUH_KUNCI.includes(tipe) && kunciKosong(s.kunciJawaban)) {
    alasan.push('Kunci jawaban kosong');
  }

  if (['benar_salah', 'pg_kategori'].includes(tipe)) {
    const adaPernyataan = (Array.isArray(s.pernyataan) && s.pernyataan.length > 0) || (Array.isArray(s.tabelBenarSalah) && s.tabelBenarSalah.length > 0);
    if (!adaPernyataan) alasan.push('Tabel pernyataan Benar/Salah kosong');
  }

  if (tipe === 'menjodohkan' && (!Array.isArray(s.pasangan) || s.pasangan.length === 0)) {
    alasan.push('Daftar pasangan menjodohkan kosong');
  }

  return alasan;
}

// Skor "kelengkapan" -- dipakai buat milih 1 yang DISIMPAN dari tiap
// grup duplikat (yang skornya tertinggi yang dipertahankan).
function skorKelengkapan(s) {
  let skor = 0;
  if (s.kunciTerverifikasi !== false) skor += 2; // true atau tidak diisi (default true) dianggap lebih terpercaya
  if (String(s.pembahasan || '').trim().length > 20) skor += 1;
  if (Array.isArray(s.gambarUrls) && s.gambarUrls.length > 0) skor += 1;
  return skor;
}

export default function BersihkanSoalPage() {
  const [isMobile] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(false);
  const [sudahPindai, setSudahPindai] = useState(false);
  const [totalSoal, setTotalSoal] = useState(0);
  const [daftarRusak, setDaftarRusak] = useState([]); // [{ id, data, alasan }]
  const [grupDuplikat, setGrupDuplikat] = useState([]); // [{ kunci, anggota: [{id,data,skor}], idDisimpan }]
  const [daftarCekManual, setCekManual] = useState([]); // info only, [{ id, data, alasan }]
  const [tercentang, setTercentang] = useState(new Set()); // id soal yang akan dihapus
  const [menghapus, setMenghapus] = useState(false);
  const [statusHapus, setStatusHapus] = useState('');

  const pindai = useCallback(async () => {
    setLoading(true);
    setSudahPindai(false);
    try {
      const snap = await getDocs(collection(db, 'bank_soal'));
      const semua = snap.docs
        .map((d) => ({ id: d.id, data: d.data() }))
        .filter((s) => s.data.status !== 'nonaktif' && s.data.status !== 'dihapus');

      const rusak = [];
      const cekManual = [];
      const kandidatDuplikat = [];

      semua.forEach((s) => {
        const alasanRusak = deteksiRusak(s.data);
        if (alasanRusak.length > 0) {
          rusak.push({ ...s, alasan: alasanRusak });
          return; // soal rusak gak ikut dicek duplikat -- sudah pasti dihapus
        }
        const alasanCek = [];
        if (s.data.kunciTerverifikasi === false) alasanCek.push('Kunci jawaban belum terverifikasi (hasil analisis AI sendiri)');
        if (String(s.data.catatanAdmin || '').trim()) alasanCek.push(s.data.catatanAdmin.trim());
        if (alasanCek.length > 0) cekManual.push({ ...s, alasan: alasanCek });

        kandidatDuplikat.push(s);
      });

      // Kelompokkan kandidat duplikat: mapel + jenjang + kelas + teks
      // soal yang sudah dinormalisasi. Teks yang terlalu pendek (<15
      // karakter setelah dinormalisasi) DILEWATI dari pengecekan ini --
      // terlalu berisiko false-positive (mis. dua soal beda yang sama-
      // sama cuma "berapa hasilnya" tanpa angka spesifik di teks utama).
      const peta = new Map();
      kandidatDuplikat.forEach((s) => {
        const teks = normalisasiTeks(s.data.soal);
        if (teks.length < 15) return;
        const kunci = `${s.data.mataPelajaran || ''}|||${s.data.jenjang || ''}|||${s.data.tingkatKelas || ''}|||${teks}`;
        if (!peta.has(kunci)) peta.set(kunci, []);
        peta.get(kunci).push(s);
      });

      const grup = [...peta.entries()]
        .filter(([, anggota]) => anggota.length > 1)
        .map(([kunci, anggota]) => {
          const diurut = [...anggota].sort((a, b) => skorKelengkapan(b.data) - skorKelengkapan(a.data));
          return { kunci, anggota: diurut, idDisimpan: diurut[0].id };
        });

      // Default centang: semua yang rusak + semua anggota duplikat
      // KECUALI yang disimpan per grup.
      const centangAwal = new Set();
      rusak.forEach((s) => centangAwal.add(s.id));
      grup.forEach((g) => g.anggota.forEach((a) => { if (a.id !== g.idDisimpan) centangAwal.add(a.id); }));

      setDaftarRusak(rusak);
      setGrupDuplikat(grup);
      setCekManual(cekManual);
      setTercentang(centangAwal);
      setTotalSoal(semua.length);
      setSudahPindai(true);
    } catch (e) {
      console.error('Gagal memindai bank soal:', e);
      alert('Gagal memindai: ' + e.message);
    }
    setLoading(false);
  }, []);

  const toggleCentang = (id) => {
    setTercentang((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const jumlahDuplikatBerlebih = useMemo(() => grupDuplikat.reduce((acc, g) => acc + g.anggota.length - 1, 0), [grupDuplikat]);

  const hapusYangTercentang = useCallback(async () => {
    const idList = [...tercentang];
    if (idList.length === 0) return alert('Belum ada yang dicentang.');
    if (!window.confirm(`Tandai ${idList.length} soal sebagai dihapus (soft-delete, bisa dipulihkan lewat Firestore kalau perlu)? Soal ini langsung hilang dari Latihan Harian, Try Out, dan Audit Materi.`)) return;

    setMenghapus(true);
    try {
      for (let i = 0; i < idList.length; i += 400) {
        const potongan = idList.slice(i, i + 400);
        const batch = writeBatch(db);
        potongan.forEach((id) => {
          const rusakInfo = daftarRusak.find((s) => s.id === id);
          const alasan = rusakInfo ? `Rusak: ${rusakInfo.alasan.join('; ')}` : 'Duplikat dari soal lain';
          batch.update(doc(db, 'bank_soal', id), {
            status: 'dihapus',
            dihapusAlasan: alasan,
            dihapusPada: serverTimestamp(),
          });
        });
        await batch.commit();
        setStatusHapus(`${Math.min(i + 400, idList.length)}/${idList.length} soal ditandai dihapus...`);
      }
      setStatusHapus(`✅ Selesai. ${idList.length} soal ditandai dihapus.`);
      // Bersihkan tampilan dari yang sudah dihapus
      setDaftarRusak((prev) => prev.filter((s) => !tercentang.has(s.id)));
      setGrupDuplikat((prev) => prev
        .map((g) => ({ ...g, anggota: g.anggota.filter((a) => !tercentang.has(a.id)) }))
        .filter((g) => g.anggota.length > 1));
      setTercentang(new Set());
    } catch (e) {
      console.error('Gagal menghapus:', e);
      setStatusHapus('❌ Gagal: ' + e.message);
    }
    setMenghapus(false);
  }, [tercentang, daftarRusak]);

  const wrapper = { display: 'flex', background: '#f8fafc', minHeight: '100vh' };
  const mainContent = { marginLeft: isMobile ? '0' : '260px', padding: isMobile ? '15px' : '30px', width: '100%', boxSizing: 'border-box' };
  const cardStyle = { background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, marginBottom: 20 };
  const rowStyle = (checked) => ({ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, background: checked ? '#fef2f2' : '#f8fafc', marginBottom: 6, cursor: 'pointer' });

  return (
    <div style={wrapper}>
      <SidebarAdmin />
      <div style={mainContent}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: 0 }}>🧹 Bersihkan Bank Soal</h1>
          <p style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
            Langkah 2: deteksi otomatis soal rusak & duplikat. Soft-delete (ditandai, bukan dihapus permanen) -- tetap direview dulu sebelum ditekan Hapus.
          </p>
        </div>

        <button
          onClick={pindai}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#5B2ECC', color: 'white', border: 'none', borderRadius: 10, padding: '11px 20px', fontWeight: 700, fontSize: 13, cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, marginBottom: 20 }}
        >
          {loading ? <Loader2 size={16} className="spin" /> : <ScanSearch size={16} />}
          {loading ? 'Memindai...' : 'Pindai Bank Soal'}
        </button>

        {sudahPindai && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
              <div style={cardStyle}>
                <div style={{ fontSize: 11.5, color: '#6b7280', fontWeight: 700 }}>Total dipindai</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{totalSoal}</div>
              </div>
              <div style={{ ...cardStyle, borderColor: '#fecaca' }}>
                <div style={{ fontSize: 11.5, color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={13} /> Rusak</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626' }}>{daftarRusak.length}</div>
              </div>
              <div style={{ ...cardStyle, borderColor: '#fed7aa' }}>
                <div style={{ fontSize: 11.5, color: '#d97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Copy size={13} /> Duplikat berlebih</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#d97706' }}>{jumlahDuplikatBerlebih}</div>
              </div>
              <div style={cardStyle}>
                <div style={{ fontSize: 11.5, color: '#6b7280', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><ShieldQuestion size={13} /> Perlu cek manual</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{daftarCekManual.length}</div>
              </div>
            </div>

            <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, background: '#f5f3ff' }}>
              <div style={{ fontSize: 13, color: '#374151' }}>
                <strong>{tercentang.size}</strong> soal tercentang untuk ditandai dihapus.
              </div>
              <button
                onClick={hapusYangTercentang}
                disabled={menghapus || tercentang.size === 0}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#dc2626', color: 'white', border: 'none', borderRadius: 10, padding: '9px 16px', fontWeight: 700, fontSize: 12.5, cursor: menghapus ? 'default' : 'pointer', opacity: menghapus || tercentang.size === 0 ? 0.6 : 1 }}
              >
                {menghapus ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                Hapus yang tercentang ({tercentang.size})
              </button>
            </div>
            {statusHapus && <div style={{ fontSize: 12.5, color: '#374151', marginBottom: 14 }}>{statusHapus}</div>}

            {daftarRusak.length > 0 && (
              <div style={cardStyle}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>⚠️ Soal rusak/tidak lengkap</div>
                <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 14 }}>Semua sudah tercentang otomatis -- uncheck kalau ada yang menurutmu masih layak disimpan.</div>
                {daftarRusak.slice(0, 300).map((s) => (
                  <div key={s.id} style={rowStyle(tercentang.has(s.id))} onClick={() => toggleCentang(s.id)}>
                    {tercentang.has(s.id) ? <CheckSquare size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} /> : <Square size={16} color="#9ca3af" style={{ flexShrink: 0, marginTop: 2 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.data.soal || '(teks soal kosong)'}</div>
                      <div style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>{s.alasan.join(' · ')}</div>
                      <div style={{ fontSize: 10.5, color: '#9ca3af', marginTop: 2 }}>{s.data.mataPelajaran || '(kosong)'} · {s.data.jenjang || '(kosong)'} · Kelas {s.data.tingkatKelas || 'Semua'}</div>
                    </div>
                  </div>
                ))}
                {daftarRusak.length > 300 && <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 8 }}>...dan {daftarRusak.length - 300} lainnya (tetap ikut tercentang & terhapus).</div>}
              </div>
            )}

            {grupDuplikat.length > 0 && (
              <div style={cardStyle}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>📋 Soal duplikat</div>
                <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 14 }}>1 soal per grup DISIMPAN otomatis (yang paling lengkap: kunci terverifikasi, ada pembahasan/gambar) -- sisanya tercentang untuk dihapus.</div>
                {grupDuplikat.slice(0, 100).map((g) => (
                  <div key={g.kunci} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 6 }}>{g.anggota.length} soal identik -- {g.anggota[0].data.mataPelajaran || '(kosong)'} · {g.anggota[0].data.jenjang || '(kosong)'} · Kelas {g.anggota[0].data.tingkatKelas || 'Semua'}</div>
                    {g.anggota.map((a) => (
                      <div key={a.id} style={rowStyle(tercentang.has(a.id))} onClick={() => a.id !== g.idDisimpan && toggleCentang(a.id)}>
                        {a.id === g.idDisimpan ? (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#166534', background: '#dcfce7', borderRadius: 999, padding: '2px 8px', flexShrink: 0 }}>DISIMPAN</span>
                        ) : tercentang.has(a.id) ? (
                          <CheckSquare size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                        ) : (
                          <Square size={16} color="#9ca3af" style={{ flexShrink: 0, marginTop: 2 }} />
                        )}
                        <div style={{ fontSize: 12.5, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{a.data.soal}</div>
                      </div>
                    ))}
                  </div>
                ))}
                {grupDuplikat.length > 100 && <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 8 }}>...dan {grupDuplikat.length - 100} grup lainnya (tetap ikut tercentang & terhapus).</div>}
              </div>
            )}

            {daftarCekManual.length > 0 && (
              <div style={cardStyle}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>🔍 Perlu cek manual (TIDAK otomatis dihapus)</div>
                <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 14 }}>Bukan berarti rusak -- cuma kunci jawabannya hasil analisis AI sendiri (belum terverifikasi dari sumber) atau ada catatan admin dari proses impor. Sebaiknya diperiksa guru mapelnya, bukan langsung dihapus.</div>
                {daftarCekManual.slice(0, 200).map((s) => (
                  <div key={s.id} style={{ padding: '8px 12px', borderRadius: 10, background: '#f8fafc', marginBottom: 6 }}>
                    <div style={{ fontSize: 12.5, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.data.soal}</div>
                    <div style={{ fontSize: 11, color: '#0891b2', marginTop: 2 }}>{s.alasan.join(' · ')}</div>
                  </div>
                ))}
                {daftarCekManual.length > 200 && <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 8 }}>...dan {daftarCekManual.length - 200} lainnya.</div>}
              </div>
            )}

            {daftarRusak.length === 0 && grupDuplikat.length === 0 && (
              <div style={{ ...cardStyle, textAlign: 'center', color: '#166534', background: '#f0fdf4' }}>✅ Tidak ada soal rusak atau duplikat yang ditemukan.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}