// src/components/QuickEntry.jsx
import React, { useState } from 'react';
import { addTransaction } from '../lib/dataService';

// Very small natural language parse (Turkish/very simple): "Kahve 15 TL bugün"
function parseQuick(text) {
  const parts = text.split(' ');
  let amount = null;
  let date = null;
  let desc = text;

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i].replace(/[,]/g, '.');
    const m = p.match(/^(\d+(?:\.\d+)?)$/);
    if (m) {
      amount = parseFloat(m[1]);
      desc = parts.slice(0, i).concat(parts.slice(i+1)).join(' ');
      break;
    }
    if (/^\d+TL$/i.test(p)) {
      amount = parseFloat(p.replace(/[^0-9.]/g,''));
      desc = parts.filter((_,idx)=>idx!==i).join(' ');
      break;
    }
    if (p.toLowerCase() === 'bugün') {
      date = new Date().toISOString().slice(0,10);
    }
  }

  return { description: desc || '', amount: amount || 0, date: date || new Date().toISOString().slice(0,10) };
}

const QuickEntry = ({ userId, onAdded }) => {
  const [text, setText] = useState('');

  const handleAdd = async () => {
    if (!text.trim()) return;
    const parsed = parseQuick(text.trim());
    await addTransaction(userId, {
      category_id: null,
      amount: parsed.amount,
      currency: 'TRY',
      type: 'expense',
      date: parsed.date,
      description: parsed.description
    });
    setText('');
    onAdded && onAdded();
  };

  return (
    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
      <input placeholder="Hızlı ekleyin: örn. Kahve 15 TL bugün" value={text} onChange={e=>setText(e.target.value)} style={{flex:1,padding:10,borderRadius:10}} />
      <button className="green-button" onClick={handleAdd}>Ekle</button>
    </div>
  );
};

export default QuickEntry;
