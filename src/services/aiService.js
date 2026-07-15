// src/services/aiService.js
import { db } from '../firebase';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

// ============================================================
// AI SERVICE - SMART QUESTION GENERATOR
// ============================================================

/**
 * Ekstrak soal dari teks menggunakan AI (Gemini API)
 * @param {string} text - Teks yang akan diekstrak
 * @param {number} maxQuestions - Jumlah maksimal soal
 * @returns {Promise<Array>} - Array of question objects
 */
export const extractQuestionsFromText = async (text, maxQuestions = 10) => {
  try {
    // 🔥 SIMULASI AI EXTRACTION - Dalam produksi, panggil Gemini API
    // Untuk demo, kita parsing teks manual
    
    const questions = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    let currentQuestion = null;
    let currentOptions = [];
    let isCollectingOptions = false;
    let questionNumber = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Deteksi nomor soal (1., 1), 1) 1. dll)
      const questionMatch = trimmed.match(/^(\d+)\.?\s*\)?\s*(.+)/);
      
      if (questionMatch && questionNumber < maxQuestions) {
        // Simpan soal sebelumnya
        if (currentQuestion && currentOptions.length > 0) {
          questions.push({
            id: Date.now() + questionNumber,
            q: currentQuestion,
            qImage: '',
            options: currentOptions,
            optionImages: ['', '', '', ''],
            correct: 0,
            explanation: ''
          });
        }
        
        currentQuestion = questionMatch[2].trim();
        currentOptions = [];
        isCollectingOptions = true;
        questionNumber++;
      } else if (isCollectingOptions && currentOptions.length < 4) {
        // Deteksi opsi (A., A) A. dll)
        const optionMatch = trimmed.match(/^([A-D])\.?\s*\)?\s*(.+)/i);
        if (optionMatch) {
          currentOptions.push(optionMatch[2].trim());
        } else if (currentOptions.length > 0 && currentOptions.length < 4) {
          // Jika bukan opsi tapi masih dalam soal, bisa jadi lanjutan
          // atau opsi tanpa format (bisa diabaikan atau ditambah)
        }
      }
    }
    
    // Simpan soal terakhir
    if (currentQuestion && currentOptions.length > 0) {
      questions.push({
        id: Date.now() + questionNumber,
        q: currentQuestion,
        qImage: '',
        options: currentOptions,
        optionImages: ['', '', '', ''],
        correct: 0,
        explanation: ''
      });
    }
    
    // Jika tidak ada soal yang terdeteksi, buat contoh
    if (questions.length === 0) {
      // Generate contoh soal dari teks
      const firstLine = lines.slice(0, 3).join(' ');
      if (firstLine.length > 10) {
        questions.push({
          id: Date.now() + 1,
          q: firstLine.substring(0, 150),
          qImage: '',
          options: ['A. Opsi 1', 'B. Opsi 2', 'C. Opsi 3', 'D. Opsi 4'],
          optionImages: ['', '', '', ''],
          correct: 0,
          explanation: 'Jawaban: A. Opsi 1 (perlu diedit)'
        });
      }
    }
    
    return questions;
    
  } catch (error) {
    console.error("AI Extraction Error:", error);
    return [];
  }
};

/**
 * Generate soal dari PDF menggunakan AI
 * @param {File} file - File PDF yang diupload
 * @param {number} maxQuestions - Jumlah maksimal soal
 * @returns {Promise<Array>} - Array of question objects
 */
export const extractQuestionsFromPDF = async (file, maxQuestions = 10) => {
  try {
    // 🔥 Simulasi: baca file PDF dan ekstrak teks
    // Dalam produksi, gunakan pdf.js atau call Gemini API
    
    const text = await readPDFText(file);
    return await extractQuestionsFromText(text, maxQuestions);
    
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    return [];
  }
};

/**
 * Read PDF text (simulasi - gunakan pdf.js di produksi)
 */
const readPDFText = async (file) => {
  // 🔥 SIMULASI - Dalam produksi, gunakan pdf.js
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Simulasi ekstraksi teks dari PDF
      const mockText = `
        1. Bentuk sederhana dari (√5+√3)(√5-√3)/(2-√3) adalah...
        A. 4-2√3
        B. 4+2√3
        C. 2-√3
        D. 2+√3
        
        2. Jika ²log(3)=a dan ³log(5)=b, maka nilai dari ¹⁵log(20) adalah...
        A. (2+a)/(a(1+b))
        B. a(1+b)/(2+a)
        C. (2b+1)/(a(1+b))
        D. (a+b)/(2a)
        
        3. Nilai maksimum dari fungsi y=2 sin(x-30°) adalah...
        A. 1
        B. 2
        C. 3
        D. 4
      `;
      resolve(mockText);
    };
    reader.readAsText(file);
  });
};

/**
 * Simpan soal hasil generate ke Firebase
 */
export const saveGeneratedQuestions = async (modulId, questions, title = 'Kuis AI') => {
  try {
    const quizPayload = {
      quizData: questions.map(q => ({
        id: q.id,
        question: q.q || q.question || '',
        questionImage: q.qImage || '',
        options: q.options || ['', '', '', ''],
        optionImages: q.optionImages || ['', '', '', ''],
        correctAnswer: q.correct || 0,
        explanation: q.explanation || ''
      })),
      totalQuestions: questions.length,
      title: title,
      updatedAt: serverTimestamp(),
      generatedByAI: true,
      generatedAt: serverTimestamp()
    };
    
    if (modulId) {
      await updateDoc(doc(db, "bimbel_modul", modulId), quizPayload);
      return { success: true, modulId };
    } else {
      const docRef = await addDoc(collection(db, "bimbel_modul"), {
        ...quizPayload,
        title: title,
        type: 'kuis_mandiri',
        status: 'aktif',
        createdAt: serverTimestamp()
      });
      return { success: true, modulId: docRef.id };
    }
  } catch (error) {
    console.error("Save error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Parse teks soal dari input manual
 */
export const parseManualText = (text, maxQuestions = 10) => {
  return extractQuestionsFromText(text, maxQuestions);
};