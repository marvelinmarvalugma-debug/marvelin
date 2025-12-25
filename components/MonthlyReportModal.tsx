
import React, { useState, useMemo } from 'react';
import { FullEvaluation, Employee, BonusStatus, BONUS_APPROVER } from '../types';

interface MonthlyReportModalProps {
  evaluations: FullEvaluation[];
  employees: Employee[];
  onClose: () => void;
}

const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({ evaluations, employees, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toLocaleString('es-ES', { month: 'long' }).toLowerCase());

  // Agrupar meses únicos presentes en el historial
  const availableMonths = useMemo(() => {
    const months = Array.from(new Set(evaluations.map(e => e.mes.toLowerCase())));
    if (months.length === 0) months.push(selectedMonth);
    return months;
  }, [evaluations]);

  // Filtrar evaluaciones por mes seleccionado
  const filteredEvals = useMemo(() => {
    return evaluations.filter(e => e.mes.toLowerCase() === selectedMonth);
  }, [evaluations, selectedMonth]);

  // Estadísticas del mes
  const stats = useMemo(() => {
    if (filteredEvals.length === 0) return null;
    
    const avgScore = filteredEvals.reduce((acc, e) => acc + (e.promedioFinal * 20), 0) / filteredEvals.length;
    const approvedBonuses = filteredEvals.filter(e => e.condicionBono === BonusStatus.Approved).length;
    const pendingAuths = filteredEvals.filter(e => e.condicionBono === BonusStatus.PendingAuth).length;
    
    const topEvaluations = [...filteredEvals].sort((a, b) => b.promedioFinal - a.promedioFinal).slice(0, 5);

    return { avgScore, approvedBonuses, pendingAuths, topEvaluations, total: filteredEvals.length };
  }, [filteredEvals]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#001a33]/80 backdrop-blur-md p-4 print:bg-white print:p-0 print:block">
      <div className="bg-white rounded-[40px] shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Cabecera del Modal (No se imprime) */}
        <div className="p-8 border-b flex justify-between items-center sticky top-0 bg-white z-10 print:hidden">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Centro de Reportes Vulcan</h2>
            <p className="text-sm text-slate-500 font-medium">Generación de estadísticas mensuales y consolidados PDF.</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">✕</button>
        </div>

        {/* Selector de Mes (No se imprime) */}
        <div className="p-8 bg-slate-50 flex flex-wrap gap-3 print:hidden">
          {availableMonths.map(m => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${selectedMonth === m ? 'bg-[#003366] text-white shadow-lg' : 'bg-white text-slate-400 border hover:border-[#003366] hover:text-[#003366]'}`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Contenido del Reporte */}
        <div id="printable-report" className="p-12 space-y-10 print:p-0 print:space-y-8">
          
          {/* Encabezado Profesional Vulcan (VISIBLE EN IMPRESIÓN) */}
          <div className="flex justify-between items-start border-b-4 border-[#FFCC00] pb-6">
            <div>
              <h1 className="text-3xl font-black text-[#003366] tracking-tighter">VULCAN ENERGY TECHNOLOGY</h1>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Reporte Consolidado de Desempeño Mensual</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase">Período Fiscal</p>
              <p className="text-xl font-black text-[#003366] uppercase">{selectedMonth} 2024</p>
            </div>
          </div>

          {!stats ? (
            <div className="py-20 text-center space-y-4">
              <div className="text-6xl grayscale">📊</div>
              <h3 className="text-xl font-bold text-slate-400 uppercase">No hay datos para el mes de {selectedMonth}</h3>
              <p className="text-sm text-slate-300">Realice evaluaciones en la sección 'Matriz Desempeño' para ver resultados aquí.</p>
            </div>
          ) : (
            <>
              {/* Grid de Estadísticas Rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#003366] p-6 rounded-3xl text-white shadow-xl shadow-blue-900/10">
                  <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">Total Evaluaciones</p>
                  <p className="text-4xl font-black mt-1">{stats.total}</p>
                </div>
                <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Promedio General</p>
                  <p className="text-4xl font-black text-indigo-600 mt-1">{stats.avgScore.toFixed(1)}%</p>
                </div>
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Bonos Aprobados</p>
                  <p className="text-4xl font-black text-emerald-600 mt-1">{stats.approvedBonuses}</p>
                </div>
                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                  <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Pendiente Firma</p>
                  <p className="text-4xl font-black text-amber-600 mt-1">{stats.pendingAuths}</p>
                </div>
              </div>

              {/* Top Performers del Mes */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
                  <span className="w-8 h-8 rounded-lg bg-[#FFCC00] flex items-center justify-center mr-3">🏆</span>
                  Top Desempeño Operativo
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {stats.topEvaluations.map((evalu, i) => {
                    const emp = employees.find(e => e.id === evalu.employeeId);
                    return (
                      <div key={i} className="bg-white border p-4 rounded-2xl text-center space-y-1">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-[10px] font-black text-slate-400 mb-2">{i+1}</div>
                        <p className="text-[10px] font-black text-slate-800 uppercase truncate">{emp?.name}</p>
                        <p className="text-[14px] font-black text-[#003366]">{(evalu.promedioFinal * 20).toFixed(1)}%</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Listado Completo de Evaluaciones */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Desglose Detallado</h4>
                <div className="border rounded-[32px] overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">Cédula</th>
                        <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">Trabajador</th>
                        <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">Cargo</th>
                        <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-center">Score</th>
                        <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">Bono</th>
                        <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">Evaluador</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredEvals.map((ev, idx) => {
                        const emp = employees.find(e => e.id === ev.employeeId);
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-500">V-{emp?.idNumber}</td>
                            <td className="px-6 py-4 font-black text-[#003366] uppercase">{emp?.name}</td>
                            <td className="px-6 py-4 text-slate-400 font-bold uppercase truncate max-w-[150px]">{emp?.role}</td>
                            <td className="px-6 py-4 text-center">
                               <span className={`px-2 py-1 rounded font-black ${ev.promedioFinal * 20 >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                 {(ev.promedioFinal * 20).toFixed(1)}%
                               </span>
                            </td>
                            <td className="px-6 py-4">
                               <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                                 ev.condicionBono === BonusStatus.Approved ? 'bg-emerald-50 text-emerald-600' :
                                 ev.condicionBono === BonusStatus.PendingAuth ? 'bg-amber-50 text-amber-600' :
                                 'bg-slate-50 text-slate-400'
                               }`}>
                                 {ev.condicionBono}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase">{ev.evaluador}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Firmas (VISIBLE SOLO EN IMPRESIÓN) */}
              <div className="hidden print:grid grid-cols-2 gap-20 pt-20">
                <div className="border-t border-slate-300 text-center pt-4">
                  <p className="text-[10px] font-black uppercase text-slate-800">Responsable Operativo</p>
                  <p className="text-[9px] text-slate-400 uppercase mt-1 tracking-widest">Sello y Firma de Campo</p>
                </div>
                <div className="border-t border-slate-300 text-center pt-4">
                  <p className="text-[10px] font-black uppercase text-slate-800">{BONUS_APPROVER}</p>
                  <p className="text-[9px] text-slate-400 uppercase mt-1 tracking-widest">Director General Vulcan</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer del Modal (No se imprime) */}
        {stats && (
          <div className="p-8 border-t bg-slate-50 flex justify-center sticky bottom-0 z-10 print:hidden">
            <button 
              onClick={() => window.print()}
              className="bg-[#003366] text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center"
            >
              <span className="mr-3 text-xl">PDF</span>
              GENERAR DOCUMENTO PDF OFICIAL 🖨
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyReportModal;
