// src/components/Navigasyon.jsx

import React from 'react';

const Navigasyon = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'add', name: 'Gelir/Gider Ekle' },
    { id: 'charts', name: 'Grafikler' },
    { id: 'categories', name: 'Kategori Yönetimi' },
  ];

  return (
    <div className="sidebar">
      <h2>Budgetify</h2>
      <nav>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.name}
          </button>
        ))}
      </nav>
      {/* Stil: Yeşil renkli, sol kenara sabitlenmiş bir menü olmalıdır. */}
    </div>
  );
};

export default Navigasyon;