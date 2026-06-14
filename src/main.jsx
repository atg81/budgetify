// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './assets/App.css';

// Global error overlay to make runtime/import errors visible in the browser
function showErrorOverlay(title, message) {
  try {
    let existing = document.getElementById('__error_overlay__');
    if (!existing) {
      existing = document.createElement('div');
      existing.id = '__error_overlay__';
      document.body.appendChild(existing);
    }
    existing.innerHTML = `<div style="position:fixed;inset:0;background:#fff;color:#111;z-index:99999;padding:24px;font-family:Inter,system-ui,Arial;overflow:auto"><h2 style=\"color:#c53030\">${title}</h2><pre style=\"white-space:pre-wrap;font-size:13px;line-height:1.4\">${message}</pre><div style=\"margin-top:12px\"><button id=\"__reload_btn__\" style=\"padding:8px 12px;background:#00e676;border-radius:8px;border:none;cursor:pointer\">Sayfayı Yeniden Yükle</button></div></div>`;
    document.getElementById('__reload_btn__')?.addEventListener('click', () => window.location.reload());
  } catch (err) {
    // ignore overlay errors
    // eslint-disable-next-line no-console
    console.error('Could not show overlay', err);
  }
}

window.addEventListener('error', (ev) => {
  // ev.error may be undefined for resource errors
  const msg = ev.error?.stack || ev.message || String(ev);
  showErrorOverlay('Unhandled error', msg);
});

window.addEventListener('unhandledrejection', (ev) => {
  const msg = ev.reason?.stack || ev.reason || String(ev);
  showErrorOverlay('Unhandled promise rejection', msg);
});


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);