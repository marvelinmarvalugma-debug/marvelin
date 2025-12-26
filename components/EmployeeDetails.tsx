
import React, { useState } from 'react';
import { Employee } from '../types';
import { generatePerformanceInsights } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface EmployeeDetailsProps {
  employee: Employee;
  onBack: () => void;
}

export default function EmployeeDetails({ employee, onBack }: EmployeeDetailsProps) {
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <button onClick={onBack} className="text-slate-500 hover:text-[#003366] font-bold uppercase text-xs tracking-widest transition-colors">← Volver</button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
          <img src={employee.photo} alt={employee.name} className="w-32 h-32 rounded-full mx-auto border-4 border-slate-50 grayscale" />
          <h3 className="mt-6 text-xl font-black text-slate-800 uppercase leading-tight">{employee.name}</h3>
          <p className="text-[#003366] font-black text-sm uppercase tracking-tighter mt-1">{employee.role}</p>
          <div className="mt-8 p-6 rounded-3xl bg-[#001a33] text-white">
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] mb-1">Score Técnico</p>
            <h4 className="text-5xl font-black text-[#FFCC00]">{overallScore}%</h4>
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 border-b pb-4">Matriz Radar</h4>
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
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Feedback Inteligente</h4>
              {!aiAnalysis && <button onClick={handleGenerateInsights} disabled={loadingAI} className="bg-[#003366] text-white px-5 py-2 rounded-lg text-xs font-bold">{loadingAI ? 'Analizando...' : 'Ejecutar Análisis IA'}</button>}
            </div>
            {aiAnalysis ? (
              <div className="space-y-4 animate-in fade-in">
                <p className="p-4 bg-slate-50 border-l-4 border-[#003366] text-slate-700 italic text-sm">"{aiAnalysis.summary}"</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl"><h5 className="font-black text-[10px] text-emerald-800 uppercase mb-2">Fortalezas</h5><ul className="text-xs space-y-1">{aiAnalysis.strengths.map((s, i) => <li key={i}>✓ {s}</li>)}</ul></div>
                  <div className="p-4 bg-amber-50 rounded-2xl"><h5 className="font-black text-[10px] text-amber-800 uppercase mb-2">Mejoras</h5><ul className="text-xs space-y-1">{aiAnalysis.growthAreas.map((g, i) => <li key={i}>↗ {g}</li>)}</ul></div>
                </div>
              </div>
            ) : <p className="text-center py-8 text-slate-400 text-xs font-bold uppercase">Feedback no generado</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
