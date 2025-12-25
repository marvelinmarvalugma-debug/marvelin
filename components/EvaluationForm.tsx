
import React, { useState } from 'react';
import { Employee, FullEvaluation, BonusStatus, TechnicalCriterion } from '../types';
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
  const [area, setArea] = useState<'Operativa' | 'Administrativa'>('Operativa');
  const [criteria, setCriteria] = useState<TechnicalCriterion[]>(
    VULCAN_CRITERIA.map(c => ({ ...c, score: 0 }))
  );
  const [observaciones, setObservaciones] = useState('');
  const [bono, setBono] = useState<BonusStatus>(BonusStatus.Approved);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  const totalPuntos = criteria.reduce((acc, curr) => acc + curr.score, 0);
  const promedioFinalStr = totalPuntos > 0 ? (totalPuntos / criteria.length).toFixed(2) : "0.00";
  const promedioFinalNum = parseFloat(promedioFinalStr);
  const porcentajeDesempeño = (promedioFinalNum / 5) * 100;

  const getSalaryIncreaseRecommendation = (percentage: number) => {
    if (percentage >= 98) return { text: "Incremento del 20% o más", note: "Sujeto a consideración y aprobación del jefe", color: "text-indigo-600 bg-indigo-50 border-indigo-200" };
    if (percentage >= 88) return { text: "Incremento del 15%", note: "Rango de excelencia operativa", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    if (percentage >= 80) return { text: "Incremento del 10%", note: "Cumple con expectativas superiores", color: "text-blue-600 bg-blue-50 border-blue-200" };
    return { text: "Sin incremento recomendado", note: "Requiere plan de mejora para alcanzar el 80%", color: "text-slate-500 bg-slate-50 border-slate-200" };
  };

  const increaseInfo = getSalaryIncreaseRecommendation(porcentajeDesempeño);

  const handleScoreChange = (id: string, score: number) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, score } : c));
  };

  const processEvaluation = async () => {
    setAnalyzing(true);
    const evaluationData: FullEvaluation = {
      employeeId: employee.id,
      campo,
      mes,
      evaluador: "Admin", // Por defecto
      cargoEvaluador: "Supervisor",
      areaDesempeño: area,
      criteria,
      observaciones,
      condicionBono: bono,
      totalPuntos,
      promedioFinal: promedioFinalNum,
      date: new Date().toISOString().split('T')[0]
    };
    
    const result = await analyzeFullEvaluation(employee, evaluationData);
    if (result) {
      setAiResult(result);
      onSave(evaluationData);
    }
    setAnalyzing(false);
    setStep(4);
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
          <div className="text-right">
            <span className="bg-white/20 px-3 py-1 rounded text-xs font-mono">PASO {step} / 4</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
            <h4 className="text-lg font-bold text-slate-800 border-b pb-2">Información General</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Campo</label>
                <input value={campo} onChange={e => setCampo(e.target.value)} className="w-full p-2 border rounded bg-slate-50 focus:ring-2 focus:ring-[#003366]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Mes de Evaluación</label>
                <input value={mes} onChange={e => setMes(e.target.value)} className="w-full p-2 border rounded bg-slate-50 focus:ring-2 focus:ring-[#003366]" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Trabajador Evaluado</label>
                <div className="p-2 border rounded bg-slate-100 font-medium text-slate-700">{employee.name}</div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Área de Desempeño</label>
                <div className="flex space-x-4 mt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" checked={area === 'Operativa'} onChange={() => setArea('Operativa')} className="text-[#003366]" />
                    <span className="text-sm font-medium">Operativa</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" checked={area === 'Administrativa'} onChange={() => setArea('Administrativa')} className="text-[#003366]" />
                    <span className="text-sm font-medium">Administrativa</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="pt-6 flex justify-end">
              <button onClick={() => setStep(2)} className="bg-[#003366] text-white px-8 py-2 rounded font-bold hover:bg-[#002244] shadow-lg">Continuar a Matriz</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h4 className="text-lg font-bold text-slate-800 border-b pb-2">I. MATRIZ DE EVALUACIÓN TÉCNICA Y OPERACIONAL</h4>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 font-bold text-slate-600 w-1/4">Criterio</th>
                    <th className="px-4 py-3 font-bold text-slate-600">Descripción</th>
                    <th className="px-4 py-3 font-bold text-slate-600 w-32 text-center">Puntos (1-5)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {criteria.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-[#003366]">{c.name}</td>
                      <td className="px-4 py-3 text-slate-500 leading-tight">{c.description}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center space-x-1">
                          {[1, 2, 3, 4, 5].map(v => (
                            <button
                              key={v}
                              onClick={() => handleScoreChange(c.id, v)}
                              className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border transition-all ${c.score === v ? 'bg-[#003366] text-white border-[#003366]' : 'bg-white text-slate-400 hover:border-[#003366]'}`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-right uppercase tracking-wider">Total puntos:</td>
                    <td className="px-4 py-3 text-center text-lg text-[#003366]">{totalPuntos}</td>
                  </tr>
                  <tr className="bg-slate-200">
                    <td colSpan={2} className="px-4 py-3 text-right uppercase tracking-wider">Promedio final:</td>
                    <td className="px-4 py-3 text-center text-lg text-emerald-700">{promedioFinalStr} ({porcentajeDesempeño.toFixed(0)}%)</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="pt-6 flex justify-between">
              <button onClick={() => setStep(1)} className="text-slate-400 font-bold hover:text-slate-600">Regresar</button>
              <button onClick={() => setStep(3)} className="bg-[#003366] text-white px-8 py-2 rounded font-bold">Siguiente</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h4 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">II. OBSERVACIONES DEL SUPERVISOR</h4>
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                placeholder="Indique hallazgos, áreas de mejora o felicitaciones..."
                className="w-full h-32 p-4 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-[#003366] outline-none"
              ></textarea>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <h4 className="text-lg font-bold text-slate-800 border-b pb-2 mb-4">III. CONDICIÓN DEL BONO MENSUAL</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(BonusStatus).map(status => (
                  <button
                    key={status}
                    onClick={() => setBono(status)}
                    className={`p-4 rounded-xl border-2 text-sm font-bold transition-all ${bono === status ? 'bg-[#003366] text-white border-[#003366] shadow-md' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 flex justify-between">
              <button onClick={() => setStep(2)} className="text-slate-400 font-bold hover:text-slate-600">Regresar</button>
              <button 
                onClick={processEvaluation} 
                disabled={analyzing || criteria.some(c => c.score === 0)}
                className={`bg-[#003366] text-white px-10 py-3 rounded-lg font-bold shadow-xl transition-all ${analyzing || criteria.some(c => c.score === 0) ? 'opacity-50' : 'hover:scale-105'}`}
              >
                {analyzing ? 'Procesando...' : 'Finalizar Reporte'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in zoom-in duration-500">
            <div className="text-center bg-emerald-50 p-8 rounded-3xl border border-emerald-100">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-lg">✓</div>
              <h4 className="text-2xl font-bold text-emerald-900">Evaluación Registrada</h4>
              <p className="text-emerald-700 font-medium">Puntaje: {porcentajeDesempeño.toFixed(1)}%</p>
            </div>

            <div className={`p-6 rounded-2xl border-2 ${increaseInfo.color}`}>
              <h5 className="font-black text-sm uppercase mb-1">Ajuste Salarial Propuesto</h5>
              <p className="text-2xl font-bold">{increaseInfo.text}</p>
              <p className="text-xs opacity-80">{increaseInfo.note}</p>
            </div>

            {aiResult && (
              <div className="bg-white border-2 border-slate-100 p-8 rounded-3xl space-y-4">
                <h5 className="font-black text-slate-800 text-xl border-b pb-2">REPORTE IA VULCAN</h5>
                <p className="text-slate-600 italic border-l-4 border-[#003366] pl-4">{aiResult.conclusion}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <h6 className="text-xs font-black text-slate-400 uppercase mb-2">Objetivos</h6>
                    <ul className="text-sm space-y-1">
                      {aiResult.smartObjectives.map((obj, i) => <li key={i}>• {obj}</li>)}
                    </ul>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-xl">
                    <h6 className="text-xs font-black text-indigo-400 uppercase mb-2">Capacitación</h6>
                    <p className="text-sm font-medium">{aiResult.trainingRecommendation}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <button onClick={onClose} className="px-6 py-2 text-slate-400 font-bold">Cerrar</button>
              <button onClick={() => window.print()} className="bg-[#003366] text-white px-8 py-2 rounded font-bold">Imprimir PDF</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationForm;
