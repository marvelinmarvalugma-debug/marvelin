import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import EmployeeDetails from './components/EmployeeDetails';
import EvaluationForm from './components/EvaluationForm';
import AddEmployeeForm from './components/AddEmployeeForm';
import MonthlyReportModal from './components/MonthlyReportModal';
import LoginPage from './src/pages/LoginPage';
import ProfileCompletionForm from './src/components/ProfileCompletionForm'; // Nueva importación
import { SessionContextProvider, useSession } from './src/components/SessionContextProvider';
import { VulcanDB } from './services/storageService';
import { Employee, FullEvaluation, Department, AUTHORIZED_EVALUATORS, BONUS_APPROVER, BonusStatus, VulcanNotification, KPI } from './types';
import { supabase } from './src/integrations/supabase/client';
import toast, { Toaster } from 'react-hot-toast'; // Nueva importación para toasts

const AppContent: React.FC = () => {
  const { session, user } = useSession();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentEvaluator, setCurrentEvaluator] = useState<string | null>(null);
  const [currentEvaluatorRole, setCurrentEvaluatorRole] = useState<string | null>(null);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false); // Nuevo estado
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [evaluationsHistory, setEvaluationsHistory] = useState<FullEvaluation[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [evaluatingEmployee, setEvaluatingEmployee] = useState<Employee | null>(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Inicialización y Sincronización Automática
  useEffect(() => {
    VulcanDB.initialize();
    setEmployees(VulcanDB.getEmployees());
    setEvaluationsHistory(VulcanDB.getEvaluations());
    setIsInitialized(true);
    
    // Escuchar cambios de otras pestañas
    VulcanDB.onSync((payload) => {
      setIsSyncing(true);
      if (payload.type === 'SYNC_EMPLOYEES') {
        setEmployees(payload.data);
      } else if (payload.type === 'SYNC_EVALUATIONS') {
        setEvaluationsHistory(payload.data);
      }
      setTimeout(() => setIsSyncing(false), 800);
    });
  }, []);

  // Persistencia automática con trigger de sincronización
  useEffect(() => {
    if (isInitialized) {
      setIsSyncing(true);
      VulcanDB.saveEmployees(employees);
      const timer = setTimeout(() => setIsSyncing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [employees, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setIsSyncing(true);
      VulcanDB.saveEvaluations(evaluationsHistory);
      const timer = setTimeout(() => setIsSyncing(false), 500);
      return () => clearTimeout(timer);
    }
  }, [evaluationsHistory, isInitialized]);

  // Lógica para obtener el perfil del usuario de Supabase y verificar si necesita completarse
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setCurrentEvaluator(user.email || 'Usuario Desconocido');
          setCurrentEvaluatorRole('evaluator');
          // Si hay un error o el perfil no existe, asumimos que necesita completarse
          setNeedsProfileCompletion(true); 
        } else if (data) {
          setCurrentEvaluator(`${data.first_name} ${data.last_name}`);
          setCurrentEvaluatorRole(data.role);
          // Si el nombre o apellido están vacíos, el perfil necesita completarse
          if (!data.first_name || !data.last_name) {
            setNeedsProfileCompletion(true);
          } else {
            setNeedsProfileCompletion(false);
          }
        }
      } else {
        setCurrentEvaluator(null);
        setCurrentEvaluatorRole(null);
        setNeedsProfileCompletion(false); // No hay usuario, no se necesita completar perfil
      }
    };

    fetchUserProfile();
  }, [user]);

  const isJaquelin = currentEvaluator === BONUS_APPROVER;

  const filteredEmployees = useMemo(() => {
    if (!currentEvaluator) return [];
    if (isJaquelin) return employees;
    return employees.filter(emp => emp.managerName === currentEvaluator);
  }, [employees, currentEvaluator, isJaquelin]);

  const filteredEvaluationsForReport = useMemo<FullEvaluation[]>(() => {
    if (isJaquelin) return evaluationsHistory;
    return evaluationsHistory.filter((ev: FullEvaluation) => ev.evaluador === currentEvaluator);
  }, [evaluationsHistory, currentEvaluator, isJaquelin]);

  const handleSaveEvaluation = (evaluation: FullEvaluation) => {
    setEvaluationsHistory(prev => {
      const filtered = prev.filter(ev => 
        !(ev.employeeId === evaluation.employeeId && 
          ev.mes.toLowerCase() === evaluation.mes.toLowerCase() && 
          ev.año === evaluation.año)
      );
      return [...filtered, evaluation];
    });

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

  const handleBulkAdd = (data: string) => {
    const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');
    const newEmps: Employee[] = [];
    
    lines.forEach(line => {
      let parts = line.split('\t');
      if (parts.length < 2) parts = line.split(';');
      if (parts.length < 2) parts = line.split(',');

      if (parts.length >= 2) {
        newEmps.push({
          id: Math.random().toString(36).substr(2, 9),
          idNumber: parts[0].trim(),
          name: parts[1].trim(),
          role: parts[2] ? parts[2].trim() : 'OPERARIO',
          department: Department.Operations,
          photo: `https://picsum.photos/seed/${Math.random()}/200/200`,
          managerName: currentEvaluator || AUTHORIZED_EVALUATORS[0],
          managerRole: 'Supervisor de Área',
          lastEvaluation: 'Pendiente',
          summary: '',
          kpis: [
            { id: 'k1', name: 'Productividad', score: 0, weight: 40 },
            { id: 'k2', name: 'Calidad Operativa', score: 0, weight: 30 },
            { id: 'k3', name: 'Seguridad SIHOA', score: 0, weight: 30 }
          ],
          notifications: []
        });
      }
    });

    if (newEmps.length > 0) {
      setEmployees(prev => [...newEmps, ...prev]);
    }
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
          message: `La Dirección General (${BONUS_APPROVER}) ha autorizada su bono correspondiente.`,
          date: today,
          type: 'bonus',
          read: false
        };
        return { ...emp, notifications: [newNotification, ...(emp.notifications || [])] };
      }
      return emp;
    }));
  };

  const hasBeenEvaluatedThisMonth = (employeeId: string) => {
    const currentMonth = new Date().toLocaleString('es-ES', { month: 'long' }).toLowerCase();
    const currentYear = new Date().getFullYear().toString();
    return evaluationsHistory.some(ev => 
      ev.employeeId === employeeId && 
      ev.mes.toLowerCase() === currentMonth &&
      ev.año === currentYear
    );
  };

  if (!session) {
    return <LoginPage />;
  }

  // Si el usuario está logueado pero necesita completar su perfil
  if (needsProfileCompletion && user) {
    return <ProfileCompletionForm userId={user.id} onProfileComplete={() => {
      setNeedsProfileCompletion(false);
      // Forzar una re-carga del perfil para actualizar el nombre y rol en la UI
      // Esto se puede hacer llamando a fetchUserProfile() directamente o forzando un re-render
      // Para simplificar, el useEffect de user se encargará de re-fetch al cambiar el estado.
    }} />;
  }

  const renderContent = () => {
    if (isAddingEmployee) return <div className="py-8"><AddEmployeeForm onAdd={(data) => {
      const baseKpis: KPI[] = employees.length > 0 ? employees[0].kpis : [
        { id: 'k1', name: 'Productividad', score: 0, weight: 40 },
        { id: 'k2', name: 'Calidad Operativa', score: 0, weight: 30 },
        { id: 'k3', name: 'Seguridad SIHOA', score: 0, weight: 30 }
      ];
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

    if (evaluatingEmployee) return <div className="py-8"><EvaluationForm employee={evaluatingEmployee} evaluatorName={currentEvaluator || 'Desconocido'} onClose={() => { setEvaluatingEmployee(null); setActiveTab('dashboard'); }} onSave={handleSaveEvaluation} /></div>;
    if (selectedEmployee) return <EmployeeDetails employee={selectedEmployee} evaluations={evaluationsHistory} onBack={() => setSelectedEmployee(null)} />;

    switch (activeTab) {
      case 'dashboard': return <Dashboard employees={filteredEmployees} />;
      case 'employees': return <EmployeeList employees={filteredEmployees} onSelect={setSelectedEmployee} onAddNew={() => setIsAddingEmployee(true)} onBulkAdd={handleBulkAdd} />;
      case 'evaluations':
        if (currentEvaluatorRole === 'director') { // Usar el rol para la lógica de aprobación de bonos
          const pending = evaluationsHistory.filter((ev: FullEvaluation) => ev.condicionBono === BonusStatus.PendingAuth);
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
        
        const groups: Record<string, Employee[]> = {};
        filteredEmployees.forEach(emp => {
          if (!groups[emp.department]) groups[emp.department] = [];
          groups[emp.department].push(emp);
        });

        return (
          <div className="space-y-10">
            {Object.entries(groups).map(([dept, deptEmployees]) => (
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={(tab) => { setActiveTab(tab); }} 
      onDownloadReports={() => setShowReportsModal(true)} 
      evaluatorName={currentEvaluator} 
      evaluatorRole={currentEvaluatorRole}
      onChangeEvaluator={handleSignOut}
      isSyncing={isSyncing}
    >
      {renderContent()}
      {showReportsModal && <MonthlyReportModal evaluations={filteredEvaluationsForReport} employees={filteredEmployees} onClose={() => setShowReportsModal(false)} />}
    </Layout>
  );
};

const App: React.FC = () => (
  <SessionContextProvider>
    <Toaster /> {/* Añadir Toaster aquí para mostrar notificaciones */}
    <AppContent />
  </SessionContextProvider>
);

export default App;