import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};
