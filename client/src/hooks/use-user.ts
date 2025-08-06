import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, InsertUser } from "@shared/schema";

export function useUser(
  firebaseUid: string, 
  options?: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'>
) {
  return useQuery<User>({
    queryKey: ["/api/user", firebaseUid],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/user/${firebaseUid}`);
      return response.json();
    },
    enabled: !!firebaseUid,
    // Merge any additional options, with user options taking precedence
    ...options,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: InsertUser) => {
      const response = await apiRequest("POST", "/api/user", userData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user", data.firebaseUid], data);
    },
  });
}




