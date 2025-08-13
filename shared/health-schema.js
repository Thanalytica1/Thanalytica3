"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wearableDeviceSchema = exports.healthGoalSchema = exports.healthMetricSchema = exports.userProfileSchema = void 0;
const zod_1 = require("zod");
// Zod validation schemas
exports.userProfileSchema = zod_1.z.object({
    firebaseUid: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    displayName: zod_1.z.string().optional().nullable(),
    photoURL: zod_1.z.string().url().optional().nullable(),
    dateOfBirth: zod_1.z.string().optional().nullable(),
    timeZone: zod_1.z.string().default('UTC'),
    preferences: zod_1.z.object({
        units: zod_1.z.enum(['metric', 'imperial']).default('metric'),
        notifications: zod_1.z.object({
            email: zod_1.z.boolean().default(true),
            push: zod_1.z.boolean().default(true),
            healthReminders: zod_1.z.boolean().default(true),
            weeklyReports: zod_1.z.boolean().default(true),
            goalMilestones: zod_1.z.boolean().default(true),
        }),
        goals: zod_1.z.array(zod_1.z.string()).default([]),
        primaryFocus: zod_1.z.enum(['longevity', 'fitness', 'wellness', 'prevention']).default('longevity'),
    }),
    privacy: zod_1.z.object({
        dataSharing: zod_1.z.boolean().default(false),
        anonymousAnalytics: zod_1.z.boolean().default(true),
        researchParticipation: zod_1.z.boolean().default(false),
    }),
    referralCode: zod_1.z.string().optional(),
    referredById: zod_1.z.string().optional(),
});
exports.healthMetricSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    type: zod_1.z.enum([
        'weight', 'bmi', 'body_fat', 'muscle_mass',
        'systolic_bp', 'diastolic_bp', 'resting_hr', 'hrv',
        'vo2_max', 'sleep_hours', 'sleep_quality', 'steps',
        'stress_level', 'mood', 'energy_level', 'pain_level'
    ]),
    value: zod_1.z.number(),
    unit: zod_1.z.string(),
    source: zod_1.z.enum(['manual', 'wearable', 'assessment', 'lab_test', 'provider']),
    deviceId: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    recordedAt: zod_1.z.string(),
});
exports.healthGoalSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    category: zod_1.z.enum([
        'weight_management', 'fitness', 'sleep', 'nutrition',
        'stress', 'longevity', 'preventive_care', 'mental_health'
    ]),
    type: zod_1.z.enum(['increase', 'decrease', 'maintain', 'achieve']),
    title: zod_1.z.string().min(1),
    description: zod_1.z.string(),
    targetValue: zod_1.z.number().optional(),
    currentValue: zod_1.z.number().optional(),
    unit: zod_1.z.string().optional(),
    targetDate: zod_1.z.string(),
    priority: zod_1.z.enum(['low', 'medium', 'high']).default('medium'),
    status: zod_1.z.enum(['active', 'paused', 'completed', 'cancelled']).default('active'),
});
exports.wearableDeviceSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    provider: zod_1.z.enum([
        'apple_health', 'google_fit', 'garmin', 'fitbit',
        'oura', 'whoop', 'polar', 'suunto', 'amazfit'
    ]),
    deviceModel: zod_1.z.string(),
    nickname: zod_1.z.string().optional(),
    isActive: zod_1.z.boolean().default(true),
    permissions: zod_1.z.object({
        heartRate: zod_1.z.boolean().default(false),
        sleep: zod_1.z.boolean().default(false),
        activity: zod_1.z.boolean().default(false),
        location: zod_1.z.boolean().default(false),
        stress: zod_1.z.boolean().default(false),
        temperature: zod_1.z.boolean().default(false),
    }),
});
