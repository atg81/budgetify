// src/components/Onboarding.jsx
import React from 'react';

const Onboarding = ({ onClose }) => {
  return (
    <div className="card">
      <h2>Hoşgeldiniz — Budgetify'e başlarken</h2>
      <ol>
        <li>Kategori ekleyin veya varsayılanları kullanın.</li>
        <li>Hızlı ekleme ile işlemlerinizi hızlıca girin.</li>
        <li>Bütçe belirleyin ve uyarılar alın.</li>
      </ol>
      <p className="small-muted">Daha fazlası için menüdeki rehberi takip edin.</p>
      <div style={{ textAlign: 'right' }}>
        <button className="green-button" onClick={onClose}>Tamam</button>
      </div>
    </div>
  );
};

export default Onboarding;
