
import React, { useState, useMemo } from 'react';
import { FullEvaluation, Employee, BonusStatus, BONUS_APPROVER } from '../types';

interface MonthlyReportModalProps {
  evaluations: FullEvaluation[];
  employees: Employee[];
  onClose: () => void;
}

const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({ evaluations, employees, onClose }) => {
  const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long' }).toLowerCase();
  const currentYearStr = new Date().getFullYear().toString();

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthName);
  const [selectedYear, setSelectedYear] = useState<string>(currentYearStr);

  // Agrupar meses y años únicos presentes en el historial para los selectores
  const availableYears = useMemo<string[]>(() => {
    /**
     * Fix for error on line 22: explicitly type map callback to avoid 'unknown' inference.
     */
    const years = Array.from(new Set(evaluations.map((e: FullEvaluation) => e.año)));
    if (!years.includes(currentYearStr)) years.push(currentYearStr);
    return years.sort((a: string, b: string) => parseInt(b) - parseInt(a));
  }, [evaluations, currentYearStr]);

  const availableMonths = useMemo<string[]>(() => {
    // Filtrar meses que tienen evaluaciones en el año seleccionado
    const monthsInYear = Array.from(new Set(
      evaluations
        .filter((e: FullEvaluation) => e.año === selectedYear)
        .map((e: FullEvaluation) => e.mes.toLowerCase())
    ));
    
    // Asegurar que al menos el mes actual esté si no hay datos
    if (monthsInYear.length === 0 && selectedYear === currentYearStr) {
      monthsInYear.push(currentMonthName);
    }
    
    return monthsInYear;
  }, [evaluations, selectedYear, currentMonthName, currentYearStr]);

  // Filtrar evaluaciones por mes Y año seleccionados
  const filteredEvals = useMemo<FullEvaluation[]>(() => {
    return evaluations.filter((e: FullEvaluation) => 
      e.mes.toLowerCase() === selectedMonth && 
      e.año === selectedYear
    );
  }, [evaluations, selectedMonth, selectedYear]);

  // Estadísticas del periodo seleccionado
  const stats = useMemo(() => {
    if (filteredEvals.length === 0) return null;
    
    const avgScore = filteredEvals.reduce((acc, e) => acc + (e.promedioFinal * 20), 0) / filteredEvals.length;
    const approvedBonuses = filteredEvals.filter(e => e.condicionBono === BonusStatus.Approved).length;
    const pendingAuths = filteredEvals.filter(e => e.condicionBono === BonusStatus.PendingAuth).length;
    const notApprovedBonuses = filteredEvals.filter(e => e.condicionBono === BonusStatus.NotApproved).length;
    
    return { avgScore, approvedBonuses, pendingAuths, notApprovedBonuses, total: filteredEvals.length };
  }, [filteredEvals]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#001a33]/90 backdrop-blur-md p-0 lg:p-4 print:bg-white print:p-0 print:block">
      <div className="bg-white lg:rounded-[40px] shadow-2xl max-w-7xl w-full h-full lg:h-auto lg:max-h-[95vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Cabecera del Modal (No se imprime) */}
        <div className="p-5 lg:p-8 border-b flex justify-between items-center bg-white z-10 print:hidden">
          <div>
            <h2 className="text-lg lg:text-2xl font-black text-slate-800 uppercase tracking-tight">Reportes Vulcan</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Consolidado Mensual de Desempeño</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 lg:w-12 lg:h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">✕</button>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Selectores de Periodo (No se imprime) */}
          <div className="p-5 lg:p-8 bg-slate-50 border-b space-y-4 print:hidden">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex flex-col space-y-3 shrink-0">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Ciclo Fiscal</span>
                <div className="flex flex-wrap gap-2">
                  {availableYears.map(y => (
                    <button
                      key={y}
                      onClick={() => setSelectedYear(y)}
                      className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${selectedYear === y ? 'bg-[#003366] text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col space-y-3 flex-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Meses con Actividad</span>
                <div className="flex flex-wrap gap-2">
                  {availableMonths.length > 0 ? availableMonths.map(m => (
                    <button
                      key={m}
                      onClick={() => setSelectedMonth(m)}
                      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedMonth === m ? 'bg-[#FFCC00] text-[#003366] shadow-md' : 'bg-white text-slate-400 border border-slate-200'}`}
                    >
                      {m}
                    </button>
                  )) : (
                    <span className="text-[10px] text-slate-400 font-black uppercase">Sin registros en el año seleccionado</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contenido del Reporte */}
          <div id="printable-report" className="p-6 lg:p-12 space-y-8 lg:space-y-10 print:p-0 print:space-y-8">
            
            {/* Encabezado Profesional Vulcan (VISIBLE EN IMPRESIÓN) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-[#FFCC00] pb-6 gap-4">
              <div>
                <h1 className="text-xl lg:text-3xl font-black text-[#003366] tracking-tighter">VULCAN ENERGY TECHNOLOGY</h1>
                <p className="text-[9px] lg:text-xs font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Reporte Oficial de Eficiencia Operativa</p>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto p-4 bg-slate-50 lg:bg-transparent rounded-2xl">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Periodo Reportado</p>
                <p className="text-lg lg:text-xl font-black text-[#003366] uppercase">{selectedMonth} {selectedYear}</p>
              </div>
            </div>

            {!stats ? (
              <div className="py-20 text-center space-y-4">
                <div className="text-5xl opacity-20">📊</div>
                <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest px-10">No existen registros autorizados para este periodo de tiempo</h3>
              </div>
            ) : (
              <>
                {/* Grid de Estadísticas Rápidas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[#003366] p-6 rounded-3xl text-white">
                    <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">Personal Evaluado</p>
                    <p className="text-3xl lg:text-4xl font-black mt-1">{stats.total}</p>
                  </div>
                  <div className="bg-indigo-50 p-6 rounded-3xl border-2 border-indigo-100">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Score del Grupo</p>
                    <p className="text-3xl lg:text-4xl font-black text-indigo-600 mt-1">{stats.avgScore.toFixed(1)}%</p>
                  </div>
                  <div className="bg-emerald-50 p-6 rounded-3xl border-2 border-emerald-100">
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Bonos Activos</p>
                    <p className="text-3xl lg:text-4xl font-black text-emerald-600 mt-1">{stats.approvedBonuses}</p>
                  </div>
                  <div className="bg-rose-50 p-6 rounded-3xl border-2 border-rose-100">
                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Sin Beneficio</p>
                    <p className="text-3xl lg:text-4xl font-black text-rose-600 mt-1">{stats.notApprovedBonuses}</p>
                  </div>
                </div>

                {/* Listado Completo de Evaluaciones */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-[#FFCC00] rounded-full"></span>
                    Relación Detallada de Nómina y Resultados de Desempeño
                  </h4>
                  <div className="overflow-x-auto border-2 border-slate-50 rounded-3xl bg-white shadow-sm mt-4">
                    <table className="w-full text-left text-[10px] min-w-[700px]">
                      <thead className="bg-slate-50 border-b-2 border-slate-100">
                        <tr>
                          <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest">Identidad Vulcan</th>
                          <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest text-center">Rendimiento</th>
                          <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest">Dictamen Bono</th>
                          <th className="px-6 py-5 font-black text-slate-400 uppercase tracking-widest">Validación Dirección</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredEvals.map((ev, idx) => {
                          const emp = employees.find(e => e.id === ev.employeeId);
                          const scoreNum = ev.promedioFinal * 20;
                          const isFailed = scoreNum < 80;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4">
                                 <p className="font-black text-[#003366] uppercase text-xs">{emp?.name || 'REGISTRO ELIMINADO'}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">V-{emp?.idNumber} | {emp?.role}</p>
                              </td>
                              <td className="px-6 py-4 text-center">
                                 <span className={`px-4 py-1.5 rounded-full font-black ${isFailed ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                   {scoreNum.toFixed(1)}%
                                 </span>
                              </td>
                              <td className="px-6 py-4">
                                 <span className={`text-[9px] font-black uppercase px-4 py-2 rounded-2xl border-2 ${
                                   ev.condicionBono === BonusStatus.Approved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                   ev.condicionBono === BonusStatus.PendingAuth ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                   ev.condicionBono === BonusStatus.NotApproved ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                   'bg-slate-50 text-slate-400 border-slate-100'
                                 }`}>
                                   {ev.condicionBono}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase italic opacity-60">
                                 {isFailed ? "INSUFICIENTE" : (ev.authorizedBy ? `FIRMADO: ${ev.authorizedBy}` : "ESPERANDO FIRMA")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Firmas (VISIBLE SOLO EN IMPRESIÓN) */}
                <div className="hidden print:grid grid-cols-2 gap-20 pt-20">
                  <div className="border-t-4 border-[#003366] text-center pt-4">
                    <p className="text-[10px] font-black uppercase text-slate-800">Coordinación Operativa</p>
                    <p className="text-[8px] text-slate-400 uppercase mt-1 tracking-widest font-black">CONTROL TÉCNICO VULCAN</p>
                  </div>
                  <div className="border-t-4 border-[#003366] text-center pt-4">
                    <p className="text-[10px] font-black uppercase text-slate-800">{BONUS_APPROVER}</p>
                    <p className="text-[8px] text-slate-400 uppercase mt-1 tracking-widest font-black">DIRECCIÓN GENERAL VULCAN</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer del Modal (No se imprime) */}
        <div className="p-6 lg:p-8 border-t bg-white flex flex-col sm:flex-row justify-center gap-4 sticky bottom-0 z-10 print:hidden shadow-inner">
          {stats && (
            <button 
              onClick={() => window.print()}
              className="w-full sm:w-auto bg-[#003366] text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center text-[10px]"
            >
              <span className="mr-3 text-lg">🖨</span>
              EXPORTAR DOCUMENTO PDF
            </button>
          )}
          <button 
            onClick={onClose}
            className="sm:hidden w-full py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReportModal;
