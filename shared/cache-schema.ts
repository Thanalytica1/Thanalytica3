import { z } from "zod";

// Cache Collection Architecture - Three-tier data structure
// Tier 1: Raw data (existing collections)
// Tier 2: Processed metrics (aggregated data)
// Tier 3: Cached results (dashboard-ready data)

// Cache document structure for maximum read efficiency
export interface UserCache {
  id: string; // Same as userId
  userId: string;
  
  // Daily metrics cache (expires after 24 hours)
  dailyMetrics: {
    lastUpdated: string | Date;
    expiresAt: string | Date;
    data: {
      sleepScore: number;
      activityScore: number;
      nutritionScore: number;
      stressScore: number;
      overallScore: number;
      stepCount: number;
      activeMinutes: number;
      heartRateVariability?: number;
      recoveryScore?: number;
    };
  };
  
  // Weekly metrics cache (expires after 7 days)
  weeklyMetrics: {
    lastUpdated: string | Date;
    expiresAt: string | Date;
    data: {
      averageScores: {
        sleep: number;
        activity: number;
        nutrition: number;
        stress: number;
        overall: number;
      };
      trends: {
        sleepTrend: 'improving' | 'declining' | 'stable';
        activityTrend: 'improving' | 'declining' | 'stable';
        nutritionTrend: 'improving' | 'declining' | 'stable';
        stressTrend: 'improving' | 'declining' | 'stable';
      };
      weeklyGoals: {
        exerciseMinutes: { target: number; actual: number; achieved: boolean };
        sleepHours: { target: number; actual: number; achieved: boolean };
        stepsGoal: { target: number; actual: number; achieved: boolean };
      };
      topInsights: string[];
    };
  };
  
  // Monthly metrics cache (expires after 30 days)
  monthlyMetrics: {
    lastUpdated: string | Date;
    expiresAt: string | Date;
    data: {
      monthlyAverages: {
        sleep: number;
        activity: number;
        nutrition: number;
        stress: number;
        overall: number;
      };
      monthlyGoals: {
        weightTarget?: { target: number; actual: number; achieved: boolean };
        fitnessGoals: Array<{ name: string; target: number; actual: number; achieved: boolean }>;
      };
      correlationInsights: Array<{
        factor1: string;
        factor2: string;
        correlation: number;
        insight: string;
        significance: 'high' | 'medium' | 'low';
      }>;
      achievements: string[];
    };
  };
  
  // Lifetime metrics cache (never expires, updates incrementally)
  lifetimeMetrics: {
    lastUpdated: string | Date;
    data: {
      totalDaysTracked: number;
      longestStreaks: {
        exercise: number;
        meditation: number;
        healthyEating: number;
        qualitySleep: number;
      };
      personalBests: {
        maxSteps: { value: number; date: string };
        bestSleepScore: { value: number; date: string };
        longestWorkout: { value: number; date: string };
        bestHRV: { value: number; date: string };
      };
      biologicalAgeHistory: Array<{
        date: string;
        age: number;
        chronologicalAge: number;
        difference: number;
      }>;
      milestones: Array<{
        id: string;
        title: string;
        description: string;
        achievedAt: string;
        category: 'fitness' | 'nutrition' | 'sleep' | 'stress' | 'longevity';
      }>;
    };
  };
  
  // Dashboard display cache (expires after 1 hour for real-time feel)
  dashboardCache: {
    lastUpdated: string | Date;
    expiresAt: string | Date;
    data: {
      heroMetrics: {
        currentBiologicalAge: number;
        longevityScore: number;
        todayScore: number;
        weeklyAverage: number;
      };
      quickStats: {
        streakDays: number;
        goalsAchievedThisWeek: number;
        totalGoalsThisWeek: number;
        improvementAreas: string[];
      };
      recentAchievements: Array<{
        id: string;
        title: string;
        date: string;
        icon: string;
      }>;
      nextActions: Array<{
        id: string;
        title: string;
        description: string;
        priority: 'high' | 'medium' | 'low';
        estimatedImpact: number; // years gained
        timeRequired: string;
        category: string;
      }>;
      correlationHighlights: Array<{
        insight: string;
        correlation: number;
        actionable: boolean;
      }>;
    };
  };
  
  // Cache metadata
  cacheVersion: string; // For schema migrations
  totalSize: number; // Track document size
  createdAt: string | Date;
  updatedAt: string | Date;
}

export const userCacheSchema = z.object({
  userId: z.string(),
  dailyMetrics: z.object({
    lastUpdated: z.union([z.string(), z.date()]),
    expiresAt: z.union([z.string(), z.date()]),
    data: z.object({
      sleepScore: z.number(),
      activityScore: z.number(),
      nutritionScore: z.number(),
      stressScore: z.number(),
      overallScore: z.number(),
      stepCount: z.number(),
      activeMinutes: z.number(),
      heartRateVariability: z.number().optional(),
      recoveryScore: z.number().optional(),
    }),
  }),
  weeklyMetrics: z.object({
    lastUpdated: z.union([z.string(), z.date()]),
    expiresAt: z.union([z.string(), z.date()]),
    data: z.object({
      averageScores: z.object({
        sleep: z.number(),
        activity: z.number(),
        nutrition: z.number(),
        stress: z.number(),
        overall: z.number(),
      }),
      trends: z.object({
        sleepTrend: z.enum(['improving', 'declining', 'stable']),
        activityTrend: z.enum(['improving', 'declining', 'stable']),
        nutritionTrend: z.enum(['improving', 'declining', 'stable']),
        stressTrend: z.enum(['improving', 'declining', 'stable']),
      }),
      weeklyGoals: z.object({
        exerciseMinutes: z.object({
          target: z.number(),
          actual: z.number(),
          achieved: z.boolean(),
        }),
        sleepHours: z.object({
          target: z.number(),
          actual: z.number(),
          achieved: z.boolean(),
        }),
        stepsGoal: z.object({
          target: z.number(),
          actual: z.number(),
          achieved: z.boolean(),
        }),
      }),
      topInsights: z.array(z.string()),
    }),
  }),
  monthlyMetrics: z.object({
    lastUpdated: z.union([z.string(), z.date()]),
    expiresAt: z.union([z.string(), z.date()]),
    data: z.object({
      monthlyAverages: z.object({
        sleep: z.number(),
        activity: z.number(),
        nutrition: z.number(),
        stress: z.number(),
        overall: z.number(),
      }),
      monthlyGoals: z.object({
        weightTarget: z.object({
          target: z.number(),
          actual: z.number(),
          achieved: z.boolean(),
        }).optional(),
        fitnessGoals: z.array(z.object({
          name: z.string(),
          target: z.number(),
          actual: z.number(),
          achieved: z.boolean(),
        })),
      }),
      correlationInsights: z.array(z.object({
        factor1: z.string(),
        factor2: z.string(),
        correlation: z.number(),
        insight: z.string(),
        significance: z.enum(['high', 'medium', 'low']),
      })),
      achievements: z.array(z.string()),
    }),
  }),
  lifetimeMetrics: z.object({
    lastUpdated: z.union([z.string(), z.date()]),
    data: z.object({
      totalDaysTracked: z.number(),
      longestStreaks: z.object({
        exercise: z.number(),
        meditation: z.number(),
        healthyEating: z.number(),
        qualitySleep: z.number(),
      }),
      personalBests: z.object({
        maxSteps: z.object({
          value: z.number(),
          date: z.string(),
        }),
        bestSleepScore: z.object({
          value: z.number(),
          date: z.string(),
        }),
        longestWorkout: z.object({
          value: z.number(),
          date: z.string(),
        }),
        bestHRV: z.object({
          value: z.number(),
          date: z.string(),
        }),
      }),
      biologicalAgeHistory: z.array(z.object({
        date: z.string(),
        age: z.number(),
        chronologicalAge: z.number(),
        difference: z.number(),
      })),
      milestones: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        achievedAt: z.string(),
        category: z.enum(['fitness', 'nutrition', 'sleep', 'stress', 'longevity']),
      })),
    }),
  }),
  dashboardCache: z.object({
    lastUpdated: z.union([z.string(), z.date()]),
    expiresAt: z.union([z.string(), z.date()]),
    data: z.object({
      heroMetrics: z.object({
        currentBiologicalAge: z.number(),
        longevityScore: z.number(),
        todayScore: z.number(),
        weeklyAverage: z.number(),
      }),
      quickStats: z.object({
        streakDays: z.number(),
        goalsAchievedThisWeek: z.number(),
        totalGoalsThisWeek: z.number(),
        improvementAreas: z.array(z.string()),
      }),
      recentAchievements: z.array(z.object({
        id: z.string(),
        title: z.string(),
        date: z.string(),
        icon: z.string(),
      })),
      nextActions: z.array(z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        priority: z.enum(['high', 'medium', 'low']),
        estimatedImpact: z.number(),
        timeRequired: z.string(),
        category: z.string(),
      })),
      correlationHighlights: z.array(z.object({
        insight: z.string(),
        correlation: z.number(),
        actionable: z.boolean(),
      })),
    }),
  }),
  cacheVersion: z.string(),
  totalSize: z.number(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});

export type InsertUserCache = z.infer<typeof userCacheSchema>;

// Cache invalidation configuration
export const CACHE_TTL = {
  DASHBOARD: 60 * 60 * 1000, // 1 hour
  DAILY: 24 * 60 * 60 * 1000, // 24 hours  
  WEEKLY: 7 * 24 * 60 * 60 * 1000, // 7 days
  MONTHLY: 30 * 24 * 60 * 60 * 1000, // 30 days
  LIFETIME: Infinity, // Never expires
} as const;

// Cache size limits (Firestore has 1MB document limit)
export const CACHE_LIMITS = {
  MAX_DOCUMENT_SIZE: 900 * 1024, // 900KB (leave buffer)
  MAX_INSIGHTS_PER_SECTION: 10,
  MAX_ACHIEVEMENTS_CACHE: 20,
  MAX_CORRELATION_INSIGHTS: 15,
  MAX_MILESTONE_CACHE: 50,
} as const;
