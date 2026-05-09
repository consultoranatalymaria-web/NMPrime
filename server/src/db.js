import pg from 'pg';
const { Pool } = pg;

let pool;

if (process.env.DATABASE_URL) {
  // Conexão com Supabase (Produção)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  console.log("🚀 Conectado ao Supabase!");
} else {
  // Fallback para logs se algo estiver errado
  console.log("⚠️ DATABASE_URL não encontrada!");
}

// Exportando como 'db' para bater com o seu index.js
export const db = pool;