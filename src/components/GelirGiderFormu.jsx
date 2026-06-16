// src/components/GelirGiderFormu.jsx

import React, { useState, useEffect } from 'react';
import { getCategories, addTransaction } from '../lib/dataService';

const GelirGiderFormu = ({ userId, onSuccess }) => {
  const [transaction, setTransaction] = useState({
    type: 'expense',
    category_id: '',
    amount: '',
    date: new Date().toISOString().substring(0, 10),
    description: '',
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [userId]);

  const loadCategories = async () => {
    try {
      const cats = await getCategories(userId);
      setCategories(cats);
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setTransaction({ ...transaction, [e.target.name]: e.target.value });
    setError('');
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!transaction.amount || parseFloat(transaction.amount) <= 0) {
      setError('Lütfen geçerli bir miktar girin');
      return;
    }
    if (!transaction.date) {
      setError('Lütfen bir tarih seçin');
      return;
    }

    setSubmitting(true);
    try {
      await addTransaction(userId, {
        ...transaction,
        amount: parseFloat(transaction.amount),
        category_id: transaction.category_id || null,
      });

      // Success - reset form and navigate back
      setTransaction({
        type: 'expense',
        category_id: '',
        amount: '',
        date: new Date().toISOString().substring(0, 10),
        description: '',
      });

      if (onSuccess) {
        onSuccess();
      } else {
        alert('İşlem başarıyla eklendi!');
      }
    } catch (err) {
      console.error('Error adding transaction:', err);
      setError('İşlem eklenirken hata oluştu: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="form-container" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center', padding: '40px' }}>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="form-container" style={{ maxWidth: '500px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Yeni İşlem Ekle</h2>
      </div>


      <form onSubmit={handleSubmit}>

        {/* İşlem Tipi */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--muted)' }}>İşlem Tipi</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className={transaction.type === 'income' ? 'green-button' : 'secondary-button'}
              onClick={() => setTransaction({ ...transaction, type: 'income' })}
              style={{ flex: 1 }}
            >
              💰 Gelir
            </button>
            <button
              type="button"
              className={transaction.type === 'expense' ? 'green-button' : 'secondary-button'}
              onClick={() => setTransaction({ ...transaction, type: 'expense' })}
              style={{ flex: 1, background: transaction.type === 'expense' ? '#ff7a7a' : undefined }}
            >
              💸 Gider
            </button>
          </div>
        </div>

        {/* Kategori Seçimi */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--muted)' }}>Kategori</label>
          <select
            name="category_id"
            value={transaction.category_id}
            onChange={(e) => {
              const selectedId = e.target.value;
              const selectedCat = categories.find(c => c.id === selectedId);
              setTransaction({
                ...transaction,
                category_id: selectedId,
                // Clear custom description if not "Diğer"
                description: selectedCat?.name?.toLowerCase().includes('diğer') ? transaction.description : ''
              });
              setError('');
            }}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              background: '#0f1724',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#e6eef8',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            <option value="" style={{ background: '#0f1724', color: '#e6eef8' }}>Kategori Seçin (Opsiyonel)</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} style={{ background: '#0f1724', color: '#e6eef8' }}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Diğer kategorisi seçildiğinde özel isim girişi */}
        {categories.find(c => c.id === transaction.category_id)?.name?.toLowerCase().includes('diğer') && (
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--muted)' }}>
              İşlem Adı <span style={{ color: '#00e676' }}>*</span>
            </label>
            <input
              type="text"
              name="description"
              placeholder="örn: Hediye, Tamir, Kırtasiye..."
              value={transaction.description}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                background: '#0f1724',
                border: '1px solid rgba(0,230,118,0.3)',
                color: '#e6eef8',
                fontSize: '15px'
              }}
            />
            <p className="small-muted" style={{ marginTop: '6px', fontSize: '12px' }}>
              💡 "Diğer" seçildi - lütfen işleme bir isim verin
            </p>
          </div>
        )}

        {/* Miktar */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--muted)' }}>Miktar (₺)</label>
          <input
            type="number"
            name="amount"
            placeholder="0.00"
            value={transaction.amount}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'inherit', fontSize: '18px' }}
          />
        </div>

        {/* Açıklama */}
        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--muted)' }}>Açıklama (Opsiyonel)</label>
          <input
            type="text"
            name="description"
            placeholder="örn: Market alışverişi"
            value={transaction.description}
            onChange={handleChange}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'inherit' }}
          />
        </div>

        {/* Tarih */}
        <div className="form-group" style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: 'var(--muted)' }}>Tarih</label>
          <input
            type="date"
            name="date"
            value={transaction.date}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'inherit' }}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="field-error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="green-button"
          style={{ width: '100%', padding: '14px', fontSize: '16px' }}
          disabled={submitting}
        >
          {submitting ? 'Ekleniyor...' : '✓ İşlemi Ekle'}
        </button>
      </form>
    </div>
  );
};

export default GelirGiderFormu;