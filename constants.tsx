
import { Department, Employee, TechnicalCriterion } from './types';

export const VULCAN_CRITERIA: Omit<TechnicalCriterion, 'score'>[] = [
  { id: 'c1', name: 'Cumplimiento de normas SIHOA', description: 'Adherencia a los protocolos de seguridad, higiene ocupacional y ambiente según la normativa vigente' },
  { id: 'c2', name: 'Inmediatez en los reportes', description: 'Tiempo de respuesta ante eventos operacionales, fallas, incidentes o requerimientos' },
  { id: 'c3', name: 'Ejecución de las tareas asignadas', description: 'Grado de cumplimiento, calidad y oportunidad en la ejecución de las actividades operativas' },
  { id: 'c4', name: 'Uso adecuado de equipos y herramientas', description: 'Manejo responsable, técnico y seguro de los recursos asignados' },
  { id: 'c5', name: 'Registro y trazabilidad de las actividades', description: 'Documentación clara, completa y oportuna de las tareas, inspecciones y reportes' },
  { id: 'c6', name: 'Coordinación con supervisores y pares', description: 'Nivel de comunicación, alineación y colaboración con el equipo de trabajo' },
  { id: 'c7', name: 'Respuesta ante contingencias', description: 'Capacidad de reacción, criterio técnico y apego a los protocolos en situaciones no previstas' },
  { id: 'c8', name: 'Cumplimiento de horarios y turnos', description: 'Puntualidad, permanencia en el sitio, y respeto por la planificación operativa' },
  { id: 'c9', name: 'Actitud profesional y respeto institucional', description: 'Comportamiento ético, respeto por las normas internas y trato adecuado con compañeros y supervisores' },
  { id: 'c10', name: 'Proactividad e iniciativa', description: 'Capacidad para anticiparse a las necesidades, proponer mejoras y actuar sin requerimiento directo' },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: '1',
    name: 'Elena Rodríguez',
    role: 'Supervisor de Planta',
    department: Department.Operations,
    photo: 'https://picsum.photos/seed/elena/200/200',
    managerName: 'Marcos Silva',
    managerRole: 'Gerente de Operaciones',
    lastEvaluation: '2024-03-15',
    summary: 'Personal altamente capacitado con excelente apego a normas SIHOA.',
    kpis: [
      { id: 'k1', name: 'Productividad', score: 92, weight: 40 },
      { id: 'k2', name: 'Calidad Operativa', score: 88, weight: 30 },
      { id: 'k3', name: 'Seguridad SIHOA', score: 100, weight: 30 }
    ]
  },
  {
    id: '2',
    name: 'Javier Martínez',
    role: 'Técnico de Mantenimiento',
    department: Department.Operations,
    photo: 'https://picsum.photos/seed/javier/200/200',
    managerName: 'Sofía Castro',
    managerRole: 'Líder de Mantenimiento',
    lastEvaluation: '2024-02-10',
    summary: 'Destaca en la inmediatez de reportes y trazabilidad.',
    kpis: [
      { id: 'k1', name: 'Productividad', score: 85, weight: 40 },
      { id: 'k2', name: 'Calidad Operativa', score: 90, weight: 30 },
      { id: 'k3', name: 'Seguridad SIHOA', score: 95, weight: 30 }
    ]
  }
];