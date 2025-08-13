// Enhanced Health Metrics Card with Trends and Interactivity
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { STATUS_CONFIG } from '@/config/dashboard.config';
import { getScoreCategory } from '@/utils/health-validation';

interface SparklineData {
  value: number;
  timestamp: string;
}

interface EnhancedHealthCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  changeDirection?: 'up' | 'down' | 'stable';
  changePercent?: number;
  status?: 'excellent' | 'good' | 'moderate' | 'poor';
  icon?: React.ComponentType<any>;
  iconColor?: string;
  trend?: SparklineData[];
  benchmark?: number;
  unit?: string;
  description?: string;
  onClick?: () => void;
  className?: string;
  interactive?: boolean;
}

const SparklineChart = ({ data, className }: { data: SparklineData[]; className?: string }) => {
  if (!data || data.length < 2) return null;
  
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  const lastValue = values[values.length - 1];
  const secondLastValue = values[values.length - 2];
  const isIncreasing = lastValue > secondLastValue;
  
  return (
    <div className={`relative ${className}`}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
        className="absolute inset-0"
      >
        <polyline
          fill="none"
          stroke={isIncreasing ? "#10b981" : "#ef4444"}
          strokeWidth="2"
          points={points}
          className="opacity-80"
        />
        <defs>
          <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isIncreasing ? "#10b981" : "#ef4444"} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={isIncreasing ? "#10b981" : "#ef4444"} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polygon
          fill="url(#sparklineGradient)"
          points={`0,100 ${points} 100,100`}
        />
      </svg>
    </div>
  );
};

const StatusIndicator = ({ status, value }: { status: string; value: string }) => {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  if (!config) return null;
  
  const Icon = config.icon;
  
  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded ${config.bg}`}>
      <Icon className={`w-4 h-4 ${config.color}`} aria-hidden="true" />
      <span className={`text-sm font-medium ${config.color}`}>
        {value}
      </span>
      <span className="sr-only">Status: {config.label}</span>
    </div>
  );
};

const ComparisonMetric = ({ 
  userValue, 
  benchmark, 
  unit = '' 
}: { 
  userValue: number; 
  benchmark: number; 
  unit?: string; 
}) => {
  const difference = userValue - benchmark;
  const percentDiff = benchmark > 0 ? ((difference / benchmark) * 100) : 0;
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500">vs avg:</span>
      <span className={`font-medium ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {difference >= 0 ? '+' : ''}{percentDiff.toFixed(1)}%
      </span>
    </div>
  );
};

export const EnhancedHealthCard = ({
  title,
  value,
  subtitle,
  change,
  changeDirection = 'stable',
  changePercent,
  status,
  icon: Icon,
  iconColor = '#6b7280',
  trend,
  benchmark,
  unit,
  description,
  onClick,
  className = '',
  interactive = true
}: EnhancedHealthCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Auto-detect status based on numeric value
  const computedStatus = useMemo(() => {
    if (status) return status;
    const numValue = Number(value);
    if (!isNaN(numValue) && typeof value === 'number') {
      return getScoreCategory(numValue);
    }
    return 'moderate';
  }, [value, status]);
  
  const statusConfig = STATUS_CONFIG[computedStatus];
  
  const TrendIcon = changeDirection === 'up' ? TrendingUp : 
                   changeDirection === 'down' ? TrendingDown : Minus;
  
  const trendColor = changeDirection === 'up' ? 'text-green-600' : 
                     changeDirection === 'down' ? 'text-red-600' : 'text-gray-500';
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault();
      onClick();
    }
  };
  
  return (
    <Card 
      className={`
        transition-all duration-200 border-0 shadow-md hover:shadow-lg
        ${interactive && onClick ? 'cursor-pointer hover:scale-105' : ''}
        ${isHovered && interactive ? 'bg-gray-50' : 'bg-white'}
        ${className}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={interactive && onClick ? 0 : undefined}
      role={onClick ? 'button' : 'article'}
      aria-label={`Health metric: ${title}. Current value: ${value}${unit}. ${description || ''}`}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div 
                className="p-2 rounded-lg bg-gray-100"
                style={{ backgroundColor: `${iconColor}15` }}
              >
                <Icon 
                  className="w-5 h-5" 
                  style={{ color: iconColor }}
                  aria-hidden="true"
                />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          
          {interactive && onClick && (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
        
        {/* Main Value */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {value}{unit}
            </span>
            {status && (
              <Badge variant="secondary" className={statusConfig.bg}>
                <span className={`text-xs ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
              </Badge>
            )}
          </div>
          
          {/* Change Indicator */}
          {(change || changePercent !== undefined) && (
            <div className="flex items-center gap-2 mt-2">
              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              <span className={`text-sm font-medium ${trendColor}`}>
                {changePercent !== undefined ? `${changePercent > 0 ? '+' : ''}${changePercent}%` : change}
              </span>
              {change && changePercent !== undefined && (
                <span className="text-xs text-gray-500">({change})</span>
              )}
            </div>
          )}
          
          {/* Benchmark Comparison */}
          {benchmark !== undefined && typeof value === 'number' && (
            <ComparisonMetric 
              userValue={value} 
              benchmark={benchmark} 
              unit={unit} 
            />
          )}
        </div>
        
        {/* Trend Sparkline */}
        {trend && trend.length > 1 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">7-day trend</span>
            </div>
            <SparklineChart data={trend} className="h-8 w-full" />
          </div>
        )}
        
        {/* Progress Bar for Percentage Values */}
        {typeof value === 'number' && value <= 100 && unit === '%' && (
          <div className="mb-3">
            <Progress 
              value={value} 
              className="h-2"
              aria-label={`${title} progress: ${value}%`}
            />
          </div>
        )}
        
        {/* Description */}
        {description && (
          <p className="text-xs text-gray-600 leading-relaxed">
            {description}
          </p>
        )}
        
        {/* Interactive Actions */}
        {interactive && isHovered && onClick && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-between text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              View Details
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};