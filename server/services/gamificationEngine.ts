/**
 * PHASE 3.6: Gamification System
 * Sophisticated gamification layer that makes health optimization genuinely fun
 * Taps into human drives for progress, competition, and achievement while maintaining authenticity
 */

import { db, COLLECTIONS, queryToArray, generateId } from '../db';
import { cacheService } from './cacheService';

// Character stats system reflecting real health improvements
interface CharacterStats {
  userId: string;
  
  // Primary attributes (RPG-style)
  strength: {
    current: number;
    max: number;
    experience: number;
    level: number;
    bonuses: Array<{ source: string; value: number; expires?: Date }>;
  };
  
  intelligence: {
    current: number;
    max: number;
    experience: number;
    level: number;
    bonuses: Array<{ source: string; value: number; expires?: Date }>;
  };
  
  wisdom: {
    current: number;
    max: number;
    experience: number;
    level: number;
    bonuses: Array<{ source: string; value: number; expires?: Date }>;
  };
  
  vitality: {
    current: number;
    max: number;
    experience: number;
    level: number;
    bonuses: Array<{ source: string; value: number; expires?: Date }>;
  };
  
  charisma: {
    current: number;
    max: number;
    experience: number;
    level: number;
    bonuses: Array<{ source: string; value: number; expires?: Date }>;
  };
  
  // Derived stats
  overall_level: number;
  total_experience: number;
  
  // Visual representation
  avatar_customization: {
    skin_tone: string;
    hair_style: string;
    hair_color: string;
    clothing_style: string;
    accessories: string[];
    background_theme: string;
  };
  
  // Progression tracking
  daily_gains: Record<string, number>; // Stat gains from today
  weekly_gains: Record<string, number>; // Stat gains this week
  
  last_updated: Date;
  created_at: Date;
}

// Skill tree system with unlockable features
interface SkillTree {
  userId: string;
  
  // Health mastery branch
  health_mastery: {
    // Tier 1 (0-50 workouts)
    fitness_fundamentals: {
      unlocked: boolean;
      progress: number;
      max_progress: number;
      benefits: string[];
      prerequisites: string[];
    };
    
    // Tier 2 (50-150 workouts)
    advanced_biometrics: {
      unlocked: boolean;
      progress: number;
      max_progress: number;
      benefits: string[];
      prerequisites: string[];
    };
    
    // Tier 3 (150+ workouts)
    performance_optimization: {
      unlocked: boolean;
      progress: number;
      max_progress: number;
      benefits: string[];
      prerequisites: string[];
    };
  };
  
  // Nutrition mastery branch
  nutrition_mastery: {
    // Tier 1 (0-100 healthy meals)
    nutrition_awareness: {
      unlocked: boolean;
      progress: number;
      max_progress: number;
      benefits: string[];
      prerequisites: string[];
    };
    
    // Tier 2 (100-300 healthy meals)
    macro_optimization: {
      unlocked: boolean;
      progress: number;
      max_progress: number;
      benefits: string[];
      prerequisites: string[];
    };
    
    // Tier 3 (300+ healthy meals)
    personalized_nutrition: {
      unlocked: boolean;
      progress: number;
      max_progress: number;
      benefits: string[];
      prerequisites: string[];
    };
  };
  
  // Mindfulness mastery branch
  mindfulness_mastery: {
    // Tier 1 (0-50 meditation sessions)
    mindfulness_foundation: {
      unlocked: boolean;
      progress: number;
      max_progress: number;
      benefits: string[];
      prerequisites: string[];
    };
    
    // Tier 2 (50-200 meditation sessions)
    focus_analytics: {
      unlocked: boolean;
      progress: number;
      max_progress: number;
      benefits: string[];
      prerequisites: string[];
    };
    
    // Tier 3 (200+ meditation sessions)
    consciousness_mastery: {
      unlocked: boolean;
      progress: number;
      max_progress: number;
      benefits: string[];
      prerequisites: string[];
    };
  };
  
  // Sleep mastery branch
  sleep_mastery: {
    sleep_hygiene: {
      unlocked: boolean;
      progress: number;
      max_progress: number;
      benefits: string[];
      prerequisites: string[];
    };
    
    circadian_optimization: {
      unlocked: boolean;
      progress: number;
      max_progress: number;
      benefits: string[];
      prerequisites: string[];
    };
    
    recovery_mastery: {
      unlocked: boolean;
      progress: number;
      max_progress: number;
      benefits: string[];
      prerequisites: string[];
    };
  };
  
  // Available skill points
  available_skill_points: number;
  total_skill_points_earned: number;
  
  updated_at: Date;
}

// Achievement system with multiple categories and tiers
interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'fitness' | 'nutrition' | 'sleep' | 'mindfulness' | 'consistency' | 'social' | 'learning' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
  
  // Requirements
  requirements: {
    type: 'count' | 'streak' | 'threshold' | 'combo' | 'time_based' | 'social';
    criteria: Record<string, any>;
  };
  
  // Rewards
  rewards: {
    experience_points: Record<string, number>; // stat -> XP amount
    skill_points: number;
    avatar_items?: string[];
    titles?: string[];
    badges?: string[];
    special_features?: string[];
  };
  
  // Metadata
  rarity: number; // 0-1, how rare this achievement is
  difficulty: number; // 1-10 difficulty scale
  icon: string;
  unlock_message: string;
  
  // Hidden achievements
  is_hidden: boolean; // Don't show until unlocked
  is_secret: boolean; // Don't show requirements
  
  created_at: Date;
}

// User's achievement progress
interface UserAchievement {
  userId: string;
  achievementId: string;
  
  // Progress tracking
  current_progress: Record<string, any>;
  is_completed: boolean;
  completed_at?: Date;
  
  // Context when achieved
  completion_context?: {
    triggered_by: string; // What action triggered completion
    streak_at_time?: number;
    level_at_time?: number;
    companions?: string[]; // Other users involved
  };
  
  // Celebration
  has_been_celebrated: boolean;
  celebration_viewed_at?: Date;
  
  created_at: Date;
  updated_at: Date;
}

// Territory competition system
interface Territory {
  id: string;
  name: string;
  description: string;
  
  // Geographic bounds
  center_lat: number;
  center_lng: number;
  radius_km: number;
  
  // Territory characteristics
  territory_type: 'city' | 'neighborhood' | 'park' | 'gym' | 'university' | 'workplace' | 'virtual';
  difficulty_level: number; // 1-10, how hard to capture/maintain
  
  // Current control
  controlling_team?: string;
  control_strength: number; // 0-100
  last_captured: Date;
  
  // Capture mechanics
  capture_requirements: {
    min_activity_points: number;
    time_window_hours: number;
    min_participants: number;
    activity_types: string[];
  };
  
  // Territory bonuses
  bonuses: {
    experience_multiplier: number;
    social_bonus: number;
    special_rewards: string[];
  };
  
  // Competition tracking
  current_season: string;
  leaderboard: Array<{
    team_id: string;
    team_name: string;
    control_time_hours: number;
    last_activity: Date;
  }>;
  
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

// Team/guild system for territory competition
interface Team {
  id: string;
  name: string;
  description: string;
  motto: string;
  
  // Team identity
  color_primary: string;
  color_secondary: string;
  emblem: string;
  
  // Membership
  leader_id: string;
  officers: string[];
  members: string[];
  max_size: number;
  
  // Team stats
  total_experience: number;
  territories_controlled: string[];
  achievements_unlocked: string[];
  
  // Team bonuses
  active_bonuses: Array<{
    bonus_type: string;
    multiplier: number;
    expires_at: Date;
  }>;
  
  // Competition metrics
  seasonal_ranking: number;
  wins_this_season: number;
  total_activity_points: number;
  
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

// Leaderboard system with multiple timeframes
interface Leaderboard {
  id: string;
  type: 'individual' | 'team' | 'territory';
  category: 'overall' | 'fitness' | 'nutrition' | 'sleep' | 'mindfulness' | 'consistency';
  timeframe: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'all_time';
  
  entries: Array<{
    rank: number;
    user_id?: string;
    team_id?: string;
    display_name: string;
    score: number;
    additional_stats?: Record<string, any>;
    badge?: string;
    streak?: number;
  }>;
  
  // Metadata
  total_participants: number;
  last_updated: Date;
  season_id?: string;
  
  // Rewards for top positions
  rank_rewards: Record<number, {
    experience_points: Record<string, number>;
    titles: string[];
    badges: string[];
    special_items: string[];
  }>;
}

// Seasonal competition system
interface Season {
  id: string;
  name: string;
  theme: string;
  description: string;
  
  // Timing
  start_date: Date;
  end_date: Date;
  registration_deadline: Date;
  
  // Competition format
  format: 'territory_control' | 'individual_challenge' | 'team_tournament' | 'global_goal';
  objectives: Array<{
    name: string;
    description: string;
    points: number;
    category: string;
  }>;
  
  // Participation
  registered_users: string[];
  registered_teams: string[];
  max_participants?: number;
  
  // Rewards
  grand_prizes: {
    first_place: string[];
    second_place: string[];
    third_place: string[];
    participation: string[];
  };
  
  // Progress tracking
  current_leaders: {
    individual: string;
    team: string;
  };
  
  is_active: boolean;
  is_registration_open: boolean;
}

export class GamificationEngine {
  private static instance: GamificationEngine;
  
  // Achievement library
  private readonly ACHIEVEMENT_LIBRARY: Record<string, Achievement> = {
    // FITNESS ACHIEVEMENTS
    first_workout: {
      id: 'first_workout',
      name: 'First Steps',
      description: 'Complete your first workout',
      category: 'fitness',
      tier: 'bronze',
      requirements: {
        type: 'count',
        criteria: { workout_count: 1 }
      },
      rewards: {
        experience_points: { strength: 50, vitality: 25 },
        skill_points: 1,
        titles: ['Beginner']
      },
      rarity: 1.0,
      difficulty: 1,
      icon: '💪',
      unlock_message: 'Every journey begins with a single step. You\'ve taken yours!',
      is_hidden: false,
      is_secret: false,
      created_at: new Date(),
    },
    
    workout_streak_7: {
      id: 'workout_streak_7',
      name: 'Week Warrior',
      description: 'Exercise for 7 consecutive days',
      category: 'fitness',
      tier: 'silver',
      requirements: {
        type: 'streak',
        criteria: { activity_type: 'workout', streak_days: 7 }
      },
      rewards: {
        experience_points: { strength: 200, vitality: 100, wisdom: 50 },
        skill_points: 3,
        badges: ['Week Warrior']
      },
      rarity: 0.3,
      difficulty: 4,
      icon: '🔥',
      unlock_message: 'Consistency builds champions. A week of dedication shows true commitment!',
      is_hidden: false,
      is_secret: false,
      created_at: new Date(),
    },
    
    strength_milestone_50: {
      id: 'strength_milestone_50',
      name: 'Iron Body',
      description: 'Reach 50 Strength points',
      category: 'fitness',
      tier: 'gold',
      requirements: {
        type: 'threshold',
        criteria: { stat: 'strength', value: 50 }
      },
      rewards: {
        experience_points: { strength: 500 },
        skill_points: 5,
        avatar_items: ['Iron Armor'],
        titles: ['Iron Body']
      },
      rarity: 0.15,
      difficulty: 6,
      icon: '⚔️',
      unlock_message: 'Your dedication has forged a body of iron. Strength flows through you!',
      is_hidden: false,
      is_secret: false,
      created_at: new Date(),
    },
    
    // NUTRITION ACHIEVEMENTS
    healthy_meal_streak_30: {
      id: 'healthy_meal_streak_30',
      name: 'Nutrition Master',
      description: 'Eat healthy for 30 consecutive days',
      category: 'nutrition',
      tier: 'gold',
      requirements: {
        type: 'streak',
        criteria: { activity_type: 'healthy_meal', streak_days: 30 }
      },
      rewards: {
        experience_points: { vitality: 300, wisdom: 200 },
        skill_points: 7,
        special_features: ['Advanced Nutrition Tracking']
      },
      rarity: 0.08,
      difficulty: 7,
      icon: '🥗',
      unlock_message: 'You\'ve mastered the art of nourishment. Your body thanks you!',
      is_hidden: false,
      is_secret: false,
      created_at: new Date(),
    },
    
    // SLEEP ACHIEVEMENTS
    perfect_sleep_week: {
      id: 'perfect_sleep_week',
      name: 'Dream Weaver',
      description: 'Achieve optimal sleep (7-9 hours) for 7 consecutive nights',
      category: 'sleep',
      tier: 'silver',
      requirements: {
        type: 'streak',
        criteria: { activity_type: 'optimal_sleep', streak_days: 7 }
      },
      rewards: {
        experience_points: { vitality: 250, wisdom: 100 },
        skill_points: 4,
        badges: ['Dream Weaver']
      },
      rarity: 0.25,
      difficulty: 5,
      icon: '🌙',
      unlock_message: 'Perfect sleep is the foundation of greatness. Sweet dreams!',
      is_hidden: false,
      is_secret: false,
      created_at: new Date(),
    },
    
    // MINDFULNESS ACHIEVEMENTS
    meditation_enlightenment: {
      id: 'meditation_enlightenment',
      name: 'Zen Master',
      description: 'Complete 200 meditation sessions',
      category: 'mindfulness',
      tier: 'platinum',
      requirements: {
        type: 'count',
        criteria: { meditation_count: 200 }
      },
      rewards: {
        experience_points: { wisdom: 1000, charisma: 500 },
        skill_points: 15,
        avatar_items: ['Zen Robes', 'Meditation Beads'],
        titles: ['Zen Master'],
        special_features: ['Advanced Mindfulness Analytics']
      },
      rarity: 0.02,
      difficulty: 9,
      icon: '🧘',
      unlock_message: 'Through dedication and practice, you have achieved true mindfulness mastery.',
      is_hidden: false,
      is_secret: false,
      created_at: new Date(),
    },
    
    // SOCIAL ACHIEVEMENTS
    mentor_5_users: {
      id: 'mentor_5_users',
      name: 'Wisdom Keeper',
      description: 'Successfully mentor 5 other users',
      category: 'social',
      tier: 'gold',
      requirements: {
        type: 'count',
        criteria: { successful_mentorships: 5 }
      },
      rewards: {
        experience_points: { charisma: 400, wisdom: 300 },
        skill_points: 8,
        titles: ['Wisdom Keeper', 'Mentor']
      },
      rarity: 0.05,
      difficulty: 8,
      icon: '🌟',
      unlock_message: 'Your wisdom has guided others on their journey. A true teacher emerges!',
      is_hidden: false,
      is_secret: false,
      created_at: new Date(),
    },
    
    // HIDDEN/SECRET ACHIEVEMENTS
    midnight_warrior: {
      id: 'midnight_warrior',
      name: 'Midnight Warrior',
      description: 'Exercise at midnight',
      category: 'special',
      tier: 'bronze',
      requirements: {
        type: 'time_based',
        criteria: { activity_type: 'workout', time_range: ['23:30', '00:30'] }
      },
      rewards: {
        experience_points: { strength: 100 },
        skill_points: 2,
        badges: ['Night Owl']
      },
      rarity: 0.01,
      difficulty: 3,
      icon: '🦉',
      unlock_message: 'When others sleep, you train. The night is your domain!',
      is_hidden: true,
      is_secret: true,
      created_at: new Date(),
    },
    
    // LEGENDARY ACHIEVEMENTS
    longevity_legend: {
      id: 'longevity_legend',
      name: 'Longevity Legend',
      description: 'Maintain consistent health optimization for 365 days',
      category: 'consistency',
      tier: 'legendary',
      requirements: {
        type: 'combo',
        criteria: {
          consecutive_days: 365,
          min_daily_score: 70,
          categories: ['fitness', 'nutrition', 'sleep', 'mindfulness']
        }
      },
      rewards: {
        experience_points: { 
          strength: 2000, 
          intelligence: 2000, 
          wisdom: 2000, 
          vitality: 2000, 
          charisma: 2000 
        },
        skill_points: 50,
        avatar_items: ['Legendary Crown', 'Immortal Aura'],
        titles: ['Longevity Legend', 'Immortal'],
        special_features: ['Legendary Status', 'All Advanced Features']
      },
      rarity: 0.001,
      difficulty: 10,
      icon: '👑',
      unlock_message: 'You have achieved what few ever will - true mastery of longevity. You are a legend!',
      is_hidden: false,
      is_secret: false,
      created_at: new Date(),
    },
  };

  public static getInstance(): GamificationEngine {
    if (!GamificationEngine.instance) {
      GamificationEngine.instance = new GamificationEngine();
    }
    return GamificationEngine.instance;
  }

  // ===== CHARACTER STATS SYSTEM =====

  /**
   * Update character stats based on real activities
   */
  async updateCharacterStats(
    userId: string,
    activity: {
      type: 'workout' | 'healthy_meal' | 'meditation' | 'good_sleep' | 'learning' | 'social_interaction';
      intensity?: number; // 1-10
      duration?: number; // minutes
      quality?: number; // 1-10
      metadata?: Record<string, any>;
    }
  ): Promise<CharacterStats> {
    console.log(`Updating character stats for user ${userId}, activity: ${activity.type}`);
    
    try {
      // Get current character stats
      let characterStats = await this.getCharacterStats(userId);
      
      if (!characterStats) {
        characterStats = await this.initializeCharacterStats(userId);
      }
      
      // Calculate stat gains based on activity
      const statGains = this.calculateStatGains(activity);
      
      // Apply stat gains
      Object.entries(statGains).forEach(([stat, gain]) => {
        if (characterStats[stat as keyof CharacterStats]) {
          const statObj = characterStats[stat as keyof CharacterStats] as any;
          if (statObj.experience !== undefined) {
            statObj.experience += gain;
            
            // Check for level ups
            const newLevel = this.calculateLevel(statObj.experience);
            if (newLevel > statObj.level) {
              statObj.level = newLevel;
              statObj.current = Math.min(statObj.max, statObj.current + (newLevel - statObj.level) * 2);
              
              // Trigger level up celebration
              await this.triggerLevelUpCelebration(userId, stat, newLevel);
            }
          }
        }
      });
      
      // Update daily and weekly gains tracking
      const today = new Date().toDateString();
      Object.entries(statGains).forEach(([stat, gain]) => {
        characterStats.daily_gains[stat] = (characterStats.daily_gains[stat] || 0) + gain;
      });
      
      // Recalculate overall level
      characterStats.overall_level = this.calculateOverallLevel(characterStats);
      characterStats.total_experience = this.calculateTotalExperience(characterStats);
      characterStats.last_updated = new Date();
      
      // Save to database
      await this.saveCharacterStats(userId, characterStats);
      
      // Check for stat-based achievements
      await this.checkStatAchievements(userId, characterStats);
      
      console.log(`Updated character stats for user ${userId}. Gains: ${JSON.stringify(statGains)}`);
      return characterStats;

    } catch (error) {
      console.error(`Failed to update character stats for user ${userId}:`, error);
      throw error;
    }
  }

  private calculateStatGains(activity: {
    type: string;
    intensity?: number;
    duration?: number;
    quality?: number;
    metadata?: Record<string, any>;
  }): Record<string, number> {
    const gains: Record<string, number> = {};
    
    const intensity = activity.intensity || 5;
    const duration = activity.duration || 30;
    const quality = activity.quality || 5;
    
    switch (activity.type) {
      case 'workout':
        gains.strength = Math.round(intensity * 10 + (duration / 30) * 5);
        gains.vitality = Math.round(intensity * 5 + (duration / 30) * 3);
        if (intensity >= 7) gains.wisdom += 2; // High intensity builds mental toughness
        break;
        
      case 'healthy_meal':
        gains.vitality = Math.round(quality * 8);
        gains.wisdom = Math.round(quality * 3); // Nutrition knowledge
        break;
        
      case 'meditation':
        gains.wisdom = Math.round(duration * 2 + quality * 5);
        gains.charisma = Math.round(duration * 1 + quality * 2); // Inner peace affects presence
        if (duration >= 20) gains.intelligence += 3; // Longer sessions build focus
        break;
        
      case 'good_sleep':
        gains.vitality = Math.round(quality * 10);
        gains.strength = Math.round(quality * 3); // Recovery builds strength
        gains.intelligence = Math.round(quality * 3); // Sleep consolidates learning
        break;
        
      case 'learning':
        gains.intelligence = Math.round(duration * 2 + quality * 5);
        gains.wisdom = Math.round(duration * 1 + quality * 2);
        break;
        
      case 'social_interaction':
        gains.charisma = Math.round(quality * 8 + duration * 1);
        gains.wisdom = Math.round(quality * 2); // Social intelligence
        break;
    }
    
    return gains;
  }

  private calculateLevel(experience: number): number {
    // Exponential leveling curve: level = floor(sqrt(experience / 100))
    return Math.floor(Math.sqrt(experience / 100));
  }

  private calculateOverallLevel(stats: CharacterStats): number {
    const avgLevel = (
      stats.strength.level +
      stats.intelligence.level +
      stats.wisdom.level +
      stats.vitality.level +
      stats.charisma.level
    ) / 5;
    
    return Math.floor(avgLevel);
  }

  private calculateTotalExperience(stats: CharacterStats): number {
    return (
      stats.strength.experience +
      stats.intelligence.experience +
      stats.wisdom.experience +
      stats.vitality.experience +
      stats.charisma.experience
    );
  }

  // ===== SKILL TREE SYSTEM =====

  async updateSkillProgress(
    userId: string,
    activity: {
      type: string;
      count?: number;
      achievement?: string;
    }
  ): Promise<void> {
    const skillTree = await this.getSkillTree(userId);
    
    if (!skillTree) return;
    
    // Update progress based on activity
    switch (activity.type) {
      case 'workout':
        this.updateHealthMasteryProgress(skillTree, activity.count || 1);
        break;
      case 'healthy_meal':
        this.updateNutritionMasteryProgress(skillTree, activity.count || 1);
        break;
      case 'meditation':
        this.updateMindfulnessMasteryProgress(skillTree, activity.count || 1);
        break;
      case 'good_sleep':
        this.updateSleepMasteryProgress(skillTree, activity.count || 1);
        break;
    }
    
    // Check for skill unlocks
    await this.checkSkillUnlocks(userId, skillTree);
    
    // Save updated skill tree
    await this.saveSkillTree(userId, skillTree);
  }

  private updateHealthMasteryProgress(skillTree: SkillTree, workoutCount: number): void {
    const health = skillTree.health_mastery;
    
    // Update fitness fundamentals (0-50 workouts)
    if (!health.fitness_fundamentals.unlocked && health.fitness_fundamentals.progress < 50) {
      health.fitness_fundamentals.progress = Math.min(50, health.fitness_fundamentals.progress + workoutCount);
      if (health.fitness_fundamentals.progress >= 50) {
        health.fitness_fundamentals.unlocked = true;
        skillTree.available_skill_points += 2;
      }
    }
    
    // Update advanced biometrics (50-150 workouts)
    if (health.fitness_fundamentals.unlocked && !health.advanced_biometrics.unlocked) {
      health.advanced_biometrics.progress = Math.min(150, health.advanced_biometrics.progress + workoutCount);
      if (health.advanced_biometrics.progress >= 150) {
        health.advanced_biometrics.unlocked = true;
        skillTree.available_skill_points += 5;
      }
    }
    
    // Update performance optimization (150+ workouts)
    if (health.advanced_biometrics.unlocked && !health.performance_optimization.unlocked) {
      health.performance_optimization.progress += workoutCount;
      if (health.performance_optimization.progress >= 300) {
        health.performance_optimization.unlocked = true;
        skillTree.available_skill_points += 10;
      }
    }
  }

  // Similar methods for other skill branches...
  private updateNutritionMasteryProgress(skillTree: SkillTree, mealCount: number): void {
    // Implementation similar to health mastery
  }

  private updateMindfulnessMasteryProgress(skillTree: SkillTree, sessionCount: number): void {
    // Implementation similar to health mastery
  }

  private updateSleepMasteryProgress(skillTree: SkillTree, nightCount: number): void {
    // Implementation similar to health mastery
  }

  // ===== ACHIEVEMENT SYSTEM =====

  async checkAchievements(
    userId: string,
    activity: {
      type: string;
      value?: any;
      streak?: number;
      context?: Record<string, any>;
    }
  ): Promise<Achievement[]> {
    console.log(`Checking achievements for user ${userId}, activity: ${activity.type}`);
    
    const newAchievements = [];
    
    // Get user's current achievements
    const userAchievements = await this.getUserAchievements(userId);
    const completedAchievementIds = userAchievements
      .filter(ua => ua.is_completed)
      .map(ua => ua.achievementId);
    
    // Check each achievement
    for (const [achievementId, achievement] of Object.entries(this.ACHIEVEMENT_LIBRARY)) {
      // Skip if already completed
      if (completedAchievementIds.includes(achievementId)) continue;
      
      // Check if activity is relevant to this achievement
      if (!this.isActivityRelevantToAchievement(activity, achievement)) continue;
      
      // Get current progress for this achievement
      let userAchievement = userAchievements.find(ua => ua.achievementId === achievementId);
      
      if (!userAchievement) {
        userAchievement = await this.initializeUserAchievement(userId, achievementId);
      }
      
      // Update progress
      const wasCompleted = await this.updateAchievementProgress(userAchievement, achievement, activity);
      
      if (wasCompleted) {
        newAchievements.push(achievement);
        
        // Apply rewards
        await this.applyAchievementRewards(userId, achievement);
        
        // Trigger celebration
        await this.triggerAchievementCelebration(userId, achievement);
      }
      
      // Save progress
      await this.saveUserAchievement(userAchievement);
    }
    
    console.log(`User ${userId} unlocked ${newAchievements.length} new achievements`);
    return newAchievements;
  }

  private isActivityRelevantToAchievement(activity: any, achievement: Achievement): boolean {
    // Map activity types to achievement categories
    const relevantActivities: Record<string, string[]> = {
      fitness: ['workout', 'exercise', 'training'],
      nutrition: ['healthy_meal', 'meal_log', 'nutrition'],
      sleep: ['good_sleep', 'sleep_log', 'bedtime'],
      mindfulness: ['meditation', 'mindfulness', 'breathing'],
      social: ['social_interaction', 'mentoring', 'partnership'],
    };
    
    const activityTypes = relevantActivities[achievement.category] || [];
    return activityTypes.includes(activity.type);
  }

  private async updateAchievementProgress(
    userAchievement: UserAchievement,
    achievement: Achievement,
    activity: any
  ): Promise<boolean> {
    const requirements = achievement.requirements;
    let wasCompleted = false;
    
    switch (requirements.type) {
      case 'count':
        const countField = Object.keys(requirements.criteria)[0];
        const targetCount = requirements.criteria[countField];
        
        userAchievement.current_progress[countField] = 
          (userAchievement.current_progress[countField] || 0) + (activity.value || 1);
        
        if (userAchievement.current_progress[countField] >= targetCount) {
          userAchievement.is_completed = true;
          userAchievement.completed_at = new Date();
          wasCompleted = true;
        }
        break;
        
      case 'streak':
        if (activity.streak >= requirements.criteria.streak_days) {
          userAchievement.is_completed = true;
          userAchievement.completed_at = new Date();
          wasCompleted = true;
        }
        break;
        
      case 'threshold':
        const stat = requirements.criteria.stat;
        const targetValue = requirements.criteria.value;
        
        if (activity.context && activity.context[stat] >= targetValue) {
          userAchievement.is_completed = true;
          userAchievement.completed_at = new Date();
          wasCompleted = true;
        }
        break;
        
      // Add more requirement types as needed
    }
    
    userAchievement.updated_at = new Date();
    return wasCompleted;
  }

  private async applyAchievementRewards(userId: string, achievement: Achievement): Promise<void> {
    const rewards = achievement.rewards;
    
    // Apply experience points
    if (rewards.experience_points) {
      for (const [stat, xp] of Object.entries(rewards.experience_points)) {
        await this.updateCharacterStats(userId, {
          type: 'achievement_bonus',
          metadata: { stat, xp, achievement_id: achievement.id }
        });
      }
    }
    
    // Apply skill points
    if (rewards.skill_points > 0) {
      const skillTree = await this.getSkillTree(userId);
      if (skillTree) {
        skillTree.available_skill_points += rewards.skill_points;
        skillTree.total_skill_points_earned += rewards.skill_points;
        await this.saveSkillTree(userId, skillTree);
      }
    }
    
    // Apply avatar items, titles, badges, etc.
    if (rewards.avatar_items || rewards.titles || rewards.badges) {
      await this.updateUserUnlockables(userId, {
        avatar_items: rewards.avatar_items || [],
        titles: rewards.titles || [],
        badges: rewards.badges || [],
      });
    }
  }

  // ===== TERRITORY COMPETITION SYSTEM =====

  async captureTerritory(
    teamId: string,
    territoryId: string,
    participants: Array<{
      userId: string;
      activity_points: number;
      activities: string[];
    }>
  ): Promise<boolean> {
    console.log(`Team ${teamId} attempting to capture territory ${territoryId}`);
    
    try {
      const territory = await this.getTerritory(territoryId);
      if (!territory) return false;
      
      const team = await this.getTeam(teamId);
      if (!team) return false;
      
      // Check capture requirements
      const totalActivityPoints = participants.reduce((sum, p) => sum + p.activity_points, 0);
      const timeWindow = territory.capture_requirements.time_window_hours;
      const minPoints = territory.capture_requirements.min_activity_points;
      const minParticipants = territory.capture_requirements.min_participants;
      
      if (totalActivityPoints < minPoints) return false;
      if (participants.length < minParticipants) return false;
      
      // Calculate capture strength
      const captureStrength = Math.min(100, 
        (totalActivityPoints / minPoints) * 50 + 
        (participants.length / minParticipants) * 50
      );
      
      // Update territory control
      territory.controlling_team = teamId;
      territory.control_strength = captureStrength;
      territory.last_captured = new Date();
      territory.updated_at = new Date();
      
      // Update leaderboard
      const existingEntry = territory.leaderboard.find(entry => entry.team_id === teamId);
      if (existingEntry) {
        existingEntry.control_time_hours += timeWindow;
        existingEntry.last_activity = new Date();
      } else {
        territory.leaderboard.push({
          team_id: teamId,
          team_name: team.name,
          control_time_hours: timeWindow,
          last_activity: new Date(),
        });
      }
      
      // Sort leaderboard
      territory.leaderboard.sort((a, b) => b.control_time_hours - a.control_time_hours);
      
      // Save territory
      await this.saveTerritory(territory);
      
      // Update team stats
      if (!team.territories_controlled.includes(territoryId)) {
        team.territories_controlled.push(territoryId);
        await this.saveTeam(team);
      }
      
      // Notify participants
      await this.notifyTerritoryCapture(teamId, territoryId, participants.map(p => p.userId));
      
      console.log(`Territory ${territoryId} captured by team ${teamId}`);
      return true;

    } catch (error) {
      console.error(`Failed to capture territory ${territoryId} for team ${teamId}:`, error);
      return false;
    }
  }

  // ===== LEADERBOARD SYSTEM =====

  async updateLeaderboards(): Promise<void> {
    console.log('Updating all leaderboards');
    
    try {
      // Update different leaderboard types
      await Promise.all([
        this.updateIndividualLeaderboards(),
        this.updateTeamLeaderboards(),
        this.updateTerritoryLeaderboards(),
      ]);
      
      console.log('All leaderboards updated successfully');
    } catch (error) {
      console.error('Failed to update leaderboards:', error);
    }
  }

  private async updateIndividualLeaderboards(): Promise<void> {
    const timeframes = ['daily', 'weekly', 'monthly', 'all_time'];
    const categories = ['overall', 'fitness', 'nutrition', 'sleep', 'mindfulness', 'consistency'];
    
    for (const timeframe of timeframes) {
      for (const category of categories) {
        await this.calculateIndividualLeaderboard(timeframe, category);
      }
    }
  }

  private async calculateIndividualLeaderboard(
    timeframe: string,
    category: string
  ): Promise<void> {
    // Get users and their scores for this timeframe/category
    const users = await this.getUsersWithScores(timeframe, category);
    
    // Sort by score
    users.sort((a, b) => b.score - a.score);
    
    // Create leaderboard entries
    const entries = users.map((user, index) => ({
      rank: index + 1,
      user_id: user.userId,
      display_name: user.displayName,
      score: user.score,
      additional_stats: user.stats,
      streak: user.streak,
    }));
    
    // Save leaderboard
    const leaderboard: Leaderboard = {
      id: `individual_${category}_${timeframe}`,
      type: 'individual',
      category: category as any,
      timeframe: timeframe as any,
      entries,
      total_participants: entries.length,
      last_updated: new Date(),
      rank_rewards: this.getDefaultRankRewards(),
    };
    
    await this.saveLeaderboard(leaderboard);
  }

  // ===== HELPER METHODS =====

  private async initializeCharacterStats(userId: string): Promise<CharacterStats> {
    const stats: CharacterStats = {
      userId,
      strength: { current: 10, max: 100, experience: 0, level: 1, bonuses: [] },
      intelligence: { current: 10, max: 100, experience: 0, level: 1, bonuses: [] },
      wisdom: { current: 10, max: 100, experience: 0, level: 1, bonuses: [] },
      vitality: { current: 10, max: 100, experience: 0, level: 1, bonuses: [] },
      charisma: { current: 10, max: 100, experience: 0, level: 1, bonuses: [] },
      overall_level: 1,
      total_experience: 0,
      avatar_customization: {
        skin_tone: 'medium',
        hair_style: 'short',
        hair_color: 'brown',
        clothing_style: 'casual',
        accessories: [],
        background_theme: 'nature',
      },
      daily_gains: {},
      weekly_gains: {},
      last_updated: new Date(),
      created_at: new Date(),
    };
    
    await this.saveCharacterStats(userId, stats);
    return stats;
  }

  private async triggerLevelUpCelebration(userId: string, stat: string, newLevel: number): Promise<void> {
    // Trigger level up notification/animation
    console.log(`User ${userId} leveled up ${stat} to level ${newLevel}!`);
  }

  private async triggerAchievementCelebration(userId: string, achievement: Achievement): Promise<void> {
    // Trigger achievement unlock notification/animation
    console.log(`User ${userId} unlocked achievement: ${achievement.name}`);
  }

  // Database operations
  private async getCharacterStats(userId: string): Promise<CharacterStats | null> {
    const doc = await db.collection('character_stats').doc(userId).get();
    return doc.exists ? doc.data() as CharacterStats : null;
  }

  private async saveCharacterStats(userId: string, stats: CharacterStats): Promise<void> {
    await db.collection('character_stats').doc(userId).set(stats);
  }

  private async getSkillTree(userId: string): Promise<SkillTree | null> {
    const doc = await db.collection('skill_trees').doc(userId).get();
    return doc.exists ? doc.data() as SkillTree : null;
  }

  private async saveSkillTree(userId: string, skillTree: SkillTree): Promise<void> {
    await db.collection('skill_trees').doc(userId).set(skillTree);
  }

  private async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const snapshot = await db.collection('user_achievements')
      .where('userId', '==', userId)
      .get();
    
    return queryToArray<UserAchievement>(snapshot);
  }

  private async initializeUserAchievement(userId: string, achievementId: string): Promise<UserAchievement> {
    const userAchievement: UserAchievement = {
      userId,
      achievementId,
      current_progress: {},
      is_completed: false,
      has_been_celebrated: false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    
    return userAchievement;
  }

  private async saveUserAchievement(userAchievement: UserAchievement): Promise<void> {
    const id = `${userAchievement.userId}_${userAchievement.achievementId}`;
    await db.collection('user_achievements').doc(id).set(userAchievement);
  }

  private async checkSkillUnlocks(userId: string, skillTree: SkillTree): Promise<void> {
    // Implementation for checking and unlocking skills
  }

  private async updateUserUnlockables(userId: string, unlockables: any): Promise<void> {
    // Implementation for updating user's unlocked items
  }

  private async getTerritory(territoryId: string): Promise<Territory | null> {
    const doc = await db.collection('territories').doc(territoryId).get();
    return doc.exists ? doc.data() as Territory : null;
  }

  private async saveTerritory(territory: Territory): Promise<void> {
    await db.collection('territories').doc(territory.id).set(territory);
  }

  private async getTeam(teamId: string): Promise<Team | null> {
    const doc = await db.collection('teams').doc(teamId).get();
    return doc.exists ? doc.data() as Team : null;
  }

  private async saveTeam(team: Team): Promise<void> {
    await db.collection('teams').doc(team.id).set(team);
  }

  private async notifyTerritoryCapture(teamId: string, territoryId: string, userIds: string[]): Promise<void> {
    // Implementation for notifying users of territory capture
  }

  private async updateTeamLeaderboards(): Promise<void> {
    // Implementation for team leaderboards
  }

  private async updateTerritoryLeaderboards(): Promise<void> {
    // Implementation for territory leaderboards
  }

  private async getUsersWithScores(timeframe: string, category: string): Promise<any[]> {
    // Implementation for getting users with scores
    return [];
  }

  private getDefaultRankRewards(): Record<number, any> {
    return {
      1: { experience_points: { overall: 1000 }, titles: ['Champion'], badges: ['Gold Crown'] },
      2: { experience_points: { overall: 500 }, titles: ['Runner-up'], badges: ['Silver Crown'] },
      3: { experience_points: { overall: 250 }, titles: ['Third Place'], badges: ['Bronze Crown'] },
    };
  }

  private async saveLeaderboard(leaderboard: Leaderboard): Promise<void> {
    await db.collection('leaderboards').doc(leaderboard.id).set(leaderboard);
  }

  // ===== PUBLIC API METHODS =====

  async getAchievementLibrary(): Promise<Record<string, Achievement>> {
    return this.ACHIEVEMENT_LIBRARY;
  }

  async getUserGameProfile(userId: string): Promise<{
    characterStats: CharacterStats | null;
    skillTree: SkillTree | null;
    achievements: UserAchievement[];
    leaderboardRankings: any[];
  }> {
    const [characterStats, skillTree, achievements] = await Promise.all([
      this.getCharacterStats(userId),
      this.getSkillTree(userId),
      this.getUserAchievements(userId),
    ]);
    
    return {
      characterStats,
      skillTree,
      achievements,
      leaderboardRankings: [], // Would implement leaderboard ranking lookup
    };
  }
}

// Export singleton instance
export const gamificationEngine = GamificationEngine.getInstance();
