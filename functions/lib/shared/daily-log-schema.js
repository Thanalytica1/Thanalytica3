"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyLogSettingsSchema = exports.dailyLogSchema = exports.habitsSchema = exports.mindsetSchema = exports.recoverySchema = exports.nutritionSchema = exports.exerciseSchema = exports.sleepSchema = void 0;
exports.getTodayLogId = getTodayLogId;
exports.formatDateId = formatDateId;
exports.parseLogId = parseLogId;
exports.calculateStreak = calculateStreak;
exports.calculateHabitStreak = calculateHabitStreak;
exports.calculateWeeklyAverages = calculateWeeklyAverages;
exports.generateInsights = generateInsights;
// Daily Log Schema and Types for Thanalytica
const zod_1 = require("zod");
// Sleep metrics
exports.sleepSchema = zod_1.z.object({
    timeInBed: zod_1.z.number().min(0).max(1440).optional(), // minutes
    timeAsleep: zod_1.z.number().min(0).max(1440).optional(), // minutes
    quality: zod_1.z.number().min(1).max(10).optional(),
    wakeTime: zod_1.z.string().optional(), // HH:MM format
}).optional();
// Exercise metrics
exports.exerciseSchema = zod_1.z.object({
    minutes: zod_1.z.number().min(0).max(480).optional(),
    intensity: zod_1.z.enum(['low', 'medium', 'high']).optional(),
    steps: zod_1.z.number().min(0).optional(),
}).optional();
// Nutrition metrics
exports.nutritionSchema = zod_1.z.object({
    meals: zod_1.z.number().min(0).max(10).optional(),
    hydrationOz: zod_1.z.number().min(0).optional(),
    alcoholDrinks: zod_1.z.number().min(0).optional(),
}).optional();
// Recovery metrics
exports.recoverySchema = zod_1.z.object({
    rpe: zod_1.z.number().min(1).max(10).optional(), // Rate of Perceived Exertion
    soreness: zod_1.z.number().min(1).max(5).optional(),
    restingHr: zod_1.z.number().min(30).max(200).optional(), // bpm
    hrv: zod_1.z.number().min(0).max(200).optional(), // ms
}).optional();
// Mindset metrics
exports.mindsetSchema = zod_1.z.object({
    mood: zod_1.z.number().min(1).max(5).optional(),
    stress: zod_1.z.number().min(1).max(5).optional(),
}).optional();
// Custom habits
exports.habitsSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.boolean()).optional();
// Complete daily log schema
exports.dailyLogSchema = zod_1.z.object({
    id: zod_1.z.string(), // YYYY-MM-DD format
    userId: zod_1.z.string(),
    date: zod_1.z.string(), // ISO date string
    sleep: exports.sleepSchema,
    exercise: exports.exerciseSchema,
    nutrition: exports.nutritionSchema,
    recovery: exports.recoverySchema,
    mindset: exports.mindsetSchema,
    habits: exports.habitsSchema,
    notes: zod_1.z.string().max(200).optional(),
    completed: zod_1.z.boolean().default(false),
    source: zod_1.z.enum(['manual', 'wearable', 'mixed']).default('manual'),
    createdAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
    updatedAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
    syncStatus: zod_1.z.enum(['synced', 'pending', 'error']).default('synced').optional(),
    offlineChanges: zod_1.z.array(zod_1.z.any()).optional(), // For conflict resolution
});
// User settings for daily logs
exports.dailyLogSettingsSchema = zod_1.z.object({
    visibleFields: zod_1.z.object({
        sleep: zod_1.z.boolean().default(true),
        exercise: zod_1.z.boolean().default(true),
        nutrition: zod_1.z.boolean().default(true),
        recovery: zod_1.z.boolean().default(true),
        mindset: zod_1.z.boolean().default(true),
        habits: zod_1.z.boolean().default(true),
        notes: zod_1.z.boolean().default(true),
    }).optional(),
    habitDefinitions: zod_1.z.array(zod_1.z.object({
        key: zod_1.z.string(),
        label: zod_1.z.string(),
        icon: zod_1.z.string().optional(),
        category: zod_1.z.enum(['health', 'fitness', 'nutrition', 'mindfulness', 'other']).optional(),
    })).optional(),
    units: zod_1.z.object({
        hydration: zod_1.z.enum(['oz', 'ml', 'cups']).default('oz'),
        distance: zod_1.z.enum(['miles', 'km']).default('miles'),
        weight: zod_1.z.enum(['lbs', 'kg']).default('lbs'),
    }).optional(),
    defaultValues: zod_1.z.object({
        copyFromYesterday: zod_1.z.boolean().default(false),
        presetValues: exports.dailyLogSchema.partial().optional(),
    }).optional(),
});
// Helper functions
function getTodayLogId() {
    const today = new Date();
    return formatDateId(today);
}
function formatDateId(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function parseLogId(logId) {
    const [year, month, day] = logId.split('-').map(Number);
    return new Date(year, month - 1, day);
}
// Calculate streaks
function calculateStreak(logs) {
    if (!logs.length)
        return 0;
    // Sort logs by date in descending order
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
        }
        else {
            break;
        }
    }
    return streak;
}
// Calculate habit-specific streaks
function calculateHabitStreak(logs, habitKey) {
    if (!logs.length)
        return 0;
    const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
        }
        else {
            break;
        }
    }
    return streak;
}
// Calculate weekly averages
function calculateWeeklyAverages(logs) {
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
    const calculateAvg = (logs, getter) => {
        const values = logs.map(getter).filter((v) => v !== undefined);
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
function generateInsights(logs) {
    const insights = [];
    const recentLogs = logs.slice(-7); // Last 7 days
    // Sleep insights
    const avgSleep = recentLogs
        .map(l => l.sleep?.timeAsleep)
        .filter((v) => v !== undefined)
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
