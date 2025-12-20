
import { GoogleGenAI, Type } from "@google/genai";
import { Employee, FullEvaluation } from "../types";

// Initialize Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates insights about an employee's performance based on their KPIs.
 */
export async function generatePerformanceInsights(employee: Employee) {
  // Accessing kpis property which is now added to the Employee type
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
    // Safely extract text output from response
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error generating performance insights:", error);
    return { summary: "Error en análisis.", strengths: [], growthAreas: [] };
  }
}

/**
 * Analyzes a full evaluation report to provide strategic HR feedback.
 */
export async function analyzeFullEvaluation(employee: Employee, evaluation: FullEvaluation) {
  // Using criteria and observaciones from FullEvaluation type instead of non-existent properties
  const compDetails = evaluation.criteria.map(c => `${c.name}: ${c.score}/5`).join(', ');
  // KPIs are taken from the employee object to provide historical context
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
    // Extract text directly from response object
    return JSON.parse(response.text || 'null');
  } catch (error) {
    console.error("Error analyzing full evaluation:", error);
    return null;
  }
}