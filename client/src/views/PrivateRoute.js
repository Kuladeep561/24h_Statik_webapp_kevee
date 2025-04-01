import React from "react";
import { Navigate } from "react-router-dom";
import useIsAuthenticated from "react-auth-kit/hooks/useIsAuthenticated";

const PrivateRoute = ({ element = null }) => {
  const isAuthenticated = useIsAuthenticated();

  return isAuthenticated ? element : <Navigate to="/login-page" replace />;
};

export default PrivateRoute;
