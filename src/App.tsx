import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import EmployeeDetails from './components/EmployeeDetails';
import EvaluationForm from './components/EvaluationForm';
import AddEmployeeForm from './components/AddEmployeeForm';
import MonthlyReportModal from './components/MonthlyReportModal';
import Login from './pages/Login';
import ApiKeyManagement from './pages/ApiKeyManagement';
import { SessionContextProvider, useSession } from './components/SessionContextProvider';
import { INITIAL_EMPLOYEES } from './constants';
import { Employee, FullEvaluation, Department, AUTHORIZED_EVALUATORS, BONUS_APPROVER, BonusStatus, VulcanNotification, KPI, TechnicalCriterion } from './types';
import { supabase } from './integrations/supabase/client';

const AppContent: React.FC = () => {
  const { session, user, userProfile, loading } = useSession();
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

  // Effect to handle authentication and set evaluator details
  useEffect(() => {
    if (loading) return; // Wait until session loading is complete

    if (!session) {
      // If not authenticated, redirect to login, unless already there
      if (window.location.pathname !== '/login') {
        navigate('/login');
      }
    } else {
      // If authenticated
      if (userProfile) {
        const fullName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();
        setCurrentEvaluatorName(fullName.toUpperCase());
        setIsBonusApprover(userProfile.is_bonus_approver);
      } else {
        // Fallback if profile not found, use email part
        const emailName = user?.email?.split('@')[0] || 'Usuario';
        setCurrentEvaluatorName(emailName.toUpperCase());
        // Determine if fallback user is the bonus approver
        setIsBonusApprover(emailName.toUpperCase() === BONUS_APPROVER);
      }

      // If authenticated and currently on the login page, redirect to home
      if (window.location.pathname === '/login') {
        navigate('/');
      }
    }
  }, [session, loading, user, userProfile, navigate]);

  // Fetch evaluations from Supabase
  useEffect(() => {
    const fetchEvaluations = async () => {
      if (session?.user) {
        const { data, error } = await supabase
          .from('evaluations')
          .select('*'); // RLS will filter based on user_id or is_bonus_approver

        if (error) {
          console.error('Error fetching evaluations:', error);
        } else {
          const fetchedEvals: FullEvaluation[] = data.map((dbEval: any) => ({
            employeeId: dbEval.employee_id,
            campo: dbEval.campo,
            mes: dbEval.mes,
            año: dbEval.año,
            evaluador: dbEval.evaluador_name,
            cargoEvaluador: dbEval.cargo_evaluador,
            areaDesempeño: dbEval.area_desempeño,
            criteria: dbEval.criteria as TechnicalCriterion[],
            observaciones: dbEval.observaciones,
            condicionBono: dbEval.condicion_bono as BonusStatus,
            recomendacionSalarial: dbEval.recomendacion_salarial,
            totalPuntos: dbEval.total_puntos,
            promedioFinal: dbEval.promedio_final,
            date: dbEval.evaluation_date,
            authorizedBy: dbEval.authorized_by,
          }));
          setEvaluationsHistory(fetchedEvals);
        }
      }
    };

    if (session?.user && currentEvaluatorName) { // Only fetch if user is logged in and evaluator name is set
      fetchEvaluations();
    }
  }, [session?.user, currentEvaluatorName]); // Re-fetch when session or evaluator name changes

  const filteredEmployees = useMemo(() => {
    if (!currentEvaluatorName) return [];
    if (isBonusApprover) return employees;
    return employees.filter(emp => emp.managerName === currentEvaluatorName);
  }, [employees, currentEvaluatorName, isBonusApprover]);

  const filteredEvaluationsForReport = useMemo<FullEvaluation[]>(() => {
    if (isBonusApprover) return evaluationsHistory;
    return evaluationsHistory.filter((ev: FullEvaluation) => ev.evaluador === currentEvaluatorName);
  }, [evaluationsHistory, currentEvaluatorName, isBonusApprover]);

  const handleSaveEvaluation = useCallback(async (evaluation: FullEvaluation) => {
    if (!user?.id) {
      console.error("User not logged in, cannot save evaluation.");
      return;
    }

    const { data, error } = await supabase
      .from('evaluations')
      .insert({
        employee_id: evaluation.employeeId,
        evaluator_id: user.id,
        campo: evaluation.campo,
        mes: evaluation.mes,
        año: evaluation.año,
        evaluador_name: evaluation.evaluador,
        cargo_evaluador: evaluation.cargoEvaluador,
        area_desempeño: evaluation.areaDesempeño,
        criteria: evaluation.criteria,
        observaciones: evaluation.observaciones,
        condicion_bono: evaluation.condicionBono,
        recomendacion_salarial: evaluation.recomendacionSalarial,
        total_puntos: evaluation.totalPuntos,
        promedio_final: evaluation.promedioFinal,
        evaluation_date: evaluation.date,
        authorized_by: evaluation.authorizedBy,
      })
      .select();

    if (error) {
      console.error('Error saving evaluation to Supabase:', error);
    } else if (data && data.length > 0) {
      const newDbEval = data[0];
      const newFullEval: FullEvaluation = {
        employeeId: newDbEval.employee_id,
        campo: newDbEval.campo,
        mes: newDbEval.mes,
        año: newDbEval.año,
        evaluador: newDbEval.evaluador_name,
        cargoEvaluador: newDbEval.cargo_evaluador,
        areaDesempeño: newDbEval.area_desempeño,
        criteria: newDbEval.criteria as TechnicalCriterion[],
        observaciones: newDbEval.observaciones,
        condicionBono: newDbEval.condicion_bono as BonusStatus,
        recomendacionSalarial: newDbEval.recomendacion_salarial,
        totalPuntos: newDbEval.total_puntos,
        promedioFinal: newDbEval.promedio_final,
        date: newDbEval.evaluation_date,
        authorizedBy: newDbEval.authorized_by,
      };
      setEvaluationsHistory(prev => [...prev, newFullEval]);
      setEmployees(prev => prev.map(emp => 
        emp.id === evaluation.employeeId 
          ? { 
              ...emp, 
              lastEvaluation: `${evaluation.mes} ${evaluation.año}`,
              kpis: emp.kpis.map(k => ({ ...k, score: Math.round(evaluation.promedioFinal * 20) }))
            } 
          : emp
      ));
    }
  }, [user?.id]);

  const handleApproveBonus = useCallback(async (employeeId: string) => {
    if (!user?.id || !isBonusApprover) {
      console.error("Unauthorized to approve bonus.");
      return;
    }

    const today = new Date().toISOString().split('T')[0]; // Use ISO string for date
    
    // Find the evaluation to update
    const evaluationToUpdate = evaluationsHistory.find(ev => 
      ev.employeeId === employeeId && ev.condicionBono === BonusStatus.PendingAuth
    );

    if (!evaluationToUpdate) {
      console.warn("No pending bonus evaluation found for this employee.");
      return;
    }

    const { data, error } = await supabase
      .from('evaluations')
      .update({ 
        condicion_bono: BonusStatus.Approved, 
        authorized_by: BONUS_APPROVER 
      })
      .eq('employee_id', employeeId)
      .eq('condicion_bono', BonusStatus.PendingAuth)
      .select();

    if (error) {
      console.error('Error approving bonus in Supabase:', error);
    } else if (data && data.length > 0) {
      const updatedDbEval = data[0];
      const updatedFullEval: FullEvaluation = {
        employeeId: updatedDbEval.employee_id,
        campo: updatedDbEval.campo,
        mes: updatedDbEval.mes,
        año: updatedDbEval.año,
        evaluador: updatedDbEval.evaluador_name,
        cargoEvaluador: updatedDbEval.cargo_evaluador,
        areaDesempeño: updatedDbEval.area_desempeño,
        criteria: updatedDbEval.criteria as TechnicalCriterion[],
        observaciones: updatedDbEval.observaciones,
        condicionBono: updatedDbEval.condicion_bono as BonusStatus,
        recomendacionSalarial: updatedDbEval.recomendacion_salarial,
        totalPuntos: updatedDbEval.total_puntos,
        promedioFinal: updatedDbEval.promedio_final,
        date: updatedDbEval.evaluation_date,
        authorizedBy: updatedDbEval.authorized_by,
      };

      setEvaluationsHistory(prev => prev.map(ev => 
        ev.employeeId === employeeId && ev.condicionBono === BonusStatus.PendingAuth
          ? updatedFullEval
          : ev
      ));

      setEmployees(prev => prev.map(emp => {
        if (emp.id === employeeId) {
          const newNotification: VulcanNotification = {
            id: Math.random().toString(36).substr(2, 9),
            employeeId: emp.id,
            title: "¡BONO AUTORIZADO!",
            message: `La Dirección General (${BONUS_APPROVER}) ha autorizado su bono correspondiente.`,
            date: new Date().toLocaleDateString('es-ES'),
            type: 'bonus',
            read: false
          };
          return { ...emp, notifications: [newNotification, ...(emp.notifications || [])] };
        }
        return emp;
      }));
    }
  }, [user?.id, isBonusApprover, evaluationsHistory]);

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

  // If not authenticated, the useEffect will redirect to /login.
  // If authenticated, we render the main app content.
  if (!session) {
    return null; // Render nothing here, let the router handle the /login route
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
      userRole={userProfile?.role || 'evaluator'}
    >
      {renderContent()}
      {showReportsModal && <MonthlyReportModal evaluations={filteredEvaluationsForReport} employees={filteredEmployees} onClose={() => setShowReportsModal(false)} />}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <SessionContextProvider>
      <Toaster />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/api-keys" element={<ApiKeyManagement />} />
        <Route path="/" element={<AppContent />} />
      </Routes>
    </SessionContextProvider>
  );
};

export default App;