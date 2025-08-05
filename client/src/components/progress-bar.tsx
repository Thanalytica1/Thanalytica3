interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export function ProgressBar({ currentStep, totalSteps, steps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-6 md:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
        <h2 className="text-xl md:text-2xl font-bold text-professional-slate">Health Assessment</h2>
        <span className="text-base md:text-sm text-gray-500 font-medium">Step {currentStep} of {totalSteps}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 md:h-2">
        <div 
          className="bg-medical-green h-3 md:h-2 rounded-full transition-all duration-300" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="hidden sm:flex justify-between text-xs text-gray-500 mt-2">
        {steps.map((step, index) => (
          <span 
            key={step}
            className={`truncate ${index + 1 === currentStep ? "font-medium text-medical-green" : ""}`}
          >
            {step}
          </span>
        ))}
      </div>
      <div className="sm:hidden mt-3 text-center">
        <span className="text-sm font-medium text-medical-green">
          {steps[currentStep - 1]}
        </span>
      </div>
    </div>
  );
}
