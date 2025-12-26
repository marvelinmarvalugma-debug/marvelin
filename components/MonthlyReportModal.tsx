
import React, { useState, useMemo } from 'react';
import { FullEvaluation, Employee, BonusStatus, BONUS_APPROVER } from '../types';

interface MonthlyReportModalProps {
  evaluations: FullEvaluation[];
  employees: Employee[];
  onClose: () => void;
}

export default function MonthlyReportModal({ evaluations, employees, onClose }: MonthlyReportModalProps) {
  const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long' }).toLowerCase();
  const currentYearStr = new Date().getFullYear().toString();
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthName);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);

  const availableYears = useMemo<string[]>(() => {
    const years = Array.from(new Set(evaluations.map((e: FullEvaluation) => e.año)));
    if (!years.includes(currentYearStr)) years.push(currentYearStr);
    return years.sort((a, b) => parseInt(b) - parseInt(a));
  }, [evaluations, currentYearStr]);

  const filteredEvals = useMemo<FullEvaluation[]>(() => {
    return evaluations.filter((e: FullEvaluation) => e.mes.toLowerCase() === selectedMonth && e.año === selectedYear);
  }, [evaluations, selectedMonth, selectedYear]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#001a33]/90 backdrop-blur-md p-4 print:bg-white print:p-0">
      <div className="bg-white lg:rounded-[40px] shadow-2xl max-w-6xl w-full h-full lg:h-auto lg:max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-8 border-b flex justify-between items-center print:hidden">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Reporte Consolidado</h2>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-10">
          <div className="flex flex-col sm:flex-row justify-between items-center border-b-4 border-[#FFCC00] pb-6">
            <h1 className="text-3xl font-black text-[#003366]">VULCAN ENERGY</h1>
            <div className="text-right"><p className="text-lg font-black text-[#003366] uppercase">{selectedMonth} {selectedYear}</p></div>
          </div>
          <div className="overflow-x-auto border-2 border-slate-50 rounded-3xl">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-50 border-b-2 border-slate-100">
                <tr>
                  <th className="px-6 py-5 font-black text-slate-400 uppercase">Personal</th>
                  <th className="px-6 py-5 font-black text-slate-400 uppercase text-center">Score Técnico</th>
                  <th className="px-6 py-5 font-black text-slate-400 uppercase">Estatus Bono</th>
                  <th className="px-6 py-5 font-black text-slate-400 uppercase">Firma Dirección</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredEvals.map((ev, idx) => {
                  const emp = employees.find(e => e.id === ev.employeeId);
                  const scoreNum = ev.promedioFinal * 20;
                  return (
                    <tr key={idx}>
                      <td className="px-6 py-4"><p className="font-black text-[#003366] uppercase">{emp?.name}</p><p className="text-[9px] text-slate-400">V-{emp?.idNumber}</p></td>
                      <td className="px-6 py-4 text-center font-black">{scoreNum.toFixed(1)}%</td>
                      <td className="px-6 py-4 font-black uppercase text-[9px]">{ev.condicionBono}</td>
                      <td className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase italic opacity-60">{ev.authorizedBy ? `Firmado: ${ev.authorizedBy}` : "Esperando Firma"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="p-8 border-t bg-white flex justify-center gap-4 print:hidden">
          <button onClick={() => window.print()} className="bg-[#003366] text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px]">🖨 Exportar PDF</button>
        </div>
      </div>
    </div>
  );
}
