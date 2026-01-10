
import { Department, Employee, TechnicalCriterion } from './types';

export interface CategorizedCriterion extends Omit<TechnicalCriterion, 'score'> {
  category: string;
}

// MATRIZ ATO (OPERATIVA - SEGÚN PDF 1)
export const ATO_CRITERIA: CategorizedCriterion[] = [
  { id: 'ato_1', category: 'Técnica y Operacional', name: 'Cumplimiento de normas SIHOA', description: 'Adherencia a los protocolos de seguridad, higiene ocupacional y ambiente según la normativa vigente' },
  { id: 'ato_2', category: 'Técnica y Operacional', name: 'Inmediatez en los reportes', description: 'Tiempo de respuesta ante eventos operacionales, fallas, incidentes o requerimientos' },
  { id: 'ato_3', category: 'Técnica y Operacional', name: 'Ejecución de las tareas asignadas', description: 'Grado de cumplimiento, calidad y oportunidad en la ejecución de las actividades operativas' },
  { id: 'ato_4', category: 'Técnica y Operacional', name: 'Uso adecuado de equipos y herramientas', description: 'Manejo responsable, técnico y seguro de los recursos asignados' },
  { id: 'ato_5', category: 'Técnica y Operacional', name: 'Registro y trazabilidad de las actividades', description: 'Documentación clara, completa y oportuna de las tareas, inspecciones y reportes' },
  { id: 'ato_6', category: 'Técnica y Operacional', name: 'Coordinación con supervisores y pares', description: 'Nivel de comunicación, alineación y colaboración con el equipo de trabajo' },
  { id: 'ato_7', category: 'Técnica y Operacional', name: 'Respuesta ante contingencias', description: 'Capacidad de reacción, criterio técnico y apego a los protocolos en situaciones no previstas' },
  { id: 'ato_8', category: 'Técnica y Operacional', name: 'Cumplimiento de horarios y turnos', description: 'Puntualidad, permanencia en el sitio, y respeto por la planificación operativa' },
  { id: 'ato_9', category: 'Técnica y Operacional', name: 'Actitud profesional y respeto institucional', description: 'Comportamiento ético, respeto por las normas internas y trato adecuado con compañeros y supervisores' },
  { id: 'ato_10', category: 'Técnica y Operacional', name: 'Proactividad e iniciativa', description: 'Capacidad para anticiparse a las necesidades, proponer mejoras y actuar sin requerimiento directo' },
];

// MATRIZ VULCAN (ADMINISTRATIVA - SEGÚN PDF 2)
export const VULCAN_CRITERIA: CategorizedCriterion[] = [
  // 2. Indicadores de Desempeño
  { id: 'v_ind_1', category: 'Indicadores de Desempeño', name: 'Productividad', description: 'Cumple con las metas de producción y tareas asignadas en los tiempos estipulados' },
  { id: 'v_ind_2', category: 'Indicadores de Desempeño', name: 'Cumplimiento de plazos', description: 'Entrega las tareas y proyectos dentro de los plazos establecidos' },
  { id: 'v_ind_3', category: 'Indicadores de Desempeño', name: 'Calidad del trabajo', description: 'Realiza su trabajo con un bajo margen de error, asegurando la calidad de los productos y servicios' },
  { id: 'v_ind_4', category: 'Indicadores de Desempeño', name: 'Seguridad laboral', description: 'Cumple con todas las normativas de seguridad, protegiendo su bienestar y el de sus compañeros' },
  { id: 'v_ind_5', category: 'Indicadores de Desempeño', name: 'Cumplimiento de normativas legales', description: 'Conoce y sigue las regulaciones locales e internacionales aplicables al sector petrolero' },
  { id: 'v_ind_6', category: 'Indicadores de Desempeño', name: 'Eficiencia en el uso de recursos', description: 'Optimiza el uso de materiales, equipos y tiempo sin comprometer la calidad ni la seguridad' },

  // 3. Competencias Técnicas y Operativas
  { id: 'v_tec_1', category: 'Competencias Técnicas y Operativas', name: 'Conocimiento Técnico', description: 'Posee los conocimientos necesarios sobre equipos, procesos y tecnología en la industria petrolera' },
  { id: 'v_tec_2', category: 'Competencias Técnicas y Operativas', name: 'Manejo de Equipos', description: 'Capacidad para operar, mantener y reparar equipos y maquinarias específicos del sector' },
  { id: 'v_tec_3', category: 'Competencias Técnicas y Operativas', name: 'Habilidad para solucionar problemas', description: 'Resuelve problemas técnicos o imprevistos con eficacia y rapidez' },
  { id: 'v_tec_4', category: 'Competencias Técnicas y Operativas', name: 'Adaptabilidad a cambios tecnológicos', description: 'Se adapta a nuevas herramientas, tecnologías o procesos rápidamente' },
  { id: 'v_tec_5', category: 'Competencias Técnicas y Operativas', name: 'Gestión de proyectos', description: 'Participa activamente en la planificación y ejecución de proyectos en su área de responsabilidad' },

  // 4. Competencias Blandas
  { id: 'v_bla_1', category: 'Competencias blandas', name: 'Trabajo en equipo', description: 'Colabora de manera efectiva con sus compañeros y otros departamentos' },
  { id: 'v_bla_2', category: 'Competencias blandas', name: 'Comunicación', description: 'Expresa ideas de manera clara y efectiva, tanto oralmente como por escrito' },
  { id: 'v_bla_3', category: 'Competencias blandas', name: 'Liderazgo', description: 'Si aplica, dirige y motiva a su equipo para cumplir con los objetivos y mejorar el rendimiento' },
  { id: 'v_bla_4', category: 'Competencias blandas', name: 'Resolución de conflictos', description: 'Maneja y resuelve conflictos dentro del equipo de manera profesional y eficiente' },
  { id: 'v_bla_5', category: 'Competencias blandas', name: 'Gestión del tiempo', description: 'Organiza eficazmente su jornada laboral, priorizando tareas importantes y cumpliendo con los plazos' },

  // 5. Cultura Organizacional
  { id: 'v_cul_1', category: 'Cumplimiento de la cultura organizacional', name: 'Compromiso con la empresa', description: 'Muestra dedicación y responsabilidad en su trabajo' },
  { id: 'v_cul_2', category: 'Cumplimiento de la cultura organizacional', name: 'Responsabilidad ambiental', description: 'Cumple con las políticas de sostenibilidad y gestión ambiental de la empresa' },
  { id: 'v_cul_3', category: 'Cumplimiento de la cultura organizacional', name: 'Compromiso con la seguridad', description: 'Prioriza la seguridad de las personas y los equipos en el trabajo' },
  { id: 'v_cul_4', category: 'Cumplimiento de la cultura organizacional', name: 'Ética profesional', description: 'Actúa con honestidad y en conformidad con los principios éticos de la empresa' },
];

export const DEFAULT_KPIS = [
  { id: 'k1', name: 'Productividad', score: 0, weight: 40 },
  { id: 'k2', name: 'Calidad Operativa', score: 0, weight: 30 },
  { id: 'k3', name: 'Seguridad SIHOA', score: 0, weight: 30 }
];

// Se deja vacío para que no se restauren empleados por defecto al limpiar la DB
export const INITIAL_EMPLOYEES: Employee[] = [];
