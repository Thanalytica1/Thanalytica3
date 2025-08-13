// Goal Progress Component with Achievement Tracking
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  Trophy,
  Plus,
  Settings
} from 'lucide-react';

interface GoalMilestone {
  id: string;
  title: string;
  targetValue: number;
  achievedAt?: string;
  reward?: string;
}

interface Goal {
  id: string;
  category: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  targetDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  milestones?: GoalMilestone[];
  progress?: number;
}

interface GoalProgressProps {
  goal: Goal;
  onUpdate?: (goalId: string, newValue: number) => void;
  onEdit?: (goalId: string) => void;
  onComplete?: (goalId: string) => void;
  compact?: boolean;
}

interface GoalListProps {
  goals: Goal[];
  onAddGoal?: () => void;
  onUpdateGoal?: (goalId: string, newValue: number) => void;
  onEditGoal?: (goalId: string) => void;
  onCompleteGoal?: (goalId: string) => void;
  title?: string;
  className?: string;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'sleep': return '😴';
    case 'fitness': return '💪';
    case 'nutrition': return '🥗';
    case 'stress': return '🧘';
    case 'weight': return '⚖️';
    case 'meditation': return '🧘‍♀️';
    default: return '🎯';
  }
};

const formatTimeRemaining = (targetDate: string): string => {
  const target = new Date(targetDate);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return '1 day left';
  if (diffDays < 7) return `${diffDays} days left`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks left`;
  return `${Math.ceil(diffDays / 30)} months left`;
};

export const GoalProgress = ({ 
  goal, 
  onUpdate, 
  onEdit, 
  onComplete, 
  compact = false 
}: GoalProgressProps) => {
  const percentage = Math.min(100, (goal.currentValue / goal.targetValue) * 100);
  const isCompleted = percentage >= 100 || goal.status === 'completed';
  const timeRemaining = formatTimeRemaining(goal.targetDate);
  const isOverdue = timeRemaining === 'Overdue';
  
  if (compact) {
    return (
      <div className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getCategoryIcon(goal.category)}</span>
            <h4 className="font-medium text-sm">{goal.title}</h4>
          </div>
          <Badge variant="outline" className={getPriorityColor(goal.priority)}>
            {goal.priority}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">
              {goal.currentValue}/{goal.targetValue} {goal.unit}
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
          {isCompleted && (
            <Badge className="bg-green-100 text-green-800 text-xs">
              <Trophy className="w-3 h-3 mr-1" />
              Goal Achieved! 🎉
            </Badge>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getCategoryIcon(goal.category)}</div>
            <div>
              <CardTitle className="text-lg">{goal.title}</CardTitle>
              {goal.description && (
                <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getPriorityColor(goal.priority)}>
              {goal.priority}
            </Badge>
            {onEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEdit(goal.id)}
                className="h-8 w-8 p-0"
              >
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-lg font-bold text-gray-900">
              {goal.currentValue}/{goal.targetValue} {goal.unit}
            </span>
          </div>
          
          <Progress 
            value={percentage} 
            className="h-3"
            aria-label={`${goal.title} progress: ${percentage.toFixed(1)}%`}
          />
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">{percentage.toFixed(1)}% complete</span>
            <div className="flex items-center gap-1 text-gray-500">
              <Calendar className="w-4 h-4" />
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                {timeRemaining}
              </span>
            </div>
          </div>
        </div>
        
        {/* Milestones */}
        {goal.milestones && goal.milestones.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-700">Milestones</h5>
            <div className="space-y-2">
              {goal.milestones.map((milestone) => {
                const milestoneReached = goal.currentValue >= milestone.targetValue;
                return (
                  <div 
                    key={milestone.id}
                    className={`
                      flex items-center justify-between p-2 rounded border
                      ${milestoneReached ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      {milestoneReached ? (
                        <Trophy className="w-4 h-4 text-green-600" />
                      ) : (
                        <Target className="w-4 h-4 text-gray-400" />
                      )}
                      <span className={`text-sm ${milestoneReached ? 'text-green-800' : 'text-gray-600'}`}>
                        {milestone.title}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs ${milestoneReached ? 'text-green-600' : 'text-gray-500'}`}>
                        {milestone.targetValue} {goal.unit}
                      </div>
                      {milestone.achievedAt && (
                        <div className="text-xs text-green-600">
                          ✓ {new Date(milestone.achievedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Achievement Badge */}
        {isCompleted && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <Trophy className="w-5 h-5" />
              <span className="font-medium">Goal Achieved!</span>
              <span className="text-2xl">🎉</span>
            </div>
            {goal.milestones?.find(m => m.reward) && (
              <p className="text-sm text-green-700 mt-1">
                Reward: {goal.milestones.find(m => m.reward)?.reward}
              </p>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {onUpdate && !isCompleted && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onUpdate(goal.id, goal.currentValue + 1)}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Update Progress
            </Button>
          )}
          {onComplete && isCompleted && goal.status !== 'completed' && (
            <Button 
              size="sm" 
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={() => onComplete(goal.id)}
            >
              <Trophy className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const GoalsList = ({ 
  goals, 
  onAddGoal, 
  onUpdateGoal, 
  onEditGoal, 
  onCompleteGoal,
  title = "Health Goals",
  className = ""
}: GoalListProps) => {
  const activeGoals = goals.filter(goal => goal.status === 'active');
  const completedGoals = goals.filter(goal => goal.status === 'completed');
  
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        {onAddGoal && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onAddGoal}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </Button>
        )}
      </div>
      
      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-800 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Active Goals ({activeGoals.length})
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            {activeGoals.map(goal => (
              <GoalProgress
                key={goal.id}
                goal={goal}
                onUpdate={onUpdateGoal}
                onEdit={onEditGoal}
                onComplete={onCompleteGoal}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-800 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-green-600" />
            Completed Goals ({completedGoals.length})
          </h4>
          <div className="grid gap-3 md:grid-cols-3">
            {completedGoals.map(goal => (
              <GoalProgress
                key={goal.id}
                goal={goal}
                compact={true}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {goals.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No goals yet</h4>
          <p className="text-gray-600 mb-4">
            Set your first health goal to start tracking your progress
          </p>
          {onAddGoal && (
            <Button onClick={onAddGoal} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Goal
            </Button>
          )}
        </div>
      )}
    </div>
  );
};