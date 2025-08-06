import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/hooks/use-user";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Watch, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Heart, 
  Moon, 
  Footprints,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { format, subDays } from "date-fns";
import { 
  normalizeGarminData, 
  normalizeWhoopData, 
  mergeWearableData,
  calculateTrends,
  type NormalizedHealthData 
} from "@/utils/wearable-data-normalizer";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";

interface WearableConnection {
  id: string;
  userId: string;
  deviceType: string;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
}

interface WearablesData {
  id: string;
  device: string;
  date: string;
  dataJson: any;
  syncedAt: string;
}

export function WearableDashboard() {
  const { user: firebaseUser } = useAuth();
  const { data: user } = useUser(firebaseUser?.uid || "");

  // Get wearable connections
  const { data: connections = [], isLoading: connectionsLoading } = useQuery<WearableConnection[]>({
    queryKey: ["/api/wearable-connections", user?.id],
    enabled: !!user?.id,
  });

  // Get wearables data for last 7 days
  const startDate = format(subDays(new Date(), 7), "yyyy-MM-dd");
  const endDate = format(new Date(), "yyyy-MM-dd");

  const { data: wearablesData = [], isLoading: dataLoading } = useQuery<WearablesData[]>({
    queryKey: ["/api/wearables-data", user?.id, startDate, endDate],
    enabled: !!user?.id,
  });

  // Process and normalize data
  const normalizedData = wearablesData.reduce((acc, item) => {
    const date = item.date;
    
    if (!acc[date]) {
      acc[date] = { garmin: null, whoop: null };
    }

    if (item.device === "garmin") {
      acc[date].garmin = normalizeGarminData(item.dataJson);
    } else if (item.device === "whoop") {
      acc[date].whoop = normalizeWhoopData(item.dataJson);
    }

    return acc;
  }, {} as Record<string, { garmin: NormalizedHealthData | null; whoop: NormalizedHealthData | null }>);

  // Merge data from both sources
  const mergedData = Object.entries(normalizedData)
    .map(([date, sources]) => mergeWearableData(sources.garmin ?? undefined, sources.whoop ?? undefined))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate trends
  const trends = calculateTrends(mergedData, 7);

  // Get connection status
  const garminConnected = connections.some(c => c.deviceType === "garmin" && c.isActive);
  const whoopConnected = connections.some(c => c.deviceType === "whoop" && c.isActive);
  const anyConnected = garminConnected || whoopConnected;

  // Get last sync times
  const getLastSync = (deviceType: string) => {
    const connection = connections.find(c => c.deviceType === deviceType);
    return connection?.lastSyncAt ? new Date(connection.lastSyncAt) : null;
  };

  // Prepare chart data
  const chartData = mergedData.map(d => ({
    date: format(new Date(d.date), "MMM dd"),
    steps: d.steps,
    sleep: d.sleepHours,
    recovery: d.recoveryScore,
    activity: d.activityScore
  }));

  if (connectionsLoading || dataLoading) {
    return <WearableDashboardSkeleton />;
  }

  if (!anyConnected) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No Wearable Devices Connected</p>
          <p className="text-sm text-gray-500 mt-2">
            Connect your Garmin or Whoop device to see health insights here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Widget */}
      <Card>
        <CardHeader>
          <CardTitle>Wearable Connections</CardTitle>
          <CardDescription>Your connected health tracking devices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Garmin Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Watch className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Garmin</p>
                  <p className="text-sm text-gray-600">
                    {garminConnected ? (
                      <>
                        <Clock className="inline h-3 w-3 mr-1" />
                        {getLastSync("garmin") ? 
                          `Synced ${format(getLastSync("garmin")!, "h:mm a")}` : 
                          "Never synced"}
                      </>
                    ) : (
                      "Not connected"
                    )}
                  </p>
                </div>
              </div>
              {garminConnected ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>

            {/* Whoop Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Whoop</p>
                  <p className="text-sm text-gray-600">
                    {whoopConnected ? (
                      <>
                        <Clock className="inline h-3 w-3 mr-1" />
                        {getLastSync("whoop") ? 
                          `Synced ${format(getLastSync("whoop")!, "h:mm a")}` : 
                          "Never synced"}
                      </>
                    ) : (
                      "Not connected"
                    )}
                  </p>
                </div>
              </div>
              {whoopConnected ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Steps */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Daily Steps</CardTitle>
              <Footprints className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trends.avgSteps > 0 ? trends.avgSteps.toLocaleString() : "—"}
            </div>
            <p className="text-xs text-gray-600 mt-1">7-day average</p>
            {trends.avgSteps > 0 && (
              <div className="flex items-center mt-2">
                {trends.stepsTrend === "up" && (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-xs text-green-600">Trending up</span>
                  </>
                )}
                {trends.stepsTrend === "down" && (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    <span className="text-xs text-red-600">Trending down</span>
                  </>
                )}
                {trends.stepsTrend === "stable" && (
                  <>
                    <Minus className="h-4 w-4 text-gray-600 mr-1" />
                    <span className="text-xs text-gray-600">Stable</span>
                  </>
                )}
              </div>
            )}
            {garminConnected && !whoopConnected && (
              <Badge variant="outline" className="mt-2 text-xs">
                <Watch className="h-3 w-3 mr-1" />
                Garmin
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Sleep */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Sleep Hours</CardTitle>
              <Moon className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trends.avgSleepHours > 0 ? trends.avgSleepHours.toFixed(1) : "—"}
            </div>
            <p className="text-xs text-gray-600 mt-1">7-day average</p>
            {trends.avgSleepHours > 0 && (
              <div className="flex items-center mt-2">
                {trends.sleepTrend === "up" && (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-xs text-green-600">Improving</span>
                  </>
                )}
                {trends.sleepTrend === "down" && (
                  <>
                    <TrendingDown className="h-4 w-4 text-orange-600 mr-1" />
                    <span className="text-xs text-orange-600">Declining</span>
                  </>
                )}
                {trends.sleepTrend === "stable" && (
                  <>
                    <Minus className="h-4 w-4 text-gray-600 mr-1" />
                    <span className="text-xs text-gray-600">Stable</span>
                  </>
                )}
              </div>
            )}
            {(garminConnected || whoopConnected) && (
              <div className="flex gap-1 mt-2">
                {garminConnected && (
                  <Badge variant="outline" className="text-xs">
                    <Watch className="h-3 w-3 mr-1" />
                    Garmin
                  </Badge>
                )}
                {whoopConnected && (
                  <Badge variant="outline" className="text-xs">
                    <Activity className="h-3 w-3 mr-1" />
                    Whoop
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recovery */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recovery Score</CardTitle>
              <Heart className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trends.avgRecovery > 0 ? `${Math.round(trends.avgRecovery)}%` : "—"}
            </div>
            <p className="text-xs text-gray-600 mt-1">7-day average</p>
            {trends.avgRecovery > 0 && (
              <div className="flex items-center mt-2">
                {trends.recoveryTrend === "up" && (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-xs text-green-600">Improving</span>
                  </>
                )}
                {trends.recoveryTrend === "down" && (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    <span className="text-xs text-red-600">Declining</span>
                  </>
                )}
                {trends.recoveryTrend === "stable" && (
                  <>
                    <Minus className="h-4 w-4 text-gray-600 mr-1" />
                    <span className="text-xs text-gray-600">Stable</span>
                  </>
                )}
              </div>
            )}
            {whoopConnected && (
              <Badge variant="outline" className="mt-2 text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Whoop
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Trend Charts */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>7-Day Health Trends</CardTitle>
            <CardDescription>Your health metrics over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Steps Chart */}
              {trends.avgSteps > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-4">Daily Steps</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="steps" 
                        stroke="#f97316" 
                        fill="#fed7aa" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Sleep & Recovery Chart */}
              <div>
                <h4 className="text-sm font-medium mb-4">Sleep & Recovery</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="sleep" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="Sleep (hours)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="recovery" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Recovery (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {chartData.length === 0 && anyConnected && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No Recent Data Available</p>
            <p className="text-sm text-gray-500 mt-2">
              Sync your devices to see the latest health trends
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function WearableDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    </div>
  );
}