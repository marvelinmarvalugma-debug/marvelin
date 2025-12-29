
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import EmployeeDetails from './components/EmployeeDetails';
import EvaluationForm from './components/EvaluationForm';
import AddEmployeeForm from './components/AddEmployeeForm';
import MonthlyReportModal from './components/MonthlyReportModal';
import DatabaseConsole from './components/DatabaseConsole';
import { VulcanDB } from './services/storageService';
import { 
  Employee, FullEvaluation, Department, 
  AUTHORIZED_EVALUATORS, BONUS_APPROVER, SALARY_APPROVERS, BonusStatus, 
  VulcanNotification, KPI, User, UserRole 
} from './types';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [evaluationsHistory, setEvaluationsHistory] = useState<FullEvaluation[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [evaluatingEmployee, setEvaluatingEmployee] = useState<Employee | null>(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    VulcanDB.initialize();
    setEmployees(VulcanDB.getEmployees());
    setEvaluationsHistory(VulcanDB.getEvaluations());
    setIsInitialized(true);
    
    VulcanDB.onSync((payload) => {
      setIsSyncing(true);
      if (payload.type === 'SYNC_EMPLOYEES') setEmployees(payload.data);
      if (payload.type === 'SYNC_EVALUATIONS') setEvaluationsHistory(payload.data);
      if (payload.type === 'SYNC_USERS' && currentUser) {
        const updated = (payload.data as User[]).find(u => u.username === currentUser.username);
        if (updated) setCurrentUser(updated);
      }
      setTimeout(() => setIsSyncing(false), 800);
    });
  }, [currentUser]);

  useEffect(() => {
    if (isInitialized) {
      setIsSyncing(true);
      VulcanDB.saveEmployees(employees);
      setTimeout(() => setIsSyncing(false), 500);
    }
  }, [employees, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      setIsSyncing(true);
      VulcanDB.saveEvaluations(evaluationsHistory);
      setTimeout(() => setIsSyncing(false), 500);
    }
  }, [evaluationsHistory, isInitialized]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!currentUser.password) {
      if (passwordInput.length < 4) {
        alert("La clave debe tener al menos 4 caracteres.");
        return;
      }
      const updatedUser = { ...currentUser, password: passwordInput };
      VulcanDB.updateUser(updatedUser);
      setCurrentUser(updatedUser);
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      if (passwordInput === currentUser.password) {
        setIsAuthenticated(true);
        setLoginError(false);
      } else {
        setLoginError(true);
      }
    }
  };

  const isDirector = currentUser?.role === UserRole.Director;
  const isSalaryApprover = currentUser && SALARY_APPROVERS.includes(currentUser.username);

  const filteredEmployees = useMemo(() => {
    if (!currentUser) return [];
    if (isDirector) return employees;
    return employees.filter(emp => emp.managerName.toLowerCase().trim() === currentUser.username.toLowerCase().trim());
  }, [employees, currentUser, isDirector]);

  const filteredEvaluationsForReport = useMemo<FullEvaluation[]>(() => {
    if (isDirector) return evaluationsHistory;
    return evaluationsHistory.filter((ev: FullEvaluation) => ev.evaluador.toLowerCase().trim() === currentUser?.username.toLowerCase().trim());
  }, [evaluationsHistory, currentUser, isDirector]);

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

  const handleApproveBonus = (employeeId: string, mes: string, anio: string, status: BonusStatus, increment?: string) => {
    if (!isDirector) return;
    setEvaluationsHistory(prev => prev.map(ev => 
      (ev.employeeId === employeeId && ev.mes === mes && ev.año === anio) 
        ? { ...ev, condicionBono: status, incrementoSalarial: increment || ev.incrementoSalarial, authorizedBy: currentUser?.username } 
        : ev
    ));
  };

  const handleBulkAdd = (data: string, type: 'ato' | 'vulcan') => {
    if (isDirector) return;
    const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');
    const newEmps: Employee[] = [];
    const discoveredEvaluators = new Set<string>();
    
    lines.forEach((line, index) => {
      const upperLine = line.toUpperCase();
      if (index === 0 && (upperLine.includes('NOMBRE') || upperLine.includes('IDENTIDAD') || upperLine.includes('CARGO'))) {
        return;
      }

      let parts = line.split('\t');
      if (parts.length < 2) parts = line.split(';');

      if (parts.length >= 2) {
        const idNum = parts[0]?.trim() || `ID-${Math.random().toString(36).substr(2, 5)}`;
        const name = parts[1]?.trim() || 'SIN NOMBRE';
        const role = parts[2]?.trim() || 'PERSONAL';
        const manager = parts[4]?.trim() || currentUser?.username || 'Casa Matriz';

        newEmps.push({
          id: Math.random().toString(36).substr(2, 9),
          idNumber: idNum,
          name: name,
          role: role,
          department: type === 'ato' ? Department.ATO : Department.VULCAN,
          photo: `https://picsum.photos/seed/${idNum.replace(/\D/g,'') || idNum}/200/200`,
          managerName: manager,
          managerRole: 'Supervisor Autorizado',
          lastEvaluation: 'Pendiente',
          summary: '',
          kpis: [
            { id: 'k1', name: 'Productividad', score: 0, weight: 40 },
            { id: 'k2', name: 'Calidad Operativa', score: 0, weight: 30 },
            { id: 'k3', name: 'Seguridad SIHOA', score: 0, weight: 30 }
          ],
          notifications: []
        });

        discoveredEvaluators.add(manager);
      }
    });

    if (discoveredEvaluators.size > 0) {
      const existingUsers = VulcanDB.getUsers();
      let usersChanged = false;
      const updatedUsers = [...existingUsers];

      discoveredEvaluators.forEach(mgr => {
        const alreadyExists = updatedUsers.some(u => u.username.toLowerCase().trim() === mgr.toLowerCase().trim());
        if (!alreadyExists && mgr !== 'Casa Matriz') {
          updatedUsers.push({
            username: mgr,
            role: SALARY_APPROVERS.includes(mgr) ? UserRole.Director : UserRole.Supervisor,
            password: ''
          });
          usersChanged = true;
        }
      });

      if (usersChanged) {
        localStorage.setItem('vulcan_db_users_v1', JSON.stringify(updatedUsers));
      }
    }

    if (newEmps.length > 0) {
      setEmployees(prev => {
        const existingIds = new Set(prev.map(e => e.idNumber));
        const nonDuplicates = newEmps.filter(e => !existingIds.has(e.idNumber));
        return [...nonDuplicates, ...prev];
      });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setPasswordInput('');
    setLoginError(false);
    setEvaluatingEmployee(null);
    setSelectedEmployee(null);
    setIsAddingEmployee(false);
    setActiveTab('dashboard');
    setShowReportsModal(false);
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

  if (!currentUser || !isAuthenticated) {
    const usersTable = VulcanDB.getUsers();
    return (
      <div className="min-h-screen bg-[#001a33] flex items-center justify-center p-6">
        <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 text-center animate-in zoom-in duration-500">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-1 bg-[#FFCC00] rounded-full"></div>
          </div>
          <h1 className="text-3xl font-black text-[#003366] tracking-tighter mb-2">VULCAN<span className="text-[#FFCC00]">HR</span></h1>
          
          {!currentUser ? (
            <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Acceso Sistema de Evaluación</p>
              <div className="space-y-2">
                {usersTable.map(user => (
                  <button
                    key={user.username}
                    onClick={() => setCurrentUser(user)}
                    className={`w-full p-4 border-2 rounded-[24px] text-xs font-bold flex justify-between items-center group transition-all hover:scale-[1.02] active:scale-95 ${
                      user.role === UserRole.Director ? 'bg-[#003366] text-[#FFCC00] border-[#003366] shadow-xl shadow-blue-900/10' : 'bg-slate-50 border-slate-100 text-[#003366]'
                    }`}
                  >
                    <span className="truncate pr-4">{user.username}</span>
                    <span className="text-[8px] opacity-60 font-black uppercase whitespace-nowrap">{user.role}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="animate-in slide-in-from-bottom-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Usuario: {currentUser.username}</p>
              <h2 className="text-xl font-black text-[#003366] mb-6 uppercase tracking-tight">Validar Acceso</h2>
              <input
                autoFocus
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className={`w-full p-4 bg-slate-50 border-2 rounded-2xl text-center text-lg font-black tracking-[0.5em] outline-none transition-all ${loginError ? 'border-rose-300 bg-rose-50' : 'focus:border-[#003366] border-slate-100'}`}
              />
              <div className="grid grid-cols-2 gap-4 mt-8">
                <button type="button" onClick={() => { setCurrentUser(null); setPasswordInput(''); }} className="py-4 text-slate-400 font-black uppercase text-[10px]">Atrás</button>
                <button type="submit" className="py-4 bg-[#003366] text-white rounded-2xl font-black uppercase text-[10px] shadow-xl shadow-blue-900/20">Entrar</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (isAddingEmployee && !isDirector) return <div className="py-8"><AddEmployeeForm onAdd={(data) => {
      const newEmp: Employee = { 
        ...data, 
        id: Math.random().toString(36).substr(2, 9), 
        kpis: [{ id: 'k1', name: 'Productividad', score: 0, weight: 40 }, { id: 'k2', name: 'Calidad', score: 0, weight: 30 }, { id: 'k3', name: 'Seguridad', score: 0, weight: 30 }], 
        lastEvaluation: 'Pendiente', summary: '', notifications: [] 
      };
      setEmployees(prev => [newEmp, ...prev]);
      setIsAddingEmployee(false);
    }} onCancel={() => setIsAddingEmployee(false)} /></div>;

    if (evaluatingEmployee && !isDirector) return <div className="py-8"><EvaluationForm employee={evaluatingEmployee} evaluatorName={currentUser.username} onClose={() => setEvaluatingEmployee(null)} onSave={handleSaveEvaluation} /></div>;
    if (selectedEmployee) return <EmployeeDetails employee={selectedEmployee} evaluations={evaluationsHistory} onBack={() => setSelectedEmployee(null)} currentUserRole={currentUser?.role} />;

    switch (activeTab) {
      case 'dashboard': return <Dashboard employees={filteredEmployees} />;
      case 'employees': return <EmployeeList employees={filteredEmployees} onSelect={setSelectedEmployee} onAddNew={() => setIsAddingEmployee(true)} onBulkAdd={handleBulkAdd} isReadOnly={isDirector} />;
      case 'database': return <DatabaseConsole />;
      case 'evaluations':
        if (isDirector) {
          const pending = evaluationsHistory.filter((ev: FullEvaluation) => ev.condicionBono === BonusStatus.PendingAuth);
          return (
             <div className="space-y-6">
               <div className="bg-[#001a33] p-10 rounded-[40px] text-white shadow-xl border-b-8 border-[#FFCC00]">
                 <h3 className="text-3xl font-black uppercase">Panel de Aprobación de Beneficios</h3>
                 <p className="text-[#FFCC00] text-sm font-bold mt-2">Personal con desempeño excepcional esperando su autorización.</p>
               </div>
               {pending.length === 0 ? (
                 <div className="bg-white rounded-3xl p-20 text-center border-2 border-dashed border-slate-100">
                    <p className="text-slate-300 font-black uppercase text-xs tracking-widest">No hay firmas pendientes para este ciclo</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {pending.map(ev => {
                     const emp = employees.find(e => e.id === ev.employeeId);
                     const isEmpVulcan = emp?.department === Department.VULCAN;
                     
                     return (
                       <div key={`${ev.employeeId}-${ev.mes}`} className="bg-white p-8 rounded-[32px] border-2 border-slate-50 shadow-sm space-y-4">
                         <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                               <img src={emp?.photo} className="w-12 h-12 rounded-xl grayscale" />
                               <div>
                                  <p className="font-black text-[#003366] uppercase text-sm">{emp?.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{emp?.department} • {ev.mes} {ev.año}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-2xl font-black text-indigo-600">{(ev.promedioFinal * 20).toFixed(1)}%</p>
                               <p className="text-[8px] font-black uppercase text-slate-300">Puntaje</p>
                            </div>
                         </div>
                         
                         {isEmpVulcan && (
                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
                               <span className="text-[10px] font-black text-emerald-800 uppercase">Incremento VULCAN:</span>
                               {isSalaryApprover ? (
                                  <input 
                                    className="bg-white border-2 border-emerald-300 px-3 py-1 rounded-lg text-xs font-black text-emerald-600 w-24 text-center"
                                    value={ev.incrementoSalarial || "0%"}
                                    onChange={(e) => {
                                      const newVal = e.target.value;
                                      setEvaluationsHistory(prev => prev.map(item => 
                                        item === ev ? { ...item, incrementoSalarial: newVal } : item
                                      ));
                                    }}
                                  />
                               ) : (
                                  <span className="text-lg font-black text-emerald-600">{ev.incrementoSalarial || "0%"}</span>
                               )}
                            </div>
                         )}

                         <div className="p-4 bg-slate-50 rounded-2xl italic text-[10px] text-slate-600 border border-slate-100">
                            "{ev.observaciones || 'Sin comentarios adicionales.'}"
                         </div>
                         
                         <div className="grid grid-cols-3 gap-3">
                            <button 
                              onClick={() => handleApproveBonus(ev.employeeId, ev.mes, ev.año, BonusStatus.Approved, ev.incrementoSalarial)}
                              className="bg-emerald-500 text-white py-3 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/10"
                            >
                              Aprobar
                            </button>
                            <button 
                              onClick={() => handleApproveBonus(ev.employeeId, ev.mes, ev.año, BonusStatus.Conditioned, ev.incrementoSalarial)}
                              className="bg-amber-500 text-white py-3 rounded-xl text-[9px] font-black uppercase hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/10"
                            >
                              Condicionar
                            </button>
                            <button 
                              onClick={() => handleApproveBonus(ev.employeeId, ev.mes, ev.año, BonusStatus.NotApproved, ev.incrementoSalarial)}
                              className="bg-rose-500 text-white py-3 rounded-xl text-[9px] font-black uppercase hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/10"
                            >
                              Denegar
                            </button>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               )}
             </div>
          );
        }
        
        const groups = { ATO: [], VULCAN: [] };
        filteredEmployees.forEach(emp => {
          if (emp.department === Department.ATO) (groups.ATO as Employee[]).push(emp);
          else (groups.VULCAN as Employee[]).push(emp);
        });

        return (
          <div className="space-y-10">
            {Object.entries(groups).map(([groupName, groupEmps]) => groupEmps.length > 0 && (
              <div key={groupName} className="space-y-4">
                <div className="bg-white px-8 py-4 rounded-[32px] border-l-8 border-[#003366] shadow-sm flex items-center justify-between">
                   <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">UNIVERSO: PERSONAL {groupName}</h4>
                   <span className="bg-slate-50 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-400 uppercase">{groupEmps.length} COLABORADORES</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupEmps.map(emp => {
                    const evaluated = hasBeenEvaluatedThisMonth(emp.id);
                    return (
                      <div key={emp.id} className={`bg-white rounded-[32px] p-6 border-2 transition-all ${evaluated ? 'opacity-50 border-emerald-100' : 'border-slate-50 hover:border-[#003366]'}`}>
                        <div className="flex justify-between items-start mb-4">
                           <img src={emp.photo} className="w-14 h-14 rounded-2xl grayscale" />
                           <span className={`text-[8px] font-black px-4 py-2 rounded-xl uppercase ${evaluated ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                              {evaluated ? 'Evaluado ✓' : 'Pendiente'}
                           </span>
                        </div>
                        <h5 className="font-black text-slate-800 uppercase text-xs truncate leading-none mb-1">{emp.name}</h5>
                        <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{emp.role}</p>
                        <button disabled={evaluated} onClick={() => setEvaluatingEmployee(emp)} className={`w-full mt-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${evaluated ? 'bg-slate-100 text-slate-300' : 'bg-[#003366] text-white shadow-xl shadow-blue-900/10'}`}>
                           {evaluated ? 'Periodo Completo' : 'Evaluar Colaborador'}
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
      activeTab={activeTab} setActiveTab={setActiveTab} 
      onDownloadReports={() => setShowReportsModal(true)} 
      evaluatorName={currentUser.username} onChangeEvaluator={handleLogout}
      isSyncing={isSyncing}
    >
      {renderContent()}
      {showReportsModal && <MonthlyReportModal evaluations={filteredEvaluationsForReport} employees={employees} onClose={() => setShowReportsModal(false)} currentUserRole={currentUser?.role} />}
    </Layout>
  );
};

export default App;
