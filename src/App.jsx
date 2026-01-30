import React, { useEffect, useState } from 'react';
import { db } from './firebase'; // Import koneksi yang tadi kita buat
import { collection, getDocs } from 'firebase/firestore';

function App() {
  const [status, setStatus] = useState("Memeriksa koneksi...");

  useEffect(() => {
    const cekKoneksi = async () => {
      try {
        // Coba akses koleksi sembarang untuk tes koneksi
        await getDocs(collection(db, "test_connection")); 
        setStatus("✅ SUKSES: Sistem Bimbel Gemilang Terhubung ke Database!");
      } catch (error) {
        console.error("Error:", error);
        setStatus("❌ GAGAL: Koneksi Database Error. Cek Console.");
      }
    };

    cekKoneksi();
  }, []);

  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'Arial' }}>
      <h1>System Check - Bimbel Gemilang</h1>
      <hr />
      <h3>Status Database:</h3>
      <h2 style={{ color: status.includes("SUKSES") ? 'green' : 'red' }}>
        {status}
      </h2>
      <p>Menunggu instruksi selanjutnya dari Lead Developer...</p>
    </div>
  );
}

export default App;