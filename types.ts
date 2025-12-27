
export enum Department {
  Engineering = 'Engineering',
  Marketing = 'Marketing',
  Sales = 'Sales',
  Product = 'Product',
  HR = 'HR',
  Operations = 'Operativa',
  Administrative = 'Administrativa'
}

export enum UserRole {
  Supervisor = 'Supervisor',
  Director = 'Director'
}

export interface User {
  username: string;
  password?: string;
  role: UserRole;
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
  año: string;
  evaluador: string;
  cargoEvaluador: string;
  areaDesempeño: 'Operativa' | 'Administrativa';
  criteria: TechnicalCriterion[];
  observaciones: string;
  condicionBono: BonusStatus;
  recomendacionSalarial: string; 
  totalPuntos: number;
  promedioFinal: number;
  date: string;
  authorizedBy?: string;
}

export const AUTHORIZED_EVALUATORS = [
  "NELSON MARCANO",
  "DANIEL FARRERA",
  "JOSE VILLARROEL",
  "HUGO PEÑA",
  "ROMER VASQUEZ",
  "ROGER VASQUEZ",
  "JAQUELIN NAIM"
];

export const BONUS_APPROVER = "JAQUELIN NAIM";
