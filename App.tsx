
// @google/genai guidelines followed for integration where applicable.
import { GoogleGenAI } from "@google/genai";
import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  User, UserRole 
} from './types';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lang, setLang] = useState<Language>((localStorage.getItem('vulcan_lang') as Language) || 'es');
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [evaluations, setEvaluations] = useState<FullEvaluation[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<FullEvaluation | undefined>(undefined);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    const init = async () => {
      setIsSyncing(true);
      try {
        await VulcanDB.initialize();
      } catch (err) {
        console.error("App: Fallo en inicialización de DB", err);
      } finally {
        const emps = VulcanDB.getEmployees();
        const evals = VulcanDB.getEvaluations();
        setEmployees(emps);
        setEvaluations(evals);
        setIsInitialized(true);
        setIsSyncing(false);
      }
    };
    init();

    const unsubscribe = VulcanDB.onSync((payload) => {
      if (payload.type === 'SYNC_EMPLOYEES') {
        setEmployees([...payload.data]);
      }
      if (payload.type === 'SYNC_EVALUATIONS') {
        setEvaluations([...payload.data]);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const filteredEmployees = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.Gerente || currentUser.role === UserRole.RRHH) return employees;
    return employees.filter(emp => emp.managerName?.toLowerCase().trim() === currentUser.username.toLowerCase().trim());
  }, [employees, currentUser]);

  const filteredEvaluations = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.Gerente || currentUser.role === UserRole.RRHH) return evaluations;
    const allowedIds = new Set(filteredEmployees.map(e => e.id));
    return evaluations.filter(ev => allowedIds.has(ev.employeeId));
  }, [evaluations, filteredEmployees, currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  const toggleLang = () => {
    const newLang = lang === 'es' ? 'en' : 'es';
    setLang(newLang);
    localStorage.setItem('vulcan_lang', newLang);
  };

  const handleSaveEvaluation = async (evaluation: FullEvaluation) => {
    try {
      const evalId = evaluation.id || Math.random().toString(36).substr(2, 9);
      const evaluationWithId = { ...evaluation, id: evalId };
      const newEvaluations = editingEvaluation 
        ? evaluations.map(ev => ev.id === evaluation.id ? evaluationWithId : ev)
        : [...evaluations, evaluationWithId];
      
      setEvaluations(newEvaluations);
      await VulcanDB.saveEvaluations(newEvaluations);
      
      const updatedEmployees = employees.map(emp => {
        if (emp.id === evaluation.employeeId) {
          return { ...emp, lastEvaluation: `${evaluation.mes} ${evaluation.año}`.toLowerCase() };
        }
        return emp;
      });
      setEmployees(updatedEmployees);
      await VulcanDB.saveEmployees(updatedEmployees);
      
      setIsEvaluating(false);
      setEditingEvaluation(undefined);
      setSelectedEmployee(null);
    } catch (error) {
      console.error("Critical error saving evaluation:", error);
      setIsEvaluating(false);
    }
  };

  const handleAddEmployee = async (empData: any) => {
    // Verificación de duplicado por cédula (idNumber)
    const cleanId = empData.idNumber.replace(/[\.\s,]/g, '').toLowerCase();
    const existingIndex = employees.findIndex(e => e.idNumber.replace(/[\.\s,]/g, '').toLowerCase() === cleanId);

    if (existingIndex !== -1) {
      const msg = lang === 'es' 
        ? `La cédula ${empData.idNumber} ya está registrada a nombre de ${employees[existingIndex].name}. ¿Desea actualizar su información?` 
        : `ID Number ${empData.idNumber} is already registered to ${employees[existingIndex].name}. Update information?`;
      
      if (window.confirm(msg)) {
        const updatedList = [...employees];
        updatedList[existingIndex] = { 
          ...updatedList[existingIndex], 
          ...empData,
          id: updatedList[existingIndex].id // Mantener el ID interno original
        };
        setEmployees(updatedList);
        await VulcanDB.saveEmployees(updatedList);
      }
      setIsAddingEmployee(false);
      return;
    }

    const newEmp: Employee = {
      ...empData,
      id: Math.random().toString(36).substr(2, 9),
      lastEvaluation: 'Pendiente',
      summary: '',
      kpis: [
        { id: 'k1', name: 'Productividad', score: 0, weight: 40 },
        { id: 'k2', name: 'Calidad Operativa', score: 0, weight: 30 },
        { id: 'k3', name: 'Seguridad SIHOA', score: 0, weight: 30 }
      ]
    };
    
    setEmployees(prev => {
      const updated = [...prev, newEmp];
      VulcanDB.saveEmployees(updated);
      return updated;
    });
    setIsAddingEmployee(false);
  };

  const handleDeleteEmployee = useCallback(async (id: string) => {
    if (!id || !window.confirm(t('confirm_delete', lang))) return;
    try {
      const updatedList = await VulcanDB.deleteEmployee(id);
      setEmployees([...updatedList]);
      setEvaluations(prev => prev.filter(ev => ev.employeeId !== id));
      setSelectedEmployee(prev => (prev?.id === id ? null : prev));
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  }, [lang]);

  const handleClearAll = async () => {
    if (window.confirm(t('confirm_clear_all', lang))) {
      await VulcanDB.saveEmployees([]);
      await VulcanDB.saveEvaluations([]);
      setEmployees([]);
      setEvaluations([]);
    }
  };

  const handleBulkAdd = async (data: string, type: 'ato' | 'vulcan') => {
    const lines = data.split('\n').filter(l => l.trim().length > 0);
    if (lines.length === 0) return;

    const processedEmps: Employee[] = [];
    let addedCount = 0;
    let updatedCount = 0;

    lines.forEach(line => {
      let parts = line.split('\t');
      if (parts.length < 2) parts = line.split(';');
      if (parts.length < 2) parts = line.split(',');
      if (parts.length < 2) parts = line.split(/\s{2,}/);

      const cleaned = parts.map(p => p.trim());

      if (cleaned.length < 2 || !cleaned[0] || !cleaned[1]) return;

      const isHeader = ['cedula', 'cédula', 'id', 'nro', 'nombre'].some(k => cleaned[0].toLowerCase().includes(k) || cleaned[1].toLowerCase().includes(k));
      if (isHeader) return;

      const managerName = (currentUser?.role === UserRole.Supervisor || !cleaned[4]) 
        ? (currentUser?.username || 'Xuezhi Jin') 
        : cleaned[4];

      processedEmps.push({
        id: Math.random().toString(36).substr(2, 9),
        idNumber: cleaned[0],
        name: cleaned[1],
        role: cleaned[2] || 'TRABAJADOR',
        department: type === 'ato' ? Department.ATO : Department.VULCAN,
        photo: `https://picsum.photos/seed/${cleaned[0].replace(/\D/g, '') || 'default'}/200/200`,
        managerName: managerName,
        managerRole: currentUser?.role === UserRole.Supervisor ? 'Supervisor' : 'Gerente',
        lastEvaluation: 'Pendiente',
        summary: '',
        kpis: [
          { id: 'k1', name: 'Productividad', score: 0, weight: 40 },
          { id: 'k2', name: 'Calidad Operativa', score: 0, weight: 30 },
          { id: 'k3', name: 'Seguridad SIHOA', score: 0, weight: 30 }
        ]
      });
    });

    if (processedEmps.length === 0) {
      alert(lang === 'es' ? "No se pudieron procesar los datos." : "Could not process data.");
      return;
    }

    setEmployees(prev => {
      const newList = [...prev];
      processedEmps.forEach(newEmp => {
        const cleanId = newEmp.idNumber.replace(/[\.\s,]/g, '').toLowerCase();
        const idx = newList.findIndex(e => e.idNumber.replace(/[\.\s,]/g, '').toLowerCase() === cleanId);
        
        if (idx !== -1) {
          // Si ya existe por cédula, actualizamos conservando el ID interno original
          newList[idx] = { 
            ...newList[idx], 
            ...newEmp, 
            id: newList[idx].id // CRÍTICO: Preservar el ID original para no romper el historial
          };
          updatedCount++;
        } else {
          newList.push(newEmp);
          addedCount++;
        }
      });

      VulcanDB.saveEmployees(newList);
      alert(lang === 'es' ? `Carga exitosa: ${addedCount} nuevos, ${updatedCount} actualizados.` : `Load success: ${addedCount} new, ${updatedCount} updated.`);
      return newList;
    });
  };

  const startEvaluation = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsEvaluating(true);
    setIsPrinting(false);
  };

  const handlePrintEvaluation = (ev: FullEvaluation) => {
    const emp = employees.find(e => e.id === ev.employeeId);
    if (emp) {
      setSelectedEmployee(emp);
      setEditingEvaluation(ev);
      setIsEvaluating(true);
      setIsPrinting(true);
    }
  };

  const isGerente = currentUser?.role === UserRole.Gerente;
  const isRRHH = currentUser?.role === UserRole.RRHH;

  if (!isInitialized) return <div className="h-screen flex items-center justify-center bg-[#001a33] text-white font-black uppercase tracking-widest animate-pulse">CARGANDO VULCAN HR...</div>;
  if (!isAuthenticated) return <LoginPage onLogin={handleLogin} lang={lang} />;

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      onDownloadReports={() => setIsReportOpen(true)}
      evaluatorName={currentUser?.username}
      onChangeEvaluator={handleLogout}
      isSyncing={isSyncing}
      lang={lang}
      onLangToggle={toggleLang}
    >
      {activeTab === 'dashboard' && <Dashboard employees={filteredEmployees} lang={lang} />}
      
      {activeTab === 'employees' && (
        selectedEmployee && !isEvaluating ? (
          <EmployeeDetails 
            employee={selectedEmployee} 
            evaluations={filteredEvaluations}
            onBack={() => setSelectedEmployee(null)}
            onEvaluate={isRRHH ? undefined : startEvaluation}
            onEditEvaluation={isRRHH ? undefined : (ev) => { setEditingEvaluation(ev); setIsEvaluating(true); setIsPrinting(false); }}
            onPrintEvaluation={handlePrintEvaluation}
            onDelete={handleDeleteEmployee}
            currentUserRole={currentUser?.role}
            lang={lang}
          />
        ) : (
          <EmployeeList 
            employees={filteredEmployees} 
            onSelect={setSelectedEmployee}
            onAddNew={() => setIsAddingEmployee(true)}
            onDelete={handleDeleteEmployee}
            onClearAll={handleClearAll}
            onBulkAdd={handleBulkAdd}
            onEvaluate={isRRHH ? undefined : startEvaluation}
            currentUserRole={currentUser?.role}
            lang={lang}
          />
        )
      )}

      {activeTab === 'evaluations' && (
        (isGerente || isRRHH) ? (
          <div className="text-center py-20 bg-white rounded-[40px] shadow-sm border border-slate-100 animate-in slide-in-from-bottom-4">
            <div className="mb-6 text-6xl">📊</div>
            <h3 className="text-2xl font-black text-[#003366] uppercase mb-4 tracking-tight">
              {isRRHH ? "Consolidado de Gestión Humana" : t('approval_title', lang)}
            </h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto text-sm font-bold uppercase">
              {isRRHH ? "Viendo todas las evaluaciones y ponderaciones de gerencia." : t('approval_desc', lang)}
            </p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => setIsReportOpen(true)}
                className="bg-[#003366] text-white px-10 py-5 rounded-2xl font-black uppercase text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all tracking-[0.2em]"
              >
                {t('payroll_summary', lang)}
              </button>
              <button 
                onClick={() => setActiveTab('employees')}
                className="bg-white border-2 border-[#003366] text-[#003366] px-10 py-5 rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-105 active:scale-95 transition-all tracking-[0.2em]"
              >
                {t('personnel', lang)}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-[#003366] p-8 rounded-[40px] text-white shadow-2xl">
               <h3 className="text-2xl font-black uppercase tracking-tighter">{t('performance_matrix', lang)}</h3>
               <p className="text-[#FFCC00] text-[10px] font-black uppercase tracking-widest mt-1">Evaluando Personal Bajo su Cargo</p>
            </div>
            <EmployeeList 
              employees={filteredEmployees} 
              onSelect={(emp) => { setSelectedEmployee(emp); setActiveTab('employees'); }}
              onAddNew={() => setIsAddingEmployee(true)}
              onDelete={handleDeleteEmployee}
              onClearAll={handleClearAll}
              onEvaluate={isRRHH ? undefined : startEvaluation}
              currentUserRole={currentUser?.role}
              lang={lang}
              isReadOnly
            />
          </div>
        )
      )}

      {activeTab === 'database' && <DatabaseConsole lang={lang} />}

      {isEvaluating && selectedEmployee && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md overflow-y-auto p-4 lg:p-10">
          <EvaluationForm 
            employee={selectedEmployee}
            evaluatorName={currentUser?.username || ''}
            initialData={editingEvaluation}
            isViewOnly={isPrinting}
            onClose={() => { 
              setIsEvaluating(false); 
              setEditingEvaluation(undefined); 
              setSelectedEmployee(null); 
              setIsPrinting(false);
            }}
            onSave={handleSaveEvaluation}
            lang={lang}
          />
        </div>
      )}

      {isAddingEmployee && (
        <div className="fixed inset-0 z-[100] bg-[#001a33]/80 backdrop-blur-md flex items-center justify-center p-4">
          <AddEmployeeForm 
            onAdd={handleAddEmployee} 
            onCancel={() => setIsAddingEmployee(false)} 
            lang={lang} 
            evaluatorName={currentUser?.username || 'Supervisor'} 
          />
        </div>
      )}

      {isReportOpen && (
        <MonthlyReportModal 
          evaluations={filteredEvaluations}
          employees={filteredEmployees}
          onClose={() => setIsReportOpen(false)}
          onUpdateEvaluations={(updatedEvals) => {
            const updatedAll = evaluations.map(ev => {
              const match = updatedEvals.find(u => u.id === ev.id);
              return match || ev;
            });
            setEvaluations(updatedAll);
          }}
          currentUserRole={currentUser?.role}
          currentUserUsername={currentUser?.username}
          lang={lang}
        />
      )}
    </Layout>
  );
};

export default App;
