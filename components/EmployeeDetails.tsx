
import React, { useState } from 'react';
import { Employee, FullEvaluation } from '../types';
import { generatePerformanceInsights } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface EmployeeDetailsProps {
  employee: Employee;
  evaluations?: FullEvaluation[];
  onBack: () => void;
}

export default function EmployeeDetails({ employee, evaluations = [], onBack }: EmployeeDetailsProps) {
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

  // Filtrar evaluaciones solo para este empleado
  const employeeHistory = evaluations.filter(ev => ev.employeeId === employee.id);

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
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] mb-1">Score Promedio</p>
            <h4 className="text-5xl font-black text-[#FFCC00]">{overallScore}%</h4>
          </div>
        </div>

        {/* Análisis y Gráficos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 border-b pb-4">Desempeño por Competencias</h4>
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
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Feedback Inteligente (IA)</h4>
              {!aiAnalysis && <button onClick={handleGenerateInsights} disabled={loadingAI} className="bg-[#003366] text-white px-5 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-[#002244] transition-all">{loadingAI ? 'Analizando...' : 'Ejecutar Análisis'}</button>}
            </div>
            {aiAnalysis ? (
              <div className="space-y-4 animate-in slide-in-from-bottom-2">
                <p className="p-4 bg-slate-50 border-l-4 border-[#003366] text-slate-700 italic text-sm rounded-r-xl">"{aiAnalysis.summary}"</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <h5 className="font-black text-[10px] text-emerald-800 uppercase mb-2">Fortalezas Detectadas</h5>
                    <ul className="text-xs space-y-2 text-slate-600">
                      {aiAnalysis.strengths.map((s, i) => <li key={i} className="flex items-start gap-2"><span>✅</span> {s}</li>)}
                    </ul>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <h5 className="font-black text-[10px] text-amber-800 uppercase mb-2">Áreas de Desarrollo</h5>
                    <ul className="text-xs space-y-2 text-slate-600">
                      {aiAnalysis.growthAreas.map((g, i) => <li key={i} className="flex items-start gap-2"><span>🚀</span> {g}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ) : <p className="text-center py-8 text-slate-300 text-xs font-bold uppercase tracking-widest">Inicie el análisis para obtener insights</p>}
          </div>

          {/* Historial de Certificados */}
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 border-b pb-4">Historial de Certificaciones</h4>
            {employeeHistory.length === 0 ? (
              <p className="text-center py-6 text-slate-300 text-xs font-bold uppercase">No se registran actas previas.</p>
            ) : (
              <div className="space-y-3">
                {employeeHistory.map((ev, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#003366] transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#003366] text-[#FFCC00] rounded-xl flex items-center justify-center font-black text-xs">
                        {(ev.promedioFinal * 20).toFixed(0)}%
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#003366] uppercase">{ev.mes} {ev.año}</p>
                        <p className="text-[10px] text-slate-400 font-bold">Emitido el: {ev.date}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => alert("Función para reimprimir disponible en la versión completa. Actualmente puede ver el acta al finalizar la evaluación.")}
                      className="text-[10px] font-black text-[#003366] uppercase hover:underline"
                    >
                      Descargar Acta 📥
                    </button>
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
