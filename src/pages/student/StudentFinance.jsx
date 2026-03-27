import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { doc, getDoc } from "firebase/firestore";
import { Lock, AlertTriangle, PhoneCall } from 'lucide-react';

const StudentFinance = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const studentId = localStorage.getItem("studentId");

  useEffect(() => {
    const checkStatus = async () => {
      if (!studentId) return;
      const sSnap = await getDoc(doc(db, "students", studentId));
      if (sSnap.exists()) setStudent(sSnap.data());
      setLoading(false);
    };
    checkStatus();
  }, [studentId]);

  if (loading) return <div style={{padding: 50, textAlign: 'center'}}>Mengecek Status Akses...</div>;

  // LOGIKA BLOKIR
  if (student?.isBlocked) {
    return (
      <div style={lockStyles.overlay}>
        <div style={lockStyles.card}>
          <div style={lockStyles.iconCircle}><Lock size={40} color="#ef4444" /></div>
          <h2 style={lockStyles.title}>Akses Terbatas</h2>
          <p style={lockStyles.text}>
            Maaf **{student.nama}**, portal kamu dinonaktifkan sementara karena ada kendala administrasi.
          </p>
          <div style={lockStyles.infoBox}>
            <AlertTriangle size={16} />
            <span>Silakan selesaikan pembayaran cicilan untuk membuka akses Materi, Quiz, dan Raport.</span>
          </div>
          <button style={lockStyles.btnContact} onClick={() => window.open('https://wa.me/628123456789')}>
            <PhoneCall size={18} /> Hubungi Admin Keuangan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding: '30px'}}>
      <h2>Halaman Keuangan (Terbuka)</h2>
      <p>Status: Aman. Kamu bisa mengakses semua fitur Bimbel Gemilang.</p>
      {/* Masukkan tabel cicilan yang tadi di sini */}
    </div>
  );
};

const lockStyles = {
  overlay: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' },
  card: { background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px', width: '100%', border: '1px solid #fee2e2' },
  iconCircle: { background: '#fee2e2', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px' },
  text: { color: '#64748b', lineHeight: '1.6', marginBottom: '20px' },
  infoBox: { background: '#fefce8', border: '1px solid #fef08a', padding: '15px', borderRadius: '12px', display: 'flex', gap: '10px', color: '#854d0e', fontSize: '13px', textAlign: 'left', marginBottom: '25px' },
  btnContact: { background: '#2563eb', color: 'white', border: 'none', width: '100%', padding: '14px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }
};

export default StudentFinance;