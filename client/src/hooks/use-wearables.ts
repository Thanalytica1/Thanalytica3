import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { WearableConnection, WearableData, InsertWearableConnection } from "@shared/schema";

// Configuration constants
const WEARABLE_REFETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const WEARABLE_STALE_TIME = 3 * 60 * 1000; // 3 minutes
const WEARABLE_GC_TIME = 15 * 60 * 1000; // 15 minutes

export function useWearableConnections(
  userId: string,
  options?: Omit<UseQueryOptions<WearableConnection[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<WearableConnection[]>({
    queryKey: ["/api/wearable-connections", userId],
    queryFn: async ({ signal }) => {
      const response = await apiRequest("GET", `/api/wearable-connections/${userId}`, undefined, signal);
      return response.json();
    },
    enabled: !!userId,
    retry: 2,
    staleTime: WEARABLE_STALE_TIME,
    ...options,
  });
}

export function useWearableData(
  userId: string, 
  dataType?: string,
  options?: Omit<UseQueryOptions<WearableData[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<WearableData[]>({
    queryKey: ["/api/wearable-data", userId, dataType],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ userId });
      if (dataType) params.append('dataType', dataType);

      const response = await apiRequest("GET", `/api/wearable-data?${params}`, undefined, signal);
      return response.json();
    },
    enabled: !!userId,
    refetchInterval: WEARABLE_REFETCH_INTERVAL,
    staleTime: WEARABLE_STALE_TIME,
    gcTime: WEARABLE_GC_TIME,
    refetchOnWindowFocus: false,
    retry: 1, // Wearable APIs can be flaky, but don't retry too much
    ...options,
  });
}

export function useCreateWearableConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertWearableConnection) => {
      const response = await apiRequest("POST", "/api/wearable-connections", data);
      return response.json();
    },
    onMutate: async (newConnection) => {
      // Optimistic update for better UX
      await queryClient.cancelQueries({ queryKey: ["/api/wearable-connections", newConnection.userId] });

      const previousConnections = queryClient.getQueryData(["/api/wearable-connections", newConnection.userId]);

      queryClient.setQueryData(["/api/wearable-connections", newConnection.userId], (old: WearableConnection[] = []) => [
        ...old,
        { ...newConnection, id: `temp-${Date.now()}`, createdAt: new Date() } as WearableConnection
      ]);

      return { previousConnections };
    },
    onError: (err, newConnection, context) => {
      // Rollback on error
      if (context?.previousConnections) {
        queryClient.setQueryData(["/api/wearable-connections", newConnection.userId], context.previousConnections);
      }
    },
    onSuccess: (data, variables) => {
      // More targeted invalidation
      queryClient.invalidateQueries({ 
        queryKey: ["/api/wearable-connections", variables.userId] 
      });
    },
  });
}

export function useDeleteWearableConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      await apiRequest("DELETE", `/api/wearable-connections/${id}`);
      return { id, userId };
    },
    onMutate: async ({ id, userId }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/wearable-connections", userId] });

      const previousConnections = queryClient.getQueryData(["/api/wearable-connections", userId]);

      queryClient.setQueryData(["/api/wearable-connections", userId], (old: WearableConnection[] = []) =>
        old.filter(connection => connection.id !== id)
      );

      return { previousConnections };
    },
    onError: (err, variables, context) => {
      if (context?.previousConnections) {
        queryClient.setQueryData(["/api/wearable-connections", variables.userId], context.previousConnections);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/wearable-connections", data.userId] 
      });
    },
  });
}

// Improved OAuth helper with better security
export function getOuraAuthUrl(userId: string): string {
  const clientId = import.meta.env.VITE_OURA_CLIENT_ID;

  if (!clientId) {
    console.warn('Oura client ID not configured');
    return '/wearables?demo=oura';
  }

  const baseUrl = window.location.origin;
  const redirectUri = `${baseUrl}/api/auth/oura/callback`;

  // Generate a cryptographically secure state parameter
  const state = btoa(JSON.stringify({ 
    userId, 
    timestamp: Date.now(),
    nonce: crypto.randomUUID() 
  }));

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: 'daily heartrate workout session',
    redirect_uri: redirectUri,
    state,
  });

  return `https://cloud.ouraring.com/oauth/authorize?${params.toString()}`;
}

export function initiateAppleHealthConnect(): Promise<boolean> {
  return new Promise((resolve) => {
    // Better UX than alert()
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      // Attempt to open iOS app if available
      window.location.href = 'thanalytica://health-connect';
      setTimeout(() => {
        // Fallback to App Store if app not installed
        window.location.href = 'https://apps.apple.com/app/thanalytica';
      }, 1000);
    } else {
      // Web implementation coming soon
      resolve(false);
    }
  });
}