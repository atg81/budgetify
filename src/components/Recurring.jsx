// src/components/Recurring.jsx
import React, { useState, useEffect } from 'react';
import { getCategories } from '../lib/dataService';
import { getRecurring, saveRecurring } from '../lib/localService';

const Recurring = ({ userId }) => {
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ description: '', amount: '', type: 'expense', category_id: '', frequency: 'monthly', nextDate: '' });

  useEffect(() => {
    if (!userId) return;
    load();
  }, [userId]);

  const load = async () => {
    const cats = await getCategories(userId);
    setCategories(cats || []);
    const saved = getRecurring(userId);
    setRules(saved || []);
  };

  const save = (next) => {
    setRules(next);
    saveRecurring(userId, next);
  };

  const handleAdd = () => {
    const r = { id: Date.now().toString() + Math.floor(Math.random()*1000), ...form, amount: Number(form.amount), active: true };
    const next = [...rules, r];
    save(next);
    setForm({ description: '', amount: '', type: 'expense', category_id: '', frequency: 'monthly', nextDate: '' });
  };

  const remove = (id) => {
    const next = rules.filter(r => r.id !== id);
    save(next);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Tekrarlayan İşlemler & Hatırlatmalar</h2>
        <div className="small-muted">Periyodik işlemler oluşturun (otomatik ekleme)</div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input placeholder="Açıklama" value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{padding:8,borderRadius:8}} />
          <input placeholder="Tutar" type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} style={{padding:8,borderRadius:8}} />
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={{padding:8,borderRadius:8}}>
            <option value="expense">Gider</option>
            <option value="income">Gelir</option>
          </select>
          <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} style={{padding:8,borderRadius:8}}>
            <option value="">Kategori seç</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.frequency} onChange={e => setForm({...form, frequency: e.target.value})} style={{padding:8,borderRadius:8}}>
            <option value="monthly">Aylık</option>
            <option value="weekly">Haftalık</option>
            <option value="daily">Günlük</option>
          </select>
          <input type="date" value={form.nextDate} onChange={e => setForm({...form, nextDate: e.target.value})} style={{padding:8,borderRadius:8}} />
          <button className="green-button" onClick={handleAdd}>Ekle</button>
        </div>

        <hr />
        <h4>Mevcut kurallar</h4>
        {rules.length === 0 && <div className="small-muted">Henüz kurallar yok.</div>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {rules.map(r => (
            <li key={r.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0' }}>
              <div>
                <div style={{fontWeight:700}}>{r.description || (r.type==='income'?'Gelir':'Gider')} - ₺{Number(r.amount).toLocaleString('tr-TR')}</div>
                <div className="small-muted">{r.frequency} — sonraki: {r.nextDate}</div>
              </div>
              <div>
                <button className="gray-button" onClick={() => remove(r.id)}>Sil</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Recurring;
