// Test data creation utilities for Firestore
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function createTestUserData(userId: string) {
  // Create test user
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    email: 'test@example.com',
    displayName: 'Test User',
    firebaseUid: userId,
    preferences: {
      units: 'metric',
      notifications: {
        email: true,
        push: true,
        healthReminders: true,
        weeklyReports: true,
        goalMilestones: true
      },
      goals: ['longevity', 'fitness'],
      primaryFocus: 'longevity'
    },
    privacy: {
      dataSharing: false,
      anonymousAnalytics: true,
      researchParticipation: false
    },
    timeZone: 'UTC',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });

  // Create test health assessment
  const assessmentsRef = collection(db, `users/${userId}/healthAssessments`);
  await addDoc(assessmentsRef, {
    userId,
    status: 'completed',
    type: 'comprehensive',
    results: {
      overallScore: 75,
      biologicalAge: 32,
      recommendations: [
        'Increase sleep duration to 7-8 hours',
        'Add more cardio exercises',
        'Reduce stress levels'
      ],
      keyFindings: [
        'Good cardiovascular health',
        'Needs improvement in sleep quality',
        'Excellent nutrition habits'
      ]
    },
    responses: {
      age: 35,
      gender: 'male',
      sleepDuration: '6-7 hours',
      exerciseFrequency: '3-4 times per week',
      dietPattern: 'Mediterranean'
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });

  // Create test health metrics
  const metricsRef = collection(db, `users/${userId}/healthMetrics`);
  
  // Weight metrics
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    await addDoc(metricsRef, {
      userId,
      type: 'weight',
      value: 75 + Math.random() * 2 - 1, // Random weight around 75kg
      unit: 'kg',
      timestamp: Timestamp.fromDate(date),
      source: 'manual',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  }

  // Heart rate metrics
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    await addDoc(metricsRef, {
      userId,
      type: 'heart_rate',
      value: 70 + Math.random() * 10 - 5, // Random HR around 70 bpm
      unit: 'bpm',
      timestamp: Timestamp.fromDate(date),
      source: 'wearable',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  }

  // Sleep metrics
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    await addDoc(metricsRef, {
      userId,
      type: 'sleep_duration',
      value: 7 + Math.random() * 2 - 1, // Random sleep around 7 hours
      unit: 'hours',
      timestamp: Timestamp.fromDate(date),
      source: 'wearable',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  }

  console.log('Test data created successfully for user:', userId);
}

export async function clearTestData(userId: string) {
  // This would require more complex batch operations to clear all subcollections
  console.log('Clear test data for user:', userId);
}