
import React, { useState, useMemo, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import EmployeeDetails from './components/EmployeeDetails';
import EvaluationForm from './components/EvaluationForm';
import AddEmployeeForm from './components/AddEmployeeForm';
import MonthlyReportModal from './components/MonthlyReportModal';
import DatabaseConsole from './components/DatabaseConsole';
import LoginPage from './components/LoginPage';
import { VulcanDB } from './services/storageService';
import { t, Language } from './services/translations';
import { 
  Employee, FullEvaluation, Department, 
  SALARY_APPROVERS, BonusStatus, 
  User, UserRole 
} from './types';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  useEffect(() => {
    const initApp = async () => {
      setIsSyncing(true);
      await VulcanDB.initialize();
      const loadedEmps = VulcanDB.getEmployees();
      setEmployees(loadedEmps);
      setEvaluationsHistory(VulcanDB.getEvaluations());
      setIsInitialized(true);
      setIsSyncing(false);
    };
    initApp();

    const cleanup = VulcanDB.onSync((payload) => {
      setIsSyncing(true);
      if (payload.type === 'SYNC_EMPLOYEES') setEmployees(payload.data);
      if (payload.type === 'SYNC_EVALUATIONS') setEvaluationsHistory(payload.data);
      if (payload.type === 'SYNC_USERS') {
        if (currentUser) {
          const updated = (payload.data as User[]).find(u => u.username === currentUser.username);
          if (updated) setCurrentUser(updated);
        }
      }
      setTimeout(() => setIsSyncing(false), 800);
    });
    return () => { if (cleanup) cleanup(); };
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('vulcan_lang', lang);
  }, [lang]);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const isDirector = currentUser?.role === UserRole.Director;
  
  const isAuthorizedManager = useMemo(() => 
    currentUser && SALARY_APPROVERS.some(name => currentUser.username.toLowerCase().trim() === name.toLowerCase().trim()), 
    [currentUser]
  );
  
  const canUserManagePersonnel = isAuthenticated; 

  const canUserEvaluatePerformance = useMemo(() => {
    if (!currentUser) return false;
    return !isAuthorizedManager; 
  }, [currentUser, isAuthorizedManager]);

  const filteredEmployees = useMemo(() => {
    if (!currentUser) return [];
    if (isDirector) return employees;
    const userLower = currentUser.username.toLowerCase().trim();
    return employees.filter(emp => emp.managerName?.toLowerCase().trim() === userLower);
  }, [employees, currentUser, isDirector]);

  const mySubordinates = useMemo(() => {
    if (!currentUser) return [];
    const userLower = currentUser.username.toLowerCase().trim();
    return employees.filter(emp => emp.managerName?.toLowerCase().trim() === userLower);
  }, [employees, currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  const normalizeID = (id: string) => id.replace(/[^a-zA-Z0-9]/g, '').trim();

  const handleSaveEvaluation = async (evaluation: FullEvaluation) => {
    try {
        const finalEvaluation = { ...evaluation, id: evaluation.id || Math.random().toString(36).substr(2, 9) };
        const updatedHistory = [...evaluationsHistory.filter(ev => ev.id !== finalEvaluation.id), finalEvaluation];
        
        setEvaluationsHistory(updatedHistory);
        await VulcanDB.saveEvaluations(updatedHistory);
        
        const newScore = Math.round(finalEvaluation.promedioFinal * 20);
        const updatedEmployees = employees.map(emp => 
          emp.id === finalEvaluation.employeeId 
            ? { 
                ...emp, 
                lastEvaluation: `${finalEvaluation.mes} ${finalEvaluation.año}`.toLowerCase(),
                kpis: emp.kpis.map(k => ({ ...k, score: newScore }))
              } 
            : emp
        );
        
        setEmployees(updatedEmployees);
        await VulcanDB.saveEmployees(updatedEmployees);
    } catch (e) {
        alert("Error al guardar evaluación: " + (e as Error).message);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    setIsSyncing(true);
    try {
      const updated = await VulcanDB.deleteEmployee(id);
      setEmployees(updated);
    } catch (e) {
      alert("Error al eliminar: " + (e as Error).message);
    }
    setIsSyncing(false);
  };

  const handleClearAllEmployees = async () => {
    setIsSyncing(true);
    try {
      setEmployees([]);
      await VulcanDB.saveEmployees([]);
    } catch (e) {
      alert("Error al limpiar nómina: " + (e as Error).message);
    }
    setIsSyncing(false);
  };

  const handleBulkAdd = async (data: string, type: 'ato' | 'vulcan') => {
    setIsSyncing(true);
    try {
        const rows = data.split('\n').filter(r => r.trim());
        const newEmps: Employee[] = [];
        let skippedCount = 0;

        rows.forEach(row => {
          const parts = row.split(/[\t,;]/).map(p => p.trim());
          if (parts.length < 2) return;

          const rawId = parts[0] || 'N/A';
          const normId = normalizeID(rawId);
          
          if (newEmps.some(e => normalizeID(e.idNumber) === normId)) {
            skippedCount++;
          } else {
            newEmps.push({
              id: Math.random().toString(36).substr(2, 9),
              idNumber: rawId,
              name: parts[1] || 'N/A',
              role: parts[2] || 'Personal',
              department: type.toUpperCase(),
              photo: `https://picsum.photos/seed/${normId || Math.random()}/200/200`,
              managerName: parts[4] || currentUser?.username || 'Administrador',
              managerRole: 'Supervisor de Area',
              lastEvaluation: 'Pendiente',
              summary: '',
              kpis: [
                { id: 'k1', name: 'Productividad', score: 0, weight: 40 },
                { id: 'k2', name: 'Calidad Operativa', score: 0, weight: 30 },
                { id: 'k3', name: 'Seguridad SIHOA', score: 0, weight: 30 }
              ]
            });
          }
        });

        if (newEmps.length === 0) {
          alert(lang === 'es' ? "No se detectaron datos válidos para la carga." : "No valid data detected for loading.");
          setIsSyncing(false);
          return;
        }

        // REEMPLAZAR (BLANQUEAR) la nómina actual con los nuevos registros
        setEmployees(newEmps);
        await VulcanDB.saveEmployees(newEmps);
        
        alert(lang === 'es' 
          ? `¡Blanqueo y Carga completada! Agregados: ${newEmps.length}. Se eliminó la nómina anterior.` 
          : `Wipe and Load completed! Added: ${newEmps.length}. Previous payroll was cleared.`);
    } catch (e) {
        alert("Error en la carga masiva: " + (e as Error).message);
    }
    setIsSyncing(false);
  };

  const renderContent = () => {
    if (isAddingEmployee) return <AddEmployeeForm lang={lang} onAdd={async (data) => {
      const normNew = normalizeID(data.idNumber);
      const exists = employees.some(e => normalizeID(e.idNumber) === normNew);
      if (exists) {
        alert(lang === 'es' 
          ? `Error: El empleado con cédula ${data.idNumber} ya se encuentra registrado.` 
          : `Error: Employee with ID ${data.idNumber} is already registered.`);
        return;
      }

      try {
          const newEmployees = [{ ...data, id: Math.random().toString(36).substr(2, 9), kpis: [
            { id: 'k1', name: 'Productividad', score: 0, weight: 40 },
            { id: 'k2', name: 'Calidad Operativa', score: 0, weight: 30 },
            { id: 'k3', name: 'Seguridad SIHOA', score: 0, weight: 30 }
          ], lastEvaluation: 'Pendiente', summary: '' }, ...employees];
          setEmployees(newEmployees);
          await VulcanDB.saveEmployees(newEmployees);
          setIsAddingEmployee(false);
      } catch (e) {
          alert("Error al registrar empleado: " + (e as Error).message);
      }
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
        onEvaluate={canUserEvaluatePerformance ? (emp) => { setSelectedEmployee(null); setEvaluatingEmployee(emp); } : undefined}
        onEditEvaluation={canUserEvaluatePerformance ? (evaluation) => { setSelectedEmployee(null); setEditingEvaluation(evaluation); } : undefined}
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
          onAddNew={canUserManagePersonnel ? () => setIsAddingEmployee(true) : () => {}} 
          onDelete={canUserManagePersonnel ? handleDeleteEmployee : () => {}}
          onClearAll={canUserManagePersonnel ? handleClearAllEmployees : () => {}}
          onBulkAdd={canUserManagePersonnel ? handleBulkAdd : undefined} 
          isReadOnly={!canUserManagePersonnel} 
          lang={lang}
        />
      );
      case 'database': return <DatabaseConsole lang={lang} />;
      case 'evaluations':
        return (
          <div className="space-y-12">
            {isAuthorizedManager ? (
              <div className="bg-[#001a33] p-12 rounded-[40px] text-white shadow-2xl border-b-8 border-[#FFCC00] text-center max-w-4xl mx-auto animate-in fade-in duration-500">
                <div className="text-6xl mb-6">🛡️</div>
                <h3 className="text-3xl font-black uppercase tracking-tighter">Panel de Aprobación de Gerencia</h3>
                <p className="text-[#FFCC00] text-sm font-black uppercase tracking-[0.2em] mt-6 max-w-lg mx-auto leading-relaxed">
                  Bienvenido, {currentUser?.username}. Aquí puede revisar los resultados técnicos cargados por supervisores y asignar los incrementos salariales correspondientes.
                </p>
                <div className="mt-12 flex justify-center gap-4">
                  <button 
                    onClick={() => setShowReportsModal(true)}
                    className="bg-[#FFCC00] text-[#003366] px-12 py-5 rounded-3xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl text-xs"
                  >
                    Abrir Reporte de Nómina y Aprobaciones
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-[32px] border-l-8 border-[#003366] shadow-sm">
                <h3 className="text-lg font-black uppercase text-slate-800">{lang === 'es' ? 'Mis Subordinados' : 'My Direct Reports'}</h3>
                {mySubordinates.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[32px] mt-8">
                    <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">No tiene personal asignado para evaluación técnica</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {mySubordinates.map(emp => (
                        <div key={emp.id} className="bg-slate-50 p-6 rounded-[32px] border-2 border-slate-100 hover:border-[#003366] transition-all group shadow-sm">
                          <div className="flex items-center gap-4 mb-6">
                              <img src={emp.photo} className="w-14 h-14 rounded-2xl grayscale group-hover:grayscale-0 transition-all shadow-md" />
                              <div>
                                <p className="font-black text-xs uppercase text-[#003366] leading-none mb-1.5">{emp.name}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{emp.role}</p>
                              </div>
                          </div>
                          <button onClick={() => setEvaluatingEmployee(emp)} className="w-full py-4 bg-[#003366] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#002244] hover:shadow-lg active:scale-95 transition-all">
                              {t('evaluar_ahora', lang) || "Realizar Evaluación Técnica"}
                          </button>
                        </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      default: return <Dashboard employees={filteredEmployees} lang={lang} />;
    }
  };

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen bg-[#001a33] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white tracking-tighter animate-pulse">VULCAN<span className="text-[#FFCC00]">HR</span></h1>
          <p className="text-[#FFCC00] text-[10px] font-black uppercase tracking-[0.3em] mt-4">Sincronizando con la nube...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !isAuthenticated) {
    return <LoginPage onLogin={handleLoginSuccess} lang={lang} />;
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
      {showReportsModal && <MonthlyReportModal evaluations={evaluationsHistory} employees={employees} onClose={() => setShowReportsModal(false)} currentUserRole={currentUser?.role} currentUserUsername={currentUser?.username} lang={lang} />}
    </Layout>
  );
};

export default App;
