// Updated health metrics hook using Firestore
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";
import { HealthMetric, InsertHealthMetric } from "@shared/health-schema";
import { FirestoreMetricsService } from "@/services/firestore-metrics";

// Fetch health metrics for current user
export function useHealthMetrics(type?: string, limit = 100) {
  const [user] = useState(() => auth.currentUser);
  
  return useQuery({
    queryKey: ["healthMetrics", user?.uid, type, limit],
    queryFn: async (): Promise<HealthMetric[]> => {
      if (!user?.uid) throw new Error("User not authenticated");
      
      return await FirestoreMetricsService.getHealthMetrics(user.uid, type, limit);
    },
    enabled: !!user?.uid,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create new health metric
export function useCreateHealthMetric() {
  const queryClient = useQueryClient();
  const [user] = useState(() => auth.currentUser);
  
  return useMutation({
    mutationFn: async (data: InsertHealthMetric): Promise<HealthMetric> => {
      if (!user?.uid) throw new Error("User not authenticated");
      
      return await FirestoreMetricsService.createHealthMetric(user.uid, data);
    },
    onSuccess: (newMetric) => {
      // Invalidate and refetch metrics
      queryClient.invalidateQueries({ queryKey: ["healthMetrics", user?.uid] });
      
      // Optimistically update cache
      queryClient.setQueryData(
        ["healthMetrics", user?.uid, newMetric.type],
        (oldData: HealthMetric[] | undefined) => {
          if (!oldData) return [newMetric];
          return [newMetric, ...oldData];
        }
      );
    },
  });
}

// Get health analytics/trends
export function useHealthAnalytics(period = "30d", type?: string) {
  const [user] = useState(() => auth.currentUser);
  
  return useQuery({
    queryKey: ["healthAnalytics", user?.uid, period, type],
    queryFn: async () => {
      if (!user?.uid) throw new Error("User not authenticated");
      
      return await FirestoreMetricsService.getHealthAnalytics(user.uid, period, type);
    },
    enabled: !!user?.uid,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for specific metric types with optimized caching
export function useMetricsByType(type: string, days = 30) {
  const [user] = useState(() => auth.currentUser);
  
  return useQuery({
    queryKey: ["healthMetrics", user?.uid, type, days],
    queryFn: async (): Promise<HealthMetric[]> => {
      if (!user?.uid) throw new Error("User not authenticated");
      
      return await FirestoreMetricsService.getMetricsByType(user.uid, type, days);
    },
    enabled: !!user?.uid && !!type,
    staleTime: 5 * 60 * 1000,
  });
}

// Bulk create metrics (for wearable data sync)
export function useBulkCreateMetrics() {
  const queryClient = useQueryClient();
  const [user] = useState(() => auth.currentUser);
  
  return useMutation({
    mutationFn: async (metrics: InsertHealthMetric[]): Promise<HealthMetric[]> => {
      if (!user?.uid) throw new Error("User not authenticated");
      
      return await FirestoreMetricsService.bulkCreateMetrics(user.uid, metrics);
    },
    onSuccess: () => {
      // Invalidate all health metrics queries
      queryClient.invalidateQueries({ queryKey: ["healthMetrics", user?.uid] });
      queryClient.invalidateQueries({ queryKey: ["healthAnalytics", user?.uid] });
    },
  });
}

// Real-time metrics for dashboard
export function useRealtimeMetrics() {
  const [user] = useState(() => auth.currentUser);
  const [metrics, setMetrics] = useState<Record<string, HealthMetric[]>>({});
  
  useEffect(() => {
    if (!user?.uid) return;
    
    // This would connect to Firestore real-time listeners in production
    // For now, we'll poll every 30 seconds for demo purposes
    const interval = setInterval(async () => {
      try {
        const latestMetrics = await FirestoreMetricsService.getRealtimeMetrics(user.uid);
        setMetrics(latestMetrics);
      } catch (error) {
        console.error("Error fetching realtime metrics:", error);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user?.uid]);
  
  return metrics;
}