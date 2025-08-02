import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, InsertUser } from "@shared/schema";

export function useUser(firebaseUid: string) {
  return useQuery<User>({
    queryKey: ["/api/user", firebaseUid],
    enabled: !!firebaseUid,
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