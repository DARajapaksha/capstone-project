import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase';

// Spinner shown while Firebase resolves auth state
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F3F6FF]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 rounded-full border-4 border-[#5D5FEF] border-t-transparent animate-spin" />
      <p className="text-sm font-medium text-gray-400">Loading...</p>
    </div>
  </div>
);

/**
 * Protects routes that require authentication.
 * Redirects unauthenticated users to /login.
 */
export const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(undefined); // undefined = still loading

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser); // null = logged out, object = logged in
    });
    return unsubscribe;
  }, []);

  if (user === undefined) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

/**
 * Public-only routes (login, register).
 * Redirects already-logged-in users to /student.
 */
export const PublicOnlyRoute = ({ children }) => {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return unsubscribe;
  }, []);

  if (user === undefined) return <LoadingSpinner />;
  if (user) return <Navigate to="/student" replace />;
  return children;
};
