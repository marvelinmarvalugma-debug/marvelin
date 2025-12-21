
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
  NotApproved = 'No aprobado'
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
}
