
import React, { useState, useMemo } from 'react';
import { Employee, FullEvaluation, BonusStatus, TechnicalCriterion, BONUS_APPROVER } from '../types';
import { VULCAN_CRITERIA } from '../constants';
import { analyzeFullEvaluation } from '../services/geminiService';

interface EvaluationFormProps {
  employee: Employee;
  evaluatorName: string;
  onClose: () => void;
  onSave: (evaluation: FullEvaluation) => void;
}

interface AIResult {
  conclusion: string;
  smartObjectives: string[];
  trainingRecommendation: string;
}

const EvaluationForm: React.FC<EvaluationFormProps> = ({ employee, evaluatorName, onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [campo, setCampo] = useState('Cariña');
  const [mes, setMes] = useState(new Date().toLocaleString('es-ES', { month: 'long' }));
  const [area, setArea] = useState<'Operativa' | 'Administrativa'>('Operativa');
  const [criteria, setCriteria] = useState<TechnicalCriterion[]>(
    VULCAN_CRITERIA.map(c => ({ ...c, score: 0 }))
  );
  const [observaciones, setObservaciones] = useState('');
  const [bono, setBono] = useState<BonusStatus>(BonusStatus.Approved);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  const totalPuntos = criteria.reduce((acc, curr) => acc + curr.score, 0);
  const criteriaPending = criteria.filter(c => c.score === 0).length;
  
  const promedioFinalStr = totalPuntos > 0 ? (totalPuntos / criteria.length).toFixed(2) : "0.00";
  const promedioFinalNum = parseFloat(promedioFinalStr);
  const porcentajeDesempeño = (promedioFinalNum / 5) * 100;

  const getSalaryIncreaseRecommendation = (percentage: number) => {
    if (percentage >= 98) return { text: "Incremento del 20% o más", note: "Sujeto a aprobación de Jefe", color: "text-indigo-600 bg-indigo-50 border-indigo-200", requiresAuth: true };
    if (percentage >= 88) return { text: "Incremento del 15%", note: "Desempeño Sobresaliente", color: "text-emerald-600 bg-emerald-50 border-emerald-200", requiresAuth: false };
    if (percentage >= 80) return { text: "Incremento del 10%", note: "Cumple Expectativas", color: "text-blue-600 bg-blue-50 border-blue-200", requiresAuth: false };
    return { text: "Sin incremento", note: "Por debajo del 80%", color: "text-slate-500 bg-slate-50 border-slate-200", requiresAuth: false };
  };

  const increaseInfo = getSalaryIncreaseRecommendation(porcentajeDesempeño);

  const handleScoreChange = (id: string, score: number) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, score } : c));
  };

  const processEvaluation = async () => {
    if (criteriaPending > 0) return;
    setAnalyzing(true);
    try {
      const evaluationData: FullEvaluation = {
        employeeId: employee.id,
        campo,
        mes,
        evaluador: evaluatorName,
        cargoEvaluador: "Evaluador Autorizado",
        areaDesempeño: area,
        criteria,
        observaciones,
        condicionBono: increaseInfo.requiresAuth ? BonusStatus.PendingAuth : bono,
        totalPuntos,
        promedioFinal: promedioFinalNum,
        date: new Date().toISOString().split('T')[0]
      };
      
      try {
        const result = await analyzeFullEvaluation(employee, evaluationData);
        if (result) setAiResult(result);
      } catch (aiErr) {
        console.warn("AI Analysis failed", aiErr);
      }
      
      onSave(evaluationData);
      setStep(4);
    } catch (error) {
      alert("Error al procesar el reporte.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden max-w-5xl mx-auto my-4">
      <div className="bg-[#003366] p-8 text-white border-b-8 border-[#FFCC00]">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black tracking-tight">VULCAN EVALUATION SYSTEM</h2>
            <p className="text-[10px] opacity-60 mt-1 uppercase tracking-[0.3em] font-bold">Reporte de Desempeño Operativo</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase opacity-40">Evaluando a:</p>
            <p className="text-lg font-black uppercase text-[#FFCC00]">{employee.name}</p>
          </div>
        </div>
      </div>

      <div className="p-10">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evaluador de Turno</label>
                <div className="p-4 bg-slate-50 rounded-2xl border-2 border-[#003366]/10 text-[#003366] font-black uppercase">
                   {evaluatorName}
                </div>
                <p className="text-[10px] text-emerald-500 font-bold uppercase">Sesión Protegida ✓</p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Área de Trabajo</label>
                <div className="flex space-x-4">
                   <button onClick={() => setArea('Operativa')} className={`flex-1 p-4 rounded-2xl border-2 font-black uppercase text-xs transition-all ${area === 'Operativa' ? 'bg-[#003366] text-white border-[#003366]' : 'bg-slate-50 text-slate-400 border-transparent'}`}>Operativa</button>
                   <button onClick={() => setArea('Administrativa')} className={`flex-1 p-4 rounded-2xl border-2 font-black uppercase text-xs transition-all ${area === 'Administrativa' ? 'bg-[#003366] text-white border-[#003366]' : 'bg-slate-50 text-slate-400 border-transparent'}`}>Administrativa</button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Campo / Estación</label>
                <input value={campo} onChange={e => setCampo(e.target.value)} className="w-full p-4 border-2 rounded-2xl bg-slate-50 font-bold uppercase text-[#003366] outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mes</label>
                <input value={mes} onChange={e => setMes(e.target.value)} className="w-full p-4 border-2 rounded-2xl bg-slate-50 font-bold uppercase text-[#003366] outline-none" />
              </div>
            </div>
            <div className="pt-6 flex justify-end">
              <button onClick={() => setStep(2)} className="bg-[#003366] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-900/10">
                Siguiente: Matriz →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in duration-300">
             <div className="overflow-hidden border-2 border-slate-100 rounded-[32px]">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase tracking-widest">Criterio Vulcan</th>
                    <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase tracking-widest text-center">Puntuación</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {criteria.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5">
                        <p className="font-black text-[#003366] uppercase text-[11px] leading-tight mb-1">{c.name}</p>
                        <p className="text-[10px] text-slate-400 italic font-medium">{c.description}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center space-x-1">
                          {[1, 2, 3, 4, 5].map(v => (
                            <button
                              key={v}
                              onClick={() => handleScoreChange(c.id, v)}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black border-2 transition-all ${c.score === v ? 'bg-[#003366] text-white border-[#003366] scale-110 shadow-lg' : 'bg-white text-slate-300 border-slate-100 hover:border-[#003366] hover:text-[#003366]'}`}
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
            <div className="flex justify-between items-center bg-[#001a33] p-8 rounded-[32px] text-white">
               <div>
                  <p className="text-[10px] font-black opacity-40 uppercase tracking-widest">Puntaje Final</p>
                  <p className="text-4xl font-black text-[#FFCC00]">{porcentajeDesempeño.toFixed(1)}%</p>
               </div>
               <div className="flex space-x-4">
                  <button onClick={() => setStep(1)} className="px-6 py-3 font-black uppercase text-[10px] text-slate-400">Regresar</button>
                  <button 
                    disabled={criteriaPending > 0}
                    onClick={() => setStep(3)}
                    className={`px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${criteriaPending > 0 ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-white text-[#003366] hover:scale-105'}`}
                  >
                    Resumen Final →
                  </button>
               </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-10 animate-in fade-in duration-300">
             <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observaciones Técnicas</label>
                <textarea 
                  value={observaciones} 
                  onChange={e => setObservaciones(e.target.value)}
                  className="w-full h-32 p-6 border-2 rounded-[32px] bg-slate-50 focus:border-[#003366] outline-none font-medium"
                  placeholder="Detalle incidentes, comportamiento o felicitaciones..."
                ></textarea>
             </div>

             <div className={`p-8 rounded-[32px] border-4 text-center ${increaseInfo.color}`}>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Recomendación Salarial</p>
                <p className="text-2xl font-black my-2 uppercase">{increaseInfo.text}</p>
                <p className="text-[10px] font-bold uppercase">{increaseInfo.note}</p>
             </div>

             <div className="flex justify-between pt-6 border-t">
                <button onClick={() => setStep(2)} className="text-slate-400 font-black uppercase text-xs tracking-widest">Matriz Técnica</button>
                <button 
                  onClick={processEvaluation}
                  disabled={analyzing}
                  className="bg-[#FFCC00] text-[#003366] px-12 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all"
                >
                  {analyzing ? 'PROCESANDO...' : 'FIRMAR REPORTE'}
                </button>
             </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-in zoom-in duration-500">
             <div className="bg-emerald-50 p-12 rounded-[40px] text-center border border-emerald-100">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white text-4xl mx-auto mb-6 shadow-xl border-8 border-white">✓</div>
                <h3 className="text-4xl font-black text-emerald-900 tracking-tighter uppercase">Registro Exitoso</h3>
                <p className="text-emerald-600 font-bold uppercase text-[10px] mt-2 tracking-widest">Firmado Digitalmente por {evaluatorName}</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-white border-2 rounded-[32px] border-slate-100">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Métricas del Empleado</p>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-slate-700 uppercase">Puntaje Operativo</span>
                         <span className="text-xl font-black text-[#003366]">{porcentajeDesempeño.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                         <div className="bg-[#003366] h-full" style={{ width: `${porcentajeDesempeño}%` }}></div>
                      </div>
                   </div>
                </div>
                <div className="p-8 bg-[#003366] rounded-[32px] text-white">
                   <p className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-4">Ajuste Recomendado</p>
                   <p className="text-2xl font-black text-[#FFCC00] uppercase">{increaseInfo.text}</p>
                   <p className="text-[9px] mt-2 opacity-60 uppercase font-bold">{increaseInfo.note}</p>
                </div>
             </div>

             <div className="flex justify-center space-x-6 pt-6 print:hidden">
                <button onClick={onClose} className="px-8 py-4 font-black text-slate-400 uppercase text-xs tracking-widest hover:text-[#003366] transition-all">Siguiente Empleado</button>
                <button onClick={() => window.print()} className="bg-[#003366] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-900/20">Imprimir Reporte</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationForm;
