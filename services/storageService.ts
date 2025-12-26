
import { Employee, FullEvaluation } from '../types';
import { INITIAL_EMPLOYEES } from '../constants';

const DB_KEYS = {
  EMPLOYEES: 'vulcan_db_employees_v1',
  EVALUATIONS: 'vulcan_db_evaluations_v1',
};

export const VulcanDB = {
  initialize: () => {
    const existing = localStorage.getItem(DB_KEYS.EMPLOYEES);
    if (!existing) {
      localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
    }
  },

  getEmployees: (): Employee[] => {
    const data = localStorage.getItem(DB_KEYS.EMPLOYEES);
    return data ? JSON.parse(data) : INITIAL_EMPLOYEES;
  },

  saveEmployees: (employees: Employee[]) => {
    localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(employees));
  },

  getEvaluations: (): FullEvaluation[] => {
    const data = localStorage.getItem(DB_KEYS.EVALUATIONS);
    return data ? JSON.parse(data) : [];
  },

  saveEvaluations: (evaluations: FullEvaluation[]) => {
    localStorage.setItem(DB_KEYS.EVALUATIONS, JSON.stringify(evaluations));
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
