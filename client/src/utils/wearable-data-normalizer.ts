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

export interface RawOuraData {
  date: string;
  readinessScore?: number;
  sleepScore?: number;
  activityScore?: number;
  hrv?: number;
  restingHeartRate?: number;
  tempDeviation?: number;
  sleepTotal?: number;
  sleepEfficiency?: number;
  sleepLatency?: number;
  sleepRemMinutes?: number;
  sleepDeepMinutes?: number;
  sleepLightMinutes?: number;
  steps?: number;
}

export interface RawAppleHealthData {
  date: string;
  steps?: number;
  activeEnergy?: number;
  restingEnergy?: number;
  standHours?: number;
  exerciseMinutes?: number;
  moveMinutes?: number;
  heartRateAverage?: number;
  heartRateResting?: number;
  hrv?: number;
  sleepHours?: number;
  mindfulMinutes?: number;
  walkingSpeed?: number;
  vo2Max?: number;
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
 * Normalize Oura data to standard format
 */
export function normalizeOuraData(data: RawOuraData): NormalizedHealthData {
  let confidence = 0;
  let dataPoints = 0;
  let presentPoints = 0;

  // Count data completeness
  const fields = ['readinessScore', 'sleepScore', 'hrv', 'tempDeviation', 'steps'];
  fields.forEach(field => {
    dataPoints++;
    if (data[field as keyof RawOuraData] !== undefined && data[field as keyof RawOuraData] !== null) {
      presentPoints++;
    }
  });

  confidence = presentPoints / dataPoints;

  return {
    date: data.date,
    steps: data.steps ?? null,
    sleepHours: data.sleepTotal ? data.sleepTotal / 3600 : null, // Convert seconds to hours
    sleepScore: data.sleepScore ?? null,
    recoveryScore: data.readinessScore ?? null,
    activityScore: data.activityScore ?? null,
    heartRateResting: data.restingHeartRate ?? null,
    hrv: data.hrv ?? null,
    stress: calculateOuraStress(data),
    source: "oura" as "garmin" | "whoop" | "combined",
    confidence
  };
}

/**
 * Normalize Apple Health data to standard format
 */
export function normalizeAppleHealthData(data: RawAppleHealthData): NormalizedHealthData {
  let confidence = 0;
  let dataPoints = 0;
  let presentPoints = 0;

  // Count data completeness
  const fields = ['steps', 'activeEnergy', 'exerciseMinutes', 'heartRateResting', 'hrv'];
  fields.forEach(field => {
    dataPoints++;
    if (data[field as keyof RawAppleHealthData] !== undefined && data[field as keyof RawAppleHealthData] !== null) {
      presentPoints++;
    }
  });

  confidence = presentPoints / dataPoints;

  return {
    date: data.date,
    steps: data.steps ?? null,
    sleepHours: data.sleepHours ?? null,
    sleepScore: calculateAppleHealthSleepScore(data.sleepHours),
    recoveryScore: calculateAppleHealthRecoveryScore(data),
    activityScore: calculateAppleHealthActivityScore(data),
    heartRateResting: data.heartRateResting ?? data.heartRateAverage ?? null,
    hrv: data.hrv ?? null,
    stress: calculateAppleHealthStress(data),
    source: "apple" as "garmin" | "whoop" | "combined",
    confidence
  };
}

/**
 * Merge data from multiple sources with priority logic
 */
export function mergeWearableData(
  garminData?: NormalizedHealthData,
  whoopData?: NormalizedHealthData,
  ouraData?: NormalizedHealthData,
  appleData?: NormalizedHealthData,
  priority: "garmin" | "whoop" | "oura" | "apple" | "best" = "best"
): NormalizedHealthData {
  // If no sources available, return empty
  const availableSources = [garminData, whoopData, ouraData, appleData].filter(Boolean);
  if (availableSources.length === 0) {
    return createEmptyNormalizedData(new Date().toISOString().split('T')[0]);
  }
  
  // If only one source available, return it
  if (availableSources.length === 1) {
    return availableSources[0]!;
  }

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
  const allData = [garminData, whoopData, ouraData, appleData].filter(Boolean) as NormalizedHealthData[];
  
  return {
    date: allData[0].date,
    steps: selectBestFromMultiple([garminData?.steps, appleData?.steps, ouraData?.steps]),
    sleepHours: selectBestFromMultiple([ouraData?.sleepHours, whoopData?.sleepHours, garminData?.sleepHours]),
    sleepScore: selectBestFromMultiple([ouraData?.sleepScore, whoopData?.sleepScore, garminData?.sleepScore]),
    recoveryScore: selectBestFromMultiple([ouraData?.recoveryScore, whoopData?.recoveryScore, garminData?.recoveryScore]),
    activityScore: selectBestFromMultiple([garminData?.activityScore, appleData?.activityScore, whoopData?.activityScore]),
    heartRateResting: selectBestFromMultiple([ouraData?.heartRateResting, whoopData?.heartRateResting, garminData?.heartRateResting, appleData?.heartRateResting]),
    hrv: selectBestFromMultiple([ouraData?.hrv, whoopData?.hrv, appleData?.hrv, garminData?.hrv]),
    stress: selectBestFromMultiple([garminData?.stress, whoopData?.stress, ouraData?.stress]),
    source: "combined",
    confidence: Math.max(...allData.map(d => d.confidence))
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

function selectBestFromMultiple<T>(values: (T | null | undefined)[]): T | null {
  const validValues = values.filter(v => v !== null && v !== undefined) as T[];
  return validValues.length > 0 ? validValues[0] : null;
}

function calculateOuraStress(data: RawOuraData): number | null {
  // Estimate stress from readiness and HRV
  if (!data.readinessScore && !data.hrv) return null;
  
  let stress = 50; // Base stress
  
  if (data.readinessScore) {
    // Lower readiness = higher stress
    stress = 100 - data.readinessScore;
  }
  
  if (data.tempDeviation) {
    // Temperature deviation can indicate stress
    const tempStress = Math.abs(data.tempDeviation) * 10;
    stress = (stress + tempStress) / 2;
  }
  
  return Math.min(100, Math.max(0, stress));
}

function calculateAppleHealthSleepScore(sleepHours?: number): number | null {
  if (!sleepHours) return null;
  // Simple sleep score based on hours (7-9 hours optimal)
  if (sleepHours >= 7 && sleepHours <= 9) return 90;
  if (sleepHours >= 6 && sleepHours < 7) return 70;
  if (sleepHours > 9 && sleepHours <= 10) return 80;
  if (sleepHours < 6) return 50;
  return 60;
}

function calculateAppleHealthRecoveryScore(data: RawAppleHealthData): number | null {
  // Estimate recovery based on available metrics
  let score = 50; // Base score
  let factorCount = 0;
  
  if (data.hrv) {
    factorCount++;
    if (data.hrv > 50) score += 20;
    else if (data.hrv > 30) score += 10;
    else score -= 10;
  }
  
  if (data.heartRateResting) {
    factorCount++;
    if (data.heartRateResting < 60) score += 15;
    else if (data.heartRateResting < 70) score += 5;
    else score -= 5;
  }
  
  if (data.sleepHours) {
    factorCount++;
    if (data.sleepHours >= 7 && data.sleepHours <= 9) score += 15;
    else if (data.sleepHours >= 6) score += 5;
    else score -= 10;
  }
  
  return factorCount > 0 ? Math.min(100, Math.max(0, score)) : null;
}

function calculateAppleHealthActivityScore(data: RawAppleHealthData): number | null {
  let score = 0;
  let hasData = false;
  
  if (data.steps) {
    hasData = true;
    // 10k steps = 50 points
    score += Math.min(50, (data.steps / 10000) * 50);
  }
  
  if (data.exerciseMinutes) {
    hasData = true;
    // 30 exercise minutes = 30 points
    score += Math.min(30, (data.exerciseMinutes / 30) * 30);
  }
  
  if (data.activeEnergy) {
    hasData = true;
    // 500 active calories = 20 points
    score += Math.min(20, (data.activeEnergy / 500) * 20);
  }
  
  return hasData ? Math.min(100, score) : null;
}

function calculateAppleHealthStress(data: RawAppleHealthData): number | null {
  // Estimate stress from HRV and mindful minutes
  let stress = 50; // Base stress
  let hasData = false;
  
  if (data.hrv) {
    hasData = true;
    // Low HRV indicates stress
    if (data.hrv < 30) stress += 25;
    else if (data.hrv < 50) stress += 10;
    else stress -= 15;
  }
  
  if (data.mindfulMinutes) {
    hasData = true;
    // More mindful minutes = less stress
    if (data.mindfulMinutes > 10) stress -= 20;
    else if (data.mindfulMinutes > 5) stress -= 10;
  }
  
  return hasData ? Math.min(100, Math.max(0, stress)) : null;
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