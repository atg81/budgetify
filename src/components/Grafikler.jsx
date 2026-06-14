// src/components/Grafikler.jsx

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getExpenseByCategory, getMonthlyExpenses, getDashboardStats } from '../lib/dataService';

const PIE_COLORS = ['#00E676', '#8884d8', '#FFBB28', '#FF8042', '#00D4FF', '#FF6B6B', '#A78BFA', '#F97316'];

const Grafikler = ({ userId }) => {
    const [categoryData, setCategoryData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [stats, setStats] = useState({ totalExpense: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [catData, monthData, statsData] = await Promise.all([
                getExpenseByCategory(userId),
                getMonthlyExpenses(userId),
                getDashboardStats(userId)
            ]);
            setCategoryData(catData);
            setMonthlyData(monthData);
            setStats(statsData);
        } catch (err) {
            console.error('Error loading chart data:', err);
        } finally {
            setLoading(false);
        }
    };

    const totalCategoryExpense = categoryData.reduce((sum, item) => sum + (item.value || 0), 0);
    const totalMonthlyExpense = monthlyData.reduce((sum, item) => sum + (item.harcama || 0), 0);

    if (loading) {
        return (
            <div className="charts-content" style={{ textAlign: 'center', padding: '40px' }}>
                <p>Grafikler yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="charts-content">
            <h2>Harcama Analizi</h2>

            <div className="chart-area" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>

                {/* Sol: Pasta Grafiği (Kategoriye Göre Harcama) */}
                <div className="card pie-chart-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <h4>Kategoriye Göre Harcama</h4>
                    </div>

                    {/* KPI Alanı */}
                    <div className="kpi-info" style={{ marginBottom: '15px' }}>
                        <p className="large-amount text-green" style={{ fontSize: '28px', margin: '0' }}>
                            ₺{totalCategoryExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="small-muted">Toplam Harcama</p>
                    </div>

                    {categoryData.length === 0 || totalCategoryExpense === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                            <p>📊 Henüz harcama verisi yok</p>
                            <p className="small-muted">İşlem ekledikçe grafikler görünecek</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => `₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
                                    contentStyle={{ background: '#0f1724', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Sağ: Çizgi Grafiği (Döneme Dayalı Harcama) */}
                <div className="card line-chart-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <h4>Aylık Harcama Trendi</h4>
                    </div>

                    {/* KPI Alanı */}
                    <div className="kpi-info" style={{ marginBottom: '15px' }}>
                        <p className="large-amount text-red" style={{ fontSize: '28px', margin: '0' }}>
                            ₺{totalMonthlyExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="small-muted">Son 6 Ay Toplam</p>
                    </div>

                    {monthlyData.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                            <p>📈 Henüz aylık veri yok</p>
                            <p className="small-muted">İşlem ekledikçe trend görünecek</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyData}>
                                <XAxis
                                    dataKey="name"
                                    stroke="rgba(255,255,255,0.5)"
                                    tick={{ fill: 'rgba(255,255,255,0.7)' }}
                                />
                                <Tooltip
                                    formatter={(value) => [`₺${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, 'Harcama']}
                                    contentStyle={{ background: '#0f1724', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="harcama"
                                    stroke="#00E676"
                                    strokeWidth={3}
                                    dot={{ fill: '#00E676', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, fill: '#00E676' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Özet Kartları */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px' }}>
                <div className="card kpi-box">
                    <h4>Bu Ay Gelir</h4>
                    <p className="amount text-green">₺{stats.totalIncome?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || '0.00'}</p>
                </div>
                <div className="card kpi-box">
                    <h4>Bu Ay Gider</h4>
                    <p className="amount text-red">₺{stats.totalExpense?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || '0.00'}</p>
                </div>
                <div className="card kpi-box">
                    <h4>Net Durum</h4>
                    <p className={`amount ${(stats.balance || 0) >= 0 ? 'text-green' : 'text-red'}`}>
                        ₺{stats.balance?.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) || '0.00'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Grafikler;