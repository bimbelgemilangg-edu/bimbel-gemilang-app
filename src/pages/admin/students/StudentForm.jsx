// 🔥 PASTI KAN BAGIAN INI MENGGUNAKAN format Teks TANGGAL
if (fin.paidNow > 0) {
    const payRef = doc(collection(db, "payments"));
    t.set(payRef, { 
      studentName: formData.name, 
      amount: fin.paidNow, 
      method: 'Cash', // Standardkan
      type: 'income', 
      category: 'Pendaftaran', 
      description: `Pembayaran Awal (${formData.nickname || formData.name})`, 
      date: new Date().toISOString().split('T')[0], // Gunakan teks YYYY-MM-DD
      createdAt: serverTimestamp() 
    });
  }