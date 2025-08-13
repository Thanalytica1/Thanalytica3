// Daily Log Page - Fast, Optional Tracking with Autosave
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar,
  Save,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Moon,
  Activity,
  Droplets,
  Brain,
  Heart,
  TrendingUp,
  Edit3,
  Clock,
  Zap,
  Coffee,
  Wine,
  CloudOff,
  Cloud
} from 'lucide-react';

import { 
  useTodayLog, 
  useSaveDailyLog, 
  useYesterdayLog,
  useDailyLogSettings 
} from '@/hooks/use-daily-logs';
import { DailyLog } from '@shared/daily-log-schema';

// Quick select chips for common values
const SLEEP_QUALITY_OPTIONS = [
  { value: 1, label: '😴', description: 'Poor' },
  { value: 3, label: '😐', description: 'Fair' },
  { value: 5, label: '🙂', description: 'Good' },
  { value: 7, label: '😊', description: 'Great' },
  { value: 10, label: '🤩', description: 'Perfect' }
];

const INTENSITY_OPTIONS = [
  { value: 'low', label: 'Light', icon: '🚶' },
  { value: 'medium', label: 'Moderate', icon: '🏃' },
  { value: 'high', label: 'Intense', icon: '💪' }
];

const MOOD_OPTIONS = [
  { value: 1, emoji: '😔' },
  { value: 2, emoji: '😟' },
  { value: 3, emoji: '😐' },
  { value: 4, emoji: '🙂' },
  { value: 5, emoji: '😊' }
];

export default function DailyLog() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { log: todayLog, loading: logLoading } = useTodayLog();
  const { save, saving, lastSaved } = useSaveDailyLog();
  const { log: yesterdayLog } = useYesterdayLog();
  const { settings } = useDailyLogSettings();
  
  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['sleep', 'exercise']));
  const [localLog, setLocalLog] = useState<Partial<DailyLog>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Initialize local state from today's log
  useEffect(() => {
    if (todayLog && !logLoading) {
      setLocalLog(todayLog);
    }
  }, [todayLog, logLoading]);
  
  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };
  
  // Update field with autosave
  const updateField = useCallback((path: string[], value: any) => {
    setLocalLog(prev => {
      const updated = { ...prev };
      let current: any = updated;
      
      // Navigate to the nested field
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      
      // Set the value
      current[path[path.length - 1]] = value;
      
      // Trigger autosave
      save(updated);
      setHasUnsavedChanges(true);
      
      return updated;
    });
  }, [save]);
  
  // Copy yesterday's values
  const copyYesterdayValues = useCallback(() => {
    if (!yesterdayLog) {
      toast({
        title: 'No data from yesterday',
        description: 'No log found for yesterday to copy from.',
        variant: 'destructive'
      });
      return;
    }
    
    const copied = {
      ...localLog,
      sleep: yesterdayLog.sleep,
      exercise: yesterdayLog.exercise,
      nutrition: yesterdayLog.nutrition,
      recovery: yesterdayLog.recovery,
      mindset: yesterdayLog.mindset,
      habits: yesterdayLog.habits
    };
    
    setLocalLog(copied);
    save(copied, true);
    
    toast({
      title: 'Copied from yesterday',
      description: "Yesterday's values have been copied to today.",
    });
  }, [yesterdayLog, localLog, save, toast]);
  
  // Mark day as complete
  const markComplete = useCallback(async () => {
    const completed = { ...localLog, completed: true };
    setLocalLog(completed);
    await save(completed, true);
    
    toast({
      title: '✅ Day Complete!',
      description: 'Your daily log has been saved.',
    });
    
    // Redirect to dashboard after a short delay
    setTimeout(() => {
      setLocation('/dashboard');
    }, 1000);
  }, [localLog, save, toast, setLocation]);
  
  // Format time for display
  const formatMinutesToTime = (minutes: number | undefined) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  // Parse time input
  const parseTimeToMinutes = (time: string) => {
    const match = time.match(/(\d+)h?\s*(\d+)?m?/);
    if (!match) return 0;
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    return hours * 60 + minutes;
  };
  
  if (logLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p>Loading your daily log...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Daily Log</h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Sync Status */}
              <Badge variant={navigator.onLine ? 'default' : 'secondary'}>
                {navigator.onLine ? (
                  <>
                    <Cloud className="w-3 h-3 mr-1" />
                    Online
                  </>
                ) : (
                  <>
                    <CloudOff className="w-3 h-3 mr-1" />
                    Offline
                  </>
                )}
              </Badge>
              
              {/* Last Saved */}
              {lastSaved && (
                <Badge variant="outline">
                  <Check className="w-3 h-3 mr-1" />
                  Saved {new Date(lastSaved).toLocaleTimeString()}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyYesterdayValues}
              disabled={!yesterdayLog}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Yesterday
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={markComplete}
              className="ml-auto"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
          </div>
        </div>
        
        {/* Main Form */}
        <div className="space-y-4">
          {/* Sleep Section */}
          <Card>
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('sleep')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">Sleep</CardTitle>
                  {localLog.sleep?.timeAsleep && (
                    <Badge variant="secondary">
                      {formatMinutesToTime(localLog.sleep.timeAsleep)}
                    </Badge>
                  )}
                </div>
                {expandedSections.has('sleep') ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
                }
              </div>
            </CardHeader>
            
            <AnimatePresence>
              {expandedSections.has('sleep') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="space-y-4">
                    {/* Sleep Duration */}
                    <div>
                      <Label>Time Asleep</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Slider
                          value={[localLog.sleep?.timeAsleep || 420]}
                          onValueChange={([value]) => updateField(['sleep', 'timeAsleep'], value)}
                          min={0}
                          max={720}
                          step={15}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-16">
                          {formatMinutesToTime(localLog.sleep?.timeAsleep || 420)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Sleep Quality */}
                    <div>
                      <Label>Sleep Quality</Label>
                      <div className="flex gap-2 mt-2">
                        {SLEEP_QUALITY_OPTIONS.map(option => (
                          <Button
                            key={option.value}
                            variant={localLog.sleep?.quality === option.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateField(['sleep', 'quality'], option.value)}
                            className="flex-1"
                          >
                            <span className="text-lg mr-1">{option.label}</span>
                            <span className="text-xs hidden sm:inline">{option.description}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Wake Time */}
                    <div>
                      <Label>Wake Time</Label>
                      <Input
                        type="time"
                        value={localLog.sleep?.wakeTime || ''}
                        onChange={(e) => updateField(['sleep', 'wakeTime'], e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
          
          {/* Exercise Section */}
          <Card>
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('exercise')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-lg">Exercise</CardTitle>
                  {localLog.exercise?.minutes && (
                    <Badge variant="secondary">
                      {localLog.exercise.minutes} min
                    </Badge>
                  )}
                </div>
                {expandedSections.has('exercise') ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
                }
              </div>
            </CardHeader>
            
            <AnimatePresence>
              {expandedSections.has('exercise') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="space-y-4">
                    {/* Exercise Duration */}
                    <div>
                      <Label>Duration (minutes)</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Slider
                          value={[localLog.exercise?.minutes || 0]}
                          onValueChange={([value]) => updateField(['exercise', 'minutes'], value)}
                          min={0}
                          max={180}
                          step={5}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-12">
                          {localLog.exercise?.minutes || 0}
                        </span>
                      </div>
                    </div>
                    
                    {/* Intensity */}
                    <div>
                      <Label>Intensity</Label>
                      <div className="flex gap-2 mt-2">
                        {INTENSITY_OPTIONS.map(option => (
                          <Button
                            key={option.value}
                            variant={localLog.exercise?.intensity === option.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateField(['exercise', 'intensity'], option.value)}
                            className="flex-1"
                          >
                            <span className="mr-1">{option.icon}</span>
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Steps */}
                    <div>
                      <Label>Steps</Label>
                      <Input
                        type="number"
                        placeholder="10,000"
                        value={localLog.exercise?.steps || ''}
                        onChange={(e) => updateField(['exercise', 'steps'], parseInt(e.target.value) || 0)}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
          
          {/* Nutrition Section */}
          <Card>
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('nutrition')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-orange-600" />
                  <CardTitle className="text-lg">Nutrition</CardTitle>
                  {localLog.nutrition?.hydrationOz && (
                    <Badge variant="secondary">
                      {localLog.nutrition.hydrationOz} oz
                    </Badge>
                  )}
                </div>
                {expandedSections.has('nutrition') ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
                }
              </div>
            </CardHeader>
            
            <AnimatePresence>
              {expandedSections.has('nutrition') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="space-y-4">
                    {/* Meals */}
                    <div>
                      <Label>Meals Logged</Label>
                      <div className="flex gap-2 mt-2">
                        {[0, 1, 2, 3, 4, 5].map(num => (
                          <Button
                            key={num}
                            variant={localLog.nutrition?.meals === num ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateField(['nutrition', 'meals'], num)}
                          >
                            {num}{num === 5 && '+'}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Hydration */}
                    <div>
                      <Label>Hydration (oz)</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        <Slider
                          value={[localLog.nutrition?.hydrationOz || 0]}
                          onValueChange={([value]) => updateField(['nutrition', 'hydrationOz'], value)}
                          min={0}
                          max={128}
                          step={8}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-12">
                          {localLog.nutrition?.hydrationOz || 0}
                        </span>
                      </div>
                    </div>
                    
                    {/* Alcohol */}
                    <div>
                      <Label>Alcohol (drinks)</Label>
                      <div className="flex gap-2 mt-2">
                        {[0, 1, 2, 3, 4, 5].map(num => (
                          <Button
                            key={num}
                            variant={localLog.nutrition?.alcoholDrinks === num ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateField(['nutrition', 'alcoholDrinks'], num)}
                          >
                            {num === 0 ? <Wine className="w-4 h-4 line-through" /> : num}
                            {num === 5 && '+'}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
          
          {/* Recovery Section */}
          <Card>
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('recovery')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  <CardTitle className="text-lg">Recovery</CardTitle>
                </div>
                {expandedSections.has('recovery') ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
                }
              </div>
            </CardHeader>
            
            <AnimatePresence>
              {expandedSections.has('recovery') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="space-y-4">
                    {/* RPE */}
                    <div>
                      <Label>Perceived Exertion (1-10)</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <Slider
                          value={[localLog.recovery?.rpe || 5]}
                          onValueChange={([value]) => updateField(['recovery', 'rpe'], value)}
                          min={1}
                          max={10}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-8">
                          {localLog.recovery?.rpe || 5}
                        </span>
                      </div>
                    </div>
                    
                    {/* Soreness */}
                    <div>
                      <Label>Soreness Level</Label>
                      <div className="flex gap-2 mt-2">
                        {[1, 2, 3, 4, 5].map(num => (
                          <Button
                            key={num}
                            variant={localLog.recovery?.soreness === num ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateField(['recovery', 'soreness'], num)}
                            className="flex-1"
                          >
                            {num}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Resting HR */}
                    <div>
                      <Label>Resting Heart Rate (bpm)</Label>
                      <Input
                        type="number"
                        placeholder="60"
                        value={localLog.recovery?.restingHr || ''}
                        onChange={(e) => updateField(['recovery', 'restingHr'], parseInt(e.target.value) || 0)}
                        className="mt-2"
                      />
                    </div>
                    
                    {/* HRV */}
                    <div>
                      <Label>HRV (ms)</Label>
                      <Input
                        type="number"
                        placeholder="50"
                        value={localLog.recovery?.hrv || ''}
                        onChange={(e) => updateField(['recovery', 'hrv'], parseInt(e.target.value) || 0)}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
          
          {/* Mindset Section */}
          <Card>
            <CardHeader 
              className="cursor-pointer"
              onClick={() => toggleSection('mindset')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-lg">Mindset</CardTitle>
                  {localLog.mindset?.mood && (
                    <span className="text-lg">
                      {MOOD_OPTIONS.find(m => m.value === localLog.mindset?.mood)?.emoji}
                    </span>
                  )}
                </div>
                {expandedSections.has('mindset') ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
                }
              </div>
            </CardHeader>
            
            <AnimatePresence>
              {expandedSections.has('mindset') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="space-y-4">
                    {/* Mood */}
                    <div>
                      <Label>Mood</Label>
                      <div className="flex gap-2 mt-2">
                        {MOOD_OPTIONS.map(option => (
                          <Button
                            key={option.value}
                            variant={localLog.mindset?.mood === option.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateField(['mindset', 'mood'], option.value)}
                            className="flex-1 text-lg"
                          >
                            {option.emoji}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Stress */}
                    <div>
                      <Label>Stress Level</Label>
                      <div className="flex gap-2 mt-2">
                        {[1, 2, 3, 4, 5].map(num => (
                          <Button
                            key={num}
                            variant={localLog.mindset?.stress === num ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateField(['mindset', 'stress'], num)}
                            className="flex-1"
                          >
                            {num}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
          
          {/* Notes Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-gray-600" />
                <CardTitle className="text-lg">Notes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Any notes about today... (optional)"
                value={localLog.notes || ''}
                onChange={(e) => updateField(['notes'], e.target.value)}
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                {localLog.notes?.length || 0}/200 characters
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Floating Save Button */}
        <div className="fixed bottom-4 right-4 left-4 max-w-2xl mx-auto">
          <Button
            size="lg"
            className="w-full shadow-lg"
            onClick={markComplete}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Complete Day & Return to Dashboard
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}