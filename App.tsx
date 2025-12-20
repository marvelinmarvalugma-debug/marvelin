
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import EmployeeDetails from './components/EmployeeDetails';
import EvaluationForm from './components/EvaluationForm';
import { INITIAL_EMPLOYEES } from './constants';
import { Employee, FullEvaluation } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [evaluatingEmployee, setEvaluatingEmployee] = useState<Employee | null>(null);

  const handleSaveEvaluation = (evaluation: FullEvaluation) => {
    // Aquí se enviaría a una API o base de datos.
    // Por ahora, actualizamos el empleado localmente con una fecha de evaluación nueva
    setEmployees(prev => prev.map(emp => 
      emp.id === evaluation.employeeId 
        ? { ...emp, lastEvaluation: evaluation.date } 
        : emp
    ));
    setEvaluatingEmployee(null);
    setActiveTab('dashboard');
  };

  const renderContent = () => {
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
          />
        );
      case 'evaluations':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between">
              <div className="max-w-md">
                <h3 className="text-3xl font-bold text-slate-800">Ciclo de Desempeño 2024</h3>
                <p className="text-slate-500 mt-4 leading-relaxed">
                  Utiliza nuestro formato inteligente para evaluar el progreso de tu equipo. 
                  Combinamos KPIs tradicionales con análisis conductual asistido por IA.
                </p>
                <div className="mt-8 flex space-x-4">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-indigo-600">85%</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Completado</span>
                  </div>
                  <div className="w-px h-10 bg-slate-100"></div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold text-slate-800">12</span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pendientes</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 md:mt-0">
                <img src="https://illustrations.popsy.co/white/performance-review.svg" alt="Eval" className="w-64 h-64" />
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50">
                <h4 className="font-bold text-slate-800">Seleccionar Empleado para Evaluar</h4>
              </div>
              <div className="divide-y divide-slate-50">
                {employees.map(emp => (
                  <div key={emp.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center">
                      <img src={emp.photo} className="w-10 h-10 rounded-full mr-4" />
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{emp.name}</p>
                        <p className="text-xs text-slate-500">{emp.role}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setEvaluatingEmployee(emp)}
                      className="text-xs font-bold bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      Iniciar Formato
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
    <Layout activeTab={evaluatingEmployee ? 'evaluations' : activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
