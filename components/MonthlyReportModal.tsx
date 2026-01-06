
import React, { useState, useMemo } from 'react';
import { FullEvaluation, Employee, BonusStatus, UserRole, SALARY_APPROVERS, Department } from '../types';
import { t, Language } from '../services/translations';
import { VulcanDB } from '../services/storageService';

interface MonthlyReportModalProps {
  evaluations: FullEvaluation[];
  employees: Employee[];
  onClose: () => void;
  currentUserRole?: UserRole;
  currentUserUsername?: string;
  lang: Language;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MONTHS_EN = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

export default function MonthlyReportModal({ evaluations, employees, onClose, currentUserRole, currentUserUsername, lang }: MonthlyReportModalProps) {
  const now = new Date();
  const currentMonthName = MESES[now.getMonth()];
  const currentYearStr = now.getFullYear().toString();
  
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthName);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [localEvaluations, setLocalEvaluations] = useState<FullEvaluation[]>(evaluations);
  
  // State for inline manual editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState<string>('');

  const isDirector = currentUserRole === UserRole.Director;
  
  const isAuthorizedManager = useMemo(() => 
    currentUserUsername && SALARY_APPROVERS.some(name => currentUserUsername.toLowerCase().trim() === name.toLowerCase().trim()), 
    [currentUserUsername]
  );

  const availableYears = useMemo<string[]>(() => {
    const yearsFromData = localEvaluations.map((e: FullEvaluation) => e.año);
    const years = Array.from(new Set([...yearsFromData, currentYearStr]));
    return years.sort((a, b) => parseInt(b) - parseInt(a));
  }, [localEvaluations, currentYearStr]);

  const filteredEvals = useMemo<FullEvaluation[]>(() => {
    const periodEvals = localEvaluations.filter((e: FullEvaluation) => 
      e.mes.toLowerCase() === selectedMonth.toLowerCase() && 
      e.año === selectedYear
    );

    const uniqueEvaluationsMap = new Map<string, FullEvaluation>();
    periodEvals.forEach(ev => {
      uniqueEvaluationsMap.set(ev.employeeId, ev);
    });

    return Array.from(uniqueEvaluationsMap.values());
  }, [localEvaluations, selectedMonth, selectedYear]);

  const getSuggestedIncrement = (score: number) => {
    if (score >= 98) return "20% ó más";
    if (score >= 88) return "15%";
    if (score >= 80) return "10%";
    return "0%";
  };

  const handleUpdateIncrement = async (evalId: string, increment: string) => {
    if (!isAuthorizedManager) return;

    const updated = localEvaluations.map(ev => {
        if (ev.id === evalId) {
            return { 
                ...ev, 
                incrementoSalarial: increment, 
                authorizedBy: currentUserUsername,
                condicionBono: (increment === '0%' || !increment) ? BonusStatus.NotApproved : BonusStatus.Approved,
                recomendacionSalarial: (increment === '0%' || !increment) ? "Sin Incremento" : "Bono Aprobado por Gerencia"
            };
        }
        return ev;
    });

    setLocalEvaluations(updated);
    await VulcanDB.saveEvaluations(updated);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#001a33]/90 backdrop-blur-md p-4 print:bg-white print:p-0">
      <div className="bg-white lg:rounded-[40px] shadow-2xl max-w-7xl w-full h-full lg:h-auto lg:max-h-[95vh] flex flex-col overflow-hidden border-2 border-[#FFCC00]/20">
        
        <div className="p-8 border-b flex flex-col md:flex-row justify-between items-center gap-6 print:hidden">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-[#003366] text-[#FFCC00] rounded-2xl flex items-center justify-center font-black shadow-xl">📊</div>
             <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{t('consolidated_report', lang)}</h2>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  {isAuthorizedManager ? 'MODO GERENCIA: JAQUELIN / AURELIO / XUEZHI' : 'VISTA DE CONSULTA'}
                </p>
             </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-6 py-3 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase text-[#003366] outline-none focus:border-[#003366] cursor-pointer bg-slate-50"
            >
              {MESES.map((m, i) => <option key={m} value={m}>{lang === 'es' ? m.toUpperCase() : MONTHS_EN[i].toUpperCase()}</option>)}
            </select>
            
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-6 py-3 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase text-[#003366] outline-none focus:border-[#003366] cursor-pointer bg-slate-50"
            >
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <button onClick={onClose} className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shadow-inner border border-slate-100">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-12">
          <div className="flex flex-col sm:flex-row justify-between items-center border-b-8 border-[#003366] pb-8">
            <div className="flex items-center gap-6">
               <div className="bg-[#003366] p-4 rounded-3xl text-[#FFCC00] font-black text-2xl shadow-2xl">VULCAN</div>
               <div>
                  <h1 className="text-4xl font-black text-[#003366] tracking-tighter uppercase">Gestión de Bonos y Desempeño</h1>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">VULCAN ENERGY TECHNOLOGY VENEZOLANA C.A.</p>
               </div>
            </div>
            <div className="text-right bg-[#FFCC00] p-6 rounded-3xl shadow-xl border-b-4 border-amber-500">
              <p className="text-[9px] font-black text-[#003366] uppercase tracking-widest mb-1">{t('period_reported', lang)}</p>
              <p className="text-2xl font-black text-[#003366] uppercase leading-none">{selectedMonth} {selectedYear}</p>
            </div>
          </div>

          {filteredEvals.length === 0 ? (
            <div className="text-center py-32 bg-slate-50 rounded-[40px] border-4 border-dashed border-slate-100">
               <p className="text-slate-300 font-black uppercase text-xs tracking-[0.4em]">{t('no_records_period', lang)}</p>
            </div>
          ) : (
            <div className="overflow-x-auto border-2 border-slate-50 rounded-[40px] shadow-sm">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#003366] text-white">
                  <tr>
                    <th className="px-8 py-6 font-black uppercase tracking-widest border-r border-white/5">{t('employee', lang)}</th>
                    <th className="px-8 py-6 font-black uppercase tracking-widest border-r border-white/5 text-center">{t('technical_efficiency', lang)}</th>
                    {isAuthorizedManager && <th className="px-8 py-6 font-black uppercase tracking-widest border-r border-white/5">Aprobación de Bono / Incremento</th>}
                    {isAuthorizedManager && <th className="px-8 py-6 font-black uppercase tracking-widest border-r border-white/5">Estado Bono</th>}
                    {isAuthorizedManager && <th className="px-8 py-6 font-black uppercase tracking-widest text-center">Autorizado Por</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEvals.map((ev, idx) => {
                    const emp = employees.find(e => e.id === ev.employeeId);
                    const scoreNum = ev.promedioFinal * 20;
                    const suggestion = getSuggestedIncrement(scoreNum);
                    const isEditingThis = editingId === ev.id;

                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-all group">
                        <td className="px-8 py-5 border-r border-slate-100">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                               <img src={emp?.photo} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                            </div>
                            <div>
                               <p className="font-black text-[#003366] uppercase text-xs">{emp?.name || 'N/A'}</p>
                               <p className="text-[9px] text-slate-400 font-bold uppercase">V-{emp?.idNumber || 'N/A'} • {emp?.department}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center border-r border-slate-100">
                           <div className="inline-block p-3 rounded-2xl bg-indigo-50 border border-indigo-100">
                              <p className="text-base font-black text-indigo-700">{scoreNum.toFixed(1)}%</p>
                           </div>
                        </td>
                        
                        {isAuthorizedManager && (
                          <td className="px-8 py-5 border-r border-slate-100 min-w-[240px]">
                            {isEditingThis ? (
                              <div className="flex flex-col gap-2 p-2 bg-amber-50 rounded-2xl border-2 border-amber-200 animate-in zoom-in duration-200">
                                <label className="text-[8px] font-black text-amber-600 uppercase">Ingreso Manual (%)</label>
                                <div className="flex gap-2">
                                  <input 
                                    autoFocus
                                    type="text"
                                    value={manualValue}
                                    onChange={(e) => setManualValue(e.target.value)}
                                    placeholder="Ej. 12%"
                                    className="flex-1 bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-black text-[#003366] outline-none focus:ring-2 focus:ring-[#FFCC00]"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleUpdateIncrement(ev.id!, manualValue.includes('%') ? manualValue : `${manualValue}%`);
                                      if (e.key === 'Escape') setEditingId(null);
                                    }}
                                  />
                                  <button 
                                    onClick={() => handleUpdateIncrement(ev.id!, manualValue.includes('%') ? manualValue : `${manualValue}%`)}
                                    className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700"
                                  >
                                    ✓
                                  </button>
                                  <button 
                                    onClick={() => setEditingId(null)}
                                    className="bg-slate-300 text-white p-2 rounded-xl hover:bg-slate-400"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : !ev.incrementoSalarial ? (
                                <div className="flex flex-col gap-2">
                                    <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100 mb-1">
                                      <p className="text-[8px] font-black text-blue-600 uppercase">Sugerido:</p>
                                      <p className="text-xs font-black text-[#003366]">{scoreNum >= 80 ? suggestion : 'No califica'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <button 
                                          onClick={() => handleUpdateIncrement(ev.id!, suggestion)}
                                          className="flex-1 bg-emerald-600 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10"
                                      >
                                          Aprobar
                                      </button>
                                      <button 
                                          onClick={() => {
                                            setEditingId(ev.id!);
                                            setManualValue(suggestion);
                                          }}
                                          className="flex-1 bg-white border-2 border-[#003366] text-[#003366] px-3 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-slate-50 transition-all"
                                      >
                                          Manual
                                      </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                   <div className="px-4 py-2 bg-emerald-50 border-2 border-emerald-500 rounded-xl shadow-inner group-hover:scale-105 transition-transform">
                                     <span className="text-lg font-black text-emerald-700">{ev.incrementoSalarial}</span>
                                   </div>
                                   <div className="flex flex-col gap-1">
                                     <button 
                                        onClick={() => {
                                          setEditingId(ev.id!);
                                          setManualValue(ev.incrementoSalarial || '');
                                        }}
                                        className="text-[7px] font-black text-indigo-400 hover:text-indigo-600 uppercase px-2 py-1 rounded-lg border border-slate-100 transition-all"
                                     >
                                        Editar
                                     </button>
                                     <button 
                                        onClick={() => { if(confirm("¿Resetear aprobación?")) handleUpdateIncrement(ev.id!, '') }}
                                        className="text-[7px] font-black text-rose-400 hover:text-rose-600 uppercase px-2 py-1 rounded-lg border border-slate-100 transition-all"
                                     >
                                        Reset
                                     </button>
                                   </div>
                                </div>
                            )}
                          </td>
                        )}

                        {isAuthorizedManager && (
                          <td className="px-8 py-5 border-r border-slate-100">
                            <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase shadow-sm border ${
                              ev.condicionBono === BonusStatus.Approved ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                              ev.condicionBono === BonusStatus.PendingAuth ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                              {ev.condicionBono}
                            </span>
                          </td>
                        )}

                        {isAuthorizedManager && (
                          <td className="px-8 py-5">
                            <div className="flex flex-col items-center">
                                {ev.authorizedBy ? (
                                  <div className="flex items-center gap-2 text-emerald-600 font-black uppercase text-[10px]">
                                     <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <span className="text-xs">✓</span>
                                     </div>
                                     <span className="truncate max-w-[80px]">{ev.authorizedBy.split(' ')[0]}</span>
                                  </div>
                                ) : (
                                  <span className="opacity-30 text-slate-400 font-black uppercase italic text-[9px] tracking-widest">Pendiente</span>
                                )}
                                <span className="text-[7px] text-slate-300 font-bold uppercase mt-1">Sup: {ev.evaluador.split(' ')[0]}</span>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-24 grid grid-cols-3 gap-20 print:flex hidden">
             <div className="border-t-4 border-slate-800 text-center pt-4">
                <p className="text-xs font-black uppercase text-slate-800 leading-none">Jacquelin Naim</p>
                <p className="text-[9px] font-bold uppercase text-slate-500 mt-1">Gerencia Administrativa</p>
             </div>
             <div className="border-t-4 border-slate-800 text-center pt-4">
                <p className="text-xs font-black uppercase text-slate-800 leading-none">Xuezhi Jin</p>
                <p className="text-[9px] font-bold uppercase text-slate-500 mt-1">Dirección General</p>
             </div>
             <div className="border-t-4 border-slate-800 text-center pt-4">
                <p className="text-xs font-black uppercase text-slate-800 leading-none">Aurelio Cuya</p>
                <p className="text-[9px] font-bold uppercase text-slate-500 mt-1">Gerencia Operaciones</p>
             </div>
          </div>
        </div>

        <div className="p-8 border-t bg-slate-50 flex justify-center gap-6 print:hidden">
          <button 
            disabled={filteredEvals.length === 0}
            onClick={() => window.print()} 
            className={`px-16 py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl transition-all ${
              filteredEvals.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#003366] text-white hover:scale-105 active:scale-95 hover:bg-[#002244]'
            }`}
          >
            🖨 {t('export_pdf', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
