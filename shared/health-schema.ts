import { z } from "zod";

// Optimal Firebase structure for Thanalytica health app
// Following hierarchical user-centric design for health data

// Core User Profile
export interface UserProfile {
  id: string;
  firebaseUid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  dateOfBirth?: string | null;
  timeZone: string;
  preferences: UserPreferences;
  privacy: PrivacySettings;
  referralCode?: string;
  referredById?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface UserPreferences {
  units: 'metric' | 'imperial';
  notifications: NotificationSettings;
  goals: string[];
  primaryFocus: 'longevity' | 'fitness' | 'wellness' | 'prevention';
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  healthReminders: boolean;
  weeklyReports: boolean;
  goalMilestones: boolean;
}

export interface PrivacySettings {
  dataSharing: boolean;
  anonymousAnalytics: boolean;
  researchParticipation: boolean;
}

// Health Metrics - Subcollection under users/{userId}/healthMetrics/{metricId}
export interface HealthMetric {
  id: string;
  userId: string;
  type: HealthMetricType;
  value: number;
  unit: string;
  source: DataSource;
  deviceId?: string;
  notes?: string;
  tags?: string[];
  recordedAt: string | Date;
  createdAt: string | Date;
}

export type HealthMetricType = 
  | 'weight' | 'bmi' | 'body_fat' | 'muscle_mass'
  | 'systolic_bp' | 'diastolic_bp' | 'resting_hr' | 'hrv'
  | 'vo2_max' | 'sleep_hours' | 'sleep_quality' | 'steps'
  | 'stress_level' | 'mood' | 'energy_level' | 'pain_level';

export type DataSource = 'manual' | 'wearable' | 'assessment' | 'lab_test' | 'provider';

// Health Metric Readings - Subcollection under healthMetrics/{metricId}/readings/{readingId}
export interface HealthMetricReading {
  id: string;
  metricId: string;
  userId: string;
  value: number;
  context?: ReadingContext;
  quality: 'high' | 'medium' | 'low';
  recordedAt: string | Date;
  createdAt: string | Date;
}

export interface ReadingContext {
  activity?: string;
  mood?: string;
  stress?: string;
  environmental?: Record<string, any>;
}

// Assessments - Subcollection under users/{userId}/assessments/{assessmentId}
export interface HealthAssessment {
  id: string;
  userId: string;
  type: AssessmentType;
  version: string;
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  startedAt: string | Date;
  completedAt?: string | Date;
  scores: AssessmentScores;
  insights: AssessmentInsights;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type AssessmentType = 'comprehensive' | 'quick' | 'focused' | 'follow_up';

export interface AssessmentScores {
  overall: number;
  categories: Record<string, number>;
  biologicalAge?: number;
  vitalityScore?: number;
  longevityIndex?: number;
}

export interface AssessmentInsights {
  strengths: string[];
  improvements: string[];
  risks: HealthRisk[];
  recommendations: string[];
}

export interface HealthRisk {
  type: string;
  level: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  timeframe: string;
}

// Assessment Responses - Subcollection under assessments/{assessmentId}/responses/{questionId}
export interface AssessmentResponse {
  id: string;
  assessmentId: string;
  userId: string;
  questionId: string;
  questionType: 'multiple_choice' | 'scale' | 'text' | 'numeric';
  response: any;
  confidence?: number;
  answeredAt: string | Date;
}

// Goals - Subcollection under users/{userId}/goals/{goalId}
export interface HealthGoal {
  id: string;
  userId: string;
  category: GoalCategory;
  type: 'increase' | 'decrease' | 'maintain' | 'achieve';
  title: string;
  description: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  targetDate: string | Date;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  milestones: GoalMilestone[];
  reminders: GoalReminder[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type GoalCategory = 
  | 'weight_management' | 'fitness' | 'sleep' | 'nutrition' 
  | 'stress' | 'longevity' | 'preventive_care' | 'mental_health';

export interface GoalMilestone {
  id: string;
  title: string;
  targetValue: number;
  achievedAt?: string | Date;
  reward?: string;
}

export interface GoalReminder {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  frequency: number;
  enabled: boolean;
  lastSent?: string | Date;
}

// Activities - Subcollection under users/{userId}/activities/{activityId}
export interface HealthActivity {
  id: string;
  userId: string;
  type: ActivityType;
  title: string;
  duration?: number; // minutes
  intensity?: 'low' | 'moderate' | 'high' | 'vigorous';
  calories?: number;
  notes?: string;
  location?: string;
  weather?: WeatherConditions;
  performedAt: string | Date;
  createdAt: string | Date;
}

export type ActivityType = 
  | 'cardio' | 'strength' | 'flexibility' | 'balance' | 'sports'
  | 'meditation' | 'breathwork' | 'yoga' | 'walking' | 'running'
  | 'cycling' | 'swimming' | 'other';

export interface WeatherConditions {
  temperature?: number;
  humidity?: number;
  conditions?: string;
}

// Reports - Subcollection under users/{userId}/reports/{reportId}
export interface HealthReport {
  id: string;
  userId: string;
  type: ReportType;
  period: ReportPeriod;
  startDate: string | Date;
  endDate: string | Date;
  status: 'generating' | 'ready' | 'error';
  data: ReportData;
  insights: string[];
  recommendations: string[];
  generatedAt: string | Date;
  expiresAt?: string | Date;
}

export type ReportType = 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom';
export type ReportPeriod = '7d' | '30d' | '90d' | '365d' | 'custom';

export interface ReportData {
  summary: ReportSummary;
  trends: TrendData[];
  achievements: Achievement[];
  alerts: HealthAlert[];
}

export interface ReportSummary {
  totalMetrics: number;
  improvementAreas: number;
  goalsProgress: number;
  overallScore: number;
}

export interface TrendData {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  change: number;
  significance: 'low' | 'medium' | 'high';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  earnedAt: string | Date;
  badge?: string;
}

export interface HealthAlert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  actionRequired: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string | Date;
}

// Wearable Integrations - Subcollection under users/{userId}/wearables/{deviceId}
export interface WearableDevice {
  id: string;
  userId: string;
  provider: WearableProvider;
  deviceModel: string;
  nickname?: string;
  isActive: boolean;
  permissions: WearablePermissions;
  lastSyncAt?: string | Date;
  batteryLevel?: number;
  firmwareVersion?: string;
  connectedAt: string | Date;
  updatedAt: string | Date;
}

export type WearableProvider = 
  | 'apple_health' | 'google_fit' | 'garmin' | 'fitbit' 
  | 'oura' | 'whoop' | 'polar' | 'suunto' | 'amazfit';

export interface WearablePermissions {
  heartRate: boolean;
  sleep: boolean;
  activity: boolean;
  location: boolean;
  stress: boolean;
  temperature: boolean;
}

// Wearable Data - Subcollection under wearables/{deviceId}/data/{dataId}
export interface WearableData {
  id: string;
  deviceId: string;
  userId: string;
  dataType: WearableDataType;
  rawData: Record<string, any>;
  processedMetrics: ProcessedMetrics;
  quality: DataQuality;
  syncedAt: string | Date;
  recordedAt: string | Date;
}

export type WearableDataType = 
  | 'heart_rate' | 'sleep' | 'activity' | 'stress' | 'hrv'
  | 'steps' | 'calories' | 'temperature' | 'oxygen_saturation';

export interface ProcessedMetrics {
  [key: string]: number | string | boolean;
}

export interface DataQuality {
  accuracy: number; // 0-1
  completeness: number; // 0-1
  reliability: 'low' | 'medium' | 'high';
  issues?: string[];
}

// Zod validation schemas
export const userProfileSchema = z.object({
  firebaseUid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().optional().nullable(),
  photoURL: z.string().url().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  timeZone: z.string().default('UTC'),
  preferences: z.object({
    units: z.enum(['metric', 'imperial']).default('metric'),
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(true),
      healthReminders: z.boolean().default(true),
      weeklyReports: z.boolean().default(true),
      goalMilestones: z.boolean().default(true),
    }),
    goals: z.array(z.string()).default([]),
    primaryFocus: z.enum(['longevity', 'fitness', 'wellness', 'prevention']).default('longevity'),
  }),
  privacy: z.object({
    dataSharing: z.boolean().default(false),
    anonymousAnalytics: z.boolean().default(true),
    researchParticipation: z.boolean().default(false),
  }),
  referralCode: z.string().optional(),
  referredById: z.string().optional(),
});

export const healthMetricSchema = z.object({
  userId: z.string().min(1),
  type: z.enum([
    'weight', 'bmi', 'body_fat', 'muscle_mass',
    'systolic_bp', 'diastolic_bp', 'resting_hr', 'hrv',
    'vo2_max', 'sleep_hours', 'sleep_quality', 'steps',
    'stress_level', 'mood', 'energy_level', 'pain_level'
  ]),
  value: z.number(),
  unit: z.string(),
  source: z.enum(['manual', 'wearable', 'assessment', 'lab_test', 'provider']),
  deviceId: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  recordedAt: z.string(),
});

export const healthGoalSchema = z.object({
  userId: z.string().min(1),
  category: z.enum([
    'weight_management', 'fitness', 'sleep', 'nutrition',
    'stress', 'longevity', 'preventive_care', 'mental_health'
  ]),
  type: z.enum(['increase', 'decrease', 'maintain', 'achieve']),
  title: z.string().min(1),
  description: z.string(),
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  unit: z.string().optional(),
  targetDate: z.string(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).default('active'),
});

export const wearableDeviceSchema = z.object({
  userId: z.string().min(1),
  provider: z.enum([
    'apple_health', 'google_fit', 'garmin', 'fitbit',
    'oura', 'whoop', 'polar', 'suunto', 'amazfit'
  ]),
  deviceModel: z.string(),
  nickname: z.string().optional(),
  isActive: z.boolean().default(true),
  permissions: z.object({
    heartRate: z.boolean().default(false),
    sleep: z.boolean().default(false),
    activity: z.boolean().default(false),
    location: z.boolean().default(false),
    stress: z.boolean().default(false),
    temperature: z.boolean().default(false),
  }),
});

// Export types for use in other modules
export type InsertUserProfile = z.infer<typeof userProfileSchema>;
export type InsertHealthMetric = z.infer<typeof healthMetricSchema>;
export type InsertHealthGoal = z.infer<typeof healthGoalSchema>;
export type InsertWearableDevice = z.infer<typeof wearableDeviceSchema>;