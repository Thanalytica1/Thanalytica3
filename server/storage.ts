import { 
  type User, 
  type InsertUser, 
  type HealthAssessment, 
  type InsertHealthAssessment,
  type HealthMetrics,
  type InsertHealthMetrics,
  type Recommendation,
  type InsertRecommendation,
  users,
  healthAssessments,
  healthMetrics,
  recommendations
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
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
}

export const storage = new DatabaseStorage();
