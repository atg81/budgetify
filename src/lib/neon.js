// src/lib/neon.js
// Neon Serverless PostgreSQL client for Budgetify

import { neon } from '@neondatabase/serverless';

const databaseUrl = import.meta.env.VITE_DATABASE_URL;

let sql = null;
let neonConfigured = false;

if (databaseUrl) {
    try {
        sql = neon(databaseUrl);
        neonConfigured = true;
        console.log('✅ Neon database connected');
    } catch (err) {
        console.warn('Neon client initialization failed:', err);
        sql = null;
        neonConfigured = false;
    }
} else {
    console.warn('⚠️ DATABASE_URL not configured. Using mock mode.');
}

/**
 * Run a parameterized SQL query using Neon's query method
 * Uses sql.query() for conventional parameterized queries with $1, $2, etc.
 * 
 * @param {string} queryText - SQL query with $1, $2, etc. placeholders
 * @param {Array} params - Parameters to bind
 * @returns {Promise<Array>} Query results
 */
export async function query(queryText, params = []) {
    if (!sql) {
        throw new Error('Database not configured. Please set VITE_DATABASE_URL in .env.local');
    }

    try {
        // Use sql() as tagged template for parameterized queries
        // We need to build a tagged template call dynamically
        const result = await sql.query(queryText, params);
        return result;
    } catch (err) {
        console.error('Database query error:', err);
        throw err;
    }
}

/**
 * Get a single row from query result
 */
export async function queryOne(queryText, params = []) {
    const result = await query(queryText, params);
    return result[0] || null;
}

/**
 * Get the raw sql function for tagged template usage
 * Usage: const result = await getSql()`SELECT * FROM users WHERE id = ${userId}`;
 */
export function getSql() {
    return sql;
}

export { neonConfigured };
export default sql;
