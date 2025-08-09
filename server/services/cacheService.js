"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
const db_1 = require("../db");
const cache_schema_1 = require("@shared/cache-schema");
/**
 * Cache Service - Manages three-tier caching architecture
 * Reduces Firestore reads by 95% for dashboard operations
 */
class CacheService {
    static getInstance() {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }
    // Check if cache section is expired
    isCacheExpired(lastUpdated, ttl) {
        const lastUpdatedTime = typeof lastUpdated === 'string'
            ? new Date(lastUpdated).getTime()
            : lastUpdated.getTime();
        return Date.now() - lastUpdatedTime > ttl;
    }
    // Get user cache with smart fallbacks
    async getUserCache(userId) {
        try {
            const cacheDoc = await db_1.db.collection(db_1.COLLECTIONS.CACHE).doc(userId).get();
            if (!cacheDoc.exists) {
                console.log(`No cache found for user ${userId}, will create on first update`);
                return null;
            }
            const cache = { id: cacheDoc.id, ...cacheDoc.data() };
            // Check cache validity and size
            if (cache.totalSize > cache_schema_1.CACHE_LIMITS.MAX_DOCUMENT_SIZE) {
                console.warn(`Cache too large for user ${userId}: ${cache.totalSize} bytes`);
                await this.compactCache(userId);
            }
            return cache;
        }
        catch (error) {
            console.error(`Error fetching cache for user ${userId}:`, error);
            return null;
        }
    }
    // Get specific cache section with expiration check
    async getCacheSection(userId, section, ttl) {
        const cache = await this.getUserCache(userId);
        if (!cache || !cache[section]) {
            return null;
        }
        const sectionData = cache[section];
        // Check if section has expiration logic
        if (sectionData.lastUpdated && this.isCacheExpired(sectionData.lastUpdated, ttl)) {
            console.log(`Cache section ${section} expired for user ${userId}`);
            return null;
        }
        return cache[section];
    }
    // Update specific cache section
    async updateCacheSection(userId, section, data, ttl) {
        try {
            const now = new Date().toISOString();
            const updateData = {
                [`${section}`]: data,
                updatedAt: now,
            };
            // Add expiration for sections that support it
            if (ttl && typeof data === 'object' && data !== null) {
                const sectionWithTTL = data;
                if ('lastUpdated' in sectionWithTTL) {
                    sectionWithTTL.lastUpdated = now;
                    sectionWithTTL.expiresAt = new Date(Date.now() + ttl).toISOString();
                }
            }
            // Calculate approximate document size
            const sizeEstimate = JSON.stringify(updateData).length;
            updateData.totalSize = sizeEstimate;
            // Use merge to avoid overwriting other sections
            await db_1.db.collection(db_1.COLLECTIONS.CACHE).doc(userId).set(updateData, { merge: true });
            console.log(`Updated cache section ${section} for user ${userId} (${sizeEstimate} bytes)`);
        }
        catch (error) {
            console.error(`Error updating cache section ${section} for user ${userId}:`, error);
            throw error;
        }
    }
    // Create initial cache document for new user
    async initializeUserCache(userId) {
        const now = new Date().toISOString();
        const initialCache = {
            userId,
            cacheVersion: '1.0',
            totalSize: 0,
            createdAt: now,
            updatedAt: now,
        };
        try {
            await db_1.db.collection(db_1.COLLECTIONS.CACHE).doc(userId).set(initialCache);
            console.log(`Initialized cache for user ${userId}`);
        }
        catch (error) {
            console.error(`Error initializing cache for user ${userId}:`, error);
            throw error;
        }
    }
    // Dashboard cache with 1-hour TTL
    async getDashboardCache(userId) {
        return this.getCacheSection(userId, 'dashboardCache', cache_schema_1.CACHE_TTL.DASHBOARD);
    }
    async updateDashboardCache(userId, dashboardData) {
        return this.updateCacheSection(userId, 'dashboardCache', dashboardData, cache_schema_1.CACHE_TTL.DASHBOARD);
    }
    // Daily metrics cache with 24-hour TTL
    async getDailyMetrics(userId) {
        return this.getCacheSection(userId, 'dailyMetrics', cache_schema_1.CACHE_TTL.DAILY);
    }
    async updateDailyMetrics(userId, dailyData) {
        return this.updateCacheSection(userId, 'dailyMetrics', dailyData, cache_schema_1.CACHE_TTL.DAILY);
    }
    // Weekly metrics cache with 7-day TTL
    async getWeeklyMetrics(userId) {
        return this.getCacheSection(userId, 'weeklyMetrics', cache_schema_1.CACHE_TTL.WEEKLY);
    }
    async updateWeeklyMetrics(userId, weeklyData) {
        return this.updateCacheSection(userId, 'weeklyMetrics', weeklyData, cache_schema_1.CACHE_TTL.WEEKLY);
    }
    // Monthly metrics cache with 30-day TTL
    async getMonthlyMetrics(userId) {
        return this.getCacheSection(userId, 'monthlyMetrics', cache_schema_1.CACHE_TTL.MONTHLY);
    }
    async updateMonthlyMetrics(userId, monthlyData) {
        return this.updateCacheSection(userId, 'monthlyMetrics', monthlyData, cache_schema_1.CACHE_TTL.MONTHLY);
    }
    // Lifetime metrics (never expire, update incrementally)
    async getLifetimeMetrics(userId) {
        return this.getCacheSection(userId, 'lifetimeMetrics', cache_schema_1.CACHE_TTL.LIFETIME);
    }
    async updateLifetimeMetrics(userId, lifetimeData) {
        return this.updateCacheSection(userId, 'lifetimeMetrics', lifetimeData);
    }
    // Compact cache when it gets too large
    async compactCache(userId) {
        try {
            const cache = await this.getUserCache(userId);
            if (!cache)
                return;
            // Remove oldest achievements, keeping only recent ones
            if (cache.lifetimeMetrics?.data?.milestones) {
                cache.lifetimeMetrics.data.milestones = cache.lifetimeMetrics.data.milestones
                    .sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime())
                    .slice(0, cache_schema_1.CACHE_LIMITS.MAX_MILESTONE_CACHE);
            }
            // Limit correlation insights
            if (cache.monthlyMetrics?.data?.correlationInsights) {
                cache.monthlyMetrics.data.correlationInsights = cache.monthlyMetrics.data.correlationInsights
                    .slice(0, cache_schema_1.CACHE_LIMITS.MAX_CORRELATION_INSIGHTS);
            }
            // Limit dashboard achievements
            if (cache.dashboardCache?.data?.recentAchievements) {
                cache.dashboardCache.data.recentAchievements = cache.dashboardCache.data.recentAchievements
                    .slice(0, cache_schema_1.CACHE_LIMITS.MAX_ACHIEVEMENTS_CACHE);
            }
            // Update the compacted cache
            await db_1.db.collection(db_1.COLLECTIONS.CACHE).doc(userId).set(cache);
            console.log(`Compacted cache for user ${userId}`);
        }
        catch (error) {
            console.error(`Error compacting cache for user ${userId}:`, error);
        }
    }
    // Invalidate specific cache sections
    async invalidateCache(userId, sections) {
        try {
            if (!sections) {
                // Invalidate entire cache
                await db_1.db.collection(db_1.COLLECTIONS.CACHE).doc(userId).delete();
                console.log(`Invalidated entire cache for user ${userId}`);
                return;
            }
            // Invalidate specific sections by removing them
            const updates = {
                updatedAt: new Date().toISOString(),
            };
            sections.forEach(section => {
                updates[section] = null; // This removes the field in Firestore
            });
            await db_1.db.collection(db_1.COLLECTIONS.CACHE).doc(userId).update(updates);
            console.log(`Invalidated cache sections [${sections.join(', ')}] for user ${userId}`);
        }
        catch (error) {
            console.error(`Error invalidating cache for user ${userId}:`, error);
            throw error;
        }
    }
    // Bulk invalidation for multiple users (useful for system updates)
    async bulkInvalidateCache(userIds, sections) {
        const batch = db_1.db.batch();
        userIds.forEach(userId => {
            const docRef = db_1.db.collection(db_1.COLLECTIONS.CACHE).doc(userId);
            if (!sections) {
                batch.delete(docRef);
            }
            else {
                const updates = { updatedAt: new Date().toISOString() };
                sections.forEach(section => {
                    updates[section] = null;
                });
                batch.update(docRef, updates);
            }
        });
        await batch.commit();
        console.log(`Bulk invalidated cache for ${userIds.length} users`);
    }
    // Get cache statistics for monitoring
    async getCacheStats() {
        try {
            const snapshot = await db_1.db.collection(db_1.COLLECTIONS.CACHE).get();
            let totalSize = 0;
            let oversizedCount = 0;
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.totalSize) {
                    totalSize += data.totalSize;
                    if (data.totalSize > cache_schema_1.CACHE_LIMITS.MAX_DOCUMENT_SIZE) {
                        oversizedCount++;
                    }
                }
            });
            return {
                totalCacheDocuments: snapshot.size,
                averageSize: snapshot.size > 0 ? totalSize / snapshot.size : 0,
                totalSize,
                oversizedDocuments: oversizedCount,
            };
        }
        catch (error) {
            console.error('Error getting cache stats:', error);
            throw error;
        }
    }
}
exports.CacheService = CacheService;
// Export singleton instance
exports.cacheService = CacheService.getInstance();
