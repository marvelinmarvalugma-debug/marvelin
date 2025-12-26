import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import EmployeeDetails from './components/EmployeeDetails';
import EvaluationForm from './components/EvaluationForm';
import AddEmployeeForm from './components/AddEmployeeForm';
import MonthlyReportModal from './components/MonthlyReportModal';
import Login from './pages/Login';
import { SessionContextProvider, useSession } from './components/SessionContextProvider';
import { INITIAL_EMPLOYEES } from './constants';
import { Employee, FullEvaluation, Department, AUTHORIZED_EVALUATORS, BONUS_APPROVER, BonusStatus, VulcanNotification, KPI } from './types';
import { supabase } from './integrations/supabase/client';

const AppContent: React.FC = () => {
  const { session, user, loading } = useSession();
  const navigate = useNavigate();

  const [currentEvaluatorName, setCurrentEvaluatorName] = useState<string | null>(null);
  const [isBonusApprover, setIsBonusApprover] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [evaluationsHistory, setEvaluationsHistory] = useState<FullEvaluation[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [evaluatingEmployee, setEvaluatingEmployee] = useState<Employee | null>(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!session) {
        navigate('/login');
      } else {
        // Fetch user profile to get their name and role
        const fetchProfile = async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', user?.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
            // Fallback to email if profile not found or error
            const emailName = user?.email?.split('@')[0] || 'Usuario';
            setCurrentEvaluatorName(emailName.toUpperCase());
            setIsBonusApprover(AUTHORIZED_EVALUATORS.includes(emailName.toUpperCase()) && emailName.toUpperCase() === BONUS_APPROVER);
          } else if (data) {
            const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
            setCurrentEvaluatorName(fullName.toUpperCase());
            setIsBonusApprover(fullName.toUpperCase() === BONUS_APPROVER);
          } else {
            // If no profile data, use email as a fallback
            const emailName = user?.email?.split('@')[0] || 'Usuario';
            setCurrentEvaluatorName(emailName.toUpperCase());
            setIsBonusApprover(AUTHORIZED_EVALUATORS.includes(emailName.toUpperCase()) && emailName.toUpperCase() === BONUS_APPROVER);
          }
        };
        fetchProfile();
        navigate('/'); // Redirect to home if logged in
      }
    }
  }, [session, loading, user, navigate]);

  const filteredEmployees = useMemo(() => {
    if (!currentEvaluatorName) return [];
    if (isBonusApprover) return employees;
    return employees.filter(emp => emp.managerName === currentEvaluatorName);
  }, [employees, currentEvaluatorName, isBonusApprover]);

  const filteredEvaluationsForReport = useMemo<FullEvaluation[]>(() => {
    if (isBonusApprover) return evaluationsHistory;
    return evaluationsHistory.filter((ev: FullEvaluation) => ev.evaluador === currentEvaluatorName);
  }, [evaluationsHistory, currentEvaluatorName, isBonusApprover]);

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
          message: `La Dirección General (${BONUS_APPROVER}) ha autorizado su bono correspondiente.`,
          date: today,
          type: 'bonus',
          read: false
        };
        return { ...emp, notifications: [newNotification, ...(emp.notifications || [])] };
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentEvaluatorName(null);
    setIsBonusApprover(false);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#001a33] flex items-center justify-center p-6">
        <div className="text-white text-2xl font-black tracking-tighter">Cargando...</div>
      </div>
    );
  }

  const renderContent = () => {
    if (isAddingEmployee) return <div className="py-8"><AddEmployeeForm onAdd={(data) => {
      const baseKpis: KPI[] = employees.length > 0 ? employees[0].kpis : [];
      const newEmp: Employee = { 
        ...data, 
        id: Math.random().toString(36).substr(2, 9), 
        kpis: baseKpis.map(k => ({...k, score: 0})), 
        lastEvaluation: 'Pendiente', 
        summary: '', 
        notifications: [] 
      };
      setEmployees(prev => [newEmp, ...prev]);
      setIsAddingEmployee(false);
    }} onCancel={() => setIsAddingEmployee(false)} /></div>;

    if (evaluatingEmployee) return <div className="py-8"><EvaluationForm employee={evaluatingEmployee} evaluatorName={currentEvaluatorName || 'N/A'} onClose={() => { setEvaluatingEmployee(null); setActiveTab('dashboard'); }} onSave={handleSaveEvaluation} /></div>;

    if (selectedEmployee) return <EmployeeDetails employee={selectedEmployee} evaluations={evaluationsHistory} onBack={() => setSelectedEmployee(null)} />;

    switch (activeTab) {
      case 'dashboard': return <Dashboard employees={filteredEmployees} />;
      case 'employees': return <EmployeeList employees={filteredEmployees} onSelect={setSelectedEmployee} onAddNew={() => setIsAddingEmployee(true)} />;
      case 'evaluations':
        if (isBonusApprover) {
          const pending = getPendingApprovals();
          return (
            <div className="space-y-10">
              <div className="bg-[#001a33] rounded-[40px] p-10 text-white shadow-2xl border-b-8 border-[#FFCC00]">
                 <h3 className="text-3xl font-black tracking-tight uppercase">Control de Bonos</h3>
                 <p className="text-[#FFCC00] mt-2 text-sm font-bold">Autorice los beneficios por alto desempeño técnico.</p>
              </div>
              <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">Pendientes ({pending.length})</h4>
                {pending.length === 0 ? <p className="text-center py-10 text-slate-300 font-bold uppercase text-xs">No hay bonos pendientes.</p> : (
                  <div className="space-y-4">
                    {pending.map(ev => {
                      const emp = employees.find(e => e.id === ev.employeeId);
                      return (
                        <div key={ev.employeeId} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                          <div className="flex items-center space-x-4">
                             <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-600">{(ev.promedioFinal * 20).toFixed(0)}%</div>
                             <div><p className="font-black text-slate-800 uppercase text-sm">{emp?.name}</p></div>
                          </div>
                          <button onClick={() => handleApproveBonus(ev.employeeId)} className="bg-[#003366] text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px]">Autorizar Bono</button>
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
            {(Object.entries(employeesByDept) as [string, Employee[]][]).map(([dept, deptEmployees]) => (
              <div key={dept} className="space-y-4">
                <h4 className="text-xl font-black text-slate-800 uppercase px-4">Departamento: {dept}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {deptEmployees.map(emp => {
                    const evaluated = hasBeenEvaluatedThisMonth(emp.id);
                    return (
                      <div key={emp.id} className={`bg-white rounded-3xl p-6 border-2 transition-all ${evaluated ? 'border-emerald-100 opacity-60' : 'border-slate-50 hover:border-[#003366]'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <img src={emp.photo} className="w-12 h-12 rounded-full grayscale" />
                          <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${evaluated ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                            {evaluated ? 'Evaluado ✓' : 'Pendiente'}
                          </span>
                        </div>
                        <h5 className="font-bold text-slate-800 uppercase text-sm truncate">{emp.name}</h5>
                        <button disabled={evaluated} onClick={() => setEvaluatingEmployee(emp)} className={`w-full mt-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${evaluated ? 'bg-slate-100 text-slate-400' : 'bg-[#003366] text-white'}`}>
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
      evaluatorName={currentEvaluatorName} 
      onChangeEvaluator={handleLogout}
      isBonusApprover={isBonusApprover}
    >
      {renderContent()}
      {showReportsModal && <MonthlyReportModal evaluations={filteredEvaluationsForReport} employees={filteredEmployees} onClose={() => setShowReportsModal(false)} />}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <SessionContextProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<AppContent />} />
      </Routes>
    </SessionContextProvider>
  );
};

export default App;