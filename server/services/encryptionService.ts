import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits

// Health data fields that require encryption
const ENCRYPTED_FIELDS = [
  'biologicalAge',
  'healthScore',
  'riskFactors',
  'medicalHistory',
  'medications',
  'allergies',
  'emergencyContact',
  'insurance',
  'socialSecurityNumber',
  'dateOfBirth',
  'phoneNumber',
  'address',
  'bloodPressure',
  'heartRate',
  'weight',
  'height',
  'bloodGlucose',
  'cholesterol',
  'sleepData',
  'activityData',
  'nutritionData',
] as const;

type EncryptedField = typeof ENCRYPTED_FIELDS[number];

// Encrypted data structure
interface EncryptedData {
  encrypted: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  tag: string; // Base64 encoded authentication tag
  keyId: string; // Key rotation identifier
  algorithm: string; // Encryption algorithm used
  timestamp: string; // When encryption occurred
}

// Key management for encryption key rotation
class KeyManager {
  private currentKeyId: string;
  private keys: Map<string, Buffer> = new Map();
  
  constructor() {
    this.currentKeyId = process.env.ENCRYPTION_KEY_ID || 'default';
    this.loadKeys();
  }
  
  private loadKeys(): void {
    // In production, this should load from a secure key management service (AWS KMS, Azure Key Vault, etc.)
    const masterKey = process.env.ENCRYPTION_KEY;
    
    if (!masterKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ENCRYPTION_KEY environment variable is required in production');
      }
      
      // Development fallback - DO NOT USE IN PRODUCTION
      console.warn('⚠️  Using development encryption key - NOT SECURE FOR PRODUCTION');
      const devKey = crypto.scryptSync('development-key-not-secure', 'salt', KEY_LENGTH);
      this.keys.set(this.currentKeyId, devKey);
      return;
    }
    
    try {
      // Derive encryption key from master key
      const salt = crypto.scryptSync('thanalytica-health-data', 'salt', SALT_LENGTH);
      const key = crypto.scryptSync(masterKey, salt, KEY_LENGTH);
      this.keys.set(this.currentKeyId, key);
      
      // In production, load historical keys for decryption of old data
      this.loadHistoricalKeys();
      
    } catch (error) {
      throw new Error(`Failed to initialize encryption keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private loadHistoricalKeys(): void {
    // In production, load all historical keys for data encrypted with previous keys
    // This is essential for key rotation without data loss
    
    const historicalKeysEnv = process.env.HISTORICAL_ENCRYPTION_KEYS;
    if (historicalKeysEnv) {
      try {
        const historicalKeys = JSON.parse(historicalKeysEnv);
        for (const [keyId, masterKey] of Object.entries(historicalKeys)) {
          const salt = crypto.scryptSync('thanalytica-health-data', 'salt', SALT_LENGTH);
          const key = crypto.scryptSync(masterKey as string, salt, KEY_LENGTH);
          this.keys.set(keyId, key);
        }
      } catch (error) {
        console.error('Failed to load historical encryption keys:', error);
      }
    }
  }
  
  getCurrentKey(): { keyId: string; key: Buffer } {
    const key = this.keys.get(this.currentKeyId);
    if (!key) {
      throw new Error('Current encryption key not found');
    }
    return { keyId: this.currentKeyId, key };
  }
  
  getKey(keyId: string): Buffer {
    const key = this.keys.get(keyId);
    if (!key) {
      throw new Error(`Encryption key not found for keyId: ${keyId}`);
    }
    return key;
  }
  
  // Key rotation method
  rotateKey(newKeyId: string, newMasterKey: string): void {
    try {
      const salt = crypto.scryptSync('thanalytica-health-data', 'salt', SALT_LENGTH);
      const key = crypto.scryptSync(newMasterKey, salt, KEY_LENGTH);
      this.keys.set(newKeyId, key);
      this.currentKeyId = newKeyId;
      
      console.info('Encryption key rotated', { newKeyId, timestamp: new Date().toISOString() });
    } catch (error) {
      throw new Error(`Key rotation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

const keyManager = new KeyManager();

// Encryption service
export class EncryptionService {
  
  /**
   * Encrypt sensitive health data
   */
  static encrypt(data: string): EncryptedData {
    try {
      const { keyId, key } = keyManager.getCurrentKey();
      
      // Generate random IV for each encryption
      const iv = crypto.randomBytes(IV_LENGTH);
      
      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      cipher.setAutoPadding(true);
      
      // Encrypt the data
      let encrypted = cipher.update(data, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // Get authentication tag
      const tag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        keyId,
        algorithm: ALGORITHM,
        timestamp: new Date().toISOString(),
      };
      
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }
  
  /**
   * Decrypt sensitive health data
   */
  static decrypt(encryptedData: EncryptedData): string {
    try {
      const key = keyManager.getKey(encryptedData.keyId);
      
      // Create decipher
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const decipher = crypto.createDecipheriv(encryptedData.algorithm, key, iv);
      
      // Set auth tag
      const authTag = Buffer.from(encryptedData.tag, 'base64');
      (decipher as any).setAuthTag?.(authTag);
      
      // Decrypt the data
      let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
      
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }
  
  /**
   * Encrypt an object with selective field encryption
   */
  static encryptObject<T extends Record<string, any>>(obj: T): T {
    const result = { ...obj };
    
    for (const [key, value] of Object.entries(obj)) {
      if (ENCRYPTED_FIELDS.includes(key as EncryptedField) && value !== null && value !== undefined) {
        // Convert value to string for encryption
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        (result as any)[key] = this.encrypt(stringValue);
      }
    }
    
    return result;
  }
  
  /**
   * Decrypt an object with selective field decryption
   */
  static decryptObject<T extends Record<string, any>>(obj: T): T {
    const result = { ...obj };
    
    for (const [key, value] of Object.entries(obj)) {
      if (ENCRYPTED_FIELDS.includes(key as EncryptedField) && 
          value && 
          typeof value === 'object' && 
          'encrypted' in value) {
        try {
           const decryptedValue = this.decrypt(value as EncryptedData);
          
          // Try to parse as JSON, fallback to string
          try {
             (result as any)[key] = JSON.parse(decryptedValue);
          } catch {
            (result as any)[key] = decryptedValue;
          }
        } catch (error) {
          console.error(`Failed to decrypt field ${key}:`, error);
          // In production, this might require manual intervention
          (result as any)[key] = '[DECRYPTION_FAILED]';
        }
      }
    }
    
    return result;
  }
  
  /**
   * Check if a field should be encrypted
   */
  static shouldEncrypt(fieldName: string): boolean {
    return ENCRYPTED_FIELDS.includes(fieldName as EncryptedField);
  }
  
  /**
   * Safely hash data for indexing (preserves searchability while protecting data)
   */
  static hashForIndex(data: string): string {
    // Use HMAC for consistent hashing that can be used for database indexes
    const hmac = crypto.createHmac('sha256', keyManager.getCurrentKey().key);
    hmac.update(data);
    return hmac.digest('hex');
  }
  
  /**
   * Create searchable hash for encrypted data
   */
  static createSearchableHash(data: string): string {
    // For fields that need to be searchable (like email), create a deterministic hash
    // This allows for exact match searches while protecting the actual data
    const normalizedData = data.toLowerCase().trim();
    return this.hashForIndex(normalizedData);
  }
  
  /**
   * Key rotation for existing data
   */
  static async rotateDataEncryption<T extends Record<string, any>>(
    data: T,
    newKeyId?: string
  ): Promise<T> {
    // First decrypt with old key
    const decrypted = this.decryptObject(data);
    
    // If new key specified, rotate to it temporarily
    if (newKeyId) {
      const currentKeyId = keyManager.getCurrentKey().keyId;
      // This would need to be implemented with proper key management
      console.warn('Key rotation not fully implemented - requires key management system');
    }
    
    // Re-encrypt with current key
    return this.encryptObject(decrypted);
  }
  
  /**
   * Validate encrypted data integrity
   */
  static validateEncryptedData(encryptedData: EncryptedData): boolean {
    try {
      // Check required fields
      if (!encryptedData.encrypted || 
          !encryptedData.iv || 
          !encryptedData.tag || 
          !encryptedData.keyId) {
        return false;
      }
      
      // Verify algorithm
      if (encryptedData.algorithm !== ALGORITHM) {
        console.warn('Unsupported encryption algorithm:', encryptedData.algorithm);
        return false;
      }
      
      // Verify key exists
      try {
        keyManager.getKey(encryptedData.keyId);
      } catch {
        console.warn('Encryption key not found:', encryptedData.keyId);
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
}

// Health data specific encryption utilities
export class HealthDataEncryption {
  
  /**
   * Encrypt health assessment data
   */
  static encryptHealthAssessment(assessment: any): any {
    return EncryptionService.encryptObject(assessment);
  }
  
  /**
   * Decrypt health assessment data
   */
  static decryptHealthAssessment(encryptedAssessment: any): any {
    return EncryptionService.decryptObject(encryptedAssessment);
  }
  
  /**
   * Encrypt wearable device data
   */
  static encryptWearableData(data: any): any {
    // Encrypt sensitive biometric data while preserving metadata
    const encrypted = { ...data };
    
    if (data.heartRateData) {
      encrypted.heartRateData = EncryptionService.encrypt(JSON.stringify(data.heartRateData));
    }
    
    if (data.sleepData) {
      encrypted.sleepData = EncryptionService.encrypt(JSON.stringify(data.sleepData));
    }
    
    if (data.activityData) {
      encrypted.activityData = EncryptionService.encrypt(JSON.stringify(data.activityData));
    }
    
    return encrypted;
  }
  
  /**
   * Create anonymized version for analytics
   */
  static anonymizeForAnalytics<T extends Record<string, any>>(data: T): Partial<T> {
    const anonymized: Partial<T> = {};
    
    // Only include non-identifying fields for analytics
    const allowedFields = [
      'age', 'gender', 'generalHealthScore', 'exerciseFrequency',
      'sleepQuality', 'stressLevel', 'timestamp', 'deviceType'
    ];
    
    for (const field of allowedFields) {
      if (field in data) {
        anonymized[field as keyof T] = data[field];
      }
    }
    
    // Add anonymized identifiers
    if (data.userId) {
      anonymized['anonymizedUserId' as keyof T] = EncryptionService.hashForIndex(data.userId) as T[keyof T];
    }
    
    return anonymized;
  }
}

// Export the service
export { EncryptionService as default, keyManager };