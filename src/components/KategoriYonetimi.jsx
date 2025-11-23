// src/components/KategoriYonetimi.jsx

import React, { useState } from 'react';

const KategoriYonetimi = () => {
  const [categories, setCategories] = useState([
    'Kira', 'Market', 'Ulaşım', 'Maaş', 'Diğer',
  ]);
  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
    }
  };
  
  // Kategori silme işlevi (basitçe)
  const handleDeleteCategory = (categoryToDelete) => {
    setCategories(categories.filter(cat => cat !== categoryToDelete));
  };

  return (
    <div className="category-management-content">
      <h3>Kategori Yönetimi</h3>
      
      <form onSubmit={handleAddCategory} className="add-category-form">
        <input 
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Yeni kategori adı"
          required
        />
        <button type="submit" className="green-button">Ekle</button>
      </form>

      <ul className="category-list">
        {categories.map((category, index) => (
          <li key={index} className="category-item">
            <span>{category}</span>
            <button 
                onClick={() => handleDeleteCategory(category)} 
                className="delete-button"
            >
                Sil
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default KategoriYonetimi;