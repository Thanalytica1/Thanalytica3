import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, Zap, Calendar, Loader2 } from "lucide-react";
import { useAnalytics } from "@/hooks/use-analytics";

interface SimulatorInputs {
  sleepHours: number;
  exerciseFrequency: number; // days per week
  alcoholDrinks: number; // per week
  smokingStatus: "never" | "former" | "current";
  dietQuality: number; // 1-10 scale
  stressLevel: number; // 1-10 scale
}

interface SimulationResults {
  biologicalAgeDelta: number;
  vitalityScoreDelta: number;
  projectedLifespanDelta: number;
  trajectoryRating: "OPTIMAL" | "MODERATE" | "NEEDS_IMPROVEMENT";
}

export function HealthSimulator() {
  const analytics = useAnalytics();
  
  const [inputs, setInputs] = useState<SimulatorInputs>({
    sleepHours: 7.5,
    exerciseFrequency: 3,
    alcoholDrinks: 3,
    smokingStatus: "never",
    dietQuality: 7,
    stressLevel: 5,
  });

  const [results, setResults] = useState<SimulationResults>({
    biologicalAgeDelta: 0,
    vitalityScoreDelta: 0,
    projectedLifespanDelta: 0,
    trajectoryRating: "MODERATE",
  });

  const [isCalculating, setIsCalculating] = useState(false);

  // Simulate health impact calculations
  useEffect(() => {
    setIsCalculating(true);
    
    const calculateImpact = () => {
      let biologicalAgeDelta = 0;
      let vitalityScoreDelta = 0;
      let projectedLifespanDelta = 0;

      // Sleep impact
      if (inputs.sleepHours >= 7 && inputs.sleepHours <= 9) {
        biologicalAgeDelta -= 2;
        vitalityScoreDelta += 15;
        projectedLifespanDelta += 3;
      } else if (inputs.sleepHours < 6) {
        biologicalAgeDelta += 3;
        vitalityScoreDelta -= 20;
        projectedLifespanDelta -= 5;
      }

      // Exercise impact
      if (inputs.exerciseFrequency >= 5) {
        biologicalAgeDelta -= 4;
        vitalityScoreDelta += 20;
        projectedLifespanDelta += 8;
      } else if (inputs.exerciseFrequency >= 3) {
        biologicalAgeDelta -= 2;
        vitalityScoreDelta += 10;
        projectedLifespanDelta += 4;
      } else if (inputs.exerciseFrequency === 0) {
        biologicalAgeDelta += 5;
        vitalityScoreDelta -= 25;
        projectedLifespanDelta -= 10;
      }

      // Alcohol impact
      if (inputs.alcoholDrinks === 0) {
        biologicalAgeDelta -= 1;
        vitalityScoreDelta += 8;
        projectedLifespanDelta += 2;
      } else if (inputs.alcoholDrinks > 14) {
        biologicalAgeDelta += 4;
        vitalityScoreDelta -= 15;
        projectedLifespanDelta -= 6;
      } else if (inputs.alcoholDrinks > 7) {
        biologicalAgeDelta += 2;
        vitalityScoreDelta -= 8;
        projectedLifespanDelta -= 3;
      }

      // Smoking impact
      if (inputs.smokingStatus === "current") {
        biologicalAgeDelta += 8;
        vitalityScoreDelta -= 30;
        projectedLifespanDelta -= 15;
      } else if (inputs.smokingStatus === "never") {
        biologicalAgeDelta -= 2;
        vitalityScoreDelta += 10;
        projectedLifespanDelta += 3;
      }

      // Diet impact
      if (inputs.dietQuality >= 8) {
        biologicalAgeDelta -= 2;
        vitalityScoreDelta += 12;
        projectedLifespanDelta += 4;
      } else if (inputs.dietQuality <= 4) {
        biologicalAgeDelta += 3;
        vitalityScoreDelta -= 15;
        projectedLifespanDelta -= 5;
      }

      // Stress impact
      if (inputs.stressLevel <= 3) {
        biologicalAgeDelta -= 2;
        vitalityScoreDelta += 10;
        projectedLifespanDelta += 3;
      } else if (inputs.stressLevel >= 8) {
        biologicalAgeDelta += 3;
        vitalityScoreDelta -= 15;
        projectedLifespanDelta -= 4;
      }

      // Determine trajectory rating
      const totalVitality = 75 + vitalityScoreDelta; // Base of 75
      let trajectoryRating: "OPTIMAL" | "MODERATE" | "NEEDS_IMPROVEMENT";
      
      if (totalVitality >= 85) {
        trajectoryRating = "OPTIMAL";
      } else if (totalVitality >= 65) {
        trajectoryRating = "MODERATE";
      } else {
        trajectoryRating = "NEEDS_IMPROVEMENT";
      }

      setResults({
        biologicalAgeDelta,
        vitalityScoreDelta,
        projectedLifespanDelta,
        trajectoryRating,
      });
      
      // Track simulator usage after calculation
      analytics.simulatorUsed("health_trajectory", {
        sleepHours: inputs.sleepHours,
        exerciseFrequency: inputs.exerciseFrequency,
        alcoholDrinks: inputs.alcoholDrinks,
        smokingStatus: inputs.smokingStatus,
        dietQuality: inputs.dietQuality,
        stressLevel: inputs.stressLevel,
        biologicalAgeDelta,
        vitalityScoreDelta,
        projectedLifespanDelta,
        trajectoryRating
      });
    };

    // Add a small delay to simulate calculation time and show loading state
    const timeoutId = setTimeout(() => {
      calculateImpact();
      setIsCalculating(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputs, analytics]);

  const getDeltaDisplay = (value: number, suffix: string = "") => {
    if (value > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUp className="w-4 h-4 mr-1" />
          <span>+{value}{suffix}</span>
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center text-red-600">
          <TrendingDown className="w-4 h-4 mr-1" />
          <span>{value}{suffix}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-500">
          <Minus className="w-4 h-4 mr-1" />
          <span>No change</span>
        </div>
      );
    }
  };

  const getTrajectoryColor = (rating: string) => {
    switch (rating) {
      case "OPTIMAL":
        return "bg-green-100 text-green-800";
      case "MODERATE":
        return "bg-yellow-100 text-yellow-800";
      case "NEEDS_IMPROVEMENT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-professional-slate mb-4">Health Decision Simulator</h2>
        <p className="text-lg text-gray-600">Adjust your lifestyle inputs to see real-time impact on your longevity trajectory</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Controls */}
        <Card className="bg-white shadow-md border border-gray-100">
          <CardHeader>
            <CardTitle className="text-medical-green flex items-center">
              Lifestyle Inputs
              {isCalculating && (
                <div className="ml-2 flex items-center space-x-1">
                  <Loader2 className="w-4 h-4 animate-spin text-medical-green" />
                  <span className="text-sm text-gray-500">Recalculating...</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sleep Hours */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Sleep Hours per Night: {inputs.sleepHours}</Label>
              <Slider
                value={[inputs.sleepHours]}
                onValueChange={(value) => setInputs({ ...inputs, sleepHours: value[0] })}
                min={4}
                max={12}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>4h</span>
                <span className="text-green-600">7-9h (optimal)</span>
                <span>12h</span>
              </div>
            </div>

            {/* Exercise Frequency */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Exercise Days per Week: {inputs.exerciseFrequency}</Label>
              <Slider
                value={[inputs.exerciseFrequency]}
                onValueChange={(value) => setInputs({ ...inputs, exerciseFrequency: value[0] })}
                min={0}
                max={7}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0 days</span>
                <span className="text-green-600">5+ days (optimal)</span>
                <span>7 days</span>
              </div>
            </div>

            {/* Alcohol Consumption */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Alcohol Drinks per Week: {inputs.alcoholDrinks}</Label>
              <Slider
                value={[inputs.alcoholDrinks]}
                onValueChange={(value) => setInputs({ ...inputs, alcoholDrinks: value[0] })}
                min={0}
                max={21}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span className="text-green-600">0 (optimal)</span>
                <span>7 (moderate)</span>
                <span className="text-red-600">14+ (high)</span>
              </div>
            </div>

            {/* Smoking Status */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Smoking Status</Label>
              <Select
                value={inputs.smokingStatus}
                onValueChange={(value: "never" | "former" | "current") => 
                  setInputs({ ...inputs, smokingStatus: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never smoked</SelectItem>
                  <SelectItem value="former">Former smoker</SelectItem>
                  <SelectItem value="current">Current smoker</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Diet Quality */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Diet Quality (1-10): {inputs.dietQuality}</Label>
              <Slider
                value={[inputs.dietQuality]}
                onValueChange={(value) => setInputs({ ...inputs, dietQuality: value[0] })}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1 (poor)</span>
                <span className="text-green-600">8+ (excellent)</span>
                <span>10 (perfect)</span>
              </div>
            </div>

            {/* Stress Level */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Stress Level (1-10): {inputs.stressLevel}</Label>
              <Slider
                value={[inputs.stressLevel]}
                onValueChange={(value) => setInputs({ ...inputs, stressLevel: value[0] })}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span className="text-green-600">1 (low)</span>
                <span>5 (moderate)</span>
                <span className="text-red-600">10 (high)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Display */}
        <div className="space-y-6">
          {/* Trajectory Rating */}
          <Card className="bg-white shadow-md border border-gray-100">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-3">Simulated Trajectory</h3>
                {isCalculating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin text-medical-green" />
                    <span className="text-gray-600">Calculating...</span>
                  </div>
                ) : (
                  <Badge className={`text-lg px-4 py-2 ${getTrajectoryColor(results.trajectoryRating)}`}>
                    {results.trajectoryRating.replace("_", " ")}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Impact Metrics */}
          <Card className="bg-white shadow-md border border-gray-100">
            <CardHeader>
              <CardTitle className="text-trust-blue">Impact Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCalculating ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-5 h-5 bg-gray-300 rounded mr-3 animate-pulse"></div>
                        <div className="w-24 h-4 bg-gray-300 rounded animate-pulse"></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Zap className="text-medical-green mr-3 h-5 w-5" />
                      <span className="font-medium">Vitality Score</span>
                    </div>
                    {getDeltaDisplay(results.vitalityScoreDelta, " pts")}
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="text-trust-blue mr-3 h-5 w-5" />
                      <span className="font-medium">Biological Age</span>
                    </div>
                    {getDeltaDisplay(-results.biologicalAgeDelta, " yrs")}
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <TrendingUp className="text-vitality-gold mr-3 h-5 w-5" />
                      <span className="font-medium">Projected Lifespan</span>
                    </div>
                    {getDeltaDisplay(results.projectedLifespanDelta, " yrs")}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Key Insights */}
          <Card className="bg-gradient-to-r from-medical-green to-trust-blue text-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3">Key Insights</h3>
              {isCalculating ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                      <div className="w-full h-4 bg-white/20 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {inputs.sleepHours < 7 && (
                    <div>• Improving sleep to 7-9 hours could add up to 8 years to your lifespan</div>
                  )}
                  {inputs.exerciseFrequency < 3 && (
                    <div>• Regular exercise (3-5x/week) is one of the most powerful longevity interventions</div>
                  )}
                  {inputs.smokingStatus === "current" && (
                    <div>• Quitting smoking could add 10-15 years and dramatically improve your trajectory</div>
                  )}
                  {inputs.stressLevel > 7 && (
                    <div>• Stress management techniques could reduce biological aging by 2-3 years</div>
                  )}
                  {results.vitalityScoreDelta > 0 && (
                    <div>• Your current lifestyle choices are supporting optimal longevity</div>
                  )}
                  {!inputs.sleepHours || inputs.sleepHours >= 7 && inputs.exerciseFrequency >= 3 && inputs.smokingStatus !== "current" && inputs.stressLevel <= 7 && results.vitalityScoreDelta <= 0 && (
                    <div>• Adjust the sliders above to see personalized longevity insights</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}