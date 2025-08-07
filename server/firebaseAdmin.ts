import dotenv from 'dotenv';
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Load environment variables
dotenv.config();

/**
 * Validates and initializes Firebase Admin SDK with comprehensive error handling
 */
function initializeFirebase(): { app: App; db: Firestore } {
  // Validate Firebase service account key
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const error = new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required but not set.\n" +
      "Please ensure you have:\n" +
      "1. Created a Firebase project\n" +
      "2. Generated a service account key from Firebase Console\n" +
      "3. Set the FIREBASE_SERVICE_ACCOUNT_KEY in your .env file as a JSON string\n\n" +
      "Contact support if this issue persists."
    );
    error.name = 'FirebaseConfigurationError';
    throw error;
  }

  // Parse and validate service account key
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    
    // Validate required fields
    const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id', 'auth_uri', 'token_uri'];
    for (const field of requiredFields) {
      if (!serviceAccount[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  } catch (parseError) {
    const error = new Error(
      `Invalid FIREBASE_SERVICE_ACCOUNT_KEY format: ${parseError instanceof Error ? parseError.message : 'Unknown format error'}\n` +
      "Expected format: Valid JSON service account key from Firebase Console\n" +
      "Please check your Firebase configuration."
    );
    error.name = 'FirebaseKeyFormatError';
    throw error;
  }

  // Initialize Firebase Admin if not already initialized
  let app: App;
  if (getApps().length === 0) {
    try {
      app = initializeApp({
        credential: cert(serviceAccount),
        // Add any additional config here if needed
      });
      console.log('Firebase Admin SDK initialized successfully');
    } catch (initError) {
      const error = new Error(
        `Firebase initialization failed: ${initError instanceof Error ? initError.message : 'Unknown error'}\n` +
        "Please check your service account key and Firebase project configuration."
      );
      error.name = 'FirebaseInitializationError';
      throw error;
    }
  } else {
    app = getApps()[0];
    console.log('Using existing Firebase Admin SDK instance');
  }

  // Initialize Firestore
  const db = getFirestore(app);
  
  // Test Firestore connection
  testFirestoreConnection(db);

  return { app, db };
}

/**
 * Tests Firestore connection with graceful error handling
 */
async function testFirestoreConnection(db: Firestore): Promise<void> {
  try {
    // Simple test to verify connection
    const testRef = db.collection('_test').doc('connection');
    await testRef.set({ timestamp: new Date(), test: true });
    await testRef.delete();
    console.log('Firestore connection test successful');
  } catch (error) {
    console.error('Firestore connection test failed:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    
    // In development, we might want to continue despite connection issues
    // In production, this should probably terminate the application
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Firestore connection failed. Application cannot start without database access. ' +
        'Please check your Firebase configuration and network connectivity.'
      );
    } else {
      console.warn('Warning: Firestore connection failed in development mode. Some features may not work.');
    }
  }
}

/**
 * Retry Firestore operations with exponential backoff
 */
export async function retryFirestoreOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on certain errors
      const isRetryableError = 
        lastError.message.includes('UNAVAILABLE') ||
        lastError.message.includes('DEADLINE_EXCEEDED') ||
        lastError.message.includes('timeout') ||
        lastError.message.includes('network');

      if (!isRetryableError || attempt === maxRetries) {
        throw lastError;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Firestore operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, {
        message: lastError.message,
        timestamp: new Date().toISOString(),
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Initialize Firebase connection
const { app, db } = initializeFirebase();

export { app, db };

