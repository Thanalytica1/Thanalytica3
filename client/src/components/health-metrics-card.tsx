import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface HealthMetricsCardProps {
  title: string;
  value: string;
  subtitle: string;
  change?: string;
  changeDirection?: "up" | "down" | "neutral";
  status: "excellent" | "good" | "fair" | "needs-improvement";
  icon: LucideIcon;
  iconColor: string;
}

export function HealthMetricsCard({
  title,
  value,
  subtitle,
  change,
  changeDirection,
  status,
  icon: Icon,
  iconColor,
}: HealthMetricsCardProps) {
  const statusColors = {
    excellent: "bg-green-100 text-green-800",
    good: "bg-yellow-100 text-yellow-800",
    fair: "bg-blue-100 text-blue-800",
    "needs-improvement": "bg-red-100 text-red-800",
  };

  const changeColors = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-gray-600",
  };

  return (
    <Card className="bg-white shadow-md border border-gray-100">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${iconColor}10` }}>
            <Icon className="text-xl" style={{ color: iconColor }} />
          </div>
          <Badge className={`text-xs px-2 py-1 rounded-full ${statusColors[status]}`}>
            {status.replace("-", " ")}
          </Badge>
        </div>
        <div className="text-2xl font-bold text-professional-slate">{value}</div>
        <div className="text-sm text-gray-600">{subtitle}</div>
        {change && (
          <div className={`text-xs mt-1 ${changeColors[changeDirection || "neutral"]}`}>
            {change}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
