import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/navigation";
import { ErrorBoundary } from "@/components/error-boundary";
import Home from "@/pages/home";
import Assessment from "@/pages/assessment";
import Dashboard from "@/pages/dashboard";
import Recommendations from "@/pages/recommendations";
import Wearables from "@/pages/wearables";
import HealthAI from "@/pages/health-ai";
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
        <ErrorBoundary>
          <ProtectedRoute>
            <Assessment />
          </ProtectedRoute>
        </ErrorBoundary>
      </Route>
      <Route path="/dashboard">
        <ErrorBoundary>
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </ErrorBoundary>
      </Route>
      <Route path="/recommendations">
        <ErrorBoundary>
          <ProtectedRoute>
            <Recommendations />
          </ProtectedRoute>
        </ErrorBoundary>
      </Route>
      <Route path="/wearables">
        <ErrorBoundary>
          <ProtectedRoute>
            <Wearables />
          </ProtectedRoute>
        </ErrorBoundary>
      </Route>
      <Route path="/health-ai">
        <ErrorBoundary>
          <ProtectedRoute>
            <HealthAI />
          </ProtectedRoute>
        </ErrorBoundary>
      </Route>
      <Route path="/simulator">
        <ErrorBoundary>
          <Simulator />
        </ErrorBoundary>
      </Route>
      <Route path="/about">
        <ErrorBoundary>
          <About />
        </ErrorBoundary>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Custom error handling for app-level errors
        console.error('App-level error:', { error, errorInfo });
      }}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-clinical-white">
            <ErrorBoundary>
              <Navigation />
            </ErrorBoundary>
            <main>
              <Router />
            </main>
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
