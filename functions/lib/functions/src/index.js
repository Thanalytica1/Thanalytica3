"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.userManagement = exports.assessments = exports.healthMetrics = void 0;
// Main Cloud Functions entry point - organized for health app architecture
const app_1 = require("firebase-admin/app");
// Initialize Firebase Admin
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
// Health-focused function exports
var metrics_1 = require("./health/metrics");
Object.defineProperty(exports, "healthMetrics", { enumerable: true, get: function () { return metrics_1.healthMetrics; } });
var assessments_1 = require("./health/assessments");
Object.defineProperty(exports, "assessments", { enumerable: true, get: function () { return assessments_1.assessments; } });
// export { reports } from './health/reports';
// export { wearableSync } from './health/wearables';
// User management
var management_1 = require("./users/management");
Object.defineProperty(exports, "userManagement", { enumerable: true, get: function () { return management_1.userManagement; } });
// export { userProfiles } from './users/profiles';
// Data processing
// export { dataExport } from './data/export';
// export { dataAnalytics } from './data/analytics';
// Communication
// export { notifications } from './communication/notifications';
// export { emailReports } from './communication/reports';
// Security and monitoring
// export { auditLogger } from './security/audit';
// export { dataValidation } from './security/validation';
// Scheduled functions
// export { dailyReports } from './scheduled/daily-reports';
// export { weeklyAnalytics } from './scheduled/weekly-analytics';
// export { dataCleanup } from './scheduled/cleanup';
// Legacy API (for backward compatibility during migration)
var api_1 = require("./legacy/api");
Object.defineProperty(exports, "api", { enumerable: true, get: function () { return api_1.api; } });
// Health data processing triggers - commented out until modules are implemented
// export const processHealthMetrics = onDocumentCreated(
//   "users/{userId}/healthMetrics/{metricId}",
//   (event) => {
//     // Process new health metrics for trends and insights
//     return import('./triggers/health-metrics').then(module => 
//       module.processHealthMetrics(event)
//     );
//   }
// );
// export const generateHealthInsights = onDocumentWritten(
//   "users/{userId}/assessments/{assessmentId}",
//   (event) => {
//     // Generate insights when assessments are completed
//     return import('./triggers/assessment-insights').then(module => 
//       module.generateHealthInsights(event)
//     );
//   }
// );
// export const syncWearableData = onSchedule(
//   { schedule: "every 1 hours", timeZone: "UTC" },
//   () => {
//     // Sync data from connected wearable devices
//     return import('./scheduled/wearable-sync').then(module => 
//       module.syncAllWearableData()
//     );
//   }
// );
// export const generateWeeklyReports = onSchedule(
//   { schedule: "0 9 * * 1", timeZone: "UTC" }, // Mondays at 9 AM
//   () => {
//     // Generate weekly health reports for all users
//     return import('./scheduled/weekly-reports').then(module => 
//       module.generateWeeklyReports()
//     );
//   }
// );
// export const cleanupExpiredData = onSchedule(
//   { schedule: "0 2 * * *", timeZone: "UTC" }, // Daily at 2 AM
//   () => {
//     // Clean up expired temporary data and old analytics
//     return import('./scheduled/data-cleanup').then(module => 
//       module.cleanupExpiredData()
//     );
//   }
// );
