
import React, { useState } from 'react';
import { Employee, FullEvaluation, BonusStatus, TechnicalCriterion } from '../types';
import { VULCAN_CRITERIA } from '../constants';
import { analyzeFullEvaluation } from '../services/geminiService';

interface EvaluationFormProps {
  employee: Employee;
  evaluatorName: string;
  onClose: () => void;
  onSave: (evaluation: FullEvaluation) => void;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export default function EvaluationForm({ employee, evaluatorName, onClose, onSave }: EvaluationFormProps) {
  const currentYear = new Date().getFullYear();
  const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long' }).toLowerCase();

  const [step, setStep] = useState(1);
  const [campo, setCampo] = useState('Cariña');
  const [mes, setMes] = useState(currentMonthName);
  const [anio, setAnio] = useState(currentYear.toString());
  const [area, setArea] = useState<'Operativa' | 'Administrativa'>('Operativa');
  const [criteria, setCriteria] = useState<TechnicalCriterion[]>(VULCAN_CRITERIA.map(c => ({ ...c, score: 0 })));
  const [observaciones, setObservaciones] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const totalPuntos = criteria.reduce((acc, curr) => acc + curr.score, 0);
  const criteriaPending = criteria.filter(c => c.score === 0).length;
  const promedioFinalNum = totalPuntos > 0 ? parseFloat((totalPuntos / criteria.length).toFixed(2)) : 0;
  const porcentajeDesempeño = (promedioFinalNum / 5) * 100;

  const handleScoreChange = (id: string, score: number) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, score } : c));
  };

  const processEvaluation = async () => {
    if (criteriaPending > 0) return;
    setAnalyzing(true);
    try {
      const evaluationData: FullEvaluation = {
        employeeId: employee.id,
        campo, mes, año: anio, evaluador: evaluatorName, cargoEvaluador: "Evaluador Autorizado",
        areaDesempeño: area, criteria, observaciones,
        condicionBono: porcentajeDesempeño >= 98 ? BonusStatus.PendingAuth : BonusStatus.NotApproved,
        recomendacionSalarial: "N/A",
        totalPuntos, promedioFinal: promedioFinalNum,
        date: new Date().toISOString().split('T')[0]
      };
      await analyzeFullEvaluation(employee, evaluationData).catch(() => null);
      onSave(evaluationData);
      setStep(4);
    } catch (error) {
      alert("Error al procesar el reporte.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden max-w-5xl mx-auto my-4 animate-in fade-in duration-500 print:shadow-none print:border-none print:my-0">
      {/* Header - Hidden on Print to use specific Document Header */}
      <div className="bg-[#003366] p-8 text-white border-b-8 border-[#FFCC00] print:hidden">
        <h2 className="text-2xl font-black tracking-tight">VULCAN EVALUATION SYSTEM</h2>
        <p className="text-base font-black uppercase text-[#FFCC00] mt-2">{employee.name}</p>
      </div>

      <div className="p-10 print:p-0">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estación / Instalación</label>
                <input value={campo} onChange={e => setCampo(e.target.value.toUpperCase())} className="w-full p-4 border-2 border-slate-50 rounded-2xl bg-slate-50 font-bold uppercase text-[#003366] outline-none focus:border-[#003366] transition-all text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mes</label>
                  <select value={mes} onChange={e => setMes(e.target.value)} className="w-full p-4 border-2 border-slate-50 rounded-2xl bg-slate-50 font-black uppercase text-[#003366] outline-none focus:border-[#003366] cursor-pointer text-sm">
                    {MESES.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Año</label>
                  <select value={anio} onChange={e => setAnio(e.target.value)} className="w-full p-4 border-2 border-slate-50 rounded-2xl bg-slate-50 font-black uppercase text-[#003366] outline-none focus:border-[#003366] cursor-pointer text-sm">
                    <option value={currentYear}>{currentYear}</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t flex justify-end">
              <button onClick={() => setStep(2)} className="bg-[#003366] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Siguiente →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
             <div className="overflow-x-auto border-2 border-slate-50 rounded-3xl bg-white">
              <table className="w-full text-left text-sm min-w-[500px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-5 font-black text-slate-400 text-[9px] uppercase tracking-widest">Criterio</th>
                    <th className="px-6 py-5 font-black text-slate-400 text-[9px] uppercase tracking-widest text-center">Puntos (1-5)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {criteria.map(c => (
                    <tr key={c.id}>
                      <td className="px-6 py-5">
                        <p className="font-black text-[#003366] uppercase text-[10px]">{c.name}</p>
                        <p className="text-[9px] text-slate-400 italic">{c.description}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex justify-center gap-1">
                          {[1, 2, 3, 4, 5].map(v => (
                            <button key={v} onClick={() => handleScoreChange(c.id, v)} className={`w-9 h-9 rounded-xl font-black border-2 ${c.score === v ? 'bg-[#003366] text-white border-[#003366]' : 'bg-white text-slate-200 border-slate-50'}`}>{v}</button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center bg-[#001a33] p-8 rounded-[32px] text-white">
               <div><p className="text-[9px] font-black opacity-40 uppercase">Rendimiento Técnico</p><p className="text-5xl font-black text-[#FFCC00]">{porcentajeDesempeño.toFixed(1)}%</p></div>
               <button disabled={criteriaPending > 0} onClick={() => setStep(3)} className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] ${criteriaPending > 0 ? 'bg-white/10 text-white/20' : 'bg-[#FFCC00] text-[#003366]'}`}>Finalizar →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in">
             <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} className="w-full h-32 p-6 border-2 border-slate-50 rounded-[32px] bg-slate-50 focus:border-[#003366] outline-none font-bold text-slate-700 text-sm" placeholder="Observaciones finales..." />
             <div className="flex justify-between gap-4 pt-6 border-t">
                <button onClick={() => setStep(2)} className="text-slate-400 font-black uppercase text-[10px] p-4">Atrás</button>
                <button onClick={processEvaluation} disabled={analyzing} className="bg-[#003366] text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs">
                  {analyzing ? 'Procesando...' : 'Autorizar y Finalizar'}
                </button>
             </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in zoom-in">
             {/* Printable Document - Hidden on Screen */}
             <div className="hidden print:block p-8 bg-white text-slate-900 border-2 border-slate-100 rounded-lg">
                <div className="flex justify-between items-center border-b-4 border-[#003366] pb-4 mb-6">
                   <div>
                      <h1 className="text-2xl font-black text-[#003366] uppercase tracking-tighter">VULCAN ENERGY TECHNOLOGY</h1>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acta de Evaluación de Desempeño Operativo</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black uppercase text-slate-400">Fecha de Emisión</p>
                      <p className="text-xs font-black">{new Date().toLocaleDateString('es-ES')}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 p-4 rounded-xl">
                   <div>
                      <p className="text-[8px] font-black uppercase text-slate-400">Colaborador:</p>
                      <p className="text-sm font-black text-[#003366] uppercase">{employee.name}</p>
                      <p className="text-[10px] font-bold text-slate-600">ID: V-{employee.idNumber}</p>
                   </div>
                   <div>
                      <p className="text-[8px] font-black uppercase text-slate-400">Cargo:</p>
                      <p className="text-sm font-black text-[#003366] uppercase">{employee.role}</p>
                      <p className="text-[10px] font-bold text-slate-600">Estación: {campo}</p>
                   </div>
                </div>

                <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 text-slate-800">Desglose de Puntuación Técnica</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                   <table className="w-full text-left text-[9px]">
                      <thead className="bg-slate-100 border-b border-slate-200">
                         <tr>
                            <th className="px-4 py-2 font-black uppercase">Criterio de Evaluación</th>
                            <th className="px-4 py-2 font-black uppercase text-center">Puntaje</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {criteria.map(c => (
                            <tr key={c.id}>
                               <td className="px-4 py-2 font-medium">{c.name}</td>
                               <td className="px-4 py-2 text-center font-black">{c.score} / 5</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>

                <div className="flex items-center justify-between mb-8 p-4 bg-[#003366] text-white rounded-xl">
                   <div>
                      <p className="text-[8px] font-black uppercase opacity-60 tracking-widest">Puntuación Final Acumulada</p>
                      <p className="text-3xl font-black">{porcentajeDesempeño.toFixed(1)}%</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black uppercase opacity-60 tracking-widest">Estatus de Bono</p>
                      <p className="text-sm font-black uppercase text-[#FFCC00]">
                         {porcentajeDesempeño >= 98 ? 'AUTORIZACIÓN PENDIENTE' : 'NO CALIFICA'}
                      </p>
                   </div>
                </div>

                <div className="mb-10">
                   <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Observaciones de la Supervisión:</p>
                   <p className="text-[10px] text-slate-700 leading-relaxed border-l-2 border-[#003366] pl-3 italic">
                      {observaciones || "Sin observaciones adicionales reportadas por el evaluador de campo."}
                   </p>
                </div>

                {/* Signature Section */}
                <div className="mt-20 grid grid-cols-2 gap-20">
                   <div className="text-center">
                      <div className="border-t-2 border-slate-800 pt-2">
                         <p className="text-[10px] font-black uppercase text-slate-800">{evaluatorName}</p>
                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Firma del Supervisor</p>
                      </div>
                   </div>
                   <div className="text-center">
                      <div className="border-t-2 border-slate-800 pt-2">
                         <p className="text-[10px] font-black uppercase text-slate-800">{employee.name}</p>
                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Firma del Colaborador</p>
                      </div>
                   </div>
                </div>

                <div className="mt-12 text-center">
                   <p className="text-[7px] text-slate-300 font-bold uppercase tracking-[0.3em]">Documento Generado por VulcanHR System • Propiedad de Vulcan Energy Technology</p>
                </div>
             </div>

             {/* Screen Success Message - Hidden on Print */}
             <div className="space-y-8 text-center print:hidden">
                <div className="p-12 rounded-[40px] border-2 bg-emerald-50 border-emerald-100 max-w-2xl mx-auto w-full">
                   <h3 className="text-4xl font-black tracking-tighter uppercase text-emerald-900">Evaluación Exitosa</h3>
                   <div className="mt-10 mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Puntaje Técnico</p>
                      <div className="text-8xl font-black text-[#003366]">{porcentajeDesempeño.toFixed(1)}%</div>
                   </div>
                   <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden max-w-sm mx-auto">
                      <div className="h-full bg-[#003366]" style={{ width: `${porcentajeDesempeño}%` }}></div>
                   </div>
                </div>
                
                <div className="flex justify-center gap-4">
                  <button onClick={onClose} className="px-10 py-5 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors">Cerrar</button>
                  <button 
                    onClick={() => window.print()} 
                    className="px-10 py-5 bg-[#003366] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-900/20 hover:scale-105 transition-all"
                  >
                    🖨 Descargar PDF / Imprimir
                  </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
