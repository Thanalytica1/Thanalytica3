import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { 
  HealthAssessment, 
  HealthMetrics, 
  Recommendation, 
  HealthTrend, 
  HealthInsight,
  WearableData 
} from "@shared/schema";

// Optimized Health Metrics Hook with Enhanced Caching
export function useOptimizedHealthMetrics(userId: string) {
  return useQuery<HealthMetrics>({
    queryKey: ['health-metrics', userId],
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (was cacheTime in v4)
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
  });
}

// Enhanced User Data Hook with Background Sync
export function useOptimizedUserData(userId: string) {
  return useQuery({
    queryKey: ['user-data', userId],
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchInterval: 15 * 60 * 1000, // Background sync every 15 minutes
  });
}

// Health trends functionality removed for resource optimization
// Use basic health data queries instead

// AI Insights with Smart Prefetching
// Health insights functionality removed for resource optimization
// Use basic health data queries instead

// Wearable Data with Batch Loading
export function useWearableDataOptimized(userId: string, dataType?: string) {
  return useQuery<WearableData[]>({
    queryKey: ['wearable-data', userId, dataType],
    enabled: !!userId,
    staleTime: 1 * 60 * 1000, // 1 minute for real-time data
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true, // Sync when user returns
    select: (data) => {
      // Return data as-is for now, grouping can be done in components if needed
      return data;
    },
  });
}

// Batch Health Data Loader
export function useBatchHealthData(userId: string) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ['batch-health-data', userId],
    queryFn: async () => {
      // Batch multiple requests into a single data fetch
      const [assessment, metrics, recommendations, trends] = await Promise.all([
        apiRequest('GET', `/api/health-assessment/${userId}`).then(r => r.json()).catch(() => null),
        apiRequest('GET', `/api/health-metrics/${userId}`).then(r => r.json()).catch(() => null),
        apiRequest('GET', `/api/recommendations/${userId}`).then(r => r.json()).catch(() => null),
        apiRequest('GET', `/api/health-trends/${userId}`).then(r => r.json()).catch(() => null),
      ]);
      
      // Populate individual query caches
      if (assessment) {
        queryClient.setQueryData(['health-assessment', userId], assessment);
      }
      if (metrics) {
        queryClient.setQueryData(['health-metrics', userId], metrics);
      }
      if (recommendations) {
        queryClient.setQueryData(['recommendations', userId], recommendations);
      }
      if (trends) {
        queryClient.setQueryData(['health-trends', userId], trends);
      }
      
      return { assessment, metrics, recommendations, trends };
    },
    enabled: !!userId,
    staleTime: 3 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}

// AI Model Generation with Progress Tracking
// Health AI model generation removed for resource optimization

// Smart Assessment Submission with Optimistic Updates
export function useSubmitAssessmentOptimized() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/health-assessment', data);
      return response.json();
    },
    onMutate: async (newAssessment) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['health-assessment', newAssessment.userId] });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(['health-assessment', newAssessment.userId]);
      
      // Optimistically update cache
      queryClient.setQueryData(['health-assessment', newAssessment.userId], newAssessment);
      
      return { previousData };
    },
    onError: (err, newAssessment, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['health-assessment', newAssessment.userId], context.previousData);
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch related data
      queryClient.invalidateQueries({ queryKey: ['health-metrics', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['recommendations', variables.userId] });
      
      // Prefetch likely next requests
      queryClient.prefetchQuery({
        queryKey: ['health-trends', variables.userId],
        staleTime: 5 * 60 * 1000,
      });
    },
  });
}

// Performance Monitoring Hook
export function useQueryPerformance() {
  const queryClient = useQueryClient();
  
  return {
    getCacheStats: () => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();
      
      return {
        totalQueries: queries.length,
        staleQueries: queries.filter(q => q.isStale()).length,
        loadingQueries: queries.filter(q => q.state.status === 'pending').length,
        errorQueries: queries.filter(q => q.state.status === 'error').length,
        cacheSize: queries.reduce((size, query) => {
          const dataSize = JSON.stringify(query.state.data || {}).length;
          return size + dataSize;
        }, 0),
      };
    },
    clearStaleQueries: () => {
      queryClient.getQueryCache().getAll()
        .filter(query => query.isStale())
        .forEach(query => queryClient.removeQueries({ queryKey: query.queryKey }));
    },
    optimizeCache: () => {
      // Remove queries older than 1 hour
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      queryClient.getQueryCache().getAll()
        .filter(query => {
          const lastUpdated = query.state.dataUpdatedAt;
          return lastUpdated && lastUpdated < oneHourAgo;
        })
        .forEach(query => queryClient.removeQueries({ queryKey: query.queryKey }));
    },
  };
}