import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  ClipboardCheck, 
  TrendingUp, 
  Activity, 
  Eye,
  Brain,
  Calculator,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { usePageTracking } from "@/hooks/use-analytics";

interface AnalyticsData {
  totalUsers: number;
  totalAssessments: number;
  totalEvents: number;
  topEvents: { eventType: string; count: number }[];
  recentActivity: { eventType: string; createdAt: string; userId: string }[];
  userGrowth: { period: string; count: number }[];
}

export default function AdminAnalytics() {
  const { user } = useAuth();
  
  // Track admin page access
  usePageTracking("admin_analytics", { userId: user?.id });

  // Fetch analytics data
  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['/api/admin/analytics'],
    enabled: !!user,
  });

  // Simple admin check - in production, you'd want proper role-based access
  const isAdmin = user?.email?.includes('admin') || user?.email?.endsWith('@thanalytica.com');

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-professional-slate mb-4">Please Sign In</h2>
        <p className="text-gray-600">You need to be signed in to access admin analytics.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <Alert className="max-w-md mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. This page is restricted to administrators.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load analytics data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-professional-slate mb-2">Admin Analytics</h1>
        <p className="text-gray-600">Platform usage insights and user behavior metrics</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments Completed</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{analytics?.totalAssessments || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{analytics?.totalEvents || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {analytics?.totalUsers && analytics?.totalEvents 
                  ? Math.round((analytics.totalEvents / analytics.totalUsers) * 10) / 10
                  : 0}
                <span className="text-sm font-normal text-gray-500">/user</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Used Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Most Used Features
            </CardTitle>
            <CardDescription>
              Top platform features by user interaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {analytics?.topEvents?.length ? (
                  analytics.topEvents.map((event, index) => (
                    <div key={event.eventType} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-medical-green text-white text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex items-center space-x-2">
                          {getEventIcon(event.eventType)}
                          <span className="font-medium text-sm">
                            {formatEventType(event.eventType)}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary">{event.count}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No activity data available</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest user interactions on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {analytics?.recentActivity?.length ? (
                  analytics.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        {getEventIcon(activity.eventType)}
                        <span>{formatEventType(activity.eventType)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No recent activity</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper functions
function getEventIcon(eventType: string) {
  switch (eventType.toLowerCase()) {
    case 'assessment_started':
    case 'assessment_completed':
    case 'assessment_step_completed':
      return <ClipboardCheck className="h-4 w-4 text-medical-green" />;
    case 'simulator_used':
      return <Calculator className="h-4 w-4 text-trust-blue" />;
    case 'page_view':
      return <Eye className="h-4 w-4 text-gray-500" />;
    case 'recommendation_viewed':
      return <Brain className="h-4 w-4 text-vitality-gold" />;
    default:
      return <Activity className="h-4 w-4 text-gray-400" />;
  }
}

function formatEventType(eventType: string): string {
  return eventType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}