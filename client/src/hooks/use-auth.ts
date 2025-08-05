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
  
  const { data: dbUser, isLoading: userLoading, refetch: refetchUser } = useUser(firebaseUser?.uid || "");
  const createUser = useCreateUser();

  useEffect(() => {
    isMounted.current = true;
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted.current) return;
      
      setFirebaseUser(user);
      
      if (user) {
        // Use a more robust approach to ensure user exists in database
        const handleUserCreation = async () => {
          try {
            // Small delay to prevent race conditions
            await new Promise(resolve => setTimeout(resolve, 100));
            
            if (!isMounted.current) return;
            
            // Wrap refetchUser in a try-catch to handle abort errors specifically
            let userResponse;
            try {
              userResponse = await refetchUser();
            } catch (refetchError) {
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
            
            if (!isMounted.current) return;
            
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
