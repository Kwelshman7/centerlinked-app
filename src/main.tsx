import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initMonitoring } from "@/lib/monitoring";
import "./index.css";

// Before render, so errors thrown during the initial mount are captured too.
// Installs global handlers for window.onerror and unhandled promise rejections.
initMonitoring();

// Supabase may return OAuth tokens on Site URL (/) instead of /auth/callback.
if (
  window.location.hash.includes("access_token") &&
  window.location.pathname !== "/auth/callback"
) {
  window.location.replace(`/auth/callback${window.location.hash}`);
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}
