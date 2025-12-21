
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import EmployeeDetails from './components/EmployeeDetails';
import EvaluationForm from './components/EvaluationForm';
import AddEmployeeForm from './components/AddEmployeeForm';
import { INITIAL_EMPLOYEES } from './constants';
import { Employee, FullEvaluation, KPI, Department } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [evaluatingEmployee, setEvaluatingEmployee] = useState<Employee | null>(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);

  const handleSaveEvaluation = (evaluation: FullEvaluation) => {
    setEmployees(prev => prev.map(emp => 
      emp.id === evaluation.employeeId 
        ? { 
            ...emp, 
            lastEvaluation: evaluation.date,
            kpis: emp.kpis.map(k => {
              // Simulación de actualización de KPI promedio basada en matriz
              return { ...k, score: Math.round(evaluation.promedioFinal * 20) };
            })
          } 
        : emp
    ));
    setEvaluatingEmployee(null);
    setActiveTab('dashboard');
  };

  const handleAddEmployee = (newEmpData: Omit<Employee, 'id' | 'kpis' | 'lastEvaluation' | 'summary'>) => {
    const defaultKpis: KPI[] = [
      { id: 'k1', name: 'Productividad', score: 0, weight: 40 },
      { id: 'k2', name: 'Calidad Operativa', score: 0, weight: 30 },
      { id: 'k3', name: 'Seguridad SIHOA', score: 0, weight: 30 }
    ];

    const newEmployee: Employee = {
      ...newEmpData,
      id: Math.random().toString(36).substr(2, 9),
      kpis: defaultKpis,
      lastEvaluation: 'Pendiente',
      summary: 'Registro inicial de nómina.'
    };

    setEmployees(prev => [newEmployee, ...prev]);
    setIsAddingEmployee(false);
  };

  const handleBulkAdd = (text: string) => {
    const lines = text.split('\n');
    const newBatch: Employee[] = [];
    
    lines.forEach((line, index) => {
      const parts = line.split('\t'); // Espera tabulación de Excel
      if (parts.length >= 2) {
        const idNumber = parts[0].trim();
        const name = parts[1].trim();
        const role = parts[2] ? parts[2].trim() : 'TECNICO';
        
        newBatch.push({
          id: Math.random().toString(36).substr(2, 9),
          idNumber,
          name,
          role,
          department: Department.Operations,
          photo: `https://picsum.photos/seed/${idNumber}/200/200`,
          managerName: 'Admin',
          managerRole: 'Supervisor',
          lastEvaluation: 'Pendiente',
          summary: 'Importado de nómina masiva.',
          kpis: [
            { id: 'k1', name: 'Productividad', score: 0, weight: 40 },
            { id: 'k2', name: 'Calidad Operativa', score: 0, weight: 30 },
            { id: 'k3', name: 'Seguridad SIHOA', score: 0, weight: 30 }
          ]
        });
      }
    });

    if (newBatch.length > 0) {
      setEmployees(prev => [...newBatch, ...prev]);
    }
  };

  const renderContent = () => {
    if (isAddingEmployee) {
      return (
        <div className="py-8">
          <AddEmployeeForm onAdd={handleAddEmployee} onCancel={() => setIsAddingEmployee(false)} />
        </div>
      );
    }

    if (evaluatingEmployee) {
      return (
        <div className="py-8">
           <EvaluationForm 
            employee={evaluatingEmployee} 
            onClose={() => setEvaluatingEmployee(null)}
            onSave={handleSaveEvaluation}
          />
        </div>
      );
    }

    if (selectedEmployee) {
      return (
        <EmployeeDetails 
          employee={selectedEmployee} 
          onBack={() => setSelectedEmployee(null)} 
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard employees={employees} />;
      case 'employees':
        return (
          <EmployeeList 
            employees={employees} 
            onSelect={(emp) => setSelectedEmployee(emp)} 
            onAddNew={() => setIsAddingEmployee(true)}
            onBulkAdd={handleBulkAdd}
          />
        );
      case 'evaluations':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between">
              <div className="max-w-md">
                <h3 className="text-3xl font-bold text-slate-800 tracking-tight">Matriz Mensual Vulcan</h3>
                <p className="text-slate-500 mt-4 leading-relaxed">
                  Utilice el formato oficial para evaluar el desempeño técnico del personal bajo su cargo.
                </p>
              </div>
              <div className="mt-8 md:mt-0 opacity-50">
                <img src="https://illustrations.popsy.co/white/performance-review.svg" alt="Eval" className="w-48 h-48" />
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h4 className="font-bold text-slate-800">Seleccionar Personal para Evaluación</h4>
                <span className="text-xs bg-slate-100 px-3 py-1 rounded-full font-bold text-slate-400">Total: {employees.length}</span>
              </div>
              <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                {employees.map(emp => (
                  <div key={emp.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center">
                      <img src={emp.photo} className="w-10 h-10 rounded-full mr-4 object-cover grayscale" />
                      <div>
                        <p className="font-bold text-slate-800 text-sm uppercase">{emp.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{emp.role} • V-{emp.idNumber}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setEvaluatingEmployee(emp)}
                      className="text-[10px] font-black uppercase tracking-widest bg-[#003366] text-white px-5 py-2.5 rounded hover:bg-[#002244] transition-all"
                    >
                      Evaluar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard employees={employees} />;
    }
  };

  return (
    <Layout activeTab={evaluatingEmployee || isAddingEmployee ? 'evaluations' : activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
