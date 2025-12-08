// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Verificação de Segurança
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error("Erro Crítico: Faltam as variáveis de ambiente (URL ou Key) no ficheiro .env");
}

// Criação do Cliente com Tipagem <Database>
export const supabase = createClient<Database>(
  SUPABASE_URL || '', 
  SUPABASE_PUBLISHABLE_KEY || '', 
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);