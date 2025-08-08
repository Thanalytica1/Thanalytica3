import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import crypto from 'crypto';

// Healthcare-specific error types
export enum HealthcareErrorType {
  // Patient Safety Errors
  CRITICAL_PATIENT_SAFETY = 'critical_patient_safety',
  MEDICATION_ERROR = 'medication_error',
  DOSAGE_CALCULATION_ERROR = 'dosage_calculation_error',
  
  // Data Integrity Errors
  PHI_VALIDATION_ERROR = 'phi_validation_error',
  DATA_CORRUPTION = 'data_corruption',
  ENCRYPTION_ERROR = 'encryption_error',
  
  // System Errors
  AUTHENTICATION_ERROR = 'authentication_error',
  AUTHORIZATION_ERROR = 'authorization_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  SYSTEM_OVERLOAD = 'system_overload',
  
  // Integration Errors
  WEARABLE_SYNC_ERROR = 'wearable_sync_error',
  EXTERNAL_API_ERROR = 'external_api_error',
  DATABASE_ERROR = 'database_error',
  
  // Business Logic Errors
  INVALID_HEALTH_DATA = 'invalid_health_data',
  CALCULATION_ERROR = 'calculation_error',
  VALIDATION_ERROR = 'validation_error',
}

// Standardized error response structure
interface HealthcareErrorResponse {
  error: string;
  message: string;
  type: HealthcareErrorType;
  correlationId: string;
  timestamp: string;
  
  // Additional context (sanitized - no PHI)
  details?: Record<string, any>;
  suggestions?: string[];
  
  // For development/debugging (never in production)
  stack?: string;
  
  // HIPAA compliance
  auditLogged: boolean;
}

// Custom healthcare error class
export class HealthcareError extends Error {
  public readonly type: HealthcareErrorType;
  public readonly statusCode: number;
  public readonly details: Record<string, any>;
  public readonly suggestions: string[];
  public readonly isOperational: boolean;

  constructor(
    message: string,
    type: HealthcareErrorType,
    statusCode: number = 500,
    details: Record<string, any> = {},
    suggestions: string[] = [],
    isOperational: boolean = true
  ) {
    super(message);
    
    this.name = 'HealthcareError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.suggestions = suggestions;
    this.isOperational = isOperational;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HealthcareError);
    }
  }
}

// Sanitize error details to remove PHI
const sanitizeErrorDetails = (details: any): any => {
  if (!details || typeof details !== 'object') {
    return details;
  }

  const sanitized = { ...details };
  
  // Remove common PHI fields
  const phiFields = [
    'email', 'phone', 'ssn', 'address', 'name', 'firstName', 'lastName',
    'dateOfBirth', 'medicalRecord', 'insurance', 'emergency_contact',
    'bloodPressure', 'heartRate', 'weight', 'height', 'medications',
    'allergies', 'medicalHistory', 'userId', 'patientId'
  ];

  for (const field of phiFields) {
    if (field in sanitized) {
      sanitized[field] = '[PROTECTED]';
    }
  }

  // Recursively sanitize nested objects
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeErrorDetails(value);
    }
  }

  return sanitized;
};

// Map different error types to healthcare error types
const mapErrorToHealthcareType = (error: any): HealthcareErrorType => {
  if (error instanceof ZodError) {
    return HealthcareErrorType.VALIDATION_ERROR;
  }
  
  if (error.code === 'auth/invalid-token' || error.code === 'auth/expired-token') {
    return HealthcareErrorType.AUTHENTICATION_ERROR;
  }
  
  if (error.code === 'PERMISSION_DENIED') {
    return HealthcareErrorType.AUTHORIZATION_ERROR;
  }
  
  if (error.message?.includes('rate limit')) {
    return HealthcareErrorType.RATE_LIMIT_ERROR;
  }
  
  if (error.message?.includes('database') || error.code?.startsWith('DB_')) {
    return HealthcareErrorType.DATABASE_ERROR;
  }
  
  if (error.message?.includes('encryption') || error.message?.includes('decrypt')) {
    return HealthcareErrorType.ENCRYPTION_ERROR;
  }
  
  if (error.message?.includes('wearable') || error.message?.includes('fitbit') || error.message?.includes('oura')) {
    return HealthcareErrorType.WEARABLE_SYNC_ERROR;
  }
  
  // Default to generic validation error
  return HealthcareErrorType.VALIDATION_ERROR;
};

// Get suggestions based on error type
const getErrorSuggestions = (type: HealthcareErrorType): string[] => {
  switch (type) {
    case HealthcareErrorType.AUTHENTICATION_ERROR:
      return [
        'Please sign in again',
        'Check if your session has expired',
        'Verify your account is active'
      ];
      
    case HealthcareErrorType.AUTHORIZATION_ERROR:
      return [
        'Contact your healthcare provider for access',
        'Verify your account permissions',
        'Check if your subscription is active'
      ];
      
    case HealthcareErrorType.VALIDATION_ERROR:
      return [
        'Please check the format of your input',
        'Ensure all required fields are filled',
        'Contact support if the problem persists'
      ];
      
    case HealthcareErrorType.WEARABLE_SYNC_ERROR:
      return [
        'Check your device connection',
        'Try reconnecting your wearable device',
        'Verify device permissions are granted'
      ];
      
    case HealthcareErrorType.PHI_VALIDATION_ERROR:
      return [
        'Please review your health information',
        'Ensure data accuracy for your safety',
        'Contact your healthcare provider if unsure'
      ];
      
    default:
      return [
        'Please try again later',
        'Contact support if the problem persists'
      ];
  }
};

// Log security-sensitive errors
const logSecurityError = (error: any, req: Request): void => {
  const securityErrorTypes = [
    HealthcareErrorType.AUTHENTICATION_ERROR,
    HealthcareErrorType.AUTHORIZATION_ERROR,
    HealthcareErrorType.PHI_VALIDATION_ERROR,
    HealthcareErrorType.ENCRYPTION_ERROR,
  ];

  const errorType = mapErrorToHealthcareType(error);
  
  if (securityErrorTypes.includes(errorType)) {
    console.warn('SECURITY ERROR', {
      type: errorType,
      message: error.message,
      endpoint: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId: req.user?.uid || 'anonymous',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString(),
    });
  }
};

// Main error handling middleware
export const healthcareErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const correlationId = req.correlationId || req.headers['x-correlation-id'] as string || crypto.randomUUID();
  
  // Log the error (without PHI)
  console.error('Healthcare Error', {
    name: error.name,
    message: error.message,
    type: error.type || 'unknown',
    endpoint: req.path,
    method: req.method,
    statusCode: error.statusCode || 500,
    correlationId,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });

  // Log security-sensitive errors separately
  logSecurityError(error, req);

  let statusCode = 500;
  let errorType = HealthcareErrorType.VALIDATION_ERROR;
  let message = 'An error occurred processing your request';
  let details = {};
  let suggestions: string[] = [];

  if (error instanceof HealthcareError) {
    // Custom healthcare error
    statusCode = error.statusCode;
    errorType = error.type;
    message = error.message;
    details = sanitizeErrorDetails(error.details);
    suggestions = error.suggestions;
  } else if (error instanceof ZodError) {
    // Zod validation error
    statusCode = 400;
    errorType = HealthcareErrorType.VALIDATION_ERROR;
    message = 'Invalid data provided';
    details = {
      validationErrors: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
      })),
    };
    suggestions = getErrorSuggestions(errorType);
  } else if (error.code === 'auth/invalid-token') {
    // Authentication error
    statusCode = 401;
    errorType = HealthcareErrorType.AUTHENTICATION_ERROR;
    message = 'Authentication required';
    suggestions = getErrorSuggestions(errorType);
  } else if (error.code === 'PERMISSION_DENIED') {
    // Authorization error
    statusCode = 403;
    errorType = HealthcareErrorType.AUTHORIZATION_ERROR;
    message = 'Access denied';
    suggestions = getErrorSuggestions(errorType);
  } else {
    // Generic error
    errorType = mapErrorToHealthcareType(error);
    message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'An unexpected error occurred';
    suggestions = getErrorSuggestions(errorType);
  }

  // Create standardized error response
  const errorResponse: HealthcareErrorResponse = {
    error: error.name || 'Error',
    message,
    type: errorType,
    correlationId,
    timestamp: new Date().toISOString(),
    details: process.env.NODE_ENV === 'development' ? details : undefined,
    suggestions,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    auditLogged: true, // All errors are audit logged
  };

  // Critical errors require immediate attention
  if (errorType === HealthcareErrorType.CRITICAL_PATIENT_SAFETY ||
      errorType === HealthcareErrorType.DATA_CORRUPTION ||
      errorType === HealthcareErrorType.ENCRYPTION_ERROR) {
    
    console.error('CRITICAL HEALTHCARE ERROR', {
      type: errorType,
      correlationId,
      endpoint: req.path,
      timestamp: new Date().toISOString(),
    });

    // In production, this should trigger immediate alerts
    // Alert healthcare team, system administrators, etc.
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper for route handlers
export const asyncErrorHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validate critical health data
export const validateCriticalHealthData = (data: any): void => {
  // Critical validation for patient safety
  if (data.medications) {
    for (const medication of data.medications) {
      if (medication.dosage && medication.dosage < 0) {
        throw new HealthcareError(
          'Invalid medication dosage detected',
          HealthcareErrorType.CRITICAL_PATIENT_SAFETY,
          400,
          { medication: medication.name },
          ['Please verify medication dosage with your healthcare provider']
        );
      }
    }
  }

  if (data.bloodPressure) {
    const { systolic, diastolic } = data.bloodPressure;
    if (systolic > 300 || systolic < 50 || diastolic > 200 || diastolic < 30) {
      throw new HealthcareError(
        'Blood pressure reading appears invalid',
        HealthcareErrorType.PHI_VALIDATION_ERROR,
        400,
        {},
        ['Please verify blood pressure reading', 'Contact healthcare provider if reading is accurate']
      );
    }
  }

  if (data.heartRate && (data.heartRate > 300 || data.heartRate < 20)) {
    throw new HealthcareError(
      'Heart rate reading appears invalid',
      HealthcareErrorType.PHI_VALIDATION_ERROR,
      400,
      {},
      ['Please verify heart rate reading', 'Contact healthcare provider if reading is accurate']
    );
  }
};

// 404 handler for unknown routes
export const notFoundHandler = (req: Request, res: Response): void => {
  const correlationId = req.correlationId || crypto.randomUUID();
  
  console.warn('Route not found', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    correlationId,
    timestamp: new Date().toISOString(),
  });

  const errorResponse: HealthcareErrorResponse = {
    error: 'Not Found',
    message: 'The requested resource was not found',
    type: HealthcareErrorType.VALIDATION_ERROR,
    correlationId,
    timestamp: new Date().toISOString(),
    suggestions: [
      'Check the URL for typos',
      'Verify the API endpoint exists',
      'Contact support if you believe this is an error'
    ],
    auditLogged: true,
  };

  res.status(404).json(errorResponse);
};