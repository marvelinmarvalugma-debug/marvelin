
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import EmployeeDetails from './components/EmployeeDetails';
import EvaluationForm from './components/EvaluationForm';
import AddEmployeeForm from './components/AddEmployeeForm';
import MonthlyReportModal from './components/MonthlyReportModal';
import SyncPanel from './components/SyncPanel';
import { VulcanDB } from './services/storageService';
import { Employee, FullEvaluation, Department, AUTHORIZED_EVALUATORS, BONUS_APPROVER, BonusStatus, VulcanNotification, KPI } from './types';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentEvaluator, setCurrentEvaluator] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [evaluationsHistory, setEvaluationsHistory] = useState<FullEvaluation[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [evaluatingEmployee, setEvaluatingEmployee] = useState<Employee | null>(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showSync, setShowSync] = useState(false);
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

    if (!VulcanDB.getMasterPassword()) {
      setIsSettingPassword(true);
    }
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

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSettingPassword) {
      if (passwordInput.length < 4) {
        alert("La clave debe tener al menos 4 caracteres.");
        return;
      }
      VulcanDB.setMasterPassword(passwordInput);
      setIsSettingPassword(false);
      setIsAuthenticated(true);
    } else {
      if (passwordInput === VulcanDB.getMasterPassword()) {
        setIsAuthenticated(true);
        setLoginError(false);
      } else {
        setLoginError(true);
      }
    }
  };

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

  const hasBeenEvaluatedThisMonth = (employeeId: string) => {
    const currentMonth = new Date().toLocaleString('es-ES', { month: 'long' }).toLowerCase();
    const currentYear = new Date().getFullYear().toString();
    return evaluationsHistory.some(ev => 
      ev.employeeId === employeeId && 
      ev.mes.toLowerCase() === currentMonth &&
      ev.año === currentYear
    );
  };

  if (!currentEvaluator || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#001a33] flex items-center justify-center p-6">
        <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 text-center animate-in zoom-in duration-500">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-1 bg-[#FFCC00] rounded-full"></div>
          </div>
          <h1 className="text-3xl font-black text-[#003366] tracking-tighter mb-2">VULCAN<span className="text-[#FFCC00]">HR</span></h1>
          
          {!currentEvaluator ? (
            <>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">Seleccione su Perfil de Acceso</p>
              <div className="space-y-3">
                {AUTHORIZED_EVALUATORS.map(name => (
                  <button
                    key={name}
                    onClick={() => setCurrentEvaluator(name)}
                    className={`w-full p-4 border-2 rounded-2xl text-sm font-bold flex justify-between items-center group transition-all hover:scale-[1.02] active:scale-95 ${
                      name === BONUS_APPROVER ? 'bg-[#003366] text-[#FFCC00] border-[#003366]' : 'bg-slate-50 border-slate-100 text-[#003366]'
                    }`}
                  >
                    {name}
                    <span className="text-[10px] opacity-60 font-black">{name === BONUS_APPROVER ? 'DIRECTOR' : 'SUPERVISOR'}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <form onSubmit={handleAuth} className="animate-in slide-in-from-bottom-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Acceso para: {currentEvaluator}</p>
              <h2 className="text-xl font-black text-[#003366] mb-6 uppercase tracking-tight">
                {isSettingPassword ? 'Crear Clave de Seguridad' : 'Ingrese su Clave'}
              </h2>
              {isSettingPassword && (
                <p className="text-[10px] text-slate-400 mb-6 bg-amber-50 p-4 rounded-xl border border-amber-100 font-bold uppercase">
                  ⚠️ Esta clave se le pedirá cada vez que ingrese. Guárdela bien.
                </p>
              )}
              <input
                autoFocus
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className={`w-full p-4 bg-slate-50 border-2 rounded-2xl text-center text-lg font-black tracking-[0.5em] outline-none transition-all ${loginError ? 'border-rose-300 bg-rose-50' : 'focus:border-[#003366] border-slate-100'}`}
              />
              {loginError && <p className="text-[10px] text-rose-500 font-black uppercase mt-4 animate-bounce">Clave Incorrecta</p>}
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <button 
                  type="button"
                  onClick={() => { setCurrentEvaluator(null); setPasswordInput(''); setLoginError(false); }}
                  className="py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest"
                >
                  Regresar
                </button>
                <button 
                  type="submit"
                  className="py-4 bg-[#003366] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-900/20"
                >
                  {isSettingPassword ? 'Establecer Clave' : 'Acceder'}
                </button>
              </div>
            </form>
          )}
          
          <p className="mt-8 text-[9px] text-slate-300 font-bold uppercase tracking-widest">Almacenamiento Local Activado</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (showSync) return <div className="py-8"><SyncPanel onComplete={() => setShowSync(false)} /></div>;
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

    if (evaluatingEmployee) return <div className="py-8"><EvaluationForm employee={evaluatingEmployee} evaluatorName={currentEvaluator} onClose={() => { setEvaluatingEmployee(null); setActiveTab('dashboard'); }} onSave={handleSaveEvaluation} /></div>;
    if (selectedEmployee) return <EmployeeDetails employee={selectedEmployee} evaluations={evaluationsHistory} onBack={() => setSelectedEmployee(null)} />;

    switch (activeTab) {
      case 'dashboard': return <Dashboard employees={filteredEmployees} />;
      case 'employees': return <EmployeeList employees={filteredEmployees} onSelect={setSelectedEmployee} onAddNew={() => setIsAddingEmployee(true)} onBulkAdd={handleBulkAdd} />;
      case 'evaluations':
        if (isJaquelin) {
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

  return (
    <Layout 
      activeTab={showSync ? 'Sincronización' : activeTab} 
      setActiveTab={(tab) => { setActiveTab(tab); setShowSync(false); }} 
      onDownloadReports={() => setShowReportsModal(true)} 
      onOpenSync={() => { setShowSync(true); setSelectedEmployee(null); setEvaluatingEmployee(null); setIsAddingEmployee(false); }}
      evaluatorName={currentEvaluator} 
      onChangeEvaluator={() => { setCurrentEvaluator(null); setIsAuthenticated(false); setPasswordInput(''); }}
      isSyncing={isSyncing}
    >
      {renderContent()}
      {showReportsModal && <MonthlyReportModal evaluations={filteredEvaluationsForReport} employees={filteredEmployees} onClose={() => setShowReportsModal(false)} />}
    </Layout>
  );
};

export default App;
