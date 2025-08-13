import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm, useFormState } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Save, AlertTriangle, Timer, Smartphone, Keyboard } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateHealthAssessment } from "@/hooks/use-health-data";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { FormFieldWithError } from "@/components/form-field-with-error";

// Import the guided onboarding components
import {
  VisionStep,
  BaselineStep,
  LifestyleStep,
  calculateRealTimeInsights,
  onboardingSteps,
  guidedSchema,
  type FormData,
  type BiologicalAgeResult
} from "@/components/guided-onboarding";
import { OptimizationStep, InsightsStep } from "@/components/guided-onboarding-complete";

// Encryption utility functions
const encryptData = (data: any): string => {
  // Simple base64 encoding for demo - replace with proper encryption in production
  return btoa(JSON.stringify(data));
};

const decryptData = (encryptedData: string): any => {
  try {
    return JSON.parse(atob(encryptedData));
  } catch {
    return null;
  }
};

export default function GuidedAssessment() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const { firebaseUser, user } = useAuth();
  const { toast } = useToast();
  const createAssessment = useCreateHealthAssessment();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(30 * 60); // 30 minutes
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<number, string[]>>({});
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const form = useForm<FormData>({
    resolver: zodResolver(guidedSchema),
    mode: 'onChange',
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
      longevityTarget: 100,
    },
  });

  const { errors, isValid } = useFormState({ control: form.control });

  // Watch form data for real-time insights
  const formData = form.watch();
  const insights: BiologicalAgeResult = calculateRealTimeInsights(formData);

  // Step validation logic
  const validateCurrentStep = useCallback(() => {
    const currentStepData = onboardingSteps[currentStep];
    if (!currentStepData) return true;

    const stepErrors: string[] = [];
    
    switch (currentStep) {
      case 0: // Vision Step
        if (!formData.longevityGoals) stepErrors.push('Please select your longevity goals');
        if (!formData.healthPriorities?.length) stepErrors.push('Please select at least one health priority');
        break;
      case 1: // Baseline Step
        if (!formData.gender) stepErrors.push('Please select your gender');
        if (formData.age < 18 || formData.age > 120) stepErrors.push('Please enter a valid age');
        break;
      case 2: // Lifestyle Step
        if (!formData.sleepDuration) stepErrors.push('Please select your sleep duration');
        if (!formData.exerciseFrequency) stepErrors.push('Please select your exercise frequency');
        if (!formData.dietPattern) stepErrors.push('Please select your diet pattern');
        break;
    }

    setStepErrors(prev => ({ ...prev, [currentStep]: stepErrors }));
    return stepErrors.length === 0;
  }, [currentStep, formData]);

  // Debounced auto-save function
  const debouncedSave = useCallback((data: FormData) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const hasData = Object.keys(data).some(key => {
          const value = data[key as keyof FormData];
          return Array.isArray(value) ? value.length > 0 : value !== "" && value !== 35;
        });

        if (hasData) {
          const encryptedData = encryptData({
            formData: data,
            currentStep,
            timestamp: Date.now()
          });
          
          localStorage.setItem('thanalytica-guided-assessment-encrypted', encryptedData);
          setLastSaveTime(new Date());
        }
      } catch (error) {
        console.warn('Failed to save assessment draft:', error);
      } finally {
        setIsSaving(false);
      }
    }, 2000); // 2 second debounce
  }, [currentStep]);

  // Session timeout management
  useEffect(() => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }
    
    sessionTimerRef.current = setInterval(() => {
      setSessionTimeLeft(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please save your progress.",
            variant: "destructive"
          });
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [toast]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault();
            if (currentStep > 0) handlePrevious();
            break;
          case 'ArrowRight':
            event.preventDefault();
            if (validateCurrentStep()) handleNext();
            break;
          case 's':
            event.preventDefault();
            debouncedSave(formData);
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, formData, debouncedSave, validateCurrentStep]);

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentStep < onboardingSteps.length - 1 && validateCurrentStep()) {
      handleNext();
    }
    if (isRightSwipe && currentStep > 0) {
      handlePrevious();
    }
  };

  // Conditional logic for skipping questions
  const shouldSkipStep = useCallback((stepIndex: number): boolean => {
    switch (stepIndex) {
      case 2: // Skip lifestyle if user indicates minimal health interest
        return formData.healthPriorities?.includes('minimal') || false;
      default:
        return false;
    }
  }, [formData.healthPriorities]);
  
  // Auto-save with debouncing and encryption
  useEffect(() => {
    debouncedSave(formData);
  }, [formData, debouncedSave]);

  // Restore encrypted progress on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('thanalytica-guided-assessment-encrypted');
      if (!savedDraft) return;

      const parsedDraft = decryptData(savedDraft);
      
      if (!parsedDraft?.formData || !parsedDraft?.timestamp) {
        localStorage.removeItem('thanalytica-guided-assessment-encrypted');
        return;
      }

      // Only restore if draft is less than 24 hours old
      if (Date.now() - parsedDraft.timestamp < 24 * 60 * 60 * 1000) {
        form.reset(parsedDraft.formData);
        setCurrentStep(Math.min(Math.max(parsedDraft.currentStep, 0), onboardingSteps.length - 1));
        setLastSaveTime(new Date(parsedDraft.timestamp));
        
        toast({
          title: "Welcome back!",
          description: "We've securely restored your progress from where you left off.",
        });
      } else {
        localStorage.removeItem('thanalytica-guided-assessment-encrypted');
      }
    } catch (error) {
      console.warn('Failed to restore assessment draft:', error);
      localStorage.removeItem('thanalytica-guided-assessment-encrypted');
    }
  }, [form, toast]);

  // Handle form data updates
  const handleUpdate = (updates: Partial<FormData>) => {
    Object.entries(updates).forEach(([key, value]) => {
      form.setValue(key as keyof FormData, value);
    });
  };

  // Enhanced step navigation with validation and skipping
  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) {
      toast({
        title: "Please complete required fields",
        description: "Some required information is missing on this step.",
        variant: "destructive"
      });
      return;
    }

    let nextStep = currentStep + 1;
    
    // Skip steps based on conditional logic
    while (nextStep < onboardingSteps.length && shouldSkipStep(nextStep)) {
      nextStep++;
    }

    if (nextStep < onboardingSteps.length) {
      setCurrentStep(nextStep);
    } else {
      handleSubmit();
    }
  }, [currentStep, validateCurrentStep, shouldSkipStep, toast]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      let prevStep = currentStep - 1;
      
      // Skip steps based on conditional logic when going backwards
      while (prevStep >= 0 && shouldSkipStep(prevStep)) {
        prevStep--;
      }
      
      setCurrentStep(Math.max(0, prevStep));
    }
  }, [currentStep, shouldSkipStep]);

  // Handle page leave/exit
  const handleExit = useCallback(() => {
    if (Object.keys(formData).some(key => {
      const value = formData[key as keyof FormData];
      return Array.isArray(value) ? value.length > 0 : value !== "" && value !== 35;
    })) {
      setShowExitDialog(true);
    } else {
      setLocation('/dashboard');
    }
  }, [formData, setLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, []);

  // Handle final submission
  const handleSubmit = async () => {
    if (!firebaseUser) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to save your assessment.",
      });
      setLocation("/login");
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const assessmentData = {
        ...formData,
        userId: firebaseUser.uid,
        completedAt: new Date(),
      };

      await createAssessment.mutateAsync(assessmentData);
      
      // Clear the saved encrypted draft
      localStorage.removeItem('thanalytica-guided-assessment-encrypted');
      
      toast({
        title: "🎉 Assessment Complete!",
        description: "Your personalized health profile has been created. Welcome to your longevity journey!",
      });

      // Redirect to dashboard with day 1 experience
      setLocation("/dashboard?newUser=true");
      
    } catch (error: any) {
      console.error("Assessment submission error:", error);
      setSubmissionError(
        error?.message || "Failed to save your assessment. Please try again."
      );
      
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "We couldn't save your assessment. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / onboardingSteps.length) * 100;
  
  // Format session time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get current step errors
  const currentStepErrors = stepErrors[currentStep] || [];

  // Render current step
  const renderCurrentStep = () => {
    const stepProps = {
      formData,
      onUpdate: handleUpdate,
      onNext: handleNext,
      insights,
    };

    switch (currentStep) {
      case 0:
        return <VisionStep {...stepProps} />;
      case 1:
        return <BaselineStep {...stepProps} />;
      case 2:
        return <LifestyleStep {...stepProps} />;
      case 3:
        return <OptimizationStep {...stepProps} />;
      case 4:
        return <InsightsStep {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Your Longevity Assessment
          </h1>
          <p className="text-gray-600">
            Discover your biological age and unlock your optimization potential
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                <span className="text-sm font-medium">
                  Step {currentStep + 1} of {onboardingSteps.length}
                </span>
              </div>
              <span className="text-sm text-gray-600">
                {Math.round(progressPercentage)}% Complete
              </span>
            </div>
            
            <Progress value={progressPercentage} className="h-2 mb-4" />
            
            {/* Step indicators */}
            <div className="flex justify-between">
              {onboardingSteps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                
                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center space-y-2 ${
                      index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : isCurrent
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 bg-gray-50'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-xs text-center font-medium hidden sm:block">
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderCurrentStep()}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Error Display */}
        {submissionError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="text-red-800">
                <strong>Error:</strong> {submissionError}
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSubmissionError(null)}
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => debouncedSave(formData)}
                >
                  Save Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <h3 className="text-lg font-semibold mb-2">Saving Your Assessment</h3>
                <p className="text-gray-600">Creating your personalized health profile...</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
