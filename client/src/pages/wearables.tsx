import { ProtectedRoute } from "@/components/protected-route";
import WearableDevices from "@/components/wearable-devices";

export default function Wearables() {
  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <WearableDevices />
      </div>
    </ProtectedRoute>
  );
}