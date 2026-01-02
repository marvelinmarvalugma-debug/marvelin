
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
import { t, Language } from './services/translations';
import { 
  Employee, FullEvaluation, Department, 
  BONUS_APPROVER, BonusStatus, 
  User, UserRole 
} from './types';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [lang, setLang] = useState<Language>((localStorage.getItem('vulcan_lang') as Language) || 'es');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [evaluationsHistory, setEvaluationsHistory] = useState<FullEvaluation[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [evaluatingEmployee, setEvaluatingEmployee] = useState<Employee | null>(null);
  const [editingEvaluation, setEditingEvaluation] = useState<FullEvaluation | null>(null);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [pendingIncrements, setPendingIncrements] = useState<Record<string, string>>({});

  useEffect(() => {
    localStorage.setItem('vulcan_lang', lang);
  }, [lang]);

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
      VulcanDB.saveEmployees(employees);
    }
  }, [employees, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      VulcanDB.saveEvaluations(evaluationsHistory);
    }
  }, [evaluationsHistory, isInitialized]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!currentUser.password) {
      if (passwordInput.length < 4) { alert(lang === 'es' ? "Mínimo 4 caracteres" : "Minimum 4 characters"); return; }
      const updatedUser = { ...currentUser, password: passwordInput };
      VulcanDB.updateUser(updatedUser);
      setCurrentUser(updatedUser);
      setIsAuthenticated(true);
    } else {
      if (passwordInput === currentUser.password) {
        setIsAuthenticated(true);
      } else { alert(lang === 'es' ? "Contraseña incorrecta" : "Incorrect password"); }
    }
  };

  const isDirector = currentUser?.role === UserRole.Director;
  const isJacquelin = currentUser?.username === BONUS_APPROVER;
  
  const canUserEvaluatePerformance = useMemo(() => {
    if (!currentUser) return false;
    return !isJacquelin;
  }, [currentUser, isJacquelin]);

  const canManagePersonnel = useMemo(() => {
    return !!currentUser;
  }, [currentUser]);

  const filteredEmployees = useMemo(() => {
    if (!currentUser) return [];
    if (isDirector) return employees;
    return employees.filter(emp => emp.managerName.toLowerCase().trim() === currentUser.username.toLowerCase().trim());
  }, [employees, currentUser, isDirector]);

  const mySubordinates = useMemo(() => {
    if (!currentUser) return [];
    return employees.filter(emp => emp.managerName.toLowerCase().trim() === currentUser.username.toLowerCase().trim());
  }, [employees, currentUser]);

  const filteredEvaluationsForReport = useMemo<FullEvaluation[]>(() => {
    if (isDirector) return evaluationsHistory;
    return evaluationsHistory.filter((ev: FullEvaluation) => ev.evaluador.toLowerCase().trim() === currentUser?.username.toLowerCase().trim());
  }, [evaluationsHistory, currentUser, isDirector]);

  const handleBulkAdd = (data: string, type: 'ato' | 'vulcan') => {
    const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');
    const newEmps: Employee[] = [];
    
    lines.forEach((line, index) => {
      const upperLine = line.toUpperCase();
      if (index === 0 && (upperLine.includes('CEDULA') || upperLine.includes('NOMBRE') || upperLine.includes('CARGO'))) return;

      let parts = line.split('\t');
      if (parts.length < 2) parts = line.split(';');
      if (parts.length < 2) parts = line.split(',');

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
      }
    });

    if (newEmps.length > 0) {
      setEmployees(prev => {
        const existingIds = new Set(prev.map(e => e.idNumber));
        const nonDuplicates = newEmps.filter(e => !existingIds.has(e.idNumber));
        return [...nonDuplicates, ...prev];
      });
      alert(lang === 'es' ? `Éxito: Se han cargado ${newEmps.length} colaboradores.` : `Success: ${newEmps.length} employees loaded.`);
    } else {
      alert(lang === 'es' ? "No se detectaron datos válidos." : "No valid data detected.");
    }
  };

  const handleSaveEvaluation = (evaluation: FullEvaluation) => {
    const finalEvaluation = { 
      ...evaluation, 
      id: evaluation.id || Math.random().toString(36).substr(2, 9) 
    };

    setEvaluationsHistory(prev => {
      const filtered = prev.filter(ev => ev.id !== finalEvaluation.id);
      const filteredByKeys = filtered.filter(ev => 
        !(ev.employeeId === finalEvaluation.employeeId && 
          ev.mes.toLowerCase() === finalEvaluation.mes.toLowerCase() && 
          ev.año === finalEvaluation.año)
      );
      return [...filteredByKeys, finalEvaluation];
    });

    setEmployees(prev => prev.map(emp => 
      emp.id === finalEvaluation.employeeId 
        ? { ...emp, lastEvaluation: `${finalEvaluation.mes} ${finalEvaluation.año}` } 
        : emp
    ));
  };

  const handleApproveBonus = (employeeId: string, mes: string, anio: string, status: BonusStatus, increment?: string) => {
    setEvaluationsHistory(prev => prev.map(ev => 
      (ev.employeeId === employeeId && ev.mes === mes && ev.año === anio) 
        ? { ...ev, condicionBono: status, incrementoSalarial: increment || ev.incrementoSalarial, authorizedBy: currentUser?.username } 
        : ev
    ));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setPasswordInput('');
    setEvaluatingEmployee(null);
    setEditingEvaluation(null);
    setSelectedEmployee(null);
    setIsAddingEmployee(false);
    setActiveTab('dashboard');
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

  const renderContent = () => {
    if (isAddingEmployee) return <AddEmployeeForm onAdd={(data) => {
      const newEmp: Employee = { ...data, id: Math.random().toString(36).substr(2, 9), kpis: [{ id: 'k1', name: 'Productividad', score: 0, weight: 40 }, { id: 'k2', name: 'Calidad', score: 0, weight: 30 }, { id: 'k3', name: 'Seguridad', score: 0, weight: 30 }], lastEvaluation: 'Pendiente', summary: '' };
      setEmployees(prev => [newEmp, ...prev]);
      setIsAddingEmployee(false);
    }} onCancel={() => setIsAddingEmployee(false)} />;

    if ((evaluatingEmployee || editingEvaluation) && canUserEvaluatePerformance) return (
      <EvaluationForm 
        employee={evaluatingEmployee || employees.find(e => e.id === editingEvaluation?.employeeId)!} 
        evaluatorName={currentUser?.username || ''} 
        initialData={editingEvaluation || undefined}
        onClose={() => { setEvaluatingEmployee(null); setEditingEvaluation(null); setSelectedEmployee(null); }} 
        onSave={handleSaveEvaluation} 
        lang={lang}
      />
    );
    
    if (selectedEmployee) return (
      <EmployeeDetails 
        employee={selectedEmployee} 
        evaluations={evaluationsHistory} 
        onBack={() => setSelectedEmployee(null)} 
        onEvaluate={canUserEvaluatePerformance ? (emp) => {
          setSelectedEmployee(null);
          setEvaluatingEmployee(emp);
        } : undefined}
        onEditEvaluation={canUserEvaluatePerformance ? (evaluation) => {
          setSelectedEmployee(null);
          setEditingEvaluation(evaluation);
        } : undefined}
        currentUserRole={currentUser?.role} 
        lang={lang}
      />
    );

    switch (activeTab) {
      case 'dashboard': return <Dashboard employees={filteredEmployees} lang={lang} />;
      case 'employees': return (
        <EmployeeList 
          employees={filteredEmployees} 
          onSelect={setSelectedEmployee} 
          onAddNew={canManagePersonnel ? () => setIsAddingEmployee(true) : () => {}} 
          onBulkAdd={canManagePersonnel ? handleBulkAdd : undefined} 
          isReadOnly={!canManagePersonnel} 
          lang={lang}
        />
      );
      case 'database': return <DatabaseConsole />;
      case 'evaluations':
        const renderEvaluatorList = (emps: Employee[]) => {
          const groups = { ATO: emps.filter(e => e.department === Department.ATO), VULCAN: emps.filter(e => e.department === Department.VULCAN) };
          return (
            <div className="space-y-8">
              {Object.entries(groups).map(([name, list]) => list.length > 0 && (
                <div key={name} className="space-y-4">
                  <h4 className="bg-white px-6 py-3 rounded-2xl border-l-4 border-[#003366] text-xs font-black uppercase text-slate-500">
                    {lang === 'es' ? `Subordinados ${name}` : `${name} Subordinates`}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {list.map(emp => {
                      const evaluated = hasBeenEvaluatedThisMonth(emp.id);
                      return (
                        <div key={emp.id} className={`bg-white p-6 rounded-3xl border-2 transition-all ${evaluated ? 'opacity-60 border-emerald-100 shadow-sm' : 'border-slate-50 hover:border-[#003366]'}`}>
                          <div className="flex justify-between items-start mb-4">
                            <img src={emp.photo} className="w-12 h-12 rounded-xl grayscale border border-slate-50 shadow-sm" />
                            <span className={`text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${evaluated ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                              {evaluated ? (lang === 'es' ? 'Evaluado ✓' : 'Evaluated ✓') : (lang === 'es' ? 'Pendiente' : 'Pending')}
                            </span>
                          </div>
                          <h5 className="font-black text-slate-800 uppercase text-[10px] truncate leading-none mb-1">{emp.name}</h5>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter truncate">{emp.role}</p>
                          <button 
                            disabled={evaluated || !canUserEvaluatePerformance} 
                            onClick={() => setEvaluatingEmployee(emp)} 
                            className={`w-full mt-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest ${evaluated || !canUserEvaluatePerformance ? 'bg-slate-50 text-slate-300' : 'bg-[#003366] text-white hover:scale-105 active:scale-95 transition-transform'}`}
                          >
                            {isJacquelin ? t('read_only', lang) : evaluated ? (lang === 'es' ? 'Periodo Completo' : 'Period Complete') : (lang === 'es' ? 'Evaluar Ahora' : 'Evaluate Now')}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        };

        return (
          <div className="space-y-12">
            {isDirector && (
              <div className="space-y-6">
                <div className="bg-[#001a33] p-8 rounded-[32px] text-white shadow-xl border-b-4 border-[#FFCC00]">
                  <h3 className="text-xl font-black uppercase tracking-tighter">{t('approval_title', lang)}</h3>
                  <p className="text-[#FFCC00] text-xs font-bold mt-1 uppercase tracking-widest">{t('approval_desc', lang)}</p>
                </div>
                {evaluationsHistory.filter(ev => ev.condicionBono === BonusStatus.PendingAuth).length === 0 ? (
                  <div className="p-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100 text-slate-300 font-black uppercase text-[10px] tracking-widest">{t('pending_signs', lang)}</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {evaluationsHistory.filter(ev => ev.condicionBono === BonusStatus.PendingAuth).map(ev => {
                      const emp = employees.find(e => e.id === ev.employeeId);
                      const incrementKey = `${ev.employeeId}-${ev.mes}-${ev.año}`;
                      const currentIncrement = pendingIncrements[incrementKey] ?? ev.incrementoSalarial ?? "0%";

                      return (
                        <div key={incrementKey} className="bg-white p-6 rounded-[32px] border-2 border-slate-50 space-y-4 hover:border-indigo-100 shadow-sm transition-all">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <img src={emp?.photo} className="w-12 h-12 rounded-xl grayscale border border-slate-50 shadow-sm" />
                              <div>
                                <p className="font-black text-[#003366] uppercase text-[11px] leading-none mb-1">{emp?.name}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{ev.mes} {ev.año}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black text-indigo-600">{(ev.promedioFinal * 20).toFixed(1)}%</p>
                            </div>
                          </div>
                          
                          {emp?.department === Department.VULCAN && (
                            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                               <label className="text-[8px] font-black text-emerald-800 uppercase tracking-widest mb-1 block">{t('adjust_increment', lang)}</label>
                               <input 
                                 type="text" 
                                 value={currentIncrement} 
                                 onChange={(e) => setPendingIncrements(prev => ({...prev, [incrementKey]: e.target.value}))}
                                 className="w-full bg-white border border-emerald-200 px-3 py-2 rounded-xl text-xs font-black text-emerald-700 outline-none focus:border-emerald-500"
                                 placeholder="Ej: 15%"
                               />
                            </div>
                          )}

                          <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => handleApproveBonus(ev.employeeId, ev.mes, ev.año, BonusStatus.Approved, currentIncrement)} className="bg-emerald-600 text-white py-3 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-500/10">{t('sign', lang)} ✓</button>
                            <button onClick={() => handleApproveBonus(ev.employeeId, ev.mes, ev.año, BonusStatus.Conditioned, currentIncrement)} className="bg-amber-500 text-white py-3 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-500/10">{t('conditioned', lang)}</button>
                            <button onClick={() => handleApproveBonus(ev.employeeId, ev.mes, ev.año, BonusStatus.NotApproved, currentIncrement)} className="bg-rose-600 text-white py-3 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-500/10">{t('deny', lang)}</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[32px] border-l-8 border-[#003366] shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black uppercase text-slate-800 tracking-tighter">
                    {lang === 'es' ? 'Personal Bajo Gestión' : 'Staff Under Management'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {isJacquelin ? (lang === 'es' ? 'Listado general para supervisión de bonos.' : 'General list for bonus oversight.') : (lang === 'es' ? `Usted gestiona directamente a ${mySubordinates.length} colaboradores.` : `You directly manage ${mySubordinates.length} employees.`)}
                  </p>
                </div>
              </div>
              {mySubordinates.length > 0 ? renderEvaluatorList(mySubordinates) : (
                <div className="text-center py-20 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
                  <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">
                    {lang === 'es' ? "Use la pestaña 'Personal' para consultar cualquier miembro de la nómina" : "Use the 'Personnel' tab to check any payroll member"}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      default: return <Dashboard employees={filteredEmployees} lang={lang} />;
    }
  };

  if (!currentUser || !isAuthenticated) {
    const usersTable = VulcanDB.getUsers();
    return (
      <div className="min-h-screen bg-[#001a33] flex items-center justify-center p-6">
        <div className="bg-white rounded-[40px] shadow-2xl max-w-md w-full p-10 text-center animate-in zoom-in">
          <h1 className="text-3xl font-black text-[#003366] mb-6">VULCAN<span className="text-[#FFCC00]">HR</span></h1>
          {!currentUser ? (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {usersTable.map(user => (
                <button
                  key={user.username}
                  onClick={() => setCurrentUser(user)}
                  className={`w-full p-4 border-2 rounded-[24px] text-xs font-bold flex justify-between items-center transition-all ${
                    user.role === UserRole.Director ? 'bg-[#003366] text-[#FFCC00] border-[#003366]' : 'bg-slate-50 border-slate-100 text-[#003366]'
                  }`}
                >
                  <span>{user.username}</span>
                  <span className="text-[8px] opacity-60 font-black uppercase">{user.role}</span>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-6">
              <p className="text-[10px] font-black text-slate-400 uppercase">Usuario: {currentUser.username}</p>
              <input
                autoFocus
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-center text-lg font-black tracking-widest outline-none focus:border-[#003366]"
              />
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => setCurrentUser(null)} className="py-4 text-slate-400 font-black uppercase text-[10px]">{lang === 'es' ? 'Atrás' : 'Back'}</button>
                <button type="submit" className="py-4 bg-[#003366] text-white rounded-2xl font-black uppercase text-[10px]">{lang === 'es' ? 'Entrar' : 'Enter'}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      onDownloadReports={() => setShowReportsModal(true)} 
      evaluatorName={currentUser.username} 
      onChangeEvaluator={handleLogout} 
      isSyncing={isSyncing}
      lang={lang}
      onLangToggle={() => setLang(prev => prev === 'es' ? 'en' : 'es')}
    >
      {renderContent()}
      {showReportsModal && <MonthlyReportModal evaluations={filteredEvaluationsForReport} employees={employees} onClose={() => setShowReportsModal(false)} currentUserRole={currentUser?.role} lang={lang} />}
    </Layout>
  );
};

export default App;
