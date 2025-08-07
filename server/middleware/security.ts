import helmet from 'helmet';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';

// HIPAA-compliant Content Security Policy
const cspConfig = {
  defaultSrc: ["'self'"],
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // Required for some React components
    "https://fonts.googleapis.com",
  ],
  fontSrc: [
    "'self'",
    "https://fonts.gstatic.com",
  ],
  scriptSrc: [
    "'self'",
    // Firebase SDK domains
    "https://www.gstatic.com",
    "https://www.googleapis.com",
    "https://securetoken.googleapis.com",
  ],
  connectSrc: [
    "'self'",
    // Firebase and Firestore domains
    "https://*.googleapis.com",
    "https://*.firebaseio.com",
    "https://*.firestore.googleapis.com",
    // Health data sync endpoints
    "https://api.fitbit.com",
    "https://api.ouraring.com",
    "https://developer-api.withings.com",
    // Only allow HTTPS for external health data sources
  ],
  imgSrc: [
    "'self'",
    "data:",
    "https:", // Allow images from CDNs but log access
  ],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: [
    "'self'",
    // Firebase Auth domains only
    "https://*.firebaseapp.com",
  ],
  formAction: ["'self'"],
  baseUri: ["'self'"],
  manifestSrc: ["'self'"],
};

// Helmet configuration for healthcare security
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: cspConfig,
    reportOnly: false, // Enforce CSP in production
  },
  
  // HTTP Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  
  // X-Frame-Options
  frameguard: {
    action: 'sameorigin',
  },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // X-XSS-Protection
  xssFilter: true,
  
  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
  
  // Hide X-Powered-By header
  hidePoweredBy: true,
  
  // Permissions Policy (formerly Feature Policy)
  permissionsPolicy: {
    features: {
      geolocation: ["'self'"],
      camera: ["'none'"],
      microphone: ["'none'"],
      payment: ["'none'"],
      usb: ["'none'"],
      fullscreen: ["'self'"],
    },
  },
  
  // Cross-Origin policies
  crossOriginEmbedderPolicy: false, // Disable for compatibility
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// CORS configuration for healthcare platform
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://localhost:3000',
  'https://localhost:5000',
  // Add your production domains here
  process.env.FRONTEND_URL,
  process.env.FIREBASE_HOSTING_URL,
].filter(Boolean) as string[];

// Development mode allows additional origins
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push(
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
    'https://127.0.0.1:3000',
    'https://127.0.0.1:5000'
  );
}

export const corsConfig = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log unauthorized CORS attempts for security monitoring
      console.warn('CORS violation attempt', {
        origin,
        timestamp: new Date().toISOString(),
        userAgent: 'unknown', // Will be set by middleware
      });
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true, // Allow cookies and authentication headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-User-ID',
    'X-Session-ID',
    'X-Request-ID',
    'X-Correlation-ID',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'X-Request-ID',
  ],
  maxAge: 86400, // 24 hours
});

// Enhanced CORS for health data endpoints
export const strictCorsConfig = cors({
  origin: (origin, callback) => {
    // Health data endpoints require strict origin validation
    if (!origin) {
      return callback(new Error('Origin required for health data access'));
    }
    
    // Only allow explicitly configured origins for health data
    const healthDataOrigins = [
      process.env.FRONTEND_URL,
      process.env.FIREBASE_HOSTING_URL,
    ].filter(Boolean) as string[];
    
    if (process.env.NODE_ENV === 'development') {
      healthDataOrigins.push('http://localhost:3000', 'https://localhost:3000');
    }
    
    if (healthDataOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('Unauthorized health data access attempt', {
        origin,
        timestamp: new Date().toISOString(),
      });
      callback(new Error('Unauthorized access to health data'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // No PATCH for health data
  allowedHeaders: [
    'Origin',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-User-ID',
    'X-Request-ID',
  ],
  maxAge: 3600, // 1 hour only
});

// Security middleware for request validation
export const requestSecurity = (req: Request, res: Response, next: NextFunction): void => {
  // Add correlation ID for request tracking
  const correlationId = req.headers['x-correlation-id'] as string || 
                       req.headers['x-request-id'] as string || 
                       crypto.randomUUID();
  
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('X-Request-ID', correlationId);
  
  // Validate Content-Type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        error: 'Invalid Content-Type',
        message: 'Expected application/json',
        correlationId,
      });
    }
  }
  
  // Check for suspicious headers
  const suspiciousHeaders = [
    'x-forwarded-host',
    'x-original-url',
    'x-rewrite-url',
    'x-cluster-client-ip',
  ];
  
  for (const header of suspiciousHeaders) {
    if (req.headers[header]) {
      console.warn('Suspicious header detected', {
        header,
        value: req.headers[header],
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        correlationId,
      });
    }
  }
  
  // Rate limit based on request size for DoS protection
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 10 * 1024 * 1024) { // 10MB limit
    return res.status(413).json({
      error: 'Payload Too Large',
      message: 'Request body exceeds maximum size',
      correlationId,
    });
  }
  
  next();
};

// Health endpoint security (less restrictive for monitoring)
export const healthEndpointSecurity = (req: Request, res: Response, next: NextFunction): void => {
  // Simple security for health checks - no authentication required
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
};

// Apply security middleware based on endpoint type
export const applySecurityByEndpoint = (path: string) => {
  if (path === '/api/health') {
    return [healthEndpointSecurity];
  }
  
  if (path.includes('/health-assessment') || 
      path.includes('/wearable-data') || 
      path.includes('/biological-age') ||
      path.includes('/metrics')) {
    return [securityHeaders, strictCorsConfig, requestSecurity];
  }
  
  return [securityHeaders, corsConfig, requestSecurity];
};