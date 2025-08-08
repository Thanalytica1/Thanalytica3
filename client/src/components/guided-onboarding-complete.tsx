import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  Brain, 
  ArrowRight, 
  Star, 
  TrendingUp, 
  Target,
  CheckCircle,
  Sparkles,
  Clock,
  Shield,
  Heart,
  Loader2
} from "lucide-react";
import type { FormData, BiologicalAgeResult } from "./guided-onboarding";

interface StepProps {
  formData: Partial<FormData>;
  onUpdate: (data: Partial<FormData>) => void;
  onNext: () => void;
  insights: BiologicalAgeResult;
}

// Step 4: Optimization Areas
function OptimizationStep({ formData, onUpdate, onNext, insights }: StepProps) {
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(
    formData.healthPriorities || []
  );
  
  const healthPriorities = [
    { id: 'longevity', label: 'Maximize Lifespan', icon: Target, description: 'Add healthy years to your life' },
    { id: 'energy', label: 'Boost Energy', icon: Zap, description: 'Feel more vibrant and energetic' },
    { id: 'cognitive', label: 'Brain Health', icon: Brain, description: 'Maintain sharp mental function' },
    { id: 'fitness', label: 'Physical Fitness', icon: Heart, description: 'Build strength and endurance' },
    { id: 'recovery', label: 'Sleep & Recovery', icon: Shield, description: 'Optimize rest and restoration' },
    { id: 'stress', label: 'Stress Management', icon: Clock, description: 'Build resilience and calm' },
  ];
  
  const togglePriority = (priorityId: string) => {
    const updated = selectedPriorities.includes(priorityId)
      ? selectedPriorities.filter(p => p !== priorityId)
      : [...selectedPriorities, priorityId];
    
    setSelectedPriorities(updated);
    onUpdate({ healthPriorities: updated });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-4">
        <Zap className="w-12 h-12 mx-auto text-yellow-500" />
        <h2 className="text-3xl font-bold">Your Optimization Priorities</h2>
        <p className="text-gray-600">
          Choose your top health goals. We'll create a personalized plan to achieve them.
        </p>
      </div>
      
      {/* Potential Impact Preview */}
      {insights.yearsPotential > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold">Your Optimization Potential</h3>
            </div>
            <Badge className="bg-yellow-500">
              +{insights.yearsPotential} years possible
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.improvements.map((improvement, idx) => (
              <div key={idx} className="text-center">
                <div className="text-lg font-bold text-orange-600">
                  +{improvement.yearsGained} years
                </div>
                <div className="text-sm text-gray-700 capitalize">
                  {improvement.factor}
                </div>
                <div className="text-xs text-gray-600">
                  {improvement.impact}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Priority Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {healthPriorities.map((priority) => {
          const isSelected = selectedPriorities.includes(priority.id);
          const Icon = priority.icon;
          
          return (
            <Card
              key={priority.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => togglePriority(priority.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${
                    isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{priority.label}</h3>
                    <p className="text-sm text-gray-600">{priority.description}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <Button 
        onClick={onNext} 
        size="lg" 
        className="w-full"
        disabled={selectedPriorities.length === 0}
      >
        Generate My Insights <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </motion.div>
  );
}

// Step 5: Personal Insights Generation
function InsightsStep({ formData, onNext, insights }: StepProps) {
  const [isGenerating, setIsGenerating] = useState(true);
  const [showResults, setShowResults] = useState(false);
  
  // Simulate insights generation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsGenerating(false);
      setShowResults(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const longevityProjection = formData.longevityTarget || 100;
  const optimizedLifespan = Math.min(
    longevityProjection,
    formData.age! + (90 - insights.biologicalAge) + insights.yearsPotential
  );
  
  if (isGenerating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="w-12 h-12 mx-auto text-purple-500" />
          </motion.div>
          <h2 className="text-3xl font-bold">Generating Your Personalized Insights</h2>
          <p className="text-gray-600">
            Analyzing your data to create your longevity optimization plan...
          </p>
        </div>
        
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <span>Processing your health baseline...</span>
              </div>
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 animate-spin text-green-500" />
                <span>Calculating biological age...</span>
              </div>
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                <span>Identifying optimization opportunities...</span>
              </div>
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                <span>Creating your personalized plan...</span>
              </div>
            </div>
            
            <div className="mt-6">
              <Progress value={66} className="h-2" />
              <p className="text-center text-sm text-gray-600 mt-2">
                Almost ready...
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
        >
          <Sparkles className="w-12 h-12 mx-auto text-gold-500" />
        </motion.div>
        <h2 className="text-3xl font-bold">Your Longevity Insights Are Ready!</h2>
        <p className="text-gray-600">
          Here's what we discovered about your health optimization potential
        </p>
      </div>
      
      {/* Key Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Biological Age */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-bl-full opacity-10"></div>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span>Biological Age</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {insights.biologicalAge} years
            </div>
            <div className={`text-sm ${
              insights.difference > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {insights.difference > 0 ? '' : '+'}
              {Math.abs(insights.difference)} years vs chronological age
            </div>
          </CardContent>
        </Card>
        
        {/* Optimization Potential */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-bl-full opacity-10"></div>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span>Potential Gain</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              +{insights.yearsPotential} years
            </div>
            <div className="text-sm text-gray-600">
              Through targeted optimization
            </div>
          </CardContent>
        </Card>
        
        {/* Optimized Lifespan */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-bl-full opacity-10"></div>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-500" />
              <span>Target Lifespan</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {optimizedLifespan} years
            </div>
            <div className="text-sm text-gray-600">
              With full optimization
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Contributing Factors */}
      {insights.topFactors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>Your Health Strengths</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {insights.topFactors.map((factor, idx) => (
                <Badge key={idx} variant="secondary" className="text-sm">
                  ✓ {factor}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Next Steps Preview */}
      {insights.improvements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-orange-500" />
              <span>Your Optimization Opportunities</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.improvements.map((improvement, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium capitalize">{improvement.factor}</div>
                    <div className="text-sm text-gray-600">{improvement.impact}</div>
                  </div>
                  <Badge className="bg-orange-500">
                    +{improvement.yearsGained} years
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="text-center space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
          <h3 className="text-xl font-semibold mb-2">Ready to Start Your 150-Year Journey?</h3>
          <p className="text-gray-700">
            Your personalized dashboard awaits with specific actions to achieve these results.
          </p>
        </div>
        
        <Button onClick={onNext} size="lg" className="w-full">
          Enter Your Dashboard <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

export { OptimizationStep, InsightsStep };
