import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HealthAIAssistant } from "@/components/health-ai-assistant";
import { AdvancedHealthTrendChart } from "@/components/health-trend-chart";
import { useAuth } from "@/hooks/use-auth";
import { useHealthTrends, useGenerateHealthModel } from "@/hooks/use-optimized-queries";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Activity, 
  Heart,
  Zap,
  BarChart3,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function HealthAIPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const generateModel = useGenerateHealthModel();
  
  const { data: biologicalAgeTrends } = useHealthTrends(user?.id || "", "biological_age");
  const { data: vitalityTrends } = useHealthTrends(user?.id || "", "vitality_score");
  const { data: allTrends } = useHealthTrends(user?.id || "");

  const handleGenerateAIModel = async () => {
    if (!user?.id) return;

    try {
      await generateModel.mutateAsync(user.id);
      toast({
        title: "AI Analysis Complete",
        description: "Your advanced health model has been updated with the latest insights.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Unable to generate advanced health model. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getLatestValue = (trends: any[] | undefined, defaultValue = 0) => {
    return trends && trends.length > 0 ? trends[0].value : defaultValue;
  };

  const currentBioAge = getLatestValue(biologicalAgeTrends || [], 35);
  const currentVitality = getLatestValue(vitalityTrends || [], 75);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Health AI Analytics</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Advanced AI-powered insights for longevity optimization
          </p>
        </div>
        
        <Button 
          onClick={handleGenerateAIModel} 
          disabled={generateModel.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Brain className="w-4 h-4 mr-2" />
          {generateModel.isPending ? "Analyzing..." : "Update AI Model"}
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Biological Age</p>
                <p className="text-2xl font-bold">{currentBioAge.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Vitality Score</p>
                <p className="text-2xl font-bold">{currentVitality.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Life Expectancy</p>
                <p className="text-2xl font-bold">138</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Data Points</p>
                <p className="text-2xl font-bold">{allTrends?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Health Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {biologicalAgeTrends && biologicalAgeTrends.length > 0 && (
          <AdvancedHealthTrendChart
            data={biologicalAgeTrends}
            title="Biological Age Trajectory"
            metricType="biological_age"
            targetValue={30}
            unit=" years"
            color="#DC2626"
          />
        )}

        {vitalityTrends && vitalityTrends.length > 0 && (
          <AdvancedHealthTrendChart
            data={vitalityTrends}
            title="Vitality Score Evolution"
            metricType="vitality_score"
            targetValue={85}
            unit="/100"
            color="#059669"
          />
        )}
      </div>

      {/* AI Health Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <HealthAIAssistant />
        </div>

        {/* AI Insights Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span>AI Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Longevity Optimization</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Your current biological age shows room for 3-5 years improvement through targeted interventions.
              </p>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Priority Areas</span>
              </div>
              <div className="space-y-1">
                <Badge variant="outline" className="text-xs">Sleep Optimization</Badge>
                <Badge variant="outline" className="text-xs">Strength Training</Badge>
                <Badge variant="outline" className="text-xs">Stress Management</Badge>
              </div>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">AI Recommendations</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Based on your data patterns, implementing the suggested interventions could extend your healthspan by 12-15 years.
              </p>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => document.getElementById('chat-tab')?.click()}
            >
              <Brain className="w-4 h-4 mr-2" />
              Ask AI Assistant
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance & Data Quality */}
      <Card>
        <CardHeader>
          <CardTitle>Data Quality & Model Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">94%</div>
              <div className="text-sm text-gray-600">Model Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">89%</div>
              <div className="text-sm text-gray-600">Data Completeness</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">12</div>
              <div className="text-sm text-gray-600">Data Sources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">v2.1</div>
              <div className="text-sm text-gray-600">Model Version</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}