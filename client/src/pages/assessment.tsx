import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ProgressBar } from "@/components/progress-bar";
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, RefreshCw, Save, TrendingDown, TrendingUp, Activity } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateHealthAssessment } from "@/hooks/use-health-data";
import { insertHealthAssessmentSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ApiError, NetworkTimeoutError } from "@/lib/queryClient";
// Analytics removed for resource optimization

const steps = ["Basic Info", "Lifestyle", "Medical History", "Exercise", "Goals", "Review"];

/**
 * Calculate preliminary biological age based on basic inputs
 */
function calculatePreliminaryBiologicalAge(formData: Partial<FormData>): {
  biologicalAge: number;
  difference: number;
  confidence: 'low' | 'medium' | 'high';
  factors: string[];
} {
  const chronologicalAge = formData.age || 35;
  let biologicalAge = chronologicalAge;
  const factors: string[] = [];
  
  // Gender-based adjustments (statistical averages)
  if (formData.gender === 'female') {
    biologicalAge -= 2; // Women typically have slight longevity advantage
    factors.push('Gender advantage');
  }
  
  // Sleep quality impact
  if (formData.sleepQuality) {
    switch (formData.sleepQuality) {
      case 'excellent':
        biologicalAge -= 3;
        factors.push('Excellent sleep quality');
        break;
      case 'good':
        biologicalAge -= 1;
        factors.push('Good sleep quality');
        break;
      case 'poor':
        biologicalAge += 2;
        factors.push('Poor sleep quality');
        break;
      case 'very-poor':
        biologicalAge += 4;
        factors.push('Very poor sleep quality');
        break;
    }
  }
  
  // Sleep duration impact
  if (formData.sleepDuration) {
    switch (formData.sleepDuration) {
      case '7-8':
        biologicalAge -= 1;
        factors.push('Optimal sleep duration');
        break;
      case '6-7':
      case '8-9':
        // Neutral
        break;
      case 'less-than-6':
      case 'more-than-9':
        biologicalAge += 2;
        factors.push('Suboptimal sleep duration');
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
        factors.push('Plant-based diet');
        break;
      case 'balanced':
        biologicalAge -= 0.5;
        factors.push('Balanced diet');
        break;
      case 'western':
        biologicalAge += 1;
        factors.push('Western diet pattern');
        break;
      case 'other':
        biologicalAge += 0.5;
        break;
    }
  }
  
  // Exercise frequency impact
  if (formData.exerciseFrequency) {
    switch (formData.exerciseFrequency) {
      case 'daily':
        biologicalAge -= 4;
        factors.push('Daily exercise');
        break;
      case '5-6-times':
        biologicalAge -= 3;
        factors.push('Very frequent exercise');
        break;
      case '3-4-times':
        biologicalAge -= 2;
        factors.push('Regular exercise');
        break;
      case '1-2-times':
        biologicalAge += 1;
        factors.push('Infrequent exercise');
        break;
      case 'none':
        biologicalAge += 3;
        factors.push('No regular exercise');
        break;
    }
  }
  
  // Smoking status impact
  if (formData.smokingStatus) {
    switch (formData.smokingStatus) {
      case 'never':
        biologicalAge -= 1;
        factors.push('Never smoked');
        break;
      case 'former':
        biologicalAge += 1;
        factors.push('Former smoker');
        break;
      case 'occasional':
        biologicalAge += 3;
        factors.push('Occasional smoking');
        break;
      case 'regular':
        biologicalAge += 6;
        factors.push('Regular smoking');
        break;
    }
  }
  
  // Alcohol consumption impact
  if (formData.alcoholConsumption) {
    switch (formData.alcoholConsumption) {
      case 'none':
        biologicalAge -= 0.5;
        factors.push('No alcohol consumption');
        break;
      case 'light':
        // Neutral to slightly positive
        break;
      case 'moderate':
        biologicalAge += 0.5;
        break;
      case 'heavy':
        biologicalAge += 2;
        factors.push('Heavy alcohol consumption');
        break;
    }
  }
  
  // Ensure biological age doesn't go below reasonable bounds
  biologicalAge = Math.max(biologicalAge, chronologicalAge * 0.7);
  biologicalAge = Math.min(biologicalAge, chronologicalAge * 1.4);
  
  const difference = chronologicalAge - biologicalAge;
  
  // Determine confidence based on available data
  const dataPoints = [
    formData.gender,
    formData.sleepQuality,
    formData.sleepDuration,
    formData.dietPattern,
    formData.exerciseFrequency,
    formData.smokingStatus,
    formData.alcoholConsumption
  ].filter(Boolean).length;
  
  let confidence: 'low' | 'medium' | 'high';
  if (dataPoints >= 5) confidence = 'medium';
  else if (dataPoints >= 3) confidence = 'low';
  else confidence = 'low';
  
  return {
    biologicalAge: Math.round(biologicalAge * 10) / 10,
    difference: Math.round(difference * 10) / 10,
    confidence,
    factors: factors.slice(0, 3) // Show top 3 factors
  };
}

const formSchema = insertHealthAssessmentSchema.extend({
  exerciseTypes: z.array(z.string()).min(1, "Select at least one exercise type"),
  healthPriorities: z.array(z.string()).min(1, "Select at least one health priority"),
});

type FormData = z.infer<typeof formSchema>;

export default function Assessment() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, setLocation] = useLocation();
  const { firebaseUser, user } = useAuth();
  const { toast } = useToast();
  const createAssessment = useCreateHealthAssessment();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastSubmissionData, setLastSubmissionData] = useState<FormData | null>(null);
  
  // Analytics tracking removed for resource optimization

  // Assessment tracking removed for resource optimization

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: 35,
      gender: "",
      sleepDuration: "",
      sleepQuality: "",
      dietPattern: "",
      alcoholConsumption: "",
      smokingStatus: "",
      exerciseFrequency: "",
      exerciseTypes: [],
      exerciseIntensity: "",
      chronicConditions: [],
      medications: [],
      familyHistory: [],
      longevityGoals: "",
      healthPriorities: [],
    },
  });

  // Auto-save form data to localStorage periodically with error handling
  useEffect(() => {
    try {
      const formData = form.getValues();
      const hasData = Object.keys(formData).some(key => {
        const value = formData[key as keyof FormData];
        return Array.isArray(value) ? value.length > 0 : value !== "" && value !== 35; // 35 is default age
      });

      if (hasData) {
        const draftData = {
          formData,
          currentStep,
          timestamp: Date.now()
        };
        localStorage.setItem('thanalytica-assessment-draft', JSON.stringify(draftData));
      }
    } catch (error) {
      console.warn('Failed to save assessment draft:', error);
      // Continue silently - local storage issues shouldn't block the user
    }
  }, [form.watch(), currentStep]);

  // Restore form data from localStorage on component mount with comprehensive error handling
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('thanalytica-assessment-draft');
      if (!savedDraft) return;

      const parsedDraft = JSON.parse(savedDraft);
      
      // Validate draft structure
      if (!parsedDraft.formData || !parsedDraft.timestamp || typeof parsedDraft.currentStep !== 'number') {
        console.warn('Invalid draft format, removing');
        localStorage.removeItem('thanalytica-assessment-draft');
        return;
      }

      // Only restore if draft is less than 24 hours old
      if (Date.now() - parsedDraft.timestamp < 24 * 60 * 60 * 1000) {
        // Validate form data structure before restoring
        const { formData, currentStep: savedStep } = parsedDraft;
        
        // Basic validation of required fields
        if (typeof formData === 'object' && formData !== null) {
          form.reset(formData);
          setCurrentStep(Math.min(Math.max(savedStep, 1), steps.length)); // Ensure valid step range
          
          toast({
            title: "Draft Restored",
            description: "Your previous assessment progress has been restored.",
          });
        }
      } else {
        // Remove expired draft
        localStorage.removeItem('thanalytica-assessment-draft');
      }
    } catch (error) {
      console.warn('Failed to restore assessment draft:', error);
      // Clean up potentially corrupted data
      try {
        localStorage.removeItem('thanalytica-assessment-draft');
      } catch (removeError) {
        console.warn('Failed to remove corrupted draft:', removeError);
      }
    }
  }, [form, toast]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-professional-slate mb-4">Please Sign In</h2>
        <p className="text-gray-600">You need to be signed in to take the health assessment.</p>
      </div>
    );
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      // Step tracking removed for resource optimization
      
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof NetworkTimeoutError) {
      return "Connection timeout. Please check your internet connection and try again.";
    }
    
    if (error instanceof ApiError) {
      switch (error.status) {
        case 400:
          return "Some assessment data is invalid. Please check your responses and try again.";
        case 401:
          return "Your session has expired. Please sign in again to continue.";
        case 403:
          return "You don't have permission to submit assessments. Please contact support.";
        case 413:
          return "Assessment data is too large. Please reduce the amount of text in your responses.";
        case 422:
          return "Assessment data validation failed. Please check all required fields are filled correctly.";
        case 429:
          return "Too many attempts. Please wait a moment before trying again.";
        case 500:
          return "Server error occurred while processing your assessment. Our team has been notified.";
        case 503:
          return "Service temporarily unavailable. Please try again in a few minutes.";
        default:
          return `Server error (${error.status}). Please try again or contact support if this persists.`;
      }
    }
    
    if (error instanceof Error) {
      if (error.message.toLowerCase().includes('network')) {
        return "Network error. Please check your connection and try again.";
      }
      if (error.message.toLowerCase().includes('timeout')) {
        return "Request timed out. Please try again with a stable connection.";
      }
    }
    
    return "An unexpected error occurred. Please try again or contact support if this continues.";
  };

  const onSubmit = async (data: FormData) => {
    setSubmissionError(null);
    setLastSubmissionData(data);
    
    try {
      const startTime = Date.now();
      
      await createAssessment.mutateAsync({
        ...data,
        userId: user?.id || "",
      });
      
      const duration = Date.now() - startTime;
      
      // Assessment completion tracking removed for resource optimization
      
      // Clear saved draft on successful submission
      localStorage.removeItem('thanalytica-assessment-draft');
      
      toast({
        title: "Assessment Complete!",
        description: "Your comprehensive health assessment has been analyzed. Redirecting to your personalized dashboard...",
      });
      
      // Add a brief delay to show the success state
      setTimeout(() => {
        setLocation("/dashboard");
      }, 3000);
      
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setSubmissionError(errorMessage);
      setRetryCount(prev => prev + 1);
      
      // Error tracking removed for resource optimization
      
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      console.error('Assessment submission error:', error);
    }
  };

  const handleRetry = async () => {
    if (!lastSubmissionData) return;
    
    setIsRetrying(true);
    setSubmissionError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay
      await onSubmit(lastSubmissionData);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleSaveDraft = () => {
    const formData = form.getValues();
    localStorage.setItem('thanalytica-assessment-draft', JSON.stringify({
      formData,
      currentStep,
      timestamp: Date.now()
    }));
    
    toast({
      title: "Draft Saved",
      description: "Your progress has been saved locally. You can continue later from where you left off.",
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 md:space-y-8">
            <div className="text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-semibold text-professional-slate mb-2">Basic Information</h3>
              <p className="text-gray-600 text-base">Tell us about yourself to get started.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-medium">Age</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="h-12 text-lg px-4 border-2 focus:border-medical-green rounded-lg"
                        placeholder="Enter your age"
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-medium">Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 text-lg px-4 border-2 focus:border-medical-green rounded-lg">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="text-lg">
                        <SelectItem value="male" className="h-12 text-lg">Male</SelectItem>
                        <SelectItem value="female" className="h-12 text-lg">Female</SelectItem>
                        <SelectItem value="other" className="h-12 text-lg">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say" className="h-12 text-lg">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 md:space-y-8">
            <div className="text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-semibold text-professional-slate mb-2">Lifestyle & Habits</h3>
              <p className="text-gray-600 text-base">Tell us about your daily routines and lifestyle choices.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <FormField
                control={form.control}
                name="sleepDuration"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-medium">Average Sleep Duration</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 text-lg px-4 border-2 focus:border-medical-green rounded-lg">
                          <SelectValue placeholder="Select sleep duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="text-lg">
                        <SelectItem value="less-than-6" className="h-12 text-lg">Less than 6 hours</SelectItem>
                        <SelectItem value="6-7" className="h-12 text-lg">6-7 hours</SelectItem>
                        <SelectItem value="7-8" className="h-12 text-lg">7-8 hours</SelectItem>
                        <SelectItem value="8-9" className="h-12 text-lg">8-9 hours</SelectItem>
                        <SelectItem value="more-than-9" className="h-12 text-lg">More than 9 hours</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sleepQuality"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-medium">Sleep Quality</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 text-lg px-4 border-2 focus:border-medical-green rounded-lg">
                          <SelectValue placeholder="Select sleep quality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="text-lg">
                        <SelectItem value="poor" className="h-12 text-lg">Poor</SelectItem>
                        <SelectItem value="fair" className="h-12 text-lg">Fair</SelectItem>
                        <SelectItem value="good" className="h-12 text-lg">Good</SelectItem>
                        <SelectItem value="excellent" className="h-12 text-lg">Excellent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dietPattern"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <FormLabel className="text-base font-medium">Dietary Pattern</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                    >
                      {["mediterranean", "plant-based", "balanced", "other"].map((diet) => (
                        <div key={diet} className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-lg hover:border-medical-green/50 transition-colors">
                          <RadioGroupItem value={diet} id={diet} className="w-5 h-5" />
                          <label htmlFor={diet} className="text-base font-medium capitalize cursor-pointer flex-1">
                            {diet.replace("-", " ")}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <FormField
                control={form.control}
                name="alcoholConsumption"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-base font-medium">Alcohol Consumption</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-3">
                        {[
                          { value: "none", label: "None" },
                          { value: "occasional", label: "Occasional (1-3 drinks/week)" },
                          { value: "moderate", label: "Moderate (4-7 drinks/week)" },
                          { value: "heavy", label: "Heavy (8+ drinks/week)" },
                        ].map((option) => (
                          <div key={option.value} className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-lg hover:border-medical-green/50 transition-colors">
                            <RadioGroupItem value={option.value} id={option.value} className="w-5 h-5" />
                            <label htmlFor={option.value} className="text-base cursor-pointer flex-1">
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="smokingStatus"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel className="text-base font-medium">Smoking Status</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-3">
                        {[
                          { value: "never", label: "Never smoked" },
                          { value: "former", label: "Former smoker" },
                          { value: "current", label: "Current smoker" },
                        ].map((option) => (
                          <div key={option.value} className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-lg hover:border-medical-green/50 transition-colors">
                            <RadioGroupItem value={option.value} id={option.value} className="w-5 h-5" />
                            <label htmlFor={option.value} className="text-base cursor-pointer flex-1">
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 md:space-y-8">
            <div className="text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-semibold text-professional-slate mb-2">Medical History</h3>
              <p className="text-gray-600 text-base">Help us understand your health background.</p>
            </div>
            
            <FormField
              control={form.control}
              name="chronicConditions"
              render={() => (
                <FormItem className="space-y-4">
                  <FormLabel className="text-base font-medium">Chronic Conditions (if any)</FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      "diabetes", "hypertension", "heart-disease", "arthritis", 
                      "depression", "anxiety", "asthma", "none"
                    ].map((condition) => (
                      <FormField
                        key={condition}
                        control={form.control}
                        name="chronicConditions"
                        render={({ field }) => (
                          <FormItem
                            key={condition}
                            className="flex flex-row items-center space-x-3 space-y-0 p-3 border-2 border-gray-200 rounded-lg hover:border-medical-green/50 transition-colors"
                          >
                            <FormControl>
                              <Checkbox
                                className="w-5 h-5 data-[state=checked]:bg-medical-green data-[state=checked]:border-medical-green"
                                checked={field.value?.includes(condition)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), condition])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== condition)
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal capitalize text-base cursor-pointer flex-1">
                              {condition.replace("-", " ")}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </FormItem>
              )}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-professional-slate mb-2">Exercise & Physical Activity</h3>
              <p className="text-gray-600">Tell us about your physical activity patterns.</p>
            </div>

            <FormField
              control={form.control}
              name="exerciseFrequency"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-medium">Exercise Frequency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 text-lg px-4 border-2 focus:border-medical-green rounded-lg">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="text-lg">
                      <SelectItem value="none" className="h-12 text-lg">None</SelectItem>
                      <SelectItem value="1-2-times" className="h-12 text-lg">1-2 times per week</SelectItem>
                      <SelectItem value="3-4-times" className="h-12 text-lg">3-4 times per week</SelectItem>
                      <SelectItem value="5-6-times" className="h-12 text-lg">5-6 times per week</SelectItem>
                      <SelectItem value="daily" className="h-12 text-lg">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exerciseTypes"
              render={() => (
                <FormItem>
                  <FormLabel>Types of Exercise (select all that apply)</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "cardio", "strength-training", "yoga", "pilates",
                      "swimming", "cycling", "running", "walking"
                    ].map((exercise) => (
                      <FormField
                        key={exercise}
                        control={form.control}
                        name="exerciseTypes"
                        render={({ field }) => (
                          <FormItem
                            key={exercise}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(exercise)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), exercise])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== exercise)
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal capitalize">
                              {exercise.replace("-", " ")}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-professional-slate mb-2">Longevity Goals</h3>
              <p className="text-gray-600">What are your health and longevity aspirations?</p>
            </div>

            <FormField
              control={form.control}
              name="longevityGoals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Longevity Goal</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your primary goal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="live-to-100">Live to 100 with vitality</SelectItem>
                      <SelectItem value="live-to-120">Live to 120 with good health</SelectItem>
                      <SelectItem value="live-to-150">Live to 150 (maximum lifespan)</SelectItem>
                      <SelectItem value="optimize-healthspan">Optimize healthspan over lifespan</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="healthPriorities"
              render={() => (
                <FormItem>
                  <FormLabel>Health Priorities (select your top 3)</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "physical-fitness", "mental-clarity", "emotional-wellbeing",
                      "disease-prevention", "energy-levels", "sleep-quality",
                      "stress-management", "cognitive-function"
                    ].map((priority) => (
                      <FormField
                        key={priority}
                        control={form.control}
                        name="healthPriorities"
                        render={({ field }) => (
                          <FormItem
                            key={priority}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(priority)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), priority])
                                    : field.onChange(
                                        field.value?.filter((value) => value !== priority)
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal capitalize">
                              {priority.replace("-", " ")}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 6:
        const formErrors = Object.keys(form.formState.errors);
        const hasFormErrors = formErrors.length > 0;
        
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-professional-slate mb-2">Review & Submit</h3>
              <p className="text-gray-600">Please review your information before submitting.</p>
            </div>

            {hasFormErrors && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <p className="font-medium mb-2">Please complete all required fields:</p>
                  <ul className="text-sm space-y-1">
                    {formErrors.map(field => (
                      <li key={field} className="flex items-center">
                        • {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm mt-2">Use the Previous button to go back and complete missing information.</p>
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <strong>Age:</strong> {form.getValues("age")}
              </div>
              <div>
                <strong>Gender:</strong> {form.getValues("gender") || "Not specified"}
              </div>
              <div>
                <strong>Sleep:</strong> {form.getValues("sleepDuration")} ({form.getValues("sleepQuality")} quality)
              </div>
              <div>
                <strong>Diet:</strong> {form.getValues("dietPattern")}
              </div>
              <div>
                <strong>Exercise:</strong> {form.getValues("exerciseFrequency")} ({form.getValues("exerciseIntensity")} intensity)
              </div>
              <div>
                <strong>Exercise Types:</strong> {form.getValues("exerciseTypes").join(", ") || "None selected"}
              </div>
              <div>
                <strong>Goal:</strong> {form.getValues("longevityGoals")}
              </div>
              <div>
                <strong>Health Priorities:</strong> {form.getValues("healthPriorities").join(", ") || "None selected"}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={previousStep}
                disabled={createAssessment.isPending}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <Button 
                type="submit" 
                className="bg-medical-green text-white hover:bg-medical-green/90 px-8"
                disabled={createAssessment.isPending || hasFormErrors}
              >
                {createAssessment.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing your health data...
                  </>
                ) : (
                  "Complete Assessment"
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Calculate biological age preview for steps after basic info
  const biologicalAgePreview = currentStep > 1 ? calculatePreliminaryBiologicalAge(form.getValues()) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 relative">
      <ProgressBar currentStep={currentStep} totalSteps={steps.length} steps={steps} />

      <Card className="bg-white shadow-lg border border-gray-100">
        <CardContent className="p-4 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* Biological Age Preview Banner */}
              {biologicalAgePreview && (
                <div className="mb-8">
                  <Card className="bg-gradient-to-r from-medical-green/10 to-trust-blue/10 border-medical-green/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-medical-green/10 p-3 rounded-full">
                            <Activity className="w-6 h-6 text-medical-green" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-professional-slate mb-1">
                              Biological Age Preview
                            </h3>
                            <p className="text-sm text-gray-600">
                              Preliminary estimate • Complete assessment for full analysis
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-3">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-professional-slate">
                                {biologicalAgePreview.biologicalAge}
                              </div>
                              <div className="text-xs text-gray-500">years</div>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              {biologicalAgePreview.difference > 0 ? (
                                <>
                                  <TrendingDown className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-600">
                                    {biologicalAgePreview.difference.toFixed(1)} years younger
                                  </span>
                                </>
                              ) : biologicalAgePreview.difference < 0 ? (
                                <>
                                  <TrendingUp className="w-4 h-4 text-amber-600" />
                                  <span className="text-sm font-medium text-amber-600">
                                    {Math.abs(biologicalAgePreview.difference).toFixed(1)} years older
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm font-medium text-gray-600">
                                  Equal to chronological age
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {biologicalAgePreview.factors.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Key factors:</p>
                              <div className="flex flex-wrap gap-1">
                                {biologicalAgePreview.factors.map((factor, index) => (
                                  <span
                                    key={index}
                                    className="text-xs bg-medical-green/10 text-medical-green px-2 py-1 rounded-full"
                                  >
                                    {factor}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              biologicalAgePreview.confidence === 'high' ? 'bg-green-100 text-green-700' :
                              biologicalAgePreview.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {biologicalAgePreview.confidence} confidence
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {renderStepContent()}

              {/* Error Display with Retry Options */}
              {submissionError && (
                <Alert className="mt-6 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="space-y-3">
                      <p className="font-medium">Submission Failed</p>
                      <p className="text-sm">{submissionError}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleRetry}
                          disabled={isRetrying || createAssessment.isPending}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          {isRetrying ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Retrying...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Try Again
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleSaveDraft}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save Draft
                        </Button>
                      </div>
                      {retryCount > 0 && (
                        <p className="text-xs text-red-600">
                          Attempt {retryCount + 1} - Your form data is preserved and will not be lost.
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {currentStep < 6 && (
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-6 md:pt-8 border-t border-gray-200 mt-6 md:mt-8">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={previousStep}
                      disabled={currentStep === 1 || createAssessment.isPending}
                      className="h-12 text-base px-6 border-2 hover:border-medical-green/50"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Previous
                    </Button>
                    
                    {/* Save Draft Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleSaveDraft}
                      className="h-12 text-base px-4 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      disabled={createAssessment.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Draft
                    </Button>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="h-12 text-base px-8 bg-medical-green text-white hover:bg-medical-green/90 font-medium"
                    disabled={createAssessment.isPending}
                  >
                    Next
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Full Screen Loading Overlay */}
      {createAssessment.isPending && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 shadow-xl max-w-md mx-4 text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-12 h-12 animate-spin text-medical-green" />
            </div>
            <h3 className="text-xl font-semibold text-professional-slate mb-2">
              Analyzing Your Health Data
            </h3>
            <p className="text-gray-600 mb-4">
              Our AI is processing your comprehensive health assessment and calculating your personalized longevity trajectory. This may take a moment.
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-medical-green rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-medical-green rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-medical-green rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
              <span>Processing data...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
