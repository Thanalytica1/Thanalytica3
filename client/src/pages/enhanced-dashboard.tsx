// Enhanced Health Dashboard with Performance Optimizations and UX Improvements
import { useState, useMemo, useCallback, Suspense, lazy } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertCircle, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Watch, 
  Zap, 
  Shield, 
  Calendar,
  RefreshCw,
  TrendingUp,
  Target,
  Brain,
  Heart,
  Activity,
  Settings,
  BarChart3
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { useHealthAssessment, useHealthMetrics } from '@/hooks/use-health-data';
import { useHealthMetrics as useNewHealthMetrics, useHealthAnalytics } from '@/hooks/use-health-metrics';
import { useLatestAssessment } from '@/hooks/use-health-assessments';

import { EnhancedHealthCard } from '@/components/enhanced-health-card';
import { GoalsList } from '@/components/goal-progress';
import { ActionableInsights } from '@/components/actionable-insights';
import { DashboardLoadingSkeleton } from '@/components/health-metrics-skeleton';

import { HEALTH_FACTORS, TIME_RANGES, DEFAULT_GOALS } from '@/config/dashboard.config';
import { validateHealthData, calculateBiologicalAgeStatus } from '@/utils/health-validation';

// Lazy load heavy components
const WearableDashboard = lazy(() => import('@/components/wearable-dashboard'));
const Day1Dashboard = lazy(() => import('@/components/day1-dashboard'));
const AdvancedAnalytics = lazy(() => import('@/components/advanced-analytics'));

// Error Boundary Component
const ErrorBoundary = ({ 
  error, 
  retry, 
  section 
}: { 
  error: Error | null; 
  retry: () => void; 
  section: string; 
}) => {
  if (!error) return null;
  
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Unable to load {section}</AlertTitle>
      <AlertDescription>
        {error?.message || 'Something went wrong'}
        <Button 
          size="sm" 
          variant="outline" 
          onClick={retry}
          className="mt-2"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </AlertDescription>
    </Alert>
  );
};

// Comparison Component
const ComparisonMetric = ({ 
  label, 
  userValue, 
  benchmark, 
  unit = '' 
}: { 
  label: string; 
  userValue: number; 
  benchmark: number; 
  unit?: string; 
}) => {
  const difference = userValue - benchmark;
  const percentDiff = benchmark > 0 ? ((difference / benchmark) * 100) : 0;
  
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <div className="text-sm text-gray-600">{label}</div>
        <div className="text-lg font-semibold">{userValue}{unit}</div>
      </div>
      <div className="text-right">
        <div className="text-xs text-gray-500">vs benchmark</div>
        <div className={`text-sm font-medium ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {difference >= 0 ? '+' : ''}{percentDiff.toFixed(1)}%
        </div>
      </div>
    </div>
  );
};

export default function EnhancedDashboard() {
  const { firebaseUser, user } = useAuth();
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [retryCount, setRetryCount] = useState(0);
  
  // Memoized URL params check
  const isNewUser = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('newUser') === 'true';
  }, []);
  
  // Data fetching with new optimized hooks
  const { data: assessment, isLoading: assessmentLoading, error: assessmentError } = useLatestAssessment();
  const { data: metrics, isLoading: metricsLoading, error: metricsError } = useNewHealthMetrics('weight', 30);
  const { data: analytics, isLoading: analyticsLoading } = useHealthAnalytics(timeRange);
  
  // Retry function
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    window.location.reload();
  }, []);
  
  // Validate and prepare data
  const validatedData = useMemo(() => {
    if (!assessment || !metrics) return null;
    
    return validateHealthData({
      vitalityScore: assessment.vitalityScore,
      biologicalAge: assessment.biologicalAge,
      trajectoryRating: assessment.trajectoryRating,
      projectedLifespan: 120, // Default value
      ...metrics
    });
  }, [assessment, metrics]);
  
  // Mock sample data for development
  const sampleInsights = useMemo(() => [
    {
      id: '1',
      title: 'Optimize Sleep Schedule',
      description: 'Consistent 8-hour sleep could significantly improve your biological age and cognitive function.',
      category: 'sleep' as const,
      impact: 9,
      effort: 4,
      timeframe: '2-4 weeks',
      evidence: ['Harvard Sleep Study 2023', 'Journal of Longevity Research'],
      actionSteps: [
        'Set a consistent bedtime at 10:30 PM',
        'Create a 30-minute wind-down routine',
        'Limit screen time 1 hour before bed',
        'Keep bedroom temperature at 65-68°F'
      ],
      potentialGain: 'Could add 3.2 years to healthspan and improve daily energy by 40%',
      difficulty: 'moderate' as const
    },
    {
      id: '2',
      title: 'Add Strength Training',
      description: 'Two sessions per week of resistance training could dramatically improve muscle mass and longevity markers.',
      category: 'exercise' as const,
      impact: 8,
      effort: 6,
      timeframe: '4-6 weeks',
      evidence: ['American Journal of Medicine'],
      actionSteps: [
        'Schedule 2 strength sessions per week',
        'Focus on compound movements',
        'Progressive overload principle',
        'Track progress weekly'
      ],
      potentialGain: '15% reduction in aging markers and improved metabolic health',
      difficulty: 'moderate' as const
    },
    {
      id: '3',
      title: 'Mediterranean Diet Adoption',
      description: 'Transitioning to a Mediterranean-style diet could reduce inflammation and improve cardiovascular health.',
      category: 'nutrition' as const,
      impact: 7,
      effort: 5,
      timeframe: '6-8 weeks',
      evidence: ['Mediterranean Diet Research'],
      actionSteps: [
        'Increase olive oil consumption',
        'Add more fish and vegetables',
        'Reduce processed foods',
        'Include nuts and seeds daily'
      ],
      potentialGain: '12% reduction in inflammation markers',
      difficulty: 'easy' as const
    }
  ], []);
  
  // Generate sparkline data for trends
  const generateTrendData = useCallback((baseValue: number, days = 7) => {
    return Array.from({ length: days }, (_, i) => ({
      value: baseValue + (Math.random() - 0.5) * 10,
      timestamp: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString()
    }));
  }, []);
  
  // Loading state
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
  
  // Error states with retry
  if (assessmentError) {
    return (
      <ErrorBoundary 
        error={assessmentError as Error} 
        retry={handleRetry} 
        section="health assessment" 
      />
    );
  }
  
  if (metricsError) {
    return (
      <ErrorBoundary 
        error={metricsError as Error} 
        retry={handleRetry} 
        section="health metrics" 
      />
    );
  }
  
  if (!assessment) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-professional-slate mb-4">Complete Your Assessment</h2>
        <p className="text-gray-600 mb-4">Please complete your health assessment to see your personalized dashboard.</p>
        <Button 
          onClick={() => window.location.href = '/assessment'} 
          className="bg-medical-green hover:bg-medical-green/90"
        >
          Start Assessment
        </Button>
      </div>
    );
  }
  
  // Show Day 1 experience for new users
  if (isNewUser && assessment && user) {
    return (
      <Suspense fallback={<DashboardLoadingSkeleton />}>
        <Day1Dashboard user={user} assessment={assessment} />
      </Suspense>
    );
  }
  
  const biologicalAgeStatus = calculateBiologicalAgeStatus(
    validatedData?.biologicalAge || assessment.age,
    assessment.age
  );
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Dashboard Header with Time Range Selector */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-medical-green to-trust-blue rounded-xl p-8 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-3xl font-bold mb-2">Your Health Journey</h2>
              <p className="text-lg opacity-90">Personalized insights powered by AI</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_RANGES.map(range => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {validatedData?.trajectoryRating || 'MODERATE'}
                </div>
                <div className="text-sm opacity-75">Health Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Health Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <EnhancedHealthCard
          title="Biological Age"
          value={validatedData?.biologicalAge || assessment.age}
          unit=" years"
          subtitle={biologicalAgeStatus.message}
          changePercent={biologicalAgeStatus.difference}
          changeDirection={biologicalAgeStatus.difference <= 0 ? 'down' : 'up'}
          status={biologicalAgeStatus.status}
          icon={Watch}
          iconColor="#2E8B57"
          trend={generateTrendData(validatedData?.biologicalAge || assessment.age)}
          benchmark={assessment.age}
          description="Your biological age compared to chronological age"
          onClick={() => setActiveTab('biological-age')}
        />
        
        <EnhancedHealthCard
          title="Vitality Score"
          value={validatedData?.vitalityScore || 75}
          unit="%"
          subtitle="Overall vitality index"
          change="+5 from last month"
          changeDirection="up"
          status="good"
          icon={Zap}
          iconColor="#FFD700"
          trend={generateTrendData(validatedData?.vitalityScore || 75)}
          benchmark={80}
          description="Comprehensive measure of your health and energy levels"
          onClick={() => setActiveTab('vitality')}
        />
        
        <EnhancedHealthCard
          title="Risk Assessment"
          value="Low"
          subtitle="Overall health risk"
          change="2 protective factors"
          changeDirection="down"
          status="excellent"
          icon={Shield}
          iconColor="#4682B4"
          description="AI-calculated health risk assessment"
          onClick={() => setActiveTab('risk-factors')}
        />
        
        <EnhancedHealthCard
          title="Projected Lifespan"
          value={validatedData?.projectedLifespan || 120}
          unit=" years"
          subtitle="Expected healthy lifespan"
          change="On track for 150"
          changeDirection="up"
          status="excellent"
          icon={Calendar}
          iconColor="#9333ea"
          description="AI projection based on current health patterns"
          onClick={() => setActiveTab('longevity')}
        />
      </div>
      
      {/* Tabbed Content Area */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Health Metrics</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Health Factor Analysis */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold">Health Factor Analysis</h3>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Trends
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {HEALTH_FACTORS.map((factor) => {
                      const score = validatedData?.[factor.key as keyof typeof validatedData] as number || factor.defaultScore;
                      return (
                        <div key={factor.key} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <factor.icon className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-medium">{factor.label}</span>
                            </div>
                            <Badge variant={score >= 80 ? 'default' : 'secondary'}>
                              {score}{factor.unit}
                            </Badge>
                          </div>
                          <Progress value={score} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Comparison with Benchmarks */}
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <ComparisonMetric
                      label="Sleep Quality"
                      userValue={validatedData?.sleepScore || 92}
                      benchmark={85}
                      unit="%"
                    />
                    <ComparisonMetric
                      label="Exercise Score"
                      userValue={validatedData?.exerciseScore || 78}
                      benchmark={75}
                      unit="%"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Quick Stats Sidebar */}
            <div className="space-y-6">
              {/* Longevity Timeline */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Longevity Timeline
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-medical-green rounded-full mr-3"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Current Age: {assessment.age}</div>
                        <div className="text-xs text-gray-500">Optimal trajectory</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-trust-blue rounded-full mr-3"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Age 100</div>
                        <div className="text-xs text-gray-500">Healthy centenarian</div>
                      </div>
                    </div>
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
              
              {/* AI Insights Preview */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    Top Insights
                  </h3>
                  <div className="space-y-3">
                    {sampleInsights.slice(0, 2).map((insight) => (
                      <div key={insight.id} className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-800">
                          {insight.title}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          Impact: +{insight.impact}/10 • {insight.timeframe}
                        </div>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setActiveTab('insights')}
                    >
                      View All Insights
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Health Metrics Tab */}
        <TabsContent value="metrics">
          <Suspense fallback={<div>Loading analytics...</div>}>
            <AdvancedAnalytics 
              timeRange={timeRange}
              metrics={validatedData}
              analytics={analytics}
            />
          </Suspense>
        </TabsContent>
        
        {/* Goals Tab */}
        <TabsContent value="goals">
          <GoalsList
            goals={DEFAULT_GOALS.map(goal => ({
              ...goal,
              status: 'active' as const
            }))}
            onAddGoal={() => console.log('Add goal')}
            onUpdateGoal={(id, value) => console.log('Update goal', id, value)}
            onEditGoal={(id) => console.log('Edit goal', id)}
            onCompleteGoal={(id) => console.log('Complete goal', id)}
          />
        </TabsContent>
        
        {/* Insights Tab */}
        <TabsContent value="insights">
          <ActionableInsights
            insights={sampleInsights}
            onImplement={(id) => console.log('Implement insight', id)}
            onLearnMore={(id) => console.log('Learn more', id)}
            onUpdateProgress={(id, progress) => console.log('Update progress', id, progress)}
          />
        </TabsContent>
        
        {/* Devices Tab */}
        <TabsContent value="devices">
          <Suspense fallback={<div>Loading wearable dashboard...</div>}>
            <WearableDashboard />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}