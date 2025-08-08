import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Target, 
  Zap, 
  Heart, 
  Brain, 
  Activity, 
  Loader2,
  TrendingUp,
  Star,
  Clock,
  Shield
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateHealthAssessment } from "@/hooks/use-health-data";
import { insertHealthAssessmentSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Real-time insights calculation
interface BiologicalAgeResult {
  biologicalAge: number;
  difference: number;
  yearsPotential: number;
  confidence: 'low' | 'medium' | 'high';
  topFactors: string[];
  improvements: Array<{
    factor: string;
    impact: string;
    yearsGained: number;
  }>;
}

function calculateRealTimeInsights(formData: Partial<FormData>): BiologicalAgeResult {
  const chronologicalAge = formData.age || 35;
  let biologicalAge = chronologicalAge;
  const factors: string[] = [];
  const improvements: Array<{ factor: string; impact: string; yearsGained: number }> = [];
  
  // Sleep optimization
  if (formData.sleepQuality) {
    switch (formData.sleepQuality) {
      case 'excellent':
        biologicalAge -= 3;
        factors.push('Optimal sleep quality');
        break;
      case 'good':
        biologicalAge -= 1;
        factors.push('Good sleep quality');
        improvements.push({
          factor: 'sleep',
          impact: 'Optimize sleep routine',
          yearsGained: 2
        });
        break;
      case 'fair':
        biologicalAge += 1;
        improvements.push({
          factor: 'sleep',
          impact: 'Improve sleep quality',
          yearsGained: 4
        });
        break;
      case 'poor':
        biologicalAge += 3;
        improvements.push({
          factor: 'sleep',
          impact: 'Address sleep issues',
          yearsGained: 6
        });
        break;
    }
  }
  
  // Exercise impact
  if (formData.exerciseFrequency) {
    switch (formData.exerciseFrequency) {
      case 'daily':
        biologicalAge -= 4;
        factors.push('Daily exercise routine');
        break;
      case '5-6-times':
        biologicalAge -= 3;
        factors.push('Very active lifestyle');
        break;
      case '3-4-times':
        biologicalAge -= 2;
        factors.push('Regular exercise');
        improvements.push({
          factor: 'exercise',
          impact: 'Increase exercise frequency',
          yearsGained: 2
        });
        break;
      case '1-2-times':
        biologicalAge += 1;
        improvements.push({
          factor: 'exercise',
          impact: 'Build consistent exercise habit',
          yearsGained: 5
        });
        break;
      case 'none':
        biologicalAge += 3;
        improvements.push({
          factor: 'exercise',
          impact: 'Start regular exercise',
          yearsGained: 7
        });
        break;
    }
  }
  
  // Diet pattern impact
  if (formData.dietPattern) {
    switch (formData.dietPattern) {
      case 'mediterranean':
        biologicalAge -= 2;
        factors.push('Mediterranean diet');
        break;
      case 'plant-based':
        biologicalAge -= 1.5;
        factors.push('Plant-based nutrition');
        break;
      case 'balanced':
        biologicalAge -= 0.5;
        factors.push('Balanced diet');
        break;
      case 'western':
        biologicalAge += 1;
        improvements.push({
          factor: 'nutrition',
          impact: 'Optimize dietary patterns',
          yearsGained: 3
        });
        break;
    }
  }
  
  // Smoking impact
  if (formData.smokingStatus) {
    switch (formData.smokingStatus) {
      case 'never':
        biologicalAge -= 1;
        factors.push('Non-smoker advantage');
        break;
      case 'former':
        biologicalAge += 1;
        factors.push('Smoking cessation benefit');
        break;
      case 'occasional':
        biologicalAge += 3;
        improvements.push({
          factor: 'smoking',
          impact: 'Eliminate smoking',
          yearsGained: 8
        });
        break;
      case 'regular':
        biologicalAge += 6;
        improvements.push({
          factor: 'smoking',
          impact: 'Quit smoking immediately',
          yearsGained: 12
        });
        break;
    }
  }
  
  // Calculate bounds and potential
  biologicalAge = Math.max(biologicalAge, chronologicalAge * 0.6);
  biologicalAge = Math.min(biologicalAge, chronologicalAge * 1.4);
  
  const difference = chronologicalAge - biologicalAge;
  const yearsPotential = improvements.reduce((total, imp) => total + imp.yearsGained, 0);
  
  // Determine confidence
  const dataPoints = Object.values(formData).filter(Boolean).length;
  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (dataPoints >= 5) confidence = 'high';
  else if (dataPoints >= 3) confidence = 'medium';
  
  return {
    biologicalAge: Math.round(biologicalAge * 10) / 10,
    difference: Math.round(difference * 10) / 10,
    yearsPotential: Math.round(yearsPotential),
    confidence,
    topFactors: factors.slice(0, 3),
    improvements: improvements.slice(0, 3)
  };
}

const guidedSchema = insertHealthAssessmentSchema.extend({
  exerciseTypes: z.array(z.string()).min(1, "Select at least one exercise type"),
  healthPriorities: z.array(z.string()).min(1, "Select at least one health priority"),
  longevityTarget: z.number().min(80).max(150),
});

type FormData = z.infer<typeof guidedSchema>;

// Onboarding steps with enhanced UX
const onboardingSteps = [
  { id: 'vision', title: 'Your Longevity Vision', icon: Target },
  { id: 'baseline', title: 'Health Baseline', icon: Heart },
  { id: 'lifestyle', title: 'Lifestyle Patterns', icon: Activity },
  { id: 'optimization', title: 'Optimization Areas', icon: Zap },
  { id: 'insights', title: 'Personal Insights', icon: Brain },
];

interface StepProps {
  formData: Partial<FormData>;
  onUpdate: (data: Partial<FormData>) => void;
  onNext: () => void;
  insights: BiologicalAgeResult;
}

// Step 1: Vision Setting
function VisionStep({ formData, onUpdate, onNext, insights }: StepProps) {
  const [selectedTarget, setSelectedTarget] = useState(formData.longevityTarget || 100);
  
  const longevityOptions = [
    { age: 100, label: 'Live to 100', description: 'Healthy centenarian', color: 'blue' },
    { age: 120, label: 'Live to 120', description: 'Supercentenarian', color: 'purple' },
    { age: 150, label: 'Live to 150', description: 'Longevity pioneer', color: 'gold' },
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-4">
        <Target className="w-12 h-12 mx-auto text-blue-500" />
        <h2 className="text-3xl font-bold">What's Your Longevity Vision?</h2>
        <p className="text-gray-600">
          Choose your target lifespan. This isn't just a number—it's your commitment to optimization.
        </p>
      </div>
      
      <div className="grid gap-4">
        {longevityOptions.map((option) => (
          <Card
            key={option.age}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedTarget === option.age ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => {
              setSelectedTarget(option.age);
              onUpdate({ longevityTarget: option.age });
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{option.label}</h3>
                  <p className="text-gray-600">{option.description}</p>
                </div>
                <Badge variant={selectedTarget === option.age ? 'default' : 'outline'}>
                  {option.age} years
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {selectedTarget && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Your Longevity Journey Starts Now</h3>
            <p>Target: Live to {selectedTarget} with optimal health and vitality</p>
          </div>
          
          <Button onClick={onNext} size="lg" className="w-full">
            Begin Your Assessment <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

// Step 2: Health Baseline
function BaselineStep({ formData, onUpdate, onNext, insights }: StepProps) {
  const [currentAge, setCurrentAge] = useState(formData.age || 35);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-4">
        <Heart className="w-12 h-12 mx-auto text-red-500" />
        <h2 className="text-3xl font-bold">Building Your Health Profile</h2>
        <p className="text-gray-600">
          Let's establish your baseline to calculate your biological age
        </p>
      </div>
      
      {/* Age Input with Real-time Feedback */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <label className="text-lg font-medium">What's your current age?</label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="18"
                max="80"
                value={currentAge}
                onChange={(e) => {
                  const age = parseInt(e.target.value);
                  setCurrentAge(age);
                  onUpdate({ age });
                }}
                className="flex-1"
              />
              <Badge variant="outline" className="text-lg px-3 py-1">
                {currentAge} years
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Gender Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <label className="text-lg font-medium">Gender</label>
            <div className="grid grid-cols-3 gap-3">
              {['male', 'female', 'other'].map((gender) => (
                <Button
                  key={gender}
                  variant={formData.gender === gender ? 'default' : 'outline'}
                  onClick={() => onUpdate({ gender })}
                  className="capitalize"
                >
                  {gender}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Real-time Insight Preview */}
      {formData.age && formData.gender && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold">Early Insight</h3>
          </div>
          <p className="text-gray-700">
            Based on your age and gender, we're starting to build your personalized longevity profile. 
            Keep going to unlock deeper insights!
          </p>
        </motion.div>
      )}
      
      <Button 
        onClick={onNext} 
        size="lg" 
        className="w-full"
        disabled={!formData.age || !formData.gender}
      >
        Continue Building Profile <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </motion.div>
  );
}

// Step 3: Lifestyle Patterns
function LifestyleStep({ formData, onUpdate, onNext, insights }: StepProps) {
  const [showImpact, setShowImpact] = useState(false);
  
  useEffect(() => {
    if (formData.sleepQuality || formData.exerciseFrequency) {
      setShowImpact(true);
    }
  }, [formData.sleepQuality, formData.exerciseFrequency]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-4">
        <Activity className="w-12 h-12 mx-auto text-orange-500" />
        <h2 className="text-3xl font-bold">Your Lifestyle Patterns</h2>
        <p className="text-gray-600">
          These choices have the biggest impact on your longevity
        </p>
      </div>
      
      {/* Sleep Quality */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <label className="text-lg font-medium">Sleep Quality</label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'excellent', label: 'Excellent', impact: '+3 years' },
                { value: 'good', label: 'Good', impact: '+1 year' },
                { value: 'fair', label: 'Fair', impact: '-1 year' },
                { value: 'poor', label: 'Poor', impact: '-3 years' }
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={formData.sleepQuality === option.value ? 'default' : 'outline'}
                  onClick={() => onUpdate({ sleepQuality: option.value })}
                  className="flex flex-col h-auto p-4"
                >
                  <span>{option.label}</span>
                  <span className="text-xs opacity-70">{option.impact}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Exercise Frequency */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-500" />
              <label className="text-lg font-medium">Exercise Frequency</label>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { value: 'daily', label: 'Daily', impact: '+4 years' },
                { value: '5-6-times', label: '5-6 times/week', impact: '+3 years' },
                { value: '3-4-times', label: '3-4 times/week', impact: '+2 years' },
                { value: '1-2-times', label: '1-2 times/week', impact: '-1 year' },
                { value: 'none', label: 'Rarely/Never', impact: '-3 years' }
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={formData.exerciseFrequency === option.value ? 'default' : 'outline'}
                  onClick={() => onUpdate({ exerciseFrequency: option.value })}
                  className="flex justify-between"
                >
                  <span>{option.label}</span>
                  <Badge variant="secondary" className="text-xs">
                    {option.impact}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Real-time Impact Display */}
      <AnimatePresence>
        {showImpact && insights.difference !== 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold">Live Impact</h3>
              </div>
              <Badge variant="outline" className="text-sm">
                {insights.confidence} confidence
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {insights.biologicalAge}
                </div>
                <div className="text-sm text-gray-600">Biological Age</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${
                  insights.difference > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {insights.difference > 0 ? '+' : ''}{insights.difference} years
                </div>
                <div className="text-sm text-gray-600">vs Chronological</div>
              </div>
            </div>
            
            {insights.topFactors.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Contributing Factors:</div>
                <div className="flex flex-wrap gap-2">
                  {insights.topFactors.map((factor, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <Button 
        onClick={onNext} 
        size="lg" 
        className="w-full"
        disabled={!formData.sleepQuality || !formData.exerciseFrequency}
      >
        Continue Assessment <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </motion.div>
  );
}

export { VisionStep, BaselineStep, LifestyleStep };
export type { FormData, BiologicalAgeResult };
export { calculateRealTimeInsights, onboardingSteps, guidedSchema };
