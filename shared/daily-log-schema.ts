// Daily Log Schema and Types for Thanalytica
import { z } from 'zod';

// Sleep metrics
export const sleepSchema = z.object({
  timeInBed: z.number().min(0).max(1440).optional(), // minutes
  timeAsleep: z.number().min(0).max(1440).optional(), // minutes
  quality: z.number().min(1).max(10).optional(),
  wakeTime: z.string().optional(), // HH:MM format
}).optional();

// Exercise metrics
export const exerciseSchema = z.object({
  minutes: z.number().min(0).max(480).optional(),
  intensity: z.enum(['low', 'medium', 'high']).optional(),
  steps: z.number().min(0).optional(),
}).optional();

// Nutrition metrics
export const nutritionSchema = z.object({
  meals: z.number().min(0).max(10).optional(),
  hydrationOz: z.number().min(0).optional(),
  alcoholDrinks: z.number().min(0).optional(),
}).optional();

// Recovery metrics
export const recoverySchema = z.object({
  rpe: z.number().min(1).max(10).optional(), // Rate of Perceived Exertion
  soreness: z.number().min(1).max(5).optional(),
  restingHr: z.number().min(30).max(200).optional(), // bpm
  hrv: z.number().min(0).max(200).optional(), // ms
}).optional();

// Mindset metrics
export const mindsetSchema = z.object({
  mood: z.number().min(1).max(5).optional(),
  stress: z.number().min(1).max(5).optional(),
}).optional();

// Custom habits
export const habitsSchema = z.record(z.string(), z.boolean()).optional();

// Complete daily log schema
export const dailyLogSchema = z.object({
  id: z.string(), // YYYY-MM-DD format
  userId: z.string(),
  date: z.string(), // ISO date string
  sleep: sleepSchema,
  exercise: exerciseSchema,
  nutrition: nutritionSchema,
  recovery: recoverySchema,
  mindset: mindsetSchema,
  habits: habitsSchema,
  notes: z.string().max(200).optional(),
  completed: z.boolean().default(false),
  source: z.enum(['manual', 'wearable', 'mixed']).default('manual'),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  syncStatus: z.enum(['synced', 'pending', 'error']).default('synced').optional(),
  offlineChanges: z.array(z.any()).optional(), // For conflict resolution
});

export type DailyLog = z.infer<typeof dailyLogSchema>;
export type SleepMetrics = z.infer<typeof sleepSchema>;
export type ExerciseMetrics = z.infer<typeof exerciseSchema>;
export type NutritionMetrics = z.infer<typeof nutritionSchema>;
export type RecoveryMetrics = z.infer<typeof recoverySchema>;
export type MindsetMetrics = z.infer<typeof mindsetSchema>;
export type Habits = z.infer<typeof habitsSchema>;

// User settings for daily logs
export const dailyLogSettingsSchema = z.object({
  visibleFields: z.object({
    sleep: z.boolean().default(true),
    exercise: z.boolean().default(true),
    nutrition: z.boolean().default(true),
    recovery: z.boolean().default(true),
    mindset: z.boolean().default(true),
    habits: z.boolean().default(true),
    notes: z.boolean().default(true),
  }).optional(),
  habitDefinitions: z.array(z.object({
    key: z.string(),
    label: z.string(),
    icon: z.string().optional(),
    category: z.enum(['health', 'fitness', 'nutrition', 'mindfulness', 'other']).optional(),
  })).optional(),
  units: z.object({
    hydration: z.enum(['oz', 'ml', 'cups']).default('oz'),
    distance: z.enum(['miles', 'km']).default('miles'),
    weight: z.enum(['lbs', 'kg']).default('lbs'),
  }).optional(),
  defaultValues: z.object({
    copyFromYesterday: z.boolean().default(false),
    presetValues: dailyLogSchema.partial().optional(),
  }).optional(),
});

export type DailyLogSettings = z.infer<typeof dailyLogSettingsSchema>;

// Helper functions
export function getTodayLogId(): string {
  const today = new Date();
  return formatDateId(today);
}

export function formatDateId(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLogId(logId: string): Date {
  const [year, month, day] = logId.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Calculate streaks
export function calculateStreak(logs: DailyLog[]): number {
  if (!logs.length) return 0;
  
  // Sort logs by date in descending order
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sortedLogs.length; i++) {
    const logDate = new Date(sortedLogs[i].date);
    logDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    
    if (logDate.getTime() === expectedDate.getTime() && sortedLogs[i].completed) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// Calculate habit-specific streaks
export function calculateHabitStreak(logs: DailyLog[], habitKey: string): number {
  if (!logs.length) return 0;
  
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sortedLogs.length; i++) {
    const logDate = new Date(sortedLogs[i].date);
    logDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    
    if (logDate.getTime() === expectedDate.getTime() && 
        sortedLogs[i].habits?.[habitKey] === true) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// Calculate weekly averages
export function calculateWeeklyAverages(logs: DailyLog[]) {
  const thisWeek = logs.filter(log => {
    const logDate = new Date(log.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logDate >= weekAgo;
  });
  
  const lastWeek = logs.filter(log => {
    const logDate = new Date(log.date);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logDate >= twoWeeksAgo && logDate < weekAgo;
  });
  
  const calculateAvg = (logs: DailyLog[], getter: (log: DailyLog) => number | undefined) => {
    const values = logs.map(getter).filter((v): v is number => v !== undefined);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  };
  
  return {
    thisWeek: {
      sleep: calculateAvg(thisWeek, l => l.sleep?.timeAsleep),
      exercise: calculateAvg(thisWeek, l => l.exercise?.minutes),
      mood: calculateAvg(thisWeek, l => l.mindset?.mood),
      stress: calculateAvg(thisWeek, l => l.mindset?.stress),
    },
    lastWeek: {
      sleep: calculateAvg(lastWeek, l => l.sleep?.timeAsleep),
      exercise: calculateAvg(lastWeek, l => l.exercise?.minutes),
      mood: calculateAvg(lastWeek, l => l.mindset?.mood),
      stress: calculateAvg(lastWeek, l => l.mindset?.stress),
    },
  };
}

// Generate insights based on patterns
export function generateInsights(logs: DailyLog[]): string[] {
  const insights: string[] = [];
  const recentLogs = logs.slice(-7); // Last 7 days
  
  // Sleep insights
  const avgSleep = recentLogs
    .map(l => l.sleep?.timeAsleep)
    .filter((v): v is number => v !== undefined)
    .reduce((a, b, _, arr) => a + b / arr.length, 0);
    
  if (avgSleep < 360) { // Less than 6 hours
    insights.push('Your average sleep is below 6 hours. Consider an earlier bedtime routine.');
  }
  
  // Stress-sleep correlation
  const highStressDays = recentLogs.filter(l => (l.mindset?.stress || 0) >= 4);
  const poorSleepAfterStress = highStressDays.filter(l => (l.sleep?.quality || 10) < 6);
  
  if (poorSleepAfterStress.length >= 2) {
    insights.push('High stress appears to be affecting your sleep quality. Try relaxation techniques before bed.');
  }
  
  // Exercise consistency
  const exerciseDays = recentLogs.filter(l => (l.exercise?.minutes || 0) > 0).length;
  if (exerciseDays < 3) {
    insights.push('You exercised less than 3 times this week. Aim for at least 150 minutes weekly.');
  }
  
  return insights;
}