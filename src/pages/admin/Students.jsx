import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// --- PANGGIL FILE BARU DARI FOLDER STUDENTS ---
import StudentList from './students/StudentList';
import StudentForm from './students/StudentForm'; 
import StudentDetail from './students/StudentDetail'; 

export default function AdminStudents({ db }) {
  const [view, setView] = useState('list'); // list | form | detail
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // --- DATABASE MASTER (Satu Jalur Data) ---
  const [students, setStudents] = useState([]);
  const [invoices, setInvoices] = useState([]); 
  const [payments, setPayments] = useState([]); 
  const [classLogs, setClassLogs] = useState([]); 

  useEffect(() => {
    // 1. Ambil Data Siswa
    const unsub1 = onSnapshot(query(collection(db, "students"), orderBy("createdAt", "desc")), s => 
      setStudents(s.docs.map(d => ({id: d.id, ...d.data()})))
    );
    // 2. Ambil Tagihan
    const unsub2 = onSnapshot(collection(db, "invoices"), s => 
      setInvoices(s.docs.map(d => ({id: d.id, ...d.data()})))
    );
    // 3. Ambil Pembayaran
    const unsub3 = onSnapshot(query(collection(db, "payments"), orderBy("date", "desc")), s => 
      setPayments(s.docs.map(d => ({id: d.id, ...d.data()})))
    );
    // 4. Ambil Absensi
    const unsub4 = onSnapshot(query(collection(db, "class_logs"), orderBy("date", "desc")), s => 
      setClassLogs(s.docs.map(d => ({id: d.id, ...d.data()})))
    );

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, [db]);

  // --- NAVIGASI ---
  const handleBack = () => { setView('list'); setSelectedStudent(null); };
  
  const handleCreate = () => { 
    setSelectedStudent(null); 
    setView('form'); 
  };

  const handleDetail = (student) => {
    setSelectedStudent(student);
    setView('detail');
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setView('form');
  };

  return (
    <div className="w-full">
      {/* 1. TAMPILAN LIST (TABEL & PDF BARU) */}
      {view === 'list' && (
        <StudentList 
          db={db} 
          students={students} 
          classLogs={classLogs} 
          onSelect={handleDetail} 
          onCreate={handleCreate} 
        />
      )}

      {/* 2. TAMPILAN DETAIL PROFIL */}
      {view === 'detail' && selectedStudent && (
        <StudentDetail 
          student={selectedStudent}
          studentInvoices={invoices.filter(i => i.studentId === selectedStudent.id)}
          studentPayments={payments.filter(p => p.studentName === selectedStudent.name)} 
          studentLogs={classLogs.filter(l => l.studentsLog.some(s => s.id === selectedStudent.id))}
          onBack={handleBack}
          onEdit={() => handleEdit(selectedStudent)}
        />
      )}

      {/* 3. TAMPILAN FORM (PENDAFTARAN LENGKAP + CICILAN) */}
      {view === 'form' && (
        <StudentForm 
          db={db} 
          initialData={selectedStudent} 
          onCancel={handleBack} 
          onSuccess={handleBack} 
        />
      )}
    </div>
  );
}