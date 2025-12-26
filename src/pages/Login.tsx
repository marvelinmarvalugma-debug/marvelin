import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../integrations/supabase/client';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#001a33] flex items-center justify-center p-6">
      <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 text-center animate-in zoom-in duration-500">
        <h1 className="text-3xl font-black text-[#003366] tracking-tighter mb-2">VULCAN<span className="text-[#FFCC00]">HR</span></h1>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">Acceso de Personal Autorizado</p>
        <Auth
          supabaseClient={supabase}
          providers={[]} // No social providers for now
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#003366',
                  brandAccent: '#FFCC00',
                },
              },
            },
          }}
          theme="light"
          redirectTo={window.location.origin} // Redirect to home after login
        />
      </div>
    </div>
  );
};

export default Login;