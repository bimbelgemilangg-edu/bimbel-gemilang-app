import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import StudentList from './StudentList';
import StudentDetail from './StudentDetail';
import StudentForm from './StudentForm';

export default function StudentManager({ db }) {
  const [view, setView] = useState('list'); // 'list' | 'detail' | 'form'
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // --- DATABASE MASTER (Single Source of Truth) ---
  const [students, setStudents] = useState([]);
  const [invoices, setInvoices] = useState([]); // Data Keuangan Pusat
  const [payments, setPayments] = useState([]); // Data Pembayaran Pusat
  const [classLogs, setClassLogs] = useState([]); // Data Absensi

  useEffect(() => {
    // 1. Load Siswa
    const unsub1 = onSnapshot(query(collection(db, "students"), orderBy("createdAt", "desc")), s => 
      setStudents(s.docs.map(d => ({id: d.id, ...d.data()})))
    );
    // 2. Load Tagihan (Keuangan)
    const unsub2 = onSnapshot(collection(db, "invoices"), s => 
      setInvoices(s.docs.map(d => ({id: d.id, ...d.data()})))
    );
    // 3. Load Riwayat Bayar (Keuangan)
    const unsub3 = onSnapshot(query(collection(db, "payments"), orderBy("date", "desc")), s => 
      setPayments(s.docs.map(d => ({id: d.id, ...d.data()})))
    );
    // 4. Load Absensi
    const unsub4 = onSnapshot(query(collection(db, "class_logs"), orderBy("date", "desc")), s => 
      setClassLogs(s.docs.map(d => ({id: d.id, ...d.data()})))
    );

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, [db]);

  // --- NAVIGASI ---
  const handleSelect = (student) => {
    setSelectedStudent(student);
    setView('detail');
  };

  const handleCreate = () => {
    setSelectedStudent(null);
    setView('form');
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setView('form');
  };

  const handleBack = () => {
    setSelectedStudent(null);
    setView('list');
  };

  return (
    <div className="w-full">
      {view === 'list' && (
        <StudentList 
          students={students} 
          onSelect={handleSelect} 
          onCreate={handleCreate} 
        />
      )}

      {view === 'detail' && selectedStudent && (
        <StudentDetail 
          student={selectedStudent}
          // Filter data khusus siswa ini saja
          studentInvoices={invoices.filter(inv => inv.studentId === selectedStudent.id)}
          studentPayments={payments.filter(p => p.studentName === selectedStudent.name)} // Pastikan konsisten ID/Nama
          studentLogs={classLogs.filter(l => l.studentsLog.some(s => s.id === selectedStudent.id))}
          onBack={handleBack}
          onEdit={() => handleEdit(selectedStudent)}
        />
      )}

      {view === 'form' && (
        <StudentForm 
          db={db} 
          initialData={selectedStudent} // Jika null = Buat Baru, Ada isi = Edit
          onCancel={handleBack}
          onSuccess={handleBack}
        />
      )}
    </div>
  );
}