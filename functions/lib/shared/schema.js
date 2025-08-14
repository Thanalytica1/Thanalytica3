"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertReferralSchema = exports.insertAnalyticsEventSchema = exports.insertHealthTrendSchema = exports.insertHealthInsightSchema = exports.insertHealthModelSchema = exports.insertWearablesDataSchema = exports.insertWearableConnectionSchema = exports.insertRecommendationSchema = exports.insertHealthMetricsSchema = exports.insertHealthAssessmentSchema = exports.insertUserSchema = void 0;
const zod_1 = require("zod");
// Re-export health schema types for compatibility
__exportStar(require("./health-schema"), exports);
exports.insertUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    displayName: zod_1.z.string().optional().nullable(),
    photoURL: zod_1.z.string().url().optional().nullable(),
    firebaseUid: zod_1.z.string().min(1),
    referredById: zod_1.z.string().optional().nullable(),
});
exports.insertHealthAssessmentSchema = zod_1.z.object({
    age: zod_1.z.number().int().nonnegative(),
    gender: zod_1.z.string(),
    height: zod_1.z.number().int().positive().optional(),
    weight: zod_1.z.number().positive().optional(),
    sleepDuration: zod_1.z.string(),
    sleepQuality: zod_1.z.string(),
    dietPattern: zod_1.z.string(),
    alcoholConsumption: zod_1.z.string(),
    smokingStatus: zod_1.z.string(),
    exerciseFrequency: zod_1.z.string(),
    exerciseTypes: zod_1.z.array(zod_1.z.string()),
    exerciseIntensity: zod_1.z.string(),
    chronicConditions: zod_1.z.array(zod_1.z.string()).optional(),
    medications: zod_1.z.array(zod_1.z.string()).optional(),
    familyHistory: zod_1.z.array(zod_1.z.string()).optional(),
    longevityGoals: zod_1.z.string(),
    healthPriorities: zod_1.z.array(zod_1.z.string()),
});
exports.insertHealthMetricsSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1).optional(), // set by server in some flows
    assessmentId: zod_1.z.string().optional(),
    sleepScore: zod_1.z.number().int().min(0).max(100).optional(),
    exerciseScore: zod_1.z.number().int().min(0).max(100).optional(),
    nutritionScore: zod_1.z.number().int().min(0).max(100).optional(),
    stressScore: zod_1.z.number().int().min(0).max(100).optional(),
    cognitiveScore: zod_1.z.number().int().min(0).max(100).optional(),
    cardiovascularRisk: zod_1.z.string().optional(),
    metabolicRisk: zod_1.z.string().optional(),
    cognitiveRisk: zod_1.z.string().optional(),
    projectedLifespan: zod_1.z.number().int().positive().optional(),
    optimizationPotential: zod_1.z.number().int().min(0).optional(),
});
exports.insertRecommendationSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1).optional(),
    assessmentId: zod_1.z.string().min(1),
    category: zod_1.z.string().min(1),
    priority: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    actionItems: zod_1.z.array(zod_1.z.string()),
    estimatedImpact: zod_1.z.number().positive().optional(),
});
exports.insertWearableConnectionSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    deviceType: zod_1.z.string().min(1),
    accessToken: zod_1.z.string().optional(),
    refreshToken: zod_1.z.string().optional(),
    tokenSecret: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().optional(),
    lastSyncAt: zod_1.z.string().optional(),
    expiresAt: zod_1.z.string().optional(),
});
exports.insertWearablesDataSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    device: zod_1.z.string().min(1),
    date: zod_1.z.string().min(1),
    dataJson: zod_1.z.record(zod_1.z.any()),
});
exports.insertHealthModelSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    modelVersion: zod_1.z.string().min(1),
    inputFeatures: zod_1.z.record(zod_1.z.any()),
    predictions: zod_1.z.object({
        biologicalAge: zod_1.z.number(),
        diseaseRisks: zod_1.z.record(zod_1.z.number()),
        interventionImpact: zod_1.z.record(zod_1.z.number()),
        lifeExpectancy: zod_1.z.number(),
        optimalInterventions: zod_1.z.array(zod_1.z.string()),
    }),
    confidence: zod_1.z.number().min(0).max(1),
});
exports.insertHealthInsightSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    type: zod_1.z.string().min(1),
    query: zod_1.z.string().min(1),
    response: zod_1.z.string().min(1),
    confidence: zod_1.z.number().min(0).max(1),
    sources: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.insertHealthTrendSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    metricType: zod_1.z.string().min(1),
    date: zod_1.z.string().min(1),
    value: zod_1.z.number(),
    trend: zod_1.z.string().min(1),
    dataSource: zod_1.z.string().min(1),
});
exports.insertAnalyticsEventSchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
    sessionId: zod_1.z.string().min(1),
    eventName: zod_1.z.string().min(1),
    eventCategory: zod_1.z.string().min(1),
    eventData: zod_1.z.record(zod_1.z.any()).optional(),
    userAgent: zod_1.z.string().optional(),
    referrer: zod_1.z.string().optional(),
    pathname: zod_1.z.string().min(1),
});
exports.insertReferralSchema = zod_1.z.object({
    referrerUserId: zod_1.z.string().min(1),
    referredUserId: zod_1.z.string().optional(),
    referralCode: zod_1.z.string().min(4).max(10),
    email: zod_1.z.string().email().optional(),
    status: zod_1.z.string().min(1).default("pending"),
    shareMethod: zod_1.z.string().optional(),
});
