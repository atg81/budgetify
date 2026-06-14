// src/components/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import { getDashboardStats, getRecentTransactions, deleteTransaction } from '../lib/dataService';

// İkonlar için basit bir yer tutucu fonksiyon
const getIcon = (category, emoji) => {
  if (emoji) return emoji;
  switch (category) {
    case 'Maaş': return '💳';
    case 'Market': return '🛒';
    case 'Fatura': return '🧾';
    case 'Eğitim': return '📚';
    default: return '💰';
  }
};

// Format date to Turkish locale
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const Dashboard = ({ userId, setActiveTab }) => {
  const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data on mount and when userId changes
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, transactionsData] = await Promise.all([
        getDashboardStats(userId),
        getRecentTransactions(userId)
      ]);
      setStats(statsData);
      setTransactions(transactionsData);
      // compute budgets alerts using available transactions
      // budgets feature removed — no alerts to compute
      setBudgetAlerts([]);
    } catch (err) {
      console.error('Dashboard data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm('Bu işlemi silmek istediğinize emin misiniz?')) return;

    try {
      await deleteTransaction(transactionId, userId);
      await loadData(); // Refresh data
    } catch (err) {
      console.error('Delete error:', err);
      alert('Silme işlemi başarısız: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-content" style={{ textAlign: 'center', padding: '40px' }}>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Genel Bakış</h2>
        <button
          className="green-button"
          onClick={() => setActiveTab('add')}
          style={{ padding: '10px 20px' }}
        >
          + Yeni İşlem
        </button>
      </div>

      {/* Top Grid: KPI kartları ve Son İşlemler yan yana */}
      <div className="dashboard-top-grid">
        <div className="dashboard-summary-area">
          <div className="card kpi-box">
            <h4>Toplam Gelir</h4>
            <p className="amount text-green">₺{stats.totalIncome.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="card kpi-box">
            <h4>Toplam Gider</h4>
            <p className="amount text-red">₺{stats.totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="card kpi-box">
            <h4>Kalan Bütçe</h4>
            <p className={`amount ${stats.balance >= 0 ? 'text-green' : 'text-red'}`}>
              ₺{stats.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Son İşlemler Listesi */}
        <div className="recent-transactions card">
          <h3>Son İşlemler</h3>
          {transactions.length === 0 ? (
            <p className="small-muted" style={{ padding: '20px 0' }}>
              Henüz işlem yok. "Yeni İşlem" butonuna tıklayarak başlayın.
            </p>
          ) : (
            <ul className="transaction-list" style={{ listStyle: 'none', padding: 0 }}>
              {transactions.map((tx) => (
                <li key={tx.id} className="transaction-item" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <span style={{ fontSize: '20px', marginRight: '15px' }}>
                      {getIcon(tx.category_name, tx.category_emoji)}
                    </span>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>{tx.description || tx.category_name || 'İşlem'}</span>
                      <div style={{ fontSize: '12px', color: '#999' }}>{formatDate(tx.date)}</div>
                    </div>
                  </div>
                  <span className={tx.type === 'income' ? 'text-green' : 'text-red'} style={{ fontWeight: 'bold', marginRight: '10px' }}>
                    {tx.type === 'income' ? '+' : '-'} ₺{parseFloat(tx.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </span>
                  <button
                    onClick={() => handleDeleteTransaction(tx.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ff7a7a',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px 8px'
                    }}
                    title="Sil"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;