
import React, { useState } from 'react';
import { BONUS_APPROVER } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDownloadReports?: () => void;
  evaluatorName?: string | null;
  onChangeEvaluator?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  onDownloadReports,
  evaluatorName,
  onChangeEvaluator
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isJaquelin = evaluatorName === BONUS_APPROVER;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'employees', label: 'Personal', icon: '👥' },
    { id: 'evaluations', label: isJaquelin ? 'Aprobación Bonos' : 'Matriz Desempeño', icon: isJaquelin ? '✅' : '📝' },
  ];

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden">
      {/* Sidebar Overlay para Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#001a33]/60 z-[60] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Ahora ESTÁTICO/FIJO en escritorio */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-64 bg-[#001a33] text-white flex flex-col shadow-2xl transition-transform duration-300
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        print:hidden
      `}>
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white">VULCAN<span className="text-[#FFCC00]">HR</span></h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-[0.2em] font-black">Energy Technology</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-white bg-white/10 p-2 rounded-xl">✕</button>
        </div>
        
        <nav className="flex-1 mt-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center px-8 py-5 transition-all duration-300 ${
                activeTab === item.id 
                  ? 'bg-[#003366] text-[#FFCC00] border-r-8 border-[#FFCC00] shadow-inner' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-2xl mr-4">{item.icon}</span>
              <span className="font-black text-sm uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        {evaluatorName && (
          <div className="p-8 border-t border-white/5 bg-[#001326]">
            <div className={`p-5 rounded-3xl border-2 ${isJaquelin ? 'bg-indigo-900/30 border-[#FFCC00]/50' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center">
                <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black ${isJaquelin ? 'bg-[#FFCC00] text-[#003366]' : 'bg-[#003366] text-white shadow-lg'}`}>
                  {evaluatorName.split(' ')[0][0]}
                </div>
                <div className="ml-4 overflow-hidden">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">{isJaquelin ? 'Director' : 'Evaluador'}</p>
                  <p className="text-[11px] font-black truncate text-white uppercase mt-0.5">{evaluatorName}</p>
                </div>
              </div>
              <button 
                onClick={onChangeEvaluator}
                className="mt-4 w-full text-[9px] font-black uppercase text-[#FFCC00] hover:text-white transition-colors border-2 border-[#FFCC00]/20 py-2.5 rounded-xl tracking-widest"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Contenedor Principal - Ajustado para Sidebar Fijo */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 print:ml-0 transition-all duration-300">
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-100 px-6 lg:px-10 py-4 lg:py-5 flex justify-between items-center print:hidden">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden mr-4 p-3 bg-[#001a33] text-white rounded-2xl shadow-lg active:scale-90 transition-transform"
            >
              <span className="text-xl">☰</span>
            </button>
            <div>
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-1.5">{activeTab}</h2>
              <p className="text-base lg:text-xl font-black text-slate-800 leading-tight uppercase tracking-tight">
                {isJaquelin ? 'Gestión de Beneficios' : 'Sistema de Evaluación Técnica'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 lg:gap-8">
            <div className="hidden xl:flex flex-col text-right">
              <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{evaluatorName || 'SISTEMA'}</span>
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 ${isJaquelin ? 'text-[#003366]' : 'text-emerald-500'}`}>
                ● CONEXIÓN SEGURA
              </span>
            </div>
            
            <button 
              onClick={onDownloadReports}
              className="bg-[#003366] text-white px-5 lg:px-8 py-3 rounded-2xl font-black text-[10px] lg:text-xs hover:bg-[#002244] transition-all shadow-2xl shadow-blue-900/20 uppercase tracking-[0.2em]"
            >
              <span className="lg:inline hidden">RESUMEN NÓMINA</span>
              <span className="lg:hidden">REPORTE</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-slate-50 print:bg-white print:p-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
