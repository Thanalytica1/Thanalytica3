import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { HealthAssessment, HealthMetrics, Recommendation, InsertHealthAssessment } from "@shared/schema";

export function useHealthAssessment(userId: string) {
  return useQuery<HealthAssessment>({
    queryKey: ["/api/health-assessment", userId],
    enabled: !!userId,
  });
}

export function useHealthMetrics(userId: string) {
  return useQuery<HealthMetrics>({
    queryKey: ["/api/health-metrics", userId],
    enabled: !!userId,
  });
}

export function useRecommendations(userId: string) {
  return useQuery<Recommendation[]>({
    queryKey: ["/api/recommendations", userId],
    enabled: !!userId,
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
