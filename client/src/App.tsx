import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/navigation";
import Home from "@/pages/home";
import Assessment from "@/pages/assessment";
import Dashboard from "@/pages/dashboard";
import Recommendations from "@/pages/recommendations";
import Wearables from "@/pages/wearables";
import Simulator from "@/pages/simulator";
import About from "@/pages/about";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "@/components/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/assessment">
        <ProtectedRoute>
          <Assessment />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/recommendations">
        <ProtectedRoute>
          <Recommendations />
        </ProtectedRoute>
      </Route>
      <Route path="/wearables">
        <ProtectedRoute>
          <Wearables />
        </ProtectedRoute>
      </Route>
      <Route path="/simulator" component={Simulator} />
      <Route path="/about" component={About} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-clinical-white">
          <Navigation />
          <main>
            <Router />
          </main>
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
