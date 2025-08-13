"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assessments = void 0;
// Health Assessments Cloud Functions
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const db = (0, firestore_1.getFirestore)();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
// Get user's health assessments
app.get("/assessments/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10, status } = req.query;
        let query = db.collection(`users/${userId}/assessments`);
        if (status) {
            query = query.where("status", "==", status);
        }
        query = query.orderBy("createdAt", "desc").limit(Number(limit));
        const snapshot = await query.get();
        const assessments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(assessments);
    }
    catch (error) {
        console.error("Error fetching assessments:", error);
        res.status(500).json({ error: "Failed to fetch assessments" });
    }
});
// Create new health assessment
app.post("/assessments/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const assessmentData = {
            ...req.body,
            userId,
            status: "draft",
            startedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const docRef = await db.collection(`users/${userId}/assessments`).add(assessmentData);
        res.status(201).json({
            id: docRef.id,
            ...assessmentData
        });
    }
    catch (error) {
        console.error("Error creating assessment:", error);
        res.status(500).json({ error: "Failed to create assessment" });
    }
});
// Update assessment (complete, add responses, etc.)
app.put("/assessments/:userId/:assessmentId", async (req, res) => {
    try {
        const { userId, assessmentId } = req.params;
        const updateData = {
            ...req.body,
            updatedAt: new Date().toISOString()
        };
        // If completing the assessment, add completion timestamp and process results
        if (updateData.status === "completed" && !updateData.completedAt) {
            updateData.completedAt = new Date().toISOString();
            // Calculate scores and insights
            const scores = await calculateAssessmentScores(userId, assessmentId, updateData);
            updateData.scores = scores.scores;
            updateData.insights = scores.insights;
        }
        await db.doc(`users/${userId}/assessments/${assessmentId}`).update(updateData);
        // Get updated document
        const updatedDoc = await db.doc(`users/${userId}/assessments/${assessmentId}`).get();
        res.json({
            id: updatedDoc.id,
            ...updatedDoc.data()
        });
    }
    catch (error) {
        console.error("Error updating assessment:", error);
        res.status(500).json({ error: "Failed to update assessment" });
    }
});
// Submit assessment response
app.post("/assessments/:userId/:assessmentId/responses", async (req, res) => {
    try {
        const { userId, assessmentId } = req.params;
        const responseData = {
            ...req.body,
            assessmentId,
            userId,
            answeredAt: new Date().toISOString()
        };
        const docRef = await db.collection(`users/${userId}/assessments/${assessmentId}/responses`).add(responseData);
        res.status(201).json({
            id: docRef.id,
            ...responseData
        });
    }
    catch (error) {
        console.error("Error saving assessment response:", error);
        res.status(500).json({ error: "Failed to save response" });
    }
});
// Get assessment responses
app.get("/assessments/:userId/:assessmentId/responses", async (req, res) => {
    try {
        const { userId, assessmentId } = req.params;
        const snapshot = await db.collection(`users/${userId}/assessments/${assessmentId}/responses`).get();
        const responses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(responses);
    }
    catch (error) {
        console.error("Error fetching responses:", error);
        res.status(500).json({ error: "Failed to fetch responses" });
    }
});
// Helper function to calculate assessment scores
async function calculateAssessmentScores(userId, assessmentId, assessmentData) {
    try {
        // Get all responses for this assessment
        const responsesSnapshot = await db.collection(`users/${userId}/assessments/${assessmentId}/responses`).get();
        const responses = responsesSnapshot.docs.map(doc => doc.data());
        // Basic scoring logic (this would be more sophisticated in production)
        const categoryScores = {};
        const insights = {
            strengths: [],
            improvements: [],
            risks: [],
            recommendations: []
        };
        // Process responses to calculate scores
        for (const response of responses) {
            const { questionType, questionId, response: answer } = response;
            // Example scoring logic based on question patterns
            if (questionId.includes('sleep')) {
                if (!categoryScores.sleep)
                    categoryScores.sleep = 0;
                categoryScores.sleep += calculateSleepScore(answer);
            }
            else if (questionId.includes('exercise')) {
                if (!categoryScores.exercise)
                    categoryScores.exercise = 0;
                categoryScores.exercise += calculateExerciseScore(answer);
            }
            else if (questionId.includes('nutrition')) {
                if (!categoryScores.nutrition)
                    categoryScores.nutrition = 0;
                categoryScores.nutrition += calculateNutritionScore(answer);
            }
            else if (questionId.includes('stress')) {
                if (!categoryScores.stress)
                    categoryScores.stress = 0;
                categoryScores.stress += calculateStressScore(answer);
            }
        }
        // Calculate overall score
        const categoryKeys = Object.keys(categoryScores);
        const overall = categoryKeys.length > 0
            ? Math.round(categoryKeys.reduce((sum, key) => sum + categoryScores[key], 0) / categoryKeys.length)
            : 0;
        // Calculate biological age estimate (simplified)
        const chronologicalAge = assessmentData.age || 35;
        const biologicalAge = Math.round(chronologicalAge * (1 - (overall - 50) / 100));
        // Generate insights based on scores
        generateAssessmentInsights(categoryScores, insights);
        return {
            scores: {
                overall,
                categories: categoryScores,
                biologicalAge,
                vitalityScore: overall,
                longevityIndex: Math.min(100, overall + 10)
            },
            insights
        };
    }
    catch (error) {
        console.error("Error calculating assessment scores:", error);
        return {
            scores: { overall: 0, categories: {}, biologicalAge: 35, vitalityScore: 0, longevityIndex: 0 },
            insights: { strengths: [], improvements: [], risks: [], recommendations: [] }
        };
    }
}
function calculateSleepScore(answer) {
    if (typeof answer === 'number') {
        if (answer >= 7 && answer <= 9)
            return 90;
        if (answer >= 6 && answer < 7)
            return 70;
        if (answer >= 5 && answer < 6)
            return 50;
        return 30;
    }
    return 50; // Default for non-numeric answers
}
function calculateExerciseScore(answer) {
    if (typeof answer === 'string') {
        const freq = answer.toLowerCase();
        if (freq.includes('daily') || freq.includes('5-7'))
            return 95;
        if (freq.includes('4-5') || freq.includes('most'))
            return 85;
        if (freq.includes('2-3') || freq.includes('few'))
            return 70;
        if (freq.includes('1-2') || freq.includes('rarely'))
            return 50;
        return 30;
    }
    return 50;
}
function calculateNutritionScore(answer) {
    if (typeof answer === 'string') {
        const diet = answer.toLowerCase();
        if (diet.includes('mediterranean') || diet.includes('plant'))
            return 90;
        if (diet.includes('balanced') || diet.includes('healthy'))
            return 80;
        if (diet.includes('standard') || diet.includes('mixed'))
            return 60;
        return 40;
    }
    return 50;
}
function calculateStressScore(answer) {
    if (typeof answer === 'number') {
        // Assuming stress is rated 1-10, lower is better
        return Math.max(10, 100 - (answer * 10));
    }
    return 50;
}
function generateAssessmentInsights(scores, insights) {
    Object.entries(scores).forEach(([category, score]) => {
        if (score >= 80) {
            insights.strengths.push(`Excellent ${category} habits`);
        }
        else if (score < 60) {
            insights.improvements.push(`Focus on improving ${category}`);
            insights.recommendations.push(`Consider working with a specialist to enhance your ${category}`);
        }
        if (score < 40) {
            insights.risks.push({
                type: `${category}_risk`,
                level: 'moderate',
                description: `Low ${category} score may impact long-term health`,
                timeframe: '6-12 months'
            });
        }
    });
}
exports.assessments = (0, https_1.onRequest)({ region: "us-central1" }, app);
