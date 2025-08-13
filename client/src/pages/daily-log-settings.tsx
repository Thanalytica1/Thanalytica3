// Daily Log Settings Page - Configure habits, units, and visibility
import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  Save,
  Moon,
  Activity,
  Coffee,
  Heart,
  Brain,
  CheckSquare
} from 'lucide-react';
import { useDailyLogSettings } from '@/hooks/use-daily-logs';
import { DailyLogSettings } from '@shared/daily-log-schema';

const DEFAULT_HABITS = [
  { key: 'meditation', label: 'Meditation', icon: '🧘', category: 'mindfulness' },
  { key: 'no_sugar', label: 'No Added Sugar', icon: '🚫', category: 'nutrition' },
  { key: 'ten_k_steps', label: '10K Steps', icon: '👟', category: 'fitness' },
  { key: 'cold_shower', label: 'Cold Shower', icon: '🚿', category: 'health' },
  { key: 'journal', label: 'Journaling', icon: '📝', category: 'mindfulness' },
  { key: 'screen_time_limit', label: 'Screen Time Limit', icon: '📱', category: 'other' },
  { key: 'early_bedtime', label: 'Bed by 10pm', icon: '🛏️', category: 'health' },
  { key: 'vitamins', label: 'Take Vitamins', icon: '💊', category: 'health' }
];

const FIELD_SECTIONS = [
  { key: 'sleep', label: 'Sleep Tracking', icon: Moon, description: 'Sleep duration, quality, and wake time' },
  { key: 'exercise', label: 'Exercise Tracking', icon: Activity, description: 'Duration, intensity, and steps' },
  { key: 'nutrition', label: 'Nutrition Tracking', icon: Coffee, description: 'Meals, hydration, and alcohol' },
  { key: 'recovery', label: 'Recovery Metrics', icon: Heart, description: 'RPE, soreness, heart rate, and HRV' },
  { key: 'mindset', label: 'Mindset Tracking', icon: Brain, description: 'Mood and stress levels' },
  { key: 'habits', label: 'Custom Habits', icon: CheckSquare, description: 'Track personal habits and goals' },
];

export default function DailyLogSettings() {
  const { toast } = useToast();
  const { settings, loading, updateSettings } = useDailyLogSettings();
  const [localSettings, setLocalSettings] = useState<DailyLogSettings>(settings || {});
  const [newHabit, setNewHabit] = useState({ key: '', label: '', icon: '', category: 'other' });
  const [saving, setSaving] = useState(false);
  
  // Update local settings when props change
  useState(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  });
  
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await updateSettings(localSettings);
      toast({
        title: 'Settings saved',
        description: 'Your daily log preferences have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Save failed',
        description: 'Could not save your settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  }, [localSettings, updateSettings, toast]);
  
  const toggleFieldVisibility = useCallback((field: string) => {
    setLocalSettings(prev => ({
      ...prev,
      visibleFields: {
        ...prev.visibleFields,
        [field]: !prev.visibleFields?.[field]
      }
    }));
  }, []);
  
  const updateUnits = useCallback((unit: string, value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      units: {
        ...prev.units,
        [unit]: value as any
      }
    }));
  }, []);
  
  const addCustomHabit = useCallback(() => {
    if (!newHabit.key || !newHabit.label) {
      toast({
        title: 'Invalid habit',
        description: 'Please provide both a key and label for the habit.',
        variant: 'destructive'
      });
      return;
    }
    
    const habitExists = localSettings.habitDefinitions?.some(h => h.key === newHabit.key);
    if (habitExists) {
      toast({
        title: 'Habit exists',
        description: 'A habit with this key already exists.',
        variant: 'destructive'
      });
      return;
    }
    
    setLocalSettings(prev => ({
      ...prev,
      habitDefinitions: [
        ...(prev.habitDefinitions || []),
        { ...newHabit, category: newHabit.category as any }
      ]
    }));
    
    setNewHabit({ key: '', label: '', icon: '', category: 'other' });
  }, [newHabit, localSettings.habitDefinitions, toast]);
  
  const removeHabit = useCallback((key: string) => {
    setLocalSettings(prev => ({
      ...prev,
      habitDefinitions: prev.habitDefinitions?.filter(h => h.key !== key) || []
    }));
  }, []);
  
  const addPresetHabit = useCallback((habit: typeof DEFAULT_HABITS[0]) => {
    const habitExists = localSettings.habitDefinitions?.some(h => h.key === habit.key);
    if (habitExists) return;
    
    setLocalSettings(prev => ({
      ...prev,
      habitDefinitions: [
        ...(prev.habitDefinitions || []),
        habit
      ]
    }));
  }, [localSettings.habitDefinitions]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p>Loading settings...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Daily Log Settings
            </h1>
            <p className="text-gray-600 mt-1">Customize your daily tracking experience</p>
          </div>
          
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
        
        {/* Field Visibility */}
        <Card>
          <CardHeader>
            <CardTitle>Field Visibility</CardTitle>
            <p className="text-sm text-gray-600">Choose which sections to show in your daily log</p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {FIELD_SECTIONS.map(section => {
                const Icon = section.icon;
                const isVisible = localSettings.visibleFields?.[section.key] !== false;
                
                return (
                  <div key={section.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium">{section.label}</div>
                        <div className="text-sm text-gray-500">{section.description}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isVisible ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                      <Switch
                        checked={isVisible}
                        onCheckedChange={() => toggleFieldVisibility(section.key)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Units */}
        <Card>
          <CardHeader>
            <CardTitle>Units</CardTitle>
            <p className="text-sm text-gray-600">Set your preferred units for measurements</p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Hydration</Label>
                <Select
                  value={localSettings.units?.hydration || 'oz'}
                  onValueChange={(value) => updateUnits('hydration', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oz">Fluid Ounces (oz)</SelectItem>
                    <SelectItem value="ml">Milliliters (ml)</SelectItem>
                    <SelectItem value="cups">Cups</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Distance</Label>
                <Select
                  value={localSettings.units?.distance || 'miles'}
                  onValueChange={(value) => updateUnits('distance', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="miles">Miles</SelectItem>
                    <SelectItem value="km">Kilometers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Weight</Label>
                <Select
                  value={localSettings.units?.weight || 'lbs'}
                  onValueChange={(value) => updateUnits('weight', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Custom Habits */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Habits</CardTitle>
            <p className="text-sm text-gray-600">Track personal habits and daily goals</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Habits */}
            {localSettings.habitDefinitions && localSettings.habitDefinitions.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Current Habits</h4>
                <div className="grid gap-2">
                  {localSettings.habitDefinitions.map(habit => (
                    <div key={habit.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{habit.icon}</span>
                        <div>
                          <div className="font-medium">{habit.label}</div>
                          <div className="text-sm text-gray-500 capitalize">{habit.category}</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHabit(habit.key)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Add Custom Habit */}
            <div>
              <h4 className="font-medium mb-3">Add Custom Habit</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Input
                  placeholder="Key (e.g., meditation)"
                  value={newHabit.key}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, key: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                />
                <Input
                  placeholder="Label (e.g., Meditation)"
                  value={newHabit.label}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, label: e.target.value }))}
                />
                <Input
                  placeholder="Icon (emoji)"
                  value={newHabit.icon}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, icon: e.target.value }))}
                />
                <div className="flex gap-2">
                  <Select
                    value={newHabit.category}
                    onValueChange={(value) => setNewHabit(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="nutrition">Nutrition</SelectItem>
                      <SelectItem value="mindfulness">Mindfulness</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={addCustomHabit} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Preset Habits */}
            <div>
              <h4 className="font-medium mb-3">Add Preset Habits</h4>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_HABITS.filter(habit => 
                  !localSettings.habitDefinitions?.some(h => h.key === habit.key)
                ).map(habit => (
                  <Badge
                    key={habit.key}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => addPresetHabit(habit)}
                  >
                    <span className="mr-1">{habit.icon}</span>
                    {habit.label}
                    <Plus className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Default Values */}
        <Card>
          <CardHeader>
            <CardTitle>Default Behavior</CardTitle>
            <p className="text-sm text-gray-600">Configure how new logs are initialized</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Copy from yesterday</div>
                  <div className="text-sm text-gray-500">
                    Automatically prefill today's log with yesterday's values
                  </div>
                </div>
                <Switch
                  checked={localSettings.defaultValues?.copyFromYesterday || false}
                  onCheckedChange={(checked) => 
                    setLocalSettings(prev => ({
                      ...prev,
                      defaultValues: {
                        ...prev.defaultValues,
                        copyFromYesterday: checked
                      }
                    }))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}