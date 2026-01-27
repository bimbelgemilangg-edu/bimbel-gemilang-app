// --- BAGIAN DALAM handleSave (GANTI DARI SINI) ---
await runTransaction(db, async (t) => {
    // A. Simpan Siswa
    const studentRef = doc(collection(db, "students"));
    t.set(studentRef, { 
      ...formData, 
      status: 'active', 
      joinedAt: new Date().toISOString().split('T')[0], 
      createdAt: serverTimestamp() 
    });
  
    // B. Simpan Pembayaran (Uang Masuk / DP) - SINKRON DENGAN FINANCE
    if (fin.paidNow > 0) {
      const payRef = doc(collection(db, "payments"));
      t.set(payRef, { 
        studentName: formData.name, 
        amount: fin.paidNow, 
        method: 'Cash', // <--- KITA STANDAR-KAN JADI 'Cash' AGAR SALDO TIDAK 0
        type: 'income', // <--- TIPE PEMASUKAN
        category: 'Pendaftaran', 
        description: `Pembayaran Awal (${formData.name})`, 
        // 🔥 SOLUSI TUNTAS: Gunakan String YYYY-MM-DD, bukan serverTimestamp()
        date: new Date().toISOString().split('T')[0], 
        createdAt: serverTimestamp() // Ini tetap untuk urutan sistem
      });
    }
  
    // C. Simpan Tagihan (Invoice / Cicilan)
    if (fin.remaining > 0 && paymentType === 'Cicilan') {
      const amountPerMonth = Math.ceil(fin.remaining / installmentMonths);
      
      for (let i = 0; i < installmentMonths; i++) {
        let currentAmount = (i === installmentMonths - 1) ? fin.remaining - (amountPerMonth * (installmentMonths - 1)) : amountPerMonth;
        
        if (currentAmount > 0) {
            const invRef = doc(collection(db, "invoices"));
            t.set(invRef, { 
              studentId: studentRef.id, 
              studentName: formData.name, 
              totalAmount: currentAmount, 
              remainingAmount: currentAmount, 
              status: 'unpaid', 
              dueDate: dueDates[i], 
              details: `Cicilan ${i+1}/${installmentMonths} Biaya Daftar`, 
              createdAt: serverTimestamp() 
            });
        }
      }
    }
  });
  // --- SAMPAI SINI ---