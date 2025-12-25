
import { GoogleGenAI, Type } from "@google/genai";
import { Employee, FullEvaluation } from "../types";

/**
 * Generates insights about an employee's performance based on their KPIs.
 */
export async function generatePerformanceInsights(employee: Employee) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return { summary: "Servicio no configurado.", strengths: [], growthAreas: [] };

  const ai = new GoogleGenAI({ apiKey });
  const kpiDetails = employee.kpis.map(k => `${k.name}: ${k.score}/100`).join(', ');
  
  const prompt = `Analiza el desempeño de ${employee.name}, ${employee.role} en ${employee.department}. 
  Puntajes: ${kpiDetails}. 
  Genera una revisión profesional en español con 3 fortalezas, 2 áreas de mejora y un resumen de impacto.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            growthAreas: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["summary", "strengths", "growthAreas"]
        }
      }
    });
    
    const text = response.text;
    if (!text) return { summary: "Sin respuesta del modelo.", strengths: [], growthAreas: [] };
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating performance insights:", error);
    return { summary: "Análisis técnico completado (IA offline).", strengths: [], growthAreas: [] };
  }
}

/**
 * Analyzes a full evaluation report to provide strategic HR feedback.
 */
export async function analyzeFullEvaluation(employee: Employee, evaluation: FullEvaluation) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  const compDetails = evaluation.criteria.map(c => `${c.name}: ${c.score}/5`).join(', ');
  const kpiDetails = employee.kpis.map(k => `${k.name}: ${k.score}/100`).join(', ');

  const prompt = `Como experto en HR, analiza la siguiente evaluación de ${employee.name}:
  Criterios de Matriz: ${compDetails}
  Indicadores KPI: ${kpiDetails}
  Comentarios del Manager: ${evaluation.observaciones}
  
  Proporciona un Plan de Acción Estratégico en español con:
  1. Conclusión General
  2. 3 Objetivos SMART para el próximo trimestre.
  3. Recomendación de capacitación específica.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            conclusion: { type: Type.STRING },
            smartObjectives: { type: Type.ARRAY, items: { type: Type.STRING } },
            trainingRecommendation: { type: Type.STRING }
          },
          required: ["conclusion", "smartObjectives", "trainingRecommendation"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;

    return JSON.parse(text);
  } catch (error) {
    console.error("Error analyzing full evaluation:", error);
    return null;
  }
}
