/**
 * PHASE 3.4: Habit Stacking and Routine Builder
 * Intelligent system for creating, optimizing, and maintaining complex routine chains
 * Individual habits often fail, but intelligent chains become self-reinforcing systems
 */

import { db, COLLECTIONS, queryToArray, generateId } from '../db';
import { cacheService } from './cacheService';

// Atomic habit definition with comprehensive metadata
interface AtomicHabit {
  id: string;
  name: string;
  description: string;
  category: 'health' | 'productivity' | 'learning' | 'wellness' | 'social' | 'spiritual';
  
  // Execution characteristics
  timeRequired: number; // minutes
  energyCost: 'low' | 'medium' | 'high';
  difficultyLevel: number; // 1-10 scale
  
  // Timing constraints
  optimalTimeOfDay: Array<'early_morning' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'late_evening'>;
  seasonality: 'none' | 'seasonal' | 'weather_dependent';
  
  // Prerequisites and dependencies
  prerequisites: string[]; // Other habit IDs that should come before
  incompatibleWith: string[]; // Habits that conflict with this one
  
  // Outcomes and benefits
  expectedOutcomes: Array<{
    outcome: string;
    timeToEffect: number; // days
    confidence: number; // 0-1
  }>;
  
  // Customization
  variations: Array<{
    name: string;
    description: string;
    timeRequired: number;
    difficultyModifier: number;
  }>;
  
  // Tracking
  trackingMethod: 'binary' | 'duration' | 'intensity' | 'quality' | 'count';
  defaultReminder: boolean;
  
  // Success factors
  successFactors: string[];
  commonFailurePoints: string[];
  
  // Personalization
  personalityDependence: boolean;
  motivationStyle: Array<'achievement' | 'social' | 'autonomy' | 'mastery'>;
  
  // Metadata
  evidenceLevel: 'low' | 'medium' | 'high'; // Scientific backing
  popularityScore: number; // How many users do this habit
  createdAt: Date;
  updatedAt: Date;
}

// Habit chain/routine definition
interface HabitChain {
  id: string;
  userId: string;
  name: string;
  description: string;
  
  // Chain structure
  habits: Array<{
    habitId: string;
    order: number;
    variation?: string; // Specific variation to use
    customDuration?: number; // Override default duration
    transitionTime: number; // Minutes between this and next habit
    required: boolean; // Whether this habit is optional in the chain
  }>;
  
  // Timing
  scheduledTime: string; // HH:MM format
  estimatedDuration: number; // Total minutes
  timeWindow: number; // Flexibility window in minutes
  
  // Chain optimization
  energyProfile: Array<{ time: number; energy: number }>; // Energy curve throughout chain
  difficultyProgression: 'ascending' | 'descending' | 'peak_middle' | 'custom';
  
  // Adaptability
  adaptiveRules: Array<{
    condition: string; // "if tired", "if short on time", etc.
    modification: string; // "skip optional habits", "use easier variations", etc.
  }>;
  
  // Success tracking
  streakCurrent: number;
  streakLongest: number;
  completionRate: number; // Last 30 days
  lastCompleted: Date;
  
  // Optimization metrics
  adherenceHistory: Array<{
    date: Date;
    completed: boolean;
    habitsCompleted: number;
    totalHabits: number;
    duration: number;
    difficulty: number;
    energy: number;
    mood: number;
    notes?: string;
  }>;
  
  // Chain health
  weakestLink: string; // Habit ID that fails most often
  strengthScore: number; // Overall chain resilience
  
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Routine optimization analysis
interface RoutineOptimization {
  userId: string;
  recommendations: Array<{
    type: 'reorder' | 'substitute' | 'add' | 'remove' | 'timing' | 'variation';
    target: string; // Habit ID or chain ID
    suggestion: string;
    reasoning: string;
    expectedImprovement: number; // % increase in completion rate
    effort: 'low' | 'medium' | 'high';
    priority: number; // 1-10
  }>;
  
  // User patterns
  chronotype: 'morning' | 'evening' | 'intermediate';
  energyPattern: Array<{ hour: number; energy: number }>;
  adherencePatterns: {
    bestDayOfWeek: string;
    bestTimeOfDay: string;
    averageChainLength: number;
    dropoffPoint: number; // Which habit in chain fails most
  };
  
  // Personalized insights
  personalFactors: {
    motivationStyle: string;
    stressResilience: 'low' | 'medium' | 'high';
    changePreference: 'gradual' | 'rapid';
    socialInfluence: 'high' | 'medium' | 'low';
  };
  
  generatedAt: Date;
}

// Micro-habit insertion system
interface MicroHabitOpportunity {
  id: string;
  userId: string;
  timeWindow: {
    start: string; // HH:MM
    end: string;   // HH:MM
    duration: number; // minutes available
  };
  context: 'transition' | 'waiting' | 'commute' | 'break' | 'morning_routine' | 'evening_routine';
  location: 'home' | 'work' | 'gym' | 'commute' | 'anywhere';
  
  recommendedHabits: Array<{
    habitId: string;
    fitScore: number; // How well this habit fits the opportunity
    reasoning: string;
  }>;
  
  frequency: 'daily' | 'weekdays' | 'weekends' | 'occasional';
  discovered: Date;
  utilized: boolean;
}

export class HabitStackingEngine {
  private static instance: HabitStackingEngine;
  
  // Comprehensive atomic habits library
  private readonly ATOMIC_HABITS_LIBRARY: Record<string, AtomicHabit> = {
    // MORNING ROUTINE HABITS
    wake_up_consistent: {
      id: 'wake_up_consistent',
      name: 'Consistent Wake Time',
      description: 'Wake up at the same time every day',
      category: 'health',
      timeRequired: 0,
      energyCost: 'low',
      difficultyLevel: 3,
      optimalTimeOfDay: ['early_morning'],
      seasonality: 'none',
      prerequisites: [],
      incompatibleWith: [],
      expectedOutcomes: [
        { outcome: 'Better sleep quality', timeToEffect: 7, confidence: 0.8 },
        { outcome: 'More consistent energy', timeToEffect: 14, confidence: 0.7 }
      ],
      variations: [
        { name: 'Gradual shift', description: 'Move wake time 15 minutes earlier each day', timeRequired: 0, difficultyModifier: -2 },
        { name: 'Immediate shift', description: 'Start new wake time tomorrow', timeRequired: 0, difficultyModifier: 2 }
      ],
      trackingMethod: 'binary',
      defaultReminder: true,
      successFactors: ['Consistent bedtime', 'No screens before bed', 'Blackout curtains'],
      commonFailurePoints: ['Weekend sleep-ins', 'Social events', 'Stress'],
      personalityDependence: true,
      motivationStyle: ['achievement', 'mastery'],
      evidenceLevel: 'high',
      popularityScore: 0.85,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    
    morning_hydration: {
      id: 'morning_hydration',
      name: 'Morning Hydration',
      description: 'Drink a large glass of water upon waking',
      category: 'health',
      timeRequired: 2,
      energyCost: 'low',
      difficultyLevel: 1,
      optimalTimeOfDay: ['early_morning', 'morning'],
      seasonality: 'none',
      prerequisites: ['wake_up_consistent'],
      incompatibleWith: [],
      expectedOutcomes: [
        { outcome: 'Better hydration', timeToEffect: 1, confidence: 0.9 },
        { outcome: 'Increased alertness', timeToEffect: 1, confidence: 0.7 }
      ],
      variations: [
        { name: 'Plain water', description: '16-20 oz of water', timeRequired: 2, difficultyModifier: 0 },
        { name: 'Lemon water', description: 'Water with fresh lemon juice', timeRequired: 3, difficultyModifier: 1 },
        { name: 'Electrolyte water', description: 'Water with electrolyte supplement', timeRequired: 2, difficultyModifier: 1 }
      ],
      trackingMethod: 'binary',
      defaultReminder: false,
      successFactors: ['Water bottle by bedside', 'Visual reminder'],
      commonFailurePoints: ['Forgetting', 'Rushing morning routine'],
      personalityDependence: false,
      motivationStyle: ['achievement'],
      evidenceLevel: 'medium',
      popularityScore: 0.72,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    
    morning_movement: {
      id: 'morning_movement',
      name: 'Morning Movement',
      description: 'Light physical activity to activate the body',
      category: 'health',
      timeRequired: 10,
      energyCost: 'low',
      difficultyLevel: 2,
      optimalTimeOfDay: ['early_morning', 'morning'],
      seasonality: 'none',
      prerequisites: ['morning_hydration'],
      incompatibleWith: [],
      expectedOutcomes: [
        { outcome: 'Increased energy', timeToEffect: 1, confidence: 0.8 },
        { outcome: 'Better mood', timeToEffect: 1, confidence: 0.7 },
        { outcome: 'Improved circulation', timeToEffect: 1, confidence: 0.9 }
      ],
      variations: [
        { name: 'Gentle stretching', description: '5-10 minutes of basic stretches', timeRequired: 8, difficultyModifier: -1 },
        { name: 'Yoga flow', description: 'Short morning yoga sequence', timeRequired: 15, difficultyModifier: 1 },
        { name: 'Jumping jacks', description: '2-3 minutes of jumping jacks', timeRequired: 5, difficultyModifier: 0 }
      ],
      trackingMethod: 'duration',
      defaultReminder: true,
      successFactors: ['Comfortable clothing', 'Enough space', 'Easy routine'],
      commonFailurePoints: ['Time pressure', 'Low energy', 'Lack of space'],
      personalityDependence: true,
      motivationStyle: ['achievement', 'mastery'],
      evidenceLevel: 'high',
      popularityScore: 0.68,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    
    // PRODUCTIVITY HABITS
    priority_planning: {
      id: 'priority_planning',
      name: 'Daily Priority Planning',
      description: 'Identify and write down top 3 priorities for the day',
      category: 'productivity',
      timeRequired: 5,
      energyCost: 'low',
      difficultyLevel: 2,
      optimalTimeOfDay: ['morning', 'early_morning'],
      seasonality: 'none',
      prerequisites: [],
      incompatibleWith: [],
      expectedOutcomes: [
        { outcome: 'Better focus', timeToEffect: 1, confidence: 0.8 },
        { outcome: 'Increased productivity', timeToEffect: 1, confidence: 0.7 },
        { outcome: 'Reduced decision fatigue', timeToEffect: 3, confidence: 0.6 }
      ],
      variations: [
        { name: 'Simple list', description: 'Write 3 priorities on paper', timeRequired: 3, difficultyModifier: -1 },
        { name: 'Time blocking', description: 'Plan priorities with time estimates', timeRequired: 8, difficultyModifier: 2 },
        { name: 'Digital planning', description: 'Use planning app with categories', timeRequired: 5, difficultyModifier: 0 }
      ],
      trackingMethod: 'binary',
      defaultReminder: true,
      successFactors: ['Consistent location', 'Planning tool ready', 'Quiet environment'],
      commonFailurePoints: ['Rushing', 'Overwhelm', 'Perfectionism'],
      personalityDependence: true,
      motivationStyle: ['achievement', 'mastery', 'autonomy'],
      evidenceLevel: 'high',
      popularityScore: 0.76,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    
    deep_work_block: {
      id: 'deep_work_block',
      name: 'Deep Work Block',
      description: 'Focused work session without distractions',
      category: 'productivity',
      timeRequired: 90,
      energyCost: 'high',
      difficultyLevel: 6,
      optimalTimeOfDay: ['morning', 'midday'],
      seasonality: 'none',
      prerequisites: ['priority_planning'],
      incompatibleWith: ['social_media_check'],
      expectedOutcomes: [
        { outcome: 'Higher quality work', timeToEffect: 1, confidence: 0.9 },
        { outcome: 'Increased focus ability', timeToEffect: 7, confidence: 0.8 },
        { outcome: 'Greater work satisfaction', timeToEffect: 3, confidence: 0.7 }
      ],
      variations: [
        { name: 'Pomodoro (25 min)', description: '25 minutes focused work', timeRequired: 25, difficultyModifier: -3 },
        { name: 'Standard (90 min)', description: '90 minutes of deep work', timeRequired: 90, difficultyModifier: 0 },
        { name: 'Extended (2+ hours)', description: 'Extended deep work session', timeRequired: 120, difficultyModifier: 3 }
      ],
      trackingMethod: 'duration',
      defaultReminder: true,
      successFactors: ['Phone in another room', 'Clear desk', 'Specific goal', 'Do not disturb mode'],
      commonFailurePoints: ['Notifications', 'Unclear objectives', 'Energy depletion', 'Interruptions'],
      personalityDependence: true,
      motivationStyle: ['mastery', 'autonomy'],
      evidenceLevel: 'high',
      popularityScore: 0.58,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    
    // WELLNESS HABITS
    mindfulness_practice: {
      id: 'mindfulness_practice',
      name: 'Mindfulness Practice',
      description: 'Meditation or mindfulness exercise',
      category: 'wellness',
      timeRequired: 10,
      energyCost: 'low',
      difficultyLevel: 4,
      optimalTimeOfDay: ['morning', 'evening'],
      seasonality: 'none',
      prerequisites: [],
      incompatibleWith: [],
      expectedOutcomes: [
        { outcome: 'Reduced stress', timeToEffect: 1, confidence: 0.8 },
        { outcome: 'Better emotional regulation', timeToEffect: 14, confidence: 0.7 },
        { outcome: 'Improved focus', timeToEffect: 7, confidence: 0.6 }
      ],
      variations: [
        { name: 'Breathing exercise', description: '5 minutes of focused breathing', timeRequired: 5, difficultyModifier: -2 },
        { name: 'Guided meditation', description: 'App-based meditation session', timeRequired: 10, difficultyModifier: 0 },
        { name: 'Walking meditation', description: 'Mindful walking practice', timeRequired: 15, difficultyModifier: 1 }
      ],
      trackingMethod: 'duration',
      defaultReminder: true,
      successFactors: ['Quiet space', 'Comfortable position', 'Regular time', 'Guided app'],
      commonFailurePoints: ['Restless mind', 'Time constraints', 'Expectations', 'Distractions'],
      personalityDependence: true,
      motivationStyle: ['mastery', 'autonomy'],
      evidenceLevel: 'high',
      popularityScore: 0.64,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    
    // EVENING ROUTINE HABITS
    device_shutdown: {
      id: 'device_shutdown',
      name: 'Device Shutdown',
      description: 'Turn off screens 1 hour before bed',
      category: 'health',
      timeRequired: 5,
      energyCost: 'low',
      difficultyLevel: 5,
      optimalTimeOfDay: ['evening'],
      seasonality: 'none',
      prerequisites: [],
      incompatibleWith: ['social_media_check', 'tv_watching'],
      expectedOutcomes: [
        { outcome: 'Better sleep quality', timeToEffect: 3, confidence: 0.8 },
        { outcome: 'Faster sleep onset', timeToEffect: 1, confidence: 0.7 }
      ],
      variations: [
        { name: 'All devices', description: 'Turn off all screens', timeRequired: 5, difficultyModifier: 0 },
        { name: 'Blue light filter', description: 'Use blue light filters instead', timeRequired: 2, difficultyModifier: -2 },
        { name: 'Reading only', description: 'Only e-reader allowed', timeRequired: 3, difficultyModifier: -1 }
      ],
      trackingMethod: 'binary',
      defaultReminder: true,
      successFactors: ['Charging station outside bedroom', 'Alternative activities', 'Family agreement'],
      commonFailurePoints: ['FOMO', 'Habit', 'Work demands', 'Entertainment'],
      personalityDependence: true,
      motivationStyle: ['achievement', 'mastery'],
      evidenceLevel: 'high',
      popularityScore: 0.45,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    
    gratitude_practice: {
      id: 'gratitude_practice',
      name: 'Gratitude Practice',
      description: 'Write down or reflect on things you are grateful for',
      category: 'wellness',
      timeRequired: 5,
      energyCost: 'low',
      difficultyLevel: 2,
      optimalTimeOfDay: ['evening'],
      seasonality: 'none',
      prerequisites: [],
      incompatibleWith: [],
      expectedOutcomes: [
        { outcome: 'Better mood', timeToEffect: 1, confidence: 0.7 },
        { outcome: 'Improved life satisfaction', timeToEffect: 14, confidence: 0.8 },
        { outcome: 'Better sleep', timeToEffect: 3, confidence: 0.6 }
      ],
      variations: [
        { name: 'Three things', description: 'Write 3 things you are grateful for', timeRequired: 3, difficultyModifier: -1 },
        { name: 'Detailed reflection', description: 'Write detailed gratitude entries', timeRequired: 10, difficultyModifier: 1 },
        { name: 'Mental gratitude', description: 'Just think of grateful thoughts', timeRequired: 2, difficultyModifier: -2 }
      ],
      trackingMethod: 'binary',
      defaultReminder: true,
      successFactors: ['Journal ready', 'Quiet time', 'Habit stacking'],
      commonFailurePoints: ['Feeling negative', 'Forgetting', 'Skepticism'],
      personalityDependence: false,
      motivationStyle: ['achievement'],
      evidenceLevel: 'high',
      popularityScore: 0.71,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  public static getInstance(): HabitStackingEngine {
    if (!HabitStackingEngine.instance) {
      HabitStackingEngine.instance = new HabitStackingEngine();
    }
    return HabitStackingEngine.instance;
  }

  // ===== HABIT CHAIN BUILDER =====

  /**
   * Build an optimized habit chain for a user based on their goals and constraints
   */
  async buildOptimalHabitChain(
    userId: string,
    goals: string[],
    timeAvailable: number,
    preferredTime: string,
    difficultyPreference: 'easy' | 'moderate' | 'challenging'
  ): Promise<HabitChain> {
    console.log(`Building habit chain for user ${userId}`);
    
    try {
      // 1. Get user profile and preferences
      const userProfile = await this.getUserProfile(userId);
      
      // 2. Select relevant habits based on goals
      const candidateHabits = this.selectCandidateHabits(goals, difficultyPreference);
      
      // 3. Filter by time constraints
      const feasibleHabits = this.filterByTimeConstraints(candidateHabits, timeAvailable);
      
      // 4. Build compatibility matrix
      const compatibilityMatrix = this.buildCompatibilityMatrix(feasibleHabits);
      
      // 5. Optimize habit order
      const optimizedOrder = this.optimizeHabitOrder(feasibleHabits, compatibilityMatrix, userProfile);
      
      // 6. Create habit chain
      const habitChain = await this.createHabitChain(userId, optimizedOrder, preferredTime, goals);
      
      // 7. Save to database
      await this.saveHabitChain(habitChain);
      
      console.log(`Created habit chain with ${habitChain.habits.length} habits for user ${userId}`);
      return habitChain;

    } catch (error) {
      console.error(`Failed to build habit chain for user ${userId}:`, error);
      throw error;
    }
  }

  private selectCandidateHabits(goals: string[], difficultyPreference: string): AtomicHabit[] {
    const candidates = Object.values(this.ATOMIC_HABITS_LIBRARY);
    
    return candidates.filter(habit => {
      // Filter by goal relevance
      const goalRelevant = goals.some(goal => 
        habit.category === goal || 
        habit.expectedOutcomes.some(outcome => 
          outcome.outcome.toLowerCase().includes(goal.toLowerCase())
        )
      );
      
      // Filter by difficulty preference
      const difficultyMatch = this.matchesDifficultyPreference(habit.difficultyLevel, difficultyPreference);
      
      return goalRelevant && difficultyMatch;
    });
  }

  private matchesDifficultyPreference(habitDifficulty: number, preference: string): boolean {
    switch (preference) {
      case 'easy': return habitDifficulty <= 3;
      case 'moderate': return habitDifficulty >= 3 && habitDifficulty <= 6;
      case 'challenging': return habitDifficulty >= 5;
      default: return true;
    }
  }

  private filterByTimeConstraints(habits: AtomicHabit[], timeAvailable: number): AtomicHabit[] {
    return habits.filter(habit => habit.timeRequired <= timeAvailable);
  }

  private buildCompatibilityMatrix(habits: AtomicHabit[]): number[][] {
    const matrix: number[][] = [];
    
    habits.forEach((habit1, i) => {
      matrix[i] = [];
      habits.forEach((habit2, j) => {
        if (i === j) {
          matrix[i][j] = 1; // Habit is compatible with itself
        } else {
          matrix[i][j] = this.calculateCompatibility(habit1, habit2);
        }
      });
    });
    
    return matrix;
  }

  private calculateCompatibility(habit1: AtomicHabit, habit2: AtomicHabit): number {
    let compatibility = 0.5; // Base compatibility
    
    // Check for explicit incompatibilities
    if (habit1.incompatibleWith.includes(habit2.id) || habit2.incompatibleWith.includes(habit1.id)) {
      return 0;
    }
    
    // Check prerequisites
    if (habit1.prerequisites.includes(habit2.id)) {
      compatibility += 0.3; // habit2 should come before habit1
    }
    if (habit2.prerequisites.includes(habit1.id)) {
      compatibility -= 0.3; // habit1 should come before habit2
    }
    
    // Energy flow compatibility
    const energyCompatibility = this.calculateEnergyFlowCompatibility(habit1, habit2);
    compatibility += energyCompatibility * 0.2;
    
    // Time of day compatibility
    const timeCompatibility = this.calculateTimeCompatibility(habit1, habit2);
    compatibility += timeCompatibility * 0.3;
    
    return Math.max(0, Math.min(1, compatibility));
  }

  private calculateEnergyFlowCompatibility(habit1: AtomicHabit, habit2: AtomicHabit): number {
    // Optimal energy flow: low -> medium -> high or high -> medium -> low
    const energyLevels = { low: 1, medium: 2, high: 3 };
    const energy1 = energyLevels[habit1.energyCost];
    const energy2 = energyLevels[habit2.energyCost];
    
    const energyDiff = Math.abs(energy1 - energy2);
    
    // Gradual energy changes are better than dramatic ones
    if (energyDiff <= 1) return 1;
    if (energyDiff === 2) return 0.5;
    return 0.2;
  }

  private calculateTimeCompatibility(habit1: AtomicHabit, habit2: AtomicHabit): number {
    const commonTimes = habit1.optimalTimeOfDay.filter(time => 
      habit2.optimalTimeOfDay.includes(time)
    );
    
    return commonTimes.length / Math.max(habit1.optimalTimeOfDay.length, habit2.optimalTimeOfDay.length);
  }

  private optimizeHabitOrder(
    habits: AtomicHabit[],
    compatibilityMatrix: number[][],
    userProfile: any
  ): AtomicHabit[] {
    // Simplified optimization algorithm
    // In production, this would use more sophisticated algorithms like genetic algorithms
    
    let bestOrder = [...habits];
    let bestScore = this.calculateChainScore(bestOrder, compatibilityMatrix, userProfile);
    
    // Try different permutations and pick the best
    for (let i = 0; i < 100; i++) {
      const newOrder = this.shuffleArray([...habits]);
      const score = this.calculateChainScore(newOrder, compatibilityMatrix, userProfile);
      
      if (score > bestScore) {
        bestScore = score;
        bestOrder = newOrder;
      }
    }
    
    return bestOrder;
  }

  private calculateChainScore(
    order: AtomicHabit[],
    compatibilityMatrix: number[][],
    userProfile: any
  ): number {
    let score = 0;
    
    // Calculate pairwise compatibility scores
    for (let i = 0; i < order.length - 1; i++) {
      const habit1Index = Object.values(this.ATOMIC_HABITS_LIBRARY).findIndex(h => h.id === order[i].id);
      const habit2Index = Object.values(this.ATOMIC_HABITS_LIBRARY).findIndex(h => h.id === order[i + 1].id);
      
      if (habit1Index !== -1 && habit2Index !== -1) {
        score += compatibilityMatrix[habit1Index][habit2Index];
      }
    }
    
    // Bonus for energy flow optimization
    score += this.calculateEnergyFlowScore(order);
    
    // Bonus for time feasibility
    score += this.calculateTimeFeasibilityScore(order);
    
    return score;
  }

  private calculateEnergyFlowScore(order: AtomicHabit[]): number {
    // Reward optimal energy progression
    let score = 0;
    
    for (let i = 0; i < order.length - 1; i++) {
      const current = order[i];
      const next = order[i + 1];
      
      // Reward gradual energy increase in morning
      if (current.energyCost === 'low' && next.energyCost === 'medium') score += 0.5;
      if (current.energyCost === 'medium' && next.energyCost === 'high') score += 0.5;
      
      // Penalize dramatic energy drops
      if (current.energyCost === 'high' && next.energyCost === 'low') score -= 0.3;
    }
    
    return score;
  }

  private calculateTimeFeasibilityScore(order: AtomicHabit[]): number {
    const totalTime = order.reduce((sum, habit) => sum + habit.timeRequired, 0);
    
    // Penalize chains that are too long
    if (totalTime > 120) return -1; // Over 2 hours
    if (totalTime > 90) return -0.5;  // Over 1.5 hours
    if (totalTime > 60) return 0;    // Over 1 hour
    
    return 0.5; // Reasonable duration
  }

  private async createHabitChain(
    userId: string,
    habits: AtomicHabit[],
    preferredTime: string,
    goals: string[]
  ): Promise<HabitChain> {
    const chainId = generateId();
    const now = new Date();
    
    const habitChainItems = habits.map((habit, index) => ({
      habitId: habit.id,
      order: index,
      transitionTime: index < habits.length - 1 ? this.calculateTransitionTime(habit, habits[index + 1]) : 0,
      required: habit.difficultyLevel <= 3, // Easy habits are required, harder ones are optional
    }));
    
    const estimatedDuration = habits.reduce((sum, habit) => sum + habit.timeRequired, 0) +
      habitChainItems.reduce((sum, item) => sum + item.transitionTime, 0);
    
    return {
      id: chainId,
      userId,
      name: `${goals.join(' & ')} Routine`,
      description: `Optimized routine for ${goals.join(', ')} goals`,
      habits: habitChainItems,
      scheduledTime: preferredTime,
      estimatedDuration,
      timeWindow: 30, // 30-minute flexibility window
      energyProfile: this.generateEnergyProfile(habits),
      difficultyProgression: this.determineDifficultyProgression(habits),
      adaptiveRules: this.generateAdaptiveRules(habits),
      streakCurrent: 0,
      streakLongest: 0,
      completionRate: 0,
      lastCompleted: now,
      adherenceHistory: [],
      weakestLink: '',
      strengthScore: this.calculateInitialStrengthScore(habits),
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };
  }

  private calculateTransitionTime(habit1: AtomicHabit, habit2: AtomicHabit): number {
    // Calculate optimal time between habits
    
    if (habit1.energyCost === 'high' && habit2.energyCost === 'low') {
      return 5; // Need recovery time
    }
    
    if (habit1.category !== habit2.category) {
      return 3; // Context switching time
    }
    
    return 1; // Minimal transition
  }

  private generateEnergyProfile(habits: AtomicHabit[]): Array<{ time: number; energy: number }> {
    const profile = [];
    let cumulativeTime = 0;
    
    habits.forEach(habit => {
      const energyLevel = { low: 1, medium: 2, high: 3 }[habit.energyCost];
      profile.push({ time: cumulativeTime, energy: energyLevel });
      cumulativeTime += habit.timeRequired;
    });
    
    return profile;
  }

  private determineDifficultyProgression(habits: AtomicHabit[]): HabitChain['difficultyProgression'] {
    const difficulties = habits.map(h => h.difficultyLevel);
    
    const isAscending = difficulties.every((val, i) => i === 0 || val >= difficulties[i - 1]);
    const isDescending = difficulties.every((val, i) => i === 0 || val <= difficulties[i - 1]);
    
    if (isAscending) return 'ascending';
    if (isDescending) return 'descending';
    
    // Check for peak in middle
    const maxIndex = difficulties.indexOf(Math.max(...difficulties));
    if (maxIndex > 0 && maxIndex < difficulties.length - 1) {
      return 'peak_middle';
    }
    
    return 'custom';
  }

  private generateAdaptiveRules(habits: AtomicHabit[]): HabitChain['adaptiveRules'] {
    const rules = [];
    
    // If low on time, skip optional habits
    const optionalHabits = habits.filter(h => h.difficultyLevel > 3);
    if (optionalHabits.length > 0) {
      rules.push({
        condition: 'short on time',
        modification: 'skip optional habits and use shorter variations',
      });
    }
    
    // If low energy, use easier variations
    const highEnergyHabits = habits.filter(h => h.energyCost === 'high');
    if (highEnergyHabits.length > 0) {
      rules.push({
        condition: 'feeling tired',
        modification: 'use easier variations of high-energy habits',
      });
    }
    
    // If stressed, prioritize wellness habits
    const wellnessHabits = habits.filter(h => h.category === 'wellness');
    if (wellnessHabits.length > 0) {
      rules.push({
        condition: 'feeling stressed',
        modification: 'prioritize wellness habits and extend mindfulness practice',
      });
    }
    
    return rules;
  }

  private calculateInitialStrengthScore(habits: AtomicHabit[]): number {
    // Calculate expected chain resilience based on habit characteristics
    const averageDifficulty = habits.reduce((sum, h) => sum + h.difficultyLevel, 0) / habits.length;
    const evidenceScore = habits.filter(h => h.evidenceLevel === 'high').length / habits.length;
    const popularityScore = habits.reduce((sum, h) => sum + h.popularityScore, 0) / habits.length;
    
    return Math.round(((10 - averageDifficulty) * 0.4 + evidenceScore * 0.3 + popularityScore * 0.3) * 10);
  }

  // ===== ROUTINE OPTIMIZATION ENGINE =====

  async optimizeUserRoutines(userId: string): Promise<RoutineOptimization> {
    console.log(`Optimizing routines for user ${userId}`);
    
    try {
      // 1. Analyze user's current habit chains
      const userChains = await this.getUserHabitChains(userId);
      
      // 2. Analyze adherence patterns
      const adherencePatterns = await this.analyzeAdherencePatterns(userId, userChains);
      
      // 3. Detect user's chronotype and energy patterns
      const chronotype = await this.detectChronotype(userId);
      const energyPattern = await this.analyzeEnergyPattern(userId);
      
      // 4. Get personal factors
      const personalFactors = await this.getPersonalFactors(userId);
      
      // 5. Generate optimization recommendations
      const recommendations = await this.generateOptimizationRecommendations(
        userChains,
        adherencePatterns,
        chronotype,
        personalFactors
      );
      
      return {
        userId,
        recommendations,
        chronotype,
        energyPattern,
        adherencePatterns,
        personalFactors,
        generatedAt: new Date(),
      };

    } catch (error) {
      console.error(`Routine optimization failed for user ${userId}:`, error);
      throw error;
    }
  }

  private async analyzeAdherencePatterns(userId: string, chains: HabitChain[]): Promise<any> {
    // Analyze when user is most successful with their habits
    
    const allHistory = chains.flatMap(chain => chain.adherenceHistory);
    
    if (allHistory.length === 0) {
      return {
        bestDayOfWeek: 'Monday',
        bestTimeOfDay: 'morning',
        averageChainLength: 3,
        dropoffPoint: 2,
      };
    }
    
    // Find best day of week
    const dayStats: Record<string, { total: number; completed: number }> = {};
    allHistory.forEach(entry => {
      const day = entry.date.toLocaleDateString('en-US', { weekday: 'long' });
      if (!dayStats[day]) dayStats[day] = { total: 0, completed: 0 };
      dayStats[day].total++;
      if (entry.completed) dayStats[day].completed++;
    });
    
    const bestDay = Object.entries(dayStats)
      .map(([day, stats]) => ({ day, rate: stats.completed / stats.total }))
      .sort((a, b) => b.rate - a.rate)[0]?.day || 'Monday';
    
    // Calculate average chain length and dropout point
    const completionRates = chains.map(chain => chain.completionRate);
    const averageChainLength = chains.reduce((sum, chain) => sum + chain.habits.length, 0) / chains.length;
    
    return {
      bestDayOfWeek: bestDay,
      bestTimeOfDay: 'morning', // Would analyze actual time data
      averageChainLength: Math.round(averageChainLength),
      dropoffPoint: Math.round(averageChainLength * 0.6), // Typically drop off around 60% through
    };
  }

  private async detectChronotype(userId: string): Promise<'morning' | 'evening' | 'intermediate'> {
    // Analyze user's energy and activity patterns to determine chronotype
    // This would integrate with sleep data, activity patterns, etc.
    return 'intermediate'; // Placeholder
  }

  private async analyzeEnergyPattern(userId: string): Promise<Array<{ hour: number; energy: number }>> {
    // Analyze user's energy levels throughout the day
    // This would integrate with user's energy tracking data
    return [
      { hour: 6, energy: 6 },
      { hour: 9, energy: 8 },
      { hour: 12, energy: 7 },
      { hour: 15, energy: 6 },
      { hour: 18, energy: 7 },
      { hour: 21, energy: 5 },
    ];
  }

  private async getPersonalFactors(userId: string): Promise<any> {
    // Get user's personality and preference factors
    return {
      motivationStyle: 'achievement',
      stressResilience: 'medium',
      changePreference: 'gradual',
      socialInfluence: 'medium',
    };
  }

  private async generateOptimizationRecommendations(
    chains: HabitChain[],
    patterns: any,
    chronotype: string,
    personalFactors: any
  ): Promise<RoutineOptimization['recommendations']> {
    const recommendations = [];
    
    // Analyze each chain for optimization opportunities
    chains.forEach(chain => {
      // Check for timing optimization
      if (chain.completionRate < 0.7) {
        recommendations.push({
          type: 'timing',
          target: chain.id,
          suggestion: `Move routine to ${patterns.bestTimeOfDay} for better adherence`,
          reasoning: `Your completion rate is ${Math.round(chain.completionRate * 100)}%, but you're most successful during ${patterns.bestTimeOfDay}`,
          expectedImprovement: 25,
          effort: 'low',
          priority: 8,
        });
      }
      
      // Check for habit reordering
      if (chain.weakestLink) {
        recommendations.push({
          type: 'reorder',
          target: chain.weakestLink,
          suggestion: 'Move this habit earlier in the chain or make it optional',
          reasoning: 'This habit has the highest failure rate and may be causing chain breakdown',
          expectedImprovement: 20,
          effort: 'low',
          priority: 7,
        });
      }
      
      // Check for difficulty optimization
      if (chain.completionRate < 0.5 && chain.strengthScore < 5) {
        const hardHabits = chain.habits.filter(h => {
          const habit = this.ATOMIC_HABITS_LIBRARY[h.habitId];
          return habit && habit.difficultyLevel > 6;
        });
        
        if (hardHabits.length > 0) {
          recommendations.push({
            type: 'substitute',
            target: hardHabits[0].habitId,
            suggestion: 'Replace with an easier variation or similar habit',
            reasoning: 'High difficulty habits are causing chain failure',
            expectedImprovement: 30,
            effort: 'medium',
            priority: 9,
          });
        }
      }
    });
    
    // Sort by priority
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  // ===== MICRO-HABIT INSERTION SYSTEM =====

  async discoverMicroHabitOpportunities(userId: string): Promise<MicroHabitOpportunity[]> {
    console.log(`Discovering micro-habit opportunities for user ${userId}`);
    
    // This would analyze user's calendar, commute patterns, waiting times, etc.
    // Placeholder implementation
    
    return [
      {
        id: generateId(),
        userId,
        timeWindow: { start: '08:15', end: '08:30', duration: 15 },
        context: 'commute',
        location: 'commute',
        recommendedHabits: [
          {
            habitId: 'mindfulness_practice',
            fitScore: 0.9,
            reasoning: 'Perfect time for breathing exercise during commute',
          },
        ],
        frequency: 'weekdays',
        discovered: new Date(),
        utilized: false,
      },
      {
        id: generateId(),
        userId,
        timeWindow: { start: '12:45', end: '12:50', duration: 5 },
        context: 'break',
        location: 'work',
        recommendedHabits: [
          {
            habitId: 'gratitude_practice',
            fitScore: 0.8,
            reasoning: 'Quick gratitude reflection during lunch break',
          },
        ],
        frequency: 'weekdays',
        discovered: new Date(),
        utilized: false,
      },
    ];
  }

  // ===== HABIT SUCCESS PREDICTOR =====

  async predictHabitChainSuccess(
    userId: string,
    proposedChain: Partial<HabitChain>
  ): Promise<{
    predictedCompletionRate: number;
    confidence: number;
    riskFactors: string[];
    successFactors: string[];
  }> {
    // Analyze factors that predict success for this specific user and chain
    
    const userProfile = await this.getUserProfile(userId);
    const userHistory = await this.getUserHabitHistory(userId);
    
    let baseSuccessRate = 0.7; // Base success rate
    let confidence = 0.8;
    const riskFactors = [];
    const successFactors = [];
    
    // Analyze chain characteristics
    if (proposedChain.habits && proposedChain.habits.length > 5) {
      baseSuccessRate -= 0.1;
      riskFactors.push('Long chain length may reduce adherence');
    }
    
    if (proposedChain.estimatedDuration && proposedChain.estimatedDuration > 60) {
      baseSuccessRate -= 0.15;
      riskFactors.push('Extended duration may be challenging to maintain');
    }
    
    // Analyze habit difficulty
    const habits = proposedChain.habits?.map(h => this.ATOMIC_HABITS_LIBRARY[h.habitId]).filter(Boolean) || [];
    const averageDifficulty = habits.reduce((sum, h) => sum + h.difficultyLevel, 0) / habits.length;
    
    if (averageDifficulty > 6) {
      baseSuccessRate -= 0.2;
      riskFactors.push('High average difficulty level');
    } else if (averageDifficulty < 3) {
      baseSuccessRate += 0.1;
      successFactors.push('Manageable difficulty level');
    }
    
    // Consider user's past performance
    if (userHistory.averageCompletionRate) {
      baseSuccessRate = (baseSuccessRate + userHistory.averageCompletionRate) / 2;
      successFactors.push('Based on your historical performance');
    }
    
    return {
      predictedCompletionRate: Math.max(0.1, Math.min(0.95, baseSuccessRate)),
      confidence,
      riskFactors,
      successFactors,
    };
  }

  // ===== HELPER METHODS =====

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private async getUserProfile(userId: string): Promise<any> {
    // Get user profile data
    return { chronotype: 'intermediate', preferences: {} };
  }

  private async getUserHabitChains(userId: string): Promise<HabitChain[]> {
    const snapshot = await db.collection('habit_chains')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();
    
    return queryToArray<HabitChain>(snapshot);
  }

  private async getUserHabitHistory(userId: string): Promise<any> {
    // Get user's habit performance history
    return { averageCompletionRate: 0.65 };
  }

  private async saveHabitChain(chain: HabitChain): Promise<void> {
    await db.collection('habit_chains').doc(chain.id).set(chain);
  }

  // ===== PUBLIC API METHODS =====

  async getAtomicHabitsLibrary(): Promise<Record<string, AtomicHabit>> {
    return this.ATOMIC_HABITS_LIBRARY;
  }

  async updateHabitChainAdherence(
    chainId: string,
    completion: {
      completed: boolean;
      habitsCompleted: number;
      totalHabits: number;
      duration: number;
      difficulty: number;
      energy: number;
      mood: number;
      notes?: string;
    }
  ): Promise<void> {
    const chainRef = db.collection('habit_chains').doc(chainId);
    const chainDoc = await chainRef.get();
    
    if (!chainDoc.exists) return;
    
    const chain = chainDoc.data() as HabitChain;
    
    // Update adherence history
    chain.adherenceHistory.push({
      date: new Date(),
      ...completion,
    });
    
    // Update streak
    if (completion.completed) {
      chain.streakCurrent++;
      chain.streakLongest = Math.max(chain.streakLongest, chain.streakCurrent);
      chain.lastCompleted = new Date();
    } else {
      chain.streakCurrent = 0;
    }
    
    // Update completion rate (last 30 days)
    const last30Days = chain.adherenceHistory.filter(
      entry => Date.now() - entry.date.getTime() < 30 * 24 * 60 * 60 * 1000
    );
    chain.completionRate = last30Days.length > 0 
      ? last30Days.filter(entry => entry.completed).length / last30Days.length 
      : 0;
    
    chain.updatedAt = new Date();
    
    await chainRef.update(chain);
  }
}

// Export singleton instance
export const habitStackingEngine = HabitStackingEngine.getInstance();
