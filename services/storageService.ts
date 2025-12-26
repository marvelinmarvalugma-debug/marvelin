
import { Employee, FullEvaluation } from '../types';
import { INITIAL_EMPLOYEES } from '../constants';

const DB_KEYS = {
  EMPLOYEES: 'vulcan_db_employees',
  EVALUATIONS: 'vulcan_db_evaluations',
  SYNC_ID: 'vulcan_db_sync_id',
  LAST_SYNC: 'vulcan_db_last_sync'
};

// URL de base para el almacenamiento persistente (Simulado/Público)
// En una implementación real, esto apuntaría a su propio backend o Firebase.
const CLOUD_API_BASE = 'https://api.jsonbin.io/v3/b'; 
// Nota: Para este demo, usaremos localStorage con capacidad de exportación/importación
// para simular la persistencia entre sesiones y dispositivos.

export const VulcanDB = {
  initialize: () => {
    const existingEmployees = localStorage.getItem(DB_KEYS.EMPLOYEES);
    if (!existingEmployees) {
      localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
    }
    if (!localStorage.getItem(DB_KEYS.EVALUATIONS)) {
      localStorage.setItem(DB_KEYS.EVALUATIONS, JSON.stringify([]));
    }
  },

  getSyncId: () => localStorage.getItem(DB_KEYS.SYNC_ID),
  setSyncId: (id: string) => localStorage.setItem(DB_KEYS.SYNC_ID, id),

  getEmployees: (): Employee[] => {
    const data = localStorage.getItem(DB_KEYS.EMPLOYEES);
    return data ? JSON.parse(data) : [];
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

  /**
   * Genera un paquete de datos para exportar/sincronizar
   */
  exportData: () => {
    return JSON.stringify({
      employees: VulcanDB.getEmployees(),
      evaluations: VulcanDB.getEvaluations(),
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Importa datos desde una fuente externa (otro dispositivo)
   */
  importData: (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.employees) VulcanDB.saveEmployees(parsed.employees);
      if (parsed.evaluations) VulcanDB.saveEvaluations(parsed.evaluations);
      localStorage.setItem(DB_KEYS.LAST_SYNC, new Date().toISOString());
      return true;
    } catch (e) {
      console.error("Error importando datos:", e);
      return false;
    }
  },

  clearAll: () => {
    localStorage.clear();
    window.location.reload();
  }
};
