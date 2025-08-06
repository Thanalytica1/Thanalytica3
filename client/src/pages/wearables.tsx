import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/hooks/use-user";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  Watch, 
  Activity, 
  TrendingUp, 
  Heart, 
  Moon, 
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

interface WearableConnection {
  id: string;
  userId: string;
  deviceType: string;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
}

interface WearableMetrics {
  [key: string]: number | string | boolean | null | undefined;
}

interface WearablesData {
  id: string;
  device: string;
  date: string;
  dataJson: WearableMetrics;
  syncedAt: string;
}

interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export default function Wearables() {
  const { user: firebaseUser } = useAuth();
  const { data: user } = useUser(firebaseUser?.uid);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [syncingDevice, setSyncingDevice] = useState<string | null>(null);

  // Check for connection status from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    if (connected) {
      toast({
        title: "Device Connected",
        description: `${connected.charAt(0).toUpperCase() + connected.slice(1)} has been successfully connected!`,
      });
      // Clean up URL
      setLocation("/wearables");
    }
  }, [setLocation]);

  // Get wearable connections
  const { data: connections = [], isLoading: connectionsLoading } = useQuery<WearableConnection[]>({
    queryKey: ["/api/wearable-connections", user?.id],
    enabled: !!user?.id,
  });

  // Get wearables data
  const { data: wearablesData = [], isLoading: dataLoading } = useQuery<WearablesData[]>({
    queryKey: ["/api/wearables-data", user?.id],
    enabled: !!user?.id,
  });

  // Initiate OAuth connection
  const initiateConnection = useMutation({
    mutationFn: async (deviceType: "garmin" | "whoop" | "oura" | "apple_health") => {
      const response = await apiRequest("GET", `/auth/${deviceType}/initiate?userId=${user?.id}`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authorizeUrl) {
        window.location.href = data.authorizeUrl;
      }
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      toast({
        title: "Connection Failed",
        description: apiError.message || "Failed to initiate device connection",
        variant: "destructive",
      });
    },
  });

  // Sync device data
  const syncDevice = useMutation({
    mutationFn: async (deviceType: string) => {
      const response = await apiRequest("GET", `/sync/${deviceType}?userId=${user?.id}`);
      return response.json();
    },
    onSuccess: (data, deviceType) => {
      toast({
        title: "Sync Complete",
        description: `${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} data has been synced successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wearables-data", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/wearable-connections", user?.id] });
    },
    onError: (error: unknown) => {
      const apiError = error as ApiError;
      toast({
        title: "Sync Failed",
        description: apiError.message || "Failed to sync device data",
        variant: "destructive",
      });
    },
  });

  // Disconnect device
  const disconnectDevice = useMutation({
    mutationFn: async (connectionId: string) => {
      await apiRequest("DELETE", `/api/wearable-connections/${connectionId}`);
    },
    onSuccess: () => {
      toast({
        title: "Device Disconnected",
        description: "The device has been successfully disconnected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wearable-connections", user?.id] });
    },
    onError: () => {
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect the device",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (deviceType: "garmin" | "whoop" | "oura" | "apple_health") => {
    if (deviceType === "apple_health") {
      // Special handling for Apple Health - requires iOS app
      toast({
        title: "Apple Health Integration",
        description: "Please download our iOS app from the App Store to connect Apple Health. Web integration coming soon!",
      });
      return;
    }
    initiateConnection.mutate(deviceType);
  };

  const handleSync = async (deviceType: string) => {
    setSyncingDevice(deviceType);
    try {
      await syncDevice.mutateAsync(deviceType);
    } finally {
      setSyncingDevice(null);
    }
  };

  const getConnectionStatus = (deviceType: string) => {
    return connections.find(c => c.deviceType === deviceType && c.isActive);
  };

  const getLatestData = (device: string) => {
    return wearablesData
      .filter(d => d.device === device)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  if (connectionsLoading || dataLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-medical-green" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Wearable Devices</h1>
          <p className="text-gray-600">
            Connect your fitness trackers and health wearables to get comprehensive health insights
          </p>
        </div>

        <Tabs defaultValue="devices" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="devices">Connected Devices</TabsTrigger>
            <TabsTrigger value="data">Health Data</TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-6">
            {/* Garmin Connect IQ */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Watch className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle>Garmin Connect IQ</CardTitle>
                      <CardDescription>
                        Sync activity, sleep, heart rate, and stress data from your Garmin device
                      </CardDescription>
                    </div>
                  </div>
                  {getConnectionStatus("garmin") ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Connected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {getConnectionStatus("garmin") ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      Last synced: {getConnectionStatus("garmin")?.lastSyncAt 
                        ? format(new Date(getConnectionStatus("garmin")!.lastSyncAt), "PPp")
                        : "Never"}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleSync("garmin")}
                        disabled={syncingDevice === "garmin"}
                      >
                        {syncingDevice === "garmin" ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Sync Now
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => disconnectDevice.mutate(getConnectionStatus("garmin")!.id)}
                        disabled={disconnectDevice.isPending}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleConnect("garmin")}
                    disabled={initiateConnection.isPending}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {initiateConnection.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Watch className="h-4 w-4 mr-2" />
                    )}
                    Connect Garmin
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Oura Ring */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Moon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Oura Ring</CardTitle>
                      <CardDescription>
                        Track sleep stages, readiness, temperature trends, and heart rate variability
                      </CardDescription>
                    </div>
                  </div>
                  {getConnectionStatus("oura") ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Connected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {getConnectionStatus("oura") ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      Last synced: {getConnectionStatus("oura")?.lastSyncAt 
                        ? format(new Date(getConnectionStatus("oura")!.lastSyncAt), "PPp")
                        : "Never"}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleSync("oura")}
                        disabled={syncingDevice === "oura"}
                      >
                        {syncingDevice === "oura" ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Sync Now
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => disconnectDevice.mutate(getConnectionStatus("oura")!.id)}
                        disabled={disconnectDevice.isPending}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleConnect("oura")}
                    disabled={initiateConnection.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {initiateConnection.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Moon className="h-4 w-4 mr-2" />
                    )}
                    Connect Oura
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Apple Health */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Heart className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle>Apple Health</CardTitle>
                      <CardDescription>
                        Sync comprehensive health data from iPhone and Apple Watch
                      </CardDescription>
                    </div>
                  </div>
                  {getConnectionStatus("apple_health") ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Connected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {getConnectionStatus("apple_health") ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      Last synced: {getConnectionStatus("apple_health")?.lastSyncAt 
                        ? format(new Date(getConnectionStatus("apple_health")!.lastSyncAt), "PPp")
                        : "Never"}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleSync("apple_health")}
                        disabled={syncingDevice === "apple_health"}
                      >
                        {syncingDevice === "apple_health" ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Sync Now
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => disconnectDevice.mutate(getConnectionStatus("apple_health")!.id)}
                        disabled={disconnectDevice.isPending}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleConnect("apple_health")}
                    disabled={initiateConnection.isPending}
                    className="bg-gray-600 hover:bg-gray-700"
                  >
                    {initiateConnection.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Heart className="h-4 w-4 mr-2" />
                    )}
                    Connect Apple Health
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Whoop */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Activity className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>Whoop</CardTitle>
                      <CardDescription>
                        Track recovery, strain, sleep performance, and HRV from your Whoop strap
                      </CardDescription>
                    </div>
                  </div>
                  {getConnectionStatus("whoop") ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="h-3 w-3 mr-1" />
                      Not Connected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {getConnectionStatus("whoop") ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      Last synced: {getConnectionStatus("whoop")?.lastSyncAt 
                        ? format(new Date(getConnectionStatus("whoop")!.lastSyncAt), "PPp")
                        : "Never"}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleSync("whoop")}
                        disabled={syncingDevice === "whoop"}
                      >
                        {syncingDevice === "whoop" ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Sync Now
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => disconnectDevice.mutate(getConnectionStatus("whoop")!.id)}
                        disabled={disconnectDevice.isPending}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleConnect("whoop")}
                    disabled={initiateConnection.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {initiateConnection.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Activity className="h-4 w-4 mr-2" />
                    )}
                    Connect Whoop
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            {wearablesData.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No health data available yet.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Connect a device and sync your data to see insights here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Garmin Data */}
                {getLatestData("garmin") && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Watch className="h-5 w-5 mr-2 text-orange-600" />
                        Latest Garmin Data
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(getLatestData("garmin")!.date), "PPPP")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Steps</p>
                          <p className="text-2xl font-semibold">
                            {getLatestData("garmin")?.dataJson?.steps?.toLocaleString() || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Sleep</p>
                          <p className="text-2xl font-semibold">
                            {getLatestData("garmin")?.dataJson?.sleepHours?.toFixed(1) || "—"} hrs
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Resting HR</p>
                          <p className="text-2xl font-semibold">
                            {getLatestData("garmin")?.dataJson?.restingHeartRate || "—"} bpm
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Stress</p>
                          <p className="text-2xl font-semibold">
                            {getLatestData("garmin")?.dataJson?.stressScore || "—"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Oura Data */}
                {getLatestData("oura") && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Moon className="h-5 w-5 mr-2 text-blue-600" />
                        Latest Oura Data
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(getLatestData("oura")!.date), "PPPP")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Readiness</p>
                          <p className="text-2xl font-semibold">
                            {getLatestData("oura")?.dataJson?.readinessScore || "—"}%
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Sleep Score</p>
                          <p className="text-2xl font-semibold">
                            {getLatestData("oura")?.dataJson?.sleepScore || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">HRV</p>
                          <p className="text-2xl font-semibold">
                            {getLatestData("oura")?.dataJson?.hrv || "—"} ms
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Body Temp</p>
                          <p className="text-2xl font-semibold">
                            {getLatestData("oura")?.dataJson?.tempDeviation !== undefined ? 
                              `${getLatestData("oura")?.dataJson?.tempDeviation > 0 ? '+' : ''}${getLatestData("oura")?.dataJson?.tempDeviation.toFixed(1)}°` : 
                              "—"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Apple Health Data */}
                {getLatestData("apple_health") && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Heart className="h-5 w-5 mr-2 text-gray-600" />
                        Latest Apple Health Data
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(getLatestData("apple_health")!.date), "PPPP")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Steps</p>
                          <p className="text-2xl font-semibold">
                            {getLatestData("apple_health")?.dataJson?.steps?.toLocaleString() || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Active Energy</p>
                          <p className="text-2xl font-semibold">
                            {getLatestData("apple_health")?.dataJson?.activeEnergy || "—"} kcal
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Stand Hours</p>
                          <p className="text-2xl font-semibold">
                            {getLatestData("apple_health")?.dataJson?.standHours || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Exercise Min</p>
                          <p className="text-2xl font-semibold">
                            {getLatestData("apple_health")?.dataJson?.exerciseMinutes || "—"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Whoop Data */}
                {getLatestData("whoop") && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Activity className="h-5 w-5 mr-2 text-purple-600" />
                        Latest Whoop Data
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(getLatestData("whoop")!.date), "PPPP")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Recovery</p>
                          <p className="text-2xl font-semibold">
                            {getLatestData("whoop")?.dataJson?.recoveryScore || "—"}%
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Strain</p>
                          <p className="text-2xl font-semibold">
                            {getLatestData("whoop")?.dataJson?.strainScore?.toFixed(1) || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">HRV</p>
                          <p className="text-2xl font-semibold">
                            {getLatestData("whoop")?.dataJson?.hrv || "—"} ms
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">Sleep Performance</p>
                          <p className="text-2xl font-semibold">
                            {getLatestData("whoop")?.dataJson?.sleepPerformance || "—"}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="py-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900 font-medium mb-1">About Device Integration</p>
                <p className="text-sm text-blue-700">
                  Connected devices automatically sync health data to enhance your longevity assessment accuracy. 
                  Data is encrypted and stored securely. You can disconnect devices at any time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}