
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

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

const EvaluationForm: React.FC<EvaluationFormProps> = ({ employee, evaluatorName, onClose, onSave }) => {
  const currentYear = new Date().getFullYear();
  const currentMonthName = new Date().toLocaleString('es-ES', { month: 'long' }).toLowerCase();

  const [step, setStep] = useState(1);
  const [campo, setCampo] = useState('Cariña');
  const [mes, setMes] = useState(currentMonthName);
  const [anio, setAnio] = useState(currentYear.toString());
  const [area, setArea] = useState<'Operativa' | 'Administrativa'>('Operativa');
  const [criteria, setCriteria] = useState<TechnicalCriterion[]>(
    VULCAN_CRITERIA.map(c => ({ ...c, score: 0 }))
  );
  const [observaciones, setObservaciones] = useState('');
  const [bono, setBono] = useState<BonusStatus>(BonusStatus.Approved);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);

  const yearsOptions = useMemo(() => {
    return [currentYear - 1, currentYear, currentYear + 1].map(String);
  }, [currentYear]);

  const totalPuntos = criteria.reduce((acc, curr) => acc + curr.score, 0);
  const criteriaPending = criteria.filter(c => c.score === 0).length;
  
  const promedioFinalStr = totalPuntos > 0 ? (totalPuntos / criteria.length).toFixed(2) : "0.00";
  const promedioFinalNum = parseFloat(promedioFinalStr);
  const porcentajeDesempeño = (promedioFinalNum / 5) * 100;

  const getSalaryIncreaseRecommendation = (percentage: number) => {
    if (percentage >= 98) return { text: "Incremento del 20% o más", note: "Sujeto a aprobación de Jefe", color: "text-indigo-600 bg-indigo-50 border-indigo-200", requiresAuth: true };
    if (percentage >= 88) return { text: "Incremento del 15%", note: "Desempeño Sobresaliente", color: "text-emerald-600 bg-emerald-50 border-emerald-200", requiresAuth: false };
    if (percentage >= 80) return { text: "Incremento del 10%", note: "Cumple Expectativas", color: "text-blue-600 bg-blue-50 border-blue-200", requiresAuth: false };
    return { text: "No recibe beneficio", note: "Puntuación insuficiente (inferior al 80%)", color: "text-rose-600 bg-rose-50 border-rose-200", requiresAuth: false };
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
        año: anio,
        evaluador: evaluatorName,
        cargoEvaluador: "Evaluador Autorizado",
        areaDesempeño: area,
        criteria,
        observaciones,
        condicionBono: porcentajeDesempeño < 80 ? BonusStatus.NotApproved : (increaseInfo.requiresAuth ? BonusStatus.PendingAuth : bono),
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
    <div className="bg-white rounded-3xl lg:rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden max-w-5xl mx-auto my-0 lg:my-4 animate-in fade-in duration-500">
      <div className="bg-[#003366] p-6 lg:p-8 text-white border-b-8 border-[#FFCC00]">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div>
            <h2 className="text-xl lg:text-2xl font-black tracking-tight">VULCAN EVALUATION SYSTEM</h2>
            <p className="text-[9px] opacity-60 mt-1 uppercase tracking-[0.2em] font-bold">Registro de Desempeño Operativo</p>
          </div>
          <div className="text-left lg:text-right border-t lg:border-t-0 pt-4 lg:pt-0 border-white/10">
            <p className="text-[8px] font-black uppercase opacity-40 mb-1">Candidato a Evaluar:</p>
            <p className="text-base lg:text-lg font-black uppercase text-[#FFCC00] truncate">{employee.name}</p>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-10">
        {step === 1 && (
          <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-top-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Evaluador de Campo</label>
                <div className="p-4 bg-slate-50 rounded-2xl border-2 border-[#003366]/5 text-[#003366] font-black uppercase text-sm">
                   {evaluatorName}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Área de Trabajo</label>
                <div className="flex gap-2">
                   <button onClick={() => setArea('Operativa')} className={`flex-1 p-3 lg:p-4 rounded-2xl border-2 font-black uppercase text-[10px] transition-all ${area === 'Operativa' ? 'bg-[#003366] text-white border-[#003366]' : 'bg-slate-50 text-slate-400 border-transparent'}`}>Operativa</button>
                   <button onClick={() => setArea('Administrativa')} className={`flex-1 p-3 lg:p-4 rounded-2xl border-2 font-black uppercase text-[10px] transition-all ${area === 'Administrativa' ? 'bg-[#003366] text-white border-[#003366]' : 'bg-slate-50 text-slate-400 border-transparent'}`}>Administrativa</button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estación / Instalación</label>
                <input 
                  value={campo} 
                  onChange={e => setCampo(e.target.value.toUpperCase())} 
                  className="w-full p-4 border-2 border-slate-50 rounded-2xl bg-slate-50 font-bold uppercase text-[#003366] outline-none focus:border-[#003366] transition-all text-sm"
                  placeholder="ID ESTACIÓN"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mes Reportado</label>
                  <select 
                    value={mes} 
                    onChange={e => setMes(e.target.value)} 
                    className="w-full p-4 border-2 border-slate-50 rounded-2xl bg-slate-50 font-black uppercase text-[#003366] outline-none focus:border-[#003366] cursor-pointer text-sm"
                  >
                    {MESES.map(m => (
                      <option key={m} value={m}>{m.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Año Fiscal</label>
                  <select 
                    value={anio} 
                    onChange={e => setAnio(e.target.value)} 
                    className="w-full p-4 border-2 border-slate-50 rounded-2xl bg-slate-50 font-black uppercase text-[#003366] outline-none focus:border-[#003366] cursor-pointer text-sm"
                  >
                    {yearsOptions.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t flex justify-end">
              <button onClick={() => setStep(2)} className="w-full lg:w-auto bg-[#003366] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-900/10 text-xs">
                Iniciar Matriz Técnica →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="overflow-x-auto border-2 border-slate-50 rounded-3xl bg-white">
              <table className="w-full text-left text-sm min-w-[500px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-5 font-black text-slate-400 text-[9px] uppercase tracking-widest">Criterio Operacional</th>
                    <th className="px-6 py-5 font-black text-slate-400 text-[9px] uppercase tracking-widest text-center">Puntuación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {criteria.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <p className="font-black text-[#003366] uppercase text-[10px] leading-tight mb-1">{c.name}</p>
                        <p className="text-[9px] text-slate-400 italic font-medium leading-tight">{c.description}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center gap-1">
                          {[1, 2, 3, 4, 5].map(v => (
                            <button
                              key={v}
                              onClick={() => handleScoreChange(c.id, v)}
                              className={`w-8 h-8 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center text-[10px] font-black border-2 transition-all ${c.score === v ? 'bg-[#003366] text-white border-[#003366] shadow-md scale-110' : 'bg-white text-slate-200 border-slate-50 hover:border-[#003366] hover:text-[#003366]'}`}
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
            <div className="flex flex-col lg:flex-row justify-between items-center bg-[#001a33] p-6 lg:p-8 rounded-[32px] text-white gap-6">
               <div className="text-center lg:text-left">
                  <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">Puntaje Mensual</p>
                  <p className={`text-4xl lg:text-5xl font-black ${porcentajeDesempeño < 80 ? 'text-rose-400' : 'text-[#FFCC00]'}`}>{porcentajeDesempeño.toFixed(1)}%</p>
               </div>
               <div className="flex w-full lg:w-auto gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 lg:flex-none px-6 py-3 font-black uppercase text-[10px] text-slate-400">Datos</button>
                  <button 
                    disabled={criteriaPending > 0}
                    onClick={() => setStep(3)}
                    className={`flex-1 lg:flex-none px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all text-[10px] ${criteriaPending > 0 ? 'bg-white/10 text-white/20 cursor-not-allowed' : 'bg-[#FFCC00] text-[#003366] hover:scale-105'}`}
                  >
                    Ver Informe →
                  </button>
               </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 lg:space-y-10 animate-in fade-in duration-300">
             <div className="space-y-3">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bitácora de Observaciones</label>
                <textarea 
                  value={observaciones} 
                  onChange={e => setObservaciones(e.target.value)}
                  className="w-full h-32 p-6 border-2 border-slate-50 rounded-[32px] bg-slate-50 focus:border-[#003366] outline-none font-bold text-slate-700 text-sm placeholder:text-slate-200"
                  placeholder="Escriba aquí incidentes o notas adicionales..."
                ></textarea>
             </div>

             <div className={`p-6 lg:p-8 rounded-[32px] border-4 text-center ${increaseInfo.color}`}>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-2">Dictamen de Nómina Sugerido</p>
                <p className="text-xl lg:text-2xl font-black uppercase leading-tight">{increaseInfo.text}</p>
                <p className="text-[9px] font-bold uppercase mt-2 opacity-80">{increaseInfo.note}</p>
             </div>

             <div className="flex flex-col-reverse lg:flex-row justify-between gap-4 pt-6 border-t">
                <button onClick={() => setStep(2)} className="w-full lg:w-auto text-slate-400 font-black uppercase text-[10px] tracking-widest p-4">Ajustar Puntos</button>
                <button 
                  onClick={processEvaluation}
                  disabled={analyzing}
                  className="w-full lg:w-auto bg-[#003366] text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-[1.02] transition-all text-xs"
                >
                  {analyzing ? 'PROCESANDO FIRMA...' : 'AUTORIZAR Y FIRMAR'}
                </button>
             </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 lg:space-y-8 animate-in zoom-in duration-500">
             <div className={`p-8 lg:p-12 rounded-[40px] text-center border-2 ${porcentajeDesempeño < 80 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                <div className={`w-20 h-20 lg:w-24 lg:h-24 rounded-3xl flex items-center justify-center text-white text-3xl lg:text-4xl mx-auto mb-6 shadow-xl border-4 border-white ${porcentajeDesempeño < 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}>
                   {porcentajeDesempeño < 80 ? '!' : '✓'}
                </div>
                <h3 className={`text-2xl lg:text-4xl font-black tracking-tighter uppercase ${porcentajeDesempeño < 80 ? 'text-rose-900' : 'text-emerald-900'}`}>
                   {porcentajeDesempeño < 80 ? 'Atención Requerida' : 'Reporte Consolidado'}
                </h3>
                <p className={`font-black uppercase text-[9px] mt-2 tracking-[0.2em] ${porcentajeDesempeño < 80 ? 'text-rose-600' : 'text-emerald-600'}`}>
                   Periodo: {mes.toUpperCase()} {anio}
                </p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                <div className="p-6 lg:p-8 bg-white border-2 rounded-[32px] border-slate-50">
                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-4">Eficiencia del Mes</p>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black text-slate-700 uppercase">Resultado Técnico</span>
                         <span className={`text-xl lg:text-2xl font-black ${porcentajeDesempeño < 80 ? 'text-rose-600' : 'text-[#003366]'}`}>{porcentajeDesempeño.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                         <div className={`h-full transition-all duration-1000 ${porcentajeDesempeño < 80 ? 'bg-rose-500' : 'bg-[#003366]'}`} style={{ width: `${porcentajeDesempeño}%` }}></div>
                      </div>
                   </div>
                </div>
                <div className={`p-6 lg:p-8 rounded-[32px] text-white flex flex-col justify-center ${porcentajeDesempeño < 80 ? 'bg-rose-900' : 'bg-[#003366]'}`}>
                   <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-2">Estatus Sugerido</p>
                   <p className={`text-xl lg:text-2xl font-black uppercase ${porcentajeDesempeño < 80 ? 'text-white' : 'text-[#FFCC00]'}`}>{increaseInfo.text}</p>
                   <p className="text-[9px] mt-1 opacity-60 uppercase font-black">{increaseInfo.note}</p>
                </div>
             </div>

             <div className="flex flex-col sm:flex-row justify-center gap-3 lg:gap-6 pt-6 print:hidden">
                <button onClick={onClose} className="w-full sm:w-auto px-8 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest hover:text-[#003366] transition-all">Siguiente Empleado</button>
                <button onClick={() => window.print()} className="w-full sm:w-auto bg-[#003366] text-white px-10 py-4 lg:py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 text-xs">🖨 Imprimir Copia</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationForm;
