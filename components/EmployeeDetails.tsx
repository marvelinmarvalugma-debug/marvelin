
import React, { useState, useMemo } from 'react';
import { Employee, FullEvaluation, UserRole } from '../types';
import { generatePerformanceInsights } from '../services/geminiService';
// Removed duplicate Radar import to fix compilation error
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { VulcanDB } from '../services/storageService';

interface EmployeeDetailsProps {
  employee: Employee;
  evaluations?: FullEvaluation[];
  onBack: () => void;
  onEvaluate?: (employee: Employee) => void;
  onEditEvaluation?: (evaluation: FullEvaluation) => void;
  currentUserRole?: UserRole;
}

export default function EmployeeDetails({ employee, evaluations = [], onBack, onEvaluate, onEditEvaluation, currentUserRole }: EmployeeDetailsProps) {
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{summary: string, strengths: string[], growthAreas: string[]} | null>(null);

  const radarData = employee.kpis.map(k => ({
    subject: k.name,
    A: k.score,
    fullMark: 100,
  }));

  const handleGenerateInsights = async () => {
    setLoadingAI(true);
    const insights = await generatePerformanceInsights(employee);
    setAiAnalysis(insights);
    setLoadingAI(false);
  };

  const overallScore = Math.round(employee.kpis.reduce((sum, kpi) => sum + kpi.score * (kpi.weight / 100), 0));

  const employeeHistory = evaluations
    .filter(ev => ev.employeeId === employee.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const isDirector = currentUserRole === UserRole.Director;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-slate-500 hover:text-[#003366] font-black uppercase text-[10px] tracking-widest transition-colors">← Volver al Listado</button>
        {onEvaluate && (
          <button 
            onClick={() => onEvaluate(employee)}
            className="bg-[#003366] text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:scale-105 active:scale-95 transition-all"
          >
            Nueva Evaluación 📝
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Perfil del Empleado */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 text-center flex flex-col justify-between">
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
          <div className="mt-8 p-6 rounded-[24px] bg-[#001a33] text-white shadow-2xl shadow-blue-900/20">
            <p className="text-slate-400 text-[9px] uppercase font-black tracking-[0.2em] mb-1">Eficacia Técnica Promedio</p>
            <h4 className="text-5xl font-black text-[#FFCC00]">{overallScore}%</h4>
          </div>
        </div>

        {/* Análisis y Gráficos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 border-b pb-4">Matriz de Competencias Radar</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 9, fontWeight: '800'}} />
                  <Radar name={employee.name} dataKey="A" stroke="#003366" fill="#003366" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IA Performance Insights</h4>
              {!aiAnalysis && <button onClick={handleGenerateInsights} disabled={loadingAI} className="bg-[#003366] text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-[#002244] transition-all">{loadingAI ? 'Analizando...' : 'Generar Feedback'}</button>}
            </div>
            {aiAnalysis ? (
              <div className="space-y-4 animate-in slide-in-from-bottom-2">
                <p className="p-5 bg-slate-50 border-l-4 border-[#003366] text-slate-700 italic text-[11px] rounded-r-2xl leading-relaxed">"{aiAnalysis.summary}"</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-emerald-50 rounded-[24px] border border-emerald-100">
                    <h5 className="font-black text-[9px] text-emerald-800 uppercase mb-3 tracking-widest">Fortalezas Identificadas</h5>
                    <ul className="text-[10px] space-y-2 text-slate-600 font-bold">
                      {aiAnalysis.strengths.map((s, i) => <li key={i} className="flex items-start gap-2"><span>•</span> {s}</li>)}
                    </ul>
                  </div>
                  <div className="p-5 bg-amber-50 rounded-[24px] border border-amber-100">
                    <h5 className="font-black text-[9px] text-amber-800 uppercase mb-3 tracking-widest">Oportunidades de Mejora</h5>
                    <ul className="text-[10px] space-y-2 text-slate-600 font-bold">
                      {aiAnalysis.growthAreas.map((g, i) => <li key={i} className="flex items-start gap-2"><span>•</span> {g}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ) : <p className="text-center py-10 text-slate-300 text-[9px] font-black uppercase tracking-[0.2em]">Ejecute el análisis de IA para ver recomendaciones estratégicas</p>}
          </div>

          {/* Historial de Evaluaciones Almacenadas */}
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b pb-4">Historial de Evaluaciones</h4>
            {employeeHistory.length === 0 ? (
              <p className="text-center py-8 text-slate-300 text-[10px] font-black uppercase">No se registran evaluaciones en la base de datos local.</p>
            ) : (
              <div className="space-y-3">
                {employeeHistory.map((ev, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#003366] hover:bg-white transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-[#003366] text-[#FFCC00] rounded-2xl flex items-center justify-center font-black text-sm shadow-inner group-hover:scale-110 transition-transform">
                        {(ev.promedioFinal * 20).toFixed(0)}%
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#003366] uppercase">{ev.mes} {ev.año}</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Evaluador: {ev.evaluador}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            {isDirector && (
                              <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${
                                  ev.condicionBono.includes('Aprobado') ? 'bg-emerald-100 text-emerald-700' : 
                                  ev.condicionBono.includes('Pendiente') ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                  {ev.condicionBono}
                              </span>
                            )}
                            <p className="text-[8px] text-slate-300 font-black mt-2 uppercase tracking-widest">REGISTRADO: {ev.date}</p>
                        </div>
                        {onEditEvaluation && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onEditEvaluation(ev); }}
                            className="p-3 bg-white border-2 border-slate-100 rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
                            title="Editar esta evaluación"
                          >
                            ✏️
                          </button>
                        )}
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
