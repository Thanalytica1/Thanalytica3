import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import type { User, InsertUser } from "@shared/schema";
import { FirestoreUsersService } from "@/services/firestore-users";

export function useUser(
  firebaseUid: string, 
  options?: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'>
) {
  return useQuery<User>({
    queryKey: ["user", firebaseUid],
    queryFn: async () => {
      return await FirestoreUsersService.getUser(firebaseUid);
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
      return await FirestoreUsersService.createUser(userData);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["user", data.firebaseUid], data);
    },
  });
}




