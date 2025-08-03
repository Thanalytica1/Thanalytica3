import { Card, CardContent } from "@/components/ui/card";
import { HealthMetricsCard } from "@/components/health-metrics-card";
import { Progress } from "@/components/ui/progress";
import { DashboardLoadingSkeleton, HealthMetricsCardSkeleton } from "@/components/health-metrics-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Watch, 
  Zap, 
  Shield, 
  Calendar,
  Moon,
  Activity,
  Apple,
  Brain,
  Heart
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useHealthAssessment, useHealthMetrics } from "@/hooks/use-health-data";
// Analytics removed for resource optimization

export default function Dashboard() {
  const { firebaseUser, user } = useAuth();
  const { data: assessment, isLoading: assessmentLoading } = useHealthAssessment(user?.id || "");
  const { data: metrics, isLoading: metricsLoading } = useHealthMetrics(user?.id || "");
  
  // Page tracking removed for resource optimization

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-professional-slate mb-4">Please Sign In</h2>
        <p className="text-gray-600">You need to be signed in to view your dashboard.</p>
      </div>
    );
  }

  if (assessmentLoading || metricsLoading) {
    return <DashboardLoadingSkeleton />;
  }

  if (!assessment) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-professional-slate mb-4">No Assessment Found</h2>
        <p className="text-gray-600">Please complete your health assessment first.</p>
      </div>
    );
  }

  const trajectoryRating = assessment.trajectoryRating || "OPTIMAL";
  const biologicalAge = assessment.biologicalAge || 28.5;
  const vitalityScore = assessment.vitalityScore || 87;
  const projectedLifespan = metrics?.projectedLifespan || 150;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-medical-green to-trust-blue rounded-xl p-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-3xl font-bold mb-2">Your Health Trajectory</h2>
              <p className="text-lg opacity-90">Based on comprehensive AI analysis</p>
            </div>
            <div className="mt-4 md:mt-0 text-right">
              <div className="text-4xl font-bold">{trajectoryRating}</div>
              <div className="text-sm opacity-75">Trajectory Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Health Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metricsLoading ? (
          <>
            <HealthMetricsCardSkeleton />
            <HealthMetricsCardSkeleton />
            <HealthMetricsCardSkeleton />
            <HealthMetricsCardSkeleton />
          </>
        ) : (
          <>
            <HealthMetricsCard
              title="Biological Age"
              value={`${biologicalAge}`}
              subtitle="Biological Age"
              change="6.5 years younger"
              changeDirection="down"
              status="excellent"
              icon={Watch}
              iconColor="#2E8B57"
            />

            <HealthMetricsCard
              title="Vitality Score"
              value={`${vitalityScore}/100`}
              subtitle="Vitality Score"
              change="+5 from last month"
              changeDirection="up"
              status="good"
              icon={Zap}
              iconColor="#FFD700"
            />

            <HealthMetricsCard
              title="Risk Assessment"
              value="Low"
              subtitle="Risk Assessment"
              change="2 protective factors"
              changeDirection="neutral"
              status="excellent"
              icon={Shield}
              iconColor="#4682B4"
            />

            <HealthMetricsCard
              title="Projected Lifespan"
              value={`${projectedLifespan}`}
              subtitle="Projected Lifespan"
              change="On track"
              changeDirection="up"
              status="excellent"
              icon={Calendar}
              iconColor="#9333ea"
            />
          </>
        )}
      </div>

      {/* Detailed Analysis */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Health Factors Chart */}
        <div className="lg:col-span-2">
          <Card className="bg-white shadow-md border border-gray-100">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-professional-slate mb-6">Health Factor Analysis</h3>
              
              <div className="space-y-4">
                {metricsLoading ? (
                  // Loading skeletons for health factors
                  Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                  ))
                ) : (
                  [
                    { label: "Sleep Quality", score: metrics?.sleepScore || 92, color: "bg-green-500" },
                    { label: "Exercise Consistency", score: metrics?.exerciseScore || 78, color: "bg-green-400" },
                    { label: "Nutrition Score", score: metrics?.nutritionScore || 84, color: "bg-yellow-400" },
                    { label: "Stress Management", score: metrics?.stressScore || 71, color: "bg-yellow-500" },
                    { label: "Cognitive Health", score: metrics?.cognitiveScore || 89, color: "bg-green-500" },
                  ].map((factor) => (
                    <div key={factor.label}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">{factor.label}</span>
                        <span className="text-sm text-green-600 font-medium">{factor.score}%</span>
                      </div>
                      <Progress value={factor.score} className="h-2" />
                    </div>
                  ))
                )}
              </div>

              {/* Risk Factors */}
              <div className="mt-8">
                <h4 className="text-md font-semibold text-professional-slate mb-4">Risk Factors Monitor</h4>
                <div className="grid grid-cols-2 gap-4">
                  {metricsLoading ? (
                    // Loading skeletons for risk factors
                    <>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg space-x-3">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-gray-50 rounded-lg space-x-3">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center p-3 bg-green-50 rounded-lg">
                        <Heart className="text-green-500 mr-3 h-5 w-5" />
                        <div>
                          <div className="text-sm font-medium text-green-800">Cardiovascular</div>
                          <div className="text-xs text-green-600">{metrics?.cardiovascularRisk || "Low Risk"}</div>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                        <Activity className="text-yellow-500 mr-3 h-5 w-5" />
                        <div>
                          <div className="text-sm font-medium text-yellow-800">Metabolic</div>
                          <div className="text-xs text-yellow-600">{metrics?.metabolicRisk || "Monitor"}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          {/* Trajectory Timeline */}
          <Card className="bg-white shadow-md border border-gray-100">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-professional-slate mb-4">Longevity Timeline</h3>
              <div className="space-y-3">
                {assessmentLoading ? (
                  // Loading skeletons for timeline
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Skeleton className="h-3 w-3 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-medical-green rounded-full mr-3"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Current Age: {assessment.age}</div>
                        <div className="text-xs text-gray-500">Optimal trajectory maintained</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-trust-blue rounded-full mr-3"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Age 50</div>
                        <div className="text-xs text-gray-500">Peak performance phase</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-vitality-gold rounded-full mr-3"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Age 100</div>
                        <div className="text-xs text-gray-500">Vitality maintenance</div>
                      </div>
                    </div>
                  </>
                )}
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Age 150</div>
                    <div className="text-xs text-gray-500">Target achievement</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="bg-white shadow-md border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Brain className="text-purple-600 mr-2 h-5 w-5" />
                <h3 className="text-lg font-semibold text-professional-slate">AI Insights</h3>
              </div>
              
              <div className="space-y-4">
                {assessmentLoading || metricsLoading ? (
                  // Loading skeletons for insights
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-800">Sleep Optimization</div>
                      <div className="text-xs text-blue-600 mt-1">
                        Consistent 8-hour sleep could add 3.2 years to your healthspan
                      </div>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-800">Exercise Enhancement</div>
                      <div className="text-xs text-green-600 mt-1">
                        Adding strength training twice weekly shows 15% longevity boost
                      </div>
                    </div>
                    
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="text-sm font-medium text-orange-800">Nutrition Focus</div>
                      <div className="text-xs text-orange-600 mt-1">
                        Mediterranean diet adoption could reduce aging markers by 12%
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Updates */}
          <Card className="bg-white shadow-md border border-gray-100">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-professional-slate mb-4">Recent Updates</h3>
              <div className="space-y-3">
                {assessmentLoading ? (
                  // Loading skeletons for recent updates
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Skeleton className="h-2 w-2 rounded-full mt-2" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3"></div>
                      <div>
                        <div className="text-sm">Sleep score improved by 8%</div>
                        <div className="text-xs text-gray-500">2 days ago</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3"></div>
                      <div>
                        <div className="text-sm">New exercise routine added</div>
                        <div className="text-xs text-gray-500">1 week ago</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3"></div>
                      <div>
                        <div className="text-sm">Stress management goal set</div>
                        <div className="text-xs text-gray-500">2 weeks ago</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
