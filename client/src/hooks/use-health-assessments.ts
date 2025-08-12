// Health assessments hook using new hierarchical structure
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";
import { HealthAssessment, AssessmentResponse } from "@shared/health-schema";

const API_BASE = "/api/health/assessments";

// Fetch health assessments for current user
export function useHealthAssessments(limit = 10, status?: string) {
  const [user] = useState(() => auth.currentUser);
  
  return useQuery({
    queryKey: ["healthAssessments", user?.uid, limit, status],
    queryFn: async (): Promise<HealthAssessment[]> => {
      if (!user?.uid) throw new Error("User not authenticated");
      
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      if (status) params.append("status", status);
      
      const response = await fetch(`${API_BASE}/${user.uid}?${params}`);
      if (!response.ok) throw new Error("Failed to fetch health assessments");
      
      return response.json();
    },
    enabled: !!user?.uid,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get latest completed assessment
export function useLatestAssessment() {
  const [user] = useState(() => auth.currentUser);
  
  return useQuery({
    queryKey: ["latestAssessment", user?.uid],
    queryFn: async (): Promise<HealthAssessment | null> => {
      if (!user?.uid) throw new Error("User not authenticated");
      
      const response = await fetch(`${API_BASE}/${user.uid}?limit=1&status=completed`);
      if (!response.ok) throw new Error("Failed to fetch latest assessment");
      
      const assessments = await response.json();
      return assessments.length > 0 ? assessments[0] : null;
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000,
  });
}

// Create new health assessment
export function useCreateAssessment() {
  const queryClient = useQueryClient();
  const [user] = useState(() => auth.currentUser);
  
  return useMutation({
    mutationFn: async (data: Partial<HealthAssessment>): Promise<HealthAssessment> => {
      if (!user?.uid) throw new Error("User not authenticated");
      
      const response = await fetch(`${API_BASE}/${user.uid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error("Failed to create assessment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["healthAssessments", user?.uid] });
    },
  });
}

// Update assessment (complete, add responses, etc.)
export function useUpdateAssessment() {
  const queryClient = useQueryClient();
  const [user] = useState(() => auth.currentUser);
  
  return useMutation({
    mutationFn: async ({ 
      assessmentId, 
      data 
    }: { 
      assessmentId: string; 
      data: Partial<HealthAssessment> 
    }): Promise<HealthAssessment> => {
      if (!user?.uid) throw new Error("User not authenticated");
      
      const response = await fetch(`${API_BASE}/${user.uid}/${assessmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error("Failed to update assessment");
      return response.json();
    },
    onSuccess: (updatedAssessment) => {
      queryClient.invalidateQueries({ queryKey: ["healthAssessments", user?.uid] });
      
      // Update cache for specific assessment
      queryClient.setQueryData(
        ["assessment", user?.uid, updatedAssessment.id],
        updatedAssessment
      );
      
      // If assessment was completed, invalidate related queries
      if (updatedAssessment.status === "completed") {
        queryClient.invalidateQueries({ queryKey: ["latestAssessment", user?.uid] });
        queryClient.invalidateQueries({ queryKey: ["healthMetrics", user?.uid] });
      }
    },
  });
}

// Submit assessment response
export function useSubmitResponse() {
  const queryClient = useQueryClient();
  const [user] = useState(() => auth.currentUser);
  
  return useMutation({
    mutationFn: async ({ 
      assessmentId, 
      response 
    }: { 
      assessmentId: string; 
      response: Partial<AssessmentResponse> 
    }): Promise<AssessmentResponse> => {
      if (!user?.uid) throw new Error("User not authenticated");
      
      const responseData = await fetch(`${API_BASE}/${user.uid}/${assessmentId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(response),
      });
      
      if (!responseData.ok) throw new Error("Failed to submit response");
      return responseData.json();
    },
    onSuccess: (_, { assessmentId }) => {
      // Invalidate responses for this assessment
      queryClient.invalidateQueries({ 
        queryKey: ["assessmentResponses", user?.uid, assessmentId] 
      });
    },
  });
}

// Get assessment responses
export function useAssessmentResponses(assessmentId: string) {
  const [user] = useState(() => auth.currentUser);
  
  return useQuery({
    queryKey: ["assessmentResponses", user?.uid, assessmentId],
    queryFn: async (): Promise<AssessmentResponse[]> => {
      if (!user?.uid) throw new Error("User not authenticated");
      
      const response = await fetch(`${API_BASE}/${user.uid}/${assessmentId}/responses`);
      if (!response.ok) throw new Error("Failed to fetch responses");
      
      return response.json();
    },
    enabled: !!user?.uid && !!assessmentId,
    staleTime: 5 * 60 * 1000,
  });
}

// Get assessment progress (completion percentage)
export function useAssessmentProgress(assessmentId: string) {
  const { data: responses } = useAssessmentResponses(assessmentId);
  
  // This would be calculated based on the assessment structure
  // For now, we'll assume 20 questions total
  const totalQuestions = 20;
  const completedQuestions = responses?.length || 0;
  const progress = Math.min(100, (completedQuestions / totalQuestions) * 100);
  
  return {
    progress,
    completedQuestions,
    totalQuestions,
    isComplete: progress >= 100
  };
}

// Assessment insights and recommendations
export function useAssessmentInsights(assessmentId?: string) {
  const [user] = useState(() => auth.currentUser);
  
  return useQuery({
    queryKey: ["assessmentInsights", user?.uid, assessmentId],
    queryFn: async () => {
      if (!user?.uid || !assessmentId) throw new Error("Missing required parameters");
      
      const response = await fetch(`${API_BASE}/${user.uid}/${assessmentId}/insights`);
      if (!response.ok) throw new Error("Failed to fetch insights");
      
      return response.json();
    },
    enabled: !!user?.uid && !!assessmentId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Assessment comparison (compare multiple assessments)
export function useAssessmentComparison(assessmentIds: string[]) {
  const [user] = useState(() => auth.currentUser);
  
  return useQuery({
    queryKey: ["assessmentComparison", user?.uid, ...assessmentIds.sort()],
    queryFn: async () => {
      if (!user?.uid) throw new Error("User not authenticated");
      
      const response = await fetch(`${API_BASE}/${user.uid}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentIds }),
      });
      
      if (!response.ok) throw new Error("Failed to compare assessments");
      return response.json();
    },
    enabled: !!user?.uid && assessmentIds.length > 1,
    staleTime: 15 * 60 * 1000,
  });
}