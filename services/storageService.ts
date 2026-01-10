
import { Employee, FullEvaluation, User, UserRole, AUTHORIZED_EVALUATORS, SALARY_APPROVERS } from '../types';
import { INITIAL_EMPLOYEES } from '../constants';
import { supabase, isAuthError } from './supabaseService';

const DB_KEYS = {
  EMPLOYEES: 'vulcan_db_employees_v1',
  EVALUATIONS: 'vulcan_db_evaluations_v1',
  USERS: 'vulcan_db_users_v1',
};

// Tiempo máximo de espera para la nube antes de pasar a modo local
const CLOUD_TIMEOUT = 5000;

// Sistema de logs para depuración en UI
let lastCloudError: string | null = null;

let syncChannel: BroadcastChannel | null = null;
try {
  syncChannel = new BroadcastChannel('vulcan_sync_channel');
} catch (e) {
  console.warn("BroadcastChannel no soportado en este entorno.");
}

const withTimeout = (promise: PromiseLike<any>, timeoutMs: number) => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_, reject) => setTimeout(() => reject(new Error('CLOUD_TIMEOUT_EXCEEDED')), timeoutMs))
  ]);
};

/**
 * Limpia objetos para Supabase. 
 * Elimina undefineds y asegura que las fechas sean strings válidos si existen.
 */
const cleanForCloud = (data: any) => {
  if (!data) return data;
  // Deep clone and remove undefined values
  const cleaned = JSON.parse(JSON.stringify(data, (key, value) => {
    if (value === undefined) return null;
    return value;
  }));
  return cleaned;
};

export const VulcanDB = {
  initialize: async () => {
    console.log("VulcanDB: Iniciando sistema de datos...");
    try {
      // 1. Intentar sincronizar con la nube (No bloqueante)
      try {
        const hasData = await withTimeout(VulcanDB.pullFromCloud(), CLOUD_TIMEOUT);
        if (hasData) console.log("VulcanDB: Datos sincronizados desde Supabase.");
      } catch (e) {
        console.warn("VulcanDB: Iniciando en modo offline. Causa:", e);
      }

      // 2. Usuarios
      const localUsers = VulcanDB.getUsers();
      if (localUsers.length === 0) {
        const initialUsers: User[] = AUTHORIZED_EVALUATORS.map(name => {
          const isManager = SALARY_APPROVERS.some(mgr => name.toLowerCase().trim() === mgr.toLowerCase().trim());
          const isRRHH = name.toLowerCase().trim() === 'daniela alfonzo';
          return {
            username: name,
            role: isRRHH ? UserRole.RRHH : (isManager ? UserRole.Gerente : UserRole.Supervisor),
            password: '' 
          };
        });
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(initialUsers));
        await VulcanDB.pushToCloud('users', initialUsers);
      }

      // 3. Empleados - Solo inicializar si no existe la entrada en localStorage en absoluto
      const storedEmps = localStorage.getItem(DB_KEYS.EMPLOYEES);
      if (storedEmps === null) {
        localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
        if (INITIAL_EMPLOYEES.length > 0) {
          await VulcanDB.pushToCloud('employees', INITIAL_EMPLOYEES);
        }
      }

    } catch (error) {
      console.error("VulcanDB: Fallo crítico de inicio", error);
    }
  },

  getLastCloudError: () => lastCloudError,

  /**
   * Sincroniza datos hacia Supabase.
   * Maneja dinámicamente la columna de conflicto según la tabla.
   */
  pushToCloud: async (table: string, data: any) => {
    try {
      const cleanData = cleanForCloud(data);
      // La tabla 'users' usa 'username' como identificador único en lugar de 'id'
      const conflictColumn = table === 'users' ? 'username' : 'id';
      
      const { error } = await supabase.from(table).upsert(cleanData, { 
        onConflict: conflictColumn,
        ignoreDuplicates: false 
      });

      if (error) {
        // Serializar el error si es un objeto para evitar el mensaje [object Object]
        const errorMsg = typeof error === 'object' ? JSON.stringify(error) : String(error);
        lastCloudError = `Cloud Sync Error [${table}]: ${errorMsg}`;
        console.error(`Supabase Push Error [${table}]:`, error);
        return false;
      }
      
      lastCloudError = null;
      return true;
    } catch (e: any) {
      lastCloudError = `Excepción Cloud [${table}]: ${e.message || String(e)}`;
      return false;
    }
  },

  checkCloudStatus: async () => {
    const status = { 
      connection: false, 
      employeesRead: false, 
      employeesWrite: false, 
      authValid: true,
      latency: 0,
      error: null as string | null 
    };

    const startTime = Date.now();
    try {
      const { data, error: readError } = await withTimeout(
        supabase.from('employees').select('id').limit(1), 
        CLOUD_TIMEOUT
      );
      
      status.latency = Date.now() - startTime;

      if (readError) {
        if (isAuthError(readError)) status.authValid = false;
        throw readError;
      }

      status.connection = true;
      status.employeesRead = true;

      // Test de escritura real
      const testId = 'diag_' + Math.random().toString(36).substr(2, 5);
      const testData = {
        id: testId, idNumber: 'DIAG', name: 'DIAGNOSTIC', role: 'TEST', department: 'ATO', photo: '', 
        managerName: 'SYSTEM', managerRole: 'SYSTEM', lastEvaluation: 'NONE', summary: '', kpis: []
      };
      
      const { error: writeError } = await supabase.from('employees').upsert(testData, { onConflict: 'id' });

      if (!writeError) {
        status.employeesWrite = true;
        await supabase.from('employees').delete().eq('id', testId);
      } else {
        if (isAuthError(writeError)) status.authValid = false;
        status.error = `Escritura fallida: ${writeError.message}`;
      }

    } catch (e: any) {
      status.error = e.message || String(e);
      if (e.message === 'CLOUD_TIMEOUT_EXCEEDED') status.error = "La nube no responde (Timeout)";
    }
    return status;
  },

  pullFromCloud: async (): Promise<boolean> => {
    try {
      const [usersRes, empsRes, evalsRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('evaluations').select('*')
      ]);

      let imported = false;
      if (usersRes.data && usersRes.data.length > 0) {
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(usersRes.data));
        imported = true;
      }
      if (empsRes.data && empsRes.data.length > 0) {
        localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(empsRes.data));
        imported = true;
      }
      if (evalsRes.data && evalsRes.data.length > 0) {
        localStorage.setItem(DB_KEYS.EVALUATIONS, JSON.stringify(evalsRes.data));
        imported = true;
      }
      return imported;
    } catch (e) {
      return false;
    }
  },

  getUsers: (): User[] => {
    try {
      const data = localStorage.getItem(DB_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  },

  getUser: (username: string): User | undefined => {
    return VulcanDB.getUsers().find(u => u.username === username);
  },

  updateUser: async (updatedUser: User) => {
    const users = VulcanDB.getUsers();
    const index = users.findIndex(u => u.username === updatedUser.username);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
      await VulcanDB.pushToCloud('users', updatedUser);
      if (syncChannel) syncChannel.postMessage({ type: 'SYNC_USERS', data: users });
    }
  },

  getEmployees: (): Employee[] => {
    try {
      const data = localStorage.getItem(DB_KEYS.EMPLOYEES);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  },

  saveEmployees: async (employees: Employee[], broadcast = true) => {
    if (!Array.isArray(employees)) return false;
    localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(employees));
    await VulcanDB.pushToCloud('employees', employees);
    if (broadcast && syncChannel) {
      syncChannel.postMessage({ type: 'SYNC_EMPLOYEES', data: employees });
    }
    return true;
  },

  getEvaluations: (): FullEvaluation[] => {
    try {
      const data = localStorage.getItem(DB_KEYS.EVALUATIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  },

  saveEvaluations: async (evaluations: FullEvaluation[], broadcast = true) => {
    if (!Array.isArray(evaluations)) return false;
    localStorage.setItem(DB_KEYS.EVALUATIONS, JSON.stringify(evaluations));
    await VulcanDB.pushToCloud('evaluations', evaluations);
    if (broadcast && syncChannel) {
      syncChannel.postMessage({ type: 'SYNC_EVALUATIONS', data: evaluations });
    }
    return true;
  },

  deleteEmployee: async (id: string): Promise<Employee[]> => {
    const employees = VulcanDB.getEmployees().filter(e => e.id !== id);
    const evaluations = VulcanDB.getEvaluations().filter(ev => ev.employeeId !== id);
    
    await VulcanDB.saveEmployees(employees);
    await VulcanDB.saveEvaluations(evaluations);
    
    // Attempt cloud deletion
    try {
      await supabase.from('employees').delete().eq('id', id);
      await supabase.from('evaluations').delete().eq('employeeId', id);
    } catch (e) {
      console.warn("Could not delete from cloud, will retry on next sync.");
    }
    
    return employees;
  },

  onSync: (callback: (payload: any) => void) => {
    if (!syncChannel) return () => {};
    const listener = (event: MessageEvent) => {
      callback(event.data);
    };
    syncChannel.addEventListener('message', listener);
    return () => syncChannel?.removeEventListener('message', listener);
  },

  exportBackup: () => {
    const data = {
      employees: VulcanDB.getEmployees(),
      evaluations: VulcanDB.getEvaluations(),
      users: VulcanDB.getUsers()
    };
    // Use base64 encoding to provide a single string code
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  },

  importBackup: (code: string) => {
    try {
      const decoded = decodeURIComponent(escape(atob(code)));
      const data = JSON.parse(decoded);
      if (data.employees) VulcanDB.saveEmployees(data.employees);
      if (data.evaluations) VulcanDB.saveEvaluations(data.evaluations);
      if (data.users) localStorage.setItem(DB_KEYS.USERS, JSON.stringify(data.users));
      return true;
    } catch (e) {
      console.error("Backup import error:", e);
      return false;
    }
  }
};
