// Actionable Insights Component with Priority and Impact Tracking
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Lightbulb, 
  TrendingUp, 
  Clock, 
  Target,
  ChevronRight,
  Star,
  Calendar,
  CheckCircle
} from 'lucide-react';

interface HealthInsight {
  id: string;
  title: string;
  description: string;
  category: 'sleep' | 'exercise' | 'nutrition' | 'stress' | 'prevention' | 'lifestyle';
  impact: number; // 1-10 scale
  effort: number; // 1-10 scale (1 = easy, 10 = very difficult)
  timeframe: string;
  evidence: string[];
  actionSteps: string[];
  potentialGain: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  implemented?: boolean;
  implementedAt?: string;
  progress?: number;
}

interface ActionableInsightsProps {
  insights: HealthInsight[];
  onImplement?: (insightId: string) => void;
  onLearnMore?: (insightId: string) => void;
  onUpdateProgress?: (insightId: string, progress: number) => void;
  maxVisible?: number;
  showImplemented?: boolean;
  className?: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'sleep': return '😴';
    case 'exercise': return '🏃‍♂️';
    case 'nutrition': return '🥗';
    case 'stress': return '🧘';
    case 'prevention': return '🛡️';
    case 'lifestyle': return '✨';
    default: return '💡';
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'sleep': return 'bg-blue-100 text-blue-800';
    case 'exercise': return 'bg-green-100 text-green-800';
    case 'nutrition': return 'bg-orange-100 text-orange-800';
    case 'stress': return 'bg-purple-100 text-purple-800';
    case 'prevention': return 'bg-red-100 text-red-800';
    case 'lifestyle': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'bg-green-100 text-green-800';
    case 'moderate': return 'bg-yellow-100 text-yellow-800';
    case 'challenging': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityBadge = (impact: number, effort: number) => {
  const score = impact - (effort * 0.3); // Weight impact higher than effort
  
  if (score >= 8) {
    return { label: 'Top Priority', color: 'bg-red-500 text-white', variant: 'destructive' as const };
  } else if (score >= 6) {
    return { label: 'High Priority', color: 'bg-orange-500 text-white', variant: 'default' as const };
  } else if (score >= 4) {
    return { label: 'Medium Priority', color: 'bg-yellow-500 text-white', variant: 'secondary' as const };
  } else {
    return { label: 'Low Priority', color: 'bg-gray-500 text-white', variant: 'outline' as const };
  }
};

const InsightCard = ({ 
  insight, 
  index, 
  onImplement, 
  onLearnMore, 
  onUpdateProgress 
}: {
  insight: HealthInsight;
  index: number;
  onImplement?: (id: string) => void;
  onLearnMore?: (id: string) => void;
  onUpdateProgress?: (id: string, progress: number) => void;
}) => {
  const priority = getPriorityBadge(insight.impact, insight.effort);
  const isHighPriority = index < 3; // Top 3 are high priority
  
  return (
    <Card className={`
      transition-all hover:shadow-md border-l-4
      ${insight.implemented ? 'border-l-green-500 bg-green-50' : 
        isHighPriority ? 'border-l-red-500' : 'border-l-gray-300'}
    `}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="text-2xl">
              {insight.implemented ? '✅' : getCategoryIcon(insight.category)}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg leading-tight">
                {insight.title}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                {insight.description}
              </p>
            </div>
          </div>
        </div>
        
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant={priority.variant} className="text-xs">
            {index === 0 && !insight.implemented ? '🔥 ' : ''}{priority.label}
          </Badge>
          <Badge variant="outline" className={getCategoryColor(insight.category)}>
            {insight.category}
          </Badge>
          <Badge variant="outline" className={getDifficultyColor(insight.difficulty)}>
            {insight.difficulty}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Impact Metrics */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{insight.impact}/10</div>
            <div className="text-xs text-gray-600">Impact</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{insight.effort}/10</div>
            <div className="text-xs text-gray-600">Effort</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {insight.timeframe}
            </div>
            <div className="text-xs text-gray-600">Timeline</div>
          </div>
        </div>
        
        {/* Potential Gain */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Potential Benefit</span>
          </div>
          <p className="text-sm text-blue-700">{insight.potentialGain}</p>
        </div>
        
        {/* Progress Tracking (if implemented) */}
        {insight.implemented && insight.progress !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-600">{insight.progress}%</span>
            </div>
            <Progress value={insight.progress} className="h-2" />
            {onUpdateProgress && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onUpdateProgress(insight.id, Math.min(100, insight.progress! + 25))}
                  className="text-xs"
                >
                  +25%
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onUpdateProgress(insight.id, 100)}
                  className="text-xs"
                >
                  Complete
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Implementation Status */}
        {insight.implemented && insight.implementedAt && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded">
            <CheckCircle className="w-4 h-4" />
            <span>Implemented on {new Date(insight.implementedAt).toLocaleDateString()}</span>
          </div>
        )}
        
        {/* Action Steps Preview */}
        {insight.actionSteps.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Action Steps
            </h5>
            <div className="space-y-1">
              {insight.actionSteps.slice(0, 2).map((step, stepIndex) => (
                <div key={stepIndex} className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 mt-1">•</span>
                  <span className="text-gray-600">{step}</span>
                </div>
              ))}
              {insight.actionSteps.length > 2 && (
                <div className="text-xs text-gray-500 pl-4">
                  +{insight.actionSteps.length - 2} more steps
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Evidence */}
        {insight.evidence.length > 0 && (
          <div className="text-xs text-gray-500">
            <span className="font-medium">Based on:</span> {insight.evidence[0]}
            {insight.evidence.length > 1 && ` (+${insight.evidence.length - 1} studies)`}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {!insight.implemented && onImplement && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onImplement(insight.id)}
            >
              <Target className="w-4 h-4 mr-2" />
              Start Implementation
            </Button>
          )}
          {onLearnMore && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onLearnMore(insight.id)}
              className="flex items-center gap-2"
            >
              Learn More
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const ActionableInsights = ({
  insights,
  onImplement,
  onLearnMore,
  onUpdateProgress,
  maxVisible = 6,
  showImplemented = true,
  className = ""
}: ActionableInsightsProps) => {
  // Sort insights by priority (impact - effort) and implementation status
  const sortedInsights = [...insights].sort((a, b) => {
    // Implemented items go to bottom if showImplemented is false
    if (!showImplemented) {
      if (a.implemented && !b.implemented) return 1;
      if (!a.implemented && b.implemented) return -1;
    }
    
    // Sort by priority score (impact - effort * 0.3)
    const scoreA = a.impact - (a.effort * 0.3);
    const scoreB = b.impact - (b.effort * 0.3);
    return scoreB - scoreA;
  });
  
  const visibleInsights = sortedInsights.slice(0, maxVisible);
  const implementedCount = insights.filter(i => i.implemented).length;
  const highPriorityCount = visibleInsights.filter((_, index) => index < 3).length;
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Personalized Health Insights
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered recommendations prioritized by impact and feasibility
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">
            {implementedCount}/{insights.length} implemented
          </div>
          <div className="text-xs text-gray-500">
            {highPriorityCount} high priority
          </div>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{insights.length}</div>
          <div className="text-xs text-gray-600">Total Insights</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-red-600">{highPriorityCount}</div>
          <div className="text-xs text-gray-600">High Priority</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{implementedCount}</div>
          <div className="text-xs text-gray-600">Implemented</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">
            {Math.round(insights.reduce((sum, i) => sum + i.impact, 0) / insights.length)}
          </div>
          <div className="text-xs text-gray-600">Avg Impact</div>
        </div>
      </div>
      
      {/* Insights Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {visibleInsights.map((insight, index) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            index={index}
            onImplement={onImplement}
            onLearnMore={onLearnMore}
            onUpdateProgress={onUpdateProgress}
          />
        ))}
      </div>
      
      {/* Show More */}
      {insights.length > maxVisible && (
        <div className="text-center">
          <Button variant="outline" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            View All {insights.length} Insights
          </Button>
        </div>
      )}
      
      {/* Empty State */}
      {insights.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No insights available</h4>
          <p className="text-gray-600">
            Complete your health assessment to receive personalized recommendations
          </p>
        </div>
      )}
    </div>
  );
};