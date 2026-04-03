require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  const cols = await p.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name IN ('categories', 'transactions') 
    AND column_name IN ('id', 'category_id')
    ORDER BY table_name, column_name
  `);
  console.log('\n=== DB TYPES ===');
  for (const r of cols.rows) {
    console.log(` ${r.table_name}.${r.column_name}: ${r.data_type}`);
  }
  await p.end();
}
main();
