// Health Data Validation Utilities
import { TRAJECTORY_RATINGS } from '@/config/dashboard.config';

export interface HealthData {
  vitalityScore?: number;
  biologicalAge?: number;
  trajectoryRating?: string;
  sleepScore?: number;
  exerciseScore?: number;
  nutritionScore?: number;
  stressScore?: number;
  cognitiveScore?: number;
  projectedLifespan?: number;
  cardiovascularRisk?: string;
  metabolicRisk?: string;
}

export const validateHealthData = (data: HealthData): HealthData => {
  const validated = { ...data };
  
  // Ensure scores are within valid ranges (0-100)
  const scoreFields = [
    'vitalityScore', 
    'sleepScore', 
    'exerciseScore', 
    'nutritionScore', 
    'stressScore', 
    'cognitiveScore'
  ] as const;
  
  scoreFields.forEach(field => {
    if (validated[field] !== undefined) {
      validated[field] = Math.max(0, Math.min(100, Number(validated[field]) || 0));
    }
  });
  
  // Validate biological age (reasonable range: 10-150)
  if (validated.biologicalAge) {
    validated.biologicalAge = Math.max(10, Math.min(150, Number(validated.biologicalAge)));
  }
  
  // Validate projected lifespan (reasonable range: 50-200)
  if (validated.projectedLifespan) {
    validated.projectedLifespan = Math.max(50, Math.min(200, Number(validated.projectedLifespan)));
  }
  
  // Validate trajectory rating
  const validTrajectoryRatings = Object.keys(TRAJECTORY_RATINGS);
  if (!validTrajectoryRatings.includes(validated.trajectoryRating || '')) {
    validated.trajectoryRating = 'MODERATE';
  }
  
  // Validate risk assessments
  const validRiskLevels = ['Low Risk', 'Moderate Risk', 'High Risk', 'Monitor', 'Critical'];
  if (validated.cardiovascularRisk && !validRiskLevels.some(level => 
    validated.cardiovascularRisk?.includes(level))) {
    validated.cardiovascularRisk = 'Monitor';
  }
  
  if (validated.metabolicRisk && !validRiskLevels.some(level => 
    validated.metabolicRisk?.includes(level))) {
    validated.metabolicRisk = 'Monitor';
  }
  
  return validated;
};

export const calculateHealthTrend = (
  current: number, 
  previous: number, 
  threshold = 5
): {
  direction: 'up' | 'down' | 'stable';
  change: number;
  changePercent: number;
} => {
  const change = current - previous;
  const changePercent = previous > 0 ? (change / previous) * 100 : 0;
  
  let direction: 'up' | 'down' | 'stable';
  if (Math.abs(changePercent) < threshold) {
    direction = 'stable';
  } else if (change > 0) {
    direction = 'up';
  } else {
    direction = 'down';
  }
  
  return {
    direction,
    change: Math.round(change * 10) / 10,
    changePercent: Math.round(changePercent * 10) / 10
  };
};

export const getScoreCategory = (score: number): 'excellent' | 'good' | 'moderate' | 'poor' => {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 70) return 'moderate';
  return 'poor';
};

export const calculateBiologicalAgeStatus = (
  biologicalAge: number, 
  chronologicalAge: number
): {
  status: 'excellent' | 'good' | 'moderate' | 'poor';
  difference: number;
  message: string;
} => {
  const difference = biologicalAge - chronologicalAge;
  
  let status: 'excellent' | 'good' | 'moderate' | 'poor';
  let message: string;
  
  if (difference <= -5) {
    status = 'excellent';
    message = `${Math.abs(difference)} years younger than chronological age`;
  } else if (difference <= -2) {
    status = 'good';
    message = `${Math.abs(difference)} years younger than chronological age`;
  } else if (difference <= 2) {
    status = 'moderate';
    message = 'Close to chronological age';
  } else {
    status = 'poor';
    message = `${difference} years older than chronological age`;
  }
  
  return { status, difference, message };
};

export const validateMetricValue = (value: any, type: string): number => {
  const numValue = Number(value);
  
  if (isNaN(numValue)) return 0;
  
  switch (type) {
    case 'percentage':
      return Math.max(0, Math.min(100, numValue));
    case 'age':
      return Math.max(0, Math.min(150, numValue));
    case 'lifespan':
      return Math.max(50, Math.min(200, numValue));
    case 'hours':
      return Math.max(0, Math.min(24, numValue));
    default:
      return Math.max(0, numValue);
  }
};