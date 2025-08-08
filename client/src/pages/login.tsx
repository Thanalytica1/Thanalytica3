import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface FirebaseAuthError {
  code: string;
  message: string;
}

export default function Login() {
  const [location, setLocation] = useLocation();
  const { firebaseUser, loading: authLoading, isNewUser } = useAuth();
  const { toast } = useToast();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [justSignedUp, setJustSignedUp] = useState(false);

  // Redirect based on authentication state
  useEffect(() => {
    if (firebaseUser && !authLoading) {
      // If user just signed up or is a new user (from Google sign-in), redirect to assessment
      if (justSignedUp || isNewUser) {
        setLocation("/assessment");
      } else {
        // Otherwise, redirect to dashboard
        setLocation("/dashboard");
      }
    }
  }, [firebaseUser, authLoading, setLocation, justSignedUp, isNewUser]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrors([]);
      await signInWithGoogle();
      // Redirect will happen automatically via useEffect when firebaseUser updates
    } catch (error: unknown) {
      const firebaseError = error as FirebaseAuthError;
      console.error("Google sign-in error:", firebaseError);
      const errorMessage = firebaseError.code === "auth/unauthorized-domain" 
        ? "Please add your current domain to Firebase authorized domains in the console."
        : firebaseError.message || "Failed to sign in with Google";
      setErrors([errorMessage]);
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      // Validation
      const newErrors: string[] = [];
      if (!formData.email) newErrors.push("Email is required");
      if (!formData.password) newErrors.push("Password is required");
      if (isSignUp && formData.password !== formData.confirmPassword) {
        newErrors.push("Passwords do not match");
      }
      if (isSignUp && formData.password.length < 6) {
        newErrors.push("Password must be at least 6 characters");
      }

      if (newErrors.length > 0) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      if (isSignUp) {
        await signUpWithEmail(formData.email, formData.password);
        setJustSignedUp(true); // Mark that user just signed up
        toast({
          title: "Account Created",
          description: "Welcome to Thanalytica! Let's start with your health assessment.",
        });
      } else {
        await signInWithEmail(formData.email, formData.password);
        setJustSignedUp(false); // Ensure login goes to dashboard
        toast({
          title: "Welcome Back",
          description: "Successfully signed in to your account.",
        });
      }
      
      // Redirect will happen automatically via useEffect
    } catch (error: unknown) {
      const firebaseError = error as FirebaseAuthError;
      console.error("Email auth error:", firebaseError);
      let errorMessage = "Authentication failed";
      
      switch (firebaseError.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email address";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password";
          break;
        case "auth/email-already-in-use":
          errorMessage = "An account with this email already exists";
          break;
        case "auth/weak-password":
          errorMessage = "Password is too weak";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        default:
          errorMessage = (error as any)?.message || "Authentication failed";
      }
      
      setErrors([errorMessage]);
      toast({
        title: isSignUp ? "Sign Up Failed" : "Sign In Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-medical-green" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-clinical-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center">
            <Heart className="text-medical-green h-10 w-10 mr-3" />
            <span className="text-2xl font-bold text-professional-slate">Thanalytica</span>
          </Link>
          <p className="text-gray-600 mt-2">Your journey to 150 years starts here</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-professional-slate">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-center">
              {isSignUp 
                ? "Join thousands optimizing for longevity" 
                : "Sign in to continue your health journey"
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error Messages */}
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Google Sign In */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              variant="outline"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with email</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-medical-green hover:bg-medical-green/90"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <div className="text-center text-sm text-gray-600">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-medical-green hover:text-medical-green/80 font-medium"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </div>

            <div className="text-center">
              <Link href="/" className="text-sm text-gray-600 hover:text-medical-green">
                ← Back to home
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}