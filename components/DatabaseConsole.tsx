
import React, { useState } from 'react';
import { VulcanDB } from '../services/storageService';
import { UserRole } from '../types';

export default function DatabaseConsole() {
  const [activeTable, setActiveTable] = useState<'employees' | 'evaluations' | 'users'>('employees');
  const [editingRaw, setEditingRaw] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState(false);

  const data = {
    employees: VulcanDB.getEmployees(),
    evaluations: VulcanDB.getEvaluations(),
    users: VulcanDB.getUsers()
  };

  const currentData = data[activeTable];

  const handleRawSave = () => {
    try {
      const parsed = JSON.parse(editingRaw || '');
      if (activeTable === 'employees') VulcanDB.saveEmployees(parsed);
      if (activeTable === 'evaluations') VulcanDB.saveEvaluations(parsed);
      if (activeTable === 'users') {
        localStorage.setItem('vulcan_db_users_v1', JSON.stringify(parsed));
      }
      setSaveStatus(true);
      setTimeout(() => {
        setSaveStatus(false);
        setEditingRaw(null);
        window.location.reload();
      }, 1000);
    } catch (e) {
      alert("Error en formato JSON. Verifique la sintaxis.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-[#001a33] rounded-[40px] p-8 text-white shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight">Vulcan Data Explorer</h3>
            <p className="text-[#FFCC00] text-[10px] font-black uppercase tracking-widest mt-1">Gestión Directa de Tablas LocalStorage</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `vulcan_db_dump_${new Date().toISOString()}.json`;
                a.click();
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase transition-all"
            >
              Exportar SQL/JSON 💾
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Selector de Tablas */}
        <div className="lg:col-span-1 space-y-2">
          <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Tablas del Sistema</p>
          {(['employees', 'evaluations', 'users'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTable(tab); setEditingRaw(null); }}
              className={`w-full p-4 rounded-2xl text-left flex justify-between items-center transition-all ${
                activeTable === tab ? 'bg-[#003366] text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50'
              }`}
            >
              <span className="font-black uppercase text-xs">{tab}</span>
              <span className="text-[10px] font-bold opacity-60">{data[tab].length} recs</span>
            </button>
          ))}
          
          <div className="mt-8 p-6 bg-amber-50 rounded-3xl border border-amber-100">
             <h4 className="text-[10px] font-black text-amber-800 uppercase mb-2">Seguridad de Datos</h4>
             <p className="text-[9px] text-amber-700 leading-relaxed font-bold">
               Cualquier cambio aquí afecta directamente el motor de persistencia. Se recomienda exportar un respaldo antes de editar.
             </p>
          </div>
        </div>

        {/* Visualizador de Datos */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
               <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                 Contenido de la Tabla: <span className="text-indigo-600">{activeTable.toUpperCase()}</span>
               </h4>
               <button 
                 onClick={() => setEditingRaw(editingRaw ? null : JSON.stringify(currentData, null, 2))}
                 className="text-[10px] font-black text-indigo-600 uppercase"
               >
                 {editingRaw ? 'Ver Tabla' : 'Editar JSON Crudo'}
               </button>
            </div>

            <div className="p-0 overflow-x-auto max-h-[600px] overflow-y-auto">
              {editingRaw ? (
                <div className="p-6 space-y-4">
                  <textarea
                    value={editingRaw}
                    onChange={(e) => setEditingRaw(e.target.value)}
                    className="w-full h-[400px] p-6 font-mono text-[10px] bg-slate-900 text-emerald-400 rounded-2xl border-none outline-none"
                  />
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setEditingRaw(null)} className="px-6 py-3 font-black text-slate-400 uppercase text-[10px]">Cancelar</button>
                    <button 
                      onClick={handleRawSave}
                      className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-black uppercase text-[10px] shadow-lg shadow-emerald-500/20"
                    >
                      {saveStatus ? '¡Guardado!' : 'Commit Changes (Guardar)'}
                    </button>
                  </div>
                </div>
              ) : (
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                      {currentData.length > 0 && Object.keys(currentData[0]).map(key => (
                        <th key={key} className="px-4 py-4 font-black text-slate-400 uppercase border-b">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentData.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        {Object.values(row).map((val: any, j: number) => (
                          <td key={j} className="px-4 py-3 font-medium text-slate-600 truncate max-w-[200px]">
                            {typeof val === 'object' ? JSON.stringify(val).substring(0, 30) + '...' : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
