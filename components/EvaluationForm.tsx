
import React, { useState, useMemo } from 'react';
import { Employee, FullEvaluation, BonusStatus, TechnicalCriterion, AUTHORIZED_EVALUATORS, BONUS_APPROVER } from '../types';
import { VULCAN_CRITERIA } from '../constants';
import { analyzeFullEvaluation } from '../services/geminiService';

interface EvaluationFormProps {
  employee: Employee;
  onClose: () => void;
  onSave: (evaluation: FullEvaluation) => void;
}

interface AIResult {
  conclusion: string;
  smartObjectives: string[];
  trainingRecommendation: string;
}

const EvaluationForm: React.FC<EvaluationFormProps> = ({ employee, onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [campo, setCampo] = useState('Cariña');
  const [mes, setMes] = useState(new Date().toLocaleString('es-ES', { month: 'long' }));
  const [evaluador, setEvaluador] = useState(AUTHORIZED_EVALUATORS[0]);
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
    if (percentage >= 98) return { 
      text: "Incremento del 20% o más", 
      note: "Sujeto a consideración y aprobación del jefe (ING. GUSTAVO VULCAN)", 
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
      requiresAuth: true
    };
    if (percentage >= 88) return { 
      text: "Incremento del 15%", 
      note: "Desempeño sobresaliente", 
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      requiresAuth: false
    };
    if (percentage >= 80) return { 
      text: "Incremento del 10%", 
      note: "Cumple con expectativas superiores", 
      color: "text-blue-600 bg-blue-50 border-blue-200",
      requiresAuth: false
    };
    return { 
      text: "Sin incremento recomendado", 
      note: "Requiere alcanzar al menos el 80% para elegibilidad", 
      color: "text-slate-500 bg-slate-50 border-slate-200",
      requiresAuth: false
    };
  };

  const increaseInfo = getSalaryIncreaseRecommendation(porcentajeDesempeño);

  const handleScoreChange = (id: string, score: number) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, score } : c));
  };

  const processEvaluation = async () => {
    if (criteriaPending > 0) return;
    
    setAnalyzing(true);
    try {
      const finalBono = increaseInfo.requiresAuth ? BonusStatus.PendingAuth : bono;
      
      const evaluationData: FullEvaluation = {
        employeeId: employee.id,
        campo,
        mes,
        evaluador,
        cargoEvaluador: "Evaluador Autorizado",
        areaDesempeño: area,
        criteria,
        observaciones,
        condicionBono: finalBono,
        totalPuntos,
        promedioFinal: promedioFinalNum,
        date: new Date().toISOString().split('T')[0]
      };
      
      // Intentar obtener análisis de IA pero NO bloquear el flujo si falla
      try {
        const result = await analyzeFullEvaluation(employee, evaluationData);
        if (result) {
          setAiResult(result);
        }
      } catch (aiErr) {
        console.warn("AI Analysis failed, proceeding with manual evaluation only.", aiErr);
      }
      
      // GUARDAR SIEMPRE los datos humanos
      onSave(evaluationData);
      setStep(4);
    } catch (error) {
      console.error("Critical error in processEvaluation:", error);
      alert("Ocurrió un error al procesar el reporte. Inténtelo de nuevo.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-w-5xl mx-auto my-4">
      {/* Vulcan Header Style */}
      <div className="bg-[#003366] p-6 text-white border-b-4 border-[#FFCC00]">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold tracking-tight">VULCAN ENERGY TECHNOLOGY VENEZOLANA, C.A.</h2>
            <p className="text-xs opacity-80 mt-1 uppercase tracking-widest">Formato de Evaluación Mensual de Desempeño - Personal ATO</p>
          </div>
          <div className="text-right print:hidden">
            <span className="bg-white/20 px-3 py-1 rounded text-xs font-mono uppercase">PASO {step} / 4</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
            <h4 className="text-lg font-bold text-slate-800 border-b pb-2">Configuración Inicial</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Persona que Evalúa (Autorizada)</label>
                <select 
                  value={evaluador} 
                  onChange={e => setEvaluador(e.target.value)} 
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#003366] font-bold text-[#003366]"
                >
                  {AUTHORIZED_EVALUATORS.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ USUARIO AUTORIZADO</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Campo Operativo</label>
                <input value={campo} onChange={e => setCampo(e.target.value)} className="w-full p-3 border rounded-xl bg-slate-50" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Mes de Evaluación</label>
                <input value={mes} onChange={e => setMes(e.target.value)} className="w-full p-3 border rounded-xl bg-slate-50" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Área</label>
                <div className="flex space-x-4 mt-2">
                  <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-100 flex-1">
                    <input type="radio" checked={area === 'Operativa'} onChange={() => setArea('Operativa')} className="w-4 h-4 text-[#003366]" />
                    <span className="text-xs font-black uppercase text-slate-600">Operativa</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer bg-slate-50 p-3 rounded-xl border border-slate-100 flex-1">
                    <input type="radio" checked={area === 'Administrativa'} onChange={() => setArea('Administrativa')} className="w-4 h-4 text-[#003366]" />
                    <span className="text-xs font-black uppercase text-slate-600">Administrativa</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="pt-6 flex justify-end">
              <button onClick={() => setStep(2)} className="bg-[#003366] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#002244] shadow-lg shadow-blue-900/20 transition-all">
                Ir a Matriz de Desempeño →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-end border-b pb-2">
              <h4 className="text-lg font-bold text-slate-800">I. MATRIZ TÉCNICA Y OPERACIONAL</h4>
              <div className={`text-xs font-black px-3 py-1 rounded-full ${criteriaPending > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {criteriaPending > 0 ? `PENDIENTES: ${criteriaPending}` : 'LISTO PARA CONTINUAR'}
              </div>
            </div>

            <div className="overflow-x-auto border rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest w-1/4">Criterio Vulcan</th>
                    <th className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Descripción Operativa</th>
                    <th className="px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest w-32 text-center">Puntuación</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {criteria.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#003366] uppercase text-[11px] leading-tight">{c.name}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs italic">{c.description}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center space-x-1">
                          {[1, 2, 3, 4, 5].map(v => (
                            <button
                              key={v}
                              onClick={() => handleScoreChange(c.id, v)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border-2 transition-all ${c.score === v ? 'bg-[#003366] text-white border-[#003366] scale-110 shadow-md' : 'bg-white text-slate-300 border-slate-100 hover:border-[#003366] hover:text-[#003366]'}`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#001a33] text-white font-bold">
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-right text-[10px] uppercase tracking-[0.2em] opacity-60">Total Puntos Acumulados:</td>
                    <td className="px-6 py-4 text-center text-xl text-[#FFCC00]">{totalPuntos}</td>
                  </tr>
                  <tr className="bg-[#003366]">
                    <td colSpan={2} className="px-6 py-4 text-right text-[10px] uppercase tracking-[0.2em] opacity-60">Porcentaje de Desempeño:</td>
                    <td className="px-6 py-4 text-center text-xl text-white">{porcentajeDesempeño.toFixed(1)}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {criteriaPending > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <p className="text-xs font-bold text-amber-700 uppercase">Debes calificar los {criteriaPending} criterios faltantes para poder continuar.</p>
              </div>
            )}

            <div className="pt-6 flex justify-between">
              <button onClick={() => setStep(1)} className="text-slate-400 font-bold hover:text-slate-600 uppercase text-xs tracking-widest">Regresar</button>
              <button 
                onClick={() => setStep(3)} 
                disabled={criteriaPending > 0}
                className={`bg-[#003366] text-white px-8 py-3 rounded-xl font-bold transition-all ${criteriaPending > 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#002244] shadow-lg shadow-blue-900/10'}`}
              >
                Siguiente Paso →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h4 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">II. OBSERVACIONES DEL EVALUADOR ({evaluador})</h4>
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Indique hallazgos específicos, incidentes o felicitaciones..."
                className="w-full h-32 p-4 border-2 rounded-2xl bg-slate-50 focus:ring-4 focus:ring-[#003366]/5 focus:border-[#003366] outline-none transition-all"
              ></textarea>
            </div>

            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200">
              <h4 className="text-lg font-bold text-slate-800 border-b pb-2 mb-6 uppercase tracking-tight">III. CONDICIÓN DEL BONO MENSUAL</h4>
              
              <div className={`mb-6 p-4 rounded-2xl border-2 text-center ${increaseInfo.color}`}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">Sugerencia del Sistema</p>
                <p className="text-xl font-black">{increaseInfo.text}</p>
                <p className="text-[10px] font-bold mt-1 uppercase">{increaseInfo.note}</p>
              </div>

              {increaseInfo.requiresAuth ? (
                <div className="bg-white p-6 rounded-2xl border-2 border-indigo-200 shadow-sm text-center">
                  <p className="text-xs font-black text-indigo-800 uppercase mb-2">⚠ REQUIERE AUTORIZACIÓN DEL JEFE</p>
                  <p className="text-sm text-slate-600">Este bono está en el rango máximo (98-100%) y será enviado a <strong>{BONUS_APPROVER}</strong> para su firma digital.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.values(BonusStatus).filter(s => s !== BonusStatus.PendingAuth).map(status => (
                    <button
                      key={status}
                      onClick={() => setBono(status)}
                      className={`p-4 rounded-xl border-2 text-xs font-black uppercase transition-all ${bono === status ? 'bg-[#003366] text-white border-[#003366] shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-6 flex justify-between items-center">
              <button onClick={() => setStep(2)} className="text-slate-400 font-bold hover:text-slate-600 uppercase text-xs tracking-widest">Matriz Técnica</button>
              <div className="flex flex-col items-end">
                {criteriaPending > 0 && <span className="text-[10px] font-bold text-rose-500 mb-2 uppercase">Faltan criterios por puntuar</span>}
                <button 
                  onClick={processEvaluation} 
                  disabled={analyzing || criteriaPending > 0}
                  className={`bg-[#FFCC00] text-[#003366] px-12 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all ${analyzing || criteriaPending > 0 ? 'opacity-30 cursor-wait' : 'hover:scale-105 active:scale-95'}`}
                >
                  {analyzing ? 'PROCESANDO REPORTE VULCAN...' : 'FINALIZAR REPORTE VULCAN'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in zoom-in duration-500">
            <div className="text-center bg-emerald-50 p-10 rounded-[40px] border border-emerald-100 shadow-inner">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg border-4 border-white">✓</div>
              <h4 className="text-3xl font-black text-emerald-900 uppercase tracking-tighter">Reporte Consolidado</h4>
              <p className="text-emerald-700 font-bold text-sm mt-1">EVALUADO POR: {evaluador}</p>
              <div className="mt-4 inline-block bg-white px-6 py-2 rounded-full border border-emerald-200 text-emerald-600 font-black text-xl">
                {porcentajeDesempeño.toFixed(1)}%
              </div>
            </div>

            <div className={`p-8 rounded-[32px] border-4 shadow-xl ${increaseInfo.color}`}>
              <h5 className="font-black text-[10px] uppercase tracking-[0.3em] mb-2 opacity-60">Status de Ajuste Salarial</h5>
              <p className="text-3xl font-black tracking-tighter">{increaseInfo.text}</p>
              <div className="mt-4 pt-4 border-t border-current border-opacity-10">
                 <p className="text-xs font-bold uppercase">{increaseInfo.note}</p>
                 {increaseInfo.requiresAuth && (
                   <p className="mt-2 text-[10px] font-black bg-white/50 inline-block px-3 py-1 rounded-full uppercase">Pendiente de Firma: {BONUS_APPROVER}</p>
                 )}
              </div>
            </div>

            {aiResult ? (
              <div className="bg-white border-2 border-slate-100 p-8 rounded-[40px] space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b pb-4">
                  <h5 className="font-black text-slate-800 text-sm uppercase tracking-widest">Insights Estratégicos IA</h5>
                  <span className="text-[10px] font-black text-[#003366] bg-slate-100 px-3 py-1 rounded-full uppercase">Vulcan Intelligence</span>
                </div>
                <p className="text-slate-600 italic border-l-8 border-[#003366] pl-6 py-2 text-sm leading-relaxed">{aiResult.conclusion}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Plan de Objetivos SMART</h6>
                    <ul className="text-xs space-y-3">
                      {aiResult.smartObjectives.map((obj, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-[#003366] mr-3 font-black">0{i+1}.</span>
                          <span className="text-slate-700 font-medium">{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex flex-col justify-center">
                    <h6 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Recomendación Técnica</h6>
                    <p className="text-sm font-bold text-indigo-900 leading-snug">{aiResult.trainingRecommendation}</p>
                  </div>
                </div>
              </div>
            ) : (
               <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-[40px] text-center">
                  <p className="text-slate-400 text-xs font-bold uppercase">Análisis de IA no disponible en este momento</p>
                  <p className="text-slate-400 text-[10px] mt-1">El reporte técnico ha sido guardado correctamente.</p>
               </div>
            )}

            <div className="flex justify-center space-x-6 pt-6 print:hidden">
              <button onClick={onClose} className="px-8 py-3 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-[#003366] transition-colors">Volver a Nómina</button>
              <button onClick={() => window.print()} className="bg-[#003366] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:scale-105 active:scale-95 transition-all">
                Generar Documento PDF 🖨
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationForm;
