
import React, { useState, useMemo, useEffect } from 'react';
import { Employee, FullEvaluation, BonusStatus, TechnicalCriterion, Department, UserRole, SALARY_APPROVERS } from '../types';
import { ATO_CRITERIA, VULCAN_CRITERIA } from '../constants';
import { VulcanDB } from '../services/storageService';

interface EvaluationFormProps {
  employee: Employee;
  evaluatorName: string;
  onClose: () => void;
  onSave: (evaluation: FullEvaluation) => void;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export default function EvaluationForm({ employee, evaluatorName, onClose, onSave }: EvaluationFormProps) {
  const [step, setStep] = useState(1);
  const [campo, setCampo] = useState('CARIÑA');
  const [mes, setMes] = useState(new Date().toLocaleString('es-ES', { month: 'long' }).toLowerCase());
  const [anio, setAnio] = useState(new Date().getFullYear().toString());

  const user = useMemo(() => VulcanDB.getUser(evaluatorName), [evaluatorName]);
  const isDirector = user?.role === UserRole.Director;
  
  // Verificación de gerentes autorizados (Jin, Naim, Cuya)
  const isSalaryApprover = useMemo(() => {
    return SALARY_APPROVERS.some(name => evaluatorName.toLowerCase().trim() === name.toLowerCase().trim());
  }, [evaluatorName]);

  const isVulcan = employee.department === Department.VULCAN;

  const initialCriteria = useMemo(() => {
    const baseCriteria = isVulcan ? VULCAN_CRITERIA : ATO_CRITERIA;
    return baseCriteria.map(c => ({ ...c, score: 0 }));
  }, [isVulcan]);

  const [criteria, setCriteria] = useState<TechnicalCriterion[]>(initialCriteria);
  const [observaciones, setObservaciones] = useState('');
  
  const [mejoraAreas, setMejoraAreas] = useState('');
  const [objetivosDesarrollo, setObjetivosDesarrollo] = useState('');
  const [capacitacionRec, setCapacitacionRec] = useState('');
  
  const [bonusStatus, setBonusStatus] = useState<BonusStatus>(BonusStatus.PendingAuth);
  
  const totalPuntos = criteria.reduce((acc, curr) => acc + curr.score, 0);
  const promedioFinalNum = totalPuntos > 0 ? parseFloat((totalPuntos / criteria.length).toFixed(2)) : 0;
  const porcentajeDesempeño = (promedioFinalNum / 5) * 100;

  // Lógica de incremento VULCAN exacta: 80-87=10%, 88-97=15%, 98-100=20% o más
  const suggestedIncrement = useMemo(() => {
    if (!isVulcan) return "0%";
    if (porcentajeDesempeño >= 98) return "20% o más";
    if (porcentajeDesempeño >= 88) return "15%";
    if (porcentajeDesempeño >= 80) return "10%";
    return "0%";
  }, [isVulcan, porcentajeDesempeño]);

  const [manualIncrement, setManualIncrement] = useState('');

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
    let finalBonusStatus = bonusStatus;
    
    // REGLA ATO: Solo 100% -> Jacquelin para Bono
    if (!isVulcan) {
      if (porcentajeDesempeño >= 100) {
        finalBonusStatus = BonusStatus.PendingAuth;
      } else {
        finalBonusStatus = BonusStatus.NotApproved;
      }
    } 
    // REGLA VULCAN: Si tiene incremento sugerido (>=80%), queda pendiente de validación por gerencia
    else if (porcentajeDesempeño >= 80) {
      finalBonusStatus = BonusStatus.PendingAuth;
    } else {
      finalBonusStatus = BonusStatus.NotApproved;
    }

    const evaluationData: FullEvaluation = {
      employeeId: employee.id,
      campo, mes, año: anio, evaluador: evaluatorName, 
      cargoEvaluador: "Supervisor / Evaluador Autorizado",
      areaDesempeño: isVulcan ? 'Administrativa' : 'Operativa', 
      criteria, observaciones,
      condicionBono: finalBonusStatus,
      recomendacionSalarial: capacitacionRec || "Sugerida según puntaje",
      incrementoSalarial: isVulcan ? (manualIncrement || suggestedIncrement) : undefined,
      totalPuntos, promedioFinal: promedioFinalNum,
      date: new Date().toISOString().split('T')[0]
    };
    onSave(evaluationData);
    setStep(4);
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden max-w-5xl mx-auto my-4 animate-in fade-in duration-500 print:shadow-none print:border-none print:my-0 print:rounded-none">
      
      <div className="bg-[#003366] p-8 text-white border-b-8 border-[#FFCC00] print:hidden flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="bg-white p-3 rounded-xl font-black text-[#003366] text-xl shadow-lg">VULCAN</div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter">
              Evaluación {employee.department}
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
                   <input value={anio} disabled className="w-full p-4 bg-slate-100 border-2 border-slate-200 rounded-2xl font-black text-center" />
                 </div>
               </div>
            </div>
            <button onClick={() => setStep(2)} className="w-full py-5 bg-[#003366] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Siguiente: Matriz →</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
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
                                <p className="font-black text-[#003366] uppercase text-[11px]">{c.name}</p>
                                <p className="text-[9px] text-slate-400 italic leading-tight">{c.description}</p>
                              </td>
                              <td className="px-8 py-4">
                                <div className="flex justify-center gap-1.5">
                                  {[1, 2, 3, 4, 5].map(v => (
                                    <button 
                                      key={v}
                                      onClick={() => handleScoreChange(c.id, v)}
                                      className={`w-8 h-8 rounded-lg font-black text-[9px] border ${
                                        c.score === v ? 'bg-[#FFCC00] border-[#FFCC00] text-[#003366]' : 'bg-white border-slate-100 text-slate-300'
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
                  <thead className="bg-[#003366] text-white text-[10px] font-black uppercase">
                    <tr>
                      <th className="px-8 py-5">Matriz ATO</th>
                      <th className="px-8 py-5 text-center">Score (1-5)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {criteria.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-8 py-5">
                          <p className="font-black text-[#003366] uppercase text-xs">{c.name}</p>
                          <p className="text-[10px] text-slate-400 italic">{c.description}</p>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map(v => (
                              <button 
                                key={v}
                                onClick={() => handleScoreChange(c.id, v)}
                                className={`w-9 h-9 rounded-xl font-black text-[10px] border-2 ${
                                  c.score === v ? 'bg-[#FFCC00] border-[#FFCC00] text-[#003366]' : 'bg-white border-slate-100 text-slate-300'
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

            <div className="flex justify-between items-center bg-[#001a33] p-8 rounded-[32px] text-white">
              <div>
                <p className="text-[8px] font-black uppercase text-slate-400">Desempeño Final</p>
                <p className="text-3xl font-black text-[#FFCC00]">{porcentajeDesempeño.toFixed(1)}%</p>
              </div>
              <button 
                disabled={criteria.some(c => c.score === 0)}
                onClick={() => setStep(3)} 
                className={`px-12 py-4 rounded-xl font-black uppercase text-[10px] transition-all ${
                  criteria.some(c => c.score === 0) ? 'bg-white/5 text-white/10' : 'bg-[#FFCC00] text-[#003366]'
                }`}
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
             {isVulcan && (
               <div className="bg-emerald-50 border-2 border-emerald-100 p-8 rounded-[32px] space-y-4">
                  <h4 className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Escala Salarial VULCAN</h4>
                  <div className="flex items-center gap-10">
                     <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Incremento Automático:</p>
                        <p className="text-3xl font-black text-emerald-600">{suggestedIncrement}</p>
                     </div>
                     {isSalaryApprover && (
                        <div className="flex-1">
                           <label className="text-[9px] font-black text-emerald-800 uppercase block mb-1">Ajuste Manual de Gerencia:</label>
                           <input 
                             type="text" 
                             value={manualIncrement} 
                             onChange={e => setManualIncrement(e.target.value)}
                             className="w-full p-4 bg-white border-2 border-emerald-200 rounded-2xl text-xs font-black text-emerald-600"
                             placeholder="Ej: 20% ó más"
                           />
                        </div>
                     )}
                  </div>
                  <div className="text-[8px] text-emerald-700/60 font-bold grid grid-cols-3 gap-2 border-t border-emerald-100 pt-4">
                     <span>80%-87%: 10%</span>
                     <span>88%-97%: 15%</span>
                     <span>98%-100%: 20% o más</span>
                  </div>
               </div>
             )}

             <div className="space-y-3">
                <h4 className="text-[10px] font-black text-[#003366] uppercase">Comentarios Finales</h4>
                <textarea 
                  value={observaciones} 
                  onChange={e => setObservaciones(e.target.value)}
                  className="w-full h-32 p-6 bg-slate-50 border-2 border-slate-100 rounded-[32px] outline-none text-sm"
                  placeholder="Observaciones del evaluador..."
                />
             </div>

             <div className="flex justify-end gap-3 pt-6">
                <button onClick={() => setStep(2)} className="px-8 py-4 font-black uppercase text-[10px] text-slate-400">Volver</button>
                <button onClick={processEvaluation} className="bg-[#003366] text-white px-16 py-5 rounded-2xl font-black uppercase text-[10px] shadow-2xl">Cerrar Evaluación</button>
             </div>
          </div>
        )}

        {step === 4 && (
          <div className="py-10">
             <div className="max-w-4xl mx-auto bg-white p-12 border border-slate-200">
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-8">
                   <h1 className="text-3xl font-black text-[#003366]">Vulcan</h1>
                   <div className="text-right text-[10px] font-black uppercase">
                      <p>EVALUACIÓN DE DESEMPEÑO</p>
                      <p className="text-[#003366]">PERSONAL {employee.department}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 border border-slate-800 text-[10px] p-4 mb-8">
                   <p><span className="font-black uppercase">Empleado:</span> {employee.name}</p>
                   <p><span className="font-black uppercase">Cargo:</span> {employee.role}</p>
                   <p><span className="font-black uppercase">Fecha:</span> {new Date().toLocaleDateString()}</p>
                   <p><span className="font-black uppercase">Evaluador:</span> {evaluatorName}</p>
                </div>

                {isVulcan && (
                   <div className="mb-8 p-4 bg-emerald-50 border border-emerald-800">
                      <p className="text-[10px] font-black uppercase text-emerald-900">Incremento Salarial Asignado: <span className="text-lg ml-2">{manualIncrement || suggestedIncrement}</span></p>
                   </div>
                )}

                <div className="mt-8 text-right font-black text-xl">
                   PROMEDIO FINAL: {porcentajeDesempeño.toFixed(1)}%
                </div>

                <div className="grid grid-cols-2 gap-20 text-center mt-20">
                   <div className="border-t border-black pt-2 font-black text-[9px] uppercase">Firma Evaluador</div>
                   <div className="border-t border-black pt-2 font-black text-[9px] uppercase">Firma Trabajador</div>
                </div>
             </div>

             <div className="flex justify-center gap-4 mt-10 print:hidden">
                <button onClick={onClose} className="px-10 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px]">Cerrar</button>
                <button 
                  onClick={() => window.print()} 
                  className="px-16 py-5 bg-[#003366] text-white rounded-2xl font-black uppercase text-[10px] shadow-2xl"
                >
                  Imprimir PDF
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
