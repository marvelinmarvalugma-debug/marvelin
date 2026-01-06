
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://inyrqktnfbnpckybgyys.supabase.co';
const supabaseKey = 'sb_publishable_9dGvITtj1sbSesDxpfpA2g_dSajw5un';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper para manejar errores de Supabase
export const handleSupabaseError = (error: any) => {
  if (error) {
    console.error('Supabase Error:', error.message || error);
    return false;
  }
  return true;
};
