
import React, { useState } from 'react';
import { Employee, Department } from '../types';

interface EmployeeListProps {
  employees: Employee[];
  onSelect: (employee: Employee) => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, onSelect }) => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredEmployees = employees.filter(emp => {
    const matchesDept = filter === 'all' || emp.department === filter;
    const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || 
                          emp.role.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex space-x-2 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Todos
          </button>
          {Object.values(Department).map(dept => (
            <button 
              key={dept}
              onClick={() => setFilter(dept)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === dept ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {dept}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-64">
           <input 
            type="text" 
            placeholder="Filtrar por nombre o cargo..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
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
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                   score > 90 ? 'border-indigo-400 bg-indigo-50 text-indigo-600' :
                   score > 80 ? 'border-emerald-400 bg-emerald-50 text-emerald-600' :
                   'border-amber-400 bg-amber-50 text-amber-600'
                 }`}>
                   {score}%
                 </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <img src={emp.photo} alt={emp.name} className="w-20 h-20 rounded-full border-2 border-slate-50 shadow-sm" />
                <h5 className="mt-4 font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{emp.name}</h5>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">{emp.role}</p>
                
                <div className="mt-4 flex flex-wrap justify-center gap-1">
                  <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-semibold uppercase">{emp.department}</span>
                </div>

                <div className="mt-6 w-full pt-6 border-t border-slate-50">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase mb-2">
                    <span>Performance</span>
                    <span>{score}/100</span>
                  </div>
                  <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${score > 90 ? 'bg-indigo-500' : score > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </div>

                <button className="mt-6 text-sm text-indigo-600 font-semibold flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver perfil detallado <span className="ml-1">→</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100">
           <div className="text-4xl mb-4">🔍</div>
           <p className="text-slate-500 font-medium">No se encontraron empleados que coincidan con la búsqueda.</p>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
