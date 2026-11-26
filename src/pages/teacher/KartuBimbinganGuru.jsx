// src/pages/teacher/KartuBimbinganGuru.jsx
// ============================================================
// KARTU KENDALI BIMBINGAN & PARAF TENTOR (PORTAL GURU / TENTOR)
// - Tentor mencatat pertemuan (1..20): Mapel, Bab/Materi, Pemahaman Siswa, Sikap.
// - Tentor berwenang MEMBERI PARAF atau MENAHAN/MENGOSONGKAN PARAF jika siswa
//   ramai/tidak respek/tidak mengikuti bimbingan dengan baik, disertai alasan jelas
//   agar Orang Tua bisa mengecek langsung.
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import SidebarGuru from '../../components/SidebarGuru';
import { db } from '../../firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Search,
  UserCheck,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { isAkunBelajarAktif } from '../../utils/statusAkunSiswa';
import { bacaIdentitasGuru } from '../../utils/identitasGuru';

function toISODate(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}

export default function KartuBimbinganGuru() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const identitasGuru = useMemo(() => bacaIdentitasGuru(), []);
  const namaTentor = identitasGuru?.nama || 'Tentor Gemilang';
  const tentorId = identitasGuru?.id || identitasGuru?.teacherId || '';

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('SEMUA');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const [form, setForm] = useState({
    pertemuanKe: 1,
    tanggal: toISODate(new Date()),
    mapel: '',
    babMateri: '',
    pemahaman: 'Paham Penuh',
    sikap: 'Tertib & Fokus',
    parafTentor: true,
    alasanKosong: '',
  });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3200);
  };

  useEffect(() => {
    (async () => {
      setLoadingStudents(true);
      try {
        const snap = await getDocs(collection(db, 'students'));
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => isAkunBelajarAktif(s))
          .sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || ''), 'id'));
        setStudents(list);
      } catch (e) {
        console.error('Gagal memuat daftar siswa:', e);
      } finally {
        setLoadingStudents(false);
      }
    })();
  }, []);

  const kelasOptions = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      const k = String(s.kelasSekolah || s.kelas || '').trim();
      if (k) set.add(k);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'id', { numeric: true }));
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (filterKelas !== 'SEMUA') {
        const k = String(s.kelasSekolah || s.kelas || '').trim();
        if (k !== filterKelas) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNama = String(s.nama || '').toLowerCase().includes(q);
        const matchNis = String(s.studentId || '').toLowerCase().includes(q);
        if (!matchNama && !matchNis) return false;
      }
      return true;
    });
  }, [students, filterKelas, search]);

  const muatKartuSiswa = async (stu) => {
    if (!stu) return;
    setSelectedStudent(stu);
    setLoadingEntries(true);
    try {
      const sid = stu.studentId || stu.id;
      const [s1, s2] = await Promise.all([
        getDocs(query(collection(db, 'kartu_bimbingan'), where('studentDocId', '==', stu.id))).catch(() => ({ docs: [] })),
        sid !== stu.id
          ? getDocs(query(collection(db, 'kartu_bimbingan'), where('studentId', '==', sid))).catch(() => ({ docs: [] }))
          : Promise.resolve({ docs: [] }),
      ]);
      const map = new Map();
      [...s1.docs, ...s2.docs].forEach((d) => {
        map.set(d.id, { id: d.id, ...d.data() });
      });
      const list = Array.from(map.values()).sort(
        (a, b) => (Number(a.pertemuanKe) || 0) - (Number(b.pertemuanKe) || 0)
      );
      setEntries(list);
      const nextKe = Math.min(25, (list[list.length - 1]?.pertemuanKe || 0) + 1);
      setForm((prev) => ({ ...prev, pertemuanKe: nextKe }));
    } catch (e) {
      console.error('Gagal memuat kartu bimbingan:', e);
    } finally {
      setLoadingEntries(false);
    }
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (!form.mapel.trim() || !form.babMateri.trim()) {
      return showToast('⚠️ Mata pelajaran dan Bab/Materi wajib diisi!');
    }
    if (!form.parafTentor && !form.alasanKosong.trim()) {
      return showToast('⚠️ Wajib isi alasan kenapa paraf tentor ditahan/kosong (untuk orang tua)!');
    }

    setSaving(true);
    try {
      const payload = {
        studentDocId: selectedStudent.id,
        studentId: selectedStudent.studentId || selectedStudent.id,
        namaSiswa: selectedStudent.nama || '',
        kelasSiswa: selectedStudent.kelasSekolah || selectedStudent.kelas || '',
        pertemuanKe: Number(form.pertemuanKe) || 1,
        tanggal: form.tanggal,
        mapel: form.mapel.trim(),
        babMateri: form.babMateri.trim(),
        pemahaman: form.pemahaman,
        sikap: form.sikap,
        parafTentor: Boolean(form.parafTentor),
        alasanKosong: form.parafTentor ? '' : form.alasanKosong.trim(),
        tentorId,
        namaTentor,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'kartu_bimbingan'), payload);
      showToast(form.parafTentor ? '✅ Catatan & Paraf Tentor disimpan!' : '⛔ Catatan disimpan dengan Paraf DITAHAN!');
      setForm((prev) => ({
        ...prev,
        mapel: '',
        babMateri: '',
        parafTentor: true,
        alasanKosong: '',
      }));
      await muatKartuSiswa(selectedStudent);
    } catch (err) {
      console.error(err);
      showToast('❌ Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleParaf = async (entry) => {
    const baru = !entry.parafTentor;
    let alasan = entry.alasanKosong || '';
    if (!baru) {
      const input = window.prompt('Alasan menahan/mengosongkan paraf tentor (dilihat orang tua):', alasan || 'Kurang tertib / ramai di kelas');
      if (input === null) return;
      if (!input.trim()) return showToast('⚠️ Alasan wajib diisi saat menahan paraf.');
      alasan = input.trim();
    } else {
      alasan = '';
    }
    try {
      await updateDoc(doc(db, 'kartu_bimbingan', entry.id), {
        parafTentor: baru,
        alasanKosong: alasan,
        namaTentor,
      });
      showToast(baru ? '✅ Paraf Tentor diberikan' : '⛔ Paraf Tentor ditahan');
      muatKartuSiswa(selectedStudent);
    } catch (err) {
      showToast('❌ Gagal mengubah paraf: ' + err.message);
    }
  };

  const handleHapus = async (id) => {
    if (!window.confirm('Hapus catatan pertemuan ini?')) return;
    try {
      await deleteDoc(doc(db, 'kartu_bimbingan', id));
      showToast('🗑️ Catatan dihapus');
      muatKartuSiswa(selectedStudent);
    } catch (err) {
      showToast('❌ Gagal menghapus: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <SidebarGuru />
      <main style={{ flex: 1, marginLeft: isMobile ? 0 : 250, padding: isMobile ? '72px 14px 28px' : '24px 28px', boxSizing: 'border-box' }}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 21, fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardCheck size={24} color="#0d9488" />
            <span>Kartu Kendali Bimbingan &amp; Paraf Tentor</span>
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
            Catat materi/bab hari ini, cek pemahaman siswa, serta berikan atau <b>tahan paraf tentor</b> jika siswa ramai/tidak respek di kelas (tercetak otomatis ke Kartu Bimbingan F4 untuk validasi Orang Tua &amp; Admin).
          </p>
        </div>

        {toast && (
          <div style={{ background: '#0f172a', color: '#ffffff', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
            {toast}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '310px 1fr', gap: 16, alignItems: 'start' }}>
          {/* PANEL KIRI: PILIH SISWA */}
          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
              1. Pilih Siswa ({filteredStudents.length})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 10px', marginBottom: 8 }}>
              <Search size={14} color="#94a3b8" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama / NIS siswa..."
                style={{ border: 'none', outline: 'none', fontSize: 12.5, width: '100%' }}
              />
            </div>
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12.5, marginBottom: 10 }}
            >
              <option value="SEMUA">Semua Kelas</option>
              {kelasOptions.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>

            <div style={{ maxHeight: 460, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {loadingStudents ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#64748b', fontSize: 12.5 }}>Memuat siswa...</div>
              ) : filteredStudents.map((s) => {
                const aktif = selectedStudent?.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => muatKartuSiswa(s)}
                    style={{
                      textAlign: 'left',
                      padding: '9px 11px',
                      borderRadius: 10,
                      border: `1.5px solid ${aktif ? '#0d9488' : '#e2e8f0'}`,
                      background: aktif ? '#f0fdfa' : '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{s.nama}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      {s.studentId || s.id} • {s.kelasSekolah || s.kelas || '-'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PANEL KANAN: FORM PARAF & RIWAYAT 20 PERTEMUAN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!selectedStudent ? (
              <div style={{ ...S.card, textAlign: 'center', padding: 48, color: '#64748b' }}>
                <BookOpen size={36} color="#94a3b8" style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 15, fontWeight: 800, color: '#334155' }}>Pilih siswa di sebelah kiri</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Untuk mencatat materi, mengecek pemahaman, dan memberikan paraf tentor.</div>
              </div>
            ) : (
              <>
                <div style={S.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#0d9488', textTransform: 'uppercase' }}>
                        Kartu Kendali Siswa (25 Pertemuan)
                      </div>
                      <h3 style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 900, color: '#0f172a' }}>
                        {selectedStudent.nama} • <span style={{ color: '#475569', fontWeight: 700 }}>{selectedStudent.kelasSekolah || selectedStudent.kelas}</span>
                      </h3>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, background: '#f1f5f9', color: '#334155', padding: '5px 12px', borderRadius: 99 }}>
                      Tentor: {namaTentor}
                    </span>
                  </div>

                  <form onSubmit={handleSimpan} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '110px 150px 1fr', gap: 10 }}>
                      <div>
                        <label style={S.label}>Pertemuan Ke</label>
                        <input
                          type="number"
                          min={1}
                          max={25}
                          value={form.pertemuanKe}
                          onChange={(e) => setForm({ ...form, pertemuanKe: e.target.value })}
                          style={S.input}
                        />
                      </div>
                      <div>
                        <label style={S.label}>Tanggal</label>
                        <input
                          type="date"
                          value={form.tanggal}
                          onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
                          style={S.input}
                        />
                      </div>
                      <div>
                        <label style={S.label}>Mata Pelajaran *</label>
                        <input
                          type="text"
                          placeholder="Misal: Matematika / Bahasa Indonesia"
                          value={form.mapel}
                          onChange={(e) => setForm({ ...form, mapel: e.target.value })}
                          style={S.input}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label style={S.label}>Bab &amp; Judul Materi Hari Ini *</label>
                      <input
                        type="text"
                        placeholder="Misal: Bab 1 - Bilangan Real & Operasi Akar"
                        value={form.babMateri}
                        onChange={(e) => setForm({ ...form, babMateri: e.target.value })}
                        style={S.input}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={S.label}>Cek Pemahaman Siswa</label>
                        <select
                          value={form.pemahaman}
                          onChange={(e) => setForm({ ...form, pemahaman: e.target.value })}
                          style={S.input}
                        >
                          <option value="Paham Penuh">✅ Paham Penuh</option>
                          <option value="Cukup Paham">🟡 Cukup Paham (Perlu Latihan)</option>
                          <option value="Perlu Pengulangan">🔴 Belum Paham / Perlu Pengulangan</option>
                        </select>
                      </div>
                      <div>
                        <label style={S.label}>Sikap &amp; Kedisiplinan di Kelas</label>
                        <select
                          value={form.sikap}
                          onChange={(e) => setForm({ ...form, sikap: e.target.value })}
                          style={S.input}
                        >
                          <option value="Tertib & Fokus">👍 Tertib &amp; Fokus</option>
                          <option value="Kurang Fokus">⚠️ Kurang Fokus</option>
                          <option value="Ramai / Tidak Respek">⛔ Ramai / Tidak Respek</option>
                        </select>
                      </div>
                    </div>

                    {/* KEPUTUSAN PARAF TENTOR */}
                    <div style={{ background: form.parafTentor ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${form.parafTentor ? '#86efac' : '#fecaca'}`, borderRadius: 12, padding: 12 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                        Kewenangan Paraf Tentor:
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, parafTentor: true })}
                          style={{
                            flex: 1, minWidth: 180, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 12.5,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            border: form.parafTentor ? '2px solid #16a34a' : '1px solid #cbd5e1',
                            background: form.parafTentor ? '#dcfce7' : '#ffffff', color: '#166534',
                          }}
                        >
                          <CheckCircle2 size={16} /> Beri Paraf Tentor (Disetujui)
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, parafTentor: false })}
                          style={{
                            flex: 1, minWidth: 180, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 800, fontSize: 12.5,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            border: !form.parafTentor ? '2px solid #dc2626' : '1px solid #cbd5e1',
                            background: !form.parafTentor ? '#fee2e2' : '#ffffff', color: '#991b1b',
                          }}
                        >
                          <XCircle size={16} /> Tahan / Kosongkan Paraf
                        </button>
                      </div>

                      {!form.parafTentor && (
                        <div style={{ marginTop: 10 }}>
                          <label style={{ ...S.label, color: '#991b1b' }}>
                            Alasan Paraf Dikosongkan (Dibaca Orang Tua) *
                          </label>
                          <input
                            type="text"
                            value={form.alasanKosong}
                            onChange={(e) => setForm({ ...form, alasanKosong: e.target.value })}
                            placeholder="Contoh: Siswa ramai saat penjelasan & tidak mengerjakan soal latihan"
                            style={{ ...S.input, borderColor: '#fca5a5' }}
                            required={!form.parafTentor}
                          />
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="submit"
                        disabled={saving}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          background: '#0d9488', color: '#ffffff', border: 'none', borderRadius: 10,
                          padding: '10px 20px', fontWeight: 800, fontSize: 13.5, cursor: 'pointer',
                        }}
                      >
                        <Plus size={16} /> {saving ? 'Menyimpan...' : 'Simpan Catatan Pertemuan'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* DAFTAR PERTEMUAN TERCATAT */}
                <div style={S.card}>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
                    Riwayat Bimbingan ({entries.length}/25 Pertemuan)
                  </div>
                  {loadingEntries ? (
                    <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>Memuat catatan...</div>
                  ) : entries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 24, color: '#64748b', fontSize: 13 }}>
                      Belum ada catatan bimbingan untuk siswa ini.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                            <th style={{ padding: '8px' }}>Ke</th>
                            <th style={{ padding: '8px' }}>Tanggal</th>
                            <th style={{ padding: '8px' }}>Mapel &amp; Bab/Materi</th>
                            <th style={{ padding: '8px' }}>Pemahaman &amp; Sikap</th>
                            <th style={{ padding: '8px' }}>Paraf Tentor</th>
                            <th style={{ padding: '8px' }}>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map((en) => (
                            <tr key={en.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px', fontWeight: 800 }}>#{en.pertemuanKe}</td>
                              <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>{en.tanggal}</td>
                              <td style={{ padding: '8px' }}>
                                <div style={{ fontWeight: 800, color: '#0f172a' }}>{en.mapel}</div>
                                <div style={{ fontSize: 11.5, color: '#475569' }}>{en.babMateri}</div>
                              </td>
                              <td style={{ padding: '8px' }}>
                                <div style={{ fontWeight: 700 }}>{en.pemahaman}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{en.sikap}</div>
                              </td>
                              <td style={{ padding: '8px' }}>
                                {en.parafTentor ? (
                                  <span style={{ background: '#dcfce7', color: '#166534', fontWeight: 800, padding: '3px 8px', borderRadius: 99, fontSize: 11 }}>
                                    ✓ {en.namaTentor}
                                  </span>
                                ) : (
                                  <div>
                                    <span style={{ background: '#fee2e2', color: '#991b1b', fontWeight: 800, padding: '3px 8px', borderRadius: 99, fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                      <AlertTriangle size={11} /> DITAHAN ({en.namaTentor})
                                    </span>
                                    {en.alasanKosong && (
                                      <div style={{ fontSize: 11, color: '#b91c1c', marginTop: 3 }}>
                                        Alasan: {en.alasanKosong}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '8px' }}>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleParaf(en)}
                                    title="Ubah status paraf"
                                    style={{ border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    <UserCheck size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleHapus(en.id)}
                                    title="Hapus"
                                    style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const S = {
  card: {
    background: '#ffffff',
    borderRadius: 16,
    padding: 18,
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
  },
  label: {
    display: 'block',
    fontSize: 11.5,
    fontWeight: 700,
    color: '#475569',
    marginBottom: 4,
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    fontSize: 13,
    boxSizing: 'border-box',
    background: '#ffffff',
  },
};
