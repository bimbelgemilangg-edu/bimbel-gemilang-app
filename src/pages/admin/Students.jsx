import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// --- HUBUNGKAN KE MESIN BARU (FOLDER STUDENTS) ---
import StudentList from './students/StudentList';
import StudentForm from './students/StudentForm'; 
import StudentDetail from './students/StudentDetail'; 

export default function AdminStudents({ db }) {
  const [view, setView] = useState('list'); 
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // --- DATABASE MASTER ---
  const [students, setStudents] = useState([]);
  const [invoices, setInvoices] = useState([]); 
  const [payments, setPayments] = useState([]); 
  const [classLogs, setClassLogs] = useState([]); 

  useEffect(() => {
    // Load Data
    const u1 = onSnapshot(query(collection(db, "students"), orderBy("createdAt", "desc")), s => setStudents(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const u2 = onSnapshot(collection(db, "invoices"), s => setInvoices(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const u3 = onSnapshot(query(collection(db, "payments"), orderBy("date", "desc")), s => setPayments(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const u4 = onSnapshot(query(collection(db, "class_logs"), orderBy("date", "desc")), s => setClassLogs(s.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { u1(); u2(); u3(); u4(); };
  }, [db]);

  // --- NAVIGASI ---
  const handleCreate = () => { setSelectedStudent(null); setView('form'); };
  const handleEdit = (s) => { setSelectedStudent(s); setView('form'); };
  const handleDetail = (s) => { setSelectedStudent(s); setView('detail'); };
  const handleBack = () => { setView('list'); setSelectedStudent(null); };

  return (
    <div className="w-full">
      {/* TAMPILAN LIST */}
      {view === 'list' && (
        <StudentList 
          db={db} 
          students={students} 
          classLogs={classLogs} 
          onSelect={handleDetail} 
          onCreate={handleCreate} 
        />
      )}

      {/* TAMPILAN DETAIL */}
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

      {/* TAMPILAN FORM */}
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