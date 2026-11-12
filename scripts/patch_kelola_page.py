import os

file_path = 'src/pages/admin/tobk/KelolaTobkPublikPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update imports
old_imp = """  ambilSemuaLeadsTobk, eksporLeadsCsv, eksporRekapNilaiExcel, bersihkanDataEventTobk,
  SUBTES_RESMI_UTBK_2026, SESI_RESMI_TKA_2026, SOAL_PRESET_UTBK"""
new_imp = """  ambilSemuaLeadsTobk, eksporLeadsCsv, eksporRekapNilaiExcel, bersihkanDataEventTobk,
  pulihkanPesertaTobk, hitungUlangSkorPeserta, hapusSatuPesertaTobk,
  SUBTES_RESMI_UTBK_2026, SESI_RESMI_TKA_2026, SOAL_PRESET_UTBK"""
assert old_imp in text, 'old_imp not found'
text = text.replace(old_imp, new_imp, 1)

# 2. Update handlePilihEvent
old_pilih = """  const handlePilihEvent = async (eId) => {
    setSelectedEventId(eId);
    setRefreshing(true);
    try {
      const leadData = await ambilSemuaLeadsTobk(eId);
      setLeads(leadData);
    } finally {
      setRefreshing(false);
    }
  };"""

new_pilih = """  const handlePilihEvent = async (eId) => {
    setSelectedEventId(eId);
    setRefreshing(true);
    try {
      const targetId = (eId === 'semua' || !eId) ? null : eId;
      const leadData = await ambilSemuaLeadsTobk(targetId);
      setLeads(leadData);
    } finally {
      setRefreshing(false);
    }
  };"""
assert old_pilih in text, 'old_pilih not found'
text = text.replace(old_pilih, new_pilih, 1)

# 3. Update currentEvent handling for 'semua'
old_current_event = """  const currentEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || events[0] || null;
  }, [events, selectedEventId]);"""

new_current_event = """  const currentEvent = useMemo(() => {
    if (selectedEventId === 'semua') {
      return { id: 'semua', judul: 'Seluruh Event & Sesi Ujian (Global)', token: '-' };
    }
    return events.find((e) => e.id === selectedEventId) || events[0] || null;
  }, [events, selectedEventId]);"""
assert old_current_event in text, 'old_current_event not found'
text = text.replace(old_current_event, new_current_event, 1)

# 4. Add action handlers for recover, recalculate score, and delete participant
target_handlers_pos = "  const handleKonfirmasiPurge = async (hapusEventSekaligus = false) => {"
new_handlers = """  // Action Handler: Pulihkan Peserta yang Diskualifikasi / Terkena Gangguan Teknis Laptop
  const handlePulihkanPeserta = async (lead) => {
    const nama = lead.nama || 'Peserta';
    if (!window.confirm(`Pulihkan sesi ujian untuk "${nama}"?\\n\\nSistem akan mereset pelanggaran/strike menjadi 0 dan mengembalikan status ke "Sedang Mengerjakan". Siswa dapat lanjut ujian di perangkat mana pun.`)) {
      return;
    }
    try {
      const res = await pulihkanPesertaTobk(lead.pesertaId || lead.id, 'mengerjakan');
      alert(res.message || 'Peserta berhasil dipulihkan!');
      await handlePilihEvent(selectedEventId);
    } catch (err) {
      alert('Gagal memulihkan peserta: ' + err.message);
    }
  };

  // Action Handler: Hitung Ulang & Terbitkan Nilai dari Jawaban Tersimpan di Database
  const handleHitungUlangSkor = async (lead) => {
    const nama = lead.nama || 'Peserta';
    if (!window.confirm(`Kalkulasi & terbitkan nilai untuk "${nama}"?\\n\\nSistem akan mengambil seluruh butir jawaban yang tersimpan di cloud, mencocokkan dengan kunci jawaban resmi, dan menerbitkan skor akhir serta status Selesai.`)) {
      return;
    }
    try {
      const res = await hitungUlangSkorPeserta(lead.pesertaId || lead.id, lead.eventId || currentEvent?.id);
      if (res.success) {
        alert(res.message);
        await handlePilihEvent(selectedEventId);
      } else {
        alert('Gagal: ' + res.message);
      }
    } catch (err) {
      alert('Gagal menghitung skor: ' + err.message);
    }
  };

  // Action Handler: Reset Strike Pelanggaran
  const handleResetStrike = async (lead) => {
    const nama = lead.nama || 'Peserta';
    try {
      const res = await pulihkanPesertaTobk(lead.pesertaId || lead.id, lead.statusUjian || 'mengerjakan');
      alert(`Strike pelanggaran untuk "${nama}" berhasil di-reset ke 0!`);
      await handlePilihEvent(selectedEventId);
    } catch (err) {
      alert('Gagal reset strike: ' + err.message);
    }
  };

  // Action Handler: Hapus Satu Peserta (Untuk Registrasi Ulang Bersih)
  const handleHapusSatuPeserta = async (lead) => {
    const nama = lead.nama || 'Peserta';
    if (!window.confirm(`Hapus permanen pendaftaran "${nama}"?\\n\\nGunakan ini jika siswa ingin mendaftar ulang secara bersih dari awal.`)) {
      return;
    }
    try {
      const res = await hapusSatuPesertaTobk(lead.pesertaId || lead.id);
      alert(res.message || 'Data peserta berhasil dihapus!');
      await handlePilihEvent(selectedEventId);
    } catch (err) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  const handleKonfirmasiPurge = async (hapusEventSekaligus = false) => {"""
assert target_handlers_pos in text, 'target_handlers_pos not found'
text = text.replace(target_handlers_pos, new_handlers, 1)

# 5. Add "Semua Event" option in event selector
old_select_options = """              <select
                value={selectedEventId}
                onChange={(e) => handlePilihEvent(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600, color: '#0f172a', background: '#f8fafc' }}
              >
                {events.map((ev) => ("""

new_select_options = """              <select
                value={selectedEventId}
                onChange={(e) => handlePilihEvent(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600, color: '#0f172a', background: '#f8fafc' }}
              >
                <option value="semua">
                  🌐 Semua Event & Sesi (Tampilkan Seluruh Peserta)
                </option>
                {events.map((ev) => ("""
assert old_select_options in text, 'old_select_options not found'
text = text.replace(old_select_options, new_select_options, 1)

# 6. Update table header: add "Aksi Admin" column
old_thead = """                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Skor</th>
                <th style={{ padding: '12px 16px' }}>Pelanggaran</th>
                <th style={{ padding: '12px 16px' }}>Waktu Daftar</th>
              </tr>"""

new_thead = """                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Skor</th>
                <th style={{ padding: '12px 16px' }}>Pelanggaran</th>
                <th style={{ padding: '12px 16px' }}>Waktu Daftar</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', minWidth: '170px' }}>Aksi Solusi Admin</th>
              </tr>"""
assert old_thead in text, 'old_thead not found'
text = text.replace(old_thead, new_thead, 1)

# 7. Update colSpan in empty table
old_empty = """                  <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>"""
new_empty = """                  <td colSpan={10} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>"""
assert old_empty in text, 'old_empty not found'
text = text.replace(old_empty, new_empty, 1)

# 8. Update table row: add Action buttons
old_row_end = """                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                        {lead.waktuDaftar ? new Date(lead.waktuDaftar).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                    </tr>"""

new_row_end = """                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                        {lead.waktuDaftar ? new Date(lead.waktuDaftar).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                          {lead.statusUjian === 'diskualifikasi' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handlePulihkanPeserta(lead)}
                                title="Batalkan diskualifikasi & izinkan siswa lanjut ujian"
                                style={{
                                  background: '#10b981', color: '#ffffff', border: 'none',
                                  padding: '5px 9px', borderRadius: '6px', fontSize: '11px',
                                  fontWeight: 700, cursor: 'pointer', display: 'inline-flex',
                                  alignItems: 'center', gap: '4px'
                                }}
                              >
                                🔄 Pulihkan
                              </button>
                              <button
                                type="button"
                                onClick={() => handleHitungUlangSkor(lead)}
                                title="Hitung nilai dari jawaban yang tersimpan di cloud & terbitkan nilai"
                                style={{
                                  background: '#3b82f6', color: '#ffffff', border: 'none',
                                  padding: '5px 9px', borderRadius: '6px', fontSize: '11px',
                                  fontWeight: 700, cursor: 'pointer', display: 'inline-flex',
                                  alignItems: 'center', gap: '4px'
                                }}
                              >
                                🧮 Hitung Nilai
                              </button>
                            </>
                          )}

                          {lead.statusUjian === 'mengerjakan' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleHitungUlangSkor(lead)}
                                title="Hitung nilai sekarang & tandai selesai (jika laptop siswa mati/selesai mendadak)"
                                style={{
                                  background: '#2563eb', color: '#ffffff', border: 'none',
                                  padding: '5px 9px', borderRadius: '6px', fontSize: '11px',
                                  fontWeight: 700, cursor: 'pointer'
                                }}
                              >
                                🧮 Hitung & Selesaikan
                              </button>
                              {lead.totalPelanggaran > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleResetStrike(lead)}
                                  title="Reset strike pelanggaran ke 0"
                                  style={{
                                    background: '#f59e0b', color: '#ffffff', border: 'none',
                                    padding: '5px 8px', borderRadius: '6px', fontSize: '11px',
                                    fontWeight: 700, cursor: 'pointer'
                                  }}
                                >
                                  🛡️ Reset Strike
                                </button>
                              )}
                            </>
                          )}

                          {lead.statusUjian === 'menunggu_token' && (
                            <button
                              type="button"
                              onClick={() => handleHitungUlangSkor(lead)}
                              title="Hitung skor dari jawaban tersimpan jika ada"
                              style={{
                                background: '#6366f1', color: '#ffffff', border: 'none',
                                padding: '5px 8px', borderRadius: '6px', fontSize: '11px',
                                fontWeight: 700, cursor: 'pointer'
                              }}
                            >
                              🧮 Cek Jawaban & Nilai
                            </button>
                          )}

                          {lead.statusUjian === 'selesai' && (
                            <button
                              type="button"
                              onClick={() => handleHitungUlangSkor(lead)}
                              title="Hitung ulang skor dengan kunci jawaban terbaru"
                              style={{
                                background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1',
                                padding: '4px 8px', borderRadius: '6px', fontSize: '11px',
                                fontWeight: 600, cursor: 'pointer'
                              }}
                            >
                              🔄 Rekalkulasi
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleHapusSatuPeserta(lead)}
                            title="Hapus data peserta ini jika ingin daftar ulang"
                            style={{
                              background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3',
                              padding: '4px 6px', borderRadius: '6px', fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>"""
assert old_row_end in text, 'old_row_end not found'
text = text.replace(old_row_end, new_row_end, 1)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Patched KelolaTobkPublikPage.jsx successfully!')
