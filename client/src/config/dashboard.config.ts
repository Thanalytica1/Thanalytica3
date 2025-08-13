// Dashboard Configuration and Constants
import { 
  Heart, 
  Activity, 
  Moon, 
  Apple, 
  Brain, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";

export const HEALTH_FACTORS = [
  { 
    key: 'sleep', 
    label: 'Sleep Quality', 
    defaultScore: 92, 
    colorClass: 'bg-green-500',
    icon: Moon,
    unit: '%',
    description: 'Quality and duration of sleep patterns'
  },
  { 
    key: 'exercise', 
    label: 'Exercise Consistency', 
    defaultScore: 78, 
    colorClass: 'bg-green-400',
    icon: Activity,
    unit: '%',
    description: 'Regular physical activity and fitness levels'
  },
  { 
    key: 'nutrition', 
    label: 'Nutrition Score', 
    defaultScore: 84, 
    colorClass: 'bg-yellow-400',
    icon: Apple,
    unit: '%',
    description: 'Diet quality and nutritional balance'
  },
  { 
    key: 'stress', 
    label: 'Stress Management', 
    defaultScore: 71, 
    colorClass: 'bg-yellow-500',
    icon: Brain,
    unit: '%',
    description: 'Stress levels and coping mechanisms'
  },
  { 
    key: 'cognitive', 
    label: 'Cognitive Health', 
    defaultScore: 89, 
    colorClass: 'bg-green-500',
    icon: Brain,
    unit: '%',
    description: 'Mental clarity and cognitive function'
  }
] as const;

export const RISK_LEVELS = {
  LOW: { 
    label: 'Low Risk', 
    color: 'green', 
    bgClass: 'bg-green-50',
    textClass: 'text-green-800',
    iconClass: 'text-green-500',
    icon: CheckCircle
  },
  MODERATE: { 
    label: 'Monitor', 
    color: 'yellow', 
    bgClass: 'bg-yellow-50',
    textClass: 'text-yellow-800',
    iconClass: 'text-yellow-500',
    icon: AlertCircle
  },
  HIGH: { 
    label: 'High Risk', 
    color: 'red', 
    bgClass: 'bg-red-50',
    textClass: 'text-red-800',
    iconClass: 'text-red-500',
    icon: XCircle
  }
} as const;

export const STATUS_CONFIG = {
  excellent: { 
    icon: CheckCircle, 
    color: 'text-green-700', 
    bg: 'bg-green-100',
    label: 'Excellent'
  },
  good: { 
    icon: TrendingUp, 
    color: 'text-blue-700', 
    bg: 'bg-blue-100',
    label: 'Good'
  },
  moderate: { 
    icon: AlertCircle, 
    color: 'text-yellow-700', 
    bg: 'bg-yellow-100',
    label: 'Moderate'
  },
  poor: { 
    icon: XCircle, 
    color: 'text-red-700', 
    bg: 'bg-red-100',
    label: 'Needs Attention'
  }
} as const;

export const TIME_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' }
] as const;

export const TRAJECTORY_RATINGS = {
  OPTIMAL: {
    label: 'Optimal',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Exceptional health trajectory'
  },
  GOOD: {
    label: 'Good',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Strong health foundation'
  },
  MODERATE: {
    label: 'Moderate',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    description: 'Room for improvement'
  },
  NEEDS_ATTENTION: {
    label: 'Needs Attention',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    description: 'Immediate action recommended'
  }
} as const;

export const BENCHMARK_DATA = {
  biologicalAge: {
    excellent: -5, // 5 years younger
    good: -2,
    moderate: 0,
    poor: 3
  },
  vitalityScore: {
    excellent: 90,
    good: 80,
    moderate: 70,
    poor: 60
  },
  sleepHours: {
    optimal: 8,
    minimum: 7,
    maximum: 9
  }
} as const;

export const DEFAULT_GOALS = [
  {
    id: 'sleep-goal',
    category: 'sleep',
    title: 'Improve Sleep Quality',
    target: 8,
    current: 7.2,
    unit: 'hours',
    priority: 'high'
  },
  {
    id: 'exercise-goal',
    category: 'fitness',
    title: 'Weekly Exercise Sessions',
    target: 5,
    current: 3,
    unit: 'sessions',
    priority: 'medium'
  },
  {
    id: 'stress-goal',
    category: 'stress',
    title: 'Daily Meditation',
    target: 20,
    current: 5,
    unit: 'minutes',
    priority: 'high'
  }
] as const;