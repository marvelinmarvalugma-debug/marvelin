
import { Employee, FullEvaluation, User, UserRole, AUTHORIZED_EVALUATORS, SALARY_APPROVERS } from '../types';
import { INITIAL_EMPLOYEES } from '../constants';
import { supabase, handleSupabaseError } from './supabaseService';

const DB_KEYS = {
  EMPLOYEES: 'vulcan_db_employees_v1',
  EVALUATIONS: 'vulcan_db_evaluations_v1',
  USERS: 'vulcan_db_users_v1',
};

let syncChannel: BroadcastChannel | null = null;
try {
  syncChannel = new BroadcastChannel('vulcan_sync_channel');
} catch (e) {
  console.warn("BroadcastChannel not supported in this environment.");
}

export const VulcanDB = {
  initialize: async () => {
    const cloudAvailable = await VulcanDB.pullFromCloud();

    const localUsersStr = localStorage.getItem(DB_KEYS.USERS);
    const localUsers = localUsersStr ? JSON.parse(localUsersStr) : [];
    
    if (localUsers.length === 0 && !cloudAvailable) {
      const initialUsers: User[] = AUTHORIZED_EVALUATORS.map(name => {
        const isManager = SALARY_APPROVERS.some(mgr => name.toLowerCase().trim() === mgr.toLowerCase().trim());
        return {
          username: name,
          role: isManager ? UserRole.Director : UserRole.Supervisor,
          password: '' 
        };
      });
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(initialUsers));
      await supabase.from('users').upsert(initialUsers);
    }

    const localEmpsStr = localStorage.getItem(DB_KEYS.EMPLOYEES);
    const hasKey = localEmpsStr !== null;
    const localEmps = localEmpsStr ? JSON.parse(localEmpsStr) : [];

    // Si no existe la clave ni datos en la nube, cargar iniciales
    if (!hasKey && !cloudAvailable) {
      localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
      await supabase.from('employees').upsert(INITIAL_EMPLOYEES);
    }
  },

  pullFromCloud: async (): Promise<boolean> => {
    try {
      const [usersRes, empsRes, evalsRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('employees').select('*'),
        supabase.from('evaluations').select('*')
      ]);

      let hasData = false;
      if (usersRes.data && usersRes.data.length > 0) {
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(usersRes.data));
        hasData = true;
      }
      if (empsRes.data && empsRes.data.length > 0) {
        localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(empsRes.data));
        hasData = true;
      }
      if (evalsRes.data && evalsRes.data.length > 0) {
        localStorage.setItem(DB_KEYS.EVALUATIONS, JSON.stringify(evalsRes.data));
        hasData = true;
      }
      return hasData;
    } catch (e) {
      console.warn("Error pulling from cloud:", e);
      return false;
    }
  },

  getUsers: (): User[] => {
    try {
      const data = localStorage.getItem(DB_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
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
      const { error } = await supabase.from('users').upsert(updatedUser);
      handleSupabaseError(error);
      if (syncChannel) syncChannel.postMessage({ type: 'SYNC_USERS', data: users });
    }
  },

  getEmployees: (): Employee[] => {
    try {
      const data = localStorage.getItem(DB_KEYS.EMPLOYEES);
      return data ? JSON.parse(data) : INITIAL_EMPLOYEES;
    } catch (e) {
      return INITIAL_EMPLOYEES;
    }
  },

  saveEmployees: async (employees: Employee[], broadcast = true) => {
    const cleanEmployees = employees.map(({ notifications, ...rest }) => ({
        id: rest.id,
        idNumber: rest.idNumber,
        name: rest.name,
        role: rest.role,
        department: rest.department,
        photo: rest.photo,
        managerName: rest.managerName,
        managerRole: rest.managerRole,
        lastEvaluation: rest.lastEvaluation,
        summary: rest.summary,
        kpis: rest.kpis
    }));

    localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(employees));
    const { error } = await supabase.from('employees').upsert(cleanEmployees);
    
    if (error) {
        console.error("Error al guardar en Supabase:", error);
        throw new Error(error.message);
    }

    if (broadcast && syncChannel) {
      syncChannel.postMessage({ type: 'SYNC_EMPLOYEES', data: employees });
    }
    return true;
  },

  deleteEmployee: async (id: string) => {
    const employees = VulcanDB.getEmployees().filter(e => e.id !== id);
    localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(employees));
    
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) {
      console.error("Error al eliminar en Supabase:", error);
    }

    if (syncChannel) {
      syncChannel.postMessage({ type: 'SYNC_EMPLOYEES', data: employees });
    }
    return employees;
  },

  getEvaluations: (): FullEvaluation[] => {
    try {
      const data = localStorage.getItem(DB_KEYS.EVALUATIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveEvaluations: async (evaluations: FullEvaluation[], broadcast = true) => {
    localStorage.setItem(DB_KEYS.EVALUATIONS, JSON.stringify(evaluations));
    const { error } = await supabase.from('evaluations').upsert(evaluations);
    handleSupabaseError(error);
    if (broadcast && syncChannel) {
      syncChannel.postMessage({ type: 'SYNC_EVALUATIONS', data: evaluations });
    }
  },

  exportBackup: (): string => {
    const data = {
      employees: VulcanDB.getEmployees(),
      evaluations: VulcanDB.getEvaluations(),
      users: VulcanDB.getUsers()
    };
    try {
      return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    } catch (e) {
      return "";
    }
  },

  importBackup: async (code: string): Promise<boolean> => {
    try {
      const decoded = decodeURIComponent(escape(atob(code)));
      const data = JSON.parse(decoded);
      if (data.employees) {
        localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(data.employees));
        await VulcanDB.saveEmployees(data.employees);
      }
      if (data.evaluations) {
        localStorage.setItem(DB_KEYS.EVALUATIONS, JSON.stringify(data.evaluations));
        await supabase.from('evaluations').upsert(data.evaluations);
      }
      return true;
    } catch (e) {
      return false;
    }
  },

  onSync: (callback: (payload: { type: string, data: any }) => void) => {
    if (!syncChannel) return null;
    const handler = (event: MessageEvent) => {
      callback(event.data);
    };
    syncChannel.addEventListener('message', handler);
    return () => syncChannel?.removeEventListener('message', handler);
  },

  reset: async () => {
    localStorage.clear();
    window.location.reload();
  }
};
