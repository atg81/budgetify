// src/components/AiChat.jsx
import React, { useState } from 'react';
import './AiChat.css';

const CATEGORIES = [
  {
    id: 'uygulama',
    title: 'Uygulama',
    questions: [
      { id: 'u1', q: 'Uygulama nasıl çalışıyor?', a: 'Budgetify gelir ve giderlerinizi kategorize ederek takip etmenizi sağlar. Yeni işlem ekleyebilir ve raporları görüntüleyebilirsiniz.' },
      { id: 'u2', q: 'Verilerim nerede saklanıyor?', a: 'Verileriniz yerel veritabanı veya yapılandırılmış uzak servislerde saklanır; projeye bağlı olarak Neon/Supabase kullanılabilir.' },
      { id: 'u3', q: 'Yeni kategori nasıl eklerim?', a: 'Kategori Yönetimi bölümünden yeni kategori ekleyebilir veya düzenleyebilirsiniz.' },
      { id: 'u4', q: 'Mobil uyumlu mu?', a: 'Evet, responsive tasarım sayesinde mobil cihazlarda da düzgün görüntülenir.' },
    ],
  },
  {
    id: 'hesap',
    title: 'Hesap & Güvenlik',
    questions: [
      { id: 'h1', q: 'Şifremi nasıl değiştirebilirim?', a: 'Hesap ayarları kısmında şifre değiştirme seçeneği bulunur; mevcut uygulamada web UI üzerinden çıkarılabilir.' },
      { id: 'h2', q: 'Hesabımı nasıl silerim?', a: 'Hesap silme isteği için hesap ayarlarından veya destek ile iletişime geçmeniz gerekir.' },
      { id: 'h3', q: 'Verilerim güvenli mi?', a: 'Verileriniz şifreleme ve sunucu güvenlik politikaları ile korunur; ancak kurulum ve konfigürasyona bağlıdır.' },
    ],
  },
  {
    id: 'destek',
    title: 'Destek',
    questions: [
      { id: 'd1', q: 'Hata raporlamak istiyorum', a: 'Lütfen projenin README dosyasında belirtilen iletişim veya issue adımlarını izleyin; hata detaylarını ve adımları paylaşın.' },
      { id: 'd2', q: 'Geri bildirim nasıl iletebilirim?', a: 'README veya proje deposundaki issue/feedback kanallarını kullanabilirsiniz.' },
    ],
  },
  {
    id: 'odeme',
    title: 'Ödeme Yöntemleri',
    questions: [
      { id: 'p1', q: 'Nasıl ödeme yaparım?', a: 'Şu an için uygulama ücretsiz; ileride ücret gelebilir.' },
    ],
  },
  {
    id: 'raporlar',
    title: 'Raporlar',
    questions: [
      { id: 'r1', q: 'Aylık rapor nasıl alınır?', a: 'Grafikler bölümünden tarih filtresi ile aylık rapor oluşturabilirsiniz.' },
      { id: 'r2', q: 'Raporları dışarı aktarabilir miyim?', a: 'CSV veya PDF dışa aktarma özelliği ileride eklenebilir; şimdilik ekran görüntüsü alabilirsiniz.' },
    ],
  },
];

const AiChat = ({ onClose }) => {
  const [view, setView] = useState('categories'); // categories | questions | answer
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeQa, setActiveQa] = useState(null);
  const [loading, setLoading] = useState(false);
  const [answerText, setAnswerText] = useState('');

  const openCategory = (cat) => {
    setActiveCategory(cat);
    setView('questions');
  };

  const openQuestion = (qa) => {
    setActiveQa(qa);
    setView('answer');
    setAnswerText('');
    fetchAiAnswer(qa);
  };

  const fetchAiAnswer = async (qa) => {
    setLoading(true);
    // optimistic fallback to canned answer if anything fails
    setAnswerText('');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: qa.q, category: activeCategory?.id || null }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data && data.answer) {
          setAnswerText(data.answer);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      // ignore and fallback
    } finally {
      clearTimeout(timeout);
    }

    // fallback to static answer
    setAnswerText(qa.a || 'Üzgünüm, şu anda cevap veremiyorum.');
    setLoading(false);
  };

  const handleYes = () => {
    // sohbeti sonlandır
    onClose && onClose();
  };

  const handleNo = () => {
    // ana menüye dön
    setView('categories');
    setActiveCategory(null);
    setActiveQa(null);
  };

  return (
    <div className="ai-chat-panel" role="dialog" aria-label="AI Yardım">
      <div className="ai-chat-header">
        <strong>Yardım & AI</strong>
        <button className="close-chat" onClick={onClose} aria-label="Kapat">×</button>
      </div>

      {view === 'categories' && (
        <div className="ai-categories">
          <div className="ai-section-title">Kategoriler</div>
          {CATEGORIES.map((c) => (
            <button key={c.id} className="ai-category" onClick={() => openCategory(c)}>
              {c.title}
            </button>
          ))}
        </div>
      )}

      {view === 'questions' && activeCategory && (
        <div className="ai-questions">
          <button className="back-to-cats" onClick={() => setView('categories')}>← Kategorilere dön</button>
          <div className="ai-section-title">{activeCategory.title} - Sorular</div>
          {activeCategory.questions.map((qq) => (
            <button key={qq.id} className="ai-question" onClick={() => openQuestion(qq)}>
              {qq.q}
            </button>
          ))}
        </div>
      )}

      {view === 'answer' && activeQa && (
        <div className="ai-answer">
          <div className="ai-section-title">Soru</div>
          <div className="ai-q">{activeQa.q}</div>
          <div className="ai-section-title">Cevap</div>
          <div className="ai-a">{loading ? <em>Yazıyor...</em> : (answerText || activeQa.a)}</div>

          <div className="ai-feedback">Cevap yeterli mi?</div>
          <div className="ai-feedback-buttons">
            <button className="green-button" onClick={handleYes}>Evet</button>
            <button className="gray-button" onClick={handleNo}>Hayır</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiChat;
