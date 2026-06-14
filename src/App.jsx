// src/App.jsx

import React, { useState, useEffect } from 'react';
import Navigasyon from './components/Navigasyon';
import Dashboard from './components/Dashboard';
import GelirGiderFormu from './components/GelirGiderFormu';
import Grafikler from './components/Grafikler';
import KategoriYonetimi from './components/KategoriYonetimi';
import Recurring from './components/Recurring';
import Reports from './components/Reports';
import GirisEkrani from './components/GirisEkrani';
import AiChat from './components/AiChat';
import { getCurrentUser, logout } from './lib/auth';
import { getRecurring, saveRecurring } from './lib/localService';
import { addTransaction } from './lib/dataService';

import './assets/App.css';
import './components/AiChat.css';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // For refreshing data after add
  const [showAiChat, setShowAiChat] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsLoggedIn(true);
      // process recurring rules for current user
      (async () => {
        try {
          const uid = currentUser.id;
          const rules = getRecurring(uid) || [];
          const today = new Date();
          const updated = [...rules];

          for (let i = 0; i < rules.length; i++) {
            const r = { ...rules[i] };
            if (!r.active || !r.nextDate) continue;

            let next = new Date(r.nextDate);
            while (next <= today) {
              await addTransaction(uid, {
                category_id: r.category_id || null,
                amount: r.amount,
                currency: 'TRY',
                type: r.type || 'expense',
                date: next.toISOString().slice(0,10),
                description: r.description || ''
              });

              if (r.frequency === 'monthly') {
                next.setMonth(next.getMonth() + 1);
              } else if (r.frequency === 'weekly') {
                next.setDate(next.getDate() + 7);
              } else {
                next.setDate(next.getDate() + 1);
              }
            }

            r.nextDate = next.toISOString().slice(0,10);
            updated[i] = r;
          }

          saveRecurring(currentUser.id, updated);
          setRefreshKey(k => k + 1);
        } catch (e) {
          console.error('Recurring processing failed', e);
        }
      })();
    }
  }, []);

  // Handle successful login
  const handleLoginSuccess = () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsLoggedIn(true);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setUser(null);
    setIsLoggedIn(false);
  };

  // Trigger data refresh (called after adding transaction)
  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Navigate to a tab and optionally refresh
  const navigateTo = (tab) => {
    setActiveTab(tab);
    if (tab === 'dashboard') {
      refreshData();
    }
  };

  const renderContent = () => {
    const userId = user?.id;

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard key={refreshKey} userId={userId} setActiveTab={setActiveTab} />;
      case 'add':
        return <GelirGiderFormu userId={userId} onSuccess={() => navigateTo('dashboard')} />;
      case 'charts':
        return <Grafikler key={refreshKey} userId={userId} />;
      case 'categories':
        return <KategoriYonetimi userId={userId} />;
      case 'recurring':
        return <Recurring userId={userId} />;
      case 'reports':
        return <Reports userId={userId} />;
      default:
        return <Dashboard key={refreshKey} userId={userId} setActiveTab={setActiveTab} />;
    }
  };

  // Get user display name
  const userName = user?.full_name || user?.email?.split('@')[0] || 'Kullanıcı';
  const userInitials = userName.substring(0, 2).toUpperCase();

  let content;
  if (!isLoggedIn) {
    content = (
      <div className="auth-page-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg,#071023,#05101a)' }}>
        <GirisEkrani setIsLoggedIn={handleLoginSuccess} />
      </div>
    );
  } else {
    content = (
      <div className="app-main-layout">
        <a href="#main" className="skip-link">İçeriğe atla</a>
        <Navigasyon activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="main-area">
          <header className="topbar">
            <h1>Budgetify</h1>
            <div className="user-info">
              <div className="small-muted">Hoşgeldin, {userName}</div>
              <div className="avatar">{userInitials}</div>
              <button className="logout-button" onClick={handleLogout} aria-label="Çıkış Yap">Çıkış</button>
            </div>
          </header>

          <main id="main" className="content-area container">
            {renderContent()}
          </main>
          {/* Wallet button to open AI chat (sağ altta) */}
          <button className="wallet-button" onClick={() => setShowAiChat(true)} aria-label="Yardım">
            <span className="wallet-icon" style={{fontSize:18}}>💬</span>
          </button>
          {showAiChat && <AiChat onClose={() => setShowAiChat(false)} />}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {content}
    </ErrorBoundary>
  );
}

export default App;