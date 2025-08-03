import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { firebaseUser, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      setLocation("/login");
    }
  }, [firebaseUser, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-green"></div>
      </div>
    );
  }

  if (!firebaseUser) {
    return null;
  }

  return <>{children}</>;
}