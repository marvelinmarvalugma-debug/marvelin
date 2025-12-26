"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../integrations/supabase/client';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#001a33] flex items-center justify-center p-6">
      <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 text-center animate-in zoom-in duration-500">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-1 bg-[#FFCC00] rounded-full"></div>
        </div>
        <h1 className="text-3xl font-black text-[#003366] tracking-tighter mb-2">VULCAN<span className="text-[#FFCC00]">HR</span></h1>
        <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-8">Acceso al Sistema</p>
        <Auth
          supabaseClient={supabase}
          providers={[]} // Puedes añadir 'google', 'github', etc. aquí si lo deseas
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
          localization={{
            variables: {
              sign_in: {
                email_label: 'Correo Electrónico',
                password_label: 'Contraseña',
                email_input_placeholder: 'tu@ejemplo.com',
                password_input_placeholder: '••••••••',
                button_label: 'Iniciar Sesión',
                social_auth_typography: 'O continuar con',
                link_text: '¿Ya tienes una cuenta? Inicia Sesión',
                forgotten_password_text: '¿Olvidaste tu contraseña?',
                no_account_text: '¿No tienes una cuenta? Regístrate',
              },
              sign_up: {
                email_label: 'Correo Electrónico',
                password_label: 'Crear Contraseña',
                email_input_placeholder: 'tu@ejemplo.com',
                password_input_placeholder: '••••••••',
                button_label: 'Registrarse',
                social_auth_typography: 'O continuar con',
                link_text: '¿No tienes una cuenta? Regístrate',
              },
              forgotten_password: {
                email_label: 'Correo Electrónico',
                email_input_placeholder: 'tu@ejemplo.com',
                button_label: 'Enviar instrucciones de recuperación',
                link_text: '¿Recordaste tu contraseña? Inicia Sesión',
              },
              update_password: {
                password_label: 'Nueva Contraseña',
                password_input_placeholder: '••••••••',
                button_label: 'Actualizar Contraseña',
              },
            },
          }}
        />
      </div>
    </div>
  );
}