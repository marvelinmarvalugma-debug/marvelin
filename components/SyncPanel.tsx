
import React, { useState } from 'react';
import { VulcanDB } from '../services/storageService';

interface SyncPanelProps {
  onComplete: () => void;
}

export default function SyncPanel({ onComplete }: SyncPanelProps) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleCopy = () => {
    const backup = VulcanDB.exportBackup();
    navigator.clipboard.writeText(backup);
    setStatus('success');
    setTimeout(() => setStatus('idle'), 2000);
  };

  const handleImport = () => {
    // Fix: Use the correct method name 'importBackup' defined in storageService.ts
    if (VulcanDB.importBackup(code)) {
      onComplete();
      window.location.reload();
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-[40px] p-10 shadow-2xl border border-slate-100 animate-in zoom-in">
      <div className="text-center mb-10">
        <div className="text-4xl mb-4">☁️</div>
        <h3 className="text-2xl font-black text-[#003366] uppercase tracking-tight">Sincronización de Base de Datos</h3>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Transfiera su nómina entre dispositivos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
          <h4 className="text-[10px] font-black text-[#003366] uppercase mb-4 tracking-widest">Enviar Datos</h4>
          <p className="text-[10px] text-slate-500 mb-6 leading-relaxed">Genera un código con toda la información actual para pegarlo en otro dispositivo.</p>
          <button 
            onClick={handleCopy}
            className="w-full py-4 bg-[#003366] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-900/10 hover:scale-105 active:scale-95 transition-all"
          >
            {status === 'success' ? '¡Código Copiado!' : 'Copiar Base de Datos'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl border-2 border-[#FFCC00]/30">
          <h4 className="text-[10px] font-black text-[#003366] uppercase mb-4 tracking-widest">Recibir Datos</h4>
          <textarea 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[8px] font-mono mb-4 outline-none focus:border-[#FFCC00]"
            placeholder="Pegue el código aquí..."
          />
          <button 
            onClick={handleImport}
            className="w-full py-4 bg-[#FFCC00] text-[#003366] rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all"
          >
            Actualizar Sistema
          </button>
          {status === 'error' && <p className="text-[9px] text-rose-500 font-black uppercase mt-2 text-center">Código Inválido</p>}
        </div>
      </div>
    </div>
  );
}
