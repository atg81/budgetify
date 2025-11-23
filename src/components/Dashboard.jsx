// src/components/Dashboard.jsx

import React from 'react';

// İkonlar için basit bir yer tutucu fonksiyon (Gerçekte React Icons kullanılmalı)
const getIcon = (category) => {
    switch(category) {
        case 'Maaş': return '💳';
        case 'Market': return '🛒';
        case 'Fatura': return '🧾';
        case 'Eğitim': return '📚';
        default: return '💰';
    }
}

const Dashboard = ({ setActiveTab }) => {
  // Görseldeki değerleri yansıtan örnek veriler
  const totalIncome = 15000;
  const totalExpense = 7500;
  const balance = totalIncome - totalExpense;
  const recentTransactions = [
    { type: 'gelir', description: 'Maaş', category: 'Maaş', amount: 12000, date: '10 Mayıs 2024' },
    { type: 'gider', description: 'Market Alışverişi', category: 'Market', amount: 950, date: '12 Mayıs 2024' },
    { type: 'gider', description: 'Fatura Ödemesi', category: 'Fatura', amount: 1200, date: '10 Mayıs 2024' },
    { type: 'gelir', description: 'Ek Gelir', category: 'Maaş', amount: 3000, date: '01 Mayıs 2024' },
    { type: 'gider', description: 'Ulaşım', category: 'Ulaşım', amount: 480, date: '05 Mayıs 2024' },
  ];

  return (
    <div className="dashboard-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Bütçe Özeti</h2>
          {/* Yeni İşlem Ekle butonu, Gelir/Gider Ekleme ekranına yönlendirir */}
          <button 
              className="green-button" 
              onClick={() => setActiveTab('add')}
              style={{ padding: '10px 20px' }}
          >
              + Yeni İşlem
          </button>
      </div>
      
      {/* KPI Kartları */}
      <div className="dashboard-summary-area">
        <div className="card kpi-box">
          <h4>Toplam Gelir</h4>
          <p className="amount text-green">₺{totalIncome.toLocaleString()}</p>
        </div>
        <div className="card kpi-box">
          <h4>Toplam Gider</h4>
          <p className="amount text-red">₺{totalExpense.toLocaleString()}</p>
        </div>
        <div className="card kpi-box">
          <h4>Kalan Bütçe</h4>
          <p className="amount">₺{balance.toLocaleString()}</p>
        </div>
      </div>

      {/* Son İşlemler Listesi */}
      <div className="recent-transactions card">
        <h3>Son İşlemler</h3>
        <ul className="transaction-list" style={{ listStyle: 'none', padding: 0 }}>
          {recentTransactions.map((tx, index) => (
            <li key={index} className="transaction-item" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: index < recentTransactions.length - 1 ? '1px solid #eee' : 'none'
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {/* İkon yer tutucu */}
                    <span style={{ fontSize: '20px', marginRight: '15px' }}>{getIcon(tx.category)}</span>
                    <div>
                        <span style={{ fontWeight: 'bold' }}>{tx.description}</span>
                        <div style={{ fontSize: '12px', color: '#999' }}>{tx.date}</div>
                    </div>
                </div>
                {/* Miktar */}
                <span className={tx.type === 'gelir' ? 'text-green' : 'text-red'} style={{ fontWeight: 'bold' }}>
                    {tx.type === 'gelir' ? '+' : '-'} ₺{tx.amount.toLocaleString()}
                </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;