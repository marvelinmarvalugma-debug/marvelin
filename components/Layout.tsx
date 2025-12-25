
import React from 'react';

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
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'employees', label: 'Personal', icon: '👥' },
    { id: 'evaluations', label: 'Matriz Desempeño', icon: '📝' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-[#001a33] text-white flex flex-col shadow-2xl z-20 print:hidden">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-2xl font-black tracking-tighter text-white">VULCAN<span className="text-[#FFCC00]">HR</span></h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-[0.2em] font-bold">Energy Technology</p>
        </div>
        
        <nav className="flex-1 mt-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 group relative">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-[#FFCC00] flex items-center justify-center text-[#003366] text-xs font-black">
                  {evaluatorName.split(' ')[0][0]}
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Evaluador</p>
                  <p className="text-xs font-bold truncate text-white uppercase">{evaluatorName}</p>
                </div>
              </div>
              <button 
                onClick={onChangeEvaluator}
                className="mt-3 w-full text-[9px] font-black uppercase text-[#FFCC00] hover:text-white transition-colors border border-[#FFCC00]/30 py-1 rounded-lg"
              >
                Cambiar Usuario
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-100 print:bg-white print:overflow-visible">
        <header className="sticky top-0 z-10 bg-white shadow-sm border-b border-slate-200 px-8 py-4 flex justify-between items-center print:hidden">
          <div>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">{activeTab}</h2>
            <p className="text-lg font-bold text-slate-800">Panel de Operaciones</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800 uppercase">{evaluatorName || 'SISTEMA'}</span>
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">● Sesión Autorizada</span>
            </div>
            <button 
              onClick={onDownloadReports}
              className="bg-[#003366] text-white px-5 py-2 rounded font-bold text-xs hover:bg-[#002244] transition-all shadow-lg shadow-blue-900/10"
            >
              REPORTES PDF
            </button>
          </div>
        </header>

        <div className="p-8 print:p-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
