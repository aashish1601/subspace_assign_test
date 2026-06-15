import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const storedSession = localStorage.getItem("nhostSession");
  
  if (!storedSession) {
    // If not authenticated, redirect to login
    return <Navigate to="/" replace />;
  }

  // If authenticated, render the child components (e.g., Dashboard)
  return children;
}
