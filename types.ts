
export enum Department {
  ATO = 'ATO',
  VULCAN = 'VULCAN'
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
  idNumber: string;
  name: string;
  role: string;
  department: string;
  photo: string;
  managerName: string;
  managerRole: string;
  lastEvaluation: string;
  summary: string;
  kpis: KPI[];
  notifications?: VulcanNotification[];
}

export interface FullEvaluation {
  id?: string; // ID único para edición
  employeeId: string;
  campo: string;
  mes: string;
  año: string;
  evaluador: string;
  cargoEvaluador: string;
  areaDesempeño: string;
  criteria: TechnicalCriterion[];
  observaciones: string;
  condicionBono: BonusStatus;
  recomendacionSalarial: string; 
  incrementoSalarial?: string; 
  totalPuntos: number;
  promedioFinal: number;
  date: string;
  authorizedBy?: string;
}

export const AUTHORIZED_EVALUATORS = [
  "Xuezhi Jin",
  "Aurelio Cuya",
  "Hector Quezada",
  "Nelson Marcano",
  "Roger Vásquez",
  "Roger Vazquez",
  "José Villarroel",
  "Daniel Farrera",
  "Jacquelin Naim",
  "Jacqueline Naim",
  "Oscar Gil",
  "Andy Song",
  "Jessen Liu",
  "Frank Rendon",
  "Lucas Li",
  "Ryan Song",
  "Ait",
  "Jaime Wang",
  "Grisélida Gibbs"
];

// Gerentes autorizados para aprobación salarial y bonos
export const SALARY_APPROVERS = ["Jacquelin Naim", "Aurelio Cuya", "Xuezhi Jin"];
export const BONUS_APPROVER = "Jacquelin Naim";
