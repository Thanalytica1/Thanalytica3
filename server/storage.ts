import { 
  type User, 
  type InsertUser, 
  type HealthAssessment, 
  type InsertHealthAssessment,
  type HealthMetrics,
  type InsertHealthMetrics,
  type Recommendation,
  type InsertRecommendation,
  type WearableConnection,
  type InsertWearableConnection,
  type WearableData,
  type InsertWearableData,
  type HealthModel,
  type InsertHealthModel,
  type HealthInsight,
  type InsertHealthInsight,
  type HealthTrend,
  type InsertHealthTrend,
  type AnalyticsEvent,
  type InsertAnalyticsEvent,
  users,
  healthAssessments,
  healthMetrics,
  recommendations,
  wearableConnections,
  wearableData,
  healthModels,
  healthInsights,
  healthTrends,
  analyticsEvents
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Health Assessment methods
  getHealthAssessment(userId: string): Promise<HealthAssessment | undefined>;
  createHealthAssessment(assessment: InsertHealthAssessment & { userId: string }): Promise<HealthAssessment>;
  
  // Health Metrics methods
  getHealthMetrics(userId: string): Promise<HealthMetrics | undefined>;
  createHealthMetrics(metrics: InsertHealthMetrics): Promise<HealthMetrics>;
  
  // Recommendations methods
  getRecommendations(userId: string): Promise<Recommendation[]>;
  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation>;
  
  // Wearable Device methods
  getWearableConnections(userId: string): Promise<WearableConnection[]>;
  createWearableConnection(connection: InsertWearableConnection): Promise<WearableConnection>;
  updateWearableConnection(id: string, updates: Partial<WearableConnection>): Promise<WearableConnection>;
  deleteWearableConnection(id: string): Promise<void>;
  getWearableData(userId: string, dataType?: string, startDate?: string, endDate?: string): Promise<WearableData[]>;
  createWearableData(data: InsertWearableData): Promise<WearableData>;
  
  // AI and Advanced Analytics methods
  createHealthModel(model: InsertHealthModel): Promise<HealthModel>;
  getLatestHealthModel(userId: string): Promise<HealthModel | undefined>;
  createHealthInsight(insight: InsertHealthInsight): Promise<HealthInsight>;
  getHealthInsights(userId: string, type?: string): Promise<HealthInsight[]>;
  createHealthTrend(trend: InsertHealthTrend): Promise<HealthTrend>;
  getHealthTrends(userId: string, metricType?: string, limit?: number): Promise<HealthTrend[]>;
  generateAdvancedMetrics(userId: string): Promise<any>;
  
  // Analytics methods
  createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getAnalyticsEvents(userId: string, options?: {
    startDate?: string;
    endDate?: string;
    eventName?: string;
    limit?: number;
  }): Promise<AnalyticsEvent[]>;
  getAnalyticsSummary(userId: string): Promise<{
    totalEvents: number;
    uniqueSessions: number;
    topEvents: { eventName: string; count: number }[];
    lastActivity: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        displayName: insertUser.displayName || null,
        photoURL: insertUser.photoURL || null,
      })
      .returning();
    return user;
  }

  async getHealthAssessment(userId: string): Promise<HealthAssessment | undefined> {
    const [assessment] = await db
      .select()
      .from(healthAssessments)
      .where(eq(healthAssessments.userId, userId));
    return assessment || undefined;
  }

  async createHealthAssessment(data: InsertHealthAssessment & { userId: string }): Promise<HealthAssessment> {
    // Simple AI analysis simulation
    const biologicalAge = this.calculateBiologicalAge(data);
    const vitalityScore = this.calculateVitalityScore(data);
    const riskAssessment = this.calculateRiskAssessment(data);
    const trajectoryRating = this.calculateTrajectoryRating(vitalityScore);
    
    const [assessment] = await db
      .insert(healthAssessments)
      .values({
        ...data,
        height: data.height || null,
        weight: data.weight || null,
        chronicConditions: data.chronicConditions || null,
        medications: data.medications || null,
        familyHistory: data.familyHistory || null,
        biologicalAge,
        vitalityScore,
        riskAssessment,
        trajectoryRating,
        completedAt: new Date(),
      })
      .returning();
    
    // Create corresponding health metrics
    await this.createHealthMetrics({
      userId: data.userId,
      assessmentId: assessment.id,
      sleepScore: this.calculateSleepScore(data),
      exerciseScore: this.calculateExerciseScore(data),
      nutritionScore: this.calculateNutritionScore(data),
      stressScore: this.calculateStressScore(data),
      cognitiveScore: this.calculateCognitiveScore(data),
      cardiovascularRisk: this.calculateCardiovascularRisk(data),
      metabolicRisk: this.calculateMetabolicRisk(data),
      cognitiveRisk: "low",
      projectedLifespan: trajectoryRating === "OPTIMAL" ? 150 : trajectoryRating === "MODERATE" ? 140 : 130,
      optimizationPotential: Math.round((100 - vitalityScore) * 0.5),
    });
    
    // Generate recommendations
    await this.generateRecommendations(data.userId, assessment.id, assessment);
    
    return assessment;
  }

  async getHealthMetrics(userId: string): Promise<HealthMetrics | undefined> {
    const [metrics] = await db
      .select()
      .from(healthMetrics)
      .where(eq(healthMetrics.userId, userId));
    return metrics || undefined;
  }

  async createHealthMetrics(data: InsertHealthMetrics): Promise<HealthMetrics> {
    const [metrics] = await db
      .insert(healthMetrics)
      .values({
        ...data,
        assessmentId: data.assessmentId || null,
        sleepScore: data.sleepScore || null,
        exerciseScore: data.exerciseScore || null,
        nutritionScore: data.nutritionScore || null,
        stressScore: data.stressScore || null,
        cognitiveScore: data.cognitiveScore || null,
        cardiovascularRisk: data.cardiovascularRisk || null,
        metabolicRisk: data.metabolicRisk || null,
        cognitiveRisk: data.cognitiveRisk || null,
        projectedLifespan: data.projectedLifespan || null,
        optimizationPotential: data.optimizationPotential || null,
      })
      .returning();
    return metrics;
  }

  async getRecommendations(userId: string): Promise<Recommendation[]> {
    return await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.userId, userId));
  }

  async createRecommendation(data: InsertRecommendation): Promise<Recommendation> {
    const [recommendation] = await db
      .insert(recommendations)
      .values({
        ...data,
        estimatedImpact: data.estimatedImpact || null,
        implemented: data.implemented || false,
        implementedAt: data.implementedAt || null,
      })
      .returning();
    return recommendation;
  }

  // AI Analysis Helper Methods
  private calculateBiologicalAge(data: InsertHealthAssessment & { userId: string }): number {
    let biologicalAge = data.age;
    
    // Sleep impact
    if (data.sleepQuality === "excellent" && data.sleepDuration === "7-8") {
      biologicalAge -= 3;
    } else if (data.sleepQuality === "poor" || data.sleepDuration === "less-than-6") {
      biologicalAge += 2;
    }
    
    // Exercise impact
    if (data.exerciseFrequency === "daily" || data.exerciseFrequency === "5-6-times") {
      biologicalAge -= 4;
    } else if (data.exerciseFrequency === "none") {
      biologicalAge += 5;
    }
    
    // Lifestyle factors
    if (data.smokingStatus === "current") {
      biologicalAge += 8;
    } else if (data.smokingStatus === "never") {
      biologicalAge -= 2;
    }
    
    if (data.alcoholConsumption === "heavy") {
      biologicalAge += 3;
    } else if (data.alcoholConsumption === "none" || data.alcoholConsumption === "occasional") {
      biologicalAge -= 1;
    }
    
    return Math.max(biologicalAge, data.age - 15); // Cap the reduction
  }

  private calculateVitalityScore(data: InsertHealthAssessment & { userId: string }): number {
    let score = 70; // Base score
    
    // Sleep contribution (20 points)
    if (data.sleepQuality === "excellent") score += 20;
    else if (data.sleepQuality === "good") score += 15;
    else if (data.sleepQuality === "fair") score += 10;
    
    // Exercise contribution (20 points)
    if (data.exerciseFrequency === "daily") score += 20;
    else if (data.exerciseFrequency === "5-6-times") score += 18;
    else if (data.exerciseFrequency === "3-4-times") score += 15;
    else if (data.exerciseFrequency === "1-2-times") score += 8;
    
    // Diet contribution (10 points)
    if (data.dietPattern === "mediterranean" || data.dietPattern === "plant-based") score += 10;
    else if (data.dietPattern === "balanced") score += 7;
    
    return Math.min(score, 100);
  }

  private calculateRiskAssessment(data: InsertHealthAssessment & { userId: string }): string {
    let riskFactors = 0;
    
    if (data.smokingStatus === "current") riskFactors += 3;
    if (data.alcoholConsumption === "heavy") riskFactors += 2;
    if (data.exerciseFrequency === "none") riskFactors += 2;
    if (data.sleepQuality === "poor") riskFactors += 1;
    if (data.chronicConditions && data.chronicConditions.length > 0 && !data.chronicConditions.includes("none")) riskFactors += 2;
    
    if (riskFactors >= 5) return "high";
    if (riskFactors >= 3) return "moderate";
    return "low";
  }

  private calculateTrajectoryRating(vitalityScore: number): string {
    if (vitalityScore >= 85) return "OPTIMAL";
    if (vitalityScore >= 70) return "MODERATE";
    return "NEEDS_IMPROVEMENT";
  }

  private calculateSleepScore(data: InsertHealthAssessment & { userId: string }): number {
    let score = 50;
    
    if (data.sleepQuality === "excellent") score += 40;
    else if (data.sleepQuality === "good") score += 30;
    else if (data.sleepQuality === "fair") score += 15;
    
    if (data.sleepDuration === "7-8" || data.sleepDuration === "8-9") score += 10;
    else if (data.sleepDuration === "6-7") score += 5;
    
    return Math.min(score, 100);
  }

  private calculateExerciseScore(data: InsertHealthAssessment & { userId: string }): number {
    let score = 20;
    
    if (data.exerciseFrequency === "daily") score += 40;
    else if (data.exerciseFrequency === "5-6-times") score += 35;
    else if (data.exerciseFrequency === "3-4-times") score += 25;
    else if (data.exerciseFrequency === "1-2-times") score += 10;
    
    if (data.exerciseTypes && data.exerciseTypes.length >= 3) score += 15;
    else if (data.exerciseTypes && data.exerciseTypes.length >= 2) score += 10;
    
    return Math.min(score, 100);
  }

  private calculateNutritionScore(data: InsertHealthAssessment & { userId: string }): number {
    let score = 50;
    
    if (data.dietPattern === "mediterranean") score += 30;
    else if (data.dietPattern === "plant-based") score += 25;
    else if (data.dietPattern === "balanced") score += 20;
    
    if (data.alcoholConsumption === "none") score += 15;
    else if (data.alcoholConsumption === "occasional") score += 10;
    else if (data.alcoholConsumption === "heavy") score -= 20;
    
    return Math.max(Math.min(score, 100), 0);
  }

  private calculateStressScore(data: InsertHealthAssessment & { userId: string }): number {
    // Base stress management score - would be enhanced with actual stress-related questions
    let score = 60;
    
    if (data.sleepQuality === "excellent") score += 15;
    if (data.exerciseFrequency === "daily" || data.exerciseFrequency === "5-6-times") score += 15;
    if (data.healthPriorities && data.healthPriorities.includes("stress-management")) score += 10;
    
    return Math.min(score, 100);
  }

  private calculateCognitiveScore(data: InsertHealthAssessment & { userId: string }): number {
    let score = 70;
    
    if (data.exerciseFrequency === "daily" || data.exerciseFrequency === "5-6-times") score += 15;
    if (data.sleepQuality === "excellent") score += 10;
    if (data.dietPattern === "mediterranean") score += 5; // Mediterranean diet is good for brain health
    
    return Math.min(score, 100);
  }

  private calculateCardiovascularRisk(data: InsertHealthAssessment & { userId: string }): string {
    let riskFactors = 0;
    
    if (data.smokingStatus === "current") riskFactors += 2;
    if (data.exerciseFrequency === "none") riskFactors += 1;
    if (data.alcoholConsumption === "heavy") riskFactors += 1;
    if (data.chronicConditions && (data.chronicConditions.includes("hypertension") || data.chronicConditions.includes("heart-disease"))) riskFactors += 2;
    
    if (riskFactors >= 3) return "high";
    if (riskFactors >= 2) return "moderate";
    return "low";
  }

  private calculateMetabolicRisk(data: InsertHealthAssessment & { userId: string }): string {
    let riskFactors = 0;
    
    if (data.exerciseFrequency === "none") riskFactors += 1;
    if (data.chronicConditions && data.chronicConditions.includes("diabetes")) riskFactors += 2;
    if (data.dietPattern === "other") riskFactors += 1; // Assuming "other" might be less optimal
    
    if (riskFactors >= 2) return "moderate";
    return "low";
  }

  // Wearable Device Methods
  async getWearableConnections(userId: string): Promise<WearableConnection[]> {
    return await db
      .select()
      .from(wearableConnections)
      .where(eq(wearableConnections.userId, userId));
  }

  async createWearableConnection(data: InsertWearableConnection): Promise<WearableConnection> {
    const [connection] = await db
      .insert(wearableConnections)
      .values({
        ...data,
        accessToken: data.accessToken || null,
        refreshToken: data.refreshToken || null,
        lastSyncAt: data.lastSyncAt || null,
      })
      .returning();
    return connection;
  }

  async updateWearableConnection(id: string, updates: Partial<WearableConnection>): Promise<WearableConnection> {
    const [connection] = await db
      .update(wearableConnections)
      .set(updates)
      .where(eq(wearableConnections.id, id))
      .returning();
    return connection;
  }

  async deleteWearableConnection(id: string): Promise<void> {
    await db
      .delete(wearableConnections)
      .where(eq(wearableConnections.id, id));
  }

  async getWearableData(userId: string, dataType?: string, startDate?: string, endDate?: string): Promise<WearableData[]> {
    let query = db
      .select()
      .from(wearableData)
      .where(eq(wearableData.userId, userId));

    // Add filters if provided
    // Note: This is a simplified implementation - in production you'd use proper date filtering
    return await query;
  }

  async createWearableData(data: InsertWearableData): Promise<WearableData> {
    const [wearableDataEntry] = await db
      .insert(wearableData)
      .values(data)
      .returning();
    return wearableDataEntry;
  }

  // AI and Advanced Analytics Methods
  async createHealthModel(data: InsertHealthModel): Promise<HealthModel> {
    const [model] = await db
      .insert(healthModels)
      .values(data)
      .returning();
    return model;
  }

  async getLatestHealthModel(userId: string): Promise<HealthModel | undefined> {
    const [model] = await db
      .select()
      .from(healthModels)
      .where(eq(healthModels.userId, userId))
      .orderBy(desc(healthModels.createdAt))
      .limit(1);
    return model || undefined;
  }

  async createHealthInsight(data: InsertHealthInsight): Promise<HealthInsight> {
    const [insight] = await db
      .insert(healthInsights)
      .values(data)
      .returning();
    return insight;
  }

  async getHealthInsights(userId: string, type?: string): Promise<HealthInsight[]> {
    const whereConditions = type 
      ? and(eq(healthInsights.userId, userId), eq(healthInsights.type, type))
      : eq(healthInsights.userId, userId);

    return await db
      .select()
      .from(healthInsights)
      .where(whereConditions)
      .orderBy(desc(healthInsights.createdAt))
      .limit(20);
  }

  async createHealthTrend(data: InsertHealthTrend): Promise<HealthTrend> {
    const [trend] = await db
      .insert(healthTrends)
      .values(data)
      .returning();
    return trend;
  }

  async getHealthTrends(userId: string, metricType?: string, limit: number = 50): Promise<HealthTrend[]> {
    const whereConditions = metricType 
      ? and(eq(healthTrends.userId, userId), eq(healthTrends.metricType, metricType))
      : eq(healthTrends.userId, userId);

    return await db
      .select()
      .from(healthTrends)
      .where(whereConditions)
      .orderBy(desc(healthTrends.date))
      .limit(limit);
  }

  async generateAdvancedMetrics(userId: string): Promise<any> {
    // Get all user data for comprehensive analysis
    const user = await this.getUser(userId);
    const assessment = await this.getHealthAssessment(userId);
    const metrics = await this.getHealthMetrics(userId);
    const wearableData = await this.getWearableData(userId);
    const trends = await this.getHealthTrends(userId);

    if (!assessment || !metrics) {
      throw new Error("Insufficient data for advanced metrics generation");
    }

    // Create comprehensive data object for AI analysis
    const comprehensiveData = {
      chronologicalAge: assessment.age,
      sleepScore: metrics.sleepScore || 70,
      exerciseScore: metrics.exerciseScore || 60,
      nutritionScore: metrics.nutritionScore || 65,
      stressScore: metrics.stressScore || 60,
      cognitiveScore: metrics.cognitiveScore || 75,
      wearableData: wearableData || [],
      historicalTrends: trends || []
    };

    // Generate advanced biological age with confidence
    const biologicalAgeResult = this.calculateAdvancedBiologicalAge(comprehensiveData);
    
    // Calculate disease risks
    const diseaseRisks = this.calculateAdvancedDiseaseRisks(comprehensiveData);
    
    // Calculate intervention impacts
    const interventionImpact = this.calculateAdvancedInterventionImpact(
      comprehensiveData, 
      ['strength training', 'meditation', 'sleep optimization', 'nutrition coaching']
    );

    // Create health model entry
    const modelData = {
      userId,
      modelVersion: "v2.1",
      inputFeatures: comprehensiveData,
      predictions: {
        biologicalAge: biologicalAgeResult.age,
        diseaseRisks,
        interventionImpact,
        lifeExpectancy: this.calculateLifeExpectancy(biologicalAgeResult.age, diseaseRisks),
        optimalInterventions: Object.entries(interventionImpact)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 3)
          .map(([intervention]) => intervention)
      },
      confidence: biologicalAgeResult.confidence
    };

    await this.createHealthModel(modelData);

    // Create trend entries for tracking
    const today = new Date().toISOString().split('T')[0];
    
    await this.createHealthTrend({
      userId,
      metricType: 'biological_age',
      date: today,
      value: biologicalAgeResult.age,
      trend: this.determineTrend(biologicalAgeResult.age, trends, 'biological_age'),
      dataSource: 'ai_model'
    });

    await this.createHealthTrend({
      userId,
      metricType: 'vitality_score',
      date: today,
      value: metrics.sleepScore || 70,
      trend: this.determineTrend(metrics.sleepScore || 70, trends, 'vitality_score'),
      dataSource: 'assessment'
    });

    return modelData.predictions;
  }

  private calculateLifeExpectancy(biologicalAge: number, diseaseRisks: Record<string, number>): number {
    let baseExpectancy = 150; // Optimistic longevity assumption
    
    // Adjust based on biological age
    const ageDifference = biologicalAge - 35; // Assuming 35 as baseline optimal age
    baseExpectancy -= ageDifference * 0.5;
    
    // Adjust based on disease risks
    const avgRisk = Object.values(diseaseRisks).reduce((sum, risk) => sum + risk, 0) / Object.values(diseaseRisks).length;
    baseExpectancy -= avgRisk * 20;
    
    return Math.max(baseExpectancy, 85); // Minimum reasonable expectancy
  }

  private determineTrend(currentValue: number, historicalTrends: HealthTrend[], metricType: string): string {
    const relevantTrends = historicalTrends
      .filter(t => t.metricType === metricType)
      .slice(0, 5); // Last 5 data points
    
    if (relevantTrends.length < 2) return 'stable';
    
    const previousValue = relevantTrends[1].value;
    const change = currentValue - previousValue;
    
    if (Math.abs(change) < 2) return 'stable';
    return change > 0 ? 'improving' : 'declining';
  }

  private calculateAdvancedBiologicalAge(metrics: any): { age: number; confidence: number } {
    let biologicalAge = metrics.chronologicalAge || 35;
    let confidenceScore = 0.7;

    // Enhanced sleep analysis
    if (metrics.sleepScore) {
      const sleepImpact = (metrics.sleepScore - 70) * 0.1;
      biologicalAge -= sleepImpact;
      confidenceScore += 0.1;
    }

    // Exercise with intensity weighting
    if (metrics.exerciseScore) {
      const exerciseImpact = (metrics.exerciseScore - 60) * 0.15;
      biologicalAge -= exerciseImpact;
      confidenceScore += 0.1;
    }

    // Nutrition and lifestyle factors
    if (metrics.nutritionScore) {
      const nutritionImpact = (metrics.nutritionScore - 65) * 0.12;
      biologicalAge -= nutritionImpact;
      confidenceScore += 0.05;
    }

    // Stress management impact
    if (metrics.stressScore) {
      const stressImpact = (70 - metrics.stressScore) * 0.08;
      biologicalAge += stressImpact;
      confidenceScore += 0.05;
    }

    // Wearable data integration for higher accuracy
    if (metrics.wearableData && metrics.wearableData.length > 0) {
      confidenceScore += 0.2;
      // HRV-based age adjustment
      const avgHRV = metrics.wearableData
        .filter((d: any) => d.dataType === 'hrv')
        .reduce((sum: number, d: any) => sum + (d.metrics?.value || 0), 0) / 
        Math.max(metrics.wearableData.filter((d: any) => d.dataType === 'hrv').length, 1);
      
      if (avgHRV > 0) {
        // Higher HRV generally indicates better health
        const hrvImpact = (avgHRV - 30) * 0.1;
        biologicalAge -= hrvImpact;
      }
    }

    return {
      age: Math.max(biologicalAge, metrics.chronologicalAge * 0.7),
      confidence: Math.min(confidenceScore, 0.95)
    };
  }

  private calculateAdvancedDiseaseRisks(metrics: any): Record<string, number> {
    const risks: Record<string, number> = {};

    // Cardiovascular risk calculation
    let cardioRisk = 0.1; // Base risk
    if (metrics.exerciseScore < 50) cardioRisk += 0.2;
    if (metrics.stressScore > 70) cardioRisk += 0.15;
    if (metrics.sleepScore < 60) cardioRisk += 0.1;
    risks.cardiovascular = Math.min(cardioRisk, 0.8);

    // Metabolic syndrome risk
    let metabolicRisk = 0.08;
    if (metrics.exerciseScore < 40) metabolicRisk += 0.25;
    if (metrics.nutritionScore < 50) metabolicRisk += 0.2;
    risks.metabolic = Math.min(metabolicRisk, 0.7);

    // Cognitive decline risk
    let cognitiveRisk = 0.05;
    if (metrics.sleepScore < 50) cognitiveRisk += 0.15;
    if (metrics.exerciseScore < 45) cognitiveRisk += 0.1;
    if (metrics.stressScore > 75) cognitiveRisk += 0.1;
    risks.cognitive = Math.min(cognitiveRisk, 0.6);

    return risks;
  }

  private calculateAdvancedInterventionImpact(currentMetrics: any, interventions: string[]): Record<string, number> {
    const impacts: Record<string, number> = {};

    interventions.forEach(intervention => {
      switch (intervention.toLowerCase()) {
        case 'strength training':
          impacts[intervention] = currentMetrics.exerciseScore < 70 ? 3.2 : 1.8;
          break;
        case 'meditation':
          impacts[intervention] = currentMetrics.stressScore > 60 ? 2.8 : 1.5;
          break;
        case 'sleep optimization':
          impacts[intervention] = currentMetrics.sleepScore < 70 ? 4.1 : 2.2;
          break;
        case 'nutrition coaching':
          impacts[intervention] = currentMetrics.nutritionScore < 65 ? 3.5 : 2.0;
          break;
        case 'cardio training':
          impacts[intervention] = currentMetrics.exerciseScore < 60 ? 2.9 : 1.6;
          break;
        default:
          impacts[intervention] = 1.5; // Default impact
      }
    });

    return impacts;
  }

  private async generateRecommendations(userId: string, assessmentId: string, assessment: HealthAssessment): Promise<void> {
    const recommendations = [];
    
    // Stress management recommendation if stress score is low
    const metrics = await this.getHealthMetrics(userId);
    if (metrics?.stressScore && metrics.stressScore < 75) {
      recommendations.push({
        userId,
        assessmentId,
        category: "stress",
        priority: "high" as const,
        title: "Stress Management Enhancement",
        description: "Your stress levels show room for improvement. Implementing targeted stress reduction can add 3-5 years to your longevity projection.",
        actionItems: [
          "Practice 10 minutes of daily meditation",
          "Implement breathing exercises during work breaks",
          "Consider mindfulness-based stress reduction training"
        ],
        estimatedImpact: 4.2,
      });
    }
    
    // Exercise recommendation if exercise score is moderate
    if (metrics?.exerciseScore && metrics.exerciseScore < 85) {
      recommendations.push({
        userId,
        assessmentId,
        category: "exercise",
        priority: "medium" as const,
        title: "Strength Training Integration",
        description: "Adding 2 weekly strength sessions could significantly improve your muscle mass retention trajectory for later decades.",
        actionItems: [
          "Add 20-minute strength sessions twice weekly",
          "Focus on compound movements (squats, deadlifts, pulls)",
          "Progressive overload with proper form"
        ],
        estimatedImpact: 2.8,
      });
    }
    
    // Create recommendations
    for (const rec of recommendations) {
      await this.createRecommendation(rec);
    }
  }

  // Analytics Methods
  async createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [analyticsEvent] = await db
      .insert(analyticsEvents)
      .values(event)
      .returning();
    return analyticsEvent;
  }

  async getAnalyticsEvents(userId: string, options: {
    startDate?: string;
    endDate?: string;
    eventName?: string;
    limit?: number;
  } = {}): Promise<AnalyticsEvent[]> {
    let query = db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.userId, userId));

    if (options.eventName) {
      query = query.where(eq(analyticsEvents.eventName, options.eventName));
    }

    if (options.startDate) {
      query = query.where(gte(analyticsEvents.timestamp, new Date(options.startDate)));
    }

    if (options.endDate) {
      query = query.where(lte(analyticsEvents.timestamp, new Date(options.endDate)));
    }

    return await query
      .orderBy(desc(analyticsEvents.timestamp))
      .limit(options.limit || 100);
  }

  async getAnalyticsSummary(userId: string): Promise<{
    totalEvents: number;
    uniqueSessions: number;
    topEvents: { eventName: string; count: number }[];
    lastActivity: string;
  }> {
    // Get total events
    const totalEventsResult = await db
      .select({ count: sql`count(*)` })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.userId, userId));
    
    const totalEvents = parseInt(totalEventsResult[0]?.count as string) || 0;

    // Get unique sessions
    const uniqueSessionsResult = await db
      .select({ count: sql`count(distinct ${analyticsEvents.sessionId})` })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.userId, userId));
    
    const uniqueSessions = parseInt(uniqueSessionsResult[0]?.count as string) || 0;

    // Get top events
    const topEventsResult = await db
      .select({
        eventName: analyticsEvents.eventName,
        count: sql`count(*)`
      })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.userId, userId))
      .groupBy(analyticsEvents.eventName)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    const topEvents = topEventsResult.map(row => ({
      eventName: row.eventName,
      count: parseInt(row.count as string)
    }));

    // Get last activity
    const lastActivityResult = await db
      .select({ timestamp: analyticsEvents.timestamp })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.userId, userId))
      .orderBy(desc(analyticsEvents.timestamp))
      .limit(1);

    const lastActivity = lastActivityResult[0]?.timestamp?.toISOString() || '';

    return {
      totalEvents,
      uniqueSessions,
      topEvents,
      lastActivity
    };
  }
}

export const storage = new DatabaseStorage();
