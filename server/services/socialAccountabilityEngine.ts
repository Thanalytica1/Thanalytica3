/**
 * PHASE 3.5: Social and Accountability Features
 * Community layer connecting users with similar goals and enabling accountability partnerships
 * Users with accountability partners have 3x higher success rates
 */

import { db, COLLECTIONS, queryToArray, generateId } from '../db';
import { cacheService } from './cacheService';
import crypto from 'crypto';

// User profile for matching
interface UserMatchingProfile {
  userId: string;
  goals: string[];
  challenges: string[];
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  time_zone: string;
  preferred_communication: Array<'daily' | 'weekly' | 'bi_weekly'>;
  schedule_flexibility: 'very_flexible' | 'somewhat_flexible' | 'not_flexible';
  communication_style: 'supportive' | 'direct' | 'motivational' | 'analytical';
  privacy_level: 'open' | 'selective' | 'private';
  
  // Sharing preferences
  willing_to_share: {
    progress_updates: boolean;
    setbacks: boolean;
    personal_insights: boolean;
    health_metrics: boolean;
    goal_adjustments: boolean;
  };
  
  // Strengths and areas for improvement
  strengths: string[];
  improvement_areas: string[];
  
  // Activity patterns
  most_active_times: string[];
  preferred_check_in_days: string[];
  
  created_at: Date;
  updated_at: Date;
}

// Compatibility analysis
interface CompatibilityScore {
  userId1: string;
  userId2: string;
  overall_score: number; // 0-100
  
  compatibility_factors: {
    goal_alignment: number;
    complementary_strengths: number;
    communication_style_fit: number;
    schedule_compatibility: number;
    experience_balance: number;
    timezone_overlap: number;
  };
  
  potential_synergies: string[];
  potential_challenges: string[];
  recommendation_strength: 'low' | 'medium' | 'high' | 'perfect_match';
  
  calculated_at: Date;
}

// Accountability partnership
interface AccountabilityPartnership {
  id: string;
  partner1_id: string;
  partner2_id: string;
  
  // Partnership setup
  established_at: Date;
  status: 'pending' | 'active' | 'paused' | 'ended';
  partnership_type: 'buddy' | 'mentor_mentee' | 'peer_group' | 'challenge_team';
  
  // Shared commitments
  shared_goals: Array<{
    goal: string;
    target_date: Date;
    success_criteria: string;
    partner1_commitment: string;
    partner2_commitment: string;
  }>;
  
  // Communication agreement
  check_in_frequency: 'daily' | 'every_2_days' | 'weekly' | 'bi_weekly';
  check_in_format: 'text' | 'audio' | 'video' | 'app_only';
  check_in_time: string; // HH:MM format
  communication_rules: string[];
  
  // Accountability mechanisms
  accountability_methods: Array<{
    method: 'progress_sharing' | 'mutual_check_ins' | 'consequence_system' | 'reward_system';
    description: string;
    active: boolean;
  }>;
  
  // Progress tracking
  partnership_metrics: {
    total_check_ins: number;
    missed_check_ins: number;
    goals_achieved_together: number;
    average_satisfaction: number; // 1-10 scale
    mutual_support_score: number; // 1-10 scale
  };
  
  // Interaction history
  interactions: Array<{
    id: string;
    type: 'check_in' | 'encouragement' | 'challenge' | 'celebration' | 'support';
    initiator_id: string;
    message?: string;
    shared_data?: any;
    timestamp: Date;
    satisfaction_rating?: number;
  }>;
  
  // Partnership health
  health_score: number; // 0-100
  last_interaction: Date;
  next_scheduled_checkin: Date;
  
  updated_at: Date;
}

// Community groups and challenges
interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  category: 'longevity' | 'fitness' | 'nutrition' | 'sleep' | 'stress' | 'productivity' | 'general';
  
  // Group characteristics
  group_type: 'support_group' | 'challenge_group' | 'learning_group' | 'accountability_circle';
  privacy_level: 'public' | 'invite_only' | 'private';
  size_limit: number;
  current_size: number;
  
  // Leadership
  creator_id: string;
  moderators: string[];
  
  // Group goals and activities
  group_goals: string[];
  current_challenges: Array<{
    id: string;
    name: string;
    description: string;
    start_date: Date;
    end_date: Date;
    participants: string[];
    leaderboard: Array<{ userId: string; score: number; rank: number }>;
  }>;
  
  // Engagement
  activity_level: 'low' | 'medium' | 'high';
  last_activity: Date;
  member_satisfaction: number; // Average rating
  
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

// Transformation stories
interface TransformationStory {
  id: string;
  author_id: string;
  
  // Story metadata
  title: string;
  category: 'longevity' | 'weight_loss' | 'fitness' | 'mental_health' | 'productivity' | 'habits';
  transformation_type: 'ongoing' | 'completed' | 'milestone';
  
  // Timeline
  start_date: Date;
  current_date: Date;
  target_date?: Date;
  duration_months: number;
  
  // Before/after data
  before_metrics: Record<string, any>;
  current_metrics: Record<string, any>;
  target_metrics?: Record<string, any>;
  
  // Story content
  story_chapters: Array<{
    chapter_number: number;
    title: string;
    content: string;
    date: Date;
    key_learnings: string[];
    challenges_overcome: string[];
    metrics_at_time: Record<string, any>;
    images?: string[]; // Image URLs
  }>;
  
  // Insights and lessons
  key_strategies: string[];
  biggest_challenges: string[];
  unexpected_benefits: string[];
  advice_for_others: string[];
  
  // Engagement
  views: number;
  likes: number;
  comments: Array<{
    id: string;
    commenter_id: string;
    content: string;
    timestamp: Date;
  }>;
  
  // Privacy and sharing
  privacy_level: 'public' | 'community_only' | 'partners_only';
  allow_comments: boolean;
  allow_messaging: boolean;
  
  created_at: Date;
  updated_at: Date;
  is_published: boolean;
}

// Motivation and support system
interface MotivationEngine {
  userId: string;
  
  // Support network
  accountability_partners: string[];
  support_groups: string[];
  mentors: string[];
  mentees: string[];
  
  // Motivation preferences
  motivation_triggers: Array<{
    trigger: 'progress_milestone' | 'streak_achievement' | 'partner_success' | 'community_recognition' | 'personal_challenge';
    effectiveness: number; // 1-10 how effective this is for the user
    frequency_preference: 'immediate' | 'daily' | 'weekly' | 'milestone_based';
  }>;
  
  // Support giving and receiving
  support_style: {
    giving: 'encourager' | 'challenger' | 'advisor' | 'cheerleader' | 'problem_solver';
    receiving: 'needs_encouragement' | 'needs_challenges' | 'needs_advice' | 'needs_accountability' | 'needs_celebration';
  };
  
  // Engagement patterns
  interaction_patterns: {
    most_active_hours: number[];
    response_time_preference: 'immediate' | 'within_hour' | 'within_day' | 'flexible';
    communication_energy_level: 'high' | 'medium' | 'low';
  };
  
  updated_at: Date;
}

export class SocialAccountabilityEngine {
  private static instance: SocialAccountabilityEngine;
  
  public static getInstance(): SocialAccountabilityEngine {
    if (!SocialAccountabilityEngine.instance) {
      SocialAccountabilityEngine.instance = new SocialAccountabilityEngine();
    }
    return SocialAccountabilityEngine.instance;
  }

  // ===== USER MATCHING ALGORITHM =====

  /**
   * Find compatible users for accountability partnerships
   */
  async findCompatiblePartners(
    userId: string,
    preferences: {
      partnership_type: 'buddy' | 'mentor' | 'mentee';
      max_results: number;
      min_compatibility_score: number;
    }
  ): Promise<Array<{ userId: string; compatibilityScore: CompatibilityScore }>> {
    console.log(`Finding compatible partners for user ${userId}`);
    
    try {
      // 1. Get user's matching profile
      const userProfile = await this.getUserMatchingProfile(userId);
      if (!userProfile) {
        throw new Error('User matching profile not found');
      }

      // 2. Get potential partners (users seeking partnerships)
      const potentialPartners = await this.getPotentialPartners(userId, preferences.partnership_type);
      
      // 3. Calculate compatibility scores
      const compatibilityScores = await Promise.all(
        potentialPartners.map(async (partner) => {
          const score = await this.calculateCompatibilityScore(userProfile, partner);
          return { userId: partner.userId, compatibilityScore: score };
        })
      );
      
      // 4. Filter and sort by compatibility
      const filteredResults = compatibilityScores
        .filter(result => result.compatibilityScore.overall_score >= preferences.min_compatibility_score)
        .sort((a, b) => b.compatibilityScore.overall_score - a.compatibilityScore.overall_score)
        .slice(0, preferences.max_results);
      
      console.log(`Found ${filteredResults.length} compatible partners for user ${userId}`);
      return filteredResults;

    } catch (error) {
      console.error(`Partner matching failed for user ${userId}:`, error);
      return [];
    }
  }

  private async calculateCompatibilityScore(
    user1: UserMatchingProfile,
    user2: UserMatchingProfile
  ): Promise<CompatibilityScore> {
    // Calculate individual compatibility factors
    const goalAlignment = this.calculateGoalAlignment(user1.goals, user2.goals);
    const complementaryStrengths = this.calculateComplementaryStrengths(
      user1.strengths, user1.improvement_areas,
      user2.strengths, user2.improvement_areas
    );
    const communicationStyleFit = this.calculateCommunicationCompatibility(
      user1.communication_style, user2.communication_style
    );
    const scheduleCompatibility = this.calculateScheduleCompatibility(
      user1.most_active_times, user1.preferred_check_in_days,
      user2.most_active_times, user2.preferred_check_in_days
    );
    const experienceBalance = this.calculateExperienceBalance(
      user1.experience_level, user2.experience_level
    );
    const timezoneOverlap = this.calculateTimezoneOverlap(user1.time_zone, user2.time_zone);

    // Weighted overall score
    const overall_score = Math.round(
      goalAlignment * 0.25 +
      complementaryStrengths * 0.20 +
      communicationStyleFit * 0.15 +
      scheduleCompatibility * 0.15 +
      experienceBalance * 0.15 +
      timezoneOverlap * 0.10
    );

    // Generate insights
    const potentialSynergies = this.identifyPotentialSynergies(user1, user2, {
      goalAlignment,
      complementaryStrengths,
      communicationStyleFit,
    });
    
    const potentialChallenges = this.identifyPotentialChallenges(user1, user2, {
      scheduleCompatibility,
      communicationStyleFit,
      timezoneOverlap,
    });

    return {
      userId1: user1.userId,
      userId2: user2.userId,
      overall_score,
      compatibility_factors: {
        goal_alignment: goalAlignment,
        complementary_strengths: complementaryStrengths,
        communication_style_fit: communicationStyleFit,
        schedule_compatibility: scheduleCompatibility,
        experience_balance: experienceBalance,
        timezone_overlap: timezoneOverlap,
      },
      potential_synergies: potentialSynergies,
      potential_challenges: potentialChallenges,
      recommendation_strength: this.categorizeRecommendationStrength(overall_score),
      calculated_at: new Date(),
    };
  }

  private calculateGoalAlignment(goals1: string[], goals2: string[]): number {
    const commonGoals = goals1.filter(goal => goals2.includes(goal));
    const totalUniqueGoals = new Set([...goals1, ...goals2]).size;
    
    if (totalUniqueGoals === 0) return 50; // Neutral if no goals
    
    return Math.round((commonGoals.length / totalUniqueGoals) * 100);
  }

  private calculateComplementaryStrengths(
    strengths1: string[], areas1: string[],
    strengths2: string[], areas2: string[]
  ): number {
    // Check if one person's strengths complement the other's improvement areas
    const complementScore1 = strengths1.filter(strength => areas2.includes(strength)).length;
    const complementScore2 = strengths2.filter(strength => areas1.includes(strength)).length;
    
    const maxPossibleComplements = Math.max(areas1.length, areas2.length);
    if (maxPossibleComplements === 0) return 50;
    
    return Math.round(((complementScore1 + complementScore2) / maxPossibleComplements) * 50);
  }

  private calculateCommunicationCompatibility(style1: string, style2: string): number {
    // Define compatibility matrix for communication styles
    const compatibilityMatrix: Record<string, Record<string, number>> = {
      supportive: { supportive: 90, motivational: 85, analytical: 70, direct: 60 },
      motivational: { supportive: 85, motivational: 95, analytical: 75, direct: 90 },
      analytical: { supportive: 70, motivational: 75, analytical: 90, direct: 80 },
      direct: { supportive: 60, motivational: 90, analytical: 80, direct: 85 },
    };
    
    return compatibilityMatrix[style1]?.[style2] || 50;
  }

  private calculateScheduleCompatibility(
    times1: string[], days1: string[],
    times2: string[], days2: string[]
  ): number {
    const timeOverlap = times1.filter(time => times2.includes(time)).length;
    const dayOverlap = days1.filter(day => days2.includes(day)).length;
    
    const maxTimeOverlap = Math.min(times1.length, times2.length);
    const maxDayOverlap = Math.min(days1.length, days2.length);
    
    if (maxTimeOverlap === 0 && maxDayOverlap === 0) return 50;
    
    const timeScore = maxTimeOverlap > 0 ? (timeOverlap / maxTimeOverlap) * 50 : 25;
    const dayScore = maxDayOverlap > 0 ? (dayOverlap / maxDayOverlap) * 50 : 25;
    
    return Math.round(timeScore + dayScore);
  }

  private calculateExperienceBalance(level1: string, level2: string): number {
    const levels = { beginner: 1, intermediate: 2, advanced: 3 };
    const diff = Math.abs(levels[level1 as keyof typeof levels] - levels[level2 as keyof typeof levels]);
    
    // Perfect balance: beginner-advanced (2 diff), good: beginner-intermediate or intermediate-advanced (1 diff)
    if (diff === 0) return 75; // Same level is good but not perfect
    if (diff === 1) return 90; // One level difference is ideal
    if (diff === 2) return 95; // Beginner-advanced pairing can be very effective
    
    return 50;
  }

  private calculateTimezoneOverlap(tz1: string, tz2: string): number {
    // Simplified timezone compatibility calculation
    // In production, this would use proper timezone libraries
    if (tz1 === tz2) return 100; // Same timezone
    
    // Calculate approximate hour difference (simplified)
    const tzOffsets: Record<string, number> = {
      'UTC-8': -8, 'UTC-7': -7, 'UTC-6': -6, 'UTC-5': -5, 'UTC-4': -4,
      'UTC': 0, 'UTC+1': 1, 'UTC+2': 2, 'UTC+8': 8, 'UTC+9': 9
    };
    
    const offset1 = tzOffsets[tz1] || 0;
    const offset2 = tzOffsets[tz2] || 0;
    const hourDiff = Math.abs(offset1 - offset2);
    
    if (hourDiff <= 3) return 90; // 3 hour difference or less
    if (hourDiff <= 6) return 70; // 6 hour difference
    if (hourDiff <= 9) return 50; // 9 hour difference
    return 30; // More than 9 hours apart
  }

  private identifyPotentialSynergies(
    user1: UserMatchingProfile,
    user2: UserMatchingProfile,
    scores: any
  ): string[] {
    const synergies = [];
    
    if (scores.goalAlignment > 70) {
      synergies.push('Strong shared goals create natural accountability motivation');
    }
    
    if (scores.complementaryStrengths > 60) {
      synergies.push('Complementary strengths can create mutual learning opportunities');
    }
    
    if (user1.communication_style === 'motivational' && user2.communication_style === 'supportive') {
      synergies.push('Motivational-supportive pairing often creates balanced encouragement');
    }
    
    return synergies;
  }

  private identifyPotentialChallenges(
    user1: UserMatchingProfile,
    user2: UserMatchingProfile,
    scores: any
  ): string[] {
    const challenges = [];
    
    if (scores.scheduleCompatibility < 40) {
      challenges.push('Limited schedule overlap may make regular check-ins difficult');
    }
    
    if (scores.communicationStyleFit < 60) {
      challenges.push('Different communication styles may require explicit discussion of preferences');
    }
    
    if (scores.timezoneOverlap < 50) {
      challenges.push('Significant timezone difference requires careful scheduling of interactions');
    }
    
    return challenges;
  }

  private categorizeRecommendationStrength(score: number): CompatibilityScore['recommendation_strength'] {
    if (score >= 85) return 'perfect_match';
    if (score >= 70) return 'high';
    if (score >= 55) return 'medium';
    return 'low';
  }

  // ===== ACCOUNTABILITY PARTNERSHIP MANAGEMENT =====

  async createAccountabilityPartnership(
    user1Id: string,
    user2Id: string,
    partnershipConfig: {
      shared_goals: Array<{
        goal: string;
        target_date: Date;
        success_criteria: string;
        user1_commitment: string;
        user2_commitment: string;
      }>;
      check_in_frequency: AccountabilityPartnership['check_in_frequency'];
      check_in_format: AccountabilityPartnership['check_in_format'];
      accountability_methods: string[];
    }
  ): Promise<AccountabilityPartnership> {
    const partnershipId = generateId();
    
    const partnership: AccountabilityPartnership = {
      id: partnershipId,
      partner1_id: user1Id,
      partner2_id: user2Id,
      established_at: new Date(),
      status: 'active',
      partnership_type: 'buddy',
      shared_goals: partnershipConfig.shared_goals.map(goal => ({
        goal: goal.goal,
        target_date: goal.target_date,
        success_criteria: goal.success_criteria,
        partner1_commitment: goal.user1_commitment,
        partner2_commitment: goal.user2_commitment,
      })),
      check_in_frequency: partnershipConfig.check_in_frequency,
      check_in_format: partnershipConfig.check_in_format,
      check_in_time: '09:00', // Default, can be customized
      communication_rules: [
        'Be honest about progress and setbacks',
        'Provide constructive and supportive feedback',
        'Respect agreed check-in times',
        'Maintain confidentiality of shared information',
      ],
      accountability_methods: partnershipConfig.accountability_methods.map(method => ({
        method: method as any,
        description: this.getAccountabilityMethodDescription(method),
        active: true,
      })),
      partnership_metrics: {
        total_check_ins: 0,
        missed_check_ins: 0,
        goals_achieved_together: 0,
        average_satisfaction: 0,
        mutual_support_score: 0,
      },
      interactions: [],
      health_score: 100, // Start with perfect health
      last_interaction: new Date(),
      next_scheduled_checkin: this.calculateNextCheckIn(partnershipConfig.check_in_frequency),
      updated_at: new Date(),
    };
    
    // Save to database
    await db.collection('accountability_partnerships').doc(partnershipId).set(partnership);
    
    // Update user motivation engines
    await this.updateUserMotivationEngine(user1Id, { new_partner: user2Id });
    await this.updateUserMotivationEngine(user2Id, { new_partner: user1Id });
    
    console.log(`Created accountability partnership ${partnershipId} between users ${user1Id} and ${user2Id}`);
    return partnership;
  }

  private getAccountabilityMethodDescription(method: string): string {
    const descriptions: Record<string, string> = {
      progress_sharing: 'Share weekly progress updates with specific metrics',
      mutual_check_ins: 'Regular check-in calls or messages to discuss goals',
      consequence_system: 'Agreed-upon consequences for missed commitments',
      reward_system: 'Celebrate achievements with planned rewards',
    };
    
    return descriptions[method] || method;
  }

  private calculateNextCheckIn(frequency: AccountabilityPartnership['check_in_frequency']): Date {
    const now = new Date();
    
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'every_2_days':
        return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'bi_weekly':
        return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }

  // ===== COMMUNITY GROUP MANAGEMENT =====

  async createCommunityGroup(
    creatorId: string,
    groupConfig: {
      name: string;
      description: string;
      category: CommunityGroup['category'];
      group_type: CommunityGroup['group_type'];
      privacy_level: CommunityGroup['privacy_level'];
      size_limit: number;
      group_goals: string[];
    }
  ): Promise<CommunityGroup> {
    const groupId = generateId();
    
    const group: CommunityGroup = {
      id: groupId,
      name: groupConfig.name,
      description: groupConfig.description,
      category: groupConfig.category,
      group_type: groupConfig.group_type,
      privacy_level: groupConfig.privacy_level,
      size_limit: groupConfig.size_limit,
      current_size: 1, // Creator is first member
      creator_id: creatorId,
      moderators: [creatorId],
      group_goals: groupConfig.group_goals,
      current_challenges: [],
      activity_level: 'low', // Starts low
      last_activity: new Date(),
      member_satisfaction: 0,
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true,
    };
    
    await db.collection('community_groups').doc(groupId).set(group);
    
    console.log(`Created community group ${groupId}: ${groupConfig.name}`);
    return group;
  }

  async joinCommunityGroup(userId: string, groupId: string): Promise<boolean> {
    try {
      const groupRef = db.collection('community_groups').doc(groupId);
      const groupDoc = await groupRef.get();
      
      if (!groupDoc.exists) return false;
      
      const group = groupDoc.data() as CommunityGroup;
      
      // Check if group has space
      if (group.current_size >= group.size_limit) return false;
      
      // Add user to group members
      await db.collection('group_memberships').add({
        groupId,
        userId,
        role: 'member',
        joined_at: new Date(),
        is_active: true,
      });
      
      // Update group size
      await groupRef.update({
        current_size: group.current_size + 1,
        last_activity: new Date(),
        updated_at: new Date(),
      });
      
      return true;
    } catch (error) {
      console.error(`Failed to join group ${groupId} for user ${userId}:`, error);
      return false;
    }
  }

  // ===== TRANSFORMATION STORY PLATFORM =====

  async createTransformationStory(
    authorId: string,
    storyConfig: {
      title: string;
      category: TransformationStory['category'];
      transformation_type: TransformationStory['transformation_type'];
      start_date: Date;
      target_date?: Date;
      before_metrics: Record<string, any>;
      initial_chapter: {
        title: string;
        content: string;
        key_learnings: string[];
      };
      privacy_level: TransformationStory['privacy_level'];
    }
  ): Promise<TransformationStory> {
    const storyId = generateId();
    
    const story: TransformationStory = {
      id: storyId,
      author_id: authorId,
      title: storyConfig.title,
      category: storyConfig.category,
      transformation_type: storyConfig.transformation_type,
      start_date: storyConfig.start_date,
      current_date: new Date(),
      target_date: storyConfig.target_date,
      duration_months: storyConfig.target_date ? 
        Math.ceil((storyConfig.target_date.getTime() - storyConfig.start_date.getTime()) / (30 * 24 * 60 * 60 * 1000)) : 0,
      before_metrics: storyConfig.before_metrics,
      current_metrics: { ...storyConfig.before_metrics }, // Start with same as before
      target_metrics: {},
      story_chapters: [{
        chapter_number: 1,
        title: storyConfig.initial_chapter.title,
        content: storyConfig.initial_chapter.content,
        date: new Date(),
        key_learnings: storyConfig.initial_chapter.key_learnings,
        challenges_overcome: [],
        metrics_at_time: { ...storyConfig.before_metrics },
      }],
      key_strategies: [],
      biggest_challenges: [],
      unexpected_benefits: [],
      advice_for_others: [],
      views: 0,
      likes: 0,
      comments: [],
      privacy_level: storyConfig.privacy_level,
      allow_comments: true,
      allow_messaging: true,
      created_at: new Date(),
      updated_at: new Date(),
      is_published: false, // Starts as draft
    };
    
    await db.collection('transformation_stories').doc(storyId).set(story);
    
    console.log(`Created transformation story ${storyId}: ${storyConfig.title}`);
    return story;
  }

  async addStoryChapter(
    storyId: string,
    chapterData: {
      title: string;
      content: string;
      key_learnings: string[];
      challenges_overcome: string[];
      current_metrics: Record<string, any>;
    }
  ): Promise<void> {
    const storyRef = db.collection('transformation_stories').doc(storyId);
    const storyDoc = await storyRef.get();
    
    if (!storyDoc.exists) return;
    
    const story = storyDoc.data() as TransformationStory;
    
    const newChapter = {
      chapter_number: story.story_chapters.length + 1,
      title: chapterData.title,
      content: chapterData.content,
      date: new Date(),
      key_learnings: chapterData.key_learnings,
      challenges_overcome: chapterData.challenges_overcome,
      metrics_at_time: chapterData.current_metrics,
    };
    
    await storyRef.update({
      story_chapters: [...story.story_chapters, newChapter],
      current_metrics: chapterData.current_metrics,
      current_date: new Date(),
      updated_at: new Date(),
    });
  }

  // ===== MOTIVATION ENGINE =====

  async sendMotivationalMessage(
    fromUserId: string,
    toUserId: string,
    messageType: 'encouragement' | 'challenge' | 'celebration' | 'support',
    content: string,
    context?: {
      achievement?: string;
      challenge?: string;
      milestone?: string;
    }
  ): Promise<void> {
    const messageId = generateId();
    
    // Store the motivational message
    await db.collection('motivational_messages').doc(messageId).set({
      id: messageId,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      message_type: messageType,
      content,
      context: context || {},
      timestamp: new Date(),
      read: false,
      responded: false,
    });
    
    // Update partnership interaction if they are partners
    await this.recordPartnershipInteraction(fromUserId, toUserId, messageType, content);
    
    // Trigger notification (would integrate with notification system)
    console.log(`Motivational ${messageType} sent from ${fromUserId} to ${toUserId}`);
  }

  private async recordPartnershipInteraction(
    fromUserId: string,
    toUserId: string,
    type: string,
    message: string
  ): Promise<void> {
    // Find active partnership between users
    const partnershipSnapshot = await db.collection('accountability_partnerships')
      .where('status', '==', 'active')
      .where('partner1_id', 'in', [fromUserId, toUserId])
      .where('partner2_id', 'in', [fromUserId, toUserId])
      .get();
    
    if (partnershipSnapshot.empty) return;
    
    const partnership = partnershipSnapshot.docs[0];
    const partnershipData = partnership.data() as AccountabilityPartnership;
    
    const interaction = {
      id: generateId(),
      type: type as any,
      initiator_id: fromUserId,
      message,
      timestamp: new Date(),
    };
    
    await partnership.ref.update({
      interactions: [...partnershipData.interactions, interaction],
      last_interaction: new Date(),
      'partnership_metrics.total_check_ins': partnershipData.partnership_metrics.total_check_ins + 1,
      updated_at: new Date(),
    });
  }

  // ===== HELPER METHODS =====

  private async getUserMatchingProfile(userId: string): Promise<UserMatchingProfile | null> {
    const doc = await db.collection('user_matching_profiles').doc(userId).get();
    return doc.exists ? doc.data() as UserMatchingProfile : null;
  }

  private async getPotentialPartners(
    userId: string,
    partnershipType: string
  ): Promise<UserMatchingProfile[]> {
    // Get users who are seeking partnerships and not already connected
    const snapshot = await db.collection('user_matching_profiles')
      .where('seeking_partnership', '==', true)
      .limit(50) // Limit for performance
      .get();
    
    const profiles = queryToArray<UserMatchingProfile>(snapshot);
    
    // Filter out current user and existing partners
    return profiles.filter(profile => {
      if (profile.userId === userId) return false;
      // Additional filtering logic for existing partnerships would go here
      return true;
    });
  }

  private async updateUserMotivationEngine(userId: string, updates: any): Promise<void> {
    // Update user's motivation engine with new information
    const motivationRef = db.collection('user_motivation_engines').doc(userId);
    
    await motivationRef.set(updates, { merge: true });
  }

  // ===== PUBLIC API METHODS =====

  async getUserAccountabilityPartners(userId: string): Promise<AccountabilityPartnership[]> {
    const snapshot = await db.collection('accountability_partnerships')
      .where('status', '==', 'active')
      .where('partner1_id', '==', userId)
      .get();
    
    const snapshot2 = await db.collection('accountability_partnerships')
      .where('status', '==', 'active')
      .where('partner2_id', '==', userId)
      .get();
    
    const partnerships1 = queryToArray<AccountabilityPartnership>(snapshot);
    const partnerships2 = queryToArray<AccountabilityPartnership>(snapshot2);
    
    return [...partnerships1, ...partnerships2];
  }

  async getCommunityGroupsForUser(userId: string): Promise<CommunityGroup[]> {
    // Get groups where user is a member
    const membershipSnapshot = await db.collection('group_memberships')
      .where('userId', '==', userId)
      .where('is_active', '==', true)
      .get();
    
    const groupIds = membershipSnapshot.docs.map(doc => doc.data().groupId);
    
    if (groupIds.length === 0) return [];
    
    const groupPromises = groupIds.map(id => 
      db.collection('community_groups').doc(id).get()
    );
    
    const groupDocs = await Promise.all(groupPromises);
    
    return groupDocs
      .filter(doc => doc.exists)
      .map(doc => ({ id: doc.id, ...doc.data() } as CommunityGroup));
  }

  async getPublicTransformationStories(
    category?: TransformationStory['category'],
    limit: number = 20
  ): Promise<TransformationStory[]> {
    let query = db.collection('transformation_stories')
      .where('privacy_level', '==', 'public')
      .where('is_published', '==', true)
      .orderBy('created_at', 'desc');
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    const snapshot = await query.limit(limit).get();
    return queryToArray<TransformationStory>(snapshot);
  }
}

// Export singleton instance
export const socialAccountability = SocialAccountabilityEngine.getInstance();
