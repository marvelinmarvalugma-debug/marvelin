
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { VulcanDB } from '../services/storageService';
import { t, Language } from '../services/translations';

interface LoginPageProps {
  onLogin: (user: User) => void;
  lang: Language;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, lang }) => {
  const usersTable = VulcanDB.getUsers();
  const [selectedUsername, setSelectedUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = usersTable.find(u => u.username === selectedUsername);
    
    if (!user) {
      setError(t('invalid_credentials', lang));
      return;
    }

    // Si no tiene contraseña (primer login), la definimos
    if (!user.password) {
      if (password.length < 4) {
        setError(lang === 'es' ? "Defina al menos 4 caracteres" : "At least 4 characters");
        return;
      }
      const updatedUser = { ...user, password };
      VulcanDB.updateUser(updatedUser);
      onLogin(updatedUser);
    } else {
      // Validar existente
      if (password === user.password) {
        onLogin(user);
      } else {
        setError(lang === 'es' ? "Contraseña incorrecta" : "Incorrect password");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#001a33] flex items-center justify-center p-6 selection:bg-[#FFCC00] selection:text-[#003366]">
      <div className="bg-white rounded-[40px] shadow-2xl max-w-lg w-full p-10 lg:p-14 animate-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-slate-50 rounded-3xl mb-6 shadow-sm">
             <h1 className="text-4xl font-black text-[#003366] tracking-tighter">VULCAN<span className="text-[#FFCC00]">HR</span></h1>
          </div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{t('welcome_back', lang)}</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">{t('login_subtitle', lang)}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#003366] uppercase tracking-widest px-1">{t('username_label', lang)}</label>
            <select 
              required
              value={selectedUsername}
              onChange={(e) => { setSelectedUsername(e.target.value); setError(''); }}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-[#003366] transition-all"
            >
              <option value="">{t('select_profile', lang)}</option>
              {usersTable.map(u => (
                <option key={u.username} value={u.username}>{u.username} ({u.role})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#003366] uppercase tracking-widest px-1">{t('password_label', lang)}</label>
            <input 
              required
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center text-lg font-black tracking-widest outline-none focus:border-[#003366] transition-all"
            />
            {selectedUsername && !usersTable.find(u => u.username === selectedUsername)?.password && (
               <p className="text-[8px] text-amber-600 font-black uppercase text-center mt-2">{t('first_time_msg', lang)}</p>
            )}
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-500 p-4 rounded-xl text-[10px] font-black uppercase text-center border border-rose-100 animate-in shake">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full py-5 bg-[#003366] text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-900/20 hover:bg-[#002244] active:scale-95 transition-all"
          >
            {t('login_button', lang)}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-50 text-center">
           <p className="text-[8px] text-slate-300 font-black uppercase tracking-widest">Vulcan Energy Technology Venezolana C.A. &copy; 2024</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
