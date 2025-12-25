
import React, { useState } from 'react';
import { Employee, Department } from '../types';

interface EmployeeListProps {
  employees: Employee[];
  onSelect: (employee: Employee) => void;
  onAddNew: () => void;
  onBulkAdd?: (data: string) => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, onSelect, onAddNew, onBulkAdd }) => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const filteredEmployees = employees.filter(emp => {
    const matchesDept = filter === 'all' || emp.department === filter;
    const matchesSearch = 
      emp.name.toLowerCase().includes(search.toLowerCase()) || 
      emp.role.toLowerCase().includes(search.toLowerCase()) ||
      emp.idNumber.includes(search);
    return matchesDept && matchesSearch;
  });

  const handleBulkSubmit = () => {
    if (onBulkAdd && bulkText) {
      onBulkAdd(bulkText);
      setShowBulkModal(false);
      setBulkText('');
    }
  };

  return (
    <div className="space-y-6">
      {showBulkModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 lg:p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
             <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Carga Masiva (Excel)</h3>
             <p className="text-xs text-slate-500 mb-6 font-medium">Pega las columnas (Cédula, Nombre, Cargo) de tu hoja de cálculo.</p>
             <textarea 
               value={bulkText}
               onChange={(e) => setBulkText(e.target.value)}
               className="w-full h-48 lg:h-64 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-[10px] mb-6 outline-none focus:border-[#003366] transition-all"
               placeholder="13463832	MILLAN HERNANDEZ, PEDRO M	INSPECTOR..."
             />
             <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
               <button onClick={() => setShowBulkModal(false)} className="px-6 py-3 font-black text-slate-400 uppercase text-[10px] tracking-widest">Cancelar</button>
               <button onClick={handleBulkSubmit} className="bg-[#003366] text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-900/10">Procesar Datos</button>
             </div>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-4">
        {/* Search and Action Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
             <input 
              type="text" 
              placeholder="Cédula o nombre..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold text-slate-700 focus:border-[#003366] outline-none transition-all placeholder:text-slate-300"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowBulkModal(true)}
              className="flex-1 sm:flex-none bg-white border-2 border-[#003366] text-[#003366] px-4 py-3 rounded-2xl text-[10px] font-black hover:bg-slate-50 transition-all uppercase tracking-widest"
            >
               📥 Carga
            </button>
            <button 
              onClick={onAddNew}
              className="flex-1 sm:flex-none bg-[#003366] text-white px-5 py-3 rounded-2xl text-[10px] font-black shadow-lg shadow-blue-900/10 hover:bg-[#002244] transition-all uppercase tracking-widest"
            >
              + Nuevo
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
          <button 
            onClick={() => setFilter('all')}
            className={`whitespace-nowrap px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-[#FFCC00] text-[#003366] shadow-md' : 'bg-white text-slate-400 border border-slate-100 hover:text-slate-600'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter(Department.Operations)}
            className={`whitespace-nowrap px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === Department.Operations ? 'bg-[#FFCC00] text-[#003366] shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}
          >
            Operativa
          </button>
          <button 
            onClick={() => setFilter(Department.Administrative)}
            className={`whitespace-nowrap px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === Department.Administrative ? 'bg-[#FFCC00] text-[#003366] shadow-md' : 'bg-white text-slate-400 border border-slate-100'}`}
          >
            Administrativa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        {filteredEmployees.map(emp => {
          const score = Math.round(emp.kpis.reduce((acc, k) => acc + (k.score * k.weight / 100), 0));
          const hasBonusAuth = emp.notifications?.some(n => n.type === 'bonus');

          return (
            <div 
              key={emp.id}
              onClick={() => onSelect(emp)}
              className={`group bg-white rounded-3xl p-6 shadow-sm border-2 transition-all cursor-pointer relative overflow-hidden ${
                hasBonusAuth ? 'border-[#FFCC00]' : 'border-slate-50 hover:border-[#003366]'
              } hover:shadow-xl hover:shadow-blue-900/5`}
            >
              {hasBonusAuth && (
                 <div className="absolute top-0 right-0 bg-[#FFCC00] text-[#003366] text-[8px] font-black px-4 py-1.5 uppercase tracking-tighter rounded-bl-2xl">
                   Beneficio
                 </div>
              )}

              <div className="flex items-start space-x-4">
                <div className="relative shrink-0">
                  <img src={emp.photo} alt={emp.name} className="w-14 h-14 rounded-2xl border-2 border-slate-50 shadow-sm object-cover grayscale transition-all group-hover:grayscale-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-black text-slate-800 text-xs uppercase leading-none mb-1 truncate group-hover:text-[#003366] transition-colors">{emp.name}</h5>
                  <p className="text-[10px] text-[#003366] font-black uppercase tracking-tighter truncate">{emp.role}</p>
                  <p className="text-[9px] text-slate-400 font-bold mt-1">V-{emp.idNumber}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Score de Campo</span>
                  <span className={`text-xs font-black ${score > 90 ? 'text-indigo-600' : 'text-emerald-600'}`}>{score}%</span>
                </div>
                <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${score > 90 ? 'bg-indigo-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter leading-none">Última Evaluacion</span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase">{emp.lastEvaluation}</span>
                </div>
                <span className="text-[9px] font-black text-[#003366] uppercase group-hover:translate-x-1 transition-transform">Ver Perfil →</span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
           <div className="text-4xl mb-4">🔍</div>
           <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest text-center px-4">No se encontraron resultados para esta búsqueda</p>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
