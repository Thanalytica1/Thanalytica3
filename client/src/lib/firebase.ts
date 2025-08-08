import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  signInWithRedirect,
  GoogleAuthProvider,
  getRedirectResult,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  connectAuthEmulator
} from "firebase/auth";
import {
  getFirestore,
  Firestore,
  connectFirestoreEmulator
} from "firebase/firestore";
import { AuthError } from "@/utils/errorHandling";

/**
 * Validates Firebase environment variables
 */
function validateFirebaseConfig(): {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  appId: string;
} {
  const requiredVars = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // Check for missing environment variables
  const missing = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => `VITE_${key.toUpperCase()}`);

  if (missing.length > 0) {
    const error = new AuthError(
      `Missing required Firebase environment variables: ${missing.join(', ')}\n\n` +
      "Please ensure you have:\n" +
      "1. Created a Firebase project at https://console.firebase.google.com/\n" +
      "2. Enabled Authentication with Google sign-in\n" +
      "3. Added your app domain to authorized domains\n" +
      "4. Set the following secrets in Replit:\n" +
      `   - ${missing.join('\n   - ')}\n\n` +
      "Contact support if you need help configuring Firebase.",
      { missingVars: missing }
    );
    throw error;
  }

  // Validate API key format (basic validation)
  if (!/^[A-Za-z0-9_-]+$/.test(requiredVars.apiKey)) {
    throw new AuthError(
      "Invalid VITE_FIREBASE_API_KEY format. Please check your Firebase configuration.",
      { apiKeyLength: requiredVars.apiKey.length }
    );
  }

  // Validate project ID format
  if (!/^[a-z0-9-]+$/.test(requiredVars.projectId)) {
    throw new AuthError(
      "Invalid VITE_FIREBASE_PROJECT_ID format. Project ID should only contain lowercase letters, numbers, and hyphens.",
      { projectId: requiredVars.projectId }
    );
  }

  return {
    apiKey: requiredVars.apiKey,
    authDomain: `${requiredVars.projectId}.firebaseapp.com`,
    projectId: requiredVars.projectId,
    storageBucket: `${requiredVars.projectId}.appspot.com`,
    appId: requiredVars.appId,
  };
}

/**
 * Development fallback configuration (for testing only)
 */
function getDevelopmentConfig() {
  console.warn(
    "⚠️  Using development Firebase configuration. This is for testing only!\n" +
    "Please configure proper Firebase credentials for production use."
  );
  
  return {
    apiKey: "demo-api-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo-project.firebasestorage.app",
    appId: "demo-app-id",
  };
}

/**
 * Initializes Firebase with comprehensive error handling
 */
function initializeFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  try {
    // Validate configuration
    const config = validateFirebaseConfig();
    
    // Initialize Firebase app
    const app = initializeApp(config);
    
    // Initialize services
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Connect to emulators when enabled
    if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
      try {
        connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
        connectFirestoreEmulator(db, "127.0.0.1", 8080);
        console.log("Connected to Firebase emulators (auth/firestore)");
      } catch (_) {
        // ignore if already connected or in unsupported environment
      }
    }
    
    if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      connectFirestoreEmulator(db, "127.0.0.1", 8080);
    }
    
    console.log("Firebase initialized successfully");
    
    return { app, auth, db };
  } catch (error) {
    if (error instanceof AuthError) {
      // In development, we might want to use a fallback
      if (import.meta.env.DEV) {
        console.error("Firebase configuration error:", error.message);
        
        // For development, create a minimal configuration
        // Note: This won't actually work for authentication
        try {
          const fallbackConfig = getDevelopmentConfig();
          const app = initializeApp(fallbackConfig);
          const auth = getAuth(app);
          const db = getFirestore(app);
          
          return { app, auth, db };
        } catch (fallbackError) {
          console.error("Even fallback Firebase initialization failed:", fallbackError);
          throw error; // Throw original error
        }
      } else {
        // In production, fail fast
        throw error;
      }
    }
    
    // Handle other initialization errors
    const initError = new AuthError(
      `Firebase initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}\n` +
      "Please check your Firebase configuration and network connectivity.",
      { originalError: error }
    );
    throw initError;
  }
}

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth; 
let db: Firestore;

try {
  const firebase = initializeFirebase();
  app = firebase.app;
  auth = firebase.auth;
  db = firebase.db;
} catch (error) {
  console.error("Critical Firebase initialization error:", error);
  // Re-throw to prevent app from starting with broken auth
  throw error;
}

export { auth, db };

const provider = new GoogleAuthProvider();

export const signInWithGoogle = () => {
  return signInWithRedirect(auth, provider);
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    // Anti-enumeration: Always take similar time regardless of outcome
    const startTime = Date.now();
    
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Ensure minimum response time to prevent timing attacks
    const minResponseTime = 200;
    const elapsed = Date.now() - startTime;
    if (elapsed < minResponseTime) {
      await new Promise(resolve => setTimeout(resolve, minResponseTime - elapsed));
    }
    
    return result;
  } catch (error: any) {
    // Anti-enumeration: Consistent error message and timing
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Don't expose whether email exists or not
    throw new AuthError(
      'Invalid email or password. Please check your credentials and try again.',
      { code: 'auth/invalid-credentials' }
    );
  }
};

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const startTime = Date.now();
    
    // Validate email format before attempting signup
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AuthError(
        'Please enter a valid email address.',
        { code: 'auth/invalid-email' }
      );
    }
    
    // Validate password strength
    if (password.length < 8) {
      throw new AuthError(
        'Password must be at least 8 characters long.',
        { code: 'auth/weak-password' }
      );
    }
    
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Ensure minimum response time
    const minResponseTime = 200;
    const elapsed = Date.now() - startTime;
    if (elapsed < minResponseTime) {
      await new Promise(resolve => setTimeout(resolve, minResponseTime - elapsed));
    }
    
    return result;
  } catch (error: any) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Sanitize error messages to prevent enumeration
    if (error.code === 'auth/email-already-in-use') {
      throw new AuthError(
        'An account with this email already exists. Please sign in instead.',
        { code: 'auth/email-already-in-use' }
      );
    } else if (error.code === 'auth/weak-password') {
      throw new AuthError(
        'Password must be at least 8 characters long and contain a mix of letters and numbers.',
        { code: 'auth/weak-password' }
      );
    } else if (error.code === 'auth/invalid-email') {
      throw new AuthError(
        'Please enter a valid email address.',
        { code: 'auth/invalid-email' }
      );
    } else {
      // Generic error for other cases
      throw new AuthError(
        'Unable to create account. Please try again later.',
        { code: 'auth/operation-failed' }
      );
    }
  }
};

export const handleAuthRedirect = () => {
  return getRedirectResult(auth);
};

export const signOutUser = () => {
  return signOut(auth);
};
