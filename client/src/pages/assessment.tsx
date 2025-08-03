import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ProgressBar } from "@/components/progress-bar";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateHealthAssessment } from "@/hooks/use-health-data";
import { insertHealthAssessmentSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

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
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await createAssessment.mutateAsync({
        ...data,
        userId: user?.id || "",
      });
      
      toast({
        title: "Assessment Complete!",
        description: "Your health assessment has been saved. Redirecting to dashboard...",
      });
      
      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save assessment. Please try again.",
        variant: "destructive",
      });
    }
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
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-professional-slate mb-2">Review & Submit</h3>
              <p className="text-gray-600">Please review your information before submitting.</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <strong>Age:</strong> {form.getValues("age")}
              </div>
              <div>
                <strong>Sleep:</strong> {form.getValues("sleepDuration")} ({form.getValues("sleepQuality")} quality)
              </div>
              <div>
                <strong>Diet:</strong> {form.getValues("dietPattern")}
              </div>
              <div>
                <strong>Exercise:</strong> {form.getValues("exerciseFrequency")}
              </div>
              <div>
                <strong>Goal:</strong> {form.getValues("longevityGoals")}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-medical-green text-white hover:bg-medical-green/90"
              disabled={createAssessment.isPending}
            >
              {createAssessment.isPending ? "Analyzing..." : "Complete Assessment"}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <ProgressBar currentStep={currentStep} totalSteps={steps.length} steps={steps} />

      <Card className="bg-white shadow-lg border border-gray-100">
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {renderStepContent()}

              {currentStep < 6 && (
                <div className="flex justify-between pt-8 border-t border-gray-200 mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={previousStep}
                    disabled={currentStep === 1}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-medical-green text-white hover:bg-medical-green/90"
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
    </div>
  );
}
