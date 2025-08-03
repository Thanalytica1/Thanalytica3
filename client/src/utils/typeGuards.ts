/**
 * Runtime type checking utilities for Thanalytica
 * Provides type guards for safe data access
 */

/**
 * Type guard for checking if value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for checking if value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard for checking if value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Type guard for checking if value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Type guard for checking if value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Type guard for checking if value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard for checking if value is a non-empty array
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Type guard for checking if value is an object (not null, not array)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for checking if value is a valid Date
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Type guard for checking if value is a valid Firebase User
 */
export function isFirebaseUser(value: unknown): value is { uid: string; email: string | null } {
  return (
    isObject(value) &&
    isNonEmptyString(value.uid) &&
    (value.email === null || isString(value.email))
  );
}

/**
 * Type guard for checking if value has required properties
 */
export function hasRequiredProperties<T extends Record<string, unknown>>(
  value: unknown,
  properties: (keyof T)[]
): value is T {
  if (!isObject(value)) {
    return false;
  }
  
  return properties.every(prop => isDefined(value[prop as string]));
}

/**
 * Type guard for checking if value is a valid health assessment data
 */
export function isHealthAssessmentData(value: unknown): value is {
  age: number;
  gender: string;
  sleepDuration: string;
  sleepQuality: string;
  dietPattern: string;
  exerciseFrequency: string;
} {
  return (
    isObject(value) &&
    isNumber(value.age) &&
    isNonEmptyString(value.gender) &&
    isNonEmptyString(value.sleepDuration) &&
    isNonEmptyString(value.sleepQuality) &&
    isNonEmptyString(value.dietPattern) &&
    isNonEmptyString(value.exerciseFrequency)
  );
}

/**
 * Type guard for checking if value is a valid user data
 */
export function isUserData(value: unknown): value is {
  id: string;
  firebaseUid: string;
  email: string;
} {
  return (
    isObject(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.firebaseUid) &&
    isNonEmptyString(value.email)
  );
}

/**
 * Type guard for checking if value is a valid wearable connection
 */
export function isWearableConnection(value: unknown): value is {
  id: string;
  userId: string;
  deviceType: string;
  deviceId: string;
  isActive: boolean;
} {
  return (
    isObject(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.userId) &&
    isNonEmptyString(value.deviceType) &&
    isNonEmptyString(value.deviceId) &&
    isBoolean(value.isActive)
  );
}

/**
 * Type guard for checking if error is an AbortError
 */
export function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error && 
    (error.name === 'AbortError' || 
     error.message.includes('aborted') ||
     error.message.includes('signal is aborted'))
  );
}

/**
 * Type guard for checking if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.toLowerCase().includes('network') ||
     error.message.toLowerCase().includes('fetch') ||
     error.message.toLowerCase().includes('connection'))
  );
}

/**
 * Type guard for checking if error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes('timeout')
  );
}

/**
 * Safely access nested object properties
 */
export function safeGet<T>(
  obj: unknown,
  path: string,
  fallback?: T
): T | undefined {
  if (!isObject(obj) || !isNonEmptyString(path)) {
    return fallback;
  }
  
  const keys = path.split('.');
  let current: any = obj;
  
  for (const key of keys) {
    if (!isObject(current) || !(key in current)) {
      return fallback;
    }
    current = current[key];
  }
  
  return current as T;
}

/**
 * Safely access array elements
 */
export function safeArrayGet<T>(
  arr: unknown,
  index: number,
  fallback?: T
): T | undefined {
  if (!isArray(arr) || !isNumber(index) || index < 0 || index >= arr.length) {
    return fallback;
  }
  
  return arr[index] as T;
}

/**
 * Creates a type-safe property accessor
 */
export function createSafeAccessor<T extends Record<string, unknown>>(
  obj: T | null | undefined
) {
  return {
    get<K extends keyof T>(key: K, fallback?: T[K]): T[K] | undefined {
      if (!isDefined(obj) || !isObject(obj)) {
        return fallback;
      }
      return obj[key] ?? fallback;
    },
    
    has<K extends keyof T>(key: K): boolean {
      return isDefined(obj) && isObject(obj) && key in obj;
    },
    
    keys(): (keyof T)[] {
      if (!isDefined(obj) || !isObject(obj)) {
        return [];
      }
      return Object.keys(obj) as (keyof T)[];
    }
  };
}