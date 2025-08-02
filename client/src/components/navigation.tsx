import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { signInWithGoogle, signOutUser } from "@/lib/firebase";

export function Navigation() {
  const [location] = useLocation();
  const { user, loading } = useAuth();

  const handleSignIn = () => {
    signInWithGoogle();
  };

  const handleSignOut = () => {
    signOutUser();
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <Heart className="text-medical-green h-8 w-8 mr-3" />
              <span className="text-xl font-bold text-professional-slate">Thanalytica</span>
            </Link>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button 
                  variant={location === "/dashboard" ? "default" : "ghost"}
                  className="text-professional-slate hover:text-medical-green"
                >
                  Dashboard
                </Button>
              </Link>
              <Link href="/assessment">
                <Button 
                  variant={location === "/assessment" ? "default" : "ghost"}
                  className="text-professional-slate hover:text-medical-green"
                >
                  Assessment
                </Button>
              </Link>
            </div>
          )}
          
          <div className="flex items-center">
            {loading ? (
              <div className="w-8 h-8 animate-pulse bg-gray-200 rounded-full" />
            ) : user ? (
              <div className="flex items-center space-x-3">
                <img 
                  src={user.photoURL || undefined} 
                  alt={user.displayName || "User"}
                  className="w-8 h-8 rounded-full"
                />
                <Button 
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleSignIn}
                className="bg-medical-green text-white hover:bg-medical-green/90"
              >
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
