// Daily Log Dashboard Component - Shows today's data, streaks, and trends
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Flame,
  Moon,
  Activity,
  Coffee,
  Brain,
  Heart,
  Target,
  ArrowRight,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Link } from 'wouter';
import { useTodayLog, useDailyLogMetrics, useDailyLogs } from '@/hooks/use-daily-logs';
import { DailyLog } from '@shared/daily-log-schema';

interface MetricTileProps {
  icon: React.ReactNode;
  label: string;
  value: string | number | undefined;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  color: string;
  completed?: boolean;
}

function MetricTile({ 
  icon, 
  label, 
  value, 
  unit, 
  trend, 
  trendValue, 
  color,
  completed = false
}: MetricTileProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-green-600" />;
      case 'down': return <TrendingDown className="w-3 h-3 text-red-600" />;
      default: return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };
  
  return (
    <Card className={`relative ${completed ? 'border-green-200 bg-green-50/50' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
            {icon}
          </div>
          {completed && (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-xs text-gray-600">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold">
              {value !== undefined ? value : '—'}
            </span>
            {unit && value !== undefined && (
              <span className="text-sm text-gray-500">{unit}</span>
            )}
          </div>
          
          {trend && trendValue !== undefined && (
            <div className="flex items-center gap-1 text-xs">
              {getTrendIcon()}
              <span className={trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}>
                {trendValue > 0 ? '+' : ''}{trendValue}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface StreakCardProps {
  streak: number;
  label: string;
  icon?: React.ReactNode;
  maxStreak?: number;
}

function StreakCard({ streak, label, icon, maxStreak }: StreakCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon || <Flame className="w-5 h-5 text-orange-500" />}
            <span className="text-sm font-medium">{label}</span>
          </div>
          <Badge variant={streak > 0 ? 'default' : 'secondary'}>
            {streak} {streak === 1 ? 'day' : 'days'}
          </Badge>
        </div>
        
        {maxStreak && (
          <div className="space-y-1">
            <Progress value={(streak / maxStreak) * 100} className="h-2" />
            <p className="text-xs text-gray-500">
              Best: {maxStreak} days
            </p>
          </div>
        )}
        
        {/* Visual streak indicator */}
        <div className="flex gap-1 mt-3">
          {Array.from({ length: Math.min(7, streak) }).map((_, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center"
            >
              <span className="text-xs text-white font-bold">
                {streak - (Math.min(7, streak) - 1) + i}
              </span>
            </div>
          ))}
          {streak > 7 && (
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xs">+{streak - 7}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DailyLogDashboard() {
  const { log: todayLog, loading: logLoading } = useTodayLog();
  const { streak, weeklyAverages, insights, habitStreaks, loading: metricsLoading } = useDailyLogMetrics();
  const { logs } = useDailyLogs(7); // Last 7 days for mini chart
  
  // Calculate completion percentage for today
  const completionPercentage = useMemo(() => {
    if (!todayLog) return 0;
    
    const fields = [
      todayLog.sleep?.timeAsleep,
      todayLog.exercise?.minutes,
      todayLog.nutrition?.hydrationOz,
      todayLog.recovery?.rpe,
      todayLog.mindset?.mood
    ];
    
    const completed = fields.filter(f => f !== undefined).length;
    return (completed / fields.length) * 100;
  }, [todayLog]);
  
  // Calculate trends (this week vs last week)
  const calculateTrend = (thisWeek: number | null, lastWeek: number | null) => {
    if (!thisWeek || !lastWeek) return { trend: 'stable' as const, value: 0 };
    
    const change = ((thisWeek - lastWeek) / lastWeek) * 100;
    return {
      trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable' as const,
      value: Math.round(change)
    };
  };
  
  const sleepTrend = calculateTrend(
    weeklyAverages.thisWeek.sleep,
    weeklyAverages.lastWeek.sleep
  );
  
  const exerciseTrend = calculateTrend(
    weeklyAverages.thisWeek.exercise,
    weeklyAverages.lastWeek.exercise
  );
  
  const moodTrend = calculateTrend(
    weeklyAverages.thisWeek.mood,
    weeklyAverages.lastWeek.mood
  );
  
  // Format sleep time
  const formatSleepTime = (minutes: number | undefined) => {
    if (!minutes) return undefined;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };
  
  if (logLoading || metricsLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Daily Log Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Today's Log</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            <Link href="/daily-log">
              <Button size="sm">
                {todayLog?.completed ? 'Edit Log' : 'Complete Log'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Completion Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Today's Progress</span>
              <span className="text-sm font-medium">{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            {todayLog?.completed && (
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Day Complete!</span>
              </div>
            )}
          </div>
          
          {/* Today's Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricTile
              icon={<Moon className="w-5 h-5 text-blue-600" />}
              label="Sleep"
              value={formatSleepTime(todayLog?.sleep?.timeAsleep)}
              trend={sleepTrend.trend}
              trendValue={sleepTrend.value}
              color="text-blue-600"
              completed={!!todayLog?.sleep?.timeAsleep}
            />
            
            <MetricTile
              icon={<Activity className="w-5 h-5 text-green-600" />}
              label="Exercise"
              value={todayLog?.exercise?.minutes}
              unit="min"
              trend={exerciseTrend.trend}
              trendValue={exerciseTrend.value}
              color="text-green-600"
              completed={!!todayLog?.exercise?.minutes}
            />
            
            <MetricTile
              icon={<Coffee className="w-5 h-5 text-orange-600" />}
              label="Hydration"
              value={todayLog?.nutrition?.hydrationOz}
              unit="oz"
              color="text-orange-600"
              completed={!!todayLog?.nutrition?.hydrationOz}
            />
            
            <MetricTile
              icon={<Brain className="w-5 h-5 text-purple-600" />}
              label="Mood"
              value={todayLog?.mindset?.mood ? ['😔', '😟', '😐', '🙂', '😊'][todayLog.mindset.mood - 1] : undefined}
              trend={moodTrend.trend}
              trendValue={moodTrend.value}
              color="text-purple-600"
              completed={!!todayLog?.mindset?.mood}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Streaks Section */}
      <div className="grid md:grid-cols-2 gap-4">
        <StreakCard
          streak={streak}
          label="Daily Logging Streak"
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          maxStreak={30}
        />
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Habit Streaks</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.entries(habitStreaks).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(habitStreaks).map(([habit, count]) => (
                  <div key={habit} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{habit.replace(/_/g, ' ')}</span>
                    <Badge variant="outline">{count} days</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No habits tracked yet</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Insights Section */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              Insights & Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Weekly Mini Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">This Week at a Glance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between gap-2">
            {Array.from({ length: 7 }).map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (6 - i));
              const dateStr = date.toISOString().split('T')[0];
              const dayLog = logs.find(l => l.date.startsWith(dateStr));
              const isToday = i === 6;
              
              return (
                <div key={i} className="flex-1 text-center">
                  <div className="text-xs text-gray-500 mb-1">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })[0]}
                  </div>
                  <div 
                    className={`
                      h-16 rounded flex items-center justify-center
                      ${dayLog?.completed ? 'bg-green-100 border-2 border-green-300' : 'bg-gray-100'}
                      ${isToday ? 'ring-2 ring-blue-500' : ''}
                    `}
                  >
                    {dayLog?.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}