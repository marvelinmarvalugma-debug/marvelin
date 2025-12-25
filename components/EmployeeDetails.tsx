
import React, { useState } from 'react';
import { Employee, BONUS_APPROVER } from '../types';
import { generatePerformanceInsights } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

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

  const getIncreaseRange = (score: number) => {
    if (score >= 98) return { label: "Potencial: +20% (Aprob. Jefe)", color: "bg-indigo-500", text: "text-indigo-700" };
    if (score >= 88) return { label: "Potencial: +15% Incremento", color: "bg-emerald-500", text: "text-emerald-700" };
    if (score >= 80) return { label: "Potencial: +10% Incremento", color: "bg-blue-500", text: "text-blue-700" };
    // Caso solicitado: Por debajo del 80%
    return { label: "No recibe beneficio", color: "bg-rose-500", text: "text-rose-700" };
  };

  const range = getIncreaseRange(overallScore);

  // Verificar si tiene una notificación de bono aprobada por Jaquelin
  const bonusApprovedNotification = employee.notifications?.find(n => n.type === 'bonus');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <button 
        onClick={onBack}
        className="flex items-center text-slate-500 hover:text-[#003366] font-bold uppercase text-xs tracking-widest transition-colors"
      >
        <span className="mr-2">←</span> Volver a Nómina
      </button>

      {/* BANNER DE NOTIFICACIÓN DE BENEFICIO */}
      {bonusApprovedNotification && (
        <div className="bg-gradient-to-r from-[#003366] via-[#004a8f] to-[#003366] p-1 rounded-3xl animate-in slide-in-from-top-4 shadow-xl">
           <div className="bg-white/5 backdrop-blur-sm rounded-[22px] p-6 flex items-center justify-between border border-white/20">
              <div className="flex items-center space-x-6">
                 <div className="w-16 h-16 bg-[#FFCC00] rounded-2xl flex items-center justify-center text-[#003366] text-3xl shadow-lg shadow-yellow-500/20 animate-pulse">
                    🏆
                 </div>
                 <div>
                    <h4 className="text-[#FFCC00] font-black text-xl tracking-tighter uppercase leading-tight">Notificación de Beneficio Autorizado</h4>
                    <p className="text-white text-sm font-medium opacity-80 mt-1">{bonusApprovedNotification.message}</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black text-[#FFCC00] uppercase tracking-widest">Firma Autorizada</p>
                 <p className="text-white font-black text-xs uppercase italic">{BONUS_APPROVER}</p>
                 <p className="text-[8px] text-white/40 font-mono mt-1">ID: {bonusApprovedNotification.id}</p>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center relative overflow-hidden">
          {bonusApprovedNotification && (
             <div className="absolute top-0 right-0 p-4">
                <div className="bg-[#FFCC00] text-[#003366] px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-md">Bono Activo</div>
             </div>
          )}
          
          <img src={employee.photo} alt={employee.name} className="w-32 h-32 rounded-full mx-auto border-4 border-slate-50 shadow-lg grayscale" />
          <h3 className="mt-6 text-xl font-black text-slate-800 uppercase leading-tight">{employee.name}</h3>
          <p className="text-[#003366] font-black text-sm uppercase tracking-tighter mt-1">{employee.role}</p>
          <p className="text-slate-400 font-bold text-xs mt-2 tracking-widest">CÉDULA: V-{employee.idNumber}</p>
          
          <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
            <div className={`p-4 rounded-2xl border flex flex-col items-center justify-center ${range.text} bg-opacity-10 bg-current`}>
               <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Estatus Salarial</span>
               <span className="font-black text-xs uppercase">{range.label}</span>
            </div>
            
            {bonusApprovedNotification && (
               <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center">
                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest opacity-60 mb-1">Autorización Dirección</span>
                  <div className="flex items-center text-emerald-700 font-black text-[10px] uppercase">
                     <span className="mr-2 text-lg">✅</span> FIRMADO POR {BONUS_APPROVER}
                  </div>
               </div>
            )}

            {overallScore < 80 && (
               <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex flex-col items-center">
                  <span className="text-[10px] font-black uppercase text-rose-600 tracking-widest opacity-60 mb-1">Nota de Desempeño</span>
                  <p className="text-rose-700 font-bold text-[10px] uppercase leading-tight">Requiere Plan de Mejora Inmediato</p>
               </div>
            )}
          </div>

          <div className={`mt-8 p-6 rounded-3xl text-white ${overallScore < 80 ? 'bg-rose-900' : 'bg-[#001a33]'}`}>
            <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] mb-1">Puntaje Desempeño</p>
            <h4 className={`text-5xl font-black ${overallScore < 80 ? 'text-white' : 'text-[#FFCC00]'}`}>{overallScore}%</h4>
            <p className="text-[10px] mt-4 text-slate-400 uppercase font-black">Vulcan Energy Technology</p>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 border-b pb-4">Matriz de Competencias</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} />
                  <Radar
                    name={employee.name}
                    dataKey="A"
                    stroke={overallScore < 80 ? "#e11d48" : "#003366"}
                    fill={overallScore < 80 ? "#e11d48" : "#003366"}
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                Análisis Inteligente (IA)
              </h4>
              {!aiAnalysis && (
                <button 
                  onClick={handleGenerateInsights}
                  disabled={loadingAI}
                  className="bg-[#003366] hover:bg-[#002244] text-white px-5 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  {loadingAI ? 'Analizando...' : 'Ejecutar Análisis IA'}
                </button>
              )}
            </div>

            {aiAnalysis ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className={`p-5 border-l-4 rounded-r-xl text-slate-700 leading-relaxed text-sm italic ${overallScore < 80 ? 'bg-rose-50 border-rose-500' : 'bg-slate-50 border-[#003366]'}`}>
                  "{aiAnalysis.summary}"
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                    <h5 className="text-emerald-800 font-black text-[10px] mb-3 uppercase tracking-widest">Fortalezas Identificadas</h5>
                    <ul className="space-y-2">
                      {aiAnalysis.strengths.map((s, i) => (
                        <li key={i} className="text-emerald-700 text-xs font-medium flex items-start">
                          <span className="mr-2">✓</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                    <h5 className="text-amber-800 font-black text-[10px] mb-3 uppercase tracking-widest">Ruta de Crecimiento</h5>
                    <ul className="space-y-2">
                      {aiAnalysis.growthAreas.map((g, i) => (
                        <li key={i} className="text-amber-700 text-xs font-medium flex items-start">
                          <span className="mr-2">↗</span> {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-50 rounded-2xl">
                <p className="text-xs font-bold uppercase tracking-widest">Feedback no disponible</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
