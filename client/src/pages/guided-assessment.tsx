import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateHealthAssessment } from "@/hooks/use-health-data";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

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

export default function GuidedAssessment() {
  const [currentStep, setCurrentStep] = useState(0);
  const [, setLocation] = useLocation();
  const { firebaseUser, user } = useAuth();
  const { toast } = useToast();
  const createAssessment = useCreateHealthAssessment();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(guidedSchema),
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

  // Watch form data for real-time insights
  const formData = form.watch();
  const insights: BiologicalAgeResult = calculateRealTimeInsights(formData);
  
  // Auto-save progress to localStorage
  useEffect(() => {
    try {
      const hasData = Object.keys(formData).some(key => {
        const value = formData[key as keyof FormData];
        return Array.isArray(value) ? value.length > 0 : value !== "" && value !== 35;
      });

      if (hasData) {
        const draftData = {
          formData,
          currentStep,
          timestamp: Date.now()
        };
        localStorage.setItem('thanalytica-guided-assessment', JSON.stringify(draftData));
      }
    } catch (error) {
      console.warn('Failed to save assessment draft:', error);
    }
  }, [formData, currentStep]);

  // Restore progress on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('thanalytica-guided-assessment');
      if (!savedDraft) return;

      const parsedDraft = JSON.parse(savedDraft);
      
      if (!parsedDraft.formData || !parsedDraft.timestamp) {
        localStorage.removeItem('thanalytica-guided-assessment');
        return;
      }

      // Only restore if draft is less than 24 hours old
      if (Date.now() - parsedDraft.timestamp < 24 * 60 * 60 * 1000) {
        form.reset(parsedDraft.formData);
        setCurrentStep(Math.min(Math.max(parsedDraft.currentStep, 0), onboardingSteps.length - 1));
        
        toast({
          title: "Welcome back!",
          description: "We've restored your progress from where you left off.",
        });
      } else {
        localStorage.removeItem('thanalytica-guided-assessment');
      }
    } catch (error) {
      console.warn('Failed to restore assessment draft:', error);
      localStorage.removeItem('thanalytica-guided-assessment');
    }
  }, [form, toast]);

  // Handle form data updates
  const handleUpdate = (updates: Partial<FormData>) => {
    Object.entries(updates).forEach(([key, value]) => {
      form.setValue(key as keyof FormData, value);
    });
  };

  // Handle step navigation
  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

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
      
      // Clear the saved draft
      localStorage.removeItem('thanalytica-guided-assessment');
      
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSubmissionError(null)}
                className="mt-2"
              >
                Try Again
              </Button>
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
