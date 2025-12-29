
import React, { useState } from 'react';
import { Employee, Department } from '../types';

interface EmployeeListProps {
  employees: Employee[];
  onSelect: (employee: Employee) => void;
  onAddNew: () => void;
  onBulkAdd?: (data: string, type: 'ato' | 'vulcan') => void;
  isReadOnly?: boolean;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, onSelect, onAddNew, onBulkAdd, isReadOnly = false }) => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkType, setBulkType] = useState<'ato' | 'vulcan'>('ato');

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
      onBulkAdd(bulkText, bulkType);
      setShowBulkModal(false);
      setBulkText('');
    }
  };

  return (
    <div className="space-y-6">
      {showBulkModal && !isReadOnly && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#001a33]/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-[40px] p-8 lg:p-10 max-w-4xl w-full shadow-2xl animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh] border border-slate-100">
             <div className="flex justify-between items-start mb-6">
               <div>
                 <h3 className="text-2xl font-black text-[#003366] uppercase tracking-tighter">Carga Masiva de Nómina</h3>
                 <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">Importación exclusiva para personal ATO / VULCAN</p>
               </div>
               <button onClick={() => setShowBulkModal(false)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all">✕</button>
             </div>

             {/* Selector de Universo de Carga */}
             <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-8 border border-slate-100">
                <button 
                  onClick={() => setBulkType('ato')}
                  className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${bulkType === 'ato' ? 'bg-[#003366] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  🏢 Personal ATO
                </button>
                <button 
                  onClick={() => setBulkType('vulcan')}
                  className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${bulkType === 'vulcan' ? 'bg-[#003366] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  🚀 Personal VULCAN
                </button>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2 space-y-4">
                   <div className="bg-slate-50 p-2 rounded-2xl border border-slate-100">
                      <div className="flex bg-[#003366] text-white p-3 rounded-xl text-[8px] font-black uppercase tracking-tighter mb-2">
                        <span className="w-1/5">1. Cédula</span>
                        <span className="w-1/5">2. Nombre</span>
                        <span className="w-1/5">3. Cargo</span>
                        <span className="w-1/5">4. Dept. (Desc)</span>
                        <span className="w-1/5">5. Evaluador</span>
                      </div>
                      <textarea 
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        className="w-full h-64 p-4 bg-white border-2 border-slate-100 rounded-xl font-mono text-[9px] outline-none focus:border-[#003366] transition-all resize-none"
                        placeholder={`Pegue aquí los datos del personal ${bulkType.toUpperCase()}...`}
                      />
                   </div>
                </div>
                
                <div className="space-y-6">
                   <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                      <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-3">Guía de División</h4>
                      <ul className="text-[9px] text-blue-700/70 space-y-2 font-bold uppercase leading-relaxed">
                        <li>• Asegúrese de estar en el modo correcto ({bulkType.toUpperCase()}).</li>
                        <li>• Se respetarán los nombres de departamentos originales como descripción.</li>
                        <li>• El sistema clasificará el personal automáticamente.</li>
                      </ul>
                   </div>
                </div>
             </div>

             <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-50">
               <button onClick={() => setBulkText('')} className="px-8 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest hover:text-rose-500 transition-colors">Limpiar</button>
               <button 
                onClick={handleBulkSubmit} 
                disabled={!bulkText.trim()}
                className={`px-12 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${
                  !bulkText.trim() ? 'bg-slate-100 text-slate-300' : 'bg-[#003366] text-white shadow-xl shadow-blue-900/20 hover:scale-105 active:scale-95'
                }`}
               >
                 Importar a Nómina {bulkType.toUpperCase()}
               </button>
             </div>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
             <input 
              type="text" 
              placeholder="Buscar por cédula o nombre..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border-2 border-slate-100 rounded-3xl px-6 py-4 text-xs font-bold text-slate-700 focus:border-[#003366] outline-none transition-all placeholder:text-slate-300 shadow-sm"
            />
          </div>
          {!isReadOnly && (
            <div className="flex gap-2">
              <button 
                onClick={() => setShowBulkModal(true)}
                className="flex-1 sm:flex-none bg-white border-2 border-[#003366] text-[#003366] px-6 py-4 rounded-3xl text-[10px] font-black hover:bg-slate-50 transition-all uppercase tracking-widest"
              >
                 📥 Carga ATO / VULCAN
              </button>
              <button 
                onClick={onAddNew}
                className="flex-1 sm:flex-none bg-[#003366] text-white px-8 py-4 rounded-3xl text-[10px] font-black shadow-lg shadow-blue-900/10 hover:bg-[#002244] transition-all uppercase tracking-widest"
              >
                + Registro Manual
              </button>
            </div>
          )}
        </div>

        {/* Filtros Simplificados */}
        <div className="flex gap-3 px-2">
          {['all', Department.ATO, Department.VULCAN].map(cat => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                filter === cat 
                  ? 'bg-[#FFCC00] text-[#003366] border-[#FFCC00] shadow-lg shadow-yellow-500/20' 
                  : 'bg-white text-slate-400 border-slate-100 hover:text-slate-600 hover:border-slate-200'
              }`}
            >
              {cat === 'all' ? 'Ver Todos' : `Personal ${cat}`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEmployees.map(emp => {
          const score = Math.round(emp.kpis.reduce((acc, k) => acc + (k.score * k.weight / 100), 0));
          const isAto = emp.department === Department.ATO;

          return (
            <div 
              key={emp.id}
              onClick={() => onSelect(emp)}
              className={`group bg-white rounded-[32px] p-6 shadow-sm border-2 transition-all cursor-pointer relative overflow-hidden border-slate-50 hover:border-[#003366] hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-1`}
            >
              <div className={`absolute top-0 right-0 ${isAto ? 'bg-indigo-600' : 'bg-emerald-600'} text-white text-[7px] font-black px-4 py-1.5 uppercase tracking-widest rounded-bl-xl shadow-sm`}>
                {emp.department}
              </div>

              <div className="flex items-start space-x-4">
                <div className="relative shrink-0">
                  <img src={emp.photo} alt={emp.name} className="w-16 h-16 rounded-2xl border-2 border-slate-50 shadow-sm object-cover grayscale transition-all group-hover:grayscale-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-black text-slate-800 text-xs uppercase leading-none mb-1.5 truncate group-hover:text-[#003366] transition-colors">{emp.name}</h5>
                  <p className="text-[9px] text-[#003366] font-black uppercase tracking-tighter truncate opacity-70">{emp.role}</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Eficacia Técnica</span>
                  <span className="text-[10px] font-black text-[#003366]">{score}%</span>
                </div>
                <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#003366] h-full transition-all" style={{ width: `${score}%` }}></div>
                </div>
              </div>

              <div className="mt-5 flex justify-between items-end">
                <span className="text-[9px] font-bold text-slate-400 uppercase">{emp.lastEvaluation}</span>
                <span className="text-[8px] font-black text-[#003366] uppercase bg-slate-50 px-4 py-2 rounded-xl group-hover:bg-[#003366] group-hover:text-white transition-all">Perfil Completo</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeeList;
