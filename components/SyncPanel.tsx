
import React, { useState } from 'react';
import { VulcanDB } from '../services/storageService';

interface SyncPanelProps {
  onSyncComplete: () => void;
}

export default function SyncPanel({ onSyncComplete }: SyncPanelProps) {
  const [syncCode, setSyncCode] = useState(VulcanDB.getSyncId() || '');
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [manualData, setManualData] = useState('');

  const handleExport = () => {
    const data = VulcanDB.exportData();
    setManualData(data);
    navigator.clipboard.writeText(data);
    setStatus('success');
    setTimeout(() => setStatus('idle'), 2000);
  };

  const handleImport = () => {
    if (!manualData) return;
    const success = VulcanDB.importData(manualData);
    if (success) {
      setStatus('success');
      onSyncComplete();
    } else {
      setStatus('error');
    }
  };

  return (
    <div className="bg-white rounded-[40px] p-8 shadow-2xl border border-slate-100 max-w-2xl mx-auto space-y-8 animate-in zoom-in">
      <div className="text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">☁️</span>
        </div>
        <h3 className="text-2xl font-black text-[#003366] uppercase tracking-tight">Sincronización Multi-Dispositivo</h3>
        <p className="text-slate-400 text-xs font-bold uppercase mt-2 tracking-widest">Transfiere tus datos de forma segura</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exportar */}
        <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 space-y-4">
          <h4 className="font-black text-[10px] text-[#003366] uppercase tracking-widest">PASO 1: Generar Código</h4>
          <p className="text-[10px] text-slate-500 leading-relaxed">Copia este código y envíalo al otro dispositivo para transferir la base de datos actual.</p>
          <button 
            onClick={handleExport}
            className="w-full py-4 bg-[#003366] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all"
          >
            {status === 'success' && manualData ? '¡Copiado al Portapapeles!' : 'Copiar Base de Datos'}
          </button>
        </div>

        {/* Importar */}
        <div className="p-6 bg-white rounded-3xl border-2 border-[#FFCC00]/30 space-y-4">
          <h4 className="font-black text-[10px] text-[#003366] uppercase tracking-widest">PASO 2: Recibir Datos</h4>
          <p className="text-[10px] text-slate-500 leading-relaxed">Pega el código recibido del otro dispositivo para actualizar este sistema.</p>
          <textarea 
            className="w-full h-20 p-3 bg-slate-50 border border-slate-200 rounded-xl text-[8px] font-mono outline-none focus:border-[#FFCC00]"
            placeholder="Pega el código aquí..."
            value={manualData}
            onChange={(e) => setManualData(e.target.value)}
          />
          <button 
            onClick={handleImport}
            className="w-full py-4 bg-[#FFCC00] text-[#003366] rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-900/10 hover:scale-105 active:scale-95 transition-all"
          >
            Actualizar Sistema
          </button>
        </div>
      </div>

      <div className="bg-indigo-900 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Recomendación Pro</p>
        </div>
        <p className="text-[10px] mt-2 leading-relaxed font-medium">
          Para una sincronización automática en tiempo real, conecte el sistema a una API de AWS o Google Cloud. Esta versión manual permite transferir datos sin necesidad de internet constante.
        </p>
      </div>
    </div>
  );
}
