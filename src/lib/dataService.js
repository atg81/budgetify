// src/lib/dataService.js
// Centralized data service for Budgetify - Handles all database operations

import { query, queryOne, neonConfigured } from './neon';
import { getUserId } from './auth';

// =====================================================
// TRANSACTIONS
// =====================================================

/**
 * Get all transactions for the current user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of transactions
 */
export async function getTransactions(userId) {
    if (!neonConfigured) return getMockTransactions();

    const transactions = await query(
        `SELECT t.*, c.name as category_name, c.emoji as category_emoji, c.color as category_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.user_id = $1
     ORDER BY t.date DESC, t.created_at DESC
     LIMIT 100`,
        [userId]
    );
    return transactions;
}

/**
 * Get recent transactions (last 5)
 */
export async function getRecentTransactions(userId) {
    if (!neonConfigured) return getMockTransactions().slice(0, 5);

    const transactions = await query(
        `SELECT t.*, c.name as category_name, c.emoji as category_emoji, c.color as category_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.user_id = $1
     ORDER BY t.date DESC, t.created_at DESC
     LIMIT 5`,
        [userId]
    );
    return transactions;
}

/**
 * Add a new transaction
 */
export async function addTransaction(userId, data) {
    if (!neonConfigured) {
        console.log('Mock: Transaction added', data);
        return { id: Date.now(), ...data };
    }

    const result = await query(
        `INSERT INTO transactions (user_id, category_id, amount, currency, type, date, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
        [userId, data.category_id || null, data.amount, data.currency || 'TRY', data.type, data.date, data.description || '']
    );
    return result[0];
}

/**
 * Delete a transaction
 */
export async function deleteTransaction(transactionId, userId) {
    if (!neonConfigured) return true;

    await query(
        `DELETE FROM transactions WHERE id = $1 AND user_id = $2`,
        [transactionId, userId]
    );
    return true;
}

// =====================================================
// CATEGORIES
// =====================================================

/**
 * Get all categories for the current user
 */
export async function getCategories(userId) {
    if (!neonConfigured) return getMockCategories();

    const categories = await query(
        `SELECT * FROM categories WHERE user_id = $1 ORDER BY is_default DESC, name ASC`,
        [userId]
    );
    return categories;
}

/**
 * Add a new category
 */
export async function addCategory(userId, data) {
    if (!neonConfigured) {
        return { id: Date.now(), ...data };
    }

    const result = await query(
        `INSERT INTO categories (user_id, name, color, emoji, is_default)
     VALUES ($1, $2, $3, $4, false)
     RETURNING *`,
        [userId, data.name, data.color, data.emoji]
    );
    return result[0];
}

/**
 * Update an existing category
 */
export async function updateCategory(categoryId, userId, data) {
    if (!neonConfigured) return { id: categoryId, ...data };

    const result = await query(
        `UPDATE categories SET name = $1, color = $2, emoji = $3 WHERE id = $4 AND user_id = $5 RETURNING *`,
        [data.name, data.color, data.emoji, categoryId, userId]
    );
    return result[0];
}

/**
 * Delete a category
 */
export async function deleteCategory(categoryId, userId) {
    if (!neonConfigured) return true;

    await query(
        `DELETE FROM categories WHERE id = $1 AND user_id = $2`,
        [categoryId, userId]
    );
    return true;
}

// =====================================================
// DASHBOARD STATS
// =====================================================

/**
 * Get dashboard statistics for the current user
 */
export async function getDashboardStats(userId) {
    if (!neonConfigured) {
        return {
            totalIncome: 15000,
            totalExpense: 7500,
            balance: 7500
        };
    }

    // Get totals for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    const stats = await queryOne(
        `SELECT 
       COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
       COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
     FROM transactions
     WHERE user_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2`,
        [userId, currentMonth]
    );

    const totalIncome = parseFloat(stats?.total_income || 0);
    const totalExpense = parseFloat(stats?.total_expense || 0);

    return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense
    };
}

/**
 * Get expense data by category for charts
 */
export async function getExpenseByCategory(userId) {
    if (!neonConfigured) {
        return [
            { name: 'Yemek', value: 3500 },
            { name: 'Ulaşım', value: 1500 },
            { name: 'Eğlence', value: 1000 },
            { name: 'Diğer', value: 2000 },
        ];
    }

    const data = await query(
        `SELECT c.name, COALESCE(SUM(t.amount), 0)::float as value
     FROM transactions t
     JOIN categories c ON t.category_id = c.id
     WHERE t.user_id = $1 AND t.type = 'expense'
     GROUP BY c.name
     ORDER BY value DESC`,
        [userId]
    );

    return data.length > 0 ? data : [{ name: 'Veri yok', value: 0 }];
}

/**
 * Get monthly expense data for line chart
 */
export async function getMonthlyExpenses(userId) {
    if (!neonConfigured) {
        return [
            { name: 'Oca', harcama: 1000 },
            { name: 'Şub', harcama: 1500 },
            { name: 'Mar', harcama: 2000 },
            { name: 'Nis', harcama: 1800 },
            { name: 'May', harcama: 2500 },
            { name: 'Haz', harcama: 3000 },
        ];
    }

    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

    const data = await query(
        `SELECT 
       EXTRACT(MONTH FROM date)::int as month,
       COALESCE(SUM(amount), 0)::float as harcama
     FROM transactions
     WHERE user_id = $1 AND type = 'expense' AND date >= NOW() - INTERVAL '6 months'
     GROUP BY EXTRACT(MONTH FROM date)
     ORDER BY month`,
        [userId]
    );

    return data.map(d => ({
        name: months[(d.month - 1) % 12],
        harcama: d.harcama
    }));
}

// =====================================================
// MOCK DATA (for development without database)
// =====================================================

function getMockTransactions() {
    return [
        { id: 1, type: 'income', description: 'Maaş', category_name: 'Maaş', category_emoji: '💳', amount: 12000, date: '2024-05-10' },
        { id: 2, type: 'expense', description: 'Market Alışverişi', category_name: 'Market', category_emoji: '🛒', amount: 950, date: '2024-05-12' },
        { id: 3, type: 'expense', description: 'Fatura Ödemesi', category_name: 'Fatura', category_emoji: '🧾', amount: 1200, date: '2024-05-10' },
        { id: 4, type: 'income', description: 'Ek Gelir', category_name: 'Maaş', category_emoji: '💳', amount: 3000, date: '2024-05-01' },
        { id: 5, type: 'expense', description: 'Ulaşım', category_name: 'Ulaşım', category_emoji: '🚌', amount: 480, date: '2024-05-05' },
    ];
}

function getMockCategories() {
    return [
        { id: '1', name: 'Kira & Konut', color: '#FB923C', emoji: '🏠', is_default: true },
        { id: '2', name: 'Yiyecek & Market', color: '#F97316', emoji: '🍔', is_default: true },
        { id: '3', name: 'Ulaşım', color: '#60A5FA', emoji: '🚌', is_default: true },
        { id: '4', name: 'Eğlence', color: '#A78BFA', emoji: '🎮', is_default: true },
        { id: '5', name: 'Diğer', color: '#9CA3AF', emoji: '🧾', is_default: true },
    ];
}

export default {
    getTransactions,
    getRecentTransactions,
    addTransaction,
    deleteTransaction,
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getDashboardStats,
    getExpenseByCategory,
    getMonthlyExpenses
};
