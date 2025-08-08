import { z } from "zod";

// Firestore-compatible data models and Zod schemas

// Users
export interface User {
  id: string;
  uid?: string; // for compatibility with places expecting Firebase user uid
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  firebaseUid: string;
  referralCode?: string;
  referredById?: string | null;
  createdAt: string | Date; // allow Date for compatibility
}

export const insertUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().optional().nullable(),
  photoURL: z.string().url().optional().nullable(),
  firebaseUid: z.string().min(1),
  referredById: z.string().optional().nullable(),
});
export type InsertUser = z.infer<typeof insertUserSchema>;

// Health Assessments
export interface HealthAssessment {
  id: string;
  userId: string;
  age: number;
  gender: string;
  height?: number | null;
  weight?: number | null;
  sleepDuration: string;
  sleepQuality: string;
  dietPattern: string;
  alcoholConsumption: string;
  smokingStatus: string;
  exerciseFrequency: string;
  exerciseTypes: string[];
  exerciseIntensity: string;
  chronicConditions?: string[];
  medications?: string[];
  familyHistory?: string[];
  longevityGoals: string;
  healthPriorities: string[];
  biologicalAge?: number | null;
  vitalityScore?: number | null;
  riskAssessment?: string | null;
  trajectoryRating?: string | null;
  completedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export const insertHealthAssessmentSchema = z.object({
  age: z.number().int().nonnegative(),
  gender: z.string(),
  height: z.number().int().positive().optional(),
  weight: z.number().positive().optional(),
  sleepDuration: z.string(),
  sleepQuality: z.string(),
  dietPattern: z.string(),
  alcoholConsumption: z.string(),
  smokingStatus: z.string(),
  exerciseFrequency: z.string(),
  exerciseTypes: z.array(z.string()),
  exerciseIntensity: z.string(),
  chronicConditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  familyHistory: z.array(z.string()).optional(),
  longevityGoals: z.string(),
  healthPriorities: z.array(z.string()),
});
export type InsertHealthAssessment = z.infer<typeof insertHealthAssessmentSchema>;

// Health Metrics
export interface HealthMetrics {
  id: string;
  userId: string;
  assessmentId?: string | null;
  sleepScore?: number | null;
  exerciseScore?: number | null;
  nutritionScore?: number | null;
  stressScore?: number | null;
  cognitiveScore?: number | null;
  cardiovascularRisk?: string | null;
  metabolicRisk?: string | null;
  cognitiveRisk?: string | null;
  projectedLifespan?: number | null;
  optimizationPotential?: number | null;
  createdAt: string | Date;
}

export const insertHealthMetricsSchema = z.object({
  userId: z.string().min(1).optional(), // set by server in some flows
  assessmentId: z.string().optional(),
  sleepScore: z.number().int().min(0).max(100).optional(),
  exerciseScore: z.number().int().min(0).max(100).optional(),
  nutritionScore: z.number().int().min(0).max(100).optional(),
  stressScore: z.number().int().min(0).max(100).optional(),
  cognitiveScore: z.number().int().min(0).max(100).optional(),
  cardiovascularRisk: z.string().optional(),
  metabolicRisk: z.string().optional(),
  cognitiveRisk: z.string().optional(),
  projectedLifespan: z.number().int().positive().optional(),
  optimizationPotential: z.number().int().min(0).optional(),
});
export type InsertHealthMetrics = z.infer<typeof insertHealthMetricsSchema>;

// Recommendations
export interface Recommendation {
  id: string;
  userId: string;
  assessmentId: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  actionItems: string[];
  estimatedImpact?: number | null;
  implemented?: boolean;
  implementedAt?: string | Date | null;
  createdAt: string | Date;
}

export const insertRecommendationSchema = z.object({
  userId: z.string().min(1).optional(),
  assessmentId: z.string().min(1),
  category: z.string().min(1),
  priority: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  actionItems: z.array(z.string()),
  estimatedImpact: z.number().positive().optional(),
});
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;

// Wearable device connections and data
export interface WearableConnection {
  id: string;
  userId: string;
  deviceType: string; // 'garmin', 'whoop', 'oura', 'apple_health'
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenSecret?: string | null; // For OAuth 1.0a (Garmin)
  isActive: boolean;
  lastSyncAt?: string | Date | null;
  expiresAt?: string | Date | null;
  createdAt: string | Date;
}

export const insertWearableConnectionSchema = z.object({
  userId: z.string().min(1),
  deviceType: z.string().min(1),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenSecret: z.string().optional(),
  isActive: z.boolean().optional(),
  lastSyncAt: z.string().optional(),
  expiresAt: z.string().optional(),
});
export type InsertWearableConnection = z.infer<typeof insertWearableConnectionSchema>;

export interface WearablesData {
  id: string;
  userId: string;
  device: string; // 'garmin', 'whoop'
  date: string; // ISO date
  dataJson: Record<string, any>;
  syncedAt: string | Date;
  createdAt: string | Date;
}

export const insertWearablesDataSchema = z.object({
  userId: z.string().min(1),
  device: z.string().min(1),
  date: z.string().min(1),
  dataJson: z.record(z.any()),
});
export type InsertWearablesData = z.infer<typeof insertWearablesDataSchema>;

// Advanced Health Models and AI Schema
export interface HealthModel {
  id: string;
  userId: string;
  modelVersion: string;
  inputFeatures: Record<string, any>;
  predictions: HealthModelPredictions;
  confidence: number; // 0-1
  createdAt: string | Date;
  updatedAt: string | Date;
}

export const insertHealthModelSchema = z.object({
  userId: z.string().min(1),
  modelVersion: z.string().min(1),
  inputFeatures: z.record(z.any()),
  predictions: z.object({
    biologicalAge: z.number(),
    diseaseRisks: z.record(z.number()),
    interventionImpact: z.record(z.number()),
    lifeExpectancy: z.number(),
    optimalInterventions: z.array(z.string()),
  }),
  confidence: z.number().min(0).max(1),
});
export type InsertHealthModel = z.infer<typeof insertHealthModelSchema>;

export interface HealthInsight {
  id: string;
  userId: string;
  type: string; // 'symptom_analysis', 'trend_prediction', 'intervention_suggestion'
  query: string;
  response: string;
  confidence: number;
  sources?: string[];
  createdAt: string | Date;
}

export const insertHealthInsightSchema = z.object({
  userId: z.string().min(1),
  type: z.string().min(1),
  query: z.string().min(1),
  response: z.string().min(1),
  confidence: z.number().min(0).max(1),
  sources: z.array(z.string()).optional(),
});
export type InsertHealthInsight = z.infer<typeof insertHealthInsightSchema>;

export interface HealthTrend {
  id: string;
  userId: string;
  metricType: string; // 'biological_age', 'vitality_score', etc.
  date: string; // ISO date
  value: number;
  trend: string; // 'improving', 'stable', 'declining'
  dataSource: string; // 'assessment', 'wearable', 'manual'
  createdAt: string | Date;
}

export const insertHealthTrendSchema = z.object({
  userId: z.string().min(1),
  metricType: z.string().min(1),
  date: z.string().min(1),
  value: z.number(),
  trend: z.string().min(1),
  dataSource: z.string().min(1),
});
export type InsertHealthTrend = z.infer<typeof insertHealthTrendSchema>;

// Analytics Events
export interface AnalyticsEvent {
  id: string;
  userId?: string | null;
  sessionId: string;
  eventName: string;
  eventCategory: string;
  eventData?: Record<string, any>;
  userAgent?: string;
  referrer?: string;
  pathname: string;
  timestamp: string | Date;
}

export const insertAnalyticsEventSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().min(1),
  eventName: z.string().min(1),
  eventCategory: z.string().min(1),
  eventData: z.record(z.any()).optional(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
  pathname: z.string().min(1),
});
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

// Referral System
export interface Referral {
  id: string;
  referrerUserId: string;
  referredUserId?: string | null;
  referralCode: string;
  email?: string | null;
  status: string; // pending, signed_up, converted
  shareMethod?: string | null; // email, link, social
  clickedAt?: string | null;
  signedUpAt?: string | null;
  convertedAt?: string | null;
  rewardGranted?: boolean;
  createdAt: string | Date;
}

export const insertReferralSchema = z.object({
  referrerUserId: z.string().min(1),
  referredUserId: z.string().optional(),
  referralCode: z.string().min(4).max(10),
  email: z.string().email().optional(),
  status: z.string().min(1).default("pending"),
  shareMethod: z.string().optional(),
});
export type InsertReferral = z.infer<typeof insertReferralSchema>;

// Advanced Health Interfaces
export interface HealthModelPredictions {
  biologicalAge: number;
  diseaseRisks: Record<string, number>;
  interventionImpact: Record<string, number>;
  lifeExpectancy: number;
  optimalInterventions: string[];
}

export interface HealthAICapabilities {
  analyzeSymptoms: (symptoms: string[]) => Promise<HealthInsight>;
  suggestInterventions: (goals: string[]) => Promise<Recommendation[]>;
  answerQuestions: (question: string) => Promise<string>;
  predictTrends: (historicalData: HealthTrend[]) => Promise<HealthTrend[]>;
}

export interface ReferralProgram {
  shareableLink: string;
  rewardForReferrer: "Premium features for 1 month";
  rewardForReferred: "Detailed longevity report";
  trackingMetrics: ["shares", "signups", "conversions"];
}
