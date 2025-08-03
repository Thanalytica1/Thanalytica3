import type { HealthInsight, HealthTrend, Recommendation } from "@shared/schema";

// Advanced Health AI Assistant
export class HealthAI {
  private apiBase = "/api/health-ai";

  async analyzeSymptoms(symptoms: string[], userId: string): Promise<HealthInsight> {
    const response = await fetch(`${this.apiBase}/analyze-symptoms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms, userId }),
    });
    return response.json();
  }

  async suggestInterventions(goals: string[], userId: string): Promise<Recommendation[]> {
    const response = await fetch(`${this.apiBase}/suggest-interventions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals, userId }),
    });
    return response.json();
  }

  async answerHealthQuestion(question: string, userId: string): Promise<string> {
    const response = await fetch(`${this.apiBase}/answer-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, userId }),
    });
    const data = await response.json();
    return data.answer;
  }

  async predictHealthTrends(userId: string, metricType?: string): Promise<HealthTrend[]> {
    const params = metricType ? `?metricType=${metricType}` : '';
    const response = await fetch(`${this.apiBase}/predict-trends/${userId}${params}`);
    return response.json();
  }

  async generateHealthModel(userId: string): Promise<any> {
    const response = await fetch(`${this.apiBase}/generate-model/${userId}`, {
      method: 'POST',
    });
    return response.json();
  }
}

export const healthAI = new HealthAI();

// Advanced health calculations with confidence scoring
export class HealthModelingEngine {
  static calculateBiologicalAge(metrics: any, confidence: boolean = true): { age: number; confidence: number } {
    let biologicalAge = metrics.chronologicalAge || 35;
    let confidenceScore = 0.7; // Base confidence

    // Sleep impact analysis
    if (metrics.sleepScore) {
      const sleepImpact = (metrics.sleepScore - 70) * 0.1;
      biologicalAge -= sleepImpact;
      confidenceScore += 0.1;
    }

    // Exercise impact with intensity weighting
    if (metrics.exerciseScore) {
      const exerciseImpact = (metrics.exerciseScore - 60) * 0.15;
      biologicalAge -= exerciseImpact;
      confidenceScore += 0.1;
    }

    // Nutrition and lifestyle factors
    if (metrics.nutritionScore) {
      const nutritionImpact = (metrics.nutritionScore - 65) * 0.12;
      biologicalAge -= nutritionImpact;
      confidenceScore += 0.05;
    }

    // Stress management impact
    if (metrics.stressScore) {
      const stressImpact = (70 - metrics.stressScore) * 0.08;
      biologicalAge += stressImpact;
      confidenceScore += 0.05;
    }

    // Wearable data integration for higher accuracy
    if (metrics.wearableData && metrics.wearableData.length > 0) {
      confidenceScore += 0.2;
      // HRV-based age adjustment
      const avgHRV = metrics.wearableData
        .filter((d: any) => d.dataType === 'hrv')
        .reduce((sum: number, d: any) => sum + (d.metrics.value || 0), 0) / 
        metrics.wearableData.filter((d: any) => d.dataType === 'hrv').length;
      
      if (avgHRV > 0) {
        // Higher HRV generally indicates better health
        const hrvImpact = (avgHRV - 30) * 0.1;
        biologicalAge -= hrvImpact;
      }
    }

    return {
      age: Math.max(biologicalAge, metrics.chronologicalAge * 0.7),
      confidence: Math.min(confidenceScore, 0.95)
    };
  }

  static calculateDiseaseRisks(metrics: any): Record<string, number> {
    const risks: Record<string, number> = {};

    // Cardiovascular risk calculation
    let cardioRisk = 0.1; // Base risk
    if (metrics.exerciseScore < 50) cardioRisk += 0.2;
    if (metrics.stressScore > 70) cardioRisk += 0.15;
    if (metrics.sleepScore < 60) cardioRisk += 0.1;
    risks.cardiovascular = Math.min(cardioRisk, 0.8);

    // Metabolic syndrome risk
    let metabolicRisk = 0.08;
    if (metrics.exerciseScore < 40) metabolicRisk += 0.25;
    if (metrics.nutritionScore < 50) metabolicRisk += 0.2;
    risks.metabolic = Math.min(metabolicRisk, 0.7);

    // Cognitive decline risk
    let cognitiveRisk = 0.05;
    if (metrics.sleepScore < 50) cognitiveRisk += 0.15;
    if (metrics.exerciseScore < 45) cognitiveRisk += 0.1;
    if (metrics.stressScore > 75) cognitiveRisk += 0.1;
    risks.cognitive = Math.min(cognitiveRisk, 0.6);

    return risks;
  }

  static calculateInterventionImpact(currentMetrics: any, interventions: string[]): Record<string, number> {
    const impacts: Record<string, number> = {};

    interventions.forEach(intervention => {
      switch (intervention.toLowerCase()) {
        case 'strength training':
          impacts[intervention] = currentMetrics.exerciseScore < 70 ? 3.2 : 1.8;
          break;
        case 'meditation':
          impacts[intervention] = currentMetrics.stressScore > 60 ? 2.8 : 1.5;
          break;
        case 'sleep optimization':
          impacts[intervention] = currentMetrics.sleepScore < 70 ? 4.1 : 2.2;
          break;
        case 'nutrition coaching':
          impacts[intervention] = currentMetrics.nutritionScore < 65 ? 3.5 : 2.0;
          break;
        case 'cardio training':
          impacts[intervention] = currentMetrics.exerciseScore < 60 ? 2.9 : 1.6;
          break;
        default:
          impacts[intervention] = 1.5; // Default impact
      }
    });

    return impacts;
  }
}