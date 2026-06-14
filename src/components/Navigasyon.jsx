// src/components/Navigasyon.jsx

import React from 'react';
import { FiHome, FiPlusCircle, FiPieChart, FiList } from 'react-icons/fi';

const Navigasyon = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: <FiHome /> },
    { id: 'add', name: 'Gelir/Gider Ekle', icon: <FiPlusCircle /> },
    { id: 'charts', name: 'Grafikler', icon: <FiPieChart /> },
    { id: 'categories', name: 'Kategori Yönetimi', icon: <FiList /> },
    { id: 'reports', name: 'Raporlar', icon: <FiPieChart /> },
  ];

  return (
    <div className="sidebar">
      <div className="brand-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0 20px', borderBottom: '1px solid var(--divider-color, #2A2A2A)', marginBottom: '15px' }}>
        <img src="/budgetify_logo.png" alt="Budgetify Logo" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'contain' }} />
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary, #E8E8E8)' }}>Budgetify</h2>
      </div>
      <nav>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            aria-label={tab.name}
          >
            <span style={{display:'inline-flex',alignItems:'center',fontSize:18}}>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Navigasyon;