import React from 'react';
import { Trash2, Plus, CheckCircle } from 'lucide-react';

const ManageQuiz = ({ questions, setQuestions }) => {
  const addQuestion = () => {
    setQuestions([...questions, { 
      id: Date.now(), 
      q: '', 
      options: ['', '', '', ''], 
      correct: 0 
    }]);
  };

  const updateQ = (id, val) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, q: val } : q));
  };

  const updateOpt = (qId, optIdx, val) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOpts = [...q.options];
        newOpts[optIdx] = val;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  return (
    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
      {questions.map((item, idx) => (
        <div key={item.id} style={{ background: 'white', padding: '15px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Pertanyaan {idx + 1}</strong>
            <button onClick={() => setQuestions(questions.filter(q => q.id !== item.id))} style={{ color: 'red', border: 'none', background: 'none' }}><Trash2 size={16}/></button>
          </div>
          <input 
            style={{ width: '100%', padding: '8px', margin: '10px 0', borderRadius: '4px', border: '1px solid #ccc' }}
            placeholder="Tulis Pertanyaan..."
            value={item.q}
            onChange={(e) => updateQ(item.id, e.target.value)}
          />
          {item.options.map((opt, optIdx) => (
            <div key={optIdx} style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
              <input 
                type="radio" 
                checked={item.correct === optIdx} 
                onChange={() => setQuestions(questions.map(q => q.id === item.id ? { ...q, correct: optIdx } : q))}
              />
              <input 
                style={{ flex: 1, padding: '5px', fontSize: '12px' }}
                placeholder={`Pilihan ${optIdx + 1}`}
                value={opt}
                onChange={(e) => updateOpt(item.id, optIdx, e.target.value)}
              />
            </div>
          ))}
        </div>
      ))}
      <button onClick={addQuestion} style={{ width: '100%', padding: '10px', border: '1px dashed #673ab7', color: '#673ab7', background: 'none', cursor: 'pointer' }}>
        <Plus size={14}/> Tambah Pertanyaan Kuis
      </button>
    </div>
  );
};

export default ManageQuiz;