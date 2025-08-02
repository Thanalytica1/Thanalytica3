import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { auth, handleAuthRedirect } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Handle redirect result on page load
    handleAuthRedirect().then((result) => {
      if (result?.user) {
        setUser(result.user);
      }
    }).catch((error) => {
      console.error("Auth redirect error:", error);
    }).finally(() => {
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}
