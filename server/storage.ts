import { db, COLLECTIONS, generateId, getCurrentTimestamp, docToObject, queryToArray } from './db';
import type {
  User,
  InsertUser,
  HealthAssessment,
  InsertHealthAssessment,
  HealthMetrics,
  InsertHealthMetrics,
  Recommendation,
  InsertRecommendation,
  WearableConnection,
  InsertWearableConnection,
  WearablesData,
  InsertWearablesData,
  HealthInsight,
  InsertHealthInsight,
  HealthTrend,
  InsertHealthTrend,
  AnalyticsEvent,
  InsertAnalyticsEvent,
  Referral,
  InsertReferral,
} from '@shared/schema';

async function createDocument<T>(collection: string, id: string, data: any): Promise<T> {
  const ref = db.collection(collection).doc(id);
  await ref.set(data);
  const snap = await ref.get();
  return { id: snap.id, ...snap.data() } as T;
}

export const storage = {
  // Users
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const snap = await db.collection(COLLECTIONS.USERS).where('firebaseUid', '==', firebaseUid).limit(1).get();
    if (snap.empty) return undefined;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  },

  async createUser(data: InsertUser): Promise<User> {
    const id = data.firebaseUid; // use firebaseUid as doc id
    const now = new Date().toISOString();
    const record = { ...data, createdAt: now };
    return createDocument<User>(COLLECTIONS.USERS, id, record);
  },

  // Health Assessments
  async getHealthAssessment(userId: string): Promise<HealthAssessment | undefined> {
    const snap = await db.collection(COLLECTIONS.HEALTH_ASSESSMENTS).where('userId', '==', userId).orderBy('createdAt', 'desc').limit(1).get();
    if (snap.empty) return undefined;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as HealthAssessment;
  },

  async createHealthAssessment(data: InsertHealthAssessment & { userId: string }): Promise<HealthAssessment> {
    const id = generateId();
    const now = new Date().toISOString();
    const record = { ...data, createdAt: now, updatedAt: now };
    return createDocument<HealthAssessment>(COLLECTIONS.HEALTH_ASSESSMENTS, id, record);
  },

  // Health Metrics
  async getHealthMetrics(userId: string): Promise<HealthMetrics | undefined> {
    const snap = await db.collection(COLLECTIONS.HEALTH_METRICS).where('userId', '==', userId).orderBy('createdAt', 'desc').limit(1).get();
    if (snap.empty) return undefined;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as HealthMetrics;
  },

  async createHealthMetrics(data: InsertHealthMetrics & { userId: string }): Promise<HealthMetrics> {
    const id = generateId();
    const now = new Date().toISOString();
    const record = { ...data, createdAt: now };
    return createDocument<HealthMetrics>(COLLECTIONS.HEALTH_METRICS, id, record);
  },

  // Recommendations
  async getRecommendations(userId: string): Promise<Recommendation[]> {
    const snap = await db.collection(COLLECTIONS.RECOMMENDATIONS).where('userId', '==', userId).get();
    return queryToArray<Recommendation>(snap);
  },

  async createRecommendation(data: InsertRecommendation & { userId: string }): Promise<Recommendation> {
    const id = generateId();
    const now = new Date().toISOString();
    const record = { ...data, createdAt: now };
    return createDocument<Recommendation>(COLLECTIONS.RECOMMENDATIONS, id, record);
  },

  // Wearables
  async getWearableConnections(userId: string): Promise<WearableConnection[]> {
    const snap = await db.collection(COLLECTIONS.WEARABLE_CONNECTIONS).where('userId', '==', userId).get();
    return queryToArray<WearableConnection>(snap);
  },

  async getWearableConnection(userId: string, deviceType: string): Promise<WearableConnection | undefined> {
    const snap = await db.collection(COLLECTIONS.WEARABLE_CONNECTIONS)
      .where('userId', '==', userId)
      .where('deviceType', '==', deviceType)
      .limit(1)
      .get();
    if (snap.empty) return undefined;
    return docToObject<WearableConnection>(snap.docs[0]);
  },

  async createWearableConnection(data: InsertWearableConnection): Promise<WearableConnection> {
    const id = generateId();
    const now = new Date().toISOString();
    const record = { isActive: true, ...data, createdAt: now };
    return createDocument<WearableConnection>(COLLECTIONS.WEARABLE_CONNECTIONS, id, record);
  },

  async updateWearableConnection(id: string, updates: Partial<WearableConnection> & { connectionStatus?: string }): Promise<void> {
    await db.collection(COLLECTIONS.WEARABLE_CONNECTIONS).doc(id).update(updates as any);
  },

  async deleteWearableConnection(id: string): Promise<void> {
    await db.collection(COLLECTIONS.WEARABLE_CONNECTIONS).doc(id).delete();
  },

  async getWearableData(userId: string, dataType?: string, startDate?: string, endDate?: string): Promise<WearablesData[]> {
    let query: any = db.collection(COLLECTIONS.WEARABLES_DATA).where('userId', '==', userId);
    if (dataType) query = query.where('device', '==', dataType);
    if (startDate) query = query.where('date', '>=', startDate);
    if (endDate) query = query.where('date', '<=', endDate);
    const snap = await query.get();
    return queryToArray<WearablesData>(snap);
  },

  async getWearablesData(userId: string, startDate?: string, endDate?: string, device?: string): Promise<WearablesData[]> {
    return this.getWearableData(userId, device, startDate, endDate);
  },
  
  async saveWearablesData(data: InsertWearablesData): Promise<WearablesData> {
    const id = generateId();
    const now = new Date().toISOString();
    const record = { ...data, syncedAt: now, createdAt: now };
    return createDocument<WearablesData>(COLLECTIONS.WEARABLES_DATA, id, record);
  },

  // Health AI / Insights / Trends / Models
  async createHealthInsight(data: InsertHealthInsight): Promise<HealthInsight> {
    const id = generateId();
    const now = new Date().toISOString();
    const record = { ...data, createdAt: now };
    return createDocument<HealthInsight>(COLLECTIONS.HEALTH_INSIGHTS, id, record);
  },

  async getHealthInsights(userId: string, type?: string): Promise<HealthInsight[]> {
    let query: any = db.collection(COLLECTIONS.HEALTH_INSIGHTS).where('userId', '==', userId);
    if (type) query = query.where('type', '==', type);
    const snap = await query.get();
    return queryToArray<HealthInsight>(snap);
  },

  async getHealthTrends(userId: string, metricType?: string, limit?: number): Promise<HealthTrend[]> {
    let query: any = db.collection(COLLECTIONS.HEALTH_TRENDS).where('userId', '==', userId);
    if (metricType) query = query.where('metricType', '==', metricType);
    query = query.orderBy('date', 'desc');
    if (limit) query = query.limit(limit);
    const snap = await query.get();
    return queryToArray<HealthTrend>(snap);
  },

  async generateAdvancedMetrics(userId: string) {
    // Placeholder deterministic results
    return {
      biologicalAge: 35,
      diseaseRisks: { cardiovascular: 0.12, metabolic: 0.18 },
      interventionImpact: { exercise: 2.1, sleep: 1.4 },
      lifeExpectancy: 120,
      optimalInterventions: ['strength_training', 'sleep_hygiene'],
    };
  },

  // Analytics
  async createAnalyticsEvent(data: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const id = generateId();
    const now = new Date().toISOString();
    const record = { ...data, timestamp: now };
    return createDocument<AnalyticsEvent>(COLLECTIONS.ANALYTICS_EVENTS, id, record);
  },

  async getAnalyticsEvents(userId: string, opts: { startDate?: string; endDate?: string; eventName?: string; limit?: number; }): Promise<AnalyticsEvent[]> {
    let query: any = db.collection(COLLECTIONS.ANALYTICS_EVENTS).where('userId', '==', userId);
    if (opts.eventName) query = query.where('eventName', '==', opts.eventName);
    if (opts.startDate) query = query.where('timestamp', '>=', opts.startDate);
    if (opts.endDate) query = query.where('timestamp', '<=', opts.endDate);
    query = query.orderBy('timestamp', 'desc');
    if (opts.limit) query = query.limit(opts.limit);
    const snap = await query.get();
    return queryToArray<AnalyticsEvent>(snap);
  },

  async getAnalyticsSummary(userId: string) {
    const snap = await db.collection(COLLECTIONS.ANALYTICS_EVENTS).where('userId', '==', userId).get();
    const events = queryToArray<AnalyticsEvent>(snap);
    const byEvent: Record<string, number> = {};
    for (const e of events) byEvent[e.eventName] = (byEvent[e.eventName] || 0) + 1;
    return { totalEvents: events.length, byEvent };
  },

  // Referrals
  async getUserReferralCode(userId: string): Promise<string | undefined> {
    const snap = await db.collection(COLLECTIONS.REFERRALS)
      .where('referrerUserId', '==', userId)
      .where('status', '==', 'pending')
      .limit(1)
      .get();
    if (snap.empty) return undefined;
    return (snap.docs[0].data() as Referral).referralCode;
  },

  async generateReferralCode(userId: string): Promise<string> {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const id = generateId();
    const now = new Date().toISOString();
    const record: Omit<Referral, 'id'> = {
      referrerUserId: userId,
      referralCode: code,
      status: 'pending',
      createdAt: now,
    };
    await db.collection(COLLECTIONS.REFERRALS).doc(id).set(record);
    return code;
  },

  async getReferralStats(userId: string) {
    const all = await db.collection(COLLECTIONS.REFERRALS).where('referrerUserId', '==', userId).get();
    const referrals = queryToArray<Referral>(all);
    const signedUp = referrals.filter(r => r.status === 'signed_up').length;
    const converted = referrals.filter(r => r.status === 'converted').length;
    return { total: referrals.length, signedUp, converted };
  },

  async getReferralsByUser(userId: string): Promise<Referral[]> {
    const snap = await db.collection(COLLECTIONS.REFERRALS).where('referrerUserId', '==', userId).get();
    return queryToArray<Referral>(snap);
  },

  async createReferral(data: InsertReferral): Promise<Referral> {
    const id = generateId();
    const now = new Date().toISOString();
    const record = { ...data, createdAt: now };
    return createDocument<Referral>(COLLECTIONS.REFERRALS, id, record);
  },

  async trackReferralClick(referralCode: string): Promise<void> {
    const snap = await db.collection(COLLECTIONS.REFERRALS).where('referralCode', '==', referralCode).limit(1).get();
    if (snap.empty) return;
    const ref = snap.docs[0].ref;
    await ref.update({ clickedAt: new Date().toISOString() });
  },
};

export type Storage = typeof storage;

