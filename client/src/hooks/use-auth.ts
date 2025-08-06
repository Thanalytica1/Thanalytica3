import { useState, useEffect, useRef } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { auth, handleAuthRedirect } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useUser, useCreateUser } from "./use-user";
import type { User } from "@shared/schema";

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const isMounted = useRef(true);
  const currentOperation = useRef<string | null>(null);

  // Optimized user query with proper configuration
  const { data: dbUser, isLoading: userLoading, refetch: refetchUser } = useUser(
    firebaseUser?.uid || "", 
    {
      enabled: !!firebaseUser?.uid,
      staleTime: 5 * 60 * 1000, // 5 minutes - prevents refetching fresh data
      retry: 1,
      refetchOnWindowFocus: false, // Stop refetching when user switches tabs
      refetchOnReconnect: false, // Stop refetching on network reconnect
    }
  );

  const createUser = useCreateUser();

  useEffect(() => {
    isMounted.current = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted.current) return;

      const operationId = `auth-${Date.now()}`;
      currentOperation.current = operationId;

      setFirebaseUser(user);

      if (user) {
        // Simplified user creation logic
        const handleUserCreation = async () => {
          try {
            // Check if operation is still current
            if (!isMounted.current || currentOperation.current !== operationId) {
              return;
            }

            // Try to get existing user first
            let userResponse;
            try {
              userResponse = await refetchUser();
            } catch (refetchError) {
              // Check if operation is still current
              if (!isMounted.current || currentOperation.current !== operationId) {
                return;
              }

              // Log warning and continue to user creation
              console.warn('User fetch failed, attempting to create user:', refetchError);
              userResponse = { data: null };
            }

            // Check if operation is still current
            if (!isMounted.current || currentOperation.current !== operationId) {
              return;
            }

            // Create user if none exists and we're not already creating one
            if (!userResponse?.data && !createUser.isPending) {
              setIsNewUser(true);
              createUser.mutate({
                firebaseUid: user.uid,
                email: user.email!,
                displayName: user.displayName,
                photoURL: user.photoURL,
              });
            }
          } catch (error) {
            // Check if operation is still current before logging
            if (isMounted.current && currentOperation.current === operationId) {
              console.error("Auth error:", error);
            }
          }
        };

        // Execute the user creation handler
        handleUserCreation();
      }

      // Set loading to false only if this is still the current operation
      if (isMounted.current && currentOperation.current === operationId) {
        setLoading(false);
      }
    });

    // Handle redirect result on page load
    handleAuthRedirect()
      .then((result) => {
        if (isMounted.current && result?.user) {
          setFirebaseUser(result.user);
        }
      })
      .catch((error) => {
        if (isMounted.current) {
          console.error("Auth redirect error:", error);
        }
      })
      .finally(() => {
        if (isMounted.current) {
          setLoading(false);
        }
      });

    // Cleanup function
    return () => {
      isMounted.current = false;
      currentOperation.current = null;
      unsubscribe();
    };
  }, [refetchUser, createUser]);

  const isLoading = loading || userLoading || createUser.isPending;

  return { 
    firebaseUser, 
    user: dbUser as User | undefined, 
    loading: isLoading,
    isNewUser 
  };
}

// REMOVE the duplicate useUser call that was at the bottom of your file