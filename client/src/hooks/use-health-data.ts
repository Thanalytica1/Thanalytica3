import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { HealthAssessment, HealthMetrics, Recommendation, InsertHealthAssessment } from "@shared/schema";

export function useHealthAssessment(userId: string) {
  return useQuery<HealthAssessment>({
    queryKey: ["/api/health-assessment", userId],
    enabled: !!userId,
    // Health assessments don't change frequently - cache longer
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
}

export function useHealthMetrics(userId: string) {
  return useQuery<HealthMetrics>({
    queryKey: ["/api/health-metrics", userId],
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
    queryKey: ["/api/recommendations", userId],
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
    mutationFn: async (data: InsertHealthAssessment & { userId: string }) => {
      const response = await apiRequest("POST", "/api/health-assessment", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-assessment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
    },
  });
}
