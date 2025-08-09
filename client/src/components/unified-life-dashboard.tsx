/**
 * PHASE 3.1: Unified Life Dashboard
 * Holistic dashboard showing interconnections between all life aspects
 * Work, health, sleep, nutrition, exercise - and how each affects the others
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity,
  Brain,
  Heart,
  Moon,
  Apple,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  BarChart3,
  Network,
  Lightbulb,
  Award,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { clientIntelligence } from "@/services/clientIntelligence";

// Life Optimization Score components and weights
interface LifeOptimizationComponents {
  workOptimization: {
    score: number;
    metrics: {
      taskCompletion: number;
      focusTime: number;
      decisionQuality: number;
      productivity: number;
    };
    weight: 0.25;
  };
  healthMetrics: {
    score: number;
    metrics: {
      activity: number;
      nutrition: number;
      vitals: number;
      recovery: number;
    };
    weight: 0.25;
  };
  recoveryMetrics: {
    score: number;
    metrics: {
      sleepQuality: number;
      stressLevels: number;
      hrv: number;
      restfulness: number;
    };
    weight: 0.25;
  };
  growthMetrics: {
    score: number;
    metrics: {
      learning: number;
      skillDevelopment: number;
      goalProgress: number;
      habits: number;
    };
    weight: 0.25;
  };
}

// Correlation discovery data structure
interface LifeCorrelation {
  id: string;
  factor1: string;
  factor2: string;
  correlation: number;
  confidence: number;
  insight: string;
  actionable: boolean;
  timeWindow: '7d' | '30d' | '90d';
  strength: 'weak' | 'moderate' | 'strong';
  trend: 'increasing' | 'decreasing' | 'stable';
}

// Interactive visualization node
interface NetworkNode {
  id: string;
  label: string;
  category: 'work' | 'health' | 'recovery' | 'growth';
  score: number;
  size: number;
  color: string;
  connections: Array<{
    to: string;
    strength: number;
    type: 'positive' | 'negative';
    insight: string;
  }>;
}

export function UnifiedLifeDashboard() {
  const { user } = useAuth();
  const [activeTimeWindow, setActiveTimeWindow] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [lifeOptimization, setLifeOptimization] = useState<LifeOptimizationComponents | null>(null);
  const [correlations, setCorrelations] = useState<LifeCorrelation[]>([]);
  const [networkNodes, setNetworkNodes] = useState<NetworkNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load life optimization data
  useEffect(() => {
    if (!user?.id) return;

    const loadLifeData = async () => {
      setIsLoading(true);
      
      try {
        // Get cached dashboard data first
        const dashboardData = await clientIntelligence.getDashboardData(user.id);
        
        // Calculate Life Optimization Score
        const optimization = await calculateLifeOptimizationScore(user.id, activeTimeWindow);
        setLifeOptimization(optimization);
        
        // Get correlation insights
        const correlationData = await discoverCorrelations(user.id, activeTimeWindow);
        setCorrelations(correlationData);
        
        // Build network visualization data
        const nodes = await buildNetworkNodes(optimization, correlationData);
        setNetworkNodes(nodes);
        
      } catch (error) {
        console.error('Failed to load life optimization data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLifeData();
  }, [user?.id, activeTimeWindow]);

  // Calculate overall Life Optimization Score
  const overallScore = useMemo(() => {
    if (!lifeOptimization) return 0;
    
    return Math.round(
      lifeOptimization.workOptimization.score * lifeOptimization.workOptimization.weight +
      lifeOptimization.healthMetrics.score * lifeOptimization.healthMetrics.weight +
      lifeOptimization.recoveryMetrics.score * lifeOptimization.recoveryMetrics.weight +
      lifeOptimization.growthMetrics.score * lifeOptimization.growthMetrics.weight
    );
  }, [lifeOptimization]);

  // Get top correlations for insights
  const topInsights = useMemo(() => {
    return correlations
      .filter(c => c.actionable && c.strength !== 'weak')
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
      .slice(0, 5);
  }, [correlations]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Analyzing your life optimization patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header with Time Window Selection */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Life Optimization Hub
          </h1>
          <p className="text-gray-600 mt-2">
            Discover how every aspect of your life influences your overall optimization
          </p>
        </div>
        
        <Tabs value={activeTimeWindow} onValueChange={(value) => setActiveTimeWindow(value as any)}>
          <TabsList>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Life Optimization Score Hero */}
      <Card className="mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
        <CardContent className="p-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Target className="w-8 h-8 text-blue-500" />
                <h2 className="text-2xl font-bold">Life Optimization Score</h2>
              </div>
              
              <div className="text-6xl font-bold text-blue-600 mb-2">
                {overallScore}
                <span className="text-2xl text-gray-500">/100</span>
              </div>
              
              <p className="text-gray-600 mb-4">
                Your holistic life optimization level based on work, health, recovery, and growth metrics
              </p>
              
              <div className="flex items-center space-x-2">
                {overallScore >= 80 ? (
                  <>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span className="text-green-700 font-medium">Excellent optimization</span>
                  </>
                ) : overallScore >= 60 ? (
                  <>
                    <Minus className="w-5 h-5 text-yellow-500" />
                    <span className="text-yellow-700 font-medium">Good progress</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-5 h-5 text-red-500" />
                    <span className="text-red-700 font-medium">Room for improvement</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Component Breakdown */}
            <div className="space-y-4">
              {lifeOptimization && (
                <>
                  <OptimizationComponent
                    title="Work Optimization"
                    score={lifeOptimization.workOptimization.score}
                    icon={Briefcase}
                    color="blue"
                  />
                  <OptimizationComponent
                    title="Health Metrics"
                    score={lifeOptimization.healthMetrics.score}
                    icon={Heart}
                    color="red"
                  />
                  <OptimizationComponent
                    title="Recovery & Rest"
                    score={lifeOptimization.recoveryMetrics.score}
                    icon={Moon}
                    color="purple"
                  />
                  <OptimizationComponent
                    title="Growth & Learning"
                    score={lifeOptimization.growthMetrics.score}
                    icon={Brain}
                    color="green"
                  />
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Network Visualization */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Network className="w-5 h-5 text-purple-500" />
                <span>Life Interconnection Map</span>
              </CardTitle>
              <p className="text-sm text-gray-600">
                Interactive visualization showing how different life areas influence each other
              </p>
            </CardHeader>
            <CardContent>
              <LifeNetworkVisualization
                nodes={networkNodes}
                selectedNode={selectedNode}
                onNodeSelect={setSelectedNode}
                timeWindow={activeTimeWindow}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Insights */}
        <div className="space-y-6">
          {/* Top Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <span>Key Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {topInsights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100"
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={insight.strength === 'strong' ? 'default' : 'secondary'}>
                      {insight.strength} correlation
                    </Badge>
                    <div className="flex items-center space-x-1">
                      {insight.correlation > 0 ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">
                        {Math.abs(insight.correlation).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">{insight.insight}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{insight.timeWindow} analysis</span>
                    <span>{(insight.confidence * 100).toFixed(0)}% confidence</span>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-orange-500" />
                <span>Optimization Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="w-4 h-4 mr-2" />
                Schedule Deep Work Block
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Moon className="w-4 h-4 mr-2" />
                Optimize Sleep Schedule
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Activity className="w-4 h-4 mr-2" />
                Plan Exercise Session
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Brain className="w-4 h-4 mr-2" />
                Start Learning Goal
              </Button>
            </CardContent>
          </Card>

          {/* Achievement Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-gold-500" />
                <span>Optimization Journey</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Next Milestone</span>
                    <span>85% to Optimized</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>Keep improving your sleep quality to reach the next optimization level</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Component for individual optimization areas
interface OptimizationComponentProps {
  title: string;
  score: number;
  icon: React.ComponentType<any>;
  color: string;
}

function OptimizationComponent({ title, score, icon: Icon, color }: OptimizationComponentProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50',
    green: 'text-green-600 bg-green-50',
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-medium text-sm">{title}</span>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold">{score}</div>
        <div className="text-xs text-gray-500">/100</div>
      </div>
    </div>
  );
}

// Network visualization component
interface LifeNetworkVisualizationProps {
  nodes: NetworkNode[];
  selectedNode: string | null;
  onNodeSelect: (nodeId: string | null) => void;
  timeWindow: string;
}

function LifeNetworkVisualization({ 
  nodes, 
  selectedNode, 
  onNodeSelect, 
  timeWindow 
}: LifeNetworkVisualizationProps) {
  return (
    <div className="relative w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
      {/* SVG Network Visualization */}
      <svg className="w-full h-full">
        {/* Render connections */}
        {nodes.map(node => 
          node.connections.map((connection, idx) => {
            const targetNode = nodes.find(n => n.id === connection.to);
            if (!targetNode) return null;
            
            return (
              <line
                key={`${node.id}-${connection.to}-${idx}`}
                x1={`${((nodes.indexOf(node) + 1) / (nodes.length + 1)) * 100}%`}
                y1={`${((node.category === 'work' ? 1 : node.category === 'health' ? 2 : node.category === 'recovery' ? 3 : 4) / 5) * 100}%`}
                x2={`${((nodes.indexOf(targetNode) + 1) / (nodes.length + 1)) * 100}%`}
                y2={`${((targetNode.category === 'work' ? 1 : targetNode.category === 'health' ? 2 : targetNode.category === 'recovery' ? 3 : 4) / 5) * 100}%`}
                stroke={connection.type === 'positive' ? '#10b981' : '#ef4444'}
                strokeWidth={Math.abs(connection.strength) * 3}
                opacity={0.6}
                className="transition-all duration-300"
              />
            );
          })
        )}
        
        {/* Render nodes */}
        {nodes.map((node, index) => (
          <g key={node.id}>
            <circle
              cx={`${((index + 1) / (nodes.length + 1)) * 100}%`}
              cy={`${((node.category === 'work' ? 1 : node.category === 'health' ? 2 : node.category === 'recovery' ? 3 : 4) / 5) * 100}%`}
              r={node.size}
              fill={node.color}
              className={`cursor-pointer transition-all duration-300 ${
                selectedNode === node.id ? 'stroke-4 stroke-blue-500' : 'stroke-2 stroke-white'
              }`}
              onClick={() => onNodeSelect(selectedNode === node.id ? null : node.id)}
            />
            <text
              x={`${((index + 1) / (nodes.length + 1)) * 100}%`}
              y={`${((node.category === 'work' ? 1 : node.category === 'health' ? 2 : node.category === 'recovery' ? 3 : 4) / 5) * 100 + 8}%`}
              textAnchor="middle"
              className="text-xs font-medium fill-gray-700"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
      
      {/* Selected node details */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4"
          >
            {(() => {
              const node = nodes.find(n => n.id === selectedNode);
              if (!node) return null;
              
              return (
                <div>
                  <h3 className="font-semibold mb-2">{node.label}</h3>
                  <p className="text-sm text-gray-600 mb-2">Score: {node.score}/100</p>
                  <div className="text-xs text-gray-500">
                    {node.connections.length} connections found
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper functions for data calculation
async function calculateLifeOptimizationScore(
  userId: string, 
  timeWindow: string
): Promise<LifeOptimizationComponents> {
  // This would fetch real data from your metrics cache
  // For now, returning mock data with realistic calculations
  
  return {
    workOptimization: {
      score: 78,
      metrics: {
        taskCompletion: 85,
        focusTime: 72,
        decisionQuality: 80,
        productivity: 75,
      },
      weight: 0.25,
    },
    healthMetrics: {
      score: 82,
      metrics: {
        activity: 85,
        nutrition: 78,
        vitals: 88,
        recovery: 79,
      },
      weight: 0.25,
    },
    recoveryMetrics: {
      score: 75,
      metrics: {
        sleepQuality: 73,
        stressLevels: 68,
        hrv: 82,
        restfulness: 77,
      },
      weight: 0.25,
    },
    growthMetrics: {
      score: 71,
      metrics: {
        learning: 75,
        skillDevelopment: 68,
        goalProgress: 74,
        habits: 67,
      },
      weight: 0.25,
    },
  };
}

async function discoverCorrelations(
  userId: string, 
  timeWindow: string
): Promise<LifeCorrelation[]> {
  // This would use your correlation engine
  // Returning realistic correlation insights
  
  return [
    {
      id: '1',
      factor1: 'Sleep Quality',
      factor2: 'Work Focus',
      correlation: 0.73,
      confidence: 0.89,
      insight: 'Better sleep strongly correlates with improved focus at work',
      actionable: true,
      timeWindow: timeWindow as any,
      strength: 'strong',
      trend: 'increasing',
    },
    {
      id: '2',
      factor1: 'Exercise Intensity',
      factor2: 'Decision Quality',
      correlation: 0.65,
      confidence: 0.82,
      insight: 'Higher exercise intensity leads to better decision-making',
      actionable: true,
      timeWindow: timeWindow as any,
      strength: 'strong',
      trend: 'stable',
    },
    {
      id: '3',
      factor1: 'Stress Levels',
      factor2: 'Recovery Score',
      correlation: -0.58,
      confidence: 0.75,
      insight: 'Higher stress significantly impacts recovery quality',
      actionable: true,
      timeWindow: timeWindow as any,
      strength: 'moderate',
      trend: 'stable',
    },
  ];
}

async function buildNetworkNodes(
  optimization: LifeOptimizationComponents,
  correlations: LifeCorrelation[]
): Promise<NetworkNode[]> {
  // Build network nodes based on optimization data and correlations
  
  return [
    {
      id: 'work',
      label: 'Work',
      category: 'work',
      score: optimization.workOptimization.score,
      size: 20 + (optimization.workOptimization.score / 5),
      color: '#3b82f6',
      connections: [
        { to: 'recovery', strength: 0.73, type: 'positive', insight: 'Rest improves work performance' },
      ],
    },
    {
      id: 'health',
      label: 'Health',
      category: 'health',
      score: optimization.healthMetrics.score,
      size: 20 + (optimization.healthMetrics.score / 5),
      color: '#ef4444',
      connections: [
        { to: 'recovery', strength: 0.65, type: 'positive', insight: 'Health and recovery are linked' },
      ],
    },
    {
      id: 'recovery',
      label: 'Recovery',
      category: 'recovery',
      score: optimization.recoveryMetrics.score,
      size: 20 + (optimization.recoveryMetrics.score / 5),
      color: '#8b5cf6',
      connections: [
        { to: 'work', strength: 0.73, type: 'positive', insight: 'Recovery boosts work performance' },
      ],
    },
    {
      id: 'growth',
      label: 'Growth',
      category: 'growth',
      score: optimization.growthMetrics.score,
      size: 20 + (optimization.growthMetrics.score / 5),
      color: '#10b981',
      connections: [
        { to: 'work', strength: 0.42, type: 'positive', insight: 'Learning enhances work quality' },
      ],
    },
  ];
}
