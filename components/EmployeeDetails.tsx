
import React, { useState, useMemo } from 'react';
import { Employee, FullEvaluation, UserRole } from '../types';
import { generatePerformanceInsights } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { VulcanDB } from '../services/storageService';

interface EmployeeDetailsProps {
  employee: Employee;
  evaluations?: FullEvaluation[];
  onBack: () => void;
  currentUserRole?: UserRole;
}

export default function EmployeeDetails({ employee, evaluations = [], onBack, currentUserRole }: EmployeeDetailsProps) {
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
      <button onClick={onBack} className="text-slate-500 hover:text-[#003366] font-bold uppercase text-xs tracking-widest transition-colors">← Volver al Listado</button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Perfil del Empleado */}
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 text-center flex flex-col justify-between">
          <div>
            <img src={employee.photo} alt={employee.name} className="w-32 h-32 rounded-full mx-auto border-4 border-slate-50 grayscale shadow-lg" />
            <h3 className="mt-6 text-xl font-black text-slate-800 uppercase leading-tight">{employee.name}</h3>
            <p className="text-[#003366] font-black text-sm uppercase tracking-tighter mt-1">{employee.role}</p>
            <p className="text-slate-400 text-[10px] font-bold uppercase mt-2">V-{employee.idNumber}</p>
          </div>
          <div className="mt-8 p-6 rounded-3xl bg-[#001a33] text-white">
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] mb-1">Score Actual</p>
            <h4 className="text-5xl font-black text-[#FFCC00]">{overallScore}%</h4>
          </div>
        </div>

        {/* Análisis y Gráficos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 border-b pb-4">Matriz de Competencias</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} />
                  <Radar name={employee.name} dataKey="A" stroke="#003366" fill="#003366" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">IA Performance Review</h4>
              {!aiAnalysis && <button onClick={handleGenerateInsights} disabled={loadingAI} className="bg-[#003366] text-white px-5 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-[#002244] transition-all">{loadingAI ? 'Analizando...' : 'Generar Feedback'}</button>}
            </div>
            {aiAnalysis ? (
              <div className="space-y-4 animate-in slide-in-from-bottom-2">
                <p className="p-4 bg-slate-50 border-l-4 border-[#003366] text-slate-700 italic text-sm rounded-r-xl">"{aiAnalysis.summary}"</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <h5 className="font-black text-[10px] text-emerald-800 uppercase mb-2">Fortalezas</h5>
                    <ul className="text-xs space-y-2 text-slate-600">
                      {aiAnalysis.strengths.map((s, i) => <li key={i} className="flex items-start gap-2"><span>✅</span> {s}</li>)}
                    </ul>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <h5 className="font-black text-[10px] text-amber-800 uppercase mb-2">Oportunidades</h5>
                    <ul className="text-xs space-y-2 text-slate-600">
                      {aiAnalysis.growthAreas.map((g, i) => <li key={i} className="flex items-start gap-2"><span>🚀</span> {g}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ) : <p className="text-center py-8 text-slate-300 text-xs font-bold uppercase tracking-widest">Ejecute el análisis para ver recomendaciones estratégicas</p>}
          </div>

          {/* Historial de Evaluaciones Almacenadas */}
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-b pb-4">Base de Datos Histórica</h4>
            {employeeHistory.length === 0 ? (
              <p className="text-center py-6 text-slate-300 text-xs font-bold uppercase">No se registran evaluaciones previas para este trabajador.</p>
            ) : (
              <div className="space-y-3">
                {employeeHistory.map((ev, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#003366] transition-all">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-[#003366] text-[#FFCC00] rounded-2xl flex items-center justify-center font-black text-sm shadow-inner">
                        {(ev.promedioFinal * 20).toFixed(0)}%
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#003366] uppercase">{ev.mes} {ev.año}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Evaluador: {ev.evaluador}</p>
                      </div>
                    </div>
                    <div className="text-right">
                        {isDirector && (
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${
                              ev.condicionBono.includes('Aprobado') ? 'bg-emerald-100 text-emerald-700' : 
                              ev.condicionBono.includes('Pendiente') ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                              {ev.condicionBono}
                          </span>
                        )}
                        <p className="text-[9px] text-slate-300 font-bold mt-2 uppercase tracking-tighter">Registrado el {ev.date}</p>
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
