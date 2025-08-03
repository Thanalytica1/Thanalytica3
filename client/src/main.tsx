import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global handler for unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  // Ignore all abort-related errors - these are normal when React Query cancels requests
  if (event.reason && (
    event.reason.name === "AbortError" ||
    (event.reason.message && (
      event.reason.message.includes("signal is aborted") ||
      event.reason.message.includes("aborted") ||
      event.reason.message.includes("The operation was aborted")
    ))
  )) {
    event.preventDefault();
    return;
  }
  
  // Also check for DOMException abort errors
  if (event.reason instanceof DOMException && event.reason.name === "AbortError") {
    event.preventDefault();
    return;
  }
  
  // Let other errors bubble up
  console.error("Unhandled promise rejection:", event.reason);
});

createRoot(document.getElementById("root")!).render(<App />);
