interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export function ProgressBar({ currentStep, totalSteps, steps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-professional-slate">Health Assessment</h2>
        <span className="text-sm text-gray-500">Step {currentStep} of {totalSteps}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-medical-green h-2 rounded-full transition-all duration-300" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        {steps.map((step, index) => (
          <span 
            key={step}
            className={index + 1 === currentStep ? "font-medium text-medical-green" : ""}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}
