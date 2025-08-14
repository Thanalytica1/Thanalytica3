import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HealthAssessment, Recommendation, InsertHealthAssessment } from "@shared/schema";
import { FirestoreAssessmentsService } from "@/services/firestore-assessments";
import { FirestoreMetricsService } from "@/services/firestore-metrics";

export function useHealthAssessment(userId: string) {
  return useQuery<any>({
    queryKey: ["health-assessment", userId],
    queryFn: async () => {
      return await FirestoreAssessmentsService.getLatestAssessment(userId);
    },
    enabled: !!userId,
    // Health assessments don't change frequently - cache longer
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
}

export function useHealthMetrics(userId: string) {
  return useQuery<any>({
    queryKey: ["health-metrics", userId],
    queryFn: async () => {
      return await FirestoreMetricsService.getHealthAnalytics(userId, '30d');
    },
    enabled: !!userId,
    // Metrics update periodically but not constantly
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 15 * 60 * 1000, // Refresh every 15 minutes for metrics
  });
}

export function useRecommendations(userId: string) {
  return useQuery<Recommendation[]>({
    queryKey: ["recommendations", userId],
    queryFn: async () => {
      // Get latest assessment and generate recommendations from it
      const assessment = await FirestoreAssessmentsService.getLatestAssessment(userId);
      if (assessment?.id) {
        const insights = await FirestoreAssessmentsService.getAssessmentInsights(userId, assessment.id);
        return insights.recommendations || [];
      }
      return [];
    },
    enabled: !!userId,
    // Recommendations are relatively static
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 45 * 60 * 1000, // 45 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 30 * 60 * 1000, // Refresh every 30 minutes
  });
}

export function useCreateHealthAssessment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any & { userId: string }) => {
      const { userId, ...assessmentData } = data;
      return await FirestoreAssessmentsService.createAssessment(userId, assessmentData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["health-assessment", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["health-metrics", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["recommendations", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["healthAssessments", variables.userId] });
    },
  });
}
