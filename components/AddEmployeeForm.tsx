
import React, { useState } from 'react';
import { Department, Employee } from '../types';

interface AddEmployeeFormProps {
  onAdd: (employee: Omit<Employee, 'id' | 'kpis' | 'lastEvaluation' | 'summary'>) => void;
  onCancel: () => void;
}

const AddEmployeeForm: React.FC<AddEmployeeFormProps> = ({ onAdd, onCancel }) => {
  const [formData, setFormData] = useState({
    idNumber: '',
    name: '',
    role: '',
    // Fix: Using correct Department enum member (ATO instead of Operations)
    department: Department.ATO,
    photo: `https://picsum.photos/seed/${Math.random()}/200/200`,
    managerName: 'Administrador Vulcan',
    managerRole: 'Supervisor de Area'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role || !formData.idNumber) return;
    onAdd(formData);
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 max-w-lg mx-auto animate-in zoom-in duration-300">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h3 className="text-xl font-bold text-slate-800">Registrar Nuevo Personal</h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-rose-500">✕</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Cédula de Identidad</label>
          <input 
            required
            type="text" 
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#003366] outline-none transition-all"
            value={formData.idNumber}
            onChange={e => setFormData({...formData, idNumber: e.target.value})}
            placeholder="Ej. 13463832"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nombre y Apellido</label>
          <input 
            required
            type="text" 
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#003366] outline-none transition-all"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="Ej. Pedro Millan Hernandez"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargo Real (Nómina)</label>
          <input 
            required
            type="text" 
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#003366] outline-none transition-all"
            value={formData.role}
            onChange={e => setFormData({...formData, role: e.target.value})}
            placeholder="Ej. INSPECTOR"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Departamento</label>
            <select 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#003366] outline-none"
              value={formData.department}
              onChange={e => setFormData({...formData, department: e.target.value as Department})}
            >
              {/* Fix: Using correct Department enum members (ATO/VULCAN instead of Operations/Administrative) */}
              <option value={Department.ATO}>Operativo</option>
              <option value={Department.VULCAN}>Administrativo</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">ID de Sistema</label>
            <div className="p-3 bg-slate-100 border border-dashed border-slate-300 rounded-xl text-slate-400 text-sm font-mono">
              AUTO-GEN
            </div>
          </div>
        </div>

        <div className="pt-6 flex space-x-3">
          <button 
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className="flex-1 py-3 bg-[#003366] text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 hover:bg-[#002244] transition-all"
          >
            Guardar en Nómina
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEmployeeForm;
