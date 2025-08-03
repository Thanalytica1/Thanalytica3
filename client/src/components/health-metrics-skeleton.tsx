import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function HealthMetricsCardSkeleton() {
  return (
    <Card className="h-32">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64 bg-white/20" />
          <Skeleton className="h-5 w-48 bg-white/20" />
        </div>
        <div className="mt-4 md:mt-0 text-right space-y-2">
          <Skeleton className="h-10 w-24 bg-white/20" />
          <Skeleton className="h-4 w-16 bg-white/20" />
        </div>
      </div>
    </div>
  );
}

export function VitalityScoreSkeleton() {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-3 w-full rounded-full" />
          <div className="grid grid-cols-2 gap-4 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricsGridSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <HealthMetricsCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardLoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header Skeleton */}
      <HeaderSkeleton />
      
      {/* Key Metrics Grid Skeleton */}
      <MetricsGridSkeleton />
      
      {/* Vitality Score Skeleton */}
      <div className="grid md:grid-cols-3 gap-6">
        <VitalityScoreSkeleton />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      
      {/* Bottom Section Skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}