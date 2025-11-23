// src/components/GelirGiderFormu.jsx

import React, { useState } from 'react';

const GelirGiderFormu = () => {
  const [transaction, setTransaction] = useState({
    type: 'gider', // Yeni görselde bu switch/dropdown yok, ama işlevsellik için tutalım
    category: '',
    amount: '',
    date: new Date().toISOString().substring(0, 10),
  });

  const categories = ['Yemek', 'Ulaşım', 'Alışveriş', 'Eğlence', 'Fatura', 'Diğer'];

  const handleChange = (e) => {
    setTransaction({ ...transaction, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('İşlem Eklendi:', transaction);
    alert('İşlem Eklendi!');
  };

  return (
    <div className="form-container" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h2>Add Transaction</h2>
      <form onSubmit={handleSubmit}>
        
        {/* Kategori Seçimi */}
        <div className="form-group">
          <select name="category" value={transaction.category} onChange={handleChange} required>
            <option value="">Select Category</option>
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {/* Miktar */}
        <div className="form-group">
          <input 
            type="number" 
            name="amount" 
            placeholder="Amount"
            value={transaction.amount} 
            onChange={handleChange} 
            required 
          />
        </div>
        
        {/* Takvim Yerine Basit Tarih Inputu */}
        <div className="form-group" style={{ marginBottom: '30px' }}>
            <input 
                type="date" 
                name="date" 
                value={transaction.date} 
                onChange={handleChange} 
                required 
            />
             {/* ⚠️ Gelişmiş takvim görselini yakalamak için burada harici bir React Takvim Kütüphanesi (ör: react-calendar) gerekir. */}
        </div>

        <button type="submit" className="add-transaction-button green-button" style={{ width: '100%' }}>
          Add Transaction
        </button>
      </form>
    </div>
  );
};

export default GelirGiderFormu;