import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  Timestamp,
  writeBatch 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { HealthMetric, InsertHealthMetric } from '@shared/health-schema';

const COLLECTIONS = {
  METRICS: 'healthMetrics'
} as const;

export class FirestoreMetricsService {
  static async getHealthMetrics(
    userId: string, 
    type?: string, 
    limit = 100
  ): Promise<HealthMetric[]> {
    try {
      const metricsRef = collection(db, `users/${userId}/${COLLECTIONS.METRICS}`);
      
      let q = query(
        metricsRef,
        orderBy('timestamp', 'desc'),
        firestoreLimit(limit)
      );
      
      if (type) {
        q = query(
          metricsRef,
          where('type', '==', type),
          orderBy('timestamp', 'desc'),
          firestoreLimit(limit)
        );
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
      })) as HealthMetric[];
    } catch (error) {
      console.error('Error fetching health metrics:', error);
      throw new Error('Failed to fetch health metrics');
    }
  }

  static async createHealthMetric(
    userId: string, 
    data: InsertHealthMetric
  ): Promise<HealthMetric> {
    try {
      const metricsRef = collection(db, `users/${userId}/${COLLECTIONS.METRICS}`);
      
      const metricData = {
        ...data,
        userId,
        timestamp: data.timestamp ? Timestamp.fromDate(new Date(data.timestamp)) : Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(metricsRef, metricData);
      
      return {
        id: docRef.id,
        ...metricData,
        timestamp: metricData.timestamp.toDate(),
        createdAt: metricData.createdAt.toDate(),
        updatedAt: metricData.updatedAt.toDate()
      } as HealthMetric;
    } catch (error) {
      console.error('Error creating health metric:', error);
      throw new Error('Failed to create health metric');
    }
  }

  static async getHealthAnalytics(
    userId: string, 
    period = '30d', 
    type?: string
  ): Promise<any> {
    try {
      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }

      const metricsRef = collection(db, `users/${userId}/${COLLECTIONS.METRICS}`);
      
      let q = query(
        metricsRef,
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate)),
        orderBy('timestamp', 'desc')
      );
      
      if (type) {
        q = query(
          metricsRef,
          where('type', '==', type),
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          where('timestamp', '<=', Timestamp.fromDate(endDate)),
          orderBy('timestamp', 'desc')
        );
      }
      
      const snapshot = await getDocs(q);
      const metrics = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
      })) as HealthMetric[];

      // Calculate analytics
      const analytics = this.calculateAnalytics(metrics, period);
      
      return analytics;
    } catch (error) {
      console.error('Error fetching health analytics:', error);
      throw new Error('Failed to fetch health analytics');
    }
  }

  static async getMetricsByType(
    userId: string, 
    type: string, 
    days = 30
  ): Promise<HealthMetric[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      
      const metricsRef = collection(db, `users/${userId}/${COLLECTIONS.METRICS}`);
      
      const q = query(
        metricsRef,
        where('type', '==', type),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate)),
        orderBy('timestamp', 'desc'),
        firestoreLimit(1000)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
      })) as HealthMetric[];
    } catch (error) {
      console.error('Error fetching metrics by type:', error);
      throw new Error('Failed to fetch metrics');
    }
  }

  static async bulkCreateMetrics(
    userId: string, 
    metrics: InsertHealthMetric[]
  ): Promise<HealthMetric[]> {
    try {
      const batch = writeBatch(db);
      const metricsRef = collection(db, `users/${userId}/${COLLECTIONS.METRICS}`);
      const createdMetrics: HealthMetric[] = [];
      
      for (const metric of metrics) {
        const docRef = doc(metricsRef);
        const metricData = {
          ...metric,
          userId,
          timestamp: metric.timestamp ? Timestamp.fromDate(new Date(metric.timestamp)) : Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        batch.set(docRef, metricData);
        
        createdMetrics.push({
          id: docRef.id,
          ...metricData,
          timestamp: metricData.timestamp.toDate(),
          createdAt: metricData.createdAt.toDate(),
          updatedAt: metricData.updatedAt.toDate()
        } as HealthMetric);
      }
      
      await batch.commit();
      return createdMetrics;
    } catch (error) {
      console.error('Error bulk creating metrics:', error);
      throw new Error('Failed to create metrics');
    }
  }

  static async getRealtimeMetrics(userId: string): Promise<Record<string, HealthMetric[]>> {
    try {
      // Get latest 50 metrics across all types
      const metrics = await this.getHealthMetrics(userId, undefined, 50);
      
      // Group by type
      const grouped = metrics.reduce((acc: Record<string, HealthMetric[]>, metric: HealthMetric) => {
        if (!acc[metric.type]) acc[metric.type] = [];
        acc[metric.type].push(metric);
        return acc;
      }, {});
      
      return grouped;
    } catch (error) {
      console.error('Error fetching realtime metrics:', error);
      throw new Error('Failed to fetch realtime metrics');
    }
  }

  private static calculateAnalytics(metrics: HealthMetric[], period: string): any {
    if (metrics.length === 0) {
      return {
        totalMetrics: 0,
        averageValue: 0,
        trend: 'stable',
        trendPercentage: 0,
        periodData: []
      };
    }

    // Group metrics by type for better analysis
    const metricsByType = metrics.reduce((acc: Record<string, HealthMetric[]>, metric) => {
      if (!acc[metric.type]) acc[metric.type] = [];
      acc[metric.type].push(metric);
      return acc;
    }, {});

    const analytics: any = {
      totalMetrics: metrics.length,
      metricTypes: Object.keys(metricsByType),
      byType: {}
    };

    // Calculate analytics for each metric type
    Object.entries(metricsByType).forEach(([type, typeMetrics]) => {
      const values = typeMetrics.map(m => m.value);
      const average = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      // Calculate trend (compare first half vs second half)
      const midpoint = Math.floor(typeMetrics.length / 2);
      const firstHalf = typeMetrics.slice(0, midpoint);
      const secondHalf = typeMetrics.slice(midpoint);
      
      const firstHalfAvg = firstHalf.length > 0 ? 
        firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length : 0;
      const secondHalfAvg = secondHalf.length > 0 ? 
        secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length : 0;
      
      const trendPercentage = firstHalfAvg > 0 ? 
        ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
      
      let trend = 'stable';
      if (trendPercentage > 5) trend = 'increasing';
      else if (trendPercentage < -5) trend = 'decreasing';

      analytics.byType[type] = {
        count: typeMetrics.length,
        averageValue: average,
        minValue: Math.min(...values),
        maxValue: Math.max(...values),
        trend,
        trendPercentage: Math.round(trendPercentage * 100) / 100,
        latest: typeMetrics[0], // Most recent metric
        data: typeMetrics.map(m => ({
          value: m.value,
          timestamp: m.timestamp,
          unit: m.unit
        }))
      };
    });

    return analytics;
  }
}