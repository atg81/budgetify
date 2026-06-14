// src/components/Filters.jsx
import React from 'react';

const Filters = ({ onChange }) => {
  return (
    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
      <input type="date" onChange={e=>onChange && onChange({ from: e.target.value })} style={{ padding:8, borderRadius:8 }} />
      <input type="date" onChange={e=>onChange && onChange({ to: e.target.value })} style={{ padding:8, borderRadius:8 }} />
      <input placeholder="Ara" onChange={e=>onChange && onChange({ q: e.target.value })} style={{ padding:8, borderRadius:8 }} />
    </div>
  );
};

export default Filters;
