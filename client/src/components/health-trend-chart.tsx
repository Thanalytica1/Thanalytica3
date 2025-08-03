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
  AreaChart,
  ReferenceLine
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, Calendar, Target } from "lucide-react";
import { useState } from "react";
import type { HealthTrend } from "@shared/schema";

interface HealthTrendChartProps {
  data: HealthTrend[];
  title: string;
  metricType: string;
  targetValue?: number;
  unit?: string;
  color?: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'improving':
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'declining':
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    default:
      return <Minus className="w-4 h-4 text-gray-500" />;
  }
};

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'improving':
      return 'text-green-600 bg-green-50';
    case 'declining':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};

export function AdvancedHealthTrendChart({ 
  data, 
  title, 
  metricType, 
  targetValue,
  unit = '',
  color = '#2E8B57'
}: HealthTrendChartProps) {
  const [timeRange, setTimeRange] = useState('3m');
  const [chartType, setChartType] = useState('line');

  // Filter data based on time range
  const filteredData = data.filter(item => {
    const itemDate = new Date(item.date);
    const now = new Date();
    const monthsBack = timeRange === '1m' ? 1 : timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12;
    const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate());
    return itemDate >= cutoffDate;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Prepare chart data
  const chartData = filteredData.map(item => ({
    date: formatDate(item.date),
    value: item.value,
    trend: item.trend,
    fullDate: item.date
  }));

  // Calculate trend statistics
  const latestValue = chartData[chartData.length - 1]?.value || 0;
  const firstValue = chartData[0]?.value || 0;
  const percentChange = firstValue !== 0 ? ((latestValue - firstValue) / firstValue) * 100 : 0;
  const latestTrend = chartData[chartData.length - 1]?.trend || 'stable';

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{`Date: ${label}`}</p>
          <p className="text-sm text-gray-600">
            {`${title}: ${payload[0].value.toFixed(1)}${unit}`}
          </p>
          <div className="flex items-center mt-1">
            {getTrendIcon(data.trend)}
            <span className="ml-1 text-xs capitalize">{data.trend}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>{title}</span>
              <Badge className={`ml-2 ${getTrendColor(latestTrend)}`}>
                {getTrendIcon(latestTrend)}
                <span className="ml-1 capitalize">{latestTrend}</span>
              </Badge>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Current: {latestValue.toFixed(1)}{unit} 
              {percentChange !== 0 && (
                <span className={`ml-2 ${percentChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ({percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%)
                </span>
              )}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1M</SelectItem>
                <SelectItem value="3m">3M</SelectItem>
                <SelectItem value="6m">6M</SelectItem>
                <SelectItem value="1y">1Y</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="area">Area</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  fill={`${color}20`}
                  dot={{ fill: color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: color }}
                />
                {targetValue && (
                  <ReferenceLine 
                    y={targetValue} 
                    stroke="#FFD700" 
                    strokeDasharray="5 5"
                    label={{ value: `Target: ${targetValue}${unit}`, position: "right" }}
                  />
                )}
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={3}
                  dot={{ fill: color, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: color }}
                />
                {targetValue && (
                  <ReferenceLine 
                    y={targetValue} 
                    stroke="#FFD700" 
                    strokeDasharray="5 5"
                    label={{ value: `Target: ${targetValue}${unit}`, position: "right" }}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Trend Analysis Summary */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium mb-2 flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Trend Analysis
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Average:</span>
              <span className="ml-2 font-medium">
                {(chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length).toFixed(1)}{unit}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Best:</span>
              <span className="ml-2 font-medium text-green-600">
                {Math.max(...chartData.map(item => item.value)).toFixed(1)}{unit}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Lowest:</span>
              <span className="ml-2 font-medium text-red-600">
                {Math.min(...chartData.map(item => item.value)).toFixed(1)}{unit}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Data Points:</span>
              <span className="ml-2 font-medium">{chartData.length}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AdvancedHealthTrendChart;