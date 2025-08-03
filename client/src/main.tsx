import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global handler for unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  // Ignore aborted requests - these are normal when React Query cancels requests
  if (event.reason && event.reason.name === "AbortError") {
    event.preventDefault();
    return;
  }
  
  // Ignore "signal is aborted without reason" errors
  if (event.reason && event.reason.message && 
      event.reason.message.includes("signal is aborted without reason")) {
    event.preventDefault();
    return;
  }
  
  // Let other errors bubble up
  console.error("Unhandled promise rejection:", event.reason);
});

createRoot(document.getElementById("root")!).render(<App />);
