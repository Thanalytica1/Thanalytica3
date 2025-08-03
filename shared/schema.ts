import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "nanoid";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  firebaseUid: text("firebase_uid").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const healthAssessments = pgTable("health_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  
  // Basic Info
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  height: integer("height"), // in cm
  weight: real("weight"), // in kg
  
  // Lifestyle
  sleepDuration: text("sleep_duration").notNull(),
  sleepQuality: text("sleep_quality").notNull(),
  dietPattern: text("diet_pattern").notNull(),
  alcoholConsumption: text("alcohol_consumption").notNull(),
  smokingStatus: text("smoking_status").notNull(),
  
  // Exercise
  exerciseFrequency: text("exercise_frequency").notNull(),
  exerciseTypes: text("exercise_types").array().notNull(),
  exerciseIntensity: text("exercise_intensity").notNull(),
  
  // Medical History
  chronicConditions: text("chronic_conditions").array(),
  medications: text("medications").array(),
  familyHistory: text("family_history").array(),
  
  // Goals and Vision
  longevityGoals: text("longevity_goals").notNull(),
  healthPriorities: text("health_priorities").array().notNull(),
  
  // Analysis Results
  biologicalAge: real("biological_age"),
  vitalityScore: integer("vitality_score"),
  riskAssessment: text("risk_assessment"),
  trajectoryRating: text("trajectory_rating"),
  
  // Metadata
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const healthMetrics = pgTable("health_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  assessmentId: varchar("assessment_id").references(() => healthAssessments.id),
  
  // Individual Health Factors
  sleepScore: integer("sleep_score"),
  exerciseScore: integer("exercise_score"),
  nutritionScore: integer("nutrition_score"),
  stressScore: integer("stress_score"),
  cognitiveScore: integer("cognitive_score"),
  
  // Risk Factors
  cardiovascularRisk: text("cardiovascular_risk"),
  metabolicRisk: text("metabolic_risk"),
  cognitiveRisk: text("cognitive_risk"),
  
  // Projections
  projectedLifespan: integer("projected_lifespan"),
  optimizationPotential: integer("optimization_potential"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recommendations = pgTable("recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  assessmentId: varchar("assessment_id").notNull().references(() => healthAssessments.id),
  
  category: text("category").notNull(), // exercise, nutrition, sleep, stress, etc.
  priority: text("priority").notNull(), // high, medium, low
  title: text("title").notNull(),
  description: text("description").notNull(),
  actionItems: text("action_items").array().notNull(),
  estimatedImpact: real("estimated_impact"), // years added to lifespan
  
  implemented: boolean("implemented").default(false),
  implementedAt: timestamp("implemented_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertHealthAssessmentSchema = createInsertSchema(healthAssessments).omit({
  id: true,
  userId: true,
  biologicalAge: true,
  vitalityScore: true,
  riskAssessment: true,
  trajectoryRating: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHealthMetricsSchema = createInsertSchema(healthMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertRecommendationSchema = createInsertSchema(recommendations).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type HealthAssessment = typeof healthAssessments.$inferSelect;
export type InsertHealthAssessment = z.infer<typeof insertHealthAssessmentSchema>;
export type HealthMetrics = typeof healthMetrics.$inferSelect;
export type InsertHealthMetrics = z.infer<typeof insertHealthMetricsSchema>;
export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;

// Wearable device connections and data
export const wearableConnections = pgTable("wearable_connections", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => nanoid()),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  deviceType: varchar("device_type", { length: 50 }).notNull(), // 'oura', 'apple_health'
  accessToken: text("access_token"), // encrypted token for API access
  refreshToken: text("refresh_token"), // for token refresh
  isActive: boolean("is_active").default(true).notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wearableData = pgTable("wearable_data", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => nanoid()),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  connectionId: varchar("connection_id", { length: 255 }).notNull().references(() => wearableConnections.id),
  dataType: varchar("data_type", { length: 50 }).notNull(), // 'sleep', 'activity', 'heart_rate', 'hrv'
  date: date("date").notNull(),
  metrics: jsonb("metrics").notNull(), // flexible JSON structure for different data types
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Wearable schemas
export const insertWearableConnectionSchema = createInsertSchema(wearableConnections).omit({
  id: true,
  createdAt: true,
});

export const insertWearableDataSchema = createInsertSchema(wearableData).omit({
  id: true,
  createdAt: true,
});

// Wearable types
export type WearableConnection = typeof wearableConnections.$inferSelect;
export type InsertWearableConnection = z.infer<typeof insertWearableConnectionSchema>;
export type WearableData = typeof wearableData.$inferSelect;
export type InsertWearableData = z.infer<typeof insertWearableDataSchema>;

// Advanced Health Models and AI Schema
export const healthModels = pgTable("health_models", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => nanoid()),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  modelVersion: varchar("model_version", { length: 50 }).notNull(),
  inputFeatures: jsonb("input_features").notNull(), // Array of health metrics used
  predictions: jsonb("predictions").notNull(), // Biological age, disease risks, etc.
  confidence: real("confidence").notNull(), // Model confidence score 0-1
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const healthInsights = pgTable("health_insights", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => nanoid()),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(), // 'symptom_analysis', 'trend_prediction', 'intervention_suggestion'
  query: text("query").notNull(), // Original user question or symptoms
  response: text("response").notNull(), // AI-generated insight
  confidence: real("confidence").notNull(),
  sources: text("sources").array(), // Data sources used for insight
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const healthTrends = pgTable("health_trends", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => nanoid()),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id),
  metricType: varchar("metric_type", { length: 50 }).notNull(), // 'biological_age', 'vitality_score', etc.
  date: date("date").notNull(),
  value: real("value").notNull(),
  trend: varchar("trend", { length: 20 }).notNull(), // 'improving', 'stable', 'declining'
  dataSource: varchar("data_source", { length: 50 }).notNull(), // 'assessment', 'wearable', 'manual'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Health Model schemas
export const insertHealthModelSchema = createInsertSchema(healthModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHealthInsightSchema = createInsertSchema(healthInsights).omit({
  id: true,
  createdAt: true,
});

export const insertHealthTrendSchema = createInsertSchema(healthTrends).omit({
  id: true,
  createdAt: true,
});

// Health Model types
export type HealthModel = typeof healthModels.$inferSelect;
export type InsertHealthModel = z.infer<typeof insertHealthModelSchema>;
export type HealthInsight = typeof healthInsights.$inferSelect;
export type InsertHealthInsight = z.infer<typeof insertHealthInsightSchema>;
export type HealthTrend = typeof healthTrends.$inferSelect;
export type InsertHealthTrend = z.infer<typeof insertHealthTrendSchema>;

// Analytics Events Table
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => nanoid()),
  userId: varchar("user_id", { length: 255 }).references(() => users.id), // nullable for anonymous events
  sessionId: varchar("session_id", { length: 255 }).notNull(), // Browser session identifier
  eventName: varchar("event_name", { length: 100 }).notNull(), // e.g., "assessment_started", "dashboard_viewed"
  eventCategory: varchar("event_category", { length: 50 }).notNull(), // e.g., "user_action", "page_view", "form_interaction"
  eventData: jsonb("event_data"), // Additional event properties
  userAgent: text("user_agent"), // Browser/device info
  referrer: text("referrer"), // Where user came from
  pathname: varchar("pathname", { length: 500 }).notNull(), // Current page path
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Analytics schema
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  timestamp: true,
});

// Analytics types
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

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
