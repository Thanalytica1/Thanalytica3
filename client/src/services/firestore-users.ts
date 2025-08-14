import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, InsertUser } from '@shared/schema';

const COLLECTIONS = {
  USERS: 'users'
} as const;

export class FirestoreUsersService {
  static async getUser(firebaseUid: string): Promise<User> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, firebaseUid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      return {
        id: userDoc.id,
        ...userData,
        createdAt: userData.createdAt?.toDate?.() || userData.createdAt,
        updatedAt: userData.updatedAt?.toDate?.() || userData.updatedAt
      } as User;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error('Failed to fetch user');
    }
  }

  static async createUser(userData: InsertUser): Promise<User> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userData.firebaseUid);
      
      const userDataWithTimestamps = {
        ...userData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      await setDoc(userRef, userDataWithTimestamps);
      
      return {
        id: userData.firebaseUid,
        ...userDataWithTimestamps,
        createdAt: userDataWithTimestamps.createdAt.toDate(),
        updatedAt: userDataWithTimestamps.updatedAt.toDate()
      } as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  static async updateUser(
    firebaseUid: string, 
    updates: Partial<User>
  ): Promise<User> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, firebaseUid);
      
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      };
      
      await updateDoc(userRef, updateData);
      
      // Fetch and return the updated user
      return await this.getUser(firebaseUid);
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  static async getUserProfile(firebaseUid: string): Promise<any> {
    try {
      const user = await this.getUser(firebaseUid);
      
      // Return user profile with additional computed fields
      return {
        ...user,
        isComplete: !!(user.email && user.displayName),
        hasCompletedOnboarding: !!(user as any).onboardingCompleted,
        memberSince: user.createdAt
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  static async updateUserPreferences(
    firebaseUid: string, 
    preferences: Record<string, any>
  ): Promise<User> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, firebaseUid);
      
      const updateData = {
        preferences,
        updatedAt: Timestamp.now()
      };
      
      await updateDoc(userRef, updateData);
      
      return await this.getUser(firebaseUid);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new Error('Failed to update user preferences');
    }
  }

  static async getUserSettings(firebaseUid: string): Promise<any> {
    try {
      const user = await this.getUser(firebaseUid);
      
      // Return user settings with defaults
      return {
        notifications: {
          email: true,
          push: true,
          healthReminders: true,
          weeklyReports: true,
          goalMilestones: true,
          ...(user as any).preferences?.notifications
        },
        privacy: {
          dataSharing: false,
          anonymousAnalytics: true,
          researchParticipation: false,
          ...(user as any).privacy
        },
        units: (user as any).preferences?.units || 'metric',
        timeZone: (user as any).timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
      };
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw new Error('Failed to fetch user settings');
    }
  }

  static async updateUserSettings(
    firebaseUid: string, 
    settings: Record<string, any>
  ): Promise<any> {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, firebaseUid);
      
      const updateData: any = {
        updatedAt: Timestamp.now()
      };
      
      // Map settings to user document structure
      if (settings.notifications) {
        updateData['preferences.notifications'] = settings.notifications;
      }
      if (settings.privacy) {
        updateData.privacy = settings.privacy;
      }
      if (settings.units) {
        updateData['preferences.units'] = settings.units;
      }
      if (settings.timeZone) {
        updateData.timeZone = settings.timeZone;
      }
      
      await updateDoc(userRef, updateData);
      
      return await this.getUserSettings(firebaseUid);
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw new Error('Failed to update user settings');
    }
  }
}