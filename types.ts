
export enum Department {
  Engineering = 'Engineering',
  Marketing = 'Marketing',
  Sales = 'Sales',
  Product = 'Product',
  HR = 'HR',
  Operations = 'Operativa',
  Administrative = 'Administrativa'
}

export interface KPI {
  id: string;
  name: string;
  score: number;
  weight: number;
}

export interface TechnicalCriterion {
  id: string;
  name: string;
  description: string;
  score: number; // 1-5
}

export enum BonusStatus {
  Approved = 'Aprobado',
  Conditioned = 'Condicionado a mejora',
  NotApproved = 'NO APROBADO',
  PendingAuth = 'Pendiente de Autorización'
}

export interface VulcanNotification {
  id: string;
  employeeId: string;
  title: string;
  message: string;
  date: string;
  type: 'bonus' | 'info';
  read: boolean;
}

export interface Employee {
  id: string;
  idNumber: string; // Cédula
  name: string;
  role: string;
  department: Department;
  photo: string;
  managerName: string;
  managerRole: string;
  lastEvaluation: string;
  summary: string;
  kpis: KPI[];
  notifications?: VulcanNotification[];
}

export interface FullEvaluation {
  employeeId: string;
  campo: string;
  mes: string;
  evaluador: string;
  cargoEvaluador: string;
  areaDesempeño: 'Operativa' | 'Administrativa';
  criteria: TechnicalCriterion[];
  observaciones: string;
  condicionBono: BonusStatus;
  totalPuntos: number;
  promedioFinal: number;
  date: string;
  authorizedBy?: string;
}

// Lista oficial actualizada de evaluadores autorizados
export const AUTHORIZED_EVALUATORS = [
  "NELSON MARCANO",
  "DANIEL FARRERA",
  "JOSE VILLARROEL",
  "HUGO PEÑA",
  "ROMER VASQUEZ",
  "ROGER VASQUEZ",
  "JAQUELIN NAIM"
];

// Único autorizador de bonos actualizado
export const BONUS_APPROVER = "JAQUELIN NAIM";
