
import React, { useState, useMemo, useEffect } from 'react';
import { Employee, FullEvaluation, BonusStatus, TechnicalCriterion, Department, UserRole, SALARY_APPROVERS } from '../types';
import { ATO_CRITERIA, VULCAN_CRITERIA } from '../constants';
import { VulcanDB } from '../services/storageService';

interface EvaluationFormProps {
  employee: Employee;
  evaluatorName: string;
  initialData?: FullEvaluation;
  onClose: () => void;
  onSave: (evaluation: FullEvaluation) => void;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export default function EvaluationForm({ employee, evaluatorName, initialData, onClose, onSave }: EvaluationFormProps) {
  const [step, setStep] = useState(1);
  const [campo, setCampo] = useState(initialData?.campo || 'CARIÑA');
  const [mes, setMes] = useState(initialData?.mes || new Date().toLocaleString('es-ES', { month: 'long' }).toLowerCase());
  const [anio, setAnio] = useState(initialData?.año || new Date().getFullYear().toString());

  const user = useMemo(() => VulcanDB.getUser(evaluatorName), [evaluatorName]);
  const isDirector = user?.role === UserRole.Director;
  
  const isSalaryApprover = useMemo(() => {
    return SALARY_APPROVERS.some(name => evaluatorName.toLowerCase().trim() === name.toLowerCase().trim());
  }, [evaluatorName]);

  const isVulcan = employee.department === Department.VULCAN;

  const [criteria, setCriteria] = useState<TechnicalCriterion[]>([]);
  const [observaciones, setObservaciones] = useState(initialData?.observaciones || '');
  const [manualIncrement, setManualIncrement] = useState(initialData?.incrementoSalarial || '');

  // Inicializar criterios
  useEffect(() => {
    if (initialData) {
      setCriteria(initialData.criteria);
    } else {
      const baseCriteria = isVulcan ? VULCAN_CRITERIA : ATO_CRITERIA;
      setCriteria(baseCriteria.map(c => ({ ...c, score: 0 })));
    }
  }, [isVulcan, initialData]);

  const totalPuntos = criteria.reduce((acc, curr) => acc + curr.score, 0);
  const promedioFinalNum = totalPuntos > 0 ? parseFloat((totalPuntos / criteria.length).toFixed(2)) : 0;
  const porcentajeDesempeño = (promedioFinalNum / 5) * 100;

  const suggestedIncrement = useMemo(() => {
    if (!isVulcan) return "0%";
    if (porcentajeDesempeño >= 98) return "20% o más";
    if (porcentajeDesempeño >= 88) return "15%";
    if (porcentajeDesempeño >= 80) return "10%";
    return "0%";
  }, [isVulcan, porcentajeDesempeño]);

  const handleScoreChange = (id: string, score: number) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, score } : c));
  };

  const vulcanGroups = useMemo(() => {
    if (!isVulcan) return [];
    const groups = Array.from(new Set(VULCAN_CRITERIA.map(c => c.category)));
    return groups.map(g => ({
      name: g,
      items: criteria.filter(c => (c as any).category === g)
    }));
  }, [isVulcan, criteria]);

  const processEvaluation = () => {
    let finalBonusStatus = initialData?.condicionBono || BonusStatus.PendingAuth;
    
    // Si no es edición o si el puntaje cambió drásticamente, recalculamos status sugerido
    if (!initialData) {
      if (!isVulcan) {
        if (porcentajeDesempeño < 100) {
          finalBonusStatus = BonusStatus.NotApproved;
        }
      } else if (porcentajeDesempeño < 80) {
        finalBonusStatus = BonusStatus.NotApproved;
      }
    }

    const evaluationData: FullEvaluation = {
      id: initialData?.id, // Mantenemos el ID si existe
      employeeId: employee.id,
      campo, mes, año: anio, evaluador: initialData?.evaluador || evaluatorName, 
      cargoEvaluador: initialData?.cargoEvaluador || (isDirector ? "Dirección General" : "Supervisor / Evaluador"),
      areaDesempeño: isVulcan ? 'Administrativa' : 'Operativa', 
      criteria, observaciones,
      condicionBono: finalBonusStatus,
      recomendacionSalarial: "Sugerida según puntaje",
      incrementoSalarial: isVulcan ? (manualIncrement || suggestedIncrement) : undefined,
      totalPuntos, promedioFinal: promedioFinalNum,
      date: initialData?.date || new Date().toISOString().split('T')[0],
      authorizedBy: initialData?.authorizedBy
    };
    
    onSave(evaluationData);
    setStep(4);
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden max-w-5xl mx-auto my-4 animate-in fade-in duration-500 print:shadow-none print:border-none print:my-0 print:rounded-none print:w-full">
      
      {/* Header Formulario */}
      <div className="bg-[#003366] p-8 text-white border-b-8 border-[#FFCC00] print:hidden flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="bg-white p-3 rounded-xl font-black text-[#003366] text-xl shadow-lg">VULCAN</div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter">
              {initialData ? 'Corrigiendo' : 'Formato de'} Evaluación {employee.department}
            </h2>
            <p className="text-[10px] font-bold uppercase text-[#FFCC00] tracking-[0.2em]">{employee.name}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-rose-500 transition-all">✕</button>
      </div>

      <div className="p-10 print:p-0">
        {step === 1 && (
          <div className="space-y-8">
            <div className="bg-slate-50 p-8 rounded-[32px] border-2 border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-[#003366] uppercase tracking-widest">Campo / Ubicación</label>
                 <input value={campo} onChange={e => setCampo(e.target.value.toUpperCase())} className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black uppercase" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-[#003366] uppercase tracking-widest">Mes</label>
                   <select value={mes} onChange={e => setMes(e.target.value)} className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black uppercase text-xs">
                     {MESES.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-[#003366] uppercase tracking-widest">Año</label>
                   <input value={anio} onChange={e => setAnio(e.target.value)} disabled={!isDirector} className="w-full p-4 bg-slate-100 border-2 border-slate-200 rounded-2xl font-black text-center" />
                 </div>
               </div>
            </div>
            <button onClick={() => setStep(2)} className="w-full py-5 bg-[#003366] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Continuar a Matriz Técnica →</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in">
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-[10px] text-amber-800 font-bold uppercase text-center mb-4">
               Califique cada criterio de 1 (Deficiente) a 5 (Sobresaliente)
            </div>
            
            {isVulcan ? (
              <div className="space-y-12">
                {vulcanGroups.map((group, idx) => (
                  <div key={group.name} className="space-y-4">
                    <div className="bg-[#003366] p-4 rounded-2xl text-white">
                       <h4 className="text-[10px] font-black uppercase tracking-widest">{idx + 2}. {group.name}</h4>
                    </div>
                    <div className="overflow-hidden border-2 border-slate-100 rounded-[32px]">
                      <table className="w-full text-left">
                        <tbody className="divide-y divide-slate-100">
                          {group.items.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50">
                              <td className="px-8 py-4 w-2/3">
                                <p className="font-black text-[#003366] uppercase text-[11px] mb-0.5">{c.name}</p>
                                <p className="text-[9px] text-slate-400 italic leading-tight">{c.description}</p>
                              </td>
                              <td className="px-8 py-4">
                                <div className="flex justify-center gap-1.5">
                                  {[1, 2, 3, 4, 5].map(v => (
                                    <button 
                                      key={v}
                                      onClick={() => handleScoreChange(c.id, v)}
                                      className={`w-8 h-8 rounded-lg font-black text-[9px] transition-all border ${
                                        c.score === v ? 'bg-[#FFCC00] border-[#FFCC00] text-[#003366] scale-110 shadow-md' : 'bg-white border-slate-100 text-slate-300'
                                      }`}
                                    >
                                      {v}
                                    </button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden border-2 border-slate-100 rounded-[32px]">
                <table className="w-full text-left">
                  <thead className="bg-[#003366] text-white">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Matriz Técnica ATO</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">Puntaje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {criteria.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-5">
                          <p className="font-black text-[#003366] uppercase text-xs mb-1">{c.name}</p>
                          <p className="text-[10px] text-slate-400 italic">{c.description}</p>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map(v => (
                              <button 
                                key={v}
                                onClick={() => handleScoreChange(c.id, v)}
                                className={`w-9 h-9 rounded-xl font-black text-[10px] transition-all border-2 ${
                                  c.score === v ? 'bg-[#FFCC00] border-[#FFCC00] text-[#003366] shadow-lg scale-110' : 'bg-white border-slate-100 text-slate-300'
                                }`}
                              >
                                {v}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-between items-center bg-[#001a33] p-8 rounded-[32px] text-white shadow-xl">
              <div className="flex items-center gap-8">
                 <div className="text-center">
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Promedio</p>
                    <p className="text-2xl font-black text-[#FFCC00]">{promedioFinalNum}</p>
                 </div>
                 <div className="text-center border-l border-white/10 pl-8">
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1">Eficacia Total</p>
                    <p className="text-2xl font-black text-[#FFCC00]">{porcentajeDesempeño.toFixed(1)}%</p>
                 </div>
              </div>
              <button 
                disabled={criteria.some(c => c.score === 0)}
                onClick={() => setStep(3)} 
                className={`px-12 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                  criteria.some(c => c.score === 0) ? 'bg-white/5 text-white/10' : 'bg-[#FFCC00] text-[#003366] shadow-xl'
                }`}
              >
                Continuar a Resultados →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
             <div className="space-y-3">
                <h4 className="text-[10px] font-black text-[#003366] uppercase tracking-widest">Observaciones y Comentarios Generales</h4>
                <textarea 
                  value={observaciones} 
                  onChange={e => setObservaciones(e.target.value)}
                  className="w-full h-32 p-6 bg-slate-50 border-2 border-slate-100 rounded-[32px] outline-none focus:border-[#003366] text-sm"
                  placeholder="Describa el desempeño general observado en el periodo..."
                />
             </div>

             <div className="flex justify-end gap-3 pt-6">
                <button onClick={() => setStep(2)} className="px-8 py-4 font-black uppercase text-[10px] text-slate-400">Volver a Matriz</button>
                <button onClick={processEvaluation} className="bg-[#003366] text-white px-16 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl">
                  {initialData ? 'Guardar Cambios' : 'Finalizar Registro'} y Generar Acta
                </button>
             </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in zoom-in space-y-10 py-10 print:py-0">
             {/* VISTA PREVIA PDF (ACTA OFICIAL) */}
             <div className="max-w-4xl mx-auto bg-white p-12 border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0 print:w-full print:max-w-full overflow-hidden">
                
                {/* Cabecera Oficial */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-8">
                   <div className="flex gap-4 items-center">
                     <div className="w-12 h-12 bg-[#003366] text-white flex items-center justify-center font-black text-xs rounded-lg">VULCAN</div>
                     <div>
                        <h1 className="text-2xl font-black text-[#003366] tracking-tighter">Vulcan</h1>
                        <p className="text-[7px] font-black text-slate-500 tracking-widest uppercase">VULCAN ENERGY TECHNOLOGY VENEZOLANA, C.A.</p>
                     </div>
                   </div>
                   <div className="text-right text-[9px] font-black text-slate-800 leading-tight">
                      <p className="bg-slate-100 px-2 py-1 mb-1 border border-slate-200">ACTA DE EVALUACIÓN INDIVIDUAL</p>
                      <p className="text-[#003366] font-black">NIVEL: PERSONAL {employee.department}</p>
                   </div>
                </div>

                {/* Info General en Tabla */}
                <table className="w-full border-collapse border border-slate-800 text-[10px] mb-8">
                  <tbody>
                    <tr>
                      <td className="border border-slate-800 p-2 bg-slate-50 font-black w-1/4">TRABAJADOR</td>
                      <td className="border border-slate-800 p-2 w-1/4 uppercase">{employee.name}</td>
                      <td className="border border-slate-800 p-2 bg-slate-50 font-black w-1/4">CÉDULA</td>
                      <td className="border border-slate-800 p-2 w-1/4">V-{employee.idNumber}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-2 bg-slate-50 font-black">CARGO</td>
                      <td className="border border-slate-800 p-2 uppercase">{employee.role}</td>
                      <td className="border border-slate-800 p-2 bg-slate-50 font-black">CAMPO / BASE</td>
                      <td className="border border-slate-800 p-2 uppercase">{campo}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-2 bg-slate-50 font-black">MES EVALUADO</td>
                      <td className="border border-slate-800 p-2 uppercase font-black">{mes} {anio}</td>
                      <td className="border border-slate-800 p-2 bg-slate-50 font-black">FECHA DE REPORTE</td>
                      <td className="border border-slate-800 p-2 uppercase">{new Date().toLocaleDateString('es-ES')}</td>
                    </tr>
                  </tbody>
                </table>

                {/* MATRIZ DETALLADA (CADA ITEM EVALUADO) */}
                <div className="mb-8">
                  <h4 className="text-[10px] font-black uppercase mb-3 bg-slate-800 text-white p-2 text-center tracking-widest">I. MATRIZ TÉCNICA Y OPERACIONAL DE RENDIMIENTO</h4>
                  <table className="w-full border-collapse border border-slate-800 text-[9px]">
                    <thead className="bg-slate-100 font-black">
                      <tr>
                        <th className="border border-slate-800 p-2 text-left uppercase w-2/5">Indicador / Competencia</th>
                        <th className="border border-slate-800 p-2 text-left uppercase w-2/5">Descripción de Referencia Técnica</th>
                        <th className="border border-slate-800 p-2 text-center uppercase">Puntaje (1-5)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criteria.map((c, idx) => (
                        <tr key={c.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="border border-slate-800 p-2 font-black uppercase text-[8px]">{c.name}</td>
                          <td className="border border-slate-800 p-2 text-slate-500 italic leading-none text-[8px]">{c.description}</td>
                          <td className="border border-slate-800 p-2 text-center font-black text-xs">{c.score}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-200 font-black">
                        <td colSpan={2} className="border border-slate-800 p-3 text-right uppercase">Calificación Final del Periodo (Promedio ponderado / Eficacia):</td>
                        <td className="border border-slate-800 p-3 text-center text-sm text-[#003366]">{totalPuntos} pts / {porcentajeDesempeño.toFixed(1)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Comentarios */}
                <div className="mb-8 border border-slate-800">
                   <div className="bg-slate-50 p-2 font-black border-b border-slate-800 text-[10px] uppercase">II. Observaciones y Recomendaciones del Supervisor</div>
                   <div className="p-4 min-h-[80px] text-[10px] italic leading-tight text-slate-700">
                      {observaciones || "El trabajador mantiene un nivel de cumplimiento satisfactorio con respecto a los estándares de la organización en el periodo indicado."}
                   </div>
                </div>

                {/* Firmas */}
                <div className="grid grid-cols-2 gap-20 text-center mt-20">
                   <div className="space-y-1">
                      <div className="border-t border-slate-800 pt-2 mx-auto w-3/4">
                        <p className="text-[9px] font-black uppercase">{initialData?.evaluador || evaluatorName}</p>
                        <p className="text-[7px] text-slate-500 uppercase">Supervisor / Evaluador Autorizado</p>
                        <p className="text-[7px] text-slate-400 font-bold uppercase mt-1">Sello Vulcan HR</p>
                      </div>
                   </div>
                   <div className="space-y-1">
                      <div className="border-t border-slate-800 pt-2 mx-auto w-3/4">
                        <p className="text-[9px] font-black uppercase">{employee.name}</p>
                        <p className="text-[7px] text-slate-500 uppercase">Trabajador Evaluado</p>
                        <p className="text-[7px] text-slate-400 font-bold uppercase mt-1">Recibido y Conforme</p>
                      </div>
                   </div>
                </div>

                <div className="mt-12 text-center border-t border-slate-200 pt-4">
                   <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                     Calle 19 sur, Centro Empresarial San Remo, Planta Baja, El Tigre, Anzoátegui – Venezuela<br/>
                     © 2025 VULCAN ENERGY TECHNOLOGY VENEZOLANA, C.A. - Control de Gestión de Talento Humano.
                   </p>
                </div>
             </div>

             {/* Controles Finales */}
             <div className="flex justify-center gap-6 mt-10 print:hidden">
                <button 
                  onClick={onClose} 
                  className="px-12 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                >
                  Finalizar y Cerrar
                </button>
                <button 
                  onClick={() => window.print()} 
                  className="px-20 py-5 bg-[#003366] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                  <span className="text-xl">🖨️</span> Generar PDF de Acta
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
