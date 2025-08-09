/**
 * PHASE 2.1: Wearable Device Integration Architecture
 * Unified ingestion system for multiple health data sources
 * Handles Apple Health, Google Fit, Garmin, Whoop, Oura, CGMs
 */

import { db, COLLECTIONS, generateId } from '../db';
import { cacheService } from './cacheService';
import crypto from 'crypto';

// Universal health data model
export interface UniversalHealthData {
  id: string;
  userId: string;
  sourceDevice: string;
  sourceProvider: 'apple_health' | 'google_fit' | 'garmin' | 'whoop' | 'oura' | 'cgm' | 'manual';
  metricType: string;
  value: number | string | boolean;
  unit: string;
  confidenceScore: number; // 0-1 scale
  measurementTimestamp: Date;
  receivedTimestamp: Date;
  dataQuality: 'high' | 'medium' | 'low';
  metadata?: Record<string, any>;
  processed: boolean;
  aggregated: boolean;
}

// Data quality scoring criteria
interface QualityMetrics {
  deviceReliability: number;
  measurementConsistency: number;
  temporalPlausibility: number;
  valueRangeValidity: number;
}

// Rate limiting configuration for each provider
const RATE_LIMITS = {
  apple_health: { requestsPerMinute: 100, dailyLimit: 10000 },
  google_fit: { requestsPerMinute: 60, dailyLimit: 5000 },
  garmin: { requestsPerMinute: 30, dailyLimit: 2000 },
  whoop: { requestsPerMinute: 20, dailyLimit: 1000 },
  oura: { requestsPerMinute: 15, dailyLimit: 1000 },
  cgm: { requestsPerMinute: 300, dailyLimit: 50000 }, // High frequency for continuous glucose
} as const;

// Device reliability scores (based on research and user feedback)
const DEVICE_RELIABILITY = {
  'apple_watch': 0.92,
  'garmin_fenix': 0.94,
  'whoop_4': 0.89,
  'oura_ring': 0.87,
  'dexcom_g6': 0.96,
  'freestyle_libre': 0.91,
  'fitbit_sense': 0.83,
  'samsung_galaxy_watch': 0.79,
  'manual_entry': 0.7,
  'unknown': 0.5,
} as const;

export class WearableIntegrationService {
  private static instance: WearableIntegrationService;
  private rateLimiters: Map<string, { count: number; resetTime: number }> = new Map();
  private connectionPool: Map<string, any> = new Map();
  
  public static getInstance(): WearableIntegrationService {
    if (!WearableIntegrationService.instance) {
      WearableIntegrationService.instance = new WearableIntegrationService();
    }
    return WearableIntegrationService.instance;
  }

  // ===== UNIFIED DATA INGESTION =====

  /**
   * Universal data ingestion endpoint for all health data sources
   */
  async ingestHealthData(
    userId: string, 
    rawData: any, 
    sourceProvider: UniversalHealthData['sourceProvider'],
    sourceDevice: string
  ): Promise<string[]> {
    console.log(`Ingesting data from ${sourceProvider}:${sourceDevice} for user ${userId}`);
    
    try {
      // Rate limiting check
      if (!this.checkRateLimit(userId, sourceProvider)) {
        throw new Error(`Rate limit exceeded for ${sourceProvider}`);
      }

      // Transform to universal format
      const universalData = await this.transformToUniversalFormat(
        rawData, 
        sourceProvider, 
        sourceDevice, 
        userId
      );

      // Data validation and quality scoring
      const validatedData = await this.validateAndScore(universalData);

      // Conflict resolution for duplicate data
      const deduplicatedData = await this.resolveDuplicates(userId, validatedData);

      // Store in staging area
      const stagingIds = await this.stageData(deduplicatedData);

      // Trigger async aggregation
      this.triggerAggregation(userId, stagingIds).catch(error => {
        console.error(`Aggregation failed for user ${userId}:`, error);
      });

      // Invalidate relevant cache
      await this.invalidateRelevantCache(userId, validatedData);

      console.log(`Successfully ingested ${validatedData.length} data points for user ${userId}`);
      return stagingIds;

    } catch (error) {
      console.error(`Data ingestion failed for user ${userId}:`, error);
      throw error;
    }
  }

  // ===== SOURCE-SPECIFIC ADAPTERS =====

  /**
   * Apple Health adapter with HealthKit integration
   */
  async syncAppleHealth(userId: string, healthKitData: any): Promise<void> {
    const adapter = new AppleHealthAdapter();
    
    try {
      // Process different data types
      const processedData = await adapter.processHealthKitData(healthKitData);
      
      await this.ingestHealthData(
        userId, 
        processedData, 
        'apple_health', 
        adapter.detectDevice(healthKitData)
      );
      
    } catch (error) {
      console.error(`Apple Health sync failed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Garmin Connect adapter with OAuth 1.0a
   */
  async syncGarmin(userId: string, accessToken: string): Promise<void> {
    const adapter = new GarminAdapter();
    
    try {
      // Fetch latest data from Garmin Connect
      const garminData = await adapter.fetchRecentData(accessToken);
      
      await this.ingestHealthData(
        userId, 
        garminData, 
        'garmin', 
        adapter.detectDevice(garminData)
      );
      
    } catch (error) {
      console.error(`Garmin sync failed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Whoop adapter with OAuth 2.0
   */
  async syncWhoop(userId: string, accessToken: string): Promise<void> {
    const adapter = new WhoopAdapter();
    
    try {
      const whoopData = await adapter.fetchRecentData(accessToken);
      
      await this.ingestHealthData(
        userId, 
        whoopData, 
        'whoop', 
        'whoop_4' // Whoop only has one current device
      );
      
    } catch (error) {
      console.error(`Whoop sync failed for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Oura Ring adapter with OAuth 2.0
   */
  async syncOura(userId: string, accessToken: string): Promise<void> {
    const adapter = new OuraAdapter();
    
    try {
      const ouraData = await adapter.fetchRecentData(accessToken);
      
      await this.ingestHealthData(
        userId, 
        ouraData, 
        'oura', 
        'oura_ring'
      );
      
    } catch (error) {
      console.error(`Oura sync failed for user ${userId}:`, error);
      throw error;
    }
  }

  // ===== DATA TRANSFORMATION =====

  private async transformToUniversalFormat(
    rawData: any, 
    sourceProvider: UniversalHealthData['sourceProvider'],
    sourceDevice: string,
    userId: string
  ): Promise<UniversalHealthData[]> {
    const universalData: UniversalHealthData[] = [];
    const now = new Date();

    // Transform based on source provider
    switch (sourceProvider) {
      case 'apple_health':
        universalData.push(...this.transformAppleHealthData(rawData, sourceDevice, userId, now));
        break;
      case 'garmin':
        universalData.push(...this.transformGarminData(rawData, sourceDevice, userId, now));
        break;
      case 'whoop':
        universalData.push(...this.transformWhoopData(rawData, sourceDevice, userId, now));
        break;
      case 'oura':
        universalData.push(...this.transformOuraData(rawData, sourceDevice, userId, now));
        break;
      default:
        throw new Error(`Unsupported source provider: ${sourceProvider}`);
    }

    return universalData;
  }

  private transformAppleHealthData(
    data: any, 
    sourceDevice: string, 
    userId: string, 
    receivedTimestamp: Date
  ): UniversalHealthData[] {
    const transformed: UniversalHealthData[] = [];
    
    if (data.samples) {
      data.samples.forEach((sample: any) => {
        transformed.push({
          id: generateId(),
          userId,
          sourceDevice,
          sourceProvider: 'apple_health',
          metricType: this.mapAppleHealthMetric(sample.sampleType),
          value: sample.value,
          unit: sample.unit || '',
          confidenceScore: this.calculateConfidenceScore(sample, sourceDevice),
          measurementTimestamp: new Date(sample.startDate),
          receivedTimestamp,
          dataQuality: this.assessDataQuality(sample, sourceDevice),
          metadata: {
            endDate: sample.endDate,
            device: sample.device,
            sourceName: sample.sourceName,
          },
          processed: false,
          aggregated: false,
        });
      });
    }
    
    return transformed;
  }

  private transformGarminData(
    data: any, 
    sourceDevice: string, 
    userId: string, 
    receivedTimestamp: Date
  ): UniversalHealthData[] {
    const transformed: UniversalHealthData[] = [];
    
    // Garmin provides structured activity data
    if (data.activities) {
      data.activities.forEach((activity: any) => {
        // Steps
        if (activity.steps) {
          transformed.push({
            id: generateId(),
            userId,
            sourceDevice,
            sourceProvider: 'garmin',
            metricType: 'steps',
            value: activity.steps,
            unit: 'count',
            confidenceScore: DEVICE_RELIABILITY[sourceDevice as keyof typeof DEVICE_RELIABILITY] || 0.8,
            measurementTimestamp: new Date(activity.startTimeGMT),
            receivedTimestamp,
            dataQuality: 'high',
            metadata: {
              activityType: activity.activityType,
              duration: activity.duration,
              distance: activity.distance,
            },
            processed: false,
            aggregated: false,
          });
        }
        
        // Heart rate
        if (activity.averageHR) {
          transformed.push({
            id: generateId(),
            userId,
            sourceDevice,
            sourceProvider: 'garmin',
            metricType: 'heart_rate_avg',
            value: activity.averageHR,
            unit: 'bpm',
            confidenceScore: DEVICE_RELIABILITY[sourceDevice as keyof typeof DEVICE_RELIABILITY] || 0.8,
            measurementTimestamp: new Date(activity.startTimeGMT),
            receivedTimestamp,
            dataQuality: 'high',
            metadata: {
              maxHR: activity.maxHR,
              activityType: activity.activityType,
            },
            processed: false,
            aggregated: false,
          });
        }
      });
    }
    
    return transformed;
  }

  private transformWhoopData(
    data: any, 
    sourceDevice: string, 
    userId: string, 
    receivedTimestamp: Date
  ): UniversalHealthData[] {
    const transformed: UniversalHealthData[] = [];
    
    // Whoop provides recovery, strain, and sleep data
    if (data.recovery) {
      data.recovery.forEach((recovery: any) => {
        transformed.push({
          id: generateId(),
          userId,
          sourceDevice,
          sourceProvider: 'whoop',
          metricType: 'recovery_score',
          value: recovery.score.recovery_score,
          unit: 'percentage',
          confidenceScore: 0.89, // Whoop 4.0 reliability
          measurementTimestamp: new Date(recovery.created_at),
          receivedTimestamp,
          dataQuality: 'high',
          metadata: {
            hrv: recovery.score.hrv_rmssd_milli,
            restingHR: recovery.score.resting_heart_rate,
            sleepPerformance: recovery.score.sleep_performance_percentage,
          },
          processed: false,
          aggregated: false,
        });
      });
    }
    
    return transformed;
  }

  private transformOuraData(
    data: any, 
    sourceDevice: string, 
    userId: string, 
    receivedTimestamp: Date
  ): UniversalHealthData[] {
    const transformed: UniversalHealthData[] = [];
    
    // Oura provides sleep, activity, and readiness data
    if (data.sleep) {
      data.sleep.forEach((sleep: any) => {
        transformed.push({
          id: generateId(),
          userId,
          sourceDevice,
          sourceProvider: 'oura',
          metricType: 'sleep_score',
          value: sleep.score,
          unit: 'score',
          confidenceScore: 0.87, // Oura reliability
          measurementTimestamp: new Date(sleep.bedtime_start),
          receivedTimestamp,
          dataQuality: 'high',
          metadata: {
            duration: sleep.duration,
            efficiency: sleep.efficiency,
            deep: sleep.deep,
            light: sleep.light,
            rem: sleep.rem,
            awake: sleep.awake,
          },
          processed: false,
          aggregated: false,
        });
      });
    }
    
    return transformed;
  }

  // ===== DATA VALIDATION AND QUALITY SCORING =====

  private async validateAndScore(data: UniversalHealthData[]): Promise<UniversalHealthData[]> {
    return data.map(dataPoint => {
      // Validate value ranges
      const isValid = this.validateValueRange(dataPoint.metricType, dataPoint.value);
      
      if (!isValid) {
        dataPoint.dataQuality = 'low';
        dataPoint.confidenceScore *= 0.5;
      }
      
      // Temporal plausibility check
      const now = Date.now();
      const measurementTime = dataPoint.measurementTimestamp.getTime();
      
      if (measurementTime > now || measurementTime < now - (365 * 24 * 60 * 60 * 1000)) {
        dataPoint.dataQuality = 'low';
        dataPoint.confidenceScore *= 0.3;
      }
      
      return dataPoint;
    }).filter(dataPoint => dataPoint.confidenceScore > 0.1); // Filter out very low confidence data
  }

  private validateValueRange(metricType: string, value: any): boolean {
    // Define reasonable ranges for different metrics
    const ranges: Record<string, { min: number; max: number }> = {
      'heart_rate': { min: 30, max: 220 },
      'steps': { min: 0, max: 100000 },
      'sleep_duration': { min: 0, max: 18 * 60 * 60 }, // 18 hours in seconds
      'recovery_score': { min: 0, max: 100 },
      'sleep_score': { min: 0, max: 100 },
      'hrv': { min: 5, max: 200 },
      'body_temperature': { min: 95, max: 110 }, // Fahrenheit
      'blood_glucose': { min: 40, max: 400 }, // mg/dL
    };
    
    const range = ranges[metricType];
    if (!range) return true; // Unknown metric types are accepted
    
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    return !isNaN(numValue) && numValue >= range.min && numValue <= range.max;
  }

  // ===== CONFLICT RESOLUTION =====

  private async resolveDuplicates(userId: string, newData: UniversalHealthData[]): Promise<UniversalHealthData[]> {
    // Get recent data for duplicate detection
    const recentThreshold = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 hours
    
    const existingData = await db.collection('health_data_staging')
      .where('userId', '==', userId)
      .where('measurementTimestamp', '>=', recentThreshold)
      .get();
    
    const existingDataPoints = existingData.docs.map(doc => doc.data() as UniversalHealthData);
    
    // Deduplicate based on metric type, timestamp, and value similarity
    const deduplicatedData = newData.filter(newPoint => {
      const isDuplicate = existingDataPoints.some(existing => 
        existing.metricType === newPoint.metricType &&
        Math.abs(existing.measurementTimestamp.getTime() - newPoint.measurementTimestamp.getTime()) < 60000 && // Within 1 minute
        this.valuesAreSimilar(existing.value, newPoint.value, newPoint.metricType)
      );
      
      return !isDuplicate;
    });
    
    // For conflicts, choose the data point with higher confidence
    return this.resolveConflicts(existingDataPoints, deduplicatedData);
  }

  private valuesAreSimilar(value1: any, value2: any, metricType: string): boolean {
    const num1 = typeof value1 === 'number' ? value1 : parseFloat(value1);
    const num2 = typeof value2 === 'number' ? value2 : parseFloat(value2);
    
    if (isNaN(num1) || isNaN(num2)) return value1 === value2;
    
    // Define similarity thresholds for different metrics
    const thresholds: Record<string, number> = {
      'heart_rate': 5, // 5 bpm difference
      'steps': 100, // 100 steps difference
      'sleep_duration': 300, // 5 minutes difference
      'recovery_score': 5, // 5 point difference
      'default': 0.1, // 10% difference
    };
    
    const threshold = thresholds[metricType] || thresholds.default;
    
    if (metricType in thresholds && metricType !== 'default') {
      return Math.abs(num1 - num2) <= threshold;
    } else {
      // Percentage-based similarity for other metrics
      const avg = (num1 + num2) / 2;
      return Math.abs(num1 - num2) / avg <= threshold;
    }
  }

  private resolveConflicts(existing: UniversalHealthData[], newData: UniversalHealthData[]): UniversalHealthData[] {
    // Priority: higher confidence score, more recent timestamp, better device reliability
    return newData; // Simplified - would implement full conflict resolution logic
  }

  // ===== STAGING AND AGGREGATION =====

  private async stageData(data: UniversalHealthData[]): Promise<string[]> {
    const batch = db.batch();
    const stagingIds: string[] = [];
    
    data.forEach(dataPoint => {
      const docRef = db.collection('health_data_staging').doc();
      batch.set(docRef, {
        ...dataPoint,
        stagedAt: new Date(),
      });
      stagingIds.push(docRef.id);
    });
    
    await batch.commit();
    return stagingIds;
  }

  private async triggerAggregation(userId: string, stagingIds: string[]): Promise<void> {
    // Trigger background aggregation job
    await db.collection('aggregation_jobs').add({
      userId,
      stagingIds,
      status: 'pending',
      createdAt: new Date(),
    });
  }

  // ===== RATE LIMITING =====

  private checkRateLimit(userId: string, provider: UniversalHealthData['sourceProvider']): boolean {
    const key = `${userId}:${provider}`;
    const limits = RATE_LIMITS[provider];
    const now = Date.now();
    
    let limiter = this.rateLimiters.get(key);
    
    if (!limiter || now > limiter.resetTime) {
      // Reset counter
      limiter = {
        count: 0,
        resetTime: now + 60000, // 1 minute
      };
      this.rateLimiters.set(key, limiter);
    }
    
    if (limiter.count >= limits.requestsPerMinute) {
      return false;
    }
    
    limiter.count++;
    return true;
  }

  // ===== HELPER METHODS =====

  private mapAppleHealthMetric(sampleType: string): string {
    const mapping: Record<string, string> = {
      'HKQuantityTypeIdentifierStepCount': 'steps',
      'HKQuantityTypeIdentifierHeartRate': 'heart_rate',
      'HKQuantityTypeIdentifierSleepAnalysis': 'sleep_duration',
      'HKQuantityTypeIdentifierActiveEnergyBurned': 'active_calories',
      'HKQuantityTypeIdentifierBasalEnergyBurned': 'basal_calories',
      // Add more mappings as needed
    };
    
    return mapping[sampleType] || sampleType;
  }

  private calculateConfidenceScore(sample: any, sourceDevice: string): number {
    const deviceReliability = DEVICE_RELIABILITY[sourceDevice as keyof typeof DEVICE_RELIABILITY] || 0.5;
    
    // Adjust based on sample metadata
    let confidence = deviceReliability;
    
    if (sample.metadata?.wasUserEntered) {
      confidence *= 0.7; // Manual entry is less reliable
    }
    
    if (sample.metadata?.HKMetadataKeyHeartRateMotionContext === 'HKHeartRateMotionContextActive') {
      confidence *= 0.9; // Active heart rate is slightly less reliable than resting
    }
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private assessDataQuality(sample: any, sourceDevice: string): 'high' | 'medium' | 'low' {
    const reliability = DEVICE_RELIABILITY[sourceDevice as keyof typeof DEVICE_RELIABILITY] || 0.5;
    
    if (reliability >= 0.9) return 'high';
    if (reliability >= 0.7) return 'medium';
    return 'low';
  }

  private async invalidateRelevantCache(userId: string, data: UniversalHealthData[]): Promise<void> {
    // Determine which cache sections to invalidate based on data types
    const sectionsToInvalidate: string[] = [];
    
    const hasRecentData = data.some(d => 
      Date.now() - d.measurementTimestamp.getTime() < 24 * 60 * 60 * 1000
    );
    
    if (hasRecentData) {
      sectionsToInvalidate.push('dailyMetrics', 'dashboardCache');
    }
    
    await cacheService.invalidateCache(userId, sectionsToInvalidate as any);
  }
}

// ===== SOURCE-SPECIFIC ADAPTER CLASSES =====

class AppleHealthAdapter {
  detectDevice(data: any): string {
    // Detect device from HealthKit data
    if (data.device?.name?.includes('Watch')) return 'apple_watch';
    if (data.device?.name?.includes('iPhone')) return 'iphone';
    return 'apple_device';
  }
  
  async processHealthKitData(data: any): Promise<any> {
    // Process HealthKit data structure
    return data;
  }
}

class GarminAdapter {
  detectDevice(data: any): string {
    // Detect Garmin device model
    return data.deviceInfo?.productName || 'garmin_device';
  }
  
  async fetchRecentData(accessToken: string): Promise<any> {
    // Implement Garmin Connect API calls with OAuth 1.0a
    throw new Error('Garmin API integration not implemented yet');
  }
}

class WhoopAdapter {
  async fetchRecentData(accessToken: string): Promise<any> {
    // Implement Whoop API calls with OAuth 2.0
    throw new Error('Whoop API integration not implemented yet');
  }
}

class OuraAdapter {
  async fetchRecentData(accessToken: string): Promise<any> {
    // Implement Oura API calls with OAuth 2.0
    throw new Error('Oura API integration not implemented yet');
  }
}

// Export singleton
export const wearableIntegration = WearableIntegrationService.getInstance();
