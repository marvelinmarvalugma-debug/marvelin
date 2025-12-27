"use client";

import React, { useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import toast from 'react-hot-toast';

interface ProfileCompletionFormProps {
  userId: string;
  onProfileComplete: () => void;
}

const ProfileCompletionForm: React.FC<ProfileCompletionFormProps> = ({ userId, onProfileComplete }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Por favor, ingrese su nombre y apellido.');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ first_name: firstName.trim(), last_name: lastName.trim(), updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil: ' + error.message);
    } else {
      toast.success('Perfil actualizado con éxito!');
      onProfileComplete();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#001a33] flex items-center justify-center p-6">
      <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 text-center animate-in zoom-in duration-500">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-1 bg-[#FFCC00] rounded-full"></div>
        </div>
        <h1 className="text-3xl font-black text-[#003366] tracking-tighter mb-2">VULCAN<span className="text-[#FFCC00]">HR</span></h1>
        <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-8">Complete su Perfil</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="firstName" className="text-xs font-black text-slate-400 uppercase tracking-widest block text-left">Nombre</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#003366] outline-none transition-all"
              placeholder="Su nombre"
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="lastName" className="text-xs font-black text-slate-400 uppercase tracking-widest block text-left">Apellido</label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#003366] outline-none transition-all"
              placeholder="Su apellido"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#003366] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 hover:bg-[#002244] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Guardar Perfil'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileCompletionForm;