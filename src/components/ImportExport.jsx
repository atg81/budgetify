// src/components/ImportExport.jsx
import React from 'react';
import { getTransactions, addTransaction } from '../lib/dataService';

function toCSV(rows) {
  if (!rows || rows.length === 0) return '';
  const keys = Object.keys(rows[0]);
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const s = String(val);
    if (s.includes('"')) {
      // double the quotes
      const quoted = s.replace(/"/g, '""');
      return `"${quoted}"`;
    }
    if (s.includes(',') || s.includes('\n') || s.includes('\r')) {
      return `"${s}"`;
    }
    return s;
  };

  const header = keys.map(k => escape(k)).join(',');
  const lines = rows.map(r => keys.map(k => escape(r[k] ?? '')).join(','));
  return [header, ...lines].join('\n');
}

const ImportExport = ({ userId }) => {
  const handleExport = async () => {
    const rows = await getTransactions(userId);
    const csv = toCSV(rows || []);
    // Add UTF-8 BOM so Excel on Windows detects UTF-8 correctly
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budgetify_transactions_${new Date().toISOString().slice(0,10)}.csv`;
    // Append to DOM to make click work reliably in some browsers
    document.body.appendChild(a);
    a.click();
    // cleanup after a short delay to ensure download has started
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const handleExportJSON = async () => {
    const rows = await getTransactions(userId);
    const json = JSON.stringify(rows || [], null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budgetify_transactions_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const handleExportPNG = async () => {
    const rows = await getTransactions(userId) || [];
    const keys = rows.length ? Object.keys(rows[0]) : [''];
    const lines = [];
    lines.push(keys.join(' | '));
    rows.forEach(r => {
      lines.push(keys.map(k => String(r[k] ?? '')).join(' | '));
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const padding = 20;
    const lineHeight = 24;
    const font = '16px Arial';
    ctx.font = font;
    const maxLineWidth = Math.max(...lines.map(l => ctx.measureText(l).width), 300);
    canvas.width = Math.min(2000, Math.ceil(maxLineWidth) + padding * 2);
    canvas.height = padding * 2 + lines.length * lineHeight;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000000';
    ctx.font = font;
    lines.forEach((l, i) => {
      ctx.fillText(l, padding, padding + (i + 1) * lineHeight - 6);
    });

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budgetify_transactions_${new Date().toISOString().slice(0,10)}.png`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const headers = lines[0].split(',').map(h => h.replace(/"/g,'').trim());
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
      const obj = {};
      headers.forEach((h, idx) => obj[h] = cols[idx]);
      // minimal mapping - try to insert
      await addTransaction(userId, {
        category_id: obj.category_id || null,
        amount: parseFloat(obj.amount) || 0,
        currency: obj.currency || 'TRY',
        type: obj.type || 'expense',
        date: obj.date || new Date().toISOString().slice(0,10),
        description: obj.description || ''
      });
    }
    alert('Import tamamlandı');
  };

  return (
    <div>
      <h2>İçe / Dışa Aktarma</h2>
      <div className="card">
        <button className="green-button" onClick={handleExport}>CSV Dışa Aktar</button>
        <button style={{ marginLeft: 8 }} onClick={handleExportJSON}>JSON Dışa Aktar</button>
        <button style={{ marginLeft: 8 }} onClick={handleExportPNG}>PNG Dışa Aktar</button>
        <div style={{ marginTop: 12 }}>
          <input type="file" accept=".csv,text/csv" onChange={handleImport} />
        </div>
      </div>
    </div>
  );
};

export default ImportExport;
