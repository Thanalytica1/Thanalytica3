import { useState, useEffect } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { auth, handleAuthRedirect } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useUser, useCreateUser } from "./use-user";
import type { User } from "@shared/schema";

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { data: dbUser, isLoading: userLoading, refetch: refetchUser } = useUser(firebaseUser?.uid || "");
  const createUser = useCreateUser();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        // Ensure user exists in our database
        setTimeout(async () => {
          const userResponse = await refetchUser();
          
          if (!userResponse.data && !createUser.isPending) {
            // Create user in our database
            createUser.mutate({
              firebaseUid: user.uid,
              email: user.email!,
              displayName: user.displayName,
              photoURL: user.photoURL,
            });
          }
        }, 100);
      }
      
      setLoading(false);
    });

    // Handle redirect result on page load
    handleAuthRedirect().then((result) => {
      if (result?.user) {
        setFirebaseUser(result.user);
      }
    }).catch((error) => {
      console.error("Auth redirect error:", error);
    }).finally(() => {
      setLoading(false);
    });

    return () => unsubscribe();
  }, [refetchUser, createUser]);

  const isLoading = loading || userLoading || createUser.isPending;
  
  return { 
    firebaseUser, 
    user: dbUser as User | undefined, 
    loading: isLoading 
  };
}
