import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

// Custom error class for API errors
class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown,
    message?: string
  ) {
    super(message || `${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

// Network timeout error
class NetworkTimeoutError extends Error {
  constructor(message = "Request timed out") {
    super(message);
    this.name = "NetworkTimeoutError";
  }
}

// Enhanced error throwing with detailed error information
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorData: unknown;
    let errorMessage = res.statusText;
    
    try {
      const text = await res.text();
      if (text) {
        try {
          errorData = JSON.parse(text);
          errorMessage = (errorData as { message?: string })?.message || text;
        } catch {
          errorMessage = text;
        }
      }
    } catch {
      // If we can't read the response body, use status text
    }
    
    throw new ApiError(res.status, res.statusText, errorData, errorMessage);
  }
}

// Enhanced error handler with user-friendly messages
function handleApiError(error: unknown, context: "query" | "mutation" = "query"): void {
  // Skip logging and toasts for aborted requests
  if (error instanceof DOMException && error.name === "AbortError") {
    return;
  }
  
  console.error(`API ${context} error:`, error);
  
  // Don't show toasts for authentication errors in queries (handled by auth system)
  if (error instanceof ApiError && error.status === 401 && context === "query") {
    return;
  }
  
  let title = "Something went wrong";
  let description = "Please try again in a few moments.";
  let variant: "default" | "destructive" = "destructive";
  
  if (error instanceof NetworkTimeoutError) {
    title = "Connection timeout";
    description = "The request took too long. Please check your internet connection and try again.";
  } else if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        title = "Invalid request";
        description = error.data ? 
          (typeof error.data === 'string' ? error.data : "Please check your input and try again.") :
          "Please check your input and try again.";
        break;
      case 401:
        title = "Authentication required";
        description = "Please sign in to continue.";
        break;
      case 403:
        title = "Access denied";
        description = "You don't have permission to perform this action.";
        break;
      case 404:
        title = "Not found";
        description = "The requested information could not be found.";
        break;
      case 409:
        title = "Data conflict";
        description = "This information already exists or conflicts with existing data.";
        break;
      case 422:
        title = "Validation error";
        description = error.data ? 
          (typeof error.data === 'string' ? error.data : "Please check your input and try again.") :
          "Please check your input and try again.";
        break;
      case 429:
        title = "Too many requests";
        description = "You're making requests too quickly. Please wait a moment and try again.";
        break;
      case 500:
        title = "Server error";
        description = "Our servers are experiencing issues. Please try again later.";
        break;
      case 502:
      case 503:
      case 504:
        title = "Service unavailable";
        description = "The service is temporarily unavailable. Please try again in a few minutes.";
        break;
      default:
        title = `Error ${error.status}`;
        description = error.message || "An unexpected error occurred.";
    }
  } else if (error instanceof TypeError && error.message.includes("fetch")) {
    title = "Network error";
    description = "Unable to connect to the server. Please check your internet connection.";
  } else if (error instanceof Error) {
    title = "Unexpected error";
    description = error.message || "Something unexpected happened.";
  }
  
  toast({
    title,
    description,
    variant,
  });
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof DOMException && error.name === "AbortError") {
      const timeoutError = new NetworkTimeoutError();
      handleApiError(timeoutError, "mutation");
      throw timeoutError;
    }
    
    if (error instanceof ApiError) {
      handleApiError(error, "mutation");
    } else {
      handleApiError(error, "mutation");
    }
    
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, signal }) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    // Use the provided signal or our timeout controller
    const effectiveSignal = signal || controller.signal;
    
    try {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
        signal: effectiveSignal,
      });

      clearTimeout(timeoutId);

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof DOMException && error.name === "AbortError") {
        // Don't show any errors for aborted queries - this is normal React Query behavior
        throw error;
      }
      
      if (error instanceof ApiError) {
        handleApiError(error, "query");
      } else {
        handleApiError(error, "query");
      }
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: (failureCount, error) => {
        // Don't retry on aborted requests
        if (error instanceof DOMException && error.name === "AbortError") {
          return false;
        }
        // Don't retry on auth errors or client errors (4xx)
        if (error instanceof ApiError && (error.status === 401 || error.status < 500)) {
          return false;
        }
        // Don't retry on network timeouts
        if (error instanceof NetworkTimeoutError) {
          return false;
        }
        // Retry up to 2 times for server errors (5xx) or network errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on auth errors or client errors (4xx)
        if (error instanceof ApiError && (error.status === 401 || error.status < 500)) {
          return false;
        }
        // Don't retry on network timeouts for mutations
        if (error instanceof NetworkTimeoutError) {
          return false;
        }
        // Only retry once for server errors on mutations
        return failureCount < 1;
      },
      retryDelay: () => 1000, // Fixed 1 second delay for mutations
    },
  },
});

// Export error classes for use in components
export { ApiError, NetworkTimeoutError };
