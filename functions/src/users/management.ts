// User Management Cloud Functions
import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import express from "express";
import cors from "cors";
import { UserProfile, userProfileSchema } from "../../../shared/health-schema";

const db = getFirestore();
const auth = getAuth();
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Create or update user profile
app.post("/users", async (req, res) => {
  try {
    const validatedData = userProfileSchema.parse(req.body);
    
    const userData: Partial<UserProfile> = {
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Check if user already exists
    const userRef = db.doc(`users/${validatedData.firebaseUid}`);
    const existingUser = await userRef.get();
    
    if (existingUser.exists) {
      // Update existing user
      await userRef.update({
        ...userData,
        createdAt: existingUser.data()?.createdAt, // Preserve original creation date
        updatedAt: new Date().toISOString()
      });
      
      const updatedUser = await userRef.get();
      res.json({
        id: updatedUser.id,
        ...updatedUser.data()
      });
    } else {
      // Create new user
      await userRef.set(userData);
      
      // Initialize user's health data structure
      await initializeUserHealthData(validatedData.firebaseUid);
      
      res.status(201).json({
        id: userRef.id,
        ...userData
      });
    }
  } catch (error) {
    console.error("Error managing user:", error);
    res.status(400).json({ error: "Invalid user data" });
  }
});

// Get user profile
app.get("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userDoc = await db.doc(`users/${userId}`).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({
      id: userDoc.id,
      ...userDoc.data()
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Update user profile
app.put("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const updateData = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    await db.doc(`users/${userId}`).update(updateData);
    
    const updatedUser = await db.doc(`users/${userId}`).get();
    
    res.json({
      id: updatedUser.id,
      ...updatedUser.data()
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Delete user and all associated data
app.delete("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Delete user from Firebase Auth
    try {
      await auth.deleteUser(userId);
    } catch (authError) {
      console.warn("User not found in Firebase Auth:", authError);
    }
    
    // Delete all user data from Firestore
    await deleteUserData(userId);
    
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Get user's data summary
app.get("/users/:userId/summary", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get counts for different data types
    const [
      assessmentsCount,
      metricsCount,
      goalsCount,
      activitiesCount,
      reportsCount
    ] = await Promise.all([
      getCollectionCount(`users/${userId}/assessments`),
      getCollectionCount(`users/${userId}/healthMetrics`),
      getCollectionCount(`users/${userId}/goals`),
      getCollectionCount(`users/${userId}/activities`),
      getCollectionCount(`users/${userId}/reports`)
    ]);
    
    // Get latest assessment
    const latestAssessment = await getLatestDocument(`users/${userId}/assessments`);
    
    // Get latest metrics
    const latestMetrics = await getLatestDocument(`users/${userId}/healthMetrics`);
    
    const summary = {
      dataCounts: {
        assessments: assessmentsCount,
        metrics: metricsCount,
        goals: goalsCount,
        activities: activitiesCount,
        reports: reportsCount
      },
      latestAssessment: latestAssessment ? {
        id: latestAssessment.id,
        ...latestAssessment.data()
      } : null,
      latestMetrics: latestMetrics ? {
        id: latestMetrics.id,
        ...latestMetrics.data()
      } : null,
      accountAge: await calculateAccountAge(userId)
    };
    
    res.json(summary);
  } catch (error) {
    console.error("Error fetching user summary:", error);
    res.status(500).json({ error: "Failed to fetch user summary" });
  }
});

// Helper function to initialize user's health data structure
async function initializeUserHealthData(userId: string) {
  const batch = db.batch();
  
  // Create initial collections with placeholder documents
  const collections = [
    'healthMetrics',
    'assessments', 
    'goals',
    'activities',
    'reports',
    'wearables',
    'notifications'
  ];
  
  for (const collection of collections) {
    const docRef = db.doc(`users/${userId}/${collection}/_init`);
    batch.set(docRef, {
      _placeholder: true,
      createdAt: new Date().toISOString()
    });
  }
  
  await batch.commit();
  
  // Clean up placeholder documents
  setTimeout(async () => {
    for (const collection of collections) {
      try {
        await db.doc(`users/${userId}/${collection}/_init`).delete();
      } catch (error) {
        // Ignore errors - placeholder might already be deleted
      }
    }
  }, 1000);
}

// Helper function to delete all user data
async function deleteUserData(userId: string) {
  const collections = [
    'healthMetrics',
    'assessments',
    'goals', 
    'activities',
    'reports',
    'wearables',
    'notifications',
    'sessions'
  ];
  
  for (const collection of collections) {
    await deleteCollection(`users/${userId}/${collection}`);
  }
  
  // Delete the user document itself
  await db.doc(`users/${userId}`).delete();
}

// Helper function to delete a collection
async function deleteCollection(collectionPath: string) {
  const batchSize = 100;
  let query = db.collection(collectionPath).limit(batchSize);
  
  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve, reject);
  });
  
  function deleteQueryBatch(query: any, resolve: any, reject: any) {
    query.get()
      .then((snapshot: any) => {
        if (snapshot.size === 0) {
          return 0;
        }
        
        const batch = db.batch();
        snapshot.docs.forEach((doc: any) => {
          batch.delete(doc.ref);
        });
        
        return batch.commit().then(() => {
          return snapshot.size;
        });
      })
      .then((numDeleted: number) => {
        if (numDeleted === 0) {
          resolve(true);
          return;
        }
        
        process.nextTick(() => {
          deleteQueryBatch(query, resolve, reject);
        });
      })
      .catch(reject);
  }
}

// Helper function to get collection count
async function getCollectionCount(collectionPath: string): Promise<number> {
  try {
    const snapshot = await db.collection(collectionPath).count().get();
    return snapshot.data().count;
  } catch (error) {
    return 0;
  }
}

// Helper function to get latest document from collection
async function getLatestDocument(collectionPath: string) {
  try {
    const snapshot = await db.collection(collectionPath)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    return snapshot.empty ? null : snapshot.docs[0];
  } catch (error) {
    return null;
  }
}

// Helper function to calculate account age
async function calculateAccountAge(userId: string): Promise<string> {
  try {
    const userDoc = await db.doc(`users/${userId}`).get();
    const userData = userDoc.data();
    
    if (!userData?.createdAt) {
      return 'Unknown';
    }
    
    const createdDate = new Date(userData.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      return 'Today';
    } else if (diffDays === 1) {
      return '1 day';
    } else if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return months === 1 ? '1 month' : `${months} months`;
    } else {
      const years = Math.floor(diffDays / 365);
      return years === 1 ? '1 year' : `${years} years`;
    }
  } catch (error) {
    return 'Unknown';
  }
}

export const userManagement = onRequest({ region: "us-central1" }, app);