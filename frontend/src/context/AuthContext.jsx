import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      const storedUser = authService.getCurrentUser();

      if (token && storedUser) {
        setUser(storedUser);
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  // ✅ Add unauthorized event listener
  useEffect(() => {
    const handleUnauthorized = () => {
      console.log('🔄 Unauthorized event received - clearing session');
      setUser(null);
      // Don't auto-redirect here, let the component decide
      // But we want to redirect to login for non-public routes
      const publicRoutes = ['/login', '/register', '/'];
      const currentPath = window.location.pathname;
      
      if (!publicRoutes.includes(currentPath) && !currentPath.startsWith('/admin')) {
        // Only redirect if not already on a public route
        window.location.href = '/login';
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // ✅ Add keep-alive ping for admin users
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    
    // Ping the server every 4 minutes to keep session alive
    const keepAlive = setInterval(async () => {
      try {
        await api.get('/api/auth/me');
        console.log('💓 Session keep-alive ping successful');
      } catch (error) {
        console.log('💀 Session expired, clearing...');
        if (error.response?.status === 401) {
          clearInterval(keepAlive);
          setUser(null);
          window.location.href = '/login';
        }
      }
    }, 4 * 60 * 1000); // Every 4 minutes
    
    return () => clearInterval(keepAlive);
  }, [user]);

  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials);
      if (response.success) {
        setUser(response.data.user);
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      
      if (response.success) {
        setUser(response.data.user);
      }
      return response;
    } catch (error) {
      throw error;
    }
  };

  const handleGoogleCallback = async (token, message) => {
    try {
      // Store the token
      localStorage.setItem('token', token);
      
      // Fetch user data with the token
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const userData = data.data;
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        // Show success message if provided
        if (message) {
          console.log(message);
        }
      }
    } catch (error) {
      console.error('Error handling Google callback:', error);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // ✅ Add updateUser function
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    handleGoogleCallback,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;