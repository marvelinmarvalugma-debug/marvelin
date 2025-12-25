
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in duration-300">
             <h3 className="text-xl font-bold text-slate-800 mb-2">Carga Masiva desde Excel</h3>
             <p className="text-sm text-slate-500 mb-6">Pega las columnas (Cédula, Nombre, Cargo) directamente de tu hoja de cálculo.</p>
             <textarea 
               value={bulkText}
               onChange={(e) => setBulkText(e.target.value)}
               className="w-full h-64 p-4 bg-slate-50 border rounded-2xl font-mono text-xs mb-6 outline-none focus:ring-2 focus:ring-[#003366]"
               placeholder="13463832	MILLAN HERNANDEZ, PEDRO M	INSPECTOR..."
             />
             <div className="flex justify-end space-x-3">
               <button onClick={() => setShowBulkModal(false)} className="px-6 py-2 font-bold text-slate-400">Cancelar</button>
               <button onClick={handleBulkSubmit} className="bg-[#003366] text-white px-8 py-2 rounded-xl font-bold">Procesar Nómina</button>
             </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div className="flex flex-wrap gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-[#003366] text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter(Department.Operations)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === Department.Operations ? 'bg-[#003366] text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Operativa
          </button>
          <button 
            onClick={() => setFilter(Department.Administrative)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === Department.Administrative ? 'bg-[#003366] text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Administrativa
          </button>
        </div>
        
        <div className="flex w-full lg:w-auto space-x-3">
          <div className="relative flex-1 lg:w-64">
             <input 
              type="text" 
              placeholder="Cédula o nombre..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button 
            onClick={() => setShowBulkModal(true)}
            className="bg-white border border-[#003366] text-[#003366] px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center"
          >
             📥 Carga Masiva
          </button>
          <button 
            onClick={onAddNew}
            className="bg-[#003366] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/10 hover:bg-[#002244] transition-all flex items-center shrink-0"
          >
            + Individual
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEmployees.map(emp => {
          const score = Math.round(emp.kpis.reduce((acc, k) => acc + (k.score * k.weight / 100), 0));
          return (
            <div 
              key={emp.id}
              onClick={() => onSelect(emp)}
              className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                   score > 90 ? 'border-indigo-400 bg-indigo-50 text-indigo-600' :
                   score > 0 ? 'border-emerald-400 bg-emerald-50 text-emerald-600' :
                   'border-slate-200 bg-slate-50 text-slate-400'
                 }`}>
                   {score > 0 ? `${score}%` : 'N/E'}
                 </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <img src={emp.photo} alt={emp.name} className="w-16 h-16 rounded-full border-2 border-slate-50 shadow-sm object-cover grayscale group-hover:grayscale-0 transition-all" />
                <h5 className="mt-4 font-bold text-slate-800 text-sm leading-tight uppercase group-hover:text-[#003366] transition-colors">{emp.name}</h5>
                <p className="text-[10px] text-slate-500 font-black mt-1">V-{emp.idNumber}</p>
                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wide mt-0.5">{emp.role}</p>
                
                <div className="mt-2 flex flex-col items-center">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Evaluador</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{emp.managerName}</span>
                </div>

                <div className="mt-4 w-full pt-4 border-t border-slate-50">
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase mb-2">
                    <span>Desempeño</span>
                    <span>{score}/100</span>
                  </div>
                  <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${score > 90 ? 'bg-indigo-500' : 'bg-emerald-500'}`} 
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </div>

                <button className="mt-4 text-[10px] text-[#003366] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Abrir Expediente →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100">
           <div className="text-4xl mb-4">🔍</div>
           <p className="text-slate-500 font-medium">No se encontraron empleados en la nómina.</p>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
