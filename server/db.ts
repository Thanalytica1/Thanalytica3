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

  // Create pool with improved configuration to prevent exhaustion
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    // Enhanced connection pool configuration for high load
    max: 20, // Maximum number of connections (increased for better concurrency)
    min: 2, // Minimum number of connections to maintain
    idleTimeoutMillis: 30000, // 30 seconds - close idle connections
    connectionTimeoutMillis: 10000, // 10 seconds - timeout for new connections
    acquireTimeoutMillis: 60000, // 60 seconds - timeout for acquiring connections from pool
    createTimeoutMillis: 30000, // 30 seconds - timeout for creating new connections
    destroyTimeoutMillis: 5000, // 5 seconds - timeout for destroying connections
    reapIntervalMillis: 1000, // 1 second - how often to check for idle connections
    createRetryIntervalMillis: 200, // 200ms - delay between connection creation retries
  });

  // Add comprehensive connection event listeners for monitoring
  pool.on('error', (err) => {
    console.error('Database pool error:', {
      message: err.message,
      code: (err as any).code,
      timestamp: new Date().toISOString(),
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    });
  });

  pool.on('connect', (client) => {
    console.log('Database connection established successfully', {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    });
  });

  pool.on('acquire', () => {
    // Log when pool reaches high utilization
    if (pool.totalCount >= 18) { // 90% of max connections
      console.warn('Database pool high utilization warning:', {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
        utilizationPercent: Math.round((pool.totalCount / 20) * 100),
      });
    }
  });

  pool.on('remove', () => {
    console.log('Database connection removed from pool', {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
    });
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