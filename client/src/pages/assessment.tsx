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
import { ArrowLeft, ArrowRight, Loader2, AlertCircle, RefreshCw, Save } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateHealthAssessment } from "@/hooks/use-health-data";
import { insertHealthAssessmentSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ApiError, NetworkTimeoutError } from "@/lib/queryClient";
// Analytics removed for resource optimization

const steps = ["Basic Info", "Lifestyle", "Medical History", "Exercise", "Goals", "Review"];

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

  // Auto-save form data to localStorage periodically
  useEffect(() => {
    const formData = form.getValues();
    const hasData = Object.keys(formData).some(key => {
      const value = formData[key as keyof FormData];
      return Array.isArray(value) ? value.length > 0 : value !== "" && value !== 35; // 35 is default age
    });

    if (hasData) {
      localStorage.setItem('thanalytica-assessment-draft', JSON.stringify({
        formData,
        currentStep,
        timestamp: Date.now()
      }));
    }
  }, [form.watch(), currentStep]);

  // Restore form data from localStorage on component mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('thanalytica-assessment-draft');
    if (savedDraft) {
      try {
        const { formData, currentStep: savedStep, timestamp } = JSON.parse(savedDraft);
        // Only restore if draft is less than 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          form.reset(formData);
          setCurrentStep(savedStep);
          toast({
            title: "Draft Restored",
            description: "Your previous assessment progress has been restored.",
          });
        }
      } catch (error) {
        console.error('Error restoring draft:', error);
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
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-professional-slate mb-2">Basic Information</h3>
              <p className="text-gray-600">Tell us about yourself to get started.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
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
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-professional-slate mb-2">Lifestyle & Habits</h3>
              <p className="text-gray-600">Tell us about your daily routines and lifestyle choices.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="sleepDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Sleep Duration</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sleep duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="less-than-6">Less than 6 hours</SelectItem>
                        <SelectItem value="6-7">6-7 hours</SelectItem>
                        <SelectItem value="7-8">7-8 hours</SelectItem>
                        <SelectItem value="8-9">8-9 hours</SelectItem>
                        <SelectItem value="more-than-9">More than 9 hours</SelectItem>
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
                  <FormItem>
                    <FormLabel>Sleep Quality</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sleep quality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="excellent">Excellent</SelectItem>
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
                <FormItem>
                  <FormLabel>Dietary Pattern</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 md:grid-cols-4 gap-3"
                    >
                      {["mediterranean", "plant-based", "balanced", "other"].map((diet) => (
                        <div key={diet} className="flex items-center space-x-2">
                          <RadioGroupItem value={diet} id={diet} />
                          <label htmlFor={diet} className="text-sm font-medium capitalize">
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

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="alcoholConsumption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alcohol Consumption</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value}>
                        {[
                          { value: "none", label: "None" },
                          { value: "occasional", label: "Occasional (1-3 drinks/week)" },
                          { value: "moderate", label: "Moderate (4-7 drinks/week)" },
                          { value: "heavy", label: "Heavy (8+ drinks/week)" },
                        ].map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={option.value} />
                            <label htmlFor={option.value} className="text-sm">
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
                  <FormItem>
                    <FormLabel>Smoking Status</FormLabel>
                    <FormControl>
                      <RadioGroup onValueChange={field.onChange} value={field.value}>
                        {[
                          { value: "never", label: "Never smoked" },
                          { value: "former", label: "Former smoker" },
                          { value: "current", label: "Current smoker" },
                        ].map((option) => (
                          <div key={option.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={option.value} id={option.value} />
                            <label htmlFor={option.value} className="text-sm">
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
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-professional-slate mb-2">Medical History</h3>
              <p className="text-gray-600">Help us understand your health background.</p>
            </div>
            
            <FormField
              control={form.control}
              name="chronicConditions"
              render={() => (
                <FormItem>
                  <FormLabel>Chronic Conditions (if any)</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
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
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
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
                            <FormLabel className="font-normal capitalize">
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
                <FormItem>
                  <FormLabel>Exercise Frequency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="1-2-times">1-2 times per week</SelectItem>
                      <SelectItem value="3-4-times">3-4 times per week</SelectItem>
                      <SelectItem value="5-6-times">5-6 times per week</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative">
      <ProgressBar currentStep={currentStep} totalSteps={steps.length} steps={steps} />

      <Card className="bg-white shadow-lg border border-gray-100">
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
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
                <div className="flex justify-between items-center pt-8 border-t border-gray-200 mt-8">
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={previousStep}
                      disabled={currentStep === 1 || createAssessment.isPending}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    
                    {/* Save Draft Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveDraft}
                      className="text-gray-500 hover:text-gray-700"
                      disabled={createAssessment.isPending}
                    >
                      <Save className="w-3 h-3 mr-1" />
                      Save Draft
                    </Button>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-medical-green text-white hover:bg-medical-green/90"
                    disabled={createAssessment.isPending}
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
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
