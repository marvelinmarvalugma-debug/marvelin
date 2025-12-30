
import { Employee, FullEvaluation, User, UserRole, AUTHORIZED_EVALUATORS, BONUS_APPROVER } from '../types';
import { INITIAL_EMPLOYEES } from '../constants';

const DB_KEYS = {
  EMPLOYEES: 'vulcan_db_employees_v1',
  EVALUATIONS: 'vulcan_db_evaluations_v1',
  USERS: 'vulcan_db_users_v1',
};

const syncChannel = new BroadcastChannel('vulcan_sync_channel');

export const VulcanDB = {
  initialize: () => {
    // Inicializar Empleados (Merge para no perder datos nuevos)
    const existingEmps = localStorage.getItem(DB_KEYS.EMPLOYEES);
    if (!existingEmps) {
      localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
    } else {
      const emps = JSON.parse(existingEmps);
      // Asegurar que Jacquelin y Nelson existan
      INITIAL_EMPLOYEES.forEach(initial => {
        if (!emps.some((e: Employee) => e.id === initial.id)) {
          emps.push(initial);
        }
      });
      localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(emps));
    }

    // Inicializar Tabla de Usuarios
    const existingUsers = localStorage.getItem(DB_KEYS.USERS);
    if (!existingUsers) {
      const initialUsers: User[] = AUTHORIZED_EVALUATORS.map(name => ({
        username: name,
        role: name === BONUS_APPROVER ? UserRole.Director : UserRole.Supervisor,
        password: '' 
      }));
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(initialUsers));
    }
  },

  getUsers: (): User[] => {
    const data = localStorage.getItem(DB_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },

  getUser: (username: string): User | undefined => {
    return VulcanDB.getUsers().find(u => u.username === username);
  },

  updateUser: (updatedUser: User) => {
    const users = VulcanDB.getUsers();
    const index = users.findIndex(u => u.username === updatedUser.username);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
      syncChannel.postMessage({ type: 'SYNC_USERS', data: users });
    }
  },

  getEmployees: (): Employee[] => {
    const data = localStorage.getItem(DB_KEYS.EMPLOYEES);
    return data ? JSON.parse(data) : INITIAL_EMPLOYEES;
  },

  saveEmployees: (employees: Employee[], broadcast = true) => {
    localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(employees));
    if (broadcast) {
      syncChannel.postMessage({ type: 'SYNC_EMPLOYEES', data: employees });
    }
  },

  getEvaluations: (): FullEvaluation[] => {
    const data = localStorage.getItem(DB_KEYS.EVALUATIONS);
    return data ? JSON.parse(data) : [];
  },

  saveEvaluations: (evaluations: FullEvaluation[], broadcast = true) => {
    localStorage.setItem(DB_KEYS.EVALUATIONS, JSON.stringify(evaluations));
    if (broadcast) {
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
      console.error("Export error:", e);
      return "";
    }
  },

  importBackup: (code: string): boolean => {
    try {
      const decoded = decodeURIComponent(escape(atob(code)));
      const data = JSON.parse(decoded);
      if (data.employees) localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(data.employees));
      if (data.evaluations) localStorage.setItem(DB_KEYS.EVALUATIONS, JSON.stringify(data.evaluations));
      if (data.users) localStorage.setItem(DB_KEYS.USERS, JSON.stringify(data.users));
      return true;
    } catch (e) {
      return false;
    }
  },

  onSync: (callback: (payload: { type: string, data: any }) => void) => {
    syncChannel.onmessage = (event) => {
      callback(event.data);
    };
  },

  reset: () => {
    localStorage.clear();
    window.location.reload();
  }
};
