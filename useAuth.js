import { useEffect } from 'react';
import { useAuthStore } from '../store/useStore';
import { authAPI } from '../services/api';

export const useAuth = () => {
  const { user, isAuthenticated, setAuth, logout } = useAuthStore();

  useEffect(() => {
    if (!user && isAuthenticated) {
      authAPI.me().then((res) => setAuth(res.data, useAuthStore.getState().token))
        .catch(() => logout());
    }
  }, []);

  return { user, isAuthenticated, logout };
};
