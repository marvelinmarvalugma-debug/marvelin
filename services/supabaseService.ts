
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://inyrqktnfbnpckybgyys.supabase.co';
// Nota: Las claves de Supabase suelen empezar con 'eyJ...'. 
// Asegúrese de que esta sea la 'anon key' correcta del proyecto.
const supabaseKey = 'sb_publishable_9dGvITtj1sbSesDxpfpA2g_dSajw5un';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: { 'x-application-name': 'vulcan-hr' },
  },
});

/**
 * Helper para validar si el error es de autenticación (Key inválida)
 */
export const isAuthError = (error: any) => {
  if (!error) return false;
  return error.code === 'PGRST301' || error.status === 401 || error.message?.includes('JWT');
};

export const handleSupabaseError = (error: any) => {
  if (error) {
    console.group('🛡️ Supabase Error');
    console.error('Mensaje:', error.message);
    console.error('Código:', error.code);
    console.error('Status:', error.status);
    console.groupEnd();
    return false;
  }
  return true;
};
