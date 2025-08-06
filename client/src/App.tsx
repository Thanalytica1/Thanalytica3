import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navigation } from "@/components/navigation";
import { ErrorBoundary } from "@/components/error-boundary";
import { AppFooter } from "@/components/app-footer";
import Home from "@/pages/home";
import Assessment from "@/pages/assessment";
import Dashboard from "@/pages/dashboard";
import Recommendations from "@/pages/recommendations";
import Wearables from "@/pages/wearables";
import Referrals from "@/pages/referrals";
// HealthAI page removed for resource optimization
import Simulator from "@/pages/simulator";
import About from "@/pages/about";
import Login from "@/pages/login";
import AdminAnalytics from "@/pages/admin-analytics";
import PrivacyPolicy from "@/pages/privacy-policy";
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
      <Route path="/referrals">
        <ErrorBoundary>
          <ProtectedRoute>
            <Referrals />
          </ProtectedRoute>
        </ErrorBoundary>
      </Route>
      {/* Health AI route removed for resource optimization */}
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
      <Route path="/privacy-policy">
        <ErrorBoundary>
          <PrivacyPolicy />
        </ErrorBoundary>
      </Route>
      <Route path="/admin/analytics">
        <ErrorBoundary>
          <ProtectedRoute>
            <AdminAnalytics />
          </ProtectedRoute>
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
          <div className="min-h-screen bg-clinical-white flex flex-col">
            <ErrorBoundary>
              <Navigation />
            </ErrorBoundary>
            <main className="flex-1">
              <Router />
            </main>
            <ErrorBoundary>
              <AppFooter />
            </ErrorBoundary>
          </div>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
