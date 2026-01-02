
import React, { useState, useMemo, useEffect } from 'react';
import { Employee, FullEvaluation, BonusStatus, TechnicalCriterion, Department, UserRole, SALARY_APPROVERS } from '../types';
import { ATO_CRITERIA, VULCAN_CRITERIA } from '../constants';
import { VulcanDB } from '../services/storageService';
import { t, Language } from '../services/translations';

interface EvaluationFormProps {
  employee: Employee;
  evaluatorName: string;
  initialData?: FullEvaluation;
  onClose: () => void;
  onSave: (evaluation: FullEvaluation) => void;
  lang: Language;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MONTHS_EN = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

export default function EvaluationForm({ employee, evaluatorName, initialData, onClose, onSave, lang }: EvaluationFormProps) {
  const [step, setStep] = useState(1);
  const [campo, setCampo] = useState(initialData?.campo || 'CARIÑA');
  const [mes, setMes] = useState(initialData?.mes || new Date().toLocaleString('es-ES', { month: 'long' }).toLowerCase());
  const [anio, setAnio] = useState(initialData?.año || new Date().getFullYear().toString());

  const user = useMemo(() => VulcanDB.getUser(evaluatorName), [evaluatorName]);
  const isDirector = user?.role === UserRole.Director;
  
  const isVulcan = employee.department === Department.VULCAN;

  const [criteria, setCriteria] = useState<TechnicalCriterion[]>([]);
  const [observaciones, setObservaciones] = useState(initialData?.observaciones || '');
  const [manualIncrement, setManualIncrement] = useState(initialData?.incrementoSalarial || '');

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
    if (!initialData) {
      if (!isVulcan) { if (porcentajeDesempeño < 100) finalBonusStatus = BonusStatus.NotApproved; }
      else if (porcentajeDesempeño < 80) finalBonusStatus = BonusStatus.NotApproved;
    }

    const evaluationData: FullEvaluation = {
      id: initialData?.id,
      employeeId: employee.id,
      campo, mes, año: anio, evaluador: initialData?.evaluador || evaluatorName, 
      cargoEvaluador: initialData?.cargoEvaluador || (isDirector ? "Dirección General" : "Supervisor / Evaluador"),
      areaDesempeño: isVulcan ? 'Administrativa' : 'Operativa', 
      criteria, observaciones,
      condicionBono: finalBonusStatus,
      recomendacionSalarial: "Sugerida",
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
      
      <div className="bg-[#003366] p-8 text-white border-b-8 border-[#FFCC00] print:hidden flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="bg-white p-3 rounded-xl font-black text-[#003366] text-xl shadow-lg">VULCAN</div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter">
              {initialData ? t('edit_form_title', lang) : t('form_title', lang)} {employee.department}
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
                 <label className="text-[10px] font-black text-[#003366] uppercase tracking-widest">{t('location', lang)}</label>
                 <input value={campo} onChange={e => setCampo(e.target.value.toUpperCase())} className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black uppercase" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-[#003366] uppercase tracking-widest">{t('month', lang)}</label>
                   <select value={mes} onChange={e => setMes(e.target.value)} className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black uppercase text-xs">
                     {MESES.map((m, idx) => <option key={m} value={m}>{lang === 'es' ? m.toUpperCase() : MONTHS_EN[idx].toUpperCase()}</option>)}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-[#003366] uppercase tracking-widest">{t('year', lang)}</label>
                   <input value={anio} onChange={e => setAnio(e.target.value)} disabled={!isDirector} className="w-full p-4 bg-slate-100 border-2 border-slate-200 rounded-2xl font-black text-center" />
                 </div>
               </div>
            </div>
            <button onClick={() => setStep(2)} className="w-full py-5 bg-[#003366] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
              {t('continue', lang)} →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in">
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-[10px] text-amber-800 font-bold uppercase text-center mb-4">
               {t('score_guide', lang)}
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
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">{t('technical_matrix', lang)} ATO</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-center">{t('score', lang)}</th>
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
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1">{t('average', lang)}</p>
                    <p className="text-2xl font-black text-[#FFCC00]">{promedioFinalNum}</p>
                 </div>
                 <div className="text-center border-l border-white/10 pl-8">
                    <p className="text-[8px] font-black uppercase text-slate-400 mb-1">{t('total_efficacy', lang)}</p>
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
                {t('continue', lang)} →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
             <div className="space-y-3">
                <h4 className="text-[10px] font-black text-[#003366] uppercase tracking-widest">{t('observations', lang)}</h4>
                <textarea 
                  value={observaciones} 
                  onChange={e => setObservaciones(e.target.value)}
                  className="w-full h-32 p-6 bg-slate-50 border-2 border-slate-100 rounded-[32px] outline-none focus:border-[#003366] text-sm"
                  placeholder="..."
                />
             </div>

             <div className="flex justify-end gap-3 pt-6">
                <button onClick={() => setStep(2)} className="px-8 py-4 font-black uppercase text-[10px] text-slate-400">
                  {lang === 'es' ? 'Volver' : 'Back'}
                </button>
                <button onClick={processEvaluation} className="bg-[#003366] text-white px-16 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl">
                  {initialData ? t('save_changes', lang) : t('finish_reg', lang)}
                </button>
             </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in zoom-in space-y-10 py-10 print:py-0">
             <div className="max-w-4xl mx-auto bg-white p-12 border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0 print:w-full print:max-w-full overflow-hidden">
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-8">
                   <div className="flex gap-4 items-center">
                     <div className="w-12 h-12 bg-[#003366] text-white flex items-center justify-center font-black text-xs rounded-lg">VULCAN</div>
                     <div>
                        <h1 className="text-2xl font-black text-[#003366] tracking-tighter">Vulcan</h1>
                        <p className="text-[7px] font-black text-slate-500 tracking-widest uppercase">VULCAN ENERGY TECHNOLOGY VENEZOLANA, C.A.</p>
                     </div>
                   </div>
                   <div className="text-right text-[9px] font-black text-slate-800 leading-tight">
                      <p className="bg-slate-100 px-2 py-1 mb-1 border border-slate-200 uppercase">{t('official_acta', lang)}</p>
                      <p className="text-[#003366] font-black">NIVEL: PERSONAL {employee.department}</p>
                   </div>
                </div>

                <table className="w-full border-collapse border border-slate-800 text-[10px] mb-8">
                  <tbody>
                    <tr>
                      <td className="border border-slate-800 p-2 bg-slate-50 font-black w-1/4 uppercase">{t('worker', lang)}</td>
                      <td className="border border-slate-800 p-2 w-1/4 uppercase">{employee.name}</td>
                      <td className="border border-slate-800 p-2 bg-slate-50 font-black w-1/4 uppercase">{t('id_card', lang)}</td>
                      <td className="border border-slate-800 p-2 w-1/4">V-{employee.idNumber}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-2 bg-slate-50 font-black uppercase">{t('role', lang)}</td>
                      <td className="border border-slate-800 p-2 uppercase">{employee.role}</td>
                      <td className="border border-slate-800 p-2 bg-slate-50 font-black uppercase">{t('location', lang)}</td>
                      <td className="border border-slate-800 p-2 uppercase">{campo}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-800 p-2 bg-slate-50 font-black uppercase">{t('month', lang)}</td>
                      <td className="border border-slate-800 p-2 uppercase font-black">{mes} {anio}</td>
                      <td className="border border-slate-800 p-2 bg-slate-50 font-black uppercase">{t('report_date', lang)}</td>
                      <td className="border border-slate-800 p-2 uppercase">{new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US')}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="mb-8">
                  <h4 className="text-[10px] font-black uppercase mb-3 bg-slate-800 text-white p-2 text-center tracking-widest">I. {lang === 'es' ? 'MATRIZ DE RENDIMIENTO' : 'PERFORMANCE MATRIX'}</h4>
                  <table className="w-full border-collapse border border-slate-800 text-[9px]">
                    <thead className="bg-slate-100 font-black">
                      <tr>
                        <th className="border border-slate-800 p-2 text-left uppercase w-2/5">Item</th>
                        <th className="border border-slate-800 p-2 text-left uppercase w-2/5">{lang === 'es' ? 'Descripción' : 'Description'}</th>
                        <th className="border border-slate-800 p-2 text-center uppercase">{t('score', lang)} (1-5)</th>
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
                        <td colSpan={2} className="border border-slate-800 p-3 text-right uppercase">{t('total_efficacy', lang)}:</td>
                        <td className="border border-slate-800 p-3 text-center text-sm text-[#003366]">{porcentajeDesempeño.toFixed(1)}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-20 text-center mt-20">
                   <div className="space-y-1">
                      <div className="border-t border-slate-800 pt-2 mx-auto w-3/4">
                        <p className="text-[9px] font-black uppercase">{initialData?.evaluador || evaluatorName}</p>
                        <p className="text-[7px] text-slate-500 uppercase">{t('supervisor_sign', lang)}</p>
                      </div>
                   </div>
                   <div className="space-y-1">
                      <div className="border-t border-slate-800 pt-2 mx-auto w-3/4">
                        <p className="text-[9px] font-black uppercase">{employee.name}</p>
                        <p className="text-[7px] text-slate-500 uppercase">{t('worker_sign', lang)}</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="flex justify-center gap-6 mt-10 print:hidden">
                <button onClick={onClose} className="px-12 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">{lang === 'es' ? 'Cerrar' : 'Close'}</button>
                <button onClick={() => window.print()} className="px-20 py-5 bg-[#003366] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl flex items-center gap-3">
                  🖨️ {t('print_acta', lang)}
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
