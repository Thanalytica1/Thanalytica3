// Updated health metrics hook using new hierarchical structure
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";
import { HealthMetric, InsertHealthMetric } from "@shared/health-schema";

const API_BASE = "/api/health/metrics";

// Fetch health metrics for current user
export function useHealthMetrics(type?: string, limit = 100) {
  const [user] = useState(() => auth.currentUser);
  
  return useQuery({
    queryKey: ["healthMetrics", user?.uid, type, limit],
    queryFn: async (): Promise<HealthMetric[]> => {
      if (!user?.uid) throw new Error("User not authenticated");
      
      const params = new URLSearchParams();
      if (type) params.append("type", type);
      params.append("limit", limit.toString());
      
      const response = await fetch(`${API_BASE}/${user.uid}?${params}`);
      if (!response.ok) throw new Error("Failed to fetch health metrics");
      
      return response.json();
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
      
      const response = await fetch(`${API_BASE}/${user.uid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error("Failed to create health metric");
      return response.json();
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
      
      const params = new URLSearchParams();
      params.append("period", period);
      if (type) params.append("type", type);
      
      const response = await fetch(`${API_BASE}/analytics/${user.uid}?${params}`);
      if (!response.ok) throw new Error("Failed to fetch health analytics");
      
      return response.json();
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
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);
      
      const params = new URLSearchParams({
        type,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: "1000",
      });
      
      const response = await fetch(`${API_BASE}/${user.uid}?${params}`);
      if (!response.ok) throw new Error("Failed to fetch metrics");
      
      return response.json();
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
      
      const response = await fetch(`${API_BASE}/${user.uid}/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics }),
      });
      
      if (!response.ok) throw new Error("Failed to create metrics");
      return response.json();
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
        const response = await fetch(`${API_BASE}/${user.uid}?limit=50`);
        if (response.ok) {
          const latestMetrics = await response.json();
          
          // Group by type
          const grouped = latestMetrics.reduce((acc: Record<string, HealthMetric[]>, metric: HealthMetric) => {
            if (!acc[metric.type]) acc[metric.type] = [];
            acc[metric.type].push(metric);
            return acc;
          }, {});
          
          setMetrics(grouped);
        }
      } catch (error) {
        console.error("Error fetching realtime metrics:", error);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user?.uid]);
  
  return metrics;
}