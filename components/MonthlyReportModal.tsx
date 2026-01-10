
import React, { useState, useMemo, useEffect } from 'react';
import { FullEvaluation, Employee, BonusStatus, UserRole, SALARY_APPROVERS, Department } from '../types';
import { t, Language } from '../services/translations';
import { VulcanDB } from '../services/storageService';

interface MonthlyReportModalProps {
  evaluations: FullEvaluation[];
  employees: Employee[];
  onClose: () => void;
  onUpdateEvaluations?: (evals: FullEvaluation[]) => void;
  currentUserRole?: UserRole;
  currentUserUsername?: string;
  lang: Language;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MONTHS_EN = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

export default function MonthlyReportModal({ 
  evaluations, 
  employees, 
  onClose, 
  onUpdateEvaluations,
  currentUserRole, 
  currentUserUsername, 
  lang 
}: MonthlyReportModalProps) {
  const now = new Date();
  const currentMonthName = MESES[now.getMonth()];
  const currentYearStr = now.getFullYear().toString();
  
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthName);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);
  const [filterEvaluator, setFilterEvaluator] = useState<string>('all');
  const [filterManager, setFilterManager] = useState<string>('all');
  const [localEvaluations, setLocalEvaluations] = useState<FullEvaluation[]>(evaluations);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState<string>('');

  const isGerente = currentUserRole === UserRole.Gerente;
  const isRRHH = currentUserRole === UserRole.RRHH;
  
  const isAuthorizedManager = useMemo(() => 
    isGerente || (currentUserUsername && SALARY_APPROVERS.some(name => currentUserUsername.toLowerCase().trim() === name.toLowerCase().trim())), 
    [currentUserUsername, isGerente]
  );

  useEffect(() => {
    setLocalEvaluations(evaluations);
  }, [evaluations]);

  const availableYears = useMemo<string[]>(() => {
    const yearsFromData = localEvaluations.map((e: FullEvaluation) => e.año);
    const years = Array.from(new Set([...yearsFromData, currentYearStr]));
    return years.sort((a, b) => parseInt(b) - parseInt(a));
  }, [localEvaluations, currentYearStr]);

  const evaluatorsList = useMemo(() => {
    const names = Array.from(new Set(localEvaluations.map(e => e.evaluador)));
    return names.sort();
  }, [localEvaluations]);

  const managersList = useMemo(() => {
    const names = Array.from(new Set(localEvaluations.filter(e => e.authorizedBy).map(e => e.authorizedBy!)));
    return names.sort();
  }, [localEvaluations]);

  const filteredEvals = useMemo<FullEvaluation[]>(() => {
    let result = localEvaluations.filter((e: FullEvaluation) => 
      e.mes.toLowerCase().trim() === selectedMonth.toLowerCase().trim() && 
      e.año.toString() === selectedYear.toString()
    );

    if (filterEvaluator !== 'all') {
      result = result.filter(e => e.evaluador === filterEvaluator);
    }

    if (filterManager !== 'all') {
      result = result.filter(e => e.authorizedBy === filterManager);
    }

    const uniqueEvaluationsMap = new Map<string, FullEvaluation>();
    result.forEach(ev => {
      uniqueEvaluationsMap.set(ev.employeeId, ev);
    });

    return Array.from(uniqueEvaluationsMap.values());
  }, [localEvaluations, selectedMonth, selectedYear, filterEvaluator, filterManager]);

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
                authorizedBy: currentUserUsername || 'GERENTE',
                condicionBono: (increment === '0%' || !increment) ? BonusStatus.NotApproved : BonusStatus.Approved,
                recomendacionSalarial: (increment === '0%' || !increment) ? "Sin Incremento" : "Bono Aprobado por Gerencia"
            };
        }
        return ev;
    });

    setLocalEvaluations(updated);
    await VulcanDB.saveEvaluations(updated);
    if (onUpdateEvaluations) {
      onUpdateEvaluations(updated);
    }
    setEditingId(null);
  };

  const handlePrint = () => {
    if (filteredEvals.length > 0) {
      window.print();
    }
  };

  const handleExportExcel = () => {
    if (filteredEvals.length === 0) return;
    const headers = ["Empleado", "Cedula", "Departamento", "Estado Bono", "Bono Asignado", "Autorizado Por", "Evaluador"];
    const rows = filteredEvals.map(ev => {
      const emp = employees.find(e => e.id === ev.employeeId);
      return [
        emp?.name || 'N/A',
        emp?.idNumber || 'N/A',
        emp?.department || 'N/A',
        ev.condicionBono,
        ev.incrementoSalarial || '0%',
        ev.authorizedBy || 'Pendiente',
        ev.evaluador
      ];
    });
    const csvContent = "\uFEFF" + [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(";")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Bonos_Vulcan_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#001a33]/90 backdrop-blur-md p-4 print:bg-white print:p-0 print:block print:static">
      <div className="bg-white lg:rounded-[40px] shadow-2xl max-w-7xl w-full h-full lg:h-auto lg:max-h-[95vh] flex flex-col overflow-hidden border-2 border-[#FFCC00]/20 print:shadow-none print:border-none print:max-h-none print:h-auto print:overflow-visible print:block">
        
        <div className="p-8 border-b flex flex-col gap-6 print:hidden">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#003366] text-[#FFCC00] rounded-2xl flex items-center justify-center font-black shadow-xl">📊</div>
              <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{isRRHH ? "Reporte Global RRHH" : t('consolidated_report', lang)}</h2>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {isRRHH ? 'PERFIL RRHH: ACCESO TOTAL' : (isAuthorizedManager ? 'MODO GERENCIA: AUTORIZADO' : 'VISTA DE CONSULTA')}
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

              <button onClick={onClose} className="md:hidden w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shadow-inner border border-slate-100">✕</button>
            </div>
            <button onClick={onClose} className="hidden md:flex w-14 h-14 rounded-2xl bg-slate-50 items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shadow-inner border border-slate-100">✕</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Filtrar por Evaluador (Supervisor)</label>
              <select 
                value={filterEvaluator} 
                onChange={(e) => setFilterEvaluator(e.target.value)}
                className="w-full px-5 py-3 border-2 border-white rounded-xl text-[10px] font-bold text-[#003366] outline-none focus:border-[#003366] bg-white shadow-sm"
              >
                <option value="all">TODOS LOS EVALUADORES</option>
                {evaluatorsList.map(name => <option key={name} value={name}>{name.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Filtrar por Gerente (Ponderación)</label>
              <select 
                value={filterManager} 
                onChange={(e) => setFilterManager(e.target.value)}
                className="w-full px-5 py-3 border-2 border-white rounded-xl text-[10px] font-bold text-[#003366] outline-none focus:border-[#003366] bg-white shadow-sm"
              >
                <option value="all">TODAS LAS PONDERACIONES</option>
                {managersList.map(name => <option key={name} value={name}>{name.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-12 print:p-0 print:overflow-visible print:block">
          <div className="flex flex-col sm:flex-row justify-between items-center border-b-8 border-[#003366] pb-8 print:border-b-4">
            <div className="flex items-center gap-6">
               <div className="bg-[#003366] p-4 rounded-3xl text-[#FFCC00] font-black text-2xl shadow-2xl print:shadow-none print:p-2 print:text-lg">VULCAN</div>
               <div>
                  <h1 className="text-4xl font-black text-[#003366] tracking-tighter uppercase print:text-2xl">Gestión de Bonos y Desempeño</h1>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] print:text-[8px]">VULCAN ENERGY TECHNOLOGY VENEZOLANA C.A.</p>
               </div>
            </div>
            <div className="text-right bg-[#FFCC00] p-6 rounded-3xl shadow-xl border-b-4 border-amber-500 print:shadow-none print:p-4 print:border-b-2">
              <p className="text-[9px] font-black text-[#003366] uppercase tracking-widest mb-1 print:text-[7px]">{t('period_reported', lang)}</p>
              <p className="text-2xl font-black text-[#003366] uppercase leading-none print:text-xl">{selectedMonth} {selectedYear}</p>
            </div>
          </div>

          {filteredEvals.length === 0 ? (
            <div className="text-center py-32 bg-slate-50 rounded-[40px] border-4 border-dashed border-slate-100 print:border-none print:py-10">
               <p className="text-slate-300 font-black uppercase text-xs tracking-[0.4em]">{t('no_records_period', lang)}</p>
            </div>
          ) : (
            <div className="overflow-x-auto border-2 border-slate-50 rounded-[40px] shadow-sm print:border-none print:shadow-none print:overflow-visible">
              <table className="w-full text-left text-[11px] print:text-[10px]">
                <thead className="bg-[#003366] text-white">
                  <tr>
                    <th className="px-8 py-6 font-black uppercase tracking-widest border-r border-white/5 print:px-4 print:py-3 w-1/4">{t('employee', lang)}</th>
                    {(isGerente || isRRHH || isAuthorizedManager) && <th className="px-8 py-6 font-black uppercase tracking-widest border-r border-white/5 print:px-4 print:py-3 w-1/4">Estado / Aprobación</th>}
                    {isAuthorizedManager && <th className="px-8 py-6 font-black uppercase tracking-widest border-r border-white/5 print:hidden w-1/4">Acciones Gerenciales</th>}
                    {(isGerente || isRRHH || isAuthorizedManager) && <th className="px-8 py-6 font-black uppercase tracking-widest text-center print:px-4 print:py-3 w-1/4">Autorizado Por</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEvals.map((ev, idx) => {
                    const emp = employees.find(e => e.id === ev.employeeId);
                    const scoreNum = ev.promedioFinal * 20;
                    const suggestion = getSuggestedIncrement(scoreNum);
                    const isEditingThis = editingId === ev.id;

                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-all group print:bg-white">
                        <td className="px-8 py-5 border-r border-slate-100 print:px-4 print:py-3">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 print:hidden">
                               <img src={emp?.photo} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                            </div>
                            <div>
                               <p className="font-black text-[#003366] uppercase text-xs print:text-[10px]">{emp?.name || 'N/A'}</p>
                               <p className="text-[9px] text-slate-400 font-bold uppercase print:text-[8px]">V-{emp?.idNumber || 'N/A'} • {emp?.department}</p>
                            </div>
                          </div>
                        </td>
                        
                        {(isGerente || isRRHH || isAuthorizedManager) && (
                          <td className="px-8 py-5 border-r border-slate-100 print:px-4 print:py-3">
                            <div className="flex flex-col gap-2">
                                <span className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase shadow-sm border text-center print:px-2 print:py-1 print:border-none print:shadow-none ${
                                  ev.condicionBono === BonusStatus.Approved ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                  ev.condicionBono === BonusStatus.PendingAuth ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                                }`}>
                                  {ev.condicionBono}
                                </span>
                                {ev.incrementoSalarial && (
                                  <p className="text-center font-black text-[#003366] print:text-[9px]">Bono: {ev.incrementoSalarial}</p>
                                )}
                            </div>
                          </td>
                        )}

                        {isAuthorizedManager && (
                          <td className="px-8 py-5 border-r border-slate-100 min-w-[240px] print:hidden">
                            {isEditingThis ? (
                              <div className="flex flex-col gap-2 p-2 bg-amber-50 rounded-2xl border-2 border-amber-200">
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

                        {(isGerente || isRRHH || isAuthorizedManager) && (
                          <td className="px-8 py-5 print:px-4 print:py-3">
                            <div className="flex flex-col items-center">
                                {ev.authorizedBy ? (
                                  <div className="flex items-center gap-2 text-emerald-600 font-black uppercase text-[10px] print:text-[8px]">
                                     <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center print:hidden">
                                        <span className="text-xs">✓</span>
                                     </div>
                                     <span className="truncate max-w-[80px]">{ev.authorizedBy.split(' ')[0]}</span>
                                  </div>
                                ) : (
                                  <span className="opacity-30 text-slate-400 font-black uppercase italic text-[9px] tracking-widest print:text-[8px]">Pendiente</span>
                                )}
                                <span className="text-[7px] text-slate-300 font-bold uppercase mt-1 print:text-[6px]">Sup: {ev.evaluador.split(' ')[0]}</span>
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

          <div className="pt-24 grid grid-cols-3 gap-20 print:grid hidden">
             <div className="border-t-2 border-slate-800 text-center pt-4">
                <p className="text-[10px] font-black uppercase text-slate-800 leading-none">Jacquelin Naim</p>
                <p className="text-[8px] font-bold uppercase text-slate-500 mt-1">Gerencia Administrativa</p>
             </div>
             <div className="border-t-2 border-slate-800 text-center pt-4">
                <p className="text-[10px] font-black uppercase text-slate-800 leading-none">Xuezhi Jin</p>
                <p className="text-[8px] font-bold uppercase text-slate-500 mt-1">Dirección General</p>
             </div>
             <div className="border-t-2 border-slate-800 text-center pt-4">
                <p className="text-[10px] font-black uppercase text-slate-800 leading-none">Aurelio Cuya</p>
                <p className="text-[8px] font-bold uppercase text-slate-500 mt-1">Gerencia Operaciones</p>
             </div>
          </div>
        </div>

        <div className="p-8 border-t bg-slate-50 flex justify-center gap-4 print:hidden">
          <button 
            disabled={filteredEvals.length === 0}
            onClick={handleExportExcel} 
            className={`px-10 py-5 rounded-3xl font-black uppercase tracking-[0.1em] text-[10px] shadow-xl transition-all flex items-center gap-3 ${
              filteredEvals.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50' : 'bg-emerald-600 text-white hover:scale-105 active:scale-95 hover:bg-emerald-700'
            }`}
          >
            📊 {t('export_excel', lang)}
          </button>
          
          <button 
            disabled={filteredEvals.length === 0}
            onClick={handlePrint} 
            className={`px-10 py-5 rounded-3xl font-black uppercase tracking-[0.1em] text-[10px] shadow-xl transition-all flex items-center gap-3 ${
              filteredEvals.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-50' : 'bg-[#003366] text-white hover:scale-105 active:scale-95 hover:bg-[#002244]'
            }`}
          >
            🖨 {t('export_pdf', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
