import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

/**
 * Validates and initializes database connection with comprehensive error handling
 */
function initializeDatabase() {
  // Comprehensive DATABASE_URL validation
  if (!process.env.DATABASE_URL) {
    const error = new Error(
      "DATABASE_URL environment variable is required but not set.\n" +
      "Please ensure you have:\n" +
      "1. Provisioned a PostgreSQL database in Replit\n" +
      "2. The DATABASE_URL secret is properly configured\n" +
      "3. The database is accessible from your application\n\n" +
      "Contact support if this issue persists."
    );
    error.name = 'DatabaseConfigurationError';
    throw error;
  }

  // Validate DATABASE_URL format
  try {
    const url = new URL(process.env.DATABASE_URL);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
      throw new Error(`Invalid database protocol: ${url.protocol}. Expected postgres: or postgresql:`);
    }
    
    if (!url.hostname || !url.pathname) {
      throw new Error('DATABASE_URL must include hostname and database name');
    }
  } catch (parseError) {
    const error = new Error(
      `Invalid DATABASE_URL format: ${parseError instanceof Error ? parseError.message : 'Unknown format error'}\n` +
      "Expected format: postgres://user:password@host:port/database\n" +
      "Please check your database configuration."
    );
    error.name = 'DatabaseUrlFormatError';
    throw error;
  }

  // Create pool with retry logic and error handling
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    // Connection pool configuration for stability
    max: 10, // Maximum number of connections
    idleTimeoutMillis: 30000, // 30 seconds
    connectionTimeoutMillis: 10000, // 10 seconds
  });

  // Add connection event listeners for monitoring
  pool.on('error', (err) => {
    console.error('Database pool error:', {
      message: err.message,
      code: (err as any).code,
      timestamp: new Date().toISOString(),
    });
  });

  pool.on('connect', () => {
    console.log('Database connection established successfully');
  });

  // Create Drizzle instance with schema
  const db = drizzle({ client: pool, schema });

  // Test connection on startup
  testDatabaseConnection(pool);

  return { pool, db };
}

/**
 * Tests database connection with graceful error handling
 */
async function testDatabaseConnection(pool: Pool): Promise<void> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Database connection test successful');
  } catch (error) {
    console.error('Database connection test failed:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code,
      timestamp: new Date().toISOString(),
    });
    
    // In development, we might want to continue despite connection issues
    // In production, this should probably terminate the application
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Database connection failed. Application cannot start without database access. ' +
        'Please check your database configuration and network connectivity.'
      );
    } else {
      console.warn('Warning: Database connection failed in development mode. Some features may not work.');
    }
  }
}

/**
 * Retry database operations with exponential backoff
 */
export async function retryDatabaseOperation<T>(
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
        lastError.message.includes('connection') ||
        lastError.message.includes('timeout') ||
        (lastError as any).code === 'ECONNRESET' ||
        (lastError as any).code === 'ENOTFOUND';

      if (!isRetryableError || attempt === maxRetries) {
        throw lastError;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Database operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, {
        message: lastError.message,
        code: (lastError as any).code,
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Initialize database connection
const { pool, db } = initializeDatabase();

export { pool, db };