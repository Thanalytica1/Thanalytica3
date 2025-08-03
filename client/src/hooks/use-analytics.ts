import { useCallback, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "./use-auth";
import type { InsertAnalyticsEvent, AnalyticsEvent } from "@shared/schema";

// Session ID management
let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return sessionId;
}

// Event batching for resource optimization
class AnalyticsBatcher {
  private eventQueue: InsertAnalyticsEvent[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 5;
  private readonly BATCH_DELAY = 2000; // 2 seconds

  constructor(private sendBatch: (events: InsertAnalyticsEvent[]) => void) {}

  addEvent(event: InsertAnalyticsEvent) {
    this.eventQueue.push(event);
    
    // Send batch if it reaches the size limit
    if (this.eventQueue.length >= this.BATCH_SIZE) {
      this.flushBatch();
    } else {
      // Set timeout to send batch after delay
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }
      this.batchTimeout = setTimeout(() => this.flushBatch(), this.BATCH_DELAY);
    }
  }

  private flushBatch() {
    if (this.eventQueue.length === 0) return;
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    this.sendBatch(events);
  }

  // Flush any remaining events (e.g., on component unmount)
  flush() {
    this.flushBatch();
  }
}

// Get basic event properties
function getEventProperties() {
  return {
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    pathname: window.location.pathname,
  };
}

export interface AnalyticsEventOptions {
  category?: string;
  eventData?: Record<string, any>;
}

export function useAnalytics() {
  const { user } = useAuth();
  const sessionIdRef = useRef(getSessionId());

  // Batch mutation for multiple events
  const batchEventMutation = useMutation({
    mutationFn: async (events: InsertAnalyticsEvent[]) => {
      // Send individual events but with less frequency
      return Promise.all(
        events.map(event => apiRequest("POST", "/api/analytics/event", event))
      );
    },
    onError: (error) => {
      console.warn("Failed to track analytics batch:", error);
    },
  });

  // Create batcher instance
  const batcherRef = useRef<AnalyticsBatcher | null>(null);
  
  if (!batcherRef.current) {
    batcherRef.current = new AnalyticsBatcher((events) => {
      batchEventMutation.mutate(events);
    });
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      batcherRef.current?.flush();
    };
  }, []);

  // Track event function - now uses batching
  const trackEvent = useCallback(
    (
      eventName: string, 
      options: AnalyticsEventOptions = {}
    ) => {
      const { category = "user_action", eventData } = options;
      
      const eventPayload: InsertAnalyticsEvent = {
        userId: user?.id || null,
        sessionId: sessionIdRef.current,
        eventName,
        eventCategory: category,
        eventData: eventData || null,
        ...getEventProperties(),
      };

      // Add to batch instead of sending immediately
      batcherRef.current?.addEvent(eventPayload);
    },
    [user?.id]
  );

  // Convenience methods for common events
  const trackPageView = useCallback(
    (pageName: string, additionalData?: Record<string, any>) => {
      trackEvent(`${pageName}_viewed`, {
        category: "page_view",
        eventData: additionalData,
      });
    },
    [trackEvent]
  );

  const trackFormInteraction = useCallback(
    (formName: string, action: string, additionalData?: Record<string, any>) => {
      trackEvent(`${formName}_${action}`, {
        category: "form_interaction",
        eventData: additionalData,
      });
    },
    [trackEvent]
  );

  const trackFeatureUsage = useCallback(
    (featureName: string, action: string, additionalData?: Record<string, any>) => {
      trackEvent(`${featureName}_${action}`, {
        category: "feature_usage",
        eventData: additionalData,
      });
    },
    [trackEvent]
  );

  // Get user's analytics events - optimize for less frequent loading
  const { data: userEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["/api/analytics/events", user?.id],
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes - analytics don't need real-time updates
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  // Get analytics summary - even less frequent updates needed
  const { data: analyticsSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ["/api/analytics/summary", user?.id],
    enabled: !!user?.id,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 45 * 60 * 1000, // 45 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 20 * 60 * 1000, // Refresh every 20 minutes
  });

  // Specific tracking methods for common application events
  const analytics = {
    // Core user actions
    assessmentStarted: (step?: string) => 
      trackEvent("assessment_started", {
        category: "user_action",
        eventData: { step },
      }),
    
    assessmentCompleted: (duration?: number, score?: number) =>
      trackEvent("assessment_completed", {
        category: "user_action",
        eventData: { duration, score },
      }),
    
    assessmentStepCompleted: (step: string, data?: Record<string, any>) =>
      trackEvent("assessment_step_completed", {
        category: "form_interaction",
        eventData: { step, ...data },
      }),

    // Dashboard interactions
    dashboardViewed: () => trackPageView("dashboard"),
    
    // Health Simulator
    simulatorUsed: (simulationType: string, parameters?: Record<string, any>) =>
      trackEvent("simulator_used", {
        category: "feature_usage",
        eventData: { simulationType, parameters },
      }),
    
    // Recommendations
    recommendationViewed: (recommendationId: string) =>
      trackEvent("recommendation_viewed", {
        category: "feature_usage",
        eventData: { recommendationId },
      }),
    
    recommendationActioned: (recommendationId: string, action: string) =>
      trackEvent("recommendation_actioned", {
        category: "user_action",
        eventData: { recommendationId, action },
      }),

    // Wearable connections
    wearableConnected: (deviceType: string) =>
      trackEvent("wearable_connected", {
        category: "user_action",
        eventData: { deviceType },
      }),
    
    wearableDisconnected: (deviceType: string) =>
      trackEvent("wearable_disconnected", {
        category: "user_action",
        eventData: { deviceType },
      }),

    // Health AI interactions
    healthAiQueried: (queryType: string, query?: string) =>
      trackEvent("health_ai_queried", {
        category: "feature_usage",
        eventData: { queryType, queryLength: query?.length },
      }),

    // Error tracking
    errorOccurred: (errorType: string, errorMessage?: string, context?: string) =>
      trackEvent("error_occurred", {
        category: "error",
        eventData: { errorType, errorMessage, context },
      }),

    // General tracking methods
    trackEvent,
    trackPageView,
    trackFormInteraction,
    trackFeatureUsage,
  };

  return {
    ...analytics,
    isTracking: batchEventMutation.isPending,
    events: userEvents as AnalyticsEvent[],
    summary: analyticsSummary,
    isLoadingEvents,
    isLoadingSummary,
    // Expose flush method for manual batching control
    flushEvents: () => batcherRef.current?.flush(),
  };
}

// Hook for automatic page view tracking
export function usePageTracking(pageName: string, additionalData?: Record<string, any>) {
  const { trackPageView } = useAnalytics();
  
  useEffect(() => {
    trackPageView(pageName, additionalData);
  }, [trackPageView, pageName, additionalData]);
}