import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Calendar,
  BookOpen,
  Lightbulb,
  RotateCcw,
  Save
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useHealthAssessment } from "@/hooks/use-health-data";
import {
  createLifestyleFactors,
  calculateLongevityProjection,
  type LifestyleFactor,
  type SimulationResult
} from "./health-simulator-core";

export function HealthSimulator() {
  const { user } = useAuth();
  const { data: assessment } = useHealthAssessment(user?.id || "");
  
  const [factors, setFactors] = useState<LifestyleFactor[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Initialize factors when assessment loads
  useEffect(() => {
    setFactors(createLifestyleFactors(assessment));
  }, [assessment]);
  
  // Calculate real-time projection
  const simulation = useMemo(() => {
    if (factors.length === 0) return null;
    return calculateLongevityProjection(factors, assessment?.age || 35);
  }, [factors, assessment?.age]);
  
  const handleFactorChange = (factorId: string, value: number[]) => {
    setFactors(prev => prev.map(factor => 
      factor.id === factorId 
        ? { ...factor, current: value[0] }
        : factor
    ));
  };
  
  const resetToBaseline = () => {
    setFactors(createLifestyleFactors(assessment));
  };
  
  const optimizeAll = () => {
    setFactors(prev => prev.map(factor => ({
      ...factor,
      current: factor.optimal
    })));
  };
  
  if (!simulation) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Loading your health simulation...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Health Decision Simulator
        </h1>
        <p className="text-gray-600 mb-4">
          Adjust lifestyle factors and see immediate impact on your longevity projection
        </p>
        <Button
          variant="outline"
          onClick={() => setShowExplanation(!showExplanation)}
          className="mb-4"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          {showExplanation ? 'Hide' : 'Show'} Scientific Explanation
        </Button>
      </div>
      
      {/* Scientific Explanation */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <Alert>
              <Lightbulb className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>How it works:</strong> This simulator uses evidence-based research from 600+ studies to project how lifestyle changes affect longevity.</p>
                  <p><strong>Calculations:</strong> Each factor has a coefficient based on meta-analyses of population studies. We apply diminishing returns and threshold effects where research indicates.</p>
                  <p><strong>Confidence:</strong> Projections include ±10% confidence intervals. Individual results may vary based on genetics, environment, and other factors not captured here.</p>
                  <p><strong>Sources:</strong> Harvard Health Studies, Blue Zones Research, WHO Global Health Observatory, and peer-reviewed journals.</p>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Quick Scenarios</span>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={resetToBaseline}>
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                  <Button size="sm" onClick={optimizeAll}>
                    <Target className="w-4 h-4 mr-1" />
                    Optimize All
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>
          
          {/* Lifestyle Factor Controls */}
          {factors.map((factor) => {
            const Icon = factor.icon;
            const isOptimal = Math.abs(factor.current - factor.optimal) < 0.5;
            const trend = factor.current > factor.optimal ? 'above' : 
                         factor.current < factor.optimal ? 'below' : 'optimal';
            
            return (
              <Card key={factor.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        isOptimal ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{factor.label}</h3>
                        <p className="text-sm text-gray-600">{factor.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {factor.current.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {factor.unit}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Slider
                      value={[factor.current]}
                      onValueChange={(value) => handleFactorChange(factor.id, value)}
                      max={factor.max}
                      min={factor.min}
                      step={0.1}
                      className="w-full"
                    />
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{factor.min}</span>
                      <span className="font-medium text-green-600">
                        Optimal: {factor.optimal}
                      </span>
                      <span>{factor.max}</span>
                    </div>
                    
                    {/* Trend indicator */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {trend === 'optimal' ? (
                          <Badge className="bg-green-500">
                            <Target className="w-3 h-3 mr-1" />
                            Optimal
                          </Badge>
                        ) : trend === 'above' ? (
                          <Badge variant="secondary">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Above optimal
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Below optimal
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Studies: {factor.evidence.studyCount} | 
                        Confidence: {factor.evidence.confidence}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Right Column - Results */}
        <div className="space-y-6">
          {/* Main Projection */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-bl-full opacity-10"></div>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <span>Longevity Projection</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-4xl font-bold text-blue-600">
                  {simulation.projectedLifespan} years
                </div>
                <div className="text-sm text-gray-600">
                  Range: {simulation.confidenceInterval[0]} - {simulation.confidenceInterval[1]} years
                </div>
                
                <div className={`text-lg font-semibold ${
                  simulation.yearsDifference > 0 ? 'text-green-600' : 
                  simulation.yearsDifference < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {simulation.yearsDifference > 0 ? '+' : ''}
                  {simulation.yearsDifference} years from baseline
                </div>
                
                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600 mb-2">Biological Age</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {simulation.biologicalAge} years
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Top Factors */}
          {simulation.topFactors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  <span>Biggest Impacts</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {simulation.topFactors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{factor.factor}</span>
                    <Badge 
                      variant={factor.impact > 0 ? "default" : "destructive"}
                      className={factor.impact > 0 ? "bg-green-500" : ""}
                    >
                      {factor.impact > 0 ? '+' : ''}{factor.impact.toFixed(1)}y
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          
          {/* Recommendations */}
          {simulation.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-green-500" />
                  <span>Top Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {simulation.recommendations.map((rec, index) => (
                  <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{rec.factor}</span>
                      <Badge className="bg-green-500">
                        +{rec.potentialGain.toFixed(1)}y
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600">
                      Current: {rec.currentValue.toFixed(1)} → 
                      Target: {rec.recommendedValue.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          rec.difficulty === 'easy' ? 'border-green-500 text-green-700' :
                          rec.difficulty === 'medium' ? 'border-yellow-500 text-yellow-700' :
                          'border-red-500 text-red-700'
                        }`}
                      >
                        {rec.difficulty} change
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}