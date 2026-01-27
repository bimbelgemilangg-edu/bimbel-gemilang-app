import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// IMPORT FILE ANAK DARI FOLDER YANG SAMA
import StudentList from './StudentList';
import StudentForm from './StudentForm';
import StudentDetail from './StudentDetail';

export default function AdminStudentsIndex({ db }) {
  const [view, setView] = useState('list'); // list | form | detail
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // STATE DATA
  const [students, setStudents] = useState([]);
  const [invoices, setInvoices] = useState([]); 
  const [payments, setPayments] = useState([]); 
  const [classLogs, setClassLogs] = useState([]); 

  useEffect(() => {
    // LOAD DATA REALTIME
    const qStudents = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const u1 = onSnapshot(qStudents, s => setStudents(s.docs.map(d => ({id: d.id, ...d.data()}))));

    const u2 = onSnapshot(collection(db, "invoices"), s => setInvoices(s.docs.map(d => ({id: d.id, ...d.data()}))));

    const qPayments = query(collection(db, "payments"), orderBy("date", "desc"));
    const u3 = onSnapshot(qPayments, s => setPayments(s.docs.map(d => ({id: d.id, ...d.data()}))));

    const qLogs = query(collection(db, "class_logs"), orderBy("date", "desc"));
    const u4 = onSnapshot(qLogs, s => setClassLogs(s.docs.map(d => ({id: d.id, ...d.data()}))));

    return () => { u1(); u2(); u3(); u4(); };
  }, [db]);

  // NAVIGASI
  const handleCreate = () => { setSelectedStudent(null); setView('form'); };
  const handleEdit = (s) => { setSelectedStudent(s); setView('form'); };
  const handleDetail = (s) => { setSelectedStudent(s); setView('detail'); };
  const handleBack = () => { setView('list'); setSelectedStudent(null); };

  return (
    <div className="w-full">
      {view === 'list' && (
        <StudentList 
          students={students} 
          classLogs={classLogs} 
          onSelect={handleDetail} 
          onCreate={handleCreate} 
        />
      )}

      {view === 'detail' && selectedStudent && (
        <StudentDetail 
          student={selectedStudent}
          studentInvoices={invoices.filter(i => i.studentId === selectedStudent.id)}
          studentPayments={payments.filter(p => p.studentName === selectedStudent.name)} 
          studentLogs={classLogs.filter(l => l.studentsLog?.some(s => s.id === selectedStudent.id))}
          onBack={handleBack}
          onEdit={() => handleEdit(selectedStudent)}
        />
      )}

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