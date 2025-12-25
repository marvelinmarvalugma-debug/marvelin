
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
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(evaluations.map(e => e.año)));
    if (!years.includes(currentYearStr)) years.push(currentYearStr);
    return years.sort((a, b) => parseInt(b) - parseInt(a));
  }, [evaluations, currentYearStr]);

  const availableMonths = useMemo(() => {
    // Filtrar meses que tienen evaluaciones en el año seleccionado
    const monthsInYear = Array.from(new Set(
      evaluations
        .filter(e => e.año === selectedYear)
        .map(e => e.mes.toLowerCase())
    ));
    
    // Asegurar que al menos el mes actual esté si no hay datos
    if (monthsInYear.length === 0 && selectedYear === currentYearStr) {
      monthsInYear.push(currentMonthName);
    }
    
    return monthsInYear;
  }, [evaluations, selectedYear, currentMonthName, currentYearStr]);

  // Filtrar evaluaciones por mes Y año seleccionados
  const filteredEvals = useMemo(() => {
    return evaluations.filter(e => 
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#001a33]/80 backdrop-blur-md p-4 print:bg-white print:p-0 print:block">
      <div className="bg-white rounded-[40px] shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Cabecera del Modal (No se imprime) */}
        <div className="p-8 border-b flex justify-between items-center sticky top-0 bg-white z-10 print:hidden">
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Reportes de Nómina Vulcan</h2>
            <p className="text-sm text-slate-500 font-medium">Consolidado histórico de desempeño y beneficios.</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">✕</button>
        </div>

        {/* selectores de Periodo (No se imprime) */}
        <div className="p-8 bg-slate-50 flex flex-wrap items-center gap-6 print:hidden">
          <div className="flex flex-col space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Año Fiscal</span>
            <div className="flex gap-2">
              {availableYears.map(y => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${selectedYear === y ? 'bg-[#003366] text-white shadow-lg' : 'bg-white text-slate-400 border'}`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col space-y-2 flex-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Meses con Registros</span>
            <div className="flex flex-wrap gap-2">
              {availableMonths.length > 0 ? availableMonths.map(m => (
                <button
                  key={m}
                  onClick={() => setSelectedMonth(m)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedMonth === m ? 'bg-[#FFCC00] text-[#003366] shadow-md' : 'bg-white text-slate-400 border'}`}
                >
                  {m}
                </button>
              )) : (
                <span className="text-xs text-slate-400 italic">No hay evaluaciones registradas en {selectedYear}</span>
              )}
            </div>
          </div>
        </div>

        {/* Contenido del Reporte */}
        <div id="printable-report" className="p-12 space-y-10 print:p-0 print:space-y-8">
          
          {/* Encabezado Profesional Vulcan (VISIBLE EN IMPRESIÓN) */}
          <div className="flex justify-between items-start border-b-4 border-[#FFCC00] pb-6">
            <div>
              <h1 className="text-3xl font-black text-[#003366] tracking-tighter">VULCAN ENERGY TECHNOLOGY</h1>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Consolidado de Desempeño Operativo</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase">Periodo Reportado</p>
              <p className="text-xl font-black text-[#003366] uppercase">{selectedMonth} {selectedYear}</p>
            </div>
          </div>

          {!stats ? (
            <div className="py-20 text-center space-y-4">
              <div className="text-6xl grayscale">📊</div>
              <h3 className="text-xl font-bold text-slate-400 uppercase">Sin registros en este periodo</h3>
              <p className="text-sm text-slate-300">Seleccione un mes diferente o realice nuevas evaluaciones.</p>
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
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Puntaje Promedio</p>
                  <p className="text-4xl font-black text-indigo-600 mt-1">{stats.avgScore.toFixed(1)}%</p>
                </div>
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Bonos Otorgados</p>
                  <p className="text-4xl font-black text-emerald-600 mt-1">{stats.approvedBonuses}</p>
                </div>
                <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Bonos Rechazados</p>
                  <p className="text-4xl font-black text-rose-600 mt-1">{stats.notApprovedBonuses}</p>
                </div>
              </div>

              {/* Listado Completo de Evaluaciones */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest underline decoration-[#FFCC00] decoration-4 underline-offset-8">Desglose Detallado</h4>
                <div className="border rounded-[32px] overflow-hidden bg-white shadow-sm mt-6">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">Trabajador Vulcan</th>
                        <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-center">Desempeño</th>
                        <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">Estatus Bono</th>
                        <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest">Firma Autorizada</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredEvals.map((ev, idx) => {
                        const emp = employees.find(e => e.id === ev.employeeId);
                        const isFailed = ev.promedioFinal * 20 < 80;
                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                               <p className="font-black text-[#003366] uppercase">{emp?.name || 'EMPLEADO ELIMINADO'}</p>
                               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">V-{emp?.idNumber} | {emp?.role}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <span className={`px-3 py-1 rounded-full font-black ${isFailed ? 'bg-rose-100 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                 {(ev.promedioFinal * 20).toFixed(1)}%
                               </span>
                            </td>
                            <td className="px-6 py-4">
                               <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-xl border-2 ${
                                 ev.condicionBono === BonusStatus.Approved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                 ev.condicionBono === BonusStatus.PendingAuth ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                 ev.condicionBono === BonusStatus.NotApproved ? 'bg-rose-100 text-rose-700 border-rose-300' :
                                 'bg-slate-50 text-slate-400 border-slate-100'
                               }`}>
                                 {ev.condicionBono}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-[10px] font-bold text-slate-500 italic">
                               {isFailed ? "RECHAZADO AUTOMÁTICAMENTE" : (ev.authorizedBy ? `AUTORIZADO: ${ev.authorizedBy}` : "PENDIENTE DE FIRMA FINAL")}
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
                <div className="border-t-2 border-slate-800 text-center pt-4">
                  <p className="text-[10px] font-black uppercase text-slate-800">Responsable de Operaciones</p>
                  <p className="text-[9px] text-slate-400 uppercase mt-1 tracking-widest">CONTROL DE CAMPO</p>
                </div>
                <div className="border-t-2 border-slate-800 text-center pt-4">
                  <p className="text-[10px] font-black uppercase text-slate-800">{BONUS_APPROVER}</p>
                  <p className="text-[9px] text-slate-400 uppercase mt-1 tracking-widest">DIRECCIÓN GENERAL VULCAN</p>
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
              <span className="mr-3 text-xl">🖨</span>
              EXPORTAR CONSOLIDADO {selectedMonth.toUpperCase()} {selectedYear}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyReportModal;
