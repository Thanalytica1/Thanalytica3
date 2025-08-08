import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles,
  Target,
  TrendingUp,
  Clock,
  Zap,
  Heart,
  Brain,
  Activity,
  ArrowRight,
  CheckCircle,
  Star,
  Calendar,
  Users,
  Trophy
} from "lucide-react";
import { useLocation } from "wouter";
import type { User, HealthAssessment } from "@shared/schema";

interface Day1DashboardProps {
  user: User;
  assessment: HealthAssessment;
}

interface PersonalizedInsight {
  id: string;
  title: string;
  description: string;
  impact: string;
  category: 'biological' | 'lifestyle' | 'optimization';
  priority: 'high' | 'medium' | 'low';
}

interface NextAction {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  category: string;
  yearsImpact: number;
  completed: boolean;
}

function generatePersonalizedInsights(assessment: HealthAssessment): PersonalizedInsight[] {
  const insights: PersonalizedInsight[] = [];
  
  // Biological age insight
  const biologicalAge = assessment.biologicalAge || assessment.age;
  const ageDifference = assessment.age - biologicalAge;
  
  if (ageDifference > 0) {
    insights.push({
      id: 'bio-age-advantage',
      title: `You're ${Math.abs(ageDifference)} years biologically younger`,
      description: `Your biological age of ${biologicalAge} is ${Math.abs(ageDifference)} years younger than your chronological age. This suggests your body is aging slower than average.`,
      impact: `This advantage could translate to ${Math.round(ageDifference * 2)} additional healthy years`,
      category: 'biological',
      priority: 'high'
    });
  } else if (ageDifference < 0) {
    insights.push({
      id: 'bio-age-opportunity',
      title: `Opportunity to reverse ${Math.abs(ageDifference)} years of aging`,
      description: `Your biological age of ${biologicalAge} indicates room for optimization. The good news: biological age is modifiable through lifestyle changes.`,
      impact: `Targeted interventions could reverse this and add ${Math.round(Math.abs(ageDifference) * 1.5)} healthy years`,
      category: 'optimization',
      priority: 'high'
    });
  }
  
  // Exercise insight
  if (assessment.exerciseFrequency === 'daily' || assessment.exerciseFrequency === '5-6-times') {
    insights.push({
      id: 'exercise-strength',
      title: 'Your exercise routine is a longevity superpower',
      description: `Regular exercise is one of the most powerful longevity interventions. Your ${assessment.exerciseFrequency === 'daily' ? 'daily' : 'frequent'} exercise routine is setting you up for exceptional healthspan.`,
      impact: 'This could add 3-5 healthy years to your life',
      category: 'lifestyle',
      priority: 'high'
    });
  } else if (assessment.exerciseFrequency === 'none' || assessment.exerciseFrequency === '1-2-times') {
    insights.push({
      id: 'exercise-opportunity',
      title: 'Exercise is your biggest longevity opportunity',
      description: 'Regular exercise is the closest thing we have to a fountain of youth. Starting a consistent routine could be your most impactful longevity intervention.',
      impact: 'Building this habit could add 7-10 healthy years',
      category: 'optimization',
      priority: 'high'
    });
  }
  
  // Sleep insight
  if (assessment.sleepQuality === 'excellent' || assessment.sleepQuality === 'good') {
    insights.push({
      id: 'sleep-strength',
      title: 'Quality sleep is fueling your longevity',
      description: `Your ${assessment.sleepQuality} sleep quality is supporting crucial recovery processes including cellular repair, memory consolidation, and immune function.`,
      impact: 'Quality sleep adds 2-3 years to healthy lifespan',
      category: 'lifestyle',
      priority: 'medium'
    });
  }
  
  return insights.slice(0, 3); // Return top 3 insights
}

function generateNextActions(assessment: HealthAssessment): NextAction[] {
  const actions: NextAction[] = [];
  
  // Based on assessment, suggest immediate actions
  if (assessment.exerciseFrequency === 'none' || assessment.exerciseFrequency === '1-2-times') {
    actions.push({
      id: 'start-walking',
      title: 'Start a daily 20-minute walk',
      description: 'Begin with a simple daily walk to establish the exercise habit',
      estimatedTime: '20 min/day',
      category: 'Movement',
      yearsImpact: 3,
      completed: false
    });
  }
  
  if (assessment.sleepQuality === 'poor' || assessment.sleepQuality === 'fair') {
    actions.push({
      id: 'optimize-sleep',
      title: 'Optimize your sleep environment',
      description: 'Set up your bedroom for better sleep quality',
      estimatedTime: '30 min setup',
      category: 'Recovery',
      yearsImpact: 2,
      completed: false
    });
  }
  
  if (!assessment.exerciseTypes?.includes('strength')) {
    actions.push({
      id: 'add-strength',
      title: 'Add 2 strength training sessions',
      description: 'Incorporate resistance training to maintain muscle mass',
      estimatedTime: '30 min, 2x/week',
      category: 'Movement',
      yearsImpact: 4,
      completed: false
    });
  }
  
  // Always include these foundational actions
  actions.push({
    id: 'track-metrics',
    title: 'Connect a wearable device',
    description: 'Start tracking your daily health metrics automatically',
    estimatedTime: '5 min setup',
    category: 'Tracking',
    yearsImpact: 1,
    completed: false
  });
  
  return actions.slice(0, 3);
}

export default function Day1Dashboard({ user, assessment }: Day1DashboardProps) {
  const [, setLocation] = useLocation();
  const [completedActions, setCompletedActions] = useState<string[]>([]);
  
  const insights = generatePersonalizedInsights(assessment);
  const nextActions = generateNextActions(assessment);
  
  const biologicalAge = assessment.biologicalAge || assessment.age;
  const ageDifference = assessment.age - biologicalAge;
  const longevityTarget = assessment.longevityGoals || "Live to 100";
  const optimizationScore = Math.max(20, Math.min(80, 50 + (ageDifference * 5)));
  
  const handleActionComplete = (actionId: string) => {
    setCompletedActions(prev => [...prev, actionId]);
  };
  
  const completedCount = completedActions.length;
  const progressPercentage = (completedCount / nextActions.length) * 100;
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 rounded-xl p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="w-6 h-6" />
              <span className="text-lg font-semibold">Welcome to Your 150-Year Journey</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Hello, {user.displayName || 'Health Pioneer'}! 🎉
            </h1>
            <p className="text-xl opacity-90 mb-6">
              Your personalized longevity profile is ready. Here's what we discovered about your health optimization potential.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{biologicalAge}</div>
                <div className="text-sm opacity-75">Biological Age</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold mb-1 ${ageDifference >= 0 ? 'text-green-300' : 'text-yellow-300'}`}>
                  {ageDifference > 0 ? '+' : ''}{ageDifference} years
                </div>
                <div className="text-sm opacity-75">vs Chronological</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{optimizationScore}%</div>
                <div className="text-sm opacity-75">Optimization Score</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Insights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-purple-500" />
                <span>Based on Your Assessment, Here's What We Discovered</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{insight.title}</h3>
                    <Badge 
                      variant={insight.priority === 'high' ? 'default' : 'secondary'}
                      className={insight.priority === 'high' ? 'bg-green-500' : ''}
                    >
                      {insight.category}
                    </Badge>
                  </div>
                  <p className="text-gray-700 mb-2">{insight.description}</p>
                  <div className="flex items-center space-x-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-green-700 font-medium">{insight.impact}</span>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Progression Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-500" />
                <span>Your Longevity Roadmap</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800 mb-2">
                    Current → Optimized Lifespan
                  </div>
                  <div className="flex items-center justify-center space-x-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-600">{biologicalAge + 70}</div>
                      <div className="text-sm text-gray-500">Current trajectory</div>
                    </div>
                    <ArrowRight className="w-6 h-6 text-blue-500" />
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {Math.min(150, biologicalAge + 85)}
                      </div>
                      <div className="text-sm text-gray-500">With optimization</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold">Next Milestones</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold">30 Days</div>
                      <div className="text-gray-600">Establish habits</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">90 Days</div>
                      <div className="text-gray-600">Measure improvements</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">1 Year</div>
                      <div className="text-gray-600">Bio-age optimization</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Next Actions */}
        <div className="space-y-6">
          {/* Immediate Next Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  <span>Your Next Actions</span>
                </div>
                <Badge variant="outline">
                  {completedCount}/{nextActions.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mb-4">
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-sm text-gray-600 mt-1">
                  Complete these actions to start your optimization journey
                </p>
              </div>
              
              {nextActions.map((action, index) => {
                const isCompleted = completedActions.includes(action.id);
                
                return (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 border rounded-lg transition-all ${
                      isCompleted 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`font-semibold ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                        {action.title}
                      </h3>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleActionComplete(action.id)}
                          className="h-6 px-2 text-xs"
                        >
                          Done
                        </Button>
                      )}
                    </div>
                    <p className={`text-sm mb-2 ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                      {action.description}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <Badge variant="secondary" className="text-xs">
                        {action.category}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">{action.estimatedTime}</span>
                        <span className="text-green-600 font-medium">
                          +{action.yearsImpact}y
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span>Your Starting Point</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Health Assessment</span>
                <Badge className="bg-green-500">✓ Complete</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Biological Age</span>
                <span className="font-semibold">{biologicalAge} years</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Longevity Goal</span>
                <span className="font-semibold">{longevityTarget}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Actions Completed</span>
                <span className="font-semibold">{completedCount}/3</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span>Explore More</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setLocation('/simulator')}
              >
                <Activity className="w-4 h-4 mr-2" />
                Try Health Simulator
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setLocation('/wearables')}
              >
                <Heart className="w-4 h-4 mr-2" />
                Connect Devices
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setLocation('/recommendations')}
              >
                <Brain className="w-4 h-4 mr-2" />
                Get Recommendations
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
