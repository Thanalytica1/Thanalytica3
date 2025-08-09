import dotenv from 'dotenv';
import { db, retryFirestoreOperation } from './firebaseAdmin';

// Load environment variables
dotenv.config();

/**
 * Re-export Firestore instance and retry utility for consistency
 * This maintains the same interface as the previous PostgreSQL setup
 */
export { db, retryFirestoreOperation as retryDatabaseOperation };

/**
 * Firestore collection names
 * These replace the PostgreSQL table names from the schema
 */
export const COLLECTIONS = {
  USERS: 'users',
  HEALTH_ASSESSMENTS: 'health_assessments',
  HEALTH_METRICS: 'health_metrics',
  RECOMMENDATIONS: 'recommendations',
  WEARABLE_CONNECTIONS: 'wearable_connections',
  WEARABLES_DATA: 'wearables_data',
  HEALTH_MODELS: 'health_models',
  HEALTH_INSIGHTS: 'health_insights',
  HEALTH_TRENDS: 'health_trends',
  ANALYTICS_EVENTS: 'analytics_events',
  REFERRALS: 'referrals',
  CACHE: 'cache', // Cache collection for cost optimization
} as const;

/**
 * Utility function to generate IDs (replaces database auto-generated IDs)
 */
export function generateId(): string {
  return db.collection('_temp').doc().id;
}

/**
 * Utility function to get current timestamp in Firestore format
 */
export function getCurrentTimestamp() {
  return new Date();
}

/**
 * Utility function to convert Firestore document to plain object
 */
export function docToObject<T>(doc: FirebaseFirestore.DocumentSnapshot): T | undefined {
  if (!doc.exists) return undefined;
  return { id: doc.id, ...doc.data() } as T;
}

/**
 * Utility function to convert Firestore query snapshot to array of objects
 */
export function queryToArray<T>(snapshot: FirebaseFirestore.QuerySnapshot): T[] {
  return snapshot.docs.map(doc => docToObject<T>(doc)!);
}

/**
 * Database health check function
 */
export async function checkDatabaseHealth(): Promise<{ status: 'healthy' | 'unhealthy'; message: string }> {
  try {
    const testRef = db.collection('_health_check').doc('test');
    await testRef.set({ timestamp: getCurrentTimestamp(), status: 'ok' });
    await testRef.delete();
    return { status: 'healthy', message: 'Firestore connection is working' };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: `Firestore connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

// Test connection on startup
checkDatabaseHealth().then(result => {
  if (result.status === 'healthy') {
    console.log('✅ Database health check passed:', result.message);
  } else {
    console.error('❌ Database health check failed:', result.message);
  }
});