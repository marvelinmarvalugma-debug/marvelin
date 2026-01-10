
import React, { useState } from 'react';
import { Employee, FullEvaluation, UserRole } from '../types';
import { generatePerformanceInsights } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { VulcanDB } from '../services/storageService';
import { t, Language } from '../services/translations';

interface EmployeeDetailsProps {
  employee: Employee;
  evaluations?: FullEvaluation[];
  onBack: () => void;
  onEvaluate?: (employee: Employee) => void;
  onEditEvaluation?: (evaluation: FullEvaluation) => void;
  onPrintEvaluation?: (evaluation: FullEvaluation) => void;
  onDelete?: (id: string) => void;
  currentUserRole?: UserRole;
  lang: Language;
}

export default function EmployeeDetails({ 
  employee, 
  evaluations = [], 
  onBack, 
  onEvaluate, 
  onEditEvaluation, 
  onPrintEvaluation,
  onDelete,
  currentUserRole, 
  lang 
}: EmployeeDetailsProps) {
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{summary: string, strengths: string[], growthAreas: string[]} | null>(null);

  const handleGenerateInsights = async () => {
    setLoadingAI(true);
    const insights = await generatePerformanceInsights(employee);
    setAiAnalysis(insights);
    setLoadingAI(false);
  };

  const employeeHistory = evaluations
    .filter(ev => ev.employeeId === employee.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const isGerente = currentUserRole === UserRole.Gerente;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-slate-500 hover:text-[#003366] font-black uppercase text-[10px] tracking-widest transition-colors">← {t('back_to_list', lang)}</button>
        <div className="flex gap-2">
          {onDelete && (
            <button 
              onClick={() => onDelete(employee.id)}
              className="bg-rose-50 text-rose-600 border-2 border-rose-100 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all"
            >
              🗑️ {t('delete_employee', lang)}
            </button>
          )}
          {onEvaluate && (
            <button 
              onClick={() => onEvaluate(employee)}
              className="bg-[#003366] text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:scale-105 active:scale-95 transition-all"
            >
              {t('new_evaluation', lang)} 📝
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 text-center flex flex-col justify-start">
          <div>
            <img src={employee.photo} alt={employee.name} className="w-32 h-32 rounded-3xl mx-auto border-4 border-slate-50 grayscale shadow-lg object-cover" />
            <h3 className="mt-6 text-xl font-black text-slate-800 uppercase leading-tight tracking-tighter">{employee.name}</h3>
            <p className="text-[#003366] font-black text-xs uppercase tracking-widest mt-1">{employee.role}</p>
            <div className="flex justify-center gap-2 mt-2">
              <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg">V-{employee.idNumber}</span>
              <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${employee.department === 'ATO' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {employee.department}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('ia_insights', lang)}</h4>
              {!aiAnalysis && <button onClick={handleGenerateInsights} disabled={loadingAI} className="bg-[#003366] text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-[#002244] transition-all">{loadingAI ? t('analyzing', lang) : t('gen_feedback', lang)}</button>}
            </div>
            {aiAnalysis ? (
              <div className="space-y-4 animate-in slide-in-from-bottom-2">
                <p className="p-5 bg-slate-50 border-l-4 border-[#003366] text-slate-700 italic text-[11px] rounded-r-2xl leading-relaxed">"{aiAnalysis.summary}"</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-emerald-50 rounded-[24px] border border-emerald-100">
                    <h5 className="font-black text-[9px] text-emerald-800 uppercase mb-3 tracking-widest">
                      {lang === 'es' ? 'Fortalezas Identificadas' : 'Identified Strengths'}
                    </h5>
                    <ul className="text-[10px] space-y-2 text-slate-600 font-bold">
                      {aiAnalysis.strengths.map((s, i) => <li key={i} className="flex items-start gap-2"><span>•</span> {s}</li>)}
                    </ul>
                  </div>
                  <div className="p-5 bg-amber-50 rounded-[24px] border border-amber-100">
                    <h5 className="font-black text-[9px] text-amber-800 uppercase mb-3 tracking-widest">
                      {lang === 'es' ? 'Oportunidades de Mejora' : 'Growth Opportunities'}
                    </h5>
                    <ul className="text-[10px] space-y-2 text-slate-600 font-bold">
                      {aiAnalysis.growthAreas.map((g, i) => <li key={i} className="flex items-start gap-2"><span>•</span> {g}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ) : <p className="text-center py-10 text-slate-300 text-[9px] font-black uppercase tracking-[0.2em]">{lang === 'es' ? 'Ejecute el análisis de IA' : 'Run AI analysis for insights'}</p>}
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b pb-4">{t('eval_history', lang)}</h4>
            {employeeHistory.length === 0 ? (
              <p className="text-center py-8 text-slate-300 text-[10px] font-black uppercase">{t('no_evals', lang)}</p>
            ) : (
              <div className="space-y-3">
                {employeeHistory.map((ev, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#003366] hover:bg-white transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-[#003366] text-[#FFCC00] rounded-2xl flex items-center justify-center font-black text-sm shadow-inner group-hover:scale-110 transition-transform">
                        📄
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#003366] uppercase">{ev.mes} {ev.año}</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{lang === 'es' ? 'Evaluador' : 'Evaluator'}: {ev.evaluador}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-right mr-2">
                            {isGerente && (
                              <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${
                                  ev.condicionBono.includes('Aprobado') ? 'bg-emerald-100 text-emerald-700' : 
                                  ev.condicionBono.includes('Pendiente') ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                  {ev.condicionBono}
                              </span>
                            )}
                            <p className="text-[8px] text-slate-300 font-black mt-2 uppercase tracking-widest">{lang === 'es' ? 'REGISTRADO' : 'REGISTERED'}: {ev.date}</p>
                        </div>
                        <div className="flex gap-1">
                          {onPrintEvaluation && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onPrintEvaluation(ev); }}
                              className="p-3 bg-white border-2 border-slate-100 rounded-xl hover:border-[#003366] hover:text-[#003366] transition-all shadow-sm"
                              title={t('print_acta', lang)}
                            >
                              🖨️
                            </button>
                          )}
                          {onEditEvaluation && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onEditEvaluation(ev); }}
                              className="p-3 bg-white border-2 border-slate-100 rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
                              title={t('edit_eval', lang)}
                            >
                              ✏️
                            </button>
                          )}
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
