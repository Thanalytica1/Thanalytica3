/**
 * Input validation helpers for Thanalytica
 * Provides consistent validation patterns across the application
 */

/**
 * Safely converts string to number with validation
 */
export function safeNumber(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }
  
  return fallback;
}

/**
 * Safely converts string to integer with validation
 */
export function safeInteger(value: unknown, fallback: number = 0): number {
  const num = safeNumber(value, fallback);
  return Math.floor(num);
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength
 */
export function isValidPassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  return { valid: true };
}

/**
 * Validates age input
 */
export function isValidAge(age: unknown): boolean {
  const numAge = safeNumber(age);
  return numAge >= 13 && numAge <= 120;
}

/**
 * Validates array is not empty
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Validates string is not empty or just whitespace
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Sanitizes user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove basic HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validates Firebase UID format
 */
export function isValidFirebaseUid(uid: string): boolean {
  return typeof uid === 'string' && uid.length > 0 && uid.length <= 128;
}

/**
 * Validates URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates phone number format (basic)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Validates date string format (ISO 8601)
 */
export function isValidDateString(date: string): boolean {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime()) && parsedDate.toISOString().startsWith(date.split('T')[0]);
}

/**
 * Creates a validation schema builder
 */
export class ValidationBuilder<T> {
  private rules: Array<(value: T) => string | null> = [];

  required(message: string = 'This field is required') {
    this.rules.push((value: T) => {
      if (value === null || value === undefined || value === '') {
        return message;
      }
      return null;
    });
    return this;
  }

  string(message: string = 'Must be a string') {
    this.rules.push((value: T) => {
      if (typeof value !== 'string') {
        return message;
      }
      return null;
    });
    return this;
  }

  number(message: string = 'Must be a number') {
    this.rules.push((value: T) => {
      if (typeof value !== 'number' || isNaN(value)) {
        return message;
      }
      return null;
    });
    return this;
  }

  email(message: string = 'Must be a valid email') {
    this.rules.push((value: T) => {
      if (typeof value === 'string' && !isValidEmail(value)) {
        return message;
      }
      return null;
    });
    return this;
  }

  minLength(min: number, message?: string) {
    this.rules.push((value: T) => {
      if (typeof value === 'string' && value.length < min) {
        return message || `Must be at least ${min} characters`;
      }
      return null;
    });
    return this;
  }

  maxLength(max: number, message?: string) {
    this.rules.push((value: T) => {
      if (typeof value === 'string' && value.length > max) {
        return message || `Must be no more than ${max} characters`;
      }
      return null;
    });
    return this;
  }

  min(min: number, message?: string) {
    this.rules.push((value: T) => {
      if (typeof value === 'number' && value < min) {
        return message || `Must be at least ${min}`;
      }
      return null;
    });
    return this;
  }

  max(max: number, message?: string) {
    this.rules.push((value: T) => {
      if (typeof value === 'number' && value > max) {
        return message || `Must be no more than ${max}`;
      }
      return null;
    });
    return this;
  }

  custom(validator: (value: T) => string | null) {
    this.rules.push(validator);
    return this;
  }

  validate(value: T): string | null {
    for (const rule of this.rules) {
      const error = rule(value);
      if (error) {
        return error;
      }
    }
    return null;
  }
}

/**
 * Helper function to create validation builder
 */
export function validator<T>(): ValidationBuilder<T> {
  return new ValidationBuilder<T>();
}