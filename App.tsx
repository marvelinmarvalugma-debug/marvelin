
import React, { useState, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import EmployeeDetails from './components/EmployeeDetails';
import EvaluationForm from './components/EvaluationForm';
import AddEmployeeForm from './components/AddEmployeeForm';
import MonthlyReportModal from './components/MonthlyReportModal';
import { INITIAL_EMPLOYEES } from './constants';
import { Employee, FullEvaluation, Department, AUTHORIZED_EVALUATORS, BONUS_APPROVER, BonusStatus, VulcanNotification } from './types';

const App: React.FC = () => {
  const [currentEvaluator, setCurrentEvaluator] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [evaluationsHistory, setEvaluationsHistory] = useState<FullEvaluation[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [evaluatingEmployee, setEvaluatingEmployee] = useState<Employee | null>(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);

  const isJaquelin = currentEvaluator === BONUS_APPROVER;

  // Filtrar empleados según el evaluador actual
  const filteredEmployees = useMemo(() => {
    if (!currentEvaluator) return [];
    if (isJaquelin) return employees;
    return employees.filter(emp => emp.managerName === currentEvaluator);
  }, [employees, currentEvaluator, isJaquelin]);

  // Filtrar historial de evaluaciones para el reporte
  const filteredEvaluationsForReport = useMemo<FullEvaluation[]>(() => {
    if (isJaquelin) return evaluationsHistory;
    return evaluationsHistory.filter((ev: FullEvaluation) => ev.evaluador === currentEvaluator);
  }, [evaluationsHistory, currentEvaluator, isJaquelin]);

  const handleSaveEvaluation = (evaluation: FullEvaluation) => {
    setEvaluationsHistory(prev => [...prev, evaluation]);
    setEmployees(prev => prev.map(emp => 
      emp.id === evaluation.employeeId 
        ? { 
            ...emp, 
            lastEvaluation: `${evaluation.mes} ${evaluation.año}`,
            kpis: emp.kpis.map(k => ({ ...k, score: Math.round(evaluation.promedioFinal * 20) }))
          } 
        : emp
    ));
    setEvaluatingEmployee(null);
    setActiveTab('dashboard');
  };

  const handleApproveBonus = (employeeId: string) => {
    const today = new Date().toLocaleDateString('es-ES');
    
    setEvaluationsHistory(prev => prev.map(ev => {
      if (ev.employeeId === employeeId && ev.condicionBono === BonusStatus.PendingAuth) {
        return { ...ev, condicionBono: BonusStatus.Approved, authorizedBy: BONUS_APPROVER };
      }
      return ev;
    }));

    setEmployees(prev => prev.map(emp => {
      if (emp.id === employeeId) {
        const newNotification: VulcanNotification = {
          id: Math.random().toString(36).substr(2, 9),
          employeeId: emp.id,
          title: "¡BONO AUTORIZADO!",
          message: `La Dirección General (${BONUS_APPROVER}) ha autorizado su bono de alto desempeño correspondiente a este período.`,
          date: today,
          type: 'bonus',
          read: false
        };
        return {
          ...emp,
          notifications: [newNotification, ...(emp.notifications || [])]
        };
      }
      return emp;
    }));
  };

  const employeesByDept = useMemo(() => {
    const groups: Record<string, Employee[]> = {};
    filteredEmployees.forEach(emp => {
      if (!groups[emp.department]) groups[emp.department] = [];
      groups[emp.department].push(emp);
    });
    return groups;
  }, [filteredEmployees]);

  const hasBeenEvaluatedThisMonth = (employeeId: string) => {
    const currentMonth = new Date().toLocaleString('es-ES', { month: 'long' }).toLowerCase();
    const currentYear = new Date().getFullYear().toString();
    return evaluationsHistory.some(ev => 
      ev.employeeId === employeeId && 
      ev.mes.toLowerCase() === currentMonth &&
      ev.año === currentYear
    );
  };

  const getPendingApprovals = (): FullEvaluation[] => {
    return evaluationsHistory.filter((ev: FullEvaluation) => ev.condicionBono === BonusStatus.PendingAuth);
  };

  if (!currentEvaluator) {
    return (
      <div className="min-h-screen bg-[#001a33] flex items-center justify-center p-6">
        <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 text-center animate-in zoom-in duration-500">
          <h1 className="text-3xl font-black text-[#003366] tracking-tighter mb-2">VULCAN<span className="text-[#FFCC00]">HR</span></h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">Acceso de Personal Autorizado</p>
          
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase mb-4">Seleccione su Identidad</p>
            {AUTHORIZED_EVALUATORS.map(name => (
              <button
                key={name}
                onClick={() => setCurrentEvaluator(name)}
                className={`w-full p-4 border-2 rounded-2xl text-sm font-bold flex justify-between items-center group transition-all ${
                  name === BONUS_APPROVER 
                    ? 'bg-[#003366] text-[#FFCC00] border-[#003366] hover:bg-[#002244]' 
                    : 'bg-slate-50 border-slate-100 text-[#003366] hover:border-[#003366]'
                }`}
              >
                {name}
                <span className="text-[10px] opacity-60 font-black">{name === BONUS_APPROVER ? 'DIRECTOR' : 'SUPERVISOR'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (isAddingEmployee) return <div className="py-8"><AddEmployeeForm onAdd={(data) => {
      const newEmp = { ...data, id: Math.random().toString(36).substr(2, 9), kpis: (employees[0]?.kpis || []).map(k => ({...k, score: 0})), lastEvaluation: 'Pendiente', summary: '', notifications: [] };
      setEmployees(prev => [newEmp, ...prev]);
      setIsAddingEmployee(false);
    }} onCancel={() => setIsAddingEmployee(false)} /></div>;

    if (evaluatingEmployee) return <div className="py-8"><EvaluationForm employee={evaluatingEmployee} evaluatorName={currentEvaluator} onClose={() => setEvaluatingEmployee(null)} onSave={handleSaveEvaluation} /></div>;

    if (selectedEmployee) return <EmployeeDetails employee={selectedEmployee} onBack={() => setSelectedEmployee(null)} />;

    switch (activeTab) {
      case 'dashboard': return <Dashboard employees={filteredEmployees} />;
      case 'employees': return <EmployeeList employees={filteredEmployees} onSelect={setSelectedEmployee} onAddNew={() => setIsAddingEmployee(true)} onBulkAdd={(text) => {
        const lines = text.split('\n');
        const batch = lines.map(l => {
          const p = l.split('\t');
          if (p.length < 2) return null;
          const defaultKpis = [
            { id: 'k1', name: 'Productividad', score: 0, weight: 40 },
            { id: 'k2', name: 'Calidad Operativa', score: 0, weight: 30 },
            { id: 'k3', name: 'Seguridad SIHOA', score: 0, weight: 30 }
          ];
          return { 
            id: Math.random().toString(36).substr(2, 9), 
            idNumber: p[0], 
            name: p[1], 
            role: p[2] || 'TECNICO', 
            department: Department.Operations, 
            photo: `https://picsum.photos/seed/${p[0]}/200/200`, 
            managerName: currentEvaluator, 
            managerRole: isJaquelin ? 'Director' : 'Supervisor', 
            lastEvaluation: 'Pendiente', 
            summary: '', 
            kpis: defaultKpis, 
            notifications: [] 
          };
        }).filter(Boolean) as Employee[];
        
        setEmployees(batch);
        setEvaluationsHistory([]);
        setActiveTab('employees');
      }} />;
      case 'evaluations':
        if (isJaquelin) {
          const pending = getPendingApprovals();
          return (
            <div className="space-y-10">
              <div className="bg-[#001a33] rounded-[40px] p-10 text-white shadow-2xl border-b-8 border-[#FFCC00]">
                 <h3 className="text-3xl font-black tracking-tight uppercase">Control de Bonos Especiales</h3>
                 <p className="text-[#FFCC00] mt-2 text-sm font-bold leading-relaxed">Bienvenida Directora {BONUS_APPROVER}. Usted debe autorizar únicamente los bonos de alto desempeño.</p>
              </div>
              
              <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">Solicitudes Pendientes ({pending.length})</h4>
                {pending.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-slate-300 font-bold uppercase text-xs"> No hay bonos pendientes de autorización técnica por ahora.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pending.map(ev => {
                      const emp = employees.find(e => e.id === ev.employeeId);
                      return (
                        <div key={ev.employeeId} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                          <div className="flex items-center space-x-4">
                             <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-600">
                               {(ev.promedioFinal * 20).toFixed(0)}%
                             </div>
                             <div>
                               <p className="font-black text-slate-800 uppercase text-sm">{emp?.name}</p>
                               <p className="text-[10px] text-slate-400 font-bold uppercase">Evaluado por: {ev.evaluador}</p>
                             </div>
                          </div>
                          <button 
                            onClick={() => handleApproveBonus(ev.employeeId)}
                            className="bg-[#003366] text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#FFCC00] hover:text-[#003366] transition-all"
                          >
                            Autorizar Bono
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-10">
            <div className="bg-[#003366] rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10 max-w-lg">
                 <h3 className="text-3xl font-black tracking-tight uppercase">Matriz de Campo</h3>
                 <p className="text-blue-200 mt-2 text-sm leading-relaxed">Bienvenido, <strong>{currentEvaluator}</strong>. Complete las evaluaciones mensuales.</p>
               </div>
            </div>

            {Object.entries(employeesByDept).map(([dept, deptEmployees]) => (
              <div key={dept} className="space-y-4">
                <div className="flex items-center space-x-4 px-4">
                  <span className="w-2 h-8 bg-[#FFCC00] rounded-full"></span>
                  <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Departamento: {dept}</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {deptEmployees.map(emp => {
                    const evaluated = hasBeenEvaluatedThisMonth(emp.id);
                    return (
                      <div key={emp.id} className={`bg-white rounded-3xl p-6 border-2 transition-all ${evaluated ? 'border-emerald-100 opacity-60' : 'border-slate-50 shadow-sm hover:border-[#003366]'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <img src={emp.photo} className="w-12 h-12 rounded-full grayscale" />
                          {evaluated ? (
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">Evaluado ✓</span>
                          ) : (
                            <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase">Pendiente</span>
                          )}
                        </div>
                        <h5 className="font-bold text-slate-800 uppercase text-sm truncate">{emp.name}</h5>
                        <button 
                          disabled={evaluated}
                          onClick={() => setEvaluatingEmployee(emp)}
                          className={`w-full mt-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${evaluated ? 'bg-slate-100 text-slate-400' : 'bg-[#003366] text-white hover:bg-[#002244] shadow-lg shadow-blue-900/10'}`}
                        >
                          {evaluated ? 'Reporte Listo' : 'Iniciar Evaluación'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      default: return <Dashboard employees={filteredEmployees} />;
    }
  };

  return (
    <Layout 
      activeTab={evaluatingEmployee || isAddingEmployee ? 'evaluations' : activeTab} 
      setActiveTab={setActiveTab}
      onDownloadReports={() => setShowReportsModal(true)}
      evaluatorName={currentEvaluator}
      onChangeEvaluator={() => setCurrentEvaluator(null)}
    >
      {renderContent()}
      {showReportsModal && (
        <MonthlyReportModal 
          evaluations={filteredEvaluationsForReport} 
          employees={filteredEmployees} 
          onClose={() => setShowReportsModal(false)} 
        />
      )}
    </Layout>
  );
};

export default App;
