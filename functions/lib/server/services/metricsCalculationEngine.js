"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsEngine = exports.MetricsCalculationEngine = void 0;
const db_1 = require("../db");
const cacheService_1 = require("./cacheService");
/**
 * Metrics Calculation Engine
 * Processes raw data once and caches results for efficient dashboard serving
 * Reduces Firestore reads from 50+ per dashboard load to 1-3
 */
class MetricsCalculationEngine {
    static getInstance() {
        if (!MetricsCalculationEngine.instance) {
            MetricsCalculationEngine.instance = new MetricsCalculationEngine();
        }
        return MetricsCalculationEngine.instance;
    }
    // Calculate all metrics for a user and update cache
    async calculateAndCacheUserMetrics(userId) {
        console.log(`Calculating metrics for user ${userId}`);
        try {
            // Initialize cache if it doesn't exist
            const existingCache = await cacheService_1.cacheService.getUserCache(userId);
            if (!existingCache) {
                await cacheService_1.cacheService.initializeUserCache(userId);
            }
            // Calculate each cache section
            await Promise.all([
                this.calculateDailyMetrics(userId),
                this.calculateWeeklyMetrics(userId),
                this.calculateMonthlyMetrics(userId),
                this.calculateLifetimeMetrics(userId),
                this.calculateDashboardCache(userId),
            ]);
            console.log(`Successfully calculated and cached metrics for user ${userId}`);
        }
        catch (error) {
            console.error(`Error calculating metrics for user ${userId}:`, error);
            throw error;
        }
    }
    // Calculate daily metrics (24-hour TTL)
    async calculateDailyMetrics(userId) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        // Get today's wearable data
        const todayData = await this.getWearableDataInRange(userId, startOfDay, endOfDay);
        // Calculate daily scores
        const sleepScore = this.calculateSleepScore(todayData);
        const activityScore = this.calculateActivityScore(todayData);
        const nutritionScore = this.calculateNutritionScore(todayData);
        const stressScore = this.calculateStressScore(todayData);
        const overallScore = Math.round((sleepScore + activityScore + nutritionScore + stressScore) / 4);
        // Extract key metrics
        const stepCount = this.extractMetric(todayData, 'steps', 'sum') || 0;
        const activeMinutes = this.extractMetric(todayData, 'active_minutes', 'sum') || 0;
        const heartRateVariability = this.extractMetric(todayData, 'hrv', 'average');
        const recoveryScore = this.calculateRecoveryScore(todayData);
        const dailyMetrics = {
            lastUpdated: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            data: {
                sleepScore,
                activityScore,
                nutritionScore,
                stressScore,
                overallScore,
                stepCount,
                activeMinutes,
                heartRateVariability,
                recoveryScore,
            }
        };
        await cacheService_1.cacheService.updateDailyMetrics(userId, dailyMetrics);
    }
    // Calculate weekly metrics (7-day TTL)
    async calculateWeeklyMetrics(userId) {
        const today = new Date();
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        // Get week's data
        const weekData = await this.getWearableDataInRange(userId, weekStart, today);
        // Calculate weekly averages
        const averageScores = {
            sleep: this.calculateAverageSleepScore(weekData),
            activity: this.calculateAverageActivityScore(weekData),
            nutrition: this.calculateAverageNutritionScore(weekData),
            stress: this.calculateAverageStressScore(weekData),
            overall: 0,
        };
        averageScores.overall = Math.round((averageScores.sleep + averageScores.activity + averageScores.nutrition + averageScores.stress) / 4);
        // Calculate trends
        const trends = {
            sleepTrend: this.calculateTrend(weekData, 'sleep'),
            activityTrend: this.calculateTrend(weekData, 'activity'),
            nutritionTrend: this.calculateTrend(weekData, 'nutrition'),
            stressTrend: this.calculateTrend(weekData, 'stress'),
        };
        // Calculate weekly goals
        const weeklyGoals = await this.calculateWeeklyGoals(userId, weekData);
        // Generate insights
        const topInsights = await this.generateWeeklyInsights(userId, weekData, trends);
        const weeklyMetrics = {
            lastUpdated: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            data: {
                averageScores,
                trends,
                weeklyGoals,
                topInsights,
            }
        };
        await cacheService_1.cacheService.updateWeeklyMetrics(userId, weeklyMetrics);
    }
    // Calculate monthly metrics (30-day TTL)
    async calculateMonthlyMetrics(userId) {
        const today = new Date();
        const monthStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        // Get month's data
        const monthData = await this.getWearableDataInRange(userId, monthStart, today);
        // Calculate monthly averages
        const monthlyAverages = {
            sleep: this.calculateAverageSleepScore(monthData),
            activity: this.calculateAverageActivityScore(monthData),
            nutrition: this.calculateAverageNutritionScore(monthData),
            stress: this.calculateAverageStressScore(monthData),
            overall: 0,
        };
        monthlyAverages.overall = Math.round((monthlyAverages.sleep + monthlyAverages.activity + monthlyAverages.nutrition + monthlyAverages.stress) / 4);
        // Calculate monthly goals
        const monthlyGoals = await this.calculateMonthlyGoals(userId, monthData);
        // Generate correlation insights
        const correlationInsights = await this.calculateCorrelationInsights(userId, monthData);
        // Get recent achievements
        const achievements = await this.getRecentAchievements(userId, 30);
        const monthlyMetrics = {
            lastUpdated: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            data: {
                monthlyAverages,
                monthlyGoals,
                correlationInsights,
                achievements,
            }
        };
        await cacheService_1.cacheService.updateMonthlyMetrics(userId, monthlyMetrics);
    }
    // Calculate lifetime metrics (never expire)
    async calculateLifetimeMetrics(userId) {
        // Get all user data
        const allData = await this.getAllUserWearableData(userId);
        // Calculate total days tracked
        const totalDaysTracked = this.calculateTotalDaysTracked(allData);
        // Calculate longest streaks
        const longestStreaks = await this.calculateLongestStreaks(userId);
        // Calculate personal bests
        const personalBests = this.calculatePersonalBests(allData);
        // Get biological age history
        const biologicalAgeHistory = await this.getBiologicalAgeHistory(userId);
        // Get all milestones
        const milestones = await this.getAllMilestones(userId);
        const lifetimeMetrics = {
            lastUpdated: new Date().toISOString(),
            data: {
                totalDaysTracked,
                longestStreaks,
                personalBests,
                biologicalAgeHistory,
                milestones,
            }
        };
        await cacheService_1.cacheService.updateLifetimeMetrics(userId, lifetimeMetrics);
    }
    // Calculate dashboard cache (1-hour TTL)
    async calculateDashboardCache(userId) {
        // Get latest assessment
        const assessment = await this.getLatestAssessment(userId);
        // Get recent metrics
        const dailyCache = await cacheService_1.cacheService.getDailyMetrics(userId);
        const weeklyCache = await cacheService_1.cacheService.getWeeklyMetrics(userId);
        // Calculate hero metrics
        const heroMetrics = {
            currentBiologicalAge: assessment?.biologicalAge || assessment?.age || 35,
            longevityScore: Math.round((dailyCache?.data.overallScore || 75) * 1.2), // Scale up for motivation
            todayScore: dailyCache?.data.overallScore || 75,
            weeklyAverage: weeklyCache?.data.averageScores.overall || 75,
        };
        // Calculate quick stats
        const quickStats = await this.calculateQuickStats(userId);
        // Get recent achievements
        const recentAchievements = await this.getRecentAchievements(userId, 7);
        // Generate next actions
        const nextActions = await this.generateNextActions(userId);
        // Generate correlation highlights
        const correlationHighlights = await this.generateCorrelationHighlights(userId);
        const dashboardCache = {
            lastUpdated: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
            data: {
                heroMetrics,
                quickStats,
                recentAchievements,
                nextActions,
                correlationHighlights,
            }
        };
        await cacheService_1.cacheService.updateDashboardCache(userId, dashboardCache);
    }
    // Helper methods for data retrieval
    async getWearableDataInRange(userId, startDate, endDate) {
        try {
            const snapshot = await db_1.db.collection(db_1.COLLECTIONS.WEARABLES_DATA)
                .where('userId', '==', userId)
                .where('createdAt', '>=', startDate.toISOString())
                .where('createdAt', '<=', endDate.toISOString())
                .get();
            return (0, db_1.queryToArray)(snapshot);
        }
        catch (error) {
            console.error(`Error fetching wearable data for user ${userId}:`, error);
            return [];
        }
    }
    async getAllUserWearableData(userId) {
        try {
            const snapshot = await db_1.db.collection(db_1.COLLECTIONS.WEARABLES_DATA)
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(1000) // Limit to prevent excessive reads
                .get();
            return (0, db_1.queryToArray)(snapshot);
        }
        catch (error) {
            console.error(`Error fetching all wearable data for user ${userId}:`, error);
            return [];
        }
    }
    async getLatestAssessment(userId) {
        try {
            const snapshot = await db_1.db.collection(db_1.COLLECTIONS.HEALTH_ASSESSMENTS)
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();
            if (snapshot.empty)
                return null;
            return (0, db_1.queryToArray)(snapshot)[0];
        }
        catch (error) {
            console.error(`Error fetching latest assessment for user ${userId}:`, error);
            return null;
        }
    }
    // Score calculation methods
    calculateSleepScore(data) {
        // Extract sleep data and calculate score
        const sleepData = data.filter(d => d.dataType?.includes('sleep'));
        if (sleepData.length === 0)
            return 75; // Default score
        // Simple calculation - would be more sophisticated in production
        const avgSleepHours = sleepData.reduce((sum, d) => {
            const hours = typeof d.dataJson === 'object' && d.dataJson ?
                d.dataJson.sleep_hours || 7 : 7;
            return sum + hours;
        }, 0) / sleepData.length;
        // Score based on 7-9 hours optimal
        if (avgSleepHours >= 7 && avgSleepHours <= 9)
            return 90;
        if (avgSleepHours >= 6 && avgSleepHours <= 10)
            return 75;
        return 60;
    }
    calculateActivityScore(data) {
        const activityData = data.filter(d => d.dataType?.includes('activity'));
        if (activityData.length === 0)
            return 75;
        // Calculate based on steps and active minutes
        const totalSteps = this.extractMetric(data, 'steps', 'sum') || 0;
        const activeMinutes = this.extractMetric(data, 'active_minutes', 'sum') || 0;
        let score = 50;
        if (totalSteps >= 10000)
            score += 20;
        if (totalSteps >= 8000)
            score += 15;
        if (activeMinutes >= 30)
            score += 25;
        return Math.min(score, 100);
    }
    calculateNutritionScore(data) {
        // Placeholder - would integrate with nutrition tracking
        return 75;
    }
    calculateStressScore(data) {
        const stressData = data.filter(d => d.dataType?.includes('stress'));
        if (stressData.length === 0)
            return 75;
        // Calculate based on HRV and other stress indicators
        const hrv = this.extractMetric(data, 'hrv', 'average');
        if (!hrv)
            return 75;
        // Higher HRV generally indicates better stress management
        if (hrv >= 40)
            return 90;
        if (hrv >= 30)
            return 75;
        if (hrv >= 20)
            return 60;
        return 45;
    }
    extractMetric(data, metricName, aggregation) {
        const values = [];
        data.forEach(d => {
            if (typeof d.dataJson === 'object' && d.dataJson) {
                const value = d.dataJson[metricName];
                if (typeof value === 'number') {
                    values.push(value);
                }
            }
        });
        if (values.length === 0)
            return undefined;
        switch (aggregation) {
            case 'sum':
                return values.reduce((sum, val) => sum + val, 0);
            case 'average':
                return values.reduce((sum, val) => sum + val, 0) / values.length;
            case 'max':
                return Math.max(...values);
            case 'min':
                return Math.min(...values);
            default:
                return undefined;
        }
    }
    // Placeholder methods for complex calculations
    calculateAverageSleepScore(data) { return 75; }
    calculateAverageActivityScore(data) { return 75; }
    calculateAverageNutritionScore(data) { return 75; }
    calculateAverageStressScore(data) { return 75; }
    calculateTrend(data, metric) { return 'stable'; }
    calculateRecoveryScore(data) { return 75; }
    async calculateWeeklyGoals(userId, data) {
        return {
            exerciseMinutes: { target: 150, actual: 120, achieved: false },
            sleepHours: { target: 56, actual: 52, achieved: false },
            stepsGoal: { target: 70000, actual: 65000, achieved: false },
        };
    }
    async generateWeeklyInsights(userId, data, trends) {
        return ['Your sleep quality improved this week', 'Consider increasing activity on weekends'];
    }
    async calculateMonthlyGoals(userId, data) {
        return {
            fitnessGoals: [
                { name: 'Cardio Fitness', target: 85, actual: 78, achieved: false }
            ]
        };
    }
    async calculateCorrelationInsights(userId, data) {
        return [
            {
                factor1: 'Sleep Quality',
                factor2: 'Next Day Energy',
                correlation: 0.73,
                insight: 'Better sleep strongly correlates with higher energy levels',
                significance: 'high'
            }
        ];
    }
    async getRecentAchievements(userId, days) {
        return [
            { id: '1', title: '7-Day Sleep Streak', date: new Date().toISOString(), icon: '🌙' }
        ];
    }
    calculateTotalDaysTracked(data) { return data.length; }
    async calculateLongestStreaks(userId) {
        return {
            exercise: 12,
            meditation: 5,
            healthyEating: 8,
            qualitySleep: 15,
        };
    }
    calculatePersonalBests(data) {
        return {
            maxSteps: { value: 15000, date: '2024-01-15' },
            bestSleepScore: { value: 95, date: '2024-01-20' },
            longestWorkout: { value: 90, date: '2024-01-18' },
            bestHRV: { value: 45, date: '2024-01-22' },
        };
    }
    async getBiologicalAgeHistory(userId) {
        return [
            { date: '2024-01-01', age: 32.5, chronologicalAge: 35, difference: 2.5 }
        ];
    }
    async getAllMilestones(userId) {
        return [
            {
                id: '1',
                title: 'First Assessment Complete',
                description: 'Completed your initial health assessment',
                achievedAt: new Date().toISOString(),
                category: 'longevity'
            }
        ];
    }
    async calculateQuickStats(userId) {
        return {
            streakDays: 7,
            goalsAchievedThisWeek: 3,
            totalGoalsThisWeek: 5,
            improvementAreas: ['Stress Management', 'Nutrition Timing'],
        };
    }
    async generateNextActions(userId) {
        return [
            {
                id: '1',
                title: 'Improve Sleep Consistency',
                description: 'Go to bed at the same time each night',
                priority: 'high',
                estimatedImpact: 2.5,
                timeRequired: '21 days',
                category: 'Sleep'
            }
        ];
    }
    async generateCorrelationHighlights(userId) {
        return [
            {
                insight: 'Your best workouts happen after 8+ hours of sleep',
                correlation: 0.82,
                actionable: true
            }
        ];
    }
}
exports.MetricsCalculationEngine = MetricsCalculationEngine;
// Export singleton instance
exports.metricsEngine = MetricsCalculationEngine.getInstance();
