import pg from 'pg';
const { Pool } = pg;
import { openDb as openSQLite } from './db-sqlite.js'; // Caso queira manter o antigo localmente

let db;

if (process.env.DATABASE_URL) {
  // Conexão com Supabase (Produção)
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  console.log("🚀 Conectado ao Supabase!");
} else {
  // Fallback para SQLite se não houver URL (Desenvolvimento local)
  console.log("🏠 Usando banco de dados local (SQLite)");
}

export { db };
