"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLLECTIONS = exports.retryDatabaseOperation = exports.db = void 0;
exports.generateId = generateId;
exports.getCurrentTimestamp = getCurrentTimestamp;
exports.docToObject = docToObject;
exports.queryToArray = queryToArray;
exports.checkDatabaseHealth = checkDatabaseHealth;
const dotenv_1 = __importDefault(require("dotenv"));
const firebaseAdmin_1 = require("./firebaseAdmin");
Object.defineProperty(exports, "db", { enumerable: true, get: function () { return firebaseAdmin_1.db; } });
Object.defineProperty(exports, "retryDatabaseOperation", { enumerable: true, get: function () { return firebaseAdmin_1.retryFirestoreOperation; } });
// Load environment variables
dotenv_1.default.config();
/**
 * Firestore collection names
 * These replace the PostgreSQL table names from the schema
 */
exports.COLLECTIONS = {
    USERS: 'users',
    HEALTH_ASSESSMENTS: 'health_assessments',
    HEALTH_METRICS: 'health_metrics',
    RECOMMENDATIONS: 'recommendations',
    WEARABLE_CONNECTIONS: 'wearable_connections',
    WEARABLES_DATA: 'wearables_data',
    HEALTH_MODELS: 'health_models',
    HEALTH_INSIGHTS: 'health_insights',
    HEALTH_TRENDS: 'health_trends',
    ANALYTICS_EVENTS: 'analytics_events',
    REFERRALS: 'referrals',
    CACHE: 'cache', // Cache collection for cost optimization
};
/**
 * Utility function to generate IDs (replaces database auto-generated IDs)
 */
function generateId() {
    return firebaseAdmin_1.db.collection('_temp').doc().id;
}
/**
 * Utility function to get current timestamp in Firestore format
 */
function getCurrentTimestamp() {
    return new Date();
}
/**
 * Utility function to convert Firestore document to plain object
 */
function docToObject(doc) {
    if (!doc.exists)
        return undefined;
    return { id: doc.id, ...doc.data() };
}
/**
 * Utility function to convert Firestore query snapshot to array of objects
 */
function queryToArray(snapshot) {
    return snapshot.docs.map(doc => docToObject(doc));
}
/**
 * Database health check function
 */
async function checkDatabaseHealth() {
    try {
        const testRef = firebaseAdmin_1.db.collection('_health_check').doc('test');
        await testRef.set({ timestamp: getCurrentTimestamp(), status: 'ok' });
        await testRef.delete();
        return { status: 'healthy', message: 'Firestore connection is working' };
    }
    catch (error) {
        return {
            status: 'unhealthy',
            message: `Firestore connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}
// Test connection on startup
checkDatabaseHealth().then(result => {
    if (result.status === 'healthy') {
        console.log('✅ Database health check passed:', result.message);
    }
    else {
        console.error('❌ Database health check failed:', result.message);
    }
});
