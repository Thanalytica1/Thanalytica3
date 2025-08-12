// Main Cloud Functions entry point - organized for health app architecture
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentWritten, onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getApps, initializeApp } from "firebase-admin/app";

// Initialize Firebase Admin
if (!getApps().length) initializeApp();

// Health-focused function exports
export { healthMetrics } from './health/metrics';
export { assessments } from './health/assessments';
export { reports } from './health/reports';
export { wearableSync } from './health/wearables';

// User management
export { userManagement } from './users/management';
export { userProfiles } from './users/profiles';

// Data processing
export { dataExport } from './data/export';
export { dataAnalytics } from './data/analytics';

// Communication
export { notifications } from './communication/notifications';
export { emailReports } from './communication/reports';

// Security and monitoring
export { auditLogger } from './security/audit';
export { dataValidation } from './security/validation';

// Scheduled functions
export { dailyReports } from './scheduled/daily-reports';
export { weeklyAnalytics } from './scheduled/weekly-analytics';
export { dataCleanup } from './scheduled/cleanup';

// Legacy API (for backward compatibility during migration)
export { api } from './legacy/api';

// Health data processing triggers
export const processHealthMetrics = onDocumentCreated(
  "users/{userId}/healthMetrics/{metricId}",
  (event) => {
    // Process new health metrics for trends and insights
    return import('./triggers/health-metrics').then(module => 
      module.processHealthMetrics(event)
    );
  }
);

export const generateHealthInsights = onDocumentWritten(
  "users/{userId}/assessments/{assessmentId}",
  (event) => {
    // Generate insights when assessments are completed
    return import('./triggers/assessment-insights').then(module => 
      module.generateHealthInsights(event)
    );
  }
);

export const syncWearableData = onSchedule(
  { schedule: "every 1 hours", timeZone: "UTC" },
  () => {
    // Sync data from connected wearable devices
    return import('./scheduled/wearable-sync').then(module => 
      module.syncAllWearableData()
    );
  }
);

export const generateWeeklyReports = onSchedule(
  { schedule: "0 9 * * 1", timeZone: "UTC" }, // Mondays at 9 AM
  () => {
    // Generate weekly health reports for all users
    return import('./scheduled/weekly-reports').then(module => 
      module.generateWeeklyReports()
    );
  }
);

export const cleanupExpiredData = onSchedule(
  { schedule: "0 2 * * *", timeZone: "UTC" }, // Daily at 2 AM
  () => {
    // Clean up expired temporary data and old analytics
    return import('./scheduled/data-cleanup').then(module => 
      module.cleanupExpiredData()
    );
  }
);