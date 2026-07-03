import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Supabase may return OAuth tokens on Site URL (/) instead of /auth/callback.
if (
  window.location.hash.includes("access_token") &&
  window.location.pathname !== "/auth/callback"
) {
  window.location.replace(`/auth/callback${window.location.hash}`);
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}
