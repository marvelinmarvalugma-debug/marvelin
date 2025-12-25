
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
    <div className="flex h-screen overflow-hidden bg-slate-100 font-sans">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#001a33] text-white flex flex-col shadow-2xl transition-transform duration-300 transform
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        print:hidden
      `}>
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white">VULCAN<span className="text-[#FFCC00]">HR</span></h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-[0.2em] font-bold">Energy Technology</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 p-2">✕</button>
        </div>
        
        <nav className="flex-1 mt-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center px-6 py-4 transition-all duration-300 ${
                activeTab === item.id 
                  ? 'bg-[#003366] text-[#FFCC00] border-r-4 border-[#FFCC00] shadow-inner' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-xl mr-3 opacity-80">{item.icon}</span>
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        {evaluatorName && (
          <div className="p-6 border-t border-white/5">
            <div className={`p-4 rounded-2xl border ${isJaquelin ? 'bg-indigo-900/30 border-[#FFCC00]/50' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center">
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-black ${isJaquelin ? 'bg-[#FFCC00] text-[#003366]' : 'bg-[#003366] text-white'}`}>
                  {evaluatorName.split(' ')[0][0]}
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{isJaquelin ? 'Director' : 'Evaluador'}</p>
                  <p className="text-xs font-bold truncate text-white uppercase">{evaluatorName}</p>
                </div>
              </div>
              <button 
                onClick={onChangeEvaluator}
                className="mt-3 w-full text-[9px] font-black uppercase text-[#FFCC00] hover:text-white transition-colors border border-[#FFCC00]/30 py-1 rounded-lg"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-100 print:bg-white print:overflow-visible">
        <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-slate-200 px-4 lg:px-8 py-3 lg:py-4 flex justify-between items-center print:hidden">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden mr-3 p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <span className="text-2xl">☰</span>
            </button>
            <div>
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{activeTab}</h2>
              <p className="text-sm lg:text-lg font-bold text-slate-800 leading-tight">
                {isJaquelin ? 'Gestión de Beneficios' : 'Panel Operativo'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 lg:space-x-6">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 uppercase">{evaluatorName || 'SISTEMA'}</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isJaquelin ? 'text-[#FFCC00]' : 'text-emerald-500'}`}>
                ● Sesión Activa
              </span>
            </div>
            <button 
              onClick={onDownloadReports}
              className="bg-[#003366] text-white px-3 lg:px-5 py-2 rounded-xl font-black text-[10px] lg:text-xs hover:bg-[#002244] transition-all shadow-lg shadow-blue-900/10 uppercase tracking-widest"
            >
              <span className="lg:inline hidden">RESUMEN NÓMINA</span>
              <span className="lg:hidden">REPORTE</span>
            </button>
          </div>
        </header>

        <div className="p-4 lg:p-8 print:p-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
