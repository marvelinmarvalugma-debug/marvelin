
import { Employee, FullEvaluation } from '../types';
import { INITIAL_EMPLOYEES } from '../constants';

const DB_KEYS = {
  EMPLOYEES: 'vulcan_db_employees',
  EVALUATIONS: 'vulcan_db_evaluations',
  SYSTEM_CONFIG: 'vulcan_db_config'
};

/**
 * Servicio de Base de Datos Local Vulcan
 * Gestiona la persistencia de datos en el navegador
 */
export const VulcanDB = {
  /**
   * Inicializa la base de datos con datos semilla si está vacía
   */
  initialize: () => {
    const existingEmployees = localStorage.getItem(DB_KEYS.EMPLOYEES);
    if (!existingEmployees) {
      localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
    }
    
    if (!localStorage.getItem(DB_KEYS.EVALUATIONS)) {
      localStorage.setItem(DB_KEYS.EVALUATIONS, JSON.stringify([]));
    }
  },

  /**
   * Obtiene todos los empleados de la base de datos
   */
  getEmployees: (): Employee[] => {
    const data = localStorage.getItem(DB_KEYS.EMPLOYEES);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Guarda la lista completa de empleados
   */
  saveEmployees: (employees: Employee[]) => {
    localStorage.setItem(DB_KEYS.EMPLOYEES, JSON.stringify(employees));
  },

  /**
   * Obtiene todo el historial de evaluaciones
   */
  getEvaluations: (): FullEvaluation[] => {
    const data = localStorage.getItem(DB_KEYS.EVALUATIONS);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Guarda el historial de evaluaciones
   */
  saveEvaluations: (evaluations: FullEvaluation[]) => {
    localStorage.setItem(DB_KEYS.EVALUATIONS, JSON.stringify(evaluations));
  },

  /**
   * Borra todos los datos (Reset de fábrica)
   */
  clearAll: () => {
    localStorage.clear();
    window.location.reload();
  }
};
