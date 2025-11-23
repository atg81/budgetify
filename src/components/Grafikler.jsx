// src/components/Grafikler.jsx

import React from 'react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Örnek Veriler
const monthlyData = [
  { name: 'Oca', harcama: 1000 },
  { name: 'Şub', harcama: 1500 },
  { name: 'Mar', harcama: 2000 },
  { name: 'Nis', harcama: 1800 },
  { name: 'May', harcama: 2500 },
  { name: 'Haz', harcama: 3000 },
  { name: 'Tem', harcama: 2800 },
  { name: 'Ağu', harcama: 3500 },
];
const expenseCategoryData = [
    { name: 'Yemek', value: 3500 },
    { name: 'Ulaşım', value: 1500 },
    { name: 'Eğlence', value: 1000 },
    { name: 'Diğer', value: 2000 },
];
const PIE_COLORS = ['#00E676', '#8884d8', '#FFBB28', '#FF8042']; // Yeşil ağırlıklı renkler

const Grafikler = () => {
    const totalCurrentExpense = 4850; // Pasta grafiği ortasındaki değer
    const totalMonthlyExpense = 12000; // Aylık Harcama değeri

    return (
        <div className="charts-content">
            <h2>Harcama Analizi</h2>
            
            <div className="chart-area" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                
                {/* Sol: Pasta Grafiği (Kategoriye Göre Harcama) */}
                <div className="card pie-chart-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <h4>Kategoriye Göre Harcama</h4>
                        <span className="text-green">+12%</span>
                    </div>
                    
                    {/* KPI Alanı */}
                    <div className="kpi-info" style={{ marginBottom: '15px' }}>
                        <p className="large-amount text-green" style={{ fontSize: '28px', margin: '0' }}>${totalCurrentExpense.toLocaleString()}</p>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={expenseCategoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={120}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {expenseCategoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            {/* Görseldeki gibi ortadaki $4.850 yazısını yapmak için özel bir `CustomLabel` bileşeni gerekir. */}
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Sağ: Çizgi Grafiği (Döneme Dayalı Harcama) */}
                <div className="card line-chart-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <h4>Döneme Dayalı Harcama</h4>
                        <span className="text-red">-3%</span>
                    </div>

                    {/* KPI Alanı */}
                    <div className="kpi-info" style={{ marginBottom: '15px' }}>
                        <p className="large-amount text-red" style={{ fontSize: '28px', margin: '0' }}>${totalMonthlyExpense.toLocaleString()}</p>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyData}>
                            <XAxis dataKey="name" />
                            <Tooltip />
                            <Line 
                                type="monotone" 
                                dataKey="harcama" 
                                stroke="#00E676" 
                                strokeWidth={3}
                                dot={false}
                                fill="#ccff90" // Alan dolgusu için açık yeşil
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Grafikler;