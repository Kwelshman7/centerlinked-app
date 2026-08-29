import { Navigate } from "react-router-dom";

/** Old marketing URL. Sign-up is the onboarding path; approval happens after. */
export default function RequestAccess() {
  return <Navigate to="/signup" replace />;
}
