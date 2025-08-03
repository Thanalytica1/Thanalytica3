import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, TrendingUp, Target, Play, Sliders } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

export default function Home() {
  const { firebaseUser, loading } = useAuth();
  const [location, setLocation] = useLocation();
  
  const handleSignIn = () => {
    setLocation("/login");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-professional-slate mb-6">
            Your Journey to <span className="text-medical-green">150 Years</span> Starts Here
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            AI-powered health forecasting platform that evaluates your longevity trajectory and provides personalized optimization strategies for extended vitality.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {firebaseUser ? (
              <Link href="/assessment">
                <Button className="bg-medical-green text-white px-8 py-4 text-lg font-semibold hover:bg-medical-green/90 shadow-lg">
                  <Play className="w-5 h-5 mr-3" />
                  Start Health Assessment
                </Button>
              </Link>
            ) : (
              <Button 
                onClick={handleSignIn}
                disabled={loading}
                className="bg-medical-green text-white px-8 py-4 text-lg font-semibold hover:bg-medical-green/90 shadow-lg disabled:opacity-50"
              >
                <Play className="w-5 h-5 mr-3" />
                {loading ? "Signing In..." : "Sign In to Start Assessment"}
              </Button>
            )}
            <Link href="/simulator">
              <Button variant="outline" className="border-2 border-trust-blue text-trust-blue px-8 py-4 text-lg font-semibold hover:bg-trust-blue hover:text-white">
                <TrendingUp className="w-5 h-5 mr-3" />
                Try Health Simulator
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-16">
        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-medical-green bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
              <Brain className="text-medical-green text-xl" />
            </div>
            <h3 className="text-xl font-semibold mb-3">AI Health Analysis</h3>
            <p className="text-gray-600">
              Advanced algorithms assess your aging patterns and predict optimal longevity trajectories based on cutting-edge research.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-trust-blue bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="text-trust-blue text-xl" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Vitality Tracking</h3>
            <p className="text-gray-600">
              Real-time monitoring of biological age, health markers, and lifestyle factors that impact your journey to 150.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-vitality-gold bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
              <Target className="text-vitality-gold text-xl" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Personalized Optimization</h3>
            <p className="text-gray-600">
              Custom recommendations for diet, exercise, sleep, and lifestyle modifications to maximize your longevity potential.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-100">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-gentle-coral bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
              <Sliders className="text-gentle-coral text-xl" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Health Decision Simulator</h3>
            <p className="text-gray-600">
              Interactive tool to explore how lifestyle changes affect your longevity trajectory in real-time with instant feedback.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
