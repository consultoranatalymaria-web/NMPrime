import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERRO: SUPABASE_URL ou SUPABASE_ANON_KEY não estão definidas no arquivo .env!");
}

// Cria e exporta o cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
