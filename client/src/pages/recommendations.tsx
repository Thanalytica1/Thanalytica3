import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Dumbbell, Leaf, Moon, Clock, Thermometer, Utensils } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRecommendations } from "@/hooks/use-health-data";
// Analytics removed for resource optimization

export default function Recommendations() {
  const { firebaseUser, user } = useAuth();
  const { data: recommendations, isLoading } = useRecommendations(user?.id || "");
  // Analytics tracking removed for resource optimization

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-professional-slate mb-4">Please Sign In</h2>
        <p className="text-gray-600">You need to be signed in to view your recommendations.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Mock recommendations for demo purposes since we don't have real data yet
  const mockRecommendations = [
    {
      id: "1",
      category: "stress",
      priority: "high",
      title: "Stress Management Enhancement",
      description: "Your stress levels show room for improvement. Implementing targeted stress reduction can add 3-5 years to your longevity projection.",
      actionItems: [
        "Practice 10 minutes of daily meditation",
        "Implement breathing exercises during work breaks",
        "Consider mindfulness-based stress reduction training"
      ],
      estimatedImpact: 4.2,
      icon: Brain,
      iconColor: "#FF6B6B",
      borderColor: "border-l-gentle-coral"
    },
    {
      id: "2",
      category: "exercise",
      priority: "medium",
      title: "Strength Training Integration",
      description: "Adding 2 weekly strength sessions could significantly improve your muscle mass retention trajectory for later decades.",
      actionItems: [
        "Add 20-minute strength sessions twice weekly",
        "Focus on compound movements (squats, deadlifts, pulls)",
        "Progressive overload with proper form"
      ],
      estimatedImpact: 2.8,
      icon: Dumbbell,
      iconColor: "#FFD700",
      borderColor: "border-l-vitality-gold"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-professional-slate mb-4">Personalized Health Optimization</h2>
        <p className="text-lg text-gray-600">Science-backed recommendations tailored to your longevity goals</p>
      </div>

      {/* Priority Recommendations */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-professional-slate mb-6">Priority Actions</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {mockRecommendations.map((rec) => (
            <Card 
              key={rec.id} 
              className={`bg-white shadow-md border-l-4 ${rec.borderColor} border border-gray-100 cursor-pointer hover:opacity-80 transition-opacity`}
              onClick={() => {
                // Recommendation tracking removed for resource optimization
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 mt-1"
                    style={{ backgroundColor: `${rec.iconColor}10` }}
                  >
                    <rec.icon style={{ color: rec.iconColor }} className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-professional-slate mb-2">{rec.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                    <div className="flex items-center text-xs" style={{ color: rec.iconColor }}>
                      <Clock className="w-3 h-3 mr-1" />
                      <span>Est. impact: +{rec.estimatedImpact} years</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Detailed Recommendations by Category */}
      <div className="space-y-8">
        {/* Exercise Optimization */}
        <Card className="bg-white shadow-md border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-medical-green bg-opacity-10 rounded-lg flex items-center justify-center mr-3">
                <Dumbbell className="text-medical-green h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-professional-slate">Exercise Optimization</h3>
              <Badge className="ml-auto bg-green-100 text-green-800">Good Foundation</Badge>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">Current: Cardio Focus</div>
                <div className="text-xs text-gray-500">4x/week cardio sessions</div>
              </div>
              <div className="p-4 bg-medical-green bg-opacity-5 rounded-lg border border-medical-green">
                <div className="text-sm font-medium text-medical-green mb-1">Recommended: Hybrid Training</div>
                <div className="text-xs text-medical-green">3x cardio + 2x strength</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">Target: Zone 2 + HIIT</div>
                <div className="text-xs text-gray-500">Optimal longevity protocol</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span>Add 20-minute strength sessions twice weekly</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span>Incorporate Zone 2 cardio (80% of training volume)</span>
              </div>
              <div className="flex items-center text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span>Weekly VO2 max intervals for cardiovascular health</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nutrition Enhancement */}
        <Card className="bg-white shadow-md border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-trust-blue bg-opacity-10 rounded-lg flex items-center justify-center mr-3">
                <Leaf className="text-trust-blue h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-professional-slate">Nutrition Enhancement</h3>
              <Badge className="ml-auto bg-blue-100 text-blue-800">Optimization Ready</Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Longevity Nutrients</h4>
                <div className="space-y-2">
                  {[
                    { name: "Omega-3 EPA/DHA", status: "Increase", color: "bg-yellow-100 text-yellow-800" },
                    { name: "Polyphenols", status: "Good", color: "bg-green-100 text-green-800" },
                    { name: "Fiber Intake", status: "Boost", color: "bg-yellow-100 text-yellow-800" },
                  ].map((nutrient) => (
                    <div key={nutrient.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">{nutrient.name}</span>
                      <Badge className={`text-xs px-2 py-1 rounded ${nutrient.color}`}>{nutrient.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Metabolic Optimization</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Clock className="text-trust-blue mr-2 h-4 w-4" />
                    <span>Consider 16:8 intermittent fasting</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Thermometer className="text-trust-blue mr-2 h-4 w-4" />
                    <span>Add cold exposure therapy</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Utensils className="text-trust-blue mr-2 h-4 w-4" />
                    <span>Time-restricted eating window</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sleep & Recovery */}
        <Card className="bg-white shadow-md border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-vitality-gold bg-opacity-10 rounded-lg flex items-center justify-center mr-3">
                <Moon className="text-vitality-gold h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-professional-slate">Sleep & Recovery</h3>
              <Badge className="ml-auto bg-green-100 text-green-800">Strong Performance</Badge>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <div className="text-sm font-medium text-green-800">Excellent sleep foundation detected</div>
                  <div className="text-xs text-green-600 mt-1">Your 7.5-hour average with good quality positions you well for longevity. Minor optimizations can enhance recovery further.</div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              <strong>Fine-tuning recommendations:</strong> Consider blackout curtains, temperature regulation (65-68°F), and a consistent wind-down routine to maximize deep sleep phases.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Plan */}
      <div className="mt-8">
        <Card className="bg-gradient-to-r from-medical-green to-trust-blue text-white">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">30-Day Action Plan</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <div className="font-medium mb-2">Week 1-2</div>
                <div className="text-sm opacity-90">
                  <div>• Add 2 strength sessions</div>
                  <div>• Begin stress tracking</div>
                  <div>• Optimize sleep environment</div>
                </div>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <div className="font-medium mb-2">Week 3-4</div>
                <div className="text-sm opacity-90">
                  <div>• Implement Zone 2 training</div>
                  <div>• Start intermittent fasting</div>
                  <div>• Add meditation practice</div>
                </div>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg p-4">
                <div className="font-medium mb-2">Ongoing</div>
                <div className="text-sm opacity-90">
                  <div>• Weekly progress tracking</div>
                  <div>• Monthly re-assessment</div>
                  <div>• Continuous optimization</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
