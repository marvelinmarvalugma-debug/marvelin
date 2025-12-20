
import React, { useState } from 'react';
import { Employee } from '../types';
import { generatePerformanceInsights } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface EmployeeDetailsProps {
  employee: Employee;
  onBack: () => void;
}

const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({ employee, onBack }) => {
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
      <button 
        onClick={onBack}
        className="flex items-center text-slate-500 hover:text-indigo-600 font-medium transition-colors"
      >
        <span>← Volver al listado</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          <img src={employee.photo} alt={employee.name} className="w-32 h-32 rounded-full mx-auto border-4 border-indigo-50 shadow-lg" />
          <h3 className="mt-4 text-2xl font-bold text-slate-800">{employee.name}</h3>
          <p className="text-slate-500 font-medium">{employee.role}</p>
          <div className="mt-2 inline-flex px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wide">
            {employee.department}
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Responsable:</span>
              <span className="text-slate-700 font-medium">{employee.managerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Última eval:</span>
              <span className="text-slate-700 font-medium">{employee.lastEvaluation}</span>
            </div>
          </div>

          <div className="mt-10 p-6 bg-slate-900 rounded-2xl text-white">
            <p className="text-slate-400 text-xs uppercase font-bold tracking-widest mb-1">Score General</p>
            <h4 className="text-5xl font-extrabold text-indigo-400">{overallScore}%</h4>
            <p className="text-sm mt-3 text-slate-300">Nivel de desempeño: {overallScore > 90 ? 'Excepcional' : overallScore > 80 ? 'Sobresaliente' : 'Adecuado'}</p>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h4 className="text-lg font-semibold text-slate-800 mb-6">Matriz de Competencias</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 12}} />
                  <Radar
                    name={employee.name}
                    dataKey="A"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-semibold text-slate-800 flex items-center">
                ✨ Análisis de IA
              </h4>
              {!aiAnalysis && (
                <button 
                  onClick={handleGenerateInsights}
                  disabled={loadingAI}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
                >
                  {loadingAI ? 'Analizando...' : 'Generar Feedback con IA'}
                </button>
              )}
            </div>

            {aiAnalysis ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-lg text-indigo-900 leading-relaxed">
                  <p className="italic">"{aiAnalysis.summary}"</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50 p-4 rounded-xl">
                    <h5 className="text-emerald-800 font-bold text-sm mb-3 uppercase tracking-wide">Fortalezas</h5>
                    <ul className="space-y-2">
                      {aiAnalysis.strengths.map((s, i) => (
                        <li key={i} className="text-emerald-700 text-sm flex items-start">
                          <span className="mr-2">✓</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl">
                    <h5 className="text-amber-800 font-bold text-sm mb-3 uppercase tracking-wide">Áreas de Crecimiento</h5>
                    <ul className="space-y-2">
                      {aiAnalysis.growthAreas.map((g, i) => (
                        <li key={i} className="text-amber-700 text-sm flex items-start">
                          <span className="mr-2">↗</span> {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                <p>Haz clic en el botón para obtener un análisis detallado del desempeño.</p>
              </div>
            )}
          </div>

          {/* KPI list */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h4 className="text-lg font-semibold text-slate-800 mb-6">Indicadores de Desempeño (KPIs)</h4>
            <div className="space-y-6">
              {employee.kpis.map(k => (
                <div key={k.id}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600 font-medium">{k.name}</span>
                    <span className={`text-sm font-bold ${k.score > 80 ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {k.score}/100
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${k.score > 90 ? 'bg-indigo-500' : k.score > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                      style={{ width: `${k.score}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">Peso en evaluación final: {k.weight}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
