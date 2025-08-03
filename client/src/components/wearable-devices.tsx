import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Watch, 
  Smartphone, 
  Check, 
  X, 
  RefreshCw, 
  Plus,
  Activity,
  Heart,
  Moon,
  Flame
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { 
  useWearableConnections, 
  useWearableData,
  useDeleteWearableConnection,
  getOuraAuthUrl,
  initiateAppleHealthConnect
} from "@/hooks/use-wearables";
import { useToast } from "@/hooks/use-toast";

const DEVICE_CONFIG = {
  oura: {
    name: "Oura Ring",
    icon: Watch,
    color: "#000000",
    description: "Sleep, recovery, and activity tracking",
    dataTypes: ["sleep", "activity", "heart_rate", "hrv"],
  },
  apple_health: {
    name: "Apple Health",
    icon: Smartphone, 
    color: "#007AFF",
    description: "Comprehensive health data from iPhone",
    dataTypes: ["steps", "heart_rate", "sleep", "workouts"],
  },
};

interface WearableDeviceCardProps {
  deviceType: keyof typeof DEVICE_CONFIG;
  isConnected: boolean;
  connectionId?: string;
  lastSync?: Date;
  onConnect: () => void;
  onDisconnect: () => void;
}

function WearableDeviceCard({ 
  deviceType, 
  isConnected, 
  connectionId,
  lastSync,
  onConnect, 
  onDisconnect 
}: WearableDeviceCardProps) {
  const config = DEVICE_CONFIG[deviceType];
  const Icon = config.icon;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${config.color}10`, color: config.color }}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg">{config.name}</CardTitle>
              <p className="text-sm text-gray-600">{config.description}</p>
            </div>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {isConnected && lastSync && (
            <div className="text-sm text-gray-600">
              Last sync: {new Date(lastSync).toLocaleDateString()} at {new Date(lastSync).toLocaleTimeString()}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {config.dataTypes.map((dataType) => (
              <Badge key={dataType} variant="outline" className="text-xs">
                {dataType.replace("_", " ")}
              </Badge>
            ))}
          </div>
          
          <div className="flex space-x-2">
            {isConnected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDisconnect}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="px-3"
                  title="Sync now"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={onConnect}
                className="flex-1"
                style={{ backgroundColor: config.color }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Connect {config.name}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WearableDataSummary({ userId }: { userId: string }) {
  const { data: wearableData } = useWearableData(userId);
  
  if (!wearableData || wearableData.length === 0) {
    return null;
  }

  // Group data by type for display
  const dataByType = wearableData.reduce((acc, item) => {
    if (!acc[item.dataType]) {
      acc[item.dataType] = [];
    }
    acc[item.dataType].push(item);
    return acc;
  }, {} as Record<string, typeof wearableData>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Recent Wearable Data</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(dataByType).map(([dataType, data]) => {
            const latest = data[data.length - 1];
            const IconComponent = 
              dataType === 'sleep' ? Moon :
              dataType === 'heart_rate' ? Heart :
              dataType === 'activity' ? Activity : Flame;
            
            return (
              <div key={dataType} className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-full">
                  <IconComponent className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-sm font-medium capitalize">
                  {dataType.replace('_', ' ')}
                </div>
                <div className="text-xs text-gray-600">
                  {data.length} records
                </div>
                <div className="text-xs text-gray-500">
                  Latest: {new Date(latest.date).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function WearableDevices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: connections = [], isLoading } = useWearableConnections(user?.id || "");
  const deleteConnection = useDeleteWearableConnection();

  const handleConnect = async (deviceType: keyof typeof DEVICE_CONFIG) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please sign in to connect devices",
        variant: "destructive",
      });
      return;
    }

    try {
      if (deviceType === 'oura') {
        const authUrl = getOuraAuthUrl(user.id);
        window.location.href = authUrl;
      } else if (deviceType === 'apple_health') {
        const success = await initiateAppleHealthConnect();
        if (success) {
          toast({
            title: "Success",
            description: "Apple Health connected successfully",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Unable to connect to device. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async (connectionId: string, deviceName: string) => {
    try {
      await deleteConnection.mutateAsync(connectionId);
      toast({
        title: "Disconnected",
        description: `${deviceName} has been disconnected`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect device",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please sign in to connect wearable devices.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const connectedDevices = connections.reduce((acc, conn) => {
    acc[conn.deviceType] = conn;
    return acc;
  }, {} as Record<string, typeof connections[0]>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-professional-slate mb-2">Wearable Devices</h2>
        <p className="text-gray-600">
          Connect your wearable devices to automatically sync health data and get more accurate longevity insights.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {Object.entries(DEVICE_CONFIG).map(([deviceType, config]) => {
          const connection = connectedDevices[deviceType];
          return (
            <WearableDeviceCard
              key={deviceType}
              deviceType={deviceType as keyof typeof DEVICE_CONFIG}
              isConnected={!!connection}
              connectionId={connection?.id}
              lastSync={connection?.lastSyncAt ? new Date(connection.lastSyncAt) : undefined}
              onConnect={() => handleConnect(deviceType as keyof typeof DEVICE_CONFIG)}
              onDisconnect={() => connection && handleDisconnect(connection.id, config.name)}
            />
          );
        })}
      </div>

      {connections.length > 0 && (
        <WearableDataSummary userId={user.id} />
      )}

      {connections.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Watch className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No devices connected</h3>
            <p className="text-gray-600 mb-4">
              Connect your wearable devices to automatically track your health metrics and get personalized insights.
            </p>
            <div className="text-sm text-gray-500">
              Supported devices: Oura Ring, Apple Health (coming soon)
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}