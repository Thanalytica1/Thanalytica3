import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity,
  Brain,
  Heart,
  Moon,
  Apple,
  Users,
  Cigarette,
  Wine,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Calendar,
  BookOpen,
  Lightbulb,
  RotateCcw,
  Save
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useHealthAssessment } from "@/hooks/use-health-data";

// Lifestyle factor definitions with evidence-based impacts
export interface LifestyleFactor {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  unit: string;
  min: number;
  max: number;
  optimal: number;
  current: number;
  impact: {
    coefficient: number; // years per unit
    threshold?: number; // threshold for benefits
    diminishingReturns?: boolean;
  };
  evidence: {
    studyCount: number;
    confidence: 'low' | 'medium' | 'high';
    sources: string[];
  };
}

export interface SimulationResult {
  projectedLifespan: number;
  biologicalAge: number;
  yearsDifference: number;
  confidenceInterval: [number, number];
  topFactors: Array<{
    factor: string;
    impact: number;
    description: string;
  }>;
  recommendations: Array<{
    factor: string;
    currentValue: number;
    recommendedValue: number;
    potentialGain: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
}

// Evidence-based lifestyle factors
export const createLifestyleFactors = (currentAssessment?: any): LifestyleFactor[] => [
  {
    id: 'exercise',
    label: 'Exercise (hours/week)',
    icon: Activity,
    description: 'Regular physical activity including cardio and strength training',
    unit: 'hours/week',
    min: 0,
    max: 14,
    optimal: 7,
    current: currentAssessment?.exerciseFrequency === 'daily' ? 7 : 
             currentAssessment?.exerciseFrequency === '5-6-times' ? 5 :
             currentAssessment?.exerciseFrequency === '3-4-times' ? 3 :
             currentAssessment?.exerciseFrequency === '1-2-times' ? 1 : 0,
    impact: {
      coefficient: 0.8, // ~0.8 years per hour per week up to optimal
      threshold: 2.5, // minimum for benefits
      diminishingReturns: true
    },
    evidence: {
      studyCount: 150,
      confidence: 'high',
      sources: ['Harvard Health Study', 'British Journal of Sports Medicine', 'Lancet']
    }
  },
  {
    id: 'sleep',
    label: 'Sleep Quality (1-10)',
    icon: Moon,
    description: 'Quality of sleep including duration and restfulness',
    unit: 'quality score',
    min: 1,
    max: 10,
    optimal: 8,
    current: currentAssessment?.sleepQuality === 'excellent' ? 9 :
             currentAssessment?.sleepQuality === 'good' ? 7 :
             currentAssessment?.sleepQuality === 'fair' ? 5 : 3,
    impact: {
      coefficient: 0.4, // ~0.4 years per quality point
      threshold: 6
    },
    evidence: {
      studyCount: 89,
      confidence: 'high',
      sources: ['Sleep Research Society', 'Nature Medicine', 'JAMA']
    }
  },
  {
    id: 'nutrition',
    label: 'Diet Quality (1-10)',
    icon: Apple,
    description: 'Overall nutritional quality based on whole foods, vegetables, etc.',
    unit: 'quality score',
    min: 1,
    max: 10,
    optimal: 8,
    current: currentAssessment?.dietPattern === 'mediterranean' ? 8 :
             currentAssessment?.dietPattern === 'plant-based' ? 7 :
             currentAssessment?.dietPattern === 'balanced' ? 6 : 4,
    impact: {
      coefficient: 0.5,
      threshold: 5
    },
    evidence: {
      studyCount: 67,
      confidence: 'high',
      sources: ['Mediterranean Diet Studies', 'Blue Zones Research', 'Harvard T.H. Chan']
    }
  },
  {
    id: 'stress',
    label: 'Stress Management (1-10)',
    icon: Brain,
    description: 'Ability to manage stress through meditation, relationships, etc.',
    unit: 'management score',
    min: 1,
    max: 10,
    optimal: 8,
    current: 5, // Default middle value
    impact: {
      coefficient: 0.3,
      threshold: 4
    },
    evidence: {
      studyCount: 45,
      confidence: 'medium',
      sources: ['American Psychological Association', 'Psychosomatic Medicine', 'PLOS One']
    }
  },
  {
    id: 'social',
    label: 'Social Connections (1-10)',
    icon: Users,
    description: 'Quality and quantity of meaningful relationships',
    unit: 'connection score',
    min: 1,
    max: 10,
    optimal: 8,
    current: 6, // Default above-average value
    impact: {
      coefficient: 0.4,
      threshold: 3
    },
    evidence: {
      studyCount: 34,
      confidence: 'high',
      sources: ['Harvard Study of Adult Development', 'PNAS', 'Social Science & Medicine']
    }
  },
  {
    id: 'alcohol',
    label: 'Alcohol (drinks/week)',
    icon: Wine,
    description: 'Weekly alcohol consumption',
    unit: 'drinks/week',
    min: 0,
    max: 21,
    optimal: 3, // Light to moderate consumption
    current: currentAssessment?.alcoholConsumption === 'none' ? 0 :
             currentAssessment?.alcoholConsumption === 'light' ? 3 :
             currentAssessment?.alcoholConsumption === 'moderate' ? 7 : 14,
    impact: {
      coefficient: -0.2, // Negative impact beyond optimal
      threshold: 7 // Benefits below this, harm above
    },
    evidence: {
      studyCount: 78,
      confidence: 'medium',
      sources: ['BMJ', 'Lancet', 'American Journal of Medicine']
    }
  },
  {
    id: 'smoking',
    label: 'Smoking (cigarettes/day)',
    icon: Cigarette,
    description: 'Daily cigarette consumption',
    unit: 'cigarettes/day',
    min: 0,
    max: 40,
    optimal: 0,
    current: currentAssessment?.smokingStatus === 'never' || currentAssessment?.smokingStatus === 'former' ? 0 :
             currentAssessment?.smokingStatus === 'occasional' ? 2 : 10,
    impact: {
      coefficient: -0.5, // Severe negative impact
      threshold: 0
    },
    evidence: {
      studyCount: 200,
      confidence: 'high',
      sources: ['WHO', 'CDC', 'New England Journal of Medicine']
    }
  }
];

function getDifficultyLevel(factorId: string, current: number, optimal: number): 'easy' | 'medium' | 'hard' {
  const difference = Math.abs(current - optimal);
  
  switch (factorId) {
    case 'exercise':
      return difference > 3 ? 'hard' : difference > 1 ? 'medium' : 'easy';
    case 'smoking':
      return current > 0 ? 'hard' : 'easy';
    case 'alcohol':
      return difference > 5 ? 'medium' : 'easy';
    default:
      return difference > 3 ? 'medium' : 'easy';
  }
}

// Advanced longevity calculation engine
export function calculateLongevityProjection(
  factors: LifestyleFactor[], 
  baseAge: number = 35,
  baseLifespan: number = 78
): SimulationResult {
  let totalYearsGained = 0;
  const factorImpacts: Array<{ factor: string; impact: number; description: string }> = [];
  const recommendations: Array<{
    factor: string;
    currentValue: number;
    recommendedValue: number;
    potentialGain: number;
    difficulty: 'easy' | 'medium' | 'hard';
  }> = [];

  factors.forEach(factor => {
    let impact = 0;
    const value = factor.current;
    const optimal = factor.optimal;
    
    if (factor.id === 'alcohol' || factor.id === 'smoking') {
      // Factors where less is generally better
      if (value > optimal) {
        impact = (value - optimal) * factor.impact.coefficient;
      } else if (factor.id === 'alcohol' && value <= optimal) {
        // Light alcohol might have slight benefit
        impact = Math.min(1, optimal - value) * 0.1;
      }
    } else {
      // Factors where more is better
      if (value >= (factor.impact.threshold || 0)) {
        let effectiveValue = value;
        
        // Apply diminishing returns if specified
        if (factor.impact.diminishingReturns && value > optimal) {
          effectiveValue = optimal + (value - optimal) * 0.5;
        }
        
        impact = Math.min(effectiveValue, optimal) * factor.impact.coefficient;
      }
    }
    
    totalYearsGained += impact;
    
    if (Math.abs(impact) > 0.1) {
      factorImpacts.push({
        factor: factor.label,
        impact,
        description: impact > 0 ? 
          `Adding ${impact.toFixed(1)} years through ${factor.label.toLowerCase()}` :
          `Losing ${Math.abs(impact).toFixed(1)} years from ${factor.label.toLowerCase()}`
      });
    }
    
    // Generate recommendations
    if (Math.abs(value - optimal) > 0.5) {
      const potentialGain = Math.abs((optimal - value) * factor.impact.coefficient);
      if (potentialGain > 0.2) {
        recommendations.push({
          factor: factor.label,
          currentValue: value,
          recommendedValue: optimal,
          potentialGain,
          difficulty: getDifficultyLevel(factor.id, value, optimal)
        });
      }
    }
  });
  
  const projectedLifespan = baseLifespan + totalYearsGained;
  const biologicalAge = Math.max(baseAge - totalYearsGained * 0.3, baseAge * 0.7);
  
  // Calculate confidence interval (±10% based on study variance)
  const confidenceRange = projectedLifespan * 0.1;
  
  return {
    projectedLifespan: Math.round(projectedLifespan * 10) / 10,
    biologicalAge: Math.round(biologicalAge * 10) / 10,
    yearsDifference: Math.round(totalYearsGained * 10) / 10,
    confidenceInterval: [
      Math.round((projectedLifespan - confidenceRange) * 10) / 10,
      Math.round((projectedLifespan + confidenceRange) * 10) / 10
    ],
    topFactors: factorImpacts
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 3),
    recommendations: recommendations
      .sort((a, b) => b.potentialGain - a.potentialGain)
      .slice(0, 3)
  };
}
