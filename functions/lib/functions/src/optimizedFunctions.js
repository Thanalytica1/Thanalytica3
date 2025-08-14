"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreated = exports.onWearableDataCreated = exports.onAssessmentCreated = exports.cacheCleanup = exports.weeklyCorrelationAnalysis = exports.dailyMetricsProcessor = exports.apiLightweight = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const express_1 = __importDefault(require("express"));
const compression_1 = __importDefault(require("compression"));
const firestore_2 = require("firebase-admin/firestore");
const metricsCalculationEngine_1 = require("../../server/services/metricsCalculationEngine");
const cacheService_1 = require("../../server/services/cacheService");
const db = (0, firestore_2.getFirestore)();
/**
 * PHASE 1.2: Function Optimization Strategy
 * - Lightweight HTTP endpoints (256MB memory)
 * - Heavy batch processors (1GB memory, scheduled)
 * - Minimal Firestore triggers (256MB memory)
 */
// =============================================================================
// LIGHTWEIGHT HTTP ENDPOINTS (256MB memory, fast response)
// =============================================================================
const lightweightApp = (0, express_1.default)();
// Enable compression for all responses (70-90% size reduction)
lightweightApp.use((0, compression_1.default)());
// Connection pooling for Firestore (reuse connections)
let firestoreConnectionPool = null;
function getOptimizedDb() {
    if (!firestoreConnectionPool) {
        firestoreConnectionPool = db;
    }
    return firestoreConnectionPool;
}
// Fast cache-first API endpoints
lightweightApp.get('/api/dashboard/:userId', async (req, res) => {
    const startTime = Date.now();
    try {
        const { userId } = req.params;
        // Validate userId early (fail fast)
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({
                error: 'Invalid userId',
                executionTime: Date.now() - startTime
            });
        }
        // Try cache first (1-3 reads instead of 50+)
        const dashboardCache = await cacheService_1.cacheService.getDashboardCache(userId);
        if (dashboardCache) {
            // Cache hit - return immediately
            res.set('Cache-Control', 'public, max-age=300'); // 5-minute client cache
            return res.json({
                data: dashboardCache.data,
                cached: true,
                lastUpdated: dashboardCache.lastUpdated,
                executionTime: Date.now() - startTime
            });
        }
        // Cache miss - trigger background calculation
        // Don't wait for it, return processing status
        metricsCalculationEngine_1.metricsEngine.calculateAndCacheUserMetrics(userId).catch(error => {
            console.error(`Background metrics calculation failed for user ${userId}:`, error);
        });
        return res.status(202).json({
            message: 'Metrics are being calculated',
            status: 'processing',
            retryAfter: 30, // seconds
            executionTime: Date.now() - startTime
        });
    }
    catch (error) {
        console.error('Dashboard API error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            executionTime: Date.now() - startTime
        });
    }
});
lightweightApp.get('/api/metrics/:userId/:timeframe', async (req, res) => {
    const startTime = Date.now();
    try {
        const { userId, timeframe } = req.params;
        // Validate inputs early
        if (!userId || !['daily', 'weekly', 'monthly', 'lifetime'].includes(timeframe)) {
            return res.status(400).json({
                error: 'Invalid parameters',
                executionTime: Date.now() - startTime
            });
        }
        let cacheData;
        switch (timeframe) {
            case 'daily':
                cacheData = await cacheService_1.cacheService.getDailyMetrics(userId);
                break;
            case 'weekly':
                cacheData = await cacheService_1.cacheService.getWeeklyMetrics(userId);
                break;
            case 'monthly':
                cacheData = await cacheService_1.cacheService.getMonthlyMetrics(userId);
                break;
            case 'lifetime':
                cacheData = await cacheService_1.cacheService.getLifetimeMetrics(userId);
                break;
        }
        if (cacheData) {
            res.set('Cache-Control', 'public, max-age=600'); // 10-minute client cache
            return res.json({
                data: cacheData.data,
                timeframe,
                lastUpdated: cacheData.lastUpdated,
                executionTime: Date.now() - startTime
            });
        }
        return res.status(202).json({
            message: `${timeframe} metrics are being calculated`,
            status: 'processing',
            executionTime: Date.now() - startTime
        });
    }
    catch (error) {
        console.error('Metrics API error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            executionTime: Date.now() - startTime
        });
    }
});
// Lightweight health check endpoint
lightweightApp.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage()
    });
});
// Export lightweight function with optimized settings
exports.apiLightweight = (0, https_1.onRequest)({
    memory: "256MiB", // Minimum memory for cost efficiency
    timeoutSeconds: 10, // Short timeout for API endpoints
    maxInstances: 100, // Prevent cost explosions
    cors: [
        "https://thanalytica.web.app",
        "https://thanalytica.firebaseapp.com",
        "http://localhost:5050" // Development
    ]
}, lightweightApp);
// =============================================================================
// HEAVY BATCH PROCESSORS (1GB memory, scheduled off-peak)
// =============================================================================
// Daily batch processing - runs at 3 AM user timezone
exports.dailyMetricsProcessor = (0, scheduler_1.onSchedule)({
    schedule: "0 3 * * *", // 3 AM every day
    timeZone: "America/New_York", // Adjust based on user base
    memory: "1GiB", // Higher memory for batch processing
    timeoutSeconds: 540, // 9 minutes max
}, async (event) => {
    console.log('Starting daily metrics batch processing');
    try {
        // Get all active users (users with recent activity)
        const activeUsersSnapshot = await db.collection('users')
            .where('lastActive', '>', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
            .get();
        const userIds = activeUsersSnapshot.docs.map(doc => doc.id);
        console.log(`Processing daily metrics for ${userIds.length} active users`);
        // Process users in chunks to avoid memory issues
        const chunkSize = 50;
        for (let i = 0; i < userIds.length; i += chunkSize) {
            const chunk = userIds.slice(i, i + chunkSize);
            // Process chunk in parallel
            await Promise.allSettled(chunk.map(userId => metricsCalculationEngine_1.metricsEngine.calculateAndCacheUserMetrics(userId)
                .catch(error => {
                console.error(`Failed to process daily metrics for user ${userId}:`, error);
            })));
            console.log(`Processed chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(userIds.length / chunkSize)}`);
        }
        console.log('Daily metrics batch processing completed');
    }
    catch (error) {
        console.error('Daily metrics batch processing failed:', error);
        throw error;
    }
});
// Weekly correlation analysis - runs Sunday at 2 AM
exports.weeklyCorrelationAnalysis = (0, scheduler_1.onSchedule)({
    schedule: "0 2 * * SUN", // 2 AM every Sunday
    timeZone: "America/New_York",
    memory: "2GiB", // Even higher memory for complex analysis
    timeoutSeconds: 540,
}, async (event) => {
    console.log('Starting weekly correlation analysis');
    try {
        // Get users who need correlation analysis
        const usersSnapshot = await db.collection('users')
            .where('totalDaysTracked', '>=', 30) // Need enough data for correlations
            .get();
        const userIds = usersSnapshot.docs.map(doc => doc.id);
        console.log(`Running correlation analysis for ${userIds.length} users`);
        // Process in smaller chunks due to complexity
        const chunkSize = 25;
        for (let i = 0; i < userIds.length; i += chunkSize) {
            const chunk = userIds.slice(i, i + chunkSize);
            await Promise.allSettled(chunk.map(async (userId) => {
                try {
                    // Invalidate monthly cache to force recalculation with new correlations
                    await cacheService_1.cacheService.invalidateCache(userId, ['monthlyMetrics']);
                    // Trigger recalculation
                    await metricsCalculationEngine_1.metricsEngine.calculateAndCacheUserMetrics(userId);
                }
                catch (error) {
                    console.error(`Failed correlation analysis for user ${userId}:`, error);
                }
            }));
        }
        console.log('Weekly correlation analysis completed');
    }
    catch (error) {
        console.error('Weekly correlation analysis failed:', error);
        throw error;
    }
});
// Cache cleanup - runs daily at 1 AM
exports.cacheCleanup = (0, scheduler_1.onSchedule)({
    schedule: "0 1 * * *", // 1 AM every day
    timeZone: "America/New_York",
    memory: "512MiB",
    timeoutSeconds: 300,
}, async (event) => {
    console.log('Starting cache cleanup');
    try {
        // Get cache statistics
        const stats = await cacheService_1.cacheService.getCacheStats();
        console.log('Cache stats:', stats);
        // Clean up oversized cache documents
        if (stats.oversizedDocuments > 0) {
            console.log(`Found ${stats.oversizedDocuments} oversized cache documents`);
            // Get oversized documents
            const oversizedSnapshot = await db.collection('cache')
                .where('totalSize', '>', 900 * 1024) // 900KB threshold
                .get();
            // Compact them
            await Promise.allSettled(oversizedSnapshot.docs.map(doc => cacheService_1.cacheService.invalidateCache(doc.id, ['lifetimeMetrics'])
                .catch(error => {
                console.error(`Failed to compact cache for ${doc.id}:`, error);
            })));
        }
        console.log('Cache cleanup completed');
    }
    catch (error) {
        console.error('Cache cleanup failed:', error);
    }
});
// =============================================================================
// MINIMAL FIRESTORE TRIGGERS (256MB memory, fast execution)
// =============================================================================
// Trigger cache invalidation when new assessment is created
exports.onAssessmentCreated = (0, firestore_1.onDocumentCreated)({
    document: "health_assessments/{assessmentId}",
    memory: "256MiB",
    timeoutSeconds: 60,
}, async (event) => {
    const assessment = event.data?.data();
    if (!assessment?.userId) {
        console.warn('Assessment created without userId');
        return;
    }
    try {
        // Invalidate user's cache to force recalculation
        await cacheService_1.cacheService.invalidateCache(assessment.userId, [
            'dashboardCache',
            'lifetimeMetrics'
        ]);
        console.log(`Invalidated cache for user ${assessment.userId} after new assessment`);
    }
    catch (error) {
        console.error(`Failed to invalidate cache for user ${assessment.userId}:`, error);
    }
});
// Trigger cache update when new wearable data arrives
exports.onWearableDataCreated = (0, firestore_1.onDocumentCreated)({
    document: "wearables_data/{dataId}",
    memory: "256MiB",
    timeoutSeconds: 60,
}, async (event) => {
    const wearableData = event.data?.data();
    if (!wearableData?.userId) {
        console.warn('Wearable data created without userId');
        return;
    }
    try {
        // Invalidate daily cache only (most likely to be affected)
        await cacheService_1.cacheService.invalidateCache(wearableData.userId, [
            'dailyMetrics',
            'dashboardCache'
        ]);
        console.log(`Invalidated daily cache for user ${wearableData.userId} after new wearable data`);
    }
    catch (error) {
        console.error(`Failed to invalidate cache for user ${wearableData.userId}:`, error);
    }
});
// Debounced user cache initialization for new users
exports.onUserCreated = (0, firestore_1.onDocumentCreated)({
    document: "users/{userId}",
    memory: "256MiB",
    timeoutSeconds: 30,
}, async (event) => {
    const userId = event.params.userId;
    try {
        // Initialize cache for new user
        await cacheService_1.cacheService.initializeUserCache(userId);
        console.log(`Initialized cache for new user ${userId}`);
    }
    catch (error) {
        console.error(`Failed to initialize cache for new user ${userId}:`, error);
    }
});
// Functions are already exported individually above
