/**
 * Centralized error handling utilities for Thanalytica
 * Provides consistent error handling patterns across the application
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', context);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', context);
    this.name = 'DatabaseError';
  }
}

export class AuthError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'AUTH_ERROR', context);
    this.name = 'AuthError';
  }
}

/**
 * Safely handles async operations with error catching
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<{ data: T | undefined; error: Error | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    return { data: fallback, error: normalizedError };
  }
}

/**
 * Safely executes a function with error catching
 */
export function safeFn<T>(
  operation: () => T,
  fallback?: T
): { data: T | undefined; error: Error | null } {
  try {
    const data = operation();
    return { data, error: null };
  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    return { data: fallback, error: normalizedError };
  }
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(
  jsonString: string,
  fallback?: T
): { data: T | undefined; error: Error | null } {
  try {
    const data = JSON.parse(jsonString);
    return { data, error: null };
  } catch (error) {
    return { 
      data: fallback, 
      error: new ValidationError('Invalid JSON format', { jsonString }) 
    };
  }
}

/**
 * User-friendly error messages for common errors
 */
export function getUserFriendlyMessage(error: Error): string {
  if (error instanceof NetworkError) {
    return 'Connection issue. Please check your internet and try again.';
  }
  
  if (error instanceof ValidationError) {
    return 'Please check your input and try again.';
  }
  
  if (error instanceof DatabaseError) {
    return 'Data service temporarily unavailable. Please try again later.';
  }
  
  if (error instanceof AuthError) {
    return 'Authentication required. Please sign in and try again.';
  }
  
  if (error.name === 'AbortError' || error.message.includes('aborted')) {
    return 'Operation was cancelled.';
  }
  
  if (error.message.toLowerCase().includes('network')) {
    return 'Network connection issue. Please check your internet and try again.';
  }
  
  if (error.message.toLowerCase().includes('timeout')) {
    return 'Request timed out. Please try again with a stable connection.';
  }
  
  return 'Something went wrong. Please try again or contact support if this continues.';
}

/**
 * Logs errors safely without exposing sensitive data
 */
export function logError(error: Error, context?: Record<string, unknown>): void {
  const sanitizedContext = context ? sanitizeForLogging(context) : {};
  
  console.error('Application Error:', {
    name: error.name,
    message: error.message,
    code: error instanceof AppError ? error.code : undefined,
    context: sanitizedContext,
    timestamp: new Date().toISOString(),
  });
  
  // In production, this would send to error reporting service
  // e.g., Sentry, LogRocket, etc.
}

/**
 * Sanitizes data for logging by removing sensitive information
 */
function sanitizeForLogging(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential'];
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    const keyLower = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sensitive => keyLower.includes(sensitive));
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Retry mechanism with exponential backoff
 */
export async function retryWithBackoff<T>(
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
      if (lastError instanceof ValidationError || lastError instanceof AuthError) {
        throw lastError;
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
}