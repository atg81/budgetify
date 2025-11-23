// src/App.jsx

import React, { useState } from 'react';
import Navigasyon from './components/Navigasyon';
import Dashboard from './components/Dashboard';
import GelirGiderFormu from './components/GelirGiderFormu';
import Grafikler from './components/Grafikler';
import KategoriYonetimi from './components/KategoriYonetimi';
import GirisEkrani from './components/GirisEkrani'; // Eğer yaparsanız

import './assets/App.css'; // Ana layout ve stil dosyası

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Giriş yapılmış varsayalım

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'add':
        return <GelirGiderFormu />;
      case 'charts':
        return <Grafikler />;
      case 'categories':
        return <KategoriYonetimi />;
      default:
        return <Dashboard />;
    }
  };
  
  // Eğer giriş yapılmadıysa, sadece Giriş Ekranını göster
  if (!isLoggedIn) {
      return (
          <div className="auth-page-container">
              {/* GirişEkranı bileşenini oluşturmanız gerekir */}
              <GirisEkrani setIsLoggedIn={setIsLoggedIn} /> 
          </div>
      );
  }

  // Giriş yapıldıysa ana uygulamayı göster
  return (
    <div className="app-main-layout">
      <Navigasyon activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="content-area">
        {renderContent()}
      </main>
      {/* Stil: 'app-main-layout' solunda navigasyon, sağında 'content-area' olacak şekilde düzenlenmelidir (CSS Grid veya Flexbox ile). */}
    </div>
  );
}

export default App;