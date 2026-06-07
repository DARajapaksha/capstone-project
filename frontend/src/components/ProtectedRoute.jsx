import { Navigate } from 'react-router-dom';

/**
 * Protects routes that require authentication.
 * Redirects unauthenticated users to /login.
 */
export const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/**
 * Public-only routes (login, register).
 * Redirects already-logged-in users to /student.
 */
export const PublicOnlyRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (token) {
    return <Navigate to="/student" replace />;
  }

  return children;
};
