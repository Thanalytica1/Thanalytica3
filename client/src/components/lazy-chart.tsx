import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load chart components to reduce initial bundle size
export const LazyChartContainer = lazy(() => 
  import("@/components/ui/chart").then(module => ({ 
    default: module.ChartContainer 
  }))
);

export const LazyChartTooltipContent = lazy(() => 
  import("@/components/ui/chart").then(module => ({ 
    default: module.ChartTooltipContent 
  }))
);

export const LazyChartLegendContent = lazy(() => 
  import("@/components/ui/chart").then(module => ({ 
    default: module.ChartLegendContent 
  }))
);

// Lazy load Recharts components
export const LazyLineChart = lazy(() => 
  import("recharts").then(module => ({ default: module.LineChart }))
);

export const LazyBarChart = lazy(() => 
  import("recharts").then(module => ({ default: module.BarChart }))
);

export const LazyAreaChart = lazy(() => 
  import("recharts").then(module => ({ default: module.AreaChart }))
);

export const LazyPieChart = lazy(() => 
  import("recharts").then(module => ({ default: module.PieChart }))
);

// Loading fallback component for charts
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className={`w-full rounded-lg`} style={{ height: `${height}px` }} />
      <div className="flex justify-center space-x-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

// Wrapper component with suspense
interface LazyChartWrapperProps {
  children: React.ReactNode;
  height?: number;
  fallback?: React.ReactNode;
}

export function LazyChartWrapper({ 
  children, 
  height = 300, 
  fallback 
}: LazyChartWrapperProps) {
  return (
    <Suspense fallback={fallback || <ChartSkeleton height={height} />}>
      {children}
    </Suspense>
  );
}