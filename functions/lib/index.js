"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredData = exports.generateWeeklyReports = exports.syncWearableData = exports.generateHealthInsights = exports.processHealthMetrics = exports.api = exports.dataCleanup = exports.weeklyAnalytics = exports.dailyReports = exports.dataValidation = exports.auditLogger = exports.emailReports = exports.notifications = exports.dataAnalytics = exports.dataExport = exports.userProfiles = exports.userManagement = exports.wearableSync = exports.reports = exports.assessments = exports.healthMetrics = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const app_1 = require("firebase-admin/app");
// Initialize Firebase Admin
if (!(0, app_1.getApps)().length)
    (0, app_1.initializeApp)();
// Health-focused function exports
var metrics_1 = require("./health/metrics");
Object.defineProperty(exports, "healthMetrics", { enumerable: true, get: function () { return metrics_1.healthMetrics; } });
var assessments_1 = require("./health/assessments");
Object.defineProperty(exports, "assessments", { enumerable: true, get: function () { return assessments_1.assessments; } });
var reports_1 = require("./health/reports");
Object.defineProperty(exports, "reports", { enumerable: true, get: function () { return reports_1.reports; } });
var wearables_1 = require("./health/wearables");
Object.defineProperty(exports, "wearableSync", { enumerable: true, get: function () { return wearables_1.wearableSync; } });
// User management
var management_1 = require("./users/management");
Object.defineProperty(exports, "userManagement", { enumerable: true, get: function () { return management_1.userManagement; } });
var profiles_1 = require("./users/profiles");
Object.defineProperty(exports, "userProfiles", { enumerable: true, get: function () { return profiles_1.userProfiles; } });
// Data processing
var export_1 = require("./data/export");
Object.defineProperty(exports, "dataExport", { enumerable: true, get: function () { return export_1.dataExport; } });
var analytics_1 = require("./data/analytics");
Object.defineProperty(exports, "dataAnalytics", { enumerable: true, get: function () { return analytics_1.dataAnalytics; } });
// Communication
var notifications_1 = require("./communication/notifications");
Object.defineProperty(exports, "notifications", { enumerable: true, get: function () { return notifications_1.notifications; } });
var reports_2 = require("./communication/reports");
Object.defineProperty(exports, "emailReports", { enumerable: true, get: function () { return reports_2.emailReports; } });
// Security and monitoring
var audit_1 = require("./security/audit");
Object.defineProperty(exports, "auditLogger", { enumerable: true, get: function () { return audit_1.auditLogger; } });
var validation_1 = require("./security/validation");
Object.defineProperty(exports, "dataValidation", { enumerable: true, get: function () { return validation_1.dataValidation; } });
// Scheduled functions
var daily_reports_1 = require("./scheduled/daily-reports");
Object.defineProperty(exports, "dailyReports", { enumerable: true, get: function () { return daily_reports_1.dailyReports; } });
var weekly_analytics_1 = require("./scheduled/weekly-analytics");
Object.defineProperty(exports, "weeklyAnalytics", { enumerable: true, get: function () { return weekly_analytics_1.weeklyAnalytics; } });
var cleanup_1 = require("./scheduled/cleanup");
Object.defineProperty(exports, "dataCleanup", { enumerable: true, get: function () { return cleanup_1.dataCleanup; } });
// Legacy API (for backward compatibility during migration)
var api_1 = require("./legacy/api");
Object.defineProperty(exports, "api", { enumerable: true, get: function () { return api_1.api; } });
// Health data processing triggers
exports.processHealthMetrics = (0, firestore_1.onDocumentCreated)("users/{userId}/healthMetrics/{metricId}", (event) => {
    // Process new health metrics for trends and insights
    return Promise.resolve().then(() => __importStar(require('./triggers/health-metrics'))).then(module => module.processHealthMetrics(event));
});
exports.generateHealthInsights = (0, firestore_1.onDocumentWritten)("users/{userId}/assessments/{assessmentId}", (event) => {
    // Generate insights when assessments are completed
    return Promise.resolve().then(() => __importStar(require('./triggers/assessment-insights'))).then(module => module.generateHealthInsights(event));
});
exports.syncWearableData = (0, scheduler_1.onSchedule)({ schedule: "every 1 hours", timeZone: "UTC" }, () => {
    // Sync data from connected wearable devices
    return Promise.resolve().then(() => __importStar(require('./scheduled/wearable-sync'))).then(module => module.syncAllWearableData());
});
exports.generateWeeklyReports = (0, scheduler_1.onSchedule)({ schedule: "0 9 * * 1", timeZone: "UTC" }, // Mondays at 9 AM
() => {
    // Generate weekly health reports for all users
    return Promise.resolve().then(() => __importStar(require('./scheduled/weekly-reports'))).then(module => module.generateWeeklyReports());
});
exports.cleanupExpiredData = (0, scheduler_1.onSchedule)({ schedule: "0 2 * * *", timeZone: "UTC" }, // Daily at 2 AM
() => {
    // Clean up expired temporary data and old analytics
    return Promise.resolve().then(() => __importStar(require('./scheduled/data-cleanup'))).then(module => module.cleanupExpiredData());
});
