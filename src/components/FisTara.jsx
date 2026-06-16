// src/components/FisTara.jsx
// Gemini Vision API ile OCR fiş okuma bileşeni

import React, { useState, useRef, useCallback } from 'react';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = 'llama-3.2-11b-vision-preview';

// Dosyayı base64'e çevir
const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const FisTara = ({ onResult, onClose }) => {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const inputRef = useRef();

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith('image/')) {
      setError('Lütfen bir görsel dosyası seçin (JPG, PNG, WEBP).');
      return;
    }
    setError('');
    setResult(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const base64 = await fileToBase64(file);
      const today = new Date().toISOString().slice(0, 10);

      const prompt = `Sen bir makbuz/fiş analisti yapay zekasısın. Bu fiş görselini analiz et ve SADECE aşağıdaki JSON formatında cevap ver. Başka hiçbir şey yazma, markdown kullanma.

{
  "totalAmount": (fişin toplam tutarı, sadece rakam ve nokta, örn: 154.50),
  "date": ("${today}" formatında tarih, fişte tarih yoksa bugünü kullan),
  "category": (Sadece şu 5 seçenekten biri: "Yiyecek & Market", "Kira & Konut", "Eğlence", "Ulaşım", "Diğer"),
  "description": (satıcı/market/marka adı, kısa)
}

Fişte Türkçe karakterler olabilir. Toplam tutarı bul (TOPLAM, GENEL TOPLAM, TOTAL gibi satırlar).`;

      const payload = {
        model: MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${file.type};base64,${base64}` } }
            ]
          }
        ],
        temperature: 0.1
      };

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `API hatası: ${res.status}`);
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';

      // JSON'ı metinden çıkar
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Yapay zeka JSON döndürmedi: ' + text);

      const parsed = JSON.parse(match[0]);
      setResult(parsed);
    } catch (e) {
      console.error('Fiş analiz hatası:', e);
      setError('Fiş okunamadı: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUse = () => {
    if (result && onResult) {
      onResult({
        amount: result.totalAmount?.toString() || '',
        date: result.date || new Date().toISOString().slice(0, 10),
        description: result.description || '',
        categoryHint: result.category || '',
      });
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #0d1b2e, #112240)',
          border: '1px solid rgba(0,230,118,0.25)',
          borderRadius: '20px',
          padding: '28px',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,230,118,0.08)',
        }}
      >
        {/* Başlık */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#e6eef8', fontSize: '1.2rem' }}>
              📷 Fiş Tara
            </h3>
            <p style={{ margin: '4px 0 0', color: '#6b8cae', fontSize: '13px' }}>
              Fişin fotoğrafını yükle, AI otomatik okusun
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#aaa',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Yükleme Alanı */}
        {!preview && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#00e676' : 'rgba(0,230,118,0.3)'}`,
              borderRadius: '14px',
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'rgba(0,230,118,0.05)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.2s ease',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🧾</div>
            <p style={{ color: '#e6eef8', margin: '0 0 6px', fontWeight: 500 }}>
              Fiş fotoğrafını sürükle & bırak
            </p>
            <p style={{ color: '#6b8cae', margin: 0, fontSize: '13px' }}>
              veya tıklayarak seç (JPG, PNG, WEBP)
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>
        )}

        {/* Önizleme */}
        {preview && (
          <div style={{ marginBottom: '16px', textAlign: 'center' }}>
            <img
              src={preview}
              alt="Fiş önizleme"
              style={{
                maxWidth: '100%',
                maxHeight: '260px',
                borderRadius: '12px',
                border: '1px solid rgba(0,230,118,0.2)',
                objectFit: 'contain',
              }}
            />
            <button
              onClick={reset}
              style={{
                display: 'block',
                margin: '10px auto 0',
                background: 'transparent',
                border: 'none',
                color: '#6b8cae',
                cursor: 'pointer',
                fontSize: '13px',
                textDecoration: 'underline',
              }}
            >
              Farklı fotoğraf seç
            </button>
          </div>
        )}

        {/* Analiz Butonu */}
        {file && !result && (
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              background: loading
                ? 'rgba(0,230,118,0.3)'
                : 'linear-gradient(135deg, #00e676, #00b06a)',
              color: '#05101a',
              fontWeight: 700,
              fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                AI Fiş Okuyor...
              </>
            ) : (
              <>🔍 Fişi Analiz Et</>
            )}
          </button>
        )}

        {/* Hata */}
        {error && (
          <div
            style={{
              background: 'rgba(255,100,100,0.1)',
              border: '1px solid rgba(255,100,100,0.3)',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#ff7a7a',
              fontSize: '13px',
              marginBottom: '12px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Sonuç Kartı */}
        {result && (
          <div
            style={{
              background: 'rgba(0,230,118,0.06)',
              border: '1px solid rgba(0,230,118,0.3)',
              borderRadius: '14px',
              padding: '18px',
              marginBottom: '14px',
            }}
          >
            <div style={{ color: '#00e676', fontWeight: 700, marginBottom: '12px', fontSize: '14px' }}>
              ✅ Fiş Başarıyla Okundu
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: '💰 Tutar', value: `₺${parseFloat(result.totalAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` },
                { label: '📅 Tarih', value: result.date || '-' },
                { label: '🏷️ Kategori', value: result.category || '-' },
                { label: '🏪 Yer', value: result.description || '-' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ color: '#6b8cae', fontSize: '11px', marginBottom: '3px' }}>{label}</div>
                  <div style={{ color: '#e6eef8', fontWeight: 600, fontSize: '14px' }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button
                onClick={handleUse}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #00e676, #00b06a)',
                  color: '#05101a',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ✓ Forma Aktar
              </button>
              <button
                onClick={reset}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: '#aaa',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                🔄 Tekrar Tara
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  );
};

export default FisTara;
