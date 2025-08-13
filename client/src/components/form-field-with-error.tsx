// Enhanced Form Field Component with Error Display
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { ReactNode } from "react";

interface FormFieldWithErrorProps {
  name: string;
  label: string;
  error?: { message?: string };
  children: ReactNode;
  required?: boolean;
  description?: string;
  className?: string;
}

export const FormFieldWithError = ({ 
  name, 
  label, 
  error, 
  children, 
  required = false,
  description,
  className = ""
}: FormFieldWithErrorProps) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label 
        htmlFor={name} 
        className="text-sm font-medium text-gray-700 flex items-center gap-1"
      >
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      
      {children}
      
      {error?.message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-sm text-red-600 flex items-center gap-1 bg-red-50 p-2 rounded border border-red-200"
        >
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{error.message}</span>
        </motion.div>
      )}
    </div>
  );
};