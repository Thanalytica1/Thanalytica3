import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// HIPAA-compliant audit event types
export enum AuditEventType {
  // PHI Access Events
  PHI_ACCESS = 'phi_access',
  PHI_CREATE = 'phi_create',
  PHI_UPDATE = 'phi_update',
  PHI_DELETE = 'phi_delete',
  PHI_EXPORT = 'phi_export',
  
  // Authentication Events
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  AUTH_LOGOUT = 'auth_logout',
  
  // Authorization Events
  AUTHZ_SUCCESS = 'authz_success',
  AUTHZ_FAILURE = 'authz_failure',
  
  // System Events
  SYSTEM_ACCESS = 'system_access',
  SYSTEM_ERROR = 'system_error',
  
  // Data Sync Events
  DATA_SYNC_START = 'data_sync_start',
  DATA_SYNC_COMPLETE = 'data_sync_complete',
  DATA_SYNC_ERROR = 'data_sync_error',
}

// HIPAA audit log entry structure
interface AuditLogEntry {
  // Required HIPAA fields
  timestamp: string;
  eventType: AuditEventType;
  userId: string | null; // null for unauthenticated events
  userEmail?: string; // Hashed for privacy
  patientId?: string; // Subject of the PHI access
  
  // Technical details
  resourceAccessed?: string;
  action: string;
  outcome: 'success' | 'failure';
  
  // Network information
  sourceIp: string;
  userAgent: string;
  sessionId?: string;
  correlationId: string;
  
  // Additional context
  details?: Record<string, any>;
  
  // Data classification
  dataTypes?: string[];
  sensitivityLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Retention metadata
  retentionDate: string; // 7 years from creation for HIPAA
}

// Hash sensitive identifiers for audit logs
const hashIdentifier = (identifier: string): string => {
  return crypto.createHash('sha256').update(identifier + process.env.AUDIT_HASH_SALT || 'default-salt').digest('hex');
};

// Determine data sensitivity based on endpoint
const getDataSensitivity = (path: string): AuditLogEntry['sensitivityLevel'] => {
  if (path.includes('/health-assessment') || 
      path.includes('/biological-age') || 
      path.includes('/wearable-data')) {
    return 'critical';
  }
  
  if (path.includes('/metrics') || path.includes('/analytics')) {
    return 'high';
  }
  
  if (path.includes('/user') || path.includes('/profile')) {
    return 'medium';
  }
  
  return 'low';
};

// Determine data types accessed
const getDataTypes = (path: string, method: string): string[] => {
  const types: string[] = [];
  
  if (path.includes('/health-assessment')) {
    types.push('health_assessment', 'medical_history');
  }
  
  if (path.includes('/wearable-data')) {
    types.push('biometric_data', 'activity_data', 'sleep_data');
  }
  
  if (path.includes('/biological-age')) {
    types.push('calculated_health_metrics', 'predictive_analytics');
  }
  
  if (path.includes('/user') || path.includes('/profile')) {
    types.push('personal_information', 'contact_information');
  }
  
  if (path.includes('/oauth') || path.includes('/auth')) {
    types.push('authentication_data');
  }
  
  return types;
};

// Create audit log entry
const createAuditEntry = (
  req: Request,
  res: Response,
  eventType: AuditEventType,
  outcome: 'success' | 'failure',
  details?: Record<string, any>
): AuditLogEntry => {
  const now = new Date();
  const retentionDate = new Date(now);
  retentionDate.setFullYear(retentionDate.getFullYear() + 7); // HIPAA 7-year retention

  return {
    timestamp: now.toISOString(),
    eventType,
    userId: req.user?.uid || null,
    userEmail: req.user?.email ? hashIdentifier(req.user.email) : undefined,
    patientId: req.params?.userId || req.params?.firebaseUid || req.user?.uid,
    resourceAccessed: `${req.method} ${req.path}`,
    action: `${req.method.toLowerCase()}_${req.path.split('/').pop() || 'unknown'}`,
    outcome,
    sourceIp: req.ip,
    userAgent: req.headers['user-agent'] || 'unknown',
    sessionId: req.headers['x-session-id'] as string,
    correlationId: req.correlationId || req.headers['x-correlation-id'] as string || crypto.randomUUID(),
    details: details || {},
    dataTypes: getDataTypes(req.path, req.method),
    sensitivityLevel: getDataSensitivity(req.path),
    retentionDate: retentionDate.toISOString(),
  };
};

// Audit log storage (in production, this should write to a secure, immutable store)
class AuditLogger {
  private logs: AuditLogEntry[] = [];
  
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // In production, this should write to:
      // 1. Immutable database table
      // 2. Encrypted log files
      // 3. SIEM system
      // 4. Compliance monitoring system
      
      this.logs.push(entry);
      
      // For now, log to console with structured format
      console.log(JSON.stringify({
        '@timestamp': entry.timestamp,
        level: 'audit',
        event_type: entry.eventType,
        user_id: entry.userId,
        resource: entry.resourceAccessed,
        outcome: entry.outcome,
        source_ip: entry.sourceIp,
        correlation_id: entry.correlationId,
        sensitivity: entry.sensitivityLevel,
        data_types: entry.dataTypes,
        retention_date: entry.retentionDate,
        details: entry.details,
      }));
      
      // Critical events should also trigger alerts
      if (entry.eventType === AuditEventType.AUTHZ_FAILURE || 
          entry.outcome === 'failure' && entry.sensitivityLevel === 'critical') {
        await this.sendSecurityAlert(entry);
      }
      
    } catch (error) {
      // Audit logging failures are critical - never fail silently
      console.error('CRITICAL: Audit logging failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        entry: entry,
        timestamp: new Date().toISOString(),
      });
      
      // In production, this should trigger immediate alerts
      throw new Error('Audit logging system failure');
    }
  }
  
  private async sendSecurityAlert(entry: AuditLogEntry): Promise<void> {
    // In production, integrate with your alerting system
    console.warn('SECURITY ALERT', {
      event_type: entry.eventType,
      user_id: entry.userId,
      resource: entry.resourceAccessed,
      source_ip: entry.sourceIp,
      timestamp: entry.timestamp,
      correlation_id: entry.correlationId,
    });
  }
  
  // For compliance reporting
  async getAuditLogs(
    startDate: Date,
    endDate: Date,
    userId?: string,
    eventType?: AuditEventType
  ): Promise<AuditLogEntry[]> {
    return this.logs.filter(log => {
      const logDate = new Date(log.timestamp);
      const inDateRange = logDate >= startDate && logDate <= endDate;
      const matchesUser = !userId || log.userId === userId;
      const matchesEventType = !eventType || log.eventType === eventType;
      
      return inDateRange && matchesUser && matchesEventType;
    });
  }
}

const auditLogger = new AuditLogger();

// Middleware for automatic PHI access logging
export const auditPHIAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const originalSend = res.send;
  const startTime = Date.now();
  
  // Override res.send to capture response details
  res.send = function(data: any) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Determine event type based on method and outcome
    let eventType: AuditEventType;
    if (req.method === 'GET') {
      eventType = AuditEventType.PHI_ACCESS;
    } else if (req.method === 'POST') {
      eventType = AuditEventType.PHI_CREATE;
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      eventType = AuditEventType.PHI_UPDATE;
    } else if (req.method === 'DELETE') {
      eventType = AuditEventType.PHI_DELETE;
    } else {
      eventType = AuditEventType.SYSTEM_ACCESS;
    }
    
    const outcome: 'success' | 'failure' = statusCode < 400 ? 'success' : 'failure';
    
    const auditEntry = createAuditEntry(req, res, eventType, outcome, {
      status_code: statusCode,
      response_time_ms: responseTime,
      response_size_bytes: data ? JSON.stringify(data).length : 0,
    });
    
    // Log asynchronously to not block response
    auditLogger.log(auditEntry).catch(error => {
      console.error('Failed to log audit entry:', error);
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Middleware for authentication event logging
export const auditAuthEvent = (eventType: AuditEventType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      const outcome: 'success' | 'failure' = res.statusCode < 400 ? 'success' : 'failure';
      
      const auditEntry = createAuditEntry(req, res, eventType, outcome, {
        status_code: res.statusCode,
        auth_method: req.path.includes('oauth') ? 'oauth' : 'email_password',
      });
      
      auditLogger.log(auditEntry).catch(error => {
        console.error('Failed to log auth audit entry:', error);
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Manual audit logging for specific events
export const logAuditEvent = async (
  req: Request,
  res: Response,
  eventType: AuditEventType,
  outcome: 'success' | 'failure',
  details?: Record<string, any>
): Promise<void> => {
  const auditEntry = createAuditEntry(req, res, eventType, outcome, details);
  await auditLogger.log(auditEntry);
};

// Export audit logger for compliance reporting
export { auditLogger, AuditLogger };

// Apply audit logging based on endpoint sensitivity
export const applyAuditByEndpoint = (path: string) => {
  if (path.includes('/health-assessment') || 
      path.includes('/wearable-data') || 
      path.includes('/biological-age') ||
      path.includes('/metrics')) {
    return [auditPHIAccess];
  }
  
  if (path.includes('/oauth') || path.includes('/auth')) {
    return [auditAuthEvent(AuditEventType.AUTH_SUCCESS)];
  }
  
  // For other endpoints, use general system access logging
  return [auditAuthEvent(AuditEventType.SYSTEM_ACCESS)];
};