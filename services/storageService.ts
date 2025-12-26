
import { Employee, FullEvaluation } from '../types';
import { INITIAL_EMPLOYEES } from '../constants';

const DB_KEYS = {
  EMPLOYEES: 'vulcan_db_employees_v1',
  EVALUATIONS: 'vulcan_db_evaluations_v1',
  MASTER_PWD: 'vulcan_db_master_pwd_v1',
};

// Canal de comunicación para sincronización en tiempo real entre pestañas
const syncChannel = new BroadcastChannel('vulcan_sync_channel');

export const VulcanDB = {
  initialize: () => {
    const existing = localStorage.getItem(DB_KEYS.EMPLOYEES);
    if (!existing) {
      localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
    }
  },

  getMasterPassword: () => localStorage.getItem(DB_KEYS.MASTER_PWD),
  setMasterPassword: (pwd: string) => localStorage.setItem(DB_KEYS.MASTER_PWD, pwd),

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

  // Suscribirse a cambios desde otras pestañas
  onSync: (callback: (payload: { type: string, data: any }) => void) => {
    syncChannel.onmessage = (event) => {
      callback(event.data);
    };
  },

  exportBackup: () => {
    const data = {
      employees: VulcanDB.getEmployees(),
      evaluations: VulcanDB.getEvaluations(),
      timestamp: new Date().toISOString()
    };
    return btoa(JSON.stringify(data));
  },

  importBackup: (code: string) => {
    try {
      const decoded = JSON.parse(atob(code));
      if (decoded.employees && decoded.evaluations) {
        VulcanDB.saveEmployees(decoded.employees);
        VulcanDB.saveEvaluations(decoded.evaluations);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  reset: () => {
    localStorage.clear();
    window.location.reload();
  }
};
