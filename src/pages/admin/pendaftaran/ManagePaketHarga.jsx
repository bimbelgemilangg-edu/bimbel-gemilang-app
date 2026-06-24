// src/pages/admin/portal-siswa/ManagePaketHarga.jsx
import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, RefreshCw, BookOpen } from 'lucide-react';

const ManagePaketHarga = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paketData, setPaketData] = useState({ SD: [], SMP: [], SMA: [] });

  // Default data untuk pancingan awal jika Firestore masih kosong
  const DEFAULT_PAKET = {
    SD: [
      { id: "sd_fokus_1", nama: "SD Fokus 1 Bulan", harga: 95000, desc: "1 Mapel pilihan, tentor spesialis" },
      { id: "sd_lengkap_1", nama: "SD Lengkap 1 Bulan", harga: 250000, desc: "Matematika, B.Indo, B.Inggris, IPAS" }
    ],
    SMP: [
      { id: "smp_starter_1", nama: "SMP Starter 1 Bulan", harga: 230000, desc: "2 Mapel pilihan untuk jenjang SMP" },
      { id: "smp_lengkap_1", nama: "SMP Lengkap 1 Bulan", harga: 300000, desc: "Matematika, IPA, IPS, B.Indo, B.Inggris" }
    ],
    SMA: [
      { id: "sma_basic_1", nama: "SMA Basic 1 Bulan", harga: 349000, desc: "2 Mapel pilihan pendampingan SMA" },
      { id: "sma_lengkap_1", nama: "SMA Lengkap 1 Bulan", harga: 499000, desc: "Program Lengkap SMA Jurusan IPA/IPS" }
    ]
  };

  useEffect(() => {
    const fetchHarga = async () => {
      try {
        const docRef = doc(db, "settings", "paket_bimbel");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPaketData(docSnap.data());
        } else {
          // Jika belum ada di Firestore, pakai data default dan langsung buat dokumennya
          await setDoc(docRef, DEFAULT_PAKET);
          setPaketData(DEFAULT_PAKET);
        }
      } catch (error) {
        console.error("Gagal mengambil data harga:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHarga();
  }, []);

  const handleHargaChange = (jenjang, index, val) => {
    const updated = { ...paketData };
    updated[jenjang][index].harga = Number(val) || 0;
    setPaketData(updated);
  };

  const handleSaveToFirestore = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "paket_bimbel"), paketData);
      alert("✅ MANTAP! Semua perubahan harga paket berhasil disimpan live ke database.");
    } catch (error) {
      alert("❌ Gagal menyimpan harga: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 50, textAlign: 'center' }}>Memuat Sistem Harga...</div>;

  return (
    <div style={{ display: 'flex', background: '#f8fafc', minHeight: '100vh' }}>
      <SidebarAdmin />
      <div style={{ marginLeft: 250, padding: 30, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
          <h2 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={24} /> Pengatur Harga Paket Bimbel (Satu Pintu)
          </h2>
          <button 
            onClick={handleSaveToFirestore} 
            disabled={saving}
            style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {saving ? <RefreshCw size={16} /> : <Save size={16} />} {saving ? 'Menyimpan...' : 'Simpan Harga Live'}
          </button>
        </div>

        {Object.keys(paketData).map((jenjang) => (
          <div key={jenjang} style={{ background: 'white', padding: 20, borderRadius: 12, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2563eb', borderBottom: '2px solid #eff6ff', paddingBottom: 8 }}>Jenjang {jenjang}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {paketData[jenjang].map((paket, idx) => (
                <div key={paket.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#1e293b' }}>{paket.nama}</strong>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{paket.desc}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 'bold', color: '#64748b' }}>Rp</span>
                    <input 
                      type="number" 
                      value={paket.harga} 
                      onChange={(e) => handleHargaChange(jenjang, idx, e.target.value)}
                      style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, width: '150px', fontSize: 14, fontWeight: 'bold', color: '#0f172a' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManagePaketHarga;
