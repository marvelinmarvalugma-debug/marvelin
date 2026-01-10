
import React, { useState, useMemo } from 'react';
import { Employee, Department, UserRole } from '../types';
import { t, Language } from '../services/translations';

interface EmployeeListProps {
  employees: Employee[];
  onSelect: (employee: Employee) => void;
  onAddNew: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onBulkAdd?: (data: string, type: 'ato' | 'vulcan') => void;
  onEvaluate?: (employee: Employee) => void;
  isReadOnly?: boolean;
  currentUserRole?: UserRole;
  lang: Language;
}

const MESES_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const EmployeeList: React.FC<EmployeeListProps> = ({ 
  employees, onSelect, onAddNew, onDelete, onClearAll, onBulkAdd, onEvaluate, isReadOnly = false, currentUserRole, lang 
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkType, setBulkType] = useState<'ato' | 'vulcan'>('ato');

  const currentPeriod = useMemo(() => {
    const now = new Date();
    const month = MESES_ES[now.getMonth()];
    const year = now.getFullYear().toString();
    return `${month} ${year}`.toLowerCase();
  }, []);

  const filteredEmployees = employees.filter(emp => {
    const matchesDept = filter === 'all' || emp.department === filter;
    const matchesSearch = 
      emp.name.toLowerCase().includes(search.toLowerCase()) || 
      emp.role.toLowerCase().includes(search.toLowerCase()) ||
      emp.idNumber.includes(search);
    return matchesDept && matchesSearch;
  });

  const handleBulkSubmit = () => {
    if (onBulkAdd && bulkText) {
      onBulkAdd(bulkText, bulkType);
      setShowBulkModal(false);
      setBulkText('');
    }
  };

  const isSupervisor = currentUserRole === UserRole.Supervisor;

  return (
    <div className="space-y-6">
      {showBulkModal && !isReadOnly && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#001a33]/90 backdrop-blur-xl p-4">
          <div className="bg-white rounded-[40px] p-8 lg:p-12 max-w-5xl w-full shadow-2xl animate-in zoom-in duration-300 overflow-y-auto max-h-[95vh] border-2 border-[#FFCC00]/20">
             <div className="flex justify-between items-start mb-10">
               <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-[#003366] text-[#FFCC00] rounded-3xl flex items-center justify-center font-black text-2xl shadow-xl">📥</div>
                 <div>
                   <h3 className="text-3xl font-black text-[#003366] uppercase tracking-tighter">
                     {lang === 'es' ? 'Carga Masiva de Personal' : 'Bulk Personnel Load'}
                   </h3>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[9px] font-black rounded-lg uppercase tracking-widest">
                         {isSupervisor ? (lang === 'es' ? 'ROL: EVALUADOR' : 'ROLE: EVALUATOR') : 'ROL: ADMIN'}
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {lang === 'es' ? 'Actualiza nómina o añade nuevos registros' : 'Update payroll or add new records'}
                      </p>
                   </div>
                 </div>
               </div>
               <button onClick={() => setShowBulkModal(false)} className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all border border-slate-100">✕</button>
             </div>

             <div className="flex bg-slate-100 p-2 rounded-3xl mb-8 border border-slate-200 shadow-inner">
                <button 
                  onClick={() => setBulkType('ato')}
                  className={`flex-1 py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${bulkType === 'ato' ? 'bg-[#003366] text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  🏢 {t('personal_ato', lang)}
                </button>
                <button 
                  onClick={() => setBulkType('vulcan')}
                  className={`flex-1 py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${bulkType === 'vulcan' ? 'bg-[#003366] text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  🚀 {t('personal_vulcan', lang)}
                </button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-10">
                <div className="lg:col-span-3 space-y-6">
                   <div className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-100">
                      <div className="flex bg-[#003366] text-white p-4 rounded-2xl text-[9px] font-black uppercase tracking-tighter mb-4 shadow-lg">
                        <span className="w-1/4">1. {lang === 'es' ? 'Cédula / ID' : 'ID Card'}</span>
                        <span className="w-1/4">2. {lang === 'es' ? 'Nombre Completo' : 'Full Name'}</span>
                        <span className="w-1/4">3. {lang === 'es' ? 'Cargo / Rol' : 'Role'}</span>
                        <span className="w-1/4">4. {lang === 'es' ? 'Dpto' : 'Dept'}</span>
                      </div>
                      <textarea 
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        className="w-full h-80 p-6 bg-white border-2 border-slate-200 rounded-2xl font-mono text-[11px] outline-none focus:border-[#003366] focus:ring-4 focus:ring-blue-50 transition-all resize-none shadow-inner"
                        placeholder={lang === 'es' ? `Ejemplo:\n12345678\tJuan Perez\tSupervisor\tATO` : `Example:\n12345678\tJohn Doe\tSupervisor\tATO`}
                      />
                   </div>
                </div>
                
                <div className="space-y-6">
                   <div className="bg-indigo-50 p-6 rounded-[32px] border-2 border-indigo-100 shadow-sm">
                      <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                         <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                         {lang === 'es' ? 'INSTRUCCIONES' : 'INSTRUCTIONS'}
                      </h4>
                      <div className="space-y-4 text-[10px] text-indigo-700 font-bold uppercase leading-relaxed">
                        <p>✓ {lang === 'es' ? 'Copie desde Excel o TXT.' : 'Copy from Excel or TXT.'}</p>
                        <p>✓ {lang === 'es' ? 'Use tabulador o punto y coma.' : 'Use tabs or semicolons.'}</p>
                        {isSupervisor && (
                          <p className="p-3 bg-white rounded-xl border border-indigo-200 text-indigo-600 italic">
                             ⚠ {lang === 'es' ? 'Los registros se asignarán automáticamente a SU GESTIÓN.' : 'Records will be auto-assigned to YOUR MANAGEMENT.'}
                          </p>
                        )}
                      </div>
                   </div>

                   <div className="bg-slate-50 p-6 rounded-[32px] border-2 border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{lang === 'es' ? 'TIPS DE FORMATO' : 'FORMAT TIPS'}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase italic leading-tight">
                        {lang === 'es' ? 'Cédula (V-XXXXX) y Nombre son obligatorios para evitar errores.' : 'ID (V-XXXXX) and Name are mandatory to avoid errors.'}
                      </p>
                   </div>
                </div>
             </div>

             <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t-2 border-slate-50 gap-4">
               <button onClick={() => setBulkText('')} className="px-10 py-4 font-black text-slate-400 uppercase text-xs tracking-widest hover:text-rose-600 transition-colors flex items-center gap-2">
                 <span>🗑️</span> {lang === 'es' ? 'Limpiar Todo' : 'Clear All'}
               </button>
               <div className="flex gap-4">
                 <button onClick={() => setShowBulkModal(false)} className="px-10 py-4 font-black text-slate-400 uppercase text-xs tracking-widest hover:bg-slate-100 rounded-2xl transition-all">
                   {t('cancel', lang)}
                 </button>
                 <button 
                  onClick={handleBulkSubmit} 
                  disabled={!bulkText.trim()}
                  className={`px-16 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-2xl ${
                    !bulkText.trim() ? 'bg-slate-100 text-slate-300' : 'bg-[#003366] text-white shadow-blue-900/40 hover:scale-105 active:scale-95'
                  }`}
                 >
                   {lang === 'es' ? 'Procesar Carga' : 'Process Load'} {bulkType.toUpperCase()}
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
             <input 
              type="text" 
              placeholder={t('search_placeholder', lang)} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-3xl px-8 py-5 text-sm font-bold text-slate-700 focus:border-[#003366] outline-none transition-all placeholder:text-slate-300 shadow-sm focus:ring-4 focus:ring-blue-50"
            />
          </div>
          {!isReadOnly && (
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={(e) => { e.stopPropagation(); onClearAll(); }}
                className="bg-white border-2 border-rose-100 text-rose-500 px-6 py-4 rounded-[24px] text-[10px] font-black hover:bg-rose-50 transition-all uppercase tracking-widest shadow-sm"
              >
                 🗑️ {t('clear_all', lang)}
              </button>
              <button 
                onClick={() => setShowBulkModal(true)}
                className="bg-gradient-to-r from-[#003366] to-[#004488] text-white px-8 py-4 rounded-[24px] text-[11px] font-black hover:scale-105 transition-all uppercase tracking-[0.15em] shadow-xl shadow-blue-900/20 flex items-center gap-3 border-2 border-white/10"
              >
                 <span className="text-lg">📥</span> {t('bulk_load', lang)}
              </button>
              <button 
                onClick={onAddNew}
                className="bg-[#FFCC00] text-[#003366] px-8 py-4 rounded-[24px] text-[11px] font-black shadow-xl shadow-yellow-500/20 hover:scale-105 transition-all uppercase tracking-[0.15em] border-2 border-white/50"
              >
                + {t('manual_reg', lang)}
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-2 overflow-x-auto pb-4 no-scrollbar">
          {['all', Department.ATO, Department.VULCAN].map(cat => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              className={`whitespace-nowrap px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 ${
                filter === cat 
                  ? 'bg-[#003366] text-white border-[#003366] shadow-2xl shadow-blue-900/30 scale-105' 
                  : 'bg-white text-slate-400 border-slate-100 hover:text-slate-600 hover:border-slate-200 shadow-sm'
              }`}
            >
              {cat === 'all' ? t('see_all', lang) : cat === Department.ATO ? t('personal_ato', lang) : t('personal_vulcan', lang)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredEmployees.map(emp => {
          const isAto = emp.department === Department.ATO;
          const isEvaluated = emp.lastEvaluation.toLowerCase() === currentPeriod;

          return (
            <div 
              key={emp.id}
              onClick={() => onSelect(emp)}
              className={`group bg-white rounded-[40px] p-8 shadow-sm border-2 transition-all cursor-pointer relative overflow-hidden ${isEvaluated ? 'border-emerald-500 bg-emerald-50/5 shadow-xl shadow-emerald-500/5' : 'border-slate-50'} hover:border-[#003366] hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-2`}
            >
              <div className={`absolute top-0 right-0 ${isAto ? 'bg-indigo-600' : 'bg-emerald-600'} text-white text-[8px] font-black px-6 py-2 uppercase tracking-[0.2em] rounded-bl-2xl shadow-lg z-20`}>
                {emp.department}
              </div>

              {!isReadOnly && (
                <div className="absolute top-4 left-4 z-[90] opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onDelete(emp.id);
                    }}
                    className="w-12 h-12 bg-rose-600 text-white rounded-2xl shadow-2xl hover:bg-rose-700 active:scale-90 transition-all border-2 border-white flex items-center justify-center"
                  >
                    <span className="text-xl">🗑️</span>
                  </button>
                </div>
              )}

              {isEvaluated && (
                <div className="absolute top-8 left-4 z-20 bg-emerald-500 text-white py-1.5 px-4 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-left-4">
                  <span className="text-xs">✓</span>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em]">EVALUADO</span>
                </div>
              )}

              <div className="flex flex-col items-center text-center mt-6">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-slate-50 shadow-xl grayscale group-hover:grayscale-0 transition-all duration-500">
                    <img src={emp.photo} alt={emp.name} className="w-full h-full object-cover" />
                  </div>
                </div>
                
                <h5 className="font-black text-slate-800 text-sm uppercase leading-tight mb-2 truncate w-full px-2 group-hover:text-[#003366] transition-colors">{emp.name}</h5>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest truncate w-full opacity-70 mb-8">{emp.role}</p>
              </div>

              <div className="mt-4 flex justify-between items-center gap-2 pt-4 border-t border-slate-50">
                <div className="flex flex-col">
                   <span className={`text-[8px] font-black uppercase tracking-widest ${isEvaluated ? 'text-emerald-500' : 'text-slate-300'}`}>
                     {isEvaluated ? lang === 'es' ? 'PERIODO OK' : 'PERIOD OK' : lang === 'es' ? 'PENDIENTE' : 'PENDING'}
                   </span>
                   <span className="text-[7px] font-bold text-slate-400 uppercase mt-0.5 truncate max-w-[100px]">{emp.lastEvaluation}</span>
                </div>
                
                <div className="flex gap-2">
                  {onEvaluate && !isEvaluated && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEvaluate(emp); }}
                      className="text-[9px] font-black uppercase px-5 py-3 rounded-2xl transition-all bg-[#FFCC00] text-[#003366] hover:scale-105 shadow-lg shadow-yellow-500/20 active:scale-95 border border-white/50"
                    >
                      {t('evaluar_ahora', lang)}
                    </button>
                  )}
                  <span className={`text-[9px] font-black uppercase px-5 py-3 rounded-2xl transition-all ${isEvaluated ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-[#003366] group-hover:bg-[#003366] group-hover:text-white border border-slate-100'}`}>
                    {t('full_profile', lang)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeeList;
