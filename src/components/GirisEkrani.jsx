// src/components/GirisEkrani.jsx

import React, { useState } from 'react';

// setIsLoggedIn prop'unu App.jsx'ten alıyoruz
const GirisEkrani = ({ setIsLoggedIn }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        
        // Basit bir kontrol: Boş değilse giriş başarılı sayılır
        if (email && password) {
            // ⚠️ Başarılı girişten sonra durumu true yapıyoruz, bu App.jsx'te yönlendirmeyi tetikler.
            setIsLoggedIn(true); 
        } else {
            alert('Lütfen tüm alanları doldurun.');
        }
    };

    return (
        // style={{...}} satırları, App.css'e ihtiyacınız olmadan ortalamayı sağlar
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f4f7f6' }}>
            
            {/* Kart Stili: Köşeli ve gölgeli kutu */}
            <div className="login-card" style={{ 
                padding: '30px', 
                width: '350px', 
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)', // Belirgin gölge
                textAlign: 'center'
            }}>
                
                {/* Logo ve Başlık */}
                <h3 style={{ color: '#4CAF50', marginBottom: '30px' }}>Budgetify</h3>
                <h4 style={{ color: '#333', marginBottom: '30px', fontWeight: 'normal' }}>Hoş Geldiniz!</h4>
                
                <form onSubmit={handleLogin}>
                    {/* E-posta Alanı */}
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                        <input 
                            type="email" 
                            placeholder="Kullanıcı adı veya e-posta" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                            style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                    
                    {/* Şifre Alanı */}
                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <input 
                            type="password" 
                            placeholder="Şifre" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                            style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                    
                    {/* Giriş Butonu */}
                    <button type="submit" className="green-button" style={{ 
                        width: '100%', 
                        margin: '10px 0',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        padding: '12px',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        cursor: 'pointer'
                    }}>
                        Giriş Yap
                    </button>
                    
                    {/* Şifremi Unuttum */}
                    <a href="#" style={{ color: '#999', textDecoration: 'none', fontSize: '14px', display: 'block', margin: '15px 0' }}>Şifremi unuttum</a>

                    {/* Hesap Oluştur */}
                    <button type="button" style={{ 
                        width: '100%', 
                        padding: '12px', 
                        background: '#f0f0f0', 
                        border: 'none', 
                        borderRadius: '8px', 
                        color: '#555', 
                        fontSize: '16px',
                        cursor: 'pointer'
                    }}>
                        Hesap Oluştur
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GirisEkrani;