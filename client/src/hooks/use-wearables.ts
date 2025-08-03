import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { WearableConnection, WearableData, InsertWearableConnection } from "@shared/schema";

export function useWearableConnections(userId: string) {
  return useQuery<WearableConnection[]>({
    queryKey: ["/api/wearable-connections", userId],
    enabled: !!userId,
  });
}

export function useWearableData(userId: string, dataType?: string) {
  return useQuery<WearableData[]>({
    queryKey: ["/api/wearable-data", userId, dataType],
    enabled: !!userId,
  });
}

export function useCreateWearableConnection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: InsertWearableConnection) => {
      const response = await apiRequest("POST", "/api/wearable-connections", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wearable-connections"] });
    },
  });
}

export function useDeleteWearableConnection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/wearable-connections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wearable-connections"] });
    },
  });
}

// Helper functions for device authorization
export function getOuraAuthUrl(userId: string): string {
  const clientId = import.meta.env.VITE_OURA_CLIENT_ID;
  
  // If no client ID is available, return a demo message
  if (!clientId) {
    return '/wearables?demo=oura';
  }
  
  const baseUrl = window.location.origin;
  const redirectUri = `${baseUrl}/api/auth/oura/callback`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: 'daily heartrate workout session',
    redirect_uri: redirectUri,
    state: userId, // Pass userId to identify user in callback
  });
  
  return `https://cloud.ouraring.com/oauth/authorize?${params.toString()}`;
}

export function initiateAppleHealthConnect(): Promise<boolean> {
  // For Apple Health, we would typically use HealthKit in a mobile app
  // In a web context, this would redirect to a companion mobile app
  // or use Apple's Health Records API for web
  return new Promise((resolve) => {
    // Placeholder implementation - would need actual Apple Health Web API
    alert('Apple Health integration requires the iOS app. Coming soon!');
    resolve(false);
  });
}