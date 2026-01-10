
import React, { useState, useEffect } from 'react';
import { VulcanDB } from '../services/storageService';
import { UserRole } from '../types';
import SyncPanel from './SyncPanel';
import { Language, t } from '../services/translations';

interface DatabaseConsoleProps {
  lang: Language;
}

type CloudStatus = {
  connection: boolean;
  employeesRead: boolean;
  employeesWrite: boolean;
  authValid: boolean;
  latency: number;
  error: string | null;
} | null;

export default function DatabaseConsole({ lang }: DatabaseConsoleProps) {
  const [activeTable, setActiveTable] = useState<'employees' | 'evaluations' | 'users' | 'sync' | 'diagnostic'>('employees');
  const [editingRaw, setEditingRaw] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>(null);
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setLastError(VulcanDB.getLastCloudError());
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const data = {
    employees: VulcanDB.getEmployees(),
    evaluations: VulcanDB.getEvaluations(),
    users: VulcanDB.getUsers()
  };

  const currentData = (activeTable !== 'sync' && activeTable !== 'diagnostic') ? (data as any)[activeTable] : [];

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

  const forceCloudSync = async () => {
    if (!confirm("¿Desea forzar el volcado completo de datos locales a la nube? Esto sobrescribirá lo que esté en Supabase.")) return;
    setIsTestingCloud(true);
    const empsOk = await VulcanDB.pushToCloud('employees', data.employees);
    const evalsOk = await VulcanDB.pushToCloud('evaluations', data.evaluations);
    const usersOk = await VulcanDB.pushToCloud('users', data.users);
    
    setIsTestingCloud(false);
    if (empsOk && evalsOk && usersOk) {
        alert("Sincronización completa exitosa.");
    } else {
        alert("Ocurrieron errores durante la sincronización. Verifique los logs.");
    }
  };

  const runCloudDiagnostic = async () => {
    setIsTestingCloud(true);
    setCloudStatus(null);
    const result = await VulcanDB.checkCloudStatus();
    setCloudStatus(result);
    setIsTestingCloud(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Alerta de Error Cloud */}
      {lastError && (
        <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-lg animate-bounce flex justify-between items-center">
          <div className="flex items-center gap-3">
             <span className="text-xl">⚠️</span>
             <div>
               <p className="text-[10px] font-black uppercase opacity-60">Error de Persistencia Cloud</p>
               <p className="text-xs font-bold">{lastError}</p>
             </div>
          </div>
          <button onClick={() => setLastError(null)} className="font-black">✕</button>
        </div>
      )}

      <div className="bg-[#001a33] rounded-[40px] p-8 text-white shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight">Vulcan Data Explorer</h3>
            <p className="text-[#FFCC00] text-[10px] font-black uppercase tracking-widest mt-1">Gestión Directa de Tablas LocalStorage & Supabase</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={forceCloudSync}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-[10px] font-black uppercase transition-all shadow-lg"
            >
              Push a Nube ☁️⬆️
            </button>
            <button 
              onClick={() => {
                const dump = {
                  employees: VulcanDB.getEmployees(),
                  evaluations: VulcanDB.getEvaluations(),
                  users: VulcanDB.getUsers()
                };
                const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `vulcan_db_dump_${new Date().toISOString()}.json`;
                a.click();
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase transition-all"
            >
              Exportar JSON 💾
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
          
          <button
            onClick={() => { setActiveTable('sync'); setEditingRaw(null); }}
            className={`w-full p-4 rounded-2xl text-left flex justify-between items-center transition-all ${
              activeTable === 'sync' ? 'bg-[#FFCC00] text-[#003366] shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50'
            }`}
          >
            <span className="font-black uppercase text-xs">Sincronización ☁️</span>
          </button>

          <button
            onClick={() => { setActiveTable('diagnostic'); setEditingRaw(null); }}
            className={`w-full p-4 rounded-2xl text-left flex justify-between items-center transition-all ${
              activeTable === 'diagnostic' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 hover:bg-slate-50'
            }`}
          >
            <span className="font-black uppercase text-xs">Diagnóstico Cloud 🩺</span>
          </button>
        </div>

        {/* Visualizador de Datos */}
        <div className="lg:col-span-3 space-y-4">
          {activeTable === 'sync' && (
            <SyncPanel lang={lang} onComplete={() => setActiveTable('employees')} />
          )}

          {activeTable === 'diagnostic' && (
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-8 animate-in zoom-in">
              <div className="text-center">
                <h4 className="text-xl font-black text-[#003366] uppercase tracking-tight">Verificación de Conexión Cloud</h4>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Prueba de integridad con Supabase</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`p-6 rounded-3xl border-2 flex flex-col items-center text-center transition-all ${cloudStatus?.connection ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                   <span className="text-2xl mb-2">{cloudStatus?.connection ? '🌐' : '⚪'}</span>
                   <p className="text-[9px] font-black uppercase text-slate-500">Estado</p>
                   <p className={`text-xs font-black uppercase ${cloudStatus?.connection ? 'text-emerald-600' : 'text-slate-400'}`}>
                     {cloudStatus?.connection ? 'ONLINE' : 'OFFLINE'}
                   </p>
                </div>
                <div className={`p-6 rounded-3xl border-2 flex flex-col items-center text-center transition-all ${cloudStatus?.authValid ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                   <span className="text-2xl mb-2">{cloudStatus?.authValid ? '🔑' : '🚫'}</span>
                   <p className="text-[9px] font-black uppercase text-slate-500">Credenciales</p>
                   <p className={`text-xs font-black uppercase ${cloudStatus?.authValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                     {cloudStatus?.authValid ? 'VÁLIDAS' : 'INVÁLIDAS'}
                   </p>
                </div>
                <div className={`p-6 rounded-3xl border-2 flex flex-col items-center text-center transition-all ${cloudStatus?.employeesRead ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                   <span className="text-2xl mb-2">{cloudStatus?.employeesRead ? '📖' : '⚪'}</span>
                   <p className="text-[9px] font-black uppercase text-slate-500">Lectura</p>
                   <p className={`text-xs font-black uppercase ${cloudStatus?.employeesRead ? 'text-emerald-600' : 'text-slate-400'}`}>
                     {cloudStatus?.employeesRead ? 'OK' : 'FAIL'}
                   </p>
                </div>
                <div className={`p-6 rounded-3xl border-2 flex flex-col items-center text-center transition-all ${cloudStatus?.employeesWrite ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                   <span className="text-2xl mb-2">{cloudStatus?.employeesWrite ? '✍️' : '⚪'}</span>
                   <p className="text-[9px] font-black uppercase text-slate-500">Escritura</p>
                   <p className={`text-xs font-black uppercase ${cloudStatus?.employeesWrite ? 'text-emerald-600' : 'text-slate-400'}`}>
                     {cloudStatus?.employeesWrite ? 'OK' : 'FAIL'}
                   </p>
                </div>
              </div>

              {cloudStatus?.error && (
                <div className="p-5 bg-rose-50 border-2 border-rose-100 rounded-2xl text-[10px] font-mono text-rose-600">
                   <p className="font-black mb-2 uppercase tracking-widest">Respuesta del Servidor:</p>
                   {cloudStatus.error}
                </div>
              )}

              <button 
                onClick={runCloudDiagnostic}
                disabled={isTestingCloud}
                className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${
                  isTestingCloud ? 'bg-slate-100 text-slate-400 animate-pulse' : 'bg-indigo-600 text-white shadow-xl hover:bg-indigo-700'
                }`}
              >
                {isTestingCloud ? 'ANALIZANDO...' : 'RE-VERIFICAR CONEXIÓN'}
              </button>
            </div>
          )}

          {activeTable !== 'sync' && activeTable !== 'diagnostic' && (
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
                        {saveStatus ? '¡Guardado!' : 'Guardar y Sincronizar'}
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
          )}
        </div>
      </div>
    </div>
  );
}
