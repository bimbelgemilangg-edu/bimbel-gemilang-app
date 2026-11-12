import os

file_path = 'src/pages/student/tryout/JalurUjianAiPage.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update handleMulaiUjian
old_handle = """  const handleMulaiUjian = async (unit) => {
    if (!unit || unit.status === 'locked' || sedangMenyiapkan) return;
    setSedangMenyiapkan(true);"""

new_handle = """  const handleMulaiUjian = async (unit) => {
    if (!unit || unit.status === 'locked' || unit.status === 'completed' || sedangMenyiapkan) {
      if (unit?.status === 'completed') {
        setPesanError('Misi try out ini sudah selesai dikerjakan dan tidak dapat dikerjakan lagi.');
      }
      return;
    }
    setSedangMenyiapkan(true);"""

assert old_handle in text, 'old_handle not found'
text = text.replace(old_handle, new_handle, 1)

# 2. Update modal buttons
old_buttons = """            <div style={{ marginTop: 20 }}>
              {unitTerpilih.status === 'current' ? (
                <button
                  type="button"
                  disabled={sedangMenyiapkan}
                  onClick={() => handleMulaiUjian(unitTerpilih)}
                  style={st.btnLuncurkanUjian}
                >
                  <Rocket size={20} />
                  <span>{sedangMenyiapkan ? 'Menyiapkan Simulasi...' : 'Luncurkan Simulasi Ujian 🚀'}</span>
                </button>
              ) : unitTerpilih.status === 'completed' ? (
                <button
                  type="button"
                  disabled={sedangMenyiapkan}
                  onClick={() => handleMulaiUjian(unitTerpilih)}
                  style={st.btnKerjakanUlang}
                >
                  <span>Kerjakan Latihan Lagi (Ulangi Misi)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setUnitTerpilih(null)}
                  style={st.btnTutupModal}
                >
                  Tutup
                </button>
              )}
            </div>"""

new_buttons = """            <div style={{ marginTop: 20 }}>
              {unitTerpilih.status === 'current' ? (
                <button
                  type="button"
                  disabled={sedangMenyiapkan}
                  onClick={() => handleMulaiUjian(unitTerpilih)}
                  style={st.btnLuncurkanUjian}
                >
                  <Rocket size={20} />
                  <span>{sedangMenyiapkan ? 'Menyiapkan Simulasi...' : 'Luncurkan Simulasi Ujian 🚀'}</span>
                </button>
              ) : unitTerpilih.status === 'completed' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 12,
                    padding: '11px 14px',
                    textAlign: 'center',
                    color: '#166534',
                    fontSize: 12.5,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}>
                    <CheckCircle2 size={18} color="#16a34a" />
                    <span>Ujian ini telah selesai dikerjakan (Hanya 1x pengerjaan).</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUnitTerpilih(null);
                      setModalReviewTerbuka(true);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 12,
                      padding: '12px 16px',
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 12px rgba(13,148,136,0.25)',
                    }}
                  >
                    <Brain size={18} />
                    <span>Lihat Analisis & Rapor Kemampuan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitTerpilih(null)}
                    style={st.btnTutupModal}
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setUnitTerpilih(null)}
                  style={st.btnTutupModal}
                >
                  Tutup
                </button>
              )}
            </div>"""

assert old_buttons in text, 'old_buttons not found'
text = text.replace(old_buttons, new_buttons, 1)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print('Patched JalurUjianAiPage.jsx successfully!')
