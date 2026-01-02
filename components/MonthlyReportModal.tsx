
import React, { useState, useMemo } from 'react';
import { FullEvaluation, Employee, BonusStatus, UserRole } from '../types';
import { t, Language } from '../services/translations';

interface MonthlyReportModalProps {
  evaluations: FullEvaluation[];
  employees: Employee[];
  onClose: () => void;
  currentUserRole?: UserRole;
  lang: Language;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MONTHS_EN = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

export default function MonthlyReportModal({ evaluations, employees, onClose, currentUserRole, lang }: MonthlyReportModalProps) {
  const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long' }).toLowerCase();
  const currentYearStr = new Date().getFullYear().toString();
  
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthName);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);

  const isDirector = currentUserRole === UserRole.Director;

  const availableYears = useMemo<string[]>(() => {
    const yearsFromData = evaluations.map((e: FullEvaluation) => e.año);
    const years = Array.from(new Set([...yearsFromData, currentYearStr]));
    return years.sort((a, b) => parseInt(b) - parseInt(a));
  }, [evaluations, currentYearStr]);

  const filteredEvals = useMemo<FullEvaluation[]>(() => {
    return evaluations.filter((e: FullEvaluation) => 
      e.mes.toLowerCase() === selectedMonth.toLowerCase() && 
      e.año === selectedYear
    );
  }, [evaluations, selectedMonth, selectedYear]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#001a33]/90 backdrop-blur-md p-4 print:bg-white print:p-0">
      <div className="bg-white lg:rounded-[40px] shadow-2xl max-w-6xl w-full h-full lg:h-auto lg:max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="p-8 border-b flex flex-col md:flex-row justify-between items-center gap-6 print:hidden">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight shrink-0">{t('consolidated_report', lang)}</h2>
          
          <div className="flex flex-wrap justify-center gap-3">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border-2 border-slate-100 rounded-xl text-xs font-black uppercase text-[#003366] outline-none focus:border-[#003366] cursor-pointer bg-slate-50"
            >
              {MESES.map((m, i) => <option key={m} value={m}>{lang === 'es' ? m.toUpperCase() : MONTHS_EN[i].toUpperCase()}</option>)}
            </select>
            
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border-2 border-slate-100 rounded-xl text-xs font-black uppercase text-[#003366] outline-none focus:border-[#003366] cursor-pointer bg-slate-50"
            >
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-10">
          <div className="flex flex-col sm:flex-row justify-between items-center border-b-4 border-[#FFCC00] pb-6">
            <h1 className="text-3xl font-black text-[#003366]">VULCAN ENERGY</h1>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('period_reported', lang)}</p>
              <p className="text-lg font-black text-[#003366] uppercase">{selectedMonth} {selectedYear}</p>
            </div>
          </div>

          {filteredEvals.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
               <p className="text-slate-400 font-black uppercase text-xs tracking-widest">{t('no_records_period', lang)}</p>
            </div>
          ) : (
            <div className="overflow-x-auto border-2 border-slate-50 rounded-3xl">
              <table className="w-full text-left text-[10px]">
                <thead className="bg-slate-50 border-b-2 border-slate-100">
                  <tr>
                    <th className="px-6 py-5 font-black text-slate-400 uppercase">{t('employee', lang)}</th>
                    <th className="px-6 py-5 font-black text-slate-400 uppercase text-center">{t('technical_efficiency', lang)}</th>
                    {isDirector && <th className="px-6 py-5 font-black text-slate-400 uppercase">{t('adjust_increment', lang).split('(')[0]}</th>}
                    {isDirector && <th className="px-6 py-5 font-black text-slate-400 uppercase">{t('performance', lang)}</th>}
                    {isDirector && <th className="px-6 py-5 font-black text-slate-400 uppercase">{t('sign', lang)}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredEvals.map((ev, idx) => {
                    const emp = employees.find(e => e.id === ev.employeeId);
                    const scoreNum = ev.promedioFinal * 20;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-black text-[#003366] uppercase">{emp?.name || 'N/A'}</p>
                          <p className="text-[9px] text-slate-400 font-bold">V-{emp?.idNumber || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4 text-center font-black text-indigo-600">{scoreNum.toFixed(1)}%</td>
                        {isDirector && (
                          <td className="px-6 py-4 font-black text-emerald-600">
                            {ev.incrementoSalarial || "0%"}
                          </td>
                        )}
                        {isDirector && (
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                              ev.condicionBono === BonusStatus.Approved ? 'bg-emerald-100 text-emerald-700' : 
                              ev.condicionBono === BonusStatus.PendingAuth ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {ev.condicionBono}
                            </span>
                          </td>
                        )}
                        {isDirector && (
                          <td className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase italic">
                            {ev.authorizedBy ? (
                              <span className="text-emerald-600">✓ {ev.authorizedBy}</span>
                            ) : (
                              <span className="opacity-40">{t('pending_signs', lang)}</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-20 grid grid-cols-2 gap-20 print:flex hidden">
             <div className="border-t-2 border-slate-800 text-center pt-2">
                <p className="text-[10px] font-black uppercase">{t('hr_sign', lang)}</p>
             </div>
             <div className="border-t-2 border-slate-800 text-center pt-2">
                <p className="text-[10px] font-black uppercase">{t('op_manager_sign', lang)}</p>
             </div>
          </div>
        </div>

        <div className="p-8 border-t bg-slate-50 flex justify-center gap-4 print:hidden">
          <button 
            disabled={filteredEvals.length === 0}
            onClick={() => window.print()} 
            className={`px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl transition-all ${
              filteredEvals.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#003366] text-white hover:scale-105 active:scale-95'
            }`}
          >
            🖨 {t('export_pdf', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
