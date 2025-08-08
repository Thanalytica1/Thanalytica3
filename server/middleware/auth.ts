import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
let adminAuth: ReturnType<typeof getAuth>;

try {
  // Check if Firebase Admin is already initialized
  if (getApps().length === 0) {
    // Initialize with service account credentials
    const serviceAccount = process.env.FIREBASE_ADMIN_SDK_KEY 
      ? JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY)
      : undefined;

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    } else {
      // Fallback for development - use default credentials
      initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
  }
  
  adminAuth = getAuth();
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  // Continue without admin auth in development
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Firebase Admin initialization required for production');
  }
}

// Enhanced user context interface
interface AuthenticatedUser {
  uid: string;
  email?: string;
  emailVerified: boolean;
  customClaims?: Record<string, any>;
  roles?: string[];
  lastSignIn?: Date;
  issuedAt: Date;
  audience: string;
}

// Extend Express Request to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      correlationId?: string;
    }
  }
}

// Token validation with anti-enumeration protection
export const validateFirebaseToken = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const correlationId = req.headers['x-correlation-id'] as string || crypto.randomUUID();
    req.correlationId = correlationId;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Anti-enumeration: Always return same error message
      res.status(401).json({
        error: 'Authentication required',
        message: 'Valid authentication token required',
        correlationId,
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Basic token format validation
    if (!token || token.length < 10) {
      await simulateDelay(); // Anti-timing attack
      res.status(401).json({
        error: 'Authentication required',
        message: 'Valid authentication token required',
        correlationId,
      });
      return;
    }

    if (!adminAuth) {
      throw new Error('Firebase Admin not initialized');
    }

    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(token, true);
    
    // Enhanced user validation
    const user: AuthenticatedUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false,
      customClaims: decodedToken,
      roles: decodedToken.roles || [],
      issuedAt: new Date(decodedToken.iat * 1000),
      audience: decodedToken.aud,
    };

    // Validate token freshness (not older than 1 hour)
    const tokenAge = Date.now() - user.issuedAt.getTime();
    if (tokenAge > 60 * 60 * 1000) {
      await simulateDelay();
      res.status(401).json({
        error: 'Authentication required',
        message: 'Token expired - please refresh',
        correlationId,
      });
      return;
    }

    // Validate audience matches our project
    if (user.audience !== process.env.FIREBASE_PROJECT_ID) {
      console.warn('Invalid token audience', {
        expected: process.env.FIREBASE_PROJECT_ID,
        received: user.audience,
        correlationId,
      });
      await simulateDelay();
      res.status(401).json({
        error: 'Authentication required',
        message: 'Invalid token audience',
        correlationId,
      });
      return;
    }

    // Check if user account is disabled
    try {
      const userRecord = await adminAuth.getUser(user.uid);
      if (userRecord.disabled) {
        console.warn('Disabled user attempted access', {
          uid: user.uid,
          email: user.email,
          correlationId,
        });
        await simulateDelay();
        res.status(401).json({
          error: 'Authentication required',
          message: 'Account access suspended',
          correlationId,
        });
        return;
      }
    } catch (userError) {
      // User not found or other error
      console.warn('User validation failed', {
        uid: user.uid,
        error: userError instanceof Error ? userError.message : 'Unknown error',
        correlationId,
      });
      await simulateDelay();
      res.status(401).json({
        error: 'Authentication required',
        message: 'Invalid user account',
        correlationId,
      });
      return;
    }

    // Audit log successful authentication (without sensitive data)
    console.info('Successful authentication', {
      uid: user.uid,
      email: user.email ? '[PROTECTED]' : undefined,
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId,
      timestamp: new Date().toISOString(),
    });

    req.user = user;
    next();

  } catch (error) {
    // Security audit log for failed authentication
    console.warn('Authentication failure', {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId: req.correlationId,
      timestamp: new Date().toISOString(),
    });

    await simulateDelay(); // Anti-timing attack
    res.status(401).json({
      error: 'Authentication required',
      message: 'Valid authentication token required',
      correlationId: req.correlationId,
    });
    return;
  }
};

// Optional authentication for public endpoints
export const optionalAuth = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // If auth header present, validate it
    return validateFirebaseToken(req, res, next);
  }
  
  // No auth header - continue without user context
  next();
};

// Role-based access control
export const requireRole = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Valid authentication token required',
        correlationId: req.correlationId,
      });
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      // Audit log for authorization failure
      console.warn('Authorization failure', {
        uid: req.user.uid,
        requiredRoles,
        userRoles,
        endpoint: req.path,
        method: req.method,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
      });

      res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Required role not found',
        correlationId: req.correlationId,
      });
      return;
    }

    next();
  };
};

// Health data access validation
export const requireHealthDataAccess = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'Health data access requires authentication',
      correlationId: req.correlationId,
    });
    return;
  }

  // Verify email is verified for health data access
  if (!req.user.emailVerified) {
    console.warn('Unverified email attempted health data access', {
      uid: req.user.uid,
      email: req.user.email ? '[PROTECTED]' : undefined,
      endpoint: req.path,
      correlationId: req.correlationId,
    });

    res.status(403).json({
      error: 'Email verification required',
      message: 'Please verify your email to access health data',
      correlationId: req.correlationId,
    });
    return;
  }

  // Additional health data specific validations can be added here
  // For example: HIPAA consent, data sharing agreements, etc.

  next();
};

// Anti-enumeration delay simulation
const simulateDelay = async (): Promise<void> => {
  // Random delay between 100-300ms to prevent timing attacks
  const delay = Math.floor(Math.random() * 200) + 100;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// User context validation for resource access
export const validateUserAccess = (req: Request, res: Response, next: NextFunction): void => {
  const targetUserId = req.params.userId || req.params.firebaseUid;
  
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required',
      correlationId: req.correlationId,
    });
    return;
  }

  // Users can only access their own data unless they have admin role
  const isAdmin = req.user.roles?.includes('admin') || req.user.roles?.includes('healthcare_provider');
  const isOwnData = req.user.uid === targetUserId;

  if (!isOwnData && !isAdmin) {
    console.warn('Unauthorized data access attempt', {
      requestingUser: req.user.uid,
      targetUser: targetUserId,
      endpoint: req.path,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString(),
    });

    res.status(403).json({
      error: 'Access denied',
      message: 'Cannot access other users data',
      correlationId: req.correlationId,
    });
    return;
  }

  next();
};

// Session management for enhanced security
export const validateSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    return next(); // Skip if no user (handled by other middleware)
  }

  try {
    // Check if user has valid session in our system
    const sessionId = req.headers['x-session-id'] as string;
    
    if (sessionId) {
      // Validate session against our session store if implemented
      // This would integrate with your session management system
      
      // For now, just log session usage for audit
      console.info('Session validation', {
        uid: req.user.uid,
        sessionId: sessionId ? '[PROTECTED]' : undefined,
        endpoint: req.path,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  } catch (error) {
    console.error('Session validation error', {
      uid: req.user.uid,
      error: error instanceof Error ? error.message : 'Unknown error',
      correlationId: req.correlationId,
    });
    
    res.status(500).json({
      error: 'Session validation failed',
      correlationId: req.correlationId,
    });
    return;
  }
};