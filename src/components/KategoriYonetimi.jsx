// src/components/KategoriYonetimi.jsx

import React, { useState, useEffect } from 'react';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../lib/dataService';

const sampleEmojis = () => ["🍔", "🚗", "🎮", "💡", "🛒", "🏠", "✈️", "🎉", "💳", "📚", "🎬", "🏥", "👕", "🎁"];

const KategoriYonetimi = ({ userId }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState('');
  const [color, setColor] = useState('#6C5CE7');
  const [emoji, setEmoji] = useState(sampleEmojis()[0]);
  const [submitting, setSubmitting] = useState(false);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
  }, [userId]);

  const loadCategories = async () => {
    try {
      const cats = await getCategories(userId);
      setCategories(cats);
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) return;

    setSubmitting(true);
    try {
      const newCat = await addCategory(userId, { name, color, emoji });
      setCategories((prev) => [newCat, ...prev]);
      setNewCategory('');
    } catch (err) {
      console.error('Error adding category:', err);
      alert('Kategori eklenirken hata oluştu: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;

    if (cat.is_default) {
      alert('Varsayılan kategoriler silinemez.');
      return;
    }

    if (!window.confirm(`"${cat.name}" kategorisini silmek istediğinize emin misiniz?`)) return;

    try {
      await deleteCategory(id, userId);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Kategori silinirken hata oluştu: ' + err.message);
    }
  };

  const handleEditName = async (id) => {
    const cat = categories.find(c => c.id === id);
    const newName = window.prompt('Kategori adını düzenle:', cat.name);
    if (newName === null) return;
    const trimmed = newName.trim();
    if (!trimmed || trimmed === cat.name) return;

    try {
      const updated = await updateCategory(id, userId, {
        name: trimmed,
        color: cat.color,
        emoji: cat.emoji
      });
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, name: trimmed } : c)));
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Kategori güncellenirken hata oluştu: ' + err.message);
    }
  };

  const handleEditEmoji = async (id) => {
    const cat = categories.find(c => c.id === id);
    const emojis = sampleEmojis();
    const currentIndex = emojis.indexOf(cat.emoji);
    const nextEmoji = emojis[(currentIndex + 1) % emojis.length];

    try {
      await updateCategory(id, userId, {
        name: cat.name,
        color: cat.color,
        emoji: nextEmoji
      });
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, emoji: nextEmoji } : c)));
    } catch (err) {
      console.error('Error updating category emoji:', err);
    }
  };

  if (loading) {
    return (
      <div className="category-management-content" style={{ textAlign: 'center', padding: '40px' }}>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="category-management-content">
      <h3>Kategori Yönetimi</h3>
      <p className="muted">Renkli etiketlerle kategorilerini yönet. Emoji ve renk seç, ardından hızlıca ekle.</p>

      <form onSubmit={handleAddCategory} className="add-category-form playful">
        <div className="input-row">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Yeni kategori adı"
            aria-label="Yeni kategori adı"
            disabled={submitting}
          />
          <input
            type="color"
            className="color-picker"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            aria-label="Kategori rengi"
            title="Renk seç"
          />
          <select value={emoji} onChange={(e) => setEmoji(e.target.value)} aria-label="Emoji seç">
            {sampleEmojis().map((em) => (
              <option key={em} value={em}>{em}</option>
            ))}
          </select>
          <button type="submit" className="green-button" disabled={submitting || !newCategory.trim()}>
            {submitting ? '...' : 'Ekle'}
          </button>
        </div>
      </form>

      <div className="category-list">
        {categories.length === 0 ? (
          <p className="muted">Henüz kategori yok. Yukarıdan ekleyin.</p>
        ) : (
          categories.map((c) => (
            <div
              key={c.id}
              className="category-chip"
              style={{ background: `${c.color}22`, border: `1px solid ${c.color}` }}
            >
              <button
                className="chip-emoji"
                onClick={() => handleEditEmoji(c.id)}
                aria-label={`Emoji değiştir ${c.name}`}
                title="Emoji değiştirmek için tıkla"
              >
                {c.emoji}
              </button>
              <button
                className="chip-name"
                onClick={() => handleEditName(c.id)}
                title="İsim düzenlemek için tıkla"
              >
                {c.name}
              </button>
              {!c.is_default && (
                <button
                  className="chip-delete"
                  onClick={() => handleDeleteCategory(c.id)}
                  aria-label={`Sil ${c.name}`}
                  title="Sil"
                  style={{ background: c.color }}
                >
                  ✕
                </button>
              )}
              {c.is_default && (
                <span style={{ fontSize: '10px', color: 'var(--muted)', marginLeft: '8px' }}>varsayılan</span>
              )}
            </div>
          ))
        )}
      </div>

      <p className="muted" style={{ marginTop: '20px' }}>
        💡 Varsayılan kategoriler kayıt sırasında otomatik oluşturulur ve silinemez.
      </p>
    </div>
  );
};

export default KategoriYonetimi;