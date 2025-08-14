"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_LIMITS = exports.CACHE_TTL = exports.userCacheSchema = void 0;
const zod_1 = require("zod");
exports.userCacheSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    dailyMetrics: zod_1.z.object({
        lastUpdated: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
        expiresAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
        data: zod_1.z.object({
            sleepScore: zod_1.z.number(),
            activityScore: zod_1.z.number(),
            nutritionScore: zod_1.z.number(),
            stressScore: zod_1.z.number(),
            overallScore: zod_1.z.number(),
            stepCount: zod_1.z.number(),
            activeMinutes: zod_1.z.number(),
            heartRateVariability: zod_1.z.number().optional(),
            recoveryScore: zod_1.z.number().optional(),
        }),
    }),
    weeklyMetrics: zod_1.z.object({
        lastUpdated: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
        expiresAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
        data: zod_1.z.object({
            averageScores: zod_1.z.object({
                sleep: zod_1.z.number(),
                activity: zod_1.z.number(),
                nutrition: zod_1.z.number(),
                stress: zod_1.z.number(),
                overall: zod_1.z.number(),
            }),
            trends: zod_1.z.object({
                sleepTrend: zod_1.z.enum(['improving', 'declining', 'stable']),
                activityTrend: zod_1.z.enum(['improving', 'declining', 'stable']),
                nutritionTrend: zod_1.z.enum(['improving', 'declining', 'stable']),
                stressTrend: zod_1.z.enum(['improving', 'declining', 'stable']),
            }),
            weeklyGoals: zod_1.z.object({
                exerciseMinutes: zod_1.z.object({
                    target: zod_1.z.number(),
                    actual: zod_1.z.number(),
                    achieved: zod_1.z.boolean(),
                }),
                sleepHours: zod_1.z.object({
                    target: zod_1.z.number(),
                    actual: zod_1.z.number(),
                    achieved: zod_1.z.boolean(),
                }),
                stepsGoal: zod_1.z.object({
                    target: zod_1.z.number(),
                    actual: zod_1.z.number(),
                    achieved: zod_1.z.boolean(),
                }),
            }),
            topInsights: zod_1.z.array(zod_1.z.string()),
        }),
    }),
    monthlyMetrics: zod_1.z.object({
        lastUpdated: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
        expiresAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
        data: zod_1.z.object({
            monthlyAverages: zod_1.z.object({
                sleep: zod_1.z.number(),
                activity: zod_1.z.number(),
                nutrition: zod_1.z.number(),
                stress: zod_1.z.number(),
                overall: zod_1.z.number(),
            }),
            monthlyGoals: zod_1.z.object({
                weightTarget: zod_1.z.object({
                    target: zod_1.z.number(),
                    actual: zod_1.z.number(),
                    achieved: zod_1.z.boolean(),
                }).optional(),
                fitnessGoals: zod_1.z.array(zod_1.z.object({
                    name: zod_1.z.string(),
                    target: zod_1.z.number(),
                    actual: zod_1.z.number(),
                    achieved: zod_1.z.boolean(),
                })),
            }),
            correlationInsights: zod_1.z.array(zod_1.z.object({
                factor1: zod_1.z.string(),
                factor2: zod_1.z.string(),
                correlation: zod_1.z.number(),
                insight: zod_1.z.string(),
                significance: zod_1.z.enum(['high', 'medium', 'low']),
            })),
            achievements: zod_1.z.array(zod_1.z.string()),
        }),
    }),
    lifetimeMetrics: zod_1.z.object({
        lastUpdated: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
        data: zod_1.z.object({
            totalDaysTracked: zod_1.z.number(),
            longestStreaks: zod_1.z.object({
                exercise: zod_1.z.number(),
                meditation: zod_1.z.number(),
                healthyEating: zod_1.z.number(),
                qualitySleep: zod_1.z.number(),
            }),
            personalBests: zod_1.z.object({
                maxSteps: zod_1.z.object({
                    value: zod_1.z.number(),
                    date: zod_1.z.string(),
                }),
                bestSleepScore: zod_1.z.object({
                    value: zod_1.z.number(),
                    date: zod_1.z.string(),
                }),
                longestWorkout: zod_1.z.object({
                    value: zod_1.z.number(),
                    date: zod_1.z.string(),
                }),
                bestHRV: zod_1.z.object({
                    value: zod_1.z.number(),
                    date: zod_1.z.string(),
                }),
            }),
            biologicalAgeHistory: zod_1.z.array(zod_1.z.object({
                date: zod_1.z.string(),
                age: zod_1.z.number(),
                chronologicalAge: zod_1.z.number(),
                difference: zod_1.z.number(),
            })),
            milestones: zod_1.z.array(zod_1.z.object({
                id: zod_1.z.string(),
                title: zod_1.z.string(),
                description: zod_1.z.string(),
                achievedAt: zod_1.z.string(),
                category: zod_1.z.enum(['fitness', 'nutrition', 'sleep', 'stress', 'longevity']),
            })),
        }),
    }),
    dashboardCache: zod_1.z.object({
        lastUpdated: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
        expiresAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
        data: zod_1.z.object({
            heroMetrics: zod_1.z.object({
                currentBiologicalAge: zod_1.z.number(),
                longevityScore: zod_1.z.number(),
                todayScore: zod_1.z.number(),
                weeklyAverage: zod_1.z.number(),
            }),
            quickStats: zod_1.z.object({
                streakDays: zod_1.z.number(),
                goalsAchievedThisWeek: zod_1.z.number(),
                totalGoalsThisWeek: zod_1.z.number(),
                improvementAreas: zod_1.z.array(zod_1.z.string()),
            }),
            recentAchievements: zod_1.z.array(zod_1.z.object({
                id: zod_1.z.string(),
                title: zod_1.z.string(),
                date: zod_1.z.string(),
                icon: zod_1.z.string(),
            })),
            nextActions: zod_1.z.array(zod_1.z.object({
                id: zod_1.z.string(),
                title: zod_1.z.string(),
                description: zod_1.z.string(),
                priority: zod_1.z.enum(['high', 'medium', 'low']),
                estimatedImpact: zod_1.z.number(),
                timeRequired: zod_1.z.string(),
                category: zod_1.z.string(),
            })),
            correlationHighlights: zod_1.z.array(zod_1.z.object({
                insight: zod_1.z.string(),
                correlation: zod_1.z.number(),
                actionable: zod_1.z.boolean(),
            })),
        }),
    }),
    cacheVersion: zod_1.z.string(),
    totalSize: zod_1.z.number(),
    createdAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
    updatedAt: zod_1.z.union([zod_1.z.string(), zod_1.z.date()]),
});
// Cache invalidation configuration
exports.CACHE_TTL = {
    DASHBOARD: 60 * 60 * 1000, // 1 hour
    DAILY: 24 * 60 * 60 * 1000, // 24 hours  
    WEEKLY: 7 * 24 * 60 * 60 * 1000, // 7 days
    MONTHLY: 30 * 24 * 60 * 60 * 1000, // 30 days
    LIFETIME: Infinity, // Never expires
};
// Cache size limits (Firestore has 1MB document limit)
exports.CACHE_LIMITS = {
    MAX_DOCUMENT_SIZE: 900 * 1024, // 900KB (leave buffer)
    MAX_INSIGHTS_PER_SECTION: 10,
    MAX_ACHIEVEMENTS_CACHE: 20,
    MAX_CORRELATION_INSIGHTS: 15,
    MAX_MILESTONE_CACHE: 50,
};
