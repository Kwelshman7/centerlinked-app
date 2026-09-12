import { Navigate, useSearchParams } from "react-router-dom";

/** /signup stays as a bookmark and invite-email URL; the shareable form lives on /join. */
export default function Signup() {
  const [searchParams] = useSearchParams();
  const email = (searchParams.get("email") || "").trim();
  const next = email ? `/join?email=${encodeURIComponent(email)}` : "/join";
  return <Navigate to={next} replace />;
}
