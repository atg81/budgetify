// src/components/Reports.jsx
import React, { useState, useEffect } from 'react';
import { getExpenseByCategory, getMonthlyExpenses } from '../lib/dataService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const Reports = ({ userId }) => {
  const [byCategory, setByCategory] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [range, setRange] = useState({ from: '', to: '' });

  useEffect(() => {
    if (!userId) return;
    load();
  }, [userId]);

  const load = async () => {
    const cat = await getExpenseByCategory(userId);
    const mon = await getMonthlyExpenses(userId);
    setByCategory(cat || []);
    setMonthly(mon || []);
  };

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2>Raporlar & Tahmin</h2>
        <div className="small-muted">Özelleştirilebilir tarih aralıkları ve grafikler</div>
      </div>

      <div className="card">
        <h4>Kategori Bazlı Harcama</h4>
        <div style={{ height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={byCategory}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#00b06a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h4>Aylık Trend</h4>
        <div style={{ height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={monthly}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="harcama" stroke="#0b6170" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
