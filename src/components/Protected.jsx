
import { Navigate } from "react-router-dom";
import authService from "../services/authService";   // ✅ default import

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();   // ✅ correct name

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
