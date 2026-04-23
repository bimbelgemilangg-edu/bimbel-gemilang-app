return (
  <div style={styles.wrapper}>
    <SidebarAdmin />
    <div style={styles.mainContent(isMobile)}>
      
      <div style={styles.header(isMobile)}>
        <h2 style={styles.pageTitle(isMobile)}><ShieldAlert size={20} /> Daily Audit Intelligence</h2>
        <div style={styles.headerButtons(isMobile)}>
          <button onClick={fetchAttendanceSummary} style={styles.btnRefresh(isMobile)}><RefreshCw size={14} /> Refresh</button>
          <input type="date" style={styles.dateInput(isMobile)} value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} />
        </div>
      </div>

      {/* REKAP ABSENSI */}
      <div style={styles.sectionCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15, cursor: 'pointer' }} onClick={() => setSelectedClass(null)}>
          <h3 style={styles.sectionTitle(isMobile)}><Users size={18} /> Rekap Kehadiran Hari Ini</h3>
          <span style={styles.liveDot}></span>
        </div>
        <div style={styles.attendanceGrid(isMobile)}>
          {attendanceSummary.length === 0 ? (
            <div style={styles.emptyState}>Belum ada data absensi hari ini.</div>
          ) : (
            attendanceSummary.map((kelas, idx) => (
              <div key={kelas.jadwalId || idx} style={styles.attendanceCard(isMobile)} onClick={() => setSelectedClass(selectedClass === idx ? null : idx)}>
                <div style={styles.classHeader}>
                  <h4 style={styles.className(isMobile)}>{kelas.title}</h4>
                  <span style={styles.roomBadge(isMobile)}>{kelas.room}</span>
                </div>
                <div style={styles.classInfo(isMobile)}>
                  <span>👨‍🏫 {kelas.teacher}</span>
                  <span>⏰ {kelas.start} - {kelas.end}</span>
                </div>
                <div style={styles.attendanceBar}>
                  <div style={{...styles.barHadir, width: `${kelas.totalStudents > 0 ? (kelas.totalHadir / kelas.totalStudents) * 100 : 0}%`}}>
                    {kelas.totalHadir > 0 && `✅ ${kelas.totalHadir}`}
                  </div>
                  <div style={{...styles.barTidakHadir, width: `${kelas.totalStudents > 0 ? (kelas.totalTidakHadir / kelas.totalStudents) * 100 : 0}%`}}>
                    {kelas.totalTidakHadir > 0 && `❌ ${kelas.totalTidakHadir}`}
                  </div>
                </div>
                <div style={styles.attendanceNumbers}>
                  <span>Hadir: {kelas.totalHadir}/{kelas.totalStudents}</span>
                  <span>Tidak Hadir: {kelas.totalTidakHadir}</span>
                </div>
                {selectedClass === idx && (
                  <div style={styles.detailDropdown}>
                    <div style={styles.detailSection}><strong>✅ Hadir ({kelas.hadir.length}):</strong><p>{kelas.hadir.length > 0 ? kelas.hadir.join(', ') : 'Belum ada'}</p></div>
                    <div style={styles.detailSection}><strong>❌ Tidak Hadir ({kelas.tidakHadir.length}):</strong>
                      {kelas.tidakHadir.length > 0 ? kelas.tidakHadir.map((s, i) => (
                        <div key={i} style={styles.absentItem}><span>{s.nama}</span><span style={styles.absentStatus(s.status)}>{s.status}</span><span style={styles.absentKet}>{s.keterangan}</span></div>
                      )) : <p>Semua hadir 🎉</p>}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* FORM AUDIT */}
      <form onSubmit={handleSubmit}>
        <div style={styles.formGrid(isMobile)}>
          <div style={styles.formColumn}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}><Clock size={18} /> Shift & Guru Bertugas</h3>
              <div style={styles.grid2}>
                <input style={styles.input} placeholder="Nama Admin" onChange={e => setFormData({...formData, adminName: e.target.value})} required />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={styles.input} placeholder="Jam Masuk" onChange={e => setFormData({...formData, jamMasuk: e.target.value})} required />
                  <input style={styles.input} placeholder="Jam Pulang" onChange={e => setFormData({...formData, jamPulang: e.target.value})} required />
                </div>
              </div>
              <div style={{ marginTop: 15 }}>
                <label style={styles.label}>Pilih Guru/Tentor yang Hadir</label>
                <select style={styles.input} onChange={e => setFormData({...formData, tentor: {...formData.tentor, id: e.target.value}})}>
                  <option value="">-- Klik untuk Pilih Guru --</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.nama}</option>)}
                </select>
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}><UserCheck size={18} /> Audit Kehadiran Siswa</h3>
              <div style={styles.grid2}>
                <div><label style={styles.label}>Jumlah Siswa Hadir</label><input type="number" style={styles.input} onChange={e => setFormData({...formData, siswa: {...formData.siswa, jumlahHadir: e.target.value}})} /></div>
                <div><label style={styles.label}>Nama Siswa Tidak Hadir</label><input style={styles.input} placeholder="Sebutkan nama-nama" onChange={e => setFormData({...formData, siswa: {...formData.siswa, namaTidakHadir: e.target.value}})} /></div>
              </div>
              <label style={styles.label}>Alasan Tidak Hadir</label>
              <textarea style={styles.textareaSmall} placeholder="Jelaskan alasan..." onChange={e => setFormData({...formData, siswa: {...formData.siswa, alasanAbsen: e.target.value}})} />
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}><CreditCard size={18} /> Log Transaksi & Narasi</h3>
              <textarea style={styles.textareaSmall} placeholder="Log Pembayaran (Nama - Nominal - Via)" onChange={e => setFormData({...formData, operasional: {...formData.operasional, pembayaranMasuk: e.target.value}})} />
              <div style={{ marginTop: 20 }}>
                <div style={styles.toolbarRow}>
                  <label style={styles.label}>Narasi Aktivitas Hari Ini</label>
                  <div style={styles.toolbar}>
                    <button type="button" onClick={() => applyFormat('B')} style={styles.toolBtn}><Bold size={14}/></button>
                    <button type="button" onClick={() => applyFormat('I')} style={styles.toolBtn}><Italic size={14}/></button>
                    <button type="button" onClick={() => applyFormat('L')} style={styles.toolBtn}><List size={14}/></button>
                  </div>
                </div>
                <textarea id="canvasNarasi" style={styles.canvas} value={formData.canvasNarasi} onChange={e => setFormData({...formData, canvasNarasi: e.target.value})} placeholder="Tuliskan semua detail kegiatan..." />
              </div>
            </div>
          </div>

          <div style={styles.formColumn}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}><AlertTriangle size={18} /> Risk Management</h3>
              <select style={styles.input} value={formData.riskLevel} onChange={e => setFormData({...formData, riskLevel: e.target.value})}>
                <option>🟢 Aman</option><option>🟡 Ada Masalah (Follow Up)</option><option>🔴 Urgent (Lapor Owner)</option>
              </select>
              <label style={styles.label}>Tambah Risiko Sendiri</label>
              <textarea style={styles.textareaSmall} placeholder="Input masalah spesifik..." onChange={e => setFormData({...formData, customRisk: e.target.value})} />
              <div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 15 }}>
                <h4 style={{ fontSize: 12, marginBottom: 10 }}>Closing Checklist</h4>
                {Object.keys(formData.checklist).map(key => (
                  <label key={key} style={styles.checkItem}>
                    <input type="checkbox" onChange={e => setFormData({...formData, checklist: {...formData.checklist, [key]: e.target.checked}})} />
                    <span>{key.replace(/([A-Z])/g, ' $1').toUpperCase()} OK</span>
                  </label>
                ))}
              </div>
              <button type="submit" style={styles.btnSubmit} disabled={loading}><Save size={16} /> {loading ? 'Processing...' : 'Simpan & Kunci Laporan'}</button>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}><Table size={18} /> Audit Trail</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {history.map(log => (
                  <div key={log.id} style={styles.historyRow}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 'bold', fontSize: 13 }}>{log.tanggal}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{log.adminName} ({log.jamMasuk}-{log.jamPulang})</div>
                    </div>
                    <button type="button" onClick={() => handleExportPDF(log)} style={styles.btnPdf}><FileText size={14} /> PDF</button>
                    <button type="button" onClick={() => handleExportExcel(log)} style={styles.btnExcel}><FileSpreadsheet size={14} /> Excel</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
);
};

const styles = {
wrapper: { display: 'flex', background: '#f8fafc', minHeight: '100vh' },
mainContent: (m) => ({ marginLeft: m ? '0' : '260px', padding: m ? '15px' : '30px', width: '100%', boxSizing: 'border-box', overflowX: 'hidden', transition: '0.3s' }),
header: (m) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: m ? 15 : 25, flexWrap: 'wrap', gap: 10 }),
pageTitle: (m) => ({ margin: 0, color: '#1e293b', fontSize: m ? 18 : 22, display: 'flex', alignItems: 'center', gap: 8 }),
headerButtons: (m) => ({ display: 'flex', alignItems: 'center', gap: m ? 8 : 10, flexWrap: 'wrap' }),
btnRefresh: (m) => ({ background: 'white', border: '1px solid #e2e8f0', padding: m ? '6px 10px' : '8px 15px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: m ? 11 : 12, fontWeight: 600 }),
dateInput: (m) => ({ padding: m ? '6px 10px' : '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: m ? 12 : 13 }),
sectionCard: { background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: 25, width: '100%', boxSizing: 'border-box' },
sectionTitle: (m) => ({ margin: 0, fontSize: m ? 14 : 16, color: '#0f172a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }),
liveDot: { width: 10, height: 10, borderRadius: '50%', background: '#27ae60', animation: 'pulse 2s infinite', display: 'inline-block' },
attendanceGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }),
attendanceBar: { display: 'flex', height: 22, borderRadius: 11, overflow: 'hidden', marginTop: 8, background: '#f1f5f9' },
barHadir: { background: '#27ae60', color: 'white', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', transition: 'width 0.5s', minWidth: 'fit-content', padding: '0 4px' },
barTidakHadir: { background: '#e74c3c', color: 'white', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', transition: 'width 0.5s', minWidth: 'fit-content', padding: '0 4px' },
attendanceNumbers: { display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginTop: 4 },
attendanceCard: (m) => ({ background: '#f8fafc', padding: m ? 12 : 15, borderRadius: 12, cursor: 'pointer', transition: '0.2s', border: '1px solid #f1f5f9' }),
classHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
className: (m) => ({ margin: 0, fontSize: m ? 13 : 14, color: '#1e293b' }),
roomBadge: (m) => ({ background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: 10, fontSize: m ? 9 : 10, fontWeight: 'bold' }),
classInfo: (m) => ({ fontSize: m ? 10 : 11, color: '#64748b', display: 'flex', gap: m ? 8 : 12, flexWrap: 'wrap' }),
detailDropdown: { marginTop: 10, borderTop: '1px solid #f1f5f9', paddingTop: 10 },
detailSection: { marginBottom: 8 },
absentItem: { display: 'flex', gap: 8, alignItems: 'center', padding: '3px 0', fontSize: 11, flexWrap: 'wrap' },
absentStatus: (s) => ({ padding: '1px 6px', borderRadius: 6, fontSize: 9, fontWeight: 'bold', background: s === 'Alpha' || s === 'alpha' ? '#fee2e2' : s === 'Sakit' || s === 'sakit' ? '#fff3cd' : '#e0e7ff', color: s === 'Alpha' || s === 'alpha' ? '#ef4444' : s === 'Sakit' || s === 'sakit' ? '#f59e0b' : '#3730a3' }),
absentKet: { fontSize: 9, color: '#94a3b8' },
emptyState: { gridColumn: '1/-1', textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 },
formGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '2fr 1.2fr', gap: m ? '15px' : '25px' }),
formColumn: { display: 'flex', flexDirection: 'column', gap: 20 },
card: { background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', width: '100%', boxSizing: 'border-box' },
cardTitle: { fontSize: 14, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: 10, color: '#0f172a', fontWeight: 'bold' },
grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 },
label: { display: 'block', fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 5, marginTop: 10 },
input: { width: '100%', padding: 10, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' },
textareaSmall: { width: '100%', height: 70, padding: 10, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', marginTop: 5, resize: 'vertical' },
canvas: { width: '100%', height: 180, padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', background: '#fcfcfc', lineHeight: '1.5', resize: 'vertical' },
toolbarRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8, flexWrap: 'wrap', gap: 5 },
toolbar: { display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 8 },
toolBtn: { padding: '4px 8px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer' },
checkItem: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer', fontSize: 12 },
btnSubmit: { width: '100%', padding: 14, background: '#0f172a', color: 'white', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer', marginTop: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
historyRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f5f9' },
btnPdf: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, marginRight: 5 },
btnExcel: { background: '#e0f2fe', color: '#0284c7', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 },
};

export default AdminDailyLog;