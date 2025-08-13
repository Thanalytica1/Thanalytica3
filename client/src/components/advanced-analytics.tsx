// Advanced Analytics Component with Interactive Charts
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  Share
} from 'lucide-react';

interface AnalyticsData {
  trend: 'improving' | 'stable' | 'declining';
  average: number;
  improvement: number;
  dataPoints: number;
  insights: string[];
}

interface AdvancedAnalyticsProps {
  timeRange: string;
  metrics: any;
  analytics?: AnalyticsData;
  className?: string;
}

// Mock chart component (replace with actual chart library)
const MetricChart = ({ 
  data, 
  type = 'line', 
  color = '#3b82f6' 
}: { 
  data: any[]; 
  type?: 'line' | 'bar' | 'area'; 
  color?: string; 
}) => {
  return (
    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
      <div className="text-center text-gray-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-2" />
        <p className="text-sm">Interactive {type} chart</p>
        <p className="text-xs">{data.length} data points</p>
      </div>
    </div>
  );
};

const TrendIndicator = ({ 
  trend, 
  value 
}: { 
  trend: 'improving' | 'stable' | 'declining'; 
  value: number; 
}) => {
  const getIcon = () => {
    switch (trend) {
      case 'improving': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };
  
  const getColor = () => {
    switch (trend) {
      case 'improving': return 'text-green-600';
      case 'declining': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      {getIcon()}
      <span className={`text-sm font-medium ${getColor()}`}>
        {value > 0 ? '+' : ''}{value.toFixed(1)}%
      </span>
      <Badge variant="outline" className={getColor()}>
        {trend}
      </Badge>
    </div>
  );
};

export default function AdvancedAnalytics({ 
  timeRange, 
  metrics, 
  analytics,
  className = "" 
}: AdvancedAnalyticsProps) {
  // Mock data for demonstration
  const mockData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
    sleep: 7.5 + Math.random() * 1.5,
    exercise: 60 + Math.random() * 30,
    stress: 3 + Math.random() * 2,
    vitality: 75 + Math.random() * 20
  }));
  
  const metricCategories = [
    {
      key: 'sleep',
      label: 'Sleep Quality',
      current: metrics?.sleepScore || 92,
      target: 95,
      unit: '%',
      color: '#3b82f6'
    },
    {
      key: 'exercise',
      label: 'Exercise Performance',
      current: metrics?.exerciseScore || 78,
      target: 85,
      unit: '%',
      color: '#10b981'
    },
    {
      key: 'nutrition',
      label: 'Nutrition Score',
      current: metrics?.nutritionScore || 84,
      target: 90,
      unit: '%',
      color: '#f59e0b'
    },
    {
      key: 'stress',
      label: 'Stress Management',
      current: metrics?.stressScore || 71,
      target: 80,
      unit: '%',
      color: '#8b5cf6'
    }
  ];
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Analytics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Health Analytics</h3>
          <p className="text-sm text-gray-600">
            Detailed insights for the {timeRange.replace('d', ' days').replace('y', ' year')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCategories.map((metric) => {
          const progress = (metric.current / metric.target) * 100;
          const isOnTrack = progress >= 90;
          
          return (
            <Card key={metric.key}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    {metric.label}
                  </h4>
                  <Badge variant={isOnTrack ? 'default' : 'secondary'}>
                    {metric.current}{metric.unit}
                  </Badge>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {progress.toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">
                  of {metric.target}{metric.unit} target
                </div>
                <TrendIndicator 
                  trend="improving" 
                  value={5.2} 
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Detailed Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="correlations">Correlations</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="comparisons">Comparisons</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trends" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {metricCategories.map((metric) => (
              <Card key={metric.key}>
                <CardHeader>
                  <CardTitle className="text-lg">{metric.label} Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <MetricChart 
                    data={mockData} 
                    type="line"
                    color={metric.color}
                  />
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>7-day average:</span>
                      <span className="font-medium">{metric.current}{metric.unit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Best day:</span>
                      <span className="font-medium text-green-600">
                        {(metric.current * 1.15).toFixed(0)}{metric.unit}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Improvement needed:</span>
                      <span className="font-medium text-blue-600">
                        {Math.max(0, metric.target - metric.current).toFixed(0)}{metric.unit}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="correlations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Factor Correlations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">
                    Strong Positive Correlation
                  </h4>
                  <p className="text-sm text-blue-700">
                    Sleep quality and exercise performance show 85% correlation. 
                    Better sleep leads to more effective workouts.
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">
                    Moderate Inverse Correlation
                  </h4>
                  <p className="text-sm text-yellow-700">
                    Stress levels and sleep quality show -67% correlation. 
                    Managing stress improves sleep significantly.
                  </p>
                </div>
                <MetricChart data={mockData} type="area" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Health Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">+2.3</div>
                    <div className="text-sm text-green-800">Years added</div>
                    <div className="text-xs text-green-600 mt-1">
                      If current trends continue
                    </div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">87%</div>
                    <div className="text-sm text-blue-800">Goal probability</div>
                    <div className="text-xs text-blue-600 mt-1">
                      Reaching 150 years
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">12</div>
                    <div className="text-sm text-purple-800">Weeks to target</div>
                    <div className="text-xs text-purple-600 mt-1">
                      Optimal health zone
                    </div>
                  </div>
                </div>
                <MetricChart data={mockData} type="line" />
                <div className="text-sm text-gray-600">
                  <p className="mb-2">
                    <strong>Model Confidence:</strong> 92% (based on 6 months of data)
                  </p>
                  <p>
                    Predictions are updated weekly based on your latest health metrics, 
                    lifestyle choices, and progress towards goals.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="comparisons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Peer Comparisons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  Anonymous comparison with users of similar age and health profile
                </div>
                {metricCategories.map((metric) => {
                  const peerAverage = metric.current * (0.85 + Math.random() * 0.3);
                  const difference = metric.current - peerAverage;
                  const percentDiff = (difference / peerAverage) * 100;
                  
                  return (
                    <div key={metric.key} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{metric.label}</div>
                        <div className="text-sm text-gray-600">
                          You: {metric.current}{metric.unit} | Peers: {peerAverage.toFixed(1)}{metric.unit}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {difference >= 0 ? '+' : ''}{percentDiff.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">vs peers</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}