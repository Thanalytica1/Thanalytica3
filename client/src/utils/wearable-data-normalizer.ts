import { format, parseISO } from "date-fns";

export interface NormalizedHealthData {
  date: string;
  steps: number | null;
  sleepHours: number | null;
  sleepScore: number | null;
  recoveryScore: number | null;
  activityScore: number | null;
  heartRateResting: number | null;
  hrv: number | null;
  stress: number | null;
  source: "garmin" | "whoop" | "combined";
  confidence: number; // 0-1 confidence score based on data completeness
}

export interface RawGarminData {
  date: string;
  steps?: number;
  distance?: number;
  calories?: number;
  sleepHours?: number;
  restingHeartRate?: number;
  stressScore?: number;
  activeMinutes?: number;
  floorsClimbed?: number;
}

export interface RawWhoopData {
  date: string;
  recoveryScore?: number;
  strainScore?: number;
  sleepPerformance?: number;
  hrv?: number;
  restingHeartRate?: number;
  respiratoryRate?: number;
  sleepDuration?: number;
  sleepEfficiency?: number;
  sleepDisturbances?: number;
}

/**
 * Normalize Garmin data to standard format
 */
export function normalizeGarminData(data: RawGarminData): NormalizedHealthData {
  let confidence = 0;
  let dataPoints = 0;
  let presentPoints = 0;

  // Count data completeness
  const fields = ['steps', 'sleepHours', 'restingHeartRate', 'stressScore'];
  fields.forEach(field => {
    dataPoints++;
    if (data[field as keyof RawGarminData] !== undefined && data[field as keyof RawGarminData] !== null) {
      presentPoints++;
    }
  });

  confidence = presentPoints / dataPoints;

  return {
    date: data.date,
    steps: data.steps ?? null,
    sleepHours: data.sleepHours ?? null,
    sleepScore: calculateGarminSleepScore(data.sleepHours),
    recoveryScore: calculateGarminRecoveryScore(data),
    activityScore: calculateGarminActivityScore(data),
    heartRateResting: data.restingHeartRate ?? null,
    hrv: null, // Garmin doesn't typically provide HRV in basic API
    stress: data.stressScore ?? null,
    source: "garmin",
    confidence
  };
}

/**
 * Normalize Whoop data to standard format
 */
export function normalizeWhoopData(data: RawWhoopData): NormalizedHealthData {
  let confidence = 0;
  let dataPoints = 0;
  let presentPoints = 0;

  // Count data completeness
  const fields = ['recoveryScore', 'strainScore', 'sleepPerformance', 'hrv', 'restingHeartRate'];
  fields.forEach(field => {
    dataPoints++;
    if (data[field as keyof RawWhoopData] !== undefined && data[field as keyof RawWhoopData] !== null) {
      presentPoints++;
    }
  });

  confidence = presentPoints / dataPoints;

  return {
    date: data.date,
    steps: null, // Whoop doesn't track steps
    sleepHours: data.sleepDuration ? data.sleepDuration / 3600 : null, // Convert seconds to hours
    sleepScore: data.sleepPerformance ?? null,
    recoveryScore: data.recoveryScore ?? null,
    activityScore: data.strainScore ? normalizeStrainToActivityScore(data.strainScore) : null,
    heartRateResting: data.restingHeartRate ?? null,
    hrv: data.hrv ?? null,
    stress: calculateWhoopStress(data),
    source: "whoop",
    confidence
  };
}

/**
 * Merge data from multiple sources with priority logic
 */
export function mergeWearableData(
  garminData?: NormalizedHealthData,
  whoopData?: NormalizedHealthData,
  priority: "garmin" | "whoop" | "best" = "best"
): NormalizedHealthData {
  // If only one source available, return it
  if (!garminData && !whoopData) {
    return createEmptyNormalizedData(new Date().toISOString().split('T')[0]);
  }
  if (!garminData) return whoopData!;
  if (!whoopData) return garminData!;

  // Both sources available - merge based on priority
  if (priority === "garmin") {
    return {
      ...garminData,
      // Fill in missing Garmin data with Whoop data
      hrv: garminData.hrv ?? whoopData.hrv,
      recoveryScore: garminData.recoveryScore ?? whoopData.recoveryScore,
      source: "combined",
      confidence: Math.max(garminData.confidence, whoopData.confidence)
    };
  }

  if (priority === "whoop") {
    return {
      ...whoopData,
      // Fill in missing Whoop data with Garmin data
      steps: whoopData.steps ?? garminData.steps,
      stress: whoopData.stress ?? garminData.stress,
      source: "combined",
      confidence: Math.max(garminData.confidence, whoopData.confidence)
    };
  }

  // "best" priority - pick the most complete/reliable data for each field
  return {
    date: garminData.date,
    steps: garminData.steps ?? whoopData.steps, // Garmin has steps, Whoop doesn't
    sleepHours: selectBestValue(garminData.sleepHours, whoopData.sleepHours),
    sleepScore: whoopData.sleepScore ?? garminData.sleepScore, // Whoop has better sleep tracking
    recoveryScore: whoopData.recoveryScore ?? garminData.recoveryScore, // Whoop specializes in recovery
    activityScore: selectBestValue(garminData.activityScore, whoopData.activityScore),
    heartRateResting: selectBestValue(garminData.heartRateResting, whoopData.heartRateResting),
    hrv: whoopData.hrv ?? garminData.hrv, // Whoop specializes in HRV
    stress: garminData.stress ?? whoopData.stress, // Garmin has better stress tracking
    source: "combined",
    confidence: Math.max(garminData.confidence, whoopData.confidence)
  };
}

/**
 * Calculate trends from historical data
 */
export function calculateTrends(data: NormalizedHealthData[], days: number = 7): {
  avgSteps: number;
  avgSleepHours: number;
  avgRecovery: number;
  stepsTrend: "up" | "down" | "stable";
  sleepTrend: "up" | "down" | "stable";
  recoveryTrend: "up" | "down" | "stable";
} {
  const recentData = data.slice(-days);
  
  if (recentData.length === 0) {
    return {
      avgSteps: 0,
      avgSleepHours: 0,
      avgRecovery: 0,
      stepsTrend: "stable",
      sleepTrend: "stable",
      recoveryTrend: "stable"
    };
  }

  // Calculate averages
  const avgSteps = calculateAverage(recentData.map(d => d.steps));
  const avgSleepHours = calculateAverage(recentData.map(d => d.sleepHours));
  const avgRecovery = calculateAverage(recentData.map(d => d.recoveryScore));

  // Calculate trends (compare first half vs second half)
  const midPoint = Math.floor(recentData.length / 2);
  const firstHalf = recentData.slice(0, midPoint);
  const secondHalf = recentData.slice(midPoint);

  const stepsTrend = calculateTrendDirection(
    calculateAverage(firstHalf.map(d => d.steps)),
    calculateAverage(secondHalf.map(d => d.steps))
  );

  const sleepTrend = calculateTrendDirection(
    calculateAverage(firstHalf.map(d => d.sleepHours)),
    calculateAverage(secondHalf.map(d => d.sleepHours))
  );

  const recoveryTrend = calculateTrendDirection(
    calculateAverage(firstHalf.map(d => d.recoveryScore)),
    calculateAverage(secondHalf.map(d => d.recoveryScore))
  );

  return {
    avgSteps,
    avgSleepHours,
    avgRecovery,
    stepsTrend,
    sleepTrend,
    recoveryTrend
  };
}

// Helper functions
function calculateGarminSleepScore(sleepHours?: number): number | null {
  if (!sleepHours) return null;
  // Simple sleep score based on hours (7-9 hours optimal)
  if (sleepHours >= 7 && sleepHours <= 9) return 90;
  if (sleepHours >= 6 && sleepHours < 7) return 70;
  if (sleepHours > 9 && sleepHours <= 10) return 80;
  if (sleepHours < 6) return 50;
  return 60;
}

function calculateGarminRecoveryScore(data: RawGarminData): number | null {
  // Estimate recovery based on available metrics
  let score = 50; // Base score
  
  if (data.sleepHours) {
    if (data.sleepHours >= 7 && data.sleepHours <= 9) score += 20;
    else if (data.sleepHours >= 6) score += 10;
  }
  
  if (data.stressScore) {
    // Lower stress is better
    if (data.stressScore < 30) score += 20;
    else if (data.stressScore < 50) score += 10;
    else score -= 10;
  }
  
  if (data.restingHeartRate) {
    // Lower resting HR generally indicates better recovery
    if (data.restingHeartRate < 60) score += 10;
    else if (data.restingHeartRate > 70) score -= 10;
  }
  
  return Math.min(100, Math.max(0, score));
}

function calculateGarminActivityScore(data: RawGarminData): number | null {
  if (!data.steps && !data.activeMinutes) return null;
  
  let score = 0;
  
  if (data.steps) {
    // 10k steps = 100 score
    score = Math.min(100, (data.steps / 10000) * 100);
  }
  
  if (data.activeMinutes) {
    // 30 active minutes = bonus points
    const activityBonus = Math.min(20, (data.activeMinutes / 30) * 20);
    score = Math.min(100, score + activityBonus);
  }
  
  return score;
}

function normalizeStrainToActivityScore(strain: number): number {
  // Whoop strain is 0-21 scale, normalize to 0-100
  return Math.min(100, (strain / 21) * 100);
}

function calculateWhoopStress(data: RawWhoopData): number | null {
  // Estimate stress from recovery and HRV
  if (!data.recoveryScore && !data.hrv) return null;
  
  let stress = 50; // Base stress
  
  if (data.recoveryScore) {
    // Lower recovery = higher stress
    stress = 100 - data.recoveryScore;
  }
  
  if (data.hrv && data.recoveryScore) {
    // Low HRV indicates stress
    if (data.hrv < 30) stress += 20;
    else if (data.hrv > 50) stress -= 20;
    stress = (stress + (100 - data.recoveryScore)) / 2;
  }
  
  return Math.min(100, Math.max(0, stress));
}

function selectBestValue<T>(val1: T | null, val2: T | null): T | null {
  if (val1 !== null && val2 !== null) {
    // Both values exist, could implement more complex logic here
    return val1;
  }
  return val1 ?? val2;
}

function calculateAverage(values: (number | null)[]): number {
  const validValues = values.filter(v => v !== null) as number[];
  if (validValues.length === 0) return 0;
  return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
}

function calculateTrendDirection(oldValue: number, newValue: number): "up" | "down" | "stable" {
  const threshold = 0.1; // 10% change threshold
  const percentChange = (newValue - oldValue) / (oldValue || 1);
  
  if (percentChange > threshold) return "up";
  if (percentChange < -threshold) return "down";
  return "stable";
}

function createEmptyNormalizedData(date: string): NormalizedHealthData {
  return {
    date,
    steps: null,
    sleepHours: null,
    sleepScore: null,
    recoveryScore: null,
    activityScore: null,
    heartRateResting: null,
    hrv: null,
    stress: null,
    source: "combined",
    confidence: 0
  };
}