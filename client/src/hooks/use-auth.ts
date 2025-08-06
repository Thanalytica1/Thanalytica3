import { useState, useEffect, useRef } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { auth, handleAuthRedirect } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useUser, useCreateUser } from "./use-user";
import type { User } from "@shared/schema";

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  const abortController = useRef<AbortController | null>(null);

  // REPLACE the old useUser call with this optimized version
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

      // Cancel any pending operations
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      setFirebaseUser(user);

      if (user) {
        const handleUserCreation = async () => {
          try {
            // Small delay to prevent race conditions
            await new Promise(resolve => setTimeout(resolve, 100));

            if (!isMounted.current || abortController.current?.signal.aborted) return;

            // Pass abort signal to refetch if your query library supports it
            let userResponse;
            try {
              userResponse = await refetchUser();
            } catch (refetchError) {
              // Check if component is unmounted or operation was cancelled
              if (!isMounted.current || abortController.current?.signal.aborted) {
                return;
              }

              // If it's an abort error, silently return - this is normal
              if (refetchError instanceof Error && 
                  (refetchError.name === 'AbortError' || 
                   refetchError.message.includes('aborted') ||
                   refetchError.message.includes('signal is aborted'))) {
                return;
              }
              // For other errors, don't throw - just continue to user creation
              console.warn('User fetch failed, attempting to create user:', refetchError.message);
              userResponse = { data: null };
            }

            if (!isMounted.current || abortController.current?.signal.aborted) return;

            // Only create user if we don't have one and we're not already creating
            if (!userResponse?.data && !createUser.isPending) {
              try {
                createUser.mutate({
                  firebaseUid: user.uid,
                  email: user.email!,
                  displayName: user.displayName,
                  photoURL: user.photoURL,
                });
              } catch (mutateError) {
                if (!isMounted.current || abortController.current?.signal.aborted) {
                  return;
                }

                // Handle abort errors silently for mutations too
                if (mutateError instanceof Error && 
                    (mutateError.name === 'AbortError' || 
                     mutateError.message.includes('aborted') ||
                     mutateError.message.includes('signal is aborted'))) {
                  return;
                }
                console.error('User creation failed:', mutateError);
              }
            }
          } catch (error) {
            if (!isMounted.current || abortController.current?.signal.aborted) {
              return;
            }

            // Silently ignore abort-related errors
            if (error instanceof Error && 
                (error.name === 'AbortError' || 
                 error.message.includes('aborted') ||
                 error.message.includes('signal is aborted'))) {
              return;
            }
            console.error("Auth error:", error);
          }
        };

        // Execute the user creation handler
        handleUserCreation();
      }

      if (isMounted.current) {
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
      if (abortController.current) {
        abortController.current.abort();
      }
      unsubscribe();
    };
  }, [refetchUser, createUser]);

  const isLoading = loading || userLoading || createUser.isPending;

  return { 
    firebaseUser, 
    user: dbUser as User | undefined, 
    loading: isLoading 
  };
}

// REMOVE the duplicate useUser call that was at the bottom of your file