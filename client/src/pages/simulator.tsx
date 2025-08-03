import { HealthSimulator } from "@/components/health-simulator";
import { usePageTracking } from "@/hooks/use-analytics";

export default function Simulator() {
  // Track simulator page view
  usePageTracking("simulator");
  
  return <HealthSimulator />;
}